# SITE_STATE.md — Pilates Physics

Last updated: 2026-03-30 (rev 3)

---

## Built Pages

### `/` — Landing Page
**Status: Complete**
- Hero with custom spring force SVG diagram
- "The Problem" section (2-column layout)
- "What This Course Does" — 3 value cards
- Module preview grid (4 modules; M2–M4 show "Coming Soon" badge)
- Repeating email capture CTA
- Fully responsive (breakpoints at 900px, 768px, 540px)
- All copy is real (no lorem ipsum)

### `/about` — About Page
**Status: Complete**
- Kaleen's bio with two real photos (`/public/images/about/`)
- "Why Pilates Physics" section
- "Tools I've Built" — Remo & Motra with external links
- "Connect with Kaleen" — Substack & Instagram links
- CTA strip linking to course
- Responsive grid

### `/course` — Course Portal
**Status: Module 1 fully built; Modules 2–4 placeholder content**
- Protected route — shows `CourseGate` if unauthenticated
- Top bar with overall progress display
- Sidebar with module/lesson navigation, per-module progress
- Multi-page lesson system with Previous/Next navigation and page indicators (e.g. "3 / 7")
- Mark-complete button on final page of each lesson (not shown on intro/summary pages)
- Mobile sidebar via hamburger menu
- URL state via search params (`?m=m1&l=m1-l1`)
- 4 modules defined in `courseData.js` (see Course Data Structure below)
- Module 1: all 8 lessons have full, real content with rich formatting, images, and animations
- Modules 2–4: brief placeholder content (2–3 sentence topic summaries)
- `AnimationSlot` component fully implemented — renders iframes for mapped animations, fallback placeholder for unmapped IDs

### `/login` — Login Page
**Status: Complete**
- Email + password sign-in form
- Show/hide password toggle (eye icon)
- "Forgot password?" link to `/forgot-password`
- Link to `/signup` for new users

### `/signup` — Signup Page
**Status: Complete**
- Registration form: first name, last name, email
- On submit, creates Supabase user and shows "check your email" confirmation
- Link back to `/login` for existing users

### `/forgot-password` — Forgot Password Page
**Status: Complete**
- Email input to request password reset
- Success state shows "check your inbox" message

### `/set-password` — Set Password Page
**Status: Complete**
- Password + confirm password fields with show/hide toggles
- Validation (match check)
- Used after clicking email confirmation / reset link

### `/auth/callback` — Auth Callback
**Status: Complete**
- Receives Supabase magic link / email confirmation redirect
- Waits for session, then redirects to `/course`

---

## Course Data Structure

**File:** `src/utils/courseData.js`

### Module 1: Spring Basics (m1) — 8 lessons
| ID | Title | Type |
|----|-------|------|
| `m1-intro` | Meet Your Instructor | Intro (no animation) |
| `m1-overview` | Module Overview | Intro (no animation) |
| `m1-l1` | Springs 101 | Lesson (has animation) |
| `m1-l2` | Spring Design Basics | Lesson |
| `m1-l3` | Spring Wear and Lifespan | Lesson (has animation) |
| `m1-l4` | Real World Spring Comparisons | Lesson |
| `m1-quiz` | Assessment Quiz | Assessment |
| `m1-summary` | Module Complete | Summary |

### Module 2: Springs, Settings, and Bodies (m2) — 5 lessons, requires m1
| ID | Title | Notes |
|----|-------|-------|
| `m2-l1` | Height and Spring Load | has animation flag |
| `m2-l2` | Body Weight, Friction, and Gravity | |
| `m2-l3` | Rope Adjustments | |
| `m2-l4` | Supportive vs Resistive Spring Behavior | |
| `m2-quiz` | Assessment Quiz | |

### Module 3: The Physics of Different Movement (m3) — 5 lessons, requires m2
| ID | Title |
|----|-------|
| `m3-l1` | Force Vectors |
| `m3-l2` | Standing vs Seated Reformer |
| `m3-l3` | Pulley Height |
| `m3-l4` | Plank/Pike |
| `m3-quiz` | Assessment Quiz |

