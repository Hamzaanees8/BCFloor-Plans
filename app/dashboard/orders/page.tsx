'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link';
import { toast } from 'sonner';
import { Delete, Get, CancelOrder, PreviewCancelOrder, EditOrderStatus } from './orders';
import { isPastBooking } from '@/lib/bookingUtils';
import { Address } from '@/lib/types';
import { useOrderContext } from './context/OrderContext';
import { useWhiteLabel } from '@/app/context/Whitelabel';
import { useAppContext } from '@/app/context/AppContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePermissions } from '@/app/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions';
import QuickViewCard from '@/components/QuickViewCard';
import { AgentData } from '../agents/page';
import { Snapshoots } from '@/app/tour/PublicTour';
import { DataTable } from '@/components/DataTable';
import { ColumnDef, Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import DropdownActions from "@/components/DropdownActions";
import { useIsMobile } from '@/hooks/use-mobile';
import MobileAgentOrders from '@/components/mobile/agent/MobileAgentOrders';
import MobileOrdersList from '@/components/mobile/admin/MobileOrdersList';
import CancelOrderDialog from './components/CancelOrderDialog';

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
    paid_amount: string;
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
        date: string;
        internal?: string;
    }[];
    co_agents: CoAgent[];
    vendor?: Vendor;
    areas: {
        footage: number;
        type: string;
        id: number;
        uuid: string;

    }[];
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
            is_show: boolean;
            service: { id: number; uuid: string; name: string; category: { id: number; name: string } };
        }>;
        snapshots: Snapshoots[];
    }>;

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
    custom_duration?: number | null;
    custom_end_time?: string | null;
    buffer_minutes?: number | null;
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
    logo_url?: string;
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
    optionName?: string;
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
        is_travel_required?: boolean | number;
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
    const headerBg = `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`;
    const isMobile = useIsMobile();

    // Router for navigation
    const router = useRouter();

    const [showCard, setShowCard] = React.useState(false);
    const [type, setType] = React.useState('');
    const [orderData, setOrderData] = useState<Order[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isCancelLoading, setIsCancelLoading] = useState(false);
    const [cancelPreviewData, setCancelPreviewData] = useState<any | null>(null);

    // const [selectedData, setSelectedData] = useState<VendorData | null>(null); // Unused
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

    // Mobile views for orders
    if (isMobile) {
        if (userType === 'agent') return <MobileAgentOrders />;
        return <MobileOrdersList />;
    }

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

    const canShowCancel = (order: Order): boolean => {
        if (order.order_status === 'Cancelled') return false;
        if (userType === 'admin') return true;
        if (userType === 'agent') return !isPastBooking(order);
        return false;
    };

    const handleCancelFromList = async () => {
        if (!orderToCancel) return;
        const token = localStorage.getItem('token') || '';
        const statusUpper = (orderToCancel.payment_status || "").toUpperCase().trim();
        const paidAmt = parseFloat(String(orderToCancel.paid_amount || "0"));
        if (
            statusUpper === "PAID" ||
            statusUpper === "PARTIALLY_PAID" ||
            statusUpper === "PARTIAL" ||
            statusUpper === "PARTIALLY PAID" ||
            (!isNaN(paidAmt) && paidAmt > 0)
        ) {
            toast.error("You cannot cancel a paid order. You can only refund the order.");
            return;
        }
        setIsCancelLoading(true);
        try {
            await CancelOrder(orderToCancel.uuid, token);
            toast.success('Order cancelled successfully');
            setShowCancelDialog(false);
            setOrderToCancel(null);
            setOrderData(prev =>
                prev.map(o =>
                    o.uuid === orderToCancel.uuid
                        ? { ...o, order_status: 'Cancelled' }
                        : o
                )
            );
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to cancel order');
        } finally {
            setIsCancelLoading(false);
        }
    };

    const handleQuickStatusChange = async (orderUuid: string, newStatus: string) => {
        const token = localStorage.getItem("token") || "";
        try {
            await EditOrderStatus(orderUuid, { order_status: newStatus }, token);
            setOrderData(prev => prev.map(o => o.uuid === orderUuid ? { ...o, order_status: newStatus } : o));
            toast.success(`Order status updated to "${newStatus}"`);
        } catch (err: any) {
            console.error("Failed to update status:", err);
            toast.error(err?.message || "Failed to update order status");
        }
    };

    const columns: ColumnDef<Order>[] = [
        {
            accessorKey: "id",
            header: ({ column }) => {
                const isSorted = column.getIsSorted();

                return (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            if (isSorted === "asc") {
                                column.toggleSorting(true); // Set to desc
                            } else if (isSorted === "desc") {
                                column.clearSorting(); // Clear sorting
                            } else {
                                column.toggleSorting(false); // Set to asc
                            }
                        }}
                        className="p-0 hover:bg-transparent flex items-center gap-1 font-bold"
                    >
                        ORDER ID
                        {isSorted === "asc" && <span><ChevronUp style={{ color: roleSettings.pageTabColor }} strokeWidth={3} /></span>}
                        {isSorted === "desc" && <span><ChevronDown style={{ color: roleSettings.pageTabColor }} strokeWidth={3} /></span>}
                        {!isSorted && <span className="text-gray-400"><ChevronsUpDown className="text-gray-400" strokeWidth={3} /></span>}
                    </Button>
                )
            },
            cell: ({ row }: { row: Row<Order> }) => {
                const id = row.original.id;

                return (
                    <div
                        className={`cursor-pointer ml-[5px]`}
                        style={{ color: roleSettings.pageTabColor }}
                        onClick={() => {
                            const canView = userType !== "admin" || (hasPermission(PERMISSIONS.VIEW_APPOINTMENTS));

                            if (!canView) {
                                toast.error("You do not have permission to view orders");
                                return;
                            }

                            const uuid = row.original.uuid;
                            if (uuid) router.push(`/dashboard/orders/${uuid}`);
                        }}

                    >
                        {id}
                    </div>
                );
            },
        },
        {
            accessorKey: "property_address",
            header: "ADDRESS",
            cell: ({ row }: { row: Row<Order> }) => {
                const address = row.original.property_address;
                const location = row.original.property_location;
                const suite = row.original.property?.suite;

                return (
                    <div className="truncate" style={{ color: roleSettings.pageText }}>
                        {suite ? `${suite} - ${address}, ${location}` : `${address}, ${location}`}
                    </div>
                );
            },
        },
        {
            accessorKey: "agent",
            header: "AGENT",
            cell: ({ row }: { row: Row<Order> }) => {
                const agent = row.original.agent;
                const first_name = agent?.first_name ?? "";
                const last_name = agent?.last_name ?? "";
                return (
                    <div onClick={() => {
                        setShowCard(true);
                        setType("agent");
                        setSelectedData1(agent as unknown as AgentData); // Type assertion if needed or ensure compatibility
                    }}
                        className={`cursor-pointer`}
                        style={{ color: roleSettings.pageTabColor }}
                    >{first_name} {last_name}</div>
                );
            },
        },
        {
            accessorKey: "amount",
            header: "TOTAL",
            cell: ({ row }: { row: Row<Order> }) => {
                const total = row.original.amount;
                return (
                    <div style={{ color: roleSettings.pageText }}>
                        ${parseFloat(total).toFixed(2)}
                    </div>
                );
            },
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => {
                const isSorted = column.getIsSorted();

                return (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            if (isSorted === "asc") {
                                column.toggleSorting(true); // Set to desc
                            } else if (isSorted === "desc") {
                                column.clearSorting(); // Clear sorting
                            } else {
                                column.toggleSorting(false); // Set to asc
                            }
                        }}
                        className="p-0 hover:bg-transparent flex items-center gap-1 font-bold"
                    >
                        ADDED
                        {isSorted === "asc" && <span><ChevronUp style={{ color: roleSettings.pageTabColor }} strokeWidth={3} /></span>}
                        {isSorted === "desc" && <span><ChevronDown style={{ color: roleSettings.pageTabColor }} strokeWidth={3} /></span>}
                        {!isSorted && <span className="text-gray-400"><ChevronsUpDown className="text-gray-400" strokeWidth={3} /></span>}
                    </Button>
                )
            },
            cell: ({ row }: { row: Row<Order> }) => {
                const date = new Date(row.getValue("created_at")).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                });
                return <div style={{ color: roleSettings.pageText }}>{date}</div>;
            },
            enableSorting: true,
        },
        {
            accessorKey: "order_status",
            header: "ORDER STATUS",
            cell: ({ row }: { row: Row<Order> }) => {
                const status = row.original.order_status || "Processing";
                const uuid = row.original.uuid;
                const canEdit = userType === "admin" || (hasPermission(PERMISSIONS.EDIT_ORDERS));

                const getStatusBadgeStyle = (s: string) => {
                    switch (s?.toLowerCase()) {
                        case "completed":
                            return "bg-emerald-600 text-white border-emerald-600";
                        case "processing":
                            return "bg-blue-500 text-white border-blue-500";
                        case "in progress":
                            return "bg-indigo-600 text-white border-indigo-600";
                        case "pending":
                            return "bg-amber-500 text-white border-amber-500";
                        case "on hold":
                            return "bg-gray-500 text-white border-gray-500";
                        case "cancelled":
                            return "bg-rose-500 text-white border-rose-500";
                        default:
                            return "bg-gray-400 text-white border-gray-400";
                    }
                };

                if (!canEdit) {
                    return (
                        <div
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold w-fit ${getStatusBadgeStyle(status)}`}
                        >
                            {status}
                        </div>
                    );
                }

                return (
                    <select
                        value={status}
                        onChange={(e) => handleQuickStatusChange(uuid, e.target.value)}
                        className={`text-[10px] font-semibold rounded-full px-2.5 py-0.5 cursor-pointer outline-none border transition-colors ${getStatusBadgeStyle(status)}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="Processing" className="bg-white text-gray-800">Processing</option>
                        <option value="In Progress" className="bg-white text-gray-800">In Progress</option>
                        <option value="Pending" className="bg-white text-gray-800">Pending</option>
                        <option value="Completed" className="bg-white text-gray-800">Completed</option>
                        <option value="On Hold" className="bg-white text-gray-800">On Hold</option>
                        <option value="Cancelled" className="bg-white text-gray-800">Cancelled</option>
                    </select>
                );
            },
        },
        {
            accessorKey: "payment_status",
            header: "PAYMENT",
            cell: ({ row }: { row: Row<Order> }) => {
                const status = row.original.payment_status;
                const bgColor = status === "PAID" ? "#6BAE41" : "#E06D5E";

                return (
                    <div
                        className="text-white px-2.5 py-0.5 rounded-full text-[10px] font-medium w-fit"
                        style={{ backgroundColor: bgColor }}
                    >
                        {status}
                    </div>
                );
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }: { row: Row<Order> }) => {
                const canEdit = userType === "agent" || (hasPermission(PERMISSIONS.EDIT_APPOINTMENTS) || hasPermission(PERMISSIONS.EDIT_ORDERS));

                const options = [
                    ...(canEdit ? [{
                        label: "Edit",
                        onClick: () => {
                            setIsSubmitted(false);
                            const uuid = row.original.uuid;
                            if (uuid) {
                                router.push(`/dashboard/orders/create/${uuid}?isEdit=true`);
                            }
                        },
                    }] : []),
                    {
                        label: "Quick View",
                        onClick: () => {
                            const canView = userType !== "admin" || (hasPermission(PERMISSIONS.VIEW_APPOINTMENTS));

                            if (!canView) {
                                toast.error("You do not have permission to view orders");
                                return;
                            }
                            const uuid = row.original.uuid;
                            if (uuid) {
                                router.push(`/dashboard/orders/${uuid}`);
                            }
                        },
                    },
                    ...(canShowCancel(row.original) ? [{
                        label: "Cancel",
                        onClick: async () => {
                            const order = row.original;
                            const token = localStorage.getItem('token') || '';
                            setOrderToCancel(order);
                            setIsCancelLoading(true);
                            try {
                                const res = await PreviewCancelOrder(order.uuid, token);
                                setCancelPreviewData(res.data);
                            } catch {
                                setCancelPreviewData({
                                    order_uuid: order.uuid,
                                    can_cancel: true,
                                    is_free: false,
                                    cancellation_fee: 0,
                                    total_paid: parseFloat(order.paid_amount || "0"),
                                    expected_refund: 0,
                                    threshold_hours: 0,
                                    fee_percentage: 0,
                                    booking_datetime: order.slots?.[0]?.date || new Date().toISOString(),
                                    deadline: "",
                                    timezone: "",
                                    message: "Cancellation for past booking",
                                });
                            } finally {
                                setIsCancelLoading(false);
                                setShowCancelDialog(true);
                            }
                        },
                    }] : []),
                    {
                        label: "Delete",
                        onClick: () => handleDelete(row.original.uuid ?? ""),
                        confirm1: true,
                    }
                ];

                return (
                    userType !== "vendor" && (
                        <DropdownActions
                            options={options}
                        />)
                );
            },
        }
    ];

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

    // Check if user has permission to create order
    // Admin can create if they have CREATE_ORDERS or BOOK_APPOINTMENTS
    const canCreateOrder = userType !== 'vendor' && (
        userType !== 'admin' ||
        (hasPermission(PERMISSIONS.BOOK_APPOINTMENTS))
    );


    return (
        <div style={{ backgroundColor: roleSettings.pageBg, minHeight: '100vh', color: roleSettings.pageText }}>
            <div className='w-full h-[80px] font-alexandria z-10 sticky top-0 flex justify-between px-[20px] items-center' style={{ backgroundColor: headerBg, boxShadow: "0px 4px 4px #0000001F" }} >
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
                <DataTable
                    data={filteredOrderData}
                    columns={columns}
                    loading={loading}
                    error={error}
                    dataName="Orders"
                    userType={userType}
                    headerBgOverride={headerBg}
                    rowClick={() => {
                        // Optional: Add row click handler if needed, currently Actions handle navigation
                    }}
                />

                {(type === "agent") && showCard && selectedData1 && (
                    <QuickViewCard
                        type="agent"
                        data={selectedData1}
                        onClose={() => setShowCard(false)}
                    />
                )}

                {showCancelDialog && orderToCancel && (
                    <CancelOrderDialog
                        open={showCancelDialog}
                        onOpenChange={(open) => {
                            setShowCancelDialog(open);
                            if (!open) setOrderToCancel(null);
                        }}
                        orderData={orderToCancel}
                        isLoading={isCancelLoading}
                        previewData={cancelPreviewData}
                        onConfirm={handleCancelFromList}
                    />
                )}

            </div>
        </div >
    )
}

export default Page
