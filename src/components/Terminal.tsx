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
}

export default function Terminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Create initial terminal session
    createNewSession();

    return () => {
      // Cleanup all sessions
      sessions.forEach(session => {
        session.terminal.dispose();
        cleanupSession(session.id);
      });
    };
  }, []);

  const createNewSession = async () => {
    if (!containerRef.current) return;

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const { listen } = await import('@tauri-apps/api/event');

      // Create terminal instance
      const terminal = new XTerm({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: '"Share Tech Mono", "Courier New", monospace',
        theme: {
          background: 'transparent',
          foreground: '#00ff41',
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

      // Create PTY session
      const sessionId = await invoke('create_terminal_session') as string;

      // Listen for output
      await listen(`terminal-output-${sessionId}`, (e: any) => {
        terminal.write(e.payload);
      });

      // Listen for session close
      await listen(`terminal-closed-${sessionId}`, () => {
        terminal.write('\r\n\x1b[31mSession closed\x1b[0m\r\n');
      });

      // Handle terminal input
      terminal.onData(async (data) => {
        await invoke('write_to_terminal', {
          sessionId,
          data,
        });
      });

      // Create container for this terminal
      const terminalContainer = document.createElement('div');
      terminalContainer.className = 'terminal-container';
      terminalContainer.style.width = '100%';
      terminalContainer.style.height = '100%';
      terminalContainer.style.display = 'none';

      containerRef.current.appendChild(terminalContainer);
      terminal.open(terminalContainer);

      fitAddon.fit();

      // Handle resize
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

      const newSession: TerminalSession = {
        id: sessionId,
        terminal,
        fitAddon,
        name: `TERM-${sessions.length + 1}`,
      };

      setSessions(prev => [...prev, newSession]);
      setActiveSessionId(sessionId);

      // Show this terminal
      terminalContainer.style.display = 'block';
      terminal.focus();

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
    // Hide all terminals
    const containers = containerRef.current?.querySelectorAll('.terminal-container');
    containers?.forEach(container => {
      (container as HTMLElement).style.display = 'none';
    });

    // Show selected terminal
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
      createNewSession();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex gap-1 bg-muthur-panel border-b border-muthur-border p-1">
        {sessions.map(session => (
          <div
            key={session.id}
            className={`flex items-center gap-2 px-3 py-1 text-xs cursor-pointer ${
              activeSessionId === session.id
                ? 'bg-muthur-border text-muthur-primary'
                : 'text-muthur-secondary hover:bg-muthur-border'
            } transition-colors`}
            onClick={() => switchSession(session.id)}
          >
            <span>{session.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeSession(session.id);
              }}
              className="text-muthur-accent hover:text-red-500"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={createNewSession}
          className="px-3 py-1 text-xs text-muthur-primary hover:bg-muthur-border transition-colors"
        >
          + NEW
        </button>
      </div>

      {/* Terminal container */}
      <div ref={containerRef} className="flex-1 overflow-hidden" />
    </div>
  );
}
