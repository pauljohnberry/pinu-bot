# Construction API Proposal

This is a proposal for making character creation more human-accessible and less dependent on low-level draw code iteration.

The goal is not a freeform illustration engine.

The goal is a constrained composition system for robot-display characters.

## Why

Current failure modes when building characters directly in render code:

- composition is solved too late
- local parts get polished before the whole face works
- overlapping shapes drift into accidental reads
- shared API behavior is wired after the fact instead of being designed in

A construction API would move character design up one level:

- define composition primitives first
- render from those primitives second
- translate shared controls against known anchors

## Non-Goals

- not a general-purpose vector editor
- not a full node graph
- not arbitrary bezier illustration authoring
- not a replacement for `CharacterDefinition`

This should sit under `CharacterDefinition`, not replace it.

## Principles

1. Composition first

Characters should be built from a small number of structural forms.

2. Shared anchors

Eyes, beak, mouth, and lower-face elements should align through a common layout model.

3. Semantic primitives

Use terms like `mask.upper` and `eye.socket`, not raw unrelated polygons.

4. Intentional API translation

Shared public controls should map into the construction model predictably.

## Proposed Primitive Model

### Face Frame

Top-level composition settings:

- `layout.width`
- `layout.height`
- `layout.centerY`
- `layout.eyeGap`
- `layout.eyeLineY`
- `layout.centerlineBias`

### Structural Forms

These are the main authored primitives:

- `mask.upper`
- `mask.lower`
- `eye.socketLeft`
- `eye.socketRight`
- `eye.shellLeft`
- `eye.shellRight`
- `eye.pupilLeft`
- `eye.pupilRight`
- `nose`
- `mouth.anchor`

### Optional Structural Variants

Only when the character actually needs them:

- `crest`
- `cheek`
- `muzzle`
- `earFrame`
- `visor`

## Proposed Shape Schema

Example only:

```ts
type ConstructionShape =
  | {
      kind: "plate";
      width: number;
      height: number;
      y: number;
      inset?: number;
      taper?: number;
      tilt?: number;
      radius?: number;
    }
  | {
      kind: "capsule";
      width: number;
      height: number;
      y: number;
      tilt?: number;
    }
  | {
      kind: "notch" | "wedge";
      width: number;
      height: number;
      y: number;
      spread?: number;
    };

type CharacterConstruction = {
  layout: {
    eyeGap: number;
    eyeLineY: number;
    centerlineBias?: number;
  };
  mask?: {
    upper?: ConstructionShape;
    lower?: ConstructionShape;
  };
  eyes: {
    socket: ConstructionShape;
    shell: ConstructionShape;
    pupil: ConstructionShape;
  };
  nose?: ConstructionShape;
  mouth?: {
    anchorY: number;
    width: number;
    opennessBias?: number;
  };
};
```

This is deliberately narrow.

## Shared API Translation Layer

The point of the construction API is not only drawing. It should also provide stable translation hooks for shared controls.

Examples:

- `eyeShape` changes `eye.shell` and optionally `eye.socket`
- `browShape` changes `mask.upper` edge logic or an optional brow form
- `noseShape` changes `nose` primitive family
- `mouthShape` changes mouth curve language
- `lookAt()` only moves pupils within socket-safe bounds
- blink/wink only compresses the live eye shell, not unrelated decoration

## Suggested Implementation Strategy

Do this incrementally.

### Phase 1

Add optional construction helpers only.

- helper functions for `plate`, `capsule`, `notch`, `wedge`
- helper layout functions for eye anchors and centerline alignment

Characters may still custom draw, but can use the helpers.

### Phase 2

Introduce a `construction` field as an optional authoring aid for built-ins.

- still render through existing `CharacterDefinition`
- use construction primitives to derive draw geometry

### Phase 3

Standardize translation helpers.

- `applyEyeShapeToConstruction(...)`
- `applyBrowShapeToConstruction(...)`
- `applyEmotionToConstruction(...)`

### Current Layering Direction

The most useful reuse point is not "one generic character renderer."

It is a three-layer split:

- shared behavior rules
  - blink / wink compression
  - squint influence
  - pupil bounds
  - mouth openness depth
- shared render and geometry recipes
  - eye metric resolution
  - glyph-eye families
  - standard robot renderers for common brow / nose / mouth families
  - construction anchor helpers
- character-unique systems
  - `pinu` overlays and visibility tricks
  - `kiba` ears, muzzle, tongue, teeth
  - any identity-specific asymmetry or silhouette systems

This keeps the easy path small for developers and LLMs without forcing unlike characters into one mold.

The current renderer layer should be thought of as `standard robot renderers`, not universal renderers.

- `pinu` fits this family closely
- `kiba` can reuse some pieces, but still needs custom ear / muzzle / mouth systems
- `bubo` should share anchors and semantic controls, but its owl eye / beak system is still its own family
- future characters should opt into this layer only where the face language genuinely matches

## Value Test

This work is only worth keeping if it makes character authorship simpler.

Success should look like:

- character files get shorter or at least more clearly partitioned
- shared part options (`eyeShape`, `noseShape`, `mouthShape`, `browShape`) stay coherent across built-ins
- custom code is limited to identity-specific systems such as ears, muzzle pieces, beak stacks, or overlays
- contributors and LLMs can reason about composition and API mapping without first rewriting low-level canvas code

Failure mode:

- a new abstraction exists, but `kiba` and `bubo` are not easier to read, change, or extend

If an extraction does not materially simplify a real character file, it should not be added.

## Recommended First Scope

Do not attempt a full generic system first.

Start with these:

- upper mask / plate helper
- eye socket helper
- eye shell helper
- pupil bounds helper
- center notch / wedge helper

That would already remove most of the overlapping-part mistakes.

## Review Workflow With Construction API

The new process would be:

1. Fill out the character brief
2. Lock composition primitives
3. Review neutral in the demo review URL
4. Tune eye seating and centerline
5. Add emotion deltas
6. Map shared API controls

This is the real value:

the design becomes reviewable before it becomes deeply coded.

For current built-ins, that should mean:

- `pinu` can stay closest to the standard renderer path
- `kiba` should reuse shared controls and family helpers, while keeping custom ear / muzzle identity systems
- `bubo` should reuse shared controls and anchors, while keeping a distinct owl eye / beak family

## Recommendation

Yes, build this.

But keep it intentionally small and structural.

The right version is:

- composition primitives
- stable anchors
- API translation hooks

The wrong version is:

- an open-ended illustration system
- arbitrary shape soup
- another full design tool inside the library

## Phase 1 Status

Phase 1 now exists as additive helpers in `src/construction.ts`.

Current exports:

- `createConstructionFrame(...)`
- `createConstructionLayout(...)`
- `resolveConstructionAnchors(...)`
- `resolveEyeAnchor(...)`
- `createPlate(...)`
- `createCapsule(...)`
- `createNotch(...)`
- `createWedge(...)`

This is intentionally small. It gives future character work stable composition anchors and semantic shape primitives without changing the existing renderer.
