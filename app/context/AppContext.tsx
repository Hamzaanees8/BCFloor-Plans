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
import { NotificationData } from "@/lib/types";

type AppContextType = {
  userType: string;
  setUserType: Dispatch<SetStateAction<string>>;
  organizationId: string | null;
  setOrganizationId: Dispatch<SetStateAction<string | null>>;
  unreadNotificationCount: number;
  setUnreadNotificationCount: Dispatch<SetStateAction<number>>;
  refreshNotifications: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [userType, setUserType] = useState<string>("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] =
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

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

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
