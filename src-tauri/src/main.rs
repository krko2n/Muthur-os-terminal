// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod pty;
mod system;
mod crash;
mod ai;
mod browser;
mod ascii_image;

use tauri::{Manager, State, Window};
use std::sync::{Arc, Mutex};
use std::io::Write;
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
    let sid = SessionId::from(session_id);
    // Get the per-session writer without holding the global lock during write
    let writer = {
        let pty = state.pty_manager.lock().map_err(|e| e.to_string())?;
        pty.get_writer(&sid).ok_or_else(|| "Session not found".to_string())?
    };
    let mut w = writer.lock().map_err(|e| e.to_string())?;
    w.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
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
    for entry in entries.flatten() {
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        results.push(serde_json::json!({
            "name": entry.file_name().to_string_lossy(),
            "path": entry.path().to_string_lossy(),
            "is_dir": metadata.is_dir(),
            "size": metadata.len(),
            "modified": metadata.modified().ok().and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok().map(|d| d.as_secs()))
        }));
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

#[tauri::command]
async fn fetch_json(url: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("MUTHUR/0.1")
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status().as_u16()));
    }

    response.text().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn fetch_url(url: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (X11; Linux x86_64) MUTHUR/0.1")
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        return Err(format!("HTTP {}: {}", status.as_u16(), status.canonical_reason().unwrap_or("Unknown")));
    }

    let body = response.text().await.map_err(|e| e.to_string())?;

    Ok(html_to_text(&body))
}

#[tauri::command]
async fn fetch_url_structured(url: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (X11; Linux x86_64) MUTHUR/0.1")
        .timeout(std::time::Duration::from_secs(15))
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let final_url = response.url().to_string();
    let status = response.status();
    if !status.is_success() {
        return Err(format!("HTTP {}: {}", status.as_u16(), status.canonical_reason().unwrap_or("Unknown")));
    }

    let body = response.text().await.map_err(|e| e.to_string())?;
    let doc = browser::parse_html(&body, &final_url);
    serde_json::to_value(doc).map_err(|e| e.to_string())
}

#[tauri::command]
async fn render_image_ascii(url: String) -> Result<String, String> {
    ascii_image::fetch_and_convert(&url).await
}

#[tauri::command]
async fn detect_editor() -> String {
    if let Ok(editor) = std::env::var("EDITOR") {
        if !editor.is_empty() {
            return editor;
        }
    }
    let candidates = ["micro", "nano", "vim", "vi"];
    for cmd in candidates {
        if std::process::Command::new("which")
            .arg(cmd)
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
        {
            return cmd.to_string();
        }
    }
    "nano".to_string()
}

#[tauri::command]
async fn open_file_external(path: String) -> Result<(), String> {
    let editor = detect_editor().await;
    let terminals = ["konsole", "gnome-terminal", "xfce4-terminal", "alacritty", "xterm"];
    let mut terminal_cmd = "xterm";

    for t in terminals {
        if std::process::Command::new("which")
            .arg(t)
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
        {
            terminal_cmd = t;
            break;
        }
    }

    let result = match terminal_cmd {
        "konsole" => std::process::Command::new("konsole")
            .arg("-e")
            .arg(&editor)
            .arg(&path)
            .spawn(),
        "gnome-terminal" => std::process::Command::new("gnome-terminal")
            .arg("--")
            .arg(&editor)
            .arg(&path)
            .spawn(),
        "alacritty" => std::process::Command::new("alacritty")
            .arg("-e")
            .arg(&editor)
            .arg(&path)
            .spawn(),
        _ => std::process::Command::new(terminal_cmd)
            .arg("-e")
            .arg(format!("{} \"{}\"", editor, path))
            .spawn(),
    };

    result.map(|_| ()).map_err(|e| e.to_string())
}

fn html_to_text(html: &str) -> String {
    let mut result = String::new();
    let mut in_tag = false;
    let mut in_script = false;
    let mut in_style = false;
    let mut tag_name = String::new();
    let mut collecting_tag = false;

    for ch in html.chars() {
        match ch {
            '<' => {
                in_tag = true;
                collecting_tag = true;
                tag_name.clear();
            }
            '>' => {
                in_tag = false;
                collecting_tag = false;
                let lower = tag_name.to_lowercase();
                if lower == "script" { in_script = true; }
                else if lower == "/script" { in_script = false; }
                else if lower == "style" { in_style = true; }
                else if lower == "/style" { in_style = false; }
                else if lower == "br" || lower == "br/" || lower == "p" || lower == "/p"
                    || lower == "div" || lower == "/div" || lower == "li"
                    || lower == "h1" || lower == "h2" || lower == "h3"
                    || lower == "h4" || lower == "h5" || lower == "h6"
                    || lower == "tr" || lower == "/tr" {
                    result.push('\n');
                } else if lower == "td" || lower == "th" {
                    result.push_str("  ");
                }
            }
            _ => {
                if in_tag {
                    if collecting_tag && ch != ' ' && ch != '/' {
                        tag_name.push(ch);
                    } else {
                        collecting_tag = false;
                    }
                } else if !in_script && !in_style {
                    result.push(ch);
                }
            }
        }
    }

    // Decode common HTML entities
    let result = result
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&nbsp;", " ");

    // Collapse excessive whitespace
    let mut cleaned = String::new();
    let mut prev_newline = false;
    for line in result.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            if !prev_newline {
                cleaned.push('\n');
                prev_newline = true;
            }
        } else {
            cleaned.push_str(trimmed);
            cleaned.push('\n');
            prev_newline = false;
        }
    }

    // Limit output size
    if cleaned.len() > 50000 {
        cleaned.truncate(50000);
        cleaned.push_str("\n\n[--- OUTPUT TRUNCATED ---]");
    }

    cleaned
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
            fetch_json,
            fetch_url,
            fetch_url_structured,
            render_image_ascii,
            detect_editor,
            open_file_external,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
