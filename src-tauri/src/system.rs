use serde::{Deserialize, Serialize};
use sysinfo::{System, Networks, Disks};
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
}

impl SystemMonitor {
    pub fn new() -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();
        std::thread::sleep(std::time::Duration::from_millis(200));
        sys.refresh_all();
        SystemMonitor {
            system: sys,
            networks: Networks::new_with_refreshed_list(),
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

        let mut total_received = 0;
        let mut total_transmitted = 0;
        for (_interface_name, data) in &self.networks {
            total_received += data.received();
            total_transmitted += data.transmitted();
        }

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
            },
            disk: disks,
            uptime: System::uptime(),
            battery: Self::get_battery_info(),
        }
    }

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
}
