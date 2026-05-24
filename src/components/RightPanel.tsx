import Globe from './Globe';
import AIPanel from './AIPanel';

export default function RightPanel() {
  return (
    <div className="w-1/4 flex flex-col gap-2">
      {/* Network/Globe visualization */}
      <div className="panel h-80">
        <div className="panel-header">NETWORK STATUS</div>
        <div className="h-full relative">
          <Globe />
          <div className="absolute bottom-2 left-2 right-2 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muthur-secondary">STATUS:</span>
              <span className="text-muthur-primary">CONNECTED</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muthur-secondary">LATENCY:</span>
              <span className="text-muthur-primary">12ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <AIPanel />
    </div>
  );
}
