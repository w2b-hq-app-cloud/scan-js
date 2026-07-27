#!/usr/bin/env python
"""Mirror canonical scan-notation skill → Cursor copy + optional skeletons.

Source of truth: scan-js/skills/scan-notation/
Destinations:
  - sphere-io/.cursor/skills/scan-notation/ (when nested under sphere-io)
  - optional skeletons folder (SPHERE_SCAN_NOTATION_SKELETONS)

Default skeletons dest: C:\\workspace\\skeletons\\scan-notation
"""
from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

# This script lives in scan-js/scripts/ when run from the nested repo,
# or may be invoked as sphere-io/scripts/sync-scan-notation-skill.py.
SCRIPT = Path(__file__).resolve()
if SCRIPT.parent.name == "scripts" and (SCRIPT.parents[1] / "skills" / "scan-notation").is_dir():
    SCAN_JS_ROOT = SCRIPT.parents[1]
elif SCRIPT.parent.name == "scripts" and (SCRIPT.parents[1] / "scan-js" / "skills" / "scan-notation").is_dir():
    SCAN_JS_ROOT = SCRIPT.parents[1] / "scan-js"
else:
    SCAN_JS_ROOT = SCRIPT.parents[1]

SRC = SCAN_JS_ROOT / "skills" / "scan-notation"
# Parent of scan-js is sphere-io when nested
SPHERE_IO = SCAN_JS_ROOT.parent if (SCAN_JS_ROOT.parent / ".cursor").is_dir() else None
CURSOR_DEST = (
    (SPHERE_IO / ".cursor" / "skills" / "scan-notation")
    if SPHERE_IO is not None
    else None
)
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
    # Remove dest files that no longer exist in src
    for path in sorted(dest.iterdir()):
        if path.is_file() and not (src / path.name).is_file():
            path.unlink()
            changed.append(f"removed:{path}")
    return changed


def main() -> int:
    if not SRC.is_dir():
        print(f"sync-scan-notation-skill: missing source {SRC}", file=sys.stderr)
        return 0

    changed: list[str] = []
    if CURSOR_DEST is not None:
        changed.extend(_copy_tree(SRC, CURSOR_DEST))
    else:
        print(
            "sync-scan-notation-skill: skip Cursor mirror (no sibling .cursor)",
            file=sys.stderr,
        )

    skeletons = Path(
        os.environ.get("SPHERE_SCAN_NOTATION_SKELETONS", str(DEFAULT_SKELETONS))
    )
    if skeletons.parent.is_dir() or skeletons.is_dir():
        changed.extend(_copy_tree(SRC, skeletons))
    else:
        print(
            f"sync-scan-notation-skill: skip skeletons (parent missing): {skeletons}",
            file=sys.stderr,
        )

    if changed:
        print("sync-scan-notation-skill: updated")
        for p in changed:
            print(f"  {p}")
    else:
        print("sync-scan-notation-skill: in sync")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
