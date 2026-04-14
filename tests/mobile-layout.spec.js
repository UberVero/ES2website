import { test, expect } from '@playwright/test';

/**
 * Mobile layout integrity suite.
 *
 * Guards against the two classes of regressions we care about:
 *   1. Header overflow / CTA clipping on narrow viewports (why the
 *      hamburger exists in the first place).
 *   2. Footer items growing past the viewport as we add more links.
 *
 * Runs against whatever BASE_URL is configured in playwright.config.js
 * (default: https://eldur.studio). Executes on every page that ships
 * the shared nav + footer.
 */
const PAGES = ['/', '/results/', '/resources/'];

for (const path of PAGES) {
  test.describe(`Mobile layout — ${path}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });
    });

    test('no horizontal page overflow', async ({ page }) => {
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      // 1px slop for sub-pixel rounding
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });

    test('nav shows logo, hamburger, and CTA pill — all within viewport', async ({ page }, testInfo) => {
      const viewportWidth = page.viewportSize().width;

      const logo = page.locator('.nav .nav__logo').first();
      const toggle = page.locator('.nav .nav__menu > summary').first();
      const cta = page.locator('.nav .btn--nav').first();

      await expect(logo).toBeVisible();
      await expect(toggle).toBeVisible();
      await expect(cta).toBeVisible();

      // Desktop text links should be hidden at mobile widths
      const textLinks = page.locator('.nav .nav__links > .nav__link');
      const textLinkCount = await textLinks.count();
      for (let i = 0; i < textLinkCount; i++) {
        await expect(textLinks.nth(i)).toBeHidden();
      }

      // Every nav element must fit within the viewport horizontally
      for (const [name, loc] of [['logo', logo], ['toggle', toggle], ['cta', cta]]) {
        const box = await loc.boundingBox();
        expect(box, `${name} has a bounding box`).not.toBeNull();
        expect(box.x, `${name} left edge`).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, `${name} right edge`).toBeLessThanOrEqual(viewportWidth + 1);
      }

      // Hamburger must sit immediately left of the CTA pill
      const toggleBox = await toggle.boundingBox();
      const ctaBox = await cta.boundingBox();
      expect(toggleBox.x + toggleBox.width).toBeLessThanOrEqual(ctaBox.x + 1);
    });

    test('hamburger opens a panel with Results, Resources and email', async ({ page }) => {
      const toggle = page.locator('.nav .nav__menu > summary').first();
      const panel = page.locator('.nav .nav__mobile-panel').first();

      await expect(panel).toBeHidden();
      await toggle.click();
      await expect(panel).toBeVisible();

      await expect(panel.getByRole('link', { name: 'Results' })).toBeVisible();
      await expect(panel.getByRole('link', { name: 'Resources' })).toBeVisible();
      await expect(panel.getByRole('link', { name: /info@eldur\.studio/ })).toBeVisible();

      // Every panel link must have a non-empty href
      const links = panel.locator('a');
      const count = await links.count();
      expect(count).toBeGreaterThanOrEqual(3);
      for (let i = 0; i < count; i++) {
        const href = await links.nth(i).getAttribute('href');
        expect(href, `panel link ${i} href`).toBeTruthy();
      }
    });

    test('footer fits within viewport and all links are visible', async ({ page }) => {
      const viewportWidth = page.viewportSize().width;
      const footer = page.locator('.footer').first();

      await footer.scrollIntoViewIfNeeded();
      await expect(footer).toBeVisible();

      const footerBox = await footer.boundingBox();
      expect(footerBox.x).toBeGreaterThanOrEqual(0);
      expect(footerBox.x + footerBox.width).toBeLessThanOrEqual(viewportWidth + 1);

      const links = page.locator('.footer .footer__links a');
      const count = await links.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const link = links.nth(i);
        await expect(link).toBeVisible();
        const box = await link.boundingBox();
        expect(box, `footer link ${i} bounding box`).not.toBeNull();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth + 1);
      }
    });
  });
}
