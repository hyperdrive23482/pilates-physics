# Nurture v2 (Nikki structure)

A seven-email sequence that follows the Spring Load Calculator lead magnet and
runs straight into the cart for
[The Making of a Reformer](../working-drafts/reformer-machine-course-spec.md).
Built on the five-beat nurture structure from
[funnel-strategy-nikki-session.md](../funnel-strategy-nikki-session.md), with the
mini sales sequence merged into it rather than following it.

One idea per email. The problem is not solved until email 4.

| # | Beat | The move | Cart | Status |
|---|------|----------|------|--------|
| 1 | POV / root belief | A spring is not one weight | Closed | **Final** |
| 2 | The enemy | "If you don't feel it, you're doing it wrong" | Closed | **Final** |
| 3 | The misdiagnosis | You think the problem is how you explain it | Closed | **Final** |
| 4 | The real diagnosis + cart open | Different load. Then the machine, then the offer | **Opens** | **Final** |
| 5 | Origin story + scar reel | The proof for email 4's claim: the shoulder rest decision, worked | 2 days left | **Final** |
| 6 | Objection handler | Five questions about your own reformer | Closes today | Drafted |
| 7 | Cart close | Reminder only. Very short | Closes tonight | Drafted |

> **Two changes from the original plan, both deliberate.**
>
> **The tripwire changed.** Emails 1 through 3 were written when it was Nikki's
> body weight mini course. It is now The Making of a Reformer, a machine-only
> course that keeps the body out on purpose, because body weight is Pilates
> Physics 101's thesis. Email 3's body weight seed was replaced with a machine
> seed. Emails 1 and 2 needed no change: email 1 is already a pure machine
> story, and email 2's enemy beat is product-agnostic.
>
> **The cart moved inside the sequence.** Nikki's structure was five nurture
> emails, then a separate four-email mini sales sequence. This version opens the
> cart at email 4 and closes it at email 7, so the origin story now lands
> *after* the offer and works as credentials for it rather than as a warm-up.
> Two of the four original sales topics are absorbed (the cart open into email
> 4, the self-quiz into email 6). Two are not used: "one change, three effects"
> and "the springs you have not looked at" are both still live for ads and
> organic.

**Cadence.** Emails 1 through 3 assume day 1, 3, 5. The cart runs 72 hours from
email 4, so emails 4 through 7 are fixed relative to each other:

| Email | Day | Time left |
|-------|-----|-----------|
| 4 | Day 1, morning | 72 hours |
| 5 | Day 2 | "2 more days" |
| 6 | Day 3, morning | Closes today |
| 7 | Day 3, end of day | Hours |

No email names a day of the week. Emails 1 through 3 point back with "last
email" and forward with "next time" so the pre-cart drip can be changed without
a copy edit. Emails 4 through 7 do name the remaining time, because a deadline
that is not stated does not work. The rule lives in
[voice-and-messaging.md](../voice-and-messaging.md).

**Two things block the send, and neither is copy.**

1. **The discount enforcement mechanism is deferred** in the course spec. Email 4
   opens a cart at $39 while the public page shows $69, so that mechanism has to
   exist before any of emails 4 through 7 can send.
2. **The CEC is unconfirmed.** The spec says "1 CEC for $39" is what justifies
   the price. All drafts are written so the CEC line can be dropped in without a
   rewrite, and none of them assert it.

**Relationship to the existing sequence.** This is a different structure from
[nurture-springs-101.md](nurture-springs-101.md), which is six emails mapped to
the PEACE beats and already written. Decide which one is live before loading
either into Kit.

---

## Email 1 · POV / root belief

**Status:** final, Kaleen's edit of draft version B. Earlier drafts and the
alternates are archived in
[nurture-v2-email-1-drafts.md](../working-drafts/nurture-v2-email-1-drafts.md).

**Subject:** You have probably taught this duet.

**Preview text:** Same setting, same footwork, different load.

---

Hi {{ subscriber.first_name }},

You have probably taught this duet.

She is five foot one. He is six foot tall. They booked together, they are on matching reformers, and you set them both to your standard footwork springs.

Two sets in, he is feeling the burn and she is casually chatting with you about their weekend.

She jokes that he really needs more Pilates to get stronger.

For a long time I assumed that he was really was weaker, or just not grasping the work.

But that's not it at all.

A spring is not one weight. It gets heavier the further it is stretched. And they were each extending the springs very different amounts.

He presses out to straight legs, stretching the springs about 21 inches. She presses out to straight legs, creating the same shape, but the carriage travels only 13 and a half inches.