### Module 4: Advanced Physics Portal (m4) — 3 lessons, always open (self-directed)
| ID | Title |
|----|-------|
| `m4-l1` | Angular Velocity |
| `m4-l2` | Chair Physics |
| `m4-l3` | Cadillac Physics |

---

## Lesson Content Format

**File:** `src/components/course/LessonContent.jsx` (~1,696 lines)

Module 1 lessons use a multi-page array structure where each page is a render function. Custom components used throughout:

- **Eyebrow** — small label above section titles
- **SectionTitle** — styled `<h3>` headings
- **Prose** — wrapper for body paragraphs
- **V** — styled inline variable (e.g., k, x, b)
- **EquationBlock** — formatted equation display (F = kx + b)
- **DefRow** — definition list row (bold term + em-dash + description)
- **LessonImage** — `<img>` wrapper for static images from `/public/images/module1/`
- **QuizQuestion** — multiple-choice quiz component
- **NavBtn** — previous/next page navigation

Modules 2–4 use a flat `placeholderContent` object with short topic summaries rendered as single-page lessons.

---

## Interactive Animations

**Status: Fully implemented for Module 1**

### Animation Files (`/public/animations/`)

| File | Size | Lesson | Description |
|------|------|--------|-------------|
| `spring-animation.html` | 20.2 KB | m1-l1 | Spring load vs. constant weight |
| `tall-short-animation.html` | 18.6 KB | m1-l1 | Tall vs. short client carriage comparison |
| `elastic-plastic-animation.html` | 13.0 KB | m1-l3 | Elastic vs. plastic deformation |

### AnimationSlot Component (`src/components/course/AnimationSlot.jsx`)

- Maps animation IDs to HTML file sources:
  - `m1-l1-spring` → `spring-animation.html`
  - `m1-l1-tall-short` → `tall-short-animation.html`
  - `m1-l3` → `elastic-plastic-animation.html`
- Renders as `<iframe>` with dynamic height adjustment via `useEffect` and resize handling
- Lazy loading enabled
- Graceful cross-origin error handling
- Unmapped animation IDs render a dashed-border placeholder div

---

## Static Image Assets — Module 1

**Location:** `/public/images/module1/`

**12 image files present:**

| Filename | Used in |
|----------|---------|
| `bb-spring-graph.png` | Lessons 1 and 2 |
| `spring-coil-factors.png` | Lesson 2 |
| `spring-engineering-drawing.png` | Lesson 2 |
| `cross-brand-light-springs.png` | Lesson 4 |
| `cross-brand-heavy-springs.png` | Lesson 4 |
| `example-spring-1.png` | Lesson content |
| `example-spring-2.png` | Lesson content |
| `example-spring-3.png` | Lesson content |
| `example-spring-4.png` | Lesson content |
| `example-spring-5.png` | Lesson content |
| `bad-springs-1.jpg` | Lesson 3 |
| `bad-springs-2.jpg` | Lesson 3 |

All images are rendered via the `<LessonImage>` component.

---

## Stub / Missing Pages

These are linked in the Navbar or Footer but have **no route or component**:

| Link        | Location   | Status     |
|-------------|------------|------------|
| `/contact`  | Footer     | No component |
| `/terms`    | Footer     | No component |
| `/privacy`  | Footer     | No component |
| `/help`     | Footer     | No component |

---

## Authentication

| Aspect | Detail |
|--------|--------|
| Provider | Supabase Auth |
| Methods | Email + password (primary); Magic link (passwordless OTP via email) |
| Client | `src/lib/supabase.js` — initialized with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| Hook | `src/hooks/useEnrollment.js` — manages auth state, sign in/up/out, password reset |
| Pages | `/login`, `/signup`, `/forgot-password`, `/set-password` |
| Gate | `src/components/course/CourseGate.jsx` — prompts signup/login when `!user` |
| Callback | `src/pages/AuthCallback.jsx` — handles email confirmation / magic link redirect |
| Redirect URI | `${window.location.origin}/auth/callback` |
| Session | Supabase handles session persistence via cookies/localStorage |

