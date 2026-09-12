"""Static diagrams for the metro-gsl article.

Run with: uv run generate_metro.py
Outputs standalone SVGs into public/imgs/metro-gsl/, matching the site's
design tokens (see style.py). Text stays as real <text> elements
(svg.fonttype = 'none') so the site's own webfonts render it, not matplotlib's.

Only the purely illustrative diagrams are covered here (network layout,
Markov chain, autoregressive prediction). The experiment result plots
(loss curves, precision/recall, learned-graph snapshots) come from real
training runs whose underlying data is not available, so they are kept
as the original PNGs.
"""

from pathlib import Path

import matplotlib.pyplot as plt

from style import (
    BG, BORDER, FONT_DISPLAY, FONT_MONO, FONT_SANS, MUTED, TEXT, THEME,
    edge_line, label, lerp_color, new_axes, node, save,
)

OUT = Path(__file__).resolve().parent.parent.parent / "public" / "imgs" / "metro-gsl"


# --------------------------------------------------------------------- metro_lines
def metro_lines():
    W, H = 640, 260
    fig = plt.figure(figsize=(W / 100, H / 100), dpi=100)
    ax = new_axes(fig, W, H)

    # Line 1: a straight trunk line.
    line1 = [(30, 90), (110, 90), (190, 90), (270, 90), (350, 90), (430, 90), (510, 90), (590, 90)]
    # Line 2: crosses line 1 at the intersection station.
    line2 = [(270, 30), (270, 90), (270, 170), (350, 220), (430, 220)]

    for a, b_ in zip(line1[:-1], line1[1:]):
        ax.plot([a[0], b_[0]], [a[1], b_[1]], color=THEME, linewidth=3, zorder=1, solid_capstyle="round")
    for a, b_ in zip(line2[:-1], line2[1:]):
        ax.plot([a[0], b_[0]], [a[1], b_[1]], color=MUTED, linewidth=3, zorder=1, solid_capstyle="round")

    intersection = (270, 90)
    for pt in line1:
        if pt == intersection:
            continue
        node(ax, pt, r=10, fill=BG, edge=THEME, lw=2)
    for pt in line2:
        if pt == intersection:
            continue
        node(ax, pt, r=10, fill=BG, edge=MUTED, lw=2)

    # Intersection station: drawn last, larger, with a double ring to mark the
    # extra node the model instantiates there.
    node(ax, intersection, r=15, fill=lerp_color(BG, THEME, 0.12), edge=TEXT, lw=2)
    node(ax, intersection, r=9, fill="none", edge=TEXT, lw=1.5)

    label(ax, (30, 115), "Line 1", size=12, color=THEME, font=FONT_SANS, weight="bold", ha="left")
    label(ax, (430, 245), "Line 2", size=12, color=MUTED, font=FONT_SANS, weight="bold", ha="left")
    label(ax, (270, 60), "intersection", size=11, color=TEXT, font=FONT_SANS, weight="normal", ha="center")

    save(fig, OUT / "metro-lines.svg")


# ------------------------------------------------------------------ markov_process
def markov_process():
    """Hub topology (center <-> left/right/bottom, plus self-loops).

    Layout and label placement are both computed from a single formula rather
    than hand-tuned per edge, so the diagram stays symmetric regardless of
    which state is "current": the three outer states sit at exact 120-degree
    increments around the hub, every center<->outer edge shares the same
    curvature, and every label is placed by offsetting perpendicular to its
    own edge (or radially outward for self-loops).
    """
    import math

    W, H = 520, 460
    fig = plt.figure(figsize=(W / 100, H / 100), dpi=100)
    ax = new_axes(fig, W, H)

    cx, cy, R, r = 260, 288, 150, 34
    outer_angles = {"left": 150, "right": 30, "bottom": 270}
    pts = {"center": (cx, cy)}
    for k, deg in outer_angles.items():
        a = math.radians(deg)
        pts[k] = (cx + R * math.cos(a), cy + R * math.sin(a))

    current = "center"
    patches = {}
    for k, xy in pts.items():
        is_current = k == current
        patches[k] = node(
            ax, xy, r=r,
            fill=lerp_color(BG, THEME, 0.12) if is_current else BG,
            edge=THEME if is_current else MUTED, lw=2.5 if is_current else 2,
        )

    def transition(u, v, prob, rad=0.22):
        edge_line(ax, patches[u], pts[u], patches[v], pts[v], color=MUTED, lw=2, rad=rad, mutation_scale=13)
        ux, uy = pts[u]
        vx, vy = pts[v]
        length = math.hypot(vx - ux, vy - uy)
        nx, ny = -(vy - uy) / length, (vx - ux) / length  # unit normal, left of u->v
        offset = rad * length * 0.5 + 18
        label(ax, ((ux + vx) / 2 + nx * offset, (uy + vy) / 2 + ny * offset),
              prob, size=11, color=MUTED, font=FONT_MONO, weight="normal")

    def self_loop(k, prob, angle_deg, rad=1.5, spread_deg=22, label_gap=46):
        nx_, ny_ = pts[k]
        theta = math.radians(angle_deg)
        spread = math.radians(spread_deg)
        p1 = (nx_ + r * math.cos(theta - spread), ny_ + r * math.sin(theta - spread))
        p2 = (nx_ + r * math.cos(theta + spread), ny_ + r * math.sin(theta + spread))
        edge_line(ax, patches[k], p1, patches[k], p2, color=MUTED, lw=1.8, rad=rad, mutation_scale=11)
        lx, ly = nx_ + (r + label_gap) * math.cos(theta), ny_ + (r + label_gap) * math.sin(theta)
        label(ax, (lx, ly), prob, size=11, color=MUTED, font=FONT_MONO, weight="normal")

    transition("center", "left", "0.3")
    transition("left", "center", "0.2")
    transition("center", "right", "0.4")
    transition("right", "center", "0.3")
    transition("center", "bottom", "0.5")
    transition("bottom", "center", "0.9")

    self_loop("center", "0.1", angle_deg=90)
    self_loop("left", "0.8", angle_deg=outer_angles["left"])
    self_loop("right", "0.7", angle_deg=outer_angles["right"])
    self_loop("bottom", "0.1", angle_deg=outer_angles["bottom"])

    save(fig, OUT / "markov-process.svg")


