"""The owner's logos (assets/logos/*.ai, outside git) as web-ready PNGs in public/logos/ (#29, decisions 59 and 60).

Each .ai file embeds a PDF, so PyMuPDF renders it as it is: colours, proportions and gradients unchanged, on a
transparent ground. Only whole parts of the artwork are left out (the words beside a symbol, Ignite's "Algiers" and
its ®), never recoloured or reshaped, and the result is trimmed to the artwork. The originals are opened read-only
and never saved.

    python scripts/logos.py [path/to/assets/logos]
"""

import io
import sys
from pathlib import Path

import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'assets' / 'logos'
OUT = ROOT / 'public' / 'logos'
LONG = 512  # px on the long side: crisp beside a name at 3x, and plenty for sampling into points

# name: (file, artboard, keep only this rect in page units or None, drop: [(rect, what)] where what is 'text' or 'art')
# 'art' drops only the vector shapes the rect fully covers, so a symbol that reaches into the rect stays whole.
LOGOS = {
    # the symbol alone (decision 59)
    'spark': ('act-deps/SPARK.ai', 0, (0, 0, 1000, 790), []),
    'training': ('act-deps/Training.ai', 0, None, []),
    'english-bubble': ('act-deps/EnglishBubble.ai', 0, (0, 0, 1000, 700), []),
    'aec': ('events/AEC.ai', 1, None, [((478, 385, 970, 595), 'art')]),
    # the beside-name symbols (decision 60)
    'cpsp': ('projects/CPSP.ai', 0, None, []),
    'vic-charity': ('projects/vic-charity.ai', 0, (0, 0, 1080, 680), []),
    'masterclass': ('projects/masterclass.ai', 1, (0, 0, 1080, 700), []),
    'vicra': ('projects/vicra.ai', 3, None, []),
    'vic-entertainment': ('act-deps/VICEnt.ai', 1, None, []),
    # the name artwork (decision 59)
    'gala': ('events/gala.ai', 0, None, []),
    'ignite': ('events/ignite.ai', 0, None, [((350, 318, 515, 395), 'text'), ((480, 220, 512, 252), 'art')]),
    'polymaze': ('events/polymaze.ai', 2, None, []),
}


def render(page, clip, zoom):
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=clip, alpha=True)
    return Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGBA')


def export(name, file, artboard, keep, drop):
    doc = pymupdf.open(SRC / file)  # in memory: the redactions below never reach the file
    page = doc[artboard]
    for rect, what in drop:
        page.add_redact_annot(pymupdf.Rect(rect), fill=False, cross_out=False)
    if drop:
        page.apply_redactions(
            images=pymupdf.PDF_REDACT_IMAGE_NONE,
            graphics=pymupdf.PDF_REDACT_LINE_ART_REMOVE_IF_COVERED if any(w == 'art' for _, w in drop) else pymupdf.PDF_REDACT_LINE_ART_NONE,
            text=pymupdf.PDF_REDACT_TEXT_REMOVE if any(w == 'text' for _, w in drop) else pymupdf.PDF_REDACT_TEXT_NONE,
        )
    area = pymupdf.Rect(keep) if keep else page.rect
    # find the artwork's own box at a coarse scale, then render just that box at the final size
    z0 = 1000 / max(area.width, area.height)
    box = render(page, area, z0).getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    if not box:
        raise SystemExit(f'{name}: nothing drawn')
    pad = 2
    art = pymupdf.Rect(area.x0 + (box[0] - pad) / z0, area.y0 + (box[1] - pad) / z0, area.x0 + (box[2] + pad) / z0, area.y0 + (box[3] + pad) / z0) & area
    im = render(page, art, LONG / max(art.width, art.height))
    im.save(OUT / f'{name}.png', optimize=True)
    print(f'{name}.png {im.width}x{im.height} {(OUT / f"{name}.png").stat().st_size // 1024} KB')


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for name, spec in LOGOS.items():
        export(name, *spec)
