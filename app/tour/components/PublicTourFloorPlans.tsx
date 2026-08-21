"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { CameraIcon } from "@/components/Icons";
import { FileText, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Snapshoots } from "../PublicTour";

export interface FloorPlanFile {
    id: number;
    uuid: string;
    tour_id: number;
    type: string;
    name: string;
    file_path: string;
    url?: string;
    thumbnail_url?: string;
    variant_urls?: {
        thumb?: string;
        popup?: string;
        slider?: string;
        landing?: string;
    };
    group: string | null;
    service_id: number;
    sort_order: number;
    created_at: string;
    updated_at: string;
    is_featured: boolean;
    is_processing?: boolean;
}

export interface Marker {
    x: number;
    y: number;
    file_path?: string;
    floorImageUrl: string;
    name?: string;
    description?: string;
    isApi?: boolean;
    variant_urls?: {
        thumb?: string;
        popup?: string;
        slider?: string;
        landing?: string;
    };
}

interface PublicTourFloorPlansProps {
    floorPlanFiles?: FloorPlanFile[];
    snapshots?: Snapshoots[];
    tourPhotos?: any[];
    watermarkLogo?: string;
}

// PDF Placeholder component
function PdfPlaceholder({ className = '', onClick }: { className?: string; onClick?: () => void }) {
    return (
        <div className={`flex items-center justify-center bg-gray-100 ${className}`} onClick={onClick}>
            <div className="flex flex-col items-center gap-2">
                <div className="bg-red-50 rounded-full p-4">
                    <FileText className="w-8 h-8 text-red-500" />
                </div>
                <span className="text-gray-500 text-xs font-bold font-alexandria">PDF Document</span>
            </div>
        </div>
    );
}

