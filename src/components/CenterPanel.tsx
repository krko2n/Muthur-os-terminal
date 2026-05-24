import { useState } from 'react';
import Terminal from './Terminal';
import FileExplorer from './FileExplorer';

export default function CenterPanel() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'browser'>('terminal');

  return (
    <div className="flex-1 flex flex-col gap-2">
      {/* Main content area */}
      <div className="panel flex-1 flex flex-col">
        <div className="panel-header flex gap-4">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-4 py-1 ${
              activeTab === 'terminal'
                ? 'bg-muthur-primary text-black'
                : 'text-muthur-primary hover:bg-muthur-border'
            } transition-colors`}
          >
            TERMINAL
          </button>
          <button
            onClick={() => setActiveTab('browser')}
            className={`px-4 py-1 ${
              activeTab === 'browser'
                ? 'bg-muthur-secondary text-black'
                : 'text-muthur-secondary hover:bg-muthur-border'
            } transition-colors`}
          >
            BROWSER
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === 'terminal' ? (
            <Terminal />
          ) : (
            <div className="h-full flex items-center justify-center text-muthur-border">
              BROWSER MODULE LOADING...
            </div>
          )}
        </div>
      </div>

      {/* Bottom section - File Explorer */}
      <div className="h-48">
        <FileExplorer />
      </div>
    </div>
  );
}
