'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Package, Eye, CreditCard, ImageOff } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Get } from '@/app/dashboard/orders/orders'
import { useWhiteLabel } from '@/app/context/Whitelabel'
import type { ListingOrder } from '@/lib/types'

type FilterType = 'All' | 'Processing' | 'Completed' | 'Unpaid'

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')

function getOrderStatusColor(status: string) {
  switch (status) {
    case 'Processing':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'Completed':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'Cancelled':
      return 'bg-red-100 text-red-700 border-red-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function getPaymentStatusColor(status: string) {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'PARTIALLY_PAID':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'UNPAID':
      return 'bg-rose-100 text-rose-700 border-rose-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function getPaymentLabel(status: string) {
  switch (status) {
    case 'PAID':
      return 'Paid'
    case 'PARTIALLY_PAID':
      return 'Partially Paid'
    case 'UNPAID':
      return 'Unpaid'
    default:
      return status
  }
}

function getNextSlotDate(order: ListingOrder): string | null {
  const slots = (order as any).slots
  if (!slots || !Array.isArray(slots) || slots.length === 0) return null
  const now = new Date()
  const upcoming = slots
    .filter((s: any) => new Date(s.date) >= now)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
  if (upcoming.length > 0) return upcoming[0].date
  const sorted = [...slots].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return sorted[0]?.date || null
}

function getThumbnail(order: ListingOrder): string | null {
  const file = order.tours?.[0]?.files?.[0]
  if (!file) return null
  return file.thumbnail_url || file.file_path || null
}

function OrderCardSkeleton() {
  return (
    <Card className="p-3">
      <div className="flex gap-3">
        <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Skeleton className="h-9 flex-1 rounded-md" />
      </div>
    </Card>
  )
}

export default function MobileAgentOrders() {
  const router = useRouter()
  const { appliedSettings } = useWhiteLabel()
  const [orders, setOrders] = useState<ListingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('All')

  const agentColor = appliedSettings?.agent?.pageTabColor || '#6BAE41'

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

  const filters: FilterType[] = ['All', 'Processing', 'Completed', 'Unpaid']

  const filteredOrders = useMemo(() => {
    let result = [...orders]

    // Apply filter
    if (activeFilter === 'Processing') {
      result = result.filter((o) => o.order_status === 'Processing')
    } else if (activeFilter === 'Completed') {
      result = result.filter((o) => o.order_status === 'Completed')
    } else if (activeFilter === 'Unpaid') {
      result = result.filter((o) => o.payment_status !== 'PAID')
    }

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((o) => o.property_address?.toLowerCase().includes(q))
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return result
  }, [orders, activeFilter, search])

  return (
    <div className="flex flex-col h-full font-alexandria">
      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-white px-4 pt-4 pb-2 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all min-h-[36px]"
              style={
                activeFilter === filter
                  ? { backgroundColor: agentColor, color: '#fff' }
                  : { backgroundColor: '#F3F4F6', color: '#6B7280' }
              }
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Order List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <OrderCardSkeleton key={i} />)
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Package className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium text-base">No orders found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Try adjusting your search' : 'Your orders will appear here'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const thumbnail = getThumbnail(order)
            const slotDate = getNextSlotDate(order)
            const tourUuid = order.tours?.[0]?.uuid
            const tourUrl = tourUuid
              ? `/tour/${slugify(order.property_address)}/${order.uuid}`
              : null

            return (
              <Card key={order.id} className="p-3 hover:shadow-md transition-shadow">
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={order.property_address}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff className="h-6 w-6 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {order.property_address}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <Badge className={`text-[10px] px-2 py-0 ${getOrderStatusColor(order.order_status)}`}>
                        {order.order_status}
                      </Badge>
                      <Badge className={`text-[10px] px-2 py-0 ${getPaymentStatusColor(order.payment_status)}`}>
                        {getPaymentLabel(order.payment_status)}
                      </Badge>
                    </div>

                    {slotDate && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(slotDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    )}

                    <p className="text-sm font-bold mt-1" style={{ color: agentColor }}>
                      ${order.amount}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-3">
                  {order.payment_status !== 'PAID' && (
                    <Button
                      size="sm"
                      className="flex-1 h-9 text-xs font-medium text-white rounded-lg"
                      style={{ backgroundColor: agentColor }}
                      onClick={() => router.push(`/dashboard/billing?order=${order.id}`)}
                    >
                      <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                      Pay Now
                    </Button>
                  )}
                  {tourUrl && order.order_status === 'Completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-9 text-xs font-medium rounded-lg"
                      style={{ borderColor: agentColor, color: agentColor }}
                      onClick={() => window.open(tourUrl, '_blank')}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View Tour
                    </Button>
                  )}
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
