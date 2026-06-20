import Terminal from './Terminal';

export default function CenterPanel() {
  return (
    <div className="h-full flex flex-col min-h-0 min-w-0 border-x border-[rgba(0,255,65,0.1)] relative"
      style={{
        clipPath: 'polygon(0% 1.5vh, 1vh 0%, calc(100% - 1vh) 0%, 100% 1.5vh, 100% calc(100% - 1.5vh), calc(100% - 1vh) 100%, 1vh 100%, 0% calc(100% - 1.5vh))',
      }}
    >
      <div className="flex-1 overflow-hidden min-h-0">
        <Terminal />
      </div>
    </div>
  );
}
