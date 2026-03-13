'use client'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Printer, Download, Loader2, Edit2, Save, X } from 'lucide-react'
import DownloadPdf from '../../file-manager/components/DownloadPdf'
import InvoiceDocument from './InvoiceDocument'
import { UpdateInvoice } from '../invoice_api'

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
        await DownloadPdf('invoice-download-content', fileName);
    }

    const handleSave = async () => {
        if (!editData) return
        setSaving(true)
        const token = localStorage.getItem('token')
        if (!token || !invoice?.uuid) return

        try {
            const data = {
                notes: editData.notes,
                tax_rate: editData.tax_rate,
                due_date: editData.due_date,
                items: editData.items.map((item: any) => ({
                    id: item.id,
                    description: item.description,
                    quantity: item.quantity,
                    amount: item.amount,
                    order_service_id: item.order_service_id || item.order_service?.id
                }))
            }
            const res = await UpdateInvoice(invoice.uuid, data)
            if (res.success) {
                setInvoice(res.data)
                setIsEditing(false)
            }
        } catch (error) {
            console.error('Save failed:', error)
        } finally {
            setSaving(false)
        }
    }

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...editData.items]
        newItems[index] = { ...newItems[index], [field]: value }

        // Recalculate local subtotal/total for UI feedback if price/qty changed
        if (field === 'quantity' || field === 'unit_price') {
            const qty = parseFloat(newItems[index].quantity) || 0
            const price = parseFloat(newItems[index].unit_price) || 0
            newItems[index].amount = (qty * price).toFixed(2)
        }

        const subtotal = newItems.reduce((acc, item) => acc + parseFloat(item.amount || 0), 0)
        const taxRate = parseFloat(editData.tax_rate) || 0
        const taxAmount = subtotal * (taxRate / 100)

        setEditData({
            ...editData,
            items: newItems,
            subtotal: subtotal.toFixed(2),
            tax_amount: taxAmount.toFixed(2),
            total: (subtotal + taxAmount).toFixed(2)
        })
    }

    const updateTaxRate = (val: string) => {
        const rate = parseFloat(val) || 0
        const subtotal = parseFloat(editData.subtotal) || 0
        const taxAmount = subtotal * (rate / 100)
        setEditData({
            ...editData,
            tax_rate: val,
            tax_amount: taxAmount.toFixed(2),
            total: (subtotal + taxAmount).toFixed(2)
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
                                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                            <Edit2 className="h-4 w-4 mr-2" /> Edit
                                        </Button>
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
                        updateTaxRate={updateTaxRate}
                        setEditData={setEditData}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}

export default InvoiceModal
