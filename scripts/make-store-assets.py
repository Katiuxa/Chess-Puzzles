"""Generate Google Play Store listing graphics for Chess Puzzles.

Outputs (under store-assets/):
  - icon-512.png              (512×512 app icon)
  - feature-graphic-1024x500.png
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "img" / "knight-crest.png"
OUT = ROOT / "store-assets"

BG_TOP = (0, 0, 0, 255)
BG_BOTTOM = (28, 28, 30, 255)
CREAM = (243, 234, 214, 255)
GOLD = (224, 195, 106, 255)


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
    return im.crop(
        (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(w, bbox[2] + pad),
            min(h, bbox[3] + pad),
        )
    )


def vertical_gradient(w: int, h: int) -> Image.Image:
    im = Image.new("RGBA", (w, h))
    px = im.load()
    for y in range(h):
        t = y / max(1, h - 1)
        r = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t)
        for x in range(w):
            px[x, y] = (r, g, b, 255)
    return im


def paste_knight(canvas: Image.Image, knight: Image.Image, fill: float, cx: int | None = None, cy: int | None = None) -> None:
    size = min(canvas.size)
    kw, kh = knight.size
    scale = (size * fill) / max(kw, kh)
    nw, nh = max(1, int(kw * scale)), max(1, int(kh * scale))
    scaled = knight.resize((nw, nh), Image.Resampling.LANCZOS)
    ox = (canvas.size[0] - nw) // 2 if cx is None else cx - nw // 2
    oy = (canvas.size[1] - nh) // 2 if cy is None else cy - nh // 2
    canvas.paste(scaled, (ox, oy), scaled)


def find_font(size: int, bold: bool = True) -> ImageFont.ImageFont:
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\calibrib.ttf" if bold else r"C:\Windows\Fonts\calibri.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def make_icon(knight: Image.Image) -> Path:
    # Play listing icon: full 512 square; keep knight inside ~72% so it isn't clipped in UI previews.
    canvas = vertical_gradient(512, 512)
    paste_knight(canvas, knight, 0.72)
    path = OUT / "icon-512.png"
    canvas.convert("RGB").save(path, "PNG", optimize=True)
    return path


def make_feature(knight: Image.Image) -> Path:
    w, h = 1024, 500
    canvas = vertical_gradient(w, h)
    # Soft gold glow behind knight
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i, alpha in enumerate((28, 18, 10)):
        r = 210 - i * 40
        gd.ellipse((120 - i * 20, 70 - i * 15, 120 + r, 70 + r + 40), fill=(224, 195, 106, alpha))
    canvas = Image.alpha_composite(canvas, glow)

    # Knight on the left third
    paste_knight(canvas, knight, 0.78, cx=210, cy=250)

    draw = ImageDraw.Draw(canvas)
    title_font = find_font(72, bold=True)
    sub_font = find_font(28, bold=False)
    title = "Chess Puzzles"
    tx = 430
    ty = 160
    draw.text((tx, ty), title, font=title_font, fill=CREAM)

    # True ink bounds (font metrics alone can sit above glyph bottoms)
    ink = Image.new("L", (w, h), 0)
    ImageDraw.Draw(ink).text((tx, ty), title, font=title_font, fill=255)
    ink_box = ink.getbbox()
    line_y = (ink_box[3] if ink_box else ty + 80) + 22
    line_x1 = tx
    line_x2 = ink_box[2] if ink_box else tx + 420
    draw.line((line_x1, line_y, line_x2, line_y), fill=GOLD, width=3)

    sub = "Composition puzzles"
    draw.text((tx, line_y + 22), sub, font=sub_font, fill=(200, 186, 160, 255))

    path = OUT / "feature-graphic-1024x500.png"
    canvas.convert("RGB").save(path, "PNG", optimize=True)
    return path


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "screenshots").mkdir(parents=True, exist_ok=True)
    knight = load_knight()
    icon = make_icon(knight)
    feature = make_feature(knight)
    print(icon, icon.stat().st_size)
    print(feature, feature.stat().st_size)


if __name__ == "__main__":
    main()
