---
name: new-pilates-animation
description: Create a new Pilates exercise animation page (HTML + Supabase migration + tool registration) based on the bridge-knee-torque template. Use when the user wants to make another version of the exercise animation page for a different exercise (e.g. "make a footwork version", "create a knee-stretch animation page", "new animation for hip extension").
---

# New Pilates Animation

Spin up a new exercise animation page modeled on [animations/bridge-knee-torque.html](../../../animations/bridge-knee-torque.html). Each animation pairs a stick-figure reformer view with a dual-axis graph showing spring tension and joint torque across the press-out distance, plus a notes panel.

## When to use

The user wants a new animation page for a different Pilates exercise that follows the same format as the bridge press-out animation.

## Inputs to gather from the user

Before touching code, confirm these:

1. **Exercise name** (short — e.g. "Footwork", "Knee Stretch", "Long Spine")
2. **Joint of interest** (knee, hip, shoulder, elbow…)
3. **Spring tension at start and at full extension** (lb) — `F0`, `F1`
4. **Joint torque at start and at full extension** (in·lb) — `T0`, `T1`
5. **Carriage extension range** (inches) — `X_MAX`
6. **Spring color combination** (e.g. "red, red, blue") for the notes
7. **Body assumptions** for the notes (lb supported, limb lengths, starting joint angles)

## Files to create / edit

| File | Action |
| --- | --- |
| `animations/<slug-without-prefix>.html` | Copy `bridge-knee-torque.html`, then customize the constants below |
| `supabase/migrations/<NNN>_<slug>_tool.sql` | New migration seeding the `webinars` row, modeled on `011_bridge_animation_tool.sql` |
| `api/portal/animation.js` | Add entry to `SLUG_TO_FILE` |
| `src/components/portal/ToolHost.jsx` | Add entry to `REGISTRY` |

The slug used in the DB and registries follows the pattern `animation-<exercise>` (e.g. `animation-footwork`).

## What to customize in the HTML

All of these live in `animations/<new>.html`. Search for them top-to-bottom; everything else is shared boilerplate (canvas drawing, IK, animation loop) and should not be touched.

### 1. Page text

- `<title>` in `<head>`
- `<h1>` (preserves the `<em>` italic on "Spring Tension" if you keep that phrasing)
- `<p class="subtitle">`

### 2. Geometry constants (top of `<script>`)

```js
const FOOT_X, FOOT_Y      // where the foot/contact point sits relative to the apparatus
const HIP_OFFSET_X        // hip offset from carriage left edge
const THIGH, SHIN         // limb segment lengths in px
const CARR_STARTX         // carriage left edge at 0" extension
const CARR_PX_PER_INCH    // pixels per inch of carriage travel (usually leave as-is)
```

**Important invariant — straight-joint at full extension:** the joint should land exactly straight at `X_MAX`. With hip at `FOOT_Y` (e.g. a bridge), the foot↔hip distance at full extension is purely horizontal: `(CARR_STARTX + X_MAX·CARR_PX_PER_INCH + HIP_OFFSET_X) − FOOT_X`. Set `THIGH + SHIN` equal to that value. For exercises where hip and foot are not at the same y, compute the actual euclidean distance.

### 3. Physics constants

```js
const X_MAX            // inches
const F0, F1           // spring tension at 0 and at X_MAX (lb)
const T0, T1           // joint torque at 0 and at X_MAX (in·lb)
const F_MAX, T_MAX     // y-axis upper bounds — pick so F1 / T1 sit slightly below the top
```

The model is linear between endpoints (`springF`, `torqueT`). If you need non-linear curves later, swap those functions.

### 4. Stick figure pose (`drawStickFigure`)

The bridge uses:

```js
const hipY = FOOT_Y                  // hips in the air, level with foot on footbar
const shoulderX = headCx - HEAD_R + 1
const shoulderY = CARR_TOP           // shoulders rest on the carriage
```

For a different exercise:

- **Supine footwork** — hipY ≈ CARR_TOP (lying flat); body line nearly horizontal
- **Knee stretch / kneeling** — knees on carriage, hands on footbar; you'll likely re-do the body line entirely
- **Long box / seated** — torso vertical; body line points up from hip

If the body shape changes substantially, expect to rework the body-line drawing block (and possibly the head position).

### 5. Endpoint labels (`drawEndpointDots`)

Update the four hard-coded label strings to match `F0`, `F1`, `T0`, `T1`:

```js
gc.fillText('22.0 lb', sp0.x + 8, sp0.y + 16)   // F0
gc.fillText('43.3 lb', sp1.x - 8, sp1.y + 26)   // F1
gc.fillText('900 in·lb',   tp0.x + 8, tp0.y - 18)  // T0
gc.fillText('1,620 in·lb', tp1.x - 8, tp1.y - 8)   // T1
```

The y offsets (`+16/+26/-18/-8`) were tuned by hand to clear the curves and the y-axis tick labels. If the new endpoints land in a different spot relative to each other, you may need to nudge them.

### 6. Notes section (`<div class="notes">`)

Three `<li>` items + one caveat paragraph. Update the assumptions and the spring color.

## Animation cycle

The loop runs out → in → out → in (`TOTAL_PHASES = 4`, `DURATION = 2500` ms per phase). Leave alone unless you want a different cadence.

## Tool registration after the HTML is done

1. **Migration** — copy `supabase/migrations/011_bridge_animation_tool.sql` to the next number, swap slug/title/subtitle/description. Run it in Supabase SQL editor.
2. **`api/portal/animation.js`** — add `'animation-<exercise>': '<filename>.html'` to `SLUG_TO_FILE`.
3. **`src/components/portal/ToolHost.jsx`** — add `'animation-<exercise>': animation('animation-<exercise>')` to `REGISTRY`.

## Verification

- Open `animations/<new>.html` directly in a browser. Confirm:
  - Static state shows full lines with all four endpoint labels visible (no overlap with the curves or axis labels).
  - Pressing **Play** runs out → in → out → in over ~10 s.
  - Joint is straight at full extension; bend matches the exercise at home position.
- Run the new migration in Supabase.
- `/admin/animations` should list the new file (auto-discovered).
- `/admin/tools` should list the new tool row after the migration runs.
- Grant yourself the entitlement (or rely on admin bypass) and confirm the tool renders inside the portal.
