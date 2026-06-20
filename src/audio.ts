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

function getAudio(name: SoundName): HTMLAudioElement {
  let audio = audioCache.get(name);
  if (!audio) {
    audio = new Audio(SOUND_FILES[name]);
    audio.preload = 'auto';
    audioCache.set(name, audio);
  }
  return audio;
}

export function configureAudio(enabled: boolean, volume: number) {
  audioEnabled = enabled;
  masterVolume = Math.max(0, Math.min(1, volume));
}

export function playSound(name: SoundName, volume = 0.15) {
  if (!audioEnabled) return;

  try {
    const audio = getAudio(name);
    audio.volume = Math.max(0, Math.min(1, volume * masterVolume));
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}
}
