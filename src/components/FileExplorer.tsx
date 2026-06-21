import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FileSystemIcon } from './SystemIcons';
import { playSound } from '../audio';

interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: number;
}

function FileIcon({ type }: { type: string }) {
  const props = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, className: "w-full h-full" };

  switch (type) {
    case 'dir':
      return <svg {...props}><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>;
    case 'ts':
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><text x="12" y="15" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none">TS</text></svg>;
    case 'js':
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><text x="12" y="15" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none">JS</text></svg>;
    case 'json':
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><text x="12" y="15" textAnchor="middle" fontSize="6" fill="currentColor" stroke="none">{'{}'}</text></svg>;
    case 'rs':
      return <svg {...props}><circle cx="12" cy="12" r="9"/><text x="12" y="15" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none">Rs</text></svg>;
    case 'toml':
    case 'yaml':
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="14" y2="12"/><line x1="7" y1="16" x2="11" y2="16"/></svg>;
    case 'md':
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><text x="12" y="15" textAnchor="middle" fontSize="6" fill="currentColor" stroke="none">MD</text></svg>;
    case 'sh':
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="7,8 10,12 7,16"/><line x1="12" y1="16" x2="17" y2="16"/></svg>;
    case 'html':
      return <svg {...props}><polyline points="7,7 3,12 7,17"/><polyline points="17,7 21,12 17,17"/><line x1="14" y1="4" x2="10" y2="20"/></svg>;
    case 'css':
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><text x="12" y="15" textAnchor="middle" fontSize="6" fill="currentColor" stroke="none">CSS</text></svg>;
    case 'png':
    case 'jpg':
    case 'svg':
      return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="M21 15l-5-5L5 21"/></svg>;
    case 'lock':
      return <svg {...props}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
    case 'up':
      return <svg {...props}><path d="M15 18l-6-6 6-6"/><text x="16" y="14" fontSize="6" fill="currentColor" stroke="none">..</text></svg>;
    default:
      return <svg {...props}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>;
  }
}

function getIconType(entry: FileEntry): string {
  if (entry.is_dir) return 'dir';
  const ext = entry.name.split('.').pop()?.toLowerCase() || '';
  if (entry.name.includes('lock')) return 'lock';
  return ext;
}

interface DiskUsage {
  mount_point: string;
  total: number;
  available: number;
  used_percent: number;
}

