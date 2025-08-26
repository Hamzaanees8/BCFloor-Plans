
type LoginPayload = {
    email: string;
    password: string
    password_confirmation: string
    token: string
};

type LoginResponse = {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
};


export async function newPassword(payload: LoginPayload): Promise<LoginResponse> {

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const res = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to send email");
    }

    return await res.json();
}
