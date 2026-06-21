import Terminal from './Terminal';
import { InterfaceSettings, LayoutPresetId } from '../theme';

interface CenterPanelProps {
  settings: InterfaceSettings;
  deckSplit: number;
  onDeckSplitChange: (value: number) => void;
  onLayoutPresetChange: (id: LayoutPresetId) => void;
  onLayoutChange: (patch: Partial<InterfaceSettings['layout']>) => void;
  onSettingsChange: (patch: Partial<InterfaceSettings>) => void;
  onReplaceSettings: (settings: InterfaceSettings) => void;
  onOpenPalette: () => void;
  onOpenShutdown: () => void;
}

export default function CenterPanel(props: CenterPanelProps) {
  return (
    <div className="h-full flex flex-col min-h-0 min-w-0 border-x border-[rgba(0,255,65,0.1)] relative"
      style={{
        clipPath: 'polygon(0% 1.5vh, 1vh 0%, calc(100% - 1vh) 0%, 100% 1.5vh, 100% calc(100% - 1.5vh), calc(100% - 1vh) 100%, 1vh 100%, 0% calc(100% - 1.5vh))',
      }}
    >
      <div className="flex-1 overflow-hidden min-h-0">
        <Terminal {...props} />
      </div>
    </div>
  );
}
