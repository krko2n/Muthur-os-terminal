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

  const getFileIcon = (entry: FileEntry): string => {
    if (entry.is_dir) {
      return `
 ___
|   |
|___|`;
    }
    const ext = entry.name.split('.').pop()?.toLowerCase() || '';
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
      return `
 .js
|---|
|___|`;
    }
    if (['json', 'toml', 'yaml', 'yml'].includes(ext)) {
      return `
 { }
|---|
|___|`;
    }
    if (['md', 'txt', 'doc'].includes(ext)) {
      return `
 ...
|---|
|___|`;
    }
    return `
 ---
|   |
|___|`;
  };

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header flex items-center justify-between">
        <span>FILESYSTEM</span>
        <span className="text-muthur-border font-normal text-[10px]">
          {currentPath}
        </span>
      </div>

      {/* Navigation bar */}
      <div className="flex items-center gap-2 px-2 py-1 border-b border-muthur-border">
        <button
          onClick={goUp}
          className="px-2 py-0.5 text-[10px] bg-muthur-border hover:bg-muthur-primary hover:text-black transition-colors text-muthur-primary"
        >
          ^ UP
        </button>
        <input
          type="text"
          value={currentPath}
          onChange={(e) => setCurrentPath(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadDirectory(currentPath)}
          className="flex-1 bg-muthur-bg border border-muthur-border px-2 py-0.5 text-[10px] text-muthur-primary focus:outline-none focus:border-muthur-primary"
        />
      </div>

      {/* File Grid */}
      <div className="flex-1 overflow-auto p-2 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muthur-border text-xs">
            LOADING...
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-2 lg:grid-cols-8 xl:grid-cols-10">
            {entries.map((entry, i) => (
              <div
                key={i}
                onClick={() => handleEntryClick(entry)}
                className={`
                  flex flex-col items-center p-1 rounded cursor-pointer
                  hover:bg-muthur-border/30 transition-colors text-center
                  ${entry.is_dir ? 'text-muthur-secondary' : 'text-muthur-primary'}
                `}
              >
                <pre className="text-[8px] leading-tight opacity-70 mb-0.5">
                  {getFileIcon(entry)}
                </pre>
                <span className="text-[9px] truncate w-full font-mono">
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
