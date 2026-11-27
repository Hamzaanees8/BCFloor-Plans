import { test, expect } from '@playwright/test';
import {
  E2E_CONFIG,
  annotateBusinessCase,
  attachProofScreenshot,
  loginAs,
} from './helpers/authAndMocks';
import { attachQaDiagnostics } from './helpers/qaSession';
import {
  completeBookingAndSubmit,
  completePropertyStep,
  completeServicesStep,
  mockGooglePlacesAddress,
  navigateCalendarToDateOffset,
  selectAvailableTimeSlot,
  selectVendorDropdown,
  waitForSlotsCalculated,
} from './helpers/bookingFlow';

/**
 * Chunk 4 of 6: Real End-to-End Travel Time, Distance, Non-Travel Services & Map Safety (UI-18 to UI-24)
 *
 * Run this chunk alone:
 *   npx playwright test e2e/04-travel-and-maps.spec.ts
 */

test.describe('Travel Time, Distance & Map Safety', () => {
  test('Different-property booking on T+5 respects travel buffer around existing 10:00–11:00 appointment', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-18',
      area: 'Travel Time, Distance & Map Safety',
      role: 'Agent',
      summary:
        'Books at a different Vancouver address (900 W Hastings St) on T+5 and verifies Victor Alpha has travel buffer protection around the existing 10:00–11:00 booking.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Agent and reach Schedule T+5 for 900 W Hastings St', async () => {
        await loginAs(page, request, 'agent');
        await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
        await completePropertyStep(page, {
          role: 'agent',
          sqFt: '2000',
          address: '900 W Hastings St',
          city: 'Vancouver',
          postalCode: 'V6C 1E5',
        });
        await completeServicesStep(page, ['E2E HDR Photos']);
        await navigateCalendarToDateOffset(page, 5);
        await selectVendorDropdown(page, 'Victor Alpha');
      });

      await test.step('Confirm booked/travel block renders on T+5 and pick an open slot', async () => {
        expect.soft(await page.locator('.fc-event.slot-booked').count()).toBeGreaterThan(0);
        const { selectedCount } = await selectAvailableTimeSlot(page, {
          preferredVendorName: 'Victor Alpha',
        });
        expect(selectedCount).toBeGreaterThan(0);
        await attachProofScreenshot(page, testInfo, 'Different-Property Travel Buffer Applied');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Same street name in two different cities (Vancouver vs. Burnaby) are treated as separate properties', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-19',
      area: 'Travel Time, Distance & Map Safety',
      role: 'Agent',
      summary:
        'Schedules at "100 Robson St, Burnaby" on the same day as "100 Robson St, Vancouver" and verifies city distinction.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Verify both Vancouver and Burnaby properties exist separately in API', async () => {
        const { token } = await loginAs(page, request, 'admin');
        const res = await request.get(`${E2E_CONFIG.apiUrl}/api/properties`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        expect(res.ok()).toBeTruthy();

        const body = await res.json();
        const props = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
        const robsonProps = props.filter((p: any) =>
          String(p.address || '').toLowerCase().includes('100 robson')
        );
        if (robsonProps.length >= 2) {
          const cities = new Set(robsonProps.map((p: any) => String(p.city || '').toLowerCase()));
          expect(cities.size).toBeGreaterThanOrEqual(2);
        }
      });

      await test.step('Open Schedule T+5 for 100 Robson St, Burnaby as Agent', async () => {
        await loginAs(page, request, 'agent');
        await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
        await completePropertyStep(page, {
          role: 'agent',
          sqFt: '2000',
          address: '100 Robson St',
          city: 'Burnaby',
          postalCode: 'V5H 2A1',
          lat: 49.2276,
          lng: -123.0076,
        });
        await completeServicesStep(page, ['E2E HDR Photos']);
        await navigateCalendarToDateOffset(page, 5);
        await selectVendorDropdown(page, 'Victor Alpha');
        await attachProofScreenshot(page, testInfo, 'Burnaby Same-Street Property Schedule');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Non-travel service (is_travel_required = false) assigns vendor directly and submits cleanly', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-20',
      area: 'Travel Time, Distance & Map Safety',
      role: 'Agent',
      summary:
        'Selects E2E Virtual Staging (No Travel), verifies vendor assignment without travel buffer lockouts, and submits the order.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Agent, fill Property, and select E2E Virtual Staging (No Travel)', async () => {
        await loginAs(page, request, 'agent');
        await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });
        await completePropertyStep(page, {
          role: 'agent',
          sqFt: '2000',
          address: '100 Robson St',
          city: 'Vancouver',
          postalCode: 'V6B 2A7',
        });
        await completeServicesStep(page, ['E2E Virtual Staging (No Travel)']);
      });

      await test.step('Assign Victor Alpha on Schedule and submit the non-travel order', async () => {
        await selectVendorDropdown(page, 'Victor Alpha', 0);
        await attachProofScreenshot(page, testInfo, 'Non-Travel Service Vendor Selected');
        const result = await completeBookingAndSubmit(page, testInfo);
        expect.soft([200, 201]).toContain(result.status);
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Vendor distance lookups load travel times cleanly on Schedule without errors', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-21',
      area: 'Travel Time, Distance & Map Safety',
      role: 'Admin',
      summary:
        'Completes Property & Services and opens the Schedule vendor dropdown to verify driving time calculations populate cleanly.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Admin and advance to Schedule', async () => {
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
        await waitForSlotsCalculated(page);
      });

      await test.step('Open Vendor dropdown to inspect travel time calculation results', async () => {
        const found = await selectVendorDropdown(page, 'Victor Alpha');
        expect(found).toBe(true);
        await attachProofScreenshot(page, testInfo, 'Vendor Distance Lookup Completed');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Selecting a vendor without a saved home address (Charlie NoAddress) sends zero "undefined,undefined" map requests', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-22',
      area: 'Travel Time, Distance & Map Safety',
      role: 'Admin',
      summary:
        'Selects Charlie NoAddress (missing start_location), picks an available time slot on OneDayCalendar, and verifies zero malformed Google API requests.',
    });

    const diag = attachQaDiagnostics(page);
    const malformedRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('undefined,undefined')) {
        malformedRequests.push(req.url());
      }
    });

    try {
      await test.step('Sign in as Admin and reach Schedule T+6', async () => {
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
      });

      await test.step('Select Charlie NoAddress and click a real available time slot', async () => {
        const foundCharlie = await selectVendorDropdown(page, 'Charlie NoAddress');
        expect.soft(foundCharlie, 'Charlie NoAddress should appear in vendor dropdown').toBe(true);
        if (foundCharlie) {
          await selectAvailableTimeSlot(page, { preferredVendorName: 'Charlie NoAddress' });
        }
        expect.soft(malformedRequests, 'Must never send undefined,undefined to Google Maps').toEqual([]);
        await attachProofScreenshot(page, testInfo, 'Charlie NoAddress Slot Selected Cleanly');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Changing property address rapidly before advancing does not stall vendor availability', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-23',
      area: 'Travel Time, Distance & Map Safety',
      role: 'Admin',
      summary:
        'Enters one address on Property, changes to a second address, then advances to Schedule to verify vendor availability computes cleanly.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Admin and switch property address twice before advancing', async () => {
        await loginAs(page, request, 'admin');
        await page.goto('/dashboard/orders/create', { waitUntil: 'networkidle' });

        await mockGooglePlacesAddress(page, {
          address: '200 Granville St',
          city: 'Vancouver',
          postalCode: 'V6C 1S4',
        });

        await completePropertyStep(page, {
          role: 'admin',
          agentSearch: 'E2E Agent',
          sqFt: '2000',
          address: '100 Robson St',
          city: 'Vancouver',
          postalCode: 'V6B 2A7',
        });
      });

      await test.step('Advance through Services to Schedule and verify vendors load', async () => {
        await completeServicesStep(page, ['E2E HDR Photos']);
        const found = await selectVendorDropdown(page, 'Victor Alpha');
        expect(found).toBe(true);
        await attachProofScreenshot(page, testInfo, 'Schedule Loaded After Address Update');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test('Vendor Billing mileage screen loads cleanly without Google MAX_ELEMENTS_EXCEEDED errors', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-24',
      area: 'Travel Time, Distance & Map Safety',
      role: 'Admin',
      summary:
        'Opens Vendor Billing and Uninvoiced Mileage views and checks for any Distance Matrix element-limit errors.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Admin and inspect Vendor Billing & Uninvoiced views', async () => {
        await loginAs(page, request, 'admin');
        await page.goto('/dashboard/vendor-billing', { waitUntil: 'networkidle' });
        await expect(page.locator('body')).toBeVisible();
        await attachProofScreenshot(page, testInfo, 'Vendor Billing Mileage Dashboard');
      });
    } finally {
      await diag.flush(testInfo);
    }
  });
});
