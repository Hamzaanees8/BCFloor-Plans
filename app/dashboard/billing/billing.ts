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
  original_amount?: number;
  discounted_amount?: number;
  tax_amount?: number;
  tax_rate?: number;
  tax_details?: any;
  total_amount?: number;
  paid_amount?: number;
  refunded_amount?: number;
  invoice_status?: string;
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
  grand_total?: number;
  tax_amount?: number;
  tax_rate?: number;
  tax_details?: any;
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
  package?: any;
}

/**
 * Formats a date string into a clean, human-readable format: "19 July 2026"
 */
export function formatOrderDate(dateString?: string | null): string {
  if (!dateString) return "—";
  try {
    const cleanStr =
      typeof dateString === "string" ? dateString.replace(" ", "T") : dateString;
    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "—";
  }
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

import {
  isRenewalInvoice,
  isMainInvoice,
  isInvoiceLinkedToService,
  isOrphanInvoice,
  isServiceInvoice,
  isSingleServiceOrder,
  filterVisibleInvoices,
} from "../invoice/invoice_utils";

export {
  isRenewalInvoice,
  isMainInvoice,
  isInvoiceLinkedToService,
  isOrphanInvoice,
  isServiceInvoice,
  isSingleServiceOrder,
  filterVisibleInvoices,
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

  // Filter out redundant duplicate service invoices when single service
  const cleanedInvoices = filterVisibleInvoices(invoicesList);
  const effectiveInvoices = cleanedInvoices.length > 0 ? cleanedInvoices : invoicesList;

  const isCoAgent = isUserCoAgent(userInfo, userType);
  const userUuid = userInfo?.data?.uuid || userInfo?.uuid;
  const userEmail = (
    userInfo?.data?.primary_email ||
    userInfo?.primary_email ||
    userInfo?.data?.email ||
    userInfo?.email ||
    ""
  ).toLowerCase().trim();
  const userName = (
    `${userInfo?.data?.first_name || userInfo?.first_name || ""} ${userInfo?.data?.last_name || userInfo?.last_name || ""}`
  ).toLowerCase().trim();

  const matchesCoAgent = (inv: any) => {
    if (!inv) return false;
    const invEmail = (inv.agent?.email || inv.email || "").toLowerCase().trim();
    const invName = (inv.agent?.name || inv.agent_name || `${inv.agent?.first_name || ""} ${inv.agent?.last_name || ""}`).toLowerCase().trim();
    const invUuid = inv.agent?.uuid || inv.agent_uuid;
    return (
      inv.agent_type === "co-agent" ||
      inv.agent_type === "co_agent" ||
      (userUuid && invUuid === userUuid) ||
      (userEmail && (invEmail === userEmail || invEmail.includes(userEmail))) ||
      (userName && invName && (invName === userName || invName.includes(userName)))
    );
  };

  const matchesPrimary = (inv: any) => {
    if (!inv) return false;
    return inv.agent_type === "primary" || (!inv.split_details && inv.agent_type !== "co-agent" && inv.agent_type !== "co_agent");
  };

  // 1. If serviceUuid or serviceId is provided: filter invoices containing this service
  if (serviceUuid || serviceId != null) {
    const serviceInvoices = effectiveInvoices.filter((inv: any) =>
      inv.items?.some((i: any) => {
        const sUuid = i.order_service?.uuid || i.orderService?.uuid || i.order_service_uuid;
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
              String(sId) === String(serviceUuid) ||
              (svcId != null && String(svcId) === String(serviceUuid)))) ||
          (serviceId != null &&
            (String(svcId) === String(serviceId) ||
              String(sId) === String(serviceId)))
        );
      }),
    );

    if (serviceInvoices.length > 0) {
      const activeServiceInvoices = serviceInvoices.filter((inv: any) => !isVoidOrCancelled(inv.status));
      const rawPool = activeServiceInvoices.length > 0 ? activeServiceInvoices : serviceInvoices;
      // Filter out renewal invoices so the service's own invoice is strictly preferred
      const nonRenewals = rawPool.filter((inv: any) => !isRenewalInvoice(inv));
      const pool = nonRenewals.length > 0 ? nonRenewals : rawPool;

      if (isCoAgent) {
        const coAgentInv = pool.find((inv: any) => matchesCoAgent(inv));
        if (coAgentInv) {
          // Prefer single-service invoice over multi-service invoice for service view
          const singleCoInv = pool.find((inv: any) => matchesCoAgent(inv) && (!inv.notes?.toLowerCase().includes("consolidated") || inv.items?.length === 1));
          return singleCoInv || coAgentInv;
        }
      } else {
        const primaryInv = pool.find((inv: any) => matchesPrimary(inv) || (userUuid && (inv.agent?.uuid === userUuid || inv.agent_uuid === userUuid)));
        if (primaryInv) {
          const singlePrimaryInv = pool.find((inv: any) => (matchesPrimary(inv) || (userUuid && (inv.agent?.uuid === userUuid || inv.agent_uuid === userUuid))) && (!inv.notes?.toLowerCase().includes("consolidated") || inv.items?.length === 1));
          return singlePrimaryInv || primaryInv;
        }
      }

      // Prefer individual service invoice over consolidated invoice for service-level view
      const individual = pool.find((inv: any) => !inv.notes?.toLowerCase().includes("consolidated") || inv.items?.length === 1);
      if (individual) return individual;
      return pool[0];
    }
  }

  // 2. Fallback: select the best overall invoice for the order (preferring non-renewals)
  const activeInvoices = effectiveInvoices.filter((inv: any) => !isVoidOrCancelled(inv.status));
  const rawOrderPool = activeInvoices.length > 0 ? activeInvoices : effectiveInvoices;
  const nonRenewalOrderPool = rawOrderPool.filter((inv: any) => !isRenewalInvoice(inv));
  const pool = nonRenewalOrderPool.length > 0 ? nonRenewalOrderPool : rawOrderPool;

  // Top Priority: Consolidated / whole-order invoice
  const consolidated = pool.find(
    (inv: any) =>
      inv.notes?.toLowerCase().includes("consolidated") ||
      (Array.isArray(inv.items) && inv.items.length > 1 && !inv.split_details && !inv.notes?.toLowerCase().includes("service invoice"))
  );

  if (isCoAgent) {
    const multiCoInv = pool.find(
      (inv: any) =>
        matchesCoAgent(inv) &&
        (inv.notes?.toLowerCase().includes("consolidated") ||
          !inv.notes?.toLowerCase().includes("service invoice") ||
          (inv.items?.length || 0) > 1),
    );
    const coAgentInv = multiCoInv || pool.find((inv: any) => matchesCoAgent(inv));
    if (coAgentInv) return coAgentInv;
  } else if (userType === "agent") {
    const multiPrimaryInv = pool.find(
      (inv: any) =>
        (matchesPrimary(inv) || (userUuid && (inv.agent?.uuid === userUuid || inv.agent_uuid === userUuid))) &&
        (inv.notes?.toLowerCase().includes("consolidated") ||
          !inv.notes?.toLowerCase().includes("service invoice") ||
          (inv.items?.length || 0) > 1),
    );
    if (multiPrimaryInv) return multiPrimaryInv;
    if (consolidated) return consolidated;
    const nonServiceInv = pool.find(
      (inv: any) => matchesPrimary(inv) && !inv.notes?.toLowerCase().includes("service invoice")
    );
    if (nonServiceInv) return nonServiceInv;
    const primaryInv = pool.find(
      (inv: any) => matchesPrimary(inv) || (userUuid && (inv.agent?.uuid === userUuid || inv.agent_uuid === userUuid))
    );
    if (primaryInv) return primaryInv;
  } else {
    // Admin: prioritize consolidated / whole-order invoice over single-service invoices
    if (consolidated) return consolidated;
    const nonServiceInv = pool.find(
      (inv: any) =>
        (matchesPrimary(inv) || (userUuid && (inv.agent?.uuid === userUuid || inv.agent_uuid === userUuid))) &&
        !inv.notes?.toLowerCase().includes("service invoice")
    );
    if (nonServiceInv) return nonServiceInv;
    const primaryInv = pool.find(
      (inv: any) => matchesPrimary(inv) || (userUuid && (inv.agent?.uuid === userUuid || inv.agent_uuid === userUuid))
    );
    if (primaryInv) return primaryInv;
  }

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

