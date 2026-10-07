# Top Realtors Cypress TX

An Astro/TypeScript website for RealtorsCypressTX.com, built from the Site-Bootstrap-ADM foundation at `916df29d7410b4a9a5048ed69819b5da448a2ecf`. It has a directory homepage, seven source-linked profiles, Terms, Privacy and a custom 404 page. The site calls Lippincott “Our #1 choice.” Its feature card and profile disclose “Paid placement,” and its directory row is labeled “Sponsored listing”; other profiles are alphabetical. “Our #1 choice” is the publisher’s editorial selection, not a HAR rating or calculated performance ranking. Named HAR survey snapshots retain platform, count, subject, check date and individual scope.

This branch replaces the earlier Python export pipeline. Astro content collections validate Git-backed JSON and native Astro layouts/components render the site. No CMS service, forms, accounts, lead backend, tracking or third-party font requests are selected. The approved responsive design and licensed photo copies are preserved.

## Work locally

Use Node 24.19.0 and npm 11.9.0 (`.node-version`, `packageManager` and the lockfile).

```sh
npm ci
npm run dev
npm run verify
npm run test:e2e
npm run test:mutation
```

`dev` runs the actual Astro site; `build` produces static `dist` through Astro, writes a safe commit marker and checks every local reference/metadata/source contract. `check` runs Astro's checker and strict TypeScript for tests; lint/format/test scripts run their real tools. Properties are part of ordinary `npm test`. Astro CLI telemetry is disabled by the scripts. Build output is regenerated and ignored, not hand-maintained HTML.

Playwright needs its Chromium installed (`npx playwright install chromium`). On this cloud container, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`. Browser tests start built Astro preview at `http://127.0.0.1:4322` by default, leaving the development server on port 4321 available. Set `E2E_BASE_URL=http://127.0.0.1:8082` to select an already-running local container. Actual Nginx-container acceptance is separate from framework preview. A source archive without Git requires `BUILD_COMMIT=local npm run build`; an approved release must supply its full SHA.

Edit profile facts in `src/content/realtors.json`, rated-agent snapshots in `src/content/ratings.json`, shared identity/indexing in `src/content/site.json`, templates in `src/components`, `src/layouts` and `src/pages`, and styles in `src/styles/site.css`. Public photo assets and attribution stay together. No live source fetching occurs during build; the visible source and metric dates remain snapshots.

## Hosting handoff

The multi-stage Dockerfile builds with Node and serves only Astro output through non-root Nginx8080. `/healthz` tests that the built homepage is available; `/build.json` identifies the supplied source SHA. No Python or Node runtime is shipped in the final image. Docker builds require an explicit `SOURCE_COMMIT` build argument: the full approved lowercase 40-character SHA for release, or `--build-arg SOURCE_COMMIT=local` for a disposable development image. Missing or invalid markers fail the build.

Use the [Coolify runbook](docs/coolify.md), [verification evidence](docs/verification.md), [plan amendment](docs/project-plan.md), [bootstrap requirement map](docs/bootstrap-tasks.md), [routes](docs/routes.md), [environment registry](docs/environment.md) and [invariants](docs/testing-invariants.md). Site-Bootstrap-ADM includes guidance/templates and a runnable demo, not a finished Astro application; this target instantiates its actual shared-layout/content/SEO/test/container contracts. The copied property-options helper and adapted templates retain their [MIT notice](docs/vendor/Site-Bootstrap-ADM-LICENSE.txt).

The canonical HTTPS origin is fixed to `https://realtorscypresstx.com`, profile URLs end in `.html`, and indexing is enabled for the authorized public launch. Indexing changes require a source change/rebuild. Live deployment evidence is recorded in the release handoff; real CI, DNS/TLS/redirects, log practices and rollback require actual host verification.

`docs/export-verification.md` and `docs/pr1-triage.md` are historical records of the superseded export. [ATTRIBUTION.md](ATTRIBUTION.md) preserves photo provenance; no new overall code/design license is asserted.
