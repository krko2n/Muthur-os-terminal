// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ai;
mod ascii_image;
mod browser;
mod crash;
mod pty;
mod system;

use ai::OllamaClient;
use pty::{PtyManager, SessionId};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use system::SystemMonitor;
use tauri::{Manager, State, Window};

const OFFLINE_PACK_VERSION: &str = "2026.06.20.1";

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
        pty.get_writer(&sid)
            .ok_or_else(|| "Session not found".to_string())?
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

fn offline_pack_dir() -> PathBuf {
    if let Ok(path) = std::env::var("MUTHUR_OFFLINE_DIR") {
        return PathBuf::from(path);
    }

    if let Ok(path) = std::env::var("XDG_DATA_HOME") {
        return PathBuf::from(path).join("muthur").join("offline");
    }

    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."))
        .join(".local")
        .join("share")
        .join("muthur")
        .join("offline")
}

fn path_size(path: &Path) -> u64 {
    let Ok(metadata) = std::fs::metadata(path) else {
        return 0;
    };

    if metadata.is_file() {
        return metadata.len();
    }

    let Ok(entries) = std::fs::read_dir(path) else {
        return 0;
    };

    entries
        .flatten()
        .map(|entry| path_size(&entry.path()))
        .sum()
}

fn modified_epoch(path: &Path) -> Option<u64> {
    std::fs::metadata(path)
        .ok()
        .and_then(|metadata| metadata.modified().ok())
        .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|duration| duration.as_secs())
}

fn read_json_file(path: &Path) -> serde_json::Value {
    std::fs::read_to_string(path)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_else(|| serde_json::json!({}))
}

