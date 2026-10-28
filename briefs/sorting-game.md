# Revision brief: Needs Finding & Sorting Game

**App:** `sorting-game/index.html` in `EmCeeBE695/design-control-learning`
**Owner:** Mario Cabodi (BE695)
**Status:** Content approved by instructor. Implement as written. Do not invent, soften or "improve" any student-facing content; if something in this brief looks wrong, stop and flag it rather than changing it.

## Goal

Raise this app to the standard of `HF-use-error-explorer/index.html`, which is the reference app. In order of importance:

1. Every student action gets an explanation, not just a verdict.
2. The content is accurate and consistent across all three parts.
3. The app looks like it belongs with the later apps.

## Global changes

**G1. Reference look.** Match the Use-Error Explorer's layout, type, color tokens, spacing, top bar and "← Learning Hub" link. Remove all emoji (the reference uses none). Keep it mobile-friendly. Keep the app a single self-contained HTML file.

**G2. Disclaimer.** On the home screen, in small type: *"Devices, numbers and context data in this game are illustrative. Anything labeled 'fictional data' is invented for practice. Standards are named for orientation, not as complete requirements."*

**G3. Verb lesson.** Above the sorting board, one line: *"Don't sort by the verb. 'Must', 'shall' and 'should' turn up in every category in real documents. Sort by what the statement actually says."*

**G4. One user-need text everywhere.** A user need that appears in Part 1, Part 2 and Part 3 must use the identical wording given below in all three places.

## Part 1: Sort

**Mechanic change.** Each round draws 12 statements at random from the pool of 41. Every category must get at least 2, and the rest is random, so students can't fill the last bin by counting.

**Feedback change.** When a student places a statement, show its explanation from the table below, whether they were right or wrong. Wrong answers show *"This one is a [correct category]"* followed by the explanation. End-of-round review lists all 12 with explanations.

**Final pool (41 statements).** Changed items are marked.

### User needs (12)

| # | Statement | Explanation |
|---|---|---|
| UN1 | User must be able to visualize structures throughout the shoulder space | Describes what the surgeon has to accomplish. There's no number or test, so it is confirmed with users (validation), not on the bench. |
| UN2 | Instruments must be reprocessable to achieve sterility assurance | States what the hospital needs (safe reuse) without saying how many cycles or which method. "Must" doesn't make it a design input. |
| UN3 | Product must be provided ready for surgery | The OR team's expectation. Measurable inputs such as sterility assurance level and seal strength are derived from it. |
| UN4 | Device should allow for minimally invasive procedures | A clinical goal. The 5 mm outer-diameter requirement is how engineering turns it into something measurable. |
| UN5 | Device should enable access to small anatomical spaces without tissue damage | Describes the outcome the surgeon needs, not a load, dimension or material. |
| UN6 | Device should provide clear visualization of the surgical area | "Clear" has no number attached. The field-of-view input is what makes it measurable. |
| UN7 *(rewritten)* | Surgeon needs to see joint structures clearly enough to identify tears during arthroscopy | A user, a task and an outcome. It is confirmed by surgeons in simulated use, not by an optical bench test. |
| UN8 *(reworded)* | Surgeon needs an unobstructed view throughout the procedure | What the surgeon experiences. Requirements such as aspiration socket retention are derived from it. |
| UN9 *(rewritten)* | Surgeon needs to reattach torn soft tissue to bone securely enough to allow healing | The clinical outcome. Pull-out strength is the measurable input that stands in for "securely enough". |
| UN10 | Device must have ability to be cleaned by user | Names who (reprocessing staff) and what they need. The protein residue limit is the input. |
| UN11 | Patient needs to know glucose level in blood | The patient's need. Measurement range and accuracy are the inputs. |
| UN12 | Surgeon needs access through one portal to multiple viewing angles | What the surgeon needs during the procedure. The specific angles offered become a design input. |

### Design inputs (17)

