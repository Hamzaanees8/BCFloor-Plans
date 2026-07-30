import { api } from "@/lib/api";

export interface QbSyncLog {
    uuid: string;
    entity_type: string;
    entity_id: string;
    qb_entity_id?: string;
    qb_doc_number?: string;
    action: string;
    status: 'success' | 'failed' | 'pending';
    error_message?: string;
    error_code?: string;
    attempts: number;
    created_at: string;
}

export interface QbSyncLogDetail extends QbSyncLog {
    payload?: any;
    response?: any;
}

export const GetQbSyncLogs = async (params?: { status?: string; entity_type?: string; limit?: number }) => {
    try {
        const queryParams = new URLSearchParams();
        if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
        if (params?.entity_type) queryParams.append('entity_type', params.entity_type);
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        
        const queryString = queryParams.toString();
        const url = queryString ? `/quickbooks/sync/logs?${queryString}` : '/quickbooks/sync/logs';
        
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error("Error fetching QB sync logs:", error);
        throw error;
    }
};

export const GetQbSyncLog = async (uuid: string) => {
    try {
        const response = await api.get(`/quickbooks/sync/logs/${uuid}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching QB sync log ${uuid}:`, error);
        throw error;
    }
};

export const RetryQbSyncLog = async (uuid: string) => {
    try {
        const response = await api.post(`/quickbooks/sync/logs/${uuid}/retry`);
        return response.data;
    } catch (error) {
        console.error(`Error retrying QB sync log ${uuid}:`, error);
        throw error;
    }
};
