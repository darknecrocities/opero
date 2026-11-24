#!/usr/bin/env python3
"""
Generate native macOS (.icns), Windows (.ico), and Tauri PNG icon sets
from assets/images/brand/opero-app-icon-1024.png.
"""

from pathlib import Path
import shutil
import subprocess
import sys
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_ICON = REPO_ROOT / "assets" / "images" / "brand" / "opero-app-icon-1024.png"
OUT_DIR = REPO_ROOT / "apps" / "desktop" / "src-tauri" / "icons"


def main() -> int:
    if not SRC_ICON.exists():
        print(f"[ERROR] Source brand icon missing: {SRC_ICON}", file=sys.stderr)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    img = Image.open(SRC_ICON).convert("RGBA")

    # 1. Standard Tauri PNGs
    for name, size in [
        ("32x32.png", 32),
        ("128x128.png", 128),
        ("128x128@2x.png", 256),
        ("icon.png", 512),
    ]:
        img.resize((size, size), Image.Resampling.LANCZOS).save(OUT_DIR / name, format="PNG")

    # 2. Windows multi-resolution .ico (16..256px)
    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img.save(OUT_DIR / "icon.ico", format="ICO", sizes=ico_sizes)

    # 3. macOS Retina .icns via iconutil
    if shutil.which("iconutil"):
        iconset = OUT_DIR / "opero.iconset"
        if iconset.exists():
            shutil.rmtree(iconset)
        iconset.mkdir(parents=True, exist_ok=True)
        for sz in [16, 32, 128, 256, 512]:
            img.resize((sz, sz), Image.Resampling.LANCZOS).save(iconset / f"icon_{sz}x{sz}.png")
            img.resize((sz * 2, sz * 2), Image.Resampling.LANCZOS).save(iconset / f"icon_{sz}x{sz}@2x.png")
        subprocess.run(
            ["iconutil", "-c", "icns", str(iconset), "-o", str(OUT_DIR / "icon.icns")],
            check=True,
        )
        shutil.rmtree(iconset)

    print(f"[OK] Generated native macOS (.icns), Windows (.ico), and PNG icons in {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
