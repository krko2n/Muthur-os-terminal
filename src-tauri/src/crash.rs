use std::fs;
use std::path::PathBuf;
use chrono::Local;

pub fn init_crash_handler() {
    std::panic::set_hook(Box::new(|panic_info| {
        let crash_dir = get_crash_dir();
        if let Err(e) = fs::create_dir_all(&crash_dir) {
            eprintln!("Failed to create crash directory: {}", e);
            return;
        }

        let timestamp = Local::now().format("%Y%m%d_%H%M%S");
        let crash_file = crash_dir.join(format!("crash_{}.log", timestamp));

        let crash_msg = format!(
            "MUTHUR OS TERMINAL CRASH REPORT\n\
             ================================\n\
             Time: {}\n\
             Thread: {:?}\n\
             \n\
             Panic Info:\n\
             {}\n\
             \n\
             Backtrace:\n\
             {:?}\n\
             \n\
             ================================\n\
             To report this crash:\n\
             ./report-error.sh runtime {:?}\n\
             \n\
             Or manually: https://github.com/krko2n/Muthur-os-terminal/issues/new\n",
            Local::now().format("%Y-%m-%d %H:%M:%S"),
            std::thread::current().name(),
            panic_info,
            std::backtrace::Backtrace::capture(),
            crash_file
        );

        if let Err(e) = fs::write(&crash_file, &crash_msg) {
            eprintln!("Failed to write crash log: {}", e);
        } else {
            eprintln!("Crash report written to: {:?}", crash_file);
            eprintln!("\nTo report this crash automatically:");
            eprintln!("  cd muthur-os-terminal");
            eprintln!("  ./report-error.sh runtime {:?}", crash_file);
        }

        eprintln!("{}", crash_msg);
    }));
}

fn get_crash_dir() -> PathBuf {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .unwrap_or_else(|_| ".".to_string());

    PathBuf::from(home)
        .join(".config")
        .join("xKOR_3RR0R")
        .join("crash_reports")
}
