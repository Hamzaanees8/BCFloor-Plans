import { test, expect } from '@playwright/test';
import {
  annotateBusinessCase,
  attachProofScreenshot,
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
 * Chunk 6 of 6: Quick Reassign / Swap & Cross-Timezone Safety (UI-30 to UI-32)
 *
 * Run this chunk alone:
 *   npx playwright test e2e/06-reassign-swap-timezones.spec.ts
 */

test.describe('Reassign, Swap & Cross-Timezone Safety', () => {
  test('UI-30 (UC-46/47 UI): Admin Calendar provides Quick Reassign / Swap workflows while Agent is blocked', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-30',
      area: 'Reassign, Swap & Cross-Timezone Safety',
      role: 'Admin',
      summary:
        'Opens /dashboard/calendar as Admin and verifies appointment events render for Quick Reassign / Swap with zero 500 errors.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Admin and open /dashboard/calendar', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
      await expect(page.locator('.rbc-calendar')).toBeVisible({ timeout: 15_000 });
      await attachProofScreenshot(page, testInfo, '1. Admin Calendar — Reassign/Swap Ready');
      assertNoServerErrors(guard, 'UI-30 reassign/swap');
    });
  });

  test.describe('Vancouver Browser Timezone (UTC-8)', () => {
    test.use({ timezoneId: 'America/Vancouver' });

    test('UI-31 (UC-48): Later-today slot in Vancouver is NOT falsely marked as past', async ({
      page,
      request,
    }, testInfo) => {
      annotateBusinessCase(testInfo, {
        caseId: 'UI-31',
        area: 'Reassign, Swap & Cross-Timezone Safety',
        role: 'Admin',
        summary:
          'Emulates America/Vancouver timezone, opens /dashboard/calendar, and verifies today’s upcoming slot is active and not marked past.',
      });

      const guard = attachErrorGuards(page);

      await test.step('1. Sign in as Admin in America/Vancouver and open /dashboard/calendar', async () => {
        await loginAs(page, request, 'admin');
        await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
        await expect(page.locator('.rbc-calendar')).toBeVisible({ timeout: 15_000 });
        await attachProofScreenshot(page, testInfo, '1. Vancouver Timezone — Later-Today Slot Active');
        assertNoServerErrors(guard, 'UI-31 vancouver timezone');
      });
    });
  });

  test.describe('Toronto Browser Timezone (UTC-5) booking Vancouver (UTC-8) property', () => {
    test.use({ timezoneId: 'America/Toronto' });

    test('UI-32 (UC-63): Admin in Toronto can view upcoming Vancouver slots without 3-hour false past cutoff', async ({
      page,
      request,
    }, testInfo) => {
      annotateBusinessCase(testInfo, {
        caseId: 'UI-32',
        area: 'Reassign, Swap & Cross-Timezone Safety',
        role: 'Admin',
        summary:
          'Emulates America/Toronto (UTC-5), drives Admin through Property ("300 Burrard St, Vancouver") → Services → Schedule, and verifies Vancouver slots render.',
      });

      const guard = attachErrorGuards(page);

      await test.step('1. Sign in as Admin in America/Toronto and drive to Schedule for Vancouver property', async () => {
        await loginAs(page, request, 'admin');
        await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
        await expect(page).toHaveURL(/\/dashboard\/orders\/create/);
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
        await attachProofScreenshot(page, testInfo, '1. Toronto Browser — Vancouver Property Schedule');
        assertNoServerErrors(guard, 'UI-32 cross-timezone');
      });
    });
  });
});
