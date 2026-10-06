import assert from 'node:assert/strict';
import fs from 'node:fs';
import { setTimeout } from 'node:timers/promises';
const base = process.argv[2] ?? 'http://127.0.0.1:8080';
const agents = JSON.parse(fs.readFileSync('src/content/realtors.json', 'utf8'));
const routes = [
  '/',
  '/terms.html',
  '/privacy.html',
  ...agents.filter((a) => !a.draft).map((a) => '/realtors/' + a.slug + '.html'),
];
for (let attempt = 0; attempt < 50; attempt++) {
  let response;
  try {
    response = await fetch(base + '/healthz', {
      signal: AbortSignal.timeout(2000),
    });
  } catch (error) {
    if (attempt === 49) throw error;
    await setTimeout(200);
    continue;
  }
  assert.equal(response.status, 200, 'Serving readiness failed');
  break;
}
for (const route of routes) {
  const r = await fetch(base + route);
  assert.equal(r.status, 200, route);
  const html = await r.text();
  assert(r.headers.get('content-security-policy').includes('frame-ancestors'));
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('cache-control'), 'no-cache');
  assert(html.includes('https://toprealtorscypresstx.com' + route));
  assert(html.includes('noindex'));
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
  const r = await fetch(base + route);
  assert.equal(r.status, 404, route);
  assert((await r.text()).includes('That page isn’t in the guide.'));
  assert(r.headers.get('content-security-policy').includes('frame-ancestors'));
}
const marker = await (await fetch(base + '/build.json')).json();
assert.equal(marker.framework, 'Astro');
assert.equal(marker.origin, 'https://toprealtorscypresstx.com');
if (process.env.EXPECTED_COMMIT)
  assert.equal(marker.commit, process.env.EXPECTED_COMMIT);
for (const route of [
  '/robots.txt',
  '/sitemap.xml',
  '/favicon.svg',
  '/assets/coles-crossing-morning-1320.jpg',
])
  assert.equal((await fetch(base + route)).status, 200, route);
console.log(
  'Container smoke passed: public routes, genuine404, headers, canonical/noindex, media and expected build marker',
);
