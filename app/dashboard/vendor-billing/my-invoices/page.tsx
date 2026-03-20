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
import { vendorBillingService, VendorInvoice } from "../VendorBillingService";
import { Eye, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MyInvoicesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<VendorInvoice[]>([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        fetchInvoices(token);
    }, [router]);

    const fetchInvoices = async (token: string) => {
        try {
            const data = await vendorBillingService.getMyInvoices(token);
            setInvoices(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch my invoices:", err);
            toast.error("Failed to load invoice history");
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700 hover:bg-green-100/80';
            case 'draft': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80';
            case 'cancelled': return 'bg-gray-100 text-gray-700 hover:bg-gray-100/80';
            default: return 'bg-blue-100 text-blue-700 hover:bg-blue-100/80';
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">My Invoices</h1>
                <p className="text-muted-foreground">View your payout history and detailed invoice information.</p>
            </div>

            <Card>
                {loading ? (
                    <div className="p-4 space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice Number</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Services</TableHead>
                                <TableHead>Travel</TableHead>
                                <TableHead>Total Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                        No invoices found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((invoice) => (
                                    <TableRow key={invoice.uuid}>
                                        <TableCell className="font-mono text-sm">{invoice.invoice_number}</TableCell>
                                        <TableCell>{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>${Number(invoice.subtotal).toFixed(2)}</TableCell>
                                        <TableCell>${Number(invoice.travel_amount).toFixed(2)}</TableCell>
                                        <TableCell className="font-bold">${Number(invoice.total_amount).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(invoice.status)}>
                                                {invoice.status.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" className="h-8 gap-2">
                                                    <Eye className="h-4 w-4" />
                                                    View
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}
