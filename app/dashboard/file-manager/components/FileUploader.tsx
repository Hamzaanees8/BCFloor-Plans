'use client';

import { Plus } from 'lucide-react';
import React, { useCallback, useRef } from 'react';

interface FileDropZoneProps {
    onFilesChange: (files: File[]) => void;
    type?: string
}

const FileUploader: React.FC<FileDropZoneProps> = ({ onFilesChange, type }) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        let files = Array.from(e.dataTransfer.files);
        if (type === "video") {
            files = files.filter(file => file.type.startsWith("video/"));
        }
        onFilesChange(files);
    }, [onFilesChange, type]);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            let files = Array.from(e.target.files);
            if (type === "video") {
                files = files.filter(file => file.type.startsWith("video/"));
            }
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
            <div className="text-4xl border-2 border-[#8E8E8E] flex justify-center items-center w-[72px] h-[72px] rounded-[6px]"><Plus color='#8E8E8E' size={'42px'} strokeWidth={1} /></div>
            <p className="mt-2  text-[#8E8E8E]">Drag Drop Files</p>
            {type === "video" ? (<p className="text-[#8E8E8E]">Video MP4</p>) : (<p className="text-[#8E8E8E]">RAW, JPG, PNG, PDF, MP4</p>)}
            <input
                type="file"
                multiple
                accept={type === "video" ? "video/*" : ".raw,.jpg,.jpeg,.png,.pdf,.mp4"}
                onChange={handleChange}
                ref={inputRef}
                className="hidden"
            />

        </div>
    );
};

export default FileUploader;
