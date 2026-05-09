-- ============================================================
-- Pilates Physics: Content Seed — Blog posts (mirror)
--
-- Mirrors 17 historical Substack posts into both:
--   blog_posts    (status='published', canonical_url=Substack URL)
--   brain_entries (type='blog_post', is_active=true)
--
-- The Substack URL is preserved as canonical_url so SEO duplicate-
-- content risk is mitigated when these are also rendered on the
-- site. New posts created via the CMS pipeline leave canonical_url
-- null (their canonical IS the site).
--
-- Idempotent: a temp table feeds two ON CONFLICT DO UPDATE inserts.
-- Same body text lives in both tables: brain_entries feeds the
-- Claude system prompt for voice context; blog_posts renders on
-- the public blog.
-- ============================================================

create temp table _blog_seed (
  slug text primary key,
  title text not null,
  subtitle text,
  body text not null,
  published_at date not null,
  substack_url text not null
) on commit drop;

-- Posts will be inserted below in chronological-reverse order
-- (newest first), matching the source file order.

insert into _blog_seed (slug, title, subtitle, body, published_at, substack_url) values

-- ===== POST 1 =====
('the-myth-of-the-perfect-pilates-machine',
  'The Myth of the Perfect Pilates Machine',
  'Joseph Pilates built with the materials he had available, and if alive today would almost certainly do it differently',
  $body$There is a tendency, when we look back at the work of an innovator, to treat every decision as intentional and optimal. The tools they used, the materials they chose, the proportions they landed on: all of it gets gilded over time into received wisdom, then doctrine, then dogma. Joseph Pilates is no exception.

Here's the reality: Joe was a craftsman operating in New York from the late 1920s through the 1960s, building equipment from what he could source locally, what a machinist could fabricate without special tooling, and what held up to daily use in a studio. The equipment he built reflected genuine ingenuity and genuine constraint. Separating those two things matters a lot if we want to understand what was principled design and what was simply the best available option at the time.

The overarching story across some of his key material choices (springs, straps, and wheels) is one of cost and availability. That doesn't diminish the work. It is, in fact, how most great design happens. But it should temper the fervor at which we, as Pilates professionals, stick to industry lore.

### Springs were already widely available and popular in fitness

The origin story most people know is that Joe attached springs to hospital beds during his WWI internment on the Isle of Man, a piece of adaptive genius that became foundational to his entire equipment system. That story is probably true. But those bed springs and the springs that ended up on his mature apparatus are almost entirely different objects, and the gap between them is worth examining.

Spring-based chest expanders were popular exercise tools since the 1880s, used by strongmen, physical culturists, and mainstream fitness enthusiasts. Eugen Sandow, the dominant figure of the physical culture movement Joe trained within, marketed and endorsed them. They were not novelties. They were culturally relevant fitness equipment.

Chest expander springs were tension springs designed to stretch under load along a linear axis, which is exactly the loading pattern of a reformer spring. They were sold in graduated resistance levels, meaning there was already a commercial ecosystem of calibrated spring tension for body-load applications. They were built to survive thousands of stretch-and-return cycles. And they were available through any sporting goods store in New York.

Beyond chest expanders, the automotive industry had created a vast ecosystem of extension springs by the 1920s. Industrial scale and weighing equipment used calibrated springs. New York's light manufacturing district supplied springs to the garment and printing trades. By the time his equipment was maturing in the late 1930s, it's quite possible Joe was having springs custom wound to specification by a local spring shop, a straightforward and inexpensive process in a city full of small manufacturers.

Some design aspects of the spring would have been customizable and some not (without lots of extra cost), and he had to work within the constraints of his supplier. The "classical" spring weights that some teachers treat as sacred may reflect what was available from a Manhattan industrial supplier in 1940 as much as any deep biomechanical principle.

### Leather straps were the best material available

Of all his material choices, leather straps are perhaps the most misunderstood. At the time, they were easy to make custom locally and had the best properties of any rope-like option around.

Nylon was not commercialized until 1938. Woven nylon webbing, which is the most common rope for contemporary machines nowadays, came largely out of WWII military surplus afterward. For most of Joe's formative years of equipment development, nylon webbing simply did not exist as a practical option.

And, while natural fiber ropes (manila, hemp, sisal, cotton) were widely available and used in gym culture and sailing, they weren't the right choice for Joe's application either. Natural fiber stretches (not elastically like springs) but it creeps and elongates under sustained load. It changes dimensionally with humidity, often swelling when damp and shrinking when dry, which in a New York studio means your apparatus behaves differently in summer than in winter. Plus, it frays at attachment points under repeated cycling.

Leather, by contrast, stretches very little, is relatively stable across humidity ranges, and wears predictably. For a precise application where geometry and resistance matter, leather was genuinely superior to the available rope options at the time.

### Why reformer wheels used bushings not bearings

Ball bearings existed throughout Joe's entire life, well established by the 1880s. This was not a technology gap. It was an economics and supply chain gap, sharpened dramatically by wartime conditions.

Ball bearings were precision manufactured items, expensive and sourced from specialized industrial suppliers. During both World Wars, they were heavily rationed and prioritized for military equipment. Aircraft, tanks, and artillery consumed ball bearing production. A studio owner in New York trying to keep his apparatus running during WWII would have found precision bearings genuinely difficult to source at any price.

Bushings, a simple sleeve of bronze, brass, or hardened steel around an axle, were dramatically cheaper, easier to fabricate locally, and required no specialized supplier. A machinist could make a bushing. Ball bearings required a factory.

For the relatively slow rotational speeds and light loads in Joe's equipment, bushings were perfectly adequate. The choice reflects a craftsman's pragmatism, not an inability to conceive of a better solution.

### Constraint and Innovation go hand-in-hand

The pattern across springs, straps, and bearings is consistent: practical constraints shaped the outcome as much as any design philosophy.

Like all innovators, though, Joe didn't design and build in a vacuum. His designs reflect the cultural influences and material sourcing conditions of his time just as much as his "genius."

The preservation of Pilates history should not be viewed with rose-colored glasses and blinders. Yes, Joe had a bold vision and brought it to life in such a way that millions of people love today. But also, he had real world constraints that shaped his design decisions.

Would he design his equipment the same way today? Maybe. Maybe not.

Understanding the constraints that shaped that equipment design is not a diminishment of his genius. It is the most honest way to honor it.$body$,
  '2026-03-10',
  'https://kaleenc.substack.com/p/the-myth-of-the-perfect-pilates-machine'),

-- ===== POST 2 =====
('what-makes-pilates-so-effective',
  'What Makes Pilates So Effective?',
  'Breaking Down the "Magic" of Pilates',
  $body$When I was pitching my last tech company to venture capitalists, they would often ask me the same question: What makes Pilates different? Why should we care? I would start explaining the method, the equipment, the community, the results but I knew something deeper was at stake. If they didn't understand the magic of Pilates, they would never invest in it.

And I use the word magic intentionally. Because when Pilates is done well, that's what it feels like. It's hard to quantify, hard to package, and yet deeply obvious to anyone who has experienced it. So let's try to unpack it.

In my mind, the magic of Pilates comes down to three components: Mental, Educational, and Physiological. All three matter. All three overlap. And together, they create something that's more powerful than any one piece alone.

### The Mental Component of Pilates

The first layer of Pilates magic is psychological. While this isn't unique to Pilates, it's something Pilates does exceptionally well when it's coached with intention.

A good Pilates class makes people feel welcome and included. It challenges them without overwhelming them. It gives them something to work toward while still allowing them to feel successful in the moment. That balance — hard but doable — is incredibly motivating.

Motivation in fitness isn't about how destroyed you feel at the end of a workout. It's about whether you come back. When someone feels both challenged and capable, they're far more likely to stick with it. And consistency, more than intensity, is what produces meaningful results over time.

There's also something quietly powerful about the pride that comes from caring for your body. Pilates often creates a space where people feel like they're investing in themselves in a thoughtful, intelligent way. That mental reinforcement is part of what keeps the practice sustainable.

### The Educational Power of Pilates

This is where Pilates begins to differentiate itself more clearly. While any movement method can be educational, Pilates is structured in a way that naturally encourages learning and awareness.

One of the reasons is pace. Pilates frequently moves more slowly than other fitness modalities, and that slower pace forces attention. You notice how you're moving. You notice what feels strong, what feels shaky, what feels unclear. That awareness is built into the philosophy of the method.

If you think about the conscious competency model (a framework that explains how we learn new skills) Pilates lives right in the transition between "conscious incompetence" and "conscious competence." First, you realize you're not doing something optimally. Then, with focused repetition and cueing, you begin to refine it. Eventually, better movement becomes automatic.

Pilates fosters that progression beautifully. It encourages students to pay attention to subtle shifts, to explore small adjustments, and to stay curious about their bodies. When coached well, it doesn't create fear around "right" and "wrong," but instead invites experimentation and refinement.

For many people, this is the first time they've been asked to truly pay attention to how their body moves. That awareness spills into everyday life. It helps people distinguish discomfort from pain, fatigue from injury, tension from instability. It reduces fear of movement and builds confidence.

For me personally, Pilates was the foundation for developing body awareness that changed far more than my workouts. It shifted how I sat, how I breathed, how I moved through the world. That educational layer is deeply transformative.

Another aspect of Pilates that contributes to its educational effectiveness is how scalable it is. The reformer, for example, offers support that makes strength training accessible to people who might struggle on the mat. Instead of feeling crushed by their own bodyweight, they can build strength progressively with assistance.

At the same time, Pilates on a reformer can become extraordinarily challenging. We can add resistance, remove stability, or increase complexity. A movement can evolve from basic to advanced through thoughtful layering.

While other fitness methods can also scale, Pilates is culturally known for it. It has a reputation for being low impact and adaptable, which makes it more approachable for many people. That accessibility, combined with intelligent progression, is part of its staying power.

### The Physiology of Pilates: What It Is (and What It Isn't)

Now let's talk about the physiological component, because this is where the conversation often gets muddled.

First, Pilates is not cardio. It does not meaningfully train your cardiovascular system in the same way running, cycling, or rowing does. That doesn't make it ineffective. It simply means heart rate is not the primary lens through which to measure its value.

Using heart rate as a metric for Pilates effectiveness misses the point. Even if your heart rate increases during a class, that's not the core adaptation being trained. Treating heart rate as the catchall proof of value reduces Pilates to something it was never designed to be.

So what is happening physiologically?

**1. Strength.** Pilates absolutely builds strength. While it may not always look like traditional progressive overload, there is progression happening. Movements evolve from supported to unsupported, from stable to unstable, from simple to complex. We don't yet have perfect data language around spring tension, lever length, and load differences between individuals. But even without precise metrics, strength gains are real. The challenge for the future of Pilates is learning how to measure them more objectively without losing the art of the method. This measurement will help teaching progressively become more standardized and common, and vastly improve the research quality on the efficacy of Pilates.

**2. Balanced Muscle Development.** One of Pilates' greatest strengths is its emphasis on balanced muscle development. It gives attention to the muscles you don't see in the mirror just as much as the ones you do. It encourages movement in all planes and reinforces side bending and rotation alongside flexion and extension. This focus on balance is baked into the philosophy of the method. Many fitness programs allow imbalance to develop easily. Pilates actively works against it, which contributes to that overall feeling of standing taller.

**3. Breath and Nervous System Regulation.** Breath is central to Pilates. Joseph Pilates' principles (concentration, control, consistency, precision, flow, and breath) were not accidental. Coordinating breath with movement over the course of a session has meaningful nervous system implications. Deep, intentional breathing stimulates the vagus nerve and supports regulation of the stress response. Pilates is not a bracing practice; it's a breathing practice. For many people, that creates a moving meditation effect that benefits both mental and physical health.

**4. Mobility.** Pilates builds mobility, not just flexibility. Flexibility is passive range. Mobility is strength and control throughout that range. Pilates frequently challenges end ranges of motion under load, which builds usable capacity. This is one reason Pilates works so well as cross-training for athletes. It develops control across planes of motion and strengthens ranges that often get neglected.

**5. Body Awareness.** Finally, Pilates strengthens the connection between the brain and body. That might not sound impressive at first, but it's one of the most transferable skills you can develop. Improved body awareness helps people notice posture, compensation patterns, tension, and fatigue. It builds autonomy. It fosters confidence. And it changes how someone inhabits their body outside the studio. You only get one body in this life. Deepening your awareness of it is invaluable.

### The Real Magic of Pilates

So what makes Pilates so effective? It isn't just strength. It isn't just mindfulness. It isn't just mobility. The magic of Pilates lives at the intersection of mental engagement, educational progression, and physiological adaptation.

When those three layers overlap, something powerful happens. People don't just get stronger, they become more aware, more confident, and more connected to their bodies. That's the part that's hard to measure and even harder to explain to a room full of VCs.

But if you've felt it, you know. And that's the magic.$body$,
  '2026-02-12',
  'https://kaleenc.substack.com/p/what-makes-pilates-so-effective'),

