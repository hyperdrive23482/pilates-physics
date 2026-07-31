-- ============================================================
-- Pilates Physics: Instagram Graph API connection
--
-- Holds the single OAuth connection to the Instagram professional
-- account, plus sync bookkeeping. One row, enforced by a boolean
-- primary key that can only ever be true.
--
-- SECURITY: this table stores a live access token. RLS is enabled
-- with NO policies on purpose — that denies every anon and
-- authenticated request, including Kaleen's own admin JWT. Only the
-- service role key (which bypasses RLS) can read it, so the token
-- is reachable from server-side API routes and nowhere else. Do not
-- add an is_admin() policy here; it would expose the token to the
-- browser.
-- ============================================================

create table public.instagram_connection (
  -- Singleton: `check (id)` means the only legal value is true,
  -- so a second row is impossible.
  id boolean primary key default true check (id),

  ig_user_id text,
  username text,

  -- Long-lived token, 60 day lifetime, refreshed by cron
  access_token text,
  token_expires_at timestamptz,
  token_refreshed_at timestamptz,

  -- CSRF guard for the OAuth round trip. Written when the admin
  -- requests an authorize URL, verified and cleared on callback.
  pending_state text,
  pending_state_at timestamptz,

  -- Sync bookkeeping
  last_synced_at timestamptz,
  last_sync_error text,
  synced_media_count int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.instagram_connection enable row level security;
-- Intentionally no policies. See SECURITY note above.

create trigger tg_instagram_connection_updated_at
  before update on public.instagram_connection
  for each row execute function public.touch_updated_at();
