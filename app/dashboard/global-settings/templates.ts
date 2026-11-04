import { api } from "@/lib/api";

export type RecipientRole = 'admin' | 'agent' | 'vendor';

export interface EmailTemplatePayload {
    title: string;
    type?: string | null;
    event_type?: string | null;
    recipient_type?: RecipientRole[] | null;
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
    event_type?: string | null;
    recipient_type?: RecipientRole[] | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface BladePreviewData {
    event_type: string;
    event_label: string;
    description?: string;
    recipient_role: string;
    supported_roles: RecipientRole[];
    variables: string[];
    subject: string;
    content: string;
    full_html: string;
}

export async function GetTemplates(params?: { event_type?: string; recipient_type?: string; is_active?: boolean }) {
    const response = await api.get(`/email-templates`, { params });
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

export async function PreviewTemplate(uuid: string, payload: { data: Record<string, string>; recipient_role?: string }) {
    const response = await api.post(`/email-templates/${uuid}/preview`, payload);
    const data = await response.data;
    return data;
}

export async function GetBladePreview(
    eventType: string,
    recipientRole: string = 'agent',
    orderUuid?: string,
    options?: {
        loadDefault?: boolean;
        serviceUuid?: string;
        slotUuid?: string;
        tourUuid?: string;
        vendorUuid?: string;
        extraData?: Record<string, any>;
    }
) {
    const response = await api.get(`/email-templates/blade-preview/${eventType}`, {
        params: {
            recipient_role: recipientRole,
            ...(orderUuid ? { order_uuid: orderUuid } : {}),
            ...(options?.loadDefault ? { load_default: 1 } : {}),
            ...(options?.serviceUuid ? { service_uuid: options.serviceUuid } : {}),
            ...(options?.slotUuid ? { slot_uuid: options.slotUuid } : {}),
            ...(options?.tourUuid ? { tour_uuid: options.tourUuid } : {}),
            ...(options?.vendorUuid ? { vendor_uuid: options.vendorUuid } : {}),
            ...(options?.extraData ? options.extraData : {}),
        }
    });
    return response.data;
}

export async function SendPreviewEmail(payload: {
    event_type: string;
    recipient_roles: RecipientRole[];
    content_overrides: Record<string, string>;
    subject_overrides?: Record<string, string>;
    order_uuid?: string;
    tour_uuid?: string;
    service_uuid?: string;
    slot_uuid?: string;
    vendor_uuid?: string;
    options?: Record<string, any>;
}) {
    const response = await api.post(`/email-templates/send-preview`, payload);
    return response.data;
}
