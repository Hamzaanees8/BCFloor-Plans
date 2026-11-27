import { expect, type Page, type TestInfo } from '@playwright/test';
import { attachProofScreenshot, E2E_CONFIG } from './authAndMocks';

export interface PropertyFormInput {
  role: 'admin' | 'agent' | 'book-now';
  agentSearch?: string;
  sqFt: string;
  address: string;
  city: string;
  province?: string;
  postalCode: string;
  lat?: number;
  lng?: number;
}

/**
 * Intercepts Google Places v1 Autocomplete & Place Details so Property address selection
 * works deterministically in E2E.
 *
 * Property.tsx passes ONLY `onAddressComponentsChange` to GooglePlacesAutocomplete
 * (mode="single"), so typing into "Enter an address" does not update React state until
 * clicking a suggestion in `#places-suggestions [role="option"]`.
 */
export async function mockGooglePlacesAddress(
  page: Page,
  place: {
    address: string;
    city: string;
    provinceCode?: string;
    provinceLong?: string;
    postalCode: string;
    countryCode?: string;
    lat?: number;
    lng?: number;
  }
): Promise<void> {
  const placeId = `mock-place-${place.address.replace(/\W+/g, '-').toLowerCase()}`;
  const fullText = `${place.address}, ${place.city}, ${place.provinceCode || 'BC'}, Canada`;

  await page.route('**/places.googleapis.com/v1/places:autocomplete**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        suggestions: [
          {
            placePrediction: {
              place: `places/${placeId}`,
              placeId,
              text: { text: fullText },
              structuredFormat: {
                mainText: { text: place.address },
                secondaryText: { text: `${place.city}, ${place.provinceCode || 'BC'}, Canada` },
              },
            },
          },
        ],
      }),
    });
  });

  await page.route(`**/places.googleapis.com/v1/places/${placeId}**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: placeId,
        formattedAddress: fullText,
        location: {
          latitude: place.lat ?? 49.2775,
          longitude: place.lng ?? -123.1128,
        },
        addressComponents: [
          {
            longText: place.address.split(' ')[0] || '100',
            shortText: place.address.split(' ')[0] || '100',
            types: ['street_number'],
          },
          {
            longText: place.address.split(' ').slice(1).join(' ') || 'Robson St',
            shortText: place.address.split(' ').slice(1).join(' ') || 'Robson St',
            types: ['route'],
          },
          { longText: place.city, shortText: place.city, types: ['locality'] },
          {
            longText: place.provinceLong || 'British Columbia',
            shortText: place.provinceCode || 'BC',
            types: ['administrative_area_level_1'],
          },
          { longText: place.postalCode, shortText: place.postalCode, types: ['postal_code'] },
          {
            longText: 'Canada',
            shortText: place.countryCode || 'CA',
            types: ['country'],
          },
        ],
      }),
    });
  });
}

/**
 * Step 1: Fills out the real Property tab (Agent selection for Admin, SqFt, Google Places
 * address autocomplete, City, Postal Code) and advances to SERVICES.
 */
export async function completePropertyStep(
  page: Page,
  input: PropertyFormInput
): Promise<void> {
  await mockGooglePlacesAddress(page, {
    address: input.address,
    city: input.city,
    postalCode: input.postalCode,
    provinceLong: input.province || 'British Columbia',
    provinceCode: input.province === 'Ontario' ? 'ON' : 'BC',
    lat: input.lat,
    lng: input.lng,
  });

  if (input.role === 'admin') {
    const selectAgentBtn = page.getByRole('button', { name: /Select Agent/i }).first();
    if (await selectAgentBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await selectAgentBtn.click();
      const searchInput = page.locator('input[placeholder="Search agent..."]');
      await searchInput.waitFor({ state: 'visible', timeout: 5000 });
      await searchInput.fill(input.agentSearch || 'E2E Agent');
      await page.locator('[role="option"]').first().click();
      await page.waitForTimeout(400);
    }
  }

  const sqFtInput = page.locator('input[placeholder="e.g 2230 sq. ft."]');
  if (!(await sqFtInput.isVisible().catch(() => false))) {
    const createNewBtn = page.getByRole('button', { name: /Create New (Booking|Listing)/i }).first();
    if (await createNewBtn.isVisible().catch(() => false)) {
      await createNewBtn.click();
    }
  }

  await sqFtInput.waitFor({ state: 'visible', timeout: 10000 });
  await sqFtInput.fill(input.sqFt);

  const addressInput = page.locator('input[placeholder="Enter an address"]');
  await addressInput.click();
  await addressInput.fill(input.address);
  const firstSuggestion = page.locator('#places-suggestions [role="option"]').first();
  await firstSuggestion.waitFor({ state: 'visible', timeout: 8000 });
  await firstSuggestion.click();
  await page.waitForTimeout(300);

  const cityInput = page.locator('input[placeholder="e.g. Calgary"]');
  if ((await cityInput.inputValue().catch(() => '')).trim() === '') {
    await cityInput.fill(input.city);
  }
  const postalInput = page.locator('input[placeholder*="T2P"], input[placeholder*="90210"]').first();
  if ((await postalInput.inputValue().catch(() => '')).trim() === '') {
    await postalInput.fill(input.postalCode);
  }

  const nextBtn = page.getByRole('button', { name: /^Next$/i }).first();
  await expect(nextBtn).toBeEnabled({ timeout: 8000 });
  await nextBtn.click();

  await page.getByRole('button', { name: /Add to Cart|Remove from Cart/i }).first().waitFor({
    state: 'visible',
    timeout: 15000,
  });
}

/**
 * Step 2: Selects one or more real services by name on the Services tab (clicking "Add to Cart")
 * and clicks Next to advance to Schedule (or handles RealtorSignInModal in book-now mode).
 */
export async function completeServicesStep(
  page: Page,
  serviceNames: string[],
  options: { expectLoginModal?: boolean; loginCreds?: { email: string; password: string } } = {}
): Promise<void> {
  for (const name of serviceNames) {
    const card = page
      .locator('div.rounded-lg, div.border')
      .filter({ hasText: name })
      .filter({ has: page.getByRole('button', { name: /Add to Cart|Remove from Cart/i }) })
      .last();

    await card.scrollIntoViewIfNeeded();
    const addBtn = card.getByRole('button', { name: /^Add to Cart$/i }).first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await expect(card.getByRole('button', { name: /^Remove from Cart$/i }).first()).toBeVisible({
        timeout: 5000,
      });
    }
  }

  const nextBtn = page.getByRole('button', { name: /^Next$/i }).first();
  await expect(nextBtn).toBeEnabled({ timeout: 8000 });
  await nextBtn.click();

  if (options.expectLoginModal) {
    const emailInput = page.locator('input[type="email"][placeholder="agent@example.com"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(options.loginCreds?.email || E2E_CONFIG.agent.email);
    await page.locator('input[placeholder="••••••••"]').first().fill(
      options.loginCreds?.password || E2E_CONFIG.agent.password
    );
    await page.locator('button[type="submit"]', { hasText: /^Login$/i }).click();
    await emailInput.waitFor({ state: 'hidden', timeout: 15000 });

    const stillOnServices = await page
      .getByRole('button', { name: /Remove from Cart/i })
      .first()
      .isVisible()
      .catch(() => false);
    if (stillOnServices) {
      await page.getByRole('button', { name: /^Next$/i }).first().click();
    }
  }

  await page
    .locator('.fc-timegrid, :text("Master Date Selection"), button[role="combobox"]')
    .first()
    .waitFor({ state: 'visible', timeout: 20000 });
}

/**
 * Waits for OneDayCalendar's "Calculating slots & travel times..." loading overlay to clear.
 */
export async function waitForSlotsCalculated(page: Page): Promise<void> {
  const loader = page.getByText(/Calculating slots & travel times/i);
  if (await loader.isVisible({ timeout: 1500 }).catch(() => false)) {
    await loader.waitFor({ state: 'hidden', timeout: 25000 });
  }
  await page.waitForTimeout(400);
}

/**
 * Step 3a: Navigates OneDayCalendar to a specific offset from today (Master Date defaults to T+1).
 */
export async function navigateCalendarToDateOffset(
  page: Page,
  daysFromToday: number,
  serviceIndex = 0
): Promise<void> {
  await waitForSlotsCalculated(page);

  const calendar = page.locator('.fc').nth(serviceIndex);
  await calendar.waitFor({ state: 'visible', timeout: 15000 });

  const stepsForward = Math.max(0, daysFromToday - 1);
  const nextDayBtn = calendar.locator('.fc-customNext-button');

  for (let i = 0; i < stepsForward; i++) {
    await nextDayBtn.click();
    await waitForSlotsCalculated(page);
  }
}

/**
 * Step 3b: Picks a specific vendor from the Radix <Select> dropdown for a service card.
 */
export async function selectVendorDropdown(
  page: Page,
  vendorName: string,
  serviceIndex = 0
): Promise<boolean> {
  const trigger = page
    .locator('button[role="combobox"]')
    .filter({ hasText: /All Vendors|Select Vendor|Victor|Vanessa|Charlie/i })
    .nth(serviceIndex);

  await trigger.waitFor({ state: 'visible', timeout: 10000 });
  await trigger.click();

  const option = page.locator('[role="option"]').filter({ hasText: vendorName }).first();
  const visible = await option.isVisible({ timeout: 4000 }).catch(() => false);
  if (!visible) {
    await page.keyboard.press('Escape');
    return false;
  }

  await option.click();

  const confirmOk = page.getByRole('button', { name: /^OK$|^Confirm$/i }).first();
  if (await confirmOk.isVisible({ timeout: 1000 }).catch(() => false)) {
    await confirmOk.click();
  }

  await waitForSlotsCalculated(page);
  return true;
}

/**
 * Step 3c: Toggles the Admin "Schedule Override" switch for a service card.
 */
export async function toggleScheduleOverride(
  page: Page,
  enable: boolean,
  serviceIndex = 0
): Promise<void> {
  const sw = page.locator(`#schedule-override-${serviceIndex}`);
  await sw.waitFor({ state: 'visible', timeout: 8000 });
  const isChecked = (await sw.getAttribute('aria-checked')) === 'true';
  if (isChecked !== enable) {
    await sw.click();
    await waitForSlotsCalculated(page);
  }
}

