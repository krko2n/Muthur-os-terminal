use serde::{Deserialize, Serialize};
use std::sync::{Arc, RwLock};
use std::time::Duration;
use sysinfo::{Disks, Networks, System};

#[cfg(target_os = "linux")]
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatteryInfo {
    pub present: bool,
    pub percent: u8,
    pub charging: bool,
    pub time_remaining: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub cpu_usage: f32,
    pub memory: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct NetworkStats {
    pub received: u64,
    pub transmitted: u64,
    pub rx_speed: u64,
    pub tx_speed: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskInfo {
    pub name: String,
    pub mount_point: String,
    pub total: u64,
    pub available: u64,
    pub used_percent: f32,
}

pub struct SystemMonitor {
    stats: Arc<RwLock<SystemStats>>,
}

impl SystemMonitor {
    pub fn new() -> Self {
        let stats = Arc::new(RwLock::new(SystemStats::default()));
        let stats_clone = stats.clone();

        std::thread::spawn(move || {
            let mut sys = System::new_all();
            sys.refresh_all();
            std::thread::sleep(Duration::from_millis(200));
            sys.refresh_all();
            let mut networks = Networks::new_with_refreshed_list();
            let mut total_received: u64 = 0;
            let mut total_transmitted: u64 = 0;

            loop {
                sys.refresh_all();
                networks.refresh(false);

                let cpu_usage = sys.global_cpu_usage();
                let memory_used = sys.used_memory();
                let memory_total = sys.total_memory();
                let memory_percent = (memory_used as f32 / memory_total as f32) * 100.0;

                let mut processes: Vec<ProcessInfo> = sys
                    .processes()
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
                for (_interface_name, data) in &networks {
                    rx_delta += data.received();
                    tx_delta += data.transmitted();
                }
                total_received += rx_delta;
                total_transmitted += tx_delta;

                let disks_list = Disks::new_with_refreshed_list();
                let disk: Vec<DiskInfo> = disks_list
                    .iter()
                    .map(|d| {
                        let total = d.total_space();
                        let available = d.available_space();
                        let used = total - available;
                        let used_percent = (used as f32 / total as f32) * 100.0;
                        DiskInfo {
                            name: d.name().to_string_lossy().to_string(),
                            mount_point: d.mount_point().to_string_lossy().to_string(),
                            total,
                            available,
                            used_percent,
                        }
                    })
                    .collect();

                let new_stats = SystemStats {
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
                    disk,
                    uptime: System::uptime(),
                    battery: Self::get_battery_info(),
                };

                if let Ok(mut stats) = stats_clone.write() {
                    *stats = new_stats;
                }

                std::thread::sleep(Duration::from_secs(3));
            }
        });

        SystemMonitor { stats }
    }

    pub fn get_stats(&self) -> SystemStats {
        self.stats.read().map(|s| s.clone()).unwrap_or_default()
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
