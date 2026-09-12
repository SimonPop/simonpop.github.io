"""Static diagrams for the graph-structure-learning article.

Run with: uv run generate_gsl.py
Outputs standalone SVGs into public/imgs/graph-structure-learning/, matching
the site's design tokens (see style.py). Text stays as real <text> elements
(svg.fonttype = 'none') so the site's own webfonts render it, not matplotlib's.
"""

from pathlib import Path

import matplotlib.pyplot as plt
import networkx as nx
from matplotlib.patches import FancyBboxPatch, Rectangle

from style import (
    BG, BORDER, FONT_DISPLAY, FONT_MONO, FONT_SANS, GENOMICS, LANGUAGE,
    MUTED, TEXT, THEME, XAI, edge_line, label, lerp_color, new_axes, node, save,
)

OUT = Path(__file__).resolve().parent.parent.parent / "public" / "imgs" / "graph-structure-learning"


def box(ax, xy, w, h, edge, fill="none", lw=2, rounding=8):
    b = FancyBboxPatch(
        xy, w, h, boxstyle=f"round,pad=0,rounding_size={rounding}",
        facecolor=fill, edgecolor=edge, linewidth=lw, zorder=2,
    )
    ax.add_patch(b)
    return b


# ---------------------------------------------------------------- paradigms_blocs
def paradigms_blocs():
    W, H = 620, 320
    fig = plt.figure(figsize=(W / 100, H / 100), dpi=100)
    ax = new_axes(fig, W, H)

    def module(x0, title, title_color, edge_color, edge_dashed, edge_both):
        frame = box(ax, (x0, 20), 270, 280, edge_color, lw=2)
        ax.text(x0 + 135, 268, title, fontsize=13, color=title_color, fontfamily=FONT_DISPLAY,
                 fontweight="bold", ha="center", va="center", multialignment="center", zorder=4)
        pts = {
            "a": (x0 + 60, 190), "b": (x0 + 210, 190),
            "c": (x0 + 60, 90), "d": (x0 + 210, 90),
        }
        patches = {k: node(ax, v, r=15, edge=TEXT) for k, v in pts.items()}
        for u, v in [("a", "b"), ("a", "c"), ("b", "d"), ("c", "d")]:
            edge_line(ax, patches[u], pts[u], patches[v], pts[v],
                       color=edge_color, lw=2, dashed=edge_dashed, arrow=edge_both,
                       both=edge_both, mutation_scale=12)
        return frame

    module(20, "Graph Structure\nLearning Module", THEME, THEME, edge_dashed=True, edge_both=False)
    module(330, "Message Passing\nModule", MUTED, MUTED, edge_dashed=False, edge_both=True)

    save(fig, OUT / "paradigms_blocs.svg")


