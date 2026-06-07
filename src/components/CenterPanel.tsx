import { useState } from 'react';
import Terminal from './Terminal';
import FileExplorer from './FileExplorer';
import Browser from './Browser';

export default function CenterPanel() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'browser'>('terminal');

  return (
    <div className="flex-1 flex flex-col gap-2">
      <div className="panel flex-1 flex flex-col min-h-0">
        <div className="panel-header flex gap-4 shrink-0">
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

        <div className="flex-1 overflow-hidden min-h-0">
          {activeTab === 'terminal' ? <Terminal /> : <Browser />}
        </div>
      </div>

      <div className="h-48 shrink-0">
        <FileExplorer />
      </div>
    </div>
  );
}
