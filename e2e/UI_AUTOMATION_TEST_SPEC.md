# UI E2E Automation Suite (Playwright & Puppeteer) — Booking, Calendar, Travel & Breaks

This specification covers all **32 UI-dependent use cases** from the 65-case suite and is written to work seamlessly with **either Playwright (`bcf-admin/e2e/`) or Puppeteer**.

---

## 1. Full 65-Use-Case Automation Coverage Split

| Automation Layer | Where It Lives | Use Cases Covered | How to Run |
| :--- | :--- | :--- | :--- |
| **Backend PHPUnit (Part 1)** | `bcf-api/tests/Feature/BookingOverlapAndAvailabilityTest.php` | UC-03, UC-09, UC-12, UC-13, UC-14, UC-17, UC-21, UC-22, UC-23, UC-24, UC-26, UC-27, UC-28, UC-30, UC-38 | `php artisan test --filter=BookingOverlapAndAvailabilityTest` |
| **Backend PHPUnit (Part 2)** | `bcf-api/tests/Feature/BookingLifecycleAndBreaksTest.php` | UC-42, UC-43, UC-44, UC-45, UC-46, UC-47, UC-49, UC-50, UC-51 | `php artisan test --filter=BookingLifecycleAndBreaksTest` |
| **Backend PHPUnit (Part 3)** | `bcf-api/tests/Feature/GoogleCalendarSyncAndAvailabilityTest.php` | UC-53, UC-54, UC-55, UC-56, UC-57, UC-58, UC-59, UC-60 | `php artisan test --filter=GoogleCalendarSyncAndAvailabilityTest` |
| **Backend PHPUnit (Part 4)** | `bcf-api/tests/Feature/BookingAuthorizationAndTwilightTest.php` | UC-07, UC-10, UC-61, UC-62, UC-64, UC-65 | `php artisan test --filter=BookingAuthorizationAndTwilightTest` |
| **Frontend E2E (Playwright / Puppeteer)** | `bcf-admin/e2e/` + this spec | UC-01, UC-02, UC-04, UC-05, UC-06, UC-08, UC-11, UC-12 (UI), UC-14 (UI), UC-15, UC-16, UC-18, UC-19, UC-20, UC-25, UC-26/27 (UI), UC-29, UC-31, UC-32, UC-33, UC-34, UC-35, UC-36, UC-37, UC-39, UC-40, UC-41, UC-43 (UI), UC-46/47 (UI), UC-48, UC-58 (UI), UC-63 | `npx playwright test` (or your Puppeteer/Jest runner) |

---

## 2. Test Environment & Playwright vs. Puppeteer Equivalents

### Deterministic Backend Seed (Run Before Every Suite)
```bash
cd bcf-api
php artisan migrate:fresh --seeder=BookingE2ESeeder
```

### Playwright vs. Puppeteer API Cheat Sheet

| Capability Needed by Tests | Playwright (`@playwright/test`) | Puppeteer (`puppeteer`) |
| :--- | :--- | :--- |
| **Timezone Emulation** *(UI-27, UI-31, UI-32)* | `test.use({ timezoneId: 'America/Vancouver' })` or `browser.newContext({ timezoneId })` | `await page.emulateTimezone('America/Vancouver')` |
| **Mock Vendor Google Events** *(UI-05, UI-07, UI-29)* | `await page.route('**/api/vendors*', ...)` *(see `e2e/helpers/authAndMocks.ts`)* | `await page.setRequestInterception(true)` + `page.on('request', ...)` |
| **Throttle Network (Slow 3G)** *(UI-15)* | `const cdp = await page.context().newCDPSession(page); await cdp.send('Network.emulateNetworkConditions', ...)` | `await page.emulateNetworkConditions(PredefinedNetworkConditions['Slow 3G'])` |
| **Two Concurrent Users / Tabs** *(UI-17)* | `const ctxA = await browser.newContext(); const ctxB = await browser.newContext();` | `const ctxA = await browser.createBrowserContext(); const ctxB = await browser.createBrowserContext();` |
| **Assert Outgoing API Payload** *(UI-01, UI-08, UI-21, UI-22)* | `page.on('request', ...)` / `page.waitForResponse('**/api/orders')` | `page.on('request', ...)` / `page.waitForResponse(r => r.url().includes('/api/orders'))` |
| **Reports & Failure Screenshots** | Built-in `playwright-report/index.html` + `screenshot: 'only-on-failure'` | `jest-html-reporter` + `await page.screenshot({ path: ... })` in `afterEach` |

---

## 3. UI Automated Test Cases (32 Cases — Playwright & Puppeteer)

### Group 1: Agent `book-now` & Dashboard Booking UI

