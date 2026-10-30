"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
  useEffect,
  useCallback,
} from "react";
import { GetNotifications } from "@/app/dashboard/notifications/notification";
import { GetPrintRequestsUnreadCount } from "@/app/dashboard/admin/print-requests/print-requests";
import { NotificationData } from "@/lib/types";

type AppContextType = {
  userType: string;
  setUserType: Dispatch<SetStateAction<string>>;
  organizationId: string | null;
  setOrganizationId: Dispatch<SetStateAction<string | null>>;
  unreadNotificationCount: number;
  setUnreadNotificationCount: Dispatch<SetStateAction<number>>;
  refreshNotifications: () => Promise<void>;
  unreadPrintRequestCount: number;
  setUnreadPrintRequestCount: Dispatch<SetStateAction<number>>;
  refreshPrintRequestsCount: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [userType, setUserType] = useState<string>("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] =
    useState<number>(0);
  const [unreadPrintRequestCount, setUnreadPrintRequestCount] =
    useState<number>(0);

  useEffect(() => {
    const userType = localStorage.getItem("userType");
    setUserType(userType || "");
  }, []);

  const refreshNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await GetNotifications(token, 1);
      const data = res.data || [];
      const unreadCount = data.filter((n: NotificationData) => !n.is_read).length;
      setUnreadNotificationCount(unreadCount);
    } catch (error) {
      console.error("Failed to fetch notifications in context:", error);
    }
  }, []);

  const refreshPrintRequestsCount = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const count = await GetPrintRequestsUnreadCount();
      setUnreadPrintRequestCount(count);
    } catch (error) {
      console.error("Failed to fetch print requests unread count in context:", error);
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
    refreshPrintRequestsCount();
  }, [refreshNotifications, refreshPrintRequestsCount]);

  return (
    <AppContext.Provider
      value={{
        userType,
        setUserType,
        organizationId,
        setOrganizationId,
        unreadNotificationCount,
        setUnreadNotificationCount,
        refreshNotifications,
        unreadPrintRequestCount,
        setUnreadPrintRequestCount,
        refreshPrintRequestsCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export const useOptionalAppContext = () => {
  return useContext(AppContext);
};
