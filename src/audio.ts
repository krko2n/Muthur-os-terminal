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

export type SoundPack = 'ship' | 'quiet' | 'retro' | 'horror' | 'combat' | 'field' | 'recorder' | 'alarm' | 'analog';

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

const PACK_FILES: Partial<Record<SoundPack, Partial<Record<SoundName, string>>>> = {
  field: {
    keyboard: '/audio/keyboard.wav',
    folder: '/audio/folder.wav',
    expand: '/audio/expand.wav',
    error: '/audio/error.wav',
    granted: '/audio/granted.wav',
    denied: '/audio/denied.wav',
    info: '/audio/info.wav',
    panels: '/audio/panels.wav',
    scan: '/audio/scan.wav',
    theme: '/audio/theme.wav',
    boot: '/audio/theme.wav',
  },
  recorder: {
    keyboard: '/audio/ui-click.ogg',
    folder: '/audio/core-field.ogg',
    expand: '/audio/core-door-open.ogg',
    error: '/audio/error.wav',
    granted: '/audio/info.wav',
    denied: '/audio/denied.wav',
    info: '/audio/scan.wav',
    panels: '/audio/panels.wav',
    scan: '/audio/scan.wav',
    theme: '/audio/theme.wav',
    boot: '/audio/core-computer.ogg',
  },
  alarm: {
    keyboard: '/audio/ui-glitch.ogg',
    folder: '/audio/core-laser.ogg',
    expand: '/audio/core-thruster.ogg',
    error: '/audio/error.wav',
    granted: '/audio/core-laser.ogg',
    denied: '/audio/denied.wav',
    info: '/audio/info.wav',
    panels: '/audio/core-door-open.ogg',
    scan: '/audio/core-field.ogg',
    theme: '/audio/core-engine.ogg',
    boot: '/audio/core-computer.ogg',
  },
  analog: {
    keyboard: '/audio/ui-click.ogg',
    folder: '/audio/folder.wav',
    expand: '/audio/expand.wav',
    error: '/audio/ui-error.ogg',
    granted: '/audio/granted.wav',
    denied: '/audio/denied.wav',
    info: '/audio/info.wav',
    panels: '/audio/panels.wav',
    scan: '/audio/core-field.ogg',
    theme: '/audio/theme.wav',
    boot: '/audio/core-computer.ogg',
  },
};

const audioCache: Map<string, HTMLAudioElement> = new Map();
let audioEnabled = true;
let masterVolume = 0.65;
let soundPack: SoundPack = 'ship';
let audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  const silent = new Audio();
  silent.volume = 0;
  silent.play().catch(() => {});
  document.removeEventListener('click', unlockAudio);
  document.removeEventListener('keydown', unlockAudio);
  document.removeEventListener('pointerdown', unlockAudio);
}

document.addEventListener('click', unlockAudio, { once: true });
document.addEventListener('keydown', unlockAudio, { once: true });
document.addEventListener('pointerdown', unlockAudio, { once: true });

const PACK_GAIN: Record<SoundPack, number> = {
  ship: 1,
  quiet: 0.38,
  retro: 0.78,
  horror: 0.9,
  combat: 1.12,
  field: 0.72,
  recorder: 0.62,
  alarm: 1.05,
  analog: 0.82,
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
  field: {
    switch: 'folder',
    scroll: 'keyboard',
    orbit: 'scan',
    thrust: 'panels',
  },
  recorder: {
    keyboard: 'scroll',
    switch: 'scan',
    game: 'error',
    thrust: 'orbit',
  },
  alarm: {
    keyboard: 'switch',
    info: 'scan',
    scroll: 'switch',
    orbit: 'thrust',
  },
  analog: {
    switch: 'expand',
    scroll: 'keyboard',
    game: 'granted',
  },
};

function getAudio(source: string): HTMLAudioElement {
  let audio = audioCache.get(source);
  if (!audio) {
    audio = new Audio(source);
    audio.preload = 'auto';
    audioCache.set(source, audio);
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
    const source = PACK_FILES[soundPack]?.[resolvedName] ?? SOUND_FILES[resolvedName];
    const audio = getAudio(source);
    audio.volume = Math.max(0, Math.min(1, volume * masterVolume * PACK_GAIN[soundPack]));
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}
}
