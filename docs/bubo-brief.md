# Bubo Character Brief

## One-Line Intent

A robot owl face with oversized segmented disc eyes, feathered V-brows, a stacked bar beak, and a watchful CRT-terminal read.

## Identity

- name: bubo
- archetype: robot owl
- product language: robot display first
- reference cue: owl read carried by disc eyes, feathered V-brows, plus a three-bar beak
- non-goals:
  - literal feathers or head silhouette
  - curved anatomy
  - extra mouth geometry outside the beak system

## Dominant Composition

- dominant silhouette: two large disc eyes with layered feather segments
- secondary silhouette: centered stacked beak bars
- tertiary silhouette: feathered V-brows radiating from an inner anchor
- centerline handoff: the beak owns the centerline with a long-top / medium-middle / short-bottom stack
- primary focal area: the eye pair and the iris/pupil within each disc
- 2-3 forms that carry identity: left disc eye, right disc eye, stacked beak bars
- structural forms: disc segments, beak bars, brow feather strokes
- decorative forms: none

## Neutral Face Spec

- eye placement: large, widely spaced, locked to a mirrored grid
- eye cavity / shell relationship: layered feather segments form a disc around each iris
- pupil size and travel: amber iris with dark pupil, tracks via lookAt
- upper-face structure: feathered V-brows converge between the eyes
- lower-face structure: no separate mouth, only the beak center bar
- nose or beak role: the beak is the entire centerline read
- mouth role: translated into the beak middle bar for `speak()` and mouth controls
- asymmetry: supported per-eye for expressive states (confused, thinking)

## Emotional Grammar

- positive: brighter discs, dilated pupils, wider middle beak bar
- low energy: dimmer discs, compressed eye height via squint, tighter beak spacing
- tense: eyes narrow via squint squash, brows steepen
- love: pupils dilate gradually with glassy highlights, brows tilt outward, rising heart embers overlay
- confused: full head-cock with unified feature tilt, compressed skewed beak
- thinking: eyes squashed flat via heavy squint, one brow raised
- listening: eyes wide and bright, slight head-cock, rare blinks
- actions: thinking and listening use asymmetric eye/brow poses; sleeping and offline stay mirrored

## Shared API Mapping

- `eyeShape`: changes disc proportions while keeping the segmented feather-eye system
- `noseShape`: changes top and bottom beak bar proportions
- `mouthShape`: changes the beak middle bar proportions
- `browShape`: selects brow rendering variant (currently "soft" only)
- `features.leftEye/rightEye`: supported directly
- `features.pupils`: toggles iris and pupil rendering within the disc eyes
- `features.brows`: toggles the feathered V-brow system
- `features.nose`: toggles the top and bottom beak bars
- `features.mouth`: toggles the beak middle bar
- `faceTheme`: respected for panel/background styling; the owl keeps its own amber beak
- `speak()`: animates the beak middle bar only
- `pout()`: compresses the beak middle bar
- `lookAt()`: reads through pupil travel inside the disc eyes
