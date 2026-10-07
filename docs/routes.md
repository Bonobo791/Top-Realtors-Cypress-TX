# Route contracts

Adapted from Site-Bootstrap-ADM's route matrix. Canonical origin: https://toprealtorscypresstx.com; base /; file-style .html profile/legal URLs; root / remains root. Existing seven URLs are preserved without a redirect migration.

| Path/family                         | Render/access                             | Mutation | Indexing/cache                                           | Analytics | Verification                                 |
| ----------------------------------- | ----------------------------------------- | -------- | -------------------------------------------------------- | --------- | -------------------------------------------- |
| /                                   | Astro static, public                      | None     | Preview noindex; canonical root; Nginx no-cache          | None      | Directory/schema/order, keyboard, responsive |
| /realtors/{seven stable slugs}.html | Astro collection + getStaticPaths, public | None     | Preview noindex; own canonical; no-cache                 | None      | Exact source facts/contact escaping/ratings  |
| /terms.html                         | Astro static, public                      | None     | Preview noindex, canonical, no-cache                     | None      | Relationship/readability                     |
| /privacy.html                       | Astro static, public                      | None     | Preview noindex, canonical, no-cache                     | None      | No intake/tracker/font requests              |
| /404.html and unknown paths         | Static body; Nginx404                     | None     | Always noindex; no-cache; excluded sitemap               | None      | Actual status/body, recovery link            |
| /sitemap.xml /robots.txt            | Astro build-time endpoints to files       | None     | Intended public canonical inventory; excludes drafts/404 | None      | Parsed inventory and linked origin           |
| /assets/* /_astro/* /favicon.svg    | Local public assets                       | None     | Revalidation cache policy; no listings                   | None      | Every local reference, actual MIME/load      |
| /build.json                         | Static safe SHA marker                    | None     | No-cache; excluded sitemap                               | None      | Expected source identity, no secrets         |
| /healthz                            | Nginx serves real index file              | None     | No-cache, no access log                                  | None      | 200 if serving;503 when file absent          |

No Astro request-time APIs/adapters, CMS editor/admin/preview routes, forms, accounts, database or contact delivery exist. Draft content is filtered from pages, sitemap and directory; unpublished source remains outside the final web root. Nginx serves only dist, blocks symlinks and rejects above-root traversal during parsing. No blanket homepage `200` fallback exists. HTTP/HTTPS and www redirects belong to the selected Coolify proxy and require live verification.
