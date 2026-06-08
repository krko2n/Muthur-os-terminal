import { useState, useEffect } from 'react';

interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: number;
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
      const parent = parts.join('/') || '/';
      loadDirectory(parent);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}K`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}M`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}G`;
  };

  const formatDate = (ts: number): string => {
    if (!ts) return '--';
    const d = new Date(ts * 1000);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Title bar with path */}
      <div className="flex items-center justify-between px-[0.8vh] py-[0.4vh] border-b border-[rgba(0,255,65,0.15)]">
        <span className="text-[1.1vh] tracking-widest opacity-60">FILESYSTEM</span>
        <span className="text-[1vh] text-muthur-secondary opacity-50 truncate ml-4">
          {currentPath}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-[0.5vh] px-[0.8vh] py-[0.3vh] border-b border-[rgba(0,255,65,0.1)]">
        <button
          onClick={goUp}
          className="px-[1vh] py-[0.2vh] text-[1vh] border border-[rgba(0,255,65,0.3)] text-muthur-primary hover:bg-[rgba(0,255,65,0.1)] transition-colors"
        >
          ^ UP
        </button>
        <input
          type="text"
          value={currentPath}
          onChange={(e) => setCurrentPath(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadDirectory(currentPath)}
          className="flex-1 bg-transparent border-b border-[rgba(0,255,65,0.2)] px-[0.5vh] py-[0.2vh] text-[1vh] text-muthur-primary focus:outline-none focus:border-muthur-primary"
        />
      </div>

      {/* File list - vertical tree view */}
      <div className="flex-1 overflow-auto scrollbar-thin px-[0.5vh] py-[0.3vh]">
        {loading ? (
          <div className="flex items-center justify-center h-full text-[1.2vh] opacity-30">
            LOADING...
          </div>
        ) : (
          <div className="space-y-0">
            {entries.map((entry, i) => (
              <div
                key={i}
                onClick={() => handleEntryClick(entry)}
                className="flex items-center gap-[1vh] py-[0.25vh] px-[0.3vh] hover:bg-[rgba(0,255,65,0.05)] transition-colors group"
              >
                {/* Icon */}
                <span className={`text-[1.2vh] w-[2vh] shrink-0 ${entry.is_dir ? 'text-muthur-primary' : 'text-muthur-secondary opacity-70'}`}>
                  {entry.is_dir ? '/' : '.'}
                </span>
                {/* Name */}
                <span className={`flex-1 text-[1.2vh] truncate ${entry.is_dir ? 'text-muthur-primary' : 'text-muthur-secondary'}`}>
                  {entry.name}
                </span>
                {/* Size */}
                <span className="text-[1vh] text-muthur-secondary opacity-40 w-[5vh] text-right tabular-nums shrink-0">
                  {entry.is_dir ? '--' : formatSize(entry.size)}
                </span>
                {/* Modified */}
                <span className="text-[1vh] text-muthur-secondary opacity-30 w-[8vh] text-right tabular-nums shrink-0">
                  {formatDate(entry.modified)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
