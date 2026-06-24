"use client";

import React, { useEffect, useState } from "react";
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
import { useRouter } from "next/navigation";
import { vendorBillingService, UninvoicedVendor } from "../VendorBillingService";
import { Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { useIsMobile } from "@/hooks/use-mobile";

export default function UninvoicedVendorsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState<UninvoicedVendor[]>([]);
    const isMobile = useIsMobile();

    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];
    const headerBg = `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`;

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        vendorBillingService.getUninvoicedVendors(token)
            .then(data => {
                setVendors(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch uninvoiced vendors:", err);
                toast.error("Failed to load vendors list");
                setLoading(false);
            });
    }, [router]);

    const handleReview = (vendorUuid: string) => {
        router.push(`/dashboard/vendor-billing/pending/${vendorUuid}`);
    };

    return (
        <div className="font-alexandria" style={{ backgroundColor: roleSettings.pageBg, minHeight: '100vh' }}>
            <div className="w-full h-[80px] flex flex-col justify-center px-[20px] border-b" style={{ backgroundColor: headerBg, boxShadow: "0px 4px 4px #0000001F" }}>
                <h1 className="text-[16px] md:text-[24px] font-[400] tracking-tight" style={{ color: roleSettings.pageTabColor }}>Vendor Billing</h1>
                <p className="text-xs md:text-sm" style={{ color: roleSettings.pageTabColor, opacity: 0.8 }}>Manage vendor services and generate invoices for completed work.</p>
            </div>

            <div className="p-4 sm:p-6 space-y-6">

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Uninvoiced Vendors</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{vendors.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Vendors with Completed Work</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                        List of vendors who have completed services that haven&apos;t been added to an invoice yet.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : isMobile ? (
                        <div className="space-y-3">
                            {vendors.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm font-medium">
                                    No vendors with uninvoiced work found.
                                </div>
                            ) : (
                                vendors.map((vendor) => (
                                    <div key={vendor.uuid} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col gap-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-semibold text-gray-900 truncate">
                                                    {vendor.first_name} {vendor.last_name}
                                                </h4>
                                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                                    {vendor.company_name || "—"}
                                                </p>
                                            </div>
                                            <div className="shrink-0 flex flex-col items-end">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide leading-none">Uninvoiced</span>
                                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white mt-1.5 leading-none" style={{ backgroundColor: roleSettings.pageTabColor }}>
                                                    {vendor.uninvoiced_services_count}
                                                </span>
                                            </div>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            className="w-full gap-2 text-white hover:brightness-110 active:scale-[0.98] transition-all h-9 text-xs"
                                            style={{ backgroundColor: roleSettings.pageTabColor }}
                                            onClick={() => handleReview(vendor.uuid)}
                                        >
                                            Review & Invoice
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company Name</TableHead>
                                    <TableHead>Vendor Name</TableHead>
                                    <TableHead className="text-center">Uninvoiced Services</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vendors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                            No vendors with uninvoiced work found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    vendors.map((vendor) => (
                                        <TableRow key={vendor.uuid}>
                                            <TableCell className="font-medium">{vendor.company_name || "—"}</TableCell>
                                            <TableCell>{vendor.first_name} {vendor.last_name}</TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-white ring-1 ring-inset ring-blue-700/10" style={{ backgroundColor: roleSettings.pageTabColor }}>
                                                    {vendor.uninvoiced_services_count}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="gap-2 text-white hover:brightness-110 active:scale-[0.98] transition-all"
                                                    style={{ backgroundColor: roleSettings.pageTabColor }}
                                                    onClick={() => handleReview(vendor.uuid)}
                                                >
                                                    Review & Invoice
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            </div>
        </div>
    );
}
