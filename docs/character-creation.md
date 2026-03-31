# Character Creation Guide

Use this when adding a new built-in character or doing a major pass on an existing one.

Related documents:

- `docs/character-brief-template.md`
- `docs/construction-api.md`

## Goal

Ship a character that:

- reads clearly in `neutral` before any special expression work
- responds coherently to the shared public API
- feels like one authored design across all states
- holds up in the demo, the visual harness, and screenshot tests

## Process

0. Start from a written brief.

Before sketching or coding, fill out `docs/character-brief-template.md`.

That brief should drive the implementation order and the review criteria.

1. Define the identity first.

Lock these before tuning expressions:

- species / archetype
- silhouette cues
- asymmetry cues
- main emotional framing elements
- what should stay constant across all states

For most characters, the highest-leverage framing elements are:

- ears / head silhouette
- eye shells and pupil treatment
- nose + muzzle hierarchy

Before drawing details, also lock:

- the dominant face silhouette
- the centerline handoff between upper-face and lower-face forms
- which 2-3 shapes carry the identity
- which shapes are structural vs decorative

2. Design the neutral face first.

Do not start with `happy`, `love`, or `angry`.

Neutral should answer:

- does the character read instantly?
- is the composition balanced?
- do the line weights belong together?
- are fill roles consistent?
- does the lower face feel too busy?

If neutral is not resolved, emotion work becomes patchwork.

### Critical framing rule

Treat the face as a display composition first, not an illustration assembled from parts.

That means:

- solve the whole mask before polishing the brow
- solve the whole eye system before polishing the pupil
- solve the whole centerline before polishing the nose or mouth

Common failure mode:

- a brow becomes a floating sticker
- an ear or mask shape stops supporting the eye read
- a real-animal reference gets copied too literally
- the result looks like a drawing of an animal face instead of a robot face with animal cues

If that happens, stop refining local shapes and re-lock the composition.

3. Decide the shared API mapping up front.

Before detailed rendering work, decide how the character responds to:

- `eyeShape`
- `noseShape`
- `mouthShape`
- `browShape`
- `features` toggles
- `faceTheme`
- built-in emotions
- `speak()`, `pout()`, and other motion controls

Rules:

- every shared control should either work, be intentionally translated, or be intentionally ignored for a documented reason
- avoid `pinu`-specific assumptions in new character implementations
- preserve cross-character consistency where possible

4. Build expression families, not isolated states.

Group states before tuning them:

- positive: `happy`, `love`, `excited`
- low-energy: `sad`, `sleepy`
- tense: `angry`, `confused`
- utility: `neutral`, `speaking`, `listening`, `booting`

Each family should share a base emotional grammar and vary by intensity.

Good examples:

- ears do the framing work across the whole family
- mouth geometry stays structurally related across smile / frown / chatter
- eye scale and slant changes stay consistent within a family

5. Keep one hierarchy for the center of the face.

The nose, muzzle, mouth line, tongue, teeth, and center split must read as one system.

Check for:

- mouth lines drifting away from tongue geometry
- center split no longer meeting the mouth line
- translucent fills exposing lines beneath them
- decorative detail competing with the main expression

If the center feels glitchy, simplify before adding detail.

6. Preserve the product’s display-language.

`pinu-bot` faces are display faces, not freeform character illustrations.

When using a reference such as owl, cat, dog, or anime:

- extract the cue, do not copy the anatomy
- prefer mask logic, screen logic, and icon logic
- keep negative space and silhouette readable at a glance
- make sure the character still belongs beside `pinu`

7. Use the visual harness early.

Use `test/visual.html` during character work, not only at the end.

Review at least:

- `neutral`
- `happy`
- `sad`
- `angry`
- `confused`
- `love`
- `speaking`

Look for:

- composition drift across states
- overlapping outlines that feel accidental
- line-weight inconsistency
- mismatched geometry between animated parts
- one state looking like a different character

8. Tune speaking and motion as first-class behavior.

Do not treat `speak()` as a final polish step.

Check that:

- the mouth visibly opens/closes, not just shifts position
- panting states and speaking overlays still stay inside the muzzle
- character-specific mouth systems still support chatter behavior

9. Only then add special-case charm.

Examples:

- special `love` pupils
- asymmetrical ear poses
- custom overlay behavior
- unique patch / marking treatment

Charm should sit on top of a resolved base, not compensate for an unresolved one.

## Acceptance Checklist

Before calling a character pass done:

- neutral is strong on its own
- all key emotions still read as the same character
- shared part controls produce sensible results
- feature toggles work
- `speak()` works visibly
- visual overlaps look intentional
- demo controls match runtime behavior
- visual snapshots are updated only for real rendering changes

## Implementation Notes

- Keep `defaultParts` complete and typed.
- Favor shared helpers when the geometry can be reused across characters.
- If the character needs a custom interpretation of a shared shape, translate the shared option semantically rather than ignoring it.
- If a built-in behavior changes, update demo docs and README in the same pass.
- If repeated character work keeps failing at the composition level, prefer introducing constrained construction primitives rather than continuing to patch low-level draw code directly. See `docs/construction-api.md`.

## Recommended Workflow

1. sketch neutral
2. lock the whole composition
3. wire shared API mapping
4. build emotion families
5. verify in `test/visual.html`
6. fix demo control alignment
7. run `./scripts/check.sh`
8. run `./node_modules/.bin/playwright test` when visuals changed
