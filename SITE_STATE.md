# SITE_STATE.md — Pilates Physics

Last updated: 2026-03-26

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
- 4 modules × 6 lessons = 24 lessons defined in `courseData.js`
- **Lesson body text is placeholder** — contextually relevant to Pilates mechanics but not final copy
- `AnimationSlot` component renders "Loading…" — no interactive diagrams yet

### `/auth/callback` — OAuth Callback
**Status: Complete**
- Receives Supabase magic link redirect
- Waits for session, then redirects to `/course`

---

## Stub / Missing Pages

These are linked in the Navbar or Footer but have **no route or component**:

| Link        | Location   | Status     |
|-------------|------------|------------|
| `/login`    | Navbar, Footer | No component |
| `/contact`  | Footer     | No component |
| `/terms`    | Footer     | No component |
| `/privacy`  | Footer     | No component |
| `/help`     | Footer     | No component |

---

## Authentication

| Aspect | Detail |
|--------|--------|
| Provider | Supabase Auth |
| Method | Magic link (passwordless OTP via email) |
| Client | `src/lib/supabase.js` — initialized with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| Hook | `src/hooks/useEnrollment.js` — manages auth state, calls `signInWithOtp()` |
| Gate | `src/components/course/CourseGate.jsx` — email form shown when `!user` |
| Callback | `src/pages/AuthCallback.jsx` — handles redirect from magic link |
| Redirect URI | `${window.location.origin}/auth/callback` |
| Session | Supabase handles session persistence via cookies/localStorage |

Flow: Enter email → magic link sent → click link → `/auth/callback` → session established → redirect to `/course`.

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

## Deviations from Build Phases

| Phase | Planned | Actual |
|-------|---------|--------|
| Phase 1 | Setup, routing, global styles, Navbar, Footer, stubs | ✅ Complete |
| Phase 2 | Landing page (static) | ✅ Complete |
| Phase 3 | About page | ✅ Complete |
| Phase 4 | Course portal shell | ✅ Complete (placeholder lesson copy) |
| Phase 5 | Course gate + ConvertKit | ⚠️ Gate works via Supabase magic link; ConvertKit not integrated |
| Phase 6 | Polish (animations, mobile, micro) | ⚠️ Mobile responsive done; animations not started |

**Key deviation:** Auth was implemented with Supabase magic link rather than a simple localStorage email gate. This is a stronger approach than originally scoped but means the site depends on a live Supabase project.

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
