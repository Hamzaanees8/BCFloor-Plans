"use client";

import React from "react";
import { ShieldAlert, Receipt, Mail, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlockedMediaMessageProps {
  serviceName?: string;
  orderService?: any;
  onOpenInvoice?: (serviceName?: string, orderServiceUuid?: string) => void;
  bookingIndex?: number;
}

export const BlockedMediaMessage: React.FC<BlockedMediaMessageProps> = ({
  serviceName,
  orderService,
  onOpenInvoice,
  bookingIndex,
}) => {
  const displayName =
    serviceName || orderService?.service?.name || "This Service";
  const optionTitle = orderService?.option?.title;
  const bookingNumber =
    bookingIndex !== undefined ? `Booking #${bookingIndex + 1}` : null;

  return (
    <div className="w-full flex items-center justify-center px-4 py-12 md:py-16">
      <div className="w-full max-w-2xl bg-white border border-rose-200 rounded-xl shadow-sm overflow-hidden font-alexandria">
        {/* Top Header Banner */}
        <div className="bg-rose-50 border-b border-rose-100 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-rose-900 leading-tight">
              Media Access Revoked
            </h3>
            <p className="text-xs text-rose-700 mt-0.5">
              Access restricted following service refund
            </p>
          </div>
          <span className="ml-auto px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-200/80 text-rose-800 uppercase tracking-wide">
            Refunded
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Main Professional Notice */}
          <div className="space-y-2">
            <p className="text-[15px] leading-relaxed text-gray-700 font-medium">
              Access to the media files and package upgrades for{" "}
              <span className="text-gray-900 font-bold">{displayName}</span> has
              been restricted by administration following a refund of this service.
            </p>
            <p className="text-sm leading-relaxed text-gray-500">
              Photos, videos, floor plans, and additional media assets for this
              specific booking are unavailable. Upgrades and file selections have
              been disabled.
            </p>
          </div>

          {/* Service Details Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="text-gray-500 font-medium">Service Name</div>
              <div className="text-gray-900 font-bold text-sm">
                {displayName}
                {bookingNumber && (
                  <span className="ml-2 font-normal text-xs text-gray-500">
                    ({bookingNumber})
                  </span>
                )}
              </div>
              {optionTitle && (
                <div className="text-gray-600">Option: {optionTitle}</div>
              )}
            </div>

            {orderService?.updated_at && (
              <div className="sm:text-right space-y-1">
                <div className="text-gray-500 font-medium">Status Date</div>
                <div className="text-gray-700 font-semibold">
                  {new Date(orderService.updated_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Helpful Information Box */}
          <div className="flex items-start gap-3 bg-amber-50/70 border border-amber-200/70 rounded-lg p-3.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-normal">
              If you believe this restriction is in error or require media access
              restored, please contact our support team or check your order invoice.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {onOpenInvoice && (
              <Button
                onClick={() =>
                  onOpenInvoice(
                    displayName,
                    orderService?.uuid || orderService?.service?.uuid,
                  )
                }
                variant="outline"
                className="h-10 px-4 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Receipt className="w-4 h-4 text-gray-500" />
                View Invoice Details
              </Button>
            )}

            <Button
              asChild
              className="h-10 px-4 text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-2"
            >
              <a href="mailto:support@bcfloorplans.net">
                <Mail className="w-4 h-4" />
                Contact Support
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockedMediaMessage;
