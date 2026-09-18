/**
 * Domain Configuration and Validation Utilities
 * 
 * This module provides centralized management of default domains and validation
 * helpers for custom domain organizations.
 */

/**
 * Get all three default domains from environment variables
 * @returns Array of default domain strings
 */
export function getDefaultDomains(): string[] {
  const domains = [
    process.env.NEXT_PUBLIC_DEFAULT_TEAMS_DOMAIN,
    process.env.NEXT_PUBLIC_DEFAULT_BOOKINGS_DOMAIN,
    process.env.NEXT_PUBLIC_DEFAULT_VENDORS_DOMAIN,
  ].filter((d): d is string => !!d);

  // Fallback to hardcoded defaults if env vars are not set
  if (domains.length === 0) {
    console.log('No default domains found, using local defaults pointing to tojuco.com');
    return [
      'teams.tojuco.com',
      'bookings.tojuco.com',
      'vendors.tojuco.com'
    ];
  }

  return domains;
}

/**
 * Resolve the portal type for a configured platform domain.
 * Development aliases are enabled only in the develop environment.
 */
export function getConfiguredDefaultPortalType(domain: string): string | null {
  const normalizedDomain = cleanDomain(domain);
  if (!normalizedDomain) return null;

  const [teams, bookings, vendors] = getDefaultDomains().map((item) => cleanDomain(item));
  if (normalizedDomain === teams) return 'admin';
  if (normalizedDomain === bookings) return 'agent';
  if (normalizedDomain === vendors) return 'vendor';

  const productionToursDomain = cleanDomain(process.env.NEXT_PUBLIC_DEFAULT_TOURS_DOMAIN || '');
  if (productionToursDomain && normalizedDomain === productionToursDomain) return 'tours';

  if (process.env.NEXT_PUBLIC_ENV !== 'develop') return null;

  const developmentDomains: Record<string, string> = {
    [cleanDomain(process.env.NEXT_PUBLIC_DEFAULT_ROOT_DOMAIN || '')]: 'admin',
    [cleanDomain(process.env.NEXT_PUBLIC_DEFAULT_ADMIN_DOMAIN || '')]: 'admin',
    [cleanDomain(process.env.NEXT_PUBLIC_DEFAULT_VENDOR_DOMAIN || '')]: 'vendor',
    [cleanDomain(process.env.NEXT_PUBLIC_DEFAULT_AGENT_DOMAIN || '')]: 'agent',
    [cleanDomain(process.env.NEXT_PUBLIC_DEFAULT_DEV_TOURS_DOMAIN || '')]: 'tours',
  };

  return developmentDomains[normalizedDomain] || null;
}

/**
 * Get the base domain for default organizations (tojuco.com)
 * @returns Base domain string
 */
export function getDefaultBaseDomain(): string {
  return process.env.NEXT_PUBLIC_DEFAULT_BASE_DOMAIN || 'tojuco.com';
}

/**
 * Clean and sanitize domain input by removing protocols, port numbers, and trailing slashes.
 * Examples:
 * - "https://booking.bcfloorplans.com/" -> "booking.bcfloorplans.com"
 * - "http://media.commerx.com:3000" -> "media.commerx.com"
 * @param domain Raw input domain string
 * @returns Clean hostname
 */
export function cleanDomain(domain: string): string {
  if (!domain) return '';
  const firstHost = domain.split(',')[0].trim();
  return firstHost
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .split(':')[0]
    .replace(/\/+$/, '');
}

/**
 * Extract the base domain from a subdomain or full domain
 * Examples:
 * - "teams.commerx.com" → "commerx.com"
 * - "commerx.com" → "commerx.com"
 * - "api.teams.commerx.com" → "commerx.com"
 * @param domain Full domain or subdomain string
 * @returns Base domain (e.g., "commerx.com")
 */
export function extractBaseDomain(domain: string): string {
  const parts = cleanDomain(domain).split('.');

  // If less than 2 parts, return as-is
  if (parts.length < 2) {
    return cleanDomain(domain);
  }

  // Return the last two parts (e.g., "commerx.com" from "teams.commerx.com")
  return parts.slice(-2).join('.');
}

