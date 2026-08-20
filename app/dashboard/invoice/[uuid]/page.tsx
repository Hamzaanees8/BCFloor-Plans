'use client'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { GetInvoice, MarkPaid, UpdateInvoice } from '../invoice_api'
import { useWhiteLabel } from '@/app/context/Whitelabel'
import { useAppContext } from '@/app/context/AppContext'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Download, Loader2, Edit2, Save, X, CreditCard, RotateCcw } from 'lucide-react'
import DownloadInvoicePdf from '../components/DownloadInvoicePdf'
import InvoiceDocument from '../components/InvoiceDocument'
import InvoicePdfDocument from '../components/InvoicePdfDocument'
import RefundModal from '../components/RefundModal'
import ConfirmationDialog from '@/components/ConfirmationDialog'

const STORAGE_KEY_PAYMENT = 'confirmation_dialog_payment_show_again';

const InvoicePreviewPage = () => {
    const { uuid } = useParams()
    const { userType } = useAppContext()
    const { appliedSettings } = useWhiteLabel()
    const role = (userType as string)?.toLowerCase() || 'admin'
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin']
    const headerBg = `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`

    const [invoice, setInvoice] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState<any>(null)
    const [saving, setSaving] = useState(false)
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [showAgain, setShowAgain] = useState(true)

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY_PAYMENT);
        if (stored !== null) {
            setShowAgain(JSON.parse(stored));
        }
    }, []);

    useEffect(() => {
        fetchInvoice()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uuid])

    const fetchInvoice = () => {
        const token = localStorage.getItem('token')
        if (!token || !uuid) return

        setLoading(true)
        GetInvoice(uuid as string)
            .then(res => {
                const inv = res.data;
                setInvoice(inv)
                const clone = JSON.parse(JSON.stringify(inv));
                // Ensure items have proper flags
                if (clone.items) {
                    clone.items = clone.items.map((item: any) => ({
                        ...item,
                        gst_enabled: item.gst_enabled !== undefined ? Boolean(item.gst_enabled) : true,
                        pst_enabled: item.pst_enabled !== undefined ? Boolean(item.pst_enabled) : false,
                    }));
                }
                setEditData(clone)
            })
            .catch(() => toast.error('Failed to load invoice'))
            .finally(() => setLoading(false))
    }

    const handleDownload = async () => {
        if (!invoice) return;
        const invoiceNumber = invoice.invoice_number || invoice.id;
        const fileName = `Invoice_${invoiceNumber}.pdf`;
        await DownloadInvoicePdf('invoice-pdf-content', fileName);
    }

    const getProvince = () => {
        return (invoice?.order?.property?.province || invoice?.order?.property?.state || invoice?.agent?.headquarter_province || 'BC').toUpperCase().trim();
    }

    const calculateTaxRates = (provinceStr: string) => {
        const prov = (provinceStr || 'BC').toUpperCase().trim();
        switch (prov) {
            case 'ON':
            case 'ONTARIO':
                return { hstRate: 13, gstRate: 0, pstRate: 0, isHST: true, name: 'HST' };
            case 'NB':
            case 'NEW BRUNSWICK':
            case 'NL':
            case 'NEWFOUNDLAND':
            case 'NS':
            case 'NOVA SCOTIA':
            case 'PE':
            case 'PRINCE EDWARD ISLAND':
                return { hstRate: 15, gstRate: 0, pstRate: 0, isHST: true, name: 'HST' };
            case 'BC':
            case 'BRITISH COLUMBIA':
                return { hstRate: 0, gstRate: 5, pstRate: 7, isHST: false, name: 'GST + PST' };
            case 'SK':
            case 'SASKATCHEWAN':
                return { hstRate: 0, gstRate: 5, pstRate: 6, isHST: false, name: 'GST + PST' };
            case 'MB':
            case 'MANITOBA':
                return { hstRate: 0, gstRate: 5, pstRate: 7, isHST: false, name: 'GST + RST' };
            case 'QC':
            case 'QUEBEC':
                return { hstRate: 0, gstRate: 5, pstRate: 9.975, isHST: false, name: 'GST + QST' };
            default:
                // AB, NT, NU, YT (5% GST only)
                return { hstRate: 0, gstRate: 5, pstRate: 0, isHST: false, name: 'GST' };
        }
    };

    const recalulateTotals = (items: any[]) => {
        const province = getProvince();
        const taxRule = calculateTaxRates(province);

        let subtotal = 0;
        let totalGstAmount = 0;
        let totalPstAmount = 0;
        let totalHstAmount = 0;

        const updatedItems = items.map(item => {
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.unit_price) || 0;
            const amount = Number((qty * price).toFixed(2));
            const gstEnabled = item.gst_enabled !== undefined ? Boolean(item.gst_enabled) : true;
            const pstEnabled = item.pst_enabled !== undefined ? Boolean(item.pst_enabled) : false;

            let gstAmount = 0;
            let pstAmount = 0;
            let hstAmount = 0;

            if (taxRule.isHST) {
                if (gstEnabled) hstAmount = Number((amount * (taxRule.hstRate / 100)).toFixed(2));
            } else {
                if (gstEnabled) gstAmount = Number((amount * (taxRule.gstRate / 100)).toFixed(2));
                if (pstEnabled) pstAmount = Number((amount * (taxRule.pstRate / 100)).toFixed(2));
            }

            const itemTax = Number((gstAmount + pstAmount + hstAmount).toFixed(2));

            subtotal += amount;
            totalGstAmount += gstAmount;
            totalPstAmount += pstAmount;
            totalHstAmount += hstAmount;

            return {
                ...item,
                amount: amount.toFixed(2),
                tax_amount: itemTax.toFixed(2),
                gst_amount: gstAmount.toFixed(2),
                pst_amount: pstAmount.toFixed(2),
                gst_enabled: gstEnabled,
                pst_enabled: pstEnabled,
            };
        });

        const totalTax = Number((totalGstAmount + totalPstAmount + totalHstAmount).toFixed(2));
        const grandTotal = Number((subtotal + totalTax).toFixed(2));
        const effectiveTaxRate = subtotal > 0 ? Number(((totalTax / subtotal) * 100).toFixed(2)) : 0;
        const paidAmount = parseFloat(editData?.paid_amount || invoice?.paid_amount || 0);
        const balanceDue = Number(Math.max(0, grandTotal - paidAmount).toFixed(2));

        const taxDetails: Record<string, { rate: number; amount: number }> = {};
        if (totalHstAmount > 0) taxDetails['HST'] = { rate: taxRule.hstRate, amount: totalHstAmount };
        if (totalGstAmount > 0) taxDetails['GST'] = { rate: taxRule.gstRate, amount: totalGstAmount };
        if (totalPstAmount > 0) taxDetails['PST'] = { rate: taxRule.pstRate, amount: totalPstAmount };
        if (Object.keys(taxDetails).length === 0 && totalTax > 0) {
            taxDetails['Tax'] = { rate: effectiveTaxRate, amount: totalTax };
        }

        return {
            items: updatedItems,
            subtotal: subtotal.toFixed(2),
            tax_rate: effectiveTaxRate.toString(),
            tax_amount: totalTax.toFixed(2),
            tax_details: taxDetails,
            total: grandTotal.toFixed(2),
            balance_due: balanceDue.toFixed(2),
            gst_amount: totalGstAmount.toFixed(2),
            pst_amount: totalPstAmount.toFixed(2),
        };
    };

    const handleSave = async () => {
        if (!editData) return
        setSaving(true)
        const token = localStorage.getItem('token')
        if (!token) return

        try {
            const payload = {
                notes: editData.notes,
                tax_rate_override: editData.tax_rate ? parseFloat(editData.tax_rate) : undefined,
                items: editData.items.map((item: any) => ({
                    uuid: item.uuid || undefined,
                    description: item.description,
                    quantity: parseFloat(item.quantity) || 1,
                    unit_price: parseFloat(item.unit_price) || 0,
                    gst_enabled: item.gst_enabled !== undefined ? Boolean(item.gst_enabled) : true,
                    pst_enabled: item.pst_enabled !== undefined ? Boolean(item.pst_enabled) : false,
                    order_service_id: item.order_service_id || item.order_service?.id || item.orderService?.id || null,
                    order_service_uuid: item.order_service_uuid || item.order_service?.uuid || item.orderService?.uuid || null,
                }))
            }
            await UpdateInvoice(invoice.uuid, payload)
            toast.success('Invoice updated successfully')
            fetchInvoice()
            setIsEditing(false)
        } catch (err: any) {
            console.error('Save failed:', err)
            toast.error(err.response?.data?.message || err.message || 'Connection error')
        } finally {
            setSaving(false)
        }
    }

    const handleMarkPaid = async () => {
        const executeMarkPaid = async () => {
            const token = localStorage.getItem('token')
            if (!token) return

            try {
                await MarkPaid(invoice.uuid, invoice.total)
                toast.success('Invoice marked as paid')
                fetchInvoice() // Refresh
            } catch {
                toast.error('Failed to update status')
            }
        }

        if (!showAgain) {
            executeMarkPaid()
        } else {
            setConfirmOpen(true)
        }
    }

    const onConfirmMarkPaid = () => {
        const executeMarkPaid = async () => {
            const token = localStorage.getItem('token')
            if (!token) return

            try {
                await MarkPaid(invoice.uuid, invoice.total)
                toast.success('Invoice marked as paid')
                fetchInvoice() // Refresh
            } catch {
                toast.error('Failed to update status')
            }
        }
        executeMarkPaid()
    }

    const toggleShowAgain = () => {
        const newValue = !showAgain;
        setShowAgain(newValue);
        localStorage.setItem(STORAGE_KEY_PAYMENT, JSON.stringify(newValue));
    }

    const handleRefund = async () => {
        setIsRefundModalOpen(true)
    }

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...editData.items]
        newItems[index] = { ...newItems[index], [field]: value }

        const recalculation = recalulateTotals(newItems)
        setEditData({
            ...editData,
            ...recalculation,
        })
    }

    const addItem = () => {
        const newItem = {
            description: '',
            quantity: 1,
            unit_price: 0,
            amount: 0,
            gst_enabled: true,
            pst_enabled: false,
            order_service_id: null
        }
        const newItems = [...(editData.items || []), newItem]
        const recalculation = recalulateTotals(newItems)
        setEditData({
            ...editData,
            ...recalculation,
        })
    }

    const removeItem = (index: number) => {
        const newItems = editData.items.filter((_: any, i: number) => i !== index)
        const recalculation = recalulateTotals(newItems)
        setEditData({
            ...editData,
            ...recalculation,
        })
    }

    const updateTaxRate = (val: string) => {
        const rate = parseFloat(val) || 0
        const subtotal = parseFloat(editData.subtotal || 0)
        const taxAmount = (subtotal * (rate / 100))
        const grandTotal = subtotal + taxAmount
        const paidAmount = parseFloat(editData?.paid_amount || invoice?.paid_amount || 0)
        const balanceDue = Math.max(0, grandTotal - paidAmount)

        setEditData({
            ...editData,
            tax_rate: val,
            tax_amount: taxAmount.toFixed(2),
            total: grandTotal.toFixed(2),
            balance_due: balanceDue.toFixed(2),
        })
    }

    const isEditableStatus = invoice && !['paid', 'void', 'refunded'].includes((invoice.status || '').toLowerCase());
    const canEdit = role === 'admin' && isEditableStatus;

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (!invoice) return <div className="p-10 text-center text-black">Invoice not found</div>

    return (
        <div style={{ backgroundColor: roleSettings.pageBg, minHeight: '100vh' }}>
            {/* Standard Whitelabel Header */}
            <div className="sticky top-0 z-50 flex h-[80px] items-center justify-between px-[20px] no-print font-alexandria"
                style={{ backgroundColor: headerBg, boxShadow: "0px 4px 4px #0000001F" }}>
                <div className="flex items-center gap-4">
                    <h1 className="text-[16px] md:text-[24px] font-[400]" style={{ color: roleSettings.pageTabColor }}>
                        Invoice #{invoice.invoice_number || invoice.id}
                    </h1>
                </div>
                <div className="flex gap-3">
                    {isEditing ? (
                        <>
                            <Button
                                variant="outline"
                                className="bg-white text-black hover:bg-gray-100 border-none h-[35px] md:h-[44px] px-6 rounded-[6px]"
                                onClick={() => {
                                    setEditData(JSON.parse(JSON.stringify(invoice)))
                                    setIsEditing(false)
                                }}
                                disabled={saving}
                            >
                                <X className="mr-2 h-4 w-4" /> Cancel
                            </Button>
                            <Button
                                className="text-white h-[35px] md:h-[44px] px-6 rounded-[6px] hover:brightness-110 active:scale-[0.98] transition-all"
                                style={{ backgroundColor: roleSettings.pageTabColor }}
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />} Save Changes
                            </Button>
                        </>
                    ) : (
                        <>
                            {role === 'admin' && invoice.status !== 'paid' && (
                                <Button className="bg-[#6BAE41] text-white hover:bg-[#6BAE41]/90 h-[35px] md:h-[44px] px-6 rounded-[6px] font-bold" onClick={handleMarkPaid}>
                                    <CreditCard className="mr-2 h-4 w-4" /> Mark as Paid
                                </Button>
                            )}
                            {role === 'admin' && invoice.status === 'paid' && (
                                <Button
                                    variant="outline"
                                    className="bg-orange-500 text-white hover:bg-orange-600 border-none h-[35px] md:h-[44px] px-6 rounded-[6px]"
                                    onClick={handleRefund}
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="mr-2 h-4 w-4" />} Refund
                                </Button>
                            )}
                            {canEdit && (
                                <Button
                                    variant="outline"
                                    className="border-[1px] text-[14px] md:text-[16px] font-[400] h-[35px] md:h-[44px] px-6 rounded-[6px] hover:brightness-110"
                                    style={{
                                        backgroundColor: roleSettings.pageBg,
                                        color: roleSettings.pageTabColor,
                                        borderColor: roleSettings.pageTabColor,
                                    }}
                                    onClick={() => setIsEditing(true)}
                                >
                                    <Edit2 className="mr-2 h-4 w-4" /> Edit
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                className="border-[1px] text-[14px] md:text-[16px] font-[400] h-[35px] md:h-[44px] px-6 rounded-[6px] hover:brightness-110"
                                style={{
                                    backgroundColor: roleSettings.pageBg,
                                    color: roleSettings.pageTabColor,
                                    borderColor: roleSettings.pageTabColor,
                                }}
                                onClick={handleDownload}
                            >
                                <Download className="mr-2 h-4 w-4" /> Download PDF
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Invoice Document */}
            <div className="mx-auto max-w-4xl p-8 md:p-12">
                <InvoiceDocument
                    invoice={invoice}
                    editData={editData}
                    isEditing={isEditing}
                    updateItem={updateItem}
                    addItem={addItem}
                    removeItem={removeItem}
                    updateTaxRate={updateTaxRate}
                    setEditData={setEditData}
                    roleSettings={roleSettings}
                />
            </div>

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
                onSuccess={fetchInvoice}
            />

            <ConfirmationDialog
                open={confirmOpen}
                setOpen={setConfirmOpen}
                onConfirm={onConfirmMarkPaid}
                showAgain={showAgain}
                toggleShowAgain={toggleShowAgain}
                dialogType="payment"
                title="MARK AS PAID"
                description="Are you sure you want to mark this invoice as paid? This action will update the payment status."
            />

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .shadow-2xl { box-shadow: none !important; border: 1px solid #eee !important; }
                }
            `}</style>
        </div>
    )
}

export default InvoicePreviewPage
