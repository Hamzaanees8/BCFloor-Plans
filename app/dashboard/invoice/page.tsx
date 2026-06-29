'use client'
import React, { useEffect, useState, useRef, useMemo } from 'react'
import { GetInvoices } from './invoice_api'
import { useWhiteLabel } from '@/app/context/Whitelabel'
import { useAppContext } from '@/app/context/AppContext'
import { toast } from 'sonner'
import { useRouter } from "next/navigation"
import { DataTable } from '@/components/DataTable'
import { ColumnDef } from "@tanstack/react-table"
import DropdownActions from "@/components/DropdownActions"
import { Button } from '@/components/ui/button'
import { Plus, ChevronUp, ChevronDown, ChevronsUpDown, Eye, RotateCcw } from 'lucide-react'
import RefundModal from './components/RefundModal'
import { Get as GetAgents } from '../agents/agents'
import { GetListing } from '../listings/listing'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '../orders/components/SearchableSelect'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsMobile } from '@/hooks/use-mobile'

type Invoice = {
    id: number;
    uuid: string;
    invoice_number?: string;
    status: string;
    total: string;
    currency: string;
    issued_at: string;
    agent: {
        uuid: string;
        first_name: string;
        last_name: string;
    };
    order: {
        id: number;
        property: {
            address: string;
            uuid: string;
        };
    };
};

