import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface HardwareInfo {
  manufacturer: string;
  model: string;
  chassis: string;
}

export default function HardwareInspector() {
  const [info, setInfo] = useState<HardwareInfo | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await invoke('get_hardware_info') as HardwareInfo;
        setInfo(data);
      } catch {}
    };
    fetch();
  }, []);

  if (!info) return null;

  return (
    <div className="shrink-0">
      <div className="text-[10px] tracking-wider opacity-50 mb-1 panel-header-bracket border-t border-[rgba(0,255,65,0.15)] pt-1">
        HARDWARE
      </div>
      <div className="text-[10px] text-muthur-secondary space-y-0.5">
        <div className="flex justify-between">
          <span className="opacity-50">MFR</span>
          <span className="truncate ml-2">{info.manufacturer}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-50">MDL</span>
          <span className="truncate ml-2">{info.model}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-50">TYPE</span>
          <span>{info.chassis}</span>
        </div>
      </div>
    </div>
  );
}