/**
 * Given a target invoice and a specific service, prepares an isolated invoice preview
 * containing ONLY the items, subtotal, tax, and total for that specific service.
 */
export function prepareServiceInvoicePreview(
  targetInvoice: any,
  serviceUuid?: string,
  serviceNumericId?: number | string,
  serviceName?: string,
) {
  if (!targetInvoice) return null;
  if (!serviceUuid && serviceNumericId == null && !serviceName) {
    return targetInvoice;
  }

  if (!Array.isArray(targetInvoice.items) || targetInvoice.items.length <= 1) {
    return targetInvoice;
  }

  // Filter items to matching service
  const matchingItems = targetInvoice.items.filter((item: any) => {
    const sUuid = item.order_service?.uuid || item.orderService?.uuid || item.order_service_uuid;
    const sId = item.order_service_id || item.order_service?.id || item.orderService?.id;
    const svcId =
      item.order_service?.service_id ||
      item.order_service?.service?.id ||
      item.orderService?.service_id ||
      item.orderService?.service?.id ||
      item.service_id;

    return (
      (serviceUuid && (sUuid === serviceUuid || String(sId) === String(serviceUuid) || (svcId != null && String(svcId) === String(serviceUuid)))) ||
      (serviceNumericId != null && (String(svcId) === String(serviceNumericId) || String(sId) === String(serviceNumericId))) ||
      (serviceName && item.description && item.description.toLowerCase().trim() === serviceName.toLowerCase().trim())
    );
  });

  if (matchingItems.length === 0 || matchingItems.length === targetInvoice.items.length) {
    return targetInvoice;
  }

  const subtotal = matchingItems.reduce((sum: number, item: any) => {
    return sum + (parseFloat(item.amount) || ((parseFloat(item.quantity) || 1) * (parseFloat(item.unit_price) || 0)));
  }, 0);

  let taxDetails = targetInvoice.tax_details;
  let taxAmount = 0;
  const itemsTaxSum = matchingItems.reduce((sum: number, item: any) => sum + (parseFloat(item.tax_amount || "0") || 0), 0);
  const itemsGstSum = matchingItems.reduce((sum: number, item: any) => sum + (parseFloat(item.gst_amount || "0") || 0), 0);
  const itemsPstSum = matchingItems.reduce((sum: number, item: any) => sum + (parseFloat(item.pst_amount || "0") || 0), 0);

  if (itemsTaxSum > 0) {
    taxAmount = itemsTaxSum;
    if (itemsGstSum > 0 || itemsPstSum > 0) {
      taxDetails = {};
      if (itemsGstSum > 0) {
        taxDetails["GST"] = {
          rate: targetInvoice.tax_details?.GST?.rate ?? 11,
          amount: itemsGstSum,
        };
      }
      if (itemsPstSum > 0) {
        taxDetails["PST"] = {
          rate: targetInvoice.tax_details?.PST?.rate ?? 7,
          amount: itemsPstSum,
        };
      }
    }
  } else {
    const taxRate = parseFloat(targetInvoice.tax_rate || "0");
    taxAmount = subtotal * (taxRate / 100);
  }
  const total = subtotal + taxAmount;

  return {
    ...targetInvoice,
    items: matchingItems,
    subtotal: subtotal.toFixed(2),
    tax_amount: taxAmount.toFixed(2),
    tax: taxAmount.toFixed(2),
    tax_details: taxDetails,
    total: total.toFixed(2),
    total_amount: total.toFixed(2),
  };
}

