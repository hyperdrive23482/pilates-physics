# Spring Gauge — Product Requirements Document

**Working name:** Spring Gauge
**Status:** Draft v2 — pre-prototype, requirements review in progress
**Date:** 2026-09-20
**Owner:** Kaleen

**Revision note.** v2 incorporates measured inputs from real reformers — 0" resting gap, 3–30 lbf single-spring range — which reset the error budget (§5.3), the sensor spec (§6.1) and the firmware thresholds (§7.2, §7.3). It also adopts two governing decisions: **precision over absolute accuracy** (§5.6), and **year one is descriptive with no alerts** (§10). Several earlier requirements were wrong against the real load range and are marked as superseded rather than deleted, so the reasoning stays auditable.

**Reviewed and settled:** measurement method, error budget, sensor selection, calibration policy, year-one alerting stance.
**Not yet reviewed:** multi-tenancy scope, device identity and service end-of-life, the purchase case, prior art. See §16.

---

## 1. Summary

A handheld instrument that measures the tension of a Pilates reformer spring *in situ* — without removing the spring, dismounting it, or taking the reformer out of service. The device is a rigid 8-inch strut with a load cell in line. The operator hooks up one spring, pushes the carriage out, and inserts the strut between the carriage wheel and the spring bar. The stretched spring compresses the strut; the device reads the force, waits for it to settle, beeps, and records it.

Because the strut is a fixed length, every measurement is taken at the same spring extension. That is the whole trick: it converts "how strong is this spring" — a question with no single answer — into a repeatable number that can be tracked over months and years.

The product is a **physical device sold to studios**, paired with a **cloud record** in the existing Pilates Physics Supabase backend that stores every measurement and plots each spring's force over time.

---

## 2. Problem

Reformer springs fatigue. They lose tension gradually, unevenly, and invisibly.

A studio has no way to know that its "red" spring on Reformer 3 now pulls 11% less than the identical red spring on Reformer 1 — so a client doing the same exercise on two different machines gets two different workloads, and an instructor cueing from experience is cueing against a number that has quietly moved.

Today the options are: replace springs on a calendar schedule whether they need it or not, replace them when someone notices something feels off, or never. None of these produce data.

**What is missing is a measurement layer.** Not a judgment about how a studio maintains its equipment — a way to see a quantity that currently cannot be seen.

---

## 3. Users and jobs

| User | Job |
|---|---|
| **Studio staff member** (front desk, junior instructor) | Walk the floor once a quarter and measure every spring on every reformer, quickly, without needing to understand the physics. Not interrupted by the tool. |
| **Studio owner / manager** | See which springs have drifted, decide what to replace and when, budget for it. Prove to themselves the equipment is consistent machine to machine. |
| **Instructor** | Know that "two red springs" means the same thing on every reformer in the room. |
| **Pilates Physics (us)** | Sell and support the device; aggregate anonymized data to learn how reformer springs actually age. |

### Primary flow (staff member, quarterly walk)

1. Wake device. It shows the studio's reformers.
2. Tap **Reformer 1**.
3. Hook up **only** spring 1. Tap **Spring 1**.
4. Push the carriage out, insert the strut between carriage wheel and spring bar.
5. Live force appears on screen. When it holds steady, the device beeps, records, and prompts **"Remove device — ready for Spring 2."**
6. Remove strut, unhook spring 1, hook spring 2, repeat.
7. After spring 5: **Reformer 1 complete.** Options: *Next reformer*, *Save and exit*, *Exit without saving*.
8. Session syncs to the cloud when the device next sees WiFi.

Target: **under 6 minutes per reformer.**

---

## 4. Scope

### In scope for v1

- 8" fixed-length compression strut, single point-force measurement per spring
- Colour touchscreen with the guided reformer → spring → capture flow
- Automatic stability detection, audible confirmation, auto-advance
- On-device storage as the source of truth
- WiFi upload to the Pilates Physics backend
- USB cable export to a laptop
- Studio web dashboard: **descriptive only in year one — no alerts** (§10). Consistency view, measurement history, instrument health.
- **Planned replicates**: one randomized repeat measurement per session, to establish real-world repeatability (§10)
- Prompted final reading on any spring being replaced, before it comes off the machine
- **Check standard in the box**, measured at session start, with backend drift normalization (§5.6)
- Ambient temperature logged with every measurement
- Incoming inspection of new springs against a ±10% nominal band
- Per-unit factory calibration, with an on-device field-verification routine

### Deferred to v2+

- **Warning and alert rules of any kind.** Thresholds are derived from year-one data, not chosen in advance (§10). Designed now so the schema supports them; not built.
- Two-point measurement (force at two lengths) to derive spring rate `k` and preload `F₀` rather than a single point force. **Candidate for promotion from deferred to planned** — it produces the `(k × stretch) + b` model that existing Pilates Physics content already teaches, and resolves the positioning tension in §5.7.
- Bluetooth / native mobile app
- Adjustable strut length for cross-brand comparability
- Tower, Chair, Cadillac and Springboard spring measurement
- Aggregate cross-studio benchmarking

### Explicit non-goals

- **This is not a safety certification device.** It does not certify that a spring, reformer, or studio is safe. See §12.
- Not a legal-for-trade scale. Nothing is bought or sold by its readings.
- Not a replacement for manufacturer maintenance guidance.

---

## 5. The measurement method

### 5.1 Physics

A reformer spring behaves approximately as `F = F₀ + k·x`, where `F₀` is preload (the tension already present as the coils separate) and `x` is extension beyond the free length. Force therefore depends entirely on how far the carriage has travelled. "How strong is this spring" is not a well-posed question without specifying `x`.

The 8" strut fixes `x`. Insert it and the carriage is held at exactly one position, every time, on every reformer of the same model. The number the device reports is the spring's force at that standardized extension.

### 5.2 What this does and does not let you compare

- **Comparable:** the same spring position on the same reformer, measured months apart. This is the fatigue signal, and it is the product.
- **Comparable:** springs of the same colour across reformers *of the same make and model* in the same studio. This is the consistency signal.
- **Possibly comparable across brands — pending verification.** The original concern was that the resting gap between carriage wheel and spring bar differs by manufacturer, so a fixed 8" strut would yield different extensions and non-comparable forces. **Measurement says the gap is 0"**, which means extension is 8.000" regardless of machine. If that holds across every brand at launch, cross-brand numbers compare *actual springs* rather than measurement artifacts, and the comparison is legitimate.

  This is a meaningful expansion of the product's value and should not be claimed until verified per brand. Until then: every reformer record carries make and model, and the UI keeps cross-brand comparison behind an explicit opt-in rather than presenting it by default.

### 5.3 Error budget — quantified against measured inputs

Measured on real machines: **resting gap is 0"**, so extension is a full 8.000". **Single-spring force range is 3–30 lbf.** Both numbers are load-bearing for everything below.

The detection target is spring fatigue, plausibly 5–15% over the service life of a spring. To resolve a 5% change with confidence, measurement repeatability must be around **±1%**.

#### The master equation

