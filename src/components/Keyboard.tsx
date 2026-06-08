import { useEffect, useState, useCallback } from 'react';

interface KeyDef {
  code: string;
  lower: string;
  shift: string;
  w: number;
  isLetter?: boolean;
  isModifier?: boolean;
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
    { code: 'Backspace', lower: 'back', shift: 'back', w: 2, isModifier: true },
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
    { code: 'Enter', lower: 'enter', shift: 'enter', w: 2.5, isModifier: true },
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
  ],
  [
    { code: 'ShiftLeft', lower: 'shift', shift: 'shift', w: 2.2, isModifier: true },
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
    { code: 'ShiftRight', lower: 'shift', shift: 'shift', w: 2.8, isModifier: true },
  ],
  [
    { code: 'ControlLeft', lower: 'ctrl', shift: 'ctrl', w: 1.5, isModifier: true },
    { code: 'Fn', lower: 'fn', shift: 'fn', w: 1, isModifier: true },
    { code: 'Space', lower: '', shift: '', w: 9, isModifier: true },
    { code: 'AltRight', lower: 'alt gr', shift: 'alt gr', w: 1.5, isModifier: true },
    { code: 'ControlRight', lower: 'ctrl', shift: 'ctrl', w: 1.5, isModifier: true },
  ],
];

export default function Keyboard() {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [capsLock, setCapsLock] = useState(false);
  const [shiftHeld, setShiftHeld] = useState(false);
  // Sticky shift: when shift is clicked on virtual keyboard, it stays until next key
  const [stickyShift, setStickyShift] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setActiveKeys(prev => new Set(prev).add(e.code));
    if (e.code === 'CapsLock') setCapsLock(prev => !prev);
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') setShiftHeld(true);
  }, []);

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

  const getLabel = (keyDef: KeyDef): string => {
    if (keyDef.isModifier) return keyDef.lower;
    if (keyDef.isLetter) {
      return (capsLock || isShifted) ? keyDef.shift : keyDef.lower;
    }
    return isShifted ? keyDef.shift : keyDef.lower;
  };

  const getChar = (keyDef: KeyDef): string => {
    if (keyDef.isLetter) {
      return (capsLock || isShifted) ? keyDef.shift : keyDef.lower;
    }
    return isShifted ? keyDef.shift : keyDef.lower;
  };

  const isActive = (code: string) => {
    if (activeKeys.has(code)) return true;
    if (code === 'Enter' && activeKeys.has('NumpadEnter')) return true;
    return false;
  };

  const handleClick = (keyDef: KeyDef) => {
    // Toggle sticky shift
    if (keyDef.code === 'ShiftLeft' || keyDef.code === 'ShiftRight') {
      setStickyShift(prev => !prev);
      return;
    }
    if (keyDef.code === 'CapsLock') {
      setCapsLock(prev => !prev);
      return;
    }
    // Skip other modifiers that don't produce characters
    if (keyDef.code.startsWith('Control') || keyDef.code === 'Fn' || keyDef.code.startsWith('Alt')) {
      return;
    }

    let char = '';
    if (keyDef.code === 'Space') char = ' ';
    else if (keyDef.code === 'Enter') char = '\r';
    else if (keyDef.code === 'Tab') char = '\t';
    else if (keyDef.code === 'Backspace') char = '\x7f';
    else if (keyDef.code === 'Escape') char = '\x1b';
    else char = getChar(keyDef);

    if (char) {
      window.dispatchEvent(new CustomEvent('virtual-key', { detail: char }));
    }

    // Release sticky shift after typing one character
    if (stickyShift) {
      setStickyShift(false);
    }

    // Visual feedback
    setActiveKeys(prev => new Set(prev).add(keyDef.code));
    setTimeout(() => {
      setActiveKeys(prev => {
        const next = new Set(prev);
        next.delete(keyDef.code);
        return next;
      });
    }, 100);
  };

  return (
    <div className="h-full w-full flex flex-col justify-between p-[0.5vw]">
      {ROWS.map((row, ri) => {
        const totalW = row.reduce((sum, k) => sum + k.w, 0);
        return (
          <div key={ri} className="flex flex-1 gap-[0.2vw] items-stretch">
            {row.map((keyDef, ki) => {
              const active = isActive(keyDef.code);
              const label = getLabel(keyDef);
              const isShiftKey = keyDef.code === 'ShiftLeft' || keyDef.code === 'ShiftRight';
              const isCapsKey = keyDef.code === 'CapsLock';
              const highlighted = active || (isShiftKey && stickyShift) || (isCapsKey && capsLock);
              return (
                <div
                  key={`${ri}-${ki}`}
                  onClick={() => handleClick(keyDef)}
                  className={`
                    flex items-center justify-center
                    rounded-sm transition-all duration-75
                    font-mono select-none my-[0.15vw]
                    ${highlighted
                      ? 'key-active'
                      : 'border border-[rgba(0,255,65,0.25)] text-muthur-primary opacity-80 hover:opacity-100 hover:border-[rgba(0,255,65,0.5)]'
                    }
                  `}
                  style={{
                    flex: `${keyDef.w / totalW}`,
                    fontSize: keyDef.w > 1.5 ? '0.7vw' : '0.9vw',
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
