-- ============================================================
-- Pilates Physics: point blog "Springs 101" links at the calculator
--
-- The momentum and hamstrings/footwork posts closed with
-- "Start with [Springs 101](/springs-101)". Springs 101 is no longer
-- handed out and /springs-101 redirects to /spring-calculator, so the
-- link now says what it opens. 058 and 059 are updated to match, but
-- they insert with ON CONFLICT DO NOTHING, so rows that already exist
-- are fixed here. body_html is patched too, since BlogPost renders it
-- ahead of body_markdown.
--
-- Safe to re-run.
-- ============================================================

update public.blog_posts
   set body_markdown = replace(
         body_markdown,
         '[Springs 101](/springs-101)',
         '[the spring calculator](/spring-calculator)'
       ),
       body_html = replace(
         body_html,
         '<a href="/springs-101">Springs 101</a>',
         '<a href="/spring-calculator">the spring calculator</a>'
       )
 where slug in ('reformer-momentum-slow-vs-fast', 'hamstrings-footwork-carriage-return')
   and body_markdown like '%[Springs 101](/springs-101)%';
