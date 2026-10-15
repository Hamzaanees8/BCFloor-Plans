"use client";
import React, { useEffect, useRef } from "react";
import QuickViewCard from "@/components/QuickViewCard";
import { NotificationData } from "@/lib/types";
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/app/context/AppContext";
import { useOrganization } from "@/app/context/OrganizationContext";
import { GetNotifications, MarkNotificationAsRead, MarkAllNotificationsAsRead } from "./notification";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileNotificationsList from "@/components/mobile/notifications/MobileNotificationsList";
import { CheckCheck, Loader2 } from "lucide-react";

const Page = () => {
  const isMobile = useIsMobile();
  const { organization } = useOrganization();
  const [showCard, setShowCard] = React.useState(false);
  const [selectedNotification, setSelectedNotification] =
    React.useState<NotificationData | null>(null);
  const [notificationData, setNotificationData] = React.useState<
    NotificationData[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [monthsToLoad, setMonthsToLoad] = React.useState(1);
  const [dateScope, setDateScope] = React.useState<string>("1");
  const [customStartDate, setCustomStartDate] = React.useState<string>("");
  const [customEndDate, setCustomEndDate] = React.useState<string>("");
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  const { userType, setUnreadNotificationCount } = useAppContext();
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

  const [searchAddress, setSearchAddress] = React.useState("");
  const [searchName, setSearchName] = React.useState("");
  const [filterReadStatus, setFilterReadStatus] = React.useState("all");

  const getDateScopeLabel = (scope: string) => {
    switch (scope) {
      case "1":
        return "Last 30 Days";
      case "3":
        return "Last 3 Months";
      case "6":
        return "Last 6 Months";
      case "12":
        return "Last 1 Year";
      case "all":
        return "All Dates";
      case "custom":
        return customStartDate && customEndDate
          ? `${customStartDate} to ${customEndDate}`
          : "Custom Range";
      default:
        return `${scope} Months`;
    }
  };

  const fetchNotifications = async (
    options?: {
      scope?: string;
      months?: number;
      startDate?: string;
      endDate?: string;
      isLoadMore?: boolean;
    }
  ) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const isLoadMore = options?.isLoadMore || false;
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(false);

    try {
      const activeScope = options?.scope ?? dateScope;
      let filterParam: any = {};
      if (activeScope === "all") {
        filterParam = { all: true };
      } else if (activeScope === "custom") {
        const s = options?.startDate ?? customStartDate;
        const e = options?.endDate ?? customEndDate;
        filterParam = { start_date: s || undefined, end_date: e || undefined };
      } else {
        const m = options?.months ?? (Number(activeScope) || 1);
        filterParam = { months: m };
      }

      const res = await GetNotifications(token, filterParam);
      const data = res.data || [];

      if (isLoadMore) {
        // When loading more months, API returns ALL notifications for the specified months
        // Filter only NEW notifications that don't exist in current data
        const existingUuids = new Set(notificationData.map((n) => n.uuid));
        const newNotifications = data.filter(
          (n: NotificationData) => !existingUuids.has(n.uuid),
        );

        // Always combine data even if no new notifications
        const combined = [...notificationData, ...newNotifications];
        setNotificationData(combined);

        // Calculate unread from combined data
        const unreadCount = combined.filter(
          (n: NotificationData) => !n.is_read,
        ).length;
        setUnreadNotificationCount(unreadCount);

        // Show success toast
        toast.success(
          `Loaded ${newNotifications.length} new notification${newNotifications.length !== 1 ? "s" : ""}`,
          { id: "load-notifications" },
        );
      } else {
        // Initial or filter-changed load
        setNotificationData(data);

        // Calculate unread from initial data
        const unreadCount = data.filter(
          (n: NotificationData) => !n.is_read,
        ).length;
        setUnreadNotificationCount(unreadCount);
      }
    } catch (err) {
      console.error((err as Error).message);
      setError(true);

      // Show error toast if loading more
      if (isLoadMore) {
        toast.error("Failed to load notifications. Please try again.", {
          id: "load-notifications",
        });
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNotifications({ scope: "1", months: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateScopeChange = (value: string) => {
    setDateScope(value);
    if (value !== "custom") {
      const months = Number(value) || 1;
      setMonthsToLoad(months);
      fetchNotifications({ scope: value, months });
    }
  };

  const handleApplyCustomRange = () => {
    if (!customStartDate && !customEndDate) {
      toast.error("Please select a start or end date.");
      return;
    }
    fetchNotifications({
      scope: "custom",
      startDate: customStartDate,
      endDate: customEndDate,
    });
  };

  const handleLoadMore = () => {
    if (dateScope === "all") {
      toast.info("All notifications are already loaded.");
      return;
    }
    const currentMonths = Number(dateScope) || monthsToLoad;
    const newMonths = currentMonths + 1;
    toast.loading(`Loading month ${newMonths} notifications...`, {
      id: "load-notifications",
      duration: Infinity, // Keep toast until we dismiss it
    });
    setMonthsToLoad(newMonths);
    setDateScope(String(newMonths));
    fetchNotifications({
      scope: String(newMonths),
      months: newMonths,
      isLoadMore: true,
    });
  };

  const handleNotificationClick = async (notification: NotificationData) => {
    setSelectedNotification(notification);
    setShowCard(true);

    // Mark as read if unread
    if (!notification.is_read && notification.uuid) {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        await MarkNotificationAsRead(token, notification.uuid);

        // Update local state
        setNotificationData((prev) =>
          prev.map((n) =>
            n.uuid === notification.uuid
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n,
          ),
        );

        // Update unread count
        const newUnreadCount = notificationData.filter((n) =>
          n.uuid === notification.uuid ? false : !n.is_read,
        ).length;
        setUnreadNotificationCount(newUnreadCount);
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
  };

  const [markingAllRead, setMarkingAllRead] = React.useState(false);

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notificationData.filter((n) => !n.is_read);
    if (unreadNotifications.length === 0) {
      toast.info("No unread notifications");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    setMarkingAllRead(true);
    try {
      try {
        await MarkAllNotificationsAsRead(token);
      } catch {
        // Fallback to updating individually in parallel if API endpoint differs
        await Promise.all(
          unreadNotifications.map(
            (n) => n.uuid && MarkNotificationAsRead(token, n.uuid),
          ),
        );
      }

      const updated = notificationData.map((n) => ({
        ...n,
        is_read: true,
        read_at: n.read_at || new Date().toISOString(),
      }));
      setNotificationData(updated);
      setUnreadNotificationCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    } finally {
      setMarkingAllRead(false);
    }
  };

  const filteredNotifications = notificationData.filter((notification) => {
    const addressSearch = searchAddress.toLowerCase().trim();
    const nameSearch = searchName.toLowerCase().trim();

    const matchesAddress =
      addressSearch === "" ||
      notification.order?.property_address
        ?.toLowerCase()
        .includes(addressSearch) ||
      notification.order?.property_location
        ?.toLowerCase()
        .includes(addressSearch) ||
      notification.meta_data?.property_address
        ?.toLowerCase()
        .includes(addressSearch) ||
      (notification.order?.id != null && String(notification.order.id).toLowerCase().includes(addressSearch)) ||
      (notification.meta_data?.order_id != null && String(notification.meta_data.order_id).toLowerCase().includes(addressSearch)) ||
      ((notification.order as any)?.uuid != null && String((notification.order as any).uuid).toLowerCase().includes(addressSearch)) ||
      ((notification as any).order_id != null && String((notification as any).order_id).toLowerCase().includes(addressSearch));

    const createdByName =
      organization?.name || organization?.from_name || "Support Team";

    const matchesName =
      nameSearch === "" ||
      createdByName.toLowerCase().includes(nameSearch) ||
      notification.created_by_name?.toLowerCase().includes(nameSearch);

    const matchesReadStatus =
      filterReadStatus === "all" ||
      (filterReadStatus === "read" && notification.is_read) ||
      (filterReadStatus === "unread" && !notification.is_read);

    return matchesAddress && matchesName && matchesReadStatus;
  });

  const unreadCount = notificationData.filter((n) => !n.is_read).length;

  const columns: ColumnDef<NotificationData>[] = [
    {
      accessorKey: "created_by_name",
      header: "Created By",
      cell: ({ row }) => {
        const createdByName =
          organization?.name || organization?.from_name || "Support Team";
        return (
          <div className={`relative flex items-center text-[15px] font-[400] ${userType}-text`}>
            {!row.original.is_read && (
              <span className={`absolute -left-3 w-2 h-2 rounded-full ${userType}-bg`} />
            )}
            <span>{createdByName}</span>
          </div>
        );
      },
    },
    {
      header: "Type",
      cell: ({ row }) => {
        const isApproval =
          row.original.type === "admin_approval_required" ||
          (row.original.type || "").toLowerCase().includes("approval") ||
          (row.original.Subject || "").toLowerCase().includes("approval");
        const formattedType = (row.original.type || row.original.Subject)
          ?.replace(/_/g, " ")
          ?.replace(/\b\w/g, (char: string) => char.toUpperCase());

        return isApproval ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-[600] text-amber-900 bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse shrink-0" />
              {formattedType}
            </span>
          </div>
        ) : (
          <div className="text-[15px] font-[400] text-[#7D7D7D]">
            {formattedType}
          </div>
        );
      },
    },
    {
      header: "Address",
      cell: ({ row }) => {
        const notification = row.original;
        const text = notification.source === "AgentPayment" || notification.source === "VendorPayment"
          ? notification.source === "AgentPayment"
            ? `${notification.meta_data?.property_address || "N/A"}`
            : `${notification.source === "VendorPayment" ? `${notification.meta_data?.property_address || "N/A"}` : "Payment"}`
          : notification?.order?.property_address
            ? `${notification.order?.property_address} ${notification.order?.property_location}`
            : "-";

        return (
          <div className="text-[15px] font-[400] text-[#7D7D7D]">
            {text}
          </div>
        );
      },
    },
    {
      header: "Differences",
      cell: () => <div className="text-[15px] font-[400] text-[#7D7D7D]">-</div>
    },
    {
      header: "Added",
      cell: ({ row }) => {
        const notification = row.original;
        const date = notification.created_at
          ? new Date(notification.created_at).toLocaleString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
          : notification.order?.created_at
            ? new Date(notification.order.created_at).toLocaleString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
            : null;

        return (
          <div className="text-[15px] font-[400] text-[#7D7D7D]">
            {date}
          </div>
        );
      },
    },
  ];

  if (isMobile) {
    return (
      <div className="font-alexandria pb-16" style={{ backgroundColor: `var(--${userType}-page-bg, #F2F2F2)` }}>
        {/* Header */}
        <div
          className="w-full h-14 z-50 sticky top-0 flex justify-between px-4 items-center border-b shadow-sm"
          style={{
            backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
          }}
        >
          <p className={`text-base font-medium ${userType}-text`}>
            Notifications ({unreadCount > 0 ? `${unreadCount} unread` : filteredNotifications.length})
          </p>
          <Button
            onClick={handleMarkAllAsRead}
            disabled={markingAllRead || unreadCount === 0}
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs font-medium border-[#BBBBBB] bg-white hover:bg-gray-50 text-[#333333] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {markingAllRead ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>Mark all as read</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="p-4 space-y-2.5 bg-gray-50 border-b">
          <Input
            placeholder="Search Address, Order ID..."
            className="h-10 bg-white text-xs"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchAddress(e.target.value)}
            value={searchAddress}
          />
          <Input
            placeholder="Search Name..."
            className="h-9 bg-white text-xs"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchName(e.target.value)}
            value={searchName}
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              onValueChange={(value) => setFilterReadStatus(value)}
              value={filterReadStatus}
            >
              <SelectTrigger className="h-9 bg-white text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) => handleDateScopeChange(value)}
              value={dateScope}
            >
              <SelectTrigger className="h-9 bg-white text-xs">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 30 Days</SelectItem>
                <SelectItem value="3">Last 3 Months</SelectItem>
                <SelectItem value="6">Last 6 Months</SelectItem>
                <SelectItem value="12">Last 1 Year</SelectItem>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dateScope === "custom" && (
            <div className="p-2.5 bg-white rounded border border-gray-200 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-12 text-gray-600 font-medium">From:</span>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-8 bg-gray-50 text-xs flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-12 text-gray-600 font-medium">To:</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-8 bg-gray-50 text-xs flex-1"
                />
              </div>
              <Button
                size="sm"
                onClick={handleApplyCustomRange}
                className="h-8 w-full text-xs"
              >
                Apply Range
              </Button>
            </div>
          )}

          {(searchAddress.trim() || searchName.trim()) && dateScope !== "all" && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 flex items-center justify-between">
              <span>Searching in {getDateScopeLabel(dateScope)}</span>
              <button
                type="button"
                onClick={() => handleDateScopeChange("all")}
                className="font-semibold text-blue-700 underline ml-2 cursor-pointer"
              >
                Search All Dates
              </button>
            </div>
          )}
        </div>

        <MobileNotificationsList
          notifications={filteredNotifications}
          loading={loading}
          error={error}
          userType={userType}
          onNotificationClick={handleNotificationClick}
        />

        {/* Load More Months Button */}
        {dateScope !== "all" && dateScope !== "custom" && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="text-xs px-4 py-2 text-[#666666] border border-[#D1D5DB] hover:bg-gray-100"
            >
              {isLoadingMore ? "Loading..." : "Load previous Month Notifications"}
            </Button>
          </div>
        )}

        {showCard && selectedNotification && (
          <QuickViewCard
            type="notification"
            data={selectedNotification}
            onClose={() => setShowCard(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: `var(--${userType}-page-bg, #F2F2F2)` }}>
      <div
        ref={headerRef}
        className="w-full h-[80px] font-alexandria sticky top-0 z-50 flex justify-between px-[20px] items-center"
        style={{
          backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
          boxShadow: "0px 4px 4px #0000001F",
        }}
      >
        <p className={`text-[16px] md:text-[24px] font-[400] ${userType}-text`}>
          Notifications (
          {unreadCount > 0
            ? `${unreadCount} unread`
            : filteredNotifications.length}
          )
        </p>
        <Button
          onClick={handleMarkAllAsRead}
          disabled={markingAllRead || unreadCount === 0}
          variant="outline"
          className="h-[38px] px-4 text-xs md:text-sm font-medium border-[#BBBBBB] bg-white hover:bg-gray-50 text-[#333333] shadow-sm rounded-[6px] flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {markingAllRead ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCheck className="w-4 h-4 text-emerald-600" />
          )}
          <span>Mark all as read</span>
        </Button>
      </div>

      <div
        className="w-full px-4 py-3 border-b border-gray-200 border border-b-gray-300 grid grid-cols-1 md:grid-cols-4 gap-3 min-h-[60px] font-alexandria sticky top-[80px] z-40 items-center"
        style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
      >
        <Input
          placeholder="Search Address, Order ID..."
          className="h-[38px] w-full"
          style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchAddress(e.target.value)
          }
          value={searchAddress}
        />

        <Input
          placeholder="Search Name..."
          className="h-[38px] w-full"
          style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchName(e.target.value)
          }
          value={searchName}
        />

        <Select
          onValueChange={(value) => setFilterReadStatus(value)}
          value={filterReadStatus}
        >
          <SelectTrigger
            className="w-full h-[38px]"
            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
          </SelectContent>
        </Select>

        <Select
          onValueChange={(value) => handleDateScopeChange(value)}
          value={dateScope}
        >
          <SelectTrigger
            className="w-full h-[38px]"
            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
          >
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 30 Days</SelectItem>
            <SelectItem value="3">Last 3 Months</SelectItem>
            <SelectItem value="6">Last 6 Months</SelectItem>
            <SelectItem value="12">Last 1 Year</SelectItem>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {dateScope === "custom" && (
        <div
          className="w-full px-4 py-2 border-b border-gray-200 flex flex-wrap items-center gap-3 text-xs"
          style={{ backgroundColor: `var(--${userType}-page-bg, #ECECEC)` }}
        >
          <span className="font-medium text-gray-700">From:</span>
          <Input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="h-8 w-40 bg-white text-xs"
          />
          <span className="font-medium text-gray-700">To:</span>
          <Input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="h-8 w-40 bg-white text-xs"
          />
          <Button
            size="sm"
            onClick={handleApplyCustomRange}
            className="h-8 px-3 text-xs"
          >
            Apply Range
          </Button>
        </div>
      )}

      {(searchAddress.trim() || searchName.trim()) && dateScope !== "all" && (
        <div className="w-full px-4 py-2 bg-blue-50/80 border-b border-blue-200/60 flex items-center justify-between text-xs text-blue-900 font-alexandria">
          <span>
            Searching in <strong>{getDateScopeLabel(dateScope)}</strong>
            {filteredNotifications.length === 0
              ? " — no matching notifications found in this date range."
              : ` — showing ${filteredNotifications.length} matching result(s).`}
          </span>
          <button
            type="button"
            onClick={() => handleDateScopeChange("all")}
            className="font-semibold text-blue-700 hover:text-blue-900 underline ml-2 cursor-pointer flex items-center gap-1"
          >
            Search across All Dates
          </button>
        </div>
      )}

      <div className="w-full">
        <DataTable
          key={`${searchAddress}-${searchName}-${filterReadStatus}-${dateScope}`}
          columns={columns}
          data={filteredNotifications}
          loading={loading}
          error={error}
          dataName="Notifications"
          userType={userType}
          rowClick={handleNotificationClick}
          autoResetPageIndex={false}
        />

        {/* Load More Months Button */}
        {dateScope !== "all" && dateScope !== "custom" && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="text-sm px-4 py-2 text-[#666666] border border-[#D1D5DB] hover:bg-gray-100"
            >
              {isLoadingMore ? "Loading..." : "Load previous Month Notifications"}
            </Button>
          </div>
        )}

        {showCard && selectedNotification && (
          <QuickViewCard
            type="notification"
            data={selectedNotification}
            onClose={() => setShowCard(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Page;
