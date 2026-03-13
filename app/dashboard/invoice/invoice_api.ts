import { api } from '@/lib/api';

export async function GetInvoices() {
    const response = await api.get('/invoices');
    return response.data;
}

export async function GetInvoice(uuid: string) {
    const response = await api.get(`/invoices/${uuid}`);
    return response.data;
}

export async function CreateInvoice(orderUuid: string) {
    const response = await api.post('/invoices', {
        order_uuid: orderUuid,
    });
    return response.data;
}

export async function VoidInvoice(uuid: string) {
    const response = await api.post(`/invoices/${uuid}/void`);
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
