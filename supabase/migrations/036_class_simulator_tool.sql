-- ============================================================
-- Pilates Physics: Class Simulator tool
-- Configure up to 4 students (height, weight, body type) and walk
-- through reformer exercises, toggling springs and equipment
-- variations per student to compare load scenarios side by side.
-- ============================================================

insert into public.webinars (slug, title, subtitle, description, status, kind, price_cents)
values (
  'class-simulator',
  'Class Simulator',
  'See how the same exercise loads different bodies',
  'Set up a class of up to four students with their own height, weight, and body type, then step through reformer exercises. Toggle springs, footbar height, and strap grip per student to see how the load scenario changes for each body on the same exercise.',
  'complete',
  'tool',
  0
)
on conflict (slug) do update
  set kind = 'tool',
      title = excluded.title,
      subtitle = excluded.subtitle,
      description = excluded.description,
      status = excluded.status;