-- ===== POST 3 =====
('how-to-use-ai-when-teaching-pilates',
  'How to use AI when teaching Pilates',
  'A free tool to analyze and share your classes in seconds',
  $body$Most Pilates classes exist in a single moment. A class is taught, bodies move, cues land (or don't), and then it's over. The next class a client takes is often unrelated to the one before it. Classes are shaped by who shows up that day, which instructor is on the schedule, or the mood in the room. Even for the same instructor, classes rarely build intentionally on one another unless they're part of a formal series or private program.

Once a class ends, it's largely lost to the ether. There's no persistent record of what was taught, what was emphasized, or how it fits into a larger arc of movement over time. Instructors move on to the next hour. Clients move on to the next class. The intelligence of the session disappears almost immediately.

This isn't a failure of teaching. It's a limitation of the system Pilates has historically lived in: one built around live, ephemeral experiences rather than cumulative insight.

Pilates instructors already know that strong classes don't happen by accident. Whether a class is mapped out carefully ahead of time, loosely sketched and refined in the moment, or built entirely on the fly based on who walks into the room, the end result reflects years of training, observation, and repetition. Designing an on-brand, well-rounded, and appropriately challenging class is a skill that's developed over time and not something that can be automated or improvised without experience.

Every class contains hundreds of small decisions: how long to stay with an idea, when to layer complexity, which cue will land with this group, and when to pivot entirely. That depth of intention is the invisible labor of great teaching. And yet, once class ends, most of that intelligence disappears without leaving a trace.

### The Missing Feedback Loop

While Pilates instructors are deeply intentional in how they teach, the industry has never given them great tools to reflect on what they've done afterward. Class design lives largely in memory, intuition, and handwritten notes that rarely get revisited.

This becomes especially clear when instructors try to write class descriptions, document sessions for clients, or explain the focus of a class beyond broad labels like "full body" or "strength." The clarity instructors feel while teaching doesn't always translate cleanly into words.

In many other fields — engineering, product development, elite athletics — reflection is built into the workflow. Data and feedback loops help experts see patterns, validate instincts, and evolve their craft. Pilates, by contrast, has relied almost exclusively on internal sense-making. Intuition is powerful, but reflection is what turns intuition into insight.

That gap led me to a simple question: what if Pilates instructors could see their intention reflected back to them clearly and immediately after class? Not in the form of raw transcripts or overwhelming analytics, but as a cohesive summary that captured what actually happened. Which exercises were taught? Which areas were emphasized? What was the overall class theme?

That question became the starting point for building an AI class analyzer.

### Introducing the AI Class Analyzer

The AI class analyzer is designed to turn something instructors already do into structured, usable insight. Instructors paste in a class transcript with timestamps, and the tool analyzes the language, sequencing, and structure of the class to generate a clear summary in seconds.

Transcripts are a powerful input because they already contain the instructor's decision-making process. Cues, transitions, progressions, and emphasis all live in the spoken word. The analyzer doesn't evaluate or prescribe; it simply mirrors back what was taught in a way that's easier to see, use, and build on.

One of the most impactful outputs of the analyzer is a muscle heat map that visually represents where emphasis was placed throughout the class. Instead of guessing whether a session leaned more toward posterior chain, core stability, or shoulder work, instructors can see those patterns clearly. Over time, this helps validate programming instincts, reveal habits, and support more intentional planning across weeks or programs.

Alongside the heat map, instructors receive a complete, timestamped exercise breakdown. What used to live only in memory becomes tangible: a clear record of what was taught and when. This is especially useful for instructors assigning personalized homework, documenting private sessions, or building progressive programs from existing classes.

The analyzer also generates a suggested class title and description based on the content of the class itself. This turns spoken instruction into polished language that can be edited and reused for video libraries, schedules, or marketing materials. The goal isn't to replace the instructor's voice, but to remove the friction of starting from a blank page.

When individual classes are captured and reflected back in a consistent way, they stop existing as isolated moments. They become part of a visible sequence. When you can see what you taught last week — and the week before — it becomes easier to intentionally build on it. To vary intelligently rather than randomly. To notice patterns, avoid repetition, and design progression that feels thoughtful instead of accidental.

This is where class analysis stops being about documentation and starts becoming a tool for better teaching. Not because every class needs to be rigidly planned, but because instructors finally have a way to string classes together without relying entirely on memory.$body$,
  '2026-01-06',
  'https://kaleenc.substack.com/p/how-to-use-ai-when-teaching-pilates'),

-- ===== POST 4 =====
('whoop-x-solidcore-smart-innovation-or-marketing-hype',
  'Whoop x [solidcore]: Smart Innovation or Marketing Hype?',
  'The good and the bad of a Whoop developed Pilates-specific metric',
  $body$Big news in the fitness tech world: Whoop and [solidcore] just announced a partnership that promises "biomechanics-based tracking" for members. The goal? To provide a more precise reading of muscular load, strain, and recovery needs for [solidcore] workouts.

It's a compelling pitch—one that seemingly addresses a long-standing frustration among Pilates and low-impact training enthusiasts: Anyone who has glanced at their smartwatch post-class and seen an absurdly low calorie burn or minimal heart rate elevation knows the feeling. That's because most traditional fitness trackers fail to capture the full picture of a Pilates session.

Therefore, a Pilates-centered metric is a logical next step in fitness tracking.

### But Does the Tech Back It Up?

The press release is light on details, and that raises some important questions. Whoop is known for its deep recovery insights, strain tracking, and sleep analytics, but its core metrics are built around heart rate variability (HRV), cardiovascular strain, and traditional strength training loads. That works well for running, weightlifting, and HIIT—but does it translate to Pilates or [solidcore]'s unique method?

For context, [solidcore] is a high-intensity, low-impact training method that takes inspiration from Pilates but incorporates heavy resistance and slow, controlled movements. It's not exactly Pilates. It's not exactly strength training, either. And that distinction matters when developing new tracking algorithms.

If Whoop's new system is simply applying strength training metrics to a workout that doesn't fully align with traditional resistance training, the data may be misleading. On the other hand, if Whoop has developed a truly novel way of quantifying muscular strain and endurance beyond HRV and calorie burn, that would be a meaningful step forward for Pilates tracking.

### What's Missing?

One thing the announcement doesn't make clear: How is Whoop defining and measuring muscular load in this context? Whoop's Strength Trainer relies on more than just heart rate to generate a strain score. It uses weight lifted and reps performed too. But in Pilates and [solidcore], spring resistance is used differently. Sometimes, more weight is *easier*. It just depends on the exercise. How does Whoop's algorithm account for that? (I'm skeptical they know which type of exercise is being performed when, and how to quantify that.)

And then there's the recovery side. One of Pilates' major benefits is its ability to train the body without the wear and tear typical cardio or strength entails, hence the name "low-impact." Unlike heavy weightlifting, Pilates can often be done daily without the same risk of overtraining. So how does Whoop's new metric interpret recovery for Pilates-based workouts?

Of course, people who do Pilates think we aren't getting enough credit for our workouts with traditional metrics. However, it's unclear how much more credit we should be getting and where that credit gets applied.

### A Step in the Right Direction—But We Need More

There's no doubt that fitness tracking has been slow to evolve in the Pilates space. Wearables still struggle to quantify the true effort and benefits of mindful movement. Big players like Whoop and [solidcore] stepping into this space is a positive sign—it signals that there's demand for better data and recognition of Pilates-based training as a serious modality.

However, for this partnership to be more than just marketing hype, Whoop needs to be transparent about what's actually happening under the hood. If this is just a repackaged strength training score with a new name, it won't truly capture the magic of Pilates. It won't trickle down effectively into contemporary and classical Pilates, and it will not contribute to advancing any research on the benefits and use cases of Pilates methods.

If, however, Whoop has developed something that genuinely accounts for the biomechanics of Pilates and [solidcore], this could be a game-changer for tracking low-impact, high-intensity training, and we may see it roll out beyond High-Intensity Pilates into more contemporary or classical settings.

### Final Thoughts

Having worked in the Pilates industry for the last 12+ years, with the most recent 5 specifically at Flexia developing Pilates-specific metrics, I believe this leans more toward a marketing play than a true technological breakthrough. That said, even if it is largely a branding move, it still serves a valuable purpose.

Pilates has long been overlooked in the fitness tech space, and mainstream companies investing in it—whether perfectly executed or not—helps push the conversation forward. Large companies with millions of customers can drive awareness and legitimacy for Pilates in the broader fitness industry, and that alone is worth paying attention to.

So, while I remain skeptical of the tech itself, I'm optimistic about what this signals for the future of Pilates tracking. If nothing else, it's a step toward greater recognition—and hopefully, better data down the line.$body$,
  '2025-03-20',
  'https://kaleenc.substack.com/p/whoop-x-solidcore-smart-innovation-or-marketing-hype'),

