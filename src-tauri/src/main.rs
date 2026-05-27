// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod pty;
mod system;
mod crash;
mod ai;

use tauri::{Manager, State, Window};
use std::sync::{Arc, Mutex};
use pty::{PtyManager, SessionId};
use system::SystemMonitor;
use ai::OllamaClient;

pub struct AppState {
    pty_manager: Arc<Mutex<PtyManager>>,
    system_monitor: Arc<Mutex<SystemMonitor>>,
    ollama_client: Arc<OllamaClient>,
}

#[tauri::command]
async fn create_terminal_session(
    state: State<'_, AppState>,
    window: Window,
) -> Result<String, String> {
    let mut pty = state.pty_manager.lock().map_err(|e| e.to_string())?;
    let session_id = pty.create_session(window).map_err(|e| e.to_string())?;
    Ok(session_id.to_string())
}

#[tauri::command]
async fn write_to_terminal(
    state: State<'_, AppState>,
    session_id: String,
    data: String,
) -> Result<(), String> {
    let mut pty = state.pty_manager.lock().map_err(|e| e.to_string())?;
    let sid = SessionId::from(session_id);
    pty.write(sid, data.as_bytes()).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn resize_terminal(
    state: State<'_, AppState>,
    session_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let mut pty = state.pty_manager.lock().map_err(|e| e.to_string())?;
    let sid = SessionId::from(session_id);
    pty.resize(sid, cols, rows).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn close_terminal_session(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<(), String> {
    let mut pty = state.pty_manager.lock().map_err(|e| e.to_string())?;
    let sid = SessionId::from(session_id);
    pty.close_session(sid).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn get_system_stats(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let monitor = state.system_monitor.lock().map_err(|e| e.to_string())?;
    let stats = monitor.get_stats();
    serde_json::to_value(stats).map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_directory(path: String) -> Result<Vec<serde_json::Value>, String> {
    use std::fs;
    let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            let metadata = entry.metadata().map_err(|e| e.to_string())?;
            results.push(serde_json::json!({
                "name": entry.file_name().to_string_lossy(),
                "path": entry.path().to_string_lossy(),
                "is_dir": metadata.is_dir(),
                "size": metadata.len(),
                "modified": metadata.modified().ok().and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok().map(|d| d.as_secs()))
            }));
        }
    }
    Ok(results)
}

#[tauri::command]
async fn ai_suggest_command(
    state: State<'_, AppState>,
    context: String,
    error: Option<String>,
) -> Result<String, String> {
    let response = state.ollama_client
        .suggest_command(&context, error.as_deref())
        .await
        .map_err(|e| e.to_string())?;
    Ok(response)
}

#[tauri::command]
async fn ai_chat(
    state: State<'_, AppState>,
    message: String,
) -> Result<String, String> {
    let response = state.ollama_client
        .chat(&message)
        .await
        .map_err(|e| e.to_string())?;
    Ok(response)
}

#[tauri::command]
async fn get_current_dir() -> Result<String, String> {
    std::env::current_dir()
        .map_err(|e| e.to_string())?
        .to_str()
        .ok_or_else(|| "Invalid UTF-8 in path".to_string())
        .map(|s| s.to_string())
}

fn main() {
    // Initialize crash handler
    crash::init_crash_handler();

    tauri::Builder::default()
        .setup(|app| {
            let pty_manager = Arc::new(Mutex::new(PtyManager::new()));
            let system_monitor = Arc::new(Mutex::new(SystemMonitor::new()));
            let ollama_client = Arc::new(OllamaClient::new("http://localhost:11434"));

            app.manage(AppState {
                pty_manager,
                system_monitor,
                ollama_client,
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_terminal_session,
            write_to_terminal,
            resize_terminal,
            close_terminal_session,
            get_system_stats,
            list_directory,
            ai_suggest_command,
            ai_chat,
            get_current_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
