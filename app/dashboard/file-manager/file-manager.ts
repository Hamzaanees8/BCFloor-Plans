export interface Area {
  type: string;
  footage: number;
  custom_title?: string;
  uuid?: string;
  category?: "Finished" | "Subtotal" | "Other";
}
export interface OrderPayload {
  areas: Area[];
}
export interface FetchErrors {
  status?: boolean;
  message?: string;
  errors?: string[];
}
function payloadToFormData(payload: OrderPayload): FormData {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (value instanceof File) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (key === "areas") {
          Object.entries(item).forEach(([subKey, subVal]) => {
            if (subVal !== undefined && subVal !== null) {
              formData.append(`${key}[${index}][${subKey}]`, String(subVal));
            }
          });
        } else {
          formData.append(`${key}[${index}]`, String(item));
        }
      });
    } else if (typeof value === "object") {
      Object.entries(value).forEach(([subKey, subVal]) => {
        if (subVal !== undefined && subVal !== null) {
          formData.append(`${key}[${subKey}]`, String(subVal));
        }
      });
    } else {
      formData.append(key, String(value));
    }
  });

  return formData;
}
export async function EditOrder(
  orderId: string,
  payload: OrderPayload,
  token: string,
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const formData = payloadToFormData(payload);

  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    (error as FetchErrors).errors = data.errors;
    throw error;
  }

  return data;
}

import { toast } from "sonner";
import { DroppedMarker, Files, SelectedFiles } from "./FileManagerContext";
import { Order } from "../orders/page";
import { PRESIGNED_BATCH_SIZE, S3_CONCURRENT_UPLOADS, S3UploadService } from "@/lib/upload/s3-service";

/**
 * Helper function to determine file type from content_type (MIME type)
 */
function getFileTypeFromContentType(contentType: string): string {
  if (contentType.startsWith("video/")) return "video";
  if (contentType === "application/pdf") return "pdf";
  return "photo";
}


export async function GetFilesData(token: string, orderUuid: string, includeHidden: boolean = false) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  if (orderUuid === "") {
    toast.error("Order UUID is required to fetch files.");
    return;
  }
  const url = `${API_URL}/tours/order/${orderUuid}${includeHidden ? "?include_hidden=1" : ""}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `Upload failed with status ${response.status}`,
    );
  }

  return response.json();
}

export async function CreateTour(token: string, orderUuid: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const formData = new FormData();
  formData.append("order_id", orderUuid);
  formData.append("slide_show[slide_delay]", "3000");
  formData.append("slide_show[transitions]", "fade-in");
  formData.append("slide_show[background_audio]", "none");
  formData.append("slide_show[auto_play]", "0");
  formData.append("slide_show[video_overlay]", "0");

  const response = await fetch(`${API_URL}/tours`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Tour creation failed with status ${response.status}`,
    );
  }

  return response.json();
}

export async function HideMediaFiles(token: string, uuids: string[], is_hidden: boolean) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/uploads/hide`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ uuids, is_hidden }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to hide media files");
  }

  return response.json();
}

export async function ToggleFeatureSheetImage(token: string, image_uuid: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/feature-sheets/images/${image_uuid}/toggle-hide`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to toggle feature sheet image");
  }

  return response.json();
}

