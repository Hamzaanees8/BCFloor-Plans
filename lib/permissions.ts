export const PERMISSIONS = {
    ACCESS_BILLING: "Access Billing",
    RECEIVE_NOTIFICATIONS: "Receive Notifications",
    CREATE_ORDERS: "Create Orders",
    EDIT_ORDERS: "Edit Orders",
    BOOK_APPOINTMENTS: "Book Appointments",
    CREATE_VENDOR: "Create Vendor",
    UPDATE_VENDOR: "Update Vendor",
    CREATE_AGENT: "Create Agent",
    CREATE_ADMIN: "Create Admin",
    VIEW_ADMIN: "View Admin",
    CREATE_SERVICES: "Create Services",
    VIEW_ORDERS: "View Orders",
    VIEW_APPOINTMENTS: "View Appointments",
    EDIT_APPOINTMENTS: "Edit Appointments",
    SET_DISCOUNTS: "Set Discounts",
    CREATE_LISTING: "Create Listing",
    VIEW_LISTING: "View Listing",
    VIEW_SERVICES: "View Services",
    CREATE_TOUR_SETTINGS: "Create Tour Settings",
    ACCESS_VENDOR_BILLING: "Access Vendor Billing",
    VIEW_VENDOR: "View Vendor",
    VIEW_AGENT: "View Agent",
    VIEW_ALL_ORDERS: "View All Orders",
    VIEW_ONLY_ORDERS_FOR_CO_AGENT: "View Only Orders For Co-Agent",
    CREATE_SUB_ACCOUNTS: "Create Sub-Accounts",
    VIEW_ALL_APPOINTMENTS: "View All Appointments",
    VIEW_ONLY_APPOINTMENTS_FOR_CO_AGENT: "View Only Appointments For Co-Agent",
    PRINT_REQUESTS: "Print Requests",
} as const;

export type Permission = {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
    pivot?: {
        user_id: number;
        permission_id: number;
    };
};

export type UserInfo = {
    uuid: string;
    first_name: string;
    last_name: string;
    email: string;
    permissions?: Permission[];
    roles?: { id: number; name: string }[];
    [key: string]: unknown;
};

export function hasPermission(
    permissions: Permission[] | undefined,
    permissionName: string
): boolean {
    if (!permissions || !Array.isArray(permissions)) {
        return false;
    }
    return permissions.some((p) => p.name === permissionName);
}


export function hasAnyPermission(
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


export function hasAllPermissions(
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


export function getUserInfo(): UserInfo | null {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        const userInfoStr = localStorage.getItem("userInfo");
        if (!userInfoStr) {
            return null;
        }
        return JSON.parse(userInfoStr) as UserInfo;
    } catch (error) {
        console.error("Failed to parse userInfo from localStorage:", error);
        return null;
    }
}


export function getUserPermissions(): Permission[] {
    const userInfo = getUserInfo();
    return userInfo?.permissions || [];
}

/**
 * Robust check if the current user is an Assistant or Agent Admin
 * (or any sub-account with full parent agent data access).
 * Handles both newly enriched and legacy session payloads.
 */
export function isUserAssistantOrAdmin(userInfo?: any, userType?: string | null): boolean {
    if (!userInfo && typeof window !== "undefined") {
        try {
            const raw = localStorage.getItem("userInfo");
            if (raw) userInfo = JSON.parse(raw);
        } catch {
            userInfo = null;
        }
    }
    const u = userInfo?.data || userInfo || {};
    const storedType = typeof window !== "undefined" ? localStorage.getItem("userType") : null;
    const currentType = (userType || storedType || "").toLowerCase();

    const roleId = Number(u.role_id || u.role?.id || u.data?.role_id || u.data?.role?.id || 0);
    const roleName = String(u.role?.name || u.role_name || u.data?.role?.name || "").toLowerCase();
    const agentType = String(u.agent_type || u.data?.agent_type || "").toLowerCase();
    const firstName = String(u.first_name || u.data?.first_name || "").toLowerCase();
    const lastName = String(u.last_name || u.data?.last_name || "").toLowerCase();
    const email = String(u.primary_email || u.email || u.data?.primary_email || u.data?.email || "").toLowerCase();

    // 1. Explicit assistant / admin role, name, email or type
    if (
        currentType === "agent_admin" ||
        currentType === "assistant" ||
        agentType === "agent_admin" ||
        agentType === "assistant" ||
        roleId === 6 || // Assistant role_id
        roleId === 5 || // Agent Admin role_id
        roleName.includes("assistant") ||
        roleName.includes("admin") ||
        firstName.includes("assistant") ||
        firstName.includes("assistan") ||
        lastName.includes("assistant") ||
        lastName.includes("assistan") ||
        email.includes("assistant") ||
        email.includes("admin")
    ) {
        return true;
    }

    // 2. If this is a SubAccount (agent_id exists indicating sub-account of parent agent)
    // and is NOT role 4 (co-agent), treat as assistant/admin with full parent access
    const agentId = u.agent_id || u.data?.agent_id;
    if (agentId && roleId !== 4 && !roleName.includes("co agent") && !roleName.includes("co-agent") && !roleName.includes("co_agent")) {
        return true;
    }

    return false;
}

/**
 * Robust check if the current user is restricted to co-agent ownership/splits.
 */
export function isUserCoAgent(userInfo?: any, userType?: string | null): boolean {
    if (isUserAssistantOrAdmin(userInfo, userType)) {
        return false;
    }
    if (!userInfo && typeof window !== "undefined") {
        try {
            const raw = localStorage.getItem("userInfo");
            if (raw) userInfo = JSON.parse(raw);
        } catch {
            userInfo = null;
        }
    }
    const u = userInfo?.data || userInfo || {};
    const storedType = typeof window !== "undefined" ? localStorage.getItem("userType") : null;
    const currentType = (userType || storedType || "").toLowerCase();

    const roleId = Number(u.role_id || u.role?.id || u.data?.role_id || u.data?.role?.id || 0);
    const roleName = String(u.role?.name || u.role_name || u.data?.role?.name || "").toLowerCase();
    const agentType = String(u.agent_type || u.data?.agent_type || "").toLowerCase();

    return (
        currentType === "co_agent" ||
        agentType === "co_agent" ||
        roleId === 4 ||
        roleName.includes("co agent") ||
        roleName.includes("co-agent") ||
        roleName.includes("co_agent")
    );
}

