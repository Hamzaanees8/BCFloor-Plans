import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function EnvironmentBanner() {
  return (
    <aside
      role="status"
      aria-label="Environment Notice"
      className="sticky top-0 z-[99999] w-full min-h-[36px] bg-[#d32f2f] text-white px-3 py-1 flex items-center justify-center shadow-md font-sans select-none"
    >
      <div className="flex items-center justify-center flex-wrap gap-2 text-center">
        {/* Warning Icon Badge */}
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-900/50 text-white shrink-0">
          <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
        </div>

        {/* Environment Badge */}
        <span className="bg-black/25 border border-white/25 text-white text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
          DEV / STAGING
        </span>

        {/* Separator */}
        <span className="text-white/70 font-semibold shrink-0">|</span>

        {/* Informative Message */}
        <span className="text-white text-xs sm:text-[13px] font-medium tracking-normal">
          <span className="font-bold">STRIPE SANDBOX MODE:</span> Testing environment only. Invoices &amp; Data submitted here do not incur real liabilities.
        </span>
      </div>
    </aside>
  );
}
