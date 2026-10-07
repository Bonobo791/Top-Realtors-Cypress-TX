FROM node:24.19.0-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=secret,id=build_ca \
    if [ -f /run/secrets/build_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/build_ca; fi; \
    npm install --global npm@11.9.0 --fetch-retries=0 --fetch-timeout=10000 && \
    npm ci --fetch-retries=2 --fetch-timeout=30000
COPY astro.config.mjs tsconfig.json ./
COPY src ./src
COPY public ./public
COPY scripts ./scripts
ARG SOURCE_COMMIT
RUN test -n "$SOURCE_COMMIT" || { echo 'SOURCE_COMMIT is required: use the full source SHA, or local for a disposable development image' >&2; exit 1; }; \
    BUILD_COMMIT="$SOURCE_COMMIT" npm run build && chmod -R a+rX dist

FROM nginx:stable-alpine@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e870eed43071545afa9d2e27d94
RUN rm -rf /usr/share/nginx/html/*
COPY --chmod=0644 deploy/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
USER 101:101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -Y off -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
STOPSIGNAL SIGQUIT
ENTRYPOINT []
CMD ["nginx", "-g", "daemon off;"]
