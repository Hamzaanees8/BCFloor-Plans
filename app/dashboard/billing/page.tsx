"use client";
import React, { useState, useEffect, useRef } from "react";
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
import { BillingItem, createQuickBilling } from "./billing";
import { getBillings } from "./billing";
import { ChevronDown, ChevronUp, ExternalLink, FileText, Loader2, Plus, RotateCcw, X } from "lucide-react";
import { OrderSlots } from "./billing";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import InvoiceModal from "../invoice/components/InvoiceModal";
import RefundModal from "../invoice/components/RefundModal";
import { GetInvoicesByOrder, PayInvoiceWithStripe } from "../invoice/invoice_api";
import InvoiceDocument from "../invoice/components/InvoiceDocument";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Page = () => {
  const { userType } = useAppContext();
  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string) || 'admin';
  const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    let ancestor = header.parentElement;
    while (ancestor) {
      const style = window.getComputedStyle(ancestor);
      if (style.overflowX === 'hidden' || ancestor.classList.contains('overflow-x-hidden')) {
        ancestor.style.setProperty('overflow-x', 'visible', 'important');
        ancestor.style.setProperty('overflow-y', 'visible', 'important');

        const target = ancestor;
        return () => {
          target.style.removeProperty('overflow-x');
          target.style.removeProperty('overflow-y');
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
        .then(res => {
          if (res.status && Array.isArray(res.data)) {
            setOrganizations(res.data);
          }
        })
        .catch(err => console.error("Failed to fetch organizations:", err));
    }
  }, [isSuperAdmin]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showAgain, setShowAgain] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

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
  const [fetchingInvoice, setFetchingInvoice] = useState(false);
  const [selectedOrderUuid, setSelectedOrderUuid] = useState("");
  const [serviceInvoicePopup, setServiceInvoicePopup] = useState<{
    invoice: any;
    billing: BillingItem;
    serviceId?: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<{ id: string | number, action: "pay" | "view" } | null>(null);

  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);
  const [selectedBilling, setSelectedBilling] = useState<BillingItem | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rowInvoices, setRowInvoices] = useState<{ [orderUuid: string]: any[] }>({});
  const [rowInvoicesLoading, setRowInvoicesLoading] = useState<{ [orderUuid: string]: boolean }>({});

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setServiceInvoicePopup(null);
      }
    };
    if (serviceInvoicePopup) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [serviceInvoicePopup]);

  const handlePayInvoice = async (invoice: any, billing: BillingItem, mode?: "on_behalf" | "self") => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    try {
      const isSplit = !!invoice.split_details;
      const payerUuid = currentUser?.uuid;
      const isOwner = currentUser?.uuid === (invoice.agent?.uuid || invoice.agent_uuid);
      
      let paymentMode: "on_behalf" | "self" | undefined = mode;

      if (isSplit && !paymentMode) {
        if (isOwner) {
          paymentMode = "self";
        } else {
          paymentMode = (invoice.agent_type === "primary" && userType !== "admin") ? "self" : "on_behalf";
        }
      }

      await PayInvoiceWithStripe(
        invoice,
        { agent: { uuid: billing.agent_uuid }, id: billing.order_id },
        typeof window !== "undefined" ? window.location.href : "dashboard/billing",
        undefined,
        isSplit ? paymentMode : undefined,
        isSplit ? payerUuid : undefined,
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate payment.");
    }
  };

  const handleInvoiceAction = async (billing: BillingItem, action: "pay" | "view", serviceId?: string, serviceAmount?: number) => {
    try {
      setInvoicesLoading(true);
      setActionLoading({ id: serviceId || billing.order_id, action });
      const res = await GetInvoicesByOrder(billing.order_uuid);
      const invoicesList = Array.isArray(res.data) ? res.data : [res.data];

      if (invoicesList.length > 1) {
        setActionLoading(null);
        setInvoices(invoicesList);
        setSelectedBilling(billing);
        setSelectedOrderUuid(billing.order_uuid);
        setSelectedServiceId(serviceId || null);
        setShowInvoicesModal(true);
        setInvoicesLoading(false);
        return;
      }

      const invoice = invoicesList[0];

      if (invoice) {
        if (action === "view") {
          setActionLoading(null);
          setServiceInvoicePopup({ invoice, billing, serviceId });
        } else if (action === "pay") {
          await PayInvoiceWithStripe(
            invoice,
            { agent: { uuid: billing.agent_uuid }, id: billing.order_id },
            typeof window !== "undefined" ? window.location.href : "dashboard/billing",
            serviceId
          );
        }
      } else {
        if (action === "pay") {
          const amount = serviceId ? (serviceAmount || 0) : billing.remaining_amount;
          await handlePay(billing.order_id, billing.agent_uuid ?? "", amount, {
            paymentType: serviceId ? "service" : "full",
            serviceId
          });
        } else {
          setActionLoading(null);
          toast.error("Could not find invoice for this order.");
        }
      }
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
      if (billing && !rowInvoices[billing.order_uuid] && !rowInvoicesLoading[billing.order_uuid]) {
        setRowInvoicesLoading(prev => ({ ...prev, [billing.order_uuid]: true }));
        try {
          const res = await GetInvoicesByOrder(billing.order_uuid);
          const invoicesList = Array.isArray(res.data) ? res.data : [res.data];
          setRowInvoices(prev => ({ ...prev, [billing.order_uuid]: invoicesList }));
        } catch (err) {
          console.error("Failed to load row invoice:", err);
        } finally {
          setRowInvoicesLoading(prev => ({ ...prev, [billing.order_uuid]: false }));
        }
      }
    }
  };

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) return; // no payment session to process

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
          }
        );
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || result.error || "Payment processing failed"
          );
        }

        toast.success("Payment processed successfully! ");

        // remove session_id from URL
        const params = new URLSearchParams(searchParams.toString());
        params.delete("session_id");
        router.replace(`?${params.toString()}`);
      } catch (error) {
        console.error("Stripe session error:", error);
        toast.error(
          error instanceof Error
            ? error.message || "Unable to verify payment session."
            : "Unable to verify payment session."
        );
      }
    };

    processStripePayment();
  }, [searchParams, router]);

  useEffect(() => {
    const loadBillings = async () => {
      try {
        setLoading(true);
        const data = await getBillings();

        // If user is an agent, filter data immediately to their own
        if (userType === 'agent') {
          const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
          const agentUuid = userInfo?.uuid;
          if (agentUuid) {
            const agentFilteredData = data.filter(b => b.agent_uuid === agentUuid);
            setBillings(agentFilteredData);
            console.log("Fetched and filtered billings for agent:", agentFilteredData);
          } else {
            setBillings(data);
          }
        } else {
          setBillings(data);
          console.log("Fetched billings:", data);
        }
      } catch (err) {
        console.error("Failed to load billings:", err);
      } finally {
        setLoading(false);
      }
    };
    loadBillings();
  }, [userType]);

  const uniqueAgents = Array.from(
    new Set(billings.map((billing) => billing.agent_name).filter(Boolean))
  );

  // Filter billings based on selected filters
  const filteredBillings = billings.filter((billing) => {
    // Org Filter
    if (orgFilter !== "all" && String(billing.organization_id) !== orgFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== "all" && billing.status !== statusFilter) {
      return false;
    }

    // Agent filter
    if (agentFilter !== "all" && billing.agent_name !== agentFilter) {
      return false;
    }

    // Address/Order ID filter - search in both address and order_id
    if (addressFilter) {
      const searchTerm = addressFilter.toLowerCase();
      const propertyAddr = (billing.property_address || "").toLowerCase();
      const propertyLoc = (billing.property_location || "").toLowerCase();
      const matchesProperty = propertyAddr.includes(searchTerm) || propertyLoc.includes(searchTerm);

      const matchesAddress = billing.slots.some((slot) =>
        `${slot.address} ${slot.location}`.toLowerCase().includes(searchTerm)
      );
      const matchesOrderId = billing.order_id?.toString().includes(addressFilter);

      if (!matchesProperty && !matchesAddress && !matchesOrderId) {
        return false;
      }
    }

    return true;
  });

  // Sort billings by order_id
  const sortedBillings = [...filteredBillings].sort((a, b) => {
    const orderA = a.order_id || 0;
    const orderB = b.order_id || 0;
    return sortOrder === "asc" ? orderA - orderB : orderB - orderA;
  });

  const getOrderInvoiceUrl = (billing: BillingItem) => {
    // Use the order-level invoices array
    if (billing.invoices && billing.invoices.length > 0) {
      return billing.invoices[0]?.invoice_url || null;
    }
    return null;
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "—";
    return timeStr.slice(0, 5); // Get HH:MM format
  };

  const computeCombinedTime = (slots: OrderSlots[]) => {
    if (!slots || slots.length === 0) return "—";

    const sorted = [...slots].sort(
      (a, b) =>
        new Date(`1970-01-01T${a.start_time}`).getTime() -
        new Date(`1970-01-01T${b.start_time}`).getTime()
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const start = formatTime(first.start_time);
    const end = formatTime(last.end_time);

    const startDate = new Date(`1970-01-01T${first.start_time}`);
    const endDate = new Date(`1970-01-01T${last.end_time}`);
    const diffMin = Math.max(
      0,
      Math.round((endDate.getTime() - startDate.getTime()) / 60000)
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
    }
  ) => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "/dashboard/billing";
      await createQuickBilling(
        order_uuid,
        url,
        agent_uuid,
        amount,
        options
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleRefundClick = async (e: React.MouseEvent, orderUuid: string) => {
    e.stopPropagation();
    try {
      setFetchingInvoice(true);
      // Fetch specifically for this order
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices?order_uuid=${orderUuid}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const res = await response.json();
      const invoice = Array.isArray(res.data) ? res.data[0] : res.data;

      if (invoice) {
        setSelectedInvoice(invoice);
        setIsRefundModalOpen(true);
      } else {
        toast.error("Could not find invoice for this order.");
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

  return (
    <div>
      <div
        ref={headerRef}
        className="w-full h-[80px] font-alexandria sticky top-0 z-50 flex justify-between px-[20px] items-center"
        style={{ backgroundColor: roleSettings.pageBg, boxShadow: "0px 4px 4px #0000001F" }}
      >
        <div className='flex items-center gap-4'>
          <p className='text-[16px] md:text-[24px] font-[400]' style={{ color: roleSettings.pageTabColor }}>
            Billing ({sortedBillings.length})
          </p>
        </div>

        {role === 'admin' && (
          <Button
            onClick={() => router.push('/dashboard/invoice/create')}
            className='w-[140px] md:w-[170px] h-[35px] md:h-[44px] rounded-[6px] text-[14px] md:text-[16px] font-[400] text-white flex gap-[5px] justify-center items-center hover:brightness-110 active:scale-[0.98] transition-all'
            style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
          >
            <Plus className="h-4 w-4" /> Create Invoice
          </Button>
        )}
      </div>

      {/* Filters Section */}
      <div className="p-4 border-b sticky top-[80px] z-40 border-[#BBBBBB]" style={{ backgroundColor: roleSettings.pageBg }}>
        <div className={`grid grid-cols-1 md:grid-cols-2 ${isSuperAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
          {/* Organization Filter - Super Admin Only */}
          {isSuperAdmin && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Organization
              </label>
              <Select value={orgFilter} onValueChange={setOrgFilter}>
                <SelectTrigger className="w-full border-[#BBBBBB]" style={{ backgroundColor: roleSettings.pageBg }}>
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
              <SelectTrigger className="w-full border-[#BBBBBB]" style={{ backgroundColor: roleSettings.pageBg }}>
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
          {userType !== 'agent' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Agent
              </label>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-full border-[#BBBBBB]" style={{ backgroundColor: roleSettings.pageBg }}>
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
              style={{
                backgroundColor: roleSettings.pageBg,
                '--tw-ring-color': roleSettings.activeColor,
              } as React.CSSProperties}
            />
          </div>
        </div>
      </div>

      <div className="w-full relative">
        <Table className="font-alexandria px-0 overflow-x-auto whitespace-nowrap">
          <TableHeader>
            <TableRow className="font-alexandria h-[54px]" style={{ backgroundColor: roleSettings.pageBg }}>
              <TableHead
                className="text-[14px] font-[700] text-[#7D7D7D] pl-[20px] cursor-pointer select-none"
                style={{ color: sortOrder === "asc" || sortOrder === "desc" ? roleSettings.pageTabColor : "#7D7D7D" }}
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
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
                <TableRow key={index} className="bg-white hover:bg-white border-b border-[#E4E4E4]">
                  <TableCell className="py-4"><Skeleton className="h-4 w-[60px] bg-gray-200" /></TableCell>
                  <TableCell className="py-4"><Skeleton className="h-4 w-[100px] bg-gray-200" /></TableCell>
                  <TableCell className="py-4"><Skeleton className="h-4 w-[150px] bg-gray-200" /></TableCell>
                  <TableCell className="py-4"><Skeleton className="h-4 w-[80px] bg-gray-200" /></TableCell>
                  <TableCell className="py-4"><Skeleton className="h-4 w-[80px] bg-gray-200" /></TableCell>
                  <TableCell className="py-4"><Skeleton className="h-4 w-[80px] bg-gray-200" /></TableCell>
                  <TableCell className="py-4 text-center px-[20px]"><Skeleton className="h-5 w-[60px] bg-gray-200 rounded-full mx-auto" /></TableCell>
                  <TableCell className="py-4 text-center"><Skeleton className="h-5 w-5 bg-gray-200 rounded mx-auto" /></TableCell>
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
                        {billing.total_amount.toLocaleString("en-US", {
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
                        {billing.remaining_amount.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </TableCell>
                      <TableCell className="text-[10px] py-[19px] px-[20px] text-center font-[400] text-[#7D7D7D]">
                        <label
                          className={`px-[7px] py-[1.5px] text-white rounded-[10px] leading-[100%] 
                               ${billing.status === "paid"
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
                            style={{ color: '#7D7D7D' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = roleSettings.activeColor;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#7D7D7D';
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderUuid(billing.order_uuid);
                              setIsInvoiceModalOpen(true);
                            }}
                            title="View Invoice"
                          >
                            <FileText className="h-4 w-4" />
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
                    {expandedRow === index && (() => {
                      const orderInvoices = rowInvoices[billing.order_uuid] || [];
                      const primaryInvoice = orderInvoices.find((inv) => (inv.agent_type === "primary" || (inv.agent && !inv.split_details))) || orderInvoices[0];
                      const taxRate = parseFloat(primaryInvoice?.tax_rate || "0");
                      const taxAmount = parseFloat(primaryInvoice?.tax_amount || "0");
                      const subtotalVal = parseFloat(primaryInvoice?.subtotal || "0");
                      const grandTotalVal = parseFloat(primaryInvoice?.total || primaryInvoice?.total_amount || "0");
                      const hasInvoice = orderInvoices.length > 0;

                      return (
                        <TableRow className="bg-gray-50/50">
                          <TableCell colSpan={isSuperAdmin ? 9 : 8} className="p-0">
                            <div className="overflow-hidden transition-all duration-300 p-6">
                              <div className="space-y-4">
                                {/* Order Summary */}
                                <div className="bg-white p-6 rounded-[6px] border border-[#BBBBBB]">
                                  <h3 className="text-[16px] font-[600] uppercase tracking-wide mb-4 font-alexandria" style={{ color: roleSettings.pageTabColor }}>
                                    Order Summary
                                  </h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-600">
                                        Service Time
                                      </p>
                                      <p className="font-medium">
                                        {computeCombinedTime(billing.slots)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">Vendors</p>
                                      <p className="font-medium">
                                        {Array.from(
                                          new Set(
                                            billing.slots.map(
                                              (slot) => slot.vendor_name
                                            )
                                          )
                                        ).join(", ")}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">
                                        Created Date
                                      </p>
                                      <p className="font-medium">
                                        {new Date(
                                          billing.created_at
                                        ).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div>
                                      <div className="flex flex-col gap-3">
                                        {orderInvoiceUrl && (
                                          <a
                                            href={orderInvoiceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs font-medium mb-1 hover:underline"
                                            style={{ color: roleSettings.activeColor }}
                                          >
                                            <ExternalLink className="w-4 h-4" />
                                            Stripe Invoice
                                          </a>
                                        )}
                                        <div className="flex gap-2 items-center">
                                          <Button
                                            onClick={() => handleInvoiceAction(billing, "view")}
                                            disabled={actionLoading !== null}
                                            className="h-[35px] px-4 border border-[#BBBBBB] text-[#666666] bg-white rounded-[6px] text-xs font-normal transition-colors flex items-center justify-center min-w-[100px] cursor-pointer hover:bg-gray-50"
                                          >
                                            {actionLoading?.id === billing.order_id && actionLoading?.action === "view" ? (
                                              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...</>
                                            ) : (
                                              "Invoice"
                                            )}
                                          </Button>

                                          {billing.remaining_amount > 0 && (
                                            <Button
                                              onClick={() => handleInvoiceAction(billing, "pay")}
                                              disabled={actionLoading !== null}
                                              className="h-[35px] px-4 text-white rounded-[6px] text-xs font-normal transition-all flex items-center justify-center min-w-[100px] cursor-pointer hover:brightness-110 active:scale-[0.98]"
                                              style={{ backgroundColor: roleSettings.pageTabColor }}
                                            >
                                              {actionLoading?.id === billing.order_id && actionLoading?.action === "pay" ? (
                                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                                              ) : (
                                                "Pay All"
                                              )}
                                            </Button>
                                          )}
                                          {role === 'admin' && billing.status === 'paid' && (
                                            <Button
                                              variant="outline"
                                              onClick={(e) => handleRefundClick(e, billing.order_uuid)}
                                              className="h-[35px] px-4 border border-orange-200 text-orange-600 rounded-[6px] text-xs font-normal transition-colors flex items-center justify-center min-w-[100px] cursor-pointer hover:bg-orange-50"
                                              disabled={fetchingInvoice}
                                            >
                                              {fetchingInvoice ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />} Refund
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* GST Breakdown container */}
                                  {rowInvoicesLoading[billing.order_uuid] ? (
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      <span>Loading pricing & tax breakdown...</span>
                                    </div>
                                  ) : hasInvoice ? (
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-4 text-sm font-alexandria">
                                      <div className="flex gap-6">
                                        <div>
                                          <span className="text-gray-500 block text-xs">Subtotal</span>
                                          <span className="font-semibold text-gray-700">
                                            {subtotalVal.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                                          </span>
                                        </div>
                                        {taxRate > 0 && (
                                          <div>
                                            <span className="text-gray-500 block text-xs">GST/HST ({taxRate}%)</span>
                                            <span className="font-semibold text-[#DC9600]">
                                              {taxAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                                            </span>
                                          </div>
                                        )}
                                        <div>
                                          <span className="text-gray-500 block text-xs">Grand Total</span>
                                          <span className="font-bold text-gray-800">
                                            {grandTotalVal.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 block text-xs">Total Paid</span>
                                          <span className="font-semibold text-[#6BAE41]">
                                            {billing.total_paid.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 block text-xs">Balance Due</span>
                                          <span className="font-bold text-[#E06D5E]">
                                            {billing.remaining_amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-4 text-sm font-alexandria">
                                      <div className="flex gap-6">
                                        <div>
                                          <span className="text-gray-500 block text-xs">Total Amount</span>
                                          <span className="font-bold text-gray-800">
                                            {billing.total_amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 block text-xs">Total Paid</span>
                                          <span className="font-semibold text-[#6BAE41]">
                                            {billing.total_paid.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 block text-xs">Balance Due</span>
                                          <span className="font-bold text-[#E06D5E]">
                                            {billing.remaining_amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Services List */}
                                <div className="space-y-3">
                                  <h3 className="text-[16px] font-[600] uppercase tracking-wide font-alexandria" style={{ color: roleSettings.pageTabColor }}>
                                    Services ({billing.services.length})
                                  </h3>
                                  {billing.services.map((service) => (
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
                                                ${service.status ===
                                                    "completed" ||
                                                    service.status === "paid"
                                                    ? "bg-[#6BAE41]"
                                                    : service.status === "pending"
                                                      ? "bg-[#DC9600]"
                                                      : service.status ===
                                                        "cancelled"
                                                        ? "bg-[#E06D5E]"
                                                        : "bg-[#7D7D7D]"
                                                  }`}
                                              >
                                                {service.status}
                                              </span>
                                            </div>
                                            <div className="flex gap-2">
                                              <Button
                                                onClick={() => handleInvoiceAction(billing, "view", service.order_service_uuid, service.amount)}
                                                disabled={actionLoading !== null}
                                                className="h-[30px] px-3 bg-white border border-[#BBBBBB] text-[#666666] rounded-[6px] text-xs font-normal transition-colors flex items-center justify-center min-w-[90px] cursor-pointer hover:bg-gray-50"
                                              >
                                                {actionLoading?.id === service.order_service_uuid && actionLoading?.action === "view" ? (
                                                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...</>
                                                ) : (
                                                  "Invoice"
                                                )}
                                              </Button>
                                              {service.status !== "paid" && billing.status !== "paid" && (
                                                <Button
                                                  onClick={() => handleInvoiceAction(billing, "pay", service.order_service_uuid, service.amount)}
                                                  disabled={actionLoading !== null}
                                                  className="h-[30px] px-3 text-white rounded-[6px] text-xs font-normal transition-all flex items-center justify-center min-w-[90px] cursor-pointer hover:brightness-110 active:scale-[0.98]"
                                                  style={{ backgroundColor: roleSettings.pageTabColor }}
                                                >
                                                  {actionLoading?.id === service.order_service_uuid && actionLoading?.action === "pay" ? (
                                                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                                                  ) : (
                                                    "Pay Now"
                                                  )}
                                                </Button>
                                              )}
                                              {(service.status === "paid" || billing.status === "paid") && (
                                                <Button
                                                  disabled
                                                  className="h-[30px] px-3 text-white rounded-[6px] text-xs font-normal flex items-center justify-center min-w-[90px] bg-[#6BAE41] cursor-not-allowed opacity-90"
                                                >
                                                  Paid
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                          <div className="text-sm text-gray-600 space-y-0.5">
                                            <p>
                                              Base Price:{" "}
                                              <span className="font-medium text-gray-800">
                                                {service.amount.toLocaleString("en-US", {
                                                  style: "currency",
                                                  currency: "USD",
                                                })}
                                              </span>
                                            </p>
                                            {taxRate > 0 ? (
                                              <>
                                                <p className="text-xs text-gray-500">
                                                  GST ({taxRate}%):{" "}
                                                  <span className="font-medium">
                                                    {(service.amount * (taxRate / 100)).toLocaleString("en-US", {
                                                      style: "currency",
                                                      currency: "USD",
                                                    })}
                                                  </span>
                                                </p>
                                                <p className="text-[13px] font-semibold text-gray-700">
                                                  Total Price:{" "}
                                                  <span className="text-[#6BAE41]">
                                                    {(service.amount * (1 + taxRate / 100)).toLocaleString("en-US", {
                                                      style: "currency",
                                                      currency: "USD",
                                                    })}
                                                  </span>
                                                </p>
                                              </>
                                            ) : null}
                                          </div>

                                          {/* Service-specific invoices */}
                                          {service.related_invoices &&
                                            service.related_invoices.length >
                                            0 && (
                                              <div className="mt-2 space-y-1">
                                                {service.related_invoices.map(
                                                  (invoice, invoiceIndex) => (
                                                    <div
                                                      key={invoiceIndex}
                                                      className="flex items-center gap-2"
                                                    >
                                                      <ExternalLink className="w-3 h-3 flex-shrink-0" style={{ color: roleSettings.activeColor }} />
                                                      <a
                                                        href={invoice.invoice_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs font-medium hover:underline truncate"
                                                        style={{ color: roleSettings.activeColor }}
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
                                                          invoice.paid_at
                                                        ).toLocaleDateString()}
                                                        )
                                                      </span>
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
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
                      className={`min-w-[40px] ${currentPage === page
                        ? "text-white"
                        : "text-[#666666]"
                        }`}
                      style={{ backgroundColor: currentPage === page ? roleSettings.pageTabColor : 'transparent', borderColor: currentPage === page ? roleSettings.pageTabColor : undefined }}
                    >
                      {page}
                    </Button>
                  )
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
          <DialogHeader className="p-6 border-b border-[#BBBBBB] bg-white">
            <DialogTitle className="flex items-center justify-between text-lg font-bold tracking-tight uppercase" style={{ color: roleSettings.pageTabColor }}>
              <span>Order Split Invoices</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 rounded-full animate-none" onClick={() => setShowInvoicesModal(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-y-auto p-6 space-y-4 bg-[#F9F9F9]">
            {invoicesLoading ? (
              <div className="flex flex-col justify-center items-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500 font-medium">Fetching split invoices...</span>
              </div>
            ) : (() => {
              let filteredList = selectedServiceId
                ? invoices.filter(inv => {
                    const isConsolidated = inv.notes?.toLowerCase().includes("consolidated");
                    if (isConsolidated) return false;
                    return inv.items?.some((i: any) => i.order_service?.uuid === selectedServiceId || i.order_service_id?.toString() === selectedServiceId);
                  })
                : invoices.filter(inv => inv.notes?.toLowerCase().includes("consolidated"));

              if (!selectedServiceId && filteredList.length === 0) {
                filteredList = invoices;
              }

              if (filteredList.length === 0) {
                return (
                  <div className="text-center py-16 italic text-gray-500 font-medium">
                    No matching split invoices found for this {selectedServiceId ? "service" : "order"}.
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
                    } else if (status === "PARTIAL_PAID" || status === "PARTIALLY_PAID" || status === "PARTIAL") {
                      badgeBg = "#DC9600";
                      badgeText = "Partial";
                    } else if (status === "REFUNDED") {
                      badgeBg = "#D0021B";
                      badgeText = "Refunded";
                    }

                    const isOwner = currentUser?.uuid === (invoice.agent?.uuid || invoice.agent_uuid);
                    const splitPercentage = invoice.split_details?.splits?.find((s: any) => s.email === invoice.agent?.email || s.agent_id === invoice.agent_id)?.percentage || null;

                    return (
                      <div
                        key={invoice.uuid}
                        className="group flex flex-col md:flex-row justify-between items-start md:items-center p-5 rounded-[6px] border border-[#BBBBBB] bg-white transition-all duration-300 gap-4"
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
                                {invoice.agent_type} {splitPercentage ? `(${splitPercentage}%)` : ""}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-1 text-[13px] text-gray-500">
                            <span className="font-medium text-gray-700">
                              Agent: {invoice.agent?.first_name} {invoice.agent?.last_name} ({invoice.agent?.email})
                            </span>
                            <span>
                              Issued: {new Date(invoice.issued_at).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>

                          {invoice.items && invoice.items.length > 0 && (
                            <div className="text-[12px] font-normal text-[#7D7D7D] line-clamp-1">
                              Services: {invoice.items.map((i: any) => i.description || "Service Item").join(", ")}
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
                                Paid: ${parseFloat(invoice.paid_amount).toFixed(2)}
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

                            {status !== "PAID" && status !== "VOID" && selectedBilling && (
                              isOwner ? (
                                <Button
                                  onClick={() => {
                                    setShowInvoicesModal(false);
                                    handlePayInvoice(invoice, selectedBilling);
                                  }}
                                  className="h-[30px] text-xs px-3 font-normal text-white hover:brightness-110 rounded-[6px] transition-all active:scale-[0.98]"
                                  style={{ backgroundColor: roleSettings.pageTabColor }}
                                >
                                  Pay Now
                                </Button>
                              ) : (
                                <div className="flex gap-2">
                                  {(userType === "admin" || (invoice.agent_type === "co-agent" && invoice.split_details)) && (
                                    <Button
                                      onClick={() => {
                                        setShowInvoicesModal(false);
                                        handlePayInvoice(invoice, selectedBilling, "on_behalf");
                                      }}
                                      className="h-[30px] text-xs px-3 font-normal text-white hover:brightness-110 rounded-[6px] transition-all active:scale-[0.98] animate-none"
                                      style={{ backgroundColor: roleSettings.pageTabColor }}
                                    >
                                      Pay on Behalf
                                    </Button>
                                  )}
                                  {userType !== "admin" && (
                                    <Button
                                      onClick={() => {
                                        setShowInvoicesModal(false);
                                        handlePayInvoice(invoice, selectedBilling, "self");
                                      }}
                                      className="h-[30px] text-xs px-3 font-normal text-white hover:brightness-110 rounded-[6px] transition-all active:scale-[0.98] animate-none"
                                      style={{ backgroundColor: roleSettings.pageTabColor }}
                                    >
                                      Pay Self
                                    </Button>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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
            <div className="flex justify-between items-center p-4 border-b border-[#BBBBBB]">
              <h2 className="text-xl font-bold" style={{ color: roleSettings.pageTabColor }}>
                Invoice #{viewingInvoice.invoice_number || viewingInvoice.id}
              </h2>
              <div className="flex items-center gap-4">
                {viewingInvoice.status?.toUpperCase() !== 'PAID' && selectedBilling && (
                  <Button
                    onClick={() => {
                      setViewingInvoice(null);
                      handlePayInvoice(viewingInvoice, selectedBilling);
                    }}
                    className="px-6 h-[30px] text-xs font-normal text-white hover:brightness-110 rounded-[6px] cursor-pointer transition-all active:scale-[0.98]"
                    style={{ backgroundColor: roleSettings.pageTabColor }}
                  >
                    Pay Now
                  </Button>
                )}
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="text-gray-500 hover:text-gray-700 p-2"
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
                updateItem={() => { }}
                addItem={() => { }}
                removeItem={() => { }}
                updateTaxRate={() => { }}
                setEditData={() => { }}
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
        }}
        invoice={selectedInvoice}
        onSuccess={() => {
          // Re-fetch billings to update status
          const loadBillings = async () => {
            try {
              setLoading(true);
              const data = await getBillings();
              if (userType === 'agent') {
                const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
                const agentUuid = userInfo?.uuid;
                if (agentUuid) {
                  setBillings(data.filter(b => b.agent_uuid === agentUuid));
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
            <div className="flex justify-between items-center p-4 border-b border-[#BBBBBB]">
              <h2 className="text-xl font-bold" style={{ color: roleSettings.pageTabColor }}>
                Invoice #{serviceInvoicePopup.invoice.invoice_number || serviceInvoicePopup.invoice.id}
              </h2>
              <div className="flex items-center gap-4">
                {serviceInvoicePopup.invoice.status?.toUpperCase() !== 'PAID' && (
                  <Button
                    onClick={() => {
                      handleInvoiceAction(serviceInvoicePopup.billing, "pay", serviceInvoicePopup.serviceId);
                    }}
                    disabled={actionLoading !== null}
                    className="px-6 h-[30px] text-xs font-normal text-white hover:brightness-110 rounded-[6px] cursor-pointer transition-all active:scale-[0.98]"
                    style={{ backgroundColor: roleSettings.pageTabColor }}
                  >
                    {actionLoading?.id === (serviceInvoicePopup.serviceId || serviceInvoicePopup.billing.order_id) && actionLoading?.action === "pay" ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                    ) : "Pay Now"}
                  </Button>
                )}
                <button
                  onClick={() => setServiceInvoicePopup(null)}
                  className="text-gray-500 hover:text-gray-700 p-2"
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
                updateItem={() => { }}
                addItem={() => { }}
                removeItem={() => { }}
                updateTaxRate={() => { }}
                setEditData={() => { }}
                roleSettings={roleSettings}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
