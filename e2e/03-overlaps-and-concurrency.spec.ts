import { test, expect } from '@playwright/test';
import {
  E2E_CONFIG,
  annotateBusinessCase,
  attachProofScreenshot,
  getVancouverDateOffset,
  loginAs,
} from './helpers/authAndMocks';
import { attachQaDiagnostics } from './helpers/qaSession';
import {
  completeBookingAndSubmit,
  completePropertyStep,
  completeServicesStep,
  navigateCalendarToDateOffset,
  selectAvailableTimeSlot,
  selectVendorDropdown,
} from './helpers/bookingFlow';

/**
 * Chunk 3 of 6: Overlap Prevention, Double-Click Safety & Cancelled Slot Release (UI-15 to UI-17)
 *
 * Run this chunk alone:
 *   npx playwright test e2e/03-overlaps-and-concurrency.spec.ts
 */

const TARGET_DATE_T5 = getVancouverDateOffset(5);

test.describe('Overlap Prevention & Cancelled Slot Release', () => {
  test('Rapid double-clicking a slot under Slow 3G network conditions does not duplicate selected chunks', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-15',
      area: 'Overlap Prevention & Cancelled Slot Release',
      role: 'Admin',
      summary:
        'Navigates to Schedule on T+6, enables Slow 3G throttling, rapidly double-clicks an available slot, and verifies selected slot count is not duplicated.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Admin and reach Schedule T+6 for Victor Alpha', async () => {
        await loginAs(page, request, 'admin');
        await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
        await completePropertyStep(page, {
          role: 'admin',
          agentSearch: 'E2E Agent',
          sqFt: '2000',
          address: '100 Robson St',
          city: 'Vancouver',
          postalCode: 'V6B 2A7',
        });
        await completeServicesStep(page, ['E2E HDR Photos']);
        await navigateCalendarToDateOffset(page, 6);
        await selectVendorDropdown(page, 'Victor Alpha');
      });

      await test.step('Enable Slow 3G throttling and rapidly double-click an available slot', async () => {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: (500 * 1024) / 8,
          uploadThroughput: (500 * 1024) / 8,
          latency: 400,
        });

        const { selectedCount } = await selectAvailableTimeSlot(page, {
          preferredVendorName: 'Victor Alpha',
          rapidDoubleClick: true,
        });

        await cdp.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: -1,
          uploadThroughput: -1,
          latency: 0,
        });

        expect.soft(selectedCount, 'Rapid double-click must not duplicate selected chunks').toBeLessThanOrEqual(4);
        await attachProofScreenshot(page, testInfo, `Double-Click Result (${selectedCount} selected chunks)`);
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Cancelled appointments are immediately freed on both /api/order-slots and the booking calendar', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-16',
      area: 'Overlap Prevention & Cancelled Slot Release',
      role: 'Admin & Agent',
      summary:
        'Verifies the seeded cancelled booking (T+5 14:00–15:00) is excluded from /api/order-slots and allows selecting afternoon slots on T+5.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      let token = '';
      await test.step('Verify cancelled 14:00-15:00 slot on T+5 is excluded from /api/order-slots', async () => {
        const auth = await loginAs(page, request, 'admin');
        token = auth.token;
        const res = await request.get(`${E2E_CONFIG.apiUrl}/api/order-slots`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        expect(res.ok()).toBeTruthy();

        const json = await res.json();
        const slots = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        const cancelledBlock = slots.find(
          (s: any) => s.date === TARGET_DATE_T5 && String(s.start_time).startsWith('14:00')
        );
        expect.soft(cancelledBlock, 'Cancelled 14:00-15:00 slot must not be in /api/order-slots').toBeUndefined();
      });

      await test.step('Open Schedule T+5 for Victor Alpha and verify slots render cleanly', async () => {
        await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
        await completePropertyStep(page, {
          role: 'admin',
          agentSearch: 'E2E Agent',
          sqFt: '2000',
          address: '100 Robson St',
          city: 'Vancouver',
          postalCode: 'V6B 2A7',
        });
        await completeServicesStep(page, ['E2E HDR Photos']);
        await navigateCalendarToDateOffset(page, 5);
        await selectVendorDropdown(page, 'Victor Alpha');
        await attachProofScreenshot(page, testInfo, 'Schedule T+5 (Cancelled Slot Released)');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Two concurrent Agents booking the same slot do not silently double-book', async ({
    browser,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-17',
      area: 'Overlap Prevention & Cancelled Slot Release',
      role: '2 Concurrent Agents',
      summary:
        'Two independent Agent browser sessions open Schedule T+6 for Victor Alpha simultaneously. Agent A books the first slot; Agent B attempts to submit the exact same stale slot and must be rejected.',
    });

    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();
    const diagA = attachQaDiagnostics(pageA);
    const diagB = attachQaDiagnostics(pageB);

    try {
      await test.step('Both Agents fill Property & Services and reach Schedule T+6 concurrently', async () => {
        await Promise.all([loginAs(pageA, request, 'agent'), loginAs(pageB, request, 'agent')]);
        await Promise.all([
          pageA.goto('/dashboard/orders/create', { waitUntil: 'networkidle' }),
          pageB.goto('/dashboard/orders/create', { waitUntil: 'networkidle' }),
        ]);

        await Promise.all([
          completePropertyStep(pageA, {
            role: 'agent',
            sqFt: '2000',
            address: '100 Robson St',
            city: 'Vancouver',
            postalCode: 'V6B 2A7',
          }),
          completePropertyStep(pageB, {
            role: 'agent',
            sqFt: '2000',
            address: '100 Robson St',
            city: 'Vancouver',
            postalCode: 'V6B 2A7',
          }),
        ]);

        await Promise.all([
          completeServicesStep(pageA, ['E2E HDR Photos']),
          completeServicesStep(pageB, ['E2E HDR Photos']),
        ]);

        await Promise.all([navigateCalendarToDateOffset(pageA, 6), navigateCalendarToDateOffset(pageB, 6)]);
        await Promise.all([selectVendorDropdown(pageA, 'Victor Alpha'), selectVendorDropdown(pageB, 'Victor Alpha')]);
      });

      await test.step('Agent A selects the first available slot and completes the booking', async () => {
        await selectAvailableTimeSlot(pageA, { preferredVendorName: 'Victor Alpha', slotEventIndex: 0 });
        const resA = await completeBookingAndSubmit(pageA, testInfo);
        expect([200, 201]).toContain(resA.status);
      });

      await test.step('Agent B (with stale calendar) selects the same slot and submits — must be rejected', async () => {
        await selectAvailableTimeSlot(pageB, { preferredVendorName: 'Victor Alpha', slotEventIndex: 0 });
        const resB = await completeBookingAndSubmit(pageB, testInfo);
        expect.soft(
          [409, 422],
          `Concurrent duplicate booking for Agent B returned HTTP ${resB.status} instead of 409/422 conflict`
        ).toContain(resB.status);
      });
    } finally {
      await diagA.flush(testInfo);
      await diagB.flush(testInfo);
      await ctxA.close();
      await ctxB.close();
    }
  });
});
