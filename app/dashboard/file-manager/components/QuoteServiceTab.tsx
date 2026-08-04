"use client";

import React, { useState, useRef } from "react";
import { useFileManagerContext, Files } from "../FileManagerContext";
import { useAppContext } from "@/app/context/AppContext";
import { Order } from "../../orders/page";
import { Services } from "../../services/page";
import { DownloadFile } from "../fileManager";
import { Button } from "@/components/ui/button";
import { FileText, Download, Trash2, UploadCloud, Lock } from "lucide-react";
import { toast } from "sonner";
import { useGlobalFileUpload } from "@/context/GlobalFileUploadContext";

interface QuoteServiceTabProps {
  orderData: Order | null;
  currentService: Services | undefined;
  currentBookedService: any;
  onOpenInvoice?: (serviceName?: string, orderServiceUuid?: string) => void;
  onSave?: (overrideChangedFiles?: Files[]) => Promise<void>;
}

const QuoteServiceTab: React.FC<QuoteServiceTabProps> = ({
  orderData,
  currentService,
  currentBookedService,
  onOpenInvoice,
  onSave,
}) => {
  const { userType } = useAppContext();
  const { filesData, setFilesData, setChangedFileUuids } = useFileManagerContext();
  const { startUpload } = useGlobalFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Match files for this specific service
  const serviceId = currentService?.id || currentBookedService?.service_id || currentBookedService?.service?.id;
  const serviceUuid = currentService?.uuid || currentBookedService?.service?.uuid || currentBookedService?.service_uuid || currentBookedService?.uuid;

  const quoteFile = filesData?.files?.find(
    (f: any) =>
      !f.is_deleted &&
      ((serviceUuid && (f.service?.uuid === serviceUuid || f.service_id === serviceUuid)) ||
        (serviceId && (Number(f.service_id) === Number(serviceId) || Number(f.service?.id) === Number(serviceId))))
  );

  // Price & Payment checks
  const rawPrice = currentBookedService?.option?.amount || currentBookedService?.amount || 0;
  const price = parseFloat(rawPrice.toString()) || 0;
  const isPaid =
    orderData?.payment_status === "PAID" ||
    currentBookedService?.payment_status === "PAID";

  const isFree = price === 0;
  const hasAccess = userType === "admin" || userType === "vendor" || isFree || isPaid;

  // Handle Upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const file = selectedFiles[0];
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
      });

      if (response && onSave) {
        await onSave();
        toast.success("Quote document uploaded successfully");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload quote document");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!quoteFile) return;
    if (!confirm("Are you sure you want to delete this quote report?")) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // Mark file as deleted locally and invoke save
    const updatedFile = { ...quoteFile, is_deleted: true };

    setFilesData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        files: prev.files.map((f) => (f.uuid === quoteFile.uuid ? updatedFile : f)),
      };
    });

    setChangedFileUuids((prev) => new Set(prev).add(quoteFile.uuid));

    if (onSave) {
      await onSave([updatedFile as unknown as Files]);
      toast.success("Quote document deleted");
    }
  };

  // Handle Download
  const handleDownload = async () => {
    if (!quoteFile) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    setIsDownloading(true);
    try {
      if (quoteFile.url) {
        window.open(quoteFile.url, "_blank");
      } else {
        const response = await DownloadFile(token, quoteFile.uuid);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = quoteFile.name || "Quote_Report.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to download file");
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full font-alexandria py-8 px-4 md:px-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-[12px] border border-[#E4E4E4] p-6 shadow-sm">
        <h3 className="text-[18px] font-[600] text-[#1C1C1C] mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Quote / Report Document
        </h3>
        <p className="text-[13px] text-[#666666] mb-6">
          View and download the quote document for this service.
        </p>

        {!hasAccess ? (
          /* Locked State for Agent/Customer when unpaid and price > 0 */
          <div className="flex flex-col items-center justify-center p-8 bg-amber-50 border border-amber-200 rounded-[8px] text-center">
            <Lock className="w-10 h-10 text-amber-600 mb-3" />
            <h4 className="text-[16px] font-[600] text-amber-900 mb-1">
              Payment Required
            </h4>
            <p className="text-[13px] text-amber-700 max-w-md mb-4">
              This quote document is locked. Payment of ${price.toFixed(2)} is required to view and download the file.
            </p>
            {onOpenInvoice && (
              <Button
                onClick={() => onOpenInvoice(currentBookedService?.service?.name, currentBookedService?.uuid)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-[500] h-[38px] px-6 rounded-[6px]"
              >
                Pay Now
              </Button>
            )}
          </div>
        ) : (
          /* Unlocked State */
          <div className="space-y-6">
            {/* Upload Area for Admin */}
            {userType === "admin" && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-blue-50/50 rounded-[8px] p-8 flex flex-col items-center justify-center cursor-pointer transition-colors"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                />
                <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                <p className="text-[14px] font-[500] text-gray-700">
                  {isUploading ? "Uploading..." : quoteFile ? "Click to replace quote file" : "Click to upload quote file"}
                </p>
                <p className="text-[12px] text-gray-500 mt-1">
                  Supports PDF and document formats
                </p>
              </div>
            )}

            {/* File Display & Download Area */}
            {quoteFile ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#F9F9F9] border border-[#E4E4E4] rounded-[8px] gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-[8px]">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[14px] font-[600] text-[#1C1C1C] break-all">
                      {quoteFile.name || "Quote Report"}
                    </p>
                    <div className="flex items-center gap-3 text-[12px] text-[#666666] mt-0.5">
                      {quoteFile.created_at && (
                        <span>
                          Uploaded: {new Date(quoteFile.created_at).toLocaleDateString()}
                        </span>
                      )}
                      {quoteFile.size && (
                        <span>Size: {formatFileSize(quoteFile.size)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-[500] h-[36px] px-4 rounded-[6px] text-[13px]"
                  >
                    <Download className="w-4 h-4" />
                    {isDownloading ? "Downloading..." : "Download"}
                  </Button>

                  {userType === "admin" && (
                    <Button
                      variant="outline"
                      onClick={handleDelete}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 h-[36px] px-3 rounded-[6px]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              userType !== "admin" && (
                <div className="text-center py-10 text-gray-500 italic">
                  No quote report file has been uploaded by the admin yet.
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteServiceTab;
