-- ============================================================
-- Pilates Physics: Springs 101 lead magnet
-- Seeds the gated Springs 101 education page as a portal tool.
-- status='complete' + kind='tool' keeps it out of the public
-- Upcoming/Past workshop buckets; the portal dashboard renders
-- it under "Tools". kit_tag drives Kit tagging in /api/springs101,
-- mirroring how provisionPurchase reads kit_tag off the row.
-- ============================================================

insert into public.webinars (slug, title, subtitle, description, status, kind, price_cents, kit_tag)
values (
  'springs-101',
  'Springs 101',
  'The physics of Pilates springs, brand by brand',
  'A primer on how springs actually load the body: starting tension, rate, why colors are not a language, and illustrated spring lineups for every major brand.',
  'complete',
  'tool',
  0,
  'springs-101'
)
on conflict (slug) do update
  set kind = 'tool',
      status = 'complete',
      title = excluded.title,
      subtitle = excluded.subtitle,
      description = excluded.description,
      kit_tag = excluded.kit_tag;

-- Add 'lead_magnet' to the entitlement source CHECK so free
-- lead-magnet grants are distinguishable from paid rows in reporting.
alter table public.user_entitlements drop constraint if exists user_entitlements_source_check;
alter table public.user_entitlements
  add constraint user_entitlements_source_check
    check (source in ('manual', 'kit_tag', 'stripe', 'admin', 'bundle', 'bonus', 'lead_magnet'));
