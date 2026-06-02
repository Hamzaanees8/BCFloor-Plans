import { api } from "@/lib/api";

export interface Signature {
    uuid: string;
    name: string;
    html_content: string;
    media_url?: string | null;
    company_id: string; // The numeric ID or UUID depending on backend implementation
    created_at: string;
    updated_at: string;
}

export interface SignaturePayload {
    name: string;
    html_content: string;
    media_url?: string | null;
}

/**
 * Fetch all signatures for an organization
 */
export async function GetSignatures(_orgUuid: string) {
    if (!_orgUuid) {
        throw new Error("Organization UUID is required");
    }
    const response = await api.get(`/organizations/${_orgUuid}/signatures`);
    return response.data;
}

/**
 * Fetch a specific signature
 */
export async function GetSignature(signatureUuid: string) {
    const response = await api.get(`/signatures/${signatureUuid}`);
    return response.data;
}

/**
 * Create a new signature
 */
export async function CreateSignature(_orgUuid: string, payload: SignaturePayload) {
    if (!_orgUuid) {
        throw new Error("Organization UUID is required");
    }
    const response = await api.post(`/organizations/${_orgUuid}/signatures`, payload);
    return response.data;
}

/**
 * Update an existing signature
 */
export async function UpdateSignature(signatureUuid: string, payload: Partial<SignaturePayload>) {
    const response = await api.put(`/signatures/${signatureUuid}`, payload);
    return response.data;
}

/**
 * Delete a signature
 */
export async function DeleteSignature(signatureUuid: string) {
    const response = await api.delete(`/signatures/${signatureUuid}`);
    return response.data;
}
