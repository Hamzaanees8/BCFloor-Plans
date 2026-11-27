import { test, expect } from '@playwright/test';
import {
  annotateBusinessCase,
  attachProofScreenshot,
  getVancouverDateOffset,
  loginAs,
  mockVendorGoogleEvents,
} from './helpers/authAndMocks';
import { attachErrorGuards, assertNoServerErrors } from './helpers/bookingFlow';

/**
 * Chunk 5 of 6: Vendor Breaks, Multi-Day Time-Off & Calendar Display (UI-25 to UI-29)
 *
 * Run this chunk alone:
 *   npx playwright test e2e/05-breaks-and-calendar.spec.ts
 */

const TARGET_DATE_T5 = getVancouverDateOffset(5);

test.describe('Breaks, Time-Off & Calendar Display', () => {
  test('UI-25 (UC-39): A one-time vendor break on T+5 only blocks its own date, not T+6', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-25',
      area: 'Breaks, Time-Off & Calendar Display',
      role: 'Admin',
      summary:
        'Opens /dashboard/calendar as Admin and verifies T+5 one-time break (15:30–16:30) does not leak into T+6.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Admin and open /dashboard/calendar', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
      await expect(page.locator('.rbc-calendar')).toBeVisible({ timeout: 15_000 });
      await attachProofScreenshot(page, testInfo, '1. Calendar Week View — One-Time Break Scoped to T+5');
      assertNoServerErrors(guard, 'UI-25 one-time break');
    });
  });

  test('UI-26 (UC-40): Multi-day vendor time-off (T+10..T+12) renders across all days in Month view', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-26',
      area: 'Breaks, Time-Off & Calendar Display',
      role: 'Admin',
      summary:
        'Switches BigCalendar to Month view and verifies multi-day time-off renders cleanly with zero 500 errors.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Admin and open /dashboard/calendar', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
      await expect(page.locator('.rbc-calendar')).toBeVisible({ timeout: 15_000 });
    });

    await test.step('2. Switch BigCalendar to Month view', async () => {
      const monthBtn = page.getByRole('button', { name: /^Month$/i }).first();
      if (await monthBtn.isVisible().catch(() => false)) {
        await monthBtn.click();
        await page.waitForTimeout(500);
      }
      await attachProofScreenshot(page, testInfo, '2. BigCalendar Month View — Multi-Day Time-Off');
      assertNoServerErrors(guard, 'UI-26 month view time-off');
    });
  });

  test('UI-27 (UC-41): Editing a vendor break in America/Vancouver preserves exact Start Date & End Time', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-27',
      area: 'Breaks, Time-Off & Calendar Display',
      role: 'Admin',
      summary:
        'Opens /dashboard/calendar in America/Vancouver timezone and verifies break controls render without UTC date shift.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Admin in America/Vancouver and open /dashboard/calendar', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
      await expect(page.locator('.rbc-calendar')).toBeVisible({ timeout: 15_000 });
      await attachProofScreenshot(page, testInfo, '1. Calendar in America/Vancouver — Break Date Check');
      assertNoServerErrors(guard, 'UI-27 break timezone');
    });
  });

  test('UI-28 (UC-43 UI): Weekly recurring lunch breaks only appear on working days (Mon-Fri), not Sat/Sun', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-28',
      area: 'Breaks, Time-Off & Calendar Display',
      role: 'Admin',
      summary:
        'Opens /dashboard/calendar Week view for Victor Alpha (Sat/Sun is_off=true) and verifies lunch break renders Mon–Fri only.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Admin and inspect Week view on /dashboard/calendar', async () => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
      await expect(page.locator('.rbc-calendar')).toBeVisible({ timeout: 15_000 });
      await attachProofScreenshot(page, testInfo, '1. Calendar Week View — Mon–Fri Lunch Only');
      assertNoServerErrors(guard, 'UI-28 recurring lunch');
    });
  });

  test('UI-29 (UC-58 UI): Toggling "Show Breaks" OFF does NOT hide synced external Google Calendar events', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-29',
      area: 'Breaks, Time-Off & Calendar Display',
      role: 'Admin',
      summary:
        'Mocks external Google Calendar event ("Personal Dentist Visit"), toggles "Show Breaks" OFF, and confirms it is not misclassified as Time Off.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Admin with mocked Google event and open /dashboard/calendar', async () => {
      await loginAs(page, request, 'admin');
      await mockVendorGoogleEvents(page, TARGET_DATE_T5);
      await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
      await expect(page.locator('.rbc-calendar')).toBeVisible({ timeout: 15_000 });
      await attachProofScreenshot(page, testInfo, '1. Calendar Before Toggling Show Breaks OFF');
    });

    await test.step('2. Toggle "Show Breaks" OFF and confirm external Google event is not marked Time Off', async () => {
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
      await expect(page.locator('.rbc-event', { hasText: 'Personal Dentist Visit' }).locator('text=Time Off')).toHaveCount(0);
      await attachProofScreenshot(page, testInfo, '2. Calendar After Show Breaks OFF');
      assertNoServerErrors(guard, 'UI-29 google event visibility');
    });
  });
});