/**
 * Check if a domain is a localhost or development domain
 * @param domain Domain to check
 * @returns true if domain is localhost or development loopback
 */
export function isLocalhostDomain(domain: string): boolean {
  if (!domain) return false;
  const normalizedDomain = domain.trim().toLowerCase();
  return (
    normalizedDomain === 'localhost' ||
    normalizedDomain === '127.0.0.1' ||
    normalizedDomain.endsWith('.localhost')
  );
}

/**
 * Fallback portal type resolution for localhost/development testing ONLY.
 * For production / live domains, dynamic database resolution must always be used.
 * @param domain Localhost domain string
 * @returns 'agent' | 'vendor' | 'tours' | 'admin'
 */
export function getLocalhostPortalType(domain: string): string {
  const h = domain.trim().toLowerCase();

  if (isTourDomain(h)) {
    return 'tours';
  }

  if (
    h.includes('booking') ||
    h.includes('agent') ||
    h.includes('booking-new') ||
    h.includes('agents-new')
  ) {
    return 'agent';
  }

  if (
    h.includes('vendors-new') ||
    h.includes('vendor') ||
    h.includes('vendors')
  ) {
    return 'vendor';
  }

  return 'admin';
}

/**
 * Check if a domain is one of the 3 configured default domains from environment variables
 * or a localhost/dev domain.
 * @param domain Domain to check
 * @returns true if domain is a default domain or localhost
 */
export function isDefaultDomain(domain: string): boolean {
  if (!domain) return false;

  const normalizedDomain = domain.trim().toLowerCase();
  if (getConfiguredDefaultPortalType(normalizedDomain)) {
    return true;
  }

  // 2. Check for localhost and development environments
  return isLocalhostDomain(normalizedDomain);
}

/**
 * Check if a domain is a tours subdomain (tours.* or tour.*)
 * @param domain Domain to check
 * @returns true if domain is a tours subdomain
 */
export function isTourDomain(domain: string): boolean {
  if (!domain) return false;
  const normalizedDomain = domain.trim().toLowerCase();
  return (
    normalizedDomain.startsWith('tours.') ||
    normalizedDomain.startsWith('tour.') ||
    normalizedDomain === 'tours.localhost' ||
    normalizedDomain === 'tour.localhost'
  );
}

/**
 * Validate that a subdomain's base matches the custom domain
 * Examples:
 * - customDomain="commerx.com", subdomain="teams.commerx.com" → true
 * - customDomain="commerx.com", subdomain="teams.bcfloorplans.com" → false
 * @param customDomain The custom domain (e.g., "commerx.com")
 * @param subdomain The full subdomain (e.g., "teams.commerx.com")
 * @returns true if subdomain's base matches customDomain
 */
export function isDomainMatchingSubdomain(
  customDomain: string,
  subdomain: string
): boolean {
  if (!customDomain || !subdomain) return false;

  const normalizedCustomDomain = customDomain.trim().toLowerCase();
  const subdomainBase = extractBaseDomain(subdomain);

  return normalizedCustomDomain === subdomainBase;
}

/**
 * Get a user-friendly error message for default domain attempts
 * @param domain The domain that was rejected
 * @returns Error message string
 */
export function getDefaultDomainErrorMessage(domain: string): string {
  const baseDomain = getDefaultBaseDomain();

  if (domain.trim().toLowerCase() === baseDomain) {
    return `The base domain '${baseDomain}' is reserved and cannot be used as a custom domain. Create a subdomain for your own domain instead.`;
  }

  return `'${domain}' is a default domain and cannot be added as a custom domain. Please use your own domain.`;
}

/**
 * Get a user-friendly warning message for subdomain mismatches
 * @param customDomain The custom domain that was configured
 * @param subdomainBase The base domain extracted from the subdomain
 * @returns Warning message string
 */
export function getSubdomainMismatchWarning(
  customDomain: string,
  subdomainBase: string
): string {
  return `Subdomain base '${subdomainBase}' doesn't match your custom domain '${customDomain}'. This may cause routing issues.`;
}
