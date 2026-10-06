import { expect, test } from 'vitest';
import agents from '../src/content/realtors.json';
import ratings from '../src/content/ratings.json';
import site from '../src/content/site.json';
import {
  canonical,
  parseDirectory,
  parseRatingSnapshot,
  parseSite,
  orderProfiles,
  jsonLd,
  profilePath,
  publicPaths,
  isTeam,
} from '../src/lib/contracts';
test.each([
  '/',
  '/terms.html',
  '/privacy.html',
  '/404.html',
  '/realtors/lippincott-team.html',
])('canonical preserves approved %s', (path) =>
  expect(canonical(path)).toBe('https://toprealtorscypresstx.com' + path),
);
test.each([
  'https://evil.test/',
  '//evil.test/',
  '/../secret',
  '/realtors/Amy.html',
  '/realtors/-amy.html',
  '/realtors/a--b.html',
  '/?token=secret',
  '/#main',
  '/admin',
])('rejects %s', (path) => expect(() => canonical(path)).toThrow());
test('rejects lookalike origin and nonboolean flag', () => {
  expect(() =>
    parseSite({ ...site, origin: site.origin + '.evil.test' }),
  ).toThrow();
  expect(() => parseSite({ ...site, indexing: 'false' })).toThrow();
});
test('team leaders remain individuals; only an actual team is an organization', () => {
  expect(isTeam({ type: 'Team leader' })).toBe(false);
  expect(isTeam({ type: 'Real estate team' })).toBe(true);
  expect(isTeam({ type: 'TEAM' })).toBe(true);
  expect(isTeam({ type: 'Real estate team leader' })).toBe(false);
});
test('one-past citation, missing sponsor and draft sponsor are rejected', () => {
  const data = structuredClone(agents);
  data[0].facts[0].source = data[0].sources.length;
  expect(() => parseDirectory(data)).toThrow();
  data[0].facts[0].source = 0;
  data[0].slug = 'another-team';
  expect(() => parseDirectory(data)).toThrow();
  data[0].slug = 'lippincott-team';
  Object.assign(data[0], { draft: true });
  expect(() => parseDirectory(data)).toThrow();
});
test('telephone target and visible phone must remain paired and safe', () => {
  const data = structuredClone(agents);
  Reflect.deleteProperty(data[0], 'tel');
  expect(() => parseDirectory(data)).toThrow();
  data[0].tel = agents[0].tel;
  Reflect.deleteProperty(data[0], 'phone');
  expect(() => parseDirectory(data)).toThrow();
  data[0].phone = agents[0].phone;
  data[0].tel = '+1713" onclick="alert(1)';
  expect(() => parseDirectory(data)).toThrow();
});
test.each([
  'not a URL',
  'https://user@example.test/',
  'https://:pass@example.test/',
])('rejects malformed or credential URLs: %s', (official) => {
  const data = structuredClone(agents);
  data[0].official = official;
  expect(() => parseDirectory(data)).toThrow();
});
test('drafts leave both directory and public route inventory', () => {
  const data = parseDirectory(agents);
  data[2].draft = true;
  expect(orderProfiles(data)).toHaveLength(6);
  expect(publicPaths(data)).not.toContain(profilePath(data[2]));
  expect(publicPaths(parseDirectory(agents))).toHaveLength(10);
  expect(new Set(publicPaths(parseDirectory(agents)))).toEqual(
    new Set([
      '/',
      '/privacy.html',
      '/terms.html',
      ...agents.map((a) => `/realtors/${a.slug}.html`),
    ]),
  );
  expect(() => profilePath({ slug: '../x' })).toThrow();
});
test('individual scope, rating dates and exact subject reject mismatches', () => {
  const data = parseDirectory(agents);
  const changed = structuredClone(ratings);
  changed['lippincott-team'].subject = 'The Lippincott Team';
  expect(() => parseRatingSnapshot(changed, data, '2026-10-06')).toThrow();
  changed['lippincott-team'].subject = 'Amy Lippincott';
  expect(parseRatingSnapshot(changed, data, '2026-10-06')).toHaveProperty(
    'lippincott-team',
  );
  changed['lippincott-team'].checked = '2026-10-07';
  expect(() => parseRatingSnapshot(changed, data, '2026-10-06')).toThrow();
  changed['lippincott-team'].checked = '2026-99-99';
  expect(() => parseRatingSnapshot(changed, data, '2026-10-06')).toThrow();
});
test('non-sponsored profiles are alphabetical with only leading The ignored', () => {
  const data = parseDirectory(agents);
  data[1].name = 'The Zebra';
  data[2].name = 'The Apple';
  data[3].name = 'Interior The Beta';
  const selected = [data[0], data[1], data[2], data[3]];
  expect(orderProfiles(selected).map((a) => a.name)).toEqual([
    'The Lippincott Team',
    'The Apple',
    'Interior The Beta',
    'The Zebra',
  ]);
});
test.each(['kevan-pewitt', 'jill-smith', 'tiffani-reynolds'] as const)(
  'individual rating subject must match %s even with the correct HAR URL',
  (key) => {
    const data = parseDirectory(agents);
    const changed = structuredClone(ratings);
    changed[key].subject = 'Another individual';
    expect(() => parseRatingSnapshot(changed, data, '2026-10-06')).toThrow();
    const expected = ratings[key];
    changed[key].subject = '  ' + expected.subject + '  ';
    expect(parseRatingSnapshot(changed, data, '2026-10-06')[key]).toEqual(
      expected,
    );
  },
);
test('seven unchanged source profiles and visible placement order', () => {
  const parsed = parseDirectory(agents);
  expect(parsed).toHaveLength(7);
  const ordered = orderProfiles(parsed);
  expect(ordered[0].slug).toBe('lippincott-team');
  expect(new Set(ordered.map((a) => a.slug)).size).toBe(7);
});
test.each([-1, 0.5, true, 999])('rejects invalid citation %s', (source) => {
  const changed = structuredClone(agents);
  Object.assign(changed[0].facts[0], { source });
  expect(() => parseDirectory(changed)).toThrow();
});
test('duplicate/missing/unsafe slug rejected', () => {
  const duplicate = structuredClone(agents);
  duplicate[6].slug = duplicate[1].slug;
  expect(() => parseDirectory(duplicate)).toThrow();
  expect(() => parseDirectory([...agents.slice(1), agents[1]])).toThrow();
  expect(() => parseDirectory(agents.slice(1))).toThrow();
  const changed = structuredClone(agents);
  changed[0].slug = '../escape';
  expect(() => parseDirectory(changed)).toThrow();
});
test('public HTTP remains accepted and FTP is rejected', () => {
  const data = structuredClone(agents);
  data[0].official = 'http://example.test/';
  expect(parseDirectory(data)[0].official).toBe('http://example.test/');
  data[0].official = 'ftp://example.test/';
  expect(() => parseDirectory(data)).toThrow();
});
test('rejects blank content and active URL schemes', () => {
  const changed = structuredClone(agents);
  changed[0].name = ' ';
  expect(() => parseDirectory(changed)).toThrow();
  changed[0].name = 'Team';
  changed[0].official = 'javascript:alert(1)';
  expect(() => parseDirectory(changed)).toThrow();
});
test('rating provenance required and scope retained', () => {
  const parsed = parseDirectory(agents);
  expect(Object.keys(parseRatingSnapshot(ratings, parsed))).toHaveLength(4);
  const changed = structuredClone(ratings);
  Reflect.deleteProperty(changed['lippincott-team'], 'count');
  expect(() => parseRatingSnapshot(changed, parsed)).toThrow();
  expect(() =>
    parseRatingSnapshot(
      { ...ratings, unknown: ratings['lippincott-team'] },
      parsed,
    ),
  ).toThrow();
});
test('rejects aggregate source mismatches and future/invalid dates', () => {
  const parsed = parseDirectory(agents);
  const changed = structuredClone(ratings);
  changed['lippincott-team'].source = 'https://example.test/';
  expect(() => parseRatingSnapshot(changed, parsed)).toThrow();
  changed['lippincott-team'].source = ratings['lippincott-team'].source;
  for (const checked of ['2099-01-01', '2026-02-30']) {
    changed['lippincott-team'].checked = checked;
    expect(() => parseRatingSnapshot(changed, parsed)).toThrow();
  }
});
test('JSON-LD cannot close its data script and preserves source text', () => {
  const value = { name: '</script><script>alert(1)</script>' };
  const encoded = jsonLd(value);
  expect(encoded).not.toContain('<');
  expect(JSON.parse(encoded)).toEqual(value);
});
