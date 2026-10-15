// lib/api/login.ts

type LoginPayload = {
    email: string;
    password: string;
    role: string;
    organization_id?: number;
    organization_slug?: string;
    domain?: string;
};

type LoginResponse = {
    data: {
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
        type: string
    }
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    console.log(API_URL, "API_URL")
    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Login failed");
    }

    return await res.json();
}

export type AgentSignupPayload = {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    organization_slug?: string;
    organization_id?: number;
    company_name?: string;
    primary_phone?: string;
};

export async function agentSignup(payload: AgentSignupPayload) {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://api-stage.bcfloorplans.com').replace(/\/api\/?$/, '');
    const res = await fetch(`${baseUrl}/api/agent/signup`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        if (json.errors) {
            const firstKey = Object.keys(json.errors)[0];
            const msg = json.errors[firstKey]?.[0];
            throw new Error(msg || json.message || "Signup failed");
        }
        throw new Error(json.message || "Signup failed");
    }

    return json;
}