On my baseline Balanced Body footwork springs (red, red, green), they experience a difference in resistance of more than 20 pounds at full extension.

Even gearing him out one slot (or lowering his footbar) keeps the maximum load gap at 14 pounds.

They were on the same springs, but never had the same experience, no matter what my training manual said.

There is a thing we think to ourselves about our clients in exactly this moment, when the setting is right and the person still cannot feel it. I want to talk about that one next time, because I think it is the most quietly harmful sentence in this industry.

Kaleen

[Open the calculator →](/portal)

P.S. See what the load gap could be on your footwork settings in the calculator. There's a video tutorial waiting for you there.

---

### Before this sends

- **The `/portal` link** is a placeholder. Point it at wherever the calculator
  lands for a new subscriber.
- **The P.S. promises a video tutorial** on the calculator page. That is the
  footwork follow-up piece, which is not built yet. Either ship the video first
  or cut that sentence.
- **The math is verified.** See the note below.
- **No day references.** The open loop says "next time," not a weekday, so this
  email survives a schedule change.

### Math check

Run against [springSpecs.json](../../../src/data/springSpecs.json) and
[springMath.js](../../../src/lib/springMath.js), using the calculator's own model,
`F(x) = kx + b`, with constants summing in parallel.

Balanced Body red, red, green: `k = 3.16667`, `b = 26`.

| Claim in the email | Computed | Verdict |
|---|---|---|
| More than 20 lb gap at full extension (21 in vs 13.5 in) | 92.5 lb vs 68.75 lb, a **23.75 lb** gap | Correct |
| Gearing out one slot keeps the gap at 14 lb | One gear slot removes 3 in of stretch, so 18 in vs 13.5 in, a **14.25 lb** gap | Correct |
| "or lowering his footbar" is equivalent | The class simulator uses `-3` in for both gear 2 and a low footbar | Correct |
| Red, red, green is the footwork baseline | Matches `defaultSprings` for footwork in the class simulator | Correct |

**Known inconsistency, decided.** The class simulator estimates footwork stretch
as `0.82 × height − 40`, which for five foot one and six foot tall gives about
10 in and 19 in, not the 13.5 in and 21 in in this email. The email is correct
and stays as written. The stretch figures here are measured, and the simulator's
linear formula is the rough approximation. Revisit
[exercises.js](../../../src/components/portal/classSimulator/exercises.js)
separately, not this copy.

---

## Email 2 · The enemy

**Status:** final, Kaleen's edit of draft version A. Alternates are archived in
[nurture-v2-email-2-drafts.md](../working-drafts/nurture-v2-email-2-drafts.md).

**Subject:** "If you don't feel it, you're doing it wrong"

**Preview text:** The line we reach for when the setting is right and they still cannot feel it.

---

Hi {{ subscriber.first_name }},

I think the most harmful sentence in the Pilates industry right now is this.

*"If you don't feel it, you're doing it wrong."*

Maybe it's been told to you.  Maybe you've said it. Maybe you've thought it.  You've probably (definitely) seen it in internet forums.

This sentence is circulated by teachers who are good at their jobs and care enormously about the people in front of them.  It permeates our industry quietly dismissing a whole group of clients.

Look at what it does.

A client tells you they are not feeling footwork where you want them to. That is real information about their body, offered to you honestly, which is exactly what you want from a client.

And the belief that they are doing it wrong lays it at their feet as their personal failing. Not "something is off in the setup I gave you." Something is off in them.

So maybe they stop giving you honest feedback. They decide they are bad at this, or that their body is the problem, and maybe they even stop coming. You have lost the chance to continue sharing the magic of Pilates with them.

Now put that next to the duet we talked about last email. She is five foot one on the same springs as the six foot man beside her, which means she is genuinely, measurably on a lighter load than he is. He is not weaker, nor is she doing it wrong. They are each simply responding to loads that aren't personalized to them.

If that's what you've been taught, I hear you.  I've certainly heard it in my trainings, and thought it to myself.  It's what we think when memorized settings are the only information we have, because if the setting is right and the feeling is missing, the person must be the variable, right?

The person is not the only variable to consider.

So what do we reach for instead? Almost all of us reach for the same thing, and I think it is often the wrong thing. 

Until next time,

Kaleen

P.S. Hit reply and tell me the line repeated over and over in our industry that makes you wince. I am collecting them, because the one I shared today is not the only one.

---

### Before this sends

- **No day references, deliberately.** This email says "last email" and "next
  time." Keep that pattern in emails 3 through 5.
