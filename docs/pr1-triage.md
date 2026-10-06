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

- All 27 tests pass. Regression tests failed against the preceding implementation before their fixes; the follow-up covers the latest-head findings below.
- Generation and checking pass: nine pages, seven profiles, 184 local references, zero failures.
- Repeated generation matches the checked-in HTML. Python compilation and `git diff --check` pass.
- Compared with `676ffc28`, `agents.json`, CSS, photograph, all seven profile pages, and `404.html` are byte-identical. The homepage differs only by one closing `div`. The source snapshot, citations, design assets, example wording, and noindex status are preserved.
- Independent review reproduced the cleanup symlink issue and checked its fix. No remaining blocking findings were reported.

## Browser check

Local Chromium QA covered all nine pages at widths of 1440, 375, and 320 pixels: 27 page/viewport checks. The checks covered HTTP responses, one H1 per page, no prohibited elements, noindex metadata, horizontal overflow, source/fact counts, public telephone targets, featured-card child structure and vertical placement, the local photograph, directory navigation, FAQ expansion, featured-profile navigation, and the 404 return link. Desktop and mobile screenshots of the homepage, featured card, Lippincott profile, and 404 page were inspected.

There were no page errors or failed local resource requests. Google Fonts requests failed with `net::ERR_TUNNEL_CONNECTION_FAILED` in this container, so visual QA used the existing fallback fonts. External website destinations and current professional facts/licensing were not revalidated. The checker validates explicit tag balance for these generated templates; it is not a full HTML conformance or accessibility validator.

## Remote checks at the starting commit

Semgrep, Gitar, and Amazon Q check runs completed successfully. CodeAnt's separate Quality Gates and SCR commit statuses failed. Its quality-gate report listed one antipattern, with the other listed categories passing. A later [user-supplied dashboard extract](https://github.com/Bonobo791/Top-Realtors-Cypress-TX/pull/1#issuecomment-6022168176) identifies it as an unnecessary f-string prefix in the FAQ generator; the follow-up removes that prefix without changing output. CodeRabbit reported success but skipped reviewing the draft. These starting-commit results do not establish the status of the fix commit; inspect the PR's current checks after publication.

The repository has no AGENTS.md, no active rulesets returned by GitHub, and the target branch was unprotected when checked. PR #1 remains a draft. No merge, deployment, Site publication, or template-repository change is included.

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

The [latest quality-gate comment](https://github.com/Bonobo791/Top-Realtors-Cypress-TX/pull/1#issuecomment-6020837151) reports two antipatterns and failed Quality Gates/SCR for `110ba894`, while SAST, SCA, and coverage passed. The comment does not name the two antipatterns, and the dashboard could not be read through the available tool. Removing the identified original issue does not prove the full gate cleared. Check the next commit's actual report.

Follow-up validation: 27 tests pass; normal and optimized Python checks both report nine pages, seven profiles, 184 references, and no failures. Generation, compilation, and whitespace checks pass. Every `dist` file and `agents.json` remains byte-identical to `110ba894`, so this follow-up changes no page content or visual design. The prior 27-view browser evidence still applies to these unchanged HTML/CSS/photo bytes.
