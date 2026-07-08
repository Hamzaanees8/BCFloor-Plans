"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save, X, Plus } from "lucide-react";
import { SearchableSelect } from "@/app/dashboard/orders/components/SearchableSelect";
import { Get, GetVendors } from "../../orders/orders";
import { GetOne } from "../../vendors/vendors";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { useAppContext } from "@/app/context/AppContext";
import { CreateInvoice } from "../../invoice/invoice_api";
import InvoiceDocument from "../../invoice/components/InvoiceDocument";
import { batchCalculateTravelCosts, buildTripChainLegs, calculateTravelCostFromBatch } from "@/lib/batchTravelCalculator";



const CreateVendorInvoicePage = () => {
    const router = useRouter();
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || "admin";
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings["admin"];
    const headerBg = `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`;

    const [vendors, setVendors] = useState<any[]>([]);
    const [loadingVendors, setLoadingVendors] = useState(true);
    const [selectedVendorUuid, setSelectedVendorUuid] = useState<string>("");
    const [selectedVendor, setSelectedVendor] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(false);
    const [saving, setSaving] = useState(false);
    const [vendorTaxInfo, setVendorTaxInfo] = useState<any>(null);

    const [editData, setEditData] = useState<any>({
        items: [],
        subtotal: "0.00",
        tax_rate: "13.00", 
        tax_amount: "0.00",
        total: "0.00",
        notes: ""
    });

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        setLoadingVendors(true);
        GetVendors(token)
            .then(res => setVendors(Array.isArray(res.data) ? res.data : []))
            .catch(() => toast.error("Failed to load vendors"))
            .finally(() => setLoadingVendors(false));
    }, []);

    const vendorOptions = useMemo(() => {
        return vendors.map(v => ({
            label: `${v.first_name} ${v.last_name} ${v.company?.name ? `(${v.company.name})` : ""}`,
            value: v.uuid
        }));
    }, [vendors]);

    const recalulateTotals = (items: any[], taxRate: number) => {
        const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.quantity) * parseFloat(item.unit_price) || 0), 0);
        const taxAmount = subtotal * (taxRate / 100);
        return {
            subtotal: subtotal.toFixed(2),
            tax_amount: taxAmount.toFixed(2),
            total: (subtotal + taxAmount).toFixed(2)
        };
    };

    const handleVendorChange = async (uuid: string) => {
        setSelectedVendorUuid(uuid);
        const vendor = vendors.find(v => v.uuid === uuid);
        setSelectedVendor(vendor);
        if (!uuid) return;

        setLoadingData(true);
        const token = localStorage.getItem("token") || "";

        try {
            // Fetch ALL orders and vendor details (for settings)
            const [ordersRes, vendorDetailsRes] = await Promise.all([
                Get(token),
                GetOne(uuid)
            ]);

            const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
            const vendorDetails = vendorDetailsRes?.data;
            
            // SET TAX RATE BASED ON VENDOR SETTINGS
            let autoTaxRate = 0.0;
            let autoTaxType = "None";
            let taxInfo: any = { province: "", country: "", taxType: "Tax Exempt", isRegistered: false, tax_number: "Pending" };
            let currentTaxSnapshot: any = null;
            
            if (vendorDetails?.settings?.tax_enabled && !vendorDetails?.settings?.tax_exempt) {
                const s = vendorDetails.settings;
                autoTaxRate = s.tax_rate !== undefined && s.tax_rate !== null ? Number(s.tax_rate) : 13.0;
                
                if (s.tax_country === "US") {
                    autoTaxType = "US Sales Tax";
                } else {
                    const typeMap: Record<string, string> = {
                        "GST_HST": "GST/HST",
                        "GST_PST": "GST + PST",
                        "GST_QST": "GST + QST",
                        "GST": "GST"
                    };
                    autoTaxType = typeMap[s.tax_type] || s.tax_type || "GST/HST";
                }

                const isRegistered = true;
                const taxNumberStr = vendorDetails.tax_number || s.tax_number_gst_hst || s.tax_number_us || "Pending";

                taxInfo = {
                    province: "",
                    country: s.tax_country === "US" ? "USA" : "Canada",
                    taxType: `${autoTaxType} (${autoTaxRate}%)`,
                    isRegistered: isRegistered,
                    tax_number: taxNumberStr
                };

                currentTaxSnapshot = {
                    taxes: [{ name: autoTaxType, rate: autoTaxRate }],
                    total_rate: autoTaxRate,
                    location: { country: s.tax_country === "US" ? "USA" : "Canada", province: "", city: "" },
                    is_registered: isRegistered,
                    tax_number: taxNumberStr,
                    snapshotted_at: new Date().toISOString()
                };
            }
            setVendorTaxInfo(taxInfo);
            
            const paymentPerKm = Number(vendorDetails?.settings?.payment_per_km ?? 0);
            const startLocation = vendorDetails?.addresses?.find((a: any) => a.type === 'start_location');
            const startLocationAddress = startLocation ? `${startLocation.address_line_1}, ${startLocation.city}, ${startLocation.country}` : "";

            // Build vendor price map
            const vendorPriceLookup: Record<string, number> = {};
            const vServices = vendorDetails?.vendor_services || vendorDetails?.services || [];
            
            vServices.forEach((vs: any) => {
                vs.options?.forEach((opt: any) => {
                    const price = Number(opt.vendor_price);
                    if (!isNaN(price)) {
                        if (opt.option_id) vendorPriceLookup[String(opt.option_id)] = price;
                        if (opt.uuid) vendorPriceLookup[String(opt.uuid)] = price;
                    }
                });
            });

            // Find unpaid services for this vendor
            const unpaidServices: any[] = [];
            const ordersToCalculateTravel: any[] = [];

            orders.forEach((order: any) => {
                const vendorSlots = order.slots?.filter((s: any) => s.vendor_id === uuid || s.vendor?.uuid === uuid);
                if (!vendorSlots || vendorSlots.length === 0) return;

                // Group slots by service
                const serviceIds = Array.from(new Set(vendorSlots.map((s: any) => s.service_id)));
                
                serviceIds.forEach((sid) => {
                    const svcRecord = order.services?.find((s: any) => 
                        (String(s.service_id) === String(sid) || s.service?.id === Number(sid)) &&
                        !s.vendor_payment
                    );
                    
                    if (!svcRecord) return;

                    let finalAmount = 0; // Default to 0 for vendors
                    const vPrice = svcRecord.option_id ? vendorPriceLookup[String(svcRecord.option_id)] : undefined;
                    
                    if (vPrice !== undefined) {
                        finalAmount = vPrice;
                    } else {
                        console.warn(`No vendor price found for service ${sid} / option ${svcRecord.option_id}. Using 0.`);
                    }

                    unpaidServices.push({
                        description: `${svcRecord.service?.name || 'Service'} - ${order.property_address || 'No Address'}`,
                        quantity: 1,
                        unit_price: finalAmount.toFixed(2),
                        amount: finalAmount.toFixed(2),
                        order_service_uuid: svcRecord.uuid,
                        date: vendorSlots.find((s: any) => s.service_id === sid)?.date,
                        property_address: order.property_address,
                        property_location: order.property_location,
                        is_travel_required: svcRecord.service?.is_travel_required || svcRecord.is_travel_required,
                        orderId: order.id,
                        order_uuid: order.uuid,
                        property_uuid: order.property?.uuid,
                        actual_service_uuid: svcRecord.service?.uuid
                    });
                });

                // If any of the services in this order for this vendor are unpaid, include for travel
                const hasUnpaidServiceForVendor = order.services?.some((s: any) => 
                    vendorSlots.some((slot: any) => String(slot.service_id) === String(s.service_id)) && 
                    !s.vendor_payment
                );

                if (vendorSlots.length > 0 && hasUnpaidServiceForVendor) {
                    ordersToCalculateTravel.push({
                        id: order.id,
                        address: order.property_address,
                        location: order.property_location,
                        slots: vendorSlots,
                        hasTravelRequiredService: order.services?.some((s: any) => 
                            vendorSlots.some((slot: any) => String(slot.service_id) === String(s.service_id)) && 
                            (s.service?.is_travel_required || s.is_travel_required) &&
                            !s.vendor_payment
                        )
                    });
                }
            });

            // Calculate Travel Costs - BATCHED VERSION (1 API call instead of N)
            const travelItems: any[] = [];
            let totalTravelCost = 0;
            let totalKm = 0;
            const travelFailures: string[] = [];

            if (startLocationAddress && paymentPerKm > 0 && ordersToCalculateTravel.length > 0) {
                // Group by date
                const ordersByDate = new Map<string, any[]>();
                ordersToCalculateTravel.forEach(o => {
                    const date = o.slots[0].date;
                    if (!ordersByDate.has(date)) ordersByDate.set(date, []);
                    ordersByDate.get(date)?.push(o);
                });

                for (const [date, dailyOrders] of Array.from(ordersByDate.entries())) {
                    dailyOrders.sort((a, b) => (a.slots[0].start_time || "").localeCompare(b.slots[0].start_time || ""));
                    
                    // Get orders with travel required
                    const travelOrders = dailyOrders.filter(o => o.hasTravelRequiredService);
                    if (travelOrders.length === 0) continue;

                    // Log route sequence for audit trail
                    const routeSequence = travelOrders.map(o => `#${o.id}`).join(" → ");
                    console.log(`🚗 Travel route for ${date}:`, `Start → ${routeSequence} → Start`);

                    // Build trip chain: [Vendor, Job1, Job2, Job3]
                    const orderAddresses = travelOrders.map(o => o.address);
                    const tripLegs = buildTripChainLegs(startLocationAddress, orderAddresses);

                    console.log(`📍 Batching ${tripLegs.length} legs in 1 Google Maps API call...`);

                    try {
                        // SINGLE BATCH CALL for all legs on this day!
                        const batchResult = await batchCalculateTravelCosts(tripLegs);

                        if (batchResult.status === "OK" || batchResult.status === "PARTIAL_FAILURE") {
                            const costInfo = calculateTravelCostFromBatch(batchResult, paymentPerKm);
                            totalKm += costInfo.distance;
                            totalTravelCost += costInfo.cost;

                            if (batchResult.failedLegs.length > 0) {
                                const failedAddrs = batchResult.failedLegs
                                    .map(fl => `${fl.from.substring(0, 30)}... to ${fl.to.substring(0, 30)}...`)
                                    .join("; ");
                                travelFailures.push(`${date}: ${failedAddrs}`);
                                console.warn(`⚠️ ${batchResult.failedLegs.length} legs failed on ${date}`);
                            }
                        } else {
                            // Total failure for this day
                            console.error(`❌ Travel calculation failed completely for ${date}`);
                            travelFailures.push(`${date}: All legs failed - ${batchResult.failedLegs[0]?.status || 'unknown error'}`);
                        }
                    } catch (e) {
                        console.error(`❌ Exception calculating travel for ${date}:`, e);
                        travelFailures.push(`${date}: Exception occurred`);
                    }
                }

                if (totalTravelCost > 0) {
                    const description = travelFailures.length > 0
                        ? `Travel Compensation (${totalKm.toFixed(2)} km) ⚠️`
                        : `Travel Compensation (${totalKm.toFixed(2)} km)`;

                    travelItems.push({
                        description,
                        quantity: 1,
                        unit_price: totalTravelCost.toFixed(2),
                        amount: totalTravelCost.toFixed(2),
                        hasWarnings: travelFailures.length > 0,
                        warnings: travelFailures
                    });
                }

                if (travelFailures.length > 0) {
                    toast.warning(`Travel calculation: ${travelFailures.length} issues detected. Please review.`);
                }
            }

            const allItems = [...unpaidServices, ...travelItems];
            const totals = recalulateTotals(allItems, autoTaxRate);
            setEditData({
                items: allItems,
                tax_rate: autoTaxRate.toFixed(2),
                tax_type: autoTaxType,
                tax_number: currentTaxSnapshot?.tax_number || vendorDetails?.tax_number || "",
                subtotal: totals.subtotal,
                tax_amount: totals.tax_amount,
                total: totals.total,
                notes: editData.notes,
                tax_snapshot: currentTaxSnapshot
            });

        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch unpaid services");
        } finally {
            setLoadingData(false);
        }
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...editData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        const totals = recalulateTotals(newItems, parseFloat(editData.tax_rate));
        setEditData({ ...editData, items: newItems, ...totals });
    };

    const addItem = () => {
        const newItem = { description: "", quantity: 1, unit_price: 0, amount: "0.00" };
        const newItems = [...editData.items, newItem];
        const totals = recalulateTotals(newItems, parseFloat(editData.tax_rate));
        setEditData({ ...editData, items: newItems, ...totals });
    };

    const removeItem = (index: number) => {
        const newItems = editData.items.filter((_: any, i: number) => i !== index);
        const totals = recalulateTotals(newItems, parseFloat(editData.tax_rate));
        setEditData({ ...editData, items: newItems, ...totals });
    };

    const updateTaxRate = (val: string) => {
        const rate = parseFloat(val) || 0;
        const totals = recalulateTotals(editData.items, rate);
        setEditData({ ...editData, tax_rate: val, ...totals });
    };

    const updateTaxType = (val: string) => {
        setEditData({ ...editData, tax_type: val });
    };

    const handleSave = async () => {
        if (!selectedVendorUuid) {
            toast.error("Please select a vendor first");
            return;
        }

        if (editData.items.length === 0) {
            toast.error("No items in invoice");
            return;
        }

        setSaving(true);
        try {
            // Use the first item's order/property if available, or omit
            
            const payload = {
                vendor_uuid: selectedVendorUuid,
                notes: editData.notes,
                tax_rate: editData.tax_rate,
                tax_type: editData.tax_type,
                tax_number: editData.tax_number,
                tax_amount: editData.tax_amount,
                subtotal: editData.subtotal,
                tax_snapshot: editData.tax_snapshot,
                items: editData.items.map((item: any) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    amount: item.amount,
                    order_service_uuid: item.order_service_uuid,
                    order_uuid: item.order_uuid,
                    property_uuid: item.property_uuid,
                    actual_service_uuid: item.actual_service_uuid
                }))
            };
            
            const res = await CreateInvoice(payload);
            toast.success("Vendor invoice created successfully");
            router.push(`/dashboard/invoice/${res.data.uuid}`);
        } catch (err: any) {
            toast.error(err.message || "Failed to create invoice");
        } finally {
            setSaving(false);
        }
    };

    const mockInvoice = selectedVendor ? {
        invoice_number: "NEW",
        created_at: new Date().toISOString(),
        status: "draft",
        vendor: selectedVendor
    } : null;

    return (
        <div className="overflow-x-hidden" style={{ backgroundColor: roleSettings.pageBg, minHeight: "100vh" }}>
            <div className="sticky top-0 z-50 flex flex-col md:flex-row min-h-[80px] py-3 md:py-0 md:h-[80px] md:items-center justify-between gap-3 px-[20px] font-alexandria"
                style={{ backgroundColor: headerBg, boxShadow: "0px 4px 4px #0000001F" }}>
                <div className="flex items-center gap-4 truncate min-w-0">
                    <h1 className="text-[16px] md:text-[24px] font-[400] truncate min-w-0" style={{ color: roleSettings.pageTabColor }}>
                        Create Vendor Invoice
                    </h1>
                </div>
                <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto shrink-0 min-w-0">
                    <Button
                        variant="outline"
                        className="bg-white text-black hover:bg-gray-100 border-none h-[35px] md:h-[44px] px-2 md:px-6 rounded-[6px] flex-1 md:flex-none text-[11px] md:text-sm min-w-0"
                        onClick={() => router.back()}
                        disabled={saving}
                    >
                        <X className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 shrink-0" /> <span className="truncate">Cancel</span>
                    </Button>
                    <Button
                        className="text-white h-[35px] md:h-[44px] px-2 md:px-6 rounded-[6px] hover:brightness-110 active:scale-[0.98] transition-all flex-[2] md:flex-none text-[11px] md:text-sm min-w-0"
                        style={{ backgroundColor: roleSettings.pageTabColor }}
                        onClick={handleSave}
                        disabled={saving || !selectedVendorUuid || loadingData}
                    >
                        {saving ? <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin mr-1 md:mr-2 shrink-0" /> : <Save className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 shrink-0" />} 
                        <span className="truncate">Create Invoice</span>
                    </Button>
                </div>
            </div>

            <div className="mx-auto max-w-5xl p-6 md:p-12 relative font-alexandria">
                <div className="mb-10 mx-auto max-w-[800px] bg-white p-8 rounded-xl shadow-lg border border-gray-100 flex flex-col gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-[0.2em]">Select Vendor</label>
                        <SearchableSelect
                            options={vendorOptions}
                            value={selectedVendorUuid}
                            onChange={handleVendorChange}
                            placeholder={loadingVendors ? "Loading vendors..." : "Search and select a vendor"}
                            searchPlaceholder="Search vendor..."
                        />
                    </div>

                    {vendorTaxInfo && selectedVendorUuid && (
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                            <div className="flex items-start gap-3">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-700 mb-1">📍 Tax Location</p>
                                    <p className="text-xs text-gray-600 mb-3">{vendorTaxInfo.province}, {vendorTaxInfo.country}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-indigo-700">💳 {vendorTaxInfo.taxType}</p>
                                        {vendorTaxInfo.isRegistered ? (
                                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Registered ({vendorTaxInfo.tax_number})</span>
                                        ) : (
                                            <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Not Registered</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {loadingData ? (
                    <div className="py-32 text-center">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-400">Fetching unpaid services and calculating costs...</p>
                    </div>
                ) : !selectedVendorUuid ? (
                    <div className="py-32 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white/50 backdrop-blur-sm">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Plus className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-400 text-lg">Select a vendor above to generate the invoice</p>
                    </div>
                ) : (
                    <InvoiceDocument
                        invoice={mockInvoice}
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
                )}
            </div>
        </div>
    );
};

export default CreateVendorInvoicePage;
