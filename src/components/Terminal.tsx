import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

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

  useEffect(() => {
    createNewSession('shell');

    return () => {
      sessions.forEach(session => {
        session.terminal.dispose();
        if (session.type === 'shell') cleanupSession(session.id);
      });
    };
  }, []);

  // Listen for virtual keyboard input
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

  const writeToTerminal = async (sessionId: string, data: string) => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('write_to_terminal', { sessionId, data });
    } catch (e) {
      console.error('Write failed:', e);
    }
  };

  const createNewSession = async (type: 'shell' | 'browser') => {
    if (!containerRef.current) return;

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const { listen } = await import('@tauri-apps/api/event');

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
        scrollback: 10000,
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);

      const sessionId = await invoke('create_terminal_session') as string;

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
          invoke('resize_terminal', {
            sessionId,
            cols: dims.cols,
            rows: dims.rows,
          }).catch(console.error);
        }
      });
      resizeObserver.observe(terminalContainer);

      const sessionNum = sessions.length + 1;
      const newSession: TerminalSession = {
        id: sessionId,
        terminal,
        fitAddon,
        name: type === 'browser' ? `WEB-${sessionNum}` : `TERM-${sessionNum}`,
        type,
      };

      setSessions(prev => [...prev, newSession]);
      setActiveSessionId(sessionId);

      terminalContainer.style.display = 'block';
      terminal.focus();

      // If browser type, launch a text browser command
      if (type === 'browser') {
        setTimeout(() => {
          invoke('write_to_terminal', {
            sessionId,
            data: 'echo "MUTHUR BROWSER - Type a URL to fetch:"\n',
          });
        }, 500);
      }

    } catch (error) {
      console.error('Failed to create terminal session:', error);
    }
  };

  const cleanupSession = async (sessionId: string) => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('close_terminal_session', { sessionId });
    } catch (error) {
      console.error('Failed to cleanup session:', error);
    }
  };

  const switchSession = (sessionId: string) => {
    const containers = containerRef.current?.querySelectorAll('.terminal-container');
    containers?.forEach(container => {
      (container as HTMLElement).style.display = 'none';
    });

    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex >= 0 && containers) {
      (containers[sessionIndex] as HTMLElement).style.display = 'block';
      sessions[sessionIndex].terminal.focus();
    }

    setActiveSessionId(sessionId);
  };

  const closeSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    session.terminal.dispose();
    await cleanupSession(sessionId);

    const newSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(newSessions);

    if (activeSessionId === sessionId && newSessions.length > 0) {
      switchSession(newSessions[0].id);
    } else if (newSessions.length === 0) {
      createNewSession('shell');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center gap-[0.3vw] px-[0.5vh] py-[0.3vh] border-b border-[rgba(0,255,65,0.1)]">
        {sessions.map(session => (
          <div
            key={session.id}
            className={`flex items-center gap-[0.5vh] px-[0.8vh] py-[0.2vh] text-[1.2vh] transition-colors ${
              activeSessionId === session.id
                ? 'text-muthur-primary border-b border-muthur-primary'
                : 'text-muthur-secondary opacity-50 hover:opacity-80'
            }`}
            onClick={() => switchSession(session.id)}
          >
            <span>{session.name}</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                closeSession(session.id);
              }}
              className="opacity-40 hover:opacity-100 hover:text-[#ff006e]"
            >
              x
            </span>
          </div>
        ))}
        <div className="flex gap-[0.3vw] ml-auto">
          <button
            onClick={() => createNewSession('shell')}
            className="px-[0.6vh] py-[0.2vh] text-[1vh] border border-[rgba(0,255,65,0.2)] text-muthur-primary opacity-60 hover:opacity-100 transition-colors"
          >
            + shell
          </button>
          <button
            onClick={() => createNewSession('browser')}
            className="px-[0.6vh] py-[0.2vh] text-[1vh] border border-[rgba(0,255,65,0.2)] text-muthur-secondary opacity-60 hover:opacity-100 transition-colors"
          >
            + web
          </button>
        </div>
      </div>

      {/* Terminal container */}
      <div ref={containerRef} className="flex-1 overflow-hidden" />
    </div>
  );
}
