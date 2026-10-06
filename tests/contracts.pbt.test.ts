import { expect, test } from 'vitest';
import fc from 'fast-check';
import site from '../src/content/site.json';
import agents from '../src/content/realtors.json';
import ratings from '../src/content/ratings.json';
import {
  canonical,
  parseDirectory,
  parseRatingSnapshot,
  parseSite,
  orderProfiles,
} from '../src/lib/contracts';
import { propertyOptions } from './property-options.mjs';
test('PBT alphabetical order honors only a leading The for every fixture permutation', () => {
  const displayNames = [
    'The Apple',
    'The Zebra',
    'A The Zebra',
    'A Tiger',
    'Beta',
  ];
  const collator = new Intl.Collator('en');
  const expected = [...displayNames].sort((a, b) =>
    collator.compare(
      a.startsWith('The ') ? a.slice(4) : a,
      b.startsWith('The ') ? b.slice(4) : b,
    ),
  );
  fc.assert(
    fc.property(
      fc.shuffledSubarray(displayNames, { minLength: 5, maxLength: 5 }),
      (names) => {
        const data = parseDirectory(agents);
        const selected = names.map((name, i) => ({ ...data[i + 1], name }));
        expect(orderProfiles(selected).map((a) => a.name)).toEqual(expected);
      },
    ),
    propertyOptions(),
  );
});

test('PBT exact host and independently specified route grammar', () =>
  fc.assert(
    fc.property(fc.string({ maxLength: 120 }), (path) => {
      const allowed =
        /^\/(?:|terms\.html|privacy\.html|404\.html|realtors\/[a-z0-9]+(?:-[a-z0-9]+)*\.html)$/.test(
          path,
        );
      if (allowed)
        expect(canonical(path)).toBe('https://toprealtorscypresstx.com' + path);
      else expect(() => canonical(path)).toThrow();
    }),
    propertyOptions(),
  ));
test('PBT valid profile paths retain exact route and canonical', () =>
  fc.assert(
    fc.property(
      fc.stringMatching(/^[a-z][a-z0-9]{0,24}(?:-[a-z0-9]{1,12})?$/),
      (slug) => {
        expect(canonical('/realtors/' + slug + '.html')).toBe(
          'https://toprealtorscypresstx.com/realtors/' + slug + '.html',
        );
      },
    ),
    propertyOptions(),
  ));
test('PBT lookalike host cannot alter canonical configuration', () =>
  fc.assert(
    fc.property(fc.stringMatching(/^[a-z]{1,24}$/), (suffix) => {
      expect(() =>
        parseSite({ ...site, origin: site.origin + '.' + suffix }),
      ).toThrow();
    }),
    propertyOptions(),
  ));
test('PBT citations always reject negative and fractional indices', () =>
  fc.assert(
    fc.property(
      fc.oneof(
        fc.integer({ min: -10000, max: -1 }),
        fc.integer({ min: 0, max: 100 }).map((n) => n + 0.5),
      ),
      (source) => {
        const changed = structuredClone(agents);
        changed[0].facts[0].source = source;
        expect(() => parseDirectory(changed)).toThrow();
      },
    ),
    propertyOptions(),
  ));
test('PBT invalid rating counts cannot be published', () =>
  fc.assert(
    fc.property(
      fc.oneof(
        fc.integer({ min: -10000, max: 0 }),
        fc.integer({ min: 1, max: 1000 }).map((n) => n + 0.25),
      ),
      (count) => {
        const changed = structuredClone(ratings);
        changed['lippincott-team'].count = count;
        expect(() =>
          parseRatingSnapshot(changed, parseDirectory(agents)),
        ).toThrow();
      },
    ),
    propertyOptions(),
  ));
test('PBT reorder preserves all identities and sponsored placement', () =>
  fc.assert(
    fc.property(
      fc.shuffledSubarray(agents, { minLength: 7, maxLength: 7 }),
      (data) => {
        const sorted = orderProfiles(parseDirectory(data));
        expect(sorted[0].slug).toBe('lippincott-team');
        expect(new Set(sorted.map((a) => a.slug))).toEqual(
          new Set(agents.map((a) => a.slug)),
        );
      },
    ),
    propertyOptions(),
  ));
