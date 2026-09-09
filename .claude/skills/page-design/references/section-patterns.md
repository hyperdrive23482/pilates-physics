# Section pattern catalog

Nine patterns cover every section on the site. Pick one, copy its markup, swap
the prefix for the page's own namespace. Class rules cited here are real; grep
them before relying on a detail.

Markup below uses the `workshop-` prefix because that namespace has the most
complete set. On Landing use the bare names, on the calculator page
`springs101-`, on About `about-`.

---

## Size reference

**Section heads.** All are `line-height: 1.04`, `letter-spacing: -0.012em`,
`font-weight: 400`.

| Class | Cap | Margin | Wrap |
|---|---|---|---|
| `workshop-why__head` | 64px | `18px 0 28px` | 26ch |
| `workshop-details__head` | 64px | `18px 0 32px` | none |
| `workshop-framework__head` | 72px | `18px 0 18px` | 24ch |
| `workshop-topics__title` | 72px | `18px 0 16px` | 22ch |
| `workshop-instructor__head` | 72px | `18px 0 12px` | none |
| `workshop-included__head` | 72px | `18px 0 40px` | 22ch |
| `workshop-testimonials__head` | 72px | `18px 0 40px` | none |
| `workshop-faq__head` | 72px | `18px 0 40px` | none |
| `workshop-cta__head` | 72px at 5vw | `24px 0 22px` | balanced |

The 18px top margin is the gap under the kicker. A heading missing it is
usually a wrapper class on the `<h2>`, see trap 1.

**Body copy.** `workshop-why__body` 18px / 60ch. `workshop-framework__lede`
18px / 62ch. `workshop-topics__lede` 18px / 60ch, `margin: 0 0 48px`.
`workshop-instructor__body p` 17px / 58ch. `workshop-faq__a` 17px / 64ch.

**Containers.** 1320px default, 1480px `--wide`, 980px `--narrow`.
**Padding.** `section-pad` 96/112, `section-pad-l` 132/144.

---

## 1. Hero

Full-bleed background photo behind a scrim, corner crosses, content capped at
820px. Used by PP101, PP102 and the course page.

```jsx
<section
  className="workshop-hero section-frame"
  style={{ '--workshop-hero-image': "url('/images/homepage/hero-image-5.jpg')" }}
>
  <span className="cross tl"></span>
  <span className="cross tr"></span>
  <div className="container">
    <div className="workshop-hero__inner">
      <div className="kicker">§ 01 · Page name</div>
      <h1 className="workshop-hero__title">
        Headline with <span className="italic accent">one accent.</span>
      </h1>
      <p className="workshop-hero__lede">Sub-head, 60ch.</p>
      <div className="workshop-hero__cta">
        <a href="#buy" className="btn btn--lg">Call to action<ArrowSvg /></a>
      </div>
      <p className="workshop-hero__meta">
        <span className="workshop-hero__meta-k">On demand</span>
        8 modules · 1 hour
      </p>
    </div>
  </div>
  <span className="cross bl"></span>
  <span className="cross br"></span>
</section>
```

The hero is the only section without `section--inset`, which is what makes the
banding alternate correctly from section two onward.

---

## 2. Prose section

A kicker, a heading and one paragraph. The simplest pattern and the easiest to
overuse. Two of these adjacent is the "sections look narrow" complaint.

```jsx
<section className="section-pad section--inset workshop-why">
  <div className="container">
    <div className="kicker">§ 02 · Section name</div>
    <h2 className="workshop-why__head">
      Headline with <span className="italic accent">one accent.</span>
    </h2>
    <p className="workshop-why__body">One paragraph, 60ch.</p>
  </div>
</section>
```

Used by PP101 § 02, PP102 § 02, the course page § 02 and § 07.

---

## 3. Card grid

Heading and lede in a wrapper, then two or three equal cards. `fcard` is the
shared card component.

```jsx
<section className="section-pad section--inset workshop-framework">
  <div className="container">
    <div className="workshop-framework__head-wrap">
      <div className="kicker">§ 03 · Section name</div>
      <h2 className="workshop-framework__head">
        Headline with <span className="italic accent">one accent.</span>
      </h2>
      <p className="workshop-framework__lede">Optional lede, 62ch.</p>
    </div>
    <div className="course-decisions">
      {ITEMS.map((i) => (
        <article className="fcard" key={i.label}>
          <div className="fcard__label mono accent">{i.label}</div>
          <h3 className="fcard__title">{i.title}</h3>
          <p className="fcard__body">{i.body}</p>
        </article>
      ))}
    </div>
  </div>
</section>
```

`course-decisions` is two-up, `course-decisions--three` is three-up, both
collapse at 860px (should be 1100px, see trap 7).
`workshop-framework__grid` and `workshop-included__grid` are three-up
equivalents in `Workshop.css`.

**Note the wrapper.** `workshop-framework__head-wrap` holds the kicker, heading
and lede. The heading is `workshop-framework__head`.

---

## 4. List or syllabus

A numbered list of rows separated by hairlines. Note the wrapper again.

