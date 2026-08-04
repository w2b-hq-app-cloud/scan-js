# SPDX-License-Identifier: Apache-2.0
"""Restore relative media/ paths in the packaged VSIX README (vsce rewrites to GitHub)."""
from __future__ import annotations

import re
import sys
import zipfile
from pathlib import Path

pkg = Path(__file__).resolve().parent
vsixes = sorted(pkg.glob("*.vsix"), key=lambda p: p.stat().st_mtime, reverse=True)
if not vsixes:
    print("No .vsix found", file=sys.stderr)
    sys.exit(1)
vsix = vsixes[0]

pat_md = re.compile(
    r"https://(?:raw\.githubusercontent\.com|github\.com)/[^\s)\"']+/media/(screenshot\.png|icon(?:-256)?\.png)"
)
pat_src = re.compile(
    r'src="https://(?:raw\.githubusercontent\.com|github\.com)/[^"]+/media/(screenshot\.png|icon(?:-256)?\.png)"'
)

tmp = vsix.with_suffix(".vsix.tmp")
changed = False
with zipfile.ZipFile(vsix, "r") as zin, zipfile.ZipFile(tmp, "w", compression=zipfile.ZIP_DEFLATED) as zout:
    for info in zin.infolist():
        data = zin.read(info.filename)
        if re.search(r"(^|/)readme\.md$", info.filename, re.I):
            text = data.decode("utf-8")
            fixed = pat_md.sub(r"media/\1", text)
            fixed = pat_src.sub(r'src="media/\1"', fixed)
            if fixed != text:
                changed = True
                data = fixed.encode("utf-8")
                print(f"Fixed {info.filename}")
        zout.writestr(info, data)

if changed:
    tmp.replace(vsix)
    print("Updated", vsix.name)
else:
    tmp.unlink(missing_ok=True)
    print("No README URL rewrite needed in", vsix.name)
