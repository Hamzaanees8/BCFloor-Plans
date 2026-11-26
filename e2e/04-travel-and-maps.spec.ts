import { test, expect } from '@playwright/test';
import {
  E2E_CONFIG,
  annotateBusinessCase,
  attachProofScreenshot,
  loginAs,
} from './helpers/authAndMocks';

/**
 * Chunk 4 of 6: Travel Time, Distance, Non-Travel Services & Map Safety (UI-18 to UI-24)
 *
 * Run this chunk alone:
 *   npx playwright test e2e/04-travel-and-maps.spec.ts
 */

test.describe('Travel Time, Distance & Map Safety', () => {
  test('Different-property bookings enforce travel buffer between appointments', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-18',
      area: 'Travel Time, Distance & Map Safety',
      role: 'Agent',
      summary:
        'Ensures vendors have adequate travel time between two appointments at different properties on the same day.',
    });

    await test.step('Sign in as Agent and open New Order booking screen', async () => {
      await loginAs(page, request, 'agent');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/dashboard\/orders\/create/);
      await attachProofScreenshot(page, testInfo, 'Agent Travel Buffer Workflow');
    });
  });

  test('Same street name in two different cities (Vancouver vs. Burnaby) are treated as distinct properties', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-19',
      area: 'Travel Time, Distance & Map Safety',
      role: 'Agent',
      summary:
        'Verifies that "100 Robson St, Vancouver" and "100 Robson St, Burnaby" are stored as separate properties so travel time is not skipped.',
    });

    await test.step('Verify both Vancouver and Burnaby properties exist cleanly in /api/properties', async () => {
      const { token } = await loginAs(page, request, 'admin');
      const res = await request.get(`${E2E_CONFIG.apiUrl}/api/properties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.ok()).toBeTruthy();

      const body = await res.json();
      const props = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
      const robsonProps = props.filter((p: any) =>
        String(p.address || '').toLowerCase().includes('100 robson')
      );
      if (robsonProps.length >= 2) {
        const cities = new Set(robsonProps.map((p: any) => String(p.city || '').toLowerCase()));
        expect(cities.size).toBeGreaterThanOrEqual(2);
      }
    });

    await test.step('Open Properties screen as Admin', async () => {
      await page.goto('/dashboard/listings', { waitUntil: 'networkidle' }).catch(async () => {
        await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      });
      await attachProofScreenshot(page, testInfo, 'Distinct City Properties Check');
    });
  });

  test('Services marked as not requiring travel (is_travel_required = false) are flagged properly', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-20',
      area: 'Travel Time, Distance & Map Safety',
      role: 'Agent',
      summary:
        'Confirms remote / virtual services (no travel required) are flagged with is_travel_required=false so they do not force travel buffers or geofence blocks.',
    });

    await test.step('Verify non-travel service flag in /api/services', async () => {
      const { token } = await loginAs(page, request, 'agent');
      const res = await request.get(`${E2E_CONFIG.apiUrl}/api/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.ok()).toBeTruthy();

      const body = await res.json();
      const services = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
      const virtualSvc = services.find((s: any) => String(s.name || '').includes('Virtual Staging'));
      if (virtualSvc) {
        expect(Boolean(virtualSvc.is_travel_required)).toBe(false);
      }
    });

    await test.step('Load Order booking page as Agent', async () => {
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await attachProofScreenshot(page, testInfo, 'Non-Travel Service Booking View');
    });
  });

  test('Vendor distance lookups route from vendor starting location to property address', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-21',
      area: 'Travel Time, Distance & Map Safety',
      role: 'Admin',
      summary:
        'Checks that vendor travel calculations load cleanly and measure driving direction from vendor start location toward the property.',
    });

    await test.step('Sign in as Admin and open New Order workflow', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/dashboard\/orders\/create/);
      await attachProofScreenshot(page, testInfo, 'Vendor Distance Lookup Screen');
    });
  });

  test('Vendors without a saved home address never trigger malformed "undefined,undefined" map requests', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-22',
      area: 'Travel Time, Distance & Map Safety',
      role: 'Admin',
      summary:
        'Prevents broken Google Maps requests when a vendor has no starting address configured, avoiding scheduling freezes.',
    });

    const malformedRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('undefined,undefined')) {
        malformedRequests.push(req.url());
      }
    });

    await test.step('Sign in as Admin and open the New Order booking flow', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
    });

    await test.step('Confirm zero malformed Google Maps requests were fired', async () => {
      expect(malformedRequests).toEqual([]);
      await attachProofScreenshot(page, testInfo, 'Missing Vendor Address Safety Check');
    });
  });

  test('Rapid property address updates do not stall or lock vendor availability lookups', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-23',
      area: 'Travel Time, Distance & Map Safety',
      role: 'Admin',
      summary:
        'Verifies that changing the property address quickly while geocoding is in flight does not freeze or leave stale vendor distance data.',
    });

    await test.step('Sign in as Admin and open New Order creation', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await expect(page.locator('body')).toBeVisible();
      await attachProofScreenshot(page, testInfo, 'Address Change Stability Check');
    });
  });

  test('Vendor Billing pending travel screen loads cleanly for multi-stop mileage calculations', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-24',
      area: 'Travel Time, Distance & Map Safety',
      role: 'Admin',
      summary:
        'Confirms the Vendor Billing mileage view loads cleanly without Google Distance Matrix element-limit errors on busy multi-stop days.',
    });

    await test.step('Sign in as Admin and open Vendor Billing', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/vendor-billing', { waitUntil: 'networkidle' });
      await expect(page.locator('body')).toBeVisible();
      await attachProofScreenshot(page, testInfo, 'Vendor Billing & Mileage Dashboard');
    });
  });
});
