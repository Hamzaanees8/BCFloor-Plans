'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  MapPin,
  User,
  ChevronRight,
  Calendar,
  CreditCard,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Get } from '@/app/dashboard/orders/orders'
import { useAppContext } from '@/app/context/AppContext'
import { useWhiteLabel } from '@/app/context/Whitelabel'

/* ── Status helpers ───────────────────────────────────────────────────── */
function getOrderStatusBadge(status: string) {
  switch (status) {
    case 'Processing':
      return 'mobile-badge mobile-badge-blue'
    case 'Completed':
      return 'mobile-badge mobile-badge-green'
    case 'Cancelled':
      return 'mobile-badge mobile-badge-red'
    case 'On Hold':
      return 'mobile-badge mobile-badge-orange'
    default:
      return 'mobile-badge mobile-badge-gray'
  }
}

function getPaymentStatusBadge(status: string) {
  switch (status) {
    case 'PAID':
      return 'mobile-badge mobile-badge-emerald'
    case 'PARTIALLY_PAID':
      return 'mobile-badge mobile-badge-amber'
    default:
      return 'mobile-badge mobile-badge-rose'
  }
}

function paymentLabel(status: string) {
  switch (status) {
    case 'PAID':
      return 'Paid'
    case 'PARTIALLY_PAID':
      return 'Partial'
    default:
      return 'Unpaid'
  }
}

type FilterChip = 'all' | 'Processing' | 'Completed' | 'Cancelled' | 'Unpaid'

const filterChips: { key: FilterChip; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'Processing', label: 'Processing' },
  { key: 'Completed', label: 'Completed' },
  { key: 'Cancelled', label: 'Cancelled' },
  { key: 'Unpaid', label: 'Unpaid' },
]

/* ── Skeleton ─────────────────────────────────────────────────────────── */
function OrderCardSkeleton() {
  return (
    <Card className="p-3">
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </Card>
  )
}

/* ── Component ────────────────────────────────────────────────────────── */
export default function MobileOrdersList() {
  const router = useRouter()
  const { userType } = useAppContext()
  const { appliedSettings } = useWhiteLabel()
  const role = (userType as string) || 'admin'
  const roleSettings =
    appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin']
  const accentColor = roleSettings.pageTabColor || '#4290E9'

  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all')

  useEffect(() => {
    async function fetchOrders() {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const res = await Get(token)
        const data = res.data || res || []
        setOrders(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to fetch orders:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const filtered = useMemo(() => {
    let result = [...orders]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (o) =>
          (o.property_address || '').toLowerCase().includes(q) ||
          (o.agent?.first_name || '').toLowerCase().includes(q) ||
          (o.agent?.last_name || '').toLowerCase().includes(q) ||
          String(o.id).includes(q)
      )
    }

    // Status filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'Unpaid') {
        result = result.filter((o) => o.payment_status !== 'PAID')
      } else {
        result = result.filter((o) => o.order_status === activeFilter)
      }
    }

    // Sort newest first
    result.sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )
    return result
  }, [orders, searchQuery, activeFilter])

  return (
    <div className="min-h-screen font-alexandria" style={{ backgroundColor: roleSettings.pageBg }}>
      {/* Search */}
      <div className="sticky top-0 z-10 px-4 pt-3 pb-2 bg-white border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search orders..."
            className="pl-9 h-10 rounded-lg bg-gray-50 mobile-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter chips */}
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

      {/* Orders list */}
      <div className="p-4 space-y-3 pb-20">
        {loading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CreditCard className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm font-medium">No orders found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          filtered.map((order) => {
            const agentName = [order.agent?.first_name, order.agent?.last_name]
              .filter(Boolean)
              .join(' ')
            const slotDate = order.slots?.[0]?.date
            const formattedDate = slotDate
              ? new Date(slotDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : order.created_at
              ? new Date(order.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'N/A'

            return (
              <Card
                key={order.id || order.uuid}
                className="p-3 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() =>
                  router.push(`/dashboard/orders/${order.id || order.uuid}`)
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Address */}
                    <div className="flex items-start gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900 leading-tight truncate">
                        {order.property_address || 'No address'}
                      </p>
                    </div>

                    {/* Agent */}
                    {agentName && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <p className="text-xs text-gray-500 truncate">{agentName}</p>
                      </div>
                    )}

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={getOrderStatusBadge(order.order_status)}>
                        {order.order_status || 'N/A'}
                      </span>
                      <span className={getPaymentStatusBadge(order.payment_status)}>
                        {paymentLabel(order.payment_status)}
                      </span>
                    </div>

                    {/* Date & Amount */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{formattedDate}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        ${Number(order.amount || 0).toFixed(2)}
                      </span>
                    </div>
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
