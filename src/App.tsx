import { useEffect, useState, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import LeftPanel from './components/LeftPanel';
import CenterPanel from './components/CenterPanel';
import RightPanel from './components/RightPanel';
import BottomPanel from './components/BottomPanel';
import CustomCursor from './components/CustomCursor';

function App() {
  const [systemStats, setSystemStats] = useState<any>(null);
  const [leftWidth, setLeftWidth] = useState(22);
  const [rightWidth, setRightWidth] = useState(22);
  const [bottomHeight, setBottomHeight] = useState(35);
  const dragging = useRef<'left' | 'right' | 'bottom' | null>(null);

  // Suppress browser-specific behaviors (context menu, shortcuts)
  useEffect(() => {
    const preventContext = (e: Event) => e.preventDefault();
    const preventBrowserShortcuts = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && !e.shiftKey && ['r', 'l', 'p', 'u', 'g'].includes(e.key.toLowerCase())) ||
        e.key === 'F5' ||
        (e.ctrlKey && e.shiftKey && ['i', 'j'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', preventContext);
    document.addEventListener('keydown', preventBrowserShortcuts);
    return () => {
      document.removeEventListener('contextmenu', preventContext);
      document.removeEventListener('keydown', preventBrowserShortcuts);
    };
  }, []);

  useEffect(() => {
    const updateStats = async () => {
      try {
        const stats = await invoke('get_system_stats');
        setSystemStats(stats);
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (dragging.current === 'left') {
      setLeftWidth(Math.max(15, Math.min(30, (e.clientX / vw) * 100)));
    } else if (dragging.current === 'right') {
      setRightWidth(Math.max(15, Math.min(30, ((vw - e.clientX) / vw) * 100)));
    } else if (dragging.current === 'bottom') {
      setBottomHeight(Math.max(25, Math.min(50, ((vh - e.clientY) / vh) * 100)));
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
    <div className="w-screen h-screen overflow-hidden relative">
      <div className="scanline" />
      <div className="crt-overlay" />
      <CustomCursor />

      <div className="flex flex-col h-full">
        {/* Window drag region */}
        <div data-tauri-drag-region className="h-[3px] w-full shrink-0" />
        {/* Top section */}
        <div className="flex flex-1 min-h-0">
          <div style={{ width: `${leftWidth}%` }} className="shrink-0 overflow-hidden min-w-0">
            <LeftPanel systemStats={systemStats} />
          </div>

          <div
            className="w-[3px] shrink-0 hover:bg-[rgba(0,255,65,0.3)] transition-colors"
            onMouseDown={() => startDrag('left')}
          />

          <div className="flex-1 min-w-0 min-h-0">
            <CenterPanel />
          </div>

          <div
            className="w-[3px] shrink-0 hover:bg-[rgba(0,255,65,0.3)] transition-colors"
            onMouseDown={() => startDrag('right')}
          />

          <div style={{ width: `${rightWidth}%` }} className="shrink-0 overflow-hidden min-w-0">
            <RightPanel />
          </div>
        </div>

        {/* Bottom resize */}
        <div
          className="h-[3px] shrink-0 hover:bg-[rgba(0,255,65,0.3)] transition-colors"
          onMouseDown={() => startDrag('bottom')}
        />

        {/* Bottom */}
        <div style={{ height: `${bottomHeight}vh` }} className="shrink-0 overflow-hidden">
          <BottomPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
