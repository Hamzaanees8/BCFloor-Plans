'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function EnvironmentBanner() {
  const bannerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (bannerRef.current) {
        const height = bannerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--env-banner-height', `${height}px`);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    if (bannerRef.current) {
      resizeObserver.observe(bannerRef.current);
    }
    window.addEventListener('resize', updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
      document.documentElement.style.setProperty('--env-banner-height', '0px');
    };
  }, []);

  return (
    <aside
      ref={bannerRef}
      role="status"
      aria-label="Environment Notice"
      className="fixed top-0 left-0 right-0 z-[99999] w-full min-h-[36px] bg-[#d32f2f] text-white px-3 py-1 flex items-center justify-center shadow-md font-sans select-none"
    >
      <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 text-center text-xs sm:text-[13px]">
        {/* Warning Icon Badge */}
        <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-900/50 text-white shrink-0">
          <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
        </div>

        {/* Environment Badge */}
        <span className="bg-black/25 border border-white/25 text-white text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
          DEV / STAGING
        </span>

        {/* Separator */}
        <span className="text-white/70 font-semibold shrink-0">|</span>

        {/* Informative Message */}
        <span className="text-white font-medium tracking-normal">
          <span className="font-bold">STRIPE SANDBOX MODE:</span>{" "}
          <span className="hidden sm:inline">Testing environment only. Invoices &amp; Data submitted here do not incur real liabilities.</span>
          <span className="sm:hidden">Testing mode. Invoices do not incur liabilities.</span>
        </span>
      </div>
    </aside>
  );
}

