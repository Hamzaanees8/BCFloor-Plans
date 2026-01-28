"use client";
import React, { useEffect } from "react";
import QuickViewCard, { NotificationData } from "@/components/QuickViewCard";
import NotificationTable from "@/components/NotificationTable";
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

const Page = () => {
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
  const [hasMore, setHasMore] = React.useState(true);
  const { userType, setUnreadNotificationCount } = useAppContext();

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
          setHasMore(false);
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
        setHasMore(data.length > 0);

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

  return (
    <div style={{ backgroundColor: `var(--${userType}-page-bg, #F2F2F2)` }}>
      <div
        className="w-full h-[80px] font-alexandria z-10 relative flex justify-between px-[20px] items-center"
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
        className="w-full px-4 py-3 border-b border-gray-200 border border-b-gray-300 grid grid-cols-3 gap-4 h-[60px] font-alexandria"
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
        <NotificationTable
          data={filteredNotifications}
          loading={loading}
          error={error}
          onQuickView={handleNotificationClick}
          onLoadMore={handleLoadMore}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          totalNotifications={notificationData.length}
        />

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
