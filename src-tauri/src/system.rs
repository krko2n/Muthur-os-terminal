use serde::{Deserialize, Serialize};
use sysinfo::{System, Networks, Disks, Pid};

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
}

impl SystemMonitor {
    pub fn new() -> Self {
        SystemMonitor {
            system: System::new_all(),
        }
    }

    pub fn get_stats(&self) -> SystemStats {
        let mut sys = System::new_all();
        sys.refresh_all();

        // CPU usage - sysinfo 0.39: global_cpu_usage() returns f32 directly
        let cpu_usage = sys.global_cpu_usage();

        // Memory
        let memory_used = sys.used_memory();
        let memory_total = sys.total_memory();
        let memory_percent = (memory_used as f32 / memory_total as f32) * 100.0;

        // Top processes - sysinfo 0.39: Pid is numeric type, name() returns &OsStr
        let mut processes: Vec<ProcessInfo> = sys.processes()
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

        // Network - sysinfo 0.39: Must create Networks separately
        let networks = Networks::new_with_refreshed_list();
        let mut total_received = 0;
        let mut total_transmitted = 0;
        for (_interface_name, data) in &networks {
            total_received += data.received();
            total_transmitted += data.transmitted();
        }

        // Disks - sysinfo 0.39: Must create Disks separately
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
            uptime: System::uptime().unwrap_or(0),  // sysinfo 0.39: returns Option<u64>
        }
    }
}