-- ===== POST 5 =====
('what-everyone-gets-wrong-about-tech-in-pilates',
  'What Everyone Gets Wrong About Tech in Pilates',
  $$Hint: Form isn't the star of the show, it's the cherry on top$$,
  $body$I've asked countless Pilates instructors what matters most, and their answer is almost always the same: form.

It makes sense. Pilates has a reputation for precision, for meticulous alignment, for that one cue that suddenly transforms an exercise. But here's the thing—form isn't the first thing to focus on. Somehow, we forget that all the other principles we learned in teacher training are just as important (if not more so).

### Form Comes Last, Not First

Before I correct a student's positioning, I always ask myself:

Are their spring settings and equipment adjustments correct? Resistance and setup matter more than a perfectly placed pinky toe. If someone is struggling to complete a movement, adjusting their springs or strap positioning can often fix the problem before any form correction is even needed.

Do they understand the movement itself? I call this big picture form. Can they roughly perform the exercise? If not, throwing out detailed form corrections—like "drop your ribs" or "relax your shoulders"—is pointless. They need to grasp the fundamental movement pattern first.

Only then do I focus on the little form cues. Refinement comes last, not first. Those small adjustments that take an exercise from "I feel this a little" to "oh wow, my core is on fire"? Those only work when the student already has a solid foundation in place.

This approach isn't just about how we teach—it also impacts how we think about Pilates technology.

### The Problem With "Perfect Form" Tracking

There's a growing push to use technology to measure Pilates performance, and most of it revolves around form. The idea is that if we can track joint angles, posture, or alignment, we can somehow create a more effective Pilates experience.

But here's my issue: Pilates isn't just about moving through shapes—it's about moving through those shapes under the right load. And to get that right, we need good teaching, not just good data.

If Pilates were just about getting into precise positions, we wouldn't need springs, straps, or equipment at all. The apparatus exists because resistance, tension, and sequencing matter just as much as form.

### What Makes a Pilates Cue "Magic"

As instructors, we love delivering that one cue that suddenly makes an exercise click. That moment when a client finally feels their abs firing or when a small shift in alignment makes a movement ten times harder.

I think that's where we subconsciously set the bar for what makes technology "effective" in Pilates. We want tech to be able to deliver that same experience—to diagnose what's missing in a movement and correct it in a way that unlocks that breakthrough moment.

But those cues, while powerful, are just one piece of what makes Pilates work. And that breakthrough? It's only possible because of the work that came before it—the right springs, the right setup, the right understanding of the movement.

### Pilates Tech Needs to Evolve

We can't ignore the less flashy but equally important parts of the Pilates system:

- Resistance levels and how they impact muscle engagement
- Equipment adjustments that make or break an exercise
- The sequencing and progression that build toward mastery
- The teaching process that guides a student to better movement

And we definitely can't forget that what makes any workout effective is how it's taught. Pilates instructors have an edge over many other fitness pros because our training isn't just about exercise science—it's about teaching methodology.

That's why I believe Pilates tech needs to go beyond form snapshots. It needs to capture the full teaching philosophy. And that doesn't start with form tracking. It culminates in it.

### Where Do We Go From Here?

If we want Pilates technology to be truly valuable, we need to shift our priorities. Instead of obsessing over "perfect form," we should be asking:

- How can we measure resistance and effort, not just movement?
- How do we quantify impact beyond heart rate and calorie burn?
- How can tech support good teaching instead of replacing it?

The future of Pilates tech isn't just about tracking—it's about understanding what makes Pilates work.$body$,
  '2025-03-20',
  'https://kaleenc.substack.com/p/what-everyone-gets-wrong-about-tech-in-pilates'),

-- ===== POST 6 =====
('the-pilates-instructor-feedback-loop-a-process-for-cueing-successfully',
  'The Pilates Instructor Feedback Loop: A Process for Cueing Successfully',
  'Get your students moving confidently with these 6 steps',
  $body$Today, I want to talk about feedback loops. In general terms, a feedback loop is a system that monitors an output and then influences the input of a process based on what it senses. In Pilates, this is what an instructor does when they observe a client and decide, based on what they see, what to cue next—if anything.

It sounds simple, but I believe it's one of the most important skills that separates a good instructor from a great one. In my Pilates teacher training in 2013-2016, this kind of decision-making was discussed very casually. I had multiple instructors during my training and in subsequent continuing education courses, and the emphasis on feedback varied greatly depending on the teacher, with hardly any formal training given on:

1. How much feedback to give a student
2. When to give feedback
3. Whether to give feedback at all

Most teacher training programs focus on learning an "ideal" version of each exercise. (There's a lot of discussion around the concept of "ideal" these days, and I won't go into it deeply here, except to acknowledge that it has historically been based on thin, white, female bodies—an unrepresentative and unsubstantiated standard). We learn cues to help students resemble the "ideal" form we're taught, but I have yet to see a system that teaches how to decide which cues to use and when in just as much detail.

Broadly speaking, we as instructors are aware that students can get overwhelmed with too many cues and struggle to process them all. When an instructor gets fixated on making a student move "perfectly," it can be frustrating and demoralizing for both.

### My Goal in Teaching Pilates

Before diving into my feedback loop, I want to share my overarching goal as a Pilates instructor: **to let my students move.**

Ideally, Pilates helps people build confidence in their movement choices, connect with their bodies, and gain strength. What letting them move looks like varies from student to student. I don't subscribe to the philosophy that there's only one "right" way to move or that Pilates is only effective if executed exactly as written in a manual.

We are all a work in progress and I want to encourage my students to keep getting better every day. That means every day won't look perfect.

Also, my students should **move more than they sit still and listen** during my class. They aren't coming for a lecture. They're coming for a workout. I want them to feel challenged. I want them to feel successful so they keep moving—whether with me or elsewhere in their lives.

Even if your teaching philosophy differs, this discussion on feedback loops may still be relevant as it provides a basic framework for guiding movement effectively.

### The Basic Formula: My Feedback Loop

I've written before about how I believe form minutiae should be the last thing we "correct" in a client. Here's the broad order of my cueing and corrections—essentially my feedback loop—when teaching a class:

1. Equipment Setup
2. Resistance Settings
3. Big Picture Form
4. Basic Breath
5. Form and Breath Minutiae
6. Let Them Move

My goal is always to get to Step 6: Let them move. But since each student is unique—with different mental loads, physical abilities, and levels of experience—how quickly I move through the steps varies. Sometimes I only get to Step 3 or 4 and then skip to Step 6, deeming their movement time more important than struggling to copy a picture in a manual that may or may not deliver the desired impact.

There is usually a minimum acceptable performance level that needs to be achieved in each step before moving on to the next. That criteria varies based on the exercise, the student and their goals, and the conditions of the day. To say this another way: the process stays the same but the criteria to progress through the steps will vary.

Let's go through each step.

#### Step 1: Determine the Equipment Setup

Examples of this include:

- Footbar height/angle, carriage gear position, rope length, and headrest position on a reformer
- Push-through bar height, leg spring attachment point, or body positioning on a Cadillac
- Student positioning relative to their mat for mat Pilates

This is in the "preparing to move" phase, and sometimes can be swapped with Step 2 depending on the setting.

#### Step 2: Setting the Resistance

Examples of resistance settings include:

- Spring choices on a reformer
- Modifications like performing a plank on knees vs. toes
- Distance from the tower when doing leg spring exercises

This is in the "preparing to move" phase, and sometimes can be swapped with Step 1 depending on the setting.

#### Step 3: Evaluating Big Picture Form

This is the broad movement shape—the essential mechanics of the exercise. During footwork, for example, it means bending and straightening the knees fully with heels on the bar. It's the minimum safe movement required. I try to keep this a short instruction so students can start moving sooner, and then refine as they move if necessary. Some exercises require a longer explanation than others.

#### Step 4: Evaluating Basic Breath

At the very least, I want my students to breathe rather than hold their breath. Sometimes, I cue specific breathing patterns (e.g. exhaling during a roll-up), but for other exercises (e.g. footwork), I'm less particular—as long as they breathe. In any exercise, I really, really want my students to get to a place where they can process the breath cues with the big picture form cues and then let them move. Once they can competently move and breathe, then I can cue breath and form minutiae. But I won't do that unless they are successfully breathing and moving, broadly speaking. Some beginner students take a lot of time to get to this step. More advanced or experienced students can often get to this step much faster.

#### Step 5: Cueing Form and Breath Minutiae

This is where the detailed cues Pilates instructors love to give come into play—those small adjustments that can lead to breakthroughs. Examples:

- "Lift your left hip so it's level with your right hip."
- "Press into the strap to lengthen your waistline."
- "Shift weight to the big toe side of your foot."

These cues can add challenge and refinement, but I only usually introduce them once a student has successfully navigated the first four steps. Some students—or some sessions—never reach this step because it might interfere with getting to my goal of Step 6: Let Them Move.

#### Step 6: Let Them Move

I want my students to spend most of their class time in this step—moving, feeling successful, and experiencing the challenge and mindfulness of Pilates.

### What It Looks Like in Practice

Let's say I'm working with a beginner in a private session. Here's how I'd cue footwork:

**Resistance Level Setup**

Verbal Cue: *Attach 3 full springs and a half spring.* (In a private setting, I may do this for them instead of telling them)

What I'm looking for: This is a well-educated guess that I'll verify as the feedback loop process continues.

**Equipment Setup**

Verbal Cue: *Lay down on your back with your heels on the footbar in parallel, about hip distance apart.*

What I'm looking for: I start with a well-educated guess for equipment setting, and then I'll make a basic assessment: Are their hip and knee angles appropriate? Can they achieve a neutral spine? If not, adjust the footbar and/or gear position. Is their head in a comfortable position? If not, adjust the headrest. Later on in the feedback loop I may return to adjust these settings to enable the student to better experience the exercise intent.

**Big Picture Form**

Verbal Cue 1: *Press the carriage out and straighten your knees all the way, then bring the carriage all the way home.*

What I'm looking for: Since footwork tends to be a high repetition exercise, I want to use as short of instructions as possible to get them started and then build on after they're moving. If the student cannot achieve this basic goal, for example they can't straighten their knees all the way, I may adjust the springs lighter. If they've got it down, I add another Big Picture form cue or move on to breath, depending on the exercise.

Verbal Cue 2: *Move at an even speed in and out every rep.*

What I'm looking for: Generally I'm cueing this so they avoid "riding the springs" home or letting themselves speed up as their mind wanders. I consider speed and control to be integral. If they're doing great, I move on to basic breath. If they are struggling, I will refine with other cues. At some point I'll move on to basic breath, or I may skip to Step 6 here and let them move if it's clear my cues aren't creating the desired outcome. Another way to look whether I want to progress to Basic Breath or Let Them Move is: There is no way I can cue breath effectively if the student cannot regulate the speed and range of motion of their movement.

**Basic Breath**

Verbal cue: *Exhale as you press out, inhale as you float in.*

What I'm looking for: Sometimes focusing on the breath can cause the Big Picture Form to suffer, like maybe they no longer straighten their knees all the way, or their tempo changes for the worse. Or, sometimes I see students giggle and nervously exclaim they can't quite get the breathing pattern. In many cases this is where I stop cueing and let the student sit in that struggle to competently execute the cues I've given so far.

**Form and Breath Minutiae**

Verbal Cue: *As you press out, maintain a neutral spine. Think about where your tailbone is pointing throughout the movement, and aim to keep it still.*

What I'm looking for: This is just one example of a minute form cue (or correction). There are a ton of these examples, but the key thing to consider here is that my choice is not to cue this until the student has successfully executed all the previous cues I've given. The number of minute form and breath cues I give depends on the student and the objective. I will move on to step 6 and let them move so that they can experience the challenge, joy, and mindfulness of executing that exercise as I instructed. In other words, displaying and feeling competence.

**Let Them Move**

Verbal Cue: Some students want to hear *Keep going!* or *8 more!* but I try to read the room on whether I need to say anything when I've delivered the bulk of my cues.

What I'm looking for: I want my students to be focused on their movements without new inputs from me for a significant portion of time. Whether they're challenged is a judgment call, and worthy of its own blog post.

### Final Thoughts & Caveats

- **Footwork is a basic example.** More complex exercises may require more or less cueing at each step.

- **Safety is key.** I avoid fear-mongering, but every exercise has baseline safety requirements.

- **This process isn't rigid.** Every instructor will use their own cues and decide what the criteria is for moving on to the next step. Even the same instructor will vary depending on the exercise they're teaching, the student in front of them, or the particular intent of the exercise. That's okay. The process broadly is the same and functions as a baseline.

- **Group classes differ from privates.** I may cue through these steps faster, change the evaluation criteria for moving from one step to another, and allow students to self-select what to focus on if teaching a multiple people.

- **I am not familiar with all of the training programs out there.** I know many talented instructors and teacher-trainers but I don't know every teacher trainer program's curriculum, much less the level to which it's delivered. Do you know someone I should talk to about how they teach this? Connect us!

At the end of the day, my goal is **safe, confident, challenged, and successful movers.** Pilates should empower people to move—not leave them frozen in pursuit of perfection. This process encapsulates the baseline of how my brain works in deciding how to teach so I can consistently deliver a great Pilates session.$body$,
  '2025-03-20',
  'https://kaleenc.substack.com/p/the-pilates-instructor-feedback-loop-a-process-for-cueing-successfully'),

