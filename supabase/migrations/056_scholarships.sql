-- ============================================================
-- Pilates Physics: Scholarships
--
-- Discounted access to PP-101, PP-102 ($19) and How a Reformer Works ($9) for
-- people who have been historically marginalized in Pilates and fitness
-- spaces. The flow:
--
--   1. /scholarship posts to /api/inquiry (kind: scholarship), which stores a
--      scholarship_applications row and emails Kaleen.
--   2. Kaleen approves in /admin/scholarships. That mints one single-use
--      Stripe promotion code per course (30-day expiry) and emails them.
--   3. The applicant buys through the normal checkout with the code.
--      provisionPurchase sees the scholarship coupon on the session and
--      writes a scholarship_enrollments row.
--
-- All three tables are admin-only. The student's own rows (user_entitlements)
-- carry nothing, so their account never shows them as a scholarship student.
-- ============================================================

create table public.scholarship_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  city text,
  -- Course keys from src/lib/scholarship.js: 'pp101', 'pp102', 'harw'.
  courses text[] not null,
  path_stage text not null,
  story text not null,
  teaching_impact text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined')),
  reviewed_at timestamptz,
  admin_notes text
);

create index idx_scholarship_applications_created
  on public.scholarship_applications (created_at desc);
create index idx_scholarship_applications_email
  on public.scholarship_applications (lower(email));

-- One row per Stripe promotion code minted on approval.
create table public.scholarship_codes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  application_id uuid not null references public.scholarship_applications(id) on delete cascade,
  course text not null,
  code text not null unique,
  stripe_promotion_code_id text not null unique,
  stripe_coupon_id text not null,
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  redeemed_email text,
  redeemed_user_id uuid references auth.users(id) on delete set null,
  stripe_session_id text
);

create index idx_scholarship_codes_application
  on public.scholarship_codes (application_id);

-- The label. One row per (user, course) bought on a scholarship, or granted
-- as one by hand. code_id is null for manual grants and for codes made
-- directly in the Stripe dashboard.
create table public.scholarship_enrollments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  webinar_id uuid not null references public.webinars(id) on delete cascade,
  code_id uuid references public.scholarship_codes(id) on delete set null,
  source text not null default 'stripe' check (source in ('stripe', 'manual')),
  amount_paid_cents integer,
  amount_discount_cents integer,
  stripe_session_id text,
  unique (user_id, webinar_id)
);

alter table public.scholarship_applications enable row level security;
alter table public.scholarship_codes enable row level security;
alter table public.scholarship_enrollments enable row level security;

-- Admin read only. Writes go through the service role in api/inquiry.js,
-- api/admin/scholarships.js and api/_lib/provision-purchase.js.
create policy "Admins read scholarship applications"
  on public.scholarship_applications for select
  using (public.is_admin());
create policy "Admins read scholarship codes"
  on public.scholarship_codes for select
  using (public.is_admin());
create policy "Admins read scholarship enrollments"
  on public.scholarship_enrollments for select
  using (public.is_admin());
