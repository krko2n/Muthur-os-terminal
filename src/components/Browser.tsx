import { useState, useRef } from 'react';

export default function Browser() {
  const [url, setUrl] = useState('https://duckduckgo.com');
  const [inputUrl, setInputUrl] = useState('https://duckduckgo.com');
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const navigate = (targetUrl: string) => {
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
          onClick={() => iframeRef.current?.contentWindow?.history.back()}
          className="px-2 py-0.5 text-xs text-muthur-secondary hover:text-muthur-primary border border-muthur-border hover:border-muthur-primary transition-colors"
        >
          &lt;
        </button>
        <button
          onClick={() => iframeRef.current?.contentWindow?.history.forward()}
          className="px-2 py-0.5 text-xs text-muthur-secondary hover:text-muthur-primary border border-muthur-border hover:border-muthur-primary transition-colors"
        >
          &gt;
        </button>
        <button
          onClick={() => navigate(url)}
          className="px-2 py-0.5 text-xs text-muthur-secondary hover:text-muthur-primary border border-muthur-border hover:border-muthur-primary transition-colors"
        >
          ↻
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

      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muthur-bg z-10">
            <span className="text-muthur-border animate-pulse text-xs">LOADING MODULE...</span>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={url}
          className="w-full h-full border-0 bg-black"
          onLoad={() => setLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          title="MUTHUR Browser"
        />
      </div>
    </div>
  );
}
