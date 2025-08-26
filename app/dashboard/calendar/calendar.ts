import { Area, CoAgent } from "./components/OrderDetailView";

type AgentNote = {
  note: string;
  name: string;
  date: string;
};
export interface OrderPayload {
  agent_id: string;
  property_id: string;
  amount: number;
  order_status: "Processing" | "Completed" | "Cancelled" | string;
  payment_status: "UNPAID" | "PAID" | string;
  split_invoice: number;
  co_agents?: CoAgent[];
  notes: AgentNote[];
  areas:Area[];
  services: {
    service_id: string;
    option_id?: string;
    amount: number;
    custom?: string;
  }[];
  discounts?: {
    discount_id: string;
    type: "code" | "quantity" | "manual" | string;
    value: number;
    service_id?: string;
  }[];
  slots: {
    service_id: string;
    vendor_id: string;
    show_all_vendors?: number;
    schedule_override?: number;
    recommend_time?: number;
    travel?: string;
    start_time: string;
    end_time: string;
    est_time: number | null;
    distance?: number | null;
    km_price?: number | null;
    date: string;
  }[];
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
          key === "co_agents" ||
          key === "services" ||
          key === "discounts" ||
          key === "notes" ||
          key === "areas" ||
          key === "slots"
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
export async function GetAgents(token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${API_URL}/agents`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const agentData = await response.json();

    if (!response.ok) {
      throw new Error(
        agentData.message || `Request failed with status ${response.status}`
      );
    }

    return agentData;
  } catch (error) {
    console.error("Failed to fetch agents data:", error);
    throw error;
  }
}


export async function GetOne(token: string, orderId: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || `Request failed with status ${response.status}`
      );
    }

    const adminData = await response.json();
    return adminData;
  } catch (error) {
    console.error("Failed to fetch Order data:", error);
    throw error;
  }
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