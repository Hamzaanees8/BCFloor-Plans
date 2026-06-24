import { useEffect, useRef, useState } from 'react';

interface OptimizedPreviewResult {
    previewUrl: string | null;
    isLoading: boolean;
    error: boolean;
}

/**
 * Custom hook to generate optimized previews for large files
 * - Images: Downscales to ~300x300px and compresses as JPEG
 * - Videos: Extracts first frame as thumbnail
 * - Manages object URL lifecycle automatically
 */
export function useOptimizedPreview(file: File | null, width: number = 300, height: number = 300): OptimizedPreviewResult {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);
    const urlRef = useRef<string | null>(null);

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            setIsLoading(false);
            setError(false);
            return;
        }

        // Cleanup previous URL
        if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current);
            urlRef.current = null;
        }

        // Handle video files - extract first frame as thumbnail
        if (file.type.startsWith('video/')) {
            setIsLoading(true);
            setError(false);

            const generateVideoThumbnail = async () => {
                try {
                    const video = document.createElement('video');
                    const fileUrl = URL.createObjectURL(file);

                    video.src = fileUrl;
                    video.muted = true;
                    video.playsInline = true;

                    // Wait for metadata to load
                    await new Promise<void>((resolve, reject) => {
                        video.onloadedmetadata = () => resolve();
                        video.onerror = () => reject(new Error('Failed to load video'));
                    });

                    // Seek to first frame
                    video.currentTime = 0;

                    // Wait for seek to complete
                    await new Promise<void>((resolve) => {
                        video.onseeked = () => resolve();
                    });

                    // Calculate aspect ratio and draw centered
                    const aspectRatio = video.videoWidth / video.videoHeight;
                    const maxDim = 300;
                    let canvasWidth = maxDim;
                    let canvasHeight = maxDim;

                    if (aspectRatio > 1) {
                        canvasHeight = Math.round(maxDim / aspectRatio);
                    } else {
                        canvasWidth = Math.round(maxDim * aspectRatio);
                    }

                    // Draw frame to canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        throw new Error('Failed to get canvas context');
                    }

                    ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);

                    // Clean up video element and URL
                    URL.revokeObjectURL(fileUrl);

                    // Convert canvas to JPEG blob
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const url = URL.createObjectURL(blob);
                                urlRef.current = url;
                                setPreviewUrl(url);
                                setIsLoading(false);
                            } else {
                                setError(true);
                                setIsLoading(false);
                            }
                        },
                        'image/jpeg',
                        0.6
                    );
                } catch (err) {
                    console.error('Error generating video thumbnail:', err);
                    setError(true);
                    setIsLoading(false);
                }
            };

            generateVideoThumbnail();
            return;
        }

        // Handle image files - generate optimized preview
        if (file.type.startsWith('image/')) {
            setIsLoading(true);
            setError(false);

            const generateOptimizedPreview = async () => {
                try {
                    // Create downscaled bitmap
                    const bitmap = await createImageBitmap(file, {
                        resizeWidth: width,
                        resizeHeight: height,
                        resizeQuality: 'low',
                    });

                    // Draw to canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = bitmap.width;
                    canvas.height = bitmap.height;
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        throw new Error('Failed to get canvas context');
                    }

                    ctx.drawImage(bitmap, 0, 0);
                    bitmap.close();

                    // Convert to compressed JPEG blob
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const url = URL.createObjectURL(blob);
                                urlRef.current = url;
                                setPreviewUrl(url);
                                setIsLoading(false);
                            } else {
                                setError(true);
                                setIsLoading(false);
                            }
                        },
                        'image/jpeg',
                        0.6
                    );
                } catch (err) {
                    console.error('Error generating optimized preview:', err);
                    setError(true);
                    setIsLoading(false);
                }
            };

            generateOptimizedPreview();
        } else {
            // For non-image/non-video files (PDFs, etc.), use original file
            const url = URL.createObjectURL(file);
            urlRef.current = url;
            setPreviewUrl(url);
            setIsLoading(false);
        }

        // Cleanup on unmount or file change
        return () => {
            if (urlRef.current) {
                URL.revokeObjectURL(urlRef.current);
                urlRef.current = null;
            }
        };
    }, [file, width, height]);

    return { previewUrl, isLoading, error };
}
