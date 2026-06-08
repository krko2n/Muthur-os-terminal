import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function AIPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: 'MUTHUR 6000 INTERFACE\nMODEL: MU/TH/UR 182\nSTATUS: ACTIVE\n\nAwaiting crew input...' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const { invoke } = await import('@tauri-apps/api/core');

      if (userMessage.startsWith('#')) {
        const context = userMessage.substring(1).trim();
        const response = await invoke('ai_suggest_command', { context }) as string;
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
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
            content: `NETWORK ERROR: Could not reach external servers.\n${e}`
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
      } else {
        const response = await invoke('ai_chat', { message: userMessage }) as string;
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: `INTERFACE ERROR: ${errMsg}${errMsg.includes('onnect') ? '\n\nRun: ollama serve' : ''}`
      }]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="text-[1.3vh] tracking-widest opacity-60 mb-[0.5vh]">MUTHUR AI</div>

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
                : msg.role === 'system'
                ? 'text-muthur-secondary opacity-60'
                : 'text-muthur-secondary'
            }`}
          >
            {msg.role === 'user' && <span className="opacity-40">CREW &gt; </span>}
            {msg.role === 'assistant' && <span className="opacity-40">MUTHUR &gt; </span>}
            <span className="whitespace-pre-wrap break-words">{msg.content}</span>
          </div>
        ))}
        {loading && (
          <div className="text-[1.3vh] text-muthur-primary opacity-40 animate-pulse">
            PROCESSING QUERY...
          </div>
        )}
      </div>

      <div className="mt-[0.5vh] shrink-0">
        <div className="text-[0.9vh] opacity-30 mb-[0.3vh]">
          # = cmd suggest | web/search = internet | fetch = URL
        </div>
        <div className="flex gap-[0.5vh]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Interface with MUTHUR..."
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
