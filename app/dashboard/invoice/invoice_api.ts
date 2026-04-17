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

export async function MarkPaid(uuid: string, amount: string | number) {
    const response = await api.post(`/invoices/${uuid}/markPaid`, {
        amount: amount,
    });
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

export async function PayInvoiceWithStripe(invoice: any, order: any, redirectUrl: string, serviceId?: string) {
    const body = {
        agent_uuid: order.agent?.uuid || order.agent_uuid, // allow fallback
        url: redirectUrl,
        amount: invoice.total,
        currency: 'cad', // default, could use invoice.currency if needed
        order_id: order.id,
        invoice_uuid: invoice.uuid,
        description: `Payment for Invoice #${invoice.invoice_number || invoice.id}`,
        payment_type: serviceId ? 'service' : 'full',
        service_id: serviceId || null,
    };
    const response = await api.post('/agent/pay/create-session', body);
    if (response.data?.success && response.data?.url) {
        window.location.href = response.data.url;
    } else {
        throw new Error(response.data?.message || 'Failed to create payment session');
    }
}
