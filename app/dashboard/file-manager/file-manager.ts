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
