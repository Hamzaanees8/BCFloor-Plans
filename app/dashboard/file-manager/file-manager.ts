export interface Area {
  type: string;
  footage: number;
  custom_title?: string;
  uuid?: string;
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

/**
 * Helper function to determine file type from content_type (MIME type)
 */
function getFileTypeFromContentType(contentType: string): string {
  if (contentType.startsWith("video/")) return "video";
  if (contentType === "application/pdf") return "pdf";
  return "photo";
}


export async function GetFilesData(token: string, orderUuid: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  if (orderUuid === "") {
    toast.error("Order UUID is required to fetch files.");
    return;
  }
  const response = await fetch(`${API_URL}/tours/order/${orderUuid}`, {
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
  let uploads: {
    upload_id: string;
    s3_key: string;
    original_filename: string;
    content_type: string;
    presigned_url: string;
  }[] = [];

  const fileUuids = new Map<File, string>();

  // Step 1: Upload files to S3 in batches of 3
  if (files.length > 0) {
    try {
      const presignedRequest = {
        entity_type: "order" as const,
        entity_id: orderUuid,
        files: files.map((f) => ({
          filename: f.file.name,
          content_type: f.file.type,
          size: f.file.size,
        })),
      };

      const presignedResponse =
        await S3UploadService.getPresignedUrls(presignedRequest);
      if (!presignedResponse.success)
        throw new Error("Failed to get presigned URLs");

      const S3Uploads = presignedResponse.data.uploads;
      uploads = S3Uploads;

      // Upload files in batches of 3
      const BATCH_SIZE = 3;
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (fileObj, batchIndex) => {
          const index = i + batchIndex;
          const upload = uploads[index];

          // Update status to uploading
          if (onProgress) {
            onProgress(index, 0, 'uploading');
          }

          try {
            await S3UploadService.uploadToS3(
              upload.presigned_url,
              fileObj.file,
              upload.content_type,
              (progress) => {
                if (onProgress) {
                  onProgress(index, progress, 'uploading');
                }
              }
            );
            fileUuids.set(fileObj.file, upload.upload_id);

            // Mark as complete
            if (onProgress) {
              onProgress(index, 100, 'complete');
            }
          } catch (error) {
            if (onProgress) {
              onProgress(index, 0, 'error');
            }
            throw error;
          }
        }));
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
      snap.thumbnail_url || snap.file_path || snap.file || "",
    );
    formData.append(`snapshots[${index}][x_axis]`, String(snap.x));
    formData.append(`snapshots[${index}][y_axis]`, String(snap.y));
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

  // Step 3: NOW confirm uploads with the new tourUuid
  if (files.length > 0 && uploads.length > 0) {
    try {
      const confirmResult = await S3UploadService.confirmUpload({
        entity_type: "tour",
        entity_id: tourUuid,
        tour_id: tourUuid,
        uploads: files.map((fileObj, index) => {
          const upload = uploads[index];
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
            sort_order: fileObj.sort_order !== undefined ? fileObj.sort_order : index + 1,
          };
        }),
      });
      return confirmResult;
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
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Step 1: Identify and upload NEW files to S3
  const newFiles = files.filter((f) => f.file instanceof File);
  const fileUuids = new Map<File, string>();

  if (newFiles.length > 0) {
    try {
      const presignedRequest = {
        entity_type: "tour" as const,
        entity_id: tourUuid,
        files: newFiles.map((f) => ({
          filename: f.file.name,
          content_type: f.file.type,
          size: f.file.size,
        })),
      };

      const presignedResponse =
        await S3UploadService.getPresignedUrls(presignedRequest);
      if (!presignedResponse.success)
        throw new Error("Failed to get presigned URLs");

      const uploads = presignedResponse.data.uploads;

      // Upload all new files to S3 concurrently
      await Promise.all(
        newFiles.map(async (fileObj, index) => {
          const upload = uploads[index];
          await S3UploadService.uploadToS3(
            upload.presigned_url,
            fileObj.file,
            upload.content_type,
          );
          fileUuids.set(fileObj.file, upload.upload_id);
        }),
      );

      // Confirm uploads to create DB records
      // Confirm uploads to create DB records
      await S3UploadService.confirmUpload({
        entity_type: "tour",
        entity_id: tourUuid,
        tour_id: tourUuid,
        uploads: newFiles.map((fileObj) => {
          const uploadInfo = uploads.find(
            (u) => u.upload_id === fileUuids.get(fileObj.file),
          );

          return {
            upload_id: uploadInfo?.upload_id || "",
            s3_key: uploadInfo?.s3_key || "",
            original_filename: uploadInfo?.original_filename || "",
            content_type: uploadInfo?.content_type || "",
            type: getFileTypeFromContentType(uploadInfo?.content_type || ""),
            group: fileObj.type,
            service_id: fileObj.service_id,
            is_featured: fileObj.is_featured || false,
            is_show: fileObj.is_show !== false,
            is_admin_approved: fileObj.is_admin_approved !== false,
            is_agent_approved: fileObj.is_agent_approved || false,
            sort_order: fileObj.sort_order !== undefined ? fileObj.sort_order : newFiles.length + files.indexOf(fileObj) + 1,
          };
        }),
      });
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
      `files[${fileIndex}][is_show]`,
      String(fileObj.is_show === false ? 0 : 1),
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
      snap.thumbnail_url || snap.file_path || snap.file || "",
    );
    formData.append(`snapshots[${index}][x_axis]`, String(snap.x.toFixed(6)));
    formData.append(`snapshots[${index}][y_axis]`, String(snap.y.toFixed(6)));
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
      const presignedRequest = {
        entity_type: "tour" as const,
        entity_id: tourUuid,
        files: newFiles.map((f) => ({
          filename: f.file.name,
          content_type: f.file.type,
          size: f.file.size,
        })),
      };

      const presignedResponse =
        await S3UploadService.getPresignedUrls(presignedRequest);
      const uploads = presignedResponse.data.uploads;

      // Upload files in batches of 3
      const BATCH_SIZE = 3;
      for (let i = 0; i < newFiles.length; i += BATCH_SIZE) {
        const batch = newFiles.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (fileObj, batchIndex) => {
          const index = i + batchIndex;
          const upload = uploads[index];

          // Update status to uploading
          if (onProgress) {
            onProgress(index, 0, 'uploading');
          }

          try {
            await S3UploadService.uploadToS3(
              upload.presigned_url,
              fileObj.file,
              upload.content_type,
              (progress) => {
                if (onProgress) {
                  onProgress(index, progress, 'uploading');
                }
              }
            );
            fileUuids.set(fileObj.file, upload.upload_id);

            // Mark as complete
            if (onProgress) {
              onProgress(index, 100, 'complete');
            }
          } catch (error) {
            if (onProgress) {
              onProgress(index, 0, 'error');
            }
            throw error;
          }
        }));
      }

      const confirmResponse = await S3UploadService.confirmUpload({
        entity_type: "tour",
        entity_id: tourUuid,
        tour_id: tourUuid,
        uploads: newFiles.map((fileObj, index) => {
          const upload = uploads[index];
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
            sort_order: fileObj.sort_order !== undefined ? fileObj.sort_order : index + 1,
          };
        }),
      });

      return confirmResponse;
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
    serviceId?: string;
    paymentType?: "full" | "service";
    serviceName?: string;
    amount?: string | number;
  },
) {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    // Determine description based on payment type
    let description = "Payment for voice service"; // default
    if (options?.paymentType === "service" && options?.serviceName) {
      description = `Payment for ${options.serviceName} service`;
    } else if (options?.paymentType === "full") {
      description = `Full payment for Order #${order.id}`;
    }

    const body = {
      agent_uuid: order.agent.uuid,
      url,
      amount: options?.amount || order.amount,
      currency: "USD",
      order_id: order.id,
      description: description,
      service_id: options?.serviceId || null, // Send service_id only for service payments
      payment_type: options?.paymentType || "full", // Add payment type
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

    // ensure proper status
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && data.url) {
      // redirect to Stripe checkout (no CORS issue)
      window.location.href = data.url;
    } else {
      throw new Error(data.message || "Failed to create payment session");
    }
  } catch (error) {
    console.error("Payment Error:", error);
    alert("Something went wrong while creating payment. Please try again.");
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

import { S3UploadService } from "@/lib/upload/s3-service";

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
    // Step 1: Request presigned URLs
    const presignedRequest = {
      entity_type: "tour" as const,
      entity_id: tourUuid,
      files: files.map((f) => ({
        filename: f.file.name,
        content_type: f.file.type,
        size: f.file.size,
      })),
    };

    const presignedResponse =
      await S3UploadService.getPresignedUrls(presignedRequest);

    if (!presignedResponse.success || !presignedResponse.data.uploads) {
      throw new Error("Failed to get presigned URLs");
    }

    const uploads = presignedResponse.data.uploads;

    // Step 2: Upload files to S3 concurrently
    const uploadPromises = files.map(async (fileObj, index) => {
      const upload = uploads[index];
      if (!upload) {
        throw new Error(`No presigned URL for file: ${fileObj.file.name}`);
      }

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
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    // Step 3: Confirm uploads with backend
    const confirmResponse = await S3UploadService.confirmUpload({
      entity_type: "tour",
      entity_id: tourUuid,
      uploads: uploadedFiles.map((file, index) => ({
        ...file,
        group: files[index].type,
        type: getFileTypeFromContentType(file.content_type),
        service_id: files[index].service_id,
        is_featured: files[index].is_featured || false,
        is_show: files[index].is_show !== false,
        is_admin_approved: files[index].is_admin_approved !== false,
        is_agent_approved: files[index].is_agent_approved || false,
        sort_order: files[index].sort_order !== undefined ? files[index].sort_order : index,
      })),
    });

    if (!confirmResponse.success) {
      throw new Error("Failed to confirm uploads");
    }

    return confirmResponse;
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
    let uploadedFiles: Array<{
      upload_id: string;
      s3_key: string;
      original_filename: string;
      content_type: string;
      group?: string;
      service_id?: string;
    }> = [];

    if (files.length > 0) {
      const presignedRequest = {
        entity_type: "order" as const,
        entity_id: orderUuid,
        files: files.map((f) => ({
          filename: f.file.name,
          content_type: f.file.type,
          size: f.file.size,
        })),
      };

      const presignedResponse =
        await S3UploadService.getPresignedUrls(presignedRequest);

      if (!presignedResponse.success || !presignedResponse.data.uploads) {
        throw new Error("Failed to get presigned URLs");
      }

      const uploads = presignedResponse.data.uploads;

      // Upload files to S3 concurrently
      const uploadPromises = files.map(async (fileObj, index) => {
        const upload = uploads[index];
        if (!upload) {
          throw new Error(`No presigned URL for file: ${fileObj.file.name}`);
        }

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
        };
      });

      uploadedFiles = await Promise.all(uploadPromises);
    }

    // Step 2: Confirm uploads with backend and include metadata
    const confirmResponse = await S3UploadService.confirmUpload({
      entity_type: "order",
      entity_id: orderUuid,
      uploads: uploadedFiles.map((file, index) => ({
        ...file,
        group: files[index].type,
        type: getFileTypeFromContentType(file.content_type),
        service_id: files[index].service_id,
        is_featured: files[index].is_featured || false,
        is_show: files[index].is_show !== false,
        is_admin_approved: files[index].is_admin_approved !== false,
        is_agent_approved: files[index].is_agent_approved || false,
        sort_order: files[index].sort_order !== undefined ? files[index].sort_order : index,
      })),
    });

    if (!confirmResponse.success) {
      throw new Error("Failed to confirm uploads");
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

    return confirmResponse;
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
  StyledTextField,
  HighlightItem,
  StyledKeyHighlights,
  StyledHighlights,
  UploadedBy,
} from "./types/featureSheetTypes";

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
    textAlign?: "left" | "center" | "right",
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

    // Content - Text Fields
    offeredAtPrice?: string;
    realtorTitle?: string;
    realtorName?: string;
    companyName?: string;
    propertyNotesTitle?: string;
    propertyNotesDescription?: string;
    expandedDetail1Title?: string;
    expandedDetail1Description?: string;
    expandedDetail2Title?: string;
    expandedDetail2Description?: string;
    keyHighlightLabel?: string;
    keyHighlights?: string[];
    highlights?: HighlightItem[];
    contactLabel?: string;
    contactInfo?: string;
    ctaText?: string;
    emailLink?: string;
    linkedinLink?: string;
    phoneNumber?: string;
    expandedDetail3Title?: string;
    expandedDetail3Description?: string;
    expandedDetail4Title?: string;
    expandedDetail4Description?: string;
    otherDetails?: Record<string, unknown>;

    // Images - State objects
    images: { [key: string]: string | null };
    imageScales: { [key: string]: number };
    imagePositions: { [key: string]: ImagePosition };

    // Logo and realtor image files
    logoFile?: File | string | null;
    realtorImageFile?: File | string | null;
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
    };

    // Build content section
    if (params.offeredAtPrice) {
      content.offeredAtPrice = this.buildStyledTextField(
        params.offeredAtPrice,
        "80px",
        "300",
        "#F2F2F2",
        "right",
      );
    }

    if (params.realtorTitle) {
      content.realtorTitle = this.buildStyledTextField(
        params.realtorTitle,
        "16px",
        "400",
        "#F2F2F2",
      );
    }

    if (params.realtorName) {
      content.realtorName = this.buildStyledTextField(
        params.realtorName,
        "16px",
        "400",
        "#F2F2F2",
      );
    }

    if (params.companyName) {
      content.companyName = this.buildStyledTextField(
        params.companyName,
        "16px",
        "400",
        "#F2F2F2",
      );
    }

    if (params.propertyNotesTitle) {
      content.propertyNotesTitle = this.buildStyledTextField(
        params.propertyNotesTitle,
        "36px",
        "600",
        "#4290E9",
      );
    }

    if (params.propertyNotesDescription) {
      content.propertyNotesDescription = this.buildStyledTextField(
        params.propertyNotesDescription,
        "20px",
        "400",
        "#4290E9",
      );
    }

    if (params.expandedDetail1Title) {
      content.expandedDetail1Title = this.buildStyledTextField(
        params.expandedDetail1Title,
        "36px",
        "600",
        "#4290E9",
      );
    }

    if (params.expandedDetail1Description) {
      content.expandedDetail1Description = this.buildStyledTextField(
        params.expandedDetail1Description,
        "20px",
        "400",
        "#4290E9",
      );
    }

    if (params.expandedDetail2Title) {
      content.expandedDetail2Title = this.buildStyledTextField(
        params.expandedDetail2Title,
        "36px",
        "600",
        "#4290E9",
      );
    }

    if (params.expandedDetail2Description) {
      content.expandedDetail2Description = this.buildStyledTextField(
        params.expandedDetail2Description,
        "20px",
        "400",
        "#4290E9",
      );
    }

    if (params.keyHighlightLabel) {
      content.keyHighlightLabel = this.buildStyledTextField(
        params.keyHighlightLabel,
        "36px",
        "600",
        "#4290E9",
      );
    }

    if (params.keyHighlights && params.keyHighlights.length > 0) {
      content.keyHighlights = {
        value: params.keyHighlights,
        style: {
          fontSize: "20px",
          fontWeight: "600",
          color: "#303030",
          fontFamily: "Alexandria",
        },
      };
    }

    if (params.highlights && params.highlights.length > 0) {
      content.highlights = {
        value: params.highlights,
        style: {
          fontSize: "16px",
          fontWeight: "400",
          fontFamily: "Alexandria",
        },
      };
    }

    if (params.emailLink) {
      content.emailLink = this.buildStyledTextField(
        params.emailLink,
        "14px",
        "400",
      );
    }

    if (params.linkedinLink) {
      content.linkedinLink = this.buildStyledTextField(
        params.linkedinLink,
        "14px",
        "400",
      );
    }

    if (params.phoneNumber) {
      content.phoneNumber = this.buildStyledTextField(
        params.phoneNumber,
        "14px",
        "400",
      );
    }

    if (params.contactLabel) {
      content.contactLabel = this.buildStyledTextField(
        params.contactLabel,
        "16px",
        "400",
        "#F2F2F2",
      );
    }
    if (params.contactInfo) {
      content.contactInfo = this.buildStyledTextField(
        params.contactInfo,
        "16px",
        "400",
        "#F2F2F2",
      );
    }
    if (params.ctaText) {
      content.ctaText = this.buildStyledTextField(
        params.ctaText,
        "16px",
        "400",
        "#F2F2F2",
      );
    }
    if (params.expandedDetail3Title) {
      content.expandedDetail3Title = this.buildStyledTextField(
        params.expandedDetail3Title,
        "36px",
        "600",
        "#4290E9",
      );
    }
    if (params.expandedDetail3Description) {
      content.expandedDetail3Description = this.buildStyledTextField(
        params.expandedDetail3Description,
        "20px",
        "400",
        "#4290E9",
      );
    }
    if (params.expandedDetail4Title) {
      content.expandedDetail4Title = this.buildStyledTextField(
        params.expandedDetail4Title,
        "36px",
        "600",
        "#4290E9",
      );
    }
    if (params.expandedDetail4Description) {
      content.expandedDetail4Description = this.buildStyledTextField(
        params.expandedDetail4Description,
        "20px",
        "400",
        "#4290E9",
      );
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

    // For realtor image — same approach
    if (params.realtorImageFile) {
      const realtorUrl =
        typeof params.realtorImageFile === "string"
          ? params.realtorImageFile
          : URL.createObjectURL(params.realtorImageFile);

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

    // Handle property images (image1 - image20) — store URLs as-is
    for (let i = 1; i <= 20; i++) {
      const imageKey = `image${i}`;
      const imageUrl = params.images[imageKey];

      if (imageUrl) {
        const isGallery =
          imageUrl.startsWith("http://") || imageUrl.startsWith("https://");

        const image: FeatureSheetImage = {
          slot: imageKey,
          type: "property",
          source: isGallery ? "gallery" : "upload",
          meta: {
            position: params.imagePositions[imageKey] || { x: 0, y: 0 },
            scale: params.imageScales[imageKey] || 1,
            objectFit: "cover",
          },
        };

        if (isGallery) {
          image.file_path = imageUrl;
        } else {
          image.file = imageUrl; // blob URL — resolved in upload step
        }

        payload.images = payload.images || [];
        payload.images.push(image);
      }
    }

    // Persist gallery image URLs in content so they survive a DB round-trip.
    // Blob/uploaded images are handled via S3 + FeatureSheetImage records.
    const galleryImages: Record<string, string> = {};
    const galleryImagesMeta: Record<string, { scale: number; position: { x: number; y: number } }> = {};
    for (let i = 1; i <= 20; i++) {
      const key = `image${i}`;
      const url = params.images[key];
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        galleryImages[key] = url;
        galleryImagesMeta[key] = {
          scale: params.imageScales[key] ?? 1,
          position: params.imagePositions[key] ?? { x: 0, y: 0 },
        };
      }
    }
    if (Object.keys(galleryImages).length > 0) {
      (payload.content as Record<string, unknown>).galleryImages = galleryImages;
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
  ): Promise<{ imageUuids: string[]; galleryFilePaths: { slot: string; file_path: string; meta: FeatureSheetImage['meta'] }[] }> {
    // Separate local blob images from gallery images
    const localImages = images.filter(
      (img) =>
        img.file &&
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
      return { imageUuids: [], galleryFilePaths: galleryImages };
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

    const imageUuids = confirmResponse.data.files.map(
      (f: { uuid: string }) => f.uuid
    );
    console.log('[FeatureSheet] Confirmed uploads, imageUuids:', imageUuids);

    return { imageUuids, galleryFilePaths: galleryImages };
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
    const createPayload = {
      order_uuid: orderUuid,
      type: payload.type,
      uploaded_by: payload.uploaded_by,
      template_key: payload.template_key,
    };

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
    const { imageUuids } = await this.uploadImagesToS3(orderUuid, images, uuid);

    // Step 3: Update the feature sheet with final content, theme, and image_uuids
    const updatePayload = {
      order_uuid: orderUuid,
      type: payload.type,
      uploaded_by: payload.uploaded_by,
      template_key: payload.template_key,
      theme: payload.theme,
      content: payload.content,
      image_uuids: imageUuids,
    };

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
    const { imageUuids } = await this.uploadImagesToS3(orderUuid, images, uuid);

    // Build the clean API payload
    const apiPayload: Record<string, unknown> = {
      order_uuid: orderUuid,
      type: payload.type,
      uploaded_by: payload.uploaded_by,
      template_key: payload.template_key,
      theme: payload.theme,
      content: payload.content,
    };

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
    const response = await api.get(
      `${process.env.NEXT_PUBLIC_API_URL}/feature-sheets/order/${orderUuid}`,
    );

    if (response.status !== 200) {
      throw new Error("Failed to fetch feature sheets for order");
    }

    // Backend returns { data: [...] }
    return response.data.data || response.data;
  }

  /**
   * Parse payload and return state objects for component
   */
  parsePayloadToState(payload: FeatureSheetResponse): FeatureSheetState {
    // Separate property images for indexing
    const propertyImages = payload.images.filter(
      (img) => img.slot === "property" || img.slot?.startsWith("image"),
    );

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
      offeredAtPrice: payload.content.offeredAtPrice?.value || "",
      realtorTitle: payload.content.realtorTitle?.value || "",
      realtorName: payload.content.realtorName?.value || "",
      companyName: payload.content.companyName?.value || "",
      propertyNotesTitle: payload.content.propertyNotesTitle?.value || "",
      propertyNotesDescription:
        payload.content.propertyNotesDescription?.value || "",
      expandedDetail1Title:
        payload.content.expandedDetail1Title?.value || "Site Influences",
      expandedDetail1Description: (payload.content.expandedDetail1Description
        ?.value ||
        payload.content.expandedDetail1?.value ||
        "") as string,
      expandedDetail2Title: (payload.content.expandedDetail2Title?.value ||
        "Gross Taxes") as string,
      expandedDetail2Description: (payload.content.expandedDetail2Description
        ?.value ||
        payload.content.expandedDetail2?.value ||
        "") as string,
      keyHighlightLabel:
        payload.content.keyHighlightLabel?.value || "Features Included",
      keyHighlights: payload.content.keyHighlights?.value || [],
      highlights: payload.content.highlights?.value || [],
      emailLink: (payload.content.emailLink as StyledTextField)?.value || "",
      linkedinLink:
        (payload.content.linkedinLink as StyledTextField)?.value || "",
      phoneNumber:
        (payload.content.phoneNumber as StyledTextField)?.value || "",
      contactLabel:
        (payload.content.contactLabel as StyledTextField)?.value || "",
      contactInfo:
        (payload.content.contactInfo as StyledTextField)?.value || "",
      ctaText: (payload.content.ctaText as StyledTextField)?.value || "",
      amount:
        ((payload.content.otherDetails as unknown as Record<string, unknown>)
          ?.amount as string) || "",
      mlsNumber:
        ((payload.content.otherDetails as unknown as Record<string, unknown>)
          ?.mlsNumber as string) || "",
      email: (payload.content.emailLink as StyledTextField)?.value || "",
      phone: (payload.content.phoneNumber as StyledTextField)?.value || "",
      linkedin: (payload.content.linkedinLink as StyledTextField)?.value || "",
      expandedDetail3Title:
        (payload.content.expandedDetail3Title as StyledTextField)?.value || "",
      expandedDetail3Description:
        (payload.content.expandedDetail3Description as StyledTextField)
          ?.value || "",
      expandedDetail4Title:
        (payload.content.expandedDetail4Title as StyledTextField)?.value || "",
      expandedDetail4Description:
        (payload.content.expandedDetail4Description as StyledTextField)
          ?.value || "",
      otherDetails:
        (payload.content.otherDetails as unknown as Record<string, unknown>) ||
        {},

      // Mapped for BcfpStandard2 state
      title: ((payload.content.offeredAtPrice as StyledTextField)?.value ||
        "") as string,
      subtitle: ((payload.content.realtorTitle as StyledTextField)?.value ||
        "") as string,
      fullName: ((payload.content.realtorName as StyledTextField)?.value ||
        "") as string,
      propertyName: ((payload.content.propertyNotesTitle as StyledTextField)
        ?.value || "") as string,
      description: ((
        payload.content.propertyNotesDescription as StyledTextField
      )?.value || "") as string,
      siteInfluences: (payload.content.expandedDetail1Description?.value ||
        payload.content.expandedDetail1?.value ||
        "") as string,
      grossTaxes: (payload.content.expandedDetail2Description?.value ||
        payload.content.expandedDetail2?.value ||
        "") as string,
      featuresIncluded: (payload.content.keyHighlights?.value?.join("\n") ||
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
              img.url || img.storage_path || img.file || img.file_path || null;
            acc[slot] = this.buildStorageUrl(rawPath);
          }
        }

        // 2. Overlay with gallery image URLs stored in content.galleryImages.
        //    These take precedence because they are the exact original URLs
        //    the user selected from the gallery (no re-encoding needed).
        const galleryImages = (payload.content as Record<string, unknown>)
          ?.galleryImages as Record<string, string> | undefined;
        if (galleryImages) {
          for (const [slot, url] of Object.entries(galleryImages)) {
            acc[slot] = url;
          }
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
    };
  }
}

export const featureSheetService = new FeatureSheetService();
