"""Reel cover template for @kaleenc_ ("floor title").

Full-frame photo, serif hook on the floor over a soft dark fade. No logo.
Output is 1080x1920. The hook stays inside the 3:4 profile grid crop (y 240 to 1680).

  python docs/social/reel_cover.py FRAME.jpg OUT.jpg "I *crashed* my carriage|so you don't|have to"

"|" breaks lines (three at most) and *word* sets one word in amber italic. Keep each
line under about 20 characters. Pick a frame with no burned-in caption. Needs Pillow.
"""
import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[2]
FONTS = REPO / "api" / "_assets" / "fonts"
SERIF = FONTS / "SourceSerif4-Semibold.ttf"
ITALIC = FONTS / "SourceSerif4-It.ttf"

W, H = 1080, 1920
DARK, CREAM, AMBER = (14, 13, 11), (246, 243, 236), (240, 159, 38)
FADE_START, FADE_LENGTH, FADE_MAX = 1150, 220, 232
TEXT_X, TEXT_BOTTOM, SIZE, LINE_H = 80, 1610, 96, 108


def fade(img):
    ramp = Image.new("L", (1, H))
    for y in range(H):
        ramp.putpixel((0, y), int(FADE_MAX * max(0.0, min(1.0, (y - FADE_START) / FADE_LENGTH))))
    shade = Image.new("RGBA", (W, H), DARK + (255,))
    shade.putalpha(ramp.resize((W, H)))
    return Image.alpha_composite(img.convert("RGBA"), shade).convert("RGB")


def add_hook(img, hook):
    draw = ImageDraw.Draw(img)
    lines = hook.split("|")
    y = TEXT_BOTTOM - LINE_H * len(lines)
    regular, emphasis = ImageFont.truetype(str(SERIF), SIZE), ImageFont.truetype(str(ITALIC), SIZE)
    for line in lines:
        x = TEXT_X
        for i, part in enumerate(line.strip().split("*")):
            font, fill = (emphasis, AMBER) if i % 2 else (regular, CREAM)
            draw.text((x, y), part, font=font, fill=fill)
            x += draw.textlength(part, font=font)
        if x > W - TEXT_X:
            print(f"Warning: line runs past the margin: {line!r}")
        y += LINE_H


def main():
    parser = argparse.ArgumentParser(description="Render a reel cover.")
    parser.add_argument("frame")
    parser.add_argument("out")
    parser.add_argument("hook")
    args = parser.parse_args()
    img = fade(Image.open(args.frame).convert("RGB").resize((W, H), Image.LANCZOS))
    add_hook(img, args.hook)
    img.save(args.out, quality=93)
    print(args.out)


if __name__ == "__main__":
    main()
