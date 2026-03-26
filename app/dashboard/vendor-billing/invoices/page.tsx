"use client";

import React, { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { vendorBillingService, VendorInvoice } from "../VendorBillingService";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { CreditCard, Eye, Plus, Pencil, Loader2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
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
import InvoiceDocument from "@/app/dashboard/invoice/components/InvoiceDocument";
import InvoicePdfDocument from "@/app/dashboard/invoice/components/InvoicePdfDocument";
import DownloadInvoicePdf from "@/app/dashboard/invoice/components/DownloadInvoicePdf";
import { Download } from "lucide-react";

export default function VendorInvoicesListPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
    const [paying, setPaying] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'draft' | 'paid'>('draft');
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];
    const headerBg = `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`;

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
            const data: any = await vendorBillingService.getAdminInvoices(token);
            const invoicesList = Array.isArray(data) ? data : (data?.data ? data.data : []);
            setInvoices(invoicesList);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch invoices:", err);
            toast.error("Failed to load invoices list");
            setLoading(false);
            setInvoices([]);
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

    const safeInvoices = Array.isArray(invoices) ? invoices : [];
    const filteredInvoices = safeInvoices.filter(inv => inv.status === activeTab);

    return (
        <div className="font-alexandria" style={{ backgroundColor: roleSettings.pageBg, minHeight: '100vh' }}>
            <div className="w-full h-[80px] flex justify-between items-center px-[20px] border-b" style={{ backgroundColor: headerBg, boxShadow: "0px 4px 4px #0000001F" }}>
                <div className="flex flex-col">
                    <h1 className="text-[16px] md:text-[24px] font-[400] tracking-tight" style={{ color: roleSettings.pageTabColor }}>Invoice Management</h1>
                    <p className="text-xs md:text-sm" style={{ color: roleSettings.pageTabColor, opacity: 0.8 }}>Manage generated invoices and trigger Stripe Connect payouts.</p>
                </div>
                <Button
                    className="gap-2 h-[35px] md:h-[44px] hover:brightness-110 active:scale-[0.98] transition-all text-white"
                    style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
                    onClick={() => router.push('/dashboard/vendor-billing/uninvoiced')}
                >
                    <Plus className="h-4 w-4" />
                    Create Invoice
                </Button>
            </div>

            <div className="p-6 space-y-6">

                <div className="flex items-center gap-1 border-b pb-px">
                    <button
                        onClick={() => setActiveTab('draft')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium transition-colors relative",
                            activeTab === 'draft' ? "" : "text-muted-foreground hover:text-foreground"
                        )}
                        style={activeTab === 'draft' ? { color: roleSettings.pageTabColor } : {}}
                    >
                        Drafts
                        <Badge variant="secondary" className="ml-2 px-1.5 h-5 min-w-[20px]">
                            {safeInvoices.filter(i => i.status === 'draft').length}
                        </Badge>
                        {activeTab === 'draft' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: roleSettings.pageTabColor }} />}
                    </button>
                    <button
                        onClick={() => setActiveTab('paid')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium transition-colors relative",
                            activeTab === 'paid' ? "" : "text-muted-foreground hover:text-foreground"
                        )}
                        style={activeTab === 'paid' ? { color: roleSettings.pageTabColor } : {}}
                    >
                        Paid
                        <Badge variant="secondary" className="ml-2 px-1.5 h-5 min-w-[20px]">
                            {safeInvoices.filter(i => i.status === 'paid').length}
                        </Badge>
                        {activeTab === 'paid' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: roleSettings.pageTabColor }} />}
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
                    roleSettings={roleSettings}
                    headerBg={headerBg}
                    userType={userType}
                />

                {editingInvoice && (
                    <EditInvoiceModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        invoice={editingInvoice}
                        onSuccess={handleUpdateSuccess}
                        roleSettings={roleSettings}
                    />
                )}

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

