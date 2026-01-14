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