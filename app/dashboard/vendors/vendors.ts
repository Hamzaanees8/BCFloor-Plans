import { SelectedService } from "@/components/WorkHours";
import { api } from "@/lib/api";

export interface VendorService {
  uuid?: string;
  service_id: string; // UUID of the selected service
  hourly_rate: number;
  time_needed: number;
  service?: {
    uuid: string;
    name: string;
  };
}
export interface VendorSettings {
  payment_per_km: number;
  enable_service_area: number;
  force_service_area: number;
}
export interface VendorCompany {
  name: string;
  website: string;
  vendor_id?: number;
  // company_logo: File | null;
  // company_banner: File | null;
}
export interface VendorAddress {
  type: "company" | "billing" | string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  province: string;
  country: string;
}
interface WorkDay {
  day: string;
  start_time: string | undefined;
  end_time: string | undefined;
  is_off: boolean;
  is_twilight: boolean;
}

export interface WorkHours {
  start_time?: string; // Make optional
  end_time?: string;   // Make optional
  work_days: WorkDay[];
  repeat_weekly: string;
  break_start?: string | null;
  break_end?: string | null;
  commute_minutes?: number;
  timezone?: string;
}

export interface VendorPayload {
  first_name: string;
  last_name: string;
  email: string;
  secondary_email?: string;
  primary_phone?: string;
  secondary_phone?: string;
  notification_email?: number;
  email_type?: string;
  name_on_booking: number;
  review_files: number;
  sync_google_calendar: number;
  sync_google: number;
  sync_email: string;
  password?: string;
  avatar?: File;
  company_logo?: File | null;
  company_banner?: File | null;
  company?: VendorCompany;
  settings?: VendorSettings;
  services?: SelectedService[];
  addresses?: VendorAddress[];
  work_hours?: WorkHours;
  coordinates?: string;
  payment_per_km?: number;
  portfolio_images?: (File | string)[];
  pay_outside: number;
  stripe_connect: number;
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

function payloadToFormData(payload: VendorPayload): FormData {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      if (key === "portfolio_images") {
        value.forEach((item, index) => {
          if (item instanceof File) {
            formData.append(`${key}[${index}]`, item);
          } else if (typeof item === 'string') {
            formData.append(`${key}[${index}]`, item);
          }
        });
      } else if (key === "addresses") {
        value.forEach((address, index) => {
          Object.entries(address).forEach(([k, v]) => {
            formData.append(`${key}[${index}][${k}]`, v != null ? String(v) : "");
          });
        });
      } else if (key === "services") {
        value.forEach((service, index) => {
          formData.append(`services[${index}][service_id]`, String(service.service_id));
          service.options?.forEach(
            (opt: { uuid?: string; option_uuid: string; vendor_price: number; adjustment_time: string }, optIndex: number
            ) => {
              formData.append(
                `services[${index}][options][${optIndex}][option_uuid]`,
                String(opt.option_uuid)
              );
              formData.append(
                `services[${index}][options][${optIndex}][vendor_price]`,
                String(opt.vendor_price)
              );
              formData.append(
                `services[${index}][options][${optIndex}][adjustment_time]`,
                String(opt.adjustment_time)
              );
            }
          );
        });
      } else if (key === "coordinates") {
        formData.append(key, JSON.stringify(value));
      }
      else if (key === "sync_email") {
        formData.append(key, String(value));
      }

    } else if (key === "work_hours") {
      Object.entries(value).forEach(([k, v]) => {
        if (Array.isArray(v) && k === "work_days") {
          // Properly handle work_days array
          v.forEach((dayObj, index) => {
            Object.entries(dayObj).forEach(([dayKey, dayValue]) => {
              if (dayValue !== null && dayValue !== undefined) {
                // Convert boolean values to 1/0 for form data
                let finalValue;
                if (typeof dayValue === 'boolean') {
                  finalValue = dayValue ? '1' : '0';
                } else {
                  finalValue = String(dayValue);
                }
                formData.append(
                  `${key}[${k}][${index}][${dayKey}]`,
                  finalValue
                );
              }
            });
          });
        } else if (v !== null && v !== undefined) {
          // Also handle boolean values in other work_hours fields
          let finalValue;
          if (typeof v === 'boolean') {
            finalValue = v ? '1' : '0';
          } else {
            finalValue = String(v);
          }
          formData.append(`${key}[${k}]`, finalValue);
        }
      });
    } else if (key === "settings") {
      Object.entries(value).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
          const finalValue =
            typeof v === "boolean" ? (v ? "1" : "0") : String(v);

          formData.append(`${key}[${k}]`, finalValue);
        }
      });
    } else {
      formData.append(key, String(value));
    }
  });

  return formData;
}

