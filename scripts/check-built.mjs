import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import { inspectMarkup } from './lib/inspect-markup.mjs';
import { inspectRating } from './lib/inspect-rating.mjs';
import {
  parseDirectory,
  parseRatingSnapshot,
  parseSite,
  publicPaths,
  canonical,
  profilePath,
  isTeam,
} from '../src/lib/contracts.ts';
const root = path.resolve('dist');
assert(
  !fs.lstatSync(root).isSymbolicLink(),
  'Build root must not be a symlink',
);
const read = (name) =>
  JSON.parse(fs.readFileSync('src/content/' + name + '.json', 'utf8'));
const site = parseSite(read('site'));
const agents = parseDirectory(read('realtors'));
const ratings = parseRatingSnapshot(read('ratings'), agents);
const routes = [...publicPaths(agents), '/404.html'];
let references = 0;
const failures = [];
const titles = new Set();
const descriptions = new Set();
for (const route of routes) {
  const file = path.join(root, route === '/' ? 'index.html' : route.slice(1));
  assert(fs.existsSync(file), 'Required public file ' + route);
  const markup = fs.readFileSync(file, 'utf8');
  const $ = load(markup);
  assert.equal($('h1').length, 1);
  assert.equal($('main').length, 1);
  assert.equal($('html').attr('lang'), 'en');
  assert.equal($('link[rel=canonical]').length, 1);
  assert.equal($('link[rel=canonical]').attr('href'), canonical(route));
  assert.equal($('meta[property="og:url"]').attr('content'), canonical(route));
  assert.equal(
    $('meta[property="og:image"]').attr('content'),
    site.origin + '/assets/coles-crossing-morning-1320.jpg',
  );
  const robots = $('meta[name=robots]').attr('content');
  assert.equal(
    robots,
    site.indexing && route !== '/404.html'
      ? 'index, follow'
      : 'noindex, follow',
  );
  const title = $('title').text();
  const description = $('meta[name=description]').attr('content');
  assert(title && description);
  assert(
    !titles.has(title) && !descriptions.has(description),
    'Duplicate metadata',
  );
  titles.add(title);
  descriptions.add(description);
  assert(!markup.includes('AggregateRating'));
  assert(!markup.includes('cypress-realtor-guide-example'));
  assert(!markup.includes('SECRET_SENTINEL'));
  const result = inspectMarkup(root, file);
  references += result.references;
  failures.push(...result.failures);
}
for (const agent of agents.filter((a) => !a.draft)) {
  const $ = load(
    fs.readFileSync(path.join(root, profilePath(agent).slice(1)), 'utf8'),
  );
  assert.equal($('h1').text(), agent.name);
  assert.equal($('.fact-list li').length, agent.facts.length);
  assert.equal($('.sources ol li').length, agent.sources.length);
  agent.facts.forEach((fact, i) => {
    assert($('.fact-list li').eq(i).text().includes(fact.text));
    assert.equal(
      $('.fact-list li small a').eq(i).attr('href'),
      agent.sources[fact.source].url,
    );
  });
  const schema = JSON.parse($('script[type="application/ld+json"]').text());
  assert.equal(schema.mainEntity.name, agent.name);
  assert.equal(
    schema.mainEntity['@type'],
    isTeam(agent) ? 'Organization' : 'Person',
  );
  if (agent.tel)
    assert.equal($('a[href^="tel:"]').attr('href'), 'tel:' + agent.tel);
  inspectRating($('.rating-panel'), ratings[agent.slug]);
}
const home = load(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
for (const agent of agents.filter((a) => !a.draft))
  inspectRating(
    home(`.agent-row[data-profile="${agent.slug}"] .rating-panel`),
    ratings[agent.slug],
  );
assert.equal(
  home('.agent-row').first().attr('data-profile'),
  'lippincott-team',
);
assert.equal(home('.feature-card .identity h2').text(), 'The Lippincott Team');
assert.equal(home('.feature-card .identity .btn').length, 0);
assert.equal(
  home('.feature-card .sponsored-badge').text(),
  'Sponsored listing',
);
assert.equal(
  home('.agent-row').first().find('.sponsored-badge').text(),
  'Sponsored listing',
);
const lippincott = load(
  fs.readFileSync(path.join(root, 'realtors/lippincott-team.html'), 'utf8'),
);
assert.equal(lippincott('.sponsored-badge').text(), 'Sponsored listing');
assert(
  lippincott('.hero-actions a')
    .first()
    .attr('rel')
    .split(' ')
    .includes('sponsored'),
);
const sitemap = load(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), {
  xml: true,
});
assert.deepEqual(
  new Set(
    sitemap('loc')
      .toArray()
      .map((el) => sitemap(el).text()),
  ),
  new Set(publicPaths(agents).map(canonical)),
);
assert(
  fs
    .readFileSync(path.join(root, 'robots.txt'), 'utf8')
    .includes(site.origin + '/sitemap.xml'),
);
assert.equal(
  fs
    .readdirSync(path.join(root, 'realtors'))
    .filter((name) => name.endsWith('.html')).length,
  agents.filter((a) => !a.draft).length,
  'Stale profile output',
);
assert.equal(failures.length, 0, failures.join('\n'));
console.log(
  JSON.stringify({
    pages: routes.length,
    profiles: agents.filter((a) => !a.draft).length,
    localReferences: references,
    failures,
  }),
);
