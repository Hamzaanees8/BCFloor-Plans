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
            service: { id: number; uuid: string; name: string; category: { id: number; name: string } };
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

export const fetchPublicTourData = async (orderuuid: string): Promise<OrderData> => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
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