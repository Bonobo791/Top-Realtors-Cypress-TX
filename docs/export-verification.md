# Export verification

## Scope

The initial export preserved the current Cypress Realtor Guide source byte-for-byte, with standalone setup and rights documentation. The subsequent authorized PR triage fixes generator/checker defects and one missing closing `div` in the homepage; see [PR #1 triage](pr1-triage.md). Profile facts, citations, seven profile pages, CSS, and the photograph remain unchanged. No redesign, new content, backend, tracking, contact form, or deployment is added. Sites identity and Git credentials are excluded.

The destination repository's initial README heading and Git history are preserved. The export is proposed on a separate branch for review.

## Initial export verified on October 6, 2026

- Current Site source and published version match commit `1b52a92171e5989dd4ec67625239d042445824c2`
- Python generation completes, producing the homepage, seven profiles, and a 404 page
- Generation reproduces the checked-in HTML without differences
- The original `check_site.py` passes its nine-page, seven-profile, local-reference and selected-content checks
- Python source compiles successfully
- Photo and CSS are bundled locally; external fonts remain external by design

## Limitations and inherited issues

- PR triage fixed the inherited featured-card `.identity` closing tag and added explicit tag-balance checks. Local Chromium QA covered all nine pages at desktop and mobile widths. Google Fonts was unavailable in the container, so the screenshots use fallback fonts.
- The checker remains a focused static-template/content/link check, not comprehensive HTML, accessibility, visual, or external-link validation
- Local desktop/mobile QA was added during PR triage. No production deployment or live source/licensing revalidation was performed
- The existing example/noindex status remains; search indexing and production launch require a separate decision
- The generator uses Python's default text encoding; run in a UTF-8 environment

No dependency installation is required. A JavaScript toolchain, property-test library, and framework conversion are not introduced for this static export. There is no newly configured CI workflow or deployment pipeline.
