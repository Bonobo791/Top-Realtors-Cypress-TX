# Approved architecture amendment

Plan: CRG, repository implementation amendment, October 6, 2026. Parent owns updates to the existing CRG source plan; this document changes no remote project or cycle.

The user explicitly corrected the architecture: use Site-Bootstrap-ADM for an actual website, without Python scripts. This supersedes the previous choice to preserve the export pipeline. Target: real Astro/TypeScript static site, Git-backed validated content, native shared layout/components, website toolchain and tests. CMS/contact/database/tracking remain unselected; adding a provider would change scope.

| Decision                 | Status/source                                       | Implementation and acceptance                                                                                         |
| ------------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Foundation               | Confirmed: user's architecture correction           | Site-Bootstrap-ADM 916df29d inspected fresh; actual templates/helper adapted; Astro collections/layout/routes compile |
| Pages                    | Confirmed earlier approved brief                    | Home + seven retained profile.html routes + Terms/Privacy/404; meaningful statuses/canonicals                         |
| Paid placement           | Confirmed: Lippincott pays publisher to create site | Exact Sponsored listing badge in feature/first row/profile; Terms relationship; no calculated best-agent claim        |
| Evidence                 | Confirmed approved source snapshot                  | Seven original fact/source records preserved; four named individual HAR aggregates; no invented missing ratings       |
| Design/media             | Confirmed approved visual direction                 | Original responsive design/system fonts/photo and responsive JPEGs retained with license                              |
| Host                     | Confirmed readiness request                         | Tested Node-build/Nginx image, health/SHA, genuine404, headers; Coolify deployment/runbook                            |
| Public release           | Pending separate approval                           | Commit tested branch locally; no push, merge, deployment or DNS                                                       |
| Budget/capacity/calendar | Open, unchanged                                     | Work sessions remain unscheduled; no invented dates/cycles/provider spend                                             |

Journey: compare sourced profiles on the homepage, understand sponsored placement and individual feedback, open a detail profile, follow its official/HAR/contact links, and independently confirm current terms. No visitor review intake, accounts, lead forwarding, search/IDX or representation service is introduced.

Phases: A1 tooling/contracts and test red→green; A2 native Astro content/pages/design; A3 built/browser/mutation/container verification and independent review; A4 approved publication and actual CI; A5 authorized host/domain/indexing/release/rollback. A4–A5 stay blocked by their explicit approvals and live evidence, not by missing cloud credentials for local development.

Architecture alternatives considered: a corrected Python export would preserve the wrong requested product; an Astro SSR/hosted CMS stack adds unrequested services; Astro static collections provide the requested website foundation while keeping sourced content deterministic and hostable. The earlier unpublished branches are superseded and must not be published as this implementation.

See bootstrap-tasks.md for exact task dependencies, files, commands, positive/negative tests and forbidden effects. EMD implementation brief keeps market/topic scope and research gaps separate from local technical readiness. No SEO position, AI recommendation or legal-clearance promise is made.

## Public launch amendment — October 7, 2026

The user authorized launching the existing Coolify application, selected https://realtorscypresstx.com as the public origin, and requested search-engine indexing. This replaces the earlier toprealtorscypresstx.com origin and preview noindex setting. The source contracts, build marker, canonical/SEO checks and current runbooks use the selected domain. The release handoff records the deployed SHA and live observations.
