import { api } from "@/lib/api";

export interface EmailTemplatePayload {
    name: string;
    type: string;
    html_content: string;
}

export interface EmailTemplate {
    id: number;
    uuid: string;
    name: string;
    type: string;
    html_content: string;
    status: boolean;
    date: string;
}

export async function GetTemplates() {
    const response = await api.get(`/email-templates`);
    const data = await response.data;
    return data;
}

export async function CreateTemplate(payload: EmailTemplatePayload) {
    const response = await api.post(`/email-templates`, payload);
    const data = await response.data;
    return data;
}

export async function DeleteTemplate(uuid: string) {
    const response = await api.delete(`/email-templates/${uuid}`);
    const data = await response.data;
    return data;
}
