const audioCache: Map<string, HTMLAudioElement> = new Map();

function getAudio(name: string): HTMLAudioElement {
  let audio = audioCache.get(name);
  if (!audio) {
    audio = new Audio(`/audio/${name}.wav`);
    audioCache.set(name, audio);
  }
  return audio;
}

export function playSound(name: 'keyboard' | 'folder' | 'expand' | 'error' | 'granted' | 'denied' | 'info' | 'panels' | 'scan', volume = 0.15) {
  try {
    const audio = getAudio(name);
    audio.volume = volume;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}
}