export async function DeleteSnapshot(token: string, uuid: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/tours/snapshots/${uuid}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to delete snapshot with status ${response.status}`);
  }

  return response.json();
}

export async function UploadFilesData(
  token: string,
  orderUuid: string,
  files: SelectedFiles[],
  links: {
    type: string;
    service_id: string;
    link: string;
    expiry_date?: string;
    uuid?: string;
  }[],
  snapshots: DroppedMarker[],
  delay: number,
  transition: string,
  selectedAudioTrack: string,
  onProgress?: (index: number, progress: number, status: 'pending' | 'uploading' | 'confirming' | 'complete' | 'error') => void
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const uploads: {
    upload_id: string;
    s3_key: string;
    original_filename: string;
    content_type: string;
    presigned_url: string;
  }[] = [];

  const fileUuids = new Map<File, string>();

  // Step 1: Upload files to S3 in batches
  if (files.length > 0) {
    try {
      // Split files into chunks for presigned URL requests
      for (let i = 0; i < files.length; i += PRESIGNED_BATCH_SIZE) {
        const fileBatch = files.slice(i, i + PRESIGNED_BATCH_SIZE);

        const filesPayload: any[] = [];
        fileBatch.forEach((f) => {
          filesPayload.push({
            filename: f.file.name,
            content_type: f.file.type,
            size: f.file.size,
          });
        });

        const presignedRequest = {
          entity_type: "order" as const,
          entity_id: orderUuid,
          files: filesPayload,
        };

        const presignedResponse = await S3UploadService.getPresignedUrls(presignedRequest);
        if (!presignedResponse.success) throw new Error("Failed to get presigned URLs");

        const batchUploads = presignedResponse.data.uploads;
        uploads.push(...batchUploads);

        const uploadTasks: { fileObj: SelectedFiles; upload: any; isThumb: boolean }[] = [];
        let uploadIdx = 0;
        fileBatch.forEach((fileObj) => {
           uploadTasks.push({ fileObj, upload: batchUploads[uploadIdx++], isThumb: false });
        });

        // Upload files in this batch to S3 (concurrency limit)
        for (let j = 0; j < uploadTasks.length; j += S3_CONCURRENT_UPLOADS) {
          const s3Batch = uploadTasks.slice(j, j + S3_CONCURRENT_UPLOADS);

          await Promise.all(s3Batch.map(async (task) => {
            const globalIndex = files.indexOf(task.fileObj);
            const upload = task.upload;

            if (onProgress && !task.isThumb) {
              onProgress(globalIndex, 0, 'uploading');
            }

            try {
              await S3UploadService.uploadToS3(
                upload.presigned_url,
                task.isThumb && task.fileObj.thumbnailFile ? task.fileObj.thumbnailFile : task.fileObj.file,
                upload.content_type,
                (progress) => {
                  if (onProgress && !task.isThumb) {
                    onProgress(globalIndex, progress, 'uploading');
                  }
                }
              );
              if (!task.isThumb) fileUuids.set(task.fileObj.file, upload.upload_id);

              if (onProgress && !task.isThumb) {
                onProgress(globalIndex, 100, 'confirming');
              }
            } catch (error) {
              if (onProgress && !task.isThumb) {
                onProgress(globalIndex, 0, 'error');
              }
              throw error;
            }
          }));
        }
      }
    } catch (error) {
      console.error("S3 upload in UploadFilesData failed:", error);
      throw error;
    }
  }

  // Step 2: Create tour FIRST (to get tour UUID)
  const formData = new FormData();
  formData.append("order_id", orderUuid);

  links.forEach((linkObj, index) => {
    formData.append(`links[${index}][type]`, linkObj.type);
    formData.append(
      `links[${index}][service_id]`,
      String(linkObj.service_id || ""),
    );
    formData.append(`links[${index}][link]`, linkObj.link);
    if (linkObj.expiry_date)
      formData.append(`links[${index}][expiry_date]`, linkObj.expiry_date);
    if (linkObj.uuid) formData.append(`links[${index}][uuid]`, linkObj.uuid);
  });

  snapshots.forEach((snap, index) => {
    formData.append(`snapshots[${index}][name]`, snap.name || "");
    formData.append(`snapshots[${index}][file_name]`, snap.floorImageUrl || "");
    formData.append(`snapshots[${index}][description]`, snap.description || "");
    formData.append(
      `snapshots[${index}][file]`,
      snap.file || snap.variant_urls?.print || snap.variant_urls?.popup || snap.variant_urls?.thumb || snap.thumbnail_url || snap.url || snap.file_path || "",
    );
    const xAxis = Number(snap.x ?? (snap as any).x_axis ?? 0);
    const yAxis = Number(snap.y ?? (snap as any).y_axis ?? 0);
    formData.append(`snapshots[${index}][x_axis]`, String(xAxis.toFixed(6)));
    formData.append(`snapshots[${index}][y_axis]`, String(yAxis.toFixed(6)));
    if (snap.uuid) {
      formData.append(`snapshots[${index}][uuid]`, snap.uuid);
    }
  });

  formData.append("slide_show[slide_delay]", String(delay));
  formData.append("slide_show[transitions]", transition);
  formData.append("slide_show[background_audio]", selectedAudioTrack || "none");
  formData.append("slide_show[auto_play]", String(0));
  formData.append("slide_show[video_overlay]", String(0));

  const tourResponse = await fetch(`${API_URL}/tours`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!tourResponse.ok) {
    const errorData = await tourResponse.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
      `Tour creation failed with status ${tourResponse.status}`,
    );
  }

  const tourResult = await tourResponse.json();
  const tourUuid = tourResult.data.uuid;

  // Step 3: NOW confirm uploads with the new tourUuid in batches
  if (files.length > 0 && uploads.length > 0) {
    try {
      for (let i = 0; i < files.length; i += PRESIGNED_BATCH_SIZE) {
        const filesBatch = files.slice(i, i + PRESIGNED_BATCH_SIZE);
        const uploadsBatch = uploads.slice(i, i + PRESIGNED_BATCH_SIZE);

        const confirmUploadsPayload: any[] = [];
        let cIdx = 0;
        filesBatch.forEach((fileObj) => {
            const mainUpload = uploadsBatch[cIdx++];
            
            confirmUploadsPayload.push({
              upload_id: mainUpload.upload_id,
              s3_key: mainUpload.s3_key,
              original_filename: mainUpload.original_filename,
              content_type: mainUpload.content_type,
              type: getFileTypeFromContentType(mainUpload.content_type),
              subtype: fileObj.subtype || (fileObj.isPanorama ? "panorama_360" : null),
              group: fileObj.type,
              service_id: fileObj.service_id,
              is_featured: fileObj.is_featured || false,
              is_show: fileObj.is_show !== false,
              is_admin_approved: fileObj.is_admin_approved !== false,
              is_agent_approved: fileObj.is_agent_approved || false,
              is_complimentary: fileObj.is_complimentary || false,
              image_type: fileObj.isPanorama ? "panorama" : "normal",
              sort_order: fileObj.sort_order !== undefined ? fileObj.sort_order : files.indexOf(fileObj) + 1,
            });
        });

        const confirmResponse = await S3UploadService.confirmUpload({
          entity_type: "tour",
          entity_id: tourUuid,
          tour_id: tourUuid,
          uploads: confirmUploadsPayload,
        });

        // Loop over filesBatch to upload thumbnails for any video files that have one
        const createdFiles = confirmResponse.data?.files || [];
        for (const fileObj of filesBatch) {
            if (fileObj.thumbnailFile && fileObj.file.type.startsWith('video/')) {
                const createdFile = createdFiles.find(f => f.filename === fileObj.file.name);
                if (createdFile) {
                    const videoUuid = createdFile.uuid;
                    try {
                        const presignedResponse = await S3UploadService.getPresignedUrls({
                            entity_type: "video-thumbnail",
                            entity_id: videoUuid,
                            files: [{
                                filename: fileObj.thumbnailFile.name,
                                content_type: fileObj.thumbnailFile.type,
                                size: fileObj.thumbnailFile.size,
                            }],
                        });

                        if (presignedResponse.success && presignedResponse.data.uploads.length) {
                            const uploadData = presignedResponse.data.uploads[0];
                            await S3UploadService.uploadToS3(uploadData.presigned_url, fileObj.thumbnailFile, uploadData.content_type);
                            await S3UploadService.confirmUpload({
                                entity_type: "video-thumbnail",
                                entity_id: videoUuid,
                                uploads: [{
                                    upload_id: uploadData.upload_id,
                                    s3_key: uploadData.s3_key,
                                    original_filename: uploadData.original_filename,
                                    content_type: uploadData.content_type,
                                }],
                            });
                            console.log(`Successfully uploaded custom thumbnail for video ${videoUuid}`);
                        }
                    } catch (thumbErr) {
                        console.error(`Failed to upload thumbnail for video ${videoUuid}:`, thumbErr);
                    }
                }
            }
        }

        // Mark this batch as complete in UI
        if (onProgress) {
          filesBatch.forEach((_, batchIdx) => {
            onProgress(i + batchIdx, 100, 'complete');
          });
        }
      }
      return tourResult;
    } catch (confirmError) {
      console.error(
        "Confirmation of S3 uploads failed after tour creation:",
        confirmError,
      );
      throw confirmError;
    }
  }

  return tourResult;
}

export async function UpdateFilesData(
  token: string,
  tourUuid: string,
  files: SelectedFiles[],
  links: {
    type: string;
    service_id: string;
    link: string;
    expiry_date?: string;
    uuid?: string;
  }[],
  snapshots: DroppedMarker[],
  delay: number,
  transition: string,
  selectedAudioTrack: string,
  existingFiles?: Files[],
  onProgress?: (index: number, progress: number, status: 'pending' | 'uploading' | 'confirming' | 'complete' | 'error') => void
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Step 1: Identify and upload NEW files to S3
  const newFiles = files.filter((f) => f.file instanceof File);
  const fileUuids = new Map<File, string>();

  if (newFiles.length > 0) {
    try {
      // Split new files into chunks for presigned URL requests
      for (let i = 0; i < newFiles.length; i += PRESIGNED_BATCH_SIZE) {
        const fileBatch = newFiles.slice(i, i + PRESIGNED_BATCH_SIZE);

        const filesPayload: any[] = [];
        fileBatch.forEach((f) => {
          filesPayload.push({
            filename: f.file.name,
            content_type: f.file.type,
            size: f.file.size,
          });
          // thumbnail uploaded separately
        });

        const presignedRequest = {
          entity_type: "tour" as const,
          entity_id: tourUuid,
          files: filesPayload,
        };

        const presignedResponse = await S3UploadService.getPresignedUrls(presignedRequest);
        if (!presignedResponse.success) throw new Error("Failed to get presigned URLs");

        const batchUploads = presignedResponse.data.uploads;

        const uploadTasks: { fileObj: SelectedFiles; upload: any; isThumb: boolean }[] = [];
        let uploadIdx = 0;
        fileBatch.forEach((fileObj) => {
           uploadTasks.push({ fileObj, upload: batchUploads[uploadIdx++], isThumb: false });
           // thumbnail task handled separately
        });

        // Upload all new files in this batch to S3 (concurrency limit)
        for (let j = 0; j < uploadTasks.length; j += S3_CONCURRENT_UPLOADS) {
          const s3Batch = uploadTasks.slice(j, j + S3_CONCURRENT_UPLOADS);

          await Promise.all(
            s3Batch.map(async (task) => {
              const globalIndex = files.indexOf(task.fileObj);
              const upload = task.upload;
              
              if (onProgress && globalIndex !== -1 && !task.isThumb) {
                onProgress(globalIndex, 0, 'uploading');
              }

              try {
                await S3UploadService.uploadToS3(
                  upload.presigned_url,
                  task.isThumb && task.fileObj.thumbnailFile ? task.fileObj.thumbnailFile : task.fileObj.file,
                  upload.content_type,
                  (progress) => {
                    if (onProgress && globalIndex !== -1 && !task.isThumb) {
                      onProgress(globalIndex, progress, 'uploading');
                    }
                  }
                );
                if (!task.isThumb) fileUuids.set(task.fileObj.file, upload.upload_id);

                if (onProgress && globalIndex !== -1 && !task.isThumb) {
                  onProgress(globalIndex, 100, 'confirming');
                }
              } catch (error) {
                if (onProgress && globalIndex !== -1 && !task.isThumb) {
                  onProgress(globalIndex, 0, 'error');
                }
                throw error;
              }
            })
          );
        }

                const confirmUploadsPayload: any[] = [];
        let cIdx = 0;
        fileBatch.forEach((fileObj) => {
            const mainUpload = batchUploads[cIdx++];
            
            confirmUploadsPayload.push({
              upload_id: mainUpload.upload_id,
              s3_key: mainUpload.s3_key,
              original_filename: mainUpload.original_filename,
              content_type: mainUpload.content_type,
              type: getFileTypeFromContentType(mainUpload.content_type),
              subtype: fileObj.subtype || (fileObj.isPanorama ? "panorama_360" : null),
              group: fileObj.type,
              service_id: fileObj.service_id,
              is_featured: fileObj.is_featured || false,
              is_show: fileObj.is_show !== false,
              is_admin_approved: fileObj.is_admin_approved !== false,
              is_agent_approved: fileObj.is_agent_approved || false,
              is_complimentary: fileObj.is_complimentary || false,
              image_type: fileObj.isPanorama ? "panorama" : "normal",
              sort_order: fileObj.sort_order !== undefined ? fileObj.sort_order : newFiles.indexOf(fileObj) + 1,
            });
        });

        // Confirm this batch of uploads
        const confirmResponse = await S3UploadService.confirmUpload({
          entity_type: "tour",
          entity_id: tourUuid,
          tour_id: tourUuid,
          uploads: confirmUploadsPayload,
        });

        // Loop over fileBatch to upload thumbnails for any video files that have one
        const createdFiles = confirmResponse.data?.files || [];
        for (const fileObj of fileBatch) {
            if (fileObj.thumbnailFile && fileObj.file.type.startsWith('video/')) {
                const createdFile = createdFiles.find(f => f.filename === fileObj.file.name);
                if (createdFile) {
                    const videoUuid = createdFile.uuid;
                    try {
                        const presignedResponse = await S3UploadService.getPresignedUrls({
                            entity_type: "video-thumbnail",
                            entity_id: videoUuid,
                            files: [{
                                filename: fileObj.thumbnailFile.name,
                                content_type: fileObj.thumbnailFile.type,
                                size: fileObj.thumbnailFile.size,
                            }],
                        });

                        if (presignedResponse.success && presignedResponse.data.uploads.length) {
                            const uploadData = presignedResponse.data.uploads[0];
                            await S3UploadService.uploadToS3(uploadData.presigned_url, fileObj.thumbnailFile, uploadData.content_type);
                            await S3UploadService.confirmUpload({
                                entity_type: "video-thumbnail",
                                entity_id: videoUuid,
                                uploads: [{
                                    upload_id: uploadData.upload_id,
                                    s3_key: uploadData.s3_key,
                                    original_filename: uploadData.original_filename,
                                    content_type: uploadData.content_type,
                                }],
                            });
                            console.log("Successfully uploaded custom thumbnail for video " + videoUuid);
                        }
                    } catch (thumbErr) {
                        console.error("Failed to upload thumbnail for video " + videoUuid + ":", thumbErr);
                    }
                }
            }
        }

        // Mark this batch as complete in UI
        if (onProgress) {
          fileBatch.forEach((fileObj) => {
            const globalIndex = files.indexOf(fileObj);
            if (globalIndex !== -1) {
              onProgress(globalIndex, 100, 'complete');
            }
          });
        }
      }
    } catch (error) {
      console.error("S3 upload in UpdateFilesData failed:", error);
      throw error;
    }
  }

  // Step 2: Prepare metadata update via old endpoint
  const formData = new FormData();
  let hasMetadataChanges = false;

  // Handle existing files (already uploaded, send UUID and file_path)
  existingFiles?.forEach((fileObj, index) => {
    const fileIndex = newFiles.length + index;
    hasMetadataChanges = true;
    formData.append(`files[${fileIndex}][uuid]`, fileObj.uuid);
    formData.append(`files[${fileIndex}][file_path]`, fileObj.file_path);
    formData.append(`files[${fileIndex}][name]`, fileObj.name || "");
    formData.append(`files[${fileIndex}][type]`, fileObj.type || "photo");
    if (fileObj.subtype !== undefined && fileObj.subtype !== null) {
      formData.append(`files[${fileIndex}][subtype]`, fileObj.subtype);
    } else if (fileObj.isPanorama) {
      formData.append(`files[${fileIndex}][subtype]`, "panorama_360");
    }
    formData.append(`files[${fileIndex}][group]`, fileObj.group || "");
    formData.append(
      `files[${fileIndex}][service_id]`,
      String(fileObj.service?.uuid || fileObj.service_id || ""),
    );
    formData.append(
      `files[${fileIndex}][is_featured]`,
      String(fileObj.is_featured ? 1 : 0),
    );
    formData.append(
      `files[${fileIndex}][is_admin_approved]`,
      String(fileObj.is_admin_approved === false ? 0 : 1),
    );
    formData.append(
      `files[${fileIndex}][is_agent_approved]`,
      String(fileObj.is_agent_approved === true ? 1 : 0),
    );
    formData.append(
      `files[${fileIndex}][is_complimentary]`,
      String(fileObj.is_complimentary === true ? 1 : 0),
    );
    formData.append(
      `files[${fileIndex}][is_show]`,
      String(fileObj.is_show === false ? 0 : 1),
    );
    formData.append(
      `files[${fileIndex}][image_type]`,
      fileObj.isPanorama ? "panorama" : "normal"
    );
    formData.append(
      `files[${fileIndex}][sort_order]`,
      String(fileObj.sort_order !== undefined ? fileObj.sort_order : index + 1),
    );
  });

  links.forEach((linkObj, index) => {
    hasMetadataChanges = true;
    formData.append(`links[${index}][type]`, linkObj.type);
    formData.append(
      `links[${index}][service_id]`,
      String(linkObj.service_id || ""),
    );
    formData.append(`links[${index}][link]`, linkObj.link);
    if (linkObj.expiry_date)
      formData.append(`links[${index}][expiry_date]`, linkObj.expiry_date);
    if (linkObj.uuid) formData.append(`links[${index}][uuid]`, linkObj.uuid);
  });

  snapshots.forEach((snap, index) => {
    hasMetadataChanges = true;
    formData.append(`snapshots[${index}][name]`, snap.name || "");
    formData.append(`snapshots[${index}][description]`, snap.description || "");
    formData.append(`snapshots[${index}][file_name]`, snap.floorImageUrl || "");
    formData.append(
      `snapshots[${index}][file]`,
      snap.file || snap.variant_urls?.print || snap.variant_urls?.popup || snap.variant_urls?.thumb || snap.thumbnail_url || snap.url || snap.file_path || "",
    );
    const xAxis = Number(snap.x ?? (snap as any).x_axis ?? 0);
    const yAxis = Number(snap.y ?? (snap as any).y_axis ?? 0);
    formData.append(`snapshots[${index}][x_axis]`, String(xAxis.toFixed(6)));
    formData.append(`snapshots[${index}][y_axis]`, String(yAxis.toFixed(6)));
    if (snap.uuid) {
      formData.append(`snapshots[${index}][uuid]`, snap.uuid);
    }
  });

  if (
    delay !== 3000 ||
    transition !== "none" ||
    selectedAudioTrack !== "none"
  ) {
    hasMetadataChanges = true;
  }

  if (!hasMetadataChanges) {
    // If we only uploaded files and didn't change metadata, return success with confirm result if available?
    // Actually the confirmResult isn't easily accessible here due to scope block above.
    // But returning simple success is enough for logic to proceed.
    return { success: true, message: "Only new files uploaded and confirmed." };
  }

  formData.append("slide_show[slide_delay]", String(delay));
  formData.append("slide_show[transitions]", transition);
  formData.append("slide_show[background_audio]", selectedAudioTrack || "none");
  formData.append("slide_show[auto_play]", String(0));
  formData.append("slide_show[video_overlay]", String(0));
  formData.append("_method", "PUT");

  const response = await fetch(`${API_URL}/tours/${tourUuid}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      // Keep the error object structure if possible, or stringify it so it can be parsed later
      error.message ? JSON.stringify(error) : `Update failed with status ${response.status}`,
    );
  }

  return response.json();
}

