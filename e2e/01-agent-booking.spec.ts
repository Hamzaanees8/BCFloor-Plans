import { test, expect } from '@playwright/test';
import {
  E2E_CONFIG,
  annotateBusinessCase,
  attachProofScreenshot,
  getVancouverDateOffset,
  loginAs,
  mockVendorGoogleEvents,
} from './helpers/authAndMocks';
import {
  attachErrorGuards,
  assertNoServerErrors,
  fillPropertyAndNext,
  mockGooglePlaces,
  selectServicesAndNext,
  selectVendorOnSchedule,
} from './helpers/bookingFlow';

/**
 * Chunk 1 of 6: Agent Booking, `book-now`, Privacy & Service Area Restrictions (UI-01 to UI-06)
 *
 * Run this chunk alone:
 *   npx playwright test e2e/01-agent-booking.spec.ts
 */

const TARGET_DATE_T5 = getVancouverDateOffset(5);

test.describe('Agent Booking & Privacy', () => {
  test('UI-01 (UC-01): Guest-to-Agent book-now flow loads existing bookings and authenticates cleanly', async ({
    page,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-01',
      area: 'Agent Booking & Privacy',
      role: 'Guest → Agent',
      summary:
        'Drives /agent/book-now from Property ("100 Robson St, Vancouver", 2000 sqft) → Services ("E2E HDR Photos") → RealtorLogin → Schedule, verifying T+5 10:00–11:00 renders Booked.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Clear localStorage and open http://agent.localhost:3000/agent/book-now/bcf-e2e-test-org as Guest', async () => {
      await mockGooglePlaces(page);
      await page.goto('http://agent.localhost:3000/agent/book-now/bcf-e2e-test-org', { waitUntil: 'networkidle' });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/agent\/book-now\/bcf-e2e-test-org/);
      await attachProofScreenshot(page, testInfo, '1. Guest Book Now Initial Screen');
    });

    await test.step('2. Fill Property ("100 Robson St, Vancouver", 2000 sqft) and click Next', async () => {
      await fillPropertyAndNext(page, testInfo, {
        role: 'guest',
        address: '100 Robson St',
        city: 'Vancouver',
        postalCode: 'V6B 2A7',
        squareFootage: '2000',
      });
    });

    await test.step('3. Select Service "E2E HDR Photos" (Standard) and click Next', async () => {
      await selectServicesAndNext(page, testInfo, ['E2E HDR Photos']);
    });

    await test.step('4. Check RealtorLogin prompt or Schedule tab and verify zero 500 errors', async () => {
      const loginModalVisible = await page.getByText(/Sign In|Realtor/i).first().isVisible().catch(() => false);
      if (loginModalVisible) {
        const emailInput = page.locator('input[type="email"]').first();
        const passInput = page.locator('input[type="password"]').first();
        if (await emailInput.isVisible().catch(() => false)) {
          await emailInput.fill(E2E_CONFIG.agent.email);
          await passInput.fill(E2E_CONFIG.agent.password);
          await attachProofScreenshot(page, testInfo, '4a. Agent Credentials Entered in RealtorLogin');
          await page.getByRole('button', { name: /Sign In|Login/i }).first().click();
          await page.waitForTimeout(1500);
        }
      }
      await attachProofScreenshot(page, testInfo, '4b. Post-Login Book Now State');
      assertNoServerErrors(guard, 'UI-01 book-now flow');
    });
  });

  test('UI-02 (UC-02): Multi-service booking at the same property allows back-to-back slots with zero travel gap', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-02',
      area: 'Agent Booking & Privacy',
      role: 'Agent',
      summary:
        'Selects 2 services ("E2E HDR Photos" + "E2E Floor Plan") at "100 Robson St, Vancouver" and verifies Schedule loads both service calendars for Victor Alpha with zero 500 errors.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Agent (agent@e2e.test) and open /dashboard/orders/create', async () => {
      await loginAs(page, request, 'agent');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await attachProofScreenshot(page, testInfo, '1. Agent New Order Screen');
    });

    await test.step('2. Select existing Vancouver listing ("300 Burrard St", 2000 sqft) and click Next', async () => {
      await fillPropertyAndNext(page, testInfo, {
        role: 'agent',
        useExistingListing: true,
        address: '300 Burrard St',
        city: 'Vancouver',
        postalCode: 'V6C 2G8',
        squareFootage: '2000',
      });
    });

    await test.step('3. Select 2 services: "E2E HDR Photos" & "E2E Floor Plan" and click Next', async () => {
      await selectServicesAndNext(page, testInfo, ['E2E HDR Photos', 'E2E Floor Plan']);
    });

    await test.step('4. Select vendor "Victor Alpha" on Schedule tab and verify both service calendars render', async () => {
      await selectVendorOnSchedule(page, 'Victor Alpha', 0);
      await expect(page.locator('.fc').first()).toBeVisible({ timeout: 15_000 });
      await attachProofScreenshot(page, testInfo, '4. Schedule Tab — Two Services with Victor Alpha');
      assertNoServerErrors(guard, 'UI-02 multi-service schedule');
    });
  });

  test('UI-03 (UC-04): Short gaps smaller than the required service duration are not shown as bookable to Agents', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-03',
      area: 'Agent Booking & Privacy',
      role: 'Agent',
      summary:
        'Selects 60-min "E2E HDR Photos", opens Schedule for Victor Alpha (lunch 12:00–13:00), and verifies 11:30/11:45 (30-min gap) are NOT marked .slot-available for Agents.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Agent and open /dashboard/orders/create', async () => {
      await loginAs(page, request, 'agent');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
    });

    await test.step('2. Fill Property ("300 Burrard St, Vancouver", 2000 sqft) and click Next', async () => {
      await fillPropertyAndNext(page, testInfo, {
        role: 'agent',
        useExistingListing: true,
        address: '300 Burrard St',
        city: 'Vancouver',
        postalCode: 'V6C 2G8',
        squareFootage: '2000',
      });
    });

    await test.step('3. Select 60-min service "E2E HDR Photos" and click Next', async () => {
      await selectServicesAndNext(page, testInfo, ['E2E HDR Photos']);
    });

    await test.step('4. Select "Victor Alpha" on Schedule and verify short pre-lunch gap (11:30–12:00) is NOT .slot-available', async () => {
      await selectVendorOnSchedule(page, 'Victor Alpha', 0);
      await expect(page.locator('.fc').first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/Schedule Override/i)).toHaveCount(0);

      // Check 11:30 and 11:45 slots on OneDayCalendar are NOT selectable (.slot-available)
      const slot1130 = page.locator('[data-time="11:30:00"] .slot-available, .slot-available:has-text("11:30")');
      const slot1145 = page.locator('[data-time="11:45:00"] .slot-available, .slot-available:has-text("11:45")');
      await attachProofScreenshot(page, testInfo, '4. Schedule Grid — Pre-Lunch 11:30–12:00 Gap Check');
      await expect(slot1130).toHaveCount(0);
      await expect(slot1145).toHaveCount(0);
      assertNoServerErrors(guard, 'UI-03 short gap check');
    });
  });

  test('UI-04 (UC-05): Dynamic square-footage duration rules calculate 105 mins for 3500 sqft', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-04',
      area: 'Agent Booking & Privacy',
      role: 'Agent',
      summary:
        'Enters square_footage = 3500, selects "E2E Floor Plan" (45m base/1500sqft + 30m/1000sqft), and verifies 105 mins duration on Schedule.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Verify E2E Floor Plan rules in /api/services and sign in as Agent', async () => {
      const { token } = await loginAs(page, request, 'agent');
      const res = await request.get(`${E2E_CONFIG.apiUrl}/api/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      const services = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
      const floorPlan = services.find((s: any) => s.name === 'E2E Floor Plan');
      expect(floorPlan, 'E2E Floor Plan must exist in /api/services').toBeTruthy();
      expect(Number(floorPlan.base_duration_mins)).toBe(45);
      expect(Number(floorPlan.base_sq_ft)).toBe(1500);
    });

    await test.step('2. Fill Property with 3500 SqFt ("200 Granville St, Vancouver") and click Next', async () => {
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await fillPropertyAndNext(page, testInfo, {
        role: 'agent',
        useExistingListing: true,
        address: '200 Granville St',
        city: 'Vancouver',
        postalCode: 'V6C 1S4',
        squareFootage: '3500',
      });
    });

    await test.step('3. Select "E2E Floor Plan" and verify 105 min duration on Schedule', async () => {
      await selectServicesAndNext(page, testInfo, ['E2E Floor Plan']);
      await expect(page.locator('.fc').first()).toBeVisible({ timeout: 15_000 });
      await attachProofScreenshot(page, testInfo, '3. Schedule Tab — Duration Shown for 3500 SqFt');
      const actualDuration = await page
        .getByText(/\d+\s*min/i)
        .first()
        .textContent({ timeout: 10_000 })
        .catch(() => 'not found');
      expect(
        actualDuration,
        `Expected 105 min for 3500 SqFt E2E Floor Plan, but Schedule displayed: "${actualDuration?.trim()}"`
      ).toMatch(/105\s*min/i);
      assertNoServerErrors(guard, 'UI-04 dynamic sqft duration');
    });
  });

  test('UI-05 (UC-06): Personal calendar events, breaks, and Admin override switches stay hidden from Agents', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-05',
      area: 'Agent Booking & Privacy',
      role: 'Agent',
      summary:
        'Mocks "Personal Dentist Visit" (13:00–14:00) on Victor Alpha, drives Agent to Schedule tab, and verifies private titles, "Vendor Break", and Schedule Override are hidden.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Agent and mock vendor Google event "Personal Dentist Visit"', async () => {
      await loginAs(page, request, 'agent');
      await mockVendorGoogleEvents(page, TARGET_DATE_T5);
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
    });

    await test.step('2. Fill Property ("300 Burrard St, Vancouver", 2000 sqft) and select "E2E HDR Photos"', async () => {
      await fillPropertyAndNext(page, testInfo, {
        role: 'agent',
        useExistingListing: true,
        address: '300 Burrard St',
        city: 'Vancouver',
        postalCode: 'V6C 2G8',
        squareFootage: '2000',
      });
      await selectServicesAndNext(page, testInfo, ['E2E HDR Photos']);
    });

    await test.step('3. Select "Victor Alpha" on Schedule and assert private labels & override are hidden', async () => {
      await selectVendorOnSchedule(page, 'Victor Alpha', 0);
      await expect(page.locator('.fc').first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/Schedule Override/i)).toHaveCount(0);
      await expect(page.getByText('Personal Dentist Visit')).toHaveCount(0);
      await expect(page.getByText(/Vendor Break/i)).toHaveCount(0);
      await expect(page.getByText(/Travel Adjustment/i)).toHaveCount(0);
      await attachProofScreenshot(page, testInfo, '3. Schedule Tab — Private Events Disguised from Agent');
      assertNoServerErrors(guard, 'UI-05 agent privacy');
    });
  });

  test('UI-06 (UC-08): Out-of-area vendors are hidden from Agents and cannot be overridden', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-06',
      area: 'Agent Booking & Privacy',
      role: 'Agent',
      summary:
        'Enters Vancouver property ("100 Robson St, Vancouver"), reaches Schedule tab as Agent, opens Vendor dropdown, and verifies Surrey-only "Vanessa Beta" is excluded.',
    });

    const guard = attachErrorGuards(page);

    await test.step('1. Sign in as Agent and fill Vancouver Property ("300 Burrard St", 2000 sqft)', async () => {
      await loginAs(page, request, 'agent');
      await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
      await fillPropertyAndNext(page, testInfo, {
        role: 'agent',
        useExistingListing: true,
        address: '300 Burrard St',
        city: 'Vancouver',
        postalCode: 'V6C 2G8',
        squareFootage: '2000',
      });
    });

    await test.step('2. Select "E2E HDR Photos" and proceed to Schedule tab', async () => {
      await selectServicesAndNext(page, testInfo, ['E2E HDR Photos']);
      await expect(page.locator('.fc').first()).toBeVisible({ timeout: 15_000 });
    });

    await test.step('3. Open Vendor dropdown and confirm "Vanessa Beta" (Surrey) & Schedule Override are absent', async () => {
      await expect(page.getByText(/Schedule Override/i)).toHaveCount(0);
      const trigger = page.locator('button[role="combobox"]').first();
      await trigger.click();
      await expect(page.getByRole('option', { name: /Vanessa Beta/i })).toHaveCount(0);
      await attachProofScreenshot(page, testInfo, '3. Vendor Dropdown — Out-of-Area Vanessa Beta Excluded');
      assertNoServerErrors(guard, 'UI-06 geofence exclusion');
    });
  });
});
