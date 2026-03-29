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

## Release Flow

- Keep feature work and version bumps in separate PRs.
- Merge feature PRs first.
- Then create a dedicated release PR for the version bump.
- After the release PR merges, publish by pushing a version tag.

## Validation

- Run `./scripts/check.sh` before finishing substantive changes.
- Rebuild generated artifacts when package metadata or published API surface changes.
- If a change affects demo/showcase behavior, verify it in the browser when practical.
