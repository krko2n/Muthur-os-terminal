import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import '@xterm/xterm/css/xterm.css';
import BrowserView from './BrowserView';

interface TerminalSession {
  id: string;
  terminal: XTerm;
  fitAddon: FitAddon;
  name: string;
  type: 'shell' | 'browser';
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
        name: `NET-${sessionNum}`,
        type: 'browser',
      };
      setSessions(prev => [...prev, fakeSession]);
      setActiveSessionId(id);
      setBrowserContent(null);
      return;
    }

    if (!containerRef.current) return;

    try {
      const terminal = new XTerm({
        cursorBlink: true,
        cursorStyle: 'block',
        fontSize: 15,
        fontFamily: '"Share Tech Mono", "Fira Mono", "Courier New", monospace',
        theme: {
          background: 'transparent',
          foreground: '#aacfd1',
          cursor: '#00ff41',
          black: '#000000',
          red: '#ff006e',
          green: '#00ff41',
          yellow: '#ffd700',
          blue: '#00d4ff',
          magenta: '#ff00ff',
          cyan: '#00ffff',
          white: '#ffffff',
          brightBlack: '#555555',
          brightRed: '#ff0088',
          brightGreen: '#00ff88',
          brightYellow: '#ffff00',
          brightBlue: '#0088ff',
          brightMagenta: '#ff88ff',
          brightCyan: '#88ffff',
          brightWhite: '#ffffff',
        },
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

      await listen(`terminal-output-${sessionId}`, (e: any) => {
        terminal.write(e.payload);
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
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      if (normalized.includes('.') && !normalized.includes(' ')) {
        normalized = 'https://' + normalized;
      } else {
        normalized = `https://duckduckgo.com/html/?q=${encodeURIComponent(normalized)}`;
      }
    }
    setBrowserInput(normalized);
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
      {/* Tab bar - large, same level */}
      <div className="flex items-center px-2 py-1 border-b border-[rgba(0,255,65,0.15)] shrink-0">
        {sessions.map(session => (
          <div
            key={session.id}
            className={`flex items-center gap-2 px-3 py-1 text-sm transition-colors mr-1 ${
              activeSessionId === session.id
                ? 'text-muthur-primary border-b-2 border-muthur-primary'
                : 'text-muthur-secondary opacity-50 hover:opacity-80'
            }`}
            onClick={() => switchSession(session.id)}
          >
            <span className="font-mono">{session.name}</span>
            <span
              onClick={(e) => { e.stopPropagation(); closeSession(session.id); }}
              className="text-xs opacity-40 hover:opacity-100 hover:text-[#ff006e] ml-1"
            >
              x
            </span>
          </div>
        ))}
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => createNewSession('shell')}
            className="px-2 py-0.5 text-xs border border-[rgba(0,255,65,0.25)] text-muthur-primary hover:bg-[rgba(0,255,65,0.1)] transition-colors"
          >
            + shell
          </button>
          <button
            onClick={() => createNewSession('browser')}
            className="px-2 py-0.5 text-xs border border-[rgba(0,255,65,0.25)] text-muthur-secondary hover:bg-[rgba(0,255,65,0.1)] transition-colors"
          >
            + net
          </button>
        </div>
      </div>

      {/* Content */}
      {isBrowser ? (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* URL bar */}
          <div className="flex gap-2 p-2 border-b border-[rgba(0,255,65,0.1)] shrink-0 relative z-10">
            <input
              type="text"
              value={browserInput}
              onChange={(e) => setBrowserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && navigateBrowser(browserInput)}
              placeholder="Enter URL or search..."
              className="flex-1 bg-transparent border border-[rgba(0,255,65,0.2)] px-2 py-1 text-sm text-muthur-primary font-mono focus:outline-none focus:border-[rgba(0,255,65,0.5)]"
            />
            <button
              onClick={() => navigateBrowser(browserInput)}
              className="px-3 py-1 text-sm border border-[rgba(0,255,65,0.3)] text-muthur-primary hover:bg-[rgba(0,255,65,0.1)]"
            >
              GO
            </button>
          </div>
          {/* Structured browser content */}
          <BrowserView url={browserInput} onNavigate={navigateBrowser} />
        </div>
      ) : (
        <div ref={containerRef} className="flex-1 overflow-hidden" />
      )}
    </div>
  );
}
