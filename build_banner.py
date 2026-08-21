#!/usr/bin/env python3
"""Emit the light and dark profile banners from one template.

Two files, one source, so they can never drift apart. Run from this directory:
    python3 build_banner.py

Why an SVG at all: a GitHub README cannot carry CSS. The sanitizer strips <style>,
<script> and inline <svg>, and `style` is not an allowed attribute, so no styling
survives in the markup. An SVG referenced with <img src=...> is loaded as an image
instead of parsed as markup, so its own styling renders intact. That is the only
route to a designed header on a profile README.

Fonts are system stacks on purpose. A webfont would need an external @import that
GitHub's image proxy will not fetch, and the banner would silently fall back.
"""

SANS = "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace"

THEMES = {
    "light": {
        "bg": "#FBFBF9",
        "panel": "#FFFFFF",
        "rule": "#E3E1DB",
        "ink": "#14171A",
        "muted": "#5B6570",
        "accent": "#2F6F5E",
        "accent2": "#8C2F39",
    },
    "dark": {
        "bg": "#0D1117",
        "panel": "#161B22",
        "rule": "#272C33",
        "ink": "#E6EDF3",
        "muted": "#8B949E",
        "accent": "#4EA88F",
        "accent2": "#C46A73",
    },
}

# label, sublabel, status, status colour key
#
# Colour encodes how far along a project is, and nothing else. Green for the two
# in beta, muted for the one still in active development. Deliberately NOT the
# red from the Genesis palette: there it means "blocked", and a reader who has
# seen the deck would read a red vocalize as broken rather than as early.
CARDS = [
    ("genesis", "agents that must apply their rules", "beta", "accent"),
    ("graphcrew", "LangGraph with the defaults built in", "beta", "accent"),
    ("vocalize", "offline speech, Rust and ONNX", "active dev", "muted"),
]

TECH = ["RUST", "PYTHON", "GO", "TYPESCRIPT", "KUBERNETES", "MCP", "MLOPS"]

W, H = 1200, 340


def card(x, y, w, h, name, sub, status, status_key, t):
    sc = t[status_key]
    return f"""
  <g>
    <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10"
          fill="{t['panel']}" stroke="{t['rule']}" stroke-width="1"/>
    <rect x="{x}" y="{y}" width="3.5" height="{h}" rx="1.75" fill="{sc}"/>
    <text x="{x + 22}" y="{y + 34}" font-family="{MONO}" font-size="20"
          font-weight="600" fill="{t['ink']}">{name}</text>
    <text x="{x + 22}" y="{y + 60}" font-family="{SANS}" font-size="14.5"
          fill="{t['muted']}">{sub}</text>
    <text x="{x + w - 22}" y="{y + 34}" text-anchor="end" font-family="{MONO}"
          font-size="12.5" letter-spacing="0.08em" fill="{sc}">{status.upper()}</text>
  </g>"""


def build(theme_name):
    t = THEMES[theme_name]
    cards = ""
    cy = 150
    for i, (name, sub, status, key) in enumerate(CARDS):
        cards += card(56 + i * 368, cy, 344, 82, name, sub, status, key, t)

    # Advance by the measured width of each label rather than by a fixed step, so
    # the gaps between them stay equal whatever the labels say. Hardcoding x
    # positions crammed GO against TYPESCRIPT and left a hole after KUBERNETES.
    tech = ""
    x = 56.0
    for label in TECH:
        tech += (
            f'    <text x="{x:.0f}" y="{H - 34}" fill="{t["muted"]}">{label}</text>\n'
        )
        # 13px mono advances ~0.60em per glyph, plus the 0.06em letter-spacing.
        x += len(label) * 13 * 0.66 + 34

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"
     width="{W}" height="{H}" role="img"
     aria-label="Atiqul Islam, agent infrastructure engineer. Projects: genesis, graphcrew, vocalize.">
  <rect width="{W}" height="{H}" fill="{t['bg']}"/>

  <text x="56" y="72" font-family="{SANS}" font-size="46" font-weight="700"
        letter-spacing="-0.02em" fill="{t['ink']}">Atiqul Islam</text>

  <text x="56" y="106" font-family="{SANS}" font-size="19" fill="{t['muted']}">I build the agent infrastructure other engineers ship on.</text>

  <g font-family="{MONO}" font-size="13" letter-spacing="0.06em">
{tech}
  </g>

  <text x="{W - 56}" y="{H - 34}" text-anchor="end" font-family="{SANS}"
        font-size="13.5" fill="{t['muted']}">St. John's, Newfoundland, Canada</text>

  <line x1="56" y1="{H - 58}" x2="{W - 56}" y2="{H - 58}"
        stroke="{t['rule']}" stroke-width="1"/>
{cards}
</svg>
"""


for name in THEMES:
    path = f"assets/banner-{name}.svg"
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(build(name))
    print(f"wrote {path}")
