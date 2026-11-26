"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  X,
  Download,
  ExternalLink,
  Loader2,
  RotateCcw,
  FileText,
  Edit2,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { isUserCoAgent } from "@/lib/permissions";
import {
  BillingItem,
  formatOrderDate,
  getBillings,
  getBestTargetInvoice,
  prepareOrderInvoicePreview,
  prepareServiceInvoicePreview,
  getServiceActualInvoicePricing,
  isVoidOrCancelled,
  isPaidOrSucceeded,
  isRefunded,
  isPartiallyRefunded,
  filterVisibleInvoices,
  isSingleServiceOrder,
} from "@/app/dashboard/billing/billing";
import {
  GetInvoicesByOrder,
  PayInvoiceWithStripe,
  MarkPaid,
  DownloadInvoice,
  UpdateInvoice,
} from "@/app/dashboard/invoice/invoice_api";
import {
  isRenewalInvoice,
  isMainInvoice,
  isInvoiceLinkedToService,
} from "@/app/dashboard/invoice/invoice_utils";
import RefundModal from "@/app/dashboard/invoice/components/RefundModal";
import RefundReceiptModal from "@/app/dashboard/invoice/components/RefundReceiptModal";
import DeleteInvoiceModal from "@/app/dashboard/invoice/components/DeleteInvoiceModal";
import InvoiceDocument from "@/app/dashboard/invoice/components/InvoiceDocument";

interface OrderBillingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string | number;
  orderUuid?: string;
  orderData?: any;
  invoices?: any[];
  onRefreshInvoices?: () => Promise<any>;
  onViewInvoiceDoc?: (invoice: any) => void;
  filesData?: any;
}

