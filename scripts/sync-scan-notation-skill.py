#!/usr/bin/env python
"""Mirror canonical scan-notation skill → Cursor copy + optional skeletons.

Source of truth: this repo's skills/scan-notation/ (when run from scan-js),
or sibling/nested scan-js when invoked from sphere-io/scripts/.

Destinations:
  - workspace .cursor/skills/scan-notation/ (c:/workspace/sphere/.cursor/…)
  - sphere-io/.cursor/skills/scan-notation/ when present
  - optional skeletons folder (SPHERE_SCAN_NOTATION_SKELETONS)

Default skeletons dest: C:\\workspace\\skeletons\\scan-notation
"""
from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve()


def _resolve_scan_js_root() -> Path | None:
    # scan-js/scripts/… → scan-js root
    if SCRIPT.parent.name == "scripts" and (SCRIPT.parents[1] / "skills" / "scan-notation").is_dir():
        return SCRIPT.parents[1]
    # sphere-io/scripts/… → sibling ../scan-js then nested scan-js/
    if SCRIPT.parent.name == "scripts":
        sphere_io = SCRIPT.parents[1]
        sibling = sphere_io.parent / "scan-js"
        nested = sphere_io / "scan-js"
        if (sibling / "skills" / "scan-notation").is_dir():
            return sibling
        if (nested / "skills" / "scan-notation").is_dir():
            return nested
    return None


def _cursor_dests(scan_js_root: Path) -> list[Path]:
    dests: list[Path] = []
    # Workspace root that holds .cursor next to sphere-io + scan-js
    workspace = scan_js_root.parent
    dests.append(workspace / ".cursor" / "skills" / "scan-notation")
    # Nested historically: scan-js under sphere-io → sphere-io/.cursor
    parent = scan_js_root.parent
    if (parent / "sphere-repos.py").is_file() or (parent / "apps" / "sphere").is_dir():
        dests.append(parent / ".cursor" / "skills" / "scan-notation")
    # Sibling layout: sphere-io/.cursor when that folder exists
    sphere_io = workspace / "sphere-io"
    if sphere_io.is_dir() and sphere_io.resolve() != parent.resolve():
        if (sphere_io / ".cursor").is_dir():
            dests.append(sphere_io / ".cursor" / "skills" / "scan-notation")

    seen: set[Path] = set()
    out: list[Path] = []
    for d in dests:
        try:
            key = d.resolve()
        except OSError:
            key = d
        if key in seen:
            continue
        seen.add(key)
        out.append(d)
    return out


DEFAULT_SKELETONS = Path(r"C:\workspace\skeletons\scan-notation")


def _copy_tree(src: Path, dest: Path) -> list[str]:
    dest.mkdir(parents=True, exist_ok=True)
    changed: list[str] = []
    for path in sorted(src.iterdir()):
        if not path.is_file():
            continue
        target = dest / path.name
        if target.is_file() and target.read_bytes() == path.read_bytes():
            continue
        shutil.copy2(path, target)
        changed.append(str(target))
    for path in sorted(dest.iterdir()):
        if path.is_file() and not (src / path.name).is_file():
            path.unlink()
            changed.append(f"removed:{path}")
    return changed


def main() -> int:
    scan_js = _resolve_scan_js_root()
    if scan_js is None:
        print(
            "sync-scan-notation-skill: skip — could not find scan-js/skills/scan-notation",
            file=sys.stderr,
        )
        return 0

    src = scan_js / "skills" / "scan-notation"
    if not src.is_dir():
        print(f"sync-scan-notation-skill: skip — missing {src}", file=sys.stderr)
        return 0

    changed: list[str] = []
    for dest in _cursor_dests(scan_js):
        changed.extend(_copy_tree(src, dest))

    skeletons = Path(
        os.environ.get("SPHERE_SCAN_NOTATION_SKELETONS", str(DEFAULT_SKELETONS))
    )
    if skeletons.parent.is_dir() or skeletons.is_dir():
        changed.extend(_copy_tree(src, skeletons))
    else:
        print(
            f"sync-scan-notation-skill: skip skeletons (parent missing): {skeletons}",
            file=sys.stderr,
        )

    if changed:
        print(f"sync-scan-notation-skill: updated (from {src})")
        for p in changed:
            print(f"  {p}")
    else:
        print(f"sync-scan-notation-skill: in sync (from {src})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
