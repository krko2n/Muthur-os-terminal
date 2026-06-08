import Globe from './Globe';
import AIPanel from './AIPanel';

export default function RightPanel() {
  return (
    <div className="w-[17%] flex flex-col shrink-0 py-[1vh] px-[0.5vh] gap-[0.5vh] min-h-0">
      {/* Globe */}
      <div className="h-[28vh] shrink-0 flex flex-col">
        <div className="text-[1.1vh] tracking-widest opacity-60 mb-[0.3vh]">GLOBAL NETWORK MAP</div>
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
