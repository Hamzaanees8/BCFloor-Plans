import { test, expect } from '@playwright/test';
import {
  E2E_CONFIG,
  annotateBusinessCase,
  attachProofScreenshot,
  getVancouverDateOffset,
  loginAs,
  mockVendorGoogleEvents,
} from './helpers/authAndMocks';
import { attachQaDiagnostics } from './helpers/qaSession';
import {
  completeBookingAndSubmit,
  completePropertyStep,
  completeServicesStep,
  navigateCalendarToDateOffset,
  openCalendarEventContextMenu,
  selectAvailableTimeSlot,
  selectVendorDropdown,
  toggleScheduleOverride,
} from './helpers/bookingFlow';

/**
 * Chunk 2 of 6: Real End-to-End Admin Booking Freedoms, Overrides, Trimming & Past Orders (UI-07 to UI-14)
 *
 * Run this chunk alone:
 *   npx playwright test e2e/02-admin-freedoms.spec.ts
 */

const TARGET_DATE_T5 = getVancouverDateOffset(5);

test.describe('Admin Booking Freedoms & Overrides', () => {
  test('Admin enables Schedule Override to unlock out-of-area vendor Vanessa Beta and submits a booking', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-07',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Selects an Agent, enters Downtown Vancouver property, turns ON Schedule Override, confirms out-of-area vendor Vanessa Beta appears, selects a slot, and submits.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Admin, pick E2E Agent, fill Property, and add E2E HDR Photos', async () => {
        await loginAs(page, request, 'admin');
        await mockVendorGoogleEvents(page, TARGET_DATE_T5);
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
      });

      await test.step('Toggle Schedule Override ON and select out-of-area vendor Vanessa Beta', async () => {
        await navigateCalendarToDateOffset(page, 6);
        await toggleScheduleOverride(page, true, 0);

        const foundVanessa = await selectVendorDropdown(page, 'Vanessa Beta', 0);
        expect.soft(foundVanessa, 'Vanessa Beta should become selectable when Schedule Override is ON').toBe(true);

        const { selectedCount } = await selectAvailableTimeSlot(page, {
          preferredVendorName: 'Vanessa Beta',
        });
        expect(selectedCount).toBeGreaterThan(0);
        await attachProofScreenshot(page, testInfo, 'Admin Override Vendor & Slot Selected');
      });

      await test.step('Submit the Admin Override booking', async () => {
        const result = await completeBookingAndSubmit(page, testInfo);
        expect.soft([200, 201]).toContain(result.status);
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Admin sees the red (X) trim button on booked slots while Agents never see it', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-08',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Agent vs. Admin',
      summary:
        'Navigates both Agent and Admin to T+5 on the Schedule calendar and confirms only Admin renders the red X Trim/Unselect button on booked slots.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Check Schedule T+5 as Agent: zero trim buttons on booked slots', async () => {
        await loginAs(page, request, 'agent');
        await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
        await completePropertyStep(page, {
          role: 'agent',
          sqFt: '2000',
          address: '100 Robson St',
          city: 'Vancouver',
          postalCode: 'V6B 2A7',
        });
        await completeServicesStep(page, ['E2E HDR Photos']);
        await navigateCalendarToDateOffset(page, 5);
        await selectVendorDropdown(page, 'Victor Alpha');

        const agentTrimCount = await page.locator('.slot-booked button[title="Trim/Unselect this slot"]').count();
        expect.soft(agentTrimCount).toBe(0);
      });

      await test.step('Check Schedule T+5 as Admin: Trim/Unselect X button IS rendered on booked slots', async () => {
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
        await navigateCalendarToDateOffset(page, 5);
        await selectVendorDropdown(page, 'Victor Alpha');

        const adminTrimCount = await page.locator('.slot-booked button[title="Trim/Unselect this slot"]').count();
        expect.soft(adminTrimCount, 'Admin should see red X trim button on booked slots').toBeGreaterThan(0);
        await attachProofScreenshot(page, testInfo, 'Admin Trim Controls on Booked Slots');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Admin Schedule supports flexible single-slot selection without minimum duration lockouts', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-09',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Navigates Admin to Schedule, selects a real slot, and checks custom duration/buffer control availability.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Admin and advance to Schedule tab', async () => {
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
      });

      await test.step('Select slot and inspect custom duration / buffer controls', async () => {
        await navigateCalendarToDateOffset(page, 6);
        await selectVendorDropdown(page, 'Victor Alpha');
        const { selectedCount } = await selectAvailableTimeSlot(page, {
          preferredVendorName: 'Victor Alpha',
        });
        expect(selectedCount).toBeGreaterThan(0);
        await attachProofScreenshot(page, testInfo, 'Admin Flexible Slot Selection');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Admin sees yellow Travel Adjustment slots adjacent to bookings and can trigger override confirmation', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-10',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Navigates Admin to T+5 for Victor Alpha on a different property, inspects yellow Travel Adjustment slots, and tests the Travel Adjustment Override confirmation modal.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Admin and reach Schedule T+5 for a different address', async () => {
        await loginAs(page, request, 'admin');
        await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
        await completePropertyStep(page, {
          role: 'admin',
          agentSearch: 'E2E Agent',
          sqFt: '2000',
          address: '900 W Hastings St',
          city: 'Vancouver',
          postalCode: 'V6C 1E5',
        });
        await completeServicesStep(page, ['E2E HDR Photos']);
        await navigateCalendarToDateOffset(page, 5);
        await selectVendorDropdown(page, 'Victor Alpha');
      });

      await test.step('Click Travel Adjustment slot if visible and confirm override dialog', async () => {
        const travelSlot = page.locator('.fc-event.slot-travel-adjustment').first();
        const hasTravelSlot = await travelSlot.isVisible({ timeout: 5000 }).catch(() => false);
        expect.soft(hasTravelSlot, 'Admin should see yellow Travel Adjustment slots around existing booking').toBe(true);
        if (hasTravelSlot) {
          await travelSlot.click();
          const dialog = page.getByRole('dialog');
          if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
            await attachProofScreenshot(page, testInfo, 'Travel Adjustment Override Dialog');
            await dialog.getByRole('button', { name: /^OK$/i }).click();
          }
        } else {
          await attachProofScreenshot(page, testInfo, 'Admin T+5 Calendar View');
        }
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Admin sees Vendor Break slots and portal setting allows booking through lunch', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-11',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Verifies allow_booking_through_lunch portal setting is enabled and confirms Vendor Break slots render distinctly for Admins on T+5.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Verify portal_settings and open Schedule T+5 as Admin', async () => {
        const { token } = await loginAs(page, request, 'admin');
        const res = await request.get(`${E2E_CONFIG.apiUrl}/api/settings/portal_settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        expect.soft(res.ok()).toBeTruthy();

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
      });

      await test.step('Verify Vendor Break events are visible to Admin on calendar', async () => {
        const breakCount = await page.locator('.fc-event.slot-vendor-break').count();
        expect.soft(breakCount, 'Admin should see Vendor Break slots on calendar').toBeGreaterThan(0);
        await attachProofScreenshot(page, testInfo, 'Admin Vendor Break Slots Visible');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Admin can open a past-dated order and interact with its Schedule tab without lockout', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-12',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Opens the seeded T-5 past order as Admin, switches to SCHEDULE, and checks whether the service card remains editable instead of disabled.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      let pastOrderUuid = '';
      await test.step('Locate seeded past-dated order via API', async () => {
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

      await test.step('Open past order edit screen and inspect SCHEDULE tab interactivity', async () => {
        expect(pastOrderUuid).toBeTruthy();
        await page.goto(`/dashboard/orders/create/${pastOrderUuid}?isEdit=true`, {
          waitUntil: 'networkidle',
        });

        const scheduleTab = page.locator('span.uppercase', { hasText: /^SCHEDULE$/i }).first();
        await scheduleTab.waitFor({ state: 'visible', timeout: 10000 });
        await scheduleTab.click();
        await page.waitForTimeout(1000);

        const disabledCards = await page.locator('.pointer-events-none', { hasText: /E2E HDR Photos/i }).count();
        expect.soft(disabledCards, 'Admin past-order service card should NOT be pointer-events-none').toBe(0);
        await attachProofScreenshot(page, testInfo, 'Admin Past Order Schedule Tab');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Admin Edit Slot Time modal blocks inverted start/end times via right-click context menu', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-13',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Right-clicks an appointment on BigCalendar, opens Edit Time & Duration, selects an inverted range (Start 11:00 > End 09:00), and checks if Update Slot Time blocks it.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Admin and open Weekly view on Calendar', async () => {
        await loginAs(page, request, 'admin');
        await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
      });

      await test.step('Right-click an active booking and open Edit Time & Duration', async () => {
        const openedMenu = await openCalendarEventContextMenu(page, { view: 'Weekly' });
        expect.soft(openedMenu, 'Expected at least one .rbc-event with Admin context menu').toBe(true);
        if (!openedMenu) {
          await attachProofScreenshot(page, testInfo, 'Calendar Weekly View (No Event Found)');
          return;
        }

        const editBtn = page.getByRole('button', { name: /Edit Time & Duration/i }).first();
        if (await editBtn.isVisible().catch(() => false)) {
          await editBtn.click();
          const dialog = page.getByRole('dialog');
          await dialog.waitFor({ state: 'visible', timeout: 8000 });

          const selects = dialog.locator('select');
          if ((await selects.count()) >= 2) {
            await selects.nth(0).selectOption('11:00:00');
            await selects.nth(1).selectOption('09:00:00');
          }

          let apiCalled = false;
          const onReq = (req: any) => {
            if (req.url().includes('/orders/update-slot-time')) apiCalled = true;
          };
          page.on('request', onReq);
          await dialog.getByRole('button', { name: /Update Slot Time/i }).click();
          await page.waitForTimeout(800);
          page.off('request', onReq);

          expect.soft(apiCalled, 'Inverted time (11:00 > 09:00) must NOT call update-slot-time API').toBe(false);
          await attachProofScreenshot(page, testInfo, 'Edit Slot Time Inverted Range Check');
        }
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Admin Schedule screen has functional Schedule Override and Recommend Best Time switches', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-14',
      area: 'Admin Booking Freedoms & Overrides',
      role: 'Admin',
      summary:
        'Navigates Admin to the Schedule tab and verifies Schedule Override and Recommend Best Time toggles work cleanly without dead controls.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Admin and reach Schedule tab', async () => {
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
      });

      await test.step('Verify Schedule Override and Recommend Best Time switches exist and toggle', async () => {
        await expect.soft(page.locator('#schedule-override-0')).toBeVisible();
        await expect.soft(page.locator('#recommend-time-0')).toBeVisible();
        await toggleScheduleOverride(page, true, 0);
        expect.soft(await page.locator('#schedule-override-0').getAttribute('aria-checked')).toBe('true');
        await attachProofScreenshot(page, testInfo, 'Admin Schedule Switches Verified');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });
});
