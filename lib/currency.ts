/**
 * Currency utilities for multi-tenant CAD / USD formatting.
 */

export type CurrencyCode = 'CAD' | 'USD';

/**
 * Determine active currency based on organization metadata.
 */
export function getOrgCurrency(org?: any): CurrencyCode {
  if (!org) {
    if (typeof window !== 'undefined') {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          if (userInfo.organization?.country) {
            const c = (userInfo.organization.country || '').toLowerCase();
            if (c.includes('canada') || c === 'ca') return 'CAD';
            if (c.includes('united states') || c === 'us' || c === 'usa') return 'USD';
          }
        }
      } catch {
        // ignore JSON parse errors
      }
    }
    return 'CAD'; // Default to CAD for BCF deployment
  }

  if (org.currency) {
    return org.currency.toUpperCase() === 'USD' ? 'USD' : 'CAD';
  }

  const country = (org.country || '').toLowerCase();
  if (country.includes('canada') || country === 'ca') {
    return 'CAD';
  }
  if (country.includes('united states') || country === 'us' || country === 'usa') {
    return 'USD';
  }

  const slug = (org.slug || '').toLowerCase();
  const name = (org.name || '').toLowerCase();
  if (slug.includes('bcf') || slug.includes('bcfloorplans') || name.includes('bcf') || name.includes('bc floor')) {
    return 'CAD';
  }

  return 'CAD';
}

/**
 * Format numeric amount into localized currency string with optional currency code.
 * e.g. formatCurrency(80, 'CAD') => "$80.00 CAD"
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: CurrencyCode = 'CAD',
  options?: { showCode?: boolean }
): string {
  const showCode = options?.showCode ?? true;
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  const validNum = isNaN(num) ? 0 : num;

  const locale = currency === 'CAD' ? 'en-CA' : 'en-US';
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(validNum);

  return showCode ? `${formatted} ${currency}` : formatted;
}
