import axios from 'axios';
import { api } from '@/lib/api';
import {
    PresignedUrlRequest,
    PresignedUrlResponse,
    ConfirmUploadRequest,
    ConfirmUploadResponse,
    DeleteUploadsRequest,
    DeleteUploadsResponse,
} from './types';

/**
 * S3 Upload Service
 * Handles the three-step upload process:
 * 1. Request presigned URLs from backend
 * 2. Upload files directly to S3
 * 3. Confirm uploads with backend
 */

export const PRESIGNED_BATCH_SIZE = 5;
export const S3_CONCURRENT_UPLOADS = 3;

export class S3UploadService {
    /**
     * Step 1: Request presigned URLs from the backend
     */
    static async getPresignedUrls(
        request: PresignedUrlRequest
    ): Promise<PresignedUrlResponse> {
        try {
            const response = await api.post<PresignedUrlResponse>(
                '/uploads/presigned-urls',
                request
            );
            return response.data;
        } catch (error) {
            console.error('Failed to get presigned URLs:', error);
            throw new Error(
                axios.isAxiosError(error)
                    ? error.response?.data?.message || 'Failed to get presigned URLs'
                    : 'Failed to get presigned URLs'
            );
        }
    }

    /**
     * Step 2: Upload file directly to S3 using presigned URL
     * @param presignedUrl - The presigned URL from backend
     * @param file - The file to upload
     * @param contentType - MIME type of the file
     * @param onProgress - Optional callback for upload progress (0-100)
     */
    static async uploadToS3(
        presignedUrl: string,
        file: File,
        contentType: string,
        onProgress?: (progress: number) => void
    ): Promise<void> {
        console.group("S3UploadService Debug");
        console.log("File Object:", file);
        console.log("File properties:", {
            name: file.name,
            size: file.size,
            type: file.type
        });

        // Strict validation: Ensure we are sending a valid binary Body
        if (!(file instanceof Blob)) {
            console.error('S3UploadService: Invalid file object passed. Expected Blob/File, got:', file);
            throw new Error('S3UploadService: file argument must be a Blob or File object to ensure binary upload.');
        }

        try {
            // 1. Explicitly read file to ArrayBuffer to ensure we have the bytes
            const fileBuffer = await file.arrayBuffer();
            console.log(`Read File to ArrayBuffer. ByteLength: ${fileBuffer.byteLength}`);

            if (fileBuffer.byteLength === 0) {
                throw new Error("S3UploadService: File is empty (0 bytes) after reading. Cannot upload.");
            }

            // 2. Use XMLHttpRequest for progress tracking
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                // Track upload progress
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable && onProgress) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        onProgress(percentComplete);
                    }
                });

                // Handle completion
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        console.log("S3 Upload Success:", xhr.status);
                        if (onProgress) onProgress(100);
                        resolve();
                    } else {
                        const errorText = xhr.responseText;
                        console.error("S3 Upload Error Response Body (XML):", errorText);
                        reject(new Error(`S3 upload failed with status ${xhr.status}. Details: ${errorText}`));
                    }
                });

                // Handle errors
                xhr.addEventListener('error', () => {
                    reject(new Error('Network error during S3 upload'));
                });

                xhr.addEventListener('abort', () => {
                    reject(new Error('S3 upload aborted'));
                });

                // Open and send request
                xhr.open('PUT', presignedUrl);
                xhr.setRequestHeader('Content-Type', contentType);
                xhr.send(fileBuffer);
            });

        } catch (err) {
            console.error("S3 Upload Exception:", err);
            throw err;
        } finally {
            console.groupEnd();
        }
    }

    /**
     * Step 3: Confirm upload with backend
     * This triggers backend processing (image variants, etc.)
     */
    static async confirmUpload(
        request: ConfirmUploadRequest
    ): Promise<ConfirmUploadResponse> {
        try {
            const response = await api.post<ConfirmUploadResponse>(
                '/uploads/confirm',
                request
            );
            return response.data;
        } catch (error) {
            console.error('Failed to confirm upload:', error);
            throw new Error(
                axios.isAxiosError(error)
                    ? error.response?.data?.message || 'Failed to confirm upload'
                    : 'Failed to confirm upload'
            );
        }
    }

    /**
     * Delete uploads from the backend
     */
    static async deleteUploads(
        request: DeleteUploadsRequest
    ): Promise<DeleteUploadsResponse> {
        try {
            const response = await api.delete<DeleteUploadsResponse>('/uploads', {
                data: request,
            });
            return response.data;
        } catch (error) {
            console.error('Failed to delete uploads:', error);
            throw new Error(
                axios.isAxiosError(error)
                    ? error.response?.data?.message || 'Failed to delete uploads'
                    : 'Failed to delete uploads'
            );
        }
    }
}
