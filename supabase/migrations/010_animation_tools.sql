-- ============================================================
-- Pilates Physics: Animation tools
-- Seeds the six private animations as portal tools so admins
-- can grant individual access via the existing user_entitlements
-- system. Each animation becomes its own assignable tool row.
-- ============================================================

insert into public.webinars (slug, title, subtitle, description, status, kind, price_cents)
values
  (
    'animation-spring',
    'Spring vs. Constant Resistance',
    'Visualize how spring force changes through extension',
    'Interactive animation comparing variable spring resistance against a constant load.',
    'complete',
    'tool',
    0
  ),
  (
    'animation-bicep-curl',
    'Bicep Curl: Spring vs. Dumbbell',
    'Compare spring and dumbbell loads through the curl arc',
    'Side-by-side animation of spring versus dumbbell force during a bicep curl.',
    'complete',
    'tool',
    0
  ),
  (
    'animation-bicep-curl-vertical',
    'Bicep Curl (Anatomical): Spring vs. Dumbbell',
    'Anatomical-orientation curl with spring vs. dumbbell load',
    'Animation showing spring vs. dumbbell loading through an anatomical bicep curl.',
    'complete',
    'tool',
    0
  ),
  (
    'animation-horizontal-spring-vertical-dumbbell',
    'Wall Spring vs. Hanging Dumbbell',
    'Load at the hand: horizontal spring vs. vertical dumbbell',
    'Animation comparing the load felt at the hand from a wall spring versus a hanging dumbbell.',
    'complete',
    'tool',
    0
  ),
  (
    'animation-tall-short',
    'Spring Extension: Tall vs. Short',
    'How body height affects spring load on the same setup',
    'Animation showing how a taller and shorter user experience different spring loads on the same configuration.',
    'complete',
    'tool',
    0
  ),
  (
    'animation-elastic-plastic',
    'Elastic vs. Plastic Deformation',
    'How materials bounce back — or don''t',
    'Animation contrasting elastic and plastic deformation behavior in materials.',
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
