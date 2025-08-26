
export interface CategoryPayload {
    title?: string | null;
    description?: string | null;
    type: string[]
    duration: number;
}

export interface FetchErrors {
    status?: boolean,
    message?: string,
    errors?: string[]

}

interface ProductOption {
    title?: string;
    quantity?: number;
    sq_ft_range?: string;
    sq_ft_rate?: string;
    service_duration?: number;
    amount?: number;
    id?: number
}

interface ProductOption {
    title?: string;
    quantity?: number;
    sq_ft_range?: string;
    sq_ft_rate?: string;
    service_duration?: number;
    amount?: number;
    isSqFtRange?: boolean;
    isSqFtRate?: boolean;
    uuid?: string;
    min_price: number
    id?: number
}
interface AddOns {
    title?: string;
    amount?: number;
    uuid?: string;
}

export type CleanedProductOption = Omit<ProductOption, 'isSqFtRange' | 'isSqFtRate'>;

interface ServicePayload {
    name: string;
    category_id: string;
    description?: string;
    background_color: string;
    border_color: string;
    thumbnail?: File | null;
    product_options?: CleanedProductOption[];
    uuid?: string;
    status?: boolean;
    id?: number;
    updated_at?: string;
    add_ons?: AddOns[]
}
export interface UpdateServicePayload {
    status?: boolean,

}

function payloadToFormData(payload: ServicePayload): FormData {
    const formData = new FormData();

    for (const [key, value] of Object.entries(payload)) {
        if (
            value === undefined ||
            value === null ||
            value === '' ||
            (Array.isArray(value) && value.length === 0)
        ) {
            continue;
        }

        if (value instanceof File) {
            formData.append(key, value);
        } else if (Array.isArray(value)) {
            value.forEach((item, index) => {
                if (typeof item === 'object' && item !== null) {
                    if (key === 'product_options') {
                        for (const [subKey, subValue] of Object.entries(item)) {
                            if (subValue !== undefined && subValue !== null && subValue !== '' && subValue != 0) {
                                formData.append(`product_options[${index}][${subKey}]`, subValue as string | Blob);
                            }
                        }
                    } else if (key === 'add_ons') {
                        const { title, amount } = item as { title?: string; amount?: string | number };

                        const isTitleFilled = title?.trim() !== '';
                        const isAmountFilled = amount !== undefined && amount !== null && amount !== 0 && amount.toString().trim() !== '';

                        if (isTitleFilled || isAmountFilled) {
                            if (isTitleFilled) {
                                formData.append(`add_ons[${index}][title]`, title!);
                            }
                            if (isAmountFilled) {
                                formData.append(`add_ons[${index}][amount]`, String(amount));
                            }
                        }
                    }
                }
            });
        } else {
            formData.append(key, value);
        }
    }

    return formData;
}


export function categoryPayloadToFormData(payload: CategoryPayload): FormData {
    const formData = new FormData();

    for (const [key, value] of Object.entries(payload)) {
        if (
            value === undefined ||
            value === null ||
            value === '' ||
            (Array.isArray(value) && value.length === 0)
        ) {
            continue;
        }

        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                formData.append(`${key}[${index}]`, item);
            });
        } else {
            formData.append(key, String(value));
        }
    }

    return formData;
}


export async function GetServices(token: string) {

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    try {
        const response = await fetch(`${API_URL}/services`, {
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

export async function GetCategories(token: string) {

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    try {
        const response = await fetch(`${API_URL}/service-categories`, {
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

export async function CreateCategory(payload: CategoryPayload, token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const formData = categoryPayloadToFormData(payload)
    const response = await fetch(`${API_URL}/service-categories`, {
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

export async function CreateService(payload: ServicePayload, token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    console.log('payload', payload);

    const formData = payloadToFormData(payload)
    const response = await fetch(`${API_URL}/services`, {
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

export async function UpdateService(payload: ServicePayload, token: string, serviceId: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    console.log('payload', payload);

    const formData = payloadToFormData(payload)
    formData.append('_method', "PUT")
    const response = await fetch(`${API_URL}/services/${serviceId}`, {
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

export async function GetOneService(token: string, serviceId: string) {

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    try {
        const response = await fetch(`${API_URL}/services/${serviceId}`, {
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

        const serviceData = await response.json();
        return serviceData;
    } catch (error) {
        console.error("Failed to fetch admin data:", error);
        throw error;
    }
}

export async function UpdateServiceStatus(listingId: string, payload: UpdateServicePayload, token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${API_URL}/services/${listingId}/status`, {
        method: 'PUT',
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

export async function UpdateVendorServiceStatus(vendorServiceId: string, payload: UpdateServicePayload, token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${API_URL}/vendors/${vendorServiceId}/service-status`, {
        method: 'PUT',
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

export async function DeleteService(setviceId: string, token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${API_URL}/services/${setviceId}`, {
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

export async function DeleteVendorService(vendorServiceId: string, token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${API_URL}/vendors/${vendorServiceId}/service`, {
        method: 'DELETE',
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