/**
 * Step 3d: Clicks a REAL `.fc-event.slot-available` on FullCalendar (`OneDayCalendar`),
 * handles the Multi-Vendor picker modal if multiple vendors are available, and waits
 * for `.fc-event.slot-selected` to appear.
 */
export async function selectAvailableTimeSlot(
  page: Page,
  options: {
    serviceIndex?: number;
    preferredVendorName?: string;
    slotEventIndex?: number;
    rapidDoubleClick?: boolean;
  } = {}
): Promise<{ selectedCount: number }> {
  const idx = options.serviceIndex ?? 0;
  await waitForSlotsCalculated(page);

  const calendar = page.locator('.fc').nth(idx);
  const availableSlots = calendar.locator('.fc-event.slot-available');
  await availableSlots.first().waitFor({ state: 'visible', timeout: 15000 });

  const targetSlot = availableSlots.nth(options.slotEventIndex ?? 0);
  await targetSlot.scrollIntoViewIfNeeded();

  if (options.rapidDoubleClick) {
    await targetSlot.dblclick();
  } else {
    await targetSlot.click();
  }

  const vendorModalItem = calendar.locator('ul li.cursor-pointer');
  if (await vendorModalItem.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    if (options.preferredVendorName) {
      const match = vendorModalItem.filter({ hasText: options.preferredVendorName }).first();
      if (await match.isVisible().catch(() => false)) {
        await match.click();
      } else {
        await vendorModalItem.first().click();
      }
    } else {
      await vendorModalItem.first().click();
    }
  }

  const okBtn = page
    .getByRole('button', { name: /^OK$|^Override & Book$|^Book Shorter Duration$/i })
    .first();
  if (await okBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await okBtn.click();
  }

  const selectedEvents = calendar.locator('.fc-event.slot-selected');
  await selectedEvents.first().waitFor({ state: 'visible', timeout: 15000 });
  const selectedCount = await selectedEvents.count();

  return { selectedCount };
}

