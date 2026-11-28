import { useCallback, useEffect, useRef, useState } from 'react';
import { formatRate } from '../core/metrics';
import { useOnline } from '../hooks/useOnline';

interface NetworkStatusProps {
  systemStats: any;
}

const HISTORY_LEN = 40;

function themeRgb(): string {
  const root = getComputedStyle(document.documentElement);
  const r = root.getPropertyValue('--color-r').trim() || '0';
  const g = root.getPropertyValue('--color-g').trim() || '255';
  const b = root.getPropertyValue('--color-b').trim() || '65';
  return `${r}, ${g}, ${b}`;
}

// eDEX-UI network module: link state, current rates, and a mirrored
// download (up) / upload (down) history chart.
export default function NetworkStatus({ systemStats }: NetworkStatusProps) {
  const online = useOnline();
  const [rxHistory, setRxHistory] = useState<number[]>(() => Array(HISTORY_LEN).fill(0));
  const [txHistory, setTxHistory] = useState<number[]>(() => Array(HISTORY_LEN).fill(0));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const net = systemStats?.network;

  useEffect(() => {
    if (!net) return;
    setRxHistory(prev => [...prev.slice(1), net.rx_speed || 0]);
    setTxHistory(prev => [...prev.slice(1), net.tx_speed || 0]);
  }, [net]);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { width: w, height: h } = canvas;
    const rgb = themeRgb();
    const maxVal = Math.max(...rxHistory, ...txHistory, 1024);
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = `rgba(${rgb}, 0.15)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    const plot = (history: number[], direction: 1 | -1, alpha: number) => {
      ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      history.forEach((value, i) => {
        const x = (i / (history.length - 1)) * w;
        const y = h / 2 - direction * (value / maxVal) * (h / 2) * 0.9;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };
    plot(rxHistory, 1, 1);
    plot(txHistory, -1, 0.55);
  }, [rxHistory, txHistory]);

  useEffect(() => { drawChart(); }, [drawChart]);

  return (
    <div className="shrink-0 flex flex-col gap-[0.4vh]">
      <div className="text-[1.1vh] tracking-widest opacity-50 flex justify-between panel-header-bracket border-t border-muthur-border pt-[0.4vh]">
        <span>NETWORK</span>
        <span className={online ? 'text-muthur-primary' : 'text-muthur-accent'}>{online ? 'ONLINE' : 'OFFLINE'}</span>
      </div>
      <div className="flex justify-between text-[1.0vh] tabular-nums">
        <span className="text-muthur-primary">DOWN {net ? formatRate(net.rx_speed) : '--'}</span>
        <span className="text-muthur-secondary">UP {net ? formatRate(net.tx_speed) : '--'}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={240}
        height={40}
        aria-label="Network throughput history"
        className="w-full h-[4vh] bg-[rgba(var(--color-r),var(--color-g),var(--color-b),0.02)]"
      />
    </div>
  );
}
