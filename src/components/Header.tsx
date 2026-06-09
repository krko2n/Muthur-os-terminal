import { useEffect, useState } from 'react';
import MuthurLogo from './MuthurLogo';

interface HeaderProps {
  systemStats?: any;
}

export default function Header({ systemStats }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cpuUsage = systemStats?.cpu_usage ?? 0;
  const memPercent = systemStats?.memory_percent ?? 0;

  return (
    <div
      data-tauri-drag-region
      className="
        h-9 shrink-0 flex items-center px-4 gap-4
        bg-[rgba(0,255,65,0.02)]
        border-b border-[rgba(0,255,65,0.15)]
        font-mono text-[11px] text-muthur-secondary
      "
    >
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-2 shrink-0">
        <MuthurLogo
          size={20}
          color="#00ff41"
          shadowColor="rgba(0,255,65,0.08)"
        />
        <div className="flex flex-col -space-y-0.5 leading-none">
          <span className="text-[11px] font-bold tracking-widest text-muthur-primary">
            MOTHER
          </span>
          <span className="text-[8px] tracking-wider text-[rgba(0,255,65,0.4)]">
            SYSTEM ONLINE
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[rgba(0,255,65,0.12)]" />

      {/* Center: Status indicators */}
      <div className="flex items-center gap-5 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] tracking-wider opacity-50">CPU</span>
          <span className={`tabular-nums text-[11px] ${cpuUsage > 80 ? 'text-muthur-accent' : 'text-muthur-primary'}`}>
            {cpuUsage.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] tracking-wider opacity-50">RAM</span>
          <span className={`tabular-nums text-[11px] ${memPercent > 85 ? 'text-muthur-accent' : 'text-muthur-secondary'}`}>
            {memPercent.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Right: Live + Clock */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-muthur-primary" />
          <span className="text-[9px] tracking-widest text-muthur-primary">LIVE</span>
        </div>
        <span className="tabular-nums text-[10px] text-[rgba(0,255,65,0.6)]">
          {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