# ---------------------------------------------------------------------- paradigms
def paradigms():
    W, H = 640, 430
    fig = plt.figure(figsize=(W / 100, H / 100), dpi=100)
    ax = new_axes(fig, W, H)

    box(ax, (10, 10), 620, 410, BORDER, lw=2, rounding=10)
    ax.plot([10, 630], [290, 290], color=BORDER, linewidth=2, zorder=1)
    ax.plot([10, 630], [150, 150], color=BORDER, linewidth=2, zorder=1)

    CHIP_X0, CHIP_W, CHIP_H = 20, 90, 26
    # usable horizontal band for each row's actual diagram, after the row-label chip
    CONTENT_X0, CONTENT_X1 = 130, 620

    def chip(y, text):
        # centered on the row's y so its right edge lines up with the arrow leaving it,
        # instead of sitting above the row (which made the arrow clip its bottom corner)
        b = box(ax, (CHIP_X0, y - CHIP_H / 2), CHIP_W, CHIP_H, BORDER, fill="#f5f6fa", lw=1, rounding=5)
        label(ax, (CHIP_X0 + CHIP_W / 2, y), text, size=12, color=MUTED, font=FONT_SANS, weight="normal")
        return b

    def gsl_pred_pair(cy, x0, w=90, h=56, gap=20, fs=14):
        g = box(ax, (x0, cy - h / 2), w, h, THEME, fill=lerp_color(BG, THEME, 0.12), lw=2, rounding=6)
        label(ax, (x0 + w / 2, cy), "GSL", size=fs, color=THEME)
        px0 = x0 + w + gap
        p = box(ax, (px0, cy - h / 2), w, h, MUTED, fill=lerp_color(BG, TEXT, 0.06), lw=2, rounding=6)
        label(ax, (px0 + w / 2, cy), "Pred", size=fs, color=TEXT)
        return g, (x0 + w / 2, cy), p, (px0 + w / 2, cy)

    # Joint & Iterative: a single GSL-Pred pair, centered in the content band
    pair_w = 90 * 2 + 20
    pair_x0 = CONTENT_X0 + (CONTENT_X1 - CONTENT_X0 - pair_w) / 2

    chip(360, "Joint")
    g, gC, p, pC = gsl_pred_pair(360, pair_x0)
    edge_line(ax, g, gC, p, pC, color=MUTED, lw=2, mutation_scale=12)

    # Adaptive: 6 alternating blocks in a fixed sequence, also centered in the content band
    n_boxes, box_w, box_gap = 6, 60, 10
    adaptive_w = n_boxes * box_w + (n_boxes - 1) * box_gap
    adaptive_x0 = CONTENT_X0 + (CONTENT_X1 - CONTENT_X0 - adaptive_w) / 2
    xs = [adaptive_x0 + i * (box_w + box_gap) for i in range(n_boxes)]
    labels = ["GSL", "Pred", "GSL", "Pred", "GSL", "Pred"]
    cy_adaptive = 220
    boxes, centers = [], []
    for x, lab in zip(xs, labels):
        is_gsl = lab == "GSL"
        edge_c = THEME if is_gsl else MUTED
        fill_c = lerp_color(BG, THEME, 0.12) if is_gsl else lerp_color(BG, TEXT, 0.06)
        text_c = THEME if is_gsl else TEXT
        b = box(ax, (x, cy_adaptive - 28), box_w, 56, edge_c, fill=fill_c, lw=2, rounding=5)
        label(ax, (x + box_w / 2, cy_adaptive), lab, size=12, color=text_c)
        boxes.append(b)
        centers.append((x + box_w / 2, cy_adaptive))

    chip(cy_adaptive, "Adaptive")
    prev_patch, prev_c = boxes[0], centers[0]
    for b, c in zip(boxes[1:], centers[1:]):
        edge_line(ax, prev_patch, prev_c, b, c, color=MUTED, lw=2, mutation_scale=11)
        prev_patch, prev_c = b, c

    # Iterative: single pair with a feedback loop until a stopping condition
    chip(75, "Iterative")
    g2, g2C, p2, p2C = gsl_pred_pair(75, pair_x0)
    edge_line(ax, g2, g2C, p2, p2C, color=MUTED, lw=2, mutation_scale=12)
    edge_line(ax, p2, p2C, g2, g2C, color=MUTED, lw=2, rad=-0.55, mutation_scale=12)
    label(ax, ((g2C[0] + p2C[0]) / 2, 75 - 28 - 22), "until condition satisfied",
          size=11, color=MUTED, font=FONT_SANS, weight="normal")

    save(fig, OUT / "paradigms.svg")


# --------------------------------------------------------------------- smoothness
def smoothness():
    W, H = 430, 260
    fig = plt.figure(figsize=(W / 100, H / 100), dpi=100)
    ax = new_axes(fig, W, H)

    n = 6
    xs = [40 + i * 62 for i in range(n)]
    ys = [150, 100, 150, 100, 150, 100]
    values = [0.05, 0.22, 0.4, 0.6, 0.8, 0.98]
    pts = list(zip(xs, ys))
    patches = [node(ax, p, r=16, fill=lerp_color(BG, THEME, v), edge=TEXT, lw=1.5) for p, v in zip(pts, values)]
    for i in range(n - 1):
        edge_line(ax, patches[i], pts[i], patches[i + 1], pts[i + 1], color=MUTED, lw=2, arrow=False, mutation_scale=1)

    # legend gradient bar
    bx0, by0, bw, bh = 40, 40, 350, 14
    steps = 60
    for i in range(steps):
        t0, t1 = i / steps, (i + 1) / steps
        ax.add_patch(Rectangle((bx0 + t0 * bw, by0), bw / steps + 0.5, bh,
                                facecolor=lerp_color(BG, THEME, (t0 + t1) / 2), edgecolor="none", zorder=1))
    box(ax, (bx0, by0), bw, bh, BORDER, fill="none", lw=1, rounding=2)
    label(ax, (bx0, by0 - 14), "low signal", size=11, color=MUTED, font=FONT_SANS, weight="normal", ha="left")
    label(ax, (bx0 + bw, by0 - 14), "high signal", size=11, color=MUTED, font=FONT_SANS, weight="normal", ha="right")

    save(fig, OUT / "smoothness.svg")


