import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface SystemStats {
  cpu_usage: number;
  memory_used: number;
  memory_total: number;
  memory_percent: number;
  uptime: number;
  disk: { name: string; mount_point: string; total: number; available: number; used_percent: number }[];
}

function formatBytes(bytes: number): string {
  const gib = bytes / 1024 / 1024 / 1024;
  if (gib >= 1) return `${gib.toFixed(1)} GiB`;
  const mib = bytes / 1024 / 1024;
  return `${mib.toFixed(0)} MiB`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const CLI_EQUIVALENTS = [
  { label: 'Status', command: 'muthur status' },
  { label: 'Config', command: 'muthur config show' },
  { label: 'Help', command: 'muthur --help' },
] as const;

export default function StatusPanel() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const data = await invoke('get_system_stats') as SystemStats;
        if (active) {
          setStats(data);
          setError(null);
        }
      } catch (err) {
        if (active) setError(String(err));
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  if (error) {
    return (
      <div className="text-[10px] text-muthur-accent opacity-70 p-2">
        STATUS UNAVAILABLE: {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-[10px] text-muthur-secondary opacity-50 p-2">
        LOADING STATUS...
      </div>
    );
  }

  return (
    <div className="text-[10px] font-mono space-y-2 p-2">
      <div className="tracking-wider opacity-50 border-b border-[rgba(0,255,65,0.15)] pb-1">
        SYSTEM STATUS
      </div>

      <div className="space-y-0.5 text-muthur-secondary">
        <Row label="MODE" value="gui" />
        <Row label="CPU" value={`${stats.cpu_usage.toFixed(1)}%`} />
        <Row label="MEM" value={`${formatBytes(stats.memory_used)} / ${formatBytes(stats.memory_total)} (${stats.memory_percent.toFixed(1)}%)`} />
        <Row label="UPTIME" value={formatUptime(stats.uptime)} />
        {stats.disk.length > 0 && (
          <Row label="DISK" value={`${stats.disk[0].mount_point} ${stats.disk[0].used_percent.toFixed(0)}% used`} />
        )}
      </div>

      <div className="tracking-wider opacity-50 border-b border-[rgba(0,255,65,0.15)] pb-1 pt-2">
        CLI EQUIVALENTS
      </div>

      <div className="space-y-0.5 text-muthur-secondary">
        {CLI_EQUIVALENTS.map((item) => (
          <div key={item.command} className="flex justify-between">
            <span className="opacity-50">{item.label}</span>
            <span className="text-muthur-primary opacity-80">{item.command}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="opacity-50">{label}</span>
      <span className="truncate ml-2">{value}</span>
    </div>
  );
}
