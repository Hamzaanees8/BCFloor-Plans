'use client';
import React, { useEffect, useState } from 'react';
import { Calendar, dayjsLocalizer, View, Views } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Order } from '../../orders/page';
import '../calendar.css'
import { Button } from '@/components/ui/button';
import AddBreakPopup from './AddBreakPopup';
import BreakQuickViewCard from './BreakQuickViewCard';
import { ThreeDayView } from './ThreeDayView';
import OrderQuickViewCard from './OrderQuickViewCard';
import { Services } from '../../services/page';
import { Agent } from '@/components/AgentTable';
import Link from 'next/link';
import OrderDetailView from './OrderDetailView';
import { useAppContext } from '@/app/context/AppContext';
import { toast } from 'sonner';
import { DeleteVendorBreak } from '../calendar';
import { api } from '@/lib/api';

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
                    title: `${vendor.first_name} ${vendor.last_name}-Break`,
                    start: startDate,
                    end: endDate,
                    vendor_id: vendor.uuid,
                    color_id: Number(vendor?.company?.vendor_id ?? 0)
                });
            }
        });
    }

    return events;
};

const BigCalendar = ({ orderData, selectedservice, selectedVendors, vendorData, setVendorData, visibleDays, setVisibleDays, setCurrentMonthYear, serviceData, agentData }: BigCalendarProps) => {
    const { userType } = useAppContext();
    const [date, setDate] = useState(new Date());
    const [open, setOpen] = useState(false);
    const [openDetails, setOpenDetails] = useState(false);
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

    useEffect(() => {
        if (userType !== 'vendor') {
            setVendorEvents([]);
            return;
        }

        const fetchVendorEvents = async () => {
            try {
                let start_date, end_date;
                if (visibleDays[0] === '30') {
                    start_date = dayjs(date).startOf('month').format('YYYY-MM-DD');
                    end_date = dayjs(date).endOf('month').format('YYYY-MM-DD');
                } else if (visibleDays[0] === '7') {
                    start_date = dayjs(date).startOf('week').format('YYYY-MM-DD');
                    end_date = dayjs(date).endOf('week').format('YYYY-MM-DD');
                } else {
                    start_date = dayjs(date).format('YYYY-MM-DD');
                    end_date = dayjs(date).format('YYYY-MM-DD');
                }

                const response = await api.get('/vendor/calendar/events', {
                    params: {
                        period: 'custom',
                        start_date,
                        end_date
                    }
                });

                if (response.data.success) {
                    const mappedEvents = response.data.events.map((event: { id: string; start: string; end: string; all_day: boolean }) => {
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
                        };
                    });
                    setVendorEvents(mappedEvents);
                }
            } catch (error) {
                console.error('Failed to fetch vendor events:', error);
            }
        };

        fetchVendorEvents();
    }, [userType, date, visibleDays]);

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

        const groupedEvents: {
            title: string;
            start: Date;
            end: Date;
            vendor_id: string;
            service_id?: number;
            color_id: number;
            order_id?: string;

        }[] = [];

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
                        groupedEvents.push({
                            title: `${firstSlot.vendor?.first_name ?? "Vendor"} ${firstSlot.vendor?.last_name ?? ""}`.trim(),
                            start: dayjs(`${firstSlot.date} ${firstSlot.start_time}`).toDate(),
                            end: dayjs(`${lastSlot.date} ${lastSlot.end_time}`).toDate(),
                            vendor_id: firstSlot.vendor.uuid,
                            service_id: firstSlot.service_id,
                            order_id: order.uuid,
                            // @ts-expect-error skip
                            color_id: Number(firstSlot.vendor?.company?.vendor_id ?? 0)
                        });
                        currentGroup = [slot];
                    }
                }
            }

            if (currentGroup.length > 0) {
                const firstSlot = currentGroup[0];

                const lastSlot = currentGroup[currentGroup.length - 1];
                groupedEvents.push({
                    title: `${firstSlot.vendor?.first_name ?? "Vendor"} ${firstSlot.vendor?.last_name ?? ""}`.trim(),
                    start: dayjs(`${firstSlot.date} ${firstSlot.start_time}`).toDate(),
                    end: dayjs(`${lastSlot.date} ${lastSlot.end_time}`).toDate(),
                    vendor_id: firstSlot.vendor.uuid,
                    service_id: firstSlot.service_id,
                    order_id: order.uuid,
                    // @ts-expect-error skip
                    color_id: firstSlot.vendor.company?.vendor_id
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
                        const end = dayjs(`${brk.start_date}T${brk.start_time}`).add(1, 'hour').toDate();

                        newAdditionalBreakEvents.push({
                            title: `${vendor.first_name} ${vendor.last_name}-Break`,
                            start,
                            end,
                            vendor_id: vendor.uuid,
                            color_id: Number(vendor?.company?.vendor_id ?? 0),
                            uuid: brk.uuid,
                            address: brk.address
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

    let allEvents: CalendarEvent[] = [];

    if (isTimeOffSelected && selectedServicesWithoutTimeOff.length === 0) {
        allEvents = [
            // ...filteredBreaks,
            ...filteredAdditionalBreaks,
            ...(customEvents || []),
            ...vendorEvents,
        ];
    } else {
        allEvents = [
            ...filteredEvents,
            ...filteredBreaks,
            ...filteredAdditionalBreaks,
            ...(customEvents || []),
            ...vendorEvents,
        ];
    }



    // const allEvents = [
    //     ...filteredEvents,
    //     ...filteredBreaks,
    //     ...filteredAdditionalBreaks,
    //     ...(customEvents || [])
    // ];

    const CustomEvent = ({ event }: { event: CalendarEvent }) => {

        const handleContextMenu = (e: React.MouseEvent) => {
            e.preventDefault();
            setContextMenu({
                mouseX: e.clientX,
                mouseY: e.clientY,
                eventData: event,
            });
        };

        const isBreak = event.title.includes("Break");
        const [vendorName, breakLabel] = event.title.split("-"); // assumes "FirstName Break"

        return (
            <div
                onContextMenu={handleContextMenu}
                className="h-full w-full flex flex-col justify-center cursor-pointer"
            >
                {isBreak ? (
                    <div className='flex flex-col'>
                        <span className="">{vendorName}</span>
                        <span className="">{breakLabel}</span>
                    </div>
                ) : (
                    <>
                        <span className="">{event.title}</span>
                        <span className="mt-[2px]">
                            {dayjs(event.start).format("hh:mm A")} - {dayjs(event.end).format("hh:mm A")}
                        </span>
                    </>
                )}
            </div>
        );
    };

    const CustomToolbar = ({ onNavigate }: CustomToolbarProps) => {
        const Days = [
            { label: "1 Days", value: "1" },
            { label: "Weekly", value: "7" },
            { label: "Monthly", value: "30" },
        ];

        return (
            <div className='flex justify-between mb-4'>
                <div className='flex gap-[10px]'>
                    <button onClick={() => onNavigate('PREV')} className='w-[30px] h-[30px] flex justify-center items-center hover:bg-gray-300 rounded-full'>
                        <ChevronLeft color='#7D7D7D' />
                    </button>

                    <button onClick={() => onNavigate('NEXT')} className='w-[30px] h-[30px] flex justify-center items-center hover:bg-gray-300 rounded-full'>
                        <ChevronRight color='#7D7D7D' />
                    </button>
                </div>

                <div className="flex bg-gray-100 rounded-lg p-1">
                    {Days.map((button) => (
                        <button
                            onClick={() => setVisibleDays([button.value])}
                            key={button.value}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${visibleDays[0] === button.value
                                ? `${userType}-bg hover-${userType}-bg text-[#fff] shadow-sm`
                                : 'text-gray-600 hover:text-gray-900'
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
                        <Link href={'/dashboard/orders/create'} className={`font-raleway text-[14px] font-[600] bg-[#4290E9] hover-${userType}-bg rounded-[6px] text-[#fff] flex justify-center items-center px-[40px] h-[42px] ${userType}-bg`}>
                            Create New Booking
                        </Link>
                    }
                </div>
            </div>
        );
    };
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

    function getHSLColorFromID(id: number): string {
        const hue = (id * 137) % 360;
        const saturation = 70;
        const lightness = 90;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    const handleAddBreak = (event: CalendarEvent) => {
        setCustomEvents((prev) => [...prev, event]);
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

    async function handleDelete() {
        const token = localStorage.getItem('token');

        try {
            await DeleteVendorBreak(selectedBreakEvent?.uuid ?? '', token ?? '');

            // Remove the break from UI
            if (selectedBreakEvent?.uuid) {
                deleteVendorBreakFromUI(selectedBreakEvent.uuid);
            }

            // Also remove from customEvents if it exists there
            setCustomEvents(prev => prev.filter(event => event.uuid !== selectedBreakEvent?.uuid));

            // Remove from additionalBreakEvents state
            setAdditionalBreakEvents(prev => prev.filter(event => event.uuid !== selectedBreakEvent?.uuid));

            toast.success('Break deleted successfully');

            // Close the quick view card
            setSelectedBreakEvent(null);

        } catch (error) {
            console.log(error);
            toast.error('Failed to delete break');
        }
    }

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
                        title: `${vendor.first_name} ${vendor.last_name}-Break`,
                        start: startDate,
                        end: endDate,
                        vendor_id: vendor.uuid,
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
                            title: 'Break',
                            start: dayjs(`${brk.start_date}T${brk.start_time}`).toDate(),
                            end: dayjs(`${brk.start_date}T${brk.end_time}`).toDate(),
                            vendor_id: vendor.uuid,
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
        const isBreak = event.title.includes("Break");
        const isMultiDay = dayjs(event.end).diff(dayjs(event.start), 'day') > 0;
        const displayTime = !isBreak && !isMultiDay ? dayjs(event.start).format('HH:mm') : '';

        return (
            <div className="text-xs p-1 truncate w-full">
                {isBreak ? (
                    <div className="flex items-center w-full">
                        <div className="w-2 h-2 bg-orange-400 rounded-full mr-1 flex-shrink-0"></div>
                        <span className="truncate">{event.title}</span>
                    </div>
                ) : (
                    <div className="flex items-center w-full">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 flex-shrink-0"></div>
                        <div className="flex flex-col truncate">
                            <span className="truncate font-medium">{event.title}</span>
                            {displayTime && (
                                <span className="text-xs text-gray-600">{displayTime}</span>
                            )}
                            {isMultiDay && (
                                <span className="text-xs text-gray-600">Multi-day</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };
    return (
        <div style={{ height: 'auto' }}>
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-expect-error  */}
            <AddBreakPopup popupType={popupType} onAddBreak={handleAddBreak} open={open} setOpen={setOpen} currentBreak={selectedBreakEvent} vendorData={vendorData} setVendorData={setVendorData as (vendors: CalanderVendor[] | ((prev: CalanderVendor[]) => CalanderVendor[])) => void} // Type assertion
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
                <BreakQuickViewCard handleDelete={handleDelete} data={selectedBreakEvent} vendorData={vendorData} onClose={() => { setSelectedBreakEvent(null) }} breakAction={() => setOpen(true)} />
            )}
            {selectedOrder && (
                <OrderQuickViewCard setOpenDetails={setOpenDetails} data={selectedOrder} orderData={orderData} serviceData={serviceData} agentData={agentData} vendorData={vendorData} onClose={() => { setSelectedOrder(null) }} />
            )}

            <OrderDetailView agentData={agentData} open={openDetails} onClose={() => { setOpenDetails(false) }} orderId={String(selectedOrder?.order_id) ?? 'c5527273-88cb-414f-8f23-26c2bdd852d4'} serviceId={selectedOrder?.service_id ?? 22} orderData={orderData} />

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

                            return (
                                <div className="month-calendar-container" style={{ height: '120vh' }}>
                                    <Calendar
                                        localizer={localizer}
                                        events={filteredMonthlyEvents}
                                        date={date}
                                        view={Views.MONTH}
                                        views={{ month: true }}
                                        startAccessor="start"
                                        endAccessor="end"
                                        onNavigate={handleNavigate}
                                        style={{ height: '120vh' }}
                                        selectable
                                        components={{
                                            toolbar: CustomToolbar,
                                            event: MonthlyEvent,
                                        }}
                                        eventPropGetter={(event) => {
                                            const backgroundColor = getHSLColorFromID(event.color_id ?? 0);
                                            return {
                                                style: {
                                                    backgroundColor,
                                                    color: '#000',
                                                }
                                            };
                                        }}
                                        onSelectEvent={(event: CalendarEvent) => {
                                            setDate(event.start);
                                            setVisibleDays(['1']);
                                            if (event.title.includes('Break') || event.title.includes('External Event')) {
                                                setSelectedBreakEvent(event);
                                                setSelectedOrder(null);

                                            } else {
                                                setSelectedOrder(event);
                                                setSelectedBreakEvent(null);
                                            }
                                        }}
                                        onSelectSlot={(slotInfo) => {
                                            // Switch to day view when clicking on a date cell
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
                                    dayLayoutAlgorithm="no-overlap"
                                    eventPropGetter={(event) => {
                                        const backgroundColor = getHSLColorFromID(event.color_id ?? 0);
                                        return {
                                            style: {
                                                backgroundColor,
                                                color: '#000',
                                            }
                                        };
                                    }}
                                    onSelectEvent={(event: CalendarEvent) => {

                                        if (event.title.includes('Break') || event.title.includes('External Event')) {
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
                                    timeslots={2}
                                    min={dayjs().startOf('day').toDate()}
                                    max={dayjs().endOf('day').toDate()}
                                    getNow={() => date}
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
                                        const backgroundColor = getHSLColorFromID(event.color_id ?? 0);
                                        return {
                                            style: {
                                                backgroundColor,
                                                color: '#000',
                                            },
                                        };
                                    }}
                                    onSelectEvent={(event: CalendarEvent) => {
                                        if (event.title.includes('Break') || event.title.includes('External Event')) {
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
                                    timeslots={2}
                                    min={dayjs().startOf('day').toDate()}
                                    max={dayjs().endOf('day').toDate()}
                                    eventPropGetter={(event) => {
                                        const backgroundColor = getHSLColorFromID(event.color_id ?? 0);
                                        return {
                                            style: {
                                                backgroundColor,
                                                color: '#000',
                                            }
                                        };
                                    }}
                                    components={{
                                        toolbar: CustomToolbar,
                                        event: CustomEvent,
                                    }}
                                    className={`my-${userType}-calendar`}
                                    onSelectEvent={(event: CalendarEvent) => {
                                        if (event.title.includes('Break') || event.title.includes('External Event')) {
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
                                    localizer={localizer}
                                    events={allEvents}
                                    date={date}
                                    onNavigate={handleNavigate}
                                    view={Views.DAY}
                                    views={[Views.DAY]}
                                    startAccessor="start"
                                    endAccessor="end"
                                    step={30}
                                    timeslots={2}
                                    min={dayjs().startOf('day').toDate()}
                                    max={dayjs().endOf('day').toDate()}
                                    getNow={() => date}
                                    showMultiDayTimes={false}
                                    dayLayoutAlgorithm="no-overlap"
                                    toolbar={true}
                                    style={{ height: '100%' }}
                                    components={{
                                        toolbar: CustomToolbar,
                                        event: CustomEvent,
                                        day: {
                                            header: CustomDateHeader,
                                        },
                                    }}
                                    className={`my-${userType}-calendar`}
                                    eventPropGetter={(event) => {
                                        const backgroundColor = getHSLColorFromID(event.color_id ?? 0);
                                        return {
                                            style: {
                                                backgroundColor,
                                                color: '#000',
                                            },
                                        };
                                    }}
                                    onSelectEvent={(event: CalendarEvent) => {
                                        if (event.title.includes('Break') || event.title.includes('External Event')) {
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
