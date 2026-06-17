import { AgentPayload, FetchErrors, payloadToFormData } from "@/app/dashboard/agents/agents";

// ─── Helpers ────────────────────────────────────────────────────────────────


function appendOrgSlug(url: string, orgSlug?: string | null): string {
    if (!orgSlug) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}org_slug=${encodeURIComponent(orgSlug)}`;
}

// ─── Agent Signup ────────────────────────────────────────────────────────────

export async function AgentSignup(payload: AgentPayload, orgSlug?: string | null) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const formData = payloadToFormData(payload);

    if (orgSlug) {
        formData.append('org_slug', orgSlug);
    }

    const response = await fetch(`${API_URL}/agents`, {
        method: "POST",
        headers: {
        },
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(data.message || "Request failed");
        (error as FetchErrors).errors = data.errors;
        throw error;
    }

    return data;
}

// ─── Services ────────────────────────────────────────────────────────────────

// Fetch services for book-now without authentication
export async function fetchServicesForBookNow(orgSlug?: string | null) {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;

        if (!API_URL) {
            return [];
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
            const url = orgSlug ? `${API_URL}/services/${encodeURIComponent(orgSlug)}` : `${API_URL}/services`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (response.ok) {
                const data = await response.json();
                return data.data || [];
            } else {
                return [];
            }
        } catch (fetchError) {
            console.log(fetchError);
            return [];
        }
    } catch (error) {
        console.log(error);
        return [];
    }
}

// ─── Discounts ───────────────────────────────────────────────────────────────

export async function fetchDiscountsForBookNow(orgSlug?: string | null) {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;

        if (!API_URL) {
            return [];
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
            const url = appendOrgSlug(`${API_URL}/discounts`, orgSlug);
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (response.ok) {
                const data = await response.json();
                return Array.isArray(data.data) ? data.data : [];
            } else {
                return [];
            }
        } catch (fetchError) {
            // Silently ignore fetch errors
            console.log(fetchError);
            return [];
        }
    } catch (error) {
        // Silently ignore outer errors
        console.log(error);
        return [];
    }
}

// ─── Vendors ─────────────────────────────────────────────────────────────────

export async function fetchVendorForBookNow(token?: string | null, orgSlug?: string | null) {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const url = orgSlug ? `${API_URL}/vendors?slug=${encodeURIComponent(orgSlug)}` : `${API_URL}/vendors`;
            const response = await fetch(url, {
                method: 'GET',
                headers,
            });

            clearTimeout(timeout);

            if (response.ok) {
                const data = await response.json();
                return data.data || data;
            } else {
                return null;
            }
        } catch (fetchError) {
            console.log(fetchError);
            return null;
        }
    } catch (error) {
        console.log(error);
        return null;
    }
}

// ─── Login ───────────────────────────────────────────────────────────────────

// Login for agents
export async function agentLogin(
    email: string,
    password: string,
    organization_id?: number,
    domain?: string,
    orgSlug?: string | null
) {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;

        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
                role: 'agent',
                organization_id,
                domain,
                ...(orgSlug ? { org_slug: orgSlug } : {}),
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || "Login failed");
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

// ─── Signup ───────────────────────────────────────────────────────────────────

// Signup for agents
export async function agentSignup(payload: unknown, orgSlug?: string | null) {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;

        const enrichedPayload = orgSlug
            ? { ...(payload as object), org_slug: orgSlug }
            : payload;

        const response = await fetch(`${API_URL}/agent/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(enrichedPayload),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || "Signup failed");
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

// ─── Order Submission ────────────────────────────────────────────────────────

// Submit order for book-now
export async function submitBookNowOrder(orderPayload: unknown, token: string) {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;

        const response = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(orderPayload),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || "Order submission failed");
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

// ─── Property ────────────────────────────────────────────────────────────────

// Create property/listing for book-now
export async function createPropertyForBookNow(propertyData: unknown, token: string) {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;

        const response = await fetch(`${API_URL}/orders/add/properties`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(propertyData),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || "Property creation failed");
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

// ─── Order Slots ─────────────────────────────────────────────────────────────

// Fetch booked slots for book-now
export async function fetchOrderSlots(orgSlug?: string | null) {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        if (!API_URL) return [];
        const url = appendOrgSlug(`${API_URL}/order-slots`, orgSlug);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (response.ok) {
            const data = await response.json();
            return data.data || data || [];
        }
        return [];
    } catch (error) {
        console.log(error);
        return [];
    }
}

// ─── Organizations ───────────────────────────────────────────────────────────

export async function fetchOrganizationsForBookNow(orgSlug?: string | null) {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        if (!API_URL) return [];
        const url = appendOrgSlug(`${API_URL}/organizations`, orgSlug);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (response.ok) {
            const data = await response.json();
            return data.data || data || [];
        }
        return [];
    } catch (error) {
        console.log(error);
        return [];
    }
}
