export interface DiscountEditStatusPayload {
  status: boolean;
}
export interface FetchErrors {
  status?: boolean;
  message?: string;
  errors?: string[];
}
export interface DiscountPayload {
  name: string;
  type: string;
  percentage: number;
  expiry_date: string;
  services: number[];
  description: string;
  quantity: number;
}
export interface CodePayload {
  type: string;
  percentage: number;
  code_key: string;
  description: string;
}

interface CompanyData {
  name: string;
  website: string;
  email: string;
  primary_phone: string;
  secondary_phone: string | null;
  street: string;
  city: string;
  province: string;
  country: string;
  billing_street_1: string;
  billing_street_2: string | null;
  review_files: number;
  logo_path?: File | undefined;
  banner_path?: File | undefined;
  start_time: string | null;
  end_time: string | null;
  work_days: string[];
  repeat_weekly: string;
  timezone: string;
  commute_minutes: number;
  enable_breaks: number;
  sync_google: number;
  sync_email: string;
  payment_per_km: string;
  order_form_url: string | null;
  iframe_code: string | null;
}
export interface PaymentCard {
  type: "visa" | "mastercard" | "amex";
  last_four: string;
  cardholder_name: string;
  is_primary?: boolean;
  expiry_date: string;
  cvv: string;
}

export async function CreateDiscount(payload: DiscountPayload, token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/discounts`, {
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

export async function CreateCode(payload: CodePayload, token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/discounts`, {
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
export async function EditCode(
  payload: CodePayload,
  token: string,
  uuid: string
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/discounts/${uuid}`, {
    method: "PUT",
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

export async function EditDiscount(
  payload: DiscountPayload,
  token: string,
  uuid: string
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/discounts/${uuid}`, {
    method: "PUT",
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

export async function GetDiscount(token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${API_URL}/discounts`, {
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

    const discounts = await response.json();
    console.log("Discounts", discounts);

    return discounts;
  } catch (error) {
    console.error("Failed to fetch discounts data:", error);
    throw error;
  }
}

export async function GetServices(token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${API_URL}/services`, {
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

    const services = await response.json();
    console.log("Services", services);

    return services;
  } catch (error) {
    console.error("Failed to fetch services data:", error);
    throw error;
  }
}

export async function GetOne(token: string, uuid: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${API_URL}/discounts/${uuid}`, {
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

    const discount = await response.json();
    return discount;
  } catch (error) {
    console.error("Failed to fetch discount data:", error);
    throw error;
  }
}
export async function EditDiscountStatus(
  payload: DiscountEditStatusPayload,
  token: string,
  uuid: string
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/discounts/${uuid}/status`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to edit discount status");
  }

  return data;
}
export async function Delete(uuid: string, token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/discounts/${uuid}`, {
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
export async function GetCompany(token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${API_URL}/companies/by_user`, {
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

    const company = await response.json();
    console.log("company", company);

    return company;
  } catch (error) {
    console.error("Failed to fetch company data:", error);
    throw error;
  }
}
function payloadToFormData(payload: CompanyData): FormData {
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

export async function CreateCompany(payload: CompanyData, token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  console.log("Raw Payload:", payload);
  const formData = payloadToFormData(payload);
  console.log("formdata");
  for (const [key, value] of formData.entries()) {
    let valueType: string;

    // First, narrow the value type safely
    if (typeof value === "string") {
      valueType = "string";
    } else if (value instanceof File) {
      valueType = "File";
      // } else if (value instanceof Blob) {
      //   valueType = "Blob";
    } else {
      valueType = Object.prototype.toString.call(value);
    }

    console.log(`${key}:`, value, `| Type: ${valueType}`);
  }
  const response = await fetch(`${API_URL}/companies`, {
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

export async function UpdateCompany(
  payload: CompanyData,
  token: string,
  uuid: string
) {
  console.log("Raw Payload:", payload);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const formData = payloadToFormData(payload);
  console.log("dcdcdcdcdcdcdcd");
  for (const [key, value] of formData.entries()) {
    let valueType: string;

    // First, narrow the value type safely
    if (typeof value === "string") {
      valueType = "string";
    } else if (value instanceof File) {
      valueType = "File";
      // } else if (value instanceof Blob) {
      //   valueType = "Blob";
    } else {
      valueType = Object.prototype.toString.call(value);
    }

    console.log(`${key}:`, value, `| Type: ${valueType}`);
  }

  const response = await fetch(`${API_URL}/companies/${uuid}`, {
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
