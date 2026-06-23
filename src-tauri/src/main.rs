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
use reqwest::header::LOCATION;
use std::io::Write;
use std::net::IpAddr;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use system::SystemMonitor;
use tauri::{Manager, State, Window};

const OFFLINE_PACK_VERSION: &str = "2026.06.20.1";
const MAX_FETCH_REDIRECTS: usize = 10;

pub struct AppState {
    pty_manager: Arc<Mutex<PtyManager>>,
    system_monitor: Arc<Mutex<SystemMonitor>>,
    ollama_client: Arc<OllamaClient>,
}

fn allow_private_fetch_targets() -> bool {
    env_flag("MUTHUR_ALLOW_PRIVATE_FETCH")
}

fn is_private_or_local_ip(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(addr) => {
            addr.is_private()
                || addr.is_loopback()
                || addr.is_link_local()
                || addr.is_unspecified()
                || addr.is_broadcast()
        }
        IpAddr::V6(addr) => {
            let first_segment = addr.segments()[0];
            let unique_local = (first_segment & 0xfe00) == 0xfc00;
            let link_local = (first_segment & 0xffc0) == 0xfe80;
            addr.is_loopback() || addr.is_unspecified() || unique_local || link_local
        }
    }
}

fn is_private_or_local_host(host: &str) -> bool {
    let host = host.trim_matches(['[', ']']).to_ascii_lowercase();
    if host == "localhost" || host.ends_with(".localhost") {
        return true;
    }

    host.parse::<IpAddr>()
        .map(is_private_or_local_ip)
        .unwrap_or(false)
}

fn validate_fetch_url(raw_url: &str) -> Result<reqwest::Url, String> {
    let trimmed = raw_url.trim();
    let parsed =
        reqwest::Url::parse(trimmed).map_err(|_| "URL must be absolute and valid".to_string())?;

    match parsed.scheme() {
        "http" | "https" => {}
        scheme => {
            return Err(format!(
                "Blocked URL scheme '{}'. Only http:// and https:// are allowed.",
                scheme
            ));
        }
    }

    let host = parsed
        .host_str()
        .ok_or_else(|| "URL must include a host".to_string())?;

    if !allow_private_fetch_targets() && is_private_or_local_host(host) {
        return Err(
            "Blocked local/private network target. Set MUTHUR_ALLOW_PRIVATE_FETCH=1 to allow it."
                .to_string(),
        );
    }

    Ok(parsed)
}

async fn ensure_public_resolved_target(url: &reqwest::Url) -> Result<(), String> {
    if allow_private_fetch_targets() {
        return Ok(());
    }

    let host = url
        .host_str()
        .ok_or_else(|| "URL must include a host".to_string())?;
    let port = url
        .port_or_known_default()
        .ok_or_else(|| "URL must use a known http/https port".to_string())?;
    let mut resolved = tokio::net::lookup_host((host, port))
        .await
        .map_err(|e| format!("Could not resolve URL host '{}': {}", host, e))?;

    let mut saw_address = false;
    for address in &mut resolved {
        saw_address = true;
        let ip = address.ip();
        if is_private_or_local_ip(ip) {
            return Err(format!(
                "Blocked hostname '{}' because it resolves to local/private address {}. Set MUTHUR_ALLOW_PRIVATE_FETCH=1 to allow it.",
                host, ip
            ));
        }
    }

    if !saw_address {
        return Err(format!(
            "Could not resolve URL host '{}': no addresses returned",
            host
        ));
    }

    Ok(())
}

async fn validate_fetch_url_resolved(raw_url: &str) -> Result<reqwest::Url, String> {
    let url = validate_fetch_url(raw_url)?;
    ensure_public_resolved_target(&url).await?;
    Ok(url)
}

fn guarded_http_client(timeout_secs: u64) -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0")
        .timeout(std::time::Duration::from_secs(timeout_secs))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|e| e.to_string())
}

