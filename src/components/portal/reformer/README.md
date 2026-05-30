# Reformer Force Modeler (v1)

A side-view (2D) kinematics + force modeler for a Pilates Reformer. The user
poses a stick-figure human against a parametric reformer; the app solves
constrained geometry (inextensible ropes drive a spring-loaded carriage) and
outputs spring tension, rope angles, and force-vector decomposition of
external loads. Poses can be saved as keyframes and played back with per-frame
re-solve, and frames can be exported to CSV/JSON.

The tool is registered in `ToolHost` under the slug `reformer-force-modeler`
and gated like any other portal tool (admins see it automatically).

## Architecture

```
src/lib/reformer/                # pure physics. No React/DOM imports.
  types.js          JSDoc @typedef domain entities (single source of truth)
  units.js          SI <-> display conversions, G, LB_PER_IN_TO_N_PER_M
  vec.js            2D vector helpers
  springs.js        tension-only spring force + parallel sum
  rope.js           ropePathLength, ropeResidual, solveCarriageForRope,
                    solveSharedCarriage, ropeForceVector
  anthropometry.js  scaleFromHeight, Drillis & Contini ratios,
                    PHASE 2 Winter mass/COM fractions
  kinematics.js     forwardKinematics, jointAnglesDeg, isReachable
  interp.js         lerpAngles, easeT, sampleKeyframesAt
  solve.js          THE entry point: solve(modelState) -> derivedState
  defaults.js       PLACEHOLDER defaults, makeInitialModel

src/components/portal/reformer/
  ReformerForceModeler.jsx       top-level. Wires solve via useMemo.
  usePlayback.js                 requestAnimationFrame loop, playhead in ref
  store/                         typed-reducer store
    actions.js, reducer.js, ModelContext.jsx, selectors.js
  scene/                         SVG layers
    coords.js, SceneCanvas.jsx, SceneContext.jsx, DragHandle.jsx,
    ReformerLayer.jsx, SpringLayer.jsx, RopeLayer.jsx, BodyLayer.jsx,
    ForceVectorLayer.jsx
  panels/                        configuration UI
    PanelShell.jsx, MachinePanel.jsx, SpringsPanel.jsx, BodyPanel.jsx,
    AttachmentsPanel.jsx, ReadoutsPanel.jsx, ReadoutTable.jsx,
    TimelinePanel.jsx
  io/                            export + project save/load
    exportFrames.js (pure), projectIo.js (pure), download.js (DOM)
```

## Coordinate frame

World origin sits at the **head end of the reformer frame at floor level**.

- **+x** points toward the foot / spring end of the frame.
- **+y** points up.
- All world coordinates are SI (meters). Angles are radians internally and
  degrees only at the UI boundary.

The carriage solver tracks one scalar `carriageX`: the world x of the
carriage's spring-end edge. The carriage's head edge (where ropes attach) is
at `carriageX - reformer.carriageLength`. The spring attaches at world
`{x: carriageX, y: reformer.carriageSpringY}`. The pulleys / risers sit at the
head end of the frame (small x, high y).

SVG y is down; the scene flips y in `scene/coords.js::worldToSvg`.

## Rope constraint math

Each rope has a fixed total length `L` and runs:

```
ropeCarriageEnd  ->  pulley  ->  hand
pathLength = dist(ropeCarriageEnd, pulley) * mechanicalAdvantage
           + dist(pulley, hand)
```

`mechanicalAdvantage` defaults to `1`; set to `2` to model a doubled
(block-and-tackle) route on the carriage side. The solver finds the carriageX
that satisfies `pathLength == L`.

### Per-rope 1D solve

`solveCarriageForRope(rope, reformer, hand, seedX)` uses **bisection on
`[carriageMinX, carriageMaxX]`** with `tol = 1e-6 m` and `maxIter = 60`,
followed by **two Newton polish steps** with a finite-difference derivative.
`residual(x) = pathLength(x) - L` is monotonically increasing in `x`, so:

- `residual(min) >= 0`  =>  path too long even when fully retracted; clamp to
  `carriageMinX`, `atLimit: true`.
- `residual(max) <= 0`  =>  path always shorter than `L`; rope slack at every
  reachable carriage position, `slack: true`.
