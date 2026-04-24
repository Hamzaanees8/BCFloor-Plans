import { api } from "@/lib/api";

export interface UserPayload {
    first_name?: string;
    last_name?: string;
    email?: string;
    secondary_email?: string;
    primary_phone?: string;
    secondary_phone?: string;
    company_name?: string;
    website?: string;
    address?: string;
    city?: string;
    province?: string;
    country?: string;
    password?: string;
    password_confirmation?: string;
    avatar?: File;
    company_logo?: File;
    company_banner?: File;
    roles?: number[];
    permissions?: number[];
    _method?: string;
}

export interface FetchErrors {
    status?: boolean,
    message?: string,
    errors?: string[]
}

function payloadToFormData(payload: UserPayload): FormData {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (value instanceof File) {
                formData.append(key, value);
            } else if (Array.isArray(value)) {
                value.forEach(val => {
                    formData.append(key + '[]', val);
                });
            } else if (typeof value === 'object') {
                // serialize object values
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, value);
            }
        }
    });

    return formData;
}

export async function Create(payload: UserPayload) {
    const formData = payloadToFormData(payload);

    const response = await api.post(`/users`, formData);

    const data = await response.data;

    if (data.status !== true) {
        const error = new Error(data.errors || 'Request failed');
        (error as FetchErrors).errors = data.errors;
        throw error;
    }

    return data;
}



export async function Edit(userId: string, payload: UserPayload) {
    const formData = payloadToFormData(payload);

    const response = await api.post(`/users/${userId}`, formData);

    const data = await response.data;

    if (data.status !== true) {
        const error = new Error(data.message || 'Request failed');
        (error as FetchErrors).errors = data.errors;
        throw error;
    }

    return data;
}


export async function Get() {
    try {
        const response = await api.get(`/users`);

        const adminData = await response.data;

        if (adminData.status !== true) {
            throw new Error(adminData.message || `Request failed with status ${response.status}`);
        }

        return adminData;
    } catch (error) {
        console.error("Failed to fetch admin data:", error);
        throw error;
    }
}

export interface UpdateUserPayload {
    status?: boolean,
}

export async function UpdateStatus(userId: string, payload: UpdateUserPayload) {

    const response = await api.post(`/users/${userId}/status`, payload);

    const data = await response.data;

    if (data.status !== true) {
        throw new Error(data.message || 'Failed to update user');
    }

    return data;
}

export async function GetOne(userId: string) {
    try {
        const response = await api.get(`/users/${userId}`);

        const adminData = await response.data;

        if (adminData.status !== true) {
            throw new Error(adminData.message || `Request failed with status ${response.status}`);
        }

        return adminData;
    } catch (error) {
        console.error("Failed to fetch admin data:", error);
        throw error;
    }
}

export async function Delete(userId: string) {
    const response = await api.post(`/users/${userId}`, {
        _method: 'DELETE',
    });

    const data = await response.data;

    if (data.status !== true) {
        throw new Error(data.message || 'Failed to delete user');
    }

    return data;
}

export async function GetRole() {
    try {
        const response = await api.get(`/roles`);

        const rolesData = await response.data;

        return rolesData;
    } catch (error) {
        console.error("Failed to fetch role data:", error);
        throw error;
    }
}
export async function GetPermissions() {

    try {
        const response = await api.get(`/permissions`);

        const permissionsData = await response.data;
        return permissionsData;
    } catch (error) {
        console.error("Failed to fetch role data:", error);
        throw error;
    }
}

export interface ResetPassword {
    new_password?: string,
    confirm_password?: string,
    _method?: string,
}

export async function ResetPassword(payload: ResetPassword, userId: string) {

    const response = await api.post(`/users/${userId}/password`, payload);

    const data = await response.data;

    if (data.status !== true) {
        throw new Error(data.message || 'Failed to delete user');
    }

    return data;
}