# --------------------------------------------------------------- markov_prediction
def markov_prediction():
    """A single time series with one step (t -> t+1) highlighted.

    Standard textbook layout: one x-axis, one muted line, two highlighted
    points connected by a curved "predict" arrow that arcs above the data,
    and dashed guides dropping straight down to tick labels below the axis
    -- so the arrow, the text and the axis each stay in their own band and
    never cross.
    """
    W, H = 560, 320
    fig = plt.figure(figsize=(W / 100, H / 100), dpi=100)
    ax = new_axes(fig, W, H)

    axis_y = 50
    values = [70, 130, 95, 150, 110, 165]
    xs = [100 + i * 80 for i in range(len(values))]
    ys = [axis_y + v for v in values]
    it = 2  # index of "t"; it + 1 is "t+1"

    edge_line(ax, None, (60, axis_y), None, (540, axis_y), color=TEXT, lw=1.5, mutation_scale=14)

    ax.plot(xs, ys, color=MUTED, linewidth=1.8, zorder=1)
    for i, (x, y) in enumerate(zip(xs, ys)):
        if i not in (it, it + 1):
            node(ax, (x, y), r=6, fill=MUTED, edge=MUTED, lw=0)

    # Highlighted step, redrawn on top in the theme color.
    x_t, y_t = xs[it], ys[it]
    x_t1, y_t1 = xs[it + 1], ys[it + 1]
    ax.plot([x_t, x_t1], [y_t, y_t1], color=THEME, linewidth=2.4, zorder=2)
    t_patch = node(ax, (x_t, y_t), r=8, fill=THEME, edge=BG, lw=1.5, zorder=3)
    t1_patch = node(ax, (x_t1, y_t1), r=8, fill=THEME, edge=BG, lw=1.5, zorder=3)

    # Dashed guides dropping from each highlighted point to its tick label.
    for x, y in ((x_t, y_t), (x_t1, y_t1)):
        ax.plot([x, x], [axis_y, y], color=MUTED, linewidth=1.2, linestyle=(0, (4, 3)), zorder=0)
    label(ax, (x_t, axis_y - 20), "t", size=13, color=TEXT, font=FONT_MONO, weight="normal")
    label(ax, (x_t1, axis_y - 20), "t+1", size=13, color=TEXT, font=FONT_MONO, weight="normal")

    # Predict arrow, arcing above the two highlighted points.
    edge_line(ax, t_patch, (x_t, y_t), t1_patch, (x_t1, y_t1), color=TEXT, lw=1.8, rad=0.55, mutation_scale=13)
    apex_y = max(y_t, y_t1) + 38
    label(ax, ((x_t + x_t1) / 2, apex_y), "predict", size=12, color=TEXT, font=FONT_SANS, weight="bold")

    label(ax, (60, 300), "traffic", size=11, color=MUTED, font=FONT_SANS, weight="normal", ha="left")
    label(ax, (525, axis_y + 14), "time", size=11, color=MUTED, font=FONT_SANS, weight="normal", ha="left", va="center")

    save(fig, OUT / "markov-prediction.svg")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    metro_lines()
    markov_process()
    markov_prediction()
