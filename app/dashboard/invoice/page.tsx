'use client'
import React, { useEffect, useState } from 'react'
import { GetInvoices, VoidInvoice } from './invoice_api'
import { useWhiteLabel } from '@/app/context/Whitelabel'
import { useAppContext } from '@/app/context/AppContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Filter, Eye, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type Invoice = {
    id: number;
    uuid: string;
    status: string;
    total: string;
    currency: string;
    issued_at: string;
    agent: {
        first_name: string;
        last_name: string;
    };
    order: {
        property: {
            address: string;
        };
    };
};

const InvoiceListPage = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const { userType } = useAppContext()
    const { appliedSettings } = useWhiteLabel()
    const role = (userType as string) || 'admin'
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin']

    const fetchInvoices = () => {
        const token = localStorage.getItem('token')
        if (!token) return

        setLoading(true)
        GetInvoices()
            .then(res => setInvoices(Array.isArray(res.data) ? res.data : []))
            .catch(() => toast.error('Failed to load invoices'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchInvoices()
    }, [])

    const handleVoid = async (uuid: string) => {
        if (!confirm('Are you sure you want to void this invoice?')) return
        const token = localStorage.getItem('token')
        if (!token) return

        try {
            await VoidInvoice(uuid)
            toast.success('Invoice voided')
            fetchInvoices()
        } catch {
            toast.error('Failed to void invoice')
        }
    }

    const filteredInvoices = invoices.filter(inv => 
        inv.order?.property?.address.toLowerCase().includes(search.toLowerCase()) ||
        inv.agent?.first_name.toLowerCase().includes(search.toLowerCase()) ||
        inv.agent?.last_name.toLowerCase().includes(search.toLowerCase()) ||
        inv.id.toString().includes(search)
    )

    return (
        <div className="p-6 md:p-10 font-alexandria" style={{ backgroundColor: roleSettings.pageBg, minHeight: '100vh' }}>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: roleSettings.pageTabColor }}>Invoices</h1>
                    <p className="text-sm text-gray-500">Manage and view your property invoices</p>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input 
                        placeholder="Search by address, agent, or invoice #" 
                        className="pl-10 h-11 border-gray-200 bg-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="h-11 bg-white">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 text-xs font-bold uppercase tracking-wider text-gray-400">
                        <tr>
                            <th className="px-6 py-4">Invoice</th>
                            <th className="px-6 py-4">Property</th>
                            <th className="px-6 py-4">Agent</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/50">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="py-20 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-300" />
                                </td>
                            </tr>
                        ) : filteredInvoices.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-20 text-center text-gray-400">No invoices found</td>
                            </tr>
                        ) : (
                            filteredInvoices.map((inv) => (
                                <tr key={inv.uuid} className="group hover:bg-gray-50/30 transition-colors duration-200">
                                    <td className="px-6 py-4 font-bold text-gray-900">#{inv.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-[200px] truncate text-sm font-medium text-gray-700">
                                            {inv.order?.property?.address}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {inv.agent?.first_name} {inv.agent?.last_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(inv.issued_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-900">
                                        ${parseFloat(inv.total).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                                            inv.status === 'paid' ? 'bg-[#6BAE41]/10 text-[#6BAE41]' : 
                                            inv.status === 'void' ? 'bg-gray-100 text-gray-400' : 'bg-orange-100 text-orange-600'
                                        }`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/dashboard/invoice/${inv.uuid}`}>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-[#4290E9] transition-colors">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8 w-8 text-gray-400 hover:text-red-500 transition-colors"
                                                onClick={() => handleVoid(inv.uuid)}
                                                disabled={inv.status === 'void'}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default InvoiceListPage
