import { useEffect, useState, useRef, useCallback } from 'react';
import LeftPanel from './components/LeftPanel';
import CenterPanel from './components/CenterPanel';
import RightPanel from './components/RightPanel';
import BottomPanel from './components/BottomPanel';
import CustomCursor from './components/CustomCursor';

function App() {
  const [systemStats, setSystemStats] = useState<any>(null);
  const [leftWidth, setLeftWidth] = useState(17);
  const [rightWidth, setRightWidth] = useState(17);
  const [bottomHeight, setBottomHeight] = useState(30);
  const dragging = useRef<'left' | 'right' | 'bottom' | null>(null);

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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (dragging.current === 'left') {
      const pct = Math.max(10, Math.min(30, (e.clientX / vw) * 100));
      setLeftWidth(pct);
    } else if (dragging.current === 'right') {
      const pct = Math.max(10, Math.min(30, ((vw - e.clientX) / vw) * 100));
      setRightWidth(pct);
    } else if (dragging.current === 'bottom') {
      const pct = Math.max(20, Math.min(45, ((vh - e.clientY) / vh) * 100));
      setBottomHeight(pct);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    dragging.current = null;
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const startDrag = (which: 'left' | 'right' | 'bottom') => {
    dragging.current = which;
    document.body.style.userSelect = 'none';
  };

  return (
    <div className="w-screen h-screen overflow-hidden relative crt-flicker">
      <div className="scanline" />
      <CustomCursor />

      <div className="flex flex-col h-full">
        {/* Top section */}
        <div className="flex flex-1 min-h-0">
          {/* Left panel */}
          <div style={{ width: `${leftWidth}%` }} className="shrink-0 overflow-hidden">
            <LeftPanel systemStats={systemStats} />
          </div>

          {/* Left resize handle */}
          <div
            className="w-[3px] shrink-0 hover:bg-[rgba(0,255,65,0.3)] transition-colors active:bg-muthur-primary"
            onMouseDown={() => startDrag('left')}
            style={{ cursor: 'none' }}
          />

          {/* Center */}
          <div className="flex-1 min-w-0 min-h-0">
            <CenterPanel />
          </div>

          {/* Right resize handle */}
          <div
            className="w-[3px] shrink-0 hover:bg-[rgba(0,255,65,0.3)] transition-colors active:bg-muthur-primary"
            onMouseDown={() => startDrag('right')}
            style={{ cursor: 'none' }}
          />

          {/* Right panel */}
          <div style={{ width: `${rightWidth}%` }} className="shrink-0 overflow-hidden">
            <RightPanel />
          </div>
        </div>

        {/* Bottom resize handle */}
        <div
          className="h-[3px] shrink-0 hover:bg-[rgba(0,255,65,0.3)] transition-colors active:bg-muthur-primary"
          onMouseDown={() => startDrag('bottom')}
          style={{ cursor: 'none' }}
        />

        {/* Bottom section */}
        <div style={{ height: `${bottomHeight}vh` }} className="shrink-0 overflow-hidden">
          <BottomPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
