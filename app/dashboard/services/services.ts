import { api } from "@/lib/api";

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
    add_ons?: AddOns[];
    is_travel_required?: boolean | number;
}
interface PackagePayload {
    name: string;
    discount: number;
    service_ids: string[];
    status?: boolean | number;
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
export function packagePayloadToFormData(payload: PackagePayload): FormData {
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

    try {
        const response = await api.get(`/services`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.status !== 200) {
            throw new Error(response.data.message || `Request failed with status ${response.status}`);
        }

        const adminData = await response.data;
        return adminData;
    } catch (error) {
        console.error("Failed to fetch admin data:", error);
        throw error;
    }
}

export async function GetCategories(token: string) {

    try {
        const response = await api.get(`/service-categories`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.status !== 200) {
            throw new Error(response.data.message || `Request failed with status ${response.status}`);
        }

        const adminData = await response.data;
        return adminData;
    } catch (error) {
        console.error("Failed to fetch admin data:", error);
        throw error;
    }
}

export async function CreateCategory(payload: CategoryPayload, token: string) {
    const formData = categoryPayloadToFormData(payload)
    const response = await api.post(`/service-categories`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status !== 200) {
        throw new Error(response.data.message || `Request failed with status ${response.status}`);
    }

    return response.data;
}

export async function CreateService(payload: ServicePayload, token: string) {
    const formData = payloadToFormData(payload)
    const response = await api.post(`/services`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status !== 200) {
        throw new Error(response.data.message || `Request failed with status ${response.status}`);
    }

    return response.data;
}

export async function GetPackages(token: string) {

    try {
        const response = await api.get(`/packages`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.status !== 200) {
            throw new Error(response.data.message || `Request failed with status ${response.status}`);
        }

        const adminData = await response.data;
        return adminData;
    } catch (error) {
        console.error("Failed to fetch admin data:", error);
        throw error;
    }
}

export async function CreatePackage(payload: PackagePayload, token: string) {
    const formData = packagePayloadToFormData(payload)
    const response = await api.post(`/packages`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status !== 200) {
        throw new Error(response.data.message || `Request failed with status ${response.status}`);
    }

    return response.data;
}

export async function UpdatePackage(payload: PackagePayload, token: string, packageId: string) {

    const formData = packagePayloadToFormData(payload)
    formData.append('_method', "PUT")
    const response = await api.post(`/packages/${packageId}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status !== 200) {
        throw new Error(response.data.message || `Request failed with status ${response.status}`);
    }

    return response.data;
}

export async function UpdateService(payload: ServicePayload, token: string, serviceId: string) {

    const formData = payloadToFormData(payload)
    formData.append('_method', "PUT")
    const response = await api.post(`/services/${serviceId}`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status !== 200) {
        throw new Error(response.data.message || `Request failed with status ${response.status}`);
    }

    return response.data;
}

export async function GetOneService(token: string, serviceId: string) {

    try {
        const response = await api.get(`/services/${serviceId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.status !== 200) {
            throw new Error(response.data.message || `Request failed with status ${response.status}`);
        }

        const serviceData = await response.data;
        return serviceData;
    } catch (error) {
        console.error("Failed to fetch admin data:", error);
        throw error;
    }
}
export async function GetOnePackage(token: string, packageId: string) {

    try {
        const response = await api.get(`/packages/${packageId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.status !== 200) {
            throw new Error(response.data.message || `Request failed with status ${response.status}`);
        }

        const serviceData = await response.data;
        return serviceData;
    } catch (error) {
        console.error("Failed to fetch admin data:", error);
        throw error;
    }
}

export async function UpdateServiceStatus(listingId: string, payload: UpdateServicePayload, token: string) {

    const response = await api.put(`/services/${listingId}/status`, payload, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status !== 200) {
        throw new Error(response.data.message || `Request failed with status ${response.status}`);
    }

    return response.data;
}

export async function UpdateVendorServiceStatus(vendorServiceId: string, payload: UpdateServicePayload, token: string) {

    const response = await api.put(`/vendors/${vendorServiceId}/service-status`, payload, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status !== 200) {
        throw new Error(response.data.message || `Request failed with status ${response.status}`);
    }

    return response.data;
}

export async function DeleteService(setviceId: string, token: string) {
    const response = await api.delete(`/services/${setviceId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status !== 200) {
        throw new Error(response.data.message || `Request failed with status ${response.status}`);
    }

    return response.data;
}

export async function DeleteVendorService(vendorServiceId: string, token: string) {
    const response = await api.delete(`/vendors/${vendorServiceId}/service`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status !== 200) {
        throw new Error(response.data.message || `Request failed with status ${response.status}`);
    }

    return response.data;
}