# Nurture v2 (Nikki structure)

An eight-email sequence that follows the Spring Load Calculator lead magnet and
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
| 5 | Origin story + scar reel | Designing one: the shoulder rest decision, worked all the way through | Day 2 of 4 | **Final** |
| 6 | Objection handler | Five questions about your own reformer | Closes tomorrow | **Final** |
| 7 | What is in it | The syllabus: what you get for $39, module by module | Closes tonight | **Final** |
| 8 | Cart close | Three sentences. Price goes up. Evening send | Closes tonight | **Final** |

> **Three changes from the original plan, all deliberate.**
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
> cart at email 4 and closes it at email 8, so the origin story now lands
> *after* the offer and works as credentials for it rather than as a warm-up.
> Two of the four original sales topics are absorbed (the cart open into email
> 4, the self-quiz into email 6). Two are not used: "one change, three effects"
> and "the springs you have not looked at" are both still live for ads and
> organic.
>
> **The close split into two emails.** The sequence was seven emails, with email
> 7 as the cart close. Email 7 is now a content email answering email 6's five
> questions and laying out what the course contains, and the close became a new
> email 8 that goes out the same evening in two or three sentences. The reasoning
> is that the last content beat and the last deadline beat want opposite lengths,
> and one email cannot be both.

**Cadence.** Emails 1 through 3 assume day 1, 3, 5, and they carry no deadline.
The cart runs **four calendar days** from email 4, closing at end of day on day 4:

| Email | Day | Send | What it says about time |
|-------|-----|------|-------------------------|
| 4 | Day 1 | 9am | "4 days" |
| 5 | Day 2 | 9am | "two more days" |
| 6 | Day 3 | 9am | "until tomorrow" |
| 7 | Day 4 | 9am | "$39 today" |
| 8 | Day 4 | 8pm | "ends at midnight" |

Every line above is what the shipped copy already says. **"Four days" means four
calendar days including the day email 4 lands, not a literal 96 hours from the
moment it is read.** The deadline is minted as end of day, so the real elapsed
window runs a little under 96 hours. Days are what the copy promises and days are
what the reader counts, so days are the canonical unit. 96 hours is internal
shorthand.

> **The cart timeline is settled: four calendar days, deadline at end of day.**
> The mechanism that has to match it lives in the **Timeline** section of
> [making-of-a-reformer-build-plan.md](../../making-of-a-reformer-build-plan.md),
> which owns the Kit schedule and the Stripe deadline. Two things there are
> load-bearing for this copy. Every Kit delay must be expressed in **days**, or a
> subscriber who joins at 11pm receives the whole sequence at 11pm. And emails 1
> to 3 and 4 to 8 must be **two separate sequences**, because the offer clock
> starts when the tag is applied and the cart cannot skip weekends.
>
> **One copy change came out of this pass:** email 4 now says "4 days" where it
> said 3. Nothing else moved. Kaleen's "until tomorrow" in email 6 is what
> surfaced the conflict, and it reads true against the four-day window as written.

**Email 8 is the only evening send.** Everything else goes in the morning. Check
Kit does not have a list-wide send-time default that would quietly override it.

No email names a day of the week. Emails 1 through 3 point back with "last
email" and forward with "next time" so the pre-cart drip can be changed without
a copy edit. Emails 4 through 8 do name the remaining time, because a deadline
that is not stated does not work. The rule lives in
[voice-and-messaging.md](../voice-and-messaging.md).

**Two things block the send, and neither is copy.**

1. **The discount enforcement mechanism is deferred** in the course spec. Email 4
   opens a cart at $39 while the public page shows $69, so that mechanism has to
   exist before any of emails 4 through 8 can send.
2. **The CEC is unconfirmed.** The spec says "1 CEC for $39" is what justifies
   the price. All drafts are written so the CEC line can be dropped in without a
   rewrite, and none of them assert it.

### Subject line pass, 2026-08-21

