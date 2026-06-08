import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function AIPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: 'MUTHUR AI Interface Active\nConnection Established\n\nType a message or use # for command suggestions.' }
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
      } else {
        const response = await invoke('ai_chat', { message: userMessage }) as string;
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: `ERR: ${errMsg}\n${errMsg.includes('onnect') ? 'Run: ollama serve' : ''}`
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
      <div className="text-[1.1vh] tracking-widest opacity-60 mb-[0.3vh]">MUTHUR AI</div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto min-h-0 scrollbar-thin space-y-[0.8vh]"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-[1.1vh] leading-relaxed ${
              msg.role === 'user'
                ? 'text-muthur-primary'
                : msg.role === 'system'
                ? 'text-muthur-secondary opacity-70'
                : 'text-muthur-secondary'
            }`}
          >
            {msg.role === 'user' && <span className="opacity-50">&gt; </span>}
            <span className="whitespace-pre-wrap break-words">{msg.content}</span>
          </div>
        ))}
        {loading && (
          <div className="text-[1.1vh] opacity-30 animate-pulse">...</div>
        )}
      </div>

      <div className="mt-[0.5vh] shrink-0">
        <div className="flex gap-[0.5vh]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask MUTHUR..."
            className="flex-1 bg-transparent border-b border-[rgba(0,255,65,0.3)] px-[0.3vh] py-[0.2vh] text-[1.1vh] text-muthur-primary focus:outline-none focus:border-muthur-primary"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-[0.8vh] py-[0.2vh] text-[1.1vh] border border-[rgba(0,255,65,0.3)] text-muthur-primary hover:bg-[rgba(0,255,65,0.1)] disabled:opacity-20 transition-colors"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