Since `F = F₀ + k·x`, an error `δ` in the strut's effective length produces a force error `dF = k·δ`. Dividing through:

```
dF/F  =  k·δ / (F₀ + k·x)  ≤  δ / x  =  δ / 8"
```

Preload only ever enlarges the denominator, so `δ/8"` is a conservative upper bound. Two consequences:

1. **Relative error is roughly constant across spring weights.** A light spring has a proportionally smaller `k`, so the same length error costs the same percentage. A single length-repeatability spec covers the entire 3–30 lbf range.
2. **±1% requires total length repeatability within ±0.08"** — about 1/12".

Suggested allocation:

| Source | Budget |
|---|---|
| Seating repeatability | ±0.040" |
| Elastic compliance under 30 lbf | ±0.020" |
| Thermal, manufacturing, wear | ±0.020" |
| **Total** | **±0.080" → ≤ 1%** |

#### What this changes

**Compliance is a much smaller problem than it first appears.** At 30 lbf with `k ≈ 3 lbf/in`, 0.010" of elastic shortening costs 0.03 lbf — 0.1% on a heavy spring. An earlier draft of this document demanded < 0.010" under 100 lbf; against the real load range that was over-engineering by roughly 4×.

**Revised structural position.** A stiff printed structure with metal end fittings is viable at these loads. Metal is still preferred, but the argument is **durability and long-term dimensional stability**, not instantaneous deflection: a strut that is dropped, left in a hot car, or absorbs moisture changes length permanently, and length *is* the calibration.

**Seating remains the dominant mechanical term, and is now relatively more dominant.** A 1/8" seating variation is 1.6% — over budget on its own. Requirements unchanged and still high priority:

- **The end fittings self-locate to better than 1/32".** A flat pad against a round carriage wheel is a point contact that can walk sideways. The wheel end needs a V-groove or cupped seat; the spring-bar end needs a feature that keys positively into the bar. No geometry may permit two meaningfully different seated positions.
- **The length is verifiable in the field.** Ship a gauge block so a studio can confirm the strut is still 8.000" after it has been dropped.

**At the light end, the load cell becomes the limiting factor — this inverts the usual assumption.** ±1% of a 3 lbf reading is ±0.03 lbf. A load cell specified at 0.05% combined error *at full scale* delivers that only if full scale is at or below roughly 60 lbf. A 100 kg cell would give ±0.11 lbf, or 3.7% at 3 lbf — four times over budget. This drives sensor selection in §6.1 and makes a mechanical overload stop mandatory.

#### Stated spec

**Short-term repeatability: ±1% of reading, or ±0.05 lbf, whichever is larger.** At the 3 lbf floor that resolves to ~1.7%, which is honest and still sufficient: the lightest springs carry the same *relative* fatigue signal, and the sibling-comparison alert in §10 compares like to like regardless.

**This is a repeatability figure, not an accuracy figure, and the distinction is deliberate — see §5.6.** Absolute accuracy is relaxed to ±3%; long-term instrument stability is tightened to ±1% over 12 months and is the spec that actually gates the product.

### 5.4 Acceptance test for the measurement method

> One operator, one spring, five consecutive insert-measure-remove cycles. All five readings within **±1%** of their mean.
>
> Then: three different operators, same spring, five cycles each. All fifteen within **±2%** of the grand mean.

**Run this at both ends of the range** — the lightest spring (~3 lbf) and the heaviest (~30 lbf). They fail for different reasons: the heavy end exposes seating and compliance, the light end exposes load cell resolution and zero drift. A device that passes at 30 lbf tells you nothing about 3 lbf.

If the device cannot pass this, no amount of firmware, dashboard, or data model work matters. **This test gates everything downstream.**

### 5.5 Measured inputs and remaining unknowns

**Resolved by measurement on real machines:**

1. ~~**Resting gap**~~ — **0"**. The carriage wheel meets the spring bar at rest, so an 8" strut produces a full 8.000" of extension. The strut length *is* the extension. This also means there is no partial-insertion failure mode: the strut defines the entire gap or it is not seated at all, which is good for repeatability.
2. ~~**Clearance for the strut**~~ — **confirmed**. A clear, straight, axial load path exists. End-fitting geometry still needs detailing against the actual bar and wheel faces (§5.3).
3. ~~**Force range**~~ — **3–30 lbf per spring.** Substantially lower than the original 10–40 lbf assumption, and it changes both the sensor spec (§6.1) and the error budget (§5.3).

   **Independently cross-checked against existing Pilates Physics measurements.** The six-brand spring curves behind `docs/blog-drafts/a-spring-is-not-one-weight.md` give starting tension and rate per brand and colour. Projected to 8" of extension: a Balanced Body red (8 lbf at home, ~44 at full stretch) lands near 18 lbf; a Peak red (17 lbf at home, gentle climb) near 26; the lightest Align springs start near zero and land near 3. The 3–30 lbf range holds.

   **One caution.** Align's strong green — the steepest spring in that whole comparison, finishing around 83 lbf — projects to roughly 29–30 lbf at 8", i.e. right at the ceiling with no margin, and higher still if carriage travel is shorter than assumed. **Treat 35 lbf as the design ceiling rather than 30.** The 20 kg cell (44 lbf FS) already accommodates this; the firmware warn threshold in §7.3 should be checked against it.

**Still open:**

4. **Settling behaviour.** How long after insertion does a spring's force stop creeping? Sets the stability window in §7.3.
5. **Insertion ergonomics — now a sharper problem.** With a 0" resting gap, the carriage must be pulled the full 8" against the spring and *held there* while the strut is threaded in. That is up to 30 lbf held one-handed. Worth prototyping a strut that parks on the spring bar first so the carriage can be eased onto it, rather than requiring simultaneous hold-and-insert.

**Stored energy, for the safety case.** At `k ≈ 3 lbf/in` over 8", the strut holds back roughly 8 ft·lbf. A carriage released suddenly travels the full 8". That is more than enough to injure a hand, and it is why the retention requirement in §6.2 is not negotiable.

### 5.6 Precision over accuracy — the governing spec philosophy

**Read this before §5.3, §6.1 and §11. It reframes all three.**

Two requirements, stated by the product owner and load-bearing for the whole design:

- Springs are expected to fall within **±10% of manufacturer spec**.
- **Detecting a trend over time matters more than the exact value on the day.**

These are not the same requirement, and separating them changes what has to be engineered.

#### What gets easier

**Absolute accuracy is demoted.** A device that reads 3% high — consistently, forever — produces *perfect* trend data. The offset cancels in every comparison that matters: this spring versus itself last quarter, this spring versus its siblings today. Consequences:

- **Per-unit traceable calibration is no longer a hard requirement.** §11 originally specified calibration against traceable masses with a record shipped per unit. That is a meaningful production cost, and for trend detection it buys very little. Relaxed to a stability requirement.
- **Load cell non-linearity largely cancels.** Non-linearity is a fixed function of load; across a 5–15% change in a spring's force it shifts by a second-order amount. It is close to irrelevant here, which is the opposite of how load cells are usually selected.

#### What gets harder — and this is now the top risk in the project

