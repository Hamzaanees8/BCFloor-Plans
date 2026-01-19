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
  token: string
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
import { SelectedFiles } from "./components/HDRStill";
import { DroppedMarker, Files } from "./FileManagerContext ";
import { Order } from "../orders/page";

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
      error.message || `Upload failed with status ${response.status}`
    );
  }

  return response.json();
}

export async function UploadFilesData(
  token: string,
  orderUuid: string,
  files: SelectedFiles[],
  links: { type: string; service_id: string; link: string; expiry_date?: string; uuid?: string }[],
  snapshots: DroppedMarker[],
  delay: number,
  transition: string,
  selectedAudioTrack: string
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const formData = new FormData();

  formData.append("order_id", orderUuid);

  files.forEach((fileObj, index) => {
    const file = fileObj.file;
    const fileType = file.type;

    let type = "photo";
    if (fileType.startsWith("video/")) type = "video";

    formData.append(`files[${index}][type]`, type);
    formData.append(`files[${index}][name]`, file.name || "");
    formData.append(`files[${index}][file]`, file);
    formData.append(`files[${index}][group]`, fileObj.type || "");
    formData.append(
      `files[${index}][service_id]`,
      String(fileObj.service_id || "")
    );
    formData.append(
      `files[${index}][is_featured]`,
      String(fileObj.is_featured ? 1 : 0)
    );
    formData.append(
      `files[${index}][is_admin_approved]`,
      String(fileObj.is_admin_approved === false ? 0 : 1)
    );
    formData.append(
      `files[${index}][is_agent_approved]`,
      String(fileObj.is_agent_approved === true ? 1 : 0)
    );
    formData.append(
      `files[${index}][is_show]`,
      String(fileObj.is_show === false ? 0 : 1)
    );
  });

  links.forEach((linkObj, index) => {
    formData.append(`links[${index}][type]`, linkObj.type);
    formData.append(
      `links[${index}][service_id]`,
      String(linkObj.service_id || "")
    );
    formData.append(`links[${index}][link]`, linkObj.link);
    if (linkObj.expiry_date) {
      formData.append(`links[${index}][expiry_date]`, linkObj.expiry_date);
    }
    if (linkObj.uuid) {
      formData.append(`links[${index}][uuid]`, linkObj.uuid);
    }
  });

  snapshots.forEach((snap, index) => {
    formData.append(`snapshots[${index}][name]`, snap.name || "");
    formData.append(`snapshots[${index}][file_name]`, snap.floorImageUrl || "");
    formData.append(`snapshots[${index}][description]`, snap.description || "");
    if (snap.file_path) {
      formData.append(`snapshots[${index}][file]`, snap.file_path);
    } else if (snap.file) {
      formData.append(`snapshots[${index}][file]`, snap.file);
    } else {
      formData.append(`snapshots[${index}][file]`, "");
    }
    formData.append(`snapshots[${index}][x_axis]`, String(snap.x));
    formData.append(`snapshots[${index}][y_axis]`, String(snap.y));
  });

  formData.append("slide_show[slide_delay]", String(delay));
  formData.append("slide_show[transitions]", transition);
  formData.append("slide_show[background_audio]", selectedAudioTrack || "none");
  formData.append("slide_show[auto_play]", String(0));
  formData.append("slide_show[video_overlay]", String(0));

  // Debug: Log FormData content
  for (const pair of formData.entries()) {
    if (pair[0].includes('is_show')) {
      console.log('API Payload Entry:', pair[0], pair[1]);
    }
  }

  const response = await fetch(`${API_URL}/tours`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `Upload failed with status ${response.status}`
    );
  }

  return response.json();
}

