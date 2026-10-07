import { afterAll, beforeAll, expect, test } from 'vitest';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  symlinkSync,
  rmSync,
  existsSync,
  mkdirSync,
  readdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { load } from 'cheerio';
let root: string;
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'cypress-astro-content-'));
  mkdirSync(join(root, 'tests'));
  for (const item of [
    'src',
    'public',
    'scripts',
    'astro.config.mjs',
    'tsconfig.json',
    'package.json',
    'playwright.config.ts',
    'tests/e2e',
  ])
    cpSync(resolve(item), join(root, item), { recursive: true });
  symlinkSync(resolve('node_modules'), join(root, 'node_modules'), 'dir');
});
afterAll(() => {
  if (root) rmSync(root, { recursive: true, force: true });
});
function build() {
  return spawnSync('npm', ['run', 'build'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 30000,
    env: {
      ...process.env,
      BUILD_COMMIT: 'local',
      ASTRO_TELEMETRY_DISABLED: '1',
    },
  });
}
test('real content edits, safe text rendering, rename cleanup and draft exclusion reach Astro output', () => {
  const file = join(root, 'src/content/realtors.json');
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const target = data.find(
    (a: { slug: string }) => a.slug === 'michele-harmon',
  );
  target.intro = 'Synthetic fixture: <script>alert(1)</script> & "quoted"';
  target.official_label = 'Visit "quoted" <img src=x onerror=alert(1)>';
  let result = build();
  expect(result.status, result.stdout + result.stderr).toBe(0);
  let html = readFileSync(
    join(root, 'dist/realtors/michele-harmon.html'),
    'utf8',
  );
  // First build uses unchanged source; now publish the synthetic edit into this isolated fixture.
  writeFileSync(file, JSON.stringify(data));
  result = build();
  expect(result.status, result.stdout + result.stderr).toBe(0);
  html = readFileSync(join(root, 'dist/realtors/michele-harmon.html'), 'utf8');
  let $ = load(html);
  expect($('.lede').text()).toBe(target.intro);
  expect(
    $('script:not([type="application/ld+json"]),img[onerror]'),
  ).toHaveLength(0);
  target.slug = 'michele-harmon-renamed';
  writeFileSync(file, JSON.stringify(data));
  result = build();
  expect(result.status, result.stdout + result.stderr).toBe(0);
  expect(existsSync(join(root, 'dist/realtors/michele-harmon.html'))).toBe(
    false,
  );
  expect(
    existsSync(join(root, 'dist/realtors/michele-harmon-renamed.html')),
  ).toBe(true);
  target.draft = true;
  writeFileSync(file, JSON.stringify(data));
  result = build();
  expect(result.status, result.stdout + result.stderr).toBe(0);
  expect(
    existsSync(join(root, 'dist/realtors/michele-harmon-renamed.html')),
  ).toBe(false);
  $ = load(readFileSync(join(root, 'dist/index.html'), 'utf8'));
  expect($('.agent-row[data-profile="michele-harmon-renamed"]')).toHaveLength(
    0,
  );
  expect(readFileSync(join(root, 'dist/sitemap.xml'), 'utf8')).not.toContain(
    'michele-harmon-renamed',
  );
}, 30000);
test('Astro rejects a symlinked output before deleting unrelated files', () => {
  const outside = join(root, 'outside-build');
  mkdirSync(outside);
  const sentinel = join(outside, 'outside-sentinel.txt');
  writeFileSync(sentinel, 'unrelated file');
  rmSync(join(root, 'dist'), { recursive: true, force: true });
  symlinkSync(outside, join(root, 'dist'), 'dir');
  try {
    const result = build();
    expect(result.status).not.toBe(0);
    expect(existsSync(sentinel), 'Unrelated output target survives').toBe(true);
    expect(existsSync(join(outside, 'assets'))).toBe(false);
  } finally {
    rmSync(join(root, 'dist'), { force: true });
  }
}, 30000);
test('invalid content fails the actual build visibly', () => {
  const file = join(root, 'src/content/realtors.json');
  const data = JSON.parse(readFileSync(file, 'utf8'));
  data[0].facts[0].source = -1;
  writeFileSync(file, JSON.stringify(data));
  const result = build();
  expect(result.status).not.toBe(0);
  expect(result.stdout + result.stderr).toContain('source');
}, 30000);
test('restoring tracked content recovers the complete static build', () => {
  cpSync(
    resolve('src/content/realtors.json'),
    join(root, 'src/content/realtors.json'),
  );
  const result = build();
  expect(result.status, result.stdout + result.stderr).toBe(0);
  const $ = load(readFileSync(join(root, 'dist/index.html'), 'utf8'));
  expect($('.agent-row')).toHaveLength(7);
  expect(existsSync(join(root, 'dist/realtors/michele-harmon.html'))).toBe(
    true,
  );
  expect(
    existsSync(join(root, 'dist/realtors/michele-harmon-renamed.html')),
  ).toBe(false);
}, 30000);
test('actual output checker rejects corrupt rating scores, counts and platform labels on home and profile', () => {
  cpSync(
    resolve('src/content/realtors.json'),
    join(root, 'src/content/realtors.json'),
  );
  const result = build();
  expect(result.status, result.stdout + result.stderr).toBe(0);
  const statuses = [];
  for (const route of ['index.html', 'realtors/lippincott-team.html']) {
    const file = join(root, 'dist', route);
    const original = readFileSync(file, 'utf8');
    for (const [from, to] of [
      ['4.92 / 5', '0.12 / 5'],
      ['HAR Client Experience Rating', 'Other Platform'],
      ['688 completed surveys', '1688 completed surveys'],
      ['688 completed surveys', '6880 completed surveys'],
    ]) {
      expect(original).toContain(from);
      writeFileSync(file, original.replace(from, to));
      const checked = spawnSync('node', ['scripts/check-built.mjs'], {
        cwd: root,
        encoding: 'utf8',
      });
      statuses.push({ route, fault: to, rejected: checked.status !== 0 });
      writeFileSync(file, original);
    }
  }
  expect(statuses).toEqual(
    statuses.map((item) => ({ ...item, rejected: true })),
  );
}, 30000);
test('browser test inventory omits a draft profile and retains published routes', () => {
  const file = join(root, 'src/content/realtors.json');
  const original = readFileSync(file, 'utf8');
  const data = JSON.parse(original);
  data.find(
    (agent: { slug: string }) => agent.slug === 'michele-harmon',
  ).draft = true;
  writeFileSync(file, JSON.stringify(data));
  try {
    const listed = spawnSync(
      resolve('node_modules/.bin/playwright'),
      ['test', '--list', '--reporter=json'],
      {
        cwd: root,
        encoding: 'utf8',
        timeout: 30000,
      },
    );
    expect(listed.status, listed.stdout + listed.stderr).toBe(0);
    const titles: string[] = JSON.parse(listed.stdout).suites.flatMap(
      (suite: { specs: { title: string }[] }) =>
        suite.specs.map((spec) => spec.title),
    );
    expect(
      titles.filter((title) => title.includes('/realtors/michele-harmon.html')),
    ).toEqual([]);
    expect(titles).toHaveLength(36);
    for (const width of [1440, 375, 320]) {
      expect(titles).toContain(`${width}px no-JS /`);
      expect(titles).toContain(
        `${width}px no-JS /realtors/lippincott-team.html`,
      );
    }
  } finally {
    writeFileSync(file, original);
  }
}, 30000);
test('actual checker rejects duplicate sitemap entries and symlinked required pages', () => {
  const result = build();
  expect(result.status, result.stdout + result.stderr).toBe(0);
  const check = () =>
    spawnSync('node', ['scripts/check-built.mjs'], {
      cwd: root,
      encoding: 'utf8',
      timeout: 10000,
    });
  const sitemapFile = join(root, 'dist/sitemap.xml');
  const sitemap = readFileSync(sitemapFile, 'utf8');
  const $ = load(sitemap, { xml: true });
  writeFileSync(
    sitemapFile,
    sitemap.replace(
      '</urlset>',
      '<url><loc>' + $('loc').first().text() + '</loc></url></urlset>',
    ),
  );
  const duplicate = check();
  writeFileSync(sitemapFile, sitemap);
  const page = join(root, 'dist/404.html');
  const html = readFileSync(page, 'utf8');
  const outside = join(root, 'outside-404.html');
  const linkedHtml = html.replace('href="#main"', 'href="/"');
  expect(linkedHtml).not.toBe(html);
  writeFileSync(outside, linkedHtml);
  rmSync(page);
  symlinkSync(outside, page);
  let linked;
  try {
    linked = check();
  } finally {
    rmSync(page);
    writeFileSync(page, html);
    rmSync(outside);
  }
  const profileDir = join(root, 'dist/realtors');
  const outsideProfiles = join(root, 'outside-required-profiles');
  cpSync(profileDir, outsideProfiles, { recursive: true });
  const profileCopies = new Map(
    readdirSync(outsideProfiles).map((name) => [
      name,
      readFileSync(join(outsideProfiles, name), 'utf8'),
    ]),
  );
  for (const [name, markup] of profileCopies)
    writeFileSync(
      join(outsideProfiles, name),
      markup
        .replace(/href="#[^"]*"/g, 'href="/"')
        .replaceAll(
          'href="/realtors/',
          'href="https://realtorscypresstx.com/realtors/',
        ),
    );
  const homeFile = join(root, 'dist/index.html');
  const home = readFileSync(homeFile, 'utf8');
  writeFileSync(
    homeFile,
    home.replaceAll(
      'href="/realtors/',
      'href="https://realtorscypresstx.com/realtors/',
    ),
  );
  rmSync(profileDir, { recursive: true });
  symlinkSync(outsideProfiles, profileDir, 'dir');
  let linkedParent;
  try {
    linkedParent = check();
  } finally {
    rmSync(profileDir);
    for (const [name, markup] of profileCopies)
      writeFileSync(join(outsideProfiles, name), markup);
    cpSync(outsideProfiles, profileDir, { recursive: true });
    rmSync(outsideProfiles, { recursive: true });
    writeFileSync(homeFile, home);
  }
  expect({
    duplicateRejected: duplicate.status !== 0,
    symlinkRejected: linked.status !== 0,
    parentSymlinkRejected: linkedParent.status !== 0,
  }).toEqual({
    duplicateRejected: true,
    symlinkRejected: true,
    parentSymlinkRejected: true,
  });
  const restored = check();
  expect(restored.status, restored.stdout + restored.stderr).toBe(0);
}, 30000);
test('actual indexing-enabled build emits index metadata while404 remains noindex', () => {
  const file = join(root, 'src/content/site.json');
  const original = readFileSync(file, 'utf8');
  writeFileSync(
    file,
    JSON.stringify({ ...JSON.parse(original), indexing: true }),
  );
  try {
    const result = build();
    expect(result.status, result.stdout + result.stderr).toBe(0);
    for (const route of ['index.html', 'realtors/kevan-pewitt.html']) {
      const $ = load(readFileSync(join(root, 'dist', route), 'utf8'));
      expect($('meta[name=robots]').attr('content')).toBe('index, follow');
    }
    const $ = load(readFileSync(join(root, 'dist/404.html'), 'utf8'));
    expect($('meta[name=robots]').attr('content')).toBe('noindex, follow');
  } finally {
    writeFileSync(file, original);
  }
}, 30000);
