# BCF Frontend E2E Automation — Setup, Chunks & Client Reporting Guide

This folder contains all **32 UI E2E test cases** (`UI-01` through `UI-32`) split into **6 lightweight chunks** by business area, plus a custom **Executive & Client HTML/PDF Reporter**.

---

## 1. One-Time Setup

### Step 1: Seed the Disposable Test Backend (`bcf-api`)
> **Never run E2E booking tests against production or shared client staging.**

```bash
cd bcf-api
php artisan migrate:fresh --seeder=BookingE2ESeeder
php artisan serve --port=8000
```

### Step 2: Configure & Start Frontend (`bcf-admin`)
```bash
cd bcf-admin
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000 and NEXT_PUBLIC_PLACES_API_KEY=<dev-key>
npm install
npm run dev
```

### Step 3: Install Playwright
```bash
cd bcf-admin
npm install -D @playwright/test dotenv
npx playwright install chromium
cp e2e/.env.e2e.example e2e/.env.e2e
```

---

## 2. Running All 32 Cases — Or Running in Lightweight Chunks

### Run All 32 Cases Together (Generates Unified 32-Case Client Report)
```bash
npx playwright test
```

### Run Individual Chunks (Fast & Light)
| Chunk File | Business Area | Cases | Command |
| :--- | :--- | :---: | :--- |
| `e2e/01-agent-booking.spec.ts` | Agent Booking, `book-now`, Privacy & Geofence | 6 (`UI-01`–`UI-06`) | `npx playwright test e2e/01-agent-booking.spec.ts` |
| `e2e/02-admin-freedoms.spec.ts` | Admin Overrides, Trimming, Past Orders | 8 (`UI-07`–`UI-14`) | `npx playwright test e2e/02-admin-freedoms.spec.ts` |
| `e2e/03-overlaps-and-concurrency.spec.ts` | Double-Click, Cancelled Slots, 2-Tab Concurrency | 3 (`UI-15`–`UI-17`) | `npx playwright test e2e/03-overlaps-and-concurrency.spec.ts` |
| `e2e/04-travel-and-maps.spec.ts` | Travel Buffers, Non-Travel, Missing Address, Mileage | 7 (`UI-18`–`UI-24`) | `npx playwright test e2e/04-travel-and-maps.spec.ts` |
| `e2e/05-breaks-and-calendar.spec.ts` | One-Time & Multi-Day Breaks, Google vs. Breaks | 5 (`UI-25`–`UI-29`) | `npx playwright test e2e/05-breaks-and-calendar.spec.ts` |
| `e2e/06-reassign-swap-timezones.spec.ts` | Reassign/Swap, Vancouver & Cross-Timezone Safety | 3 (`UI-30`–`UI-32`) | `npx playwright test e2e/06-reassign-swap-timezones.spec.ts` |

*(You can also run 2 chunks together, e.g. `npx playwright test e2e/01-agent-booking.spec.ts e2e/02-admin-freedoms.spec.ts`.)*

---

## 3. Viewing & Sharing Reports

Every run automatically generates **two** reports:
1. **For Business & Client Stakeholders:** `bcf-admin/e2e-reports/client-summary.html`
   - Self-contained single HTML file with embedded proof screenshots, KPI donut chart, plain-English step checklists, and a **Print / Save as PDF** button.
2. **For Developers / QA Debugging:** `npx playwright show-report` (`playwright-report/index.html`)
   - Full traces, network logs, and failure videos.
