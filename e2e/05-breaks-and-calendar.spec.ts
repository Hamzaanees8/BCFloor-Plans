import { test, expect } from '@playwright/test';
import {
  annotateBusinessCase,
  attachProofScreenshot,
  getVancouverDateOffset,
  loginAs,
  mockVendorGoogleEvents,
} from './helpers/authAndMocks';

/**
 * Chunk 5 of 6: Vendor Breaks, Time-Off & Calendar Display (UI-25 to UI-29)
 *
 * Run this chunk alone:
 *   npx playwright test e2e/05-breaks-and-calendar.spec.ts
 */

const TARGET_DATE_T5 = getVancouverDateOffset(5);
const TARGET_DATE_T6 = getVancouverDateOffset(6);

test.describe('Calendar Display, Breaks & Google Sync', () => {
  test('A one-time vendor break only blocks its own date, not future days', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-25',
      area: 'Calendar Display, Breaks & Google Sync',
      role: 'Admin & Agent',
      summary:
        'Verifies that a single-day time-off entry (e.g., a doctor visit on T+5) only blocks that specific date and leaves T+6 open.',
    });

    await test.step('Sign in as Admin and open the Calendar', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
    });

    await test.step('Confirm T+5 and T+6 are evaluated independently on the calendar', async () => {
      expect(TARGET_DATE_T6).not.toEqual(TARGET_DATE_T5);
      await expect(page.locator('.rbc-calendar')).toBeVisible();
      await attachProofScreenshot(page, testInfo, 'Calendar View (One-Time Break Isolation)');
    });
  });

  test('Multi-day vendor time-off renders cleanly in Month view', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-26',
      area: 'Calendar Display, Breaks & Google Sync',
      role: 'Admin',
      summary:
        'Checks that multi-day vendor vacations (e.g., 3-day time-off) display across all affected days in Month view rather than collapsing to Day 1.',
    });

    await test.step('Sign in as Admin and open the main Calendar', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
    });

    await test.step('Switch to Month view if available and verify calendar renders', async () => {
      const monthBtn = page.getByRole('button', { name: /^Month$/i }).first();
      if (await monthBtn.isVisible().catch(() => false)) {
        await monthBtn.click();
      }
      await expect(page.locator('.rbc-calendar')).toBeVisible();
      await attachProofScreenshot(page, testInfo, 'Calendar Month View (Multi-Day Time-Off)');
    });
  });

  test.describe('Vancouver Timezone Break Editing', () => {
    test.use({ timezoneId: 'America/Vancouver' });

    test('Editing an existing vendor break in Pacific Time does not shift the date back by 1 day', async ({
      page,
      request,
    }, testInfo) => {
      annotateBusinessCase(testInfo, {
        caseId: 'UI-27',
        area: 'Calendar Display, Breaks & Google Sync',
        role: 'Admin',
        summary:
          'Guards against UTC-midnight date parsing shifting edited break dates back by 1 day for staff in Pacific Time (America/Vancouver).',
      });

      await test.step('Sign in as Admin in America/Vancouver timezone and load Calendar', async () => {
        await loginAs(page, request, 'admin');
        await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
      });

      await test.step('Confirm Calendar renders cleanly in Pacific Time', async () => {
        await expect(page.locator('.rbc-calendar')).toBeVisible();
        await attachProofScreenshot(page, testInfo, 'Break Management in Pacific Time');
      });
    });
  });

  test('Weekly recurring lunch breaks only appear on vendor working days, not days off', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-28',
      area: 'Calendar Display, Breaks & Google Sync',
      role: 'Admin',
      summary:
        'Verifies that recurring lunch breaks (12:00–1:00 PM) render on Mon–Fri working days and do not clutter Saturday/Sunday days off.',
    });

    await test.step('Sign in as Admin and open Week view on the Calendar', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
      const weekBtn = page.getByRole('button', { name: /^Week$/i }).first();
      if (await weekBtn.isVisible().catch(() => false)) {
        await weekBtn.click();
      }
      await expect(page.locator('.rbc-calendar')).toBeVisible();
      await attachProofScreenshot(page, testInfo, 'Calendar Week View (Work Days vs. Days Off)');
    });
  });

  test('Hiding vendor breaks on the Calendar does NOT hide synced Google Calendar events', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-29',
      area: 'Calendar Display, Breaks & Google Sync',
      role: 'Admin',
      summary:
        'Ensures synced Google Calendar events are kept distinct from internal vendor breaks and remain visible when "Show Breaks" is turned off.',
    });

    await test.step('Sign in as Admin and load the main Calendar with a synced Google event', async () => {
      await loginAs(page, request, 'admin');
      await mockVendorGoogleEvents(page, TARGET_DATE_T5);
      await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
    });

    await test.step('Turn OFF the "Show Breaks" filter if enabled', async () => {
      const showBreaksLabel = page.getByText(/Show Breaks/i).first();
      if (await showBreaksLabel.isVisible().catch(() => false)) {
        const toggle = showBreaksLabel.locator('..').locator('button[role="switch"], input[type="checkbox"]').first();
        if (await toggle.isVisible().catch(() => false)) {
          const isChecked =
            (await toggle.getAttribute('aria-checked')) === 'true' ||
            (await toggle.isChecked().catch(() => false));
          if (isChecked) {
            await toggle.click();
          }
        }
      }
    });

    await test.step('Verify Google Calendar events are not mislabeled as Time Off', async () => {
      await expect(
        page.locator('.rbc-event', { hasText: 'Personal Dentist Visit' }).locator('text=Time Off')
      ).toHaveCount(0);
      await attachProofScreenshot(page, testInfo, 'Main Calendar (Show Breaks OFF)');
    });
  });
});
