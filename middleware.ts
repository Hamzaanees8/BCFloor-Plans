import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SYSTEM_DOMAINS = [
  'teams-new.bcfloorplans.com',
  'booking-new.bcfloorplans.com',
  'vendor-new.bcfloorplans.com',
  'bcfloorplans.com',
  'tujoco.com',
  'localhost:3000',
  'localhost'
];

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. System Domains (Exact Match)
  if (SYSTEM_DOMAINS.includes(hostname)) {
    let subdomain = '';
    if (hostname.startsWith('teams-new.')) subdomain = 'teams-new';
    else if (hostname.startsWith('booking-new.')) subdomain = 'booking-new';
    else if (hostname.startsWith('vendor-new.')) subdomain = 'vendor-new';

    if (subdomain === 'teams-new') {
      const authRoutes = ['/login', '/login-user', '/forget-password', '/login-first-time', '/new-password'];
      if (authRoutes.includes(url.pathname) || url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/agent') || url.pathname.startsWith('/vendor')) {
        return NextResponse.next();
      }
      return NextResponse.rewrite(new URL(`/dashboard${url.pathname}${url.search}`, request.url));
    }

    if (subdomain === 'booking-new') {
      if (url.pathname.startsWith('/agent') || url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/vendor')) {
        return NextResponse.next();
      }
      return NextResponse.rewrite(new URL(`/agent${url.pathname}${url.search}`, request.url));
    }

    if (subdomain === 'vendor-new') {
      if (url.pathname.startsWith('/vendor') || url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/agent')) {
        return NextResponse.next();
      }
      return NextResponse.rewrite(new URL(`/vendor${url.pathname}${url.search}`, request.url));
    }

    // For base domains (bcfloorplans.com, tujoco.com, localhost), pass through
    return NextResponse.next();
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

      if (url.pathname.startsWith('/agent') || url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/vendor')) {
        return NextResponse.next();
      }

      if (portalType === 'admin') {
        return NextResponse.rewrite(new URL(`/dashboard${url.pathname}${url.search}`, request.url));
      } else if (portalType === 'vendor') {
        return NextResponse.rewrite(new URL(`/vendor${url.pathname}${url.search}`, request.url));
      }
    }
  } catch (error) {
    console.error('Domain resolution failed in middleware:', error);
  }

  // Fallback (or if portalType is 'agent'): default to agent portal for whitelabel
  if (url.pathname.startsWith('/agent') || url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/vendor')) {
    return NextResponse.next();
  }
  return NextResponse.rewrite(new URL(`/agent${url.pathname}${url.search}`, request.url));
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
