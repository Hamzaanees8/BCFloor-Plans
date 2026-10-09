'use client'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Printer, Download, Loader2, Edit2, Save, X, RotateCcw, CreditCard, Check, RefreshCw, Calendar } from 'lucide-react'
import DownloadInvoicePdf from './DownloadInvoicePdf'
import InvoiceDocument from './InvoiceDocument'
import InvoicePdfDocument from './InvoicePdfDocument'
import { UpdateInvoice } from '../invoice_api'
import RefundModal from './RefundModal'
import { toast } from 'sonner'
import { useWhiteLabel } from '@/app/context/Whitelabel'
import { useAppContext } from '@/app/context/AppContext'

type InvoiceModalProps = {
    uuid: string;
    isOpen: boolean;
    onClose: () => void;
}

const renewalPlans = [
    { id: "30_days", unit: "days", days: 30, months: 1, label: "30 Days Extension", price: 20 },
    { id: "3_months", unit: "months", months: 3, days: 90, label: "3 Months", price: 35 },
    { id: "6_months", unit: "months", months: 6, days: 180, label: "6 Months", price: 60 },
    { id: "12_months", unit: "months", months: 12, days: 365, label: "1 Year (12 Months)", price: 100 },
];

const InvoiceModal = ({ uuid, isOpen, onClose }: InvoiceModalProps) => {
    const [invoice, setInvoice] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState<any>(null)
    const [saving, setSaving] = useState(false)
    const [paying, setPaying] = useState(false)
    const [updatingPlan, setUpdatingPlan] = useState(false)
    const [selectedPlanId, setSelectedPlanId] = useState<string>("6_months")
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false)
    const { userType } = useAppContext()
    const { appliedSettings } = useWhiteLabel()
    const role = (userType as string) || 'admin'
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin']

    useEffect(() => {
        if (isOpen && uuid) {
            fetchInvoice()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, uuid])

    const fetchInvoice = () => {
        const token = localStorage.getItem('token')
        if (!token || !uuid) return

        setLoading(true)
        const url = `${process.env.NEXT_PUBLIC_API_URL}/invoices/${uuid}`;
        fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(async (res) => {
                if (res.ok) {
                    return res.json();
                }
                const fallbackRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices?order_uuid=${uuid}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                return fallbackRes.json();
            })
            .then(res => {
                const inv = Array.isArray(res?.data) ? res.data[0] : (res?.data || res);
                if (inv && (inv.id || inv.uuid)) {
                    setInvoice(inv)
                    setEditData(JSON.parse(JSON.stringify(inv))) // Deep copy for editing

                    // Match plan if possible
                    if (inv.subtotal) {
                        const found = renewalPlans.find(p => Math.abs(Number(p.price) - Number(inv.subtotal)) < 0.5);
                        if (found) setSelectedPlanId(found.id);
                    }
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }

    const isMatterportInvoice = invoice && (
        (invoice.notes || '').toLowerCase().includes('matterport') ||
        (invoice.notes || '').toLowerCase().includes('3d tour') ||
        (invoice.items || []).some((it: any) =>
            (it.description || '').toLowerCase().includes('matterport') ||
            (it.description || '').toLowerCase().includes('3d tour')
        )
    );

    const isPaid = invoice && ['paid', 'refunded'].includes((invoice.status || '').toLowerCase());

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const content = document.getElementById('invoice-download-content')?.innerHTML;
        printWindow.document.write(`
            <html>
                <head>
                    <title>Invoice #${invoice?.invoice_number || invoice?.id}</title>
                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        .no-print { display: none; }
                    </style>
                </head>
                <body>
                    ${content}
                    <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }

    const handleDownload = async () => {
        if (!invoice) return;
        const invoiceNumber = invoice.invoice_number || invoice.id;
        const fileName = `Invoice_${invoiceNumber}.pdf`;
        await DownloadInvoicePdf('invoice-pdf-content', fileName);
    }

    const handleSave = async () => {
        if (!editData) return
        setSaving(true)
        const token = localStorage.getItem('token')
        if (!token || !invoice?.uuid) return

        try {
            const payload = {
                notes: editData.notes,
                tax_rate: editData.tax_rate,
                tax_type: editData.tax_type,
                tax_number: editData.tax_number || editData.tax_snapshot?.tax_number,
                items: editData.items.map((item: any) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    order_service_id: item.order_service_id || item.order_service?.id || null
                }))
            }
            await UpdateInvoice(invoice.uuid, payload)
            toast.success('Invoice updated successfully')
            fetchInvoice()
            setIsEditing(false)
        } catch (error) {
            console.error('Save failed:', error)
            toast.error('Failed to update invoice')
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateMatterportPlan = async (targetMethod: 'invoice' | 'stripe' = 'invoice') => {
        if (!invoice) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        const selectedPlan = renewalPlans.find(p => p.id === selectedPlanId) || renewalPlans[0];
        const isDays = selectedPlan.unit === "days";
        const daysCount = isDays ? selectedPlan.days : (selectedPlan.months ? selectedPlan.months * 30 : 30);
        const monthsCount = !isDays ? selectedPlan.months : Math.max(1, Math.round((selectedPlan.days || 30) / 30));

        setUpdatingPlan(true);
        try {
            const tourUuid = invoice.order?.uuid || invoice.uuid;
            const returnUrl = typeof window !== 'undefined' ? (window.location.origin + window.location.pathname) : undefined;

            const payload = {
                duration_days: daysCount,
                duration_months: monthsCount,
                plan_id: selectedPlan.id,
                amount: selectedPlan.price,
                payment_method: targetMethod,
                notes: invoice.notes,
                return_url: returnUrl,
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matterport/${tourUuid}/renew`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }).then(r => r.json());

            if (res && res.success) {
                if (targetMethod === 'stripe') {
                    const checkoutUrl = res.checkout_url || res.data?.checkout_url;
                    if (checkoutUrl) {
                        toast.success('Redirecting to Stripe payment...');
                        window.location.href = checkoutUrl;
                        return;
                    }
                }

                toast.success(`Invoice updated to ${selectedPlan.label} ($${Number(res.data?.invoice?.total || (selectedPlan.price * 1.05)).toFixed(2)} CAD).`);
                fetchInvoice();
            } else {
                toast.error(res?.message || 'Failed to update invoice duration.');
            }
        } catch (err: any) {
            console.error('Update plan error:', err);
            toast.error(err.message || 'An error occurred while updating invoice.');
        } finally {
            setUpdatingPlan(false);
        }
    };

    const handlePayNow = async () => {
        if (!invoice) return;
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Please log in to continue.');
            return;
        }

        // If it's a Matterport renewal invoice, trigger renew endpoint with stripe
        if (isMatterportInvoice) {
            await handleUpdateMatterportPlan('stripe');
            return;
        }

        // Otherwise standard agent checkout session
        setPaying(true);
        try {
            const returnUrl = typeof window !== 'undefined' ? (window.location.origin + window.location.pathname) : undefined;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agent/pay/create-session`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    agent_uuid: invoice.agent?.uuid || invoice.agent_uuid,
                    amount: parseFloat(invoice.total || 0),
                    currency: invoice.currency || 'cad',
                    order_id: invoice.order_id || invoice.order?.id,
                    invoice_uuid: invoice.uuid,
                    payment_type: 'full',
                    url: returnUrl,
                }),
            }).then(r => r.json());

            const checkoutUrl = res.url || res.data?.url || res.checkout_url;
            if (checkoutUrl) {
                toast.success('Redirecting to Stripe payment...');
                window.location.href = checkoutUrl;
                return;
            }

            toast.error(res.message || 'Failed to initiate checkout session.');
        } catch (err: any) {
            console.error('Pay error:', err);
            toast.error(err.message || 'Failed to process payment.');
        } finally {
            setPaying(false);
        }
    };

    const handleMarkPaid = async () => {
        if (!invoice) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        setPaying(true);
        try {
            if (isMatterportInvoice && invoice.order?.uuid) {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matterport/${invoice.order.uuid}/renew`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount: parseFloat(invoice.total || invoice.subtotal || 0),
                        payment_method: 'manual',
                        notes: invoice.notes,
                    }),
                }).then(r => r.json());

                if (res.success) {
                    toast.success('Invoice marked as paid and hosting renewed!');
                    fetchInvoice();
                    return;
                }
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoice.uuid}/markPaid`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: invoice.total,
                    payment_method: 'manual',
                }),
            }).then(r => r.json());

            if (res.success || res.status) {
                toast.success('Invoice marked as paid!');
                fetchInvoice();
            } else {
                toast.error(res.message || 'Failed to mark invoice as paid.');
            }
        } catch (err: any) {
            console.error('Mark paid error:', err);
            toast.error(err.message || 'An error occurred.');
        } finally {
            setPaying(false);
        }
    };

    const handleRefund = async () => {
        setIsRefundModalOpen(true)
    }

    const recalulateTotals = (items: any[], taxRate: number) => {
        const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.quantity) * parseFloat(item.unit_price) || 0), 0)
        const taxAmount = subtotal * (taxRate / 100)
        return {
            subtotal: subtotal.toFixed(2),
            tax_amount: taxAmount.toFixed(2),
            total: (subtotal + taxAmount).toFixed(2)
        }
    }

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...editData.items]
        newItems[index] = { ...newItems[index], [field]: value }

        const totals = recalulateTotals(newItems, parseFloat(editData.tax_rate))
        setEditData({
            ...editData,
            items: newItems,
            ...totals
        })
    }

    const addItem = () => {
        const newItem = {
            description: '',
            quantity: 1,
            unit_price: 0,
            amount: 0,
            order_service_id: null
        }
        const newItems = [...editData.items, newItem]
        const totals = recalulateTotals(newItems, parseFloat(editData.tax_rate))
        setEditData({
            ...editData,
            items: newItems,
            ...totals
        })
    }

    const removeItem = (index: number) => {
        const newItems = editData.items.filter((_: any, i: number) => i !== index)
        const totals = recalulateTotals(newItems, parseFloat(editData.tax_rate))
        setEditData({
            ...editData,
            items: newItems,
            ...totals
        })
    }

    const updateTaxRate = (val: string) => {
        const rate = parseFloat(val) || 0
        const totals = recalulateTotals(editData.items, rate)
        setEditData({
            ...editData,
            tax_rate: val,
            ...totals
        })
    }

    const updateTaxType = (val: string) => {
        setEditData({
            ...editData,
            tax_type: val
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto font-alexandria">
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-4 flex-wrap gap-2">
                    <DialogTitle className="text-xl font-bold">
                        {loading ? 'Loading Invoice...' : invoice ? `Invoice #${invoice.invoice_number || invoice.id}` : 'Invoice'}
                    </DialogTitle>
                    <div className="flex gap-2 pr-8 flex-wrap items-center">
                        {invoice && !loading && (
                            <>
                                {isEditing ? (
                                    <>
                                        <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={saving}>
                                            <X className="mr-2 h-4 w-4" /> Cancel
                                        </Button>
                                        <Button size="sm" onClick={handleSave} disabled={saving} className="admin-bg text-white">
                                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save Changes
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        {/* Pay Now Button for Unpaid Invoice */}
                                        {!isPaid && (
                                            <Button
                                                size="sm"
                                                onClick={handlePayNow}
                                                disabled={paying || updatingPlan}
                                                className="bg-[#4290E9] hover:bg-[#357ac8] text-white flex items-center gap-1.5 shadow-sm font-bold"
                                            >
                                                {paying || updatingPlan ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <CreditCard className="h-4 w-4" />
                                                )}
                                                Pay ${Number(invoice.total || 0).toFixed(2)} CAD via Stripe
                                            </Button>
                                        )}

                                        {/* Mark Paid (Admin Only) */}
                                        {role === 'admin' && !isPaid && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleMarkPaid}
                                                disabled={paying}
                                                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold flex items-center gap-1"
                                            >
                                                <Check className="h-4 w-4" /> Mark Paid
                                            </Button>
                                        )}

                                        {role === 'admin' &&
                                            ['paid', 'partially_refunded', 'partial_refunded'].includes((invoice.status || '').toLowerCase()) &&
                                            (parseFloat(invoice.paid_amount || invoice.total || 0) - parseFloat(invoice.refunded_amount || 0)) > 0 && (
                                            <Button variant="outline" size="sm" onClick={handleRefund} disabled={saving} className="text-orange-600 hover:text-orange-700">
                                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />} Refund
                                            </Button>
                                        )}
                                        {role === 'admin' &&
                                            !['paid', 'refunded'].includes((invoice.status || '').toLowerCase()) &&
                                            (parseFloat(invoice.total || 0) === 0 || (invoice.status || '').toLowerCase() !== 'partially_refunded') && (
                                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                                <Edit2 className="h-4 w-4 mr-2" /> Edit
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" onClick={handleDownload} className="flex items-center gap-2">
                                            <Download className="h-4 w-4" /> Download PDF
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={handlePrint}>
                                            <Printer className="mr-2 h-4 w-4" /> Print
                                        </Button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </DialogHeader>

                {/* Matterport Duration Extension Bar if this is a Matterport Renewal Invoice and Unpaid */}
                {invoice && !loading && isMatterportInvoice && !isPaid && (
                    <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 my-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                            <div>
                                <span className="font-bold text-gray-900">Change Extension Duration / Days:</span>
                                <p className="text-[11px] text-gray-500">Select a new plan to update the invoice total before paying.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <select
                                value={selectedPlanId}
                                onChange={(e) => setSelectedPlanId(e.target.value)}
                                className="h-8 text-xs border border-gray-300 rounded px-2 bg-white font-medium focus:ring-1 focus:ring-blue-500"
                            >
                                {renewalPlans.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.label} - ${p.price.toFixed(2)} CAD (+GST)
                                    </option>
                                ))}
                            </select>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateMatterportPlan('invoice')}
                                disabled={updatingPlan}
                                className="h-8 text-xs font-semibold px-2.5 border-blue-300 text-blue-700 hover:bg-blue-100 flex items-center gap-1"
                            >
                                {updatingPlan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                Update Invoice
                            </Button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex py-20 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : !invoice ? (
                    <div className="py-20 text-center text-gray-500">
                        No official invoice found for this order.
                    </div>
                ) : (
                    <InvoiceDocument
                        invoice={invoice}
                        editData={editData}
                        isEditing={isEditing}
                        updateItem={updateItem}
                        addItem={addItem}
                        removeItem={removeItem}
                        updateTaxRate={updateTaxRate}
                        updateTaxType={updateTaxType}
                        setEditData={setEditData}
                        roleSettings={roleSettings}
                    />
                )}

                {/* Hidden PDF component for high-accuracy capture */}
                <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                    <InvoicePdfDocument
                        invoice={isEditing ? editData : invoice}
                        roleSettings={roleSettings}
                    />
                </div>

                <RefundModal 
                    isOpen={isRefundModalOpen}
                    onClose={() => setIsRefundModalOpen(false)}
                    invoice={invoice}
                    onSuccess={() => {
                        fetchInvoice()
                    }}
                />
            </DialogContent>
        </Dialog>
    )
}

export default InvoiceModal