import Terminal from './Terminal';

export default function CenterPanel() {
  return (
    <div className="h-full flex flex-col min-h-0 min-w-0 border-x border-[rgba(0,255,65,0.1)]">
      <div className="flex-1 overflow-hidden min-h-0">
        <Terminal />
      </div>
    </div>
  );
}
