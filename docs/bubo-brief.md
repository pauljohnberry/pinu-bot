# Bubo Character Brief

## One-Line Intent

A robot owl face with oversized segmented ring eyes, a stacked bar beak, and a watchful CRT-terminal read.

## Identity

- name: bubo
- archetype: robot owl
- product language: robot display first
- reference cue: owl read carried by ring eyes plus a three-bar beak
- non-goals:
  - literal feathers or head silhouette
  - pupils or eyelash detail
  - curved anatomy
  - asymmetrical expressions
  - extra mouth geometry outside the beak system

## Dominant Composition

- dominant silhouette: two large hollow ring eyes
- secondary silhouette: centered stacked beak bars
- centerline handoff: the beak owns the centerline with a long-top / medium-middle / short-bottom stack
- primary focal area: the eye pair and the negative space inside each ring
- 2-3 forms that carry identity: left ring eye, right ring eye, stacked beak bars
- structural forms: ring segments, beak bars
- decorative forms: none

## Neutral Face Spec

- eye placement: large, widely spaced, locked to a mirrored grid
- eye cavity / shell relationship: no cavity, only chunky segmented rings
- pupil size and travel: unsupported by design
- upper-face structure: eye rings only
- lower-face structure: no separate mouth, only the beak center bar
- nose or beak role: the beak is the entire centerline read
- mouth role: translated into the beak middle bar for `speak()` and mouth controls
- asymmetry: none

## Emotional Grammar

- positive: brighter rings, slightly rounder eye read, middle beak bar widens
- low energy: dimmer rings, compressed eye height, tighter beak spacing
- tense: eye rings narrow and rotate inward symmetrically
- actions: thinking, listening, sleeping, and offline stay mirrored

## Shared API Mapping

- `eyeShape`: changes ring proportions while keeping the segmented hollow-eye system
- `noseShape`: changes top and bottom beak bar proportions
- `mouthShape`: changes the beak middle bar proportions
- `browShape`: intentionally ignored because bubo has no brows
- `features.leftEye/rightEye`: supported directly
- `features.pupils`: intentionally ignored because bubo has no pupils
- `features.brows`: intentionally ignored because bubo has no brows
- `features.nose`: toggles the top and bottom beak bars
- `features.mouth`: toggles the beak middle bar
- `faceTheme`: respected for panel/background styling; the owl keeps its own amber beak
- `speak()`: animates the beak middle bar only
- `pout()`: compresses the beak middle bar
- `lookAt()`: now reads through subtle pupil travel inside the fixed ring eyes
- `brows` and `pupils`: enabled by default for the current experimental owl pass
