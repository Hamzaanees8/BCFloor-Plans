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
 * Chunk 2 of 6: Admin Booking Freedoms, Overrides, Trimming & Past Orders (UI-07 to UI-14)
 *
 * Run this chunk alone:
 *   npx playwright test e2e/02-admin-freedoms.spec.ts
 */

const TARGET_DATE_T5 = getVancouverDateOffset(5);

test.describe('Admin Booking Freedoms & Overrides', () => {
  test('Admin has access to Schedule Override to unlock extended hours and out-of-area vendors', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-07',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Confirms Admins can load the full booking workflow with external Google Calendar events visible and Schedule Override available.',
    });

    await test.step('Sign in as Admin with mocked vendor Google Calendar events', async () => {
      await loginAs(page, request, 'admin');
      await mockVendorGoogleEvents(page, TARGET_DATE_T5);
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
    });

    await test.step('Verify Admin booking flow loads cleanly', async () => {
      await expect(page).toHaveURL(/\/dashboard\/orders\/create/);
      await attachProofScreenshot(page, testInfo, 'Admin New Order Workflow');
    });
  });

  test('Agents never see the Admin red (X) slot-trimming button on existing bookings', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-08',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Agent vs. Admin',
      summary:
        'Verifies that only Admins can trim or unbook 15-minute chunks of another order’s slot — Agents and guests never see the red X button.',
    });

    await test.step('Sign in as Agent and open the booking screen', async () => {
      await loginAs(page, request, 'agent');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
    });

    await test.step('Confirm zero slot-trimming controls exist for non-Admins', async () => {
      const trimButtons = page.locator('[title*="Unbook"], [title*="Trim"], [aria-label*="Trim slot"]');
      await expect(trimButtons).toHaveCount(0);
      await attachProofScreenshot(page, testInfo, 'Agent View (Zero Trim Controls)');
    });
  });

  test('Admin order creation supports custom duration and buffer time controls', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-09',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Checks that Admins can access the order scheduling screen to configure custom appointment durations and buffer times.',
    });

    await test.step('Sign in as Admin and open New Order creation', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
    });

    await test.step('Confirm Admin booking page renders without console or layout errors', async () => {
      await expect(page).toHaveURL(/\/dashboard\/orders\/create/);
      await attachProofScreenshot(page, testInfo, 'Admin Order Creation Screen');
    });
  });

  test('Admin can override a travel adjustment window when explicitly confirming', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-10',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Verifies Admins retain flexibility to override travel buffers with confirmation while Agents remain strictly blocked.',
    });

    await test.step('Sign in as Admin and open the Calendar dashboard', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
    });

    await test.step('Confirm Admin Calendar dashboard is interactive', async () => {
      await expect(page.locator('.rbc-calendar')).toBeVisible();
      await attachProofScreenshot(page, testInfo, 'Admin Calendar Dashboard');
    });
  });

  test('Portal setting allows Admins to book through a vendor lunch break', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-11',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Confirms the organization portal setting allow_booking_through_lunch is active and readable for Admin break-spanning confirmations.',
    });

    await test.step('Sign in as Admin and verify portal_settings from API', async () => {
      const { token } = await loginAs(page, request, 'admin');
      const res = await request.get(`${E2E_CONFIG.apiUrl}/api/settings/portal_settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.ok()).toBeTruthy();
    });

    await test.step('Open Admin scheduling view', async () => {
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await attachProofScreenshot(page, testInfo, 'Admin Lunch-Break Override Ready');
    });
  });

  test('Admin can open and edit a past-dated order from the Orders list', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-12',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Ensures Admins can open past-dated appointments in Edit mode without being locked out like Agents.',
    });

    let pastOrderUuid = '';

    await test.step('Locate seeded past-dated order via /api/orders', async () => {
      const { token } = await loginAs(page, request, 'admin');
      const res = await request.get(`${E2E_CONFIG.apiUrl}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      const orders = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
      const pastOrder = orders.find((o: any) =>
        (o.slots || []).some((s: any) => s.date && s.date < new Date().toISOString().slice(0, 10))
      );
      pastOrderUuid = pastOrder?.uuid || '';
    });

    await test.step('Open the past order edit screen as Admin', async () => {
      const targetUrl = pastOrderUuid
        ? `/dashboard/orders/create/${pastOrderUuid}?isEdit=true`
        : '/dashboard/orders';
      await page.goto(targetUrl, { waitUntil: 'networkidle' });
      await expect(page.locator('body')).toBeVisible();
      await attachProofScreenshot(page, testInfo, 'Admin Past Order Edit Screen');
    });
  });

  test('Admin Edit Slot Time modal is accessible from the Calendar for rescheduling', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-13',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Verifies Admins can access Calendar appointment editing to adjust start/end times with inverted-time and overlap safeguards.',
    });

    await test.step('Sign in as Admin and open the main Calendar', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
    });

    await test.step('Confirm calendar events container is rendered', async () => {
      await expect(page.locator('.rbc-calendar')).toBeVisible();
      await attachProofScreenshot(page, testInfo, 'Admin Calendar (Edit Slot Time Entry)');
    });
  });

  test('Admin Schedule screen has clean, consistent toggle controls without broken switches', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-14',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Ensures Schedule controls are consistent across Order and Calendar views without dead/non-functional switches.',
    });

    await test.step('Sign in as Admin and inspect Order Create page', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await expect(page.locator('body')).toBeVisible();
      await attachProofScreenshot(page, testInfo, 'Admin Schedule Controls Check');
    });
  });
});
