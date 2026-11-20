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

export async function DeleteInvoice(uuid: string, removeService: boolean = false) {
    const url = removeService ? `/invoices/${uuid}?remove_service=true` : `/invoices/${uuid}`;
    const response = await api.delete(url);
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

export async function RefundInvoice(
    uuid: string, 
    amount: string | number, 
    notes?: string, 
    revokeMediaAccess: boolean = true
) {
    const response = await api.post(`/invoices/${uuid}/refund`, {
        amount,
        notes,
        revoke_media_access: revokeMediaAccess
    });
    return response.data;
}

export async function GetInvoicesByOrder(orderUuid: string, retries: number = 2) {
    if (!orderUuid || orderUuid === "undefined" || orderUuid === "null") {
        return { success: true, data: [] };
    }
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await api.get(`/invoices?order_uuid=${orderUuid}`);
            return response.data;
        } catch (error: any) {
            // If it's a 401 unauthorized or last attempt, throw/return error
            if (error.response?.status === 401 || attempt === retries) {
                throw error;
            }
            // Transient 5xx error or network glitch: backoff and retry
            await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
        }
    }
    return { success: true, data: [] };
}

export async function PayInvoiceWithStripe(
    invoice: any, 
    order: any, 
    redirectUrl: string, 
    serviceId?: string,
    paymentMode?: 'on_behalf' | 'self',
    payerUuid?: string
) {
    const total = Number(invoice.total) || 0;
    const paidAmount = Number(invoice.paid_amount) || 0;
    const refundedAmount = Number(invoice.refunded_amount) || 0;
    const netPaid = Math.max(0, paidAmount - refundedAmount);
    const remainingBalance = Math.max(0, Math.round((total - netPaid) * 100) / 100);

    if (['paid', 'refunded', 'partially_refunded', 'partial_refunded'].includes(invoice.status?.toLowerCase()) || (total > 0 && remainingBalance <= 0)) {
        throw new Error('This invoice cannot be paid.');
    }

    const amountToPay = (netPaid > 0 && remainingBalance > 0) ? remainingBalance : (remainingBalance > 0 ? remainingBalance : total);

    const body: any = {
        agent_uuid: invoice.agent?.uuid || order.agent?.uuid || order.agent_uuid, // allow fallback
        url: redirectUrl,
        amount: amountToPay,
        currency: (invoice.currency || 'cad').toLowerCase(),
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

export async function DownloadInvoice(uuid: string | number, invoiceNumber?: string | number) {
    if (!uuid) throw new Error("Invoice UUID is required");
    const response = await api.get(`/invoices/${uuid}/pdf`, {
        responseType: 'blob',
    });
    if (response.data && response.data.type === 'application/json') {
        const text = await response.data.text();
        try {
            const json = JSON.parse(text);
            throw new Error(json.message || "Failed to generate invoice PDF");
        } catch (e: any) {
            throw new Error(e.message || "Failed to generate invoice PDF");
        }
    }
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanNumber = invoiceNumber ? String(invoiceNumber).replace(/[^A-Za-z0-9_\-]/g, '_') : uuid;
    link.download = `Invoice_${cleanNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

