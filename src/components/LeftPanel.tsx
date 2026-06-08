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
    const s = seconds % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatMemory = (bytes: number) => {
    return (bytes / 1024 / 1024 / 1024).toFixed(1);
  };

  return (
    <div className="w-64 flex flex-col gap-1 shrink-0">
      {/* Large Clock */}
      <div className="panel">
        <div className="p-3">
          <div className="text-4xl font-bold text-muthur-primary tabular-nums text-center tracking-wider text-glow">
            {time.toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>
      </div>

      {/* System Info Row */}
      <div className="panel">
        <div className="p-2 text-[10px] font-mono grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="text-muthur-secondary">
            {time.getFullYear()}
          </div>
          <div className="text-muthur-secondary">
            UPTIME {systemStats?.uptime ? formatUptime(systemStats.uptime) : '0:00:00'}
          </div>
          <div className="text-muthur-secondary">
            {time.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()}
          </div>
          <div className="text-muthur-secondary">
            {systemStats?.battery?.present ? (
              <span>BAT {systemStats.battery.percent}%{systemStats.battery.charging ? ' CHG' : ''}</span>
            ) : 'AC POWER'}
          </div>
          <div className="text-muthur-primary">
            SYSTEM
          </div>
          <div className="text-muthur-primary">
            ONLINE
          </div>
        </div>
      </div>

      {/* CPU */}
      <div className="panel flex-shrink-0">
        <div className="panel-header">CPU USAGE</div>
        <div className="p-2 text-[10px]">
          {systemStats ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-3 bg-muthur-border rounded overflow-hidden">
                  <div
                    className="h-full bg-muthur-primary transition-all"
                    style={{ width: `${systemStats.cpu_usage}%` }}
                  />
                </div>
                <span className="text-muthur-primary w-10 text-right">
                  {systemStats.cpu_usage.toFixed(0)}%
                </span>
              </div>
            </>
          ) : (
            <div className="text-muthur-border">--</div>
          )}
        </div>
      </div>

      {/* Memory */}
      <div className="panel flex-shrink-0">
        <div className="panel-header">
          MEMORY
          {systemStats && (
            <span className="float-right font-normal text-muthur-border">
              USING {formatMemory(systemStats.memory_used)} OF {formatMemory(systemStats.memory_total)} GiB
            </span>
          )}
        </div>
        <div className="p-2">
          {systemStats ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-muthur-border rounded overflow-hidden">
                <div
                  className="h-full bg-muthur-secondary transition-all"
                  style={{ width: `${systemStats.memory_percent}%` }}
                />
              </div>
              <span className="text-muthur-secondary text-[10px] w-10 text-right">
                {systemStats.memory_percent.toFixed(0)}%
              </span>
            </div>
          ) : (
            <div className="text-muthur-border text-[10px]">--</div>
          )}
        </div>
      </div>

      {/* Top Processes */}
      <div className="panel flex-1 flex flex-col min-h-0">
        <div className="panel-header">
          TOP PROCESSES
          <span className="float-right font-normal text-muthur-border text-[9px]">
            PID | NAME | CPU | MEM
          </span>
        </div>
        <div className="p-2 flex-1 overflow-auto text-[10px] scrollbar-thin">
          {systemStats?.processes ? (
            <div className="space-y-0.5">
              {systemStats.processes.slice(0, 8).map((proc: any, i: number) => (
                <div key={i} className="flex gap-2 font-mono">
                  <span className="text-muthur-border w-10">{proc.pid}</span>
                  <span className="text-muthur-secondary flex-1 truncate">{proc.name}</span>
                  <span className="text-muthur-primary w-8 text-right">{proc.cpu_usage.toFixed(0)}%</span>
                  <span className="text-muthur-border w-10 text-right">
                    {(proc.memory / 1024 / 1024).toFixed(0)}M
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muthur-border">LOADING...</div>
          )}
        </div>
      </div>
    </div>
  );
}
