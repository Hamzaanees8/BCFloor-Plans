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
import { CreditCard, Eye, Plus, Pencil, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function VendorInvoicesListPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
    const [paying, setPaying] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'draft' | 'paid'>('draft');
    
    // Edit state
    const [editingInvoice, setEditingInvoice] = useState<VendorInvoice | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // View state
    const [viewingInvoice, setViewingInvoice] = useState<VendorInvoice | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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
            const data = await vendorBillingService.getAdminInvoices(token);
            setInvoices(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch invoices:", err);
            toast.error("Failed to load invoices list");
            setLoading(false);
        }
    };

    const handlePay = async (invoiceUuid: string) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        setPaying(invoiceUuid);
        try {
            const result = await vendorBillingService.payInvoice(invoiceUuid, token);
            if (result.success) {
                toast.success("Payment processed successfully!");
                fetchInvoices(token);
            } else {
                toast.error(result.message || "Payment failed");
            }
        } catch (err: any) {
            console.error("Payment error:", err);
            toast.error(err.response?.data?.message || "Payment failed");
        } finally {
            setPaying(null);
        }
    };

    const handleEdit = (invoice: VendorInvoice) => {
        setEditingInvoice(invoice);
        setIsEditModalOpen(true);
    };

    const handleView = async (invoice: VendorInvoice) => {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        try {
            const details = await vendorBillingService.getAdminInvoiceDetails(invoice.uuid, token);
            setViewingInvoice(details);
            setIsViewModalOpen(true);
        } catch (err) {
            console.error("Failed to fetch invoice details:", err);
            toast.error("Failed to load invoice details");
        }
    };

    const handleUpdateSuccess = () => {
        const token = localStorage.getItem("token");
        if (token) fetchInvoices(token);
        setIsEditModalOpen(false);
        setEditingInvoice(null);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700 hover:bg-green-100/80';
            case 'draft': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80';
            case 'cancelled': return 'bg-gray-100 text-gray-700 hover:bg-gray-100/80';
            default: return 'bg-blue-100 text-blue-700 hover:bg-blue-100/80';
        }
    };

    const filteredInvoices = invoices.filter(inv => inv.status === activeTab);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Invoice Management</h1>
                    <p className="text-muted-foreground">Manage generated invoices and trigger Stripe Connect payouts.</p>
                </div>
                <Button 
                    className="gap-2" 
                    onClick={() => router.push('/dashboard/vendor-billing/uninvoiced')}
                >
                    <Plus className="h-4 w-4" />
                    Create Invoice
                </Button>
            </div>

            <div className="flex items-center gap-1 border-b pb-px">
                <button
                    onClick={() => setActiveTab('draft')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium transition-colors relative",
                        activeTab === 'draft' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Drafts
                    <Badge variant="secondary" className="ml-2 px-1.5 h-5 min-w-[20px]">
                        {invoices.filter(i => i.status === 'draft').length}
                    </Badge>
                    {activeTab === 'draft' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
                <button
                    onClick={() => setActiveTab('paid')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium transition-colors relative",
                        activeTab === 'paid' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Paid
                    <Badge variant="secondary" className="ml-2 px-1.5 h-5 min-w-[20px]">
                        {invoices.filter(i => i.status === 'paid').length}
                    </Badge>
                    {activeTab === 'paid' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
            </div>

            <InvoiceTable 
                invoices={filteredInvoices} 
                loading={loading} 
                onPay={activeTab === 'draft' ? handlePay : undefined}
                onEdit={activeTab === 'draft' ? handleEdit : undefined}
                onView={handleView}
                paying={paying}
                getStatusColor={getStatusColor}
            />

            {editingInvoice && (
                <EditInvoiceModal 
                    isOpen={isEditModalOpen} 
                    onClose={() => setIsEditModalOpen(false)} 
                    invoice={editingInvoice}
                    onSuccess={handleUpdateSuccess}
                />
            )}

            {viewingInvoice && (
                <ViewInvoiceModal 
                    isOpen={isViewModalOpen} 
                    onClose={() => setIsViewModalOpen(false)} 
                    invoice={viewingInvoice}
                />
            )}
        </div>
    );
}

function InvoiceTable({ invoices, loading, onPay, onEdit, onView, paying, getStatusColor }: any) {
    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        );
    }

    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                No invoices found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        invoices.map((invoice: VendorInvoice) => (
                            <TableRow key={invoice.uuid}>
                                <TableCell className="font-mono text-xs">{invoice.invoice_number}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{invoice.vendor?.company_name || "—"}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {invoice.vendor?.first_name} {invoice.vendor?.last_name}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {new Date(invoice.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="font-bold">${Number(invoice.total_amount).toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(invoice.status)}>
                                        {invoice.status.toUpperCase()}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {invoice.status === 'draft' && onPay && (
                                            <Button 
                                                variant="default" 
                                                size="sm" 
                                                className="h-8 gap-2 bg-green-600 hover:bg-green-700"
                                                onClick={() => onPay(invoice.uuid)}
                                                disabled={paying === invoice.uuid}
                                            >
                                                {paying === invoice.uuid ? "Paying..." : "Pay Now"}
                                                <CreditCard className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {invoice.status === 'draft' && onEdit && (
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-8 gap-2"
                                                onClick={() => onEdit(invoice)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Edit
                                            </Button>
                                        )}
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-8 gap-2"
                                            onClick={() => onView(invoice)}
                                        >
                                            <Eye className="h-4 w-4" />
                                            Details
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}

function ViewInvoiceModal({ isOpen, onClose, invoice }: any) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Invoice Details: {invoice.invoice_number}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Vendor</p>
                            <p className="font-medium">{invoice.vendor?.company_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{invoice.vendor?.first_name} {invoice.vendor?.last_name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-muted-foreground">Status</p>
                            <Badge className="mt-1">{invoice.status.toUpperCase()}</Badge>
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoice.lines?.map((line: any, idx: number) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{line.description}</span>
                                                {line.order_service?.order?.property?.property_address && (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Property: {line.order_service.order.property.property_address}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">${Number(line.amount).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex flex-col items-end gap-1 pt-2 border-t font-bold">
                        <div className="flex w-full justify-between max-w-[200px] text-sm font-normal text-muted-foreground">
                            <span>Subtotal</span>
                            <span>${Number(invoice.subtotal).toFixed(2)}</span>
                        </div>
                        <div className="flex w-full justify-between max-w-[200px] text-sm font-normal text-muted-foreground">
                            <span>Travel</span>
                            <span>${Number(invoice.travel_amount).toFixed(2)}</span>
                        </div>
                        <div className="flex w-full justify-between max-w-[200px] text-lg pt-1 border-t mt-1">
                            <span>Total</span>
                            <span>${Number(invoice.total_amount).toFixed(2)}</span>
                        </div>
                    </div>

                    {invoice.notes && (
                        <div className="mt-4 p-3 bg-muted/30 rounded-md text-sm italic">
                            <p className="text-xs font-semibold not-italic mb-1 text-muted-foreground uppercase tracking-wider">Internal Notes</p>
                            {invoice.notes}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EditInvoiceModal({ isOpen, onClose, invoice, onSuccess }: any) {
    const [status, setStatus] = useState(invoice.status);
    const [notes, setNotes] = useState(invoice.notes || "");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        setLoading(true);
        try {
            await vendorBillingService.updateInvoice(invoice.uuid, { status, notes }, token);
            toast.success("Invoice updated successfully!");
            onSuccess();
        } catch (err: any) {
            console.error("Update failed:", err);
            toast.error(err.response?.data?.message || "Failed to update invoice");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Invoice {invoice.invoice_number}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="remarks">Internal Notes</Label>
                        <Textarea 
                            id="remarks" 
                            placeholder="Add notes for this invoice..." 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading} className="gap-2">
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