Every subject was rewritten for relevance or curiosity except emails 1 and 2,
which were already doing both. All eight now fit inside 35 characters, so nothing
truncates on mobile. Previous lines are recorded here, so reverting any one is a
copy and paste.

| # | Subject | Chars | Replaced |
|---|---------|-------|----------|
| 1 | You have probably taught this duet. | 35 | *unchanged* |
| 2 | "If you don't feel it, you're doing it wrong" | 45 | *unchanged* |
| 3 | Six cues, and still nothing | 27 | The thing we reach for instead |
| 4 | Not a new cue. A different load. | 32 | The lever most teacher training glosses over |
| 5 | So I designed my own reformer | 29 | The question I had to answer about a thousand times |
| 6 | Five questions about your reformer | 34 | How well do you know your reformer? |
| 7 | What you get for $39 | 20 | What exactly is in The Making of a Reformer? |
| 8 | $39 ends at midnight | 20 | Last call to learn the mechanics of your reformer for $39 |

**Emails 1 and 2 were left alone on purpose.** Email 1's subject is the first
line of its own body and it works on recognition, which is the strongest thing a
first email can do: it proves the sender knows the reader's week. Email 2 quotes
the enemy verbatim, which is the customer-language rule in
[voice-and-messaging.md](../voice-and-messaging.md) working exactly as intended.
Email 2 is the only one over 35, and its truncation is harmless because the
reader finishes the sentence themselves.

**What each change was reaching for:**

- **3.** "The thing we reach for instead" named a category. "Six cues, and still
  nothing" is the scene from the body, and the six is literally countable in the
  copy. It reads as a shared moment rather than a diagnosis, which keeps it on the
  right side of "punch up, never across."
- **4.** The old line put the heat on teacher training. That is a fair target per
  the voice guide, but it is abstract, and the body no longer argues it. The new
  line answers email 3's question in the subject, which is what the body does in
  its first two sentences. It also reads as an asset the reader already has rather
  than a gap.
- **5.** Leads with the credential, which is the thing email 4 promised and email
  5 delivers, and it is the only subject in the sequence that states outright what
  Kaleen did. The mystery alternative, "Why this and not that?" (22), is the
  question the email says gets attached to every number on the machine. It was the
  first pick and was swapped out because it is the only subject in the set with no
  concrete noun in it, which leans the whole open on the preview text. Kept here in
  case it is worth an A/B.
- **6.** "How well do you know your reformer?" asks the reader to prove something
  before they have been offered anything. "Five questions about your reformer"
  says what is inside, and a numbered thing in a subject line is its own open
  driver.
- **7.** The old subject asked a question the body answers in sentence two. The
  new one is that sentence: it names the price on a closing day and answers a
  silent question. **It also sidesteps the unresolved module count,** so it does
  not need to wait on that fix.
- **8.** The old line pushed the $39 past the mobile cut, which lost the only
  thing the email is about. Now it leads.

**The arc these make, read in order:** recognition, the enemy in its own words,
the frustrating moment, the answer, the origin, the invitation, the price, the
deadline. The register visibly turns commercial at email 7, which is correct,
because that is the day the cart closes.

---

**Relationship to the existing sequence.** This was one of two structures written
for the same lead magnet slot. The other,
[nurture-springs-101.md](../archive/nurture-springs-101.md), was six emails mapped
to the PEACE beats. It was archived on 2026-09-03. This sequence is the live one.

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

**Subject:** Six cues, and still nothing

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

**Subject:** Not a new cue. A different load.

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

Because you just joined my list, I want to give you the chance to buy this course for **$39**.  You get the special discount for 4 days. After that it goes back to its normal $69.

[Get The Making of a Reformer →](LINK)

Kaleen

---

### Before this sends

