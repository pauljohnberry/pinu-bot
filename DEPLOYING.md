# Demo Site Deployment

This file is a maintainer note for deploying the public demo/docs site.

It is not part of the package API and is not intended for library consumers.

The current demo/docs site is deployed separately from the npm package. Vercel is the recommended host for the static site.

The intended deployment model is:

- GitHub remains the source of truth
- Vercel is connected directly to the repository
- pushes or merges to `origin/main` auto-deploy the site
- pull requests get preview deployments from Vercel

## Recommended Setup

- Import the GitHub repository into Vercel
- Framework Preset: `Other`
- Install Command: `bun install --frozen-lockfile`
- Build Command: `bun run build`
- Output Directory: `.`
- Production branch: `main`

The root-level [vercel.json](./vercel.json) rewrites:

- `/` to `demo/index.html`
- `/stress.html` to `demo/stress.html`

That keeps the public site pointed at the interactive demo/docs page while still allowing the internal stress page to exist.

## Optional Custom Domain

If the deployed site should live on a custom domain, attach that domain in the hosting provider settings.

Reference docs:

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
- No custom GitHub deploy workflow is needed for Vercel. Native Git integration is the preferred setup.

## Branch Protection

Recommended GitHub branch protection for `main`:

- require pull requests before merging
- require status checks to pass before merging
- require the `CI` workflow
- include administrators if you want protection to apply to everyone
- optionally require review from code owners

If code-owner review is enabled, this repo includes [CODEOWNERS](./.github/CODEOWNERS).
