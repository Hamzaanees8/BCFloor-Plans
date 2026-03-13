'use client'
import React, { useEffect, useState, useRef } from 'react'
import { GetInvoices, VoidInvoice } from './invoice_api'
import { useWhiteLabel } from '@/app/context/Whitelabel'
import { useAppContext } from '@/app/context/AppContext'
import { toast } from 'sonner'
import { useRouter } from "next/navigation"
import { DataTable } from '@/components/DataTable'
import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import DropdownActions from "@/components/DropdownActions"
import RefundModal from './components/RefundModal'

type Invoice = {
    id: number;
    uuid: string;
    invoice_number?: string;
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
    const router = useRouter()
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [refundModal, setRefundModal] = useState<{ open: boolean, invoice: any }>({ open: false, invoice: null })
    
    const { userType } = useAppContext()
    const { appliedSettings } = useWhiteLabel()
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

    const handleRefund = (invoice: any) => {
        setRefundModal({ open: true, invoice })
    }

    const columns: ColumnDef<Invoice>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
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
                <div className="max-w-[250px] truncate text-gray-700">
                    {row.original.order?.property?.address || "N/A"}
                </div>
            )
        },
        {
            accessorKey: "agent",
            header: "AGENT",
            cell: ({ row }) => (
                <div>
                    {row.original.agent?.first_name} {row.original.agent?.last_name}
                </div>
            )
        },
        {
            accessorKey: "issued_at",
            header: "DATE",
            cell: ({ row }) => <div>{new Date(row.original.issued_at).toLocaleDateString()}</div>
        },
        {
            accessorKey: "total",
            header: "TOTAL",
            cell: ({ row }) => <div className="font-bold">${parseFloat(row.original.total).toFixed(2)}</div>
        },
        {
            accessorKey: "status",
            header: "STATUS",
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${status === 'paid' ? 'bg-[#6BAE41]/10 text-[#6BAE41]' :
                        status === 'void' ? 'bg-gray-100 text-gray-400' : 'bg-orange-100 text-orange-600'
                        }`}>
                        {status}
                    </span>
                )
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
                    ...((inv.status === 'paid' || inv.status === 'partially_paid') ? [{
                        label: "Refund",
                        onClick: () => handleRefund(inv),
                    }] : []),
                    ...(inv.status !== 'void' ? [{
                        label: "Void",
                        onClick: () => handleVoid(inv.uuid),
                        confirm1: true
                    }] : [])
                ];

                return <DropdownActions options={options} />
            }
        }
    ];

    return (
        <div className="font-alexandria" style={{ backgroundColor: roleSettings.pageBg, minHeight: '100vh' }}>
            {/* Standard Whitelabel Header */}
            <div ref={headerRef} className='w-full h-[80px] sticky top-0 z-50 flex justify-between px-[20px] items-center' style={{ backgroundColor: headerBg, boxShadow: "0px 4px 4px #0000001F" }} >
                <p className='text-[16px] md:text-[24px] font-[400]' style={{ color: roleSettings.pageTabColor }}>
                    Invoices ({invoices.length})
                </p>
            </div>

            <div className="w-full">
                <DataTable
                    columns={columns}
                    data={invoices}
                    loading={loading}
                    error={error}
                    dataName="Invoices"
                    userType={userType}
                />
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
