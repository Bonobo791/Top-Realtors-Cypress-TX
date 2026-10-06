# PR #1 triage

Reviewed on October 6, 2026 against `676ffc28d1a2f0172d582895249e899ff1b49141` on `export/cypress-realtor-guide`. The target is [Top-Realtors-Cypress-TX PR #1](https://github.com/Bonobo791/Top-Realtors-Cypress-TX/pull/1). Work used a fresh checkout of that repository.

## Findings and dispositions

| Finding | Disposition |
| --- | --- |
| Featured `.identity` wrapper stays open | Fixed in the generator and regenerated homepage. The summary, button, and note are now siblings of the identity block. The checker detects unbalanced explicit tags. |
| Negative citation index selects the last source | Both scripts require an integer index within `0 <= index < len(sources)`, excluding booleans. The generator validates all citations before writing. Invalid facts remain visible as errors; none are silently dropped. |
| Removed or renamed profile leaves stale HTML | The generator removes obsolete `*.html` files from its generated `dist/realtors` directory after rendering and writing current pages. The checker rejects extra profile pages. Other files and assets survive. |
| Local links can resolve outside `dist` | The checker decodes and resolves targets, verifies containment before filesystem checks, and rejects escaping symlinks. It also rejects HTML files outside the root and checks normalized fragment targets. |
| Uppercase `FORM` or `SCRIPT` bypasses exclusion | The checker uses HTMLParser's normalized tag names to detect prohibited elements, including mixed case. |
| Unescaped telephone attribute can introduce attributes | The generator escapes `tel` values before placing them in HTML attributes. Current phone data and generated profile bytes remain unchanged. |
| Missing required featured profile causes `StopIteration` | The generator raises an explicit error naming the required `lippincott-team` profile. This is a data requirement, not a reason to omit the featured card. |
| Generic JSON, HTML parsing, and I/O exception suggestions | No broad catches added. Malformed JSON, missing inputs, decoding problems, and I/O errors already terminate these local build/check scripts with a nonzero exit. HTMLParser tolerates malformed markup, so explicit nesting validation addresses the actual markup gap. The proposed citation filter could silently omit facts and still allow negative indices; it was not applied. |
| Independent review: cleanup through an external directory symlink | Fixed before publication. The generator refuses a profile directory that resolves outside `dist`, before any writes or cleanup. A regression confirms unrelated outside HTML survives. |

The source findings are in the [CodeAnt consolidated report](https://github.com/Bonobo791/Top-Realtors-Cypress-TX/pull/1#issuecomment-6020821385), [CodeAnt nitpicks](https://github.com/Bonobo791/Top-Realtors-Cypress-TX/pull/1#issuecomment-6020820539), and [Amazon Q summary](https://github.com/Bonobo791/Top-Realtors-Cypress-TX/pull/1#pullrequestreview-5431580489). No bot replies, review-thread resolutions, or reviewer requests were sent.

## Validation

Run the dependency-free regression suite and site checks:

```sh
python3 -m unittest discover -s tests -v
python3 generate.py
python3 check_site.py
python3 -m py_compile generate.py check_site.py tests/test_site.py
```

- All 31 tests pass. Regression tests failed against the preceding implementation before their fixes; the follow-up covers the latest-head findings below.
- Generation and checking pass: nine pages, seven profiles, 184 local references, zero failures.
- Repeated generation matches the checked-in HTML. Python compilation and `git diff --check` pass.
- Compared with `676ffc28`, `agents.json`, CSS, photograph, all seven profile pages, and `404.html` are byte-identical. The homepage differs only by one closing `div`. The source snapshot, citations, design assets, example wording, and noindex status are preserved.
- Independent review reproduced the cleanup symlink issue and checked its fix. No remaining blocking findings were reported.

## Browser check

Local Chromium QA covered all nine pages at widths of 1440, 375, and 320 pixels: 27 page/viewport checks. The checks covered HTTP responses, one H1 per page, no prohibited elements, noindex metadata, horizontal overflow, source/fact counts, public telephone targets, featured-card child structure and vertical placement, the local photograph, directory navigation, FAQ expansion, featured-profile navigation, and the 404 return link. Desktop and mobile screenshots of the homepage, featured card, Lippincott profile, and 404 page were inspected.

There were no page errors or failed local resource requests. Google Fonts requests failed with `net::ERR_TUNNEL_CONNECTION_FAILED` in this container, so visual QA used the existing fallback fonts. External website destinations and current professional facts/licensing were not revalidated. The checker validates explicit tag balance for these generated templates; it is not a full HTML conformance or accessibility validator.

## Remote checks at the starting commit

Semgrep, Gitar, and Amazon Q check runs completed successfully. CodeAnt's separate Quality Gates and SCR commit statuses failed. Its quality-gate report listed one antipattern, with the other listed categories passing. A later [user-supplied dashboard extract](https://github.com/Bonobo791/Top-Realtors-Cypress-TX/pull/1#issuecomment-6022168176) identifies it as an unnecessary f-string prefix in the FAQ generator; the follow-up removes that prefix without changing output. CodeRabbit reported success but skipped reviewing the draft. These starting-commit results do not establish the status of the fix commit; inspect the PR's current checks after publication.

The repository has no AGENTS.md, no active rulesets returned by GitHub, and the target branch was unprotected when checked. PR #1 was marked ready outside this triage session. No merge, deployment, Site publication, or template-repository change is included.

## Follow-up on `110ba894`

The incremental CodeAnt review assessed `110ba894b1c5b15c43c638fe98a07d9b1163705e`. Its consolidated comment keeps the prior markup/citation/stale-page suggestions under a previous-commit section and adds five new suggestions for this head. The historical suggestions remain fixed and covered by the regression suite. The old Amazon Q comments have no new review submission for this head; their dispositions above still apply. Gitar and Semgrep passed their check runs. CodeRabbit reported success while continuing to skip the draft.

| Latest-head finding | Follow-up disposition |
| --- | --- |
| `dist/realtors` symlink to `dist` passes containment and cleanup deletes the homepage/404 | Reproduced, then fixed by refusing symlinked profile directories before rendering/writes/cleanup. The root HTML preservation regression passes. Planned output symlinks are also refused before writes, so they cannot overwrite unrelated targets. |
| External `javascript:` links survive attribute escaping | Reproduced for official, HAR, and citation URLs. External link generation now requires absolute HTTP/HTTPS URLs with a host. The checker rejects unsafe schemes in HTML while preserving the existing SVG favicon data URL. |
| Editable `official_label` injects markup | Reproduced and fixed by escaping that text at the call site, matching the existing source-label handling. |
| Traversal slugs write outside the profile directory | Reproduced and fixed by validating lowercase letter/digit slugs separated by single hyphens before any output. Checker validation uses the same rule. |
| Duplicate slugs overwrite a profile | Reproduced and fixed by requiring unique slugs in both scripts. The generator refuses duplicates before writes. |
| `assert` disappears under Python `-O` | Reproduced for HTML failures and the seven-profile requirement. Both checks now record failures and return an explicit nonzero exit status. |
| Empty decorative `alt` rejected | Fixed: the checker requires the attribute to be present, and accepts `alt=""`. A separate regression still rejects a missing attribute. |
| Symlink fixtures fail where creation is unsupported/unprivileged | The suite skips symlink-dependent cases only for unsupported or permission errors from symlink creation; other filesystem errors still raise. Linux validation ran all cases without skips. Windows execution was not available. |
| Original quality-gate unnecessary f-string prefix | Removed the unused prefix from the literal `<details`; repeated generation remains unchanged. |

The [quality-gate comment for e193560c](https://github.com/Bonobo791/Top-Realtors-Cypress-TX/pull/1#issuecomment-6020837151) reports one unnamed antipattern and failed Quality Gates/SCR. SAST and SCA passed. A coverage status passed, but no coverage measurement was provided; this does not establish measured coverage. The dashboard could not be read from this container. The supplied Library extract explicitly identifies the original `676ffc28` unused f-string, already fixed in `e193560c`; it does not identify the current remaining antipattern. Both supported byte-download attempts failed, while Library read exposed all 178 lines. No new rule was inferred from that historical extract.

Follow-up validation: 27 tests pass; normal and optimized Python checks both report nine pages, seven profiles, 184 references, and no failures. Generation, compilation, and whitespace checks pass. Every `dist` file and `agents.json` remains byte-identical to `110ba894`, so this follow-up changes no page content or visual design. The prior 27-view browser evidence still applies to these unchanged HTML/CSS/photo bytes.


## Remaining review triage on `e193560c`

All 17 unresolved inline threads and the discussion/consolidated comments were read. No reviewer messages or thread resolutions were sent. Duplicate suggestions are grouped below; prior CodeAnt markup, citation, cleanup, escaping, slug, optimized-Python and decorative-alt findings remain fixed.

| Thread comment IDs | Disposition |
| --- | --- |
| 4197891364, 4197891395, 4197891455 | Already fixed: featured-profile error, confined local paths, and exact integer citation bounds. Regression coverage remains passing. |
| 4197891416, 4197891426, 4197891439, 4197891486 | No broad catches: parsing/input/decoding failures remain visible and nonzero. Explicit markup errors are checked. Catching every exception or continuing with empty input would hide failures. |
| 4197891467, 4199687623, 4199715785 | Added profile-directory preflight before any write. Existing symlink guards remain. Unexpected disk/permission failures still terminate nonzero; this export does not promise a multi-file transaction. |
| 4199687594, 4199715807 | Missing-alt errors now name the containing page through parser errors; filename regression updated. |
| 4199687612, 4199715813 | Corrected the stale quality-gate record above and distinguished successful status from measured coverage. |
| 4199715751 | Enforced the fixed seven-profile content contract before writes; rejected removal preserves existing export. Replacing/renaming a profile still removes obsolete generated HTML while retaining assets. |
| 4199715768 | Reproduced external writes through symlinked `dist`; now rejected before rendering/writes/cleanup. Regression confirms outside bytes survive. |
| 4199715775 | Checked URL-bearing attributes including iframe src, area href and video poster using the existing scheme and local-path checks. Independent cases reproduce unsafe URLs and pass after the fix. This checker remains a focused template validator, not a browser security sanitizer. |

Current validation: 31 tests pass after seven reproduced failing assertions/subcases; normal and optimized checks report nine pages, seven profiles, 184 local references and zero failures. All generated files, source data and design assets are byte-identical to `e193560c`. Existing browser evidence applies to these unchanged pages. Inspect the new commit's checks separately after publication.


## Latest Codex review on `85bf5c44`

| Discussion | Disposition |
| --- | --- |
| 4199838671 | Reproduced successful checking through symlinked `dist`. Checker now rejects the link before resolving the root and reads repository-local `agents.json`. |
| 4199838688 | Reproduced absent 404 passing validation. Both top-level generated pages are now explicitly required as files. |
| 4199838682 | Original hero photograph is 4,438,411 bytes. Added proportional 660/1320/2640px JPEG derivatives (62,419 / 234,461 / 775,361 bytes) and responsive markup matching the existing CSS widths. Original photo bytes, crop, scene, attribution and CC BY-SA 2.0 license remain intact; attribution documents derivatives. |

Regression coverage failed first for all three findings, then passed. Current suite has 35 tests; normal and optimized checks validate nine pages, seven profiles, and 187 local references (the original 184 plus three responsive candidates). Checker verifies each candidate exists and rejects unsafe candidate schemes. Missing candidate coverage passes. Repeated generation, compilation and whitespace checks pass. Source facts, citations, seven profile pages, 404, original image and CSS are unchanged. No public comments, review replies or thread resolutions were posted.

Independent Chromium comparison covered 375px at DPR 1/2, 800px, 1150px, and 1440px at DPR 1/2. Hero bounding boxes match the preceding commit exactly, responsive images decode without page errors, and the photograph scene/composition is preserved. Candidate selection chooses 660/1320/2640 as appropriate. Independent review found no blockers.

The first latest-review commit `3b645f38` passed Semgrep and Gitar, but CodeAnt reported one unnamed antipattern and one complex function. The checker callback was simplified by extracting shared URL recording/validation; 36 tests and the 187-reference optimized check pass, including a regression preserving the stricter responsive-candidate URL policy. Generated output remains unchanged by this refactor.
