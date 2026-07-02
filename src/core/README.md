# src/core

Core logic shared between terminal-only mode and GUI mode.

This directory contains modules that are UI-agnostic:
- Command parsing and dispatch
- Session management
- Event system
- Shared types and interfaces

No React, no Tauri-specific imports. Code here must work
in any JS/TS runtime context.
