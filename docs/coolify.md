# Coolify serving contract

Use the Dockerfile build pack. Node builds the actual Astro website and validated Git content into dist/. Pinned Nginx serves those files as uid 101 on8080. The runtime contains no Python pipeline, Node server, CMS, database or writable content store.

Official sources checked October 6, 2026: [Dockerfile builds](https://coolify.io/docs/applications/builds/dockerfile), [health checks](https://coolify.io/docs/applications/configuration/health-checks), [domains](https://coolify.io/docs/core/networking/domains) and [rollbacks](https://coolify.io/docs/applications/deployments/rollbacks). This task has not inspected or changed a Coolify installation.

After release approval, select the target repository and approved release SHA/branch, root Dockerfile/context and container port8080. Map https://toprealtorscypresstx.com:8080 in Coolify; public HTTPS uses443. Coolify owns TLS termination/certificate issuance. Verify real DNS and a certificate covering the exact host. Add www only with deliberate DNS/certificate/redirect-to-canonical configuration and testing. Avoid fixed host ports or managed-container names.

Enable the host's source-commit build input so ARG SOURCE_COMMIT receives the full approved SHA. Verify /build.json against that SHA after release. SOURCE_COMMIT has no default: omitted or invalid values fail the build. Release images require the full approved lowercase 40-character SHA. For a disposable development image, opt in with `docker build --build-arg SOURCE_COMMIT=local -t cypress-astro:development .`; that image is unsuitable for release. No private runtime/build credentials or volumes are required. src/content/site.json controls exact origin and default noindex at build time. Owner-approved indexing changes require a rebuild.

Docker HEALTHCHECK requests /healthz. Nginx serves the actual index there and returns503 if absent. Preserve the effective Docker health configuration. Nginx handles SIGQUIT for graceful shutdown. Verify the actual Coolify version's probe/termination/rolling settings; the image alone does not establish uninterrupted releases.

Local commands:

```sh
docker build --build-arg SOURCE_COMMIT="$(git rev-parse HEAD)" -t cypress-astro:readiness .
docker run -d --name cypress-astro-smoke --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=16m --cap-drop ALL \
  --security-opt no-new-privileges -p 127.0.0.1:8082:8080 cypress-astro:readiness
EXPECTED_COMMIT="$(git rev-parse HEAD)" node scripts/container-smoke.mjs http://127.0.0.1:8082
E2E_BASE_URL=http://127.0.0.1:8082 npm run test:e2e
docker inspect --format '{{.State.Health.Status}}' cypress-astro-smoke
docker stop --time 30 cypress-astro-smoke
docker rm cypress-astro-smoke
```

The container smoke command accepts only HTTP origins whose normalized host is `127.0.0.1` or `[::1]`, with an optional port, a root pathname and empty credentials/query/fragment. It rejects redirects. A trailing `/` is normalized before the fixed smoke routes are requested.

Install Playwright Chromium, or use the documented local executable path. A cold install may need the execution environment's credential-free proxy, resolvable proxy host and CA trust. Pass Docker's predefined HTTP_PROXY/HTTPS_PROXY arguments and optional BuildKit build_ca secret only for that environment. Never disable TLS validation or use ARG/ENV for private secrets. Proxy args/trust mounts are tooling inputs, not application settings/runtime files. See [Docker proxy arguments](https://docs.docker.com/build/building/variables/#proxy-arguments).

Nginx sends genuine404, CSP/nosniff/referrer/no-cache headers, and denies listing/symlinked resources. Source JSON/scripts, .env, stock50x and node_modules are absent from its webroot. Marker/health responses cannot prove fresh release through a stale external cache: verify the actual public chain. HSTS belongs to the reviewed TLS proxy.

Access/error logs go to stdout/stderr. Default access logs can retain IPs and request paths/query strings. Before release the operator must review actual log access/destinations/retention. No visitor form or analytics provider is present.

Retain the previous approved image/configuration. Use Coolify's documented rollback action, then verify previous expected marker, health, normal routes/unknown404/assets/headers. Rollback does not undo DNS or proxy changes. Rebuild a previous approved commit if no compatible image remains. Record actual rollback results/time; this task has performed no production rollback.
