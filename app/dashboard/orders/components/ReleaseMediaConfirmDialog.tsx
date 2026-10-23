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
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Sparkles,
  Unlock,
} from "lucide-react";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { useAppContext } from "@/app/context/AppContext";

interface ReleaseMediaConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderData: any;
  isLoading: boolean;
  onConfirm: () => void;
}

export default function ReleaseMediaConfirmDialog({
  open,
  onOpenChange,
  orderData,
  isLoading,
  onConfirm,
}: ReleaseMediaConfirmDialogProps) {
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
  const paidServices = services.filter((s: any) => {
    const status = (s?.payment_status || "UNPAID").toUpperCase().trim();
    return status === "PAID";
  });

  const orderPaymentStatus = (orderData?.payment_status || "UNPAID").toUpperCase().trim();
  const isOrderFullyUnpaid = orderPaymentStatus === "UNPAID";
  const isOrderPartiallyPaid =
    orderPaymentStatus === "PARTIALLY_PAID" || orderPaymentStatus === "PARTIAL";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[500px] w-[94vw] font-alexandria p-0 overflow-hidden rounded-[12px] border border-[#BBBBBB] shadow-xl"
        style={{
          backgroundColor: roleSettings.pageBg || "#FFFFFF",
          color: roleSettings.pageText || "#1F2937",
        }}
      >
        {/* Dialog Header */}
        <DialogHeader
          className="px-5 py-3 border-b border-[#BBBBBB]"
          style={{
            backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`,
          }}
        >
          <DialogTitle
            className="text-[15px] md:text-[17px] font-[700] uppercase flex items-center gap-2 tracking-wide"
            style={{ color: roleSettings.pageTabColor }}
          >
            <Unlock className="w-4 h-4 text-red-500 shrink-0" />
            <span>Release Media Before Payment</span>
          </DialogTitle>
        </DialogHeader>

        {/* Dialog Body - Compact text sizing to fit without scroll */}
        <div className="px-5 py-3 space-y-2.5">
          {/* Order Summary Card */}
          {orderData && (
            <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-[12.5px] text-gray-700 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-900">Order:</span>
                  <span className="bg-gray-200 px-2 py-0.5 rounded text-[11px] font-mono font-bold text-gray-800">
                    #{orderData.id}
                  </span>
                </div>
                <div>
                  {isOrderFullyUnpaid ? (
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase bg-rose-100 text-rose-700 border border-rose-300">
                      Order Unpaid
                    </span>
                  ) : isOrderPartiallyPaid ? (
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                      Partially Paid
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-300">
                      {orderPaymentStatus}
                    </span>
                  )}
                </div>
              </div>

              {orderData.property_address || orderData.property?.address ? (
                <div className="flex items-start gap-1.5 text-[12px]">
                  <span className="font-semibold text-gray-900 shrink-0">Address:</span>
                  <span className="text-gray-700 truncate">
                    {orderData.property_address || orderData.property?.address}
                  </span>
                </div>
              ) : null}

              {orderData.agent && (
                <div className="flex items-center gap-1.5 text-[12px]">
                  <span className="font-semibold text-gray-900 shrink-0">Agent:</span>
                  <span className="text-gray-700 truncate">
                    {orderData.agent.first_name} {orderData.agent.last_name}
                    {orderData.agent.company_name ? ` (${orderData.agent.company_name})` : ""}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Unpaid Services List Section */}
          {unpaidServices.length > 0 ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-semibold text-rose-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Unpaid Services To Be Released ({unpaidServices.length})</span>
                </p>
                <span className="text-[11px] text-gray-500">Will be accessible to agent</span>
              </div>

              <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-2 divide-y divide-rose-100 max-h-[100px] overflow-y-auto custom-scroll">
                {unpaidServices.map((srv: any, idx: number) => {
                  const srvName =
                    srv.service?.name ||
                    srv.optionName ||
                    srv.custom ||
                    `Service #${srv.service_id || idx + 1}`;
                  const srvAmount = srv.amount ? `$${srv.amount}` : "";
                  const srvStatus = (srv.payment_status || "UNPAID").toUpperCase().trim();

                  return (
                    <div
                      key={srv.uuid || srv.id || idx}
                      className="flex items-center justify-between py-1 first:pt-0 last:pb-0 text-[12px]"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-semibold text-gray-900 truncate">
                          {srvName}
                        </span>
                        {srv.option?.title && (
                          <span className="text-[10.5px] text-gray-500 truncate">
                            {srv.option.title}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {srvAmount && (
                          <span className="text-[11.5px] font-mono font-medium text-gray-700">
                            {srvAmount}
                          </span>
                        )}
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            srvStatus === "REFUNDED"
                              ? "bg-red-200 text-red-800 border border-red-300"
                              : "bg-rose-200/80 text-rose-800 border border-rose-300"
                          }`}
                        >
                          {srvStatus}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-[12px] text-emerald-800 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>All services on this order are marked as paid.</span>
            </div>
          )}

          {/* Paid Services (if split / partial) */}
          {paidServices.length > 0 && unpaidServices.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11.5px] font-semibold text-emerald-700">
                Already Paid Services ({paidServices.length})
              </p>
              <div className="bg-emerald-50/50 border border-emerald-150 rounded-lg px-2 py-1 space-y-1 max-h-[60px] overflow-y-auto custom-scroll">
                {paidServices.map((srv: any, idx: number) => {
                  const srvName =
                    srv.service?.name ||
                    srv.optionName ||
                    srv.custom ||
                    `Service #${srv.service_id || idx + 1}`;
                  return (
                    <div
                      key={srv.uuid || srv.id || idx}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <span className="text-gray-700 truncate pr-2">{srvName}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
                        PAID
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Prominent Watermark Removal Notice shifted right below services */}
          <div className="bg-blue-50 border border-blue-200 rounded-[8px] p-2.5 text-blue-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-[11.5px] leading-snug space-y-0.5">
              <p className="font-semibold text-blue-950">Watermark Removal Processing</p>
              <p className="text-blue-800">
                Releasing media initiates background queue tasks to remove watermarks from all photos. This process takes 1–3 minutes to generate all unwatermarked variants.
              </p>
            </div>
          </div>

          {/* Explanatory Info Warning Box */}
          <div className="bg-amber-50 border border-amber-300 rounded-[8px] p-2.5 text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-[11.5px] leading-snug space-y-0.5">
              <p className="font-semibold text-amber-950">Override Paid-Service Validation</p>
              <p className="text-amber-800">
                Confirming will release all media (photos, videos, 2D/3D floor plans, Matterport tour links) to the agent immediately, overriding the payment requirement.
              </p>
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
            className="h-[34px] px-4 text-[12.5px] font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-1.5 rounded-[6px]"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Confirm & Release Media
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
