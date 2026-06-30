'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  ClipboardList,
  CreditCard,
  CheckCircle,
  Clock,
  MapPin,
  User,
  ChevronRight,
  Activity,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Get } from '@/app/dashboard/orders/orders'
import { useWhiteLabel } from '@/app/context/Whitelabel'
import type { ListingOrder } from '@/lib/types'

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

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function SummaryCardSkeleton() {
  return (
    <div className="rounded-xl p-3 bg-gray-50">
      <Skeleton className="h-4 w-12 mb-2" />
      <Skeleton className="h-7 w-8" />
      <Skeleton className="h-3 w-20 mt-1" />
    </div>
  )
}

function ScheduleCardSkeleton() {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </Card>
  )
}

export default function MobileAdminDashboard() {
  const router = useRouter()
  const { appliedSettings } = useWhiteLabel()
  const [orders, setOrders] = useState<ListingOrder[]>([])
  const [loading, setLoading] = useState(true)

  const adminColor = appliedSettings?.admin?.pageTabColor || '#4290E9'

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const res = await Get(token)
        const data = res.data || res || []
        setOrders(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  })

  const getWeekDays = (start: Date) => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      days.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
      })
    }
    return days
  }

  const handlePrevWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev)
      d.setDate(prev.getDate() - 7)
      return d
    })
  }

  const handleNextWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev)
      d.setDate(prev.getDate() + 7)
      return d
    })
  }

  const handleGoToToday = () => {
    setSelectedDate(todayStr)
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day
    setWeekStart(new Date(d.setDate(diff)))
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const formatDateHeader = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  const summaryStats = useMemo(() => {
    const todaysBookings = orders.filter((o) => {
      const slots = (o as any).slots
      if (!slots || !Array.isArray(slots)) return false
      return slots.some((s: any) => s.date === todayStr)
    }).length

    const activeOrders = orders.filter((o) => o.order_status === 'Processing').length
    const pendingPayments = orders.filter((o) => o.payment_status !== 'PAID').length
    const completed = orders.filter((o) => o.order_status === 'Completed').length

    return { todaysBookings, activeOrders, pendingPayments, completed }
  }, [orders, todayStr])

  const todaysSchedule = useMemo(() => {
    const todayOrders: {
      order: ListingOrder
      slot: any
    }[] = []

    orders.forEach((order) => {
      const slots = (order as any).slots
      if (!slots || !Array.isArray(slots)) return
      slots.forEach((slot: any) => {
        if (slot.date === selectedDate) {
          todayOrders.push({ order, slot })
        }
      })
    })

    todayOrders.sort((a, b) => {
      const timeA = a.slot.start_time || '00:00'
      const timeB = b.slot.start_time || '00:00'
      return timeA.localeCompare(timeB)
    })

    return todayOrders
  }, [orders, selectedDate])

  const recentActivity = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)
  }, [orders])

  const datesWithBookings = useMemo(() => {
    const dates = new Set<string>()
    orders.forEach((order) => {
      const slots = (order as any).slots
      if (Array.isArray(slots)) {
        slots.forEach((slot: any) => {
          if (slot.date) dates.add(slot.date)
        })
      }
    })
    return dates
  }, [orders])

  const summaryCards = [
    {
      label: "Today's Bookings",
      value: summaryStats.todaysBookings,
      icon: Calendar,
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-500',
    },
    {
      label: 'Active Orders',
      value: summaryStats.activeOrders,
      icon: ClipboardList,
      bg: 'bg-green-50',
      iconBg: 'bg-green-500',
    },
    {
      label: 'Pending Payments',
      value: summaryStats.pendingPayments,
      icon: CreditCard,
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-500',
    },
    {
      label: 'Completed',
      value: summaryStats.completed,
      icon: CheckCircle,
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-500',
    },
  ]

  return (
    <div className="flex flex-col h-full font-alexandria">
      <div className="flex-1 overflow-y-auto">
        {/* Summary Cards */}
        <div className="px-4 pt-4 pb-2">
          <div className="grid grid-cols-2 gap-3">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SummaryCardSkeleton key={i} />)
              : summaryCards.map((card) => {
                  const Icon = card.icon
                  return (
                    <div key={card.label} className={`rounded-xl p-3 ${card.bg}`}>
                      <div
                        className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center mb-2`}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{card.label}</p>
                    </div>
                  )
                })}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="px-4 pt-4 pb-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Schedule</h2>
            <span className="text-xs text-gray-400 font-medium">
              {formatDateHeader(selectedDate)}
            </span>
          </div>

          {/* Week strip picker */}
          <div className="bg-white border border-gray-150 rounded-xl p-3 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button 
                  onClick={handlePrevWeek}
                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-50 border border-gray-100 text-gray-600 text-xs"
                >
                  ◀
                </button>
                <span className="text-xs font-bold text-gray-700 min-w-[100px] text-center">
                  {formatMonthYear(weekStart)}
                </span>
                <button 
                  onClick={handleNextWeek}
                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-50 border border-gray-100 text-gray-600 text-xs"
                >
                  ▶
                </button>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGoToToday}
                className="h-7 text-[11px] px-2"
              >
                Today
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {getWeekDays(weekStart).map((day) => {
                const isSelected = day.dateStr === selectedDate;
                const isTodayDate = day.dateStr === todayStr;
                const activeColor = appliedSettings?.admin?.pageTabColor || '#4290E9';
                const hasBooking = datesWithBookings.has(day.dateStr);
                
                return (
                  <div 
                    key={day.dateStr}
                    onClick={() => setSelectedDate(day.dateStr)}
                    className={`py-1.5 rounded-lg cursor-pointer transition-all border flex flex-col items-center justify-center ${
                      isSelected 
                        ? 'text-white font-bold shadow-sm' 
                        : isTodayDate
                          ? 'bg-blue-50 text-[#4290E9] border-blue-200 font-semibold'
                          : 'border-transparent hover:bg-gray-50 text-gray-600'
                    }`}
                    style={{
                      backgroundColor: isSelected ? activeColor : '',
                      borderColor: isSelected ? activeColor : isTodayDate ? '#4290E9' : 'transparent',
                    }}
                  >
                    <div className="text-[9px] uppercase opacity-75">{day.dayName.slice(0, 1)}</div>
                    <div className="text-xs font-semibold mt-0.5">{day.dayNum}</div>
                    {hasBooking ? (
                      <div className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: isSelected ? 'white' : activeColor }} />
                    ) : (
                      <div className="w-1 h-1 mt-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <ScheduleCardSkeleton key={i} />)
            ) : todaysSchedule.length === 0 ? (
              <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-dashed">
                <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No appointments scheduled for this day</p>
              </div>
            ) : (
              todaysSchedule.map(({ order, slot }, idx) => {
                const vendorName = (order as any).vendor?.first_name || 'Unassigned'
                const startTime = slot.start_time
                  ? new Date(`2000-01-01T${slot.start_time}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })
                  : '--'

                return (
                  <Card
                    key={`${order.id}-${idx}`}
                    className="p-3 cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${adminColor}15` }}
                      >
                        <Clock className="h-5 w-5" style={{ color: adminColor }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {order.property_address}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {vendorName}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{startTime}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] px-2 py-0 ${getOrderStatusColor(order.order_status)}`}>
                          {order.order_status}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="px-4 pt-4 pb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Recent Activity</h2>

          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                </Card>
              ))
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-6">
                <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No recent activity</p>
              </div>
            ) : (
              recentActivity.map((order) => (
                <Card
                  key={order.id}
                  className="p-3 cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${adminColor}15` }}
                    >
                      <MapPin className="h-4 w-4" style={{ color: adminColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {order.property_address}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`text-[9px] px-1.5 py-0 ${getOrderStatusColor(order.order_status)}`}>
                          {order.order_status}
                        </Badge>
                        <span className="text-[11px] text-gray-400">
                          {timeAgo(order.updated_at)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
