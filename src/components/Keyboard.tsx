import { useEffect, useState, useCallback } from 'react';

interface KeyDef {
  code: string;
  lower: string;
  upper: string;
  w: number;
}

const ROWS: KeyDef[][] = [
  [
    { code: 'Escape', lower: 'esc', upper: 'ESC', w: 1.3 },
    { code: 'Backquote', lower: '`', upper: '~', w: 1 },
    { code: 'Digit1', lower: '1', upper: '!', w: 1 },
    { code: 'Digit2', lower: '2', upper: '@', w: 1 },
    { code: 'Digit3', lower: '3', upper: '#', w: 1 },
    { code: 'Digit4', lower: '4', upper: '$', w: 1 },
    { code: 'Digit5', lower: '5', upper: '%', w: 1 },
    { code: 'Digit6', lower: '6', upper: '^', w: 1 },
    { code: 'Digit7', lower: '7', upper: '&', w: 1 },
    { code: 'Digit8', lower: '8', upper: '*', w: 1 },
    { code: 'Digit9', lower: '9', upper: '(', w: 1 },
    { code: 'Digit0', lower: '0', upper: ')', w: 1 },
    { code: 'Minus', lower: '-', upper: '_', w: 1 },
    { code: 'Equal', lower: '=', upper: '+', w: 1 },
    { code: 'Backspace', lower: 'back', upper: 'BACK', w: 2 },
  ],
  [
    { code: 'Tab', lower: 'tab', upper: 'TAB', w: 1.5 },
    { code: 'KeyQ', lower: 'q', upper: 'Q', w: 1 },
    { code: 'KeyW', lower: 'w', upper: 'W', w: 1 },
    { code: 'KeyE', lower: 'e', upper: 'E', w: 1 },
    { code: 'KeyR', lower: 'r', upper: 'R', w: 1 },
    { code: 'KeyT', lower: 't', upper: 'T', w: 1 },
    { code: 'KeyY', lower: 'y', upper: 'Y', w: 1 },
    { code: 'KeyU', lower: 'u', upper: 'U', w: 1 },
    { code: 'KeyI', lower: 'i', upper: 'I', w: 1 },
    { code: 'KeyO', lower: 'o', upper: 'O', w: 1 },
    { code: 'KeyP', lower: 'p', upper: 'P', w: 1 },
    { code: 'BracketLeft', lower: '[', upper: '{', w: 1 },
    { code: 'BracketRight', lower: ']', upper: '}', w: 1 },
    { code: 'Enter', lower: 'enter', upper: 'ENTER', w: 2.5 },
  ],
  [
    { code: 'CapsLock', lower: 'caps', upper: 'CAPS', w: 1.8 },
    { code: 'KeyA', lower: 'a', upper: 'A', w: 1 },
    { code: 'KeyS', lower: 's', upper: 'S', w: 1 },
    { code: 'KeyD', lower: 'd', upper: 'D', w: 1 },
    { code: 'KeyF', lower: 'f', upper: 'F', w: 1 },
    { code: 'KeyG', lower: 'g', upper: 'G', w: 1 },
    { code: 'KeyH', lower: 'h', upper: 'H', w: 1 },
    { code: 'KeyJ', lower: 'j', upper: 'J', w: 1 },
    { code: 'KeyK', lower: 'k', upper: 'K', w: 1 },
    { code: 'KeyL', lower: 'l', upper: 'L', w: 1 },
    { code: 'Semicolon', lower: ';', upper: ':', w: 1 },
    { code: 'Quote', lower: "'", upper: '"', w: 1 },
    { code: 'Backslash', lower: '\\', upper: '|', w: 1 },
  ],
  [
    { code: 'ShiftLeft', lower: 'shift', upper: 'SHIFT', w: 2.2 },
    { code: 'KeyZ', lower: 'z', upper: 'Z', w: 1 },
    { code: 'KeyX', lower: 'x', upper: 'X', w: 1 },
    { code: 'KeyC', lower: 'c', upper: 'C', w: 1 },
    { code: 'KeyV', lower: 'v', upper: 'V', w: 1 },
    { code: 'KeyB', lower: 'b', upper: 'B', w: 1 },
    { code: 'KeyN', lower: 'n', upper: 'N', w: 1 },
    { code: 'KeyM', lower: 'm', upper: 'M', w: 1 },
    { code: 'Comma', lower: ',', upper: '<', w: 1 },
    { code: 'Period', lower: '.', upper: '>', w: 1 },
    { code: 'Slash', lower: '/', upper: '?', w: 1 },
    { code: 'ShiftRight', lower: 'shift', upper: 'SHIFT', w: 2.8 },
  ],
  [
    { code: 'ControlLeft', lower: 'ctrl', upper: 'CTRL', w: 1.5 },
    { code: 'Fn', lower: 'fn', upper: 'FN', w: 1 },
    { code: 'Space', lower: '', upper: '', w: 9 },
    { code: 'AltRight', lower: 'alt gr', upper: 'ALT GR', w: 1.5 },
    { code: 'ControlRight', lower: 'ctrl', upper: 'CTRL', w: 1.5 },
  ],
];

export default function Keyboard() {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [capsLock, setCapsLock] = useState(false);
  const [shiftHeld, setShiftHeld] = useState(false);

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

  const isUpper = capsLock || shiftHeld;

  const isActive = (code: string) => {
    if (activeKeys.has(code)) return true;
    if (code === 'Enter' && activeKeys.has('NumpadEnter')) return true;
    return false;
  };

  const handleClick = async (keyDef: KeyDef) => {
    // Simulate keypress to terminal
    if (keyDef.code === 'ShiftLeft' || keyDef.code === 'ShiftRight') {
      setShiftHeld(prev => !prev);
      return;
    }
    if (keyDef.code === 'CapsLock') {
      setCapsLock(prev => !prev);
      return;
    }

    let char = '';
    if (keyDef.code === 'Space') char = ' ';
    else if (keyDef.code === 'Enter') char = '\r';
    else if (keyDef.code === 'Tab') char = '\t';
    else if (keyDef.code === 'Backspace') char = '\x7f';
    else if (keyDef.code === 'Escape') char = '\x1b';
    else if (keyDef.code.startsWith('Control') || keyDef.code === 'Fn' || keyDef.code.startsWith('Alt')) return;
    else char = isUpper ? keyDef.upper : keyDef.lower;

    if (char && char.length === 1 || char === '\r' || char === '\t' || char === '\x7f' || char === '\x1b') {
      // Dispatch to active terminal via custom event
      window.dispatchEvent(new CustomEvent('virtual-key', { detail: char }));
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
    <div className="h-full flex flex-col justify-center items-center py-[0.5vh]">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-[0.3vw] my-[0.3vh]">
          {row.map((keyDef, ki) => {
            const active = isActive(keyDef.code);
            const label = isUpper ? keyDef.upper : keyDef.lower;
            return (
              <div
                key={`${ri}-${ki}`}
                onClick={() => handleClick(keyDef)}
                className={`
                  flex items-center justify-center
                  rounded-sm transition-all duration-75
                  font-mono select-none
                  ${active
                    ? 'key-active'
                    : 'border border-[rgba(0,255,65,0.25)] text-muthur-primary opacity-80 hover:opacity-100 hover:border-[rgba(0,255,65,0.5)]'
                  }
                  ${(keyDef.code === 'CapsLock' && capsLock) ? 'key-active' : ''}
                `}
                style={{
                  width: `${keyDef.w * 2.8}vw`,
                  height: '2.6vw',
                  fontSize: keyDef.w > 1.5 ? '0.7vw' : '0.9vw',
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
