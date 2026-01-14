import { api } from "@/lib/api";

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

export async function CreateDiscount(payload: DiscountPayload) {

  const response = await api.post(`/discounts`, payload);

  const data = await response.data;

  if (data.status !== true) {
    const error = new Error(data.message || "Request failed");
    (error as FetchErrors).errors = data.errors;
    throw error;
  }

  return data;
}

export async function CreateCode(payload: CodePayload) {

  const response = await api.post(`/discounts`, payload);

  const data = await response.data;

  if (data.status !== true) {
    const error = new Error(data.message || "Request failed");
    (error as FetchErrors).errors = data.errors;
    throw error;
  }

  return data;
}
export async function EditCode(
  payload: CodePayload,
  uuid: string
) {

  const response = await api.put(`/discounts/${uuid}`, payload);

  const data = await response.data;

  if (data.status !== true) {
    const error = new Error(data.message || "Request failed");
    (error as FetchErrors).errors = data.errors;
    throw error;
  }

  return data;
}

export async function EditDiscount(
  payload: DiscountPayload,
  uuid: string
) {

  const response = await api.put(`/discounts/${uuid}`, payload);

  const data = await response.data;

  if (response.status !== 200) {
    const error = new Error(data.message || "Request failed");
    (error as FetchErrors).errors = data.errors;
    throw error;
  }

  return data;
}

export async function GetDiscount() {

  try {
    const response = await api.get(`/discounts`);

    const discounts = await response.data;
    if (discounts.status !== true) {
      const error = await discounts.catch(() => ({}));
      throw new Error(
        error.message || `Request failed with status ${response.status}`
      );
    }

    return discounts;
  } catch (error) {
    console.error("Failed to fetch discounts data:", error);
    throw error;
  }
}

export async function GetServices() {

  try {
    const response = await api.get(`/services`);

    const services = await response.data;
    if (services.status !== true) {
      const error = await services.catch(() => ({}));
      throw new Error(
        error.message || `Request failed with status ${response.status}`
      );
    }


    return services;
  } catch (error) {
    console.error("Failed to fetch services data:", error);
    throw error;
  }
}

