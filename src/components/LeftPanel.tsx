interface LeftPanelProps {
  systemStats: any;
}

export default function LeftPanel({ systemStats }: LeftPanelProps) {
  return (
    <div className="w-1/4 flex flex-col gap-2">
      {/* System Stats */}
      <div className="panel flex-1 flex flex-col">
        <div className="panel-header">SYSTEM DIAGNOSTICS</div>
        <div className="p-4 flex-1 overflow-auto text-xs space-y-4">
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
                  <span className="text-muthur-primary">
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
                  <span className="text-muthur-secondary">
                    {systemStats.memory_percent.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-muthur-border mt-1">
                  {(systemStats.memory_used / 1024 / 1024 / 1024).toFixed(2)} GB /
                  {(systemStats.memory_total / 1024 / 1024 / 1024).toFixed(2)} GB
                </div>
              </div>

              <div>
                <div className="text-muthur-secondary mb-2">TOP PROCESSES</div>
                <div className="space-y-1">
                  {systemStats.processes.slice(0, 8).map((proc: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="truncate flex-1">{proc.name}</span>
                      <span className="text-muthur-primary ml-2">
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
                      {(systemStats.network.received / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>TX:</span>
                    <span className="text-muthur-secondary">
                      {(systemStats.network.transmitted / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
              </div>
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
