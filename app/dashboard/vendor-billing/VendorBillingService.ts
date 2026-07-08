import { api } from "@/lib/api";

export interface UninvoicedVendor {
    id: number;
    uuid: string;
    company_name: string;
    first_name: string;
    last_name: string;
    uninvoiced_services_count: number;
}

export interface PendingItem {
    service: {
        uuid: string;
        amount: number | string;
        service: {
            name: string;
        };
        order: {
            id: number;
            property: {
                property_address: string;
            };
        };
    };
    travel_cost: number;
    slot: {
        distance: number;
        km_price: number;
    } | null;
}

export interface PendingResponse {
    vendor: {
        uuid: string;
        company_name: string;
        first_name: string;
        last_name: string;
    };
    items: PendingItem[];
    total_services: number;
    total_travel: number;
}

export interface VendorInvoice {
    id?: number;
    uuid: string;
    invoice_number: string;
    status: 'draft' | 'pending_payment' | 'paid' | 'cancelled';
    total_amount: string | number;
    subtotal: string | number;
    travel_amount: string | number;
    tax_rate?: string | number;
    tax_amount?: string | number;
    total?: string | number;
    cycle_start?: string;
    cycle_end?: string;
    created_at: string;
    notes?: string;
    vendor?: {
        company_name: string;
        first_name: string;
        last_name: string;
        email?: string;
    };
    lines?: VendorInvoiceLine[];
}

export interface VendorInvoiceLine {
    description: string;
    amount: string | number;
    unit_price?: string | number;
    quantity?: string | number;
    type: 'service' | 'travel';
    order_service_id?: string | number | null;
}

export interface GenerateInvoicePayload {
    vendor_uuid: string;
    order_service_uuids: string[];
    cycle_start?: string;
    cycle_end?: string;
    notes?: string;
    tax_rate?: number | string;
    travel_amount?: number;
    lines?: VendorInvoiceLine[];
}

class VendorBillingService {
    private getHeaders(token: string) {
        return {
            Authorization: `Bearer ${token}`,
        };
    }

    // Admin Endpoints
    async getUninvoicedVendors(token: string): Promise<UninvoicedVendor[]> {
        const response = await api.get('/vendor-billing/uninvoiced', {
            headers: this.getHeaders(token),
        });
        return response.data.data;
    }

    async getPendingItems(vendorUuid: string, token: string, filters?: { start_date?: string; end_date?: string }): Promise<PendingResponse> {
        const response = await api.get(`/vendor-billing/pending/${vendorUuid}`, {
            headers: this.getHeaders(token),
            params: filters,
        });
        return response.data.data;
    }

    async generateInvoice(payload: GenerateInvoicePayload, token: string): Promise<VendorInvoice> {
        const response = await api.post('/vendor-billing/generate', payload, {
            headers: this.getHeaders(token),
        });
        return response.data.data;
    }

    async payInvoice(uuid: string, token: string): Promise<any> {
        const response = await api.post(`/vendor-billing/pay/${uuid}`, {}, {
            headers: this.getHeaders(token),
        });
        return response.data;
    }

    // Vendor Endpoints (Note: different prefix in routes/api.php)
    async getMyInvoices(token: string): Promise<VendorInvoice[]> {
        const response = await api.get('/vendor/invoices', {
            headers: this.getHeaders(token),
        });
        return response.data.data;
    }

    async getInvoiceDetails(uuid: string, token: string): Promise<VendorInvoice> {
        const response = await api.get(`/vendor/invoices/${uuid}`, {
            headers: this.getHeaders(token),
        });
        return response.data.data;
    }
    
    async getAdminInvoices(token: string): Promise<VendorInvoice[]> {
        const response = await api.get('/vendor-billing/invoices', {
            headers: this.getHeaders(token),
        });
        return response.data.data;
    }

    async getAdminInvoiceDetails(uuid: string, token: string): Promise<VendorInvoice> {
        const response = await api.get(`/vendor-billing/invoices/${uuid}`, {
            headers: this.getHeaders(token),
        });
        return response.data.data;
    }

    async getVendorInvoices(vendorUuid: string, token: string): Promise<VendorInvoice[]> {
        const response = await api.get('/vendor-billing/invoices', {
            headers: this.getHeaders(token),
            params: { vendor_uuid: vendorUuid, limit: 100 },
        });
        const raw = response.data.data;
        return Array.isArray(raw) ? raw : (raw?.data ?? []);
    }

    async updateInvoice(uuid: string, data: Partial<VendorInvoice>, token: string): Promise<VendorInvoice> {
        const response = await api.patch(`/vendor-billing/update/${uuid}`, data, {
            headers: this.getHeaders(token),
        });
        return response.data.data;
    }

    async createManualInvoice(data: any, token: string): Promise<VendorInvoice> {
        const response = await api.post('/vendor-billing/store', data, {
            headers: this.getHeaders(token),
        });
        return response.data.data;
    }
}

export const vendorBillingService = new VendorBillingService();
