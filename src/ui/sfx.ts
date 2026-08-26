const FILES = {
  select: `${import.meta.env.BASE_URL}sounds/select.wav`,
  move: `${import.meta.env.BASE_URL}sounds/move.wav`,
  capture: `${import.meta.env.BASE_URL}sounds/capture.wav`,
} as const;

type SfxName = keyof typeof FILES;

const cache = new Map<SfxName, HTMLAudioElement>();
const volume: Record<SfxName, number> = {
  select: 0.22,
  move: 0.28,
  capture: 0.32,
};

let lastAt = 0;
let lastName: SfxName | null = null;
let current: HTMLAudioElement | null = null;

function getAudio(name: SfxName): HTMLAudioElement {
  let audio = cache.get(name);
  if (!audio) {
    audio = new Audio(FILES[name]);
    audio.preload = "auto";
    cache.set(name, audio);
  }
  return audio;
}

export function preloadSfx(): void {
  (Object.keys(FILES) as SfxName[]).forEach((name) => getAudio(name));
}

export function playSfx(name: SfxName): void {
  const now = performance.now();
  if (name === lastName && now - lastAt < 90) return;
  lastAt = now;
  lastName = name;

  if (current) {
    current.pause();
    current.currentTime = 0;
  }

  const audio = getAudio(name);
  audio.volume = volume[name];
  audio.currentTime = 0;
  current = audio;
  void audio.play().catch(() => {
    /* autoplay blocked until a gesture; next click will work */
  });
}
