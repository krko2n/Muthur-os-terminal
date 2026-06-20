import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import '@xterm/xterm/css/xterm.css';
import NativeBrowserView from './NativeBrowserView';
import { playSound } from '../audio';

interface TerminalSession {
  id: string;
  terminal: XTerm;
  fitAddon: FitAddon;
  name: string;
  type: 'shell' | 'browser';
}

const DEFAULT_WEB_TARGET = 'https://lite.duckduckgo.com/lite/';

function cssVar(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function getTerminalFont() {
  return cssVar('--font-mono', '"Share Tech Mono", "Courier New", monospace');
}

function getTerminalTheme() {
  const accent = cssVar('--color-accent', '#00ff41');
  const text = cssVar('--color-text', '#aacfd1');
  const danger = cssVar('--color-danger', '#ff006e');

  return {
    background: 'transparent',
    foreground: text,
    cursor: accent,
    black: '#000000',
    red: danger,
    green: accent,
    yellow: '#ffb13b',
    blue: '#48ddff',
    magenta: '#d96cff',
    cyan: '#98ffd3',
    white: text,
    brightBlack: '#555555',
    brightRed: danger,
    brightGreen: accent,
    brightYellow: '#ffd36a',
    brightBlue: '#72e8ff',
    brightMagenta: '#f0a4ff',
    brightCyan: '#c2ffe8',
    brightWhite: '#ffffff',
  };
}

export default function Terminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [browserInput, setBrowserInput] = useState('');

  useEffect(() => {
    createNewSession('shell');
    return () => {
      sessions.forEach(session => {
        session.terminal.dispose();
        if (session.type === 'shell') cleanupSession(session.id);
      });
    };
  }, []);

  useEffect(() => {
    const handleVirtualKey = (e: Event) => {
      const char = (e as CustomEvent).detail;
      const active = sessions.find(s => s.id === activeSessionId);
      if (active && active.type === 'shell' && char) {
        writeToTerminal(active.id, char);
      }
    };
    window.addEventListener('virtual-key', handleVirtualKey);
    return () => window.removeEventListener('virtual-key', handleVirtualKey);
  }, [sessions, activeSessionId]);

  useEffect(() => {
    const updateShellTheme = () => {
      const theme = getTerminalTheme();
      const fontFamily = getTerminalFont();
      sessions.forEach(session => {
        if (session.type === 'shell' && session.terminal) {
          session.terminal.options.theme = theme;
          session.terminal.options.fontFamily = fontFamily;
          session.fitAddon.fit();
        }
      });
    };

    window.addEventListener('muthur-theme-change', updateShellTheme);
    return () => window.removeEventListener('muthur-theme-change', updateShellTheme);
  }, [sessions]);

  // Open file in editor: creates new terminal tab and runs editor
  useEffect(() => {
    const handleOpenFile = async (e: Event) => {
      const filePath = (e as CustomEvent).detail;
      if (!filePath) return;
      try {
        const editor = await invoke('detect_editor') as string;
        const sessionId = await invoke('create_terminal_session') as string;
        const terminal = new XTerm({
          cursorBlink: true,
          cursorStyle: 'block',
          fontSize: 15,
          fontFamily: getTerminalFont(),
          theme: getTerminalTheme(),
          allowTransparency: true,
          scrollback: 5000,
        });

        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);

        try {
          const webglAddon = new WebglAddon();
          webglAddon.onContextLoss(() => { webglAddon.dispose(); });
          terminal.loadAddon(webglAddon);
        } catch {}

        await listen(`terminal-output-${sessionId}`, (ev: any) => {
          terminal.write(ev.payload);
        });

        await listen(`terminal-closed-${sessionId}`, () => {
          terminal.write('\r\n\x1b[31m[Session ended]\x1b[0m\r\n');
        });

        terminal.onData(async (data) => {
          await invoke('write_to_terminal', { sessionId, data });
        });

        if (!containerRef.current) return;
        const terminalContainer = document.createElement('div');
        terminalContainer.className = 'terminal-container';
        terminalContainer.style.width = '100%';
        terminalContainer.style.height = '100%';
        terminalContainer.style.display = 'none';
        containerRef.current.appendChild(terminalContainer);
        terminal.open(terminalContainer);
        fitAddon.fit();

        const resizeObserver = new ResizeObserver(() => {
          fitAddon.fit();
          const dims = fitAddon.proposeDimensions();
          if (dims) {
            invoke('resize_terminal', { sessionId, cols: dims.cols, rows: dims.rows }).catch(() => {});
          }
        });
        resizeObserver.observe(terminalContainer);

        const fileName = filePath.split('/').pop() || 'file';
        const sessionNum = sessions.length + 1;
        const newSession: TerminalSession = {
          id: sessionId,
          terminal,
          fitAddon,
          name: `EDIT-${sessionNum}`,
          type: 'shell',
        };

        setSessions(prev => [...prev, newSession]);
        setActiveSessionId(sessionId);

        // Show the new container, hide others
        const containers = containerRef.current.querySelectorAll('.terminal-container');
        containers.forEach(c => (c as HTMLElement).style.display = 'none');
        terminalContainer.style.display = 'block';
        terminal.focus();

        // Send the editor command after a brief delay for shell initialization
        setTimeout(() => {
          invoke('write_to_terminal', { sessionId, data: `${editor} "${filePath}"\n` });
        }, 300);
      } catch (err) {
        console.error('Failed to open file in editor:', err);
      }
    };
    window.addEventListener('open-file', handleOpenFile);
    return () => window.removeEventListener('open-file', handleOpenFile);
  }, [sessions]);

  // Sync filesystem cd with active terminal
  useEffect(() => {
    const handleFsCd = async (e: Event) => {
      const path = (e as CustomEvent).detail;
      if (!path) return;
      const active = sessions.find(s => s.id === activeSessionId && s.type === 'shell');
      if (active) {
        await invoke('write_to_terminal', { sessionId: active.id, data: `cd "${path}"\n` });
      }
    };
    window.addEventListener('fs-cd', handleFsCd);
    return () => window.removeEventListener('fs-cd', handleFsCd);
  }, [sessions, activeSessionId]);

  // Focus retention: refocus terminal when clicking non-input areas
  useEffect(() => {
    const refocus = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      const active = sessions.find(s => s.id === activeSessionId);
      if (active?.type === 'shell' && active.terminal) {
        requestAnimationFrame(() => active.terminal.focus());
      }
    };
    document.addEventListener('mouseup', refocus);
    return () => document.removeEventListener('mouseup', refocus);
  }, [sessions, activeSessionId]);

  const writeToTerminal = async (sessionId: string, data: string) => {
    try {
      await invoke('write_to_terminal', { sessionId, data });
    } catch (e) {
      console.error('Write failed:', e);
    }
  };

  const createNewSession = async (type: 'shell' | 'browser') => {
    if (type === 'browser') {
      const id = `browser-${Date.now()}`;
      const sessionNum = sessions.length + 1;
      const fakeSession: TerminalSession = {
        id,
        terminal: null as any,
        fitAddon: null as any,
        name: `WEB-${sessionNum}`,
        type: 'browser',
      };
      setSessions(prev => [...prev, fakeSession]);
      setActiveSessionId(id);
      setBrowserInput(prev => prev || DEFAULT_WEB_TARGET);
      playSound('scan', 0.08);
      return;
    }

    if (!containerRef.current) return;

    try {
      const terminal = new XTerm({
        cursorBlink: true,
        cursorStyle: 'block',
        fontSize: 15,
        fontFamily: getTerminalFont(),
        theme: getTerminalTheme(),
        allowTransparency: true,
        scrollback: 5000,
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      const sessionId = await invoke('create_terminal_session') as string;

      // GPU-accelerated rendering (falls back to canvas if WebGL unavailable)
      try {
        const webglAddon = new WebglAddon();
        webglAddon.onContextLoss(() => { webglAddon.dispose(); });
        terminal.loadAddon(webglAddon);
      } catch {}

      // OSC 7: CWD tracking from shell
      terminal.parser.registerOscHandler(7, (data: string) => {
        try {
          const url = new URL(data);
          const path = decodeURIComponent(url.pathname);
          if (path) {
            window.dispatchEvent(new CustomEvent('cwd-change', { detail: path }));
          }
        } catch {}
        return true;
      });

      let lastStdout = 0;
      await listen(`terminal-output-${sessionId}`, (e: any) => {
        terminal.write(e.payload);
        const now = Date.now();
        if (now - lastStdout > 50) {
          playSound('keyboard', 0.03);
          lastStdout = now;
        }
      });

      await listen(`terminal-closed-${sessionId}`, () => {
        terminal.write('\r\n\x1b[31m[Session ended]\x1b[0m\r\n');
      });

      terminal.onData(async (data) => {
        await invoke('write_to_terminal', { sessionId, data });
      });

      const terminalContainer = document.createElement('div');
      terminalContainer.className = 'terminal-container';
      terminalContainer.style.width = '100%';
      terminalContainer.style.height = '100%';
      terminalContainer.style.display = 'none';

      containerRef.current.appendChild(terminalContainer);
      terminal.open(terminalContainer);
      fitAddon.fit();

      const resizeObserver = new ResizeObserver(() => {
        fitAddon.fit();
        const dims = fitAddon.proposeDimensions();
        if (dims) {
          invoke('resize_terminal', { sessionId: sessionId as string, cols: dims.cols, rows: dims.rows }).catch(console.error);
        }
      });
      resizeObserver.observe(terminalContainer);

      const sessionNum = sessions.length + 1;
      const newSession: TerminalSession = {
        id: sessionId,
        terminal,
        fitAddon,
        name: `TERM-${sessionNum}`,
        type: 'shell',
      };

      setSessions(prev => [...prev, newSession]);
      setActiveSessionId(sessionId);
      terminalContainer.style.display = 'block';
      terminal.focus();
    } catch (error) {
      console.error('Failed to create terminal session:', error);
    }
  };

  const cleanupSession = async (sessionId: string) => {
    try {
      await invoke('close_terminal_session', { sessionId });
    } catch {}
  };

  const switchSession = (sessionId: string) => {
    playSound('folder', 0.1);
    const containers = containerRef.current?.querySelectorAll('.terminal-container');
    containers?.forEach(container => {
      (container as HTMLElement).style.display = 'none';
    });

    const session = sessions.find(s => s.id === sessionId);
    if (session?.type === 'shell') {
      const shellSessions = sessions.filter(s => s.type === 'shell');
      const idx = shellSessions.indexOf(session);
      if (idx >= 0 && containers && containers[idx]) {
        (containers[idx] as HTMLElement).style.display = 'block';
        session.terminal.focus();
      }
    }
    setActiveSessionId(sessionId);
  };

  const closeSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    if (session.type === 'shell') {
      session.terminal.dispose();
      await cleanupSession(sessionId);
    }

    const newSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(newSessions);

    if (activeSessionId === sessionId && newSessions.length > 0) {
      switchSession(newSessions[0].id);
    } else if (newSessions.length === 0) {
      createNewSession('shell');
    }
  };

  const navigateBrowser = (url: string) => {
    let normalized = url.trim();
    if (!normalized) normalized = DEFAULT_WEB_TARGET;
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      if (normalized.includes('.') && !normalized.includes(' ')) {
        normalized = 'https://' + normalized;
      } else {
        normalized = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(normalized)}`;
      }
    }
    setBrowserInput(normalized);
    playSound('folder', 0.08);
  };

  // Keyboard shortcuts for tab management
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 't':
            e.preventDefault();
            createNewSession('shell');
            break;
          case 'w':
            e.preventDefault();
            if (activeSessionId) closeSession(activeSessionId);
            break;
        }
      }
      // Ctrl+Tab / Ctrl+Shift+Tab to cycle sessions
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        const idx = sessions.findIndex(s => s.id === activeSessionId);
        const next = e.shiftKey
          ? (idx - 1 + sessions.length) % sessions.length
          : (idx + 1) % sessions.length;
        if (sessions[next]) switchSession(sessions[next].id);
      }
    };
    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [sessions, activeSessionId]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const isBrowser = activeSession?.type === 'browser';

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar - skewed parallelogram style (eDEX-UI signature) */}
      <div className="flex items-center justify-evenly px-2 py-1 border-b border-[rgba(0,255,65,0.15)] shrink-0 gap-1">
        {sessions.map(session => (
          <div
            key={session.id}
            className={`tab-skew flex items-center gap-2 px-4 py-1.5 text-xs font-mono tracking-wider transition-all duration-200 ${
              activeSessionId === session.id
                ? 'tab-active'
                : 'text-muthur-secondary opacity-50 hover:opacity-80 border border-[rgba(0,255,65,0.15)]'
            }`}
            onClick={() => switchSession(session.id)}
          >
            <span className="tab-skew-content">{session.name}</span>
            <span
              onClick={(e) => { e.stopPropagation(); closeSession(session.id); }}
              className="tab-skew-content text-[10px] opacity-40 hover:opacity-100 hover:text-[#ff006e] ml-1"
            >
              x
            </span>
          </div>
        ))}
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => createNewSession('shell')}
            className="tab-skew px-3 py-1 text-[10px] border border-[rgba(0,255,65,0.25)] text-muthur-primary hover:bg-[rgba(0,255,65,0.1)] transition-colors font-mono tracking-wider"
          >
            <span className="tab-skew-content">+ SHELL</span>
          </button>
          <button
            onClick={() => createNewSession('browser')}
            className="tab-skew px-3 py-1 text-[10px] border border-[rgba(0,255,65,0.25)] text-muthur-secondary hover:bg-[rgba(0,255,65,0.1)] transition-colors font-mono tracking-wider"
          >
            <span className="tab-skew-content">+ WEB</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {isBrowser ? (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* URL bar - fixed height, always visible */}
          <div className="flex gap-2 px-3 py-2 border-b border-[rgba(0,255,65,0.15)] shrink-0 relative z-10 bg-[rgba(5,8,13,0.95)]">
            <input
              type="text"
              value={browserInput}
              onChange={(e) => setBrowserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && navigateBrowser(browserInput)}
              placeholder="URL or search..."
              className="flex-1 bg-[rgba(0,255,65,0.03)] border border-[rgba(0,255,65,0.25)] rounded-sm px-3 py-1.5 text-sm text-muthur-primary font-mono focus:outline-none focus:border-[rgba(0,255,65,0.6)] focus:shadow-[0_0_6px_rgba(0,255,65,0.15)] placeholder:text-[rgba(0,255,65,0.3)]"
            />
            <button
              onClick={() => navigateBrowser(browserInput)}
              className="px-4 py-1.5 text-sm border border-[rgba(0,255,65,0.3)] text-muthur-primary hover:bg-[rgba(0,255,65,0.1)] rounded-sm font-mono tracking-wider"
            >
              GO
            </button>
          </div>
          {/* Structured browser content */}
          <NativeBrowserView url={browserInput} onNavigate={navigateBrowser} />
        </div>
      ) : (
        <div ref={containerRef} className="flex-1 overflow-hidden" />
      )}
    </div>
  );
}
