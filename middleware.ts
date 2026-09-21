import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getConfiguredDefaultPortalType, isTourDomain, isLocalhostDomain, isDefaultDomain, getLocalhostPortalType, cleanDomain } from '@/lib/config/domains';

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
  const configuredPortalType = getConfiguredDefaultPortalType(h);
  if (configuredPortalType) return configuredPortalType;

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

  // Default/local tour hosts are configured explicitly. Custom hosts become
  // tour portals only when the resolver returns portal_type: "tours".
  const isDefaultTourDomain = getConfiguredDefaultPortalType(domainWithoutPort) === 'tours';
  const isLocalTourDomain = isLocalhostDomain(domainWithoutPort) && isTourDomain(domainWithoutPort);
  const isLocalDomain = isLocalhostDomain(domainWithoutPort);
  const isConfiguredDefaultDomain = isDefaultDomain(domainWithoutPort);

  if (!isLocalDomain && !isConfiguredDefaultDomain) {
    // Resolve every non-default production hostname so organization-owned
    // aliases cannot silently inherit a platform portal.
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
        // Never guess a portal type for an unmapped production hostname.
        console.warn('Domain resolution failed with status', res.status, 'for', hostname);
        return NextResponse.rewrite(new URL('/404', request.url));
      }
    } catch (err) {
      console.error('Domain resolution network error for', hostname, ':', err);
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  } else {
    // Localhost and configured default domains use direct portal routing.
    portalType = getDefaultOrLocalhostPortalType(domainWithoutPort);
    console.log('Localhost/tours domain detected, using portal_type:', portalType, 'for', hostname);
  }

  // A custom hostname is a tours portal only when the resolver explicitly
  // returns portal_type: "tours". Configured platform tour domains are
  // identified locally and do not have organization data.
  const isResolvedToursDomain = portalType === 'tours' && !!orgData;
  const isToursPortal = isDefaultTourDomain || isLocalTourDomain || isResolvedToursDomain;

  if (isToursPortal) {
    portalType = 'tours';
    console.log('[Middleware] Tours portal selected:', domainWithoutPort);

    const pathname = url.pathname;
    const search = url.search;
    const segments = pathname.split('/').filter(Boolean);
    const orgSlug = (orgData?.slug as string) || '';

    if (isResolvedToursDomain && !orgSlug) {
      console.warn('[Middleware] Resolved tours domain has no organization slug:', domainWithoutPort);
      return NextResponse.rewrite(new URL('/404', request.url));
    }

    // A resolved whitelabel tour domain gets its organization from the
    // resolver response, not from the browser path.
    if (orgSlug && (pathname === '/' || segments.length === 0)) {
      const targetUrl = new URL(`/tours/${orgSlug}${search}`, request.url);
      console.log(`[Middleware] Rewriting resolved tour root: ${pathname} -> ${targetUrl.pathname}`);
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

    // 2. Root "/" on generic default tours domain with ?org_slug= query param
    if (pathname === '/' && url.searchParams.get('org_slug')) {
      const slugFromQuery = url.searchParams.get('org_slug');
      const targetUrl = new URL(`/${slugFromQuery}${search}`, request.url);
      console.log(`[Middleware] Tours query param root redirect: ${pathname} -> ${targetUrl.pathname}`);
      return NextResponse.redirect(targetUrl);
    }

    // Root on a default tour domain is the public tour index. Render the
    // existing tours page internally so the browser URL remains "/".
    if (pathname === '/' || segments.length === 0) {
      const targetUrl = new URL(`/tours${search}`, request.url);
      console.log(`[Middleware] Rewriting tour domain root: ${pathname} -> ${targetUrl.pathname}`);
      return NextResponse.rewrite(targetUrl);
    }

    // 3. Single slug path: "/[org_slug]" (e.g. "/bcfloorplans")
    //    Rewrite to "/tours/[org_slug]" so app/tours/[org_slug]/page.tsx renders,
    //    while browser URL stays https://tours.tojuco.com/bcfloorplans
    if (!isResolvedToursDomain && segments.length === 1 && segments[0] !== 'tours' && segments[0] !== 'tour' && segments[0] !== 'whitelabel') {
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
    if (pathname === '/tour' || pathname.startsWith('/tour/')) {
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
      if (isResolvedToursDomain && orgSlug) {
        const targetUrl = new URL(`/tours/${orgSlug}${search}`, request.url);
        const response = NextResponse.rewrite(targetUrl);
        response.cookies.set('org_data', JSON.stringify(orgData), {
          path: '/',
          maxAge: 3600,
          sameSite: 'lax',
        });
        return response;
      }
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
