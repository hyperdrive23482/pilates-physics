-- ============================================================
-- Pilates Physics: Reformer Force Modeler tool
-- Side-view kinematics + force modeler for the Reformer. Outputs
-- spring tension, rope angles, and force-vector decomposition.
-- v1 scope: see src/components/portal/reformer/README.md
-- ============================================================

insert into public.webinars (slug, title, subtitle, description, status, kind, price_cents)
values (
  'reformer-force-modeler',
  'Reformer Force Modeler',
  'Pose a body on a parametric reformer and read the forces',
  'Interactive 2D side-view modeler. Pose a stick figure on a parametric reformer, attach feet or hands to ropes, and see live spring tension, rope angles, and force-vector decomposition. Save poses as keyframes, scrub and play, export per-frame data.',
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
