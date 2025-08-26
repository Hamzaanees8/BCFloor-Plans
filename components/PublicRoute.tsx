'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      router.replace("/dashboard"); // or your landing route
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) return null;

  return <>{children}</>;
}