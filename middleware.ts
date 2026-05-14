import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDefaultDomains } from '@/lib/config/domains';

// Auth routes that are always accessible (no rewrite needed)
const AUTH_ROUTES = [
  '/login',
  '/login-user',
  '/forget-password',
  '/login-first-time',
  '/new-password',
  '/password-success',
];

// Routes that are shared across all portals and should not be rewritten
const SHARED_ROUTES = [
  '/tour',
  '/whitelabel',
];

// Emergency fallback: guess portal type from domain name
// Only used if the API call fails completely or for default domains
function guessPortalTypeFromHostname(hostname: string): string {
  const h = hostname.toLowerCase();
  const defaultDomains = getDefaultDomains();
  const [teams, bookings, vendors] = defaultDomains.map(d => d.toLowerCase());

  // 1. Check for exact matches with default domains
  if (h === bookings) return 'agent';
  if (h === vendors) return 'vendor';
  if (h === teams) return 'admin';

  // 2. Fallback to keyword matching (useful for localhost or custom subdomains if API fails)
  if (
    h.includes('booking') ||
    h.includes('agent') ||
    h.includes('booking-new') ||
    h.includes('agents-new')
  )
    return 'agent';
  if (
    h.includes('vendor-new') ||
    h.includes('vendors-new') ||
    h.includes('vendor')
  )
    return 'vendor';
  return 'admin';
}

// Core routing logic — same for all domains, driven only by portal_type
function buildResponse(
  portalType: string,
  url: URL,
  request: NextRequest
): NextResponse {
  const { pathname, search } = url;

  const isAuthRoute = AUTH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  );

  const isSharedRoute = SHARED_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  );

  // Shared routes are always served as-is
  if (isSharedRoute) {
    return NextResponse.next();
  }

  if (portalType === 'agent') {
    // Block vendor-specific pages
    if (pathname.startsWith('/vendor')) {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
    // Allow agent auth pages, agent pages, and the shared dashboard
    if (
      pathname.startsWith('/agent') ||
      pathname.startsWith('/dashboard')
    ) {
      return NextResponse.next();
    }
    // Rewrite bare paths to /agent prefix
    return NextResponse.rewrite(
      new URL(`/agent${pathname}${search}`, request.url)
    );
  }

  if (portalType === 'vendor') {
    // Block agent-specific pages
    if (pathname.startsWith('/agent')) {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
    // Allow vendor auth pages, vendor pages, and the shared dashboard
    if (
      pathname.startsWith('/vendor') ||
      pathname.startsWith('/dashboard')
    ) {
      return NextResponse.next();
    }
    // Rewrite bare paths to /vendor prefix
    return NextResponse.rewrite(
      new URL(`/vendor${pathname}${search}`, request.url)
    );
  }

  // admin (default)
  // Block portal-specific pages
  if (pathname.startsWith('/agent') || pathname.startsWith('/vendor')) {
    return NextResponse.rewrite(new URL('/404', request.url));
  }
  // Allow auth routes and dashboard
  if (pathname.startsWith('/dashboard') || isAuthRoute) {
    return NextResponse.next();
  }
  // Rewrite bare paths to /dashboard prefix
  return NextResponse.rewrite(
    new URL(`/dashboard${pathname}${search}`, request.url)
  );
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  console.log('>>> MIDDLEWARE HIT:', hostname, url.pathname);

  let portalType = 'admin';
  let orgData: Record<string, unknown> | null = null;

  const domainWithoutPort = hostname.split(':')[0];
  const envDefaultDomains = getDefaultDomains();
  const defaultDomains = [
    ...envDefaultDomains,
    "booking-new.localhost",
    "teams-new.localhost",
    "vendors-new.localhost",
    "localhost",
    "127.0.0.1"
  ];

  const isDefaultDomain = defaultDomains.includes(domainWithoutPort);

  if (!isDefaultDomain) {
    // Always resolve the domain via the API — single source of truth for portal_type
    try {
      const baseApiUrl = (
        process.env.NEXT_PUBLIC_API_URL || 'https://api-stage.bcfloorplans.com'
      ).replace(/\/api\/?$/, '');
      const resolveUrl = `${baseApiUrl}/api/domains/resolve?domain=${hostname}`;
      console.log('Resolving domain:', resolveUrl);

      const res = await fetch(resolveUrl, {
        // 60s edge cache — avoids calling the API on every single request
        next: { revalidate: 60 },
      });

      if (res.ok) {
        orgData = await res.json();
        portalType = (orgData?.portal_type as string) ?? 'admin';
        console.log('Resolved portal_type:', portalType, 'for', hostname);
      } else if (res.status === 404) {
        // If the domain is not found in our database, it's invalid.
        // We should not guess the portal type here.
        console.warn('Domain not found in database:', hostname);
        return NextResponse.rewrite(new URL('/404', request.url));
      } else {
        console.warn(
          'Resolve API returned',
          res.status,
          '— using fallback for',
          hostname
        );
        portalType = guessPortalTypeFromHostname(domainWithoutPort);
      }
    } catch (err) {
      console.error('Domain resolution error:', err);
      portalType = guessPortalTypeFromHostname(domainWithoutPort);
    }
  } else {
    // For default domains, skip API and guess directly
    portalType = guessPortalTypeFromHostname(domainWithoutPort);
    console.log('Default domain detected, guessing portal_type:', portalType, 'for', hostname);
  }

  // Build the routing response based on portal_type
  const response = buildResponse(portalType, url, request);

  // Attach org data as a cookie so client-side OrganizationContext can read it
  if (orgData) {
    response.cookies.set('org_data', JSON.stringify(orgData), {
      path: '/',
      maxAge: 3600, // 1 hour
      sameSite: 'lax',
    });
  } else {
    response.cookies.delete('org_data');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