fn validate_redirect_target(
    current_url: &reqwest::Url,
    location: &str,
) -> Result<reqwest::Url, String> {
    let joined = current_url
        .join(location)
        .map_err(|_| "Redirect target is not a valid URL".to_string())?;
    validate_fetch_url(joined.as_str())
}

async fn guarded_get(
    client: &reqwest::Client,
    initial_url: reqwest::Url,
) -> Result<reqwest::Response, String> {
    let mut url = initial_url;

    for _ in 0..=MAX_FETCH_REDIRECTS {
        ensure_public_resolved_target(&url).await?;
        let response = client
            .get(url.clone())
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_redirection() {
            return Ok(response);
        }

        let location = response
            .headers()
            .get(LOCATION)
            .ok_or_else(|| "Redirect response did not include a Location header".to_string())?
            .to_str()
            .map_err(|_| "Redirect Location header is not valid UTF-8".to_string())?;

        url = validate_redirect_target(&url, location)?;
    }

    Err("Too many redirects".to_string())
}

async fn guarded_get_bytes(
    client: &reqwest::Client,
    url: reqwest::Url,
    max_bytes: usize,
) -> Result<Vec<u8>, String> {
    let response = guarded_get(client, url).await?;
    if let Some(length) = response.content_length() {
        if length > max_bytes as u64 {
            return Err(format!("Response too large (>{} bytes)", max_bytes));
        }
    }

    let bytes = response.bytes().await.map_err(|e| e.to_string())?;
    if bytes.len() > max_bytes {
        return Err(format!("Response too large (>{} bytes)", max_bytes));
    }

    Ok(bytes.to_vec())
}

fn env_flag(name: &str) -> bool {
    std::env::var(name)
        .map(|value| {
            matches!(
                value.trim().to_ascii_lowercase().as_str(),
                "1" | "true" | "yes" | "on"
            )
        })
        .unwrap_or(false)
}

fn allowed_filesystem_roots() -> Vec<PathBuf> {
    let mut roots = Vec::new();

    if let Ok(home) = std::env::var("HOME").or_else(|_| std::env::var("USERPROFILE")) {
        roots.push(PathBuf::from(home));
    }

    if let Ok(current) = std::env::current_dir() {
        roots.push(current);
    }

    roots.push(offline_pack_dir());
    roots.push(PathBuf::from("/usr/share/muthur"));

    roots
        .into_iter()
        .filter_map(|root| root.canonicalize().ok())
        .collect()
}

fn validate_user_filesystem_path(raw_path: &str, require_dir: bool) -> Result<PathBuf, String> {
    let path = PathBuf::from(raw_path);
    let canonical = path
        .canonicalize()
        .map_err(|e| format!("Cannot access '{}': {}", raw_path, e))?;

    if require_dir && !canonical.is_dir() {
        return Err(format!("Not a directory: {}", canonical.to_string_lossy()));
    }

    if !env_flag("MUTHUR_ALLOW_FULL_FS") {
        let allowed = allowed_filesystem_roots();
        if !allowed.iter().any(|root| canonical.starts_with(root)) {
            return Err(format!(
                "Filesystem access is limited to your home, app, and offline-pack folders. Set MUTHUR_ALLOW_FULL_FS=1 to browse: {}",
                canonical.to_string_lossy()
            ));
        }
    }

    Ok(canonical)
}

