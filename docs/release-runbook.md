# Release and recovery record

The selected artifact is an Astro static build served by pinned Nginx on8080 through Coolify's TLS proxy. Production origin: https://realtorscypresstx.com. No runtime adapter, persistent volume, database, CMS or provider credential is selected. See coolify.md for settings and commands.

The user authorized the October 7, 2026 public launch through Coolify, selected realtorscypresstx.com and enabled search-engine indexing. Main is release. The launch includes publishing the domain/indexing correction and deploying its verified source commit. Actual new-SHA CI/branch enforcement is separate from local checks.

| Step           | Owner and required observation                                                         | Evidence                                          |
| -------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Foundation     | Implementer: frozen install, verify, mutations, container/browser and review           | verification.md/evidence archive                  |
| Publish        | Parent/repository owner: approve exact commit, push, inspect actual CI/required checks | Pending; no new-branch push                       |
| Release review | Owner/operator: approve source SHA, sponsor/facts/privacy/license/indexing and host    | Indexing enabled by the owner for launch          |
| Build          | Operator: Dockerfile/8080, full approved SOURCE_COMMIT, retained prior image           | Local checks; host pending                        |
| Serve          | Operator: authorized deploy; /healthz200 and /build.json exact SHA/no-cache            | Local evidence only                               |
| Public smoke   | Operator:10 normal routes200, unknown/404404, assets, canonical/headers                | Local tests; live DNS/TLS/redirect pending        |
| Logs/privacy   | Operator: inspect destinations/access/retention                                        | No intake; host request/IP logs still need review |
| Rollback       | Operator: retained compatible image/config, actual rollback and repeated smoke         | Procedure supplied; live execution pending        |

No migration, CDN purge, scheduler, private account, delivery provider or analytics state is selected. Health establishes static-serving readiness, not domain release or search indexing.

Git content recovery is rehearsed in content-build.integration.test.ts: synthetic edits and invalid citations are restored to known-good checked-in JSON; rebuilding recovers all 7 original profile routes. Photos remain versioned with attribution. An authorized recovery uses an isolated checkout of the approved previous revision, full verification and a new image. Do not overwrite a live checkout or running container.

Rollback uses the prior retained image and compatible host configuration. It does not reverse DNS/proxy/content decisions. If no image remains, rebuild the previous approved commit separately, verify its marker, then release only with authorization. Record actual elapsed time and served identity; this task promises no recovery-time objective.

Local results are in verification.md. Production readiness remains pending publication, intended-SHA CI, live TLS/routing, log evidence and host rollback.
