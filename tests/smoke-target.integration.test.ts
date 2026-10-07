import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import agents from '../src/content/realtors.json';
import site from '../src/content/site.json';

const fixtures: string[] = [];
afterEach(() =>
  fixtures
    .splice(0)
    .forEach((root) => rmSync(root, { recursive: true, force: true })),
);

function invoke(target?: string) {
  const root = mkdtempSync(join(tmpdir(), 'cypress-smoke-target-'));
  fixtures.push(root);
  mkdirSync(join(root, 'src/content'), { recursive: true });
  writeFileSync(
    join(root, 'src/content/realtors.json'),
    JSON.stringify(agents),
  );
  writeFileSync(join(root, 'src/content/site.json'), JSON.stringify(site));
  const hook = join(root, 'fetch-hook.mjs');
  // Observe the actual CLI's fetch boundary without making any network request.
  writeFileSync(
    hook,
    `globalThis.fetch = async (url) => {
    console.log('FETCH_REACHED ' + url);
    return new Response('', {status: 503});
  };`,
  );
  return spawnSync(
    process.execPath,
    [
      '--import',
      hook,
      resolve('scripts/container-smoke.mjs'),
      ...(target === undefined ? [] : [target]),
    ],
    {
      cwd: root,
      encoding: 'utf8',
      timeout: 5000,
    },
  );
}

test.each([
  'http://169.254.169.254',
  'http://10.0.0.1',
  'http://192.168.1.1',
  'http://remote.example',
  'http://localhost:8080',
  'http://127.0.0.1.remote.example:8080',
  'http://127.0.0.1@169.254.169.254',
  'http://user:pass@127.0.0.1:8080',
  'https://127.0.0.1:8080',
  'http://127.0.0.1:8080/private',
  'http://127.0.0.1:8080/?target=private',
  'http://127.0.0.1:8080/#private',
])('rejects unapproved CLI target before fetch: %s', (target) => {
  const result = invoke(target);
  expect(result.status).not.toBe(0);
  expect(result.stdout).not.toContain('FETCH_REACHED');
  expect(result.stderr).toContain('HTTP loopback origin');
});

test.each([
  ['http://127.0.0.1:8082', 'http://127.0.0.1:8082/healthz'],
  ['http://127.0.0.1:49152/', 'http://127.0.0.1:49152/healthz'],
  ['http://[::1]:8082', 'http://[::1]:8082/healthz'],
  [undefined, 'http://127.0.0.1:8080/healthz'],
])('preserves approved local origin %s', (target, expected) => {
  const result = invoke(target);
  expect(result.stdout).toContain('FETCH_REACHED ' + expected);
  expect(result.stderr).toContain('Serving readiness failed');
});
