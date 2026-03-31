# Character Brief Template

Use this before starting a new character or a major character redesign.

The goal is to lock the composition and intent before coding.

## One-Line Intent

Describe the character in one sentence.

Template:

`A [robot/archetype] face with [primary cue], [secondary cue], and a [core emotional read].`

Example:

`A robot owl face with a strong upper mask, thick display eyes, and a calm watchful read.`

## Identity

- name:
- archetype:
- product language:
- reference cue:
- non-goals:

Guidance:

- `product language` should usually be `robot display first`
- `reference cue` should be abstracted, not copied literally
- `non-goals` should explicitly rule out likely failure modes

Example non-goals:

- literal animal anatomy
- floating decorative brows
- overly busy lower face
- cute details that hide weak structure

## Dominant Composition

Fill this out before discussing local parts.

- dominant silhouette:
- secondary silhouette:
- centerline handoff:
- primary focal area:
- 2-3 forms that carry identity:
- structural forms:
- decorative forms:

Questions:

- What is the first shape someone reads?
- What shape controls the face center?
- Which form must still read at thumbnail size?

## Neutral Face Spec

Neutral must work before any emotion tuning.

- eye placement:
- eye cavity / shell relationship:
- pupil size and travel:
- upper-face structure:
- lower-face structure:
- nose or beak role:
- mouth role:
- asymmetry:

Acceptance checks:

- neutral reads instantly
- the face feels balanced
- no part looks pasted on
- the eye system reads as one system

## Emotional Grammar

Define families, not isolated expressions.

### Positive

- `happy`:
- `love`:
- `excited`:

### Low Energy

- `sad`:
- `sleepy`:

### Tense

- `angry`:
- `confused`:

### Utility

- `neutral`:
- `speaking`:
- `listening`:
- `booting`:

Questions:

- Which parts move in each family?
- What stays constant so the character remains itself?
- Which family should be visually strongest?

## Shared API Mapping

Decide how the public API should translate for this character.

- `eyeShape`:
- `noseShape`:
- `mouthShape`:
- `browShape`:
- `features.leftEye/rightEye`:
- `features.pupils`:
- `features.brows`:
- `features.nose`:
- `features.mouth`:
- `faceTheme`:
- `speak()`:
- `pout()`:
- `lookAt()`:

Rule:

Every shared control should be:

- supported directly
- translated intentionally
- or intentionally ignored with a written reason

## Review Frames

Always prepare these review states:

1. `neutral`
2. `happy`
3. `sad`
4. `angry`
5. `confused`
6. `sleepy`
7. `speaking`

## Visual Deliverables

Best package for review:

- one target reference
- one current screenshot
- one overpaint on the current screenshot
- one short keep/change list

Optional but highly effective:

- 3-frame set: `neutral`, `happy`, `angry`

## Build Prompt

Use this prompt before starting implementation.

```text
Build this character from composition first, not from local part tweaks.

Character brief:
- Name: [name]
- Archetype: [archetype]
- Product language: [robot display first / other]
- Reference cue: [cue]
- Non-goals: [non-goals]

Composition:
- Dominant silhouette: [shape]
- Secondary silhouette: [shape]
- Centerline handoff: [description]
- Primary focal area: [description]
- Identity forms: [2-3 forms]
- Structural forms: [forms]
- Decorative forms: [forms]

Neutral requirements:
- Eye placement: [description]
- Eye cavity/shell relationship: [description]
- Pupil behavior: [description]
- Upper face: [description]
- Lower face: [description]
- Nose/beak: [description]
- Mouth: [description]

Shared API mapping:
- eyeShape: [mapping]
- noseShape: [mapping]
- mouthShape: [mapping]
- browShape: [mapping]
- feature toggles: [mapping]
- faceTheme: [mapping]
- speak/lookAt/pout: [mapping]

Rules:
- Keep the character in the same product language as pinu.
- Lock neutral first.
- Treat the face as one composition.
- Do not let brows, ears, mask pieces, or cavities become floating stickers.
- Build emotion families after neutral is correct.
- Validate in the demo review URL and test/visual.html.
```
