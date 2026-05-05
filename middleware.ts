import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SYSTEM_DOMAINS = [
  'teams-new.bcfloorplans.com',
  'booking-new.bcfloorplans.com',
  'vendor-new.bcfloorplans.com',
  'main.d1wkf3elpe9tnb.amplifyapp.com',
  'bcfloorplans.com',
  'tujoco.com',
  'localhost:3000',
  'localhost'
];

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = (request.headers.get('host') || '').split(':')[0]; // Ignore port
  const pathname = url.pathname;

  const isSystem = SYSTEM_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`)) || 
                   hostname.includes('amplifyapp.com') || 
                   hostname.includes('localhost');

  const authRoutes = ['/login', '/login-user', '/forget-password', '/login-first-time', '/new-password', '/logout'];
  const portalRoutes = ['/dashboard', '/agent', '/vendor', '/whitelabel', '/tour'];

  // 1. System Domains & Fallback for unknown domains
  if (isSystem) {
    let portal = 'dashboard'; // Default to admin
    if (hostname.includes('booking-new')) portal = 'agent';
    else if (hostname.includes('vendor-new')) portal = 'vendor';
    
    if (authRoutes.includes(pathname) || portalRoutes.some(p => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    // Default route for this portal
    return NextResponse.rewrite(new URL(`/${portal}${pathname}${url.search}`, request.url));
  }

  // 2. Whitelabel Domains (Custom Domains)
  try {
    // Clean API URL - user provides it with /api suffix, but we add /api/v1
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-stage.bcfloorplans.com';
    const baseApiUrl = rawApiUrl.replace(/\/api$/, ''); 
    
    const res = await fetch(`${baseApiUrl}/api/domains/resolve?domain=${hostname}`, {
      next: { revalidate: 3600 }
    });

    if (res.ok) {
      const data = await res.json();
      const portalType = data.portal_type; // 'admin', 'agent', or 'vendor'
      const portal = portalType === 'vendor' ? 'vendor' : (portalType === 'agent' ? 'agent' : 'dashboard');

      if (authRoutes.includes(pathname) || portalRoutes.some(p => pathname.startsWith(p))) {
        return NextResponse.next();
      }

      return NextResponse.rewrite(new URL(`/${portal}${pathname}${url.search}`, request.url));
    }
  } catch (error) {
    console.error('Domain resolution failed in middleware:', error);
  }

  // Final Fallback: default to admin portal (dashboard)
  if (authRoutes.includes(pathname) || portalRoutes.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  return NextResponse.rewrite(new URL(`/dashboard${pathname}${url.search}`, request.url));
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
