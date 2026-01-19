'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link';
import { toast } from 'sonner';
import OrderTable from './components/OrdersTable';
import { Delete, Get } from './orders';
import { Address } from '@/components/VendorTable';
import { useOrderContext } from './context/OrderContext';
import { useWhiteLabel } from '@/app/context/Whitelabel';
import { useAppContext } from '@/app/context/AppContext';
import { useSearchParams } from 'next/navigation';
import { usePermissions } from '@/app/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions';
import QuickViewCard, { VendorData } from '@/components/QuickViewCard';
import { AgentData } from '../agents/page';
export type Order = {
    id: number;
    uuid: string;
    full_name: string;
    email: string;
    property_id: number;
    vendor_id: number;
    agent_id: number;
    amount: string;
    property_address: string;
    property_location: string;
    vendor_address: string;
    vendor_location: string;
    order_status: string;
    split_invoice: boolean;
    payment_status: string;
    created_at: string;
    updated_at: string;
    agent: Agent;
    services: OrderService[];
    logs: {
        id: number;
        action: string;
        model_type: string;
        model_id: string;
        data: {
            before: Partial<Order>;
            after: Partial<Order>;
            diff?: Record<string, unknown>;
        };
        ip_address: string;
        user_agent: string;
        created_at: string;
        updated_at: string;
    }[];
    property: Property;
    slots: Slot[];
    totals: OrderDiscount[];
    notes: {
        note: string;
        name: string;
        date: Date;
    }[];
    co_agents: CoAgent[];
    vendor?: Vendor;
    areas: {
        footage: number;
        type: string;
        id: number;
        uuid: string;

    }[]

};
export type Slot = {
    id: number;
    uuid: string;
    order_id: number;
    service_id: number;
    vendor_id: string;
    vendor: Vendor;
    address: string;
    location: string;
    date: string; // Format: YYYY-MM-DD
    start_time: string; // Format: HH:MM:SS
    end_time: string;   // Format: HH:MM:SS
    est_time: number | null;
    distance: number | null;
    km_price: number | null;
    travel: null;
    recommend_time: number;
    schedule_override: number;
    show_all_vendors: number;
    created_at: string; // ISO 8601 date-time
    updated_at: string;
};
type Agent = {
    uuid: string;
    first_name: string;
    last_name: string;
    role_id: number;
    email: string;
    email_cc: string;
    primary_phone: string;
    secondary_phone?: string;
    company_name: string;
    website: string;
    license_number: string;
    certifications: string[];
    headquarter_address: string;
    notes: string;
    co_agents: CoAgent[];
    requires_payment: boolean;
    status: boolean;
    payment_status: string;
    avatar: string;
    company_logo: string;
    company_banner: string;
    created_at: string;
    updated_at: string;
    avatar_url: string;
    company_logo_url: string;
    company_banner_url: string;
};
export interface OrderDiscount {
    id: number;
    uuid: string;
    order_id: number;
    order_service_id: number;
    discount_id: number;
    discount_type: string; // e.g., "code", "manual", etc.
    discount_value: string; // stored as string (e.g., "58.00")
    amount: string; // amount after applying discount (e.g., "87.00")
    sort_order: number;
    created_at: string | null;
    updated_at: string | null;
}
type CoAgent = {
    name: string;
    email: string;
    primary_phone?: string;
    split?: string;
    percentage?: number;
}

type Vendor = {
    uuid: string;
    first_name: string;
    last_name: string;
    full_name: string;
    company_name: string;
    addresses: Address[];
    email: string;
    secondary_email: string;
    notification_email: boolean;
    email_type: string | null;
    primary_phone: string;
    secondary_phone?: string;
    name_on_booking: boolean;
    review_files: boolean;
    sync_google_calendar: boolean;
    sync_google: boolean;
    avatar_url?: string;
    sync_email: string;
    avatar: string | null;
    status: boolean;
    created_at: string;
    updated_at: string;
    additional_breaks?: {
        address: string
        date: Date
        start_date: Date
        end_date: Date
        end_time: string
        start_time: string
        title: string
        uuid: string
        vendor_id: string
    }[]
};
export type OrderService = {
    id: number;
    order_id: number;
    option_id?: string;
    amount: string;
    custom?: string;
    created_at: string;
    updated_at: string;
    optionName: string;
    service_id: number;
    uuid: string;
    payment_status?: string;
    is_completed?: boolean | number;
    option: {
        id: number;
        uuid: string;
        service_id: number;
        title: string;
        quantity: number;
        amount: string;
        service_duration: string;
        sq_ft_range: string;
        sq_ft_rate: string | null;
        min_price: string | null;
        created_at: string;
        updated_at: string;
    };
    service: {
        id: number;
        uuid: string;
        name: string;
        description: string;
        category_id: number;
        status: boolean;
        thumbnail: string;
        thumbnail_url: string;
        background_color: string;
        border_color: string;
        created_at: string;
        updated_at: string;
    };
};


type Property = {
    id: number;
    uuid: string;
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
    suite: string | null;
    address: string;
    city: string;
    province: string;
    postal_code: string;
    country: string;
    tour_activated: boolean;
    publish_date: string | null;
    property_website: string | null;
    mls_property: string | null;
    occupancy: string;
    media_creator_access: string | null;
    instructions: string | null;
    animals_on_property: boolean;
    co_agents: CoAgent[];
    send_statistics_email: boolean;
    statistics_email_frequency: string | null;
    statistics_email_recipients: string[];
    created_at: string;
    updated_at: string;
    status: boolean;
    agent_id: number;
};


