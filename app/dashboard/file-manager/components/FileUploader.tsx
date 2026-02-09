'use client';

import { Plus, Upload, AlertTriangle } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import { useUploadQueue } from '@/context/UploadQueueContext';

interface FileDropZoneProps {
    onFilesChange?: (files: File[]) => void; // Keep for backward compatibility
    type?: string;
    // New props for S3 direct upload
    entityType?: 'tour' | 'order' | 'listing';
    entityId?: string;
    tourId?: string;
    group?: string;
    serviceId?: string;
    useDirectUpload?: boolean; // Enable new S3 upload flow
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const LARGE_FILE_WARNING = 30 * 1024 * 1024; // 30MB

const FileUploader: React.FC<FileDropZoneProps> = ({
    onFilesChange,
    type,
    entityType = 'tour',
    entityId,
    tourId,
    group,
    serviceId,
    useDirectUpload = false,
}) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);
    const { addToQueue } = useUploadQueue();

    const processFiles = useCallback((fileList: File[]) => {
        let files = fileList;
        const newWarnings: string[] = [];

        // Filter by type if specified
        if (type === 'video') {
            files = files.filter(file => file.type.startsWith('video/'));
        } else if (type === 'image') {
            files = files.filter(file => file.type.startsWith('image/'));
        }

        // Check file sizes
        files = files.filter(file => {
            if (file.size > MAX_FILE_SIZE) {
                newWarnings.push(`${file.name} exceeds 100MB limit`);
                return false;
            }
            if (file.size > LARGE_FILE_WARNING) {
                newWarnings.push(`${file.name} is large (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
            }
            return true;
        });

        setWarnings(newWarnings);

        if (files.length === 0) return;

        // Use new S3 direct upload if enabled
        if (useDirectUpload && entityId) {
            addToQueue(files, {
                entityType,
                entityId,
                tourId,
                group,
                serviceId,
            });
        } else if (onFilesChange) {
            // Fallback to old behavior
            onFilesChange(files);
        }
    }, [type, useDirectUpload, entityId, entityType, tourId, group, serviceId, addToQueue, onFilesChange]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    }, [processFiles]);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            processFiles(files);
            e.target.value = '';
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    return (
        <div className="space-y-2">
            <div
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
          w-[370px] h-[220px] border-2 border-dashed rounded-[6px] 
          flex flex-col items-center justify-center cursor-pointer 
          transition-all duration-200
          ${isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-[#8E8E8E] bg-[#EEEEEE] hover:bg-gray-100'
                    }
        `}
            >
                <div className={`
          text-4xl border-2 flex justify-center items-center 
          w-[72px] h-[72px] rounded-[6px] transition-colors
          ${isDragging ? 'border-blue-500' : 'border-[#8E8E8E]'}
        `}>
                    {isDragging ? (
                        <Upload color="#3B82F6" size="42px" strokeWidth={1} />
                    ) : (
                        <Plus color="#8E8E8E" size="42px" strokeWidth={1} />
                    )}
                </div>
                <p className={`mt-2 ${isDragging ? 'text-blue-500' : 'text-[#8E8E8E]'}`}>
                    {isDragging ? 'Drop files here' : 'Drag & Drop Files'}
                </p>
                <p className="text-[#8E8E8E] text-sm">
                    {type === 'video' ? 'Video MP4' : 'RAW, JPG, PNG, PDF'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Max 100MB per file</p>
                <input
                    type="file"
                    multiple
                    accept={type === 'video' ? 'video/*' : '.raw,.jpg,.jpeg,.png,.pdf'}
                    onChange={handleChange}
                    ref={inputRef}
                    className="hidden"
                />
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
                <div className="flex items-start gap-2 text-amber-600 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                        {warnings.map((warning, i) => (
                            <p key={i}>{warning}</p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUploader;
