"use client";
import React, { useRef, useState } from "react";
import { CameraIcon } from "@/components/Icons";
import { FileText, X } from "lucide-react";
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
    watermarkLogo
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

    const [draggedFile, setDraggedFile] = useState<any | null>(null);
    const [localMarkers, setLocalMarkers] = useState<any[]>([]);

    const [previewMarker, setPreviewMarker] = useState<Marker | null>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

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

    const selectedFile = filteredFloorPlanFiles?.find((f) => f.name === selectedImageId);
    const isSelectedFilePDF = selectedFile ? isPDF(selectedFile.file_path) : false;

    if (filteredFloorPlanFiles?.length === 0) {
        return (
            <div className="font-alexandria w-full h-[50vh] text-gray-500 flex justify-center items-center">
                <p>No floor plans available.</p>
            </div>
        );
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!draggedFile || !imgRef.current || !selectedImageId) return;

        const img = imgRef.current;
        const imgRect = img.getBoundingClientRect();

        const relX = e.clientX - imgRect.left;
        const relY = e.clientY - imgRect.top;

        const xPercent = (relX / imgRect.width) * 100;
        const yPercent = (relY / imgRect.height) * 100;

        const newMarker = {
            x: xPercent,
            y: yPercent,
            floorImageUrl: selectedImageId,
            name: draggedFile.name || 'New Snapshot',
            description: '',
            file_path: draggedFile.variant_urls?.popup || draggedFile.variant_urls?.landing || draggedFile.url || (draggedFile.file_path ? `${API_URL}/${draggedFile.file_path}` : ''),
            variant_urls: draggedFile.variant_urls,
            isApi: true
        };

        setLocalMarkers(prev => [...prev, newMarker]);
        setPreviewMarker(newMarker as any);
        setDraggedFile(null);
    };

    return (
        <div className="w-full h-auto font-alexandria bg-gray-100 py-6 pl-0 mt-[75px] pt-0">
            <div className="w-full h-auto md:h-[550px] flex flex-col md:flex-row gap-[30px] bg-white">
                <div
                    ref={imageContainerRef}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="relative w-full md:w-[70%] h-[300px] sm:h-full bg-white overflow-visible m-auto border border-gray-200"
                >
                    {selectedFile && (
                        <>
                            {selectedFile.is_processing ? (
                                <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                                    <p className="text-gray-500 font-medium text-sm">Processing...</p>
                                </div>
                            ) : isSelectedFilePDF ? (
                                // Render PDF in iframe
                                <iframe
                                    src={`${selectedFile.variant_urls?.popup || selectedFile.url || `${API_URL}/${selectedFile.file_path}`}#toolbar=0`}
                                    className="w-full h-full border-0"
                                    title="Floor Plan PDF"
                                />
                            ) : (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        ref={imgRef}
                                        loading="lazy"
                                        src={selectedFile.variant_urls?.landing || selectedFile.variant_urls?.popup || selectedFile.url || `${API_URL}/${selectedFile.file_path}`}
                                        alt="Selected Floor Plan"
                                        className="object-contain max-h-full max-w-full w-full h-full"
                                    />
                                    {watermarkLogo && (
                                        <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={watermarkLogo}
                                                alt="Watermark"
                                                className="absolute bottom-10 right-10 w-[150px] object-contain opacity-60 pointer-events-none z-[50]"
                                            />
                                        </>
                                    )}

                                    {/* Render markers for this floor plan (only for images, not PDFs) */}
                                    {[...filteredSnapshots, ...currentLocalSnapshots].map((snapshot, idx) => (
                                        <div
                                            key={idx}
                                            className="absolute cursor-pointer hover:scale-110 transition-transform z-10"
                                            style={{
                                                top: `${snapshot.y_axis}%`,
                                                left: `${snapshot.x_axis}%`,
                                                transform: "translate(-50%, -100%)",
                                            }}
                                            onClick={() => {
                                                setPreviewMarker({
                                                    x: Number(snapshot.x_axis),
                                                    y: Number(snapshot.y_axis),
                                                    file_path: snapshot.file_path,
                                                    floorImageUrl: snapshot.file_name,
                                                    name: snapshot.name,
                                                    description: snapshot.description,
                                                    isApi: true,
                                                });
                                            }}
                                            onMouseEnter={() => {
                                                setPreviewMarker({
                                                    x: Number('x_axis' in snapshot ? snapshot.x_axis : snapshot.x),
                                                    y: Number('y_axis' in snapshot ? snapshot.y_axis : snapshot.y),
                                                    file_path: snapshot.file_path,
                                                    floorImageUrl: 'file_name' in snapshot ? snapshot.file_name : snapshot.floorImageUrl,
                                                    name: snapshot.name,
                                                    description: snapshot.description,
                                                    isApi: true,
                                                    variant_urls: (snapshot as any).variant_urls
                                                });
                                            }}
                                        >
                                            <CameraIcon width={24} height={24} />
                                        </div>
                                    ))}

                                    {previewMarker && (
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
                                        >
                                            <button
                                                onClick={() => setPreviewMarker(null)}
                                                className="absolute top-3 right-3 text-black bg-white rounded-full z-20 p-1 hover:bg-gray-100 transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>

                                            {previewMarker.file_path && (
                                                <>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        loading="lazy"
                                                        src={previewMarker.variant_urls?.popup || previewMarker.variant_urls?.landing || previewMarker.file_path}
                                                        alt={previewMarker.name || "Snapshot"}
                                                        className="w-auto h-auto max-w-[calc(100%-24px)] max-h-[300px] object-contain mx-auto mt-3 rounded"
                                                    />
                                                </>
                                            )}

                                            <div className="p-4 flex-1">
                                                <p className="text-xl font-semibold uppercase pb-2 break-words">
                                                    {previewMarker?.name || "Snapshot"}
                                                </p>
                                                <p className="text-gray-200 break-words">
                                                    {previewMarker?.description || "No description available"}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>

            </div>

            <div className="w-full h-auto mt-6 px-4 md:px-10">
                <div className="w-full h-full flex items-center gap-4 overflow-x-auto overflow-y-hidden pb-2 whitespace-nowrap scrollbar-none">
                    {filteredFloorPlanFiles?.map((file, idx) => {
                        const isFilePDF = isPDF(file.file_path);
                        return (
                            <div
                                key={idx}
                                onClick={() => {
                                    setSelectedImageId(file.name);
                                    setPreviewMarker(null);
                                }}
                                className={`flex-shrink-0 w-[200px] h-[120px] overflow-hidden flex items-center rounded-lg justify-center cursor-pointer transition-all duration-200 ml-2 mr-2 ${selectedImageId === file.name
                                    ? "border-2 border-[#4290E9] shadow-md scale-105"
                                    : "border border-gray-300 hover:border-gray-400 hover:shadow-sm"
                                    }`}
                            >
                                <div className="relative w-full h-full flex items-center justify-center p-1">
                                    {file.is_processing ? (
                                        <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                                            <p className="text-gray-500 font-medium text-xs">Processing...</p>
                                        </div>
                                    ) : isFilePDF ? (
                                        <PdfPlaceholder className="w-full h-full" />
                                    ) : (
                                        <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={file.variant_urls?.thumb || file.thumbnail_url || file.url || `${API_URL}/${file.file_path}`}
                                                alt={`Floor Plan ${idx + 1}`}
                                                className="max-w-full max-h-full object-contain"
                                            />
                                            {snapshots.some(s => normalizeName(s.file_name) === normalizeName(file.name)) && (
                                                <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
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

            {/* Removed Photos section */}
        </div>
    );
}


export default PublicTourFloorPlans;