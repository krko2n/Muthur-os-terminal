import Globe from './Globe';
import AIPanel from './AIPanel';
import { GlobeIcon, AIIcon } from './SystemIcons';

export default function RightPanel() {
  return (
    <div className="h-full flex flex-col py-[1.5vh] px-[1vh] gap-[0.8vh] min-h-0">
      {/* Globe */}
      <div className="h-[26vh] shrink-0 flex flex-col">
        <div className="text-[1.3vh] tracking-widest opacity-50 mb-[0.3vh] flex items-center gap-[0.5vh]">
          <GlobeIcon size={14} color="rgba(0,255,65,0.5)" />
          GLOBAL NETWORK MAP
        </div>
        <div className="flex-1 min-h-0">
          <Globe />
        </div>
      </div>

      {/* AI Chat */}
      <div className="flex-1 min-h-0 flex flex-col">
        <AIPanel />
      </div>
    </div>
  );
}
