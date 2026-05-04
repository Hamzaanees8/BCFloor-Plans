import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SYSTEM_DOMAINS = [
  'teams-new.bcfloorplans.com',
  'booking-new.bcfloorplans.com',
  'agents-new.bcfloorplans.com',
  'vendor-new.bcfloorplans.com',
  'vendore-new.bcfloorplans.com',
  'vendors-new.bcfloorplans.com',
  'teams-new.localhost:3000',
  'booking-new.localhost:3000',
  'agents-new.localhost:3000',
  'vendor-new.localhost:3000',
  'vendore-new.localhost:3000',
  'vendors-new.localhost:3000',
  'teams-new.localhost',
  'booking-new.localhost',
  'agents-new.localhost',
  'vendor-new.localhost',
  'vendore-new.localhost',
  'vendors-new.localhost',
  'main.d1wkf3elpe9tnb.amplifyapp.com',
  'bcfloorplans.com',
  'tujoco.com',
  'localhost:3000',
  'localhost'
];

const AUTH_ROUTES = ['/login', '/login-user', '/forget-password', '/login-first-time', '/new-password'];

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. System Domains (Exact Match)
  if (SYSTEM_DOMAINS.includes(hostname)) {
    let subdomain = '';
    if (hostname.startsWith('teams-new.')) subdomain = 'teams-new';
    else if (hostname.startsWith('booking-new.') || hostname.startsWith('agents-new.')) subdomain = 'booking-new';
    else if (hostname.startsWith('vendor-new.') || hostname.startsWith('vendore-new.') || hostname.startsWith('vendors-new.')) subdomain = 'vendor-new';
    else if (hostname === 'main.d1wkf3elpe9tnb.amplifyapp.com') subdomain = 'teams-new'; 

    if (subdomain === 'teams-new') {
      if (AUTH_ROUTES.includes(url.pathname) || url.pathname.startsWith('/dashboard')) {
        return NextResponse.next();
      }
      // Block other portals on teams-new
      if (url.pathname.startsWith('/agent') || url.pathname.startsWith('/vendor')) {
        return NextResponse.rewrite(new URL('/404', request.url));
      }
      return NextResponse.rewrite(new URL(`/dashboard${url.pathname}${url.search}`, request.url));
    }

    if (subdomain === 'booking-new') {
      if (url.pathname.startsWith('/agent')) {
        return NextResponse.next();
      }
      // Block other portals on booking-new
      if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/vendor')) {
        return NextResponse.rewrite(new URL('/404', request.url));
      }
      return NextResponse.rewrite(new URL(`/agent${url.pathname}${url.search}`, request.url));
    }

    if (subdomain === 'vendor-new') {
      if (url.pathname.startsWith('/vendor')) {
        return NextResponse.next();
      }
      // Block other portals on vendor-new
      if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/agent')) {
        return NextResponse.rewrite(new URL('/404', request.url));
      }
      return NextResponse.rewrite(new URL(`/vendor${url.pathname}${url.search}`, request.url));
    }

    // For base domains (bcfloorplans.com, tujoco.com, localhost), default to dashboard
    if (AUTH_ROUTES.includes(url.pathname) || url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/agent') || url.pathname.startsWith('/vendor')) {
      return NextResponse.next();
    }
    return NextResponse.rewrite(new URL(`/dashboard${url.pathname}${url.search}`, request.url));
  }

  // 2. Whitelabel Domains (Custom Domains & Test Subdomains)
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-stage.bcfloorplans.com';
    const res = await fetch(`${apiUrl}/api/v1/domains/resolve?domain=${hostname}`, {
      next: { revalidate: 3600 }
    });

    if (res.ok) {
      const data = await res.json();
      const portalType = data.portal_type; // 'admin', 'agent', or 'vendor'

      if (portalType === 'admin') {
        if (AUTH_ROUTES.includes(url.pathname) || url.pathname.startsWith('/dashboard')) {
          return NextResponse.next();
        }
        if (url.pathname.startsWith('/agent') || url.pathname.startsWith('/vendor')) {
          return NextResponse.rewrite(new URL('/404', request.url));
        }
        return NextResponse.rewrite(new URL(`/dashboard${url.pathname}${url.search}`, request.url));
      } else if (portalType === 'vendor') {
        if (url.pathname.startsWith('/vendor')) return NextResponse.next();
        if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/agent')) {
          return NextResponse.rewrite(new URL('/404', request.url));
        }
        return NextResponse.rewrite(new URL(`/vendor${url.pathname}${url.search}`, request.url));
      } else if (portalType === 'agent') {
        if (url.pathname.startsWith('/agent')) return NextResponse.next();
        if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/vendor')) {
          return NextResponse.rewrite(new URL('/404', request.url));
        }
        return NextResponse.rewrite(new URL(`/agent${url.pathname}${url.search}`, request.url));
      }
    }
  } catch (error) {
    console.error('Domain resolution failed in middleware:', error);
  }

  // Fallback: default to admin portal (dashboard)
  if (AUTH_ROUTES.includes(url.pathname) || url.pathname.startsWith('/agent') || url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/vendor')) {
    return NextResponse.next();
  }
  return NextResponse.rewrite(new URL(`/dashboard${url.pathname}${url.search}`, request.url));
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
