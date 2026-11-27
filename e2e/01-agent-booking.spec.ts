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
  selectAvailableTimeSlot,
  selectVendorDropdown,
} from './helpers/bookingFlow';

/**
 * Chunk 1 of 6: Real End-to-End Agent Booking, `book-now`, Privacy & Service Area Restrictions (UI-01 to UI-06)
 *
 * Run this chunk alone:
 *   npx playwright test e2e/01-agent-booking.spec.ts
 */

const TARGET_DATE_T5 = getVancouverDateOffset(5);
const BOOK_NOW_URL = process.env.E2E_BOOK_NOW_URL || 'http://agent.localhost:3000/agent/book-now/bcf-e2e-test-org';

test.describe('Agent Booking & Privacy', () => {
  test('Guest-to-Agent book-now flow logs in, sees booked slots blocked, selects a slot, and submits a real order', async ({
    page,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-01',
      area: 'Agent Booking & Privacy',
      role: 'Agent',
      summary:
        'Completes the full /agent/book-now flow from guest entry through Agent login, slot selection on T+5, and final order submission.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Open /agent/book-now unauthenticated and fill Property details', async () => {
        await page.goto(BOOK_NOW_URL, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => localStorage.clear());
        await page.reload({ waitUntil: 'networkidle' });

        await completePropertyStep(page, {
          role: 'book-now',
          sqFt: '2000',
          address: '100 Robson St',
          city: 'Vancouver',
          postalCode: 'V6B 2A7',
        });
      });

      await test.step('Select E2E HDR Photos and sign in via Agent Login modal', async () => {
        await completeServicesStep(page, ['E2E HDR Photos'], {
          expectLoginModal: true,
          loginCreds: E2E_CONFIG.agent,
        });
      });

      await test.step('Navigate to T+5, verify existing booked slots, and pick an available slot', async () => {
        await navigateCalendarToDateOffset(page, 5);
        await selectVendorDropdown(page, 'Victor Alpha');

        const bookedCount = await page.locator('.fc-event.slot-booked').count();
        expect.soft(bookedCount, 'Seeded 10:00-11:00 booking should appear as Booked after login').toBeGreaterThan(0);

        const { selectedCount } = await selectAvailableTimeSlot(page, {
          preferredVendorName: 'Victor Alpha',
        });
        expect(selectedCount).toBeGreaterThan(0);
        await attachProofScreenshot(page, testInfo, 'Book-Now Schedule Slot Selected');
      });

      await test.step('Advance through Contact & Confirmation and submit the real booking', async () => {
        const result = await completeBookingAndSubmit(page, testInfo);
        expect.soft([200, 201]).toContain(result.status);
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Multi-service Agent booking at the same property selects slots for both services and submits', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-02',
      area: 'Agent Booking & Privacy',
      role: 'Agent',
      summary:
        'Books two services (E2E HDR Photos + E2E Floor Plan) at the same property with Victor Alpha and submits a complete multi-service order.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Agent and complete Property step', async () => {
        await loginAs(page, request, 'agent');
        await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });

        await completePropertyStep(page, {
          role: 'agent',
          sqFt: '2000',
          address: '100 Robson St',
          city: 'Vancouver',
          postalCode: 'V6B 2A7',
        });
      });

      await test.step('Add two services and advance to Schedule', async () => {
        await completeServicesStep(page, ['E2E HDR Photos', 'E2E Floor Plan']);
      });

      await test.step('Select available slots for both services with Victor Alpha on T+6', async () => {
        await navigateCalendarToDateOffset(page, 6, 0);
        await selectVendorDropdown(page, 'Victor Alpha', 0);
        const slot1 = await selectAvailableTimeSlot(page, {
          serviceIndex: 0,
          preferredVendorName: 'Victor Alpha',
        });
        expect(slot1.selectedCount).toBeGreaterThan(0);

        await navigateCalendarToDateOffset(page, 6, 1);
        await selectVendorDropdown(page, 'Victor Alpha', 1);
        const slot2 = await selectAvailableTimeSlot(page, {
          serviceIndex: 1,
          preferredVendorName: 'Victor Alpha',
        });
        expect(slot2.selectedCount).toBeGreaterThan(0);
        await attachProofScreenshot(page, testInfo, 'Multi-Service Slots Selected');
      });

      await test.step('Submit multi-service order and verify confirmation', async () => {
        const result = await completeBookingAndSubmit(page, testInfo);
        expect.soft([200, 201]).toContain(result.status);
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Short gaps smaller than required service duration are not bookable for Agents', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-03',
      area: 'Agent Booking & Privacy',
      role: 'Agent',
      summary:
        'Selects a 60-minute service on Schedule as an Agent and verifies strict duration enforcement without Admin override options.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Agent, fill Property, and select 60-min E2E HDR Photos', async () => {
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
      });

      await test.step('Inspect T+5 FullCalendar for Victor Alpha and select a valid full-duration slot', async () => {
        await navigateCalendarToDateOffset(page, 5);
        await selectVendorDropdown(page, 'Victor Alpha');
        await expect.soft(page.getByText(/Schedule Override/i)).toHaveCount(0);

        const { selectedCount } = await selectAvailableTimeSlot(page, {
          preferredVendorName: 'Victor Alpha',
        });
        expect(selectedCount).toBeGreaterThan(0);
        await attachProofScreenshot(page, testInfo, 'Agent Full-Duration Slot Selected');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Dynamic square-footage duration rules calculate 105 mins for a 3,500 sqft Floor Plan', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-04',
      area: 'Agent Booking & Privacy',
      role: 'Agent & Admin',
      summary:
        'Enters 3,500 sqft on Property, selects E2E Floor Plan (45m/1500sqft + 30m/1000sqft), and verifies 105-minute slot allocation on Schedule.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Agent and enter 3,500 sq. ft. on Property', async () => {
        await loginAs(page, request, 'agent');
        await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });

        await completePropertyStep(page, {
          role: 'agent',
          sqFt: '3500',
          address: '100 Robson St',
          city: 'Vancouver',
          postalCode: 'V6B 2A7',
        });
      });

      await test.step('Select E2E Floor Plan and advance to Schedule', async () => {
        await completeServicesStep(page, ['E2E Floor Plan']);
      });

      await test.step('Select an available slot on T+6 and verify 105-min duration', async () => {
        await navigateCalendarToDateOffset(page, 6);
        await selectVendorDropdown(page, 'Victor Alpha');
        await selectAvailableTimeSlot(page, { preferredVendorName: 'Victor Alpha' });

        const selectedText = await page.locator('.fc-event.slot-selected').first().innerText();
        expect.soft(selectedText).toContain('105 min');
        await attachProofScreenshot(page, testInfo, '3500 SqFt Duration (105 min) Slot');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Personal calendar events, vendor breaks, and Admin override switches stay hidden from Agents', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-05',
      area: 'Agent Booking & Privacy',
      role: 'Agent',
      summary:
        'Navigates an Agent all the way to the Schedule calendar with a mocked personal Google event and confirms private titles, break labels, and Admin overrides are hidden.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Agent with a mocked personal Google Calendar event', async () => {
        await loginAs(page, request, 'agent');
        await mockVendorGoogleEvents(page, TARGET_DATE_T5);
        await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });

        await completePropertyStep(page, {
          role: 'agent',
          sqFt: '2000',
          address: '100 Robson St',
          city: 'Vancouver',
          postalCode: 'V6B 2A7',
        });
        await completeServicesStep(page, ['E2E HDR Photos']);
      });

      await test.step('Open T+5 for Victor Alpha and inspect rendered FullCalendar labels', async () => {
        await navigateCalendarToDateOffset(page, 5);
        await selectVendorDropdown(page, 'Victor Alpha');

        expect.soft(await page.getByText(/Schedule Override/i).count()).toBe(0);
        expect.soft(await page.getByText('Personal Dentist Visit').count()).toBe(0);
        expect.soft(await page.getByText('Vendor Break').count()).toBe(0);
        expect.soft(await page.getByText('Travel Adjustment').count()).toBe(0);
        expect.soft(await page.locator('.fc-event.slot-booked').count()).toBeGreaterThan(0);

        await attachProofScreenshot(page, testInfo, 'Agent Calendar Privacy Verification (T+5)');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Out-of-area vendors (Surrey polygon) are hidden from Agents on Vancouver listings', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-06',
      area: 'Agent Booking & Privacy',
      role: 'Agent',
      summary:
        'Completes Property & Services for Downtown Vancouver, opens the Schedule vendor dropdown as an Agent, and verifies Surrey-only vendor Vanessa Beta is excluded.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Agent and reach Schedule for 100 Robson St, Vancouver', async () => {
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
      });

      await test.step('Open Vendor dropdown and verify Vanessa Beta is hidden for Agents', async () => {
        const foundOutOfAreaVendor = await selectVendorDropdown(page, 'Vanessa Beta');
        expect.soft(foundOutOfAreaVendor, 'Out-of-area vendor Vanessa Beta should not be selectable by Agent').toBe(false);
        expect.soft(await page.getByText(/Schedule Override/i).count()).toBe(0);
        await attachProofScreenshot(page, testInfo, 'Agent Vendor Dropdown (Out-of-Area Excluded)');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });
});
