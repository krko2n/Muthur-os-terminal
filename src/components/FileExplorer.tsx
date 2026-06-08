import { useState, useEffect } from 'react';

interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: number;
}

export default function FileExplorer() {
  const [currentPath, setCurrentPath] = useState('/home');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initPath();
  }, []);

  const initPath = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const dir = await invoke('get_current_dir') as string;
      const home = dir.replace(/\\/g, '/');
      loadDirectory(home);
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
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  };

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header flex items-center justify-between">
        <span>FILE SYSTEM</span>
        <button
          onClick={goUp}
          className="px-2 py-0.5 text-xs bg-muthur-border hover:bg-muthur-primary hover:text-black transition-colors"
        >
          ^ UP
        </button>
      </div>

      <div className="p-2 border-b border-muthur-border">
        <input
          type="text"
          value={currentPath}
          onChange={(e) => setCurrentPath(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadDirectory(currentPath)}
          className="w-full bg-muthur-panel border border-muthur-border px-2 py-1 text-xs text-muthur-primary focus:outline-none focus:border-muthur-primary"
        />
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muthur-border">
            LOADING...
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muthur-panel border-b border-muthur-border">
              <tr className="text-muthur-secondary">
                <th className="text-left p-2">NAME</th>
                <th className="text-right p-2">SIZE</th>
                <th className="text-right p-2">MODIFIED</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr
                  key={i}
                  onClick={() => handleEntryClick(entry)}
                  className={`hover:bg-muthur-border cursor-pointer ${
                    entry.is_dir ? 'text-muthur-secondary' : 'text-muthur-primary'
                  }`}
                >
                  <td className="p-2">
                    <span className="text-muthur-border mr-1">{entry.is_dir ? '[DIR]' : '[---]'}</span>
                    {entry.name}
                  </td>
                  <td className="text-right p-2">
                    {entry.is_dir ? '-' : formatSize(entry.size)}
                  </td>
                  <td className="text-right p-2">
                    {entry.modified
                      ? new Date(entry.modified * 1000).toLocaleDateString()
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
