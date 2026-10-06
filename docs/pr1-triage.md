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

- All 16 tests pass. The new regressions failed against the original behavior before fixes; the cleanup-directory regression also failed before its guard was added.
- Generation and checking pass: nine pages, seven profiles, 184 local references, zero failures.
- Repeated generation matches the checked-in HTML. Python compilation and `git diff --check` pass.
- Compared with `676ffc28`, `agents.json`, CSS, photograph, all seven profile pages, and `404.html` are byte-identical. The homepage differs only by one closing `div`. The source snapshot, citations, design assets, example wording, and noindex status are preserved.
- Independent review reproduced the cleanup symlink issue and checked its fix. No remaining blocking findings were reported.

## Browser check

Local Chromium QA covered all nine pages at widths of 1440, 375, and 320 pixels: 27 page/viewport checks. The checks covered HTTP responses, one H1 per page, no prohibited elements, noindex metadata, horizontal overflow, source/fact counts, public telephone targets, featured-card child structure and vertical placement, the local photograph, directory navigation, FAQ expansion, featured-profile navigation, and the 404 return link. Desktop and mobile screenshots of the homepage, featured card, Lippincott profile, and 404 page were inspected.

There were no page errors or failed local resource requests. Google Fonts requests failed with `net::ERR_TUNNEL_CONNECTION_FAILED` in this container, so visual QA used the existing fallback fonts. External website destinations and current professional facts/licensing were not revalidated. The checker validates explicit tag balance for these generated templates; it is not a full HTML conformance or accessibility validator.

## Remote checks at the starting commit

Semgrep, Gitar, and Amazon Q check runs completed successfully. CodeAnt's separate Quality Gates and SCR commit statuses failed. Its [quality-gate report](https://github.com/Bonobo791/Top-Realtors-Cypress-TX/pull/1#issuecomment-6020837151) lists one antipattern, with the other listed categories passing; the comment does not identify that antipattern. CodeRabbit reported success but skipped reviewing the draft. These starting-commit results do not establish the status of the fix commit; inspect the PR's current checks after publication.

The repository has no AGENTS.md, no active rulesets returned by GitHub, and the target branch was unprotected when checked. PR #1 remains a draft. No merge, deployment, Site publication, or template-repository change is included.
