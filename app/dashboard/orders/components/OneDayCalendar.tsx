"use client";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import React, {
  useState,
  useEffect,
  useMemo,
  Dispatch,
  SetStateAction,
} from "react";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import { SelectedService } from "./Services";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { EventClickArg, DatesSetArg } from "@fullcalendar/core";
import { useOrderContext, Slot } from "../context/OrderContext";
import { VendorData } from "../[id]/page";
import { Order } from "../page";
import {
  convertVendorWorkHoursToPropertyTimezone,
  fetchTwilightTime,
  TwilightResponse,
  formatTwilightTime,
  convertUTCToTimezone,
} from "../orders";
import { toast } from "sonner";
import { Services } from "../../services/page";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getEffectiveServiceDuration } from "../utils/serviceTimeUtils";
import { Loader2 } from "lucide-react";
import ConfirmationDialog from "@/components/ConfirmationDialog";

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
  twilightData?: TwilightResponse | null;
}

interface MinimalSlot {
  date: string;
  start_time: string;
  end_time: string;
  vendor_id?: string;
  vendor?: {
    uuid?: string;
  };
  est_time?: string | number | null;
  distance?: string | number | null;
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
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    (typeof value === "string" && value.toLowerCase() === "true")
  );
}

function getLatestBookedEndBoundary(
  date: string,
  vendorId: string,
  allBookedSlots: MinimalSlot[],
): dayjs.Dayjs | null {
  const relevantBookedSlots =
    allBookedSlots
      ?.filter(
        (s) =>
          (s?.vendor?.uuid || s?.vendor_id) === vendorId && s?.date === date,
      )
      .map((s) => dayjs(`${s.date}T${s.end_time}`)) || [];

  if (relevantBookedSlots.length === 0) {
    return null;
  }

  return relevantBookedSlots.reduce((latest, current) =>
    current.isAfter(latest) ? current : latest,
  );
}

function getVendorRequiredSlotStart(
  vendor: VendorData,
  date: string,
  allBookedSlots: MinimalSlot[],
  vendorAvailableSlots: Slots[],
): string | null {
  if (
    !isNextBookingSlotOnlyEnabled(vendor) ||
    vendorAvailableSlots.length === 0
  ) {
    return null;
  }

  const vendorId = vendor.uuid ?? "";
  if (!vendorId) {
    return null;
  }

  const latestBookedEnd = getLatestBookedEndBoundary(
    date,
    vendorId,
    allBookedSlots,
  );
  const boundary = latestBookedEnd ?? dayjs(vendorAvailableSlots[0].start);
  const requiredSlot = vendorAvailableSlots.find(
    (slot) => !dayjs(slot.start).isBefore(boundary),
  );

  return requiredSlot?.start ?? null;
}

function isFloorPlanService(
  serviceTitle: string | undefined,
  serviceUuid: string | undefined,
  serviceId: string | number | undefined,
  servicesData: Services[],
): boolean {
  const currentServiceData = servicesData.find(
    (s) => s.uuid === serviceUuid || String(s.id) === String(serviceId),
  );
  const searchable = [
    serviceTitle || "",
    currentServiceData?.name || "",
    currentServiceData?.category?.name || "",
  ]
    .join(" ")
    .toLowerCase();

  return /2d\s*floor|2dfloor|floor\s*plan|floorplan/.test(searchable);
}

function isMatterportService(
  serviceTitle: string | undefined,
  serviceUuid: string | undefined,
  serviceId: string | number | undefined,
  servicesData: Services[],
): boolean {
  const currentServiceData = servicesData.find(
    (s) => s.uuid === serviceUuid || String(s.id) === String(serviceId),
  );
  const searchable = [
    serviceTitle || "",
    currentServiceData?.name || "",
    currentServiceData?.category?.name || "",
  ]
    .join(" ")
    .toLowerCase();

  return /matterport|3d\s*tour|3dtour|iguide/.test(searchable);
}

export interface ValidStartSlotResult {
  startSlots: Slots[];
  proposedSlotsMap: Map<string, { start: string; end: string }[]>;
}

export interface TravelBufferInfo {
  isValid: boolean;
  travelBeforeMins: number;
  travelAfterMins: number;
  serviceSlotsNeeded: number;
  totalSlotsNeeded: number;
}

export function getRequiredTravelBufferInfo(
  vendorId: string,
  date: string,
  candidateStart: dayjs.Dayjs,
  serviceDurationMins: number,
  isTravelRequired: boolean = true,
  currentPropertyAddress?: string,
  allBookedSlots: MinimalSlot[] = [],
  otherServiceSlots: MinimalSlot[] = [],
  selectedSlots: Slot[] = [],
): TravelBufferInfo {
  const serviceSlotsNeeded = Math.ceil(serviceDurationMins / 15);
  const serviceEnd = candidateStart.add(serviceDurationMins, "minute");

  if (!isTravelRequired) {
    // Case 6: Service does not require travel -> 0 travel mins
    return {
      isValid: true,
      travelBeforeMins: 0,
      travelAfterMins: 0,
      serviceSlotsNeeded,
      totalSlotsNeeded: serviceSlotsNeeded,
    };
  }

  type BookingRef = {
    start: dayjs.Dayjs;
    end: dayjs.Dayjs;
    address?: string;
    isSameProperty?: boolean;
  };

  const vendorBookings: BookingRef[] = [];

  allBookedSlots
    ?.filter(
      (s) => (s?.vendor?.uuid || s?.vendor_id) === vendorId && s?.date === date,
    )
    .forEach((s) => {
      const bStart = dayjs(`${s.date}T${s.start_time}`);
      const bEnd = dayjs(`${s.date}T${s.end_time}`);
      const addr =
        (s as any).order?.property?.address || (s as any).address || "";
      const isSame = !!(
        currentPropertyAddress &&
        addr &&
        currentPropertyAddress.trim().toLowerCase() ===
          addr.trim().toLowerCase()
      );
      vendorBookings.push({
        start: bStart,
        end: bEnd,
        address: addr,
        isSameProperty: isSame,
      });
    });

  selectedSlots
    ?.filter(
      (s) =>
        (s?.vendor_id === vendorId || s?.vendor?.uuid === vendorId) &&
        s?.date === date,
    )
    .forEach((s) => {
      const bStart = dayjs(`${s.date}T${s.start_time}`);
      const bEnd = dayjs(`${s.date}T${s.end_time}`);
      vendorBookings.push({
        start: bStart,
        end: bEnd,
        address: currentPropertyAddress || "",
        isSameProperty: true,
      });
    });

  otherServiceSlots
    ?.filter(
      (s) =>
        (s?.vendor_id === vendorId || s?.vendor?.uuid === vendorId) &&
        s?.date === date,
    )
    .forEach((s) => {
      const bStart = dayjs(`${s.date}T${s.start_time}`);
      const bEnd = dayjs(`${s.date}T${s.end_time}`);
      vendorBookings.push({
        start: bStart,
        end: bEnd,
        address: currentPropertyAddress || "",
        isSameProperty: true,
      });
    });

  vendorBookings.sort((a, b) => a.start.valueOf() - b.start.valueOf());

  // Find latest prior booking ending at or before candidateStart
  const priorBookings = vendorBookings.filter((b) =>
    b.end.isSameOrBefore(candidateStart),
  );
  const priorBooking =
    priorBookings.length > 0 ? priorBookings[priorBookings.length - 1] : null;

  // Find earliest subsequent booking starting at or after serviceEnd
  const subsequentBookings = vendorBookings.filter((b) =>
    b.start.isSameOrAfter(serviceEnd),
  );
  const subsequentBooking =
    subsequentBookings.length > 0 ? subsequentBookings[0] : null;

  let travelBeforeMins = 0;
  let travelAfterMins = 0;

  if (!priorBooking) {
    // Case 1: First booking of the day -> 0 mins travel before
    travelBeforeMins = 0;
  } else if (priorBooking.isSameProperty) {
    // Case 3: Same property -> 0 mins travel before
    travelBeforeMins = 0;
  } else {
    const gapBeforeMins = candidateStart.diff(priorBooking.end, "minute");
    if (gapBeforeMins >= 30) {
      // Case 5A: Existing gap (>= 30 mins) before candidateStart covers travel
      travelBeforeMins = 0;
    } else {
      travelBeforeMins = 30;
    }
  }

  if (!subsequentBooking) {
    if (travelBeforeMins > 0) {
      // Case 2: Prior booking at different property ending right at start -> append 30m travel buffer
      travelAfterMins = 30;
    } else {
      travelAfterMins = 0;
    }
  } else if (subsequentBooking.isSameProperty) {
    // Case 3: Same property next booking -> 0 travel after
    travelAfterMins = 0;
  } else {
    const gapAfterMins = subsequentBooking.start.diff(serviceEnd, "minute");
    if (gapAfterMins >= 30) {
      // Case 5A: Gap after is >= 30 mins -> covers travel
      travelAfterMins = 0;
    } else {
      // Case 5B: Insufficient travel time to reach next booking at diff property
      return {
        isValid: false,
        travelBeforeMins: 0,
        travelAfterMins: 0,
        serviceSlotsNeeded,
        totalSlotsNeeded: serviceSlotsNeeded,
      };
    }
  }

  if (travelBeforeMins > 0 && priorBooking) {
    const travelStart = candidateStart.subtract(travelBeforeMins, "minute");
    if (travelStart.isBefore(priorBooking.end)) {
      return {
        isValid: false,
        travelBeforeMins: 0,
        travelAfterMins: 0,
        serviceSlotsNeeded,
        totalSlotsNeeded: serviceSlotsNeeded,
      };
    }
  }

  const travelBeforeSlots = Math.ceil(travelBeforeMins / 15);
  const travelAfterSlots = Math.ceil(travelAfterMins / 15);
  const totalSlotsNeeded =
    serviceSlotsNeeded + travelBeforeSlots + travelAfterSlots;

  return {
    isValid: true,
    travelBeforeMins,
    travelAfterMins,
    serviceSlotsNeeded,
    totalSlotsNeeded,
  };
}

