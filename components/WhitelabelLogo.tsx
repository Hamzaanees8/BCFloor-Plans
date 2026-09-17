'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useOrganization } from '@/app/context/OrganizationContext';

interface WhitelabelLogoProps {
  defaultSrc?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function WhitelabelLogo({
  defaultSrc = "/tojuco.png",
  alt = "logo",
  width = 180,
  height = 100,
  className = "mx-auto"
}: WhitelabelLogoProps) {
  const { organization, isOrganizationLoaded } = useOrganization();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // 1. Priority: Organization Branding from Context
    if (organization?.branding?.logo) {
      setLogoUrl(organization.branding.logo);
      return;
    }

    // 2. Fallback: CSS Variable (from SSR)
    if (typeof document !== 'undefined') {
      const wrapper = document.getElementById('global-whitelabel-root');
      if (wrapper) {
        const style = window.getComputedStyle(wrapper);
        const urlVar = style.getPropertyValue('--org-logo').trim() || style.getPropertyValue('--logo-url').trim();

        if (urlVar && urlVar !== 'none') {
          const match = urlVar.match(/url\(["']?(.*?)["']?\)/);
          if (match && match[1]) {
            setLogoUrl(match[1]);
            return;
          }
        }
      }
    }

    // If loaded and no custom logo found, use defaultSrc
    if (isOrganizationLoaded) {
      setLogoUrl(defaultSrc);
    }
  }, [organization, isOrganizationLoaded, defaultSrc]);

  // Don't render until loaded or logo is available to prevent wrong logo flash
  if (!isOrganizationLoaded && !logoUrl) {
    return <div className={`relative ${className}`} style={{ width: `${width}px`, height: `${height}px` }} />;
  }

  const finalSrc = logoUrl || organization?.branding?.logo || defaultSrc;

  return (
    <div className={`relative ${className}`} style={{ width: `${width}px`, height: `${height}px` }}>
      <Image
        src={finalSrc}
        alt={alt}
        fill
        sizes={`${width}px`}
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  );
}

