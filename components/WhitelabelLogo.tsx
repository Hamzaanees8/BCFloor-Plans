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
  defaultSrc = "/bcfloor.png", 
  alt = "logo", 
  width = 180, 
  height = 100,
  className = "mx-auto" 
}: WhitelabelLogoProps) {
  const { organization, isOrganizationLoaded } = useOrganization();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isResolved, setIsResolved] = useState(false);

  useEffect(() => {
    let foundLogo = null;
    // 1. Priority: Organization Branding from Context
    if (organization?.branding?.logo) {
      foundLogo = organization.branding.logo;
    } else {
      // 2. Fallback: CSS Variable (from SSR or previous system)
      const wrapper = document.getElementById('global-whitelabel-root');
      if (wrapper) {
        const style = window.getComputedStyle(wrapper);
        const urlVar = style.getPropertyValue('--org-logo').trim() || style.getPropertyValue('--logo-url').trim();
        
        if (urlVar && urlVar !== 'none') {
          const match = urlVar.match(/url\(["']?(.*?)["']?\)/);
          if (match && match[1]) {
            foundLogo = match[1];
          }
        }
      }
    }

    if (foundLogo) {
      setLogoUrl(foundLogo);
    }
    
    // We consider it resolved if organization is loaded, OR if we found a logo via fallback immediately
    if (isOrganizationLoaded || foundLogo) {
      setIsResolved(true);
    }
  }, [organization, isOrganizationLoaded]);

  if (!isResolved) {
    return <div className={`relative ${className}`} style={{ width: `${width}px`, height: `${height}px` }} />;
  }

  return (
    <div className={`relative ${className}`} style={{ width: `${width}px`, height: `${height}px` }}>
      <Image
        src={logoUrl || defaultSrc}
        alt={alt}
        fill
        sizes={`${width}px`}
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  );
}

