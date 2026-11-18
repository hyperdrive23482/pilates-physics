---
name: social-graphs
description: >-
  Make a graph, chart or data table styled for Kaleen's @kaleenc_ social posts,
  carousels or presentation slides, from numbers she pastes, a spreadsheet
  screenshot or a physics model. Produces an HTML file in docs/social/ that draws
  each graphic on a canvas with PNG export, and publishes it as an Artifact so
  she can screengrab it. Use when the user says "make a graph of this", "chart
  these numbers for a post", "turn this table into a slide graphic", "graph for
  my carousel", "make this match my social styling", or wants a figure for a
  presentation or talk. Not for site pages (use page-design) or animations
  (use new-pilates-animation).
---

# Social graphs

Graphs for carousels and slides are canvas drawings in one self-contained HTML
file. Copy the reference implementation and change the data and draw
functions. Don't start from scratch and don't use a charting library.

**Reference implementations**
- `docs/social/spring-spec-vs-measured.html`: the current default and the
  approved look. It has one line chart and one table graphic. Start here; its
  `graph()` function already has every size and spacing below.
- `docs/social/momentum-carousel.html`: the older dark style, with
  transparent PNGs and a dark/light toggle. Use it for patterns the default
  lacks (value callouts with halos, shaded regions, number line, equation
  graphic), restyled to the rules here, or when she asks for dark or
  transparent.

## The look

These rules come from Kaleen's feedback on the first graph. The aim is
something a non-technical instructor can read on a phone: few labels, big
type, lots of air.

**Canvas**
- Background `#fafaf7`, filled into the canvas (not transparent).
- 80 px padding (`PAD`) on every side, so she can screengrab with room to
  spare. The drawing area inside the padding is 1000 px wide (sized for a
  1080 px slide); a line chart is about 780 px tall.

**Type** (JetBrains Mono for labels, Source Serif 4 for titles and big numbers)

| Element | Font | Size | Color |
|---|---|---|---|
| Axis titles ("Force", "Spring stretch") | Serif | 42 px | ink |
| Legend text | Mono | 30 px | ink |
| Tick label, imperial (`10 lbs`, `4"`) | Mono | 28 px | ink |
| Tick label, metric (`4.5 kg`, `10.2 cm`) | Mono | 22 px | soft ink |

Ink `#1c1a17`, soft ink `rgba(28,26,23,.62)`, grid `rgba(28,26,23,.08)`,
axis `rgba(28,26,23,.45)`. Squared edges, no rounded corners.

**Spacing** (constants in `graph()`)
- About 26 px (`GAP`) between each axis line and its tick labels, so the
  corner labels (`0 kg`, the first inch tick) don't crowd the axes.
- About 40 px between an axis title and its tick values.
- About 100 px between the legend and the top of the plot.
- Plot box in the reference: `L = 204, T = 130, R = w - 24, B = h - 196`.
  If you change the type sizes, move these to keep the gaps above.

**Axes and ticks**
- Few ticks: 3 or 4 per axis at round values, e.g. 4, 6, 8" and 0, 10, 20,
  30 lbs. Gridlines only at the labeled ticks.
- The x-axis covers only the measured range. Don't extend lines past the
  data or extrapolate to 0 unless she asks, and if she does, say which part
  is an estimate.
- Axis titles carry no unit ("Force", "Spring stretch"), because every tick
  carries its own.

**Metric, second, on the same axes** (the default)
- Each tick label stacks two lines: imperial with its unit on top, and metric
  underneath, smaller and in soft ink, with one decimal.
- Use kg, not newtons, because instructors know kg. Use cm for stretch.
- No separate metric axis. Kaleen found a kg axis on the right
  counterintuitive and too much for non-technical viewers.
- Text callouts use both units: `15.6 lbs (7.1 kg)`. Unitless numbers like
  % need no metric.

**Lines and legend**
- Lines only, no dots at data points. Measured is a solid line (6 px), spec
  is dashed (4.5 px).
- No series name labels when color already says what each line is, as with
  spring colors. If a line can't be told apart by color, put its name on the
  plot next to the line.
- The legend explains line *styles* only (solid "Measured", dashed "Spec").
  It sits at the top, right-aligned to the plot's right edge.
- Never label anything "Claude", even if her spreadsheet does. A "Claude"
  column is just "Spec".

**Color**
- Spring colors on the light background: yellow `#c9970a`, blue `#2f6fd6`,
  red `#cf3b33`, green `#2b8a52`. On dark: yellow `#f2c94c`, blue `#6b9cf0`,
  red `#ef6a5e`, green `#5cc98a`.
- For anything other than springs, use ink plus the one marigold accent,
  `#c07c17` on light and `#f09f26` on dark.

**Tables** are their own graphic: a mono uppercase header row (+0.12em
tracking), hairline rules, a square color swatch and serif name per row, and
right-aligned serif numbers. Signed percentages use a real minus (`−`).
Add a small mono formula note at the bottom if the numbers are derived.

**Words**
- Force in "lbs", stretch in inches written `4"`.
- "Spring weight" means the spring and "load" means the effect on the body;
  don't swap them.
- No em dashes.

## Workflow

1. **Get the numbers.** Read them from her paste or screenshot. Check any
   derived column she gives, such as % difference: work it out yourself and
   say so if it doesn't match. If units or which column is which are unclear,
   ask once.
2. **Copy the reference** to `docs/social/<topic>.html`. Replace the data
   constants, the `GRAPHICS` list (id, width, height, draw function), the
   tick values and the lede text. Keep `PAD`, `render()`, the font loading
   and `save()` unchanged.
3. **Publish it as an Artifact** (first publish: icon `chart`) and give her the
   link. Republish the same file path after each change so the link stays the
   same.
4. **Tell her the PNG buttons only work locally.** The artifact viewer blocks
   downloads, so she opens the `docs/social/` file in a browser to export. Or
   she screengrabs the artifact, which is why the padding is there.
5. **Iterate in small edits** and republish after each one. When she settles
   a new preference, add it to this skill.

## Presentation slides

For a 16:9 slide, set the graphic's size to about `w: 1600, h: 900` (still
inside `PAD`). The type sizes above already read well from across a room,
so keep them and widen the plot box.

## Data integrity

These graphics carry her credibility as an engineer. Plot only numbers she
gave you or a model she approved. Don't smooth, round or extrapolate silently,
and when a request would show something the data doesn't support (a line
through 0", a trend from two points), say so in one line and do it only if
she still wants it.