fn sqlite3_query(path: &Path, query: &str) -> Option<String> {
    let output = std::process::Command::new("sqlite3")
        .arg("-readonly")
        .arg(path)
        .arg(query)
        .output()
        .ok()?;

    if output.status.success() {
        Some(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        None
    }
}

fn read_mbtiles_metadata(path: &Path) -> serde_json::Value {
    let mut metadata = serde_json::Map::new();

    if let Some(raw) = sqlite3_query(path, "select name || '=' || value from metadata;") {
        for line in raw.lines() {
            if let Some((name, value)) = line.split_once('=') {
                metadata.insert(name.to_string(), serde_json::json!(value));
            }
        }
    }

    let tile_count = sqlite3_query(path, "select count(1) from tiles;")
        .and_then(|value| value.parse::<u64>().ok());
    let zoom_range = sqlite3_query(
        path,
        "select min(zoom_level) || ':' || max(zoom_level) from tiles;",
    )
    .unwrap_or_default();

    serde_json::json!({
        "metadata": metadata,
        "tileCount": tile_count,
        "zoomRange": zoom_range,
        "metadataReadable": !metadata.is_empty() || tile_count.is_some()
    })
}

fn collect_mbtiles(path: &Path, results: &mut Vec<serde_json::Value>) {
    let Ok(entries) = std::fs::read_dir(path) else {
        return;
    };

    for entry in entries.flatten() {
        let entry_path = entry.path();
        if entry_path.is_dir() {
            collect_mbtiles(&entry_path, results);
            continue;
        }

        let is_mbtiles = entry_path
            .extension()
            .and_then(|extension| extension.to_str())
            .map(|extension| extension.eq_ignore_ascii_case("mbtiles"))
            .unwrap_or(false);

        if !is_mbtiles {
            continue;
        }

        let metadata = read_mbtiles_metadata(&entry_path);
        results.push(serde_json::json!({
            "name": entry_path.file_name().and_then(|name| name.to_str()).unwrap_or("map.mbtiles"),
            "path": entry_path.to_string_lossy(),
            "sizeBytes": std::fs::metadata(&entry_path).map(|metadata| metadata.len()).unwrap_or(0),
            "modified": modified_epoch(&entry_path),
            "metadata": metadata
        }));
    }
}

fn has_file_extension(path: &Path, extensions: &[&str], depth: usize) -> bool {
    if depth > 5 {
        return false;
    }

    let Ok(entries) = std::fs::read_dir(path) else {
        return false;
    };

    for entry in entries.flatten() {
        let entry_path = entry.path();
        if entry_path.is_dir() && has_file_extension(&entry_path, extensions, depth + 1) {
            return true;
        }

        if entry_path
            .extension()
            .and_then(|extension| extension.to_str())
            .map(|extension| {
                extensions
                    .iter()
                    .any(|allowed| extension.eq_ignore_ascii_case(allowed))
            })
            .unwrap_or(false)
        {
            return true;
        }
    }

    false
}

#[tauri::command]
async fn get_offline_pack_status() -> Result<serde_json::Value, String> {
    let pack_dir = offline_pack_dir();
    let manifest_path = pack_dir.join("manifest.json");
    let manifest = read_json_file(&manifest_path);
    let exists = pack_dir.exists();
    let version = manifest
        .get("version")
        .and_then(|value| value.as_str())
        .unwrap_or("");
    let status = if !manifest_path.exists() {
        "missing"
    } else if version == OFFLINE_PACK_VERSION {
        "current"
    } else {
        "stale"
    };

    let mut maps = Vec::new();
    let maps_dir = pack_dir.join("maps");
    if maps_dir.exists() {
        collect_mbtiles(&maps_dir, &mut maps);
    }
    let wiki_dir = pack_dir.join("wiki");
    let docs_dir = pack_dir.join("docs");
    let wiki_available = manifest
        .get("wiki")
        .and_then(|value| value.as_bool())
        .unwrap_or(false)
        || has_file_extension(&wiki_dir, &["zim", "jsonl", "json", "md", "txt"], 0);
    let docs_available = manifest
        .get("docs")
        .and_then(|value| value.as_bool())
        .unwrap_or(false)
        || has_file_extension(&docs_dir, &["md", "txt", "pdf"], 0);

    Ok(serde_json::json!({
        "exists": exists,
        "path": pack_dir.to_string_lossy(),
        "manifestPath": manifest_path.to_string_lossy(),
        "status": status,
        "currentVersion": OFFLINE_PACK_VERSION,
        "version": version,
        "updatedAt": manifest.get("updatedAt").cloned().unwrap_or(serde_json::Value::Null),
        "sizeBytes": if exists { path_size(&pack_dir) } else { 0 },
        "modules": {
            "ai": manifest.get("ai").and_then(|value| value.as_bool()).unwrap_or(false),
            "wiki": wiki_available,
            "maps": manifest.get("maps").and_then(|value| value.as_bool()).unwrap_or(false),
            "docs": docs_available
        },
        "aiModel": manifest.get("aiModel").and_then(|value| value.as_str()).unwrap_or("llama3.2"),
        "wikiPack": manifest.get("wikiPack").and_then(|value| value.as_str()).unwrap_or("wikipedia_en_simple_all"),
        "mapRegion": manifest.get("mapRegion").and_then(|value| value.as_str()).unwrap_or("world-low"),
        "maps": maps
    }))
}

#[tauri::command]
async fn ai_suggest_command(
    state: State<'_, AppState>,
    context: String,
    error: Option<String>,
) -> Result<String, String> {
    let response = state
        .ollama_client
        .suggest_command(&context, error.as_deref())
        .await
        .map_err(|e| e.to_string())?;
    Ok(response)
}

#[tauri::command]
async fn ai_chat(state: State<'_, AppState>, message: String) -> Result<String, String> {
    let offline_context = ai::build_offline_wiki_context(&message, 5);
    let response = state
        .ollama_client
        .chat(&message, offline_context.as_deref())
        .await
        .map_err(|e| e.to_string())?;
    Ok(response)
}

#[tauri::command]
async fn search_offline_wiki(query: String) -> Result<Vec<ai::OfflineWikiHit>, String> {
    Ok(ai::search_offline_wiki(&query, 8))
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
        return Err(format!(
            "HTTP {}: {}",
            status.as_u16(),
            status.canonical_reason().unwrap_or("Unknown")
        ));
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
        return Err(format!(
            "HTTP {}: {}",
            status.as_u16(),
            status.canonical_reason().unwrap_or("Unknown")
        ));
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
async fn get_hardware_info() -> Result<serde_json::Value, String> {
    let read_dmi = |field: &str| -> String {
        std::fs::read_to_string(format!("/sys/devices/virtual/dmi/id/{}", field))
            .unwrap_or_default()
            .trim()
            .to_string()
    };

    let manufacturer = read_dmi("sys_vendor");
    let model = read_dmi("product_name");
    let chassis = read_dmi("chassis_type");

    let chassis_name = match chassis.as_str() {
        "1" => "Other",
        "2" => "Unknown",
        "3" => "Desktop",
        "4" => "Low Profile Desktop",
        "5" => "Pizza Box",
        "6" => "Mini Tower",
        "7" => "Tower",
        "8" => "Portable",
        "9" => "Laptop",
        "10" => "Notebook",
        "11" => "Hand Held",
        "12" => "Docking Station",
        "13" => "All in One",
        "14" => "Sub Notebook",
        "15" => "Space-saving",
        "16" => "Lunch Box",
        "17" => "Main Server Chassis",
        "24" => "Sealed-case PC",
        "30" => "Tablet",
        "31" => "Convertible",
        "32" => "Detachable",
        _ => &chassis,
    };

    Ok(serde_json::json!({
        "manufacturer": if manufacturer.is_empty() { "Unknown".to_string() } else { manufacturer },
        "model": if model.is_empty() { "Unknown".to_string() } else { model },
        "chassis": chassis_name,
    }))
}

#[tauri::command]
async fn get_network_connections() -> Result<Vec<serde_json::Value>, String> {
    let output = std::process::Command::new("ss")
        .args(["-tun", "--no-header"])
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut connections = Vec::new();

    for line in stdout.lines() {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 5 && parts[0] == "ESTAB" {
            let peer = parts[4];
            if let Some(ip) = peer.rsplit(':').nth(1) {
                let ip_clean = ip.trim_start_matches('[').trim_end_matches(']');
                if !ip_clean.starts_with("127.")
                    && !ip_clean.starts_with("::1")
                    && !ip_clean.starts_with("0.0.0.0")
                    && !ip_clean.is_empty()
                {
                    connections.push(serde_json::json!({
                        "ip": ip_clean,
                        "port": peer.rsplit(':').next().unwrap_or("0"),
                        "state": "ESTABLISHED"
                    }));
                }
            }
        }
    }

    connections.truncate(50);
    Ok(connections)
}

#[tauri::command]
async fn open_file_external(path: String) -> Result<(), String> {
    let editor = detect_editor().await;
    let terminals = [
        "konsole",
        "gnome-terminal",
        "xfce4-terminal",
        "alacritty",
        "xterm",
    ];
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
                if lower == "script" {
                    in_script = true;
                } else if lower == "/script" {
                    in_script = false;
                } else if lower == "style" {
                    in_style = true;
                } else if lower == "/style" {
                    in_style = false;
                } else if lower == "br"
                    || lower == "br/"
                    || lower == "p"
                    || lower == "/p"
                    || lower == "div"
                    || lower == "/div"
                    || lower == "li"
                    || lower == "h1"
                    || lower == "h2"
                    || lower == "h3"
                    || lower == "h4"
                    || lower == "h5"
                    || lower == "h6"
                    || lower == "tr"
                    || lower == "/tr"
                {
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
            get_offline_pack_status,
            list_directory,
            ai_suggest_command,
            ai_chat,
            search_offline_wiki,
            get_current_dir,
            fetch_json,
            fetch_url,
            fetch_url_structured,
            render_image_ascii,
            detect_editor,
            open_file_external,
            get_hardware_info,
            get_network_connections,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
