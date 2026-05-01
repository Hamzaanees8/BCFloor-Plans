import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Define the base domain (can be an environment variable in the future)
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'bcfloorplans.com';
  
  // Extract subdomain
  let subdomain = '';
  if (hostname.endsWith(`.${baseDomain}`)) {
    subdomain = hostname.replace(`.${baseDomain}`, '');
  } else if (hostname.endsWith('.localhost:3000')) {
    subdomain = hostname.replace('.localhost:3000', '');
  }

  // If there's a subdomain, handle rewrites
  if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
    
    // 1. Specific Subdomain Mappings
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
    
    if (subdomain === 'vendore-new') {
      if (url.pathname.startsWith('/vendor') || url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/agent')) {
        return NextResponse.next();
      }
      return NextResponse.rewrite(new URL(`/vendor${url.pathname}${url.search}`, request.url));
    }

    // 2. System Subdomains (Keep these rewrites)
    if (['teams-new', 'booking-new', 'vendore-new'].includes(subdomain)) {
      const prefix = subdomain.replace('-new', '');
      const path = url.pathname.startsWith(`/${prefix}`) 
        ? url.pathname 
        : `/${prefix}${url.pathname}`;
      
      return NextResponse.rewrite(new URL(`${path}${url.search}`, request.url));
    }

    // 3. Whitelabel Subdomains (No rewrite needed anymore!)
    // The root layout handles branding based on the host header.
    return NextResponse.next();
  }

  return NextResponse.next();
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
