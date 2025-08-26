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

const localizer = dayjsLocalizer(dayjs);

export type Vendor = {
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
};

interface BigCalendarProps {
    orderData: Order[]
    selectedservice: string[]
    selectedVendors: string[]
    visibleDays: number;
    customEvents?: CalendarEvent[]
    onAddCustomEvent?: (event: CalendarEvent) => void
    vendorData: Vendor[]
    setCurrentMonthYear: (value: { month: string; year: string }) => void;
    serviceData: Services[]
    agentData: Agent[]
}

interface CustomToolbarProps {
    date: Date;
    onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE', newDate?: Date) => void;
}

type CalendarEvent = {
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    vendor_id?: string
    color_id?: number
    service_id?: number;
    order_id?: string
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

const generateWeeklyBreakEvents = (vendors: Vendor[], referenceDate: Date): CalendarEvent[] => {
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

const BigCalendar = ({ orderData, selectedservice, selectedVendors, vendorData, visibleDays, setCurrentMonthYear, serviceData, agentData }: BigCalendarProps) => {
    const {userType} = useAppContext();
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


    useEffect(() => {
        const breaks = generateWeeklyBreakEvents(vendorData, date);
        setVendorBreaks(breaks);
    }, [vendorData, date]);


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

    const filteredEvents = events.filter((event) => {
        const matchService =
            selectedservice.includes('ALL') || selectedservice.includes(String(event.service_id));

        const matchVendor =
            selectedVendors.includes('ALL') || selectedVendors.includes(String(event.vendor_id));

        return matchService && matchVendor;
    });

    const filteredBreaks = vendorBreaks.filter((event) => {
        return selectedVendors.includes('ALL') || selectedVendors.includes(String(event.vendor_id));
    });

    const allEvents = [
        ...filteredEvents,
        ...filteredBreaks,
        ...(customEvents || [])
    ];

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
                <div className='flex gap-[16px] w-auto pr-[20px]'>
                    <Button onClick={() => setOpen(true)} className={`font-raleway text-[14px] font-[600] bg-[#4290E9] hover-${userType}-bg flex justify-center items-center px-[40px] h-[42px] ${userType}-bg`}>Add Break</Button>
                    <Link href={'/dashboard/orders/create'} className={`font-raleway text-[14px] font-[600] bg-[#4290E9] hover-${userType}-bg rounded-[6px] text-[#fff] flex justify-center items-center px-[40px] h-[42px] ${userType}-bg`}>Create New Booking</Link>
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

    return (
        <div style={{ height: 'auto' }}>
            <AddBreakPopup onAddBreak={handleAddBreak} open={open} setOpen={setOpen} vendorData={vendorData} />
            {visibleDays == 7 &&
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
                        if (event.title.includes('Break')) {
                            setSelectedBreakEvent(event);
                            setSelectedOrder(null);
                        }
                        if (!event.title.includes('Break')) {
                            setSelectedOrder(event);
                            setSelectedBreakEvent(null);
                        }
                    }}
                />
            }
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
                <BreakQuickViewCard data={selectedBreakEvent} vendorData={vendorData} onClose={() => { setSelectedBreakEvent(null) }} />
            )}
            {selectedOrder && (
                <OrderQuickViewCard setOpenDetails={setOpenDetails} data={selectedOrder} orderData={orderData} serviceData={serviceData} agentData={agentData} vendorData={vendorData} onClose={() => { setSelectedOrder(null) }} />
            )}

            <OrderDetailView agentData={agentData} open={openDetails} onClose={() => { setOpenDetails(false) }} orderId={selectedOrder?.order_id ?? 'c5527273-88cb-414f-8f23-26c2bdd852d4'} serviceId={selectedOrder?.service_id ?? 22} orderData={orderData} />

            <div>
                {visibleDays == 5 &&
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
                            if (event.title === 'Break') {
                                setSelectedBreakEvent(event);
                                setSelectedOrder(null);
                            }
                            if (event.title !== 'Break') {
                                setSelectedOrder(event);
                                setSelectedBreakEvent(null);
                            }
                        }}
                    />
                }
                {visibleDays === 3 && (
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
                            if (event.title === 'Break') {
                                setSelectedBreakEvent(event);
                                setSelectedOrder(null);
                            }
                            if (event.title !== 'Break') {
                                setSelectedOrder(event);
                                setSelectedBreakEvent(null);
                            }
                        }}
                        dayLayoutAlgorithm="no-overlap"
                    />

                )}

                {visibleDays == 1 && (
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
                            if (event.title === 'Break') {
                                setSelectedBreakEvent(event);
                                setSelectedOrder(null);
                            }
                            if (event.title !== 'Break') {
                                setSelectedOrder(event);
                                setSelectedBreakEvent(null);
                            }
                        }}
                    />
                )}

            </div>
        </div>
    );
};

export default BigCalendar;
