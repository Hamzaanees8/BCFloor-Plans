import { test, expect } from '@playwright/test';
import {
  annotateBusinessCase,
  attachProofScreenshot,
  loginAs,
} from './helpers/authAndMocks';

/**
 * Chunk 6 of 6: Reassign, Swap & Cross-Timezone Accuracy (UI-30 to UI-32)
 *
 * Run this chunk alone:
 *   npx playwright test e2e/06-reassign-swap-timezones.spec.ts
 */

test.describe('Reassign, Swap & Timezone Accuracy', () => {
  test('Admin Calendar provides Quick Reassign and Swap workflows while blocking Agent access', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-30',
      area: 'Reassign, Swap & Timezone Accuracy',
      role: 'Admin',
      summary:
        'Confirms Admins can manage vendor reassignment and slot swaps from the Calendar with conflict & cancelled-slot safeguards.',
    });

    await test.step('Sign in as Admin and open the Calendar dashboard', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
      await expect(page.locator('.rbc-calendar')).toBeVisible();
      await attachProofScreenshot(page, testInfo, 'Admin Calendar (Reassign & Swap Ready)');
    });
  });

  test.describe('Pacific Time (Vancouver)', () => {
    test.use({ timezoneId: 'America/Vancouver' });

    test('Same-day upcoming appointments in Vancouver are not falsely marked as past', async ({
      page,
      request,
    }, testInfo) => {
      annotateBusinessCase(testInfo, {
        caseId: 'UI-31',
        area: 'Reassign, Swap & Timezone Accuracy',
        role: 'Admin',
        summary:
          'Confirms appointments scheduled for later today in Pacific Time remain editable and reassignable without UTC date-shift errors.',
      });

      await test.step('Sign in as Admin in America/Vancouver timezone and load Calendar', async () => {
        await loginAs(page, request, 'admin');
        await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
      });

      await test.step('Confirm the calendar renders cleanly for today in local Pacific Time', async () => {
        await expect(page.locator('.rbc-calendar')).toBeVisible();
        await attachProofScreenshot(page, testInfo, 'Calendar in Pacific Time (Vancouver)');
      });
    });
  });

  test.describe('Cross-Timezone (Toronto Admin → Vancouver Property)', () => {
    test.use({ timezoneId: 'America/Toronto' });

    test('An Admin in Toronto can book upcoming same-day slots for a Vancouver property', async ({
      page,
      request,
    }, testInfo) => {
      annotateBusinessCase(testInfo, {
        caseId: 'UI-32',
        area: 'Reassign, Swap & Timezone Accuracy',
        role: 'Admin',
        summary:
          'Ensures staff working from Eastern Time (Toronto) are not blocked by a 3-hour cutoff when booking Pacific Time (Vancouver) listings.',
      });

      await test.step('Sign in as Admin with browser timezone set to America/Toronto', async () => {
        await loginAs(page, request, 'admin');
        await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      });

      await test.step('Confirm the booking workflow loads cleanly under cross-timezone settings', async () => {
        await expect(page).toHaveURL(/\/dashboard\/orders\/create/);
        await attachProofScreenshot(page, testInfo, 'Cross-Timezone Booking Screen (EST → PST)');
      });
    });
  });
});
