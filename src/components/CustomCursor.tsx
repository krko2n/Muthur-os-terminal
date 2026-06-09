import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    let x = 0, y = 0;
    let scale = 1;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!frame) {
        frame = requestAnimationFrame(() => {
          if (ref.current) {
            ref.current.style.transform = `translate3d(${x - 9}px, ${y - 9}px, 0) scale(${scale})`;
          }
          frame = 0;
        });
      }
    };

    const onDown = () => {
      scale = 0.7;
      if (ref.current) {
        ref.current.style.transform = `translate3d(${x - 9}px, ${y - 9}px, 0) scale(${scale})`;
      }
    };
    const onUp = () => {
      scale = 1;
      if (ref.current) {
        ref.current.style.transform = `translate3d(${x - 9}px, ${y - 9}px, 0) scale(${scale})`;
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="custom-cursor"
      style={{ willChange: 'transform', position: 'fixed', top: 0, left: 0 }}
    />
  );
}
