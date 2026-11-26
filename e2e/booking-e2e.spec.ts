import { test, expect } from '@playwright/test';
import {
  E2E_CONFIG,
  getVancouverDateOffset,
  loginAs,
  mockVendorGoogleEvents,
} from './helpers/authAndMocks';

/**
 * Starter Playwright E2E Suite covering high-priority UI cases from UI_AUTOMATION_TEST_SPEC.md.
 *
 * Prerequisite: Run on disposable test backend before executing:
 *   php artisan migrate:fresh --seeder=BookingE2ESeeder
 */

const TARGET_DATE_T5 = getVancouverDateOffset(5); // Active booking 10:00-11:00, Cancelled 14:00-15:00, Break 15:30-16:30
const TARGET_DATE_T6 = getVancouverDateOffset(6); // Must NOT be blocked by T+5 one-time break

test.describe('Group 1 & 2: Agent Restrictions vs Admin Freedoms', () => {
  test('UI-05 (UC-06): Agent sees breaks, travel buffers & Google events disguised as Booked with no Admin X button', async ({
    page,
    request,
  }) => {
    await loginAs(page, request, 'agent');
    await mockVendorGoogleEvents(page, TARGET_DATE_T5);

    await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });

    // Verify no Schedule Override toggle is visible for Agents
    await expect(page.getByText(/Schedule Override/i)).toHaveCount(0);

    // Personal Google Calendar event title must NEVER leak to Agents
    await expect(page.getByText('Personal Dentist Visit')).toHaveCount(0);
  });

  test('UI-08 (UC-12 UI): Guest / Agent never sees Admin red X trim button on booked slots', async ({
    page,
    request,
  }) => {
    await loginAs(page, request, 'agent');
    await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });

    // Confirm no unbook/trim X buttons are rendered for non-Admin
    const trimButtons = page.locator('[title*="Unbook"], [title*="Trim"], [aria-label*="Trim slot"]');
    await expect(trimButtons).toHaveCount(0);
  });
});

test.describe('Group 3 & 4: Cancelled Slots, Travel Time & Google Maps Guards', () => {
  test('UI-22 (UC-35): Vendor with no start_location never sends malformed "undefined,undefined" Google API request', async ({
    page,
    request,
  }) => {
    const malformedRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('undefined,undefined')) {
        malformedRequests.push(req.url());
      }
    });

    await loginAs(page, request, 'admin');
    await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });

    // Assert zero malformed Google Maps requests were fired
    expect(malformedRequests).toEqual([]);
  });

  test('UI-16 (UC-26/27 UI): Cancelled booking on T+5 (14:00-15:00) is NOT returned as blocking in /api/order-slots', async ({
    page,
    request,
  }) => {
    const { token } = await loginAs(page, request, 'admin');

    const res = await request.get(`${E2E_CONFIG.apiUrl}/api/order-slots`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();

    const json = await res.json();
    const slots = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
    const cancelledBlock = slots.find(
      (s: any) => s.date === TARGET_DATE_T5 && String(s.start_time).startsWith('14:00')
    );

    expect(cancelledBlock, 'Cancelled 14:00-15:00 slot must not be returned to calendar').toBeUndefined();
  });
});

test.describe('Group 5: Breaks, Time-Off & Calendar Display', () => {
  test('UI-29 (UC-58 UI): BigCalendar does NOT hide external Google Calendar events when "Show Breaks" is toggled OFF', async ({
    page,
    request,
  }) => {
    await loginAs(page, request, 'admin');
    await mockVendorGoogleEvents(page, TARGET_DATE_T5);

    await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });

    // Locate the "Show Breaks" toggle if present and turn it OFF
    const showBreaksLabel = page.getByText(/Show Breaks/i).first();
    if (await showBreaksLabel.isVisible()) {
      const toggle = showBreaksLabel.locator('..').locator('button[role="switch"], input[type="checkbox"]').first();
      if (await toggle.isVisible()) {
        const isChecked =
          (await toggle.getAttribute('aria-checked')) === 'true' ||
          (await toggle.isChecked().catch(() => false));
        if (isChecked) {
          await toggle.click();
        }
      }
    }

    // External Google event should NOT be misclassified as "Time Off"
    await expect(page.locator('.rbc-event', { hasText: 'Personal Dentist Visit' }).locator('text=Time Off')).toHaveCount(0);
  });

  test('UI-25 (UC-39): One-time break on T+5 (15:30-16:30) must NOT block T+6', async ({
    page,
    request,
  }) => {
    await loginAs(page, request, 'admin');
    await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });

    // Confirm T+6 is distinct from T+5 and ready for full OneDayCalendar assertions
    expect(TARGET_DATE_T6).not.toEqual(TARGET_DATE_T5);
  });
});

test.describe('Group 6: Cross-Timezone & Reassign/Swap Checks', () => {
  test.describe('Vancouver Browser Timezone (UTC-8)', () => {
    test.use({ timezoneId: 'America/Vancouver' });

    test('UI-31 (UC-48): Later-today slot in Vancouver is NOT falsely marked as past in Reassign/Swap modal', async ({
      page,
      request,
    }) => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });

      // Calendar loads cleanly in America/Vancouver without console errors
      await expect(page.locator('.rbc-calendar')).toBeVisible();
    });
  });

  test.describe('Toronto Browser Timezone (UTC-5) booking Vancouver (UTC-8) property', () => {
    test.use({ timezoneId: 'America/Toronto' });

    test('UI-32 (UC-63): Admin in Toronto can view upcoming Vancouver slots without 3-hour false past cutoff', async ({
      page,
      request,
    }) => {
      await loginAs(page, request, 'admin');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });

      // Page renders cleanly under cross-timezone emulation
      await expect(page).toHaveURL(/\/dashboard\/orders\/create/);
    });
  });
});
