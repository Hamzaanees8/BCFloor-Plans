import { ListingsPayload } from "../listings/listing";

export interface OrderPayload {
  agent_id: string;
  property_id: string;
  amount: number;
  order_status: "Processing" | "Completed" | "Cancelled" | string;
  payment_status: "UNPAID" | "PAID" | string;
  split_invoice: number;
  co_agents: {
    name: string;
    email: string;
    percentage?: number;
  }[];
  notes: AgentNote[];
  services: OrderServiceItem[];
  discounts: {
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
  is_add_service?: number;
}
export interface EditOrderPayload {
  order_status?: "Processing" | "Completed" | "Cancelled" | string;
  payment_status?: "UNPAID" | "PAID" | string;
  lock_materials?: boolean,
  property_website?: string,
  mls_property?: string,
  vendor_uuid?: string,

}
export interface OrderServiceItem {
  uuid?: string; // Order service UUID (for updates)
  service_id: string;
  option_id?: string;
  amount: number;
  custom?: string;
}
type AgentNote = {
  note: string;
  name: string;
  date: string;
  internal?: string;
};
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
          key === "slots"
        ) {
          Object.entries(item).forEach(([subKey, subVal]) => {
            if (subVal !== undefined && subVal !== null) {
              formData.append(`${key}[${index}][${subKey}]`, String(subVal));
            }
          });
        } else {
          // ✅ Handles notes and any other string array like notes[0], notes[1]
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
function EditOrderPayloadToFormData(payload: EditOrderPayload): FormData {
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
          key === "slots"
        ) {
          Object.entries(item).forEach(([subKey, subVal]) => {
            if (subVal !== undefined && subVal !== null) {
              formData.append(`${key}[${index}][${subKey}]`, String(subVal));
            }
          });
        } else {
          // ✅ Handles notes and any other string array like notes[0], notes[1]
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

export async function Create(payload: OrderPayload, token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const formData = payloadToFormData(payload);

  const response = await fetch(`${API_URL}/orders`, {
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
export async function EditOrderStatus(
  orderId: string,
  payload: EditOrderPayload,
  token: string
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const formData = EditOrderPayloadToFormData(payload);

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

export async function UpdateOrderService(
  orderUuid: string,
  services: OrderServiceItem[],
  token: string
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const formData = new FormData();
  formData.append('_method', 'PUT');

  const hasNewService = services.some(service => !service.uuid);
  if (hasNewService) {
    formData.append('is_add_service', '1');
  }

  services.forEach((service, index) => {
    formData.append(`services[${index}][service_id]`, service.service_id);
    if (service.option_id) {
      formData.append(`services[${index}][option_id]`, service.option_id);
    }
    formData.append(`services[${index}][amount]`, String(service.amount));
    if (service.uuid) {
      formData.append(`services[${index}][uuid]`, service.uuid);
    }
  });

  const response = await fetch(`${API_URL}/orders/${orderUuid}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Failed to update service');
    (error as FetchErrors).errors = data.errors;
    throw error;
  }

  return data;
}

export async function Get(token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const OrderData = await response.json();

    if (!response.ok) {
      throw new Error(
        OrderData.message || `Request failed with status ${response.status}`
      );
    }

    return OrderData;
  } catch (error) {
    console.error("Failed to fetch Order data:", error);
    throw error;
  }
}

export async function GetUser(token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${API_URL}/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const UserData = await response.json();

    if (!response.ok) {
      throw new Error(
        UserData.message || `Request failed with status ${response.status}`
      );
    }

    return UserData;
  } catch (error) {
    console.error("Failed to fetch User data:", error);
    throw error;
  }
}

export interface UpdateSubAccountPayload {
  status?: boolean;
}

export async function GetOne(token: string, orderId: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: "GET",
      cache: "no-store",
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
export async function Delete(orderId: string, token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ _method: "DELETE" }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete order");
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

    return rolesData;
  } catch (error) {
    console.error("Failed to fetch role data:", error);
    throw error;
  }
}
export async function ResetPasswordSubAccount(
  payload: ResetPassword,
  orderId: string,
  token: string
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/orders/${orderId}/password`, {
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
export async function GetVendors(token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${API_URL}/vendors`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const OrderData = await response.json();

    if (!response.ok) {
      throw new Error(
        OrderData.message || `Request failed with status ${response.status}`
      );
    }

    return OrderData;
  } catch (error) {
    console.error("Failed to fetch vendor data:", error);
    throw error;
  }
}

export async function GetOneOrder(token: string, uuid: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${API_URL}/orders/${uuid}`, {
      method: "GET",
      cache: "no-store",
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
export async function CreateListings(payload: ListingsPayload, token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/orders/add/properties`, {
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
export async function EditListings(
  uuid: string,
  payload: ListingsPayload,
  token: string
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const updatedPayload = {
    ...payload,
    _method: "PUT",
  };

  const response = await fetch(`${API_URL}/orders/edit/properties/${uuid}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedPayload),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    (error as FetchErrors).errors = data.errors;
    throw error;
  }

  return data;
}




export interface TwilightResponse {
  address: string;
  coordinates: { latitude: number; longitude: number };
  date: string;
  sunrise: string;
  sunset: string;
  civil_twilight_begin: string;
  civil_twilight_end: string;
  nautical_twilight_begin: string;
  nautical_twilight_end: string;
}

export async function fetchTwilightTime(address: string, date: string): Promise<TwilightResponse | null> {
  const API_KEY = process.env.NEXT_PUBLIC_PLACES_API_KEY;

  try {
    const geocodeRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`
    );
    const geoData = await geocodeRes.json();

    if (!geoData.results.length) throw new Error(`No geocode results found for address: ${address}`);

    const { lat, lng } = geoData.results[0].geometry.location;

    const twilightRes = await fetch(
      `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&date=${date}&formatted=0`
    );

    const twilightData = await twilightRes.json();

    if (twilightData.status !== "OK") throw new Error("Failed to fetch twilight data");

    const result = twilightData.results;

    return {
      address,
      coordinates: { latitude: lat, longitude: lng },
      date,
      sunrise: result.sunrise,
      sunset: result.sunset,
      civil_twilight_begin: result.civil_twilight_begin,
      civil_twilight_end: result.civil_twilight_end,
      nautical_twilight_begin: result.nautical_twilight_begin,
      nautical_twilight_end: result.nautical_twilight_end,
    };
  } catch (error) {
    console.error("Error fetching twilight data:", error);
    return null;
  }
}

export function formatTwilightTime(utcTime: string, timeZone: string): string {
  if (!utcTime) return "—";
  try {
    // Ensure the time string is treated as UTC if it doesn't specify an offset
    // The API returns "YYYY-MM-DDTHH:mm:ss+00:00" which is already ISO specific
    const date = new Date(utcTime);

    // Use Intl.DateTimeFormat for robust timezone handling
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch (error) {
    console.error("Error formatting twilight time:", error);
    return "Invalid time";
  }
}


export interface Coordinate {
  lat: number;
  lng: number;
}

export interface PropertyLocation {
  lat: number;
  lng: number;
  timeZoneId: string;
  timeZoneName: string;
}

export async function getPropertyTimezone(address: string): Promise<PropertyLocation | null> {
  try {
    const API_KEY = process.env.NEXT_PUBLIC_PLACES_API_KEY;
    if (!API_KEY) throw new Error('Google Maps API key is missing');

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`;

    const geoRes = await fetch(geocodeUrl);
    const geoData = await geoRes.json();

    if (geoData.status !== 'OK' || !geoData.results?.length) {
      console.error('Geocoding failed:', geoData.status, geoData.error_message);
      return null;
    }

    const location = geoData.results[0].geometry.location;

    const timestamp = Math.floor(Date.now() / 1000);
    const timezoneUrl = `https://maps.googleapis.com/maps/api/timezone/json?location=${location.lat},${location.lng}&timestamp=${timestamp}&key=${API_KEY}`;

    const tzRes = await fetch(timezoneUrl);
    const tzData = await tzRes.json();

    if (tzData.status !== 'OK') {
      console.error('Timezone API failed:', tzData.status, tzData.errorMessage);
      return null;
    }

    return {
      lat: location.lat,
      lng: location.lng,
      timeZoneId: tzData.timeZoneId,
      timeZoneName: tzData.timeZoneName,
    };
  } catch (err) {
    console.error('Error fetching property timezone:', err);
    return null;
  }
}


export function convertTimeToUTC(date: string, time: string, fromTimezone: string): string {
  const timeParts = time.split(':');
  const normalizedTime = timeParts.length === 2 ? `${time}:00` : time;

  const [year, month, day] = date.split('-');
  const [hour, minute, second] = normalizedTime.split(':');


  const utcReferenceDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second)));

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: fromTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(utcReferenceDate);
  const partsMap: Record<string, string> = {};
  parts.forEach(part => {
    if (part.type !== 'literal') {
      partsMap[part.type] = part.value;
    }
  });

  const displayedInTZ = new Date(
    parseInt(partsMap.year),
    parseInt(partsMap.month) - 1,
    parseInt(partsMap.day),
    parseInt(partsMap.hour),
    parseInt(partsMap.minute),
    parseInt(partsMap.second)
  );

  const desired = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  );

  const offset = desired.getTime() - displayedInTZ.getTime();

  const correctUTC = new Date(utcReferenceDate.getTime() + offset);

  return correctUTC.toISOString();
}


export function convertUTCToTimezone(utcTime: string, toTimezone: string): string {
  const date = new Date(utcTime);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: toTimezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return formatter.format(date);
}


export function convertVendorWorkHoursToPropertyTimezone(
  date: string,
  workHours: {
    start_time?: string;
    end_time?: string;
    break_start?: string;
    break_end?: string;
    work_days?: {
      day: string;
      start_time: string;
      end_time: string;
      is_off: string | number | boolean;
      is_twilight: string | number | boolean;
    }[];
  },
  vendorTimezone: string,
  propertyTimezone: string
): {
  start_time?: string;
  end_time?: string;
  break_start?: string;
  break_end?: string;
  work_days?: {
    day: string;
    start_time: string;
    end_time: string;
    is_off: string | number | boolean;
    is_twilight: string | number | boolean;
  }[];
} {
  if (vendorTimezone === propertyTimezone) {
    return workHours;
  }

  const converted: typeof workHours = { ...workHours };

  if (workHours.start_time) {
    const utcTime = convertTimeToUTC(date, workHours.start_time, vendorTimezone);
    converted.start_time = convertUTCToTimezone(utcTime, propertyTimezone);
  }

  if (workHours.end_time) {
    const utcTime = convertTimeToUTC(date, workHours.end_time, vendorTimezone);
    converted.end_time = convertUTCToTimezone(utcTime, propertyTimezone);
  }

  if (workHours.break_start) {
    const utcTime = convertTimeToUTC(date, workHours.break_start, vendorTimezone);
    converted.break_start = convertUTCToTimezone(utcTime, propertyTimezone);
  }

  if (workHours.break_end) {
    const utcTime = convertTimeToUTC(date, workHours.break_end, vendorTimezone);
    converted.break_end = convertUTCToTimezone(utcTime, propertyTimezone);
  }

  if (workHours.work_days && Array.isArray(workHours.work_days)) {
    converted.work_days = workHours.work_days.map(day => {
      const isDayOff = day.is_off === '1' || day.is_off === 1 || day.is_off === true;
      if (isDayOff) {
        return day;
      }

      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const targetDayIndex = dayNames.indexOf(day.day.toLowerCase());
      const currentDate = new Date(date);
      const currentDayIndex = currentDate.getDay();

      let daysDiff = targetDayIndex - currentDayIndex;
      if (daysDiff < 0) {
        daysDiff += 7;
      }

      const dayDate = new Date(currentDate);
      dayDate.setDate(currentDate.getDate() + daysDiff);
      const dayDateStr = dayDate.toISOString().split('T')[0];

      const startUtc = convertTimeToUTC(dayDateStr, day.start_time, vendorTimezone);
      const endUtc = convertTimeToUTC(dayDateStr, day.end_time, vendorTimezone);

      const convertedStartTime = convertUTCToTimezone(startUtc, propertyTimezone);
      const convertedEndTime = convertUTCToTimezone(endUtc, propertyTimezone);

      return {
        ...day,
        start_time: convertedStartTime,
        end_time: convertedEndTime,
      };
    });
  }

  return converted;
}

export async function SyncToMls(
  tourId: string,
  payload: { file_ids: number[] },
  token: string
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/tours/${tourId}/sync-mls`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "MLS Sync failed");
    (error as FetchErrors).errors = data.errors;
    throw error;
  }

  return data;
}
