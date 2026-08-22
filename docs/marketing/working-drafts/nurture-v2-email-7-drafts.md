# Nurture v2, Email 7: what exactly is in The Making of a Reformer

**Version B was selected and edited by Kaleen. The final copy lives in
[current-copy/nurture-v2.md](../current-copy/nurture-v2.md).** A is kept below as
archive. Kaleen's edit dropped most of the callbacks to email 6's five questions,
so the answer table below is now reference material for the course rather than a
description of what shipped.

Email 7 of the eight-email sequence.

**Position:** day 3, morning. Cart closes tonight. Email 8 follows the same
evening.

> **This email replaced the cart close on 2026-08-21.** Email 7 used to be the
> "closing tonight" reminder. That job moved to the new email 8, and the three
> old cart-close drafts moved with it to
> [nurture-v2-email-8-drafts.md](nurture-v2-email-8-drafts.md). Email 7 is now a
> content email.

## The job

Email 6 asked five questions and did not answer them. This email is the payoff:
what is actually in the course, told by answering those five.

That structure does three things at once. It cashes email 6's tease, so the quiz
does not read as bait. It proves the course is substantive, because each answer
is surprising enough that the reader wants the rest. And the syllabus emerges
from the answers rather than being recited, which means the reader gets a module
list without having to read a module list.

**This is the last content email in the sequence.** Everything the offer has to
argue, it argues here. Email 8 is a deadline and nothing more.

## The five answers, and what each one is sourced from

Every claim below traces to
[reformer-machine-course-spec.md](reformer-machine-course-spec.md). None of them
are in the spring calculator, so **Kaleen has to sign off on all five before this
ships.** The two flagged as unconfirmed are the ones to read hardest.

| Q | Answer in one line | Module | Source, and confidence |
|---|---|---|---|
| 1. Lower the footbar one notch | The spring load does not change at all. The footbar is not attached to the springs | 1, anatomy | Module 1's stated job is "which parts change load and which do not." Physically sound: spring stretch tracks carriage position, and the footbar does not move the carriage. **Confirm the framing is how you teach it** |
| 2. Gear bar out one notch | Starting stretch goes up, so the carriage is loaded before anyone touches it, and every load through the press goes up with it | 3, adjustments | The spec's adjustment simulator is specified as "move a gear bar, watch starting stretch and total load change." Solid |
| 3. The pulley halves the load | Half true. The halving applies to one of the two things people think it applies to | 4, pulleys | Spec: "Why 'half' is half true, and where the load actually peaks." **Deliberately not spelled out in the draft copy, because the spec does not resolve which half.** Sharpen once module 4 is written |
| 4. Heavier client, more friction | False on a maintained machine. Rolling friction barely moves with added weight, and friction reverses direction with the carriage | 5, friction | Spec's five-beat worked argument, including the reversal and the maintained-machine caveat. Solid |
| 5. Why manufacturers say replace springs | Past a point a spring takes a permanent set, and after that Hooke's law stops describing it and the color stops meaning what it did | 2, springs | Spec: elastic vs plastic deformation, where Hooke's law stops applying, plus the color-loss anecdote. Solid |

**Question 5 is under the spec's safety framing rule.** Descriptive, never
prescriptive. No invented interval, no "safe" or "unsafe," and point at the
manufacturer's own guidance. Both drafts follow it. Do not edit an interval in.

**Question 1 is the one I would check first.** It is the only answer that is
flatly "nothing changes," and if Kaleen teaches footbar height as a load
adjustment for any reason the calculator does not model, the answer inverts.

## What must not go in

- **Do not promise a tool that will not exist at launch.** The spec's tool table
  lists the parts diagram, inspection checklist, brand comparison table,
  adjustment simulator, load curve animation, and worked friction math as **to
  build.** Only the spring calculator exists. Both drafts name the modules and
  stay off the tool list for exactly this reason. If a tool is confirmed built,
  add it; do not add it on the assumption it will be.
- **Do not assert the CEC.** Same placeholder as emails 4 and 6.
- **Do not re-run the objection.** Email 6 handled "I already know my machine."
  Running it again on the last content day reads as pleading.
- **Do not name a second product.** Module 7 hands off to Pilates Physics 101,
  and naming it here starts a second sale on a closing day. Both drafts describe
  module 7 without naming 101.

---

## Version A: "The answers" (not selected)

Runs the five questions in order, answers each in two or three lines, and lets the
module list assemble itself out of the answers. Closest to what was asked for, and
the strongest of the two, because every answer is a small reversal and five small
reversals in a row is the best argument this product has.

**Subject line options**
1. What exactly is in The Making of a Reformer?
2. The answers to yesterday's five questions
3. Answers, and what else is in there

**Preview text:** All five, plus the rest of what an hour buys you.

---

Hi {{ subscriber.first_name }},

Yesterday I asked you five questions and did not answer any of them. Here they are, and here is where each one lives in the course.

