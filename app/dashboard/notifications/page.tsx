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
import { GetNotifications, MarkNotificationAsRead } from "./notification";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileNotificationsList from "@/components/mobile/notifications/MobileNotificationsList";

const Page = () => {
  const isMobile = useIsMobile();
  const [showCard, setShowCard] = React.useState(false);
  const [selectedNotification, setSelectedNotification] =
    React.useState<NotificationData | null>(null);
  const [notificationData, setNotificationData] = React.useState<
    NotificationData[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [monthsToLoad, setMonthsToLoad] = React.useState(1);
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

  const fetchNotifications = async (months: number, isLoadMore = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(false);

    try {
      const res = await GetNotifications(token, months);
      const data = res.data || [];

      if (isLoadMore) {
        // When loading more months, API returns ALL notifications for the specified months
        // Filter only NEW notifications that don't exist in current data
        const existingUuids = new Set(notificationData.map((n) => n.uuid));
        const newNotifications = data.filter(
          (n: NotificationData) => !existingUuids.has(n.uuid),
        );

        // Keep hasMore true - only set to false if API returns empty or same data
        if (
          data.length === 0 ||
          (newNotifications.length === 0 &&
            data.length === notificationData.length)
        ) {

        }

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
          `Loaded ${newNotifications.length} new notification${newNotifications.length !== 1 ? "s" : ""} from month ${months}`,
          { id: "load-notifications" },
        );
      } else {
        // Initial load
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
    fetchNotifications(monthsToLoad, monthsToLoad > 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthsToLoad]);

  const handleLoadMore = () => {
    const newMonths = monthsToLoad + 1;
    toast.loading(`Loading month ${newMonths} notifications...`, {
      id: "load-notifications",
      duration: Infinity, // Keep toast until we dismiss it
    });
    setMonthsToLoad(newMonths);
    // The useEffect will be triggered by the monthsToLoad change
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

  const filteredNotifications = notificationData.filter((notification) => {
    const addressSearch = searchAddress.toLowerCase();
    const nameSearch = searchName.toLowerCase();

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
      notification.order?.id === Number(addressSearch) ||
      notification.meta_data?.order_id === Number(addressSearch) ||
      String(notification.order?.id).toLowerCase().includes(addressSearch) ||
      String(notification.meta_data?.order_id)
        .toLowerCase()
        .includes(addressSearch);

    const matchesName =
      nameSearch === "" ||
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
      cell: ({ row }) => (
        <div className={`relative flex items-center text-[15px] font-[400] ${userType}-text`}>
          {!row.original.is_read && (
            <span className={`absolute -left-3 w-2 h-2 rounded-full ${userType}-bg`} />
          )}
          <span>{row.original.created_by_name}</span>
        </div>
      ),
    },
    {
      header: "Type",
      cell: ({ row }) => (
        <div className="text-[15px] font-[400] text-[#7D7D7D]">
          {(row.original.type || row.original.Subject)
            ?.replace(/_/g, " ")
            ?.replace(/\b\w/g, (char: string) => char.toUpperCase())}
        </div>
      ),
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
        </div>

        {/* Filters */}
        <div className="p-4 space-y-2.5 bg-gray-50 border-b">
          <Input
            placeholder="Search Address, Order ID..."
            className="h-10 bg-white text-xs"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchAddress(e.target.value)}
            value={searchAddress}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Search Name..."
              className="h-9 bg-white text-xs"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchName(e.target.value)}
              value={searchName}
            />
            <Select
              onValueChange={(value) => setFilterReadStatus(value)}
              defaultValue="all"
            >
              <SelectTrigger className="h-9 bg-white text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <MobileNotificationsList
          notifications={filteredNotifications}
          loading={loading}
          error={error}
          userType={userType}
          onNotificationClick={handleNotificationClick}
        />

        {/* Load More Months Button */}
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
      </div>

      <div
        className="w-full px-4 py-3 border-b border-gray-200 border border-b-gray-300 grid grid-cols-3 gap-4 h-[60px] font-alexandria sticky top-[80px] z-40"
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
          defaultValue="all"
        >
          <SelectTrigger
            className="w-full h-[38px]"
            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full">
        <DataTable
          key={`${searchAddress}-${searchName}-${filterReadStatus}`}
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
