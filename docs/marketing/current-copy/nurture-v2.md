# Nurture v2 (Nikki structure)

The five-email sequence outlined with Nikki in
[funnel-strategy-nikki-session.md](../funnel-strategy-nikki-session.md). Follows the
Spring Load Calculator lead magnet. One idea per email, and the problem is not
solved until email 4.

| # | Beat | The move | Status |
|---|------|----------|--------|
| 1 | POV / root belief | A spring is not one weight | **Final** |
| 2 | The enemy | "If you don't feel it, you're doing it wrong" | **Final** |
| 3 | The misdiagnosis | You think the problem is how you explain it | **Final** |
| 4 | The real diagnosis | The machine is the lever, and you were handed two of its dials | Not drafted |
| 5 | Origin story + scar reel | How Kaleen got here, what she got wrong, and that she designed a reformer | Not drafted |

> **The tripwire changed, and the sequence was re-aimed for it.** Emails 1
> through 3 were written when the tripwire was Nikki's body weight mini course.
> It is now
> [The Making of a Reformer](../working-drafts/reformer-machine-course-spec.md),
> a machine-only course that keeps the body out on purpose. Email 3's body
> weight seed was replaced with a machine seed, and email 4 was redrafted from
> scratch. Emails 1 and 2 needed no change: email 1 is already a pure machine
> story, and email 2's enemy beat is product-agnostic.
>
> **Email 5 now carries a second job.** The course's entire moat is that Kaleen
> designed a reformer, and that fact currently appears nowhere in this sequence.
> The origin story is the last email before the cart opens, so it is the only
> place left to plant it. All three email 4 drafts end on "what it eventually
> turned into" to hand it that setup.

**Cadence:** day 1, 3, 5, 8, 11 assumed, and nothing in the copy depends on it.
No email names a day of the week. They point back with "last email" and forward
with "next time," so the drip schedule can be changed without a copy edit. Keep
that pattern in emails 3 through 5. The rule lives in
[voice-and-messaging.md](../voice-and-messaging.md).

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

You have taught this duet.

She is five foot one. He is six foot tall. They booked together, they are on matching reformers, and you set them both to your standard footwork springs.

Two sets in, he is feeling the burn and she is casually chatting with you about their weekend.

She jokes that he really needs more Pilates to get stronger.

For a long time I assumed that he was really just not grasping the work.

That's not it at all.

A spring is not one weight. It gets heavier the further it is stretched. And they were each extending the springs very different amounts.

He presses out to straight legs, stretching the springs about 21 inches. She presses out to straight legs, creating the same shape, but the carriage travels only 13 and a half inches.

On my baseline Balanced Body footwork springs (red, red, green), they experience a difference in resistance of more than 20 pounds at full extension.

Even gearing him out one slot (or lowering his footbar) keeps the maximum load gap at 14 pounds.

They were on the same springs, but never had the same experience, no matter what my training manual said.

There is a thing we say to clients in exactly this moment, when the setting is right and the person still cannot feel it. I want to talk about that one next time, because I think it is the most quietly harmful sentence in this industry.

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

Here is the sentence I promised you.

*"If you don't feel it, you're doing it wrong."*

I have said it. You may have said it. It gets said in studios every day, by teachers who are good at their jobs and care enormously about the people in front of them.

And look at what it actually does.

A client tells you they are not feeling footwork where you want them to. That is real information about their body, offered to you honestly, which is exactly what you want from a client.

And the sentence takes that information and hands it straight back to them as a personal failing. Not "something is off in the setup." Something is off in you.

So they stop telling you. They decide they are bad at this, or that their body is the problem, and maybe they even stop coming. You have lost the chance to continue sharing the magic of Pilates with them.

Now put that next to the duet we talked about last email. She is five foot one on the same springs as the six foot man beside her, which means she is genuinely, measurably on a lighter load than he is. She is not doing it wrong. She is doing it correctly against less resistance.

The sentence is not cruel. It is just incomplete. It is what you say when memorized settings are the only information you have, because if the setting is right and the feeling is missing, the person must be the variable, right?

The person is not the only variable to consider.

So what do we reach for instead? Almost all of us reach for the same thing, and I think it is often the wrong thing. That is next time.

Kaleen

P.S. Hit reply and tell me the line repeated over and over in our industry that makes you wince. I am collecting them, and this one is not the only one.

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

Here is the thing almost all of us reach for.

A client says they cannot feel footwork in their legs. So you say it again, differently.

Press through the whole foot. Then, imagine you are pushing the wall away. Then you get more anatomical, because maybe they need the detail. Then you get more poetic, because maybe they need the image. Then you demo it. Then you put a hand on their leg to cue it by touch.

And sometimes that works. Sometimes a different version of a cue is the one that lands, they light up, and it really was a communication problem. That happens, and it is worth being good at.

But sometimes you go through all six of those and they say "oh, maybe, a little," which you both know is what people say when they want to move on.

That is the moment I want to talk about, because that is where most of us conclude we need better words.

I want to be clear that reaching for words is not a failure of skill. That escalation is a teacher being good at their job. You had a client who was not getting a result, and you cycled through every tool you had.

It is just that all six of those tools were different versions of the same tool.

And you already know from the duet we talked about earlier what they may be up against. A smaller person on the same springs as the larger person beside them is working against genuinely different resistance. Not a little different. Meaningfully different.

Now, a cue can change the sensed load in two ways. If your words change how far they travel, the load changes with them. Or you could cue them to make a different shape with their body, which creates different loads not directly related to spring tension.

Both are valid adjustments.

What a cue cannot do is close a gap that large.

It cannot change where on that spring's climb your client is starting from. It cannot move the gear bar or the footbar. It cannot change what the machine is already doing before anyone lies down on it.

Even when maximum load is not the goal, the spring is still doing a job of its own. A cue sends information to your client's ears. The spring sends it straight through their body. Some people need more of that input before the work registers, and some need less.

So you can cue them beautifully, and they can execute it beautifully, and they will be beautifully performing an exercise that is still too light for them to feel it as much as you want them to.

None of this means your cueing is the problem. Cueing is the skill you have, so it is the skill you reach for, including in the moments when the thing standing between them and the sensation is not a sentence. It is a number.

Which raises the obvious question. When words are not the lever, what is, and what do you do the next time a client tells you they cannot feel it?

That is next time, and it is the email this whole thing has been building toward.

Kaleen

P.S. This week, if someone is performing the exercise well but doesn't feel it, ask yourself whether changing the load might be the next experiment to try and help them feel something different.

---

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
