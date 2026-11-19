import { test as base, expect } from '@playwright/test';

// Keep previews and the nightly watchdog out of production analytics. Allow
// only the site under test; external navigation gets an inert local response.
export async function isolateContext(context, baseURL) {
  const origin = new URL(baseURL).origin;
  await context.route('**/*', async (route) => {
    const request = route.request();
    if (new URL(request.url()).origin === origin) return route.continue();
    if (request.isNavigationRequest()) {
      return route.fulfill({ status: 200, contentType: 'text/html', body: '<title>External destination intercepted by release tests</title>' });
    }
    return route.abort();
  });
  await context.addInitScript(() => {
    window.__releaseEvents = [];
    window.fathom = {
      trackEvent(name, options) {
        window.__releaseEvents.push({ name, ...(options ? { options } : {}) });
      },
    };
  });
}

export const test = base.extend({
  context: async ({ context, baseURL }, use) => {
    if (!baseURL) throw new Error('A baseURL is required for isolated browser checks.');
    await isolateContext(context, baseURL);
    await use(context);
  },
});
export { expect };
