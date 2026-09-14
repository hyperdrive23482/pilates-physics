<!--
BLOG POST DRAFT. Seeded into the CMS by
supabase/migrations/052_blog_seed_personalization.sql as a draft.
There is no "new post" button in the admin UI: the blog-posts API has no POST
handler, so rows are created either by the content-piece approve flow (which
also schedules a Kit email) or by a seed migration like 052. Edit and publish
at /admin/content/blog-posts/:id.

CMS fields:
  Title:   Personalization in Pilates: everyone agreed, nobody said how
  Slug:    personalization-in-pilates
  Excerpt: Leaders at the Pilates Journal Expo agreed that personalization is what makes a
           studio endure. Nobody said how. It turns out to be two problems, and only one
           of them is teachable.
  Featured image: a wide shot from the Expo floor, or you teaching in a group setting.
           Alt: "Pilates instructors working together at an industry conference"
  Canonical: leave null. This one is native to the site.

ONE THING TO REPLACE BEFORE PUBLISHING:
  1. The honest-limit line in the Remo section is my best guess at your real
     constraint. Swap in the true one. It is doing real work for your credibility
     and a made-up limit is worse than none.

SEO notes (light touch, nothing stuffed):
  - Primary phrase "personalization in Pilates" sits in the title, the slug, the
    opening paragraph, and two H3s. That is enough. I did not force it further.
  - Secondary phrases that appear naturally: Pilates client progress, Pilates
    studio technology, adapting Pilates for different bodies, group class
    programming.
  - Internal links (9): /pilates-physics-101, /spring-calculator,
    /how-a-reformer-works, and six prior posts. Note that the Substack-mirrored
    posts carry canonical_url pointing at Substack, so these help readers and
    crawl paths but the ranking equity lands on Substack, not here.
  - Outbound links (3): the Expo homepage, the specific panel, and the AMA piece
    on ambient AI scribes. Stats in the tech section are from that AMA article
    (TPMG study, 7,260 physicians, Oct 2023 to Dec 2024): 15,700 hours saved,
    47 percent of patients reported less computer time, 39 percent reported more
    direct conversation. Verified against the source, safe to publish as written.
  - Headings carry the search intent: adapting Pilates for different bodies,
    tracking client progress, measuring progress, session notes for instructors.
    "Personalization in Pilates is two problems, not one" is left as written
    because it is already snippet-shaped.
  - Roughly 2,075 words, which is the range that holds up for this kind of query.
-->

