"use client";
import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from "react";

type AppContextType = {
    userType: string;
    setUserType: Dispatch<SetStateAction<string>>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [userType, setUserType] = useState<string>("");
    useEffect(() => {
        const userType = localStorage.getItem('userType')
        setUserType(userType || '')
    }, [])
    // console.log('userType', userType);

    return (
        <AppContext.Provider value={{ userType, setUserType }}>
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
