import { api } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface AgentAudio {
    uuid: string;
    agent_id?: number;
    organization_id?: number;
    name: string;
    file_path: string;
    /** Public S3 URL — returned by the model's `audio_url` accessor */
    audio_url?: string;
    /** Legacy alias kept for backward-compat */
    file_url?: string;
    mime_type?: string;
    size?: number;
    is_active?: boolean;
    source?: 'agent' | 'organization' | string;
    created_at: string;
    updated_at: string;
}

export interface UploadAgentAudioPayload {
    agent_id: string;
    audio: File;
    name?: string;
}

export interface UploadOrganizationAudioPayload {
    organization_id: string;
    audio: File;
    name?: string;
}

export interface FetchErrors {
    status?: boolean;
    message?: string;
    errors?: Record<string, string[]>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent Audio
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/agent-audio?agent_id=uuid */
export async function GetAgentAudios(agent_id: string) {
    try {
        const response = await api.get(`/agent-audio`, {
            params: { agent_id }
        });

        const data = response.data;

        if (data.status !== true) {
            throw new Error(
                data.message || `Request failed with status ${response.status}`
            );
        }

        return data;
    } catch (error) {
        console.error("Failed to fetch agent audios:", error);
        throw error;
    }
}

/** POST /api/agent-audio (multipart) — upload for an agent */
export async function UploadAgentAudio(payload: UploadAgentAudioPayload) {
    const formData = new FormData();
    formData.append("agent_id", String(payload.agent_id));
    formData.append("audio", payload.audio);
    if (payload.name) {
        formData.append("name", payload.name);
    }

    const response = await api.post(`/agent-audio`, formData);
    const data = response.data;

    if (data.status !== true) {
        const error = new Error(data.message || "Failed to upload audio");
        (error as FetchErrors).errors = data.errors;
        throw error;
    }

    return data;
}

/** DELETE /api/agent-audio/{uuid} */
export async function DeleteAgentAudio(uuid: string) {
    const response = await api.delete(`/agent-audio/${uuid}`);
    const data = response.data;

    if (data.status !== true) {
        throw new Error(data.message || "Failed to delete audio");
    }

    return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Organization Audio
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/organization-audio?organization_id=uuid */
export async function GetOrganizationAudios(organization_id: string) {
    try {
        const response = await api.get(`/organization-audio`, {
            params: { organization_id }
        });

        const data = response.data;

        if (data.status !== true) {
            throw new Error(
                data.message || `Request failed with status ${response.status}`
            );
        }

        return data;
    } catch (error) {
        console.error("Failed to fetch organization audios:", error);
        throw error;
    }
}

/** POST /api/organization-audio (multipart) — upload for an organization */
export async function UploadOrganizationAudio(payload: UploadOrganizationAudioPayload) {
    const formData = new FormData();
    formData.append("organization_id", String(payload.organization_id));
    formData.append("audio", payload.audio);
    if (payload.name) {
        formData.append("name", payload.name);
    }

    const response = await api.post(`/organization-audio`, formData);
    const data = response.data;

    if (data.status !== true) {
        const error = new Error(data.message || "Failed to upload organization audio");
        (error as FetchErrors).errors = data.errors;
        throw error;
    }

    return data;
}

/** DELETE /api/organization-audio/{uuid} — dedicated org audio delete */
export async function DeleteOrganizationAudio(uuid: string) {
    const response = await api.delete(`/organization-audio/${uuid}`);
    const data = response.data;

    if (data.status !== true) {
        throw new Error(data.message || "Failed to delete audio");
    }

    return data;
}
