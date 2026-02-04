import { api } from "@/lib/api";
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
  areas: Area[];
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
export async function GetAgents() {
  try {
    const response = await api.get(`/agents`);

    const agentData = await response.data;

    if (response.status !== 200) {
      throw new Error(
        agentData.message || `Request failed with status ${response.status}`,
      );
    }

    return agentData;
  } catch (error) {
    console.error("Failed to fetch agents data:", error);
    throw error;
  }
}

export async function GetOne(orderId: string) {
  try {
    const response = await api.get(`/orders/${orderId}`);

    if (response.status !== 200) {
      const error = await response.data;
      throw new Error(
        error.message || `Request failed with status ${response.status}`,
      );
    }

    const orderData = await response.data;
    return orderData;
  } catch (error) {
    console.error("Failed to fetch Order data:", error);
    throw error;
  }
}

export async function EditOrder(
  orderId: string,
  payload: OrderPayload,
  token: string,
) {
  const formData = payloadToFormData(payload);

  const response = await api.post(`/orders/${orderId}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.data;

  if (response.status !== 200) {
    const error = new Error(data.message || "Request failed");
    (error as FetchErrors).errors = data.errors;
    throw error;
  }

  return data;
}

export interface AddVendorBreakPayload {
  vendor_id: number;
  title: string;
  date: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  address: string;
  type?: string;
}

export async function addVendorBreak(
  payload: AddVendorBreakPayload,
  token: string,
) {
  try {
    const res = await api.post(`/vendor-breaks/add`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.data.status === false) {
      throw new Error(`failed to add vendor break`);
    }

    return await res.data;
  } catch (err) {
    console.error("addVendorBreak error", err);
    throw err;
  }
}

export async function updateVendorBreak(
  breakId: string,
  payload: AddVendorBreakPayload,
  token: string,
) {
  try {
    const res = await api.post(
      `/vendor-breaks/edit/${breakId}`,
      { ...payload, _method: "PUT" },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (res.status !== 200) {
      const error = await res.data;
      throw new Error(
        error.message || `Request failed with status ${res.status}`,
      );
    }

    return await res.data;
  } catch (err) {
    console.error("update VendorBreak error", err);
    throw err;
  }
}

export async function DeleteVendorBreak(uuid: string, token: string) {
  const response = await api.delete(`/vendor-breaks/${uuid}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.data;

  if (response.status !== 200) {
    throw new Error(data.message || "Failed to delete vendor break");
  }

  return data;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmailNotification(
  payload: SendEmailPayload,
  token: string,
) {
  try {
    console.log("=== Sending Email Notification ===");
    console.log("To:", payload.to);
    console.log("Subject:", payload.subject);
    console.log("API URL:", `/notifications/email`);
    console.log("Token:", token ? "Present" : "Missing");

    const response = await api.post(`/notifications/email`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Response status:", response.status);
    console.log("Response data:", response.data);

    const data = await response.data;

    if (response.status !== 200 || data.status === false) {
      throw new Error(data.message || "Failed to send email notification");
    }

    console.log("✅ Email sent successfully to:", payload.to);
    return data;
  } catch (error) {
    console.error("❌ Failed to send email notification:", error);
    console.error("Error details:", error);
    throw error;
  }
}