const InvoiceListPage = () => {
    const router = useRouter()
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [refundModal, setRefundModal] = useState<{ open: boolean, invoice: any }>({ open: false, invoice: null })
    
    // Filters state
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [agentFilter, setAgentFilter] = useState('all')
    const [propertyFilter, setPropertyFilter] = useState('all')
    const [agents, setAgents] = useState<any[]>([])
    const [properties, setProperties] = useState<any[]>([])
    
    const { userType } = useAppContext()
    const { appliedSettings } = useWhiteLabel()
    const isMobile = useIsMobile()
    const role = (userType as string) || 'admin'
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin']
    const headerBg = `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`
    const headerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const header = headerRef.current;
        if (!header) return;

        let ancestor = header.parentElement;
        while (ancestor) {
            const style = window.getComputedStyle(ancestor);
            if (style.overflowX === 'hidden' || ancestor.classList.contains('overflow-x-hidden')) {
                ancestor.style.setProperty('overflow-x', 'visible', 'important');
                ancestor.style.setProperty('overflow-y', 'visible', 'important');

                const target = ancestor;
                return () => {
                    target.style.removeProperty('overflow-x');
                    target.style.removeProperty('overflow-y');
                };
            }
            ancestor = ancestor.parentElement;
        }
    }, []);

    const fetchInvoices = () => {
        setLoading(true)
        setError(false)
        GetInvoices()
            .then(res => setInvoices(Array.isArray(res.data) ? res.data : []))
            .catch(() => {
                toast.error('Failed to load invoices')
                setError(true)
            })
            .finally(() => setLoading(false))
    }

    const fetchAgents = () => {
        GetAgents()
            .then(res => {
                setAgents(Array.isArray(res.data) ? res.data : [])
            })
            .catch(err => console.error("Failed to fetch agents", err))
    }

    const fetchListings = () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        GetListing(token)
            .then(res => {
                setProperties(Array.isArray(res.data) ? res.data : [])
            })
            .catch(err => console.error("Failed to fetch listings", err))
    }

    useEffect(() => {
        fetchInvoices()
        fetchAgents()
        fetchListings()
    }, [])

    const handleRefund = (invoice: any) => {
        setRefundModal({ open: true, invoice })
    }

    const columns: ColumnDef<Invoice>[] = [
        {
            accessorKey: "invoice_number",
            header: "INVOICE #",
            cell: ({ row }) => (
                <div 
                    className="font-bold cursor-pointer hover:underline" 
                    style={{ color: roleSettings.pageTabColor }}
                    onClick={() => router.push(`/dashboard/invoice/${row.original.uuid}`)}
                >
                    #{row.original.invoice_number || row.original.id}
                </div>
            )
        },
        {
            accessorKey: "property",
            header: "PROPERTY",
            cell: ({ row }) => (
                <div className="max-w-[250px] truncate" style={{ color: roleSettings.pageText }}>
                    {row.original.order?.property?.address || "N/A"}
                </div>
            )
        },
        {
            accessorKey: "agent",
            header: "AGENT",
            cell: ({ row }) => (
                <div style={{ color: roleSettings.pageText }}>
                    {row.original.agent?.first_name} {row.original.agent?.last_name}
                </div>
            )
        },
        {
            accessorKey: "issued_at",
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
                        className="p-0 hover:bg-transparent flex items-center gap-1 font-bold h-auto"
                    >
                        DATE
                        {isSorted === "asc" && <span><ChevronUp strokeWidth={3} className="h-4 w-4" style={{ color: roleSettings.pageTabColor }} /></span>}
                        {isSorted === "desc" && <span><ChevronDown strokeWidth={3} className="h-4 w-4" style={{ color: roleSettings.pageTabColor }} /></span>}
                        {!isSorted && <span className="text-gray-400"><ChevronsUpDown strokeWidth={3} className="h-4 w-4 text-gray-400" /></span>}
                    </Button>
                )
            },
            cell: ({ row }) => <div style={{ color: roleSettings.pageText }}>{new Date(row.original.issued_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}</div>,
            enableSorting: true,
        },
        {
            accessorKey: "total",
            header: "TOTAL",
            cell: ({ row }) => <div style={{ color: roleSettings.pageText }}>${parseFloat(row.original.total).toFixed(2)}</div>
        },
        {
            accessorKey: "status",
            header: "STATUS",
            cell: ({ row }) => {
                const status = (row.original.status || 'unpaid').toUpperCase();
                let bgColor = "#E06D5E"; // Unpaid
                if (status === "PAID") bgColor = "#6BAE41";
                else if (status === "ISSUED") bgColor = "#4A90E2";
                else if (status === "VOID") bgColor = "#A0A0A0";
                else if (status === "PARTIAL") bgColor = "#F5A623";
                else if (status === "REFUNDED") bgColor = "#D0021B";

                return (
                    <div
                        className="text-white px-3 py-1 rounded-full text-[10px] font-medium w-fit uppercase"
                        style={{ backgroundColor: bgColor }}
                    >
                        {status}
                    </div>
                );
            }
        },
        {
            id: "actions",
            header: "ACTIONS",
            cell: ({ row }) => {
                const inv = row.original;
                const options = [
                    {
                        label: "View",
                        onClick: () => router.push(`/dashboard/invoice/${inv.uuid}`),
                    },
                    ...(inv.status === 'paid' ? [{
                        label: "Refund",
                        onClick: () => handleRefund(inv),
                    }] : []),
                ];

                return <DropdownActions options={options} />
            }
        }
    ];

    const agentOptions = useMemo(() => {
        const options = agents.map(a => ({
            label: `${a.first_name} ${a.last_name} ${a.company_name ? `(${a.company_name})` : ''}`,
            value: a.uuid
        }))
        return [{ label: 'All Agents', value: 'all' }, ...options]
    }, [agents])

    const filteredPropertiesByAgent = useMemo(() => {
        if (!agentFilter || agentFilter === 'all') return properties
        return properties.filter(p => p.agent?.uuid === agentFilter)
    }, [properties, agentFilter])

    const propertyOptions = useMemo(() => {
        const options = filteredPropertiesByAgent.map(p => ({
            label: `${p.address}, ${p.city}`,
            value: p.uuid
        }))
        return [{ label: 'All Properties', value: 'all' }, ...options]
    }, [filteredPropertiesByAgent])

    const filteredInvoices = invoices.filter(inv => {
        // Status Filter
        if (statusFilter !== 'all' && inv.status !== statusFilter) return false
        
        // Agent Filter
        if (agentFilter !== 'all' && inv.agent?.uuid !== agentFilter) return false

        // Property Filter
        if (propertyFilter !== 'all' && inv.order?.property?.uuid !== propertyFilter) return false

        // Search Filter (Address or Order # or Invoice #)
        if (search) {
            const s = search.toLowerCase()
            const addr = (inv.order?.property?.address || '').toLowerCase()
            const orderId = String(inv.order?.id || '').toLowerCase()
            const invNum = (inv.invoice_number || String(inv.id)).toLowerCase()
            
            if (!addr.includes(s) && !orderId.includes(s) && !invNum.includes(s)) return false
        }

        return true
    })

    return (
        <div className="font-alexandria" style={{ backgroundColor: roleSettings.pageBg, minHeight: '100vh' }}>
            {/* Standard Whitelabel Header */}
            <div ref={headerRef} className='w-full h-[80px] sticky top-0 z-50 flex justify-between px-[20px] items-center' style={{ backgroundColor: headerBg, boxShadow: "0px 4px 4px #0000001F" }} >
                <div className='flex items-center gap-4'>
                    <p className='text-[16px] md:text-[24px] font-[400]' style={{ color: roleSettings.pageTabColor }}>
                        Invoices ({filteredInvoices.length})
                    </p>
                </div>
                
                <Button 
                    onClick={() => router.push('/dashboard/invoice/create')}
                    className='w-[140px] md:w-[170px] h-[35px] md:h-[44px] rounded-[6px] text-[14px] md:text-[16px] font-[400] text-white flex gap-[5px] justify-center items-center hover:brightness-110 active:scale-[0.98] transition-all'
                    style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
                >
                    <Plus className="h-4 w-4" /> Create Invoice
                </Button>
            </div>

            {/* Filters Section */}
            <div className="p-4 border-b sticky top-[80px] z-40" style={{ backgroundColor: roleSettings.pageBg }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search Field */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Address / Order ID</label>
                        <Input 
                            placeholder="Search address, order #..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-[40px] bg-white border-[#BBBBBB]"
                        />
                    </div>

                    {/* Agent Filter */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Agent</label>
                        <SearchableSelect
                            options={agentOptions}
                            value={agentFilter}
                            onChange={(val) => {
                                setAgentFilter(val)
                                // If current property filter doesn't belong to this agent, reset it
                                if (propertyFilter !== 'all') {
                                    const prop = properties.find(p => p.uuid === propertyFilter)
                                    if (val !== 'all' && prop && prop.agent?.uuid !== val) {
                                        setPropertyFilter('all')
                                    }
                                }
                            }}
                            placeholder="All Agents"
                            searchPlaceholder="Search agent..."
                            className="h-[40px] bg-white border-[#BBBBBB]"
                        />
                    </div>

                    {/* Property Filter */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Property</label>
                        <SearchableSelect
                            options={propertyOptions}
                            value={propertyFilter}
                            onChange={(val) => {
                                setPropertyFilter(val)
                                if (val !== 'all') {
                                    const prop = properties.find(p => p.uuid === val)
                                    if (prop?.agent?.uuid) {
                                        setAgentFilter(prop.agent.uuid)
                                    }
                                }
                            }}
                            placeholder="All Properties"
                            searchPlaceholder="Search property..."
                            className="h-[40px] bg-white border-[#BBBBBB]"
                        />
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full bg-white border-[#BBBBBB] h-[40px]">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="issued">Issued</SelectItem>
                                <SelectItem value="unpaid">Unpaid</SelectItem>
                                <SelectItem value="partial">Partial</SelectItem>
                                <SelectItem value="refunded">Refunded</SelectItem>
                                <SelectItem value="void">Void</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="w-full">
                {loading ? (
                    <div className="p-4 space-y-4">
                        <Skeleton className="h-[120px] w-full" />
                        <Skeleton className="h-[120px] w-full" />
                        <Skeleton className="h-[120px] w-full" />
                    </div>
                ) : isMobile ? (
                    <div className="p-4 space-y-4">
                        {filteredInvoices.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground text-sm font-medium">
                                No Invoices found.
                            </div>
                        ) : (
                            filteredInvoices.map((inv) => {
                                const status = (inv.status || 'unpaid').toUpperCase();
                                let bgColor = "#E06D5E"; // Unpaid / Cancelled / Void
                                if (status === "PAID") bgColor = "#6BAE41";
                                else if (status === "ISSUED") bgColor = "#4A90E2";
                                else if (status === "VOID") bgColor = "#A0A0A0";
                                else if (status === "PARTIAL") bgColor = "#F5A623";

                                return (
                                    <Card key={inv.uuid} className="overflow-hidden border border-gray-100 shadow-sm font-alexandria">
                                        <CardContent className="p-4 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-sm font-bold text-gray-900" style={{ color: roleSettings?.pageTabColor }}>
                                                        {inv.invoice_number || `Invoice #${inv.id}`}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mt-1 font-semibold">
                                                        Agent: {inv.agent?.first_name} {inv.agent?.last_name}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 mt-1">
                                                        Property: {inv.order?.property?.address || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <p className="text-[14px] font-bold text-gray-800">${Number(inv.total).toFixed(2)}</p>
                                                    <Badge className="text-white px-2 py-0.5 rounded text-[9px] font-medium uppercase mt-2 border-0" style={{ backgroundColor: bgColor }}>
                                                        {status}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="text-[10px] text-gray-400 pt-2 border-t border-gray-50 flex justify-between">
                                                <span>Issued: {new Date(inv.issued_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}</span>
                                                <span>Currency: {inv.currency}</span>
                                            </div>

                                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 h-9 text-xs gap-1.5"
                                                    onClick={() => router.push(`/dashboard/invoice/${inv.uuid}`)}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    View Details
                                                </Button>
                                                {inv.status === 'paid' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 h-9 text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                        onClick={() => handleRefund(inv)}
                                                    >
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                        Refund
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={filteredInvoices}
                        loading={loading}
                        error={error}
                        dataName="Invoices"
                        userType={userType}
                        headerBgOverride={headerBg}
                    />
                )}
            </div>

            <RefundModal
                isOpen={refundModal.open}
                onClose={() => setRefundModal({ ...refundModal, open: false })}
                invoice={refundModal.invoice}
                onSuccess={fetchInvoices}
            />
        </div>
    )
}

export default InvoiceListPage
