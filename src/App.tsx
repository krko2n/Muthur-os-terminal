import { useEffect, useState } from 'react';
import LeftPanel from './components/LeftPanel';
import CenterPanel from './components/CenterPanel';
import RightPanel from './components/RightPanel';
import BottomPanel from './components/BottomPanel';
import CustomCursor from './components/CustomCursor';

function App() {
  const [systemStats, setSystemStats] = useState<any>(null);

  useEffect(() => {
    const updateStats = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const stats = await invoke('get_system_stats');
        setSystemStats(stats);
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-screen h-screen bg-muthur-bg overflow-hidden relative crt-flicker">
      <div className="scanline" />
      <CustomCursor />

      <div className="flex flex-col h-full p-1 gap-1">
        {/* Top section: left panel + center terminal + right panel */}
        <div className="flex flex-1 gap-1 min-h-0">
          <LeftPanel systemStats={systemStats} />
          <CenterPanel />
          <RightPanel />
        </div>

        {/* Bottom section: filesystem + keyboard */}
        <BottomPanel />
      </div>
    </div>
  );
}

export default App;
