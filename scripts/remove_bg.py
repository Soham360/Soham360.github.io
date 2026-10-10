#!/usr/bin/env python3
"""Remove the background from your profile picture.

Drop any photo into assets/img/source/ (any file name, any format Pillow can
read, plus HEIC/HEIF/AVIF via pillow-heif), then run:

    python scripts/remove_bg.py

The result is written to assets/img/ProfilePic.png with a transparent
background, cropped around you and sized for the site. If the folder holds
several images, the most recently modified one is used.

Setup (once):  pip install -r scripts/requirements.txt
"""

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "assets" / "img" / "source"
OUTPUT = ROOT / "assets" / "img" / "ProfilePic.png"

MAX_SIDE = 1200      # longest side of the working image, keeps the PNG small
PAD_RATIO = 0.04     # breathing room above and beside the subject
ALPHA_CUTOFF = 16    # alpha below this counts as empty when finding the subject


def register_extra_formats():
    """HEIC/HEIF/AVIF (iPhone photos and similar) need pillow-heif."""
    try:
        from pillow_heif import register_heif_opener
        register_heif_opener()
    except ImportError:
        pass


def find_source(explicit):
    if explicit:
        path = Path(explicit)
        if not path.is_file():
            sys.exit(f"File not found: {path}")
        return path

    if not SOURCE_DIR.is_dir():
        sys.exit(f"Create {SOURCE_DIR.relative_to(ROOT)}/ and put your photo in it.")

    candidates = sorted(
        (p for p in SOURCE_DIR.iterdir() if p.is_file() and not p.name.startswith(".")),
        key=lambda p: (p.stat().st_mtime, p.name),
    )
    if not candidates:
        sys.exit(f"No image found in {SOURCE_DIR.relative_to(ROOT)}/.")

    chosen = candidates[-1]
    if len(candidates) > 1:
        print(f"Several files found; using the newest: {chosen.name}")
    return chosen


def load_image(path):
    try:
        img = Image.open(path)
        img.load()
    except Exception as exc:
        sys.exit(
            f"Could not read {path.name} as an image ({exc}).\n"
            "For HEIC/HEIF/AVIF run: pip install pillow-heif. "
            "Camera RAW files should be exported to JPEG or PNG first."
        )
    img = ImageOps.exif_transpose(img)   # honor phone rotation
    img = img.convert("RGBA")
    img.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
    return img


def crop_to_subject(img):
    """Crop to the person, then place them on a square canvas, flush to the bottom."""
    mask = img.getchannel("A").point(lambda a: 255 if a > ALPHA_CUTOFF else 0)
    box = mask.getbbox()
    if box is None:
        sys.exit("No subject was detected. Try a photo with a clearer view of you, or --model u2net.")
    subject = img.crop(box)
    w, h = subject.size
    pad = int(max(w, h) * PAD_RATIO)
    side = max(w + 2 * pad, h + pad)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(subject, ((side - w) // 2, side - h), subject)
    return canvas


def main():
    parser = argparse.ArgumentParser(description="Remove the background from your profile picture.")
    parser.add_argument("image", nargs="?", help="optional path; defaults to the newest file in assets/img/source/")
    parser.add_argument("--model", default="u2net_human_seg",
                        help="rembg model (default: u2net_human_seg, tuned for people)")
    parser.add_argument("--matting", action="store_true",
                        help="smoother edges around hair; slower")
    parser.add_argument("--no-crop", action="store_true",
                        help="keep the original framing instead of cropping to the subject")
    args = parser.parse_args()

    register_extra_formats()
    src = find_source(args.image)
    print(f"Reading {src.name}")
    img = load_image(src)

    try:
        from rembg import new_session, remove
    except ImportError:
        sys.exit("rembg is not installed. Run: pip install -r scripts/requirements.txt")

    print("Removing background (the model downloads on first run)...")
    session = new_session(args.model)
    cut = remove(img, session=session, alpha_matting=args.matting)
    cut = cut.convert("RGBA")

    if not args.no_crop:
        cut = crop_to_subject(cut)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    cut.save(OUTPUT, optimize=True)
    print(f"Saved {OUTPUT.relative_to(ROOT)} ({cut.width}x{cut.height})")


if __name__ == "__main__":
    main()