- **"4 days" was "3 days" until 2026-08-21.** It changed when the cart window was
  settled at four calendar days, which is the only shape that fits five emails at
  one send per morning plus the evening close. This is the single copy edit that
  came out of the timeline pass. The reasoning is in the **Timeline** section of
  [making-of-a-reformer-build-plan.md](../../making-of-a-reformer-build-plan.md).
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
  in emails 4 through 8 can send until it exists.
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

**Status:** final, Kaleen's edit of draft version C. Version C replaced the
earlier version A edit on 2026-08-21. Versions A and B are archived in
[nurture-v2-email-5-drafts.md](../working-drafts/nurture-v2-email-5-drafts.md).

**Subject:** So I designed my own reformer

**Preview text:** Every number on that machine is a decision somebody defended.

---

Hi {{ subscriber.first_name }},

The fastest way I know to learn how a reformer works is to try to have one made.

I designed and produced my own because after getting my hands on hundreds of machines over the years, I didn't like the physics of any of them.

Here is what nobody warns you about.

You cannot say "about there." Every dimension is a number that somebody has to actually manufacture, in a factory, thousands of times. So every number gets a question attached to it, and the question is always the same one. Why this and not that?

I answered that question a few hundred times during my development process. How many gear positions, and where to stop. How big the carriage should be. Where the pulleys sit. Whether the footbar needed to pivot or not.

Let me show you one that resulted in a relatively rare adjustment lever, precisely because I was thinking about loading a variety of bodies.

The shoulder rests. 

Most people read those as a comfort feature. Something that keeps the client from sliding off and maybe, sometimes, can be removed or swapped to change the width between them.

However, they are not just a comfort feature. Where the shoulder rests sit directly impacts where a body starts on the carriage, which decides how close they are to the footbar, which decides how far your client presses before their legs are straight, which decides how far the spring stretches, which decides the spring load.

I wanted my reformer to fit larger bodies better, and in order to preserve the ability for smaller folks to get the range of movement they needed, I added a second slot for the shoulder rests that allowed them to move closer to the footbar.

Not only was it great for short people doing footwork, but it was also nice for planks and lunges where the footbar and shoulder rests were used at the same time.  No more wedging foam rollers or yoga blocks between feet and shoulder rests.

Before designing the Flexia Reformer I thought I knew reformers well.  After all, I came at Pilates equipment-first as a design engineer and only  after taking classes to learn about what I was building did I get the Pilates bug.   

For seven years I built, maintained, and repaired Pilates equipment, and yet I still hadn't considered all the load tradeoffs each design decision created. 

I stood in front of that duet and thought he was engaging with the work and she was not quite grasping it. 

The physics was in my head the whole time. The magnitude of it just never landed.

It turned out that every functional design decision I made was actually a load decision. That is the education I did not know I was signing up for when I set out to design my reformer.

The Making of a Reformer: How your machine works and why, is that education, arranged in a convenient mini course so you can understand how each of the reformer components affects how your load is delivered to the client. Along the way, I'll share the design decisions I faced when creating my own reformer, and why I chose what I did.

You can grab the course for $39 for another 2 days.  But after that, it goes back to the regular price of $69.

[Get The Making of a Reformer →](LINK)

Kaleen

---

### Before this sends

- **One typo fixed on the way in.** The draft subject reads "about a thousand
  time." It is set here as "about a thousand times." Revert if that was
  deliberate.
- **The course title is capitalised differently here than in email 4.** This
  email says "The Making of a Reformer: How your machine works and why." Email 4
  says "how your machine works and why." Pick one and make both match, since the
  two emails land a day apart.
- **"Two more days" checks out against the four-day window.** Email 5 lands on
  day 2 and the cart closes end of day 4, so the two days remaining after today
  are day 3 and day 4. It understates by a few hours rather than over-promising,
  which is the safe direction. No edit needed.
- **`LINK` is the same placeholder** as email 4, and the same blocker: the
  discount enforcement mechanism is still deferred in
  [the course spec](../working-drafts/reformer-machine-course-spec.md).
