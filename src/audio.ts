export type SoundName =
  | 'keyboard'
  | 'folder'
  | 'expand'
  | 'error'
  | 'granted'
  | 'denied'
  | 'info'
  | 'panels'
  | 'scan'
  | 'theme'
  | 'boot'
  | 'switch'
  | 'scroll'
  | 'game'
  | 'thrust'
  | 'orbit';

export type SoundPack = 'ship' | 'quiet' | 'retro' | 'horror' | 'combat';

const SOUND_FILES: Record<SoundName, string> = {
  keyboard: '/audio/ui-click.ogg',
  folder: '/audio/ui-open.ogg',
  expand: '/audio/ui-expand.ogg',
  error: '/audio/ui-error.ogg',
  granted: '/audio/ui-confirm.ogg',
  denied: '/audio/ui-error.ogg',
  info: '/audio/ui-open.ogg',
  panels: '/audio/core-door-open.ogg',
  scan: '/audio/core-field.ogg',
  theme: '/audio/core-engine.ogg',
  boot: '/audio/core-computer.ogg',
  switch: '/audio/ui-glitch.ogg',
  scroll: '/audio/ui-scroll.ogg',
  game: '/audio/core-laser.ogg',
  thrust: '/audio/core-thruster.ogg',
  orbit: '/audio/core-orbit.ogg',
};

const audioCache: Map<string, HTMLAudioElement> = new Map();
let audioEnabled = true;
let masterVolume = 0.65;
let soundPack: SoundPack = 'ship';

const PACK_GAIN: Record<SoundPack, number> = {
  ship: 1,
  quiet: 0.38,
  retro: 0.78,
  horror: 0.9,
  combat: 1.12,
};

const PACK_ALIASES: Partial<Record<SoundPack, Partial<Record<SoundName, SoundName>>>> = {
  retro: {
    boot: 'keyboard',
    theme: 'switch',
    panels: 'expand',
    orbit: 'scan',
  },
  horror: {
    keyboard: 'scan',
    switch: 'scan',
    denied: 'error',
    info: 'orbit',
  },
  combat: {
    granted: 'game',
    denied: 'error',
    switch: 'game',
    panels: 'thrust',
  },
};

function getAudio(name: SoundName): HTMLAudioElement {
  let audio = audioCache.get(name);
  if (!audio) {
    audio = new Audio(SOUND_FILES[name]);
    audio.preload = 'auto';
    audioCache.set(name, audio);
  }
  return audio;
}

export function configureAudio(enabled: boolean, volume: number, pack: SoundPack = 'ship') {
  audioEnabled = enabled;
  masterVolume = Math.max(0, Math.min(1, volume));
  soundPack = pack;
}

export function playSound(name: SoundName, volume = 0.15) {
  if (!audioEnabled) return;

  try {
    const resolvedName = PACK_ALIASES[soundPack]?.[name] ?? name;
    const audio = getAudio(resolvedName);
    audio.volume = Math.max(0, Math.min(1, volume * masterVolume * PACK_GAIN[soundPack]));
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}
}
