import { supabaseAdmin } from './supabase-admin.js'

// The first free slug in `base`, `base-2`, `base-3`, ...
//
// Shared by the two places a blog post is born: approving a content piece and
// the "New post" button on the admin blog list. The unique constraint on
// blog_posts.slug is still the real guard; this only picks a name that is
// unlikely to hit it.
export async function reserveUniqueBlogSlug(baseSlug) {
  let slug = baseSlug
  let n = 2
  while (true) {
    const { data: existing } = await supabaseAdmin
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!existing) return slug
    slug = `${baseSlug}-${n++}`
    if (n > 200) return slug
  }
}