I am home from Miami, still a little wrung out, and very glad I went. Meeting so many of you IRL after months of talking through a screen was the best part of the [Pilates Journal Expo](https://www.pilatesjournalexpo.com/). The second best part was what I heard from the stage.

It started on [a panel about growth, consolidation, and the next competitive era](https://www.pilatesjournalexpo.com/miami-schedule/pilates-scalegrowth-consolidation-next-competative-era), with the founders and CEOs of the companies that build most of the equipment we teach on. Then it kept happening. Panel after panel, industry leaders from the biggest brands landed on the same word. Personalization. It is what makes a studio endure. It is what clients will keep paying for in a market with a boutique reformer studio on every other corner. Not one person on any panel disagreed.

And then the conversation moved on, because nobody asked the next question. How?

Before I go further, you should know where I'm coming from. Personalization is what I teach through my Pilates Physics workshops and enable with Remo.

### What personalization in Pilates means right now

Right now, in most studios, personalization means something specific and fairly small. It means you remember that your nine o'clock client had a kid with a basketball game last weekend, and you ask how it went.

This is an often-cited example of making people feel seen.

Feeling seen like that matters. It is the reason someone drives past two other studios to get to yours. Plenty of businesses never build it, and the teachers who are good at it are doing something real.

It is also the entry fee. It is the part of personalization our industry has already solved. If the whole strategy for the next decade is "remember the kid's name," we have set the bar at the floor and called it the ceiling.

There is a quieter cost too. When the relationship is the only thing we personalize, we tell clients something we do not mean: that the expertise is not really the product. That they could get the same hour from anyone warm.

People do not come to us only for the warmth. They come to learn about their bodies, to move them, to understand them, to change them. They want their bodies seen, not just their weekends.

So what does it take to actually see the body?

### Personalization in Pilates is two problems, not one

This is the part I have been chewing on since the flight home. Personalization is not a single thing we are all failing at. It is two different problems that happen to share a name, and they need completely different solutions.

The first one lives inside the hour. The second one lives between hours.

### Problem one: how to adapt Pilates for different bodies in the same class

This is the personalization that happens in the room, in real time, and it shows up in two places.

**Programming that layers instead of resetting.** Most group classes are built as standalone events. Everyone arrives, everyone does the thing on the same settings, everyone leaves, and next week starts over from zero. A class that personalizes is a step in a sequence, which is a different way of [engineering class flow](/blog/the-pilates-class-algorithm) than most of us were handed in training. The same exercise offers two or three honest entry points that meet individuals where they are, chosen on purpose rather than memorized. None of those entry points is the lesser one, because [easier does not mean they are doing it wrong](/blog/just-because-it-is-easy-doesn-t-mean-they-re-doing-it-wrong). This means the person in their fourth month is not doing the identical class they did in their first, even though they are in the same room at the same time.

**Equipment adjustments and load.** Bodies differ. Limb length, torso length, where someone's weight actually sits, all [interact with the reformer](/how-a-reformer-works) to create a unique exercise load. Two people on the same spring setting are not doing the same exercise, and [a spring is not one weight to begin with](/blog/a-spring-is-not-one-weight). You can [run the numbers in the spring calculator](/spring-calculator) if you want to see the gap for yourself. If you can see what the load is really doing in that position on that body, you can adapt on the fly for whoever walks in.

Here is the good news about problem one: it is a skill. It is learnable. It comes from understanding what the load is doing rather than memorizing which setting goes with which exercise, and once you can see it you can adapt for a body you have never taught before. That is the entire reason I built [Pilates Physics 101](/pilates-physics-101).

### Problem two: how to track Pilates client progress between sessions

Now the half I cannot teach my way out of.

Everything in that last section happens in the moment and stays there. Nothing about being a responsive teacher carries anything forward on its own. The setting or adaptation you found in March is gone by May, and it never becomes evidence of progress.

Real personalization across time means knowing what they did last session, and the ten before that, and using it to build the next one. It means noticing that the thing you dropped six weeks ago because it was not available to them is available now.

And this is not a skill problem. No amount of study fixes it. You can be the most adaptive teacher in the building and still lose the thread, because in the moment you are teaching, not recording. You have your hands on someone. You are watching a carriage. You are not writing anything down (you shouldn't have to).

Problem one you solve by learning. Problem two you solve by having a system, and almost none of us have one.

### Why Pilates clients never see their progress

Here is how that gap shows up for the client.

A runner gets a pace graph. Someone who lifts weights gets reps, sets, and load over time. Both are written down, trending in a direction they can see.

This is evidence. On the month they are looking at their bank statement deciding what to cut, the evidence argues on their behalf.

Pilates gives them a good feeling and a see you next week. The closest our industry has come to a number is [the Pilates metric Whoop built with solidcore](/blog/whoop-x-solidcore-smart-innovation-or-marketing-hype), and I had real reservations about that one.

That costs us twice. The client has nothing objective to point at, which means the value of what you deliver lives entirely in how they happen to feel that week. And the field itself is hard to study, because the way any two of us teach the same exercise barely matches, which is a whole separate post.

Imagine instead that a client finished their tenth session and you sent them something concrete. Here is what you were working with when we started. Here is what you are working with now. Here is what changed, specifically.

That does two jobs at once. It validates them, which feels good and is worth something on its own. It also validates you. It makes the thing you actually delivered visible, in a form that survives the month they are deciding what to cut. [Retention is the number that decides whether a studio lasts](/blog/unlocking-pilates-studio-business-success), and it sits downstream of whether people can see what they are getting.

To be clear about what I am not arguing: I do not want to turn Pilates into a metric. So much of Pilates is tied to feel. I get it. But objective improvements happen, and instructors notice them in the moment. Then they dissolve into the general good feeling of the session, and nobody writes them down.

I am not asking anyone to chase a number. I am asking that what already happened in the room stop evaporating the second the session ends.

So why has nobody built this? That brings me to the other thing I heard in Miami.

### Pilates studio technology: replace, or remember

From the stage: "We are a people business." Applause from the room plus a few hoots. True, and worth the applause.

Then, in the same breath: "Technology separates us from people." More applause.

The first half is right. The second half puts two very different things in one box, and I think that is costing us. It is the [thing we keep getting wrong about tech in Pilates](/blog/what-everyone-gets-wrong-about-tech-in-pilates), and I am going to keep saying so.

Technology that replaces the expert does separate us. A screen that tells someone what to do instead of a teacher watching them do it, that is a real thing and it is worth being clear about the tradeoffs. Perhaps convenience for connection.

Technology that remembers for the expert does the opposite.

The clearest example I know is what happened at the doctor's office. Ambient charting tools now listen to the visit and write the notes, and nothing about the appointment got replaced. What changed is that your doctor stopped typing. They looked at you for the whole twenty minutes. The technology did not come between you, it gave you back eye contact.

This is measured, not anecdotal. Across 7,260 physicians at one medical group, [AI scribes saved more than 15,000 hours of documentation in a single year](https://www.ama-assn.org/practice-management/digital-health/ai-scribes-save-15000-hours-and-restore-human-side-medicine). Nearly half of their patients said their doctor spent less time looking at a computer during the visit, and close to four in ten said their doctor spent more time speaking directly with them.

That is not a small distinction. That is the entire distinction.

And honestly, we already know this. Event technology is the reason several hundred of us were in one room in Miami at all. Instagram is the reason we already knew each other's faces when we got there, and it is the reason those conversations are still going now that we are scattered across the country again. You can argue about what a phone does to a dinner table. You cannot argue that it did not bring this particular group of people together.

Memory, recording, and progress reporting are precisely the parts of personalization that do not scale on willpower. Nobody is going to out-discipline this problem. That is what augmentation is for.

### Remo: session notes for Pilates instructors

This is the problem I could not stop thinking about, so I made Remo.

It listens while you teach and writes down what you actually did. The exercises, the settings, what you changed and for whom. It holds the feedback in both directions, what you told your client and what they told you. Over a run of sessions it turns into the progress report you could not send before.

The point of it is you never have to stop looking at your client in order to write something down. You get the most detailed notes with a click of a button, and you don't need to spend 15 minutes per client manually writing what you remember down and another 10 before the next session searching for that one note you think you might have made but don't remember when.

What it is not: it is not a teacher. It does not decide what your client should do next. That judgment is yours. Remo reflects back what happened in the last sessions so you can make the call on what to do today with better information than just your memory of a Tuesday three weeks ago.

If that sounds useful, [take a look at Remo](https://remopilates.com).

### What I want more of

The two halves of what's required for a personalized experience: learn to see what the load is doing, and you can adapt for anyone who walks into the room. Keep the thread across sessions, and you can show someone what a year with you actually did.

The weekend in Miami was worth every hour. Moving with other teachers, talking about the business and the teaching and what is actually happening in this industry, that is the part the internet cannot give you.

The conversations I want more of are the ones about layering and progression, about adapting for bodies that are built differently than our training manuals, about what the scientific evidence does and does not support. A lot of that conversation is already happening online, in comment sections and group chats and long threads between people who have never met in person.

It belongs in the room too. I would like to help bring it there next year.
