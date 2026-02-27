export type DualMode = 'upload' | 'reorder';

export type FileItemStatus = 'local' | 'uploaded';

export interface FileItem {
    clientId: string; // uuid
    serverId?: string; // exists only if uploaded
    file?: File; // exists only if local
    url: string; // preview or S3 url
    status: FileItemStatus;
    order: number;

    // Keep a reference to the original data (SelectedFiles or Files) 
    // so we can reconstruct the payload for saving
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    originalData?: any;
}
