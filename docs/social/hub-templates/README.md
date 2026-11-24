# @kaleenc_ social templates (Kaleen Hub system)

Reel covers and carousel slides for @kaleenc_, in the Kaleen Hub "spec sheet"
design system (`docs/kaleen-hub-design-system`). Chosen 2026-11-24 from the
gallery in `index.html` (artifact https://claude.ai/artifact/RMqerVaJZBBr8mWhC18xoK).
Replaces the floor-title cover (`docs/social/reel_cover.py`) and the cream
mono carousels.

## Rules

- **Reel covers alternate R-01 and R-02.** Check which style the last
  @kaleenc_ reel used and pick the other.
  - R-01 framed figure: headline on graph paper, photo in a white frame. If the
    reel has a graphic (a chart, a diagram), R-01 frames the graphic instead of
    the photo.
  - R-02 title block: full-bleed photo, white outlined panel with an optional
    blue kicker and the headline.
- **No italic words**, on covers or slides.
- **Footer is `@kaleenc_`** with the slide number (`03 / 07`) on every slide.
- **The CTA lives on the last slide**, a `close` slide with the navy band.
- Blue is for small text, thin lines and data highlights (`[[92% more]]` on a
  data slide). No gradients, shadows or rounded corners.
- Cover text stays inside the 3:4 profile grid crop (y 240 to 1680 of 1920).
  Both layouts do this as long as the headline is two or three short lines.

## Render

    python docs/social/hub-templates/render.py SPEC.json OUT_DIR

Needs Chrome and a network connection (Google Fonts). Writes `cover.png`
(1080x1920) or `slide-01.png`... (1080x1350). Image paths in the spec are
relative to the spec file. `|` breaks a line.

### Reel cover spec

```json
{"kind": "reel", "style": "r1", "hook": "Can you be|too precise?", "image": "frame.jpg", "focus": "50% 30%"}
{"kind": "reel", "style": "r2", "kicker": "Engineering / Pilates", "hook": "Perfect engine.|Slower car.", "image": "frame.jpg"}
{"kind": "reel", "style": "r1", "hook": "Green ran|heaviest.", "svg": "<svg ...>"}
{"kind": "reel", "style": "r1", "hook": "...", "image": "chart.png", "graphic": true}
```

Pick a video frame with no burned-in caption. `focus` is the CSS
object-position of the photo crop.

### Carousel spec

```json
{"kind": "carousel", "handle": "@kaleenc_", "slides": [
  {"type": "hook", "kicker": "Same springs / Different load", "title": "Every cue I used failed.", "sub": "Then I added a spring."},
  {"type": "story", "title": "Headline line.", "body": "Supporting sentence."},
  {"type": "list", "items": [["Cue 01", "“Rock your pelvis.”"]], "title": "Nothing landed."},
  {"type": "figure", "title": "Torque = force × distance", "svg": "<svg ...>", "fig": 2, "caption": "..."},
  {"type": "data", "kicker": "...", "title": "...", "specs": [["130 lb body", "227 lb-in"]], "result": "[[92% more]] load at the hip."},
  {"type": "equation", "kicker": "Momentum", "terms": [["p", "Momentum"], ["m", "Mass"], ["v", "Velocity"]], "ops": ["=", "×"], "body": "..."},
  {"type": "close", "title": "Closing line.", "kicker": "Program with Purpose / Starts Dec 7", "cta": "Comment", "keyword": "PURPOSE"}
]}
```

`figure` takes inline `svg` or an `image` (photo or chart PNG). `data` takes up
to four label/value pairs. Full worked examples are in `samples/`.
