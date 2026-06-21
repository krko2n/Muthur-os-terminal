import { useEffect, useState, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { playSound } from '../audio';

interface KeyDef {
  code: string;
  lower: string;
  shift: string;
  w: number;
  isLetter?: boolean;
  isModifier?: boolean;
  isEnter?: boolean;
  isEnterBottom?: boolean;
}

interface OfflinePackStatus {
  status?: string;
  modules?: {
    ai?: boolean;
    wiki?: boolean;
    maps?: boolean;
    docs?: boolean;
  };
}

const ROWS: KeyDef[][] = [
  [
    { code: 'Escape', lower: 'esc', shift: 'esc', w: 1.3, isModifier: true },
    { code: 'Backquote', lower: '`', shift: '~', w: 1 },
    { code: 'Digit1', lower: '1', shift: '!', w: 1 },
    { code: 'Digit2', lower: '2', shift: '@', w: 1 },
    { code: 'Digit3', lower: '3', shift: '#', w: 1 },
    { code: 'Digit4', lower: '4', shift: '$', w: 1 },
    { code: 'Digit5', lower: '5', shift: '%', w: 1 },
    { code: 'Digit6', lower: '6', shift: '^', w: 1 },
    { code: 'Digit7', lower: '7', shift: '&', w: 1 },
    { code: 'Digit8', lower: '8', shift: '*', w: 1 },
    { code: 'Digit9', lower: '9', shift: '(', w: 1 },
    { code: 'Digit0', lower: '0', shift: ')', w: 1 },
    { code: 'Minus', lower: '-', shift: '_', w: 1 },
    { code: 'Equal', lower: '=', shift: '+', w: 1 },
    { code: 'Backspace', lower: 'bksp', shift: 'bksp', w: 2, isModifier: true },
  ],
  [
    { code: 'Tab', lower: 'tab', shift: 'tab', w: 1.5, isModifier: true },
    { code: 'KeyQ', lower: 'q', shift: 'Q', w: 1, isLetter: true },
    { code: 'KeyW', lower: 'w', shift: 'W', w: 1, isLetter: true },
    { code: 'KeyE', lower: 'e', shift: 'E', w: 1, isLetter: true },
    { code: 'KeyR', lower: 'r', shift: 'R', w: 1, isLetter: true },
    { code: 'KeyT', lower: 't', shift: 'T', w: 1, isLetter: true },
    { code: 'KeyY', lower: 'y', shift: 'Y', w: 1, isLetter: true },
    { code: 'KeyU', lower: 'u', shift: 'U', w: 1, isLetter: true },
    { code: 'KeyI', lower: 'i', shift: 'I', w: 1, isLetter: true },
    { code: 'KeyO', lower: 'o', shift: 'O', w: 1, isLetter: true },
    { code: 'KeyP', lower: 'p', shift: 'P', w: 1, isLetter: true },
    { code: 'BracketLeft', lower: '[', shift: '{', w: 1 },
    { code: 'BracketRight', lower: ']', shift: '}', w: 1 },
    { code: 'Enter', lower: 'ret', shift: 'ret', w: 1.5, isModifier: true, isEnter: true },
  ],
  [
    { code: 'CapsLock', lower: 'caps', shift: 'caps', w: 1.8, isModifier: true },
    { code: 'KeyA', lower: 'a', shift: 'A', w: 1, isLetter: true },
    { code: 'KeyS', lower: 's', shift: 'S', w: 1, isLetter: true },
    { code: 'KeyD', lower: 'd', shift: 'D', w: 1, isLetter: true },
    { code: 'KeyF', lower: 'f', shift: 'F', w: 1, isLetter: true },
    { code: 'KeyG', lower: 'g', shift: 'G', w: 1, isLetter: true },
    { code: 'KeyH', lower: 'h', shift: 'H', w: 1, isLetter: true },
    { code: 'KeyJ', lower: 'j', shift: 'J', w: 1, isLetter: true },
    { code: 'KeyK', lower: 'k', shift: 'K', w: 1, isLetter: true },
    { code: 'KeyL', lower: 'l', shift: 'L', w: 1, isLetter: true },
    { code: 'Semicolon', lower: ';', shift: ':', w: 1 },
    { code: 'Quote', lower: "'", shift: '"', w: 1 },
    { code: 'Backslash', lower: '\\', shift: '|', w: 1 },
    { code: 'Enter2', lower: '', shift: '', w: 1.5, isModifier: true, isEnterBottom: true },
  ],
  [
    { code: 'ShiftLeft', lower: 'shift', shift: 'shift', w: 2.4, isModifier: true },
    { code: 'KeyZ', lower: 'z', shift: 'Z', w: 1, isLetter: true },
    { code: 'KeyX', lower: 'x', shift: 'X', w: 1, isLetter: true },
    { code: 'KeyC', lower: 'c', shift: 'C', w: 1, isLetter: true },
    { code: 'KeyV', lower: 'v', shift: 'V', w: 1, isLetter: true },
    { code: 'KeyB', lower: 'b', shift: 'B', w: 1, isLetter: true },
    { code: 'KeyN', lower: 'n', shift: 'N', w: 1, isLetter: true },
    { code: 'KeyM', lower: 'm', shift: 'M', w: 1, isLetter: true },
    { code: 'Comma', lower: ',', shift: '<', w: 1 },
    { code: 'Period', lower: '.', shift: '>', w: 1 },
    { code: 'Slash', lower: '/', shift: '?', w: 1 },
    { code: 'ShiftRight', lower: 'shift', shift: 'shift', w: 2.6, isModifier: true },
  ],
  [
    { code: 'ControlLeft', lower: 'ctrl', shift: 'ctrl', w: 1.5, isModifier: true },
    { code: 'MetaLeft', lower: 'super', shift: 'super', w: 1.2, isModifier: true },
    { code: 'AltLeft', lower: 'alt', shift: 'alt', w: 1.2, isModifier: true },
    { code: 'Space', lower: '', shift: '', w: 7 },
    { code: 'AltRight', lower: 'alt', shift: 'alt', w: 1.2, isModifier: true },
    { code: 'MetaRight', lower: 'fn', shift: 'fn', w: 1.2, isModifier: true },
    { code: 'ControlRight', lower: 'ctrl', shift: 'ctrl', w: 1.5, isModifier: true },
  ],
];

const AVAILABLE_LAYOUTS = [
  'en-US', 'en-GB', 'en-DVORAK', 'en-COLEMAK',
  'de-DE', 'fr-FR', 'es-ES', 'it-IT', 'pt-BR',
  'sv-SE', 'da-DK', 'nl-BE', 'hu-HU', 'tr-TR-Q',
];

function normalizeKeyDef(keyDef: KeyDef): KeyDef {
  const upper = keyDef.code.toUpperCase();
  let code = keyDef.code;
  let lower = keyDef.lower;
  let shift = keyDef.shift;

  if (upper === 'ESC') code = 'Escape';
  else if (upper === 'BACK' || upper === 'DELETE') code = 'Backspace';
  else if (upper === 'ENTER' || upper === 'RET') code = 'Enter';
  else if (upper === 'TAB') code = 'Tab';
  else if (upper === 'CAPS') code = 'CapsLock';
  else if (upper === 'SHIFT') code = 'ShiftLeft';
  else if (upper === 'CTRL') code = 'ControlLeft';
  else if (upper === 'ALT' || upper === 'ALT GR') code = 'AltRight';
  else if (upper === 'FN' || upper === 'SUPER') code = 'MetaRight';
  else if (upper === 'ESCAPED|-- ICON: ARROW_UP') { code = 'ArrowUp'; lower = 'up'; shift = 'up'; }
  else if (upper === 'ESCAPED|-- ICON: ARROW_DOWN') { code = 'ArrowDown'; lower = 'dn'; shift = 'dn'; }
  else if (upper === 'ESCAPED|-- ICON: ARROW_LEFT') { code = 'ArrowLeft'; lower = 'lt'; shift = 'lt'; }
  else if (upper === 'ESCAPED|-- ICON: ARROW_RIGHT') { code = 'ArrowRight'; lower = 'rt'; shift = 'rt'; }
  else if (upper === 'DIGIT' && !keyDef.lower) code = 'Space';

  return {
    ...keyDef,
    code,
    lower,
    shift,
    isEnter: keyDef.isEnter || code === 'Enter',
    isModifier: keyDef.isModifier || ['Escape', 'Tab', 'Backspace', 'CapsLock', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'MetaLeft', 'MetaRight', 'AltLeft', 'AltRight'].includes(code),
  };
}

export default function Keyboard() {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [capsLock, setCapsLock] = useState(false);
  const [shiftHeld, setShiftHeld] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [stickyShift, setStickyShift] = useState(false);
  const [layoutName, setLayoutName] = useState('en-US');
  const [remapPreset, setRemapPreset] = useState('terminal');
  const [customRows, setCustomRows] = useState<KeyDef[][] | null>(null);
  const [offlineStatus, setOfflineStatus] = useState<OfflinePackStatus | null>(null);

  useEffect(() => {
    const handleSettings = (event: Event) => {
      const settings = (event as CustomEvent).detail;
      if (typeof settings?.keyboardLayout === 'string') {
        setLayoutName(settings.keyboardLayout);
      }
      if (typeof settings?.keyboardPreset === 'string') {
        setRemapPreset(settings.keyboardPreset);
      }
    };
    window.addEventListener('muthur-settings-change', handleSettings);
    return () => window.removeEventListener('muthur-settings-change', handleSettings);
  }, []);

  useEffect(() => {
    if (layoutName === 'en-US') {
      setCustomRows(null);
      return;
    }
    fetch(`/keyboards/${layoutName}.json`)
      .then(r => r.json())
      .then(data => {
        if (data.rows) setCustomRows(data.rows);
      })
      .catch(() => setCustomRows(null));
  }, [layoutName]);

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const status = await invoke('get_offline_pack_status') as OfflinePackStatus;
        if (alive) setOfflineStatus(status);
      } catch {
        if (alive) setOfflineStatus(null);
      }
    };
    refresh();
    const interval = window.setInterval(refresh, 15000);
    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, []);

  const activeRows = useMemo(
    () => (customRows || ROWS).map(row => row.map(normalizeKeyDef)),
    [customRows]
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
      setPasswordMode(prev => !prev);
      return;
    }
    setActiveKeys(prev => new Set(prev).add(e.code));
    if (e.code === 'CapsLock') setCapsLock(prev => !prev);
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') setShiftHeld(true);
    if (!passwordMode) playSound('keyboard', 0.08);
  }, [passwordMode]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setActiveKeys(prev => {
      const next = new Set(prev);
      next.delete(e.code);
      return next;
    });
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') setShiftHeld(false);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const isShifted = shiftHeld || stickyShift;
  const archiveLabel = offlineStatus?.modules?.wiki
    ? 'WIKI HOT'
    : offlineStatus?.modules?.docs
    ? 'FIELD DOCS'
    : 'CACHE STANDBY';
  const aiLabel = offlineStatus?.modules?.ai ? 'LLM LOCAL' : 'LLM STANDBY';

  const getLabel = (keyDef: KeyDef): string => {
    if (keyDef.isModifier) return keyDef.lower;
    if (keyDef.isLetter) return (capsLock || isShifted) ? keyDef.shift : keyDef.lower;
    return isShifted ? keyDef.shift : keyDef.lower;
  };

  const getChar = (keyDef: KeyDef): string => {
    if (keyDef.isLetter) return (capsLock || isShifted) ? keyDef.shift : keyDef.lower;
    return isShifted ? keyDef.shift : keyDef.lower;
  };

  const isActive = (code: string) => {
    if (activeKeys.has(code)) return true;
    if (code === 'Enter' && activeKeys.has('NumpadEnter')) return true;
    return false;
  };

  const handleClick = (keyDef: KeyDef) => {
    const gamingRemap: Record<string, string> = {
      KeyW: '\x1b[A',
      KeyA: '\x1b[D',
      KeyS: '\x1b[B',
      KeyD: '\x1b[C',
    };

    if (keyDef.code === 'ShiftLeft' || keyDef.code === 'ShiftRight') {
      setStickyShift(prev => !prev);
      return;
    }
    if (keyDef.code === 'CapsLock') {
      setCapsLock(prev => !prev);
      return;
    }
    if (keyDef.code.startsWith('Control') || keyDef.code.startsWith('Meta') || keyDef.code.startsWith('Alt')) {
      return;
    }

    let char = '';
    if (remapPreset === 'gaming' && gamingRemap[keyDef.code]) char = gamingRemap[keyDef.code];
    else if (keyDef.code === 'Space') char = ' ';
    else if (keyDef.code === 'Enter') char = '\r';
    else if (keyDef.code === 'Tab') char = '\t';
    else if (keyDef.code === 'Backspace') char = '\x7f';
    else if (keyDef.code === 'Escape') char = '\x1b';
    else if (keyDef.code === 'ArrowUp') char = '\x1b[A';
    else if (keyDef.code === 'ArrowDown') char = '\x1b[B';
    else if (keyDef.code === 'ArrowRight') char = '\x1b[C';
    else if (keyDef.code === 'ArrowLeft') char = '\x1b[D';
    else char = getChar(keyDef);

    if (char) window.dispatchEvent(new CustomEvent('virtual-key', { detail: char }));

    if (keyDef.code === 'Enter') {
      playSound('granted', 0.12);
    } else {
      playSound('keyboard', 0.08);
    }
    if (stickyShift) setStickyShift(false);

    setActiveKeys(prev => new Set(prev).add(keyDef.code));
    setTimeout(() => {
      setActiveKeys(prev => { const n = new Set(prev); n.delete(keyDef.code); return n; });
    }, 150);
  };

  return (
    <div className={`edex-keyboard-shell ${passwordMode ? 'opacity-35' : ''}`}>
      <div className="edex-keyboard-header">
        <div className="flex items-center gap-[0.7vh] min-w-0">
          <span className="edex-keyboard-title">INPUT MATRIX</span>
          <span className="edex-status-chip">{remapPreset.toUpperCase()}</span>
          <span className="edex-status-chip">{archiveLabel}</span>
          <span className="edex-status-chip">{aiLabel}</span>
        </div>
        <select
          value={layoutName}
          onChange={(e) => {
            setLayoutName(e.target.value);
            window.dispatchEvent(new CustomEvent('muthur-keyboard-layout-change', { detail: e.target.value }));
          }}
          className="edex-layout-select"
        >
          {AVAILABLE_LAYOUTS.map(l => (
            <option key={l} value={l} className="bg-[#05080d]">{l}</option>
          ))}
        </select>
      </div>

      <div className="edex-keyboard-grid">
      {activeRows.map((row, ri) => {
        const totalW = row.reduce((sum, k) => sum + k.w, 0);
        const delay = Math.abs(ri - 2) * 0.1;
        return (
          <div
            key={ri}
            className="edex-keyboard-row keyboard-row-intro"
            style={{
              animationDelay: `${delay}s`,
            }}
          >
            {row.map((keyDef, ki) => {
              const active = isActive(keyDef.code) || (keyDef.isEnterBottom && isActive('Enter'));
              const label = getLabel(keyDef);
              const isShiftKey = keyDef.code === 'ShiftLeft' || keyDef.code === 'ShiftRight';
              const isCapsKey = keyDef.code === 'CapsLock';
              const isSpace = keyDef.code === 'Space';
              const highlighted = active || (isShiftKey && stickyShift) || (isCapsKey && capsLock);

              if (keyDef.isEnterBottom) {
                return (
                  <div
                    key={`${ri}-${ki}`}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      handleClick({ ...keyDef, code: 'Enter' });
                    }}
                    className={`edex-key edex-key-enter-bottom ${highlighted ? 'edex-key-active' : ''}`}
                    style={{ flex: `${keyDef.w / totalW}` }}
                  >
                    <span className="edex-key-label">RET</span>
                  </div>
                );
              }

              return (
                <div
                  key={`${ri}-${ki}`}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    handleClick(keyDef);
                  }}
                  className={`edex-key ${keyDef.isModifier ? 'edex-key-mod' : ''} ${isSpace ? 'edex-key-space' : ''} ${keyDef.isEnter ? 'edex-key-enter enter-key-top' : ''} ${highlighted ? 'edex-key-active' : ''}`}
                  style={{
                    flex: `${keyDef.w / totalW}`,
                    ...(keyDef.isEnter ? { marginBottom: '-0.15vw', paddingBottom: '0.15vw', borderBottomRightRadius: 0 } : {}),
                  }}
                >
                  <span className="edex-key-label">{isSpace ? 'SPACE' : label}</span>
                  {!keyDef.isModifier && keyDef.shift !== keyDef.lower && !isShifted && (
                    <span className="edex-key-shift">
                      {keyDef.shift}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
      </div>

      <div className="edex-keyboard-footer">
        <span>{capsLock ? 'CAPS LOCKED' : 'CAPS FREE'}</span>
        <span>{stickyShift || shiftHeld ? 'SHIFT ARM' : 'SHIFT CLEAR'}</span>
        <span>{passwordMode ? 'PRIVACY VEIL' : 'LOCAL INPUT'}</span>
        <span>{offlineStatus?.status?.toUpperCase() ?? 'PACK UNKNOWN'}</span>
      </div>
    </div>
  );
}
