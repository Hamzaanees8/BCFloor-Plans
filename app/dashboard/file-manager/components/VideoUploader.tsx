'use client';

import { Plus } from 'lucide-react';
import React, { useCallback, useRef } from 'react';

interface FileDropZoneProps {
    onFilesChange: (files: File[]) => void;
}

const VideoUploader: React.FC<FileDropZoneProps> = ({ onFilesChange }) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const isVideoFile = (file: File) => file.type.startsWith('video/');

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter(isVideoFile);
        onFilesChange(files);
    }, [onFilesChange]);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).filter(isVideoFile);
            onFilesChange(files);
            e.target.value = '';
        }
    };

    return (
        <div
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="w-[370px] h-[220px] border-2 border-[#8E8E8E] rounded-[6px] flex flex-col items-center justify-center cursor-pointer bg-[#EEEEEE] hover:bg-gray-100 transition"
        >
            <div className="text-4xl border-2 border-[#8E8E8E] flex justify-center items-center w-[72px] h-[72px] rounded-[6px]">
                <Plus color="#8E8E8E" size={'42px'} strokeWidth={1} />
            </div>
            <p className="mt-2 text-[#8E8E8E]">Drag Drop Videos</p>
            <p className="text-[#8E8E8E]">MP4, MOV, AVI, WEBM, etc.</p>
            <input
                type="file"
                multiple
                accept="video/*"
                onChange={handleChange}
                ref={inputRef}
                className="hidden"
            />
        </div>
    );
};

export default VideoUploader;
