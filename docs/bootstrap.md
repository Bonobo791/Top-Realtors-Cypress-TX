# Bootstrap status

This is a static Astro/TypeScript website with Git-backed content. The first feature is a sourced seven-profile directory with visible sponsored placement, individual HAR feedback and stable .html URLs. It implements the user's architecture correction.

Foundation: Site-Bootstrap-ADM 916df29d7410b4a9a5048ed69819b5da448a2ecf, inspected in a fresh reference checkout. The repository supplies guidance, task/route/environment/runbook templates and a property helper/demo, rather than a finished Astro application. This target adapts those actual artifacts. The template demo's8 tests are separate from product coverage.

Toolchain: Astro 7.3.6, TypeScript 6.0.3, Node 24.19.0, npm 11.9.0; official Astro requirements and npm registry support checked October 6, 2026. Native collections, components, pages and prerendered sitemap/robots endpoints produce static files. No SSR adapter, CMS, intake, accounts, database, analytics or provider writes are selected.

Checkout: fresh main deb667c483a953df80afdc2ba7e18921d350f2c9; isolated build/astro-sponsored-cypress. Main had no AGENTS file. The new target instructions require a tested local commit and parent approval before publishing this branch. Earlier unpublished Python work is superseded. The Lippincott template repository was not modified.

Selected host: Node builds dist/; pinned unprivileged Nginx serves it on8080. Coolify owns TLS/proxy routing if released. Local fixtures need no host account. coolify.md and release-runbook.md supply exact settings and commands.

| Requirements    | Status/evidence                                                                            |
| --------------- | ------------------------------------------------------------------------------------------ |
| C01–C06         | Local contracts, commands and regressions; verification.md and individual task rows        |
| C07             | Read-only CI implemented; intended-SHA run/required-check policy pending publication/owner |
| C08             | Attribution/diff/output review; overall license remains owner decision                     |
| C09             | README, plan, route/env/task/invariant and release handoff                                 |
| S01–S03,S05–S09 | Actual Astro content/output/browser; release readiness separately recorded                 |
| S04             | N/A: hosted CMS unselected; real Git-backed edit/build fixtures cover authoring            |
| H01–H07         | N/A: static content, no business endpoints; Nginx health serves an existing page           |
| L01             | No intake/tracking; live host access-log retention/access evidence pending operator        |
| T01–T07         | Production properties, fault/replay, scoped mutation and independent review                |
| P01             | Tracking absence checked; P02–P05 N/A because analytics/provider storage are unselected    |
| D01–D04         | Local image/HTTP/provenance results in verification.md; host configuration pending         |
| D05,D07,D08     | Live DNS/TLS, CI, approved served SHA and host rollback pending release authorization      |
| D06             | Isolated edit/invalid state/restoration rebuild; no external store/database                |

Run at the repository root: npm ci, npm run verify, npm run test:mutation, then start the selected container using [the local runtime commands](coolify.md) and run E2E_BASE_URL=http://127.0.0.1:8082 npm run test:e2e. verification.md records actual outcomes/counts/failures. dist is generated and ignored. A release marker must use its approved committed Astro SHA; pre-commit images use local.

The local foundation supports content/component work. Approved publication, real CI, DNS/TLS, host logs/indexing and rollback remain separate gates owned by the repository/host operator.
