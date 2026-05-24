import { useEffect, useState } from 'react';
import Header from './components/Header';
import LeftPanel from './components/LeftPanel';
import CenterPanel from './components/CenterPanel';
import RightPanel from './components/RightPanel';
import CustomCursor from './components/CustomCursor';

function App() {
  const [systemStats, setSystemStats] = useState<any>(null);

  useEffect(() => {
    // Update system stats every 2 seconds
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

      <div className="flex flex-col h-full">
        <Header />

        <div className="flex-1 flex overflow-hidden p-2 gap-2">
          <LeftPanel systemStats={systemStats} />
          <CenterPanel />
          <RightPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
