# BCF Frontend E2E Automation — Team Member Setup & Delegation Guide

This folder contains the starter **Playwright** E2E setup and the complete **32-case UI Test Specification** (`UI_AUTOMATION_TEST_SPEC.md`, compatible with both **Playwright** and **Puppeteer**).

---

## 1. One-Time Setup

### Step 1: Seed the Disposable Test Backend (`bcf-api`)
> **Never run E2E booking tests against production or shared client staging.**

On your local/dev `bcf-api` machine (with `MAIL_MAILER=log` and `QUEUE_CONNECTION=sync` in `.env`):
```bash
cd bcf-api
php artisan migrate:fresh --seeder=BookingE2ESeeder
php artisan serve --port=8000
```

### Step 2: Configure & Start Frontend (`bcf-admin`)
```bash
cd bcf-admin
cp .env.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:8000
#   NEXT_PUBLIC_PLACES_API_KEY=<your-dev-google-maps-key>

npm install
npm run dev
```

### Step 3: Install Playwright (or Plug Into Your Existing Puppeteer Runner)
```bash
cd bcf-admin
npm install -D @playwright/test dotenv
npx playwright install chromium

cp e2e/.env.e2e.example e2e/.env.e2e
```

---

## 2. Running & Monitoring Tests

```bash
# Run the full E2E suite (headless)
npx playwright test

# Run with visible browser (great for debugging FullCalendar / Google Maps)
npx playwright test --headed

# Run a single test by ID (e.g., UI-29)
npx playwright test -g "UI-29"

# Open the interactive HTML report (includes failure screenshots, videos & traces)
npx playwright show-report
```

---

## 3. What to Send Back After a Run (Sign-Off Deliverables)
1. **HTML Report** (`playwright-report/index.html` — or Jest/Puppeteer HTML report).
2. **Pass/Fail Scorecard** against all 32 cases in `e2e/UI_AUTOMATION_TEST_SPEC.md`.
3. For any failing test: attach the screenshot/trace from `test-results/` plus the failing request/response payload from DevTools Network.
