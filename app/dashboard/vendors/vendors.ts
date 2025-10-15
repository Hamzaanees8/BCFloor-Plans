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
  vendor_id?: number
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
export interface WorkHours {
  start_time: string;
  end_time: string;
  work_days: string[];
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
  services?: VendorService[];
  addresses?: VendorAddress[];
  work_hours?: WorkHours;
  coordinates?: string;
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
// function payloadToFormData(payload: VendorPayload): FormData {
//   const formData = new FormData();

//   Object.entries(payload).forEach(([key, value]) => {
//     if (value !== undefined && value !== null) {
//       if (value instanceof File) {
//         formData.append(key, value);
//       } else if (Array.isArray(value)) {
//         if (key === "co_agents") {
//           value.forEach((agent, index) => {
//             formData.append(`${key}[${index}][name]`, agent.name);
//             formData.append(`${key}[${index}][email]`, agent.email);
//             formData.append(
//               `${key}[${index}][primary_phone]`,
//               agent.primary_phone
//             );
//           });
//         } else {
//           value.forEach((val) => {
//             formData.append(key + "[]", val);
//           });
//         }
//       } else if (typeof value === "object") {
//         formData.append(key, JSON.stringify(value));
//       } else {
//         formData.append(key, value);
//       }
//     }
//   });

//   return formData;
// }
function payloadToFormData(payload: VendorPayload): FormData {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (value instanceof File) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      if (key === "addresses") {
        value.forEach((address, index) => {
          Object.entries(address).forEach(([k, v]) => {
            formData.append(
              `${key}[${index}][${k}]`,
              v !== null && v !== undefined ? String(v) : ""
            );
          });
        });
      } else if (key === "services") {
        value.forEach((service, index) => {
          formData.append(
            `${key}[${index}][service_id]`,
            String(service.service_id)
          );
          formData.append(
            `${key}[${index}][hourly_rate]`,
            String(service.hourly_rate)
          );
          formData.append(
            `${key}[${index}][time_needed]`,
            String(service.time_needed)
          );
        });
      } else if (key === "coordinates") {
        formData.append(key, JSON.stringify(value));

      }
    } else if (typeof value === "object") {
      if (key === "work_hours") {
        Object.entries(value).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            v.forEach((val) => {
              formData.append(`${key}[${k}][]`, String(val));
            });
          } else {
            formData.append(
              `${key}[${k}]`,
              v !== null && v !== undefined ? String(v) : ""
            );
          }
        });
      } else if (key === "company") {
        Object.entries(value).forEach(([k, v]) => {
          if (v instanceof File) {
            formData.append(`${key}[${k}]`, v);
          } else if (v !== null && v !== undefined) {
            formData.append(`${key}[${k}]`, String(v));
          }
        });
      } else if (key === "settings") {
        Object.entries(value).forEach(([k, v]) => {
          formData.append(`${key}[${k}]`, String(v));
        });
      } else {
        // fallback — stringify non-File, non-special objects
        formData.append(key, JSON.stringify(value));
      }
    } else {
      formData.append(key, String(value));
    }
  });

  return formData;
}

export async function Create(payload: VendorPayload, token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const formData = payloadToFormData(payload);

  const response = await fetch(`${API_URL}/vendors`, {
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
  payload: VendorPayload,
  token: string
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const formData = payloadToFormData(payload);

  const response = await fetch(`${API_URL}/vendors/${userId}`, {
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
    const response = await fetch(`${API_URL}/vendors`, {
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
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/vendors/${userId}/status`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update vendor");
  }

  return data;
}

export async function GetOne(token: string, userId: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${API_URL}/vendors/${userId}`, {
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
    console.error("Failed to fetch vendor data:", error);
    throw error;
  }
}
export async function Delete(userId: string, token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/vendors/${userId}`, {
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

export async function ResetPasswordVendor(
  payload: ResetPassword,
  userId: string,
  token: string
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/vendors/${userId}/password`, {
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

    const adminData = await response.json();
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

export const connectStripe = async (token: string): Promise<StripeConnectResponse> => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${API_URL}/vendor/stripe/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },

    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      url: data.url, // If API returns redirect URL
      message: data.message,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Stripe connect error:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect Stripe',
    };
  }
};