-- ===== POST 7 =====
('pilates-taught-me-to-breathe-differently-and-it-changed-everything',
  'Pilates Taught Me to Breathe Differently—And It Changed Everything',
  'The Science of Pilates Breathing and How It Can Elevate Your Practice',
  $body$Before discovering Pilates, I never paid much attention to my breath. It was automatic, an afterthought, something that happened in the background while I focused on movement or effort. But when I began my Pilates practice, I was introduced to the idea that breath could be intentional, and I quickly realized its immense power in enhancing movement and overall well-being.

### A Life-Changing Lesson in Breath

One of my most profound experiences with breathwork happened during a session with my mentor, Amanda. We met in Athens, Georgia, in 2015 when I reached out to offer my Pilates equipment technician services for her studio.

At the time, I was also doing one of the last modules in my Pilates teacher training program. During one particularly grueling weekend, I was surprised by intense shoulder pain that was so bad I broke down in tears. My trainer at the time suggested I seek out someone who specializes in "movement pattern retraining." Unsure of what that meant, I reached out to my new friend Amanda. To my surprise, she said, "Me! That's what I do!"

In our session, she guided me through various exercises on the Cadillac, a piece of Pilates equipment, which included one unforgettable moment. I sat sideways with my arm on the push-through bar bending and straightening my elbow to move the bar. As I straightened my arm, I felt a line of tension from the base of my skull down my arm to my pinky. I had never been so aware of a part of my body before.

Then, she told me to breathe.

At first, I defaulted to belly breathing. But Amanda directed me to expand my ribcage near my shoulder blade as I inhaled, and I felt the tension light up as if I was electrocuted. When I exhaled deeply, though, the burning sensation in my arm eased. We repeated this pattern, and with each breath, my range of motion improved, and my movement became less painful.

We progressed through a few other exercises focused on my upper back and shoulders, and by the end of the session, I felt three inches taller and way more confident in my shoulder stability.

That moment opened my eyes to the power of focused breathing. Though I had been practicing Pilates for years, I had never truly experienced breath as a tool for transformation. I am continually amazed at how adjusting my breath during certain exercises can completely change what I feel.

Since that revelation, I've explored many non-Pilates breathing techniques that focus only on certain breathing patterns, often in conjunction with meditation. While those methods are fascinating, I find it hard to stay engaged. But Pilates breathing? The combination of movement and breath keeps me present and in a flow state like nothing else.

### The Best Breathing Technique

It's a safe assumption that most of us have poor breathing habits. Journalist James Nestor covers this in a very digestible way in his book *Breath*, where he boldly states that we as a human species have lost the ability to breathe correctly. However, because we're so bad at it, he says it won't take too much effort to significantly improve our athletic performance, snoring, asthma, and even posture.

I like his practical approach. Most of us aren't professional athletes looking to gain that extra 0.1% edge. Instead, we want the 20% effort solution that will yield 80% of the results.

With this in mind, the concept that will yield the most transformative results is deep and slow breathing. It has been extensively studied and shown to have amazing benefits:

- **Improved Posture and Core Engagement**: Lateral breathing activates the deep core muscles, particularly the transversus abdominis, which supports spinal stability and improves balance.

- **Thoracic Mobility**: This technique enhances rib cage mobility, leading to better shoulder mechanics and reduced upper body tension.

- **Enhanced Lung Function**: Studies show that intercostal breathing increases tidal volume, improves oxygenation, and reduces breathlessness, making it a valuable technique for overall respiratory health.

- **Nervous System Regulation**: Deep, slow breathing shifts the body from sympathetic (fight-or-flight) dominance to parasympathetic (rest-and-digest) mode, reducing stress, lowering blood pressure, and increasing heart rate variability.

### The Pilates Breathing Technique

Pilates emphasizes lateral breathing, which encourages ribcage expansion outward and sideways rather than only focusing on belly expansion. It still emphasizes diaphragm involvement, which is important to reap the benefits of breathwork, but because the lower ribs expand to accommodate air in the lungs, deep abdominal engagement is still quite attainable to support body movement.

I love to describe this lower rib movement using the image of an umbrella: As you inhale, the ribs expand all around the spine like an umbrella opening. As you exhale, the umbrella closes.

Regardless of your individual skill level, the practice of pairing breathwork with your workout can greatly improve the outcome. A recent 2025 study from Li et al showed that core training with breathing is more effective at reducing chronic non-specific low back pain (CNLBP) than core training alone. In this study, participants were divided into three groups: core stability training and breath training, core training alone, and the control group. All participants had CNLBP. At the end of the study not only did the group who did core and breath training have the most significant reduction in pain, but they also had the most strength gains.

### Mistakes to Avoid in Pilates Breathing

While Pilates breathwork has many advantages, it can sometimes be taught in a rigid or overly prescriptive way. If instructors overemphasize breath without context or teach it incorrectly, students may develop unnatural breathing patterns.

In particular, many instructors overemphasize mouth breathing, which may have some root in Joe's teachings but neglects the benefits of nasal breathing, which research shows is more effective for oxygen uptake, nervous system regulation, and overall health than mouth breathing. Integrating nasal breathing into Pilates practice can provide an even greater impact on well-being.

Additionally, incorrectly teaching lateral breathing can exasperate chest breathing which deregulates the nervous system. This type of breathing is usually more shallow, only accessing the narrower, upper lung regions, and can contribute to a much more slumped posture.

Generally, I consider these risks to be minimal and the overall incorporation of attention and instruction on breath and ribcage movement to be highly transformative to Pilates students.

### Bringing Breath Awareness into Your Pilates Practice

In my classes, I introduce breath in three progressive stages:

1. **Just Breathe**: First and foremost I want my students to NOT hold their breath. Breathing throughout movement is key, and sometimes counterintuitive to newbies.

2. **Follow the Breath Cueing**: Once you have body awareness, coordinating breath with movement in the way I instruct adds another challenge and helps get the most out of the exercise.

3. **Experiment with Breath Patterns**: Finally, I encourage my students to play with different breathing techniques to find what works best for you and experience first-hand just how breath impacts their movement.

While breathwork is a valuable tool, I always remind my students: breath is the cherry on top of the Pilates sundae. It's a fantastic addition, but it shouldn't become an obstacle to learning movement fundamentals. For instructors, I explain how I progressively cue exercises in this blog post on feedback loops.

### Final Thoughts

Breath awareness can be one of the most transformative elements of Pilates. How I breathe when I move changes the movement experience. It can make something that was previously uncomfortable more comfortable. It can increase range of motion. It can make an exercise easier or harder.

And the list goes on. My journey with breath has not only improved my own understanding of my body but also changed the way I teach. Whether you're a seasoned Pilates practitioner or a beginner, exploring breath can unlock a whole new level of awareness in your movement—and in your life.

### Want to Learn More?

If you'd like to read more about breathing from people who know way more than me, here are some resources I found helpful:

- *Breath* by James Nestor
- *Therapeutic Breathwork* by Christiane Brems
- "How Breath-Control Can Change Your Life: A Systematic Review on Psycho-Physiological Correlates of Slow Breathing" (Zaccaro et al)
- "The impact of core training combined with breathing exercises on individuals with chronic non-specific low back pain" (Li et al)$body$,
  '2025-03-21',
  'https://kaleenc.substack.com/p/pilates-taught-me-to-breathe-differently-and-it-changed-everything'),

-- ===== POST 8 =====
('just-because-it-is-easy-doesn-t-mean-they-re-doing-it-wrong',
  $$Just Because It Is Easy Doesn't Mean They're Doing It Wrong$$,
  'Why this age old Pilates snob response must end',
  $body$As many Pilates lovers do, I frequent the r/pilates subreddit. I love it more than any other online Pilates community because it tends to have more students in it than instructors, which is refreshing and real. Pilates instructor forums tend to get really snobbish really fast (I get that we all love to study the minutiae of movement and cueing, but the things we care about are not the same things a Pilates student cares about.) Reading and interacting with real people shows me a little about what actual Pilates students are thinking, doing, and experiencing outside my own bubble. I love it.

However, the occasional Pilates instructor snobbery rears its head. One of my biggest pet peeves is this typical response to someone saying their first Pilates session was too easy.

Y'all. This response is not just unhelpful, but actually harmful to the Pilates community.

First, it completely invalidates someone's experience. What a shame! Instead of responding with curiosity, Pilates snobs respond with, well, snobbery. Let's not unnecessarily turn someone off our amazing fitness method.

Secondly, absolutely someone could feel their Pilates class was too easy! And no, it doesn't mean they were doing it wrong.

Think about it. If Pilates was all about the student "doing it right" no matter their goals or ability, there wouldn't be different springs, different variations of difficulty, or different levels of classes within a studio. The existence of these "levels" proves that we recognize students have different abilities and these levels help the instructor tailor the experience to individuals.

Building on that, it is the responsibility of a Pilates instructor to meet the student where they're at. Yes, students need to care and to try, but much of an instructor's value is the ability to scale the workout to fit the particular student. This is hard. It's the difference between a decent instructor and a great instructor, and has almost nothing to do with knowledge of the method and everything to do with the actual process of teaching.

If we are going to blame anyone for a Pilates class being too easy, it's the instructor's fault!

But, I'm not advocating for blaming anyone here.

Setting expectations for the first session and beyond it is critical for new student success. When I work with a newbie, whether in a group or one-on-one, I always tell them to give us a few sessions together to hit our stride. As an instructor I want to see how they respond to my cues, what they think after class, and how they feel the day after. Then I can adjust what I'm asking them to do next time. (Notice how important the feedback loop is here? Giving and receiving input is so so valuable.)

If you're an instructor and someone tells you their session was too easy, instead of jumping to the conclusion they didn't do it right, get curious. Ask some questions. What are their goals? What did they expect to feel? What were they hoping to experience? Then, thank them and offer some feedback in return.

You might say something like: "Thanks for sharing that! I definitely want you to get a good workout in. While you were working out I did notice this. Next time I'll make some adjustments, but I also suggest you try X Y Z to make those same moves even harder."

Sometimes a student does need feedback to pay more attention to form cues. That's just not where we should start or the only conclusion to come to from an innocuous comment.

If you're a Pilates student you should absolutely share your feedback with the instructor in the form of a question. "Hey, I was expecting it to be harder. Can you help me get a harder workout next time?" In most cases, this is exactly what folks in r/pilates are asking, just not in so many words.

Give yourself a couple of sessions with the same instructor to see if things change. And if they don't, find a different instructor.

If you see this kind of snobbish behavior from someone else, don't be afraid to speak up. Pilates is amazing and I want more people to do it. Bullies on the internet keep good people out and certainly don't represent the majority of us within the community.

Finally, I want to be clear that I think Pilates should be hard and the way someone does an exercise drastically impacts their experience of it. But just because someone says it isn't hard doesn't automatically mean they are doing it wrong.$body$,
  '2025-03-25',
  'https://kaleenc.substack.com/p/just-because-it-is-easy-doesn-t-mean-they-re-doing-it-wrong'),

