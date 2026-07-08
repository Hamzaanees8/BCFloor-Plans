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
import { CreditCard, Eye, Plus, Pencil, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Save, X, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

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

    const isMobile = useIsMobile();

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

    const handleEdit = async (invoice: VendorInvoice) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const details = await vendorBillingService.getAdminInvoiceDetails(invoice.uuid, token);
            setEditingInvoice(details);
            setIsEditModalOpen(true);
        } catch (err) {
            console.error("Failed to fetch invoice details for editing:", err);
            toast.error("Failed to load invoice details");
        }
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

            <div className="p-4 sm:p-6 space-y-6">

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
                    isMobile={isMobile}
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

function InvoiceTable({ invoices, loading, onPay, onEdit, onView, paying, roleSettings, headerBg, userType, isMobile }: any) {
    if (loading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-[120px] w-full" />
                <Skeleton className="h-[120px] w-full" />
                <Skeleton className="h-[120px] w-full" />
            </div>
        );
    }

    if (isMobile) {
        return (
            <div className="space-y-4">
                {invoices.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm font-medium">
                        No Invoices found.
                    </div>
                ) : (
                    invoices.map((invoice: VendorInvoice) => {
                        const status = invoice.status || "draft";
                        let bgColor = "#E06D5E"; // cancelled
                        if (status === "paid") bgColor = "#6BAE41";
                        else if (status === "draft") bgColor = "#F5A623";

                        const company = invoice.vendor?.company_name;
                        const name = `${invoice.vendor?.first_name || ""} ${invoice.vendor?.last_name || ""}`.trim();
                        const displayVendor = company || name || "—";

                        return (
                            <Card key={invoice.uuid} className="overflow-hidden border border-gray-100 shadow-sm">
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900" style={{ color: roleSettings?.pageTabColor }}>
                                                #{invoice.invoice_number}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1 font-semibold">
                                                {displayVendor}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {new Date(invoice.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[14px] font-bold text-gray-800">${Number(invoice.total_amount).toFixed(2)}</p>
                                            <Badge className="text-white px-2 py-0.5 rounded text-[9px] font-medium uppercase mt-2 border-0" style={{ backgroundColor: bgColor }}>
                                                {status.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                                        {invoice.status === 'draft' && onPay && (
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="flex-1 h-9 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white shadow-none"
                                                onClick={() => onPay(invoice.uuid)}
                                                disabled={paying === invoice.uuid}
                                            >
                                                {paying === invoice.uuid ? "Paying..." : "Pay"}
                                                <CreditCard className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                        {invoice.status === 'draft' && onEdit && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 h-9 text-xs gap-1.5"
                                                onClick={() => onEdit(invoice)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                Edit
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 h-9 text-xs gap-1.5"
                                            onClick={() => onView(invoice)}
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            Details
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        );
    }

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
            <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col rounded-[8px] p-0 font-alexandria overflow-hidden bg-gray-50">
                <DialogHeader className="p-4 md:p-6 border-b border-[#E4E4E4] bg-white shrink-0">
                    <DialogTitle className="flex flex-col md:flex-row items-start md:items-center w-full font-alexandria relative pr-8 md:pr-0">
                        <div className="flex flex-col items-start w-full md:w-auto">
                            <span className="text-[20px] md:text-[22px] font-[700] uppercase tracking-wide leading-none" style={{ color: roleSettings.pageTabColor }}>
                                Invoice
                            </span>
                            <span className="text-[13px] md:text-[15px] font-[500] text-gray-500 mt-1.5 break-all">
                                #{invoice.invoice_number || invoice.id}
                            </span>
                        </div>

                        <div className={`flex w-full md:w-auto md:ml-auto md:items-center gap-2 mt-4 md:mt-0 md:pr-4 flex-col md:flex-row items-start`}>
                            <Button
                                onClick={handleDownload}
                                className={`flex-1 h-[40px] md:h-[36px] px-2 md:px-6 text-[12px] md:text-[14px] font-semibold text-white hover:brightness-90 hover:!text-white rounded-[6px] border-none w-full md:w-auto shadow-sm transition-all`}
                                style={{ backgroundColor: roleSettings.pageTabColor }}
                            >
                                <Download className="w-4 h-4 mr-1.5 inline-block" /> Download PDF
                            </Button>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 flex-1 overflow-y-auto">
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

                <DialogFooter className="border-t p-4 shrink-0 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                    <Button
                        onClick={onClose}
                        className="text-white hover:brightness-110 transition-all px-8 h-10 w-full sm:w-auto"
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
    const [editData, setEditData] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    // Normalise vendor `lines[]` → `items[]` that InvoiceDocument understands
    useEffect(() => {
        if (!invoice) return;

        const items = (invoice.lines || []).map((line: any) => ({
            description: line.description || '',
            quantity: parseFloat(String(line.quantity ?? 1)),
            unit_price: parseFloat(String(line.unit_price ?? line.amount ?? 0)),
            amount: parseFloat(String(line.amount ?? 0)),
            type: line.type || 'service',
            order_service_id: line.order_service_id ?? null,
        }));

        const taxRate = parseFloat(String(invoice.tax_rate ?? 0));
        const subtotal = items.reduce(
            (acc: number, item: any) => acc + (item.quantity * item.unit_price || 0), 0
        );
        const taxAmount = subtotal * (taxRate / 100);

        setEditData({
            ...invoice,
            items,
            tax_rate: taxRate,
            tax_type: invoice.tax_type || "Tax",
            subtotal: subtotal.toFixed(2),
            tax_amount: taxAmount.toFixed(2),
            total: (subtotal + taxAmount).toFixed(2),
            notes: invoice.notes || '',
        });
    }, [invoice]);

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

    const updateTaxType = (val: string) => {
        setEditData({ ...editData, tax_type: val });
    };

    const handleSave = async () => {
        if (!editData) return;
        const token = localStorage.getItem("token");
        if (!token) return;

        setSaving(true);
        try {
            const payload = {
                notes: editData.notes,
                tax_rate: editData.tax_rate,
                tax_type: editData.tax_type,
                lines: editData.items.map((item: any) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    amount: parseFloat(item.quantity) * parseFloat(item.unit_price),
                    type: item.type || 'service',
                    order_service_id: item.order_service_id || null,
                })),
            };
            await vendorBillingService.updateInvoice(invoice.uuid, payload as any, token);
            toast.success("Invoice updated successfully!");
            onSuccess();
        } catch (err: any) {
            console.error("Update failed:", err);
            toast.error(err.response?.data?.message || "Failed to update invoice");
        } finally {
            setSaving(false);
        }
    };

    if (!editData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={saving ? undefined : onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw] md:w-[90vw] p-4 sm:p-6">
                <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3 pr-8">
                    <DialogTitle className="text-base sm:text-xl font-bold text-left" style={{ color: roleSettings.pageTabColor }}>
                        Edit Vendor Invoice: {invoice.invoice_number}
                    </DialogTitle>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-4 gap-2 flex-1 sm:flex-none justify-center"
                            onClick={onClose}
                            disabled={saving}
                        >
                            <X className="h-4 w-4" /> Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="h-9 px-5 gap-2 text-white hover:brightness-110 active:scale-[0.98] transition-all flex-1 sm:flex-none justify-center"
                            style={{ backgroundColor: roleSettings.pageTabColor }}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Save className="h-4 w-4" />
                            }
                            Save
                        </Button>
                    </div>
                </DialogHeader>

                <div className="py-4">
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
            </DialogContent>
        </Dialog>
    );
}
