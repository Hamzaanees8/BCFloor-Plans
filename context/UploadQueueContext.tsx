'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { PresignedUrlResponse } from '@/lib/upload/types';

// Upload status states
export type UploadStatus = 'pending' | 'uploading' | 'processing' | 'complete' | 'error';

// Individual file in the queue
export interface QueuedFile {
    id: string;
    file: File;
    filename: string;
    size: number;
    contentType: string;
    status: UploadStatus;
    progress: number; // 0-100
    error?: string;
    retryCount: number;

    // S3 upload info (set after presigned URL received)
    presignedUrl?: string;
    s3Key?: string;

    // Metadata for backend
    entityType: 'tour' | 'order' | 'listing';
    entityId: string;
    tourId?: string;
    group?: string;
    serviceId?: string;
    isSimulation?: boolean;
}

// Queue statistics
export interface QueueStats {
    total: number;
    pending: number;
    uploading: number;
    processing: number;
    complete: number;
    error: number;
    overallProgress: number; // 0-100
}

interface UploadQueueContextType {
    queue: QueuedFile[];
    stats: QueueStats;
    isUploading: boolean;

    // Actions
    addToQueue: (files: File[], metadata: UploadMetadata) => void;
    removeFromQueue: (id: string) => void;
    retryUpload: (id: string) => void;
    clearCompleted: () => void;
    cancelAll: () => void;

    // Visibility
    isQueueVisible: boolean;
    setQueueVisible: (visible: boolean) => void;
}

interface UploadMetadata {
    entityType: 'tour' | 'order' | 'listing';
    entityId: string;
    tourId?: string;
    group?: string;
    serviceId?: string;
    isSimulation?: boolean;
}

const UploadQueueContext = createContext<UploadQueueContextType | undefined>(undefined);

// Constants
const MAX_CONCURRENT_UPLOADS = 3;
const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 2000;