export async function Create(payload: VendorPayload) {
  const formData = payloadToFormData(payload);

  const response = await api.post(`/vendors`, formData);

  const data = await response.data;

  return data;
}

export async function Edit(
  userId: string,
  payload: VendorPayload,
) {
  const formData = payloadToFormData(payload);

  const response = await api.post(`/vendors/${userId}`, formData);

  const data = await response.data;

  return data;
}

export async function Get() {

  try {
    const response = await api.get(`/vendors`);

    const SubAccountData = response.data;

    return SubAccountData;
  } catch (error) {
    console.error("Failed to fetch vendor data:", error);
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
  const response = await api.post(`/vendors/${userId}/status`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.data;

  return data;

}

export async function GetOne(userId: string) {
  try {
    const response = await api.get(`/vendors/${userId}`);

    const adminData = await response.data;
    return adminData;
  } catch (error) {
    console.error("Failed to fetch vendor data:", error);
    throw error;
  }
}
export async function Delete(userId: string) {

  const response = await api.delete(`/vendors/${userId}`);

  const data = await response.data;

  return data;
}

export async function ResetPasswordVendor(
  payload: ResetPassword,
  userId: string
) {

  const response = await api.put(`/vendors/${userId}/password`, payload);

  const data = await response.data;

  return data;
}
export async function GetServices() {

  try {
    const response = await api.get(`/services`);

    const adminData = await response.data;
    return adminData;
  } catch (error) {
    console.error("Failed to fetch admin data:", error);
    throw error;
  }
}

// utils/distanceCalculator.ts
export async function calculateDistance(
  originAddress: string,
  destinationAddress: string
): Promise<{ est_time: number; distance: number } | null> {
  if (typeof window === "undefined" || !window.google?.maps) {
    console.error("Google Maps API not loaded.");
    return null;
  }

  const geocoder = new window.google.maps.Geocoder();
  const distanceService = new window.google.maps.DistanceMatrixService();

  // Helper: Geocode function
  function geocode(address: string): Promise<string> {
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          resolve(results[0].formatted_address);
        } else {
          reject(`Geocode failed for ${address}: ${status}`);
        }
      });
    });
  }

  try {
    const [origin, destination] = await Promise.all([
      geocode(originAddress.trim()),
      geocode(destinationAddress.trim()),
    ]);

    return new Promise((resolve) => {
      distanceService.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destination],
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
          if (status !== "OK" || !response?.rows?.[0]?.elements?.[0]) {
            console.error("Distance Matrix failed:", status);
            resolve(null);
            return;
          }

          const element = response.rows[0].elements[0];
          if (element.status !== "OK") {
            console.error("Invalid element:", element.status);
            resolve(null);
            return;
          }

          const distance = element.distance.value / 1000;
          const est_time = element.duration.value / 60;

          resolve({ distance, est_time });
        }
      );
    });
  } catch (error) {
    console.error("Error calculating distance:", error);
    return null;
  }
}

// lib/api/stripeAPI.ts

export interface StripeConnectResponse {
  success: boolean;
  url?: string;
  message?: string;
  error?: string;
}

export const connectStripe = async (
  vendorId: string
): Promise<StripeConnectResponse> => {

  try {
    const response = await api.post(`/vendor/stripe/connect`, { vendor_id: vendorId });


    const data = await response.data;

    return {
      success: true,
      url: data.url, // If API returns redirect URL
      message: data.message,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Stripe connect error:", error);
    return {
      success: false,
      error: error.message || "Failed to connect Stripe",
    };
  }
};


export async function DeleteVendorBreak(uuid: string) {

  const response = await api.delete(`/vendor-breaks/${uuid}`);

  const data = await response.data;

  return data;
}

export async function DeleteVendorService(uuid: string, service_id: string) {

  const response = await api.delete(`/vendors/${uuid}/services/${service_id}`);

  const data = await response.data;

  return data;
}

export async function VendorTourMedia(uuid: string) {

  const response = await api.get(`/vendor/tour-media-settings?vendor_uuid=${uuid}`);

  const data = await response.data;

  return data;
}

export const connectGoogleCalendar = async () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  try {
    const response = await api.get(`${API_URL}/vendor/calendar/connect`);

    const data = await response.data;
    return data;
  } catch (error) {
    console.error('Failed to connect calendar:', error);
    return error;
  }
};
export const VerifyGoogleCalendar = async (body: { state: string, code: string }) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  try {
    const response = await api.post(`${API_URL}/auth/google/callback`, body);

    const data = await response.data;
    return data;
  } catch (error) {
    console.error('Failed to verify calendar:', error);
    return error;
  }
};