export function prepareOrderInvoicePreview(
  invoicesList: any[],
  targetInvoice: any,
  billing?: BillingItem | any,
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

  let allItems: any[] = [];
  if (Array.isArray(targetInvoice.items) && targetInvoice.items.length > 0) {
    allItems = targetInvoice.items.map((item: any) => {
      const sId = item.order_service_id || item.order_service?.id || item.orderService?.id;
      const sUuid = item.order_service?.uuid || item.orderService?.uuid;
      const statusInfo = (sUuid && serviceStatusMap.get(sUuid)) || (sId && serviceStatusMap.get(sId));
      const itemStatus = statusInfo?.status || (isPaidOrSucceeded(targetInvoice.status) ? "paid" : "unpaid");
      return {
        ...item,
        item_status: itemStatus,
        is_paid: itemStatus === "paid" || itemStatus === "partially_refunded",
      };
    });
  } else {
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
    allItems = Array.from(itemsMap.values());
  }

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

/**
 * Given all order invoices and a service identifier, returns all active
 * (non-void, non-cancelled) invoices for that specific service — including
 * both the primary agent invoice and the co-agent invoice for split orders.
 */
export function getServiceSplitInvoices(
  invoicesList: any[],
  serviceUuid?: string,
  serviceId?: number | string,
): any[] {
  if (!Array.isArray(invoicesList) || invoicesList.length === 0) return [];
  if (!serviceUuid && serviceId == null) return [];

  const visibleList = filterVisibleInvoices(invoicesList);
  return visibleList.filter(
    (inv: any) =>
      !isVoidOrCancelled(inv.status) &&
      inv.items?.some((i: any) => {
        const sUuid = i.order_service?.uuid || i.orderService?.uuid;
        const sId =
          i.order_service_id || i.order_service?.id || i.orderService?.id;
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
              svcId?.toString() === serviceId?.toString() ||
              sId === serviceId ||
              sId?.toString() === serviceId?.toString()))
        );
      }),
  );
}

/**
 * Compute the combined payment status for a service across all its split invoices.
 * Returns: 'paid' | 'partially_paid' | 'unpaid'
 */
export function getServiceCombinedStatus(
  splitInvoices: any[],
): "paid" | "partially_paid" | "unpaid" {
  if (splitInvoices.length === 0) return "unpaid";
  const paidCount = splitInvoices.filter(
    (inv) => isPaidOrSucceeded(inv.status) || isRefunded(inv.status),
  ).length;
  if (paidCount === 0) return "unpaid";
  if (paidCount === splitInvoices.length) return "paid";
  return "partially_paid";
}

export interface ServicePricingDetails {
  basePrice: number;
  taxAmount: number;
  totalPrice: number;
  isFromInvoice: boolean;
  matchingInvoicesCount: number;
  appliedTaxRate: number;
  taxDetails?: Record<string, { rate?: number; amount?: number }>;
  paidAmount?: number;
  refundedAmount?: number;
  invoiceStatus?: string;
  originalPrice?: number;
  discountAmount?: number;
  discountDescription?: string;
}

