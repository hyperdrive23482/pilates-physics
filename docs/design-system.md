# Pilates Physics — Design System (v2)

Reference for the redesigned visual language introduced on the homepage
([src/pages/Landing.jsx](../src/pages/Landing.jsx) +
[src/pages/Landing.css](../src/pages/Landing.css)). Apply this when building or
porting new marketing pages so the look stays coherent.

---

## 1. Aesthetic in one line

**Engineering field-notebook meets scientific paper, rendered dark.** Warm dark
ground, neutral light-grey ink, a single marigold-amber accent, a faint
grid-paper background, serif body type with monospace marginalia, italic
emphasis on key words, and small "FIG. 01"-style registration marks at the
corners of figures and sections. Restraint over decoration; almost no rounded
corners; hairline rules do most of the structural work.

---

## 2. Scope — important

The new system is **scoped to `.ppv2`** in [Landing.css](../src/pages/Landing.css).
It is NOT the same as the global tokens defined in
[src/index.css](../src/index.css) (which still drives the navbar, footer, admin,
portal, blog body, etc.).

| Concern        | Global system (`:root`)        | v2 system (`.ppv2`)                |
|----------------|--------------------------------|-------------------------------------|
| Background     | `--color-bg: #1C1A17`          | `--bg: #0e0d0b` (darker, warmer)    |
| Surface        | `--color-surface: #242118`     | `--bg-2: #1a1813`                   |
| Raised surface | `--color-surface-raised: #2E2B26` | `--bg-3: #24201a`                |
| Ink            | `--color-ink: #E8E8E8`         | `--ink: #E3E3E3` (neutral grey)     |
| Serif          | DM Serif Display               | Source Serif 4                      |
| Sans/Mono      | DM Sans + JetBrains Mono       | JetBrains Mono (no sans)            |

**When porting a page to the new style**, wrap its root in
`<div className="ppv2 grid-bg" data-section-style="alt">…</div>` so the scoped
tokens, grid background, and alternating section bands all activate.

The accent (`#f09f26`) is intentionally the same in both systems —
that's the bridge while the rest of the site migrates.

---

## 3. Color tokens (v2)

