import { api } from "./api";

export interface EmailTemplate {
    uuid: string;
    title: string;
    content: string;
    type?: string | null;
    is_active: boolean;
    tags?: string[] | null;
}

/**
 * Fetches email templates from the global settings API.
 * @param type Optional filter by template type (e.g., 'schedule_change', 'service_ready')
 */
export async function fetchGlobalTemplates(type?: string) {
    try {
        const response = await api.get(`/email-templates`, {
            params: type ? { type } : {}
        });
        // Assuming the API returns { success: true, data: [...] }
        return response.data;
    } catch (error) {
        console.error("Failed to fetch global email templates:", error);
        return { success: false, data: [] };
    }
}

/**
 * Interpolates a template string with provided data.
 * Supports both {snake_case_placeholder} and {human readable placeholder}.
 */
export function interpolateTemplate(html: string, data: Record<string, any>) {
    if (!html) return "";
    let result = html;

    // Helper to escape regex special characters
    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 1. Process standard placeholders like {agent_name}
    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            const regex = new RegExp(`{${escapeRegExp(key)}}`, 'g');
            result = result.replace(regex, String(value));
        }
    });

    // 2. Backward compatibility mapping for specific old placeholders
    const legacyMapping: Record<string, string> = {
        "{agent name}": data.agent_name || "",
        "{service name}": data.service_name || "",
        "{listing location}": data.listing_address || "",
        "{listing address}": data.listing_address || "",
        "{vendor name}": data.vendor_name || "",
        "{order id}": data.order_id || "",
        "{appointment date}": data.appointment_date || "",
        "{appointment time}": data.appointment_time || "",
    };

    Object.entries(legacyMapping).forEach(([key, value]) => {
        if (value) {
            const regex = new RegExp(escapeRegExp(key), 'g');
            result = result.replace(regex, String(value));
        }
    });

    return result;
}

/**
 * Common data extractor to prepare data for interpolation from standard app objects.
 */
export function prepareTemplateData(order: any, agent?: any, service?: any, vendor?: any) {
    return {
        agent_name: agent ? `${agent.first_name || ""} ${agent.last_name || ""}`.trim() : "",
        agent_first_name: agent?.first_name || "",
        agent_last_name: agent?.last_name || "",
        listing_address: order?.property_address || "",
        listing_location: order?.property_location || "",
        service_name: service?.name || service?.service?.name || "",
        vendor_name: vendor?.company?.business_name || vendor?.first_name || "Vendor",
        order_id: order?.id || order?.uuid || "",
        appointment_date: service?.slots?.[0]?.date || order?.slots?.[0]?.date || "",
        appointment_time: service?.slots?.[0]?.start_time || order?.slots?.[0]?.start_time || "",
    };
}
