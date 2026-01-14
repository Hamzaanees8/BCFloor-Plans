import { api } from "@/lib/api";

export interface AgentPayload {
  first_name: string;
  last_name: string;
  email: string;
  email_cc?: string;
  primary_phone?: string;
  secondary_phone?: string;
  company_name?: string;
  website?: string;
  license_number?: string;
  headquarter_address?: string;
  password?: string;
  notes?: string;
  password_confirmation?: string;
  avatar?: File | null;
  role_id?: number;
  company_logo?: File | null;
  company_banner?: File | null;
  roles?: number[];
  permissions?: number[];
  certifications?: string[];
  requires_payment?: number;
  co_agents?: {
    name: string;
    email: string;
    primary_phone?: string;
    split?: string;
  }[];
  default_music?: string | null;
}

export interface FetchErrors {
  status?: boolean;
  message?: string;
  errors?: string[];
}
export interface PaymentCard {
  type: "visa" | "mastercard" | "amex";
  last_four: string;
  cardholder_name: string;
  is_primary?: boolean;
  expiry_date: string;
  cvv: string;
}
export interface ResetPassword {
  password: string;
  password_confirmation: string;
  current_password: string;
}

export function payloadToFormData(payload: AgentPayload): FormData {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (Array.isArray(value)) {
        if (key === 'co_agents') {
          value.forEach((agent, index) => {
            formData.append(`${key}[${index}][name]`, agent.name);
            formData.append(`${key}[${index}][email]`, agent.email);
            formData.append(`${key}[${index}][primary_phone]`, agent.primary_phone);
          });
        } else {
          value.forEach(val => {
            formData.append(key + "[]", val);
          });
        }
      } else if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    }
  });

  return formData;
}

// function payloadToFormData(payload: AgentPayload): FormData {
//   const formData = new FormData();

//   Object.entries(payload).forEach(([key, value]) => {
//     if (value !== undefined && value !== null) {
//       if (value instanceof File) {
//         formData.append(key, value);
//       } else if (Array.isArray(value)) {
//         value.forEach((val) => {
//           formData.append(key + "[]", val);
//         });
//       } else if (typeof value === "object") {
//         // serialize object values
//         formData.append(key, JSON.stringify(value));
//       } else {
//         formData.append(key, value);
//       }
//     }
//   });

//   return formData;
// }

export async function CreateAgent(payload: AgentPayload) {
  const formData = payloadToFormData(payload);

  const response = await api.post(`/agents`, formData);

  const data = await response.data;

  if (data.status !== true) {
    const error = new Error(data.message || "Request failed");
    (error as FetchErrors).errors = data.errors;
    throw error;
  }

  return data;
}

export async function EditAgent(
  userId: string,
  payload: AgentPayload,
) {
  const formData = payloadToFormData(payload);

  const response = await api.post(`/agents/${userId}`, formData);

  const data = await response.data;

  if (data.status !== true) {
    const error = new Error(data.message || "Request failed");
    (error as FetchErrors).errors = data.errors;
    throw error;
  }

  return data;
}

export async function Get() {
  try {
    const response = await api.get(`/agents`);

    const agentData = await response.data;

    if (agentData.status !== true) {
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

export interface UpdateStatusPayload {
  status?: boolean;
}

export async function UpdateAgentStatus(
  uuid: string,
  payload: UpdateStatusPayload,
) {

  const response = await api.post(`/agents/${uuid}/status`, payload);

  const data = await response.data;

  if (data.status !== true) {
    throw new Error(data.message || "Failed to update status");
  }

  return data;
}

export async function GetOne(userId: string) {

  try {
    const response = await api.get(`/agents/${userId}`);

    const agentData = await response.data;

    if (agentData.status !== true) {
      throw new Error(
        agentData.message || `Request failed with status ${response.status}`
      );
    }

    return agentData;
  } catch (error) {
    console.error("Failed to fetch agent data:", error);
    throw error;
  }
}

export async function Delete(uuid: string) {

  const response = await api.post(`/agents/${uuid}`, {
    _method: "DELETE",
  });

  const data = await response.data;

  if (data.status !== true) {
    throw new Error(data.message || "Failed to delete agent");
  }

  return data;
}

export async function GetRole() {

  try {
    const response = await api.get(`/roles`);

    if (response.status !== 200) {
      throw new Error(
        response.data.message || `Request failed with status ${response.status}`
      );
    }

    const rolesData = await response.data;
    return rolesData;
  } catch (error) {
    console.error("Failed to fetch role data:", error);
    throw error;
  }
}

export async function GetPermissions() {

  try {
    const response = await api.get(`/permissions`);

    if (response.status !== 200) {
      throw new Error(
        response.data.message || `Request failed with status ${response.status}`
      );
    }

    const permissionsData = await response.data;
    return permissionsData;
  } catch (error) {
    console.error("Failed to fetch permissions data:", error);
    throw error;
  }
}
export async function AddCard(payload: PaymentCard) {

  const response = await api.post(`/payment-methods`, payload);

  const data = await response.data;

  if (response.status !== 200) {
    const error = new Error(data.message || "Request failed");
    (error as FetchErrors).errors = data.errors;
    throw error;
  }

  return data;
}
export async function DeleteCard(uuid: string) {

  const response = await api.post(`/payment-methods/${uuid}`, {
    _method: "DELETE",
  });

  const data = await response.data;

  if (response.status !== 200) {
    throw new Error(data.message || "Failed to delete payment method");
  }

  return data;
}

export async function GetPaymentMethod() {

  try {
    const response = await api.get(`/payment-methods`);
    if (response.status !== 200) {
      throw new Error(
        response.data.message || `Request failed with status ${response.status}`
      );
    }

    const paymentMethod = await response.data;

    return paymentMethod;
  } catch (error) {
    console.error("Failed to fetch Payment Method:", error);
    throw error;
  }
}

export async function ResetPasswordAgent(
  payload: ResetPassword,
  userId: string,
) {

  const response = await api.put(`/agents/${userId}/password`, payload);

  const data = await response.data;

  if (response.status !== 200) {
    throw new Error(data.message || "Failed to update password");
  }

  return data;
}