-- ===== POST 9 =====
('slow-is-smooth-and-smooth-is-fast-pilates-edition',
  'Slow Is Smooth and Smooth Is Fast (Pilates Edition)',
  'How slowing down movement in Pilates helps students learn faster',
  $body$Pilates is known for slow, controlled movement that brings the shakes. While it's common to think going slow just makes things harder, there's a hidden benefit: slowing down helps you consciously notice how you're moving.

### Why Does This Matter?

For one, slowing down and paying attention to how each part of your body moves is key to a mindful movement practice. This is what Pilates, yoga, and Tai Chi have in common—how you perform the exercise is just as important (if not more so) than simply checking the box that you did it. This mindful approach creates a meditative effect, which, when combined with breathwork, offers benefits far beyond basic strength training.

But perhaps most importantly, being aware of how you're moving gives you the power to change it.

This is best explained by the Conscious Competence model in psychology, which describes the four stages of learning a new skill.

*Note: For the sake of this model, I'll use "right" or "correct" to mean a student is moving as instructed, and "wrong" or "incorrect" to mean they're moving differently than instructed. The ability to follow an instructor's cues is a movement skill, and very few movements are inherently dangerous or flat out wrong—though that's a topic for another post...*

### The Four Stages of Learning Movement

**Step 1: Unconscious Incompetence**

At this stage, the student doesn't realize they're doing something incorrectly. For example, an instructor cues them to keep their legs in parallel during footwork on the reformer, but one hip is externally rotated, causing the knee to point sideways—without them even noticing. Ever heard the phrase, *you don't know what you don't know*? That's this step.

**Step 2: Conscious Incompetence**

Here, awareness sets in—maybe thanks to a cue from the instructor—but the skill hasn't developed yet. This is where the struggle happens: the student now *knows* they're externally rotating but keeping true parallel feels awkward or unnatural.

**Step 3: Conscious Competence**

At this stage, the student can perform the movement correctly, but it takes significant effort. Each repetition requires concentration, and if their attention drifts, their form suffers.

**Step 4: Unconscious Competence**

Finally, the movement becomes second nature. The student no longer has to focus on knee alignment to maintain a parallel position—it just happens. Now, they're free to bring awareness to other parts of their body.

### Smooth Learning Is Faster Learning

This ties into the special forces saying: "Slow is smooth, and smooth is fast." In movement learning, slowing down allows a student to transition from Conscious Incompetence (where they struggle to correct their form) to Conscious Competence (where they can control their movements with focus). Over time, this deliberate practice leads to Unconscious Competence, where the movement becomes second nature—allowing for smoother, more efficient motion. In other words, by moving slowly at first, students build the foundation to move with greater ease, precision, and eventually speed should they desire.

Imagine trying to teach a student to articulate their spine, breathe as instructed, and maintain length during a roll up if they're going so fast it looks like a sit up during a timed test in PhysEd! They probably can't! There simply isn't enough time to consciously make those changes at that speed. So slowing down, making changes, and then speeding back up is actually a faster way to learn a new movement skill or adjust an existing one.$body$,
  '2025-03-27',
  'https://kaleenc.substack.com/p/slow-is-smooth-and-smooth-is-fast-pilates-edition'),

-- ===== POST 10 =====
('the-pilates-class-algorithm',
  'The Pilates Class Algorithm',
  'How to engineer a seamless and effective class flow',
  $body$Designing a well-structured Pilates class takes careful planning and intentional sequencing. This process can feel second-nature to seasoned instructors, but in my quest to build a system centered around evaluating a Pilates session using technology, the underlying structure of any good class must be defined.

In this post, I'll walk you through my method for designing a 45-minute, all-levels full-body flow class, using a three-part framework and some checks and balances.

### Breaking Down the Structure

I like to think of my classes in three major chunks:

1. **Warm-Up** – This sets the foundation for the session, easing participants into movement.

2. **Main Section** – The bulk of the class, where intensity gradually increases to a peak challenge.

3. **Cool-Down** – A chance to wind down and notice the work of the session before stepping back into the chaos of life.

### Preparing to Design

Before populating each of the three sections with exercises, I identify the main focus of the class and one or two pinnacle movements we'll build up to. I pick these based on the class type, level, and the attendees.

For this particular flow I wanted to emphasize **core and glute work**, with the pinnacle exercise being **Snake**—a dynamic, full-body movement requiring control, strength, and flexibility.

*Note: While snake is an advanced exercise, in an all levels class much of my individual exercises will be layered to build in difficulty over multiple sets allowing students to choose a more accessible version of the exercise or progress up in difficulty with each version depending on their capability. The focus of this article is not on individual exercise selection and description, but on the building blocks of class structure.*

### Building the Flow

#### Warm-Up

I begin with **a roll-down and footwork**, which help establish alignment and activate big muscle groups. Footwork is a great transition from warm-up to the main workout since it starts in a stable, supported position and with more reps the difficulty intensifies.

#### Main Section: Layering Difficulty & Body Positions

To create a well-rounded workout, I incorporate a variety of **body positions**:

- **Supine exercises** to start with core engagement and control

- **Sidelying movements** to work the glutes and lateral stabilizers

- **Plank variations** to prep for the pinnacle movement and challenge full-body strength and endurance.

- **Prone** to work the posterior chain and improve posture

- **Seated** to work the arms in open chain exercises.

#### Cool-Down

To bring the class full circle, I end with **Mermaid**, a movement that blends rotation, side bending, flexion, and extension. It's a gentle way to release tension and integrate the work done throughout the session.

### Planes of Motion Check-In

A balanced class should include movement in all **planes of motion**:

- **Flexion** – Forward bending

- **Extension** – Backward bending

- **Side bending** – Lateral movement

- **Rotation** – Twisting motion

### Final Thoughts

By considering each of these components of a Pilates class structure, I ensure that the session is well-rounded, challenging, and ultimately effective. In the tech world I'd use this as a rubric to evaluate the output of a class and provide feedback to the instructor.$body$,
  '2025-03-28',
  'https://kaleenc.substack.com/p/the-pilates-class-algorithm'),

-- ===== POST 11 =====
('pilates-goes-mainstream-technogym-launches-the-reform-reformer',
  'Pilates Goes Mainstream: Technogym Launches the Reform Reformer',
  'The gym equipment giant jumps on the hype train',
  $body$Technogym announced it's launching a Pilates Reformer this Fall, creatively called Reform. At first glance, it looks just like the popular Balanced Body Allegro 2 Reformer, and knowing Balanced Body, they'll seriously consider taking action to protect their global design patents.

Technogym, known for its luxury, digitally connected gym equipment, revealed their reformer will have app-guided classes.

This is a smart move for any equipment-maker because as Pilates booms, offering a reformer for Pilates-lovers alongside typical gym equipment is a sure source of extra revenue.

What still seems to be missing in mainstream Pilates is innovation beyond offering recorded Pilates classes via an app.

### The Design

While sleek and beautiful, Technogym's Reform looks eerily similar to Balanced Body's Allegro 2 Reformer, which has been around for nearly 15 years and was originally designed in concert with the design firm IDEO.

Balanced Body has a history of strongly defending their design patent (D659205). In 2024 it filed a complaint with the ITC against multiple Pilates manufacturers importing into the US. They even have a page all about counterfeit Allegro 2's on their website.

This low-profile, white design is popular all over, with similar models offered by Your Reformer, Personal Hour, and Faittd. I'm no patent attorney, so I can't say how close the designs need to appear to be considered an infringement.

Regardless, Technogym seems to be departing from their classic black and yellow branding to jump on the white reformer train.

### What This Means for Pilates

In the grand scheme of things, this isn't a super groundbreaking revelation. We already know that Pilates is booming. Technogym is, however, beating out their competitors Peloton, iFIT, and Interactive Strength with this announcement. But I'm sure those companies will be close behind.

For what it's worth, Technogym mostly outfits commercial gym settings (instead of selling to home consumers) so it will be interesting to see if they follow the traditional instructor-led class format or place their reformer on the gym floor with a screen like all their other equipment.

As Pilates continues to grow I hope that the essence of it can be preserved to the minimum required to keep it uniquely effective in the way that millions of people around the globe already love.$body$,
  '2025-04-08',
  'https://kaleenc.substack.com/p/pilates-goes-mainstream-technogym-launches-the-reform-reformer'),

-- ===== POST 12 =====
('what-makes-a-great-pilates-class-part-1',
  'What Makes a Great Pilates Class? (Part 1)',
  'Analyzing measurable class components to deliver stellar classes every time',
  $body$Over the last several years, I've continually asked myself "What makes a good Pilates class?" What I've come to believe is the answer is a combination of two things: The essence of Pilates (aka Pilates Principles) and meeting the student's goals. When those elements mesh well, I'd consider it "A Great Class!"

So how do you design and measure whether A Great Class was delivered? Let's imagine we're in charge of teaching an intermediate group Pilates class on reformers and use the graphs from my Class Design Report worksheet.

### Pilates Principles

Yes, I know that the Pilates "capital P" Principles are Concentration, Control, Centering, Breath, Precision, and Flow. I want to change perspective a little, though, to put these principles into 3 categories that we can measure.

1. The class includes movement in all planes of motion
2. The body positions students work in flow smoothly together, minimizing the total number of changes in the class
3. There is balanced development across muscle groups

As my tools are still in development, I expect this blog to get updated over time. For now, here is where my head is at in each category.

### Planes of Motion

First, A Great Class includes movement in all planes of motion: Rotation, side bending, extension, and flexion. Specifically spinal movement, but for now we'll keep it broad. Depending on the goals of the class and students, the breakdown of each component may vary.

There are two ways to visualize this. First, a simple pie chart will show the breakdown of movement in each plane across the whole class. It's an easy graphic for our brains to interpret.

While it's very clear what the outcome of the class was, how do you know what the goal was and how the class compares to the goal? To answer that question, I far prefer a radar chart because it's easier to overlay the target spread with the actual results. In the graph below it's very clear to see that the actual class design was close to the goal, but lacked enough extension-based movements to really make A Great Class. This is assuming a target distribution of 50% Flexion, 25% Extension, 12% Rotation, and 13% Side Bending.

### Body Positions

A manager of a nation-wide Pilates program within a gym-system told me something really interesting: The best instructors have their students moving for more total minutes in a class than newer teachers. What does that tell me? One, they probably have more efficient cueing techniques. And two, they probably also have a more efficient flow of class. The time it takes to stop an exercise, get up, change equipment settings, and get back into position for the next thing adds up over time, so making things flow together to maximize the movement time during class is important.

For this metric, I've broken down the possible body positions in the Class Design Report and each exercise gets its own classification. Visualizing this with standard excel-based tools hasn't been straightforward, though, because it should be in chronological order and I want to also visually see body position... to be continued... What I've done so far is to make rudimentary diagrams that visually represent each body position so that the body position map can be viewed at a glance.

Here's a visualization of a recent flow class I took.

For a 50-minute class I'd consider this to be on the higher side of # of body position changes, though it wasn't obnoxious during the workout. One of the reasons it probably felt smoother than it looks is because we repeated a pattern on two sides.

Normally, the fact that there are 4 separate "Seated Facing Side" transitions might be a red flag. Why not combine the seated facing side exercises into one flow? Because we're doing two sides (as is often the case with sideways facing exercises) multiple instances of this body position in the class is reasonable.

Next, you may wonder whether the two instances of Seated Facing Side in each "Set" could be combined to look like this:

That change may enable longer time spent moving (as opposed to listening or transitioning) in class, which would be beneficial for the students.

I'm not sold on this visual representation yet, but I believe it's a vital component of being able to quickly evaluate a class design, and perhaps facilitate nuanced discussions if desired.

### Muscle Groups Worked

A Great Class should promote balanced muscle development. Broadly speaking, that just means we need to make sure the class isn't neglecting some major muscle groups. I think, for example, it's easy to design a Pilates class these days with not very much oblique or spinal extensor work. This visual representation should help me quickly assess that I'm designing a class that doesn't leave any muscle group behind.

A major caveat here is that I've chosen what may seem like an arbitrary list of muscles. I won't deny it. My current list has 20 "groups", while I have another list that has just 11. I want to create a list that is as simple as possible to use (no advanced anatomy required) and still gives adequate feedback on the class design. I'm not sure what that list looks like, yet.

For example, I think "Upper Body" "Lower Body" and "Core" are too broad. Analyzing the class with only those three "muscle group" classifications still leaves plenty of room to program an unbalanced class even though the graph could be balanced between the three categories. I most commonly see the back body get neglected, especially spinal extensors. So what if we did it by back body/front body? Or fascial slings? Or joints?

No firm answer, yet.

For now, we can visualize the muscles worked in a class with the current list of muscle groups in a pie chart. This is a representation of a class I took recently, and it felt like it matched my session experience and delivered a fairly balanced workout.

While pie charts are Excel's bread and butter, they don't have a bubble chart that works well. But guess what, Canva does! I like the bubble chart below because it's a little easier, at a glance, to see where the emphasis was.

However, like the body positions visualization, I think this is an incomplete picture.

For one, we need to have a specific target distribution for each class. This target can vary depending on the type of class it is (i.e. Butt + Abs vs. General).

And second, we need a way to measure how many exercises incorporate multiple muscle groups, aka challenge full-body coordination. We know that A Great Class doesn't just focus on a few joints moving alone (i.e. like a single bicep curl), but builds to a bigger challenge that requires coordination and strength (i.e. like a plank).

### What's Next

Those three components make up the Pilates Principles that "A Good Class" needs to consider. I think classes that don't consider these start to stray from being "Pilates" but that's a conversation for another post.

For the discussion on Student Goals and how that combines with Pilates Principles to create A Great Class, stay tuned for the next post where I'll discuss Rate of Perceived Exertion (RPE) and how it's a vital input for class design.$body$,
  '2025-04-15',
  'https://kaleenc.substack.com/p/what-makes-a-great-pilates-class-part-1'),

