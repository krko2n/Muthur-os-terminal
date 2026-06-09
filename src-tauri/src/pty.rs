use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex as StdMutex};
use std::time::{Duration, Instant};
use tauri::{Emitter, Window};
use uuid::Uuid;

#[derive(Debug, Clone, Hash, Eq, PartialEq)]
pub struct SessionId(String);

impl SessionId {
    pub fn new() -> Self {
        SessionId(Uuid::new_v4().to_string())
    }
}

impl std::fmt::Display for SessionId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<String> for SessionId {
    fn from(s: String) -> Self {
        SessionId(s)
    }
}

pub struct Session {
    master: Box<dyn portable_pty::MasterPty + Send>,
    #[allow(dead_code)]
    child: Box<dyn portable_pty::Child + Send>,
}

pub struct PtyManager {
    sessions: HashMap<SessionId, Session>,
    writers: HashMap<SessionId, Arc<StdMutex<Box<dyn Write + Send>>>>,
}

impl PtyManager {
    pub fn new() -> Self {
        PtyManager {
            sessions: HashMap::new(),
            writers: HashMap::new(),
        }
    }

    pub fn create_session(&mut self, window: Window) -> anyhow::Result<SessionId> {
        let pty_system = native_pty_system();
        let pty_pair = pty_system.openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })?;
        let mut cmd = CommandBuilder::new(get_shell());
        cmd.env("TERM", "xterm-256color");
        if cfg!(not(target_os = "windows")) {
            cmd.env(
                "PROMPT_COMMAND",
                r#"printf '\033]7;file://%s%s\033\\' "$HOSTNAME" "$PWD""#,
            );
        }
        let child = pty_pair.slave.spawn_command(cmd)?;
        drop(pty_pair.slave);
        let session_id = SessionId::new();
        let master = pty_pair.master;
        let writer = Arc::new(StdMutex::new(master.take_writer()?));
        let mut reader = master.try_clone_reader()?;
        let sid_clone = session_id.clone();
        let window_clone = window.clone();
        std::thread::spawn(move || {
            let mut buffer = vec![0u8; 65536];
            let mut batch = Vec::with_capacity(65536);
            let mut last_emit = Instant::now();
            let frame_time = Duration::from_millis(8);

            loop {
                match reader.read(&mut buffer) {
                    Ok(0) => {
                        if !batch.is_empty() {
                            let data = String::from_utf8_lossy(&batch).to_string();
                            let _ = window_clone.emit(
                                &format!("terminal-output-{}", sid_clone.to_string()),
                                data,
                            );
                        }
                        break;
                    }
                    Ok(n) => {
                        batch.extend_from_slice(&buffer[..n]);
                        let now = Instant::now();
                        if now.duration_since(last_emit) >= frame_time || batch.len() > 32768 {
                            let data = String::from_utf8_lossy(&batch).to_string();
                            let _ = window_clone.emit(
                                &format!("terminal-output-{}", sid_clone.to_string()),
                                data,
                            );
                            batch.clear();
                            last_emit = now;
                        }
                    }
                    Err(_) => break,
                }
            }
            let _ = window_clone.emit(&format!("terminal-closed-{}", sid_clone.to_string()), ());
        });

        self.writers.insert(session_id.clone(), writer);
        self.sessions.insert(
            session_id.clone(),
            Session { master, child },
        );
        Ok(session_id)
    }

    pub fn get_writer(&self, session_id: &SessionId) -> Option<Arc<StdMutex<Box<dyn Write + Send>>>> {
        self.writers.get(session_id).cloned()
    }

    pub fn resize(&mut self, session_id: SessionId, cols: u16, rows: u16) -> anyhow::Result<()> {
        if let Some(session) = self.sessions.get_mut(&session_id) {
            session.master.resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })?;
            Ok(())
        } else {
            Err(anyhow::anyhow!("Session not found"))
        }
    }

    pub fn close_session(&mut self, session_id: SessionId) -> anyhow::Result<()> {
        self.writers.remove(&session_id);
        if self.sessions.remove(&session_id).is_some() {
            Ok(())
        } else {
            Err(anyhow::anyhow!("Session not found"))
        }
    }
}

fn get_shell() -> String {
    if cfg!(target_os = "windows") {
        "powershell.exe".to_string()
    } else {
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string())
    }
}
