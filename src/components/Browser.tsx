import { useState } from 'react';

export default function Browser() {
  const [url, setUrl] = useState('https://duckduckgo.com');
  const [inputUrl, setInputUrl] = useState('https://duckduckgo.com');
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = async (targetUrl: string) => {
    let normalized = targetUrl.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      if (normalized.includes('.') && !normalized.includes(' ')) {
        normalized = 'https://' + normalized;
      } else {
        normalized = `https://duckduckgo.com/?q=${encodeURIComponent(normalized)}`;
      }
    }
    setUrl(normalized);
    setInputUrl(normalized);
    setLoading(true);
    setError(null);

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke('fetch_url', { url: normalized }) as string;
      setContent(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setContent(null);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      navigate(inputUrl);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 p-2 border-b border-muthur-border shrink-0">
        <button
          onClick={() => navigate(url)}
          className="px-2 py-0.5 text-xs text-muthur-secondary hover:text-muthur-primary border border-muthur-border hover:border-muthur-primary transition-colors"
        >
          &lt;-
        </button>
        <button
          onClick={() => navigate(url)}
          className="px-2 py-0.5 text-xs text-muthur-secondary hover:text-muthur-primary border border-muthur-border hover:border-muthur-primary transition-colors"
        >
          [R]
        </button>
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-muthur-bg border border-muthur-border px-2 py-0.5 text-xs text-muthur-primary font-mono focus:outline-none focus:border-muthur-primary"
          placeholder="Enter URL or search..."
        />
        <button
          onClick={() => navigate(inputUrl)}
          className="px-3 py-0.5 text-xs bg-muthur-primary text-black font-bold hover:bg-muthur-secondary transition-colors"
        >
          GO
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2 text-xs font-mono scrollbar-thin">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <span className="text-muthur-border animate-pulse">FETCHING {url}...</span>
          </div>
        )}
        {error && (
          <div className="text-red-500 p-4">
            <pre className="whitespace-pre-wrap">ERROR: {error}</pre>
            <div className="mt-4 text-muthur-border">
              Note: Some sites block direct requests.
              Try searching or accessing simpler pages.
            </div>
          </div>
        )}
        {!loading && !error && content && (
          <div className="text-muthur-primary whitespace-pre-wrap break-words leading-relaxed">
            {content}
          </div>
        )}
        {!loading && !error && !content && (
          <div className="flex flex-col items-center justify-center h-full text-muthur-border gap-4">
            <pre className="text-muthur-primary text-center">{`
  __  __ _   _ _____ _   _ _   _ ____
 |  \\/  | | | |_   _| | | | | | |  _ \\
 | |\\/| | | | | | | | |_| | | | | |_) |
 | |  | | |_| | | | |  _  | |_| |  _ <
 |_|  |_|\\___/  |_| |_| |_|\\___/|_| \\_\\
            `}</pre>
            <span>Enter a URL or search term above</span>
          </div>
        )}
      </div>
    </div>
  );
}