### Auth Flows
- **Sign up:** `/signup` → enter name + email → confirmation email sent → click link → `/auth/callback` → `/set-password` → `/course`
- **Sign in:** `/login` → enter email + password → redirect to `/course`
- **Forgot password:** `/forgot-password` → enter email → reset email sent → click link → `/set-password`
- **Magic link:** Enter email → link sent → click → `/auth/callback` → session → `/course`

### useEnrollment Hook API
- `user` — Supabase user object or null
- `loading` — boolean
- `signUp(email, firstName, lastName)` — create account (triggers confirmation email)
- `signIn(email, password)` — traditional login
- `setPassword(password)` — set/update password (post-confirmation)
- `resetPasswordRequest(email)` — initiate password reset
- `signOut()` — log out

---

## Email Capture

**Status: Simulated — ConvertKit not wired**

`EmailCapture.jsx` and `CourseGate.jsx` both collect emails but **do not send them anywhere**. The component simulates a 600ms delay and stores enrollment state in localStorage (`pp_enrolled: true`). A code comment notes ConvertKit integration is planned for Phase 5.

Environment variables `VITE_CONVERTKIT_FORM_ID` and `VITE_CONVERTKIT_API_KEY` are referenced in project docs but not consumed by any component.

---

## Progress Tracking

**Status: Fully functional, client-side only**

- Hook: `src/hooks/useCourseProgress.js`
- Storage: localStorage key `pp_progress_${userId}`
- Module unlocking: sequential (M2 requires all M1 lessons complete, etc.; M4 is always open)
- No server-side persistence — progress is lost if localStorage is cleared or user switches devices

---

## Deployment

**Status: Configured for Vercel**

`vercel.json` exists with SPA rewrite configuration:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

The app is a static SPA. No GitHub Actions, Docker, or other CI/CD files.

---

## Deviations from Build Phases

| Phase | Planned | Actual |
|-------|---------|--------|
| Phase 1 | Setup, routing, global styles, Navbar, Footer, stubs | Complete |
| Phase 2 | Landing page (static) | Complete |
| Phase 3 | About page | Complete |
| Phase 4 | Course portal shell | Complete — full multi-page lesson system built |
| Phase 5 | Course gate + ConvertKit | Gate works via Supabase auth; ConvertKit not integrated |
| Phase 6 | Polish (animations, mobile, micro) | Mobile responsive done; 3 animations built and embedded for M1 |
| — | Module 1 content | Complete — all 8 lessons with full copy, images, animations, quiz |
| — | Modules 2–4 content | Placeholder only |
| — | Vercel deployment config | Added (`vercel.json`) |

**Key deviation:** Auth was implemented with full Supabase email+password and magic link flows rather than a simple localStorage email gate. Module 1 content was fully authored with rich multi-page lessons, which was not part of the original phase plan.

---

## External Dependencies

| Service | Purpose | Status |
|---------|---------|--------|
| Supabase | Auth (magic link) | Live — project `ngbwyarbxnyfmdeyvlsd` |
| ConvertKit | Email list capture | Not connected |
| Substack | Linked from About page | External link only |
| Instagram | Linked from About page | External link only |

---

## Tech Stack Summary

- Vite 6.4 + React 19.2 (plain JSX, no TypeScript)
- Tailwind CSS 4.2 (`@theme {}` in CSS, not `tailwind.config.js`)
- `@tailwindcss/vite` plugin
- React Router 7.13
- Framer Motion 12.36
- Lucide React icons
- Supabase JS client
- Dark theme by default — bg `#1C1A17`, accent gold `#EF9F27`
- Fonts: DM Serif Display (headings), DM Sans (body)

**Tailwind version note:** This project uses Tailwind CSS v4. Theme configuration is defined via `@theme {}` blocks in CSS files — there is no `tailwind.config.js`. Do not attempt to create or reference a `tailwind.config.js`. All custom tokens (colors, fonts, spacing) live in the CSS theme block. When adding new styles, follow the existing `@theme {}` pattern.
