import { useState, useEffect, useRef, useCallback } from 'react';

interface NetworkStatusProps {
  systemStats: any;
}

const HISTORY_LEN = 40;

export default function NetworkStatus({ systemStats }: NetworkStatusProps) {
  const [online, setOnline] = useState(navigator.onLine);
  const [rxHistory, setRxHistory] = useState<number[]>(Array(HISTORY_LEN).fill(0));
  const [txHistory, setTxHistory] = useState<number[]>(Array(HISTORY_LEN).fill(0));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    const net = systemStats?.network;
    if (net) {
      setRxHistory(prev => [...prev.slice(1), net.rx_speed || 0]);
      setTxHistory(prev => [...prev.slice(1), net.tx_speed || 0]);
    }
  }, [systemStats?.network]);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const maxRx = Math.max(...rxHistory, 1024);
    const maxTx = Math.max(...txHistory, 1024);
    const maxVal = Math.max(maxRx, maxTx);

    ctx.strokeStyle = 'rgba(0, 255, 65, 0.1)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < rxHistory.length; i++) {
      const x = (i / (rxHistory.length - 1)) * w;
      const y = (h / 2) - (rxHistory[i] / maxVal) * (h / 2) * 0.9;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < txHistory.length; i++) {
      const x = (i / (txHistory.length - 1)) * w;
      const y = (h / 2) + (txHistory[i] / maxVal) * (h / 2) * 0.9;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [rxHistory, txHistory]);

  useEffect(() => { drawChart(); }, [drawChart]);

  const formatSpeed = (bytes: number) => {
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB/s`;
    if (bytes > 1024) return `${(bytes / 1024).toFixed(0)} KB/s`;
    return `${bytes} B/s`;
  };

  const net = systemStats?.network;

  return (
    <div className="flex flex-col gap-[0.4vh]">
      <div className="text-[1.1vh] tracking-widest opacity-50 panel-header-bracket border-t border-[rgba(0,255,65,0.15)] pt-[0.4vh]">
        NETWORK
      </div>

      <div className="flex justify-between text-[1.0vh]">
        <span className="text-muthur-secondary opacity-60">STATE</span>
        <span className={online ? 'text-muthur-primary' : 'text-[#ff4444]'}>
          {online ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      {net && (
        <div className="flex justify-between text-[0.9vh]">
          <span className="text-muthur-primary tabular-nums">D: {formatSpeed(net.rx_speed)}</span>
          <span className="text-[#00d4ff] tabular-nums">U: {formatSpeed(net.tx_speed)}</span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={180}
        height={36}
        className="w-full h-[4vh] rounded-sm"
        style={{ background: 'rgba(0,255,65,0.02)' }}
      />
    </div>
  );
}
