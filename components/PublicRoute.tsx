'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Define routes that should be accessible to everyone (logged in or not)
    const publicAccessRoutes = ['/agent', '/tour'];
    const isPublicAccessRoute = publicAccessRoutes.some(route => pathname?.startsWith(route));

    if (token && !isPublicAccessRoute) {
      // Only redirect logged-in users if they're on auth pages (login, signup, etc.)
      router.replace("/dashboard");
    } else {
      setChecking(false);
    }
  }, [router, pathname]);

  if (checking) return null;

  return <>{children}</>;
}