-- ===== POST 13 =====
('what-makes-a-great-pilates-class-part-2',
  'What Makes a Great Pilates Class? (Part 2)',
  'Analyzing measurable class components to deliver stellar classes every time',
  $body$Making *A Great Class* is some art and some science (definitely a skill!), and these days I think it's an underemphasized part of Pilates teacher training. In my mind, *A Great Class* is a combination of incorporating Pilates Principles with Student Goals. Too often I see classes that are only Pilates Principles and neglect Student Goals, leading to disappointment or disengagement on the students' faces. (And decreased studio revenue!) Conversely, a class that leans too heavily on Student Goals and not enough of Pilates Principles is just another fitness class.

Last week I broke down how I am thinking about measuring Pilates Principles. This week, let's take a look at Student Goals.

Again, my lens is on how we design and measure whether the Student Goals were met, with the intent that in combination with Pilates Principles, *A Great Class* is executed.

### Everybody Is Different

This analysis may be one of the more difficult ones to perform because you can argue that everyone comes into class with slightly (or majorly) different goals. I asked 5 new students the other day why they were in class with me, and I got 5 different answers! It can seem daunting as an instructor, especially in the moment, to face such a unique class cohort. But, if you nail the Pilates Principles in the class, you're more than half way there because like so many dogmatic Pilates teachers say, "The System Works." (yes, to the extent I'm about to describe.)

What can make this part of the equation so hard to analyze is that you need feedback from your students. *Honest* feedback. Sometimes instructors can get feedback from the grunts, grimaces, or moans from our students during particularly hard exercises, but more often than not in big group classes it's really hard to get an accurate read on how challenging the class was for each student.

### The Class Should Be Hard

Nearly every Pilates student wants the class to be hard. Of course, how challenging each student finds the class varies based on their capabilities, but there is no bigger disappointment for an instructor to see students leave the class feeling like it was too easy, or so hard they'll never come back.

Furthermore, it is an undisputed fact in fitness that loading muscles builds strength. Use it or lose it. And we want our Pilates students to get stronger!

### Rate of Perceived Exertion (RPE)

Since we've established that every student will experience an exercise slightly differently, we as instructors need to understand that true experience so we can deliver the appropriate level of difficulty. Contrary to popular belief, not every Pilates student should be using the same spring settings all the time. This is not a magic system that simply focusing harder will make it harder. No. External load (springs!) is an important scaling tool Pilates instructors should use to teach the same movement to a whole class while making it harder or easier for certain students.

And, we don't need to reinvent the wheel. Rate of Perceived Exertion (RPE) is a standardized scale (1-10) that measures how hard you are working during exercise.

For my own analyses, I simplified the scale to range from 1-5 in my Class Design Report (CDR) Tool. Pilates is slightly different as it isn't cardio, therefore references to breathing may or may not be relevant, but the concept of rating the difficulty is the same. Here's how I broke down my scale 1-5:

1 - No Effort (did not feel any burn, could be a stretch)

2 - Light Effort (had lots left in the tank at the end of the set)

3 - Some Effort (completed all repetitions; felt a good burn)

4 - Moderate Effort (barely completed all repetitions; intense burn)

5 - Extreme Effort (could not complete all repetitions as instructed)

### Expected RPE

Using RPE as a measure of exercise difficulty should help us design *A Good Class.* When we design a new Pilates class, generally there is a warm up, main section with one or several pinnacles, and a cool down. At a baseline, I'd expect the middle section of the class to build up to peak RPE at least once, if not 4 or 5 times. So, in a class with 40 exercises, my goal is to deliver a series of exercises with RPE's for each movement that follows a wave pattern.

There were other exercises between each of those peaks, but not every exercise in my Pilates classes will make you die. As you can imagine, the shape of this graph may change depending on the type of Pilates you want to teach. I'd imagine a solidcore class might try to be all 4's and 5's the whole time. Or, a restorative class might never go above a 3.

The beauty of this system is not that it dictates what you choose to teach, it's that it gives you a goal to reach and a way to solicit specific feedback on whether you're actually teaching what you think you are.

Or, importantly, if you're a studio owner, do your instructors know what you expect them to teach and are they actually designing classes that meet those objectives?

### Actual RPE

No matter how experienced an instructor you are, you aren't a mind reader. You don't have X-ray vision. And you don't know better than your students what they experienced in class. (Sure, you can guess and relate, but you are not an all-knowing guru.)

So, their direct feedback is critical. But, getting honest feedback about a whole class all at once is not productive. Not only are there very few students who actually want to speak up in front of their classmates, it's really hard to give negative feedback face-to-face. I think most unhappy students just disappear. Bye bye revenue.

So, real-time feedback about each exercise set is a critical piece of the puzzle.

Currently, in my experiments I'm remembering and recreating my class experience in my Class Design Report (CDR) and rating my own RPE after-the-fact. If I do it right after class it's pretty accurate, but then again I'm a teacher with a lot of training and have a mental vocabulary for everything that happens in a Pilates class. In the real world, a different system should exist.

The Actual RPE chart for a designed class looks vaguely like the Target RPE graph—slow at the beginning, some peaks in the middle, and a drop off at the end.

But, humans aren't great at remembering things or analyzing multiple data points. Without scrolling up to see the grey graph, it's hard to know how they really compared. So, overlaying those two graphs reveals whether the instructor delivered *A Great Class* from the student's perspective and whether it was hard enough.

Generally speaking it was hard. But none of the actual RPE's maxed out at 5. Personally I'd say this is pretty close to good. But more repetition of this analytical process with more people will help establish baselines.

### How Pilates Principles and Student Goals Combine

Now you've heard my spiel about the two components that combine to make *A Great Class*. It's clear to see that without adequate execution in either Pilates Principles or aligning with Student Goals, it's impossible to craft *A Great Class.* Too little focus on Pilates Principles but an excellent physical challenge for students... probably not really Pilates (maybe more like solidcore or lagree?) Conversely, perfect execution of Pilates Principles but no meeting Student Goals, then what's the point?

The design and delivery of a Pilates class are skills to be honed, and the making of a great Pilates instructor is no different than the making of a great startup. You must continually iterate and solicit feedback from your customers (students), and nothing measured is nothing improved.

And in case you need a reminder, happy clients = higher retention = more revenue.$body$,
  '2025-04-21',
  'https://kaleenc.substack.com/p/what-makes-a-great-pilates-class-part-2'),

