export type Admin = {
    uuid?: string;
    full_name: string;
    email: string;
    created_at: string;
    status?: boolean;
    permissions?: { id: number, name: string }[]
    roles?: { id: number, name: string }[],
    address?: string
    primary_phone?: string;
    secondary_phone?: string;
    avatar_url?: string;
    first_name?: string;
    organization_id?: number | string | null;
};

export type Agent = {
    uuid?: string;
    first_name: string;
    last_name: string;
    payment_status: string;
    email: string;
    created_at: string;
    status?: boolean;
    permissions?: { id: number, name: string }[]
    roles?: { id: number, name: string }[],
    headquarter_address?: string
    primary_phone?: string;
    secondary_phone?: string;
    avatar_url?: string;
    company_name: string;
    notes: string;
    activity?: string;
    co_agents?: {
        name: string;
        email: string;
        primary_phone?: string;
        split?: string;
    }[];
};

export type Vendor = {
    uuid?: string;
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    status?: boolean;
    vendor_services: VendorService[];
    company?: { uuid: string, company_name: string }
    address?: string
    primary_phone?: string;
    secondary_phone?: string;
    company_name: string;
    avatar_url?: string;
    addresses: Address[];
    settings: { payment_per_km: string }
};

export interface Company {
    id: number;
    uuid: string;
    vendor_id: number;
    company_name: string;
    company_website: string;
    company_logo: string;
    company_banner: string;
    created_at: string;
    updated_at: string;
}

export interface Address {
    id: number;
    uuid: string;
    vendor_id: number;
    type: string;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    province: string;
    country: string;
    created_at: string;
    updated_at: string;
}

export interface WorkHours {
    id: number;
    uuid: string;
    vendor_id: number;
    start_time: string;
    end_time: string;
    work_days: string; // JSON string like '["mon","tue","wed"]'
    repeat_weekly: string;
    break_start: string | null;
    break_end: string | null;
    commute_minutes: number;
    timezone: string;
    created_at: string;
    updated_at: string;
}

export interface VendorSettings {
    id: number;
    uuid: string;
    vendor_id: number;
    payment_per_km: string;
    enable_service_area: boolean;
    force_service_area: boolean;
    created_at: string;
    updated_at: string;
}

export interface VendorService {
    id: number;
    uuid: string;
    vendor_id: number;
    service_id: number;
    hourly_rate: string;
    time_needed: number;
    status: boolean;
    created_at: string;
    updated_at: string;
    service: Service;
}

export interface Service {
    id: number;
    uuid: string;
    name: string;
    category_id: number;
    thumbnail: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
    status: boolean;
    background_color: string | null;
    border_color: string | null;
    thumbnail_url: string | null;
}

export interface Slot {
    id: number;
    uuid: string;
    order_id: number;
    service_id: number;
    vendor_id: number;
    start_time: string;
    end_time: string;
    date: string;
    show_all_vendors?: boolean;
    schedule_override?: boolean;
    recommend_time?: boolean;
    travel?: string;
    created_at?: string;
    updated_at?: string;
    est_time?: string;
    distance?: string;
    km_price?: string;
    address?: string;
    location?: string;
}