export function getVendorValidStartSlots(
  vendor: VendorData,
  date: string,
  workHours: WorkHours,
  allBookedSlots: MinimalSlot[],
  otherServiceSlots: MinimalSlot[] = [],
  vendorTimeOffs: VendorTimeOff[] = [],
  calendarEvents: CalendarEvent[] = [],
  requiredSlotsCount: number = 1,
  allowBookingThroughLunch: boolean = false,
  shouldEnforceRule: boolean = true,
  currentServiceUuid?: string,
  selectedSlots?: Slot[],
  interval = 15,
  isTwilightService: boolean = false,
  isTravelRequired: boolean = true,
  currentPropertyAddress?: string,
): ValidStartSlotResult {
  if (!workHours) return { startSlots: [], proposedSlotsMap: new Map() };

  const currentDateObj = dayjs(date);
  const dayOfWeek = currentDateObj.format("ddd").toLowerCase();
  const daySchedule = workHours.work_days?.find((d) => d.day === dayOfWeek);

  const isTwilightChecked =
    daySchedule &&
    (daySchedule.is_twilight === "1" ||
      daySchedule.is_twilight === 1 ||
      daySchedule.is_twilight === true);

  // If vendor has work_days and is off today, return no slots (unless twilight checked and it's a twilight service)
  if (
    daySchedule &&
    (daySchedule.is_off === "1" ||
      daySchedule.is_off === 1 ||
      daySchedule.is_off === true)
  ) {
    if (!isTwilightService || !isTwilightChecked) {
      return { startSlots: [], proposedSlotsMap: new Map() };
    }
  }

  const effectiveStartTime = daySchedule?.start_time || workHours.start_time;
  let effectiveEndTime = daySchedule?.end_time || workHours.end_time;

  // If vendor profile has twilight checked for this day and service is Twilight, extend work window to end of day
  if (isTwilightService && isTwilightChecked) {
    effectiveEndTime = "23:59:59";
  }

  if (!effectiveStartTime || !effectiveEndTime)
    return { startSlots: [], proposedSlotsMap: new Map() };

  const vendorId = vendor.uuid ?? "";
  const start = dayjs(`${date}T${effectiveStartTime}`);
  let end = dayjs(`${date}T${effectiveEndTime}`);

  if (end.isBefore(start) || end.isSame(start)) {
    end = end.add(1, "day");
  }

  const breakStart = workHours.break_start
    ? dayjs(`${date}T${workHours.break_start}`)
    : null;
  const breakEnd = workHours.break_end
    ? dayjs(`${date}T${workHours.break_end}`)
    : null;
  const hasLunchBreak = !!(
    breakStart &&
    breakEnd &&
    breakEnd.isAfter(breakStart)
  );

  const relevantBookedSlots =
    allBookedSlots
      ?.filter(
        (s) =>
          (s?.vendor?.uuid || s?.vendor_id) === vendorId && s?.date === date,
      )
      .map((s) => {
        const bStart = dayjs(`${s.date}T${s.start_time}`);
        const bEnd = dayjs(`${s.date}T${s.end_time}`);
        const travelMins = s.est_time ? Number(s.est_time) : 0;
        return {
          start: bStart,
          end: bEnd,
          travelStart:
            travelMins > 0 ? bStart.subtract(travelMins, "minute") : bStart,
          travelEnd: travelMins > 0 ? bEnd.add(travelMins, "minute") : bEnd,
        };
      }) || [];

  const relevantOtherSlots =
    otherServiceSlots
      ?.filter(
        (s) =>
          (s?.vendor_id === vendorId || s?.vendor?.uuid === vendorId) &&
          s?.date === date,
      )
      .map((s) => ({
        start: dayjs(`${s.date}T${s.start_time}`),
        end: dayjs(`${s.date}T${s.end_time}`),
      })) || [];

  const relevantTimeOffs = vendorTimeOffs
    ?.map((timeOff) => {
      const timeOffStartDate = timeOff.start_date || timeOff.date;
      const timeOffEndDate = timeOff.end_date || timeOff.date;
      const startDateObj = dayjs(timeOffStartDate);
      const endDateObj = dayjs(timeOffEndDate);

      const isDateInRange =
        currentDateObj.isSameOrAfter(startDateObj, "day") &&
        currentDateObj.isSameOrBefore(endDateObj, "day");

      if (!isDateInRange) return null;

      const isStartDay = currentDateObj.isSame(startDateObj, "day");
      const isEndDay = currentDateObj.isSame(endDateObj, "day");

      if (isStartDay && isEndDay) {
        return {
          start: dayjs(`${date}T${timeOff.start_time}`),
          end: dayjs(`${date}T${timeOff.end_time}`),
        };
      } else if (isStartDay) {
        return {
          start: dayjs(`${date}T${timeOff.start_time}`),
          end: null,
          type: "start",
        };
      } else if (isEndDay) {
        return {
          start: null,
          end: dayjs(`${date}T${timeOff.end_time}`),
          type: "end",
        };
      } else {
        return { type: "full" };
      }
    })
    .filter(Boolean);

  const relevantCalendarEvents = calendarEvents
    ?.filter(
      (event) =>
        event &&
        event.status !== "cancelled" &&
        dayjs(event.start).format("YYYY-MM-DD") === date,
    )
    .map((e) => ({ start: dayjs(e.start), end: dayjs(e.end) }));

  const now = dayjs();
  const isToday = currentDateObj.isSame(now, "day");

  interface IntervalStatus {
    start: dayjs.Dayjs;
    end: dayjs.Dayjs;
    isFreeWorking: boolean;
    isLunch: boolean;
  }
  const intervals: IntervalStatus[] = [];
  let cur = start;
  while (cur.isBefore(end)) {
    const nxt = cur.add(interval, "minute");

    const inBreak =
      hasLunchBreak &&
      ((cur.isSameOrAfter(breakStart) && cur.isBefore(breakEnd)) ||
        (nxt.isAfter(breakStart) && nxt.isSameOrBefore(breakEnd)) ||
        (cur.isBefore(breakStart) && nxt.isAfter(breakEnd)));

    const isBooked = relevantBookedSlots.some(
      (s) =>
        (cur.isSameOrAfter(s.start) && nxt.isSameOrBefore(s.end)) ||
        (cur.isSameOrAfter(s.travelStart) && nxt.isSameOrBefore(s.travelEnd)),
    );

    const isConflict = relevantOtherSlots.some(
      (s) => cur.isSameOrAfter(s.start) && nxt.isSameOrBefore(s.end),
    );

    const isTimeOff = relevantTimeOffs.some((timeOff) => {
      if (!timeOff) return false;
      if (timeOff.type === "full") return true;
      if (timeOff.type === "start") return cur.isSameOrAfter(timeOff.start);
      if (timeOff.type === "end") return cur.isBefore(timeOff.end);
      return (
        (cur.isSameOrAfter(timeOff.start) && cur.isBefore(timeOff.end)) ||
        (nxt.isAfter(timeOff.start) && nxt.isSameOrBefore(timeOff.end)) ||
        (cur.isBefore(timeOff.start) && nxt.isAfter(timeOff.end))
      );
    });

    const isCalendarEvent = relevantCalendarEvents.some((event) => {
      return (
        (cur.isSameOrAfter(event.start) && cur.isBefore(event.end)) ||
        (nxt.isAfter(event.start) && nxt.isSameOrBefore(event.end)) ||
        (cur.isBefore(event.start) && nxt.isAfter(event.end))
      );
    });

    const isPastTime = isToday && cur.isBefore(now);

    const isFreeWorking =
      !inBreak &&
      !isBooked &&
      !isConflict &&
      !isTimeOff &&
      !isCalendarEvent &&
      !isPastTime;

    intervals.push({
      start: cur,
      end: nxt,
      isFreeWorking,
      isLunch: !!inBreak,
    });

    cur = nxt;
  }

  const validStartSlots: Slots[] = [];
  const proposedSlotsMap = new Map<string, { start: string; end: string }[]>();

  for (let i = 0; i < intervals.length; i++) {
    const candidate = intervals[i];
    if (!candidate.isFreeWorking) continue;

    const travelInfo = getRequiredTravelBufferInfo(
      vendorId,
      date,
      candidate.start,
      requiredSlotsCount * 15,
      isTravelRequired,
      currentPropertyAddress,
      allBookedSlots,
      otherServiceSlots,
      selectedSlots,
    );

    if (!travelInfo.isValid) continue;

    const travelBeforeSlots = Math.ceil(travelInfo.travelBeforeMins / 15);
    const serviceStartIdx = i + travelBeforeSlots;
    if (
      serviceStartIdx >= intervals.length ||
      !intervals[serviceStartIdx].isFreeWorking
    )
      continue;

    let workingCount = 0;
    const collected: { start: string; end: string }[] = [];
    let j = serviceStartIdx;

    while (workingCount < requiredSlotsCount && j < intervals.length) {
      const step = intervals[j];
      if (step.isFreeWorking) {
        collected.push({
          start: step.start.toISOString(),
          end: step.end.toISOString(),
        });
        workingCount++;
        j++;
      } else if (allowBookingThroughLunch && step.isLunch && workingCount > 0) {
        collected.push({
          start: step.start.toISOString(),
          end: step.end.toISOString(),
        });
        j++;
      } else {
        break;
      }
    }

    if (collected.length > 0) {
      const startISO = candidate.start.toISOString();
      const endISO = candidate.end.toISOString();
      validStartSlots.push({
        id: startISO,
        start: startISO,
        end: endISO,
        title: "Available",
        className: "slot-available",
        vendor_id: vendorId,
      });
      proposedSlotsMap.set(startISO, collected);
    }
  }

  // Handle Next Booking Slot Only rule
  if (
    shouldEnforceRule &&
    isNextBookingSlotOnlyEnabled(vendor) &&
    validStartSlots.length > 0
  ) {
    const requiredSlotStart = getVendorRequiredSlotStart(
      vendor,
      date,
      allBookedSlots,
      validStartSlots,
    );
    if (requiredSlotStart) {
      const selectedSlotStarts =
        selectedSlots
          ?.filter(
            (s) =>
              (s.vendor_id === vendor.uuid || s.vendor?.uuid === vendor.uuid) &&
              s.service_id === currentServiceUuid &&
              s.date === date,
          )
          .map((s) => dayjs(`${s.date}T${s.start_time}`).toISOString()) || [];

      const filteredStartSlots = validStartSlots.filter(
        (slot) =>
          dayjs(slot.start).isSame(requiredSlotStart) ||
          selectedSlotStarts.includes(slot.start),
      );

      return {
        startSlots: filteredStartSlots,
        proposedSlotsMap,
      };
    }
  }

  return {
    startSlots: validStartSlots,
    proposedSlotsMap,
  };
}

