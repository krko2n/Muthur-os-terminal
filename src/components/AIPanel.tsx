import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AIIcon } from './SystemIcons';

interface Message {
  role: 'user' | 'assistant' | 'system' | 'warning';
  content: string;
}

interface OfflineWikiHit {
  title: string;
  source: string;
  snippet: string;
  score: number;
}

interface AIStatus {
  model: string;
  baseUrl: string;
  online: boolean;
  offlineArchive: boolean;
}

interface CommandRiskRule {
  pattern: RegExp;
  reason: string;
}

const COMMAND_RISK_RULES: CommandRiskRule[] = [
  {
    pattern: /\brm\s+-(?=[^\n;&|]*r)(?=[^\n;&|]*f)[^\n;&|]*/i,
    reason: 'forced recursive deletion',
  },
  {
    pattern: /\b(?:mkfs|wipefs|fdisk|parted|sgdisk|gdisk|cryptsetup\s+luksFormat)\b/i,
    reason: 'disk partitioning, formatting, or wipe operation',
  },
  {
    pattern: /\bdd\s+[^;\n]*(?:of=\/dev\/|if=\/dev\/)/i,
    reason: 'raw block-device copy',
  },
  {
    pattern: /\b(?:curl|wget)\b[^\n|;&]*(?:\||\s+-O\s+-|\s+-qO\s+-)[^\n]*(?:sh|bash|zsh|fish)\b/i,
    reason: 'remote script piped into a shell',
  },
  {
    pattern: /\b(?:chmod|chown)\s+-R\b[^\n;&|]*(?:\s\/|\s~|\s\$HOME)\b/i,
    reason: 'recursive permission or ownership change over a broad path',
  },
  {
    pattern: /\b(?:shutdown|reboot|poweroff|systemctl\s+(?:reboot|poweroff|halt))\b/i,
    reason: 'system power or session control',
  },
  {
    pattern: /:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;/,
    reason: 'fork-bomb pattern',
  },
];

function formatOfflineHits(query: string, hits: OfflineWikiHit[]) {
  if (!hits.length) {
    return `OFFLINE ARCHIVE: no local hits for "${query}".\n\nInstall or update the voluntary wiki pack, or add text/JSONL files under the offline wiki folder.`;
  }

  return [
    `OFFLINE ARCHIVE HITS FOR: ${query}`,
    '',
    ...hits.map((hit, index) => [
      `[${index + 1}] ${hit.title}`,
      `SOURCE: ${hit.source}`,
      hit.snippet,
    ].join('\n')),
  ].join('\n\n');
}

function createAIRequestId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function detectCommandRisks(command: string) {
  const reasons = new Set<string>();
  for (const rule of COMMAND_RISK_RULES) {
    if (rule.pattern.test(command)) {
      reasons.add(rule.reason);
    }
  }
  return Array.from(reasons);
}

function commandSuggestionMessages(response: string): Message[] {
  const suggestion: Message = {
    role: 'assistant',
    content: `COMMAND SUGGESTION - REVIEW BEFORE RUNNING:\n${response}`,
  };
  const risks = detectCommandRisks(response);
  if (!risks.length) {
    return [suggestion];
  }

  return [
    {
      role: 'warning',
      content: [
        'COMMAND RISK WARNING',
        ...risks.map(risk => `- ${risk}`),
        '',
        'Terminal commands run with your user privileges. Read every path and flag, prefer dry-run modes, and back up anything important before execution.',
      ].join('\n'),
    },
    suggestion,
  ];
}

