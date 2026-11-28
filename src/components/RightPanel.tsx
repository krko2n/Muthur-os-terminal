import Globe from './Globe';
import AIPanel from './AIPanel';
import NetworkStatus from './NetworkStatus';
import { GlobeIcon } from './SystemIcons';

interface RightPanelProps {
  systemStats: any;
}

export default function RightPanel({ systemStats }: RightPanelProps) {
  return (
    <div className="h-full flex flex-col py-[1.5vh] px-[1vh] gap-[0.8vh] min-h-0">
      {/* Globe */}
      <div className="h-[31vh] shrink-0 flex flex-col">
        <div className="text-[1.3vh] tracking-widest opacity-50 mb-[0.3vh] flex items-center gap-[0.5vh]">
          <GlobeIcon size={14} />
          ORBITAL DISPLAY
        </div>
        <div className="flex-1 min-h-0">
          <Globe />
        </div>
      </div>

      {/* Network */}
      <NetworkStatus systemStats={systemStats} />

      {/* AI Chat */}
      <div className="flex-1 min-h-0 flex flex-col">
        <AIPanel />
      </div>
    </div>
  );
}
