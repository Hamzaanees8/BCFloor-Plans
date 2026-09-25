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

                    // Calculate proportional dimensions fitting within width x height bounding box
                    let canvasWidth = video.videoWidth || width;
                    let canvasHeight = video.videoHeight || height;

                    if (canvasWidth > width || canvasHeight > height) {
                        const scale = Math.min(width / canvasWidth, height / canvasHeight);
                        canvasWidth = Math.max(1, Math.round(canvasWidth * scale));
                        canvasHeight = Math.max(1, Math.round(canvasHeight * scale));
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
                        0.7
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

        // Handle image files - generate optimized preview preserving aspect ratio
        if (file.type.startsWith('image/')) {
            setIsLoading(true);
            setError(false);

            const generateOptimizedPreview = async () => {
                try {
                    // Create bitmap to inspect native dimensions
                    const bitmap = await createImageBitmap(file);
                    const origWidth = bitmap.width;
                    const origHeight = bitmap.height;

                    let targetWidth = origWidth;
                    let targetHeight = origHeight;

                    // Calculate proportional dimensions fitting within width x height bounding box
                    if (targetWidth > width || targetHeight > height) {
                        const scale = Math.min(width / targetWidth, height / targetHeight);
                        targetWidth = Math.max(1, Math.round(targetWidth * scale));
                        targetHeight = Math.max(1, Math.round(targetHeight * scale));
                    }

                    // Draw to canvas with preserved aspect ratio
                    const canvas = document.createElement('canvas');
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        bitmap.close();
                        throw new Error('Failed to get canvas context');
                    }

                    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
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
                        0.7
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
