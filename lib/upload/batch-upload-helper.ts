// lib/upload/batch-upload-helper.ts
import { FileUploadState } from './types';

/**
 * Process items in batches sequentially
 * @param items - Array of items to process
 * @param batchSize - Number of items to process in each batch
 * @param processor - Async function to process each item
 */
export async function processBatch<T>(
    items: T[],
    batchSize: number,
    processor: (item: T, index: number) => Promise<void>
): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchPromises = batch.map((item, batchIndex) =>
            processor(item, i + batchIndex)
        );
        await Promise.all(batchPromises);
    }
}

/**
 * Calculate overall progress from individual file states
 * @param states - Array of file upload states
 * @returns Overall progress percentage (0-100)
 */
export function calculateOverallProgress(states: FileUploadState[]): number {
    if (states.length === 0) return 0;

    const totalProgress = states.reduce((sum, state) => sum + state.progress, 0);
    return Math.round(totalProgress / states.length);
}

/**
 * Process files in batches with progress tracking
 * @param files - Array of files with their upload info
 * @param batchSize - Number of files to upload concurrently
 * @param uploadFn - Function to upload a single file
 * @param onProgress - Callback for progress updates
 */
export async function uploadFilesInBatches<T extends { file: File }>(
    files: T[],
    uploads: Array<{
        upload_id: string;
        s3_key: string;
        original_filename: string;
        content_type: string;
        presigned_url: string;
    }>,
    batchSize: number,
    uploadFn: (
        presignedUrl: string,
        file: File,
        contentType: string,
        onProgress?: (progress: number) => void
    ) => Promise<void>,
    onFileProgress?: (index: number, progress: number, status: FileUploadState['status']) => void
): Promise<void> {
    await processBatch(files, batchSize, async (fileObj, index) => {
        const upload = uploads[index];
        if (!upload) {
            throw new Error(`No presigned URL for file: ${fileObj.file.name}`);
        }

        // Update status to uploading
        if (onFileProgress) {
            onFileProgress(index, 0, 'uploading');
        }

        try {
            await uploadFn(
                upload.presigned_url,
                fileObj.file,
                upload.content_type,
                (progress) => {
                    if (onFileProgress) {
                        onFileProgress(index, progress, 'uploading');
                    }
                }
            );

            // Mark as complete
            if (onFileProgress) {
                onFileProgress(index, 100, 'complete');
            }
        } catch (error) {
            // Mark as error
            if (onFileProgress) {
                onFileProgress(index, 0, 'error');
            }
            throw error;
        }
    });
}
