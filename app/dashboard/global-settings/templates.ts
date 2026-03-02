import { api } from "@/lib/api";

export interface EmailTemplatePayload {
    title: string;
    type?: string | null;
    tags?: string[] | null;
    sort_order?: number;
    is_active?: boolean;
    content: string;
}

export interface EmailTemplate {
    uuid: string;
    title: string;
    content: string;
    tags?: string[] | null;
    type?: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export async function GetTemplates() {
    const response = await api.get(`/email-templates`);
    const data = await response.data;
    return data;
}

export async function GetTemplate(uuid: string) {
    const response = await api.get(`/email-templates/${uuid}`);
    const data = await response.data;
    return data;
}

export async function CreateTemplate(payload: EmailTemplatePayload) {
    const response = await api.post(`/email-templates`, payload);
    const data = await response.data;
    return data;
}

export async function UpdateTemplate(uuid: string, payload: Partial<EmailTemplatePayload>) {
    const response = await api.put(`/email-templates/${uuid}`, payload);
    const data = await response.data;
    return data;
}

export async function DeleteTemplate(uuid: string) {
    const response = await api.delete(`/email-templates/${uuid}`);
    const data = await response.data;
    return data;
}

export async function PreviewTemplate(uuid: string, payload: { data: Record<string, string> }) {
    const response = await api.post(`/email-templates/${uuid}/preview`, payload);
    const data = await response.data;
    return data;
}
