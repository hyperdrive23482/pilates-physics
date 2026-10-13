"""Sync the Pilates Physics Brain (Supabase brain_entries) with docs/brain/.

Supabase is the source of truth. `pull` rewrites the local mirror from it;
`push` upserts one entry through api/admin/content/brain-ingest.js and then
pulls, so the local file always matches what is live.

    python brain_sync.py pull
    python brain_sync.py push entry.json     # {"type","title","content","source_url"?}

Reads BRAIN_INGEST_URL and BRAIN_INGEST_SECRET from the repo's .env.
Standard library only.
"""

import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
BRAIN_DIR = REPO / "docs" / "brain"
TYPE_DIRS = {
    "transcript": "transcripts",
    "persona": "personas",
    "blog_post": "blog-posts",
    "style_guide": "style-guides",
}
# Titles written by this skill: "Energy Mapping (Reel, 2026-10-13)"
POSTED_TITLE = re.compile(r"^(.*) \((Reel|Carousel), (\d{4}-\d{2}-\d{2})\)$")


def load_env():
    env = {}
    for line in (REPO / ".env").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    missing = [k for k in ("BRAIN_INGEST_URL", "BRAIN_INGEST_SECRET") if not env.get(k)]
    if missing:
        sys.exit(f"Missing in {REPO / '.env'}: {', '.join(missing)}")
    return env["BRAIN_INGEST_URL"], env["BRAIN_INGEST_SECRET"]


def request(method, body=None):
    url, secret = load_env()
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {secret}",
        "Content-Type": "application/json",
        "User-Agent": "reel-brain/1.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {url} -> {e.code}: {e.read().decode('utf-8', 'replace')}")


def slugify(text):
    text = text.lower().replace("'", "")
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")[:80] or "untitled"


def filename_for(entry):
    m = POSTED_TITLE.match(entry["title"])
    if m:
        name, fmt, date = m.groups()
        return f"{date}_{fmt.lower()}_{slugify(name)}.md"
    return f"{slugify(entry['title'])}.md"


def render(entry):
    q = json.dumps  # JSON strings are valid YAML scalars
    fm = [
        "---",
        f"brain_id: {entry['id']}",
        f"type: {entry['type']}",
        f"title: {q(entry['title'], ensure_ascii=False)}",
        f"is_active: {'true' if entry['is_active'] else 'false'}",
        f"source_url: {q(entry['source_url']) if entry.get('source_url') else 'null'}",
        f"created_at: {entry['created_at']}",
        "---",
        "",
        f"# {entry['title']}",
        "",
    ]
    return "\n".join(fm) + entry["content"].rstrip() + "\n"


def managed_id(path):
    try:
        head = path.read_text(encoding="utf-8")[:200]
    except OSError:
        return None
    m = re.search(r"^brain_id: (\S+)$", head, re.M)
    return m.group(1) if m else None


def pull():
    entries = request("GET")["entries"]
    written, used = {}, set()
    for e in entries:
        folder = BRAIN_DIR / TYPE_DIRS.get(e["type"], e["type"])
        folder.mkdir(parents=True, exist_ok=True)
        path = folder / filename_for(e)
        if path in used:  # two titles slugify the same
            path = path.with_name(f"{path.stem}-{e['id'][:8]}.md")
        used.add(path)
        text = render(e)
        if not path.exists() or path.read_text(encoding="utf-8") != text:
            path.write_text(text, encoding="utf-8", newline="\n")
            written[e["id"]] = path
        e["_path"] = path

    # Drop mirror files whose entry was deleted or renamed in the admin.
    # Only files carrying a brain_id are ours to remove.
    removed = []
    for path in BRAIN_DIR.rglob("*.md"):
        if path not in used and managed_id(path):
            path.unlink()
            removed.append(path)

    write_index(entries)
    print(f"Pulled {len(entries)} entries: {len(written)} written, {len(removed)} removed.")
    for p in written.values():
        print(f"  updated {p.relative_to(REPO)}")
    for p in removed:
        print(f"  removed {p.relative_to(REPO)}")
    return entries


def write_index(entries):
    lines = [
        "# Brain",
        "",
        "Local mirror of `brain_entries` in the prod Supabase project, written by",
        "`.claude/skills/reel-brain/scripts/brain_sync.py pull`. Do not edit these",
        "files by hand: edit in /admin/content/brain, then pull. \"On\" entries are",
        "injected into the content drafting prompt.",
        "",
    ]
    for etype, folder in TYPE_DIRS.items():
        group = [e for e in entries if e["type"] == etype]
        if not group:
            continue
        group.sort(key=lambda e: e["created_at"], reverse=True)
        lines += [f"## {folder.replace('-', ' ').title()} ({len(group)})", "",
                  "| On | Title | Added |", "|---|---|---|"]
        for e in group:
            rel = e["_path"].relative_to(BRAIN_DIR).as_posix()
            title = e["title"].replace("|", "\\|")
            lines.append(f"| {'on' if e['is_active'] else ''} | [{title}]({rel}) | {e['created_at'][:10]} |")
        lines.append("")
    (BRAIN_DIR / "INDEX.md").write_text("\n".join(lines), encoding="utf-8", newline="\n")


def push(json_path):
    body = json.loads(Path(json_path).read_text(encoding="utf-8"))
    res = request("POST", body)
    e = res["entry"]
    print(f"{'Created' if res['created'] else 'Updated'} brain entry {e['id']}: {e['title']}")
    entries = pull()
    match = next((x for x in entries if x["id"] == e["id"]), None)
    if match:
        print(f"Local copy: {match['_path']}")


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "pull":
        pull()
    elif len(sys.argv) == 3 and sys.argv[1] == "push":
        push(sys.argv[2])
    else:
        sys.exit(__doc__)
