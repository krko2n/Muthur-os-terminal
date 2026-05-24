import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function AIPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: 'MUTHUR AI ASSISTANT ONLINE' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const { invoke } = await import('@tauri-apps/api/core');

      // Check if it's a command suggestion request (starts with #)
      if (userMessage.startsWith('#')) {
        const context = userMessage.substring(1).trim();
        const response = await invoke('ai_suggest_command', { context }) as string;

        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `SUGGESTED COMMAND:\n${response}` }
        ]);

        // Auto-execute the command
        setTimeout(async () => {
          try {
            // Get active terminal session and write command
            const command = response.trim();
            setMessages(prev => [
              ...prev,
              { role: 'system', content: `EXECUTING: ${command}` }
            ]);

            // Note: You would need to get the active session ID from Terminal component
            // For now, this is a placeholder
            console.log('Would execute:', command);
          } catch (error) {
            console.error('Failed to execute command:', error);
          }
        }, 500);
      } else {
        const response = await invoke('ai_chat', { message: userMessage }) as string;
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'system',
          content: `ERROR: ${error instanceof Error ? error.message : 'AI service unavailable'}`
        }
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
    <div className="panel flex-1 flex flex-col">
      <div className="panel-header">MUTHUR AI ASSISTANT</div>

      <div className="flex-1 overflow-auto p-2 space-y-2 text-xs">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded ${
              msg.role === 'user'
                ? 'bg-muthur-border text-muthur-primary ml-4'
                : msg.role === 'system'
                ? 'bg-muthur-panel text-muthur-accent text-center'
                : 'bg-muthur-panel text-muthur-secondary mr-4'
            }`}
          >
            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="text-center text-muthur-border animate-pulse">
            PROCESSING...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 border-t border-muthur-border">
        <div className="text-xs text-muthur-border mb-1">
          Tip: Use # prefix for command suggestions
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask MUTHUR..."
            className="flex-1 bg-muthur-panel border border-muthur-border px-2 py-1 text-xs text-muthur-primary focus:outline-none focus:border-muthur-primary"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-3 py-1 bg-muthur-primary text-black text-xs font-bold hover:bg-muthur-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  );
}