function generateAllDaySlots(
  date: string,
  interval = 15,
  startTime = "00:00:00",
  endTime = "24:00:00",
): Slots[] {
  const slots: Slots[] = [];
  const start = dayjs(`${date}T${startTime}`);
  let end = dayjs(`${date}T${endTime}`);
  if (endTime === "24:00:00" || endTime === "24:00") {
    end = dayjs(`${date}T00:00:00`).add(1, "day");
  }
  let current = start;

  while (current.isBefore(end)) {
    const next = current.add(interval, "minute");
    slots.push({
      start: current.toISOString(),
      end: next.toISOString(),
      title: "",
      className: "slot-unavailable",
    });
    current = next;
  }

  return slots;
}

export function getVendorDayBounds(
  date: string,
  vendors: VendorData[],
  propertyTimezone: string | undefined,
  isTwilightService: boolean,
  twilightData: TwilightResponse | null,
  selectedSlotsOnDate: Slot[] = [],
  scheduleOverride: number = 0,
): { startTime: string; endTime: string } {
  let earliestMinutes = 24 * 60;
  let latestMinutes = 0;

  vendors.forEach((vendor) => {
    if (!vendor.uuid) return;
    const vendorHasNextBookingFlag = isNextBookingSlotOnlyEnabled(vendor);
    const useFullDay = scheduleOverride === 1 && !vendorHasNextBookingFlag;

    if (useFullDay) {
      earliestMinutes = Math.min(earliestMinutes, 0);
      latestMinutes = Math.max(latestMinutes, 24 * 60);
      return;
    }

    if (!vendor.work_hours) return;

    const vendorTimezone = vendor.work_hours.timezone || "America/Vancouver";
    const targetTimezone = propertyTimezone || "America/Vancouver";

    const convertedWH = convertVendorWorkHoursToPropertyTimezone(
      date,
      vendor.work_hours,
      vendorTimezone,
      targetTimezone,
    );

    if (!convertedWH) return;

    const currentDateObj = dayjs(date);
    const dayOfWeek = currentDateObj.format("ddd").toLowerCase();
    const daySchedule = convertedWH.work_days?.find((d) => d.day === dayOfWeek);

    const isTwilightChecked =
      daySchedule &&
      (daySchedule.is_twilight === "1" ||
        daySchedule.is_twilight === 1 ||
        daySchedule.is_twilight === true);
    const isOff =
      daySchedule &&
      (daySchedule.is_off === "1" ||
        daySchedule.is_off === 1 ||
        daySchedule.is_off === true);

    if (isOff && (!isTwilightService || !isTwilightChecked)) {
      return;
    }

    const startTimeStr = daySchedule?.start_time || convertedWH.start_time;
    let endTimeStr = daySchedule?.end_time || convertedWH.end_time;

    if (isTwilightService && isTwilightChecked) {
      if (twilightData?.sunset) {
        let windowEndStr = "21:00:00";
        if ((twilightData as any).window_end) {
          windowEndStr = (twilightData as any).window_end;
        } else {
          const sunsetLocalStr = convertUTCToTimezone(
            twilightData.sunset,
            targetTimezone,
          );
          const twEnd = dayjs(`${date}T${sunsetLocalStr}`).add(30, "minute");
          windowEndStr = twEnd.format("HH:mm:ss");
        }
        if (endTimeStr && windowEndStr > endTimeStr) {
          endTimeStr = windowEndStr;
        }
      } else {
        endTimeStr = "22:00:00";
      }
    }

    if (startTimeStr) {
      const parts = startTimeStr.split(":").map(Number);
      if (!isNaN(parts[0])) {
        const startMins = parts[0] * 60 + (parts[1] || 0);
        earliestMinutes = Math.min(earliestMinutes, startMins);
      }
    }
    if (endTimeStr) {
      const parts = endTimeStr.split(":").map(Number);
      if (!isNaN(parts[0])) {
        const endMins = parts[0] * 60 + (parts[1] || 0);
        latestMinutes = Math.max(latestMinutes, endMins);
      }
    }
  });

  selectedSlotsOnDate.forEach((s) => {
    if (s.start_time) {
      const parts = s.start_time.split(":").map(Number);
      if (!isNaN(parts[0])) {
        earliestMinutes = Math.min(
          earliestMinutes,
          parts[0] * 60 + (parts[1] || 0),
        );
      }
    }
    if (s.end_time) {
      const parts = s.end_time.split(":").map(Number);
      if (!isNaN(parts[0])) {
        latestMinutes = Math.max(
          latestMinutes,
          parts[0] * 60 + (parts[1] || 0),
        );
      }
    }
  });

  if (earliestMinutes >= latestMinutes) {
    earliestMinutes = 8 * 60;
    latestMinutes = 17 * 60;
  }

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    return `${hh}:${mm}:00`;
  };

  const startTime = formatMinutes(earliestMinutes);
  const endTime =
    latestMinutes >= 24 * 60 ? "24:00:00" : formatMinutes(latestMinutes);

  return { startTime, endTime };
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
  recommendTimeMap,
  serviceKey,
  vendorDistances,
  propertyTimezone,
  masterDate,
  externalSetSelectedSlots,
  externalSelectedSlots,
  externalBookedSlots,
  externalVendorsData,
  externalServicesData,
  onVendorSelected,
  isCalculating,
  scheduleOverride,
  twilightData: externalTwilightData,
}: CalendarProps) {
  const {
    selectedSlots: contextSelectedSlots,
    setSelectedSlots: contextSetSelectedSlots,
    selectedServices,
    vendorsData: contextVendorsData,
    ordersData,
    selectedCurrentListing,
    tempPropertyData,
    servicesData: contextServicesData,
    portalSettings,
  } = useOrderContext();

  // Use external data if provided (for BookNow), otherwise use context
  const selectedSlots = externalSelectedSlots || contextSelectedSlots;
  const setSelectedSlots = externalSetSelectedSlots || contextSetSelectedSlots;
  const vendorsData = externalVendorsData || contextVendorsData;
  const servicesData = externalServicesData || contextServicesData;
  const { id } = useParams();

  const minDate = React.useMemo(() => {
    const serviceSlotDates =
      selectedSlots
        ?.filter(
          (s) =>
            s.service_id === service.uuid ||
            String(s.service_id) === String(service.id),
        )
        .map((s) => s.date)
        .filter(Boolean) || [];

    if (serviceSlotDates.length > 0) {
      const earliest = [...serviceSlotDates].sort()[0];
      const [y, m, d] = earliest.split("-").map(Number);
      const earliestObj = new Date(y, m - 1, d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (earliestObj < today) {
        return earliestObj;
      }
    }

    const date = new Date();
    date.setHours(0, 0, 0, 0);

    if (
      portalSettings?.disable_next_day_booking &&
      portalSettings.booking_cutoff_time
    ) {
      const now = new Date();
      const [cutoffHour, cutoffMinute] = portalSettings.booking_cutoff_time
        .split(":")
        .map(Number);
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffHour, cutoffMinute, 0, 0);

      if (now >= cutoffTime) {
        date.setDate(date.getDate() + 2);
      } else {
        date.setDate(date.getDate() + 1);
      }
    }
    return date;
  }, [portalSettings, selectedSlots, service.uuid, service.id]);

  const currentServiceForBorder = servicesData?.find(
    (s) => s.uuid === service.uuid,
  );
  const productOptionForBorder = currentServiceForBorder?.product_options?.find(
    (option) => option.uuid === service.option_id,
  );
  const squareFootageForBorder =
    tempPropertyData?.square_footage || selectedCurrentListing?.square_footage;
  const requiredDurationForBorder = getEffectiveServiceDuration(
    productOptionForBorder,
    currentServiceForBorder,
    squareFootageForBorder,
  );
  const requiredSlotsCountForBorder = Math.ceil(requiredDurationForBorder / 15);

  const hasSelectedSlotsForBorder = selectedSlots.some(
    (s) => s.service_id === service.uuid,
  );
  const currentServiceSlotsCountForBorder = selectedSlots.filter(
    (slot: Slot) => slot.service_id === service.uuid,
  ).length;
  const isUnderScheduled =
    hasSelectedSlotsForBorder &&
    currentServiceSlotsCountForBorder < requiredSlotsCountForBorder;

  const existingSlot = selectedSlots.find(
    (s: Slot) =>
      s.service_id === service.uuid ||
      String(s.service_id) === String(service.id),
  );
  const initialDateStr = existingSlot
    ? existingSlot.date
    : dayjs(masterDate).format("YYYY-MM-DD");

  const [events, setEvents] = useState<Slots[]>([]);
  const [slotMinTime, setSlotMinTime] = useState<string>("08:00:00");
  const [slotMaxTime, setSlotMaxTime] = useState<string>("18:00:00");
  const [currentDate, setCurrentDate] = useState<string>(initialDateStr);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [clickedSlot, setClickedSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [availableSlotVendors, setAvailableSlotVendors] = useState<
    VendorData[]
  >([]);
  const [twilightData, setTwilightData] = useState<TwilightResponse | null>(
    null,
  );
  const [showConfirmDayChange, setShowConfirmDayChange] = useState(false);
  const [showConfirmVendorChange, setShowConfirmVendorChange] = useState(false);
  const [showConfirmReplaceSelection, setShowConfirmReplaceSelection] =
    useState(false);
  const [pendingSelection, setPendingSelection] = useState<any | null>(null);
  const [pendingVendorAssignment, setPendingVendorAssignment] = useState<{
    vendor: VendorData;
    slots: { start: string; end: string }[];
    previousVendorName?: string;
  } | null>(null);
  const [pendingReplaceSelection, setPendingReplaceSelection] = useState<{
    info: EventClickArg;
    proposedSlots: { start: string; end: string }[];
    slotTime: string;
  } | null>(null);
  const [showConfirmDeselect, setShowConfirmDeselect] = useState(false);
  const [pendingDeselect, setPendingDeselect] = useState<{
    slotStart: string;
    slotEnd: string;
    selectedDate: string;
    serviceSlotsForDate: Slot[];
    clickedEvent: any;
    slotRangeText: string;
  } | null>(null);
  const [showAgain, setShowAgain] = useState(true);
  const [hoveredSlotStart, setHoveredSlotStart] = useState<string | null>(null);
  const calendarRef = React.useRef<FullCalendar>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hasJumpedToInitialDate = React.useRef(false);
  const hasScrolledToFirstSlot = React.useRef(false);
  const lastMasterDateStr = React.useRef(initialDateStr);

  useEffect(() => {
    if (
      existingSlot &&
      !hasJumpedToInitialDate.current &&
      calendarRef.current
    ) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(existingSlot.date);
      setCurrentDate(existingSlot.date);
      hasJumpedToInitialDate.current = true;
    }
  }, [existingSlot]);

  // React to masterDate change
  useEffect(() => {
    const formattedDate = dayjs(masterDate).format("YYYY-MM-DD");
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
    const selectedServiceIds = selectedServices.map((s) => s.uuid);
    setSelectedSlots((prev: Slot[]) =>
      prev.filter((slot: Slot) => selectedServiceIds.includes(slot.service_id)),
    );
  }, [selectedServices, setSelectedSlots]);

  const destinationAddress = selectedCurrentListing
    ? `${selectedCurrentListing.address},${selectedCurrentListing.city},${selectedCurrentListing.country}`
    : tempPropertyData
      ? `${tempPropertyData.address},${tempPropertyData.city},${tempPropertyData.country}`
      : "";

  const orderIdParam = Array.isArray(id) ? id[0] : id;

  const AllBookedSlots = useMemo(() => {
    if (externalBookedSlots) {
      return externalBookedSlots;
    }
    return (
      ordersData
        ?.filter((order: Order) => order.uuid !== orderIdParam)
        .map((order: Order) => order.slots)
        .flat() || []
    );
  }, [ordersData, orderIdParam, externalBookedSlots]);

  const computedEvents = useMemo(() => {
    const date = currentDate;
    const filteredVendors = vendorsData.filter(
      (vendor) => vendor.uuid && selectedVendors?.includes(vendor.uuid),
    );

    const selectedSlotsOnCurrentDate = selectedSlots.filter((s: Slot) => {
      const sidMatch =
        s.service_id === service.uuid ||
        String(s.service_id) === String(service.id);
      return sidMatch && s.date === date;
    });

    if (
      filteredVendors.length === 0 &&
      selectedSlotsOnCurrentDate.length === 0
    ) {
      return { events: [], minTime: "08:00:00", maxTime: "17:00:00" };
    }

    const currentServiceDataForSlots = servicesData.find(
      (s) => s.uuid === service.uuid || String(s.id) === String(service.id),
    );
    const isTwilightService =
      currentServiceDataForSlots?.category?.name === "Twilight Photos" ||
      service?.title?.includes("Twilight") ||
      (service as any)?.is_twilight === true;

    const { startTime: dayStartTime, endTime: dayEndTime } = getVendorDayBounds(
      date,
      filteredVendors,
      propertyTimezone,
      isTwilightService,
      twilightData,
      selectedSlotsOnCurrentDate,
      scheduleOverride,
    );

    // When filteredVendors is empty but there are selected slots to display,
    // generate slot grid for day bounds so matchingSelected can find the right
    // time positions and mark them as slot-selected.
    if (filteredVendors.length === 0 && selectedSlotsOnCurrentDate.length > 0) {
      const fullDaySlots = generateAllDaySlots(
        date,
        15,
        dayStartTime,
        dayEndTime,
      );
      const currentServiceData = servicesData.find(
        (s) => s.uuid === service.uuid || String(s.id) === String(service.id),
      );
      const mappedEvents = fullDaySlots.map((slot) => {
        const matchingSelected = selectedSlotsOnCurrentDate.find((s) => {
          const sStart = dayjs(`${s.date} ${s.start_time}`);
          const sEnd = dayjs(`${s.date} ${s.end_time}`);
          const slotStart = dayjs(slot.start);
          const slotEnd = dayjs(slot.end);
          return (
            sStart.isSame(slotStart, "minute") && sEnd.isSame(slotEnd, "minute")
          );
        });
        if (matchingSelected) {
          const vendorId =
            matchingSelected.vendor?.uuid || matchingSelected.vendor_id;
          const matchedVendor = vendorsData.find((v) => v.uuid === vendorId);
          const vendorName = matchedVendor
            ? `${matchedVendor.first_name} ${matchedVendor.last_name}`
            : "Unknown";
          const isTwilightService =
            currentServiceData?.category?.name === "Twilight Photos" ||
            service?.title?.includes("Twilight");
          return {
            ...slot,
            title: `${vendorName}\n${service.title}`,
            className: `slot-selected vendor-${vendorId}`,
            extendedProps: {
              availableVendorIds: [],
              twilightRecommended: isTwilightService,
            },
          };
        }
        return {
          ...slot,
          title: "Unavailable",
          className: "slot-unavailable",
          extendedProps: { availableVendorIds: [] },
        };
      });
      return {
        events: mappedEvents,
        minTime: dayStartTime,
        maxTime: dayEndTime,
      };
    }

    const fullDaySlots = generateAllDaySlots(
      date,
      15,
      dayStartTime,
      dayEndTime,
    );
    const slotVendorsMap = new Map<string, string[]>();

    const otherServiceSlots = selectedSlots.filter(
      (s: Slot) => s.service_id !== service.uuid && s.date === date,
    );

    const squareFootageForSlots =
      tempPropertyData?.square_footage ||
      selectedCurrentListing?.square_footage;
    const productOptionForSlots =
      currentServiceDataForSlots?.product_options?.find(
        (option) =>
          (service.option_id && option.uuid === service.option_id) ||
          (service.option_id &&
            String(option.id) === String(service.option_id)),
      );
    const requiredDurationForSlots = getEffectiveServiceDuration(
      productOptionForSlots,
      currentServiceDataForSlots,
      squareFootageForSlots,
    );
    const requiredSlotsCountForService = Math.max(
      1,
      Math.ceil(requiredDurationForSlots / 15),
    );
    const isFloorPlan = isFloorPlanService(
      service.title,
      service.uuid,
      service.id,
      servicesData,
    );
    const isMatterport = isMatterportService(
      service.title,
      service.uuid,
      service.id,
      servicesData,
    );
    const isSpecialService = isFloorPlan || isMatterport;

    const allowBookingThroughLunch =
      portalSettings?.allow_booking_through_lunch ?? false;

    filteredVendors.forEach((vendor) => {
      const vendorId = vendor.uuid ?? "";
      if (!vendorId) return;

      const vendorHasNextBookingFlag = isNextBookingSlotOnlyEnabled(vendor);
      const shouldEnforceForVendor = isSpecialService
        ? vendorHasNextBookingFlag
        : true;

      const useFullDay =
        scheduleOverride === 1 &&
        !(isSpecialService && vendorHasNextBookingFlag);

      if (useFullDay) {
        const fullDayWorkHours: WorkHours = {
          start_time: "00:00:00",
          end_time: "23:59:59",
          timezone: propertyTimezone || "America/Vancouver",
          work_days: [
            {
              day: dayjs(currentDate).format("ddd").toLowerCase(),
              start_time: "00:00:00",
              end_time: "23:59:59",
              is_off: 0,
              is_twilight: 0,
            },
          ],
        };

        const { startSlots } = getVendorValidStartSlots(
          vendor,
          currentDate,
          fullDayWorkHours,
          AllBookedSlots,
          otherServiceSlots,
          vendor.additional_breaks || [],
          vendor.calendar_events || [],
          requiredSlotsCountForService,
          allowBookingThroughLunch,
          shouldEnforceForVendor,
          service.uuid,
          selectedSlots,
          15,
          isTwilightService,
          currentServiceDataForSlots?.is_travel_required !== false,
          destinationAddress,
        );

        startSlots.forEach((slot) => {
          const key = `${slot.start}_${slot.end}`;
          if (!slotVendorsMap.has(key)) slotVendorsMap.set(key, []);
          slotVendorsMap.get(key)!.push(vendorId);
        });
      } else {
        if (!vendor.work_hours) return;

        const vendorTimezone =
          vendor.work_hours.timezone || "America/Vancouver";
        const targetTimezone = propertyTimezone || "America/Vancouver";

        const convertedWorkHours = convertVendorWorkHoursToPropertyTimezone(
          currentDate,
          vendor.work_hours,
          vendorTimezone,
          targetTimezone,
        );

        const { startSlots } = getVendorValidStartSlots(
          vendor,
          currentDate,
          convertedWorkHours,
          AllBookedSlots,
          otherServiceSlots,
          vendor.additional_breaks || [],
          vendor.calendar_events || [],
          requiredSlotsCountForService,
          allowBookingThroughLunch,
          shouldEnforceForVendor,
          service.uuid,
          selectedSlots,
          15,
          isTwilightService,
          currentServiceDataForSlots?.is_travel_required !== false,
          destinationAddress,
        );

        startSlots.forEach((slot) => {
          const key = `${slot.start}_${slot.end}`;
          if (!slotVendorsMap.has(key)) slotVendorsMap.set(key, []);
          slotVendorsMap.get(key)!.push(vendorId);
        });
      }
    });

    let availableSlotsCount = 0;
    const finalSlots = fullDaySlots.map((slot) => {
      const key = `${slot.start}_${slot.end}`;
      const availableVendorIds = slotVendorsMap.get(key) || [];

      let isTwilightRestricted = false;
      const currentServiceData = servicesData.find(
        (s) => s.uuid === service.uuid || String(s.id) === String(service.id),
      );
      const isTwilightServiceForSlot =
        currentServiceData?.category?.name === "Twilight Photos" ||
        service?.title?.includes("Twilight") ||
        (service as any)?.is_twilight === true;

      if (isTwilightServiceForSlot && twilightData?.sunset) {
        let windowStart: dayjs.Dayjs;
        let windowEnd: dayjs.Dayjs;

        if (
          (twilightData as any).window_start &&
          (twilightData as any).window_end
        ) {
          windowStart = dayjs(`${date}T${(twilightData as any).window_start}`);
          windowEnd = dayjs(`${date}T${(twilightData as any).window_end}`);
        } else {
          const targetTimezone = propertyTimezone || "America/Vancouver";
          const sunsetLocalTimeStr = convertUTCToTimezone(
            twilightData.sunset,
            targetTimezone,
          );
          const twilightTime = dayjs(`${date}T${sunsetLocalTimeStr}`);
          windowStart = twilightTime.subtract(45, "minute");
          windowEnd = twilightTime.add(15, "minute");
        }

        const slotStartTime = dayjs(slot.start);
        if (
          slotStartTime.isBefore(windowStart) ||
          slotStartTime.isAfter(windowEnd)
        ) {
          isTwilightRestricted = true;
        }
      }

      const matchingSelected = selectedSlots.find((s) => {
        const sidMatch =
          s.service_id === service.uuid ||
          String(s.service_id) === String(service.id);
        const dateMatch = s.date === date;
        const sStart = dayjs(`${s.date} ${s.start_time}`);
        const sEnd = dayjs(`${s.date} ${s.end_time}`);
        const slotStart = dayjs(slot.start);
        const slotEnd = dayjs(slot.end);
        return (
          sidMatch &&
          dateMatch &&
          sStart.isSame(slotStart, "minute") &&
          sEnd.isSame(slotEnd, "minute")
        );
      });

      if (matchingSelected) {
        const vendorId =
          matchingSelected.vendor?.uuid || matchingSelected.vendor_id;
        const matchedVendor = vendorsData.find((v) => v.uuid === vendorId);
        const vendorName = matchedVendor
          ? `${matchedVendor.first_name} ${matchedVendor.last_name}`
          : "Unknown";
        const isTwilightService =
          currentServiceData?.category?.name === "Twilight Photos" ||
          service?.title?.includes("Twilight");
        let isRecommended = false;
        if (isTwilightService || recommendTimeMap[serviceKey] === 1) {
          isRecommended =
            availableVendorIds.length > 0 && !isTwilightRestricted;
        }
        return {
          ...slot,
          title: `${vendorName}\n${service.title}`,
          className: `slot-selected vendor-${vendorId}${isRecommended ? " slot-recommended" : ""}`,
          extendedProps: {
            availableVendorIds: [],
            twilightRecommended: isTwilightService && isRecommended,
          },
        };
      }

      if (availableVendorIds.length > 0 && !isTwilightRestricted) {
        let isRecommended = false;
        const isTwilightService =
          currentServiceData?.category?.name === "Twilight Photos" ||
          service?.title?.includes("Twilight");

        let maxRecommended = 1;
        if (isTwilightService) {
          const productOption = currentServiceData?.product_options?.find(
            (option) => option.uuid === service.option_id,
          );
          const squareFootage =
            tempPropertyData?.square_footage ||
            selectedCurrentListing?.square_footage;
          const requiredDuration = getEffectiveServiceDuration(
            productOption,
            currentServiceData,
            squareFootage,
          );
          maxRecommended = Math.ceil(requiredDuration / 15);
        }

        if (
          availableSlotsCount < maxRecommended &&
          (recommendTimeMap[serviceKey] === 1 || isTwilightService)
        ) {
          isRecommended = true;
          availableSlotsCount++;
        }

        if (isRecommended) {
          return {
            ...slot,
            title: "Recommended",
            className: "slot-available slot-recommended",
            extendedProps: {
              availableVendorIds,
              twilightRecommended: isTwilightService,
            },
          };
        }

        return {
          ...slot,
          title: "",
          className: "slot-available",
          extendedProps: { availableVendorIds },
        };
      }

      return {
        ...slot,
        title: "Unavailable",
        className: "slot-unavailable",
        extendedProps: { availableVendorIds: [] },
      };
    });

    return {
      events: finalSlots,
      minTime: dayStartTime,
      maxTime: dayEndTime,
    };
  }, [
    vendorsData,
    currentDate,
    selectedVendors,
    selectedSlots,
    service,
    AllBookedSlots,
    propertyTimezone,
    recommendTimeMap,
    serviceKey,
    scheduleOverride,
    twilightData,
    servicesData,
    tempPropertyData,
    selectedCurrentListing,
    portalSettings?.allow_booking_through_lunch,
    destinationAddress,
  ]);

  // Sync computedEvents to state only when they actually change (reference-stable write)
  useEffect(() => {
    setEvents(computedEvents.events);
    if (computedEvents.minTime) setSlotMinTime(computedEvents.minTime);
    if (computedEvents.maxTime) setSlotMaxTime(computedEvents.maxTime);
  }, [computedEvents]);

  useEffect(() => {
    async function loadTwilight() {
      if (!selectedCurrentListing && !tempPropertyData) return;
      const address = selectedCurrentListing
        ? `${selectedCurrentListing.address}, ${selectedCurrentListing.city}, ${selectedCurrentListing.country}`
        : `${tempPropertyData?.address}, ${tempPropertyData?.city}, ${tempPropertyData?.country}`;
      const result = await fetchTwilightTime(address, currentDate);
      if (result) setTwilightData(result);
    }

    if (
      externalTwilightData !== undefined &&
      masterDate &&
      dayjs(currentDate).format("YYYY-MM-DD") ===
        dayjs(masterDate).format("YYYY-MM-DD")
    ) {
      setTwilightData(externalTwilightData);
      return;
    }

    loadTwilight();
  }, [
    selectedCurrentListing,
    tempPropertyData,
    currentDate,
    externalTwilightData,
    masterDate,
  ]);

  useEffect(() => {
    if (!containerRef.current || events.length === 0) return;

    if (!hasScrolledToFirstSlot.current) {
      setTimeout(() => {
        if (!containerRef.current) return;

        // Try to find the element in the DOM
        // Priority: Selected > Recommended > Available
        let targetEl = containerRef.current.querySelector(".slot-selected");

        if (!targetEl) {
          targetEl = containerRef.current.querySelector(".slot-recommended");
        }

        if (!targetEl) {
          targetEl = containerRef.current.querySelector(".slot-available");
        }

        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
          hasScrolledToFirstSlot.current = true;
        }
      }, 300);
    }
  }, [events]);

  const hasCheckedForNextAvailableDay = React.useRef(false);

  // Auto-jump to next available day ONLY ONCE if current day has NO available slots
  useEffect(() => {
    // If external masterDate is passed (parent controls date), do NOT auto-jump
    if (masterDate) return;

    const hasAnyAvailableSlot = events.some((e) =>
      e.className?.includes("slot-available"),
    );

    if (!hasAnyAvailableSlot && !hasCheckedForNextAvailableDay.current) {
      hasCheckedForNextAvailableDay.current = true;

      const searchForNextAvailableDay = () => {
        const filteredVendors = vendorsData.filter(
          (vendor) => vendor.uuid && selectedVendors?.includes(vendor.uuid),
        );

        if (filteredVendors.length === 0) return;

        // ... search logic implementation ...
      };

      searchForNextAvailableDay();
    }
  }, [
    events,
    vendorsData,
    selectedVendors,
    currentDate,
    selectedSlots,
    service,
    AllBookedSlots,
    propertyTimezone,
    setSelectedDate,
    servicesData,
    scheduleOverride,
    portalSettings?.allow_booking_through_lunch,
    tempPropertyData?.square_footage,
    selectedCurrentListing?.square_footage,
    destinationAddress,
    masterDate,
  ]);

  const vendorsKey = JSON.stringify(selectedVendors);
  const recommendVal = recommendTimeMap?.[serviceKey];
  useEffect(() => {
    hasScrolledToFirstSlot.current = false;
    // Only reset the auto-jump guard on vendor or recommendation changes, NOT on date changes.
    // The lastAutoJumpDate ref already prevents re-running on the same date.
    hasCheckedForNextAvailableDay.current = false;
  }, [vendorsKey, recommendVal]); // intentionally exclude currentDate

  useEffect(() => {
    hasScrolledToFirstSlot.current = false;
  }, [currentDate]);

  // ── Hover preview computation ──────────────────────────────────────────────
  // Determines which slots to highlight and whether the preview is valid
  // (i.e., enough consecutive available slots exist for the full service duration).
  const hoverPreviewSlots = useMemo(() => {
    if (!hoveredSlotStart) return { slots: [] as string[], isValid: false };

    const currentServiceForHover = servicesData?.find(
      (s) => s.uuid === service.uuid,
    );
    const productOptionForHover = currentServiceForHover?.product_options?.find(
      (opt) => opt.uuid === service.option_id,
    );
    const squareFootageForHover =
      tempPropertyData?.square_footage ||
      selectedCurrentListing?.square_footage;
    const requiredDurationForHover = getEffectiveServiceDuration(
      productOptionForHover,
      currentServiceForHover,
      squareFootageForHover,
    );
    const requiredSlotsForHover = Math.max(
      1,
      Math.ceil(requiredDurationForHover / 15),
    );

    // Account for already-selected slots so the preview only shows remaining needed
    const alreadySelectedCount = selectedSlots.filter(
      (s: Slot) => s.service_id === service.uuid,
    ).length;
    const remainingNeeded = Math.max(
      1,
      requiredSlotsForHover - alreadySelectedCount,
    );

    const hoveredEvent = events.find((e) => e.start === hoveredSlotStart);
    if (!hoveredEvent || !hoveredEvent.className?.includes("slot-available")) {
      return { slots: [] as string[], isValid: false };
    }

    const preview: string[] = [];
    for (let i = 0; i < remainingNeeded; i++) {
      const slotStart = dayjs(hoveredSlotStart)
        .add(i * 15, "minute")
        .toISOString();
      const candidate = events.find((e) => e.start === slotStart);
      if (!candidate || !candidate.className?.includes("slot-available")) break;
      preview.push(slotStart);
    }

    return {
      slots: preview,
      isValid: preview.length >= remainingNeeded,
    };
  }, [
    hoveredSlotStart,
    events,
    service.uuid,
    service.option_id,
    servicesData,
    tempPropertyData,
    selectedCurrentListing,
    selectedSlots,
  ]);

  const prevDateRef = React.useRef<string>(currentDate);
  const isFirstRender = React.useRef(true);

  const vendorsString = JSON.stringify(selectedVendors);
  const prevVendorsString = React.useRef(vendorsString);

  useEffect(() => {
    if (id) return;

    // Skip on first render to prevent clearing slots on component mount/remount
    if (isFirstRender.current) {
      console.log("OneDayCalendar: First render, skipping slot clear");
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

      console.log(
        "OneDayCalendar: Date or Vendors changed, preserving slots.",
        {
          vendorsChanged,
          dateChanged,
          prevVendors: prevVendorsString.current,
          newVendors: vendorsString,
          prevDate: prevDateRef.current,
          newDate: currentDate,
        },
      );
      // REMOVED CLEARING LOGIC
      // setSelectedSlots((prev: Slot[]) =>
      //    prev.filter((slot: Slot) => slot.service_id !== service.uuid)
      // );

      prevVendorsString.current = vendorsString;
      prevDateRef.current = currentDate;
    }
  }, [vendorsString, currentDate, id, setSelectedSlots, service.uuid]);

  function geocodeAddress(address: string): Promise<string> {
    if (
      typeof window === "undefined" ||
      !window.google ||
      !window.google.maps
    ) {
      return Promise.reject("Google Maps API not loaded");
    }
    const geocoder = new window.google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode(
        { address },
        (
          results: google.maps.GeocoderResult[] | null,
          status: google.maps.GeocoderStatus,
        ) => {
          if (status === "OK" && results && results[0]) {
            const formattedAddress = results[0].formatted_address;
            resolve(formattedAddress);
          } else {
            reject(`Geocode failed: ${status}`);
          }
        },
      );
    });
  }

  function normalizeAddress(address: string): string {
    return address?.trim() || "";
  }

  async function calculateDistance(
    originInput: string,
    destinationInput: string,
  ): Promise<{ est_time: number; distance: number } | null> {
    try {
      if (
        typeof window === "undefined" ||
        !window.google ||
        !window.google.maps
      ) {
        console.error("Google Maps API not loaded");
        return null;
      }
      if (!originInput || !destinationInput) {
        console.error("Origin or destination address is empty.");
        return null;
      }
      const originResolved = await geocodeAddress(
        normalizeAddress(originInput),
      );
      const destinationResolved = await geocodeAddress(
        normalizeAddress(destinationInput),
      );

      const service = new window.google.maps.DistanceMatrixService();

      return new Promise((resolve) => {
        service.getDistanceMatrix(
          {
            origins: [originResolved],
            destinations: [destinationResolved],
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (
            response: google.maps.DistanceMatrixResponse | null,
            status: google.maps.DistanceMatrixStatus,
          ) => {
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
          },
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
    const slotStart = dayjs(info.event.start).format("HH:mm:ss");
    const slotEnd = dayjs(info.event.end).format("HH:mm:ss");
    const selectedDate = dayjs(info.event.start).format("YYYY-MM-DD");

    // SERVICE DURATION VALIDATION
    // Get the service duration (either defined or calculated from square footage)
    const currentService = servicesData?.find(
      (s) => s.uuid === service.uuid || String(s.id) === String(service.id),
    );
    const productOption = currentService?.product_options?.find(
      (option) =>
        (service.option_id && option.uuid === service.option_id) ||
        (service.option_id && String(option.id) === String(service.option_id)),
    );
    const squareFootage =
      tempPropertyData?.square_footage ||
      selectedCurrentListing?.square_footage;
    const requiredDuration = getEffectiveServiceDuration(
      productOption,
      currentService,
      squareFootage,
    );
    const requiredSlots = Math.ceil(requiredDuration / 15);

    const isAlreadySelected = selectedSlots.find(
      (slot: Slot) =>
        slot.service_id === service.uuid &&
        slot.start_time === slotStart &&
        slot.end_time === slotEnd &&
        slot.date === selectedDate,
    );

    if (!forceProceed && !isAlreadySelected) {
      const existingSlots = selectedSlots.filter(
        (slot: Slot) => slot.service_id === service.uuid,
      );
      const hasDifferentDate = existingSlots.some(
        (slot: Slot) => slot.date !== selectedDate,
      );
      if (hasDifferentDate) {
        setPendingSelection(info);
        setShowConfirmDayChange(true);
        return;
      }
    }

    if (isAlreadySelected) {
      const serviceSlotsForDate = selectedSlots
        .filter(
          (slot: Slot) =>
            slot.service_id === service.uuid && slot.date === selectedDate,
        )
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      const formatTime = (time: string) => {
        const [h, m] = time.split(":");
        const hour = parseInt(h);
        const meridian = hour >= 12 ? "PM" : "AM";
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${m} ${meridian}`;
      };

      const firstSlot = serviceSlotsForDate[0];
      const lastSlot = serviceSlotsForDate[serviceSlotsForDate.length - 1];
      const slotRangeText = `${formatTime(firstSlot.start_time)} - ${formatTime(lastSlot.end_time)}`;

      setPendingDeselect({
        slotStart,
        slotEnd,
        selectedDate,
        serviceSlotsForDate,
        clickedEvent: clicked,
        slotRangeText,
      });
      setShowConfirmDeselect(true);
      return;
    }

    const currentServiceSlots = selectedSlots.filter(
      (slot: Slot) =>
        slot.service_id === service.uuid && slot.date === selectedDate,
    );

    const currentAssignedVendorId =
      currentServiceSlots.length > 0
        ? currentServiceSlots[0].vendor?.uuid ||
          currentServiceSlots[0].vendor_id
        : null;
    const isSwitchingVendor =
      currentAssignedVendorId &&
      !selectedVendors.includes(currentAssignedVendorId);

    const effectiveCurrentServiceSlots = isSwitchingVendor
      ? []
      : currentServiceSlots;

    const isFloorPlanClick = isFloorPlanService(
      service.title,
      service.uuid,
      service.id,
      servicesData,
    );
    const isMatterportClick = isMatterportService(
      service.title,
      service.uuid,
      service.id,
      servicesData,
    );
    const isSpecialServiceClick = isFloorPlanClick || isMatterportClick;
    const allowBookingThroughLunch =
      portalSettings?.allow_booking_through_lunch ?? false;

    // Helper to get matching eligible vendors and their valid proposed slots for a clicked start ISO
    const getMatchingVendorsForClick = (startISO: string) => {
      const candidates: {
        vendor: VendorData;
        proposedSlots: { start: string; end: string }[];
      }[] = [];

      vendorsData.forEach((vendor) => {
        if (!vendor.uuid || !selectedVendors.includes(vendor.uuid)) return;

        const vendorHasNextBookingFlag = isNextBookingSlotOnlyEnabled(vendor);
        const shouldEnforceForVendor = isSpecialServiceClick
          ? vendorHasNextBookingFlag
          : true;
        const useFullDayClick =
          scheduleOverride === 1 &&
          !(isSpecialServiceClick && vendorHasNextBookingFlag);

        const otherSlotsForDate = selectedSlots.filter(
          (s: Slot) => s.service_id !== service.uuid && s.date === selectedDate,
        );

        let validResult: ValidStartSlotResult;
        if (useFullDayClick) {
          const fullDayWorkHours: WorkHours = {
            start_time: "00:00:00",
            end_time: "23:59:59",
            timezone: propertyTimezone || "America/Vancouver",
            work_days: [
              {
                day: dayjs(selectedDate).format("ddd").toLowerCase(),
                start_time: "00:00:00",
                end_time: "23:59:59",
                is_off: 0,
                is_twilight: 0,
              },
            ],
          };
          validResult = getVendorValidStartSlots(
            vendor,
            selectedDate,
            fullDayWorkHours,
            AllBookedSlots,
            otherSlotsForDate,
            vendor.additional_breaks || [],
            vendor.calendar_events || [],
            requiredSlots,
            allowBookingThroughLunch,
            shouldEnforceForVendor,
            service.uuid,
            selectedSlots,
            15,
            false,
            currentService?.is_travel_required !== false,
            destinationAddress,
          );
        } else {
          if (!vendor.work_hours) return;
          const vendorTimezone =
            vendor.work_hours.timezone || "America/Vancouver";
          const targetTimezone = propertyTimezone || "America/Vancouver";
          const convertedWorkHours = convertVendorWorkHoursToPropertyTimezone(
            selectedDate,
            vendor.work_hours,
            vendorTimezone,
            targetTimezone,
          );
          validResult = getVendorValidStartSlots(
            vendor,
            selectedDate,
            convertedWorkHours,
            AllBookedSlots,
            otherSlotsForDate,
            vendor.additional_breaks || [],
            vendor.calendar_events || [],
            requiredSlots,
            allowBookingThroughLunch,
            shouldEnforceForVendor,
            service.uuid,
            selectedSlots,
            15,
            false,
            currentService?.is_travel_required !== false,
            destinationAddress,
          );
        }

        if (validResult.proposedSlotsMap.has(startISO)) {
          candidates.push({
            vendor,
            proposedSlots: validResult.proposedSlotsMap.get(startISO)!,
          });
        }
      });

      return candidates;
    };

    if (effectiveCurrentServiceSlots.length > 0 && !forceProceed) {
      const candidateMatches = getMatchingVendorsForClick(clicked.start);
      if (candidateMatches.length === 0) {
        toast.error(
          `There are not ${requiredDuration} min consecutive available slots starting at this time. Please select another slot.`,
        );
        return;
      }

      setPendingReplaceSelection({
        info,
        proposedSlots: candidateMatches[0].proposedSlots,
        slotTime: dayjs(clicked.start).format("hh:mm A"),
      });
      setShowConfirmReplaceSelection(true);
      return;
    }

    const matching = getMatchingVendorsForClick(clicked.start);
    if (matching.length === 0) {
      toast.error(
        `There are not ${requiredDuration} min consecutive available slots for any eligible vendor starting at this time. Please select another slot.`,
      );
      return;
    }

    // Check if best matching vendor's available duration is less than requiredDuration
    const bestMatch = currentAssignedVendorId
      ? matching.find((m) => m.vendor.uuid === currentAssignedVendorId) ||
        matching[0]
      : matching[0];
    const availableDurationMins = bestMatch.proposedSlots.length * 15;
    if (availableDurationMins < requiredDuration) {
      toast.error(
        `Selected available duration (${availableDurationMins} min) is less than the required service duration (${requiredDuration} min). Please select another slot.`,
      );
      return;
    }

    if (currentAssignedVendorId) {
      const sticky = matching.find(
        (m) => m.vendor.uuid === currentAssignedVendorId,
      );
      if (sticky) {
        handleAssignVendor(sticky.vendor, sticky.proposedSlots, forceProceed);
        return;
      }
    }

    if (matching.length === 1) {
      handleAssignVendor(
        matching[0].vendor,
        matching[0].proposedSlots,
        forceProceed,
      );
    } else {
      setClickedSlot(clicked);
      setAvailableSlotVendors(matching.map((m) => m.vendor));
      setShowVendorModal(true);
    }
  };

  const handleConfirmDeselect = () => {
    if (!pendingDeselect) return;

    setSelectedSlots((prev: Slot[]) =>
      prev.filter((slot: Slot) => slot.service_id !== service.uuid),
    );
    toast.success(`Removed all selected slots for ${service.title}.`);
    setPendingDeselect(null);
    setShowConfirmDeselect(false);
  };

  const handleCancelDeselect = () => {
    if (!pendingDeselect) return;
    const { slotStart, slotEnd, selectedDate, serviceSlotsForDate } =
      pendingDeselect;

    if (serviceSlotsForDate.length > 1) {
      const firstSlot = serviceSlotsForDate[0];
      const lastSlot = serviceSlotsForDate[serviceSlotsForDate.length - 1];

      const isFirstSlot =
        slotStart === firstSlot.start_time && slotEnd === firstSlot.end_time;
      const isLastSlot =
        slotStart === lastSlot.start_time && slotEnd === lastSlot.end_time;

      if (!isFirstSlot && !isLastSlot) {
        toast.error(
          "You can only remove slots from the start or end of your booking. Please unselect the first or last slot.",
        );
        setPendingDeselect(null);
        setShowConfirmDeselect(false);
        return;
      }
    }

    setSelectedSlots((prev: Slot[]) =>
      prev.filter(
        (slot: Slot) =>
          !(
            slot.service_id === service.uuid &&
            slot.start_time === slotStart &&
            slot.end_time === slotEnd &&
            slot.date === selectedDate
          ),
      ),
    );

    const requiredDuration = getEffectiveServiceDuration(
      servicesData
        ?.find((s) => s.uuid === service.uuid)
        ?.product_options?.find((option) => option.uuid === service.option_id)
        ?.service_duration,
      tempPropertyData?.square_footage ||
        selectedCurrentListing?.square_footage,
    );
    const requiredSlots = Math.ceil(requiredDuration / 15);

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
      toast.warning(
        `You have unselected a slot from ${slotTimeRange} and have ${deficit} less slot${deficit > 1 ? "s" : ""}. Please select ${deficit === 1 ? "one" : deficit} more slot${deficit > 1 ? "s" : ""}.`,
      );
    }

    setPendingDeselect(null);
    setShowConfirmDeselect(false);
  };

  const handleConfirmDayChange = async () => {
    if (!pendingSelection) return;
    setSelectedSlots((prev: Slot[]) =>
      prev.filter((slot: Slot) => slot.service_id !== service.uuid),
    );
    const info = pendingSelection;
    setPendingSelection(null);
    setShowConfirmDayChange(false);
    await onEventClick(info, true);
  };

  const handleConfirmReplaceSelection = async () => {
    if (!pendingReplaceSelection) return;
    const { info } = pendingReplaceSelection;
    setSelectedSlots((prev: Slot[]) =>
      prev.filter((slot: Slot) => slot.service_id !== service.uuid),
    );
    setPendingReplaceSelection(null);
    setShowConfirmReplaceSelection(false);
    await onEventClick(info, true);
  };

  const handleConfirmVendorChange = async () => {
    if (!pendingVendorAssignment) return;
    const { vendor, slots } = pendingVendorAssignment;
    setPendingVendorAssignment(null);
    setShowConfirmVendorChange(false);
    await handleAssignVendor(vendor, slots, true);
  };

  const handleAssignVendor = async (
    vendor: VendorData,
    slots: { start: string; end: string }[],
    forceVendorChange = false,
  ) => {
    const existingSlots = selectedSlots.filter(
      (slot: Slot) => slot.service_id === service.uuid,
    );
    const currentAssignedVendorId =
      existingSlots.length > 0
        ? existingSlots[0].vendor?.uuid || existingSlots[0].vendor_id
        : null;

    if (
      !forceVendorChange &&
      currentAssignedVendorId &&
      currentAssignedVendorId !== vendor.uuid
    ) {
      const previousVendor = vendorsData.find(
        (v) => v.uuid === currentAssignedVendorId,
      );
      const previousVendorName = previousVendor
        ? `${previousVendor.first_name} ${previousVendor.last_name || ""}`.trim()
        : "the previous vendor";

      setPendingVendorAssignment({ vendor, slots, previousVendorName });
      setShowConfirmVendorChange(true);
      setShowVendorModal(false);
      return;
    }

    const originAddress = vendor?.addresses?.find(
      (address) => address.type === "start_location",
    );
    const origin =
      originAddress?.address_line_1 +
      "," +
      originAddress?.city +
      "," +
      originAddress?.province +
      "," +
      originAddress?.country;

    const result = await calculateDistance(origin, destinationAddress);

    const updatedEvents = events.map((event: Slots) => {
      const isMatchingSlot = slots.some(
        (slot) =>
          dayjs(event.start).isSame(slot.start) &&
          dayjs(event.end).isSame(slot.end),
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

    const newSlots = slots.map((slot) => ({
      service_id: service.uuid ?? "",
      vendor_id: vendor.uuid ? vendor.uuid : "",
      show_all_vendors: showAllVendorsMap[serviceKey] ?? 0,
      schedule_override: scheduleOverride ?? 0,
      recommend_time: recommendTimeMap[serviceKey] ?? 0,
      travel: null,
      start_time: dayjs(slot.start).format("HH:mm:ss"),
      end_time: dayjs(slot.end).format("HH:mm:ss"),
      date: dayjs(slot.start).format("YYYY-MM-DD"),
      est_time: result?.est_time ?? null,
      distance: result?.distance ?? null,
      km_price: null,
    }));

    setSelectedSlots((prev: Slot[]) => {
      let nextSlots = prev;
      if (forceVendorChange) {
        nextSlots = prev.filter((slot) => slot.service_id !== service.uuid);
      }
      return [...nextSlots, ...newSlots];
    });
    setShowVendorModal(false);

    // Show informational message about slot selection progress
    // Recalculate service duration and current slots for toast message
    const currentService = servicesData?.find((s) => s.uuid === service.uuid);
    const productOption = currentService?.product_options?.find(
      (option) => option.uuid === service.option_id,
    );
    const squareFootage =
      tempPropertyData?.square_footage ||
      selectedCurrentListing?.square_footage;
    const requiredDuration = getEffectiveServiceDuration(
      productOption?.service_duration,
      squareFootage,
    );

    const selectedDate = dayjs(slots[0].start).format("YYYY-MM-DD");
    const currentServiceSlots = forceVendorChange
      ? []
      : selectedSlots.filter(
          (s: Slot) => s.service_id === service.uuid && s.date === selectedDate,
        );
    const newTotalSlots = currentServiceSlots.length + slots.length;
    const newTotalDuration = newTotalSlots * 15;

    if (newTotalDuration < requiredDuration) {
      // Toast removed - validation now happens on "Next" button click
    } else if (newTotalDuration === requiredDuration) {
      // Toast removed - validation now handled elsewhere for better UX
    } else {
      toast.info(
        `Note: You have selected more time than the required ${requiredDuration} minutes for "${service.title}".`,
      );
    }
    onVendorSelected?.(vendor.uuid || "");
  };

  const vendorColorStyles = Object.entries(
    vendorDistances as Record<string, number>,
  )
    .map(([uuid, distance]) => {
      const color = getDistanceColor(distance);
      return `
      .vendor-${uuid}::before {
        background-color: ${color} !important;
      }
    `;
    })
    .join("\n");

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
      <div
        ref={containerRef}
        className="mt-[20px] relative custom-scroll"
        style={{
          border: isUnderScheduled
            ? "3px solid #EF4444"
            : hasSelectedSlotsForBorder
              ? "3px solid #6bae41"
              : "2px solid #BBBBBB",
          borderRadius: "6px",
          maxHeight: 430,
          height: 430,
          overflowY: "auto",
          width: "100%",
        }}
      >
        {isCalculating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 gap-3 z-[100]">
            <Loader2 className="w-8 h-8 animate-spin text-[#6bae41]" />
            <span className="text-sm font-medium text-gray-500 font-alexandria">
              Calculating slots & travel times...
            </span>
          </div>
        )}
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin]}
          initialView="timeGridDay"
          slotDuration="00:15:00"
          slotLabelInterval="00:15:00"
          slotMinTime={slotMinTime || "08:00:00"}
          slotMaxTime={slotMaxTime || "18:00:00"}
          allDaySlot={false}
          events={events}
          eventContent={(eventInfo) => {
            const isRecommended =
              eventInfo.event.classNames.includes("slot-recommended");
            const isAvailable =
              eventInfo.event.classNames.includes("slot-available");
            const isTwilightRecommended =
              eventInfo.event.extendedProps?.twilightRecommended;
            const availableVendorIds =
              eventInfo.event.extendedProps?.availableVendorIds || [];

            // Get vendor data sorted by distance
            const availableVendors = availableVendorIds
              .map((vendorId: string) =>
                vendorsData.find((v: VendorData) => v.uuid === vendorId),
              )
              .filter(
                (v: VendorData | undefined): v is VendorData => v !== undefined,
              )
              .sort((a: VendorData, b: VendorData) => {
                const distA = vendorDistances[a.uuid ?? ""] ?? Infinity;
                const distB = vendorDistances[b.uuid ?? ""] ?? Infinity;
                return distA - distB;
              });

            const visibleVendors = availableVendors.slice(0, 3);
            const overflowVendors = availableVendors.slice(3);

            const content = (
              <div
                className={`fc-event-main-frame w-full h-full relative flex flex-col items-center justify-center p-1 gap-0.5 ${isTwilightRecommended ? "twilight-recommended-slot" : ""}`}
              >
                {isAvailable && availableVendors.length > 0 ? (
                  <TooltipProvider delayDuration={200}>
                    <div className="flex flex-wrap gap-0.5 items-center justify-center w-full">
                      {visibleVendors.map((vendor: VendorData) => {
                        const distance = vendorDistances[vendor.uuid ?? ""];
                        const color = getDistanceColor(distance);
                        return (
                          <div
                            key={vendor.uuid}
                            className="flex items-center rounded-sm text-[9px] px-1.5 py-0.5 bg-white/90"
                            style={{
                              borderLeft: `5px solid ${color}`,
                              maxWidth: "100%",
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
                          <TooltipContent
                            side="right"
                            className="bg-white border border-gray-200 shadow-lg p-2"
                          >
                            <div className="flex flex-col gap-1">
                              {overflowVendors.map((vendor: VendorData) => {
                                const distance =
                                  vendorDistances[vendor.uuid ?? ""];
                                const color = getDistanceColor(distance);
                                return (
                                  <div
                                    key={vendor.uuid}
                                    className="flex items-center gap-1.5 text-[11px]"
                                  >
                                    <div
                                      className="w-1 h-4 rounded-sm"
                                      style={{
                                        backgroundColor: color,
                                        width: "4px",
                                      }}
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
                  <div
                    className="fc-event-title fc-sticky text-center"
                    style={{ fontSize: "9px", color: "#424242" }}
                  >
                    {eventInfo.event.title}
                  </div>
                )}
                {isRecommended && !isTwilightRecommended && (
                  <div className="recommended-corner-indicator">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
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
                    <TooltipContent
                      side="top"
                      className="bg-orange-500 text-white border-none text-xs p-2"
                    >
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
                ? ["slot-hover-preview"]
                : ["slot-hover-preview-error"];
            }
            return [];
          }}
          selectable={true}
          editable={true}
          initialDate={initialDateStr}
          headerToolbar={{
            left: "prev,next",
            center: "title",
            right: "",
          }}
          validRange={React.useMemo(() => ({ start: minDate }), [minDate])}
          titleFormat={{ weekday: "short", day: "numeric" }}
          datesSet={(arg: DatesSetArg) => {
            const calendarDate = dayjs(arg.start).format("YYYY-MM-DD");
            setCurrentDate(calendarDate);
            setSelectedDate(calendarDate);
          }}
        />

        {showVendorModal && clickedSlot && (
          <div
            onClick={() => setShowVendorModal(false)}
            style={{ height: "-webkit-fill-available" }}
            className="sticky top-0 inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#EEEEEE] rounded-lg p-4 w-[300px] shadow-lg"
            >
              {availableSlotVendors.length === 0 ? (
                <p className="text-gray-500">
                  No vendors available for this service at selected time.
                </p>
              ) : (
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {[...availableSlotVendors]
                    .sort((a, b) => {
                      const timeA = vendorDistances[a.uuid ?? ""] ?? Infinity;
                      const timeB = vendorDistances[b.uuid ?? ""] ?? Infinity;
                      return timeA - timeB;
                    })
                    .map((vendor: VendorData) => {
                      const travelTime = vendor.uuid
                        ? vendorDistances[vendor.uuid]
                        : undefined;
                      const color = getDistanceColor(travelTime);
                      const formatTravelTime = (minutes: number) => {
                        const h = Math.floor(minutes / 60);
                        const m = Math.round(minutes % 60);
                        if (h > 0) return `${h}h ${m}m`;
                        return `${m}m`;
                      };

                      return (
                        <li
                          key={vendor.uuid}
                          className="cursor-pointer p-2 flex items-center gap-1 hover:bg-gray-100"
                          onClick={() => {
                            const currentServiceDataForModal =
                              servicesData.find(
                                (s) =>
                                  s.uuid === service.uuid ||
                                  String(s.id) === String(service.id),
                              );
                            const isNoTravelModal =
                              currentServiceDataForModal?.is_travel_required ===
                              false;
                            const isFloorPlanModal = isFloorPlanService(
                              service.title,
                              service.uuid,
                              service.id,
                              servicesData,
                            );
                            const isMatterportModal = isMatterportService(
                              service.title,
                              service.uuid,
                              service.id,
                              servicesData,
                            );
                            const isSpecialServiceModal =
                              isFloorPlanModal || isMatterportModal;
                            const allowBookingThroughLunchModal =
                              portalSettings?.allow_booking_through_lunch ??
                              false;

                            const vendorHasNextBookingFlag =
                              isNextBookingSlotOnlyEnabled(vendor);
                            const shouldEnforceForVendor = isSpecialServiceModal
                              ? vendorHasNextBookingFlag
                              : true;
                            const useFullDayModal = isNoTravelModal
                              ? !vendorHasNextBookingFlag
                              : scheduleOverride === 1 &&
                                !(
                                  isSpecialServiceModal &&
                                  vendorHasNextBookingFlag
                                );

                            const selectedDateForModal = dayjs(
                              clickedSlot.start,
                            ).format("YYYY-MM-DD");
                            const otherSlotsForDate = selectedSlots.filter(
                              (s: Slot) =>
                                s.service_id !== service.uuid &&
                                s.date === selectedDateForModal,
                            );
                            const squareFootageForModal =
                              tempPropertyData?.square_footage ||
                              selectedCurrentListing?.square_footage;
                            const productOptionForModal =
                              currentServiceDataForModal?.product_options?.find(
                                (option) =>
                                  (service.option_id &&
                                    option.uuid === service.option_id) ||
                                  (service.option_id &&
                                    String(option.id) ===
                                      String(service.option_id)),
                              );
                            const requiredDurationForModal =
                              getEffectiveServiceDuration(
                                productOptionForModal,
                                currentServiceDataForModal,
                                squareFootageForModal,
                              );
                            const requiredSlotsForModal = Math.max(
                              1,
                              Math.ceil(requiredDurationForModal / 15),
                            );

                            let validResult: ValidStartSlotResult;
                            if (useFullDayModal) {
                              const fullDayWH: WorkHours = {
                                start_time: "00:00:00",
                                end_time: "23:59:59",
                                timezone:
                                  propertyTimezone || "America/Vancouver",
                                work_days: [
                                  {
                                    day: dayjs(selectedDateForModal)
                                      .format("ddd")
                                      .toLowerCase(),
                                    start_time: "00:00:00",
                                    end_time: "23:59:59",
                                    is_off: 0,
                                    is_twilight: 0,
                                  },
                                ],
                              };
                              validResult = getVendorValidStartSlots(
                                vendor,
                                selectedDateForModal,
                                fullDayWH,
                                AllBookedSlots,
                                otherSlotsForDate,
                                [],
                                [],
                                requiredSlotsForModal,
                                allowBookingThroughLunchModal,
                                shouldEnforceForVendor,
                                service.uuid,
                                selectedSlots,
                                15,
                              );
                            } else {
                              if (!vendor.work_hours) {
                                toast.error(
                                  "Vendor work hours not configured.",
                                );
                                return;
                              }
                              const vendorTimezone =
                                vendor.work_hours.timezone ||
                                "America/Vancouver";
                              const targetTimezone =
                                propertyTimezone || "America/Vancouver";
                              const convertedWH =
                                convertVendorWorkHoursToPropertyTimezone(
                                  selectedDateForModal,
                                  vendor.work_hours,
                                  vendorTimezone,
                                  targetTimezone,
                                );
                              validResult = getVendorValidStartSlots(
                                vendor,
                                selectedDateForModal,
                                convertedWH,
                                AllBookedSlots,
                                otherSlotsForDate,
                                vendor.additional_breaks || [],
                                vendor.calendar_events || [],
                                requiredSlotsForModal,
                                allowBookingThroughLunchModal,
                                shouldEnforceForVendor,
                                service.uuid,
                                selectedSlots,
                                15,
                              );
                            }

                            const proposed = validResult.proposedSlotsMap.get(
                              clickedSlot.start,
                            );
                            if (proposed && proposed.length > 0) {
                              handleAssignVendor(vendor, proposed, true);
                            } else {
                              toast.error(
                                "Vendor is not available for the full duration starting at this time.",
                              );
                            }
                          }}
                        >
                          <span
                            style={{ backgroundColor: color }}
                            className={`flex h-[16px] w-[5px]`}
                          ></span>
                          <span className="text-[14px] truncate">
                            {vendor.first_name} {vendor.last_name}
                          </span>
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
        <div className="mt-4 p-3 bg-amber-50 rounded-md border border-amber-200">
          <h4 className="text-sm font-[600] text-amber-900 mb-1 flex items-center gap-1.5">
            <span>🌅</span>
            <span>Twilight Time ({dayjs(currentDate).format("MMM D")})</span>
          </h4>
          <div className="text-xs text-amber-800 font-medium">
            Sunset Window:{" "}
            {twilightData.formatted_window ||
              `${formatTwilightTime(twilightData.sunset, propertyTimezone || "America/Vancouver")} – ${formatTwilightTime(twilightData.civil_twilight_end, propertyTimezone || "America/Vancouver")}`}
          </div>
          <div className="text-xs text-amber-700 mt-1">
            Twilight shoots are scheduled around sunset for optimal lighting.
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
        toggleShowAgain={() => setShowAgain((prev) => !prev)}
        title="Change Selected Date?"
        description={`Selecting a slot for this day will remove the previous day selection for ${service.title || "this service"}.`}
      />
      <ConfirmationDialog
        open={showConfirmVendorChange}
        setOpen={(open) => {
          setShowConfirmVendorChange(open);
          if (!open) {
            setPendingVendorAssignment(null);
          }
        }}
        onConfirm={handleConfirmVendorChange}
        showAgain={showAgain}
        toggleShowAgain={() => setShowAgain((prev) => !prev)}
        title="Change Vendor?"
        description={`Selecting a slot for this vendor will remove the previously selected slots for ${pendingVendorAssignment?.previousVendorName || "the previous vendor"}.`}
      />
      <ConfirmationDialog
        open={showConfirmReplaceSelection}
        setOpen={(open) => {
          setShowConfirmReplaceSelection(open);
          if (!open) {
            setPendingReplaceSelection(null);
          }
        }}
        onConfirm={handleConfirmReplaceSelection}
        showAgain={showAgain}
        toggleShowAgain={() => setShowAgain((prev) => !prev)}
        title="Replace Selection?"
        description={`Do you want to select slots from ${pendingReplaceSelection?.slotTime} onwards? On clicking confirm, your previous selection for "${service.title}" will be removed.`}
      />
      <ConfirmationDialog
        open={showConfirmDeselect}
        setOpen={(open) => {
          setShowConfirmDeselect(open);
          if (!open) {
            setPendingDeselect(null);
          }
        }}
        onConfirm={handleConfirmDeselect}
        onCancel={handleCancelDeselect}
        showAgain={showAgain}
        toggleShowAgain={() => setShowAgain((prev) => !prev)}
        dialogType="deselect"
        title="Remove Selection?"
        description={`Did you want to remove the selection? Clicking confirm will remove the selected slots (${pendingDeselect?.slotRangeText || ""}) of ${service.title}.`}
      />
    </>
  );
}
