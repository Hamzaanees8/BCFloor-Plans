
export interface PresignedUrlRequest {
    entity_type: 'tour' | 'order' | 'listing' | 'feature-sheet' | 'vendor-portfolio' | 'agent' | 'agent-audio' | 'organization-audio' | 'video-thumbnail';
    entity_id: string;
    files: {
        filename: string;
        content_type: string;
        size: number;
    }[];
}

export interface PresignedUrlResponse {
    success: boolean;
    data: {
        entity_type: string;
        entity_id: string;
        uploads: {
            upload_id: string;
            original_filename: string;
            content_type: string;
            s3_key: string;
            presigned_url: string;
            expires_at: string;
        }[];
    };
}

export interface ConfirmUploadRequest {
    entity_type: 'tour' | 'order' | 'listing' | 'feature-sheet' | 'vendor-portfolio' | 'agent' | 'agent-audio' | 'organization-audio' | 'video-thumbnail';
    entity_id: string;
    tour_id?: string;
    feature_sheet_id?: string;
    uploads: {
        upload_id: string;
        s3_key: string;
        original_filename: string;
        content_type: string;
        slot?: string;
        group?: string;
        service_id?: string;
        size?: number;
        is_featured?: boolean;
        is_admin_approved?: boolean;
        is_agent_approved?: boolean;
        is_show?: boolean;
        sort_order?: number;
    }[];
}

export interface VideoVariants {
    thumb?: string;
    player?: string;
}

export interface VideoVariantUrls {
    thumb?: string;
    player?: string;
}

export interface ConfirmUploadResponse {
    success: boolean;
    data: {
        files: {
            uuid: string;
            filename: string;
            status: 'complete' | 'processing';
            // Returned for video-thumbnail confirmations
            variants?: VideoVariants;
            variant_urls?: VideoVariantUrls;
        }[];
    };
}

// Upload progress tracking
export interface UploadProgress {
    uploadId: string;
    filename: string;
    progress: number; // 0-100
    status: 'pending' | 'uploading' | 'confirming' | 'complete' | 'error';
    error?: string;
}

export interface FileUploadState {
    file: File;
    uploadId?: string;
    s3Key?: string;
    progress: number;
    status: 'pending' | 'uploading' | 'confirming' | 'complete' | 'error';
    error?: string;
}

export interface S3UploadResult {
    success: boolean;
    files: {
        uuid: string;
        filename: string;
        status: 'complete' | 'processing';
    }[];
    errors?: string[];
}

export interface DeleteUploadsRequest {
    uuids: string[];
    type: string;
}

export interface DeleteUploadsResponse {
    success: boolean;
    message?: string;
}