export async function UpdatePhotosData(
  token: string,
  tourUuid: string,
  files?: SelectedFiles[],
  onProgress?: (index: number, progress: number, status: 'pending' | 'uploading' | 'confirming' | 'complete' | 'error') => void
) {
  // Step 1: Upload new files to S3 in batches
  const newFiles = files?.filter(f => f.file instanceof File) || [];
  const fileUuids = new Map<File, string>();

  if (newFiles.length > 0) {
    try {
      // Split new files into chunks for presigned URL requests
      for (let i = 0; i < newFiles.length; i += PRESIGNED_BATCH_SIZE) {
        const fileBatch = newFiles.slice(i, i + PRESIGNED_BATCH_SIZE);

        const presignedRequest = {
          entity_type: "tour" as const,
          entity_id: tourUuid,
          files: fileBatch.map((f) => ({
            filename: f.file.name,
            content_type: f.file.type,
            size: f.file.size,
          })),
        };

        const presignedResponse = await S3UploadService.getPresignedUrls(presignedRequest);
        if (!presignedResponse.success) throw new Error("Failed to get presigned URLs");

        const batchUploads = presignedResponse.data.uploads;

        // Upload files in this batch to S3 (concurrency limit)
        for (let j = 0; j < fileBatch.length; j += S3_CONCURRENT_UPLOADS) {
          const s3Batch = fileBatch.slice(j, j + S3_CONCURRENT_UPLOADS);
          const s3BatchUploads = batchUploads.slice(j, j + S3_CONCURRENT_UPLOADS);

          await Promise.all(s3Batch.map(async (fileObj, s3Index) => {
            const globalIndex = files ? files.indexOf(fileObj) : -1;
            const upload = s3BatchUploads[s3Index];

            if (onProgress && globalIndex !== -1) {
              onProgress(globalIndex, 0, 'uploading');
            }

            try {
              await S3UploadService.uploadToS3(
                upload.presigned_url,
                fileObj.file,
                upload.content_type,
                (progress) => {
                  if (onProgress && globalIndex !== -1) {
                    onProgress(globalIndex, progress, 'uploading');
                  }
                }
              );
              fileUuids.set(fileObj.file, upload.upload_id);

              if (onProgress && globalIndex !== -1) {
                onProgress(globalIndex, 100, 'confirming');
              }
            } catch (error) {
              if (onProgress && globalIndex !== -1) {
                onProgress(globalIndex, 0, 'error');
              }
              throw error;
            }
          }));
        }

        // Confirm this batch of uploads
        await S3UploadService.confirmUpload({
          entity_type: "tour",
          entity_id: tourUuid,
          tour_id: tourUuid,
          uploads: fileBatch.map((fileObj, batchIdx) => {
            const upload = batchUploads[batchIdx];
            return {
              upload_id: upload.upload_id,
              s3_key: upload.s3_key,
              original_filename: upload.original_filename,
              content_type: upload.content_type,
              type: getFileTypeFromContentType(upload.content_type),
              group: fileObj.type,
              service_id: fileObj.service_id,
              is_featured: fileObj.is_featured || false,
              is_show: fileObj.is_show !== false,
              is_admin_approved: fileObj.is_admin_approved !== false,
              is_agent_approved: fileObj.is_agent_approved || false,
              sort_order: fileObj.sort_order !== undefined ? fileObj.sort_order : i + batchIdx + 1,
            };
          }),
        });

        // Mark this batch as complete in UI
        if (onProgress && files) {
          fileBatch.forEach((fileObj) => {
            const globalIndex = files.indexOf(fileObj);
            if (globalIndex !== -1) {
              onProgress(globalIndex, 100, 'complete');
            }
          });
        }
      }
      return { success: true, message: "Photos updated successfully" };
    } catch (error) {
      console.error("S3 upload in UpdatePhotosData failed:", error);
      throw error;
    }
  }

  return { success: true, message: "No new files to upload" };
}
export async function UpdateFloorPhotosData(
  token: string,
  tourUuid: string,
  files?: SelectedFiles[],
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const formData = new FormData();

  // formData.append("order_id", orderUuid);

  files?.forEach((fileObj, index) => {
    const file = fileObj.file;
    const fileType = file.type;

    let type = "photo";
    if (fileType.startsWith("video/")) type = "video";
    else if (fileType === "application/pdf") type = "pdf";
    formData.append(`files[${index}][type]`, type);
    formData.append(`files[${index}][name]`, file.name || "");
    formData.append(`files[${index}][file]`, file);
    formData.append(`files[${index}][group]`, fileObj.type || "");
    formData.append(
      `files[${index}][service_id]`,
      String(fileObj.service_id || ""),
    );
    formData.append(
      `files[${index}][is_featured]`,
      String(fileObj.is_featured ? 1 : 0),
    );
    formData.append(
      `files[${index}][is_admin_approved]`,
      String(fileObj.is_admin_approved === false ? 0 : 1),
    );
    formData.append(
      `files[${index}][is_agent_approved]`,
      String(fileObj.is_agent_approved === true ? 1 : 0),
    );
    formData.append(
      `files[${index}][is_show]`,
      String(fileObj.is_show === false ? 0 : 1),
    );
    formData.append(
      `files[${index}][sort_order]`,
      String(fileObj.sort_order !== undefined ? fileObj.sort_order : index + 1),
    );
  });

  formData.append("_method", "PUT");

  const response = await fetch(`${API_URL}/tours/${tourUuid}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `Upload failed with status ${response.status}`,
    );
  }

  return response.json();
}

// paymentService.js
export async function createPayment(
  order: Order,
  token: string,
  url: string,
  options?: {
    serviceId?: string | string[];
    paymentType?: "full" | "service";
    serviceName?: string;
    amount?: string | number;
  },
) {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    // Step 1: Create an Invoice first
    const invoicePayload: {
      order_uuid: string;
      service_uuids?: string[];
    } = {
      order_uuid: order.uuid,
    };

    if (options?.paymentType === "service" && options?.serviceId) {
      invoicePayload.service_uuids = Array.isArray(options.serviceId)
        ? options.serviceId
        : [options.serviceId];
    }

    const invoiceResponse = await fetch(`${API_URL}/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(invoicePayload),
    });

    if (!invoiceResponse.ok) {
      const errorData = await invoiceResponse.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create invoice");
    }

    const invoiceData = await invoiceResponse.json();
    const invoiceUuid = invoiceData.data.uuid;

    // Step 2: Create Payment Session using the Invoice UUID
    const body = {
      agent_uuid: order.agent.uuid,
      url,
      amount: options?.amount || order.amount,
      currency: "USD",
      order_id: order.id,
      invoice_uuid: invoiceUuid,
      description: options?.paymentType === "full"
        ? `Full payment for Order #${order.id}`
        : `Payment for ${options?.serviceName || "selected service"}`,
      service_id: options?.serviceId && !Array.isArray(options.serviceId) ? options.serviceId : null,
      payment_type: options?.paymentType || "full",
    };

    const response = await fetch(`${API_URL}/agent/pay/create-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && data.url) {
      window.open(data.url, "_blank");
    } else {
      throw new Error(data.message || "Failed to create payment session");
    }
  } catch (error) {
    console.error("Payment Error:", error);
    alert(error instanceof Error ? error.message : "Something went wrong while creating payment. Please try again.");
  }
}

export async function DownloadFile(
  token: string,
  fileUuid: string,
  size?: "small" | "large" | "mls" | "original",
) {
  let url = `${process.env.NEXT_PUBLIC_API_URL}/tours/files/${fileUuid}/download`;
  if (size && size !== "original") {
    url += `?size=${size}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `Upload failed with status ${response.status}`,
    );
  }

  return response;
}

