# AGENTS.md

## Project Intent

`pinu-bot` is a TypeScript canvas library for expressive robot display faces.
The public docs surface is the live demo page and the showcase page.

## Working Style

- Keep the package framework-agnostic.
- Prefer Bun-native workflows for install, test, and build.
- Preserve the current visual language unless a change is clearly better.
- Favor readable, intentional UI over generic component-library styling.

## Public Surfaces

- `demo/` is the main public docs and interactive demo surface.
- `showcase/` is the public example gallery for real integration patterns.
- `stress.html` is internal/dev-facing and should not be promoted publicly.
- `README.md` should stay high-signal and concise.

## API And Versioning

- Treat changes to exported types, options, method names, or symbol names as public API changes.
- Avoid unnecessary breaking changes.
- Before `1.0.0`, use minor bumps for meaningful API changes or removals.
- Keep demo docs and README aligned with the actual runtime API.

## Visual Direction

- Expressions and symbols should read clearly at a glance.
- Small glyphs should favor bold silhouettes over intricate detail.
- Pixel/8-bit symbols should feel consistent as a set.
- Demo and showcase visuals should feel polished, not like test harnesses.

## Character Work

- When creating or refactoring a character, follow `docs/character-creation.md`.
- Start major character work from `docs/character-brief-template.md` before coding.
- If composition keeps drifting, use `docs/construction-api.md` as the recovery path instead of continuing to patch local shapes.
- Solve character work as a face-composition problem first, not a collection of local part tweaks.
- Start from a stable neutral model and treat every emotion as a deliberate delta from that base.
- Keep new characters in the same product language as `pinu`: robot display first, reference cues second.
- Keep shared API behavior (`parts`, `features`, `faceTheme`, `emotions`) working across characters unless there is a strong character-specific reason not to.
- Validate character work in `test/visual.html` and avoid shipping characters that only look correct in one state.

## Release Flow

- Keep feature work and version bumps in separate PRs.
- Merge feature PRs first.
- Then create a dedicated release PR for the version bump.
- After the release PR merges, publish by pushing a version tag.

## Validation

- Run `./scripts/check.sh` before finishing substantive changes.
- Rebuild generated artifacts when package metadata or published API surface changes.
- If a change affects demo/showcase behavior, verify it in the browser when practical.