export async function GetOne(uuid: string) {

  try {
    const response = await api.get(`/discounts/${uuid}`);

    const discount = await response.data;

    if (discount.status !== true) {
      const error = await response.data.catch(() => ({}));
      throw new Error(
        error.message || `Request failed with status ${response.status}`
      );
    }

    return discount;
  } catch (error) {
    console.error("Failed to fetch discount data:", error);
    throw error;
  }
}
export async function EditDiscountStatus(
  payload: DiscountEditStatusPayload,
  uuid: string
) {

  const response = await api.put(`/discounts/${uuid}/status`, payload);

  const data = await response.data;

  if (data.status !== true) {
    throw new Error(data.message || "Failed to edit discount status");
  }

  return data;
}
export async function Delete(uuid: string) {

  const response = await api.delete(`/discounts/${uuid}`);

  const data = await response.data;

  if (response.status !== 200) {
    throw new Error(data.message || "Failed to delete user");
  }

  return data;
}
export async function GetCompany() {

  try {
    const response = await api.get(`/companies/by_user`);

    const company = await response.data;
    if (company.status !== true) {
      throw new Error(company.message || "Failed to fetch company data");
    }

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

export async function CreateCompany(payload: CompanyData) {
  const formData = payloadToFormData(payload);
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
  const response = await api.post(`/companies`, formData);

  const data = await response.data;

  if (data.status !== true) {
    const error = new Error(data.message || "Request failed");
    (error as FetchErrors).errors = data.errors;
    throw error;
  }

  return data;
}

export async function UpdateCompany(
  payload: CompanyData,
  uuid: string
) {

  const formData = payloadToFormData(payload);
  for (const [key, value] of formData.entries()) {
    let valueType: string;

    // First, narrow the value type safely
    if (typeof value === "string") {
      valueType = "string";
    } else if (value instanceof File) {
      valueType = "File";
    } else {
      valueType = Object.prototype.toString.call(value);
    }

    console.log(`${key}:`, value, `| Type: ${valueType}`);
  }

  const response = await api.post(`/companies/${uuid}`, formData);

  const data = await response.data;

  if (data.status !== true) {
    const error = new Error(data.message || "Request failed");
    (error as FetchErrors).errors = data.errors;
    throw error;
  }

  return data;
}

export async function AddCard(payload: PaymentCard) {

  const response = await api.post(`/payment-methods`, payload);

  const data = await response.data;

  if (data.status !== true) {
    const error = new Error(data.message || "Request failed");
    (error as FetchErrors).errors = data.errors;
    throw error;
  }

  return data;
}
export async function DeleteCard(uuid: string) {

  const response = await api.delete(`/payment-methods/${uuid}`);

  const data = await response.data;

  if (data.status !== true) {
    throw new Error(data.message || "Failed to delete payment method");
  }

  return data;
}

export async function GetPaymentMethod() {

  try {
    const response = await api.get(`/payment-methods`);

    const paymentMethod = await response.data;

    // if (paymentMethod.status !== true) {
    //   throw new Error(paymentMethod.message || "Failed to fetch payment method");
    // }

    return paymentMethod;
  } catch (error) {
    console.error("Failed to fetch Payment Method:", error);
    throw error;
  }
}

export async function GetQuickBookStatus() {

  try {
    const response = await api.get(`/quickbooks/status`);

    const paymentMethod = await response.data;

    return paymentMethod;
  } catch (error) {
    console.error("Failed to fetch Payment Method:", error);
    throw error;
  }
}
export async function QuickBookConnection() {

  try {
    const response = await api.get(`/quickbooks/connect`);

    const paymentMethod = await response.data;

    if (paymentMethod.status !== true) {
      throw new Error(paymentMethod.message || "Failed to fetch payment method");
    }

    return paymentMethod;
  } catch (error) {
    console.error("Failed to fetch Payment Method:", error);
    throw error;
  }
}


export async function GetMediaSettings() {

  try {
    const response = await api.get(`/settings/media_settings`);

    const data = await response.data;

    // if (data.success !== true) {
    //   throw new Error(data.message || "Failed to fetch payment method");
    // }

    return data;
  } catch (error) {
    console.error("Failed to fetch Media Settings:", error);
    throw error;
  }
}

export async function GetTourSettings() {

  try {
    const response = await api.get(`/global-settings`);

    const data = await response.data;

    if (data.success !== true) {
      throw new Error(data.message || "Failed to fetch payment method");
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch Tour Settings:", error);
    throw error;
  }
}

export async function SaveTourSettings(payload: TourSettingPayload[]) {

  const response = await api.post(`/global-settings`, { tour_settings: payload });

  const data = await response.data;

  if (data.success !== true) {
    const error = new Error(data.message || "Request failed");
    (error as FetchErrors).errors = data.errors;
    throw error;
  }

  return data;
}

export async function UpdateTourSetting(payload: TourSettingPayload) {
  const response = await api.put(`/global-settings/${payload.uuid}`, payload);

  const data = await response.data;

  if (data.success !== true) {
    const error = new Error(data.message || "Request failed");
    (error as FetchErrors).errors = data.errors;
    throw error;
  }

  return data;
}

export async function DeleteTourSetting(uuid: string) {
  const response = await api.delete(`/global-settings/${uuid}`);

  const data = await response.data;

  if (data.success !== true) {
    throw new Error(data.message || "Failed to delete tour setting");
  }

  return data;
}

export interface TourSettingPayload {
  uuid?: string;
  area: string;
  type: string;
  charge: number;
  discount: number;
  status: boolean;
  is_percentage?: boolean;
}

export interface MediaSettingsPayload {
  photos: {
    original: { width: number; height: number };
    small: { width: number; height: number };
    large: { width: number; height: number };
    mls: { width: number; height: number };
  };
  videos: {
    original: { width: number; height: number };
    small: { width: number; height: number };
    large: { width: number; height: number };
    mls: { width: number; height: number };
  };
}
export async function CreateMediaSettings(payload: MediaSettingsPayload) {

  const response = await api.post(
    "/settings/media_settings",
    {
      value: payload,
    }
  );

  const data = await response.data;


  return data;
}

export async function UpdateMediaSettings(payload: MediaSettingsPayload) {

  const response = await api.put(`/settings/media_settings`, {
    value: payload,
  });

  const data = await response.data;

  if (data.success !== true) {
    const error = new Error(data.message || "Request failed");
    (error as FetchErrors).errors = data.errors;
    throw error;
  }

  return data;
}