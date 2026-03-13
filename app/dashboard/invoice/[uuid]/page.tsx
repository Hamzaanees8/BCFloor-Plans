'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { GetInvoice, MarkPaid, UpdateInvoice } from '../invoice_api'
import { useWhiteLabel } from '@/app/context/Whitelabel'
import { useAppContext } from '@/app/context/AppContext'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Download, ArrowLeft, Loader2, Edit2, Save, X, CreditCard } from 'lucide-react'
import DownloadPdf from '../../file-manager/components/DownloadPdf'
import InvoiceDocument from '../components/InvoiceDocument'

const InvoicePreviewPage = () => {
    const { uuid } = useParams()
    const router = useRouter()
    const { userType } = useAppContext()
    const { appliedSettings } = useWhiteLabel()
    const role = (userType as string) || 'admin'
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin']

    const [invoice, setInvoice] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState<any>(null)
    const [saving, setSaving] = useState(false)

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
                toast.success('Invoice updated')
            } else {
                toast.error(res.message || 'Update failed')
            }
        } catch (err: any) {
            console.error('Save failed:', err)
            toast.error(err.message || 'Connection error')
        } finally {
            setSaving(false)
        }
    }

    const handleMarkPaid = async () => {
        if (!confirm('Mark this invoice as paid?')) return
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

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...editData.items]
        newItems[index] = { ...newItems[index], [field]: value }

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
            {/* Header / Actions */}
            <div className="sticky top-0 z-10 flex h-20 items-center justify-between px-8 no-print" style={{ backgroundColor: roleSettings.sidebarBg, color: 'white' }}>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <h1 className="text-xl font-bold">Invoice #{invoice.invoice_number || invoice.id}</h1>
                </div>
                <div className="flex gap-3">
                    {isEditing ? (
                        <>
                            <Button variant="outline" className="bg-white text-black hover:bg-gray-100" onClick={() => setIsEditing(false)} disabled={saving}>
                                <X className="mr-2 h-4 w-4" /> Cancel
                            </Button>
                            <Button className="admin-bg text-white" onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />} Save Changes
                            </Button>
                        </>
                    ) : (
                        <>
                            {role === 'admin' && invoice.status !== 'paid' && (
                                <Button className="bg-[#6BAE41] text-white hover:bg-[#6BAE41]/90" onClick={handleMarkPaid}>
                                    <CreditCard className="mr-2 h-4 w-4" /> Mark as Paid
                                </Button>
                            )}
                            <Button variant="outline" className="bg-white text-black hover:bg-gray-100" onClick={() => setIsEditing(true)}>
                                <Edit2 className="mr-2 h-4 w-4" /> Edit
                            </Button>
                            <Button variant="outline" className="bg-white text-black hover:bg-gray-100" onClick={handleDownload}>
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
                    updateTaxRate={updateTaxRate}
                    setEditData={setEditData}
                />
            </div>

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
