'use client'
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import React, { useState, useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import { useParams } from 'next/navigation';
import dayjs from "dayjs";
import { SelectedService } from './Services';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { EventClickArg, DatesSetArg } from '@fullcalendar/core';
import { useOrderContext, Slot } from '../context/OrderContext';
import { VendorData } from '../[id]/page';
import { Order } from '../page';
import { convertVendorWorkHoursToPropertyTimezone, fetchTwilightTime, TwilightResponse, formatTwilightTime, convertUTCToTimezone } from '../orders';
import { toast } from 'sonner';
import { Services } from '../../services/page';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getEffectiveServiceDuration } from '../utils/serviceTimeUtils';
import { Loader2 } from 'lucide-react';
import ConfirmationDialog from '@/components/ConfirmationDialog';

declare global {
  interface Window {
    google: typeof google;
  }
}

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
  extendedProps?: {
    availableVendorIds?: string[];
  };
  [key: string]: string | undefined | { availableVendorIds?: string[] };
}
interface CalendarProps {
  selectedVendors: string[];
  service: SelectedService;
  recommendTime: number;
  showAllVendors: number;
  scheduleOverride: number;
  calendarIdx: number;
  serviceKey: string;
  showAllVendorsMap: Record<string, 0 | 1>;
  scheduleOverrideMap: Record<string, 0 | 1>;
  recommendTimeMap: Record<string, 0 | 1>;
  setSelectedDate: (date: string) => void;
  vendorDistances: Record<string, number>;
  propertyTimezone?: string;
  masterDate: Date;
  externalSetSelectedSlots?: Dispatch<SetStateAction<Slot[]>>;
  externalSelectedSlots?: Slot[];
  externalBookedSlots?: Slot[];
  externalVendorsData?: VendorData[];
  externalServicesData?: Services[];
  onVendorSelected?: (vendorId: string) => void;
  isCalculating?: boolean;
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

function isNextBookingSlotOnlyEnabled(vendor: VendorData): boolean {
  const value = vendor.settings?.next_booking_slot_only;
  return value === true || value === 1 || value === '1' || (typeof value === 'string' && value.toLowerCase() === 'true');
}

function getLatestBookedEndBoundary(date: string, vendorId: string, allBookedSlots: MinimalSlot[]): dayjs.Dayjs | null {
  const relevantBookedSlots = allBookedSlots
    ?.filter(s => (s?.vendor?.uuid || s?.vendor_id) === vendorId && s?.date === date)
    .map(s => dayjs(`${s.date}T${s.end_time}`)) || [];

  if (relevantBookedSlots.length === 0) {
    return null;
  }

  return relevantBookedSlots.reduce((latest, current) => current.isAfter(latest) ? current : latest);
}

function getVendorRequiredSlotStart(
  vendor: VendorData,
  date: string,
  allBookedSlots: MinimalSlot[],
  vendorAvailableSlots: Slots[]
): string | null {
  if (!isNextBookingSlotOnlyEnabled(vendor) || vendorAvailableSlots.length === 0) {
    return null;
  }

  const vendorId = vendor.uuid ?? '';
  if (!vendorId) {
    return null;
  }

  const latestBookedEnd = getLatestBookedEndBoundary(date, vendorId, allBookedSlots);
  const boundary = latestBookedEnd ?? dayjs(vendorAvailableSlots[0].start);
  const requiredSlot = vendorAvailableSlots.find(slot => !dayjs(slot.start).isBefore(boundary));

  return requiredSlot?.start ?? null;
}

function isFloorPlanService(
  serviceTitle: string | undefined,
  serviceUuid: string | undefined,
  serviceId: string | number | undefined,
  servicesData: Services[]
): boolean {
  const currentServiceData = servicesData.find(s => s.uuid === serviceUuid || String(s.id) === String(serviceId));
  const searchable = [
    serviceTitle || '',
    currentServiceData?.name || '',
    currentServiceData?.category?.name || ''
  ].join(' ').toLowerCase();

  return /2d\s*floor|2dfloor|floor\s*plan|floorplan/.test(searchable);
}

function getRestrictedDisplaySlots(
  vendor: VendorData,
  date: string,
  allBookedSlots: MinimalSlot[],
  vendorAvailableSlots: Slots[],
  requiredSlotsCount: number,
  shouldEnforceRule: boolean,
  currentServiceUuid?: string,
  selectedSlots?: Slot[]
): Slots[] {
  if (!shouldEnforceRule || !isNextBookingSlotOnlyEnabled(vendor) || vendorAvailableSlots.length === 0) {
    return vendorAvailableSlots;
  }

  const requiredSlotStart = getVendorRequiredSlotStart(vendor, date, allBookedSlots, vendorAvailableSlots);
  if (!requiredSlotStart) {
    return vendorAvailableSlots;
  }

  // Find currently selected slots for this vendor/service/date to ensure they're shown during edit
  const selectedSlotStarts = selectedSlots?.filter(s =>
    (s.vendor_id === vendor.uuid || s.vendor?.uuid === vendor.uuid) &&
    s.service_id === currentServiceUuid &&
    s.date === date
  ).map(s => dayjs(`${s.date}T${s.start_time}`).toISOString()) || [];

  const startIndex = vendorAvailableSlots.findIndex(slot => dayjs(slot.start).isSame(requiredSlotStart));

  const restrictedSlots: Slots[] = [];
  if (startIndex !== -1) {
    restrictedSlots.push(vendorAvailableSlots[startIndex]);
    for (let i = startIndex + 1; i < vendorAvailableSlots.length && restrictedSlots.length < requiredSlotsCount; i++) {
      const previous = restrictedSlots[restrictedSlots.length - 1];
      const current = vendorAvailableSlots[i];
      if (dayjs(current.start).isSame(dayjs(previous.end))) {
        restrictedSlots.push(current);
      } else {
        break;
      }
    }
  }

  // Include the restricted "next" slots PLUS any already "selected" slots for this order
  return vendorAvailableSlots.filter(slot =>
    restrictedSlots.some(rs => rs.start === slot.start) ||
    selectedSlotStarts.includes(slot.start)
  );
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

  // If vendor has work_days and is off today, return no slots
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

  // Pre-process breaks (global standard breaks)
  // These should already be converted to property timezone if coming from convertedWorkHours
  const breakStart = workHours.break_start ? dayjs(`${date}T${workHours.break_start}`) : null;
  const breakEnd = workHours.break_end ? dayjs(`${date}T${workHours.break_end}`) : null;

  // Pre-process allBookedSlots for current vendor and date
  const relevantBookedSlots = allBookedSlots
    ?.filter(s => (s?.vendor?.uuid || s?.vendor_id) === vendorId && s?.date === date)
    .map(s => ({
      start: dayjs(`${s.date}T${s.start_time}`),
      end: dayjs(`${s.date}T${s.end_time}`)
    })) || [];

  // Pre-process otherServiceSlots
  const relevantOtherSlots = otherServiceSlots
    ?.filter(s => (s?.vendor_id === vendorId || s?.vendor?.uuid === vendorId) && s?.date === date)
    .map(s => ({
      start: dayjs(`${s.date}T${s.start_time}`),
      end: dayjs(`${s.date}T${s.end_time}`)
    })) || [];

  // Pre-process vendorTimeOffs (additional_breaks)
  const relevantTimeOffs = vendorTimeOffs
    ?.map(timeOff => {
      const timeOffStartDate = timeOff.start_date || timeOff.date;
      const timeOffEndDate = timeOff.end_date || timeOff.date;
      const startDateObj = dayjs(timeOffStartDate);
      const endDateObj = dayjs(timeOffEndDate);

      const isDateInRange = currentDateObj.isSameOrAfter(startDateObj, 'day') &&
        currentDateObj.isSameOrBefore(endDateObj, 'day');

      if (!isDateInRange) return null;

      const isStartDay = currentDateObj.isSame(startDateObj, 'day');
      const isEndDay = currentDateObj.isSame(endDateObj, 'day');

      if (isStartDay && isEndDay) {
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

  // Pre-process calendarEvents
  const relevantCalendarEvents = calendarEvents
    ?.filter(event => event && event.status !== 'cancelled' && dayjs(event.start).format('YYYY-MM-DD') === date)
    .map(e => ({ start: dayjs(e.start), end: dayjs(e.end) }));

  let current = start;

  while (current.isBefore(end)) {
    const next = current.add(interval, 'minute');
    const currentISO = current.toISOString();
    const nextISO = next.toISOString();

    // Check against standard daily breaks
    const inBreak = breakStart && breakEnd && (
      (current.isSameOrAfter(breakStart) && current.isBefore(breakEnd)) ||
      (next.isAfter(breakStart) && next.isSameOrBefore(breakEnd)) ||
      (current.isBefore(breakStart) && next.isAfter(breakEnd))
    );

    const isBooked = relevantBookedSlots.some(s =>
      current.isSameOrAfter(s.start) && next.isSameOrBefore(s.end)
    );

    const isConflict = relevantOtherSlots.some(s =>
      current.isSameOrAfter(s.start) && next.isSameOrBefore(s.end)
    );

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

    // If the selected date is today, exclude slots whose start time has already passed
    const now = dayjs();
    const isToday = currentDateObj.isSame(now, 'day');
    const isPastTime = isToday && current.isBefore(now);

    if (!inBreak && !isBooked && !isConflict && !isTimeOff && !isCalendarEvent && !isPastTime) {
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

export default function OneDayCalendar({ setSelectedDate, selectedVendors, service, showAllVendorsMap, scheduleOverrideMap, recommendTimeMap, calendarIdx, serviceKey, vendorDistances, propertyTimezone, masterDate, externalSetSelectedSlots, externalSelectedSlots, externalBookedSlots, externalVendorsData, externalServicesData, onVendorSelected, isCalculating }: CalendarProps) {
  const {
    selectedSlots: contextSelectedSlots,
    setSelectedSlots: contextSetSelectedSlots,
    selectedServices,
    vendorsData: contextVendorsData,
    ordersData,
    selectedCurrentListing,
    tempPropertyData,
    servicesData: contextServicesData,
  } = useOrderContext();

  // Use external data if provided (for BookNow), otherwise use context
  const selectedSlots = externalSelectedSlots || contextSelectedSlots;
  const setSelectedSlots = externalSetSelectedSlots || contextSetSelectedSlots;
  const vendorsData = externalVendorsData || contextVendorsData;
  const servicesData = externalServicesData || contextServicesData;
  const { id } = useParams();

  const currentServiceForBorder = servicesData?.find((s) => s.uuid === service.uuid);
  const productOptionForBorder = currentServiceForBorder?.product_options?.find(
    (option) => option.uuid === service.option_id
  );
  const squareFootageForBorder = tempPropertyData?.square_footage || selectedCurrentListing?.square_footage;
  const requiredDurationForBorder = getEffectiveServiceDuration(
    productOptionForBorder?.service_duration,
    squareFootageForBorder
  );
  const requiredSlotsCountForBorder = Math.ceil(requiredDurationForBorder / 15);

  const hasSelectedSlotsForBorder = selectedSlots.some(s => s.service_id === service.uuid);
  const currentServiceSlotsCountForBorder = selectedSlots.filter(
    (slot: Slot) => slot.service_id === service.uuid
  ).length;
  const isUnderScheduled = hasSelectedSlotsForBorder && currentServiceSlotsCountForBorder < requiredSlotsCountForBorder;

  const existingSlot = selectedSlots.find((s: Slot) => s.service_id === service.uuid);
  const initialDateStr = existingSlot ? existingSlot.date : dayjs().format('YYYY-MM-DD');

  const [events, setEvents] = useState<Slots[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(initialDateStr);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [clickedSlot, setClickedSlot] = useState<{ start: string; end: string } | null>(null);
  const [availableSlotVendors, setAvailableSlotVendors] = useState<VendorData[]>([]);
  const [twilightData, setTwilightData] = useState<TwilightResponse | null>(null);
  const [showConfirmDayChange, setShowConfirmDayChange] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<any | null>(null);
  const [showAgain, setShowAgain] = useState(true);
  const [hoveredSlotStart, setHoveredSlotStart] = useState<string | null>(null);
  const calendarRef = React.useRef<FullCalendar>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hasJumpedToInitialDate = React.useRef(false);
  const hasScrolledToFirstSlot = React.useRef(false);
  const lastMasterDateStr = React.useRef(dayjs(masterDate).format('YYYY-MM-DD'));

  useEffect(() => {
    if (existingSlot && !hasJumpedToInitialDate.current && calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(existingSlot.date);
      setCurrentDate(existingSlot.date);
      hasJumpedToInitialDate.current = true;
    }
  }, [existingSlot]);

  // React to masterDate change
  useEffect(() => {
    const formattedDate = dayjs(masterDate).format('YYYY-MM-DD');
    if (formattedDate === lastMasterDateStr.current) return;

    lastMasterDateStr.current = formattedDate;

    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      // setTimeout to avoid flushSync warning during render
      setTimeout(() => {
        calendarApi.gotoDate(formattedDate);
        setCurrentDate(formattedDate);
        setSelectedDate(formattedDate);
      }, 0);
    }
  }, [masterDate, setSelectedDate]);

  useEffect(() => {
    const selectedServiceIds = selectedServices.map(s => s.uuid);
    setSelectedSlots((prev: Slot[]) =>
      prev.filter((slot: Slot) => selectedServiceIds.includes(slot.service_id))
    );
  }, [selectedServices, setSelectedSlots]);

  const destinationAddress = selectedCurrentListing
    ? `${selectedCurrentListing.address},${selectedCurrentListing.city},${selectedCurrentListing.country}`
    : tempPropertyData
      ? `${tempPropertyData.address},${tempPropertyData.city},${tempPropertyData.country}`
      : '';

  const orderIdParam = Array.isArray(id) ? id[0] : id;

  const AllBookedSlots = useMemo(() => {
    if (externalBookedSlots) {
      return externalBookedSlots;
    }
    return ordersData?.filter((order: Order) => order.uuid !== orderIdParam).map((order: Order) => order.slots).flat() || [];
  }, [ordersData, orderIdParam, externalBookedSlots]);

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
    // Track vendors available for each slot
    const slotVendorsMap = new Map<string, string[]>();

    const otherServiceSlots = selectedSlots.filter((s: Slot) =>
      s.service_id !== service.uuid && s.date === date
    );

    // Check if this service does not require travel (full-day availability regardless of work hours)
    const currentServiceDataForSlots = servicesData.find(s => s.uuid === service.uuid || String(s.id) === String(service.id));
    const isNoTravelRequired = currentServiceDataForSlots?.is_travel_required === false;
    const squareFootageForSlots = tempPropertyData?.square_footage || selectedCurrentListing?.square_footage;
    const productOptionForSlots = currentServiceDataForSlots?.product_options?.find((option) => option.uuid === service.option_id);
    const requiredDurationForSlots = getEffectiveServiceDuration(
      productOptionForSlots?.service_duration,
      squareFootageForSlots
    );
    const requiredSlotsCountForService = Math.max(1, Math.ceil(requiredDurationForSlots / 15));
    const isFloorPlan = isFloorPlanService(service.title, service.uuid, service.id, servicesData);

    filteredVendors.forEach((vendor) => {
      const vendorId = vendor.uuid ?? '';
      if (!vendorId) return;

      const vendorHasNextBookingFlag = isNextBookingSlotOnlyEnabled(vendor);
      const shouldEnforceForVendor = isFloorPlan
        ? vendorHasNextBookingFlag
        : true;

      // Full-day bypass: skip it if this is a floor plan + vendor has next booking slot only
      const useFullDay = (scheduleOverrideMap[serviceKey] === 1 || isNoTravelRequired)
                         && !(isFloorPlan && vendorHasNextBookingFlag);

      if (useFullDay) {
        // Create 24h work hours
        const fullDayWorkHours: WorkHours = {
          start_time: '00:00:00',
          end_time: '23:59:59',
          timezone: propertyTimezone || 'America/Vancouver', // Use property timezone to ensure 00-24 coverage in local time
          work_days: [
            {
              day: dayjs(currentDate).format('ddd').toLowerCase(),
              start_time: '00:00:00',
              end_time: '23:59:59',
              is_off: 0,
              is_twilight: 0
            }
          ]
        };

        // We don't need to convert timezone because we are forcing it to match property timezone
        // directly to cover the full day in the displayed calendar
        const convertedWorkHours = fullDayWorkHours;

        const vendorSlots = generateMarkedSlots(
          currentDate,
          convertedWorkHours,
          vendorId,
          AllBookedSlots,
          otherServiceSlots,
          [], // Ignore breaks/timeoffs for no-travel / schedule override
          [], // Ignore calendar events for no-travel / schedule override
          15
        );

        const slotsToExpose = getRestrictedDisplaySlots(
          vendor,
          currentDate,
          AllBookedSlots,
          vendorSlots,
          requiredSlotsCountForService,
          shouldEnforceForVendor,
          service.uuid,
          selectedSlots
        );

        slotsToExpose.forEach((slot) => {
          const key = `${slot.start}_${slot.end}`;
          if (!slotVendorsMap.has(key)) {
            slotVendorsMap.set(key, []);
          }
          slotVendorsMap.get(key)!.push(vendorId);
        });

      } else {
        // NORMAL LOGIC
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
          vendorId,
          AllBookedSlots,
          otherServiceSlots,
          vendor.additional_breaks || [],
          vendor.calendar_events || [],
          15
        );
        const slotsToExpose = getRestrictedDisplaySlots(
          vendor,
          currentDate,
          AllBookedSlots,
          vendorSlots,
          requiredSlotsCountForService,
          shouldEnforceForVendor,
          service.uuid,
          selectedSlots
        );

        slotsToExpose.forEach((slot) => {
          const key = `${slot.start}_${slot.end}`;
          if (!slotVendorsMap.has(key)) {
            slotVendorsMap.set(key, []);
          }
          slotVendorsMap.get(key)!.push(vendorId);
        });
      }
    });
    let availableSlotsCount = 0;
    const finalSlots = fullDaySlots.map((slot) => {
      const key = `${slot.start}_${slot.end}`;
      const availableVendorIds = slotVendorsMap.get(key) || [];

      // Check if this is a Twilight service and filter slots based on twilight time
      let isTwilightRestricted = false;
      const currentServiceData = servicesData.find(s => s.uuid === service.uuid || String(s.id) === String(service.id));

      if (currentServiceData?.category?.name === "Twilight Photos" && twilightData?.sunset) {
        const targetTimezone = propertyTimezone || 'America/Vancouver';
        const sunsetLocalTimeStr = convertUTCToTimezone(twilightData.sunset, targetTimezone);

        const twilightTime = dayjs(`${date}T${sunsetLocalTimeStr}`);
        const allowedStartTime = twilightTime.subtract(30, 'minute');
        const slotStartTime = dayjs(slot.start);

        if (slotStartTime.isBefore(allowedStartTime)) {
          isTwilightRestricted = true;
        }
      }

      // Check if this slot is already selected for the current service/order
      const matchingSelected = selectedSlots.find(s => {
        const sidMatch = s.service_id === service.uuid || String(s.service_id) === String(service.id);
        const dateMatch = s.date === date;
        const sStart = dayjs(`${s.date} ${s.start_time}`);
        const sEnd = dayjs(`${s.date} ${s.end_time}`);
        const slotStart = dayjs(slot.start);
        const slotEnd = dayjs(slot.end);
        
        return sidMatch && dateMatch && 
               sStart.isSame(slotStart, 'minute') && 
               sEnd.isSame(slotEnd, 'minute');
      });

      if (matchingSelected) {
        const vendorId = matchingSelected.vendor?.uuid || matchingSelected.vendor_id;
        const matchedVendor = vendorsData.find(v => v.uuid === vendorId);
        const vendorName = matchedVendor ? `${matchedVendor.first_name} ${matchedVendor.last_name}` : 'Unknown';
        
        // Even for selected slots, we check if it happens to be in a recommended window
        const isTwilightService = currentServiceData?.category?.name === "Twilight Photos" || service?.title?.includes("Twilight");
        let isRecommended = false;
        if (isTwilightService || recommendTimeMap[serviceKey] === 1) {
           isRecommended = availableVendorIds.length > 0 && !isTwilightRestricted;
        }

        return {
          ...slot,
          title: `${vendorName}\n${service.title}`,
          className: `slot-selected vendor-${vendorId}${isRecommended ? ' slot-recommended' : ''}`,
          extendedProps: { 
            availableVendorIds: [], 
            twilightRecommended: isTwilightService && isRecommended 
          },
        };
      }

      if (availableVendorIds.length > 0 && !isTwilightRestricted) {
        let isRecommended = false;
        const isTwilightService = currentServiceData?.category?.name === "Twilight Photos" || service?.title?.includes("Twilight");

        let maxRecommended = 1;

        if (isTwilightService) {
          const productOption = currentServiceData?.product_options?.find(
            (option) => option.uuid === service.option_id
          );
          const squareFootage = tempPropertyData?.square_footage || selectedCurrentListing?.square_footage;
          const requiredDuration = getEffectiveServiceDuration(
            productOption?.service_duration,
            squareFootage
          );
          maxRecommended = Math.ceil(requiredDuration / 15);
        }

        if (availableSlotsCount < maxRecommended && (recommendTimeMap[serviceKey] === 1 || isTwilightService)) {
          isRecommended = true;
          availableSlotsCount++;
        }

        if (isRecommended) {
          return {
            ...slot,
            title: 'Recommended',
            className: 'slot-available slot-recommended',
            extendedProps: {
              availableVendorIds,
              twilightRecommended: isTwilightService
            }
          };
        }

        return {
          ...slot,
          title: '',
          className: 'slot-available',
          extendedProps: {
            availableVendorIds
          }
        };
      }

      return { ...slot, title: 'Unavailable', className: 'slot-unavailable', extendedProps: { availableVendorIds: [] } };
    });

    setEvents(finalSlots);
  }, [vendorsData, ordersData, currentDate, selectedVendors, selectedSlots, service.title, service.uuid, service.id, service.option_id, AllBookedSlots, propertyTimezone, recommendTimeMap, serviceKey, scheduleOverrideMap, twilightData, servicesData, tempPropertyData, selectedCurrentListing]);

  useEffect(() => {
    async function loadTwilight() {
      if (!selectedCurrentListing && !tempPropertyData) return;
      const address = selectedCurrentListing
        ? `${selectedCurrentListing.address}, ${selectedCurrentListing.city}, ${selectedCurrentListing.country}`
        : `${tempPropertyData?.address}, ${tempPropertyData?.city}, ${tempPropertyData?.country}`;
      const result = await fetchTwilightTime(address, currentDate);
      if (result) setTwilightData(result);
    }
    loadTwilight();
  }, [selectedCurrentListing, tempPropertyData, currentDate]);



  useEffect(() => {
    if (!containerRef.current || events.length === 0) return;

    if (!hasScrolledToFirstSlot.current) {
      setTimeout(() => {
        if (!containerRef.current) return;

        // Try to find the element in the DOM
        // Priority: Selected > Recommended > Available
        let targetEl = containerRef.current.querySelector('.slot-selected');

        if (!targetEl) {
          targetEl = containerRef.current.querySelector('.slot-recommended');
        }

        if (!targetEl) {
          targetEl = containerRef.current.querySelector('.slot-available');
        }

        if (targetEl instanceof HTMLElement) {

          const containerRect = containerRef.current.getBoundingClientRect();
          const targetRect = targetEl.getBoundingClientRect();

          const relativeTop = targetRect.top - containerRect.top + containerRef.current.scrollTop;

          const oneThirdHeight = containerRect.height / 3;
          const scrollTo = Math.max(0, relativeTop - oneThirdHeight);

          containerRef.current.scrollTo({
            top: scrollTo,
            behavior: 'smooth'
          });

          hasScrolledToFirstSlot.current = true;
        }
      }, 500);
    }
  }, [events]);

  const hasCheckedForNextAvailableDay = React.useRef(false);
  useEffect(() => {
    if (!calendarRef.current || events.length === 0) return;

    // If the user already selected slots for this service on the current day,
    // do not auto-jump to another day just because no more available slots remain.
    const hasCurrentDaySelection = selectedSlots.some(
      (slot: Slot) => slot.service_id === service.uuid && slot.date === currentDate
    );
    if (hasCurrentDaySelection) return;

    const hasAvailableSlots = events.some(event =>
      event.className === 'slot-available' ||
      event.className?.includes('slot-available')
    );

    if (!hasAvailableSlots && !hasCheckedForNextAvailableDay.current) {
      hasCheckedForNextAvailableDay.current = true;

      const searchForNextAvailableDay = async () => {
        const filteredVendors = vendorsData.filter(
          (vendor) => vendor.uuid && selectedVendors?.includes(vendor.uuid)
        );

        if (filteredVendors.length === 0) return;

        const otherServiceSlots = selectedSlots.filter((s: Slot) =>
          s.service_id !== service.uuid
        );

        // Check if this is a no-travel service for next-day search
        const serviceDataForSearch = servicesData.find(s => s.uuid === service.uuid || String(s.id) === String(service.id));
        const isNoTravelSearch = serviceDataForSearch?.is_travel_required === false;
        const isFloorPlanSearch = isFloorPlanService(service.title, service.uuid, service.id, servicesData);

        for (let daysAhead = 1; daysAhead <= 30; daysAhead++) {
          const testDate = dayjs(currentDate).add(daysAhead, 'day').format('YYYY-MM-DD');
          const fullDaySlots = generateAllDaySlots(testDate, 15);
          const availableSlotMap = new Map<string, Slots>();

          filteredVendors.forEach((vendor) => {
            const vendorHasNextBookingFlag = isNextBookingSlotOnlyEnabled(vendor);
            const useFullDaySearch = isNoTravelSearch && !(isFloorPlanSearch && vendorHasNextBookingFlag);

            if (useFullDaySearch) {
              // No-Travel: use full-day work hours, only booked slots are blocked
              const fullDayWorkHours: WorkHours = {
                start_time: '00:00:00',
                end_time: '23:59:59',
                timezone: propertyTimezone || 'America/Vancouver',
                work_days: [{
                  day: dayjs(testDate).format('ddd').toLowerCase(),
                  start_time: '00:00:00',
                  end_time: '23:59:59',
                  is_off: 0,
                  is_twilight: 0
                }]
              };

              const vendorSlots = generateMarkedSlots(
                testDate,
                fullDayWorkHours,
                vendor.uuid ?? '',
                AllBookedSlots,
                otherServiceSlots.filter(s => s.date === testDate),
                [],
                [],
                15
              );

              vendorSlots.forEach((slot) => {
                const key = `${slot.start}_${slot.end}`;
                availableSlotMap.set(key, slot);
              });
              return;
            }

            if (!vendor.work_hours) return;

            const vendorTimezone = vendor.work_hours.timezone || 'America/Vancouver';
            const targetTimezone = propertyTimezone || 'America/Vancouver';

            const convertedWorkHours = convertVendorWorkHoursToPropertyTimezone(
              testDate,
              vendor.work_hours,
              vendorTimezone,
              targetTimezone
            );

            const vendorSlots = generateMarkedSlots(
              testDate,
              convertedWorkHours,
              vendor.uuid ?? '',
              AllBookedSlots,
              otherServiceSlots.filter(s => s.date === testDate),
              vendor.additional_breaks || [],
              vendor.calendar_events || [],
              15
            );

            vendorSlots.forEach((slot) => {
              const key = `${slot.start}_${slot.end}`;
              availableSlotMap.set(key, slot);
            });
          });

          // Check if this day has any available slots
          const hasSlots = fullDaySlots.some(slot => {
            const key = `${slot.start}_${slot.end}`;
            return availableSlotMap.has(key);
          });

          if (hasSlots) {
            // Found a day with available slots, navigate to it
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
  }, [events, vendorsData, selectedVendors, currentDate, selectedSlots, service.uuid, service.id, service.title, AllBookedSlots, propertyTimezone, setSelectedDate, servicesData]);

  const vendorsKey = JSON.stringify(selectedVendors);
  const recommendVal = recommendTimeMap?.[serviceKey];
  useEffect(() => {
    hasScrolledToFirstSlot.current = false;
    hasCheckedForNextAvailableDay.current = false; // Reset when vendors change
  }, [vendorsKey, recommendVal, currentDate]); // Reset when vendors, recommendation status, or date changes

  // ── Hover preview computation ──────────────────────────────────────────────
  // Determines which slots to highlight and whether the preview is valid
  // (i.e., enough consecutive available slots exist for the full service duration).
  const hoverPreviewSlots = useMemo(() => {
    if (!hoveredSlotStart) return { slots: [] as string[], isValid: false };

    const currentServiceForHover = servicesData?.find((s) => s.uuid === service.uuid);
    const productOptionForHover = currentServiceForHover?.product_options?.find(
      (opt) => opt.uuid === service.option_id
    );
    const squareFootageForHover =
      tempPropertyData?.square_footage || selectedCurrentListing?.square_footage;
    const requiredDurationForHover = getEffectiveServiceDuration(
      productOptionForHover?.service_duration,
      squareFootageForHover
    );
    const requiredSlotsForHover = Math.max(1, Math.ceil(requiredDurationForHover / 15));

    // Account for already-selected slots so the preview only shows remaining needed
    const alreadySelectedCount = selectedSlots.filter(
      (s: Slot) => s.service_id === service.uuid
    ).length;
    const remainingNeeded = Math.max(1, requiredSlotsForHover - alreadySelectedCount);

    const hoveredEvent = events.find((e) => e.start === hoveredSlotStart);
    if (!hoveredEvent || !hoveredEvent.className?.includes('slot-available')) {
      return { slots: [] as string[], isValid: false };
    }

    const preview: string[] = [];
    for (let i = 0; i < remainingNeeded; i++) {
      const slotStart = dayjs(hoveredSlotStart).add(i * 15, 'minute').toISOString();
      const candidate = events.find((e) => e.start === slotStart);
      if (!candidate || !candidate.className?.includes('slot-available')) break;
      preview.push(slotStart);
    }

    return {
      slots: preview,
      isValid: preview.length >= remainingNeeded,
    };
  }, [hoveredSlotStart, events, service.uuid, service.option_id, servicesData, tempPropertyData, selectedCurrentListing, selectedSlots]);


  const prevDateRef = React.useRef<string>(currentDate);
  const isFirstRender = React.useRef(true);


  const vendorsString = JSON.stringify(selectedVendors);
  const prevVendorsString = React.useRef(vendorsString);

  useEffect(() => {
    if (id) return;

    // Skip on first render to prevent clearing slots on component mount/remount
    if (isFirstRender.current) {
      console.log('OneDayCalendar: First render, skipping slot clear');
      isFirstRender.current = false;
      prevVendorsString.current = vendorsString;
      prevDateRef.current = currentDate;
      return;
    }

    const vendorsChanged = prevVendorsString.current !== vendorsString;
    const dateChanged = prevDateRef.current !== currentDate;

    if (vendorsChanged || dateChanged) {
      // We do NOT clear slots anymore based on user feedback.
      // Slots should persist even if view date or vendors list changes (e.g. via filter).
      // User must explicitly remove them.

      console.log('OneDayCalendar: Date or Vendors changed, preserving slots.', {
        vendorsChanged,
        dateChanged,
        prevVendors: prevVendorsString.current,
        newVendors: vendorsString,
        prevDate: prevDateRef.current,
        newDate: currentDate
      });
      // REMOVED CLEARING LOGIC
      // setSelectedSlots((prev: Slot[]) =>
      //    prev.filter((slot: Slot) => slot.service_id !== service.uuid)
      // );

      prevVendorsString.current = vendorsString;
      prevDateRef.current = currentDate;
    }
  }, [vendorsString, currentDate, id, setSelectedSlots, service.uuid]);


  function geocodeAddress(address: string): Promise<string> {
    const geocoder = new window.google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === "OK" && results && results[0]) {
          const formattedAddress = results[0].formatted_address;
          resolve(formattedAddress);
        } else {
          reject(`Geocode failed: ${status}`);
        }
      });
    });
  }

  function normalizeAddress(address: string): string {
    return address?.trim() || "";
  }

  async function calculateDistance(originInput: string, destinationInput: string): Promise<{ est_time: number; distance: number } | null> {
    try {
      if (!originInput || !destinationInput) {
        console.error("Origin or destination address is empty.");
        return null;
      }
      const originResolved = await geocodeAddress(normalizeAddress(originInput));
      const destinationResolved = await geocodeAddress(normalizeAddress(destinationInput));

      const service = new window.google.maps.DistanceMatrixService();

      return new Promise((resolve) => {
        service.getDistanceMatrix(
          {
            origins: [originResolved],
            destinations: [destinationResolved],
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (response: google.maps.DistanceMatrixResponse | null, status: google.maps.DistanceMatrixStatus) => {
            if (status !== "OK") {
              console.error("Distance Matrix failed:", status);
              resolve(null);
              return;
            }

            const result = response?.rows?.[0]?.elements?.[0];
            if (!result || result.status !== "OK") {
              console.error("Invalid element in Distance Matrix:", result);
              resolve(null);
              return;
            }

            const distance = result.distance.value / 1000;
            const est_time = result.duration.value / 60;

            resolve({ est_time, distance });
          }
        );
      });
    } catch (err) {
      console.error("Error:", err);
      return null;
    }
  }

  // ── Hover preview handlers ─────────────────────────────────────────────────
  const onEventMouseEnter = (info: { event: { start: Date | null } }) => {
    if (info.event.start) {
      setHoveredSlotStart(info.event.start.toISOString());
    }
  };

  const onEventMouseLeave = () => {
    setHoveredSlotStart(null);
  };

  const onEventClick = async (info: EventClickArg, forceProceed = false) => {
    if (!info.event.start || !info.event.end) return;

    const clicked = {
      start: info.event.start.toISOString(),
      end: info.event.end.toISOString(),
    };
    const slotStart = dayjs(info.event.start).format('HH:mm:ss');
    const slotEnd = dayjs(info.event.end).format('HH:mm:ss');
    const selectedDate = dayjs(info.event.start).format('YYYY-MM-DD');

    // SERVICE DURATION VALIDATION
    // Get the service duration (either defined or calculated from square footage)
    const currentService = servicesData?.find((s) => s.uuid === service.uuid);
    const productOption = currentService?.product_options?.find(
      (option) => option.uuid === service.option_id
    );
    const squareFootage = tempPropertyData?.square_footage || selectedCurrentListing?.square_footage;
    const requiredDuration = getEffectiveServiceDuration(
      productOption?.service_duration,
      squareFootage
    );
    const requiredSlots = Math.ceil(requiredDuration / 15);

    const isAlreadySelected = selectedSlots.find(
      (slot: Slot) =>
        slot.service_id === service.uuid &&
        slot.start_time === slotStart &&
        slot.end_time === slotEnd &&
        slot.date === selectedDate
    );

    if (!forceProceed && !isAlreadySelected) {
      const existingSlots = selectedSlots.filter((slot: Slot) => slot.service_id === service.uuid);
      const hasDifferentDate = existingSlots.some((slot: Slot) => slot.date !== selectedDate);
      if (hasDifferentDate) {
        setPendingSelection(info);
        setShowConfirmDayChange(true);
        return;
      }
    }

    if (isAlreadySelected) {
      // Get all selected slots for this service on this date, sorted by time
      const serviceSlotsForDate = selectedSlots
        .filter((slot: Slot) => slot.service_id === service.uuid && slot.date === selectedDate)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      // If only one slot, allow deselection
      if (serviceSlotsForDate.length === 1) {
        setSelectedSlots((prev: Slot[]) =>
          prev.filter(
            (slot: Slot) =>
              !(
                slot.service_id === service.uuid &&
                slot.start_time === slotStart &&
                slot.end_time === slotEnd &&
                slot.date === selectedDate
              )
          )
        );

        const updatedEvents = events.map((event: Slots) => {
          if (
            dayjs(event.start).isSame(clicked.start) &&
            dayjs(event.end).isSame(clicked.end)
          ) {
            return {
              ...event,
              title: '',
              className: `slot-available`,
            };
          }
          return event;
        });

        setEvents(updatedEvents);

        // Show unselect toast
        const formatTime = (time: string) => {
          const [h, m] = time.split(":");
          const hour = parseInt(h);
          const meridian = hour >= 12 ? "PM" : "AM";
          const formattedHour = hour % 12 || 12;
          return `${formattedHour}:${m} ${meridian}`;
        };
        const slotTimeRange = `${formatTime(slotStart)} - ${formatTime(slotEnd)}`;
        const deficit = requiredSlots - 0;
        if (deficit > 0) {
          toast.warning(`You have unselected a slot from ${slotTimeRange} and have ${deficit} less slot${deficit > 1 ? 's' : ''}. Please select ${deficit === 1 ? 'one' : deficit} more slot${deficit > 1 ? 's' : ''}.`);
        }

        return;
      }

      // Multiple slots: only allow deselection from start or end
      const firstSlot = serviceSlotsForDate[0];
      const lastSlot = serviceSlotsForDate[serviceSlotsForDate.length - 1];

      const isFirstSlot = slotStart === firstSlot.start_time && slotEnd === firstSlot.end_time;
      const isLastSlot = slotStart === lastSlot.start_time && slotEnd === lastSlot.end_time;

      if (!isFirstSlot && !isLastSlot) {
        // Prevent deselection of middle slots
        toast.error('You can only remove slots from the start or end of your booking. Please unselect the first or last slot.');
        return;
      }

      // Allow deselection
      setSelectedSlots((prev: Slot[]) =>
        prev.filter(
          (slot: Slot) =>
            !(
              slot.service_id === service.uuid &&
              slot.start_time === slotStart &&
              slot.end_time === slotEnd &&
              slot.date === selectedDate
            )
        )
      );

      const updatedEvents = events.map((event: Slots) => {
        if (
          dayjs(event.start).isSame(clicked.start) &&
          dayjs(event.end).isSame(clicked.end)
        ) {
          return {
            ...event,
            title: '',
            className: `slot-available`,
          };
        }
        return event;
      });

      setEvents(updatedEvents);

      // Show unselect toast
      const formatTime = (time: string) => {
        const [h, m] = time.split(":");
        const hour = parseInt(h);
        const meridian = hour >= 12 ? "PM" : "AM";
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${m} ${meridian}`;
      };
      const slotTimeRange = `${formatTime(slotStart)} - ${formatTime(slotEnd)}`;
      const deficit = requiredSlots - (serviceSlotsForDate.length - 1);
      if (deficit > 0) {
        toast.warning(`You have unselected a slot from ${slotTimeRange} and have ${deficit} less slot${deficit > 1 ? 's' : ''}. Please select ${deficit === 1 ? 'one' : deficit} more slot${deficit > 1 ? 's' : ''}.`);
      }

      return;
    }

    const currentServiceSlots = selectedSlots.filter(
      (slot: Slot) => slot.service_id === service.uuid && slot.date === selectedDate
    );

    if (currentServiceSlots.length >= requiredSlots) {
      toast.warning(`You cannot select more than the required ${requiredDuration} minutes for "${service.title}".`);
      return;
    }

    // ── Gap validation ────────────────────────────────────────────────────────
    // If the user previously deselected a middle slot, existing selections may
    // have a gap. Block adding any new slot until the gap is resolved.
    if (currentServiceSlots.length > 0) {
      const sortedExisting = [...currentServiceSlots].sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
      );

      let hasGap = false;
      for (let i = 0; i < sortedExisting.length - 1; i++) {
        if (sortedExisting[i].end_time !== sortedExisting[i + 1].start_time) {
          hasGap = true;
          break;
        }
      }

      if (hasGap) {
        toast.error(
          `Your current slot selection for "${service.title}" has a gap. Please remove the isolated slot before adding a new one.`
        );
        return;
      }

      // ── Adjacency validation ────────────────────────────────────────────────
      // New slots must attach directly to the start or end of the existing block.
      const firstExisting = sortedExisting[0];
      const lastExisting = sortedExisting[sortedExisting.length - 1];
      const clickedStartTime = dayjs(clicked.start).format('HH:mm:ss');
      const clickedEndTime = dayjs(clicked.end).format('HH:mm:ss');

      const isAdjacentToEnd = clickedStartTime === lastExisting.end_time;
      const isAdjacentToStart = clickedEndTime === firstExisting.start_time;

      if (!isAdjacentToEnd && !isAdjacentToStart) {
        toast.error(
          `Slots must be consecutive. You can only add slots immediately before or after your existing selection for "${service.title}".`
        );
        return;
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    let remainingSlotsNeeded = requiredSlots - currentServiceSlots.length;

    // Determine the range of slots to select
    const slotsToSelect: { start: string; end: string }[] = [];

    // If we've already met the requirement, we just want to add 1 slot (the clicked one)
    if (remainingSlotsNeeded <= 0) {
      remainingSlotsNeeded = 1;
    }

    for (let i = 0; i < remainingSlotsNeeded; i++) {
      const start = dayjs(clicked.start).add(i * 15, 'minute').toISOString();
      const end = dayjs(clicked.start).add((i + 1) * 15, 'minute').toISOString();
      slotsToSelect.push({ start, end });
    }

    // Check for "sticky" vendor: if a vendor is already assigned to this service on this date,
    // and that vendor is available for ALL the current slots, auto-assign them.
    const assignedVendorId = currentServiceSlots.length > 0 ? currentServiceSlots[0].vendor_id : null;

    // Check if this is a no-travel service — if so, skip work-hours filtering
    const currentServiceDataForClick = servicesData.find(s => s.uuid === service.uuid || String(s.id) === String(service.id));
    const isNoTravelClick = currentServiceDataForClick?.is_travel_required === false;
    const isFloorPlanClick = isFloorPlanService(service.title, service.uuid, service.id, servicesData);

    const matching = vendorsData.filter(vendor => {
      if (!vendor.uuid || !selectedVendors.includes(vendor.uuid)) {
        return false;
      }

      const vendorHasNextBookingFlag = isNextBookingSlotOnlyEnabled(vendor);
      const shouldEnforceForVendor = isFloorPlanClick
        ? vendorHasNextBookingFlag
        : true;

      const useFullDayClick = isNoTravelClick && !(isFloorPlanClick && vendorHasNextBookingFlag);

      // For no-travel services (or if bypass is active), any vendor in the list is available for any slot
      // (only already-booked slots are excluded, which was already handled during event generation)
      if (useFullDayClick) {
        const fullDayWorkHours: WorkHours = {
          start_time: '00:00:00',
          end_time: '23:59:59',
          timezone: propertyTimezone || 'America/Vancouver',
          work_days: [
            {
              day: dayjs(selectedDate).format('ddd').toLowerCase(),
              start_time: '00:00:00',
              end_time: '23:59:59',
              is_off: 0,
              is_twilight: 0
            }
          ]
        };

        const vendorAvailableSlots = generateMarkedSlots(
          selectedDate,
          fullDayWorkHours,
          vendor.uuid ?? '',
          AllBookedSlots,
          selectedSlots.filter((s: Slot) => s.service_id !== service.uuid && s.date === selectedDate),
          [],
          [],
          15
        );

        const requiredSlotStart = shouldEnforceForVendor
          ? getVendorRequiredSlotStart(vendor, selectedDate, AllBookedSlots, vendorAvailableSlots)
          : null;
        if (requiredSlotStart && currentServiceSlots.length === 0 && !dayjs(slotsToSelect[0].start).isSame(requiredSlotStart)) {
          return false;
        }

        return slotsToSelect.every(slotToSelect =>
          vendorAvailableSlots.some(availableSlot =>
            dayjs(availableSlot.start).isSame(slotToSelect.start) &&
            dayjs(availableSlot.end).isSame(slotToSelect.end)
          )
        );
      }

      if (!vendor.work_hours) return false;

      // Convert vendor work hours to property timezone if needed
      const vendorTimezone = vendor.work_hours.timezone || 'America/Vancouver';
      const targetTimezone = propertyTimezone || 'America/Vancouver';
      const convertedWorkHours = convertVendorWorkHoursToPropertyTimezone(
        selectedDate,
        vendor.work_hours,
        vendorTimezone,
        targetTimezone
      );

      const vendorAvailableSlots = generateMarkedSlots(
        selectedDate,
        convertedWorkHours,
        vendor.uuid ?? '',
        AllBookedSlots,
        selectedSlots.filter((s: Slot) => s.service_id !== service.uuid && s.date === selectedDate),
        vendor.additional_breaks || [],
        vendor.calendar_events || [],
        15
      );

      const requiredSlotStart = shouldEnforceForVendor
        ? getVendorRequiredSlotStart(vendor, selectedDate, AllBookedSlots, vendorAvailableSlots)
        : null;
      if (requiredSlotStart && currentServiceSlots.length === 0 && !dayjs(slotsToSelect[0].start).isSame(requiredSlotStart)) {
        return false;
      }

      // Check if ALL slots in slotsToSelect are available for this vendor
      return slotsToSelect.every(slotToSelect =>
        vendorAvailableSlots.some(availableSlot =>
          dayjs(availableSlot.start).isSame(slotToSelect.start) &&
          dayjs(availableSlot.end).isSame(slotToSelect.end)
        )
      );
    });

    if (assignedVendorId) {
      const stickyVendor = matching.find(v => v.uuid === assignedVendorId);
      if (stickyVendor) {
        handleAssignVendor(stickyVendor, slotsToSelect);
        return;
      }
    }

    const vendorsInThisSlot = info.event.extendedProps?.availableVendorIds || [];
    const vendorsToCheck = vendorsInThisSlot.filter((id: string) => selectedVendors.includes(id));

    if (matching.length === 1) {
      handleAssignVendor(matching[0], slotsToSelect);
    } else if (matching.length > 1) {
      setClickedSlot(clicked);
      setAvailableSlotVendors(matching);
      setShowVendorModal(true);
    } else if (vendorsToCheck.length > 0) {
      const vendorNames = vendorsToCheck.map((id: string) => {
        const v = vendorsData.find(v => v.uuid === id);
        return v ? `${v.first_name} ${v.last_name || ''}`.trim() : null;
      }).filter(Boolean).join(', ');

      const restrictedVendor = vendorsData.find(v => {
        if (!v.uuid || !vendorsToCheck.includes(v.uuid)) return false;
        const vendorHasNextBookingFlag = isNextBookingSlotOnlyEnabled(v);
        const shouldEnforceForVendor = isFloorPlanClick ? vendorHasNextBookingFlag : true;
        return shouldEnforceForVendor && vendorHasNextBookingFlag;
      });

      if (restrictedVendor?.uuid && currentServiceSlots.length === 0) {
        const currentServiceData = servicesData.find(s => s.uuid === service.uuid || String(s.id) === String(service.id));
        const noTravel = currentServiceData?.is_travel_required === false || scheduleOverrideMap[serviceKey] === 1;
        if (!noTravel && !restrictedVendor.work_hours) {
          const durationTryingToSelect = remainingSlotsNeeded * 15;
          toast.error(`There are not ${durationTryingToSelect} min consecutive slots available for ${vendorNames} available at this time. Select another slots etc`);
          return;
        }

        const vendorAvailableSlotsForMessage = generateMarkedSlots(
          selectedDate,
          (() => {
            if (noTravel) {
              return {
                start_time: '00:00:00',
                end_time: '23:59:59',
                timezone: propertyTimezone || 'America/Vancouver',
                work_days: [{
                  day: dayjs(selectedDate).format('ddd').toLowerCase(),
                  start_time: '00:00:00',
                  end_time: '23:59:59',
                  is_off: 0,
                  is_twilight: 0
                }]
              } as WorkHours;
            }

            const vendorTimezone = restrictedVendor.work_hours?.timezone || 'America/Vancouver';
            const targetTimezone = propertyTimezone || 'America/Vancouver';
            return convertVendorWorkHoursToPropertyTimezone(
              selectedDate,
              restrictedVendor.work_hours,
              vendorTimezone,
              targetTimezone
            );
          })(),
          restrictedVendor.uuid,
          AllBookedSlots,
          selectedSlots.filter((s: Slot) => s.service_id !== service.uuid && s.date === selectedDate),
          restrictedVendor.additional_breaks || [],
          restrictedVendor.calendar_events || [],
          15
        );
        const requiredSlotStart = getVendorRequiredSlotStart(restrictedVendor, selectedDate, AllBookedSlots, vendorAvailableSlotsForMessage);
        if (requiredSlotStart) {
          toast.error(`This vendor allows next booking slot only. Please start from ${dayjs(requiredSlotStart).format('hh:mm A')}.`);
          return;
        }
      }

      const durationTryingToSelect = remainingSlotsNeeded * 15;
      toast.error(`There are not ${durationTryingToSelect} min consecutive slots available for ${vendorNames} available at this time. Select another slots etc`);
    } else {
      // Edge case: no vendor even has the first slot available (shouldn't happen for light blue slots)
      const durationTryingToSelect = remainingSlotsNeeded * 15;
      toast.error(`There are not ${durationTryingToSelect} min consecutive slots available for any eligible vendor starting at this time. Please select another slot.`);
    }
  };

  const handleConfirmDayChange = async () => {
    if (!pendingSelection) return;
    setSelectedSlots((prev: Slot[]) => prev.filter((slot: Slot) => slot.service_id !== service.uuid));
    const info = pendingSelection;
    setPendingSelection(null);
    setShowConfirmDayChange(false);
    await onEventClick(info, true);
  };

  const handleAssignVendor = async (vendor: VendorData, slots: { start: string; end: string }[]) => {
    const originAddress = vendor?.addresses?.find((address) => address.type === 'start_location')
    const origin = (originAddress?.address_line_1 + ',' + originAddress?.city + "," + originAddress?.province + "," + originAddress?.country)

    const result = await calculateDistance(origin, destinationAddress);

    const updatedEvents = events.map((event: Slots) => {
      const isMatchingSlot = slots.some(slot =>
        dayjs(event.start).isSame(slot.start) &&
        dayjs(event.end).isSame(slot.end)
      );

      if (isMatchingSlot) {
        return {
          ...event,
          title: `${vendor.first_name} ${vendor.last_name}\n${service.title}`,
          className: `slot-selected vendor-${vendor.uuid}`,
        };
      }
      return event;
    });

    setEvents(updatedEvents);

    const newSlots = slots.map(slot => ({
      service_id: service.uuid ?? '',
      vendor_id: vendor.uuid ? vendor.uuid : '',
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
    }));

    setSelectedSlots((prev: Slot[]) => [...prev, ...newSlots]);
    setShowVendorModal(false);

    // Show informational message about slot selection progress
    // Recalculate service duration and current slots for toast message
    const currentService = servicesData?.find((s) => s.uuid === service.uuid);
    const productOption = currentService?.product_options?.find(
      (option) => option.uuid === service.option_id
    );
    const squareFootage = tempPropertyData?.square_footage || selectedCurrentListing?.square_footage;
    const requiredDuration = getEffectiveServiceDuration(
      productOption?.service_duration,
      squareFootage
    );

    const selectedDate = dayjs(slots[0].start).format('YYYY-MM-DD');
    const currentServiceSlots = selectedSlots.filter(
      (s: Slot) => s.service_id === service.uuid && s.date === selectedDate
    );
    const newTotalSlots = currentServiceSlots.length + slots.length;
    const newTotalDuration = newTotalSlots * 15;

    if (newTotalDuration < requiredDuration) {
      // Toast removed - validation now happens on "Next" button click
    } else if (newTotalDuration === requiredDuration) {
      // Toast removed - validation now handled elsewhere for better UX
    } else {
      toast.info(`Note: You have selected more time than the required ${requiredDuration} minutes for "${service.title}".`);
    }
    onVendorSelected?.(vendor.uuid || '');
  };

  const vendorColorStyles = Object.entries(vendorDistances as Record<string, number>)
    .map(([uuid, distance]) => {
      const color = getDistanceColor(distance);
      return `
      .vendor-${uuid}::before {
        background-color: ${color} !important;
      }
    `;
    })
    .join('\n');

  const customStyles = `
    ${vendorColorStyles}
    .slot-recommended:not(.slot-selected) {
      background-color: #B2FFB2 !important;
    }
    .twilight-recommended-slot {
      border: 2px solid orange !important;
    }
    .recommended-corner-indicator {
      position: absolute;
      top: 0;
      right: 0;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 24px 24px 0;
      border-color: transparent #E8B611 transparent transparent;
      z-index: 10;
    }
    .recommended-corner-indicator svg {
      position: absolute;
      top: 2px;
      right: -22px;
    }
    .fc-header-toolbar {
      position: sticky !important;
      top: 0 !important;
      background: #EEEEEE !important;
      z-index: 10 !important;
      margin-bottom: 0 !important;
      padding-top: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #BBBBBB;
    }
    /* Hover preview: enough consecutive slots — bright green with darker border per slot */
    .slot-hover-preview:not(.slot-selected):not(.slot-unavailable) {
      background-color: #5CFF6C !important;
      border: 1.5px solid #2db83d !important;
      opacity: 1;
      transition: background-color 0.08s ease, border-color 0.08s ease;
    }
    /* Hover preview: insufficient consecutive slots — soft red warning on hovered slot only */
    .slot-hover-preview-error:not(.slot-selected):not(.slot-unavailable) {
      background-color: #ffb3b3 !important;
      opacity: 0.85;
      transition: background-color 0.08s ease;
    }
  `;

  return (
    <>
      <div ref={containerRef} className="mt-[20px] relative custom-scroll" style={{
        border: isUnderScheduled
          ? '3px solid #EF4444'
          : hasSelectedSlotsForBorder
            ? '3px solid #6bae41'
            : '2px solid #BBBBBB',
        borderRadius: '6px',
        maxHeight: 430,
        height: 430,
        overflowY: 'auto',
        width: '100%',
      }}>
        {isCalculating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 gap-3 z-[100]">
            <Loader2 className="w-8 h-8 animate-spin text-[#6bae41]" />
            <span className="text-sm font-medium text-gray-500 font-alexandria">Calculating slots & travel times...</span>
          </div>
        )}
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
          eventContent={(eventInfo) => {
            const isRecommended = eventInfo.event.classNames.includes('slot-recommended');
            const isAvailable = eventInfo.event.classNames.includes('slot-available');
            const isTwilightRecommended = eventInfo.event.extendedProps?.twilightRecommended;
            const availableVendorIds = eventInfo.event.extendedProps?.availableVendorIds || [];

            // Get vendor data sorted by distance
            const availableVendors = availableVendorIds
              .map((vendorId: string) => vendorsData.find((v: VendorData) => v.uuid === vendorId))
              .filter((v: VendorData | undefined): v is VendorData => v !== undefined)
              .sort((a: VendorData, b: VendorData) => {
                const distA = vendorDistances[a.uuid ?? ''] ?? Infinity;
                const distB = vendorDistances[b.uuid ?? ''] ?? Infinity;
                return distA - distB;
              });

            const visibleVendors = availableVendors.slice(0, 3);
            const overflowVendors = availableVendors.slice(3);

            const content = (
              <div className={`fc-event-main-frame w-full h-full relative flex flex-col items-center justify-center p-1 gap-0.5 ${isTwilightRecommended ? 'twilight-recommended-slot' : ''}`}>
                {isAvailable && availableVendors.length > 0 ? (
                  <TooltipProvider delayDuration={200}>
                    <div className="flex flex-wrap gap-0.5 items-center justify-center w-full">
                      {visibleVendors.map((vendor: VendorData) => {
                        const distance = vendorDistances[vendor.uuid ?? ''];
                        const color = getDistanceColor(distance);
                        return (
                          <div
                            key={vendor.uuid}
                            className="flex items-center rounded-sm text-[9px] px-1.5 py-0.5 bg-white/90"
                            style={{
                              borderLeft: `5px solid ${color}`,
                              maxWidth: '100%'
                            }}
                          >
                            <span className="truncate text-[#424242] font-medium">
                              {vendor.first_name}
                            </span>
                          </div>
                        );
                      })}
                      {overflowVendors.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center rounded-sm text-[9px] px-1.5 py-0.5 bg-gray-200 cursor-pointer">
                              <span className="text-[#424242] font-medium">
                                +{overflowVendors.length}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-white border border-gray-200 shadow-lg p-2">
                            <div className="flex flex-col gap-1">
                              {overflowVendors.map((vendor: VendorData) => {
                                const distance = vendorDistances[vendor.uuid ?? ''];
                                const color = getDistanceColor(distance);
                                return (
                                  <div
                                    key={vendor.uuid}
                                    className="flex items-center gap-1.5 text-[11px]"
                                  >
                                    <div
                                      className="w-1 h-4 rounded-sm"
                                      style={{ backgroundColor: color, width: '4px' }}
                                    />
                                    <span className="text-[#424242]">
                                      {vendor.first_name} {vendor.last_name}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                ) : (
                  <div className="fc-event-title fc-sticky text-center" style={{ fontSize: '9px', color: '#424242' }}>
                    {eventInfo.event.title}
                  </div>
                )}
                {isRecommended && !isTwilightRecommended && (
                  <div className="recommended-corner-indicator">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                )}
              </div>
            );

            if (isTwilightRecommended) {
              return (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {content}
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-orange-500 text-white border-none text-xs p-2">
                      Recommended for Twilight
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            return content;
          }}
          height="auto"
          dayHeaders={false}
          eventClick={onEventClick}
          eventMouseEnter={onEventMouseEnter}
          eventMouseLeave={onEventMouseLeave}
          eventClassNames={(arg) => {
            const eventStart = arg.event.start?.toISOString();
            if (!eventStart) return [];
            if (hoverPreviewSlots.slots.includes(eventStart)) {
              return hoverPreviewSlots.isValid
                ? ['slot-hover-preview']
                : ['slot-hover-preview-error'];
            }
            return [];
          }}
          selectable={true}
          editable={true}
          initialDate={initialDateStr}
          headerToolbar={{
            left: 'prev,next',
            center: 'title',
            right: ''
          }}
          titleFormat={{ weekday: 'short', day: 'numeric' }}
          datesSet={(arg: DatesSetArg) => {
            const calendarDate = dayjs(arg.start).format('YYYY-MM-DD');
            setCurrentDate(calendarDate);
            setSelectedDate(calendarDate)
          }}
        />

        {showVendorModal && clickedSlot && (
          <div
            onClick={() => setShowVendorModal(false)}
            style={{ height: '-webkit-fill-available' }}
            className="sticky top-0 inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#EEEEEE] rounded-lg p-4 w-[300px] shadow-lg">
              {availableSlotVendors.length === 0 ? (
                <p className="text-gray-500">No vendors available for this service at selected time.</p>
              ) : (
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {[...availableSlotVendors]
                    .sort((a, b) => {
                      const timeA = vendorDistances[a.uuid ?? ''] ?? Infinity;
                      const timeB = vendorDistances[b.uuid ?? ''] ?? Infinity;
                      return timeA - timeB;
                    })
                    .map((vendor: VendorData) => {
                      const travelTime = vendor.uuid ? vendorDistances[vendor.uuid] : undefined;
                      const color = getDistanceColor(travelTime);
                      const formatTravelTime = (seconds: number) => {
                        const h = Math.floor(seconds / 3600);
                        const m = Math.floor((seconds % 3600) / 60);
                        if (h > 0) return `${h}h ${m}m`;
                        return `${m}m`;
                      };

                      return (
                        <li
                          key={vendor.uuid}
                          className="cursor-pointer p-2 flex items-center gap-1 hover:bg-gray-100"
                          onClick={() => {
                            const remainingSlotsNeeded = Math.ceil(getEffectiveServiceDuration(
                              servicesData?.find(s => s.uuid === service.uuid)?.product_options?.find(opt => opt.uuid === service.option_id)?.service_duration,
                              tempPropertyData?.square_footage || selectedCurrentListing?.square_footage
                            ) / 15) - selectedSlots.filter(s => s.service_id === service.uuid && s.date === dayjs(clickedSlot.start).format('YYYY-MM-DD')).length;

                            const slotsToSelect = [];
                            for (let i = 0; i < remainingSlotsNeeded; i++) {
                              slotsToSelect.push({
                                start: dayjs(clickedSlot.start).add(i * 15, 'minute').toISOString(),
                                end: dayjs(clickedSlot.start).add((i + 1) * 15, 'minute').toISOString(),
                              });
                            }
                            handleAssignVendor(vendor, slotsToSelect);
                          }}
                        >
                          <span
                            style={{ backgroundColor: color }}
                            className={`flex h-[16px] w-[5px]`}></span>
                          <span className='text-[14px] truncate'>{vendor.first_name} {vendor.last_name}</span>
                          {travelTime !== undefined && (
                            <span className="text-gray-500 text-[12px] ml-auto">
                              ({formatTravelTime(travelTime)})
                            </span>
                          )}
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </div>
        )}
        <style>{customStyles}</style>
      </div>

      {twilightData && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md border border-[#EEEEEE]">
          <h4 className="text-sm font-[600] text-[#666666] mb-2">Twilight Time ({dayjs(currentDate).format('MMM D')})</h4>
          <div className="text-xs text-gray-500">
            Time: {formatTwilightTime(twilightData.sunset, propertyTimezone || "America/Vancouver")} – {formatTwilightTime(twilightData.civil_twilight_end, propertyTimezone || "America/Vancouver")}
          </div>
        </div>
      )}
      <ConfirmationDialog
        open={showConfirmDayChange}
        setOpen={(open) => {
          setShowConfirmDayChange(open);
          if (!open) {
            setPendingSelection(null);
          }
        }}
        onConfirm={handleConfirmDayChange}
        showAgain={showAgain}
        toggleShowAgain={() => setShowAgain(prev => !prev)}
        title="Change Selected Date?"
        description={`Selecting a slot for this day will remove the previous day selection for ${service.title || "this service"}.`}
      />
    </>
  );
}