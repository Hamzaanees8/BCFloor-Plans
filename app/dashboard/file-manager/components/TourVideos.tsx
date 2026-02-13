import React, { useState } from 'react'
import { useFileManagerContext } from "../FileManagerContext";
import { Check, X, PlayCircle } from 'lucide-react';

import { useAppContext } from "@/app/context/AppContext";
import { OptimizedImagePreview } from './OptimizedPreview';

function TourVideos() {
    const { userType } = useAppContext();
    const { selectedVideoFiles, setSelectedVideoFiles, filesData } = useFileManagerContext();
    const [mainVideo, setMainVideo] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

    let currentServiceFiles = filesData?.files?.filter(file => file.type === "video");

    if (userType === 'agent') {
        currentServiceFiles = currentServiceFiles?.filter(file => file.is_admin_approved);
    }

    const mainVideoSrc =
        mainVideo ??
        (selectedVideoFiles[0]?.file
            ? URL.createObjectURL(selectedVideoFiles[0].file)
            : currentServiceFiles?.[0]
                ? currentServiceFiles[0].url || `${API_URL}/${currentServiceFiles[0].file_path}`
                : undefined);

    if ((!currentServiceFiles || currentServiceFiles?.length === 0) && selectedVideoFiles.length === 0) {
        return (
            <div className="font-alexandria w-full h-[50vh] text-gray-500 flex justify-center items-center">
                <p>No Video found — please add Video or select a Video service.</p>
            </div>
        );
    }
    return (
        <div className="p-4">
            <div className="mb-6 h-[95vh] w-full bg-black rounded overflow-hidden">
                <video
                    src={mainVideoSrc}
                    className="w-full h-full object-contain"
                    controls
                />

            </div>
            {(selectedVideoFiles.length > 0 || (currentServiceFiles?.length ?? 0) > 0) && (
                <div className="mt-4 w-full grid grid-cols-3 gap-5 p-3">
                    {selectedVideoFiles.map((file, idx) => (
                        <div key={idx} onClick={() => setMainVideo(URL.createObjectURL(file.file))} className=" h-auto relative">
                            <div className="relative w-full h-[240px] cursor-pointer">
                                <OptimizedImagePreview
                                    file={file.file}
                                    alt="Video thumbnail"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <PlayCircle className="w-12 h-12 text-white/80 drop-shadow-lg" />
                                </div>
                                <span
                                    className={`cursor-pointer absolute top-0 right-0 w-[60px] h-[60px] flex justify-end items-start p-[10px]`}
                                    style={{
                                        clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                                        backgroundColor: `${file.upload ? "#6BAE41" : "#E06D5E"}`,
                                    }}
                                    onClick={() => {
                                        setSelectedVideoFiles(prev =>
                                            prev.flatMap(f => {
                                                if (f.file === file.file && f.service_id === file.service_id) {
                                                    return f.upload ? [{ ...f, upload: false }] : [];
                                                }
                                                return [f];
                                            })
                                        );
                                    }}
                                >
                                    {file.upload ? <Check color="#fff" size={14} /> : <X color="#fff" size={14} />}
                                </span>
                            </div>

                        </div>
                    ))}

                    {currentServiceFiles?.map((file, idx) => (
                        <div key={idx} onClick={() => setMainVideo(file.url || `${API_URL}/${file.file_path}`)} className=" h-auto relative">
                            <div className="relative w-full h-[240px] cursor-pointer">
                                <video
                                    src={`${file.url || `${API_URL}/${file.file_path}`}#t=0.1`}
                                    preload="metadata"
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <PlayCircle className="w-12 h-12 text-white/80 drop-shadow-lg" />
                                </div>
                                <span
                                    className={`cursor-pointer absolute top-0 right-0 w-[60px] h-[60px] flex justify-end items-start p-[10px]`}
                                    style={{
                                        clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                                        backgroundColor: "#6BAE41"
                                    }}
                                // onClick={() => {
                                //     setSelectedVideoFiles(prev =>
                                //         prev.flatMap(f => {
                                //             if (f.file === file.file && f.service_id === file.service_id) {
                                //                 return f.upload ? [{ ...f, upload: false }] : [];
                                //             }
                                //             return [f];
                                //         })
                                //     );
                                // }}
                                >
                                    <Check color="#fff" size={14} />
                                </span>
                            </div>

                        </div>
                    ))}

                </div>
            )}

            {(currentServiceFiles?.length ?? 0) > 0 && (
                <div className="mt-4 w-full grid grid-cols-3 gap-5 p-3">


                </div>
            )}
        </div>
    )
}

export default TourVideos