- **No CEC line in this email,** by choice. If the CEC lands, email 4 is where it
  belongs.
- **No P.S.,** consistent with email 4. Emails 1, 2, and 3 all carry one. The
  pattern break starts at the cart open.
- **Double spaces and a few trailing spaces are preserved** from Kaleen's edit.
  Kit collapses them in HTML. Harmless.

### What switching from version A to version C changed

**1. The email leads with the making, not the scar.** Version A opened on "I knew
the machine and still got it wrong" and spent its first third on the admission.
Version C opens on what designing a reformer is actually like, and the scar
arrives near the end as the reason the education mattered. That is a curiosity
open rather than a confession open, and it is more distinct from the rest of the
sequence, which has been confessional since email 2.

**What it gives up is the absolution.** Version A's whole argument was that
knowing the physics was not sufficient even for the person who knew it, so no
teacher reading it has anything to be embarrassed about. Version C still contains
the raw material for that ("I still hadn't considered all the load tradeoffs"),
but it is one line in the back half rather than the spine. If open rate on this
email holds and reply warmth drops, that is the cause.

**2. The email 2 callback is gone.** Version A said "I still thought the sentence
I showed you in the second email," which tied the scar back to the enemy beat.
Version C keeps the duet from email 1 but drops the email 2 line entirely. Nothing
else in the sequence closes that loop, so decide whether email 6 or 7 should pick
it up.

**3. Two new biographical claims are now in the copy,** and neither is in
[story-bank.md](../story-bank.md) yet:

  - **"For seven years I built, maintained, and repaired Pilates equipment."**
    A more specific credential than anything in emails 1 through 4, and the first
    time the repair work appears anywhere in the sequence.
  - **"Hundreds of machines over the years, I didn't like the physics of any of
    them."** This is the motive for designing the Flexia, and it is also a
    competitive claim about every reformer on the market.

  Both belong in story bank section 2. The second one also collides with the
  brand-fairness requirement below, so read them together.

**4. The shoulder rest decision is now fully worked, and it proves more than
version A's did.** Version A said the rests adjust in two directions. Version C
gives the constraint (fit larger bodies without costing smaller ones their
range), the mechanism (a second slot closer to the footbar), and a second payoff
(planks and lunges, no foam roller wedging). That passes the course spec's
three-sentence test properly, and it cashes email 4's "defensible with physics"
claim harder than the earlier version did.

### Carried forward from the version A edit, still open

- **The machine is named.** "The Flexia Reformer" is stated outright, which
  overrides the "machine stays unnamed" play in the course spec. Version C makes
  this heavier rather than lighter: the email now also says she did not like the
  physics of any machine she had handled. **The brand-fairness pass across the
  course content is not optional.** A course called "how your machine works,"
  written by someone visibly selling a reformer and saying the competition's
  physics did not satisfy her, has to be demonstrably fair to every brand or the
  credibility argument inverts. The spring calculator already is. Confirm the
  course content is before launch.
- **"Where the pulleys sit" is still in the list of decisions,** and the course
  spec still carries "resolve whether pulley height actually matters" as an open
  question in module 4. Version C lists it as a decision rather than claiming it
  as a load decision, which is a softer form of the same overclaim. Settle the
  question or swap the example.

### Resolved

- **The shoulder rest physics stands on Kaleen's own design work,** not on the
  calculator or the class simulator, neither of which models shoulder rest
  position. The draft flagged that gap; the Flexia decision written in directly
  answers it.
- **Captures 1, 2, and 3 are all closed.** Version C supplies the escalation
  ("hundreds of machines… I didn't like the physics of any of them"), the worked
  decision, and the connection between knowing the physics and teaching with it.
- **The unsourced "ten thousand cycles" line is gone.**

---

## Email 6 · Objection handler, the self-quiz

**Status:** final, Kaleen's edit of draft version A. Version B is archived in
[nurture-v2-email-6-drafts.md](../working-drafts/nurture-v2-email-6-drafts.md).

