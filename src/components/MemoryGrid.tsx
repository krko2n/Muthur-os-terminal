import { formatBytes, litDotCount, statusLevel, usagePercent } from '../core/metrics';

// eDEX-UI memory module: a 40 x 8 field of dots, lit in proportion to used RAM.
const COLUMNS = 40;
const ROWS = 8;
const DOT_COUNT = COLUMNS * ROWS;

interface MemoryGridProps {
  used?: number;
  total?: number;
}

export default function MemoryGrid({ used = 0, total = 0 }: MemoryGridProps) {
  const known = total > 0;
  const lit = known ? litDotCount(used, total, DOT_COUNT) : 0;
  const percent = usagePercent(used, total);

  return (
    <div className="shrink-0">
      <div className="text-[10px] tracking-wider opacity-50 mb-1 flex items-center justify-between panel-header-bracket border-t border-muthur-border pt-1">
        <span>MEMORY</span>
        <span className={`tabular-nums ${known ? `status-${statusLevel(percent, 75, 90)}` : 'text-muthur-primary'}`}>{known ? `${percent.toFixed(0)}%` : '--'}</span>
      </div>
      <div
        className="memory-grid"
        role="meter"
        aria-label="Memory in use"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        style={{ gridTemplateColumns: `repeat(${COLUMNS}, 1fr)` }}
      >
        {Array.from({ length: DOT_COUNT }, (_, i) => (
          <span key={i} className={i < lit ? 'memory-dot memory-dot-lit' : 'memory-dot'} />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muthur-secondary mt-[0.4vh] tabular-nums">
        <span className="opacity-60">USING</span>
        <span>{known ? `${formatBytes(used)} / ${formatBytes(total)}` : '--'}</span>
      </div>
    </div>
  );
}
