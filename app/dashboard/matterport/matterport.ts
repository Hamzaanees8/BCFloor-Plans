import { api } from "@/lib/api";

// --- API Types ---
export interface SlideShowSettings {
  slide_delay: string;
  transitions: string;
  background_audio: string;
  auto_play: "0" | "1";
  video_overlay: "0" | "1";
}

export interface OrderApi {
  id: number;
  agent: {
    id: number;
    first_name: string;
    last_name: string;
    uuid: string;
    avatar_url: string | null;
    company_banner_url: string | null;
    company_logo_url: string | null;
  };
  uuid: string;
  property_id: number;
  property: {
    id: number;
    uuid: string;
    address: string;
  };
  agent_id: number | null;
  property_address: string;
  property_location: string;
  amount: string;
  payment_status: "PAID" | "PENDING" | "FAILED";
  order_status: string;
  created_at: string;
  updated_at: string;
}

export interface TourLinkApi {
  id: number;
  uuid: string;
  tour_id: number;
  type: string;
  service_id: number | null;
  link: string;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatterportApiResponse {
  id: number;
  uuid: string;
  order_id: number;
  slide_show: SlideShowSettings;
  created_at: string;
  updated_at: string;
  orders?: OrderApi;
  order?: OrderApi;
  links?: TourLinkApi[];
}
export enum MatterportStatus {
  ACTIVE = "ACTIVE",
  EXPIRING_SOON = "EXPIRING_SOON",
  EXPIRED = "EXPIRED",
  INACTIVE = "INACTIVE",
}

export enum MatterportRenewalAction {
  RENEW = "RENEW",
}

export interface RenewalPlan {
  id: string;
  months: number;
  label: string;
  price: number;
}

export interface MatterportAd {
  tourUuid: string;
  tourId: number;
  agentName: string;
  agentEmail?: string;
  orderNumber: `#${string}` | string;
  propertyuuid: string;
  orderuud: string;
  address: string;
  reminderDate: string;
  renewalDate: string;
  rawExpiryDate: string | null;
  daysRemaining: number | null;
  status: MatterportStatus;
  renewal: MatterportRenewalAction;
  organizationName?: string;
  organizationId?: number;
  brandedLink?: string;
  unbrandedLink?: string;
  propertyThumbnail?: string;
}

export async function GetMatterPort(token: string, status = "all", search = "") {
  try {
    const params = new URLSearchParams();
    if (status && status !== "Show All" && status !== "all") {
      params.append("status", status.toLowerCase());
    }
    if (search) {
      params.append("search", search);
    }

    const response = await api.get(`/matterport?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status !== 200) {
      throw new Error(response.data.message || `Request failed with status ${response.status}`);
    }

    return response.data;
  } catch (error) {
    console.error("Failed to fetch admin data:", error);
    throw error;
  }
}

export async function RenewMatterport(
  token: string,
  tourUuid: string,
  payload: {
    duration_months: number;
    amount: number;
    payment_method: string;
    notes?: string;
  }
) {
  try {
    const response = await api.post(`/matterport/${tourUuid}/renew`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to renew Matterport hosting:", error);
    throw error;
  }
}

export async function SendRenewalReminder(token: string, tourUuid: string) {
  try {
    const response = await api.post(`/matterport/${tourUuid}/send-reminder`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to send renewal reminder:", error);
    throw error;
  }
}

export const mapMatterportApiToAd = (
  apiItem: any
): MatterportAd => {
  const orderObj = apiItem.orders || apiItem.order;
  const org = orderObj?.organization;
  
  // Find branded and unbranded links in the tour links array
  const brandedLinkObj = apiItem.links?.find((l: any) => l.type === "branded");
  const unbrandedLinkObj = apiItem.links?.find((l: any) => l.type === "unbranded");
  
  const actualExpiry = apiItem.computed_expiry_date || brandedLinkObj?.expiry_date || unbrandedLinkObj?.expiry_date;
  
  let formattedExpiry = "N/A";
  let rawExpiry: string | null = null;

  if (actualExpiry) {
    rawExpiry = actualExpiry;
    formattedExpiry = new Date(actualExpiry).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } else if (apiItem.created_at) {
    const baseDate = new Date(apiItem.created_at);
    const defaultExpiry = new Date(baseDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    rawExpiry = defaultExpiry.toISOString().split("T")[0];
    formattedExpiry = defaultExpiry.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }

  // Calculate days remaining and hosting status
  let daysRemaining: number | null = apiItem.days_remaining ?? null;
  if (daysRemaining === null && rawExpiry) {
    const expiryTime = new Date(rawExpiry).setHours(0, 0, 0, 0);
    const nowTime = new Date().setHours(0, 0, 0, 0);
    daysRemaining = Math.round((expiryTime - nowTime) / (1000 * 60 * 60 * 24));
  }

  let status = MatterportStatus.ACTIVE;
  if (apiItem.hosting_status) {
    status = apiItem.hosting_status as MatterportStatus;
  } else if (daysRemaining !== null) {
    if (daysRemaining < 0) {
      status = MatterportStatus.EXPIRED;
    } else if (daysRemaining <= 30) {
      status = MatterportStatus.EXPIRING_SOON;
    } else {
      status = MatterportStatus.ACTIVE;
    }
  }

  return {
    tourUuid: apiItem.uuid,
    tourId: apiItem.id,
    agentName: `${orderObj?.agent?.first_name ?? "N/A"} ${orderObj?.agent?.last_name ?? ""}`.trim(),
    agentEmail: orderObj?.agent?.email,
    orderNumber: orderObj?.id ? `#${orderObj.id}` : "",
    orderuud: orderObj?.uuid ?? "",
    propertyuuid: orderObj?.property?.uuid ?? "",
    address: orderObj ? `${orderObj.property_address || ""}, ${orderObj.property_location || ""}`.trim() : "N/A",
    organizationName: org?.name || "Global / None",
    organizationId: org?.id ?? undefined,
    reminderDate: apiItem.created_at ? new Date(apiItem.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }) : "N/A",
    renewalDate: formattedExpiry,
    rawExpiryDate: rawExpiry,
    daysRemaining: daysRemaining,
    status: status,
    renewal: MatterportRenewalAction.RENEW,
    brandedLink: brandedLinkObj?.link,
    unbrandedLink: unbrandedLinkObj?.link,
  };
};

