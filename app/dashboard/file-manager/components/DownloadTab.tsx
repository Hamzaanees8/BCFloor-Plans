import React, { useMemo, useState, useCallback } from "react";
import { useFileManagerContext, Files } from "../FileManagerContext";
import { Button } from "@/components/ui/button";
import {
  Download,
  CheckCircle2,
  Loader2,
  PlayCircle,
  Lock,
  Receipt,
} from "lucide-react";
import { PdfPlaceholder } from "./OptimizedPreview";
import { toast } from "sonner";
import { useAppContext } from "@/app/context/AppContext";
import BulkDownloadSizeModal, { DownloadSize } from "./BulkDownloadSizeModal";
import DownloadModal, { ApiFile } from "./DownloadModal";
import SyncMlsModal from "./SyncMlsModal";
import { useGlobalDownload } from "@/context/GlobalDownloadContext";

import { Order } from "../../orders/page";
import {
  canDownloadFile,
  getBookingDownloadStatus,
  getDownloadBlockReason,
  isAdminOrVendorUser,
} from "../utils/filePermissions";
import { MediaDateBoundary } from "./FileManager";

type OrderServiceEntry = NonNullable<Order>["services"][0];

interface DownloadTabProps {
  orderData: Order | null;
  /** Booking-aware service groups passed from FileManager (key = service definition UUID) */
  groupedOrderServices?: Map<string, OrderServiceEntry[]>;
  onOpenInvoice?: (serviceName?: string, orderServiceUuid?: string) => void;
}

type SectionDescriptor = {
  key: string;
  serviceUuid: string;
  bookingIndex: number;
  bookingEntry: OrderServiceEntry | null;
  label: string;
  isActuallyPaid: boolean;
  isMediaReleased: boolean;
  isDownloadReady: boolean;
  isRefunded: boolean;
  boundary: MediaDateBoundary;
  files: Files[];
  hasAnyUploadedValidFiles: boolean;
  hasUnapprovedFiles: boolean;
  hasUploadedPhotos: boolean;
  hasUploadedVideos: boolean;
  hasUploadedFloorPlans: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

export const isVideoFile = (file: Files): boolean => {
  return (
    file.type?.toLowerCase() === "video" ||
    (file.service?.category?.name || "").toLowerCase().includes("video")
  );
};

export const isPdfUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  return clean.endsWith(".pdf");
};

export const isFloorPlanFile = (file: Files): boolean => {
  const sName = (file.service?.name || "").toLowerCase();
  const cName = (file.service?.category?.name || "").toLowerCase();
  const fType = (file.type || "").toLowerCase();
  const path = (file.file_path || "").toLowerCase();

  if (isVideoFile(file)) return false;

  return (
    sName.includes("floor") ||
    cName.includes("floor") ||
    fType === "floor_plan" ||
    fType === "floorplan" ||
    fType === "pdf" ||
    fType === "application/pdf" ||
    path.endsWith(".pdf") ||
    isPdfUrl(file.url)
  );
};

export const isPhotoFile = (file: Files): boolean => {
  return !isVideoFile(file) && !isFloorPlanFile(file);
};

