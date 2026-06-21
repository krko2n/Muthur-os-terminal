import { useEffect, useRef } from 'react';

const TRAIL_LENGTH = 14;

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement[]>([]);
  const pos = useRef({ x: 0, y: 0 });
  const trailPositions = useRef<{ x: number; y: number }[]>(
    Array.from({ length: TRAIL_LENGTH }, () => ({ x: 0, y: 0 }))
  );

  useEffect(() => {
    let frame = 0;
    let scale = 1;

    const onMove = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
    };

    const onDown = () => { scale = 0.6; };
    const onUp = () => { scale = 1; };

    const animate = () => {
      const { x, y } = pos.current;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${x - 14}px, ${y - 14}px, 0) scale(${scale})`;
      }

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
          const opacity = (1 - i / TRAIL_LENGTH) * 0.55;
          const sz = 5 - (i / TRAIL_LENGTH) * 2.4;
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
        className="custom-cursor"
        style={{ willChange: 'transform', position: 'fixed', top: 0, left: 0 }}
      />
    </>
  );
}
