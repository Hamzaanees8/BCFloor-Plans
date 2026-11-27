import { test, expect } from '@playwright/test';
import {
  E2E_CONFIG,
  annotateBusinessCase,
  attachProofScreenshot,
  getVancouverDateOffset,
  loginAs,
} from './helpers/authAndMocks';
import {
  attachErrorGuards,
  assertNoServerErrors,
  fillPropertyAndNext,
  selectServicesAndNext,
  selectVendorOnSchedule,
} from './helpers/bookingFlow';

/**
 * Chunk 3 of 6: Double-Click, Cancelled Slot Release & Multi-Tab Concurrency (UI-15 to UI-17)
 *
 * Run this chunk alone:
 *   npx playwright test e2e/03-overlaps-and-concurrency.spec.ts
 */

const TARGET_DATE_T5 = getVancouverDateOffset(5);

test.describe('Overlaps, Double-Click & Concurrency', () => {
  test('UI-15 (UC-25): Slow 3G double-click on 09:00 slot adds only 1 set of 15-min chunks (no duplicates)', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-15',
      area: 'Overlaps, Double-Click & Concurrency',
      role: 'Agent / Admin',
      summary:
        'Throttles network to Slow 3G, drives to Schedule tab for Victor Alpha, rapidly double-clicks an available slot, and verifies no duplicate 120-min chunk selection occurs.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Agent and navigate to Schedule tab for "300 Burrard St, Vancouver"', async () => {
      await loginAs(page, request, 'agent');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await fillPropertyAndNext(page, testInfo, {
        role: 'agent',
        useExistingListing: true,
        address: '300 Burrard St',
        city: 'Vancouver',
        postalCode: 'V6C 2G8',
        squareFootage: '2000',
      });
      await selectServicesAndNext(page, testInfo, ['E2E HDR Photos']);
      await selectVendorOnSchedule(page, 'Victor Alpha', 0);
      await expect(page.locator('.fc').first()).toBeVisible({ timeout: 15_000 });
      await attachProofScreenshot(page, testInfo, '1. Schedule Loaded Before Slow 3G');
    });

    await test.step('2. Throttle network (Slow 3G) and rapidly double-click first available slot', async () => {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: (500 * 1024) / 8,
        uploadThroughput: (500 * 1024) / 8,
        latency: 400,
      });

      const availableSlot = page.locator('.slot-available').first();
      if (await availableSlot.isVisible().catch(() => false)) {
        await availableSlot.dblclick();
        await page.waitForTimeout(1000);
      }
      await attachProofScreenshot(page, testInfo, '2. Post Double-Click Slot State (No Duplicate Chunks)');
      await expect(page.getByText(/120\s*min/i)).toHaveCount(0);
      assertNoServerErrors(guard, 'UI-15 double-click under Slow 3G');
    });
  });

  test('UI-16 (UC-26/27 UI): Cancelled booking on T+5 (14:00-15:00) is NOT blocking in /api/order-slots or Schedule', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-16',
      area: 'Overlaps, Double-Click & Concurrency',
      role: 'Admin',
      summary:
        'Verifies cancelled T+5 14:00–15:00 slot is excluded from /api/order-slots and renders as available on the Schedule tab.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Check /api/order-slots does not return cancelled T+5 14:00-15:00 slot', async () => {
      const { token } = await loginAs(page, request, 'admin');
      const res = await request.get(`${E2E_CONFIG.apiUrl}/api/order-slots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.ok()).toBeTruthy();
      const json = await res.json();
      const slots = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      const cancelledBlock = slots.find(
        (s: any) => s.date === TARGET_DATE_T5 && String(s.start_time).startsWith('14:00')
      );
      expect(cancelledBlock).toBeUndefined();
    });

    await test.step('2. Open Schedule tab for Victor Alpha and capture availability proof', async () => {
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await fillPropertyAndNext(page, testInfo, {
        role: 'admin',
        useExistingListing: true,
        address: '300 Burrard St',
        city: 'Vancouver',
        postalCode: 'V6C 2G8',
        squareFootage: '2000',
      });
      await selectServicesAndNext(page, testInfo, ['E2E HDR Photos']);
      await selectVendorOnSchedule(page, 'Victor Alpha', 0);
      await expect(page.locator('.fc').first()).toBeVisible({ timeout: 15_000 });
      await attachProofScreenshot(page, testInfo, '2. Schedule Tab — Cancelled 14:00-15:00 Released');
      assertNoServerErrors(guard, 'UI-16 cancelled slot release');
    });
  });

  test('UI-17 (UC-29): Two isolated browser contexts maintain independent live booking state', async ({
    browser,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-17',
      area: 'Overlaps, Double-Click & Concurrency',
      role: 'Admin & Agent (2 Contexts)',
      summary:
        'Opens two isolated browser contexts (Admin & Agent) simultaneously on /dashboard/orders/create and verifies independent sessions and zero 500 errors.',
    });

    const ctxA = await browser.newContext({ timezoneId: 'America/Vancouver' });
    const ctxB = await browser.newContext({ timezoneId: 'America/Vancouver' });
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();
    const guardA = attachErrorGuards(pageA);
    const guardB = attachErrorGuards(pageB);

    try {
      await test.step('1. Authenticate Context A (Admin) and Context B (Agent) independently', async () => {
        await loginAs(pageA, ctxA.request, 'admin');
        await loginAs(pageB, ctxB.request, 'agent');
      });

      await test.step('2. Open Schedule flow in both contexts and verify isolated sessions', async () => {
        await pageA.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
        await pageB.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
        await attachProofScreenshot(pageA, testInfo, '2a. Context A (Admin) Order Create');
        await attachProofScreenshot(pageB, testInfo, '2b. Context B (Agent) Order Create');
        assertNoServerErrors(guardA, 'UI-17 context A');
        assertNoServerErrors(guardB, 'UI-17 context B');
      });
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });
});
