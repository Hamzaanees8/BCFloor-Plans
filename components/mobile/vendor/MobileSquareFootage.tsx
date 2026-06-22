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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { GetOneOrder } from '@/app/dashboard/orders/orders'
import { GetTourSettings } from '@/app/dashboard/global-settings/global-settings'
import { UpdatePropertySquareFootage } from '@/app/dashboard/listings/listing'
import { useAppContext } from '@/app/context/AppContext'
import { useWhiteLabel } from '@/app/context/Whitelabel'
import type { Order } from '@/app/dashboard/orders/page'

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
    if (tourSettings.length === 0 || !order) return

    const orderAreaMap = new Map<string, { footage: number; custom_title?: string }>()
    order?.areas?.forEach((area: Area) => {
      const key = (area.custom_title || area.type).trim().toLowerCase()
      orderAreaMap.set(key, { footage: area.footage, custom_title: area.custom_title })
    })

    const finished: Field[] = []
    const subtotal: Field[] = []
    const other: Field[] = []

    tourSettings.forEach((setting) => {
      const label = setting.area
      const key = label.trim().toLowerCase()
      const existing = orderAreaMap.get(key)

      const category: 'Finished' | 'Subtotal' | 'Other' =
        setting.type === 'Finished Area'
          ? 'Finished'
          : setting.type === 'Sub Area'
          ? 'Subtotal'
          : 'Other'

      const field: Field = {
        id: uniqueId++,
        label,
        value: existing?.footage ?? 0,
        custom_title: label,
        category,
      }

      if (category === 'Finished') finished.push(field)
      else if (category === 'Subtotal') subtotal.push(field)
      else other.push(field)
    })

    // Include any order subtotal areas not covered by tour settings
    order?.areas?.forEach((area: Area) => {
      if ((area.type as string) === 'Subtotal') {
        const alreadyAdded = subtotal.some(
          (s) =>
            s.label.trim().toLowerCase() ===
            (area.custom_title || area.type).trim().toLowerCase()
        )
        if (!alreadyAdded) {
          subtotal.push({
            id: uniqueId++,
            label: area.custom_title || area.type,
            value: area.footage,
            custom_title: area.custom_title,
            category: 'Subtotal',
          })
        }
      }
    })

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
    () => total(finishedAreas) + total(subtotalAreas) + total(otherAreas),
    [finishedAreas, subtotalAreas, otherAreas]
  )

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
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

      const propertyId = order.property_id || (order as any).property?.uuid
      if (propertyId) {
        await UpdatePropertySquareFootage(
          String(propertyId),
          grandTotal,
          newAreas,
          {
            property_address: order.property_address,
            square_footage: grandTotal,
            areas: newAreas,
          } as any
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
      <div className="min-h-screen font-alexandria p-4 space-y-4" style={{ backgroundColor: roleSettings.pageBg }}>
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

    if (list.length === 0) return null

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
                <label className="text-sm text-gray-600 flex-1 pr-3">
                  {field.label}
                </label>
                <div className="relative">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen font-alexandria" style={{ backgroundColor: roleSettings.pageBg }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-gray-900 truncate">
              Edit Square Footage
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-500 truncate">
                {order.property_address || 'Unknown address'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="p-4 space-y-3 pb-36">
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
    </div>
  )
}