export interface NotificationData {
    id?: number;
    uuid?: string;
    type: string;
    source?: string;
    source_id?: string;
    created_by_name: string;
    Subject: string;
    description?: string;
    created_at: string;
    updated_at?: string;
    is_read?: boolean;
    read_at?: string;
    diff_data?: {
        amount?: {
            before: string | number;
            after: string | number;
        };
        updated_at?: {
            before: string;
            after: string;
        };
        slots?: Record<
            string,
            {
                before: Slot | null;
                after: Slot | null;
            }
        >;
        payment_details?: {
            before: null | Record<string, unknown>;
            after: {
                // For VendorPayment
                vendor_name?: string;
                // For AgentPayment
                agent_name?: string;
                order_uuid?: string;
                amount: string | number;
                currency: string;
                transfer_id?: string;
                payment_type: string;
                service_count?: number;
                payment_method?: string;
                status: string;
                timestamp: string;
                receipt_url?: string;
            };
        };
        metadata?: Record<string, unknown>;
    };
    meta_data?: {
        // Common fields
        order_id?: number;
        order_uuid?: string;
        changes_summary?: string[];
        details?: string;
        updated_by?: string;
        broadcast_to_all_admins?: boolean;
        // VendorPayment specific
        vendor_id?: number;
        vendor_uuid?: string;
        vendor_payment_id?: number;
        vendor_payment_uuid?: string;
        vendor_name?: string;
        vendor_email?: string;
        transfer_id?: string;
        service_count?: number;
        is_bulk?: boolean;
        // AgentPayment specific
        agent_payment_id?: number;
        agent_payment_uuid?: string;
        agent_uuid?: string;
        agent_name?: string;
        agent_email?: string;
        payment_method?: string;
        is_quickbooks_synced?: boolean;
        quickbooks_invoice_id?: string | null;
        // Shared payment fields
        amount?: string | number;
        currency?: string;
        payment_type?: string;
        timestamp?: string;
        // Property and Services
        property_address?: string;
        services?: Array<{
            uuid?: string;
            service_id?: number | string;
            service_name?: string;
            amount?: string | number;
        }>;
    };
    order: {
        id: string | number;
        created_at: string;
        agent: {
            first_name: string;
            last_name: string;
            email: string;
            primary_phone: string;
            secondary_phone: string;
            company_name: string;
        };
        property_address: string;
        property_location: string;
        services: Array<{
            service_id: string | number;
            service: {
                name: string;
            };
            option?: {
                title: string;
            };
            amount: string | number;
        }>;
        slots: Array<{
            service_id: string | number;
            vendor: {
                first_name: string;
                last_name: string;
            };
            date: string;
            start_time: string;
            end_time: string;
        }>;
    };
}

export interface Option {
    quantity: number;
}

export interface OrderService {
    id: number;
    uuid: string;
    amount: string;
    created_at: string;
    updated_at: string;
    custom: string;
    option_id: number;
    order_id: number;
    service_id: number;
    service: Service;
    option: Option;
}

export interface ListingOrder {
    id: number;
    uuid: string;
    amount: string;
    paid_amount: string | number;
    distance: string;
    km_price: string;
    est_time: string;
    order_status:
    | "Processing"
    | "In Progress"
    | "Pending"
    | "Completed"
    | "Cancelled"
    | "On Hold";
    payment_status: "PAID" | "UNPAID" | "PARTIALLY_PAID";
    property_address: string;
    property_location: string;
    vendor_address: string;
    vendor_location: string;
    created_at: string;
    updated_at: string;
    services: OrderService[];
    lock_materials: boolean;
    tours?: {
        files?: {
            is_featured?: boolean;
            file_path?: string;
            thumbnail_url?: string;
        }[];
    }[];
}

export interface Listings {
    uuid: string;
    id?: number;
    payment_status: string;
    full_name?: string;
    company?: string;
    address: string;
    listing_price: number;
    bedrooms: number;
    bathrooms: number;
    square_footage: number;
    year_constructed: number;
    parking_spots: string;
    property_type: string;
    lot_size: string;
    agent: Agent;
    property_status: string;
    stats: {
        photos: number;
        tours: number;
        visitors: number;
        imageViews: number;
    };
    activity?: string;
    postal_code?: string;
    province?: string;
    city?: string;
    country?: string;
    created_at?: string | Date;
    status?: boolean;
    orders?: ListingOrder[];
    tour_activated?: boolean;
    suite?: string;
}

export interface TourFile {
    id: number;
    uuid: string;
    tour_id: number;
    type: string;
    name: string;
    file_path: string;
    is_featured: boolean;
    is_admin_approved: boolean;
    is_agent_approved: boolean;
    is_show: boolean;
    thumbnail_url?: string;
}

export interface Tour {
    id: number;
    uuid: string;
    order_id: number;
    is_publish: boolean;
    files: TourFile[];
    created_at: string;
    orders: {
        id: number;
        uuid: string;
        property_address: string;
        property_location: string;
        property: {
            address: string;
            city: string;
            province: string;
            property_status: string;
            tour_activated: boolean;
            mls_number?: string;
            suite?: string | null;
        };
    };
}
