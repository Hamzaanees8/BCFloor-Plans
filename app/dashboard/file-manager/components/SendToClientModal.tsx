'use client';

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Mail,
  Send,
  X,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { SendMediaToClient } from "../file-manager";

interface SendToClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderData: any;
  currentService: any;
  currentBookedService?: any;
  filesData: any;
  onApproveAllMedia: () => Promise<void>;
  onSuccess?: () => void;
}

export default function SendToClientModal({
  open,
  onOpenChange,
  orderData,
  currentService,
  currentBookedService,
  filesData,
  onApproveAllMedia,
  onSuccess,
}: SendToClientModalProps) {
  const [customMessage, setCustomMessage] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Reset internal states whenever modal opens or service changes
  useEffect(() => {
    if (open) {
      setApprovalSuccess(false);
      setIsApproving(false);
      setIsSending(false);
      setCustomMessage("");
    }
  }, [open, currentService?.uuid]);

  // Compute approved and unapproved counts
  const { approvedCount, unapprovedCount, totalCount } = useMemo(() => {
    if (!filesData?.files) {
      return { approvedCount: 0, unapprovedCount: 0, totalCount: 0 };
    }

    const serviceUuid = currentService?.uuid;
    const serviceId = currentService?.id;

    const relevantFiles = filesData.files.filter((f: any) => {
      if (f.is_deleted || f.is_hidden) return false;
      if (!serviceUuid && !serviceId) return true;
      return (
        f.service?.uuid === serviceUuid ||
        String(f.service_id) === String(serviceId) ||
        String(f.service?.id) === String(serviceId)
      );
    });

    // Check relevant links (for 3D / Matterport / Video links)
    const rawLinks = filesData?.links || filesData?.tours?.links || [];
    const relevantLinks = rawLinks.filter((l: any) => {
      if (!serviceId) return true;
      return String(l.service_id) === String(serviceId);
    });

    const approvedFiles = relevantFiles.filter((f: any) => f.is_admin_approved).length;
    const approvedLinks = relevantLinks.filter((l: any) => l.is_admin_approved).length;
    const unapprovedFiles = relevantFiles.filter((f: any) => !f.is_admin_approved).length;
    const unapprovedLinks = relevantLinks.filter((l: any) => !l.is_admin_approved).length;

    const totalApproved = approvedFiles + approvedLinks;
    const totalUnapproved = unapprovedFiles + unapprovedLinks;

    return {
      approvedCount: totalApproved,
      unapprovedCount: totalUnapproved,
      totalCount: totalApproved + totalUnapproved,
    };
  }, [filesData, currentService]);

  // Resolve booked service & package limit
  const bookedService = useMemo(() => {
    if (currentBookedService) return currentBookedService;
    if (!orderData?.services || !currentService) return null;
    return orderData.services.find(
      (s: any) =>
        s.service?.uuid === currentService.uuid ||
        String(s.service_id) === String(currentService.id) ||
        String(s.uuid) === String(currentService.uuid)
    );
  }, [currentBookedService, orderData, currentService]);

  const packageLimit: number = useMemo(() => {
    return Number(bookedService?.option?.quantity || 0);
  }, [bookedService]);

  const serviceName = currentService?.name || "Media Package";
  const agentName = orderData?.agent
    ? `${orderData.agent.first_name || ""} ${orderData.agent.last_name || ""}`.trim()
    : "Agent";
  const agentEmail = orderData?.agent?.email || "";
  const propertyAddress =
    orderData?.property_address ||
    orderData?.property?.address ||
    (orderData?.property?.city
      ? `${orderData?.property?.street_address || ""}, ${orderData?.property?.city || ""}`
      : "Order Property");

  // Media states:
  // 1. Mixed: some approved, some unapproved (!approvalSuccess && approvedCount > 0 && unapprovedCount > 0)
  // 2. Zero approved: (!approvalSuccess && approvedCount === 0 && unapprovedCount > 0)
  // 3. No media at all: totalCount === 0
  // 4. All approved: either initially (approvedCount > 0 && unapprovedCount === 0) or user clicked Approve All in modal session
  const isMixed = !approvalSuccess && approvedCount > 0 && unapprovedCount > 0;
  const isZeroApproved = !approvalSuccess && approvedCount === 0 && unapprovedCount > 0;
  const isNoMedia = !approvalSuccess && totalCount === 0;
  const isAllApproved = approvalSuccess || (approvedCount > 0 && unapprovedCount === 0);

  // Effective approved count considers if admin just approved all in this modal session
  const effectiveApprovedCount = approvalSuccess ? totalCount : approvedCount;
  const isUnderLimit = packageLimit > 0 && effectiveApprovedCount < packageLimit;

  // Handle Approve All Media
  const handleApproveAll = async () => {
    setIsApproving(true);
    try {
      await onApproveAllMedia();
      setApprovalSuccess(true);
      toast.success("All media for this service has been approved!");
    } catch (err: any) {
      console.error("Failed to approve media:", err);
      toast.error(err?.message || "Failed to approve media files.");
    } finally {
      setIsApproving(false);
    }
  };

  // Handle Send to Client API call
  const handleSendToClient = async () => {
    if (!orderData?.uuid) {
      toast.error("Order UUID is missing.");
      return;
    }

    const token = localStorage.getItem("token") || "";
    if (!token) {
      toast.error("You must be logged in to send media.");
      return;
    }

    setIsSending(true);
    try {
      const response = await SendMediaToClient(
        {
          order_uuid: orderData.uuid,
          service_uuid: currentService?.uuid,
          service_id: currentService?.id,
          custom_message: customMessage.trim() || undefined,
        },
        token
      );

      toast.success(
        response.message || `Media for "${serviceName}" successfully sent to the client!`
      );
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to send media to client:", err);
      toast.error(err?.message || "Failed to send media to client.");
    } finally {
      setIsSending(false);
    }
  };

  const modalTitle = isZeroApproved
    ? "No Approved Media to Send"
    : isMixed
    ? "Review & Send to Client"
    : isNoMedia
    ? "No Media Uploaded"
    : "Send to Client";

  const modalSubtitle = isZeroApproved
    ? "Approval required before delivering files"
    : isMixed
    ? `${approvedCount} approved, ${unapprovedCount} awaiting approval`
    : isNoMedia
    ? `No files uploaded for ${serviceName}`
    : `Delivering ${serviceName} to ${agentName}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] max-w-[560px] rounded-[14px] p-0 font-alexandria shadow-2xl border border-gray-200 bg-white overflow-hidden [&>button]:hidden">
        {/* Header Banner */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-[17px] font-bold text-gray-900 leading-tight">
                {modalTitle}
              </DialogTitle>
              <DialogDescription className="text-[12px] text-gray-500 mt-0.5">
                {modalSubtitle}
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Target Service & Agent Summary Card */}
          <div className="p-3.5 bg-gray-50 rounded-[10px] border border-gray-200 text-[13px] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Service:</span>
              <span className="font-bold text-gray-900">{serviceName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Recipient:</span>
              <span className="font-semibold text-gray-800">
                {agentName} {agentEmail ? `(${agentEmail})` : ""}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Property:</span>
              <span className="font-medium text-gray-700 truncate max-w-[260px]">
                {propertyAddress}
              </span>
            </div>
          </div>

          {/* STATE 1: NO MEDIA UPLOADED AT ALL */}
          {isNoMedia && (
            <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-[10px] flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-amber-900">
                <p className="text-[14px] font-bold">No media uploaded</p>
                <p className="text-[12.5px] leading-relaxed text-amber-800">
                  No media files have been uploaded yet for this service. Please upload media files before delivering to the client.
                </p>
              </div>
            </div>
          )}

          {/* STATE 2: ZERO APPROVED MEDIA (All uploaded files are unapproved) */}
          {isZeroApproved && (
            <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-[10px] flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-amber-900">
                <p className="text-[14px] font-bold">
                  There is no approved media by admin
                </p>
                <p className="text-[12.5px] leading-relaxed text-amber-800">
                  Media files must be approved before sending the service completion email to the client.
                  There {unapprovedCount === 1 ? "is" : "are"}{" "}
                  <span className="font-bold">{unapprovedCount}</span> uploaded file
                  {unapprovedCount === 1 ? "" : "s"} waiting for approval.
                </p>
              </div>
            </div>
          )}

          {/* STATE 3: MIXED STATE (Both Approved and Unapproved Media Exist) */}
          {isMixed && (
            <div className="space-y-3">
              <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-[10px] flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-amber-900">
                  <p className="text-[14px] font-bold">
                    Files Pending Approval ({unapprovedCount})
                  </p>
                  <p className="text-[12.5px] leading-relaxed text-amber-800">
                    This service has <span className="font-bold text-amber-950">{approvedCount}</span> approved file{approvedCount === 1 ? "" : "s"} and{" "}
                    <span className="font-bold text-amber-950">{unapprovedCount}</span> file{unapprovedCount === 1 ? "" : "s"} awaiting approval.
                    You can approve all remaining files now, send only the currently approved files to the client, or close to review manually.
                  </p>
                </div>
              </div>

              {/* Package Limit Warning if approved count < package ordered */}
              {isUnderLimit && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-[8px] flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-800">
                    Package limit warning: Only <span className="font-bold text-amber-950">{approvedCount}</span> approved out of{" "}
                    <span className="font-bold text-amber-950">{packageLimit}</span> ordered in this package.
                  </p>
                </div>
              )}

              {/* Custom Message Textarea */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[12px] font-bold text-gray-700 flex items-center justify-between">
                  <span>Custom Message (Optional)</span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    Included in client email
                  </span>
                </label>
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="e.g. Hi, your photos are ready! Please review and let us know if you need any edits."
                  maxLength={2000}
                  className="min-h-[80px] text-[13px] rounded-[8px] border-gray-300 resize-none focus-visible:ring-1 focus-visible:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* APPROVAL JUST COMPLETED IN MODAL: Small Info Message */}
          {approvalSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-[8px] flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-[12.5px] text-emerald-900 font-medium">
                All media files have been approved. You can now send the service completion email to the client.
              </p>
            </div>
          )}

          {/* STATE 4: ALL APPROVED (Either Initially or After "Approve All") */}
          {isAllApproved && (
            <div className="space-y-3">
              {/* Package Limit Warning Banner */}
              {isUnderLimit && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-[10px] flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-bold text-amber-900 leading-tight">
                      Package order limit warning
                    </p>
                    <p className="text-[12px] text-amber-800 mt-1">
                      Only <span className="font-bold text-amber-950">{effectiveApprovedCount}</span> images
                      uploaded out of <span className="font-bold text-amber-950">{packageLimit}</span> ordered
                      in this package.
                    </p>
                  </div>
                </div>
              )}

              {/* Ready Indicator if Package Limit Met */}
              {!isUnderLimit && packageLimit > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-[8px] flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <p className="text-[12.5px] text-blue-900">
                    <span className="font-bold">{effectiveApprovedCount}</span> approved media items ready to
                    deliver ({packageLimit} included in package).
                  </p>
                </div>
              )}

              {/* Custom Message Textarea */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[12px] font-bold text-gray-700 flex items-center justify-between">
                  <span>Custom Message (Optional)</span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    Included in client email
                  </span>
                </label>
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="e.g. Hi, your photos are ready! Please review and let us know if you need any edits."
                  maxLength={2000}
                  className="min-h-[85px] text-[13px] rounded-[8px] border-gray-300 resize-none focus-visible:ring-1 focus-visible:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row sm:justify-end gap-2.5">
          {/* CASE 1: NO MEDIA */}
          {isNoMedia && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-[38px] px-4 text-[13px] font-medium border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Close
            </Button>
          )}

          {/* CASE 2: ZERO APPROVED (2 buttons: Approve Manually & Approve All) */}
          {isZeroApproved && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-[38px] px-4 text-[13px] font-medium border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Approve Manually
              </Button>
              <Button
                type="button"
                onClick={handleApproveAll}
                disabled={isApproving || unapprovedCount === 0}
                className="h-[38px] px-5 text-[13px] font-semibold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Approving Media...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Approve All Media ({unapprovedCount})</span>
                  </>
                )}
              </Button>
            </>
          )}

          {/* CASE 3: MIXED MEDIA (3 buttons: Approve Manually, Approve All, Send To Client) */}
          {isMixed && (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isApproving || isSending}
                onClick={() => onOpenChange(false)}
                className="h-[38px] px-3.5 text-[13px] font-medium border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Approve Manually
              </Button>
              <Button
                type="button"
                onClick={handleApproveAll}
                disabled={isApproving || isSending}
                className="h-[38px] px-4 text-[13px] font-semibold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Approve All ({unapprovedCount})</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={handleSendToClient}
                disabled={isSending || isApproving}
                className="h-[38px] px-4 text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Approved ({approvedCount})</span>
                  </>
                )}
              </Button>
            </>
          )}

          {/* CASE 4: ALL APPROVED (2 buttons: Cancel & Send To Client) */}
          {isAllApproved && !isNoMedia && (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isSending}
                onClick={() => onOpenChange(false)}
                className="h-[38px] px-4 text-[13px] font-medium border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSendToClient}
                disabled={isSending || effectiveApprovedCount === 0}
                className="h-[38px] px-5 text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending to Client...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send To Client</span>
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
