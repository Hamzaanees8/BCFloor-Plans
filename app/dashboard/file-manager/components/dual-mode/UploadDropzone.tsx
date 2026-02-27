import React, { useRef, useState, useCallback, useEffect } from 'react';
import { DualMode } from './types';
import { DownloadIcon } from '@/components/Icons';
import { useAppContext } from '@/app/context/AppContext';

interface UploadDropzoneProps {
    mode: DualMode;
    onDropFiles: (files: File[]) => void;
    children: React.ReactNode;
    disabled?: boolean;
}

export function UploadDropzone({ mode, onDropFiles, children, disabled }: UploadDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = useRef(0);
    const { userType } = useAppContext();

    const handleDragEnter = useCallback((e: DragEvent) => {
        e.preventDefault();
        if (mode !== 'upload' || disabled) return;
        dragCounter.current += 1;
        setIsDragging(true);
    }, [mode, disabled]);

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        if (mode !== 'upload' || disabled) return;
        dragCounter.current -= 1;
        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    }, [mode, disabled]);

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        if (mode !== 'upload' || disabled) return;
    }, [mode, disabled]);

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (mode !== 'upload' || disabled) return;

        setIsDragging(false);
        dragCounter.current = 0;

        const droppedFiles = Array.from(e.dataTransfer?.files || []);
        if (droppedFiles.length > 0) {
            onDropFiles(droppedFiles);
        }
    }, [mode, onDropFiles, disabled]);

    useEffect(() => {
        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('drop', handleDrop);
        };
    }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

    return (
        <div className="relative w-full h-full min-h-[200px]">
            {isDragging && mode === 'upload' && !disabled && (
                <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center backdrop-blur-sm pointer-events-none transition-all">
                    <div className="bg-white/20 border-2 border-dashed border-white rounded-3xl p-20 flex flex-col items-center gap-6 animate-in zoom-in duration-300">
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
