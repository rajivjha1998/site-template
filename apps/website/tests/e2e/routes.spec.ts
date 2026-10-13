import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Every page in the built sitemap, plus the 404 page.
const dist = fileURLToPath(new URL('../../dist/', import.meta.url));
const sitemap = readFileSync(`${dist}sitemap-0.xml`, 'utf8');
const routes = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]!);
const site = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../../../site.json', import.meta.url)), 'utf8'),
);
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('the sitemap lists the site', () => {
  expect(routes.length).toBeGreaterThan(0);
  expect(routes).toContain('/');
});

for (const route of [...routes, '/404.html']) {
  test(`${route} renders cleanly`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);

    // Exactly one H1, a title, a description and a canonical URL.
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page).toHaveTitle(new RegExp(escape(site.brand.name)));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{20,}/);
    if (route !== '/404.html') {
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        new RegExp(`${route}$`),
      );
    }

    // Structured data parses and always describes the organisation.
    const ld = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
    );
    expect(ld['@graph'].map((n: { '@type': string }) => n['@type'])).toContain('Organization');

    // The page never scrolls sideways.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    // No serious or critical accessibility violations.
    const { violations } = await new AxeBuilder({ page }).analyze();
    const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(
      serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    ).toEqual([]);
  });
}
