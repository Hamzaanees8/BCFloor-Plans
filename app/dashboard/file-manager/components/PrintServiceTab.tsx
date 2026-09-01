"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useFileManagerContext, Files } from "../FileManagerContext";
import { useAppContext } from "@/app/context/AppContext";
import { Order } from "../../orders/page";
import { Services } from "../../services/page";
import { DownloadFile, GetFilesData } from "../file-manager";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText,
  Download,
  Trash2,
  UploadCloud,
  Lock,
  Eye,
  Clock,
  Receipt,
  Loader2,
  Printer,
  Plus,
  Check,
  History,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useGlobalFileUpload } from "@/context/GlobalFileUploadContext";
import { S3UploadService } from "@/lib/upload/s3-service";

interface PrintServiceTabProps {
  orderData: Order | null;
  currentService: Services | undefined;
  currentBookedService: any;
  onOpenInvoice?: (serviceName?: string, orderServiceUuid?: string) => void;
  onSave?: (overrideChangedFiles?: Files[]) => Promise<void>;
  gstRate?: number;
  isScrolled?: boolean;
  stickyOffset?: number;
  onNavigateToTab?: (tab: string) => void;
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.style.display = "none";
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1500);
};

const PrintServiceTab: React.FC<PrintServiceTabProps> = ({
  orderData,
  currentService,
  currentBookedService,
  onOpenInvoice,
  onSave,
  gstRate = 0,
  isScrolled = false,
  stickyOffset = 0,
  onNavigateToTab,
}) => {
  const { userType } = useAppContext();
  const { filesData, setFilesData, setChangedFileUuids } =
    useFileManagerContext();
  const { startUpload } = useGlobalFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [downloadingFileUuid, setDownloadingFileUuid] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<any | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isTogglingApproval, setIsTogglingApproval] = useState(false);

  // Clean up blob URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  // Match files for this specific service
  const serviceId =
    currentService?.id ||
    currentBookedService?.service_id ||
    currentBookedService?.service?.id;
  const serviceUuid =
    currentService?.uuid ||
    currentBookedService?.service?.uuid ||
    currentBookedService?.service_uuid ||
    currentBookedService?.uuid;

  // Filter all non-deleted files for this service and sort newest first
  const allPdfFiles = useMemo(() => {
    return (filesData?.files || [])
      .filter(
        (f: any) =>
          !f.is_deleted &&
          ((serviceUuid &&
            (f.service?.uuid === serviceUuid || f.service_id === serviceUuid)) ||
            (serviceId &&
              (Number(f.service_id) === Number(serviceId) ||
                Number(f.service?.id) === Number(serviceId)))),
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime(),
      );
  }, [filesData?.files, serviceUuid, serviceId]);

  const currentPdf = allPdfFiles[0]; // Latest / current active version
  const previousPdfFiles = useMemo(() => allPdfFiles.slice(1), [allPdfFiles]);

  // Approval status check helper
  const isFileApproved = useCallback((file: any) => {
    if (!file) return false;
    return Boolean(
      file.is_agent_approved === true ||
        file.is_agent_approved === 1 ||
        file.is_agent_approved === "1" ||
        file.is_agent_approved === "true",
    );
  }, []);

  const isCurrentApprovedForPrinting = isFileApproved(currentPdf);

  // Price & Payment checks
  const rawPrice =
    currentBookedService?.option?.amount || currentBookedService?.amount || 0;
  const price = parseFloat(rawPrice.toString()) || 0;
  const totalWithTax = price + (gstRate ? price * gstRate : 0);

  const paymentStatus =
    currentBookedService?.payment_status?.toUpperCase() ||
    orderData?.payment_status?.toUpperCase() ||
    "UNPAID";
  const isPaid = paymentStatus === "PAID";
  const isRefunded = paymentStatus === "REFUNDED";
  // Payment verification bypassed for print PDF proof viewing/downloading for now
  const hasAccess = true;

  // Extract quantity/copies from option or custom fields
  const optionTitle = currentBookedService?.option?.title || "";
  const rawQuantity =
    currentBookedService?.option?.quantity ||
    currentBookedService?.quantity ||
    currentBookedService?.copies ||
    (optionTitle ? parseInt(optionTitle.match(/\d+/)?.[0] || "0", 10) : 0);
  const copiesCount = rawQuantity > 0 ? rawQuantity : null;

  // Handle Toggle Approval (Agent only)
  const handleToggleApproval = async (targetFile?: any) => {
    const fileToApprove = targetFile || currentPdf;
    if (!fileToApprove || isTogglingApproval || userType !== "agent") return;
    setIsTogglingApproval(true);
    try {
      const isApproved = isFileApproved(fileToApprove);
      const newApproved = !isApproved;
      const updatedFile = {
        ...fileToApprove,
        is_agent_approved: newApproved,
      };

      setFilesData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          files: prev.files.map((f) =>
            f.uuid === fileToApprove.uuid ? updatedFile : f,
          ),
        };
      });

      setChangedFileUuids((prev) => new Set(prev).add(fileToApprove.uuid));

      if (selectedPreviewFile?.uuid === fileToApprove.uuid) {
        setSelectedPreviewFile(updatedFile);
      }

      if (onSave) {
        await onSave([updatedFile as unknown as Files]);
      }
      toast.success(
        newApproved
          ? "Marked as Approved for Printing"
          : "Approval for Printing removed",
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update approval");
    } finally {
      setIsTogglingApproval(false);
    }
  };

  // Handle Upload New Version / PDF
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const file = selectedFiles[0];
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      toast.error("Please upload a PDF document (.pdf)");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token || !orderData?.uuid) {
      toast.error("Authentication or Order data missing");
      return;
    }

    setIsUploading(true);
    try {
      const uploadItem = {
        file,
        type: "pdf",
        service_id: serviceUuid ? String(serviceUuid) : String(serviceId || ""),
      };

      const response = await startUpload({
        token,
        orderUuid: orderData.uuid,
        filesDataUuid: filesData?.uuid,
        files: [uploadItem],
        links: [],
        droppedMarkers: [],
        delay: 3000,
        transition: "fade-in",
        selectedAudioTrack: "none",
        changedFiles: [],
        isUpdate: !!filesData,
        showToast: false,
      });

      if (response) {
        // Invalidate cached preview blob
        if (previewBlobUrl) {
          URL.revokeObjectURL(previewBlobUrl);
          setPreviewBlobUrl(null);
        }
        setShowPreviewModal(false);
        setSelectedPreviewFile(null);

        // Fetch fresh filesData to update UI immediately
        const freshRes = await GetFilesData(token, orderData.uuid, true);
        if (freshRes?.data && freshRes.data[0]) {
          setFilesData(freshRes.data[0]);
        }
        toast.success(
          currentPdf
            ? "New PDF version uploaded successfully"
            : "Print PDF uploaded successfully",
        );
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload print PDF document");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle Delete a specific PDF
  const handleDelete = async (targetFile: any) => {
    if (!targetFile) return;
    if (
      !confirm(
        `Are you sure you want to delete "${targetFile.name || "this PDF"}"?`,
      )
    )
      return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      if (targetFile.uuid) {
        await S3UploadService.deleteUploads({
          uuids: [targetFile.uuid],
          type: "tour-file",
        });
      }

      if (selectedPreviewFile?.uuid === targetFile.uuid) {
        if (previewBlobUrl) {
          URL.revokeObjectURL(previewBlobUrl);
          setPreviewBlobUrl(null);
        }
        setShowPreviewModal(false);
        setSelectedPreviewFile(null);
      }

      // Remove from local filesData immediately
      setFilesData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          files: prev.files.filter((f) => f.uuid !== targetFile.uuid),
        };
      });

      // Synchronize fresh filesData from backend
      if (orderData?.uuid) {
        const freshRes = await GetFilesData(token, orderData.uuid, true);
        if (freshRes?.data && freshRes.data[0]) {
          setFilesData(freshRes.data[0]);
        }
      }

      toast.success("PDF document deleted successfully");
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete file. Please try again.");
    }
  };

  // Handle Download a specific PDF
  const handleDownload = async (targetFile: any) => {
    if (!targetFile) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    const fileKey = targetFile.uuid || "current";
    setDownloadingFileUuid(fileKey);
    try {
      const fileName =
        targetFile.name || `${currentService?.name || "Print_Document"}.pdf`;

      if (targetFile.url && !targetFile.uuid) {
        window.open(targetFile.url, "_blank");
      } else {
        const response = await DownloadFile(token, targetFile.uuid);
        if (!response.ok)
          throw new Error(`Download failed: ${response.statusText}`);
        const blob = await response.blob();
        downloadBlob(blob, fileName);
      }
    } catch (err: any) {
      console.error("Download error:", err);
      toast.error(err.message || "Failed to download file");
    } finally {
      setDownloadingFileUuid(null);
    }
  };

  // Handle Preview Popup for a specific PDF
  const handleOpenPreview = async (targetFile: any) => {
    if (!targetFile) return;
    setSelectedPreviewFile(targetFile);
    setShowPreviewModal(true);

    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }

    setIsPreviewLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      let blob: Blob;

      if (targetFile.uuid) {
        const response = await DownloadFile(token, targetFile.uuid);
        blob = await response.blob();
      } else {
        const fileUrl =
          targetFile.url ||
          (targetFile.file_path
            ? `${process.env.NEXT_PUBLIC_API_URL || ""}/${targetFile.file_path}`
            : "");
        const response = await fetch(fileUrl);
        blob = await response.blob();
      }

      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(pdfBlob);
      setPreviewBlobUrl(objectUrl);
    } catch (err: any) {
      console.error("Failed to load PDF preview:", err);
      toast.error("Failed to load PDF preview");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isSelectedPreviewApproved = isFileApproved(selectedPreviewFile);

  return (
    <div className="w-full flex flex-col font-alexandria">
      {/* Top Header Bar matching HDRStill & 2DFloor */}
      <div
        className={`w-full flex flex-wrap justify-between items-center px-4 font-alexandria overflow-visible transition-all duration-300 z-10 gap-y-2 ${
          isScrolled
            ? "sticky min-h-[44px] py-1 shadow-sm"
            : "relative min-h-[66px] py-2"
        }`}
        style={{
          backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)`,
          top: isScrolled ? `${stickyOffset}px` : "auto",
        }}
      >
        {/* Left: Upload/Download Button */}
        <div className="shrink-0 flex items-center gap-2">
          {userType === "admin" ? (
            <div className="flex gap-2 items-center">
              <Button
                onClick={() => !isUploading && fileInputRef.current?.click()}
                disabled={isUploading}
                className={`${userType}-bg flex justify-center items-center hover-${userType}-bg transition-all duration-300 ${
                  isScrolled
                    ? "h-[24px] w-[80px] text-[10px]"
                    : "h-[26px] w-[95px] text-[10px] md:h-[32px] md:w-[140px] md:text-[12px]"
                } px-1 md:px-4 cursor-pointer text-white`}
              >
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <Plus className="w-3.5 h-3.5 mr-1" />
                )}
                {currentPdf ? "Upload New PDF" : "Add PDF"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
              />
              {currentPdf && (
                <Button
                  onClick={() => handleDownload(currentPdf)}
                  disabled={downloadingFileUuid === (currentPdf.uuid || "current")}
                  className={`${userType}-bg hover-${userType}-bg flex justify-center items-center cursor-pointer transition-all duration-300 ${
                    isScrolled
                      ? "h-[24px] w-[70px] text-[10px]"
                      : "h-[26px] w-[80px] text-[10px] md:h-[32px] md:w-[120px] md:text-[12px]"
                  } px-1 md:px-4 text-white`}
                >
                  {downloadingFileUuid === (currentPdf.uuid || "current") ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <Download className="w-3.5 h-3.5 mr-1" />
                  )}
                  Download
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <Button
                onClick={() => handleDownload(currentPdf)}
                title={!hasAccess ? "Service not paid yet" : ""}
                disabled={
                  !hasAccess ||
                  !currentPdf ||
                  downloadingFileUuid === (currentPdf?.uuid || "current")
                }
                className={`${userType}-bg hover-${userType}-bg flex justify-center items-center transition-all duration-300 ${
                  isScrolled
                    ? "h-[24px] w-[70px] text-[10px]"
                    : "h-[26px] w-[80px] text-[10px] md:h-[32px] md:w-[130px] md:text-[12px]"
                } px-1 md:px-4 text-white ${
                  !hasAccess || !currentPdf
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                {downloadingFileUuid === (currentPdf?.uuid || "current") ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <Download className="w-3.5 h-3.5 mr-1" />
                )}
                Download
              </Button>
            </div>
          )}
        </div>

        {/* Center: Title & Subtitle */}
        <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <p className="flex flex-col items-center pointer-events-auto text-center">
            <span
              className={`font-bold transition-all duration-300 ${userType}-text ${
                isScrolled ? "text-[13px]" : "text-[16px]"
              }`}
            >
              {currentService?.name || "Design & Print"}
            </span>
            {!isScrolled && (
              <span className="text-[12px] text-[#7D7D7D]">
                {optionTitle ||
                  (copiesCount ? `${copiesCount} Copies` : "Print Service")}
              </span>
            )}
          </p>
        </div>

        {/* Right: Price + Paid/Unpaid Badge Button */}
        <div className="flex justify-center items-center gap-x-2 md:gap-x-[14px] shrink-0">
          <div className="flex items-center gap-[5px] md:gap-[10px] md:mr-2">
            <div className="flex flex-col justify-center items-end mr-1 md:mr-2 text-right">
              <p
                className={`text-[13px] md:text-[18px] ${
                  isRefunded
                    ? "text-[#D0021B]"
                    : isPaid
                      ? "text-[#6BAE41]"
                      : "text-[#E06D5E]"
                } leading-none mb-1 font-[600]`}
              >
                ${totalWithTax.toFixed(2)}
              </p>
              <p className="text-[#7D7D7D] text-[9px] md:text-[10px] leading-none">
                {gstRate
                  ? `incl. $${(price * gstRate).toFixed(2)} GST`
                  : copiesCount
                    ? `${copiesCount} Copies`
                    : "Total"}
              </p>
            </div>

            {/* Payment Badge Button */}
            <Button
              onClick={() => {
                onOpenInvoice?.(
                  currentService?.name,
                  currentBookedService?.uuid,
                );
              }}
              className={`h-[24px] w-[65px] text-[10px] md:h-[32px] md:w-[100px] md:text-[14px] flex justify-center items-center cursor-pointer px-1 md:px-4 text-white ${
                isRefunded
                  ? "bg-[#D0021B] hover:bg-[#b00217]"
                  : isPaid
                    ? "bg-[#6BAE41] hover:bg-[#5fa43a]"
                    : "bg-[#DC9600] hover:bg-[#eda304]"
              }`}
            >
              {isRefunded ? "REFUNDED" : isPaid ? "PAID" : "UNPAID"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Body Content */}
      <div className="w-full py-8 px-4 md:px-8 max-w-5xl mx-auto space-y-6">
        {currentPdf && !hasAccess ? (
          /* Payment Required Lock Screen for Agents */
          <div className="bg-white rounded-[12px] border border-amber-200 bg-amber-50/50 p-8 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-[18px] font-[600] text-amber-900 mb-1.5">
              Payment Required to Access Print Proof
            </h3>
            <p className="text-[13px] text-amber-700 max-w-md mb-6 leading-relaxed">
              This print service (
              {copiesCount ? `${copiesCount} copies` : "print package"}) is
              currently unpaid. Please complete payment of{" "}
              <span className="font-[600]">${totalWithTax.toFixed(2)}</span> to
              review and download the completed PDF proof.
            </p>
            {onOpenInvoice && (
              <Button
                onClick={() =>
                  onOpenInvoice(
                    currentService?.name,
                    currentBookedService?.uuid,
                  )
                }
                className="bg-amber-600 hover:bg-amber-700 text-white font-[500] h-[40px] px-8 rounded-[8px] flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                Pay Invoice (${totalWithTax.toFixed(2)})
              </Button>
            )}
          </div>
        ) : (
          /* Unlocked Area */
          <div className="space-y-6">
            {/* Current Active PDF Proof Card */}
            <div className="bg-white rounded-[12px] border border-[#E4E4E4] p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
                <div>
                  <h3 className="text-[16px] font-[600] text-[#1C1C1C] flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Current Print PDF Proof
                  </h3>
                  <p className="text-[12px] text-[#666666] mt-0.5">
                    {userType === "admin"
                      ? "Upload, replace, or manage the high-resolution print PDF document for this order."
                      : "View, approve, and download your finalized print PDF proof."}
                  </p>
                  {onNavigateToTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateToTab("CreateFeatureSheet")}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-800 underline transition-colors cursor-pointer mt-1"
                    >
                      <span>Access DIY print material creation tool</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Approved for Printing Badge / Action for Current PDF */}
                {currentPdf && (
                  <div className="flex items-center gap-2">
                    {userType === "admin" ? (
                      <div
                        key="current-admin-status"
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-semibold border select-none ${
                          isCurrentApprovedForPrinting
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-amber-50 text-amber-700 border-amber-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center ${
                            isCurrentApprovedForPrinting
                              ? "bg-emerald-600 text-white"
                              : "border border-amber-400 bg-white"
                          }`}
                        >
                          {isCurrentApprovedForPrinting && (
                            <Check size={12} strokeWidth={3} />
                          )}
                        </div>
                        <span>
                          {isCurrentApprovedForPrinting
                            ? "Approved for Printing"
                            : "Not Approved for Printing"}
                        </span>
                      </div>
                    ) : (
                      <button
                        key="current-agent-toggle"
                        type="button"
                        onClick={() => handleToggleApproval(currentPdf)}
                        disabled={isTogglingApproval}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-semibold border transition-all cursor-pointer ${
                          isCurrentApprovedForPrinting
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                        title="Click to toggle Approved for Printing"
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isCurrentApprovedForPrinting
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-gray-400 bg-white"
                          }`}
                        >
                          {isCurrentApprovedForPrinting && (
                            <Check size={12} strokeWidth={3} />
                          )}
                        </div>
                        <span>Approved for Printing</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Admin Upload Dropzone (When no PDFs exist yet) */}
              {userType === "admin" && !currentPdf && (
                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[10px] p-8 flex flex-col items-center justify-center transition-all ${
                    isUploading
                      ? "border-blue-300 bg-blue-50/40 cursor-wait"
                      : "border-gray-300 hover:border-blue-500 bg-gray-50/70 hover:bg-blue-50/40 cursor-pointer"
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-2" />
                      <p className="text-[14px] font-[600] text-blue-700">
                        Uploading Print PDF...
                      </p>
                      <p className="text-[12px] text-gray-500 mt-1">
                        Please wait while the file is processed
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud className="w-10 h-10 text-blue-500 mb-2" />
                      <p className="text-[14px] font-[600] text-gray-800">
                        Click or drag to upload Print PDF
                      </p>
                      <p className="text-[12px] text-gray-500 mt-1">
                        Accepts high-resolution PDF document format
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Current PDF Document Details & Actions */}
              {currentPdf ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#F9FBFD] border border-blue-100 rounded-[10px] gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3.5 bg-blue-100 text-blue-700 rounded-[10px] shrink-0">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-[14px] md:text-[15px] font-[600] text-[#1C1C1C] break-all">
                        {currentPdf.name ||
                          `${currentService?.name || "Print_Document"}.pdf`}
                      </p>
                      <div className="flex items-center gap-3 text-[12px] text-[#666666] mt-1 flex-wrap">
                        {currentPdf.created_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            Uploaded:{" "}
                            {new Date(
                              currentPdf.created_at,
                            ).toLocaleDateString()}
                          </span>
                        )}
                        {currentPdf.size && (
                          <span>Size: {formatFileSize(currentPdf.size)}</span>
                        )}
                        <span className="inline-flex items-center text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-200">
                          Latest Version
                        </span>
                        {isCurrentApprovedForPrinting && (
                          <span className="inline-flex items-center text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                            <Check className="w-3 h-3 mr-1" /> Approved for
                            Printing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                    <Button
                      onClick={() => handleOpenPreview(currentPdf)}
                      variant="outline"
                      size="sm"
                      className="h-[36px] px-3.5 rounded-[6px] border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                      Preview
                    </Button>

                    <Button
                      onClick={() => handleDownload(currentPdf)}
                      disabled={downloadingFileUuid === (currentPdf.uuid || "current")}
                      size="sm"
                      className="h-[36px] px-4 rounded-[6px] bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      {downloadingFileUuid === (currentPdf.uuid || "current") ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Download PDF
                    </Button>

                    {userType === "admin" && (
                      <Button
                        onClick={() => handleDelete(currentPdf)}
                        variant="outline"
                        size="sm"
                        className="h-[36px] px-2.5 rounded-[6px] border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 cursor-pointer"
                        title="Delete this PDF"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                userType !== "admin" && (
                  <div className="text-center py-10 px-6 bg-[#F9FBFD] rounded-[10px] border border-blue-100 text-gray-600 flex flex-col items-center justify-center space-y-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                      <Printer className="w-6 h-6" />
                    </div>
                    {copiesCount ? (
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-blue-100/80 text-blue-800 rounded-full text-xs font-semibold border border-blue-200">
                        <Printer className="w-3.5 h-3.5" />
                        <span>Number of Copies Ordered: {copiesCount}</span>
                      </div>
                    ) : null}
                    <p className="text-[14px] font-medium text-gray-700 max-w-xl mx-auto leading-relaxed">
                      You will receive a proof once all the required materials and information have been received. Please email the office to specify which template you would like used and provide the information to be displayed.
                    </p>
                    {onNavigateToTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTab("CreateFeatureSheet")}
                        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-800 underline transition-colors cursor-pointer pt-1"
                      >
                        <span>Access DIY print material creation tool</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Previous Versions Section */}
            {previousPdfFiles.length > 0 && (
              <div className="bg-white rounded-[12px] border border-[#E4E4E4] p-6 shadow-sm space-y-4">
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-500" />
                    <h4 className="text-[15px] font-[600] text-[#1C1C1C]">
                      Previous Versions ({previousPdfFiles.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-[#7D7D7D]">
                    Archived versions for this service
                  </span>
                </div>

                <div className="space-y-3">
                  {previousPdfFiles.map((prevFile: any, idx: number) => {
                    const isPrevApproved = isFileApproved(prevFile);
                    const fileKey = prevFile.uuid || prevFile.id || `prev-file-${idx}`;

                    return (
                      <div
                        key={fileKey}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-gray-50/80 hover:bg-gray-50 border border-gray-200 rounded-[8px] gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-gray-200/70 text-gray-600 rounded-[8px] shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[13px] font-[600] text-[#2C2C2C] break-all">
                                {prevFile.name || `Print_Document_v${previousPdfFiles.length - idx}.pdf`}
                              </p>
                              <span className="text-[10px] font-medium bg-gray-200/80 text-gray-600 px-1.5 py-0.5 rounded">
                                v{previousPdfFiles.length - idx}
                              </span>
                              {isPrevApproved && (
                                <span className="inline-flex items-center text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.2 rounded text-[10px] border border-emerald-200">
                                  <Check className="w-2.5 h-2.5 mr-0.5" /> Approved
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-[#777777] mt-0.5 flex-wrap">
                              {prevFile.created_at && (
                                <span>
                                  Uploaded:{" "}
                                  {new Date(
                                    prevFile.created_at,
                                  ).toLocaleString()}
                                </span>
                              )}
                              {prevFile.size && (
                                <span>Size: {formatFileSize(prevFile.size)}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons for Previous Version */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                          {userType === "admin" ? (
                            <div
                              key={`prev-admin-status-${fileKey}`}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[11px] font-semibold border select-none ${
                                isPrevApproved
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : "bg-amber-50 text-amber-700 border-amber-300"
                              }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center ${
                                  isPrevApproved
                                    ? "bg-emerald-600 text-white"
                                    : "border border-amber-400 bg-white"
                                }`}
                              >
                                {isPrevApproved && (
                                  <Check size={10} strokeWidth={3} />
                                )}
                              </div>
                              <span>
                                {isPrevApproved
                                  ? "Approved for Printing"
                                  : "Not Approved for Printing"}
                              </span>
                            </div>
                          ) : (
                            <button
                              key={`prev-agent-toggle-${fileKey}`}
                              type="button"
                              onClick={() => handleToggleApproval(prevFile)}
                              disabled={isTogglingApproval}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[11px] font-semibold border transition-all cursor-pointer ${
                                isPrevApproved
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                              }`}
                              title="Click to toggle Approved for Printing for this version"
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                                  isPrevApproved
                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                    : "border-gray-400 bg-white"
                                }`}
                              >
                                {isPrevApproved && (
                                  <Check size={10} strokeWidth={3} />
                                )}
                              </div>
                              <span>Approved for Printing</span>
                            </button>
                          )}

                          <Button
                            onClick={() => handleOpenPreview(prevFile)}
                            variant="outline"
                            size="sm"
                            className="h-[30px] px-2.5 text-xs rounded-[5px] border-gray-300 text-gray-700 hover:bg-white flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            Preview
                          </Button>

                          <Button
                            onClick={() => handleDownload(prevFile)}
                            disabled={downloadingFileUuid === (prevFile.uuid || "prev")}
                            variant="outline"
                            size="sm"
                            className="h-[30px] px-2.5 text-xs rounded-[5px] border-gray-300 text-gray-700 hover:bg-white flex items-center gap-1 cursor-pointer"
                          >
                            {downloadingFileUuid === (prevFile.uuid || "prev") ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-600" />
                            ) : (
                              <Download className="w-3.5 h-3.5 text-gray-600" />
                            )}
                            Download
                          </Button>

                          {userType === "admin" && (
                            <Button
                              onClick={() => handleDelete(prevFile)}
                              variant="outline"
                              size="sm"
                              className="h-[30px] px-2 text-xs rounded-[5px] border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 cursor-pointer"
                              title="Delete this version"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PDF Preview Modal Popup */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-5xl w-[92vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white">
          <DialogHeader className="px-6 py-4 border-b border-gray-200 flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-gray-900 break-all">
                  {selectedPreviewFile?.name ||
                    `${currentService?.name || "Print_Document"}.pdf`}
                </DialogTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  {copiesCount ? `${copiesCount} Copies • ` : ""}
                  {selectedPreviewFile?.size
                    ? formatFileSize(selectedPreviewFile.size)
                    : "PDF Document"}
                  {selectedPreviewFile?.uuid === currentPdf?.uuid
                    ? " • (Current Version)"
                    : " • (Previous Version)"}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* PDF Viewer Body */}
          <div className="flex-1 w-full h-full bg-gray-100 relative overflow-hidden flex items-center justify-center">
            {isPreviewLoading ? (
              <div key="pdf-loading" className="flex flex-col items-center justify-center gap-3 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-sm font-medium">Loading PDF preview...</p>
              </div>
            ) : previewBlobUrl ? (
              <iframe
                key={`pdf-frame-${selectedPreviewFile?.uuid || "preview"}`}
                src={`${previewBlobUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full border-0"
                title="PDF Preview"
              />
            ) : (
              <div key="pdf-fallback" className="flex flex-col items-center justify-center gap-2 text-gray-500 p-8 text-center">
                <FileText className="w-10 h-10 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">
                  Unable to display PDF preview directly
                </p>
                <Button
                  onClick={() => handleDownload(selectedPreviewFile)}
                  className="mt-2 bg-blue-600 text-white"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Download PDF
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex flex-row items-center justify-between shrink-0 sm:justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              {selectedPreviewFile && (
                userType === "admin" ? (
                  <div
                    key="modal-admin-status"
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-semibold border select-none ${
                      isSelectedPreviewApproved
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-amber-50 text-amber-700 border-amber-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center ${
                        isSelectedPreviewApproved
                          ? "bg-emerald-600 text-white"
                          : "border border-amber-400 bg-white"
                      }`}
                    >
                      {isSelectedPreviewApproved && (
                        <Check size={12} strokeWidth={3} />
                      )}
                    </div>
                    <span>
                      {isSelectedPreviewApproved
                        ? "Approved for Printing"
                        : "Not Approved for Printing"}
                    </span>
                  </div>
                ) : (
                  <button
                    key="modal-agent-toggle"
                    type="button"
                    onClick={() => handleToggleApproval(selectedPreviewFile)}
                    disabled={isTogglingApproval}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-semibold border transition-all cursor-pointer ${
                      isSelectedPreviewApproved
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                    title="Click to toggle Approved for Printing"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelectedPreviewApproved
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-gray-400 bg-white"
                      }`}
                    >
                      {isSelectedPreviewApproved && (
                        <Check size={12} strokeWidth={3} />
                      )}
                    </div>
                    <span>Approved for Printing</span>
                  </button>
                )
              )}
              <span className="text-xs text-gray-500 hidden sm:inline">
                {selectedPreviewFile?.created_at
                  ? `Uploaded on ${new Date(selectedPreviewFile.created_at).toLocaleDateString()}`
                  : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreviewModal(false)}
                className="h-9 px-4 text-gray-700 border-gray-300 cursor-pointer"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => handleDownload(selectedPreviewFile)}
                disabled={
                  downloadingFileUuid ===
                  (selectedPreviewFile?.uuid || "current")
                }
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer"
              >
                {downloadingFileUuid ===
                (selectedPreviewFile?.uuid || "current") ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download PDF
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrintServiceTab;