- **No CTA by design.** Email 1 sends them to the calculator and email 2 asks
  only for a reply. That is the right shape for the enemy beat, but it does mean
  two emails in a row with no link to anything. Fine as is, worth watching.
- **Email 3 owes the reader a payoff.** This email promises "the thing almost all
  of us reach for instead," so email 3 has to name it and explain why it is not
  the answer. Per Nikki, that is the misdiagnosis: you think the problem is how
  you are explaining it.
- **Email 3 must not resolve it either.** The real diagnosis is email 4. Email 3
  names the wrong fix and stops.

---

## Email 3 · The misdiagnosis

**Status:** final, Kaleen's edit of draft version A, softened so that cues are
allowed to sometimes be the right answer, then re-seeded for the machine
tripwire (the body weight line was swapped for the gear bar and footbar lines). Alternates are archived in
[nurture-v2-email-3-drafts.md](../working-drafts/nurture-v2-email-3-drafts.md).

**Subject:** The thing we reach for instead

**Preview text:** When they cannot feel it, we reach for better words. Sometimes that works.

---

Hi {{ subscriber.first_name }},

Here is the thing almost all of us reach for when a client just isn't getting it.

Different cues.

Press through the whole foot. Then, imagine you are pushing the wall away. Then you get more anatomical, because maybe they need the detail. Then you get more poetic, because maybe they need the image. Then you demo it. Then you put a hand on their leg to cue it by touch.

And sometimes that works. Sometimes a different version of a cue is the one that lands, they light up, and it really was a communication problem. That happens, and it is worth being good at.

But sometimes you go through all six of those and they say "oh, maybe, a little," which you both know is what people say when they want to move on.

That is the moment I want to talk about, because that is where most of us conclude we need better words.

I want to be clear that reaching for words is not a failure of skill. That escalation is a teacher being good at their job. You had a client who was not getting a result, and you cycled through every tool you had.

It is just that all six of those tools were different versions of the same tool.

And you already know from the duet we talked about earlier what they may be up against. A smaller person on the same springs as the larger person beside them is working against genuinely different resistance. Not a little different. Meaningfully different.

Now, a cue can change the feeling or performance. Perhaps you help the client create a different shape with their body, changing what they feel and how far they stretch the springs.

Totally valid.

What a cue cannot do is close a 20 pound load gap.

It cannot change where on that spring's load curve your client is starting from. 

Even when maximum load is not the goal, the spring is still doing a job of its own. A verbal cue sends information to your client's ears. The spring sends it straight through their body through the machine. Some people need more of that input before the work registers, and some need less.

So you can cue them beautifully, and they can execute it beautifully, and they will be beautifully performing an exercise that is still too light for them to feel it as much as you want them to.

None of this means your cueing is the problem. Cueing is the skill you have, so it is the skill you reach for, including in the moments when the thing standing between them and the sensation is not a sentence but a number.

Which raises the obvious question. When words are not the lever, what is, and what do you do the next time a client tells you they cannot feel it?

Until next time.

Kaleen

### Before this sends

- **Two subject lines were not used.** "You have said it four different ways" and
  "The lever you were never handed" are both live options if you want to test.
- **No CTA, third email running.** Emails 2 and 3 both ask for nothing. That is
  defensible for these beats, but email 4 should probably carry a link.
- **The machine lines are a deliberate seed.** "Where on that spring's climb,"
  the gear bar, and the footbar point at the tripwire product, which is now
  [The Making of a Reformer](../working-drafts/reformer-machine-course-spec.md)
  rather than Nikki's original body weight course. Name the category, do not
  teach it here.
- **Body weight was removed from this email.** The earlier draft closed on "it
  cannot change how the spring load compares to your client's own body weight."
  That seeded the wrong product. Body weight is Pilates Physics 101's thesis, so
  it stays out of nurture entirely now.
- **Email 4 owes the reader a payoff.** This email promises to answer what the
  lever is when words are not, and what to do the next time a client says they
  cannot feel it. The payoff is not foresight. It is being able to explain to a
  client what they are feeling and why, and to adapt with confidence in the
  moment. Email 5, the origin story, sits between email 4 and the mini cart open.

---

## Email 4 · The real diagnosis, and the cart opens

**Status:** final, Kaleen's rewrite. Version A was selected and then rewritten
from the opening down. Drafts A, B, and C are archived in
[nurture-v2-email-4-drafts.md](../working-drafts/nurture-v2-email-4-drafts.md).

**Subject:** The lever most teacher training glosses over

**Preview text:** If you don't understand this one thing, it costs every other part of your teaching

---

Hi {{ subscriber.first_name }},

