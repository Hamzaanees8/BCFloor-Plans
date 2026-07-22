"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { isPastBooking, hasOrderMedia } from "@/lib/bookingUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle, Loader2, XCircle } from "lucide-react";
import { Order } from "../page";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { useAppContext } from "@/app/context/AppContext";
import { GetFilesData } from "@/app/dashboard/file-manager/file-manager";

export interface CancelPreviewData {
  order_uuid: string;
  service_uuid?: string;
  can_cancel: boolean;
  is_free: boolean;
  cancellation_fee: number;
  total_paid: number;
  expected_refund: number;
  threshold_hours: number;
  fee_percentage: number;
  booking_datetime: string;
  deadline: string;
  timezone: string;
  message: string;
}

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderData: Order;
  isLoading: boolean;
  previewData: CancelPreviewData | null;
  mode?: "order" | "service";
  targetName?: string;
  onConfirm: (reason?: string) => void;
}

export default function CancelOrderDialog({
  open,
  onOpenChange,
  orderData,
  isLoading,
  previewData,
  mode = "order",
  targetName,
  onConfirm,
}: CancelOrderDialogProps) {
  const { appliedSettings } = useWhiteLabel();
  const { userType } = useAppContext();
  const role = (userType as string)?.toLowerCase() || "admin";
  const roleSettings =
    appliedSettings[role as keyof typeof appliedSettings] ||
    appliedSettings["admin"];

  const [reason, setReason] = useState("");
  const [hasMediaState, setHasMediaState] = useState<boolean>(() =>
    hasOrderMedia(orderData, previewData)
  );

  useEffect(() => {
    const syncCheck = hasOrderMedia(orderData, previewData);
    if (syncCheck) {
      setHasMediaState(true);
      return;
    }

    if (!open || !orderData?.uuid) return;

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    GetFilesData(token, orderData.uuid)
      .then((res) => {
        if (!res) return;
        const toursList = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [res];

        const containsFiles = toursList.some(
          (t: any) =>
            (Array.isArray(t?.files) && t.files.length > 0) ||
            (Array.isArray(t?.snapshots) && t.snapshots.length > 0) ||
            Boolean(t?.id || t?.uuid)
        );

        if (containsFiles) {
          setHasMediaState(true);
        }
      })
      .catch((err) => {
        console.log("Error checking media files in CancelOrderDialog:", err);
      });
  }, [open, orderData, previewData]);

  if (!previewData) return null;

  const isPast = isPastBooking(orderData, previewData.booking_datetime);
  const hasMedia = hasMediaState || hasOrderMedia(orderData, previewData);
  const isAdmin = role === "admin";

  const paymentStatusUpper = (orderData?.payment_status || "").toUpperCase().trim();
  const paidAmountNum = parseFloat(String(orderData?.paid_amount || "0"));
  const totalPaidNum = typeof previewData?.total_paid === "number" ? previewData.total_paid : 0;

  const isPaidOrPartiallyPaid =
    paymentStatusUpper === "PAID" ||
    paymentStatusUpper === "PARTIALLY_PAID" ||
    paymentStatusUpper === "PARTIAL" ||
    paymentStatusUpper === "PARTIALLY PAID" ||
    (!isNaN(paidAmountNum) && paidAmountNum > 0) ||
    totalPaidNum > 0;

  const canCancel = isPaidOrPartiallyPaid
    ? false
    : isAdmin
    ? true
    : (!isPast && previewData.can_cancel);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[460px] font-alexandria p-0 overflow-hidden rounded-[10px] border border-[#BBBBBB]"
        style={{ backgroundColor: roleSettings.pageBg, color: roleSettings.pageText }}
      >
        <DialogHeader
          className="px-6 py-4 border-b border-[#BBBBBB]"
          style={{
            backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`,
          }}
        >
          <DialogTitle
            className="text-[16px] font-[600] uppercase"
            style={{ color: roleSettings.pageTabColor }}
          >
            {canCancel ? (mode === "service" ? "Cancel Service" : "Cancel Booking") : "Cancellation Unavailable"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          {!canCancel ? (
            <div className="flex gap-3 items-start bg-red-50 border border-red-200 rounded-[8px] px-4 py-3">
              <XCircle className="text-red-500 mt-0.5 shrink-0" size={18} />
              <div className="text-[13px] text-red-700 leading-relaxed">
                {isPaidOrPartiallyPaid ? (
                  <>
                    <p className="font-[600]">Cancellation Unavailable</p>
                    <p>You cannot cancel a paid order. You can only refund the order.</p>
                  </>
                ) : isPast ? (
                  <>
                    <p className="font-[600]">Cancellation Unavailable</p>
                    <p>This booking is in the past. Agents cannot cancel past bookings. Please contact an administrator if you need to cancel this order.</p>
                  </>
                ) : (
                  <p>Cancellation is no longer available for this {mode === "service" ? "service" : "booking"}.</p>
                )}
              </div>
            </div>
          ) : (
            <>
              {isPast ? (
                <div className="space-y-3">
                  <div className="flex gap-3 items-start bg-amber-50 border border-amber-300 rounded-[8px] px-4 py-3 text-amber-900">
                    <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={18} />
                    <div className="text-[13px] leading-relaxed">
                      <p className="font-[600]">This booking is in the past. Are you sure you want to cancel it?</p>
                    </div>
                  </div>

                  {hasMedia && (
                    <div className="flex gap-3 items-start bg-red-50 border border-red-300 rounded-[8px] px-4 py-3 text-red-900">
                      <AlertTriangle className="text-red-600 mt-0.5 shrink-0" size={18} />
                      <div className="text-[13px] leading-relaxed">
                        <p className="font-[600]">🚨 Warning: Media Files Included</p>
                        <p className="text-red-800 text-[13px] mt-0.5">
                          This booking contains uploaded media files (photos/videos). If you cancel this booking, all associated media will be lost.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                previewData.is_free ? (
                  <div className="flex gap-3 items-start bg-green-50 border border-green-200 rounded-[8px] px-4 py-3">
                    <CheckCircle className="text-green-600 mt-0.5 shrink-0" size={18} />
                    <div className="text-[13px] text-green-700 leading-relaxed">
                      <p>{previewData.message}</p>
                    </div>
                  </div>
                ) : isAdmin ? (
                  <div className="flex gap-3 items-start bg-blue-50 border border-blue-200 rounded-[8px] px-4 py-3 text-blue-900">
                    <AlertTriangle className="text-blue-500 mt-0.5 shrink-0" size={18} />
                    <div className="text-[13px] text-blue-800 leading-relaxed">
                      <p>This booking is within the {previewData.threshold_hours || 24}-hour cancellation window. The applicable cancellation fee will be charged to the assigned agent.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 items-start bg-red-50 border border-red-200 rounded-[8px] px-4 py-3">
                    <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={18} />
                    <div className="text-[13px] text-red-700 leading-relaxed">
                      <p>{previewData.message}</p>
                    </div>
                  </div>
                )
              )}

              {!isAdmin && previewData.total_paid > 0 && (
                <p className="text-[14px] font-[600]" style={{ color: roleSettings.pageText }}>
                  Expected Refund: ${previewData.expected_refund.toFixed(2)}
                </p>
              )}

              <div className="space-y-2">
                <label className="text-[13px] font-[500]" style={{ color: roleSettings.pageText }}>
                  Reason for cancellation (optional)
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason here..."
                  maxLength={1000}
                  className="resize-none h-24 border-[#BBBBBB]"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg} 95%, black)`,
                    color: roleSettings.pageText,
                  }}
                />
              </div>

              <p className="text-[13px]" style={{ color: roleSettings.pageText }}>
                Are you sure you want to cancel{" "}
                {mode === "service" ? (
                  <span className="font-[600]">{targetName || "this service"}</span>
                ) : (
                  <span className="font-[600]">Order #{orderData.id}</span>
                )}
                ? This action cannot be undone.
              </p>
            </>
          )}
        </div>

        <DialogFooter
          className="px-6 py-4 border-t border-[#BBBBBB] flex flex-row gap-3 justify-end"
          style={{
            backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`,
          }}
        >
          {canCancel ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="h-[38px] px-5 text-[14px] font-[400] border-[#BBBBBB] hover:opacity-80"
                style={{
                  backgroundColor: roleSettings.pageBg,
                  color: roleSettings.pageText,
                }}
              >
                Go Back
              </Button>
              <Button
                onClick={() => onConfirm(reason)}
                disabled={isLoading}
                className="h-[38px] px-5 text-[14px] font-[400] text-white bg-red-500 hover:bg-red-600 border-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Confirm Cancellation"
                )}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-[38px] px-5 text-[14px] font-[400] border-[#BBBBBB] hover:opacity-80"
              style={{
                backgroundColor: roleSettings.pageBg,
                color: roleSettings.pageText,
              }}
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
