import Terminal from './Terminal';

export default function CenterPanel() {
  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 border-x border-[rgba(0,255,65,0.1)]">
      <div className="flex items-center justify-between px-[0.8vh] py-[0.4vh] border-b border-[rgba(0,255,65,0.15)]">
        <span className="text-[1.1vh] tracking-widest opacity-60">TERMINAL</span>
        <span className="text-[1vh] opacity-30">MAIN SHELL</span>
      </div>
      <div className="flex-1 overflow-hidden min-h-0">
        <Terminal />
      </div>
    </div>
  );
}
