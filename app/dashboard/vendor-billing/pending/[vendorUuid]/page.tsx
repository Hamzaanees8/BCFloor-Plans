"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useLoadScript } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { vendorBillingService } from "../../VendorBillingService";
import { Info, Loader2, Save, X, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import InvoiceDocument from "@/app/dashboard/invoice/components/InvoiceDocument";
import { GetOne } from "@/app/dashboard/vendors/vendors";
import { Get } from "@/app/dashboard/orders/orders";
import { batchCalculateTravelCosts, buildTripChainLegs } from "@/lib/batchTravelCalculator";

const logBillingError = (context: string, message: string, extraData?: any) => {
    console.error(`[Billing Error] Context: ${context} | Message: ${message}`, {
        timestamp: new Date().toISOString(),
        ...extraData
    });
};

export default function PendingItemsPage() {
    const router = useRouter();
    const params = useParams();
    const vendorUuid = params.vendorUuid as string;

    const [loading, setLoading] = useState(true);
    const [editData, setEditData] = useState<any>(null);
    const [generating, setGenerating] = useState(false);
    const [taxError, setTaxError] = useState<string | null>(null);

    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];
    const headerBg = `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`;

    useLoadScript({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_PLACES_API_KEY || "",
        version: "3.64",
        libraries: ["places", "drawing"] as any
    });

    const fetchPendingItems = useCallback(async (token: string) => {
        try {
            // Fetch pending items, vendor details, and all orders
            const [pendingResponse, vendorDetailsRes, ordersRes] = await Promise.all([
                vendorBillingService.getPendingItems(vendorUuid, token),
                GetOne(vendorUuid),
                Get(token)
            ]);

            const vendorDetails = vendorDetailsRes?.data;
            const paymentPerKm = Number(vendorDetails?.settings?.payment_per_km ?? 0);
            const startLocation = vendorDetails?.addresses?.find((a: any) => a.type === 'start_location');
            const startLocationAddress = startLocation ? `${startLocation.address_line_1}, ${startLocation.city}, ${startLocation.country}` : "";

            // Map the items into our unified editable format
            const mappedItems: any[] = [];
            let subtotal = 0;
            
            // Create a map to track which orders need travel calculation
            const serviceToOrderMap: Record<string, any> = {};
            
            pendingResponse.items.forEach(item => {
                // 1. Service item
                const serviceAmount = parseFloat(String(item.service.amount || 0));
                mappedItems.push({
                    description: `${item.service?.service?.name || 'Service'} - Order #${item.service?.order?.id || ''} (${item.service?.order?.property?.property_address || (item.service?.order as any)?.property_address || ''})`,
                    quantity: 1,
                    unit_price: serviceAmount,
                    amount: serviceAmount,
                    type: 'service',
                    order_service_id: item.service?.uuid,
                    property_address: item.service?.order?.property?.property_address || (item.service?.order as any)?.property_address || ''
                });
                subtotal += serviceAmount;
                serviceToOrderMap[item.service.uuid] = item.service.order;
            });

            // Recalculate travel costs using the same logic as create/page.tsx
            const travelItems: any[] = [];
            let totalTravelCost = 0;
            let totalKm = 0;

            if (startLocationAddress && paymentPerKm > 0 && pendingResponse.items.length > 0) {
                const allOrders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
                const ordersToCalculateTravel: any[] = [];

                // Get unique property addresses from pending items
                const pendingOrderIds = new Set(pendingResponse.items.map(item => item.service?.order?.id).filter(Boolean));

                allOrders.forEach((order: any) => {
                    if (!pendingOrderIds.has(order.id)) return;

                    const vendorSlots = order.slots?.filter((s: any) => s.vendor_id === vendorUuid || s.vendor?.uuid === vendorUuid);
                    if (!vendorSlots || vendorSlots.length === 0) return;

                    ordersToCalculateTravel.push({
                        id: order.id,
                        address: order.property_address || order.property?.property_address || order.property?.address || '',
                        location: order.property_location || order.property?.property_location || '',
                        slots: vendorSlots,
                        hasTravelRequiredService: order.services?.some((s: any) => 
                            vendorSlots.some((slot: any) => String(slot.service_id) === String(s.service_id)) && 
                            (s.service?.is_travel_required || s.is_travel_required)
                        )
                    });
                });

                if (ordersToCalculateTravel.length > 0) {
                    // Group by date
                    const ordersByDate = new Map<string, any[]>();
                    ordersToCalculateTravel.forEach(o => {
                        const date = o.slots[0]?.date;
                        if (date) {
                            if (!ordersByDate.has(date)) ordersByDate.set(date, []);
                            ordersByDate.get(date)?.push(o);
                        }
                    });

                    // Calculate travel for each day using batch utility
                    for (const [date, dailyOrders] of Array.from(ordersByDate.entries())) {
                        dailyOrders.sort((a, b) => (a.slots[0]?.start_time || "").localeCompare(b.slots[0]?.start_time || ""));
                        
                        const travelOrdersForDay = dailyOrders.filter(o => o.hasTravelRequiredService);
                        if (travelOrdersForDay.length === 0) continue;

                        const routeSequence = travelOrdersForDay.map(o => `#${o.id}`).join(" → ");
                        console.log(`Travel route for ${date}:`, `Start → ${routeSequence} → Start`);

                        const addresses = travelOrdersForDay.map(o => o.address).filter(addr => addr);
                        if (addresses.length === 0) continue;

                        const tripLegs = buildTripChainLegs(startLocationAddress, addresses);

                        try {
                            const batchResult = await batchCalculateTravelCosts(tripLegs);
                            if (batchResult.status === "OK" || batchResult.status === "PARTIAL_FAILURE") {
                                const costForDay = batchResult.totalDistance * paymentPerKm;
                                totalTravelCost += costForDay;
                                totalKm += batchResult.totalDistance;
                            } else {
                                console.error(`Batch travel calculation failed completely for ${date}:`, batchResult.status);
                                logBillingError("pending_items_batch_calculation_failed", `Batch calculation failed with status ${batchResult.status}`, {
                                    date,
                                    vendorUuid,
                                    tripLegsCount: tripLegs.length
                                });
                            }
                        } catch (e: any) {
                            console.error("Exception in batch travel calculation:", e);
                            logBillingError("pending_items_batch_calculation_exception", e.message || "Exception in batch calculation", {
                                date,
                                vendorUuid,
                                tripLegsCount: tripLegs.length
                            });
                        }
                    }

                    if (totalTravelCost > 0) {
                        travelItems.push({
                            description: `Travel Compensation (${totalKm.toFixed(2)} km)`,
                            quantity: 1,
                            unit_price: totalTravelCost.toFixed(2),
                            amount: totalTravelCost.toFixed(2),
                            type: 'travel'
                        });
                        subtotal += totalTravelCost;
                    }
                }
            }

            // Combine all items
            const allItems = [...mappedItems, ...travelItems];

            // Read tax rate and details from vendor profile settings
            let taxRate = 0;
            let taxType = "Tax";
            let taxSnapshot: any = null;
            const calculatedTaxError: string | null = null;

            if (vendorDetails?.settings?.tax_enabled) {
                taxRate = parseFloat(vendorDetails.settings.tax_rate) || 0;
                taxType = vendorDetails.settings.tax_type || "Tax";
                const taxNumber = vendorDetails.settings.tax_number || "";
                
                taxSnapshot = {
                    total_rate: taxRate,
                    is_registered: !!taxNumber,
                    tax_number: taxNumber,
                    taxes: taxType ? [{ name: taxType, rate: taxRate }] : [],
                    snapshotted_at: new Date().toISOString()
                };
            }

            const taxAmount = subtotal * (taxRate / 100);

            // Set up invoice data object
            setEditData({
                vendor: pendingResponse.vendor,
                invoice_number: 'DRAFT',
                created_at: new Date().toISOString(),
                status: 'draft',
                items: allItems,
                tax_rate: taxRate,
                tax_type: taxType,
                travel_amount: parseFloat(totalTravelCost.toFixed(2)),
                subtotal: subtotal.toFixed(2),
                tax_amount: taxAmount.toFixed(2),
                total: (subtotal + taxAmount).toFixed(2),
                notes: "",
                tax_snapshot: taxSnapshot
            });

            if (calculatedTaxError) {
                setTaxError(calculatedTaxError);
            }

            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch pending items:", err);
            toast.error("Failed to load pending items");
            setLoading(false);
        }
    }, [vendorUuid]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        fetchPendingItems(token);
    }, [router, fetchPendingItems]);

    // Same math handlers as the modal editor
    const recalculateTotals = (items: any[], taxRate: number) => {
        const subtotal = items.reduce(
            (acc: number, item: any) =>
                acc + (parseFloat(item.quantity) * parseFloat(item.unit_price) || 0),
            0
        );
        const taxAmount = subtotal * (taxRate / 100);
        return {
            subtotal: subtotal.toFixed(2),
            tax_amount: taxAmount.toFixed(2),
            total: (subtotal + taxAmount).toFixed(2),
        };
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...editData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        const totals = recalculateTotals(newItems, parseFloat(editData.tax_rate));
        setEditData({ ...editData, items: newItems, ...totals });
    };

    const addItem = () => {
        const newItem = {
            description: '',
            quantity: 1,
            unit_price: 0,
            amount: 0,
            type: 'service',
            order_service_id: null,
        };
        const newItems = [...editData.items, newItem];
        const totals = recalculateTotals(newItems, parseFloat(editData.tax_rate));
        setEditData({ ...editData, items: newItems, ...totals });
    };

    const removeItem = (index: number) => {
        const newItems = editData.items.filter((_: any, i: number) => i !== index);
        const totals = recalculateTotals(newItems, parseFloat(editData.tax_rate));
        setEditData({ ...editData, items: newItems, ...totals });
    };

    const updateTaxRate = (val: string) => {
        const rate = parseFloat(val) || 0;
        const totals = recalculateTotals(editData.items, rate);
        setEditData({ ...editData, tax_rate: val, ...totals });
    };

    const updateTaxType = (val: string) => {
        setEditData({ ...editData, tax_type: val });
    };

    const handleGenerateInvoice = async () => {
        if (!editData || editData.items.length === 0) {
            toast.error("Your invoice must have at least one valid item.");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) return;

        setGenerating(true);
        try {
            // STEP 1: Find all distinct order_service_uuids still remaining in the customized item array
            // This is required to signal the backend which original services were accepted onto this bill
            const keptOrderServiceIds = editData.items
                .map((item: any) => item.order_service_id)
                .filter((id: any) => id !== null && id !== undefined);

            const uniqueServiceIds = Array.from(new Set(keptOrderServiceIds)) as string[];

            if (uniqueServiceIds.length === 0) {
                // Warning note: If they removed ALL original services, we still must pass something or use the manual endpoint
                // Assuming it might fail without uuids. But typically they should have at least one.
            }

            // STEP 2: Issue generation call — travel_amount sent as a top-level field
            // so the backend saves it directly to vendor_invoices.travel_amount
            const travelItem = editData.items.find((item: any) => item.type === 'travel');
            const travelAmount = travelItem ? parseFloat(String(travelItem.amount)) : (editData.travel_amount ?? 0);

            const generatePayload = {
                vendor_uuid: vendorUuid,
                order_service_uuids: uniqueServiceIds,
                notes: editData.notes,
                tax_rate: editData.tax_rate,
                tax_type: editData.tax_type,
                tax_number: editData.tax_snapshot?.tax_number,
                travel_amount: parseFloat(travelAmount.toFixed(2)),
                tax_snapshot: editData.tax_snapshot
            };

            await vendorBillingService.generateInvoice(generatePayload, token);

            toast.success("Invoice generated successfully!");
            router.push('/dashboard/vendor-billing?resume_payment=true');
        } catch (err: any) {
            console.error("Failed to generate and map customized invoice:", err);
            logBillingError("invoice_generation_exception", err.response?.data?.message || err.message || "Failed to generate customized invoice", {
                vendorUuid,
                errorResponse: err.response?.data
            });
            toast.error(err.response?.data?.message || "Failed to generate customized invoice");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="font-alexandria pb-24 overflow-x-hidden" style={{ backgroundColor: roleSettings.pageBg, minHeight: '100vh' }}>
            <div className="sticky top-0 z-40 w-full min-h-[80px] py-3 md:py-0 md:h-[80px] flex flex-col md:flex-row md:items-center justify-between gap-3 px-3 md:px-[20px] border-b bg-white" style={{ backgroundColor: headerBg, boxShadow: "0px 4px 4px #0000001F" }}>
                <div className="flex items-center gap-2 md:gap-4 truncate w-full md:w-auto min-w-0">
                    <h1 className="text-[15px] md:text-[24px] font-[400] tracking-tight shrink-0 hidden sm:block" style={{ color: roleSettings.pageTabColor }}>Review & Map Billing › </h1>
                    <h1 className="text-[15px] md:text-[24px] font-[400] tracking-tight shrink-0 sm:hidden" style={{ color: roleSettings.pageTabColor }}>Review Billing › </h1>
                    <p className="text-[15px] md:text-[24px] opacity-80 truncate min-w-0" style={{ color: roleSettings.pageTabColor }}>
                        {editData?.vendor?.company_name || `${editData?.vendor?.first_name || ''} ${editData?.vendor?.last_name || ''}`}
                    </p>
                </div>
                <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto shrink-0 min-w-0">
                    <Button 
                        variant="default" 
                        className="bg-white/10 hover:bg-white/20 text-white border-0 flex-1 md:flex-none h-9 md:h-10 text-[11px] md:text-sm px-2 md:px-4 min-w-0"
                        onClick={() => router.push('/dashboard/vendor-billing')}
                        disabled={generating}
                    >
                        <X className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 shrink-0" /> <span className="truncate">Cancel</span>
                    </Button>
                    <Button 
                        className="text-white hover:brightness-110 active:scale-[0.98] transition-all border-0 shadow-lg flex-[2] md:flex-none h-9 md:h-10 text-[11px] md:text-sm px-2 md:px-4 min-w-0"
                        style={{ backgroundColor: roleSettings.pageTabColor }}
                        onClick={handleGenerateInvoice}
                        disabled={generating || !editData}
                    >
                        {generating ? <Loader2 className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin shrink-0" /> : <Save className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 shrink-0" />}
                        <span className="truncate">Generate Invoice</span>
                    </Button>
                </div>
            </div>

            <div className="p-6 max-w-7xl mx-auto space-y-6">
                 <Card className="border shadow-none" style={{ backgroundColor: `${roleSettings.pageTabColor}0A`, borderColor: `${roleSettings.pageTabColor}30` }}>
                    <CardContent className="p-4 flex gap-3">
                        <Info className="h-5 w-5 shrink-0 mt-0.5" style={{ color: roleSettings.pageTabColor }} />
                        <div className="text-sm leading-relaxed text-gray-700">
                            <strong>Review and Edit Pending Invoice:</strong> The services shown below were automatically calculated. You may freely map or remap the prices, alter descriptions, override tax calculations, and manually append miscellaneous costs prior to confirming final invoice generation. To remove an item from being billed, simply delete it from this list.
                        </div>
                    </CardContent>
                </Card>

                {taxError && (
                    <Card className="border shadow-none bg-red-50 border-red-200">
                        <CardContent className="p-4 flex gap-3">
                            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
                            <div className="text-sm leading-relaxed text-red-800">
                                <strong>Tax Calculation Error:</strong> {taxError}. You can manually set the tax rate above.
                            </div>
                        </CardContent>
                    </Card>
                )}

                {loading ? (
                    <div className="space-y-4 max-w-4xl mx-auto">
                        <Skeleton className="h-[200px] w-full" />
                        <Skeleton className="h-[400px] w-full" />
                    </div>
                ) : editData && (
                    <div className="py-2 animate-in fade-in zoom-in-95 duration-500">
                         <InvoiceDocument
                            invoice={editData}
                            editData={editData}
                            isEditing={true}
                            updateItem={updateItem}
                            addItem={addItem}
                            removeItem={removeItem}
                            updateTaxRate={updateTaxRate}
                            updateTaxType={updateTaxType}
                            setEditData={setEditData}
                            roleSettings={roleSettings}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