**Subject:** Five questions about your reformer

**Preview text:** Answer them for yourself and see where you land.

---

Hi {{ subscriber.first_name }},

Do you know your reformer as well as you think you do?

You may have taught on the same reformer for years and know exactly what it does. You've experimented with different settings and know through trial and error that moving one thing affects another thing.

Or, you may have been given settings to use from your studio owner or lead educator during teacher training, and haven't deviated.  You think you might have other adjustment options but you've never played around with them.

Regardless, here's a little quiz to help you think about what you do and don't know about your reformer.

**One.** You lower the footbar one notch. What happens to the spring load? 

**Two.** You move the gearbar out one notch.  What else changes because of that?

**Three.** The rope runs through a pulley, so your client feels half the spring load. True or false?

**Four.** A heavier client makes the carriage significantly harder to push, because of friction. True or false?

**Five.** Why do manufacturers recommend replacing your springs so often?

If you want to know the answers to these questions, you should grab my online course, The Making of a Reformer.  It covers all five, and then some. [CEC line goes here once confirmed.]

**It is $39 until tomorrow.** After that it goes to $69.

[Get The Making of a Reformer →](LINK)

Kaleen

---

### Before this sends

- **"Until tomorrow" is correct, and it is what set the window.** Email 6 lands
  on day 3 and the cart closes end of day 4, so tomorrow is genuinely the last
  day. This line is what surfaced the conflict in the original three-day plan,
  where emails 6 and 7 were both stacked on day 3 and this sentence promised a day
  that did not exist. The window is now four calendar days. No edit needed.
- **`[CEC line goes here once confirmed.]` is a live placeholder.** Delete the
  bracket and write the line, or delete the sentence. Do not ship the bracket.
- **`LINK` is the same placeholder** as emails 4 and 5, and the same blocker: the
  discount enforcement mechanism is still deferred in
  [the course spec](../working-drafts/reformer-machine-course-spec.md).
- **Question 5 needs something citable behind it.** "Why do manufacturers
  recommend replacing your springs so often" asserts that they do. Have a
  specific manufacturer interval to point to before this ships, since it is the
  one question that makes a claim rather than asking one, and it comes from
  someone who sells reformers. The course spec's safety framing note applies.
- **Question 1 should be checked against the spring calculator.** Lowering the
  footbar changes where the press starts, which changes how far the spring
  stretches. That is real, and it is the same chain email 5 just ran for the
  shoulder rests, which is good continuity. But confirm the calculator or the
  class simulator actually models footbar height the way this question implies,
  because the reader who just used the calculator may go looking.
- **No P.S.,** which is now consistent with emails 4 and 5. The draft notes called
  the friction P.S. the strongest line in either version; it is available if you
  want it back.

### What Kaleen's edit changed

**1. The questions are not the five from the plan.** The mapping table in the
drafts file no longer describes what shipped:

  | Shipped | Was | Module |
  |---|---|---|
  | 1. Lower the footbar one notch, what happens to the load | *new* | 3, adjustments |
  | 2. Gear bar out one notch, what else changes | 1. same, plus "what happens to the load" | 3, trickle-down |
  | 3. The pulley halves the load, true or false | 3. same | 4, pulleys |
  | 4. A heavier client makes the carriage harder to push, true or false | 4. same, plus "significantly" | 5, friction |
  | 5. Why do manufacturers recommend replacing springs so often | 5. how would you know if your oldest spring still does what its color says | 2, wear |
  | — | 2. two brands, both red springs, same resistance | 2, springs |

**The dropped question is the one about spring color across brands,** which the
plan called the one that lands hardest on anyone who has taught in more than one
studio. It was also the only question pointed at module 2's core content rather
than at wear. Module 2 is now represented by question 5 alone, and module 3 has
two questions. If you want the color question back, it fits cleanly as a sixth or
in place of question 1.

