"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
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
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { ChevronDown, ChevronUp, Loader2, Download } from "lucide-react";
import { Get, GetVendors } from "../orders/orders";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GetOne, GetVendorEarnings, GetMyEarnings } from "../vendors/vendors";
import { useRouter } from "next/navigation";
import { batchCalculateTravelCosts, buildTripChainLegs } from "@/lib/batchTravelCalculator";
import { vendorBillingService, VendorInvoice } from "./VendorBillingService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import InvoiceDocument from "@/app/dashboard/invoice/components/InvoiceDocument";
import InvoicePdfDocument from "@/app/dashboard/invoice/components/InvoicePdfDocument";
import DownloadInvoicePdf from "@/app/dashboard/invoice/components/DownloadInvoicePdf";

import Script from "next/script";





export interface Slot {
    id: number;
    service_id: number;
    vendor_id: number | string;
    start_time: string;
    end_time: string;
    date: string;
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
        is_travel_required?: boolean | number;
    };
    service_name?: string;
    name?: string;
    option?: { title?: string };
    option_id?: string | number;
    amount?: string | number;
    uuid?: string;
    is_travel_required?: boolean | number;
}

export interface Order {
    id: number;
    created_at: string;
    slots: Slot[];
    services: ServiceRecord[];
    // Flat fields returned directly by GET /orders
    property_address?: string;
    property_location?: string;
    // Nested property object (returned by GET /orders/:uuid)
    property?: {
        property_address?: string;
        property_location?: string;
        address?: string;
    };
}


export interface VendorService {
    serviceId: number;
    serviceName: string;
    option?: { title?: string };
    amount: string | number;
    slots: Slot[];
    status?: string;
    is_travel_required?: boolean | number;
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
    is_travel_required?: boolean | number;
    vendor_payment?: { stripe_transfer_id: string, uuid: string, invoice_url: string };
    vendor_paid?: boolean | number;          // NEW — from order_services
    vendor_invoice_id?: number | null;       // NEW — FK to vendor_invoices.id
    is_completed?: boolean | number;         // NEW — from order_services
}

interface TravelCost {
    orderId: number;
    serviceUuid: string;
    date: string;
    distance: number;
    estimatedTime: number;
    travelCost: number;
    fromAddress: string;
    toAddress: string;
    error?: boolean;
    errorMessage?: string;
    isFallback?: boolean;
}

interface VendorLocationData {
    vendorId: string | number;
    startLocationAddress: string;
    paymentPerKm: number;
}

interface VendorPriceOption {
    option_id: number | string;
    vendor_price: string | number;
}

interface VendorPriceService {
    options?: VendorPriceOption[];
}

interface VendorPriceData {
    uuid: string;
    vendor_services?: VendorPriceService[];
}

const logBillingError = (context: string, error: any, additionalData?: any) => {
    const errorLog = {
        timestamp: new Date().toISOString(),
        context,
        error: error?.message || error?.response?.data?.message || String(error),
        vendorId: additionalData?.vendorId || additionalData?.vendorUuid,
        invoiceId: additionalData?.invoiceId || additionalData?.invoiceUuid,
        userId: typeof window !== 'undefined' ? localStorage.getItem('userId') : null,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : null
    };
    console.error('[Billing Error]', errorLog);
};

const geocodeAddress = (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (typeof window === "undefined" || !window.google?.maps?.Geocoder) return Promise.resolve(null);
    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve) => {
        geocoder.geocode({ address }, (results, status) => {
            if (status === "OK" && results?.[0]?.geometry?.location) {
                const loc = results[0].geometry.location;
                resolve({ lat: loc.lat(), lng: loc.lng() });
            } else {
                resolve(null);
            }
        });
    });
};

const getHaversineDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

