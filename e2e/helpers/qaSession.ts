import type { Page, TestInfo } from '@playwright/test';

export interface ApiTransactionLog {
  method: string;
  url: string;
  status: number;
  summary: string;
}

export interface QaDiagnostics {
  consoleErrors: string[];
  pageErrors: string[];
  failedApiCalls: string[];
  apiTransactions: ApiTransactionLog[];
}

const MUTATION_PATH_PATTERNS = [
  /\/api\/orders(\/|$)/i,
  /\/api\/vendor-breaks(\/|$)/i,
  /\/api\/properties(\/|$)/i,
];

/**
 * Attaches non-blocking QA diagnostic listeners to a Playwright page.
 *
 * Key behavior (matching how a skilled human QA works):
 * - Unrelated console errors or background 4xx/5xx requests NEVER abort the test.
 * - Every console error, uncaught page error, failed API call, and key booking
 *   mutation is recorded and attached to the report for full visibility.
 */
export function attachQaDiagnostics(page: Page): {
  data: QaDiagnostics;
  flush: (testInfo: TestInfo) => Promise<void>;
} {
  const data: QaDiagnostics = {
    consoleErrors: [],
    pageErrors: [],
    failedApiCalls: [],
    apiTransactions: [],
  };

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text().trim();
      if (text && !data.consoleErrors.includes(text)) {
        data.consoleErrors.push(text.slice(0, 300));
      }
    }
  });

  page.on('pageerror', (err) => {
    const text = err.message?.trim() || String(err);
    if (text && !data.pageErrors.includes(text)) {
      data.pageErrors.push(text.slice(0, 300));
    }
  });

  page.on('response', async (res) => {
    const url = res.url();
    const status = res.status();
    const method = res.request().method();

    if (status >= 400 && url.includes('/api/')) {
      let pathname = url;
      try {
        pathname = new URL(url).pathname;
      } catch {
        // Keep raw URL
      }
      const entry = `${method} ${pathname} → HTTP ${status}`;
      if (!data.failedApiCalls.includes(entry)) {
        data.failedApiCalls.push(entry);
      }
    }

    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) &&
      MUTATION_PATH_PATTERNS.some((re) => re.test(url))
    ) {
      let pathname = url;
      try {
        pathname = new URL(url).pathname;
      } catch {
        // Keep raw URL
      }
      let summary = `HTTP ${status}`;
      try {
        const json = await res.json();
        const orderId = json?.data?.id || json?.order?.id || json?.id;
        const msg = json?.message;
        if (orderId) {
          summary = `Order #${orderId} created/updated`;
        } else if (typeof msg === 'string') {
          summary = msg.slice(0, 120);
        } else if (json?.success === true) {
          summary = 'Succeeded';
        }
      } catch {
        // Non-JSON response body
      }

      data.apiTransactions.push({
        method,
        url: pathname,
        status,
        summary,
      });
    }
  });

  return {
    data,
    flush: async (testInfo: TestInfo) => {
      await testInfo.attach('qa-diagnostics.json', {
        body: Buffer.from(JSON.stringify(data, null, 2), 'utf-8'),
        contentType: 'application/json',
      });
    },
  };
}
