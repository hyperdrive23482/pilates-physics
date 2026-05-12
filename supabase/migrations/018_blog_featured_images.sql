-- ============================================================
-- Blog featured images: public storage bucket + columns
--
-- The blog-images bucket is PUBLIC (world-readable). Use it only
-- for marketing/blog imagery — never PII or private assets.
--
-- Object paths: blog/{piece_id}/{timestamp}-{filename}
-- ============================================================

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

-- Admins: full write on blog-images
create policy "Admins upload blog images"
  on storage.objects for insert
  with check (bucket_id = 'blog-images' and public.is_admin());

create policy "Admins update blog images"
  on storage.objects for update
  using (bucket_id = 'blog-images' and public.is_admin())
  with check (bucket_id = 'blog-images' and public.is_admin());

create policy "Admins delete blog images"
  on storage.objects for delete
  using (bucket_id = 'blog-images' and public.is_admin());

-- Public reads (blog visitors load images directly via the public URL)
create policy "Public reads blog images"
  on storage.objects for select
  using (bucket_id = 'blog-images');

-- Featured image columns on blog_posts (public-facing) and
-- content_pieces (editorial pipeline that feeds blog_posts).
alter table public.blog_posts
  add column if not exists featured_image_url text,
  add column if not exists featured_image_alt text;

alter table public.content_pieces
  add column if not exists featured_image_url text,
  add column if not exists featured_image_alt text;
