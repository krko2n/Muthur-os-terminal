import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { playSound } from '../audio';

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

interface NativeBrowserViewProps {
  url: string;
  onNavigate: (url: string) => void;
}

const SEARCH_HOME = 'https://lite.duckduckgo.com/lite/';

function getUrlHost(value: string) {
  try {
    return new URL(value).hostname.toUpperCase();
  } catch {
    return 'WEB VIEW';
  }
}

function getLoadingLabel(progress: number) {
  if (progress < 35) return 'RESOLVING WEB CHANNEL';
  if (progress < 68) return 'RENDERING DOCUMENT';
  if (progress < 95) return 'COMPOSING TEXT VIEW';
  return 'HANDOFF READY';
}

function formatError(value: string) {
  return value.replace(/^Error:\s*/i, '').replace(/^Request failed:\s*/i, '');
}

export default function NativeBrowserView({ url, onNavigate }: NativeBrowserViewProps) {
  const [doc, setDoc] = useState<BrowserDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const contentRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (url.trim()) {
      fetchPage(url);
    }
  }, [url]);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(() => {
      setProgress(prev => Math.min(94, prev + Math.max(2, (94 - prev) * 0.16)));
    }, 160);
    return () => window.clearInterval(timer);
  }, [loading]);

  const fetchPage = async (targetUrl: string) => {
    const target = targetUrl.trim();
    if (!target) return;

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    setLoading(true);
    setProgress(8);
    setError(null);

    try {
      const result = await invoke('fetch_url_structured', { url: target }) as BrowserDocument;
      if (requestIdRef.current !== requestId) return;
      setDoc(result);
      setProgress(100);
      playSound('granted', 0.07);
      if (contentRef.current) contentRef.current.scrollTop = 0;
    } catch (e) {
      if (requestIdRef.current !== requestId) return;
      setError(String(e));
      setDoc(null);
      playSound('error', 0.08);
    } finally {
      if (requestIdRef.current === requestId) {
        window.setTimeout(() => setLoading(false), 120);
      }
    }
  };

  const handleLinkClick = (linkUrl: string) => {
    setHistory(prev => [...prev.slice(0, historyIdx + 1), url]);
    setHistoryIdx(prev => prev + 1);
    playSound('folder', 0.08);
    onNavigate(linkUrl);
  };

  const goBack = () => {
    if (historyIdx < 0) return;
    const prevUrl = history[historyIdx];
    setHistoryIdx(prev => prev - 1);
    playSound('folder', 0.08);
    onNavigate(prevUrl);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 font-mono">
        <div className="w-full max-w-[520px]">
          <div className="flex items-center justify-between text-[10px] tracking-widest text-muthur-secondary opacity-55 mb-2">
            <span>{getUrlHost(url)}</span>
            <span className="tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div className="h-[3px] bg-[rgba(0,255,65,0.08)] overflow-hidden">
            <div
              className="h-full bg-muthur-primary transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 text-muthur-primary text-sm tracking-[0.22em] animate-pulse">
            {getLoadingLabel(progress)}
          </div>
          <div className="mt-2 text-[11px] text-muthur-secondary opacity-45 truncate">
            {url}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-5 font-mono flex items-center justify-center">
        <div className="w-full max-w-[560px]">
          <div className="text-muthur-accent text-sm tracking-[0.22em] mb-2">WEB REQUEST FAILED</div>
          <div className="text-muthur-secondary opacity-70 text-xs leading-relaxed break-words">
            {formatError(error)}
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => fetchPage(url)}
              className="px-3 py-1.5 text-[11px] tracking-widest border border-muthur-primary text-muthur-primary hover:bg-[rgba(0,255,65,0.08)] transition-colors"
            >
              RETRY
            </button>
            <button
              onClick={() => onNavigate(SEARCH_HOME)}
              className="px-3 py-1.5 text-[11px] tracking-widest border border-[rgba(0,255,65,0.22)] text-muthur-secondary hover:border-[rgba(0,255,65,0.45)] transition-colors"
            >
              SEARCH
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="font-mono text-center">
          <div className="text-muthur-primary text-sm tracking-[0.24em] opacity-65">WEB VIEW STANDBY</div>
          <button
            onClick={() => onNavigate(SEARCH_HOME)}
            className="mt-4 px-4 py-1.5 text-[11px] tracking-widest border border-[rgba(0,255,65,0.25)] text-muthur-secondary hover:text-muthur-primary hover:border-muthur-primary transition-colors"
          >
            OPEN SEARCH
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={contentRef} className="flex-1 overflow-auto p-3 font-mono text-sm scrollbar-thin">
      <div className="sticky top-0 z-10 mb-3 pb-2 border-b border-[rgba(0,255,65,0.1)] bg-[rgba(5,8,13,0.94)] backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] tracking-widest text-muthur-secondary opacity-45">
              {getUrlHost(doc.url)}
            </div>
            <div className="text-muthur-primary text-xs tracking-wider opacity-75 truncate">
              {doc.title}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            {historyIdx >= 0 && (
              <button
                onClick={goBack}
                className="text-[10px] text-muthur-secondary opacity-55 hover:opacity-100 border border-[rgba(0,255,65,0.2)] px-2 py-0.5"
              >
                BACK
              </button>
            )}
            <button
              onClick={() => fetchPage(doc.url || url)}
              className="text-[10px] text-muthur-secondary opacity-55 hover:opacity-100 border border-[rgba(0,255,65,0.2)] px-2 py-0.5"
            >
              RELOAD
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {doc.blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} onLinkClick={handleLinkClick} />
        ))}
      </div>

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
        <button
          onClick={() => block.url && onLinkClick(block.url)}
          className="text-muthur-primary hover:underline cursor-pointer text-left"
        >
          [{block.id}] {block.text}
        </button>
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
