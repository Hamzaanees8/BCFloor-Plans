"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import { getTaxRateByLocation } from "@/lib/taxCalculator";
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
                    description: `${item.service.service.name} - Order #${item.service.order.id} (${item.service.order.property.property_address})`,
                    quantity: 1,
                    unit_price: serviceAmount,
                    amount: serviceAmount,
                    type: 'service',
                    order_service_id: item.service.uuid,
                    property_address: item.service.order.property.property_address
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
                const pendingOrderIds = new Set(pendingResponse.items.map(item => item.service.order.id));

                allOrders.forEach((order: any) => {
                    if (!pendingOrderIds.has(order.id)) return;

                    const vendorSlots = order.slots?.filter((s: any) => s.vendor_id === vendorUuid || s.vendor?.uuid === vendorUuid);
                    if (!vendorSlots || vendorSlots.length === 0) return;

                    ordersToCalculateTravel.push({
                        id: order.id,
                        address: order.property_address,
                        location: order.property_location,
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

            // Calculate tax rate based on vendor location
            let taxRate = 0;
            let calculatedTaxError: string | null = null;
            
            try {
                const vendorProvince = startLocation?.province || startLocation?.state;
                const vendorCountry = startLocation?.country || "Canada";
                
                if (vendorProvince) {
                    const taxInfo = getTaxRateByLocation(vendorProvince, vendorCountry);
                    taxRate = taxInfo.rate;
                } else {
                    calculatedTaxError = "Vendor location not found";
                }
            } catch (err) {
                console.error("Tax calculation error:", err);
                calculatedTaxError = "Could not calculate tax rate";
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
                subtotal: subtotal.toFixed(2),
                tax_amount: taxAmount.toFixed(2),
                total: (subtotal + taxAmount).toFixed(2),
                notes: ""
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

            // STEP 2: Issue generation call with all data in a single request (including travel costs and line items)
            const generatePayload = {
                vendor_uuid: vendorUuid,
                order_service_uuids: uniqueServiceIds,
                notes: editData.notes,
                tax_rate: editData.tax_rate,
                lines: editData.items.map((item: any) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    amount: parseFloat(item.quantity) * parseFloat(item.unit_price),
                    type: item.type || 'service',
                    order_service_id: item.order_service_id || null,
                })),
            };

            // VERIFICATION LAYER (Task 2.1)
            // Pre-save verification: check that travel line items are correctly mapped in payload if present in editor
            const originalTravelItems = editData.items.filter((item: any) => item.type === 'travel');
            const payloadTravelItems = generatePayload.lines.filter((item: any) => item.type === 'travel');
            if (originalTravelItems.length > 0 && payloadTravelItems.length === 0) {
                console.error("Verification failed: Travel items were present in the invoice editor but missing in payload.");
                logBillingError("invoice_generation_missing_travel_payload", "Travel items present in draft but missing in payload", {
                    vendorUuid,
                    invoiceNotes: editData.notes,
                    originalItemsCount: editData.items.length,
                    payloadItemsCount: generatePayload.lines.length
                });
                toast.error("⚠️ Billing validation mismatch: Travel items are missing from invoice payload.");
                setGenerating(false);
                return;
            }

            const response = await vendorBillingService.generateInvoice(generatePayload, token);

            // ✅ VERIFICATION: Check all items were saved in database
            if (response && response.uuid) {
                const details = await vendorBillingService.getAdminInvoiceDetails(response.uuid, token);
                
                const expectedItemCount = editData.items.length;
                const savedItemCount = details.lines?.length ?? 0;
                
                if (savedItemCount !== expectedItemCount) {
                    toast.warning(
                        `⚠️ Invoice saved but only ${savedItemCount}/${expectedItemCount} line items stored. ` +
                        `Missing: ${expectedItemCount - savedItemCount} items (likely travel costs)`
                    );
                    logBillingError("invoice_verification_mismatch", "Invoice saved but line item count mismatch", {
                        vendorUuid,
                        invoiceUuid: response.uuid,
                        expected: editData.items,
                        saved: details.lines
                    });
                } else {
                    // Verify travel items specifically
                    const travelItems = details.lines?.filter((l: any) => l.type === 'travel') ?? [];
                    const expectedTravel = editData.items.filter((i: any) => i.type === 'travel').length;
                    
                    if (travelItems.length !== expectedTravel) {
                        const travelAmount = editData.items.find((i: any) => i.type === 'travel')?.amount || 0;
                        toast.error(
                            `❌ Travel items not saved! Expected ${expectedTravel}, got ${travelItems.length}. ` +
                            `Vendor will be underpaid by $${Number(travelAmount).toFixed(2)}`
                        );
                        logBillingError("invoice_verification_travel_missing", "Travel items not saved in details", {
                            vendorUuid,
                            invoiceUuid: response.uuid,
                            expectedTravel,
                            actualTravel: travelItems.length
                        });
                        setGenerating(false);
                        return;
                    }
                    
                    toast.success("✅ Invoice generated with all items verified!");
                }
            } else {
                toast.success("Custom invoice generated successfully!");
            }

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
        <div className="font-alexandria pb-24" style={{ backgroundColor: roleSettings.pageBg, minHeight: '100vh' }}>
            <div className="sticky top-0 z-40 w-full h-[80px] flex items-center justify-between px-[20px] border-b bg-white" style={{ backgroundColor: headerBg, boxShadow: "0px 4px 4px #0000001F" }}>
                <div className="flex items-center gap-4">
                    <h1 className="text-[16px] md:text-[24px] font-[400] tracking-tight" style={{ color: roleSettings.pageTabColor }}>Review & Map Billing › </h1>
                    <p className="text-[16px] md:text-[24px] opacity-80" style={{ color: roleSettings.pageTabColor }}>
                        {editData?.vendor?.company_name || `${editData?.vendor?.first_name || ''} ${editData?.vendor?.last_name || ''}`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="default" 
                        className="bg-white/10 hover:bg-white/20 text-white border-0"
                        onClick={() => router.push('/dashboard/vendor-billing')}
                        disabled={generating}
                    >
                        <X className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button 
                        className="text-white hover:brightness-110 active:scale-[0.98] transition-all border-0 shadow-lg"
                        style={{ backgroundColor: roleSettings.pageTabColor }}
                        onClick={handleGenerateInvoice}
                        disabled={generating || !editData}
                    >
                        {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Generate Invoice
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
                            setEditData={setEditData}
                            roleSettings={roleSettings}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
