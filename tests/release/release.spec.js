import { test, expect, isolateContext } from '../fixtures.js';

const paths = ['/', '/resources/', '/resources/no-code-to-ai-first-operators-marketing-model/', '/results/', '/results/people-enrichment-agent/', '/results/scalapay-webflow-directory-headless-cms/', '/styleguide/'];
const normalize = (text) => text.replace(/\s+/g, ' ').trim();

async function screenshot(page, testInfo, name) {
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true, scale: 'css', animations: 'disabled' });
  await testInfo.attach(name, { path, contentType: 'image/png' });
}

test('built pages, discovery files, and shared layout render correctly', async ({ page, request }, testInfo) => {
  for (const path of paths) {
    const response = await page.goto(path, { waitUntil: 'networkidle' });
    expect(response.status(), path).toBe(200);
    const text = await page.locator('body').innerText();
    expect(text, path).not.toMatch(/\{\{\s*(?:post\.title|post\.url|content|site\.posts)|\{%\s*(?:for post in site\.posts|if site\.posts)/);
    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    for (const schema of schemas) expect(() => JSON.parse(schema), path).not.toThrow();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), path).toBe(true);
    if (path === '/styleguide/') await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    if (path !== '/styleguide/') {
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://eldur.studio${path}`);
      await expect(page.locator('.nav').first()).toBeVisible();
      await expect(page.locator('.footer').first()).toBeAttached();
    }
    if (path === '/') await screenshot(page, testInfo, 'homepage');
    if (path === '/styleguide/') await screenshot(page, testInfo, 'styleguide');
  }
  for (const path of ['/llms.txt', '/robots.txt', '/sitemap.xml']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const text = await response.text();
    if (path === '/llms.txt') {
      expect(text).toContain('Watchtower');
      expect(text).not.toContain('no SaaS subscription');
    }
    if (path === '/robots.txt') expect(text).toContain('https://eldur.studio/sitemap.xml');
    if (path === '/sitemap.xml') {
      expect(text).toContain('https://eldur.studio/resources/');
      expect(text).not.toContain('/styleguide/');
    }
  }
});

test('homepage facts, structured answers, image, and keyboard controls agree', async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('#packages, #for, .hero .eyebrow')).toHaveCount(0);
  await expect(page.locator('#process .section__lead')).toContainText('Scoped to your business. Priced at a fixed fee.');
  await expect(page.locator('#process')).toContainText('We agree on the scope and price before the build starts.');
  await expect(page.getByRole('link', { name: 'Explore agents', exact: true })).toHaveAttribute('href', '#watchtower');
  const anchors = await page.locator('a[href^="#"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')).filter((href) => href.length > 1 && !document.getElementById(href.slice(1))));
  expect(anchors).toEqual([]);
  const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(JSON.parse);
  expect(schemas.some((schema) => schema.name === 'Eldur Studio Packages')).toBe(false);
  const schema = schemas.find((schema) => schema['@type'] === 'FAQPage');
  const answers = await page.locator('.faq__a').allTextContents();
  expect(answers).toHaveLength(7);
  expect(schema.mainEntity).toHaveLength(7);
  expect(answers.map(normalize)).toEqual(schema.mainEntity.map((item) => normalize(item.acceptedAnswer.text)));
  await expect(page.locator('#faq')).toContainText('You can start with a first agent to try one workflow before commissioning a larger system.');
  expect(JSON.stringify(schema)).not.toContain('First Agent');

  const portrait = page.locator('#about .about-card__photo');
  await portrait.scrollIntoViewIfNeeded();
  await expect(portrait).toHaveAttribute('src', '/assets/headshot-veronica.webp');
  await expect.poll(() => portrait.evaluate((image) => image.complete && image.naturalWidth === 640 && image.naturalHeight === 640)).toBe(true);
  for (const item of await page.locator('.faq__item').all()) {
    const summary = item.locator('summary');
    await summary.focus();
    await expect(summary).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(item).toHaveAttribute('open', '');
    await page.keyboard.press('Space');
    await expect(item).not.toHaveAttribute('open', '');
  }
  for (const link of await page.locator('#about .about-card__links a').all()) {
    await link.focus();
    await expect(link).toBeFocused();
  }
  await page.locator('#about').scrollIntoViewIfNeeded();
  await screenshot(page, testInfo, 'about-and-keyboard');
});

test('product, booking, email, and social actions retain destinations and single analytics events', async ({ page, context }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#watchtower .section__title').scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => window.__releaseEvents.filter((event) => event.name === 'self-serve-agents-viewed').length)).toBe(1);
  await page.locator('.hero').scrollIntoViewIfNeeded();
  await page.locator('#watchtower .section__title').scrollIntoViewIfNeeded();

  async function externalClick(locator, destination) {
    await expect(locator).toHaveAttribute('href', destination);
    const opened = context.waitForEvent('page');
    await locator.click();
    const popup = await opened;
    await popup.waitForLoadState('domcontentloaded');
    expect(new URL(popup.url()).href).toBe(new URL(destination).href);
    await popup.close();
  }
  await externalClick(page.locator('#watchtower .card--buy a[data-install-agent]'), 'https://webflow.eldur.studio');
  await externalClick(page.locator('#watchtower .card--try a[data-install-agent]'), 'https://chatgpt.com/plugins/plugins_6a8f237c51488191a3bb6c3accefc4b5');
  await externalClick(page.locator('.hero .btn--primary'), 'https://booking.akiflow.com/veronica-es-new');
  await externalClick(page.locator('#about a').filter({ hasText: 'LinkedIn' }), 'https://www.linkedin.com/in/veronicapicciafuoco');
  await externalClick(page.locator('#about a').filter({ hasText: 'X / Twitter' }), 'https://twitter.com/UberVero');

  const email = page.locator('.footer a[href="mailto:info@eldur.studio"]');
  await expect(email).toHaveAttribute('href', 'mailto:info@eldur.studio');
  await page.evaluate(() => document.addEventListener('click', (event) => {
    if (event.target.closest('a[href^="mailto:"]')) event.preventDefault();
  }, { capture: true, once: true }));
  await email.click();
  const events = await page.evaluate(() => window.__releaseEvents);
  expect(events).toHaveLength(5);
  expect(events).toEqual(expect.arrayContaining([
    { name: 'self-serve-agents-viewed' },
    { name: 'watchtower-install', options: { _value: 100 } },
    { name: 'b2b-messaging-workshop-install' },
    { name: 'schedule-call' },
    { name: 'email-contact-click' },
  ]));
});

test('product facts and links remain available without JavaScript', async ({ browser, baseURL }, testInfo) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: testInfo.project.use.viewport });
  await isolateContext(context, baseURL);
  const page = await context.newPage();
  try {
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await expect(page.locator('#watchtower')).toContainText('Watchtower checks your Webflow site each week');
    await expect(page.locator('#watchtower')).toContainText('$299');
    await expect(page.locator('#watchtower')).toContainText('two change requests');
    await expect(page.locator('#watchtower')).toContainText('B2B Messaging Workshop');
    await expect(page.locator('#watchtower .card--try')).toContainText('$0');
    await expect(page.locator('#about')).toContainText('Veronica Picciafuoco');
    await expect(page.locator('#watchtower .card--buy a')).toHaveAttribute('href', 'https://webflow.eldur.studio');
    await expect(page.locator('#watchtower .card--try a')).toHaveAttribute('href', 'https://chatgpt.com/plugins/plugins_6a8f237c51488191a3bb6c3accefc4b5');
  } finally {
    await context.close();
  }
});
