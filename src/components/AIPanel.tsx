import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function AIPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: '7-Alpha-1 (MUTHUR AI Interface)\n\nUser Authentication: Successful\nConnection Established\n\nAvailable functions:\n\n1. Data Retrieval\n2. Information Synthesis\n3. Command Assistance\n\nUse # prefix for command suggestions.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: `> ${userMessage}` }]);
    setLoading(true);

    try {
      const { invoke } = await import('@tauri-apps/api/core');

      if (userMessage.startsWith('#')) {
        const context = userMessage.substring(1).trim();
        const response = await invoke('ai_suggest_command', { context }) as string;
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `COMMAND:\n${response}` }
        ]);
      } else {
        const response = await invoke('ai_chat', { message: userMessage }) as string;
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      let hint = '';
      if (errMsg.includes('onnect') || errMsg.includes('refused')) {
        hint = '\n\nRun: ollama serve';
      } else if (errMsg.includes('model') || errMsg.includes('not found')) {
        hint = '\n\nRun: ollama pull llama3.2';
      }
      setMessages(prev => [
        ...prev,
        { role: 'system', content: `ERR: ${errMsg}${hint}` }
      ]);
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
    <div className="panel flex-1 flex flex-col min-h-0">
      <div className="panel-header shrink-0">MUTHUR AI</div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto min-h-0 p-3 space-y-3 text-xs scrollbar-thin"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={
              msg.role === 'user'
                ? 'text-muthur-primary font-bold'
                : msg.role === 'system'
                ? 'text-muthur-secondary'
                : 'text-muthur-secondary'
            }
          >
            <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
              {msg.content}
            </pre>
          </div>
        ))}
        {loading && (
          <div className="text-muthur-border animate-pulse">
            PROCESSING...
          </div>
        )}
      </div>

      <div className="p-2 border-t border-muthur-border shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask MUTHUR..."
            className="flex-1 bg-muthur-bg border border-muthur-border px-2 py-1 text-xs text-muthur-primary focus:outline-none focus:border-muthur-primary font-mono"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-3 py-1 bg-muthur-primary text-black text-xs font-bold hover:bg-muthur-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
