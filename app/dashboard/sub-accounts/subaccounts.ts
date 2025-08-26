export interface SubAccountPayload {
  first_name: string;
  last_name: string;
  primary_email: string;
  secondary_email?: string;
  primary_phone?: string;
  secondary_phone?: string;
  agent_id: string;
  company_name?: string;
  notification_email?: number;
  email_type?: string;
  website?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  password?: string;
  avatar?: File;
  company_logo?: File;
  company_banner?: File;
  role_id?: number;
  roles?: number[];
  permissions?: number[];
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
function payloadToFormData(payload: SubAccountPayload): FormData {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((val) => {
          formData.append(key + "[]", val);
        });
      } else if (typeof value === "object") {
        // serialize object values
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    }
  });

  return formData;
}

export async function Create(payload: SubAccountPayload, token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const formData = payloadToFormData(payload);

  const response = await fetch(`${API_URL}/sub-accounts`, {
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

export async function Edit(
  userId: string,
  payload: SubAccountPayload,
  token: string
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const formData = payloadToFormData(payload);

  const response = await fetch(`${API_URL}/sub-accounts/${userId}`, {
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
    const response = await fetch(`${API_URL}/sub-accounts`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const SubAccountData = await response.json();

    if (!response.ok) {
      throw new Error(
        SubAccountData.message ||
          `Request failed with status ${response.status}`
      );
    }

    return SubAccountData;
  } catch (error) {
    console.error("Failed to fetch sub-account data:", error);
    throw error;
  }
}

export interface UpdateSubAccountPayload {
  status?: boolean;
}

export async function UpdateStatus(
  userId: string,
  payload: UpdateSubAccountPayload,
  token: string
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/sub-accounts/${userId}/status`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update Sub-account");
  }

  return data;
}

export async function GetOne(token: string, userId: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${API_URL}/sub-accounts/${userId}`, {
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
    console.error("Failed to fetch Sub-account data:", error);
    throw error;
  }
}
export async function Delete(userId: string, token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/sub-accounts/${userId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ _method: "DELETE" }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete user");
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
export async function ResetPasswordSubAccount(
  payload: ResetPassword,
  userId: string,
  token: string
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/sub-accounts/${userId}/password`, {
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
