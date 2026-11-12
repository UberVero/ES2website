import { test, expect } from '@playwright/test';

// Stub Fathom so QA never contributes visits or conversions to production.
test.beforeEach(async ({ page }) => {
  await page.route('**/cdn.usefathom.com/**', route => route.abort());
  await page.addInitScript(() => {
    window.recordedEvents = [];
    window.fathom = {
      trackEvent: (name, options) => window.recordedEvents.push({ name, options }),
    };
    window.open = () => null;
    document.addEventListener('click', event => {
      if (event.target.closest('a')) event.preventDefault();
    }, true);
  });
});

for (const path of ['/', '/results/', '/resources/webflow-seo-checklist/']) {
  test(`booking click is counted once on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.locator('.nav a[href="https://booking.akiflow.com/veronica-es-new"]').click();
    await expect.poll(() => page.evaluate(() =>
      window.recordedEvents.filter(event => event.name === 'schedule-call').length
    )).toBe(1);
  });
}

test('free audit CTA retains its click event and nominal value', async ({ page }) => {
  await page.goto('/');
  const cta = page.locator('#watchtower a[data-analytics-event="watchtower-install"]');
  await expect(cta).toHaveAttribute('href', 'https://webflow.eldur.studio');
  await cta.locator('.ia2-main').click();
  const events = await page.evaluate(() =>
    window.recordedEvents.filter(event => event.name === 'watchtower-install')
  );
  expect(events).toEqual([{ name: 'watchtower-install', options: { _value: 100 } }]);
});

test('article booking link still works when analytics is unavailable', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/resources/webflow-seo-checklist/');
  await page.evaluate(() => { delete window.fathom; });
  const link = page.locator('.nav a[href="https://booking.akiflow.com/veronica-es-new"]');
  await link.click();
  await expect(link).toHaveAttribute('target', '_blank');
  expect(errors).toEqual([]);
});
