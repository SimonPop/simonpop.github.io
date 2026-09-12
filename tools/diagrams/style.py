import matplotlib

matplotlib.use("svg")
matplotlib.rcParams["svg.fonttype"] = "none"  # keep text as real <text>, styled by the site's CSS fonts

TEXT = "#191b22"
MUTED = "#666c7e"
BG = "#ffffff"
SURFACE = "#f5f6fa"
BORDER = "#e2e4ec"
THEME = "#4a5fd9"
GENOMICS = "#14805c"
XAI = "#b85c0d"
LANGUAGE = "#7c4de0"

FONT_DISPLAY = "Archivo, sans-serif"
FONT_SANS = "-apple-system, BlinkMacSystemFont, sans-serif"
FONT_MONO = "IBM Plex Mono, monospace"


def lerp_color(c1, c2, t):
    c1 = tuple(int(c1[i : i + 2], 16) for i in (1, 3, 5))
    c2 = tuple(int(c2[i : i + 2], 16) for i in (1, 3, 5))
    mix = tuple(round(a + (b - a) * t) for a, b in zip(c1, c2))
    return "#{:02x}{:02x}{:02x}".format(*mix)


def new_axes(fig, width, height):
    """Full-bleed axes in data coordinates 0..width / 0..height (y up)."""
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, width)
    ax.set_ylim(0, height)
    ax.set_aspect("equal")
    ax.axis("off")
    return ax


def node(ax, xy, r=15, fill=BG, edge=TEXT, lw=1.5, zorder=3):
    from matplotlib.patches import Circle

    c = Circle(xy, r, facecolor=fill, edgecolor=edge, linewidth=lw, zorder=zorder)
    ax.add_patch(c)
    return c


def label(ax, xy, text, size=13, color=TEXT, font=FONT_DISPLAY, weight="bold", zorder=4, ha="center", va="center"):
    ax.text(xy[0], xy[1], text, fontsize=size, color=color, fontfamily=font, fontweight=weight,
             ha=ha, va=va, zorder=zorder)


def edge_line(ax, a_patch, a_xy, b_patch, b_xy, color=MUTED, lw=2, rad=0.0, arrow=True,
              dashed=False, both=False, zorder=1, mutation_scale=14, shrink=0):
    from matplotlib.patches import FancyArrowPatch

    style = "-|>" if arrow else "-"
    if both:
        style = "<|-|>"
    kwargs = dict(
        posA=a_xy, posB=b_xy, patchA=a_patch, patchB=b_patch,
        connectionstyle=f"arc3,rad={rad}", arrowstyle=style,
        color=color, linewidth=lw, mutation_scale=mutation_scale,
        shrinkA=shrink, shrinkB=shrink, zorder=zorder,
    )
    if dashed:
        kwargs["linestyle"] = (0, (5, 4))
    fap = FancyArrowPatch(**kwargs)
    ax.add_patch(fap)
    return fap


def save(fig, path):
    import re

    fig.savefig(path, format="svg", transparent=True)
    # matplotlib always wraps the whole fontfamily string in one pair of quotes, which turns a
    # comma-separated CSS fallback list ("Archivo, sans-serif") into a single (nonexistent) family
    # name. Un-quote any font-family value that contains a comma so the browser treats it as a list.
    text = path.read_text()
    text = re.sub(r"font-family: '([^']*,[^']*)'", r"font-family: \1", text)
    path.write_text(text)
    print("wrote", path)
