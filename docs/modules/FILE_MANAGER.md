# BC Floor - Module Documentation: FILE_MANAGER

S3 file uploads and downloads. Read AI_INDEX.md first.

---

## Feature Overview

**Purpose**: Upload, organize, and download files (photos, PDFs, documents)

**Responsibility**:
- Upload files to S3 (presigned URL flow)
- Track uploaded files
- Organize files by order/user
- Download files
- Delete files

**User Scope**:
- Admin: Upload/download any files
- Agent: Upload/download team files
- Vendor: Upload/download assigned files
- Co-Agent: Upload/download personal files

---

## Business Logic

### File Upload Flow

```
Step 1: USER SELECTS FILES
  User clicks "Upload" button
  ├─ File picker opens
  ├─ User selects multiple files (up to limit)
  └─ Files queued for upload

Step 2: REQUEST PRESIGNED URLS
  Frontend action: POST /uploads/presigned-urls
  
  Request:
  {
    files: [
      {
        name: "photo1.jpg",
        size: 2097152,              // 2 MB
        type: "image/jpeg"
      },
      {
        name: "photo2.jpg",
        size: 1572864,              // 1.5 MB
        type: "image/jpeg"
      }
    ]
  }
  
  Backend validation:
  ├─ File size OK? (max 100 MB)
  ├─ File type allowed? (images, PDFs, docs)
  ├─ User quota OK? (max X files per user)
  │
  ├─ For each file:
  │  ├─ Generate S3 key (unique filename)
  │  ├─ Generate presigned URL (valid 1 hour)
  │  └─ Return key + URL
  │
  └─ Response: Array of presigned URLs

  Response:
  {
    presigned_urls: [
      {
        key: "uploads/2026/06/abc123-photo1.jpg",
        url: "https://s3.amazonaws.com/bucket/...?X-Amz-Signature=...",
        expires_in: 3600
      },
      {
        key: "uploads/2026/06/def456-photo2.jpg",
        url: "https://s3.amazonaws.com/bucket/...?X-Amz-Signature=...",
        expires_in: 3600
      }
    ]
  }

Step 3: UPLOAD TO S3 (CLIENT-SIDE)
  Frontend batches uploads (3 concurrent max)
  
  For each presigned URL:
  ├─ Create XMLHttpRequest
  ├─ Set request headers (Content-Type)
  ├─ Set upload progress handler (onProgress)
  ├─ PUT file binary to presigned URL
  ├─ S3 receives file directly
  │
  └─ Track progress:
     ├─ Total size: 3.67 MB
     ├─ Uploaded: 1.5 MB (40%)
     ├─ Remaining: 2.17 MB
     └─ Show overlay with progress bar

  Progress event handler:
  ├─ Calculate % complete = (loaded / total) * 100
  ├─ Update UI
  └─ Emit progress to GlobalFileUploadContext

  S3 confirms upload (200 OK)

Step 4: CONFIRM UPLOAD WITH BACKEND
  Frontend action: POST /uploads/confirm
  
  Request:
  {
    uploads: [
      {
        key: "uploads/2026/06/abc123-photo1.jpg",
        size: 2097152,
        type: "image/jpeg"
      },
      {
        key: "uploads/2026/06/def456-photo2.jpg",
        size: 1572864,
        type: "image/jpeg"
      }
    ]
  }
  
  Backend:
  ├─ For each upload:
  │  ├─ Verify file exists on S3
  │  ├─ Create Upload record in database
  │  ├─ Link to user/order/entity
  │  └─ Generate permanent S3 URL
  │
  └─ Return confirmed uploads with URLs

  Response:
  {
    confirmed: [
      {
        key: "uploads/2026/06/abc123-photo1.jpg",
        url: "https://s3.bcfloor.com/uploads/2026/06/abc123-photo1.jpg",
        size: 2097152
      },
      {
        key: "uploads/2026/06/def456-photo2.jpg",
        url: "https://s3.bcfloor.com/uploads/2026/06/def456-photo2.jpg",
        size: 1572864
      }
    ]
  }

Step 5: DISPLAY SUCCESS
  Frontend:
  ├─ Show toast: "2 files uploaded successfully"
  ├─ Hide progress overlay
  ├─ Files appear in file manager
  ├─ Files visible in GlobalFileUploadContext
  └─ User can download/share/delete
```

### File Download Flow

```
Step 1: USER REQUESTS DOWNLOAD
  User clicks file in manager
  
  Action: GET /downloads/{file_id}
  
  Backend:
  ├─ Verify user has access
  ├─ Generate pre-signed download URL
  ├─ (Optional) Log download
  └─ Return URL

Step 2: FRONTEND DOWNLOADS
  Frontend receives URL
  ├─ Create hidden <a> tag
  ├─ Set href = download URL
  ├─ Trigger click()
  └─ Browser downloads file

Step 3: OPTIONAL BULK DOWNLOAD
  User selects multiple files
  
  Action: POST /downloads/batch
  {
    file_ids: [1, 2, 3]
  }
  
  Backend:
  ├─ Zip files together
  ├─ Generate download URL for zip
  └─ Return URL
  
  Frontend: Download zip
```

---

## APIs

### POST /uploads/presigned-urls

**Purpose**: Get presigned URLs for file upload

**Request**:
```json
{
  "files": [
    {
      "name": "photo.jpg",
      "size": 2097152,
      "type": "image/jpeg"
    }
  ]
}
```

**Response (200)**:
```json
{
  "presigned_urls": [
    {
      "key": "uploads/2026/06/abc123-photo.jpg",
      "url": "https://s3.amazonaws.com/bucket/...?X-Amz-Signature=...",
      "expires_in": 3600
    }
  ]
}
```

