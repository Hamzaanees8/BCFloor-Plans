import React, { useRef, useState, useCallback, useEffect } from 'react';
import { DualMode } from './types';
import { DownloadIcon } from '@/components/Icons';
import { useAppContext } from '@/app/context/AppContext';

interface UploadDropzoneProps {
    mode: DualMode;
    onDropFiles: (files: File[]) => void;
    children: React.ReactNode;
    disabled?: boolean;
    userTypeOverride?: string;
}

// Utility to check if a drag event involves actual files from the OS (rather than text or internal page elements)
const isFilesDragEvent = (e: DragEvent): boolean => {
    if (!e.dataTransfer) return false;
    const types = e.dataTransfer.types;
    if (!types) return false;
    return Array.from(types).some((t) => t.toLowerCase() === 'files');
};

export function UploadDropzone({ onDropFiles, children, disabled, userTypeOverride }: UploadDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = useRef(0);
    const { userType: contextUserType } = useAppContext();
    const userType = userTypeOverride || contextUserType;
    const isUploadDisabled = Boolean(disabled || userType === 'agent');

    const resetDragState = useCallback(() => {
        dragCounter.current = 0;
        setIsDragging(false);
    }, []);

    const handleDragEnter = useCallback((e: DragEvent) => {
        if (isUploadDisabled) return;
        if (!isFilesDragEvent(e)) return;

        e.preventDefault();
        dragCounter.current += 1;
        setIsDragging(true);
    }, [isUploadDisabled]);

    const handleDragLeave = useCallback((e: DragEvent) => {
        if (isUploadDisabled) return;
        if (!isFilesDragEvent(e)) return;

        e.preventDefault();
        dragCounter.current -= 1;
        if (dragCounter.current <= 0) {
            resetDragState();
        }

        // Check if cursor completely left the window/viewport
        if (
            e.clientX <= 0 ||
            e.clientY <= 0 ||
            e.clientX >= window.innerWidth ||
            e.clientY >= window.innerHeight ||
            !e.relatedTarget
        ) {
            resetDragState();
        }
    }, [isUploadDisabled, resetDragState]);

    const handleDragOver = useCallback((e: DragEvent) => {
        if (isUploadDisabled) return;
        if (!isFilesDragEvent(e)) return;

        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'copy';
        }
    }, [isUploadDisabled]);

    const handleDrop = useCallback((e: DragEvent) => {
        // Always reset on drop, even if it wasn't files
        resetDragState();

        if (isUploadDisabled) return;
        if (!isFilesDragEvent(e)) return;

        e.preventDefault();
        e.stopPropagation();

        const droppedFiles = Array.from(e.dataTransfer?.files || []);
        if (droppedFiles.length > 0) {
            onDropFiles(droppedFiles);
        }
    }, [onDropFiles, isUploadDisabled, resetDragState]);

    useEffect(() => {
        const handleDragEnd = () => resetDragState();
        const handleMouseUp = () => resetDragState();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') resetDragState();
        };
        const handleWindowBlur = () => resetDragState();

        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('drop', handleDrop);
        window.addEventListener('dragend', handleDragEnd);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('drop', handleDrop);
            window.removeEventListener('dragend', handleDragEnd);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop, resetDragState]);

    return (
        <div className="relative w-full h-full min-h-[200px]">
            {isDragging && !isUploadDisabled && (
                <div 
                    onClick={resetDragState}
                    className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center backdrop-blur-sm cursor-pointer transition-all"
                >
                    <div 
                        className="bg-white/20 border-2 border-dashed border-white rounded-3xl p-20 flex flex-col items-center gap-6 animate-in zoom-in duration-300 pointer-events-none"
                    >
                        <div className={`${userType}-bg p-6 rounded-full shadow-2xl`}>
                            <DownloadIcon width="48px" height="48px" fill="#fff" />
                        </div>
                        <p className="text-3xl font-bold text-white tracking-wide">Drop files here to upload</p>
                        <p className="text-white/80 text-lg">Support for images and high-quality photos</p>
                    </div>
                </div>
            )}
            {children}
        </div>
    );
}
