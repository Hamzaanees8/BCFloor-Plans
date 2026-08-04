"use client";
import React, { useRef, useState } from "react";
import { useFileManagerContext, DroppedMarker } from "../FileManagerContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CameraIcon } from "@/components/Icons";
import { X } from "lucide-react";
import { toast } from "sonner";
import { DeleteSnapshot } from "../file-manager";



import { useAppContext } from "@/app/context/AppContext";
import { OptimizedImagePreview, PdfPlaceholder } from "./OptimizedPreview";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";



function TourFloorPlans({ type = "" }) {
  const { userType } = useAppContext();
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const { droppedMarkers, setDroppedMarkers, filesData, setFilesData, selectedFiles, floorFiles, deletedSnapshotUuids, setDeletedSnapshotUuids } = useFileManagerContext();

  const currentTourFloorFiles = [
    ...(filesData?.files?.filter(file => {
      const isFloorPlan =
        file?.service?.category?.name === "Floor Plan" ||
        file?.service?.name?.toLowerCase().includes("floor plan");
      return file.type === 'photo' && isFloorPlan;
    }) || []),
    ...floorFiles.filter(f => !f.is_deleted)
  ];

  let photosList = [
    ...(filesData?.files?.filter(file => {
      const isFloorPlan =
        file?.service?.category?.name === "Floor Plan" ||
        file?.service?.name?.toLowerCase().includes("floor plan");
      return file.type === 'photo' && !isFloorPlan;
    }) || []),
    ...selectedFiles.filter(f => !f.is_deleted && f.upload !== false)
  ];

  let filteredFloorFiles = currentTourFloorFiles;

  if (userType === 'agent') {
    photosList = photosList.filter(file => 'uuid' in file ? (file.is_agent_approved || file.is_complimentary) : true);
    filteredFloorFiles = filteredFloorFiles.filter(file => 'uuid' in file ? (file.is_agent_approved || file.is_complimentary) : true);
  }

  filteredFloorFiles = filteredFloorFiles.sort((a, b) => ((a as any).sort_order || 0) - ((b as any).sort_order || 0));

  const currentTourPhotos = photosList.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const [draggedFile, setDraggedFile] = useState<{ file?: File; file_path?: string; url?: string; thumbnail_url?: string; variant_urls?: any } | null>(null);

  const [selectedImageId, setSelectedImageId] = useState<string | null>(() => {
    if ((filteredFloorFiles?.length ?? 0) > 0) {
      const firstFile = filteredFloorFiles[0];
      return 'uuid' in firstFile ? firstFile.name : (firstFile as any).file.name;
    }
    return null;
  });
  console.log('droppedMarkers', droppedMarkers);

  const [snapshotFile, setSnapshotFile] = useState<File | null>(null);
  const [snapshotName, setSnapshotName] = useState("");
  const [snapshotDescription, setSnapshotDescription] = useState("");
  const [activeMarkerIndex, setActiveMarkerIndex] = useState<number | null>(
    null
  );
  const [activeApiSnapshotUuid, setActiveApiSnapshotUuid] = useState<string | null>(null);
  const [tempMarkerPos, setTempMarkerPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [previewMarker, setPreviewMarker] = useState<DroppedMarker | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
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

  const handleSelectPhotoForClick = (file: any) => {
    if (!clickPos || !selectedImageId) return;

    const newMarker: DroppedMarker = {
      x: clickPos.x,
      y: clickPos.y,
      floorImageUrl: selectedImageId,
      name: '',
      description: '',
    };

    if ('file' in file || !('uuid' in file)) {
      newMarker.file = file.file;
    } else {
      newMarker.file_path = file.file_path;
      newMarker.url = file.url || file.variant_urls?.landing || file.variant_urls?.popup || file.variant_urls?.thumb;
      newMarker.thumbnail_url = file.variant_urls?.popup || file.variant_urls?.thumb || file.thumbnail_url || file.url;
      newMarker.variant_urls = file.variant_urls;
      newMarker.isApi = true;
    }

    setDroppedMarkers(prev => {
      const newArr = [...prev, newMarker];
      const newIndex = newArr.length - 1;
      setActiveMarkerIndex(newIndex);

      setSnapshotFile(file.file || null);
      setSnapshotName('');
      setSnapshotDescription('');
      setTempMarkerPos({ x: clickPos.x, y: clickPos.y });
      setPreviewMarker(newMarker);
      return newArr;
    });

    setShowPhotoSelector(false);
    setClickPos(null);
    toast.success("Snapshot placed! Add a name and description, then click Add.");
  };

  const imageContainerRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

  // Utility function to check if a file is a PDF
  const isPDF = (file: any): boolean => {
    if (!file) return false;
    const isLocal = !!file.file;
    if (isLocal) {
      return file.file.type === 'application/pdf' || file.file.name.toLowerCase().endsWith('.pdf');
    }
    return file.file_path?.toLowerCase().endsWith('.pdf') || file.type === 'pdf' || file.type === 'application/pdf';
  };


  const normalizeName = (filename: string) => {
    if (!filename) return "";
    return filename.replace(/\.[^/.]+$/, ""); // strip extension
  };

  const localSnapshots = droppedMarkers.filter(
    (marker) => normalizeName(marker.floorImageUrl) === normalizeName(selectedImageId || "")
  );


  const apiSnapshots = (filesData?.snapshots || []).filter((snap) =>
    normalizeName(snap.file_name) === normalizeName(selectedImageId || "") && !deletedSnapshotUuids.has(snap.uuid)
  );



  const imgRef = useRef<HTMLImageElement | null>(null);


  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedFile || !imgRef.current || !selectedImageId) return;

    const img = imgRef.current;
    const imgRect = img.getBoundingClientRect();

    const relX = e.clientX - imgRect.left;
    const relY = e.clientY - imgRect.top;

    const xPercent = (relX / imgRect.width) * 100;
    const yPercent = (relY / imgRect.height) * 100;

    const newMarker: DroppedMarker = {
      x: xPercent,
      y: yPercent,
      floorImageUrl: selectedImageId,
      name: '',
      description: '',
    };

    if (draggedFile.file) {
      newMarker.file = draggedFile.file;
    } else if (draggedFile.file_path || draggedFile.url || draggedFile.thumbnail_url) {
      newMarker.file_path = draggedFile.file_path;
      newMarker.url = draggedFile.url;
      newMarker.thumbnail_url = draggedFile.thumbnail_url;
      newMarker.variant_urls = (draggedFile as any).variant_urls;
      newMarker.isApi = true;
    }

    setDroppedMarkers(prev => {
      const newArr = [...prev, newMarker];
      const newIndex = newArr.length - 1;
      setActiveMarkerIndex(newIndex);

      setSnapshotFile(draggedFile.file || null);
      setSnapshotName('');
      setSnapshotDescription('');
      setTempMarkerPos({ x: xPercent, y: yPercent });
      setPreviewMarker(newMarker);
      return newArr;
    });

    setDraggedFile(null);
  };

  const handlePhotoClick = (file: any) => {
    // Only handle replacement if a snapshot is currently selected for editing
    if (activeMarkerIndex === null && !activeApiSnapshotUuid) return;

    if ('uuid' in file) {
      // Server file
      setSnapshotFile(null);
      if (previewMarker) {
        setPreviewMarker({
          ...previewMarker,
          file: undefined,
          isApi: true,
          file_path: file.file_path,
          url: file.url || file.variant_urls?.landing || file.variant_urls?.popup || file.variant_urls?.thumb,
          thumbnail_url: file.variant_urls?.popup || file.variant_urls?.thumb || file.thumbnail_url || file.url,
          variant_urls: file.variant_urls
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
          file_path: undefined
        });
      }
    }
    toast.info("Snapshot image replaced. Click Update to save.");
  };

  const handleSnapshotImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedFile) return;

    if (draggedFile.file) {
      setSnapshotFile(draggedFile.file);
      if (previewMarker) {
        setPreviewMarker({ ...previewMarker, file: draggedFile.file, isApi: false, url: undefined, file_path: undefined });
      }
    } else {
      setSnapshotFile(null);
      if (previewMarker) {
        setPreviewMarker({
          ...previewMarker,
          file: undefined,
          isApi: true,
          file_path: draggedFile.file_path,
          url: draggedFile.url,
          thumbnail_url: draggedFile.thumbnail_url,
          variant_urls: draggedFile.variant_urls
        });
      }
    }
    setDraggedFile(null);
    toast.info("Snapshot image updated");
  };





  const handleAddSnapshot = () => {
    if (!selectedImageId || !tempMarkerPos) return;

    const newMarker: DroppedMarker = {
      ...(activeMarkerIndex !== null ? droppedMarkers[activeMarkerIndex] : (previewMarker || {})),
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
    } else if (previewMarker?.file_path || previewMarker?.url || previewMarker?.thumbnail_url) {
      newMarker.file_path = previewMarker.file_path;
      newMarker.isApi = true;
      newMarker.thumbnail_url = previewMarker.thumbnail_url;
      newMarker.url = previewMarker.url;
      newMarker.variant_urls = previewMarker.variant_urls;
    }

    if (activeApiSnapshotUuid) {
      newMarker.uuid = activeApiSnapshotUuid;
      // Migrate API snapshot to local droppedMarkers and mark original as deleted
      setDeletedSnapshotUuids(prev => {
        const next = new Set(prev);
        next.add(activeApiSnapshotUuid);
        return next;
      });

      setDroppedMarkers(prev => {
        const updated = [...prev, newMarker];
        setActiveMarkerIndex(updated.length - 1);
        return updated;
      });

      setActiveApiSnapshotUuid(null);
      toast.success('Existing snapshot updated');
    } else {
      setDroppedMarkers(prev => {
        if (activeMarkerIndex !== null && prev[activeMarkerIndex]) {
          const updated = [...prev];
          updated[activeMarkerIndex] = {
            ...updated[activeMarkerIndex],
            ...newMarker,
          };
          return updated;
        } else {
          return [...prev, newMarker];
        }
      });
      toast.success('Snapshot saved successfully');
    }

    setPreviewMarker(newMarker);
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
            snapshots: filesData.snapshots.filter(s => s.uuid !== activeApiSnapshotUuid)
          });
        }

        toast.success('Snapshot deleted successfully');
      } catch (error) {
        console.error("Error deleting snapshot:", error);
        toast.error("Failed to delete snapshot");
        return; // Don't clear fields if API fails
      }
    } else if (activeMarkerIndex !== null) {
      setDroppedMarkers(prev => {
        const newMarkers = prev.filter((_, i) => i !== activeMarkerIndex);
        return newMarkers;
      });
      toast.success('Snapshot removed');
    }

    setActiveMarkerIndex(null);
    setActiveApiSnapshotUuid(null);
    setSnapshotFile(null);
    setSnapshotName('');
    setSnapshotDescription('');
    setTempMarkerPos(null);
    setPreviewMarker(null);
  };



  const selectedFile = filteredFloorFiles?.find(
    (f) => ('uuid' in f ? f.name : (f as any).file.name) === selectedImageId
  );

  const isSelectedFilePDF = selectedFile ? isPDF(selectedFile) : false;

  if (!filteredFloorFiles || filteredFloorFiles?.length === 0) {
    const allFloorPlans = filesData?.files?.filter(file => {
      const isFloorPlan = file?.service?.category?.name === "Floor Plan" || file?.service?.name?.toLowerCase().includes("floor plan");
      return file.type === 'photo' && isFloorPlan;
    }) || [];
    if (userType === 'agent') {
      if (allFloorPlans.length > 0) {
        return (
          <div className="font-alexandria w-full h-[50vh] text-[#4290E9] flex justify-center items-center font-[500] text-[18px]">
            <p>You have not approved any floor plans yet. Go to Floor Plan service and approve media.</p>
          </div>
        );
      } else {
        return (
          <div className="font-alexandria w-full h-[50vh] text-[#E06D5E] flex justify-center items-center font-[500] text-[18px]">
            <p>Vendor has not uploaded any floor plans yet.</p>
          </div>
        );
      }
    }
    return (
      <div className="font-alexandria w-full h-[50vh] text-gray-500 flex justify-center items-center">
        <p>No Floor Photo found — please add Floor Photos or select a Floor Plan service.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {userType === 'vendor' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute inset-0 z-10 cursor-default" onPointerDown={(e) => e.preventDefault()} onClick={(e) => e.preventDefault()} />
          </TooltipTrigger>
          <TooltipContent>You don&apos;t have permission to change this setting</TooltipContent>
        </Tooltip>
      )}
      <div className={userType === 'vendor' ? 'pointer-events-none select-none' : ''}>
    <div className={`w-full h-auto font-alexandria bg-gray-100 py-6  ${type !== "confirm" ? "pl-6" : "pl-0 mt-[75px] pt-0"}`}>
      {type !== "confirm" && (
        <div className="mb-6 mr-6 bg-[#E3F2FD] border-l-4 border-[#1E88E5] text-[#1565C0] p-4 rounded-r-lg shadow-sm flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 text-[#1E88E5] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="font-semibold block text-[15px] mb-0.5">Quick Guide: How to Attach Snapshots</span>
            <p className="text-[13.5px] leading-relaxed">
              Drag and drop any photo from the <strong>Photos</strong> gallery below onto the desired position on the floor plan image to attach it as a snapshot. Alternatively, you can <strong>double-click or tap</strong> anywhere on the floor plan to select a photo directly.
            </p>
          </div>
        </div>
      )}
      <div className={`w-full h-auto md:h-[550px] flex flex-col md:flex-row gap-[30px] ${type === "confirm" ? "bg-white" : ""} `}>
        <div
          ref={imageContainerRef}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`relative w-full md:w-[70%] border border-gray-200 h-[300px] sm:h-full bg-white overflow-visible ${type === "confirm" ? "m-auto" : ""}`}
        >
          {selectedFile && 'uuid' in selectedFile && selectedFile.is_processing ? (
            <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
              <p className="text-gray-500 font-medium text-sm">Processing...</p>
            </div>
          ) : isSelectedFilePDF && selectedFile ? (
            ('uuid' in selectedFile && (!selectedFile.variant_urls || (Array.isArray(selectedFile.variant_urls) && selectedFile.variant_urls.length === 0) || Object.keys(selectedFile.variant_urls).length === 0)) ? (
              <PdfPlaceholder
                className="w-full h-full"
                message="service is not paid yet"
              />
            ) : (
              <iframe
                src={
                  'uuid' in selectedFile
                    ? `${selectedFile.variant_urls?.popup || selectedFile.url || (selectedFile.file_path ? `${API_URL}/${selectedFile.file_path}` : '')}#toolbar=0`
                    : URL.createObjectURL((selectedFile as any).file)
                }
                className="w-full h-full border-0"
                title="Floor Plan PDF"
              />
            )
          ) : (
            selectedFile && !('uuid' in selectedFile) ? (
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
                    ? ('uuid' in selectedFile
                      ? selectedFile.variant_urls?.popup || selectedFile.url || (selectedFile.file_path ? `${API_URL}/${selectedFile.file_path}` : '')
                      : URL.createObjectURL((selectedFile as any).file))
                    : ""
                }
                alt="Selected Floor"
                className="object-contain max-h-full max-w-full w-full h-full cursor-pointer"
                onDoubleClick={handleImageDoubleClick}
              />
            )
          )}
          {[...localSnapshots, ...apiSnapshots].map((marker, idx) => {
            const isApiSnapshot = 'x_axis' in marker;
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
                onClick={() => {
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
                    setTempMarkerPos({ x: Number(marker.x_axis), y: Number(marker.y_axis) });
                    setActiveMarkerIndex(null);
                    setActiveApiSnapshotUuid(marker.uuid);
                  } else {
                    const originalIndex = droppedMarkers.findIndex((m) => m === marker);
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
              className="bg-[#565656] text-white font-alexandria shadow-lg w-[90vw] max-w-[500px] min-w-[300px] h-auto absolute flex flex-col z-[100] rounded-lg overflow-hidden transition-all duration-300"
              style={isMobile ? {
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
              } : {
                top: previewMarker.y > 50 ? 'auto' : `calc(${previewMarker.y}% - 24px)`,
                bottom: previewMarker.y > 50 ? `calc(${100 - previewMarker.y}%)` : 'auto',
                left: previewMarker.x > 50 ? 'auto' : `calc(${previewMarker.x}% + 15px)`,
                right: previewMarker.x > 50 ? `calc(${100 - previewMarker.x}% + 15px)` : 'auto',
              }}
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
                      : previewMarker.variant_urls?.popup || previewMarker.variant_urls?.landing || previewMarker.url || (previewMarker.file_path
                        ? (previewMarker.file_path.startsWith('http') ? previewMarker.file_path : `${API_URL}/${previewMarker.file_path}`)
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
            <p className="mb-[20px] text-[24px]">SnapShot</p>
            <div className="flex items-end gap-5">
              <div
                onDrop={handleSnapshotImageDrop}
                onDragOver={(e) => e.preventDefault()}
                className="mt-4 border p-2 rounded relative w-[200px] h-[150px] bg-gray-100 overflow-hidden flex items-center justify-center cursor-pointer group"
              >
                {snapshotFile ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={URL.createObjectURL(snapshotFile)} alt="Snapshot Preview" className="w-full h-full object-cover" />
                ) : previewMarker?.file ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={URL.createObjectURL(previewMarker.file)} alt="Snapshot Preview" className="w-full h-full object-cover" />
                ) : (previewMarker) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewMarker.variant_urls?.popup || previewMarker.variant_urls?.landing || previewMarker.variant_urls?.thumb || previewMarker.url || previewMarker.thumbnail_url || (previewMarker.file_path ? (previewMarker.file_path.startsWith('http') ? previewMarker.file_path : `${API_URL}/${previewMarker.file_path}`) : "")} alt="Snapshot Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400 text-xs text-center">No snapshot selected</div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <p className="text-white text-[10px] font-bold">Drop photo to update</p>
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
            <div className="flex justify-end gap-5 mt-5">
              <Button
                onClick={handleAddSnapshot}
                className="bg-[#4290E9] hover:bg-[#4898f3]"
              >
                {(activeMarkerIndex !== null || activeApiSnapshotUuid) ? "Update" : "Add"}
              </Button>
              <Button
                onClick={handleDeleteSnapshot}
                className="bg-[#E06D5E] hover:bg-[#f0796a]"
              >
                Delete Snapshot
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="w-full h-auto my-[20px] px-4 md:px-0">
        <div className={`h-full flex items-center gap-[20px] overflow-x-auto overflow-y-hidden pb-2 whitespace-nowrap scrollbar-none ${type === "confirm" ? "w-full" : "w-full md:w-[70%]"}`}>

          {filteredFloorFiles?.map((file, idx) => {
            const isFilePDF = isPDF(file);
            const fileName = 'uuid' in file ? file.name : (file as any).file.name;
            return (
              <div
                key={idx}
                onClick={() => setSelectedImageId(fileName)}
                className={`w-[200px] h-[100px] flex items-center rounded-[6px] justify-center cursor-pointer ${selectedImageId === fileName ? "border-2 border-[#4290E9]" : ""}`}
              >
                <div className="relative border border-gray-200 rounded-[6px] w-full h-full flex items-center justify-center">
                  {'uuid' in file && file.is_processing ? (
                    <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                      <p className="text-gray-500 font-medium text-xs">Processing...</p>
                    </div>
                  ) : isFilePDF ? (
                    ('uuid' in file && (!file.variant_urls || (Array.isArray(file.variant_urls) && file.variant_urls.length === 0) || Object.keys(file.variant_urls).length === 0)) ? (
                      <PdfPlaceholder
                        className="w-full h-full"
                        message="service is not paid yet"
                      />
                    ) : (
                      <div className="relative w-full h-full overflow-hidden">
                        <iframe
                          src={
                            'uuid' in file
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
                  ) : (
                    !('uuid' in file) ? (
                      <OptimizedImagePreview
                        file={(file as any).file}
                        className="max-w-full max-h-full"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={
                          'uuid' in file
                            ? file.variant_urls?.thumb || file.thumbnail_url || file.url || (file.file_path ? `${API_URL}/${file.file_path}` : '')
                            : URL.createObjectURL((file as any).file)
                        }
                        alt="preview"
                        className="max-w-full max-h-full"
                      />
                    )
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
                const isEditing = activeMarkerIndex !== null || !!activeApiSnapshotUuid;
                return (
                  <div
                    key={idx}
                    className={`bg-[#BBBBBB] h-auto relative transition-all duration-200 ${isEditing
                      ? "cursor-pointer ring-2 ring-transparent hover:ring-[#4290E9] scale-[0.98] hover:scale-100"
                      : "cursor-grab active:cursor-grabbing"
                      }`}
                    onClick={() => handlePhotoClick(file)}
                  >
                    <div className="relative w-full h-[160px]">
                      {!('uuid' in file) ? (
                        <OptimizedImagePreview
                          file={(file as any).file}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", (file as any).file.name);
                            setDraggedFile({
                              file: (file as any).file,
                              thumbnail_url: URL.createObjectURL((file as any).file),
                              url: URL.createObjectURL((file as any).file)
                            });
                            imageContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", file.uuid);
                            setDraggedFile({
                              file_path: file.file_path || (file as any).variants?.thumb || (file as any).variants?.landing || (file as any).variants?.popup,
                              url: file.url || file.variant_urls?.landing || file.variant_urls?.popup || file.variant_urls?.thumb,
                              thumbnail_url: file.variant_urls?.popup || file.variant_urls?.thumb || file.thumbnail_url || file.url,
                              variant_urls: file.variant_urls
                            });
                            imageContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          src={
                            file.variant_urls?.thumb || file.url || (file.file_path ? `${API_URL}/${file.file_path}` : '')
                          }
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      )}

                      {isEditing && (
                        <div className="absolute inset-0 bg-[#4290E9]/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                          <span className="text-white text-[12px] font-bold bg-[#4290E9] px-3 py-1 rounded shadow-lg">CLICK TO USE</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 mx-3 border border-dashed border-gray-300 bg-white rounded-lg p-8 text-center text-[#666666] font-medium text-[14px] flex flex-col items-center justify-center gap-3">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z" />
              </svg>
              <span>No Photo is available to attach as snapshot, please select / approve some photos from the available media.</span>
            </div>
          )}
        </div>
      )}

      {showPhotoSelector && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center font-alexandria p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Select Snapshot Photo</h3>
                <p className="text-xs text-gray-500 mt-0.5">Click any photo below to attach it to the selected floor plan coordinates</p>
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
                    const isLocal = !('uuid' in file);
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
                                file.variant_urls?.thumb || file.url || (file.file_path ? `${API_URL}/${file.file_path}` : '')
                              }
                              alt="preview"
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-[#4290E9]/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white text-[11px] font-bold bg-[#4290E9] px-2.5 py-1 rounded shadow">USE PHOTO</span>
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
    </div>
  );
}

export default TourFloorPlans;
