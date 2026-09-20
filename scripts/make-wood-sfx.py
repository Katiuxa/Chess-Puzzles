"""Synthesize short wooden board SFX for Chess Puzzles."""
from __future__ import annotations

import math
import random
import struct
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "sounds"
SR = 44100


def clamp(x: float) -> float:
    return max(-1.0, min(1.0, x))


def write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        frames = b"".join(struct.pack("<h", int(clamp(s) * 32767)) for s in samples)
        w.writeframes(frames)
    print(path, len(samples) / SR, "s", path.stat().st_size, "bytes")


def noise() -> float:
    return random.uniform(-1.0, 1.0)


def wood_knock(
    duration: float = 0.11,
    soft: bool = False,
) -> list[float]:
    """Soft wood-on-wood tap: brief noise transient + damped body resonances."""
    n = int(SR * duration)
    out = [0.0] * n
    # Resonant partials typical of a small wood block / chessboard square
    partials = [
        (175.0, 0.85, 32.0),
        (290.0, 0.42, 42.0),
        (430.0, 0.18, 52.0),
        (720.0, 0.08, 75.0),
        (1050.0, 0.04, 95.0),
    ]
    amp = 0.48 if soft else 0.62
    attack = max(1, int(0.003 * SR))

    # Pre-filter noise state for a duller thump
    lp = 0.0
    for i in range(n):
        t = i / SR
        env_noise = math.exp(-t * (48 if soft else 58))
        a = min(1.0, i / attack)
        # Ease-in attack so the edge isn't clicky/harsh
        a = a * a
        raw = noise()
        lp = lp * 0.88 + raw * 0.12
        thump = lp * env_noise * a * (0.42 if soft else 0.52)

        body = 0.0
        for freq, gain, decay in partials:
            body += math.sin(2 * math.pi * freq * t) * gain * math.exp(-t * decay)

        # Tiny high click at the very start (wood grain / edge)
        click = 0.0
        if i < int(0.003 * SR):
            click = noise() * (1.0 - i / (0.003 * SR)) * 0.08

        out[i] = clamp((thump + body * 0.38 + click) * amp)

    # Soft normalize (leave headroom so it stays gentle)
    peak = max(abs(s) for s in out) or 1.0
    return [s * (0.72 / peak) for s in out]


def wood_capture() -> list[float]:
    """Slightly fuller knock for captures — still wood, not plastic."""
    a = wood_knock(0.13, soft=False)
    b = wood_knock(0.09, soft=True)
    # Layer a delayed softer tap
    out = list(a)
    delay = int(0.012 * SR)
    for i, s in enumerate(b):
        j = i + delay
        if j < len(out):
            out[j] += s * 0.35
        else:
            out.append(s * 0.35)
    peak = max(abs(s) for s in out) or 1.0
    return [s * (0.9 / peak) for s in out]


def wood_select() -> list[float]:
    """Light wood lift / fingertip tap."""
    return wood_knock(0.07, soft=True)


def main() -> None:
    random.seed(42)
    write_wav(OUT / "move.wav", wood_knock(0.105, soft=False))
    random.seed(7)
    write_wav(OUT / "capture.wav", wood_capture())
    random.seed(99)
    write_wav(OUT / "select.wav", wood_select())


if __name__ == "__main__":
    main()
