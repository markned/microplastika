#!/usr/bin/env python3
"""Emit HTML spans for PDF word bounding boxes (pdftotext -bbox)."""
import argparse
import html as html_lib
import re
import subprocess
import sys

PDF = "/Users/markned/microplastika/presentation microplastika_Сжать.pdf"


def words_page(pdf: str, n: int):
    out = subprocess.check_output(
        ["pdftotext", "-bbox", "-f", str(n), "-l", str(n), pdf, "-"],
        text=True,
        stderr=subprocess.DEVNULL,
    )
    m = re.search(r'width="([0-9.]+)"\s+height="([0-9.]+)"', out)
    if not m:
        return None, []
    pw, ph = float(m.group(1)), float(m.group(2))
    words = []
    for wm in re.finditer(
        r'<word xMin="([0-9.]+)" yMin="([0-9.]+)" xMax="([0-9.]+)" yMax="([0-9.]+)">([^<]*)</word>',
        out,
    ):
        x1, y1, x2, y2 = map(float, wm.groups()[:4])
        t = wm.group(5)
        words.append((x1, y1, x2, y2, t))
    return (pw, ph), words


def emit(words, pw: float, ph: float, scale_fs: float = 1.0) -> str:
    lines = []
    for x1, y1, x2, y2, t in words:
        w, h = x2 - x1, y2 - y1
        fs = (h / ph) * 100 * scale_fs
        esc = html_lib.escape(t)
        # Stacked GOLDEN / HEART at bottom of slide 4 only (see PDF layout)
        vert = t in ("GOLDEN", "HEART") and 2500 < x1 < 2700 and y1 > 2000
        vert_cls = " pdf-word--vertical" if vert else ""
        lines.append(
            f'<span class="pdf-word{vert_cls}" style="--x:{x1:.3f};--y:{y1:.3f};--w:{w:.3f};--h:{h:.3f};--fs:{fs:.5f}">{esc}</span>'
        )
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pages", nargs="+", type=int)
    ap.add_argument("--scale", type=float, default=1.0)
    args = ap.parse_args()
    for p in args.pages:
        dim, words = words_page(PDF, p)
        if not dim:
            print(f"<!-- page {p}: empty -->", file=sys.stderr)
            continue
        pw, ph = dim
        print(f"<!-- PAGE {p} pw={pw} ph={ph} words={len(words)} -->")
        print(emit(words, pw, ph, args.scale))


if __name__ == "__main__":
    main()