When a client doesn't get it, what's another thing you could reach for instead of a new cue?

Different load.

Not because they're stronger or weaker, but because everyone's already on a different load anyway.

The spring calculator showed you that springs are not one weight.  And, you walked through just how different the spring load is for a tall person and short person on your typical footwork springs.

You get to show people how to work on one of the coolest fitness machines out there.  But if we don't understand how the machine works, how can we ever understand how it interacts with the body?

Most teacher training glosses over this part.

I know that because I came at Pilates from precisely this equipment angle before I ever learned how to teach.  And when it was time to design my own reformer, I had to pick every dimension, every adjustment range, every spring specification.  They needed to be defensible with physics, and I got a full education in what a reformer actually is on the way through.

I put what I learned into a short online course. It's called **The Making of a Reformer: how your machine works and why.** It talks about everything that changes load before a body gets on it, and it is about an hour and is available instantly on purchase. [CEC line goes here once confirmed.]

Because you just joined my list, I want to give you the chance to buy this course for **$39**.  You get the special discount for 3 days. After that it goes back to its normal $69.

[Get The Making of a Reformer →](LINK)

Kaleen

---

### Before this sends

- **The subject line calls back to email 3 on purpose.** Email 3 closed on "when
  words are not the lever, what is." This subject answers with "the lever," which
  makes the two emails read as one thought even though the body has moved on to
  "different load."
- **Watch the preview text against the voice guide.** "It costs every other part
  of your teaching" is a consequence claim, and the body is gentler and inclusive
  ("if *we* don't understand how the machine works"). The Do-not list in
  [voice-and-messaging.md](../voice-and-messaging.md) says not to imply a
  teacher's training failed them. This is Kaleen's call and it is defensible as
  written, since the sharper line is what gets the open. If it should soften, the
  nearest version is "Understand the machine, and everything else you teach gets
  easier," which makes the same point as an upside.

- **The greeting line was added** to match emails 1 through 3. Kaleen's rewrite
  started at "When a client doesn't get it."
- **`LINK` is a placeholder,** and it has to resolve to something that actually
  charges $39. That is the discount enforcement mechanism, still deferred in
  [the course spec](../working-drafts/reformer-machine-course-spec.md). Nothing
  in emails 4 through 7 can send until it exists.
- **`[CEC line goes here once confirmed.]` is a real placeholder.** Delete the
  bracket and write the line, or delete the sentence. Do not ship the bracket.
- **No P.S.** Emails 1, 2, and 3 all have one. Not a problem, but it is a break
  in pattern worth making on purpose rather than by omission.
- **No forward tease to email 5.** The earlier drafts ended on one. This version
  ends on the CTA, which is the more conventional cart-open shape. Decide
  deliberately, since email 5 arrives the next day either way.
- **Double spaces after some sentences** are preserved from the rewrite. Kit will
  collapse them in HTML. Harmless.

### What this rewrite changed, and what it costs

- **It answers email 3's question in two words.** Email 3 closed on "when words
  are not the lever, what is?" and promised "the email this whole thing has been
  building toward." This opens by answering it directly: different load. That is
  crisper than any of the three drafts managed.
- **The diagnosis is now compressed rather than developed.** The drafts spent
  roughly 70% of the email on it. This spends about four lines and moves to the
  machine. The tradeoff is deliberate and it makes the email much shorter, which
  makes the offer read as less of a pitch. The risk is that a three-email buildup
  pays off in one line, so watch reply volume and click rate on this one.
- **"The load has been invisible to you" is gone,** and with it the instrument
  framing and the absolution of email 2's sentence. If it turns out to be missed,
  it is one paragraph and it fits between "everyone's already on a different load
  anyway" and the calculator line.
- **The credential moved forward.** The design story now opens in email 4 rather
  than being planted in one line, which changes email 5's job from reveal to
  deepening. See the note on email 5.

---

## Email 5 · Origin story and scar reel

**Status:** final, Kaleen's edit of draft version A. Versions B and C are archived
in [nurture-v2-email-5-drafts.md](../working-drafts/nurture-v2-email-5-drafts.md).

**Subject:** not set. See options below.

**Preview text:** not set. See options below.

---

Hi {{ subscriber.first_name }},

Yesterday I mentioned that I came at this from the equipment side before I ever learned to teach.

Here is the part I left out. It did not help me. Not at first.

I walked into teaching already understanding how these machines work. I could have told you exactly what a spring does when you stretch it. And I still stood in front of that duet from the first email, the tall man working hard and the small woman chatting through her set, and thought that he was really engaging with the work and she was not quite grasping it.

