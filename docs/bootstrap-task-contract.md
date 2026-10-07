# Shared setup-task contract

Each row in bootstrap-tasks.md is a task adapted from the pinned ADM setup-task template. It supplies its ID, dependencies, exact files, accepted/rejected behavior, command and observable done criterion. The following rules apply to each task.

The implementer owns local foundation work. The repository owner owns publication, licensing and required-check policy. An authorized host operator owns Coolify, DNS/TLS, logs and live rollback. Pending release tasks do not block isolated source edits or local checks.

Hand-authored inputs are src/, public/, deploy/, scripts/, tests/, configuration and docs. Astro generates ignored .astro/ and dist/. Source schemas reject malformed configuration, citation bounds, unsafe URLs, mismatched phones and invalid rating provenance. Missing metrics remain absent. Failures exit nonzero without dropping content. The output directory must not be a symlink before cleanup.

Configuration contracts are in environment.md; route/access/indexing/cache contracts are in routes.md. Use Node 24.19/npm 11.9 and the single lockfile. npm ci runs normal lifecycle scripts. No provider account or production credentials are needed.

Forbidden effects: changes in another repository, publication of the superseded Python branch, writes outside task-owned repository paths or owned isolated fixtures, new-branch push without parent approval, merge, deployment, DNS changes, production/provider access, private-data fixtures or outgoing reviewer/bot/customer messages. Fixtures reset synthetic state and remove only owned files/containers.

Each task's positive/negative case and independent oracle appear in its row or the invariant register. Actual regression failures, replay seed/path, scoped mutation accounting and browser/container observations are in verification.md. Files/dependencies/workflows alone do not establish completion.
