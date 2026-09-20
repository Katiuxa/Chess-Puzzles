"""Build adaptive + legacy icons from the golden knight crest.

Android adaptive safe zone ≈ 66% of the 108dp layer. Knight must fit
inside that circle so ears/base survive circle / squircle / teardrop masks.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "img" / "knight-crest.png"
RES = ROOT / "resources"
STORE = ROOT / "store-assets"

# Subtle depth: pure black → dark charcoal
BG_TOP = (0, 0, 0, 255)
BG_BOTTOM = (28, 28, 30, 255)

# Fraction of full adaptive canvas occupied by the knight (max side).
# 0.58 stays inside the ~0.66 safe circle with margin for ears/base.
SAFE_FILL = 0.58


def load_knight() -> Image.Image:
    im = Image.open(SRC).convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            lum = (r + g + b) / 3.0
            if lum < 22 and r < 40 and g < 35 and b < 35 and (r - b) < 25:
                px[x, y] = (0, 0, 0, 0)
    bbox = im.getbbox()
    if not bbox:
        return im
    pad = max(2, int(0.01 * max(bbox[2] - bbox[0], bbox[3] - bbox[1])))
    x0 = max(0, bbox[0] - pad)
    y0 = max(0, bbox[1] - pad)
    x1 = min(w, bbox[2] + pad)
    y1 = min(h, bbox[3] + pad)
    return im.crop((x0, y0, x1, y1))


def vertical_gradient(size: int) -> Image.Image:
    im = Image.new("RGBA", (size, size))
    px = im.load()
    for y in range(size):
        t = y / max(1, size - 1)
        r = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t)
        for x in range(size):
            px[x, y] = (r, g, b, 255)
    return im


def paste_knight(
    canvas: Image.Image,
    knight: Image.Image,
    fill: float,
) -> None:
    size = canvas.size[0]
    kw, kh = knight.size
    scale = (size * fill) / max(kw, kh)
    nw, nh = max(1, int(kw * scale)), max(1, int(kh * scale))
    scaled = knight.resize((nw, nh), Image.Resampling.LANCZOS)
    ox = (size - nw) // 2
    oy = (size - nh) // 2
    canvas.paste(scaled, (ox, oy), scaled)


def round_mask(size: int, radius: float) -> Image.Image:
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * radius), fill=255)
    return m


def circle_mask(size: int) -> Image.Image:
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.ellipse((0, 0, size - 1, size - 1), fill=255)
    return m


def apply_mask(src: Image.Image, mask: Image.Image) -> Image.Image:
    out = Image.new("RGBA", src.size, (0, 0, 0, 0))
    tmp = src.copy()
    tmp.putalpha(mask)
    out = Image.alpha_composite(out, tmp)
    return out


def main() -> None:
    knight = load_knight()
    RES.mkdir(parents=True, exist_ok=True)
    STORE.mkdir(parents=True, exist_ok=True)

    size = 1024
    bg = vertical_gradient(size)

    # Adaptive foreground: transparent + knight only (safe zone)
    fg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    paste_knight(fg, knight, SAFE_FILL)
    fg.save(RES / "icon-foreground.png", "PNG", optimize=True)
    print("resources/icon-foreground.png", f"fill={SAFE_FILL}")

    # Adaptive / splash background plate
    bg.save(RES / "icon-background.png", "PNG", optimize=True)
    print("resources/icon-background.png")

    # Legacy / Play listing: full composite (gradient + knight)
    icon = bg.copy()
    paste_knight(icon, knight, SAFE_FILL)
    icon.save(RES / "icon.png", "PNG", optimize=True)
    print("resources/icon.png", knight.size)

    store = icon.resize((512, 512), Image.Resampling.LANCZOS)
    store.save(STORE / "icon-512.png", "PNG", optimize=True)
    print("store-assets/icon-512.png")

    # Rounded-square preview (Android/iOS-like)
    preview = apply_mask(icon, round_mask(size, 0.22))
    preview.save(RES / "icon-rounded-preview.png", "PNG", optimize=True)

    # Circle preview (Play Protect / launcher round)
    circle = apply_mask(icon, circle_mask(size))
    circle.save(RES / "icon-circle-preview.png", "PNG", optimize=True)
    print("resources/icon-*-preview.png")

    # Splash
    sw, sh = 1242, 2436
    splash = Image.new("RGBA", (sw, sh), BG_TOP)
    # vertical gradient on splash
    for y in range(sh):
        t = y / max(1, sh - 1)
        r = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t)
        ImageDraw.Draw(splash).line([(0, y), (sw, y)], fill=(r, g, b, 255))
    plate = Image.new("RGBA", (900, 900), (0, 0, 0, 0))
    paste_knight(plate, knight, 0.72)
    splash.paste(plate, ((sw - 900) // 2, (sh - 900) // 2 - 40), plate)
    splash.convert("RGB").save(RES / "splash.png", "PNG", optimize=True)
    print("resources/splash.png")


if __name__ == "__main__":
    main()
