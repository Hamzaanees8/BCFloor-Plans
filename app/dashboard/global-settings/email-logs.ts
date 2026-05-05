import { api } from "@/lib/api";

export interface EmailLog {
    id: string;
    from: string;
    to: string[];
    subject: string;
    status: 'sent' | 'delivered' | 'bounced' | 'complained' | 'delivery_delayed' | 'opened' | 'clicked';
    created_at: string;
}

export interface EmailLogDetail extends EmailLog {
    last_event: string;
    html?: string;
    text?: string;
    events?: any[];
}

export const GetEmailLogs = async (limit: number = 100) => {
    try {
        const response = await api.get(`/email-logs?limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching email logs:", error);
        throw error;
    }
};

export const GetEmailLog = async (id: string) => {
    try {
        const response = await api.get(`/email-logs/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching email log detail:", error);
        throw error;
    }
};
