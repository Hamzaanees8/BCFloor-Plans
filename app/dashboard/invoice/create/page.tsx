'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GetListing } from '../../listings/listing'
import { CreateInvoice } from '../invoice_api'
import { useWhiteLabel } from '@/app/context/Whitelabel'
import { useAppContext } from '@/app/context/AppContext'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, Save, X, Plus } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import InvoiceDocument from '../components/InvoiceDocument'

const CreateInvoicePage = () => {
    const router = useRouter()
    const { userType } = useAppContext()
    const { appliedSettings } = useWhiteLabel()
    const role = (userType as string) || 'admin'
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin']
    const headerBg = `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`

    const [properties, setProperties] = useState<any[]>([])
    const [loadingProperties, setLoadingProperties] = useState(true)
    const [selectedProperty, setSelectedProperty] = useState<any>(null)
    const [saving, setSaving] = useState(false)

    const [editData, setEditData] = useState<any>({
        items: [{
            description: '',
            quantity: 1,
            unit_price: 0,
            amount: '0.00',
            order_service_id: null
        }],
        subtotal: '0.00',
        tax_rate: '13.00', // Default HST for Ontario or similar
        tax_amount: '0.00',
        total: '0.00',
        notes: ''
    })

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) return

        GetListing(token)
            .then(res => {
                const allProps = Array.isArray(res.data) ? res.data : [];
                // Filter properties that have at least one order
                const filtered = allProps.filter((p: any) => p.orders && p.orders.length > 0);
                setProperties(filtered);
            })
            .catch(() => toast.error('Failed to load properties'))
            .finally(() => setLoadingProperties(false))
    }, [])

    const handlePropertyChange = (uuid: string) => {
        const prop = properties.find(p => p.uuid === uuid)
        setSelectedProperty(prop)
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
            amount: '0.00',
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
        if (editData.items.length <= 1) return;
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

    const handleSave = async () => {
        if (!selectedProperty) {
            toast.error('Please select a property first')
            return
        }

        if (editData.items.some((item: any) => !item.description)) {
            toast.error('Incomplete item descriptions')
            return
        }

        setSaving(true)
        try {
            // Find the latest order for this property
            const latestOrder = selectedProperty.orders?.sort((a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];

            const payload = {
                order_uuid: latestOrder?.uuid,
                property_uuid: selectedProperty.uuid,
                agent_uuid: selectedProperty.agent?.uuid,
                notes: editData.notes,
                tax_rate: editData.tax_rate,
                items: editData.items.map((item: any) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                }))
            }
            const res = await CreateInvoice(payload)
            toast.success('Invoice created successfully')
            router.push(`/dashboard/invoice/${res.data.uuid}`)
        } catch (err: any) {
            toast.error(err.message || 'Failed to create invoice')
        } finally {
            setSaving(false)
        }
    }

    // Mock an invoice object for the Document component
    const mockInvoice = selectedProperty ? {
        invoice_number: 'NEW',
        created_at: new Date().toISOString(),
        status: 'draft',
        agent: selectedProperty.agent,
        order: {
            property: selectedProperty
        }
    } : null

    return (
        <div style={{ backgroundColor: roleSettings.pageBg, minHeight: '100vh' }}>
            {/* Standard Whitelabel Header */}
            <div className="sticky top-0 z-50 flex h-[80px] items-center justify-between px-[20px] no-print font-alexandria"
                style={{ backgroundColor: headerBg, boxShadow: "0px 4px 4px #0000001F" }}>
                <div className="flex items-center gap-4">
                    <h1 className="text-[16px] md:text-[24px] font-[400]" style={{ color: roleSettings.pageTabColor }}>
                        Create Custom Invoice
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="bg-white text-black hover:bg-gray-100 border-none h-[35px] md:h-[44px] px-6 rounded-[6px]"
                        onClick={() => router.back()}
                        disabled={saving}
                    >
                        <X className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button
                        className="text-white h-[35px] md:h-[44px] px-6 rounded-[6px] hover:brightness-110 active:scale-[0.98] transition-all"
                        style={{ backgroundColor: roleSettings.pageTabColor }}
                        onClick={handleSave}
                        disabled={saving || !selectedProperty}
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />} Create Invoice
                    </Button>
                </div>
            </div>

            <div className="mx-auto max-w-5xl p-6 md:p-12 relative font-alexandria">
                <div className="mb-10 mx-auto max-w-[800px] bg-white p-8 rounded-xl shadow-lg border border-gray-100 ">
                    <label className="block text-xs font-bold text-gray-500 mb-4 uppercase tracking-[0.2em]">Select Property</label>
                    <Select onValueChange={handlePropertyChange}>
                        <SelectTrigger className="w-full h-[42px] bg-gray-50/50 border-gray-100 rounded-md text-sm focus:ring-1 transition-all" style={{ borderColor: `#BBBBBB` }}>
                            <SelectValue placeholder={loadingProperties ? "Loading properties..." : "Search and select a property"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] rounded-lg shadow-xl border-gray-100">
                            {properties.map((p) => (
                                <SelectItem key={p.uuid} value={p.uuid} className="py-3 cursor-pointer">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">{p.address}, {p.city}</span>
                                        <span className="text-sm text-gray-500">Agent: {p.agent?.first_name} {p.agent?.last_name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {!selectedProperty ? (
                    <div className="py-32 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white/50 backdrop-blur-sm">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Plus className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-400 text-lg">Select a property above to start creating the invoice</p>
                    </div>
                ) : (
                    <>
                        < InvoiceDocument
                            invoice={mockInvoice}
                            editData={editData}
                            isEditing={true}
                            updateItem={updateItem}
                            addItem={addItem}
                            removeItem={removeItem}
                            updateTaxRate={updateTaxRate}
                            setEditData={setEditData}
                            roleSettings={roleSettings}
                        />
                    </>
                )}
            </div>
        </div >
    )
}

export default CreateInvoicePage
