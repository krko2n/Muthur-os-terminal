import Terminal from './Terminal';

export default function CenterPanel() {
  return (
    <div className="h-full flex flex-col min-h-0 min-w-0">
      <div className="flex items-center justify-between px-[1vh] py-[0.5vh] border-b border-[rgba(0,255,65,0.15)] shrink-0">
        <span className="text-[1.3vh] tracking-widest opacity-60">TERMINAL</span>
        <span className="text-[1.2vh] opacity-30">MAIN SHELL</span>
      </div>
      <div className="flex-1 overflow-hidden min-h-0">
        <Terminal />
      </div>
    </div>
  );
}
