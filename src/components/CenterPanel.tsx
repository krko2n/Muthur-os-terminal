import Terminal from './Terminal';

export default function CenterPanel() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="panel flex-1 flex flex-col min-h-0">
        <div className="panel-header shrink-0">TERMINAL</div>
        <div className="flex-1 overflow-hidden min-h-0">
          <Terminal />
        </div>
      </div>
    </div>
  );
}
