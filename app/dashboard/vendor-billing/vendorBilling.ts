
export interface PaymentPayload {
    vendor_uuid: string;
    order_service_uuid: string;
    amount: number;
}

export interface PaymentResponse {
    status: string;
    error?: string;
    transfer_id?: string
}

  const API_URL = process.env.NEXT_PUBLIC_API_URL;


export async function payVendor(payload: PaymentPayload, token: string): Promise<PaymentResponse> {
    try {
        const response = await fetch(`${API_URL}/admin/pay-vendor`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return data


    } catch (error) {
        console.error('Error processing payment:', error);

        return {
            status: 'failed',
            error: error instanceof Error ? error.message : 'An unknown error occurred',
        };
    }
}