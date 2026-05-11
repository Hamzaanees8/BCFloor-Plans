"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getUserByUuid, Permission } from "@/lib/api/user";

/**
 * Check if user has a specific permission
 */
function hasPermissionCheck(
    permissions: Permission[] | undefined,
    permissionName: string
): boolean {
    if (!permissions || !Array.isArray(permissions)) {
        return false;
    }
    return permissions.some((p) => p.name === permissionName);
}

/**
 * Check if user has at least one of the specified permissions
 */
function hasAnyPermissionCheck(
    permissions: Permission[] | undefined,
    permissionNames: string[]
): boolean {
    if (!permissions || !Array.isArray(permissions)) {
        return false;
    }
    return permissionNames.some((name) =>
        permissions.some((p) => p.name === name)
    );
}

/**
 * Check if user has all of the specified permissions
 */
function hasAllPermissionsCheck(
    permissions: Permission[] | undefined,
    permissionNames: string[]
): boolean {
    if (!permissions || !Array.isArray(permissions)) {
        return false;
    }
    return permissionNames.every((name) =>
        permissions.some((p) => p.name === name)
    );
}

export function usePermissions() {
    // Synchronously initialize state from localStorage to avoid loading flicker on refresh
    const [permissions, setPermissions] = useState<Permission[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const userInfoStr = localStorage.getItem("userInfo");
            if (userInfoStr) {
                const userInfo = JSON.parse(userInfoStr);
                const storedPermissions = userInfo?.permissions || userInfo?.data?.permissions;
                if (Array.isArray(storedPermissions) && storedPermissions.length > 0) {
                    return storedPermissions;
                }
            }
        } catch (e) {
            console.error("Failed to parse userInfo from localStorage for initial state:", e);
        }
        return [];
    });

    const [isLoading, setIsLoading] = useState(() => {
        if (typeof window === "undefined") return true;
        try {
            const userType = localStorage.getItem("userType");
            if (userType !== "admin") return false;

            const userInfoStr = localStorage.getItem("userInfo");
            if (userInfoStr) {
                const userInfo = JSON.parse(userInfoStr);
                const storedPermissions = userInfo?.permissions || userInfo?.data?.permissions;
                if (Array.isArray(storedPermissions) && storedPermissions.length > 0) {
                    return false;
                }
            }
        } catch (e) {
            console.log("Failed to parse userInfo from localStorage for isLoading state:", e);

        }
        return true;
    });

    const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        try {
            const userType = localStorage.getItem("userType");
            if (userType !== "admin") return false;

            const userInfoStr = localStorage.getItem("userInfo");
            if (userInfoStr) {
                const userInfo = JSON.parse(userInfoStr);
                const orgId = userInfo?.organization_id ?? userInfo?.data?.organization_id;
                if (orgId === null || orgId === undefined || orgId === "") {
                    return true;
                }
            }
        } catch (e) {
            console.error("Failed to parse userInfo for isSuperAdmin:", e);
        }
        return false;
    });

    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadPermissions = async () => {
            try {
                // Check localStorage again in case it changed since initialization
                const userType = localStorage.getItem("userType");
                const userInfoStr = localStorage.getItem("userInfo");

                if (userType === "admin" && userInfoStr) {
                    const userInfo = JSON.parse(userInfoStr);
                    const userUuid = userInfo?.data?.uuid || userInfo?.uuid;
                    const storedPermissions = userInfo?.permissions || userInfo?.data?.permissions;
                    const orgId = userInfo?.organization_id ?? userInfo?.data?.organization_id;

                    if (isMounted) {
                        if (orgId === null || orgId === undefined || orgId === "") {
                            setIsSuperAdmin(true);
                        } else {
                            setIsSuperAdmin(false);
                        }
                    }

                    // If we already have permissions in state, or if they are in localStorage, skip fetch
                    if (storedPermissions && Array.isArray(storedPermissions) && storedPermissions.length > 0) {
                        if (permissions.length === 0) {
                            setPermissions(storedPermissions);
                        }
                        setIsLoading(false);
                        return;
                    }

                    if (!userUuid) {
                        throw new Error("User UUID not found");
                    }

                    // Only set loading true if we don't have permissions yet
                    if (permissions.length === 0) {
                        setIsLoading(true);
                    }
                    setError(null);

                    // Fetch fresh user data from API
                    const userData = await getUserByUuid(userUuid);

                    if (isMounted) {
                        const userPermissions = userData.permissions || [];
                        setPermissions(userPermissions);
                        
                        const fetchedOrgId = userData.organization_id;
                        if (fetchedOrgId === null || fetchedOrgId === undefined || fetchedOrgId === "") {
                            setIsSuperAdmin(true);
                        } else {
                            setIsSuperAdmin(false);
                        }

                        // Update localStorage with fresh user data (which includes permissions)
                        localStorage.setItem("userInfo", JSON.stringify(userData));
                    }
                } else {
                    // For non-admin users, just use empty permissions
                    if (isMounted) {
                        setPermissions([]);
                        setIsLoading(false);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    console.error("Failed to load permissions:", err);
                    setError(err instanceof Error ? err : new Error("Failed to load permissions"));

                    // Fallback to localStorage if API fails (though we already checked above)
                    try {
                        const userInfoStr = localStorage.getItem("userInfo");
                        if (userInfoStr) {
                            const userInfo = JSON.parse(userInfoStr);
                            const fallbackPermissions = userInfo?.permissions || userInfo?.data?.permissions;
                            if (Array.isArray(fallbackPermissions)) {
                                setPermissions(fallbackPermissions);
                            }
                        }
                    } catch (localStorageError) {
                        console.error("Failed to parse localStorage userInfo in catch:", localStorageError);
                    }
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadPermissions();

        return () => {
            isMounted = false;
        };
    }, [permissions.length]); // Re-run if permissions length changes (e.g. from 0 to something)

    // Memoized permission check functions
    const hasPermission = useCallback(
        (permissionName: string): boolean => {
            if (isSuperAdmin) return true;
            return hasPermissionCheck(permissions, permissionName);
        },
        [permissions, isSuperAdmin]
    );

    const hasAnyPermission = useCallback(
        (permissionNames: string[]): boolean => {
            if (isSuperAdmin) return true;
            return hasAnyPermissionCheck(permissions, permissionNames);
        },
        [permissions, isSuperAdmin]
    );

    const hasAllPermissions = useCallback(
        (permissionNames: string[]): boolean => {
            if (isSuperAdmin) return true;
            return hasAllPermissionsCheck(permissions, permissionNames);
        },
        [permissions, isSuperAdmin]
    );

    return useMemo(
        () => ({
            permissions,
            isLoading,
            error,
            isSuperAdmin,
            hasPermission,
            hasAnyPermission,
            hasAllPermissions,
        }),
        [permissions, isLoading, error, isSuperAdmin, hasPermission, hasAnyPermission, hasAllPermissions]
    );
}
