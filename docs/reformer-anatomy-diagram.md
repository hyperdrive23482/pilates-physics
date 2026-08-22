# Reformer Anatomy Diagram — build notes and handoff

Reference for the interactive labeled reformer diagram built for **Module 1
("The machine, named")** of *The Making of a Reformer*. See
[reformer-machine-course-spec.md](marketing/working-drafts/reformer-machine-course-spec.md),
where this is listed under "Interactive tool requirements" as *Labeled reformer
diagram — to build*.

**Status:** first pass built and browser-verified. Geometry is placeholder
pending real measurements. Nothing here is final.

**File:** [animations/reformer-anatomy.html](../animations/reformer-anatomy.html)
(689 lines, single self-contained file, no dependencies)

---

## 1. What was built

A standalone HTML file following the same pattern as the ten existing files in
`animations/` — inline CSS and JS, no build step, no framework, served from
`/animations/` behind admin auth and embedded by iframe.

**Interaction model:**

- Five view tabs — Side, Top, Bottom, Head end, Foot end — one large view at a
  time rather than a traditional orthographic multi-view layout, so each view
  stays readable on a phone.
- Hover or tap any part: it highlights gold, every other part dims, and a
  **fixed panel below the diagram** names it. Deliberately not a floating
  tooltip — a hover tooltip is dead on touch, and a meaningful share of the
  audience will be on an iPad. Click makes the selection sticky, which is what
  makes tap work.
- A part index below the panel is **two-way**: hovering a name highlights the
  part in the diagram, and vice versa. This makes the graphic function as a
  vocabulary list as well as a diagram.
- Parts not visible in the current view are **dimmed in the index**, and the
  panel lists which views each part does appear in. This teaches something on
  its own: "Side wheels — visible in: Bottom, Head end."
- Each part carries a load tag: **Changes load** / **Changes it indirectly** /
  **Does not change load**, matching module 1's stated job.

**Verified in browser:** all five views render, all 19 parts present, no
console errors, no horizontal overflow at 375px, tap-to-stick works.

## 2. How the file is structured

It is **parametric**, not hand-drawn SVG. All geometry derives from one
dimensions block, so correcting a number updates all five views consistently.

| Block | Line | What it is |
|-------|------|-----------|
| `D = {...}` | [242](../animations/reformer-anatomy.html:242) | **All dimensions, in centimetres. The only block you need to edit to correct the drawing.** |
| derived values | [279](../animations/reformer-anatomy.html:279) | `carHead`, `deckTop`, `railBot` etc., computed from `D` |
| `VIEWS` | [312](../animations/reformer-anatomy.html:312) | The five views: viewBox and caption |
| `PARTS` | [327](../animations/reformer-anatomy.html:327) | One entry per part: name, load tag, panel text, and shapes per view |

Coordinate convention matches
[src/lib/reformer/types.js](../src/lib/reformer/types.js): `x = 0` at the head
end (risers), `+x` toward the foot end (footbar), `h` = height above floor,
`z` = across the machine from the centreline. Helpers `up(h)` and `mir(z)`
convert to view coordinates. Shape constructors are `R` rect, `C` circle,
`Ln` line, `Pg` polygon, `Pa` path, plus `coilX()` for springs.

`PARTS` is ordered **largest first** so small parts land on top for
hit-testing. Each part renders twice — visible shapes, then a transparent
thick-stroked copy in a hit layer on top, so thin lines are still easy to
hover.

## 3. The 19 parts

Frame, Rails, Carriage, Springs, Spring bar, Spring rest, Footbar, Gear bar,
Headrest, Shoulder rests, Shoulder posts, Risers, Pulleys, Ropes and straps,
Loops and handles, Rolling wheels, Side wheels, Stopper, Foot strap.

## 4. Open decisions — review these

1. **The load tags are judgment calls and need your review.** Footbar =
   indirect, pulleys = yes, shoulder rests = indirect, rolling wheels =
   indirect. These are arguable and they are the pedagogically important part
   of the graphic.
2. **Bottom view is the weakest of the five.** Only the wheels genuinely need
   it; everything else is a mirrored top view. It earns its place solely as
   the "here's where the friction lives" reveal. Keep or cut.
3. **Front/back were renamed to "Head end" and "Foot end."** On a reformer,
   "front" is ambiguous in a way that undercuts a vocabulary module. Revert in
   `VIEWS` if you disagree.
4. **Panel copy** is first-draft and not voice-checked against the marketing
   guidelines.

## 5. To finish this — what's needed

### Ranked, most useful first

1. **CAD, if it exists.** A DXF or SVG export of the orthographic views is the
   best case — real geometry, correctly projected. The drawing would be rebuilt
   from it rather than approximated.
2. **A table of measurements.** Nearly as good, because the file is
   parametric — edit numbers in `D`, all five views update. List below.
3. **Photos**, useful only as a tiebreaker for *arrangement* questions, not for
   dimensions. Most useful for the foot end, the least confident area.

**Note on tracing:** tracing a PNG means eyeballing proportions off an image,
fighting lens perspective and guessing at scale. It would be *less* accurate
than the parametric drawing already built. Measurements beat images here.

### Measurements needed

- Frame length and width
- Rail height, rail width, rail spacing
- Carriage length, width, deck thickness
- Carriage rest position and both travel limits
- Wheel diameter and positions (rolling and side)
- Riser height and spacing
- Pulley positions — **and whether risers carry one pulley or two**
- Footbar height and its gear positions
- Spring bar position, spring free length
- Shoulder rest spacing and height
- Headrest length
- Stopper position

### Specific things guessed at

- **Foot strap** — placed hanging at the foot end of the frame. Least confident
  item in the drawing.
- **Gear bar** — drawn as a notched bar the footbar locks into.
- **Shoulder posts** — drawn as pins in sockets. Fixed or removable?
- **Pulleys** — currently two per riser in the side view.

### Bonus

The same measurements fix
[src/lib/reformer/defaults.js](../src/lib/reformer/defaults.js), which is
currently all placeholders with
[its README](../src/components/portal/reformer/README.md) asking for exactly
this calibration. Measure once, two things become correct.

Note the current mismatch: `defaults.js` uses `carriageLength: 75`,
`carriageRestX: 210`; this diagram uses `carL: 95`, `carRest: 205`. Both are
placeholders. Real numbers should replace both.

## 6. Wiring it into the course

`animations/` files are served from `/animations/` behind admin auth (see
[src/pages/admin/AdminAnimations.jsx:152](../src/pages/admin/AdminAnimations.jsx:152)).

The old `AnimationSlot` component — which mapped animation IDs to iframe
sources and auto-sized the iframe to content — now lives at
[src/_archive/course/AnimationSlot.jsx](../src/_archive/course/AnimationSlot.jsx).
**The current embedding mechanism needs to be confirmed before wiring this in.**

## 7. To resume on another machine

1. Open [animations/reformer-anatomy.html](../animations/reformer-anatomy.html)
   directly in a browser — no server, no build, no install.
2. To correct geometry, edit the `D` block at line 242 and reload.
3. To change part names, load tags, or panel copy, edit `PARTS` at line 327.
4. To add or remove a view, edit `VIEWS` at line 312 and add the matching key
   to each part's `views` object (`null` means not visible in that view).