export async function UpdateFilesData(
  token: string,
  tourUuid: string,
  files: SelectedFiles[],
  links: { type: string; service_id: string; link: string; expiry_date?: string; uuid?: string }[],
  snapshots: DroppedMarker[],
  delay: number,
  transition: string,
  selectedAudioTrack: string,
  existingFiles?: Files[]
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const formData = new FormData();

  // formData.append("order_id", orderUuid);

  // Handle new files (with actual File objects)
  files.forEach((fileObj, index) => {
    const file = fileObj.file;
    const fileType = file.type;

    let type = "photo";
    if (fileType.startsWith("video/")) type = "video";

    formData.append(`files[${index}][type]`, type);
    formData.append(`files[${index}][name]`, file.name || "");
    formData.append(`files[${index}][file]`, file);
    formData.append(`files[${index}][group]`, fileObj.type || "");
    formData.append(
      `files[${index}][service_id]`,
      String(fileObj.service_id || "")
    );
    formData.append(
      `files[${index}][is_featured]`,
      String(fileObj.is_featured ? 1 : 0)
    );
    formData.append(
      `files[${index}][is_admin_approved]`,
      String(fileObj.is_admin_approved === false ? 0 : 1)
    );
    formData.append(
      `files[${index}][is_agent_approved]`,
      String(fileObj.is_agent_approved === true ? 1 : 0)
    );
    formData.append(
      `files[${index}][is_show]`,
      String(fileObj.is_show === false ? 0 : 1)
    );
  });

  // Handle existing files (already uploaded, send UUID and file_path)
  existingFiles?.forEach((fileObj, index) => {
    const fileIndex = files.length + index;
    formData.append(`files[${fileIndex}][uuid]`, fileObj.uuid);
    formData.append(`files[${fileIndex}][file_path]`, fileObj.file_path);
    formData.append(`files[${fileIndex}][name]`, fileObj.name || "");
    formData.append(`files[${fileIndex}][type]`, fileObj.type || "photo");
    formData.append(`files[${fileIndex}][group]`, fileObj.group || "");
    formData.append(
      `files[${fileIndex}][service_id]`,
      String(fileObj.service?.uuid || fileObj.service_id || "")
    );
    formData.append(
      `files[${fileIndex}][is_featured]`,
      String(fileObj.is_featured ? 1 : 0)
    );
    formData.append(
      `files[${fileIndex}][is_admin_approved]`,
      String(fileObj.is_admin_approved === false ? 0 : 1)
    );
    formData.append(
      `files[${fileIndex}][is_agent_approved]`,
      String(fileObj.is_agent_approved === true ? 1 : 0)
    );
    formData.append(
      `files[${fileIndex}][is_show]`,
      String(fileObj.is_show === false ? 0 : 1)
    );
  });

  links.forEach((linkObj, index) => {
    formData.append(`links[${index}][type]`, linkObj.type);
    formData.append(
      `links[${index}][service_id]`,
      String(linkObj.service_id || "")
    );
    formData.append(`links[${index}][link]`, linkObj.link);
    if (linkObj.expiry_date) {
      formData.append(`links[${index}][expiry_date]`, linkObj.expiry_date);
    }
    if (linkObj.uuid) {
      formData.append(`links[${index}][uuid]`, linkObj.uuid);
    }
  });

  snapshots.forEach((snap, index) => {
    formData.append(`snapshots[${index}][name]`, snap.name || "");
    formData.append(`snapshots[${index}][description]`, snap.description || "");
    formData.append(`snapshots[${index}][file_name]`, snap.floorImageUrl || "");
    if (snap.file_path) {
      formData.append(`snapshots[${index}][file]`, snap.file_path);
    } else if (snap.file) {
      formData.append(`snapshots[${index}][file]`, snap.file);
    } else {
      formData.append(`snapshots[${index}][file]`, "");
    }
    formData.append(`snapshots[${index}][x_axis]`, String(snap.x.toFixed(6)));
    formData.append(`snapshots[${index}][y_axis]`, String(snap.y.toFixed(6)));
  });

  formData.append("slide_show[slide_delay]", String(delay));
  formData.append("slide_show[transitions]", transition);
  formData.append("slide_show[background_audio]", selectedAudioTrack || "none");
  formData.append("slide_show[auto_play]", String(0));
  formData.append("slide_show[video_overlay]", String(0));
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
      error.message || `Upload failed with status ${response.status}`
    );
  }

  return response.json();
}

export async function UpdatePhotosData(
  token: string,
  tourUuid: string,
  files?: SelectedFiles[]
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const formData = new FormData();

  // formData.append("order_id", orderUuid);

  files?.forEach((fileObj, index) => {
    const file = fileObj.file;
    const fileType = file.type;

    let type = "photo";
    if (fileType.startsWith("video/")) type = "video";

    formData.append(`files[${index}][type]`, type);
    formData.append(`files[${index}][name]`, file.name || "");
    formData.append(`files[${index}][file]`, file);
    formData.append(`files[${index}][group]`, fileObj.type || "");
    formData.append(
      `files[${index}][service_id]`,
      String(fileObj.service_id || "")
    );
    formData.append(
      `files[${index}][is_featured]`,
      String(fileObj.is_featured ? 1 : 0)
    );
    formData.append(
      `files[${index}][is_admin_approved]`,
      String(fileObj.is_admin_approved === false ? 0 : 1)
    );
    formData.append(
      `files[${index}][is_agent_approved]`,
      String(fileObj.is_agent_approved === true ? 1 : 0)
    );
    formData.append(
      `files[${index}][is_show]`,
      String(fileObj.is_show === false ? 0 : 1)
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
      error.message || `Upload failed with status ${response.status}`
    );
  }

  return response.json();
}
export async function UpdateFloorPhotosData(
  token: string,
  tourUuid: string,
  files?: SelectedFiles[]
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const formData = new FormData();

  // formData.append("order_id", orderUuid);

  files?.forEach((fileObj, index) => {
    const file = fileObj.file;
    const fileType = file.type;

    let type = "photo";
    if (fileType.startsWith("video/")) type = "video";

    formData.append(`files[${index}][type]`, type);
    formData.append(`files[${index}][name]`, file.name || "");
    formData.append(`files[${index}][file]`, file);
    formData.append(`files[${index}][group]`, fileObj.type || "");
    formData.append(
      `files[${index}][service_id]`,
      String(fileObj.service_id || "")
    );
    formData.append(
      `files[${index}][is_featured]`,
      String(fileObj.is_featured ? 1 : 0)
    );
    formData.append(
      `files[${index}][is_admin_approved]`,
      String(fileObj.is_admin_approved === false ? 0 : 1)
    );
    formData.append(
      `files[${index}][is_agent_approved]`,
      String(fileObj.is_agent_approved === true ? 1 : 0)
    );
    formData.append(
      `files[${index}][is_show]`,
      String(fileObj.is_show === false ? 0 : 1)
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
      error.message || `Upload failed with status ${response.status}`
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
  }
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
      amount: order.amount,
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
  fileUuid: string
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/tours/files/${fileUuid}/download`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Upload failed with status ${response.status}`);
  }

  return response
}
export async function ServiceCompletion(
  token: string,
  serviceUUid: string,
  seviceStatus: boolean,
  OrderUuid: string
) {
  const params = new URLSearchParams();
  params.append('order_uuid', OrderUuid);
  params.append('orderservice_uuid', serviceUUid);
  params.append('is_completed', `${seviceStatus ? 1 : 0}`);

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
    throw new Error(error.message || `Upload failed with status ${response.status}`);
  }

  return response
}