import { api } from "@/lib/api";

export interface AgentAudio {
    uuid: string;
    agent_id: number;
    name: string;
    file_path: string;
    file_url: string;
    created_at: string;
    updated_at: string;
}

export interface UploadAgentAudioPayload {
    agent_id: string;
    audio: File;
    name?: string;
}

export interface FetchErrors {
    status?: boolean;
    message?: string;
    errors?: Record<string, string[]>;
}

export async function GetAgentAudios(agent_id: string) {
    try {
        const response = await api.get(`/agent-audio`, {
            params: { agent_id }
        });

        const data = await response.data;

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

export async function UploadAgentAudio(payload: UploadAgentAudioPayload) {
    const formData = new FormData();
    formData.append("agent_id", String(payload.agent_id));
    formData.append("audio", payload.audio);
    if (payload.name) {
        formData.append("name", payload.name);
    }

    const response = await api.post(`/agent-audio`, formData);

    const data = await response.data;

    if (data.status !== true) {
        const error = new Error(data.message || "Failed to upload audio");
        (error as FetchErrors).errors = data.errors;
        throw error;
    }

    return data;
}

export async function DeleteAgentAudio(uuid: string) {
    const response = await api.delete(`/agent-audio/${uuid}`);

    const data = await response.data;

    if (data.status !== true) {
        throw new Error(data.message || "Failed to delete audio");
    }

    return data;
}