/**
 * Compute the actual price, tax, and total for a specific service based on actual invoice line items.
 * If services are split across multiple invoices (e.g. Primary Agent + Co-Agent), combines the prices
 * of matching invoice items for overall/admin views, or filters to the co-agent share when viewed by a co-agent.
 */
export function getServiceActualInvoicePricing({
  invoices,
  service,
  splitMultiplier = 1,
  isCoAgentUser = false,
  userType,
  currentUser,
  fallbackTaxRate = 0,
}: {
  invoices?: any[];
  service: any;
  splitMultiplier?: number;
  isCoAgentUser?: boolean;
  userType?: string | null;
  currentUser?: any;
  fallbackTaxRate?: number;
}): ServicePricingDetails {
  const serviceUuid = service?.uuid || service?.order_service_uuid;
  const serviceNumericId = service?.service_id;
  const serviceName = service?.service_name;

  if (!Array.isArray(invoices) || invoices.length === 0) {
    if (service?.total_amount != null && service?.tax_amount != null) {
      const basePrice = (service?.discounted_amount != null ? service.discounted_amount : (service?.amount || 0)) * splitMultiplier;
      const taxAmount = (service.tax_amount || 0) * splitMultiplier;
      const totalPrice = (service.total_amount || 0) * splitMultiplier;
      const appliedTaxRate = service.tax_rate != null ? parseFloat(service.tax_rate) : fallbackTaxRate;
      const originalPrice = service.original_amount ? service.original_amount * splitMultiplier : (service.amount && service.discounted_amount && service.amount > service.discounted_amount ? service.amount * splitMultiplier : undefined);
      const discountAmount = originalPrice && originalPrice > basePrice ? originalPrice - basePrice : undefined;
      return {
        basePrice,
        taxAmount,
        totalPrice,
        isFromInvoice: true,
        matchingInvoicesCount: 0,
        appliedTaxRate,
        taxDetails: service.tax_details || undefined,
        paidAmount: (service.paid_amount || 0) * splitMultiplier,
        refundedAmount: (service.refunded_amount || 0) * splitMultiplier,
        invoiceStatus: service.invoice_status || service.status,
        originalPrice,
        discountAmount,
      };
    }

    const basePrice = (service?.discounted_amount != null ? service.discounted_amount : (service?.amount || 0)) * splitMultiplier;
    const taxAmount = basePrice * (fallbackTaxRate / 100);
    const totalPrice = basePrice + taxAmount;
    return {
      basePrice,
      taxAmount,
      totalPrice,
      isFromInvoice: false,
      matchingInvoicesCount: 0,
      appliedTaxRate: fallbackTaxRate,
    };
  }

  // Active or non-void invoices
  const activeInvoices = invoices.filter((inv) => !isVoidOrCancelled(inv?.status));
  const invoicePool = activeInvoices.length > 0 ? activeInvoices : invoices;

  const userUuid = currentUser?.data?.uuid || currentUser?.uuid;
  const userEmail = (
    currentUser?.data?.primary_email ||
    currentUser?.primary_email ||
    currentUser?.data?.email ||
    currentUser?.email ||
    ""
  ).toLowerCase().trim();
  const userName = (
    `${currentUser?.data?.first_name || currentUser?.first_name || ""} ${currentUser?.data?.last_name || currentUser?.last_name || ""}`
  ).toLowerCase().trim();

  const isMatchingItem = (item: any) => {
    const sUuid = item.order_service?.uuid || item.orderService?.uuid || item.order_service_uuid;
    const sId = item.order_service_id || item.order_service?.id || item.orderService?.id;
    const svcId =
      item.order_service?.service_id ||
      item.order_service?.service?.id ||
      item.orderService?.service_id ||
      item.orderService?.service?.id ||
      item.service_id;

    return (
      (serviceUuid && (sUuid === serviceUuid || String(sId) === String(serviceUuid) || (svcId != null && String(svcId) === String(serviceUuid)))) ||
      (serviceNumericId != null && (String(svcId) === String(serviceNumericId) || String(sId) === String(serviceNumericId))) ||
      (serviceName && item.description && item.description.toLowerCase().trim() === serviceName.toLowerCase().trim())
    );
  };

  const getItemAmount = (item: any) => {
    return parseFloat(item.amount) || ((parseFloat(item.quantity) || 1) * (parseFloat(item.unit_price) || 0));
  };

  const isDedicatedServiceInvoice = (inv: any) => {
    if (!inv) return false;
    const notes = (inv.notes || "").toLowerCase();
    if (notes.includes("consolidated")) return false;
    if (serviceName && notes.includes(serviceName.toLowerCase())) return true;
    if (notes.includes("service invoice")) {
      return Array.isArray(inv.items) && inv.items.length > 0 && inv.items.some(isMatchingItem);
    }
    if (Array.isArray(inv.items) && inv.items.length > 0) {
      const positiveItems = inv.items.filter((i: any) => getItemAmount(i) > 0);
      if (positiveItems.length === 1 && isMatchingItem(positiveItems[0])) return true;
      if (inv.items.every((i: any) => isMatchingItem(i) || getItemAmount(i) < 0)) return true;
    }
    return false;
  };

  const isAgent = userType === "agent" || isCoAgentUser;

  if (isAgent) {
    // AGENT VIEW: isolate this specific agent's invoice(s)
    const matchesThisAgent = (inv: any) => {
      const invEmail = (inv?.agent?.email || inv?.email || "").toLowerCase().trim();
      const invName = (inv?.agent?.name || inv?.agent_name || `${inv?.agent?.first_name || ""} ${inv?.agent?.last_name || ""}`).toLowerCase().trim();
      const invUuid = inv?.agent?.uuid || inv?.agent_uuid;

      if (userUuid && invUuid && invUuid === userUuid) return true;
      if (userEmail && invEmail && (invEmail === userEmail || invEmail.includes(userEmail))) return true;
      if (userName && invName && (invName === userName || invName.includes(userName))) return true;

      if (isCoAgentUser) {
        return inv?.agent_type === "co-agent" || inv?.agent_type === "co_agent";
      } else {
        return inv?.agent_type === "primary" || (!inv?.split_details && inv?.agent_type !== "co-agent" && inv?.agent_type !== "co_agent");
      }
    };

    const agentInvoices = invoicePool.filter(matchesThisAgent);
    const targetInvoices = agentInvoices.length > 0 ? agentInvoices : invoicePool;

    // Prefer dedicated service invoice
    const singleSvcInv = targetInvoices.find(isDedicatedServiceInvoice);
    const chosenInvoice = singleSvcInv || targetInvoices.find((inv) => inv.items?.some(isMatchingItem));

    if (chosenInvoice) {
      if (singleSvcInv) {
        const basePrice = parseFloat(singleSvcInv.subtotal || "0");
        const invTaxRate = singleSvcInv.tax_rate != null && parseFloat(singleSvcInv.tax_rate) > 0 ? parseFloat(singleSvcInv.tax_rate) : fallbackTaxRate;
        const taxAmount = singleSvcInv.tax_amount != null && parseFloat(singleSvcInv.tax_amount) > 0 ? parseFloat(singleSvcInv.tax_amount) : basePrice * (invTaxRate / 100);
        const totalPrice = singleSvcInv.total != null && parseFloat(singleSvcInv.total) > 0 ? parseFloat(singleSvcInv.total) : basePrice + taxAmount;
        
        let originalPrice: number | undefined;
        let discountAmount: number | undefined;
        let discountDescription: string | undefined;

        if (Array.isArray(singleSvcInv.items)) {
          const posSum = singleSvcInv.items.filter((i: any) => getItemAmount(i) > 0).reduce((sum: number, i: any) => sum + getItemAmount(i), 0);
          const negItems = singleSvcInv.items.filter((i: any) => getItemAmount(i) < 0);
          const negSum = negItems.reduce((sum: number, i: any) => sum + Math.abs(getItemAmount(i)), 0);
          if (negSum > 0) {
            originalPrice = posSum;
            discountAmount = negSum;
            discountDescription = negItems[0]?.description;
          }
        }

        const rawPaid = parseFloat(singleSvcInv.paid_amount || "0");
        const rawRefunded = parseFloat(singleSvcInv.refunded_amount || "0");
        const paidAmount = isPaidOrSucceeded(singleSvcInv.status) && rawPaid === 0 ? totalPrice : rawPaid;
        const refundedAmount = isRefunded(singleSvcInv.status) && rawRefunded === 0 ? (paidAmount > 0 ? paidAmount : totalPrice) : rawRefunded;

        return {
          basePrice,
          taxAmount,
          totalPrice,
          isFromInvoice: true,
          matchingInvoicesCount: 1,
          appliedTaxRate: invTaxRate,
          taxDetails: singleSvcInv.tax_details && Object.keys(singleSvcInv.tax_details).length > 0 ? singleSvcInv.tax_details : undefined,
          paidAmount,
          refundedAmount,
          invoiceStatus: singleSvcInv.status,
          originalPrice,
          discountAmount,
          discountDescription,
        };
      }

      // From multi-service or consolidated invoice
      if (Array.isArray(chosenInvoice.items)) {
        const matchingItems = chosenInvoice.items.filter(isMatchingItem);
        if (matchingItems.length > 0) {
          const posMatching = matchingItems.filter((i: any) => getItemAmount(i) > 0);
          const posAmount = posMatching.reduce((sum: number, i: any) => sum + getItemAmount(i), 0);
          const directNegItems = matchingItems.filter((i: any) => getItemAmount(i) < 0);
          let discountAmt = directNegItems.reduce((sum: number, i: any) => sum + Math.abs(getItemAmount(i)), 0);
          let discountDesc = directNegItems[0]?.description;

          // If no direct discount items on this service, check global discount items on invoice
          if (discountAmt === 0) {
            const allPosSum = chosenInvoice.items.filter((i: any) => getItemAmount(i) > 0).reduce((sum: number, i: any) => sum + getItemAmount(i), 0);
            const allNegItems = chosenInvoice.items.filter((i: any) => getItemAmount(i) < 0);
            const allNegSum = allNegItems.reduce((sum: number, i: any) => sum + Math.abs(getItemAmount(i)), 0);
            if (allNegSum > 0 && allPosSum > 0 && posAmount > 0) {
              const ratio = posAmount / allPosSum;
              discountAmt = Math.round(allNegSum * ratio * 100) / 100;
              discountDesc = allNegItems[0]?.description;
            }
          }

          const netBasePrice = Math.max(0, posAmount - discountAmt);
          const invTaxRate = chosenInvoice.tax_rate != null && parseFloat(chosenInvoice.tax_rate) > 0 ? parseFloat(chosenInvoice.tax_rate) : fallbackTaxRate;
          
          let taxAmount = 0;
          let taxDetails: Record<string, { rate?: number; amount?: number }> | undefined;

          // Check if items have item-level tax amounts
          const itemTaxSum = matchingItems.reduce((sum: number, i: any) => sum + (parseFloat(i.tax_amount || "0") || 0), 0);
          const itemGstSum = matchingItems.reduce((sum: number, i: any) => sum + (parseFloat(i.gst_amount || "0") || 0), 0);
          const itemPstSum = matchingItems.reduce((sum: number, i: any) => sum + (parseFloat(i.pst_amount || "0") || 0), 0);

          if (itemTaxSum > 0) {
            const scale = posAmount > 0 ? netBasePrice / posAmount : 1;
            taxAmount = Math.round(itemTaxSum * scale * 100) / 100;
            taxDetails = {};
            if (itemGstSum > 0) {
              taxDetails["GST"] = {
                rate: chosenInvoice.tax_details?.GST?.rate ?? 11,
                amount: Math.round(itemGstSum * scale * 100) / 100,
              };
            }
            if (itemPstSum > 0) {
              taxDetails["PST"] = {
                rate: chosenInvoice.tax_details?.PST?.rate ?? 7,
                amount: Math.round(itemPstSum * scale * 100) / 100,
              };
            }
          } else {
            taxAmount = Math.round(netBasePrice * (invTaxRate / 100) * 100) / 100;
            if (chosenInvoice.tax_details) {
              taxDetails = {};
              Object.entries(chosenInvoice.tax_details).forEach(([k, v]: [string, any]) => {
                const r = parseFloat(v?.rate || 0);
                if (r > 0) {
                  taxDetails![k] = {
                    rate: r,
                    amount: Math.round(netBasePrice * (r / 100) * 100) / 100,
                  };
                }
              });
            }
          }

          const totalPrice = netBasePrice + taxAmount;
          return {
            basePrice: netBasePrice,
            taxAmount,
            totalPrice,
            isFromInvoice: true,
            matchingInvoicesCount: 1,
            appliedTaxRate: invTaxRate,
            taxDetails: taxDetails && Object.keys(taxDetails).length > 0 ? taxDetails : undefined,
            originalPrice: discountAmt > 0 ? posAmount : undefined,
            discountAmount: discountAmt > 0 ? discountAmt : undefined,
            discountDescription: discountDesc,
            invoiceStatus: chosenInvoice.status,
          };
        }
      }
    }
  } else {
    // ADMIN VIEW: sum across matching split invoices (e.g. Primary Agent + Co-Agent = 100%)
    const matchingInvoices = invoicePool.filter((inv) =>
      (Array.isArray(inv?.items) && inv.items.some(isMatchingItem)) || isDedicatedServiceInvoice(inv)
    );

    if (matchingInvoices.length > 0) {
      // Group matching invoices by unique agent.
      const agentMap = new Map<string, any[]>();

      matchingInvoices.forEach((inv) => {
        let agentKey = "";
        if (inv.agent?.uuid || inv.agent_uuid) {
          agentKey = `uuid:${inv.agent?.uuid || inv.agent_uuid}`;
        } else if (inv.agent?.email || inv.email) {
          agentKey = `email:${(inv.agent?.email || inv.email).toLowerCase()}`;
        } else if (inv.agent_type) {
          agentKey = `type:${inv.agent_type}`;
        } else if (inv.split_details) {
          agentKey = `split:${inv.id || inv.uuid}`;
        } else {
          agentKey = `inv:${inv.id || inv.uuid}`;
        }

        if (!agentMap.has(agentKey)) {
          agentMap.set(agentKey, []);
        }
        agentMap.get(agentKey)!.push(inv);
      });

      let combinedBasePrice = 0;
      let combinedTaxAmount = 0;
      let combinedTotalPrice = 0;
      let combinedPaidAmount = 0;
      let combinedRefundedAmount = 0;
      let combinedOriginalPrice = 0;
      let combinedDiscountAmount = 0;
      let discountDescription: string | undefined;
      const combinedTaxDetails: Record<string, { rate?: number; amount?: number }> = {};
      let matches = 0;
      let primaryStatus = "";

      // For each distinct agent, pick their best matching invoice (prefer dedicated single-service invoice over consolidated)
      agentMap.forEach((agentInvs) => {
        const singleSvcInv = agentInvs.find(isDedicatedServiceInvoice);
        const chosenInv = singleSvcInv || agentInvs.find((inv) => inv.items?.some(isMatchingItem)) || agentInvs[0];

        if (chosenInv) {
          if (singleSvcInv && parseFloat(singleSvcInv.subtotal || "0") > 0) {
            const sub = parseFloat(singleSvcInv.subtotal || "0");
            const tax = singleSvcInv.tax_amount != null && parseFloat(singleSvcInv.tax_amount) > 0
              ? parseFloat(singleSvcInv.tax_amount)
              : sub * (parseFloat(singleSvcInv.tax_rate || fallbackTaxRate.toString()) / 100);
            const tot = singleSvcInv.total != null && parseFloat(singleSvcInv.total) > 0
              ? parseFloat(singleSvcInv.total)
              : sub + tax;

            const paid = parseFloat(singleSvcInv.paid_amount || "0");
            const ref = parseFloat(singleSvcInv.refunded_amount || "0");
            const finalPaid = isPaidOrSucceeded(singleSvcInv.status) && paid === 0 ? tot : paid;
            const finalRefunded = isRefunded(singleSvcInv.status) && ref === 0 ? (finalPaid > 0 ? finalPaid : tot) : ref;

            combinedBasePrice += sub;
            combinedTaxAmount += tax;
            combinedTotalPrice += tot;
            combinedPaidAmount += finalPaid;
            combinedRefundedAmount += finalRefunded;
            if (!primaryStatus) primaryStatus = singleSvcInv.status;

            if (Array.isArray(singleSvcInv.items)) {
              const posSum = singleSvcInv.items.filter((i: any) => getItemAmount(i) > 0).reduce((sum: number, i: any) => sum + getItemAmount(i), 0);
              const negItems = singleSvcInv.items.filter((i: any) => getItemAmount(i) < 0);
              const negSum = negItems.reduce((sum: number, i: any) => sum + Math.abs(getItemAmount(i)), 0);
              if (negSum > 0) {
                combinedOriginalPrice += posSum;
                combinedDiscountAmount += negSum;
                if (!discountDescription) discountDescription = negItems[0]?.description;
              }
            }

            if (singleSvcInv.tax_details && typeof singleSvcInv.tax_details === "object") {
              Object.entries(singleSvcInv.tax_details).forEach(([k, v]: [string, any]) => {
                const amt = parseFloat(v?.amount || 0);
                const r = v?.rate ?? 0;
                if (!combinedTaxDetails[k]) {
                  combinedTaxDetails[k] = { rate: r, amount: amt };
                } else {
                  combinedTaxDetails[k].amount = Math.round(((combinedTaxDetails[k].amount || 0) + amt) * 100) / 100;
                }
              });
            }

            matches++;
          } else if (Array.isArray(chosenInv.items)) {
            const matchingItems = chosenInv.items.filter(isMatchingItem);
            if (matchingItems.length > 0) {
              const posMatching = matchingItems.filter((i: any) => getItemAmount(i) > 0);
              const posAmount = posMatching.reduce((sum: number, i: any) => sum + getItemAmount(i), 0);
              const directNegItems = matchingItems.filter((i: any) => getItemAmount(i) < 0);
              let discountAmt = directNegItems.reduce((sum: number, i: any) => sum + Math.abs(getItemAmount(i)), 0);
              let discDesc = directNegItems[0]?.description;

              if (discountAmt === 0) {
                const allPosSum = chosenInv.items.filter((i: any) => getItemAmount(i) > 0).reduce((sum: number, i: any) => sum + getItemAmount(i), 0);
                const allNegItems = chosenInv.items.filter((i: any) => getItemAmount(i) < 0);
                const allNegSum = allNegItems.reduce((sum: number, i: any) => sum + Math.abs(getItemAmount(i)), 0);
                if (allNegSum > 0 && allPosSum > 0 && posAmount > 0) {
                  const ratio = posAmount / allPosSum;
                  discountAmt = Math.round(allNegSum * ratio * 100) / 100;
                  discDesc = allNegItems[0]?.description;
                }
              }

              const netBasePrice = Math.max(0, posAmount - discountAmt);
              const invTaxRate = chosenInv.tax_rate != null && parseFloat(chosenInv.tax_rate) > 0 ? parseFloat(chosenInv.tax_rate) : fallbackTaxRate;
              
              let taxAmount = 0;
              const itemTaxSum = matchingItems.reduce((sum: number, i: any) => sum + (parseFloat(i.tax_amount || "0") || 0), 0);
              const itemGstSum = matchingItems.reduce((sum: number, i: any) => sum + (parseFloat(i.gst_amount || "0") || 0), 0);
              const itemPstSum = matchingItems.reduce((sum: number, i: any) => sum + (parseFloat(i.pst_amount || "0") || 0), 0);

              if (itemTaxSum > 0) {
                const scale = posAmount > 0 ? netBasePrice / posAmount : 1;
                taxAmount = Math.round(itemTaxSum * scale * 100) / 100;
                if (itemGstSum > 0) {
                  const amt = Math.round(itemGstSum * scale * 100) / 100;
                  const k = "GST";
                  const r = chosenInv.tax_details?.GST?.rate ?? 11;
                  combinedTaxDetails[k] = { rate: r, amount: ((combinedTaxDetails[k]?.amount || 0) + amt) };
                }
                if (itemPstSum > 0) {
                  const amt = Math.round(itemPstSum * scale * 100) / 100;
                  const k = "PST";
                  const r = chosenInv.tax_details?.PST?.rate ?? 7;
                  combinedTaxDetails[k] = { rate: r, amount: ((combinedTaxDetails[k]?.amount || 0) + amt) };
                }
              } else {
                taxAmount = Math.round(netBasePrice * (invTaxRate / 100) * 100) / 100;
                if (chosenInv.tax_details) {
                  Object.entries(chosenInv.tax_details).forEach(([k, v]: [string, any]) => {
                    const r = parseFloat(v?.rate || 0);
                    if (r > 0) {
                      const amt = Math.round(netBasePrice * (r / 100) * 100) / 100;
                      combinedTaxDetails[k] = { rate: r, amount: ((combinedTaxDetails[k]?.amount || 0) + amt) };
                    }
                  });
                }
              }

              combinedBasePrice += netBasePrice;
              combinedTaxAmount += taxAmount;
              combinedTotalPrice += (netBasePrice + taxAmount);
              if (discountAmt > 0) {
                combinedOriginalPrice += posAmount;
                combinedDiscountAmount += discountAmt;
                if (!discountDescription) discountDescription = discDesc;
              }
              if (!primaryStatus) primaryStatus = chosenInv.status;
              matches++;
            }
          }
        }
      });

      if (matches > 0 && combinedBasePrice > 0) {
        combinedBasePrice = Math.round(combinedBasePrice * 100) / 100;
        combinedTaxAmount = Math.round(combinedTaxAmount * 100) / 100;
        combinedTotalPrice = Math.round((combinedTotalPrice || (combinedBasePrice + combinedTaxAmount)) * 100) / 100;
        const effectiveRate = combinedBasePrice > 0 ? Math.round((combinedTaxAmount / combinedBasePrice) * 10000) / 100 : fallbackTaxRate;

        return {
          basePrice: combinedBasePrice,
          taxAmount: combinedTaxAmount,
          totalPrice: combinedTotalPrice,
          isFromInvoice: true,
          matchingInvoicesCount: matches,
          appliedTaxRate: effectiveRate,
          taxDetails: Object.keys(combinedTaxDetails).length > 0 ? combinedTaxDetails : undefined,
          paidAmount: Math.round(combinedPaidAmount * 100) / 100,
          refundedAmount: Math.round(combinedRefundedAmount * 100) / 100,
          invoiceStatus: primaryStatus,
          originalPrice: combinedDiscountAmount > 0 ? combinedOriginalPrice : undefined,
          discountAmount: combinedDiscountAmount > 0 ? combinedDiscountAmount : undefined,
          discountDescription,
        };
      }
    }
  }

  // Fallback to service fields (e.g. from /billing API) if no matching invoice items were found
  if (service?.total_amount != null && service?.tax_amount != null) {
    const basePrice = (service?.discounted_amount != null ? service.discounted_amount : (service?.amount || 0)) * splitMultiplier;
    const taxAmount = (service.tax_amount || 0) * splitMultiplier;
    const totalPrice = (service.total_amount || 0) * splitMultiplier;
    const appliedTaxRate = service.tax_rate != null ? parseFloat(service.tax_rate) : fallbackTaxRate;
    return {
      basePrice,
      taxAmount,
      totalPrice,
      isFromInvoice: true,
      matchingInvoicesCount: 0,
      appliedTaxRate,
      taxDetails: service.tax_details || undefined,
      paidAmount: (service.paid_amount || 0) * splitMultiplier,
      refundedAmount: (service.refunded_amount || 0) * splitMultiplier,
      invoiceStatus: service.invoice_status || service.status,
      originalPrice: service.original_amount ? service.original_amount * splitMultiplier : undefined,
      discountAmount: service.original_amount && service.original_amount > basePrice ? (service.original_amount - basePrice) * splitMultiplier : undefined,
    };
  }

  const basePrice = (service?.discounted_amount != null ? service.discounted_amount : (service?.amount || 0)) * splitMultiplier;
  const taxAmount = basePrice * (fallbackTaxRate / 100);
  const totalPrice = basePrice + taxAmount;
  return {
    basePrice,
    taxAmount,
    totalPrice,
    isFromInvoice: false,
    matchingInvoicesCount: 0,
    appliedTaxRate: fallbackTaxRate,
  };
}
