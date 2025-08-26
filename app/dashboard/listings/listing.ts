
export interface ListingsPayload {
    address?: string | null;
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
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    try {
        const response = await fetch(`${API_URL}/properties`, {
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
export async function CreateListings(payload: ListingsPayload, token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${API_URL}/properties`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(data.message || 'Request failed');
        (error as FetchErrors).errors = data.errors;
        throw error;
    }

    return data;
}
export async function EditListings(userId: string, payload: ListingsPayload, token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const updatedPayload = {
        ...payload,
        _method: 'PUT',
    };

    const response = await fetch(`${API_URL}/properties/${userId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPayload),
    });

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(data.message || 'Request failed');
        (error as FetchErrors).errors = data.errors;
        throw error;
    }


    return data;
}
export async function GetOneListing(token: string, userId: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    try {
        const response = await fetch(`${API_URL}/properties/${userId}`, {
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

export async function UpdateListingStatus(listingId: string, payload: UpdateListingPayload, token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${API_URL}/properties/${listingId}/status`, {
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

export async function DeleteListing(listingId: string, token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(`${API_URL}/properties/${listingId}`, {
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