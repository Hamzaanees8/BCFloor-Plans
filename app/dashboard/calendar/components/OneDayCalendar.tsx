'use client'
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import dayjs from "dayjs";
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { EventClickArg } from '@fullcalendar/core';
import { useOrderContext, Slot } from '../../orders/context/OrderContext';
import { VendorData } from '../../orders/[id]/page';
import { Order } from '../../orders/page';
import { GetOneListing } from '../../listings/listing';
import { Get, GetVendors, convertVendorWorkHoursToPropertyTimezone, fetchTwilightTime, TwilightResponse } from '../../orders/orders';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface WorkHours {
  start_time?: string;
  end_time?: string;
  break_start?: string;
  break_end?: string;
  timezone?: string;
  work_days?: {
    day: string;
    start_time: string;
    end_time: string;
    is_off: string | number | boolean;
    is_twilight: string | number | boolean;
  }[];
}

interface Slots {
  start: string;
  end: string;
  title: string;
  className: string;
  vendor_id?: string;
  [key: string]: string | undefined;
}

interface SelectedService {
  title?: string;
  uuid?: string;
  id: number;
  price?: number;
  custom?: string;
  quantity?: number;
  option_id?: string;
  optionName: string;
  service: {
    id: number;
    name: string;
    uuid: string;
  };
}

interface CalendarProps {
  selectedVendors: string[];
  service: SelectedService;
  recommendTime: number;
  showAllVendors: number;
  scheduleOverride: number;
  calendarIdx: number;
  showAllVendorsMap: Record<number, 0 | 1>;
  scheduleOverrideMap: Record<number, 0 | 1>;
  recommendTimeMap: Record<number, 0 | 1>;
  setSelectedDate: (date: string) => void;
  vendorDistances: Record<string, number>;
  propertyTimezone?: string;
  masterDate: Date;
  selectedListingId?: string | null;
  currentOrderId?: string;
}

interface MinimalSlot {
  date: string;
  start_time: string;
  end_time: string;
  vendor_id?: string;
  vendor?: {
    uuid?: string;
  };
}

interface VendorTimeOff {
  id?: number;
  uuid?: string;
  vendor_id?: number;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  address?: string;
  start_date?: string;
  end_date?: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  start_formatted?: string;
  end_formatted?: string;
  all_day: boolean;
  status: string;
  location?: string;
  created?: string;
  updated?: string;
}