-- ===== POST 14 =====
('lean-pilates-it-s-not-what-you-think',
  $$Lean Pilates (It's Not What You Think)$$,
  'How The Lean Startup Method Applies to Teaching Movement',
  $body$I've had a lot of conversations recently about how Pilates teacher training (TT) programs are failing Pilates studios and teachers. It's not as simple as "big box programs are bad," or "we need to learn how to teach C-curve in more detail," it's a fundamental gap in training folks *how* to teach across the board.

For example, I was in a jump class a few weeks ago and one student repeatedly crashed the carriage home every other repetition. The whole class. And the instructor never once said anything to the student! It was a well designed class, but the instructor did not seem to make any adaptation of the plan or cueing based on what was happening in front of them.

Why didn't the instructor say anything? I'm not sure. Maybe they were so focused on delivering their class plan that any distraction would throw them off. Or, maybe they didn't know what to say. Or, maybe they didn't actually notice.

Teaching is hard. I'll be the first to admit that. But the keys to delivering A Great Class are the ability to deliver Pilates Principles and match student goals. In the case of the crashing jumpboard, it was very obviously a lapse in teaching Pilates principles. There was no control. A simple cue, not even directly directed at the individual student, could have worked wonders.

Perhaps modern TT programs copied what historically worked. Maybe the extensive number of training modules weren't seen as a bad thing because they brought in more revenue. But along the way no one has evaluated whether the programs were effective for the modern Pilates studio environment. What is the actual goal of the TT program? Short term revenue for the studio? Or to train new teachers who can keep studio clients coming back with engaging and effective classes?

It's a testament to the Pilates method that we've scaled the industry so far with, arguably, mixed quality of graduating instructors and little innovation in TT programs. However, I don't think that prosperity will continue without a major change in the infrastructure of our modern Pilates environment.

In order to keep growing Pilates sustainably, we should take a page from the startup world. Specifically, The Lean Startup by Eric Ries, a book considered to be a startup bible by many. At its core, The Lean Startup is about learning quickly, adapting intentionally, and using feedback to create better outcomes. And as Pilates teachers, if we think of our classes as products and our students as customers, we can bring a lean mindset to the art of teaching movement — with powerful results.

**My hypothesis is that by implementing this methodology, we'll see drastically different TT programs with a higher quality of group instructors graduating from them.**

### Start with a Minimum Viable Product (MVP)

In the startup world, an MVP — or minimum viable product — is the simplest version of an idea that can still deliver real value. It's the rough draft you share with the world to start gathering real feedback early.

For Pilates TT programs, the MVP mindset means you should be able to produce a Minimum Viable Teacher (MVT) at the end of the program. An MVT should be able to be hired to teach group classes. The classes they teach should be a Minimum Viable Class (MVC) that consist of the following elements:

* **Safety**: Clients must move in a way that minimizes risk of injury, whether from using the equipment improperly or performing a movement they aren't ready for.

* **Pilates principles**: Breath, alignment, core control, flow — these fundamental ideas should be present.

* **Smart sequencing:** The class should flow intelligently so that students are not changing position every two minutes and have enough time in each exercise to interpret instructor cues, adjust their performance, and get fatigued.

* **Appropriate difficulty**: Challenge clients enough to spark change, but not so much that they're overwhelmed.

I think we got off course with these basics. As Pilates group classes grew in popularity and studios struggled to find more great teachers, we didn't re-evaluate TT programs to ensure we could get instructors trained in what mattered most via the cost- and time-efficient ways. Instead we doubled down on what was already in place without evaluating whether it was actually the right model to scale.

(Not to mention, we kept potentially talented instructors from beginning their journey because the programs were so expensive and time-intensive that someone wanting to teach part time couldn't easily commit.)

Do I think someone needs a 600-hour certification to teach an amazing group reformer class? Nope! When I honestly look at what I teach in my group classes, I don't use most of what I learned directly in instructor training. Of course, continuing education is super important, but that's another topic that I'm not talking about here.

**I'm talking about producing an MVT who can teach an MVC.** A 600-hour TT program is not required for that.

Plus, typical 600-hour TT programs don't actually prepare their graduates to deliver an MVC anyway! So many TT programs are heavily focused on proper execution of individual exercises on all the apparatus rather than the core principles of teaching Pilates to a group class.

For example, I recently reviewed the manual for a popular Mat TT program delivered by a world-renowned training institution that was adapted for group fitness pros at gyms. Unfortunately, the manual was literally the same text and exercise photos I got in my comprehensive training 12 years ago, minus all the good stuff about structuring a class and managing students in real-time. In an effort to make the training shorter, the program cut out all the teaching elements and left all the choreography, almost 1/3 of which I'd never teach in a group class. There was no mention of sequencing and no mention of broad safety beyond the ~30 exercises in the manual.

This is the perfect example of how a TT program does not produce an MVT because it doesn't actually cover all the components required for an MVC.

### Implement a Build-Measure-Learn Loop

Building an MVP is only the start of the startup growth process, though. Once a startup has an MVP, they have users use it, they observe what happens, and they make changes. It's called a Build-Measure-Learn loop, and it's the heart of *The Lean Startup.*

That's how it should be for Pilates teaching, too. As long as the core elements of the MVC are delivered, there is tons of room to refine style, cues, pace, exercises, and more.

Here's the basic process for a Build-Measure-Learn Loop in Pilates:

* **Build**: Create a new class structure, sequence, or cue.

* **Measure**: Observe what happens with your students when you try something new. Directly ask them about their experience. Remember, as a teacher, you cannot read minds.

* **Learn**: Based on the data, refine your approach.

There are some very basic skills missing in today's new Pilates instructors that are crucial for becoming a better teacher. Namely, in the measuring and learning phases. Part of this problem exists because of poorly evolved TT programs. But part of it exists because we just aren't very good at soliciting, recording, and interpreting student feedback in Pilates (or fitness in general).

I think implementing this loop across the board would drastically change how many of us teach our students now, as well as affect how TT programs are structured.

In fact, I read a great interview with Bob Liekens last week where Bob mentioned that Romana *did* make changes to Joe's method, in large part because the way it was spreading meant she couldn't work 1:1 with her apprentices for 3 years like she wanted. So, she had to make things a little more rigid to control safety and quality because she was observing that the output of what some of her apprentices taught was not what was intended. She made thoughtful changes to support the evolving Pilates landscape. Whether she meant to or not, she applied Lean Methodology to Pilates because she adjusted what and how she taught based on what she observed.

### Validate What You Learn

Without observation and directly asking students what their experience was like, you may draw the wrong conclusions and then base many more classes and cues on feedback that was misinterpreted. Before making a change based on your observations you must make sure you've actually interpreted the data correctly.

Ever hear of correlation doesn't equal causation? That's what's at play here. Was the cue you used the game changer? Or was there something else affecting the outcome like a different footbar height or spring setting?

We are incorrectly attributing sub par instructors these days with new "big box" TT programs. But the reality is the legacy programs haven't evolved either. No one has gone back to square 1 and asked themselves *what is the MVP I want to build?* What's the desired outcome for this TT course?

Once you have a clear objective, you can then identify what indicators you should measure to verify whether you achieved the objective or not.

### Leading Indicators

In startups, you can't just measure success by revenue alone — you have to track meaningful progress toward your overall vision. It's the same in Pilates. That means setting meaningful success metrics — ones that reflect real-world client outcomes, not just business KPIs like revenue. This is why I think tech innovation in Pilates is so important. We need tools like class feedback apps, client progress trackers, and wearables to get on the proverbial Pilates train.

In a software startup, leading indicators that may foretell whether a main KPI like revenue will suffer might be customer retention, daily active users, cost to acquire a customer, or even number of support tickets submitted. It all depends on what the main business objective is.

In Pilates, these are the things that are leading indicators to a studio's revenue KPI:

* Are clients moving differently because of your classes?

* Are they progressing toward goals they care about (pain reduction, strength gains, better balance)?

* Are they gaining confidence and autonomy in their movement?

* Are they referring your studio or class to friends and family?

While the answers to these questions may impact whether your revenue grows, just because your revenue grows doesn't mean you are succeeding in these areas. Measuring these outcomes requires more than looking at a monthly accounting report. It means constant iteration of your build-measure-learn loop to figure out *exactly* the impact you are having on your clientele. What are your customer's actually experiencing? That's why Part 2 of my A Great Class series is so important.

Why do the answers to these questions matter? Because ultimately you want to double down on the things that actually work! A studio may be seeing great overall revenue in the short term, but if they aren't measuring these leading indicators they may falsely attribute it to the wrong thing. That could lead to wasting a lot of effort, time, and money on something that doesn't actually scale the business.

If you don't actually know what's working, you aren't scaling something sustainably.

### Where We Go From Here

One of the reasons we got to this place with new instructors is because of a frankenstein-esque evolution of how Pilates TT is designed and delivered. Comprehensive TT programs, much like the one I went through 12 years ago, are big investments of time and money, and focus very much on properly teaching individual students correct choreography (form). Great for dedicated instructors who want to make a career of teaching small group classes and 1:1 sessions.

But these days most studios only offer group classes so the typical 600-hour TT program probably isn't the answer anymore.

The environment we teach Pilates in now is far different than pre-pandemic times, much less 10, 20, or 30 years ago. Not only that, but our students and society are different. Therefore, how we teach needs to adapt. Pilates TT programs need to evolve drastically to not just make more money, but produce better teachers for less time/money commitment so that ultimately more students get great instruction around the world.

I'm not 100% sure what that evolution looks like yet, but I do know Lean Methodology is the way we'll get there.$body$,
  '2025-04-30',
  'https://kaleenc.substack.com/p/lean-pilates-it-s-not-what-you-think'),

-- ===== POST 15 =====
('unlocking-pilates-studio-business-success',
  'Unlocking Pilates Studio Business Success',
  'The Key Metrics Every Studio Owner Should Know',
  $body$Running a successful Pilates studio isn't just about delivering a great workout—it's also about understanding how your business is performing. Metrics may sound intimidating and unsexy, but they're important tools to help you make smarter decisions... on the way to making more money! And according to a recent report by the BFS Network, the most successful studios aren't doing anything flashy—they're simply consistent with the basics.

Let's break down the key business metrics that separate top-performing boutique studios from the rest—and how you can start using them today.

### The F.E.R. Formula: Find, Enroll, Retain

The BFS Network uses a simple formula to describe the journey of a new client:

**Find** them -> **Enroll** them -> **Retain** them.

Here's what that means:

- **Find**: Successful studios bring in 10-50+ new leads every month.
- **Enroll**: At least 30% of those leads become paying members.
- **Retain**: They keep those members around—losing less than 5% of them each month.

This system isn't fancy, but it works. If you track these numbers monthly, you can spot where you're doing well—and where there's room to grow.

### What Is Retention—and Why It Matters

**Retention** refers to how many of your clients stick around month to month.

If you had 100 clients in May and lost 5 of them by June, your monthly churn rate is 5%, and your **retention rate** is 95%. The higher your retention, the better—because keeping an existing client is usually much cheaper than finding a new one.

**Example:**
Let's say you have 80 clients going into June, and 4 cancel before July 1st.

- Retention rate = ((80 - 4) / 80) x 100 = **95%**

Tracking retention helps you understand if your classes, instructors, and customer experience are good enough to keep people coming back.

### What Is Customer Acquisition Cost (CAC)?

Your **Customer Acquisition Cost (CAC)** is how much you spend to get one new paying customer. This includes marketing expenses (ads, events, referral bonuses) and staff time spent on sales.

**Example:**
You spent $500 on ads in a month and brought in 10 new clients.

- CAC = $500 / 10 = **$50 per customer**

If your membership costs $200/month, a CAC of $50 might make sense—you break even after the first month. But if your CAC is higher than your first month's revenue, you'll need a longer retention time to make that customer profitable.

### Consistency Over Flashiness

One of the clearest messages in the BFS Network report is that the best studios don't rely on fancy marketing hacks or big influencer partnerships. Instead, they do the basics—really well.

In fact, **44% of profitable studios say referrals are their best source of new leads**. That means word-of-mouth is your most powerful (and cheapest) marketing tool. If your clients love their experience, they'll bring friends. So, focus on creating a referral-worthy experience every time.

### Location Affects Revenue—but Not Always Overhead

Urban studios tend to charge more and bring in more revenue per client than suburban ones. But interestingly, their rent per square foot isn't dramatically different.

Here's what the data shows:

- **One-third of city studios** charge $250+ per month.
- **Only 22% of suburban studios** charge that much.
- **Over half of urban studios** generate $200+ in monthly revenue per member.

This means that in cities, people may be more used to paying premium prices for boutique fitness—and they expect high quality. If you're in a suburban area, it's still possible to charge more, but you'll likely need to clearly communicate the value you're offering.

### Pilates Studios Are Leading in Profitability

Pilates studios—especially those offering private or small-group classes with premium equipment—tend to have **higher profit margins** than other modalities.

Why? A few reasons:

- Smaller class sizes = more personalized attention (and higher rates)
- Studios can operate in smaller spaces = lower rent
- Pilates clients are often willing to pay more for specialized instruction

Compare that to yoga studios, which often operate in larger spaces with lower-priced memberships. Many yoga studios make under $500K a year and operate on slim margins, often less than 10%.

If you're a Pilates studio owner, this is good news—but it's also a reminder to price your services in line with the premium value you provide.

### The Power of a Strong Team

The studios with **20%+ profit margins** almost always have one thing in common: a dedicated manager.

- **67% of high-profit studios** have a manager.
- Only **33% of low-profit studios** do.
- A quarter of high-profit studios pay their manager **$75K or more**—an investment that pays off.

Hiring a strong manager or lead instructor helps you offload day-to-day tasks so you can focus on strategy, growth, and client relationships.

### What's Missing

Interestingly, the report doesn't touch on instructor quality or recruitment. My hypothesis is that one of the key factors influencing retention is instructor quality, and very little objectively useful information exists on training, recruiting, and formulating a clear teaching philosophy and brand.

### Final Thoughts

The takeaway from the BFS Network data is clear: **success in boutique fitness is less about being trendy and more about being consistent**.

Know your numbers. Track your retention. Watch your customer acquisition cost. Invest in your team. And focus on building a studio that people can't wait to tell their friends about.

You don't need to be perfect—you just need to get a little better at the unsexy things every month.$body$,
  '2025-06-03',
  'https://kaleenc.substack.com/p/unlocking-pilates-studio-business-success'),

-- ===== POST 16 =====
('when-client-feedback-leads-you-astray',
  'When Client Feedback Leads You Astray',
  $$Don't build your studio strategy around the loudest voice—build it around a better system.$$,
  $body$Today I got word that two of my Level 1 Pilates students stopped coming to my classes because I was "too hard."

That stung a little. But it also sparked a bigger reflection.

### The Setup

I teach at the local YMCA, where the demographic tends to skew older, with clients who may be less mobile or managing injuries. These two students had taken classes before—one with a more classical instructor who went slower and used heavier springs, the other with a newer instructor who favored lighter springs and contemporary choreography. Then they took mine.

The first class with these students I did everything I was supposed to: I asked for feedback, invited them to share thoughts after the first class, and told them I'd check in before the next one so we could make adjustments. I explained this was a calibration class.

But they didn't come back.

One of them reportedly said she was sore for two days and that it was too much. When our director offered to pass on feedback to me, she declined, simply saying, "She's just not for me."

And you know what? That's okay.

### The Problem Behind the Problem

The issue isn't really that two people didn't like my class. As tempting as it is to change my ways to avoid this kind of feedback in the future, it has to be kept in perspective.

Not every teacher is a perfect fit for every client. That's true in Pilates, fitness, education—anywhere. I come across this conundrum while running Flexia all the time. My team cares about our customers. But usually the loudest customers don't represent the majority. Deciding when to implement systemic changes requires a look across all customers and soliciting feedback from them, not just listening to the two animated folks in the inbox at the time.

So, the bigger question is: **How does a studio or manager actually know when feedback should prompt change, and when it's just a mismatch?**

In this case, my boss likely hears from two kinds of clients:

1. The ones she sees all the time around the club and casually exchanges words with
2. The ones who are upset enough to seek her out and complain

This environment is so normal in all businesses, much less Pilates studios. It creates a skewed view. Silent majorities rarely speak up unless prompted. And informal feedback (even when well-intentioned) often comes from emotion rather than pattern recognition.

It's a conundrum for studio managers, especially when one-off negative feedback puts them in the awkward position of deciding whether to coach an instructor or let it go. It's equally frustrating for instructors—especially those who care deeply about doing a good job, evolving, and meeting students where they are.

So... what can we do?

### Three Questions That Studios Need to Answer

1. **How do studio managers know when feedback reflects a trend versus a one-time mismatch?**
You can't manage what you can't measure. But most feedback loops in boutique fitness are anecdotal, inconsistent, and emotionally loaded. That's a recipe for reactive decisions and confused clients and instructors.

2. **How can clients know what to expect before they take a class, so they aren't surprised or disappointed?**
"Level 1" might mean "entry-level" to one instructor and "solid beginner's workout" to another. Without clear expectations, clients rely on trial and error to find the right fit—which can lead to premature drop-off.

3. **How can instructors get actionable feedback without requiring people to complain to a manager?**
No one enjoys that dynamic. Clients feel awkward, instructors feel blindsided, and managers feel stuck in the middle.

### A Short-Term Solution

Here's what would help, and it's not rocket science:

* **Curriculum clarity.**
Each class should have a clearly defined level, focus, and pace—with names and descriptions that match. "Level 1" should mean the same thing across instructors. Avoid vague terms. Be explicit. Perhaps even have two versions: one that is for instructors and uses more Pilates-specific language to help them understand what to teach, and another that is client facing and uses plain language to describe the experience.

* **Actionable instructor bios.**
Instead of listing hobbies or favorite reformer exercises, bios should describe teaching style, pace, spring preferences, and training background. That helps clients self-select into classes that align with their needs. Having a variety of instructors is a great thing. But let's make it clear how they're different so clients can more quickly find what they're looking for.

* **Routine, inclusive surveys.**
Every student—not just the vocal ones—should be surveyed regularly. Not after every class, but maybe once a quarter or once a month. These surveys should systematically solicit feedback about disappointments AND wins, and should verify that the client experience overall matches the intention. This gives a fuller picture of instructor performance and student satisfaction without relying on emotionally charged moments.

### Final Thought

It's easy to take negative feedback personally. And it's easy to assume we should change everything to avoid ever upsetting a client.

But good instruction isn't about pleasing everyone—it's about clarity, consistency, and communication.

Let's create systems that help everyone—students, instructors, and managers—understand what's working and what's just a matter of preference.

Because sometimes, "too hard" just means "not the right fit"—and that doesn't mean you're doing anything wrong.$body$,
  '2025-06-09',
  'https://kaleenc.substack.com/p/when-client-feedback-leads-you-astray'),

-- ===== POST 17 =====
('i-vibe-coded-a-pilates-app-in-10',
  'I Vibe Coded a Pilates App in 10 Days',
  $$And it's already helped me save time and make my clients happier$$,
  $body$One of my regulars came up to me before class yesterday. "I'm going to visit my family next month and want to keep up my Pilates work. Do you have any YouTube recommendations for me? I don't want to lose what I've built over the last few months."

"As a matter of fact, I do!" I said.

So, I pulled up the Pilates Homework website on my phone, dropped in 9 mat Pilates classes of mine, and had her type in her email.

Boom! 15 seconds later she had an email with a message from me listing all 9 classes she could take while she was gone.

I was giddy. There is nothing like building something that works exactly the way you intended.

In less than 60 seconds I created a list (complete with links, titles, descriptions, and equipment needed) of my classes on YouTube and emailed it to her.

### The Need

My Pilates Homework app wasn't built on a whim. I've been hacking together plans for my clients for years. Things I've tried:

- Hand writing notes on a scrap piece of paper (sometimes with stick figures, sometimes on a regular piece of paper)
- Filming my clients on their phones during a session, so they can repeat at home
- Emailing a link to a youtube video... only after I've spent 5 minutes trying to find it (forget about sending multiple links)
- Recommending generic YouTube searches like "free Pilates hip strengthening class" and hoping what they find isn't bullshit
- Telling them to search for specific instructors on YouTube, like Jessica Valant, even though I haven't extensively taken her classes

Look, I don't have enough in-person clients to warrant building out a whole online portal and charging $20/month for it. The dollars exchanged just wouldn't make the effort (and expenses worth it). That online portal also doesn't solve the whole "making a plan" problem. I still have to tell them what to do and how often.

And, I genuinely want to be helpful. It's better for our in-person sessions if my students can make progress while they're *not* in the studio.

So, a Pilates Homework app seemed like low-hanging fruit and the perfect opportunity to hone my vibe coding (aka building-an-app-with-AI-since-I-don't-know-how-to-code) skills.

### Where I Started

I built the Pilates Homework app in less than 10 days (78 AI edits and 122 messages, to be exact) on Lovable. I *love* Lovable. But before I got on Lovable I first tried a few other methods on a few other project ideas.

First, I tried using Claude (an AI that is known for its coding prowess) to walk me through building an iphone app in X Code, Apple's proprietary language for building their native apps. I was able to create a working preview, but as soon as I started making refinements and connecting elements together (like the phone's microphone) I broke the app and couldn't figure out how to fix it. I moved on.

Then, I tried using Claude to build a web app with a language called react. I've heard that a lot of developers find X Code to be frustrating, so I thought I'd start with an app that works in a browser. It was much more intuitive than X Code, though I still ran into problems I couldn't figure out how to overcome.

I found that my biggest limitations were trying to follow Claude's instructions. I was using an IDE (Integrated Development Environment) and I didn't always know what Claude was asking me to do. I'd have to ask a bunch of clarifying questions every time Claude gave me an instruction because I didn't have the foundational experience to navigate a development environment.

While I learned a lot about the underlying structure and language I was working in this way, it was really frustrating. I'd feel like I took a step forward, and then I'd have to back up and fix things or look up a new reference. It was slow, and while it is ultimately farther and faster than I would go with plain ol' taking a full-on coding course, I thought I should try one of the other tools that vibe coders on reddit were raving about: Lovable. Lovable promised to be quicker and simpler, with no backend or architecture knowledge required. With a live preview displayed alongside the chat transcript, it seemed like a more intuitive building environment for a coding dumb-dumb like me.

### Meet My New Best Friend, Lovable

My Google search tells me that "Lovable AI is an AI app builder that helps you create real, working apps with artificial intelligence baked in—without writing code."

But in reality, Lovable is my new best friend. I am obsessed.

In just a few messages exchanged with Lovable, I can create a whole new feature on my web app that actually works. The time from prompting to testing the new thing I asked for is often less than 90 seconds, and that time frame is addicting. Talk about rapid prototyping!

I go to sleep thinking about my app and wake up planning my day around the things I want it to do for me. I have to leave to go teach Pilates? Wait, let me run just one more change to the UI. Let me ask Lovable just one more question about architecture.

Gone are the days of explaining my ideas to a developer and waiting days or weeks to see if they got my vision right. Wondering if what I think *should* work *actually* works.

Pilates Homework isn't the first app I built on Lovable. I made three simple apps before it, though none were as complete. Each one taught me about working in the Lovable environment so by the time I started my 4th app, Pilates Homework, I had experienced some of the do's and don't's of using AI to build something reliable, safe, and helpful. This was important because even though I don't need to write code on Lovable, I still had to learn the right questions to ask, the context to provide it, and how to integrate it with a custom domain, marketing software, and a database.

I still don't know anything about writing code or about the traditional ways software developers make an app. But, I've learned more about defining requirements, making changes, and integrating the pieces of a functional web app than I could have if I was outsourcing the build to a team.

### The Reality of Vibe Coding

Of course, I've run into all the problems other vibe coders complain about on reddit:

- Asking for one specific change and finding that Lovable changed that thing PLUS two others I didn't ask for (whyyyy)
- Updating the design of the app (colors, layout, spacing, etc.) is cumbersome and often two steps forward one step back (see above bullet)
- Running into a failed implementation, asking it to be fixed, and burning several messages (the things Lovable charges me for) telling Lovable to try again because its fix didn't actually work.

None of these things have stunted my progress with Lovable, though. They've forced me to get more educated about the structure of what I'm building, debug methodically, and tailor my next questions or directions more clearly so Lovable can execute effectively.

My friend David said it well: treat AI like a junior developer. They can build great things but you have to give them robust enough information for them to do it.

### What's Next for Pilates Homework?

I built Pilates Homework to solve a personal need. I don't think I'm alone in wanting an easier way to assign a client homework for the time between their sessions.

That said, it's still just a passion project I'm having fun with. I've got big ideas for my next startup and the last two weeks have helped me acquire new skills with AI that will only make whatever I do next better, faster, more exciting.

So for now, Pilates Homework is FREE. There are no limits, and I'm making updates almost every day to create a more helpful and intuitive user experience. If you're a Pilates instructor and want to use it, head over to PilatesHW.com to sign up and play around. And if you want to talk about it, DM me, comment below, or shoot me an email. I'd love to chat about how you're using it, what you want to see next, and as always, the future of Pilates and tech.$body$,
  '2025-07-23',
  'https://kaleenc.substack.com/p/i-vibe-coded-a-pilates-app-in-10');

-- ---------- Mirror into brain_entries ---------------------------
insert into public.brain_entries (type, title, content, source_url, is_active, token_estimate)
select 'blog_post', title, body, substack_url, true, null
from _blog_seed
on conflict (type, title) do update set
  content = excluded.content,
  source_url = excluded.source_url,
  is_active = excluded.is_active;

-- ---------- Mirror into blog_posts ------------------------------
insert into public.blog_posts (slug, title, excerpt, body_markdown, body_html, status, published_at, canonical_url)
select slug, title, subtitle, body, null, 'published', published_at::timestamptz, substack_url
from _blog_seed
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  body_markdown = excluded.body_markdown,
  status = excluded.status,
  published_at = excluded.published_at,
  canonical_url = excluded.canonical_url;
