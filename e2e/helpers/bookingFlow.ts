import { expect, type Page, type TestInfo } from '@playwright/test';
import { attachProofScreenshot } from './authAndMocks';

/**
 * Mocks Google Places Autocomplete & Place Details APIs so typing an address
 * in Guest/Book-Now mode works deterministically without external API quota.
 */
export async function mockGooglePlaces(
  page: Page,
  place = {
    streetNumber: '100',
    route: 'Robson St',
    city: 'Vancouver',
    province: 'BC',
    postalCode: 'V6B 2A7',
    country: 'CA',
    lat: 49.2809,
    lng: -123.1167,
  }
): Promise<void> {
  const fullText = `${place.streetNumber} ${place.route}, ${place.city}, ${place.province} ${place.postalCode}, Canada`;
  await page.route('**/places.googleapis.com/v1/places:autocomplete*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        suggestions: [
          {
            placePrediction: {
              placeId: 'e2e-place-robson',
              text: { text: fullText },
              structuredFormat: {
                mainText: { text: `${place.streetNumber} ${place.route}` },
                secondaryText: { text: `${place.city}, ${place.province}, Canada` },
              },
            },
          },
        ],
      }),
    });
  });

  await page.route('**/places.googleapis.com/v1/places/e2e-place-robson*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'e2e-place-robson',
        formattedAddress: fullText,
        location: { latitude: place.lat, longitude: place.lng },
        addressComponents: [
          { longText: place.streetNumber, shortText: place.streetNumber, types: ['street_number'] },
          { longText: place.route, shortText: place.route, types: ['route'] },
          { longText: place.city, shortText: place.city, types: ['locality'] },
          { longText: 'British Columbia', shortText: place.province, types: ['administrative_area_level_1'] },
          { longText: place.postalCode, shortText: place.postalCode, types: ['postal_code'] },
          { longText: 'Canada', shortText: place.country, types: ['country'] },
        ],
      }),
    });
  });
}

export interface ErrorGuard {
  serverErrors: Array<{ url: string; status: number; body?: string }>;
  pageErrors: string[];
}

/**
 * Attaches listeners to catch any HTTP 500+ backend errors or uncaught page errors
 * so broken screens never silently pass.
 */
export function attachErrorGuards(page: Page): ErrorGuard {
  const guard: ErrorGuard = { serverErrors: [], pageErrors: [] };

  page.on('response', async (res) => {
    if (res.status() >= 500) {
      let body = '';
      try {
        body = (await res.text()).slice(0, 300);
      } catch {
        // ignore unreadable body
      }
      guard.serverErrors.push({ url: res.url(), status: res.status(), body });
    }
  });

  page.on('pageerror', (err) => {
    guard.pageErrors.push(err.message);
  });

  return guard;
}

export function assertNoServerErrors(guard: ErrorGuard, contextLabel = 'page'): void {
  expect(
    guard.serverErrors,
    `Expected zero HTTP 500+ errors during ${contextLabel}, got: ${JSON.stringify(guard.serverErrors)}`
  ).toEqual([]);
  expect(
    guard.pageErrors,
    `Expected zero uncaught page errors during ${contextLabel}, got: ${JSON.stringify(guard.pageErrors)}`
  ).toEqual([]);
}

export interface PropertyInput {
  role: 'admin' | 'agent' | 'guest';
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  squareFootage?: string;
  useExistingListing?: boolean;
  agentName?: string;
}

/**
 * Drives the real Property tab UI: selects Agent (for Admin), fills address/SqFt
 * (or picks an existing listing), attaches a proof screenshot, and clicks Next.
 */
