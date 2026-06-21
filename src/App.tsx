import { useEffect, useState, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Header from './components/NativeHeader';
import LeftPanel from './components/LeftPanel';
import CenterPanel from './components/CenterPanel';
import RightPanel from './components/RightPanel';
import BottomPanel from './components/BottomPanel';
import CustomCursor from './components/CustomCursor';
import LoadingScreen from './components/LoadingScreen';
import FirstRunSetup from './components/FirstRunSetup';
import CommandPalette from './components/CommandPalette';
import ShutdownScreen from './components/ShutdownScreen';
import { configureAudio, playSound } from './audio';
import {
  applyInterfaceSettings,
  getLayoutPreset,
  InterfaceSettings,
  LayoutPresetId,
  loadInterfaceSettings,
  saveInterfaceSettings,
} from './theme';

function App() {
  const initialSettings = useRef<InterfaceSettings | null>(null);
  if (!initialSettings.current) initialSettings.current = loadInterfaceSettings();
  const loadedSettings = initialSettings.current as InterfaceSettings;

  const [booted, setBooted] = useState(false);
  const [assembled, setAssembled] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [systemStats, setSystemStats] = useState<any>(null);
  const [settings, setSettings] = useState<InterfaceSettings>(loadedSettings);
  const [leftWidth, setLeftWidth] = useState(loadedSettings.layout.leftWidth);
  const [rightWidth, setRightWidth] = useState(loadedSettings.layout.rightWidth);
  const [bottomHeight, setBottomHeight] = useState(loadedSettings.layout.bottomHeight);
  const [deckSplit, setDeckSplit] = useState(loadedSettings.layout.deckSplit);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shutdownOpen, setShutdownOpen] = useState(false);
  const dragging = useRef<'left' | 'right' | 'bottom' | null>(null);

  useEffect(() => {
    applyInterfaceSettings(settings);
    configureAudio(settings.audioEnabled, settings.audioVolume, settings.soundPack);
  }, [settings]);

  useEffect(() => {
    saveInterfaceSettings({
      ...settings,
      layout: { leftWidth, rightWidth, bottomHeight, deckSplit },
    });
  }, [settings, leftWidth, rightWidth, bottomHeight, deckSplit]);

  const updateSettings = useCallback((patch: Partial<InterfaceSettings>) => {
    const layoutPreset = patch.layoutPreset;
    if (layoutPreset && layoutPreset !== 'custom') {
      const preset = getLayoutPreset(layoutPreset);
      setLeftWidth(preset.layout.leftWidth);
      setRightWidth(preset.layout.rightWidth);
      setBottomHeight(preset.layout.bottomHeight);
      setDeckSplit(preset.layout.deckSplit);
      patch = { ...patch, layout: { ...preset.layout } };
    }
    setSettings(prev => ({ ...prev, ...patch }));
  }, []);

  const replaceSettings = useCallback((next: InterfaceSettings) => {
    setSettings(next);
    setLeftWidth(next.layout.leftWidth);
    setRightWidth(next.layout.rightWidth);
    setBottomHeight(next.layout.bottomHeight);
    setDeckSplit(next.layout.deckSplit);
  }, []);

  const updateLayout = useCallback((patch: Partial<InterfaceSettings['layout']>) => {
    const nextLayout = { leftWidth, rightWidth, bottomHeight, deckSplit, ...patch };
    if (patch.leftWidth != null) setLeftWidth(patch.leftWidth);
    if (patch.rightWidth != null) setRightWidth(patch.rightWidth);
    if (patch.bottomHeight != null) setBottomHeight(patch.bottomHeight);
    if (patch.deckSplit != null) setDeckSplit(patch.deckSplit);
    setSettings(prev => ({ ...prev, layoutPreset: 'custom', layout: nextLayout }));
  }, [leftWidth, rightWidth, bottomHeight, deckSplit]);

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
    if (dragging.current) {
      setSettings(prev => ({ ...prev, layoutPreset: 'custom' }));
    }
    dragging.current = null;
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    const handleCommandKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key.toLowerCase() === 'k') || e.key === 'F1') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
        playSound('switch', 0.08);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleCommandKeys);
    return () => window.removeEventListener('keydown', handleCommandKeys);
  }, []);

  useEffect(() => {
    const handleKeyboardLayout = (event: Event) => {
      const keyboardLayout = (event as CustomEvent).detail;
      if (typeof keyboardLayout === 'string') {
        updateSettings({ keyboardLayout });
      }
    };
    window.addEventListener('muthur-keyboard-layout-change', handleKeyboardLayout);
    return () => window.removeEventListener('muthur-keyboard-layout-change', handleKeyboardLayout);
  }, [updateSettings]);

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

  const applyLayoutPreset = (presetId: LayoutPresetId) => {
    const preset = getLayoutPreset(presetId);
    setLeftWidth(preset.layout.leftWidth);
    setRightWidth(preset.layout.rightWidth);
    setBottomHeight(preset.layout.bottomHeight);
    setDeckSplit(preset.layout.deckSplit);
    setSettings(prev => ({ ...prev, layoutPreset: presetId, layout: { ...preset.layout } }));
    playSound('switch', 0.12);
  };

  useEffect(() => {
    if (booted && !assembled) {
      playSound('expand', 0.2);
      const timer = setTimeout(() => {
        setAssembled(true);
        playSound('panels', 0.15);
        const user = (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) ? 'operator' : 'user';
        setGreeting(`Welcome back, ${user}`);
        setTimeout(() => setGreeting(''), 2500);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [booted, assembled]);

  if (!booted) {
    return <LoadingScreen bootPreset={settings.bootPreset} onComplete={() => setBooted(true)} />;
  }

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <div className="scanline" />
      <div className="crt-overlay" />
      {greeting && (
        <div className="fixed inset-0 flex items-center justify-center z-[9000] pointer-events-none">
          <div className="text-muthur-primary font-mono text-[2vh] tracking-[0.3em] opacity-80 animate-pulse">
            {greeting}
          </div>
        </div>
      )}
      <CustomCursor />
      <CommandPalette
        open={commandPaletteOpen}
        settings={settings}
        onClose={() => setCommandPaletteOpen(false)}
        onSettingsChange={updateSettings}
        onOpenShutdown={() => setShutdownOpen(true)}
      />
      <ShutdownScreen open={shutdownOpen} onCancel={() => setShutdownOpen(false)} />
      {!settings.firstRunComplete && (
        <FirstRunSetup
          settings={settings}
          onSettingsChange={updateSettings}
          onComplete={() => updateSettings({ firstRunComplete: true })}
        />
      )}

      <div className="flex flex-col h-full">
        {/* Header with drag region */}
        <Header systemStats={systemStats} />
        {/* Top section */}
        <div className="flex flex-1 min-h-0">
          <div style={{ width: `${leftWidth}%`, transitionDelay: '0.2s' }} className={`shrink-0 overflow-hidden min-w-0 panel-reveal ${assembled ? 'visible' : ''}`}>
            <LeftPanel systemStats={systemStats} />
          </div>

          <div
            className="w-[3px] shrink-0 hover:bg-[rgba(0,255,65,0.3)] transition-colors"
            onMouseDown={() => startDrag('left')}
          />

          <div className={`flex-1 min-w-0 min-h-0 panel-reveal ${assembled ? 'visible' : ''}`} style={{ transitionDelay: '0s' }}>
            <CenterPanel />
          </div>

          <div
            className="w-[3px] shrink-0 hover:bg-[rgba(0,255,65,0.3)] transition-colors"
            onMouseDown={() => startDrag('right')}
          />

          <div style={{ width: `${rightWidth}%`, transitionDelay: '0.4s' }} className={`shrink-0 overflow-hidden min-w-0 panel-reveal ${assembled ? 'visible' : ''}`}>
            <RightPanel />
          </div>
        </div>

        {/* Bottom resize */}
        <div
          className="h-[3px] shrink-0 hover:bg-[rgba(0,255,65,0.3)] transition-colors"
          onMouseDown={() => startDrag('bottom')}
        />

        {/* Bottom */}
        <div style={{ height: `${bottomHeight}vh`, transitionDelay: '0.6s' }} className={`shrink-0 overflow-hidden panel-reveal ${assembled ? 'visible' : ''}`}>
          <BottomPanel
            settings={settings}
            deckSplit={deckSplit}
            onDeckSplitChange={(next) => {
              setDeckSplit(next);
              setSettings(prev => ({
                ...prev,
                layoutPreset: 'custom',
                layout: { ...prev.layout, deckSplit: next },
              }));
            }}
            onLayoutPresetChange={applyLayoutPreset}
            onLayoutChange={updateLayout}
            onSettingsChange={updateSettings}
            onReplaceSettings={replaceSettings}
            onOpenPalette={() => setCommandPaletteOpen(true)}
            onOpenShutdown={() => setShutdownOpen(true)}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
