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
/**
 * Interpolates a template string with provided data.
 * Supports both {placeholder}, {{placeholder}}, {human readable placeholder}, and {{human readable placeholder}}.
 */
export function interpolateTemplate(html: string, data: Record<string, any>) {
    if (!html) return "";
    let result = html;

    // Helper to escape regex special characters
    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 1. Process all data placeholders (handles both {key} and {{key}})
    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            // Allow optional double braces and optional whitespace inside
            const escapedKey = escapeRegExp(key);
            const regex = new RegExp(`{{?\\s*${escapedKey}\\s*}?}`, 'g');
            result = result.replace(regex, String(value));
        }
    });

    // 2. Backward compatibility mapping for specific old placeholders
    const legacyMapping: Record<string, string> = {
        "agent name": data.agent_name || "",
        "service name": data.service_name || "",
        "listing location": data.listing_address || "",
        "listing address": data.listing_address || "",
        "vendor name": data.vendor_name || "",
        "vendor number": data.vendor_number || data.vendor_phone || "",
        "vendor phone": data.vendor_phone || data.vendor_number || "",
        "order id": data.order_id || "",
        "appointment date": data.appointment_date || "",
        "appointment time": data.appointment_time || "",
        // Add more human-readable mappings
        "user name": data.agent_name || "",
        "property address": data.listing_address || "",
        "amount": data.amount || "",
        "date": data.appointment_date || "",
        "schedule date": data.appointment_date || "",
        "schedule time": data.appointment_time || "",
    };

    Object.entries(legacyMapping).forEach(([key, value]) => {
        const escapedKey = escapeRegExp(key);
        // Match both {human readable} and {{human readable}}
        const regex = new RegExp(`{{?${escapedKey}}}?`, 'g');
        result = result.replace(regex, String(value));
    });

    return result;
}

/**
 * Common data extractor to prepare data for interpolation from standard app objects.
 */
/**
 * Common data extractor to prepare data for interpolation from standard app objects.
 */
export function prepareTemplateData(order: any, agent?: any, service?: any, vendor?: any, additionalData: Record<string, any> = {}) {
    // Current date for general use
    const now = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    // Helper for currency formatting
    const formatCurrency = (amt: any) => {
        if (amt === undefined || amt === null) return "";
        const numeric = Number(amt);
        return isNaN(numeric) ? String(amt) : `$${numeric.toFixed(2)}`;
    };

    const slots = order?.slots || service?.slots || [];
    const firstSlot = slots[0];
    
    // Deeper search for service name
    const serviceName = (typeof service === 'string' ? service : (
        service?.name || 
        service?.service?.name || 
        firstSlot?.service_name || 
        firstSlot?.service?.name || 
        order?.services?.[0]?.service?.name || 
        order?.services?.[0]?.name ||
        ""
    ));

    // Deeper search for vendor data
    const vendorObj = vendor || firstSlot?.vendor;
    const vendorName = vendorObj?.company?.business_name || 
                      (vendorObj?.first_name ? `${vendorObj.first_name} ${vendorObj.last_name || ""}`.trim() : "Vendor");
    const vendorPhone = vendorObj?.primary_phone || vendorObj?.secondary_phone || vendorObj?.phone || "";

    return {
        // Standard keys
        listing_address: order?.property_address || "",
        listing_location: order?.property_location || "",
        property_address: order?.property_address || "",
        service_name: serviceName,
        vendor_name: vendorName,
        vendor_number: vendorPhone,
        vendor_phone: vendorPhone,
        order_id: order?.id || order?.uuid || "",
        appointment_date: firstSlot?.date || "",
        appointment_time: firstSlot?.start_time || "",
        
        // New expanded keys
        user_name: agent ? `${agent.first_name || ""} ${agent.last_name || ""}`.trim() : "",
        amount: formatCurrency(order?.amount),
        date: firstSlot?.date || now,
        schedule_date: firstSlot?.date || "",
        schedule_time: firstSlot?.start_time || "",
        company_name: "BC Floor Plans", // Default fallback
        action_url: additionalData.action_url || "",
        
        // Spread additional data that might be passed
        ...additionalData
    };
}

/**
 * Fetches organization notification preferences.
 */
export async function fetchNotificationPreferences() {
    try {
        const response = await api.get(`/notification-preferences`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch notification preferences:", error);
        return { success: false, data: [] };
    }
}

/**
 * Fetches registered notification preference events and defaults.
 */
export async function fetchNotificationEvents() {
    try {
        const response = await api.get(`/notification-preferences/events`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch notification preference events:", error);
        return { success: false, data: [] };
    }
}

/**
 * Bulk updates notification preferences.
 */
export async function updateNotificationPreferences(preferences: Array<{ role: string; event_type: string; email_enabled: boolean }>) {
    try {
        const response = await api.put(`/notification-preferences`, { preferences });
        return response.data;
    } catch (error) {
        console.error("Failed to update notification preferences:", error);
        return { success: false };
    }
}

