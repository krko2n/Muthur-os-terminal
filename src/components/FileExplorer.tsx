import { useState, useEffect } from 'react';

interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: number;
}

const FILE_ICONS: Record<string, string> = {
  // Directories
  dir: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>`,
  // Code files
  ts: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><text x="12" y="15" text-anchor="middle" font-size="7" fill="currentColor" stroke="none">TS</text></svg>`,
  js: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><text x="12" y="15" text-anchor="middle" font-size="7" fill="currentColor" stroke="none">JS</text></svg>`,
  json: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><text x="12" y="15" text-anchor="middle" font-size="6" fill="currentColor" stroke="none">{}</text></svg>`,
  rs: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><text x="12" y="15" text-anchor="middle" font-size="7" fill="currentColor" stroke="none">Rs</text></svg>`,
  toml: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="14" y2="12"/><line x1="7" y1="16" x2="11" y2="16"/></svg>`,
  // Config/data
  yaml: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="14" y2="12"/></svg>`,
  // Text/docs
  md: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><text x="12" y="15" text-anchor="middle" font-size="6" fill="currentColor" stroke="none">MD</text></svg>`,
  txt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>`,
  // Shell
  sh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="7,8 10,12 7,16"/><line x1="12" y1="16" x2="17" y2="16"/></svg>`,
  // HTML/CSS
  html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="7,7 3,12 7,17"/><polyline points="17,7 21,12 17,17"/><line x1="14" y1="4" x2="10" y2="20"/></svg>`,
  css: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><text x="12" y="15" text-anchor="middle" font-size="6" fill="currentColor" stroke="none">CSS</text></svg>`,
  // Images
  png: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="M21 15l-5-5L5 21"/></svg>`,
  // Lock/config
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
  // Default
  default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>`,
  // Go up
  up: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 18l-6-6 6-6"/><text x="16" y="14" font-size="6" fill="currentColor" stroke="none">..</text></svg>`,
};

function getIcon(entry: FileEntry): string {
  if (entry.is_dir) return FILE_ICONS.dir;
  const ext = entry.name.split('.').pop()?.toLowerCase() || '';
  if (entry.name.includes('lock')) return FILE_ICONS.lock;
  return FILE_ICONS[ext] || FILE_ICONS.default;
}

export default function FileExplorer() {
  const [currentPath, setCurrentPath] = useState('');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initPath();
  }, []);

  const initPath = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const dir = await invoke('get_current_dir') as string;
      loadDirectory(dir);
    } catch {
      loadDirectory('/home');
    }
  };

  const loadDirectory = async (path: string) => {
    setLoading(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke('list_directory', { path }) as FileEntry[];
      setEntries(result.sort((a, b) => {
        if (a.is_dir && !b.is_dir) return -1;
        if (!a.is_dir && b.is_dir) return 1;
        return a.name.localeCompare(b.name);
      }));
      setCurrentPath(path);
    } catch (error) {
      console.error('Failed to load directory:', error);
    }
    setLoading(false);
  };

  const handleEntryClick = (entry: FileEntry) => {
    if (entry.is_dir) {
      loadDirectory(entry.path);
    }
  };

  const goUp = () => {
    const normalized = currentPath.replace(/\\/g, '/');
    const parts = normalized.split('/');
    if (parts.length > 1) {
      parts.pop();
      loadDirectory(parts.join('/') || '/');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-[1vh] py-[0.4vh] border-b border-[rgba(0,255,65,0.15)] shrink-0">
        <span className="text-[1.3vh] tracking-widest opacity-60">FILESYSTEM</span>
        <span className="text-[1.1vh] text-muthur-secondary opacity-40 truncate ml-4">
          {currentPath}
        </span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto scrollbar-thin p-[1vh]">
        {loading ? (
          <div className="flex items-center justify-center h-full opacity-30 text-[1.4vh]">
            LOADING...
          </div>
        ) : (
          <div
            className="grid gap-[1vh]"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(8vh, 1fr))', gridAutoRows: '8vh' }}
          >
            {/* Go up button */}
            <div
              onClick={goUp}
              className="flex flex-col items-center justify-center hover:bg-[rgba(0,255,65,0.05)] transition-colors rounded text-muthur-primary"
            >
              <div
                className="w-[4.5vh] h-[4.5vh] mb-[0.3vh]"
                dangerouslySetInnerHTML={{ __html: FILE_ICONS.up }}
              />
              <span className="text-[1.1vh] opacity-70">Go up</span>
            </div>

            {/* Files */}
            {entries.map((entry, i) => (
              <div
                key={i}
                onClick={() => handleEntryClick(entry)}
                className={`
                  flex flex-col items-center justify-center
                  hover:bg-[rgba(0,255,65,0.05)] transition-colors rounded
                  ${entry.is_dir ? 'text-muthur-secondary' : 'text-muthur-primary'}
                `}
              >
                <div
                  className="w-[4.5vh] h-[4.5vh] mb-[0.3vh]"
                  dangerouslySetInnerHTML={{ __html: getIcon(entry) }}
                />
                <span className="text-[1.1vh] max-w-full truncate px-[0.2vh] text-center opacity-80">
                  {entry.name.length > 12 ? entry.name.slice(0, 10) + '..' : entry.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
