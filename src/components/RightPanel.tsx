import Globe from './Globe';
import AIPanel from './AIPanel';

export default function RightPanel() {
  return (
    <div className="w-72 flex flex-col gap-1 shrink-0 min-h-0">
      {/* Globe - compact */}
      <div className="panel h-56 flex flex-col shrink-0">
        <div className="panel-header shrink-0">GLOBAL MONITOR</div>
        <div className="flex-1 min-h-0">
          <Globe />
        </div>
      </div>

      {/* AI Chat - takes remaining space */}
      <AIPanel />
    </div>
  );
}
