import { expect, test } from 'vitest';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import agents from '../src/content/realtors.json';
import site from '../src/content/site.json';

async function smoke(
  indexing: boolean,
  robots: string | null,
  decoy = false,
  canonical: 'valid' | 'missing' | 'wrong' | 'duplicate' = 'valid',
  stallRoute?: string,
) {
  const root = mkdtempSync(join(tmpdir(), 'cypress-smoke-'));
  mkdirSync(join(root, 'src/content'), { recursive: true });
  writeFileSync(
    join(root, 'src/content/realtors.json'),
    JSON.stringify(agents),
  );
  writeFileSync(
    join(root, 'src/content/site.json'),
    JSON.stringify({ ...site, indexing }),
  );
  const routes = new Set([
    '/',
    '/terms.html',
    '/privacy.html',
    ...agents.map((agent) => '/realtors/' + agent.slug + '.html'),
  ]);
  const assets = new Set([
    '/robots.txt',
    '/sitemap.xml',
    '/favicon.svg',
    '/assets/coles-crossing-morning-1320.jpg',
  ]);
  const server = createServer((request, response) => {
    const route = request.url ?? '/';
    if (route === stallRoute) {
      response.writeHead(200);
      response.write('incomplete body');
      return;
    }
    response.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'no-cache');
    if (route === '/build.json') {
      response.end(
        JSON.stringify({
          framework: 'Astro',
          origin: site.origin,
          commit: 'fixture',
        }),
      );
    } else if (routes.has(route)) {
      const link =
        '<link rel="canonical" href="' +
        site.origin +
        (canonical === 'wrong' ? '/wrong.html' : route) +
        '">';
      response.end(
        '<meta property="og:url" content="' +
          site.origin +
          route +
          '">' +
          (canonical === 'missing' ? '' : link) +
          (canonical === 'duplicate' ? link : '') +
          (robots === null
            ? ''
            : '<meta name="robots" content="' + robots + '">') +
          (decoy ? '<p>noindex appears only in body text</p>' : ''),
      );
    } else if (route === '/healthz' || assets.has(route)) response.end('ready');
    else {
      response.statusCode = 404;
      response.end(
        '<meta name="robots" content="noindex, follow">That page isn’t in the guide.',
      );
    }
  });
  await new Promise<void>((ready) => server.listen(0, '127.0.0.1', ready));
  try {
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('Missing fixture port');
    return await new Promise<{ code: number | null; output: string }>(
      (done, reject) => {
        const child = spawn(
          process.execPath,
          [
            resolve('scripts/container-smoke.mjs'),
            'http://127.0.0.1:' + address.port,
          ],
          {
            cwd: root,
            env: { ...process.env, EXPECTED_COMMIT: 'fixture' },
            timeout: 10000,
          },
        );
        let output = '';
        child.stdout.on('data', (data) => {
          output += data;
        });
        child.stderr.on('data', (data) => {
          output += data;
        });
        child.on('error', reject);
        child.on('close', (code) => done({ code, output }));
      },
    );
  } finally {
    server.closeAllConnections();
    await new Promise<void>((done, reject) =>
      server.close((error) => (error ? reject(error) : done())),
    );
    rmSync(root, { recursive: true, force: true });
  }
}

test.each([false, true])(
  'actual smoke command accepts indexing=%s',
  async (indexing) => {
    const result = await smoke(
      indexing,
      indexing ? 'index, follow' : 'noindex, follow',
    );
    expect(result.code, result.output).toBe(0);
  },
);
test.each([false, true])(
  'actual smoke command rejects wrong robots metadata for indexing=%s despite body text',
  async (indexing) => {
    const result = await smoke(
      indexing,
      indexing ? 'noindex, follow' : 'index, follow',
      true,
    );
    expect(result.code, result.output).not.toBe(0);
  },
);
test('actual smoke command requires robots metadata rather than a body substring', async () => {
  const result = await smoke(false, null, true);
  expect(result.code, result.output).not.toBe(0);
});
test('actual smoke aborts a stalled marker body before the child deadline', async () => {
  const result = await smoke(
    false,
    'noindex, follow',
    false,
    'valid',
    '/build.json',
  );
  expect(result.output).toMatch(/TimeoutError|AbortError/);
  expect(result.code).not.toBeNull();
  expect(result.code).not.toBe(0);
}, 15000);
test.each(['missing', 'wrong', 'duplicate'] as const)(
  'actual smoke rejects %s canonical links despite correct og:url metadata',
  async (canonical) => {
    const result = await smoke(false, 'noindex, follow', false, canonical);
    expect(result.code, result.output).not.toBe(0);
  },
);
