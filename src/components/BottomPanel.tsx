import FileExplorer from './FileExplorer';
import Keyboard from './Keyboard';

export default function BottomPanel() {
  return (
    <div className="h-[30vh] shrink-0 flex border-t border-[rgba(0,255,65,0.15)]">
      {/* File System - 43% width like eDEX */}
      <div className="w-[43%] border-r border-[rgba(0,255,65,0.1)]">
        <FileExplorer />
      </div>

      {/* Keyboard - remaining 57% */}
      <div className="flex-1">
        <Keyboard />
      </div>
    </div>
  );
}