export async function fillPropertyAndNext(
  page: Page,
  testInfo: TestInfo,
  opts: PropertyInput
): Promise<void> {
  const sqft = opts.squareFootage ?? '2000';
  const address = opts.address ?? '100 Robson St';
  const city = opts.city ?? 'Vancouver';
  const postalCode = opts.postalCode ?? 'V6B 2A7';

  if (opts.role === 'admin') {
    const agentBtn = page.getByRole('button', { name: /Select Agent/i });
    if (await agentBtn.isVisible().catch(() => false)) {
      await agentBtn.click();
      const targetAgent = opts.agentName ?? 'E2E Agent';
      await page.getByText(new RegExp(targetAgent, 'i')).first().click();
    }
  }

  if (opts.useExistingListing) {
    const listingBtn = page.getByRole('button', { name: /Search listings/i });
    await listingBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForLoadState('networkidle');
    await listingBtn.click();
    const listingOption = page.locator('[cmdk-item], [role="option"]', { hasText: new RegExp(address, 'i') }).first();
    await listingOption.waitFor({ state: 'visible', timeout: 15_000 });
    await listingOption.click();
  } else {
    const createAccordion = page.getByRole('button', { name: /Create New Booking/i });
    if (await createAccordion.isVisible().catch(() => false)) {
      const expanded = await createAccordion.getAttribute('aria-expanded');
      if (expanded !== 'true') {
        await createAccordion.click();
      }
    }

    const sqftInput = page.locator('input[placeholder*="2230"]').first();
    await sqftInput.waitFor({ state: 'visible', timeout: 10_000 });
    await sqftInput.fill(sqft);

    const addressInput = page.getByPlaceholder('Enter an address').first();
    await addressInput.waitFor({ state: 'visible', timeout: 10_000 });
    await addressInput.click();
    await addressInput.pressSequentially(`${address}, ${city}`, { delay: 35 });

    // Wait for the Google Places suggestion dropdown (#places-suggestions) and click the first result
    const suggestionBox = page.locator('#places-suggestions');
    await suggestionBox.waitFor({ state: 'visible', timeout: 8_000 });
    await suggestionBox.locator('> *').first().click();

    // Ensure City & Postal Code are populated (fallback if any field wasn't filled by place details)
    const cityInput = page.locator('input[placeholder*="Calgary" i]').first();
    if (await cityInput.isVisible().catch(() => false)) {
      const currentCity = await cityInput.inputValue();
      if (!currentCity.trim()) await cityInput.fill(city);
    }

    const postalInput = page.locator('input[placeholder*="T2P 2M2" i], input[placeholder*="90210" i]').first();
    if (await postalInput.isVisible().catch(() => false)) {
      const currentPostal = await postalInput.inputValue();
      if (!currentPostal.trim()) await postalInput.fill(postalCode);
    }
  }

  await attachProofScreenshot(
    page,
    testInfo,
    `Property Filled (${opts.useExistingListing ? 'Existing Listing' : `${address}, ${city} | ${sqft} sqft`})`
  );

  const nextBtn = page.getByRole('button', { name: /^Next$/i }).first();
  await expect(nextBtn).toBeEnabled({ timeout: 10_000 });
  await nextBtn.click();
}

/**
 * Drives the real Services tab UI: selects each named service's "Standard" option,
 * attaches a proof screenshot, and clicks Next.
 */
export async function selectServicesAndNext(
  page: Page,
  testInfo: TestInfo,
  serviceNames: string[]
): Promise<void> {
  for (const svcName of serviceNames) {
    const card = page.locator('.group\\/card-wrapper', { hasText: svcName }).first();
    await card.waitFor({ state: 'visible', timeout: 15_000 });
    const addToCartBtn = card.getByRole('button', { name: /Add to Cart/i }).first();
    await addToCartBtn.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -180));
    await addToCartBtn.click({ force: true });
  }

  await attachProofScreenshot(page, testInfo, `Services Selected (${serviceNames.join(', ')})`);

  const nextBtn = page.getByRole('button', { name: /^Next$/i }).first();
  await expect(nextBtn).toBeEnabled({ timeout: 10_000 });
  await nextBtn.click();
}

/**
 * On the Schedule tab, selects a specific vendor in the vendor dropdown (when visible)
 * and waits for the OneDayCalendar timegrid to render.
 */
export async function selectVendorOnSchedule(
  page: Page,
  vendorName: string,
  serviceIndex = 0
): Promise<void> {
  const triggers = page.locator('button[role="combobox"]');
  const trigger = triggers.nth(serviceIndex);
  await trigger.waitFor({ state: 'visible', timeout: 15_000 });
  await trigger.click();

  const option = page.getByRole('option', { name: new RegExp(vendorName, 'i') }).first();
  await option.waitFor({ state: 'visible', timeout: 10_000 });
  await option.click();
  await page.waitForTimeout(600);
}
