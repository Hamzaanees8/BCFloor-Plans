"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  GetPrintRequests,
  UpdatePrintRequestStatus,
  MarkPrintRequestAsRead,
  MarkAllPrintRequestsAsRead,
  PrintRequest,
} from "./print-requests";
import { toast } from "sonner";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Printer, Eye, CheckCheck, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobilePrintRequestsList from "@/components/mobile/admin/MobilePrintRequestsList";
import PrintRequestDetailModal from "./components/PrintRequestDetailModal";
import PrintRequestInvoiceModal from "./components/PrintRequestInvoiceModal";
import { usePortalSettings } from "@/app/hooks/usePortalSettings";
import { useRouter } from "next/navigation";

const Page = () => {
  const { userType, refreshPrintRequestsCount, unreadPrintRequestCount, setUnreadPrintRequestCount } = useAppContext();
  const { appliedSettings } = useWhiteLabel();
  const { allowPrintRequest, isLoading: isSettingsLoading } = usePortalSettings();
  const router = useRouter();
  const role = (userType as string) || "admin";
  const isAdmin = userType === "admin";
  const roleSettings =
    appliedSettings[role as keyof typeof appliedSettings] ||
    appliedSettings["admin"];

  const [printRequests, setPrintRequests] = useState<PrintRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [selectedRequest, setSelectedRequest] = useState<PrintRequest | null>(null);
  const [selectedInvoiceRequest, setSelectedInvoiceRequest] = useState<PrintRequest | null>(null);
  const [loadingInvoiceUuid, setLoadingInvoiceUuid] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [markingAll, setMarkingAll] = useState<boolean>(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Search & Filter states
  const [searchAgent, setSearchAgent] = useState<string>("");
  const [searchAddress, setSearchAddress] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await GetPrintRequests();
      const list: PrintRequest[] = Array.isArray(response.data) ? response.data : [];
      setPrintRequests(list);

      // Recalculate unread count
      if (isAdmin) {
        const unreadCount = list.filter((r) => !r.is_read).length;
        setUnreadPrintRequestCount(unreadCount);
      } else {
        const agentAttentionCount = list.filter(
          (r) => r.payment_status === "UNPAID" || !r.agent_read
        ).length;
        setUnreadPrintRequestCount(agentAttentionCount);
      }
    } catch (err) {
      console.error("Error fetching print requests:", err);
      setError(true);
      toast.error("Failed to load print requests");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, setUnreadPrintRequestCount]);

  useEffect(() => {
    if (!isSettingsLoading && !allowPrintRequest) {
      toast.error("Print requests are disabled for this organization");
      router.replace("/dashboard");
      return;
    }
    fetchRequests();
  }, [isSettingsLoading, allowPrintRequest, router, fetchRequests]);

  const handleOpenDetail = async (req: PrintRequest) => {
    setSelectedRequest(req);
    setShowDetailModal(true);

    if (isAdmin && !req.is_read) {
      try {
        await MarkPrintRequestAsRead(req.uuid);
        setPrintRequests((prev) =>
          prev.map((item) =>
            item.uuid === req.uuid ? { ...item, is_read: true } : item
          )
        );
        refreshPrintRequestsCount();
      } catch (err) {
        console.error("Failed to mark print request as read:", err);
      }
    } else if (!isAdmin && req.agent_read === false) {
      try {
        await MarkPrintRequestAsRead(req.uuid);
        setPrintRequests((prev) =>
          prev.map((item) =>
            item.uuid === req.uuid ? { ...item, agent_read: true } : item
          )
        );
        refreshPrintRequestsCount();
      } catch (err) {
        console.error("Failed to mark print request as read for agent:", err);
      }
    }
  };

  const handleOpenInvoiceModal = (req: PrintRequest) => {
    setSelectedInvoiceRequest(req);
  };

  const handleReadUpdated = (uuid: string) => {
    setPrintRequests((prev) =>
      prev.map((item) =>
        item.uuid === uuid
          ? {
              ...item,
              ...(isAdmin ? { is_read: true } : { agent_read: true }),
            }
          : item
      )
    );
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await MarkAllPrintRequestsAsRead();
      if (isAdmin) {
        setPrintRequests((prev) => prev.map((item) => ({ ...item, is_read: true })));
        setUnreadPrintRequestCount(0);
      } else {
        setPrintRequests((prev) => prev.map((item) => ({ ...item, agent_read: true })));
        // Count unpaid requests remaining
        const unpaidCount = printRequests.filter((r) => r.payment_status === "UNPAID").length;
        setUnreadPrintRequestCount(unpaidCount);
      }
      toast.success("Print requests marked as read");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  };

  const filteredAndSortedRequests = useMemo(() => {
    return printRequests
      .filter((req) => {
        if (statusFilter !== "all" && req.status !== statusFilter) {
          return false;
        }

        if (isAdmin && readFilter !== "all") {
          if (readFilter === "unread" && req.is_read) return false;
          if (readFilter === "read" && !req.is_read) return false;
        } else if (!isAdmin && readFilter !== "all") {
          const isAgentAttention = !req.agent_read || req.payment_status === "UNPAID";
          if (readFilter === "unread" && !isAgentAttention) return false;
          if (readFilter === "read" && isAgentAttention) return false;
        }

        if (isAdmin && searchAgent.trim()) {
          const query = searchAgent.toLowerCase().trim();
          const agentName = `${req.agent?.first_name || ""} ${req.agent?.last_name || ""}`.toLowerCase();
          const agentEmail = (req.agent?.email || "").toLowerCase();
          if (!agentName.includes(query) && !agentEmail.includes(query)) {
            return false;
          }
        }

        if (searchAddress.trim()) {
          const query = searchAddress.toLowerCase().trim();
          const address = (req.property?.address || "").toLowerCase();
          if (!address.includes(query)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
          case "oldest":
            return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
          case "agent_asc": {
            const nameA = `${a.agent?.first_name || ""} ${a.agent?.last_name || ""}`;
            const nameB = `${b.agent?.first_name || ""} ${b.agent?.last_name || ""}`;
            return nameA.localeCompare(nameB);
          }
          case "address_asc": {
            const addrA = a.property?.address || "";
            const addrB = b.property?.address || "";
            return addrA.localeCompare(addrB);
          }
          case "status":
            return (a.status || "").localeCompare(b.status || "");
          default:
            return 0;
        }
      });
  }, [printRequests, searchAgent, searchAddress, statusFilter, readFilter, sortBy, isAdmin]);

  const handleStatusChange = async (uuid: string, newStatus: string) => {
    if (!isAdmin) return;
    try {
      await UpdatePrintRequestStatus(uuid, newStatus);
      toast.success("Status updated successfully");
      setPrintRequests((prev) =>
        prev.map((req) =>
          req.uuid === uuid ? { ...req, status: newStatus as any } : req
        )
      );
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const columns: ColumnDef<PrintRequest>[] = [
    {
      accessorKey: "created_at",
      header: "DATE",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at")).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "short",
            day: "2-digit",
          }
        );
        const isUnread = isAdmin
          ? !row.original.is_read
          : (!row.original.agent_read || row.original.payment_status === "UNPAID");

        const unreadTooltip = isAdmin
          ? "Unread request"
          : !row.original.agent_read
          ? `Status updated: ${row.original.status}`
          : "Payment pending";

        return (
          <div className="flex items-center gap-2">
            {isUnread && (
              <span
                className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"
                title={unreadTooltip}
              />
            )}
            <span className={`text-[#666666] ${isUnread ? "font-semibold text-gray-900" : ""}`}>
              {date}
            </span>
          </div>
        );
      },
    },
    {
      id: "agent",
      header: "AGENT",
      cell: ({ row }) => {
        const agent = row.original.agent;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-[#424242]">
              {agent?.first_name} {agent?.last_name}
            </span>
            <span className="text-[12px] text-[#888888]">{agent?.email}</span>
          </div>
        );
      },
    },
    {
      id: "property",
      header: "PROPERTY ADDRESS",
      cell: ({ row }) => (
        <div className="text-[#666666] max-w-[250px] truncate">
          {row.original.property?.address || "N/A"}
        </div>
      ),
    },
    {
      id: "feature_sheet",
      header: "TEMPLATE",
      cell: ({ row }) => {
        const featureSheet = row.original.feature_sheet;
        const templateKey = featureSheet?.template_key || "N/A";
        const orderId = featureSheet?.order_id || row.original.order_uuid;
        const sheetUuid = featureSheet?.uuid;

        return (
          <div className="flex flex-col text-[#666666]">
            <span className="font-medium">{templateKey}</span>
            {orderId && sheetUuid && (
              <a
                href={`/dashboard/file-manager/${orderId}?serviceId=CreateFeatureSheet&sheetUuid=${sheetUuid}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                Preview Sheet
              </a>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "copies",
      header: "COPIES",
      cell: ({ row }) => (
        <div className="text-center font-semibold text-[#424242]">
          {row.getValue("copies")}
        </div>
      ),
    },
    {
      accessorKey: "with_bleed",
      header: "BLEED",
      cell: ({ row }) => (
        <div className="text-[#666666]">
          {row.getValue("with_bleed") ? "Yes" : "No"}
        </div>
      ),
    },
    {
      id: "payment_status",
      header: "PAYMENT STATUS",
      cell: ({ row }) => {
        const paymentStatus = row.original.payment_status || "UNPAID";
        const isPaid = paymentStatus === "PAID";
        const isLoadingThis = loadingInvoiceUuid === row.original.uuid;
        return (
          <Button
            disabled={isLoadingThis}
            onClick={(e) => {
              e.stopPropagation();
              setLoadingInvoiceUuid(row.original.uuid);
              handleOpenInvoiceModal(row.original);
              setTimeout(() => setLoadingInvoiceUuid(null), 500);
            }}
            className={`h-[24px] w-[65px] text-[10px] md:h-[28px] md:w-[85px] md:text-[12px] flex justify-center items-center cursor-pointer px-1 md:px-3 text-white font-bold rounded-md shadow-xs transition-colors ${
              isPaid
                ? "bg-[#6BAE41] hover:bg-[#5fa43a]"
                : "bg-[#DC9600] hover:bg-[#eda304]"
            }`}
            title="Click to view invoice"
          >
            {isLoadingThis ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isPaid ? (
              "PAID"
            ) : userType === "admin" ? (
              "UNPAID"
            ) : (
              "UnPaid"
            )}
          </Button>
        );
      },
    },
    {
      accessorKey: "status",
      header: "STATUS",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const uuid = row.original.uuid;

        if (!isAdmin) {
          return (
            <span
              className={`inline-flex items-center px-2.5 py-1 text-[12px] font-medium rounded-full border ${getStatusColor(
                status
              )}`}
            >
              {status}
            </span>
          );
        }

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              value={status}
              onValueChange={(value) => handleStatusChange(uuid, value)}
            >
              <SelectTrigger
                className={`w-[130px] h-[32px] text-[12px] font-medium rounded-full border ${getStatusColor(
                  status
                )}`}
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "ACTIONS",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
          onClick={() => handleOpenDetail(row.original)}
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          View
        </Button>
      ),
    },
  ];

  if (isMobile) {
    return (
      <ProtectedAdminRoute>
        <div className="font-alexandria pb-16">
          {/* Header */}
          <div
            className="w-full h-14 z-50 sticky top-0 flex justify-between px-4 items-center border-b shadow-sm"
            style={{ backgroundColor: roleSettings.pageBg }}
          >
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5" style={{ color: roleSettings.pageTabColor }} />
              <p className="text-base font-medium" style={{ color: roleSettings.pageTabColor }}>
                {isAdmin ? "Print Requests" : "My Print Requests"} ({filteredAndSortedRequests.length})
              </p>
            </div>
            {unreadPrintRequestCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="h-8 text-xs bg-white text-gray-700 border-gray-300"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Mobile Filters */}
          <div className="p-4 space-y-2.5 bg-gray-50 border-b">
            {isAdmin && (
              <Input
                placeholder="Search by agent..."
                className="h-9 bg-white text-xs"
                value={searchAgent}
                onChange={(e) => setSearchAgent(e.target.value)}
              />
            )}
            <Input
              placeholder="Search by address..."
              className="h-9 bg-white text-xs"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 bg-white text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger className="h-9 bg-white text-xs">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">{isAdmin ? "Unread Only" : "Attention Only"}</SelectItem>
                  <SelectItem value="read">Read Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <MobilePrintRequestsList
            requests={filteredAndSortedRequests}
            loading={loading}
            error={error}
            handleStatusChange={handleStatusChange}
            getStatusColor={getStatusColor}
            isAdmin={isAdmin}
            loadingInvoiceUuid={loadingInvoiceUuid}
            onOpenDetail={handleOpenDetail}
            onOpenInvoice={(req) => {
              setLoadingInvoiceUuid(req.uuid);
              handleOpenInvoiceModal(req);
              setTimeout(() => setLoadingInvoiceUuid(null), 500);
            }}
          />

          <PrintRequestDetailModal
            open={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            request={selectedRequest}
            getStatusColor={getStatusColor}
            onReadUpdated={handleReadUpdated}
            onOpenInvoice={(req) => {
              setShowDetailModal(false);
              handleOpenInvoiceModal(req);
            }}
          />

          <PrintRequestInvoiceModal
            open={!!selectedInvoiceRequest}
            onClose={() => setSelectedInvoiceRequest(null)}
            request={selectedInvoiceRequest}
          />
        </div>
      </ProtectedAdminRoute>
    );
  }

  return (
    <ProtectedAdminRoute>
      <div className="flex flex-col h-full bg-white">
        <div
          ref={headerRef}
          className="w-full h-[80px] font-alexandria z-50 sticky top-0 flex justify-between px-[20px] items-center"
          style={{
            backgroundColor: roleSettings.pageBg,
            boxShadow: "0px 4px 4px #0000001F",
          }}
        >
          <div className="flex items-center gap-3">
            <Printer className="w-6 h-6" style={{ color: roleSettings.pageTabColor }} />
            <p
              className="text-[16px] md:text-[24px] font-[400]"
              style={{ color: roleSettings.pageTabColor }}
            >
              {isAdmin ? "Print Requests" : "My Print Requests"} ({filteredAndSortedRequests.length}
              {unreadPrintRequestCount > 0
                ? `, ${unreadPrintRequestCount} ${isAdmin ? "unread" : "need attention"}`
                : ""})
            </p>
          </div>

          {unreadPrintRequestCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="h-9 px-3 text-xs md:text-sm bg-white hover:bg-gray-50 border-gray-300 text-gray-700 flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Desktop Filter & Sort Bar */}
        <div
          className={`p-4 border-b sticky top-[80px] z-40 bg-gray-50 border-[#BBBBBB] grid grid-cols-1 sm:grid-cols-2 ${
            isAdmin ? "lg:grid-cols-5" : "lg:grid-cols-4"
          } gap-3`}
        >
          {isAdmin && (
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Filter by Agent</label>
              <Input
                placeholder="Agent name or email..."
                className="h-9 bg-white text-xs border-[#BBBBBB]"
                value={searchAgent}
                onChange={(e) => setSearchAgent(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Filter by Address</label>
            <Input
              placeholder="Property address..."
              className="h-9 bg-white text-xs border-[#BBBBBB]"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Filter by Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 bg-white text-xs border-[#BBBBBB]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              {isAdmin ? "Read Status" : "Attention"}
            </label>
            <Select value={readFilter} onValueChange={setReadFilter}>
              <SelectTrigger className="h-9 bg-white text-xs border-[#BBBBBB]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">{isAdmin ? "Unread Only" : "Attention Only"}</SelectItem>
                <SelectItem value="read">Read / Done Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Sort By</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 bg-white text-xs border-[#BBBBBB]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                {isAdmin && <SelectItem value="agent_asc">Agent Name: A-Z</SelectItem>}
                <SelectItem value="address_asc">Property Address: A-Z</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full flex-1 overflow-auto">
          <DataTable
            data={filteredAndSortedRequests}
            columns={columns}
            dataName="Print Requests"
            userType={role}
            loading={loading}
            error={error}
            rowClick={(row) => handleOpenDetail(row)}
          />
        </div>

        <PrintRequestDetailModal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          request={selectedRequest}
          getStatusColor={getStatusColor}
          onReadUpdated={handleReadUpdated}
          onOpenInvoice={(req) => {
            setShowDetailModal(false);
            handleOpenInvoiceModal(req);
          }}
        />

        <PrintRequestInvoiceModal
          open={!!selectedInvoiceRequest}
          onClose={() => setSelectedInvoiceRequest(null)}
          request={selectedInvoiceRequest}
        />
      </div>
    </ProtectedAdminRoute>
  );
};

export default Page;