/**
 * Step 4 & 5: Advances SCHEDULE -> CONTACT -> ORDER CONFIRMATION, clicks "Submit",
 * captures the real POST /api/orders response, and screenshots confirmation.
 */
export async function completeBookingAndSubmit(
  page: Page,
  testInfo: TestInfo
): Promise<{ status: number; orderId?: number | string; responseBody?: any }> {
  const nextBtn = page.getByRole('button', { name: /^Next$/i }).first();
  await expect(nextBtn).toBeEnabled({ timeout: 10000 });
  await nextBtn.click();
  await page.waitForTimeout(500);

  await expect(nextBtn).toBeEnabled({ timeout: 10000 });
  await nextBtn.click();

  const submitBtn = page.getByRole('button', { name: /^Submit$/i }).first();
  await submitBtn.waitFor({ state: 'visible', timeout: 15000 });
  await attachProofScreenshot(page, testInfo, 'Order Confirmation Before Submit');

  const [orderRes] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/api/orders') && res.request().method() === 'POST',
      { timeout: 30000 }
    ),
    submitBtn.click(),
  ]);

  const status = orderRes.status();
  let responseBody: any = null;
  try {
    responseBody = await orderRes.json();
  } catch {
    // ignore non-json
  }

  const orderId = responseBody?.data?.id || responseBody?.order?.id || responseBody?.id;

  if (status === 200 || status === 201) {
    await page
      .getByRole('button', { name: /^Done$/i })
      .first()
      .waitFor({ state: 'visible', timeout: 20000 })
      .catch(() => {});
    await attachProofScreenshot(
      page,
      testInfo,
      orderId ? `Booking Confirmed (Order #${orderId})` : 'Booking Confirmation Screen'
    );
  } else {
    await attachProofScreenshot(page, testInfo, `Order Submit Returned HTTP ${status}`);
  }

  return { status, orderId, responseBody };
}

