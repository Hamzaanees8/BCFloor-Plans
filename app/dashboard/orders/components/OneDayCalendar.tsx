import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import React, { useState, useEffect } from 'react';
import { GetVendors } from '../orders';
import { VendorData } from '../[id]/page';
import dayjs from "dayjs";
import { SelectedService } from './Services';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useOrderContext } from '../context/OrderContext';
import { GetOneListing } from '../../listings/listing';
import { useParams } from 'next/navigation';
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface WorkHours {
  start_time: string;
  end_time: string;
  break_start: string;
  break_end: string;
}

interface Slots {
  start: string;
  end: string;
  title: string;
  className: string;
  vendor_id?: string;
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
}



function generateMarkedSlots(date: string, workHours: WorkHours, interval = 15): Slots[] {
  if (!workHours) return [];

  const slots = [];
  const start = dayjs(`${date}T${workHours.start_time}`);
  const end = dayjs(`${date}T${workHours.end_time}`);
  const breakStart = dayjs(`${date}T${workHours.break_start}`);
  const breakEnd = dayjs(`${date}T${workHours.break_end}`);

  let current = start;

  while (current.isBefore(end)) {
    const next = current.add(interval, 'minute');

    const inBreak = next.isAfter(breakStart) && current.isBefore(breakEnd);

    if (!inBreak) {
      slots.push({
        id: current.toISOString(), // 👈 add this
        start: current.toISOString(),
        end: next.toISOString(),
        title: 'Available',
        className: 'slot-available',
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




export default function OneDayCalendar({ selectedVendors, vendorColors, service, showAllVendorsMap, scheduleOverrideMap, recommendTimeMap, calendarIdx }: CalendarProps) {
  const {
    selectedSlots,
    setSelectedSlots,
    selectedListingId,
    selectedServices,
  } = useOrderContext();
  const { id } = useParams();
  const [events, setEvents] = useState<Slots[]>([]);
  const [vendors, setVendors] = React.useState<VendorData[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [clickedSlot, setClickedSlot] = useState<{ start: string; end: string } | null>(null);
  const [availableSlotVendors, setAvailableSlotVendors] = useState<VendorData[]>([]);
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  useEffect(() => {
    const selectedServiceIds = selectedServices.map(s => s.uuid);
    setSelectedSlots((prev) =>
      prev.filter((slot) => selectedServiceIds.includes(slot.service_id))
    );
  }, [selectedServices, setSelectedSlots]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    GetVendors(token)
      .then((data) => {
        setVendors(data.data);
      })
      .catch((err) => console.log(err.message));
  }, []);

  // useEffect(() => {
  //   const token = localStorage.getItem("token");

  //   if (!token) {
  //     console.log('Token not found.')
  //     return;
  //   }

  //   if (selectedSlots.length > 0 && selectedSlots[0].vendor_id) {
  //     GetOne(token, selectedSlots[0].vendor_id)
  //       .then(data => setOriginAddress(data.data.addresses[1].address_line_1))
  //       .catch(err => console.log(err.message));
  //   } else {
  //     console.log('Vendor ID is undefined.');
  //   }
  // }, [selectedSlots]);
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log('Token not found.')
      return;
    }

    if (selectedListingId) {
      GetOneListing(token, selectedListingId)
        .then(data => {
          setDestinationAddress(data.data.address + ',' + data.data.city + ',' + data.data.country)

        })
        .catch(err => console.log(err.message));
    } else {
      console.log('Property ID is undefined.');
    }
  }, [selectedListingId]);
  useEffect(() => {
    const date = currentDate;

    const filteredVendors = vendors.filter(
      (vendor) => vendor.uuid && selectedVendors?.includes(vendor.uuid)
    );
    if (filteredVendors.length === 0) {
      setEvents([]);
      return;
    }

    const fullDaySlots = generateAllDaySlots(date, 15);


    if (!filteredVendors.length) return;

    const availableSlotMap = new Map<string, Slots>();

    filteredVendors.forEach((vendor) => {
      if (!vendor.work_hours) return;

      const vendorSlots = generateMarkedSlots(date, vendor.work_hours, 15);
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
        // Check if already selected
        const matchingSelected = selectedSlots.find(
          (s) =>
            s.service_id === service.uuid &&
            dayjs(`${s.date}T${s.start_time}`).toISOString() === slot.start &&
            dayjs(`${s.date}T${s.end_time}`).toISOString() === slot.end
        );


        if (matchingSelected) {
          return {
            ...matchedAvailable,
            title: vendors.find(v => v.uuid === matchingSelected.vendor_id)?.first_name + ' ' +
              vendors.find(v => v.uuid === matchingSelected.vendor_id)?.last_name + '\n' +
              service.title,
            className: `slot-selected vendor-${matchingSelected.vendor_id}`
          };
        }

        return matchedAvailable;
      }

      return { ...slot, title: 'Unavailable', className: 'slot-unavailable' };
    });

    setEvents(finalSlots);
  }, [vendors, currentDate, selectedVendors, selectedSlots, service.title, service.uuid]);

  const prevVendorsRef = React.useRef<string[]>([]);
  const prevDateRef = React.useRef<string>(currentDate);

  useEffect(() => {
    if (id) return; // ⛔ Skip running this effect if we're in edit mode (id is present)

    const vendorsChanged =
      JSON.stringify(prevVendorsRef.current) !== JSON.stringify(selectedVendors);
    const dateChanged = prevDateRef.current !== currentDate;

    if (vendorsChanged || dateChanged) {
      setSelectedSlots((prev) =>
        prev.filter((slot) => slot.service_id !== service.uuid)
      );

      prevVendorsRef.current = selectedVendors;
      prevDateRef.current = currentDate;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVendors, currentDate]);

  // const getDistanceAndTime = async (
  //   originAddress: string,
  //   destinationAddress: string
  // ): Promise<{ distance: number; duration: number } | null> => {
  //   try {
  //     const response = await axios.get(
  //       'https://maps.googleapis.com/maps/api/distancematrix/json',
  //       {
  //         params: {
  //           origins: originAddress,
  //           destinations: destinationAddress,
  //           key: process.env.NEXT_PUBLIC_PLACES_API_KEY,
  //         },
  //       }
  //     );
  //     console.log('Google Maps response:', response.data);
  //     const data = response.data;

  //     if (
  //       data.rows?.[0]?.elements?.[0]?.status === 'OK' &&
  //       data.rows[0].elements[0].distance &&
  //       data.rows[0].elements[0].duration
  //     ) {
  //       const element = data.rows[0].elements[0];

  //       return {
  //         distance: element.distance.value / 1000, // meters to km
  //         duration: element.duration.value / 60, // seconds to minutes
  //       };
  //     }

  //     return null;
  //   } catch (error) {
  //     console.error('Error fetching distance and time:', error);
  //     return null;
  //   }
  // };
  function geocodeAddress(address: string): Promise<string> {
    const geocoder = new window.google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const formattedAddress = results[0].formatted_address;
          resolve(formattedAddress); // or use results[0].geometry.location for LatLng
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
          (response, status) => {
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
            console.log('distance', distance, 'est_time', est_time);

            resolve({ est_time, distance });
          }
        );
      });
    } catch (err) {
      console.error("Error:", err);
      return null;
    }
  }

  const onEventClick = async (info: import('@fullcalendar/core').EventClickArg) => {
    if (!info.event.start || !info.event.end) return;

    const clicked = {
      start: info.event.start.toISOString(),
      end: info.event.end.toISOString(),
    };

    const slotStart = dayjs(info.event.start).format('HH:mm');
    const slotEnd = dayjs(info.event.end).format('HH:mm');
    const selectedDate = dayjs(info.event.start).format('YYYY-MM-DD');

    if (selectedVendors?.length === 1) {
      const vendorUUID = selectedVendors[0];
      const vendor = vendors.find(v => v.uuid === vendorUUID);
      if (!vendor || !vendor.work_hours) return;
      const { start_time, end_time, break_start, break_end } = vendor.work_hours;
      const origin = vendor?.addresses?.[1]?.address_line_1 || "";
      console.log('vendor', vendor?.addresses);
      //setOriginAddress(vendor?.addresses?.[1]?.address_line_1 || '');
      const eventStart = dayjs(`2000-01-01T${slotStart}`);
      const eventEnd = dayjs(`2000-01-01T${slotEnd}`);
      const workStart = dayjs(`2000-01-01T${start_time}`);
      const workEnd = dayjs(`2000-01-01T${end_time}`);
      const breakStartTime = dayjs(`2000-01-01T${break_start}`);
      const breakEndTime = dayjs(`2000-01-01T${break_end}`);

      const isWithinWorkingHours = eventStart.isSameOrAfter(workStart) && eventEnd.isSameOrBefore(workEnd);
      const isNotDuringBreak = eventEnd.isSameOrBefore(breakStartTime) || eventStart.isSameOrAfter(breakEndTime);
      const result = await calculateDistance(origin, destinationAddress);
      console.log('result', result);

      if (isWithinWorkingHours && isNotDuringBreak) {
        const isAlreadySelected = selectedSlots.some(
          (slot) =>
            slot.service_id === service.uuid &&
            slot.start_time === dayjs(clicked.start).format('HH:mm:ss') &&
            slot.end_time === dayjs(clicked.end).format('HH:mm:ss') &&
            slot.vendor_id === vendorUUID &&
            slot.date === selectedDate
        );

        if (isAlreadySelected) {
          setSelectedSlots((prev) =>
            prev.filter(
              (slot) =>
                !(
                  slot.service_id === service.uuid &&
                  slot.start_time === dayjs(clicked.start).format('HH:mm:ss') &&
                  slot.end_time === dayjs(clicked.end).format('HH:mm:ss') &&
                  slot.vendor_id === vendorUUID &&
                  slot.date === selectedDate
                )
            )
          );

          const updatedEvents = events.map((event) => {
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
        } else {
          const updatedEvents = events.map((event) => {
            if (
              dayjs(event.start).isSame(clicked.start) &&
              dayjs(event.end).isSame(clicked.end)
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
            start_time: dayjs(clicked.start).format('HH:mm:ss'),
            end_time: dayjs(clicked.end).format('HH:mm:ss'),
            date: selectedDate,
            est_time: result?.est_time ?? null,
            distance: result?.distance ?? null,
            km_price: null,
          };

          setSelectedSlots((prev) => [...prev, newSlot]);
        }

        return;
      }

      return;
    }

    const isAlreadySelected = selectedSlots.find(
      (slot) =>
        slot.service_id === service.uuid &&
        slot.start_time === dayjs(clicked.start).format('HH:mm:ss') &&
        slot.end_time === dayjs(clicked.end).format('HH:mm:ss') &&
        slot.date === selectedDate
    );

    if (isAlreadySelected) {
      setSelectedSlots((prev) =>
        prev.filter(
          (slot) =>
            !(
              slot.service_id === service.uuid &&
              slot.start_time === dayjs(clicked.start).format('HH:mm:ss') &&
              slot.end_time === dayjs(clicked.end).format('HH:mm:ss') &&
              slot.date === selectedDate
            )
        )
      );

      const updatedEvents = events.map((event) => {
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
      return; // stop here — don't open vendor popup
    }

    // Else show vendor modal to assign one

    setClickedSlot(clicked);

    const matching = vendors.filter(vendor => {
      if (!vendor.work_hours) return false;

      const { start_time, end_time, break_start, break_end } = vendor.work_hours;
      const eventStart = dayjs(`2000-01-01T${slotStart}`);
      const eventEnd = dayjs(`2000-01-01T${slotEnd}`);
      const workStart = dayjs(`2000-01-01T${start_time}`);
      const workEnd = dayjs(`2000-01-01T${end_time}`);
      const breakStartTime = dayjs(`2000-01-01T${break_start}`);
      const breakEndTime = dayjs(`2000-01-01T${break_end}`);

      const isWithinWorkingHours = eventStart.isSameOrAfter(workStart) && eventEnd.isSameOrBefore(workEnd);
      const isNotDuringBreak = eventEnd.isSameOrBefore(breakStartTime) || eventStart.isSameOrAfter(breakEndTime);

      return isWithinWorkingHours && isNotDuringBreak;
    });

    if (matching.length === 1) {

      handleAssignVendor(matching[0], clicked);
    } else {
      setClickedSlot(clicked);
      setAvailableSlotVendors(matching);
      setShowVendorModal(true);
    }
  };
  const handleAssignVendor = async (vendor: VendorData, slot: { start: string; end: string }) => {
    const originAddress = vendor?.addresses?.find((address) => address.type === 'start_location')
    const origin = (originAddress?.address_line_1 + ',' + originAddress?.city + "," + originAddress?.province + "," + originAddress?.country)
    console.log('vendor', vendor);


    // const destination = destinationAddress;

    const result = await calculateDistance(origin, destinationAddress);

    const updatedEvents = events.map((event) => {
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
    setSelectedSlots((prev) => [...prev, newSlot]);

    setShowVendorModal(false);
  };

  const vendorColorStyles = Object.entries(vendorColors)
    .map(([uuid, color]) => `
    .vendor-${uuid}::before {
      background-color: ${color} !important;
    }
  `)
    .join('\n');

  return (
    <div className="mt-[20px] relative custom-scrollbar" style={{
      border: '2px solid #BBBBBB',
      borderRadius: '6px',
      maxHeight: 430,
      height: 430,
      overflowY: 'auto',
      width: '100%',
    }}>
      <FullCalendar
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
        headerToolbar={{
          left: 'prev,next',
          center: 'title',
          right: ''
        }}
        titleFormat={{ weekday: 'short', day: 'numeric' }}
        datesSet={(arg) => {
          const calendarDate = dayjs(arg.start).format('YYYY-MM-DD');
          setCurrentDate(calendarDate);
        }}
        validRange={{
          start: dayjs().format("YYYY-MM-DD")
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
              <p className="text-gray-500">No vendors available at this time.</p>
            ) : (
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {availableSlotVendors.map((vendor) => {
                  const color = vendor.uuid ? vendorColors[vendor.uuid] || '#888' : '#888'; // fallback gray
                  return (
                    <li
                      key={vendor.uuid}
                      className="cursor-pointer p-2 flex items-center gap-1  hover:bg-gray-100"
                      onClick={() => handleAssignVendor(vendor, clickedSlot)}
                    >
                      <span
                        style={{ backgroundColor: color }}
                        className={`flex h-[16px] w-[5px]`}></span> <span className='text-[14px]'>{vendor.first_name} {vendor.last_name}</span>
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