# Publishing

This repo is structurally ready for npm publishing, but two things still depend on the eventual GitHub repository:

1. the final GitHub remote URL
2. npm trusted publishing setup for that repo

## Before First Publish

1. Create or connect the GitHub repository.
2. Add the final `repository` and `bugs` fields to `package.json`.
3. Confirm the npm package name is still available.
4. Enable npm trusted publishing for the GitHub repo.

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

## First Tag

Once the GitHub repo and npm trusted publishing are configured:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Notes

- The release workflow assumes `npm publish --provenance --access public`.
- Visual regression depends on Playwright Chromium being available in CI.
- The current demo site is suitable as the first public docs surface.
