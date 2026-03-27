# Deploying Pinubot.com

The fastest deployment path for the current demo/docs site is Vercel.

## Recommended Setup

- Framework Preset: `Other`
- Install Command: `bun install --frozen-lockfile`
- Build Command: `bun run build`
- Output Directory: `.`
- Git Repository: `pauljohnberry/pinu-bot`

The root-level [vercel.json](./vercel.json) rewrites:

- `/` to `demo/index.html`
- `/stress.html` to `demo/stress.html`

That keeps the public site pointed at the interactive demo/docs page while still allowing the internal stress page to exist.

## Domain

After the project is deployed, attach `pinubot.com` in the Vercel project settings.

Official docs:

- Project settings: <https://vercel.com/docs/project-configuration/project-settings>
- Custom domains: <https://vercel.com/docs/domains/set-up-custom-domain>

## Local Preview

```bash
bun run dev
```

Open:

```text
http://localhost:4173
```

## Notes

- `stress.html` is intended for internal validation, not public navigation.
- The site currently depends on the built `dist/` output, so `bun run build` must succeed before deploy.
