export interface UserPayload {
    first_name: string;
    last_name: string;
    email: string;
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

export async function Create(payload: UserPayload, token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const formData = payloadToFormData(payload);

    const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(data.message || 'Request failed');
        (error as FetchErrors).errors = data.errors;
        throw error;
    }

    return data;
}



export async function Edit(userId: string, payload: UserPayload, token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const formData = payloadToFormData(payload);

    const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(data.message || 'Request failed');
        (error as FetchErrors).errors = data.errors;
        throw error;
    }

    return data;
}


export async function Get(token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        const adminData = await response.json();

        if (!response.ok) {
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

export async function UpdateStatus(userId: string, payload: UpdateUserPayload, token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${API_URL}/users/${userId}/status`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to update user');
    }

    return data;
}

export async function GetOne(token: string, userId: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `Request failed with status ${response.status}`);
        }

        const adminData = await response.json();
        return adminData;
    } catch (error) {
        console.error("Failed to fetch admin data:", error);
        throw error;
    }
}
export async function Delete(userId: string, token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ _method: 'DELETE' }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user');
    }

    return data;
}

export async function GetRole(token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    try {
        const response = await fetch(`${API_URL}/roles`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `Request failed with status ${response.status}`);
        }

        const rolesData = await response.json();
        console.log('rolesData', rolesData);

        return rolesData;
    } catch (error) {
        console.error("Failed to fetch role data:", error);
        throw error;
    }
}
export async function GetPermissions(token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    try {
        const response = await fetch(`${API_URL}/permissions`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `Request failed with status ${response.status}`);
        }

        const permissionsData = await response.json();
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

export async function ResetPassword(payload: ResetPassword, userId: string, token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${API_URL}/users/${userId}/password`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user');
    }

    return data;
}