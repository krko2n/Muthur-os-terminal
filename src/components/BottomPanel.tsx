import FileExplorer from './FileExplorer';
import Keyboard from './Keyboard';

export default function BottomPanel() {
  return (
    <div className="flex gap-1 h-72 shrink-0">
      {/* File System - left half */}
      <div className="flex-1 min-w-0">
        <FileExplorer />
      </div>

      {/* Keyboard - right half */}
      <div className="flex-1 min-w-0">
        <Keyboard />
      </div>
    </div>
  );
}
