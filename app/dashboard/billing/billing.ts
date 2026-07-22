import { api } from "@/lib/api";

export interface ServiceInvoices {
  invoice_url: string;
  amount: number;
  payment_method: string;
  paid_at: string;
  session_id: string;
  payment_id: string | null;
  status: string;
}

export interface ServiceItem {
  service_id: number;
  service_name: string;
  amount: number;
  status: string;
  related_invoices: ServiceInvoices[];
  order_service_uuid: string;
  uuid?: string;
}

export interface OrderSlots {
  slot_date: string;
  start_time: string;
  end_time: string;
  address: string;
  location: string;
  vendor_id: number;
  vendor_name: string;
  vendor_uuid: string;
}

export interface OrderInvoice {
  invoice_url: string;
  payment_id: string | null;
  amount: number;
  payment_method: string;
  status: string;
  paid_at: string;
  session_id: string;
  service_ids: number;
  payment_done_by: string;
}

export interface BillingItem {
  order_id: number;
  order_uuid: string;
  agent_name: string | null;
  agent_uuid: string | null;
  total_amount: number;
  total_paid: number;
  remaining_amount: number;
  status: string;
  services: ServiceItem[];
  slots: OrderSlots[];
  invoices: OrderInvoice[]; // Added this field
  last_payment_date?: string | null;
  session_created_at?: string | null;
  property_address?: string;
  property_location?: string;
  created_at: string;
  organization?: { id: number; name: string } | null;
  organization_id?: number | null;
}

export const getBillings = async (): Promise<BillingItem[]> => {
  const res = await api.get(`/billing`);

  if (res.status !== 200) throw new Error("Failed to fetch billing data");

  const json = await res.data;
  return json.data as BillingItem[];
};

export async function createQuickBilling(
  order_uuid: number,
  url: string,
  agent_uuid: string,
  amount: number,
  options?: {
    serviceId?: string;
    paymentType?: "full" | "service";
    serviceName?: string;
  }
) {
  try {

    let description = "Payment for voice service";
    if (options?.paymentType === "service" && options?.serviceName) {
      description = `Payment for ${options.serviceName} service`;
    } else if (options?.paymentType === "full") {
      description = `Full payment for Order #${order_uuid}`;
    }

    const body = {
      agent_uuid,
      url,
      amount: amount,
      currency: "USD",
      order_id: order_uuid,
      description: description,
      service_id: options?.serviceId || null,
      payment_type: options?.paymentType || "full",
    };

    const response = await api.post(`/agent/pay/create-session`, body);

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    const data = await response.data;

    if (data.success && data.url) {
      window.open(data.url, "_blank");
    } else {
      throw new Error(data.message || "Failed to create payment session");
    }
  } catch (error) {
    console.error("Payment Error:", error);
    alert("Something went wrong while creating payment. Please try again.");
  }
}

export const isVoidOrCancelled = (status?: string) => {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === "void" || s === "cancelled" || s === "canceled";
};

export const isPaidOrSucceeded = (status?: string) => {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === "paid" || s === "succeeded";
};

export const isRefunded = (status?: string) => {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === "refunded" || s === "refund" || s === "partially_refunded";
};

export function getBestTargetInvoice(invoicesList: any[], serviceUuid?: string) {
  if (!Array.isArray(invoicesList) || invoicesList.length === 0) {
    return null;
  }

  // 1. If serviceUuid is provided: filter invoices containing this service
  if (serviceUuid) {
    const serviceInvoices = invoicesList.filter((inv: any) =>
      inv.items?.some((i: any) => {
        const sUuid = i.order_service?.uuid || i.orderService?.uuid;
        const sId = i.order_service_id || i.order_service?.id || i.orderService?.id;
        return sUuid === serviceUuid || sId?.toString() === serviceUuid;
      })
    );

    if (serviceInvoices.length > 0) {
      const activeServiceInvoices = serviceInvoices.filter((inv: any) => !isVoidOrCancelled(inv.status));
      if (activeServiceInvoices.length > 0) {
        // Prefer individual service invoice over consolidated invoice for service-level view
        const individual = activeServiceInvoices.find((inv: any) => !inv.notes?.toLowerCase().includes("consolidated"));
        if (individual) return individual;
        return activeServiceInvoices[0];
      }
    }
  }

  // 2. Order-level (main order invoice): filter out void/cancelled invoices
  const activeInvoices = invoicesList.filter((inv: any) => !isVoidOrCancelled(inv.status));

  if (activeInvoices.length > 0) {
    // Priority 1: Consolidated invoice (the main full-order invoice)
    const consolidated = activeInvoices.find((inv: any) => inv.notes?.toLowerCase().includes("consolidated"));
    if (consolidated) return consolidated;

    // Priority 2: Cancellation fee invoice
    const cancellation = activeInvoices.find((inv: any) => 
      inv.notes?.toLowerCase().includes("cancellation fee") || 
      inv.items?.some((i: any) => i.description?.toLowerCase().includes("cancellation fee"))
    );
    if (cancellation) return cancellation;

    // Priority 3: Primary agent invoice
    const primary = activeInvoices.find((inv: any) => inv.agent_type === "primary" || !inv.split_details);
    if (primary) return primary;

    // Fallback: first active invoice
    return activeInvoices[0];
  }

  return null;
}

