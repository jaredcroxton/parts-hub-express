"""Build the Parts Hub Express logo masters (DESIGN_CHARACTERISTICS 10.14).

Writes SVG files next to this script:
  phx-symbol.svg, phx-symbol-white.svg      framed callout P with orange full stop, 90 unit grid
  phx-p-dot.svg                             frameless P and full stop, for 16px use
  phx-lockup.svg, phx-lockup-white.svg      symbol plus PARTS HUB EXPRESS wordmark (Antonio Bold, outlined)
  logo-paths.json                           the same geometry as path data, for inlining in the site

Run: python3 design/brand/logo/build.py
"""
import json
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

HERE = Path(__file__).resolve().parent
INK, WHITE, ORANGE = "#000000", "#FFFFFF", "#F45120"

# Symbol on a 90 unit grid: stroke 10, padding 9, P box 19..71.
FRAME = "M0 0H90V61H80V10H10V80H80V71H90V90H0Z"
P_SHAPE = "M19 19H55A16 16 0 0 1 55 51H29V71H19Z M29 29H55A6 6 0 0 1 55 41H29Z"
DOT = (61, 61, 10, 10)

# Frameless P and full stop on a 64 unit square (same proportions, centred).
P_DOT_SHAPE = "M6 6H42A16 16 0 0 1 42 38H16V58H6Z M16 16H42A6 6 0 0 1 42 28H16Z"
P_DOT_DOT = (48, 48, 10, 10)

WORD = "PARTS HUB EXPRESS"
TRACKING_EM = -0.02
CAP_RATIO = 0.45  # cap height relative to symbol height
GAP = 14  # units between symbol and wordmark


def wordmark_path(cap_height: float, x0: float, baseline: float):
    """Outline WORD in Antonio Bold. Returns (path data, advance width) in lockup units."""
    font = TTFont(HERE / "fonts" / "Antonio[wght].ttf")
    font = instantiateVariableFont(font, {"wght": 700})
    upm = font["head"].unitsPerEm
    cap = font["OS/2"].sCapHeight or upm * 0.7
    scale = cap_height / cap
    cmap = font.getBestCmap()
    glyphs = font.getGlyphSet()
    hmtx = font["hmtx"]
    pen = SVGPathPen(glyphs, ntos=lambda v: ("%.2f" % v).rstrip("0").rstrip("."))
    x = 0.0
    last_advance = 0.0
    for ch in WORD:
        name = cmap[ord(ch)]
        advance = hmtx[name][0]
        # Font units are y up; SVG is y down.
        t = TransformPen(pen, (scale, 0, 0, -scale, x0 + x * scale, baseline))
        glyphs[name].draw(t)
        last_advance = advance
        x += advance + TRACKING_EM * upm
    width = (x - TRACKING_EM * upm) * scale
    return pen.getCommands(), width, last_advance * scale


def svg(width, height, body, title):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:g} {height:g}" role="img" aria-label="{title}">'
        f"<title>{title}</title>{body}</svg>\n"
    )


def rect(r, fill):
    x, y, w, h = r
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"/>'


def main():
    title = "Parts Hub Express"
    for name, ink in (("phx-symbol.svg", INK), ("phx-symbol-white.svg", WHITE)):
        body = f'<path d="{FRAME}" fill="{ink}"/><path d="{P_SHAPE}" fill="{ink}" fill-rule="evenodd"/>{rect(DOT, ORANGE)}'
        (HERE / name).write_text(svg(90, 90, body, title))
    body = f'<path d="{P_DOT_SHAPE}" fill="{INK}" fill-rule="evenodd"/>{rect(P_DOT_DOT, ORANGE)}'
    (HERE / "phx-p-dot.svg").write_text(svg(64, 64, body, title))

    cap_h = 90 * CAP_RATIO
    baseline = 45 + cap_h / 2
    word_d, word_w, _ = wordmark_path(cap_h, 90 + GAP, baseline)
    total_w = 90 + GAP + word_w
    for name, ink in (("phx-lockup.svg", INK), ("phx-lockup-white.svg", WHITE)):
        body = (
            f'<path d="{FRAME}" fill="{ink}"/><path d="{P_SHAPE}" fill="{ink}" fill-rule="evenodd"/>{rect(DOT, ORANGE)}'
            f'<path d="{word_d}" fill="{ink}"/>'
        )
        (HERE / name).write_text(svg(round(total_w, 2), 90, body, title))

    data = json.dumps(
        {
            "symbol": {"viewBox": "0 0 90 90", "frame": FRAME, "p": P_SHAPE, "dot": DOT},
            "pDot": {"viewBox": "0 0 64 64", "p": P_DOT_SHAPE, "dot": P_DOT_DOT},
            "lockup": {"viewBox": f"0 0 {round(total_w, 2)} 90", "width": round(total_w, 2), "height": 90, "wordmark": word_d},
        },
        indent=1,
    )
    (HERE.parents[2] / "site" / "lib" / "logo-paths.json").write_text(data)
    (HERE / "logo-paths.json").write_text(
        json.dumps(
            {
                "symbol": {"viewBox": "0 0 90 90", "frame": FRAME, "p": P_SHAPE, "dot": DOT},
                "pDot": {"viewBox": "0 0 64 64", "p": P_DOT_SHAPE, "dot": P_DOT_DOT},
                "lockup": {"viewBox": f"0 0 {round(total_w, 2)} 90", "wordmark": word_d},
            },
            indent=1,
        )
    )
    print("lockup width", round(total_w, 2), "wordmark width", round(word_w, 2), "cap", cap_h)


if __name__ == "__main__":
    main()
