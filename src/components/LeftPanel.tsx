import { useEffect, useState } from 'react';

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
    <div className="w-[17%] flex flex-col gap-[0.5vh] shrink-0 py-[1vh] px-[0.5vh]">
      {/* Clock */}
      <div className="text-center mb-[0.5vh]">
        <div className="text-[5vh] font-mono tabular-nums text-muthur-primary text-glow leading-none">
          {time.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </div>

      {/* System Info */}
      <div className="text-[1.2vh] font-mono space-y-[0.3vh] opacity-80">
        <div className="flex justify-between">
          <span>{time.getFullYear()}</span>
          <span>UPTIME</span>
          <span>{systemStats?.uptime ? formatUptime(systemStats.uptime) : '--'}</span>
        </div>
        <div className="flex justify-between">
          <span>{time.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()}</span>
          <span>{systemStats?.battery?.present ? `BAT ${systemStats.battery.percent}%` : 'AC'}</span>
          <span>ONLINE</span>
        </div>
      </div>

      {/* CPU */}
      <div className="mt-[1vh]">
        <div className="text-[1.1vh] tracking-widest opacity-60 mb-[0.5vh]">CPU USAGE</div>
        {systemStats ? (
          <div className="space-y-[0.5vh]">
            <div className="flex items-center gap-[1vh]">
              <div className="flex-1 h-[0.8vh] bg-muthur-faint overflow-hidden">
                <div
                  className="h-full bg-muthur-primary transition-all duration-500"
                  style={{ width: `${systemStats.cpu_usage}%` }}
                />
              </div>
              <span className="text-[1.4vh] text-muthur-primary tabular-nums w-[4vh] text-right">
                {systemStats.cpu_usage.toFixed(0)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="text-[1.2vh] opacity-30">--</div>
        )}
      </div>

      {/* Memory */}
      <div className="mt-[1vh]">
        <div className="flex justify-between items-baseline">
          <span className="text-[1.1vh] tracking-widest opacity-60">MEMORY</span>
          {systemStats && (
            <span className="text-[1vh] text-muthur-secondary opacity-70">
              {(systemStats.memory_used / 1024 / 1024 / 1024).toFixed(1)} OF {(systemStats.memory_total / 1024 / 1024 / 1024).toFixed(1)} GiB
            </span>
          )}
        </div>
        {systemStats && (
          <div className="flex items-center gap-[1vh] mt-[0.5vh]">
            <div className="flex-1 h-[0.8vh] bg-muthur-faint overflow-hidden">
              <div
                className="h-full bg-muthur-secondary transition-all duration-500"
                style={{ width: `${systemStats.memory_percent}%` }}
              />
            </div>
            <span className="text-[1.4vh] text-muthur-secondary tabular-nums w-[4vh] text-right">
              {systemStats.memory_percent.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Top Processes */}
      <div className="mt-[1vh] flex-1 min-h-0 flex flex-col">
        <div className="text-[1.1vh] tracking-widest opacity-60 mb-[0.5vh]">
          TOP PROCESSES
        </div>
        <div className="flex text-[0.9vh] opacity-40 mb-[0.3vh] gap-[0.5vh]">
          <span className="w-[5vh]">PID</span>
          <span className="flex-1">NAME</span>
          <span className="w-[4vh] text-right">CPU</span>
          <span className="w-[5vh] text-right">MEM</span>
        </div>
        <div className="flex-1 overflow-auto scrollbar-thin">
          {systemStats?.processes?.slice(0, 10).map((proc: any, i: number) => (
            <div key={i} className="flex text-[1.1vh] gap-[0.5vh] py-[0.15vh]">
              <span className="w-[5vh] text-muthur-secondary opacity-60 tabular-nums">{proc.pid}</span>
              <span className="flex-1 truncate text-muthur-secondary">{proc.name}</span>
              <span className="w-[4vh] text-right text-muthur-primary tabular-nums">{proc.cpu_usage.toFixed(0)}%</span>
              <span className="w-[5vh] text-right text-muthur-secondary opacity-60 tabular-nums">
                {(proc.memory / 1024 / 1024).toFixed(0)}M
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
