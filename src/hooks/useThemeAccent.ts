import { useEffect, useState } from 'react';

const FALLBACK = '#00ff41';

function readAccent(): string {
  if (typeof document === 'undefined') return FALLBACK;
  return getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || FALLBACK;
}

/**
 * Current theme accent colour. For places CSS cannot reach (canvas, WebGL);
 * updates when applyInterfaceSettings rewrites the root CSS variables.
 */
export function useThemeAccent(): string {
  const [accent, setAccent] = useState(readAccent);

  useEffect(() => {
    const observer = new MutationObserver(() => setAccent(readAccent()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  return accent;
}