export default function FileExplorer() {
  const [currentPath, setCurrentPath] = useState('');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [listView, setListView] = useState(false);
  const [diskUsage, setDiskUsage] = useState<DiskUsage | null>(null);

  useEffect(() => {
    initPath();
  }, []);

  // Ctrl+Shift+L toggles list/grid view
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setListView(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Listen for CWD changes from shell (OSC 7)
  useEffect(() => {
    const handleCwdChange = (e: Event) => {
      const path = (e as CustomEvent).detail;
      if (path && path !== currentPath) {
        loadDirectory(path);
      }
    };
    window.addEventListener('cwd-change', handleCwdChange);
    return () => window.removeEventListener('cwd-change', handleCwdChange);
  }, [currentPath]);

  const initPath = async () => {
    try {
      const dir = await invoke('get_current_dir') as string;
      loadDirectory(dir);
    } catch {
      loadDirectory('/home');
    }
  };

  const loadDirectory = async (path: string) => {
    setLoading(true);
    try {
      const result = await invoke('list_directory', { path }) as FileEntry[];
      setEntries(result.sort((a, b) => {
        if (a.is_dir && !b.is_dir) return -1;
        if (!a.is_dir && b.is_dir) return 1;
        return a.name.localeCompare(b.name);
      }));
      setCurrentPath(path);
      try {
        const stats = await invoke('get_system_stats') as any;
        if (stats?.disk?.length > 0) {
          const match = stats.disk
            .filter((d: any) => path.startsWith(d.mount_point))
            .sort((a: any, b: any) => b.mount_point.length - a.mount_point.length)[0];
          if (match) setDiskUsage(match);
        }
      } catch {}
    } catch (error) {
      console.error('Failed to load directory:', error);
    }
    setLoading(false);
  };

  const handleEntryClick = async (entry: FileEntry) => {
    if (entry.is_dir) {
      loadDirectory(entry.path);
      playSound('folder', 0.12);
      window.dispatchEvent(new CustomEvent('fs-cd', { detail: entry.path }));
    } else {
      try {
        await invoke('open_file_external', { path: entry.path });
        playSound('expand', 0.12);
      } catch (e) {
        console.error('Failed to open file externally:', e);
      }
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
        <span className="text-[1.3vh] tracking-widest opacity-60 flex items-center gap-[0.5vh]">
          <FileSystemIcon size={14} color="rgba(0,255,65,0.5)" />
          FILE MANAGER
        </span>
        <div className="flex items-center gap-[1vh]">
          <button
            onClick={() => setListView(prev => !prev)}
            className="text-[1.05vh] text-muthur-secondary opacity-65 hover:opacity-100 border border-[rgba(0,255,65,0.15)] px-[0.55vh] py-[0.15vh]"
          >
            {listView ? 'GRID' : 'LIST'}
          </button>
          <span className="text-[1.05vh] text-muthur-secondary opacity-60 truncate max-w-[15vh]">
            {currentPath}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto scrollbar-thin p-[1vh]">
        {loading ? (
          <div className="flex items-center justify-center h-full opacity-30 text-[1.4vh]">
            LOADING...
          </div>
        ) : listView ? (
          <div className="flex flex-col gap-[0.3vh]">
            <div
              onClick={goUp}
              className="flex items-center gap-[1vh] px-[0.5vh] py-[0.3vh] hover:bg-[rgba(0,255,65,0.05)] text-muthur-primary"
            >
              <div className="w-[2vh] h-[2vh] shrink-0"><FileIcon type="up" /></div>
              <span className="text-[1.2vh]">..</span>
            </div>
            {entries.map((entry, i) => (
              <div
                key={i}
                onClick={() => handleEntryClick(entry)}
                className={`flex items-center gap-[1vh] px-[0.5vh] py-[0.3vh] hover:bg-[rgba(0,255,65,0.05)] ${entry.is_dir ? 'text-muthur-secondary' : 'text-muthur-primary'}`}
                style={{ opacity: 0, animation: `fadeIn 0.2s ease forwards`, animationDelay: `${i * 20}ms` }}
              >
                <div className="w-[2vh] h-[2vh] shrink-0"><FileIcon type={getIconType(entry)} /></div>
                <span className="text-[1.2vh] flex-1 truncate">{entry.name}</span>
                <span className="text-[1.05vh] opacity-55 tabular-nums w-[6vh] text-right">
                  {entry.is_dir ? 'DIR' : entry.size > 1024*1024 ? `${(entry.size/1024/1024).toFixed(1)}M` : entry.size > 1024 ? `${(entry.size/1024).toFixed(0)}K` : `${entry.size}B`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="grid gap-[1vh]"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(8vh, 1fr))', gridAutoRows: '8vh' }}
          >
            <div
              onClick={goUp}
              className="flex flex-col items-center justify-center hover:bg-[rgba(0,255,65,0.05)] transition-colors rounded text-muthur-primary"
            >
              <div className="w-[4.5vh] h-[4.5vh] mb-[0.3vh]"><FileIcon type="up" /></div>
              <span className="text-[1.1vh] opacity-70">..</span>
            </div>
            {entries.map((entry, i) => (
              <div
                key={i}
                onClick={() => handleEntryClick(entry)}
                className={`flex flex-col items-center justify-center hover:bg-[rgba(0,255,65,0.05)] transition-all rounded ${entry.is_dir ? 'text-muthur-secondary' : 'text-muthur-primary'}`}
                style={{ opacity: 0, animation: `fadeIn 0.3s ease forwards`, animationDelay: `${i * 30}ms` }}
              >
                <div className="w-[4.5vh] h-[4.5vh] mb-[0.3vh]"><FileIcon type={getIconType(entry)} /></div>
                <span className="text-[1.1vh] max-w-full truncate px-[0.2vh] text-center opacity-80">
                  {entry.name.length > 12 ? entry.name.slice(0, 10) + '..' : entry.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disk usage bar */}
      {diskUsage && (
        <div className="shrink-0 px-[1vh] py-[0.4vh] border-t border-[rgba(0,255,65,0.15)]">
          <div className="flex items-center gap-[1vh] text-[1.0vh]">
            <span className="text-muthur-secondary opacity-50 shrink-0">{diskUsage.mount_point}</span>
            <div className="flex-1 h-[0.6vh] bg-[rgba(0,255,65,0.08)] rounded-sm overflow-hidden">
              <div
                className="h-full bg-muthur-primary transition-all duration-500"
                style={{ width: `${diskUsage.used_percent}%` }}
              />
            </div>
            <span className="text-muthur-primary tabular-nums shrink-0">{diskUsage.used_percent.toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
