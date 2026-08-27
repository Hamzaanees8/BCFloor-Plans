'use client'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Printer, Download, Loader2, Edit2, Save, X, RotateCcw } from 'lucide-react'
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

const InvoiceModal = ({ uuid, isOpen, onClose }: InvoiceModalProps) => {
    const [invoice, setInvoice] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState<any>(null)
    const [saving, setSaving] = useState(false)
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
        if (!token) return

        setLoading(true)
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices?order_uuid=${uuid}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(res => {
                const inv = Array.isArray(res.data) ? res.data[0] : res.data;
                setInvoice(inv)
                setEditData(JSON.parse(JSON.stringify(inv))) // Deep copy for editing
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const content = document.getElementById('invoice-download-content')?.innerHTML;
        printWindow.document.write(`
            <html>
                <head>
                    <title>Invoice #${invoice?.id}</title>
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
        // Use the specialized invoice PDF downloader and component
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
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <DialogTitle className="text-xl font-bold">
                        {loading ? 'Loading Invoice...' : invoice ? `Invoice #${invoice.invoice_number || invoice.id}` : 'Invoice'}
                    </DialogTitle>
                    <div className="flex gap-2 pr-8">
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
                                         {role === 'admin' && invoice.status === 'paid' && parseFloat(invoice.total || 0) > 0 && (
                                             <Button variant="outline" size="sm" onClick={handleRefund} disabled={saving} className="text-orange-600 hover:text-orange-700">
                                                 {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />} Refund
                                             </Button>
                                         )}
                                         {role === 'admin' && (invoice.status !== 'paid' || parseFloat(invoice.total || 0) === 0) && (
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
                    onSuccess={fetchInvoice}
                />
            </DialogContent>
        </Dialog>
    )
}

export default InvoiceModal
