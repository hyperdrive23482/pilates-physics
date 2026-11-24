# Kaleen Hub design system

The visual system for kaleencanevari.com, the personal hub that links to Pilates Physics, Remo and Hooke's Log. Internal name: **spec sheet**.

The idea: the page reads like an engineer's data sheet. Graph paper ground, navy ink, one technical blue, square corners, numbered sections and figure captions. Tagline: "Pilates, engineered."

Extracted 2026-11-23 from the working mockup, "Hub: spec sheet (working)", in the Kaleen Hub Page artifact (https://claude.ai/artifact/J72DLeeb4yHCbsWqVxiDzm, Hub layout page). The mockup is still being laid out, so treat section order as provisional and tokens as settled.

## Files

| File | What it is |
| --- | --- |
| `tokens.css` | CSS custom properties: color, type, space, borders. The source of truth. |
| `hub.css` | Component classes, all prefixed `hub-`. Needs `tokens.css`. |
| `tailwind.preset.js` | The same tokens as a Tailwind preset, for the kaleens-website repo. |
| `preview.html` | Specimen page. Open it in a browser to see every token and component. |

This folder lives in two repos (`pilates-physics/docs/kaleen-hub-design-system` and `kaleens-website/kaleen-hub-design-system`). The copies are identical. When you change one, copy it to the other.

## Setup

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap">
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="hub.css">
<body class="hub-page"><div class="hub-container">...</div></body>
```

With Tailwind, add the preset instead and use `bg-hub-bg`, `text-hub-ink`, `font-hub-head`, `text-hub-h1`, `border-hub`, `bg-hub-grid bg-[length:24px_24px]` and so on.

## Color

| Token | Hex | Use |
| --- | --- | --- |
| `--hub-bg` | `#F5F4EF` | Page ground, under the grid |
| `--hub-grid` | `rgba(20,33,61,0.06)` | Grid lines, 1px, every 24px |
| `--hub-ink` | `#14213D` | Headings, borders, primary button, navy band |
| `--hub-muted` | `#3B4660` | Body copy and captions |
| `--hub-label` | `#5A6480` | Small uppercase labels inside white panels |
| `--hub-accent` | `#1D4ED8` | Kickers, figure numbers, link hovers, chart line |
| `--hub-panel` | `#FFFFFF` | Cards, inputs, photo frames |
| `--hub-rule` | `#C3C7D2` | Dividers between rows on the ground |
| `--hub-rule-faint` | `#D5D8E0` | Dividers and chart gridlines inside panels |
| `--hub-on-ink-muted` | `#C5CBDA` | Secondary text on navy |

Rules:

- The grid is one even weight all the way across. No heavier line every fifth box.
- Blue is a pointer, not a fill. Use it for small text and thin lines. Buttons are navy.
- One navy band per page, at most. It is the only inverted block.
- No gradients, no shadows, no tints of the accent.

## Type

| Role | Family | Weight | Size | Tracking | Line height |
| --- | --- | --- | --- | --- | --- |
| H1 | Space Grotesk | 700 | clamp(46px, 6.6vw, 82px) | -0.045em | 0.98 |
| H2 | Space Grotesk | 700 | clamp(28px, 3.4vw, 38px) | -0.03em | 1.12 |
| H3, card name | Space Grotesk | 700 | 26px | -0.03em | 1.2 |
| Post title | Space Grotesk | 600 | 24px | -0.025em | 1.2 |
| Lede | IBM Plex Sans | 400 | 19px | 0 | 1.55 |
| Body | IBM Plex Sans | 400 | 16px | 0 | 1.65 |
| Small | IBM Plex Sans | 400 | 15px | 0 | 1.5 |
| Spec value | IBM Plex Sans | 600 | 17px | 0 | normal |
| Wordmark, section head | IBM Plex Mono | 500 | 14px, uppercase | 0.08em | normal |
| Kicker | IBM Plex Mono | 400 | 13px, uppercase | 0.08em | normal |
| Nav, mono link | IBM Plex Mono | 400 | 13px | 0.04em | normal |
| Caption | IBM Plex Mono | 400 | 12px | 0.04em | normal |
| Label | IBM Plex Mono | 400 | 11px, uppercase | 0.1em | normal |

Rules:

- Space Grotesk is for headings only, bold, sentence case, tight tracking.
- Plex Mono is the "instrument" voice: anything that names, numbers or labels. Never for paragraphs.
- Plex Sans carries everything a person reads for more than a line.
- Keep body lines under about 680px, ledes under 460px.

## Line, shape and space

- Borders are `1.5px solid` navy. Internal dividers are `1px` in a rule color.
- Corners are square. No border radius anywhere, including buttons and inputs.
- Panels are white with a navy border and no shadow.
- Spacing runs on multiples of 4. Sections are separated by 56 to 72px, cards are padded 28px, the grid cell is 24px.
- Content width is 1152px with a 16px gutter. Layouts wrap with flex and auto-fit grids, so there are almost no breakpoints.
- Tap targets are at least 44px tall. Text links get `padding: 12px 0`.

## Components

All of these are in `hub.css` and shown in `preview.html`.

- **Header** (`hub-header`, `hub-wordmark`, `hub-nav`): mono wordmark left, numbered nav right, outlined Subscribe button, navy rule underneath.
- **Kicker** (`hub-kicker`): blue mono line above a heading. Slashes separate items, as in "Physics / Equipment / Technology".
- **Section head** (`hub-section-head`): mono, uppercase, numbered ("01 Writing"), over a navy rule. Optional mono link on the right.
- **Buttons** (`hub-btn`, `--outline`, `--small`): navy fill for the main action, white with navy border for the second. Mono label. 50px tall.
- **Signup form** (`hub-form`, `hub-input`): input and button sit flush with no gap. Placeholder is `you@studio.com`.
- **Figure** (`hub-figure`): photo or chart inside a white frame with 10px padding (20px for charts), then a mono caption with a blue "Fig. N".
- **Spec strip** (`hub-spec-strip`, `hub-spec`): one white panel of label-over-value pairs. Use for credentials and facts, four at most.
- **Writing row** (`hub-post-row`): blue topic tag in a 130px column, post title, one-line summary, arrow. Rows are divided by a grey rule.
- **Project card** (`hub-card`): ID line ("P-01 / LEARN"), name, one-line description, domain link in blue.
- **Navy band** (`hub-band`): the closing signup. White heading, inverted input and button.
- **Footer** (`hub-footer`): mono, one line, product links.

## Charts and photos

- Charts: navy axes at 1.5px, faint grey gridlines, one blue data line at 3px with round caps, white-filled blue markers, dashed navy droplines, mono labels. Axis titles in uppercase mono. One series per chart where possible.
- Photos: full color, cropped with `object-fit: cover`, always inside a white frame. Every photo and chart gets a "Fig. N" caption. Captions can be dry.

## Voice

- First person, plain, specific. Lead with what was measured or built.
- No em dashes. Use periods or commas.
- "Spring weight" means the spring. "Load" means what the body feels. Keep both, do not swap them.
- Never punch down at teachers. The gap is in what teachers were given, not in the teachers.

## Accessibility

- Ink, muted and label colors all pass 4.5:1 on both the ground and white panels. Accent blue passes on both.
- Visible focus ring: 2px accent outline, 2px offset (white on the navy band). This was added for the system. The mockup did not have one.
- Inputs keep a real `<label>`, hidden with `hub-vh` when the design has no visible one.

## Not part of the system yet

These were explored and parked. Do not add them without a decision.

- Dimension lines on hover over project cards.
- Engineering title block footer.
- Blueprint mode toggle (navy-blue ground, white grid, cyanotype photos).
- A blueprint theme for the Pilates Physics homepage. That is a separate mockup and a separate site with its own fonts.

## Placeholder copy to confirm

The mockup contains copy that was drafted, not approved: the bio, the chart heading and paragraph, the Fig. 1 caption, the Equipment and Technology post titles, and the three product descriptions. The class names do not depend on any of it.
