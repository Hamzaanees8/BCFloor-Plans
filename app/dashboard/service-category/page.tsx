'use client'

import React, { useEffect, useRef, useState } from 'react'
import { DataTable } from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { useAppContext } from '@/app/context/AppContext'
import { useWhiteLabel } from '@/app/context/Whitelabel'
import DropdownActions from '@/components/DropdownActions'
import CategoryDialog from '@/components/CategoryDialog'
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute'
import { GetCategories, DeleteCategory } from '@/app/dashboard/services/services'
import { CategoriesData } from '@/app/dashboard/services/create/page'

const Page = () => {
    const { userType } = useAppContext()
    const { appliedSettings } = useWhiteLabel()
    const role = (userType as string) || 'admin'
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin']
    const headerBg = `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`

    const [categoriesData, setCategoriesData] = useState<CategoriesData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const [dialogOpen, setDialogOpen] = useState(false)
    const [editData, setEditData] = useState<CategoriesData | null>(null)

    const headerRef = useRef<HTMLDivElement>(null)

    // Fix overflow on parent containers (same pattern as services page)
    useEffect(() => {
        const header = headerRef.current
        if (!header) return
        let ancestor = header.parentElement
        while (ancestor) {
            const style = window.getComputedStyle(ancestor)
            if (style.overflowX === 'hidden' || ancestor.classList.contains('overflow-x-hidden')) {
                ancestor.style.setProperty('overflow-x', 'visible', 'important')
                ancestor.style.setProperty('overflow-y', 'visible', 'important')
                const target = ancestor
                return () => {
                    target.style.removeProperty('overflow-x')
                    target.style.removeProperty('overflow-y')
                }
            }
            ancestor = ancestor.parentElement
        }
    }, [])

    // Load categories on mount
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) { setLoading(false); setError(true); return }
        setLoading(true)
        setError(false)
        GetCategories(token)
            .then((res) => {
                setCategoriesData(Array.isArray(res.data) ? res.data : [])
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }, [])

    const handleDelete = async (uuid: string) => {
        try {
            const token = localStorage.getItem('token') || ''
            await DeleteCategory(uuid, token)
            toast.success('Category deleted successfully')
            setCategoriesData((prev) => prev.filter((c) => c.uuid !== uuid))
        } catch (err) {
            if (err instanceof Error) toast.error(err.message || 'Failed to delete')
            else toast.error('Failed to delete category')
        }
    }

    const openCreate = () => {
        setEditData(null)
        setDialogOpen(true)
    }

    const openEdit = (category: CategoriesData) => {
        setEditData(category)
        setDialogOpen(true)
    }

    const handleEditSuccess = (updated: CategoriesData) => {
        setCategoriesData((prev) =>
            prev.map((c) => (c.uuid === updated.uuid ? updated : c))
        )
    }

    const columns: ColumnDef<CategoriesData>[] = [
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => (
                <div className="text-[15px] font-[400]" style={{ color: roleSettings.pageTabColor }}>
                    {row.original.name}
                </div>
            ),
        },
        {
            accessorKey: 'type',
            header: 'Types',
            cell: ({ row }) => {
                const types: string[] = Array.isArray(row.original.type)
                    ? row.original.type
                    : typeof row.original.type === 'string'
                        ? JSON.parse(row.original.type || '[]')
                        : []
                const labels: Record<string, string> = {
                    quantity: 'Quantity',
                    fixed: 'Fixed',
                    area: 'Area',
                }
                return (
                    <div className="flex flex-wrap gap-1">
                        {types.map((t) => (
                            <span
                                key={t}
                                className="text-[11px] px-2 py-[2px] rounded-full border font-[500]"
                                style={{ borderColor: roleSettings.pageTabColor, color: roleSettings.pageTabColor }}
                            >
                                {labels[t] ?? t}
                            </span>
                        ))}
                    </div>
                )
            },
        },
        {
            accessorKey: 'duration',
            header: 'Duration',
            cell: ({ row }) => (
                <div className="text-[15px] font-[400]" style={{ color: roleSettings.pageText }}>
                    <span
                        className={`text-[11px] px-2 py-[2px] rounded-full font-[500] ${row.original.duration ? 'bg-[#6BAE41] text-white' : 'bg-[#E06D5E] text-white'}`}
                    >
                        {row.original.duration ? 'Yes' : 'No'}
                    </span>
                </div>
            ),
        },
        {
            header: 'Add Ons',
            cell: ({ row }) => (
                <div className="text-[15px] font-[400]" style={{ color: roleSettings.pageText }}>
                    <span
                        className={`text-[11px] px-2 py-[2px] rounded-full font-[500] ${(row.original as CategoriesData & { add_ons?: boolean }).add_ons ? 'bg-[#6BAE41] text-white' : 'bg-[#E06D5E] text-white'}`}
                    >
                        {(row.original as CategoriesData & { add_ons?: boolean }).add_ons ? 'Yes' : 'No'}
                    </span>
                </div>
            ),
        },
        {
            header: 'Actions',
            cell: ({ row }) => {
                const category = row.original
                const options = [
                    {
                        label: 'Edit',
                        onClick: () => openEdit(category),
                    },
                    {
                        label: 'Delete',
                        onClick: () => handleDelete(category.uuid),
                        confirm1: true,
                    },
                ]
                return (
                    <div className="flex items-center pr-[20px]">
                        <DropdownActions options={options} />
                    </div>
                )
            },
        },
    ]

    return (
        <ProtectedAdminRoute>
            <div style={{ backgroundColor: roleSettings.pageBg, minHeight: '100vh', color: roleSettings.pageText }}>
                {/* Header */}
                <div
                    ref={headerRef}
                    className="w-full h-[80px] font-alexandria z-[50] sticky top-0 flex justify-between px-[20px] items-center"
                    style={{ position: 'sticky', top: 0, backgroundColor: headerBg, boxShadow: '0px 4px 4px #0000001F' }}
                >
                    <p className="text-[16px] md:text-[24px] font-[400]" style={{ color: roleSettings.pageTabColor }}>
                        Service Categories ({categoriesData.length})
                    </p>
                    <button
                        onClick={openCreate}
                        className="w-[140px] md:w-[170px] h-[35px] md:h-[44px] rounded-[6px] border-[1px] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] justify-center items-center hover:brightness-110 cursor-pointer"
                        style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
                    >
                        + New Category
                    </button>
                </div>

                {/* Table */}
                <div className="w-full">
                    <DataTable
                        data={categoriesData}
                        columns={columns}
                        loading={loading}
                        error={error}
                        dataName="Categories"
                        userType={userType}
                        headerBgOverride={headerBg}
                    />
                </div>

                {/* Create / Edit Dialog */}
                <CategoryDialog
                    open={dialogOpen}
                    setOpen={(val) => {
                        setDialogOpen(val)
                        if (!val) setEditData(null)
                    }}
                    setCategoriesData={setCategoriesData as any}
                    editData={editData}
                    onEditSuccess={handleEditSuccess}
                />
            </div>
        </ProtectedAdminRoute>
    )
}

export default Page