const Page = () => {
    const router = useRouter();
    const [confirmOpen, setConfirmOpen] = useState(false);

    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const [showAgain, setShowAgain] = useState(true);
    const headerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const header = headerRef.current;
        if (!header) return;

        let ancestor = header.parentElement;
        while (ancestor) {
            const style = window.getComputedStyle(ancestor);
            if (style.overflowX === 'hidden' || ancestor.classList.contains('overflow-x-hidden')) {
                ancestor.style.setProperty('overflow-x', 'visible', 'important');
                ancestor.style.setProperty('overflow-y', 'visible', 'important');

                const target = ancestor;
                return () => {
                    target.style.removeProperty('overflow-x');
                    target.style.removeProperty('overflow-y');
                };
            }
            ancestor = ancestor.parentElement;
        }
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem("confirmation_dialog_payment_show_again");
        if (stored !== null) {
            setShowAgain(JSON.parse(stored));
        }
    }, []);
    const [loading, setLoading] = useState<boolean>(true);
    const [orderData, setOrderData] = useState<Order[]>([]);
    const { userType } = useAppContext();
    const loggedInVendorUuid = useMemo(() => {
        if (userType === "vendor" && typeof window !== "undefined") {
            const userInfo = localStorage.getItem("userInfo");
            if (userInfo) {
                try {
                    const parsedInfo = JSON.parse(userInfo);
                    return parsedInfo.uuid || "";
                } catch (err) {
                    console.error("Failed to parse userInfo:", err);
                }
            }
        }
        return "";
    }, [userType]);
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [travelCosts, setTravelCosts] = useState<Map<string, TravelCost>>(new Map());
    const [vendorLocationData, setVendorLocationData] = useState<Map<string | number, VendorLocationData>>(new Map());
    const [loadingTravelCosts, setLoadingTravelCosts] = useState<Set<string | number>>(new Set());
    const [vendorPricesMap, setVendorPricesMap] = useState<Map<string, Record<number, number>>>(new Map());

    // Per-vendor invoices, lazy-loaded on first accordion expand
    const [vendorInvoicesMap, setVendorInvoicesMap] = useState<Map<string | number, VendorInvoice[]>>(new Map());
    const [loadingInvoices, setLoadingInvoices] = useState<Set<string | number>>(new Set());
    const [vendorTotalEarnings, setVendorTotalEarnings] = useState<Map<string | number, number>>(new Map());

    // Invoice detail modal
    const [viewingInvoice, setViewingInvoice] = useState<VendorInvoice | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const itemsPerPage = 10;
    const confirmAndExecute = () => {
        pendingAction?.();
        setPendingAction(null);
    };

    const toggleRow = async (i: number, vg: VendorGrouped) => {
        const opening = expandedRow !== i;
        setExpandedRow(opening ? i : null);

        if (opening) {
            // Fetch travel costs when expanding
            fetchVendorLocationAndCalculateTravelCosts(vg.vendorId, vg.vendor.uuid, vg.orders);

            // Fetch total earnings when expanding (Task 3.2)
            try {
                const earnCheck = userType === 'vendor'
                    ? await GetMyEarnings()
                    : await GetVendorEarnings(vg.vendor.uuid);
                if (earnCheck?.success) {
                    const totalEarned = earnCheck.data?.summary?.total_earned ?? 0;
                    setVendorTotalEarnings(prev => new Map(prev).set(vg.vendorId, totalEarned));
                }
            } catch (e) {
                console.error("Failed to fetch earnings for vendor:", e);
            }

            // Lazy-load invoices for this vendor (only once)
            if (!vendorInvoicesMap.has(vg.vendorId) && !loadingInvoices.has(vg.vendorId)) {
                setLoadingInvoices(prev => new Set(prev).add(vg.vendorId));
                try {
                    const token = localStorage.getItem('token') || '';
                    const invoices = userType === 'vendor'
                        ? await vendorBillingService.getMyInvoices(token)
                        : await vendorBillingService.getVendorInvoices(vg.vendor.uuid, token);
                    setVendorInvoicesMap(prev => new Map(prev).set(vg.vendorId, invoices));
                } catch (e) {
                    console.error('Failed to load vendor invoices:', e);
                } finally {
                    setLoadingInvoices(prev => { const s = new Set(prev); s.delete(vg.vendorId); return s; });
                }
            }
        }
    };

    const toggleRowRef = useRef(toggleRow);
    toggleRowRef.current = toggleRow;

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

        // Fetch orders
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

        // Fetch vendors and build price map
        GetVendors(token)
            .then((res) => {
                if (Array.isArray(res.data)) {
                    const priceMap = new Map<string, Record<number, number>>();
                    res.data.forEach((vendor: VendorPriceData) => {
                        const vendorPriceLookup: Record<number, number> = {};
                        vendor.vendor_services?.forEach((vs: VendorPriceService) => {
                            vs.options?.forEach((opt: VendorPriceOption) => {
                                if (opt.option_id && opt.vendor_price) {
                                    vendorPriceLookup[Number(opt.option_id)] = Number(opt.vendor_price);
                                }
                            });
                        });
                        priceMap.set(vendor.uuid, vendorPriceLookup);
                    });
                    setVendorPricesMap(priceMap);
                }
            })
            .catch((err) => {
                console.error("Error fetching vendor services:", err);
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
            const vendorOrderSlots = vendor?.order_slots || [];

            // Create a map of order IDs to vendor's order slots for this vendor
            const orderSlotMap = new Map();
            vendorOrderSlots.forEach((slot: Record<string, unknown>) => {
                const order = slot.order as { id?: number } | undefined;
                const orderId = order?.id;
                if (orderId && !orderSlotMap.has(orderId)) {
                    orderSlotMap.set(orderId, slot);
                }
            });

            const startLocation = vendor?.addresses?.find(
                (address: { type: string }) => address.type === 'start_location'
            );

            if (!startLocation) {
                console.error("Start location not found for vendor");
                toast.error(`⚠️ Cannot calculate travel for ${vendor.first_name} ${vendor.last_name}: No start location configured. Update vendor profile.`);
                const newTravelCosts = new Map(travelCosts);
                orders.forEach(order => {
                    const vendorSlot = orderSlotMap.get(order.orderId);
                    const propertyAddress = vendorSlot?.order?.property_address || "";
                    order.services.forEach(svc => {
                        newTravelCosts.set(`${order.orderId}-${(svc as any).uuid}`, {
                            orderId: order.orderId,
                            serviceUuid: (svc as any).uuid || "",
                            date: order.created_at.split('T')[0],
                            distance: 0,
                            estimatedTime: 0,
                            travelCost: 0,
                            fromAddress: "",
                            toAddress: propertyAddress,
                            error: true,
                            errorMessage: "Start location missing"
                        });
                    });
                });
                setTravelCosts(newTravelCosts);
                return;
            }

            const rawCountry = startLocation.country || "";
            const normalizedCountry = rawCountry.trim().toUpperCase() === 'CA' ? 'Canada' : rawCountry.trim().toUpperCase() === 'US' ? 'USA' : rawCountry;
            const startLocationAddress = `${startLocation.address_line_1}, ${startLocation.city}, ${normalizedCountry}`;
            const paymentPerKm = Number(vendor?.settings?.payment_per_km ?? 0);

            // Store vendor location data
            setVendorLocationData(prev => new Map(prev).set(vendorId, {
                vendorId,
                startLocationAddress,
                paymentPerKm
            }));

            // Calculate travel costs for each service
            const newTravelCosts = new Map(travelCosts);

            interface ServiceTripUnit {
                orderId: number;
                serviceUuid: string;
                serviceName: string;
                isTravelRequired: boolean;
                slotDate: string;
                slotTime: string;
                propertyAddress: string;
                propertyLocation: string;
            }

            const getServiceUnits = (order: VendorOrder): ServiceTripUnit[] => {
                return order.services.map(svc => {
                    const allSlots = svc.slots || [];
                    // Find earliest slot for this specific service
                    let slotDate = order.created_at.split('T')[0];
                    let slotTime = "23:59:59";

                    if (allSlots.length > 0) {
                        const sortedSlots = [...allSlots].sort((a, b) => {
                            if (a.date !== b.date) return a.date.localeCompare(b.date);
                            return a.start_time.localeCompare(b.start_time);
                        });
                        slotDate = sortedSlots[0].date;
                        slotTime = sortedSlots[0].start_time;
                    }

                    // Primary: get property address from the service's own slots (most reliable)
                    const firstSlotWithOrder = allSlots.find(s => s.order?.property_address);
                    let propertyAddress = firstSlotWithOrder?.order?.property_address || "";
                    let propertyLocation = firstSlotWithOrder?.order?.property_location || "";

                    // Fallback: try orderSlotMap from vendor.order_slots
                    if (!propertyAddress) {
                        const vendorSlot = orderSlotMap.get(order.orderId);
                        propertyAddress = (vendorSlot as any)?.order?.property_address || "";
                        propertyLocation = (vendorSlot as any)?.order?.property_location || "";
                    }

                    // Last resort: look up from orderData which has the flat property_address
                    // field returned by GET /orders (e.g., order.property_address directly)
                    if (!propertyAddress) {
                        const rawOrder = orderData.find((o: Order) => o.id === order.orderId);
                        // GET /orders returns property_address flat on the order object
                        propertyAddress = rawOrder?.property_address
                            || rawOrder?.property?.property_address
                            || rawOrder?.property?.address
                            || "";
                        propertyLocation = rawOrder?.property_location
                            || rawOrder?.property?.property_location
                            || "";
                        if (propertyAddress) {
                            console.log(`[Travel Calc] ✅ Found address from orderData for order ${order.orderId}: ${propertyAddress}`);
                        }
                    }

                    const isTravelRequired = !!(svc as any).is_travel_required;

                    return {
                        orderId: order.orderId,
                        serviceUuid: (svc as any).uuid || "",
                        serviceName: svc.serviceName,
                        isTravelRequired,
                        slotDate,
                        slotTime,
                        propertyAddress,
                        propertyLocation
                    };
                });
            };

            const allServiceUnits: ServiceTripUnit[] = orders.flatMap(getServiceUnits);

            // Group service units by date for daily round-trip logic
            const unitsByDate = new Map<string, ServiceTripUnit[]>();
            allServiceUnits.forEach(unit => {
                const date = unit.slotDate;
                if (!unitsByDate.has(date)) unitsByDate.set(date, []);
                unitsByDate.get(date)?.push(unit);
            });

            console.log(`[Travel Calc] Vendor ${vendorUuid}: ${allServiceUnits.length} service units, ${unitsByDate.size} unique dates`);
            console.log(`[Travel Calc] Service units:`, allServiceUnits.map(u => ({
                orderId: u.orderId,
                service: u.serviceName,
                isTravelRequired: u.isTravelRequired,
                propertyAddress: u.propertyAddress,
                date: u.slotDate
            })));

            // Process each day
            for (const [date, dayUnits] of Array.from(unitsByDate.entries())) {
                // Sort units by time on that date
                const sortedDayUnits = [...dayUnits].sort((a, b) => a.slotTime.localeCompare(b.slotTime));

                // Filter units that actually require travel
                const travelUnitsForDay = sortedDayUnits.filter(u => u.isTravelRequired);
                console.log(`[Travel Calc] Date ${date}: ${sortedDayUnits.length} total, ${travelUnitsForDay.length} need travel`);

                // Add non-travel services with 0 cost
                sortedDayUnits.forEach(unit => {
                    if (!unit.isTravelRequired) {
                        const toAddressForDisplay = `${unit.propertyAddress}, ${unit.propertyLocation}`;
                        newTravelCosts.set(`${unit.orderId}-${unit.serviceUuid}`, {
                            orderId: unit.orderId,
                            serviceUuid: unit.serviceUuid,
                            date: unit.slotDate,
                            distance: 0,
                            estimatedTime: 0,
                            travelCost: 0,
                            fromAddress: startLocationAddress,
                            toAddress: toAddressForDisplay
                        });
                    }
                });

                if (travelUnitsForDay.length === 0) continue;

                // Build trip chain legs for all travel services in this day
                const addresses = travelUnitsForDay.map(u => u.propertyAddress).filter(addr => addr);
                console.log(`[Travel Calc] Date ${date}: addresses to batch:`, addresses);
                if (addresses.length === 0) {
                    console.warn(`[Travel Calc] No property addresses found for date ${date} — skipping batch. Check slot data.`);
                    continue;
                }

                const tripLegs = buildTripChainLegs(startLocationAddress, addresses);

                try {
                    console.log(`📍 Batching ${tripLegs.length} legs for ${date} in 1 API call`);
                    const batchResult = await batchCalculateTravelCosts(tripLegs);

                    if (batchResult.status === "OK" || batchResult.status === "PARTIAL_FAILURE") {
                        for (let i = 0; i < travelUnitsForDay.length; i++) {
                            const unit = travelUnitsForDay[i];
                            const toAddressForDisplay = `${unit.propertyAddress}, ${unit.propertyLocation}`;

                            const legResult = batchResult.legs.find(l => l.legIndex === i);
                            if (legResult) {
                                let distance = parseFloat(legResult.distance.toFixed(2));
                                let estimatedTime = Math.round(legResult.duration);

                                // If this is the last trip of the day, add return trip
                                if (i === travelUnitsForDay.length - 1) {
                                    const returnLeg = batchResult.legs.find(l => l.legIndex === travelUnitsForDay.length);
                                    if (returnLeg) {
                                        distance += parseFloat(returnLeg.distance.toFixed(2));
                                        estimatedTime += Math.round(returnLeg.duration);
                                    }
                                }

                                const travelCost = parseFloat((distance * paymentPerKm).toFixed(2));

                                newTravelCosts.set(`${unit.orderId}-${unit.serviceUuid}`, {
                                    orderId: unit.orderId,
                                    serviceUuid: unit.serviceUuid,
                                    date: unit.slotDate,
                                    distance,
                                    estimatedTime,
                                    travelCost,
                                    fromAddress: i === 0 ? startLocationAddress : travelUnitsForDay[i - 1].propertyAddress,
                                    toAddress: toAddressForDisplay
                                });
                            } else {
                                console.warn(`⚠️ Driving directions calculation failed for service ${unit.serviceUuid} in order ${unit.orderId}. Attempting straight-line fallback.`);
                                const fromAddr = i === 0 ? startLocationAddress : travelUnitsForDay[i - 1].propertyAddress;
                                const toAddr = unit.propertyAddress;
                                
                                let distance = 0;
                                let estimatedTime = 0;
                                let isFallback = false;
                                let specificError = "Leg calculation missing in batch result";
                                
                                const failedLeg = batchResult.failedLegs?.find(l => l.legIndex === i);
                                if (failedLeg && failedLeg.status) {
                                    specificError = `Google Maps failed: ${failedLeg.status}`;
                                }

                                if (fromAddr && toAddr) {
                                    try {
                                        const fromCoords = await geocodeAddress(fromAddr);
                                        const toCoords = await geocodeAddress(toAddr);
                                        if (fromCoords && toCoords) {
                                            const straightLineDist = getHaversineDistance(
                                                fromCoords.lat,
                                                fromCoords.lng,
                                                toCoords.lat,
                                                toCoords.lng
                                            );
                                            // Driving distance is typically ~30% longer than straight line
                                            distance = parseFloat((straightLineDist * 1.3).toFixed(2));
                                            estimatedTime = Math.round(distance * 1.2); // approx 1.2 min per km
                                            isFallback = true;
                                        }
                                    } catch (geoErr) {
                                        console.error("Failed to geocode for travel fallback:", geoErr);
                                    }
                                }

                                if (isFallback) {
                                    // If this is the last trip of the day, add return trip using fallback geocoding
                                    if (i === travelUnitsForDay.length - 1) {
                                        try {
                                            const startCoords = await geocodeAddress(startLocationAddress);
                                            if (startCoords) {
                                                const lastBookingCoords = await geocodeAddress(toAddr);
                                                if (lastBookingCoords) {
                                                    const returnStraightLine = getHaversineDistance(
                                                        lastBookingCoords.lat,
                                                        lastBookingCoords.lng,
                                                        startCoords.lat,
                                                        startCoords.lng
                                                    );
                                                    distance += parseFloat((returnStraightLine * 1.3).toFixed(2));
                                                    estimatedTime += Math.round((returnStraightLine * 1.3) * 1.2);
                                                }
                                            }
                                        } catch (retErr) {
                                            console.error("Failed to geocode return trip fallback:", retErr);
                                        }
                                    }

                                    const travelCost = parseFloat((distance * paymentPerKm).toFixed(2));
                                    newTravelCosts.set(`${unit.orderId}-${unit.serviceUuid}`, {
                                        orderId: unit.orderId,
                                        serviceUuid: unit.serviceUuid,
                                        date: unit.slotDate,
                                        distance,
                                        estimatedTime,
                                        travelCost,
                                        fromAddress: fromAddr,
                                        toAddress: toAddressForDisplay,
                                        isFallback: true,
                                        errorMessage: `Driving directions unroutable (${specificError}). Estimated via straight-line fallback.`
                                    });
                                    toast.warning(`ℹ️ Straight-line fallback distance used for ${unit.serviceName} (#${unit.orderId}) due to routing limits.`);
                                } else {
                                    toast.error(`⚠️ Travel calculation failed for ${unit.serviceName} in order #${unit.orderId}. Leg not found.`);
                                    newTravelCosts.set(`${unit.orderId}-${unit.serviceUuid}`, {
                                        orderId: unit.orderId,
                                        serviceUuid: unit.serviceUuid,
                                        date: unit.slotDate,
                                        distance: 0,
                                        estimatedTime: 0,
                                        travelCost: 0,
                                        fromAddress: fromAddr,
                                        toAddress: toAddressForDisplay,
                                        error: true,
                                        errorMessage: specificError
                                    });
                                }
                            }
                        }
                    } else {
                        console.error("❌ Batch travel calculation failed completely for date", date);
                        toast.warning(`⚠️ Travel calculation failed for ${date}: Google Maps unavailable. Travel set to $0.`);
                        travelUnitsForDay.forEach(unit => {
                            const toAddressForDisplay = `${unit.propertyAddress}, ${unit.propertyLocation}`;
                            newTravelCosts.set(`${unit.orderId}-${unit.serviceUuid}`, {
                                orderId: unit.orderId,
                                serviceUuid: unit.serviceUuid,
                                date: unit.slotDate,
                                distance: 0,
                                estimatedTime: 0,
                                travelCost: 0,
                                fromAddress: startLocationAddress,
                                toAddress: toAddressForDisplay,
                                error: true,
                                errorMessage: `Batch API failure: ${batchResult.status}`
                            });
                        });
                    }
                } catch (error) {
                    console.error(`❌ Exception in batch travel calculation for ${date}:`, error);
                    toast.error(`❌ Error calculating travel costs for ${date}. Exception encountered.`);
                    travelUnitsForDay.forEach(unit => {
                        const toAddressForDisplay = `${unit.propertyAddress}, ${unit.propertyLocation}`;
                        newTravelCosts.set(`${unit.orderId}-${unit.serviceUuid}`, {
                            orderId: unit.orderId,
                            serviceUuid: unit.serviceUuid,
                            date: unit.slotDate,
                            distance: 0,
                            estimatedTime: 0,
                            travelCost: 0,
                            fromAddress: startLocationAddress,
                            toAddress: toAddressForDisplay,
                            error: true,
                            errorMessage: `Exception: ${error instanceof Error ? error.message : String(error)}`
                        });
                    });
                }
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

    const handlePayInvoice = async (invoiceUuid: string, vendorUuid: string, vendorId: number | string, invoiceNumber: string, invoiceAmount: number) => {
        const token = localStorage.getItem('token') || '';
        if (!token) return;

        setLoading(true);
        try {
            // Step 1: Trigger payment API
            const payResult = await vendorBillingService.payInvoice(invoiceUuid, token);

            if (payResult.status !== "success") {
                toast.error("Payment processing failed");
                return;
            }

            // Wait for backend to process earnings record
            await new Promise(r => setTimeout(r, 1000));

            // Step 2: Verify earnings were updated
            const earnCheckResult = await GetVendorEarnings(vendorUuid, { period: 'this_month' });

            // Log verification context (Task 4.2)
            console.log(`[Payment Verification] Invoice ${invoiceNumber} paid. Checking vendor ${vendorUuid} earnings...`);

            if (earnCheckResult?.success) {
                const newTotalEarned = earnCheckResult.data?.summary?.total_earned ?? 0;
                const oldTotalEarned = vendorTotalEarnings.get(vendorId) || 0;
                const earnedIncrease = newTotalEarned - oldTotalEarned;
                const tolerance = 5; // Allow $5 variance due to rounding/existing balance

                setVendorTotalEarnings(prev => new Map(prev).set(vendorId, newTotalEarned));

                if (earnedIncrease < invoiceAmount - tolerance) {
                    toast.error(
                        `⚠️ Payment marked but vendor earnings may not have updated correctly. ` +
                        `Expected increase: $${Number(invoiceAmount).toFixed(2)}, ` +
                        `Actual increase: $${earnedIncrease.toFixed(2)} (Old: $${oldTotalEarned.toFixed(2)}, New: $${newTotalEarned.toFixed(2)})`
                    );
                    logBillingError("earnings_verification_failed", "Vendor earnings increase less than paid invoice amount", {
                        vendorUuid,
                        invoiceUuid,
                        invoiceAmount,
                        oldTotalEarned,
                        newTotalEarned,
                        earnedIncrease
                    });
                } else {
                    toast.success(`✅ Invoice #${invoiceNumber} paid! Vendor earnings verified: $${newTotalEarned.toFixed(2)}`);
                }
            } else {
                toast.warning(`⚠️ Invoice #${invoiceNumber} paid, but vendor earnings could not be verified automatically. Check backend logs.`);
                console.warn(`[Payment Verification Warning] Earnings check response failed for vendor ${vendorUuid}:`, earnCheckResult);
            }

            // Refresh invoices for this vendor
            const updatedInvoices = await vendorBillingService.getVendorInvoices(vendorUuid, token);
            setVendorInvoicesMap(prev => new Map(prev).set(vendorId, updatedInvoices));

            // Refresh orders data to update billing status tags
            const ordersRes = await Get(token);
            const sorted = Array.isArray(ordersRes.data)
                ? [...ordersRes.data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                : [];
            setOrderData(sorted);
        } catch (error: any) {
            logBillingError("handlePayInvoice", error, { invoiceUuid, vendorUuid });
            toast.error(error?.message || error?.response?.data?.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    const getOrderTravelTotal = (orderId: number, services: ServiceForVendor[]): number => {
        return services.reduce((sum, svc) => {
            const key = `${orderId}-${svc.uuid}`;
            const tc = travelCosts.get(key);
            return sum + (tc?.travelCost ?? 0);
        }, 0);
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

                    if (userType === "vendor" && vendorObj.uuid !== loggedInVendorUuid) {
                        return;
                    }

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

                    const vendorUuid = vendorObj.uuid;
                    const vendorLookup = vendorPricesMap.get(vendorUuid);
                    let finalAmount = svcRecord?.amount || 0;

                    if (vendorLookup && svcRecord?.option_id) {
                        const optId = Number(svcRecord.option_id);
                        if (vendorLookup[optId] !== undefined) {
                            finalAmount = vendorLookup[optId];
                        }
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
                        amount: finalAmount,
                        is_travel_required: svcRecord?.service?.is_travel_required || svcRecord?.is_travel_required,
                        vendor_paid: (svcRecord as any)?.vendor_paid,
                        vendor_invoice_id: (svcRecord as any)?.vendor_invoice_id ?? null,
                        vendor_payment: (svcRecord as any)?.vendor_payment,
                        is_completed: (svcRecord as any)?.is_completed,
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
    }, [orderData, vendorPricesMap, userType, loggedInVendorUuid]);

    // Build a flat map of invoiceId → VendorInvoice from all lazy-loaded invoices
    const invoiceIdMap = useMemo(() => {
        const map = new Map<number, VendorInvoice>();
        vendorInvoicesMap.forEach((invoices) => {
            invoices.forEach((inv) => {
                if (inv.id != null) map.set(inv.id, inv);
            });
        });
        return map;
    }, [vendorInvoicesMap]);

    // Handle resume_payment redirection after invoice generation
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const resume = params.get("resume_payment");
            if (resume === "true" && vendorsGrouped.length > 0) {
                const targetVendorUuid = localStorage.getItem("resume_payment_vendor_uuid");
                if (targetVendorUuid) {
                    const idx = vendorsGrouped.findIndex(vg => vg.vendor.uuid === targetVendorUuid);
                    if (idx !== -1) {
                        const targetPage = Math.floor(idx / itemsPerPage) + 1;
                        setCurrentPage(targetPage);
                        const localIndex = idx % itemsPerPage;
                        setExpandedRow(localIndex);
                        const targetVg = vendorsGrouped[idx];
                        toggleRowRef.current(localIndex, targetVg);
                        localStorage.removeItem("resume_payment_vendor_uuid");
                        const url = new URL(window.location.href);
                        url.searchParams.delete("resume_payment");
                        window.history.replaceState({}, "", url.pathname + url.search);
                    }
                }
            }
        }
    }, [vendorsGrouped]);

    // Auto-expand vendor row if logged in as a vendor
    useEffect(() => {
        if (userType === 'vendor' && vendorsGrouped.length > 0 && expandedRow === null) {
            setExpandedRow(0);
            toggleRowRef.current(0, vendorsGrouped[0]);
        }
    }, [userType, vendorsGrouped, expandedRow]);

    const totalPages = Math.ceil(vendorsGrouped.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedVendors = vendorsGrouped.slice(startIndex, endIndex);




    return (
        <div className="text-[#424242]">
            <Script
                src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_PLACES_API_KEY || ""}&libraries=places`}
                strategy="lazyOnload"
            />
            <div
                ref={headerRef}
                className="w-full h-[80px] font-alexandria sticky top-0 z-50 flex justify-between px-[20px] items-center"
                style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`, boxShadow: "0px 4px 4px #0000001F" }}
            >
                <p className={`text-[16px] md:text-[24px] font-[400]  ${userType}-text`}>
                    Billing ({vendorsGrouped.length})
                </p>
                <div className="flex items-center gap-4">
                    {userType !== 'vendor' && (
                        <>
                            <Button
                                onClick={() => router.push(userType === 'vendor' ? '/dashboard/vendor-billing/my-invoices' : '/dashboard/vendor-billing/invoices')}
                                className="text-white h-[42px] px-6 text-[14px] hover:brightness-110 active:scale-[0.98] transition-all"
                                style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
                            >
                                View Invoices
                            </Button>
                            <Button
                                onClick={() => router.push('/dashboard/vendor-billing/uninvoiced')}
                                className="text-white h-[42px] px-6 text-[14px] hover:brightness-110 active:scale-[0.98] transition-all"
                                style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
                            >
                                Create Invoice
                            </Button>
                        </>
                    )}
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
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Paid / Unpaid</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D] text-center">Status</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Last Paid</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D] text-center">{/* chevron */}</TableHead>
                        </TableRow>
                    </TableHeader>

                    {!loading ? (
                        <TableBody>
                            {paginatedVendors.length > 0 ? ( // Change from vendorsGrouped to paginatedVendors
                                paginatedVendors.map((vg, i) => {
                                    const vendorInvoices = vendorInvoicesMap.get(vg.vendorId) ?? [];
                                    const paidInvoices = vendorInvoices.filter(inv => inv.status === 'paid');
                                    const unpaidInvoices = vendorInvoices.filter(inv => inv.status === 'pending_payment' || inv.status === 'draft');
                                    const paidAmount = paidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount ?? 0), 0);
                                    const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount ?? 0), 0);

                                    // Last payment date — most recent paid invoice
                                    const lastPaidDate = paidInvoices.length > 0
                                        ? paidInvoices
                                            .map(inv => new Date(inv.created_at))
                                            .sort((a, b) => b.getTime() - a.getTime())[0]
                                            .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                        : null;

                                    // Dynamic status: fully paid, partially unpaid, or no invoices yet
                                    const paymentStatus: 'paid' | 'unpaid' | 'partial' | 'none' =
                                        vendorInvoices.length === 0 ? 'none'
                                            : unpaidInvoices.length === 0 ? 'paid'
                                                : paidInvoices.length === 0 ? 'unpaid'
                                                    : 'partial';

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
                                                    toggleRow(i, vg);
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
                                                    <div className="flex flex-col gap-0.5">
                                                        {paidAmount > 0 && (
                                                            <span className="text-[13px] font-semibold text-green-600">
                                                                ✓ ${paidAmount.toFixed(2)}
                                                            </span>
                                                        )}
                                                        {unpaidAmount > 0 && (
                                                            <span className="text-[13px] font-semibold text-red-500">
                                                                ✗ ${unpaidAmount.toFixed(2)}
                                                            </span>
                                                        )}
                                                        {paidAmount === 0 && unpaidAmount === 0 && (
                                                            <span className="text-[13px] text-gray-400">—</span>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-[10px] py-[19px] px-[20px] text-center font-[400]">
                                                    {paymentStatus === 'paid' ? (
                                                        <span className="px-[8px] py-[3px] text-white rounded-full text-[10px] font-bold bg-green-500">Paid</span>
                                                    ) : paymentStatus === 'unpaid' ? (
                                                        <span className="px-[8px] py-[3px] text-white rounded-full text-[10px] font-bold bg-red-500">Unpaid</span>
                                                    ) : paymentStatus === 'partial' ? (
                                                        <span className="px-[8px] py-[3px] text-white rounded-full text-[10px] font-bold bg-amber-500">Partial</span>
                                                    ) : (
                                                        <span className="px-[8px] py-[3px] text-gray-500 rounded-full text-[10px] font-bold bg-gray-100">No Invoice</span>
                                                    )}
                                                </TableCell>

                                                <TableCell className="text-[13px] py-[19px] font-[400] text-[#7D7D7D]">
                                                    {lastPaidDate ? (
                                                        <span className="text-green-700 font-medium">{lastPaidDate}</span>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
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
                                                        <div className="overflow-hidden transition-all duration-300 p-6 space-y-6">
                                                            {/* SECTION A: Invoice History */}
                                                            <div className="mb-4">
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Invoice History</h4>
                                                                    {userType !== 'vendor' && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                localStorage.setItem('resume_payment_vendor_uuid', vg.vendor.uuid);
                                                                                router.push(`/dashboard/vendor-billing/pending/${vg.vendor.uuid}`);
                                                                            }}
                                                                            className="px-3 py-3 text-[16px] text-white rounded-md hover:brightness-110 transition-all cursor-pointer"
                                                                            style={{ backgroundColor: roleSettings.pageTabColor }}
                                                                        >
                                                                            + Generate Invoice
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {loadingInvoices.has(vg.vendorId) ? (
                                                                    <div className="space-y-2">
                                                                        {[1, 2].map(n => <Skeleton key={n} className="h-10 w-full bg-gray-200 rounded" />)}
                                                                    </div>
                                                                ) : (vendorInvoicesMap.get(vg.vendorId) ?? []).length === 0 ? (
                                                                    <p className="text-sm text-gray-400 italic py-2">No invoices generated yet.</p>
                                                                ) : (
                                                                    <>
                                                                        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                                                                            <table className="w-full text-sm">
                                                                                <thead className="bg-gray-100 text-xs text-gray-500 uppercase">
                                                                                    <tr>
                                                                                        <th className="px-3 py-2 text-left">Invoice #</th>
                                                                                        <th className="px-3 py-2 text-left">Cycle</th>
                                                                                        <th className="px-3 py-2 text-right">Amount</th>
                                                                                        <th className="px-3 py-2 text-center">Status</th>
                                                                                        {userType !== 'vendor' && <th className="px-3 py-2 text-center">Actions</th>}
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-gray-100 bg-white">
                                                                                    {(vendorInvoicesMap.get(vg.vendorId) ?? []).map(inv => (
                                                                                        <tr key={inv.uuid} className="hover:bg-gray-50">
                                                                                            <td className="px-3 py-2 font-medium text-gray-850">#{inv.invoice_number}</td>
                                                                                            <td className="px-3 py-2 text-gray-500 text-xs">
                                                                                                {inv.cycle_start ? `${inv.cycle_start} → ${inv.cycle_end ?? ''}` : '—'}
                                                                                            </td>
                                                                                            <td className="px-3 py-2 text-right font-semibold text-gray-800">
                                                                                                ${Number(inv.total_amount ?? 0).toFixed(2)}
                                                                                            </td>
                                                                                            <td className="px-3 py-2 text-center">
                                                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                                                                    inv.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-700' :
                                                                                                        inv.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                                                                                                            'bg-red-100 text-red-600'
                                                                                                    }`}>{inv.status.replace('_', ' ')}</span>
                                                                                            </td>
                                                                                            {userType !== 'vendor' && (
                                                                                                <td className="px-3 py-2 text-center">
                                                                                                    <div className="flex items-center justify-center gap-2">
                                                                                                        <button
                                                                                                            onClick={(e) => {
                                                                                                                e.stopPropagation();
                                                                                                                // Fetch details first to ensure lines are present
                                                                                                                const token = localStorage.getItem('token') || '';
                                                                                                                vendorBillingService.getAdminInvoiceDetails(inv.uuid, token)
                                                                                                                    .then((details) => {
                                                                                                                        setViewingInvoice(details);
                                                                                                                        setIsViewModalOpen(true);
                                                                                                                    })
                                                                                                                    .catch(() => {
                                                                                                                        setViewingInvoice(inv);
                                                                                                                        setIsViewModalOpen(true);
                                                                                                                    });
                                                                                                            }}
                                                                                                            className="px-2 py-1 text-xs border rounded hover:bg-gray-100 transition cursor-pointer"
                                                                                                        >View</button>
                                                                                                        {(inv.status === 'pending_payment' || inv.status === 'draft') && (
                                                                                                            <button
                                                                                                                onClick={(e) => {
                                                                                                                    e.stopPropagation();
                                                                                                                    triggerPaymentAction(() => handlePayInvoice(inv.uuid, vg.vendor.uuid, vg.vendorId, inv.invoice_number, Number(inv.total_amount)));
                                                                                                                }}
                                                                                                                className="px-2 py-1 text-xs text-white rounded transition hover:brightness-110 cursor-pointer"
                                                                                                                style={{ backgroundColor: roleSettings.pageTabColor }}
                                                                                                            >Pay</button>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </td>
                                                                                            )}
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>

                                                                        {/* Earnings verification block (Task 3.2) */}
                                                                        {(vendorInvoicesMap.get(vg.vendorId)?.some(inv => inv.status === 'paid') || vendorTotalEarnings.has(vg.vendorId)) && (
                                                                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-left space-y-1">
                                                                                {vendorInvoicesMap.get(vg.vendorId)?.some(inv => inv.status === 'paid') && (
                                                                                    <p className="text-sm text-green-800 font-semibold flex items-center gap-1.5">
                                                                                        <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                                                        ✅ Paid invoices: ${vendorInvoicesMap.get(vg.vendorId)
                                                                                            ?.filter(i => i.status === 'paid')
                                                                                            .reduce((sum, i) => sum + Number(i.total_amount), 0)
                                                                                            .toFixed(2)}
                                                                                    </p>
                                                                                )}
                                                                                {vendorTotalEarnings.has(vg.vendorId) && (
                                                                                    <p className="text-xs text-green-700">
                                                                                        Verified Vendor Earnings (This Month): ${Number(vendorTotalEarnings.get(vg.vendorId) ?? 0).toFixed(2)}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>

                                                            {/* SECTION B: Orders & Services */}
                                                            <div>
                                                                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Orders & Services</h4>
                                                                {loadingTravelCosts.has(vg.vendorId) ? (
                                                                    <div className="p-6 space-y-4 bg-white border rounded-lg shadow-sm">
                                                                        <div className="flex items-center gap-2">
                                                                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                                                            <p className="text-sm text-gray-600">Calculating travel costs...</p>
                                                                        </div>
                                                                    </div>
                                                                ) : vg.orders.map((order: VendorOrder) => {
                                                                    const orderTotal = order.services.reduce((t, s) => t + Number(s.amount ?? 0), 0);
                                                                    const orderTravelTotal = getOrderTravelTotal(order.orderId, order.services);

                                                                    // Resolve property address from first slot
                                                                    const firstSlot = order.services?.[0]?.slots?.[0] || order.services?.find(s => s.slots?.length > 0)?.slots?.[0];
                                                                    const address = firstSlot?.order ? `${firstSlot.order.property_address || ''}, ${firstSlot.order.property_location || ''}` : '';

                                                                    return (
                                                                        <details key={order.orderId} className="group border rounded-lg bg-white shadow-sm overflow-hidden mb-3">
                                                                            <summary className="cursor-pointer px-4 py-3 bg-white hover:bg-gray-50 flex items-center justify-between font-medium text-gray-800">
                                                                                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                                                                                    <span className="text-sm font-semibold">Order #{order.orderId}</span>
                                                                                    {address && <span className="text-xs text-gray-500 max-w-[200px] md:max-w-xs truncate" title={address}>{address}</span>}
                                                                                    <span className="text-xs text-gray-400">
                                                                                        {new Date(order.created_at).toLocaleDateString()}
                                                                                    </span>
                                                                                    <span className="text-xs text-gray-500">
                                                                                        Services: ${orderTotal.toFixed(2)}
                                                                                        {orderTravelTotal > 0 && ` · Travel: $${orderTravelTotal.toFixed(2)}`}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2 text-gray-400">
                                                                                    <span className="group-open:hidden"><ChevronDown className="h-4 w-4" /></span>
                                                                                    <span className="hidden group-open:inline"><ChevronUp className="h-4 w-4" /></span>
                                                                                </div>
                                                                            </summary>

                                                                            <div className="bg-gray-50 divide-y divide-gray-100 p-4 space-y-3">
                                                                                {order.services.map((svc: ServiceForVendor, idx: number) => {
                                                                                    const isPaid = svc.vendor_payment != null || svc.vendor_paid === true || svc.vendor_paid === 1;
                                                                                    const linkedInvoice = svc.vendor_invoice_id ? invoiceIdMap.get(svc.vendor_invoice_id) : null;
                                                                                    const isInvoiced = linkedInvoice != null && !isPaid;
                                                                                    const svcTravel = travelCosts.get(`${order.orderId}-${svc.uuid}`);
                                                                                    const vendorLocation = vendorLocationData.get(vg.vendorId);
                                                                                    const svcTime = computeCombinedTime(svc.slots || []);

                                                                                    return (
                                                                                        <div key={idx} className="border rounded-md bg-white p-4 shadow-sm hover:shadow-md transition">
                                                                                            <div className="flex items-start justify-between gap-4">
                                                                                                <div className="flex-1">
                                                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                                                        <p className="font-semibold text-sm text-gray-800">
                                                                                                            {svc.serviceName}{svc.option ? ` (${svc.option.title})` : ''}
                                                                                                        </p>
                                                                                                        {isPaid ? (
                                                                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                                                                                                                ✓ Paid
                                                                                                            </span>
                                                                                                        ) : isInvoiced ? (
                                                                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                                                                                                                Invoiced
                                                                                                            </span>
                                                                                                        ) : svc.is_completed ? (
                                                                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
                                                                                                                Unpaid
                                                                                                            </span>
                                                                                                        ) : (
                                                                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">
                                                                                                                In Progress
                                                                                                            </span>
                                                                                                        )}
                                                                                                        {/* Invoice Reference Chip */}
                                                                                                        {linkedInvoice && (
                                                                                                            userType === 'vendor' ? (
                                                                                                                <span
                                                                                                                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 select-none"
                                                                                                                >
                                                                                                                    #{linkedInvoice.invoice_number}
                                                                                                                </span>
                                                                                                            ) : (
                                                                                                                <button
                                                                                                                    onClick={async (e) => {
                                                                                                                        e.stopPropagation();
                                                                                                                        const token = localStorage.getItem('token') || '';
                                                                                                                        vendorBillingService.getAdminInvoiceDetails(linkedInvoice.uuid, token)
                                                                                                                            .then((details) => {
                                                                                                                                setViewingInvoice(details);
                                                                                                                                setIsViewModalOpen(true);
                                                                                                                            })
                                                                                                                            .catch(() => {
                                                                                                                                setViewingInvoice(linkedInvoice);
                                                                                                                                setIsViewModalOpen(true);
                                                                                                                            });
                                                                                                                    }}
                                                                                                                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition cursor-pointer"
                                                                                                                    title="Click to view invoice"
                                                                                                                >
                                                                                                                    #{linkedInvoice.invoice_number}
                                                                                                                </button>
                                                                                                            )
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                                                        Price: ${Number(svc.amount ?? 0).toFixed(2)}
                                                                                                        {svcTime && ` · Time: ${svcTime}`}
                                                                                                    </p>
                                                                                                </div>
                                                                                            </div>
                                                                                            {/* Travel debug panel */}
                                                                                            {svcTravel ? (
                                                                                                <div className={`mt-3 pt-3 border-t text-xs ${svcTravel.error
                                                                                                    ? 'border-red-100'
                                                                                                    : svcTravel.travelCost > 0
                                                                                                        ? 'border-orange-100'
                                                                                                        : 'border-gray-100'
                                                                                                    }`}>
                                                                                                    {/* Cost / status header */}
                                                                                                                                                                                           <div className="flex items-center gap-2 flex-wrap mb-2">
                                                                                                        {svcTravel.travelCost > 0 ? (
                                                                                                            <>
                                                                                                                <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] uppercase font-bold">Travel</span>
                                                                                                                <span className="font-bold text-orange-700">${svcTravel.travelCost.toFixed(2)}</span>
                                                                                                                <span className="text-gray-400">{svcTravel.distance} km</span>
                                                                                                                <span className="text-gray-300">•</span>
                                                                                                                <span className="text-gray-400">{svcTravel.estimatedTime} min</span>
                                                                                                                <span className="text-gray-300">•</span>
                                                                                                                <span className="text-gray-400">@ ${Number(vendorLocation?.paymentPerKm ?? 0).toFixed(2)}/km</span>
                                                                                                                {svcTravel.isFallback && (
                                                                                                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] uppercase font-bold" title={svcTravel.errorMessage}>Fallback Estimate</span>
                                                                                                                )}
                                                                                                            </>
                                                                                                        ) : svcTravel.error ? (
                                                                                                            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] uppercase font-bold">Travel Error</span>
                                                                                                        ) : (
                                                                                                            <>
                                                                                                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] uppercase font-bold">No Travel</span>
                                                                                                                <span className="text-gray-400 italic">Travel not required for this service</span>
                                                                                                                {svcTravel.isFallback && (
                                                                                                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] uppercase font-bold" title={svcTravel.errorMessage}>Fallback Estimate</span>
                                                                                                                )}
                                                                                                            </>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    {/* Route card */}
                                                                                                    <div className="flex items-start gap-1.5 bg-gray-50 border border-gray-200 rounded px-2.5 py-2">
                                                                                                        <span className="mt-0.5 shrink-0 text-[11px]">📍</span>
                                                                                                        <div className="flex flex-col gap-1 min-w-0 w-full">
                                                                                                            <div className="flex items-start gap-2">
                                                                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide pt-0.5 w-7 shrink-0">From</span>
                                                                                                                <span className="text-gray-600 break-words" title={svcTravel.fromAddress}>
                                                                                                                    {svcTravel.fromAddress || <em className="text-gray-400">—</em>}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                            <div className="ml-9 h-px bg-gray-200" />
                                                                                                            <div className="flex items-start gap-2">
                                                                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide pt-0.5 w-7 shrink-0">To</span>
                                                                                                                <span className={`break-words ${svcTravel.toAddress && svcTravel.toAddress.trim() !== ',' ? 'text-gray-700' : 'text-red-400 italic'}`} title={svcTravel.toAddress}>
                                                                                                                    {svcTravel.toAddress && svcTravel.toAddress.trim() !== ',' ? svcTravel.toAddress : 'No property address — travel skipped'}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    {/* Error detail */}
                                                                                                    {svcTravel.error && (
                                                                                                        <div className="mt-1.5 px-2.5 py-1.5 bg-red-50 border border-red-200 rounded text-red-600">
                                                                                                            ⚠️ {svcTravel.errorMessage || 'Unknown calculation error'}
                                                                                                        </div>
                                                                                                    )}
                                                                                                    {svcTravel.isFallback && (
                                                                                                        <div className="mt-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded text-amber-700">
                                                                                                            ℹ️ {svcTravel.errorMessage}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            ) : !loadingTravelCosts.has(vg.vendorId) ? (
                                                                                                <div className="mt-3 pt-3 border-t border-dashed border-gray-100 text-xs text-gray-400 italic">
                                                                                                    ⏳ Travel not yet calculated
                                                                                                </div>
                                                                                            ) : null}
                                                                                        </div>
                                                                                    );
                                                                                })}
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

            {/* View Invoice Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center justify-between">
                            <span>Invoice #{viewingInvoice?.invoice_number}</span>
                            {viewingInvoice && (
                                <Button
                                    onClick={() => {
                                        const name = `Invoice_${viewingInvoice?.invoice_number || 'draft'}.pdf`;
                                        DownloadInvoicePdf('invoice-pdf-content', name);
                                    }}
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center gap-1.5"
                                >
                                    <Download className="w-4 h-4" /> Download PDF
                                </Button>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    {viewingInvoice ? (
                        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-inner space-y-6">
                            <InvoiceDocument
                                invoice={{
                                    ...viewingInvoice,
                                    items: viewingInvoice.lines?.map((line: any) => ({
                                        ...line,
                                        quantity: line.quantity || 1,
                                        unit_price: line.unit_price || line.amount,
                                    })) || []
                                }}
                                editData={{
                                    ...viewingInvoice,
                                    items: viewingInvoice.lines?.map((line: any) => ({
                                        ...line,
                                        quantity: line.quantity || 1,
                                        unit_price: line.unit_price || line.amount,
                                    })) || []
                                }}
                                isEditing={false}
                                updateItem={() => { }}
                                addItem={() => { }}
                                removeItem={() => { }}
                                updateTaxRate={() => { }}
                                setEditData={() => { }}
                                roleSettings={roleSettings}
                            />

                            {/* Hidden PDF component for high-accuracy capture */}
                            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                                <InvoicePdfDocument
                                    invoice={{
                                        ...viewingInvoice,
                                        items: viewingInvoice.lines?.map((line: any) => ({
                                            ...line,
                                            quantity: line.quantity || 1,
                                            unit_price: line.unit_price || line.amount,
                                        })) || []
                                    }}
                                    roleSettings={roleSettings}
                                />
                            </div>

                            {/* Line Items Breakdown (Task 2.2) */}
                            <div className="border-t pt-4">
                                <h4 className="font-semibold text-sm mb-3">Line Items Breakdown</h4>
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b bg-gray-50 text-gray-500 font-bold">
                                            <th className="text-left p-2">Description</th>
                                            <th className="text-center p-2">Type</th>
                                            <th className="text-right p-2">Quantity</th>
                                            <th className="text-right p-2">Unit Price</th>
                                            <th className="text-right p-2">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewingInvoice.lines?.map((line: any, idx: number) => (
                                            <tr key={idx} className="border-b text-gray-700">
                                                <td className="p-2">{line.description}</td>
                                                <td className="text-center p-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${line.type === 'travel' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {line.type?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="text-right p-2">{line.quantity || 1}</td>
                                                <td className="text-right p-2">${Number(line.unit_price || line.amount).toFixed(2)}</td>
                                                <td className="text-right p-2 font-semibold">${Number(line.amount).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Warning if no lines */}
                            {(!viewingInvoice.lines || viewingInvoice.lines.length === 0) && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                    ⚠️ No line items found. This invoice may not have travel costs recorded.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
                        </div>
                    )}
                </DialogContent>
            </Dialog>


        </div>
    );
};

export default Page;
