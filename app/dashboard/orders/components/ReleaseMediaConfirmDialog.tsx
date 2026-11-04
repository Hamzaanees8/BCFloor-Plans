"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import ActionNotificationPrompt from "@/components/ActionNotificationPrompt";
import RuntimeEmailEditorModal from "@/components/RuntimeEmailEditorModal";
import { RecipientRole } from "@/app/dashboard/global-settings/templates";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Sparkles, Unlock } from "lucide-react";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { useAppContext } from "@/app/context/AppContext";

interface ReleaseMediaConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderData: any;
  isLoading: boolean;
  onConfirm: () => void | Promise<void>;
}

export default function ReleaseMediaConfirmDialog({
  open,
  onOpenChange,
  orderData,
  isLoading,
  onConfirm,
}: ReleaseMediaConfirmDialogProps) {
  const [showNotifyPrompt, setShowNotifyPrompt] = useState(false);
  const [targetEmailRoles, setTargetEmailRoles] = useState<RecipientRole[]>(["agent"]);
  const [showEmailModal, setShowEmailModal] = useState(false);

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

  const handleReleaseConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
      setShowNotifyPrompt(true);
    } catch (err) {
      console.error("Release media error:", err);
    }
  };

  return (
    <>
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

          {/* Dialog Body - Original clean layout */}
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
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-300">
                        Partially Paid
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-300">
                        Paid
                      </span>
                    )}
                  </div>
                </div>

                {orderData.property_address && (
                  <p className="text-gray-600 truncate text-[11.5px]">
                    {orderData.property_address}
                  </p>
                )}
              </div>
            )}

            {/* Unpaid Services Warning */}
            {unpaidServices.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11.5px] font-semibold text-rose-700">
                  Unpaid Services Being Released ({unpaidServices.length})
                </p>
                <div className="bg-rose-50/50 border border-rose-150 rounded-lg px-2 py-1 space-y-1 max-h-[72px] overflow-y-auto custom-scroll">
                  {unpaidServices.map((srv: any, idx: number) => {
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
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                          UNPAID
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Paid Services */}
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

            {/* Prominent Watermark Removal Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-[8px] p-2.5 text-blue-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-[11.5px] leading-snug space-y-0.5">
                <p className="font-semibold text-blue-950">Watermark Removal Processing</p>
                <p className="text-blue-800">
                  Releasing media initiates background queue tasks to remove watermarks from all photos. This process takes a couple of minutes to generate all unwatermarked variants.
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

          {/* Dialog Footer - Original Clean 2-Button Layout */}
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
              onClick={handleReleaseConfirm}
              disabled={isLoading}
              className="h-[34px] px-4 text-[12.5px] font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-1.5 rounded-[6px]"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirm & Release Media
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 1: Post-Action Recipient Selection Prompt */}
      <ActionNotificationPrompt
        open={showNotifyPrompt}
        onOpenChange={setShowNotifyPrompt}
        title="SAVE AND EXIT"
        description="Media has been released successfully. Choose who should receive an email notification:"
        options={[
          {
            role: "agent",
            label: "Notify Agent of Changes",
            sublabel: "Edit Notification",
            defaultChecked: true,
          },
          {
            role: "vendor",
            label: "Notify Vendor of Changes",
            sublabel: "Edit Notification",
            defaultChecked: false,
          },
        ]}
        onProceed={(selectedRoles) => {
          setTargetEmailRoles(selectedRoles);
          setShowEmailModal(true);
        }}
      />

      {/* Step 2: Streamlined Runtime Email Editor Modal */}
      {showEmailModal && (
        <RuntimeEmailEditorModal
          open={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          eventType="media_uploaded"
          eventLabel="Media Uploaded / Ready"
          queueRoles={targetEmailRoles}
          orderUuid={orderData?.uuid}
          recipientEmails={{
            agent: orderData?.agent?.email || (orderData as any)?.user?.email,
            vendor: (orderData as any)?.vendor?.email || (orderData?.services?.[0] as any)?.vendor?.email,
          }}
          recipientNames={{
            agent: orderData?.agent?.first_name
              ? `${orderData.agent.first_name} ${orderData.agent.last_name || ""}`.trim()
              : undefined,
            vendor: (orderData as any)?.vendor?.full_name || (orderData?.services?.[0] as any)?.vendor?.full_name || undefined,
          }}
        />
      )}
    </>
  );
}
