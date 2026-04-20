-- ============================================================
-- Pilates Physics: Tools kind column
-- Introduces a `kind` discriminator on webinars so the portal
-- can surface interactive tools alongside webinars without
-- forking the entitlement system.
-- ============================================================

alter table public.webinars
  add column if not exists kind text not null default 'webinar'
  check (kind in ('webinar', 'tool'));

-- Seed the Spring Load Calculator as the first tool.
-- status='complete' keeps it out of the Upcoming/Past buckets;
-- the dashboard renders tools in a dedicated section by `kind`.
insert into public.webinars (slug, title, subtitle, description, status, kind, price_cents)
values (
  'spring-load-calculator',
  'Spring Load Calculator',
  'Visualize and compare Reformer spring loads across brands',
  'Interactive tool for calculating real spring force across Reformer brands. Stack multiple springs, compare side-by-side, or drag to read the load at any extension.',
  'complete',
  'tool',
  0
)
on conflict (slug) do update
  set kind = 'tool',
      subtitle = excluded.subtitle,
      description = excluded.description;