**One. You lower the footbar one notch. What happens to the spring load?**

Nothing. The footbar is not attached to the springs, so the load at any point on the carriage is exactly what it was before you moved it. What changes is the angle your client presses at and where their range starts and stops. Both of those change what they feel, and neither of them is load.

Knowing which parts of your reformer change load and which only change the feeling of it is the whole first module.

**Two. You move the gearbar out one notch. What else changes because of that?**

The springs are already stretched before anybody lies down. So the carriage is loaded at the start, it is loaded harder at the end, and the amount of effort it takes just to break the carriage away from the stopper goes up. One notch, and the whole shape of the movement is different.

That is module three, which walks every adjustment on the machine and what each one does to spring stretch, with nobody on it.

**Three. The rope runs through a pulley, so your client feels half the spring load. True or false?**

Half true, which is the most annoying possible answer. Something in that setup really does get halved. It is not the thing most people think, and once you know which one it is, you also know where the load actually peaks during the movement, which is not where it feels like it does.

Module four, with the load drawn out across the full travel of the carriage.

**Four. A heavier client makes the carriage significantly harder to push, because of friction. True or false?**

False, on a machine that is maintained. The friction does go up. It goes up by an amount so small it disappears next to the springs. And here is the part almost nobody mentions: friction reverses direction when the carriage does, so it is not even working against your client the whole time.

Module five is that argument worked all the way through, including the one situation where you genuinely would notice it.

**Five. Why do manufacturers recommend replacing your springs so often?**

Because a spring that gets stretched far enough, often enough, stops coming all the way back. Once it takes that set, the math that describes a spring stops describing that spring, and the color on it stops meaning what it meant when it was new.

Module two is the biggest one in the course. Spring anatomy, what actually makes a spring stiff, how springs age, how brands differ, and what to look for on your own before you call your manufacturer.

---

There are three more modules I did not need for the quiz. One on the parts of the reformer and what each one is for. One on classical versus contemporary, where the physics takes no side at all. And one at the end on the single thing the machine cannot tell you, no matter how well you understand it.

The whole thing is about an hour, it is available the moment you buy it, and you can watch it in pieces. [CEC line goes here once confirmed.]

**$39 today.** After that it is $69.

[Get The Making of a Reformer →](LINK)

Kaleen

---

## Version B: "Here is the whole thing" (SELECTED, final copy in current-copy)

The syllabus version. Walks the course module by module in order and mentions
which of yesterday's questions each one settles, without giving the answers.
Pick this if the answers do not survive Kaleen's physics review, or if giving
five answers away on the last day feels like too much.

**Subject line options**
1. What exactly is in The Making of a Reformer?

**Preview text:** 8 modules in one hour of on-demand video

---

Hi {{ subscriber.first_name }},

My online course, The Making of a Reformer, covers how and why your machine works the way it does.  If you're wondering what exactly you get for $39, here's a quick overview.

**The parts. ** Every component on a reformer, so you know their names and what they do.

**Springs.** The biggest module in the course. Not only do we cover Hooke's Law, but we dive into what factors influence how a spring feels, how springs age, and common safety hazards you need to know.

**Adjustments.** All the components on the machine that affect fit and spring stretch. 

**Pulleys.** Why "your client feels half the spring load" is half right, and a funny thing that happens when you get on and off the carriage while using the ropes.

**Friction.** The truth about how body weight and wheel design affects friction forces.

**Classical and contemporary comparison.** A level-headed look at materials and design differences between classical and contemporary reformers.

About an hour altogether, available the moment you buy, and you can take it in pieces. [CEC line goes here once confirmed.]

**$39 today,** then $69.

[Get The Making of a Reformer →](LINK)

Kaleen

---

## Notes

- **Version A is the recommendation** and it is the one that matches the brief.
  Five reversals in a row is a stronger argument than a syllabus, and every one of
  them opens a door the course walks through rather than closing one.
- **Version A's risk is that it satisfies somebody.** A reader who wanted the five
  answers now has them. That risk is smaller than it looks, because each answer is
  the headline and the course is the reasoning, but it is real and it is the
  reason version B exists.
- **Version B ships without a physics review.** It names what each module settles
  without asserting any of it. If Kaleen's sign-off on the five answers is going
  to take longer than the cart, B is the safe send.
- **Both leave the tool list out.** See the "what must not go in" section. This is
  the single most likely way for this email to promise something the product does
  not deliver on launch day.
- **Neither has a P.S.,** consistent with emails 4, 5, and 6.
- **Both say "$39 today."** That is deliberately vaguer than email 6's "until
  tomorrow" and email 8's "tonight," because the cart timeline is being settled
  separately. Once it is, make all three match.
- **Module numbers are not used in the copy.** The spec numbers them 0 through 7;
  the emails describe them instead. Keep it that way unless the sales page numbers
  them, in which case match the sales page.
