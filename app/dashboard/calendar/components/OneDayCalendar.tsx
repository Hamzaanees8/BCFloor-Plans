import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import dayjs from "dayjs";
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { GetOneListing } from '../../listings/listing';
import { useOrderContext, Slot } from '../../orders/context/OrderContext';
import { VendorData } from '../../orders/[id]/page';
import {
  Get,
  GetVendors,
  fetchTwilightTime,
  TwilightResponse,
  formatTwilightTime,
  convertUTCToTimezone,
  convertVendorWorkHoursToPropertyTimezone,
} from '../../orders/orders';
import { useAppContext } from '@/app/context/AppContext';
import { Order } from '../../orders/page';
import { toast } from 'sonner';
import { Services } from '../../services/page';
import { getEffectiveServiceDuration } from '../../orders/utils/serviceTimeUtils';
import { getDistanceColor } from './Schedule';
import { Loader2 } from 'lucide-react';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface WorkHours {
  start_time?: string;
  end_time?: string;
  break_start: string;
  break_end: string;
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
    twilightRecommended?: boolean;
  };
  [key: string]: string | undefined | { availableVendorIds?: string[]; twilightRecommended?: boolean };
}

interface SelectedService {
  title?: string;
  uuid?: string;
  id: number;
  price?: number;
  custom?: string;
  quantity?: number;
  option_id?: string;
  optionName?: string;
  option?: {
    uuid?: string;
  };
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
  selectedListingId: string | null;
  className?: string;
  setSelectedDate: (date: string) => void;
  targetDate?: string;
  currentOrderId?: number;
  vendorDistances?: Record<string, number>;
  onVendorSelected?: (vendorId: string) => void;
  propertyTimezone?: string;
  squareFootage?: number;
  isCalculating?: boolean;
}

