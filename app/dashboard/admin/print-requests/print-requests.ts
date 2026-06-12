import { api } from "@/lib/api";

export interface PrintRequest {
  uuid: string;
  status: "Pending" | "Processing" | "Completed" | "Cancelled";
  copies: number;
  with_bleed: boolean;
  additional_info: string;
  created_at: string;
  agent: {
    first_name: string;
    last_name: string;
    uuid: string;
    email: string;
  };
  property: {
    address: string;
    uuid: string;
  };
  feature_sheet: {
    template_key: string;
    uuid: string;
    order_id?: string;
  };
}

export async function GetPrintRequests() {
  try {
    const response = await api.get(`/admin/print-requests`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch print requests:", error);
    throw error;
  }
}

export async function UpdatePrintRequestStatus(uuid: string, status: string) {
  try {
    const response = await api.patch(`/admin/print-requests/${uuid}`, { status });
    return response.data;
  } catch (error) {
    console.error("Failed to update print request status:", error);
    throw error;
  }
}
