import { api } from "@/lib/api";

export interface Area {
    type: string;
    footage: number;
    custom_title?: string;
    uuid?: string;
    category?: "Finished" | "Subtotal" | "Other";
}

export interface ListingsPayload {
    address?: string | null;
    mls_number?: string | null;
    mls_property?: string | null;
    square_footage?: number | null;
    areas?: Area[] | null;
    listing_price?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    lot_size?: string | null;
    year_constructed?: number | null;
    parking_spots?: number | null;
    property_type?: string | null;
    property_status?: string | null;
    heading?: string | null;
    description?: string | null;
    agent_id?: string | null;
    city?: string | null;
    province?: string | null;
    country?: string | null;
}

export interface FetchErrors {
    status?: boolean,
    message?: string,
    errors?: string[]

}
export interface UpdateListingPayload {
    status?: boolean,
}

export async function GetListing(token: string) {

    try {
        const response = await api.get(`/properties`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const listingsData = await response.data;
        if (listingsData.status !== true) {
            throw new Error(listingsData.message || `Request failed with status ${response.status}`);
        }

        return listingsData;
    } catch (error) {
        console.error("Failed to fetch admin data:", error);
        throw error;
    }
}
export async function CreateListings(payload: ListingsPayload) {

    const response = await api.post(`/properties`, payload);

    const data = await response.data;

    if (data.status !== true) {
        const error = new Error(data.message || 'Request failed');
        (error as FetchErrors).errors = data.errors;
        throw error;
    }

    return data;
}
export async function EditListings(userId: string, payload: ListingsPayload) {

    const updatedPayload = {
        ...payload,
        _method: 'PUT',
    };

    const response = await api.post(`/properties/${userId}`, updatedPayload);

    const data = await response.data;

    if (data.status !== true) {
        const error = new Error(data.message || 'Request failed');
        (error as FetchErrors).errors = data.errors;
        throw error;
    }


    return data;
}

export async function UpdatePropertySquareFootage(propertyId: string, squareFootage: number, areas: Area[], propertyDetails: ListingsPayload) {
    const payload: ListingsPayload = {
        ...propertyDetails,
        square_footage: squareFootage,
        areas: areas
    };

    return await EditListings(propertyId, payload);
}
export async function GetOneListing(userId: string) {

    try {
        const response = await api.get(`/properties/${userId}`);

        const listingData = await response.data;

        if (listingData.status !== true) {
            throw new Error(listingData.message || `Request failed with status ${response.status}`);
        }

        return listingData;
    } catch (error) {
        console.error("Failed to fetch admin data:", error);
        throw error;
    }
}

export async function UpdateListingStatus(listingId: string, payload: UpdateListingPayload) {

    const response = await api.put(`/properties/${listingId}/status`, payload);

    const data = await response.data;

    if (data.status !== true) {
        throw new Error(data.message || 'Failed to update user');
    }

    return data;
}

export async function DeleteListing(listingId: string) {

    const response = await api.delete(`/properties/${listingId}`);

    const data = await response.data;

    if (data.status !== true) {
        throw new Error(data.message || 'Failed to delete user');
    }

    return data;
}
export async function fetchMlsData(mls_id: string) {
    try {
        const response = await api.get(`/vendor/fetch-mls-data/?mls_number=${mls_id}`);
        const mlsData = await response.data;
        if (mlsData.status !== true && mlsData.success !== true) {
            throw new Error(mlsData.message || `Request failed with status ${response.status}`);
        }
        return mlsData;
    } catch (error) {
        console.error("Failed to fetch MLS data:", error);
        return error;
    }
}