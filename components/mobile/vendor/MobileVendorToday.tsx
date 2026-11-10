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
  Camera,
  Wrench,
  Clock,
  RefreshCw,
  Ruler,
  Mail,
  Phone,
  StickyNote,
  Eye,
  Coffee,
  FileText,
  ExternalLink
} from 'lucide-react';
import SquareFootage from '@/app/dashboard/calendar/components/SquareFootage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AddBreakPopup from '@/app/dashboard/calendar/components/AddBreakPopup';
import BreakQuickViewCard from '@/app/dashboard/calendar/components/BreakQuickViewCard';
import { DeleteVendorBreak } from '@/app/dashboard/calendar/calendar';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { toast } from 'sonner';

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

function formatNoteDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

function getServiceJobTitle(s: any): string {
  const sName = s.service?.name?.trim() || '';
  const optTitle = s.option?.title?.trim() || s.optionName?.trim() || '';

  if (!optTitle) return sName;
  if (!sName) return optTitle;

  if (optTitle.toLowerCase().includes(sName.toLowerCase())) {
    return optTitle;
  }
  if (/photo|hdr|video|tour|drone|aerial|matterport|floor\s*plan|measure/i.test(optTitle)) {
    return optTitle;
  }
  return `${sName} (${optTitle})`;
}

function getPhotoCount(s: any): string | null {
  const optTitle = s.option?.title || s.optionName || '';
  const sName = s.service?.name || '';
  const isPhoto = /photo|hdr|aerial|drone/i.test(sName) || /photo|hdr|aerial|drone/i.test(optTitle);
  if (!isPhoto) return null;

  const match = optTitle.match(/(\d+)\s*(?:HDR\s*)?Photos?/i);
  if (match) {
    return `${match[1]} Photos`;
  }
  if (s.option?.quantity && Number(s.option.quantity) > 0) {
    return `${s.option.quantity} Photos`;
  }
  return optTitle || 'Photography';
}

function matchServiceSlot(os: any, sl: any): boolean {
  if (!os || !sl) return false;

  const osSid = os.service_id !== undefined && os.service_id !== null ? String(os.service_id) : '';
  const osSvcId = os.service?.id !== undefined && os.service?.id !== null ? String(os.service.id) : '';
  const osSvcUuid = os.service?.uuid ? String(os.service.uuid) : '';
  const osUuid = os.uuid ? String(os.uuid) : '';

  const slSid = sl.service_id !== undefined && sl.service_id !== null ? String(sl.service_id) : '';
  const slSvcId = sl.service?.id !== undefined && sl.service?.id !== null ? String(sl.service.id) : '';
  const slSvcUuid = sl.service?.uuid ? String(sl.service.uuid) : '';

  if (slSid) {
    if (osSid && slSid === osSid) return true;
    if (osSvcId && slSid === osSvcId) return true;
    if (osSvcUuid && slSid === osSvcUuid) return true;
  }
  if (slSvcId) {
    if (osSid && slSvcId === osSid) return true;
    if (osSvcId && slSvcId === osSvcId) return true;
  }
  if (slSvcUuid) {
    if (osSvcUuid && slSvcUuid === osSvcUuid) return true;
    if (osUuid && slSvcUuid === osUuid) return true;
  }

  return false;
}

function getServiceSlotsDisplay(
  os: any,
  orderSlots?: any[],
  currentSlot?: any
): string {
  // 1. Look in order.slots for a slot matching this service
  const matched = (orderSlots || []).filter((sl: any) => matchServiceSlot(os, sl));

  if (matched.length > 0) {
    const sorted = [...matched].sort((a, b) => {
      const dComp = (a.date || '').localeCompare(b.date || '');
      if (dComp !== 0) return dComp;
      return (a.start_time || '').localeCompare(b.start_time || '');
    });

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const startStr = formatTime(first.start_time);
    const endStr = formatTime(last.custom_end_time || last.end_time);

    return `${startStr} – ${endStr}`;
  }

  // 2. If not found in orderSlots, check if currentSlot matches this service
  if (currentSlot && matchServiceSlot(os, currentSlot)) {
    const startStr = formatTime(currentSlot.start_time);
    const endStr = formatTime(currentSlot.custom_end_time || currentSlot.end_time);
    return `${startStr} – ${endStr}`;
  }

  // 3. Never fall back to another service's slot
  return '';
}

interface SlotWithOrder {
  order: Order;
  slot: Order['slots'][number];
}

type TimeOffEvent = {
  uuid: string;
  title: string;
  start: Date;
  end: Date;
  vendor_id: string;
  address?: string;
  isBreak: true;
  vendor_name?: string;
};

