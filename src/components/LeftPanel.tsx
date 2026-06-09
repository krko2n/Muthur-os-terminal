import { useEffect, useState } from 'react';
import { CpuIcon, MemoryIcon } from './SystemIcons';
import MuthurLogo from './MuthurLogo';

interface LeftPanelProps {
  systemStats: any;
}

export default function LeftPanel({ systemStats }: LeftPanelProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col p-3 gap-3 overflow-hidden">
      {/* Logo + Clock */}
      <div className="shrink-0 flex items-center justify-center gap-2 mb-1">
        <MuthurLogo size={28} color="#00ff41" shadowColor="rgba(0,255,65,0.08)" />
      </div>
      <div className="shrink-0">
        <div className="text-5xl font-mono tabular-nums text-muthur-primary text-glow leading-none text-center">
          {time.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </div>

      {/* System Info */}
      <div className="shrink-0 text-xs font-mono text-muthur-secondary space-y-0.5">
        <div className="flex justify-between">
          <span>{time.getFullYear()}</span>
          <span>UPTIME {systemStats?.uptime ? formatUptime(systemStats.uptime) : '--'}</span>
        </div>
        <div className="flex justify-between">
          <span>{time.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()}</span>
          <span>{systemStats?.battery?.present ? `BAT ${systemStats.battery.percent}%` : 'AC POWER'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muthur-primary">SYSTEM</span>
          <span className="text-muthur-primary">ONLINE</span>
        </div>
      </div>

      {/* CPU */}
      <div className="shrink-0">
        <div className="text-xs tracking-wider opacity-50 mb-1 flex items-center gap-1">
          <CpuIcon size={12} color="rgba(0,255,65,0.5)" />
          CPU USAGE
        </div>
        {systemStats ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-[rgba(0,255,65,0.08)] overflow-hidden">
              <div
                className="h-full bg-muthur-primary transition-all duration-500"
                style={{ width: `${systemStats.cpu_usage}%` }}
              />
            </div>
            <span className="text-sm text-muthur-primary tabular-nums min-w-[3ch] text-right">
              {systemStats.cpu_usage.toFixed(0)}%
            </span>
          </div>
        ) : (
          <div className="text-xs opacity-30">--</div>
        )}
      </div>

      {/* Memory */}
      <div className="shrink-0">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-xs tracking-wider opacity-50 flex items-center gap-1">
            <MemoryIcon size={12} color="rgba(0,255,65,0.5)" />
            MEMORY
          </span>
          {systemStats && (
            <span className="text-[11px] text-muthur-secondary">
              {(systemStats.memory_used / 1024 / 1024 / 1024).toFixed(1)} / {(systemStats.memory_total / 1024 / 1024 / 1024).toFixed(1)} GiB
            </span>
          )}
        </div>
        {systemStats && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-[rgba(0,255,65,0.08)] overflow-hidden">
              <div
                className="h-full bg-muthur-secondary transition-all duration-500"
                style={{ width: `${systemStats.memory_percent}%` }}
              />
            </div>
            <span className="text-sm text-muthur-secondary tabular-nums min-w-[3ch] text-right">
              {systemStats.memory_percent.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Top Processes */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="text-xs tracking-wider opacity-50 mb-1 shrink-0">TOP PROCESSES</div>
        <div className="flex text-[10px] opacity-40 mb-0.5 shrink-0">
          <span className="w-10">PID</span>
          <span className="flex-1">NAME</span>
          <span className="w-8 text-right">CPU</span>
          <span className="w-10 text-right">MEM</span>
        </div>
        <div className="flex-1 overflow-hidden">
          {systemStats?.processes?.slice(0, 10).map((proc: any, i: number) => (
            <div key={i} className="flex text-xs py-px">
              <span className="w-10 text-muthur-secondary opacity-50 tabular-nums">{proc.pid}</span>
              <span className="flex-1 truncate text-muthur-secondary">{proc.name}</span>
              <span className="w-8 text-right text-muthur-primary tabular-nums">{proc.cpu_usage.toFixed(0)}%</span>
              <span className="w-10 text-right text-muthur-secondary opacity-50 tabular-nums">
                {(proc.memory / 1024 / 1024).toFixed(0)}M
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
