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
    console.log(_orgUuid);
    const orgId = "fbd6e3a5-4b2c-4de1-ab73-e677b54c4b8a";
    const response = await api.get(`/organizations/${orgId}/signatures`);
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
    const orgId = "fbd6e3a5-4b2c-4de1-ab73-e677b54c4b8a";
    const response = await api.post(`/organizations/${orgId}/signatures`, payload);
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