---

### POST /uploads/confirm

**Purpose**: Confirm upload complete, create records

**Request**:
```json
{
  "uploads": [
    {
      "key": "uploads/2026/06/abc123-photo.jpg",
      "size": 2097152,
      "type": "image/jpeg"
    }
  ]
}
```

**Response (200)**:
```json
{
  "confirmed": [
    {
      "key": "uploads/2026/06/abc123-photo.jpg",
      "url": "https://s3.bcfloor.com/uploads/2026/06/abc123-photo.jpg",
      "size": 2097152
    }
  ]
}
```

---

### DELETE /files/{id}

**Purpose**: Delete file

**Response (200)**:
```json
{
  "message": "File deleted"
}
```

---

### GET /downloads/{file_id}

**Purpose**: Get download URL

**Response (200)**:
```json
{
  "url": "https://s3.bcfloor.com/uploads/...?X-Amz-Signature=..."
}
```

---

## Data Models

```typescript
export interface Upload {
    id: number
    uuid: string
    user_id: number
    order_id?: number
    key: string                 // S3 key
    filename: string
    size: number
    type: string                // MIME type
    url: string                 // Public S3 URL
    status: 'pending' | 'confirmed' | 'deleted'
    created_at: string
}
```

---

## Components

### GlobalUploadProgressOverlay
**File**: `components/upload/GlobalUploadProgressOverlay.tsx`

**Purpose**: Show upload progress across app

**Display**:
- Overlay (semi-transparent)
- Progress bar per file
- Total progress
- Cancel button
- File names + sizes

**Context**: GlobalFileUploadContext

---

### UploadProgressToast
**File**: `components/upload/UploadProgressToast.tsx`

**Purpose**: Toast notification for upload progress

**Display**:
- Minimal notification
- % complete
- Cancel option

---

### File Manager Page
**Route**: `/dashboard/file-manager`

**Features**:
- Upload zone (drag & drop)
- File list (table)
- Columns: Filename, Size, Type, Uploaded by, Uploaded date, Actions
- Actions: Download, Share, Delete, Preview
- Filters: By type, date, user
- Search: Filename search

---

## Hooks

### useS3Upload()

**Returns**:
```typescript
{
  uploadFiles: (files: File[]) => Promise<void>
  uploadProgress: Map<string, number>
  uploading: boolean
  error?: string
}
```

**Usage**:
```typescript
const { uploadFiles, uploadProgress, uploading } = useS3Upload();

const handleUpload = async (files: File[]) => {
  try {
    await uploadFiles(files);
    toast.success("Upload complete");
  } catch (err) {
    toast.error("Upload failed");
  }
};
```

---

## Context

### GlobalFileUploadContext

**State**:
```typescript
{
  queue: Array<{
    id: string
    file: File
    progress: number         // 0-100
    status: 'pending' | 'uploading' | 'complete' | 'error'
  }>
  addToQueue: (files: File[]) => void
  updateProgress: (id, progress) => void
  completeUpload: (id) => void
  errorUpload: (id, error) => void
}
```

---

## Features

### Concurrent Upload Limiting
- Max 3 concurrent uploads
- Queue remaining files
- Respects browser resource limits

### Progress Tracking
- Per-file progress (XMLHttpRequest)
- Total progress
- Real-time UI updates

### Batch Operations
- Select multiple files
- Download as zip
- Delete multiple
- Bulk share

### File Organization
- By order
- By user
- By date
- By type (images, PDFs, etc)

### Security
- Presigned URLs expire in 1 hour
- Access control (user can only see own files)
- MIME type validation
- File size limits (100 MB)

---

## Configuration

**File Limits**:
```typescript
const FILE_CONFIG = {
  MAX_FILE_SIZE: 104857600,        // 100 MB
  MAX_CONCURRENT_UPLOADS: 3,
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
}
```

---

## S3 Configuration

**Bucket Setup**:
- CORS headers configured
- Public read access (for URLs)
- Private write access (presigned URLs only)
- Lifecycle policy (delete after 90 days)

**Presigned URL**:
- Method: PUT
- Expiration: 1 hour
- Custom headers: Content-Type

---

## Testing Checklist

- [ ] Upload single file
- [ ] Upload multiple files
- [ ] Progress bar shows
- [ ] File appears in file manager
- [ ] Download file
- [ ] Delete file
- [ ] Max file size enforced
- [ ] Invalid file type rejected
- [ ] Concurrent upload limiting works (max 3)
- [ ] Cancel upload works
- [ ] Network error handling

---

## Edge Cases

### Case 1: Upload Interrupted
**Scenario**: Network drops during upload

**Behavior**:
- Show error message
- Option to retry
- File not confirmed (no DB record)

---

### Case 2: Presigned URL Expired
**Scenario**: User waits >1 hour before uploading

**Behavior**:
- Show "URL expired"
- Request new URL
- Re-upload file

---

### Case 3: File Already Exists
**Scenario**: Same filename uploaded twice

**Behavior**:
- Generate unique filename (add timestamp)
- Store both files with different keys
- Show message

---

### Case 4: Quota Exceeded
**Scenario**: User has reached upload limit

**Behavior**:
- Show "Storage quota exceeded"
- Delete old files to free space
- Or upgrade plan

---

## Related Features

- **Orders**: Attach files to orders
- **Properties**: Property photos
- **Vendors**: Vendor documentation

---

## Known Issues

- None reported

---

## Last Updated

Generated: 2026-06-02
Related: PROJECT_CONTEXT.md (S3 Integration section)
