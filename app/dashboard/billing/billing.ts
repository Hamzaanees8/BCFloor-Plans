import { api } from "@/lib/api";
import { isUserCoAgent } from "@/lib/permissions";

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
  service_id?: number;
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
  total_refunded?: number;
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
  return s === "refunded" || s === "refund";
};

export const isPartiallyRefunded = (status?: string) => {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === "partially_refunded" || s === "partial_refunded";
};

export function getBestTargetInvoice(
  invoicesList: any[],
  serviceUuid?: string,
  serviceId?: number | string,
  userInfo?: any,
  userType?: string | null,
) {
  if (!Array.isArray(invoicesList) || invoicesList.length === 0) {
    return null;
  }

  const isCoAgent = userType === "agent" && isUserCoAgent(userInfo, userType);
  const userUuid = userInfo?.data?.uuid || userInfo?.uuid;
  const userEmail = userInfo?.data?.email || userInfo?.email;

  // 1. If serviceUuid or serviceId is provided: filter invoices containing this service
  if (serviceUuid || serviceId != null) {
    const serviceInvoices = invoicesList.filter((inv: any) =>
      inv.items?.some((i: any) => {
        const sUuid = i.order_service?.uuid || i.orderService?.uuid;
        const sId = i.order_service_id || i.order_service?.id || i.orderService?.id;
        const svcId =
          i.order_service?.service_id ||
          i.order_service?.service?.id ||
          i.orderService?.service_id ||
          i.orderService?.service?.id ||
          i.service_id;

        return (
          (serviceUuid &&
            (sUuid === serviceUuid ||
              sId?.toString() === serviceUuid ||
              (svcId != null && svcId.toString() === serviceUuid))) ||
          (serviceId != null &&
            (svcId === serviceId ||
              svcId?.toString() === serviceId.toString() ||
              sId === serviceId ||
              sId?.toString() === serviceId.toString()))
        );
      }),
    );

    if (serviceInvoices.length > 0) {
      const activeServiceInvoices = serviceInvoices.filter((inv: any) => !isVoidOrCancelled(inv.status));
      const pool = activeServiceInvoices.length > 0 ? activeServiceInvoices : serviceInvoices;

      if (isCoAgent) {
        const coAgentInv = pool.find((inv: any) =>
          inv.agent_type === "co-agent" ||
          (userUuid && (inv.agent?.uuid === userUuid || inv.agent_uuid === userUuid)) ||
          (userEmail && inv.agent?.email === userEmail)
        );
        if (coAgentInv) return coAgentInv;
      } else {
        const primaryInv = pool.find((inv: any) =>
          inv.agent_type === "primary" ||
          (userUuid && (inv.agent?.uuid === userUuid || inv.agent_uuid === userUuid)) ||
          !inv.split_details
        );
        if (primaryInv) return primaryInv;
      }

      // Prefer individual service invoice over consolidated invoice for service-level view
      const individual = pool.find((inv: any) => !inv.notes?.toLowerCase().includes("consolidated"));
      if (individual) return individual;
      return pool[0];
    }
  }

  // 2. Fallback: select the best overall invoice for the order
  const activeInvoices = invoicesList.filter((inv: any) => !isVoidOrCancelled(inv.status));
  const pool = activeInvoices.length > 0 ? activeInvoices : invoicesList;

  if (isCoAgent) {
    const coAgentInv = pool.find((inv: any) =>
      inv.agent_type === "co-agent" ||
      (userUuid && (inv.agent?.uuid === userUuid || inv.agent_uuid === userUuid)) ||
      (userEmail && inv.agent?.email === userEmail)
    );
    if (coAgentInv) return coAgentInv;
  } else {
    // If Primary Agent or Admin is looking at the order, prioritize primary agent invoice
    const primaryInv = pool.find((inv: any) =>
      inv.agent_type === "primary" ||
      (userUuid && (inv.agent?.uuid === userUuid || inv.agent_uuid === userUuid)) ||
      (userEmail && inv.agent?.email === userEmail)
    );
    if (primaryInv) return primaryInv;
  }

  // Priority 1: Consolidated invoice (standard comprehensive overview)
  const consolidated = pool.find((inv: any) => 
    inv.notes?.toLowerCase().includes("consolidated") || 
    (inv.items?.length > 1 && !inv.split_details)
  );
  if (consolidated) return consolidated;

  // Priority 2: Cancellation fee invoice
  const cancellation = pool.find((inv: any) => 
    inv.notes?.toLowerCase().includes("cancellation fee") || 
    inv.items?.some((i: any) => i.description?.toLowerCase().includes("cancellation fee"))
  );
  if (cancellation) return cancellation;

  // Priority 3: Primary agent invoice
  const primary = pool.find((inv: any) => inv.agent_type === "primary" || !inv.split_details);
  if (primary) return primary;

  // Fallback: first active invoice
  return pool[0] || null;
}

