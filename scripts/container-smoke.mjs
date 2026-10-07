import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from 'cheerio';
import { setTimeout } from 'node:timers/promises';
const target = new URL(process.argv[2] ?? 'http://127.0.0.1:8080');
assert(
  target.protocol === 'http:' &&
    ['127.0.0.1', '[::1]'].includes(target.hostname) &&
    !target.username &&
    !target.password &&
    target.pathname === '/' &&
    !target.search &&
    !target.hash,
  'Smoke target must be an HTTP loopback origin without credentials, path, query or fragment',
);
const base = new URL('http://127.0.0.1');
if (target.hostname === '[::1]') base.hostname = '[::1]';
base.port = target.port;
const request = (route, timeout = 5000) =>
  fetch(new URL(route, base), {
    signal: AbortSignal.timeout(timeout),
    redirect: 'error',
  });
const agents = JSON.parse(fs.readFileSync('src/content/realtors.json', 'utf8'));
const site = JSON.parse(fs.readFileSync('src/content/site.json', 'utf8'));
const routes = [
  '/',
  '/terms.html',
  '/privacy.html',
  ...agents.filter((a) => !a.draft).map((a) => '/realtors/' + a.slug + '.html'),
];
for (let attempt = 0; attempt < 50; attempt++) {
  let response;
  try {
    response = await request('/healthz', 2000);
  } catch (error) {
    if (attempt === 49)
      throw new Error(
        'Serving readiness failed after 50 attempts: ' +
          base.origin +
          '/healthz',
        { cause: error },
      );
    await setTimeout(200);
    continue;
  }
  assert.equal(response.status, 200, 'Serving readiness failed');
  break;
}
for (const route of routes) {
  const r = await request(route);
  assert.equal(r.status, 200, route);
  const html = await r.text();
  assert(r.headers.get('content-security-policy').includes('frame-ancestors'));
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('cache-control'), 'no-cache');
  const $ = load(html);
  const canonical = $('link[rel=canonical]');
  assert.equal(canonical.length, 1, 'Exactly one canonical link: ' + route);
  assert.equal(
    canonical.attr('href'),
    site.origin + route,
    'Canonical URL: ' + route,
  );
  const robots = $('meta[name=robots]');
  assert.equal(robots.length, 1, 'Exactly one robots meta tag: ' + route);
  assert.equal(
    robots.attr('content'),
    site.indexing ? 'index, follow' : 'noindex, follow',
    'Robots indexing directive: ' + route,
  );
}
for (const route of [
  '/missing',
  '/missing.html',
  '/assets/',
  '/realtors/',
  '/src/content/realtors.json',
  '/agents.json',
  '/.env',
  '/50x.html',
  '/404.html',
]) {
  const r = await request(route);
  assert.equal(r.status, 404, route);
  const html = await r.text();
  assert(html.includes('That page isn’t in the guide.'));
  assert.equal(
    load(html)('meta[name=robots]').attr('content'),
    'noindex, follow',
  );
  assert(r.headers.get('content-security-policy').includes('frame-ancestors'));
}
const marker = await (await request('/build.json')).json();
assert.equal(marker.framework, 'Astro');
assert.equal(marker.origin, 'https://realtorscypresstx.com');
if (process.env.EXPECTED_COMMIT)
  assert.equal(marker.commit, process.env.EXPECTED_COMMIT);
for (const route of [
  '/robots.txt',
  '/sitemap.xml',
  '/favicon.svg',
  '/assets/coles-crossing-morning-1320.jpg',
]) {
  const response = await request(route);
  assert.equal(response.status, 200, route);
  await response.arrayBuffer();
}
console.log(
  'Container smoke passed: public routes, genuine404, headers, canonical/robots, media and expected build marker',
);
