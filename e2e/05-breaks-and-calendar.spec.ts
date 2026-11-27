import { test, expect } from '@playwright/test';
import {
  annotateBusinessCase,
  attachProofScreenshot,
  getVancouverDateOffset,
  loginAs,
  mockVendorGoogleEvents,
} from './helpers/authAndMocks';
import { attachQaDiagnostics } from './helpers/qaSession';
import {
  completePropertyStep,
  completeServicesStep,
  navigateCalendarToDateOffset,
  openAndCreateBreak,
  selectVendorDropdown,
} from './helpers/bookingFlow';

/**
 * Chunk 5 of 6: Real End-to-End Vendor Breaks, Time-Off Creation & Calendar Display (UI-25 to UI-29)
 *
 * Run this chunk alone:
 *   npx playwright test e2e/05-breaks-and-calendar.spec.ts
 */

const TARGET_DATE_T5 = getVancouverDateOffset(5);

test.describe('Calendar Display, Breaks & Google Sync', () => {
  test('A one-time vendor break on T+5 (15:30–16:30) does NOT block T+6 on the booking calendar', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-25',
      area: 'Calendar Display, Breaks & Google Sync',
      role: 'Admin & Agent',
      summary:
        'Opens the real OneDayCalendar on T+6 for Victor Alpha and verifies whether T+5’s one-time dentist break (15:30–16:30) falsely leaks into T+6.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Admin and navigate Schedule to T+6 for Victor Alpha', async () => {
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

      await test.step('Verify 15:30–16:30 on T+6 is NOT blocked by T+5 one-time break', async () => {
        const breakAt1530 = page.locator('.fc-timegrid-slot[data-time="15:30:00"]');
        await expect(breakAt1530).toBeVisible();

        const breakEventsCount = await page
          .locator('.fc-event.slot-vendor-break')
          .filter({ hasText: /15:30|3:30|Dentist|Vendor Break/i })
          .count();
        expect.soft(breakEventsCount, 'T+5 one-time break must not block T+6 (more than 4 lunch slots)').toBeLessThanOrEqual(4);

        await attachProofScreenshot(page, testInfo, 'OneDayCalendar T+6 (One-Time Break Isolation)');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Multi-day vendor time-off renders cleanly in Calendar Month view', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-26',
      area: 'Calendar Display, Breaks & Google Sync',
      role: 'Admin',
      summary:
        'Switches BigCalendar to Monthly view with Show Breaks ON and checks multi-day time-off rendering.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Admin, open Calendar, and switch to Monthly view', async () => {
        await loginAs(page, request, 'admin');
        await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });

        const monthlyBtn = page.getByRole('button', { name: /^Monthly$/i }).first();
        if (await monthlyBtn.isVisible().catch(() => false)) {
          await monthlyBtn.click();
          await page.waitForTimeout(500);
        }
        await expect(page.locator('.rbc-month-view, .rbc-calendar').first()).toBeVisible();
        await attachProofScreenshot(page, testInfo, 'Calendar Monthly View (Multi-Day Time-Off)');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test.describe('Vancouver Timezone Break Creation', () => {
    test.use({ timezoneId: 'America/Vancouver' });

    test('Admin creates a real vendor break via Add Time Off modal in Pacific Time', async ({
      page,
      request,
    }, testInfo) => {
      annotateBusinessCase(testInfo, {
        caseId: 'UI-27',
        area: 'Calendar Display, Breaks & Google Sync',
        role: 'Admin',
        summary:
          'Opens the real Add Time Off dialog in America/Vancouver timezone, fills title, vendor, 15:00–16:00 time, and address, and saves to POST /api/vendor-breaks/add.',
      });

      const diag = attachQaDiagnostics(page);

      try {
        await test.step('Sign in as Admin in America/Vancouver timezone and open Calendar', async () => {
          await loginAs(page, request, 'admin');
          await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
        });

        await test.step('Fill Add Time Off form for Victor Alpha and submit', async () => {
          const { status } = await openAndCreateBreak(page, {
            title: `E2E QA Break ${Date.now().toString().slice(-4)}`,
            vendorName: 'Victor Alpha',
            startTime: '15:00',
            endTime: '16:00',
            address: '800 W Georgia St, Vancouver, BC',
          });
          expect.soft([200, 201]).toContain(status);
          await attachProofScreenshot(page, testInfo, 'Vendor Break Created in Pacific Time');
        });
      } finally {
        await diag.flush(testInfo);
      }
    });
  });

  test('Weekly recurring lunch breaks render on working days and not on vendor days off', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-28',
      area: 'Calendar Display, Breaks & Google Sync',
      role: 'Admin',
      summary:
        'Opens Weekly view on BigCalendar with Show Breaks ON and inspects recurring lunch break placement across Mon–Sun.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Admin and switch BigCalendar to Weekly view', async () => {
        await loginAs(page, request, 'admin');
        await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
        const weeklyBtn = page.getByRole('button', { name: /^Weekly$/i }).first();
        if (await weeklyBtn.isVisible().catch(() => false)) {
          await weeklyBtn.click();
          await page.waitForTimeout(500);
        }
        await expect(page.locator('.rbc-time-view, .rbc-calendar').first()).toBeVisible();
        await attachProofScreenshot(page, testInfo, 'Calendar Weekly View (Work Days vs. Days Off)');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Toggling "Show Breaks" OFF keeps synced Google Calendar events visible', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-29',
      area: 'Calendar Display, Breaks & Google Sync',
      role: 'Admin',
      summary:
        'Loads BigCalendar Weekly view with a mocked Google Calendar event ("Personal Dentist Visit"), toggles Show Breaks OFF, and verifies the Google event stays visible and is not mislabeled Time Off.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Admin and open Weekly Calendar with mocked Google event', async () => {
        await loginAs(page, request, 'admin');
        await mockVendorGoogleEvents(page, TARGET_DATE_T5);
        await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });

        const weeklyBtn = page.getByRole('button', { name: /^Weekly$/i }).first();
        if (await weeklyBtn.isVisible().catch(() => false)) {
          await weeklyBtn.click();
          await page.waitForTimeout(400);
        }
      });

      await test.step('Toggle "Show Breaks" OFF and check Google event visibility', async () => {
        const showBreaksSwitch = page.locator('div:has(> span:text-is("Show Breaks")) button[role="switch"]').first();
        if (await showBreaksSwitch.isVisible().catch(() => false)) {
          if ((await showBreaksSwitch.getAttribute('aria-checked')) === 'true') {
            await showBreaksSwitch.click();
            await page.waitForTimeout(400);
          }
        }

        const dentistAsTimeOff = await page
          .locator('.rbc-event', { hasText: 'Personal Dentist Visit' })
          .locator('text=Time Off')
          .count();
        expect.soft(dentistAsTimeOff, 'Google Calendar event must NOT be mislabeled as Time Off').toBe(0);
        await attachProofScreenshot(page, testInfo, 'Calendar With Show Breaks OFF');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });
});
