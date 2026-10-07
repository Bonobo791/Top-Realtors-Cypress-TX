import { afterAll, beforeAll, expect, test } from 'vitest';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { load } from 'cheerio';

let root: string;
function checkOutput() {
  return spawnSync('node', ['scripts/check-built.mjs'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 10000,
  });
}
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'cypress-output-audit-'));
  for (const item of [
    'src',
    'public',
    'scripts',
    'astro.config.mjs',
    'tsconfig.json',
    'package.json',
  ])
    cpSync(resolve(item), join(root, item), { recursive: true });
  symlinkSync(resolve('node_modules'), join(root, 'node_modules'), 'dir');
  const built = spawnSync('npm', ['run', 'build'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 30000,
    env: {
      ...process.env,
      BUILD_COMMIT: 'local',
      ASTRO_TELEMETRY_DISABLED: '1',
    },
  });
  expect(built.status, built.stdout + built.stderr).toBe(0);
}, 30000);
afterAll(() => {
  if (root) rmSync(root, { recursive: true, force: true });
});

test('homepage JSON-LD declares the Schema.org unordered ItemList value', () => {
  const $ = load(readFileSync(join(root, 'dist/index.html'), 'utf8'));
  const schema = JSON.parse($('script[type="application/ld+json"]').text());
  expect(schema.itemListOrder).toBe('https://schema.org/ItemListUnordered');
});

test('actual output checker rejects a duplicate sitemap location', () => {
  const file = join(root, 'dist/sitemap.xml');
  const original = readFileSync(file, 'utf8');
  const $ = load(original, { xml: true });
  $('urlset').append($('url').first().clone());
  writeFileSync(file, $.xml());
  try {
    const checked = checkOutput();
    expect(checked.status, checked.stdout + checked.stderr).toBe(1);
    expect(checked.stderr).toContain('AssertionError');
  } finally {
    writeFileSync(file, original);
  }
  const restored = checkOutput();
  expect(restored.status, restored.stdout + restored.stderr).toBe(0);
});

// Remove links that would independently expose the escape so these regressions
// prove that every required output itself is checked, even when it is unlinked.
function withoutLocalReferences(run: () => void) {
  const dist = join(root, 'dist');
  const files = [
    ...readdirSync(dist).filter((name) => name.endsWith('.html')),
    ...readdirSync(join(dist, 'realtors')).map((name) => 'realtors/' + name),
  ];
  const originals = files.map((name) => ({
    file: join(dist, name),
    html: readFileSync(join(dist, name), 'utf8'),
  }));
  for (const { file, html } of originals) {
    const $ = load(html);
    $('*').each((_, el) => {
      const node = $(el);
      for (const attribute of ['href', 'src', 'srcset', 'poster']) {
        const value = node.attr(attribute);
        if (value !== undefined && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value))
          node.removeAttr(attribute);
      }
    });
    writeFileSync(file, $.html());
  }
  try {
    const control = checkOutput();
    expect(control.status, control.stdout + control.stderr).toBe(0);
    run();
  } finally {
    for (const { file, html } of originals) writeFileSync(file, html);
  }
  const restored = checkOutput();
  expect(restored.status, restored.stdout + restored.stderr).toBe(0);
}

test.each(['404.html', 'realtors/michele-harmon.html'])(
  'actual output checker rejects an escaping required-file symlink: %s',
  (route) => {
    withoutLocalReferences(() => {
      const file = join(root, 'dist', route);
      const outside = join(root, 'outside-page.html');
      renameSync(file, outside);
      symlinkSync(outside, file);
      try {
        const checked = checkOutput();
        expect(checked.status, checked.stdout + checked.stderr).toBe(1);
        expect(checked.stderr).toContain('Required regular public file');
      } finally {
        rmSync(file);
        renameSync(outside, file);
      }
    });
  },
);
test('actual output checker rejects a required page through an escaping ancestor symlink', () => {
  withoutLocalReferences(() => {
    const directory = join(root, 'dist/realtors');
    const outside = join(root, 'outside-profiles');
    renameSync(directory, outside);
    symlinkSync(outside, directory, 'dir');
    try {
      const checked = checkOutput();
      expect(checked.status, checked.stdout + checked.stderr).toBe(1);
      expect(checked.stderr).toContain(
        'Required public path contains a symlink',
      );
    } finally {
      rmSync(directory);
      renameSync(outside, directory);
    }
  });
});
