"""Write Android mipmap / splash assets from resources/icon*.png."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / "resources"
# android-app/app/src/main
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "android-app" / "app" / "src" / "main"

BG = (0, 0, 0, 255)


def main() -> None:
    icon = Image.open(RES / "icon.png").convert("RGBA")
    fg = Image.open(RES / "icon-foreground.png").convert("RGBA")
    bg_path = RES / "icon-background.png"
    bg = Image.open(bg_path).convert("RGBA") if bg_path.exists() else None
    dens = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    for folder, size in dens.items():
        d = SRC / "res" / folder
        d.mkdir(parents=True, exist_ok=True)
        icon.resize((size, size), Image.Resampling.LANCZOS).save(d / "ic_launcher.png")
        icon.resize((size, size), Image.Resampling.LANCZOS).save(d / "ic_launcher_round.png")
        # Adaptive layers are 108dp when launcher is 72dp → 1.5×
        layer = int(round(size * 1.5))
        fg.resize((layer, layer), Image.Resampling.LANCZOS).save(d / "ic_launcher_foreground.png")
        if bg is not None:
            bg.resize((layer, layer), Image.Resampling.LANCZOS).save(d / "ic_launcher_background.png")
    print("mipmaps ok")

    splash_src = Image.open(RES / "splash.png").convert("RGBA")
    splash_map = {
        "drawable": (480, 800),
        "drawable-port-mdpi": (320, 480),
        "drawable-port-hdpi": (480, 800),
        "drawable-port-xhdpi": (720, 1280),
        "drawable-port-xxhdpi": (1080, 1920),
        "drawable-land-mdpi": (480, 320),
        "drawable-land-hdpi": (800, 480),
        "drawable-land-xhdpi": (1280, 720),
    }
    for folder, (w, h) in splash_map.items():
        d = SRC / "res" / folder
        d.mkdir(parents=True, exist_ok=True)
        scale = max(w / splash_src.width, h / splash_src.height)
        nw, nh = int(splash_src.width * scale), int(splash_src.height * scale)
        resized = splash_src.resize((nw, nh), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (w, h), BG)
        canvas.paste(resized, ((w - nw) // 2, (h - nh) // 2), resized)
        canvas.convert("RGB").save(d / "splash.png")
    print("splashes ok")


if __name__ == "__main__":
    main()
