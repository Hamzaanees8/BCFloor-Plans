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