export default function OrderBillingModal({
  open,
  onOpenChange,
  orderId,
  orderUuid,
  orderData,
  invoices: initialInvoices = [],
  onRefreshInvoices,
  filesData,
}: OrderBillingModalProps) {
  const { userType } = useAppContext();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const info = localStorage.getItem("userInfo");
      if (info) {
        try {
          setCurrentUser(JSON.parse(info));
        } catch (e) {
          console.error("Failed to parse userInfo", e);
        }
      }
    }
  }, []);

  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string) || "admin";
  const isAdmin = role === "admin";
  const roleSettings =
    appliedSettings[role as keyof typeof appliedSettings] ||
    appliedSettings["admin"];

  const isCoAgentUser =
    userType === "agent" && isUserCoAgent(currentUser, userType);

  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<BillingItem | null>(null);
  const [invoices, setInvoices] = useState<any[]>(initialInvoices);
  const [actionLoading, setActionLoading] = useState<{
    id: any;
    action: string;
  } | null>(null);
  const [downloadingUuid, setDownloadingUuid] = useState<string | null>(null);

  // Invoice Document Viewer & Editor Popup State
  const [serviceInvoicePopup, setServiceInvoicePopup] = useState<{
    invoice: any;
    billing: any;
    serviceId?: string;
  } | null>(null);

  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [editingInvoiceData, setEditingInvoiceData] = useState<any>(null);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  const [deleteInvoiceModal, setDeleteInvoiceModal] = useState<{
    open: boolean;
    invoice: any | null;
  }>({ open: false, invoice: null });

  // Manual payment modal state
  const [manualPaymentOpen, setManualPaymentOpen] = useState(false);
  const [manualPaymentInvoice, setManualPaymentInvoice] = useState<any>(null);
  const [manualPaymentAmount, setManualPaymentAmount] = useState("");
  const [manualPaymentMethod, setManualPaymentMethod] = useState("E-Transfer");
  const [manualPaymentNotes, setManualPaymentNotes] = useState("");
  const [submittingManualPayment, setSubmittingManualPayment] = useState(false);

  // Refund modals state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedRefundInvoice, setSelectedRefundInvoice] = useState<any>(null);
  const [refundDefaultAmount, setRefundDefaultAmount] = useState<
    number | undefined
  >(undefined);

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] =
    useState<any>(null);
  const [selectedReceiptInvoice, setSelectedReceiptInvoice] =
    useState<any>(null);

  const effectiveOrderUuid =
    orderUuid || orderData?.uuid || billing?.order_uuid;

  const initialInvoicesRef = React.useRef(initialInvoices);
  initialInvoicesRef.current = initialInvoices;

  // Load / refresh billing and invoices
  const loadBillingData = useCallback(async () => {
    if (!orderId && !effectiveOrderUuid) return;
    setLoading(true);
    try {
      let fetchedInvoices = initialInvoicesRef.current;
      if (effectiveOrderUuid) {
        try {
          const invRes = await GetInvoicesByOrder(effectiveOrderUuid);
          fetchedInvoices = Array.isArray(invRes.data)
            ? invRes.data
            : [invRes.data].filter(Boolean);
        } catch (e) {
          console.error("Failed to fetch invoices for order billing:", e);
        }
      }

      let matchedBilling: BillingItem | null = null;
      try {
        const allBillings = await getBillings();
        if (Array.isArray(allBillings)) {
          matchedBilling =
            allBillings.find(
              (b) =>
                String(b.order_id) === String(orderId) ||
                (effectiveOrderUuid && b.order_uuid === effectiveOrderUuid),
            ) || null;
        }
      } catch (e) {
        console.error("Failed to fetch billing list:", e);
      }

      if (!matchedBilling && orderData) {
        matchedBilling = {
          order_id: orderData.id,
          order_uuid: orderData.uuid,
          agent_name: orderData.agent
            ? `${orderData.agent.first_name || ""} ${orderData.agent.last_name || ""}`.trim()
            : null,
          agent_uuid: orderData.agent?.uuid || orderData.agent_uuid,
          property_address: orderData.property?.address || "",
          property_location: orderData.property?.location || "",
          services: (orderData.services || []).map((s: any) => ({
            service_id: s.service_id || s.id,
            service_name: s.service?.name || s.name || "Service",
            amount: parseFloat(s.price || s.amount || 0),
            status: s.status || "pending",
            related_invoices: [],
            order_service_uuid: s.uuid || s.order_service_uuid,
            uuid: s.uuid,
          })),
          total_amount: parseFloat(orderData.total_amount || 0),
          total_paid: parseFloat(orderData.total_paid || 0),
          total_refunded: parseFloat(orderData.total_refunded || 0),
          remaining_amount: Math.max(
            0,
            parseFloat(orderData.total_amount || 0) -
              parseFloat(orderData.total_paid || 0),
          ),
          status: orderData.status || "pending",
          created_at: orderData.created_at,
          slots: orderData.slots || [],
          invoices: (fetchedInvoices || []).map((inv: any) => ({
            invoice_url: inv.invoice_url || inv.hosted_invoice_url || "",
            payment_id: inv.payment_id || null,
            amount: parseFloat(inv.paid_amount || inv.total || 0),
            payment_method: inv.payment_method || "card",
            status: inv.status || "unpaid",
            paid_at: inv.paid_at || inv.updated_at || inv.created_at,
            session_id: inv.session_id || "",
            service_ids: inv.service_ids || 0,
            payment_done_by: inv.payment_done_by || "",
          })),
          package: orderData.package,
          tax_rate: orderData.tax_rate,
          tax_details: orderData.tax_details,
          tax_amount: orderData.tax_amount,
          grand_total: orderData.grand_total,
        };
      }

      setBilling(matchedBilling);
      const filtered = filterVisibleInvoices(
        fetchedInvoices,
        matchedBilling?.services || orderData?.services,
      );
      setInvoices(filtered);
    } catch (err) {
      console.error("Error loading order billing modal:", err);
    } finally {
      setLoading(false);
    }
  }, [orderId, effectiveOrderUuid, orderData]);

  useEffect(() => {
    if (open) {
      loadBillingData();
    }
  }, [open, loadBillingData]);

  // Derived financial & status calculations
  const orderCalculations = useMemo(() => {
    if (!billing) return null;

    const rawInvoices = invoices || [];
    const isSingleSvc = isSingleServiceOrder(billing.services, rawInvoices);

    const targetOrderInvoice = getBestTargetInvoice(
      rawInvoices,
      undefined,
      undefined,
      currentUser,
      userType,
    );

    const primaryInvoice =
      rawInvoices.find(
        (inv) =>
          !isRenewalInvoice(inv) &&
          !isVoidOrCancelled(inv.status) &&
          !inv.notes?.toLowerCase().includes("service invoice") &&
          (inv.agent_type === "primary" || (inv.agent && !inv.split_details)),
      ) ||
      targetOrderInvoice ||
      rawInvoices.find(
        (inv) => !inv.notes?.toLowerCase().includes("service invoice"),
      ) ||
      rawInvoices[0];

    const isOrderPaid =
      billing.status === "paid" ||
      (rawInvoices.length > 0 &&
        rawInvoices.every(
          (inv) =>
            isPaidOrSucceeded(inv.status) || isPartiallyRefunded(inv.status),
        ));

    const isOrderRefunded =
      isRefunded(billing.status) || isRefunded(targetOrderInvoice?.status);

    const actualOrderCancelled =
      isVoidOrCancelled(billing.status) ||
      isVoidOrCancelled((billing as any).order_status) ||
      (rawInvoices.length > 0 &&
        isVoidOrCancelled(rawInvoices[0]?.order?.order_status));

    const hasCancellationFee = rawInvoices.some(
      (inv) =>
        !isVoidOrCancelled(inv.status) &&
        (inv.notes?.toLowerCase().includes("cancellation fee") ||
          inv.items?.some((i: any) =>
            i.description?.toLowerCase().includes("cancellation fee"),
          )),
    );

    const isOrderCancelledOrVoid =
      actualOrderCancelled ||
      (targetOrderInvoice
        ? isVoidOrCancelled(targetOrderInvoice.status)
        : rawInvoices.length > 0 &&
          rawInvoices.every((inv) => isVoidOrCancelled(inv.status)));

    const taxRate = parseFloat(
      primaryInvoice?.tax_rate ||
        (billing.tax_rate != null ? String(billing.tax_rate) : "0"),
    );
    const orderTaxDetails =
      primaryInvoice?.tax_details || billing.tax_details || null;

    const orderHasSplits =
      Boolean((billing as any)?.split_invoice || (billing as any)?.order?.split_invoice || orderData?.split_invoice) ||
      rawInvoices.some(
        (inv: any) =>
          inv.agent_type === "co-agent" ||
          inv.agent_type === "co_agent" ||
          inv.is_co_agent ||
          (inv.split_details?.splits && inv.split_details.splits.length > 1),
      );

    const nonVoidInvoices = rawInvoices.filter(
      (inv) => !isVoidOrCancelled(inv.status) && !isRenewalInvoice(inv),
    );

    const combinedInvoicesTotal = nonVoidInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.total || "0"),
      0,
    );
    const combinedInvoicesSubtotal = nonVoidInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.subtotal || "0"),
      0,
    );
    const combinedInvoicesTax = nonVoidInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.tax_amount || "0"),
      0,
    );
    const combinedInvoicesPaid = nonVoidInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.paid_amount || "0"),
      0,
    );

    const subtotalVal =
      orderHasSplits && combinedInvoicesSubtotal > 0
        ? combinedInvoicesSubtotal
        : primaryInvoice && parseFloat(primaryInvoice.subtotal || "0") > 0 && !orderHasSplits
          ? parseFloat(primaryInvoice.subtotal)
          : billing.total_amount || 0;

    const taxAmount =
      orderHasSplits && combinedInvoicesTax > 0
        ? combinedInvoicesTax
        : primaryInvoice && parseFloat(primaryInvoice.tax_amount || "0") > 0 && !orderHasSplits
          ? parseFloat(primaryInvoice.tax_amount)
          : billing.tax_amount != null
            ? billing.tax_amount
            : subtotalVal * (taxRate / 100);

    const grandTotalVal =
      orderHasSplits && combinedInvoicesTotal > 0
        ? combinedInvoicesTotal
        : primaryInvoice && parseFloat(primaryInvoice.total || "0") > 0 && !orderHasSplits
          ? parseFloat(primaryInvoice.total)
          : billing.grand_total != null
            ? billing.grand_total
            : subtotalVal + taxAmount;

    const totalRefunded = billing.total_refunded || 0;
    const effectiveGrandTotal = Math.max(0, grandTotalVal - totalRefunded);
    const safeRowTotalPaid =
      orderHasSplits && combinedInvoicesPaid > 0
        ? combinedInvoicesPaid
        : Math.max(0, billing.total_paid || 0);
    const rawRowRemaining = effectiveGrandTotal - safeRowTotalPaid;
    const displayRemaining =
      isOrderPaid ||
      isOrderRefunded ||
      (actualOrderCancelled && !hasCancellationFee) ||
      rawRowRemaining <= 0.02
        ? 0
        : Math.max(0, rawRowRemaining);

    // Package discount calculations
    const packageDiscountItem = primaryInvoice?.items?.find((i: any) =>
      i.description?.toLowerCase().includes("package discount"),
    );
    const allOrderDiscountItemsSum = rawInvoices
      .flatMap((inv: any) => inv.items || [])
      .filter((i: any) =>
        i.description?.toLowerCase().includes("package discount"),
      )
      .reduce(
        (sum: number, i: any) => sum + Math.abs(parseFloat(i.amount || "0")),
        0,
      );

    let packageDiscountVal = packageDiscountItem
      ? Math.abs(parseFloat(packageDiscountItem.amount || "0"))
      : allOrderDiscountItemsSum;

    if (packageDiscountVal === 0 && billing.package) {
      const discPercent = parseFloat(
        billing.package.discount ?? billing.package.package_discount ?? "0",
      );
      const discType = (
        billing.package.discount_type ??
        billing.package.package_discount_type ??
        "percentage"
      ).toLowerCase();
      if (discPercent > 0 && discType === "percentage") {
        const originalSubtotal = subtotalVal / (1 - discPercent / 100);
        packageDiscountVal =
          Math.round((originalSubtotal - subtotalVal) * 100) / 100;
      }
    }
    const packageName =
      billing.package?.name || (billing.package as any)?.package_name || null;

    // Check media restrictions
    const filesList: any[] = Array.isArray(filesData)
      ? filesData
      : Array.isArray(filesData?.files)
        ? filesData.files
        : [];
    const linksList: any[] = Array.isArray(filesData?.links)
      ? filesData.links
      : [];
    const hasLinkMedia = (l: any) =>
      l.has_link === true ||
      (l.has_link !== false &&
        ((typeof l.link === "string" && l.link.trim() !== "") ||
          ((l.link === null || l.link === undefined) && Boolean(l.uuid || l.id))));

    const servicesWithoutMedia =
      userType === "agent" && filesData
        ? billing.services.filter((svc) => {
            const svcId = svc.service_id;
            const matchItem = (f: any) =>
              f.service?.id === svcId ||
              f.service_id === svcId ||
              (svc.uuid && f.service?.uuid === svc.uuid) ||
              (svc.order_service_uuid &&
                f.service?.uuid === svc.order_service_uuid);
            const hasMedia =
              filesList.some(matchItem) ||
              linksList.some((l: any) => hasLinkMedia(l) && matchItem(l));
            return !hasMedia;
          })
        : [];
    const payAllBlockedByMedia =
      userType === "agent" && servicesWithoutMedia.length > 0;

    const isPartiallyRefundedOrder =
      isPartiallyRefunded(billing.status) ||
      isPartiallyRefunded(primaryInvoice?.status);

    const shouldShowPayAll =
      displayRemaining > 0 &&
      (!isOrderCancelledOrVoid || hasCancellationFee) &&
      !isOrderPaid &&
      !isOrderRefunded &&
      !isPartiallyRefundedOrder;

    const orderInvoiceUrl =
      primaryInvoice?.invoice_url ||
      primaryInvoice?.hosted_invoice_url ||
      billing.invoices?.find((inv) => inv.invoice_url)?.invoice_url ||
      null;

    return {
      isSingleSvc,
      targetOrderInvoice,
      primaryInvoice,
      isOrderPaid,
      isOrderRefunded,
      isOrderCancelledOrVoid,
      actualOrderCancelled,
      hasCancellationFee,
      taxRate,
      orderTaxDetails,
      subtotalVal,
      taxAmount,
      grandTotalVal,
      totalRefunded,
      safeRowTotalPaid,
      displayRemaining,
      packageDiscountVal,
      packageName,
      servicesWithoutMedia,
      payAllBlockedByMedia,
      shouldShowPayAll,
      orderInvoiceUrl,
    };
  }, [billing, invoices, currentUser, userType, filesData]);

  // Handle PDF Download
  const handleDownloadInvoice = async (inv: any) => {
    if (!inv?.uuid) return;
    setDownloadingUuid(inv.uuid);
    try {
      await DownloadInvoice(inv.uuid, inv.invoice_number || inv.id);
      toast.success("Invoice downloaded successfully");
    } catch (err) {
      console.error("Failed to download invoice PDF:", err);
      toast.error("Failed to download invoice PDF");
    } finally {
      setDownloadingUuid(null);
    }
  };

  // Handle Stripe Payment
  const handlePayInvoice = async (
    invoice: any,
    mode?: "on_behalf" | "self",
  ) => {
    if (!billing) return;
    setActionLoading({ id: invoice.uuid || billing.order_id, action: "pay" });
    try {
      const isSplit = !!invoice.split_details;
      const payerUuid = userType === "agent" ? currentUser?.uuid : undefined;
      const isOwner =
        currentUser?.uuid === (invoice.agent?.uuid || invoice.agent_uuid);

      let paymentMode: "on_behalf" | "self" | undefined = mode;
      if (isSplit && !paymentMode) {
        if (isOwner) {
          paymentMode = "self";
        } else {
          paymentMode =
            invoice.agent_type === "primary" && userType !== "admin"
              ? "self"
              : "on_behalf";
        }
      }

      await PayInvoiceWithStripe(
        invoice,
        { agent: { uuid: billing.agent_uuid }, id: billing.order_id },
        typeof window !== "undefined"
          ? window.location.href
          : "dashboard/billing",
        undefined,
        isSplit ? paymentMode : undefined,
        isSplit ? payerUuid : undefined,
      );
    } catch (err) {
      console.error("Failed to initiate Stripe payment:", err);
      toast.error("Failed to initiate payment.");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Open Manual Payment
  const handleOpenManualPayment = (invoice: any) => {
    setManualPaymentInvoice(invoice);
    const totalVal = parseFloat(invoice.total || invoice.total_amount || "0");
    const paidVal = parseFloat(
      invoice.paid_amount || invoice.total_paid || "0",
    );
    const remaining = Math.max(0, totalVal - paidVal);
    setManualPaymentAmount(remaining.toFixed(2));
    setManualPaymentMethod("E-Transfer");
    setManualPaymentNotes("");
    setManualPaymentOpen(true);
  };

  // Submit Manual Payment
  const handleSubmitManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPaymentInvoice) return;

    const amountNum = parseFloat(manualPaymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    try {
      setSubmittingManualPayment(true);
      const response = await MarkPaid(
        manualPaymentInvoice.uuid,
        amountNum,
        undefined,
        undefined,
        manualPaymentMethod,
        manualPaymentNotes,
      );

      if (response.success) {
        toast.success(
          response.message || "Manual payment recorded successfully!",
        );
        setManualPaymentOpen(false);
        setManualPaymentInvoice(null);
        await loadBillingData();
        if (onRefreshInvoices) await onRefreshInvoices();
      } else {
        toast.error(response.message || "Failed to record manual payment.");
      }
    } catch (err: any) {
      console.error("Error submitting manual payment:", err);
      toast.error(err.message || "Failed to record manual payment.");
    } finally {
      setSubmittingManualPayment(false);
    }
  };

  // Handle View Receipt
  const handleViewRefundReceipt = (txn: any) => {
    setSelectedReceiptPayment(txn);
    const matchingInv =
      invoices.find((inv) => inv.id === txn.id || inv.uuid === txn.uuid) ||
      orderCalculations?.primaryInvoice ||
      {};
    setSelectedReceiptInvoice(matchingInv);
    setReceiptModalOpen(true);
  };

  // Open invoice document viewer
  const handleOpenInvoiceDoc = (
    targetInv: any,
    serviceUuid?: string,
    serviceNumericId?: any,
  ) => {
    if (!targetInv) return;
    const matchedService = serviceUuid
      ? billing?.services?.find(
          (s: any) =>
            s.uuid === serviceUuid ||
            s.order_service_uuid === serviceUuid ||
            s.service_id === serviceNumericId,
        )
      : null;

    const isSingle = orderCalculations?.isSingleSvc;
    const preview = isSingle
      ? prepareOrderInvoicePreview(invoices, targetInv, billing) || targetInv
      : serviceUuid
        ? prepareServiceInvoicePreview(
            targetInv,
            serviceUuid,
            serviceNumericId,
            matchedService?.service_name,
          ) || targetInv
        : prepareOrderInvoicePreview(invoices, targetInv, billing) || targetInv;

    setServiceInvoicePopup({
      invoice: preview,
      billing,
      serviceId: serviceUuid,
    });
  };

  // Edit invoice items
  const updateInvoiceItem = (index: number, field: string, value: any) => {
    setEditingInvoiceData((prev: any) => {
      const current = prev || serviceInvoicePopup?.invoice;
      const newItems = [...(current?.items || [])];
      newItems[index] = { ...newItems[index], [field]: value };

      if (field === "quantity" || field === "unit_price") {
        const qty = parseFloat(newItems[index].quantity || "0");
        const price = parseFloat(newItems[index].unit_price || "0");
        newItems[index].amount = (qty * price).toFixed(2);
      }

      const subtotal = newItems.reduce(
        (acc: number, item: any) => acc + parseFloat(item.amount || "0"),
        0,
      );
      const taxRate = parseFloat(current?.tax_rate || "0");
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      return {
        ...current,
        items: newItems,
        subtotal: subtotal.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total: total.toFixed(2),
      };
    });
  };

  const addInvoiceItem = () => {
    setEditingInvoiceData((prev: any) => {
      const current = prev || serviceInvoicePopup?.invoice;
      const newItems = [
        ...(current?.items || []),
        {
          description: "",
          quantity: 1,
          unit_price: 0,
          amount: 0,
          gst_enabled: true,
          pst_enabled: false,
        },
      ];
      return { ...current, items: newItems };
    });
  };

  const removeInvoiceItem = (index: number) => {
    setEditingInvoiceData((prev: any) => {
      const current = prev || serviceInvoicePopup?.invoice;
      const newItems = (current?.items || []).filter(
        (_: any, i: number) => i !== index,
      );
      const subtotal = newItems.reduce(
        (acc: number, item: any) => acc + parseFloat(item.amount || "0"),
        0,
      );
      const taxRate = parseFloat(current?.tax_rate || "0");
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      return {
        ...current,
        items: newItems,
        subtotal: subtotal.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total: total.toFixed(2),
      };
    });
  };

  const updateInvoiceTaxRate = (val: string) => {
    setEditingInvoiceData((prev: any) => {
      const current = prev || serviceInvoicePopup?.invoice;
      const subtotal = parseFloat(current?.subtotal || "0");
      const taxRate = parseFloat(val || "0");
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      return {
        ...current,
        tax_rate: val,
        tax_amount: taxAmount.toFixed(2),
        total: total.toFixed(2),
      };
    });
  };

  const handleSaveInvoice = async () => {
    const currentInvoice = serviceInvoicePopup?.invoice;
    const targetUuid = currentInvoice?.uuid;
    if (!editingInvoiceData || !targetUuid) return;

    setIsSavingInvoice(true);
    try {
      await UpdateInvoice(targetUuid, {
        notes: editingInvoiceData.notes,
        tax_rate: editingInvoiceData.tax_rate,
        items: editingInvoiceData.items.map((item: any) => ({
          uuid: item.uuid,
          description: item.description,
          quantity: parseInt(item.quantity || "1", 10),
          unit_price: parseFloat(item.unit_price || "0"),
          order_service_uuid:
            item.order_service?.uuid ||
            item.orderService?.uuid ||
            item.order_service_uuid,
        })),
      });

      toast.success("Invoice updated successfully!");
      setServiceInvoicePopup((prev) =>
        prev
          ? { ...prev, invoice: { ...prev.invoice, ...editingInvoiceData } }
          : null,
      );
      setIsEditingInvoice(false);
      setEditingInvoiceData(null);
      await loadBillingData();
      if (onRefreshInvoices) await onRefreshInvoices();
    } catch (err: any) {
      console.error("Failed to save invoice edits:", err);
      toast.error(err.message || "Failed to update invoice.");
    } finally {
      setIsSavingInvoice(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[96vw] max-w-[1300px] xl:max-w-[1400px] h-[92vh] max-h-[92vh] rounded-[8px] p-0 font-alexandria overflow-hidden flex flex-col [&>button]:hidden shadow-2xl bg-white border border-[#BBBBBB]">
          {/* Header */}
          <DialogHeader className="p-4 md:p-5 border-b border-[#E4E4E4] bg-white shrink-0">
            <DialogTitle
              className="flex items-center justify-between text-[16px] md:text-[18px] font-[600] uppercase tracking-wide"
              style={{ color: roleSettings.pageTabColor }}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span>
                  Order Billing &amp; Invoices — #{billing?.order_id || orderId}
                </span>
              </div>
              <Button
                className="border-none !shadow-none bg-transparent hover:bg-transparent p-0"
                onClick={() => onOpenChange(false)}
              >
                <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D] hover:text-black transition-colors" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gray-50/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2
                  className="h-8 w-8 animate-spin"
                  style={{ color: roleSettings.pageTabColor }}
                />
                <span className="text-xs text-gray-500">
                  Loading billing details...
                </span>
              </div>
            ) : !billing || !orderCalculations ? (
              <div className="text-center py-16 italic text-gray-500">
                Billing information not found for this order.
              </div>
            ) : (
              <>
                {/* 1. ORDER SUMMARY CARD - EXACT BILLING SCREEN UI */}
                <div className="bg-white p-6 rounded-[6px] border border-[#BBBBBB] shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 md:gap-0">
                    <h3
                      className="text-[16px] font-[600] uppercase tracking-wide font-alexandria m-0"
                      style={{ color: roleSettings.pageTabColor }}
                    >
                      Order Summary
                    </h3>
                    <div className="flex flex-wrap items-center gap-4">
                      {orderCalculations.orderInvoiceUrl && (
                        <a
                          href={orderCalculations.orderInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-medium hover:underline"
                          style={{ color: roleSettings.activeColor }}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Stripe Invoice
                        </a>
                      )}
                      <div className="flex flex-wrap gap-2 items-center">
                        {orderCalculations.targetOrderInvoice ? (
                          <>
                            <Button
                              onClick={() =>
                                handleOpenInvoiceDoc(
                                  orderCalculations.targetOrderInvoice,
                                )
                              }
                              className="h-[35px] px-4 border border-[#BBBBBB] text-[#666666] bg-white rounded-[6px] text-xs font-normal transition-colors flex items-center justify-center min-w-[100px] cursor-pointer"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  roleSettings.pageTabColor;
                                e.currentTarget.style.color = "white";
                                e.currentTarget.style.borderColor =
                                  roleSettings.pageTabColor;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "white";
                                e.currentTarget.style.color = "#666666";
                                e.currentTarget.style.borderColor = "#BBBBBB";
                              }}
                            >
                              Invoice
                            </Button>
                            <Button
                              onClick={() =>
                                handleDownloadInvoice(
                                  orderCalculations.targetOrderInvoice,
                                )
                              }
                              disabled={
                                downloadingUuid ===
                                orderCalculations.targetOrderInvoice.uuid
                              }
                              className="h-[35px] px-3 border border-[#BBBBBB] text-[#666666] bg-white rounded-[6px] text-xs font-normal transition-colors flex items-center justify-center cursor-pointer gap-1.5"
                              title="Download Invoice PDF"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  roleSettings.pageTabColor;
                                e.currentTarget.style.color = "white";
                                e.currentTarget.style.borderColor =
                                  roleSettings.pageTabColor;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "white";
                                e.currentTarget.style.color = "#666666";
                                e.currentTarget.style.borderColor = "#BBBBBB";
                              }}
                            >
                              {downloadingUuid ===
                              orderCalculations.targetOrderInvoice.uuid ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Download className="h-3.5 w-3.5" />
                              )}
                              <span>Download PDF</span>
                            </Button>
                          </>
                        ) : (
                          <Button
                            disabled
                            className="h-[35px] px-4 border border-gray-200 text-gray-400 bg-gray-100 rounded-[6px] text-xs font-normal flex items-center justify-center min-w-[100px] cursor-not-allowed opacity-80"
                          >
                            No Invoice
                          </Button>
                        )}

                        {orderCalculations.shouldShowPayAll &&
                          (orderCalculations.payAllBlockedByMedia ? (
                            <TooltipProvider delayDuration={0}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-block cursor-not-allowed">
                                    <Button
                                      disabled
                                      className="h-[35px] px-4 text-white rounded-[6px] text-xs font-normal opacity-50 cursor-not-allowed min-w-[100px]"
                                      style={{
                                        backgroundColor:
                                          roleSettings.pageTabColor,
                                      }}
                                    >
                                      {orderCalculations.hasCancellationFee
                                        ? "Pay Cancellation Fee"
                                        : "Pay All"}
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="left"
                                  align="center"
                                  className="max-w-xs bg-gray-900 text-white p-3 rounded-md shadow-2xl border border-gray-700 z-[99999] text-left font-sans leading-relaxed"
                                >
                                  <span className="font-semibold block mb-1 text-amber-400">
                                    ⚠ Payment Unavailable
                                  </span>
                                  <span>
                                    Media has not yet been uploaded for all
                                    services. Payment will be available once
                                    media is uploaded.
                                  </span>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <Button
                              onClick={() => {
                                if (orderCalculations.targetOrderInvoice) {
                                  handlePayInvoice(
                                    orderCalculations.targetOrderInvoice,
                                  );
                                }
                              }}
                              disabled={actionLoading !== null}
                              className="h-[35px] px-4 text-white rounded-[6px] text-xs font-normal transition-all flex items-center justify-center min-w-[100px] cursor-pointer hover:brightness-110 active:scale-[0.98]"
                              style={{
                                backgroundColor: roleSettings.pageTabColor,
                              }}
                            >
                              {actionLoading?.action === "pay" ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                                  Processing...
                                </>
                              ) : orderCalculations.hasCancellationFee ? (
                                "Pay Cancellation Fee"
                              ) : (
                                "Pay All"
                              )}
                            </Button>
                          ))}

                        {role === "admin" &&
                          orderCalculations.shouldShowPayAll &&
                          orderCalculations.targetOrderInvoice && (
                            <Button
                              onClick={() =>
                                handleOpenManualPayment(
                                  orderCalculations.targetOrderInvoice,
                                )
                              }
                              className="h-[35px] px-4 text-emerald-600 bg-white border border-emerald-500 rounded-[6px] text-xs font-normal transition-all flex items-center justify-center min-w-[100px] cursor-pointer hover:bg-emerald-600 hover:text-white active:scale-[0.98]"
                            >
                              Mark Paid
                            </Button>
                          )}

                        {orderCalculations.isOrderPaid &&
                          !orderCalculations.isOrderRefunded && (
                            <Button
                              disabled
                              className="h-[35px] px-4 text-white rounded-[6px] text-xs font-normal flex items-center justify-center min-w-[100px] bg-[#6BAE41] cursor-not-allowed opacity-90"
                            >
                              Paid
                            </Button>
                          )}

                        {role === "admin" &&
                          orderCalculations.isOrderPaid &&
                          !orderCalculations.isOrderRefunded && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                if (orderCalculations.targetOrderInvoice) {
                                  setSelectedRefundInvoice(
                                    orderCalculations.targetOrderInvoice,
                                  );
                                  setRefundDefaultAmount(
                                    orderCalculations.grandTotalVal,
                                  );
                                  setRefundModalOpen(true);
                                }
                              }}
                              className="h-[35px] px-4 border border-orange-200 text-orange-600 rounded-[6px] text-xs font-normal transition-colors flex items-center justify-center min-w-[100px] cursor-pointer hover:bg-orange-50"
                            >
                              <RotateCcw className="h-4 w-4 mr-2" /> Refund
                            </Button>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Order Property & Vendor Info Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                    <div className="min-w-0">
                      <p className="text-gray-600 mb-1">Property Address</p>
                      <p className="font-medium whitespace-normal break-words leading-snug">
                        {billing.property_address || "—"}
                        {billing.property_location
                          ? `, ${billing.property_location}`
                          : ""}
                      </p>
                    </div>
                    {role !== "agent" && (
                      <div className="min-w-0">
                        <p className="text-gray-600 mb-1">Vendors</p>
                        <p className="font-medium whitespace-normal break-words leading-snug">
                          {Array.from(
                            new Set(
                              billing.slots
                                .map((slot) => slot.vendor_name)
                                .filter((name): name is string =>
                                  Boolean(name && name.trim()),
                                ),
                            ),
                          ).join(", ") || "—"}
                        </p>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-gray-600 mb-1">Created Date</p>
                      <p className="font-medium whitespace-normal break-words leading-snug">
                        {formatOrderDate(billing.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Financial Breakdown Grid */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-4 text-sm font-alexandria">
                    <div className="flex flex-wrap gap-6">
                      {orderCalculations.packageDiscountVal > 0 && (
                        <>
                          <div>
                            <span className="text-gray-500 block text-xs">
                              Original Subtotal
                            </span>
                            <span className="font-semibold text-gray-500 line-through">
                              {(
                                orderCalculations.subtotalVal +
                                orderCalculations.packageDiscountVal
                              ).toLocaleString("en-US", {
                                style: "currency",
                                currency: "USD",
                              })}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-xs">
                              Discount{" "}
                              {orderCalculations.packageName
                                ? `(${orderCalculations.packageName})`
                                : ""}
                            </span>
                            <span className="font-semibold text-emerald-600">
                              -
                              {orderCalculations.packageDiscountVal.toLocaleString(
                                "en-US",
                                {
                                  style: "currency",
                                  currency: "USD",
                                },
                              )}
                            </span>
                          </div>
                        </>
                      )}

                      <div>
                        <span className="text-gray-500 block text-xs">
                          Subtotal
                        </span>
                        <span className="font-semibold text-gray-700">
                          {orderCalculations.subtotalVal.toLocaleString(
                            "en-US",
                            {
                              style: "currency",
                              currency: "USD",
                            },
                          )}
                        </span>
                      </div>

                      {orderCalculations.orderTaxDetails &&
                      Object.keys(orderCalculations.orderTaxDetails).length >
                        0 ? (
                        Object.entries(orderCalculations.orderTaxDetails).map(
                          ([taxKey, taxVal]: [string, any]) => {
                            const rate =
                              taxVal?.rate ?? orderCalculations.taxRate;
                            const amt = parseFloat(taxVal?.amount || 0);
                            return (
                              <div key={taxKey}>
                                <span className="text-gray-500 block text-xs">
                                  {taxKey} ({rate}%)
                                </span>
                                <span className="font-semibold text-[#DC9600]">
                                  {amt.toLocaleString("en-US", {
                                    style: "currency",
                                    currency: "USD",
                                  })}
                                </span>
                              </div>
                            );
                          },
                        )
                      ) : orderCalculations.taxRate > 0 ? (
                        <div>
                          <span className="text-gray-500 block text-xs">
                            GST/HST ({orderCalculations.taxRate}%)
                          </span>
                          <span className="font-semibold text-[#DC9600]">
                            {orderCalculations.taxAmount.toLocaleString(
                              "en-US",
                              {
                                style: "currency",
                                currency: "USD",
                              },
                            )}
                          </span>
                        </div>
                      ) : null}

                      <div>
                        <span className="text-gray-500 block text-xs">
                          Grand Total
                        </span>
                        <span className="font-bold text-gray-800">
                          {orderCalculations.grandTotalVal.toLocaleString(
                            "en-US",
                            {
                              style: "currency",
                              currency: "USD",
                            },
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500 block text-xs">
                          Total Paid
                        </span>
                        <span className="font-semibold text-[#6BAE41]">
                          {(orderCalculations.isOrderRefunded
                            ? 0
                            : orderCalculations.safeRowTotalPaid
                          ).toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          })}
                        </span>
                      </div>

                      {orderCalculations.totalRefunded > 0 && (
                        <div>
                          <span className="text-gray-500 block text-xs">
                            Total Refunded
                          </span>
                          <span className="font-semibold text-red-500">
                            {orderCalculations.totalRefunded.toLocaleString(
                              "en-US",
                              {
                                style: "currency",
                                currency: "USD",
                              },
                            )}
                          </span>
                        </div>
                      )}

                      <div>
                        <span className="text-gray-500 block text-xs">
                          Balance Due
                        </span>
                        <span className="font-bold text-[#E06D5E]">
                          {orderCalculations.displayRemaining.toLocaleString(
                            "en-US",
                            {
                              style: "currency",
                              currency: "USD",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. TRANSACTION HISTORY & RECEIPTS (PAYMENT BREAKDOWN) */}
                  {billing.invoices && billing.invoices.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
                        Transaction History
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 text-xs">
                          <thead>
                            <tr className="text-left text-gray-500 font-semibold uppercase tracking-wider">
                              <th className="pb-2">Date</th>
                              <th className="pb-2">Type</th>
                              <th className="pb-2">Method</th>
                              <th className="pb-2 text-right">Amount</th>
                              <th className="pb-2 text-center">Receipt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-gray-600">
                            {billing.invoices.map((txn: any, idx: number) => {
                              const isRefund =
                                txn.status === "refunded" ||
                                parseFloat(txn.amount) < 0;
                              const displayAmount = Math.abs(
                                parseFloat(txn.amount || "0"),
                              );
                              return (
                                <tr key={idx}>
                                  <td className="py-2.5">
                                    {txn.paid_at
                                      ? formatOrderDate(txn.paid_at)
                                      : "—"}
                                  </td>
                                  <td className="py-2.5 font-semibold">
                                    {isRefund ? (
                                      <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                        Refund
                                      </span>
                                    ) : (
                                      <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                        Payment
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 capitalize">
                                    {txn.payment_method || "manual"}
                                  </td>
                                  <td
                                    className={`py-2.5 text-right font-semibold ${
                                      isRefund
                                        ? "text-red-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    {isRefund ? "-" : ""}$
                                    {displayAmount.toFixed(2)}
                                  </td>
                                  <td className="py-2.5 text-center">
                                    {isRefund ? (
                                      <Button
                                        variant="link"
                                        className="text-blue-600 hover:text-blue-800 p-0 h-auto text-xs font-medium"
                                        onClick={() =>
                                          handleViewRefundReceipt(txn)
                                        }
                                      >
                                        View Receipt
                                      </Button>
                                    ) : txn.invoice_url ? (
                                      <a
                                        href={txn.invoice_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        Stripe
                                      </a>
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. SERVICES LIST - EXACT BILLING SCREEN UI (ZERO SPLITS SHOWN FOR NORMAL SERVICES) */}
                <div className="space-y-3">
                  <h3
                    className="text-[16px] font-[600] uppercase tracking-wide font-alexandria"
                    style={{ color: roleSettings.pageTabColor }}
                  >
                    Services ({billing.services.length})
                  </h3>

                  {(() => {
                    const orderHasSplits =
                      Boolean((billing as any)?.split_invoice || (billing as any)?.order?.split_invoice || orderData?.split_invoice) ||
                      invoices.some(
                        (inv: any) =>
                          inv.agent_type === "co-agent" ||
                          inv.agent_type === "co_agent" ||
                          inv.is_co_agent ||
                          (inv.split_details?.splits && inv.split_details.splits.length > 1),
                      );

                    let mainSplitPct = 50;
                    let coSplitPct = 50;
                    let coAgentName = "Co-Agent";

                    const splitInv = invoices.find(
                      (inv: any) => inv.split_details?.splits && inv.split_details.splits.length > 0,
                    );
                    if (splitInv?.split_details?.splits) {
                      const primarySplit = splitInv.split_details.splits.find(
                        (s: any) => s.type === "primary" || s.role === "primary",
                      );
                      const coSplit = splitInv.split_details.splits.find(
                        (s: any) =>
                          s.type === "co-agent" ||
                          s.type === "co_agent" ||
                          s.role === "co-agent",
                      );
                      if (primarySplit?.percentage) mainSplitPct = Number(primarySplit.percentage);
                      if (coSplit?.percentage) coSplitPct = Number(coSplit.percentage);
                      if (coSplit?.name) coAgentName = coSplit.name;
                    } else {
                      const rawCo =
                        (billing as any)?.co_agents ||
                        (billing as any)?.coagents ||
                        orderData?.co_agents;
                      let coList: any[] = [];
                      if (Array.isArray(rawCo)) coList = rawCo;
                      else if (typeof rawCo === "string") {
                        try {
                          const parsed = JSON.parse(rawCo);
                          if (Array.isArray(parsed)) coList = parsed;
                        } catch {}
                      }
                      if (coList.length > 0) {
                        const firstCo = coList[0];
                        const pct = Number(
                          firstCo.split || firstCo.split_percentage || firstCo.percentage || 50,
                        );
                        coSplitPct = pct;
                        mainSplitPct = 100 - pct;
                        if (firstCo.name || firstCo.first_name) {
                          coAgentName =
                            firstCo.name ||
                            `${firstCo.first_name || ""} ${firstCo.last_name || ""}`.trim();
                        }
                      }
                    }

                    const mainAgentInvoices = invoices.filter(
                      (inv: any) =>
                        inv.agent_type === "primary" ||
                        (!inv.split_details &&
                          inv.agent_type !== "co-agent" &&
                          inv.agent_type !== "co_agent"),
                    );
                    const coAgentInvoices = invoices.filter(
                      (inv: any) =>
                        inv.agent_type === "co-agent" ||
                        inv.agent_type === "co_agent" ||
                        inv.is_co_agent ||
                        (inv.split_details && inv.agent_type !== "primary"),
                    );

                    const renderOrderServiceCard = (service: any, currentSplitMultiplier: number, isCoAgentSection: boolean) => {
                    const serviceUuid =
                      service.uuid || service.order_service_uuid;
                    const serviceTargetInvoice = getBestTargetInvoice(
                      invoices,
                      serviceUuid,
                      service.service_id,
                      currentUser,
                      userType,
                    );

                    const isServiceRefunded =
                      isRefunded(service.status) ||
                      isRefunded(serviceTargetInvoice?.status);
                    const isServicePartiallyRefunded =
                      !isServiceRefunded &&
                      (isPartiallyRefunded(service.status) ||
                        isPartiallyRefunded(serviceTargetInvoice?.status));
                    const isServicePaid =
                      (isPaidOrSucceeded(service.status) ||
                        isPaidOrSucceeded(serviceTargetInvoice?.status) ||
                        billing.status === "paid" ||
                        (parseFloat(serviceTargetInvoice?.paid_amount || 0) >
                          0 &&
                          parseFloat(serviceTargetInvoice?.paid_amount || 0) >=
                            parseFloat(serviceTargetInvoice?.total || 0) -
                              0.01)) &&
                      !isServiceRefunded &&
                      !isServicePartiallyRefunded;
                    const isServiceInProgress =
                      userType === "agent" &&
                      !isServicePaid &&
                      !isServiceRefunded &&
                      !isServicePartiallyRefunded &&
                      orderCalculations.servicesWithoutMedia.some(
                        (s: any) =>
                          (service.uuid && s.uuid === service.uuid) ||
                          (service.order_service_uuid &&
                            s.order_service_uuid === service.order_service_uuid) ||
                          s.service_id === service.service_id,
                      );
                    const isServiceCompleted = !isServiceInProgress;

                    const pricing = getServiceActualInvoicePricing({
                      invoices,
                      service,
                      splitMultiplier: currentSplitMultiplier,
                      isCoAgentUser: isCoAgentSection,
                      userType,
                      currentUser,
                      fallbackTaxRate: orderCalculations.taxRate,
                    });

                    return (
                      <div
                        key={service.service_id}
                        className="border border-[#BBBBBB] rounded-[6px] bg-white p-4 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            {/* Service Header Row */}
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-4">
                                <p className="font-semibold text-gray-800">
                                  {service.service_name}
                                </p>
                                <span
                                  className={`px-2 py-0.5 text-[10px] rounded-full text-white font-medium uppercase ml-2 ${
                                    isServicePartiallyRefunded
                                      ? "bg-[#D97706]"
                                      : isServicePaid
                                        ? "bg-[#6BAE41]"
                                        : isServiceRefunded
                                          ? "bg-[#DC9600]"
                                          : service.status === "pending"
                                            ? "bg-[#DC9600]"
                                            : service.status === "cancelled"
                                              ? "bg-[#E06D5E]"
                                              : "bg-[#7D7D7D]"
                                  }`}
                                >
                                  {isServicePartiallyRefunded
                                    ? "partially refunded"
                                    : isServicePaid
                                      ? "paid"
                                      : isServiceRefunded
                                        ? "refunded"
                                        : service.status || "unpaid"}
                                </span>
                              </div>

                              {/* Service Action Buttons */}
                              <div className="flex gap-2">
                                {!isServiceCompleted && role === "agent" ? (
                                  <>
                                    <Button
                                      disabled
                                      className="h-[30px] px-3 bg-[#666666] border border-[#666666] text-white rounded-[6px] text-xs font-medium flex items-center justify-center min-w-[90px] cursor-not-allowed shadow-none"
                                    >
                                      Invoice
                                    </Button>
                                    <Button
                                      disabled
                                      className="h-[30px] px-3 bg-[#666666] border border-[#666666] text-white rounded-[6px] text-xs font-medium flex items-center justify-center min-w-[90px] cursor-not-allowed shadow-none"
                                    >
                                      In Progress
                                    </Button>
                                  </>
                                ) : serviceTargetInvoice ? (
                                  <Button
                                    onClick={() =>
                                      handleOpenInvoiceDoc(
                                        serviceTargetInvoice,
                                        serviceUuid,
                                        service.service_id,
                                      )
                                    }
                                    className="h-[30px] px-3 bg-white border border-[#BBBBBB] text-[#666666] rounded-[6px] text-xs font-normal transition-colors flex items-center justify-center min-w-[90px] cursor-pointer hover:bg-gray-50"
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor =
                                        roleSettings.pageTabColor;
                                      e.currentTarget.style.color = "white";
                                      e.currentTarget.style.borderColor =
                                        roleSettings.pageTabColor;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor =
                                        "white";
                                      e.currentTarget.style.color = "#666666";
                                      e.currentTarget.style.borderColor =
                                        "#BBBBBB";
                                    }}
                                  >
                                    Invoice
                                  </Button>
                                ) : (
                                  <Button
                                    disabled
                                    className="h-[30px] px-3 bg-[#666666] border border-[#666666] text-white rounded-[6px] text-xs font-medium flex items-center justify-center min-w-[90px] cursor-not-allowed shadow-none"
                                  >
                                    No Invoice
                                  </Button>
                                )}

                                {!isServicePaid &&
                                  !isServiceRefunded &&
                                  !isServicePartiallyRefunded &&
                                  (isServiceCompleted || role !== "agent") && (
                                    <>
                                      <Button
                                        onClick={() => {
                                          if (serviceTargetInvoice) {
                                            handlePayInvoice(
                                              serviceTargetInvoice,
                                            );
                                          }
                                        }}
                                        disabled={actionLoading !== null}
                                        className="h-[30px] px-3 text-white rounded-[6px] text-xs font-normal transition-all flex items-center justify-center min-w-[90px] cursor-pointer hover:brightness-110 active:scale-[0.98]"
                                        style={{
                                          backgroundColor:
                                            roleSettings.pageTabColor,
                                        }}
                                      >
                                        {role === "agent" ? "Pay to Download" : "Pay Now"}
                                      </Button>

                                      {role === "admin" &&
                                        serviceTargetInvoice && (
                                          <Button
                                            onClick={() =>
                                              handleOpenManualPayment(
                                                serviceTargetInvoice,
                                              )
                                            }
                                            disabled={actionLoading !== null}
                                            className="h-[30px] px-3 text-emerald-600 bg-white border border-emerald-500 rounded-[6px] text-xs font-normal transition-all flex items-center justify-center min-w-[90px] cursor-pointer hover:bg-emerald-600 hover:text-white active:scale-[0.98]"
                                          >
                                            Mark Paid
                                          </Button>
                                        )}
                                    </>
                                  )}
                              {isServicePaid && (
                                  <>
                                    <Button
                                      disabled
                                      className="h-[30px] px-3 text-white rounded-[6px] text-xs font-normal flex items-center justify-center min-w-[90px] bg-[#6BAE41] cursor-not-allowed opacity-90"
                                    >
                                      Paid
                                    </Button>
                                    {role === "admin" &&
                                      serviceTargetInvoice && (
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedRefundInvoice(
                                              serviceTargetInvoice,
                                            );
                                            setRefundDefaultAmount(
                                              pricing.totalPrice,
                                            );
                                            setRefundModalOpen(true);
                                          }}
                                          className="h-[30px] px-3 border border-orange-200 text-orange-600 rounded-[6px] text-xs font-normal transition-colors flex items-center justify-center min-w-[90px] cursor-pointer hover:bg-orange-50"
                                        >
                                          <RotateCcw className="h-4 w-4 mr-2" />{" "}
                                          Refund
                                        </Button>
                                      )}
                                  </>
                                )}

                                {isServicePartiallyRefunded && (
                                  <>
                                    <Button
                                      disabled
                                      className="h-[30px] px-3 text-white rounded-[6px] text-xs font-normal flex items-center justify-center min-w-[120px] bg-[#D97706] cursor-not-allowed opacity-90"
                                    >
                                      Partially Refunded
                                    </Button>
                                    {role === "admin" &&
                                      serviceTargetInvoice && (
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedRefundInvoice(
                                              serviceTargetInvoice,
                                            );
                                            setRefundDefaultAmount(
                                              pricing.totalPrice,
                                            );
                                            setRefundModalOpen(true);
                                          }}
                                          className="h-[30px] px-3 border border-orange-200 text-orange-600 rounded-[6px] text-xs font-normal transition-colors flex items-center justify-center min-w-[90px] cursor-pointer hover:bg-orange-50"
                                        >
                                          <RotateCcw className="h-4 w-4 mr-2" />{" "}
                                          Refund
                                        </Button>
                                      )}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Service Pricing Details - EXACT 1:1 COLORS FROM BILLING SCREEN */}
                            <div className="text-sm text-gray-600 space-y-0.5">
                              <p>
                                Base Price:{" "}
                                <span className="font-medium text-gray-800">
                                  {pricing.originalPrice &&
                                  pricing.discountAmount &&
                                  pricing.discountAmount > 0 ? (
                                    <>
                                      <span className="line-through text-gray-400 font-normal mr-1.5">
                                        {pricing.originalPrice.toLocaleString(
                                          "en-US",
                                          {
                                            style: "currency",
                                            currency: "USD",
                                          },
                                        )}
                                      </span>
                                      <span>
                                        {pricing.basePrice.toLocaleString(
                                          "en-US",
                                          {
                                            style: "currency",
                                            currency: "USD",
                                          },
                                        )}
                                      </span>
                                    </>
                                  ) : (
                                    pricing.basePrice.toLocaleString("en-US", {
                                      style: "currency",
                                      currency: "USD",
                                    })
                                  )}
                                </span>
                                {pricing.discountAmount &&
                                pricing.discountAmount > 0 ? (
                                  <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Discount: -
                                    {pricing.discountAmount.toLocaleString(
                                      "en-US",
                                      {
                                        style: "currency",
                                        currency: "USD",
                                      },
                                    )}
                                  </span>
                                ) : null}
                              
                                {orderHasSplits && (
                                  <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                    {Math.round(currentSplitMultiplier * 100)}% share
                                  </span>
                                )}</p>

                              {pricing.taxDetails &&
                              Object.keys(pricing.taxDetails).length > 0 ? (
                                Object.entries(pricing.taxDetails).map(
                                  ([taxKey, taxVal]: [string, any]) => {
                                    const rate =
                                      taxVal?.rate ?? pricing.appliedTaxRate;
                                    const amt = parseFloat(taxVal?.amount || 0);
                                    return (
                                      <p
                                        key={taxKey}
                                        className="text-xs text-gray-500"
                                      >
                                        {taxKey} ({rate}%):{" "}
                                        <span className="font-medium">
                                          {amt.toLocaleString("en-US", {
                                            style: "currency",
                                            currency: "USD",
                                          })}
                                        </span>
                                      </p>
                                    );
                                  },
                                )
                              ) : pricing.taxAmount > 0 ? (
                                <p className="text-xs text-gray-500">
                                  {pricing.appliedTaxRate > 0
                                    ? `Tax (${pricing.appliedTaxRate}%):`
                                    : "Tax:"}{" "}
                                  <span className="font-medium">
                                    {pricing.taxAmount.toLocaleString("en-US", {
                                      style: "currency",
                                      currency: "USD",
                                    })}
                                  </span>
                                </p>
                              ) : null}

                              <p className="text-[13px] font-semibold text-gray-700">
                                Total Price:{" "}
                                <span className="text-[#6BAE41]">
                                  {pricing.totalPrice.toLocaleString("en-US", {
                                    style: "currency",
                                    currency: "USD",
                                  })}
                                </span>
                              </p>

                              {(() => {
                                const servicePaidAmount =
                                  pricing.paidAmount ?? 0;
                                const serviceRefundedAmount =
                                  pricing.refundedAmount ?? 0;
                                return (
                                  <>
                                    {servicePaidAmount > 0 && (
                                      <p className="text-xs text-gray-600">
                                        Amount Paid:{" "}
                                        <span className="font-semibold text-[#6BAE41]">
                                          {servicePaidAmount.toLocaleString(
                                            "en-US",
                                            {
                                              style: "currency",
                                              currency: "USD",
                                            },
                                          )}
                                        </span>
                                      </p>
                                    )}

                                    {serviceRefundedAmount > 0 && (
                                      <p className="text-xs text-gray-600">
                                        Amount Refunded:{" "}
                                        <span className="font-semibold text-red-500">
                                          {serviceRefundedAmount.toLocaleString(
                                            "en-US",
                                            {
                                              style: "currency",
                                              currency: "USD",
                                            },
                                          )}
                                        </span>
                                      </p>
                                    )}
                                  </>
                                );
                              })()}
                            </div>

                            {/* Scheduled slot strip */}
                            {(() => {
                              const serviceSlot = billing.slots.find(
                                (s) => s.service_id === service.service_id,
                              );
                              if (!serviceSlot) return null;
                              return (
                                <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 flex flex-wrap gap-x-4">
                                  <div>
                                    <span className="font-semibold">
                                      Scheduled:
                                    </span>{" "}
                                    {formatOrderDate(serviceSlot.slot_date)} at{" "}
                                    {serviceSlot.start_time} -{" "}
                                    {serviceSlot.end_time}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Service-specific invoice link */}
                            {service.related_invoices &&
                              service.related_invoices.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {service.related_invoices.map(
                                    (invoice: any, invoiceIndex: number) => (
                                      <div
                                        key={invoiceIndex}
                                        className="flex items-center gap-2"
                                      >
                                        <ExternalLink
                                          className="w-3 h-3 flex-shrink-0"
                                          style={{
                                            color: roleSettings.activeColor,
                                          }}
                                        />
                                        <a
                                          href={invoice.invoice_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs font-medium hover:underline truncate"
                                          style={{
                                            color: roleSettings.activeColor,
                                          }}
                                          title={invoice.invoice_url}
                                        >
                                          Service Invoice {invoiceIndex + 1}
                                        </a>
                                        <span className="text-xs text-gray-500">
                                          ({formatOrderDate(invoice.paid_at)})
                                        </span>
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>

                    );
                    };

                    if (orderHasSplits) {
                      if (isCoAgentUser) {
                        return (
                          <div className="space-y-4">
                            <div className="border border-[#93C5FD] rounded-[6px] bg-white overflow-hidden shadow-xs">
                              <div className="px-5 py-3.5 bg-[#DBEAFE] border-b border-[#BFDBFE] flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <span className="text-sm font-semibold uppercase tracking-wide text-blue-950">
                                    Co-Agent Services & Invoice
                                  </span>
                                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white shadow-xs">
                                    {coSplitPct}% Share
                                  </span>
                                </div>
                              </div>
                              <div className="p-4 space-y-3 bg-white">
                                <div className="space-y-3">
                                  {billing.services.map((service) => renderOrderServiceCard(service, coSplitPct / 100, true))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <Accordion
                          type="multiple"
                          defaultValue={["main-agent-section", "co-agent-section"]}
                          className="w-full space-y-4"
                        >
                          <AccordionItem
                            value="main-agent-section"
                            className="border border-[#CBD5E1] rounded-[6px] bg-white overflow-hidden shadow-xs"
                          >
                            <AccordionTrigger className="px-5 py-3.5 bg-[#E2E8F0] hover:bg-[#CBD5E1] border-b border-[#CBD5E1] text-slate-900 text-sm font-semibold uppercase tracking-wide">
                              <div className="flex items-center gap-2.5">
                                <span>Main Agent Invoices & Services</span>
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                                  {mainSplitPct}% Share
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 space-y-3 bg-white">
                              <div className="space-y-3">
                                {billing.services.map((service) => renderOrderServiceCard(service, mainSplitPct / 100, false))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem
                            value="co-agent-section"
                            className="border border-[#93C5FD] rounded-[6px] bg-white overflow-hidden shadow-xs"
                          >
                            <AccordionTrigger className="px-5 py-3.5 bg-[#DBEAFE] hover:bg-[#BFDBFE] border-b border-[#BFDBFE] text-blue-950 text-sm font-semibold uppercase tracking-wide">
                              <div className="flex items-center gap-2.5">
                                <span>Co-Agent Invoices & Services ({coAgentName})</span>
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white shadow-xs">
                                  {coSplitPct}% Share
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 space-y-3 bg-white">
                              <div className="space-y-3">
                                {billing.services.map((service) => renderOrderServiceCard(service, coSplitPct / 100, true))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {billing.services.map((service) => renderOrderServiceCard(service, 1, false))}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Document View/Edit Modal (serviceInvoicePopup) - EXACT BILLING SCREEN MODAL */}
      <Dialog
        open={!!serviceInvoicePopup}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setServiceInvoicePopup(null);
            setIsEditingInvoice(false);
            setEditingInvoiceData(null);
          }
        }}
      >
        <DialogContent
          overlayClassName="z-[200]"
          className="z-[200] bg-white rounded-[6px] border border-[#BBBBBB] shadow-2xl w-[95vw] max-w-5xl h-[95vh] max-h-[95vh] p-0 overflow-hidden flex flex-col font-alexandria [&>button]:hidden"
        >
          {serviceInvoicePopup && (
            <>
              <div className="flex flex-col gap-3 p-4 border-b border-[#BBBBBB]">
                {/* Row 1: Title and badges on the left, Close button on the right */}
                <div className="flex justify-between items-center w-full gap-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <DialogTitle
                      className="text-base sm:text-xl font-bold whitespace-nowrap"
                      style={{ color: roleSettings.pageTabColor }}
                    >
                      Invoice #
                      {serviceInvoicePopup.invoice.invoice_number ||
                        serviceInvoicePopup.invoice.id}
                    </DialogTitle>
                    {(() => {
                      const status = (
                        serviceInvoicePopup.invoice.status || "unpaid"
                      ).toUpperCase();
                      let badgeBg = "#E06D5E";
                      let badgeText = "Unpaid";
                      if (status === "PAID") {
                        badgeBg = "#6BAE41";
                        badgeText = "Paid";
                      } else if (status === "ISSUED") {
                        badgeBg = "#4A90E2";
                        badgeText = "Issued";
                      } else if (status === "VOID") {
                        badgeBg = "#A0A0A0";
                        badgeText = "Void";
                      } else if (status.includes("PARTIAL")) {
                        badgeBg = "#DC9600";
                        badgeText = "Partial";
                      } else if (status === "REFUNDED") {
                        badgeBg = "#D0021B";
                        badgeText = "Refunded";
                      } else if (status.includes("REFUNDED")) {
                        badgeBg = "#D9534F";
                        badgeText = "Partially Refunded";
                      }

                      return (
                        <span
                          className="text-white px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase leading-none whitespace-nowrap"
                          style={{ backgroundColor: badgeBg }}
                        >
                          {badgeText}
                        </span>
                      );
                    })()}
                    {isRenewalInvoice(serviceInvoicePopup.invoice) ? (
                      <span className="px-2.5 py-0.5 rounded-[4px] text-[10px] font-semibold bg-purple-100 text-purple-700 uppercase border border-purple-200 whitespace-nowrap">
                        Hosting Renewal
                      </span>
                    ) : isMainInvoice(serviceInvoicePopup.invoice) ? (
                      <span className="px-2.5 py-0.5 rounded-[4px] text-[10px] font-semibold bg-emerald-100 text-emerald-800 uppercase border border-emerald-300 whitespace-nowrap">
                        Main Invoice
                      </span>
                    ) : isInvoiceLinkedToService(
                        serviceInvoicePopup.invoice,
                      ) ? (
                      <span className="px-2.5 py-0.5 rounded-[4px] text-[10px] font-semibold bg-blue-100 text-blue-700 uppercase border border-blue-200 whitespace-nowrap">
                        Service Invoice
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-[4px] text-[10px] font-semibold bg-amber-100 text-amber-800 uppercase border border-amber-300 whitespace-nowrap">
                        Orphan Invoice
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setServiceInvoicePopup(null);
                      setIsEditingInvoice(false);
                      setEditingInvoiceData(null);
                    }}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Row 2: Action buttons */}
                <div className="flex items-center justify-end gap-2 w-full flex-wrap">
                  {!isEditingInvoice && (
                    <Button
                      variant="outline"
                      disabled={
                        downloadingUuid === serviceInvoicePopup.invoice.uuid
                      }
                      onClick={() =>
                        handleDownloadInvoice(serviceInvoicePopup.invoice)
                      }
                      className="h-[30px] text-xs px-3 font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-[6px] transition-colors flex items-center gap-1.5 shadow-sm bg-white"
                    >
                      {downloadingUuid === serviceInvoicePopup.invoice.uuid ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      Download PDF
                    </Button>
                  )}

                  {isAdmin &&
                    !["paid", "void", "refunded"].includes(
                      (serviceInvoicePopup.invoice.status || "").toLowerCase(),
                    ) && (
                      <div className="flex items-center gap-2">
                        {isEditingInvoice ? (
                          <>
                            <Button
                              disabled={isSavingInvoice}
                              onClick={() => {
                                setIsEditingInvoice(false);
                                setEditingInvoiceData(null);
                              }}
                              variant="outline"
                              className="h-[30px] text-xs px-3 font-medium rounded-[6px] shadow-sm transition-all bg-white hover:bg-gray-700 hover:text-white hover:border-gray-700 border-gray-300 text-gray-700"
                            >
                              Cancel
                            </Button>
                            <Button
                              disabled={isSavingInvoice}
                              onClick={handleSaveInvoice}
                              className="h-[30px] text-xs px-3 font-medium text-white rounded-[6px] shadow-sm transition-all flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700"
                            >
                              {isSavingInvoice ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Save className="h-3.5 w-3.5" />
                              )}
                              Save Changes
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingInvoiceData(
                                JSON.parse(
                                  JSON.stringify(serviceInvoicePopup.invoice),
                                ),
                              );
                              setIsEditingInvoice(true);
                            }}
                            className="h-[30px] text-xs px-3 font-medium border border-blue-500 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 rounded-[6px] transition-colors flex items-center gap-1.5 shadow-sm bg-white"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit Invoice
                          </Button>
                        )}

                        {!isEditingInvoice &&
                          parseFloat(
                            serviceInvoicePopup.invoice.paid_amount || "0",
                          ) <= 0 &&
                          !["paid", "void", "refunded"].includes(
                            (
                              serviceInvoicePopup.invoice.status || ""
                            ).toLowerCase(),
                          ) && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                setDeleteInvoiceModal({
                                  open: true,
                                  invoice: serviceInvoicePopup.invoice,
                                });
                              }}
                              className="h-[30px] text-xs px-3 font-medium border border-red-500 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 rounded-[6px] transition-colors flex items-center gap-1.5 shadow-sm bg-white"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete Invoice
                            </Button>
                          )}
                      </div>
                    )}

                  {/* Agent / Admin Payment Buttons */}
                  {userType !== "vendor" &&
                    !isEditingInvoice &&
                    !["PAID", "VOID", "REFUNDED"].includes(
                      (serviceInvoicePopup.invoice.status || "").toUpperCase(),
                    ) && (
                      <Button
                        onClick={() =>
                          handlePayInvoice(serviceInvoicePopup.invoice)
                        }
                        className="h-[30px] text-xs px-4 font-normal text-white hover:brightness-110 rounded-[6px] transition-all active:scale-[0.98] shadow-sm border-none cursor-pointer"
                        style={{ backgroundColor: roleSettings.pageTabColor }}
                      >
                        Pay Now
                      </Button>
                    )}

                  {isAdmin &&
                    !isEditingInvoice &&
                    !["PAID", "VOID", "REFUNDED"].includes(
                      (serviceInvoicePopup.invoice.status || "").toUpperCase(),
                    ) && (
                      <Button
                        onClick={() =>
                          handleOpenManualPayment(serviceInvoicePopup.invoice)
                        }
                        className="h-[30px] px-3 text-emerald-600 bg-white border border-emerald-500 rounded-[6px] text-xs font-normal transition-all flex items-center justify-center cursor-pointer hover:bg-emerald-600 hover:text-white active:scale-[0.98]"
                      >
                        Mark Paid
                      </Button>
                    )}
                </div>
              </div>

              {/* Modal Body: Invoice Document */}
              <div className="overflow-y-auto p-4 flex-1 bg-gray-50/30">
                <InvoiceDocument
                  invoice={serviceInvoicePopup.invoice}
                  editData={editingInvoiceData || serviceInvoicePopup.invoice}
                  isEditing={isEditingInvoice}
                  updateItem={updateInvoiceItem}
                  addItem={addInvoiceItem}
                  removeItem={removeInvoiceItem}
                  updateTaxRate={updateInvoiceTaxRate}
                  setEditData={setEditingInvoiceData}
                  roleSettings={roleSettings}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Payment Dialog for Admin */}
      <Dialog open={manualPaymentOpen} onOpenChange={setManualPaymentOpen}>
        <DialogContent
          overlayClassName="z-[300]"
          className="z-[300] max-w-md bg-white rounded-[8px] p-6 font-alexandria"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-800">
              Record Manual Payment
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitManualPayment} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">
                Amount to Record ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={manualPaymentAmount}
                onChange={(e) => setManualPaymentAmount(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#BBBBBB] rounded-[6px] text-sm focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">
                Payment Method
              </label>
              <Select
                value={manualPaymentMethod}
                onValueChange={setManualPaymentMethod}
              >
                <SelectTrigger className="w-full border-[#BBBBBB] h-[40px] bg-white">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[#BBBBBB]">
                  <SelectItem value="E-Transfer">E-Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Credit Card">
                    Credit Card (Manual)
                  </SelectItem>
                  <SelectItem value="Other">Other / Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">
                Reference Notes
              </label>
              <textarea
                placeholder="Enter transaction reference, e-transfer details, cheque numbers..."
                value={manualPaymentNotes}
                onChange={(e) => setManualPaymentNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white border border-[#BBBBBB] rounded-[6px] text-sm focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setManualPaymentOpen(false)}
                className="h-[36px] px-4 rounded-[6px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingManualPayment}
                className="h-[36px] px-5 text-white rounded-[6px]"
                style={{ backgroundColor: roleSettings.pageTabColor }}
              >
                {submittingManualPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...
                  </>
                ) : (
                  "Record Payment"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Refund Modal */}
      {refundModalOpen && selectedRefundInvoice && (
        <RefundModal
          isOpen={refundModalOpen}
          onClose={() => {
            setRefundModalOpen(false);
            setSelectedRefundInvoice(null);
          }}
          invoice={selectedRefundInvoice}
          defaultAmount={refundDefaultAmount}
          onSuccess={async (updatedInvoice?: any) => {
            setRefundModalOpen(false);
            setSelectedRefundInvoice(null);
            if (updatedInvoice) {
              setInvoices((prev) =>
                prev.map((inv) =>
                  inv.uuid === updatedInvoice.uuid ? updatedInvoice : inv,
                ),
              );
              setServiceInvoicePopup((prev) =>
                prev && prev.invoice?.uuid === updatedInvoice.uuid
                  ? { ...prev, invoice: updatedInvoice }
                  : prev,
              );
            }
            await loadBillingData();
            if (onRefreshInvoices) await onRefreshInvoices();
          }}
        />
      )}

      {/* Delete Invoice Modal */}
      {deleteInvoiceModal.open && deleteInvoiceModal.invoice && (
        <DeleteInvoiceModal
          isOpen={deleteInvoiceModal.open}
          onClose={() => setDeleteInvoiceModal({ open: false, invoice: null })}
          invoice={deleteInvoiceModal.invoice}
          onSuccess={async () => {
            setServiceInvoicePopup(null);
            setDeleteInvoiceModal({ open: false, invoice: null });
            await loadBillingData();
            if (onRefreshInvoices) await onRefreshInvoices();
          }}
        />
      )}

      {/* Refund Receipt Modal */}
      {receiptModalOpen && selectedReceiptPayment && (
        <RefundReceiptModal
          isOpen={receiptModalOpen}
          onClose={() => {
            setReceiptModalOpen(false);
            setSelectedReceiptPayment(null);
            setSelectedReceiptInvoice(null);
          }}
          payment={selectedReceiptPayment}
          invoice={selectedReceiptInvoice}
        />
      )}
    </>
  );
}
