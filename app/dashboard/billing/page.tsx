"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { GetOrganizations } from "@/app/dashboard/global-settings/global-settings";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BillingDialog from "@/components/BillingDialog";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import {
  BillingItem,
  createQuickBilling,
  getBillings,
  isVoidOrCancelled,
  isPaidOrSucceeded,
  isRefunded,
  getBestTargetInvoice,
} from "./billing";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { OrderSlots } from "./billing";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileBillingOverview from "@/components/mobile/admin/MobileBillingOverview";
import MobileBillingDetail from "@/components/mobile/admin/MobileBillingDetail";
import InvoiceModal from "../invoice/components/InvoiceModal";
import RefundModal from "../invoice/components/RefundModal";
import {
  GetInvoicesByOrder,
  PayInvoiceWithStripe,
  MarkPaid,
} from "../invoice/invoice_api";
import InvoiceDocument from "../invoice/components/InvoiceDocument";
import { GetFilesData } from "../file-manager/file-manager";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Page = () => {
  const { userType } = useAppContext();
  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string) || "admin";
  const roleSettings =
    appliedSettings[role as keyof typeof appliedSettings] ||
    appliedSettings["admin"];
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const router = useRouter();
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    let ancestor = header.parentElement;
    while (ancestor) {
      const style = window.getComputedStyle(ancestor);
      if (
        style.overflowX === "hidden" ||
        ancestor.classList.contains("overflow-x-hidden")
      ) {
        ancestor.style.setProperty("overflow-x", "visible", "important");
        ancestor.style.setProperty("overflow-y", "visible", "important");

        const target = ancestor;
        return () => {
          target.style.removeProperty("overflow-x");
          target.style.removeProperty("overflow-y");
        };
      }
      ancestor = ancestor.parentElement;
    }
  }, []);

  const [billings, setBillings] = useState<BillingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSuperAdmin } = useUser();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [orgFilter, setOrgFilter] = useState<string>("all");

  useEffect(() => {
    if (isSuperAdmin) {
      GetOrganizations()
        .then((res) => {
          if (res.status && Array.isArray(res.data)) {
            setOrganizations(res.data);
          }
        })
        .catch((err) => console.error("Failed to fetch organizations:", err));
    }
  }, [isSuperAdmin]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showAgain, setShowAgain] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [addressFilter, setAddressFilter] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [refundDefaultAmount, setRefundDefaultAmount] = useState<
    number | undefined
  >(undefined);
  const [fetchingInvoice, setFetchingInvoice] = useState(false);
  const [selectedOrderUuid, setSelectedOrderUuid] = useState("");
  const [serviceInvoicePopup, setServiceInvoicePopup] = useState<{
    invoice: any;
    billing: BillingItem;
    serviceId?: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<{
    id: string | number;
    action: "pay" | "view" | "refund";
  } | null>(null);

  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);
  const [selectedBilling, setSelectedBilling] = useState<BillingItem | null>(
    null,
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rowInvoices, setRowInvoices] = useState<{
    [orderUuid: string]: any[];
  }>({});
  const [rowInvoicesLoading, setRowInvoicesLoading] = useState<{
    [orderUuid: string]: boolean;
  }>({});

  // Tracks which service IDs have at least one media file, keyed by orderUuid
  const [rowServiceMedia, setRowServiceMedia] = useState<{
    [orderUuid: string]: Set<number | string>;
  }>({});
  const [rowMediaLoading, setRowMediaLoading] = useState<{
    [orderUuid: string]: boolean;
  }>({});

  useEffect(() => {
    const info = localStorage.getItem("userInfo");
    if (info) {
      try {
        setCurrentUser(JSON.parse(info));
      } catch (e) {
        console.error("Failed to parse userInfo", e);
      }
    }
  }, []);

  // Manual Payment states
  const [manualPaymentOpen, setManualPaymentOpen] = useState(false);
  const [manualPaymentInvoice, setManualPaymentInvoice] = useState<any | null>(
    null,
  );
  const [manualPaymentAmount, setManualPaymentAmount] = useState<string>("");
  const [manualPaymentMethod, setManualPaymentMethod] =
    useState<string>("E-Transfer");
  const [manualPaymentNotes, setManualPaymentNotes] = useState<string>("");
  const [submittingManualPayment, setSubmittingManualPayment] = useState(false);

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
        const updatedInvoice = response.data;
        const targetOrderUuid =
          manualPaymentInvoice.order?.uuid ||
          manualPaymentInvoice.order_uuid ||
          selectedBilling?.order_uuid ||
          serviceInvoicePopup?.billing?.order_uuid ||
          selectedOrderUuid;

        setManualPaymentOpen(false);
        setManualPaymentInvoice(null);

        // 1. Refresh rowInvoices and modal invoices for the affected order
        if (targetOrderUuid) {
          try {
            const res = await GetInvoicesByOrder(targetOrderUuid);
            const invoicesList = Array.isArray(res.data) ? res.data : [res.data];
            setRowInvoices((prev) => ({
              ...prev,
              [targetOrderUuid]: invoicesList,
            }));
            setInvoices(invoicesList);
          } catch (err) {
            console.error("Failed to refresh order invoices:", err);
          }
        }

        // 2. Update serviceInvoicePopup if open
        if (serviceInvoicePopup) {
          if (updatedInvoice && serviceInvoicePopup.invoice?.uuid === updatedInvoice.uuid) {
            setServiceInvoicePopup((prev) =>
              prev ? { ...prev, invoice: updatedInvoice } : null,
            );
          } else if (targetOrderUuid) {
            try {
              const res = await GetInvoicesByOrder(targetOrderUuid);
              const invoicesList = Array.isArray(res.data) ? res.data : [res.data];
              const bestTarget = getBestTargetInvoice(
                invoicesList,
                serviceInvoicePopup.serviceId,
              );
              if (bestTarget) {
                setServiceInvoicePopup((prev) =>
                  prev ? { ...prev, invoice: bestTarget } : null,
                );
              }
            } catch (err) {
              console.error("Failed to refresh serviceInvoicePopup invoice:", err);
            }
          }
        }

        // 3. Update viewingInvoice if open
        if (viewingInvoice) {
          if (updatedInvoice && viewingInvoice.uuid === updatedInvoice.uuid) {
            setViewingInvoice(updatedInvoice);
          } else {
            setViewingInvoice((prev: any) =>
              prev ? { ...prev, status: "paid", paid_amount: prev.total } : null,
            );
          }
        }

        // 4. Reload overall billings table data
        await loadBillings();
      } else {
        toast.error(response.message || "Failed to record manual payment.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to record manual payment.");
    } finally {
      setSubmittingManualPayment(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setServiceInvoicePopup(null);
      }
    };
    if (serviceInvoicePopup) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [serviceInvoicePopup]);

  const handlePayInvoice = async (
    invoice: any,
    billing: BillingItem,
    mode?: "on_behalf" | "self",
    serviceId?: string,
  ) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
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
        serviceId,
        isSplit ? paymentMode : undefined,
        isSplit ? payerUuid : undefined,
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate payment.");
    }
  };

  const handleInvoiceAction = async (
    billing: BillingItem,
    action: "pay" | "view",
    serviceId?: string,
    serviceAmount?: number,
  ) => {
    try {
      setInvoicesLoading(true);
      setActionLoading({ id: serviceId || billing.order_id, action });
      const res = await GetInvoicesByOrder(billing.order_uuid);
      const invoicesList = Array.isArray(res.data) ? res.data : [res.data];

      const targetInvoice = getBestTargetInvoice(invoicesList, serviceId);

      if (action === "view") {
        if (targetInvoice) {
          setActionLoading(null);
          setServiceInvoicePopup({
            invoice: targetInvoice,
            billing,
            serviceId,
          });
        } else {
          setActionLoading(null);
          toast.error("No active invoice available for this selection.");
        }
      } else if (action === "pay") {
        const unpaidInvoices = invoicesList.filter((inv: any) => {
          const s = (inv.status || "").toLowerCase();
          return (
            !isPaidOrSucceeded(s) && !isVoidOrCancelled(s) && !isRefunded(s)
          );
        });

        const hasCoAgentInvoice = unpaidInvoices.some(
          (inv: any) => inv.agent_type === "co-agent",
        );
        const uniqueAgents = new Set(
          unpaidInvoices
            .map((inv: any) => inv.agent?.uuid || inv.agent_uuid)
            .filter(Boolean),
        );

        if (
          unpaidInvoices.length > 1 &&
          (hasCoAgentInvoice || uniqueAgents.size > 1)
        ) {
          setActionLoading(null);
          setInvoices(invoicesList);
          setSelectedBilling(billing);
          setSelectedOrderUuid(billing.order_uuid);
          setSelectedServiceId(serviceId || null);
          setShowInvoicesModal(true);
          setInvoicesLoading(false);
          return;
        }

        const isTargetUnpaid =
          targetInvoice &&
          !isPaidOrSucceeded(targetInvoice.status) &&
          !isVoidOrCancelled(targetInvoice.status) &&
          !isRefunded(targetInvoice.status);

        const invoiceToPay = serviceId
          ? isTargetUnpaid
            ? targetInvoice
            : unpaidInvoices.find((inv: any) =>
                inv.notes?.toLowerCase().includes("consolidated"),
              ) ||
              unpaidInvoices.find((inv: any) => inv.agent_type === "primary") ||
              unpaidInvoices[0]
          : unpaidInvoices.find((inv: any) =>
              inv.notes?.toLowerCase().includes("consolidated"),
            ) ||
            unpaidInvoices.find((inv: any) => inv.agent_type === "primary") ||
            unpaidInvoices[0] ||
            (isTargetUnpaid ? targetInvoice : null);

        if (invoiceToPay) {
          await handlePayInvoice(invoiceToPay, billing, undefined, serviceId);
        } else {
          if (targetInvoice && isVoidOrCancelled(targetInvoice.status)) {
            toast.error("This invoice has been voided and cannot be paid.");
            setActionLoading(null);
            setInvoicesLoading(false);
            return;
          }
          const amount = serviceId
            ? serviceAmount || 0
            : billing.remaining_amount;
          await handlePay(billing.order_id, billing.agent_uuid ?? "", amount, {
            paymentType: serviceId ? "service" : "full",
            serviceId,
          });
        }
      }

      setActionLoading(null);
      setInvoicesLoading(false);
    } catch (err) {
      setActionLoading(null);
      setInvoicesLoading(false);
      console.error(err);
      toast.error("Failed to process invoice action.");
    }
  };

  const confirmAndExecute = () => {
    pendingAction?.();
    setPendingAction(null);
  };

  const toggleRow = async (index: number) => {
    const isExpanding = expandedRow !== index;
    setExpandedRow(isExpanding ? index : null);
    if (isExpanding) {
      const billing = sortedBillings[index];
      if (
        billing &&
        !rowInvoices[billing.order_uuid] &&
        !rowInvoicesLoading[billing.order_uuid]
      ) {
        setRowInvoicesLoading((prev) => ({
          ...prev,
          [billing.order_uuid]: true,
        }));
        try {
          const res = await GetInvoicesByOrder(billing.order_uuid);
          const invoicesList = Array.isArray(res.data) ? res.data : [res.data];
          setRowInvoices((prev) => ({
            ...prev,
            [billing.order_uuid]: invoicesList,
          }));
        } catch (err) {
          console.error("Failed to load row invoice:", err);
        } finally {
          setRowInvoicesLoading((prev) => ({
            ...prev,
            [billing.order_uuid]: false,
          }));
        }
      }

      // Fetch media per service for agent restriction
      if (
        billing &&
        !rowServiceMedia[billing.order_uuid] &&
        !rowMediaLoading[billing.order_uuid]
      ) {
        setRowMediaLoading((prev) => ({ ...prev, [billing.order_uuid]: true }));
        try {
          const token = localStorage.getItem("token") || "";
          const filesData = await GetFilesData(token, billing.order_uuid);
          // API returns { data: Tour[] } where each Tour has .files[] and .links[]
          const tours: any[] = Array.isArray(filesData?.data) ? filesData.data : [];
          const files: any[] = tours.flatMap((t: any) => Array.isArray(t.files) ? t.files : []);
          const links: any[] = tours.flatMap((t: any) => Array.isArray(t.links) ? t.links : []);
          const serviceIdsWithMedia = new Set<number | string>();
          files.forEach((f: any) => {
            if (f.service_id != null) {
              serviceIdsWithMedia.add(f.service_id);
              serviceIdsWithMedia.add(String(f.service_id));
            }
            if (f.service?.id != null) {
              serviceIdsWithMedia.add(f.service.id);
              serviceIdsWithMedia.add(String(f.service.id));
            }
            if (f.service?.uuid) {
              serviceIdsWithMedia.add(f.service.uuid);
            }
          });
          links.forEach((l: any) => {
            if (l.link && String(l.link).trim() !== "") {
              if (l.service_id != null) {
                serviceIdsWithMedia.add(l.service_id);
                serviceIdsWithMedia.add(String(l.service_id));
              }
              if (l.service?.id != null) {
                serviceIdsWithMedia.add(l.service.id);
                serviceIdsWithMedia.add(String(l.service.id));
              }
              if (l.service?.uuid) {
                serviceIdsWithMedia.add(l.service.uuid);
              }
            }
          });

          // Match 3D/Matterport service if any 3D link exists in tour
          const hasAny3DLink = links.some((l: any) => l.link && String(l.link).trim() !== "");
          if (hasAny3DLink && Array.isArray(billing.services)) {
            billing.services.forEach((s: any) => {
              const sName = (s.service?.name || s.name || "").toLowerCase();
              if (sName.includes("matterport") || sName.includes("3d tour") || sName.includes("3d floor")) {
                if (s.service_id != null) {
                  serviceIdsWithMedia.add(s.service_id);
                  serviceIdsWithMedia.add(String(s.service_id));
                }
                if (s.service?.id != null) {
                  serviceIdsWithMedia.add(s.service.id);
                  serviceIdsWithMedia.add(String(s.service.id));
                }
                if (s.id != null) {
                  serviceIdsWithMedia.add(s.id);
                  serviceIdsWithMedia.add(String(s.id));
                }
                if (s.service?.uuid) {
                  serviceIdsWithMedia.add(s.service.uuid);
                }
              }
            });
          }
          setRowServiceMedia((prev) => ({
            ...prev,
            [billing.order_uuid]: serviceIdsWithMedia,
          }));
        } catch (err) {
          console.error("Failed to load media for billing row:", err);
          // On error, store empty set so we don't retry forever
          setRowServiceMedia((prev) => ({
            ...prev,
            [billing.order_uuid]: new Set(),
          }));
        } finally {
          setRowMediaLoading((prev) => ({ ...prev, [billing.order_uuid]: false }));
        }
      }
    }
  };

  const loadBillings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBillings();

      if (userType === "agent") {
        const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
        const agentUuid = userInfo?.uuid;
        if (agentUuid) {
          const agentFilteredData = data.filter(
            (b) => b.agent_uuid === agentUuid,
          );
          setBillings(agentFilteredData);
        } else {
          setBillings(data);
        }
      } else {
        setBillings(data);
      }
    } catch (err) {
      console.error("Failed to load billings:", err);
    } finally {
      setLoading(false);
    }
  }, [userType]);

  useEffect(() => {
    loadBillings();
  }, [loadBillings]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const channel = new BroadcastChannel("billing_payment_channel");
    channel.onmessage = (event) => {
      if (event.data === "payment_success") {
        toast.success("Payment processed successfully! Updating records...");
        setRowInvoices({});
        loadBillings();
      }
    };
    return () => {
      channel.close();
    };
  }, [loadBillings]);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) return;

    const processStripePayment = async () => {
      toast.info("Processing your payment, please wait...");

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/stripe/session?session_id=${sessionId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
          },
        );
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || result.error || "Payment processing failed",
          );
        }

        toast.success(
          "Payment processed successfully! This tab will close automatically.",
        );

        if (typeof window !== "undefined") {
          const channel = new BroadcastChannel("billing_payment_channel");
          channel.postMessage("payment_success");
          channel.close();
        }

        const params = new URLSearchParams(searchParams.toString());
        params.delete("session_id");
        router.replace(`?${params.toString()}`);

        setTimeout(() => {
          window.close();
        }, 2500);
      } catch (error) {
        console.error("Stripe session error:", error);
        toast.error(
          error instanceof Error
            ? error.message || "Unable to verify payment session."
            : "Unable to verify payment session.",
        );
      }
    };

    processStripePayment();
  }, [searchParams, router]);

  const uniqueAgents = Array.from(
    new Set(billings.map((billing) => billing.agent_name).filter(Boolean)),
  );

  const filteredBillings = billings.filter((billing) => {
    if (orgFilter !== "all" && String(billing.organization_id) !== orgFilter) {
      return false;
    }

    if (statusFilter !== "all" && billing.status !== statusFilter) {
      return false;
    }

    if (agentFilter !== "all" && billing.agent_name !== agentFilter) {
      return false;
    }

    if (addressFilter) {
      const searchTerm = addressFilter.toLowerCase().trim();
      const propertyAddr = (billing.property_address || "").toLowerCase();
      const propertyLoc = (billing.property_location || "").toLowerCase();
      const matchesProperty =
        propertyAddr.includes(searchTerm) || propertyLoc.includes(searchTerm);

      const matchesAddress = billing.slots.some((slot) =>
        `${slot.address || ""} ${slot.location || ""}`
          .toLowerCase()
          .includes(searchTerm),
      );
      const matchesOrderId =
        (billing.order_id != null &&
          String(billing.order_id).toLowerCase().includes(searchTerm)) ||
        (billing.order_uuid != null &&
          String(billing.order_uuid).toLowerCase().includes(searchTerm));

      if (!matchesProperty && !matchesAddress && !matchesOrderId) {
        return false;
      }
    }

    return true;
  });

  const sortedBillings = [...filteredBillings].sort((a, b) => {
    const orderA = a.order_id || 0;
    const orderB = b.order_id || 0;
    return sortOrder === "asc" ? orderA - orderB : orderB - orderA;
  });

  const getOrderInvoiceUrl = (billing: BillingItem) => {
    if (billing.invoices && billing.invoices.length > 0) {
      return billing.invoices[0]?.invoice_url || null;
    }
    return null;
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "—";
    return timeStr.slice(0, 5);
  };

  const computeCombinedTime = (slots: OrderSlots[]) => {
    if (!slots || slots.length === 0) return "—";

    const sorted = [...slots].sort(
      (a, b) =>
        new Date(`1970-01-01T${a.start_time}`).getTime() -
        new Date(`1970-01-01T${b.start_time}`).getTime(),
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const start = formatTime(first.start_time);
    const end = formatTime(last.end_time);

    const startDate = new Date(`1970-01-01T${first.start_time}`);
    const endDate = new Date(`1970-01-01T${last.end_time}`);
    const diffMin = Math.max(
      0,
      Math.round((endDate.getTime() - startDate.getTime()) / 60000),
    );

    return `${start} - ${end} (${diffMin} minutes)`;
  };

  const handlePay = async (
    order_uuid: number,
    agent_uuid: string,
    amount: number,
    options?: {
      serviceId?: string;
      paymentType?: "full" | "service";
      serviceName?: string;
    },
  ) => {
    try {
      const url =
        typeof window !== "undefined"
          ? window.location.href
          : "/dashboard/billing";
      await createQuickBilling(order_uuid, url, agent_uuid, amount, options);
    } catch (error) {
      console.log(error);
    }
  };

  const handleRefundClick = async (
    e: React.MouseEvent,
    orderUuid: string,
    serviceUuid?: string,
    serviceAmount?: number,
  ) => {
    e.stopPropagation();
    try {
      setFetchingInvoice(true);
      const res = await GetInvoicesByOrder(orderUuid);
      const invoicesList = Array.isArray(res.data) ? res.data : [res.data];
      const targetInvoice = getBestTargetInvoice(invoicesList, serviceUuid);

      if (targetInvoice) {
        setSelectedInvoice(targetInvoice);
        if (serviceAmount !== undefined) {
          const taxRate = parseFloat(targetInvoice.tax_rate || "0");
          setRefundDefaultAmount(serviceAmount * (1 + taxRate / 100));
        } else {
          setRefundDefaultAmount(undefined);
        }
        setIsRefundModalOpen(true);
      } else {
        toast.error("Could not find an active invoice to refund.");
      }
    } catch (error) {
      console.error("Failed to fetch invoice for refund:", error);
      toast.error("Failed to process refund request.");
    } finally {
      setFetchingInvoice(false);
    }
  };

  const totalPages = Math.ceil(sortedBillings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBillings = sortedBillings.slice(startIndex, endIndex);

  // Mobile view for billing
  if (isMobile) {
    const orderParam = searchParams.get("order");
    if (orderParam) {
      return (
        <MobileBillingDetail
          orderId={orderParam}
          onBack={() => router.push("/dashboard/billing")}
        />
      );
    }
    return <MobileBillingOverview />;
  }

  return (
    <div>
      <div
        ref={headerRef}
        className="w-full h-[80px] font-alexandria sticky top-0 z-50 flex justify-between px-[20px] items-center"
        style={{
          backgroundColor: roleSettings.pageBg,
          boxShadow: "0px 4px 4px #0000001F",
        }}
      >
        <div className="flex items-center gap-4">
          <p
            className="text-[16px] md:text-[24px] font-[400]"
            style={{ color: roleSettings.pageTabColor }}
          >
            Billing ({sortedBillings.length})
          </p>
        </div>

        {role === "admin" && (
          <Button
            onClick={() => router.push("/dashboard/invoice/create")}
            className="w-[140px] md:w-[170px] h-[35px] md:h-[44px] rounded-[6px] text-[14px] md:text-[16px] font-[400] text-white flex gap-[5px] justify-center items-center hover:brightness-110 active:scale-[0.98] transition-all"
            style={{
              backgroundColor: roleSettings.pageTabColor,
              borderColor: roleSettings.pageTabColor,
            }}
          >
            <Plus className="h-4 w-4" /> Create Invoice
          </Button>
        )}
      </div>

      {/* Filters Section */}
      <div
        className="p-4 border-b sticky top-[80px] z-40 border-[#BBBBBB]"
        style={{ backgroundColor: roleSettings.pageBg }}
      >
        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${isSuperAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}
        >
          {/* Organization Filter - Super Admin Only */}
          {isSuperAdmin && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Organization
              </label>
              <Select value={orgFilter} onValueChange={setOrgFilter}>
                <SelectTrigger
                  className="w-full border-[#BBBBBB]"
                  style={{ backgroundColor: roleSettings.pageBg }}
                >
                  <SelectValue placeholder="Filter by organization" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: roleSettings.pageBg }}>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={String(org.id)}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Status
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="w-full border-[#BBBBBB]"
                style={{ backgroundColor: roleSettings.pageBg }}
              >
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: roleSettings.pageBg }}>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Agent Filter - Hide for agents */}
          {userType !== "agent" && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Agent
              </label>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger
                  className="w-full border-[#BBBBBB]"
                  style={{ backgroundColor: roleSettings.pageBg }}
                >
                  <SelectValue placeholder="Filter by agent" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: roleSettings.pageBg }}>
                  <SelectItem value="all">All Agents</SelectItem>
                  {uniqueAgents.map((agent) => (
                    <SelectItem key={agent} value={agent ? agent : ""}>
                      {agent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Address/Order ID Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Address / Order ID
            </label>
            <input
              type="text"
              placeholder="Search address or order ID..."
              value={addressFilter}
              onChange={(e) => setAddressFilter(e.target.value)}
              className="w-full px-[14px] h-[40px] py-[10px] bg-[#EEEEEE] border border-[#BBBBBB] rounded-[6px] focus:outline-none focus:ring-2 transition-all"
              style={
                {
                  backgroundColor: roleSettings.pageBg,
                  "--tw-ring-color": roleSettings.activeColor,
                } as React.CSSProperties
              }
            />
          </div>
        </div>
      </div>

      <div className="w-full relative">
        <Table className="font-alexandria px-0 overflow-x-auto whitespace-nowrap">
          <TableHeader>
            <TableRow
              className="font-alexandria h-[54px]"
              style={{ backgroundColor: roleSettings.pageBg }}
            >
              <TableHead
                className="text-[14px] font-[700] text-[#7D7D7D] pl-[20px] cursor-pointer select-none"
                style={{
                  color:
                    sortOrder === "asc" || sortOrder === "desc"
                      ? roleSettings.pageTabColor
                      : "#7D7D7D",
                }}
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                <div className="flex items-center gap-2">
                  Order ID
                  {sortOrder === "asc" ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">
                Agent
              </TableHead>
              {isSuperAdmin && (
                <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">
                  Organization
                </TableHead>
              )}
              {/* <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">
                Address
              </TableHead> */}
              <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">
                Total Amount
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">
                Paid Amount
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">
                Pending Amount
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#7D7D7D] text-center">
                Status
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#7D7D7D] text-center">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              // Skeleton Loading State
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow
                  key={index}
                  className="bg-white hover:bg-white border-b border-[#E4E4E4]"
                >
                  <TableCell className="py-4">
                    <Skeleton className="h-4 w-[60px] bg-gray-200" />
                  </TableCell>
                  <TableCell className="py-4">
                    <Skeleton className="h-4 w-[100px] bg-gray-200" />
                  </TableCell>
                  <TableCell className="py-4">
                    <Skeleton className="h-4 w-[150px] bg-gray-200" />
                  </TableCell>
                  <TableCell className="py-4">
                    <Skeleton className="h-4 w-[80px] bg-gray-200" />
                  </TableCell>
                  <TableCell className="py-4">
                    <Skeleton className="h-4 w-[80px] bg-gray-200" />
                  </TableCell>
                  <TableCell className="py-4">
                    <Skeleton className="h-4 w-[80px] bg-gray-200" />
                  </TableCell>
                  <TableCell className="py-4 text-center px-[20px]">
                    <Skeleton className="h-5 w-[60px] bg-gray-200 rounded-full mx-auto" />
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <Skeleton className="h-5 w-5 bg-gray-200 rounded mx-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedBillings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-gray-500 text-lg"
                >
                  No billings found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedBillings.map((billing, index) => {
                const orderInvoiceUrl = getOrderInvoiceUrl(billing);
                const address = billing.property_address
                  ? `${billing.property_address}, ${billing.property_location || ""} `
                  : billing.slots[0]
                    ? `${billing.slots[0].address}, ${billing.slots[0].location} `
                    : "N/A";

                const orderInvoices = rowInvoices[billing.order_uuid] || [];
                const primaryInvoice =
                  orderInvoices.find(
                    (inv) =>
                      inv.agent_type === "primary" ||
                      (inv.agent && !inv.split_details),
                  ) || orderInvoices[0];
                const taxRate = parseFloat(primaryInvoice?.tax_rate || "0");
                const subtotalVal = billing.total_amount;
                const taxAmount = subtotalVal * (taxRate / 100);
                const rowGrandTotal = subtotalVal + taxAmount;
                const rowRemaining =
                  billing.status === "paid"
                    ? 0
                    : Math.max(0, rowGrandTotal - (billing.total_paid || 0));

                return (
                  <React.Fragment key={billing.order_uuid}>
                    {/* Main Order Row */}
                    <TableRow
                      onClick={() => toggleRow(index)}
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                        #{billing.order_id}
                      </TableCell>
                      <TableCell
                        className={`text-[15px] py-[19px] font-[400] ${userType}-text`}
                      >
                        {billing.agent_name || "N/A"}
                      </TableCell>
                      {isSuperAdmin && (
                        <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                          {billing.organization?.name || "Global / None"}
                        </TableCell>
                      )}
                      <TableCell className="text-[15px] py-[19px] font-[400] hidden text-[#7D7D7D]">
                        {address}
                      </TableCell>
                      <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                        {rowGrandTotal.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </TableCell>
                      <TableCell className="text-[15px] py-[19px] font-[400] text-[#6BAE41]">
                        {billing.total_paid.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </TableCell>
                      <TableCell className="text-[15px] py-[19px] font-[400] text-[#E06D5E]">
                        {rowRemaining.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </TableCell>
                      <TableCell className="text-[10px] py-[19px] px-[20px] text-center font-[400] text-[#7D7D7D]">
                        <label
                          className={`px-[7px] py-[1.5px] text-white rounded-[10px] leading-[100%] 
                               ${
                                 billing.status === "paid"
                                   ? "!bg-[#6BAE41]" // green
                                   : billing.status === "unpaid"
                                     ? "!bg-[#E06D5E]" // red
                                     : billing.status === "partial"
                                       ? "!bg-[#DC9600]" // orange (partial)
                                       : "!bg-[#E06D5E]"
                               }`}
                        >
                          {billing.status}
                        </label>
                      </TableCell>
                      <TableCell className="w-[120px] text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 transition-colors"
                            style={{ color: "#7D7D7D" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                roleSettings.activeColor;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "#7D7D7D";
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInvoiceAction(billing, "view");
                            }}
                            title="View Invoice"
                          >
                            {actionLoading?.id === billing.order_id &&
                            actionLoading?.action === "view" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </Button>
                          {expandedRow === index ? (
                            <ChevronUp className="h-5 w-5 text-gray-600" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Services Row */}
                    {expandedRow === index &&
                      (() => {
                        const orderInvoices =
                          rowInvoices[billing.order_uuid] || [];
                        const targetOrderInvoice =
                          getBestTargetInvoice(orderInvoices);
                        const primaryInvoice =
                          targetOrderInvoice ||
                          orderInvoices.find(
                            (inv) =>
                              inv.agent_type === "primary" ||
                              (inv.agent && !inv.split_details),
                          ) ||
                          orderInvoices[0];

                        const isOrderPaid =
                          billing.status === "paid" ||
                          (orderInvoices.length > 0 &&
                            orderInvoices.every((inv) =>
                              isPaidOrSucceeded(inv.status),
                            ));
                        const isOrderRefunded =
                          isRefunded(billing.status) ||
                          isRefunded(targetOrderInvoice?.status);

                        const actualOrderCancelled =
                          isVoidOrCancelled(billing.status) ||
                          isVoidOrCancelled((billing as any).order_status) ||
                          (orderInvoices.length > 0 &&
                            isVoidOrCancelled(
                              orderInvoices[0]?.order?.order_status,
                            ));
                        const isOrderCancelledOrVoid =
                          actualOrderCancelled ||
                          (targetOrderInvoice
                            ? isVoidOrCancelled(targetOrderInvoice.status)
                            : orderInvoices.length > 0 &&
                              orderInvoices.every((inv) =>
                                isVoidOrCancelled(inv.status),
                              ));

                        const hasCancellationFee = orderInvoices.some(
                          (inv) =>
                            !isVoidOrCancelled(inv.status) &&
                            (inv.notes
                              ?.toLowerCase()
                              .includes("cancellation fee") ||
                              inv.items?.some((i: any) =>
                                i.description
                                  ?.toLowerCase()
                                  .includes("cancellation fee"),
                              )),
                        );

                        const taxRate = parseFloat(
                          primaryInvoice?.tax_rate || "0",
                        );
                        const subtotalVal = billing.total_amount;
                        const taxAmount = subtotalVal * (taxRate / 100);
                        const grandTotalVal = subtotalVal + taxAmount;
                        const displayRemaining =
                          isOrderPaid ||
                          (actualOrderCancelled && !hasCancellationFee)
                            ? 0
                            : Math.max(
                                0,
                                grandTotalVal - (billing.total_paid || 0),
                              );
                        // Agent media restriction: for Pay All, ALL services must have media
                        const serviceMediaSet = rowServiceMedia[billing.order_uuid];
                        const agentMediaRestriction = userType === "agent" && serviceMediaSet !== undefined;
                        const servicesWithoutMedia = agentMediaRestriction
                          ? billing.services.filter((svc) => {
                              const svcId = svc.service_id;
                              return !serviceMediaSet.has(svcId) && !serviceMediaSet.has(String(svcId));
                            })
                          : [];
                        const payAllBlockedByMedia = agentMediaRestriction && servicesWithoutMedia.length > 0;

                        const shouldShowPayAll =
                          displayRemaining > 0 &&
                          (!isOrderCancelledOrVoid || hasCancellationFee) &&
                          !isOrderPaid &&
                          !isOrderRefunded;
                        const hasInvoice = orderInvoices.length > 0;

                        return (
                          <TableRow className="bg-gray-50/50">
                            <TableCell
                              colSpan={isSuperAdmin ? 9 : 8}
                              className="p-0"
                            >
                              <div className="overflow-visible transition-all duration-300 p-6">
                                <div className="space-y-4">
                                  {/* Order Summary */}
                                  <div className="bg-white p-6 rounded-[6px] border border-[#BBBBBB]">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 md:gap-0">
                                      <h3
                                        className="text-[16px] font-[600] uppercase tracking-wide font-alexandria m-0"
                                        style={{
                                          color: roleSettings.pageTabColor,
                                        }}
                                      >
                                        Order Summary
                                      </h3>
                                      <div className="flex flex-wrap items-center gap-4">
                                        {orderInvoiceUrl && (
                                          <a
                                            href={orderInvoiceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs font-medium hover:underline"
                                            style={{
                                              color: roleSettings.activeColor,
                                            }}
                                          >
                                            <ExternalLink className="w-4 h-4" />
                                            Stripe Invoice
                                          </a>
                                        )}
                                        <div className="flex flex-wrap gap-2 items-center">
                                          {targetOrderInvoice ? (
                                            <Button
                                              onClick={() =>
                                                handleInvoiceAction(
                                                  billing,
                                                  "view",
                                                )
                                              }
                                              disabled={actionLoading !== null}
                                              className="h-[35px] px-4 border border-[#BBBBBB] text-[#666666] bg-white rounded-[6px] text-xs font-normal transition-colors flex items-center justify-center min-w-[100px] cursor-pointer"
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor =
                                                  roleSettings.pageTabColor;
                                                e.currentTarget.style.color =
                                                  "white";
                                                e.currentTarget.style.borderColor =
                                                  roleSettings.pageTabColor;
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor =
                                                  "white";
                                                e.currentTarget.style.color =
                                                  "#666666";
                                                e.currentTarget.style.borderColor =
                                                  "#BBBBBB";
                                              }}
                                            >
                                              {actionLoading?.id ===
                                                billing.order_id &&
                                              actionLoading?.action ===
                                                "view" ? (
                                                <>
                                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                                                  Loading...
                                                </>
                                              ) : (
                                                "Invoice"
                                              )}
                                            </Button>
                                          ) : (
                                            <Button
                                              disabled
                                              className="h-[35px] px-4 border border-gray-200 text-gray-400 bg-gray-100 rounded-[6px] text-xs font-normal flex items-center justify-center min-w-[100px] cursor-not-allowed opacity-80"
                                            >
                                              No Invoice
                                            </Button>
                                          )}

                                          {shouldShowPayAll && (
                                            payAllBlockedByMedia ? (
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
                                                        {hasCancellationFee
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
                                                    {servicesWithoutMedia.length === 1 ? (
                                                      <span>
                                                        Media for{" "}
                                                        {servicesWithoutMedia[0].service_name}{" "}
                                                        has not been uploaded by the vendor
                                                        yet. Payment will be available once the
                                                        media is added.
                                                      </span>
                                                    ) : (
                                                      <div>
                                                        <span className="block mb-1">
                                                          Media has not yet been uploaded for
                                                          the following services:
                                                        </span>
                                                        <ul className="list-disc list-inside space-y-0.5 my-1 font-medium text-amber-200/90">
                                                          {servicesWithoutMedia.map((s) => (
                                                            <li key={s.service_id}>
                                                              {s.service_name}
                                                            </li>
                                                          ))}
                                                        </ul>
                                                        <span className="block mt-1">
                                                          Payment will be available once the
                                                          required media has been added.
                                                        </span>
                                                      </div>
                                                    )}
                                                  </TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            ) : (
                                              <Button
                                                onClick={() =>
                                                  handleInvoiceAction(
                                                    billing,
                                                    "pay",
                                                  )
                                                }
                                                disabled={actionLoading !== null}
                                                className="h-[35px] px-4 text-white rounded-[6px] text-xs font-normal transition-all flex items-center justify-center min-w-[100px] cursor-pointer hover:brightness-110 active:scale-[0.98]"
                                                style={{
                                                  backgroundColor:
                                                    roleSettings.pageTabColor,
                                                }}
                                              >
                                                {actionLoading?.id ===
                                                  billing.order_id &&
                                                actionLoading?.action ===
                                                  "pay" ? (
                                                  <>
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                                                    Processing...
                                                  </>
                                                ) : hasCancellationFee ? (
                                                  "Pay Cancellation Fee"
                                                ) : (
                                                  "Pay All"
                                                )}
                                              </Button>
                                            )
                                          )}

                                          {role === "admin" &&
                                            shouldShowPayAll && (
                                              <Button
                                                onClick={async () => {
                                                  try {
                                                    setActionLoading({
                                                      id: billing.order_id,
                                                      action: "pay",
                                                    });
                                                    const res =
                                                      await GetInvoicesByOrder(
                                                        billing.order_uuid,
                                                      );
                                                    const invoicesList =
                                                      Array.isArray(res.data)
                                                        ? res.data
                                                        : [res.data];
                                                    const invoiceToPay =
                                                      getBestTargetInvoice(
                                                        invoicesList,
                                                      );

                                                    if (
                                                      invoiceToPay &&
                                                      !isVoidOrCancelled(
                                                        invoiceToPay.status,
                                                      )
                                                    ) {
                                                      handleOpenManualPayment(
                                                        invoiceToPay,
                                                      );
                                                    } else {
                                                      toast.error(
                                                        "No valid invoice found to mark as paid.",
                                                      );
                                                    }
                                                  } catch (err) {
                                                    console.error(
                                                      "Failed to load invoice for manual payment:",
                                                      err,
                                                    );
                                                    toast.error(
                                                      "Failed to load invoice.",
                                                    );
                                                  } finally {
                                                    setActionLoading(null);
                                                  }
                                                }}
                                                disabled={
                                                  actionLoading !== null
                                                }
                                                className="h-[35px] px-4 text-emerald-600 bg-white border border-emerald-500 rounded-[6px] text-xs font-normal transition-all flex items-center justify-center min-w-[100px] cursor-pointer hover:bg-emerald-600 hover:text-white active:scale-[0.98]"
                                              >
                                                {actionLoading?.id ===
                                                  billing.order_id &&
                                                actionLoading?.action ===
                                                  "pay" ? (
                                                  <>
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                                                    Loading...
                                                  </>
                                                ) : (
                                                  "Mark Paid"
                                                )}
                                              </Button>
                                            )}

                                          {isOrderPaid && !isOrderRefunded && (
                                            <Button
                                              disabled
                                              className="h-[35px] px-4 text-white rounded-[6px] text-xs font-normal flex items-center justify-center min-w-[100px] bg-[#6BAE41] cursor-not-allowed opacity-90"
                                            >
                                              Paid
                                            </Button>
                                          )}

                                          {role === "admin" &&
                                            isOrderPaid &&
                                            !isOrderRefunded && (
                                              <Button
                                                variant="outline"
                                                onClick={(e) =>
                                                  handleRefundClick(
                                                    e,
                                                    billing.order_uuid,
                                                  )
                                                }
                                                className="h-[35px] px-4 border border-orange-200 text-orange-600 rounded-[6px] text-xs font-normal transition-colors flex items-center justify-center min-w-[100px] cursor-pointer hover:bg-orange-50"
                                                disabled={fetchingInvoice}
                                              >
                                                {fetchingInvoice ? (
                                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : (
                                                  <RotateCcw className="h-4 w-4 mr-2" />
                                                )}{" "}
                                                Refund
                                              </Button>
                                            )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <p className="text-gray-600">
                                          Service Time
                                        </p>
                                        <p className="font-medium">
                                          {computeCombinedTime(billing.slots)}
                                        </p>
                                      </div>
                                      {role !== "agent" && (
                                        <div>
                                          <p className="text-gray-600">Vendors</p>
                                          <p className="font-medium">
                                            {Array.from(
                                              new Set(
                                                billing.slots.map(
                                                  (slot) => slot.vendor_name,
                                                ),
                                              ),
                                            ).join(", ")}
                                          </p>
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-gray-600">
                                          Created Date
                                        </p>
                                        <p className="font-medium">
                                          {new Date(
                                            billing.created_at,
                                          ).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>

                                    {/* GST Breakdown container */}
                                    {rowInvoicesLoading[billing.order_uuid] ? (
                                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        <span>
                                          Loading pricing & tax breakdown...
                                        </span>
                                      </div>
                                    ) : hasInvoice ? (
                                      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-4 text-sm font-alexandria">
                                        <div className="flex gap-6">
                                          <div>
                                            <span className="text-gray-500 block text-xs">
                                              Subtotal
                                            </span>
                                            <span className="font-semibold text-gray-700">
                                              {subtotalVal.toLocaleString(
                                                "en-US",
                                                {
                                                  style: "currency",
                                                  currency: "USD",
                                                },
                                              )}
                                            </span>
                                          </div>
                                          {taxRate > 0 && (
                                            <div>
                                              <span className="text-gray-500 block text-xs">
                                                GST/HST ({taxRate}%)
                                              </span>
                                              <span className="font-semibold text-[#DC9600]">
                                                {taxAmount.toLocaleString(
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
                                              Grand Total
                                            </span>
                                            <span className="font-bold text-gray-800">
                                              {grandTotalVal.toLocaleString(
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
                                              {billing.total_paid.toLocaleString(
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
                                              Balance Due
                                            </span>
                                            <span className="font-bold text-[#E06D5E]">
                                              {displayRemaining.toLocaleString(
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
                                    ) : (
                                      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-4 text-sm font-alexandria">
                                        <div className="flex gap-6">
                                          <div>
                                            <span className="text-gray-500 block text-xs">
                                              Total Amount
                                            </span>
                                            <span className="font-bold text-gray-800">
                                              {billing.total_amount.toLocaleString(
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
                                              {billing.total_paid.toLocaleString(
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
                                              Balance Due
                                            </span>
                                            <span className="font-bold text-[#E06D5E]">
                                              {displayRemaining.toLocaleString(
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
                                    )}
                                  </div>

                                  {/* Services List */}
                                  <div className="space-y-3">
                                    <h3
                                      className="text-[16px] font-[600] uppercase tracking-wide font-alexandria"
                                      style={{
                                        color: roleSettings.pageTabColor,
                                      }}
                                    >
                                      Services ({billing.services.length})
                                    </h3>
                                    {billing.services.map((service) => {
                                      const serviceUuid =
                                        service.uuid ||
                                        service.order_service_uuid;
                                      const serviceTargetInvoice =
                                        getBestTargetInvoice(
                                          orderInvoices,
                                          serviceUuid,
                                        );

                                      const isServiceRefunded =
                                        isRefunded(service.status) ||
                                        isRefunded(
                                          serviceTargetInvoice?.status,
                                        );
                                      const isServicePaid =
                                        (service.status === "paid" ||
                                          isPaidOrSucceeded(
                                            serviceTargetInvoice?.status,
                                          ) ||
                                          billing.status === "paid") &&
                                        !isServiceRefunded;
                                      const isServiceVoid =
                                        serviceTargetInvoice === null;

                                      // Agent media restriction per service
                                      const serviceNumericId = service.service_id;
                                      const svcMediaSet = rowServiceMedia[billing.order_uuid];
                                      const serviceHasMedia =
                                        svcMediaSet === undefined ||
                                        svcMediaSet.has(serviceNumericId) ||
                                        svcMediaSet.has(String(serviceNumericId));
                                      const servicePayBlockedByMedia =
                                        userType === "agent" &&
                                        svcMediaSet !== undefined &&
                                        !serviceHasMedia;

                                      const shouldHideServicePay =
                                        actualOrderCancelled ||
                                        isServiceVoid ||
                                        isServicePaid ||
                                        isServiceRefunded;
                                      return (
                                        <div
                                          key={service.service_id}
                                          className="border border-[#BBBBBB] rounded-[6px] bg-white p-4 transition-all"
                                        >
                                          <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                              <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-4 mb-2">
                                                  <p className="font-semibold text-gray-800">
                                                    {service.service_name}
                                                  </p>
                                                  <span
                                                    className={`px-2 py-0.5 text-[10px] rounded-full text-white font-medium uppercase
                                                  ${
                                                    isServicePaid
                                                      ? "bg-[#6BAE41]"
                                                      : isServiceRefunded
                                                        ? "bg-[#DC9600]"
                                                        : service.status ===
                                                            "pending"
                                                          ? "bg-[#DC9600]"
                                                          : isServiceVoid ||
                                                              service.status ===
                                                                "cancelled"
                                                            ? "bg-[#E06D5E]"
                                                            : "bg-[#7D7D7D]"
                                                  }`}
                                                  >
                                                    {isServicePaid
                                                      ? "paid"
                                                      : isServiceRefunded
                                                        ? "refunded"
                                                        : isServiceVoid
                                                          ? "no invoice"
                                                          : service.status}
                                                  </span>
                                                </div>
                                                <div className="flex gap-2">
                                                  {serviceTargetInvoice ? (
                                                    <Button
                                                      onClick={() =>
                                                        handleInvoiceAction(
                                                          billing,
                                                          "view",
                                                          serviceUuid,
                                                          service.amount,
                                                        )
                                                      }
                                                      disabled={
                                                        actionLoading !== null
                                                      }
                                                      className="h-[30px] px-3 bg-white border border-[#BBBBBB] text-[#666666] rounded-[6px] text-xs font-normal transition-colors flex items-center justify-center min-w-[90px] cursor-pointer"
                                                      onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor =
                                                          roleSettings.pageTabColor;
                                                        e.currentTarget.style.color =
                                                          "white";
                                                        e.currentTarget.style.borderColor =
                                                          roleSettings.pageTabColor;
                                                      }}
                                                      onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor =
                                                          "white";
                                                        e.currentTarget.style.color =
                                                          "#666666";
                                                        e.currentTarget.style.borderColor =
                                                          "#BBBBBB";
                                                      }}
                                                    >
                                                      {actionLoading?.id ===
                                                        serviceUuid &&
                                                      actionLoading?.action ===
                                                        "view" ? (
                                                        <>
                                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                                                          Loading...
                                                        </>
                                                      ) : (
                                                        "Invoice"
                                                      )}
                                                    </Button>
                                                  ) : (
                                                    <Button
                                                      disabled
                                                      className="h-[30px] px-3 bg-gray-100 border border-gray-200 text-gray-400 rounded-[6px] text-xs font-normal flex items-center justify-center min-w-[90px] cursor-not-allowed opacity-80"
                                                    >
                                                      No Invoice
                                                    </Button>
                                                  )}

                                                  {!shouldHideServicePay && (
                                                    <>
                                                      {servicePayBlockedByMedia ? (
                                                        <TooltipProvider delayDuration={0}>
                                                          <Tooltip>
                                                            <TooltipTrigger asChild>
                                                              <span className="inline-block cursor-not-allowed">
                                                                <Button
                                                                  disabled
                                                                  className="h-[30px] px-3 text-white rounded-[6px] text-xs font-normal opacity-50 cursor-not-allowed min-w-[90px]"
                                                                  style={{
                                                                    backgroundColor:
                                                                      roleSettings.pageTabColor,
                                                                  }}
                                                                >
                                                                  Pay Now
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
                                                                Media for {service.service_name}{" "}
                                                                has not been uploaded by the
                                                                vendor yet. Payment will be
                                                                available once the media is added.
                                                              </span>
                                                            </TooltipContent>
                                                          </Tooltip>
                                                        </TooltipProvider>
                                                      ) : (
                                                        <Button
                                                          onClick={() =>
                                                            handleInvoiceAction(
                                                              billing,
                                                              "pay",
                                                              serviceUuid,
                                                              service.amount,
                                                            )
                                                          }
                                                          disabled={
                                                            actionLoading !== null
                                                          }
                                                          className="h-[30px] px-3 text-white rounded-[6px] text-xs font-normal transition-all flex items-center justify-center min-w-[90px] cursor-pointer hover:brightness-110 active:scale-[0.98]"
                                                          style={{
                                                            backgroundColor:
                                                              roleSettings.pageTabColor,
                                                          }}
                                                        >
                                                          {actionLoading?.id ===
                                                            serviceUuid &&
                                                          actionLoading?.action ===
                                                            "pay" ? (
                                                            <>
                                                              <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                                                              Processing...
                                                            </>
                                                          ) : (
                                                            "Pay Now"
                                                          )}
                                                        </Button>
                                                      )}

                                                      {role === "admin" && (
                                                        <Button
                                                          onClick={async () => {
                                                            try {
                                                              setActionLoading({
                                                                id: serviceUuid,
                                                                action: "pay",
                                                              });
                                                              const res =
                                                                await GetInvoicesByOrder(
                                                                  billing.order_uuid,
                                                                );
                                                              const invoicesList =
                                                                Array.isArray(
                                                                  res.data,
                                                                )
                                                                  ? res.data
                                                                  : [res.data];
                                                              const targetInvoice =
                                                                getBestTargetInvoice(
                                                                  invoicesList,
                                                                  serviceUuid,
                                                                );

                                                              if (
                                                                targetInvoice &&
                                                                !isVoidOrCancelled(
                                                                  targetInvoice.status,
                                                                )
                                                              ) {
                                                                handleOpenManualPayment(
                                                                  targetInvoice,
                                                                );
                                                              } else {
                                                                toast.error(
                                                                  "No valid invoice found for this service.",
                                                                );
                                                              }
                                                            } catch (err) {
                                                              console.error(
                                                                err,
                                                              );
                                                              toast.error(
                                                                "Failed to load invoice.",
                                                              );
                                                            } finally {
                                                              setActionLoading(
                                                                null,
                                                              );
                                                            }
                                                          }}
                                                          disabled={
                                                            actionLoading !==
                                                            null
                                                          }
                                                          className="h-[30px] px-3 text-emerald-600 bg-white border border-emerald-500 rounded-[6px] text-xs font-normal transition-all flex items-center justify-center min-w-[90px] cursor-pointer hover:bg-emerald-600 hover:text-white active:scale-[0.98]"
                                                        >
                                                          {actionLoading?.id ===
                                                            serviceUuid &&
                                                          actionLoading?.action ===
                                                            "pay" ? (
                                                            <>
                                                              <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                                                              Loading...
                                                            </>
                                                          ) : (
                                                            "Mark Paid"
                                                          )}
                                                        </Button>
                                                      )}
                                                    </>
                                                  )}

                                                  {isServicePaid &&
                                                    !isServiceRefunded && (
                                                      <>
                                                        <Button
                                                          disabled
                                                          className="h-[30px] px-3 text-white rounded-[6px] text-xs font-normal flex items-center justify-center min-w-[90px] bg-[#6BAE41] cursor-not-allowed opacity-90"
                                                        >
                                                          Paid
                                                        </Button>
                                                        {role === "admin" && (
                                                          <Button
                                                            variant="outline"
                                                            onClick={(e) =>
                                                              handleRefundClick(
                                                                e,
                                                                billing.order_uuid,
                                                                serviceUuid,
                                                                service.amount,
                                                              )
                                                            }
                                                            disabled={
                                                              actionLoading !==
                                                              null
                                                            }
                                                            className="h-[30px] px-3 border border-orange-200 text-orange-600 rounded-[6px] text-xs font-normal transition-colors flex items-center justify-center min-w-[90px] cursor-pointer hover:bg-orange-50"
                                                          >
                                                            {actionLoading?.id ===
                                                              serviceUuid &&
                                                            actionLoading?.action ===
                                                              "refund" ? (
                                                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                            ) : (
                                                              <RotateCcw className="h-4 w-4 mr-2" />
                                                            )}{" "}
                                                            Refund
                                                          </Button>
                                                        )}
                                                      </>
                                                    )}
                                                </div>
                                              </div>
                                              <div className="text-sm text-gray-600 space-y-0.5">
                                                <p>
                                                  Base Price:{" "}
                                                  <span className="font-medium text-gray-800">
                                                    {service.amount.toLocaleString(
                                                      "en-US",
                                                      {
                                                        style: "currency",
                                                        currency: "USD",
                                                      },
                                                    )}
                                                  </span>
                                                </p>
                                                {taxRate > 0 ? (
                                                  <>
                                                    <p className="text-xs text-gray-500">
                                                      GST ({taxRate}%):{" "}
                                                      <span className="font-medium">
                                                        {(
                                                          service.amount *
                                                          (taxRate / 100)
                                                        ).toLocaleString(
                                                          "en-US",
                                                          {
                                                            style: "currency",
                                                            currency: "USD",
                                                          },
                                                        )}
                                                      </span>
                                                    </p>
                                                    <p className="text-[13px] font-semibold text-gray-700">
                                                      Total Price:{" "}
                                                      <span className="text-[#6BAE41]">
                                                        {(
                                                          service.amount *
                                                          (1 + taxRate / 100)
                                                        ).toLocaleString(
                                                          "en-US",
                                                          {
                                                            style: "currency",
                                                            currency: "USD",
                                                          },
                                                        )}
                                                      </span>
                                                    </p>
                                                  </>
                                                ) : null}
                                              </div>

                                              {/* Service-specific invoices */}
                                              {service.related_invoices &&
                                                service.related_invoices
                                                  .length > 0 && (
                                                  <div className="mt-2 space-y-1">
                                                    {service.related_invoices.map(
                                                      (
                                                        invoice,
                                                        invoiceIndex,
                                                      ) => (
                                                        <div
                                                          key={invoiceIndex}
                                                          className="flex items-center gap-2"
                                                        >
                                                          <ExternalLink
                                                            className="w-3 h-3 flex-shrink-0"
                                                            style={{
                                                              color:
                                                                roleSettings.activeColor,
                                                            }}
                                                          />
                                                          <a
                                                            href={
                                                              invoice.invoice_url
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs font-medium hover:underline truncate"
                                                            style={{
                                                              color:
                                                                roleSettings.activeColor,
                                                            }}
                                                            title={
                                                              invoice.invoice_url
                                                            }
                                                          >
                                                            Service Invoice{" "}
                                                            {invoiceIndex + 1}
                                                          </a>
                                                          <span className="text-xs text-gray-500">
                                                            (
                                                            {new Date(
                                                              invoice.paid_at,
                                                            ).toLocaleDateString()}
                                                            )
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
                                    })}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })()}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>

        {filteredBillings.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-[#666666]">
              Showing {paginatedBillings.length} of {filteredBillings.length}{" "}
              Billings
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="text-[#666666]"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[40px] ${
                        currentPage === page ? "text-white" : "text-[#666666]"
                      }`}
                      style={{
                        backgroundColor:
                          currentPage === page
                            ? roleSettings.pageTabColor
                            : "transparent",
                        borderColor:
                          currentPage === page
                            ? roleSettings.pageTabColor
                            : undefined,
                      }}
                    >
                      {page}
                    </Button>
                  ),
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="text-[#666666]"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <BillingDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        onConfirm={confirmAndExecute}
        showAgain={showAgain}
        toggleShowAgain={() => setShowAgain(!showAgain)}
      />

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        uuid={selectedOrderUuid}
      />

      {/* Multiple Invoices Modal for Split Invoices */}
      <Dialog open={showInvoicesModal} onOpenChange={setShowInvoicesModal}>
        <DialogContent className="max-w-4xl w-[95vw] md:w-[850px] rounded-[6px] p-0 font-alexandria overflow-hidden border border-[#BBBBBB] bg-white [&>button]:hidden">
          <DialogHeader className="p-4 sm:p-6 border-b border-[#BBBBBB] bg-white">
            <DialogTitle
              className="flex items-center justify-between text-base sm:text-lg font-bold tracking-tight uppercase"
              style={{ color: roleSettings.pageTabColor }}
            >
              <span>Order Split Invoices</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-gray-100 rounded-full animate-none"
                onClick={() => setShowInvoicesModal(false)}
              >
                <X className="h-5 w-5 text-gray-500" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F9F9F9]">
            {invoicesLoading ? (
              <div className="flex flex-col justify-center items-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500 font-medium">
                  Fetching split invoices...
                </span>
              </div>
            ) : (
              (() => {
                let filteredList = selectedServiceId
                  ? invoices.filter((inv) => {
                      const isConsolidated = inv.notes
                        ?.toLowerCase()
                        .includes("consolidated");
                      const isLateFee =
                        inv.notes?.toLowerCase().includes("late fee") ||
                        inv.notes?.toLowerCase().includes("late_fee") ||
                        inv.type === "late_fee" ||
                        inv.is_late_fee;
                      if (isLateFee) return true; // Show late fee invoices
                      if (isConsolidated) return false;
                      return inv.items?.some((i: any) => {
                        const sUuid =
                          i.order_service?.uuid || i.orderService?.uuid;
                        const sId =
                          i.order_service_id ||
                          i.order_service?.id ||
                          i.orderService?.id;
                        return (
                          sUuid === selectedServiceId ||
                          sId?.toString() === selectedServiceId
                        );
                      });
                    })
                  : invoices.filter(
                      (inv) =>
                        inv.notes?.toLowerCase().includes("consolidated") ||
                        inv.notes?.toLowerCase().includes("late fee") ||
                        inv.notes?.toLowerCase().includes("late_fee") ||
                        inv.type === "late_fee" ||
                        inv.is_late_fee,
                    );

                if (!selectedServiceId && filteredList.length === 0) {
                  filteredList = invoices;
                }

                if (filteredList.length === 0) {
                  return (
                    <div className="text-center py-16 italic text-gray-500 font-medium">
                      No matching split invoices found for this{" "}
                      {selectedServiceId ? "service" : "order"}.
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col gap-4">
                    {filteredList.map((invoice) => {
                      const status = (invoice.status || "unpaid").toUpperCase();
                      let badgeBg = "#E06D5E"; // Unpaid
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
                      } else if (
                        status === "PARTIAL_PAID" ||
                        status === "PARTIALLY_PAID" ||
                        status === "PARTIAL"
                      ) {
                        badgeBg = "#DC9600";
                        badgeText = "Partial";
                      } else if (status === "REFUNDED") {
                        badgeBg = "#D0021B";
                        badgeText = "Refunded";
                      } else if (status === "PARTIALLY_REFUNDED" || status === "PARTIAL_REFUNDED") {
                        badgeBg = "#D9534F";
                        badgeText = "Partially Refunded";
                      }

                      const isOwner =
                        currentUser?.uuid ===
                        (invoice.agent?.uuid || invoice.agent_uuid);
                      const splitPercentage =
                        invoice.split_details?.splits?.find(
                          (s: any) =>
                            s.email === invoice.agent?.email ||
                            s.agent_id === invoice.agent_id,
                        )?.percentage || null;

                      return (
                        <div
                          key={invoice.uuid}
                          className="group flex flex-col md:flex-row justify-between items-start md:items-center p-4 sm:p-5 rounded-[6px] border border-[#BBBBBB] bg-white transition-all duration-300 gap-4"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="font-bold text-[16px] text-gray-800 tracking-tight">
                                Invoice #{invoice.invoice_number || invoice.id}
                              </span>
                              <span
                                className="text-white px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase leading-none"
                                style={{ backgroundColor: badgeBg }}
                              >
                                {badgeText}
                              </span>
                              {invoice.agent_type && (
                                <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-gray-100 text-gray-600 uppercase border border-[#BBBBBB]">
                                  {invoice.agent_type}{" "}
                                  {splitPercentage
                                    ? `(${splitPercentage}%)`
                                    : ""}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-col gap-1 text-[13px] text-gray-500">
                              <span className="font-medium text-gray-700">
                                Agent: {invoice.agent?.first_name}{" "}
                                {invoice.agent?.last_name} (
                                {invoice.agent?.email})
                              </span>
                              <span>
                                Issued:{" "}
                                {new Date(invoice.issued_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )}
                              </span>
                            </div>

                            {invoice.items && invoice.items.length > 0 && (
                              <div className="text-[12px] font-normal text-[#7D7D7D] line-clamp-1">
                                Services:{" "}
                                {invoice.items
                                  .map(
                                    (i: any) => i.description || "Service Item",
                                  )
                                  .join(", ")}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col md:items-end gap-3 min-w-[200px]">
                            <div className="flex flex-col md:items-end">
                              <span className="text-[20px] font-bold text-gray-800">
                                ${parseFloat(invoice.total).toFixed(2)}
                              </span>
                              {parseFloat(invoice.paid_amount) > 0 && (
                                <span className="text-[12px] text-[#6BAE41] font-semibold">
                                  Paid: $
                                  {parseFloat(invoice.paid_amount).toFixed(2)}
                                </span>
                              )}
                            </div>

                            <div className="flex gap-2 flex-wrap w-full md:justify-end">
                              <Button
                                variant="outline"
                                onClick={() => setViewingInvoice(invoice)}
                                className="h-[30px] text-xs px-3 font-normal border border-[#BBBBBB] hover:bg-gray-50 text-[#666666] rounded-[6px] transition-colors"
                              >
                                View Invoice
                              </Button>

                              {status !== "PAID" &&
                                status !== "VOID" &&
                                !isRefunded(status) &&
                                selectedBilling && (
                                  <>
                                    {isOwner ? (
                                      (() => {
                                        const mediaSet = rowServiceMedia[selectedBilling.order_uuid];
                                        const hasAnyMissingMedia =
                                          userType === "agent" &&
                                          mediaSet !== undefined &&
                                          selectedBilling.services.some((svc) =>
                                            !mediaSet.has(svc.service_id) &&
                                            !mediaSet.has(String(svc.service_id))
                                          );
                                        if (hasAnyMissingMedia) {
                                          const missingServices = selectedBilling.services.filter((svc) => !mediaSet.has(svc.service_id) && !mediaSet.has(String(svc.service_id)));
                                          return (
                                            <TooltipProvider delayDuration={0}>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <span className="inline-block cursor-not-allowed">
                                                    <Button
                                                      disabled
                                                      className="h-[30px] text-xs px-3 font-normal text-white opacity-50 cursor-not-allowed rounded-[6px]"
                                                      style={{
                                                        backgroundColor:
                                                          roleSettings.pageTabColor,
                                                      }}
                                                    >
                                                      Pay Now
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
                                                  {missingServices.length === 1 ? (
                                                    <span>
                                                      Media for {missingServices[0].service_name}{" "}
                                                      has not been uploaded by the vendor
                                                      yet. Payment will be available once the
                                                      media is added.
                                                    </span>
                                                  ) : (
                                                    <div>
                                                      <span className="block mb-1">
                                                        Media has not yet been uploaded for
                                                        the following services:
                                                      </span>
                                                      <ul className="list-disc list-inside space-y-0.5 my-1 font-medium text-amber-200/90">
                                                        {missingServices.map((s) => (
                                                          <li key={s.service_id}>
                                                            {s.service_name}
                                                          </li>
                                                        ))}
                                                      </ul>
                                                      <span className="block mt-1">
                                                        Payment will be available once the
                                                        required media has been added.
                                                      </span>
                                                    </div>
                                                  )}
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          );
                                        }
                                        return (
                                          <Button
                                            onClick={() => {
                                              setShowInvoicesModal(false);
                                              handlePayInvoice(
                                                invoice,
                                                selectedBilling,
                                              );
                                            }}
                                            className="h-[30px] text-xs px-3 font-normal text-white hover:brightness-110 rounded-[6px] transition-all active:scale-[0.98]"
                                            style={{
                                              backgroundColor:
                                                roleSettings.pageTabColor,
                                            }}
                                          >
                                            Pay Now
                                          </Button>
                                        );
                                      })()
                                    ) : (
                                      <div className="flex gap-2">
                                        {(userType === "admin" ||
                                          (invoice.agent_type === "co-agent" &&
                                            invoice.split_details)) && (
                                          <Button
                                            onClick={() => {
                                              setShowInvoicesModal(false);
                                              handlePayInvoice(
                                                invoice,
                                                selectedBilling,
                                                "on_behalf",
                                              );
                                            }}
                                            className="h-[30px] text-xs px-3 font-normal text-white hover:brightness-110 rounded-[6px] transition-all active:scale-[0.98] animate-none"
                                            style={{
                                              backgroundColor:
                                                roleSettings.pageTabColor,
                                            }}
                                          >
                                            Pay on Behalf
                                          </Button>
                                        )}
                                        {userType !== "admin" && (
                                          <Button
                                            onClick={() => {
                                              setShowInvoicesModal(false);
                                              handlePayInvoice(
                                                invoice,
                                                selectedBilling,
                                                "self",
                                              );
                                            }}
                                            className="h-[30px] text-xs px-3 font-normal text-white hover:brightness-110 rounded-[6px] transition-all active:scale-[0.98] animate-none"
                                            style={{
                                              backgroundColor:
                                                roleSettings.pageTabColor,
                                            }}
                                          >
                                            Pay Self
                                          </Button>
                                        )}
                                      </div>
                                    )}

                                    {role === "admin" && (
                                      <Button
                                        onClick={() => {
                                          setShowInvoicesModal(false);
                                          handleOpenManualPayment(invoice);
                                        }}
                                        className="h-[30px] text-xs px-3 font-normal text-emerald-600 bg-white border border-emerald-500 rounded-[6px] hover:bg-emerald-50 transition-colors cursor-pointer"
                                      >
                                        Mark Paid
                                      </Button>
                                    )}
                                  </>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Secondary popup for viewing a single invoice document from the split list */}
      {viewingInvoice && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 sm:p-6 md:p-8"
          onClick={() => setViewingInvoice(null)}
        >
          <div
            className="bg-white rounded-[6px] border border-[#BBBBBB] shadow-2xl w-full max-w-4xl h-[95vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-[#BBBBBB]">
              <div className="flex justify-between items-center w-full sm:w-auto">
                <h2
                  className="text-base sm:text-xl font-bold"
                  style={{ color: roleSettings.pageTabColor }}
                >
                  Invoice #{viewingInvoice.invoice_number || viewingInvoice.id}
                </h2>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="text-gray-500 hover:text-gray-700 p-2 sm:hidden"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                {viewingInvoice.status?.toUpperCase() !== "PAID" &&
                  !isRefunded(viewingInvoice.status) &&
                  selectedBilling && (
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      {(() => {
                        const mediaSet = rowServiceMedia[selectedBilling.order_uuid];
                        const hasAnyMissingMedia =
                          userType === "agent" &&
                          mediaSet !== undefined &&
                          selectedBilling.services.some((svc) =>
                            !mediaSet.has(svc.service_id) &&
                            !mediaSet.has(String(svc.service_id))
                          );
                        if (hasAnyMissingMedia) {
                          const missingServices = selectedBilling.services.filter(
                            (svc) =>
                              !mediaSet.has(svc.service_id) &&
                              !mediaSet.has(String(svc.service_id)),
                          );
                          return (
                            <TooltipProvider delayDuration={0}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-block cursor-not-allowed w-full sm:w-auto">
                                    <Button
                                      disabled
                                      className="px-4 sm:px-6 h-[30px] text-xs font-normal text-white opacity-50 cursor-not-allowed rounded-[6px] w-full sm:w-auto"
                                      style={{
                                        backgroundColor: roleSettings.pageTabColor,
                                      }}
                                    >
                                      Pay Now
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
                                  {missingServices.length === 1 ? (
                                    <span>
                                      Media for {missingServices[0].service_name} has not
                                      been uploaded by the vendor yet. Payment will be
                                      available once the media is added.
                                    </span>
                                  ) : (
                                    <div>
                                      <span className="block mb-1">
                                        Media has not yet been uploaded for the following
                                        services:
                                      </span>
                                      <ul className="list-disc list-inside space-y-0.5 my-1 font-medium text-amber-200/90">
                                        {missingServices.map((s) => (
                                          <li key={s.service_id}>{s.service_name}</li>
                                        ))}
                                      </ul>
                                      <span className="block mt-1">
                                        Payment will be available once the required media has
                                        been added.
                                      </span>
                                    </div>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        }
                        return (
                          <Button
                            onClick={() => {
                              setViewingInvoice(null);
                              handlePayInvoice(viewingInvoice, selectedBilling);
                            }}
                            className="px-4 sm:px-6 h-[30px] text-xs font-normal text-white hover:brightness-110 rounded-[6px] cursor-pointer transition-all active:scale-[0.98] w-full sm:w-auto"
                            style={{ backgroundColor: roleSettings.pageTabColor }}
                          >
                            Pay Now
                          </Button>
                        );
                      })()}

                      {role === "admin" && (
                        <Button
                          onClick={() => {
                            setViewingInvoice(null);
                            handleOpenManualPayment(viewingInvoice);
                          }}
                          className="px-4 sm:px-6 h-[30px] text-xs font-normal text-emerald-600 bg-white border border-emerald-500 rounded-[6px] cursor-pointer hover:bg-emerald-50 transition-all active:scale-[0.98] w-full sm:w-auto shrink-0"
                        >
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  )}
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="text-gray-500 hover:text-gray-700 p-2 hidden sm:block"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-4 flex-1">
              <InvoiceDocument
                invoice={viewingInvoice}
                editData={viewingInvoice}
                isEditing={false}
                updateItem={() => {}}
                addItem={() => {}}
                removeItem={() => {}}
                updateTaxRate={() => {}}
                setEditData={() => {}}
                roleSettings={roleSettings}
              />
            </div>
          </div>
        </div>
      )}

      <RefundModal
        isOpen={isRefundModalOpen}
        onClose={() => {
          setIsRefundModalOpen(false);
          setSelectedInvoice(null);
          setRefundDefaultAmount(undefined);
        }}
        invoice={selectedInvoice}
        defaultAmount={refundDefaultAmount}
        onSuccess={() => {
          // Re-fetch billings to update status
          const loadBillings = async () => {
            try {
              setLoading(true);
              const data = await getBillings();
              if (userType === "agent") {
                const userInfo = JSON.parse(
                  localStorage.getItem("userInfo") || "{}",
                );
                const agentUuid = userInfo?.uuid;
                if (agentUuid) {
                  setBillings(data.filter((b) => b.agent_uuid === agentUuid));
                } else {
                  setBillings(data);
                }
              } else {
                setBillings(data);
              }
            } catch (err) {
              console.error("Failed to reload billings:", err);
            } finally {
              setLoading(false);
            }
          };
          loadBillings();
        }}
      />

      {/* Invoice Popup from Invoice Button */}
      {serviceInvoicePopup && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 sm:p-6 md:p-8"
          onClick={() => setServiceInvoicePopup(null)}
        >
          <div
            className="bg-white rounded-[6px] border border-[#BBBBBB] shadow-xl w-full max-w-4xl h-[95vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-[#BBBBBB]">
              <div className="flex justify-between items-center w-full sm:w-auto">
                <h2
                  className="text-base sm:text-xl font-bold"
                  style={{ color: roleSettings.pageTabColor }}
                >
                  Invoice #
                  {serviceInvoicePopup.invoice.invoice_number ||
                    serviceInvoicePopup.invoice.id}
                </h2>
                <button
                  onClick={() => setServiceInvoicePopup(null)}
                  className="text-gray-500 hover:text-gray-700 p-2 sm:hidden"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                {![
                  "PAID",
                  "VOID",
                  "CANCELLED",
                  "CANCELED",
                  "REFUNDED",
                  "PARTIALLY_REFUNDED",
                ].includes(
                  serviceInvoicePopup.invoice.status?.toUpperCase() || "",
                ) && (
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    {(() => {
                        const mediaSet = rowServiceMedia[serviceInvoicePopup.billing.order_uuid];
                        let targetServices = serviceInvoicePopup.billing.services;

                        if (serviceInvoicePopup.serviceId) {
                          const matchedSvc = serviceInvoicePopup.billing.services.find(
                            (s) =>
                              s.order_service_uuid === serviceInvoicePopup.serviceId ||
                              s.uuid === serviceInvoicePopup.serviceId,
                          );
                          if (matchedSvc) targetServices = [matchedSvc];
                        } else if (
                          serviceInvoicePopup.invoice?.items &&
                          serviceInvoicePopup.invoice.items.length > 0
                        ) {
                          const itemSvcIds = new Set<string | number>();
                          serviceInvoicePopup.invoice.items.forEach((item: any) => {
                            const sId =
                              item.order_service?.service_id ||
                              item.order_service?.service?.id ||
                              item.orderService?.service_id ||
                              item.orderService?.service?.id ||
                              item.service_id;
                            if (sId != null) {
                              itemSvcIds.add(sId);
                              itemSvcIds.add(String(sId));
                            }
                          });
                          if (itemSvcIds.size > 0) {
                            const matched = serviceInvoicePopup.billing.services.filter(
                              (s) =>
                                itemSvcIds.has(s.service_id) ||
                                itemSvcIds.has(String(s.service_id)),
                            );
                            if (matched.length > 0) targetServices = matched;
                          }
                        }

                        const missingServices = targetServices.filter(
                          (svc) =>
                            !mediaSet?.has(svc.service_id) &&
                            !mediaSet?.has(String(svc.service_id)),
                        );

                        const hasAnyMissingMedia =
                          userType === "agent" &&
                          mediaSet !== undefined &&
                          missingServices.length > 0;

                        if (hasAnyMissingMedia) {
                          const targetService = targetServices.length === 1 ? targetServices[0] : null;
                         return (
                           <TooltipProvider delayDuration={0}>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <span className="inline-block cursor-not-allowed w-full sm:w-auto">
                                   <Button
                                     disabled
                                     className="px-4 sm:px-6 h-[30px] text-xs font-normal text-white opacity-50 cursor-not-allowed rounded-[6px] w-full sm:w-auto"
                                     style={{
                                       backgroundColor: roleSettings.pageTabColor,
                                     }}
                                   >
                                     Pay Now
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
                                 {targetService || missingServices.length === 1 ? (
                                   <span>
                                     Media for{" "}
                                     {targetService?.service_name ||
                                       missingServices[0]?.service_name}{" "}
                                     has not been uploaded by the vendor yet. Payment will be
                                     available once the media is added.
                                   </span>
                                 ) : (
                                   <div>
                                     <span className="block mb-1">
                                       Media has not yet been uploaded for the following
                                       services:
                                     </span>
                                     <ul className="list-disc list-inside space-y-0.5 my-1 font-medium text-amber-200/90">
                                       {missingServices.map((s) => (
                                         <li key={s.service_id}>{s.service_name}</li>
                                       ))}
                                     </ul>
                                     <span className="block mt-1">
                                       Payment will be available once the required media has
                                       been added.
                                     </span>
                                   </div>
                                 )}
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         );
                       }
                       return (
                         <Button
                           onClick={async () => {
                             try {
                               setActionLoading({
                                 id:
                                   serviceInvoicePopup.serviceId ||
                                   serviceInvoicePopup.billing.order_id,
                                 action: "pay",
                               });
                               await handlePayInvoice(
                                 serviceInvoicePopup.invoice,
                                 serviceInvoicePopup.billing,
                                 undefined,
                                 serviceInvoicePopup.serviceId,
                               );
                             } finally {
                               setActionLoading(null);
                             }
                           }}
                           disabled={actionLoading !== null}
                           className="px-4 sm:px-6 h-[30px] text-xs font-normal text-white hover:brightness-110 rounded-[6px] cursor-pointer transition-all active:scale-[0.98] w-full sm:w-auto"
                           style={{ backgroundColor: roleSettings.pageTabColor }}
                         >
                           {actionLoading?.id ===
                             (serviceInvoicePopup.serviceId ||
                               serviceInvoicePopup.billing.order_id) &&
                           actionLoading?.action === "pay" ? (
                             <>
                               <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                               Processing...
                             </>
                           ) : (
                             "Pay Now"
                           )}
                         </Button>
                       );
                     })()}

                    {role === "admin" && (
                      <Button
                        onClick={() => {
                          setServiceInvoicePopup(null);
                          handleOpenManualPayment(serviceInvoicePopup.invoice);
                        }}
                        disabled={actionLoading !== null}
                        className="px-4 sm:px-6 h-[30px] text-xs font-normal text-emerald-600 bg-white border border-emerald-500 rounded-[6px] cursor-pointer hover:bg-emerald-50 transition-all active:scale-[0.98] w-full sm:w-auto shrink-0"
                      >
                        Mark Paid
                      </Button>
                    )}
                  </div>
                )}
                <button
                  onClick={() => setServiceInvoicePopup(null)}
                  className="text-gray-500 hover:text-gray-700 p-2 hidden sm:block"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-4 flex-1">
              <InvoiceDocument
                invoice={serviceInvoicePopup.invoice}
                editData={serviceInvoicePopup.invoice}
                isEditing={false}
                updateItem={() => {}}
                addItem={() => {}}
                removeItem={() => {}}
                updateTaxRate={() => {}}
                setEditData={() => {}}
                roleSettings={roleSettings}
              />
            </div>
          </div>
        </div>
      )}

      {/* Manual Payment Dialog */}
      <Dialog open={manualPaymentOpen} onOpenChange={setManualPaymentOpen}>
        <DialogContent className="max-w-md w-[95vw] rounded-[6px] p-0 font-alexandria overflow-hidden border border-[#BBBBBB] bg-white [&>button]:hidden">
          <DialogHeader className="p-6 border-b border-[#BBBBBB] bg-white">
            <DialogTitle
              className="flex items-center justify-between text-lg font-bold tracking-tight uppercase"
              style={{ color: roleSettings.pageTabColor }}
            >
              <span>Record Manual Payment</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-gray-100 rounded-full animate-none"
                onClick={() => setManualPaymentOpen(false)}
              >
                <X className="h-5 w-5 text-gray-500" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitManualPayment} className="p-6 space-y-4">
            {manualPaymentInvoice &&
              (() => {
                const totalVal = parseFloat(
                  manualPaymentInvoice.total ||
                    manualPaymentInvoice.total_amount ||
                    "0",
                );
                const paidVal = parseFloat(
                  manualPaymentInvoice.paid_amount ||
                    manualPaymentInvoice.total_paid ||
                    "0",
                );
                const remaining = Math.max(0, totalVal - paidVal);
                return (
                  <div className="bg-gray-50 p-4 rounded-[6px] border border-[#E4E4E4] text-sm space-y-1">
                    <p className="font-semibold text-gray-700">
                      Invoice: #
                      {manualPaymentInvoice.invoice_number ||
                        manualPaymentInvoice.id}
                    </p>
                    <p className="text-gray-500">
                      Total Amount: ${totalVal.toFixed(2)}
                    </p>
                    <p className="text-gray-500">
                      Already Paid: ${paidVal.toFixed(2)}
                    </p>
                    <p className="font-semibold text-red-600">
                      Balance Due: ${remaining.toFixed(2)}
                    </p>
                  </div>
                );
              })()}

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 block">
                Payment Amount ($ CAD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={manualPaymentAmount}
                onChange={(e) => setManualPaymentAmount(e.target.value)}
                className="w-full px-[14px] h-[40px] py-[10px] bg-white border border-[#BBBBBB] rounded-[6px] focus:outline-none focus:ring-2 transition-all text-sm"
                style={
                  {
                    "--tw-ring-color": roleSettings.activeColor,
                  } as React.CSSProperties
                }
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
                placeholder="Enter transaction reference, e-transfer details, cheque numbers, dates..."
                value={manualPaymentNotes}
                onChange={(e) => setManualPaymentNotes(e.target.value)}
                rows={3}
                className="w-full px-[14px] py-[10px] bg-white border border-[#BBBBBB] rounded-[6px] focus:outline-none focus:ring-2 transition-all text-sm resize-none"
                style={
                  {
                    "--tw-ring-color": roleSettings.activeColor,
                  } as React.CSSProperties
                }
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#BBBBBB]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setManualPaymentOpen(false)}
                className="h-[38px] px-4 border border-[#BBBBBB] rounded-[6px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingManualPayment}
                className="h-[38px] px-6 text-white rounded-[6px] font-medium transition-all hover:brightness-110 active:scale-[0.98]"
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
    </div>
  );
};

export default Page;
