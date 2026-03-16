'use client'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { GetInvoice, MarkPaid, UpdateInvoice } from '../invoice_api'
import { useWhiteLabel } from '@/app/context/Whitelabel'
import { useAppContext } from '@/app/context/AppContext'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Download, Loader2, Edit2, Save, X, CreditCard, RotateCcw } from 'lucide-react'
import DownloadPdf from '../../file-manager/components/DownloadPdf'
import InvoiceDocument from '../components/InvoiceDocument'
import RefundModal from '../components/RefundModal'
import ConfirmationDialog from '@/components/ConfirmationDialog'

const STORAGE_KEY_PAYMENT = 'confirmation_dialog_payment_show_again';

const InvoicePreviewPage = () => {
    const { uuid } = useParams()
    const { userType } = useAppContext()
    const { appliedSettings } = useWhiteLabel()
    const role = (userType as string) || 'admin'
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
                setInvoice(res.data)
                setEditData(JSON.parse(JSON.stringify(res.data)))
            })
            .catch(() => toast.error('Failed to load invoice'))
            .finally(() => setLoading(false))
    }


    const handleDownload = async () => {
        if (!invoice) return;
        const invoiceNumber = invoice.invoice_number || invoice.id;
        const fileName = `Invoice_${invoiceNumber}.pdf`;
        await DownloadPdf('invoice-download-content', fileName);
    }

    const handleSave = async () => {
        if (!editData) return
        setSaving(true)
        const token = localStorage.getItem('token')
        if (!token) return

        try {
            const payload = {
                notes: editData.notes,
                tax_rate: editData.tax_rate,
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
        } catch (err: any) {
            console.error('Save failed:', err)
            toast.error(err.message || 'Connection error')
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
                                onClick={() => setIsEditing(false)} 
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
                            {role === 'admin' && invoice.status !== 'paid' && (
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
