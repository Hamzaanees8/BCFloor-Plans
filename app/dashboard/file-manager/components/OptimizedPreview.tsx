import React from 'react';
import { useOptimizedPreview } from '@/hooks/useOptimizedPreview';
import { Play, FileText } from 'lucide-react';

interface OptimizedImagePreviewProps {
    file: File;
    alt?: string;
    className?: string;
    onClick?: () => void;
}

/**
 * Renders an optimized image preview with loading state
 * Prevents UI freezing with large files
 */
export function OptimizedImagePreview({ file, alt = 'preview', className = '', onClick }: OptimizedImagePreviewProps) {
    const { previewUrl, isLoading, error } = useOptimizedPreview(file);

    // Show loading placeholder
    if (isLoading) {
        return (
            <div className={`flex items-center justify-center bg-gray-200 ${className}`}>
                <div className="animate-pulse text-gray-400 text-sm">Loading...</div>
            </div>
        );
    }

    // Show error placeholder
    if (error || !previewUrl) {
        return (
            <div className={`flex items-center justify-center bg-gray-200 ${className}`}>
                <div className="text-gray-400 text-sm">Preview unavailable</div>
            </div>
        );
    }

    // If it's a PDF, show the PDF placeholder
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        return <PdfPlaceholder className={className} onClick={onClick} />;
    }

    // Render optimized preview
    return (
        /* eslint-disable @next/next/no-img-element */
        <img
            src={previewUrl}
            alt={alt}
            className={className}
            onClick={onClick}
        />
    );
}

interface PdfPlaceholderProps {
    className?: string;
    onClick?: () => void;
}

/**
 * Renders a consistent placeholder for PDF files
 */
export function PdfPlaceholder({ className = '', onClick }: PdfPlaceholderProps) {
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

interface VideoPlaceholderProps {
    className?: string;
    onClick?: () => void;
}

/**
 * Renders a lightweight placeholder for video files
 * Prevents automatic video loading and decoding
 */
export function VideoPlaceholder({ className = '', onClick }: VideoPlaceholderProps) {
    return (
        <div className={`flex items-center justify-center bg-gray-900 ${className}`} onClick={onClick}>
            <div className="flex flex-col items-center gap-2">
                <div className="bg-white/20 rounded-full p-4">
                    <Play className="w-8 h-8 text-white" fill="white" />
                </div>
                <span className="text-white text-xs opacity-70">Video Preview</span>
            </div>
        </div>
    );
}
