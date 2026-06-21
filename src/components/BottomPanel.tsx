import { useState, useRef, useEffect, useCallback } from 'react';
import OperationsDeck from './OperationsDeck';
import Keyboard from './Keyboard';
import { InterfaceSettings, LayoutPresetId } from '../theme';

interface BottomPanelProps {
  settings: InterfaceSettings;
  deckSplit: number;
  onDeckSplitChange: (value: number) => void;
  onLayoutPresetChange: (id: LayoutPresetId) => void;
  onLayoutChange: (patch: Partial<InterfaceSettings['layout']>) => void;
  onSettingsChange: (patch: Partial<InterfaceSettings>) => void;
  onReplaceSettings: (settings: InterfaceSettings) => void;
  onOpenPalette: () => void;
  onOpenShutdown: () => void;
}

export default function BottomPanel({
  settings,
  deckSplit,
  onDeckSplitChange,
  onLayoutPresetChange,
  onLayoutChange,
  onSettingsChange,
  onReplaceSettings,
  onOpenPalette,
  onOpenShutdown,
}: BottomPanelProps) {
  const [splitPct, setSplitPct] = useState(deckSplit);
  const dragging = useRef(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const pct = Math.max(25, Math.min(65, (e.clientX / window.innerWidth) * 100));
    setSplitPct(pct);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (dragging.current) {
      onDeckSplitChange(splitPct);
    }
    dragging.current = false;
    document.body.style.userSelect = '';
  }, [onDeckSplitChange, splitPct]);

  useEffect(() => {
    if (!dragging.current) {
      setSplitPct(deckSplit);
    }
  }, [deckSplit]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div className="h-full flex">
      {/* Native controls */}
      <div style={{ width: `${splitPct}%` }} className="shrink-0 overflow-hidden">
        <OperationsDeck
          settings={settings}
          deckSplit={splitPct}
          onDeckSplitChange={(next) => {
            setSplitPct(next);
            onDeckSplitChange(next);
          }}
          onLayoutPresetChange={onLayoutPresetChange}
          onLayoutChange={onLayoutChange}
          onSettingsChange={onSettingsChange}
          onReplaceSettings={onReplaceSettings}
          onOpenPalette={onOpenPalette}
          onOpenShutdown={onOpenShutdown}
        />
      </div>

      {/* Resize handle */}
      <div
        className="w-[3px] shrink-0 hover:bg-[rgba(0,255,65,0.3)] transition-colors active:bg-muthur-primary"
        onMouseDown={() => {
          dragging.current = true;
          document.body.style.userSelect = 'none';
        }}
        style={{ cursor: 'none' }}
      />

      {/* Keyboard */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <Keyboard />
      </div>
    </div>
  );
}
