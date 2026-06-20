import { useState, useEffect } from 'react';

interface NetworkStatusProps {
  systemStats: any;
}

export default function NetworkStatus({ systemStats }: NetworkStatusProps) {
  const [online, setOnline] = useState(navigator.onLine);

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

  const formatSpeed = (bytes: number) => {
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB/s`;
    if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
    return `${bytes} B/s`;
  };

  const formatTotal = (bytes: number) => {
    if (bytes > 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GiB`;
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
    return `${(bytes / 1024).toFixed(0)} KiB`;
  };

  const net = systemStats?.network;

  return (
    <div className="flex flex-col gap-[0.5vh]">
      <div className="text-[1.1vh] tracking-widest opacity-50 panel-header-bracket border-t border-[rgba(0,255,65,0.15)] pt-[0.5vh]">
        NETWORK
      </div>

      <div className="flex justify-between text-[1.1vh]">
        <span className="text-muthur-secondary opacity-60">STATE</span>
        <span className={online ? 'text-muthur-primary' : 'text-[#ff4444]'}>
          {online ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      {net && (
        <>
          <div className="flex justify-between text-[1.1vh]">
            <span className="text-muthur-secondary opacity-60">DOWN</span>
            <span className="text-muthur-primary tabular-nums">{formatSpeed(net.rx_speed)}</span>
          </div>
          <div className="flex justify-between text-[1.1vh]">
            <span className="text-muthur-secondary opacity-60">UP</span>
            <span className="text-muthur-primary tabular-nums">{formatSpeed(net.tx_speed)}</span>
          </div>
          <div className="flex justify-between text-[1.0vh] opacity-40">
            <span>RX {formatTotal(net.received)}</span>
            <span>TX {formatTotal(net.transmitted)}</span>
          </div>
        </>
      )}
    </div>
  );
}
