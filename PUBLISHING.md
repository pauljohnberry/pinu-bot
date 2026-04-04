# Publishing

This repo is structurally ready for npm publishing, but two things still depend on the eventual GitHub repository:

1. npm trusted publishing setup for the real repo
2. the first release tag / npm publish run

## Before First Publish

1. Confirm the npm package name is still available.
2. Enable npm trusted publishing for `pauljohnberry/pinu-bot`.
3. Verify the workflow filename matches `.github/workflows/release.yml`.
4. Create the next release tag.

For npm trusted publishing on npmjs.com:

1. Go to the `pinu-bot` package settings.
2. Open `Trusted publishing`.
3. Choose `GitHub Actions`.
4. Set owner/user to `pauljohnberry`.
5. Set repository to `pinu-bot`.
6. Set workflow file to `release.yml`.

Notes from the current npm docs:

- trusted publishing docs: <https://docs.npmjs.com/trusted-publishers/>
- GitHub-hosted runners are required
- npm CLI `11.5.1+` and Node `22.14.0+` are required for OIDC trusted publishing

## Local Validation

Run the full local release checks:

```bash
./scripts/check.sh
npm run test:visual
npm run pack:dry-run
```

## Release Flow

The release workflow is in [release.yml](./.github/workflows/release.yml).

It triggers on git tags matching `v*` and will:

1. install dependencies with Bun
2. run the validation suite
3. create an npm tarball
4. publish to npm with provenance
5. create a GitHub release with generated notes

## Release Tag

Once npm trusted publishing is configured:

```bash
git tag v0.1.1
git push origin v0.1.1
```

## Notes

- The release workflow assumes `npm publish --provenance --access public`.
- Visual regression runs in the official Playwright Linux image in CI.
- Keep `.github/workflows/ci.yml` Playwright image tag in sync with the `@playwright/test` version in `package.json`.
- The current demo site is suitable as the first public docs surface.
- The current release workflow already uses Node 24, which satisfies npm's current OIDC requirement
- Repository: <https://github.com/pauljohnberry/pinu-bot>
