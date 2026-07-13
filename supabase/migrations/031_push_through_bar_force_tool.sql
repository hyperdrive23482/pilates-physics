-- ============================================================
-- Pilates Physics: Push-through bar force animation tool
-- Adds the interactive push-through bar model (how much of the
-- spring force reaches the bar as it sweeps its full circle, the
-- delivered tangential force and its vertical share, with the
-- spring slack below its rest length) as an assignable tool.
-- ============================================================

insert into public.webinars (slug, title, subtitle, description, status, kind, price_cents)
values
  (
    'animation-push-through-bar-force',
    'Force a Push-Through Bar Delivers Around Its Arc',
    'How much of a canopy spring''s pull actually turns the push-through bar, and where it points, as the bar sweeps its full circle',
    'Interactive tool exploring how the force a reformer push-through bar receives from its canopy spring changes as the bar rotates a full 360 degrees. It projects the spring force onto the bar''s direction of travel to show the delivered (tangential) force and its vertical share, treats the spring as slack (zero force) below its 25 inch rest length, and offers adjustable pivot height, arm length, spring constant, and baseline tension along with a live readout of the bar''s angle and end height.',
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
