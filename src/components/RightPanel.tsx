import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Globe from './Globe';
import AIPanel from './AIPanel';
import NetworkStatus from './NetworkStatus';
import { GlobeIcon, AIIcon } from './SystemIcons';

export default function RightPanel() {
  const [systemStats, setSystemStats] = useState<any>(null);

  useEffect(() => {
    const update = async () => {
      try {
        const stats = await invoke('get_system_stats');
        setSystemStats(stats);
      } catch {}
    };
    update();
    const interval = setInterval(update, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col py-[1.5vh] px-[1vh] gap-[0.8vh] min-h-0">
      {/* Network Status */}
      <div className="shrink-0">
        <NetworkStatus systemStats={systemStats} />
      </div>

      {/* Globe */}
      <div className="h-[24vh] shrink-0 flex flex-col">
        <div className="text-[1.3vh] tracking-widest opacity-50 mb-[0.3vh] flex items-center gap-[0.5vh]">
          <GlobeIcon size={14} color="rgba(0,255,65,0.5)" />
          GLOBAL NETWORK MAP
        </div>
        <div className="flex-1 min-h-0">
          <Globe />
        </div>
      </div>

      {/* AI Chat */}
      <div className="flex-1 min-h-0 flex flex-col">
        <AIPanel />
      </div>
    </div>
  );
}
