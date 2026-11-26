import type { Page, APIRequestContext } from '@playwright/test';

export const E2E_CONFIG = {
  baseUrl: process.env.E2E_BASE_URL || 'http://localhost:3000',
  apiUrl: process.env.E2E_API_URL || 'http://localhost:8000',
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'admin@e2e.test',
    password: process.env.E2E_ADMIN_PASSWORD || 'Password123!',
  },
  agent: {
    email: process.env.E2E_AGENT_EMAIL || 'agent@e2e.test',
    password: process.env.E2E_AGENT_PASSWORD || 'Password123!',
  },
  vendor: {
    email: process.env.E2E_VENDOR_EMAIL || 'vendora@e2e.test',
    password: process.env.E2E_VENDOR_PASSWORD || 'Password123!',
  },
};

export type E2ERole = 'admin' | 'agent' | 'vendor';

/**
 * Authenticates via POST /api/login and injects localStorage tokens matching bcf-admin's login flow.
 * Much faster and more stable than driving the login form on every test.
 */
export async function loginAs(
  page: Page,
  request: APIRequestContext,
  role: E2ERole
): Promise<{ token: string; user: Record<string, unknown> }> {
  const creds = E2E_CONFIG[role];
  const res = await request.post(`${E2E_CONFIG.apiUrl}/api/login`, {
    data: {
      email: creds.email,
      password: creds.password,
      role,
    },
  });

  if (!res.ok()) {
    throw new Error(`E2E API login failed for ${role} (${res.status()}): ${await res.text()}`);
  }

  const body = await res.json();
  const token: string = body?.data?.token || body?.token;
  const user: Record<string, unknown> = body?.data?.user || body?.user || {};

  if (!token) {
    throw new Error(`No token returned from /api/login for ${role}`);
  }

  // Navigate to origin first so localStorage is writable
  await page.goto(E2E_CONFIG.baseUrl, { waitUntil: 'domcontentloaded' });

  await page.evaluate(
    ({ authToken, authRole, authUser }) => {
      localStorage.setItem('token', authToken);
      if (authRole === 'agent') {
        localStorage.setItem('agentToken', authToken);
      }
      localStorage.setItem('userType', authRole);
      localStorage.setItem('userInfo', JSON.stringify(authUser));
    },
    { authToken: token, authRole: role, authUser: user }
  );

  return { token, user };
}

/**
 * Intercepts GET /api/vendors* and injects deterministic mock external Google Calendar events
 * so UI-05, UI-07, and UI-29 run without needing live Google OAuth tokens.
 */
export async function mockVendorGoogleEvents(
  page: Page,
  targetDate: string,
  events: Array<{ id: string; summary: string; start: string; end: string; all_day?: boolean }> = [
    {
      id: 'mock-gcal-ext-1',
      summary: 'Personal Dentist Visit',
      start: `${targetDate}T13:00:00-08:00`,
      end: `${targetDate}T14:00:00-08:00`,
      all_day: false,
    },
  ]
): Promise<void> {
  await page.route('**/api/vendors*', async (route) => {
    const response = await route.fetch();
    const contentType = response.headers()['content-type'] || '';
    if (!contentType.includes('application/json')) {
      return route.fulfill({ response });
    }

    const json = await response.json();
    const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : null;

    if (list) {
      for (const vendor of list) {
        if (vendor?.email === E2E_CONFIG.vendor.email || vendor?.first_name === 'Victor') {
          vendor.calendar_events = [...(vendor.calendar_events || []), ...events];
        }
      }
    }

    await route.fulfill({
      response,
      json,
    });
  });
}

/**
 * Returns YYYY-MM-DD for N days from today in America/Vancouver (matches BookingE2ESeeder).
 */
export function getVancouverDateOffset(daysFromToday: number): string {
  const now = new Date();
  now.setDate(now.getDate() + daysFromToday);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Vancouver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}