const Page = () => {
    const { userType } = useAppContext()
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const [showCard, setShowCard] = React.useState(false);
    const [type, setType] = React.useState('');
    const [showHeader, setShowHeader] = useState(true)
    const [orderData, setOrderData] = useState<Order[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    const [selectedData, setSelectedData] = useState<VendorData | null>(null);
    const [selectedData1, setSelectedData1] = useState<AgentData | null>(null);
    const [search, setSearch] = useState<string>('');
    const searchParams = useSearchParams();
    const agentIdFromUrl = searchParams.get('agentId'); // Get agentId from query params
    const agentName = searchParams.get('agentName'); // Get agentId from query params
    const { hasPermission } = usePermissions();

    const {
        setSelectedAgentId,
        setSelectedListingId,
        setSelectedServices,
        setAgentNotes,
        setAppliedCodeDiscount,
        setAppliedQuantityDiscounts,
        setTotal,
        setDiscountCode,
        setCoAgents,
        setIsSplitInvoice,
        setSelectedSlots,
        setCustomPrices,
        setCustomServiceNames,
        setSelectedOptions,
        setIsSubmitted,
        setIsLoading
    } = useOrderContext();
    const handleClick = () => {
        setSelectedAgentId(null);
        setSelectedListingId(null);
        setDiscountCode("");
        setSelectedServices([]);
        setAgentNotes([]);
        setCoAgents([]);
        setAppliedCodeDiscount(null);
        setAppliedQuantityDiscounts([]);
        setIsSplitInvoice(false);
        setSelectedSlots([]);
        setCustomPrices({});
        setCustomServiceNames({});
        setSelectedOptions({});
        setTotal(0);
        setShowHeader(false);
        setIsSubmitted(false);
        setIsLoading(false);
    };

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            setLoading(false);
            setError(true);
            return;
        }

        setLoading(true);
        setError(false);


        Get(token)
            .then(data => {
                const sorted = Array.isArray(data.data)
                    ? [...data.data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    : [];
                setOrderData(sorted);
            })
            .catch(err => {
                console.log(err.message)
                setError(true);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleDelete = async (userId: string) => {
        try {
            const token = localStorage.getItem('token') || '';
            await Delete(userId, token);
            toast.success('Order deleted successfully');
            setOrderData(prev => prev.filter(order => order.uuid !== userId));
        } catch (error) {
            if (error instanceof Error) {
                console.error('Delete failed:', error.message);
                toast.error(error.message || 'Failed to delete Order');
            } else {
                console.error('Delete failed:', error);
                toast.error('Failed to delete Order');
            }
        }
    };

    const filteredOrderData = orderData.filter(order => {
        const property_address = order.property_address + ' ' + order.property_location;
        const agentName = order.agent?.first_name + ' ' + order.agent?.last_name;
        const orderId = order.id.toString();
        return property_address.toLowerCase().includes(search.toLowerCase()) ||
            agentName.toLowerCase().includes(search.toLowerCase()) ||
            orderId.includes(search)
    }
    ).filter(order => {
        if (agentIdFromUrl) {
            return order.agent.uuid === agentIdFromUrl;
        } else {
            return true;
        }
    });

    const length = filteredOrderData.length;

    // Check if user can create orders
    const canCreateOrder = userType !== 'vendor' && (userType !== 'admin' || (hasPermission(PERMISSIONS.CREATE_ORDERS) || hasPermission(PERMISSIONS.BOOK_APPOINTMENTS)));


    return (
        <div>

            <div className='w-full h-[80px] font-alexandria z-10 relative flex justify-between px-[20px] items-center' style={{ backgroundColor: roleSettings.pageBg, boxShadow: "0px 4px 4px #0000001F" }} >
                <p className='text-[16px] md:text-[24px] font-[400]' style={{ color: roleSettings.pageTabColor }}>{agentName} {agentName && '›'} Orders ({length})</p>

                <div className='flex justify-end items-center gap-2'>
                    <div className='w-[300px]'>
                        <input
                            type="text"
                            placeholder="Search address..."
                            value={search || ''}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0"
                        />
                    </div>

                    {canCreateOrder &&
                        <Link
                            href={'/dashboard/orders/create'}
                            onClick={handleClick}
                            className='w-[110px] md:w-[143px] h-[35px] md:h-[44px] justify-center rounded-[6px] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:brightness-110'
                            style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
                        >
                            + New Order
                        </Link>}

                </div>    </div>

            <div className="w-full">
                <OrderTable
                    OrderData={filteredOrderData}
                    showHeader={showHeader}
                    setShowHeader={setShowHeader}
                    onQuickView={(selectedType, data) => {
                        setShowCard(true);
                        setType(selectedType);
                        setSelectedData(data);
                    }}
                    onQuickView1={(selectedType, data) => {
                        setShowCard(true);
                        setType(selectedType);
                        setSelectedData1(data);
                    }}
                    onDelete={handleDelete}
                    loading={loading}
                    error={error}
                />
                {(type === "agent") && showCard && selectedData1 && (
                    <QuickViewCard
                        type="agent"
                        data={selectedData1}
                        onClose={() => setShowCard(false)}
                    />
                )}
                {(type === "vendor") && showCard && selectedData && (
                    <QuickViewCard
                        type="vendors"
                        data={selectedData}
                        onClose={() => setShowCard(false)}
                    />
                )}

            </div>
        </div >
    )
}

export default Page