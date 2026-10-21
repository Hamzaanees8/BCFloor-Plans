'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';


const RESERVED_SLUGS = new Set([
  'login',
  'login-user',
  'signup',
  'forget-password',
  'login-first-time',
  'new-password',
  'password-success',
  'set-password',
  'about',
  'book-now',
  'tours',
  'tour',
  'dashboard',
  'vendor',
  'admin',
  'api',
]);

export default function OrgAgentRootPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';

  const [isLoading, setIsLoading] = useState(true);
  const [orgNotFound, setOrgNotFound] = useState(false);

  useEffect(() => {
    if (!slug || RESERVED_SLUGS.has(slug.toLowerCase())) {
      setIsLoading(false);
      setOrgNotFound(true);
      return;
    }

    // 1. Check if an agent is already logged in
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const userType = typeof window !== 'undefined' ? localStorage.getItem('userType') : null;
      const userInfoStr = typeof window !== 'undefined' ? localStorage.getItem('userInfo') : null;

      if (token && userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        const orgMatch = userInfo?.organization?.slug?.toLowerCase() === slug.toLowerCase() ||
                         userInfo?.organization_slug?.toLowerCase() === slug.toLowerCase();

        // If user is logged in as an agent belonging to this organization, go straight to dashboard
        if (orgMatch && (userType === 'agent' || userType === 'agent_admin' || !userType)) {
          router.replace('/dashboard/calendar');
          return;
        }
      }
    } catch (err) {
      console.error('Error checking active session:', err);
    }

    // 2. Fetch organization to verify it exists and redirect to login
    let isCancelled = false;

    const checkOrgAndRedirect = async () => {
      try {
        setIsLoading(true);
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://api-stage.bcfloorplans.com').replace(/\/api\/?$/, '');
        const res = await fetch(`${baseUrl}/api/public/organizations/${encodeURIComponent(slug)}`, { cache: 'no-store' });

        if (isCancelled) return;

        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            // Organization is valid; redirect unauthenticated user to the branded login page
            router.replace(`/${slug}/login`);
            return;
          }
        }
        setOrgNotFound(true);
      } catch (err) {
        console.error('Failed to verify organization:', err);
        if (!isCancelled) {
          setOrgNotFound(true);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    checkOrgAndRedirect();

    return () => {
      isCancelled = true;
    };
  }, [slug, router]);

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col justify-center items-center gap-3">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-[#6BAE41] rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Connecting to organization portal...</p>
      </div>
    );
  }

  if (orgNotFound) {
    return (
      <div className="w-full flex justify-center items-start pt-[100px] px-4">
        <div className="w-full max-w-[420px] bg-white rounded-lg shadow-sm border p-6 flex flex-col items-center text-center gap-4">
          <div className="relative w-[160px] h-[80px]">
            <Image
              src="/tojuco.png"
              alt="logo"
              fill
              sizes="160px"
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Organization Not Found</h2>
          <p className="text-sm text-gray-600">
            We could not find an active organization with the slug &quot;{slug}&quot;. Please verify the URL.
          </p>
          <Link
            href="/login"
            className="mt-2 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#6BAE41] rounded-md hover:opacity-90 transition-opacity"
          >
            Go to Platform Login
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
