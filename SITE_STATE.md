# SITE_STATE.md — Pilates Physics

Last updated: 2026-03-26 (rev 2)

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
**Status: Functional shell, placeholder lesson content**
- Protected route — shows `CourseGate` if unauthenticated
- Top bar with overall progress display
- Sidebar with module/lesson navigation, per-module progress
- Lesson content area with mark-complete button + prev/next nav
- Mobile sidebar via hamburger menu
- URL state via search params (`?m=m1&l=m1-l1`)
- 4 modules defined in `courseData.js` — current data defines 6 lessons per module (24 total) but Module 1 has been finalized as 4 lessons + 1 quiz (see Course Data Structure below)
- **Lesson body text is placeholder** — contextually relevant to Pilates mechanics but not final copy
- `AnimationSlot` component renders "Loading…" — no interactive diagrams yet

---

## Course Data Structure

**File:** `src/utils/courseData.js`

Lessons are keyed by module and lesson ID strings. The expected format for Module 1 based on the content brief is:
```js
{
  id: 'm1-l1',
  title: 'Springs 101',
  moduleId: 'm1',
  hasAnimation: true,
}
```

**Known mismatch:** The current `courseData.js` defines 6 lessons per module (24 total). Module 1 is now 4 lessons + 1 quiz = 5 items. The data file needs to be updated to match the finalized lesson structure in `MODULE_1_CONTENT.md` before lesson content is populated. Do not add content to the old 6-lesson structure.

**Correct Module 1 lesson IDs:**
- `m1-l1` — Springs 101
- `m1-l2` — Spring Design Basics
- `m1-l3` — Spring Wear and Lifespan
- `m1-l4` — Real World Spring Comparisons
- `m1-quiz` — Assessment Quiz

---

## Lesson Content Format

Lesson body text is currently stored as placeholder strings in `LessonContent.jsx` or equivalent. For Module 1, real content should be structured as prose HTML or JSX — not a flat string and not bullet lists (except the five definition-list items in Lesson 2).

The intended rendering pattern per lesson:
- Section headings as `<h3>` declarative statements
- Body copy as `<p>` paragraphs
- The five k/b factor items in Lesson 2 as `<dl>` / `<dt>` / `<dd>` or equivalent bold-term + em-dash pattern
- Visual slots as `<img>` (static images) or `<AnimationSlot>` (interactive HTML files)
- F = kx + b equation rendered with k, x, b in `<em>` or monospace — not plain text

All finalized copy is in `MODULE_1_CONTENT.md` in the project root.

---

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
- Module unlocking: sequential (M2 requires all M1 lessons complete, etc.)
- No server-side persistence — progress is lost if localStorage is cleared or user switches devices

---

## Interactive Diagrams / Animations

**Status: Stubbed**

`AnimationSlot.jsx` exists as a placeholder component (renders "Loading…"). Lesson titles reference intended interactive content (e.g., "Spring Load vs. Constant Weight", "Height and Spring Load") but no actual diagram implementations exist.

---

## Animation Embedding

Three standalone HTML animation files have been built for Module 1:

| File | Lesson | Description |
|------|--------|-------------|
| `spring-animation.html` | m1-l1 | Spring load vs. constant weight |
| `tall-short-animation.html` | m1-l1 | Tall vs. short client carriage comparison |
| `elastic-plastic-animation.html` | m1-l3 | Elastic vs. plastic deformation |

**Intended location in repo:** `/public/animations/`

**Embedding approach:** `AnimationSlot.jsx` should render an `<iframe>` with `src` pointing to the animation file, `width="100%"`, `height` set per animation, no border, `scrolling="no"`. The component receives a `lessonId` prop and maps it to the correct file.

Suggested height values:
- `spring-animation.html` — 520px
- `tall-short-animation.html` — 580px
- `elastic-plastic-animation.html` — 480px

Static image slots use a plain `<img>` tag — not `AnimationSlot`.

---

## Static Image Assets — Module 1

Five image assets are required for Module 1 lesson content. These do not yet exist in the repo.

**Intended location:** `/public/images/module1/`

| Filename (suggested) | Used in | Description |
|----------------------|---------|-------------|
| `bb-spring-graph.png` | Lessons 1 and 2 | Balanced Body multi-spring load curve graph |
| `spring-coil-factors.png` | Lesson 2 | Coil length, diameter, wire diameter, end geometry diagram |
| `spring-engineering-drawing.png` | Lesson 2 | Example spring spec / engineering drawing |
| `cross-brand-light-springs.png` | Lesson 4 | Light springs load curves across BB, STOTT, Peak, Align |
| `cross-brand-heavy-springs.png` | Lesson 4 | Heavy springs load curves across BB, STOTT, Peak, Align |

Until these assets are added, render a placeholder `<div>` with a light border and the filename as a label — do not leave empty space or throw an error.

---

## Deviations from Build Phases

| Phase | Planned | Actual |
|-------|---------|--------|
| Phase 1 | Setup, routing, global styles, Navbar, Footer, stubs | ✅ Complete |
| Phase 2 | Landing page (static) | ✅ Complete |
| Phase 3 | About page | ✅ Complete |
| Phase 4 | Course portal shell | ✅ Complete (placeholder lesson copy) |
| Phase 5 | Course gate + ConvertKit | ⚠️ Gate works via Supabase auth (email+password & magic link); full login/signup/forgot-password/set-password flow built; ConvertKit not integrated |
| Phase 6 | Polish (animations, mobile, micro) | ⚠️ Mobile responsive done; animations not started |

**Key deviation:** Auth was implemented with full Supabase email+password and magic link flows (login, signup, forgot password, set password pages) rather than a simple localStorage email gate. This is significantly stronger than originally scoped but means the site depends on a live Supabase project.

---

## External Dependencies

| Service | Purpose | Status |
|---------|---------|--------|
| Supabase | Auth (magic link) | Live — project `ngbwyarbxnyfmdeyvlsd` |
| ConvertKit | Email list capture | Not connected |
| Substack | Linked from About page | External link only |
| Instagram | Linked from About page | External link only |

---

## Deployment

**No deployment config exists.** No `vercel.json`, `.netlify.toml`, GitHub Actions, or Docker files. The `/dist` build output exists locally. The app is a static SPA ready for any static host — just needs env vars set.

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