**Instrument drift is indistinguishable from spring fatigue.** If the device loses 2% per year, every spring in every studio appears to weaken by 2% per year. It is a plausible-looking, fleet-wide, monotonic signal pointing at exactly the conclusion the product exists to support — and nothing inside the data can contradict it.

This is worse than a noisy instrument. Noise is visible; a slow consistent bias is not. **A device that is imprecise fails loudly. A device that drifts fails silently and sells spring replacements that were not needed.**

The selection criteria for the load cell therefore change. What matters is no longer combined error, but the datasheet lines usually ignored:

| Spec | Why it matters now |
|---|---|
| **Repeatability** | The direct term in trend uncertainty. Typically 0.02–0.03% FS — better than combined error. |
| **Creep / creep recovery** | The strut is held loaded for seconds at a time, repeatedly. |
| **Temperature coefficient of zero and span** | See the seasonal problem below. |
| **Long-term stability** | The actual enemy. |
| ~~Non-linearity~~ | Largely cancels. Do not pay for it. |

**The seasonal artifact.** Studios are warmer in summer. If the load cell has a temperature coefficient and nothing corrects for it, the fleet will show an annual cycle in spring force that is entirely an artifact of the instrument. It will look like a real finding. Two mitigations, both required: record ambient temperature with every measurement (§9.3), and ship a check standard.

#### The check standard — required, not optional

The metrologically correct answer to "trend matters more than absolute value" is a **reference artifact measured at every session**.

A fixture — a die spring or Belleville stack in a dimensionally stable housing — that applies a fixed, repeatable load when the device is inserted into it. The operator measures it at session start. That reading is stored with the session.

This converts instrument drift from an invisible confound into a **correctable term**: the backend normalizes every session against its check-standard reading, and a device that has drifted 2% has its entire history corrected rather than quietly poisoning it. It also gives the studio a one-tap answer to "is the device still good?" without shipping it anywhere.

Cost is low — it is a spring in a block. It should be in the box with every unit.

#### The ±10% band, and a new use case

Expecting springs within ±10% of manufacturer spec gives a screening threshold, and with it a **second product use case worth naming: incoming inspection.** Studios buy replacement springs and currently have no way to check them before installation. Measuring a new spring against nominal catches a bad one before it goes on a machine and before it becomes someone's baseline.

One caveat to resolve: manufacturers publish colour and weight *classes*, not force-at-extension curves, so "manufacturer spec" may not exist as a number at 8" of extension. If it does not, the baseline becomes a **Pilates Physics reference table** — new-spring force at 8", by brand and colour, built from measurement. That table is itself a durable product asset and a reason for studios to stay on the platform. Added to §16.

#### Revised spec targets

| Property | Target | Rationale |
|---|---|---|
| Absolute accuracy | ±3% of reading | Loose. Cheap. Sufficient. |
| Short-term repeatability | ±1%, or ±0.05 lbf | Sets per-session confidence. |
| Session-to-session difference | ±1.4% (√2 × above) | This is the number that gates trend detection. Detects a 5% change comfortably. |
| **Long-term instrument stability** | **±1% over 12 months**, verified by check standard | **The critical spec.** |
| Screening band vs. nominal | ±10% | Incoming inspection. |

### 5.7 Positioning: a single number, against "a spring is not one weight"

**A conflict with existing Pilates Physics content, worth resolving before any marketing copy is written.**

The post drafted at `docs/blog-drafts/a-spring-is-not-one-weight.md` argues — correctly, and as its central thesis — that a spring's resistance is a slope rather than a value, and that *"you cannot rank two springs with a single number, because the ranking itself changes depending on how far the carriage has traveled."*

This device reports a single number.

Someone will notice, and the sharpest version of the objection comes from our own best content. It needs an answer that is true rather than a deflection.

**The answer: the device's number is a tracking standard, not a characterization.**

Two different questions are being confused:

- *"How heavy is this spring?"* — genuinely unanswerable with one number. That is the blog's thesis and it stands.
- *"Has **this** spring changed?"* — answerable with one number, provided it is taken at a fixed extension every time. Comparing a spring to itself at 8" over four quarters is valid precisely because everything except the spring is held constant.

The product measures the second question. The copy must say so plainly and must not imply the first. A line like *"the force this spring produces at a standard 8-inch extension"* is accurate; *"your red spring is 18 pounds"* reproduces exactly the error the blog exists to correct.

**This materially strengthens the case for two-point measurement in v2.** Force at two lengths yields `k` and `F₀` — which is precisely the `Force = (k × stretch) + b` model the blog already teaches. A v2 device would output the thing the content says is the correct way to describe a spring, rather than the thing it says is insufficient. That is unusually tight product-content alignment and is an argument for promoting it from "deferred" to "planned."

### 5.8 Validate the premise before building the instrument

Questions 1–3 and part of 5 are now answered. What a digital luggage scale and an 8" steel bar still buy, for about $15 before any custom hardware, is the question underneath the whole project — **is spring drift actually detectable at the magnitude assumed?** If a five-year-old spring reads within noise of a new one, the product thesis needs revisiting before money is spent. Measure the oldest and newest springs available, at both ends of the weight range.

---

## 6. Hardware requirements

### 6.1 Architecture

