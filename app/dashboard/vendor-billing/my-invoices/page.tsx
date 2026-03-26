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
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { Eye, Download as DownloadIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import InvoiceDocument from "@/app/dashboard/invoice/components/InvoiceDocument";
import InvoicePdfDocument from "@/app/dashboard/invoice/components/InvoicePdfDocument";
import DownloadInvoicePdf from "@/app/dashboard/invoice/components/DownloadInvoicePdf";

export default function MyInvoicesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
    
    // View state
    const [viewingInvoice, setViewingInvoice] = useState<VendorInvoice | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    
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

    const handleView = async (invoice: VendorInvoice) => {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        try {
            const details = await vendorBillingService.getInvoiceDetails(invoice.uuid, token);
            setViewingInvoice(details);
            setIsViewModalOpen(true);
        } catch (err) {
            console.error("Failed to fetch invoice details:", err);
            toast.error("Failed to load invoice details");
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
        <div className="font-alexandria" style={{ backgroundColor: roleSettings.pageBg, minHeight: '100vh' }}>
            <div className="w-full h-[80px] flex justify-between items-center px-[20px] border-b" style={{ backgroundColor: headerBg, boxShadow: "0px 4px 4px #0000001F" }}>
                <div className="flex flex-col">
                    <h1 className="text-[16px] md:text-[24px] font-[400] tracking-tight" style={{ color: roleSettings.pageTabColor }}>My Invoices</h1>
                    <p className="text-xs md:text-sm" style={{ color: roleSettings.pageTabColor, opacity: 0.8 }}>View your payout history and detailed invoice information.</p>
                </div>
            </div>

            <div className="p-6 space-y-6">
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
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="h-8 gap-2"
                                                    onClick={() => handleView(invoice)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    View
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => handleView(invoice)}
                                                >
                                                    <DownloadIcon className="h-4 w-4" />
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

            {viewingInvoice && (
                <ViewInvoiceModal 
                    isOpen={isViewModalOpen} 
                    onClose={() => setIsViewModalOpen(false)} 
                    invoice={viewingInvoice}
                    roleSettings={roleSettings}
                />
            )}
            </div>
        </div>
    );
}

function ViewInvoiceModal({ isOpen, onClose, invoice, roleSettings }: any) {
    const handleDownload = async () => {
        if (!invoice) return;
        const invoiceNumber = invoice.invoice_number || invoice.id;
        const fileName = `Invoice_${invoiceNumber}.pdf`;
        await DownloadInvoicePdf('invoice-pdf-content', fileName);
    }

    // Map vendor invoice data to InvoiceDocument format
    const documentData = {
        ...invoice,
        items: invoice.lines?.map((line: any) => ({
            ...line,
            quantity: line.quantity || 1,
            unit_price: line.unit_price || line.amount,
        })) || []
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="flex flex-row items-center justify-between pr-8 border-b pb-4">
                    <DialogTitle className="text-xl font-bold" style={{ color: roleSettings.pageTabColor }}>
                        Invoice Details: {invoice.invoice_number}
                    </DialogTitle>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 h-9 text-white hover:brightness-110 active:scale-[0.98] transition-all border-none"
                        style={{ backgroundColor: roleSettings.pageTabColor }}
                        onClick={handleDownload}
                    >
                        <DownloadIcon className="h-4 w-4" />
                        Download PDF
                    </Button>
                </DialogHeader>
                
                <div className="py-4">
                    <InvoiceDocument 
                        invoice={documentData}
                        editData={null}
                        isEditing={false}
                        updateItem={() => {}}
                        addItem={() => {}}
                        removeItem={() => {}}
                        updateTaxRate={() => {}}
                        setEditData={() => {}}
                        roleSettings={roleSettings}
                    />
                </div>

                {/* Hidden PDF component for high-accuracy capture */}
                <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                    <InvoicePdfDocument
                        invoice={documentData}
                        roleSettings={roleSettings}
                    />
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button 
                        onClick={onClose}
                        className="text-white hover:brightness-110 transition-all px-8 h-10"
                        style={{ backgroundColor: roleSettings.pageTabColor }}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
