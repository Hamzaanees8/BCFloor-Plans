// hooks/useS3Upload.ts
import { useState, useCallback } from 'react';
import { S3UploadService } from '@/lib/upload/s3-service';
import {
    FileUploadState,
    S3UploadResult,
    PresignedUrlRequest,
} from '@/lib/upload/types';

interface UseS3UploadOptions {
    entityType: 'tour' | 'order' | 'listing';
    entityId: string;
    tourId?: string;
    serviceId?: string;
    group?: string;
}

interface UseS3UploadReturn {
    uploadFiles: (files: File[] | { file: File; is_featured?: boolean; is_admin_approved?: boolean; is_agent_approved?: boolean; is_show?: boolean }[]) => Promise<S3UploadResult>;
    uploadStates: FileUploadState[];
    isUploading: boolean;
    overallProgress: number;
    reset: () => void;
}

/**
 * Custom hook for uploading files directly to S3
 * Handles the complete upload flow:
 * 1. Request presigned URLs
 * 2. Upload files to S3 with progress tracking
 * 3. Confirm uploads with backend
 */
export function useS3Upload(options: UseS3UploadOptions): UseS3UploadReturn {
    const [uploadStates, setUploadStates] = useState<FileUploadState[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Calculate overall progress across all files
    const overallProgress = uploadStates.length > 0
        ? Math.round(
            uploadStates.reduce((sum, state) => sum + state.progress, 0) /
            uploadStates.length
        )
        : 0;

    const reset = useCallback(() => {
        setUploadStates([]);
        setIsUploading(false);
    }, []);

    const uploadFiles = useCallback(
        async (files: File[] | { file: File; is_featured?: boolean; is_admin_approved?: boolean; is_agent_approved?: boolean; is_show?: boolean }[]): Promise<S3UploadResult> => {
            const filesToProcess = files.map(f => f instanceof File ? { file: f } : f);

            if (filesToProcess.length === 0) {
                return { success: true, files: [] };
            }

            setIsUploading(true);

            // Initialize upload states
            const initialStates: FileUploadState[] = filesToProcess.map((f) => ({
                file: f.file,
                progress: 0,
                status: 'pending',
            }));
            setUploadStates(initialStates);

            try {
                // Step 1: Request presigned URLs
                const presignedRequest: PresignedUrlRequest = {
                    entity_type: options.entityType,
                    entity_id: options.entityId,
                    files: filesToProcess.map((f) => ({
                        filename: f.file.name,
                        content_type: f.file.type,
                        size: f.file.size,
                    })),
                };

                const presignedResponse = await S3UploadService.getPresignedUrls(
                    presignedRequest
                );

                if (!presignedResponse.success || !presignedResponse.data.uploads) {
                    throw new Error('Failed to get presigned URLs');
                }

                const uploads = presignedResponse.data.uploads;

                // Step 2: Upload files to S3 concurrently
                const uploadPromises = filesToProcess.map(async (f, index) => {
                    const upload = uploads[index];
                    const file = f.file;
                    if (!upload) {
                        throw new Error(`No presigned URL for file: ${file.name}`);
                    }

                    // Update state: uploading
                    setUploadStates((prev) =>
                        prev.map((state, i) =>
                            i === index
                                ? {
                                    ...state,
                                    uploadId: upload.upload_id,
                                    s3Key: upload.s3_key,
                                    status: 'uploading',
                                }
                                : state
                        )
                    );

                    try {
                        await S3UploadService.uploadToS3(
                            upload.presigned_url,
                            file,
                            upload.content_type,
                            (progress) => {
                                setUploadStates((prev) =>
                                    prev.map((state, i) =>
                                        i === index ? { ...state, progress } : state
                                    )
                                );
                            }
                        );

                        // Update state: upload complete, waiting for confirmation
                        setUploadStates((prev) =>
                            prev.map((state, i) =>
                                i === index
                                    ? { ...state, progress: 100, status: 'confirming' }
                                    : state
                            )
                        );

                        return {
                            upload_id: upload.upload_id,
                            s3_key: upload.s3_key,
                            original_filename: upload.original_filename,
                            content_type: upload.content_type,
                            group: options.group,
                            service_id: options.serviceId,
                            is_featured: f.is_featured,
                            is_admin_approved: f.is_admin_approved,
                            is_agent_approved: f.is_agent_approved,
                            is_show: f.is_show,
                        };
                    } catch (error) {
                        // Update state: error
                        setUploadStates((prev) =>
                            prev.map((state, i) =>
                                i === index
                                    ? {
                                        ...state,
                                        status: 'error',
                                        error:
                                            error instanceof Error
                                                ? error.message
                                                : 'Upload failed',
                                    }
                                    : state
                            )
                        );
                        throw error;
                    }
                });

                const uploadedFiles = await Promise.all(uploadPromises);

                // Step 3: Confirm uploads with backend
                const confirmResponse = await S3UploadService.confirmUpload({
                    entity_type: options.entityType,
                    entity_id: options.entityId,
                    tour_id: options.tourId,
                    uploads: uploadedFiles,
                });

                if (!confirmResponse.success) {
                    throw new Error('Failed to confirm uploads');
                }

                // Update all states to complete
                setUploadStates((prev) =>
                    prev.map((state) => ({ ...state, status: 'complete' }))
                );

                setIsUploading(false);

                return {
                    success: true,
                    files: confirmResponse.data.files,
                };
            } catch (error) {
                setIsUploading(false);

                // Mark any pending/uploading files as errored
                setUploadStates((prev) =>
                    prev.map((state) =>
                        state.status !== 'complete' && state.status !== 'error'
                            ? {
                                ...state,
                                status: 'error',
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : 'Upload failed',
                            }
                            : state
                    )
                );

                return {
                    success: false,
                    files: [],
                    errors: [
                        error instanceof Error ? error.message : 'Upload failed',
                    ],
                };
            }
        },
        [options]
    );

    return {
        uploadFiles,
        uploadStates,
        isUploading,
        overallProgress,
        reset,
    };
}
