#!/usr/bin/env python3
"""Scansiona la cartella notes/ e genera manifest.json come albero"""
import json, re, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NOTES = ROOT / "notes"

def natural(s):
    # "!" (ASCII 33) precede cifre e lettere: le cartelle "!..." finiscono per prime
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]

def pretty(s):
    s = re.sub(r"\.md$", "", s, flags=re.I)
    s = re.sub(r"^!+", "", s)               # "!xyz" -> "xyz" (per fare il pin in alto al menu)
    s = re.sub(r"^\d+[-_. ]+", "", s)      # "01_abc" -> "abc" (ordinamento delle note)
    return s.replace("-", " ").replace("_", " ")

def title_of(p):
    text = p.read_text(encoding="utf-8-sig", errors="ignore")
    text = re.sub(r"\A---\r?\n.*?\r?\n---\r?\n", "", text, flags=re.S)
    m = re.search(r"^\s*#\s+(.+?)\s*$", text, flags=re.M)
    return m.group(1) if m else pretty(p.name)

def build_dir(d):
    children = []
    for e in sorted(d.iterdir(), key=lambda x: natural(x.name)):
        if e.name.startswith((".", "_")):
            continue
        rel = e.relative_to(ROOT).as_posix()
        if e.is_dir():
            node = build_dir(e)
            if node["children"]:
                children.append(node)
        elif e.suffix.lower() == ".md":
            children.append({"type": "file", "title": title_of(e), "path": rel})
    return {"type": "dir", "name": d.name, "path": d.relative_to(ROOT).as_posix(), "children": children}

root = build_dir(NOTES)
# I file messi direttamente in notes/ finiscono in una sezione "Generale"
loose = [c for c in root["children"] if c["type"] == "file"]
if loose:
    root["children"] = [c for c in root["children"] if c["type"] == "dir"] + \
        [{"type": "dir", "name": "Generale", "path": None, "children": loose}]
root["name"] = "Halmos"

def count(n):
    return 1 if n["type"] == "file" else sum(count(c) for c in n["children"])

out = {"updated": datetime.date.today().strftime("%d/%m/%Y"), "root": root}
(ROOT / "manifest.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"{count(root)} Halmos")
