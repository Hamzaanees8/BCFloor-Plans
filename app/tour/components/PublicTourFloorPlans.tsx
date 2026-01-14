"use client";
import React, { useRef, useState } from "react";
import { CameraIcon } from "@/components/Icons";
import { X } from "lucide-react";
import { Snapshoots } from "../PublicTour";

export interface FloorPlanFile {
    id: number;
    uuid: string;
    tour_id: number;
    type: string;
    name: string;
    file_path: string;
    group: string | null;
    service_id: number;
    sort_order: number;
    created_at: string;
    updated_at: string;
    is_featured: boolean;
}


export interface Marker {
    x: number;
    y: number;
    file_path?: string;
    floorImageUrl: string;
    name?: string;
    description?: string;
    isApi?: boolean;
}

interface PublicTourFloorPlansProps {
    floorPlanFiles?: FloorPlanFile[];
    snapshots?: Snapshoots[];
}

function PublicTourFloorPlans({
    floorPlanFiles = [],
    snapshots = [],

}: PublicTourFloorPlansProps) {
    const [selectedImageId, setSelectedImageId] = useState<string | null>(() => {
        if (floorPlanFiles?.length > 0) {
            return floorPlanFiles[0].name;
        }
        return null;
    });

    const [previewMarker, setPreviewMarker] = useState<Marker | null>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

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
    const selectedFile = floorPlanFiles?.find((f) => f.name === selectedImageId);

    if (floorPlanFiles?.length === 0) {
        return (
            <div className="font-alexandria w-full h-[50vh] text-gray-500 flex justify-center items-center">
                <p>No floor plans available.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-auto font-alexandria bg-gray-100 py-6 pl-0 mt-[75px] pt-0">
            <div className="w-full h-[550px] flex gap-[30px] bg-white">
                <div
                    ref={imageContainerRef}
                    className="relative w-[70%] h-full bg-white overflow-hidden m-auto"
                >
                    {selectedFile && (
                        <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                ref={imgRef}
                                src={`${API_URL}/${selectedFile.file_path}`}
                                alt="Selected Floor Plan"
                                className="object-contain max-h-full max-w-full w-full h-full"
                            />

                            {/* Render markers for this floor plan */}
                            {filteredSnapshots.map((snapshot, idx) => (
                                <div
                                    key={idx}
                                    className="absolute cursor-pointer hover:scale-110 transition-transform"
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
                                >
                                    <CameraIcon width={24} height={24} />
                                </div>
                            ))}

                            {previewMarker && (
                                <div className="bg-[#565656] text-white font-alexandria shadow-lg max-w-sm w-full h-[400px] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col z-10 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setPreviewMarker(null)}
                                        className="absolute top-3 right-3 text-black bg-white rounded-full z-20 p-1 hover:bg-gray-100 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                    {previewMarker.file_path && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={`${API_URL}/${previewMarker.file_path}`}
                                            alt={previewMarker.name || "Snapshot"}
                                            className="w-[95%] h-[65%] object-cover mx-auto mt-3 rounded"
                                        />
                                    )}

                                    <div className="p-4 overflow-y-auto flex-1">
                                        <p className="text-xl font-semibold uppercase pb-2">
                                            {previewMarker?.name || "Snapshot"}
                                        </p>
                                        <p className="text-gray-200 line-clamp-4">
                                            {previewMarker?.description || "No description available"}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

            </div>

            <div className="w-full h-[200px] mt-6 px-10">
                <div className="w-full h-full flex items-center gap-4 overflow-x-auto overflow-y-hidden pb-2">
                    {floorPlanFiles?.map((file, idx) => (
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
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={`${API_URL}/${file.file_path}`}
                                    alt={`Floor Plan ${idx + 1}`}
                                    className="max-w-full max-h-full object-contain"
                                />
                                {snapshots.some(s => normalizeName(s.file_name) === normalizeName(file.name)) && (
                                    <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                        {snapshots.filter(s => normalizeName(s.file_name) === normalizeName(file.name)).length}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}


export default PublicTourFloorPlans;