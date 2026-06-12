import React, { forwardRef } from 'react';
import { useOptimizedPreview } from '@/hooks/useOptimizedPreview';
import { Play, FileText } from 'lucide-react';

interface OptimizedImagePreviewProps {
    file: File;
    alt?: string;
    className?: string;
    onClick?: () => void;
    onDragStart?: (e: React.DragEvent) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    draggable?: boolean;
    isRestricted?: boolean;
    width?: number;
    height?: number;
    onDoubleClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

/**
 * Renders an optimized image preview with loading state
 * Prevents UI freezing with large files
 */
export const OptimizedImagePreview = forwardRef<HTMLImageElement, OptimizedImagePreviewProps>(
    ({ file, alt = 'preview', className = '', onClick, onDragStart, onDragEnd, draggable, isRestricted, width = 300, height = 300, onDoubleClick }, ref) => {
        const { previewUrl, isLoading, error } = useOptimizedPreview(file, width, height);

        // If restricted, return the placeholder immediately
        if (isRestricted) {
            return <ImagePlaceholder className={className} onClick={onClick} isRestricted={isRestricted} />;
        }

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

        // If it's a PDF, show the PDF itself using an iframe, unless restricted
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            if (isRestricted) {
                return <PdfPlaceholder className={className} onClick={onClick} isRestricted={isRestricted} />;
            }
            return (
                <div className={`relative overflow-hidden cursor-pointer w-full h-full ${className}`} onClick={onClick}>
                    <iframe
                        src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                        className="w-full h-full pointer-events-none border-none object-cover scale-[1.14] origin-top"
                        tabIndex={-1}
                        scrolling="no"
                    />
                    <div className="absolute inset-0 bg-transparent" />
                </div>
            );
        }

        // Render optimized preview
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                ref={ref}
                src={previewUrl}
                alt={alt}
                className={className}
                draggable={draggable}
                onClick={onClick}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDoubleClick={onDoubleClick}
            />
        );
    }
);

OptimizedImagePreview.displayName = 'OptimizedImagePreview';

interface PdfPlaceholderProps {
    className?: string;
    onClick?: () => void;
    isRestricted?: boolean;
    message?: string;
}

/**
 * Renders a consistent placeholder for PDF files
 */
export function PdfPlaceholder({ className = '', onClick, isRestricted, message }: PdfPlaceholderProps) {
    return (
        <div className={`flex items-center justify-center bg-gray-100 ${className}`} onClick={onClick}>
            <div className="flex flex-col items-center gap-2 p-4 text-center">
                <div className="bg-red-50 rounded-full p-4">
                    <FileText className="w-8 h-8 text-red-500" />
                </div>
                <span className="text-gray-500 text-xs font-bold font-alexandria">
                    {message ? message : (isRestricted ? "PDF preview is disabled until the service is paid." : "PDF Document")}
                </span>
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

interface ImagePlaceholderProps {
    className?: string;
    onClick?: () => void;
    isRestricted?: boolean;
    message?: string;
}

/**
 * Renders a consistent placeholder for Image files
 */
export function ImagePlaceholder({ className = '', onClick, isRestricted, message }: ImagePlaceholderProps) {
    return (
        <div className={`flex items-center justify-center bg-gray-100 ${className}`} onClick={onClick}>
            <div className="flex flex-col items-center gap-2 p-4 text-center">
                <div className="bg-red-50 rounded-full p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <span className="text-gray-500 text-xs font-bold font-alexandria">
                    {message ? message : (isRestricted ? "Image preview is disabled until the service is paid." : "Image File")}
                </span>
            </div>
        </div>
    );
}
