-- ============================================================
-- Pilates Physics: Bridge knee-torque animation tool
-- Adds the bridge press-out animation as an assignable tool
-- alongside the others seeded in 010_animation_tools.sql.
-- ============================================================

insert into public.webinars (slug, title, subtitle, description, status, kind, price_cents)
values
  (
    'animation-bridge-knee-torque',
    'Knee Torque vs. Spring Tension in a Bridge Press Out',
    'How spring tension and knee torque scale through the bridge press out',
    'Animation showing how spring tension and knee torque both scale with carriage extension during a bridge press out.',
    'complete',
    'tool',
    0
  )
on conflict (slug) do update
  set kind = 'tool',
      status = 'complete',
      title = excluded.title,
      subtitle = excluded.subtitle,
      description = excluded.description;
