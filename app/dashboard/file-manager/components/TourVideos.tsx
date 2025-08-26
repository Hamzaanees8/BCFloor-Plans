import React, { useState } from 'react'
import { useFileManagerContext } from '../FileManagerContext ';
import { Check, X } from 'lucide-react';

function TourVideos() {
    const { selectedVideoFiles, setSelectedVideoFiles } = useFileManagerContext();
    const [mainVideo, setMainVideo] = useState<File | null>(null);
    return (
        <div className="p-4">
            <div className="mb-6 h-[95vh] w-full bg-black rounded overflow-hidden">
                <video
                    src={
                        mainVideo
                            ? URL.createObjectURL(mainVideo)
                            : selectedVideoFiles[0]?.file
                                ? URL.createObjectURL(selectedVideoFiles[0].file)
                                : undefined
                    }
                    className="w-full h-full object-contain"
                    controls
                />

            </div>
            {selectedVideoFiles.length > 0 && (
                <div className="mt-4 w-full grid grid-cols-3 gap-5 p-3">
                    {selectedVideoFiles.map((file, idx) => (
                        <div key={idx} onClick={() => setMainVideo(file.file)} className=" h-auto relative">
                            <div className="relative w-full h-[240px] cursor-pointer">
                                <video
                                    src={URL.createObjectURL(file.file)}
                                    className="w-full h-full object-cover"
                                    
                                />
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

                </div>
            )}
        </div>
    )
}

export default TourVideos