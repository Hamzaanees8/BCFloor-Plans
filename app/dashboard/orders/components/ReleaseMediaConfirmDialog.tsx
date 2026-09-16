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
import { AlertCircle, AlertTriangle, CheckCircle, Loader2, Unlock } from "lucide-react";
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
  const isOrderPartiallyPaid = orderPaymentStatus === "PARTIALLY_PAID" || orderPaymentStatus === "PARTIAL";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[540px] w-[95vw] font-alexandria p-0 overflow-hidden rounded-[12px] border border-[#BBBBBB] shadow-xl"
        style={{
          backgroundColor: roleSettings.pageBg || "#FFFFFF",
          color: roleSettings.pageText || "#1F2937",
        }}
      >
        {/* Dialog Header */}
        <DialogHeader
          className="px-6 py-4 border-b border-[#BBBBBB]"
          style={{
            backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`,
          }}
        >
          <DialogTitle
            className="text-[17px] md:text-[19px] font-[700] uppercase flex items-center gap-2.5 tracking-wide"
            style={{ color: roleSettings.pageTabColor }}
          >
            <Unlock className="w-5 h-5 text-red-500 shrink-0" />
            <span>Release Media Before Payment</span>
          </DialogTitle>
        </DialogHeader>

        {/* Dialog Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scroll">
          {/* Order Summary Card */}
          {orderData && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-[14px] text-gray-700 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">Order:</span>
                  <span className="bg-gray-200 px-2.5 py-0.5 rounded text-xs font-mono font-bold text-gray-800">
                    #{orderData.id}
                  </span>
                </div>
                <div>
                  {isOrderFullyUnpaid ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-rose-100 text-rose-700 border border-rose-300">
                      Order Unpaid
                    </span>
                  ) : isOrderPartiallyPaid ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                      Partially Paid
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-300">
                      {orderPaymentStatus}
                    </span>
                  )}
                </div>
              </div>

              {orderData.property_address || orderData.property?.address ? (
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-900 min-w-[70px]">Address:</span>
                  <span className="text-gray-700 break-words">
                    {orderData.property_address || orderData.property?.address}
                  </span>
                </div>
              ) : null}

              {orderData.agent && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 min-w-[70px]">Agent:</span>
                  <span className="text-gray-700">
                    {orderData.agent.first_name} {orderData.agent.last_name}
                    {orderData.agent.company_name ? ` (${orderData.agent.company_name})` : ""}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Unpaid Services List Section */}
          {unpaidServices.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold text-rose-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Unpaid Services To Be Released ({unpaidServices.length})</span>
                </p>
                <span className="text-xs text-gray-500">Will be accessible to agent</span>
              </div>

              <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-3 divide-y divide-rose-100">
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
                      className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-col">
                        <span className="text-[14px] font-semibold text-gray-900">
                          {srvName}
                        </span>
                        {srv.option?.title && (
                          <span className="text-[12px] text-gray-500">
                            {srv.option.title}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5">
                        {srvAmount && (
                          <span className="text-[13px] font-mono font-medium text-gray-700">
                            {srvAmount}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
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
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-[13px] text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All services on this order are marked as paid.</span>
            </div>
          )}

          {/* Paid Services (if any, in split / partial orders) */}
          {paidServices.length > 0 && unpaidServices.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[13px] font-semibold text-emerald-700">
                Already Paid Services ({paidServices.length})
              </p>
              <div className="bg-emerald-50/50 border border-emerald-150 rounded-lg p-2.5 space-y-1.5">
                {paidServices.map((srv: any, idx: number) => {
                  const srvName =
                    srv.service?.name ||
                    srv.optionName ||
                    srv.custom ||
                    `Service #${srv.service_id || idx + 1}`;
                  return (
                    <div
                      key={srv.uuid || srv.id || idx}
                      className="flex items-center justify-between text-[13px]"
                    >
                      <span className="text-gray-700">{srvName}</span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                        PAID
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Explanatory Info Warning Box */}
          <div className="bg-amber-50 border border-amber-300 rounded-[8px] p-3.5 text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-[13px] md:text-[14px] leading-relaxed space-y-1">
              <p className="font-[600]">Override Paid-Service Validation</p>
              <p className="text-amber-800">
                Confirming will release all media (photos, videos, 2D/3D floor plans, Matterport tour links) to the agent immediately, overriding the payment requirement.
              </p>
            </div>
          </div>
        </div>

        {/* Dialog Footer */}
        <DialogFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-[40px] px-5 text-[14px] font-medium border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="h-[40px] px-6 text-[14px] font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-2 rounded-[6px]"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm & Release Media
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
