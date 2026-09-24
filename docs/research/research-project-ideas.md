# Research project ideas

Candidate studies for collaboration with PhD and MS Kinesiology colleagues.
Every item below is anchored to something already covered on Pilates Physics:
an animation, a course module, a measured dataset, or a claim made publicly
that would benefit from being tested rather than asserted.

Written 2026-09-23.

## How to read this

Each idea lists the question, the method, what equipment it needs, and who it
needs. Tiers are roughly ordered by how fast they could produce a result.

| Tier | Theme | Human subjects | Typical lead |
|---|---|---|---|
| A | Equipment characterization | No | MS thesis, or done in-house |
| B | Biomechanics with a body on the machine | Yes, IRB | PhD with lab access |
| C | Dose, load, training response | Yes, IRB, longitudinal | PhD, multi-term |
| D | Perception, teaching, measurement | Yes, survey-level IRB | Either, cheapest to run |
| E | Modeling and simulation | No | MS thesis, computational |

---

## Tier A. Equipment characterization

No human subjects, no IRB, and the equipment access is already there. These are
the fastest path to a first publication together.

### A1. Force-extension characterization of Pilates springs across manufacturers

**Question.** What are the actual stiffness, preload, free length, and
hysteresis values for reformer springs across major brands, and how do the
manufacturer tension labels map onto measured force?

**Why it matters.** "Light," "medium," and "one red" are the field's entire load
vocabulary and none of them are units. A published force-extension dataset makes
every downstream study possible, because it lets any lab report load in newtons
instead of colors.

**Method.** Universal testing machine, or load cell plus linear encoder.
Quasi-static extension across the full carriage travel range, loading and
unloading, multiple specimens per spring type per brand. Report k, intercept,
linearity range, and hysteresis loop area.

**Builds on.** The measured Balanced Body Duro dataset, the spring comparison
post, and the spring load calculator, which currently uses a linear k and b
model that this study would either validate or correct.

**Deliverable.** Open dataset plus a conversion table. Sports Engineering, or
Journal of Bodywork and Movement Therapies for the applied version.

### A2. Fatigue and aging: when does a Pilates spring stop being the spring it was?

**Question.** How do stiffness, free length, and permanent set change with cycle
count and age, and is there a defensible replacement interval?

**Why it matters.** There is no evidence-based replacement guidance anywhere in
the industry. Studios replace springs on vibes. This is the single most
commercially useful thing on the list and it has no competition.

**Method.** Two arms. (1) Accelerated cyclic loading of new springs to fixed
cycle counts, characterizing per A1 at intervals. (2) Field sampling: pull
springs from studios with documented install dates and class volume,
characterize, regress against estimated cycles. Inspect for corrosion under the
coating.

**Builds on.** The elastic vs plastic deformation animation, and the course
module 2 caveat that the calculator assumes a spring still in its elastic range.

### A3. Rolling resistance and starting friction of the reformer carriage

**Question.** How large is carriage friction relative to spring force, how much
does it vary with carriage load, wheel material, and track condition, and does
it ever reach a magnitude a practitioner would perceive?

**Why it matters.** The friction claim in the course is currently a worked
argument from first principles. Measuring it converts an argument into evidence,
including the two interesting parts: that static friction exceeds rolling
friction at movement initiation, and that friction reverses sign at the
direction change.

**Method.** Coast-down testing and instrumented tow tests. Load cell inline on
the rope or a horizontal pull, carriage loaded to a range of masses, repeated on
a maintained machine and a deliberately degraded one (dry track, flat-spotted
wheels).

**Builds on.** Course module 5.

### A4. Empirical validation of reformer pulley mechanical advantage

**Question.** Does the rope-to-carriage relationship behave as the idealized
2:1 model predicts, and how much does rope angle, pulley height, and friction in
the pulley erode that?

**Method.** Simultaneous measurement of rope tension and carriage force across
gear settings, rope lengths, and pull angles.

**Builds on.** Course module 4, the "half is half true" framing, and the
push-through bar and chair pedal force animations, which make the same argument
on different apparatus.

### A5. Cross-brand equivalent load mapping

**Question.** Given a spring combination on brand X at carriage position d, what
combination on brand Y produces the closest force profile, and how large is the
residual error?

**Why it matters.** Instructors do this conversion daily, by feel, when they
teach in a second studio. The conversion charts circulating in the industry are
not derived from measurement.

**Method.** Direct computation from A1 data, then a perceptual check against D2.

---

## Tier B. Biomechanics with a body on the machine

These need a lab: force plates, motion capture, and ideally EMG. This is where a
PhD colleague's existing infrastructure carries the project.

### B1. Ground reaction forces: reformer jumpboard versus standing jump

**Question.** How do peak vertical GRF, loading rate, impulse, and contact time
compare between supine reformer jumping across spring loads and a standing
countermovement jump?

**Why it matters.** The jumpboard is prescribed constantly in return-to-impact
rehab on the assumption that it is a reduced-load plyometric. Nobody has
published where on the loading continuum it actually sits. Two distinct findings
are available: the peak force comparison, and the loading rate comparison, which
may not agree. High force with low loading rate is a very different stimulus
than either coaches or clinicians assume.

