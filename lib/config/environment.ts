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
  'local',
  'test',
]);

/**
 * Checks if the current execution context or hostname represents a development/staging environment.
 * @param host Optional hostname string (from request headers on server or window.location on client)
 */
export function isDevEnvironment(host?: string): boolean {
  // 1. Check explicit environment variables
  const envVars = [
    process.env.NEXT_PUBLIC_NETX_ENV,
    process.env.NETX_ENV,
    process.env.NEXT_PUBLIC_NEXT_ENV,
    process.env.NEXT_ENV,
    process.env.NEXT_PUBLIC_ENV,
    process.env.NEXT_PUBLIC_ENVIRONMENT,
    process.env.ENVIRONMENT,
    process.env.APP_ENV,
    process.env.NEXT_PUBLIC_APP_ENV,
    process.env.VERCEL_ENV,
    process.env.NODE_ENV,
  ];

  for (const env of envVars) {
    if (env) {
      const val = env.trim().toLowerCase();
      if (DEV_VALUES.has(val)) {
        return true;
      }
    }
  }

  // 2. Check API URL or Frontend URL
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '').toLowerCase();
  if (
    apiUrl.includes('api-dev.') ||
    apiUrl.includes('api-stage.') ||
    apiUrl.includes('localhost') ||
    apiUrl.includes('127.0.0.1')
  ) {
    return true;
  }

  const frontendUrl = (
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    ''
  ).toLowerCase();
  if (
    frontendUrl.includes('.dev.') ||
    frontendUrl.includes('//dev.') ||
    frontendUrl.includes('stage') ||
    frontendUrl.includes('localhost')
  ) {
    return true;
  }

  // 3. Check Default Domains configured in env
  const defaultDomains = [
    process.env.NEXT_PUBLIC_DEFAULT_TEAMS_DOMAIN,
    process.env.NEXT_PUBLIC_DEFAULT_BOOKINGS_DOMAIN,
    process.env.NEXT_PUBLIC_DEFAULT_VENDORS_DOMAIN,
  ].filter(Boolean) as string[];

  for (const d of defaultDomains) {
    const dLower = d.toLowerCase();
    if (
      dLower.includes('.dev.') ||
      dLower.startsWith('dev.') ||
      dLower.includes('stage.') ||
      dLower.includes('localhost')
    ) {
      return true;
    }
  }

  // 4. Check Host / Domain name (server-provided or window.location.hostname)
  const currentHost = (
    host || (typeof window !== 'undefined' ? window.location.hostname : '')
  ).trim().toLowerCase();

  if (currentHost) {
    // Strip port if present
    const cleanHost = currentHost.split(':')[0];

    if (
      cleanHost.includes('.dev.') ||
      cleanHost.startsWith('dev.') ||
      cleanHost.includes('dev.tojuco.com') ||
      cleanHost.endsWith('.dev.tojuco.com') ||
      cleanHost.includes('.staging.') ||
      cleanHost.startsWith('stage.') ||
      cleanHost.startsWith('staging.') ||
      cleanHost.includes('localhost') ||
      cleanHost === '127.0.0.1' ||
      cleanHost.endsWith('.localhost') ||
      cleanHost.endsWith('.test') ||
      cleanHost.endsWith('.local')
    ) {
      return true;
    }
  }

  return false;
}
