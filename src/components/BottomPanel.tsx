import { useState, useRef, useEffect, useCallback } from 'react';
import FileExplorer from './FileExplorer';
import Keyboard from './Keyboard';

interface BottomPanelProps {
  deckSplit: number;
  onDeckSplitChange: (value: number) => void;
}

export default function BottomPanel({
  deckSplit,
  onDeckSplitChange,
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
      {/* File manager */}
      <div style={{ width: `${splitPct}%` }} className="shrink-0 overflow-hidden">
        <FileExplorer />
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
