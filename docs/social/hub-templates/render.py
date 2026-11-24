"""Render @kaleenc_ reel covers and carousel slides in the Kaleen Hub design system.

  python docs/social/hub-templates/render.py SPEC.json OUT_DIR

SPEC.json is either a reel cover:
  {"kind": "reel", "style": "r1" | "r2", "hook": "Can you be|too precise?",
   "kicker": "Engineering / Pilates",      # r2 only, optional
   "image": "frame.jpg", "focus": "50% 30%"}
  R-01 can frame a graphic instead of a photo: add "graphic": true with a chart
  "image", or pass inline "svg" markup.
or a carousel:
  {"kind": "carousel", "handle": "@kaleenc_", "slides": [ {...}, ... ]}
  slide types: hook, story, list, figure, data, equation, close (see README.md).

Image paths are relative to SPEC.json. "|" breaks a line, [[word]] turns it blue
(data slides only). No italics. Output: cover.png, or slide-01.png ... in OUT_DIR,
each 1080 px wide. Needs Chrome and network for Google Fonts.
"""
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
CHROME = next((p for p in [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
] if Path(p).exists()), None)


def shoot(spec, height, out_png, workdir):
    page = workdir / "page.html"
    html = (HERE / "render.html").read_text(encoding="utf-8")
    payload = json.dumps(spec, ensure_ascii=False).replace("</", "<\\/")
    start = html.index("/*SPEC*/")
    end = html.index("</script>", start)
    page.write_text(html[:start] + "/*SPEC*/" + payload + html[end:], encoding="utf-8")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                    "--force-device-scale-factor=2", f"--window-size=540,{height}",
                    "--virtual-time-budget=6000", f"--screenshot={out_png}", page.as_uri()],
                   check=True, capture_output=True)
    print("wrote", out_png)


def stage_images(obj, src_dir, workdir):
    """Copy referenced images next to the temp page so file:// can load them."""
    if isinstance(obj, dict):
        for key in ("image",):
            if key in obj and obj[key]:
                src = (src_dir / obj[key]).resolve()
                dst = workdir / f"img_{abs(hash(str(src)))}{src.suffix}"
                shutil.copy(src, dst)
                obj[key] = dst.name
        for v in obj.values():
            stage_images(v, src_dir, workdir)
    elif isinstance(obj, list):
        for v in obj:
            stage_images(v, src_dir, workdir)


def main():
    if len(sys.argv) != 3 or not CHROME:
        sys.exit(__doc__ if CHROME else "Chrome not found")
    spec_path, out = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
    out.mkdir(parents=True, exist_ok=True)
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        stage_images(spec, spec_path.parent, work)
        if spec["kind"] == "reel":
            shoot(spec, 960, out / "cover.png", work)
            return
        slides = spec["slides"]
        if slides[-1].get("type") != "close":
            print("Warning: the last slide should be a 'close' slide carrying the CTA.")
        for i, slide in enumerate(slides, 1):
            one = {"kind": "carousel", "handle": spec.get("handle", "@kaleenc_"),
                   "index": i, "total": len(slides), "slide": slide}
            shoot(one, 675, out / f"slide-{i:02d}.png", work)


if __name__ == "__main__":
    main()
