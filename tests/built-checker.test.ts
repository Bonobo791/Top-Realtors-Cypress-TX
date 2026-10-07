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
  '<img src="https://remote.example/photo.jpg" alt=""/>',
  '<img srcset="//remote.example/photo.jpg 2x" alt=""/>',
  '<link rel="stylesheet" href="https://remote.example/site.css"/>',
  '<video poster="https://remote.example/poster.jpg"></video>',
])('rejects remote resources forbidden by the served CSP: %s', (html) => {
  const { root, file } = fixture(html);
  expect(inspectMarkup(root, file).failures).not.toEqual([]);
});
test('remote navigation, canonical metadata and inert inline images remain allowed', () => {
  const { root, file } = fixture(
    '<a href="https://official.example/">Official</a><a href="mailto:agent@example.com">Email</a><a href="tel:+17135550100">Call</a><link rel="canonical" href="https://toprealtorscypresstx.com/"><img src="data:image/png;base64,abcd" alt=""/>',
  );
  expect(inspectMarkup(root, file).failures).toEqual([]);
});
test.each([
  '<body onload="alert(1)"><main>Page</main></body>',
  '<button onclick="alert(1)">Click</button>',
  '<img OnErRoR="alert(1)" alt=""/>',
  '<svg onload="alert(1)"></svg>',
])('rejects inline event handler attributes: %s', (html) => {
  const { root, file } = fixture(html);
  expect(inspectMarkup(root, file).failures.join(' ')).toContain(
    'Inline event handler',
  );
});
test('escaped event-handler text and data attributes remain inert', () => {
  const { root, file } = fixture(
    '<p data-onclick="text">&lt;img onerror="alert(1)"&gt;</p><script type="application/ld+json">{"name":"onload=example"}</script>',
  );
  expect(inspectMarkup(root, file)).toEqual({ references: 0, failures: [] });
});
test.each([
  '<img src="https://cdn.example/photo.jpg" alt=""/>',
  '<img srcset="/photo.jpg 1x, https://cdn.example/photo.jpg 2x" alt=""/>',
  '<link rel="stylesheet" href="http://cdn.example/site.css"/>',
  '<link rel="preload" as="style" href="//cdn.example/site.css"/>',
  '<video src="https://cdn.example/clip.mp4"></video>',
  '<video poster="//cdn.example/poster.jpg"></video>',
  '<audio><source src="https://cdn.example/audio.mp3"/></audio>',
  '<picture><source srcset="https://cdn.example/photo.jpg 2x"/></picture>',
  '<svg><use href="https://cdn.example/icons.svg#logo"/></svg>',
  '<img src="https://toprealtorscypresstx.com/photo.jpg" alt=""/>',
])('rejects network resources: %s', (html) => {
  const { root, file } = fixture(html);
  writeFileSync(join(root, 'photo.jpg'), 'image');
  expect(inspectMarkup(root, file).failures.join(' ')).toContain(
    'Prohibited URL scheme',
  );
});
test('preserves external navigation, canonical metadata and permitted local/data assets', () => {
  const { root, file } = fixture(
    '<a href="https://example.com">Source</a><a href="http://example.com">Source</a><a href="//example.com">Source</a><a href="mailto:test@example.com">Email</a><a href="tel:+17135550100">Call</a><link rel="canonical" href="https://toprealtorscypresstx.com/"/><meta property="og:image" content="https://toprealtorscypresstx.com/photo.jpg"/><link rel="stylesheet" href="/site.css"/><img src="/photo.jpg" alt=""/><img src="data:image/png;base64,abcd" alt=""/><link rel="icon" href="data:image/svg+xml,icon"/>',
  );
  writeFileSync(join(root, 'site.css'), 'body{}');
  writeFileSync(join(root, 'photo.jpg'), 'image');
  expect(inspectMarkup(root, file)).toEqual({ references: 2, failures: [] });
});
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
test('srcset preserves commas inside URLs and checks every candidate', () => {
  const { root, file } = fixture(
    '<img srcset="/photo,wide.jpg 660w, other.jpg 1320w" alt=""/>',
  );
  writeFileSync(join(root, 'photo,wide.jpg'), 'image');
  writeFileSync(join(root, 'other.jpg'), 'image');
  expect(inspectMarkup(root, file)).toEqual({ references: 2, failures: [] });
});
test('srcset URL without a descriptor can precede the next candidate', () => {
  const { root, file } = fixture(
    '<img srcset="/photo.jpg, other.jpg 2x, missing.jpg 3x" alt=""/>',
  );
  writeFileSync(join(root, 'photo.jpg'), 'image');
  writeFileSync(join(root, 'other.jpg'), 'image');
  expect(inspectMarkup(root, file)).toEqual({
    references: 3,
    failures: ['index.html: Missing local reference missing.jpg'],
  });
});
test('a symlinked workspace ancestor accepts real local references', () => {
  const { root, dir } = fixture(
    '<main id="main"><a href="#main">Main</a><a href="?x=1#main">Again</a><img src="/photo.jpg" alt=""/><a href="other.html">Other</a><a href="folder/">Folder</a></main>',
  );
  writeFileSync(join(root, 'photo.jpg'), 'image');
  writeFileSync(join(root, 'other.html'), 'other');
  mkdirSync(join(root, 'folder'));
  writeFileSync(join(root, 'folder/index.html'), 'folder');
  symlinkSync(dir, join(dir, 'alias'), 'dir');
  const alias = join(dir, 'alias/dist');
  expect(inspectMarkup(alias, join(alias, 'index.html'))).toEqual({
    references: 5,
    failures: [],
  });
});
test('symlinked workspace ancestors still reject traversal and file/index escapes', () => {
  const { root, dir } = fixture(
    '<a href="/%2e%2e/outside.html">Traversal</a><a href="escape.html">File</a><a href="folder/">Index</a>',
  );
  writeFileSync(join(dir, 'outside.html'), 'outside');
  symlinkSync(join(dir, 'outside.html'), join(root, 'escape.html'));
  mkdirSync(join(root, 'folder'));
  symlinkSync(join(dir, 'outside.html'), join(root, 'folder/index.html'));
  symlinkSync(dir, join(dir, 'alias'), 'dir');
  const alias = join(dir, 'alias/dist');
  const result = inspectMarkup(alias, join(alias, 'index.html'));
  expect(result.references).toBe(3);
  expect(result.failures).toEqual(
    Array(3).fill('index.html: Reference outside build'),
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
