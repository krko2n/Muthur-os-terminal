import { useEffect, useState } from 'react';
import MuthurLogo from './MuthurLogo';
import { formatUptime, usagePercent } from '../core/metrics';

interface NativeHeaderProps {
  systemStats?: any;
}

export default function NativeHeader({ systemStats }: NativeHeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cpuUsage = systemStats?.cpu_usage ?? 0;
  const memPercent = usagePercent(systemStats?.memory_used ?? 0, systemStats?.memory_total ?? 0);
  const linked = systemStats != null;
  const power = systemStats?.battery?.present
    ? `${systemStats.battery.charging ? 'CHG' : 'BAT'} ${systemStats.battery.percent}%`
    : 'AC BUS';

  return (
    <div
      data-tauri-drag-region
      className="
        h-9 shrink-0 flex items-center px-4 gap-4
        bg-[rgba(var(--color-r),var(--color-g),var(--color-b),0.025)]
        border-b border-[rgba(var(--color-r),var(--color-g),var(--color-b),0.15)]
        font-mono text-[11px] text-muthur-secondary
      "
    >
      <div className="flex items-center gap-2 shrink-0">
        <MuthurLogo
          size={20}
          color="var(--color-accent)"
          shadowColor="rgba(0,255,65,0.08)"
        />
        <div className="flex flex-col -space-y-0.5 leading-none">
          <span className="text-[11px] font-bold tracking-widest text-muthur-primary font-display">
            MUTHUR
          </span>
          <span className="text-[8px] tracking-wider text-muthur-secondary opacity-45">
            NATIVE CORE
          </span>
        </div>
      </div>

      <div className="w-px h-5 bg-[rgba(var(--color-r),var(--color-g),var(--color-b),0.12)]" />

      <div className="flex items-center gap-5 flex-1 min-w-0">
        <HeaderMetric label="CPU" value={linked ? `${cpuUsage.toFixed(0)}%` : '--'} alert={cpuUsage > 80} />
        <HeaderMetric label="RAM" value={linked ? `${memPercent.toFixed(0)}%` : '--'} alert={memPercent > 90} />
        <HeaderMetric label="UP" value={linked ? formatUptime(systemStats.uptime ?? 0) : '--'} />
        <HeaderMetric label="PWR" value={power} />
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${linked ? 'bg-muthur-primary shadow-[0_0_8px_var(--color-accent)]' : 'bg-[rgba(var(--color-r),var(--color-g),var(--color-b),0.25)]'}`} />
          <span className={`text-[9px] tracking-widest ${linked ? 'text-muthur-primary' : 'text-muthur-secondary opacity-50'}`}>
            {linked ? 'LIVE' : 'NO LINK'}
          </span>
        </div>
        <span className="tabular-nums text-[10px] text-muthur-secondary opacity-65">
          {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

function HeaderMetric({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="text-[10px] tracking-wider opacity-50">{label}</span>
      <span className={`tabular-nums text-[11px] ${alert ? 'text-muthur-accent' : 'text-muthur-secondary'}`}>
        {value}
      </span>
    </div>
  );
}
