import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDefaultDomains, isTourDomain, isLocalhostDomain, getLocalhostPortalType, isDefaultDomain, cleanDomain } from '@/lib/config/domains';

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
// Note: /tour and /tours are intentionally excluded here because the white-label
// middleware rewrites them (with org_slug injection) before buildResponse is called.
const SHARED_ROUTES = [
  '/whitelabel',
];

// Determine portal type for default or localhost domains ONLY
function getDefaultOrLocalhostPortalType(hostname: string): string {
  const h = hostname.toLowerCase();
  const defaultDomains = getDefaultDomains();
  const [teams, bookings, vendors] = defaultDomains.map(d => d.toLowerCase());

  // 1. Check for exact matches with default domains
  if (h === bookings) return 'agent';
  if (h === vendors) return 'vendor';
  if (h === teams) return 'admin';

  // 2. Detect tours subdomains (tours.* or tour.*)
  if (isTourDomain(h)) {
    return 'tours';
  }

  // 3. For localhost/development only, support keyword matching
  if (isLocalhostDomain(h)) {
    return getLocalhostPortalType(h);
  }

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

  // ─── Tours-only portal ───────────────────────────────────────────────────
  // Domains: tours.* / tour.* subdomains (e.g. tours.dev.tojuco.com,
  // tours.localhost:3000). Only /tours/* and /tour/* are allowed — everything
  // else is redirected to /tours so the slug-rewrite block can append {org_slug}.
  if (portalType === 'tours') {
    if (pathname.startsWith('/tours') || pathname.startsWith('/tour')) {
      return NextResponse.next();
    }
    // Redirect root and all other paths to /tours (slug will be injected by
    // the rewrite block above, or the page reads ?org_slug= from the query).
    return NextResponse.redirect(new URL(`/tours${search}`, request.url));
  }
  // ─────────────────────────────────────────────────────────────────────────

  if (portalType === 'agent') {
    // Block vendor-specific pages
    if (pathname.startsWith('/vendor')) {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
    // Allow shared public routes: /tour and /tours are served as-is
    // (they were previously in SHARED_ROUTES but moved here so white-label
    //  rewriting can intercept them first on custom domains)
    if (pathname.startsWith('/tour') || pathname.startsWith('/tours')) {
      return NextResponse.next();
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
  // Allow shared public routes: /tour and /tours are served as-is
  if (pathname.startsWith('/tour') || pathname.startsWith('/tours')) {
    return NextResponse.next();
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
  const hostname = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';

  console.log('>>> MIDDLEWARE HIT:', hostname, url.pathname);
  console.log('--- MIDDLEWARE ALL HEADERS ---');
  request.headers.forEach((value, key) => {
    console.log(`  [Header] ${key}: ${value}`);
  });
  console.log('------------------------------');

  let portalType = 'admin';
  let orgData: Record<string, unknown> | null = null;

  const domainWithoutPort = cleanDomain(hostname);

  // tours.localhost / tour.localhost are tours subdomains
  const isToursDomain = isTourDomain(domainWithoutPort);
  const isDefault = isDefaultDomain(domainWithoutPort);

  if (!isDefault && !isToursDomain) {
    // Always resolve the domain via the API — single source of truth for portal_type
    try {
      const baseApiUrl = (
        process.env.NEXT_PUBLIC_API_URL || 'https://api-stage.bcfloorplans.com'
      ).replace(/\/api\/?$/, '');
      const resolveUrl = `${baseApiUrl}/api/domains/resolve?domain=${domainWithoutPort}`;
      console.log('Resolving domain:', resolveUrl);

      const res = await fetch(resolveUrl, {
        // 60s edge cache — avoids calling the API on every single request
        next: { revalidate: 60 },
      });

      if (res.ok) {
        orgData = await res.json();
        portalType = (orgData?.portal_type as string) ?? 'admin';
        console.log('Resolved portal_type:', portalType, 'for', hostname);
      } else {
        // If the domain is not found or fails resolution, strictly return 404.
        // Never guess portal type or silently fallback for custom/public domains.
        console.warn('Domain resolution failed with status', res.status, 'for', hostname);
        return NextResponse.rewrite(new URL('/404', request.url));
      }
    } catch (err) {
      console.error('Domain resolution network error for', hostname, ':', err);
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  } else {
    // For default domains and localhost, determine portal directly
    portalType = getDefaultOrLocalhostPortalType(domainWithoutPort);
    console.log('Default/Localhost domain detected, using portal_type:', portalType, 'for', hostname);
  }

  // Always enforce tours portal type on tours subdomains — regardless of what
  // the API returned. This guarantees the lockdown applies even if the backend
  // doesn't explicitly set portal_type:'tours' for the domain.
  if (isToursDomain) {
    portalType = 'tours';
    console.log('[Middleware] Tours domain detected — forcing portalType to "tours"');

    const pathname = url.pathname;
    const search = url.search;
    const segments = pathname.split('/').filter(Boolean);
    const orgSlug = (orgData?.slug as string) || '';

    // 1. Root "/" on a dedicated tour domain with known org slug: redirect to "/[slug]"
    if (orgSlug && (pathname === '/' || segments.length === 0)) {
      const targetUrl = new URL(`/${orgSlug}${search}`, request.url);
      console.log(`[Middleware] Tours dedicated domain root redirect: ${pathname} -> ${targetUrl.pathname}`);
      const response = NextResponse.redirect(targetUrl);
      if (orgData) {
        response.cookies.set('org_data', JSON.stringify(orgData), {
          path: '/',
          maxAge: 3600,
          sameSite: 'lax',
        });
      }
      return response;
    }

    // 2. Root "/" on generic tours domain with ?org_slug= query param: redirect to "/[org_slug]"
    if (pathname === '/' && url.searchParams.get('org_slug')) {
      const slugFromQuery = url.searchParams.get('org_slug');
      const targetUrl = new URL(`/${slugFromQuery}${search}`, request.url);
      console.log(`[Middleware] Tours query param root redirect: ${pathname} -> ${targetUrl.pathname}`);
      return NextResponse.redirect(targetUrl);
    }

    // 3. Single slug path: "/[org_slug]" (e.g. "/bcfloorplans")
    //    Rewrite to "/tours/[org_slug]" so app/tours/[org_slug]/page.tsx renders,
    //    while browser URL stays https://tours.tojuco.com/bcfloorplans
    if (segments.length === 1 && segments[0] !== 'tours' && segments[0] !== 'tour' && segments[0] !== 'whitelabel') {
      const slugParam = segments[0];
      const targetUrl = new URL(`/tours/${slugParam}${search}`, request.url);
      console.log(`[Middleware] Rewriting tours slug route: ${pathname} -> ${targetUrl.pathname}`);
      const response = NextResponse.rewrite(targetUrl);
      if (orgData) {
        response.cookies.set('org_data', JSON.stringify(orgData), {
          path: '/',
          maxAge: 3600,
          sameSite: 'lax',
        });
      }
      return response;
    }

    // 4. Direct "/tours/[org_slug]" -> redirect to "/[org_slug]" for clean URLs
    if (segments.length === 2 && segments[0] === 'tours') {
      const targetUrl = new URL(`/${segments[1]}${search}`, request.url);
      console.log(`[Middleware] Redirecting /tours/[slug] -> /[slug]: ${pathname} -> ${targetUrl.pathname}`);
      return NextResponse.redirect(targetUrl);
    }

    // 5. Allow "/tour/..." as-is (e.g. "/tour/[address]/[uuid]" or "/tour/feature-sheet/[uuid]")
    if (pathname.startsWith('/tour')) {
      const response = NextResponse.next();
      if (orgData) {
        response.cookies.set('org_data', JSON.stringify(orgData), {
          path: '/',
          maxAge: 3600,
          sameSite: 'lax',
        });
      }
      return response;
    }

    // 6. Allow "/tours" as-is (fallback when no slug available)
    if (pathname === '/tours' || pathname === '/tours/') {
      const response = NextResponse.next();
      if (orgData) {
        response.cookies.set('org_data', JSON.stringify(orgData), {
          path: '/',
          maxAge: 3600,
          sameSite: 'lax',
        });
      }
      return response;
    }

    // 7. Any other path on tours portal (e.g. /dashboard, /agent, /vendor, /login) -> 404
    return NextResponse.rewrite(new URL('/404', request.url));
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
    '/((?!api|_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.pdf$).*)',
  ],
};
