# Video handoff — "Nothing Broke"

A short narrated video of the opening scene of **Downstream** (`Bedside-to-Market/index.html`),
the tourniquet case that sets up the need-statement decision.

## Decisions already made

- **Narration is recorded separately by the instructor.** Do not generate speech, do not
  build a voice track, do not add background music. Deliver silent video or a timed
  animation the instructor can drive.
- **Animation is timed to a live reading in lecture**, not locked to an audio file.
  Prefer beats that can be advanced or that run on a clock the presenter can restart,
  over a hard-baked timeline. The timestamps below are a pacing guide, not a spec.
- **The video ends on the blank need statement.** It never shows or suggests what that
  sentence should say. Writing it is the students' job.
- Target length under 2 minutes. Current script reads at about 1:50 at 140 wpm.

## Where it sits

Played in class immediately **before** students open the sim. It is not embedded in the
page. The sim's own Month 1 screen re-tells the same story in text, which stays as-is for
students replaying at home; in class the instructor clicks through those beats.

## Must not give away

- **No device of any kind.** Month 1 in the sim has no product in it — no timer, no
  display, no alarm, no company product. The video must not invent one.
- **Avoid the word "cumulative."** It is the key word in the correct need statement.
- **No numeric tourniquet limit.** The sim deliberately never states one; Dr. Okonjo's
  60-minute limit is introduced later, in Month 6.
- Nothing about the patent, the regulatory pathway, the complaint file, or any later number.

## Must stay consistent with the sim

- Revision knee replacement; the implant went in eleven years ago and has loosened.
- Pneumatic cuff on the upper **thigh**, pumped hard enough to stop arterial flow.
- The cuff comes down **twice**: first to confirm the leg is perfusing, second while the
  team waits for an implant tray from sterile processing.
- The **circulating nurse** writes the number into the record.
- "Nothing malfunctioned" — the cuff held its pressure, the pump held its setting.
- Setting is Granite Bay Regional, Tuesday morning. Surgeon is Dr. Nadia Okonjo.

## Timeline data

The centrepiece. Same case as the sim's Month 1 strip (`CASE_SEGS`, around line 521 of
`index.html`).

| Segment | Minutes | State |
|---|---|---|
| 1 | 32 | cuff **up** |
| 2 | 6 | cuff **down** |
| 3 | 14 | cuff **up** |
| 4 | 11 | cuff **down** |
| 5 | 22 | cuff **up** |

- **85 minutes** start to finish (bar is scaled to this).
- **68 minutes** with no blood flow (sum of the up segments) — the running counter's final value.
- The counter advances only while a cuff-up block is growing, and **freezes during the gaps**.
- Three candidate readings of the nurse's single number: **22** (last stretch),
  **32** (longest stretch), **68** (all of it).

## Colours and type

Pull from `Bedside-to-Market/index.html` — design tokens are in the `:root` block at the
top of the `<style>` section (light theme from about line 8, dark from about line 48), and
the strip's own rules are around lines 190–215.

Light theme (use this for the video unless told otherwise):

| Use | Token | Hex |
|---|---|---|
| Cuff **up** block fill | `--color-primary` | `#0d9488` |
| Cuff **down** gap | 1.5px dashed `--color-border` on transparent | `#cbd5e1` |
| Text inside a down gap | `--color-text-faint` | `#94a3b8` |
| The "no blood flow" total | `--color-primary` | `#0d9488` |
| A displayed / reported number | `--color-orange` | `#da7101` |
| Marker line (if used) | `--color-error` | `#a12c7b` |
| Page background | `--color-bg` | `#f1f5f9` |
| Card surface | `--color-surface` | `#ffffff` |
| Body text | `--color-text` | `#0f172a` |
| Secondary text | `--color-text-muted` | `#64748b` |

Dark equivalents exist in the same file if a dark version is wanted: primary `#4fb8c0`,
bg `#0f1112`, surface `#161a1c`, text `#d0d8de`.

Type: body **Inter** (`--font-body`); all numbers, counters and timeline figures in
**JetBrains Mono** (`--font-mono`), which is what the sim uses for every numeral.
Blocks have `border-radius: 5px`; the bar is `46px` tall with `3px` gaps between segments.

---

# Final script

218 words as written; about 1:50 at 140 wpm. `[pause]` marks are the instructor's.

**0:00** — *On screen: dark, then a single line of text: a knee, eleven years old, coming out today.*

> This is a knee replacement. [pause] Not the first one. The second. The implant went in
> eleven years ago and it has come loose. [pause] The surgeon is Dr. Nadia Okonjo. To do
> this, she has to see what she is touching. And a knee bleeds.

**0:20** — *On screen: the cuff appears at the top of the frame; below it, colour drains out of the limb.*

> So the team wraps a cuff around the patient's thigh and pumps it up. [pause] Hard enough
> to stop the blood. Now the field is clear. And everything below the cuff gets nothing.
> No blood. No oxygen. [pause] That is the trade. Muscle and nerve put up with it for a
> while. Then they stop.

**0:46** — *On screen: the bar starts building left to right in real time; the no-flow counter runs only while a solid block is growing, and freezes during the gaps.*

> So the room watches the clock. [pause] Cuff up. [pause] Down, to check the leg is getting
> blood. [pause] Up again. [pause] Down, waiting on a tray from sterile processing. [pause]
> Up again. [pause] The leg is keeping count the whole time. The room is not.

**1:12** — *On screen: the bar completes and the counter lands on its final value; then a handwritten line appears in a chart — one number, no label.*

> At the end, the nurse writes a tourniquet time in the record. [pause] One number. [pause]
> That afternoon Dr. Okonjo reads it, and she cannot tell what it counted.

**1:27** — *On screen: three candidate readings flash against the same bar in turn — last stretch, longest stretch, all of it — then everything clears to a blank, labelled field with a cursor in it.*

> Nothing broke. [pause] The cuff held. The pump held. Every person in that room did their
> job. [pause] The total simply was never anywhere. [pause] She calls two engineers. They
> spend three weeks standing in operating rooms, watching. [pause] And then they have to
> write down one sentence.

**Ends here.** Hold on the blank field. Nothing further appears.
