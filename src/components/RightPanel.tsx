import Globe from './Globe';
import AIPanel from './AIPanel';

export default function RightPanel() {
  return (
    <div className="w-1/4 flex flex-col gap-2 min-h-0">
      <div className="panel h-72 flex flex-col shrink-0">
        <div className="panel-header shrink-0">GLOBAL MONITOR</div>
        <div className="flex-1 min-h-0">
          <Globe />
        </div>
      </div>

      <AIPanel />
    </div>
  );
}
