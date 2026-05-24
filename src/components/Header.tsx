import { useEffect, useState } from 'react';

export default function Header() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-12 border-b border-muthur-border bg-muthur-panel flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold text-glow">MUTHUR://CORE</div>
        <div className="text-xs text-muthur-secondary">v0.1.0 ALPHA</div>
      </div>

      <div className="flex items-center gap-6">
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