/**
 * Switches BigCalendar to Weekly or Day view, locates an `.rbc-event` (optionally matching text),
 * right-clicks it, and waits for the Admin context menu (`div.fixed.z-[9999]`) to appear.
 */
export async function openCalendarEventContextMenu(
  page: Page,
  options: { view?: 'Weekly' | 'Day'; eventText?: string } = {}
): Promise<boolean> {
  const targetView = options.view || 'Weekly';
  const viewBtn = page.getByRole('button', { name: new RegExp(`^${targetView}$`, 'i') }).first();
  if (await viewBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await viewBtn.click();
    await page.waitForTimeout(400);
  }

  const events = options.eventText
    ? page.locator('.rbc-event').filter({ hasText: options.eventText })
    : page.locator('.rbc-event');

  const count = await events.count();
  if (count === 0) return false;

  const target = events.first();
  await target.scrollIntoViewIfNeeded();
  await target.click({ button: 'right' });

  const menu = page.locator('div.fixed').filter({ hasText: /Edit Time & Duration|Quick Reassign|Add Break/i }).first();
  return await menu.isVisible({ timeout: 3000 }).catch(() => false);
}

/**
 * Opens "Add Time Off" on BigCalendar, fills title, vendor, times, and address, and clicks Save.
 */
export async function openAndCreateBreak(
  page: Page,
  input: {
    title: string;
    vendorName: string;
    startTime: string;
    endTime: string;
    address: string;
  }
): Promise<{ status: number }> {
  await page.getByRole('button', { name: /^Add Time Off$/i }).first().click();

  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible', timeout: 8000 });

  await dialog.locator('input[placeholder="Enter Break Title"]').fill(input.title);

  const vendorCombo = dialog.locator('button[role="combobox"]').first();
  if (await vendorCombo.isVisible().catch(() => false)) {
    await vendorCombo.click();
    const searchVendor = page.locator('input[placeholder="Search vendor..."]');
    await searchVendor.waitFor({ state: 'visible', timeout: 5000 });
    await searchVendor.fill(input.vendorName);
    await page.locator('[role="option"]').first().click();
  }

  const timeInputs = dialog.locator('input[type="time"]');
  if ((await timeInputs.count()) >= 2) {
    await timeInputs.nth(0).fill(input.startTime);
    await timeInputs.nth(1).fill(input.endTime);
  }

  const addrInput = dialog.locator('input[placeholder="Type address here..."]');
  if (await addrInput.isVisible().catch(() => false)) {
    await addrInput.fill(input.address);
  }

  const [res] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/api/vendor-breaks') && r.request().method() === 'POST',
      { timeout: 15000 }
    ),
    dialog.getByRole('button', { name: /^Save$/i }).click(),
  ]);

  return { status: res.status() };
}
