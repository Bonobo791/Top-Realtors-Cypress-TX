import { afterEach, expect, test } from 'vitest';
import {
  mkdtempSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectMarkup } from '../scripts/lib/inspect-markup.mjs';
const fixtures: string[] = [];
function fixture(html: string) {
  const dir = mkdtempSync(join(tmpdir(), 'astro-links-'));
  fixtures.push(dir);
  mkdirSync(join(dir, 'dist'));
  writeFileSync(join(dir, 'dist/index.html'), html);
  return { root: join(dir, 'dist'), file: join(dir, 'dist/index.html'), dir };
}
afterEach(() =>
  fixtures
    .splice(0)
    .forEach((dir) => rmSync(dir, { recursive: true, force: true })),
);
test.each([
  'mailto:test@example.com',
  'tel:+17135550100',
  'data:image/png;base64,abcd',
])('resource srcset rejects non-image protocol %s', (candidate) => {
  const { root, file } = fixture(`<img srcset="${candidate} 660w" alt=""/>`);
  expect(inspectMarkup(root, file).failures.join(' ')).toContain(
    'Prohibited URL scheme',
  );
});
test('checks same-page, absolute and relative local references', () => {
  const { root, file } = fixture(
    '<main id="main"><a href="#main">Main</a><a href="?x=1#main">Again</a><img src="/photo.jpg" alt=""/><a href="other.html">Other</a></main>',
  );
  writeFileSync(join(root, 'photo.jpg'), 'image');
  writeFileSync(join(root, 'other.html'), 'other');
  expect(inspectMarkup(root, file)).toMatchObject({
    references: 4,
    failures: [],
  });
});
test('decoded traversal is rejected before existence checks', () => {
  const { root, file, dir } = fixture(
    '<a href="/%2e%2e/outside.html">Escape</a>',
  );
  writeFileSync(join(dir, 'outside.html'), 'outside');
  expect(inspectMarkup(root, file).failures.join(' ')).toContain(
    'outside build',
  );
});
test('symlink local reference cannot escape the build', () => {
  const { root, file, dir } = fixture('<a href="escape.html">Escape</a>');
  writeFileSync(join(dir, 'outside.html'), 'outside');
  symlinkSync(join(dir, 'outside.html'), join(root, 'escape.html'));
  expect(inspectMarkup(root, file).failures.join(' ')).toContain(
    'outside build',
  );
});
test('tag casing and active URL schemes cannot bypass policy', () => {
  const { root, file } = fixture(
    '<ScRiPt>alert(1)</ScRiPt><IFRAME src="about:blank"></IFRAME><a href="javascript:alert(1)">Click</a>',
  );
  expect(inspectMarkup(root, file).failures.length).toBeGreaterThanOrEqual(3);
});
test('allows data JSON-LD, rejects malformed or externally loaded data scripts', () => {
  const valid = fixture(
    '<script type="application/ld+json">{"@type":"Person"}</script>',
  );
  expect(inspectMarkup(valid.root, valid.file).failures).toEqual([]);
  const invalid = fixture(
    '<script type="application/ld+json">{broken}</script><script type="application/ld+json" src="/x.js"></script>',
  );
  expect(
    inspectMarkup(invalid.root, invalid.file).failures.length,
  ).toBeGreaterThanOrEqual(2);
});