export function UploadQueueProvider({ children }: { children: ReactNode }) {
    const [queue, setQueue] = useState<QueuedFile[]>([]);
    const [isQueueVisible, setQueueVisible] = useState(false);
    const [activeUploads, setActiveUploads] = useState(0);

    // Calculate stats
    const stats: QueueStats = {
        total: queue.length,
        pending: queue.filter(f => f.status === 'pending').length,
        uploading: queue.filter(f => f.status === 'uploading').length,
        processing: queue.filter(f => f.status === 'processing').length,
        complete: queue.filter(f => f.status === 'complete').length,
        error: queue.filter(f => f.status === 'error').length,
        overallProgress: queue.length > 0
            ? Math.round(queue.reduce((sum, f) => sum + f.progress, 0) / queue.length)
            : 0,
    };

    const isUploading = stats.uploading > 0 || stats.pending > 0;

    // Add files to queue
    const addToQueue = useCallback((files: File[], metadata: UploadMetadata) => {
        const newFiles: QueuedFile[] = files.map(file => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            filename: file.name,
            size: file.size,
            contentType: file.type,
            status: 'pending' as UploadStatus,
            progress: 0,
            retryCount: 0,
            entityType: metadata.entityType,
            entityId: metadata.entityId,
            tourId: metadata.tourId,
            group: metadata.group,
            serviceId: metadata.serviceId,
            isSimulation: metadata.isSimulation,
        }));

        setQueue(prev => [...prev, ...newFiles]);
        setQueueVisible(true);
    }, []);

    // Remove file from queue
    const removeFromQueue = useCallback((id: string) => {
        setQueue(prev => prev.filter(f => f.id !== id));
    }, []);

    // Retry failed upload
    const retryUpload = useCallback((id: string) => {
        setQueue(prev => prev.map(f =>
            f.id === id
                ? { ...f, status: 'pending' as UploadStatus, progress: 0, error: undefined }
                : f
        ));
    }, []);

    // Clear completed uploads
    const clearCompleted = useCallback(() => {
        setQueue(prev => prev.filter(f => f.status !== 'complete'));
    }, []);

    // Cancel all uploads
    const cancelAll = useCallback(() => {
        setQueue([]);
    }, []);

    // Update file in queue
    const updateFile = useCallback((id: string, updates: Partial<QueuedFile>) => {
        setQueue(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    }, []);

    // Process upload queue
    useEffect(() => {
        const processQueue = async () => {
            const pendingFiles = queue.filter(f => f.status === 'pending');
            const availableSlots = MAX_CONCURRENT_UPLOADS - activeUploads;

            if (availableSlots <= 0 || pendingFiles.length === 0) return;

            const filesToProcess = pendingFiles.slice(0, availableSlots);

            for (const file of filesToProcess) {
                setActiveUploads(prev => prev + 1);
                processFile(file);
            }
        };

        const processFile = async (queuedFile: QueuedFile) => {
            try {
                updateFile(queuedFile.id, { status: 'uploading' });

                if (queuedFile.isSimulation) {
                    // Simulation mode
                    let progress = 0;
                    while (progress < 100) {
                        progress += 10;
                        updateFile(queuedFile.id, { progress });
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                    updateFile(queuedFile.id, { status: 'complete', progress: 100 });
                } else {
                    // Real upload logic
                    // Step 1: Get presigned URL
                    const presignedData = await getPresignedUrl(queuedFile);
                    updateFile(queuedFile.id, {
                        presignedUrl: presignedData.presigned_url,
                        s3Key: presignedData.s3_key,
                    });

                    // Step 2: Upload to S3 with progress
                    await uploadToS3(
                        queuedFile.file,
                        presignedData.presigned_url,
                        (progress) => updateFile(queuedFile.id, { progress })
                    );

                    // Step 3: Confirm upload with backend
                    await confirmUpload(queuedFile, presignedData);

                    // Mark as processing (if image) or complete (if video)
                    const isVideo = queuedFile.contentType.startsWith('video/');
                    updateFile(queuedFile.id, {
                        status: isVideo ? 'complete' : 'processing',
                        progress: 100,
                    });

                    // For images, poll for processing completion
                    if (!isVideo) {
                        setTimeout(() => {
                            updateFile(queuedFile.id, { status: 'complete' });
                        }, 2000);
                    }
                }

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Upload failed';

                if (queuedFile.retryCount < MAX_RETRY_COUNT) {
                    // Retry after delay
                    setTimeout(() => {
                        updateFile(queuedFile.id, {
                            status: 'pending',
                            retryCount: queuedFile.retryCount + 1,
                            progress: 0,
                        });
                    }, RETRY_DELAY_MS * (queuedFile.retryCount + 1));
                } else {
                    updateFile(queuedFile.id, {
                        status: 'error',
                        error: errorMessage,
                    });
                }
            } finally {
                setActiveUploads(prev => prev - 1);
            }
        };

        processQueue();
    }, [queue, activeUploads, updateFile]);

    return (
        <UploadQueueContext.Provider value={{
            queue,
            stats,
            isUploading,
            addToQueue,
            removeFromQueue,
            retryUpload,
            clearCompleted,
            cancelAll,
            isQueueVisible,
            setQueueVisible,
        }}>
            {children}
        </UploadQueueContext.Provider>
    );
}

export function useUploadQueue() {
    const context = useContext(UploadQueueContext);
    if (!context) {
        throw new Error('useUploadQueue must be used within UploadQueueProvider');
    }
    return context;
}

// API helper functions (in the same file or separate)
async function getPresignedUrl(file: QueuedFile) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem('token'); // Adjust based on your auth

    const response = await fetch(`${API_URL}/uploads/presigned-urls`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            entity_type: file.entityType,
            entity_id: file.entityId,
            files: [{
                filename: file.filename,
                content_type: file.contentType,
                size: file.size,
            }],
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to get presigned URL');
    }

    const data = await response.json() as PresignedUrlResponse;
    return data.data.uploads[0];
}

async function uploadToS3(
    file: File,
    presignedUrl: string,
    onProgress: (progress: number) => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100);
                onProgress(progress);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
            }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
    });
}

async function confirmUpload(file: QueuedFile, presignedData: PresignedUrlResponse['data']['uploads'][0]) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/uploads/confirm`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            entity_type: file.entityType,
            entity_id: file.entityId,
            tour_id: file.tourId,
            uploads: [{
                upload_id: presignedData.upload_id,
                s3_key: presignedData.s3_key,
                original_filename: file.filename,
                content_type: file.contentType,
                group: file.group,
                service_id: file.serviceId,
            }],
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to confirm upload');
    }

    return response.json();
}
