import { expect, test, type Page, type Locator } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import agentData from '../../src/content/realtors.json' with { type: 'json' };
import ratings from '../../src/content/ratings.json' with { type: 'json' };
import { parseDirectory } from '../../src/lib/contracts';
const agents = parseDirectory(agentData).filter((agent) => !agent.draft);
const paths = [
  '/',
  '/terms.html',
  '/privacy.html',
  '/404.html',
  ...agents.map((a) => '/realtors/' + a.slug + '.html'),
];
async function checkRating(
  panel: Locator,
  rating: (typeof ratings)['lippincott-team'] | undefined,
) {
  await expect(panel.locator('.rating-score')).toHaveCount(rating ? 1 : 0);
  if (!rating) return;
  await expect(panel.locator('.rating-score')).toHaveText(
    `${rating.value} / 5`,
  );
  const body = await panel.innerText();
  expect(body.toLowerCase()).toContain(rating.subject.toLowerCase());
  await expect(panel.locator('.rating-score + span')).toHaveText(
    `${rating.count} ${rating.count_type}`,
  );
  expect(body).toContain(rating.scope);
  await expect(panel.locator('a')).toHaveText(rating.platform);
  await expect(panel.locator('a')).toHaveAttribute('href', rating.source);
  await expect(panel.locator('time')).toHaveAttribute(
    'datetime',
    rating.checked,
  );
  await expect(panel.locator('time')).toHaveText(rating.checked);
}
async function screenshot(page: Page, name: string) {
  mkdirSync('reports/browser', { recursive: true });
  const session = await page.context().newCDPSession(page);
  const layout = await session.send('Page.getLayoutMetrics');
  const image = await session.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: {
      x: 0,
      y: 0,
      width: layout.cssContentSize.width,
      height: layout.cssContentSize.height,
      scale: 1,
    },
  });
  writeFileSync(
    'reports/browser/' + name + '.png',
    Buffer.from(image.data, 'base64'),
  );
  await session.detach();
}
for (const width of [1440, 375, 320])
  for (const path of paths)
    test(`${width}px no-JS ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const failures: string[] = [];
      const outside: string[] = [];
      page.on('pageerror', (error) => failures.push(error.message));
      page.on('requestfailed', (request) => failures.push(request.url()));
      page.on('request', (request) => {
        if (
          new URL(request.url()).origin !==
          new URL(test.info().project.use.baseURL as string).origin
        )
          outside.push(request.url());
      });
      const response = await page.goto(path, { waitUntil: 'networkidle' });
      // Framework preview serves the explicit 404 file as 200; Nginx must serve it as 404.
      expect(response?.status()).toBe(
        path === '/404.html' && process.env.E2E_BASE_URL ? 404 : 200,
      );
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('main')).toHaveCount(1);
      await expect(
        page.locator('form,script:not([type="application/ld+json"])'),
      ).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
        'href',
        'https://realtorscypresstx.com' + path,
      );
      if (path === '/') {
        for (const agent of agents)
          await checkRating(
            page.locator(
              `.agent-row[data-profile="${agent.slug}"] .rating-panel`,
            ),
            ratings[agent.slug as keyof typeof ratings],
          );
        await expect(page.locator('.agent-row').first()).toHaveAttribute(
          'data-profile',
          'lippincott-team',
        );
        await expect(page.locator('.feature-card')).toContainText(
          'Our #1 choice. Led by Amy Lippincott. Buying and selling services across Northwest Houston, including Cypress, Tomball, and Katy.',
        );
        await expect(page.locator('.feature-card .note')).toContainText(
          'Paid placement · eXp Realty LLC.',
        );
        const badge = page
          .locator('.agent-row')
          .first()
          .locator('.sponsored-badge');
        await expect(badge).toBeVisible();
        expect(
          await badge.evaluate((el) =>
            parseFloat(getComputedStyle(el).fontSize),
          ),
        ).toBeGreaterThanOrEqual(14);
        const hero = await page.locator('.hero-photo img').evaluate((el) => {
          const image = el as HTMLImageElement;
          return {
            decoded: image.complete && image.naturalWidth > 0,
            src: image.currentSrc,
          };
        });
        expect(hero.decoded).toBe(true);
        expect(hero.src).toContain(width === 1440 ? '1320.jpg' : '660.jpg');
        await page.keyboard.press('Tab');
        await expect(page.locator('.skip')).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(/#main$/);
        const directory = page.locator('.hero-actions a[href="#directory"]');
        await expect(directory).toBeVisible();
        // Request instant scrolling, then wait for the target to stop moving.
        await directory.evaluate((el) =>
          el.scrollIntoView({ behavior: 'instant', block: 'center' }),
        );
        let previousY: number | undefined;
        await expect
          .poll(
            async () => {
              const y = (await directory.boundingBox())?.y;
              const stable = y !== undefined && y === previousY;
              previousY = y;
              return stable;
            },
            { intervals: [100] },
          )
          .toBe(true);
        // Pointer actions avoid the animation-frame stability wait in no-JS documents.
        await directory.click({ force: true });
        await expect(page).toHaveURL(/#directory$/);
        const faq = page.locator('#faq summary').first();
        await expect(faq).toBeVisible();
        await faq.evaluate((el) =>
          el.scrollIntoView({ behavior: 'instant', block: 'center' }),
        );
        await faq.click({ force: true });
        await expect(page.locator('#faq details').first()).toHaveAttribute(
          'open',
          '',
        );
        await screenshot(page, 'home-' + width);
      }
      if (path.includes('/realtors/')) {
        const a = agents.find((a) => path.endsWith('/' + a.slug + '.html'))!;
        await expect(page.locator('.fact-list li')).toHaveCount(a.facts.length);
        await expect(page.locator('.sources ol li')).toHaveCount(
          a.sources.length,
        );
        const r = ratings[a.slug as keyof typeof ratings];
        await checkRating(page.locator('.rating-panel'), r);
        if (a.slug === 'lippincott-team') {
          await expect(page.locator('.sponsored-badge')).toHaveCount(0);
          await expect(page.locator('.notice')).toContainText(
            'Paid placement.',
          );
          await screenshot(page, 'profile-' + width);
        }
      }
      expect(failures).toEqual([]);
      expect(outside).toEqual([]);
    });
test('directory navigation and genuine unknown-page return work without JS', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .locator('.agent-row[data-profile="lippincott-team"] a.btn')
    .click();
  await expect(page.locator('h1')).toHaveText('The Lippincott Team');
  const response = await page.goto('/unknown-route');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('That page isn’t in the guide.');
  await page.locator('main a').click();
  expect(new URL(page.url()).pathname).toBe('/');
});
for (const path of [
  '/',
  '/realtors/lippincott-team.html',
  '/terms.html',
  '/privacy.html',
  '/unknown-route',
])
  test('axe QA-only instrumentation ' + path, async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled: true,
      bypassCSP: true,
      viewport: { width: 375, height: 900 },
    });
    try {
      const page = await context.newPage();
      await page.goto(path);
      await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
      const violations = await page.evaluate(async () => {
        const axe = (
          window as unknown as {
            axe: {
              run: (
                document: Document,
                options: unknown,
              ) => Promise<{ violations: unknown[] }>;
            };
          }
        ).axe;
        return (
          await axe.run(document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
          })
        ).violations;
      });
      expect(violations).toEqual([]);
    } finally {
      await context.close();
    }
  });
