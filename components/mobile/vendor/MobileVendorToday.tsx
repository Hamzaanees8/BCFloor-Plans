'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Get } from '@/app/dashboard/orders/orders';
import { Order } from '@/app/dashboard/orders/page';
import { useWhiteLabel } from '@/app/context/Whitelabel';
import { useAppContext } from '@/app/context/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  MapPin,
  Navigation,
  ChevronDown,
  ChevronUp,
  User,
  Wrench,
  Clock,
  RefreshCw,
  Ruler,
  Mail,
  Phone,
  StickyNote,
} from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────────────────

function getTodayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hr = hour % 12 || 12;
  return `${hr}:${m} ${ampm}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Processing':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Completed':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'Cancelled':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'On Hold':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

interface SlotWithOrder {
  order: Order;
  slot: Order['slots'][number];
}

// ── Component ───────────────────────────────────────────────────────────────

export default function MobileVendorToday() {
  const router = useRouter();
  const { appliedSettings } = useWhiteLabel();
  const { userType } = useAppContext();
  
  const roleColor = appliedSettings?.[(userType as keyof typeof appliedSettings) || 'admin']?.pageTabColor || '#DC9600';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const today = getTodayString();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  });

  const getWeekDays = (start: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      days.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
      });
    }
    return days;
  };

  const handlePrevWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + 7);
      return d;
    });
  };

  const handleGoToToday = () => {
    const todayStr = getTodayString();
    setSelectedDate(todayStr);
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day;
    setWeekStart(new Date(d.setDate(diff)));
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const fetchOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await Get(token);
      const data: Order[] = res?.data ?? res ?? [];
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // ── Derive today's and upcoming slots ──────────────────────────────────
  
  const datesWithBookings = React.useMemo(() => {
    const dates = new Set<string>();
    orders.forEach((order) => {
      order.slots?.forEach((slot) => {
        if (slot.date) dates.add(slot.date);
      });
    });
    return dates;
  }, [orders]);


  const buildSlotList = (filterFn: (date: string) => boolean): SlotWithOrder[] => {
    const items: SlotWithOrder[] = [];
    orders.forEach((order) => {
      order.slots?.forEach((slot) => {
        if (filterFn(slot.date)) {
          items.push({ order, slot });
        }
      });
    });
    // Sort chronologically by date then start_time
    items.sort((a, b) => {
      const dateCompare = a.slot.date.localeCompare(b.slot.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.slot.start_time || '').localeCompare(b.slot.start_time || '');
    });
    return items;
  };

  const todaySlots = buildSlotList((date) => date === selectedDate);

  // Next 7 days (excluding today)
  const upcomingSlots = buildSlotList((date) => {
    if (date <= today) return false;
    const target = new Date(date + 'T00:00:00');
    const limit = new Date(today + 'T00:00:00');
    limit.setDate(limit.getDate() + 7);
    return target <= limit;
  });

  // Group upcoming by date
  const upcomingByDate: Record<string, SlotWithOrder[]> = {};
  upcomingSlots.forEach((item) => {
    if (!upcomingByDate[item.slot.date]) upcomingByDate[item.slot.date] = [];
    upcomingByDate[item.slot.date].push(item);
  });

  const toggleExpand = (orderId: number) => {
    setExpandedId((prev) => (prev === orderId ? null : orderId));
  };

  // ── Render helpers ─────────────────────────────────────────────────────

  const renderAppointmentCard = (item: SlotWithOrder) => {
    const { order, slot } = item;
    const isExpanded = expandedId === order.id;
    const services = order.services
      ?.map((s) => s.service?.name)
      .filter(Boolean)
      .join(', ');
    const agentName = order.agent
      ? `${order.agent.first_name} ${order.agent.last_name}`
      : '';
    const totalFootage = order.areas?.reduce((sum, a) => sum + (a.footage || 0), 0) || 0;
    const latestNote = order.notes?.length ? order.notes[order.notes.length - 1] : null;

    return (
      <Card
        key={`${order.id}-${slot.date}-${slot.start_time}`}
        className="border border-gray-200 shadow-sm overflow-hidden"
      >
        <CardContent className="p-0">
          {/* Main section – always visible */}
          <div
            className="p-4 cursor-pointer active:bg-gray-50 transition-colors"
            onClick={() => toggleExpand(order.id)}
          >
            {/* Time */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[15px] font-semibold text-gray-900">
                <Clock className="w-4 h-4 text-[#DC9600]" />
                {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
              </div>
              <Badge variant="outline" className={`text-[11px] px-2 py-0.5 ${getStatusColor(order.order_status)}`}>
                {order.order_status}
              </Badge>
            </div>

            {/* Address */}
            <div className="flex items-start gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span className="text-[13px] text-gray-700 leading-tight">{order.property_address}</span>
            </div>

            {/* Navigate button */}
            <Button
              variant="outline"
              size="sm"
              className="mb-3 h-[48px] w-full text-[13px] font-medium border-[#DC9600] text-[#DC9600] hover:bg-[#DC9600]/10"
              onClick={(e) => {
                e.stopPropagation();
                window.open(
                  `https://maps.google.com/?q=${encodeURIComponent(
                    (order.property_address || '') + ' ' + (order.property_location || '')
                  )}`,
                  '_blank'
                );
              }}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Navigate
            </Button>

            {/* Services */}
            {services && (
              <div className="flex items-center gap-2 mb-1.5">
                <Wrench className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-[12px] text-gray-600">{services}</span>
              </div>
            )}

            {/* Agent */}
            {agentName && (
              <div className="flex items-center gap-2 mb-1">
                <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-[12px] text-gray-600">{agentName}</span>
              </div>
            )}

            {/* Expand indicator */}
            <div className="flex justify-center mt-2">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>

          {/* Expanded section */}
          {isExpanded && (
            <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
              {/* Square footage */}
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-gray-400" />
                <span className="text-[13px] text-gray-700">
                  Total Square Footage: <strong>{totalFootage.toLocaleString()} ft²</strong>
                </span>
              </div>

              {/* Latest note */}
              {latestNote && (
                <div className="flex items-start gap-2">
                  <StickyNote className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div className="text-[12px] text-gray-600">
                    <span className="font-medium">{latestNote.name}:</span> {latestNote.note}
                  </div>
                </div>
              )}

              {/* Agent contact */}
              {order.agent?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a
                    href={`mailto:${order.agent.email}`}
                    className="text-[12px] text-blue-600 underline"
                  >
                    {order.agent.email}
                  </a>
                </div>
              )}
              {order.agent?.primary_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a
                    href={`tel:${order.agent.primary_phone}`}
                    className="text-[12px] text-blue-600 underline"
                  >
                    {order.agent.primary_phone}
                  </a>
                </div>
              )}

              {/* Edit Square Footage button */}
              <Button
                className="w-full h-[48px] text-[14px] font-medium text-white hover:opacity-90"
                style={{ backgroundColor: roleColor }}
                onClick={() => router.push(`/dashboard/orders/${order.id}?mobile_sqft=1`)}
              >
                <Ruler className="w-4 h-4 mr-2" />
                Edit Square Footage
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ── Loading skeletons ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="font-alexandria p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border border-gray-200">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-[48px] w-full rounded" />
              <Skeleton className="h-3 w-56" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div className="font-alexandria p-4 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-gray-900">Schedule</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">{formatDateHeader(selectedDate)}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-5 h-5 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
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
            const isTodayDate = day.dateStr === today;
            const hasBooking = datesWithBookings.has(day.dateStr);
            
            return (
              <div 
                key={day.dateStr}
                onClick={() => setSelectedDate(day.dateStr)}
                className={`py-1.5 rounded-lg cursor-pointer transition-all border flex flex-col items-center justify-center ${
                  isSelected 
                    ? 'text-white font-bold shadow-sm' 
                    : isTodayDate
                      ? 'bg-blue-50 font-semibold border-blue-200'
                      : 'border-transparent hover:bg-gray-50 text-gray-600'
                }`}
                style={{
                  backgroundColor: isSelected ? roleColor : '',
                  borderColor: isSelected ? roleColor : '',
                  color: isTodayDate && !isSelected ? roleColor : ''
                }}
              >
                <div className="text-[9px] uppercase opacity-75">{day.dayName.slice(0, 1)}</div>
                <div className="text-xs font-semibold mt-0.5">{day.dayNum}</div>
                {hasBooking ? (
                  <div className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: isSelected ? 'white' : roleColor }} />
                ) : (
                  <div className="w-1 h-1 mt-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Appointments on selected date */}
      <div>
        <h2 className="text-[14px] font-bold text-gray-700 mb-3 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-gray-400" />
          Appointments ({todaySlots.length})
        </h2>
        {todaySlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center bg-gray-50/50 rounded-xl border border-dashed">
            <p className="text-[13px] font-medium text-gray-500">No appointments scheduled for this day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaySlots.map((item) => renderAppointmentCard(item))}
          </div>
        )}
      </div>

      {/* Upcoming 7 days */}
      {Object.keys(upcomingByDate).length > 0 && (
        <div className="space-y-4 pt-2">
          <h2 className="text-[14px] font-bold text-gray-700 border-b border-gray-200 pb-2">
            Upcoming Bookings (Next 7 Days)
          </h2>
          {Object.entries(upcomingByDate).map(([date, items]) => (
            <div key={date} className="space-y-2">
              <h3 className="text-[12px] font-bold text-[#DC9600]">{formatDateHeader(date)}</h3>
              {items.map((item) => renderAppointmentCard(item))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