interface MinimalSlot {
  date: string;
  start_time: string;
  end_time: string;
  vendor_id?: string;
  vendor?: { uuid: string };
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

function isSameService(slotServiceId: any, serviceObj: any): boolean {
  if (!slotServiceId || !serviceObj) return false;
  const sUuid = serviceObj.uuid || serviceObj.service?.uuid;
  const sId = serviceObj.id || serviceObj.service?.id;
  return String(slotServiceId) === String(sUuid) || String(slotServiceId) === String(sId);
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

function isMatterportService(
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

  return /matterport|3d\s*tour|3dtour|iguide/.test(searchable);
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
    isSameService(s.service_id, { uuid: currentServiceUuid }) &&
    s.date === date
  ).map(s => dayjs(`${s.date} ${s.start_time}`).toISOString()) || [];

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

  const dayOfWeek = dayjs(date).format('ddd').toLowerCase();
  const daySchedule = workHours.work_days?.find(d => d.day === dayOfWeek);

  if (daySchedule && (daySchedule.is_off === '1' || daySchedule.is_off === 1 || daySchedule.is_off === true)) {
    return [];
  }

  const effectiveStartTime = daySchedule?.start_time || workHours.start_time;
  const effectiveEndTime = daySchedule?.end_time || workHours.end_time;

  if (!effectiveStartTime || !effectiveEndTime) return [];

  const slots = [];
  const start = dayjs(`${date}T${effectiveStartTime}`);
  const end = dayjs(`${date}T${effectiveEndTime}`);
  const breakStart = workHours.break_start ? dayjs(`${date}T${workHours.break_start}`) : null;
  const breakEnd = workHours.break_end ? dayjs(`${date}T${workHours.break_end}`) : null;
  const currentDateObj = dayjs(date);

  let current = start;

  while (current.isBefore(end)) {
    const next = current.add(interval, 'minute');

    const inBreak = breakStart && breakEnd && next.isAfter(breakStart) && current.isBefore(breakEnd);

    const isBooked = allBookedSlots?.some(bookedSlot => {
      if (!bookedSlot) return false;
      const bookedStart = dayjs(`${bookedSlot.date}T${bookedSlot.start_time}`);
      const bookedEnd = dayjs(`${bookedSlot.date}T${bookedSlot.end_time}`);
      const bookedVendorId = bookedSlot.vendor?.uuid || bookedSlot.vendor_id;
      return (
        bookedVendorId === vendorId &&
        bookedSlot.date === date &&
        current.isSameOrAfter(bookedStart) &&
        next.isSameOrBefore(bookedEnd)
      );
    }) || false;

    const isConflict = otherServiceSlots.some(conflictSlot => {
      const conflictStart = dayjs(`${conflictSlot.date}T${conflictSlot.start_time}`);
      const conflictEnd = dayjs(`${conflictSlot.date}T${conflictSlot.end_time}`);
      return (
        (conflictSlot.vendor?.uuid === vendorId || conflictSlot.vendor_id === vendorId) &&
        conflictSlot.date === date &&
        current.isSameOrAfter(conflictStart) &&
        next.isSameOrBefore(conflictEnd)
      );
    });

    const isTimeOff = vendorTimeOffs?.some(timeOff => {
      if (!timeOff) return false;
      const timeOffStartDate = timeOff.start_date || timeOff.date;
      const timeOffEndDate = timeOff.end_date || timeOff.date;
      const startDateObj = dayjs(timeOffStartDate);
      const endDateObj = dayjs(timeOffEndDate);
      const isDateInRange = currentDateObj.isSameOrAfter(startDateObj, 'day') && currentDateObj.isSameOrBefore(endDateObj, 'day');
      if (!isDateInRange) return false;
      const isStartDay = currentDateObj.isSame(startDateObj, 'day');
      const isEndDay = currentDateObj.isSame(endDateObj, 'day');
      if (isStartDay && isEndDay) {
        const s = dayjs(`${date}T${timeOff.start_time}`);
        const e = dayjs(`${date}T${timeOff.end_time}`);
        return (current.isSameOrAfter(s) && current.isBefore(e)) || (next.isAfter(s) && next.isSameOrBefore(e)) || (current.isBefore(s) && next.isAfter(e));
      } else if (isStartDay) {
        return current.isSameOrAfter(dayjs(`${date}T${timeOff.start_time}`));
      } else if (isEndDay) {
        return current.isBefore(dayjs(`${date}T${timeOff.end_time}`));
      }
      return true;
    }) || false;

    const isCalendarEvent = calendarEvents?.some(event => {
      if (!event || event.status === 'cancelled') return false;
      const eventStart = dayjs(event.start);
      const eventEnd = dayjs(event.end);
      if (eventStart.format('YYYY-MM-DD') !== date) return false;
      return (current.isSameOrAfter(eventStart) && current.isBefore(eventEnd)) ||
        (next.isAfter(eventStart) && next.isSameOrBefore(eventEnd)) ||
        (current.isBefore(eventStart) && next.isAfter(eventEnd));
    }) || false;

    if (!inBreak && !isBooked && !isConflict && !isTimeOff && !isCalendarEvent) {
      slots.push({
        id: current.toISOString(),
        start: current.toISOString(),
        end: next.toISOString(),
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
    slots.push({ start: current.toISOString(), end: next.toISOString(), title: '', className: 'slot-unavailable' });
    current = next;
  }
  return slots;
}

export default function OneDayCalendar({
  setSelectedDate,
  targetDate,
  selectedListingId,
  selectedVendors,
  service,
  showAllVendorsMap,
  scheduleOverrideMap,
  recommendTimeMap,
  calendarIdx,
  currentOrderId,
  vendorDistances,
  onVendorSelected,
  propertyTimezone,
  squareFootage,
  isCalculating,
  scheduleOverride,
}: CalendarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasScrolledToFirstSlot = useRef(false);

  const {
    selectedSlots,
    setSelectedSlots,
    servicesData,
    selectedCurrentListing,
    tempPropertyData,
  } = useOrderContext();

  const { userType } = useAppContext();

  const [events, setEvents] = useState<Slots[]>([]);
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [clickedSlot, setClickedSlot] = useState<{ start: string; end: string } | null>(null);
  const [availableSlotVendors, setAvailableSlotVendors] = useState<VendorData[]>([]);
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [orderData, setOrderData] = useState<Order[]>([]);
  const [twilightData, setTwilightData] = useState<TwilightResponse | null>(null);
  const [showConfirmDayChange, setShowConfirmDayChange] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<any | null>(null);
  const [showAgain, setShowAgain] = useState(true);

  const calendarRef = useRef<FullCalendar>(null);

  // Effective square footage: prop first, then context fallback
  const effectiveSquareFootage = squareFootage ?? tempPropertyData?.square_footage ?? selectedCurrentListing?.square_footage;

  const currentServiceForBorder = servicesData?.find((s) => isSameService(s.uuid, service.service));
  const productOptionForBorder = currentServiceForBorder?.product_options?.find(
    (option: any) => option.uuid === (service.option_id || service.option?.uuid)
  );
  const requiredDurationForBorder = getEffectiveServiceDuration(
    productOptionForBorder?.service_duration,
    effectiveSquareFootage
  );
  const requiredSlotsCountForBorder = Math.ceil(requiredDurationForBorder / 15);

  const hasSelectedSlotsForBorder = selectedSlots.some(s => isSameService(s.service_id, service.service));
  const currentServiceSlotsCountForBorder = selectedSlots.filter(
    (slot: Slot) => isSameService(slot.service_id, service.service)
  ).length;
  const isUnderScheduled = hasSelectedSlotsForBorder && currentServiceSlotsCountForBorder < requiredSlotsCountForBorder;

  // Load all orders for booked slots
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    Get(token).then(data => setOrderData(data.data)).catch(err => console.log(err.message));
  }, []);

  // Load vendors
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    GetVendors(token).then(data => setVendors(data.data)).catch(err => console.log(err.message));
  }, []);