type ScheduleItem =
  | { type: 'order'; data: SlotWithOrder; date: string; startTime: string }
  | { type: 'break'; data: TimeOffEvent; date: string; startTime: string };

// ── Component ───────────────────────────────────────────────────────────────

export default function MobileVendorToday({ vendorData, setVendorData }: { vendorData?: any[], setVendorData?: any }) {
  const router = useRouter();
  const { appliedSettings } = useWhiteLabel();
  const { userType: contextUserType } = useAppContext();
  const userType = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userType');
      if (stored) return stored;
      try {
        const uInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        if (uInfo?.type) return uInfo.type;
        if (uInfo?.role) return uInfo.role;
      } catch {}
      if (window.location.hostname.includes('vendor')) return 'vendor';
    }
    return contextUserType || 'vendor';
  }, [contextUserType]);

  const roleColor = appliedSettings?.[(userType as keyof typeof appliedSettings) || 'admin']?.pageTabColor || '#DC9600';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewSqftOrder, setViewSqftOrder] = useState<Order | null>(null);

  const [isAddBreakOpen, setIsAddBreakOpen] = useState(false);
  const [selectedBreakEvent, setSelectedBreakEvent] = useState<any>(null);
  const [showBreakQuickView, setShowBreakQuickView] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [breakToDelete, setBreakToDelete] = useState<any>(null);

  const [showAgain, setShowAgain] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('confirmation_dialog_delete_show_again');
      return stored ? JSON.parse(stored) : true;
    }
    return true;
  });

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

  // User & Vendor Identification
  const userInfo = React.useMemo(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('userInfo') || '{}');
    } catch {
      return {};
    }
  }, []);

  const loggedInVendorUuid = userInfo?.uuid || userInfo?.data?.uuid || userInfo?.user?.uuid;
  const loggedInVendorId = userInfo?.id || userInfo?.data?.id || userInfo?.user?.id || userInfo?.vendor_id;

  const currentVendor = React.useMemo(() => {
    if (!vendorData || !Array.isArray(vendorData)) return null;
    return (
      vendorData.find((v: any) => {
        if (loggedInVendorUuid && v.uuid === loggedInVendorUuid) return true;
        if (
          loggedInVendorId &&
          (Number(v.id) === Number(loggedInVendorId) ||
            String(v.id) === String(loggedInVendorId))
        )
          return true;
        if (
          userInfo?.email &&
          v.email &&
          v.email.toLowerCase() === userInfo.email.toLowerCase()
        )
          return true;
        return false;
      }) || null
    );
  }, [vendorData, loggedInVendorUuid, loggedInVendorId, userInfo?.email]);

  const userVendorUuids = React.useMemo(() => {
    const set = new Set<string>();
    if (loggedInVendorUuid) set.add(String(loggedInVendorUuid).toLowerCase());
    if (currentVendor?.uuid) set.add(String(currentVendor.uuid).toLowerCase());
    return set;
  }, [loggedInVendorUuid, currentVendor]);

  const userVendorIds = React.useMemo(() => {
    const set = new Set<string>();
    if (loggedInVendorId !== undefined && loggedInVendorId !== null) set.add(String(loggedInVendorId));
    if (currentVendor?.id !== undefined && currentVendor?.id !== null) set.add(String(currentVendor.id));
    return set;
  }, [loggedInVendorId, currentVendor]);

  const userVendorEmails = React.useMemo(() => {
    const set = new Set<string>();
    if (userInfo?.email) set.add(String(userInfo.email).toLowerCase());
    if (userInfo?.user?.email) set.add(String(userInfo.user.email).toLowerCase());
    if (currentVendor?.email) set.add(String(currentVendor.email).toLowerCase());
    return set;
  }, [userInfo, currentVendor]);

  const isSlotForLoggedInVendor = useCallback(
    (slot: any): boolean => {
      // If slot is explicitly cancelled, never show it
      if (slot?.status && String(slot.status).toLowerCase() === 'cancelled') {
        return false;
      }

      // If admin view, allow all active slots
      if (userType !== 'vendor') {
        return true;
      }
      if (!slot) return false;

      // Match by slot.vendor
      if (slot.vendor) {
        if (slot.vendor.uuid && userVendorUuids.has(String(slot.vendor.uuid).toLowerCase())) return true;
        if (slot.vendor.id !== undefined && userVendorIds.has(String(slot.vendor.id))) return true;
        if (slot.vendor.email && userVendorEmails.has(String(slot.vendor.email).toLowerCase())) return true;
      }

      // Match by slot.vendor_id
      if (slot.vendor_id !== undefined && slot.vendor_id !== null) {
        const vid = String(slot.vendor_id);
        if (userVendorIds.has(vid)) return true;
        if (userVendorUuids.has(vid.toLowerCase())) return true;
      }

      return false;
    },
    [userType, userVendorUuids, userVendorIds, userVendorEmails]
  );

  const isServiceForLoggedInVendor = useCallback(
    (os: any, orderSlots?: any[], currentSlot?: any): boolean => {
      if (userType !== 'vendor') return true;
      if (!os) return false;

      // 1. Direct vendor_id on os (UUID or numeric ID)
      if (os.vendor_id !== undefined && os.vendor_id !== null) {
        const vid = String(os.vendor_id);
        if (userVendorIds.has(vid)) return true;
        if (userVendorUuids.has(vid.toLowerCase())) return true;
      }

      // 2. Check if orderSlots has an active matching slot for this vendor
      if (orderSlots && orderSlots.length > 0) {
        const matchingSlots = orderSlots.filter(
          (sl: any) =>
            matchServiceSlot(os, sl) &&
            String(sl.status || '').toLowerCase() !== 'cancelled'
        );
        if (matchingSlots.some(isSlotForLoggedInVendor)) {
          return true;
        }
      }

      // 3. Check if currentSlot matches this service and is for this vendor
      if (
        currentSlot &&
        String(currentSlot.status || '').toLowerCase() !== 'cancelled' &&
        matchServiceSlot(os, currentSlot) &&
        isSlotForLoggedInVendor(currentSlot)
      ) {
        return true;
      }

      return false;
    },
    [userType, userVendorIds, userVendorUuids, isSlotForLoggedInVendor]
  );

  // Extract breaks from vendorData
  const allBreaks = React.useMemo(() => {
    const breaks: TimeOffEvent[] = [];
    if (!vendorData) return breaks;

    vendorData.forEach((vendor: any) => {
      // Filter out other vendors' breaks if logged in as a vendor
      if (userType === 'vendor') {
        const isCurrent =
          (vendor.uuid && userVendorUuids.has(String(vendor.uuid).toLowerCase())) ||
          (vendor.id !== undefined && userVendorIds.has(String(vendor.id))) ||
          (vendor.email && userVendorEmails.has(String(vendor.email).toLowerCase()));
        if (!isCurrent) return;
      }

      if (vendor.additional_breaks && Array.isArray(vendor.additional_breaks)) {
        vendor.additional_breaks.forEach((brk: any) => {
          breaks.push({
            uuid: brk.uuid,
            title: brk.title || "Time Off",
            start: new Date(`${brk.start_date}T${brk.start_time}`),
            end: new Date(`${brk.end_date}T${brk.end_time}`),
            vendor_id: vendor.uuid,
            address: brk.address,
            isBreak: true,
            vendor_name: `${vendor.first_name} ${vendor.last_name}`
          });
        });
      }
    });
    return breaks;
  }, [vendorData, userType, userVendorUuids, userVendorIds, userVendorEmails]);

  const datesWithBookings = React.useMemo(() => {
    const dates = new Set<string>();
    orders.forEach((order) => {
      // Exclude cancelled orders
      if (String(order.order_status || '').toLowerCase() === 'cancelled') return;

      order.slots?.forEach((slot) => {
        // Exclude cancelled slots
        if (String((slot as any).status || '').toLowerCase() === 'cancelled') return;

        if (userType === 'vendor' && !isSlotForLoggedInVendor(slot)) {
          return;
        }
        if (slot.date) dates.add(slot.date);
      });
    });
    allBreaks.forEach(brk => {
      // Use localized YYYY-MM-DD format (avoids UTC toISOString day shift)
      const dateStr = brk.start.toLocaleDateString('en-CA');
      dates.add(dateStr);
    });
    return dates;
  }, [orders, allBreaks, userType, isSlotForLoggedInVendor]);

  const nextBookingDate = React.useMemo(() => {
    const sortedDates = Array.from(datesWithBookings).sort();
    return sortedDates.find(date => date > selectedDate) || null;
  }, [datesWithBookings, selectedDate]);

  const handleNextBookingClick = () => {
    if (nextBookingDate) {
      setSelectedDate(nextBookingDate);
      const d = new Date(nextBookingDate + 'T00:00:00');
      const day = d.getDay();
      const diff = d.getDate() - day;
      setWeekStart(new Date(d.setDate(diff)));
    }
  };


  const buildScheduleList = (filterFn: (date: string) => boolean): ScheduleItem[] => {
    const items: ScheduleItem[] = [];
    orders.forEach((order) => {
      // Exclude cancelled orders
      if (String(order.order_status || '').toLowerCase() === 'cancelled') return;

      order.slots?.forEach((slot) => {
        // Exclude cancelled slots
        if (String((slot as any).status || '').toLowerCase() === 'cancelled') return;

        // When logged in as vendor, only show this vendor's slots!
        if (userType === 'vendor' && !isSlotForLoggedInVendor(slot)) {
          return;
        }

        if (filterFn(slot.date)) {
          items.push({ type: 'order', data: { order, slot }, date: slot.date, startTime: slot.start_time });
        }
      });
    });

    allBreaks.forEach((brk) => {
      const dateStr = brk.start.toLocaleDateString('en-CA'); // YYYY-MM-DD local format
      if (filterFn(dateStr)) {
        const h = String(brk.start.getHours()).padStart(2, '0');
        const m = String(brk.start.getMinutes()).padStart(2, '0');
        items.push({ type: 'break', data: brk, date: dateStr, startTime: `${h}:${m}` });
      }
    });

    // Sort chronologically by date then start_time
    items.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
    return items;
  };

  const todaySlots = buildScheduleList((date) => date === selectedDate);

  // Next 7 days (excluding today)
  const upcomingSlots = buildScheduleList((date) => {
    if (date <= today) return false;
    const target = new Date(date + 'T00:00:00');
    const limit = new Date(today + 'T00:00:00');
    limit.setDate(limit.getDate() + 7);
    return target <= limit;
  });

  // Group upcoming by date
  const upcomingByDate: Record<string, ScheduleItem[]> = {};
  upcomingSlots.forEach((item) => {
    if (!upcomingByDate[item.date]) upcomingByDate[item.date] = [];
    upcomingByDate[item.date].push(item);
  });

  const toggleExpand = (orderId: number) => {
    setExpandedId((prev) => (prev === orderId ? null : orderId));
  };

  const handleDeleteBreak = async () => {
    if (!breakToDelete) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await DeleteVendorBreak(breakToDelete.uuid, token);
      toast.success("Time Off deleted successfully");
      setIsConfirmOpen(false);
      setShowBreakQuickView(false);
      if (setVendorData && vendorData) {
        const updatedVendorData = vendorData.map(v => {
          if (v.uuid === breakToDelete.vendor_id) {
            return {
              ...v,
              additional_breaks: v.additional_breaks?.filter((b: any) => b.uuid !== breakToDelete.uuid)
            };
          }
          return v;
        });
        setVendorData(updatedVendorData);
      }
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 1000);
    } catch (error) {
      toast.error("Failed to delete time off");
      console.error(error);
    }
  };

  // ── Render helpers ─────────────────────────────────────────────────────

  const renderBreakCard = (item: TimeOffEvent) => {
    const startTimeStr = item.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const endTimeStr = item.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    return (
      <Card
        key={`break-${item.uuid}`}
        className="border border-gray-200 shadow-sm overflow-hidden bg-gray-50/60"
      >
        <CardContent className="p-0">
          <div
            className="p-4 cursor-pointer active:bg-gray-100 transition-colors flex flex-col"
            onClick={() => {
              setSelectedBreakEvent(item);
              setShowBreakQuickView(true);
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[15px] font-semibold text-gray-700">
                <Coffee className="w-4 h-4 text-gray-500" />
                {startTimeStr} – {endTimeStr}
              </div>
              <Badge variant="outline" className="text-[11px] px-2 py-0.5 bg-gray-200 text-gray-700 border-gray-300">
                Time Off
              </Badge>
            </div>
            <div className="flex items-start gap-2 mb-1">
              <span className="text-[13px] font-medium text-gray-800">{item.title}</span>
            </div>
            {item.vendor_name && (
              <div className="flex items-center gap-2 mb-1">
                <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-[12px] text-gray-600">{item.vendor_name}</span>
              </div>
            )}
            {item.address && (
              <div className="flex items-start gap-2 mt-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-[12px] text-gray-500 leading-tight">{item.address}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAppointmentCard = (item: ScheduleItem) => {
    if (item.type === 'break') {
      return renderBreakCard(item.data);
    }
    const { order, slot } = item.data;
    const isExpanded = expandedId === order.id;

    // ── Safe Data Extraction ─────────────────────────────────────────────
    const orderMeta = (() => {
      if (!order.meta) return {};
      if (typeof order.meta === 'string') {
        try {
          return JSON.parse(order.meta);
        } catch {
          return {};
        }
      }
      return order.meta;
    })();

    // Suite number (if any)
    const suiteNumber = (
      order.property?.suite ||
      (order as any).suite ||
      (orderMeta as any)?.suite ||
      ''
    ).toString().trim();

    // Floor plan extra areas & notes
    const floorplanAreas: string[] = Array.isArray(orderMeta?.floorplan_areas)
      ? orderMeta.floorplan_areas
      : [];
    const floorplanNotes: string = orderMeta?.floorplan_notes || '';

    // Agent details & notes
    const agentName = order.agent
      ? `${order.agent.first_name || ''} ${order.agent.last_name || ''}`.trim()
      : (order as any).agent_name || '';
    const agentPhone = order.agent?.primary_phone || order.agent?.secondary_phone || '';
    const agentNotes = order.agent?.notes ? String(order.agent.notes).trim() : '';

    // Vendor details (for admin view)
    const vendorName = slot.vendor
      ? `${slot.vendor.first_name || ''} ${slot.vendor.last_name || ''}`.trim()
      : order.vendor
        ? `${order.vendor.first_name || ''} ${order.vendor.last_name || ''}`.trim()
        : '';
    const vendorEmail = slot.vendor?.email || order.vendor?.email || '';
    const vendorPhone = slot.vendor?.primary_phone || order.vendor?.primary_phone || '';

    // Appointment notes (Additional details)
    const appointmentNotes: Array<{ note: string; name?: string; date?: string; internal?: string | boolean }> = (() => {
      if (!order.notes) return [];
      if (Array.isArray(order.notes)) return order.notes;
      if (typeof order.notes === 'string') {
        try {
          const parsed = JSON.parse(order.notes);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    })();

    // Square footage
    const measuredSqFt = order.areas?.reduce((sum, a) => sum + (Number(a.footage) || 0), 0) || 0;
    const propertySqFt = Number(order.property?.square_footage) || 0;
    const totalSqFt = measuredSqFt > 0 ? measuredSqFt : propertySqFt;

    // Filter services relevant to the logged-in vendor
    const vendorServices = (order.services || []).filter((os: any) => {
      if (userType !== 'vendor') return true;
      return isServiceForLoggedInVendor(os, order.slots, slot);
    });
    const displayServices = vendorServices.length > 0 ? vendorServices : (order.services || []);

    // Specific service for this slot if distinct
    const currentSlotService = displayServices.find((os) => matchServiceSlot(os, slot));

    // Appointment Name / Job Title
    const serviceJobTitles = displayServices.map(getServiceJobTitle).filter(Boolean);
    const appointmentTitle = currentSlotService && displayServices.length > 1 && (order.slots || []).length > 1
      ? getServiceJobTitle(currentSlotService)
      : serviceJobTitles.length > 0
        ? Array.from(new Set(serviceJobTitles)).join(', ')
        : 'Appointment';

    // Photos detection for pills
    const photoPills = (displayServices.map(getPhotoCount).filter(Boolean) || []) as string[];

    // Open maps in Google Maps / native maps app
    const openMaps = (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const suiteStr = suiteNumber
        ? (suiteNumber.toLowerCase().includes('suite') || suiteNumber.toLowerCase().includes('#') || suiteNumber.toLowerCase().includes('unit')
            ? suiteNumber
            : `Suite ${suiteNumber}`)
        : '';
      const addressParts = [
        order.property_address || order.property?.address,
        suiteStr,
        order.property_location || [order.property?.city, order.property?.province, order.property?.postal_code].filter(Boolean).join(', ')
      ].filter(Boolean).join(', ');

      window.open(`https://maps.google.com/?q=${encodeURIComponent(addressParts)}`, '_blank');
    };

    return (
      <Card
        key={`${order.id}-${slot.date}-${slot.start_time}`}
        className="border border-gray-200 shadow-sm overflow-hidden bg-white"
      >
        <CardContent className="p-0">
          {/* Main section – always visible */}
          <div
            className="p-3.5 cursor-pointer active:bg-gray-50/80 transition-colors"
            onClick={() => toggleExpand(order.id)}
          >
            {/* Time and Status */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-[14px] font-semibold text-gray-900">
                <Clock className="w-4 h-4 text-[#DC9600]" />
                {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
              </div>
              <Badge variant="outline" className={`text-[11px] px-2 py-0.5 ${getStatusColor(order.order_status)}`}>
                {order.order_status}
              </Badge>
            </div>

            {/* Appointment Name (Job Title) */}
            <div className="mb-1.5">
              <h3 className="text-[15px] font-bold text-gray-900 leading-snug">
                {appointmentTitle}
              </h3>
            </div>

            {/* Admin only: Order Number */}
            {userType === 'admin' && (
              <div className="flex items-center gap-1.5 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-[11px] font-medium text-gray-600">Order #{order.id}</span>
              </div>
            )}

            {/* Address & Suite + Inline Navigate Button (Click to open maps) */}
            <div className="flex items-center justify-between gap-2 mb-1.5 p-2 rounded-lg bg-gray-50/90 hover:bg-amber-50/50 border border-gray-200/80 hover:border-amber-300 transition-all">
              <div
                className="flex items-start gap-2 flex-1 min-w-0 cursor-pointer group"
                onClick={openMaps}
                role="button"
                tabIndex={0}
                title="Tap to open in Maps"
              >
                <MapPin className="w-4 h-4 text-[#DC9600] mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-[13px] font-semibold text-gray-900 group-hover:text-amber-800 underline decoration-gray-300 group-hover:decoration-amber-500 transition-colors leading-tight truncate">
                      {order.property_address}
                    </span>
                    {suiteNumber && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                        Suite {suiteNumber.replace(/^(suite|unit|#)\s*/i, '#')}
                      </span>
                    )}
                  </div>
                  {order.property_location && (
                    <span className="text-[11px] text-gray-500 block truncate mt-0.5">
                      {order.property_location}
                    </span>
                  )}
                </div>
              </div>

              {/* Compact Navigate button */}
              <Button
                variant="outline"
                size="sm"
                className="h-[32px] px-2.5 text-[11px] font-semibold border-[#DC9600] text-[#DC9600] hover:bg-[#DC9600]/10 shrink-0 rounded-md"
                onClick={openMaps}
              >
                <Navigation className="w-3.5 h-3.5 mr-1" />
                Navigate
              </Button>
            </div>

            {/* Quick Highlights Summary Row */}
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700">
                <Ruler className="w-3 h-3 text-gray-500" />
                {totalSqFt.toLocaleString()} ft²
              </span>
              {photoPills && photoPills.length > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <Camera className="w-3 h-3 text-blue-500" />
                  {photoPills.join(', ')}
                </span>
              )}
              {floorplanAreas.length > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                  <span>📐</span>
                  {floorplanAreas.length} extra area{floorplanAreas.length > 1 ? 's' : ''}
                </span>
              )}
              {appointmentNotes.length > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <StickyNote className="w-3 h-3 text-amber-500" />
                  {appointmentNotes.length} note{appointmentNotes.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Expand indicator */}
            <div className="flex items-center justify-center gap-1 mt-1.5 pt-1.5 border-t border-gray-100 text-[11px] font-medium text-gray-500">
              <span>{isExpanded ? 'Hide details' : 'View full appointment details'}</span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              )}
            </div>
          </div>

          {/* Expanded section */}
          {isExpanded && (
            <div className="border-t border-gray-100 bg-gray-50/70 p-3 space-y-2.5">
              {/* SECTION 1: Agent Details */}
              {agentName && (
                <div className="bg-white rounded-lg p-2.5 border border-gray-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 border-b border-gray-100 pb-1 text-[12px] font-bold text-gray-800 uppercase tracking-wide">
                    <User className="w-3.5 h-3.5 text-[#DC9600]" />
                    <span>Agent Details</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1 leading-snug">
                        <span className="text-gray-400 font-medium mr-1.5">Name:</span>
                        <span className="font-semibold text-gray-900 break-words line-clamp-2">
                          {agentName}
                        </span>
                      </div>
                      {agentPhone && (
                        <a
                          href={`tel:${agentPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 shrink-0"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{agentPhone}</span>
                        </a>
                      )}
                    </div>
                    {order.agent?.secondary_phone && order.agent.secondary_phone !== agentPhone && (
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <span className="text-gray-400">Alt Phone:</span>
                        <a
                          href={`tel:${order.agent.secondary_phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-blue-600 underline flex items-center gap-0.5"
                        >
                          <Phone className="w-3 h-3" />
                          {order.agent.secondary_phone}
                        </a>
                      </div>
                    )}
                    {userType === 'admin' && order.agent?.email && (
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <span className="text-gray-400">Email (Admin):</span>
                        <a href={`mailto:${order.agent.email}`} className="text-blue-600 underline truncate">
                          {order.agent.email}
                        </a>
                      </div>
                    )}
                    {agentNotes && (
                      <div className="p-2 mt-1 rounded bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                        <span className="font-semibold text-amber-950">Agent Note: </span>
                        {agentNotes}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 2: Job Details (What is being done) */}
              <div className="bg-white rounded-lg p-2.5 border border-gray-200 space-y-2">
                <div className="flex items-center gap-1.5 border-b border-gray-100 pb-1.5 text-[12px] font-bold text-gray-800 uppercase tracking-wide">
                  <Wrench className="w-3.5 h-3.5 text-[#DC9600]" />
                  <span>Job Details (What is being done)</span>
                </div>

                {/* Services and Option Titles */}
                {displayServices && displayServices.length > 0 ? (
                  <div className="space-y-2">
                    {displayServices.map((os, idx) => {
                      const sName = os.service?.name?.trim() || '';
                      const optTitle = os.option?.title?.trim() || os.optionName?.trim() || '';
                      const photoInfo = getPhotoCount(os);
                      const serviceSlotTime = getServiceSlotsDisplay(os, order.slots, slot);
                      const duration = os.option?.service_duration?.trim() || '';

                      return (
                        <div key={idx} className="p-2.5 rounded-lg bg-gray-50/80 border border-gray-150 text-xs space-y-1">
                          {/* Service Name on its own line */}
                          <div className="font-bold text-[13px] text-gray-900 leading-snug">
                            {sName}
                          </div>

                          {/* Option title on separate line if present and different */}
                          {optTitle && optTitle.toLowerCase() !== sName.toLowerCase() && (
                            <div className="text-[12px] font-medium text-gray-700 leading-snug">
                              {optTitle}
                            </div>
                          )}

                          {/* Slot time, Duration, Photo pills row */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {serviceSlotTime && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC9600] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                <Clock className="w-3 h-3 text-[#DC9600]" />
                                Slot: {serviceSlotTime}
                              </span>
                            )}
                            {duration && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                ⏱ {duration}
                              </span>
                            )}
                            {photoInfo && (!optTitle || !optTitle.toLowerCase().includes(photoInfo.toLowerCase())) && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
                                <Camera className="w-3 h-3" />
                                {photoInfo}
                              </span>
                            )}
                          </div>

                          {/* Custom notes */}
                          {os.custom && (
                            <p className="text-gray-500 mt-1 text-[11px] italic">{os.custom}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No services specified</p>
                )}

                {/* Square footage details */}
                <div className="pt-1.5 border-t border-gray-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 flex items-center gap-1 font-medium">
                      <Ruler className="w-3.5 h-3.5 text-gray-400" />
                      Total Square Footage:
                    </span>
                    <strong className="text-[13px] text-gray-900">
                      {totalSqFt.toLocaleString()} ft²
                    </strong>
                  </div>

                  {order.areas && order.areas.length > 0 && (
                    <div className="grid grid-cols-2 gap-1 bg-gray-50 p-1.5 rounded text-[11px] text-gray-600">
                      {order.areas.map((ar, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="truncate">{(ar as any).custom_title || ar.type}:</span>
                          <span className="font-semibold text-gray-800 ml-1">
                            {Number(ar.footage || 0).toLocaleString()} ft²
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Side-by-side compact buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <Button
                      className="w-full h-[34px] text-[12px] font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewSqftOrder(order);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 shrink-0" />
                      <span className="truncate">View Sq Ft</span>
                    </Button>
                    {userType !== 'agent' && (
                      <Button
                        className="w-full h-[34px] text-[12px] font-medium text-white hover:opacity-90 px-2"
                        style={{ backgroundColor: roleColor }}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/orders/${order.uuid}?mobile_sqft=1`);
                        }}
                      >
                        <Ruler className="w-3.5 h-3.5 mr-1 shrink-0" />
                        <span className="truncate">Edit Sq Ft</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Other areas to measure */}
                {(floorplanAreas.length > 0 || floorplanNotes) && (
                  <div className="p-2 bg-blue-50/80 border border-blue-200 rounded-md text-xs space-y-1">
                    <div className="font-bold text-blue-900 flex items-center gap-1 text-[11px]">
                      <span>📐</span>
                      <span>Other Areas to Measure</span>
                    </div>
                    {floorplanAreas.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {floorplanAreas.map((area, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    )}
                    {floorplanNotes && (
                      <p className="text-blue-700 mt-0.5 italic text-[10px] leading-snug">
                        <span className="font-semibold not-italic">Notes:</span> {floorplanNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 3: Additional Details (Appointment Notes) */}
              <div className="bg-white rounded-lg p-2.5 border border-gray-200 space-y-1.5">
                <div className="flex items-center gap-1.5 border-b border-gray-100 pb-1 text-[12px] font-bold text-gray-800 uppercase tracking-wide">
                  <StickyNote className="w-3.5 h-3.5 text-[#DC9600]" />
                  <span>Additional Details (Appointment Notes)</span>
                </div>
                {appointmentNotes.length > 0 ? (
                  <div className="space-y-1.5">
                    {appointmentNotes.map((noteItem, idx) => (
                      <div key={idx} className="p-2 rounded bg-gray-50/70 border border-gray-150 text-xs">
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {noteItem.note}
                        </p>
                        {(noteItem.name || noteItem.date) && (
                          <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-gray-200/60 text-[10px] text-gray-400">
                            {noteItem.name && <span className="font-semibold text-gray-600">{noteItem.name}</span>}
                            {noteItem.name && noteItem.date && <span>•</span>}
                            {noteItem.date && <span>{formatNoteDate(noteItem.date)}</span>}
                            {(noteItem.internal === 'true' || noteItem.internal === true) && (
                              <span className="ml-auto px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-red-50 text-red-600 border border-red-200">
                                Internal
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No notes for this appointment</p>
                )}
              </div>

              {/* Vendor Contact (Admin / Agent only) */}
              {(userType === 'agent' || userType === 'admin') && (vendorEmail || vendorPhone) && (
                <div className="bg-white rounded-lg p-2.5 border border-gray-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 border-b border-gray-100 pb-1 text-[12px] font-bold text-gray-800 uppercase tracking-wide">
                    <Camera className="w-3.5 h-3.5 text-gray-400" />
                    <span>Vendor Contact</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                    {vendorName && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Vendor:</span>
                        <span className="font-semibold text-gray-900">{vendorName}</span>
                      </div>
                    )}
                    {vendorPhone && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Phone:</span>
                        <a href={`tel:${vendorPhone}`} className="text-blue-600 underline">
                          {vendorPhone}
                        </a>
                      </div>
                    )}
                    {vendorEmail && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Email:</span>
                        <a href={`mailto:${vendorEmail}`} className="text-blue-600 underline">
                          {vendorEmail}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
        <div className="flex items-center gap-2">
          {(userType === 'admin' || userType === 'vendor') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedBreakEvent(null);
                setIsAddBreakOpen(true);
              }}
              className="text-[12px] h-[34px] font-medium"
            >
              Add Time Off
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
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
          <div className="flex items-center gap-2">
            {userType !== 'admin' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextBookingClick}
                disabled={!nextBookingDate}
                className="h-7 text-[11px] px-2"
              >
                Next
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoToToday}
              className="h-7 text-[11px] px-2"
            >
              Today
            </Button>
          </div>
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
                className={`py-1.5 rounded-lg cursor-pointer transition-all border flex flex-col items-center justify-center ${isSelected
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

      {/* Square Footage Viewer Dialog */}
      <Dialog open={!!viewSqftOrder} onOpenChange={(open) => !open && setViewSqftOrder(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md w-full max-h-[90vh] overflow-y-auto p-4 md:p-6 font-alexandria">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-800">
              Square Footage
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <SquareFootage currentOrder={viewSqftOrder || undefined} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Time Off Popup */}
      <AddBreakPopup
        open={isAddBreakOpen}
        setOpen={setIsAddBreakOpen}
        vendorData={vendorData || []}
        popupType="break"
        currentBreak={selectedBreakEvent}
        setVendorData={setVendorData}
        onAddBreak={() => { }} // Additional action if needed
      />

      {/* Quick View Break Card Overlay */}
      {showBreakQuickView && selectedBreakEvent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/20">
          <BreakQuickViewCard
            data={selectedBreakEvent}
            onClose={() => {
              setShowBreakQuickView(false);
              setSelectedBreakEvent(null);
            }}
            vendorData={vendorData || []}
            handleDelete={() => {
              setBreakToDelete(selectedBreakEvent);
              setIsConfirmOpen(true);
            }}
            breakAction={() => {
              // Edit action
              setShowBreakQuickView(false);
              setIsAddBreakOpen(true);
            }}
          />
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={isConfirmOpen}
        setOpen={setIsConfirmOpen}
        onConfirm={handleDeleteBreak}
        title="Delete Time Off"
        description="Are you sure you want to delete this time off? This action cannot be undone."
        showAgain={showAgain}
        toggleShowAgain={() => setShowAgain(!showAgain)}
      />
    </div>
  );
}