**2. Question 1 and question 2 now split what used to be one question.** The old
question 1 asked what happens to the load *and* what else moves with it. The
shipped version puts the load half on the footbar and the trickle-down half on the
gear bar. That is a cleaner pair, and question 2 is now purely the trickle-down
hook, which is the primary ad angle.

**3. The permission not to buy is gone.** The draft carried "If you got all five
cleanly, you do not need what I am selling. I mean that." along with the line
about the gap being in what teachers were handed, not in their teaching. Both are
cut. The drafts file flags that line as the thing that makes an experienced
teacher willing to take the test at all, so this is the edit most worth a second
look. It also removes the only reframe in the email, which leaves the quiz
standing as a test with nothing after it.

**4. The framing moved from "rather than argue with you" to "do you know your
reformer as well as you think you do?"** The subject line does the same work. That
is a sharper open and it will get read. It also puts the email closer to the
Do-not list in [voice-and-messaging.md](../voice-and-messaging.md) than any other
email in the sequence, because the reader is being asked to prove something rather
than being offered something they were never given. The second paragraph softens
it well; the third ("you've never played around with them") is where a confident
teacher is most likely to bristle. Kaleen's call, but it is the trade being made.

**5. "I am not going to answer them here, that is the course" is gone,** replaced
with "if you want to know the answers, you should grab my online course." Same
job, more direct, and it does not read as a tease because the price and the link
are right there. No action needed.

---

## Email 7 · What exactly is in the course

**Status:** final, Kaleen's edit of draft version B. Version A, which answers the
five questions outright, is archived in
[nurture-v2-email-7-drafts.md](../working-drafts/nurture-v2-email-7-drafts.md).

**Subject:** What you get for $39

**Preview text:** 8 modules in one hour of on-demand video

---

Hi {{ subscriber.first_name }},

My online course, The Making of a Reformer, covers how and why your machine works the way it does.  If you're wondering what exactly you get for $39, here's a quick overview.

**The parts.** Every component on a reformer, so you know their names and what they do.

**Springs.** The biggest module in the course. Not only do we cover Hooke's Law, but we dive into what factors influence how a spring feels, how springs age, and common safety hazards you need to know.

**Adjustments.** All the components on the machine that affect fit and spring stretch. 

**Pulleys.** Why "your client feels half the spring load" is half right, and a funny thing that happens when you get on and off the carriage while using the ropes.

**Friction.** The truth about how body weight and wheel design affect friction forces.

**Classical and contemporary comparison.** A level-headed look at materials and design differences between classical and contemporary reformers.

About an hour altogether, available the moment you buy, and you can take it in pieces. [CEC line goes here once confirmed.]

**$39 today,** then $69.

[Get The Making of a Reformer →](LINK)

Kaleen

---

### Before this sends

- **The preview text promises 8 modules and the email lists 6.** The spec does
  have eight (0 through 7), so the number is right about the product and wrong
  about the email. The two missing from the body are the introduction and the
  final module, "how we consider the body," which is the handoff. The spec calls
  that last one the best ending the course has, because closing on what the
  course does not cover converts better than a hard close and it preframes
  Pilates Physics 101 without pitching it. **Recommend adding it back as a
  seventh bullet** — something like "And the last one, on the single thing your
  reformer cannot tell you no matter how well you understand it." That gets the
  body to 7 visible plus an intro, which reconciles with the preview text.
- **"One hour of on-demand video" is not quite what the course is.** Per the
  spec's format column, module 4 is animation plus text and module 6 is a
  side-by-side comparison plus text. "An hour of on-demand video" oversells the
  video share. "An hour, on demand" or "8 modules, about an hour, on demand"
  fixes it without losing anything.
