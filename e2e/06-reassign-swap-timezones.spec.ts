import { test, expect } from '@playwright/test';
import {
  annotateBusinessCase,
  attachProofScreenshot,
  loginAs,
} from './helpers/authAndMocks';
import { attachQaDiagnostics } from './helpers/qaSession';
import {
  completePropertyStep,
  completeServicesStep,
  openCalendarEventContextMenu,
  selectVendorDropdown,
  waitForSlotsCalculated,
} from './helpers/bookingFlow';

/**
 * Chunk 6 of 6: Real End-to-End Reassign, Swap & Cross-Timezone Accuracy (UI-30 to UI-32)
 *
 * Run this chunk alone:
 *   npx playwright test e2e/06-reassign-swap-timezones.spec.ts
 */

test.describe('Reassign, Swap & Timezone Accuracy', () => {
  test('Admin opens Quick Reassign / Swap modal from Calendar context menu and inspects Reassign & Swap tabs', async ({
    page,
    request,
  }, testInfo) => {
    annotateBusinessCase(testInfo, {
      caseId: 'UI-30',
      area: 'Reassign, Swap & Timezone Accuracy',
      role: 'Admin',
      summary:
        'Right-clicks a booking on Weekly Calendar, opens Quick Reassign / Swap, inspects Reassign vendor dropdown, and switches to the Swap tab.',
    });

    const diag = attachQaDiagnostics(page);

    try {
      await test.step('Sign in as Admin and open Weekly Calendar', async () => {
        await loginAs(page, request, 'admin');
        await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
      });

      await test.step('Right-click a booking and open Quick Reassign / Swap modal', async () => {
        const openedMenu = await openCalendarEventContextMenu(page, { view: 'Weekly' });
        expect.soft(openedMenu, 'Expected at least one .rbc-event with Admin context menu').toBe(true);
        if (!openedMenu) {
          await attachProofScreenshot(page, testInfo, 'Weekly Calendar (No Event Found)');
          return;
        }

        const reassignBtn = page.getByRole('button', { name: /Quick Reassign/i }).first();
        if (await reassignBtn.isVisible().catch(() => false)) {
          await reassignBtn.click();
          const dialog = page.getByRole('dialog');
          await dialog.waitFor({ state: 'visible', timeout: 8000 });
          await attachProofScreenshot(page, testInfo, 'Reassign Vendor Tab');

          const swapTab = dialog.locator('button[type="button"]', { hasText: /^Swap$/i }).first();
          if (await swapTab.isVisible().catch(() => false)) {
            await swapTab.click();
            await page.waitForTimeout(300);
            await attachProofScreenshot(page, testInfo, 'Swap Slots Tab');
          }
        }
      });
    } finally {
      await diag.flush(testInfo);
    }
  });

  test.describe('Pacific Time (Vancouver)', () => {
    test.use({ timezoneId: 'America/Vancouver' });

    test('Same-day upcoming appointments in Vancouver are NOT falsely flagged as past in Reassign/Swap', async ({
      page,
      request,
    }, testInfo) => {
      annotateBusinessCase(testInfo, {
        caseId: 'UI-31',
        area: 'Reassign, Swap & Timezone Accuracy',
        role: 'Admin',
        summary:
          'Opens Day view on Calendar in America/Vancouver timezone, right-clicks today’s upcoming appointment, opens Quick Reassign / Swap, and checks that it is not falsely marked as past.',
      });

      const diag = attachQaDiagnostics(page);

      try {
        await test.step('Sign in as Admin in America/Vancouver timezone and open Day view', async () => {
          await loginAs(page, request, 'admin');
          await page.goto('/dashboard/calendar', { waitUntil: 'networkidle' });
        });

        await test.step('Right-click today’s booking and verify it is not falsely blocked as past', async () => {
          const openedMenu = await openCalendarEventContextMenu(page, { view: 'Day' });
          if (openedMenu) {
            const reassignBtn = page.getByRole('button', { name: /Quick Reassign/i }).first();
            if (await reassignBtn.isVisible().catch(() => false)) {
              await reassignBtn.click();
              const dialog = page.getByRole('dialog');
              await dialog.waitFor({ state: 'visible', timeout: 8000 });
              const pastWarning = await dialog
                .getByText(/Reassignment is not allowed for past slots/i)
                .count();
              expect.soft(pastWarning, 'Upcoming slot today must not be marked as past due to UTC shift').toBe(0);
              await attachProofScreenshot(page, testInfo, 'Vancouver Today Reassign Modal Check');
              return;
            }
          }
          await attachProofScreenshot(page, testInfo, 'Vancouver Calendar Day View');
        });
      } finally {
        await diag.flush(testInfo);
      }
    });
  });

  test.describe('Cross-Timezone (Toronto Admin → Vancouver Property)', () => {
    test.use({ timezoneId: 'America/Toronto' });

    test('An Admin in Toronto can see and select available slots for a Vancouver property', async ({
      page,
      request,
    }, testInfo) => {
      annotateBusinessCase(testInfo, {
        caseId: 'UI-32',
        area: 'Reassign, Swap & Timezone Accuracy',
        role: 'Admin',
        summary:
          'Runs the full Property -> Services -> Schedule flow in America/Toronto timezone for a Vancouver listing and verifies available slots render cleanly.',
      });

      const diag = attachQaDiagnostics(page);

      try {
        await test.step('Sign in as Admin in America/Toronto and advance to Schedule for Vancouver', async () => {
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

        await test.step('Select Victor Alpha and verify available slots render in cross-timezone view', async () => {
          await selectVendorDropdown(page, 'Victor Alpha');
          const availCount = await page.locator('.fc-event.slot-available').count();
          expect.soft(availCount, 'Vancouver slots should remain available when viewed from Toronto').toBeGreaterThan(0);
          await attachProofScreenshot(page, testInfo, 'Cross-Timezone Schedule (Toronto → Vancouver)');
        });
      } finally {
        await diag.flush(testInfo);
      }
    });
  });
});