// ─── Bulk Download (job-based) ────────────────────────────────────────────────

export interface BulkDownloadFileEntry {
  uuid: string;
  size?: "small" | "large" | "mls" | "original";
}

/**
 * Initiates an asynchronous bulk-download job on the server.
 * Returns the job UUID that can be polled via PollDownloadJob.
 *
 * POST /tours/files/bulk-download
 */
export async function BulkDownloadFiles(
  token: string,
  files: BulkDownloadFileEntry[],
): Promise<{ success: boolean; job_uuid: string; message: string }> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/tours/files/bulk-download`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ files }),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err.message || `Bulk download request failed: ${response.status}`,
    );
  }

  return response.json();
}

export type DownloadJobStatus = "pending" | "processing" | "completed" | "failed";

export interface DownloadJobResult {
  success: boolean;
  data: {
    uuid?: string;
    status: DownloadJobStatus;
    percent?: number;       // 0–100 if provided by the backend
    processed_count?: number;
    file_count?: number;
    download_url?: string;   // present when status === 'completed'
    direct_download_links?: { name?: string; download_url?: string }[];
    message?: string;
  };
}

/**
 * Polls the status of a bulk-download job.
 * Call repeatedly (e.g. every 2 s) until job_status is 'complete' or 'failed'.
 *
 * GET /media/download-job/{uuid}
 */
export async function PollDownloadJob(
  token: string,
  jobUuid: string,
): Promise<DownloadJobResult> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/media/download-job/${jobUuid}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept": "application/json"
      },
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Poll failed: ${response.status}`);
  }

  return response.json();
}