- **"Common safety hazards you need to know" runs against the spec's safety
  framing rule for module 2.** That rule is explicit: descriptive, never
  prescriptive, never "safe" or "unsafe," and point at each manufacturer's own
  guidance rather than inventing one. "Hazards you need to know" is a promise
  that the module tells people what is dangerous. Either soften the line to what
  the module actually does — "what to look for on your own springs, and when to
  call your manufacturer" — or accept that module 2 now has to deliver a hazards
  segment and reconcile the spec to it. **This is the one line in the email with
  consequences outside marketing.**
- **The pulley claim is new content.** "A funny thing that happens when you get on
  and off the carriage while using the ropes" is not in the spec's module 4, which
  covers the half-stretch relationship, where the load peaks, and whether pulley
  height matters. It is a good hook and it is the most curiosity-driving line in
  the email. It just needs to exist in the module, so add it to the spec.
- **"Wheel design affects friction" is a small extension** of module 5, which is
  specified as rolling vs starting friction, the direction reversal, and bearings
  as the design tie-in. Wheels and bearings are close enough that this is probably
  already true, but confirm the module names wheel design explicitly, since the
  email now promises it.
- **Two mechanical fixes made on the way in.** `**The parts. **` had a space
  inside the closing bold markers, which breaks the emphasis when rendered;
  removed. And "body weight and wheel design *affects*" is a compound subject, so
  it is now "affect." Revert either if they were deliberate.
- **`[CEC line goes here once confirmed.]` is a live placeholder,** same as emails
  4 and 6. Delete the bracket and write the line, or delete the sentence.
- **`LINK` is the same placeholder** and the same blocker as emails 4 through 6:
  the discount enforcement mechanism is still deferred in
  [the course spec](../working-drafts/reformer-machine-course-spec.md).
- **"$39 today" is deliberately vaguer** than email 6's "until tomorrow" and email
  8's "tonight," because the cart timeline is a separate pass. All three need to
  agree before any of them send.
- **No P.S.,** consistent with emails 4 through 6.

### What Kaleen's edit changed

**1. It is a syllabus now, not a payoff.** The draft version of B tied each module
to the question from email 6 that it settles. The edit keeps that only for
pulleys, where "why 'your client feels half the spring load' is half right" is a
direct quote of question 3, and implicitly for friction. The parts, springs, and
adjustments modules no longer point back at questions 1, 5, and 2.

That makes the email work standalone, which is the right call for the job it was
given — someone who skipped email 6 loses nothing. **What it costs is that email
6 now has no payoff anywhere in the sequence.** Five questions were asked, the
reader was told the answers are in the course, and no email ever returns to them.
That is a defensible sell, but it is worth deciding on purpose rather than by
subtraction. The cheapest fix is one clause per module, the way pulleys already
does it.

**2. It leads with the product name.** "My online course, The Making of a
Reformer, covers how and why your machine works" is the first opening in the
sequence that starts with the product rather than with an idea. Correct for this
email: the subject line asks what is in it, so the body should answer immediately
rather than warm up. Worth noting only because it is a deliberate break from
emails 1 through 6.

**3. "If you're wondering what exactly you get for $39" names the price in the
first line.** That is new and it is good on the last content day. It also means
the email is answering a value question rather than making an argument, which is
the correct posture this late.

**4. Three modules got sharper and two got shorter.** Springs, pulleys, and
friction all gained specific content. The parts and adjustments modules are now
one line each and are the least persuasive entries in the list. Adjustments in
particular is the module that carries the trickle-down hook, which is the primary
paid ad angle, and "all the components on the machine that affect fit and spring
stretch" undersells it. If any line gets another clause, that is the one.

### Carried over from the draft, still true

- **No tool is promised.** The spec's tool table lists the parts diagram,
  inspection checklist, brand comparison table, adjustment simulator, load curve
  animation, and worked friction math as still to build; only the spring
  calculator exists. The email names modules and no tools, which is what keeps it
  from writing a check launch day cannot cash. Do not add a tool to this list
  unless it is confirmed built.
