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
import { batchCalculateTravelCosts } from "@/lib/batchTravelCalculator";
import { getTaxRateByLocation } from "@/lib/taxCalculator";
import PayPeriodFilter, { getPayPeriodPresets } from "../../components/PayPeriodFilter";

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
    const [taxError] = useState<string | null>(null);

    // Billing Cycle Date Range filter state (Default: Current 15-day Pay Period cycle)
    const initialPreset = getPayPeriodPresets()[0];
    const [startDate, setStartDate] = useState<string>(() => initialPreset?.startDate || "");
    const [endDate, setEndDate] = useState<string>(() => initialPreset?.endDate || "");

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
            setLoading(true);
            const filters: { start_date?: string; end_date?: string } = {};
            if (startDate) filters.start_date = startDate;
            if (endDate) filters.end_date = endDate;

            // Fetch pending items, vendor details, and all orders
            const [pendingResponse, vendorDetailsRes, ordersRes] = await Promise.all([
                vendorBillingService.getPendingItems(vendorUuid, token, filters),
                GetOne(vendorUuid),
                Get(token)
            ]);

            const vendorDetails = vendorDetailsRes?.data;
            const paymentPerKm = Number(vendorDetails?.settings?.payment_per_km ?? 0);
            const startLocation = vendorDetails?.addresses?.find((a: any) => a.type === 'start_location');
            const rawCountry = startLocation?.country || "";
            const normalizedCountry = rawCountry.trim().toUpperCase() === 'CA' ? 'Canada' : rawCountry.trim().toUpperCase() === 'US' ? 'USA' : rawCountry;
            const startLocationAddress = startLocation ? `${startLocation.address_line_1}, ${startLocation.city}, ${normalizedCountry}` : "";

            const allOrdersList = Array.isArray(ordersRes.data) ? ordersRes.data : [];

            // Map the items into detailed editable format (with Order ID, Address, Slot Date/Time, Service Option)
            const mappedItems: any[] = [];
            const serviceToOrderMap: Record<string, any> = {};

            pendingResponse.items.forEach(item => {
                const serviceAmount = item.vendor_pay_amount !== undefined ? Number(item.vendor_pay_amount) : parseFloat(String(item.service.amount || 0));

                const svcObj = (item.service as any)?.service || {};
                const svcName = svcObj.name || 'Service';
                const optionTitle = (item.service as any)?.option?.title || (item.service as any)?.service_option?.title || '';
                const fullSvcTitle = optionTitle ? `${svcName} - ${optionTitle}` : svcName;

                const orderIdVal = item.service?.order?.id;
                const propAddress = item.service?.order?.property?.property_address || (item.service?.order as any)?.property_address || '';

                const descParts = [fullSvcTitle];
                if (propAddress && orderIdVal) {
                    descParts.push(`${propAddress} (Order #${orderIdVal})`);
                } else if (propAddress) {
                    descParts.push(propAddress);
                } else if (orderIdVal) {
                    descParts.push(`Order #${orderIdVal}`);
                }

                const compactDescription = descParts.join('\n');

                mappedItems.push({
                    description: compactDescription,
                    quantity: 1,
                    unit_price: serviceAmount,
                    amount: serviceAmount,
                    type: 'service',
                    order_service_id: item.service?.uuid,
                    property_address: propAddress
                });
                serviceToOrderMap[item.service.uuid] = item.service.order;
            });

            // ── Travel Calculation (Inter-Appointment or 1xN Batch) ─────
            const travelItems: any[] = [];
            let totalTravelCost = 0;
            let totalKm = 0;

            if (startLocationAddress && paymentPerKm > 0 && pendingResponse.items.length > 0) {
                const travelPayMode = vendorDetails?.settings?.travel_pay_mode || "inherit";
                const isBetweenAppointments = travelPayMode === "include_home" ? false : true;

                const ordersToCalculateTravel: any[] = [];
                const pendingOrderIds = new Set(pendingResponse.items.map(item => item.service?.order?.id).filter(Boolean));

                allOrdersList.forEach((order: any) => {
                    if (!pendingOrderIds.has(order.id)) return;
                    const vendorSlots = order.slots?.filter((s: any) => s.vendor_id === vendorUuid || s.vendor?.uuid === vendorUuid);
                    if (!vendorSlots || vendorSlots.length === 0) return;

                    const addr = order.property_address || order.property?.property_address || order.property?.address || '';
                    const hasTravelRequired = order.services?.some((s: any) =>
                        vendorSlots.some((slot: any) => String(slot.service_id) === String(s.service_id)) &&
                        (s.service?.is_travel_required || s.is_travel_required)
                    );

                    if (addr && hasTravelRequired) {
                        const firstSlot = vendorSlots[0];
                        ordersToCalculateTravel.push({
                            id: order.id,
                            address: addr,
                            date: firstSlot?.date || order.date || order.created_at?.split("T")[0] || "",
                            startTime: firstSlot?.start_time || "08:00",
                        });
                    }
                });

                if (ordersToCalculateTravel.length > 0) {
                    if (isBetweenAppointments) {
                        // Group by date
                        const dateGroups: Record<string, typeof ordersToCalculateTravel> = {};
                        ordersToCalculateTravel.forEach(o => {
                            const d = o.date || "unknown-date";
                            if (!dateGroups[d]) dateGroups[d] = [];
                            dateGroups[d].push(o);
                        });

                        const tripLegs: { from: string; to: string; legIndex: number }[] = [];
                        let legIdx = 0;

                        Object.entries(dateGroups).forEach(([, items]) => {
                            const sorted = [...items].sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
                            sorted.forEach((item, idx) => {
                                if (idx > 0) {
                                    const prevItem = sorted[idx - 1];
                                    if (prevItem.address.trim().toLowerCase() !== item.address.trim().toLowerCase()) {
                                        tripLegs.push({
                                            from: prevItem.address,
                                            to: item.address,
                                            legIndex: legIdx++,
                                        });
                                    }
                                }
                            });
                        });

                        if (tripLegs.length > 0) {
                            try {
                                console.log(`📍 [Pending Invoice] Batch calculating ${tripLegs.length} inter-appointment legs`);
                                const batchResult = await batchCalculateTravelCosts(tripLegs);
                                if (batchResult.status === "OK" || batchResult.status === "PARTIAL_FAILURE") {
                                    totalKm = batchResult.totalDistance;
                                    totalTravelCost = parseFloat((totalKm * paymentPerKm).toFixed(2));
                                }
                            } catch (e: any) {
                                console.error("Exception in batch travel calculation:", e);
                            }
                        }
                    } else {
                        // Legacy: 1-origin x N destinations
                        const uniqueAddresses: string[] = [];
                        ordersToCalculateTravel.forEach(o => {
                            if (!uniqueAddresses.includes(o.address)) {
                                uniqueAddresses.push(o.address);
                            }
                        });

                        if (uniqueAddresses.length > 0) {
                            const tripLegs = uniqueAddresses.map((addr, idx) => ({
                                from: startLocationAddress,
                                to: addr,
                                legIndex: idx,
                            }));

                            try {
                                console.log(`📍 [Pending Invoice] Single 1xN API call → 1 origin x ${uniqueAddresses.length} destinations`);
                                const batchResult = await batchCalculateTravelCosts(tripLegs);
                                if (batchResult.status === "OK" || batchResult.status === "PARTIAL_FAILURE") {
                                    totalKm = batchResult.totalDistance;
                                    totalTravelCost = parseFloat((totalKm * paymentPerKm).toFixed(2));
                                }
                            } catch (e: any) {
                                console.error("Exception in batch travel calculation:", e);
                            }
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
                    }
                }
            }

            const allItems = [...mappedItems, ...travelItems];

            let taxRate = 0;
            let taxType = "Tax";
            let taxSnapshot: any = null;
            let cleanTax = "";

            const rawTax = vendorDetails?.tax_number || vendorDetails?.settings?.tax_number || vendorDetails?.settings?.tax_number_gst_hst || vendorDetails?.settings?.tax_number_us || "";
            cleanTax = String(rawTax)
                .replace(/^(GST\/HST:\s*|GST:\s*|PST:\s*|QST:\s*|US State Tax ID:\s*|Tax ID:\s*)/i, "")
                .replace(/^GST\s*:\s*/i, "")
                .replace(/^PST\s*:\s*/i, "")
                .replace(/^HST\s*:\s*/i, "")
                .trim();

            if (vendorDetails?.settings?.tax_enabled && !vendorDetails?.settings?.tax_exempt) {
                const s = vendorDetails?.settings || {};
                const startLocation = vendorDetails?.addresses?.find((a: any) => a.type === 'start_location' || a.type === 'primary') || vendorDetails?.addresses?.[0];
                const vendorProvince = startLocation?.province || startLocation?.state || "";
                const rawCountryStr = (startLocation?.country || s.tax_country || "Canada").trim();
                const vendorCountry = (rawCountryStr.toUpperCase() === "US" || rawCountryStr.toUpperCase() === "USA") ? "USA" : "Canada";

                if (s.tax_rate !== undefined && s.tax_rate !== null && !isNaN(parseFloat(s.tax_rate)) && parseFloat(s.tax_rate) > 0) {
                    taxRate = parseFloat(s.tax_rate);
                    taxType = s.tax_type || (vendorCountry === "USA" ? "Sales Tax" : "GST/HST");
                } else if (vendorProvince) {
                    const locTax = getTaxRateByLocation(vendorProvince, vendorCountry);
                    taxRate = locTax.rate;
                    taxType = locTax.taxType;
                } else {
                    taxRate = vendorCountry === "USA" ? 0 : 13.0;
                    const typeMap: Record<string, string> = {
                        "GST_HST": "GST/HST",
                        "GST_PST": "GST + PST",
                        "GST_QST": "GST + QST",
                        "GST": "GST"
                    };
                    taxType = typeMap[s.tax_type] || s.tax_type || (vendorCountry === "USA" ? "Sales Tax" : "GST/HST");
                }

                taxSnapshot = {
                    total_rate: taxRate,
                    is_registered: !!cleanTax,
                    tax_number: cleanTax,
                    taxes: taxType ? [{ name: taxType, rate: taxRate }] : [],
                    snapshotted_at: new Date().toISOString()
                };
            }

            const initialTotals = recalculateTotals(
                allItems,
                taxRate,
                taxType,
                null,
                (vendorDetails?.addresses?.[0]?.province || "BC")
            );

            const vendorDetailsObj = {
                first_name: vendorDetails?.first_name || pendingResponse.vendor?.first_name || '',
                last_name: vendorDetails?.last_name || pendingResponse.vendor?.last_name || '',
                name: `${vendorDetails?.first_name || pendingResponse.vendor?.first_name || ''} ${vendorDetails?.last_name || pendingResponse.vendor?.last_name || ''}`.trim(),
                company_name: vendorDetails?.company_name || (vendorDetails as any)?.company?.name || '',
                email: (vendorDetails as any)?.email || (pendingResponse.vendor as any)?.email || '',
                phone: (vendorDetails as any)?.primary_phone || (vendorDetails as any)?.phone || '',
                address: vendorDetails?.addresses?.[0] ? `${vendorDetails.addresses[0].address_line_1 || ''}, ${vendorDetails.addresses[0].city || ''}` : '',
                tax_number: cleanTax,
                tax_type: taxType,
                tax_rate: taxRate,
            };

            const orgDetailsObj = {
                id: (vendorDetails as any)?.organization_id || (pendingResponse.vendor as any)?.organization_id || (pendingResponse.vendor as any)?.organization?.id,
                name: (pendingResponse.vendor as any)?.organization?.name || "BC Floor plans",
                email: (pendingResponse.vendor as any)?.organization?.contact_email || (pendingResponse.vendor as any)?.organization?.from_email || "info@bcfloorplans.com",
                phone: (pendingResponse.vendor as any)?.organization?.phone || "",
                address: (pendingResponse.vendor as any)?.organization?.address || "",
            };

            setEditData({
                vendor: pendingResponse.vendor,
                invoice_number: 'DRAFT',
                created_at: new Date().toISOString(),
                status: 'draft',
                items: allItems,
                tax_rate: taxRate,
                tax_type: taxType,
                tax_number: cleanTax,
                vendor_details: vendorDetailsObj,
                org_details: orgDetailsObj,
                ...initialTotals,
                notes: "",
                tax_snapshot: taxSnapshot
            });

            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch pending items:", err);
            toast.error("Failed to load pending items");
            setLoading(false);
        }
    }, [vendorUuid, startDate, endDate]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        fetchPendingItems(token);
    }, [router, fetchPendingItems]);

    const recalculateTotals = (
        items: any[],
        taxRate: number,
        taxType: string = "GST",
        existingTaxDetails: any = null,
        province: string = "BC"
    ) => {
        const subtotal = items
            .filter((i: any) => i.type === "service")
            .reduce(
                (acc: number, item: any) =>
                    acc + (parseFloat(String(item.quantity || 1)) * parseFloat(String(item.unit_price || item.amount || 0)) || 0),
                0
            );

        const travelAmount = items
            .filter((i: any) => i.type === "travel")
            .reduce(
                (acc: number, item: any) =>
                    acc + (parseFloat(String(item.quantity || 1)) * parseFloat(String(item.unit_price || item.amount || 0)) || 0),
                0
            );

        const totalLines = items.reduce(
            (acc: number, item: any) =>
                acc + (parseFloat(String(item.quantity || 1)) * parseFloat(String(item.unit_price || item.amount || 0)) || 0),
            0
        );

        const normalizedProv = (province || "BC").toUpperCase().trim();
        const isHstProvince = ["ON", "ONTARIO", "NB", "NEW BRUNSWICK", "NL", "NEWFOUNDLAND", "NS", "NOVA SCOTIA", "PE", "PRINCE EDWARD ISLAND"].includes(normalizedProv);
        const hasPst = ["BC", "BRITISH COLUMBIA", "SK", "SASKATCHEWAN", "MB", "MANITOBA", "QC", "QUEBEC"].includes(normalizedProv);

        const gstRate = 5.0;
        const pstRate = normalizedProv === "QC" ? 9.975 : (normalizedProv === "SK" ? 6.0 : 7.0);

        let gstSum = 0;
        let pstSum = 0;
        let singleTaxSum = 0;

        items.forEach((item: any) => {
            const lineAmt = (parseFloat(String(item.quantity || 1)) * parseFloat(String(item.unit_price || item.amount || 0))) || 0;
            const isGst = item.gst_enabled !== undefined ? Boolean(item.gst_enabled) : (item.is_taxable !== undefined ? Boolean(item.is_taxable) : true);
            const isPst = item.pst_enabled !== undefined ? Boolean(item.pst_enabled) : false;

            if (isHstProvince) {
                if (isGst) singleTaxSum += lineAmt * (taxRate / 100);
            } else if (hasPst && (taxType === "GST_PST" || isPst || (existingTaxDetails && existingTaxDetails.PST))) {
                if (isGst) gstSum += lineAmt * (gstRate / 100);
                if (isPst) pstSum += lineAmt * (pstRate / 100);
            } else {
                if (isGst) singleTaxSum += lineAmt * (taxRate / 100);
            }
        });

        if (travelAmount > 0 && taxRate > 0) {
            if (isHstProvince) {
                singleTaxSum += travelAmount * (taxRate / 100);
            } else if (hasPst && (taxType === "GST_PST" || (existingTaxDetails && existingTaxDetails.PST))) {
                gstSum += travelAmount * (gstRate / 100);
            } else {
                singleTaxSum += travelAmount * (taxRate / 100);
            }
        }

        let calculatedTaxDetails: any = null;
        let totalTax = 0;

        if (hasPst && (taxType === "GST_PST" || pstSum > 0 || (existingTaxDetails && existingTaxDetails.PST))) {
            calculatedTaxDetails = {
                "GST": { rate: gstRate, amount: parseFloat(gstSum.toFixed(2)) },
                "PST": { rate: pstRate, amount: parseFloat(pstSum.toFixed(2)) },
            };
            totalTax = gstSum + pstSum;
        } else if (isHstProvince) {
            calculatedTaxDetails = {
                "HST": { rate: taxRate, amount: parseFloat(singleTaxSum.toFixed(2)) },
            };
            totalTax = singleTaxSum;
        } else {
            calculatedTaxDetails = {
                [taxType || "GST"]: { rate: taxRate, amount: parseFloat(singleTaxSum.toFixed(2)) },
            };
            totalTax = singleTaxSum;
        }

        return {
            subtotal: subtotal.toFixed(2),
            travel_amount: travelAmount.toFixed(2),
            tax_amount: totalTax.toFixed(2),
            total: (totalLines + totalTax).toFixed(2),
            tax_details: calculatedTaxDetails,
        };
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...editData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        if (field === "quantity" || field === "unit_price") {
            const qty = parseFloat(String(newItems[index].quantity || 1)) || 1;
            const unitPrice = parseFloat(String(newItems[index].unit_price || 0)) || 0;
            newItems[index].amount = (qty * unitPrice).toFixed(2);
        }
        if (field === "gst_enabled" || field === "pst_enabled") {
            newItems[index].is_taxable = Boolean(newItems[index].gst_enabled || newItems[index].pst_enabled);
        }
        const totals = recalculateTotals(
            newItems,
            parseFloat(String(editData.tax_rate || 0)) || 0,
            editData.tax_type || "GST",
            editData.tax_details,
            (editData.vendor?.addresses?.[0]?.province || "BC")
        );
        setEditData({ ...editData, items: newItems, ...totals });
    };

    const addItem = () => {
        const newItem = {
            description: '',
            quantity: 1,
            unit_price: 0,
            amount: 0,
            type: 'service',
            is_taxable: true,
            gst_enabled: true,
            pst_enabled: editData.tax_type === "GST_PST",
            order_service_id: null,
        };
        const newItems = [...editData.items, newItem];
        const totals = recalculateTotals(
            newItems,
            parseFloat(String(editData.tax_rate || 0)) || 0,
            editData.tax_type || "GST",
            editData.tax_details,
            (editData.vendor?.addresses?.[0]?.province || "BC")
        );
        setEditData({ ...editData, items: newItems, ...totals });
    };

    const removeItem = (index: number) => {
        const newItems = editData.items.filter((_: any, i: number) => i !== index);
        const totals = recalculateTotals(
            newItems,
            parseFloat(String(editData.tax_rate || 0)) || 0,
            editData.tax_type || "GST",
            editData.tax_details,
            (editData.vendor?.addresses?.[0]?.province || "BC")
        );
        setEditData({ ...editData, items: newItems, ...totals });
    };

    const updateTaxRate = (val: string) => {
        const rate = parseFloat(val) || 0;
        const totals = recalculateTotals(
            editData.items,
            rate,
            editData.tax_type || "GST",
            editData.tax_details,
            (editData.vendor?.addresses?.[0]?.province || "BC")
        );
        setEditData({ ...editData, tax_rate: val, ...totals });
    };

    const updateTaxType = (val: string) => {
        const totals = recalculateTotals(
            editData.items,
            parseFloat(String(editData.tax_rate || 0)) || 0,
            val,
            editData.tax_details,
            (editData.vendor?.addresses?.[0]?.province || "BC")
        );
        setEditData({ ...editData, tax_type: val, ...totals });
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
            const generatePayload = {
                vendor_uuid: vendorUuid,
                order_service_uuids: uniqueServiceIds,
                cycle_start: startDate || undefined,
                cycle_end: endDate || undefined,
                notes: editData.notes,
                tax_rate: editData.tax_rate,
                tax_type: editData.tax_type,
                tax_number: editData.tax_number || editData.vendor_details?.tax_number || editData.tax_snapshot?.tax_number,
                travel_amount: parseFloat(String(editData.travel_amount || 0)),
                tax_snapshot: editData.tax_snapshot,
                tax_details: editData.tax_details,
                vendor_details: editData.vendor_details,
                org_details: editData.org_details,
                lines: editData.items.map((item: any) => ({
                    description: item.description,
                    quantity: parseFloat(String(item.quantity || 1)) || 1,
                    unit_price: parseFloat(String(item.unit_price || item.amount || 0)) || 0,
                    amount: parseFloat(String(item.amount || (item.quantity * item.unit_price) || 0)) || 0,
                    type: item.type || 'service',
                    is_taxable: item.is_taxable !== undefined ? Boolean(item.is_taxable) : true,
                    order_service_id: item.order_service_id || null,
                })),
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

                {/* BILLING CYCLE DATE RANGE FILTER BAR */}
                <PayPeriodFilter
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(s, e) => {
                        setStartDate(s);
                        setEndDate(e);
                    }}
                    roleSettings={roleSettings}
                />

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
