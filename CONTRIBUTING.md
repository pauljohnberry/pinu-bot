# Contributing

## Setup

```bash
bun install
bun run check
```

## Development Workflow

1. Make your changes in `src/`, `demo/`, `test/`, or docs files.
2. Run `bun run check` before opening a PR.
3. If you change runtime behavior, update docs and demo controls where relevant.
4. If you add public API, export it from `src/index.ts`.

## Project Priorities

- Keep the runtime compact.
- Prefer parametric animation over fixed sequences.
- Avoid dependencies in the published package.
- Preserve framework-agnostic consumption.
- Do not regress animation clarity for built-in emotions.

## Pull Requests

- Describe the user-facing change.
- Mention any API additions or breaking changes.
- Include screenshots or short recordings for visible rendering changes when possible.
