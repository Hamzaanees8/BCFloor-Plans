import { api } from "@/lib/api";

export interface UninvoicedVendor {
    id: number;
    uuid: string;
    company_name: string;
    first_name: string;
    last_name: string;
    uninvoiced_services_count: number;
}

export interface VendorBillingSummary {
    total_outstanding: number;
    approved_payouts: number;
    paid_this_month: number;
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
                sq_ft?: number | string;
            };
        };
    };
    vendor_pay_amount?: number;
    pay_type?: string;
    sq_ft_rate?: number;
    min_price?: number;
    property_sq_ft?: number;
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
    vendor_id?: string | number;
    organization_id?: number | string;
    organization?: {
        id: number;
        name: string;
        slug?: string;
        contact_email?: string;
        from_email?: string;
        phone?: string;
        address?: string;
    };
    status: 'draft' | 'pending_payment' | 'paid' | 'cancelled';
    total_amount: string | number;
    subtotal: string | number;
    travel_amount: string | number;
    tax_rate?: string | number;
    tax_type?: string;
    tax_number?: string;
    tax_amount?: string | number;
    tax_details?: any;
    total?: string | number;
    cycle_start?: string;
    cycle_end?: string;
    paid_at?: string;
    updated_at?: string;
    created_at: string;
    notes?: string;
    vendor_details?: {
        first_name?: string;
        last_name?: string;
        name?: string;
        company_name?: string;
        email?: string;
        phone?: string;
        address?: string;
        tax_number?: string;
        tax_type?: string;
        tax_rate?: number | string;
        [key: string]: any;
    };
    org_details?: {
        id?: number | string;
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
        [key: string]: any;
    };
    vendor?: {
        id?: number;
        uuid?: string;
        organization_id?: number | string;
        organization?: {
            id: number;
            name: string;
            slug?: string;
        };
        company_name?: string;
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        tax_number?: string;
        company?: {
            name?: string;
        };
        settings?: any;
        addresses?: any[];
    };
    lines?: VendorInvoiceLine[];
}

export interface VendorInvoiceLine {
    id?: number;
    uuid?: string;
    description: string;
    amount: string | number;
    unit_price?: string | number;
    quantity?: string | number;
    type: 'service' | 'travel' | 'adjustment';
    is_taxable?: boolean;
    order_service_id?: string | number | null;
}

export interface GenerateInvoicePayload {
    vendor_uuid: string;
    order_service_uuids: string[];
    cycle_start?: string;
    cycle_end?: string;
    notes?: string;
    tax_rate?: number | string;
    tax_type?: string;
    tax_number?: string;
    travel_amount?: number;
    vendor_details?: any;
    org_details?: any;
    tax_details?: any;
    lines?: VendorInvoiceLine[];
}

class VendorBillingService {
    private getHeaders(token: string) {
        return {
            Authorization: `Bearer ${token}`,
        };
    }

    // Admin Endpoints
    async getSummaryMetrics(token: string, organizationId?: string, filters?: { start_date?: string; end_date?: string }): Promise<VendorBillingSummary> {
        const params: any = {};
        if (organizationId && organizationId !== 'all') params.organization_id = organizationId;
        if (filters?.start_date) params.start_date = filters.start_date;
        if (filters?.end_date) params.end_date = filters.end_date;

        const response = await api.get('/vendor-billing/summary', {
            headers: this.getHeaders(token),
            params,
        });
        return response.data.data;
    }

    async getUninvoicedVendors(token: string, organizationId?: string, filters?: { start_date?: string; end_date?: string }): Promise<UninvoicedVendor[]> {
        const params: any = {};
        if (organizationId && organizationId !== 'all') params.organization_id = organizationId;
        if (filters?.start_date) params.start_date = filters.start_date;
        if (filters?.end_date) params.end_date = filters.end_date;

        const response = await api.get('/vendor-billing/uninvoiced', {
            headers: this.getHeaders(token),
            params,
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

    async updateInvoiceStatus(
        uuid: string,
        data: {
            status: string;
            paid_at?: string;
            payment_method?: string;
            transaction_reference?: string;
            notes?: string;
        },
        token: string
    ): Promise<VendorInvoice> {
        const response = await api.patch(`/vendor-billing/invoices/${uuid}/status`, data, {
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
    
    async getAdminInvoices(token: string, organizationId?: string, filters?: { start_date?: string; end_date?: string; status?: string; limit?: number }): Promise<VendorInvoice[]> {
        const params: any = { limit: filters?.limit || 100 };
        if (organizationId && organizationId !== 'all') params.organization_id = organizationId;
        if (filters?.start_date) params.start_date = filters.start_date;
        if (filters?.end_date) params.end_date = filters.end_date;
        if (filters?.status) params.status = filters.status;

        const response = await api.get('/vendor-billing/invoices', {
            headers: this.getHeaders(token),
            params,
        });
        const raw = response.data.data;
        return Array.isArray(raw) ? raw : (raw?.data ?? []);
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

    async updateInvoice(uuid: string, data: Partial<VendorInvoice> & { lines?: any[]; vendor_details?: any; org_details?: any; tax_details?: any; }, token: string): Promise<VendorInvoice> {
        const response = await api.patch(`/vendor-billing/update/${uuid}`, data, {
            headers: this.getHeaders(token),
        });
        return response.data.data;
    }

    async deleteInvoice(uuid: string, token: string): Promise<any> {
        const response = await api.delete(`/vendor-billing/invoices/${uuid}`, {
            headers: this.getHeaders(token),
        });
        return response.data;
    }

    async createManualInvoice(data: any, token: string): Promise<VendorInvoice> {
        const response = await api.post('/vendor-billing/store', data, {
            headers: this.getHeaders(token),
        });
        return response.data.data;
    }
}

export const vendorBillingService = new VendorBillingService();
