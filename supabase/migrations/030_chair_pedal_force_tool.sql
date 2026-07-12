-- ============================================================
-- Pilates Physics: Chair pedal-force animation tool
-- Adds the interactive chair pedal-force model (how much of the
-- spring force the pedal delivers to the body across its arc, and
-- where the vertical lift peaks) as an assignable tool.
-- ============================================================

insert into public.webinars (slug, title, subtitle, description, status, kind, price_cents)
values
  (
    'animation-chair-pedal-force',
    'Force a Chair Pedal Delivers Through Its Arc',
    'How much of a spring''s pull actually reaches the body, and where the lift peaks, as the pedal sweeps its arc',
    'Interactive tool exploring how the force a Pilates chair pedal delivers to the body changes across its travel. It projects the spring force onto the pedal''s direction of travel to show the delivered (tangential) force, its vertical and horizontal components, and the portion lost into the hinge, with adjustable arm length, spring mount, rest length, spring constant, and initial tension so the vertical-force peak updates live.',
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
