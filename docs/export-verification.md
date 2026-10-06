# Export verification

## Scope

An exact static-source export of the current Cypress Realtor Guide, with standalone setup and rights documentation. Product files are preserved byte-for-byte from the current source; no redesign, new content, backend, tracking, contact form, or deployment is added. Sites identity and Git credentials are excluded.

The destination repository's initial README heading and Git history are preserved. The export is proposed on a separate branch for review.

## Verified on October 6, 2026

- Current Site source and published version match commit `1b52a92171e5989dd4ec67625239d042445824c2`
- Python generation completes, producing the homepage, seven profiles, and a 404 page
- Generation reproduces the checked-in HTML without differences
- The original `check_site.py` passes its nine-page, seven-profile, local-reference and selected-content checks
- Python source compiles successfully
- Photo and CSS are bundled locally; external fonts remain external by design

## Limitations and inherited issues

- The homepage's featured-card `.identity` container has an apparent missing closing `div` in the original generator and generated HTML. The original checker does not validate tag nesting. This export deliberately preserves it rather than silently changing the current design. A separate focused markup correction and browser check are recommended before production use.
- The original checker is a focused content/link check, not comprehensive HTML, accessibility, visual, or external-link validation
- No new desktop/mobile visual QA, production deployment, or live source/licensing revalidation was performed for this exact export
- The existing example/noindex status remains; search indexing and production launch require a separate decision
- The generator uses Python's default text encoding; run in a UTF-8 environment

No dependency installation is required. A JavaScript toolchain, property-test library, and framework conversion are not introduced for this static export. There is no newly configured CI workflow or deployment pipeline.