export default function AIPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: 'MUTHUR survival AI online.\n\nNormal chat now searches the offline wiki/docs cache before answering.\n\nCommands:\n  # <goal> - suggest a terminal command before you run it\n  wiki <query> - search local offline archive\n  web <query> - remote search when a link exists\n  fetch <url> - get page content\n\nOffline pack:\n  install AI/wiki/maps voluntarily with scripts/muthur-offline-pack.sh' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [status, setStatus] = useState<AIStatus | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRequestRef = useRef<string | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    const refreshStatus = async () => {
      try {
        const result = await invoke('get_ai_status') as AIStatus;
        if (!cancelled) setStatus(result);
      } catch {
        if (!cancelled) setStatus(null);
      }
    };

    refreshStatus();
    const timer = window.setInterval(refreshStatus, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    let aiRequestId: string | null = null;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      if (userMessage.startsWith('#')) {
        const context = userMessage.substring(1).trim();
        const response = await invoke('ai_suggest_command', { context }) as string;
        setMessages(prev => [...prev, ...commandSuggestionMessages(response)]);
      } else if (userMessage.startsWith('web ') || userMessage.startsWith('search ')) {
        // Internet search via backend
        const query = userMessage.replace(/^(web|search)\s+/, '');
        const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        try {
          const result = await invoke('fetch_url', { url: searchUrl }) as string;
          const truncated = result.slice(0, 2000);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `SEARCH RESULTS FOR: ${query}\n\n${truncated}`
          }]);
        } catch (e) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `REMOTE LINK ERROR: Could not reach the requested web source.\n${e}`
          }]);
        }
      } else if (userMessage.startsWith('fetch ') || userMessage.startsWith('get ')) {
        // Direct URL fetch
        const url = userMessage.replace(/^(fetch|get)\s+/, '');
        try {
          const result = await invoke('fetch_url', { url }) as string;
          const truncated = result.slice(0, 3000);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: truncated
          }]);
        } catch (e) {
          setMessages(prev => [...prev, {
            role: 'system',
            content: `FETCH FAILED: ${e}`
          }]);
        }
      } else if (userMessage.startsWith('wiki ') || userMessage.startsWith('archive ') || userMessage.startsWith('survival ')) {
        const query = userMessage.replace(/^(wiki|archive|survival)\s+/, '');
        const hits = await invoke('search_offline_wiki', { query }) as OfflineWikiHit[];
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: formatOfflineHits(query, hits)
        }]);
      } else {
        aiRequestId = createAIRequestId();
        activeRequestRef.current = aiRequestId;
        setActiveRequestId(aiRequestId);
        const response = await invoke('ai_chat', { message: userMessage, requestId: aiRequestId }) as string;
        if (activeRequestRef.current === aiRequestId) {
          setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        }
      }
    } catch (error) {
      const errMsg = errorMessage(error);
      const wasStopped = errMsg.toLowerCase().includes('cancel');
      if (!aiRequestId || activeRequestRef.current === aiRequestId) {
        setMessages(prev => [...prev, {
          role: 'system',
          content: wasStopped
            ? 'AI REQUEST STOPPED BY OPERATOR.'
            : `INTERFACE ERROR: ${errMsg}${errMsg.includes('onnect') ? '\n\nRun: ollama serve' : ''}`
        }]);
      }
    }

    if (!aiRequestId || activeRequestRef.current === aiRequestId) {
      activeRequestRef.current = null;
      setActiveRequestId(null);
      setLoading(false);
    }
  };

  const stopAIRequest = () => {
    const requestId = activeRequestRef.current;
    if (!requestId) return;

    activeRequestRef.current = null;
    setActiveRequestId(null);
    setLoading(false);
    setMessages(prev => [...prev, { role: 'system', content: 'AI REQUEST STOPPED BY OPERATOR.' }]);
    invoke('cancel_ai_request', { requestId }).catch(error => {
      setMessages(prev => [...prev, {
        role: 'system',
        content: `STOP SIGNAL FAILED: ${errorMessage(error)}`
      }]);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="text-[1.3vh] tracking-widest opacity-60 mb-[0.5vh] flex items-center gap-[0.5vh]">
        <AIIcon size={14} color="rgba(0,255,65,0.6)" />
        MUTHUR SURVIVAL AI
      </div>
      <div className="text-[0.95vh] text-muthur-secondary opacity-45 mb-[0.6vh] flex flex-wrap gap-x-[0.9vh] gap-y-[0.2vh]">
        <span>MODEL {status?.model || 'UNKNOWN'}</span>
        <span>{status?.online ? 'OLLAMA ONLINE' : 'OLLAMA OFFLINE'}</span>
        <span>{status?.offlineArchive ? 'ARCHIVE READY' : 'ARCHIVE BASIC'}</span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto min-h-0 scrollbar-thin space-y-[1vh]"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-[1.3vh] leading-relaxed ${
              msg.role === 'user'
                ? 'text-muthur-primary'
                : msg.role === 'warning'
                ? 'text-muthur-warning border border-[rgba(255,170,0,0.32)] bg-[rgba(255,170,0,0.055)] px-[0.65vh] py-[0.45vh]'
                : msg.role === 'system'
                ? 'text-muthur-secondary opacity-60'
                : 'text-muthur-secondary'
            }`}
          >
            {msg.role === 'user' && <span className="opacity-40">&gt; </span>}
            {msg.role === 'assistant' && <span className="opacity-40 text-muthur-primary">MUTHUR: </span>}
            <span className="whitespace-pre-wrap break-words">{msg.content}</span>
          </div>
        ))}
        {loading && (
          <div className="flex items-center justify-between gap-[1vh]">
            <div className="text-[1.3vh] text-muthur-primary opacity-40 animate-pulse">
              PROCESSING QUERY...
            </div>
            {activeRequestId && (
              <button
                type="button"
                onClick={stopAIRequest}
                className="shrink-0 px-[0.8vh] py-[0.25vh] text-[1vh] border border-muthur-warning text-muthur-warning hover:bg-[rgba(255,170,0,0.12)] transition-colors"
              >
                STOP
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-[0.5vh] shrink-0">
        <div className="text-[0.9vh] opacity-30 mb-[0.3vh]">
          # = cmd | wiki = offline archive | web/fetch = link
        </div>
        <div className="flex gap-[0.5vh]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent border border-[rgba(0,255,65,0.2)] px-[0.5vh] py-[0.3vh] text-[1.3vh] text-muthur-primary focus:outline-none focus:border-[rgba(0,255,65,0.5)]"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-[1vh] text-[1.3vh] border border-[rgba(0,255,65,0.3)] text-muthur-primary hover:bg-[rgba(0,255,65,0.1)] disabled:opacity-20 transition-colors"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