function InvoiceTable({ invoices, loading, onPay, onEdit, onView, paying, roleSettings, headerBg, userType }: any) {
    const columns: ColumnDef<VendorInvoice>[] = [
        {
            accessorKey: "invoice_number",
            header: "INVOICE #",
            cell: ({ row }) => <div className="ml-[5px]" style={{ color: roleSettings?.pageTabColor }}>#{row.original.invoice_number}</div>
        },
        {
            accessorKey: "vendor",
            header: "VENDOR",
            cell: ({ row }) => {
                const company = row.original.vendor?.company_name;
                const name = `${row.original.vendor?.first_name || ""} ${row.original.vendor?.last_name || ""}`.trim();
                const display = company || name || "—";
                return (
                    <div style={{ color: roleSettings?.pageText }}>
                        {display}
                    </div>
                );
            }
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => {
                const isSorted = column.getIsSorted();
                return (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            if (isSorted === "asc") column.toggleSorting(true);
                            else if (isSorted === "desc") column.clearSorting();
                            else column.toggleSorting(false);
                        }}
                        className="p-0 hover:bg-transparent flex items-center gap-1 font-bold h-auto border-none"
                    >
                        DATE
                        {isSorted === "asc" && <span><ChevronUp strokeWidth={3} className="h-4 w-4" style={{ color: roleSettings?.pageTabColor }} /></span>}
                        {isSorted === "desc" && <span><ChevronDown strokeWidth={3} className="h-4 w-4" style={{ color: roleSettings?.pageTabColor }} /></span>}
                        {!isSorted && <span className="text-gray-400"><ChevronsUpDown strokeWidth={3} className="h-4 w-4 text-gray-400" /></span>}
                    </Button>
                )
            },
            cell: ({ row }) => <div style={{ color: roleSettings?.pageText }}>{new Date(row.original.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}</div>,
            enableSorting: true,
        },
        {
            accessorKey: "total_amount",
            header: "AMOUNT",
            cell: ({ row }) => <div style={{ color: roleSettings?.pageText }}>${Number(row.original.total_amount).toFixed(2)}</div>
        },
        {
            accessorKey: "status",
            header: "STATUS",
            cell: ({ row }) => {
                const status = row.original.status || "draft";
                let bgColor = "#E06D5E"; // cancelled / unhandled
                if (status === "paid") bgColor = "#6BAE41";
                else if (status === "draft") bgColor = "#F5A623";

                return (
                    <div
                        className="text-white px-3 py-1 rounded-full text-[10px] font-medium w-fit uppercase"
                        style={{ backgroundColor: bgColor }}
                    >
                        {status.toUpperCase()}
                    </div>
                );
            }
        },
        {
            id: "actions",
            header: "ACTIONS",
            enableHiding: false,
            cell: ({ row }) => {
                const invoice = row.original;
                return (
                    <div className="flex justify-end gap-2">
                        {invoice.status === 'draft' && onPay && (
                            <Button
                                variant="default"
                                size="sm"
                                className="h-8 gap-2 bg-green-600 hover:bg-green-700 text-white"
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
                );
            }
        }
    ];

    return (
        <DataTable
            data={invoices}
            columns={columns}
            loading={loading}
            dataName="Invoices"
            userType={userType}
            headerBgOverride={headerBg}
        />
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
            quantity: line.quantity || 1, // Default to 1 if missing
            unit_price: line.unit_price || line.amount, // Vendor lines might use amount directly
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
                        <Download className="h-4 w-4" />
                        Download PDF
                    </Button>
                </DialogHeader>

                <div className="py-4">
                    <InvoiceDocument
                        invoice={documentData}
                        editData={null}
                        isEditing={false}
                        updateItem={() => { }}
                        addItem={() => { }}
                        removeItem={() => { }}
                        updateTaxRate={() => { }}
                        setEditData={() => { }}
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

function EditInvoiceModal({ isOpen, onClose, invoice, onSuccess, roleSettings }: any) {
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
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="text-xl font-bold" style={{ color: roleSettings.pageTabColor }}>
                        Edit Invoice {invoice.invoice_number}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="status" className="font-bold text-xs uppercase tracking-wider text-gray-500">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="status" className="focus:ring-offset-0 focus:ring-1" style={{ '--tw-ring-color': roleSettings.pageTabColor } as any}>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="remarks" className="font-bold text-xs uppercase tracking-wider text-gray-500">Internal Notes</Label>
                        <Textarea
                            id="remarks"
                            placeholder="Add notes for this invoice..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="min-h-[100px] focus-visible:ring-offset-0 focus-visible:ring-1"
                            style={{ '--tw-ring-color': roleSettings.pageTabColor } as any}
                        />
                    </div>
                </div>
                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={onClose} disabled={loading} className="h-10 px-6">Cancel</Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="gap-2 text-white hover:brightness-110 active:scale-[0.98] transition-all h-10 px-8"
                        style={{ backgroundColor: roleSettings.pageTabColor }}
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