| Subsystem | Requirement | Working choice |
|---|---|---|
| Load sensing | Axial compression, in-line with the strut. Full scale **40–60 lbf**. Select on **repeatability, creep and temperature coefficient**, not combined error (§5.6). **Mechanical overload stop mandatory** | S-beam load cell, **20 kg (44 lbf FS)**, threaded both ends |
| Temperature | Ambient sensor, logged with every measurement | On-board digital sensor, thermally coupled to the load cell, not to the backlight |
| Signal chain | ≥ 20-bit effective resolution, ≥ 10 SPS | HX711, or NAU7802 (I²C, better noise) |
| Compute + UI | Colour touchscreen, WiFi, USB serial, driven by one SoC | ESP32-S3 with integrated touch LCD (2.4–2.8", 320×240 min) |
| Real-time clock | Battery-backed, ±2 min/year | DS3231 |
| Local storage | Non-volatile, survives power loss, ≥ 10,000 measurements | microSD or onboard flash |
| Audio | Distinct capture tone, audible over studio music | Piezo buzzer |
| Power | ≥ 8 h continuous use, USB-C charging, state-of-charge on screen | LiPo ~2000 mAh + charge/protection board |
| Structure | Metal load column; enclosure carries no load | See §5.3 |

**Why an S-beam and not a bathroom-scale load cell.** The cheap half-bridge cells from bathroom scales are designed to sit under a platform and sum with three siblings. Used singly and in-line they are sensitive to off-axis loading — which is precisely this device's dominant failure mode. An S-beam is designed for exactly this topology: threaded at both ends, load along the axis.

**Why 20 kg and not 100 kg.** Load cell error is specified as a percentage of *full scale*, so an oversized cell degrades the low end disproportionately. Against a 3 lbf minimum reading:

| Cell | Full scale | 0.05% FS | Error at 3 lbf |
|---|---|---|---|
| 100 kg | 220 lbf | ±0.11 lbf | **3.7%** — fails |
| 30 kg | 66 lbf | ±0.033 lbf | 1.1% — marginal |
| **20 kg** | **44 lbf** | **±0.022 lbf** | **0.73%** — passes |

20 kg gives the resolution the light springs need while leaving 47% headroom over the 30 lbf maximum.

One qualification, per §5.6: the table above uses *combined* error, which bundles non-linearity — and non-linearity largely cancels in trend measurement. The binding numbers when comparing candidate cells are **repeatability** (typically 0.02–0.03% FS, better than combined) and **temperature coefficient**. A larger cell with excellent repeatability could be made to work; 20 kg is recommended because it satisfies both criteria without argument.

**Why the overload stop is mandatory, not a nicety.** A 20 kg cell has roughly 66 lbf of safe overload and fails permanently above it. The realistic accident is a staff member inserting the strut with more than one spring attached — two springs is ~60 lbf and survivable, all five is ~150 lbf and destroys the cell silently, after which the device keeps reporting plausible-looking wrong numbers.

Requirement: **a metal shoulder that bottoms out at ~40 lbf**, shunting all load above that around the cell rather than through it. Firmware pairs with it — any reading above 35 lbf raises *"Load out of range — check that only one spring is attached"* and refuses to record.

**Why one SoC.** An ESP32-S3 with an integrated touch display provides the screen, WiFi, and USB serial from a single part. All three required connectivity paths (§8) fall out of the same chip. Using a **pre-certified radio module** is also a material regulatory decision — see §12.3.

### 6.2 Physical requirements

- Overall length **8.000" ± 0.005"**, measured between load-bearing faces. Total in-service length variation (seating + compliance + thermal) within **±0.080"** per §5.3.
- Withstands a 1 m drop onto a sprung studio floor without loss of calibration
- **Survives insertion with all five springs attached (~150 lbf) without damage to the load cell or permanent set**, via the mechanical overload stop in §6.1. This is the expected user error, not a hypothetical one.
- Cleanable with the disinfectant wipes studios already use
- Retention feature — lanyard, captive hook, or geometry — so that a strut which slips under load **cannot become a projectile**
- High-visibility colour; it will be set down on a beige reformer

---

## 7. Firmware requirements

### 7.1 State machine

```
IDLE ──► SELECT_REFORMER ──► SELECT_SPRING ──► ARMED ──► CAPTURING
                                   ▲                         │
                                   │                         ▼
                                   └──── RECORDED ◄─── STABILIZED
                                            │
                                            ▼
                                   REFORMER_COMPLETE
                                     ├─ Next reformer
                                     ├─ Save and exit
                                     └─ Exit without saving (confirm)
```

### 7.2 Arming — prevents the most likely data corruption

After a capture, the device **must not** arm the next one until the load has returned below a release threshold of **0.75 lbf** for at least 1 second. Without this, a strut left in place will happily record spring 1's force again as spring 2. This is the single most likely way the device produces silently wrong data.

The threshold has to sit well below the 3 lbf lightest spring. An earlier draft specified 2 lbf, which is close enough to a light spring's reading to make release detection unreliable.

### 7.3 Stability detection

Capture fires when **all** hold:

- Rolling window of **2 s** (tunable; confirm against §5.5 item 4)
- Peak-to-peak within the window **< max(0.05 lbf, 0.5% of current reading)**
- Absolute magnitude **> 1.5 lbf** — above noise, below the lightest real spring
- Reading **< 35 lbf** — above that, refuse and warn per §6.1
- Device is in ARMED state per §7.2

On capture: record, beep, display the value, advance. The recorded value is the mean of the stable window, not an instantaneous sample.

**Both thresholds are set by the measured 3–30 lbf range, and an earlier draft had them wrong.** A fixed 0.2 lbf peak-to-peak gate is 6.7% of a 3 lbf reading — far too coarse to certify a light spring as stable — hence the proportional term. And a 3 lbf magnitude floor sits exactly *at* the lightest expected spring, so the device would have refused to capture the very readings it exists to take.

**Zero stability matters more at this range than at higher loads.** A 0.05 lbf zero drift is 1.7% of a 3 lbf spring. Two consequences: forced tare at session start, at the ambient temperature of use; and the load cell must be thermally isolated from the LCD backlight and the LiPo, which are the two heat sources in the enclosure.

### 7.4 Operator overrides — non-negotiable for a product other people use

- **Manual capture.** A button that records now, regardless of auto-stability. Auto-detect will fail on some spring somewhere and the staff member must not be stranded.
- **Retake.** Staff will know when a read was bad. Let them redo it. The retake is stored as a new row referencing the one it supersedes; nothing is deleted.
- **Skip / mark absent.** Springs break, get removed, or a reformer runs four instead of five.
- **Back.** Mis-taps happen.

### 7.5 Zero and span — two operations, deliberately separated

**Verification and calibration are different, and only one of them belongs in a studio's hands.**

- **Verification** measures a known artifact and *reports* deviation. Changes nothing.
- **Calibration** changes the instrument's transfer function, and injects a step discontinuity into every trend that crosses it.

**The governing rule: users re-zero freely, users never re-span.**

Zero drifts with temperature and orientation, is re-established every session anyway, and adjusting it is harmless. Span is the long-term stability the product is selling (§5.6). A studio that re-spans quarterly against their hand weights will inject 2–3% jumps indistinguishable from spring events — and will do it *because they are being conscientious*.

There is also a hard constraint: **calibration requires a reference better than the instrument.** A studio does not have one. Studio hand weights are ±5% at best; calibrating a ±1% instrument against them reliably makes it worse.

#### Tier 1 — Zero. Automatic, unrestricted.

- **Auto-tare** whenever load reads below threshold for 5 s in IDLE
- **Forced tare** at session start, strut free and unloaded, at the ambient temperature of use
- **Tare must be taken in the orientation of use.** The strut is used horizontally; its own mass loads the cell differently than when vertical. A tare taken on a bench standing upright is wrong for the measurement that follows.

#### Tier 2 — Verification. Routine, reports only, never adjusts.

- **Check-standard reading at session start** (§5.6). The device prompts, stores the reading with the session, and warns if it deviates beyond tolerance. Skippable — but the session is flagged unverified and the dashboard says so.
- **On-demand verification** from the menu, for a studio that wants to satisfy itself between sessions.
- Both report deviation in plain language. Neither writes a new calibration factor. Ever.

#### Tier 3 — Span adjustment. Guarded, recorded, rare.

Exists for a genuinely changed instrument, not for maintenance: a replaced or repaired load cell, a hard drop, or a check-standard deviation large enough (> 5%) that something is broken rather than drifted.

Requirements:
- Owner or manager role, not staff
- Explicit confirmation naming the consequence: *"This changes how every future measurement compares to your history."*
- Writes a `calibration_events` row (§9.2) that the backend uses to annotate or break the affected series
- Never triggered automatically, and never silently

#### Correct in software, not in hardware

The device's span is **not** adjusted from the check standard. The check reading is stored; the backend applies the correction. This is strictly better than field adjustment on four counts: it is reversible (raw counts are preserved), retroactive (it fixes history, not just future readings), auditable, and it creates no discontinuity.

The principle: **keep the device dumb and stable, put the intelligence in the backend where it can be revised.** A device that adjusts itself has already contaminated the raw counts it stores, and the correction can never be undone.

One consequence to surface in the UI rather than let someone discover: **the value shown on the device and the value stored in the database may differ slightly after normalization. That is correct behaviour, not a bug.**

- Two-point factory calibration (zero + known mass), factor stored in NVS
- Every measurement records the calibration factor in force at the time, so a drifted or mis-calibrated unit can be corrected retroactively

### 7.6 Configuration

- Reformer count and per-reformer spring count, set per studio
- Reformer labels, make, model
- Units: lbf / kgf toggle (display only — see §9.3)
- WiFi credentials via captive portal (§8.2)
- Firmware OTA update over WiFi

### 7.7 Stack

PlatformIO + Arduino framework + LVGL for the UI. Well-trodden on ESP32-S3 touch boards, and the UI is simple enough that LVGL's widget set covers it without custom rendering.

---

## 8. Connectivity and sync

### 8.1 Store and forward — the governing principle

**Local storage is the source of truth.** A measurement is written to non-volatile storage at the instant of capture, before any attempt to transmit. Sync is opportunistic on top of that. A session is never lost because the studio WiFi was down, the password changed, or the router was rebooted.

Every session and every measurement carries a **UUID generated on the device**. Ingest is an upsert on that UUID, so retries are safe and duplicates are impossible by construction.

### 8.2 Paths

| Path | Role | Notes |
|---|---|---|
| **On-device storage** | Source of truth. Always. | Retains ≥ 12 months of sessions. Never auto-purged while unsynced. |
| **WiFi → HTTPS POST** | Primary sync | Device authenticates with a per-device API key. Uploads any unsynced session on connect, and on a timer. |
| **USB cable** | Fallback and export | Enumerate as serial; a Chrome-based web page uses Web Serial to pull sessions as JSON/CSV. Works with no network at all. |
| **SoftAP captive portal** | WiFi provisioning | Not a chosen sync path, but required infrastructure: joining studio WiFi needs an onboarding interface, and the device's own AP plus a config page is the standard way. Comes essentially for free and doubles as an emergency data-download route. |
| **Bluetooth** | Deferred | Cut from v1. Web Bluetooth does not exist on iOS Safari, so "BLE to a phone" means shipping a native iOS app — a second product. Revisit only if a real need appears. |

### 8.3 Studio WiFi is hostile

Assume captive portals, guest networks that block outbound POST, WPA2-Enterprise, and staff who do not know the password. Requirements:

- Clear, non-technical connection status on screen
- Explicit **"N sessions waiting to sync"** indicator, so nobody assumes data is safe when it is not
- Sync never blocks measuring — the device is fully usable offline, forever
- USB export documented as the supported fallback, not a workaround

---

## 9. Backend and data model

### 9.1 The significant finding: multi-tenancy is net-new

The current Supabase schema is user-centric — `auth.users`, `user_entitlements`, `webinars`, `course_progress`. **There is no studio or organization concept.** Selling a device to a studio where several staff members share one account's data requires introducing tenancy from scratch. This is the largest backend line item in the project and should be scoped as its own workstream, not folded into "the device talks to the API."

### 9.2 Proposed tables

Following the conventions in `supabase/migrations/` — heavily commented, service-role writes for anything that functions as a record, RLS on read.

| Table | Purpose |
|---|---|
| `studios` | Tenant root. Name, timezone, owner. |
| `studio_members` | `studio_id` × `user_id` × role (owner / manager / staff). |
| `devices` | Serial, hardware rev, firmware version, hashed API key, owning studio, calibration factor and date, last seen. |
| `reformers` | Per studio. Label ("Reformer 1"), make, model, serial, spring count, active flag. Make and model are required — §5.2 depends on them. |
| `springs` | Per reformer **position**, with `installed_on` / `removed_on`. Colour, type, part number. |
| `measurement_sessions` | Device UUID, studio, operator, start/end, status, firmware version, calibration factor used, units displayed, **check-standard reading and its expected value** (§5.6), **ambient temperature at session start**. |
| `measurements` | Session, reformer, spring, position, force, raw counts, calibration factor, stability metrics, capture mode (auto/manual), `retake_of`, device timestamp, **ambient temperature (required)**, **`is_replicate` and `replicate_of`** (§10), **`operator_id` (required)**, **`context`** — one of `routine`, `incoming_inspection`, `pre_replacement`. |
| `spring_types` | Reference table: brand, colour, part number, **nominal force at 8" extension**, source of that nominal (manufacturer published vs. Pilates Physics measured baseline). Backs the ±10% screening band and the incoming-inspection use case. |
| `calibration_events` | Append-only. Every span adjustment (§7.5 tier 3): device, old and new factor, who authorized it, reason, check-standard reading before and after. Trend queries use this to break or annotate series that cross a calibration boundary. Service-role writes only — a device-writable calibration log is exactly as spoofable as a browser-writable audit log. |
| `device_ingest_log` | Append-only audit of every upload, following the `activity_events` and `stripe_events` pattern. |

### 9.3 Data model decisions worth arguing about now

**Spring replacement must be a first-class event.** If a studio swaps the spring in position 3 and the system does not know, the trend chart shows a mysterious jump where there should be a new baseline — and the fatigue signal is destroyed. This is why `springs` rows are per-installation, not per-position, with `installed_on` / `removed_on`. Replacing a spring closes one row and opens another, and the chart breaks the series there.

**Store position *and* colour.** Staff swap springs between positions. A colour that disagrees with the expected colour for that position is a detectable, flaggable error rather than silent bad data.

**Store SI canonically, convert for display.** `force_n` in newtons is the stored value. The screen shows lbf or kgf per user preference. Note for the copy: what a studio calls "kg" here is **kgf, a force**, not a mass — the device measures pull, not weight. Worth getting right on a physics-branded product.

**Store raw counts alongside converted force.** With the calibration factor recorded per measurement, a unit found to have been mis-calibrated — or found to have drifted, which §5.6 makes the likelier case — can have its entire history corrected rather than discarded. This is the mechanism that makes the check standard useful, so raw counts are required, not a debugging convenience.

**Temperature is required on every row.** Not for correction in v1, but so a seasonal instrument artifact can be *detected*. Without it, a temperature-driven annual cycle in the fleet is indistinguishable from a real finding, and there is no way to go back and check. Backfill is impossible, which is why it exists from day one — the same reasoning as the `source` column in `042_activity_events.sql`.

**Never overwrite a stored force with a drift-corrected value.** Store the correction as a separate derived column or view. The measurement is the measurement; the correction is an interpretation, and interpretations get revised.

**Replicates are ordinary measurements, flagged — not a separate table.** `is_replicate` plus `replicate_of` keeps them in the same rows as everything else so they cannot be accidentally excluded from, or double-counted in, an analysis. A replicate is a real measurement of a real spring; it just also happens to be evidence about the instrument.

**`context` exists because the same spring measured for three different reasons means three different things.** A pre-replacement reading is end-of-life data, an incoming-inspection reading is a new baseline, and a routine reading is trend. Deriving this later from timestamps and spring install dates is guesswork; capturing it at the moment of measurement is free.

**Device writes go through a service-role endpoint only.** Per the pattern established in `042_activity_events.sql`: no client-writable INSERT policy on measurement tables. The device authenticates to `api/device/ingest.js` with its per-device key; the endpoint validates, stamps server-side fields, and writes with the admin client from `api/_lib/supabase-admin.js`.

### 9.4 Endpoints

- `POST /api/device/ingest` — accepts a session payload, upserts on device UUIDs, returns the set of UUIDs durably stored so the device can mark them synced
- `POST /api/device/claim` — binds an unclaimed device serial to a studio
- `GET /api/device/config` — device pulls reformer list and settings for its studio
- `GET /api/device/firmware` — OTA manifest

---

## 10. Studio-facing dashboard

Lives alongside the existing site, gated by studio membership.

Lives alongside the existing site, gated by studio membership. Ordered by when each surface starts being useful.

**Useful from the first session, no history required:**

- **Consistency view.** All springs of the same colour across same-model reformers, side by side. A studio's most actionable question is "do my reformers match each other," and this answers it from day one. **This is the year-one product** — see below.
- **Incoming inspection.** Measure a new spring before installing it, check it against nominal, accept it as a baseline or reject it before it goes on a machine (§5.6). Gated on the nominal table existing (§16).
- **Session history.** Who measured, when, with which device, at what calibration.
- **Instrument health.** Check-standard readings over time (see below).
- **Export.** CSV, because a studio owner will want it in a spreadsheet.

**Accumulates value over quarters:**

- **Fleet view.** Every reformer, every spring position, current force, change since baseline, percentage of nominal. Reports magnitude only — **no severity colouring in year one**, because severity implies a threshold and no threshold exists yet.
- **Spring trend.** Force over time for one position, with spring replacements marked as series breaks and annotated. Plots check-standard-normalized values, with raw available on toggle. Needs roughly four sessions before it says anything.

### Year one is descriptive. No alerts. Deliberately.

**For the first year, the product reports measurements and does not warn about them.**

This is not a scope cut for convenience — it is the only defensible position. A warning threshold requires knowing what normal quarter-over-quarter variation looks like in a real studio, and that distribution does not exist yet. Any threshold set before the data arrives is a guess, and a guess that fires wrongly on a physics-branded product costs more credibility than shipping without alerts costs in features.

Three consequences:

**Year one's real job is to build the reference distribution.** The deliverable is not a warning system; it is the dataset from which a warning system can later be derived honestly. That reframes what "done" means for v1.

*Reading note: this assumes year one means the first year of field use in studios, not a year of internal development before anyone sees the device. If year one is purely internal, most of this section still applies — but the §16 question about how the first cohort is sold and priced does not.*

**Instrument stability matters more, not less.** Year-one measurements become the baseline every future threshold is computed against. A device that drifts 2% during year one does not just produce 2% of bad readings — it bakes a permanent bias into the reference distribution, and every threshold derived from it inherits the error invisibly. The §5.6 check standard is now protecting the dataset, not just the device.

**Liability drops substantially.** No alert means no advice, which makes §12.2 considerably easier to write and to stand behind.

### What must be captured in year one, because it cannot be backfilled

**Planned replicates — required.** At a random point in each session, the device prompts the operator to re-measure a spring already measured in that session. The reading is stored flagged as a replicate.

This is the only source of real-world repeatability — including operator technique and seating variance on an actual studio floor, which bench characterization (§14 Phase 1) cannot produce. Without it, year one ends with twelve months of data and still no defensible threshold. Cost is roughly 30 seconds per session.

The device chooses the spring, not the operator. It cannot be truly blind, since the operator must be told to repeat something, but randomized selection prevents systematic gaming.

**Operator identity — promoted from nice-to-have to required.** Separating reproducibility (different people, same spring) from real change (same spring, months apart) is half the threshold calculation, and it is impossible without knowing who held the device. See §16 for whether this is a verified fact or a dropdown assertion.

**Spring replacements — prompted, not hoped for.** A replacement is a natural experiment: the new spring and the one it replaced, measured on the same device on the same day. That is a direct measurement of lifetime loss, which is precisely the fatigue curve the product is trying to learn. The device should prompt for a final reading on the outgoing spring before it comes off the machine.

### What the studio sees in year one

With no alerts, the dashboard needs a job on day one. It has one:

**The consistency view is the year-one product.** Same-colour springs across same-model reformers, compared within a single session — one device, one day, one calibration, one temperature. It requires **zero history**, works from the very first session, and is immune to instrument drift. It answers the question a studio owner can act on immediately: *do my reformers match each other?*

Trend is the year-two product. The pitch has to lead with what works on day one, not with what works after four quarters.

### Alert rules — deferred to year two, designed now

Recorded here so the data model supports them, not to be built in v1:

1. **Sibling deviation.** Deviation from the mean of same-colour springs on same-model reformers in the same session. Immune to instrument drift; the natural first alert once thresholds exist, because it is already the year-one view with a threshold attached.
2. **Longitudinal drift.** Deviation from a spring's own baseline. The headline feature, and the one a drifting instrument corrupts — **must be computed against check-standard-normalized values, never raw ones.**
3. **Screening against nominal.** Outside ±10% of type nominal (§5.6). Available earlier than the other two if the nominal table exists, since it needs no history at all.

**Thresholds for all three are derived from year-one data, not chosen.** Expect confirmation across consecutive sessions rather than single-reading triggers: a 10-reformer studio measuring quarterly generates roughly 200 comparisons a year, and a single-excursion trigger at any reasonable threshold will fire on noise often enough to be ignored.

### Instrument health surface

Because trend is the product and drift is the threat, the studio needs to see instrument state, not just spring state:

- Check-standard reading over time for their device, with the ±1%/12-month band drawn on it
- A plain-language status: *"Device verified 3 days ago, reading within tolerance"*
- A warning when no check-standard reading has been taken in N sessions, because a trend built on an unverified device is not a trend

---

## 11. Calibration and quality

**Rewritten against §5.6.** Because trend matters more than absolute value, the goal here is not accuracy — it is *stability*, and the ability to detect and correct drift after the fact.

- **Per-unit factory calibration** to set the initial factor, written to device NVS and to the `devices` table. Traceable masses are useful but **not required**; a consistent shop reference is sufficient, and dropping the traceability requirement removes real per-unit production cost for very little lost value.
- **A check standard ships in the box** (§5.6). A fixture applying a fixed repeatable load, measured at session start, stored with every session. This is the primary drift defence and replaces most of what a calibration certificate would have done.
- **Backend normalizes against the check standard.** A device found to have drifted has its entire measurement history corrected, not discarded. This is the payoff for storing raw counts and the calibration factor per measurement (§9.3).
- **Ambient temperature recorded with every measurement**, so a seasonal instrument artifact can be identified rather than published as a finding.
- **Annual re-verification recommended**, with the on-device routine (§7.5) and the check standard as the studio's own check between times.
- **Field span adjustment is guarded, not routine** (§7.5 tier 3). The studio's normal loop is verify-and-report; the backend corrects. Offering a friendly "calibrate your device" button would be the single most effective way to destroy the trend data the product exists to produce.
- **Serial number on the housing and in firmware**, matching.

**What a unit must be qualified against before sale:** ±1% stability over 12 months. That is a shelf-life and soak-test question, not a calibration-bench question, and it needs a plan — see §16.

---

## 12. Safety, compliance, liability

### 12.1 Physical safety

The device operates inside a loaded spring system. Requirements:

- Retention so a slipping strut cannot become a projectile (§6.2)
- On-screen safety guidance at session start
- Printed quick-start card covering carriage control and pinch points
- Fail-safe geometry: if the strut is going to fail, it must fail by staying put, not by ejecting

### 12.2 Liability framing — get this right in the copy

**Year one helps here.** A device that reports numbers and issues no warnings makes no safety claim and gives no advice, which is a substantially easier position to defend than one that tells a studio a spring is fine. The disclaimer below is required regardless, but it is more credible when the product's behaviour matches it.

The most dangerous misreading of this product is a studio concluding that a device-approved spring is a *safe* spring, or that measuring absolves them of inspection. Required, stated plainly in the UI, the manual, and the marketing:

> This device measures spring force. It does not certify equipment safety, and it does not replace visual inspection or manufacturer maintenance guidance. Replace springs according to your manufacturer's recommendations.

Legal review of the warranty, disclaimer, and terms is a **gate on first sale**, not a follow-up task.

### 12.3 Regulatory

These apply because it is a product being sold, and would not apply to a personal tool. They kill hardware projects late if discovered late.

- **FCC Part 15 / ISED.** The device has an intentional radiator. Using a **pre-certified radio module with a modular grant** reduces this from a full certification programme to unintentional-radiator testing plus correct labelling. This is a strong argument for a module over a bare chip, and the decision has to be made before layout, not after.
- **Lithium battery shipping.** UN 38.3 testing and correct packaging/labelling for shipping units containing a LiPo cell.
- **CE / UKCA** if selling into Europe or the UK. Scope later; do not design it out.
- **Not legal-for-trade.** Nothing is sold by weight, so NTEP / NIST Handbook 44 obligations do not apply. Worth documenting so the question does not resurface.
- **RoHS / WEEE** for European sales.

---

## 13. Cost and manufacturing

**Prototype BOM, order of magnitude:**

| Item | Est. |
|---|---|
| ESP32-S3 touch display board | $15 |
| S-beam load cell, 20 kg | $25 |
| ADC (HX711 / NAU7802) | $3 |
| DS3231 RTC | $3 |
| LiPo + charge/protect | $12 |
| Buzzer, wiring, microSD | $8 |
| Load column, end fittings, overload stop, hardware | $30 |
| Temperature sensor | $2 |
| Check standard (die spring + housing) | $15 |
| Filament, iterations | $10 |
| **Total** | **~$100–130** |

Calibration masses add roughly $40 if known weights are not already on hand.

**Production** is a different exercise: injection or machined housing, assembly fixtures, calibration station, certification, packaging, manual. The prototype proves the concept; it does not predict the unit cost. Target pricing and gross-margin analysis are **open items** and should not be guessed in this document.

---

## 14. Prototype plan

Each phase has a gate. Do not pass a gate on optimism.

**Phase 0 — Validate the premise (1 afternoon, ~$15).**
Geometry and force range are now measured (§5.5), and cross-check against the existing six-brand curves. **Start by documenting the method that produced those curves** (§16 item 20) — it is already a working apparatus and may shortcut this phase entirely.
What remains is the thesis itself: oldest available spring versus newest, at both ends of the weight range.
*Gate: is drift detectable at the magnitude assumed? If not, stop and rethink.*

**Phase 1 — Bench rig (1 weekend).**
20 kg cell + HX711/NAU7802 + ESP32 on the bench. Calibrate against known masses. Characterize noise, zero drift, warm-up, and thermal sensitivity — the last one matters more here than it would at higher loads.
*Gate: ±0.02 lbf resolution and < 0.05 lbf zero drift over a 30-minute session, at room temperature. The 3 lbf floor is the demanding case, not the 30 lbf ceiling.*

**Phase 2 — Mechanical (the long pole, 2–4 weekends).**
Load column, end fittings, overload stop, shell. Iterate the seats until §5.4 passes at both ends of the range.
*Gate: §5.4 acceptance test — ±1% single-operator repeatability at 3 lbf and at 30 lbf.*
*Second gate: insert with five springs attached. The cell survives and the device warns.*
This is where the project actually lives. Budget accordingly — though the relaxed compliance budget in §5.3 makes it less punishing than originally scoped.

**Phase 3 — Firmware and UI (1–2 weekends).**
Full state machine, stability detection, arming, overrides, local storage.
*Gate: a full 2-reformer × 5-spring session, offline, with no operator confusion.*

**Phase 4 — Backend and sync (1–2 weekends).**
Studio tenancy, device registry, ingest endpoint, WiFi provisioning, USB export.
*Gate: a session measured offline syncs cleanly, and a repeated upload creates no duplicates.*

**Phase 5 — Dashboard (1 weekend).**
Consistency view, measurement history, instrument health. **No alerts** (§10).
*Gate: the consistency view delivers something actionable from a single session, with no history.* That is the year-one value proposition, and if it does not stand on its own the product has nothing to offer until year two.

**Phase 5b — Threshold derivation (year two, not a weekend).**
With twelve months of data including replicates and pre-replacement readings: compute real-world repeatability, characterize normal quarter-over-quarter variation, derive thresholds, then build the alert rules in §10.
*Gate: a threshold that can be defended from the data rather than chosen.*

**Phase 6 — Productization.**
Enclosure for manufacture, certification, calibration process, manual, pricing.

---

## 15. Success metrics

| Metric | Target |
|---|---|
| Absolute accuracy | ±3% of reading — deliberately loose (§5.6) |
| Single-operator repeatability | ±1%, verified at both 3 lbf and 30 lbf |
| Cross-operator repeatability | ±2%, verified at both ends |
| **Long-term instrument stability** | **±1% over 12 months** — the spec that gates the product |
| Sessions carrying a check-standard reading | ≥ 90% |
| Sessions carrying a planned replicate | ≥ 90% |
| Springs with ≥ 4 sessions of history at 12 months | ≥ 80% — this is what makes threshold derivation possible |
| Pre-replacement readings captured on replaced springs | ≥ 70% |
| Survives five-spring misinsertion | No damage, warns, refuses to record |
| Time per reformer (5 springs) | < 6 min |
| Sessions lost to sync failure | 0 |
| Staff able to complete a session unassisted after one demo | ≥ 90% |
| Studios still measuring at 6 months | ≥ 60% |

The last one is the real test. A device that gets used twice and goes in a drawer has produced no data and no value — the product is the *trend*, and a trend needs repetition.

---

## 16. Open items

*Items 1–3 of the original list are resolved — see §5.5. Length is confirmed at 8", geometry is confirmed clear, and the 3–30 lbf range has been propagated through §5.3, §6.1, §6.2, §7.2, §7.3, §14 and §15.*

1. **Is the resting gap 0" on every brand at launch?** Verified on the machines to hand; not yet on all of them. If it holds universally, cross-brand comparison becomes a legitimate product feature (§5.2). If it does not, that brand needs its own strut length.
2. **Settling behaviour.** How long does a spring's force creep after insertion? Sets the stability window (§7.3). Answerable in Phase 1.
3. **Insertion ergonomics under a 0" gap** (§5.5 item 5). Holding 30 lbf one-handed while threading the strut may require a park-on-the-bar-first design. Answerable in Phase 2.
4. **Which reformer brands are supported at launch?** Every additional brand is a fixture problem, a comparability caveat, and a support surface.
### Measurement and hardware

4. **Which reformer brands are supported at launch?** Every additional brand is a fixture problem, a comparability caveat, and a support surface.
5. **Check standard design.** A die spring or Belleville stack in a stable housing (§5.6) — needs its own stability spec, since a drifting check standard is worse than none. Ironically this is the one part where a traceable calibration probably *is* worth paying for.
6. **What does a studio verify against, physically?** The shipped check standard is the intended answer, but its design is open (item 5). Studio hand weights are ±5% and are a sanity check, not a reference. If a mass-based routine is offered at all it needs a vertical stand — the strut is used horizontally, and orientation changes the tare (§7.5). Decide whether to ship that stand or omit mass-based verification entirely.
7. **What happens when the check standard itself is lost?** It will be. Sold as a spare, or is the device unverifiable until replaced? Affects whether unverified sessions are accepted, warned, or refused.
8. **How is ±1% over 12 months qualified before first sale?** A soak-and-shelf question, not a calibration-bench question. Options: accelerated thermal cycling, a small fleet on a check standard for a year, or shipping v1 with the claim stated as a design target rather than a verified spec. The third is honest and probably correct for a first production run, but it has to be a decision rather than an omission.
9. **Who calibrates units, and where?** Substantially cheaper than originally scoped now that traceability is not required (§11) — a consistent shop reference suffices. Still needs a process.

### Data and platform

10. ~~**Does manufacturer spec exist as a number at 8" extension?**~~ **Largely answered, and better than expected.** Manufacturers publish colour and weight *classes* rather than curves — but Pilates Physics has already measured force-vs-extension for six brands (`docs/blog-drafts/a-spring-is-not-one-weight.md`). Those curves yield `k` and `F₀` per brand and colour, from which nominal force at 8" is a direct calculation. The reference table behind incoming inspection is therefore mostly **existing work to be formalized, not new work to be funded.** Remaining: confirm the underlying data is new-spring data, decide the tolerance band per tier, and land it in `spring_types` (§9.2).
11. **Multi-tenancy scope — the largest unscoped engineering item** (§9.1). Does a two-location studio get one tenant or two? What happens to data when a staff member leaves? Can an instructor working at three studios see all three? Is there a Pilates Physics admin view across customers, and what does that imply for the data-use language in the terms? One paragraph of design exists; this needs a real pass.
12. **Device identity and provisioning.** How does a per-device API key get onto the device at manufacture? What happens when a studio sells the device, or it is stolen? Key rotation? Named in §8 and §9 but never designed.
13. **What happens to the device if Pilates Physics stops running the service?** Hardware outlives companies, and a studio evaluating a capital purchase will ask. Local-first storage (§8.1) already covers most of it — worth making an explicit commitment rather than an accident of architecture.
14. **Operator identity: verified fact or dropdown assertion?** §10 promotes it to required, but on a shared front-desk device it is almost certainly a selection rather than an authentication. That makes it an assertion, the same distinction `activity_events.source` already draws. Decide and label it honestly in the schema.
15. **Session interruption.** Battery dies mid-reformer, device sleeps, staff walks away. No resume behaviour is specified, and partial sessions need a defined state.
16. **Does the studio tenancy model serve anything beyond this device?** If studio accounts are useful for courses and workshops too, the build is easier to justify and should be designed more broadly than the gauge alone needs.

### Commercial and legal

17. **Pricing and business model.** Device sale only, or device + subscription for the cloud record? Affects whether the backend is a cost centre or a revenue line.
18. **How is the year-one cohort sold?** §10 makes year one descriptive — no warnings — which weakens the conventional pitch. The honest framings are a **design-partner programme** (priced differently, explicitly about helping build the reference data, with something given back) or a straight sale led entirely on the consistency view, which does work from day one. Shapes the marketing copy, the onboarding, and what the first cohort pays. Decide before the first sales conversation, not after.
19. **There is no purchase case in this document.** §3 has jobs but no answer to "why does an owner spend this money." The ROI argument looks strong and is entirely absent: springs cost real money, and replacing on evidence rather than on calendar is a number that can actually be computed. **Recommended next section to write** — it is short, and it decides whether the rest gets built.
20. **Prior art — partly answered from inside the building.** Whatever method produced the six-brand curves (item 10) is already a working spring-measurement apparatus, and its repeatability characteristics are directly relevant to §5.4. **Document that method before designing a new one** — it may already answer questions Phase 0 and Phase 1 are scheduled to ask. External prior art (industrial spring-rate testers, anyone in the Pilates world who has tried this) is still unchecked, and matters both for design ideas and for patent exposure.
21. **Warranty, disclaimer, and terms** — legal review required before first sale (§12.2).

---

## Appendix — rejected and deferred options

**Bathroom-scale half-bridge load cells.** Cheap, but sensitive to off-axis loading, which is this device's dominant error mode. Rejected in favour of an S-beam.

**Raspberry Pi Zero 2W + display.** More capable than needed, slow to boot, requires clean-shutdown handling that staff will not perform. Rejected.

**Bluetooth to a phone as the primary sync.** No Web Bluetooth on iOS Safari, so this requires a native iOS app. Deferred; the SoftAP page and USB cable cover the same need with no app.

**Structural 3D-printed housing.** ~~Rejected on physics.~~ **Partially revived.** The original rejection assumed ~100 lbf working loads, where polymer compliance meaningfully changes the spring extension. At the measured 30 lbf maximum with `k ≈ 3 lbf/in`, the compliance budget is ±0.020" (§5.3) — achievable in a stiff print. Metal remains preferred for the load column, but the surviving argument is long-term dimensional stability rather than instantaneous deflection. End fittings and the overload stop stay metal regardless: they set the seated length and take the 150 lbf abuse case.

**A 100 kg load cell.** Rejected once the 3–30 lbf range was measured. Full-scale-referenced error makes an oversized cell fail badly at the low end — 3.7% at 3 lbf against a ±1% target. See the table in §6.1.

**Measuring a removed spring on a bench rig.** More accurate and far easier to standardize — but it takes the reformer out of service and takes far too long per spring, so nobody would do it quarterly. The *in situ* constraint is what makes the product get used, and being used is what generates the trend. Correctly rejected in favour of a harder engineering problem.
