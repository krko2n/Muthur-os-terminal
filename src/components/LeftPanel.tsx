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

  const getBatteryBar = (percent: number) => {
    const filled = Math.round(percent / 25);
    return '[' + '#'.repeat(filled) + '.'.repeat(4 - filled) + ']';
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  };

  const formatSpeed = (bytesPerInterval: number) => {
    const bytesPerSec = bytesPerInterval / 2;
    if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`;
    if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`;
  };

  return (
    <div className="w-1/4 flex flex-col gap-2">
      {/* Status Bar - Battery, System, Time */}
      <div className="panel shrink-0">
        <div className="p-3 text-xs space-y-1 font-mono">
          <div className="flex justify-between items-center">
            <span className="text-muthur-secondary">TIME:</span>
            <span className="text-muthur-primary text-sm tabular-nums">
              {time.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muthur-secondary">DATE:</span>
            <span className="text-muthur-primary">
              {time.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muthur-secondary">SYSTEM:</span>
            <span className="text-muthur-primary">ONLINE</span>
          </div>
          {systemStats?.battery?.present && (
            <div className="flex justify-between items-center">
              <span className="text-muthur-secondary">BAT:</span>
              <span className={systemStats.battery.percent <= 15 ? 'text-red-500' : systemStats.battery.percent <= 30 ? 'text-yellow-400' : 'text-muthur-primary'}>
                {getBatteryBar(systemStats.battery.percent)} {systemStats.battery.percent}%
                {systemStats.battery.charging ? ' CHG' : ''}
              </span>
            </div>
          )}
          {systemStats?.uptime && (
            <div className="flex justify-between items-center">
              <span className="text-muthur-secondary">UPTIME:</span>
              <span className="text-muthur-primary">{formatUptime(systemStats.uptime)}</span>
            </div>
          )}
        </div>
      </div>

      {/* System Diagnostics */}
      <div className="panel flex-1 flex flex-col min-h-0">
        <div className="panel-header">SYSTEM DIAGNOSTICS</div>
        <div className="p-4 flex-1 overflow-auto text-xs space-y-4 scrollbar-thin">
          {systemStats ? (
            <>
              <div>
                <div className="text-muthur-secondary mb-1">CPU USAGE</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muthur-border rounded overflow-hidden">
                    <div
                      className="h-full bg-muthur-primary transition-all"
                      style={{ width: `${systemStats.cpu_usage}%` }}
                    />
                  </div>
                  <span className="text-muthur-primary w-12 text-right">
                    {systemStats.cpu_usage.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div>
                <div className="text-muthur-secondary mb-1">MEMORY USAGE</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muthur-border rounded overflow-hidden">
                    <div
                      className="h-full bg-muthur-secondary transition-all"
                      style={{ width: `${systemStats.memory_percent}%` }}
                    />
                  </div>
                  <span className="text-muthur-secondary w-12 text-right">
                    {systemStats.memory_percent.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-muthur-border mt-1">
                  {(systemStats.memory_used / 1024 / 1024 / 1024).toFixed(2)} GB /{' '}
                  {(systemStats.memory_total / 1024 / 1024 / 1024).toFixed(2)} GB
                </div>
              </div>

              <div>
                <div className="text-muthur-secondary mb-2">TOP PROCESSES</div>
                <div className="space-y-1">
                  {systemStats.processes.slice(0, 8).map((proc: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs gap-1">
                      <span className="truncate flex-1">{proc.name}</span>
                      <span className="text-muthur-border w-16 text-right">
                        {formatBytes(proc.memory)}
                      </span>
                      <span className="text-muthur-primary w-12 text-right">
                        {proc.cpu_usage.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-muthur-secondary mb-1">NETWORK</div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>RX:</span>
                    <span className="text-muthur-primary">
                      {formatBytes(systemStats.network.received)}
                      {' '}
                      <span className="text-muthur-border">
                        ({formatSpeed(systemStats.network.rx_speed)})
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>TX:</span>
                    <span className="text-muthur-secondary">
                      {formatBytes(systemStats.network.transmitted)}
                      {' '}
                      <span className="text-muthur-border">
                        ({formatSpeed(systemStats.network.tx_speed)})
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {systemStats.disk && systemStats.disk.length > 0 && (
                <div>
                  <div className="text-muthur-secondary mb-1">DISK</div>
                  <div className="text-xs space-y-1">
                    {systemStats.disk.slice(0, 3).map((d: any, i: number) => (
                      <div key={i}>
                        <div className="flex justify-between">
                          <span className="truncate">{d.mount_point}</span>
                          <span className="text-muthur-primary">{d.used_percent.toFixed(0)}%</span>
                        </div>
                        <div className="h-1 bg-muthur-border rounded overflow-hidden mt-0.5">
                          <div
                            className="h-full bg-muthur-primary transition-all"
                            style={{ width: `${d.used_percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-muthur-border">
              INITIALIZING...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
