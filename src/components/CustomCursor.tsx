import { useEffect, useRef, useState } from 'react';

const TRAIL_LENGTH = 8;

type CursorState = 'default' | 'pointer' | 'text' | 'busy';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement[]>([]);
  const pos = useRef({ x: 0, y: 0 });
  const trailPositions = useRef<{ x: number; y: number }[]>(
    Array.from({ length: TRAIL_LENGTH }, () => ({ x: 0, y: 0 }))
  );
  const [cursorState, setCursorState] = useState<CursorState>('default');

  useEffect(() => {
    let frame = 0;
    let scale = 1;

    const onMove = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;

      // Detect cursor state from hovered element
      const target = e.target as HTMLElement;
      if (!target) return;

      const computed = window.getComputedStyle(target);
      const tagName = target.tagName.toLowerCase();

      if (
        tagName === 'a' ||
        tagName === 'button' ||
        target.getAttribute('role') === 'button' ||
        computed.cursor === 'pointer' ||
        target.closest('a, button, [role="button"]')
      ) {
        setCursorState('pointer');
      } else if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        target.getAttribute('contenteditable') === 'true' ||
        computed.cursor === 'text'
      ) {
        setCursorState('text');
      } else {
        setCursorState('default');
      }
    };

    const onDown = () => { scale = 0.7; };
    const onUp = () => { scale = 1; };

    const animate = () => {
      const { x, y } = pos.current;

      if (cursorRef.current) {
        // Hotspot offset: center the 32x32 cursor
        cursorRef.current.style.transform = `translate3d(${x - 16}px, ${y - 16}px, 0) scale(${scale})`;
      }

      // Update trail positions with lag
      for (let i = TRAIL_LENGTH - 1; i > 0; i--) {
        trailPositions.current[i].x = trailPositions.current[i - 1].x;
        trailPositions.current[i].y = trailPositions.current[i - 1].y;
      }
      trailPositions.current[0].x = x;
      trailPositions.current[0].y = y;

      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const el = trailRef.current[i];
        if (el) {
          const tp = trailPositions.current[i];
          const opacity = (1 - i / TRAIL_LENGTH) * 0.4;
          const sz = 3 - (i / TRAIL_LENGTH) * 1.5;
          el.style.transform = `translate3d(${tp.x - sz / 2}px, ${tp.y - sz / 2}px, 0)`;
          el.style.opacity = String(opacity);
          el.style.width = `${sz}px`;
          el.style.height = `${sz}px`;
        }
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      {Array.from({ length: TRAIL_LENGTH }).map((_, i) => (
        <div
          key={`trail-${i}`}
          ref={(el) => { if (el) trailRef.current[i] = el; }}
          className="cursor-trail"
          style={{ willChange: 'transform, opacity', position: 'fixed', top: 0, left: 0 }}
        />
      ))}
      <div
        ref={cursorRef}
        className={`custom-cursor custom-cursor--${cursorState}`}
        style={{ willChange: 'transform', position: 'fixed', top: 0, left: 0 }}
      />
    </>
  );
}
