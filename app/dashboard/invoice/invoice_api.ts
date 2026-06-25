import { api } from '@/lib/api';

export async function GetInvoices() {
    const response = await api.get('/invoices');
    return response.data;
}

export async function GetInvoice(uuid: string) {
    const response = await api.get(`/invoices/${uuid}`);
    return response.data;
}

export async function CreateInvoice(data: any) {
    const response = await api.post('/invoices', data);
    return response.data;
}

export async function DeleteInvoice(uuid: string) {
    const response = await api.post(`/invoices/${uuid}`, { _method: 'DELETE' });
    return response.data;
}

export async function MarkPaid(
    uuid: string, 
    amount: string | number, 
    paymentMode?: 'on_behalf' | 'self', 
    payerUuid?: string,
    paymentMethod?: string,
    notes?: string
) {
    const body: any = {
        amount: amount,
    };
    if (paymentMode) {
        body.payment_mode = paymentMode;
        body.payer_uuid = payerUuid;
    }
    if (paymentMethod) {
        body.payment_method = paymentMethod;
    }
    if (notes) {
        body.notes = notes;
    }
    const response = await api.post(`/invoices/${uuid}/markPaid`, body);
    return response.data;
}

export async function UpdateInvoice(uuid: string, data: any) {
    const response = await api.post(`/invoices/${uuid}`, {
        ...data,
        _method: 'PUT'
    });
    return response.data;
}

export async function RefundInvoice(uuid: string, amount: string | number, notes?: string) {
    const response = await api.post(`/invoices/${uuid}/refund`, {
        amount,
        notes
    });
    return response.data;
}

export async function GetInvoicesByOrder(orderUuid: string) {
    const response = await api.get(`/invoices?order_uuid=${orderUuid}`);
    return response.data;
}

export async function PayInvoiceWithStripe(
    invoice: any, 
    order: any, 
    redirectUrl: string, 
    serviceId?: string,
    paymentMode?: 'on_behalf' | 'self',
    payerUuid?: string
) {
    const body: any = {
        agent_uuid: invoice.agent?.uuid || order.agent?.uuid || order.agent_uuid, // allow fallback
        url: redirectUrl,
        amount: invoice.total,
        currency: 'cad', // default, could use invoice.currency if needed
        order_id: order.id,
        invoice_uuid: invoice.uuid,
        description: `Payment for Invoice #${invoice.invoice_number || invoice.id}`,
        payment_type: serviceId ? 'service' : 'full',
        service_id: serviceId || null,
    };

    if (paymentMode) {
        body.payment_mode = paymentMode;
        body.payer_uuid = payerUuid;
    }

    const response = await api.post('/agent/pay/create-session', body);
    if (response.data?.success && response.data?.url) {
        window.open(response.data.url, '_blank');
    } else {
        throw new Error(response.data?.message || 'Failed to create payment session');
    }
}

export async function UpdateInvoiceExtraItems(uuid: string, extraItems: {
    order_service_id: number;
    description: string;
    quantity: number;
    unit_price: number;
}[]) {
    const response = await api.post(`/invoices/${uuid}/extra-items`, {
        extra_items: extraItems
    });
    return response.data;
}