function PublicTourFloorPlans({
    floorPlanFiles = [],
    snapshots = [],
}: PublicTourFloorPlansProps) {
    const [isMobile, setIsMobile] = useState(false);
    React.useEffect(() => {
        if (typeof window === "undefined") return;
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Filter out PDF files and sort by sort_order
    const filteredFloorPlanFiles = floorPlanFiles
        .filter(file => file.type !== 'pdf' && !file.file_path?.toLowerCase().endsWith('.pdf'))
        .sort((a, b) => {
            const orderA = a.sort_order !== undefined && a.sort_order !== null ? Number(a.sort_order) : 999999;
            const orderB = b.sort_order !== undefined && b.sort_order !== null ? Number(b.sort_order) : 999999;
            if (orderA !== orderB) return orderA - orderB;
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateA - dateB;
        });

    const [selectedImageId, setSelectedImageId] = useState<string | null>(() => {
        if (filteredFloorPlanFiles?.length > 0) {
            return filteredFloorPlanFiles[0].name;
        }
        return null;
    });

    React.useEffect(() => {
        if (!selectedImageId && filteredFloorPlanFiles?.length > 0) {
            setSelectedImageId(filteredFloorPlanFiles[0].name);
        }
    }, [filteredFloorPlanFiles, selectedImageId]);

    const [localMarkers] = useState<any[]>([]);
    const [previewMarker, setPreviewMarker] = useState<Marker | null>(null);

    // Zoom & Pan State
    const [zoomScale, setZoomScale] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const imageContainerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMarkerMouseEnter = (snapshot: any) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setPreviewMarker({
            x: Number(snapshot.x_axis),
            y: Number(snapshot.y_axis),
            file_path: snapshot.file_path,
            floorImageUrl: snapshot.file_name,
            name: snapshot.name,
            description: snapshot.description,
            isApi: true,
            variant_urls: snapshot.variant_urls,
        });
    };

    const handleMarkerMouseLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setPreviewMarker(null);
        }, 150);
    };

    const handlePopupMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    const handlePopupMouseLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setPreviewMarker(null);
        }, 150);
    };

    const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

    // Reset zoom and pan when floorplan changes
    const handleSelectFloorplan = (name: string) => {
        setSelectedImageId(name);
        setPreviewMarker(null);
        setZoomScale(1);
        setPanOffset({ x: 0, y: 0 });
    };

    const handleZoomIn = () => {
        setZoomScale((prev) => Math.min(3, +(prev + 0.25).toFixed(2)));
    };

    const handleZoomOut = () => {
        setZoomScale((prev) => {
            const next = Math.max(1, +(prev - 0.25).toFixed(2));
            if (next === 1) setPanOffset({ x: 0, y: 0 });
            return next;
        });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoomScale <= 1) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || zoomScale <= 1) return;
        setPanOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Utility function to check if a file is a PDF
    const isPDF = (filePath: string): boolean => {
        if (!filePath) return false;
        return filePath?.toLowerCase().endsWith('.pdf');
    };

    const normalizeName = (filename: string) => {
        if (!filename) return "";
        return filename.replace(/\.[^/.]+$/, ""); // strip extension
    };

    const getFilteredSnapshots = () => {
        if (!selectedImageId) return [];

        return snapshots.filter((snapshot) =>
            normalizeName(snapshot.file_name) === normalizeName(selectedImageId)
        );
    };

    const filteredSnapshots = getFilteredSnapshots();
    const currentLocalSnapshots = localMarkers.filter(m => normalizeName(m.floorImageUrl) === normalizeName(selectedImageId || ""));
    const allSnapshots = React.useMemo(() => [...filteredSnapshots, ...currentLocalSnapshots], [filteredSnapshots, currentLocalSnapshots]);

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
            : allSnapshots.findIndex(s => s === snap || (s.file_path && s.file_path === snap.file_path));
        setFullscreenSnapshot(snap);
        setFullscreenSnapshotIndex(foundIdx >= 0 ? foundIdx : 0);
        setLightboxZoom(1);
        setLightboxPan({ x: 0, y: 0 });
    };

    const closeFullscreenSnapshot = useCallback(() => {
        setFullscreenSnapshot(null);
        setLightboxZoom(1);
        setLightboxPan({ x: 0, y: 0 });
    }, []);

    const handleNextSnapshot = useCallback(() => {
        if (allSnapshots.length === 0) return;
        const nextIdx = (fullscreenSnapshotIndex + 1) % allSnapshots.length;
        setFullscreenSnapshotIndex(nextIdx);
        setFullscreenSnapshot(allSnapshots[nextIdx]);
        setLightboxZoom(1);
        setLightboxPan({ x: 0, y: 0 });
    }, [allSnapshots, fullscreenSnapshotIndex]);

    const handlePrevSnapshot = useCallback(() => {
        if (allSnapshots.length === 0) return;
        const prevIdx = (fullscreenSnapshotIndex - 1 + allSnapshots.length) % allSnapshots.length;
        setFullscreenSnapshotIndex(prevIdx);
        setFullscreenSnapshot(allSnapshots[prevIdx]);
        setLightboxZoom(1);
        setLightboxPan({ x: 0, y: 0 });
    }, [allSnapshots, fullscreenSnapshotIndex]);

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
    }, [fullscreenSnapshot, closeFullscreenSnapshot, handleNextSnapshot, handlePrevSnapshot]);

    const selectedFile = filteredFloorPlanFiles?.find((f) => f.name === selectedImageId);
    const isSelectedFilePDF = selectedFile ? isPDF(selectedFile.file_path) : false;

    if (filteredFloorPlanFiles?.length === 0) {
        return (
            <div className="font-alexandria w-full h-[50vh] text-gray-500 flex justify-center items-center">
                <p>No floor plans available.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-auto font-alexandria max-w-7xl mx-auto px-2 sm:px-6 md:px-8 pb-12">
            {/* Main Floor Plan Card */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px] md:min-h-[520px] w-full">
                {/* Top Right Zoom Controls */}
                {!isSelectedFilePDF && (
                    <div className="absolute top-4 right-4 z-40 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-200/80 shadow-md">
                        <button
                            onClick={handleZoomOut}
                            disabled={zoomScale <= 1}
                            className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-35 transition-all cursor-pointer disabled:cursor-not-allowed"
                            title="Zoom Out"
                        >
                            <ZoomOut size={17} />
                        </button>
                        <span className="text-xs font-bold text-gray-700 w-12 text-center select-none font-alexandria">
                            {Math.round(zoomScale * 100)}%
                        </span>
                        <button
                            onClick={handleZoomIn}
                            disabled={zoomScale >= 3}
                            className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-35 transition-all cursor-pointer disabled:cursor-not-allowed"
                            title="Zoom In"
                        >
                            <ZoomIn size={17} />
                        </button>
                    </div>
                )}

                {/* Floor Plan Display Area */}
                <div
                    ref={imageContainerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className={`relative w-full flex items-center justify-center overflow-hidden select-none ${zoomScale > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
                    style={{ minHeight: "360px" }}
                >
                    {selectedFile && (
                        <>
                            {selectedFile.is_processing ? (
                                <div className="w-full h-[360px] flex flex-col gap-2 items-center justify-center bg-gray-100 rounded-xl">
                                    <p className="text-gray-500 font-medium text-sm">Processing floor plan...</p>
                                </div>
                            ) : isSelectedFilePDF ? (
                                <iframe
                                    src={`${selectedFile.variant_urls?.popup || selectedFile.url || `${API_URL}/${selectedFile.file_path}`}#toolbar=0`}
                                    className="w-full h-[650px] border-0 rounded-xl"
                                    title="Floor Plan PDF"
                                />
                            ) : (
                                <div
                                    style={{
                                        transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`,
                                        transformOrigin: "center center",
                                        transition: isDragging ? "none" : "transform 0.15s ease-out",
                                    }}
                                    className="relative inline-block max-w-full"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        ref={imgRef}
                                        loading="lazy"
                                        src={selectedFile.variant_urls?.landing || selectedFile.variant_urls?.popup || selectedFile.url || `${API_URL}/${selectedFile.file_path}`}
                                        alt="Selected Floor Plan"
                                        className="object-contain max-h-[75vh] max-w-full w-auto h-auto mx-auto rounded-lg select-none pointer-events-none"
                                        draggable={false}
                                    />
                                    {/* Client requested to remove bottom-right branding watermark; commented out in case they want it back later
                                    {_watermarkLogo && (
                                        <>
                                            <img
                                                src={_watermarkLogo}
                                                alt="Watermark"
                                                className="absolute bottom-4 right-4 w-[120px] sm:w-[150px] object-contain opacity-60 pointer-events-none z-[50]"
                                            />
                                        </>
                                    )}
                                    */}

                                    {/* Render camera snapshot markers */}
                                    {[...filteredSnapshots, ...currentLocalSnapshots].map((snapshot, idx) => (
                                        <div
                                            key={idx}
                                            className="absolute cursor-pointer hover:scale-125 transition-transform z-10"
                                            style={{
                                                top: `${snapshot.y_axis}%`,
                                                left: `${snapshot.x_axis}%`,
                                                transform: "translate(-50%, -100%)",
                                            }}
                                            onMouseEnter={() => handleMarkerMouseEnter(snapshot)}
                                            onMouseLeave={handleMarkerMouseLeave}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openFullscreenSnapshot(snapshot, idx);
                                            }}
                                        >
                                            <CameraIcon width={24} height={24} />
                                        </div>
                                    ))}
                                    {/* Marker Snapshot Lightbox Modal anchored to camera icon */}
                                    {previewMarker && (
                                        <div
                                            onMouseEnter={handlePopupMouseEnter}
                                            onMouseLeave={handlePopupMouseLeave}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openFullscreenSnapshot(previewMarker);
                                            }}
                                            className="bg-[#242424] text-white font-alexandria shadow-2xl w-fit max-w-[90vw] sm:max-w-[420px] h-auto flex flex-col rounded-none border border-white/20 transition-all duration-200 animate-in fade-in cursor-pointer"
                                            style={
                                                isMobile
                                                    ? {
                                                          position: "fixed",
                                                          bottom: "16px",
                                                          left: "50%",
                                                          transform: "translateX(-50%)",
                                                          zIndex: 100,
                                                      }
                                                    : {
                                                          position: "absolute",
                                                          left: `${previewMarker.x}%`,
                                                          top: `${previewMarker.y}%`,
                                                          transform: `translate(${previewMarker.x <= 50 ? "14px" : "calc(-100% - 14px)"}, ${previewMarker.y <= 50 ? "0px" : "calc(-100% - 14px)"}) scale(${1 / zoomScale})`,
                                                          transformOrigin: `${previewMarker.x <= 50 ? "left" : "right"} ${previewMarker.y <= 50 ? "top" : "bottom"}`,
                                                          zIndex: 100,
                                                      }
                                            }
                                        >
                                            {/* Close button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewMarker(null);
                                                }}
                                                className="absolute top-2 right-2 text-white bg-black/70 hover:bg-black/90 rounded-none z-20 p-1.5 transition-colors cursor-pointer shadow-md"
                                                title="Close"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>

                                            {previewMarker.file_path && (
                                                <div className="p-3 sm:p-3.5 pb-0 flex items-center justify-center">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        loading="lazy"
                                                        src={previewMarker.variant_urls?.popup || previewMarker.variant_urls?.landing || previewMarker.file_path}
                                                        alt={previewMarker.name || "Snapshot"}
                                                        className="w-auto h-auto max-h-[280px] max-w-[calc(90vw-28px)] sm:max-w-[390px] object-contain block rounded-none select-none"
                                                    />
                                                </div>
                                            )}

                                            <div className="p-3 sm:p-3.5 pt-2.5 bg-[#242424]">
                                                <p className="text-sm sm:text-base font-bold uppercase pb-0.5 break-words text-white">
                                                    {previewMarker?.name || "Snapshot"}
                                                </p>
                                                {previewMarker?.description ? (
                                                    <p className="text-xs sm:text-sm text-gray-300 break-words leading-relaxed mt-0.5">
                                                        {previewMarker.description}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Bottom Thumbnails Carousel */}
            {filteredFloorPlanFiles.length > 1 && (
                <div className="w-full mt-6 bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm">
                    <div className="w-full flex items-center gap-4 overflow-x-auto overflow-y-hidden p-2 whitespace-nowrap scrollbar-none">
                        {filteredFloorPlanFiles.map((file, idx) => {
                            const isFilePDF = isPDF(file.file_path);
                            const isSelected = selectedImageId === file.name;
                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleSelectFloorplan(file.name)}
                                    className={`shrink-0 w-[160px] sm:w-[200px] h-[100px] sm:h-[120px] rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-200 relative ${
                                        isSelected
                                            ? "border-2 border-[#4290E9] shadow-md bg-blue-50/20"
                                            : "border border-gray-200 hover:border-gray-300 hover:shadow-sm bg-gray-50"
                                    }`}
                                >
                                    <div className="relative w-full h-full flex items-center justify-center p-2">
                                        {file.is_processing ? (
                                            <div className="w-full h-full flex flex-col gap-1 items-center justify-center bg-gray-100 rounded-lg">
                                                <p className="text-gray-400 font-medium text-xs">Processing...</p>
                                            </div>
                                        ) : isFilePDF ? (
                                            <PdfPlaceholder className="w-full h-full rounded-lg" />
                                        ) : (
                                            <>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={file.variant_urls?.thumb || file.thumbnail_url || file.url || `${API_URL}/${file.file_path}`}
                                                    alt={`Floor Plan ${idx + 1}`}
                                                    className="max-w-full max-h-full object-contain select-none"
                                                />
                                                {snapshots.some(s => normalizeName(s.file_name) === normalizeName(file.name)) && (
                                                    <div className="absolute top-2 right-2 bg-[#1b365d] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                                        {snapshots.filter(s => normalizeName(s.file_name) === normalizeName(file.name)).length}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {/* Fullscreen Snapshot Lightbox Modal via Portal */}
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
                                        onClick={() => { setLightboxZoom(1); setLightboxPan({ x: 0, y: 0 }); }}
                                        className="p-1.5 text-gray-700 hover:text-[#1b365d] hover:bg-gray-200 rounded-full transition-all cursor-pointer mr-0.5"
                                        title="Reset Zoom (100%)"
                                    >
                                        <RotateCcw size={15} />
                                    </button>
                                )}
                                <button
                                    onClick={() => setLightboxZoom(prev => Math.max(1, +(prev - 0.25).toFixed(2)))}
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
                                    onClick={() => setLightboxZoom(prev => Math.min(3, +(prev + 0.25).toFixed(2)))}
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
                                onClick={(e) => { e.stopPropagation(); handlePrevSnapshot(); }}
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
                                fullscreenSnapshot.variant_urls?.popup ||
                                fullscreenSnapshot.variant_urls?.landing ||
                                fullscreenSnapshot.url ||
                                (fullscreenSnapshot.file_path
                                    ? (fullscreenSnapshot.file_path.startsWith("http") ? fullscreenSnapshot.file_path : `${API_URL}/${fullscreenSnapshot.file_path}`)
                                    : "")
                            }
                            alt={fullscreenSnapshot.name || "Snapshot"}
                            className={`max-h-[72vh] max-w-[90vw] object-contain transition-transform select-none ${lightboxZoom > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
                            style={{
                                transform: `scale(${lightboxZoom}) translate(${lightboxPan.x / lightboxZoom}px, ${lightboxPan.y / lightboxZoom}px)`,
                                transition: isLightboxDragging ? "none" : "transform 0.15s ease-out",
                            }}
                        />

                        {/* Right Navigation Arrow */}
                        {allSnapshots.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleNextSnapshot(); }}
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

export default PublicTourFloorPlans;