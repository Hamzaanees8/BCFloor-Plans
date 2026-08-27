"use client";

import React, { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { vendorBillingService, VendorInvoice, VendorBillingSummary } from "../VendorBillingService";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import {
    CreditCard,
    Eye,
    Plus,
    Pencil,
    Loader2,
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    Download,
    CheckCircle2,
    DollarSign,
    Clock,
    Wallet,
    Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUser } from "@/context/UserContext";
import { GetOrganizations } from "@/app/dashboard/global-settings/global-settings";
import { SearchableSelect } from "@/app/dashboard/orders/components/SearchableSelect";
import EditInvoiceModal from "../components/EditInvoiceModal";
import PayPeriodFilter from "../components/PayPeriodFilter";

export default function VendorInvoicesListPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
    const [summary, setSummary] = useState<VendorBillingSummary | null>(null);
    const [paying, setPaying] = useState<string | null>(null);
    const [approving, setApproving] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'draft' | 'pending_payment' | 'paid'>('draft');
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const { isSuperAdmin } = useUser();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [orgFilter, setOrgFilter] = useState<string>("all");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];
    const headerBg = `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`;

    // Confirmation dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const [showAgain, setShowAgain] = useState(false);

    const triggerPaymentAction = (action: () => void) => {
        if (showAgain) {
            action();
        } else {
            setPendingAction(() => action);
            setConfirmOpen(true);
        }
    };

    const confirmAndExecute = () => {
        pendingAction?.();
        setPendingAction(null);
    };

    // Edit state
    const [editingInvoice, setEditingInvoice] = useState<VendorInvoice | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // View state
    const [viewingInvoice, setViewingInvoice] = useState<VendorInvoice | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Manual Pay Modal State
    const [manualPayInvoice, setManualPayInvoice] = useState<VendorInvoice | null>(null);
    const [isManualPayModalOpen, setIsManualPayModalOpen] = useState(false);
    const [manualDate, setManualDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
    const [manualMethod, setManualMethod] = useState<string>("Bank Transfer");
    const [manualRef, setManualRef] = useState<string>("");
    const [manualNotes, setManualNotes] = useState<string>("");
    const [isSubmittingManualPay, setIsSubmittingManualPay] = useState(false);

    const isMobile = useIsMobile();

    useEffect(() => {
        if (isSuperAdmin) {
            GetOrganizations()
                .then((res) => {
                    if (res.status && Array.isArray(res.data)) {
                        setOrganizations(res.data);
                    }
                })
                .catch((err) => console.error("Failed to fetch organizations:", err));
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        fetchData(token, orgFilter);
    }, [router, orgFilter]);

    const fetchData = async (token: string, orgId?: string) => {
        try {
            setLoading(true);
            const [invoicesData, summaryData] = await Promise.all([
                vendorBillingService.getAdminInvoices(token, orgId),
                vendorBillingService.getSummaryMetrics(token, orgId).catch(() => null),
            ]);

            const invoicesList = Array.isArray(invoicesData) ? invoicesData : ((invoicesData as any)?.data ? (invoicesData as any).data : []);
            setInvoices(invoicesList);
            if (summaryData) setSummary(summaryData);
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
            const isSuccess = result && (
                result.success === true ||
                result.status === "success" ||
                result.status === "paid" ||
                result.data != null ||
                (result.message && !result.message.toLowerCase().includes("fail") && !result.message.toLowerCase().includes("error"))
            );
            if (isSuccess) {
                toast.success("Payment processed successfully!");
                fetchData(token);
            } else {
                const failMsg = result?.message || result?.error || "Payment failed";
                const lower = String(failMsg).toLowerCase();
                toast.error(
                    lower.includes("connect") || lower.includes("account") || lower.includes("stripe")
                        ? "Payment Failed: Vendor does not have a connected Stripe account. Please ask vendor to connect their Stripe account under Vendor Settings, or use Manual Payment."
                        : failMsg
                );
            }
        } catch (err: any) {
            console.error("Payment error:", err);
            const backendMsg = err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail;
            const rawMsg = backendMsg || err.message || "";
            const lower = String(rawMsg).toLowerCase();

            if (lower.includes("500") || lower.includes("request failed") || lower.includes("connect") || lower.includes("account")) {
                toast.error("Payment Failed: Vendor does not have a connected Stripe account. Please ask vendor to connect their Stripe account under Vendor Settings, or use Manual Payment.");
            } else {
                toast.error(rawMsg || "Payment failed. Please check vendor Stripe setup.");
            }
        } finally {
            setPaying(null);
        }
    };

    const handleApprovePayout = async (invoiceUuid: string) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        setApproving(invoiceUuid);
        try {
            await vendorBillingService.updateInvoiceStatus(invoiceUuid, { status: 'approved' }, token);
            toast.success("Invoice approved for payout!");
            fetchData(token);
        } catch (err: any) {
            console.error("Approve error:", err);
            toast.error(err.response?.data?.message || "Failed to approve payout");
        } finally {
            setApproving(null);
        }
    };

    const handleOpenManualPay = (invoice: VendorInvoice) => {
        setManualPayInvoice(invoice);
        setManualDate(new Date().toISOString().split('T')[0]);
        setManualMethod("Bank Transfer");
        setManualRef("");
        setManualNotes("");
        setIsManualPayModalOpen(true);
    };

    const handleConfirmManualPay = async () => {
        if (!manualPayInvoice) return;
        const token = localStorage.getItem("token");
        if (!token) return;

        setIsSubmittingManualPay(true);
        try {
            await vendorBillingService.updateInvoiceStatus(
                manualPayInvoice.uuid,
                {
                    status: 'paid',
                    paid_at: manualDate,
                    payment_method: manualMethod,
                    transaction_reference: manualRef,
                    notes: `Paid via ${manualMethod} (Ref: ${manualRef || 'N/A'}). ${manualNotes}`.trim(),
                },
                token
            );
            toast.success("Invoice marked as paid!");
            setIsManualPayModalOpen(false);
            setManualPayInvoice(null);
            fetchData(token);
        } catch (err: any) {
            console.error("Manual pay error:", err);
            toast.error(err.response?.data?.message || "Failed to mark invoice as paid");
        } finally {
            setIsSubmittingManualPay(false);
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

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<VendorInvoice | null>(null);

    const handleDeleteInvoice = (invoice: VendorInvoice) => {
        if (invoice.status === 'paid') {
            toast.error("Paid invoices cannot be deleted.");
            return;
        }
        setInvoiceToDelete(invoice);
        setConfirmDeleteOpen(true);
    };

    const executeDeleteInvoice = async () => {
        if (!invoiceToDelete) return;
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await vendorBillingService.deleteInvoice(invoiceToDelete.uuid, token);
            toast.success(res.message || "Invoice deleted and services released back to uninvoiced.");
            setIsViewModalOpen(false);
            setViewingInvoice(null);
            setIsEditModalOpen(false);
            setEditingInvoice(null);
            fetchData(token);
        } catch (err: any) {
            console.error("Delete invoice error:", err);
            toast.error(err.response?.data?.message || "Failed to delete invoice");
        } finally {
            setInvoiceToDelete(null);
            setConfirmDeleteOpen(false);
        }
    };

    const handleUpdateSuccess = () => {
        const token = localStorage.getItem("token");
        if (token) fetchData(token);
        setIsEditModalOpen(false);
        setEditingInvoice(null);
    };

    const safeInvoices = Array.isArray(invoices) ? invoices : [];
    const dateFilteredInvoices = safeInvoices.filter(inv => {
        if (startDate || endDate) {
            const dateVal = inv.paid_at || inv.created_at || "";
            const invDate = dateVal ? new Date(dateVal).toISOString().split('T')[0] : "";
            if (startDate && invDate && invDate < startDate) return false;
            if (endDate && invDate && invDate > endDate) return false;
        }
        return true;
    });

    const filteredInvoices = dateFilteredInvoices.filter(inv => {
        if (activeTab === 'draft') return inv.status === 'draft';
        if (activeTab === 'pending_payment') return inv.status === 'pending_payment' || (inv.status as string) === 'approved';
        if (activeTab === 'paid') return inv.status === 'paid';
        return true;
    });

    const draftCount = dateFilteredInvoices.filter(i => i.status === 'draft').length;
    const approvedCount = dateFilteredInvoices.filter(i => i.status === 'pending_payment' || (i.status as string) === 'approved').length;
    const paidCount = dateFilteredInvoices.filter(i => i.status === 'paid').length;

    return (
        <div className="font-alexandria" style={{ backgroundColor: roleSettings.pageBg, minHeight: '100vh' }}>
            {/* Header */}
            <div className="w-full h-[80px] flex justify-between items-center px-[20px] border-b" style={{ backgroundColor: headerBg, boxShadow: "0px 4px 4px #0000001F" }}>
                <div className="flex flex-col">
                    <h1 className="text-[16px] md:text-[24px] font-[400] tracking-tight" style={{ color: roleSettings.pageTabColor }}>Invoice Management</h1>
                    <p className="text-xs md:text-sm" style={{ color: roleSettings.pageTabColor, opacity: 0.8 }}>Manage generated invoices, payout approval workflows, and settlements.</p>
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
                {/* Summary Metrics Cards */}
                {summary && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="border border-amber-200 bg-amber-50/50 shadow-sm rounded-xl">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Total Outstanding</p>
                                    <p className="text-2xl font-bold text-amber-950 mt-1">${Number(summary.total_outstanding).toFixed(2)}</p>
                                    <p className="text-[11px] text-amber-700 mt-0.5">Unbilled earnings + pending invoices</p>
                                </div>
                                <div className="p-3 bg-amber-100 rounded-xl text-amber-700">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-blue-200 bg-blue-50/50 shadow-sm rounded-xl">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Approved for Payout</p>
                                    <p className="text-2xl font-bold text-blue-950 mt-1">${Number(summary.approved_payouts).toFixed(2)}</p>
                                    <p className="text-[11px] text-blue-700 mt-0.5">Ready for Stripe or Manual settlement</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-xl text-blue-700">
                                    <Wallet className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-emerald-200 bg-emerald-50/50 shadow-sm rounded-xl">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Paid This Month</p>
                                    <p className="text-2xl font-bold text-emerald-950 mt-1">${Number(summary.paid_this_month).toFixed(2)}</p>
                                    <p className="text-[11px] text-emerald-700 mt-0.5">Successfully settled this cycle</p>
                                </div>
                                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tab Controls & Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-3">
                    <div className="flex items-center gap-1 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('draft')}
                            className={cn(
                                "px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap",
                                activeTab === 'draft' ? "" : "text-muted-foreground hover:text-foreground"
                            )}
                            style={activeTab === 'draft' ? { color: roleSettings.pageTabColor } : {}}
                        >
                            Drafts
                            <Badge variant="secondary" className="ml-2 px-1.5 h-5 min-w-[20px]">
                                {draftCount}
                            </Badge>
                            {activeTab === 'draft' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: roleSettings.pageTabColor }} />}
                        </button>

                        <button
                            onClick={() => setActiveTab('pending_payment')}
                            className={cn(
                                "px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap",
                                activeTab === 'pending_payment' ? "" : "text-muted-foreground hover:text-foreground"
                            )}
                            style={activeTab === 'pending_payment' ? { color: roleSettings.pageTabColor } : {}}
                        >
                            Approved for Payout
                            <Badge variant="secondary" className="ml-2 px-1.5 h-5 min-w-[20px] bg-blue-100 text-blue-800">
                                {approvedCount}
                            </Badge>
                            {activeTab === 'pending_payment' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: roleSettings.pageTabColor }} />}
                        </button>

                        <button
                            onClick={() => setActiveTab('paid')}
                            className={cn(
                                "px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap",
                                activeTab === 'paid' ? "" : "text-muted-foreground hover:text-foreground"
                            )}
                            style={activeTab === 'paid' ? { color: roleSettings.pageTabColor } : {}}
                        >
                            Paid
                            <Badge variant="secondary" className="ml-2 px-1.5 h-5 min-w-[20px] bg-emerald-100 text-emerald-800">
                                {paidCount}
                            </Badge>
                            {activeTab === 'paid' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: roleSettings.pageTabColor }} />}
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <PayPeriodFilter
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(s, e) => {
                                setStartDate(s);
                                setEndDate(e);
                            }}
                            roleSettings={roleSettings}
                            compact={true}
                        />

                        {isSuperAdmin && organizations.length > 0 && (
                            <div className="w-full sm:w-[220px]">
                                <SearchableSelect
                                    options={[
                                        { label: "All Organizations", value: "all" },
                                        ...organizations.map((org) => ({
                                            label: org.name,
                                            value: String(org.id),
                                        })),
                                    ]}
                                    value={orgFilter}
                                    onChange={(val) => setOrgFilter(val)}
                                    placeholder="Filter by Org..."
                                    searchPlaceholder="Search organization..."
                                    emptyMessage="No organization found."
                                    className="h-9 text-xs bg-white"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <InvoiceTable
                    invoices={filteredInvoices}
                    loading={loading}
                    activeTab={activeTab}
                    onPay={handlePay}
                    onApprove={handleApprovePayout}
                    onManualPay={handleOpenManualPay}
                    onEdit={handleEdit}
                    onDelete={handleDeleteInvoice}
                    onView={handleView}
                    paying={paying}
                    approving={approving}
                    roleSettings={roleSettings}
                    headerBg={headerBg}
                    userType={userType}
                    isMobile={isMobile}
                    isSuperAdmin={isSuperAdmin}
                    triggerPaymentAction={triggerPaymentAction}
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
                        onEdit={(inv: VendorInvoice) => {
                            setIsViewModalOpen(false);
                            handleEdit(inv);
                        }}
                        onDelete={handleDeleteInvoice}
                        onPay={handlePay}
                        onManualPay={handleOpenManualPay}
                        triggerPaymentAction={triggerPaymentAction}
                        roleSettings={roleSettings}
                    />
                )}

                <ConfirmationDialog
                    open={confirmOpen}
                    setOpen={setConfirmOpen}
                    onConfirm={confirmAndExecute}
                    showAgain={showAgain}
                    toggleShowAgain={() => setShowAgain(!showAgain)}
                    dialogType="payment"
                />

                <ConfirmationDialog
                    open={confirmDeleteOpen}
                    setOpen={setConfirmDeleteOpen}
                    onConfirm={executeDeleteInvoice}
                    showAgain={true}
                    toggleShowAgain={() => {}}
                    dialogType="delete"
                    title="DELETE INVOICE"
                    description="Are you sure you want to delete this invoice? The invoice will be permanently deleted and all linked orders/services will be released back to uninvoiced work."
                />

                {/* Mark as Paid (Manual) Dialog */}
                {manualPayInvoice && (
                    <Dialog open={isManualPayModalOpen} onOpenChange={setIsManualPayModalOpen}>
                        <DialogContent className="max-w-md p-6 font-alexandria">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold" style={{ color: roleSettings.pageTabColor }}>
                                    Record Payment: #{manualPayInvoice.invoice_number}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4 py-2">
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1">
                                    <p className="font-semibold text-gray-800">Vendor: {manualPayInvoice.vendor?.company_name || `${manualPayInvoice.vendor?.first_name} ${manualPayInvoice.vendor?.last_name}`}</p>
                                    <p className="text-gray-600">Total Payout Amount: <strong className="text-gray-900">${Number(manualPayInvoice.total_amount).toFixed(2)}</strong></p>
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold text-gray-700">Payment Date</Label>
                                    <Input
                                        type="date"
                                        value={manualDate}
                                        onChange={(e) => setManualDate(e.target.value)}
                                        className="h-9 text-xs mt-1"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold text-gray-700">Payment Method</Label>
                                    <Select value={manualMethod} onValueChange={setManualMethod}>
                                        <SelectTrigger className="h-9 text-xs mt-1">
                                            <SelectValue placeholder="Select Method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Bank Transfer">Bank Transfer / EFT / ACH</SelectItem>
                                            <SelectItem value="Check">Check / Cheque</SelectItem>
                                            <SelectItem value="E-Transfer">Interac E-Transfer</SelectItem>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold text-gray-700">Check # / Transfer Reference</Label>
                                    <Input
                                        placeholder="e.g. Check #1049 or Ref TXN-8930"
                                        value={manualRef}
                                        onChange={(e) => setManualRef(e.target.value)}
                                        className="h-9 text-xs mt-1"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold text-gray-700">Notes / Remarks (Optional)</Label>
                                    <Input
                                        placeholder="Add payment notes"
                                        value={manualNotes}
                                        onChange={(e) => setManualNotes(e.target.value)}
                                        className="h-9 text-xs mt-1"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsManualPayModalOpen(false)}
                                    disabled={isSubmittingManualPay}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    className="text-white hover:brightness-110"
                                    style={{ backgroundColor: roleSettings.pageTabColor }}
                                    onClick={handleConfirmManualPay}
                                    disabled={isSubmittingManualPay}
                                >
                                    {isSubmittingManualPay ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
                                    Confirm Paid
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
}

function InvoiceTable({
    invoices,
    loading,
    onPay,
    onApprove,
    onManualPay,
    onEdit,
    onDelete,
    onView,
    paying,
    approving,
    roleSettings,
    isMobile,
    isSuperAdmin,
    triggerPaymentAction
}: any) {
    if (loading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-[120px] w-full" />
                <Skeleton className="h-[120px] w-full" />
                <Skeleton className="h-[120px] w-full" />
            </div>
        );
    }

    if (invoices.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-gray-50 border-dashed">
                <p className="text-sm text-gray-500">No invoices found in this view.</p>
            </div>
        );
    }

    if (isMobile) {
        return (
            <div className="space-y-3">
                {invoices.map((invoice: VendorInvoice) => {
                    const status = invoice.status || 'draft';
                    let bgColor = "#E06D5E";
                    if (status === "paid") bgColor = "#6BAE41";
                    else if (status === "pending_payment") bgColor = "#3B82F6";
                    else if (status === "draft") bgColor = "#F5A623";

                    const displayVendor = invoice.vendor?.company_name ||
                        invoice.vendor_details?.company_name ||
                        invoice.vendor_details?.name ||
                        `${invoice.vendor?.first_name || ""} ${invoice.vendor?.last_name || ""}`.trim() ||
                        "Vendor";

                    const orgName = invoice.org_details?.name || invoice.organization?.name;

                    return (
                        <Card key={invoice.uuid} className="p-4 shadow-sm border border-gray-200">
                            <CardContent className="p-0 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900" style={{ color: roleSettings?.pageTabColor }}>
                                            #{invoice.invoice_number}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1 font-semibold">
                                            {displayVendor}
                                        </p>
                                        {isSuperAdmin && orgName && (
                                            <p className="text-[11px] text-blue-600 font-medium mt-0.5">
                                                {orgName}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            {new Date(invoice.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[14px] font-bold text-gray-800">${Number(invoice.total_amount).toFixed(2)}</p>
                                        <Badge className="text-white px-2 py-0.5 rounded text-[9px] font-medium uppercase mt-2 border-0" style={{ backgroundColor: bgColor }}>
                                            {status === 'pending_payment' ? 'APPROVED' : status.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                                    {status === 'draft' && onApprove && (
                                        <Button
                                            size="sm"
                                            className="flex-1 h-8 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                                            onClick={() => onApprove(invoice.uuid)}
                                            disabled={approving === invoice.uuid}
                                        >
                                            {approving === invoice.uuid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                            Approve
                                        </Button>
                                    )}
                                    {(status === 'draft' || status === 'pending_payment') && onPay && (
                                        <Button
                                            size="sm"
                                            className="flex-1 h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                            onClick={() => triggerPaymentAction ? triggerPaymentAction(() => onPay(invoice.uuid)) : onPay(invoice.uuid)}
                                            disabled={paying === invoice.uuid}
                                        >
                                            {paying === invoice.uuid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                                            Stripe
                                        </Button>
                                    )}
                                    {(status === 'draft' || status === 'pending_payment') && onManualPay && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 h-8 text-xs gap-1"
                                            onClick={() => onManualPay(invoice)}
                                        >
                                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                            Mark Paid
                                        </Button>
                                    )}
                                    {status !== 'paid' && onEdit && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs gap-1"
                                            onClick={() => onEdit(invoice)}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                    {status !== 'paid' && onDelete && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                            onClick={() => onDelete(invoice)}
                                            title="Delete Invoice"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs gap-1"
                                        onClick={() => onView(invoice)}
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        );
    }

    const columns: ColumnDef<VendorInvoice>[] = [
        {
            accessorKey: "invoice_number",
            header: "INVOICE #",
            cell: ({ row }) => (
                <div className="font-semibold" style={{ color: roleSettings?.pageTabColor }}>
                    #{row.original.invoice_number}
                </div>
            )
        },
        ...(isSuperAdmin ? [{
            accessorKey: "organization",
            header: "ORGANIZATION",
            cell: ({ row }: any) => {
                const orgName = row.original.org_details?.name || row.original.organization?.name || "—";
                return (
                    <div className="font-medium text-xs text-blue-600">
                        {orgName}
                    </div>
                );
            }
        }] : []),
        {
            accessorKey: "vendor",
            header: "VENDOR",
            cell: ({ row }) => {
                const company = row.original.vendor?.company_name || row.original.vendor_details?.company_name;
                const name = row.original.vendor_details?.name || `${row.original.vendor?.first_name || ""} ${row.original.vendor?.last_name || ""}`.trim();
                return (
                    <div>
                        <div className="font-medium text-gray-900">{company || name}</div>
                        {company && name && <div className="text-xs text-gray-500">{name}</div>}
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
            cell: ({ row }) => (
                <div className="font-semibold text-gray-900">
                    ${Number(row.original.total_amount).toFixed(2)}
                </div>
            )
        },
        {
            accessorKey: "status",
            header: "STATUS",
            cell: ({ row }) => {
                const status = row.original.status || 'draft';
                let bgColor = "#E06D5E";
                if (status === "paid") bgColor = "#6BAE41";
                else if (status === "pending_payment") bgColor = "#3B82F6";
                else if (status === "draft") bgColor = "#F5A623";

                return (
                    <Badge
                        className="text-white px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border-0"
                        style={{ backgroundColor: bgColor }}
                    >
                        {status === 'pending_payment' ? 'APPROVED' : status.toUpperCase()}
                    </Badge>
                );
            }
        },
        {
            id: "actions",
            header: "ACTIONS",
            enableHiding: false,
            cell: ({ row }) => {
                const invoice = row.original;
                const status = invoice.status || 'draft';

                return (
                    <div className="flex justify-end gap-1.5">
                        {status === 'draft' && onApprove && (
                            <Button
                                size="sm"
                                className="h-7 px-2.5 gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                onClick={() => onApprove(invoice.uuid)}
                                disabled={approving === invoice.uuid}
                            >
                                {approving === invoice.uuid ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                Approve
                            </Button>
                        )}
                        {(status === 'draft' || status === 'pending_payment') && onPay && (
                            <Button
                                size="sm"
                                className="h-7 px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                onClick={() => triggerPaymentAction ? triggerPaymentAction(() => onPay(invoice.uuid)) : onPay(invoice.uuid)}
                                disabled={paying === invoice.uuid}
                            >
                                {paying === invoice.uuid ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}
                                Stripe
                            </Button>
                        )}
                        {(status === 'draft' || status === 'pending_payment') && onManualPay && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2.5 gap-1 text-xs border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => onManualPay(invoice)}
                            >
                                <DollarSign className="h-3 w-3 text-emerald-600" />
                                Mark Paid
                            </Button>
                        )}
                        {status !== 'paid' && onEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => onEdit(invoice)}
                                title="Edit Invoice"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                        )}
                        {status !== 'paid' && onDelete && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => onDelete(invoice)}
                                title="Delete Invoice"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => onView(invoice)}
                            title="View Invoice"
                        >
                            <Eye className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                );
            }
        }
    ];

    return (
        <DataTable
            columns={columns}
            data={invoices}
            dataName="Invoices"
        />
    );
}

const enrichModalInvoiceLines = (lines: any[]) => {
    if (!lines || !Array.isArray(lines)) return [];

    return lines.map((line: any) => {
        let desc = line.description || "";

        if (desc.includes("Order #") || desc.includes("order:") || desc.includes("address:")) {
            return {
                ...line,
                description: desc,
                quantity: line.quantity || 1,
                unit_price: line.unit_price || line.amount,
            };
        }

        const lineOrderSvc = line.order_service;
        const lineOrder = line.order || lineOrderSvc?.order;

        const address =
            lineOrder?.property_address ||
            lineOrder?.property?.property_address ||
            lineOrder?.property?.address ||
            "";
        const orderId = lineOrder?.id || lineOrderSvc?.order_id || "";

        if (address || orderId) {
            if (address && orderId) {
                desc = `${desc}\n${address} (Order #${orderId})`;
            } else if (address) {
                desc = `${desc}\n${address}`;
            } else if (orderId) {
                desc = `${desc}\nOrder #${orderId}`;
            }
        }

        return {
            ...line,
            description: desc,
            quantity: line.quantity || 1,
            unit_price: line.unit_price || line.amount,
        };
    });
};

function ViewInvoiceModal({ isOpen, onClose, invoice, onEdit, onDelete, onPay, onManualPay, triggerPaymentAction, roleSettings }: any) {
    const handleDownload = async () => {
        if (!invoice) return;
        const invoiceNumber = invoice.invoice_number || invoice.id;
        const fileName = `Invoice_${invoiceNumber}.pdf`;
        await DownloadInvoicePdf('invoice-pdf-content', fileName);
    }

    // Map vendor invoice data to InvoiceDocument format
    const documentData = {
        ...invoice,
        items: enrichModalInvoiceLines(invoice?.lines || [])
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] flex flex-col rounded-[8px] p-0 font-alexandria overflow-hidden bg-gray-50">
                <DialogHeader className="px-5 py-3.5 md:px-6 md:py-4 border-b border-[#E4E4E4] bg-white shrink-0">
                    <DialogTitle className="flex flex-wrap items-center justify-between gap-3 w-full font-alexandria relative pr-8">
                        <div className="flex flex-col items-start min-w-[200px] shrink-0">
                            <span className="text-[18px] md:text-[20px] font-[700] uppercase tracking-wide leading-none" style={{ color: roleSettings.pageTabColor }}>
                                Invoice
                            </span>
                            <span className="text-[12px] md:text-[13px] font-[500] text-gray-500 mt-1 font-mono tracking-tight whitespace-nowrap">
                                #{invoice.invoice_number || invoice.id}
                            </span>
                        </div>

                        <div className="flex items-center flex-wrap gap-1.5 ml-auto">
                            {invoice?.status !== 'paid' && onEdit && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        onClose();
                                        onEdit(invoice);
                                    }}
                                    className="h-8 px-2.5 text-xs font-semibold gap-1 border-gray-300 hover:bg-gray-100 rounded-[6px] shadow-sm transition-all cursor-pointer"
                                >
                                    <Pencil className="w-3.5 h-3.5 inline-block" /> Edit
                                </Button>
                            )}
                            {invoice?.status !== 'paid' && onDelete && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        onClose();
                                        onDelete(invoice);
                                    }}
                                    className="h-8 px-2.5 text-xs font-semibold gap-1 border-red-200 text-red-600 hover:bg-red-50 rounded-[6px] shadow-sm transition-all cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5 inline-block" /> Delete
                                </Button>
                            )}
                            <Button
                                size="sm"
                                onClick={handleDownload}
                                className="h-8 px-3 text-xs font-semibold text-white hover:brightness-90 hover:!text-white rounded-[6px] border-none shadow-sm gap-1.5 transition-all cursor-pointer"
                                style={{ backgroundColor: roleSettings.pageTabColor }}
                            >
                                <Download className="w-3.5 h-3.5 inline-block" /> Download PDF
                            </Button>
                            {invoice?.status !== 'paid' && onPay && (
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        onClose();
                                        if (triggerPaymentAction) {
                                            triggerPaymentAction(() => onPay(invoice.uuid));
                                        } else {
                                            onPay(invoice.uuid);
                                        }
                                    }}
                                    className="h-8 px-3 text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[6px] shadow-sm transition-all cursor-pointer"
                                >
                                    <CreditCard className="w-3.5 h-3.5 inline-block" /> Stripe
                                </Button>
                            )}
                            {invoice?.status !== 'paid' && onManualPay && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        onClose();
                                        onManualPay(invoice);
                                    }}
                                    className="h-8 px-3 text-xs font-semibold gap-1 border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-[6px] shadow-sm transition-all cursor-pointer"
                                >
                                    <DollarSign className="w-3.5 h-3.5 inline-block" /> Mark Paid
                                </Button>
                            )}
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

