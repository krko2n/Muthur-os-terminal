use portable_pty::{native_pty_system, CommandBuilder, PtyPair, PtySize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Arc;
use tauri::{Emitter, Window};
use tokio::task;
use uuid::Uuid;

#[derive(Debug, Clone, Hash, Eq, PartialEq)]
pub struct SessionId(String);

impl SessionId {
    pub fn new() -> Self {
        SessionId(Uuid::new_v4().to_string())
    }

    pub fn to_string(&self) -> String {
        self.0.clone()
    }
}

impl From<String> for SessionId {
    fn from(s: String) -> Self {
        SessionId(s)
    }
}

pub struct Session {
    pty_pair: PtyPair,
    // Child process handle - stored to keep process alive
    #[allow(dead_code)]
    child: Box<dyn portable_pty::Child + Send>,
}

pub struct PtyManager {
    sessions: HashMap<SessionId, Session>,
}

impl PtyManager {
    pub fn new() -> Self {
        PtyManager {
            sessions: HashMap::new(),
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

        let child = pty_pair.slave.spawn_command(cmd)?;
        drop(pty_pair.slave);

        let session_id = SessionId::new();
        let mut reader = pty_pair.master.try_clone_reader()?;

        let sid_clone = session_id.clone();
        let window_clone = window.clone();

        // Spawn reader task with batching
        task::spawn(async move {
            let mut buffer = vec![0u8; 8192];
            let mut batch_buffer = Vec::new();
            let mut last_send = std::time::Instant::now();

            loop {
                match reader.read(&mut buffer) {
                    Ok(0) => break,
                    Ok(n) => {
                        batch_buffer.extend_from_slice(&buffer[..n]);

                        // Batch for ~16ms or if buffer is large
                        let elapsed = last_send.elapsed().as_millis();
                        if elapsed >= 16 || batch_buffer.len() > 4096 {
                            if !batch_buffer.is_empty() {
                                let data = String::from_utf8_lossy(&batch_buffer).to_string();
                                let _ = window_clone.emit(&format!("terminal-output-{}", sid_clone.to_string()), data);
                                batch_buffer.clear();
                                last_send = std::time::Instant::now();
                            }
                        }
                    }
                    Err(_) => break,
                }
                tokio::time::sleep(tokio::time::Duration::from_millis(1)).await;
            }

            let _ = window_clone.emit(&format!("terminal-closed-{}", sid_clone.to_string()), ());
        });

        self.sessions.insert(
            session_id.clone(),
            Session {
                pty_pair,
                child,  // spawn_command already returns Box<dyn Child>
            },
        );

        Ok(session_id)
    }

    pub fn write(&mut self, session_id: SessionId, data: &[u8]) -> anyhow::Result<()> {
        if let Some(session) = self.sessions.get_mut(&session_id) {
            session.pty_pair.master.write_all(data)?;
            Ok(())
        } else {
            Err(anyhow::anyhow!("Session not found"))
        }
    }

    pub fn resize(&mut self, session_id: SessionId, cols: u16, rows: u16) -> anyhow::Result<()> {
        if let Some(session) = self.sessions.get_mut(&session_id) {
            session.pty_pair.master.resize(PtySize {
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
