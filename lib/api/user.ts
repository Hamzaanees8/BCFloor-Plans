import { api } from "@/lib/api";

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

export type Role = {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
    pivot?: {
        user_id: number;
        role_id: number;
    };
};

export type UserData = {
    uuid: string;
    first_name: string;
    last_name: string;
    email: string;
    permissions?: Permission[];
    roles?: Role[];
    [key: string]: unknown;
};

export async function getUserByUuid(uuid: string): Promise<UserData> {
    try {
        const response = await api.get(`/users/${uuid}`);
        return response.data.data;
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        throw error;
    }
}
