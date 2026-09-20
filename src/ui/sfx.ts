const FILES = {
  select: `${import.meta.env.BASE_URL}sounds/select.wav`,
  move: `${import.meta.env.BASE_URL}sounds/move.wav`,
  capture: `${import.meta.env.BASE_URL}sounds/capture.wav`,
} as const;

type SfxName = keyof typeof FILES;

const MUTE_KEY = "sherzod-muted";

const volume: Record<SfxName, number> = {
  select: 0.22,
  move: 0.32,
  capture: 0.38,
};

const buffers = new Map<SfxName, AudioBuffer>();
let ctx: AudioContext | null = null;
let muted = loadMuted();
let lastAt = 0;
let lastName: SfxName | null = null;
let unlockBound = false;

function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function persistMuted(value: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {
    /* private mode */
  }
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  persistMuted(value);
}

export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}

function getCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

function unlockAudio(): void {
  const c = getCtx();
  if (c.state === "suspended") void c.resume();
}

function bindUnlock(): void {
  if (unlockBound) return;
  unlockBound = true;
  const once = () => {
    unlockAudio();
    window.removeEventListener("pointerdown", once, true);
    window.removeEventListener("touchstart", once, true);
    window.removeEventListener("keydown", once, true);
  };
  window.addEventListener("pointerdown", once, true);
  window.addEventListener("touchstart", once, true);
  window.addEventListener("keydown", once, true);
}

async function loadBuffer(name: SfxName): Promise<AudioBuffer> {
  const existing = buffers.get(name);
  if (existing) return existing;
  const res = await fetch(FILES[name]);
  const raw = await res.arrayBuffer();
  const decoded = await getCtx().decodeAudioData(raw.slice(0));
  buffers.set(name, decoded);
  return decoded;
}

export function preloadSfx(): void {
  bindUnlock();
  unlockAudio();
  (Object.keys(FILES) as SfxName[]).forEach((name) => {
    void loadBuffer(name).catch(() => {
      /* ignore until first gesture */
    });
  });
}

export function playSfx(name: SfxName): void {
  if (muted) return;
  bindUnlock();
  unlockAudio();

  const now = performance.now();
  // Allow overlapping wood taps; only debounce identical spam
  if (name === lastName && now - lastAt < 35) return;
  lastAt = now;
  lastName = name;

  const buf = buffers.get(name);
  if (!buf) {
    void loadBuffer(name).then(() => playSfx(name)).catch(() => {});
    return;
  }

  const c = getCtx();
  const src = c.createBufferSource();
  src.buffer = buf;
  const gain = c.createGain();
  gain.gain.value = volume[name];
  src.connect(gain);
  gain.connect(c.destination);
  try {
    src.start(0);
  } catch {
    /* ignore */
  }
}
