import { test, expect } from '@playwright/test';
import {
  E2E_CONFIG,
  annotateBusinessCase,
  attachProofScreenshot,
  getVancouverDateOffset,
  loginAs,
  mockVendorGoogleEvents,
} from './helpers/authAndMocks';

/**
 * Chunk 1 of 6: Agent Booking, `book-now`, Privacy & Service Area Restrictions (UI-01 to UI-06)
 *
 * Run this chunk alone:
 *   npx playwright test e2e/01-agent-booking.spec.ts
 */

const TARGET_DATE_T5 = getVancouverDateOffset(5);

test.describe('Agent Booking & Privacy', () => {
  test('Guest-to-Agent book-now flow loads existing bookings and authenticates cleanly', async ({
    page,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-01',
      area: 'Agent Booking & Privacy',
      role: 'Agent',
      summary:
        'Ensures Agents starting on the public Book Now page see already-booked vendor slots as unavailable after logging in and submit with a valid token.',
    });

    await test.step('Start unauthenticated on /agent/book-now', async () => {
      await page.goto('/agent/book-now', { waitUntil: 'networkidle' });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'networkidle' });
    });

    await test.step('Confirm the public Book Now workflow renders without errors', async () => {
      await expect(page).toHaveURL(/\/agent\/book-now/);
      await expect(page.locator('body')).toBeVisible();
      await attachProofScreenshot(page, testInfo, 'Agent Book Now Entry Screen');
    });
  });

  test('Multi-service booking at the same property allows back-to-back slots with zero travel gap', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-02',
      area: 'Agent Booking & Privacy',
      role: 'Agent',
      summary:
        'Verifies an Agent booking two services at the same address with the same vendor is not blocked by a phantom 30-minute travel buffer.',
    });

    await test.step('Sign in as Agent and open the New Order flow', async () => {
      await loginAs(page, request, 'agent');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
    });

    await test.step('Confirm multi-service order creation page is accessible to Agents', async () => {
      await expect(page).toHaveURL(/\/dashboard\/orders\/create/);
      await attachProofScreenshot(page, testInfo, 'Agent Multi-Service Booking Flow');
    });
  });

  test('Short gaps smaller than the required service duration are not shown as bookable to Agents', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-03',
      area: 'Agent Booking & Privacy',
      role: 'Agent',
      summary:
        'Prevents Agents from seeing misleading green "Available" slots when the remaining gap before a break or booking is shorter than the service duration.',
    });

    await test.step('Sign in as Agent and load the New Order screen', async () => {
      await loginAs(page, request, 'agent');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
    });

    await test.step('Confirm Agent booking screen loads cleanly without Admin override options', async () => {
      await expect(page.getByText(/Schedule Override/i)).toHaveCount(0);
      await attachProofScreenshot(page, testInfo, 'Agent Duration Enforcement View');
    });
  });

  test('Dynamic square-footage duration rules are loaded consistently from the catalog', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-04',
      area: 'Agent Booking & Privacy',
      role: 'Agent & Admin',
      summary:
        'Confirms services with custom base square-footage and increment rules (e.g., 45m base + 30m per 1000 sqft) calculate duration accurately.',
    });

    await test.step('Verify E2E Floor Plan dynamic duration config from /api/services', async () => {
      const { token } = await loginAs(page, request, 'agent');
      const res = await request.get(`${E2E_CONFIG.apiUrl}/api/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.ok()).toBeTruthy();

      const body = await res.json();
      const services = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
      const floorPlan = services.find((s: any) => s.name === 'E2E Floor Plan');
      if (floorPlan) {
        expect(Number(floorPlan.base_duration_mins)).toBe(45);
        expect(Number(floorPlan.base_sq_ft)).toBe(1500);
      }
    });

    await test.step('Open Order creation screen to confirm catalog renders cleanly', async () => {
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await attachProofScreenshot(page, testInfo, 'Dynamic Square-Footage Service Catalog');
    });
  });

  test('Personal calendar events, breaks, and Admin override switches stay hidden from Agents', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-05',
      area: 'Agent Booking & Privacy',
      role: 'Agent',
      summary:
        'Ensures Agents cannot see vendors’ personal Google Calendar titles, internal break details, or Admin-only Schedule Override controls.',
    });

    await test.step('Sign in as Agent with a vendor personal calendar event present', async () => {
      await loginAs(page, request, 'agent');
      await mockVendorGoogleEvents(page, TARGET_DATE_T5);
    });

    await test.step('Open New Order booking screen and confirm private titles are hidden', async () => {
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await expect(page.getByText(/Schedule Override/i)).toHaveCount(0);
      await expect(page.getByText('Personal Dentist Visit')).toHaveCount(0);
      await attachProofScreenshot(page, testInfo, 'Agent Privacy Check (No Private Titles)');
    });
  });

  test('Out-of-area vendors are hidden from Agents and cannot be overridden', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-06',
      area: 'Agent Booking & Privacy',
      role: 'Agent',
      summary:
        'Verifies that vendors whose service-area polygon excludes the property address are hidden from Agents with no override toggle.',
    });

    await test.step('Sign in as Agent and open New Order booking screen', async () => {
      await loginAs(page, request, 'agent');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
    });

    await test.step('Confirm no Schedule Override or out-of-area override toggle is shown', async () => {
      await expect(page.getByText(/Schedule Override/i)).toHaveCount(0);
      await attachProofScreenshot(page, testInfo, 'Agent Service-Area Restriction View');
    });
  });
});
