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

export default function UninvoicedVendorsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState<UninvoicedVendor[]>([]);

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
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Vendor Billing</h1>
                <p className="text-muted-foreground">Manage vendor services and generate invoices for completed work.</p>
            </div>

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
                <CardHeader>
                    <CardTitle>Vendors with Completed Work</CardTitle>
                    <CardDescription>
                        List of vendors who have completed services that haven&apos;t been added to an invoice yet.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
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
                                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                    {vendor.uninvoiced_services_count}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="gap-2"
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
    );
}
