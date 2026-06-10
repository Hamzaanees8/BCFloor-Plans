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
        currentServiceFiles = currentServiceFiles?.filter(file => file.is_agent_approved || file.is_complimentary);
    }

    const mainVideoSrc =
        mainVideo ??
        (selectedVideoFiles[0]?.file
            ? URL.createObjectURL(selectedVideoFiles[0].file)
            : currentServiceFiles?.[0]
                ? currentServiceFiles[0].url || `${API_URL}/${currentServiceFiles[0].file_path}`
                : undefined);

    if ((!currentServiceFiles || currentServiceFiles?.length === 0) && selectedVideoFiles.length === 0) {
        const allVideos = filesData?.files?.filter(file => file.type === "video") || [];
        if (userType === 'agent') {
            if (allVideos.length > 0) {
                return (
                    <div className="font-alexandria w-full h-[50vh] text-[#4290E9] flex justify-center items-center font-[500] text-[18px]">
                        <p>You have not approved any videos yet. Go to Video service and approve media.</p>
                    </div>
                );
            } else {
                return (
                    <div className="font-alexandria w-full h-[50vh] text-[#E06D5E] flex justify-center items-center font-[500] text-[18px]">
                        <p>Vendor has not uploaded any videos yet.</p>
                    </div>
                );
            }
        }
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
                            <div className="relative w-full h-[240px] cursor-pointer overflow-hidden">
                                <OptimizedImagePreview
                                    file={file.file}
                                    alt="Video thumbnail"
                                    className="absolute inset-0 w-full h-full object-cover"
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
                        <div key={idx} className=" h-auto relative">
                            <div className="relative w-full h-[240px] cursor-pointer">
                                {file.is_processing ? (
                                    <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                                        <p className="text-gray-500 font-medium text-sm">Processing...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div onClick={() => setMainVideo(file.url || `${API_URL}/${file.file_path}`)} className="w-full h-full">
                                            {file.variant_urls?.thumb ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={file.variant_urls.thumb}
                                                    alt="Video thumbnail"
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                />
                                            ) : (
                                                <video
                                                    src={`${file.url || `${API_URL}/${file.file_path}`}#t=0.1`}
                                                    preload="metadata"
                                                    muted
                                                    playsInline
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
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
                                    </>
                                )}
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