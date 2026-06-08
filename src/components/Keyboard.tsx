import { useEffect, useState, useCallback } from 'react';

interface KeyDef {
  code: string;
  label: string;
  w: number;
}

const ROWS: KeyDef[][] = [
  [
    { code: 'Escape', label: 'ESC', w: 1.3 },
    { code: 'Backquote', label: '`', w: 1 },
    { code: 'Digit1', label: '1', w: 1 },
    { code: 'Digit2', label: '2', w: 1 },
    { code: 'Digit3', label: '3', w: 1 },
    { code: 'Digit4', label: '4', w: 1 },
    { code: 'Digit5', label: '5', w: 1 },
    { code: 'Digit6', label: '6', w: 1 },
    { code: 'Digit7', label: '7', w: 1 },
    { code: 'Digit8', label: '8', w: 1 },
    { code: 'Digit9', label: '9', w: 1 },
    { code: 'Digit0', label: '0', w: 1 },
    { code: 'Minus', label: '-', w: 1 },
    { code: 'Equal', label: '=', w: 1 },
    { code: 'Backspace', label: 'BACK', w: 2 },
  ],
  [
    { code: 'Tab', label: 'TAB', w: 1.5 },
    { code: 'KeyQ', label: 'Q', w: 1 },
    { code: 'KeyW', label: 'W', w: 1 },
    { code: 'KeyE', label: 'E', w: 1 },
    { code: 'KeyR', label: 'R', w: 1 },
    { code: 'KeyT', label: 'T', w: 1 },
    { code: 'KeyY', label: 'Y', w: 1 },
    { code: 'KeyU', label: 'U', w: 1 },
    { code: 'KeyI', label: 'I', w: 1 },
    { code: 'KeyO', label: 'O', w: 1 },
    { code: 'KeyP', label: 'P', w: 1 },
    { code: 'BracketLeft', label: '[', w: 1 },
    { code: 'BracketRight', label: ']', w: 1 },
    { code: 'Backslash', label: '\\', w: 1 },
    { code: 'Enter', label: 'ENTER', w: 1.5 },
  ],
  [
    { code: 'CapsLock', label: 'CAPS', w: 1.8 },
    { code: 'KeyA', label: 'A', w: 1 },
    { code: 'KeyS', label: 'S', w: 1 },
    { code: 'KeyD', label: 'D', w: 1 },
    { code: 'KeyF', label: 'F', w: 1 },
    { code: 'KeyG', label: 'G', w: 1 },
    { code: 'KeyH', label: 'H', w: 1 },
    { code: 'KeyJ', label: 'J', w: 1 },
    { code: 'KeyK', label: 'K', w: 1 },
    { code: 'KeyL', label: 'L', w: 1 },
    { code: 'Semicolon', label: ';', w: 1 },
    { code: 'Quote', label: "'", w: 1 },
    { code: 'Enter', label: '', w: 2.2 },
  ],
  [
    { code: 'ShiftLeft', label: 'SHIFT', w: 2.5 },
    { code: 'KeyZ', label: 'Z', w: 1 },
    { code: 'KeyX', label: 'X', w: 1 },
    { code: 'KeyC', label: 'C', w: 1 },
    { code: 'KeyV', label: 'V', w: 1 },
    { code: 'KeyB', label: 'B', w: 1 },
    { code: 'KeyN', label: 'N', w: 1 },
    { code: 'KeyM', label: 'M', w: 1 },
    { code: 'Comma', label: ',', w: 1 },
    { code: 'Period', label: '.', w: 1 },
    { code: 'Slash', label: '/', w: 1 },
    { code: 'ShiftRight', label: 'SHIFT', w: 2.5 },
  ],
  [
    { code: 'ControlLeft', label: 'CTRL', w: 1.5 },
    { code: 'Fn', label: 'FN', w: 1 },
    { code: 'AltLeft', label: 'ALT', w: 1.3 },
    { code: 'Space', label: '', w: 8.4 },
    { code: 'AltRight', label: 'ALT', w: 1.3 },
    { code: 'ControlRight', label: 'CTRL', w: 1.5 },
  ],
];

export default function Keyboard() {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setActiveKeys(prev => new Set(prev).add(e.code));
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setActiveKeys(prev => {
      const next = new Set(prev);
      next.delete(e.code);
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const isActive = (code: string) => {
    if (activeKeys.has(code)) return true;
    if (code === 'Enter' && activeKeys.has('Enter')) return true;
    if (code === 'Enter' && activeKeys.has('NumpadEnter')) return true;
    return false;
  };

  return (
    <div className="h-full flex flex-col justify-center items-center py-[0.5vh]">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-[0.4vh] my-[0.35vh]">
          {row.map((keyDef, ki) => {
            const active = isActive(keyDef.code);
            return (
              <div
                key={`${ri}-${ki}`}
                className={`
                  flex items-center justify-center
                  rounded-[0.4vh] transition-all duration-75
                  font-mono select-none
                  ${active
                    ? 'key-active'
                    : 'border border-[rgba(0,255,65,0.2)] text-muthur-primary'
                  }
                `}
                style={{
                  width: `${keyDef.w * 2.7}vw`,
                  height: '2.7vw',
                  fontSize: keyDef.w > 1.2 ? '1.1vh' : '1.4vh',
                }}
              >
                {keyDef.label}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