# ----------------------------------------------------------------------- sparsity
def sparsity():
    W, H = 600, 230
    fig = plt.figure(figsize=(W / 100, H / 100), dpi=100)
    ax = new_axes(fig, W, H)

    pts = {
        "a": (60, 160), "b": (150, 190), "c": (150, 100), "d": (60, 60), "e": (30, 120),
    }
    kept = [("a", "b"), ("a", "e"), ("b", "c"), ("c", "d")]
    removed = [("a", "c"), ("b", "d"), ("d", "e")]
    patches = {k: node(ax, v, r=13, edge=TEXT) for k, v in pts.items()}
    for u, v in removed:
        edge_line(ax, patches[u], pts[u], patches[v], pts[v], color=MUTED, lw=1.5, dashed=True, arrow=False, mutation_scale=1)
    for u, v in kept:
        edge_line(ax, patches[u], pts[u], patches[v], pts[v], color=THEME, lw=2, arrow=False, mutation_scale=1)

    arrow_anchor = node(ax, (270, 125), r=1, fill="none", edge="none")
    target_anchor = node(ax, (350, 125), r=1, fill="none", edge="none")
    edge_line(ax, arrow_anchor, (270, 130), target_anchor, (345, 130), color=MUTED, lw=2, mutation_scale=14)
    label(ax, (307, 108), "sparsity", size=11, color=MUTED, font=FONT_SANS, weight="normal")

    pts2 = {k: (x + 380, y) for k, (x, y) in pts.items()}
    patches2 = {k: node(ax, v, r=13, edge=TEXT) for k, v in pts2.items()}
    for u, v in kept:
        edge_line(ax, patches2[u], pts2[u], patches2[v], pts2[v], color=THEME, lw=2, arrow=False, mutation_scale=1)

    save(fig, OUT / "sparsity.svg")


# ------------------------------------------------------------------------ directed
def directed():
    W, H = 560, 220
    fig = plt.figure(figsize=(W / 100, H / 100), dpi=100)
    ax = new_axes(fig, W, H)

    ax.plot([280, 280], [15, 205], color=BORDER, linewidth=2, zorder=1)

    def panel(x0, title, arrows):
        label(ax, (x0 + 120, 200), title, size=15, color=TEXT)
        pts = {
            "a": (x0 + 30, 90), "b": (x0 + 110, 40), "c": (x0 + 170, 110), "d": (x0 + 110, 160),
        }
        patches = {k: node(ax, v, r=13, edge=TEXT) for k, v in pts.items()}
        for u, v, both in arrows:
            edge_line(ax, patches[u], pts[u], patches[v], pts[v], color=THEME if arrows_directed else MUTED,
                       lw=2, arrow=arrows_directed, both=both, mutation_scale=13, rad=0.12)

    arrows_directed = False
    panel(0, "Undirected", [("a", "b", False), ("b", "d", False), ("b", "c", False), ("d", "c", False)])
    arrows_directed = True
    panel(300, "Directed", [("a", "b", False), ("b", "d", True), ("b", "c", False), ("d", "c", False), ("c", "a", False)])

    save(fig, OUT / "directed.svg")


# NOTE: the "similarity" figure was replaced by an interactive D3 visualization
# (public/js/similarity_viz.js), so there's no static-SVG generator for it here.


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    paradigms_blocs()
    paradigms()
    smoothness()
    sparsity()
    directed()