- otherwise: bisection + Newton converge to the root.

### Shared carriage (v1 simplification)

`solveSharedCarriage` resolves two (or more) ropes that share the carriage by
taking the **smallest (most-retracted) demand** from the taut ropes and
clamping to the travel range. Any rope whose demand exceeds the chosen
position has its hand-side go slack at that position and gets zero tension.
This is **deterministic, not a coupled physical force balance**: asymmetric
two-hand poses are approximate. The plan flags this as a v1 simplification;
a coupled force-balance solve is phase 2.

### Force at the hand

Tension at the hand acts along `unit(pulley - hand)`. v1 distributes the
total spring force **equally across taut ropes** (ideal pulley, massless
rope, no friction). `ropeForceVector` returns horizontal and vertical
components plus angle from horizontal and angle from vertical, both in
degrees.

## v1 scope and PHASE 2 seams

v1 outputs spring tension, rope angles, and force-vector decomposition at the
hand. **It does NOT compute joint torques or muscle loads.** The body model
includes per-segment `massFraction` and `comFraction` (Winter) plus
`bodyMass`, all marked `// PHASE 2`, so the joint-torque computation can be
added without restructuring.

## PLACEHOLDER values to replace

Every value below ships as a documented placeholder. Calibrate against your
own measured reformer and spring set before relying on the output.

**Reformer** (`src/lib/reformer/defaults.js` — `DEFAULT_REFORMER`):

- `frameLength`, `frameHeight`, `carriageLength`
- `carriageRestX`, `carriageMinX`, `carriageMaxX`
- `footbar` `{x, y}`, `springAnchor` `{x, y}`, `carriageSpringY`
- per-rope `routes[i].pulley` `{x, y}` and `mechanicalAdvantage`

**Springs** (`DEFAULT_SPRINGS`):

- per-color `stiffness` (author in lb/in, the file converts with
  `1 lb/in = 175.1268 N/m`)
- per-color `freeLength` (the natural unstretched length, m)
- the default `attached` set

**Body** (`DEFAULT_BODY_HEIGHT_M`, `DEFAULT_BODY_MASS_KG`, and
`anthropometry.js`):

- default height
- default body mass (PHASE 2)
- segment-length ratio table (validate against Winter)
- Winter `MASS_FRACTIONS` / `COM_FRACTIONS` (PHASE 2)

**Ropes** (`DEFAULT_ROPES`):

- per-rope `totalLength`
- default attachment mapping

**Scene tuning** (`scene/coords.js`):

- `SCALE` (SVG units per world meter), `FORCE_PX_PER_N`, `FORCE_MAX_PX`,
  `FORCE_MIN_VISIBLE_N`

## How to verify a change

1. `npm run dev`, log in as admin, navigate to
   `/portal/reformer-force-modeler` (the slug is also rendered in the
   `webinars` row from migration `028`).
2. Default pose loads: stick figure lying supine on the carriage with both
   ropes attached to the toe (feet in straps).
3. Drag the orange pelvis dot to translate the whole figure. Drag any other
   joint to rotate that limb rigidly about its proximal anchor. Carriage
   updates live as the toe (rope-attached endpoint) moves.
4. Toggle springs in the Springs panel. Total force, per-spring tension, and
   the spring-force arrow at the carriage update.
5. Save a keyframe, change the pose, save a second keyframe. Scrub the
   timeline. Press play. Verify carriage motion stays physically consistent
   throughout the playback (no jumpy interpolation).
6. Export CSV and JSON. Save the project, reload it, confirm the model and
   keyframes restore.

## Testing seam

There is no test runner configured in this repo yet (per project decision).
Every module under `src/lib/reformer/` is pure and importable from Node with
zero React / DOM dependencies, so adding Vitest later requires no
restructuring. Suggested test surface:

- `springs.js`: stretch / slack / pretension behavior
- `rope.js`: residual monotonicity, single-rope solve at known geometries,
  shared-carriage rule
- `solve.js`: end-to-end on a small fixture; round-trip CSV row counts
- `interp.js`: angle lerp wraps correctly across `±PI`
- `units.js`: lb / N round-trip
