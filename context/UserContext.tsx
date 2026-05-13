"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { getUserByUuid, Permission, UserData, Role } from "@/lib/api/user";

interface UserContextType {
    user: UserData | null;
    permissions: Permission[];
    isLoading: boolean;
    isSuperAdmin: boolean;
    error: Error | null;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * Check if a user is a super admin based on organization_id and roles
 */
const checkIsSuperAdmin = (userData: UserData | null): boolean => {
    if (!userData) return false;

    // Check organization_id (null or empty string means super admin)
    const orgId = userData.organization_id;
    const hasNoOrg = orgId === null || orgId === undefined || orgId === "";

    // Check for "Super Admin" role
    const roles = userData.roles || [];
    const hasSuperAdminRole = roles.some((role: Role) => role.name === "Super Admin");

    return hasNoOrg || hasSuperAdminRole;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [hasFetched, setHasFetched] = useState<boolean>(false);

    // Initialize from localStorage
    useEffect(() => {
        const userInfoStr = localStorage.getItem("userInfo");
        if (userInfoStr) {
            try {
                const userInfo = JSON.parse(userInfoStr);
                const userData = userInfo?.data || userInfo; // Handle different payload structures
                
                if (userData) {
                    setUser(userData);
                    setPermissions(userData.permissions || []);
                    setIsSuperAdmin(checkIsSuperAdmin(userData));
                    // If we have data in localStorage, we can start with isLoading = false
                    // but we still want to refresh it once
                    setIsLoading(false);
                }
            } catch (e) {
                console.error("Failed to parse userInfo from localStorage:", e);
            }
        }
    }, []);

    const fetchUser = useCallback(async () => {
        if (typeof window === "undefined") return;

        const userInfoStr = localStorage.getItem("userInfo");
        const userType = localStorage.getItem("userType");

        if (!userInfoStr || userType !== "admin") {
            setIsLoading(false);
            return;
        }

        try {
            const userInfo = JSON.parse(userInfoStr);
            const userUuid = userInfo?.data?.uuid || userInfo?.uuid;

            if (!userUuid) {
                setIsLoading(false);
                return;
            }

            // Only show loading if we don't have user data yet
            if (!user) setIsLoading(true);
            
            const userData = await getUserByUuid(userUuid);
            
            setUser(userData);
            setPermissions(userData.permissions || []);
            setIsSuperAdmin(checkIsSuperAdmin(userData));
            setError(null);
            
            // Update localStorage with fresh data
            localStorage.setItem("userInfo", JSON.stringify(userData));
        } catch (err) {
            console.error("UserContext: Failed to fetch user data:", err);
            setError(err instanceof Error ? err : new Error("Failed to fetch user data"));
        } finally {
            setIsLoading(false);
            setHasFetched(true);
        }
    }, [user]);

    // Fetch once on mount
    useEffect(() => {
        if (!hasFetched) {
            fetchUser();
        }
    }, [fetchUser, hasFetched]);

    const value = useMemo(() => ({
        user,
        permissions,
        isLoading,
        isSuperAdmin,
        error,
        refreshUser: fetchUser
    }), [user, permissions, isLoading, isSuperAdmin, error, fetchUser]);

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
