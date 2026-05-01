import { S3UploadService } from './s3-service';

export interface AudioUploadOptions {
    /** 'agent-audio' for agent-scoped files, 'organization-audio' for org-scoped */
    entityType: 'agent-audio' | 'organization-audio';
    /** UUID of the agent or organization */
    entityId: string;
    /** The File object selected by the user */
    file: File;
    /** Optional progress callback (0–100) */
    onProgress?: (progress: number) => void;
}

export interface AudioUploadResult {
    success: boolean;
    audio?: {
        uuid: string;
        filename: string;
        url?: string;
    };
    error?: string;
}

const ALLOWED_MIME = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4'];
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

/**
 * Validates, uploads, and confirms an audio file using the 3-step S3 presigned URL flow.
 */
export async function uploadAudioFile(options: AudioUploadOptions): Promise<AudioUploadResult> {
    const { entityType, entityId, file, onProgress } = options;

    // Client-side validation
    if (!file) {
        return { success: false, error: 'No file provided' };
    }
    if (file.size > MAX_SIZE_BYTES) {
        return { success: false, error: 'File exceeds the 20 MB size limit' };
    }
    const mimeOk =
        ALLOWED_MIME.includes(file.type) ||
        file.type.startsWith('audio/');
    if (!mimeOk) {
        return { success: false, error: 'Invalid file type. Please upload an MP3 or WAV file.' };
    }

    try {
        // Step 1: Request presigned URL
        const presignedRes = await S3UploadService.getPresignedUrls({
            entity_type: entityType,
            entity_id: entityId,
            files: [
                {
                    filename: file.name,
                    content_type: file.type || 'audio/mpeg',
                    size: file.size,
                },
            ],
        });

        if (!presignedRes.success || !presignedRes.data?.uploads?.length) {
            return { success: false, error: 'Failed to get upload URL from server' };
        }

        const upload = presignedRes.data.uploads[0];

        // Step 2: PUT file directly to S3
        await S3UploadService.uploadToS3(
            upload.presigned_url,
            file,
            upload.content_type,
            onProgress,
        );

        // Step 3: Confirm with backend
        const confirmRes = await S3UploadService.confirmUpload({
            entity_type: entityType,
            entity_id: entityId,
            uploads: [
                {
                    upload_id: upload.upload_id,
                    s3_key: upload.s3_key,
                    original_filename: upload.original_filename,
                    content_type: upload.content_type,
                    size: file.size,
                },
            ],
        });

        if (!confirmRes.success || !confirmRes.data?.files?.length) {
            return { success: false, error: 'Upload succeeded but backend confirmation failed' };
        }

        const confirmed = confirmRes.data.files[0] as {
            uuid: string;
            filename: string;
            url?: string;
            status: string;
        };

        return {
            success: true,
            audio: {
                uuid: confirmed.uuid,
                filename: confirmed.filename,
                url: confirmed.url,
            },
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Audio upload failed';
        console.error('[audio-upload] Error:', err);
        return { success: false, error: message };
    }
}