- **No second product is named.** The classical and contemporary module is
  described neutrally, per the spec's neutrality watch, and Pilates Physics 101
  does not appear. Both correct for a closing day.

---

## Email 8 · Cart close

**Status:** final, Kaleen's edit of draft version A. Versions B and C are archived
in [nurture-v2-email-8-drafts.md](../working-drafts/nurture-v2-email-8-drafts.md),
along with the three longer cart-close drafts from when this job belonged to
email 7.

**Subject:** $39 ends at midnight

**Preview text:** After that the price goes up to $69

**Send time:** evening. The only evening send in the sequence.

---

Hi {{ subscriber.first_name }},

I just wanted to drop in real quick and remind you that your special $39 price for The Making of a Reformer goes away at midnight tonight.

[Get it now →](LINK)

Hope to see you in there.

Kaleen

---

### Before this sends

- **The body never says what happens after midnight.** The preview text carries
  it, and the preview text is the one line that is not guaranteed to be read: Kit
  shows it in the inbox, and a reader who opens from a notification or a threaded
  view may never see it. So the email a subscriber actually reads says the price
  "goes away" and stops there, which is the one reading that makes it sound like
  the course goes away too. **Recommend adding four words** — "goes away at
  midnight tonight. After that it's $69." That keeps it at three sentences, keeps
  the tone, and restores the spec's urgency lever, which is price only, all
  content always included. This is the sequence's own rule and it is the last
  chance to honour it.
- **The subject line buries the $39.** It is 56 characters, and most mobile
  clients cut somewhere around 35 to 40, which leaves "Last call to learn the
  mechanics of your…" — the price, which is the entire reason for the send, falls
  off the end. Front-loading fixes it without changing the thought: "$39 ends
  tonight: the mechanics of your reformer," or "Last call: your reformer's
  mechanics, $39."
- **"Midnight" is a placeholder** and it has to match whatever the cart actually
  enforces, with a timezone named if the list spans more than one. This is part of
  the timeline pass along with email 6's "until tomorrow."
- **`LINK` is the same placeholder** and the same blocker as emails 4 through 7:
  the discount enforcement mechanism is still deferred in
  [the course spec](../working-drafts/reformer-machine-course-spec.md).
- **Check Kit's send-time default.** This is the only evening send in eight
  emails. A list-wide morning default would override it silently and land this on
  top of email 7.
- **No P.S. and no CEC,** both consistent with emails 4 through 7 and both correct
  here. Anything more is a new argument at the wrong hour.

### Notes on the edit

- **It came in at about thirty words,** which is the brief. Emails 1 through 7 all
  argue something; this one does not, and the shift in register is the point. It
  reads like a person remembering to mention something rather than a close.
- **"Hope to see you in class" is the last line of the whole sequence,** and it is
  a warm one. Worth one thought only: the product is a self-paced video course, so
  "in class" could read as a live session to someone who has not looked at the
  sales page. "Hope to see you in there" removes the ambiguity if it bothers you.
  Otherwise it lands as ordinary Pilates-teacher warmth and is fine as written.
- **"I just wanted to drop in real quick" is the most casual opening in the
  sequence,** by a distance. Deliberate and right for a two-line evening send.

---

## After the sequence

Email 8 ends it. Per the funnel structure subscribers move to the main list, and
two things are undecided. Both sit outside this file, in
[the course spec](../working-drafts/reformer-machine-course-spec.md).

1. **Non-buyers.** They have had one offer and declined it. The spec puts the
   course back in front of them as a permanent $39 order bump at Pilates Physics
   101 checkout, which is the natural second chance.
2. **Buyers.** They should not drop into the main list cold. The spec has an open
   decision about where the course's same-day action goes, and a post-purchase
   email carrying the spring inspection checklist is one of the listed options.

**Nothing in the sequence teases what comes next,** because nothing is decided.
If a main-list newsletter follows, that transition is its own send rather than
something bolted onto the close.
