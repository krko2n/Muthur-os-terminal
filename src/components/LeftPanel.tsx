import { useEffect, useState, useRef, useCallback } from 'react';
import { CpuIcon, StorageIcon } from './SystemIcons';
import HardwareInspector from './HardwareInspector';

interface LeftPanelProps {
  systemStats: any;
}

const CPU_HISTORY_LEN = 60;

export default function LeftPanel({ systemStats }: LeftPanelProps) {
  const [time, setTime] = useState(new Date());
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(CPU_HISTORY_LEN).fill(0));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (systemStats?.cpu_usage != null) {
      setCpuHistory(prev => [...prev.slice(1), systemStats.cpu_usage]);
    }
  }, [systemStats?.cpu_usage]);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const root = getComputedStyle(document.documentElement);
    const accent = root.getPropertyValue('--color-accent').trim() || '#00ff41';
    const r = root.getPropertyValue('--color-r').trim() || '0';
    const g = root.getPropertyValue('--color-g').trim() || '255';
    const b = root.getPropertyValue('--color-b').trim() || '65';

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.15)`;
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 4; i++) {
      const y = (i / 4) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.4)`;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    for (let i = 0; i < cpuHistory.length; i++) {
      const x = (i / (cpuHistory.length - 1)) * w;
      const y = h - (cpuHistory[i] / 100) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.05)`;
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  }, [cpuHistory]);

  useEffect(() => { drawChart(); }, [drawChart]);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  const disks = systemStats?.disk?.slice(0, 3) || [];

  return (
    <div className="h-full flex flex-col p-3 gap-2 overflow-hidden">
      {/* Clock */}
      <div className="shrink-0">
        <div className="text-4xl font-mono tabular-nums text-muthur-primary text-glow leading-none text-center">
          {time.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </div>

      {/* System Info */}
      <div className="shrink-0 text-[10px] font-mono text-muthur-secondary space-y-0.5">
        <div className="flex justify-between">
          <span>{time.getFullYear()}.{String(time.getMonth()+1).padStart(2,'0')}.{String(time.getDate()).padStart(2,'0')}</span>
          <span>UP {systemStats?.uptime ? formatUptime(systemStats.uptime) : '--'}</span>
        </div>
        <div className="flex justify-between">
          <span>{systemStats?.battery?.present ? `BAT ${systemStats.battery.percent}%` : 'AC'}</span>
          <span className="text-muthur-primary">ONLINE</span>
        </div>
      </div>

      {/* Hardware Inspector */}
      <HardwareInspector />

      {/* CPU Chart */}
      <div className="shrink-0">
        <div className="text-[10px] tracking-wider opacity-50 mb-1 flex items-center justify-between panel-header-bracket border-t border-[rgba(0,255,65,0.15)] pt-1">
          <span className="flex items-center gap-1">
            <CpuIcon size={10} color="rgba(0,255,65,0.5)" />
            CPU
          </span>
          <span className="text-muthur-primary tabular-nums">
            {systemStats ? `${systemStats.cpu_usage.toFixed(0)}%` : '--'}
          </span>
        </div>
        <canvas
          ref={canvasRef}
          width={200}
          height={40}
          className="w-full h-[5vh] rounded-sm"
          style={{ background: 'rgba(0,255,65,0.02)' }}
        />
      </div>

      {/* Storage */}
      <div className="shrink-0">
        <div className="text-[10px] tracking-wider opacity-50 mb-1 flex items-center justify-between panel-header-bracket border-t border-[rgba(0,255,65,0.15)] pt-1">
          <span className="flex items-center gap-1">
            <StorageIcon size={10} color="rgba(0,255,65,0.5)" />
            STORAGE
          </span>
          <span className="text-muthur-secondary tabular-nums">
            {disks.length ? `${disks.length} VOL` : '--'}
          </span>
        </div>
        <div className="space-y-[0.5vh]">
          {disks.length ? disks.map((disk: any, index: number) => (
            <div key={`${disk.mount_point}-${index}`} className="text-[10px]">
              <div className="flex justify-between text-muthur-secondary opacity-60 mb-[0.2vh]">
                <span className="truncate max-w-[12vh]">{disk.mount_point}</span>
                <span className="tabular-nums text-muthur-primary">{disk.used_percent.toFixed(0)}%</span>
              </div>
              <div className="h-[0.6vh] bg-[rgba(0,255,65,0.06)] overflow-hidden">
                <div
                  className="h-full bg-muthur-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, disk.used_percent)}%` }}
                />
              </div>
            </div>
          )) : (
            <div className="text-[10px] text-muthur-secondary opacity-40">NO VOLUMES</div>
          )}
        </div>
      </div>

      {/* Top Processes */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="text-[10px] tracking-wider opacity-50 mb-1 shrink-0 panel-header-bracket border-t border-[rgba(0,255,65,0.15)] pt-1">PROCESSES</div>
        <div className="flex text-[9px] opacity-40 mb-0.5 shrink-0">
          <span className="w-8">PID</span>
          <span className="flex-1">NAME</span>
          <span className="w-7 text-right">CPU</span>
        </div>
        <div className="flex-1 overflow-hidden">
          {systemStats?.processes?.slice(0, 8).map((proc: any, i: number) => (
            <div key={i} className="flex text-[10px] py-px">
              <span className="w-8 text-muthur-secondary opacity-50 tabular-nums">{proc.pid}</span>
              <span className="flex-1 truncate text-muthur-secondary">{proc.name}</span>
              <span className="w-7 text-right text-muthur-primary tabular-nums">{proc.cpu_usage.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
