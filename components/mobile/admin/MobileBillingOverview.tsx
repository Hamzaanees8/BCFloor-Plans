'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Search,
  ChevronRight,
  MapPin,
  User,
  Calendar,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { getBillings, type BillingItem } from '@/app/dashboard/billing/billing'
import { useAppContext } from '@/app/context/AppContext'
import { useWhiteLabel } from '@/app/context/Whitelabel'

/* ── Status helpers ───────────────────────────────────────────────────── */
function getPaymentStatusBadge(item: BillingItem) {
  if (item.remaining_amount <= 0) return { cls: 'mobile-badge mobile-badge-emerald', label: 'Paid' }
  if (item.total_paid > 0) return { cls: 'mobile-badge mobile-badge-amber', label: 'Partial' }
  return { cls: 'mobile-badge mobile-badge-rose', label: 'Unpaid' }
}

type FilterKey = 'all' | 'paid' | 'unpaid' | 'partial'

const filterChips: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'partial', label: 'Partial' },
]

/* ── Skeletons ────────────────────────────────────────────────────────── */
function SummaryCardSkeleton() {
  return (
    <div className="mobile-summary-card">
      <Skeleton className="h-4 w-8 mb-1" />
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-3 w-20 mt-1" />
    </div>
  )
}

function BillingCardSkeleton() {
  return (
    <Card className="p-3">
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </Card>
  )
}

/* ── Component ────────────────────────────────────────────────────────── */
export default function MobileBillingOverview() {
  const router = useRouter()
  const { userType } = useAppContext()
  const { appliedSettings } = useWhiteLabel()
  const role = (userType as string) || 'admin'
  const roleSettings =
    appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin']
  const accentColor = roleSettings.pageTabColor || '#4290E9'

  const [billings, setBillings] = useState<BillingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  useEffect(() => {
    async function fetchBillings() {
      try {
        const data = await getBillings()
        const dataArray = Array.isArray(data) ? data : []
        if (userType === 'agent') {
          const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
          const agentUuid = userInfo?.uuid
          if (agentUuid) {
            setBillings(dataArray.filter((b) => b.agent_uuid === agentUuid))
          } else {
            setBillings([])
          }
        } else {
          setBillings(dataArray)
        }
      } catch (err) {
        console.error('Failed to fetch billing data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBillings()
  }, [userType])

  /* Summary calculations */
  const summary = useMemo(() => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    let outstanding = 0
    let collectedThisMonth = 0

    billings.forEach((item) => {
      outstanding += item.remaining_amount || 0

      // Collected this month — check if there's a payment date in this month
      if (item.last_payment_date) {
        const payDate = new Date(item.last_payment_date)
        if (payDate.getMonth() === thisMonth && payDate.getFullYear() === thisYear) {
          collectedThisMonth += item.total_paid || 0
        }
      }
    })

    return { outstanding, collectedThisMonth }
  }, [billings])

  /* Filtered list */
  const filtered = useMemo(() => {
    let result = [...billings]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (b) =>
          (b.property_address || '').toLowerCase().includes(q) ||
          (b.agent_name || '').toLowerCase().includes(q) ||
          String(b.order_id).includes(q)
      )
    }

    if (activeFilter !== 'all') {
      result = result.filter((b) => {
        const isPaid = b.remaining_amount <= 0
        const isPartial = b.total_paid > 0 && b.remaining_amount > 0
        switch (activeFilter) {
          case 'paid':
            return isPaid
          case 'unpaid':
            return !isPaid && !isPartial
          case 'partial':
            return isPartial
          default:
            return true
        }
      })
    }

    result.sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )
    return result
  }, [billings, searchQuery, activeFilter])

  return (
    <div className="min-h-screen font-alexandria" style={{ backgroundColor: roleSettings.pageBg }}>
      {/* Summary cards */}
      <div className="px-4 pt-4 pb-2">
        <div className="grid grid-cols-2 gap-3">
          {loading ? (
            <>
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
            </>
          ) : (
            <>
              <div className="mobile-summary-card">
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: '#fef3c7' }}
                  >
                    <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                </div>
                <p className="mobile-summary-value text-gray-900">
                  ${summary.outstanding.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="mobile-summary-label">Outstanding</p>
              </div>

              <div className="mobile-summary-card">
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: '#d1fae5' }}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </div>
                <p className="mobile-summary-value text-gray-900">
                  ${summary.collectedThisMonth.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="mobile-summary-label">Collected this month</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search & filters */}
      <div className="sticky top-0 z-10 px-4 pt-2 pb-2 bg-white border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search billing..."
            className="pl-9 h-10 rounded-lg bg-gray-50 mobile-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 -mx-1 px-1">
          {filterChips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setActiveFilter(chip.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeFilter === chip.key
                  ? 'text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={
                activeFilter === chip.key
                  ? { backgroundColor: accentColor }
                  : undefined
              }
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Billing list */}
      <div className="p-4 space-y-3">
        {loading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <BillingCardSkeleton key={i} />
            ))}
          </>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CreditCard className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm font-medium">No billing records found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          filtered.map((item) => {
            const { cls, label } = getPaymentStatusBadge(item)
            const formattedDate = item.created_at
              ? new Date(item.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'N/A'

            return (
              <Card
                key={item.order_id || item.order_uuid}
                className="p-3 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => router.push(`/dashboard/billing?order=${item.order_id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Address */}
                    <div className="flex items-start gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900 leading-tight truncate">
                        {item.property_address || `Order #${item.order_id}`}
                      </p>
                    </div>

                    {/* Agent */}
                    {item.agent_name && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <p className="text-xs text-gray-500 truncate">{item.agent_name}</p>
                      </div>
                    )}

                    {/* Badge & Amount */}
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-2">
                        <span className={cls}>{label}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formattedDate}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        ${Number(item.total_amount || 0).toFixed(2)}
                      </span>
                    </div>

                    {/* Paid / Remaining */}
                    {item.total_paid > 0 && item.remaining_amount > 0 && (
                      <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                        <span className="text-emerald-600">
                          Paid: ${Number(item.total_paid).toFixed(2)}
                        </span>
                        <span className="text-rose-500">
                          Due: ${Number(item.remaining_amount).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 mt-1 flex-shrink-0" />
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