  // Load listing address for distance calc
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (selectedListingId) {
      GetOneListing(selectedListingId)
        .then(data => setDestinationAddress(data.data.address))
        .catch(err => console.log(err.message));
    }
  }, [selectedListingId]);

  const AllBookedSlots = useMemo(() => {
    return orderData
      ?.filter(order => currentOrderId ? order.id !== currentOrderId : true)
      .map(order => order.slots)
      .flat();
  }, [orderData, currentOrderId]);

  // Sync currentDate with existing selected slot
  useEffect(() => {
    const matchingSlot = selectedSlots.find(slot => isSameService(slot.service_id, service.service));
    if (matchingSlot) {
      setCurrentDate(matchingSlot.date);
    } else {
      setCurrentDate(dayjs().format('YYYY-MM-DD'));
    }
  }, [selectedSlots, service]);

  // Navigate calendar when targetDate changes
  useEffect(() => {
    if (calendarRef.current && (targetDate || currentDate)) {
      const calendarApi = calendarRef.current.getApi();
      const dateToGo = targetDate || currentDate;
      if (dayjs(calendarApi.getDate()).format('YYYY-MM-DD') !== dateToGo) {
        calendarApi.gotoDate(dateToGo);
        if (targetDate && targetDate !== currentDate) {
          setCurrentDate(targetDate);
        }
      }
    }
  }, [currentDate, targetDate]);

  // Fetch twilight for current date
  useEffect(() => {
    async function loadTwilight() {
      const address = destinationAddress ||
        (selectedCurrentListing ? `${selectedCurrentListing.address}, ${selectedCurrentListing.city}, ${selectedCurrentListing.country}` :
          tempPropertyData ? `${tempPropertyData.address}, ${tempPropertyData.city}, ${tempPropertyData.country}` : '');
      if (!address) return;
      const result = await fetchTwilightTime(address, currentDate);
      if (result) setTwilightData(result);
    }
    loadTwilight();
  }, [destinationAddress, currentDate, selectedCurrentListing, tempPropertyData]);

  // Build events from vendor slots
  useEffect(() => {
    const date = currentDate;
    const filteredVendors = vendors.filter(v => v.uuid !== undefined && selectedVendors.includes(v.uuid!));

    if (!filteredVendors.length) {
      setEvents([]);
      return;
    }

    const fullDaySlots = generateAllDaySlots(date, 15);
    const slotVendorsMap = new Map<string, string[]>();

    const otherServiceSlots = selectedSlots.filter(s =>
      !isSameService(s.service_id, service.service) && s.date === date
    );

    // Check if this service does not require travel (full-day availability regardless of work hours)
    const currentServiceDataForSlots = servicesData.find(s => s.uuid === service.service.uuid || String(s.id) === String(service.service.id));
    const isNoTravelRequired = currentServiceDataForSlots?.is_travel_required === false;
    const productOptionForSlots = currentServiceDataForSlots?.product_options?.find((option: any) => option.uuid === service.option_id);
    const requiredDurationForSlots = getEffectiveServiceDuration(
      productOptionForSlots?.service_duration,
      squareFootage
    );
    const requiredSlotsCountForService = Math.max(1, Math.ceil(requiredDurationForSlots / 15));
    const isFloorPlan = isFloorPlanService(service.title, service.service.uuid, service.service.id, servicesData);
    const isMatterport = isMatterportService(service.title, service.service.uuid, service.service.id, servicesData);
    // Services where allow_next_booking should be enforced (like floor plan)
    const isSpecialService = isFloorPlan || isMatterport;

    filteredVendors.forEach(vendor => {
      const vendorId = vendor.uuid ?? '';
      if (!vendorId) return;

      const vendorHasNextBookingFlag = isNextBookingSlotOnlyEnabled(vendor);
      // For special services (floor plan / matterport), enforce next_booking_slot_only per-vendor
      const shouldEnforceForVendor = isSpecialService
        ? vendorHasNextBookingFlag
        : true;

      // Full-day bypass logic:
      // - For no-travel services: full day only when vendor's allow_next_booking is OFF
      //   (if allow_next_booking is ON, use actual schedule so first-slot restriction applies)
      // - For travel-required services: full day only when schedule override is ON,
      //   but never for special services (floor plan / matterport) that have next_booking_slot_only
      const useFullDay = isNoTravelRequired
        ? !vendorHasNextBookingFlag
        : (scheduleOverride === 1) && !(isSpecialService && vendorHasNextBookingFlag);

      if (useFullDay) {
        const fullDayWorkHours: WorkHours = {
          start_time: '00:00:00',
          end_time: '23:59:59',
          break_start: '',
          break_end: '',
          work_days: [{
            day: dayjs(date).format('ddd').toLowerCase(),
            start_time: '00:00:00',
            end_time: '23:59:59',
            is_off: 0,
            is_twilight: 0,
          }],
        };
        const vendorSlots = generateMarkedSlots(date, fullDayWorkHours, vendorId, AllBookedSlots as unknown as MinimalSlot[], otherServiceSlots as unknown as MinimalSlot[], [], [], 15);
        
        const slotsToExpose = getRestrictedDisplaySlots(
          vendor,
          date,
          AllBookedSlots as unknown as MinimalSlot[],
          vendorSlots,
          requiredSlotsCountForService,
          shouldEnforceForVendor,
          service.service.uuid,
          selectedSlots
        );

        slotsToExpose.forEach(slot => {
          const key = `${slot.start}_${slot.end}`;
          if (!slotVendorsMap.has(key)) slotVendorsMap.set(key, []);
          slotVendorsMap.get(key)!.push(vendorId);
        });
      } else {
        if (!vendor.work_hours) return;
        
        const vendorTimezone = vendor.work_hours.timezone || 'America/Vancouver';
        const targetTimezone = propertyTimezone || 'America/Vancouver';

        const convertedWorkHours = convertVendorWorkHoursToPropertyTimezone(
          date,
          vendor.work_hours,
          vendorTimezone,
          targetTimezone
        );

        const vendorSlots = generateMarkedSlots(date, convertedWorkHours as any, vendorId, AllBookedSlots as unknown as MinimalSlot[], otherServiceSlots as unknown as MinimalSlot[], vendor.additional_breaks || [], vendor.calendar_events || [], 15);
        
        const slotsToExpose = getRestrictedDisplaySlots(
          vendor,
          date,
          AllBookedSlots as unknown as MinimalSlot[],
          vendorSlots,
          requiredSlotsCountForService,
          shouldEnforceForVendor,
          service.service.uuid,
          selectedSlots
        );

        slotsToExpose.forEach(slot => {
          const key = `${slot.start}_${slot.end}`;
          if (!slotVendorsMap.has(key)) slotVendorsMap.set(key, []);
          slotVendorsMap.get(key)!.push(vendorId);
        });
      }
    });

    const currentServiceData = servicesData.find(s => s.uuid === service.service.uuid || String(s.id) === String(service.service.id));

    let availableSlotsCount = 0;
    const finalSlots = fullDaySlots.map(slot => {
      const key = `${slot.start}_${slot.end}`;
      const availableVendorIds = slotVendorsMap.get(key) || [];

      // Twilight restriction
      let isTwilightRestricted = false;
      if (currentServiceData?.category?.name === "Twilight Photos" && twilightData?.sunset) {
        const targetTz = propertyTimezone || 'America/Vancouver';
        const sunsetLocalTimeStr = convertUTCToTimezone(twilightData.sunset, targetTz);
        const twilightTime = dayjs(`${date}T${sunsetLocalTimeStr}`);
        const allowedStartTime = twilightTime.subtract(30, 'minute');
        if (dayjs(slot.start).isBefore(allowedStartTime)) {
          isTwilightRestricted = true;
        }
      }

      // Check if this slot is already selected for the current service/order
      const matchingSelected = selectedSlots.find(s => {
        const sidMatch = s.service_id === service.service.uuid || String(s.service_id) === String(service.service.id);
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
        const matchedVendor = vendors.find(v => v.uuid === vendorId);
        const vendorName = matchedVendor ? `${matchedVendor.first_name} ${matchedVendor.last_name}` : 'Unknown';
        
        // Even for selected slots, we check if it happens to be in a recommended window
        const isTwilightService = currentServiceData?.category?.name === "Twilight Photos" || service?.title?.includes("Twilight");
        let isRecommended = false;
        if (isTwilightService || recommendTimeMap[calendarIdx] === 1) {
           // We don't strictly need to recalculate isRecommended here for selection display, 
           // but keeping it consistent with classes
           isRecommended = availableVendorIds.length > 0 && !isTwilightRestricted;
        }

        return {
          ...slot,
          title: `${vendorName}\n${service.title || service.service.name}`,
          className: `slot-selected vendor-${vendorId}${isRecommended ? ' slot-recommended' : ''}`,
          extendedProps: { 
            availableVendorIds: [], 
            twilightRecommended: isTwilightService && isRecommended 
          },
        };
      }

      if (availableVendorIds.length > 0 && !isTwilightRestricted) {
        const isTwilightService = currentServiceData?.category?.name === "Twilight Photos" || service?.title?.includes("Twilight");
        let isRecommended = false;
        let maxRecommended = 1;

        if (isTwilightService) {
          const productOption = currentServiceData?.product_options?.find(opt => opt.uuid === (service.option_id || service.option?.uuid));
          const reqDur = getEffectiveServiceDuration(productOption?.service_duration, effectiveSquareFootage);
          maxRecommended = Math.ceil(reqDur / 15) || 1;
        }

        if (availableSlotsCount < maxRecommended && (recommendTimeMap[calendarIdx] === 1 || isTwilightService)) {
          isRecommended = true;
          availableSlotsCount++;
        }

        if (isRecommended) {
          return {
            ...slot,
            title: 'Recommended',
            className: 'slot-available slot-recommended',
            extendedProps: { availableVendorIds, twilightRecommended: isTwilightService },
          };
        }

        return { ...slot, title: '', className: 'slot-available', extendedProps: { availableVendorIds } };
      }

      return { ...slot, title: 'Unavailable', className: 'slot-unavailable', extendedProps: { availableVendorIds: [] } };
    });

    setEvents(finalSlots);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors, currentDate, selectedVendors, selectedSlots, service.service.uuid, service.service.id, recommendTimeMap, calendarIdx, scheduleOverrideMap, scheduleOverride, twilightData, servicesData, effectiveSquareFootage, propertyTimezone, AllBookedSlots, orderData]);

  // Reset scroll ref when service or date changes
  useEffect(() => {
    hasScrolledToFirstSlot.current = false;
  }, [service.service.uuid, service.service.id, currentDate]);

  // Auto-scroll to first slot
  useEffect(() => {
    if (!containerRef.current || events.length === 0) return;

    // Check if current service is Twilight
    const currentServiceData = servicesData.find(s => s.uuid === service.service.uuid || String(s.id) === String(service.service.id));
    const isTwilightService = currentServiceData?.category?.name === "Twilight Photos" || service?.service?.name?.includes("Twilight");

    // For twilight services, wait until we have twilight data for a stable scroll
    if (isTwilightService && !twilightData) return;

    if (!hasScrolledToFirstSlot.current) {
      const timer = setTimeout(() => {
        if (!containerRef.current) return;
        const recommendedEl = containerRef.current.querySelector('.slot-recommended') as HTMLElement;
        const selectedEl = containerRef.current.querySelector('.slot-selected') as HTMLElement;
        const availableEl = containerRef.current.querySelector('.slot-available') as HTMLElement;

        // Priority: Recommended > Selected > Available
        const targetEl = recommendedEl || selectedEl || availableEl;

        if (targetEl) {
          const container = containerRef.current;
          const containerRect = container.getBoundingClientRect();
          const targetRect = targetEl.getBoundingClientRect();

          // Ensure the element has a valid position before scrolling
          if (targetRect.height === 0 || targetRect.top === 0) return;

          // Calculate relative top position
          const relativeTop = targetRect.top - containerRect.top + container.scrollTop;

          // Scroll to 1/3 down the container for better visibility
          const scrollTo = Math.max(0, relativeTop - containerRect.height / 3);

          container.scrollTo({ top: scrollTo, behavior: 'smooth' });
          hasScrolledToFirstSlot.current = true;
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [events, twilightData, servicesData, service.service.uuid, service.service.id, service.service?.name]);

  function geocodeAddress(address: string): Promise<string> {
    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results && results[0]) resolve(results[0].formatted_address);
        else reject(`Geocode failed: ${status}`);
      });
    });
  }

  async function calculateDistance(originInput: string, destinationInput: string): Promise<{ est_time: number; distance: number } | null> {
    try {
      if (!originInput || !destinationInput) return null;
      const originResolved = await geocodeAddress(originInput.trim());
      const destinationResolved = await geocodeAddress(destinationInput.trim());
      const svc = new window.google.maps.DistanceMatrixService();
      return new Promise(resolve => {
        svc.getDistanceMatrix({ origins: [originResolved], destinations: [destinationResolved], travelMode: window.google.maps.TravelMode.DRIVING }, (response, status) => {
          if (status !== "OK") { resolve(null); return; }
          const result = response?.rows?.[0]?.elements?.[0];
          if (!result || result.status !== "OK") { resolve(null); return; }
          resolve({ est_time: result.duration.value / 60, distance: result.distance.value / 1000 });
        });
      });
    } catch { return null; }
  }

  const onEventClick = async (info: import('@fullcalendar/core').EventClickArg, forceProceed = false) => {
    if (!info.event.start || !info.event.end) return;
    if (userType === 'vendor') return;

    const clicked = { start: info.event.start.toISOString(), end: info.event.end.toISOString() };
    const slotStart = dayjs(info.event.start).format('HH:mm:ss');
    const slotEnd = dayjs(info.event.end).format('HH:mm:ss');
    const selectedDate = dayjs(info.event.start).format('YYYY-MM-DD');

    // Duration enforcement: compute how many consecutive slots to select
    const currentServiceData = servicesData?.find(s => isSameService(s.uuid, service.service));
    const productOption = currentServiceData?.product_options?.find(opt => opt.uuid === (service.option_id || service.option?.uuid));
    const requiredDuration = getEffectiveServiceDuration(productOption?.service_duration, effectiveSquareFootage);
    const requiredSlots = Math.ceil(requiredDuration / 15);

    const isAlreadySelected = selectedSlots.find(slot => {
      const sidMatch = slot.service_id === service.service.uuid || String(slot.service_id) === String(service.service.id);
      const dateMatch = slot.date === selectedDate;
      const sStart = dayjs(`${slot.date} ${slot.start_time}`);
      const sEnd = dayjs(`${slot.date} ${slot.end_time}`);
      const clickedStart = dayjs(info.event.start);
      const clickedEnd = dayjs(info.event.end);

      return sidMatch && dateMatch && 
             sStart.isSame(clickedStart, 'minute') && 
             sEnd.isSame(clickedEnd, 'minute');
    });

    if (!forceProceed && !isAlreadySelected) {
      const existingSlots = selectedSlots.filter(slot => isSameService(slot.service_id, service.service));
      const hasDifferentDate = existingSlots.some(slot => slot.date !== selectedDate);
      if (hasDifferentDate) {
        setPendingSelection(info);
        setShowConfirmDayChange(true);
        return;
      }
    }

    if (isAlreadySelected) {
      const serviceSlotsForDate = selectedSlots
        .filter(slot => isSameService(slot.service_id, service.service) && slot.date === selectedDate)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      if (serviceSlotsForDate.length === 1) {
        setSelectedSlots(prev => prev.filter(slot => {
          const sidMatch = slot.service_id === service.service.uuid || String(slot.service_id) === String(service.service.id);
          const dateMatch = slot.date === selectedDate;
          const sStart = dayjs(`${slot.date} ${slot.start_time}`);
          const sEnd = dayjs(`${slot.date} ${slot.end_time}`);
          const clickedStart = dayjs(info.event.start);
          const clickedEnd = dayjs(info.event.end);
          
          return !(sidMatch && dateMatch && sStart.isSame(clickedStart, 'minute') && sEnd.isSame(clickedEnd, 'minute'));
        }));
        setEvents(prev => prev.map(e =>
          dayjs(e.start).isSame(clicked.start) && dayjs(e.end).isSame(clicked.end)
            ? { ...e, title: '', className: 'slot-available' }
            : e
        ));

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

      const firstSlot = serviceSlotsForDate[0];
      const lastSlot = serviceSlotsForDate[serviceSlotsForDate.length - 1];
      const isFirst = slotStart === firstSlot.start_time && slotEnd === firstSlot.end_time;
      const isLast = slotStart === lastSlot.start_time && slotEnd === lastSlot.end_time;

      if (!isFirst && !isLast) {
        toast.error('You can only remove slots from the start or end of your booking.');
        return;
      }

      setSelectedSlots(prev => prev.filter(slot =>
        !(isSameService(slot.service_id, service.service) && slot.start_time === slotStart && slot.end_time === slotEnd && slot.date === selectedDate)
      ));
      setEvents(prev => prev.map(e =>
        dayjs(e.start).isSame(clicked.start) && dayjs(e.end).isSame(clicked.end)
          ? { ...e, title: '', className: 'slot-available' }
          : e
      ));

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
      slot => isSameService(slot.service_id, service.service) && slot.date === selectedDate
    );

    if (currentServiceSlots.length >= requiredSlots) {
      toast.warning(`You cannot select more than the required ${requiredDuration} minutes for "${service.title || service.service.name}".`);
      return;
    }

    const remainingSlotsNeeded = requiredSlots - currentServiceSlots.length;

    const slotsToSelect: { start: string; end: string }[] = [];
    for (let i = 0; i < remainingSlotsNeeded; i++) {
      slotsToSelect.push({
        start: dayjs(clicked.start).add(i * 15, 'minute').toISOString(),
        end: dayjs(clicked.start).add((i + 1) * 15, 'minute').toISOString(),
      });
    }

    const currentServiceDataForClick = servicesData.find(s => s.uuid === service.service.uuid || String(s.id) === String(service.service.id));
    const isNoTravelClick = currentServiceDataForClick?.is_travel_required === false;
    const isFloorPlanClick = isFloorPlanService(service.title, service.service.uuid, service.service.id, servicesData);
    const isMatterportClick = isMatterportService(service.title, service.service.uuid, service.service.id, servicesData);
    const isSpecialServiceClick = isFloorPlanClick || isMatterportClick;

    // Find vendors available for ALL consecutive slots
    const matching = vendors.filter(vendor => {
      if (!vendor.uuid || !selectedVendors.includes(vendor.uuid)) return false;

      const vendorHasNextBookingFlag = isNextBookingSlotOnlyEnabled(vendor);
      const shouldEnforceForVendor = isSpecialServiceClick
        ? vendorHasNextBookingFlag
        : true;

      // Mirror the same useFullDay logic from event generation
      const useFullDayClick = isNoTravelClick
        ? !vendorHasNextBookingFlag
        : (scheduleOverride === 1) && !(isSpecialServiceClick && vendorHasNextBookingFlag);

      if (useFullDayClick) {
        const fullDayWorkHours: WorkHours = {
          start_time: '00:00:00',
          end_time: '23:59:59',
          break_start: '',
          break_end: '',
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
          AllBookedSlots as unknown as MinimalSlot[],
          selectedSlots.filter(s => !isSameService(s.service_id, service.service) && s.date === selectedDate) as unknown as MinimalSlot[],
          [],
          [],
          15
        );

        const requiredSlotStart = shouldEnforceForVendor
          ? getVendorRequiredSlotStart(vendor, selectedDate, AllBookedSlots as unknown as MinimalSlot[], vendorAvailableSlots)
          : null;
        if (requiredSlotStart && currentServiceSlots.length === 0 && !dayjs(slotsToSelect[0].start).isSame(requiredSlotStart)) {
          return false;
        }

        return slotsToSelect.every(slotToSelect =>
          vendorAvailableSlots.some(avail =>
            dayjs(avail.start).isSame(slotToSelect.start) && dayjs(avail.end).isSame(slotToSelect.end)
          )
        );
      }

      if (!vendor.work_hours) return false;

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
        convertedWorkHours as any,
        vendor.uuid ?? '',
        AllBookedSlots as unknown as MinimalSlot[],
        selectedSlots.filter(s => !isSameService(s.service_id, service.service) && s.date === selectedDate) as unknown as MinimalSlot[],
        vendor.additional_breaks || [],
        vendor.calendar_events || [],
        15
      );

      const requiredSlotStart = shouldEnforceForVendor
        ? getVendorRequiredSlotStart(vendor, selectedDate, AllBookedSlots as unknown as MinimalSlot[], vendorAvailableSlots)
        : null;
      if (requiredSlotStart && currentServiceSlots.length === 0 && !dayjs(slotsToSelect[0].start).isSame(requiredSlotStart)) {
        return false;
      }

      return slotsToSelect.every(slotToSelect =>
        vendorAvailableSlots.some(avail =>
          dayjs(avail.start).isSame(slotToSelect.start) && dayjs(avail.end).isSame(slotToSelect.end)
        )
      );
    });

    const assignedVendorId = currentServiceSlots.length > 0
      ? (currentServiceSlots[0].vendor?.uuid || currentServiceSlots[0].vendor_id)
      : null;

    if (assignedVendorId) {
      const stickyVendor = matching.find(v => v.uuid === assignedVendorId);
      if (stickyVendor) { await handleAssignVendor(stickyVendor, slotsToSelect); return; }
    }

    if (matching.length === 1) {
      await handleAssignVendor(matching[0], slotsToSelect);
    } else if (matching.length > 1) {
      setClickedSlot(clicked);
      setAvailableSlotVendors(matching);
      setShowVendorModal(true);
    } else {
      toast.error(`No vendor has ${remainingSlotsNeeded * 15} consecutive minutes available starting at this time.`);
    }
  };

  const handleConfirmDayChange = async () => {
    if (!pendingSelection) return;
    setSelectedSlots(prev => prev.filter(slot => !isSameService(slot.service_id, service.service)));
    const info = pendingSelection;
    setPendingSelection(null);
    setShowConfirmDayChange(false);
    await onEventClick(info, true);
  };

  const handleAssignVendor = async (vendor: VendorData, slots: { start: string; end: string }[]) => {
    const originAddress = vendor?.addresses?.find(a => a.type === 'start_location') || vendor?.addresses?.[1];
    const origin = originAddress ? `${originAddress.address_line_1}, ${originAddress.city}, ${originAddress.province}, ${originAddress.country}` : '';
    const result = await calculateDistance(origin, destinationAddress);

    const updatedEvents = events.map(event => {
      const isMatchingSlot = slots.some(slot =>
        dayjs(event.start).isSame(slot.start) && dayjs(event.end).isSame(slot.end)
      );
      if (isMatchingSlot) {
        return {
          ...event,
          title: `${vendor.first_name} ${vendor.last_name}\n${service.title || service.service.name}`,
          className: `slot-selected vendor-${vendor.uuid}`,
        };
      }
      return event;
    });

    setEvents(updatedEvents);

    const newSlots = slots.map(slot => ({
      service_id: service.service.uuid ?? '',
      vendor_id: vendor.uuid || '',
      show_all_vendors: showAllVendorsMap[calendarIdx] ?? 0,
      schedule_override: scheduleOverride ?? 0,
      recommend_time: recommendTimeMap[calendarIdx] ?? 0,
      travel: null,
      start_time: dayjs(slot.start).format('HH:mm:ss'),
      end_time: dayjs(slot.end).format('HH:mm:ss'),
      date: dayjs(slot.start).format('YYYY-MM-DD'),
      est_time: result?.est_time ?? null,
      distance: result?.distance ?? null,
      km_price: null,
    }));

    setSelectedSlots(prev => [...prev, ...newSlots]);
    setShowVendorModal(false);

    // Warn if over-selecting
    const currentServiceData = servicesData?.find(s => s.uuid === service.service.uuid);
    const productOption = currentServiceData?.product_options?.find(opt => opt.uuid === (service.option_id || service.option?.uuid));
    const requiredDuration = getEffectiveServiceDuration(productOption?.service_duration, effectiveSquareFootage);
    const selDate = dayjs(slots[0].start).format('YYYY-MM-DD');
    const existingCount = selectedSlots.filter(s => isSameService(s.service_id, service.service) && s.date === selDate).length;
    const newTotal = (existingCount + slots.length) * 15;
    if (newTotal > requiredDuration) {
      toast.info(`Note: You've selected more than the required ${requiredDuration} min for "${service.service.name}".`);
    }

    onVendorSelected?.(vendor.uuid || '');
  };

  const vendorColorStyles = Object.entries(vendorDistances || {})
    .map(([uuid, distance]) => `.vendor-${uuid}::before { background-color: ${getDistanceColor(distance)} !important; }`)
    .join('\n');

  const customStyles = `
    ${vendorColorStyles}
    .slot-recommended:not(.slot-selected) { background-color: #B2FFB2 !important; }
    .twilight-recommended-slot { border: 2px solid orange !important; }
    .recommended-corner-indicator {
      position: absolute; top: 0; right: 0; width: 0; height: 0;
      border-style: solid; border-width: 0 24px 24px 0;
      border-color: transparent #E8B611 transparent transparent; z-index: 10;
    }
    .recommended-corner-indicator svg { position: absolute; top: 2px; right: -22px; }
    .fc-header-toolbar {
      position: sticky !important; top: 0 !important; background: var(--${userType}-page-bg, #EEEEEE) !important;
      z-index: 10 !important; margin-bottom: 0 !important;
      padding-top: 10px; padding-bottom: 10px; border-bottom: 1px solid #BBBBBB;
    }
  `;


  return (
    <>
      <div
        ref={containerRef}
        className="mt-[20px] relative custom-scrollbar"
        style={{
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
        }}
      >
        {isCalculating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 gap-3 z-[100]">
            <Loader2 className="w-8 h-8 animate-spin text-[#6bae41]" />
            <span className="text-sm font-medium text-gray-500 font-alexandria">Calculating slots & travel times...</span>
          </div>
        )}
        <FullCalendar
          ref={calendarRef}
          initialDate={currentDate}
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
            const availableVendorIds: string[] = eventInfo.event.extendedProps?.availableVendorIds || [];

            const availableVendors = availableVendorIds
              .map((vid: string) => vendors.find(v => v.uuid === vid))
              .filter((v): v is VendorData => v !== undefined)
              .sort((a, b) => {
                const da = vendorDistances?.[a.uuid ?? ''] ?? Infinity;
                const db = vendorDistances?.[b.uuid ?? ''] ?? Infinity;
                return da - db;
              });

            const visibleVendors = availableVendors.slice(0, 3);
            const overflowVendors = availableVendors.slice(3);

            const content = (
              <div className={`fc-event-main-frame w-full h-full relative flex flex-col items-center justify-center p-1 gap-0.5 ${isTwilightRecommended ? 'twilight-recommended-slot' : ''}`}>
                {isAvailable && availableVendors.length > 0 ? (
                  <TooltipProvider delayDuration={200}>
                    <div className="flex flex-wrap gap-0.5 items-center justify-center w-full">
                      {visibleVendors.map(vendor => {
                        const distance = vendorDistances?.[vendor.uuid ?? ''];
                        const color = getDistanceColor(distance);
                        return (
                          <div key={vendor.uuid} className="flex items-center rounded-sm text-[9px] px-1.5 py-0.5 bg-white/90" style={{ borderLeft: `5px solid ${color}`, maxWidth: '100%' }}>
                            <span className="truncate text-[#424242] font-medium">{vendor.first_name}</span>
                          </div>
                        );
                      })}
                      {overflowVendors.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center rounded-sm text-[9px] px-1.5 py-0.5 bg-gray-200 cursor-pointer">
                              <span className="text-[#424242] font-medium">+{overflowVendors.length}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-white border border-gray-200 shadow-lg p-2">
                            <div className="flex flex-col gap-1">
                              {overflowVendors.map(vendor => {
                                const color = getDistanceColor(vendorDistances?.[vendor.uuid ?? '']);
                                return (
                                  <div key={vendor.uuid} className="flex items-center gap-1.5 text-[11px]">
                                    <div className="w-1 h-4 rounded-sm" style={{ backgroundColor: color, width: '4px' }} />
                                    <span className="text-[#424242]">{vendor.first_name} {vendor.last_name}</span>
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
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
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
          selectable={true}
          editable={true}
          headerToolbar={{ left: 'prev,next', center: 'title', right: '' }}
          titleFormat={{ weekday: 'short', day: 'numeric' }}
          datesSet={(arg) => {
            const calendarDate = dayjs(arg.start).format('YYYY-MM-DD');
            setCurrentDate(calendarDate);
            setSelectedDate(calendarDate);
          }}
        />

        {showVendorModal && clickedSlot && (
          <div
            onClick={() => setShowVendorModal(false)}
            style={{ height: '-webkit-fill-available' }}
            className="sticky top-0 inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          >
            <div onClick={e => e.stopPropagation()} className="rounded-lg p-4 w-[300px] shadow-lg" style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}>
              {availableSlotVendors.length === 0 ? (
                <p className="text-gray-500">No vendors available at this time.</p>
              ) : (
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {[...availableSlotVendors]
                    .sort((a, b) => {
                      const ta = vendorDistances?.[a.uuid ?? ''] ?? Infinity;
                      const tb = vendorDistances?.[b.uuid ?? ''] ?? Infinity;
                      return ta - tb;
                    })
                    .map(vendor => {
                      const distance = vendor.uuid ? vendorDistances?.[vendor.uuid] : undefined;
                      const color = getDistanceColor(distance);
                      return (
                        <li
                          key={vendor.uuid}
                          className="cursor-pointer p-2 flex items-center gap-1 hover:bg-gray-100"
                          onClick={async () => {
                            const currentServiceData = servicesData?.find(s => isSameService(s.uuid, service.service));
                            const productOption = currentServiceData?.product_options?.find(opt => opt.uuid === (service.option_id || service.option?.uuid));
                            const reqDuration = getEffectiveServiceDuration(productOption?.service_duration, effectiveSquareFootage);
                            const selDate = dayjs(clickedSlot.start).format('YYYY-MM-DD');
                            const existingSlots = selectedSlots.filter(s => isSameService(s.service_id, service.service) && s.date === selDate);
                            let remaining = Math.ceil(reqDuration / 15) - existingSlots.length;
                            if (remaining <= 0) remaining = 1;
                            const slotsToSelect = [];
                            for (let i = 0; i < remaining; i++) {
                              slotsToSelect.push({
                                start: dayjs(clickedSlot.start).add(i * 15, 'minute').toISOString(),
                                end: dayjs(clickedSlot.start).add((i + 1) * 15, 'minute').toISOString(),
                              });
                            }
                            await handleAssignVendor(vendor, slotsToSelect);
                          }}
                        >
                          <span style={{ backgroundColor: color }} className="flex h-[16px] w-[5px]"></span>
                          <span className="text-[14px] truncate">{vendor.first_name} {vendor.last_name}</span>
                          {distance !== undefined && (
                            <span className="text-gray-500 text-[12px] ml-auto">
                              ({distance < 60 ? `${Math.round(distance)} min` : `${Math.floor(distance / 60)}h ${Math.round(distance % 60)}m`})
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
        description={`Selecting a slot for this day will remove the previous day selection for ${service.title || (service.service?.name || "this service")}.`}
      />
    </>
  );
}