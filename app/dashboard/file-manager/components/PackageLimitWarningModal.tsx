'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { AlertTriangle, Info, X, Sparkles } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';

export interface PackageLimitWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'over_limit' | 'under_limit';
  selectedCount: number;
  packageLimit: number;
  mediaLabel?: string; // e.g. "photos", "videos", "floor plans"
  onConfirmProceed: () => void;
  onUpgradePackage?: () => void;
}

export default function PackageLimitWarningModal({
  open,
  onOpenChange,
  type,
  selectedCount,
  packageLimit,
  mediaLabel = 'photos',
  onConfirmProceed,
  onUpgradePackage,
}: PackageLimitWarningModalProps) {
  const { userType } = useAppContext();
  const remaining = Math.max(0, packageLimit - selectedCount);
  const excess = Math.max(0, selectedCount - packageLimit);

  const capitalizedMedia = mediaLabel.charAt(0).toUpperCase() + mediaLabel.slice(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] max-w-[540px] rounded-[16px] p-0 font-alexandria shadow-2xl border border-gray-200 bg-white overflow-hidden [&>button]:hidden">
        {/* Header Banner */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50/60 to-orange-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
              {type === 'over_limit' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : (
                <Info className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <DialogTitle className="text-[18px] font-bold text-gray-900 leading-tight">
                {type === 'over_limit' ? 'Package Limit Exceeded' : 'Package Selection Warning'}
              </DialogTitle>
              <p className="text-[12px] text-amber-700 font-medium mt-0.5">
                {selectedCount} selected / {packageLimit} allowed in package
              </p>
            </div>
          </div>
          <DialogClose className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </DialogClose>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-[14px] text-gray-600 leading-relaxed">
            {type === 'over_limit' ? (
              <>
                More {mediaLabel} have been selected than your package allows. Please confirm you would like to upgrade your package or remove some {mediaLabel}.
              </>
            ) : (
              <>
                You have <span className="font-bold text-gray-900">{remaining}</span> number of {mediaLabel} remaining in your package, please confirm this is correct, or return to the page to select more {mediaLabel}.
              </>
            )}
          </p>

          {/* Stat Badges Card */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-gray-50/80 rounded-[12px] border border-gray-100 text-center">
            <div className="flex flex-col">
              <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Selected</span>
              <span className="text-[18px] font-bold text-amber-600">{selectedCount}</span>
            </div>
            <div className="flex flex-col border-x border-gray-200">
              <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Allowed</span>
              <span className="text-[18px] font-bold text-gray-700">{packageLimit}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                {type === 'over_limit' ? 'Excess' : 'Remaining'}
              </span>
              <span className={`text-[18px] font-bold ${type === 'over_limit' ? 'text-red-600' : 'text-green-600'}`}>
                {type === 'over_limit' ? `+${excess}` : remaining}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-[42px] px-5 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 rounded-[8px] hover:bg-gray-100 hover:text-gray-900 transition-colors shadow-sm cursor-pointer"
          >
            {type === 'over_limit' ? `Remove ${capitalizedMedia}` : 'Return to Page'}
          </button>

          {type === 'over_limit' && onUpgradePackage && userType !== 'vendor' && (
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onUpgradePackage();
              }}
              className={`w-full sm:w-auto h-[42px] px-6 text-[13px] font-semibold text-white ${userType}-bg rounded-[8px] hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-1.5 cursor-pointer`}
            >
              <Sparkles className="w-4 h-4" />
              Upgrade Package
            </button>
          )}

          {type === 'under_limit' && (
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onConfirmProceed();
              }}
              className={`w-full sm:w-auto h-[42px] px-5 text-[13px] font-semibold text-white ${userType}-bg rounded-[8px] hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center cursor-pointer`}
            >
              Confirm & Proceed
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
