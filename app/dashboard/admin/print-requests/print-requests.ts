import { api } from "@/lib/api";

export interface PrintRequest {
  uuid: string;
  status: "Pending" | "Processing" | "Completed" | "Cancelled";
  copies: number;
  option_id?: string;
  amount?: number;
  with_bleed: boolean;
  additional_info: string;
  is_read?: boolean;
  read_at?: string;
  agent_read?: boolean;
  agent_read_at?: string;
  payment_status?: "PAID" | "UNPAID";
  order_uuid?: string;
  order_number?: number | string;
  invoice_uuid?: string;
  invoice_number?: string;
  invoice?: any;
  order?: any;
  created_at: string;
  agent: {
    first_name: string;
    last_name: string;
    uuid: string;
    email: string;
    phone?: string;
  };
  property: {
    address: string;
    uuid: string;
  };
  feature_sheet: {
    template_key: string;
    uuid: string;
    order_id?: string;
    order?: {
      id?: number;
      uuid?: string;
      order_id?: string;
      property_address?: string;
      payment_status?: string;
      status?: string;
    };
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

export async function GetPrintRequestsUnreadCount(): Promise<number> {
  try {
    const response = await api.get(`/admin/print-requests/unread-count`);
    return response.data?.unread_count ?? 0;
  } catch (error) {
    console.error("Failed to fetch print requests unread count:", error);
    return 0;
  }
}

export async function GetPrintRequestInvoice(uuid: string) {
  try {
    const response = await api.get(`/admin/print-requests/${uuid}/invoice`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch print request invoice:", error);
    throw error;
  }
}

export async function MarkPrintRequestAsRead(uuid: string) {
  try {
    const response = await api.patch(`/admin/print-requests/${uuid}/read`);
    return response.data;
  } catch (error) {
    console.error("Failed to mark print request as read:", error);
    throw error;
  }
}

export async function MarkAllPrintRequestsAsRead() {
  try {
    const response = await api.post(`/admin/print-requests/mark-all-read`);
    return response.data;
  } catch (error) {
    console.error("Failed to mark all print requests as read:", error);
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
