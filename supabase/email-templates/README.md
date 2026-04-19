# Supabase auth email templates

Branded HTML for Supabase Auth's six email types. Source of truth lives here in the repo; the live copies are pasted into the Supabase dashboard.

## Setup checklist

### 1. Resend → Supabase SMTP

Supabase Dashboard → **Project Settings → Authentication → SMTP Settings** → toggle **Enable Custom SMTP**:

| Field | Value |
|---|---|
| Sender email | `noreply@mail.pilatesphysics.com` |
| Sender name | `Pilates Physics` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | *Resend API key (`re_…`)* |

Bump **Authentication → Rate Limits → Emails per hour** above the default 4.

### 2. Site URL & redirect allow-list

Supabase Dashboard → **Authentication → URL Configuration**:

- Site URL: `https://pilatesphysics.com`
- Redirect URLs: `https://pilatesphysics.com/auth/callback` and `http://localhost:5173/auth/callback`

### 3. Paste each template

Supabase Dashboard → **Authentication → Email Templates** → for each row below, select the template, paste the HTML body, set the subject, save.

| File | Template slot | Subject |
|---|---|---|
| `confirm-signup.html` | Confirm signup | `Confirm your Pilates Physics account` |
| `reset-password.html` | Reset password | `Reset your Pilates Physics password` |
| `change-email.html` | Change email address | `Confirm your new email for Pilates Physics` |
| `magic-link.html` | Magic link | `Your Pilates Physics sign-in link` |
| `invite.html` | Invite user | `You're invited to Pilates Physics` |
| `reauthentication.html` | Reauthentication | `Your Pilates Physics verification code` |

## Template variables (Supabase Go templating)

| Variable | Available in | Notes |
|---|---|---|
| `{{ .SiteURL }}` | all | Resolves to the Site URL configured above |
| `{{ .TokenHash }}` | all link templates | Used in the URL — verified by `verifyOtp({ token_hash, type })` |
| `{{ .Token }}` | reauth (and others) | 6-digit OTP — used in `reauthentication.html` |
| `{{ .Email }}` | all | Recipient address |
| `{{ .NewEmail }}` | change-email | The new address being confirmed |
| `{{ .ConfirmationURL }}` | all link templates | Default Supabase verification URL — **not used here**, we build the URL with `{{ .TokenHash }}` so the link lands on our app, not Supabase's verify endpoint |

## Why the URL pattern is `?token_hash=…&type=…`

`AuthCallback.jsx` (`src/pages/AuthCallback.jsx:25-34`) reads `token_hash` and `type` from the query string and calls `supabase.auth.verifyOtp({ token_hash, type })`. Building the URL ourselves rather than using `{{ .ConfirmationURL }}` skips the Supabase verify-then-redirect hop, keeping the link short and on our domain — better for inbox previews and spam scoring.

`type` per template:

| Template | type value |
|---|---|
| confirm-signup | `signup` |
| reset-password | `recovery` |
| change-email | `email_change` |
| magic-link | `magiclink` |
| invite | `invite` |

## Brand notes

Colors and fonts mirror `src/index.css:5-22`:

- Background `#1C1A17`, surface `#242118`, border `#2E2B26`
- Text `#F1EFE8`, muted `#888780`, dim `#5F5E5A`
- Accent (button) `#EF9F27` with `#1C1A17` text on top
- Headings: `DM Serif Display` → fallback Georgia
- Body: `DM Sans` → fallback `-apple-system`, Helvetica Neue, Arial
- Reauth code: `DM Mono` → fallback Consolas, Courier New

Web fonts load from Google Fonts via `<link>` — they render in Apple Mail / iOS Mail; Outlook and Gmail use the fallbacks (intentional, web fonts are unreliable in email).

## Editing

1. Edit the `.html` file in this directory.
2. Re-paste into the corresponding Supabase template slot.
3. Send a test (Supabase dashboard has a "Send test email" link beneath each template, or sign up with a throwaway address).

There is no automated sync — these change rarely.

## Verification after changes

1. **Resend logs** (Resend Dashboard → Emails) show `delivered`, not `bounced`.
2. **Render check**: send to inboxes you can view — Gmail web, Gmail mobile, Apple Mail. Confirm dark background, gold button.
3. **Link check**: clicking the button lands on `https://pilatesphysics.com/auth/callback?token_hash=…&type=…` and routes correctly (signup/invite → `/set-password` if `needs_password`, recovery → `/set-password`, magic link → `/portal`).
4. **Spam score** (optional): https://mail-tester.com — aim for 9+/10.
