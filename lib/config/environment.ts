/**
 * Environment detection helper
 * Supports detection across server-side (SSR) and client-side (browser)
 */

const DEV_VALUES = new Set([
  'develop',
  'dev',
  'development',
  'staging',
  'stage',
  'sandbox',
  'preview',
  'test',
]);

const PROD_VALUES = new Set([
  'production',
  'prod',
  'live',
]);

/**
 * Checks if the current execution context represents a development/staging environment.
 * Strictly respects NEXT_PUBLIC_ENV:
 * - Returns true if NEXT_PUBLIC_ENV is set to develop/staging/dev
 * - Returns true on localhost/127.0.0.1
 * - Returns false on production or when NEXT_PUBLIC_ENV is not set
 * @param host Optional hostname string (from request headers on server or window.location on client)
 */
export function isDevEnvironment(host?: string): boolean {
  // 1. Check explicit environment variables
  const envVars = [
    process.env.NEXT_PUBLIC_ENV,
    process.env.NEXT_PUBLIC_ENVIRONMENT,
    process.env.NEXT_PUBLIC_APP_ENV,
    process.env.APP_ENV,
    process.env.NEXT_PUBLIC_NETX_ENV,
    process.env.NEXT_ENV,
    process.env.NEXT_PUBLIC_NEXT_ENV,
  ];

  for (const env of envVars) {
    if (env) {
      const val = env.trim().toLowerCase();
      if (PROD_VALUES.has(val)) {
        return false;
      }
      if (DEV_VALUES.has(val)) {
        return true;
      }
    }
  }

  // 2. Check for local development loopback
  const currentHost = (
    host || (typeof window !== 'undefined' ? window.location.hostname : '')
  ).trim().toLowerCase();

  if (currentHost) {
    const cleanHost = currentHost.split(':')[0];
    if (
      cleanHost === 'localhost' ||
      cleanHost === '127.0.0.1' ||
      cleanHost.endsWith('.localhost')
    ) {
      return true;
    }
  }

  // If no DEV env variable is configured, it is production -> Do NOT show banner
  return false;
}
