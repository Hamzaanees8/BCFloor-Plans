"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { vendorBillingService, PendingResponse } from "../../VendorBillingService";
import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";

export default function PendingItemsPage() {
    const router = useRouter();
    const params = useParams();
    const vendorUuid = params.vendorUuid as string;

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<PendingResponse | null>(null);
    const [selectedUuids, setSelectedUuids] = useState<Set<string>>(new Set());
    const [notes, setNotes] = useState("");
    const [generating, setGenerating] = useState(false);

    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];
    const headerBg = `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`;

    const fetchPendingItems = useCallback(async (token: string) => {
        try {
            const response = await vendorBillingService.getPendingItems(vendorUuid, token);
            setData(response);
            // Default select all
            const allUuids = new Set(response.items.map(item => item.service.uuid));
            setSelectedUuids(allUuids);
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

    const toggleSelect = (uuid: string) => {
        setSelectedUuids(prev => {
            const next = new Set(prev);
            if (next.has(uuid)) next.delete(uuid);
            else next.add(uuid);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (!data) return;
        if (selectedUuids.size === data.items.length) {
            setSelectedUuids(new Set());
        } else {
            setSelectedUuids(new Set(data.items.map(item => item.service.uuid)));
        }
    };

    const handleGenerateInvoice = async () => {
        if (selectedUuids.size === 0) {
            toast.error("Please select at least one service to invoice.");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) return;

        setGenerating(true);
        try {
            const payload = {
                vendor_uuid: vendorUuid,
                order_service_uuids: Array.from(selectedUuids),
                notes: notes,
            };

            const invoice = await vendorBillingService.generateInvoice(payload, token);
            toast.success(`Invoice ${invoice.invoice_number} generated successfully!`);
            router.push(`/dashboard/vendor-billing/invoices`);
        } catch (err: any) {
            console.error("Failed to generate invoice:", err);
            toast.error(err.response?.data?.message || "Failed to generate invoice");
        } finally {
            setGenerating(false);
        }
    };

    const calculateTotals = () => {
        if (!data) return { services: 0, travel: 0, total: 0 };

        const selectedItems = data.items.filter(item => selectedUuids.has(item.service.uuid));
        const services = selectedItems.reduce((acc, item) => acc + Number(item.service.amount), 0);
        const travel = selectedItems.reduce((acc, item) => acc + item.travel_cost, 0);

        return {
            services,
            travel,
            total: services + travel
        };
    };

    const totals = calculateTotals();

    return (
        <div className="font-alexandria" style={{ backgroundColor: roleSettings.pageBg, minHeight: '100vh' }}>
            <div className="w-full h-[80px] flex items-center gap-4 px-[20px] border-b" style={{ backgroundColor: headerBg, boxShadow: "0px 4px 4px #0000001F" }}>
                <div className="flex gap-[10px]">
                    <h1 className="text-[16px] md:text-[24px] font-[400] tracking-tight" style={{ color: roleSettings.pageTabColor }}>Review Billing › </h1>
                    <p className="text-[16px] md:text-[24px]" style={{ color: roleSettings.pageTabColor }}>
                        {data?.vendor.company_name || `${data?.vendor.first_name} ${data?.vendor.last_name}`}
                    </p>
                </div>
            </div>

            <div className="p-6 grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Pending Services</CardTitle>
                            <CardDescription>Select services to include in the next invoice.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="select-all"
                                checked={data ? selectedUuids.size === data.items.length && data.items.length > 0 : false}
                                onCheckedChange={toggleSelectAll}
                                style={data && selectedUuids.size === data.items.length && data.items.length > 0 ? { backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor } : {}}
                            />
                            <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                                Select All
                            </Label>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : (
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]"></TableHead>
                                            <TableHead>Service / Order</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Travel Cost</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.items.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                                    No pending items found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data?.items.map((item) => {
                                                const isSelected = selectedUuids.has(item.service.uuid);
                                                return (
                                                    <TableRow key={item.service.uuid} className={isSelected ? "bg-muted/30" : ""}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={() => toggleSelect(item.service.uuid)}
                                                                style={isSelected ? { backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor } : {}}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{item.service.service.name}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    Order #{item.service.order.id} - {item.service.order.property.property_address}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>${Number(item.service.amount).toFixed(2)}</TableCell>
                                                        <TableCell>
                                                            {item.travel_cost > 0 ? (
                                                                <div className="flex flex-col">
                                                                    <span>${item.travel_cost.toFixed(2)}</span>
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        {item.slot?.distance}km @ ${item.slot?.km_price}/km
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold">
                                                            ${(Number(item.service.amount) + item.travel_cost).toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Selected Services:</span>
                                <span>{selectedUuids.size}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Services Total:</span>
                                <span>${totals.services.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Travel Total:</span>
                                <span>${totals.travel.toFixed(2)}</span>
                            </div>
                            <div className="pt-4 border-t flex justify-between font-bold text-lg">
                                <span>Grand Total:</span>
                                <span>${totals.total.toFixed(2)}</span>
                            </div>

                            <div className="pt-4 space-y-2">
                                <Label htmlFor="notes">Notes (Optional)</Label>
                                <Input
                                    id="notes"
                                    placeholder="e.g. Bi-weekly payout"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <Button
                                className="w-full mt-4 text-white hover:brightness-110 active:scale-[0.98] transition-all border-none"
                                style={{ backgroundColor: roleSettings.pageTabColor }}
                                disabled={selectedUuids.size === 0 || generating}
                                onClick={handleGenerateInvoice}
                            >
                                {generating ? "Generating..." : "Generate Draft Invoice"}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card style={{ backgroundColor: `${roleSettings.pageTabColor}15`, borderColor: `${roleSettings.pageTabColor}40` }}>
                        <CardContent className="p-4 flex gap-3">
                            <Info className="h-5 w-5 shrink-0 mt-0.5" style={{ color: roleSettings.pageTabColor }} />
                            <div className="text-xs leading-relaxed" style={{ color: roleSettings.pageTabColor }}>
                                Draft invoices can be reviewed and edited in the &quot;Invoiced History&quot; tab before triggering the actual Stripe payout.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
