import { Snapshoots } from "./PublicTour";

export interface OrderData {
    id: string;
    uuid: string;
    property_id: number;
    agent_id: number;
    property_address: string;
    property_location: string;
    amount: string;
    payment_status: string;
    created_at: string;
    updated_at: string;
    order_status: string;
    split_invoice: boolean;
    paid_amount: string;
    lock_materials: boolean;
    property: {
        id: number;
        uuid: string;
        user_id: number;
        listing_price: string;
        mls_number: string;
        bedrooms: number;
        bathrooms: string;
        square_footage: number;
        lot_size: string;
        year_constructed: number;
        parking_spots: number;
        property_type: string;
        property_status: string;
        heading: string;
        description: string;
        address: string;
        city: string;
        province: string;
        postal_code: string;
        country: string;
        status: boolean;
        tour_activated: boolean;
        publish_date: string;
        property_website: string;
        mls_property: string;
        occupancy: string;
        media_creator_access: string;
        animals_on_property: boolean;
        send_statistics_email: boolean;
        statistics_email_frequency: string;
        created_at: string;
        updated_at: string;
        agent_id: number;
    };
    tours: Array<{
        id: number;
        uuid: string;
        order_id: number;
        slide_show: {
            slide_delay: string;
            transitions: string;
            background_audio: string;
            auto_play: string;
            video_overlay: string;
        };
        is_publish: boolean;
        created_at: string;
        updated_at: string;
        files: Array<{
            id: number;
            uuid: string;
            tour_id: number;
            type: 'photo' | 'video';
            name: string;
            file_path: string;
            group: string;
            service_id: number;
            sort_order: number;
            created_at: string;
            updated_at: string;
            is_featured: boolean;
            is_show: boolean;
            thumbnail_url: string;
            url: string;
            variant_urls?: {
                thumb: string;
                preview: string;
                slider: string;
                popup: string;
                landing: string;
            };
            service: { id: number; uuid: string; name: string; category: { id: number; name: string } };
        }>;
        links: Array<{
            uuid?: string;
            link: string;
            type: 'branded' | 'unbranded';
        }>;
        snapshots: Snapshoots[];
    }>;
    agent: {
        first_name: string;
        last_name: string;
        email: string;
        primary_phone: string;
        company_name: string;
        avatar: string;
        company_logo: string;
        company_banner: string;
        website: string;
        avatar_url: string;
        company_logo_url: string;
        company_banner_url: string;
    };
}

export interface TourStatsPayload {
    type: 'view' | 'media_view';
    visitor_id: string;
    referrer?: string;
    media_uuid?: string;
}

export interface TourStats {
    summary: {
        total_views: number;
        total_visitors: number;
        total_photo_views: number;
        views_per_visitor: number;
    };
    charts: {
        traffic: { date: string; views: number }[];
        referrers: { domain: string; count: number }[];
    };
    media: {
        media_stats: { media_uuid: string; views: number }[];
    }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchPublicTourData = async (orderuuid: string): Promise<OrderData> => {
    try {
        const response = await fetch(`${API_URL}/tour/public/${orderuuid}`);
        if (!response.ok) {
            throw new Error('Failed to fetch order data');
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching public tour data:', error);
        throw error;
    }
};

export const recordTourStat = async (tourUuid: string, payload: TourStatsPayload) => {
    try {
        await fetch(`${API_URL}/tours/${tourUuid}/stats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
    } catch (error) {
        console.error('Error recording tour stat:', error);
        // Fail silently for analytics
    }
};

export const fetchTourStats = async (tourUuid: string, dateRange?: { start_date: string; end_date: string; }, token?: string): Promise<TourStats> => {
    try {
        const queryParams = new URLSearchParams();
        if (dateRange?.start_date) queryParams.append('start_date', dateRange.start_date);
        if (dateRange?.end_date) queryParams.append('end_date', dateRange.end_date);

        const response = await fetch(`${API_URL}/tours/${tourUuid}/stats?${queryParams.toString()}`, {
            headers: token ? {
                'Authorization': `Bearer ${token}`
            } : {}
        });

        if (!response.ok) {
            throw new Error('Failed to fetch tour stats');
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching tour stats:', error);
        throw error;
    }
};