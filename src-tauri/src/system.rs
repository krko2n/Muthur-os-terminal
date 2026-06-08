use serde::{Deserialize, Serialize};
use sysinfo::{System, Networks, Disks};

#[cfg(target_os = "linux")]
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
pub struct BatteryInfo {
    pub present: bool,
    pub percent: u8,
    pub charging: bool,
    pub time_remaining: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemStats {
    pub cpu_usage: f32,
    pub memory_used: u64,
    pub memory_total: u64,
    pub memory_percent: f32,
    pub processes: Vec<ProcessInfo>,
    pub network: NetworkStats,
    pub disk: Vec<DiskInfo>,
    pub uptime: u64,
    pub battery: Option<BatteryInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub cpu_usage: f32,
    pub memory: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NetworkStats {
    pub received: u64,
    pub transmitted: u64,
    pub rx_speed: u64,
    pub tx_speed: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiskInfo {
    pub name: String,
    pub mount_point: String,
    pub total: u64,
    pub available: u64,
    pub used_percent: f32,
}

pub struct SystemMonitor {
    system: System,
    networks: Networks,
    total_received: u64,
    total_transmitted: u64,
}

impl SystemMonitor {
    pub fn new() -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();
        std::thread::sleep(std::time::Duration::from_millis(200));
        sys.refresh_all();
        let networks = Networks::new_with_refreshed_list();
        SystemMonitor {
            system: sys,
            networks,
            total_received: 0,
            total_transmitted: 0,
        }
    }

    pub fn get_stats(&mut self) -> SystemStats {
        self.system.refresh_all();
        self.networks.refresh(false);

        let cpu_usage = self.system.global_cpu_usage();

        let memory_used = self.system.used_memory();
        let memory_total = self.system.total_memory();
        let memory_percent = (memory_used as f32 / memory_total as f32) * 100.0;

        let mut processes: Vec<ProcessInfo> = self.system.processes()
            .iter()
            .map(|(pid, process)| ProcessInfo {
                pid: pid.as_u32(),
                name: process.name().to_string_lossy().to_string(),
                cpu_usage: process.cpu_usage(),
                memory: process.memory(),
            })
            .collect();

        processes.sort_by(|a, b| b.cpu_usage.partial_cmp(&a.cpu_usage).unwrap());
        processes.truncate(10);

        let mut rx_delta = 0;
        let mut tx_delta = 0;
        for (_interface_name, data) in &self.networks {
            rx_delta += data.received();
            tx_delta += data.transmitted();
        }
        self.total_received += rx_delta;
        self.total_transmitted += tx_delta;

        let total_received = self.total_received;
        let total_transmitted = self.total_transmitted;

        let disks_list = Disks::new_with_refreshed_list();
        let disks: Vec<DiskInfo> = disks_list
            .iter()
            .map(|disk| {
                let total = disk.total_space();
                let available = disk.available_space();
                let used = total - available;
                let used_percent = (used as f32 / total as f32) * 100.0;

                DiskInfo {
                    name: disk.name().to_string_lossy().to_string(),
                    mount_point: disk.mount_point().to_string_lossy().to_string(),
                    total,
                    available,
                    used_percent,
                }
            })
            .collect();

        SystemStats {
            cpu_usage,
            memory_used,
            memory_total,
            memory_percent,
            processes,
            network: NetworkStats {
                received: total_received,
                transmitted: total_transmitted,
                rx_speed: rx_delta,
                tx_speed: tx_delta,
            },
            disk: disks,
            uptime: System::uptime(),
            battery: Self::get_battery_info(),
        }
    }

    #[cfg(target_os = "linux")]
    fn get_battery_info() -> Option<BatteryInfo> {
        let base = "/sys/class/power_supply/BAT0";
        if !std::path::Path::new(base).exists() {
            let base1 = "/sys/class/power_supply/BAT1";
            if !std::path::Path::new(base1).exists() {
                return None;
            }
            return Self::read_battery(base1);
        }
        Self::read_battery(base)
    }

    #[cfg(target_os = "linux")]
    fn read_battery(base: &str) -> Option<BatteryInfo> {
        let capacity = fs::read_to_string(format!("{}/capacity", base))
            .ok()?
            .trim()
            .parse::<u8>()
            .ok()?;

        let status = fs::read_to_string(format!("{}/status", base))
            .unwrap_or_default()
            .trim()
            .to_string();

        let charging = status == "Charging" || status == "Full";

        Some(BatteryInfo {
            present: true,
            percent: capacity,
            charging,
            time_remaining: None,
        })
    }

    #[cfg(target_os = "windows")]
    fn get_battery_info() -> Option<BatteryInfo> {
        use std::process::Command;
        let output = Command::new("powershell")
            .args(["-NoProfile", "-Command",
                "Get-CimInstance Win32_Battery | Select-Object -First 1 | ForEach-Object { \"$($_.EstimatedChargeRemaining),$($_.BatteryStatus)\" }"])
            .output()
            .ok()?;
        let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if text.is_empty() {
            return None;
        }
        let parts: Vec<&str> = text.split(',').collect();
        if parts.len() < 2 {
            return None;
        }
        let percent = parts[0].parse::<u8>().ok()?;
        let status = parts[1].parse::<u32>().unwrap_or(1);
        let charging = status == 2 || status == 6 || status == 7 || status == 8 || status == 9;
        Some(BatteryInfo {
            present: true,
            percent,
            charging,
            time_remaining: None,
        })
    }

    #[cfg(not(any(target_os = "linux", target_os = "windows")))]
    fn get_battery_info() -> Option<BatteryInfo> {
        None
    }
}
