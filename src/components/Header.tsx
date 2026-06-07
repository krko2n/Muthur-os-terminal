import { useEffect, useState } from 'react';

interface HeaderProps {
  battery?: {
    present: boolean;
    percent: number;
    charging: boolean;
  } | null;
}

export default function Header({ battery }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getBatteryColor = (percent: number) => {
    if (percent <= 15) return 'text-red-500';
    if (percent <= 30) return 'text-yellow-400';
    return 'text-muthur-primary';
  };

  const getBatteryIcon = (percent: number, charging: boolean) => {
    if (charging) return '⚡';
    if (percent > 75) return '████';
    if (percent > 50) return '███░';
    if (percent > 25) return '██░░';
    if (percent > 10) return '█░░░';
    return '░░░░';
  };

  return (
    <div className="h-12 border-b border-muthur-border bg-muthur-panel flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold text-glow">MUTHUR://CORE</div>
        <div className="text-xs text-muthur-secondary">v0.1.0 ALPHA</div>
      </div>

      <div className="flex items-center gap-6">
        {battery?.present && (
          <div className={`text-xs font-mono flex items-center gap-1 ${getBatteryColor(battery.percent)}`}>
            <span className="text-muthur-secondary">BAT:</span>
            <span className="tracking-tighter">[{getBatteryIcon(battery.percent, battery.charging)}]</span>
            <span>{battery.percent}%</span>
            {battery.charging && <span className="text-yellow-400 animate-pulse">CHG</span>}
          </div>
        )}

        <div className="text-sm">
          <span className="text-muthur-secondary">SYSTEM:</span>{' '}
          <span className="text-muthur-primary">ONLINE</span>
        </div>

        <div className="text-lg font-mono tabular-nums">
          {time.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>

        <div className="text-sm text-muthur-secondary">
          {time.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
}