```jsx
<section className="section-pad section--inset workshop-topics">
  <div className="container">
    <div className="workshop-topics__head">
      <div className="kicker">§ 04 · Section name</div>
      <h2 className="workshop-topics__title">
        Headline with <span className="italic accent">one accent.</span>
      </h2>
      <p className="workshop-topics__lede">Optional sub-line.</p>
    </div>
    <div className="course-modules">
      {ITEMS.map((m) => (
        <article className="course-module" key={m.n}>
          <div className="course-module__n mono accent">{m.n}</div>
          <div className="course-module__body">
            <h3 className="course-module__title">{m.title}</h3>
          </div>
        </article>
      ))}
    </div>
  </div>
</section>
```

`course-modules` is course-only. `workshop-topics__grid` is the two-up card
equivalent used by PP101 and PP102.

---

## 5. Bio with photo

Two columns, photo left at `0.85fr`, text right at `1.15fr`, 64px gap, collapses
at 1100px. The photo sits in the shared `meet__photo` card: bordered, 28/14/18
padding, image 560px tall with `object-fit: cover`, FIG tag along the top.

```jsx
<section className="section-pad section--inset workshop-instructor">
  <div className="container">
    <div className="workshop-instructor__grid">
      <div className="meet__photo">
        <div className="meet__photo-tag">
          <span className="meet__photo-tag-id">FIG. 01</span>
          <span>INSTRUCTOR</span>
        </div>
        <img src="/images/about/kaleen-sitting.jpg" alt="Kaleen Canevari" loading="lazy" />
      </div>
      <div className="workshop-instructor__body">
        <div className="kicker">§ 05 · Who is teaching</div>
        <h2 className="workshop-instructor__head">
          Headline with <span className="italic accent">one accent.</span>
        </h2>
        <p className="workshop-instructor__role">Mechanical Engineer · Pilates Instructor</p>
        <p>Bio, 58ch.</p>
        <Link to="/about" className="arrow-link">More about Kaleen →</Link>
      </div>
    </div>
  </div>
</section>
```

`workshop-instructor__role` is optional. Drop it when the bio's first sentence
already states the same credentials.

Available photos: `/images/about/kaleen-sitting.jpg` (2.2MB, used on About and
PP101), `/images/about/kaleen-hug-chair.jpg`, `/images/homepage/kaleen-shop.jpg`
(856KB, the shop shot).

---

## 6. Details and purchase

Two equal columns, 64px gap, spec list left and the purchase card right in a
filled panel. **This is the standard purchase block.** Used by PP101 § 06,
PP102 § 05 and the course page § 09.

```jsx
<section className="section-pad section--inset workshop-details">
  <div className="container">
    <div className="workshop-details__grid">
      <dl className="spec-list">
        {SPECS.map((sp) => (
          <div className="spec-list__row" key={sp.k}>
            <dt className="spec-list__k">{sp.k}</dt>
            <dd className="spec-list__v">{sp.v}</dd>
          </div>
        ))}
      </dl>
      <div id="buy" className="workshop-details__register">
        {pricing}
      </div>
    </div>
  </div>
</section>
```

`workshop-details__register` is `--bg-3`, 1px rule, 36px padding, and carries
`scroll-margin-top: 5rem`, which is why the anchor id belongs on it rather than
on the section.

The card inside is `RegisterCard` for workshops and `PricingBlock` for the
course. Both use the same `register-card__*` vocabulary from
`src/components/ui/RegisterCard.css`, so they look identical by construction.

---

## 7. Ladder

Three linked rungs showing where a product sits in the range. Course page only
so far, but reusable.

```jsx
<div className="course-ladder">
  {LADDER.map((step) =>
    step.current ? (
      <div className="course-ladder__step course-ladder__step--current" key={step.n}>…</div>
    ) : (
      <Link to={step.to} className="course-ladder__step course-ladder__step--link" key={step.n}>…</Link>
    ),
  )}
</div>
```

The current rung is marked rather than described, so the sequence reads without
copy saying "you are here". Non-current rungs are links, which is what keeps a
free entry point reachable from a paid page.

---

## 8. FAQ

Native `<details>` accordions with a `+` / `−` marker.

```jsx
<section className="section-pad section--inset workshop-faq">
  <div className="container">
    <div className="kicker">§ 08 · Questions</div>
    <h2 className="workshop-faq__head">Headline</h2>
    <div className="course-faq">
      {FAQ.map((f) => (
        <details className="course-faq__item" key={f.q}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  </div>
</section>
```

PP101 and PP102 use `workshop-faq__list` with a different internal structure and
put this section in `container--narrow` while left-aligned, which indents it
against its neighbours. Use the default container.

---

## 9. Final CTA

Centred, larger padding, narrow container. **The one place `container--narrow`
is correct,** because centred content has no left rail to break.

```jsx
<section className="workshop-cta section--inset">
  <div className="container container--narrow">
    <div className="kicker">§ 09 · Register</div>
    <h2 className="workshop-cta__head">
      Headline with <span className="italic accent">one accent.</span>
    </h2>
    <p className="workshop-cta__lede">Lede, 56ch, auto-centred.</p>
    <a href="#buy" className="btn btn--lg">Call to action<ArrowSvg /></a>
  </div>
</section>
```

Used by PP101 § 10, PP102, Landing § 07 and the calculator page § 06. Its button
scrolls back to the purchase block rather than repeating the form.

**A page does not need both this and pattern 6 as separate sections.** The
course page merges them: one closing section that is the purchase block, with
the End Result headline above the grid. That is a legitimate variant when the
page has a single conversion point.
