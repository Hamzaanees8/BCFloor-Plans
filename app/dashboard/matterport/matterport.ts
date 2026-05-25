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

export interface MatterportApiResponse {
  id: number;
  uuid: string;
  order_id: number;
  slide_show: SlideShowSettings;
  created_at: string;
  updated_at: string;
  orders: OrderApi;
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
  return {
    agentName: `${api.orders.agent?.first_name ?? "N/A"} ${api.orders.agent?.last_name ?? ""
      }`.trim(),
    orderNumber: `#${api.orders.id}`,
    orderuud: api.orders.uuid,
    propertyuuid: api.orders.property.uuid,
    address: `${api.orders.property_address}, ${api.orders.property_location}`,
    organizationName: org?.name || "Global / None",
    organizationId: org?.id ?? undefined,
    reminderDate: new Date(
      new Date(api.updated_at).setDate(new Date(api.updated_at).getDate())
    ).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),

    renewalDate: new Date(
      new Date(api.updated_at).setDate(new Date(api.updated_at).getDate() + 10)
    ).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    status:
      api.orders.payment_status === "PAID"
        ? MatterportStatus.ACTIVE
        : MatterportStatus.INACTIVE,
    renewal: MatterportRenewalAction.RENEW,
  };
};
