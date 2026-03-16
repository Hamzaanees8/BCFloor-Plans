"use client";
import React, { useState, useEffect, useRef } from "react";
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
import { ChevronDown, ChevronUp, ExternalLink, FileText, Loader2, Plus, RotateCcw } from "lucide-react";
import { OrderSlots } from "./billing";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import InvoiceModal from "../invoice/components/InvoiceModal";
import RefundModal from "../invoice/components/RefundModal";

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

  const confirmAndExecute = () => {
    pendingAction?.();
    setPendingAction(null);
  };

  const toggleRow = (index: number) => {
    setExpandedRow(expandedRow === index ? null : index);
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
      const matchesAddress = billing.slots.some((slot) =>
        `${slot.address} ${slot.location}`.toLowerCase().includes(searchTerm)
      );
      const matchesOrderId = billing.order_id?.toString().includes(addressFilter);

      if (!matchesAddress && !matchesOrderId) {
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
      const url = "/dashboard/billing";
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
      <div className="p-4 border-b sticky top-[80px] z-40" style={{ backgroundColor: roleSettings.pageBg }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Status
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full" style={{ backgroundColor: roleSettings.pageBg }}>
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
                <SelectTrigger className="w-full" style={{ backgroundColor: roleSettings.pageBg }}>
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
              className="w-full px-3 h-[35px] py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ backgroundColor: roleSettings.pageBg }}
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
              <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">
                Address
              </TableHead>
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
                const address = billing.slots[0]
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
                      <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                        {address}
                      </TableCell>
                      <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                        {billing.total_amount.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </TableCell>
                      <TableCell className="text-[15px] py-[19px] font-[400] text-green-600">
                        {billing.total_paid.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </TableCell>
                      <TableCell className="text-[15px] py-[19px] font-[400] text-red-600">
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
                            className="h-8 w-8 text-gray-500 hover:text-blue-600"
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
                    {expandedRow === index && (
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={8} className="p-0">
                          <div className="overflow-hidden transition-all duration-300 p-6">
                            <div className="space-y-4">
                              {/* Order Summary */}
                              <div className="bg-white p-4 rounded-lg border shadow-sm">
                                <h3 className="font-semibold text-lg mb-3">
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
                                          className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm font-medium mb-1"
                                        >
                                          <ExternalLink className="w-4 h-4" />
                                          Stripe Invoice
                                        </a>
                                      )}
                                      <div className="flex gap-2 items-center">
                                        {billing.remaining_amount > 0 && (
                                          <Button
                                            onClick={() =>
                                              handlePay(
                                                billing.order_id,
                                                billing.agent_uuid ?? "",
                                                billing.remaining_amount,
                                                {
                                                  paymentType: "full",
                                                }
                                              )
                                            }
                                            className='px-6 py-4 text-white rounded-md text-sm shadow transition-colors flex items-center justify-center min-w-[100px] cursor-pointer hover:brightness-110'
                                            style={{ backgroundColor: roleSettings.pageTabColor }}
                                          >
                                            Pay All
                                          </Button>
                                        )}
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedOrderUuid(billing.order_uuid);
                                            setIsInvoiceModalOpen(true);
                                          }}
                                          className='px-6 py-4 border-gray-200 text-gray-700 rounded-md text-sm shadow transition-colors flex items-center justify-center min-w-[100px] cursor-pointer hover:bg-gray-50'
                                        >
                                          View Full Invoice
                                        </Button>
                                        {role === 'admin' && billing.status === 'paid' && (
                                          <Button
                                            variant="outline"
                                            onClick={(e) => handleRefundClick(e, billing.order_uuid)}
                                            className='px-6 py-4 border-orange-200 text-orange-600 rounded-md text-sm shadow transition-colors flex items-center justify-center min-w-[100px] cursor-pointer hover:bg-orange-50'
                                            disabled={fetchingInvoice}
                                          >
                                            {fetchingInvoice ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />} Refund
                                          </Button>
                                        )}
                                      </div>
                                      {billing.remaining_amount > 0 && (
                                        <p className="text-xs font-semibold text-red-500">
                                          Unpaid Amount:{" "}
                                          {billing.remaining_amount.toLocaleString(
                                            "en-US",
                                            {
                                              style: "currency",
                                              currency: "USD",
                                            }
                                          )}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Services List */}
                              <div className="space-y-3">
                                <h3 className="font-semibold text-lg">
                                  Services ({billing.services.length})
                                </h3>
                                {billing.services.map((service) => (
                                  <div
                                    key={service.service_id}
                                    className="border rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                          <div className="flex items-center gap-4 mb-2">
                                            <p className="font-semibold text-gray-800">
                                              {service.service_name}
                                            </p>
                                            <span
                                              className={`px-2 py-1 text-xs rounded-full text-white
                                              ${service.status ===
                                                  "completed" ||
                                                  service.status === "paid"
                                                  ? "bg-green-500"
                                                  : service.status === "pending"
                                                    ? "bg-yellow-500"
                                                    : service.status ===
                                                      "cancelled"
                                                      ? "bg-red-500"
                                                      : "bg-gray-500"
                                                }`}
                                            >
                                              {service.status}
                                            </span>
                                          </div>
                                          {service.status !== "paid" && billing.status !== "paid" && (
                                            <Button
                                              onClick={() =>
                                                handlePay(
                                                  billing.order_id,
                                                  billing.agent_uuid ?? "",
                                                  service.amount,
                                                  {
                                                    serviceId:
                                                      service.order_service_uuid,
                                                    serviceName:
                                                      service.service_name ??
                                                      "",
                                                    paymentType: "service",
                                                  }
                                                )
                                              }
                                              className='px-4 py-2 text-white rounded-md text-sm shadow transition-colors flex items-center justify-center min-w-[100px] cursor-pointer hover:brightness-110'
                                              style={{ backgroundColor: roleSettings.pageTabColor }}
                                            >
                                              Pay Now
                                            </Button>
                                          )}
                                          {(service.status === "paid" || billing.status === "paid") && (
                                            <Button
                                              disabled
                                              className={`px-4 py-2 text-white rounded-md text-sm shadow transition-colors flex items-center justify-center min-w-[100px] bg-green-500 cursor-pointer hover:bg-green-600`}
                                            >
                                              Paid
                                            </Button>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-600">
                                          Amount:{" "}
                                          {service.amount.toLocaleString(
                                            "en-US",
                                            {
                                              style: "currency",
                                              currency: "USD",
                                            }
                                          )}
                                        </p>

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
                                                    <ExternalLink className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                                    <a
                                                      href={invoice.invoice_url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-blue-500 hover:text-blue-700 text-sm truncate"
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
                    )}
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
    </div>
  );
};

export default Page;