export function prepareOrderInvoicePreview(
  invoicesList: any[],
  targetInvoice: any,
  billing?: BillingItem,
) {
  if (!targetInvoice) return null;
  if (!Array.isArray(invoicesList) || invoicesList.length === 0) {
    return targetInvoice;
  }

  // If this is an individual split invoice or specific service invoice, DO NOT combine items from other services/invoices!
  const isIndividualSplit = Boolean(targetInvoice.split_details) || targetInvoice.notes?.toLowerCase().includes("service invoice");
  const isConsolidated =
    !isIndividualSplit &&
    (targetInvoice.notes?.toLowerCase().includes("consolidated") ||
     (!targetInvoice.split_details && !targetInvoice.notes?.toLowerCase().includes("service invoice") && targetInvoice.items?.length > 1));

  if (!isConsolidated) {
    return targetInvoice;
  }

  const itemsMap = new Map<string, any>();
  const serviceStatusMap = new Map<string | number, { status: string; paid_amount: number }>();

  invoicesList.forEach((inv: any) => {
    const invStatus = (inv.status || "").toLowerCase();
    const isPaid = isPaidOrSucceeded(invStatus);
    const isRef = isRefunded(invStatus);
    const isPartialRef = isPartiallyRefunded(invStatus);
    const itemResolvedStatus = isRef ? "refunded" : isPartialRef ? "partially_refunded" : isPaid ? "paid" : invStatus || "unpaid";

    (inv.items || []).forEach((item: any) => {
      const sId =
        item.order_service_id ||
        item.order_service?.id ||
        item.orderService?.id;
      const sUuid =
        item.order_service?.uuid ||
        item.orderService?.uuid;

      if (sId != null) {
        serviceStatusMap.set(sId, {
          status: itemResolvedStatus,
          paid_amount: parseFloat(inv.paid_amount || 0),
        });
      }
      if (sUuid != null) {
        serviceStatusMap.set(sUuid, {
          status: itemResolvedStatus,
          paid_amount: parseFloat(inv.paid_amount || 0),
        });
      }
    });
  });

  invoicesList.forEach((inv: any) => {
    (inv.items || []).forEach((item: any) => {
      const key =
        item.order_service?.uuid ||
        item.orderService?.uuid ||
        (item.order_service_id ? `id_${item.order_service_id}` : null) ||
        item.description ||
        item.id;

      if (key && !itemsMap.has(key)) {
        const sId = item.order_service_id || item.order_service?.id || item.orderService?.id;
        const sUuid = item.order_service?.uuid || item.orderService?.uuid;
        const statusInfo = (sUuid && serviceStatusMap.get(sUuid)) || (sId && serviceStatusMap.get(sId));
        const itemStatus = statusInfo?.status || (isPaidOrSucceeded(inv.status) ? "paid" : "unpaid");

        itemsMap.set(key, {
          ...item,
          item_status: itemStatus,
          is_paid: itemStatus === "paid" || itemStatus === "partially_refunded",
        });
      }
    });
  });

  const allItems = Array.from(itemsMap.values());

  let totalPaid = 0;
  let totalRefunded = 0;

  const hasIndividualInvoices = invoicesList.some(
    (inv: any) => !inv.notes?.toLowerCase().includes("consolidated") && !isVoidOrCancelled(inv.status)
  );

  const relevantInvoices = hasIndividualInvoices
    ? invoicesList.filter((inv: any) => !inv.notes?.toLowerCase().includes("consolidated"))
    : invoicesList;

  relevantInvoices.forEach((inv: any) => {
    if (!isVoidOrCancelled(inv.status)) {
      if (isPaidOrSucceeded(inv.status) || isPartiallyRefunded(inv.status)) {
        totalPaid += parseFloat(inv.paid_amount || inv.total || 0);
      } else {
        totalPaid += parseFloat(inv.paid_amount || 0);
      }
      totalRefunded += parseFloat(inv.refunded_amount || 0);
    }
  });

  if (billing?.total_paid != null && billing.total_paid > totalPaid) {
    totalPaid = billing.total_paid;
  }
  if (billing?.total_refunded != null && billing.total_refunded > totalRefunded) {
    totalRefunded = billing.total_refunded;
  }

  const hasUnpaid = allItems.some((i: any) => !i.is_paid && i.item_status !== "refunded");
  const hasPaid = allItems.some((i: any) => i.is_paid) || totalPaid > 0;
  const hasRefunded = allItems.some((i: any) => i.item_status === "refunded" || i.item_status === "partially_refunded") || totalRefunded > 0;
  let overallStatus = targetInvoice.status;
  if (totalRefunded > 0 && totalRefunded >= totalPaid && totalPaid > 0) {
    overallStatus = "refunded";
  } else if (hasRefunded && totalPaid > 0) {
    overallStatus = "partially_refunded";
  } else if (hasPaid && hasUnpaid) {
    overallStatus = "partially_paid";
  } else if (hasPaid && !hasUnpaid && allItems.length > 0) {
    overallStatus = "paid";
  }

  return {
    ...targetInvoice,
    status: overallStatus,
    items: allItems.length > 0 ? allItems : targetInvoice.items,
    paid_amount: totalPaid.toFixed(2),
    refunded_amount: totalRefunded.toFixed(2),
  };
}