| # | Statement | Explanation |
|---|---|---|
| DI1 | Device must have outer diameter of no more than 5 mm | Measurable and verifiable, and it doesn't say how to achieve it. |
| DI2 *(reworded)* | Scope shall provide a field of view of at least 100° at 10 mm working distance | A number, a condition and a test you can run. Note that field of view (how wide you see) differs from viewing direction (the 0°/30°/70° angle). |
| DI3 | Device must withstand force of 10 Newtons without permanent deformation | States the load and the pass criterion. It doesn't say which material or wall thickness. |
| DI4 *(numbers added)* | Device shall retain full function after 500 pre-vacuum steam sterilization cycles at 132 °C, 4-minute exposure | Turns "reprocessable" into a cycle count, a named cycle and a pass criterion. |
| DI5 *(year dropped)* | Product shall demonstrate a sterility assurance level of 10⁻⁶ per ANSI/AAMI ST67 | A measurable target tied to a recognized standard. How you sterilize is a design output. |
| DI6 *(unit fixed)* | Packaging seal strength shall be at least 1 lb/in when tested per ASTM F88 | Seal strength is force per width of seal, and the test method is named, so it can be verified. |
| DI7 *(numbers added)* | Autoclavable camera shall maintain MTF of at least 0.3 at 20 lp/mm after 500 standard reprocessing cycles | Image sharpness as a number, measured after the instrument's service life. |
| DI8 *(numbers added)* | Brightness shall be adjustable from 10% to 100% of maximum output, in 10% steps, via the GUI | A range and a resolution you can check. It doesn't say how the light source is built. |
| DI9 | Scope must come in 0°, 30°, and 70° viewing directions | States what the product line must offer. The tolerances on each angle live in the design output (drawing). |
| DI10 | Device shall exhibit no visible corrosion after exposure to representative cleaning chemicals and steam sterilization | A condition and a pass criterion. It describes performance, not material. |
| DI11 | Device shall maintain functionality and meet dimensional tolerances after 500 standard hospital reprocessing cycles | A cycle count plus pass criteria, verifiable by lifecycle testing. |
| DI12 | Device shall measure glucose from 20–600 mg/dL with ±15% accuracy | Range and accuracy are measurable. *Simplified:* real accuracy criteria (ISO 15197) use a fixed mg/dL band at low readings and a percentage above, for a stated share of results. |
| DI13 | Aspiration socket shall have pull-out force of minimum 10.5 lbs | A measurable retention requirement. It doesn't say how the socket is attached. |
| DI14 | Screw shall have minimum 250 N pull-out strength at t=0 in 25D foam | A number, a standardized bone surrogate and a time point, so different labs get comparable results. |
| DI15 | Device must withstand minimum 250 N pull-out force without permanent deformation | Load plus pass criterion. Tempting to call it an output, but it says nothing about how the device is made. |
| DI16 | Device shall achieve residue levels of no more than 6.4 µg/cm² protein after cleaning per IFU | A measurable limit tied to the cleaning instructions. It is verified by cleaning validation. |
| DI17 *(new, split from old #38)* | Instrument material shall be biocompatible for limited-duration tissue contact per ISO 10993-1 | States the property the material must have. Which material meets it is the output (see DO10). |

### Design outputs (12)

| # | Statement | Explanation |
|---|---|---|
| DO1 | Sensor uses glucose oxidase enzyme on platinum electrode per Drawing GS-001 | How the device is built: a specific chemistry on a specific drawing. |
| DO2 *(placeholder filled)* | Drawing 123 Rev A: shaft length 180.0 ± 0.5 mm | A dimension and tolerance on a controlled drawing, the classic output. |
| DO3 | Material: 17-4 Stainless Steel | A specific material choice, one way of meeting several inputs. |
| DO4 *(placeholder filled)* | Apply 0.5 g Loctite 242 to socket per Work Instruction WI-ASM-12 | A manufacturing instruction. Outputs include how it's assembled, not just what's on the drawing. |
| DO5 *(placeholder filled)* | Minimum interference 0.010 in per Assembly Drawing ASM-301 | A fit specified on a drawing. It is one way to achieve the 10.5 lb retention input. |
| DO6 | Minimum wall thickness = 0.250 in, Pitch = 0.080 in | Geometry chosen by the design team to meet the pull-out requirement. |
| DO7 *(placeholder filled)* | Screw length = 1.025 ± 0.010 in, Material: PEEK per Drawing SCR-103 | Dimension, tolerance and material on a controlled drawing. |
| DO8 *(placeholder filled)* | Internal lumen diameter = 0.5 in, lumen length = 2 in, Material = 17-4 SS per Drawing CLN-089 | Geometry that determines how cleanable the device is. Verified against the residue input. |
| DO9 | Scope viewing direction: 30° ± 2° per Drawing SC-045 Rev C | Compare with DI9: the input says which angles to offer, and the output fixes each one with a tolerance. |
| DO10 *(new, split from old #38)* | Shaft shall be made of 316L stainless steel per ASTM F138 | A specific material choice, so it's an output, even though it uses "shall". This is the material picked to meet DI17. |
| DO11 | Assembly per Work Instruction WI-ASM-001 Rev B | A production document. Outputs include the instructions for building it. |
| DO12 | Label text: "Sterile unless package is damaged" per Label Drawing LBL-123 | Labeling is a design output too, controlled like a drawing. |

## Part 2: Build the input

**Mechanic change.** Keep the build mechanic (subject, verb, quantity, unit, qualifier). Add a **context panel** above each challenge, labeled **"Fictional data"**, so the correct value can be reasoned out from evidence rather than guessed. Every option gets a one-line explanation shown when it's chosen. After a correct build, show the explanation for the whole requirement.

Layout per challenge: user need → fictional data panel → builder → feedback.

**C1. Arthroscope, durability.**
User need: UN5.
Fictional data: In a bench study with 12 surgeons, peak sideways force on the shaft while navigating the joint averaged 6 N, maximum 8 N.

| Slot | Correct | Wrong options and why |
|---|---|---|
| Quantity | 10 N | 5 N: below forces seen in use. 8 N: equals the observed maximum, so it leaves no margin. |
| Qualifier | without permanent deformation | "without visible damage": not measurable consistently. "at room temperature": a test condition, not a pass criterion. |

**C2. Glucose meter, accuracy.**
User need: UN11.
Fictional data: Clinic records for the target population show readings from 25 to 580 mg/dL. Clinicians change treatment on differences of about 15%.
Simplified note, shown with the challenge: *real accuracy criteria (ISO 15197) are stated differently. This is simplified for practice.*

| Slot | Correct | Wrong options and why |
|---|---|---|
| Range | 20–600 mg/dL | 50–500: misses the low and high readings patients actually have. 10–800: wider than the evidence supports and harder to verify. |
| Accuracy | ±15% | ±20%: too loose for the decisions clinicians make. ±10%: tighter than the need requires, which costs development effort. |

**C3. Arthroscope, size.**
User need: UN4.
Fictional data: Portal cannulas at the partner hospital have a 5.5 mm inner diameter. The shaft must pass through with clearance.

| Slot | Correct | Wrong options and why |
|---|---|---|
| Quantity | no more than 5 mm | 8 mm: won't fit the cannula. 3 mm: fits, but gives up optics and stiffness the need doesn't require. |
| Qualifier | measured at widest point | "at the distal tip": a wider section further back could still jam. "nominal, before tolerances": tolerances could push the real part past 5.5 mm. |

**C4. Surgical screw, fixation.**
User need: UN9.
Fictional data: Repairs see up to 200 N in early rehabilitation. The team requires a 25% margin. The target bone is modeled by 25D foam.

| Slot | Correct | Wrong options and why |
|---|---|---|
| Quantity | minimum 250 N | 150 N: below rehab loads. 200 N: equals the load, so no margin. |
| Qualifier | pull-out strength at t=0 in 25D foam | "in 20D foam": a lower-density surrogate that doesn't match the target bone. "tensile strength in air": measures a different property, not fixation in bone. |

**C5. Reusable instrument, reprocessing.**
User need: UN2.
Fictional data: The hospital uses each instrument about 100 times a year. Planned service life is 5 years.

| Slot | Correct | Wrong options and why |
|---|---|---|
| Quantity | 500 cycles | 300: wears out before the end of its service life. 1000: double what's needed, which drives cost and test time. |
| Qualifier | without loss of function | "without visible degradation": cosmetic only, and says nothing about whether it still works. "at standard temperature": a condition, not a pass criterion. |

**C6. Arthroscope, field of view.**
User need: UN6.
Fictional data: In a usability study, surgeons needed about 100° of view at 10 mm working distance to see the full repair site without moving the scope.

| Slot | Correct | Wrong options and why |
|---|---|---|
| Quantity | at least 100° at 10 mm | 70° at 10 mm: too narrow, so surgeons have to keep repositioning. 100° at 20 mm: the scope is used closer than that, so it's tested at the wrong condition. |
| Qualifier | working distance | "focal length" and "lens diameter" are internal optical choices. They are design outputs, not conditions of the requirement. |

**C7. Sterile packaging, seal.**
User need: UN3.
Fictional data: In distribution testing, 3 of 40 shipments with seals below 1 lb/in opened in transit. None above that opened.

| Slot | Correct | Wrong options and why |
|---|---|---|
| Quantity | at least 1 lb/in | 0.5 lb/in: below the level where failures stopped. "1 lb": wrong unit, because seal strength is force per width of seal. |
| Qualifier | when tested per ASTM F88 | "by visual inspection": not quantitative. "at room temperature": a condition, not a method. |

**C8. Aspiration handpiece, socket retention.**
User need: UN8.
Reasoning, shown before the builder: *Aspiration pulls blood and debris out of the joint. If the tubing socket pulls loose, suction stops and the view clouds within seconds. So how firmly the socket holds is a design input derived from the need for a clear view, even though the need never mentions sockets.*
Fictional data: Staff tug on the tubing with up to 7 lbf when repositioning during cases. The team applies a 1.5× safety factor.

| Slot | Correct | Wrong options and why |
|---|---|---|
| Quantity | minimum 10.5 lbf | 5 lbf: below observed tugs. 7 lbf: equals the observed maximum, so no margin. |
| Qualifier | when tested per internal test method TM-ASM-04 | "under typical use conditions": not reproducible. "at room temperature": a condition, not a method. |

**C9. Reusable instrument, cleaning.**
User need: UN10.
Fictional data: The hospital's reprocessing committee requires the commonly used protein benchmark of 6.4 µg/cm².

| Slot | Correct | Wrong options and why |
|---|---|---|
| Quantity | no more than 6.4 µg/cm² | 10: above the benchmark. 5: tighter than the benchmark without a reason. |
| Qualifier | protein, after cleaning per IFU | "after sterilization": sterilizing doesn't remove soil, so it measures the wrong step. "total organic residue": a different measure from the benchmark. |

**C10. Arthroscope camera, image quality.**
User need: UN7.
Fictional data: In a reader study, surgeons reliably identified small tears when MTF at 20 lp/mm was at least 0.3. Below 0.25, detection dropped sharply. Service life is 500 reprocessing cycles (see C5).

| Slot | Correct | Wrong options and why |
|---|---|---|
| Quantity | MTF ≥ 0.3 after 500 cycles | ≥ 0.2: below where tears are reliably seen. ≥ 0.3 after 100 cycles: doesn't cover the service life. |
| Qualifier | standard hospital reprocessing cycles | "at room temperature" and "under typical use" don't define the aging condition. |

## Part 3: Trace matrix

**Content changes.** Update user-need text to match Part 1 (G4). Chain 3 uses UN9, chain 8 uses UN8, chain 10 uses UN7, chain 11 uses DI2 as its input. Chain 5's input becomes DI6 (lb/in, ASTM F88). Chain 4's input drops the year from ST67.

- **Chain 5, test method:** "Seal-strength (peel) testing per ASTM F88 on samples after sterilization and simulated shipping."
- **Chain 9, device:** "Cannulated Reusable Instrument" (replaces "Cleaning Validation").

**Validation step (keep it simple).** Don't add a fifth card type to match. When a chain is completed correctly, reveal a **Validation** line under it, with this fixed note at the top of Part 3:

> *Verification checks the design output against the design input: did we build it right? Validation checks the device against the user need: did we build the right thing? It is done on production-equivalent units with representative users under real or simulated use (ISO 13485 §7.3.7, incorporated by the QMSR). The bench test in each chain is verification. The line that appears below it is validation.*

| Chain | Validation line |
|---|---|
| 1. Arthroscope, viewing directions | Surgeons perform a simulated shoulder procedure in a cadaver lab through one portal and confirm they can see all target structures. |
| 2. Glucose meter | People with diabetes use the meter in simulated home use, and their readings are compared with a lab reference. |
| 3. Surgical screw | Surgeons perform repairs in cadaver shoulders and confirm fixation holds under simulated rehab loading. |
| 4. Sterile packaging, SAL | OR staff open the product in a simulated OR and confirm it can be presented to the sterile field ready for surgery. |
| 5. Sterile packaging, seal | OR staff open packages that went through simulated shipping and confirm the barrier is intact and opens aseptically. |
| 6. Arthroscope, diameter | Surgeons insert the scope through standard portals in a cadaver model and confirm it passes without enlarging the portal. |
| 7. Reusable instrument, reprocessing | Reprocessing staff follow the IFU in a simulated hospital workflow, and instruments still meet surgeons' needs afterward. |
| 8. Aspiration handpiece | Surgeons in a simulated arthroscopy with fluid and debris confirm the view stays clear while tubing is repositioned. |
| 9. Cannulated reusable instrument | Reprocessing staff clean the device per the IFU in simulated use, and confirm the instructions can be followed and the device comes out clean. |
| 10. Arthroscope camera | Surgeons review images from aged units during a simulated procedure and confirm they can identify tears. |
| 11. Arthroscope, field of view | Surgeons confirm in a cadaver model that they can see the repair site without repositioning the scope. |
| 12. Arthroscope, durability | Surgeons navigate the joint in a cadaver model and confirm no tissue damage and no shaft bending. |

## Out of scope

Don't change the hub page except the card's time estimate, if the new feedback makes the game longer. Don't touch other apps. Don't add libraries or external requests.

## Process

1. Work on a branch named `revise/sorting-game`. Never merge to main.
2. Before reporting done, run the four-way self-audit: **content** (every student-facing string matches this brief exactly), **logic** (random draw, ≥2 per category, scoring, every option shows its explanation), **UX** (open it in a browser at desktop and phone width, play all three parts end to end, take screenshots), **code** (no console errors).
3. Report back with: what changed, screenshots, anything in this brief you think is wrong (flagged, not changed), and the branch name for review.
