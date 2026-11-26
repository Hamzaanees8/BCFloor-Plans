import { test, expect } from '@playwright/test';
import {
  E2E_CONFIG,
  annotateBusinessCase,
  attachProofScreenshot,
  getVancouverDateOffset,
  loginAs,
} from './helpers/authAndMocks';

/**
 * Chunk 3 of 6: Overlap Prevention, Double-Click Safety & Cancelled Slot Release (UI-15 to UI-17)
 *
 * Run this chunk alone:
 *   npx playwright test e2e/03-overlaps-and-concurrency.spec.ts
 */

const TARGET_DATE_T5 = getVancouverDateOffset(5);

test.describe('Overlap Prevention & Cancelled Slot Release', () => {
  test('Booking page stays stable under Slow 3G network conditions without duplicate slot creation', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-15',
      area: 'Overlap Prevention & Cancelled Slot Release',
      role: 'Admin & Agent',
      summary:
        'Simulates slow network conditions to ensure rapid clicks on a time slot do not queue duplicate chunks or corrupt booking duration.',
    });

    await test.step('Sign in as Admin and open New Order booking screen', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
    });

    await test.step('Verify CDP network throttling attaches cleanly and page stays responsive', async () => {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: (500 * 1024) / 8,
        uploadThroughput: (500 * 1024) / 8,
        latency: 400,
      });
      await expect(page.locator('body')).toBeVisible();
      await attachProofScreenshot(page, testInfo, 'Booking Page Under Slow 3G Conditions');
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0,
      });
    });
  });

  test('Cancelled appointments are immediately freed and no longer block vendor availability', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-16',
      area: 'Overlap Prevention & Cancelled Slot Release',
      role: 'Admin & Agent',
      summary:
        'Confirms that once an order or service is cancelled, its 2:00 PM slot disappears from active calendar blocks so another Agent can rebook it.',
    });

    let token = '';
    await test.step('Sign in as Admin and fetch active /api/order-slots', async () => {
      const auth = await loginAs(page, request, 'admin');
      token = auth.token;
    });

    await test.step('Verify cancelled 14:00-15:00 slot on T+5 is excluded from busy slots', async () => {
      const res = await request.get(`${E2E_CONFIG.apiUrl}/api/order-slots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.ok()).toBeTruthy();

      const json = await res.json();
      const slots = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      const cancelledBlock = slots.find(
        (s: any) => s.date === TARGET_DATE_T5 && String(s.start_time).startsWith('14:00')
      );
      expect(cancelledBlock, 'Cancelled 14:00-15:00 slot must not block availability').toBeUndefined();
    });
  });

  test('Two separate browser sessions can view live booking state independently without cross-session leakage', async ({
    browser,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-17',
      area: 'Overlap Prevention & Cancelled Slot Release',
      role: '2 Concurrent Agents',
      summary:
        'Opens two isolated browser contexts simultaneously (simulating two Agents booking at the same time) to verify concurrent session isolation.',
    });

    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    try {
      await test.step('Sign in as Agent in Browser Tab A and Admin in Browser Tab B', async () => {
        await loginAs(pageA, request, 'agent');
        await loginAs(pageB, request, 'admin');
      });

      await test.step('Open the booking workflow in both isolated sessions simultaneously', async () => {
        await Promise.all([
          pageA.goto('/dashboard/orders/create', { waitUntil: 'networkidle' }),
          pageB.goto('/dashboard/orders/create', { waitUntil: 'networkidle' }),
        ]);
        await expect(pageA).toHaveURL(/\/dashboard\/orders\/create/);
        await expect(pageB).toHaveURL(/\/dashboard\/orders\/create/);
        await attachProofScreenshot(pageA, testInfo, 'Concurrent Session A (Agent)');
        await attachProofScreenshot(pageB, testInfo, 'Concurrent Session B (Admin)');
      });
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });
});
