'use client'
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import dayjs from "dayjs";
import { SelectedService } from './Services';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { EventClickArg, DatesSetArg } from '@fullcalendar/core';
import { useOrderContext, Slot } from '../context/OrderContext';
import { VendorData } from '../[id]/page';
import { Order } from '../page';
import { convertVendorWorkHoursToPropertyTimezone } from '../orders';

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
  [key: string]: string | undefined;
}
interface CalendarProps {
  selectedVendors: string[];
  vendorColors: Record<string, string>;
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

  const dayOfWeek = dayjs(date).format('ddd').toLowerCase();
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

  // If end time is before start time, it means the work period crosses midnight
  // Add 1 day to the end time
  if (end.isBefore(start) || end.isSame(start)) {
    end = end.add(1, 'day');
  }

  const breakStart = workHours.break_start ? dayjs(`${date}T${workHours.break_start}`) : null;
  const breakEnd = workHours.break_end ? dayjs(`${date}T${workHours.break_end}`) : null;

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
        current.isSame(bookedStart) &&
        next.isSame(bookedEnd)
      );
    }) || false;

    const isConflict = otherServiceSlots.some(conflictSlot => {
      const conflictStart = dayjs(`${conflictSlot.date}T${conflictSlot.start_time}`);
      return (
        conflictSlot.vendor_id === vendorId &&
        conflictSlot.date === date &&
        current.isSame(conflictStart)
      );
    });

    const isTimeOff = vendorTimeOffs?.some(timeOff => {
      if (!timeOff) return false;

      const timeOffStartDate = timeOff.start_date || timeOff.date;
      const timeOffEndDate = timeOff.end_date || timeOff.date;

      const currentDateObj = dayjs(date);
      const startDateObj = dayjs(timeOffStartDate);
      const endDateObj = dayjs(timeOffEndDate);

      const isDateInRange = currentDateObj.isSameOrAfter(startDateObj, 'day') &&
        currentDateObj.isSameOrBefore(endDateObj, 'day');

      if (!isDateInRange) return false;

      const isSingleDay = startDateObj.isSame(endDateObj, 'day');
      const isStartDay = currentDateObj.isSame(startDateObj, 'day');
      const isEndDay = currentDateObj.isSame(endDateObj, 'day');

      if (isSingleDay) {
        const timeOffStart = dayjs(`${date}T${timeOff.start_time}`);
        const timeOffEnd = dayjs(`${date}T${timeOff.end_time}`);

        return (
          (current.isSameOrAfter(timeOffStart) && current.isBefore(timeOffEnd)) ||
          (next.isAfter(timeOffStart) && next.isSameOrBefore(timeOffEnd)) ||
          (current.isBefore(timeOffStart) && next.isAfter(timeOffEnd))
        );
      } else {
        if (isStartDay && isEndDay) {
          const timeOffStart = dayjs(`${date}T${timeOff.start_time}`);
          const timeOffEnd = dayjs(`${date}T${timeOff.end_time}`);
          return (
            (current.isSameOrAfter(timeOffStart) && current.isBefore(timeOffEnd)) ||
            (next.isAfter(timeOffStart) && next.isSameOrBefore(timeOffEnd)) ||
            (current.isBefore(timeOffStart) && next.isAfter(timeOffEnd))
          );
        } else if (isStartDay) {
          const timeOffStart = dayjs(`${date}T${timeOff.start_time}`);
          return current.isSameOrAfter(timeOffStart);
        } else if (isEndDay) {
          const timeOffEnd = dayjs(`${date}T${timeOff.end_time}`);
          return current.isBefore(timeOffEnd);
        } else {
          return true;
        }
      }
    }) || false;

    // Check if slot conflicts with Google Calendar events
    const isCalendarEvent = calendarEvents?.some(event => {
      if (!event || event.status === 'cancelled') return false;

      // Parse event times (they are in UTC ISO format)
      const eventStart = dayjs(event.start);
      const eventEnd = dayjs(event.end);

      // Check if the event is on the current date
      const eventDate = eventStart.format('YYYY-MM-DD');
      if (eventDate !== date) return false;

      // Check if current slot overlaps with the calendar event
      return (
        (current.isSameOrAfter(eventStart) && current.isBefore(eventEnd)) ||
        (next.isAfter(eventStart) && next.isSameOrBefore(eventEnd)) ||
        (current.isBefore(eventStart) && next.isAfter(eventEnd))
      );
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

function getDistanceColor(distance: number | undefined): string {
  if (distance === undefined || distance === null) return "#CCCCCC";
  if (distance === 0) return "#2BC6FF";
  if (distance <= 15) return "#FD7DFF";
  if (distance <= 30) return "#E8B611";
  if (distance <= 45) return "#E2F202";
  if (distance <= 60) return "#9900A7";
  return "#171484";
}

export default function OneDayCalendar({ setSelectedDate, selectedVendors, vendorColors, service, showAllVendorsMap, scheduleOverrideMap, recommendTimeMap, calendarIdx, vendorDistances, propertyTimezone }: CalendarProps) {
  const {
    selectedSlots,
    setSelectedSlots,
    selectedServices,
    vendorsData,
    ordersData,
    selectedCurrentListing,
  } = useOrderContext();
  const { id } = useParams();

  const existingSlot = selectedSlots.find((s: Slot) => s.service_id === service.uuid);
  const initialDateStr = existingSlot ? existingSlot.date : dayjs().format('YYYY-MM-DD');

  const [events, setEvents] = useState<Slots[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(initialDateStr);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [clickedSlot, setClickedSlot] = useState<{ start: string; end: string } | null>(null);
  const [availableSlotVendors, setAvailableSlotVendors] = useState<VendorData[]>([]);
  const calendarRef = React.useRef<FullCalendar>(null);
  const hasJumpedToInitialDate = React.useRef(false);

  useEffect(() => {
    if (existingSlot && !hasJumpedToInitialDate.current && calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(existingSlot.date);
      setCurrentDate(existingSlot.date);
      hasJumpedToInitialDate.current = true;
    }
  }, [existingSlot]);

  useEffect(() => {
    const selectedServiceIds = selectedServices.map(s => s.uuid);
    setSelectedSlots((prev: Slot[]) =>
      prev.filter((slot: Slot) => selectedServiceIds.includes(slot.service_id))
    );
  }, [selectedServices, setSelectedSlots]);

  const destinationAddress = selectedCurrentListing
    ? `${selectedCurrentListing.address},${selectedCurrentListing.city},${selectedCurrentListing.country}`
    : '';

  const orderIdParam = Array.isArray(id) ? id[0] : id;

  const AllBookedSlots = useMemo(() => ordersData?.filter((order: Order) => order.uuid !== orderIdParam).map((order: Order) => order.slots).flat() || [], [ordersData, orderIdParam]);

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
      s.service_id !== service.uuid && s.date === date
    );

    filteredVendors.forEach((vendor) => {
      if (!vendor.work_hours) return;

      const vendorTimezone = vendor.work_hours.timezone || 'America/Vancouver';
      const targetTimezone = propertyTimezone || 'America/Vancouver';
      console.log(`\n=== Vendor: ${vendor.first_name} ===`);
      console.log('Vendor timezone:', vendorTimezone);
      console.log('Property timezone:', targetTimezone);
      console.log('Original work_hours:', JSON.stringify(vendor.work_hours, null, 2));

      const convertedWorkHours = convertVendorWorkHoursToPropertyTimezone(
        currentDate,
        vendor.work_hours,
        vendorTimezone,
        targetTimezone
      );
      console.log('Converted work_hours:', JSON.stringify(convertedWorkHours, null, 2));

      const vendorSlots = generateMarkedSlots(
        currentDate,
        convertedWorkHours,
        vendor.uuid ?? '',
        AllBookedSlots,
        otherServiceSlots,
        vendor.additional_breaks || [],
        vendor.calendar_events || [],
        15
      );
      vendorSlots.forEach((slot) => {
        const key = `${slot.start}_${slot.end}`;
        availableSlotMap.set(key, {
          ...slot,
          className: 'slot-available'
        });
      });
    });

    const finalSlots = fullDaySlots.map((slot) => {
      const key = `${slot.start}_${slot.end}`;
      const matchedAvailable = availableSlotMap.get(key);

      if (matchedAvailable) {
        const matchingSelected = selectedSlots.find(
          (s: Slot) =>
            s.service_id === service.uuid &&
            dayjs(`${s.date}T${s.start_time}`).toISOString() === slot.start &&
            dayjs(`${s.date}T${s.end_time}`).toISOString() === slot.end
        );

        if (matchingSelected) {
          return {
            ...matchedAvailable,
            title: vendorsData.find(v => v.uuid === matchingSelected.vendor_id)?.first_name + ' ' +
              vendorsData.find(v => v.uuid === matchingSelected.vendor_id)?.last_name + '\n' +
              service.title,
            className: `slot-selected vendor-${matchingSelected.vendor_id}`
          };
        }

        return matchedAvailable;
      }

      return { ...slot, title: 'Unavailable', className: 'slot-unavailable' };
    });

    setEvents(finalSlots);
  }, [vendorsData, ordersData, currentDate, selectedVendors, selectedSlots, service.title, service.uuid, AllBookedSlots, propertyTimezone]);

  const prevVendorsRef = React.useRef<string[]>([]);
  const prevDateRef = React.useRef<string>(currentDate);

  useEffect(() => {
    if (id) return;

    const vendorsChanged =
      JSON.stringify(prevVendorsRef.current) !== JSON.stringify(selectedVendors);
    const dateChanged = prevDateRef.current !== currentDate;

    if (vendorsChanged || dateChanged) {
      setSelectedSlots((prev: Slot[]) =>
        prev.filter((slot: Slot) => slot.service_id !== service.uuid)
      );

      prevVendorsRef.current = selectedVendors;
      prevDateRef.current = currentDate;
    }
  }, [selectedVendors, currentDate, id, setSelectedSlots, service.uuid]);

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

  const onEventClick = async (info: EventClickArg) => {
    if (!info.event.start || !info.event.end) return;

    const clicked = {
      start: info.event.start.toISOString(),
      end: info.event.end.toISOString(),
    };

    const slotStart = dayjs(info.event.start).format('HH:mm:ss');
    const slotEnd = dayjs(info.event.end).format('HH:mm:ss');
    const selectedDate = dayjs(info.event.start).format('YYYY-MM-DD');

    const isAlreadySelected = selectedSlots.find(
      (slot: Slot) =>
        slot.service_id === service.uuid &&
        slot.start_time === slotStart &&
        slot.end_time === slotEnd &&
        slot.date === selectedDate
    );

    if (isAlreadySelected) {
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
      return;
    }

    const matching = vendorsData.filter(vendor => {
      if (!vendor.uuid || !selectedVendors.includes(vendor.uuid)) {
        return false;
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
        vendor.uuid,
        AllBookedSlots,
        selectedSlots.filter((s: Slot) => s.service_id !== service.uuid && s.date === selectedDate),
        vendor.additional_breaks || [],
        vendor.calendar_events || [],
        15
      );

      const isSlotAvailable = vendorAvailableSlots.some(availableSlot =>
        dayjs(availableSlot.start).isSame(clicked.start) &&
        dayjs(availableSlot.end).isSame(clicked.end)
      );

      return isSlotAvailable;
    });

    if (matching.length === 1) {
      handleAssignVendor(matching[0], clicked);
    } else if (selectedVendors.length === 1) {
      const selectedVendorId = selectedVendors[0];
      const targetVendor = matching.find(m => m.uuid === selectedVendorId);

      if (targetVendor) {
        handleAssignVendor(targetVendor, clicked);
      } else if (matching.length > 1) {
        setClickedSlot(clicked);
        setAvailableSlotVendors(matching);
        setShowVendorModal(true);
      }
    } else if (matching.length > 1) {
      setClickedSlot(clicked);
      setAvailableSlotVendors(matching);
      setShowVendorModal(true);
    }
  };

  const handleAssignVendor = async (vendor: VendorData, slot: { start: string; end: string }) => {
    const originAddress = vendor?.addresses?.find((address) => address.type === 'start_location')
    const origin = (originAddress?.address_line_1 + ',' + originAddress?.city + "," + originAddress?.province + "," + originAddress?.country)

    const result = await calculateDistance(origin, destinationAddress);

    const updatedEvents = events.map((event: Slots) => {
      if (
        dayjs(event.start).isSame(slot.start) &&
        dayjs(event.end).isSame(slot.end)
      ) {
        return {
          ...event,
          title: `${vendor.first_name} ${vendor.last_name}\n${service.title}`,
          className: `slot-selected vendor-${vendor.uuid}`,
        };
      }
      return event;
    });

    setEvents(updatedEvents);

    const newSlot = {
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
    };
    setSelectedSlots((prev: Slot[]) => [...prev, newSlot]);
    setShowVendorModal(false);
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

  return (
    <div className="mt-[20px] relative custom-scroll" style={{
      border: '2px solid #BBBBBB',
      borderRadius: '6px',
      maxHeight: 430,
      height: 430,
      overflowY: 'auto',
      width: '100%',
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
        height="auto"
        dayHeaders={false}
        eventClick={onEventClick}
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
        validRange={{
          start: dayjs(initialDateStr).isBefore(dayjs().format("YYYY-MM-DD"))
            ? initialDateStr
            : dayjs().format("YYYY-MM-DD")
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
                {availableSlotVendors.map((vendor: VendorData) => {
                  const color = vendor.uuid ? vendorColors[vendor.uuid] || '#888' : '#888';
                  return (
                    <li
                      key={vendor.uuid}
                      className="cursor-pointer p-2 flex items-center gap-1 hover:bg-gray-100"
                      onClick={() => handleAssignVendor(vendor, clickedSlot)}
                    >
                      <span
                        style={{ backgroundColor: color }}
                        className={`flex h-[16px] w-[5px]`}></span>
                      <span className='text-[14px]'>{vendor.first_name} {vendor.last_name}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
      <style>{vendorColorStyles}</style>
    </div>
  );
}