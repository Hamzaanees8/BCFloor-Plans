import { api } from "@/lib/api";

export interface PaymentPayload {
    vendor_uuid: string;
    order_service_uuid?: string;
    order_service_uuids?: string[];
    amount: number;
}

export interface PaymentResponse {
    status: string;
    error?: string;
    transfer_id?: string
}



export async function payVendor(payload: PaymentPayload, token: string): Promise<PaymentResponse> {
    try {
        const response = await api.post(`/admin/pay-vendor`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.data;

        return data


    } catch (error) {
        console.error('Error processing payment:', error);

        return {
            status: 'failed',
            error: error instanceof Error ? error.message : 'An unknown error occurred',
        };
    }
}