'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Try to find the whitelabel wrapper and get the logo URL from CSS variables
    const wrapper = document.getElementById('whitelabel-wrapper');
    if (wrapper) {
      const style = window.getComputedStyle(wrapper);
      const urlVar = style.getPropertyValue('--logo-url').trim();
      
      if (urlVar && urlVar !== 'none') {
        // Extract URL from url("...")
        const match = urlVar.match(/url\(["']?(.*?)["']?\)/);
        if (match && match[1]) {
          setLogoUrl(match[1]);
        }
      }
    }
  }, []);

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
