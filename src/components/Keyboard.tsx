import { useEffect, useState } from 'react';

const ROWS = [
  [
    { key: 'Escape', label: 'ESC', w: 1 },
    { key: '`', label: '`', shift: '~', w: 1 },
    { key: '1', label: '1', shift: '!', w: 1 },
    { key: '2', label: '2', shift: '@', w: 1 },
    { key: '3', label: '3', shift: '#', w: 1 },
    { key: '4', label: '4', shift: '$', w: 1 },
    { key: '5', label: '5', shift: '%', w: 1 },
    { key: '6', label: '6', shift: '^', w: 1 },
    { key: '7', label: '7', shift: '&', w: 1 },
    { key: '8', label: '8', shift: '*', w: 1 },
    { key: '9', label: '9', shift: '(', w: 1 },
    { key: '0', label: '0', shift: ')', w: 1 },
    { key: '-', label: '-', shift: '_', w: 1 },
    { key: '=', label: '=', shift: '+', w: 1 },
    { key: 'Backspace', label: 'BACK', w: 2 },
  ],
  [
    { key: 'Tab', label: 'TAB', w: 1.5 },
    { key: 'q', label: 'Q', w: 1 },
    { key: 'w', label: 'W', w: 1 },
    { key: 'e', label: 'E', w: 1 },
    { key: 'r', label: 'R', w: 1 },
    { key: 't', label: 'T', w: 1 },
    { key: 'y', label: 'Y', w: 1 },
    { key: 'u', label: 'U', w: 1 },
    { key: 'i', label: 'I', w: 1 },
    { key: 'o', label: 'O', w: 1 },
    { key: 'p', label: 'P', w: 1 },
    { key: '[', label: '[', shift: '{', w: 1 },
    { key: ']', label: ']', shift: '}', w: 1 },
    { key: '\\', label: '\\', shift: '|', w: 1 },
    { key: 'Enter', label: 'ENTER', w: 1.5 },
  ],
  [
    { key: 'CapsLock', label: 'CAPS', w: 1.8 },
    { key: 'a', label: 'A', w: 1 },
    { key: 's', label: 'S', w: 1 },
    { key: 'd', label: 'D', w: 1 },
    { key: 'f', label: 'F', w: 1 },
    { key: 'g', label: 'G', w: 1 },
    { key: 'h', label: 'H', w: 1 },
    { key: 'j', label: 'J', w: 1 },
    { key: 'k', label: 'K', w: 1 },
    { key: 'l', label: 'L', w: 1 },
    { key: ';', label: ';', shift: ':', w: 1 },
    { key: "'", label: "'", shift: '"', w: 1 },
    { key: 'Enter', label: '', w: 0 },
  ],
  [
    { key: 'Shift', label: 'SHIFT', w: 2.2 },
    { key: 'z', label: 'Z', w: 1 },
    { key: 'x', label: 'X', w: 1 },
    { key: 'c', label: 'C', w: 1 },
    { key: 'v', label: 'V', w: 1 },
    { key: 'b', label: 'B', w: 1 },
    { key: 'n', label: 'N', w: 1 },
    { key: 'm', label: 'M', w: 1 },
    { key: ',', label: ',', shift: '<', w: 1 },
    { key: '.', label: '.', shift: '>', w: 1 },
    { key: '/', label: '/', shift: '?', w: 1 },
    { key: 'Shift', label: 'SHIFT', w: 2.8 },
  ],
  [
    { key: 'Control', label: 'CTRL', w: 1.5 },
    { key: 'Fn', label: 'FN', w: 1 },
    { key: 'Alt', label: 'ALT', w: 1.2 },
    { key: ' ', label: '', w: 7.3 },
    { key: 'Alt', label: 'ALT', w: 1.2 },
    { key: 'Control', label: 'CTRL', w: 1.5 },
    { key: 'ArrowLeft', label: '<', w: 1 },
    { key: 'ArrowUp', label: '^', w: 1 },
    { key: 'ArrowDown', label: 'v', w: 1 },
    { key: 'ArrowRight', label: '>', w: 1 },
  ],
];

export default function Keyboard() {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setActiveKeys(prev => {
        const next = new Set(prev);
        next.add(e.key.toLowerCase());
        return next;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setActiveKeys(prev => {
        const next = new Set(prev);
        next.delete(e.key.toLowerCase());
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const isActive = (key: string) => {
    const k = key.toLowerCase();
    return activeKeys.has(k)
      || (k === 'shift' && activeKeys.has('shift'))
      || (k === 'control' && (activeKeys.has('control') || activeKeys.has('ctrl')))
      || (k === 'alt' && activeKeys.has('alt'))
      || (k === 'escape' && activeKeys.has('escape'))
      || (k === 'backspace' && activeKeys.has('backspace'))
      || (k === 'enter' && activeKeys.has('enter'))
      || (k === 'tab' && activeKeys.has('tab'))
      || (k === 'capslock' && activeKeys.has('capslock'))
      || (k === ' ' && activeKeys.has(' '));
  };

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header shrink-0">KEYBOARD</div>
      <div className="flex-1 flex flex-col justify-center p-2 gap-1">
        {ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-0.5 justify-center">
            {row.filter(k => k.w > 0).map((keyDef, ki) => {
              const active = isActive(keyDef.key);
              return (
                <div
                  key={`${ri}-${ki}`}
                  className={`
                    flex items-center justify-center border rounded-sm
                    text-[10px] font-mono select-none transition-all duration-75
                    ${active
                      ? 'bg-muthur-primary text-black border-muthur-primary shadow-key-active'
                      : 'bg-muthur-panel text-muthur-secondary border-muthur-border hover:border-muthur-secondary'
                    }
                  `}
                  style={{
                    width: `${keyDef.w * 2.8}rem`,
                    height: '2rem',
                    minWidth: `${keyDef.w * 2.8}rem`,
                  }}
                >
                  {keyDef.label}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
