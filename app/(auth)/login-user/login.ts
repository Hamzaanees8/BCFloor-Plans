// lib/api/login.ts

type LoginPayload = {
    email: string;
    password: string;
    role: string
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