Defined on `.ppv2` in [Landing.css:17–29](../src/pages/Landing.css#L17-L29):

```
--bg          #0e0d0b   page ground
--bg-2        #1a1813   tinted band / card fill on plain bg
--bg-3        #24201a   inner card fill when sitting on bg-2
--ink         #E3E3E3   primary text
--ink-soft    rgba(...,0.65)   secondary text, meta lines
--ink-faint   rgba(...,0.42)   tertiary / numbering
--rule        rgba(...,0.18)   all hairlines, card borders, dividers
--grid        rgba(...,0.045)  grid-paper lines (very subtle)
--grid-bold   rgba(...,0.075)  reserved — not currently used
--accent      #f09f26   the ONE accent — links, italic emphasis, CTAs, kickers
--accent-ink  #1c1a17   text color ON the accent (button labels)
--accent-warm #c07c17   accent hover/active
```

**One-accent rule.** Marigold-amber is the only chromatic color. Don't
introduce a second accent for "secondary" CTAs — use ghost / arrow-link styles
instead.

**Note on `--accent-ink`.** The on-accent text color is **dark**
(`#1c1a17`), not cream. That means anything sitting on top of the accent
fill — primary buttons in particular — reads as dark glyphs on a warm amber
plate, like a printed label. Don't override this with light text; the contrast
is the whole point.

---

## 4. Typography

```
--pp-font-serif: "Source Serif 4", "Source Serif Pro", Georgia, serif
--pp-font-mono:  "JetBrains Mono", ui-monospace, ...
```

Body is **17px / 1.55** Source Serif 4. There is no sans-serif in `.ppv2` —
mono fills the "label" role that sans usually would.

### Scale (all serif, weight 400, balanced wrap)
| Use                  | Size                              |
|----------------------|-----------------------------------|
| Hero H1              | `clamp(64px, 7.2vw, 124px)`, line-height 0.96 |
| Section H2 (large)   | `clamp(56px, 6vw, 96px)` (Meet) or `clamp(64px, 8vw, 124px)` (Framework) |
| Section H2 (medium)  | `clamp(48px, 5.6vw, 84px)` (CTA), `clamp(40px, 4.6vw, 72px)` (default) |
| Premise H2           | `clamp(36px, 3.6vw, 56px)`        |
| Card H3              | `26px` (framework card question)  |
| Body                 | `17–19px` / 1.5–1.55              |
| Lede                 | `19px`                            |

Headings always use `letter-spacing: -0.012em` (tighter than default) and
`text-wrap: balance`.

### Italic-accent emphasis (signature move)
Wrap the key phrase in a heading in `<span className="italic accent">…</span>`
to color it marigold-amber and italicize it. Examples on the homepage:

- "Pilates through the *physics lens.*"
- "Memorizing settings isn't the same as *understanding them.*"
- "Three / *components.*"
- "Live. Interactive. Built for *working instructors.*"

Use this **once per heading** as the rhetorical landing point — never twice.

### Mono micro-type
- `.mono` — utility class to flip a span to JetBrains Mono.
- `.kicker` — 11.5px, uppercase, +0.12em tracking, **accent-colored**. Used
  above titles to label the section: `§ 02 · A three-part lens`.
- `.eyebrow` — same metrics, but in `--ink-soft`. Used when a paired kicker
  already carries the accent.
- "FIG. 01", "FIG. 02" tags on visual elements (spring chart, photo) follow
  the same 10.5–11.5px mono uppercase pattern, with the ID in accent and the
  rest in `ink-soft`.

### Numbered sections
The homepage labels each section with `§ 01 · Premise`, `§ 02 · A three-part lens`,
etc. Use the section sign (§) plus zero-padded number, separator dot (·), then
the section name. Place inside a `.kicker` or `.eyebrow`.

---

## 5. Layout primitives

```
.container          max-width 1320px, padding 0 48px
.container--wide    max-width 1480px
.container--narrow  max-width  980px

.section-pad        96px 0 112px  (default vertical rhythm)
.section-pad-l      132px 0 144px (larger — used on Framework + CTA)
```

Breakpoints: `1100px` collapses two-column grids to one and reduces gutter to
32px; `700px` reduces gutter to 22px, caps H1 at 56px, and shrinks section
padding to `72px 0 80px`.

### Section banding pattern

The page is wrapped with `data-section-style="alt"` and each major section gets
the `section--inset` class. The rule in
[Landing.css:552–562](../src/pages/Landing.css#L552-L562) tints
even-positioned siblings with `--bg-2` and adds top/bottom hairlines, producing
alternating bands of plain bg ↔ tinted bg without any per-section markup.

An alternative `data-section-style="inset"` mode renders sections as
margin-floated cards instead — kept available but not the default.

---

## 6. Decorative elements (signature texture)

### Grid-paper background
Applied via `.grid-bg` on the page root: two 1px linear gradients at 24×24px
intervals using `--grid` (~4.5% white). Almost subliminal — sets the
"engineering paper" tone without becoming noise.

### Corner registration crosses
`<span className="cross tl"></span>` (and `tr`, `bl`, `br`) inside a section
with `.section-frame` paints a 10×10px plus-sign in `--rule` at each inset
corner — like the crop marks on a print proof. Currently used on the hero
section only. Use sparingly on full-bleed feature sections, never inside body
content.

### "FIG. NN" figure captions
Any visual element (chart, photo) gets a tiny mono caption inside an absolutely
positioned tag: `FIG. 01` in accent + descriptor in `ink-soft`. See
[Landing.jsx:76–79](../src/pages/Landing.jsx#L76-L79) and
[Landing.jsx:162–165](../src/pages/Landing.jsx#L162-L165). When adding a new
figure, increment the number across the whole page.

### Pulsing accent dot
The spring-chart hint line has a small `--accent` circle that pulses via
`@keyframes ppv2-pulse` (2s ease-in-out, scale 1 → 1.6, opacity 1 → 0.4). Use
to call attention to a single interactive cue — don't use it more than once
per screen.

### Hero scrim
The hero stacks a directional dark gradient over a background photo
(82% → 12% opacity, left to right) so headline copy stays legible over the
left third while the photo bleeds through on the right. See
[Landing.css:180–192](../src/pages/Landing.css#L180-L192).

### Glassmorphism (sparingly)
The spring-chart card uses `backdrop-filter: blur(14px) saturate(140%)` over
the hero photo. **Reserved for content sitting on top of imagery** — don't use
it on flat-bg sections.

---

## 7. Components

### `.btn` — primary CTA
Solid `--accent` (amber) fill with **dark** `--accent-ink` label (the
high-contrast plate look — see §3), 1px border in the same accent, JetBrains
Mono 12.5px uppercase, 0.08em tracking, `14px 22px 13px` padding (note the
asymmetric vertical to compensate for mono's optical baseline). Hover shifts
to `--accent-warm` (deeper amber). Always paired with the inline `<ArrowSvg />`
icon (1.5px stroke, square caps), which inherits the dark label color via
`stroke="currentColor"`.

### `.arrow-link` — secondary CTA / "Read more"
Mono uppercase, accent color, 1px bottom border in `currentColor`. Use for
in-flow navigation ("Read full bio →"). The arrow is a literal `→` glyph here
(not the SVG component).

### `.fcard` — framework / feature card
- `--bg-2` fill (or `--bg-3` when inside a tinted section — handled
  automatically by [Landing.css:578–582](../src/pages/Landing.css#L578-L582)).
- 1px `--rule` border, hover → `--accent` border (only state-change animation
  on the page).
- Header row: mono `01` (ink-faint), mono `·` separator, mono uppercase label
  in accent.
- Body: 26px serif question, hangs alone in the card.
- Square corners. No shadow. No icon.

### `.quote-card` — testimonial
Same border + fill treatment as `.fcard`. Head row is the social handle in
mono lowercase (`@` in accent, oversized; handle in `ink-soft`). Body is
serif 16px straight-quoted ("…"). Currently rendered in a 4-column grid on
desktop, 2-up at 1100px, 1-up at 700px.

### Hero meta block
Three-line key-value list in mono 11.5px. Key column is fixed-width 56px and
colored `--accent`, value follows. Used for "What / When / Where" on the hero
CTA — adapt the pattern for any inline spec list.

### Photo card (`.meet__photo`)
Photos sit inside a bordered card with internal padding (28px top / 14px sides
/ 18px bottom) and a "FIG. NN BIO" mono tag along the top edge. The image
itself is 560px tall (420px at mobile) with `object-fit: cover`. Don't crop —
let the card frame the photo.

---

## 8. Copy conventions

Borrowed from how the homepage is written — keep these for consistency:

- Sentence case for headings, never title case.
- One italic-accent phrase per heading, used as the rhetorical payoff.
- Section labels follow `§ NN · Name` format (see §4).
- Body voice is direct, second person, no marketing fluff. Em-dashes for
  asides. Avoid exclamation marks.
- Use `<em>` inside body paragraphs for in-line emphasis — the
  `.understanding__right p em` rule promotes them to accent color +
  weight 500 automatically.

---

## 9. Responsive checklist

When adding a new section to the v2 system, verify at three widths:

| Width    | What changes                                                |
|----------|-------------------------------------------------------------|
| > 1100px | Two-column grids active, full padding (48px), full type scale. |
| 700–1100 | All grids collapse to single column, gutter → 32px, gap → 32–56px. |
| < 700px  | Gutter → 22px, H1 forced to 56px, section padding → 72px 0 80px, testimonial grid → 1-up. |

The grid-paper background remains at 24px regardless — don't try to scale it.

---

## 10. What NOT to do

- **Don't introduce a second accent color.** One amber, that's the contract.
- **Don't add rounded corners.** Squared edges throughout. The only round things
  on the page are the pulse dot and the `@` glyph.
- **Don't use drop shadows.** Depth comes from `--bg-2`/`--bg-3` layering and
  hairline rules, not blur.
- **Don't mix DM Serif Display into `.ppv2`.** That font belongs to the
  legacy/global system; the v2 system is Source Serif 4 only.
- **Don't use the italic-accent treatment on body copy** — it's a heading-only
  device. For body emphasis use `<em>` (auto-styled in the Understanding
  section) or `<strong>` (which renders as full-weight ink, not accent).
- **Don't FIG-tag every visual** — reserve it for genuine "figures" (charts,
  portraits, diagrams). It loses meaning when applied to every img.
- **Don't stack section-frame corner crosses on inner content.** They're a
  page-edge / section-edge device.
