#!/usr/bin/env python3
"""Rebuild site/index.html with PDF overlay spans inlined."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LAYOUT_DEFAULT = ROOT / "assets" / "layout-default.json"
RAW = ROOT / "assets" / "pdf-overlays-raw.html"
OUT = ROOT / "index.html"

# PDF page numbers whose overlay blocks are inlined into index sections (see split_pages).
PAGE_IDS = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13]


def read_layout_json_compact() -> str:
    if not LAYOUT_DEFAULT.is_file():
        return "{}"
    obj = json.loads(LAYOUT_DEFAULT.read_text(encoding="utf-8"))
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def split_pages(text: str) -> dict[int, str]:
    pages: dict[int, str] = {}
    cur = None
    buf: list[str] = []
    for line in text.splitlines():
        if line.startswith("<!-- PAGE "):
            if cur is not None:
                pages[cur] = "\n".join(buf).strip()
            buf = []
            try:
                cur = int(line.split()[2])
            except (IndexError, ValueError):
                cur = None
            continue
        if cur is not None and not line.startswith("<!--"):
            buf.append(line)
    if cur is not None:
        pages[cur] = "\n".join(buf).strip()
    return pages


def main():
    pages = split_pages(RAW.read_text())
    p = {k: pages.get(k, "") for k in PAGE_IDS}

    main_html = f'''  <main>
    <!-- Page 1 -->
    <section class="slide slide--cover" id="cover" aria-label="Cover">
      <div class="pdf-page pdf-page--cover" style="--pw: 4912; --ph: 3484.063356">
        <img class="pdf-page__photo" src="assets/img/p01-hero.jpg" alt="" width="1600" height="1131" loading="eager" decoding="async" />
        <div class="pdf-layer pdf-layer--cover" aria-hidden="true">
{p[1]}
        </div>
      </div>
    </section>

    <!-- Page 2 -->
    <section class="slide slide--manifesto" id="manifesto" aria-labelledby="manifesto-heading">
      <div class="slide--manifesto__bg" aria-hidden="true"></div>
      <div class="manifesto">
        <h2 class="manifesto__title" id="manifesto-heading">Manifesto</h2>
        <div class="manifesto__text">
          <p>Microplastika is an exploration of the human in the digital environment.</p>
          <p>We live inside streams of information. Algorithms shape perception.</p>
          <p>Identity becomes fragmented. The self is no longer whole.</p>
          <p>It consists of layers, traces, and distortions.</p>
          <p>Just as microplastic pollutes the oceans, Digital noise penetrates consciousness. Microplastika is the visual trace of this process.</p>
          <p>The solvent dissolves form, just as the digital environment dissolves the boundaries of identity.</p>
          <p>This is not destruction. It is transformation.</p>
          <p>Microplastika is the generation of the contemporary human.</p>
        </div>
      </div>
    </section>

    <!-- Page 3 -->
    <section class="slide" id="golden-heart" aria-label="Golden Heart">
      <div class="pdf-page" style="--pw: 4912; --ph: 3484">
        <img class="pdf-page__photo" src="assets/img/p03-golden.jpg" alt="Golden Heart — painting" width="1600" height="1117" loading="lazy" decoding="async" />
        <div class="pdf-layer" aria-hidden="true">
{p[3]}
        </div>
      </div>
    </section>

    <!-- Page 4 -->
    <section class="slide slide--golden-grid" id="golden-grid" aria-label="Golden Heart triptych">
      <div class="slide__inner slide__inner--flush">
        <div class="golden-grid">
          <div class="golden-grid__strip">
            <figure class="golden-grid__cell"><img src="assets/img/p04-left.jpg" alt="" width="1600" height="1145" loading="lazy" decoding="async" /></figure>
            <figure class="golden-grid__cell"><img src="assets/img/p04-mid.jpg" alt="" width="1054" height="1600" loading="lazy" decoding="async" /></figure>
            <figure class="golden-grid__cell"><img src="assets/img/p04-right.jpg" alt="" width="1600" height="1021" loading="lazy" decoding="async" /></figure>
          </div>
          <div class="pdf-layer pdf-layer--grid" aria-hidden="true">
{p[4]}
          </div>
        </div>
      </div>
    </section>

    <!-- Page 5 -->
    <section class="slide" id="flowers" aria-label="Take the flowers">
      <div class="pdf-page" style="--pw: 4912; --ph: 3484">
        <img class="pdf-page__photo" src="assets/img/p05-flowers.jpg" alt="" width="1600" height="1066" loading="lazy" decoding="async" />
        <div class="pdf-layer" aria-hidden="true">
{p[5]}
        </div>
      </div>
    </section>

    <!-- Page 6 -->
    <section class="slide slide--jealousy-pdf" id="jealousy" aria-label="Jealousy">
      <div class="pdf-page pdf-page--jealousy" style="--pw: 4912; --ph: 3484">
        <div class="pdf-page__jealousy-arts">
          <img class="pdf-page__art pdf-page__art--bg" src="assets/img/p06-bg.jpg" alt="Jealousy — main work" width="1600" height="1131" loading="lazy" decoding="async" />
          <img class="pdf-page__art pdf-page__art--inset" src="assets/img/p06-inset.jpg" alt="Jealousy — detail" width="800" height="688" loading="lazy" decoding="async" />
        </div>
        <div class="pdf-layer" aria-hidden="true">
{p[6]}
        </div>
      </div>
    </section>

    <!-- Page 7 -->
    <section class="slide" id="new-rock" aria-label="In the New Rock">
      <div class="pdf-page" style="--pw: 4912; --ph: 3484">
        <div class="pdf-page__split">
          <img class="pdf-page__photo pdf-page__photo--half" src="assets/img/p07-left.jpg" alt="" width="1600" height="1279" loading="lazy" decoding="async" />
          <img class="pdf-page__photo pdf-page__photo--half" src="assets/img/p07-right.jpg" alt="" width="1600" height="1200" loading="lazy" decoding="async" />
        </div>
        <div class="pdf-layer" aria-hidden="true">
{p[7]}
        </div>
      </div>
    </section>

    <!-- Page 8 -->
    <section class="slide" id="modern" aria-label="Modern Microplastika">
      <div class="pdf-page" style="--pw: 4912; --ph: 3484">
        <div class="pdf-page__split">
          <img class="pdf-page__photo pdf-page__photo--half" src="assets/img/p08-left.jpg" alt="" width="1600" height="1199" loading="lazy" decoding="async" />
          <img class="pdf-page__photo pdf-page__photo--half" src="assets/img/p08-right.jpg" alt="" width="1600" height="1259" loading="lazy" decoding="async" />
        </div>
        <div class="pdf-layer pdf-layer--modern" aria-hidden="true">
{p[8]}
        </div>
      </div>
    </section>

    <!-- Page 9 -->
    <section class="slide" id="micro-i" aria-label="Microplastika I">
      <div class="pdf-page" style="--pw: 4912; --ph: 3484">
        <img class="pdf-page__photo" src="assets/img/p09-micro1.jpg" alt="" width="1600" height="1066" loading="lazy" decoding="async" />
        <div class="pdf-layer" aria-hidden="true">
{p[9]}
        </div>
      </div>
    </section>

    <!-- Page 10 -->
    <section class="slide" id="cobalt" aria-label="Cobalt chrome">
      <div class="pdf-page" style="--pw: 4912; --ph: 3484">
        <div class="pdf-page__triple">
          <img src="assets/img/p10-a.jpg" alt="" width="1067" height="1600" loading="lazy" decoding="async" />
          <img src="assets/img/p10-b.jpg" alt="" width="1066" height="1600" loading="lazy" decoding="async" />
          <img src="assets/img/p10-c.jpg" alt="" width="1066" height="1600" loading="lazy" decoding="async" />
        </div>
        <div class="pdf-layer" aria-hidden="true">
{p[10]}
        </div>
      </div>
    </section>

    <!-- Page 11 -->
    <section class="slide" id="sheep" aria-label="Lost sheep">
      <div class="pdf-page" style="--pw: 4912; --ph: 3484">
        <img class="pdf-page__photo" src="assets/img/p11-sheep.jpg" alt="" width="1600" height="1255" loading="lazy" decoding="async" />
        <div class="pdf-layer" aria-hidden="true">
{p[11]}
        </div>
      </div>
    </section>

    <!-- Page 12 -->
    <section class="slide" id="series" aria-label="Series">
      <div class="pdf-page" style="--pw: 4912; --ph: 3484">
        <div class="pdf-page__triple">
          <img src="assets/img/p12-a.jpg" alt="" width="1600" height="1199" loading="lazy" decoding="async" />
          <img src="assets/img/p12-b.jpg" alt="" width="1200" height="1600" loading="lazy" decoding="async" />
          <img src="assets/img/p12-c.jpg" alt="" width="1200" height="1600" loading="lazy" decoding="async" />
        </div>
      </div>
    </section>

    <!-- Page 13 -->
    <section class="slide slide--closing" id="closing" aria-label="Closing">
      <div class="pdf-page" style="--pw: 4912; --ph: 3484">
        <div class="pdf-page__split">
          <img class="pdf-page__photo pdf-page__photo--half" src="assets/img/p13-a.jpg" alt="" width="1066" height="1600" loading="lazy" decoding="async" />
          <img class="pdf-page__photo pdf-page__photo--half" src="assets/img/p13-b.jpg" alt="" width="1066" height="1600" loading="lazy" decoding="async" />
        </div>
        <div class="pdf-layer pdf-layer--closing" aria-hidden="true">
{p[13]}
        </div>
      </div>
    </section>
  </main>
'''

    head = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MICROPLASTIKA — Lave Mason</title>
  <meta name="description" content="Microplastika: an exploration of the human in the digital environment. Works by Lave Mason." />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="assets/fonts.css" />
  <link rel="stylesheet" href="assets/styles.css" />
</head>
<body>
  <header class="nav">
    <a class="nav__brand" href="#cover">MICROPLASTIKA</a>
    <nav class="nav__links" aria-label="Sections">
      <a href="#cover">Cover</a>
      <a href="#manifesto">Manifesto</a>
      <a href="#golden-heart">Golden Heart</a>
      <a href="#jealousy">Jealousy</a>
      <a href="#closing">2026</a>
    </nav>
  </header>

'''

    layout_json = read_layout_json_compact()

    foot = f'''  <footer class="site-footer">
    <p class="site-footer__sig">Lave Mason</p>
    <p>Microplastika</p>
  </footer>
  <script src="assets/layout-core.js"></script>
  <script>window.__MICROPLASTIKA_LAYOUT__ = {layout_json};</script>
  <script src="assets/layout-apply.js" defer></script>
  <!-- Layout editor: load layout-core.js, then uncomment layout-editor.js; optional: comment out layout-apply if editor alone. -->
  <!-- <script src="assets/layout-editor.js" defer></script> -->
</body>
</html>
'''

    OUT.write_text(head + main_html + foot, encoding="utf-8")
    print("Wrote", OUT)


if __name__ == "__main__":
    main()
