'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  MapPin,
  Ruler,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { GetOneOrder } from '@/app/dashboard/orders/orders'
import { GetTourSettings } from '@/app/dashboard/global-settings/global-settings'
import { UpdatePropertySquareFootage } from '@/app/dashboard/listings/listing'
import { EditOrder } from '@/app/dashboard/calendar/calendar'
import { useAppContext } from '@/app/context/AppContext'
import { useWhiteLabel } from '@/app/context/Whitelabel'
import type { Order } from '@/app/dashboard/orders/page'
import AddExtraDialog from '@/app/dashboard/calendar/components/AddExtraDialog'

/* ── Types ────────────────────────────────────────────────────────────── */
interface TourSetting {
  uuid: string
  area: string
  type: string
  status: boolean
}

interface Field {
  id: number
  label: string
  value: number
  custom_title?: string
  category: 'Finished' | 'Subtotal' | 'Other'
}

interface Area {
  type: string
  footage: number
  custom_title?: string
  category?: 'Finished' | 'Subtotal' | 'Other'
}

let uniqueId = 1000

/* ── Component ────────────────────────────────────────────────────────── */
interface MobileSquareFootageProps {
  orderId?: string
}

export default function MobileSquareFootage({ orderId: propOrderId }: MobileSquareFootageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userType } = useAppContext()
  const { appliedSettings } = useWhiteLabel()
  const role = (userType as string) || 'vendor'
  const roleSettings =
    appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['vendor']

  const orderId = propOrderId || searchParams.get('orderId') || ''

  const [order, setOrder] = useState<Order | null>(null)
  const [tourSettings, setTourSettings] = useState<TourSetting[]>([])
  const [finishedAreas, setFinishedAreas] = useState<Field[]>([])
  const [subtotalAreas, setSubtotalAreas] = useState<Field[]>([])
  const [otherAreas, setOtherAreas] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    finished: true,
    subtotal: true,
    other: true,
  })

  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [dialogDefaultCategory, setDialogDefaultCategory] = useState<'Finished' | 'Subtotal' | 'Other'>('Finished')

  /* ── Data fetching ──────────────────────────────────────────────────── */
  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('token')
        if (!token || !orderId) return

        const [orderRes, settingsRes] = await Promise.all([
          GetOneOrder(token, orderId),
          GetTourSettings(),
        ])

        const orderData = orderRes?.data || orderRes
        setOrder(orderData)

        const settings: TourSetting[] = (
          settingsRes?.data?.tour_settings ?? []
        ).filter((s: TourSetting) => s.status)
        setTourSettings(settings)
      } catch (err) {
        console.error('Failed to load square footage data:', err)
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId])

  /* ── Build fields from tour settings + order areas ─────────────────── */
  useEffect(() => {
    if (tourSettings.length === 0) return

    const finished: Field[] = []
    const subtotal: Field[] = []
    const other: Field[] = []

    // 1. Add all existing areas from current order
    order?.areas?.forEach((area: Area) => {
      const category = (area.category || area.type) as 'Finished' | 'Subtotal' | 'Other'
      const label = area.custom_title || area.type
      
      const field: Field = {
        id: uniqueId++,
        label,
        value: area.footage || 0,
        custom_title: area.custom_title,
        category: ['Finished', 'Subtotal', 'Other'].includes(category) ? category : 'Other',
      }

      if (field.category === 'Finished') finished.push(field)
      else if (field.category === 'Subtotal') subtotal.push(field)
      else other.push(field)
    })

    // 2. Add defaults if empty
    const finishedSettings = tourSettings.filter(s => s.type === 'Finished Area')
    const subtotalSettings = tourSettings.filter(s => s.type === 'Sub Area')
    const otherSettings = tourSettings.filter(s => s.type !== 'Finished Area' && s.type !== 'Sub Area')

    if (finished.length === 0 && finishedSettings.length > 0) {
      const mainLevelSetting = finishedSettings.find(s => s.area.trim().toLowerCase() === 'main level') || finishedSettings[0]
      finished.push({
        id: uniqueId++,
        label: mainLevelSetting.area,
        value: 0,
        custom_title: mainLevelSetting.area,
        category: 'Finished'
      })
    }

    if (subtotal.length === 0 && subtotalSettings.length > 0) {
      subtotal.push({
        id: uniqueId++,
        label: subtotalSettings[0].area,
        value: 0,
        custom_title: subtotalSettings[0].area,
        category: 'Subtotal'
      })
    }

    if (other.length === 0 && otherSettings.length > 0) {
      other.push({
        id: uniqueId++,
        label: otherSettings[0].area,
        value: 0,
        custom_title: otherSettings[0].area,
        category: 'Other'
      })
    }

    setFinishedAreas(finished)
    setSubtotalAreas(subtotal)
    setOtherAreas(other)
  }, [tourSettings, order])

  /* ── Helpers ────────────────────────────────────────────────────────── */
  const handleChange = (
    id: number,
    list: Field[],
    setList: React.Dispatch<React.SetStateAction<Field[]>>,
    value: number
  ) => {
    setList(list.map((item) => (item.id === id ? { ...item, value } : item)))
  }

  const total = (list: Field[]) =>
    list.reduce((sum, item) => sum + (item.value > 0 ? item.value : 0), 0)

  const grandTotal = useMemo(
    () => total(finishedAreas) + total(subtotalAreas),
    [finishedAreas, subtotalAreas]
  )

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleRemove = (
    id: number,
    list: Field[],
    setList: React.Dispatch<React.SetStateAction<Field[]>>
  ) => {
    setList(list.filter((item) => item.id !== id))
  }

  const handleAddExtra = (
    label: string,
    sqft: number,
    category: 'Finished' | 'Subtotal' | 'Other',
    customLabel?: string
  ) => {
    const newField: Field = {
      id: uniqueId++,
      label,
      value: sqft,
      category,
      custom_title: customLabel,
    }

    if (category === 'Finished') setFinishedAreas((prev) => [...prev, newField])
    else if (category === 'Subtotal') setSubtotalAreas((prev) => [...prev, newField])
    else setOtherAreas((prev) => [...prev, newField])
  }

  /* ── Save ───────────────────────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    if (!order) return
    setSaving(true)

    try {
      const allFields = [...finishedAreas, ...subtotalAreas, ...otherAreas]
      const newAreas: Area[] = allFields
        .filter((item) => item.value > 0)
        .map((item) => ({
          type: item.category,
          footage: item.value,
          custom_title: item.label,
          category: item.category,
        }))

      const propertyId = (order as any).property?.uuid
      if (propertyId) {
        await UpdatePropertySquareFootage(
          String(propertyId),
          grandTotal,
          newAreas,
          {
            agent_id: (order as any).agent?.uuid,
            address: (order as any).property?.address,
            city: (order as any).property?.city,
            province: (order as any).property?.province,
            country: (order as any).property?.country,
            listing_price: Number((order as any).property?.listing_price),
            mls_number: (order as any).property?.mls_number,
            bedrooms: Number((order as any).property?.bedrooms),
            bathrooms: Number((order as any).property?.bathrooms),
            lot_size: (order as any).property?.lot_size,
            year_constructed: Number((order as any).property?.year_constructed),
            parking_spots: Number((order as any).property?.parking_spots),
            property_type: (order as any).property?.property_type,
            property_status: (order as any).property?.property_status,
            heading: (order as any).property?.heading,
            description: (order as any).property?.description,
          } as any
        )
      }

      const token = localStorage.getItem('token')
      if (token && order.uuid) {
        await EditOrder(
          order.uuid,
          {
            areas: newAreas,
            update_invoice: 0,
            _method: 'PUT',
          } as any,
          token
        )
      }

      toast.success('Square footage updated successfully')
      router.back()
    } catch (err) {
      console.error('Failed to save square footage:', err)
      toast.error('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [order, finishedAreas, subtotalAreas, otherAreas, grandTotal, router])

  /* ── Loading state ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen font-alexandria p-4 space-y-4 pb-20" style={{ backgroundColor: roleSettings.pageBg }}>
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="h-5 w-48" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="mobile-card space-y-3">
            <Skeleton className="h-5 w-24" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen font-alexandria flex items-center justify-center p-4" style={{ backgroundColor: roleSettings.pageBg }}>
        <div className="text-center text-gray-400">
          <Ruler className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Order not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  /* ── Section renderer ───────────────────────────────────────────────── */
  const renderSection = (
    title: string,
    sectionKey: string,
    list: Field[],
    setList: React.Dispatch<React.SetStateAction<Field[]>>
  ) => {
    const isOpen = openSections[sectionKey] ?? true
    const sectionTotal = total(list)

    return (
      <div className="mobile-card overflow-hidden !p-0">
        {/* Section header */}
        <button
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 active:bg-gray-100 transition-colors"
          onClick={() => toggleSection(sectionKey)}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">{title}</span>
            <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
              {sectionTotal.toLocaleString()} sq ft
            </span>
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Fields */}
        {isOpen && (
          <div className="divide-y divide-gray-100">
            {list.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center flex-1 pr-3">
                  <label className="text-sm text-gray-600 truncate">
                    {field.label}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-24 h-12 text-right text-lg font-semibold rounded-lg border border-gray-200 px-3 focus:outline-none focus:ring-2 focus:border-transparent bg-white"
                    style={{ fontSize: '18px', focusRing: roleSettings.pageTabColor } as any}
                    value={field.value || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0
                      handleChange(field.id, list, setList, val)
                    }}
                    placeholder="0"
                  />
                  {userType !== 'agent' && (
                    <button
                      onClick={() => handleRemove(field.id, list, setList)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {userType !== 'agent' && (
              <div className="px-4 py-3 bg-gray-50/50">
                <Button
                  variant="ghost"
                  className="w-full text-[#4290E9] hover:bg-blue-50 h-10 border border-dashed border-[#4290E9]/30"
                  onClick={() => {
                    const category =
                      sectionKey === 'finished' ? 'Finished' : sectionKey === 'subtotal' ? 'Subtotal' : 'Other';
                    setDialogDefaultCategory(category);
                    setOpenAddDialog(true);
                  }}
                >
                  + Add area
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen font-alexandria pb-20" style={{ backgroundColor: roleSettings.pageBg }}>
      {/* Header */}
      <div className="relative z-10 bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[14px] font-semibold text-gray-900 truncate">
              Edit Square Footage
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-500 truncate">
                {[
                  order.property_address,
                  order.property_location,
                  (order as any).property?.address,
                  (order as any).property?.city
                ].filter(Boolean).join(' ') || 'Address not provided'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="p-4 space-y-3 pb-[200px]">
        {renderSection('Finished Area', 'finished', finishedAreas, setFinishedAreas)}
        {renderSection('Subtotal Area', 'subtotal', subtotalAreas, setSubtotalAreas)}
        {renderSection('Other', 'other', otherAreas, setOtherAreas)}

        {finishedAreas.length === 0 && subtotalAreas.length === 0 && otherAreas.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <Ruler className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No area fields configured</p>
            <p className="text-xs mt-1">Contact admin to set up tour settings</p>
          </div>
        )}
      </div>

      {/* Sticky footer with grand total and save */}
      <div className="fixed bottom-[56px] left-0 right-0 bg-white border-t shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-20">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Grand Total</span>
            <span className="text-xl font-bold text-gray-900">
              {grandTotal.toLocaleString()} <span className="text-sm font-normal text-gray-400">sq ft</span>
            </span>
          </div>
          <Button
            className="w-full h-12 text-base font-semibold rounded-xl text-white shadow-sm"
            style={{ backgroundColor: roleSettings.pageTabColor || '#DC9600' }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Square Footage
              </>
            )}
          </Button>
        </div>
      </div>

      <AddExtraDialog
        open={openAddDialog}
        onOpenChange={setOpenAddDialog}
        onAddExtra={handleAddExtra}
        defaultCategory={dialogDefaultCategory}
        tourSettings={tourSettings}
      />
    </div>
  )
}
