'use client';
import React, { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { Calendar, dayjsLocalizer, View, Views } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ChevronLeft, ChevronRight, Coffee, Plane, Box, LayoutTemplate, Camera, Video, Home, Aperture, Layers } from 'lucide-react';
import { Order } from '../../orders/page';
import '../calendar.css'
import { Button } from '@/components/ui/button';
import AddBreakPopup from './AddBreakPopup';
import BreakQuickViewCard from './BreakQuickViewCard';
import { ThreeDayView } from './ThreeDayView';
import OrderQuickViewCard from './OrderQuickViewCard';
import { Services } from '../../services/page';
import { Agent } from '@/lib/types';
import Link from 'next/link';
import OrderDetailView from './OrderDetailView';
import { useAppContext } from '@/app/context/AppContext';
import { toast } from 'sonner';
import { DeleteVendorBreak } from '../calendar';
import { Switch } from '@/components/ui/switch';
import ConfirmationDialog from '@/components/ConfirmationDialog';

const STORAGE_KEY_DELETE = 'confirmation_dialog_delete_show_again';

import updateLocale from 'dayjs/plugin/updateLocale';
dayjs.extend(updateLocale);

dayjs.updateLocale('en', {
    weekStart: 1,
});

const localizer = dayjsLocalizer(dayjs);

export type CalanderVendor = {
    uuid?: string;
    id?: number;
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    status?: boolean;
    company?: { uuid: string, company_name: string, vendor_id: string }
    addresses: {
        address_line_1: string;
        country: string;
        city: string;
    }[]
    primary_phone?: string;
    secondary_phone?: string;
    company_name: string;
    avatar_url?: string;
    work_hours: {
        start_time: string;
        end_time: string;
        break_start: string;
        break_end: string;
    }
    additional_breaks?: {
        address: string
        date: Date
        start_date: Date
        end_date: Date
        end_time: string
        start_time: string
        title: string
        uuid: string
        vendor_id: string
    }[]
    calendar_events?: {
        id: string;
        summary: string;
        description?: string;
        start: string;
        end: string;
        all_day: boolean;
        status: string;
    }[];
    order_slots?: {
        id: number;
        uuid: string;
        order_id: number;
        service_id: number;
        vendor_id: number;
        show_all_vendors: boolean;
        schedule_override: boolean;
        recommend_time: boolean;

        travel: null | unknown;
        created_at: string;
        updated_at: string;
        start_time: string;
        end_time: string;
        est_time: string;
        distance: string;
        km_price: null | number | string;
        address: string;
        location: string;
        date: string;
        google_event_id: null | string;
    }[];
};

interface BigCalendarProps {
    orderData: Order[]
    selectedservice: string[]
    selectedVendors: string[]
    visibleDays: string[];
    setVisibleDays: (visibleDays: string[]) => void
    customEvents?: CalendarEvent[]
    onAddCustomEvent?: (event: CalendarEvent) => void
    vendorData: CalanderVendor[]
    setVendorData?: (vendors: CalanderVendor[] | ((prev: CalanderVendor[]) => CalanderVendor[])) => void; // Updated type
    setCurrentMonthYear: (value: { month: string; year: string }) => void;
    serviceData: Services[]
    agentData: Agent[]
    refreshOrders: () => void
}

interface CustomToolbarProps {
    date: Date;
    onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE', newDate?: Date) => void;
}

export type CalendarEvent = {
    uuid?: string
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    vendor_id?: string
    color_id?: number
    service_id?: number;
    order_id?: string | number
    address?: string
    vendor_name?: string
    service_name?: string
    resourceId?: string
};

const customViews = {
    month: true,
    week: true,
    day: true,
    agenda: true,
    custom_3day: ThreeDayView,
};

export const CustomDateHeader = ({ date }: { date: Date }) => {
    const day = dayjs(date).format('D');
    const weekday = dayjs(date).format('ddd');

    return (
        <div className="flex flex-col items-center justify-center">
            <span className="text-[10px]">{weekday}</span>
            <span className="text-[20px] leading-5">{day}</span>
        </div>
    );
};

const generateWeeklyBreakEvents = (vendors: CalanderVendor[], referenceDate: Date): CalendarEvent[] => {
    const startOfPrevWeek = dayjs(referenceDate).startOf('week').subtract(7, 'day');
    const totalDays = 21;
    const events: CalendarEvent[] = [];

    for (let day = 0; day < totalDays; day++) {
        const date = startOfPrevWeek.add(day, 'day');

        vendors.forEach((vendor) => {
            const { break_start, break_end } = vendor.work_hours;

            if (break_start && break_end) {
                const startDate = dayjs(`${date.format('YYYY-MM-DD')}T${break_start}`).toDate();
                const endDate = dayjs(`${date.format('YYYY-MM-DD')}T${break_end}`).toDate();

                events.push({
                    title: `${vendor.first_name} ${vendor.last_name}`,
                    start: startDate,
                    end: endDate,
                    vendor_id: vendor.uuid,
                    vendor_name: "Break",
                    color_id: Number(vendor?.company?.vendor_id ?? 0),
                    resourceId: vendor.uuid
                });
            }
        });
    }

    return events;
};

