"use client";
import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useFileManagerContext, DroppedMarker } from "../FileManagerContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CameraIcon } from "@/components/Icons";
import { X, ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { DeleteSnapshot, GetFilesData } from "../file-manager";
import { useGlobalFileUpload } from "@/context/GlobalFileUploadContext";
import { useAppContext } from "@/app/context/AppContext";
import { OptimizedImagePreview, PdfPlaceholder } from "./OptimizedPreview";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TourFloorPlansProps {
  type?: string;
  orderData?: any;
}

function TourFloorPlans({ type = "", orderData = null }: TourFloorPlansProps) {
  const { userType } = useAppContext();
  const { startUpload } = useGlobalFileUpload();
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const {
    droppedMarkers,
    setDroppedMarkers,
    filesData,
    setFilesData,
    floorFiles,
    deletedSnapshotUuids,
    setDeletedSnapshotUuids,
    delay,
    transition,
    selectedAudioTrack,
    setIsSaving,
  } = useFileManagerContext();

  const currentTourFloorFiles = [
    ...(filesData?.files?.filter((file) => {
      const isFloorPlan =
        file?.service?.category?.name === "Floor Plan" ||
        file?.service?.name?.toLowerCase().includes("floor plan");
      return file.type === "photo" && isFloorPlan;
    }) || []),
    ...floorFiles.filter((f) => !f.is_deleted),
  ];

  let photosList = [
    ...(filesData?.files?.filter((file) => {
      const isFloorPlan =
        file?.service?.category?.name === "Floor Plan" ||
        file?.service?.name?.toLowerCase().includes("floor plan");
      return file.type === "photo" && !isFloorPlan;
    }) || []),
  ];

  let filteredFloorFiles = currentTourFloorFiles;

  if (userType === "agent") {
    photosList = photosList.filter((file) =>
      "uuid" in file ? file.is_agent_approved || file.is_complimentary : true,
    );
  }

  filteredFloorFiles = filteredFloorFiles.sort((a, b) => {
    const orderA = (a as any).sort_order !== undefined && (a as any).sort_order !== null ? Number((a as any).sort_order) : 999999;
    const orderB = (b as any).sort_order !== undefined && (b as any).sort_order !== null ? Number((b as any).sort_order) : 999999;
    if (orderA !== orderB) return orderA - orderB;
    const dateA = (a as any).created_at ? new Date((a as any).created_at).getTime() : 0;
    const dateB = (b as any).created_at ? new Date((b as any).created_at).getTime() : 0;
    return dateA - dateB;
  });

  const usedSnapshotKeys = React.useMemo(() => {
    const keys = new Set<string>();

    const addKeys = (snap: {
      file?: File;
      uuid?: string;
      file_path?: string;
      url?: string;
      thumbnail_url?: string;
      variant_urls?: any;
    }) => {
      if (snap.file && snap.file.name) keys.add(`name:${snap.file.name}`);
      if (snap.uuid) keys.add(`uuid:${snap.uuid}`);
      if (snap.file_path) {
        keys.add(`path:${snap.file_path}`);
        const baseName = snap.file_path.split("/").pop();
        if (baseName) keys.add(`basename:${baseName}`);
      }
      if (snap.url) keys.add(`url:${snap.url}`);
      if (snap.thumbnail_url) keys.add(`url:${snap.thumbnail_url}`);
      if (snap.variant_urls && typeof snap.variant_urls === "object") {
        Object.values(snap.variant_urls).forEach((v) => {
          if (typeof v === "string" && v) keys.add(`url:${v}`);
        });
      }
    };

    droppedMarkers.forEach((marker) => addKeys(marker));

    (filesData?.snapshots || []).forEach((snap: any) => {
      if (deletedSnapshotUuids.has(snap.uuid)) return;
      addKeys(snap);
    });

    return keys;
  }, [droppedMarkers, filesData?.snapshots, deletedSnapshotUuids]);

  const isPhotoUsedAsSnapshot = (file: any): boolean => {
    if (!file) return false;

    if ("file" in file && file.file?.name) {
      if (usedSnapshotKeys.has(`name:${file.file.name}`)) return true;
    }
    if (file.name && usedSnapshotKeys.has(`name:${file.name}`)) return true;

    if ("uuid" in file && file.uuid) {
      if (usedSnapshotKeys.has(`uuid:${file.uuid}`)) return true;
    }

    if (file.file_path) {
      if (usedSnapshotKeys.has(`path:${file.file_path}`)) return true;
      const baseName = file.file_path.split("/").pop();
      if (baseName && usedSnapshotKeys.has(`basename:${baseName}`)) return true;
    }

    if (file.url && usedSnapshotKeys.has(`url:${file.url}`)) return true;
    if (file.thumbnail_url && usedSnapshotKeys.has(`url:${file.thumbnail_url}`))
      return true;

    if (file.variant_urls) {
      if (
        file.variant_urls.thumb &&
        usedSnapshotKeys.has(`url:${file.variant_urls.thumb}`)
      )
        return true;
      if (
        file.variant_urls.landing &&
        usedSnapshotKeys.has(`url:${file.variant_urls.landing}`)
      )
        return true;
      if (
        file.variant_urls.popup &&
        usedSnapshotKeys.has(`url:${file.variant_urls.popup}`)
      )
        return true;
      if (
        file.variant_urls.slider &&
        usedSnapshotKeys.has(`url:${file.variant_urls.slider}`)
      )
        return true;
    }

    return false;
  };

  const currentTourPhotos = photosList
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .filter((file) => !isPhotoUsedAsSnapshot(file));

  const [draggedFile, setDraggedFile] = useState<{
    file?: File;
    file_path?: string;
    url?: string;
    thumbnail_url?: string;
    variant_urls?: any;
  } | null>(null);
  const draggedFileRef = useRef<{
    file?: File;
    file_path?: string;
    url?: string;
    thumbnail_url?: string;
    variant_urls?: any;
  } | null>(null);

  const [selectedImageId, setSelectedImageId] = useState<string | null>(() => {
    if ((filteredFloorFiles?.length ?? 0) > 0) {
      const firstFile = filteredFloorFiles[0];
      return "uuid" in firstFile
        ? firstFile.name
        : (firstFile as any).file.name;
    }
    return null;
  });

  React.useEffect(() => {
    if (!selectedImageId && filteredFloorFiles?.length > 0) {
      const firstFile = filteredFloorFiles[0];
      setSelectedImageId(
        "uuid" in firstFile ? firstFile.name : (firstFile as any).file.name
      );
    }
  }, [filteredFloorFiles, selectedImageId]);
  console.log("droppedMarkers", droppedMarkers);

  const [snapshotFile, setSnapshotFile] = useState<File | null>(null);
  const [snapshotName, setSnapshotName] = useState("");
  const [snapshotDescription, setSnapshotDescription] = useState("");
  const [activeMarkerIndex, setActiveMarkerIndex] = useState<number | null>(
    null,
  );
  const [activeApiSnapshotUuid, setActiveApiSnapshotUuid] = useState<
    string | null
  >(null);
  const [tempMarkerPos, setTempMarkerPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [previewMarker, setPreviewMarker] = useState<DroppedMarker | null>(
    null,
  );
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);

  const handleImageDoubleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (type === "confirm" || !imgRef.current || !selectedImageId) return;

    const img = imgRef.current;
    const imgRect = img.getBoundingClientRect();

    const relX = e.clientX - imgRect.left;
    const relY = e.clientY - imgRect.top;

    const xPercent = (relX / imgRect.width) * 100;
    const yPercent = (relY / imgRect.height) * 100;

    setClickPos({ x: xPercent, y: yPercent });
    setShowPhotoSelector(true);
  };

  const handleSelectPhotoForClick = async (file: any) => {
    if (!clickPos || !selectedImageId) return;

    const newMarker: DroppedMarker = {
      x: clickPos.x,
      y: clickPos.y,
      floorImageUrl: selectedImageId,
      name: "",
      description: "",
    };

    if ("file" in file || !("uuid" in file)) {
      newMarker.file = file.file;
    } else {
      newMarker.file_path = file.file_path;
      newMarker.url =
        file.url ||
        file.variant_urls?.landing ||
        file.variant_urls?.popup ||
        file.variant_urls?.thumb;
      newMarker.thumbnail_url =
        file.variant_urls?.popup ||
        file.variant_urls?.thumb ||
        file.thumbnail_url ||
        file.url;
      newMarker.variant_urls = file.variant_urls;
      newMarker.isApi = true;
    }

    const updatedDroppedMarkers = [...droppedMarkers, newMarker];

    setShowPhotoSelector(false);
    setClickPos(null);

    const activeSnapshots = [
      ...(filesData?.snapshots || [])
        .filter((snap) => !deletedSnapshotUuids.has(snap.uuid))
        .map((snap) => ({
          uuid: snap.uuid,
          x: Number(snap.x_axis ?? 0),
          y: Number(snap.y_axis ?? 0),
          floorImageUrl: snap.file_name ?? "",
          isApi: true as const,
          name: snap.name ?? undefined,
          description: snap.description ?? undefined,
          file_path: snap.file_path,
          url: snap.url,
          thumbnail_url: snap.thumbnail_url,
          variant_urls: snap.variant_urls,
        })),
      ...updatedDroppedMarkers,
    ];

    const success = await persistSnapshots(activeSnapshots, {
      showToast: false,
    });

    if (success) {
      // Find the saved snapshot matching our newly placed floorImageUrl and coordinates
      const token = localStorage.getItem("token");
      const orderUuid =
        orderData?.uuid ||
        ((filesData as any)?.tour_id ? String((filesData as any).tour_id) : "");
      if (token && orderUuid) {
        const fresh = await GetFilesData(token, orderUuid);
        const freshSnapshots = fresh?.data?.[0]?.snapshots || [];
        const found = freshSnapshots.find(
          (s: any) =>
            normalizeName(s.file_name) === normalizeName(selectedImageId) &&
            Math.abs(Number(s.x_axis) - newMarker.x) < 0.1 &&
            Math.abs(Number(s.y_axis) - newMarker.y) < 0.1,
        );

        if (found) {
          setActiveApiSnapshotUuid(found.uuid);
          setActiveMarkerIndex(null);
          setSnapshotFile(null);
          setSnapshotName(found.name || "");
          setSnapshotDescription(found.description || "");
          setTempMarkerPos({ x: Number(found.x_axis), y: Number(found.y_axis) });
          setPreviewMarker({
            x: Number(found.x_axis),
            y: Number(found.y_axis),
            floorImageUrl: found.file_name,
            name: found.name || "",
            description: found.description || "",
            file_path: found.file_path,
            url: found.url,
            thumbnail_url: found.thumbnail_url,
            variant_urls: found.variant_urls,
            isApi: true,
          });
        }
      }
    }
  };

  const imageContainerRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

  // Utility function to check if a file is a PDF
  const isPDF = (file: any): boolean => {
    if (!file) return false;
    const isLocal = !!file.file;
    if (isLocal) {
      return (
        file.file.type === "application/pdf" ||
        file.file.name.toLowerCase().endsWith(".pdf")
      );
    }
    return (
      file.file_path?.toLowerCase().endsWith(".pdf") ||
      file.type === "pdf" ||
      file.type === "application/pdf"
    );
  };

  const normalizeName = (filename: string) => {
    if (!filename) return "";
    return filename.replace(/\.[^/.]+$/, ""); // strip extension
  };

  const localSnapshots = droppedMarkers.filter(
    (marker) =>
      normalizeName(marker.floorImageUrl) ===
      normalizeName(selectedImageId || ""),
  );

  const apiSnapshots = (filesData?.snapshots || []).filter(
    (snap) =>
      normalizeName(snap.file_name) === normalizeName(selectedImageId || "") &&
      !deletedSnapshotUuids.has(snap.uuid),
  );

  const allSnapshots = React.useMemo(() => [...localSnapshots, ...apiSnapshots], [localSnapshots, apiSnapshots]);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [fullscreenSnapshot, setFullscreenSnapshot] = useState<any | null>(null);
  const [fullscreenSnapshotIndex, setFullscreenSnapshotIndex] = useState<number>(0);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);
  const [lightboxPan, setLightboxPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isLightboxDragging, setIsLightboxDragging] = useState<boolean>(false);
  const [lightboxDragStart, setLightboxDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const openFullscreenSnapshot = (snap: any, index?: number) => {
    if (!snap) return;
    const foundIdx = index !== undefined && index >= 0
      ? index
      : allSnapshots.findIndex(s => s === snap || (s.file_path && s.file_path === snap.file_path) || (s.uuid && s.uuid === snap.uuid));
    setFullscreenSnapshot(snap);
    setFullscreenSnapshotIndex(foundIdx >= 0 ? foundIdx : 0);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  };

  const closeFullscreenSnapshot = () => {
    setFullscreenSnapshot(null);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  };

  const handleNextSnapshot = () => {
    if (allSnapshots.length === 0) return;
    const nextIdx = (fullscreenSnapshotIndex + 1) % allSnapshots.length;
    setFullscreenSnapshotIndex(nextIdx);
    setFullscreenSnapshot(allSnapshots[nextIdx]);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  };

  const handlePrevSnapshot = () => {
    if (allSnapshots.length === 0) return;
    const prevIdx = (fullscreenSnapshotIndex - 1 + allSnapshots.length) % allSnapshots.length;
    setFullscreenSnapshotIndex(prevIdx);
    setFullscreenSnapshot(allSnapshots[prevIdx]);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  };

  React.useEffect(() => {
    if (fullscreenSnapshot) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeFullscreenSnapshot();
        else if (e.key === "ArrowRight") handleNextSnapshot();
        else if (e.key === "ArrowLeft") handlePrevSnapshot();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [fullscreenSnapshot, fullscreenSnapshotIndex, allSnapshots, handleNextSnapshot, handlePrevSnapshot]);

  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const activeFile = draggedFileRef.current || draggedFile;
    if (!activeFile || !selectedImageId) return;

    const container = imgRef.current || imageContainerRef.current;
    if (!container) return;
    const imgRect = container.getBoundingClientRect();

    const relX = e.clientX - imgRect.left;
    const relY = e.clientY - imgRect.top;

    const xPercent = Math.max(0, Math.min(100, (relX / imgRect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, (relY / imgRect.height) * 100));

    const newMarker: DroppedMarker = {
      x: xPercent,
      y: yPercent,
      floorImageUrl: selectedImageId,
      name: "",
      description: "",
    };

    if (activeFile.file) {
      newMarker.file = activeFile.file;
    } else if (
      activeFile.file_path ||
      activeFile.url ||
      activeFile.thumbnail_url
    ) {
      newMarker.file_path = activeFile.file_path;
      newMarker.url = activeFile.url;
      newMarker.thumbnail_url = activeFile.thumbnail_url;
      newMarker.variant_urls = (activeFile as any).variant_urls;
      newMarker.isApi = true;
    }

    const updatedDroppedMarkers = [...droppedMarkers, newMarker];
    setDraggedFile(null);
    draggedFileRef.current = null;

    const activeSnapshots = [
      ...(filesData?.snapshots || [])
        .filter((snap) => !deletedSnapshotUuids.has(snap.uuid))
        .map((snap) => ({
          uuid: snap.uuid,
          x: Number(snap.x_axis ?? 0),
          y: Number(snap.y_axis ?? 0),
          floorImageUrl: snap.file_name ?? "",
          isApi: true as const,
          name: snap.name ?? undefined,
          description: snap.description ?? undefined,
          file_path: snap.file_path,
          url: snap.url,
          thumbnail_url: snap.thumbnail_url,
          variant_urls: snap.variant_urls,
        })),
      ...updatedDroppedMarkers,
    ];

    const success = await persistSnapshots(activeSnapshots, {
      showToast: false,
    });

    if (success) {
      const token = localStorage.getItem("token");
      const orderUuid =
        orderData?.uuid ||
        ((filesData as any)?.tour_id ? String((filesData as any).tour_id) : "");
      if (token && orderUuid) {
        const fresh = await GetFilesData(token, orderUuid);
        const freshSnapshots = fresh?.data?.[0]?.snapshots || [];
        const found = freshSnapshots.find(
          (s: any) =>
            normalizeName(s.file_name) === normalizeName(selectedImageId) &&
            Math.abs(Number(s.x_axis) - newMarker.x) < 2 &&
            Math.abs(Number(s.y_axis) - newMarker.y) < 2,
        );

        if (found) {
          setActiveApiSnapshotUuid(found.uuid);
          setActiveMarkerIndex(null);
          setSnapshotFile(null);
          setSnapshotName(found.name || "");
          setSnapshotDescription(found.description || "");
          setTempMarkerPos({ x: Number(found.x_axis), y: Number(found.y_axis) });
          setPreviewMarker({
            x: Number(found.x_axis),
            y: Number(found.y_axis),
            floorImageUrl: found.file_name,
            name: found.name || "",
            description: found.description || "",
            file_path: found.file_path,
            url: found.url,
            thumbnail_url: found.thumbnail_url,
            variant_urls: found.variant_urls,
            isApi: true,
          });
        }
      }
    }
  };

  const handlePhotoClick = (file: any) => {
    // Only handle replacement if a snapshot is currently selected for editing
    if (activeMarkerIndex === null && !activeApiSnapshotUuid) return;

    if ("uuid" in file) {
      // Server file
      setSnapshotFile(null);
      if (previewMarker) {
        setPreviewMarker({
          ...previewMarker,
          file: undefined,
          isApi: true,
          file_path: file.file_path,
          url:
            file.url ||
            file.variant_urls?.landing ||
            file.variant_urls?.popup ||
            file.variant_urls?.thumb,
          thumbnail_url:
            file.variant_urls?.popup ||
            file.variant_urls?.thumb ||
            file.thumbnail_url ||
            file.url,
          variant_urls: file.variant_urls,
        });
      }
    } else {
      // Local file
      setSnapshotFile(file.file);
      if (previewMarker) {
        setPreviewMarker({
          ...previewMarker,
          file: file.file,
          isApi: false,
          url: undefined,
          file_path: undefined,
        });
      }
    }
    toast.info("Snapshot image replaced. Click Update to save.");
  };

  const handleSnapshotImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const activeFile = draggedFileRef.current || draggedFile;
    if (!activeFile) return;

    if (activeFile.file) {
      setSnapshotFile(activeFile.file);
      if (previewMarker) {
        setPreviewMarker({
          ...previewMarker,
          file: activeFile.file,
          isApi: false,
          url: undefined,
          file_path: undefined,
        });
      }
    } else {
      setSnapshotFile(null);
      if (previewMarker) {
        setPreviewMarker({
          ...previewMarker,
          file: undefined,
          isApi: true,
          file_path: activeFile.file_path,
          url: activeFile.url,
          thumbnail_url: activeFile.thumbnail_url,
          variant_urls: activeFile.variant_urls,
        });
      }
    }
    setDraggedFile(null);
    draggedFileRef.current = null;
    toast.info("Snapshot image updated");
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleSaveSnapshots = async () => {
    const token = localStorage.getItem("token");
    const orderUuid =
      orderData?.uuid ||
      ((filesData as any)?.tour_id ? String((filesData as any).tour_id) : "");
    if (!token || !filesData || !orderUuid) {
      toast.error(
        "Could not save snapshots. Missing token or order information.",
      );
      return;
    }

    const activeSnapshots = [
      ...(filesData?.snapshots || [])
        .filter((snap) => !deletedSnapshotUuids.has(snap.uuid))
        .map((snap) => ({
          uuid: snap.uuid,
          x: Number(snap.x_axis ?? 0),
          y: Number(snap.y_axis ?? 0),
          floorImageUrl: snap.file_name ?? "",
          isApi: true as const,
          name: snap.name ?? undefined,
          description: snap.description ?? undefined,
          file_path: snap.file_path,
          url: snap.url,
          thumbnail_url: snap.thumbnail_url,
          variant_urls: snap.variant_urls,
        })),
      ...droppedMarkers,
    ];

    setIsSaving(true);
    try {
      const response = await startUpload({
        token,
        orderUuid: orderUuid,
        filesDataUuid: filesData.uuid,
        files: [],
        links: filesData.links || [],
        droppedMarkers: activeSnapshots,
        delay: delay || 3,
        transition: transition || "fade",
        selectedAudioTrack: selectedAudioTrack || "none",
        changedFiles: [],
        isUpdate: true,
        successMessage: "Snapshots saved successfully.",
      });

      if (response) {
        const freshFilesData = await GetFilesData(token, orderUuid);
        if (freshFilesData?.data?.[0]) {
          const updatedTour = freshFilesData.data[0];
          if (updatedTour.files) {
            updatedTour.files = updatedTour.files.map((f: any) => ({
              ...f,
              is_processing:
                f.status === "processing" ||
                f.is_processing ||
                (f.type === "photo" &&
                  (!f.variant_urls ||
                    Object.keys(f.variant_urls).length === 0)),
            }));
          }
          setFilesData(updatedTour);
        }
        setDroppedMarkers([]);
        setDeletedSnapshotUuids(new Set());
      }
    } catch (err) {
      console.error("Error saving snapshots:", err);
      toast.error("Failed to save snapshots");
    } finally {
      setIsSaving(false);
    }
  };

  const persistSnapshots = async (
    snapshotsToSave: any[],
    options?: { showToast?: boolean; successToastMsg?: string },
  ) => {
    const token = localStorage.getItem("token");
    const orderUuid =
      orderData?.uuid ||
      ((filesData as any)?.tour_id ? String((filesData as any).tour_id) : "");
    if (!token || !filesData || !orderUuid) {
      toast.error(
        "Could not save snapshot. Missing token or order information.",
      );
      return false;
    }

    setIsSaving(true);
    try {
      const response = await startUpload({
        token,
        orderUuid: orderUuid,
        filesDataUuid: filesData.uuid,
        files: [],
        links: filesData.links || [],
        droppedMarkers: snapshotsToSave,
        delay: delay || 3,
        transition: transition || "fade",
        selectedAudioTrack: selectedAudioTrack || "none",
        changedFiles: [],
        isUpdate: true,
        showToast: options?.showToast ?? false,
        successMessage: options?.successToastMsg || "Snapshots saved successfully.",
      });

      if (response) {
        const freshFilesData = await GetFilesData(token, orderUuid);
        if (freshFilesData?.data?.[0]) {
          const updatedTour = freshFilesData.data[0];
          if (updatedTour.files) {
            updatedTour.files = updatedTour.files.map((f: any) => ({
              ...f,
              is_processing:
                f.status === "processing" ||
                f.is_processing ||
                (f.type === "photo" &&
                  (!f.variant_urls ||
                    Object.keys(f.variant_urls).length === 0)),
            }));
          }
          setFilesData(updatedTour);
        }
        setDroppedMarkers([]);
        setDeletedSnapshotUuids(new Set());
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error saving snapshot:", err);
      toast.error("Failed to save snapshot");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSnapshot = async () => {
    if (!selectedImageId || !tempMarkerPos) return;

    const isUpdating = activeMarkerIndex !== null || !!activeApiSnapshotUuid;

    const newMarker: DroppedMarker = {
      ...(activeMarkerIndex !== null
        ? droppedMarkers[activeMarkerIndex]
        : previewMarker || {}),
      x: tempMarkerPos.x,
      y: tempMarkerPos.y,
      floorImageUrl: selectedImageId,
      name: snapshotName,
      description: snapshotDescription,
    };

    if (snapshotFile) {
      newMarker.file = snapshotFile;
      newMarker.isApi = false;
      newMarker.file_path = undefined;
    } else if (
      previewMarker?.file_path ||
      previewMarker?.url ||
      previewMarker?.thumbnail_url
    ) {
      newMarker.file_path = previewMarker.file_path;
      newMarker.isApi = true;
      newMarker.thumbnail_url = previewMarker.thumbnail_url;
      newMarker.url = previewMarker.url;
      newMarker.variant_urls = previewMarker.variant_urls;
    }

    const updatedDroppedMarkers = [...droppedMarkers];
    const currentDeletedUuids = new Set(deletedSnapshotUuids);

    if (activeApiSnapshotUuid) {
      newMarker.uuid = activeApiSnapshotUuid;
      currentDeletedUuids.add(activeApiSnapshotUuid);
      updatedDroppedMarkers.push(newMarker);
    } else if (activeMarkerIndex !== null && updatedDroppedMarkers[activeMarkerIndex]) {
      updatedDroppedMarkers[activeMarkerIndex] = {
        ...updatedDroppedMarkers[activeMarkerIndex],
        ...newMarker,
      };
    } else {
      updatedDroppedMarkers.push(newMarker);
    }

    const activeSnapshots = [
      ...(filesData?.snapshots || [])
        .filter((snap) => !currentDeletedUuids.has(snap.uuid))
        .map((snap) => ({
          uuid: snap.uuid,
          x: Number(snap.x_axis ?? 0),
          y: Number(snap.y_axis ?? 0),
          floorImageUrl: snap.file_name ?? "",
          isApi: true as const,
          name: snap.name ?? undefined,
          description: snap.description ?? undefined,
          file_path: snap.file_path,
          url: snap.url,
          thumbnail_url: snap.thumbnail_url,
          variant_urls: snap.variant_urls,
        })),
      ...updatedDroppedMarkers,
    ];

    const success = await persistSnapshots(activeSnapshots, {
      showToast: isUpdating,
      successToastMsg: isUpdating ? "Snapshot updated" : undefined,
    });

    if (success) {
      setActiveMarkerIndex(null);
      setActiveApiSnapshotUuid(null);
      setSnapshotFile(null);
      setSnapshotName("");
      setSnapshotDescription("");
      setTempMarkerPos(null);
      setPreviewMarker(null);
    }
  };

  const handleDeleteSnapshot = async () => {
    if (activeMarkerIndex === null && !activeApiSnapshotUuid) {
      toast.error("No snapshot selected to delete");
      return;
    }

    const token = localStorage.getItem("token");

    if (activeApiSnapshotUuid && token) {
      try {
        await DeleteSnapshot(token, activeApiSnapshotUuid);

        // Remove from local state immediately
        if (filesData) {
          setFilesData({
            ...filesData,
            snapshots: filesData.snapshots.filter(
              (s) => s.uuid !== activeApiSnapshotUuid,
            ),
          });
        }

        toast.success("Snapshot deleted successfully");
      } catch (error) {
        console.error("Error deleting snapshot:", error);
        toast.error("Failed to delete snapshot");
        return;
      }
    } else if (activeMarkerIndex !== null) {
      const updatedMarkers = droppedMarkers.filter((_, i) => i !== activeMarkerIndex);
      const activeSnapshots = [
        ...(filesData?.snapshots || [])
          .filter((snap) => !deletedSnapshotUuids.has(snap.uuid))
          .map((snap) => ({
            uuid: snap.uuid,
            x: Number(snap.x_axis ?? 0),
            y: Number(snap.y_axis ?? 0),
            floorImageUrl: snap.file_name ?? "",
            isApi: true as const,
            name: snap.name ?? undefined,
            description: snap.description ?? undefined,
            file_path: snap.file_path,
            url: snap.url,
            thumbnail_url: snap.thumbnail_url,
            variant_urls: snap.variant_urls,
          })),
        ...updatedMarkers,
      ];

      const success = await persistSnapshots(activeSnapshots, {
        showToast: true,
        successToastMsg: "Snapshot deleted successfully",
      });

      if (!success) return;
    }

    setActiveMarkerIndex(null);
    setActiveApiSnapshotUuid(null);
    setSnapshotFile(null);
    setSnapshotName("");
    setSnapshotDescription("");
    setTempMarkerPos(null);
    setPreviewMarker(null);
  };

  const selectedFile = filteredFloorFiles?.find(
    (f) => ("uuid" in f ? f.name : (f as any).file.name) === selectedImageId,
  );

  const isSelectedFilePDF = selectedFile ? isPDF(selectedFile) : false;

  if (!filteredFloorFiles || filteredFloorFiles?.length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _allFloorPlans =
      filesData?.files?.filter((file) => {
        const isFloorPlan =
          file?.service?.category?.name === "Floor Plan" ||
          file?.service?.name?.toLowerCase().includes("floor plan");
        return file.type === "photo" && isFloorPlan;
      }) || [];
    if (userType === "agent") {
      return (
        <div className="font-alexandria w-full h-[50vh] text-[#E06D5E] flex justify-center items-center font-[500] text-[18px]">
          <p>Vendor has not uploaded any floor plans yet.</p>
        </div>
      );
    }
    return (
      <div className="font-alexandria w-full h-[50vh] text-gray-500 flex justify-center items-center">
        <p>
          No Floor Photo found — please add Floor Photos or select a Floor Plan
          service.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {userType === "vendor" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="absolute inset-0 z-10 cursor-default"
              onPointerDown={(e) => e.preventDefault()}
              onClick={(e) => e.preventDefault()}
            />
          </TooltipTrigger>
          <TooltipContent>
            You don&apos;t have permission to change this setting
          </TooltipContent>
        </Tooltip>
      )}
      <div
        className={
          userType === "vendor" ? "pointer-events-none select-none" : ""
        }
      >
        <div
          className={`w-full h-auto font-alexandria bg-gray-100 py-6  ${type !== "confirm" ? "pl-6" : "pl-0 mt-[75px] pt-0"}`}
        >
          {type !== "confirm" && (
            <div className="mb-6 mr-6 bg-[#E3F2FD] border-l-4 border-[#1E88E5] text-[#1565C0] p-4 rounded-r-lg shadow-sm flex items-start gap-3">
              <svg
                className="w-5 h-5 mt-0.5 text-[#1E88E5] shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <span className="font-semibold block text-[15px] mb-0.5">
                  Quick Guide: How to Attach Snapshots
                </span>
                <p className="text-[13.5px] leading-relaxed">
                  Drag and drop any photo from the <strong>Photos</strong>{" "}
                  gallery below onto the desired position on the floor plan
                  image to attach it as a snapshot. Alternatively, you can{" "}
                  <strong>double-click or tap</strong> anywhere on the floor
                  plan to select a photo directly.
                </p>
              </div>
            </div>
          )}
          <div
            className={`w-full h-auto md:h-[550px] flex flex-col md:flex-row gap-[30px] ${type === "confirm" ? "bg-white" : ""} `}
          >
            <div
              ref={imageContainerRef}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
              }}
              className={`relative w-full md:w-[70%] border border-gray-200 h-[300px] sm:h-full bg-white overflow-visible ${type === "confirm" ? "m-auto" : ""}`}
            >
              {selectedFile &&
              "uuid" in selectedFile &&
              selectedFile.is_processing ? (
                <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                  <p className="text-gray-500 font-medium text-sm">
                    Processing...
                  </p>
                </div>
              ) : userType === "agent" &&
                !(orderData?.payment_status === "PAID") &&
                !(
                  selectedFile &&
                  "is_complimentary" in selectedFile &&
                  selectedFile.is_complimentary
                ) ? (
                <PdfPlaceholder
                  className="w-full h-full"
                  isRestricted={true}
                  message="Floor plan preview is protected until payment is completed"
                />
              ) : isSelectedFilePDF && selectedFile ? (
                "uuid" in selectedFile &&
                (!selectedFile.variant_urls ||
                  (Array.isArray(selectedFile.variant_urls) &&
                    selectedFile.variant_urls.length === 0) ||
                  Object.keys(selectedFile.variant_urls).length === 0) ? (
                  <PdfPlaceholder
                    className="w-full h-full"
                    message="service is not paid yet"
                  />
                ) : (
                  <iframe
                    src={
                      "uuid" in selectedFile
                        ? `${selectedFile.variant_urls?.popup || selectedFile.url || (selectedFile.file_path ? `${API_URL}/${selectedFile.file_path}` : "")}#toolbar=0`
                        : URL.createObjectURL((selectedFile as any).file)
                    }
                    className="w-full h-full border-0"
                    title="Floor Plan PDF"
                  />
                )
              ) : selectedFile && !("uuid" in selectedFile) ? (
                <OptimizedImagePreview
                  file={(selectedFile as any).file}
                  width={1200}
                  height={1200}
                  draggable={false}
                  ref={imgRef as any}
                  className="object-contain max-h-full max-w-full w-full h-full cursor-pointer"
                  onDoubleClick={handleImageDoubleClick}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  draggable={false}
                  ref={imgRef}
                  src={
                    selectedFile
                      ? "uuid" in selectedFile
                        ? selectedFile.variant_urls?.popup ||
                          selectedFile.url ||
                          (selectedFile.file_path
                            ? `${API_URL}/${selectedFile.file_path}`
                            : "")
                        : URL.createObjectURL((selectedFile as any).file)
                      : ""
                  }
                  alt="Selected Floor"
                  className="object-contain max-h-full max-w-full w-full h-full cursor-pointer"
                  onDoubleClick={handleImageDoubleClick}
                />
              )}
              {[...localSnapshots, ...apiSnapshots].map((marker, idx) => {
                const isApiSnapshot = "x_axis" in marker;
                const posX = isApiSnapshot ? marker.x_axis : marker.x;
                const posY = isApiSnapshot ? marker.y_axis : marker.y;

                return (
                  <div
                    key={idx}
                    className="absolute cursor-pointer z-10"
                    style={{
                      top: `${posY}%`,
                      left: `${posX}%`,
                      transform: "translate(-50%, -100%)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openFullscreenSnapshot(marker, idx);
                      if (isApiSnapshot) {
                        setPreviewMarker({
                          x: Number(marker.x_axis),
                          y: Number(marker.y_axis),
                          file_path: marker.file_path,
                          url: marker.url,
                          floorImageUrl: marker.file_name,
                          name: marker.name ?? "",
                          description: marker.description ?? "",
                          isApi: true,
                          thumbnail_url: marker.thumbnail_url,
                          variant_urls: (marker as any).variant_urls,
                        });

                        setSnapshotFile(null);
                        setSnapshotName(marker.name ?? "");
                        setSnapshotDescription(marker.description ?? "");
                        setTempMarkerPos({
                          x: Number(marker.x_axis),
                          y: Number(marker.y_axis),
                        });
                        setActiveMarkerIndex(null);
                        setActiveApiSnapshotUuid(marker.uuid);
                      } else {
                        const originalIndex = droppedMarkers.findIndex(
                          (m) => m === marker,
                        );
                        setActiveMarkerIndex(originalIndex);
                        setActiveApiSnapshotUuid(null);
                        setSnapshotFile(marker.file ?? null);
                        setSnapshotName(marker.name ?? "");
                        setSnapshotDescription(marker.description ?? "");
                        setTempMarkerPos({ x: marker.x, y: marker.y });
                        setPreviewMarker(marker);
                      }
                    }}
                    onMouseEnter={() => {
                      if (type !== "confirm") return;
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                      }
                      if (isApiSnapshot) {
                        setPreviewMarker({
                          x: Number(marker.x_axis),
                          y: Number(marker.y_axis),
                          file_path: marker.file_path,
                          url: marker.url,
                          floorImageUrl: marker.file_name,
                          name: marker.name ?? "",
                          description: marker.description ?? "",
                          isApi: true,
                          thumbnail_url: marker.thumbnail_url,
                          variant_urls: (marker as any).variant_urls,
                        });
                      } else {
                        setPreviewMarker(marker);
                      }
                    }}
                    onMouseLeave={() => {
                      if (type !== "confirm") return;
                      hoverTimeoutRef.current = setTimeout(() => {
                        setPreviewMarker(null);
                      }, 300);
                    }}
                  >
                    <CameraIcon width={20} height={20} />
                  </div>
                );
              })}

              {previewMarker && type === "confirm" && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    openFullscreenSnapshot(previewMarker);
                  }}
                  className="bg-[#565656] text-white font-alexandria shadow-lg w-[90vw] max-w-[500px] min-w-[300px] h-auto absolute flex flex-col z-[100] rounded-lg overflow-hidden transition-all duration-300 cursor-pointer"
                  style={
                    isMobile
                      ? {
                          bottom: "10px",
                          left: "50%",
                          transform: "translateX(-50%)",
                        }
                      : {
                          top:
                            previewMarker.y > 50
                              ? "auto"
                              : `calc(${previewMarker.y}% - 24px)`,
                          bottom:
                            previewMarker.y > 50
                              ? `calc(${100 - previewMarker.y}%)`
                              : "auto",
                          left:
                            previewMarker.x > 50
                              ? "auto"
                              : `calc(${previewMarker.x}% + 15px)`,
                          right:
                            previewMarker.x > 50
                              ? `calc(${100 - previewMarker.x}% + 15px)`
                              : "auto",
                        }
                  }
                  onMouseEnter={() => {
                    if (hoverTimeoutRef.current) {
                      clearTimeout(hoverTimeoutRef.current);
                    }
                  }}
                  onMouseLeave={() => {
                    hoverTimeoutRef.current = setTimeout(() => {
                      setPreviewMarker(null);
                    }, 300);
                  }}
                >
                  <button
                    onClick={() => setPreviewMarker(null)}
                    className="absolute top-4 right-4 text-black text-[20px] bg-white rounded-full z-10 p-[2px]"
                  >
                    <X className="w-[20px] h-[20px]" />
                  </button>

                  {previewMarker && (
                    //eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        previewMarker.file
                          ? URL.createObjectURL(previewMarker.file)
                          : previewMarker.variant_urls?.popup ||
                            previewMarker.variant_urls?.landing ||
                            previewMarker.url ||
                            (previewMarker.file_path
                              ? previewMarker.file_path.startsWith("http")
                                ? previewMarker.file_path
                                : `${API_URL}/${previewMarker.file_path}`
                              : "")
                      }
                      alt={previewMarker.name || "Snapshot"}
                      className="w-auto h-auto max-w-[calc(100%-24px)] max-h-[300px] object-contain mx-auto mt-3 rounded"
                    />
                  )}

                  <div className="p-4 flex-1">
                    <p className="text-[20px] font-[500] uppercase pb-2 break-words">
                      {previewMarker?.name}
                    </p>
                    <p className="break-words">{previewMarker?.description}</p>
                  </div>
                </div>
              )}
            </div>

            {type !== "confirm" && (
              <div className="w-[30%] p-4 text-[#666666] border border-gray-400 rounded-[6px]">
                <div className="flex items-center justify-between mb-[20px]">
                  <p className="text-[24px]">SnapShot</p>
                  {(droppedMarkers.length > 0 ||
                    deletedSnapshotUuids.size > 0) && (
                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                      Unsaved Changes
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-5">
                  <div
                    onDrop={handleSnapshotImageDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="mt-4 border p-2 rounded relative w-[200px] h-[150px] bg-gray-100 overflow-hidden flex items-center justify-center cursor-pointer group"
                  >
                    {snapshotFile ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={URL.createObjectURL(snapshotFile)}
                        alt="Snapshot Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : previewMarker?.file ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={URL.createObjectURL(previewMarker.file)}
                        alt="Snapshot Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : previewMarker ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={
                          previewMarker.variant_urls?.popup ||
                          previewMarker.variant_urls?.landing ||
                          previewMarker.variant_urls?.thumb ||
                          previewMarker.url ||
                          previewMarker.thumbnail_url ||
                          (previewMarker.file_path
                            ? previewMarker.file_path.startsWith("http")
                              ? previewMarker.file_path
                              : `${API_URL}/${previewMarker.file_path}`
                            : "")
                        }
                        alt="Snapshot Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-xs text-center">
                        No snapshot selected
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <p className="text-white text-[10px] font-bold">
                        Drop photo to update
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-[20px]">
                  <Label>Name</Label>
                  <div className="relative w-full ">
                    <Input
                      value={snapshotName}
                      onChange={(e) => setSnapshotName(e.target.value)}
                      type="text"
                      placeholder=""
                      className="h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                    />
                  </div>
                </div>
                <div className="mt-[20px]">
                  <Label>Description</Label>
                  <div className="relative w-full ">
                    <Textarea
                      value={snapshotDescription}
                      onChange={(e) => setSnapshotDescription(e.target.value)}
                      placeholder=""
                      className="h-[100px] resize-none bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-3 mt-5 mb-2">
                  <Button
                    onClick={handleAddSnapshot}
                    className="bg-[#4290E9] hover:bg-[#4898f3]"
                  >
                    {activeMarkerIndex !== null || activeApiSnapshotUuid
                      ? "Update"
                      : "Add"}
                  </Button>
                  <Button
                    onClick={handleDeleteSnapshot}
                    className="bg-[#E06D5E] hover:bg-[#f0796a]"
                  >
                    Delete Snapshot
                  </Button>
                  {/* <Button
                    onClick={handleSaveSnapshots}
                    disabled={isSaving}
                    className="bg-[#6BAE41] hover:bg-[#5ca034] text-white font-medium"
                  >
                    {isSaving ? "Saving..." : "Save All Snapshots"}
                  </Button> */}
                </div>
              </div>
            )}
          </div>
          <div className="w-full h-auto my-[20px] px-4 md:px-0">
            <div
              className={`h-full flex items-center gap-[20px] overflow-x-auto overflow-y-hidden pb-2 whitespace-nowrap scrollbar-none ${type === "confirm" ? "w-full" : "w-full md:w-[70%]"}`}
            >
              {filteredFloorFiles?.map((file, idx) => {
                const isFilePDF = isPDF(file);
                const fileName =
                  "uuid" in file ? file.name : (file as any).file.name;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedImageId(fileName)}
                    className={`w-[200px] h-[100px] flex items-center rounded-[6px] justify-center cursor-pointer ${selectedImageId === fileName ? "border-2 border-[#4290E9]" : ""}`}
                  >
                    <div className="relative border border-gray-200 rounded-[6px] w-full h-full flex items-center justify-center">
                      {"uuid" in file && file.is_processing ? (
                        <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                          <p className="text-gray-500 font-medium text-xs">
                            Processing...
                          </p>
                        </div>
                      ) : isFilePDF ? (
                        "uuid" in file &&
                        (!file.variant_urls ||
                          (Array.isArray(file.variant_urls) &&
                            file.variant_urls.length === 0) ||
                          Object.keys(file.variant_urls).length === 0) ? (
                          <PdfPlaceholder
                            className="w-full h-full"
                            message="service is not paid yet"
                          />
                        ) : (
                          <div className="relative w-full h-full overflow-hidden">
                            <iframe
                              src={
                                "uuid" in file
                                  ? `${file.variant_urls?.popup || file.url || `${API_URL}/${file.file_path}`}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`
                                  : URL.createObjectURL((file as any).file)
                              }
                              className="w-full h-full pointer-events-none border-none"
                              tabIndex={-1}
                              scrolling="no"
                            />
                            <div className="absolute inset-0 bg-transparent" />
                          </div>
                        )
                      ) : !("uuid" in file) ? (
                        <OptimizedImagePreview
                          file={(file as any).file}
                          className="max-w-full max-h-full"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            "uuid" in file
                              ? file.variant_urls?.thumb ||
                                file.thumbnail_url ||
                                file.url ||
                                (file.file_path
                                  ? `${API_URL}/${file.file_path}`
                                  : "")
                              : URL.createObjectURL((file as any).file)
                          }
                          alt="preview"
                          className="max-w-full max-h-full"
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* floorFiles mapping removed */}
            </div>
          </div>

          {type !== "confirm" && (
            <div className="mt-8">
              <p className="text-[#666666] text-[24px] px-3">Photos</p>

              {(currentTourPhotos || [])?.length > 0 ? (
                <div className="mt-4 w-full grid grid-cols-3 sm:grid-cols-6 gap-2 p-3">
                  {currentTourPhotos?.map((file, idx) => {
                    const isEditing =
                      activeMarkerIndex !== null || !!activeApiSnapshotUuid;

                    const handleDragStart = (e: React.DragEvent) => {
                      const fileObj = !("uuid" in file)
                        ? {
                            file: (file as any).file,
                            thumbnail_url: URL.createObjectURL((file as any).file),
                            url: URL.createObjectURL((file as any).file),
                          }
                        : {
                            file_path:
                              file.file_path ||
                              (file as any).variants?.thumb ||
                              (file as any).variants?.landing ||
                              (file as any).variants?.popup,
                            url:
                              file.url ||
                              file.variant_urls?.landing ||
                              file.variant_urls?.popup ||
                              file.variant_urls?.thumb,
                            thumbnail_url:
                              file.variant_urls?.popup ||
                              file.variant_urls?.thumb ||
                              file.thumbnail_url ||
                              file.url,
                            variant_urls: file.variant_urls,
                          };

                      e.dataTransfer.setData(
                        "text/plain",
                        !("uuid" in file) ? (file as any).file.name : file.uuid,
                      );
                      e.dataTransfer.effectAllowed = "copy";
                      draggedFileRef.current = fileObj;
                      setDraggedFile(fileObj);

                      setTimeout(() => {
                        imageContainerRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }, 50);
                    };

                    return (
                      <div
                        key={idx}
                        draggable
                        onDragStart={handleDragStart}
                        className={`bg-[#BBBBBB] h-auto relative transition-all duration-200 ${
                          isEditing
                            ? "cursor-pointer ring-2 ring-transparent hover:ring-[#4290E9] scale-[0.98] hover:scale-100"
                            : "cursor-grab active:cursor-grabbing"
                        }`}
                        onClick={() => handlePhotoClick(file)}
                      >
                        <div className="relative w-full h-[160px] pointer-events-none">
                          {!("uuid" in file) ? (
                            <OptimizedImagePreview
                              file={(file as any).file}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={
                                file.variant_urls?.thumb ||
                                file.url ||
                                (file.file_path
                                  ? `${API_URL}/${file.file_path}`
                                  : "")
                              }
                              alt="preview"
                              className="w-full h-full object-cover"
                            />
                          )}

                          {isEditing && (
                            <div className="absolute inset-0 bg-[#4290E9]/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-white text-[12px] font-bold bg-[#4290E9] px-3 py-1 rounded shadow-lg">
                                CLICK TO USE
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 mx-3 border border-dashed border-gray-300 bg-white rounded-lg p-8 text-center text-[#666666] font-medium text-[14px] flex flex-col items-center justify-center gap-3">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z"
                    />
                  </svg>
                  <span>
                    No Photo is available to attach as snapshot, please select /
                    approve some photos from the available media.
                  </span>
                </div>
              )}
            </div>
          )}

          {showPhotoSelector && (
            <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center font-alexandria p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      Select Snapshot Photo
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Click any photo below to attach it to the selected floor
                      plan coordinates
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPhotoSelector(false);
                      setClickPos(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {currentTourPhotos?.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      No photos available to select.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {currentTourPhotos?.map((file, idx) => {
                        const isLocal = !("uuid" in file);
                        return (
                          <div
                            key={idx}
                            onClick={() => handleSelectPhotoForClick(file)}
                            className="group border border-gray-200 rounded-lg overflow-hidden bg-gray-50 hover:border-[#4290E9] hover:ring-2 hover:ring-[#4290E9]/20 transition-all duration-200 cursor-pointer shadow-sm"
                          >
                            <div className="relative w-full h-[120px]">
                              {isLocal ? (
                                <OptimizedImagePreview
                                  file={(file as any).file}
                                  className="w-full h-full object-cover animate-none"
                                />
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={
                                    file.variant_urls?.thumb ||
                                    file.url ||
                                    (file.file_path
                                      ? `${API_URL}/${file.file_path}`
                                      : "")
                                  }
                                  alt="preview"
                                  className="w-full h-full object-cover"
                                />
                              )}
                              <div className="absolute inset-0 bg-[#4290E9]/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-white text-[11px] font-bold bg-[#4290E9] px-2.5 py-1 rounded shadow">
                                  USE PHOTO
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowPhotoSelector(false);
                      setClickPos(null);
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Fullscreen Snapshot Lightbox Modal */}
      {fullscreenSnapshot && isMounted && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-white opacity-100 flex flex-col justify-between items-center select-none animate-in fade-in duration-150 font-alexandria"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeFullscreenSnapshot();
          }}
        >
          {/* Top Controls Bar */}
          <div className="w-full z-50 flex items-center justify-between px-4 sm:px-8 py-4 bg-white border-b border-gray-200">
            {/* Counter & Name */}
            <div className="flex items-center gap-3">
              {allSnapshots.length > 0 && (
                <span className="text-[#1b365d] text-sm font-semibold tracking-wide bg-gray-100/90 px-3 py-1.5 rounded-full border border-gray-200/80 shadow-sm font-alexandria">
                  {fullscreenSnapshotIndex + 1} / {allSnapshots.length}
                </span>
              )}
              {(fullscreenSnapshot.name || previewMarker?.name) && (
                <span className="text-gray-800 text-sm sm:text-base font-bold uppercase truncate max-w-md font-alexandria">
                  {fullscreenSnapshot.name || previewMarker?.name}
                </span>
              )}
            </div>

            {/* Zoom & Action Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-100/90 backdrop-blur-md px-2 py-1 rounded-full border border-gray-200/80 shadow-sm">
                {lightboxZoom > 1 && (
                  <button
                    onClick={() => {
                      setLightboxZoom(1);
                      setLightboxPan({ x: 0, y: 0 });
                    }}
                    className="p-1.5 text-gray-700 hover:text-[#1b365d] hover:bg-gray-200 rounded-full transition-all cursor-pointer mr-0.5"
                    title="Reset Zoom (100%)"
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
                <button
                  onClick={() =>
                    setLightboxZoom((prev) =>
                      Math.max(1, +(prev - 0.25).toFixed(2)),
                    )
                  }
                  disabled={lightboxZoom <= 1}
                  className="p-1.5 text-gray-700 hover:text-[#1b365d] hover:bg-gray-200 rounded-full transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                  title="Zoom Out"
                >
                  <ZoomOut size={18} />
                </button>
                <span className="text-[#1b365d] text-xs font-semibold px-1 min-w-[40px] text-center font-alexandria">
                  {Math.round(lightboxZoom * 100)}%
                </span>
                <button
                  onClick={() =>
                    setLightboxZoom((prev) =>
                      Math.min(3, +(prev + 0.25).toFixed(2)),
                    )
                  }
                  disabled={lightboxZoom >= 3}
                  className="p-1.5 text-gray-700 hover:text-[#1b365d] hover:bg-gray-200 rounded-full transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                  title="Zoom In"
                >
                  <ZoomIn size={18} />
                </button>
              </div>

              <button
                onClick={closeFullscreenSnapshot}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-[#1b365d] flex items-center justify-center border border-gray-200 transition-all cursor-pointer ml-2 shadow-sm"
                title="Close (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Center Image Display Area */}
          <div
            className="relative w-full flex-1 flex items-center justify-center overflow-hidden px-4 py-2"
            onMouseDown={(e) => {
              if (lightboxZoom > 1) {
                setIsLightboxDragging(true);
                setLightboxDragStart({
                  x: e.clientX - lightboxPan.x,
                  y: e.clientY - lightboxPan.y,
                });
              }
            }}
            onMouseMove={(e) => {
              if (isLightboxDragging && lightboxZoom > 1) {
                setLightboxPan({
                  x: e.clientX - lightboxDragStart.x,
                  y: e.clientY - lightboxDragStart.y,
                });
              }
            }}
            onMouseUp={() => setIsLightboxDragging(false)}
            onMouseLeave={() => setIsLightboxDragging(false)}
          >
            {/* Left Navigation Arrow */}
            {allSnapshots.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevSnapshot();
                }}
                className="absolute left-4 sm:left-8 z-50 p-3 rounded-full bg-gray-100/90 hover:bg-gray-200 text-[#1b365d] shadow-md border border-gray-200/80 transition-all cursor-pointer hover:scale-105"
                title="Previous Snapshot"
              >
                <ChevronLeft size={22} />
              </button>
            )}

            {/* Main Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                fullscreenSnapshot.file
                  ? URL.createObjectURL(fullscreenSnapshot.file)
                  : fullscreenSnapshot.variant_urls?.popup ||
                    fullscreenSnapshot.variant_urls?.landing ||
                    fullscreenSnapshot.url ||
                    (fullscreenSnapshot.file_path
                      ? fullscreenSnapshot.file_path.startsWith("http")
                        ? fullscreenSnapshot.file_path
                        : `${API_URL}/${fullscreenSnapshot.file_path}`
                      : "")
              }
              alt={fullscreenSnapshot.name || "Snapshot"}
              className={`max-h-[72vh] max-w-[90vw] object-contain transition-transform select-none ${
                lightboxZoom > 1 ? "cursor-grab active:cursor-grabbing" : ""
              }`}
              style={{
                transform: `scale(${lightboxZoom}) translate(${
                  lightboxPan.x / lightboxZoom
                }px, ${lightboxPan.y / lightboxZoom}px)`,
                transition: isLightboxDragging ? "none" : "transform 0.15s ease-out",
              }}
            />

            {/* Right Navigation Arrow */}
            {allSnapshots.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextSnapshot();
                }}
                className="absolute right-4 sm:right-8 z-50 p-3 rounded-full bg-gray-100/90 hover:bg-gray-200 text-[#1b365d] shadow-md border border-gray-200/80 transition-all cursor-pointer hover:scale-105"
                title="Next Snapshot"
              >
                <ChevronRight size={22} />
              </button>
            )}
          </div>

          {/* Bottom Info Bar: Title & Description */}
          <div className="w-full bg-white border-t border-gray-200 py-3.5 px-6 flex flex-col items-center justify-center text-center max-w-4xl mx-auto z-50">
            <h3 className="text-base sm:text-lg font-bold text-[#1b365d] uppercase tracking-wide font-alexandria">
              {fullscreenSnapshot.name || "Snapshot"}
            </h3>
            {fullscreenSnapshot.description && (
              <p className="text-xs sm:text-sm text-gray-600 font-alexandria leading-relaxed mt-1 max-w-2xl">
                {fullscreenSnapshot.description}
              </p>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default TourFloorPlans;
