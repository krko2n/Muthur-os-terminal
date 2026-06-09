import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface LinkRef {
  id: number;
  url: string;
  text: string;
}

interface TextBlock {
  type: string;
  level?: number;
  text?: string;
  id?: number;
  url?: string;
  alt?: string;
  items?: string[];
  code?: string;
  headers?: string[];
  rows?: string[][];
}

interface BrowserDocument {
  title: string;
  url: string;
  blocks: TextBlock[];
  links: LinkRef[];
}

interface BrowserViewProps {
  url: string;
  onNavigate: (url: string) => void;
}

export default function BrowserView({ url, onNavigate }: BrowserViewProps) {
  const [doc, setDoc] = useState<BrowserDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (url) {
      fetchPage(url);
    }
  }, [url]);

  const fetchPage = async (targetUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke('fetch_url_structured', { url: targetUrl }) as BrowserDocument;
      setDoc(result);
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    } catch (e) {
      setError(String(e));
      setDoc(null);
    }
    setLoading(false);
  };

  const handleLinkClick = (linkUrl: string) => {
    setHistory(prev => [...prev.slice(0, historyIdx + 1), url]);
    setHistoryIdx(prev => prev + 1);
    onNavigate(linkUrl);
  };

  const goBack = () => {
    if (historyIdx >= 0) {
      const prevUrl = history[historyIdx];
      setHistoryIdx(prev => prev - 1);
      onNavigate(prevUrl);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muthur-secondary opacity-50 animate-pulse font-mono text-sm">
          CONNECTING...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 font-mono text-sm">
        <div className="text-muthur-accent mb-2">CONNECTION FAILED</div>
        <div className="text-muthur-secondary opacity-70">{error}</div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muthur-secondary opacity-30 text-center text-sm font-mono">
          Enter a URL or search term above
        </div>
      </div>
    );
  }

  return (
    <div ref={contentRef} className="flex-1 overflow-auto p-3 font-mono text-sm scrollbar-thin">
      {/* Page title + nav */}
      <div className="mb-3 pb-2 border-b border-[rgba(0,255,65,0.1)]">
        <div className="text-muthur-primary text-xs tracking-wider opacity-60 mb-1">
          {doc.title}
        </div>
        {historyIdx >= 0 && (
          <button
            onClick={goBack}
            className="text-[10px] text-muthur-secondary opacity-50 hover:opacity-100 border border-[rgba(0,255,65,0.2)] px-2 py-0.5"
          >
            BACK
          </button>
        )}
      </div>

      {/* Rendered blocks */}
      <div className="space-y-2">
        {doc.blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} onLinkClick={handleLinkClick} />
        ))}
      </div>

      {/* Link references */}
      {doc.links.length > 0 && (
        <div className="mt-6 pt-3 border-t border-[rgba(0,255,65,0.1)]">
          <div className="text-[10px] tracking-wider opacity-40 mb-2">REFERENCES</div>
          {doc.links.map(link => (
            <div key={link.id} className="text-xs text-muthur-secondary opacity-50 truncate">
              [{link.id}] {link.url}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BlockRenderer({ block, onLinkClick }: { block: TextBlock; onLinkClick: (url: string) => void }) {
  switch (block.type) {
    case 'Heading': {
      const sizes: Record<number, string> = {
        1: 'text-lg text-muthur-primary font-bold',
        2: 'text-base text-muthur-primary',
        3: 'text-sm text-muthur-primary',
        4: 'text-sm text-muthur-secondary',
        5: 'text-xs text-muthur-secondary',
        6: 'text-xs text-muthur-secondary opacity-70',
      };
      return (
        <div className={`${sizes[block.level || 1] || sizes[3]} tracking-wider uppercase`}>
          {block.text}
        </div>
      );
    }

    case 'Paragraph':
      return (
        <p className="text-muthur-secondary leading-relaxed whitespace-pre-wrap">
          {block.text}
        </p>
      );

    case 'Link':
      return (
        <span
          onClick={() => block.url && onLinkClick(block.url)}
          className="text-muthur-primary hover:underline cursor-pointer"
        >
          [{block.id}] {block.text}
        </span>
      );

    case 'BulletList':
      return (
        <div className="pl-3 text-muthur-secondary">
          {block.items?.map((item, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-muthur-primary opacity-50">-</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      );

    case 'OrderedList':
      return (
        <div className="pl-3 text-muthur-secondary">
          {block.items?.map((item, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-muthur-primary opacity-50 tabular-nums w-4 text-right">{i + 1}.</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      );

    case 'CodeBlock':
      return (
        <pre className="bg-[rgba(0,255,65,0.03)] border border-[rgba(0,255,65,0.1)] p-2 text-xs text-muthur-secondary overflow-x-auto">
          {block.code}
        </pre>
      );

    case 'Table':
      return (
        <div className="overflow-x-auto text-xs">
          <table className="border-collapse">
            {block.headers && block.headers.length > 0 && (
              <thead>
                <tr>
                  {block.headers.map((h, i) => (
                    <th key={i} className="text-left px-2 py-1 border-b border-[rgba(0,255,65,0.15)] text-muthur-primary">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.rows?.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-2 py-0.5 text-muthur-secondary border-b border-[rgba(0,255,65,0.05)]">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'Image':
      return <AsciiImage alt={block.alt || 'image'} url={block.url || ''} />;

    case 'BlockQuote':
      return (
        <div className="pl-3 border-l-2 border-[rgba(0,255,65,0.3)] text-muthur-secondary opacity-80 italic">
          {block.text}
        </div>
      );

    case 'Separator':
      return <hr className="border-[rgba(0,255,65,0.15)] my-2" />;

    default:
      return null;
  }
}

function AsciiImage({ alt, url }: { alt: string; url: string }) {
  const [braille, setBraille] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      setFailed(true);
      return;
    }

    setLoading(true);
    setFailed(false);

    invoke('render_image_ascii', { url })
      .then((result) => {
        setBraille(result as string);
        setLoading(false);
      })
      .catch(() => {
        setFailed(true);
        setLoading(false);
      });
  }, [url]);

  if (loading) {
    return (
      <div className="text-muthur-secondary opacity-40 text-xs py-1">
        [IMG: {alt}] rendering...
      </div>
    );
  }

  if (failed || !braille) {
    return (
      <div className="text-muthur-secondary opacity-40 text-xs py-1">
        [IMG: {alt}]
      </div>
    );
  }

  return (
    <pre className="ascii-braille my-1 leading-none">{braille}</pre>
  );
}
