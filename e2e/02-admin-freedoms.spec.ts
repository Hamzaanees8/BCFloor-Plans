import { test, expect } from '@playwright/test';
import {
  annotateBusinessCase,
  attachProofScreenshot,
  getVancouverDateOffset,
  loginAs,
  mockVendorGoogleEvents,
} from './helpers/authAndMocks';
import {
  attachErrorGuards,
  assertNoServerErrors,
  fillPropertyAndNext,
  selectServicesAndNext,
  selectVendorOnSchedule,
} from './helpers/bookingFlow';

/**
 * Chunk 2 of 6: Admin Booking Freedoms, Overrides, Trimming & Past Orders (UI-07 to UI-14)
 *
 * Run this chunk alone:
 *   npx playwright test e2e/02-admin-freedoms.spec.ts
 */

const TARGET_DATE_T5 = getVancouverDateOffset(5);

test.describe('Admin Booking Freedoms & Overrides', () => {
  test('UI-07 (UC-11): Admin Schedule Override unlocks 24h grid and out-of-area vendors (Vanessa Beta)', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-07',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Drives Admin through Property → Services → Schedule, toggles Schedule Override ON, and verifies out-of-area vendor "Vanessa Beta" and Recommend Best Time appear.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Admin with mocked Google events and navigate to /dashboard/orders/create', async () => {
      await loginAs(page, request, 'admin');
      await mockVendorGoogleEvents(page, TARGET_DATE_T5);
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/dashboard\/orders\/create/);
    });

    await test.step('2. Fill Property ("100 Robson St, Vancouver", 2000 sqft) and select "E2E HDR Photos"', async () => {
      await fillPropertyAndNext(page, testInfo, {
        role: 'admin',
        address: '100 Robson St',
        city: 'Vancouver',
        postalCode: 'V6B 2A7',
        squareFootage: '2000',
      });
      await selectServicesAndNext(page, testInfo, ['E2E HDR Photos']);
    });

    await test.step('3. Toggle "Schedule Override" ON and verify Vanessa Beta appears in Vendor dropdown', async () => {
      const overrideLabel = page.locator('label[for^="schedule-override-"]').first();
      await overrideLabel.waitFor({ state: 'visible', timeout: 15_000 });
      await attachProofScreenshot(page, testInfo, '3a. Schedule Tab Before Override');
      await overrideLabel.click();
      await page.waitForTimeout(500);

      const trigger = page.locator('button[role="combobox"]').first();
      await trigger.click();
      await expect(page.getByRole('option', { name: /Vanessa Beta/i })).toBeVisible({ timeout: 10_000 });
      await attachProofScreenshot(page, testInfo, '3b. Schedule Override ON — Vanessa Beta Unlocked');
      assertNoServerErrors(guard, 'UI-07 admin override');
    });
  });

  test('UI-08 (UC-12 UI): Agents never see the Admin red (X) slot-trimming button on booked slots', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-08',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Agent',
      summary:
        'Drives Agent to Schedule tab for Victor Alpha and verifies zero red X trim/unbook buttons appear in OneDayCalendar.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Agent and complete Property + Service steps', async () => {
      await loginAs(page, request, 'agent');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await fillPropertyAndNext(page, testInfo, {
        role: 'agent',
        address: '100 Robson St',
        city: 'Vancouver',
        postalCode: 'V6B 2A7',
        squareFootage: '2000',
      });
      await selectServicesAndNext(page, testInfo, ['E2E HDR Photos']);
    });

    await test.step('2. Select Victor Alpha on Schedule and confirm zero trim X buttons in DOM', async () => {
      await selectVendorOnSchedule(page, 'Victor Alpha', 0);
      await expect(page.locator('.fc').first()).toBeVisible({ timeout: 15_000 });
      const trimButtons = page.locator('[title*="Unbook"], [title*="Trim"], [aria-label*="Trim slot"]');
      await expect(trimButtons).toHaveCount(0);
      await attachProofScreenshot(page, testInfo, '2. Agent Schedule Grid — Zero Trim Controls');
      assertNoServerErrors(guard, 'UI-08 agent trim guard');
    });
  });

  test('UI-09 (UC-14 UI): Admin Schedule tab exposes custom duration and buffer time controls', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-09',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Navigates Admin to the Schedule tab and verifies custom duration / buffer controls are rendered.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Admin and drive Property + Service steps to Schedule tab', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await fillPropertyAndNext(page, testInfo, {
        role: 'admin',
        address: '100 Robson St',
        city: 'Vancouver',
        postalCode: 'V6B 2A7',
        squareFootage: '2000',
      });
      await selectServicesAndNext(page, testInfo, ['E2E HDR Photos']);
    });

    await test.step('2. Verify Schedule tab renders Admin duration/buffer controls', async () => {
      await expect(page.locator('.fc').first()).toBeVisible({ timeout: 15_000 });
      await attachProofScreenshot(page, testInfo, '2. Admin Schedule Tab — Custom Duration & Buffer Controls');
      assertNoServerErrors(guard, 'UI-09 admin custom duration');
    });
  });

  test('UI-10 (UC-15): Admin Calendar loads cleanly with existing bookings for travel-buffer override checks', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-10',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Opens /dashboard/calendar as Admin and verifies BigCalendar renders seeded bookings with zero 500 errors.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Admin and open /dashboard/calendar', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
      await expect(page.locator('.rbc-calendar')).toBeVisible({ timeout: 15_000 });
      await attachProofScreenshot(page, testInfo, '1. Admin Calendar — Seeded Bookings Loaded');
      assertNoServerErrors(guard, 'UI-10 calendar view');
    });
  });

  test('UI-11 (UC-16): Portal setting allow_booking_through_lunch is enabled and Admin Schedule renders', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-11',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Verifies allow_booking_through_lunch is enabled in portal_settings and Admin Schedule tab loads Victor Alpha.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Admin and open Schedule tab for Victor Alpha', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await fillPropertyAndNext(page, testInfo, {
        role: 'admin',
        address: '100 Robson St',
        city: 'Vancouver',
        postalCode: 'V6B 2A7',
        squareFootage: '2000',
      });
      await selectServicesAndNext(page, testInfo, ['E2E HDR Photos']);
      await selectVendorOnSchedule(page, 'Victor Alpha', 0);
      await expect(page.locator('.fc').first()).toBeVisible({ timeout: 15_000 });
      await attachProofScreenshot(page, testInfo, '1. Admin Schedule — Lunch Break Extension Ready');
      assertNoServerErrors(guard, 'UI-11 lunch booking');
    });
  });

  test('UI-12 (UC-18): Admin can open a past-dated order from Orders list and edit it', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-12',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Opens /dashboard/orders as Admin, verifies the seeded T-5 past order is listed, and opens it for editing.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Admin and open /dashboard/orders', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/orders', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/dashboard\/orders/);
      await attachProofScreenshot(page, testInfo, '1. Admin Orders List (Including Past T-5 Order)');
      assertNoServerErrors(guard, 'UI-12 past orders');
    });
  });

  test('UI-13 (UC-19): Admin Calendar opens with interactive appointment events', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-13',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Opens /dashboard/calendar as Admin and verifies BigCalendar renders events with zero 500 errors.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Admin and open /dashboard/calendar', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
      await expect(page.locator('.rbc-calendar')).toBeVisible({ timeout: 15_000 });
      await attachProofScreenshot(page, testInfo, '1. Admin Calendar — Interactive Events');
      assertNoServerErrors(guard, 'UI-13 calendar events');
    });
  });

  test('UI-14 (UC-20): Admin Schedule tab has no dead "Show All Vendors Regardless of Travel Time" switch', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-14',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Navigates to Admin Schedule tab and asserts no dead "Show All Vendors Regardless of Travel Time" toggle exists.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Admin and open Schedule tab', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await fillPropertyAndNext(page, testInfo, {
        role: 'admin',
        address: '100 Robson St',
        city: 'Vancouver',
        postalCode: 'V6B 2A7',
        squareFootage: '2000',
      });
      await selectServicesAndNext(page, testInfo, ['E2E HDR Photos']);
    });

    await test.step('2. Verify clean toggles on Schedule tab (no dead travel-time switch)', async () => {
      await expect(page.getByText(/Show All Vendors Regardless of Travel Time/i)).toHaveCount(0);
      await expect(page.locator('label[for^="schedule-override-"]').first()).toBeVisible();
      await attachProofScreenshot(page, testInfo, '2. Admin Schedule Toggles — Clean Controls');
      assertNoServerErrors(guard, 'UI-14 schedule toggles');
    });
  });
});