| ID | Route & Role | Browser Steps | Automated Assertions (DOM + Network) |
| :--- | :--- | :--- | :--- |
| **UI-01** *(UC-01)* | `/agent/book-now` (Guest → Agent login) | 1. Clear `localStorage`.<br>2. Fill Property address + SqFt → Next.<br>3. Select 1 service → Next → sign in as Agent in `RealtorLogin`.<br>4. Reach **Schedule** tab on `T+5 days` for `Victor Alpha`.<br>5. Pick an open slot → Confirmation → Submit. | - `10:00–11:00` MUST render as `"Booked"` (NOT `slot-available`).<br>- `POST /api/orders` includes valid `Authorization: Bearer <token>` and returns `201`. |
| **UI-02** *(UC-02)* | `/dashboard/orders/create` (Agent) | 1. Select 2 services (Photos + Floor Plan) at `100 Robson St, Vancouver`.<br>2. Pick `Victor Alpha` at `09:00–10:00` for Service 1.<br>3. On Service 2, click `10:00` when multiple vendors are available → pick `Victor Alpha` in the multi-vendor modal. | - `10:00` succeeds with **0-min travel buffer** (no `"Vendor is not available"` toast).<br>- Both slots appear in `selectedSlots` with `09:00–10:00` and `10:00–11:00`. |
| **UI-03** *(UC-04)* | `/dashboard/orders/create` (Agent) | 1. Select a 60-min service.<br>2. View a vendor with only a 30-min gap before lunch (`11:30–12:00`). | - `11:30` and `11:45` MUST NOT have class `.slot-available` for Agents.<br>- Clicking them must not show a misleading green slot followed by error toast. |
| **UI-04** *(UC-05)* | `/dashboard/orders/create` & `/dashboard/calendar` (Admin/Agent) | 1. Enter `square_footage = 3500` on Property.<br>2. Select `E2E Floor Plan` (`45m` base / `1500sqft` + `30m/1000sqft`).<br>3. Compare calculated duration on Order Schedule tab vs Calendar Edit Appointment tab. | - Both views calculate **105 mins** (7 × 15-min slots), not the hardcoded 60m/2000sqft fallback. |
| **UI-05** *(UC-06)* | `/dashboard/orders/create` (Agent) | 1. Inject mock Google event (`13:00–14:00`, `"Personal Dentist Visit"`).<br>2. Open Schedule tab for `Victor Alpha` (lunch `12:00–13:00`, travel buffer `09:30–10:00`, Google event `13:00–14:00`). | - All three display `"Booked"` (no `"Vendor Break"`, `"Travel Adjustment"`, or `"Personal Dentist Visit"` visible).<br>- None are clickable; no red `X` trim button appears in DOM. |
| **UI-06** *(UC-08)* | `/dashboard/orders/create` (Agent) | 1. Enter property address `100 Robson St, Vancouver` (outside `Vanessa Beta`'s Surrey polygon).<br>2. Open vendor dropdown on Schedule tab. | - `Vanessa Beta` is NOT listed.<br>- No `"Schedule Override"` switch exists in DOM. |

### Group 2: Admin Booking Freedoms, Overrides & Modals

| ID | Route & Role | Browser Steps | Automated Assertions (DOM + Network) |
| :--- | :--- | :--- | :--- |
| **UI-07** *(UC-11)* | `/dashboard/orders/create` (Admin) | 1. Toggle **Schedule Override** ON.<br>2. Check calendar time range, vendor dropdown, and external Google event slot (`13:00–14:00`).<br>3. Toggle **Recommend Best Time** ON. | - Grid expands to `00:00–23:59`.<br>- Out-of-area (`Vanessa Beta`) and Non-Service vendors appear in dropdown.<br>- External Google event slot is clickable & bookable.<br>- Recommend Best Time includes overridable vendors. |
| **UI-08** *(UC-12 UI)* | `/agent/book-now` (Guest/Agent) & `/dashboard/orders/create` (Admin) | 1. As Guest/Agent, inspect another order's booked slot on `OneDayCalendar`.<br>2. As Admin, click red `X` on the last 15-min chunk (`10:45–11:00`) of another order's booked slot. | - Guest/Agent: **0** red `X` trim buttons in DOM.<br>- Admin: `POST /api/orders/update-slot-time` fires with `end_time: "10:45:00"` and returns `200`. |
| **UI-09** *(UC-14 UI)* | `/dashboard/orders/create` (Admin) | 1. Open Schedule tab as Admin.<br>2. Check for `custom_duration` and `buffer_minutes` controls. | - Both controls are present (consistent with `calendar/Schedule.tsx`) and sent in `POST /api/orders` payload. |
| **UI-10** *(UC-15)* | `/dashboard/orders/create` (Admin) | 1. Click a yellow `"Travel Adjustment"` slot adjacent to an existing booking.<br>2. Confirm override dialog. | - Confirmation modal appears; confirming selects the slot inside the travel buffer. |
| **UI-11** *(UC-16)* | `/dashboard/orders/create` (Admin) | 1. With `allow_booking_through_lunch = true` (seeded).<br>2. Select a 60-min service starting at `11:30` (spans `12:00–13:00` lunch).<br>3. Confirm "Extend across lunch" in dialog. | - Selected slots span `11:30–13:30` (excluding `12:00–13:00`), unaffected by one-time breaks on *other* dates. |
| **UI-12** *(UC-18)* | `/dashboard/orders/create/{pastOrderUuid}?isEdit=true` (Admin) | 1. Open seeded past order (`T-5`) as Admin.<br>2. Navigate to Schedule tab. | - Service card is **interactive** (does NOT have `pointer-events-none`), allowing Admin to reschedule. |
| **UI-13** *(UC-19)* | `/dashboard/calendar` (Admin — `EditSlotTimeModal`) | 1. Right-click a booked event → **Edit Time & Duration**.<br>2. Attempt to set `Start = 11:00`, `End = 09:00` via dropdowns → click Save.<br>3. Attempt to set time overlapping another booking for the same vendor → click Save. | - Inverted time (`11:00–09:00`) is blocked client-side (no API call sent, validation error shown).<br>- Overlapping time shows conflict warning / blocks save (unless explicit override). |
| **UI-14** *(UC-20)* | `/dashboard/orders/create` & `/dashboard/calendar` (Admin) | 1. Inspect Schedule tab switches in both Order and Calendar views. | - No dead/non-functional `"Show All Vendors Regardless of Travel Time"` toggle exists. |

### Group 3: Overlap, Double-Click, Stale Tabs & Cancelled Slots UI

| ID | Route & Role | Browser Steps | Automated Assertions (DOM + Network) |
| :--- | :--- | :--- | :--- |
| **UI-15** *(UC-25)* | `/dashboard/orders/create` (Admin/Agent) | 1. Throttle network (`Slow 3G`) so Google Distance Matrix takes ~1s.<br>2. Rapidly double-click the `09:00` slot on `OneDayCalendar`. | - Only **1 set** of 15-min chunks is added to `selectedSlots` (no duplicate chunks, duration badge shows `60 min`, not `120 min`). |
| **UI-16** *(UC-26/27 UI)* | `/dashboard/orders/create` (Admin/Agent) | 1. Open `OneDayCalendar` on `T+5 days` for `Victor Alpha` (has **cancelled** slot `14:00–15:00`). | - `14:00–15:00` (and adjacent 30-min buffers `13:30–14:00`, `15:00–15:30`) render as **Available**, NOT `"Booked"`. |
| **UI-17** *(UC-29)* | `/dashboard/orders/create` (2 isolated browser contexts: `ctxA`, `ctxB`) | 1. Open `ctxA` and `ctxB` on the same date/vendor.<br>2. In `ctxA`, book `09:00–10:00` and submit.<br>3. In `ctxB`, enter Schedule tab (or submit `09:00–10:00`). | - Entering Schedule tab in `ctxB` refreshes `ordersData` showing `09:00–10:00` as Booked; if submitted concurrently, `ctxB` shows a clear conflict error toast. |

### Group 4: Travel Time, Address Normalization & Batch Matrix UI

| ID | Route & Role | Browser Steps | Automated Assertions (DOM + Network) |
| :--- | :--- | :--- | :--- |
| **UI-18** *(UC-31)* | `/dashboard/orders/create` (Agent) | 1. `Victor Alpha` has a booking at `10:00–11:00` in Surrey (60 min drive from West Vancouver).<br>2. Start a new order in West Vancouver on the same day. | - Slots within the required travel buffer after `11:00` are blocked according to actual/configured travel time. |
| **UI-19** *(UC-32)* | `/dashboard/orders/create` (Agent) | 1. `Victor Alpha` has active booking at `100 Robson St, Vancouver` (`10:00–11:00`).<br>2. Start a new order at `100 Robson St, Burnaby` (same street prefix, different city!). | - Treated as **different properties** (travel buffer applied), NOT falsely matched by street prefix only. |
| **UI-20** *(UC-33)* | `/dashboard/orders/create` (Agent) | 1. Select `E2E Virtual Staging (No Travel)` (`is_travel_required = false`).<br>2. View `Victor Alpha` who has active booking `10:00–11:00` at another address. | - `09:30–10:00` and `11:00–11:30` are **Available** (no 30-min travel buffer blocked). |
| **UI-21** *(UC-34)* | `/dashboard/orders/create` (Admin) | 1. Intercept Google Distance Matrix requests on Schedule tab load. | - `origins` contains vendor `start_location` and `destinations` contains property address (vendor → property, NOT reversed). |
| **UI-22** *(UC-35)* | `/dashboard/orders/create` (Admin) | 1. Select `Charlie NoAddress` (no `start_location` configured).<br>2. Click an available slot on `OneDayCalendar`. | - Zero Google API requests contain `"undefined,undefined,undefined,undefined"`.<br>- No console errors; slot selects cleanly. |
| **UI-23** *(UC-36)* | `/dashboard/orders/create` (Admin) | 1. Rapidly change property address twice while first geocode is still in flight (with network delay). | - Final `filteredVendorsByService` and `vendorDistances` correspond to the **second** address (not dropped by `isRunningRef`). |
| **UI-24** *(UC-37)* | `/dashboard/vendor-billing/pending/{vendorUuid}` (Admin) | 1. Open pending billing for a vendor with **12+ stops** in one day (exceeding 10×10 = 100 elements). | - `batchTravelCalculator` chunks Distance Matrix calls (≤100 elements per request), returning non-zero `totalDistance` and `totalDuration`. |

### Group 5: Breaks, Time-Off & Calendar Display UI

| ID | Route & Role | Browser Steps | Automated Assertions (DOM + Network) |
| :--- | :--- | :--- | :--- |
| **UI-25** *(UC-39)* | `/dashboard/orders/create` (Admin/Agent) | 1. `Victor Alpha` has a **one-time** break on `T+5 days` (`15:30–16:30`).<br>2. Open `OneDayCalendar` on **`T+6 days`** (the next day!). | - `15:30–16:30` on `T+6 days` MUST be **Available** (NOT blocked by `T+5`'s one-time break!). |
| **UI-26** *(UC-40)* | `/dashboard/calendar` (Admin — Month View) | 1. View seeded 3-day time-off (`T+10..T+12`).<br>2. Switch `BigCalendar` to **Month** view with "Show Breaks" ON. | - Time-off spans all 3 calendar cells (`T+10`, `T+11`, `T+12`), not just the first day. |
| **UI-27** *(UC-41)* | `/dashboard/calendar` (Admin — `AddBreakPopup`, timezone `America/Vancouver`) | 1. Click existing break (`09:00–15:00`) → Edit.<br>2. Verify pre-filled Start Date & End Date.<br>3. Change Start Time from `09:00` to `10:00`. | - Start Date stays exact (NOT shifted back 1 day by UTC midnight).<br>- End Time stays `15:00` (NOT overwritten to `11:00`).<br>- Vendor dropdown pre-selects `Victor Alpha`. |
| **UI-28** *(UC-43 UI)* | `/dashboard/calendar` (Admin) | 1. View `BigCalendar` Week view for `Victor Alpha` (Saturday/Sunday `is_off: true`, lunch `12:00–13:00`). | - Lunch break renders Mon–Fri ONLY, **NOT** on Saturday/Sunday. |
| **UI-29** *(UC-58 UI)* | `/dashboard/calendar` (Admin) | 1. Inject mock external Google event (`"Personal Dentist Visit"`).<br>2. Toggle **"Show Breaks"** OFF. | - External Google Calendar event remains **visible** and renders as a Calendar Event (NOT with `"Time Off"` break styling). |

### Group 6: Reassign, Swap & Cross-Timezone UI

| ID | Route & Role | Browser Steps | Automated Assertions (DOM + Network) |
| :--- | :--- | :--- | :--- |
| **UI-30** *(UC-46/47 UI)* | `/dashboard/calendar` (Admin — `VendorSwapReassignModal`) | 1. Right-click a slot → **Quick Reassign / Swap**.<br>2. Inspect Reassign vendor list when target vendor is already booked at that time.<br>3. Switch to **Swap** tab and inspect candidate slots. | - Busy/ineligible vendors show conflict badge or are blocked in Reassign.<br>- Cancelled slots are excluded from Swap candidates.<br>- Swap warns/blocks if either vendor has *another* booking overlapping the swapped time. |
| **UI-31** *(UC-48)* | `/dashboard/calendar` (Admin, timezone `America/Vancouver`) | 1. Right-click seeded **later-today** slot (`now + 3h` in Vancouver) → **Quick Reassign / Swap**. | - Slot is NOT flagged as past; Reassign & Swap submit buttons are **enabled**. |
| **UI-32** *(UC-63)* | `/dashboard/orders/create` (Admin, timezone `America/Toronto`) | 1. Browser timezone = Toronto (EST, UTC-5).<br>2. Create order for a **Vancouver (PST, UTC-8)** property for **today**.<br>3. Inspect slots that are 1–2 hours in the future in Vancouver. | - Upcoming Vancouver slots render as **Available** (NOT falsely grayed out as past time). |
