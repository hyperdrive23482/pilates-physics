-- ============================================================
-- Pilates Physics: Feet-in-straps hip-torque animation tool
-- Adds the reformer feet-in-straps hip-torque interactive as
-- an assignable tool alongside the others.
-- ============================================================

insert into public.webinars (slug, title, subtitle, description, status, kind, price_cents)
values
  (
    'animation-feet-in-straps-hip-torque',
    'Hip Torque in Reformer Feet in Straps',
    'How hip-joint torque responds to thigh length, body weight, spring choice, and hip angle',
    'Interactive tool exploring how clockwise (rope, flexion) and counter-clockwise (gravity plus rope, extension) torque at the hip joint change with thigh length, body weight, Balanced Body spring selection, and hip angle in the reformer feet-in-straps exercise.',
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
