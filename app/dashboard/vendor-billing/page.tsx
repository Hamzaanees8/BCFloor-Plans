"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { useAppContext } from "@/app/context/AppContext";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Get } from "../orders/orders";
import { toast } from "sonner";
import { payVendor } from "./vendorBilling";
import { Button } from "@/components/ui/button";
import { calculateDistance, GetOne } from "../vendors/vendors";


interface UnpaidService {
    order_service_uuid: string;
    vendor_uuid: string;
    amount: number;
    serviceName: string;
    orderId: number;
}

interface VendorUnpaidSummary {
    vendorId: string | number;
    vendorName: string;
    totalUnpaidAmount: number;
    unpaidServices: UnpaidService[];
}

export interface Slot {
    id: number;
    service_id: number;
    vendor_id: number | string;
    start_time: string;
    end_time: string;
    vendor: Vendor;
    order?: {
        id: number;
        property_address: string;
        property_location: string;
    };
}

export interface Vendor {
    uuid: string;
    first_name: string;
    last_name: string;

}

export interface ServiceRecord {
    service_id?: number;
    service?: {
        id: number;
        name: string;
    };
    service_name?: string;
    name?: string;
    option?: { title?: string };
    option_id?: string | number;
    amount?: string | number;
    uuid?: string
}

export interface Order {
    id: number;
    created_at: string;
    slots: Slot[];
    services: ServiceRecord[];
}


export interface VendorService {
    serviceId: number;
    serviceName: string;
    option?: { title?: string };
    amount: string | number;
    slots: Slot[];
    status?: string;
}

export interface VendorOrder {
    orderId: number;
    created_at: string;
    services: VendorService[];
}

export interface VendorGrouped {
    vendorId: number | string;
    vendor: Vendor;
    totalServices: number;
    totalOrders: number;
    totalAmount: number;
    added: string | null;
    orders: VendorOrder[];
}
interface ServiceForVendor {
    serviceId: number;
    serviceName: string;
    option?: { title?: string };
    option_id?: string | number;
    amount: string | number;
    slots: Slot[];
    status?: 'COMPLETE' | 'PENDING' | string;
    uuid?: string;
    vendor_payment?: { stripe_transfer_id: string, uuid: string, invoice_url: string }
}

interface TravelCost {
    orderId: number;
    distance: number;
    estimatedTime: number;
    travelCost: number;
    fromAddress: string;
    toAddress: string;
}