I still thought the sentence I showed you in the second email.

That is the honest part of this story and it is not the shape you would expect. Knowing the physics did not make me a better teacher right away. The information was sitting in my head the whole time, filed under equipment, and it never once walked across the room and filed itself under people.

Designing a reformer of my own to sell worldwide is where it stopped being possible to be vague about any of it.

Every dimension on a reformer is a number that somebody has to actually manufacture. There is no "about there." You pick, and then you defend the pick to people whose entire job is to ask you why.

Let me show you one, because it is the fastest way to explain what I mean.

Take the shoulder rests. Most people read those as a comfort feature, something you adjust so a client is not uncomfortable. They are not. Where the shoulder rests sit decides where a body starts on the carriage. That decides how close they are to the footbar.  That decides how far your client presses in footwork before their legs are straight. That decides how far the spring stretches. And that decides the load.

That's a big part of the reason I made the Flexia Reformer shoulder rests adjustable in two directions: wide-narrow and close-far to the footbar.

I made dozens of decisions like that one. How many gear positions to offer and where to stop. What spring specs to require.  Where the pulleys sit on the risers. Whether the footbar needed to pivot.

Every one of them turned out to be a load decision wearing a different costume.

That is what The Making of a Reformer online course is. Not a parts list. Each section opens with a decision I had to make, gives you the physics that settled it, and closes with what I picked and why.

You can still get it for **$39** for just two more days.  Then it goes back to $69.

[Get The Making of a Reformer →](LINK)

Kaleen

---

### Before this sends

- **Subject line and preview text are not set.** Options from the draft:

  | Subject | Note |
  |---|---|
  | I knew the machine and still got it wrong | Strongest hook. States the paradox the email runs on |
  | The part I left out yesterday | Best continuity. Opens a loop directly off email 4 |
  | It did not help me either, not at first | Softest, and the most curious |

  Drafted preview text: "Knowing the physics did not make me a better teacher.
  Not on its own." That still fits, though the body now says "right away" rather
  than "on its own," so matching them is a one-word edit either direction.

- **`LINK` is the same placeholder** as email 4, and the same blocker: the
  discount enforcement mechanism is still deferred in
  [the course spec](../working-drafts/reformer-machine-course-spec.md).
- **No CEC line in this email,** by choice. It was in the draft and was cut. If
  the CEC lands, email 4 is where it belongs.
- **No P.S.,** which is now consistent with email 4. Emails 1, 2, and 3 all carry
  one. The pattern break starts at the cart open.
- **Double spaces are preserved** from Kaleen's edit. Kit collapses them in HTML.

### Three edits that changed decisions recorded elsewhere

**1. The machine is named.** "The Flexia Reformer" is stated outright. That
overrides the "machine stays unnamed" play in the course spec, which followed
Nikki's Remo approach of showing without naming. The open decision in that spec
has been updated to record this.

It is a real trade rather than a slip. Naming it makes the proof concrete and
checkable: "I made the Flexia Reformer shoulder rests adjustable in two
directions" cashes email 4's "defensible with physics" claim far harder than an
anonymous version could. What it costs is the thing the spec said made the
unnamed version work, which is that the design story reads as credentials rather
than as a pitch.

**The consequence to act on:** the brand-fairness pass across the technical
content is no longer optional. A course called "how your machine works" written
by someone visibly selling a reformer has to be demonstrably fair to every brand,
or the whole credibility argument inverts. The spring calculator already is.
Confirm the course content is before launch.

**2. "I still thought the sentence" is a smaller confession than email 2 already
made.** Email 2 says plainly: "I have said it. You may have said it." This email
says she thought it. If that softening is deliberate, fine, though the reader who
remembers email 2 will notice the retreat. Changing "thought" to "said" restores
the continuity in one word.

**3. "Where the pulleys sit on the risers" is listed as a load decision,** and the
course spec still carries "resolve whether pulley height actually matters" as an
open question inside module 4. If the answer turns out to be "not much," this
line is a small overclaim in an email whose whole job is proving rigor. Either
settle the question or swap the example.

### Resolved by this edit

- **The shoulder rest physics is confirmed by the author.** The draft flagged that
  it is not modelled in the spring calculator or class simulator. Kaleen wrote the
  Flexia decision in directly, so it stands on her own design work.
- **Captures 1 and 2 are closed.** "Designing a reformer of my own to sell
  worldwide" bridges straight from the scar to the design work, with no separate
  turn or escalation beat needed.
- **The unsourced "ten thousand cycles" line is gone,** replaced with "what spring
  specs to require."
