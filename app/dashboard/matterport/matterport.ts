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
  orders: OrderApi;
  links?: TourLinkApi[];
}
export enum MatterportStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum MatterportRenewalAction {
  RENEW = "RENEW",
}
export interface MatterportAd {
  agentName: string;
  orderNumber: `#${string}`; // enforces #0001 format
  propertyuuid: string;
  orderuud: string;
  address: string;
  reminderDate: string; // formatted date string
  renewalDate: string; // formatted date string
  status: MatterportStatus;
  renewal: MatterportRenewalAction;
  organizationName?: string;
  organizationId?: number;
  brandedLink?: string;
  unbrandedLink?: string;
}

export async function GetMatterPort(token: string) {

  try {
    const response = await api.get(`/matterport`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
    });

    if (response.status !== 200) {
      throw new Error(response.data.message || `Request failed with status ${response.status}`);
    }

    const adminData = await response.data;
    return adminData;
  } catch (error) {
    console.error("Failed to fetch admin data:", error);
    throw error;
  }
}

export const mapMatterportApiToAd = (
  api: MatterportApiResponse
): MatterportAd => {
  const org = (api.orders as any)?.organization;
  
  // Find branded and unbranded links in the tour links array
  const brandedLinkObj = api.links?.find((l) => l.type === "branded");
  const unbrandedLinkObj = api.links?.find((l) => l.type === "unbranded");
  
  const actualExpiry = brandedLinkObj?.expiry_date || unbrandedLinkObj?.expiry_date;
  
  let formattedExpiry = "";
  if (actualExpiry) {
    formattedExpiry = new Date(actualExpiry).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } else {
    // If no expiry exists, default to 90 days from the Tour creation date (api.created_at)
    const baseDate = api.created_at ? new Date(api.created_at) : new Date();
    const defaultExpiry = new Date(baseDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    formattedExpiry = defaultExpiry.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }) + " (Default 90 days)";
  }

  return {
    agentName: `${api.orders.agent?.first_name ?? "N/A"} ${api.orders.agent?.last_name ?? ""}`.trim(),
    orderNumber: `#${api.orders.id}`,
    orderuud: api.orders.uuid,
    propertyuuid: api.orders.property.uuid,
    address: `${api.orders.property_address}, ${api.orders.property_location}`,
    organizationName: org?.name || "Global / None",
    organizationId: org?.id ?? undefined,
    reminderDate: new Date(api.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    renewalDate: formattedExpiry,
    status:
      api.orders.payment_status === "PAID"
        ? MatterportStatus.ACTIVE
        : MatterportStatus.INACTIVE,
    renewal: MatterportRenewalAction.RENEW,
    brandedLink: brandedLinkObj?.link,
    unbrandedLink: unbrandedLinkObj?.link,
  };
};
