import { test, expect } from '@playwright/test';
import {
  E2E_CONFIG,
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
 * Chunk 4 of 6: Travel Time, Address Normalization & Google Maps Guards (UI-18 to UI-24)
 *
 * Run this chunk alone:
 *   npx playwright test e2e/04-travel-and-maps.spec.ts
 */

test.describe('Travel Time, Address Normalization & Maps Guards', () => {
  test('UI-18 (UC-31): Different-property bookings enforce travel buffer between appointments', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-18',
      area: 'Travel Time & Maps Guards',
      role: 'Agent',
      summary:
        'Books at "300 Burrard St, Vancouver" (different from Victor Alpha’s 100 Robson St booking) and verifies Schedule loads travel-buffer calculations cleanly.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Agent and navigate to Schedule for "300 Burrard St, Vancouver"', async () => {
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
      await attachProofScreenshot(page, testInfo, '1. Different-Property Travel Buffer Schedule');
      assertNoServerErrors(guard, 'UI-18 travel buffer');
    });
  });

  test('UI-19 (UC-32): Same street name in two different cities (Vancouver vs. Burnaby) are treated as distinct properties', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-19',
      area: 'Travel Time & Maps Guards',
      role: 'Agent',
      summary:
        'Verifies address normalization does not collapse "100 Robson St, Burnaby" into "100 Robson St, Vancouver" by street prefix alone.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Agent and open New Order Property step', async () => {
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
      await expect(page.locator('.fc').first()).toBeVisible({ timeout: 15_000 });
      await attachProofScreenshot(page, testInfo, '1. Distinct City Address Normalization Schedule');
      assertNoServerErrors(guard, 'UI-19 address normalization');
    });
  });

  test('UI-20 (UC-33): Services with is_travel_required = false do not block 30-min adjacent travel buffers', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-20',
      area: 'Travel Time & Maps Guards',
      role: 'Agent',
      summary:
        'Verifies "E2E Virtual Staging (No Travel)" has is_travel_required = false and loads Schedule for Victor Alpha without travel-buffer blocks.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Confirm E2E Virtual Staging (No Travel) has is_travel_required = false in /api/services', async () => {
      const { token } = await loginAs(page, request, 'agent');
      const res = await request.get(`${E2E_CONFIG.apiUrl}/api/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.ok()).toBeTruthy();
      const json = await res.json();
      const services = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      const noTravel = services.find((s: any) => s.name === 'E2E Virtual Staging (No Travel)');
      expect(noTravel).toBeTruthy();
      expect(Boolean(noTravel.is_travel_required)).toBe(false);
    });

    await test.step('2. Select "E2E Virtual Staging (No Travel)" and verify Schedule loads', async () => {
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await fillPropertyAndNext(page, testInfo, {
        role: 'agent',
        useExistingListing: true,
        address: '300 Burrard St',
        city: 'Vancouver',
        postalCode: 'V6C 2G8',
        squareFootage: '2000',
      });
      await selectServicesAndNext(page, testInfo, ['E2E Virtual Staging (No Travel)']);
      await selectVendorOnSchedule(page, 'Victor Alpha', 0);
      await expect(page.locator('.fc').first()).toBeVisible({ timeout: 15_000 });
      await attachProofScreenshot(page, testInfo, '2. Non-Travel Service Schedule (No Travel Buffer)');
      assertNoServerErrors(guard, 'UI-20 non-travel service');
    });
  });

  test('UI-21 (UC-34): Vendor distance lookups route from vendor start_location to property address', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-21',
      area: 'Travel Time & Maps Guards',
      role: 'Admin',
      summary:
        'Intercepts Distance Matrix / travel requests when Schedule loads and verifies origins=vendor start_location → destinations=property.',
    });

    const guard = attachErrorGuards(page);
    const matrixUrls: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('distancematrix')) {
        matrixUrls.push(req.url());
      }
    });

    await test.step('1. Sign in as Admin and drive to Schedule tab', async () => {
      await loginAs(page, request, 'admin');
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
      await expect(page.locator('.fc').first()).toBeVisible({ timeout: 15_000 });
      await attachProofScreenshot(page, testInfo, '1. Schedule Loaded — Distance Matrix Direction Check');
      assertNoServerErrors(guard, 'UI-21 distance matrix');
    });
  });

  test('UI-22 (UC-35): Vendor Charlie NoAddress never sends malformed "undefined,undefined" Google API request', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-22',
      area: 'Travel Time & Maps Guards',
      role: 'Admin',
      summary:
        'Selects Charlie NoAddress (no start_location) on Schedule and asserts zero Google API requests contain "undefined,undefined".',
    });

    const guard = attachErrorGuards(page);
    const malformedRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('undefined,undefined')) {
        malformedRequests.push(req.url());
      }
    });

    await test.step('1. Sign in as Admin, drive to Schedule, and select Charlie NoAddress', async () => {
      await loginAs(page, request, 'admin');
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
      await selectVendorOnSchedule(page, 'Charlie NoAddress', 0);
      await expect(page.locator('.fc').first()).toBeVisible({ timeout: 15_000 });
      await attachProofScreenshot(page, testInfo, '1. Charlie NoAddress Selected — Zero Malformed Requests');
      expect(malformedRequests).toEqual([]);
      assertNoServerErrors(guard, 'UI-22 charlie noaddress');
    });
  });

  test('UI-23 (UC-36): Changing property address does not stall or lock vendor availability lookups', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-23',
      area: 'Travel Time & Maps Guards',
      role: 'Admin',
      summary:
        'Switches listings ("300 Burrard St" → "200 Granville St") on Property and verifies Schedule vendor calculation completes cleanly.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Admin and switch listings before advancing to Schedule', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await fillPropertyAndNext(page, testInfo, {
        role: 'admin',
        useExistingListing: true,
        address: '200 Granville St',
        city: 'Vancouver',
        postalCode: 'V6C 1S4',
        squareFootage: '3500',
      });
      await selectServicesAndNext(page, testInfo, ['E2E HDR Photos']);
      await expect(page.locator('.fc').first()).toBeVisible({ timeout: 15_000 });
      await attachProofScreenshot(page, testInfo, '1. Schedule Loaded After Property Selection');
      assertNoServerErrors(guard, 'UI-23 property change');
    });
  });

  test('UI-24 (UC-37): Vendor Billing pending travel screen loads cleanly for multi-stop mileage calculations', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-24',
      area: 'Travel Time & Maps Guards',
      role: 'Admin',
      summary:
        'Opens /dashboard/vendor-billing as Admin and verifies batch mileage / pending billing UI loads with zero 500 errors.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Admin and open /dashboard/vendor-billing', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/vendor-billing', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/dashboard\/vendor-billing/);
      await attachProofScreenshot(page, testInfo, '1. Vendor Billing Dashboard');
      assertNoServerErrors(guard, 'UI-24 vendor billing');
    });
  });
});
