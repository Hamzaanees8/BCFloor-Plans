'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface OrgInfo {
  id: number;
  org_id?: number;
  uuid: string;
  name: string;
  slug: string;
  from_name?: string | null;
  from_email?: string | null;
  branding?: {
    primary_color?: string;
    secondary_color?: string;
    logo?: string | null;
    white_label_styles?: any;
  };
}

export default function OrgAgentPasswordSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';

  const [orgData, setOrgData] = useState<OrgInfo | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!slug) return;

    let isCancelled = false;

    const fetchOrg = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://api-stage.bcfloorplans.com').replace(/\/api\/?$/, '');
        const res = await fetch(`${baseUrl}/api/public/organizations/${encodeURIComponent(slug)}`, { cache: 'no-store' });

        if (isCancelled) return;

        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setOrgData(json.data);
          }
        }
      } catch (err) {
        console.error('Failed to load organization for password-success:', err);
      }
    };

    fetchOrg();

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  // 3-second countdown and redirect to /{slug}/login
  useEffect(() => {
    if (countdown <= 0) {
      router.push(`/${slug}/login`);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, router, slug]);

  const primaryColor =
    orgData?.branding?.white_label_styles?.agent?.pageTabColor ||
    orgData?.branding?.primary_color ||
    '#6BAE41';

  const orgDisplayName = orgData?.name || orgData?.from_name || slug.toUpperCase();
  const logoUrl = orgData?.branding?.logo || '/tojuco.png';

  return (
    <div className="w-full flex justify-center items-start pt-[80px] pb-[80px] px-[20px] md:px-0">
      <div className="w-full max-w-[420px] flex flex-col items-center text-center gap-[24px]">
        {/* Organization Logo */}
        <div className="relative w-[180px] h-[90px]">
          <Image
            src={logoUrl}
            alt={orgDisplayName}
            fill
            sizes="180px"
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>

        {/* Success Icon */}
        <div className="w-[72px] h-[72px] relative">
          <Image
            src="/ico-success.png"
            alt="Success"
            width={72}
            height={72}
            className="mx-auto"
            priority
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-[24px] font-[700] text-[#222222]">
            Password Reset Successful!
          </h1>
          <p className="text-[14px] text-[#666666]">
            Your password for <span className="font-[600]" style={{ color: primaryColor }}>{orgDisplayName}</span> has been updated.
          </p>
          <p className="text-[13px] text-[#888888] mt-1">
            Redirecting to login in <span className="font-[700]" style={{ color: primaryColor }}>{countdown}</span> {countdown === 1 ? 'second' : 'seconds'}...
          </p>
        </div>

        <Button
          onClick={() => router.push(`/${slug}/login`)}
          style={{ backgroundColor: primaryColor }}
          className="w-full max-w-[320px] flex justify-center items-center hover:opacity-90 rounded-[6px] h-[44px] font-[600] text-[16px] text-white"
        >
          Proceed to Login Now
        </Button>

        <p className="text-[10px] text-[#666666] font-[400] mx-auto mt-4">
          Powered by Tojuco Software {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