**Method.** Force plate mounted behind or instrumented into the jumpboard,
synchronized with a standard force plate for the standing jump. Within-subject,
spring load as a repeated factor. Normalize to body weight. Consider adding knee
kinetics via inverse dynamics if motion capture is available.

**Clinical hook.** ACL return-to-sport progressions, and bone loading in
osteopenic populations, which is a large share of the Pilates client base.

### B2. Model validation: does predicted footwork load match measured footbar force?

**Question.** Do the anthropometric load predictions in the class simulator match
directly measured footbar reaction forces across body sizes?

**Why it matters.** This is a straight model-validation paper, and it is the
study that makes the whole Pilates Physics modeling approach citable rather than
merely plausible.

**Method.** Instrumented footbar or load cell. Subjects stratified by height and
mass. Fixed spring load and gear, measure peak and mean footbar force, compare
against the segment-mass model predictions. Report error and identify where the
model breaks down.

**Builds on.** The class simulator anthropometry tables, the tall versus short
footwork animation, and the transcript seeded for that animation.

### B3. Knee and hip torque in reformer bridging, by spring load and foot position

**Question.** Where does joint torque peak through the bridging range, and how do
spring load and footbar height move that peak?

**Why it matters.** The prevailing teaching cue treats heavier springs as harder.
The free body diagram says the relationship is not monotonic and depends on where
in the range you look.

**Method.** Motion capture plus instrumented footbar, inverse dynamics. Spring
load and footbar height as repeated factors.

**Builds on.** The bridge knee torque animation directly.

### B4. Hip torque through range in feet in straps

**Question.** How does hip joint torque vary through the range of motion, and how
do rope length and spring load shift the point of peak demand?

**Method.** As B3, with rope angle tracked, since the moment arm changes
continuously through the movement.

**Builds on.** The feet in straps hip torque animation.

### B5. Abdominal demand in supine arms in straps, with and without the added ab curl and leg extension

**Question.** Does adding an ab curl or a 30 degree leg extension change trunk
muscle activation and spinal load the way the layered model predicts?

**Method.** Surface EMG of rectus abdominis, external oblique, and erector
spinae, with the four condition combinations as a within-subject factor.

**Builds on.** The class simulator's layered modifiers for that exercise.

### B6. Spring direction and load: the counterintuitive cases

**Question.** In exercises where the spring assists rather than resists, does
increasing spring load reduce muscular demand, and by how much?

**Why it matters.** Reverse plank, long stretch variations, and prone pulling
straps are the exercises where "heavier equals harder" inverts. Measuring the
inversion is a clean, teachable finding.

**Method.** EMG plus kinetics across spring loads for two assisted and two
resisted exercises, same subjects.

**Builds on.** The reverse plank and prone pulling straps entries in the
simulator, and the horizontal spring versus vertical dumbbell animation, which
makes the same point about gravity dependence.

### B7. Classical versus contemporary reformer: same exercise, same body, two machines

**Question.** How much do kinematics and kinetics differ for an identical
exercise performed on a classical and a contemporary reformer?

**Why it matters.** The debate is currently conducted entirely as tradition
versus preference. A neutral measurement paper reframes it as "these are
different exercises," which is both true and defusing.

**Method.** Within-subject crossover, two machines, matched nominal spring load
from A1, three to four exercises. Report carriage travel, rope angle, joint
angles, peak torque.

**Builds on.** Course module 6, which is specified as deliberately neutral.

---

## Tier C. Dose, load, and training response

Slower, harder, and the most valuable to the field.

### C1. Toward load prescription: reliability of a reformer footwork strength test

**Question.** Can a reformer footwork equivalent of a leg press 1RM be
established, and is it reliable test-retest?

**Why it matters.** Pilates has no load prescription standard. Without a reliable
strength measure there is no way to define progressive overload in the modality
at all, which means every question in this tier depends on this study existing
first.

**Method.** Repeated-measures reliability study. Establish protocol, ICC, SEM,
minimal detectable change. Compare against a conventional leg press.

**Builds on.** The progressive overload content.

### C2. Individualized versus standard spring prescription

**Question.** Does prescribing spring load by a body-size model produce different
strength adaptation, RPE, or adherence than standard group-class prescription?

**Method.** Randomized parallel groups over eight to twelve weeks. Requires C1 to
exist for the outcome measure.

**Builds on.** The personalization positioning, tested rather than claimed.

### C3. Mechanical loading dose in Pilates compared with walking and resistance training

**Question.** What is the weekly cumulative impulse and peak loading profile of a
typical Pilates program, relative to activities with established bone density
evidence?

**Why it matters.** Pilates is recommended for osteopenic and osteoporotic
clients constantly, with no quantification of whether the loading dose is in a
range that plausibly does anything for bone.

**Method.** Instrumented sessions plus accelerometry, compared against published
loading profiles for walking, jogging, and resistance training. B1 feeds this
directly.

### C4. Do instructors' recorded settings predict client progression?

**Question.** In studios that record spring settings and modifications session to
session, do those records show measurable progression, and does progression track
any client outcome?