const BigCalendar = ({ orderData, selectedservice, selectedVendors, vendorData, setVendorData, visibleDays, setVisibleDays, setCurrentMonthYear, serviceData, agentData, refreshOrders }: BigCalendarProps) => {
    const { userType } = useAppContext();
    const { open: isSidebarOpen } = useSidebar();
    const [date, setDate] = useState(new Date());
    const [showBreaks, setShowBreaks] = useState(true);
    const [open, setOpen] = useState(false);
    const [openDetails, setOpenDetails] = useState(false);

    // Resource Pagination State
    const [resourcePage, setResourcePage] = useState(0);
    const RESOURCES_PER_PAGE = 5;

    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        eventData?: CalendarEvent;
    } | null>(null);
    const [customEvents, setCustomEvents] = useState<CalendarEvent[]>([]);
    const [vendorBreaks, setVendorBreaks] = useState<CalendarEvent[]>([]);
    const [selectedBreakEvent, setSelectedBreakEvent] = useState<CalendarEvent | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<CalendarEvent | null>(null);
    const [popupType, setPopupType] = useState<"time_off" | "break" | "other">("break")
    const [additionalBreakEvents, setAdditionalBreakEvents] = useState<CalendarEvent[]>([]);
    const [vendorEvents, setVendorEvents] = useState<CalendarEvent[]>([]);
    const [breakToDelete, setBreakToDelete] = useState<CalendarEvent | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [showAgain, setShowAgain] = useState(true);

    useEffect(() => {
        const savedDelete = localStorage.getItem(STORAGE_KEY_DELETE);
        if (savedDelete !== null) {
            setShowAgain(JSON.parse(savedDelete));
        }
    }, []);

    const handleToggleShowAgain = () => {
        const newValue = !showAgain;
        setShowAgain(newValue);
        localStorage.setItem(STORAGE_KEY_DELETE, JSON.stringify(newValue));
    }

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const vendorsToProcess = userType === 'vendor' && userInfo?.uuid
            ? vendorData.filter(v => v.uuid === userInfo.uuid)
            : vendorData.filter(v => selectedVendors.includes('ALL') || selectedVendors.includes(v.uuid || ''));

        const allMappedEvents: CalendarEvent[] = [];

        vendorsToProcess.forEach(vendor => {
            if (vendor.calendar_events && Array.isArray(vendor.calendar_events)) {
                const mappedEvents = vendor.calendar_events
                    .filter(event => event.status !== 'cancelled')
                    .map(event => {
                        const start = dayjs(event.start).toDate();
                        let end = dayjs(event.end).toDate();

                        // If all day or spans multiple days, just show as a 1 hour block on start date
                        const isMultiDay = dayjs(event.end).diff(dayjs(event.start), 'day') > 0;
                        if (event.all_day || isMultiDay) {
                            end = dayjs(start).add(1, 'hour').toDate();
                        }

                        return {
                            id: event.id,
                            title: 'External Event',
                            start,
                            end,
                            allDay: false, // Force false to show in time grid
                            vendor_id: vendor.uuid,
                            vendor_name: `${vendor.first_name} ${vendor.last_name}`,
                            color_id: Number(vendor?.company?.vendor_id ?? 0),
                            resourceId: vendor.uuid
                        };
                    });
                allMappedEvents.push(...mappedEvents);
            }
        });

        setVendorEvents(allMappedEvents);
    }, [userType, vendorData, selectedVendors]);

    useEffect(() => {

        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

        const currentvendorData = vendorData.find((vendor) => vendor.uuid === userInfo?.uuid);

        let breaks: CalendarEvent[] = [];

        if (userType === 'vendor' && userInfo?.uuid) {
            breaks = generateWeeklyBreakEvents(currentvendorData ? [currentvendorData] : [], date);
        } else if (userType === 'admin') {
            breaks = generateWeeklyBreakEvents(vendorData, date);
        } else {
            breaks = [];
        }

        setVendorBreaks(breaks);

    }, [vendorData, date, userType]);


    const events = orderData?.flatMap((order) => {
        const sortedSlots = [...order.slots].sort((a, b) => {
            const aStart = dayjs(`${a.date} ${a.start_time}`);
            const bStart = dayjs(`${b.date} ${b.start_time}`);
            return aStart.diff(bStart);
        });

        const groupedEvents: CalendarEvent[] = [];

        const groupedByOrderServiceVendor: Record<string, typeof sortedSlots> = {};
        for (const slot of sortedSlots) {
            const key = `${order.uuid}-${slot.service_id}-${slot.vendor_id}`;
            if (!groupedByOrderServiceVendor[key]) {
                groupedByOrderServiceVendor[key] = [];
            }
            groupedByOrderServiceVendor[key].push(slot);
        }

        Object.values(groupedByOrderServiceVendor).forEach((slots) => {
            const sorted = [...slots].sort((a, b) => {
                const aStart = dayjs(`${a.date} ${a.start_time}`);
                const bStart = dayjs(`${b.date} ${b.start_time}`);
                return aStart.diff(bStart);
            });

            let currentGroup: typeof sorted = [];

            for (let i = 0; i < sorted.length; i++) {
                const slot = sorted[i];
                const start = dayjs(`${slot.date} ${slot.start_time}`);

                if (currentGroup.length === 0) {
                    currentGroup.push(slot);
                } else {
                    const last = currentGroup[currentGroup.length - 1];
                    const lastEnd = dayjs(`${last.date} ${last.end_time}`);

                    if (start.isSame(lastEnd)) {
                        currentGroup.push(slot);
                    } else {
                        const firstSlot = currentGroup[0];
                        const lastSlot = currentGroup[currentGroup.length - 1];
                        const serviceName = serviceData?.find(s => s.id === firstSlot.service_id)?.name;

                        groupedEvents.push({
                            title: `${firstSlot.vendor?.first_name ?? "Vendor"} ${firstSlot.vendor?.last_name ?? ""}`.trim(),
                            start: dayjs(`${firstSlot.date} ${firstSlot.start_time}`).toDate(),
                            end: dayjs(`${lastSlot.date} ${lastSlot.end_time}`).toDate(),
                            vendor_id: firstSlot.vendor.uuid,
                            service_id: firstSlot.service_id,
                            order_id: order.uuid,
                            address: firstSlot.address || order.property_address,
                            service_name: serviceName,
                            // @ts-expect-error skip
                            color_id: Number(firstSlot.vendor?.company?.vendor_id ?? 0),
                            resourceId: firstSlot.vendor.uuid
                        });
                        currentGroup = [slot];
                    }
                }
            }

            if (currentGroup.length > 0) {
                const firstSlot = currentGroup[0];
                const lastSlot = currentGroup[currentGroup.length - 1];
                const serviceName = serviceData?.find(s => s.id === firstSlot.service_id)?.name;

                groupedEvents.push({
                    title: `${firstSlot.vendor?.first_name ?? "Vendor"} ${firstSlot.vendor?.last_name ?? ""}`.trim(),
                    start: dayjs(`${firstSlot.date} ${firstSlot.start_time}`).toDate(),
                    end: dayjs(`${lastSlot.date} ${lastSlot.end_time}`).toDate(),
                    vendor_id: firstSlot.vendor.uuid,
                    service_id: firstSlot.service_id,
                    order_id: order.uuid,
                    address: firstSlot.address || order.property_address,
                    service_name: serviceName,
                    // @ts-expect-error skip
                    color_id: firstSlot.vendor.company?.vendor_id,
                    resourceId: firstSlot.vendor.uuid
                });
            }
        });

        return groupedEvents;
    });

    useEffect(() => {
        const newAdditionalBreakEvents: CalendarEvent[] = [];
        const seenBreakIds = new Set<string>();

        // Filter vendors based on userType
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        let vendorsToProcess = vendorData;

        if (userType === 'vendor' && userInfo?.uuid) {
            // Only show current vendor's time-offs
            vendorsToProcess = vendorData.filter(vendor => vendor.uuid === userInfo.uuid);
        }

        vendorsToProcess?.forEach(vendor => {
            if (vendor?.additional_breaks && Array.isArray(vendor.additional_breaks)) {
                vendor.additional_breaks.forEach((brk) => {
                    if (!seenBreakIds.has(brk.uuid)) {
                        seenBreakIds.add(brk.uuid);

                        const start = dayjs(`${brk.start_date}T${brk.start_time}`).toDate();
                        const end = dayjs(`${brk.end_date}T${brk.end_time}`).toDate();

                        newAdditionalBreakEvents.push({
                            title: brk.title || "Break",
                            start,
                            end,
                            vendor_id: vendor.uuid,
                            vendor_name: `${vendor.first_name} ${vendor.last_name}`,
                            color_id: Number(vendor?.company?.vendor_id ?? 0),
                            uuid: brk.uuid,
                            address: brk.address,
                            resourceId: vendor.uuid
                        });
                    }
                });
            }
        });
        setAdditionalBreakEvents(newAdditionalBreakEvents);
    }, [vendorData, userType]);
    const isTimeOffSelected = selectedservice.includes('TIME_OFF');
    const selectedServicesWithoutTimeOff = selectedservice.filter(s => s !== 'TIME_OFF');

    const isAllServicesSelected =
        selectedServicesWithoutTimeOff.length === 0 || selectedServicesWithoutTimeOff.includes('ALL');

    // Filter events based on userType
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    const filteredEvents = events.filter(event => {
        const matchService =
            isAllServicesSelected ||
            selectedServicesWithoutTimeOff.includes(String(event.service_id));

        const matchVendor =
            selectedVendors.includes('ALL') ||
            selectedVendors.includes(String(event.vendor_id));

        // If vendor is logged in, only show their own orders
        const matchCurrentVendor = userType === 'vendor' && userInfo?.uuid
            ? event.vendor_id === userInfo.uuid
            : true;

        return matchService && matchVendor && matchCurrentVendor;
    });

    const filteredBreaks = vendorBreaks.filter(event =>
        selectedVendors.includes('ALL') || selectedVendors.includes(String(event.vendor_id))
    );

    const filteredAdditionalBreaks = additionalBreakEvents?.filter(event =>
        selectedVendors.includes('ALL') || selectedVendors.includes(String(event.vendor_id))
    );

    const allEvents = React.useMemo(() => {
        let events = [];
        if (isTimeOffSelected && selectedServicesWithoutTimeOff.length === 0) {
            events = [
                // ...filteredBreaks,
                ...filteredAdditionalBreaks,
                ...(customEvents || []),
                ...vendorEvents,
            ];
        } else {
            events = [
                ...filteredEvents,
                ...filteredBreaks,
                ...filteredAdditionalBreaks,
                ...(customEvents || []),
                ...vendorEvents,
            ];
        }

        return events.filter(event => {
            if (showBreaks) return true;
            const isBreak = event.title?.includes("Break") || !!event.vendor_name;
            return !isBreak;
        });
    }, [isTimeOffSelected, selectedServicesWithoutTimeOff.length, filteredAdditionalBreaks, customEvents, vendorEvents, filteredEvents, filteredBreaks, showBreaks]);



    // const allEvents = [
    //     ...filteredEvents,
    //     ...filteredBreaks,
    //     ...filteredAdditionalBreaks,
    //     ...(customEvents || [])
    // ];

    const minTime = React.useMemo(() => {
        let earliestHour = 7;

        let startRange = dayjs(date).startOf('day');
        let endRange = dayjs(date).endOf('day');

        if (visibleDays[0] === '7' || visibleDays[0] === '5') {
            startRange = dayjs(date).startOf('week');
            endRange = dayjs(date).endOf('week');
        } else if (visibleDays[0] === '3') {
            startRange = dayjs(date).startOf('day');
            endRange = dayjs(date).add(2, 'day').endOf('day');
        } else if (visibleDays[0] === '30') {
            startRange = dayjs(date).startOf('month');
            endRange = dayjs(date).endOf('month');
        }

        const visibleEvents = allEvents.filter(event => {
            if (event.allDay) return false;
            const eventStart = dayjs(event.start);
            const eventEnd = dayjs(event.end);
            return (eventStart.isBefore(endRange) && eventEnd.isAfter(startRange));
        });

        for (const event of visibleEvents) {
            const startHour = dayjs(event.start).hour();
            if (startHour < earliestHour) {
                earliestHour = startHour;
            }
        }
        return dayjs().startOf('day').hour(earliestHour).toDate();
    }, [allEvents, date, visibleDays]);

    const maxTime = React.useMemo(() => {
        let latestHour = 21; // 9 PM

        let startRange = dayjs(date).startOf('day');
        let endRange = dayjs(date).endOf('day');

        if (visibleDays[0] === '7' || visibleDays[0] === '5') {
            startRange = dayjs(date).startOf('week');
            endRange = dayjs(date).endOf('week');
        } else if (visibleDays[0] === '3') {
            startRange = dayjs(date).startOf('day');
            endRange = dayjs(date).add(2, 'day').endOf('day');
        } else if (visibleDays[0] === '30') {
            startRange = dayjs(date).startOf('month');
            endRange = dayjs(date).endOf('month');
        }

        const visibleEvents = allEvents.filter(event => {
            if (event.allDay) return false;
            const eventStart = dayjs(event.start);
            const eventEnd = dayjs(event.end);
            return (eventStart.isBefore(endRange) && eventEnd.isAfter(startRange));
        });

        for (const event of visibleEvents) {
            const endHour = dayjs(event.end).hour();
            const endMinute = dayjs(event.end).minute();

            // If ends at 21:05, hour is 21. We want to show until 22:00.
            // If ends at 21:00 exactly, hour is 21. showing until 21:00 is fine? 
            // Usually Calendar shows "upto" the max time.
            let effectiveEndHour = endHour;
            if (endMinute > 0) effectiveEndHour += 1;

            if (effectiveEndHour > latestHour) {
                latestHour = effectiveEndHour;
            }
        }

        // Ensure we don't go past end of day (24 hours -> next day 00:00)
        if (latestHour >= 24) {
            return dayjs().endOf('day').toDate();
        }

        return dayjs().startOf('day').hour(latestHour).toDate();
    }, [allEvents, date, visibleDays]);

    const CustomEvent = ({ event }: { event: CalendarEvent }) => {

        const handleContextMenu = (e: React.MouseEvent) => {
            e.preventDefault();
            setContextMenu({
                mouseX: e.clientX,
                mouseY: e.clientY,
                eventData: event,
            });
        };

        const isBreak = event.title.includes("Break") || !!event.vendor_name;

        const duration = dayjs(event.end).diff(dayjs(event.start), 'minute');
        const isShortDuration = duration <= 30;

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            onContextMenu={handleContextMenu}
                            className={`h-full w-full flex flex-col justify-center cursor-pointer ${isBreak ? 'striped-background' : ''}`}
                            style={{ overflow: 'hidden' }}
                        >
                            {isBreak ? (
                                <div className='flex flex-col h-full justify-center px-1 bg-white/60'>
                                    <div className="flex items-center gap-1">
                                        {event.vendor_name === 'Break' ? <Coffee className="w-3 h-3" /> : <Plane className="w-3 h-3" />}
                                        <span className="truncate leading-tight font-normal text-[11px]">{event.vendor_name || event.title}</span>
                                    </div>
                                    {event.vendor_name && <span className="truncate leading-tight text-[10px] opacity-90">{event.title}</span>}
                                </div>
                            ) : (
                                (() => {
                                    const service = serviceData.find(s => s.id === event.service_id);
                                    let Icon = Layers;
                                    const catName = service?.category?.name?.toLowerCase() || '';

                                    if (catName.includes('3d') || catName.includes('tour')) Icon = Box;
                                    else if (catName.includes('floor')) Icon = LayoutTemplate;
                                    else if (catName.includes('photo')) Icon = Camera;
                                    else if (catName.includes('video')) Icon = Video;
                                    else if (catName.includes('staging')) Icon = Home;
                                    else if (catName.includes('hdr')) Icon = Aperture;

                                    // Use service colors if available
                                    const bgColor = service?.background_color;

                                    const style = bgColor ? {
                                        borderLeft: `10px solid ${bgColor}`, // 10px wide border with service color
                                        paddingLeft: '6px' // Add padding
                                    } : {
                                        paddingLeft: '6px',
                                    };

                                    return (
                                        <div className='flex flex-col h-full justify-center px-1' style={style}>
                                            <div className="flex items-center gap-1">
                                                <Icon className="w-3 h-3 shrink-0 opacity-70" />
                                                <span className={`truncate leading-tight font-bold ${isShortDuration ? 'text-[9px]' : 'text-xs'}`}>{event.title}</span>
                                            </div>
                                            <span className={`truncate leading-tight mt-0.5 font-medium opacity-90 ${isShortDuration ? 'text-[8px]' : 'text-[11px]'}`}>
                                                {dayjs(event.start).format("hh:mm A")} - {dayjs(event.end).format("hh:mm A")}
                                            </span>
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="z-[9999] p-3 max-w-[300px] min-w-[250px] bg-white border border-gray-200 shadow-xl rounded-md">
                        {isBreak ? (
                            <div className="flex flex-col gap-1.5 text-sm text-black">
                                {event.vendor_name === 'Break' ? (
                                    <p className='font-bold text-gray-800 border-b pb-1'>Lunch Break</p>
                                ) : (
                                    <p className='font-bold text-gray-800 border-b pb-1'>Time Off</p>
                                )}

                                {event.vendor_name !== 'Break' && (
                                    <div><span className="font-semibold text-gray-700">Vendor:</span> {event.vendor_name}</div>
                                )}

                                {event.vendor_name === 'Break' ? (
                                    <div><span className="font-semibold text-gray-700">Vendor:</span> {event.title}</div>
                                ) : (
                                    <div><span className="font-semibold text-gray-700">Title:</span> {event.title}</div>
                                )}

                                {event.address && (
                                    <div><span className="font-semibold text-gray-700">Address:</span> {event.address}</div>
                                )}

                                <div><span className="font-semibold text-gray-700">Start:</span> {dayjs(event.start).format("MMM D, YYYY hh:mm A")}</div>
                                <div><span className="font-semibold text-gray-700">End:</span> {dayjs(event.end).format("MMM D, YYYY hh:mm A")}</div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1.5 text-sm text-black">
                                <p className='font-bold text-gray-800 border-b pb-1'>Appointment</p>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700">Vendor:</span>
                                    <div className="flex items-center gap-1">
                                        <div
                                            className="w-3 h-3 rounded-full shrink-0 border border-gray-400"
                                            style={{ backgroundColor: getHSLColorFromID(Number(event.color_id)).bg }}
                                        />
                                        <span>{event.title}</span>
                                    </div>
                                </div>

                                {event.address && (
                                    <div className="leading-snug text-gray-600 italic">{event.address}</div>
                                )}

                                <div className="text-blue-600 font-medium my-1">
                                    {dayjs(event.start).format("MMM D, YYYY, hh:mm A")} - {dayjs(event.end).format("hh:mm A")}
                                </div>

                                {event.service_name && (() => {
                                    const service = serviceData.find(s => s.id === event.service_id);
                                    const bgColor = service?.background_color;
                                    const borderColor = service?.border_color;
                                    return (
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-700">Service:</span>
                                            <div className="flex items-center gap-1">
                                                {bgColor && (
                                                    <div
                                                        className="w-3 h-3 rounded-full shrink-0"
                                                        style={{
                                                            backgroundColor: bgColor,
                                                            border: `1px solid ${borderColor || bgColor}`
                                                        }}
                                                    />
                                                )}
                                                <span>{event.service_name}</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    const CustomToolbar = ({ onNavigate }: CustomToolbarProps) => {
        const Days = [
            { label: "Day", value: "1" },
            { label: "Weekly", value: "7" },
            { label: "Monthly", value: "30" },
        ];

        return (
            <div className='flex justify-between mb-4'>
                <div className='flex gap-[10px]'>
                    <button onClick={() => onNavigate('TODAY')} className='ml-1 h-[30px] px-3 flex justify-center items-center hover:bg-gray-300 rounded-md text-sm font-medium text-gray-600 bg-white border border-gray-200 shadow-sm'>
                        Today
                    </button>
                    <button onClick={() => onNavigate('PREV')} className='w-[30px] h-[30px] flex justify-center items-center hover:bg-gray-300 rounded-full'>
                        <ChevronLeft color='#7D7D7D' />
                    </button>

                    <button onClick={() => onNavigate('NEXT')} className='w-[30px] h-[30px] flex justify-center items-center hover:bg-gray-300 rounded-full'>
                        <ChevronRight color='#7D7D7D' />
                    </button>
                </div>

                <div className='flex items-center gap-2'>
                    <Switch
                        checked={showBreaks}
                        onCheckedChange={setShowBreaks}
                        className='data-[state=checked]:bg-blue-600'
                    />
                    <span className='text-sm font-medium text-gray-700'>Show Breaks</span>
                </div>

                <div className="flex bg-gray-100 rounded-lg p-1">
                    {Days.map((button) => (
                        <button
                            onClick={() => setVisibleDays([button.value])}
                            key={button.value}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${visibleDays[0] === button.value
                                ? `${userType}-bg hover-${userType}-bg text-[#fff] shadow-sm`
                                : 'text-gray-600 hover:text-gray-900 bg-white shadow-sm border border-gray-200'
                                }`}
                        >
                            {button.label}
                        </button>
                    ))}
                </div>
                <div className='flex gap-[16px] items-center'>


                    {(userType === 'admin' || userType === 'vendor') &&
                        <Button
                            onClick={() => {
                                setOpen(true)
                                setPopupType('break')
                            }}
                            className={`font-raleway text-[14px] font-[600] bg-[#4290E9] hover-${userType}-bg flex justify-center items-center px-[40px] h-[42px] ${userType}-bg`}>
                            Add Time Off
                        </Button>
                    }

                    {(userType !== 'vendor') &&
                        <Link href={'/dashboard/orders/create?from=calendar'} className={`font-raleway text-[14px] font-[600] bg-[#4290E9] hover-${userType}-bg rounded-[6px] text-[#fff] flex justify-center items-center px-[40px] h-[42px] ${userType}-bg`}>
                            Create New Booking
                        </Link>
                    }
                </div>
            </div>
        );
    };

    // Calculate resources and pagination
    const resources = React.useMemo(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const vendorsToProcess = userType === 'vendor' && userInfo?.uuid
            ? vendorData.filter(v => v.uuid === userInfo.uuid)
            : vendorData.filter(v => selectedVendors.includes('ALL') || selectedVendors.includes(v.uuid || ''));

        return vendorsToProcess.map(vendor => ({
            id: vendor.uuid,
            title: `${vendor.first_name} ${vendor.last_name}`
        }));
    }, [vendorData, selectedVendors, userType]);

    const paginatedResources = React.useMemo(() => {
        if (visibleDays[0] !== '1') return [];
        const start = resourcePage * RESOURCES_PER_PAGE;
        return resources.slice(start, start + RESOURCES_PER_PAGE);
    }, [resources, resourcePage, visibleDays]);

    const handlePrevResources = () => {
        setResourcePage(prev => Math.max(0, prev - 1));
    };

    const handleNextResources = () => {
        setResourcePage(prev => {
            if ((prev + 1) * RESOURCES_PER_PAGE >= resources.length) return prev;
            return prev + 1;
        });
    };

    const CustomDayToolbar = ({ onNavigate }: CustomToolbarProps) => {
        const Days = [
            { label: "Day", value: "1" },
            { label: "Weekly", value: "7" },
            { label: "Monthly", value: "30" },
        ];

        return (
            <div className='flex justify-between mb-4'>
                <div className='flex gap-[10px]'>
                    <button onClick={() => onNavigate('TODAY')} className='ml-1 h-[30px] px-3 flex justify-center items-center hover:bg-gray-300 rounded-md text-sm font-medium text-gray-600 bg-white border border-gray-200 shadow-sm'>
                        Today
                    </button>
                    <button onClick={() => onNavigate('PREV')} className='w-[30px] h-[30px] flex justify-center items-center hover:bg-gray-300 rounded-full'>
                        <ChevronLeft color='#7D7D7D' />
                    </button>

                    <button onClick={() => onNavigate('NEXT')} className='w-[30px] h-[30px] flex justify-center items-center hover:bg-gray-300 rounded-full'>
                        <ChevronRight color='#7D7D7D' />
                    </button>
                </div>

                {/* Resource Pagination Controls */}
                <div className='flex items-center gap-2'>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevResources}
                        disabled={resourcePage === 0}
                    >
                        <ChevronLeft className="h-4 w-4" /> Vendors
                    </Button>
                    <span className="text-xs text-gray-500">
                        {resourcePage + 1} / {Math.max(1, Math.ceil(resources.length / RESOURCES_PER_PAGE))}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextResources}
                        disabled={(resourcePage + 1) * RESOURCES_PER_PAGE >= resources.length}
                    >
                        Vendors <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className='flex items-center gap-2'>
                    <Switch
                        checked={showBreaks}
                        onCheckedChange={setShowBreaks}
                        className='data-[state=checked]:bg-blue-600'
                    />
                    <span className='text-sm font-medium text-gray-700'>Show Breaks</span>
                </div>

                <div className="flex bg-gray-100 rounded-lg p-1">
                    {Days.map((button) => (
                        <button
                            onClick={() => setVisibleDays([button.value])}
                            key={button.value}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${visibleDays[0] === button.value
                                ? `${userType}-bg hover-${userType}-bg text-[#fff] shadow-sm`
                                : 'text-gray-600 hover:text-gray-900 bg-white shadow-sm border border-gray-200'
                                }`}
                        >
                            {button.label}
                        </button>
                    ))}
                </div>

                <div className='flex gap-[16px] items-center'>


                    {(userType === 'admin' || userType === 'vendor') &&
                        <Button
                            onClick={() => {
                                setOpen(true)
                                setPopupType('break')
                            }}
                            className={`font-raleway text-[14px] font-[600] bg-[#4290E9] hover-${userType}-bg flex justify-center items-center px-[40px] h-[42px] ${userType}-bg`}>
                            Add Time Off
                        </Button>
                    }

                    {(userType !== 'vendor') &&
                        <Link href={'/dashboard/orders/create?from=calendar'} className={`font-raleway text-[14px] font-[600] bg-[#4290E9] hover-${userType}-bg rounded-[6px] text-[#fff] flex justify-center items-center px-[40px] h-[42px] ${userType}-bg`}>
                            Create New Booking
                        </Link>
                    }
                </div>
            </div>
        )
    }


    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setContextMenu(null);
        };
        document.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('click', handleClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };
        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, []);

    function getHSLColorFromID(id: number): { bg: string, border: string } {
        const hue = (id * 137.508) % 360;
        const saturation = 70;
        const lightness = 85;
        // Let's try 50% lightness for border.
        return {
            bg: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
            border: `hsl(${hue}, ${saturation}%, 50%)`
        };
    }

    const handleAddBreak = (event: CalendarEvent) => {
        setCustomEvents((prev) => [...prev, event]);
        setSelectedBreakEvent(null);
    };

    const handleNavigate = (newDate: Date) => {
        setDate(newDate);
        setCurrentMonthYear({
            month: dayjs(newDate).format('MMMM'),
            year: dayjs(newDate).format('YYYY'),
        });
    };
    //('vendorData', vendorData);

    const deleteVendorBreakFromUI = (breakUuid: string) => {
        if (!setVendorData || !breakUuid) return;

        setVendorData((prev) =>
            prev.map(vendor => {
                // Check if this vendor has the break that needs to be deleted
                const hasBreak = vendor.additional_breaks?.some(brk => brk.uuid === breakUuid);

                if (hasBreak) {
                    // Remove the break from this vendor's additional_breaks array
                    return {
                        ...vendor,
                        additional_breaks: vendor.additional_breaks?.filter(brk => brk.uuid !== breakUuid) || []
                    };
                }
                return vendor;
            })
        );
    };

    const handleDeleteClick = () => {
        if (!selectedBreakEvent) return;

        setBreakToDelete(selectedBreakEvent);

        if (showAgain) {
            setIsConfirmOpen(true);
        } else {
            // If "don't show again" is checked, delete immediately
            confirmDelete(selectedBreakEvent);
        }
    };

    const confirmDelete = async (breakEvent = breakToDelete) => {
        const token = localStorage.getItem('token');
        const breakUuid = breakEvent?.uuid;

        if (!breakUuid) return;

        try {
            await DeleteVendorBreak(breakUuid, token ?? '');

            deleteVendorBreakFromUI(breakUuid);

            setCustomEvents(prev => prev.filter(event => event.uuid !== breakUuid));

            setAdditionalBreakEvents(prev => prev.filter(event => event.uuid !== breakUuid));

            toast.success('Break deleted successfully');

            setSelectedBreakEvent(null);

        } catch (error) {
            console.log(error);
            toast.error('Failed to delete break');
        } finally {
            setBreakToDelete(null);
        }
    };

    const generateMonthlyBreakEvents = (vendors: CalanderVendor[], selectedVendors: string[], currentDate: Date): CalendarEvent[] => {
        const events: CalendarEvent[] = [];
        const today = dayjs(currentDate);
        const startOfMonth = today.startOf('month');
        const endOfMonth = today.endOf('month');

        vendors.forEach((vendor) => {
            const matchVendor =
                selectedVendors.includes('ALL') ||
                selectedVendors.includes(String(vendor.uuid));

            if (!matchVendor) return;

            // Regular work breaks - generate for every day in the month
            const { break_start, break_end } = vendor.work_hours;
            if (break_start && break_end) {
                let currentDate = startOfMonth;
                while (currentDate.isBefore(endOfMonth) || currentDate.isSame(endOfMonth)) {
                    const startDate = dayjs(`${currentDate.format('YYYY-MM-DD')}T${break_start}`).toDate();
                    const endDate = dayjs(`${currentDate.format('YYYY-MM-DD')}T${break_end}`).toDate();

                    events.push({
                        title: `${vendor.first_name} ${vendor.last_name}`,
                        start: startDate,
                        end: endDate,
                        vendor_id: vendor.uuid,
                        vendor_name: "Break",
                        color_id: Number(vendor?.company?.vendor_id ?? 0)
                    });
                    currentDate = currentDate.add(1, 'day');
                }
            }

            // Additional breaks
            if (vendor.additional_breaks) {
                vendor.additional_breaks.forEach((brk) => {
                    const breakDate = dayjs(brk.start_date);
                    // Simple date range check - same month and year
                    if (breakDate.month() === today.month() && breakDate.year() === today.year()) {
                        events.push({
                            title: brk.title || "Break",
                            start: dayjs(`${brk.start_date}T${brk.start_time}`).toDate(),
                            end: dayjs(`${brk.start_date}T${brk.end_time}`).toDate(),
                            vendor_id: vendor.uuid,
                            vendor_name: `${vendor.first_name} ${vendor.last_name}`,
                            color_id: Number(vendor?.company?.vendor_id ?? 0),
                            uuid: brk.uuid
                        });
                    }
                });
            }
        });

        return events;
    };

    const generateMonthlyEvents = (orderData: Order[], vendorData: CalanderVendor[], selectedservice: string[], selectedVendors: string[], currentDate: Date): CalendarEvent[] => {
        const monthlyEvents: CalendarEvent[] = [];
        const today = dayjs(currentDate);
        const currentMonth = today.month();
        const currentYear = today.year();

        // Process order events for monthly view
        orderData?.forEach((order) => {
            order.slots.forEach((slot) => {
                const slotDate = dayjs(slot.date);

                // Only include slots that fall within the current month view
                // Check if same month and year
                if (slotDate.month() !== currentMonth || slotDate.year() !== currentYear) {
                    return;
                }

                const matchService =
                    selectedservice.includes('ALL') ||
                    selectedservice.includes(String(slot.service_id)) ||
                    (selectedservice.length === 0) ||
                    (selectedservice.includes('TIME_OFF') && selectedservice.filter(s => s !== 'TIME_OFF').length === 0);

                const matchVendor =
                    selectedVendors.includes('ALL') ||
                    selectedVendors.includes(String(slot.vendor_id));

                if (matchService && matchVendor) {
                    monthlyEvents.push({
                        title: `${slot.vendor?.first_name ?? "Vendor"} ${slot.vendor?.last_name ?? ""}`.trim(),
                        start: dayjs(`${slot.date} ${slot.start_time}`).toDate(),
                        end: dayjs(`${slot.date} ${slot.end_time}`).toDate(),
                        vendor_id: slot.vendor.uuid,
                        service_id: slot.service_id,
                        order_id: order.uuid,
                        // @ts-expect-error skip
                        color_id: Number(slot.vendor?.company?.vendor_id ?? 0)
                    });
                }
            });
        });

        return monthlyEvents;
    };

    const MonthlyEvent = ({ event }: { event: CalendarEvent }) => {
        const isBreak = event.title.includes("Break") || !!event.vendor_name;
        const isMultiDay = dayjs(event.end).diff(dayjs(event.start), 'day') > 0;
        const displayTime = !isBreak && !isMultiDay ? dayjs(event.start).format('HH:mm') : '';

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={`text-xs p-1 truncate w-full ${isBreak ? 'striped-background' : ''}`}>
                            {isBreak ? (
                                <div className="flex items-center w-full bg-white/60 px-1 rounded-sm">
                                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-1.5 flex-shrink-0"></div>
                                    <div className="flex items-center gap-1 min-w-0">
                                        {event.vendor_name === 'Break' ? <Coffee className="w-3 h-3 flex-shrink-0" /> : <Plane className="w-3 h-3 flex-shrink-0" />}
                                        <span className="truncate font-normal">{event.title} {event.vendor_name ? `- ${event.vendor_name}` : ''}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center w-full">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1.5 flex-shrink-0"></div>
                                    <span className="truncate font-medium">
                                        {displayTime && <span className="mr-1 opacity-80">{displayTime}</span>}
                                        {event.title}
                                    </span>
                                </div>
                            )}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="z-[9999] p-3 max-w-[300px] min-w-[250px] bg-white border border-gray-200 shadow-xl rounded-md">
                        {isBreak ? (
                            <div className="flex flex-col gap-1.5 text-sm text-black">
                                {event.vendor_name === 'Break' ? (
                                    <p className='font-bold text-gray-800 border-b pb-1'>Lunch Break</p>
                                ) : (
                                    <p className='font-bold text-gray-800 border-b pb-1'>Time Off</p>
                                )}

                                {event.vendor_name !== 'Break' && (
                                    <div><span className="font-semibold text-gray-700">Vendor:</span> {event.vendor_name}</div>
                                )}

                                {event.vendor_name === 'Break' ? (
                                    <div><span className="font-semibold text-gray-700">Vendor:</span> {event.title}</div>
                                ) : (
                                    <div><span className="font-semibold text-gray-700">Title:</span> {event.title}</div>
                                )}

                                <div className="text-gray-500">
                                    {dayjs(event.start).format("hh:mm A")} - {dayjs(event.end).format("hh:mm A")}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1.5 text-sm text-black">
                                <p className='font-bold text-gray-800 border-b pb-1'>Appointment</p>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700">Vendor:</span>
                                    <div className="flex items-center gap-1">
                                        <div
                                            className="w-3 h-3 rounded-full shrink-0 border border-gray-400"
                                            style={{ backgroundColor: getHSLColorFromID(Number(event.color_id)).bg }}
                                        />
                                        <span>{event.title}</span>
                                    </div>
                                </div>
                                {event.address && (
                                    <div className="leading-snug text-gray-600 italic">{event.address}</div>
                                )}
                                <div className="text-blue-600 font-medium my-1">
                                    {dayjs(event.start).format("MMM D, YYYY, hh:mm A")} - {dayjs(event.end).format("hh:mm A")}
                                </div>
                                {event.service_name && (() => {
                                    const service = serviceData.find(s => s.id === event.service_id);
                                    const bgColor = service?.background_color;
                                    const borderColor = service?.border_color;
                                    return (
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-700">Service:</span>
                                            <div className="flex items-center gap-1">
                                                {bgColor && (
                                                    <div
                                                        className="w-3 h-3 rounded-full shrink-0"
                                                        style={{
                                                            backgroundColor: bgColor,
                                                            border: `1px solid ${borderColor || bgColor}`
                                                        }}
                                                    />
                                                )}
                                                <span>{event.service_name}</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };
    return (
        <div style={{ height: 'auto' }}>
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-expect-error  */}
            <AddBreakPopup popupType={popupType} onAddBreak={handleAddBreak} open={open} setOpen={setOpen} currentBreak={selectedBreakEvent} vendorData={vendorData} setVendorData={setVendorData as (vendors: CalanderVendor[] | ((prev: CalanderVendor[]) => CalanderVendor[])) => void} // Type assertion
            />

            <ConfirmationDialog
                open={isConfirmOpen}
                setOpen={setIsConfirmOpen}
                onConfirm={() => confirmDelete()}
                showAgain={showAgain}
                toggleShowAgain={handleToggleShowAgain}
                dialogType="delete"
            />

            {contextMenu && (
                <div
                    className="absolute z-50 bg-white border rounded shadow p-2"
                    style={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
                    onClick={() => setContextMenu(null)}
                >
                    <p>Double click event</p>

                </div>
            )}

            {selectedBreakEvent && (
                <BreakQuickViewCard handleDelete={handleDeleteClick} data={selectedBreakEvent} vendorData={vendorData} onClose={() => { setSelectedBreakEvent(null) }} breakAction={() => setOpen(true)} />
            )}
            {selectedOrder && (
                <OrderQuickViewCard setOpenDetails={setOpenDetails} data={selectedOrder} orderData={orderData} serviceData={serviceData} agentData={agentData} vendorData={vendorData} onClose={() => { setSelectedOrder(null) }} />
            )}

            <OrderDetailView agentData={agentData} open={openDetails} onClose={() => { setOpenDetails(false) }} orderId={String(selectedOrder?.order_id) ?? 'c5527273-88cb-414f-8f23-26c2bdd852d4'} serviceId={selectedOrder?.service_id ?? 22} orderData={orderData} refreshOrders={refreshOrders} />

            <div className='min-h-screen'>
                {(() => {
                    switch (visibleDays[0]) {
                        case '30':
                            const monthlyOrderEvents = generateMonthlyEvents(orderData, vendorData, selectedservice, selectedVendors, date);
                            const monthlyBreakEvents = generateMonthlyBreakEvents(vendorData, selectedVendors, date);

                            const allMonthlyEvents = [
                                ...monthlyOrderEvents,
                                ...monthlyBreakEvents,
                                ...(customEvents || []),
                                ...vendorEvents,
                            ];

                            const filteredMonthlyEvents = isTimeOffSelected && selectedServicesWithoutTimeOff.length === 0
                                ? [...monthlyBreakEvents, ...(customEvents || []), ...vendorEvents]
                                : allMonthlyEvents;

                            const finalMonthlyEvents = filteredMonthlyEvents.filter(event => {
                                if (showBreaks) return true;
                                const isBreak = event.title?.includes("Break") || !!event.vendor_name;
                                return !isBreak;
                            });

                            return (
                                <div className="month-calendar-container w-full" style={{ height: '120vh', maxWidth: isSidebarOpen ? 'calc(100vw - 17rem)' : '100%' }}>
                                    <Calendar
                                        localizer={localizer}
                                        events={finalMonthlyEvents}
                                        date={date}
                                        view={Views.MONTH}
                                        views={{ month: true }}
                                        startAccessor="start"
                                        endAccessor="end"
                                        onNavigate={handleNavigate}
                                        style={{ height: '120vh' }}
                                        selectable
                                        tooltipAccessor={null}
                                        components={{
                                            toolbar: CustomToolbar,
                                            event: MonthlyEvent,
                                        }}
                                        eventPropGetter={(event) => {
                                            const colors = getHSLColorFromID(event.color_id ?? 0);
                                            const isBreak = event.title?.includes("Break") || !!event.vendor_name;
                                            return {
                                                className: isBreak ? 'striped-background' : '',
                                                style: {
                                                    backgroundColor: colors.bg,
                                                    color: '#000',
                                                    border: isBreak ? `2px solid ${colors.border}` : 'none',
                                                }
                                            };
                                        }}
                                        onSelectEvent={(event: CalendarEvent) => {
                                            setDate(event.start);
                                            setVisibleDays(['1']);
                                            if (!event.order_id) {
                                                setSelectedBreakEvent(event);
                                                setSelectedOrder(null);

                                            } else {
                                                setSelectedOrder(event);
                                                setSelectedBreakEvent(null);
                                            }
                                        }}
                                        onSelectSlot={(slotInfo) => {
                                            setDate(slotInfo.start);
                                            setVisibleDays(['1']);
                                        }}
                                        popup
                                        showMultiDayTimes
                                    />
                                </div>
                            );
                        case '7':
                            return (
                                <Calendar
                                    tooltipAccessor={null}
                                    localizer={localizer}
                                    events={allEvents}
                                    view={Views.WEEK}
                                    views={['week']}
                                    date={date}
                                    onView={() => { }}
                                    onNavigate={handleNavigate}
                                    startAccessor="start"
                                    endAccessor="end"
                                    toolbar={true}
                                    components={{
                                        toolbar: CustomToolbar,
                                        event: CustomEvent,
                                        week: {
                                            header: CustomDateHeader,
                                        },
                                    }}
                                    className={`my-${userType}-calendar`}
                                    style={{ height: '100%' }}
                                    showMultiDayTimes={false}
                                    step={30}
                                    timeslots={1}
                                    min={minTime}
                                    max={maxTime}
                                    dayLayoutAlgorithm="no-overlap"
                                    eventPropGetter={(event) => {
                                        const colors = getHSLColorFromID(event.color_id ?? 0);
                                        const isBreak = event.title?.includes("Break") || !!event.vendor_name;
                                        return {
                                            className: isBreak ? 'striped-background' : '',
                                            style: {
                                                backgroundColor: colors.bg,
                                                color: '#000',
                                                border: isBreak ? `2px solid ${colors.border}` : 'none',
                                            }
                                        };
                                    }}
                                    onSelectEvent={(event: CalendarEvent) => {

                                        if (!event.order_id) {
                                            setSelectedBreakEvent(event);
                                            setSelectedOrder(null);
                                        } else {
                                            setSelectedOrder(event);
                                            setSelectedBreakEvent(null);
                                        }

                                    }}
                                />
                            );
                        case '5':
                            return (
                                <Calendar
                                    tooltipAccessor={null}
                                    localizer={localizer}
                                    events={allEvents}
                                    date={date}
                                    onNavigate={handleNavigate}
                                    view={Views.WORK_WEEK}
                                    defaultView={Views.WORK_WEEK}
                                    views={{ work_week: true }}
                                    startAccessor="start"
                                    endAccessor="end"
                                    step={30}
                                    timeslots={1}
                                    min={minTime}
                                    max={maxTime}
                                    showMultiDayTimes={false}
                                    dayLayoutAlgorithm="no-overlap"
                                    toolbar={true}
                                    style={{ height: '100%' }}
                                    components={{
                                        toolbar: CustomToolbar,
                                        event: CustomEvent,
                                        week: {
                                            header: CustomDateHeader,
                                        },
                                        work_week: {
                                            header: CustomDateHeader,
                                        },
                                    }}
                                    className={`my-${userType}-calendar`}
                                    eventPropGetter={(event) => {
                                        const colors = getHSLColorFromID(event.color_id ?? 0);
                                        const isBreak = event.title?.includes("Break") || !!event.vendor_name;
                                        return {
                                            className: isBreak ? 'striped-background' : '',
                                            style: {
                                                backgroundColor: colors.bg,
                                                color: '#000',
                                                border: isBreak ? `2px solid ${colors.border}` : 'none',
                                            },
                                        };
                                    }}
                                    onSelectEvent={(event: CalendarEvent) => {
                                        if (!event.order_id) {
                                            setSelectedBreakEvent(event);
                                            setSelectedOrder(null);
                                        } else {
                                            setSelectedOrder(event);
                                            setSelectedBreakEvent(null);
                                        }
                                    }}
                                />
                            );
                        case '3':
                            return (
                                <Calendar
                                    tooltipAccessor={null}
                                    localizer={localizer}
                                    date={dayjs(date).startOf('day').toDate()}
                                    onNavigate={handleNavigate}
                                    events={allEvents}
                                    views={customViews}
                                    defaultView={"custom_3day" as View}
                                    defaultDate={new Date()}
                                    style={{ height: '100%' }}
                                    step={30}
                                    startAccessor="start"
                                    endAccessor="end"
                                    timeslots={1}
                                    min={minTime}
                                    max={maxTime}
                                    eventPropGetter={(event) => {
                                        const colors = getHSLColorFromID(event.color_id ?? 0);
                                        const isBreak = event.title?.includes("Break") || !!event.vendor_name;
                                        return {
                                            className: isBreak ? 'striped-background' : '',
                                            style: {
                                                backgroundColor: colors.bg,
                                                color: '#000',
                                                border: isBreak ? `2px solid ${colors.border}` : 'none',
                                            }
                                        };
                                    }}
                                    components={{
                                        toolbar: CustomToolbar,
                                        event: CustomEvent,
                                    }}
                                    className={`my-${userType}-calendar`}
                                    onSelectEvent={(event: CalendarEvent) => {
                                        if (!event.order_id) {
                                            setSelectedBreakEvent(event);
                                            setSelectedOrder(null);
                                        } else {
                                            setSelectedOrder(event);
                                            setSelectedBreakEvent(null);
                                        }
                                    }}
                                    dayLayoutAlgorithm="no-overlap"
                                />
                            );
                        case '1':
                        default:
                            return (
                                <Calendar
                                    tooltipAccessor={null}
                                    localizer={localizer}
                                    events={allEvents}
                                    date={date}
                                    onNavigate={handleNavigate}
                                    view={Views.DAY}
                                    views={[Views.DAY]}
                                    startAccessor="start"
                                    endAccessor="end"
                                    step={30}
                                    timeslots={1}
                                    min={minTime}
                                    max={maxTime}
                                    showMultiDayTimes={false}
                                    dayLayoutAlgorithm="no-overlap"
                                    toolbar={true}
                                    style={{ height: '100%' }}
                                    components={{
                                        toolbar: CustomDayToolbar,
                                        event: CustomEvent,
                                        day: {
                                            header: CustomDateHeader,
                                        },
                                    }}
                                    resources={paginatedResources}
                                    resourceIdAccessor="id"
                                    resourceTitleAccessor="title"
                                    className={`my-${userType}-calendar`}
                                    eventPropGetter={(event) => {
                                        const colors = getHSLColorFromID(event.color_id ?? 0);
                                        const isBreak = event.title?.includes("Break") || !!event.vendor_name;
                                        return {
                                            className: isBreak ? 'striped-background' : '',
                                            style: {
                                                backgroundColor: colors.bg,
                                                color: '#000',
                                                border: isBreak ? `2px solid ${colors.border}` : 'none',
                                            },
                                        };
                                    }}
                                    onSelectEvent={(event: CalendarEvent) => {
                                        if (!event.order_id) {
                                            setSelectedBreakEvent(event);
                                            setSelectedOrder(null);
                                        } else {
                                            setSelectedOrder(event);
                                            setSelectedBreakEvent(null);
                                        }
                                    }}
                                />
                            );
                    }
                })()}
            </div>
        </div >
    );
};

export default BigCalendar;