interface VendorLocationData {
    vendorId: string | number;
    startLocationAddress: string;
    paymentPerKm: number;
}
const Page = () => {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const [showAgain, setShowAgain] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("confirmation_dialog_payment_show_again");
        if (stored !== null) {
            setShowAgain(JSON.parse(stored));
        }
    }, []);
    const [loading, setLoading] = useState<boolean>(true);
    const [orderData, setOrderData] = useState<Order[]>([]);
    const { userType } = useAppContext();
    const [processingPayments, setProcessingPayments] = useState<Set<string>>(new Set());
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [processingBulkPayments, setProcessingBulkPayments] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [travelCosts, setTravelCosts] = useState<Map<number, TravelCost>>(new Map());
    const [vendorLocationData, setVendorLocationData] = useState<Map<string | number, VendorLocationData>>(new Map());
    const [loadingTravelCosts, setLoadingTravelCosts] = useState<Set<string | number>>(new Set());
    const itemsPerPage = 10;
    const confirmAndExecute = () => {
        pendingAction?.();
        setPendingAction(null);
    };

    const toggleRow = (i: number) => {
        setExpandedRow(expandedRow === i ? null : i);
    };

    const triggerPaymentAction = (action: () => void) => {
        if (!showAgain) {
            action();
        } else {
            setPendingAction(() => action);
            setConfirmOpen(true);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("Token not found.");
            setLoading(false);
            return;
        }

        setLoading(true);

        Get(token)
            .then((data) => {
                const sorted = Array.isArray(data.data)
                    ? [...data.data].sort(
                        (a, b) =>
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )
                    : [];
                setOrderData(sorted);
            })
            .catch((err) => {
                console.log(err.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return "—";
        const parts = timeStr.split(":");
        if (parts.length >= 2) return `${parts[0].padStart(2, "0")}:${parts[1]}`;
        return timeStr;
    };

    const computeCombinedTime = (slots: Slot[]) => {
        if (!slots || slots.length === 0) return "—";
        const sorted = [...slots].sort(
            (a, b) =>
                new Date(`1970-01-01T${a.start_time}`).getTime() -
                new Date(`1970-01-01T${b.start_time}`).getTime()
        );
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        const start = formatTime(first.start_time);
        const end = formatTime(last.end_time);

        const startDate = new Date(`1970-01-01T${first.start_time}`);
        const endDate = new Date(`1970-01-01T${last.end_time}`);
        const diffMin = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));

        return `${start} - ${end} (${diffMin} minutes)`;
    };

    // Fetch vendor location data and calculate travel costs
    const fetchVendorLocationAndCalculateTravelCosts = async (vendorId: string | number, vendorUuid: string, orders: VendorOrder[]) => {
        if (loadingTravelCosts.has(vendorId)) return;

        setLoadingTravelCosts(prev => new Set(prev).add(vendorId));

        try {
            // Fetch vendor data to get start location and order slots with complete order information
            const vendorData = await GetOne(vendorUuid);
            if (!vendorData?.data) {
                console.error("Failed to fetch vendor data");
                return;
            }

            const vendor = vendorData.data;
            const startLocation = vendor?.addresses?.find(
                (address: { type: string }) => address.type === 'start_location'
            );

            if (!startLocation) {
                console.error("Start location not found for vendor");
                return;
            }

            const startLocationAddress = `${startLocation.address_line_1}, ${startLocation.city}, ${startLocation.country}`;
            const paymentPerKm = Number(vendor?.settings?.payment_per_km ?? 0);

            // Store vendor location data
            setVendorLocationData(prev => new Map(prev).set(vendorId, {
                vendorId,
                startLocationAddress,
                paymentPerKm
            }));

            // Get vendor's order slots which have complete order information
            const vendorOrderSlots = vendor?.order_slots || [];


            if (!vendorOrderSlots || vendorOrderSlots.length === 0) {
                console.warn("No order slots found for vendor");
                return;
            }

            // Create a map of order IDs to vendor's order slots for this vendor
            const orderSlotMap = new Map();
            vendorOrderSlots.forEach((slot: Record<string, unknown>) => {
                const order = slot.order as { id?: number } | undefined;
                const orderId = order?.id;
                if (orderId && !orderSlotMap.has(orderId)) {
                    orderSlotMap.set(orderId, slot);
                }
            });

            // Calculate travel costs for each order
            const newTravelCosts = new Map(travelCosts);
            let currentFromAddress = startLocationAddress;
            let currentFromAddressForDisplay = startLocationAddress;

            // Sort orders by creation date
            const sortedOrders = [...orders].sort((a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );

            for (let i = 0; i < sortedOrders.length; i++) {
                const order = sortedOrders[i];
                const vendorSlot = orderSlotMap.get(order.orderId);

                if (!vendorSlot || !vendorSlot.order) {
                    console.error(`Could not find vendor slot for order ${order.orderId}`);
                    continue;
                }

                const toAddress = `${vendorSlot.order.property_address}, ${vendorSlot.order.property_location}`;
                const toAddressForDisplay = `${vendorSlot.order.property_address}, ${vendorSlot.order.property_location}`;

                // Calculate distance
                try {
                    const result = await calculateDistance(currentFromAddress, toAddress);
                    if (result) {
                        const distance = parseFloat(result.distance.toFixed(2));
                        const estimatedTime = Math.round(result.est_time);
                        const travelCost = parseFloat((distance * paymentPerKm).toFixed(2));

                        newTravelCosts.set(order.orderId, {
                            orderId: order.orderId,
                            distance,
                            estimatedTime,
                            travelCost,
                            fromAddress: currentFromAddressForDisplay,
                            toAddress: toAddressForDisplay
                        });

                        // Update current address for next iteration
                        currentFromAddress = toAddress;
                        currentFromAddressForDisplay = toAddressForDisplay;
                    }
                } catch (error) {
                    console.error(`Distance calculation failed for order ${order.orderId}:`, error);
                }

                // Add delay to avoid API rate limiting
                await new Promise((r) => setTimeout(r, 300));
            }

            setTravelCosts(newTravelCosts);
        } catch (error) {
            console.error("Error fetching vendor location:", error);
        } finally {
            setLoadingTravelCosts(prev => {
                const newSet = new Set(prev);
                newSet.delete(vendorId);
                return newSet;
            });
        }
    };

    const vendorsGrouped: VendorGrouped[] = useMemo(() => {
        const map = new Map<number | string, {
            vendor: Vendor;
            orders: Map<number, VendorOrder>
        }>();

        orderData.forEach((order: Order) => {
            if (!order.slots || order.slots.length === 0) return;

            // group slots by service_id
            const groupedSlots = order.slots.reduce<Record<number, Slot[]>>((acc, slot) => {
                const sid = slot.service_id;
                if (!acc[sid]) acc[sid] = [];
                acc[sid].push(slot);
                return acc;
            }, {});

            Object.keys(groupedSlots).forEach((sidKey) => {
                const sid = Number(sidKey);
                const slotsForService = groupedSlots[sid];

                const svcRecord =
                    order.services?.find((s) => Number(s.service_id) === sid) ||
                    order.services?.find((s) => s.service?.id === sid);


                const vendorIds = Array.from(new Set(slotsForService.map((s) => s.vendor_id)));

                vendorIds.forEach((vendorId) => {
                    const vendorObj =
                        slotsForService.find((s) => s.vendor_id === vendorId)?.vendor || {
                            uuid: "",
                            first_name: "Vendor",
                            last_name: "",
                        };

                    if (!map.has(vendorId)) {
                        map.set(vendorId, { vendor: vendorObj, orders: new Map<number, VendorOrder>() });
                    }

                    const vendorEntry = map.get(vendorId)!;

                    if (!vendorEntry.orders.has(order.id)) {
                        vendorEntry.orders.set(order.id, {
                            orderId: order.id,
                            created_at: order.created_at,
                            services: [],
                        });
                    }

                    const serviceForVendor: ServiceForVendor = {
                        ...svcRecord,
                        serviceId: sid,
                        serviceName:
                            svcRecord?.service?.name ||
                            svcRecord?.service_name ||
                            svcRecord?.name ||
                            `Service ${sid}`,
                        slots: slotsForService.filter((s) => s.vendor_id === vendorId),
                        amount: svcRecord?.amount || 0,
                    };

                    vendorEntry.orders.get(order.id)!.services.push(serviceForVendor);
                });
            });
        });

        // convert map -> array
        const arr: VendorGrouped[] = Array.from(map.entries()).map(([vendorId, vendorEntry]) => {
            const ordersArr = Array.from(vendorEntry.orders.values());
            const totalServices = ordersArr.reduce((sum, o) => sum + (o.services?.length || 0), 0);
            const totalAmount = ordersArr.reduce(
                (sum, o) => sum + o.services.reduce((sSum, svc) => sSum + Number(svc.amount ?? 0), 0),
                0
            );

            const dates = ordersArr
                .map((o) => o.created_at)
                .filter(Boolean)
                .map((d) => new Date(d));
            const earliestDate = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : null;
            const added = earliestDate ? earliestDate.toISOString().split("T")[0] : null;

            return {
                vendorId,
                vendor: vendorEntry.vendor,
                totalServices,
                totalOrders: ordersArr.length,
                totalAmount,
                added,
                orders: ordersArr,
            };
        });

        return arr;
    }, [orderData]);

    const totalPages = Math.ceil(vendorsGrouped.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedVendors = vendorsGrouped.slice(startIndex, endIndex);

    const calculateUnpaidServicesByVendor = (): VendorUnpaidSummary[] => {
        const vendorUnpaidMap = new Map<string | number, VendorUnpaidSummary>();

        vendorsGrouped.forEach((vendorGroup) => {
            const unpaidServices: UnpaidService[] = [];

            // Iterate through all orders and services for this vendor
            vendorGroup.orders.forEach((order) => {
                order.services.forEach((service: ServiceForVendor) => {
                    // Check if service has no vendor_payment (not paid)
                    if (!service.vendor_payment && service.uuid && service.amount) {
                        unpaidServices.push({
                            order_service_uuid: service.uuid,
                            vendor_uuid: vendorGroup.vendor.uuid,
                            amount: Number(service.amount),
                            serviceName: service.serviceName,
                            orderId: order.orderId
                        });
                    }
                });
            });

            if (unpaidServices.length > 0) {
                const totalUnpaidAmount = unpaidServices.reduce((sum, service) => sum + service.amount, 0);

                vendorUnpaidMap.set(vendorGroup.vendorId, {
                    vendorId: vendorGroup.vendorId,
                    vendorName: `${vendorGroup.vendor.first_name} ${vendorGroup.vendor.last_name}`,
                    totalUnpaidAmount,
                    unpaidServices
                });
            }
        });

        return Array.from(vendorUnpaidMap.values());
    };

    const handlePayAllUnpaid = async (vendorId: string | number) => {
        const unpaidVendors = calculateUnpaidServicesByVendor();
        const vendorUnpaid = unpaidVendors.find(v => v.unpaidServices[0].vendor_uuid === vendorId);

        if (!vendorUnpaid || vendorUnpaid.unpaidServices.length === 0) {
            toast.error("No unpaid services found for this vendor");
            return;
        }

        const paymentKey = `bulk-${vendorId}`;

        try {
            setProcessingBulkPayments(prev => new Set(prev).add(paymentKey));

            const token = localStorage.getItem("token") || "";

            const idsArray = vendorUnpaid.unpaidServices.map(s => s.order_service_uuid);

            const payload = {
                vendor_uuid: String(vendorId),
                order_service_uuids: idsArray,
                amount: vendorUnpaid.totalUnpaidAmount
            };


            const result = await payVendor(payload, token);

            if (result.status === "success") {
                toast.success(`Successfully paid ${vendorUnpaid.unpaidServices.length} services for ${vendorUnpaid.vendorName}`);

                setOrderData(prevOrderData => {
                    return prevOrderData.map(order => {
                        const updatedServices = order.services?.map(service => {
                            const wasPaid = vendorUnpaid.unpaidServices.find(
                                unpaid => unpaid.order_service_uuid === service.uuid
                            );

                            if (wasPaid) {
                                return {
                                    ...service,
                                    vendor_payment: {
                                        paid: true,
                                        transfer_id: `bulk-${Date.now()}`,
                                        paid_at: new Date().toISOString()
                                    }
                                };
                            }
                            return service;
                        });

                        return {
                            ...order,
                            services: updatedServices
                        };
                    });
                });
            } else {
                toast.error("Bulk payment failed");
                console.error("Bulk payment failed:", result);
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Bulk payment error:", error);
            toast.error(error.message || "Bulk payment failed");
        } finally {
            setProcessingBulkPayments(prev => {
                const newSet = new Set(prev);
                newSet.delete(paymentKey);
                return newSet;
            });
        }
    };

    const hasUnpaidServices = (vendorId: string | number): boolean => {
        const unpaidVendors = calculateUnpaidServicesByVendor();
        return unpaidVendors.some(v => v.vendorId === vendorId);
    };

    // Add this helper function to get unpaid count for a vendor
    const getUnpaidServicesCount = (vendorId: string | number): number => {
        const unpaidVendors = calculateUnpaidServicesByVendor();
        const vendor = unpaidVendors.find(v => v.vendorId === vendorId);
        return vendor ? vendor.unpaidServices.length : 0;
    };

    // Add this helper function to get unpaid amount for a vendor
    const getUnpaidAmount = (vendorId: string | number): number => {
        const unpaidVendors = calculateUnpaidServicesByVendor();
        const vendor = unpaidVendors.find(v => v.vendorId === vendorId);
        return vendor ? vendor.totalUnpaidAmount : 0;
    };


    const handlePayVendor = async (paymentData: { order_service_uuids: string[], vendor_uuid: string, amount: number }) => {
        const paymentKey = `${paymentData.order_service_uuids}-${paymentData.vendor_uuid}`;
        const payload = {
            order_service_uuids: paymentData.order_service_uuids,
            vendor_uuid: paymentData.vendor_uuid,
            amount: paymentData.amount
        }
        try {
            setProcessingPayments(prev => new Set(prev).add(paymentKey));

            const token = localStorage.getItem("token") || "";

            if (!paymentData?.vendor_uuid || !paymentData?.order_service_uuids) {
                toast.error("Invalid payment data");
                return;
            }

            const result = await payVendor(payload, token);

            if (result.status === "success") {
                toast.success("Payment processed successfully");

                setOrderData(prevOrderData => {
                    return prevOrderData.map(order => {
                        const hasPaidService = order.services?.some(service =>
                            paymentData.order_service_uuids.includes(service.uuid ?? '')
                        );

                        if (hasPaidService) {
                            const updatedServices = order.services?.map(service => {
                                if (paymentData.order_service_uuids.includes(service.uuid ?? '')) {
                                    return {
                                        ...service,
                                        vendor_payment: {
                                            paid: true,
                                            transfer_id: result.transfer_id,
                                            paid_at: new Date().toISOString()
                                        }
                                    };
                                }
                                return service;
                            });

                            return {
                                ...order,
                                services: updatedServices
                            };
                        }

                        return order;
                    });
                });
            } else {
                toast.error("Payment failed");
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Payment error:", error);
            toast.error(error.message || "Payment failed");
        } finally {
            setProcessingPayments(prev => {
                const newSet = new Set(prev);
                newSet.delete(paymentKey);
                return newSet;
            });
        }
    };



    return (
        <div className="text-[#424242]">
            <div
                className="w-full h-[80px] font-alexandria z-10 relative flex justify-between px-[20px] items-center"
                style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`, boxShadow: "0px 4px 4px #0000001F" }}
            >
                <p className={`text-[16px] md:text-[24px] font-[400]  ${userType}-text`}>
                    Billing ({vendorsGrouped.length})
                </p>
                <Select onValueChange={(value) => console.log(value)}>
                    <SelectTrigger
                        className={`w-[174px] h-[42px] text-[#666666] border-[1px] border-[#BBBBBB] ${userType === "admin"
                            ? "[&>svg]:text-[#4290E9]"
                            : userType === "agent"
                                ? "[&>svg]:text-[#6BAE41]"
                                : "[&>svg]:text-[#4290E9]"
                            }  [&>svg]:opacity-100`}
                        style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    >
                        <SelectValue placeholder="All Invoices" />
                    </SelectTrigger>
                    <SelectContent
                        className="rounded-none w-full py-[12px] text-[#666666]"
                        style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    >
                        <SelectItem value="allinvoices" className="p-0 px-[16px] mb-[9px] hover:!bg-transparent focus:!bg-transparent !bg-transparent cursor-pointer">
                            All Invoices
                        </SelectItem>
                        <SelectItem value="Unpaid" className="p-0 px-[16px] mb-[9px] hover:!bg-transparent focus:!bg-transparent !bg-transparent cursor-pointer">
                            Unpaid
                        </SelectItem>
                        <SelectItem value="Draft" className="p-0 px-[16px] hover:!bg-transparent focus:!bg-transparent !bg-transparent cursor-pointer">
                            Draft
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="w-full relative">
                <Table className="font-alexandria px-0 overflow-x-auto whitespace-nowrap">
                    <TableHeader>
                        <TableRow
                            className="font-alexandria h-[54px] hover:bg-[#E4E4E4]"
                            style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                        >
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D] pl-[20px]">Vendor</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Orders</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Services</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Service Time</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Total</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D] text-center">Status</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Added</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D] text-center">{/* chevron */}</TableHead>
                        </TableRow>
                    </TableHeader>

                    {!loading ? (
                        <TableBody>
                            {paginatedVendors.length > 0 ? ( // Change from vendorsGrouped to paginatedVendors
                                paginatedVendors.map((vg, i) => {
                                    const vendorTimeDisplay: string = computeCombinedTime(
                                        vg.orders.flatMap((o: VendorOrder) =>
                                            o.services.flatMap((svc: VendorService) => svc.slots || [])
                                        )
                                    );

                                    // extract only minutes part from parentheses
                                    const vendorMinutesOnly =
                                        vendorTimeDisplay.match(/\(([^)]+)\)/)?.[1] || vendorTimeDisplay;

                                    return (
                                        <React.Fragment key={vg.vendorId}>
                                            <TableRow
                                                onClick={() => {
                                                    toggleRow(i);
                                                    // Fetch travel costs when expanding
                                                    if (expandedRow !== i) {
                                                        fetchVendorLocationAndCalculateTravelCosts(vg.vendorId, vg.vendor.uuid, vg.orders);
                                                    }
                                                }}
                                                className="cursor-pointer hover:bg-gray-100"
                                            >
                                                <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                                                    {vg.vendor?.first_name} {vg.vendor?.last_name}
                                                </TableCell>

                                                <TableCell className={`text-[15px] py-[19px] font-[400] ${userType}-text`}>
                                                    {vg.totalOrders}
                                                </TableCell>

                                                <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D] ">
                                                    {vg.totalServices} services
                                                </TableCell>

                                                <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                                                    {vendorMinutesOnly}
                                                </TableCell>

                                                <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                                                    ${Number(vg.totalAmount ?? 0).toFixed(2)}
                                                </TableCell>

                                                <TableCell className="text-[10px] py-[19px] px-[20px] text-center font-[400] text-[#7D7D7D] ">
                                                    <label className="px-[7px] py-[1.5px] text-white rounded-[10px] leading-[100%] !bg-[#6BAE41]">
                                                        Completed
                                                    </label>
                                                </TableCell>

                                                <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                                                    {vg.added || "—"}
                                                </TableCell>

                                                <TableCell className="w-[40px] text-center">
                                                    {expandedRow === i ? (
                                                        <ChevronUp className="h-5 w-5 text-gray-600" />
                                                    ) : (
                                                        <ChevronDown className="h-5 w-5 text-gray-600" />
                                                    )}
                                                </TableCell>
                                            </TableRow>

                                            {expandedRow === i && (
                                                <TableRow className="bg-gray-50">
                                                    <TableCell colSpan={8} className="p-0">
                                                        <div className="overflow-hidden transition-all duration-300 p-4">
                                                            <div className="space-y-4">

                                                                <div className="flex flex-col gap-2 items-end">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            if (hasUnpaidServices(vg.vendorId)) {
                                                                                e.stopPropagation();
                                                                                triggerPaymentAction(() => handlePayAllUnpaid(vg.vendor.uuid));
                                                                            }
                                                                        }}
                                                                        disabled={!hasUnpaidServices(vg.vendorId) || processingBulkPayments.has(`bulk-${vg.vendorId}`)}
                                                                        className={`px-4 py-2 text-white rounded-md text-sm shadow transition-colors flex items-center justify-center min-w-[120px]
            ${!hasUnpaidServices(vg.vendorId)
                                                                                ? 'bg-gray-400 cursor-not-allowed'
                                                                                : processingBulkPayments.has(`bulk-${vg.vendorId}`)
                                                                                    ? 'bg-blue-400 cursor-not-allowed'
                                                                                    : 'bg-[#6bae41] hover:bg-[#6bae41]/80 cursor-pointer'
                                                                            }`}
                                                                    >
                                                                        {processingBulkPayments.has(`bulk-${vg.vendorId}`) ? (
                                                                            <span className="flex items-center">
                                                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                                </svg>
                                                                                Processing...
                                                                            </span>
                                                                        ) : (
                                                                            `Pay All (${getUnpaidServicesCount(vg.vendorId)})`
                                                                        )}
                                                                    </button>

                                                                    {hasUnpaidServices(vg.vendorId) && (
                                                                        <div className="text-sm text-gray-600">
                                                                            Unpaid: ${getUnpaidAmount(vg.vendorId).toFixed(2)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {vg.orders.map((order: VendorOrder) => {
                                                                    const orderTotal = order.services.reduce(
                                                                        (total: number, svc: VendorService) => total + Number(svc.amount ?? 0),
                                                                        0
                                                                    );
                                                                    const travelCost = travelCosts.get(order.orderId);

                                                                    return (
                                                                        <details
                                                                            key={order.orderId}
                                                                            className="group border rounded-lg shadow-sm overflow-hidden"
                                                                        >
                                                                            <summary className="cursor-pointer px-4 py-3 bg-white hover:bg-gray-100 flex items-center justify-between font-medium text-gray-800">
                                                                                <span>
                                                                                    Order #{order.orderId} — {order.services.length} service(s) — ${orderTotal.toFixed(2)}
                                                                                </span>
                                                                                <span className="text-gray-500 group-open:hidden">
                                                                                    <ChevronDown className="h-5 w-5" />
                                                                                </span>
                                                                                <span className="text-gray-500 hidden group-open:inline">
                                                                                    <ChevronUp className="h-5 w-5" />
                                                                                </span>
                                                                            </summary>

                                                                            <div className="bg-gray-50 p-4 space-y-4">

                                                                                {order.services.map((svc: ServiceForVendor, idx: number) => {
                                                                                    const svcTime = computeCombinedTime(svc.slots || []);
                                                                                    return (
                                                                                        <div
                                                                                            key={idx}
                                                                                            className="border rounded-md bg-white p-4 shadow-sm hover:shadow-md transition"
                                                                                        >
                                                                                            <div className="flex justify-between items-start gap-4">
                                                                                                <div>
                                                                                                    <p className="font-semibold text-gray-800">
                                                                                                        {svc.serviceName}{" "}
                                                                                                        {svc.option ? `(${svc.option.title})` : ""}
                                                                                                    </p>
                                                                                                    <p className="text-sm text-gray-600">
                                                                                                        Price: ${Number(svc.amount ?? 0).toFixed(2)}
                                                                                                    </p>
                                                                                                    <p className="text-sm text-gray-600">Time: {svcTime}</p>
                                                                                                    <p className="text-sm text-gray-600">Status: {svc.status}</p>
                                                                                                </div>

                                                                                                <div className="flex flex-col gap-2 items-end">
                                                                                                    <button
                                                                                                        disabled={svc.vendor_payment != null || processingPayments.has(`${svc.uuid}-${svc.slots[0].vendor.uuid}`)}
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            triggerPaymentAction(() => {
                                                                                                                handlePayVendor({
                                                                                                                    vendor_uuid: svc.slots[0].vendor.uuid,
                                                                                                                    order_service_uuids: [svc.uuid ?? ''],
                                                                                                                    amount: Number(svc.amount ?? 0)
                                                                                                                });
                                                                                                            });
                                                                                                        }}
                                                                                                        className={`
                                                                                                                px-4 py-2 text-white rounded-md text-sm shadow transition-colors flex items-center justify-center min-w-[100px]
                                                                                                                ${svc.vendor_payment != null
                                                                                                                ? 'bg-green-500 cursor-not-allowed'
                                                                                                                : processingPayments.has(`${svc.uuid}-${svc.slots[0].vendor.uuid}`)
                                                                                                                    ? 'bg-blue-400 cursor-not-allowed'
                                                                                                                    : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                                                                                                            } `}
                                                                                                    >
                                                                                                        {processingPayments.has(`${svc.uuid}-${svc.slots[0].vendor.uuid}`) ? (
                                                                                                            <span className="flex items-center">
                                                                                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                                                                </svg>
                                                                                                                Processing...
                                                                                                            </span>
                                                                                                        ) : svc.vendor_payment != null ? (
                                                                                                            'Paid'
                                                                                                        ) : (
                                                                                                            'Pay Now'
                                                                                                        )}
                                                                                                    </button>
                                                                                                    {svc.vendor_payment?.invoice_url &&
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                                                                            <a
                                                                                                                href={svc.vendor_payment?.invoice_url}
                                                                                                                target="_blank"
                                                                                                                rel="noopener noreferrer"
                                                                                                                className="text-blue-500 hover:text-blue-700 hover:underline truncate max-w-[200px]"
                                                                                                                title={svc.vendor_payment?.invoice_url}
                                                                                                            >
                                                                                                                {svc.vendor_payment?.invoice_url ?
                                                                                                                    svc.vendor_payment.invoice_url.replace(/^https?:\/\//, '').substring(0, 30) + '...'
                                                                                                                    : 'No URL'
                                                                                                                }
                                                                                                            </a>
                                                                                                        </div>
                                                                                                    }
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}

                                                                                {travelCost && (
                                                                                    <div className="border rounded-md bg-orange-50 p-4 shadow-sm hover:shadow-md transition">
                                                                                        <div className="flex justify-between items-start gap-4">
                                                                                            <div>
                                                                                                <div className="flex justify-start items-center gap-[20px]">
                                                                                                    <p className="font-semibold text-gray-800">
                                                                                                        Travel Cost
                                                                                                    </p>
                                                                                                    <p className="text-sm font-semibold text-orange-700">
                                                                                                        ${travelCost.travelCost.toFixed(2)}
                                                                                                    </p>
                                                                                                </div>
                                                                                                <p className="text-sm text-gray-600">
                                                                                                    Distance: {travelCost.distance} km
                                                                                                </p>
                                                                                                <p className="text-sm text-gray-600">
                                                                                                    Est. Time: {travelCost.estimatedTime} min
                                                                                                </p>
                                                                                                <p className="text-sm text-gray-600">
                                                                                                    Rate: ${Number(vendorLocationData.get(vg.vendorId)?.paymentPerKm ?? 0).toFixed(2)}/km
                                                                                                </p>
                                                                                                <p className="text-sm text-gray-600 mt-2">
                                                                                                    <span className="font-medium">From:</span> {travelCost.fromAddress}
                                                                                                </p>
                                                                                                <p className="text-sm text-gray-600">
                                                                                                    <span className="font-medium">To:</span> {travelCost.toAddress}
                                                                                                </p>
                                                                                            </div>

                                                                                            <div className="flex flex-col gap-2 items-end">
                                                                                                <button
                                                                                                    disabled={false}
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                    }}
                                                                                                    className="px-4 py-2 text-white rounded-md text-sm shadow transition-colors flex items-center justify-center min-w-[100px] bg-orange-500 hover:bg-orange-600 cursor-pointer"
                                                                                                >
                                                                                                    Pay Now ${travelCost.travelCost.toFixed(2)}
                                                                                                </button>
                                                                                                {/* <div className="text-right">
                                                                                                    <p className="text-sm font-semibold text-orange-700">
                                                                                                        ${travelCost.travelCost.toFixed(2)}
                                                                                                    </p>
                                                                                                </div> */}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                            </div>
                                                                        </details>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}


                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-10 text-center text-gray-500 text-lg">
                                        No vendors found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    ) : (
                        <TableBody>
                            {Array.from({ length: 5 }).map((_, index) => (
                                <TableRow key={index} className="h-[60px] bg-white border-b border-[#E4E4E4]">
                                    <TableCell className="pl-[20px]"><Skeleton className="h-4 w-[150px] bg-gray-200" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[60px] bg-gray-200" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[100px] bg-gray-200" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[120px] bg-gray-200" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[80px] bg-gray-200" /></TableCell>
                                    <TableCell className="text-center px-[20px]"><Skeleton className="h-5 w-[80px] bg-gray-200 rounded-full mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[100px] bg-gray-200" /></TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-5 w-5 bg-gray-200 rounded mx-auto" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    )}
                </Table>

                {vendorsGrouped.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                        <div className="text-sm text-[#666666]">
                            Showing {paginatedVendors.length} of {vendorsGrouped.length} Vendors
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="text-[#666666]"
                            >
                                Previous
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                                    (page) => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCurrentPage(page)}
                                            className={`min-w-[40px] ${currentPage === page
                                                ? `${userType}-bg text-white`
                                                : "text-[#666666]"
                                                }`}
                                        >
                                            {page}
                                        </Button>
                                    )
                                )}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                                }
                                disabled={currentPage === totalPages}
                                className="text-[#666666]"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmationDialog
                open={confirmOpen}
                setOpen={setConfirmOpen}
                onConfirm={confirmAndExecute}
                showAgain={showAgain}
                toggleShowAgain={() => setShowAgain(!showAgain)}
                dialogType="payment"
            />
        </div>
    );
};

export default Page;
