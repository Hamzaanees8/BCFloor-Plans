import { AgentPayload, FetchErrors, payloadToFormData } from "@/app/dashboard/agents/agents";

export async function AgentSignup(payload: AgentPayload) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const formData = payloadToFormData(payload);

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

// Fetch services for book-now without authentication
export async function fetchServicesForBookNow() {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;

        if (!API_URL) {
            return [];
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
            const response = await fetch(`${API_URL}/services`, {
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

export async function fetchDiscountsForBookNow() {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;

        if (!API_URL) {
            return [];
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
            const response = await fetch(`${API_URL}/discounts`, {
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

export async function fetchVendorForBookNow(token?: string | null) {
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

            const response = await fetch(`${API_URL}/vendors`, {
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

// Login for agents
export async function agentLogin(email: string, password: string) {
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
                role: 'agent'
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

// Signup for agents
export async function agentSignup(payload: unknown) {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;

        const response = await fetch(`${API_URL}/agent/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
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
// Fetch booked slots for book-now
export async function fetchOrderSlots() {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        if (!API_URL) return [];
        const response = await fetch(`${API_URL}/order-slots`, {
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