function generateMarkedSlots(
  date: string,
  workHours: WorkHours,
  vendorId: string,
  allBookedSlots: MinimalSlot[],
  otherServiceSlots: MinimalSlot[] = [],
  vendorTimeOffs: VendorTimeOff[] = [],
  calendarEvents: CalendarEvent[] = [],
  interval = 15
): Slots[] {
  if (!workHours) return [];

  const currentDateObj = dayjs(date);
  const dayOfWeek = currentDateObj.format('ddd').toLowerCase();
  const daySchedule = workHours.work_days?.find(d => d.day === dayOfWeek);

  if (daySchedule && (daySchedule.is_off === '1' || daySchedule.is_off === 1 || daySchedule.is_off === true)) {
    return [];
  }

  const effectiveStartTime = daySchedule?.start_time || workHours.start_time;
  const effectiveEndTime = daySchedule?.end_time || workHours.end_time;

  if (!effectiveStartTime || !effectiveEndTime) return [];

  const slots = [];
  const start = dayjs(`${date}T${effectiveStartTime}`);
  let end = dayjs(`${date}T${effectiveEndTime}`);

  if (end.isBefore(start) || end.isSame(start)) {
    end = end.add(1, 'day');
  }

  const breakStart = workHours.break_start ? dayjs(`${date}T${workHours.break_start}`) : null;
  const breakEnd = workHours.break_end ? dayjs(`${date}T${workHours.break_end}`) : null;

  const relevantBookedSlots = allBookedSlots
    ?.filter(s => (s.vendor?.uuid || s.vendor_id) === vendorId && s.date === date)
    .map(s => ({
      start: dayjs(`${s.date}T${s.start_time}`).toISOString(),
      end: dayjs(`${s.date}T${s.end_time}`).toISOString()
    })) || [];

  const relevantOtherSlots = otherServiceSlots
    ?.filter(s => s.vendor_id === vendorId && s.date === date)
    .map(s => dayjs(`${s.date}T${s.start_time}`).toISOString());

  const relevantTimeOffs = vendorTimeOffs
    ?.map(timeOff => {
      const timeOffStartDate = timeOff.start_date || timeOff.date;
      const timeOffEndDate = timeOff.end_date || timeOff.date;
      const startDateObj = dayjs(timeOffStartDate);
      const endDateObj = dayjs(timeOffEndDate);

      const isDateInRange = currentDateObj.isSameOrAfter(startDateObj, 'day') &&
        currentDateObj.isSameOrBefore(endDateObj, 'day');

      if (!isDateInRange) return null;

      const isSingleDay = startDateObj.isSame(endDateObj, 'day');
      const isStartDay = currentDateObj.isSame(startDateObj, 'day');
      const isEndDay = currentDateObj.isSame(endDateObj, 'day');

      if (isSingleDay) {
        return { start: dayjs(`${date}T${timeOff.start_time}`), end: dayjs(`${date}T${timeOff.end_time}`) };
      } else if (isStartDay && isEndDay) {
        return { start: dayjs(`${date}T${timeOff.start_time}`), end: dayjs(`${date}T${timeOff.end_time}`) };
      } else if (isStartDay) {
        return { start: dayjs(`${date}T${timeOff.start_time}`), end: null, type: 'start' };
      } else if (isEndDay) {
        return { start: null, end: dayjs(`${date}T${timeOff.end_time}`), type: 'end' };
      } else {
        return { type: 'full' };
      }
    })
    .filter(Boolean);

  const relevantCalendarEvents = calendarEvents
    ?.filter(event => event && event.status !== 'cancelled' && dayjs(event.start).format('YYYY-MM-DD') === date)
    .map(e => ({ start: dayjs(e.start), end: dayjs(e.end) }));

  let current = start;

  while (current.isBefore(end)) {
    const next = current.add(interval, 'minute');
    const currentISO = current.toISOString();
    const nextISO = next.toISOString();

    const inBreak = breakStart && breakEnd && next.isAfter(breakStart) && current.isBefore(breakEnd);
    const isBooked = relevantBookedSlots.some(s => s.start === currentISO && s.end === nextISO);
    const isConflict = relevantOtherSlots.some(s => s === currentISO);

    const isTimeOff = relevantTimeOffs.some(timeOff => {
      if (!timeOff) return false;
      if (timeOff.type === 'full') return true;
      if (timeOff.type === 'start') return current.isSameOrAfter(timeOff.start);
      if (timeOff.type === 'end') return current.isBefore(timeOff.end);
      return (
        (current.isSameOrAfter(timeOff.start) && current.isBefore(timeOff.end)) ||
        (next.isAfter(timeOff.start) && next.isSameOrBefore(timeOff.end)) ||
        (current.isBefore(timeOff.start) && next.isAfter(timeOff.end))
      );
    });

    const isCalendarEvent = relevantCalendarEvents.some(event => {
      return (
        (current.isSameOrAfter(event.start) && current.isBefore(event.end)) ||
        (next.isAfter(event.start) && next.isSameOrBefore(event.end)) ||
        (current.isBefore(event.start) && next.isAfter(event.end))
      );
    });

    if (!inBreak && !isBooked && !isConflict && !isTimeOff && !isCalendarEvent) {
      slots.push({
        id: currentISO,
        start: currentISO,
        end: nextISO,
        title: 'Available',
        className: 'slot-available',
        vendor_id: vendorId,
      });
    }

    current = next;
  }

  return slots;
}

