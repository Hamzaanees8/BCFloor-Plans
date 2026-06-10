'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const authRoutes = [
      '/login',
      '/login-user',
      '/forget-password',
      '/login-first-time',
      '/new-password',
      '/password-success',
    ];
    
    // Check if the pathname is one of the auth routes (with or without /agent or /vendor prefix)
    const isAuthRoute = authRoutes.some(route => 
      pathname === route || pathname?.startsWith(`${route}/`) ||
      pathname === `/agent${route}` || pathname?.startsWith(`/agent${route}/`) ||
      pathname === `/vendor${route}` || pathname?.startsWith(`/vendor${route}/`)
    ) || pathname === '/' || pathname === '/agent' || pathname === '/vendor';

    if (token && isAuthRoute) {
      // Only redirect logged-in users if they're on auth pages (login, signup, etc.)
      router.replace("/dashboard");
    } else {
      setChecking(false);
    }
  }, [router, pathname]);

  if (checking) return null;

  return <>{children}</>;
}