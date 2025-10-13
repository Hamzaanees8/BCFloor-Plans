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
        if (
          key === "areas" 
        ) {
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
import { DroppedMarker } from "./FileManagerContext ";


export async function GetFilesData(
    token: string,
    orderUuid: string,
) {
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
        throw new Error(error.message || `Upload failed with status ${response.status}`);
    }

    return response.json();
}

export async function UploadFilesData(
    token: string,
    orderUuid: string,
    files: SelectedFiles[],
    links: { type: string; service_id: string; link: string }[],
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
        formData.append(`files[${index}][service_id]`, String(fileObj.service_id || ""));
    });

    links.forEach((linkObj, index) => {
        formData.append(`links[${index}][type]`, linkObj.type);
        formData.append(`links[${index}][service_id]`, String(linkObj.service_id || ""));
        formData.append(`links[${index}][link]`, linkObj.link);
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

    const response = await fetch(`${API_URL}/tours`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Upload failed with status ${response.status}`);
    }

    return response.json();
}

export async function UpdateFilesData(
    token: string,
    tourUuid: string,
    files: SelectedFiles[],
    links: { type: string; service_id: string; link: string }[],
    snapshots: DroppedMarker[],
    delay: number,
    transition: string,
    selectedAudioTrack: string
) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const formData = new FormData();

    // formData.append("order_id", orderUuid);

    files.forEach((fileObj, index) => {
        const file = fileObj.file;
        const fileType = file.type;

        let type = "photo";
        if (fileType.startsWith("video/")) type = "video";

        formData.append(`files[${index}][type]`, type);
        formData.append(`files[${index}][name]`, file.name || "");
        formData.append(`files[${index}][file]`, file);
        formData.append(`files[${index}][group]`, fileObj.type || "");
        formData.append(`files[${index}][service_id]`, String(fileObj.service_id || ""));
    });

    links.forEach((linkObj, index) => {
        formData.append(`links[${index}][type]`, linkObj.type);
        formData.append(`links[${index}][service_id]`, String(linkObj.service_id || ""));
        formData.append(`links[${index}][link]`, linkObj.link);
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
        formData.append(`snapshots[${index}][x_axis]`, String((snap.x).toFixed(6)));
        formData.append(`snapshots[${index}][y_axis]`, String((snap.y).toFixed(6)));
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
        throw new Error(error.message || `Upload failed with status ${response.status}`);
    }

    return response.json();
}



export async function UpdatePhotosData(
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

        formData.append(`files[${index}][type]`, type);
        formData.append(`files[${index}][name]`, file.name || "");
        formData.append(`files[${index}][file]`, file);
        formData.append(`files[${index}][group]`, fileObj.type || "");
        formData.append(`files[${index}][service_id]`, String(fileObj.service_id || ""));
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
        throw new Error(error.message || `Upload failed with status ${response.status}`);
    }

    return response.json();
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

        formData.append(`files[${index}][type]`, type);
        formData.append(`files[${index}][name]`, file.name || "");
        formData.append(`files[${index}][file]`, file);
        formData.append(`files[${index}][group]`, fileObj.type || "");
        formData.append(`files[${index}][service_id]`, String(fileObj.service_id || ""));
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
        throw new Error(error.message || `Upload failed with status ${response.status}`);
    }

    return response.json();
}