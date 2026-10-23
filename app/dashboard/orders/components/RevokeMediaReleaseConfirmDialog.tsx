"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Lock, ShieldAlert } from "lucide-react";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { useAppContext } from "@/app/context/AppContext";

interface RevokeMediaReleaseConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderData: any;
  isLoading: boolean;
  onConfirm: () => void;
}

export default function RevokeMediaReleaseConfirmDialog({
  open,
  onOpenChange,
  orderData,
  isLoading,
  onConfirm,
}: RevokeMediaReleaseConfirmDialogProps) {
  const { appliedSettings } = useWhiteLabel();
  const { userType } = useAppContext();
  const role = (userType as string)?.toLowerCase() || "admin";
  const roleSettings =
    appliedSettings[role as keyof typeof appliedSettings] ||
    appliedSettings["admin"];

  const services = Array.isArray(orderData?.services) ? orderData.services : [];
  const unpaidServices = services.filter((s: any) => {
    const status = (s?.payment_status || "UNPAID").toUpperCase().trim();
    return status !== "PAID";
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[460px] w-[92vw] font-alexandria p-0 overflow-hidden rounded-[12px] border border-[#BBBBBB] shadow-xl"
        style={{
          backgroundColor: roleSettings.pageBg || "#FFFFFF",
          color: roleSettings.pageText || "#1F2937",
        }}
      >
        {/* Compact Dialog Header */}
        <DialogHeader
          className="px-5 py-3 border-b border-[#BBBBBB]"
          style={{
            backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`,
          }}
        >
          <DialogTitle
            className="text-[15px] md:text-[16px] font-[700] uppercase flex items-center gap-2 tracking-wide"
            style={{ color: roleSettings.pageTabColor }}
          >
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Revoke Media Release</span>
          </DialogTitle>
        </DialogHeader>

        {/* Dialog Body */}
        <div className="px-5 py-3.5 space-y-2.5 text-[12.5px] text-gray-700">
          {/* Order Summary Line */}
          {orderData && (
            <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 flex items-center justify-between text-[12px]">
              <span className="font-semibold text-gray-900">
                Order #{orderData.id}
              </span>
              {orderData.property_address || orderData.property?.address ? (
                <span className="text-gray-600 truncate max-w-[240px] text-[11.5px]">
                  {orderData.property_address || orderData.property?.address}
                </span>
              ) : null}
            </div>
          )}

          {/* Warning Callout Box */}
          <div className="bg-amber-50 border border-amber-300 rounded-[8px] p-3 text-amber-950 space-y-2">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
              <div className="space-y-1 text-[12px] leading-snug">
                <p className="font-semibold text-amber-950">
                  Watermarks will be reapplied
                </p>
                <p className="text-amber-900">
                  Revoking pre-payment release will re-lock media access for all unpaid services ({unpaidServices.length || "all"}). Background tasks will reprocess photos to reapply watermarks to previews.
                </p>
              </div>
            </div>

            <div className="bg-amber-100/70 p-2 rounded text-[11.5px] text-amber-900 flex items-center gap-1.5 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                Agents will be required to pay invoices before accessing watermark-free downloads.
              </span>
            </div>
          </div>
        </div>

        {/* Dialog Footer */}
        <DialogFooter className="px-5 py-2.5 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-[34px] px-4 text-[12.5px] font-medium border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className="h-[34px] px-4 text-[12.5px] font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5 rounded-[6px]"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Confirm & Revoke
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