function generateAllDaySlots(date: string, interval = 15): Slots[] {
  const slots: Slots[] = [];
  const start = dayjs(`${date}T00:00:00`);
  const end = dayjs(`${date}T24:00:00`);
  let current = start;

  while (current.isBefore(end)) {
    const next = current.add(interval, 'minute');
    slots.push({
      start: current.toISOString(),
      end: next.toISOString(),
      title: '',
      className: 'slot-unavailable',
    });
    current = next;
  }

  return slots;
}

export function getDistanceColor(distance: number | undefined): string {
  if (distance === undefined || distance === null) return "#CCCCCC";
  if (distance === 0) return "#2BC6FF";
  if (distance <= 15) return "#FD7DFF";
  if (distance <= 30) return "#E8B611";
  if (distance <= 45) return "#E2F202";
  if (distance <= 60) return "#9900A7";
  return "#171484";
}

export default function OneDayCalendar({
  setSelectedDate,
  selectedVendors,
  service,
  showAllVendorsMap,
  scheduleOverrideMap,
  recommendTimeMap,
  calendarIdx,
  vendorDistances,
  propertyTimezone,
  masterDate,
  selectedListingId,
  currentOrderId
}: CalendarProps) {
  const {
    selectedSlots,
    setSelectedSlots,
  } = useOrderContext();

  const [vendorsData, setVendorsData] = useState<VendorData[]>([]);
  const [ordersData, setOrdersData] = useState<Order[]>([]);
  const [destinationAddress, setDestinationAddress] = useState<string>('');

  const vendorsStringified = useMemo(() => JSON.stringify(selectedVendors), [selectedVendors]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    GetVendors(token).then(data => setVendorsData(data.data));
    Get(token).then(data => setOrdersData(data.data));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !selectedListingId) return;

    GetOneListing(selectedListingId)
      .then(data => setDestinationAddress(data.data.address))
      .catch(err => console.error(err.message));
  }, [selectedListingId]);

  const existingSlot = selectedSlots.find((s: Slot) => s.service_id === service.uuid);
  const initialDateStr = existingSlot ? existingSlot.date : dayjs().format('YYYY-MM-DD');

  const [events, setEvents] = useState<Slots[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(initialDateStr);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [clickedSlot, setClickedSlot] = useState<{ start: string; end: string } | null>(null);
  const [availableSlotVendors, setAvailableSlotVendors] = useState<VendorData[]>([]);
  const [twilightData, setTwilightData] = useState<TwilightResponse | null>(null);

  const calendarRef = useRef<FullCalendar>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasJumpedToInitialDate = useRef(false);
  const hasScrolledToFirstSlot = useRef(false);
  const lastMasterDateStr = useRef(dayjs(masterDate).format('YYYY-MM-DD'));

  useEffect(() => {
    if (existingSlot && !hasJumpedToInitialDate.current && calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(existingSlot.date);
      setCurrentDate(existingSlot.date);
      hasJumpedToInitialDate.current = true;
    }
  }, [existingSlot]);

  useEffect(() => {
    const formattedDate = dayjs(masterDate).format('YYYY-MM-DD');
    if (formattedDate === lastMasterDateStr.current) return;

    lastMasterDateStr.current = formattedDate;

    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      setTimeout(() => {
        calendarApi.gotoDate(formattedDate);
        setCurrentDate(formattedDate);
        setSelectedDate(formattedDate);
      }, 0);
    }
  }, [masterDate, setSelectedDate]);

  const AllBookedSlots = useMemo(() => {
    return ordersData?.filter((order: Order) => order.uuid !== currentOrderId)
      .flatMap((order: Order) => order.slots || []) || [];
  }, [ordersData, currentOrderId]);

  useEffect(() => {
    const date = currentDate;
    const filteredVendors = vendorsData.filter(
      (vendor) => vendor.uuid && selectedVendors?.includes(vendor.uuid)
    );

    if (filteredVendors.length === 0) {
      setEvents([]);
      return;
    }

    const fullDaySlots = generateAllDaySlots(date, 15);
    const availableSlotMap = new Map<string, Slots>();

    const otherServiceSlots = selectedSlots.filter((s: Slot) =>
      s.service_id !== (service.service?.uuid || service.uuid) && s.date === date
    );

    filteredVendors.forEach((vendor) => {
      if (!vendor.work_hours) return;

      const vendorTimezone = vendor.work_hours.timezone || 'America/Vancouver';
      const targetTimezone = propertyTimezone || 'America/Vancouver';

      const convertedWorkHours = convertVendorWorkHoursToPropertyTimezone(
        currentDate,
        vendor.work_hours,
        vendorTimezone,
        targetTimezone
      );

      const vendorSlots = generateMarkedSlots(
        currentDate,
        convertedWorkHours,
        vendor.uuid ?? '',
        AllBookedSlots,
        otherServiceSlots as unknown as MinimalSlot[],
        vendor.additional_breaks || [],
        vendor.calendar_events || [],
        15
      );
      vendorSlots.forEach((slot) => {
        const key = `${slot.start}_${slot.end}`;
        availableSlotMap.set(key, { ...slot, className: 'slot-available' });
      });
    });

    let firstAvailableFound = false;
    const finalSlots = fullDaySlots.map((slot) => {
      const key = `${slot.start}_${slot.end}`;
      const matchedAvailable = availableSlotMap.get(key);

      if (matchedAvailable) {
        let isFirstAvailable = false;
        if (recommendTimeMap[calendarIdx] === 1 && !firstAvailableFound) {
          firstAvailableFound = true;
          isFirstAvailable = true;
        }

        const matchingSelected = selectedSlots.find(
          (s: Slot) =>
            s.service_id === service.uuid &&
            dayjs(`${s.date}T${s.start_time}`).toISOString() === slot.start &&
            dayjs(`${s.date}T${s.end_time}`).toISOString() === slot.end
        );

        if (matchingSelected) {
          const vendorId = matchingSelected.vendor_id || matchingSelected.vendor?.uuid;
          const matchedVendor = vendorsData.find(v => v.uuid === vendorId);
          const vendorName = matchedVendor ? `${matchedVendor.first_name} ${matchedVendor.last_name}` : 'Unknown Vendor';

          return {
            ...matchedAvailable,
            title: `${vendorName}\n${service.title || service.service?.name}`,
            className: `slot-selected vendor-${vendorId}${isFirstAvailable ? ' slot-recommended' : ''}`
          };
        }

        if (isFirstAvailable) {
          return {
            ...matchedAvailable,
            title: 'Recommended',
            className: 'slot-available slot-recommended'
          };
        }

        return matchedAvailable;
      }

      return { ...slot, title: 'Unavailable', className: 'slot-unavailable' };
    });

    setEvents(finalSlots);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorsData, currentDate, JSON.stringify(selectedVendors), selectedSlots, service.title, service.uuid, AllBookedSlots, propertyTimezone, recommendTimeMap, calendarIdx]);

  useEffect(() => {
    async function loadTwilight() {
      if (!destinationAddress) return;
      const result = await fetchTwilightTime(destinationAddress, currentDate);
      if (result) setTwilightData(result);
    }
    loadTwilight();
  }, [destinationAddress, currentDate]);

  const formatLocalTime = (utcTime: string) => {
    if (!utcTime) return "—";
    const timeZone = propertyTimezone || "America/Vancouver";
    try {
      const date = new Date(utcTime);
      return date.toLocaleTimeString("en-CA", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return "Invalid time";
    }
  };

  useEffect(() => {
    if (!containerRef.current || events.length === 0) return;

    if (!hasScrolledToFirstSlot.current) {
      let targetSlot = null;
      const selectedSlot = events.find(event => event.className?.includes('slot-selected'));

      if (selectedSlot) {
        targetSlot = selectedSlot;
      } else {
        targetSlot = events.find(event => event.className === 'slot-available');
      }

      if (targetSlot) {
        const slotStartTime = dayjs(targetSlot.start);
        const startOfDay = slotStartTime.startOf('day');
        const minutesFromMidnight = slotStartTime.diff(startOfDay, 'minute');
        const pixelsPerMinute = 42 / 15;
        const scrollPosition = minutesFromMidnight * pixelsPerMinute;

        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTo({
              top: Math.max(0, scrollPosition - 134),
              behavior: 'smooth'
            });
            hasScrolledToFirstSlot.current = true;
          }
        }, 200);
      }
    }
  }, [events]);

  const hasCheckedForNextAvailableDay = useRef(false);
  useEffect(() => {
    if (!calendarRef.current || events.length === 0) return;

    const hasAvailableSlots = events.some(event =>
      event.className === 'slot-available' || event.className?.includes('slot-available')
    );

    if (!hasAvailableSlots && !hasCheckedForNextAvailableDay.current) {
      hasCheckedForNextAvailableDay.current = true;

      const searchForNextAvailableDay = async () => {
        const filteredVendors = vendorsData.filter(v => v.uuid && selectedVendors?.includes(v.uuid));
        if (filteredVendors.length === 0) return;

        const otherServiceSlots = selectedSlots.filter(s => s.service_id !== service.uuid);

        for (let daysAhead = 1; daysAhead <= 30; daysAhead++) {
          const testDate = dayjs(currentDate).add(daysAhead, 'day').format('YYYY-MM-DD');
          const fullDaySlots = generateAllDaySlots(testDate, 15);
          const availableSlotMap = new Map<string, Slots>();

          filteredVendors.forEach((vendor) => {
            if (!vendor.work_hours) return;
            const convertedWorkHours = convertVendorWorkHoursToPropertyTimezone(
              testDate,
              vendor.work_hours,
              vendor.work_hours.timezone || 'America/Vancouver',
              propertyTimezone || 'America/Vancouver'
            );

            const vendorSlots = generateMarkedSlots(
              testDate,
              convertedWorkHours,
              vendor.uuid ?? '',
              AllBookedSlots,
              otherServiceSlots.filter(s => s.date === testDate) as unknown as MinimalSlot[],
              vendor.additional_breaks || [],
              vendor.calendar_events || [],
              15
            );

            vendorSlots.forEach(slot => {
              const key = `${slot.start}_${slot.end}`;
              availableSlotMap.set(key, slot);
            });
          });

          if (fullDaySlots.some(slot => availableSlotMap.has(`${slot.start}_${slot.end}`))) {
            const calendarApi = calendarRef.current?.getApi();
            if (calendarApi) {
              setTimeout(() => {
                calendarApi.gotoDate(testDate);
                setCurrentDate(testDate);
                setSelectedDate(testDate);
              }, 100);
            }
            break;
          }
        }
      };
      searchForNextAvailableDay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, vendorsData, vendorsStringified, currentDate, selectedSlots, service.uuid, AllBookedSlots, propertyTimezone, setSelectedDate]);

  useEffect(() => {
    hasScrolledToFirstSlot.current = false;
    hasCheckedForNextAvailableDay.current = false;
  }, [vendorsStringified]);

  function geocodeAddress(address: string): Promise<string> {
    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results) => {
        if (results && results[0]) resolve(results[0].formatted_address);
        else reject('Geocode failed');
      });
    });
  }

  async function calculateDistance(originInput: string, destinationInput: string): Promise<{ est_time: number; distance: number } | null> {
    try {
      const originResolved = await geocodeAddress(originInput.trim());
      const destinationResolved = await geocodeAddress(destinationInput.trim());
      const matrixService = new window.google.maps.DistanceMatrixService();

      return new Promise((resolve) => {
        matrixService.getDistanceMatrix({
          origins: [originResolved],
          destinations: [destinationResolved],
          travelMode: window.google.maps.TravelMode.DRIVING
        }, (response) => {
          const result = response?.rows?.[0]?.elements?.[0];
          if (result && result.status === 'OK') {
            resolve({ distance: result.distance.value / 1000, est_time: result.duration.value / 60 });
          } else resolve(null);
        });
      });
    } catch { return null; }
  }

  const onEventClick = async (info: EventClickArg) => {
    if (!info.event.start || !info.event.end) return;

    const slotStart = dayjs(info.event.start).format('HH:mm:ss');
    const slotEnd = dayjs(info.event.end).format('HH:mm:ss');
    const isoStart = info.event.start.toISOString();
    const isoEnd = info.event.end.toISOString();
    const dateStr = dayjs(info.event.start).format('YYYY-MM-DD');

    const isAlreadySelected = selectedSlots.find(
      s => s.service_id === service.uuid && s.start_time === slotStart && s.end_time === slotEnd && s.date === dateStr
    );

    if (isAlreadySelected) {
      setSelectedSlots(prev => prev.filter(s => !(s.service_id === service.uuid && s.start_time === slotStart && s.end_time === slotEnd && s.date === dateStr)));
      setEvents(prev => prev.map(e => (e.start === isoStart && e.end === isoEnd) ? { ...e, title: '', className: 'slot-available' } : e));
      return;
    }

    const matching = vendorsData.filter(v => {
      if (!v.uuid || !selectedVendors.includes(v.uuid) || !v.work_hours) return false;
      const converted = convertVendorWorkHoursToPropertyTimezone(dateStr, v.work_hours, v.work_hours.timezone || 'America/Vancouver', propertyTimezone || 'America/Vancouver');
      const avail = generateMarkedSlots(dateStr, converted, v.uuid, AllBookedSlots, selectedSlots.filter(s => s.service_id !== service.uuid && s.date === dateStr) as unknown as MinimalSlot[], v.additional_breaks || [], v.calendar_events || []);
      return avail.some(a => dayjs(a.start).isSame(isoStart) && dayjs(a.end).isSame(isoEnd));
    });

    if (matching.length === 1) handleAssignVendor(matching[0], { start: isoStart, end: isoEnd });
    else if (matching.length > 1) {
      setClickedSlot({ start: isoStart, end: isoEnd });
      setAvailableSlotVendors(matching);
      setShowVendorModal(true);
    }
  };

  const handleAssignVendor = async (vendor: VendorData, slot: { start: string; end: string }) => {
    const originAddr = vendor.addresses?.find(a => a.type === 'start_location');
    const origin = originAddr ? `${originAddr.address_line_1},${originAddr.city},${originAddr.province},${originAddr.country}` : '';
    const result = await calculateDistance(origin, destinationAddress);

    const vendorId = vendor.uuid || '';
    const vendorName = `${vendor.first_name} ${vendor.last_name}`;

    setEvents(prev => prev.map(e => (e.start === slot.start && e.end === slot.end) ? { ...e, title: `${vendorName}\n${service.title}`, className: `slot-selected vendor-${vendorId}` } : e));

    const newSlot = {
      service_id: service.uuid || '',
      vendor_id: vendorId,
      show_all_vendors: showAllVendorsMap[calendarIdx] ?? 0,
      schedule_override: scheduleOverrideMap[calendarIdx] ?? 0,
      recommend_time: recommendTimeMap[calendarIdx] ?? 0,
      travel: null,
      start_time: dayjs(slot.start).format('HH:mm:ss'),
      end_time: dayjs(slot.end).format('HH:mm:ss'),
      date: dayjs(slot.start).format('YYYY-MM-DD'),
      est_time: result?.est_time ?? null,
      distance: result?.distance ?? null,
      km_price: null,
    };
    setSelectedSlots(prev => [...prev, newSlot]);
    setShowVendorModal(false);
  };

  const vendorColorStyles = Object.entries(vendorDistances as Record<string, number>)
    .map(([uuid, distance]) => `.vendor-${uuid}::before { background-color: ${getDistanceColor(distance)} !important; }`)
    .join('\n');

  const customStyles = `
    ${vendorColorStyles}
    .slot-recommended:not(.slot-selected) { background-color: #B2FFB2 !important; }
    .recommended-corner-indicator {
      position: absolute; top: 0; right: 0; width: 0; height: 0;
      border-style: solid; border-width: 0 24px 24px 0; border-color: transparent #E8B611 transparent transparent;
      z-index: 10;
    }
    .recommended-corner-indicator svg { position: absolute; top: 2px; right: -22px; }
    .fc-header-toolbar {
      position: sticky !important; top: 0 !important; background: #EEEEEE !important;
      z-index: 10 !important; margin-bottom: 0 !important; padding: 10px 0; border-bottom: 1px solid #BBBBBB;
    }
  `;

  return (
    <>
      <div ref={containerRef} className="mt-[20px] relative custom-scroll" style={{
        border: selectedSlots.some(s => s.service_id === service.uuid) ? '3px solid #6bae41' : '2px solid #BBBBBB',
        borderRadius: '6px', maxHeight: 430, height: 430, overflowY: 'auto', width: '100%',
      }}>
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin]}
          initialView="timeGridDay"
          slotDuration="00:15:00"
          slotLabelInterval="00:15:00"
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          events={events}
          eventContent={(info) => {
            const isRecommended = info.event.classNames.includes('slot-recommended');
            return (
              <div className="fc-event-main-frame w-full h-full relative flex items-center justify-center">
                <div className="fc-event-title fc-sticky text-center" style={{ fontSize: '9px', color: '#424242' }}>{info.event.title}</div>
                {isRecommended && (
                  <div className="recommended-corner-indicator">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                )}
              </div>
            );
          }}
          height="auto"
          dayHeaders={false}
          eventClick={onEventClick}
          selectable={true}
          editable={true}
          initialDate={initialDateStr}
          headerToolbar={{ left: 'prev,next', center: 'title', right: '' }}
          titleFormat={{ weekday: 'short', day: 'numeric' }}
          datesSet={(arg) => {
            const date = dayjs(arg.start).format('YYYY-MM-DD');
            setCurrentDate(date); setSelectedDate(date);
          }}
        />

        {showVendorModal && clickedSlot && (
          <div onClick={() => setShowVendorModal(false)} className="sticky top-0 inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" style={{ height: '-webkit-fill-available' }}>
            <div onClick={e => e.stopPropagation()} className="bg-[#EEEEEE] rounded-lg p-4 w-[300px] shadow-lg">
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {availableSlotVendors.sort((a, b) => (vendorDistances[a.uuid ?? ''] ?? Infinity) - (vendorDistances[b.uuid ?? ''] ?? Infinity)).map(v => {
                  const travelTime = v.uuid ? vendorDistances[v.uuid] : undefined;
                  const color = getDistanceColor(travelTime);
                  const formatTravelTime = (sec: number) => {
                    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
                    return h > 0 ? `${h}h ${m}m` : `${m}m`;
                  };
                  return (
                    <li key={v.uuid} className="cursor-pointer p-2 flex items-center gap-1 hover:bg-gray-100" onClick={() => handleAssignVendor(v, clickedSlot)}>
                      <span style={{ backgroundColor: color }} className="h-[16px] w-[5px]"></span>
                      <span className="text-[14px] truncate">{v.first_name} {v.last_name}</span>
                      {travelTime !== undefined && <span className="text-gray-500 text-[12px] ml-auto">({formatTravelTime(travelTime)})</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
        <style>{customStyles}</style>
      </div>

      {twilightData && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md border border-[#EEEEEE]">
          <h4 className="text-sm font-[600] text-[#666666] mb-2">Twilight Times ({dayjs(currentDate).format('MMM D')})</h4>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div><span className="text-gray-500">Morning Civil:</span> {formatLocalTime(twilightData.civil_twilight_begin)}</div>
            <div><span className="text-gray-500">Evening Civil:</span> {formatLocalTime(twilightData.civil_twilight_end)}</div>
          </div>
        </div>
      )}
    </>
  );
}