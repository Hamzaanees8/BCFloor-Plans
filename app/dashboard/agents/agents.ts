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

function payloadToFormData(payload: AgentPayload): FormData {
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

export async function CreateAgent(payload: AgentPayload, token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const formData = payloadToFormData(payload);

  const response = await fetch(`${API_URL}/agents`, {
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

export async function EditAgent(
  userId: string,
  payload: AgentPayload,
  token: string
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const formData = payloadToFormData(payload);

  const response = await fetch(`${API_URL}/agents/${userId}`, {
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

export async function Get(token: string) {
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

export interface UpdateStatusPayload {
  status?: boolean;
}

export async function UpdateAgentStatus(
  uuid: string,
  payload: UpdateStatusPayload,
  token: string
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/agents/${uuid}/status`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update status");
  }

  return data;
}

export async function GetOne(token: string, userId: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${API_URL}/agents/${userId}`, {
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
    console.error("Failed to fetch agent data:", error);
    throw error;
  }
}
export async function Delete(uuid: string, token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/agents/${uuid}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ _method: "DELETE" }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete agent");
  }

  return data;
}

export async function GetRole(token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${API_URL}/roles`, {
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

    const rolesData = await response.json();
    console.log("rolesData", rolesData);

    return rolesData;
  } catch (error) {
    console.error("Failed to fetch role data:", error);
    throw error;
  }
}
export async function GetPermissions(token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${API_URL}/permissions`, {
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

    const permissionsData = await response.json();
    return permissionsData;
  } catch (error) {
    console.error("Failed to fetch role data:", error);
    throw error;
  }
}
export async function AddCard(payload: PaymentCard, token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/payment-methods`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    (error as FetchErrors).errors = data.errors;
    throw error;
  }

  return data;
}
export async function DeleteCard(uuid: string, token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/payment-methods/${uuid}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ _method: "DELETE" }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete payment method");
  }

  return data;
}
export async function GetPaymentMethod(token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${API_URL}/payment-methods`, {
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

    const paymentMethod = await response.json();
    console.log("paymentMethod", paymentMethod);

    return paymentMethod;
  } catch (error) {
    console.error("Failed to fetch Payment Method:", error);
    throw error;
  }
}
export async function ResetPasswordAgent(
  payload: ResetPassword,
  userId: string,
  token: string
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/agents/${userId}/password`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update password");
  }

  return data;
}