const DownloadTab: React.FC<DownloadTabProps> = ({
  orderData,
  groupedOrderServices,
  onOpenInvoice,
}) => {
  const { filesData, tourSettings, tourDefaultSettings } =
    useFileManagerContext();
  const { userType } = useAppContext();
  const isLetterboxOn =
    tourSettings?.letterbox_correction ??
    tourDefaultSettings?.letterbox_correction ??
    true;
  const letterboxClass = isLetterboxOn ? "object-contain" : "object-cover";
  const { startDownload } = useGlobalDownload();
  const [sizeModal, setSizeModal] = useState<{
    isOpen: boolean;
    files: Files[];
    label: string;
  }>({
    isOpen: false,
    files: [],
    label: "",
  });
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [selectedImageUuids, setSelectedImageUuids] = useState<Set<string>>(
    new Set(),
  );
  const [isOpeningInvoice, setIsOpeningInvoice] = useState(false);

  const handleOpenInvoiceClick = async (
    serviceName?: string,
    orderServiceUuid?: string,
  ) => {
    if (!onOpenInvoice || isOpeningInvoice) return;
    setIsOpeningInvoice(true);
    try {
      await onOpenInvoice(serviceName, orderServiceUuid);
    } finally {
      setIsOpeningInvoice(false);
    }
  };

  // Helper to compute date boundary for a specific booking index within a group
  const computeBookingBoundary = useCallback(
    (group: OrderServiceEntry[], index: number): MediaDateBoundary => {
      if (!group || group.length <= 1) return { from: null, to: null };
      const from = index === 0 ? null : new Date(group[index].created_at);
      const to =
        index < group.length - 1 ? new Date(group[index + 1].created_at) : null;
      return { from, to };
    },
    [],
  );

  // Unified booking-aware analysis:
  // - Paid / media-released bookings with approved files populate `bookingSections`
  // - Unpaid bookings with uploaded media populate `unpaidSections` (without rendering thumbnails)
  const sectionAnalysis = useMemo(() => {
    if (!filesData?.files) {
      return {
        bookingSections: [] as SectionDescriptor[],
        unpaidSections: [] as SectionDescriptor[],
        unapprovedServiceNames: [] as string[],
        hasUnpaidPhoto: false,
        hasUnpaidVideo: false,
        hasUnpaidFloorPlan: false,
      };
    }

    const allSections: SectionDescriptor[] = [];

    if (groupedOrderServices && groupedOrderServices.size > 0) {
      groupedOrderServices.forEach((group, serviceUuid) => {
        group.forEach((booking, idx) => {
          const paymentStatus = getBookingDownloadStatus(booking, orderData);
          if (paymentStatus.isCancelled || paymentStatus.isRevoked) return;

          const boundary = computeBookingBoundary(group, idx);
          const label =
            group.length > 1
              ? `${booking.service.name} — Booking #${idx + 1}`
              : booking.service.name;

          allSections.push({
            key: `${serviceUuid}-${idx}`,
            serviceUuid,
            bookingIndex: idx,
            bookingEntry: booking,
            label,
            isActuallyPaid: paymentStatus.isActuallyPaid,
            isMediaReleased: paymentStatus.isMediaReleased,
            isDownloadReady: paymentStatus.isDownloadReady,
            isRefunded: paymentStatus.isRefunded,
            boundary,
            files: [],
            hasAnyUploadedValidFiles: false,
            hasUnapprovedFiles: false,
            hasUploadedPhotos: false,
            hasUploadedVideos: false,
            hasUploadedFloorPlans: false,
          });
        });
      });
    }

    const isStaff = isAdminOrVendorUser(userType);

    filesData.files.forEach((file) => {
      if (file.is_deleted || file.is_hidden || !file.service) return;

      const serviceName = file.service.name || "";
      const isForbiddenService =
        serviceName.toLowerCase().includes("3d tour") ||
        serviceName.toLowerCase().includes("matterport") ||
        serviceName.toLowerCase().includes("virtual tour");
      if (isForbiddenService) return;

      const isPhoto = isPhotoFile(file);
      const isVideo = isVideoFile(file);
      const isFloorPlan = isFloorPlanFile(file);
      if (!isPhoto && !isVideo && !isFloorPlan) return;

      const fileDate = new Date(file.created_at).getTime();

      let targetSection: SectionDescriptor | undefined;
      for (const section of allSections) {
        if (section.serviceUuid !== file.service.uuid) continue;
        const { from, to } = section.boundary;
        const afterFrom = from ? fileDate >= from.getTime() : true;
        const beforeTo = to ? fileDate < to.getTime() : true;
        if (afterFrom && beforeTo) {
          targetSection = section;
          break;
        }
      }

      if (!targetSection) {
        targetSection = allSections.find(
          (s) => s.serviceUuid === file.service?.uuid,
        );
      }

      if (!targetSection) {
        if (userType === "vendor") return;

        const matchedService = orderData?.services?.find(
          (s: any) =>
            s.service?.uuid === file.service?.uuid ||
            s.uuid === file.service?.uuid ||
            s.service_id === file.service?.id,
        );

        const paymentStatus = getBookingDownloadStatus(
          matchedService,
          orderData,
        );
        if (paymentStatus.isCancelled || paymentStatus.isRevoked) return;

        targetSection = {
          key: file.service.uuid,
          serviceUuid: file.service.uuid,
          bookingIndex: 0,
          bookingEntry: matchedService || null,
          label: file.service.name,
          isActuallyPaid: paymentStatus.isActuallyPaid,
          isMediaReleased: paymentStatus.isMediaReleased,
          isDownloadReady: paymentStatus.isDownloadReady,
          isRefunded: paymentStatus.isRefunded,
          boundary: { from: null, to: null },
          files: [],
          hasAnyUploadedValidFiles: false,
          hasUnapprovedFiles: false,
          hasUploadedPhotos: false,
          hasUploadedVideos: false,
          hasUploadedFloorPlans: false,
        };
        allSections.push(targetSection);
      }

      targetSection.hasAnyUploadedValidFiles = true;
      if (isPhoto) targetSection.hasUploadedPhotos = true;
      if (isVideo) targetSection.hasUploadedVideos = true;
      if (isFloorPlan) targetSection.hasUploadedFloorPlans = true;

      // Strict payment gate: do not surface unpaid services or thumbnails in the download area
      if (!targetSection.isDownloadReady) {
        return;
      }

      if (!isStaff && file.is_show === false) {
        return;
      }

      const isApproved = isStaff
        ? true
        : targetSection.isMediaReleased
          ? true
          : isFloorPlan
            ? Boolean(file.is_complimentary || file.is_admin_approved !== false)
            : Boolean(file.is_agent_approved || file.is_complimentary);

      if (!isApproved) {
        targetSection.hasUnapprovedFiles = true;
        return;
      }

      targetSection.files.push(file);
    });

    const bookingSections = allSections.filter(
      (s) => s.isDownloadReady && s.files.length > 0,
    );
    const unpaidSections = allSections.filter(
      (s) =>
        !s.isDownloadReady && !s.isRefunded && s.hasAnyUploadedValidFiles,
    );
    const unapprovedServiceNames = Array.from(
      new Set(
        allSections
          .filter(
            (s) =>
              s.isDownloadReady &&
              s.hasUnapprovedFiles &&
              s.files.length === 0,
          )
          .map((s) => s.label)
          .filter(Boolean),
      ),
    );

    return {
      bookingSections,
      unpaidSections,
      unapprovedServiceNames,
      hasUnpaidPhoto: unpaidSections.some((s) => s.hasUploadedPhotos),
      hasUnpaidVideo: unpaidSections.some((s) => s.hasUploadedVideos),
      hasUnpaidFloorPlan: unpaidSections.some((s) => s.hasUploadedFloorPlans),
    };
  }, [
    filesData?.files,
    groupedOrderServices,
    userType,
    orderData,
    computeBookingBoundary,
  ]);

  const {
    bookingSections,
    unpaidSections,
    unapprovedServiceNames,
    hasUnpaidPhoto,
    hasUnpaidVideo,
    hasUnpaidFloorPlan,
  } = sectionAnalysis;

  // All approved files (derived from paid / released bookingSections)
  const allApprovedPhotos = useMemo(() => {
    return bookingSections.flatMap((s) =>
      s.files.filter((f) => isPhotoFile(f)),
    );
  }, [bookingSections]);

  const allApprovedVideos = useMemo(() => {
    return bookingSections.flatMap((s) =>
      s.files.filter((f) => isVideoFile(f)),
    );
  }, [bookingSections]);

  const allApprovedFloorPlans = useMemo(() => {
    return bookingSections.flatMap((s) =>
      s.files.filter((f) => isFloorPlanFile(f)),
    );
  }, [bookingSections]);

  const allApprovedFiles = useMemo(() => {
    return [
      ...allApprovedPhotos,
      ...allApprovedVideos,
      ...allApprovedFloorPlans,
    ];
  }, [allApprovedPhotos, allApprovedVideos, allApprovedFloorPlans]);

  // Flat list for per-service download actions (paid / released only)
  const groupedServices = useMemo(
    () =>
      bookingSections.map((s) => ({
        key: s.key,
        uuid: s.serviceUuid,
        name: s.label,
        files: s.files,
        isActuallyPaid: s.isActuallyPaid,
        isMediaReleased: s.isMediaReleased,
        bookingUuid: s.bookingEntry?.uuid,
      })),
    [bookingSections],
  );

  // Strictly payment-verified downloadable files using each section's exact booking entry
  const paidPhotos = useMemo(() => {
    return bookingSections.flatMap((section) =>
      section.files.filter(
        (p) =>
          isPhotoFile(p) &&
          canDownloadFile({
            file: p,
            currentService: section.bookingEntry,
            orderData,
            userType: "agent",
          }),
      ),
    );
  }, [bookingSections, orderData]);

  const paidVideos = useMemo(() => {
    return bookingSections.flatMap((section) =>
      section.files.filter(
        (p) =>
          isVideoFile(p) &&
          canDownloadFile({
            file: p,
            currentService: section.bookingEntry,
            orderData,
            userType: "agent",
          }),
      ),
    );
  }, [bookingSections, orderData]);

  const paidFloorPlans = useMemo(() => {
    return bookingSections.flatMap((section) =>
      section.files.filter(
        (p) =>
          isFloorPlanFile(p) &&
          canDownloadFile({
            file: p,
            currentService: section.bookingEntry,
            orderData,
            userType: "agent",
          }),
      ),
    );
  }, [bookingSections, orderData]);

  // Selected files filter
  const selectedFiles = useMemo(() => {
    return allApprovedFiles.filter((file) => selectedImageUuids.has(file.uuid));
  }, [allApprovedFiles, selectedImageUuids]);

  // Filtered selected files (for manual download)
  const selectedPaidFiles = useMemo(() => {
    return selectedFiles
      .filter((file) => {
        const section = bookingSections.find((s) =>
          s.files.some((f) => f.uuid === file.uuid),
        );
        return canDownloadFile({
          file,
          currentService: section?.bookingEntry,
          orderData,
          userType: "agent",
        });
      })
      .map((file) => ({
        ...file,
        is_paid: true,
      }));
  }, [selectedFiles, bookingSections, orderData]);

  const toggleImageSelection = (uuid: string) => {
    const section = bookingSections.find((s) =>
      s.files.some((f) => f.uuid === uuid),
    );
    const file = section?.files.find((f) => f.uuid === uuid);

    if (
      !file ||
      !canDownloadFile({
        file,
        currentService: section?.bookingEntry,
        orderData,
        userType: "agent",
      })
    ) {
      const reason = file
        ? getDownloadBlockReason({
            file,
            currentService: section?.bookingEntry,
            orderData,
            userType: "agent",
          })
        : "File not found";
      toast.error(reason || "Cannot select this file for download");
      return;
    }

    setSelectedImageUuids((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  };

  const handleDownload = async (
    files: Files[],
    label: string,
    size: DownloadSize = "original",
  ) => {
    setSizeModal((prev) => ({ ...prev, isOpen: false }));

    try {
      const payload: { uuid: string; size?: DownloadSize }[] = files.map(
        (f) => ({
          uuid: f.uuid,
          size,
        }),
      );

      startDownload(payload, label);
    } catch (err) {
      console.error("Download error:", err);
      toast.error("An unexpected error occurred.");
    }
  };

  const openSizeModal = (files: Files[], label: string) => {
    setSizeModal({ isOpen: true, files, label });
  };

  const totalFilesCount = useMemo(() => {
    return bookingSections.reduce((acc, s) => acc + s.files.length, 0);
  }, [bookingSections]);

  const [visibleCount, setVisibleCount] = useState(30);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const visibleSections = useMemo(() => {
    let currentCount = 0;
    return bookingSections
      .map((section) => {
        if (currentCount >= visibleCount) return { ...section, files: [] };
        const remaining = visibleCount - currentCount;
        const filesToShow = section.files.slice(0, remaining);
        currentCount += filesToShow.length;
        return { ...section, files: filesToShow };
      })
      .filter((s) => s.files.length > 0);
  }, [bookingSections, visibleCount]);

  const handleShowMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 30);
      setIsLoadingMore(false);
    }, 500);
  };

  if (!filesData || !orderData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 font-alexandria">
      {/* Buttons Row 1: Global Actions */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Button
          onClick={() => {
            if (paidPhotos.length === 0) return;
            openSizeModal(paidPhotos, "All Photos");
          }}
          disabled={paidPhotos.length === 0}
          title={
            paidPhotos.length === 0
              ? hasUnpaidPhoto
                ? "Service not paid yet — photos are not ready to download"
                : "No photos available to download"
              : ""
          }
          className={`px-4 h-[32px] md:h-[38px] border-[1px] ${userType}-border text-[12px] md:text-[13px] font-[500] text-white flex gap-[5px] justify-center items-center ${userType}-bg hover:brightness-110 rounded-[6px] transition-all ${paidPhotos.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Download className="h-3.5 w-3.5" />
          Download all photos
        </Button>

        <Button
          onClick={() => {
            if (paidVideos.length === 0) return;
            handleDownload(paidVideos, "All Videos", "original");
          }}
          disabled={paidVideos.length === 0}
          title={
            paidVideos.length === 0
              ? hasUnpaidVideo
                ? "Service not paid yet — videos are not ready to download"
                : "No videos available to download"
              : ""
          }
          className={`px-4 h-[32px] md:h-[38px] border-[1px] ${userType}-border text-[12px] md:text-[13px] font-[500] text-white flex gap-[5px] justify-center items-center ${userType}-bg hover:brightness-110 rounded-[6px] transition-all ${paidVideos.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Download className="h-3.5 w-3.5" />
          Download all videos
        </Button>

        <Button
          onClick={() => {
            if (paidFloorPlans.length === 0) return;
            handleDownload(paidFloorPlans, "All Floor Plans", "original");
          }}
          disabled={paidFloorPlans.length === 0}
          title={
            paidFloorPlans.length === 0
              ? hasUnpaidFloorPlan
                ? "Service not paid yet — floor plans are not ready to download"
                : "No floor plans available to download"
              : ""
          }
          className={`px-4 h-[32px] md:h-[38px] border-[1px] ${userType}-border text-[12px] md:text-[13px] font-[500] text-white flex gap-[5px] justify-center items-center ${userType}-bg hover:brightness-110 rounded-[6px] transition-all ${paidFloorPlans.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Download className="h-3.5 w-3.5" />
          Download all floor plans
        </Button>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              if (selectedFiles.length === 0) {
                toast.warning("Please select at least one file first.");
                return;
              }
              setIsManualModalOpen(true);
            }}
            disabled={
              selectedFiles.length === 0 || allApprovedFiles.length === 0
            }
            className={`px-4 h-[32px] md:h-[38px] border-[1px] ${selectedFiles.length === 0 || allApprovedFiles.length === 0 ? "border-gray-300 text-gray-500 bg-gray-100 opacity-50 cursor-not-allowed" : `${userType}-border ${userType}-text hover:text-[#fff] hover-${userType}-bg ${userType}-button`} text-[12px] md:text-[13px] font-[500] flex gap-[5px] justify-center items-center rounded-[6px] transition-colors`}
            style={
              selectedFiles.length === 0 || allApprovedFiles.length === 0
                ? {}
                : { backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }
            }
          >
            <Download className="h-3.5 w-3.5" />
            Download manually{" "}
            {selectedFiles.length > 0 && `(${selectedFiles.length})`}
          </Button>
          <span className="text-gray-500 text-sm hidden md:inline">
            Click a file to select it for downloading manually.
          </span>
        </div>

        {/* Sync MLS — only visible to agents and admins */}
        {(userType === "agent" || userType === "admin") && (
          <Button
            onClick={() => setIsSyncModalOpen(true)}
            disabled={paidPhotos.length === 0}
            title={
              paidPhotos.length === 0
                ? hasUnpaidPhoto
                  ? "Service not paid yet — photos are not ready to sync"
                  : "No photos available to sync"
                : ""
            }
            className={`px-4 h-[32px] md:h-[38px] border-[1px] ${paidPhotos.length === 0 ? "border-gray-300 text-gray-500 bg-gray-100 opacity-50 cursor-not-allowed" : `${userType}-border ${userType}-text hover:text-[#fff] hover-${userType}-bg ${userType}-button`} text-[12px] md:text-[13px] font-[500] flex gap-[5px] justify-center items-center rounded-[6px] transition-colors`}
            style={
              paidPhotos.length === 0
                ? {}
                : { backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }
            }
          >
            Sync MLS
          </Button>
        )}

        {selectedFiles.length > 0 && (
          <Button
            variant="ghost"
            onClick={() => setSelectedImageUuids(new Set())}
            className="text-gray-500 hover:text-red-500 font-medium text-[12px] transition-colors"
          >
            Clear Selection
          </Button>
        )}
      </div>

      {/* Per-service download buttons (paid / released services only) */}
      {groupedServices.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-8">
          {groupedServices.map((service) => {
            const servicePhotos = service.files.filter((f) => isPhotoFile(f));
            const serviceVideos = service.files.filter((f) => isVideoFile(f));
            const serviceFloorPlans = service.files.filter((f) =>
              isFloorPlanFile(f),
            );

            return (
              <React.Fragment key={service.key}>
                {servicePhotos.length > 0 && (
                  <Button
                    onClick={() => openSizeModal(servicePhotos, service.name)}
                    className={`px-4 h-[32px] md:h-[38px] border-[1px] ${userType}-border text-[12px] md:text-[13px] font-[500] ${userType}-text flex gap-[5px] justify-center items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button rounded-[6px] transition-colors`}
                    style={{
                      backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download {service.name} photos ({servicePhotos.length})
                  </Button>
                )}
                {serviceVideos.length > 0 && (
                  <Button
                    onClick={() =>
                      handleDownload(serviceVideos, service.name, "original")
                    }
                    className={`px-4 h-[32px] md:h-[38px] border-[1px] ${userType}-border text-[12px] md:text-[13px] font-[500] ${userType}-text flex gap-[5px] justify-center items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button rounded-[6px] transition-colors`}
                    style={{
                      backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download {service.name} videos ({serviceVideos.length})
                  </Button>
                )}
                {serviceFloorPlans.length > 0 && (
                  <Button
                    onClick={() =>
                      handleDownload(
                        serviceFloorPlans,
                        service.name,
                        "original",
                      )
                    }
                    className={`px-4 h-[32px] md:h-[38px] border-[1px] ${userType}-border text-[12px] md:text-[13px] font-[500] ${userType}-text flex gap-[5px] justify-center items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button rounded-[6px] transition-colors`}
                    style={{
                      backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download {service.name}{" "}
                    {service.name.toLowerCase().includes("floor")
                      ? ""
                      : "floor plans "}
                    ({serviceFloorPlans.length})
                  </Button>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Booking-aware grouped file grid */}
      <div className="space-y-12">
        {visibleSections.length > 0 ? (
          <div className="space-y-12">
            {visibleSections.map((section) => {
              const sectionPhotos = section.files.filter((f) => isPhotoFile(f));
              const sectionVideos = section.files.filter((f) => isVideoFile(f));
              const sectionFloorPlans = section.files.filter((f) =>
                isFloorPlanFile(f),
              );

              return (
                <div key={section.key} className="space-y-4">
                  {/* Section header with label + status badge + download button */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3
                      className={`text-xl font-semibold ${userType}-text border-l-4 border-current pl-3`}
                    >
                      {section.label}
                    </h3>
                    <div className="flex items-center gap-2">
                      {/* Paid / Media Released badge */}
                      {userType !== "vendor" &&
                        (section.isActuallyPaid ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 bg-[#6BAE41] text-white">
                            PAID
                          </span>
                        ) : section.isMediaReleased ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 bg-emerald-600 text-white">
                            MEDIA RELEASED
                          </span>
                        ) : null)}
                      {/* Per-section download buttons */}
                      {sectionPhotos.length > 0 && (
                        <Button
                          onClick={() =>
                            openSizeModal(sectionPhotos, section.label)
                          }
                          className={`px-3 h-[30px] border-[1px] ${userType}-border text-[11px] font-[500] ${userType}-text flex gap-[4px] justify-center items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button rounded-[6px] transition-colors`}
                          style={{
                            backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                          }}
                        >
                          <Download className="h-3 w-3" />
                          Photos ({sectionPhotos.length})
                        </Button>
                      )}
                      {sectionVideos.length > 0 && (
                        <Button
                          onClick={() =>
                            handleDownload(
                              sectionVideos,
                              section.label,
                              "original",
                            )
                          }
                          className={`px-3 h-[30px] border-[1px] ${userType}-border text-[11px] font-[500] ${userType}-text flex gap-[4px] justify-center items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button rounded-[6px] transition-colors`}
                          style={{
                            backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                          }}
                        >
                          <Download className="h-3 w-3" />
                          Videos ({sectionVideos.length})
                        </Button>
                      )}
                      {sectionFloorPlans.length > 0 && (
                        <Button
                          onClick={() =>
                            handleDownload(
                              sectionFloorPlans,
                              section.label,
                              "original",
                            )
                          }
                          className={`px-3 h-[30px] border-[1px] ${userType}-border text-[11px] font-[500] ${userType}-text flex gap-[4px] justify-center items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button rounded-[6px] transition-colors`}
                          style={{
                            backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                          }}
                        >
                          <Download className="h-3 w-3" />
                          Floor Plans ({sectionFloorPlans.length})
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    {section.files.map((file) => {
                      const isSelected = selectedImageUuids.has(file.uuid);
                      const isVideo = isVideoFile(file);
                      const isPdf =
                        file.file_path?.toLowerCase().endsWith(".pdf") ||
                        file.type === "pdf" ||
                        file.type === "application/pdf" ||
                        isPdfUrl(file.url) ||
                        isPdfUrl(file.file_path);

                      // Raster image URL if an image variant exists (that is NOT a .pdf URL)
                      const rasterImageUrl = (() => {
                        if (file.thumbnail_url && !isPdfUrl(file.thumbnail_url))
                          return file.thumbnail_url;
                        if (
                          file.variant_urls?.thumb &&
                          !isPdfUrl(file.variant_urls.thumb)
                        )
                          return file.variant_urls.thumb;
                        if (
                          file.variant_urls?.popup &&
                          !isPdfUrl(file.variant_urls.popup)
                        )
                          return file.variant_urls.popup;
                        if (
                          file.variant_urls?.landing &&
                          !isPdfUrl(file.variant_urls.landing)
                        )
                          return file.variant_urls.landing;
                        if (!isPdf && file.url && !isPdfUrl(file.url))
                          return file.url;
                        return null;
                      })();

                      // PDF URL if it's a PDF
                      const pdfDocUrl = isPdf
                        ? (() => {
                            const raw =
                              (file.url && isPdfUrl(file.url)
                                ? file.url
                                : null) ||
                              (file.file_path && isPdfUrl(file.file_path)
                                ? file.file_path.startsWith("http")
                                  ? file.file_path
                                  : `${API_URL}/${file.file_path}`
                                : null) ||
                              (file.thumbnail_url &&
                              isPdfUrl(file.thumbnail_url)
                                ? file.thumbnail_url
                                : null) ||
                              (file.variant_urls?.popup &&
                              isPdfUrl(file.variant_urls.popup)
                                ? file.variant_urls.popup
                                : null) ||
                              (file.variant_urls?.thumb &&
                              isPdfUrl(file.variant_urls.thumb)
                                ? file.variant_urls.thumb
                                : null) ||
                              file.url ||
                              (file.file_path
                                ? file.file_path.startsWith("http")
                                  ? file.file_path
                                  : `${API_URL}/${file.file_path}`
                                : null);
                            return raw;
                          })()
                        : null;

                      const cleanPdfUrl = pdfDocUrl
                        ? pdfDocUrl.split("#")[0]
                        : null;

                      return (
                        <div
                          key={file.uuid}
                          onClick={() => toggleImageSelection(file.uuid)}
                          className={`relative group aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border-2 transition-all cursor-pointer select-none
                                                    ${isSelected ? `${userType}-border shadow-md` : "border-gray-200 hover:border-gray-300"}`}
                        >
                          <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                            {file.is_processing ? (
                              <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                                <p className="text-gray-500 font-medium text-sm">
                                  Processing...
                                </p>
                              </div>
                            ) : isVideo ? (
                              file.variant_urls?.thumb ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={file.variant_urls.thumb}
                                  alt={
                                    file.group?.trim()
                                      ? file.group
                                      : file.name || (file as any).file_name
                                  }
                                  title={
                                    file.group?.trim()
                                      ? file.group
                                      : file.name || (file as any).file_name
                                  }
                                  className={`w-full h-full ${letterboxClass} transition-transform group-hover:scale-105 ${isSelected ? "opacity-90" : ""}`}
                                />
                              ) : (
                                <video
                                  src={`${file.url || `${API_URL}/${file.file_path}`}#t=0.1`}
                                  preload="metadata"
                                  muted
                                  playsInline
                                  title={
                                    file.group?.trim()
                                      ? file.group
                                      : file.name || (file as any).file_name
                                  }
                                  className={`absolute inset-0 w-full h-full ${letterboxClass} transition-transform group-hover:scale-105 ${isSelected ? "opacity-90" : ""}`}
                                />
                              )
                            ) : isPdf ? (
                              rasterImageUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={rasterImageUrl}
                                  alt={
                                    file.group?.trim()
                                      ? file.group
                                      : file.name || (file as any).file_name
                                  }
                                  title={
                                    file.group?.trim()
                                      ? file.group
                                      : file.name || (file as any).file_name
                                  }
                                  className={`w-full h-full ${letterboxClass} transition-transform group-hover:scale-105 ${isSelected ? "opacity-90" : ""}`}
                                />
                              ) : !cleanPdfUrl ? (
                                <PdfPlaceholder
                                  className="w-full h-full object-contain"
                                  message="Preview not available"
                                />
                              ) : isLetterboxOn ? (
                                /* Letterbox Correction ON: Show whole PDF, extra space filled with black like other media */
                                <div className="relative h-full aspect-[8.5/11] max-w-full bg-white flex items-center justify-center overflow-hidden shadow-sm">
                                  <iframe
                                    src={`${cleanPdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                                    className="w-full h-full pointer-events-none border-0 bg-white"
                                    tabIndex={-1}
                                    scrolling="no"
                                    title={file.name || "PDF Document"}
                                  />
                                  <div className="absolute inset-0 bg-transparent" />
                                </div>
                              ) : (
                                /* Letterbox Correction OFF: Fill thumbnail card like other media */
                                <div className="relative w-full h-full bg-white overflow-hidden">
                                  <iframe
                                    src={`${cleanPdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                    className="w-full h-full pointer-events-none border-0 scale-[1.14] origin-top bg-white"
                                    tabIndex={-1}
                                    scrolling="no"
                                    title={file.name || "PDF Document"}
                                  />
                                  <div className="absolute inset-0 bg-transparent" />
                                </div>
                              )
                            ) : (
                              (() => {
                                const displayImageUrl =
                                  rasterImageUrl ||
                                  (file.url && !isPdfUrl(file.url) ? file.url : null) ||
                                  (file.file_path && !isPdfUrl(file.file_path)
                                    ? file.file_path.startsWith("http")
                                      ? file.file_path
                                      : `${API_URL}/${file.file_path}`
                                    : null);

                                return displayImageUrl ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={displayImageUrl}
                                    alt={
                                      file.group?.trim()
                                        ? file.group
                                        : file.name || (file as any).file_name
                                    }
                                    title={
                                      file.group?.trim()
                                        ? file.group
                                        : file.name || (file as any).file_name
                                    }
                                    className={`w-full h-full ${letterboxClass} transition-transform group-hover:scale-105 ${isSelected ? "opacity-90" : ""}`}
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 p-2">
                                    <span className="text-xs font-medium text-center">
                                      Preview not available
                                    </span>
                                  </div>
                                );
                              })()
                            )}
                          </div>
                          {isPdf && (
                            <div className="absolute top-2 left-2 z-10 bg-red-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider pointer-events-none">
                              PDF
                            </div>
                          )}
                          {isSelected && (
                            <div
                              className={`absolute top-2 right-2 z-10 ${userType}-text bg-white rounded-full shadow-sm`}
                            >
                              <CheckCircle2 className="w-6 h-6 shadow-sm" />
                            </div>
                          )}
                          {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none">
                              <PlayCircle className="w-12 h-12 text-white/90 drop-shadow-md group-hover:scale-110 transition-transform duration-300 fill-black/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pointer-events-none">
                            <p className="text-white text-xs truncate font-medium">
                              {file.group?.trim()
                                ? file.group
                                : file.name || (file as any).file_name}
                            </p>
                            <p className="text-gray-300 text-[10px] truncate">
                              {file.service?.name}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {visibleCount < totalFilesCount && (
              <div className="flex justify-center pt-8">
                <Button
                  onClick={handleShowMore}
                  disabled={isLoadingMore}
                  className={`px-8 h-[40px] border-[1px] ${userType}-border text-[14px] font-[500] ${userType}-text flex gap-[8px] justify-center items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button rounded-[8px] transition-all shadow-sm ${isLoadingMore ? "opacity-70 cursor-wait" : ""}`}
                  style={{
                    backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                  }}
                >
                  {isLoadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {isLoadingMore ? "Loading..." : "Show More"}
                </Button>
              </div>
            )}

            {unpaidSections.length > 0 && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 text-sm text-amber-900">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    Media for{" "}
                    <span className="font-semibold">
                      {unpaidSections.map((s) => s.label).join(", ")}
                    </span>{" "}
                    is not yet ready to be downloaded. Files will appear here
                    once payment is completed.
                  </p>
                </div>
                {onOpenInvoice && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isOpeningInvoice}
                    onClick={() => handleOpenInvoiceClick()}
                    className="h-8 px-3 text-xs font-medium border-amber-300 bg-white text-amber-900 hover:bg-amber-100 shrink-0 inline-flex items-center gap-1.5"
                  >
                    {isOpeningInvoice ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Receipt className="w-3.5 h-3.5" />
                    )}
                    View Invoice
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-16 text-center">
            {unpaidSections.length > 0 ? (
              <div className="max-w-lg mx-auto bg-white border border-amber-200 rounded-xl p-6 sm:p-8 shadow-sm text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-gray-900">
                    Media Not Yet Ready for Download
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Media for{" "}
                    <span className="font-semibold text-gray-800">
                      {unpaidSections.map((s) => s.label).join(", ")}
                    </span>{" "}
                    is not yet ready to be downloaded because payment has not
                    been completed.
                  </p>
                  <p className="text-xs text-gray-500">
                    Once payment is completed or media is released, your files
                    will appear here ready for download.
                  </p>
                  {unapprovedServiceNames.length > 0 && (
                    <p className="text-xs text-gray-500 pt-1">
                      Media for {unapprovedServiceNames.join(", ")} also
                      requires approval before download.
                    </p>
                  )}
                </div>
                {onOpenInvoice && (
                  <div className="pt-1">
                    <Button
                      type="button"
                      disabled={isOpeningInvoice}
                      onClick={() => handleOpenInvoiceClick()}
                      className={`px-5 h-9 text-sm font-medium text-white rounded-[6px] inline-flex items-center gap-2 ${userType}-bg hover:brightness-110`}
                    >
                      {isOpeningInvoice ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Receipt className="w-4 h-4" />
                      )}
                      View Invoice
                    </Button>
                  </div>
                )}
              </div>
            ) : unapprovedServiceNames.length > 0 ? (
              <div className="flex flex-col items-center gap-2 text-gray-600">
                <p className="text-lg font-medium text-gray-800">
                  Media Requires Approval
                </p>
                <p className="text-sm max-w-md">
                  You have media available for{" "}
                  <span className="font-semibold text-gray-800">
                    {unapprovedServiceNames.join(", ")}
                  </span>
                  , but it has not been approved yet.
                </p>
                <p className="text-sm max-w-md">
                  Please review and approve your media to make it available for
                  download.
                </p>
              </div>
            ) : (
              <p className="text-gray-500">No media available to download.</p>
            )}
          </div>
        )}
      </div>

      <BulkDownloadSizeModal
        isOpen={sizeModal.isOpen}
        onClose={() => setSizeModal((prev) => ({ ...prev, isOpen: false }))}
        onSelectSize={(size) =>
          handleDownload(sizeModal.files, sizeModal.label, size)
        }
        title={`Select Quality for ${sizeModal.label}`}
      />

      <DownloadModal
        open={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setSelectedImageUuids(new Set());
        }}
        apiFiles={selectedPaidFiles as unknown as ApiFile[]}
      />

      {/* Sync Modal only shows paid/approved files regardless of user role */}
      <SyncMlsModal
        open={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        apiFiles={paidPhotos as unknown as ApiFile[]}
        orderData={orderData}
        tourUuid={filesData?.uuid}
      />
    </div>
  );
};

export default DownloadTab;
