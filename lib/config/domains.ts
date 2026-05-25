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
 * Get the base domain for default organizations (tojuco.com)
 * @returns Base domain string
 */
export function getDefaultBaseDomain(): string {
  return process.env.NEXT_PUBLIC_DEFAULT_BASE_DOMAIN || 'tojuco.com';
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
  const parts = domain.trim().toLowerCase().split('.');

  // If less than 2 parts, return as-is
  if (parts.length < 2) {
    return domain.trim().toLowerCase();
  }

  // Return the last two parts (e.g., "commerx.com" from "teams.commerx.com")
  return parts.slice(-2).join('.');
}

/**
 * Check if a domain is one of the default domains or the bcfloorplans.com base
 * @param domain Domain to check
 * @returns true if domain is a default domain or bcfloorplans.com
 */
export function isDefaultDomain(domain: string): boolean {
  if (!domain) return false;

  const normalizedDomain = domain.trim().toLowerCase();
  const baseDomain = getDefaultBaseDomain();
  const defaultDomains = getDefaultDomains();

  // 1. Check if it's the base domain (bcfloorplans.com)
  if (normalizedDomain === baseDomain) {
    return true;
  }

  // 2. Check if it's one of the three default domains from env (e.g. teams-new.bcfloorplans.com)
  if (defaultDomains.some((d) => d && normalizedDomain === d.toLowerCase())) {
    return true;
  }

  // 3. Check for localhost and development environments
  const devDomains = [
    'localhost',
    '127.0.0.1',
    'booking-new.localhost',
    'teams-new.localhost',
    'vendors-new.localhost',
  ];

  return devDomains.includes(normalizedDomain);
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
