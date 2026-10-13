"""Drop-folder side of the reel-brain skill.

    python reel_brain.py scan
        List new reels (video files) and carousels (subfolders of images) in the
        drop folder as JSON. Skips done/ and anything modified in the last
        15 minutes, so a file Google Drive is still syncing is left for next run.

    python reel_brain.py prepare <item>
        Reel: transcribe the audio (session-transcripts' Whisper) and tile a
        frame every 3 s into contact sheets. Carousel: convert slides to JPEG in
        order. Prints JSON with the paths to read.

    python reel_brain.py finalize <item> --date YYYY-MM-DD --kind reel|carousel
                                  --slug energy-mapping --md <mirror .md>
        Rename the item to <date>_<kind>_<slug>, move it into done/, put a copy
        of the Brain .md (and the .srt for a reel) beside it, and delete the
        transcriber's intermediate files. Run only after the push succeeded.
"""

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
import time
from datetime import datetime
from pathlib import Path

DROP = Path(r"G:\My Drive\Pilates Physics Content\BRAIN - Reels and Carousels")
DONE = DROP / "done"
WORK = Path(tempfile.gettempdir()) / "reel-brain"
TRANSCRIBER = Path.home() / ".claude" / "skills" / "session-transcripts"
PYTHON = TRANSCRIBER / ".venv" / "Scripts" / "python.exe"
FFMPEG = TRANSCRIBER / "bin" / "ffmpeg.exe"

VIDEO_EXTS = {".mp4", ".mov", ".m4v"}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
SETTLE_SECONDS = 15 * 60
SHEET_EVERY_S = 3  # one frame per 3 s, 6 frames (3x2) per sheet = 18 s/sheet


def natural_key(p):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", p.name)]


def guess_date(path):
    """Leading YYYY-MM-DD (posted date you typed) wins, then an Edits export
    stamp like _20261013_082707, then the file's modified date."""
    m = re.match(r"(\d{4}-\d{2}-\d{2})", path.name)
    if m:
        return m.group(1), "filename"
    m = re.search(r"(20\d{2})(\d{2})(\d{2})_\d{6}", path.name)
    if m:
        return "-".join(m.groups()), "export stamp"
    return datetime.fromtimestamp(path.stat().st_mtime).strftime("%Y-%m-%d"), "file modified"


def subject_hint(path):
    s = path.stem if path.is_file() else path.name
    s = re.sub(r"^\d{4}-\d{2}-\d{2}[ _-]*", "", s)
    s = re.sub(r"^Edits_", "", s, flags=re.I)
    s = re.sub(r"_?20\d{6}_\d{6}$", "", s)
    return re.sub(r"[_-]+", " ", s).strip()


def newest_mtime(path):
    if path.is_file():
        return path.stat().st_mtime
    return max([f.stat().st_mtime for f in path.rglob("*")] + [path.stat().st_mtime])


def work_dir_for(item):
    name = item.stem if item.is_file() else item.name
    return WORK / re.sub(r"[^A-Za-z0-9]+", "-", name)


def companions(video):
    """Side files the transcriber writes next to a video."""
    return [video.with_name(video.stem + s) for s in
            (".transcript.txt", ".transcript.json", ".transcript.txt.partial", ".srt")]


def scan():
    items, waiting = [], []
    now = time.time()
    for p in sorted(DROP.iterdir(), key=natural_key):
        if p.name == "done" or p.name.startswith(".") or p.name.lower() == "desktop.ini":
            continue
        if p.is_file():
            if p.suffix.lower() not in VIDEO_EXTS:
                continue
            kind = "reel"
        elif any(f.suffix.lower() in IMAGE_EXTS for f in p.iterdir()):
            kind = "carousel"
        else:
            continue
        if now - newest_mtime(p) < SETTLE_SECONDS:
            waiting.append(str(p))
            continue
        date, source = guess_date(p)
        caption = (p.with_name(p.stem + ".caption.txt") if p.is_file() else p / "caption.txt")
        items.append({
            "item": str(p), "kind": kind, "date": date, "date_source": source,
            "subject_hint": subject_hint(p),
            "caption_file": str(caption) if caption.exists() else None,
        })
    print(json.dumps({"items": items, "still_syncing": waiting}, indent=2))


def prepare(item):
    item = Path(item)
    work = work_dir_for(item)
    shutil.rmtree(work, ignore_errors=True)
    work.mkdir(parents=True)
    out = {"item": str(item), "work_dir": str(work)}

    if item.is_file():
        subprocess.run([str(PYTHON), str(TRANSCRIBER / "scripts" / "transcribe.py"),
                        "--include-raw", str(item)], check=True)
        txt = item.with_name(item.stem + ".transcript.txt")
        out["transcript"] = str(txt) if txt.exists() else None
        subprocess.run([str(FFMPEG), "-nostdin", "-v", "error", "-i", str(item),
                        "-vf", f"fps=1/{SHEET_EVERY_S},scale=540:-2,tile=3x2",
                        "-q:v", "4", str(work / "sheet_%02d.jpg")], check=True)
        out["sheets"] = [str(p) for p in sorted(work.glob("sheet_*.jpg"))]
        out["sheet_note"] = (f"Each sheet is 6 frames, {SHEET_EVERY_S} s apart, read left to "
                             f"right then top to bottom; sheet N starts at {SHEET_EVERY_S * 6}*(N-1) s.")
    else:
        slides = sorted((f for f in item.iterdir() if f.suffix.lower() in IMAGE_EXTS), key=natural_key)
        out["slides"] = []
        for i, f in enumerate(slides, 1):
            dest = work / f"slide_{i:02d}.jpg"
            subprocess.run([str(FFMPEG), "-nostdin", "-v", "error", "-i", str(f),
                            "-vf", "scale='min(1080,iw)':-2", "-q:v", "3", str(dest)], check=True)
            out["slides"].append({"n": i, "source": f.name, "jpg": str(dest)})
    print(json.dumps(out, indent=2))


def finalize(item, date, kind, slug, md):
    item, md = Path(item), Path(md)
    base = f"{date}_{kind}_{slug}"
    work = work_dir_for(item)
    DONE.mkdir(exist_ok=True)
    if item.is_file():
        dest = DONE / (base + item.suffix.lower())
        srt = item.with_suffix(".srt")
        if srt.exists():
            shutil.move(str(srt), str(DONE / (base + ".srt")))
        for side in companions(item):
            side.unlink(missing_ok=True)
        caption = item.with_name(item.stem + ".caption.txt")
        if caption.exists():
            shutil.move(str(caption), str(DONE / (base + ".caption.txt")))
    else:
        dest = DONE / base
    if dest.exists():
        sys.exit(f"Refusing to overwrite {dest}")
    shutil.move(str(item), str(dest))
    shutil.copyfile(md, DONE / (base + ".md"))
    shutil.rmtree(work, ignore_errors=True)
    print(f"Filed {dest}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("scan")
    p = sub.add_parser("prepare"); p.add_argument("item")
    f = sub.add_parser("finalize"); f.add_argument("item")
    f.add_argument("--date", required=True); f.add_argument("--kind", required=True, choices=["reel", "carousel"])
    f.add_argument("--slug", required=True); f.add_argument("--md", required=True)
    a = ap.parse_args()
    if a.cmd == "scan":
        scan()
    elif a.cmd == "prepare":
        prepare(a.item)
    else:
        finalize(a.item, a.date, a.kind, a.slug, a.md)