fn is_hidden_file_name(name: &std::ffi::OsStr) -> bool {
    name.to_string_lossy().starts_with('.')
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
    let path = validate_user_filesystem_path(&path, true)?;
    let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;
    let show_hidden = env_flag("MUTHUR_SHOW_HIDDEN_FILES");

    let mut results = Vec::new();
    for entry in entries.flatten() {
        if !show_hidden && is_hidden_file_name(&entry.file_name()) {
            continue;
        }

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
async fn get_ai_status(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let online = state.ollama_client.is_available().await;
    Ok(serde_json::json!({
        "model": state.ollama_client.model_name(),
        "baseUrl": state.ollama_client.base_url(),
        "online": online,
        "offlineArchive": ai::build_offline_wiki_context("survival power radio water", 1).is_some()
    }))
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
    let url = validate_fetch_url_resolved(&url).await?;
    let client = guarded_http_client(15)?;

    let response = guarded_get(&client, url).await?;

    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status().as_u16()));
    }

    response.text().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn fetch_url(url: String) -> Result<String, String> {
    let url = validate_fetch_url_resolved(&url).await?;
    let client = guarded_http_client(10)?;

    let response = guarded_get(&client, url).await?;

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
    let url = validate_fetch_url_resolved(&url).await?;
    let client = guarded_http_client(15)?;

    let response = guarded_get(&client, url).await?;

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
    let url = validate_fetch_url_resolved(&url).await?;
    let client = guarded_http_client(10)?;
    let bytes = guarded_get_bytes(&client, url, ascii_image::MAX_IMAGE_BYTES).await?;
    ascii_image::convert_to_braille(&bytes)
}

#[tauri::command]
async fn render_image_color_ascii(url: String) -> Result<serde_json::Value, String> {
    let url = validate_fetch_url_resolved(&url).await?;
    let client = guarded_http_client(10)?;
    let bytes = guarded_get_bytes(&client, url, ascii_image::MAX_IMAGE_BYTES).await?;
    let result = ascii_image::convert_to_color_ascii(&bytes)?;
    serde_json::to_value(result).map_err(|e| e.to_string())
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
    let path = validate_user_filesystem_path(&path, false)?;
    let path = path.to_string_lossy().to_string();
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
            .arg(&editor)
            .arg(&path)
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
            get_ai_status,
            get_current_dir,
            fetch_json,
            fetch_url,
            fetch_url_structured,
            render_image_ascii,
            render_image_color_ascii,
            detect_editor,
            open_file_external,
            get_hardware_info,
            get_network_connections,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::{is_private_or_local_ip, validate_fetch_url};
    use std::net::{IpAddr, Ipv4Addr, Ipv6Addr};

    #[test]
    fn fetch_url_policy_allows_public_http_urls() {
        assert!(validate_fetch_url("https://example.com/path").is_ok());
        assert!(validate_fetch_url("http://example.com").is_ok());
    }

    #[test]
    fn fetch_url_policy_rejects_unsafe_schemes() {
        assert!(validate_fetch_url("file:///etc/passwd").is_err());
        assert!(validate_fetch_url("javascript:alert(1)").is_err());
        assert!(validate_fetch_url("data:text/plain,hello").is_err());
        assert!(validate_fetch_url("ftp://example.com/file").is_err());
    }

    #[test]
    fn fetch_url_policy_blocks_local_targets_by_default() {
        let previous = std::env::var_os("MUTHUR_ALLOW_PRIVATE_FETCH");
        std::env::remove_var("MUTHUR_ALLOW_PRIVATE_FETCH");

        assert!(validate_fetch_url("http://localhost:11434").is_err());
        assert!(validate_fetch_url("http://127.0.0.1:8000").is_err());
        assert!(validate_fetch_url("http://192.168.1.1").is_err());

        if let Some(value) = previous {
            std::env::set_var("MUTHUR_ALLOW_PRIVATE_FETCH", value);
        }
    }

    #[test]
    fn fetch_url_policy_detects_private_resolved_addresses() {
        assert!(is_private_or_local_ip(IpAddr::V4(Ipv4Addr::new(
            127, 0, 0, 1
        ))));
        assert!(is_private_or_local_ip(IpAddr::V4(Ipv4Addr::new(
            10, 0, 0, 8
        ))));
        assert!(is_private_or_local_ip(IpAddr::V6(Ipv6Addr::LOCALHOST)));
        assert!(is_private_or_local_ip(IpAddr::V6(
            "fd00::1".parse().unwrap()
        )));
        assert!(!is_private_or_local_ip(IpAddr::V4(Ipv4Addr::new(
            93, 184, 216, 34
        ))));
        assert!(!is_private_or_local_ip(IpAddr::V6(
            "2606:2800:220:1:248:1893:25c8:1946".parse().unwrap()
        )));
    }
}