export async function PublishTour(
  token: string,
  tourUuid: string,
  isPublish: boolean,
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/tours/publish/${tourUuid}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_publish: isPublish }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `Publish failed with status ${response.status}`,
    );
  }

  return response.json();
}
export async function ServiceCompletion(
  token: string,
  serviceUUid: string,
  seviceStatus: boolean,
  OrderUuid: string,
) {
  const params = new URLSearchParams();
  params.append("order_uuid", OrderUuid);
  params.append("orderservice_uuid", serviceUUid);
  params.append("is_completed", `${seviceStatus ? 1 : 0}`);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/orders/completion-status/update`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `Upload failed with status ${response.status}`,
    );
  }

  return response;
}

// ==================== S3 UPLOAD FUNCTIONS ====================
// New S3-based upload functions using presigned URLs


/**
 * Upload photos directly to S3 using presigned URLs
 * This replaces UpdatePhotosData for better performance with large files
 */
export async function UploadPhotosToS3(
  token: string,
  tourUuid: string,
  files: SelectedFiles[],
  onProgress?: (uploadId: string, progress: number) => void,
) {
  try {
    // Split files into chunks for presigned URL requests
    for (let i = 0; i < files.length; i += PRESIGNED_BATCH_SIZE) {
      const fileBatch = files.slice(i, i + PRESIGNED_BATCH_SIZE);

      const presignedRequest = {
        entity_type: "tour" as const,
        entity_id: tourUuid,
        files: fileBatch.map((f) => ({
          filename: f.file.name,
          content_type: f.file.type,
          size: f.file.size,
        })),
      };

      const presignedResponse = await S3UploadService.getPresignedUrls(presignedRequest);
      if (!presignedResponse.success || !presignedResponse.data.uploads) {
        throw new Error("Failed to get presigned URLs");
      }

      const batchUploads = presignedResponse.data.uploads;

      // Upload files in this batch to S3 (concurrency limit)
      const uploadedBatchFiles = [];
      for (let j = 0; j < fileBatch.length; j += S3_CONCURRENT_UPLOADS) {
        const s3Batch = fileBatch.slice(j, j + S3_CONCURRENT_UPLOADS);
        const s3BatchUploads = batchUploads.slice(j, j + S3_CONCURRENT_UPLOADS);

        const batchResults = await Promise.all(
          s3Batch.map(async (fileObj, s3Index) => {
            const upload = s3BatchUploads[s3Index];
            await S3UploadService.uploadToS3(
              upload.presigned_url,
              fileObj.file,
              upload.content_type,
              (progress) => {
                if (onProgress) {
                  onProgress(upload.upload_id, progress);
                }
              },
            );

            return {
              upload_id: upload.upload_id,
              s3_key: upload.s3_key,
              original_filename: upload.original_filename,
              content_type: upload.content_type,
              group: fileObj.type,
              service_id: fileObj.service_id,
              fileObj: fileObj // Temporary for confirmation mapping
            };
          })
        );
        uploadedBatchFiles.push(...batchResults);
      }

      // Confirm this batch of uploads
      const confirmResponse = await S3UploadService.confirmUpload({
        entity_type: "tour",
        entity_id: tourUuid,
        uploads: uploadedBatchFiles.map((file, batchIdx) => ({
          upload_id: file.upload_id,
          s3_key: file.s3_key,
          original_filename: file.original_filename,
          content_type: file.content_type,
          group: file.group,
          type: getFileTypeFromContentType(file.content_type),
          service_id: file.service_id,
          is_featured: file.fileObj.is_featured || false,
          is_show: file.fileObj.is_show !== false,
          is_admin_approved: file.fileObj.is_admin_approved !== false,
          is_agent_approved: file.fileObj.is_agent_approved || false,
          sort_order: file.fileObj.sort_order !== undefined ? file.fileObj.sort_order : i + batchIdx,
        })),
      });

      if (!confirmResponse.success) {
        throw new Error("Failed to confirm batch uploads");
      }
    }

    return { success: true };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw error;
  }
}

/**
 * Upload complete tour data to S3 (photos, videos, links, snapshots)
 * This replaces UploadFilesData for better performance
 */
export async function UploadTourToS3(
  token: string,
  orderUuid: string,
  files: SelectedFiles[],
  links: {
    type: string;
    service_id: string;
    link: string;
    expiry_date?: string;
    uuid?: string;
  }[],
  snapshots: DroppedMarker[],
  delay: number,
  transition: string,
  selectedAudioTrack: string,
  onProgress?: (uploadId: string, progress: number) => void,
) {
  try {
    // Step 1: Upload files to S3 if there are any
    if (files.length > 0) {
      // Split files into chunks for presigned URL requests
      for (let i = 0; i < files.length; i += PRESIGNED_BATCH_SIZE) {
        const fileBatch = files.slice(i, i + PRESIGNED_BATCH_SIZE);

        const presignedRequest = {
          entity_type: "order" as const,
          entity_id: orderUuid,
          files: fileBatch.map((f) => ({
            filename: f.file.name,
            content_type: f.file.type,
            size: f.file.size,
          })),
        };

        const presignedResponse = await S3UploadService.getPresignedUrls(presignedRequest);
        if (!presignedResponse.success || !presignedResponse.data.uploads) {
          throw new Error("Failed to get presigned URLs");
        }

        const batchUploads = presignedResponse.data.uploads;

        // Upload files in this batch to S3 (concurrency limit)
        const uploadedBatchFiles = [];
        for (let j = 0; j < fileBatch.length; j += S3_CONCURRENT_UPLOADS) {
          const s3Batch = fileBatch.slice(j, j + S3_CONCURRENT_UPLOADS);
          const s3BatchUploads = batchUploads.slice(j, j + S3_CONCURRENT_UPLOADS);

          const batchResults = await Promise.all(
            s3Batch.map(async (fileObj, s3Index) => {
              const upload = s3BatchUploads[s3Index];
              await S3UploadService.uploadToS3(
                upload.presigned_url,
                fileObj.file,
                upload.content_type,
                (progress) => {
                  if (onProgress) {
                    onProgress(upload.upload_id, progress);
                  }
                },
              );

              return {
                upload_id: upload.upload_id,
                s3_key: upload.s3_key,
                original_filename: upload.original_filename,
                content_type: upload.content_type,
                group: fileObj.type,
                service_id: fileObj.service_id,
                fileObj: fileObj // Temporary for confirmation mapping
              };
            })
          );
          uploadedBatchFiles.push(...batchResults);
        }

        // Confirm this batch of uploads
        const confirmResponse = await S3UploadService.confirmUpload({
          entity_type: "order",
          entity_id: orderUuid,
          uploads: uploadedBatchFiles.map((file, batchIdx) => ({
            upload_id: file.upload_id,
            s3_key: file.s3_key,
            original_filename: file.original_filename,
            content_type: file.content_type,
            group: file.group,
            type: getFileTypeFromContentType(file.content_type),
            service_id: file.service_id,
            is_featured: file.fileObj.is_featured || false,
            is_show: file.fileObj.is_show !== false,
            is_admin_approved: file.fileObj.is_admin_approved !== false,
            is_agent_approved: file.fileObj.is_agent_approved || false,
            sort_order: file.fileObj.sort_order !== undefined ? file.fileObj.sort_order : i + batchIdx,
          })),
        });

        if (!confirmResponse.success) {
          throw new Error("Failed to confirm batch uploads");
        }
      }
    }

    // Step 3: Send additional metadata (links, snapshots, slideshow settings)
    // This still uses the traditional API since it's not file data
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const metadataPayload = {
      order_id: orderUuid,
      links: links.map((link) => ({
        type: link.type,
        service_id: link.service_id,
        link: link.link,
        expiry_date: link.expiry_date,
        uuid: link.uuid,
      })),
      snapshots: snapshots.map((snap) => ({
        name: snap.name,
        file_name: snap.floorImageUrl,
        description: snap.description,
        x_axis: snap.x,
        y_axis: snap.y,
      })),
      slide_show: {
        slide_delay: delay,
        transitions: transition,
        background_audio: selectedAudioTrack || "none",
        auto_play: 0,
        video_overlay: 0,
      },
    };

    const metadataResponse = await fetch(`${API_URL}/tours/metadata`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadataPayload),
    });

    if (!metadataResponse.ok) {
      const error = await metadataResponse.json().catch(() => ({}));
      throw new Error(error.message || "Failed to save tour metadata");
    }

    return await metadataResponse.json();
  } catch (error) {
    console.error("S3 tour upload error:", error);
    throw error;
  }
}

import { api } from "@/lib/api";
import {
  FeatureSheetPayload,
  FeatureSheetResponse,
  FeatureSheetState,
  FeatureSheetImage,
  FeatureSheetContent,
  ImagePosition,
  TextStyle,
  StyledTextField,
  HighlightItem,
  StyledKeyHighlights,
  StyledHighlights,
  UploadedBy,
  PrintRequestData,
} from "./types/featureSheetTypes";

const PROCESSING_PLACEHOLDER = `data:image/svg+xml;base64,${btoa(`
<svg width="800" height="600" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="600" fill="#E5E7EB"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#6B7280">Processing...</text>
</svg>
`)}`;

export class FeatureSheetService {
  private apiBaseUrl: string;
  private storageBaseUrl: string;

  constructor(apiBaseUrl: string = "/api") {
    this.apiBaseUrl = apiBaseUrl;
    // Use FILES_API_URL for storage, fallback to API_URL if not set
    this.storageBaseUrl =
      process.env.NEXT_PUBLIC_FILES_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "";
  }

  /**
   * Build full storage URL from relative path
   * Handles both relative paths (feature-sheets/xxx/xxx.jpeg) and full URLs
   */
  public buildStorageUrl(path: string | null | undefined): string | null {
    if (!path) return null;

    // Already a full URL (http/https or blob URL)
    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("blob:") ||
      path.startsWith("data:")
    ) {
      return path;
    }

    // Remove leading slash if present
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;

    // Build full URL: storageBaseUrl/path
    // The storageBaseUrl already includes /storage if needed
    const baseUrl = this.storageBaseUrl.endsWith("/")
      ? this.storageBaseUrl.slice(0, -1)
      : this.storageBaseUrl;
    return `${baseUrl}/${cleanPath}`;
  }

  /**
   * Convert a File or Blob to base64 string
   */
  private async fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert blob URL to base64
   */
  private async blobUrlToBase64(blobUrl: string): Promise<string> {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return this.fileToBase64(blob);
  }

  /**
   * Build a styled text field object
   */
  private buildStyledTextField(
    value: string,
    fontSize: string,
    fontWeight: string | number,
    color?: string,
    textAlign?: "left" | "center" | "right" | "justify",
    fontFamily: string = "Alexandria",
  ): StyledTextField {
    return {
      value,
      style: {
        fontSize,
        fontWeight,
        color,
        textAlign,
        fontFamily,
      },
    };
  }

  /**
   * Build feature sheet payload from component state
   */
  // Helper to resolve a text field that may be a plain string or a { value, style } object
  private resolveTextField(
    field: string | { value: string; style: TextStyle } | undefined,
    defaultStyle: Partial<TextStyle>,
  ): StyledTextField | undefined {
    if (!field) return undefined;
    if (typeof field === "string") {
      return { value: field, style: { fontSize: "16px", fontWeight: "400", ...defaultStyle } };
    }
    return { value: field.value, style: { ...defaultStyle, ...field.style } };
  }

  async buildPayload(params: {
    // Metadata (now at root level)
    orderUuid: string;
    templateKey: string;
    uploadedBy?: "admin" | "agent" | "vendor";
    type?: "template" | "custom";

    // Theme
    primaryColor: string;
    backgroundColor?: string;
    borderColor?: string;

    // Content - Text Fields (accept plain string OR { value, style } object)
    offeredAtPrice?: string | { value: string; style: TextStyle };
    realtorTitle?: string | { value: string; style: TextStyle };
    realtorName?: string | { value: string; style: TextStyle };
    companyName?: string | { value: string; style: TextStyle };
    propertyNotesTitle?: string | { value: string; style: TextStyle };
    propertyNotesDescription?: string | { value: string; style: TextStyle };
    expandedDetail1Title?: string | { value: string; style: TextStyle };
    expandedDetail1Description?: string | { value: string; style: TextStyle };
    expandedDetail2Title?: string | { value: string; style: TextStyle };
    expandedDetail2Description?: string | { value: string; style: TextStyle };
    keyHighlightLabel?: string | { value: string; style: TextStyle };
    keyHighlights?: string[];
    highlights?: HighlightItem[];
    contactLabel?: string | { value: string; style: TextStyle };
    contactInfo?: string | { value: string; style: TextStyle };
    ctaText?: string | { value: string; style: TextStyle };
    emailLink?: string | { value: string; style: TextStyle };
    linkedinLink?: string | { value: string; style: TextStyle };
    phoneNumber?: string | { value: string; style: TextStyle };
    expandedDetail3Title?: string | { value: string; style: TextStyle };
    expandedDetail3Description?: string | { value: string; style: TextStyle };
    expandedDetail4Title?: string | { value: string; style: TextStyle };
    expandedDetail4Description?: string | { value: string; style: TextStyle };
    otherDetails?: Record<string, unknown>;

    // Images - State objects
    images: { [key: string]: string | null };
    imageScales: { [key: string]: number };
    imagePositions: { [key: string]: ImagePosition };
    imageRotations?: { [key: string]: number };

    // Logo and realtor image files
    logoFile?: File | string | null;
    realtorImageFile?: File | string | null;
    fieldStyles?: Record<string, any>;
    fieldPositions?: Record<string, { x: number; y: number }>;
  }): Promise<FeatureSheetPayload> {
    // Use a local guaranteed-typed content object to avoid TS errors on payload.content?
    const content: FeatureSheetContent = {};
    const payload: FeatureSheetPayload = {
      order_uuid: params.orderUuid,
      type: params.type || "template",
      uploaded_by: params.uploadedBy || "admin",
      template_key: params.templateKey,
      theme: {
        primaryColor: params.primaryColor,
        backgroundColor: params.backgroundColor,
        borderColor: params.borderColor,
      },
      content,
      images: [],
      fieldStyles: params.fieldStyles,
      fieldPositions: params.fieldPositions,
    };

    // Build content section — resolveTextField uses provided style when available,
    // falling back to the hardcoded template default only when no style was passed.
    const resolved = (
      field: string | { value: string; style: TextStyle } | undefined,
      defaults: Partial<TextStyle>,
    ): StyledTextField | undefined => this.resolveTextField(field, defaults);

    if (params.offeredAtPrice) {
      content.offeredAtPrice = resolved(params.offeredAtPrice, { fontSize: "36px", fontWeight: "600", color: "#FFFFFF", textAlign: "center" });
    }
    if (params.realtorTitle) {
      content.realtorTitle = resolved(params.realtorTitle, { fontSize: "16px", fontWeight: "400", color: "#F2F2F2" });
    }
    if (params.realtorName) {
      content.realtorName = resolved(params.realtorName, { fontSize: "20px", fontWeight: "600", color: "#FFFFFF" });
    }
    if (params.companyName) {
      content.companyName = resolved(params.companyName, { fontSize: "20px", fontWeight: "600", color: "#FFFFFF" });
    }
    if (params.propertyNotesTitle) {
      content.propertyNotesTitle = resolved(params.propertyNotesTitle, { fontSize: "28px", fontWeight: "300", color: "#226292" });
    }
    if (params.propertyNotesDescription) {
      content.propertyNotesDescription = resolved(params.propertyNotesDescription, { fontSize: "10px", fontWeight: "400", color: "#2C2E35" });
    }
    if (params.expandedDetail1Title) {
      content.expandedDetail1Title = resolved(params.expandedDetail1Title, { fontSize: "12px", fontWeight: "700", color: "#00B9F2" });
    }
    if (params.expandedDetail1Description) {
      content.expandedDetail1Description = resolved(params.expandedDetail1Description, { fontSize: "10px", fontWeight: "600", color: "#FFFFFF" });
    }
    if (params.expandedDetail2Title) {
      content.expandedDetail2Title = resolved(params.expandedDetail2Title, { fontSize: "12px", fontWeight: "700", color: "#00B9F2" });
    }
    if (params.expandedDetail2Description) {
      content.expandedDetail2Description = resolved(params.expandedDetail2Description, { fontSize: "10px", fontWeight: "600", color: "#FFFFFF" });
    }
    if (params.keyHighlightLabel) {
      content.keyHighlightLabel = resolved(params.keyHighlightLabel, { fontSize: "12px", fontWeight: "700", color: "#00B9F2" });
    }

    if (params.keyHighlights && params.keyHighlights.length > 0) {
      content.keyHighlights = {
        value: params.keyHighlights,
        style: {
          fontSize: "10px",
          fontWeight: "600",
          color: "#FFFFFF",
          fontFamily: "Alexandria",
        },
      };
    }

    if (params.highlights && params.highlights.length > 0) {
      content.highlights = {
        value: params.highlights,
        style: {
          fontSize: "10px",
          fontWeight: "400",
          fontFamily: "Alexandria",
        },
      };
    }

    if (params.emailLink) {
      content.emailLink = resolved(params.emailLink, { fontSize: "20px", fontWeight: "100" });
    }
    if (params.linkedinLink) {
      content.linkedinLink = resolved(params.linkedinLink, { fontSize: "14px", fontWeight: "400" });
    }
    if (params.phoneNumber) {
      content.phoneNumber = resolved(params.phoneNumber, { fontSize: "20px", fontWeight: "600" });
    }
    if (params.contactLabel) {
      content.contactLabel = resolved(params.contactLabel, { fontSize: "16px", fontWeight: "400", color: "#F2F2F2" });
    }
    if (params.contactInfo) {
      content.contactInfo = resolved(params.contactInfo, { fontSize: "16px", fontWeight: "400", color: "#F2F2F2" });
    }
    if (params.ctaText) {
      content.ctaText = resolved(params.ctaText, { fontSize: "16px", fontWeight: "400", color: "#F2F2F2" });
    }
    if (params.expandedDetail3Title) {
      content.expandedDetail3Title = resolved(params.expandedDetail3Title, { fontSize: "12px", fontWeight: "700", color: "#00B9F2" });
    }
    if (params.expandedDetail3Description) {
      content.expandedDetail3Description = resolved(params.expandedDetail3Description, { fontSize: "10px", fontWeight: "600", color: "#FFFFFF" });
    }
    if (params.expandedDetail4Title) {
      content.expandedDetail4Title = resolved(params.expandedDetail4Title, { fontSize: "12px", fontWeight: "700", color: "#00B9F2" });
    }
    if (params.expandedDetail4Description) {
      content.expandedDetail4Description = resolved(params.expandedDetail4Description, { fontSize: "10px", fontWeight: "600", color: "#FFFFFF" });
    }
    if (params.otherDetails) {
      content.otherDetails = params.otherDetails as unknown as
        | StyledTextField
        | StyledKeyHighlights
        | StyledHighlights;
    }

    // Build images section
    // For logo (if provided) — store blob URL directly; S3 upload happens in uploadFeatureSheet
    if (params.logoFile) {
      const logoUrl =
        typeof params.logoFile === "string"
          ? params.logoFile
          : URL.createObjectURL(params.logoFile);
      const isProcessing =
        logoUrl === PROCESSING_PLACEHOLDER ||
        logoUrl.startsWith("data:image/svg+xml") ||
        logoUrl.includes("Processing...");

      if (!isProcessing) {
        payload.images = payload.images || [];
        payload.images.push({
          slot: "logo",
          type: "logo",
          source: "upload",
          file: logoUrl, // blob URL or http URL — resolved in upload step
          meta: {
            width: "193px",
            height: "128px",
            position: { x: 0, y: 0 },
            scale: 1,
          },
        });
      }
    }

    // For realtor image — same approach
    if (params.realtorImageFile) {
      const realtorUrl =
        typeof params.realtorImageFile === "string"
          ? params.realtorImageFile
          : URL.createObjectURL(params.realtorImageFile);
      const isProcessing =
        realtorUrl === PROCESSING_PLACEHOLDER ||
        realtorUrl.startsWith("data:image/svg+xml") ||
        realtorUrl.includes("Processing...");

      if (!isProcessing) {
        payload.images = payload.images || [];
        payload.images.push({
          slot: "realtorImage",
          type: "realtor",
          source: "upload",
          file: realtorUrl,
          meta: {
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            position: { x: 0, y: 0 },
            scale: 1,
          },
        });
      }
    }

    // Handle property images (image1 - image20) — store URLs as-is
    for (let i = 1; i <= 20; i++) {
      const imageKey = `image${i}`;
      const imageUrl = params.images[imageKey];

      if (imageUrl) {
        const isProcessing =
          imageUrl === PROCESSING_PLACEHOLDER ||
          imageUrl.startsWith("data:image/svg+xml") ||
          imageUrl.includes("Processing...");

        const isGallery =
          !isProcessing &&
          (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"));

        const image: FeatureSheetImage = {
          slot: imageKey,
          type: "property",
          source: isGallery ? "gallery" : "upload",
          is_processing: isProcessing || undefined,
          meta: {
            position: params.imagePositions[imageKey] || { x: 0, y: 0 },
            scale: params.imageScales[imageKey] || 1,
            rotation: params.imageRotations ? params.imageRotations[imageKey] || 0 : 0,
            objectFit: "cover",
          },
        };

        if (isProcessing) {
          // Do not set image.file for processing placeholders so uploadImagesToS3 won't try to upload it as a new S3 file!
        } else if (isGallery) {
          image.file_path = imageUrl;
        } else {
          image.file = imageUrl; // blob URL — resolved in upload step
        }

        payload.images = payload.images || [];
        payload.images.push(image);
      }
    }

    // Persist gallery image URLs in content so they survive a DB round-trip.
    const galleryImages: Record<string, string> = {};
    const galleryImagesMeta: Record<string, { scale: number; position: { x: number; y: number }; rotation: number }> = {};
    for (let i = 1; i <= 20; i++) {
      const key = `image${i}`;
      const url = params.images[key];
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        const isFeatureSheetImg = url.includes('/feature-sheets/') || url.includes('api-stage.bcfloorplans.com/storage');
        if (!isFeatureSheetImg) {
          galleryImages[key] = url;
        }
      }

      // Store meta for ALL images that exist (blob, gallery, or existing feature sheet images) to persist pan/zoom/rotation
      if (url) {
        galleryImagesMeta[key] = {
          scale: params.imageScales[key] ?? 1,
          position: params.imagePositions[key] ?? { x: 0, y: 0 },
          rotation: params.imageRotations ? params.imageRotations[key] ?? 0 : 0,
        };
      }
    }

    if (Object.keys(galleryImages).length > 0) {
      (payload.content as Record<string, unknown>).galleryImages = galleryImages;
    }
    // Always persist meta for slots containing an image
    if (Object.keys(galleryImagesMeta).length > 0) {
      (payload.content as Record<string, unknown>).galleryImagesMeta = galleryImagesMeta;
    }

    return payload;
  }

  /**
   * Upload feature sheet images to S3 and return image UUIDs.
   * Only uploads images that are local blob URLs (new uploads).
   * Gallery images (http/https) are passed separately as file_path.
   *
   * @param orderUuid - The order UUID (entity_id for presigned URL request)
   * @param images - The images array from buildPayload()
   * @param featureSheetUuid - Optional: existing feature sheet UUID (for update)
   */
  private async uploadImagesToS3(
    orderUuid: string,
    images: FeatureSheetImage[],
    featureSheetUuid?: string,
  ): Promise<{ imageUuids: string[]; galleryFilePaths: { slot: string; file_path: string; meta: FeatureSheetImage['meta'] }[], newImagesForContent: { slot: string, s3_key: string, meta?: FeatureSheetImage['meta'] }[] }> {
    // Separate local blob images from gallery images
    const localImages = images.filter(
      (img) =>
        img.file &&
        !img.is_processing &&
        !img.file.startsWith("data:image/svg+xml") &&
        !img.file.includes("Processing...") &&
        (img.file.startsWith("blob:") || img.file.startsWith("data:"))
    );
    const galleryImages = images
      .filter((img) => img.source === "gallery" && img.file_path)
      .map((img) => ({ slot: img.slot, file_path: img.file_path!, meta: img.meta }));

    console.log('[FeatureSheet] uploadImagesToS3 - total images:', images.length);
    console.log('[FeatureSheet] local blob images to upload:', localImages.length);
    console.log('[FeatureSheet] gallery images:', galleryImages.length);

    if (localImages.length === 0) {
      console.log('[FeatureSheet] No local images to upload, returning early');
      return { imageUuids: [], galleryFilePaths: galleryImages, newImagesForContent: [] };
    }

    // Convert blob URLs to File objects
    const fileObjects: File[] = await Promise.all(
      localImages.map(async (img) => {
        const response = await fetch(img.file!);
        const blob = await response.blob();
        const extension = blob.type.split("/")[1] || "jpg";
        const filename = `${img.slot}.${extension}`;
        return new File([blob], filename, { type: blob.type });
      })
    );

    console.log('[FeatureSheet] converted to File objects:', fileObjects.map(f => ({ name: f.name, size: f.size, type: f.type })));

    // Step 1: Get presigned URLs
    console.log('[FeatureSheet] Requesting presigned URLs...');
    const presignedResponse = await S3UploadService.getPresignedUrls({
      entity_type: "feature-sheet",
      entity_id: orderUuid,
      files: fileObjects.map((f) => ({
        filename: f.name,
        content_type: f.type,
        size: f.size,
      })),
    });

    if (!presignedResponse.success || !presignedResponse.data.uploads) {
      throw new Error("Failed to get presigned URLs for feature sheet images");
    }

    const uploads = presignedResponse.data.uploads;
    console.log('[FeatureSheet] Got presigned URLs:', uploads.length);

    // Step 2: Upload each file to S3
    console.log('[FeatureSheet] Uploading files to S3...');
    await Promise.all(
      fileObjects.map(async (file, index) => {
        await S3UploadService.uploadToS3(
          uploads[index].presigned_url,
          file,
          uploads[index].content_type,
        );
      })
    );
    console.log('[FeatureSheet] All files uploaded to S3');

    // Step 3: Confirm uploads — creates FeatureSheetImage records in DB
    console.log('[FeatureSheet] Confirming uploads...');
    const confirmResponse = await S3UploadService.confirmUpload({
      entity_type: "feature-sheet",
      entity_id: orderUuid,
      feature_sheet_id: featureSheetUuid,
      uploads: localImages.map((img, index) => ({
        upload_id: uploads[index].upload_id,
        s3_key: uploads[index].s3_key,
        original_filename: uploads[index].original_filename,
        content_type: uploads[index].content_type,
        slot: img.slot, // e.g. "logo", "realtorImage", "image1"
      })),
    });

    if (!confirmResponse.success) {
      throw new Error("Failed to confirm feature sheet image uploads");
    }

    const imageUuids = (confirmResponse.data?.files || [])
      .map((f: { uuid?: string }) => f.uuid)
      .filter((uuid): uuid is string => Boolean(uuid));
    console.log('[FeatureSheet] Confirmed uploads, imageUuids:', imageUuids);

    const newImagesForContent: { slot: string, s3_key: string, meta?: FeatureSheetImage['meta'] }[] = [];
    localImages.forEach((img, idx) => {
      newImagesForContent.push({
        slot: img.slot,
        s3_key: uploads[idx].s3_key,
        meta: img.meta,
      });
    });

    return { imageUuids, galleryFilePaths: galleryImages, newImagesForContent };
  }

  /**
   * Upload a new template feature sheet.
   * Handles: Create record -> S3 image uploads -> confirm -> Update record with final content
   */
  async uploadFeatureSheet(
    payload: FeatureSheetPayload,
  ): Promise<FeatureSheetResponse> {
    const images = payload.images || [];
    const orderUuid = payload.order_uuid;

    console.log("[FeatureSheet] uploadFeatureSheet called");

    // Step 1: Create the feature sheet record FIRST to get a UUID
    const createPayload: Record<string, unknown> = {
      order_uuid: orderUuid,
      type: payload.type,
      uploaded_by: payload.uploaded_by,
      template_key: payload.template_key,
    };
    if (payload.is_published !== undefined) {
      createPayload.is_published = payload.is_published;
    }

    const createResponse = await api.post(
      `${process.env.NEXT_PUBLIC_API_URL}/feature-sheets`,
      createPayload,
    );

    if (createResponse.status !== 200 && createResponse.status !== 201) {
      throw new Error("Failed to create initial feature sheet record");
    }

    const featureSheet = createResponse.data.data || createResponse.data;
    const uuid = featureSheet.uuid;

    // Step 2: Upload blob images to S3 and get their UUIDs, passing the new featureSheet UUID
    const { imageUuids, newImagesForContent } = await this.uploadImagesToS3(orderUuid, images, uuid);

    // Patch content with new local images so their metadata survives
    if (newImagesForContent && newImagesForContent.length > 0) {
      const gMeta = (payload.content as Record<string, unknown>).galleryImagesMeta as Record<string, FeatureSheetImage['meta']> || {};

      for (const img of newImagesForContent) {
        if (img.meta) {
          gMeta[img.slot] = img.meta;
        }
      }
      (payload.content as Record<string, unknown>).galleryImagesMeta = gMeta;
    }

    // Step 3: Update the feature sheet with final content, theme, and image_uuids
    const updatePayload: Record<string, unknown> = {
      order_uuid: orderUuid,
      type: payload.type,
      uploaded_by: payload.uploaded_by,
      template_key: payload.template_key,
      theme: payload.theme,
      content: payload.content,
    };
    if (payload.is_published !== undefined) {
      updatePayload.is_published = payload.is_published;
    }

    if (imageUuids.length > 0) {
      updatePayload.image_uuids = imageUuids;
    }

    const response = await api.put(
      `${process.env.NEXT_PUBLIC_API_URL}/feature-sheets/${uuid}`,
      updatePayload,
    );

    if (response.status !== 200 && response.status !== 204) {
      throw new Error("Failed to finalize feature sheet");
    }

    return response.data.data || response.data || featureSheet;
  }

  /**
   * Update an existing template feature sheet.
   * Handles: S3 image uploads for new images → confirm → PUT /feature-sheets/:uuid
   */
  async updateFeatureSheet(
    uuid: string,
    payload: FeatureSheetPayload,
  ): Promise<FeatureSheetResponse> {
    const images = payload.images || [];
    const orderUuid = payload.order_uuid;

    // Upload any new blob images to S3 and get their UUIDs
    const { imageUuids, newImagesForContent } = await this.uploadImagesToS3(orderUuid, images, uuid);

    // Patch content with new local images so their metadata survives
    if (newImagesForContent && newImagesForContent.length > 0) {
      const gMeta = (payload.content as Record<string, unknown>).galleryImagesMeta as Record<string, FeatureSheetImage['meta']> || {};

      for (const img of newImagesForContent) {
        if (img.meta) {
          gMeta[img.slot] = img.meta;
        }
      }
      (payload.content as Record<string, unknown>).galleryImagesMeta = gMeta;
    }

    // Build the clean API payload
    const apiPayload: Record<string, unknown> = {
      order_uuid: orderUuid,
      type: payload.type,
      uploaded_by: payload.uploaded_by,
      template_key: payload.template_key,
      theme: payload.theme,
      content: payload.content,
    };
    if (payload.is_published !== undefined) {
      apiPayload.is_published = payload.is_published;
    }

    // Only include image_uuids if we actually uploaded new ones
    if (imageUuids.length > 0) {
      apiPayload.image_uuids = imageUuids;
    }

    const response = await api.put(
      `${process.env.NEXT_PUBLIC_API_URL}/feature-sheets/${uuid}`,
      apiPayload,
    );

    if (response.status !== 200 && response.status !== 204) {
      throw new Error("Failed to update feature sheet");
    }

    return response.data.data || response.data;
  }

  /**
   * Upload a PDF feature sheet via S3 presigned URL workflow.
   * 1. Get presigned URL for the PDF file
   * 2. Upload PDF directly to S3
   * 3. POST /feature-sheets with type: 'pdf' and pdf_s3_key
   */
  async uploadPdfFeatureSheet(
    orderUuid: string,
    pdfFile: File,
    uploadedBy: UploadedBy = "admin",
  ): Promise<FeatureSheetResponse> {
    // Step 1: Get presigned URL
    const presignedResponse = await S3UploadService.getPresignedUrls({
      entity_type: "feature-sheet",
      entity_id: orderUuid,
      files: [{
        filename: pdfFile.name,
        content_type: "application/pdf",
        size: pdfFile.size,
      }],
    });

    if (!presignedResponse.success || !presignedResponse.data.uploads[0]) {
      throw new Error("Failed to get presigned URL for PDF");
    }

    const upload = presignedResponse.data.uploads[0];

    // Step 2: Upload PDF to S3
    await S3UploadService.uploadToS3(
      upload.presigned_url,
      pdfFile,
      upload.content_type,
    );

    // Step 3: Create feature sheet record using the S3 key
    const response = await api.post(
      `${process.env.NEXT_PUBLIC_API_URL}/feature-sheets`,
      {
        order_uuid: orderUuid,
        type: "pdf",
        uploaded_by: uploadedBy,
        pdf_s3_key: upload.s3_key,
      },
    );

    if (response.status !== 200 && response.status !== 201) {
      throw new Error("Failed to create PDF feature sheet record");
    }

    return response.data.data || response.data;
  }

  async deleteFeatureSheet(uuid: string): Promise<void> {
    const response = await api.delete(
      `${process.env.NEXT_PUBLIC_API_URL}/feature-sheets/${uuid}`,
    );

    if (response.status !== 200 && response.status !== 204) {
      throw new Error("Failed to delete feature sheet");
    }
  }

  async getFeatureSheet(uuid: string): Promise<FeatureSheetResponse> {
    const response = await api.get(
      `${process.env.NEXT_PUBLIC_API_URL}/feature-sheets/${uuid}`,
    );

    if (response.status !== 200) {
      throw new Error("Failed to fetch feature sheet");
    }

    return response.data;
  }

  async getFeatureSheetsByOrder(
    orderUuid: string,
  ): Promise<FeatureSheetResponse[]> {
    try {
      const response = await api.get(
        `${process.env.NEXT_PUBLIC_API_URL}/feature-sheets/order/${orderUuid}`,
      );

      if (response.status === 200) {
        return response.data.data || response.data;
      }
    } catch (err) {
      console.warn("api.get failed for feature sheets by order, attempting fetch fallback:", err);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/feature-sheets/order/${orderUuid}`,
        );
        if (res.ok) {
          const json = await res.json();
          return json.data || json;
        }
      } catch (fetchErr) {
        console.error("Failed to fetch feature sheets by order fallback:", fetchErr);
      }
    }
    return [];
  }

  /**
   * Fetch all feature sheets for the currently authenticated agent.
   * Used by the "Copy Style" popup to list all previously created sheets.
   * Calls GET /feature-sheets/agent/all
   */
  async getFeatureSheetsByAgent(): Promise<FeatureSheetResponse[]> {
    const response = await api.get(
      `${process.env.NEXT_PUBLIC_API_URL}/feature-sheets/agent/all`,
    );

    if (response.status !== 200) {
      throw new Error("Failed to fetch agent feature sheets");
    }

    return response.data.data || response.data;
  }

  async requestPrint(uuid: string, data: PrintRequestData): Promise<void> {
    const response = await api.post(
      `${process.env.NEXT_PUBLIC_API_URL}/feature-sheets/${uuid}/print-request`,
      data,
    );

    if (response.status !== 200 && response.status !== 201) {
      throw new Error("Failed to send print request");
    }
  }

  /**
   * Extract only the *style* properties from a source feature sheet's content.
   * Used by the "Copy Style" feature to apply styling without overwriting values.
   *
   * Returns:
   *   contentStyles — map of field key → TextStyle
   *   imageStyles   — map of slot key → { scale, position }
   */
  extractStylesFromContent(source: FeatureSheetResponse): {
    contentStyles: Record<string, TextStyle>;
    imageStyles: Record<string, { scale: number; position: ImagePosition }>;
  } {
    const contentStyles: Record<string, TextStyle> = {};

    // 1. Extract from top-level content
    for (const [key, field] of Object.entries(source.content)) {
      if (field && typeof field === "object" && "style" in field) {
        contentStyles[key] = (field as { style: TextStyle }).style;
      }
    }

    // 2. Extract from otherDetails (for template-specific fields)
    if (source.content.otherDetails && typeof source.content.otherDetails === "object") {
      for (const [key, field] of Object.entries(source.content.otherDetails)) {
        if (field && typeof field === "object" && "style" in field) {
          // Use a prefixed key to identify these are from otherDetails
          contentStyles[`otherDetails.${key}`] = (field as { style: TextStyle }).style;
        }
      }
    }

    const imageStyles: Record<
      string,
      { scale: number; position: ImagePosition }
    > = {};

    // 3. Extract from image metadata (pan/zoom)
    for (const img of source.images) {
      if (img.slot && img.meta) {
        imageStyles[img.slot] = {
          scale: img.meta.scale ?? 1,
          position: img.meta.position ?? { x: 0, y: 0 },
        };
      }
    }

    // 4. Extract from galleryImagesMeta (redundancy for gallery images)
    const gMeta = (source.content as any).galleryImagesMeta;
    if (gMeta && typeof gMeta === 'object') {
      for (const [slot, meta] of Object.entries(gMeta)) {
        imageStyles[slot] = {
          scale: (meta as any).scale ?? imageStyles[slot]?.scale ?? 1,
          position: (meta as any).position ?? imageStyles[slot]?.position ?? { x: 0, y: 0 },
        };
      }
    }

    return { contentStyles, imageStyles };
  }

  /**
   * Parse payload and return state objects for component
   */
  parsePayloadToState(payload: FeatureSheetResponse): FeatureSheetState {
    // Separate property images for indexing
    const propertyImages = payload.images.filter(
      (img) => img.slot === "property" || img.slot?.startsWith("image"),
    );

    // Helper to safely extract string from either a plain string or a StyledTextField object
    const getString = (val: any): string => {
      if (!val) return "";
      if (typeof val === "string") return val;
      if (typeof val === "object" && "value" in val)
        return String(val.value || "");
      return "";
    };

    return {
      // Metadata
      templateKey: payload.template_key,
      orderUuid: payload.order_id,
      uploadedBy: payload.uploaded_by,
      type: payload.type,

      // Theme
      primaryColor: "#4290E9",
      backgroundColor: "#FFFFFF",
      borderColor: "#BBBBBB",

      // Content
      offeredAtPrice: getString(payload.content.offeredAtPrice),
      realtorTitle: getString(payload.content.realtorTitle),
      realtorName: getString(payload.content.realtorName),
      companyName: getString(payload.content.companyName),
      propertyNotesTitle: getString(payload.content.propertyNotesTitle),
      propertyNotesDescription: getString(payload.content.propertyNotesDescription),
      expandedDetail1Title: getString(payload.content.expandedDetail1Title) || "Site Influences",
      expandedDetail1Description: getString(payload.content.expandedDetail1Description) || getString(payload.content.expandedDetail1),
      expandedDetail2Title: getString(payload.content.expandedDetail2Title) || "Gross Taxes",
      expandedDetail2Description: getString(payload.content.expandedDetail2Description) || getString(payload.content.expandedDetail2),
      keyHighlightLabel: getString(payload.content.keyHighlightLabel) || "Features Included",
      keyHighlights: (payload.content.keyHighlights as any)?.value || [],
      highlights: (payload.content.highlights as any)?.value || [],
      emailLink: getString(payload.content.emailLink),
      linkedinLink: getString(payload.content.linkedinLink),
      phoneNumber: getString(payload.content.phoneNumber),
      contactLabel: getString(payload.content.contactLabel),
      contactInfo: getString(payload.content.contactInfo),
      ctaText: getString(payload.content.ctaText),
      amount:
        getString(
          (payload.content.otherDetails as unknown as Record<string, unknown>)
            ?.amount
        ),
      mlsNumber:
        getString(
          (payload.content.otherDetails as unknown as Record<string, unknown>)
            ?.mlsNumber
        ),
      email: getString(payload.content.emailLink),
      phone: getString(payload.content.phoneNumber),
      linkedin: getString(payload.content.linkedinLink),
      expandedDetail3Title: getString(payload.content.expandedDetail3Title),
      expandedDetail3Description: getString(
        payload.content.expandedDetail3Description
      ),
      expandedDetail4Title: getString(payload.content.expandedDetail4Title),
      expandedDetail4Description: getString(
        payload.content.expandedDetail4Description
      ),
      otherDetails: Object.fromEntries(
        Object.entries((payload.content.otherDetails as Record<string, any>) || {}).map(([k, v]) => [
          k,
          getString(v),
        ])
      ),

      // Mapped for BcfpStandard2 state
      title: getString(payload.content.offeredAtPrice),
      subtitle: getString(payload.content.realtorTitle),
      fullName: getString(payload.content.realtorName),
      propertyName: getString(payload.content.propertyNotesTitle),
      description: getString(payload.content.propertyNotesDescription),
      siteInfluences:
        getString(payload.content.expandedDetail1Description) ||
        getString(payload.content.expandedDetail1),
      grossTaxes:
        getString(payload.content.expandedDetail2Description) ||
        getString(payload.content.expandedDetail2),
      featuresIncluded: ((payload.content.keyHighlights as any)?.value?.join("\n") ||
        "") as string,

      // Images — start with DB-backed feature sheet images (blob uploads)
      images: (() => {
        const acc: { [key: string]: string | null } = {};

        // 1. Populate from FeatureSheetImage DB records (blob / new uploads)
        for (const img of payload.images) {
          let slot = img.slot;
          if (slot === 'property') {
            const propIndex = propertyImages.findIndex(
              (p) => p.id === img.id || p.uuid === img.uuid,
            );
            if (propIndex !== -1) slot = `image${propIndex + 1}`;
          }
          if (slot) {
            const rawPath =
              img.variant_urls?.print || img.variant_urls?.landing || img.variant_urls?.thumb || img.thumbnail_url || img.url || img.storage_path || img.file || img.file_path || null;

            if (rawPath) {
              acc[slot] = this.buildStorageUrl(rawPath);
            } else if (img.is_processing || (img.source === 'upload' && !rawPath)) {
              // If we have an image record but no URL yet, it's processing
              acc[slot] = PROCESSING_PLACEHOLDER;
            }
          }
        }

        //    the user selected from the gallery (no re-encoding needed).
        //    Skip any corrupted feature-sheets URLs that were accidentally bound earlier.
        const galleryImages = (payload.content as Record<string, unknown>)
          ?.galleryImages as Record<string, string> | undefined;
        if (galleryImages) {
          for (const [slot, url] of Object.entries(galleryImages)) {
            const isFeatureSheetImg = url.includes('/feature-sheets/') || url.includes('api-stage.bcfloorplans.com/storage');
            if (!isFeatureSheetImg) {
              acc[slot] = url;
            }
          }
        }

        return acc;
      })(),

      imageUuids: (() => {
        const acc: { [key: string]: string | null } = {};
        for (const img of payload.images) {
          let slot = img.slot;
          if (slot === 'property') {
            const propIndex = propertyImages.findIndex(
              (p) => p.id === img.id || p.uuid === img.uuid,
            );
            if (propIndex !== -1) slot = `image${propIndex + 1}`;
          }
          if (slot && img.uuid) acc[slot] = img.uuid;
        }
        return acc;
      })(),

      hiddenImages: (() => {
        const acc: { [key: string]: boolean } = {};
        for (const img of payload.images) {
          let slot = img.slot;
          if (slot === 'property') {
            const propIndex = propertyImages.findIndex(
              (p) => p.id === img.id || p.uuid === img.uuid,
            );
            if (propIndex !== -1) slot = `image${propIndex + 1}`;
          }
          if (slot) acc[slot] = !!img.is_hidden;
        }
        return acc;
      })(),

      imageScales: (() => {
        const acc: { [key: string]: number } = {};
        // From DB image records
        for (const img of payload.images) {
          let slot = img.slot;
          if (slot === 'property') {
            const propIndex = propertyImages.findIndex(
              (p) => p.id === img.id || p.uuid === img.uuid,
            );
            if (propIndex !== -1) slot = `image${propIndex + 1}`;
          }
          if (slot) acc[slot] = img.meta?.scale || 1;
        }
        // Overlay from gallery meta stored in content
        const galleryMeta = (payload.content as Record<string, unknown>)
          ?.galleryImagesMeta as Record<string, { scale: number }> | undefined;
        if (galleryMeta) {
          for (const [slot, meta] of Object.entries(galleryMeta)) {
            acc[slot] = meta.scale ?? 1;
          }
        }
        return acc;
      })(),

      imagePositions: (() => {
        const acc: { [key: string]: ImagePosition } = {};
        // From DB image records
        for (const img of payload.images) {
          let slot = img.slot;
          if (slot === 'property') {
            const propIndex = propertyImages.findIndex(
              (p) => p.id === img.id || p.uuid === img.uuid,
            );
            if (propIndex !== -1) slot = `image${propIndex + 1}`;
          }
          if (slot) acc[slot] = img.meta?.position || { x: 0, y: 0 };
        }
        // Overlay from gallery meta stored in content
        const galleryMeta = (payload.content as Record<string, unknown>)
          ?.galleryImagesMeta as Record<string, { position: ImagePosition }> | undefined;
        if (galleryMeta) {
          for (const [slot, meta] of Object.entries(galleryMeta)) {
            acc[slot] = meta.position ?? { x: 0, y: 0 };
          }
        }
        return acc;
      })(),

      imageRotations: (() => {
        const acc: { [key: string]: number } = {};
        // From DB image records
        for (const img of payload.images) {
          let slot = img.slot;
          if (slot === 'property') {
            const propIndex = propertyImages.findIndex(
              (p) => p.id === img.id || p.uuid === img.uuid,
            );
            if (propIndex !== -1) slot = `image${propIndex + 1}`;
          }
          if (slot) acc[slot] = img.meta?.rotation || 0;
        }
        // Overlay from gallery meta stored in content
        const galleryMeta = (payload.content as Record<string, unknown>)
          ?.galleryImagesMeta as Record<string, { rotation: number }> | undefined;
        if (galleryMeta) {
          for (const [slot, meta] of Object.entries(galleryMeta)) {
            acc[slot] = meta.rotation ?? 0;
          }
        }
        return acc;
      })(),
      fieldStyles: payload.fieldStyles,
      fieldPositions: payload.fieldPositions,
    };
  }
}

export const featureSheetService = new FeatureSheetService();
export async function GetTourSettings(token?: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${API_URL}/settings/tour_settings`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch tour settings");
  }

  return response.json();
}