**Method.** Retrospective analysis of session records. Feasibility and data
quality are the real findings here.

---

## Tier D. Perception, teaching, and measurement

Cheapest to run, survey-level IRB, and the results are immediately communicable.
D1 in particular is the study that makes the case for everything else on this
list.

### D1. Between-instructor variability in spring selection

**Question.** Given an identical client profile and exercise, how much do
instructors' spring choices vary, and does the variance track anything about the
client, the instructor's training lineage, or years of experience?

**Why it matters.** If the spread is wide, the field has a measurement problem
and every study above becomes urgent. This is the cheapest study on the list and
the most likely to be cited by the others.

**Method.** Vignette survey with standardized client descriptions, or better, a
live standardized-client protocol with a set of instructors and one machine.
Stratify by certification lineage. Report spread in measured newtons using A1.

### D2. Just-noticeable difference for spring load

**Question.** What is the smallest change in spring force that an instructor or a
client can reliably detect, and does it depend on the exercise?

**Why it matters.** It determines whether half-spring granularity carries
information or is theater, and it sets the resolution any prescription system
should work at.

**Method.** Two-alternative forced choice psychophysics with a spring rig
allowing fine force adjustment. Staircase procedure.

### D3. What do "light" and "heavy" mean? A terminology and calibration audit

**Question.** Do practitioners across brands and schools mean the same force when
they use the same qualitative load word?

**Method.** Survey pairing verbal labels with measured forces from A1.

**Builds on.** The spring comparison post and the "a spring is not one weight"
argument.

### D4. Does physics instruction change teaching behavior?

**Question.** Does a short mechanics-focused continuing education course change
instructors' spring selection, cueing, or confidence, and does the change persist?

**Why it matters.** There is a ready-made intervention, an NPCP-approved CEC
course with a scored assessment already attached, and a cohort who take it. A
pre-post design with a delayed follow-up is achievable without building anything
new.

**Method.** Pre, post, and three-month follow-up on selection vignettes,
confidence, and knowledge. A waitlist group gives a control arm.

**Caveat.** Needs an independent analyst to avoid the obvious conflict of
interest, and the conflict should be declared regardless.

### D5. Do consumer wearables track mechanical work on a reformer?

**Question.** Do heart rate, strain, and calorie estimates from consumer
wearables correspond to measured mechanical work during reformer exercise?

**Why it matters.** Wearable metrics are increasingly used as marketing proof by
studios. A null result is a useful, publishable, and widely shareable finding.

**Method.** Simultaneous wearable output and instrumented mechanical work across
a standardized session. Indirect calorimetry as the criterion.

**Builds on.** The Whoop and Solidcore post, and the tech in Pilates writing.

---

## Tier E. Modeling and simulation

Good MS thesis shape. No lab time, no subjects.

### E1. Publish the reformer load model as an open, validated tool

**Question.** Can the segment-mass load model be formalized, validated against
B2, and released as open code that other labs can cite and extend?

**Deliverable.** A methods paper plus a repository. The class simulator becomes
the reference implementation.

### E2. Musculoskeletal simulation of reformer exercise across body sizes

**Question.** Using OpenSim with scaled models, how do joint and muscle loads in
standard reformer exercises change across anthropometric extremes?

**Why it matters.** Covers body sizes that are hard to recruit for, and produces
the muscle-level detail that surface EMG cannot.

### E3. Sensitivity analysis of reformer adjustments

**Question.** Ranking gear position, footbar height, rope length, shoulder rest
position, and spring selection by how much each changes peak joint torque, which
single adjustment matters most, and for which exercises?

**Why it matters.** The second-order effects claim, that one adjustment changes
several things at once, is currently qualitative. This makes it a ranked,
quantitative answer.

**Builds on.** Course module 3, and the reformer force modeler tool.

---

## Suggested starting set

Three projects that fit together and could realistically run in parallel:

1. **D1, instructor variability.** Cheapest, fastest, needs no lab, and produces
   the framing statistic that justifies everything else. Start here.
2. **A1 and A2, spring characterization and aging.** Data and equipment access
   already partly exist, no IRB, and A2 has genuine commercial value with no
   competing literature.
3. **B1, jumpboard GRF.** The idea that prompted this list. It needs the most lab
   infrastructure, so it should start early, and it has the widest audience
   because it reaches physical therapy and strength and conditioning, not just
   Pilates.

A1 is a dependency for most of the others, since it is what lets every later
study report load in units. Consider running it first regardless of what else
gets picked up.

## Open questions to settle with collaborators

- Which institution holds IRB, and whether equipment access needs an MTA or a
  loan agreement from a manufacturer.
- Whether manufacturer involvement in A1 and A2 is a funding opportunity or a
  conflict of interest problem. Probably both, and it needs deciding up front.
- Authorship order and dataset ownership, especially for A1, which is the one
  with reuse value.
- Whether to target Pilates and bodywork journals for reach within the field, or
  biomechanics and sports engineering journals for methodological credibility.
  The spring characterization work can plausibly do both, with two papers.
- Declared conflicts: reformer design work and a commercial education product
  both need to be on the record, particularly for D4 and any brand comparison.
