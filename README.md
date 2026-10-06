# Top-Realtors-Cypress-TX

Standalone export of the existing Cypress Realtor Guide example, originally adapted from the supplied Kimi design. This export preserves the current hosted site's design, content, seven professional profiles, local photograph, CSS, and static page generator.

## Run locally

Requires Python 3.9 or newer. There are no third-party Python packages, Node dependencies, API keys, sign-in services, or runtime backend.

```sh
python3 generate.py
python3 check_site.py
python3 -m unittest discover -s tests -v
python3 -m http.server 8000 --directory dist --bind 127.0.0.1
```

Open http://127.0.0.1:8000. Serve `dist` at the root of a domain or local server; links start with `/`, so opening the HTML directly or hosting it under a repository-name subpath will not resolve every asset. The checked-in `dist` directory can also be hosted as ordinary static files without a build service.

## Files

- `agents.json`: seven profiles, public business contacts, and their source citations
- `generate.py`: deterministic homepage, profile, and 404 page generator
- `check_site.py`: checks the profile set, citation indices, local link containment, anchors, explicit tag balance, page headings, image alt text, and selected excluded claims
- `dist/index.html`: homepage
- `dist/realtors/*.html`: seven profile pages
- `dist/assets/site.css`: responsive styles; imports Google Fonts
- `dist/assets/coles-crossing-morning.jpg`: attributed local photograph
- `ATTRIBUTION.md`: provenance, image license, and rights notes
- `tests/test_site.py`: dependency-free generator and checker regression tests
- `docs/export-verification.md`: scope, checks, and known limitations
- `docs/pr1-triage.md`: review findings, fixes, and browser verification

Edit profile facts in `agents.json` and templates in `generate.py`, then regenerate and check. Edit styles in `dist/assets/site.css`; that file and the photograph are source assets and must remain tracked. The generator expects the checked-in output directories to exist. It removes obsolete generated `*.html` profile pages from `dist/realtors` after successful rendering and writes; keep that directory for generated profiles. It requires exactly seven profiles before writing and refuses symlinked dist/profile directories and output files. Profile slugs must be unique lowercase letters/digits separated by single hyphens; official, HAR, and source links must be absolute HTTP or HTTPS URLs.

## Content and publication status

Sources were reviewed on October 3, 2026. This is a fixed research snapshot with source attribution, not a live licensing check, audit of reviews or sales, ranking, endorsement, or established paid sponsorship. Unsupported original performance claims have not been restored. All seven profiles and the example/noindex wording are preserved.

The originating Site was public when this export was verified on October 6, 2026. This repository export does not change that Site, its access, or its deployment. No new website deployment is included. Choose and configure a static host separately; configure its error handling to serve `404.html` for missing pages if desired.

The site has no inquiry forms, analytics scripts, or lead collection. Google Fonts and outbound websites remain third-party network destinations with their own privacy practices. See `ATTRIBUTION.md` before reuse or republication.
