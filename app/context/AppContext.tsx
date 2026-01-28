"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";

type AppContextType = {
  userType: string;
  setUserType: Dispatch<SetStateAction<string>>;
  unreadNotificationCount: number;
  setUnreadNotificationCount: Dispatch<SetStateAction<number>>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [userType, setUserType] = useState<string>("");
  const [unreadNotificationCount, setUnreadNotificationCount] =
    useState<number>(0);
  useEffect(() => {
    const userType = localStorage.getItem("userType");
    setUserType(userType || "");
  }, []);
  console.log("userType", userType);

  return (
    <AppContext.Provider
      value={{
        userType,
        setUserType,
        unreadNotificationCount,
        setUnreadNotificationCount,
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
