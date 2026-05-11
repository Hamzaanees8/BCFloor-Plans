import React, { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns"

import { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { DropDownArrow } from './Icons'
import { X, Loader2, Calendar as CalendarIcon } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { Card, CardContent, CardFooter } from './ui/card'
import { Input } from './ui/input'
import { GetOne } from '@/app/dashboard/vendors/vendors'
import { Get as GetOrders } from '@/app/dashboard/orders/orders'
import { useAppContext } from '@/app/context/AppContext'

import { Vendor } from '@/lib/types'
import { batchCalculateTravelCosts } from '@/lib/batchTravelCalculator'


type OrderSlot = {
    id: number;
    uuid: string;
    start_time: string;
    end_time: string;
    distance: string | null;
    est_time: string | null;
    created_at: string;
    km_price: string | null;
    vendor_id: number;
    address: string;
    location: string;
    order_id: number
    service_id: number
    date: string
    order: {
        id: number;
        uuid: string;
        property_address: string;
        property_location: string;
        vendor_address: string;
        vendor_location: string;
        appoint_time: string;
        est_time: string;
        distance: string;
        km_price: string;
        amount: string;
        order_status: 'Processing' | 'Pending' | 'Completed' | 'On Hold';
        payment_status: 'PAID' | 'UNPAID';
        created_at: string;
        services?: {
            is_travel_required?: boolean | number;
            service?: {
                is_travel_required?: boolean | number;
            };
        }[];
    };
};

interface TravelTableProps {
    userId?: string;
}

type TravelItem = {
    order_id: number;
    from: string;
    to: string;
    date: string;
    service_id: number;
};

function groupSlots(slots: OrderSlot[]) {
    const grouped = Object.values(
        slots.reduce((acc, slot) => {
            const key = `${slot.order_id}_${slot.service_id}`;

            if (!acc[key]) {
                acc[key] = { ...slot };
            } else {
                acc[key].start_time =
                    slot.start_time < acc[key].start_time ? slot.start_time : acc[key].start_time;
                acc[key].end_time =
                    slot.end_time > acc[key].end_time ? slot.end_time : acc[key].end_time;
            }

            return acc;
        }, {} as Record<string, OrderSlot>)
    );

    return grouped;
}

function groupSlotsByDate(slots: OrderSlot[]) {
    const groupedByDate = slots.reduce((dateAcc, slot) => {
        const dateKey = slot.date;

        if (!dateAcc[dateKey]) {
            dateAcc[dateKey] = [];
        }

        dateAcc[dateKey].push(slot);
        return dateAcc;
    }, {} as Record<string, OrderSlot[]>);

    const finalGrouped = Object.entries(groupedByDate).map(([date, dateSlots]) => {
        const groupedSlots = Object.values(
            dateSlots.reduce((acc, slot) => {
                const key = `${slot.order_id}_${slot.service_id}`;
                if (!acc[key]) {
                    acc[key] = { ...slot };
                } else {
                    acc[key].start_time =
                        slot.start_time < acc[key].start_time ? slot.start_time : acc[key].start_time;
                    acc[key].end_time =
                        slot.end_time > acc[key].end_time ? slot.end_time : acc[key].end_time;
                }
                return acc;
            }, {} as Record<string, OrderSlot>)
        );

        return {
            date,
            slots: groupedSlots,
        };
    });

    return finalGrouped;
}

function sortGroupedSlots(groupedData: {
    date: string;
    slots: OrderSlot[]
}[]) {
    groupedData.forEach(group => {
        group.slots.sort((a, b) => {
            return a.start_time.localeCompare(b.start_time);
        });
    });

    groupedData.sort((a, b) => {
        const aFirstTime = a.slots[0]?.start_time ?? "99:99:99";
        const bFirstTime = b.slots[0]?.start_time ?? "99:99:99";
        const aDateTime = new Date(`${a.date}T${aFirstTime}`);
        const bDateTime = new Date(`${b.date}T${bFirstTime}`);
        return aDateTime.getTime() - bDateTime.getTime();
    });

    return groupedData;
}

const TravelTable: React.FC<TravelTableProps> = ({ userId }) => {
    const { userType } = useAppContext();
    const [vendorName, setVendorName] = useState<string>('');
    const [vendorData, setVendorData] = useState<Vendor | null>(null);
    const [startPoint, setStartPoint] = useState<string>('');
    const [vendor_address, setvendor_address] = useState<string>('');
    const [endPoint, setEndPoint] = useState<string>('');
    const [totalDistance, setTotalDistance] = useState<number | ''>("");
    const [paymentPerKm, setPaymentPerKm] = useState<number>(0);
    const [slotData, setSlotData] = useState<OrderSlot[]>([]);
    const [allslotData, setAllSlotData] = useState<OrderSlot[]>([]);
    const [totalPayout, setTotalPayout] = useState<string>('');
    const [distanceResults, setDistanceResults] = useState<{
        date: string,
        service_id: number,
        service_name: string,
        order_id: number,
        from: string,
        to: string,
        start_time: string,
        end_time: string,
        distance: number,
        est_time: number;
    }[]>([]);

    const [isCalculating, setIsCalculating] = useState(false);
    const [period, setPeriod] = useState<string>('last_30_days');

    const [date, setDate] = React.useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    // Handle period changes
    useEffect(() => {
        const today = new Date();
        let from: Date | undefined;
        let to: Date = today;

        switch (period) {
            case 'last_30_days':
                from = subDays(today, 30);
                break;
            case 'last_6_months':
                from = subMonths(today, 6);
                break;
            case 'last_year':
                from = subMonths(today, 12);
                break;
            case 'this_month':
                from = startOfMonth(today);
                to = endOfMonth(today);
                break;
            case 'custom':
                return;
            default:
                from = subDays(today, 30);
        }

        if (from) {
            setDate({ from, to });
        }
    }, [period]);

    const handleDateSelect = (newDate: DateRange | undefined) => {
        setDate(newDate);
        if (newDate && period !== 'custom') {
            setPeriod('custom');
        }
    };




    useEffect(() => {
        console.log('📊 slotData updated. Total unique orders available:', slotData.length);
    }, [slotData]);

    const filteredSlots = slotData.filter((slot, index) => {

        if (!date?.from || !date?.to) return true;

        // Robust date normalization: handle YYYY-MM-DD or ISO strings
        let slotDateStr = "";
        try {
            if (typeof slot.date === 'string' && slot.date.includes('T')) {
                slotDateStr = slot.date.split('T')[0];
            } else if (typeof slot.date === 'string') {
                slotDateStr = slot.date; // Assume YYYY-MM-DD
            } else {
                slotDateStr = new Date(slot.date).toISOString().split('T')[0];
            }
        } catch (e) {
            console.error('Error parsing slot date:', slot.date, e);
            return false;
        }

        const fromStr = date.from.toISOString().split('T')[0];
        const toStr = date.to.toISOString().split('T')[0];

        const isMatch = slotDateStr >= fromStr && slotDateStr <= toStr;

        if (index < 3) {
            console.log(`🔎 Filtering Slot ${index}: date=${slot.date} -> normalized=${slotDateStr}, range=${fromStr} to ${toStr}, match=${isMatch}`);
        }

        return isMatch;
    });



    const totalDistance1 = filteredSlots.reduce(
        (sum, slot) => sum + (parseFloat(slot.distance ?? "0") || 0),
        0
    ).toFixed(1);

    const [selectedSlot, setSelectedSlot] = React.useState<OrderSlot | null>(null);

    const [showQuickView, setShowQuickView] = React.useState(false);
    console.log('vendor_address', setSelectedSlot);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("Token not found.");
            return;
        }

        GetOne(userId || "")
            .then(data => {
                const vendor = data.data;
                console.log('📦 Vendor object keys:', Object.keys(vendor || {}));
                Object.keys(vendor || {}).forEach(key => {
                    const val = (vendor as any)[key];
                    if (Array.isArray(val)) {
                        console.log(`📏 Array field: ${key}, length: ${val.length}`);
                    }
                });
                if (vendor) {



                    setVendorName(vendor.first_name + " " + vendor.last_name);
                    const start_location = vendor?.addresses?.find(
                        (address: { type: string }) => address.type === 'start_location'
                    );
                    console.log('📍 Start location found:', start_location);
                    if (start_location) {

                        const start_address = [
                            start_location.address_line_1,
                            start_location.city,
                            start_location.country
                        ].filter(Boolean).join(', ');
                        setvendor_address(start_address);
                    } else {
                        console.warn("⚠️ Vendor has no start_location address.");
                        setvendor_address("");
                    }
                    setVendorData(vendor)
                }

                console.log('vendor', vendor);

                if (vendor?.order_slots && vendor.order_slots.length > 0) {
                    setAllSlotData(vendor?.order_slots)
                    // Sort order_slots by order.id
                    const allSlots = vendor.order_slots.sort((a: OrderSlot, b: OrderSlot) => {
                        const aId = a.order?.id ?? 0;
                        const bId = b.order?.id ?? 0;
                        return bId - aId;
                    });

                    // Now filter to unique orders
                    const seen = new Set();
                    const uniqueSlots = allSlots.filter((slot: OrderSlot) => {
                        const orderId = slot.order?.id;
                        if (!orderId || seen.has(orderId)) return false;
                        seen.add(orderId);
                        return true;
                    });

                    setSlotData(uniqueSlots);

                } else {
                    const token = localStorage.getItem("token") || "";
                    GetOrders(token).then(ordersResponse => {
                        const allOrders = ordersResponse.data || [];
                        const vendorSlots: OrderSlot[] = [];
                        allOrders.forEach((order: any) => {
                            if (order.slots && Array.isArray(order.slots)) {
                                order.slots.forEach((slot: any) => {
                                    if (slot.vendor_id == userId || (slot.vendor && slot.vendor.uuid === userId)) {
                                        vendorSlots.push({
                                            ...slot,
                                            order: {
                                                id: order.id,
                                                property_address: order.property_address,
                                                property_location: order.property_location,
                                                services: order.services
                                            }
                                        });
                                    }
                                });
                            }
                        });

                        if (vendorSlots.length > 0) {
                            setAllSlotData(vendorSlots);
                            const seen = new Set();
                            const uniqueSlots = vendorSlots.filter((slot) => {
                                const orderId = slot.order?.id;
                                if (!orderId || seen.has(orderId)) return false;
                                seen.add(orderId);
                                return true;
                            });
                            setSlotData(uniqueSlots);
                        }
                    }).catch(err => {
                        console.error('Error fetching global orders:', err);
                    });
                }

                if (vendor?.settings?.payment_per_km) {
                    setPaymentPerKm(vendor.settings.payment_per_km);
                }
            })
            .catch(err => console.log(err.message));
    }, [userId]);

    const formatToAmPm = (time: string): string => {
        const [hourStr, minuteStr] = time.split(":");
        let hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);
        const ampm = hour >= 12 ? "pm" : "am";

        hour = hour % 12 || 12; // Convert 0 or 12 -> 12
        return `${hour}:${minute.toString().padStart(2, "0")}${ampm}`;
    };

    useEffect(() => {
        if (selectedSlot) {
            const totalDist = parseFloat(totalDistance1);
            const payout = (totalDist * paymentPerKm).toFixed(2);

            setStartPoint(selectedSlot.address);
            setEndPoint(selectedSlot?.order?.property_address);
            setTotalDistance(totalDist);
            setTotalPayout(payout);
        }
    }, [selectedSlot, totalDistance1, paymentPerKm]);
    console.log("orderData", slotData);
    const sortedSlots = React.useMemo(() => {
        const groupedSlots = groupSlots(allslotData);
        const SlotsByDate = groupSlotsByDate(groupedSlots);
        return sortGroupedSlots(SlotsByDate)
    }, [allslotData]);

    useEffect(() => {
        if (!vendor_address || sortedSlots.length === 0) {
            return;
        }

        async function calculateAllDistances() {
            setIsCalculating(true);
            const allResults: typeof distanceResults = [];

            try {
                // Grouping strategy: Independent round-trips per (Order + Date)
                // This ensures separate visits to the same customer on different days are handled separately.
                const visits: { date: string; address: string; orderId: number; slot: OrderSlot; services: string[] }[] = [];

                for (const group of sortedSlots) {
                    const currentDate = group.date;
                    const slots = group.slots;

                    // Filter for specific services requiring travel
                    const travelSlots = slots.filter(slot => {
                        const orderServices = slot.order?.services || [];
                        // Match the specific service for this slot
                        const specificSvc = orderServices.find(s =>
                            (s as any).service_id == slot.service_id || (s as any).uuid == (slot as any).service_uuid
                        );
                        const svcData = specificSvc || orderServices[0];

                        return svcData?.is_travel_required === true ||
                            svcData?.is_travel_required === 1 ||
                            svcData?.service?.is_travel_required === true ||
                            svcData?.service?.is_travel_required === 1;
                    });

                    // Add unique order visits for this day
                    const orderVisitsMap = new Map<number, { date: string; address: string; orderId: number; slot: OrderSlot; services: string[] }>();

                    travelSlots.forEach(slot => {
                        const orderServices = slot.order?.services || [];
                        const specificSvc = orderServices.find(s =>
                            (s as any).service_id == slot.service_id || (s as any).uuid == (slot as any).service_uuid
                        );
                        const serviceName = (specificSvc as any)?.service?.name || "Service";

                        if (!orderVisitsMap.has(slot.order.id)) {
                            orderVisitsMap.set(slot.order.id, {
                                date: currentDate,
                                address: `${slot.order.property_address}, ${slot.order.property_location}`,
                                orderId: slot.order.id,
                                slot: slot,
                                services: [serviceName]
                            });
                        } else {
                            // Already have this order for today, just add the service name if not already there
                            const visit = orderVisitsMap.get(slot.order.id)!;
                            if (!visit.services.includes(serviceName)) {
                                visit.services.push(serviceName);
                            }
                        }
                    });

                    orderVisitsMap.forEach(visit => visits.push(visit));
                }


                if (visits.length === 0) {
                    setDistanceResults([]);
                    setIsCalculating(false);
                    return;
                }

                // Batch calculate all round trips
                // Leg format: [Home -> Visit]
                const legs = visits.map((v, index) => ({
                    legIndex: index,
                    from: vendor_address,
                    to: v.address
                }));

                const batchResult = await batchCalculateTravelCosts(legs);

                if (batchResult.status !== "ERROR") {
                    batchResult.legs.forEach((leg, index) => {
                        const visit = visits[index];
                        // Add as a single Round Trip entry
                        allResults.push({
                            date: visit.date,
                            service_id: visit.slot.service_id,
                            service_name: visit.services.join(", "),
                            order_id: visit.orderId,
                            from: vendor_address,
                            to: `${visit.address} (Round Trip)`,
                            start_time: visit.slot.start_time,
                            end_time: visit.slot.end_time,
                            distance: leg.distance * 2, // Double for round trip
                            est_time: leg.duration * 2, // Double for round trip
                        });
                    });
                    setDistanceResults(allResults);
                }

            } catch (error) {
                console.error("❌ Travel calculation failed:", error);
            } finally {
                setIsCalculating(false);
            }
        }

        calculateAllDistances();
    }, [vendor_address, sortedSlots]);





    const combinedTravel = Object.values(
        distanceResults.reduce((acc: Record<number, TravelItem>, item) => {
            const { order_id } = item;
            if (!acc[order_id]) {
                acc[order_id] = { ...item };
            } else {

                acc[order_id].to = item.to;
            }
            return acc;
        }, {})
    );

    const filteredDistanceResults = distanceResults?.filter((item) => {
        if (!date?.from || !date?.to) return true;

        const itemDateStr = new Date(item.date).toISOString().split('T')[0];
        const fromStr = date.from.toISOString().split('T')[0];
        const toStr = date.to.toISOString().split('T')[0];

        const isMatch = itemDateStr >= fromStr && itemDateStr <= toStr;
        console.log(`🔍 Filtering Item: date=${itemDateStr}, range=${fromStr} to ${toStr}, match=${isMatch}`);
        return isMatch;
    });

    console.log('📊 Current calculation state:', {
        allDistancesCount: distanceResults.length,
        filteredDistancesCount: filteredDistanceResults?.length,
        isCalculating,
        hasVendorAddress: !!vendor_address
    });



    const totalKilometers = filteredDistanceResults.reduce((sum, item) => {
        const dist = (item.distance) ?? 0;
        return sum + (isNaN(dist) ? 0 : dist);
    }, 0).toFixed(1);

    console.log('combinedTravel', combinedTravel);

    return (
        <div>
            <div className='w-full min-h-[66px] py-4 font-alexandria border-b border-[#BBBBBB] z-10 relative flex flex-wrap justify-center px-[20px] items-center gap-[20px]'
                style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
            >
                {isCalculating && (
                    <div className="md:absolute left-4 flex items-center gap-2 text-blue-500 animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs font-medium">Calculating...</span>
                    </div>
                )}


                <div className='flex flex-col h-[35px] w-[200px] items-center justify-start'>
                    <p className='text-[#7D7D7D] text-sm font-normal'>Est. Accumulative Distance</p>
                    <p className='text-[#6BAE41] text-[16px] font-[500]'>{totalKilometers} KM</p>
                </div>
                <div className='flex flex-col h-[35px] w-[200px] items-center justify-start'>
                    <p className='text-[#7D7D7D] text-sm font-normal'>Est. Travel Costs</p>
                    <p className='text-[#6BAE41] text-[16px] font-[500]'>$ {(Number(totalKilometers) * Number(vendorData?.settings?.payment_per_km)).toFixed(2) ?? 0.00}</p>
                </div>
                <div className='flex items-center justify-between h-[35px] gap-[10px]'>

                    <p className='text-[#7D7D7D] text-sm font-normal'>Pay Periods</p>

                    <div className="flex items-center gap-2">
                        <Select value={period} onValueChange={setPeriod}>

                            <SelectTrigger className="w-[140px] h-9 text-xs">
                                <SelectValue placeholder="Select Period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                                <SelectItem value="this_month">This Month</SelectItem>
                                <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                                <SelectItem value="last_year">Last 1 Year</SelectItem>
                                <SelectItem value="custom">Custom Range</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="grid gap-2 w-[240px] h-[42px]">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={`w-full justify-between text-left font-normal text-xs border border-input bg-background shadow-sm h-9 px-3 py-2 text-[#7D7D7D] 
                                                    ${!date ? 'text-muted-foreground' : ''} 
                                                    hover:text-[#7D7D7D] focus:outline-none focus:ring-0`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="w-3 h-3" />
                                            <span>
                                                {date?.from ? (
                                                    date.to ? (
                                                        <>
                                                            {format(date.from, "MMM dd, yy")} -{" "}
                                                            {format(date.to, "MMM dd, yy")}
                                                        </>
                                                    ) : (
                                                        format(date.from, "MMM dd, yy")
                                                    )
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                            </span>
                                        </div>
                                        <DropDownArrow />
                                    </Button>

                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={handleDateSelect}
                                        numberOfMonths={1}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>
            </div>
            <div className='max-w-full overflow-x-auto'>
                <div className="w-full max-w-full overflow-x-auto">
                    <Table className=' w-full  font-alexandria border-b border-[#BBBBBB] '>

                        <TableHeader >
                            <TableRow className='font-alexandria h-[54px] border-b border-[#BBBBBB]' style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>
                                <TableHead className="text-[14px] font-[700] text-[#666666] pl-[20px]">ORDER</TableHead>
                                <TableHead className="text-[14px] font-[700] text-[#666666]">SERVICE</TableHead>
                                <TableHead className="text-[14px] font-[700] text-[#666666]">START POINT</TableHead>
                                <TableHead className="text-[14px] font-[700] text-[#666666]">END POINT</TableHead>
                                <TableHead className="text-[14px] font-[700] text-[#666666]">APPOINT.TIME</TableHead>
                                <TableHead className="text-[14px] font-[700] text-[#666666]">SERVICE DATE</TableHead>
                                <TableHead className="text-[14px] font-[700] text-[#666666]">EST.TIME</TableHead>
                                <TableHead className="text-[14px] font-[700] text-[#666666]">DISTANCE</TableHead>
                                <TableHead className="text-[14px] font-[700] text-[#666666]">${vendorData?.settings?.payment_per_km}/KM</TableHead>
                            </TableRow>

                        </TableHeader>
                        <TableBody>
                            {filteredDistanceResults?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-[14px] text-center font-[400] text-[#666666]">No History available for this range.</TableCell>
                                </TableRow>
                            ) : (
                                filteredDistanceResults?.map((slot, i) => (
                                    <TableRow key={i}>
                                        <TableCell
                                            className="text-[15px] py-[19px] font-[400] text-[#4290E9] pl-[20px] cursor-pointer"
                                            onClick={() => {
                                                // setSelectedSlot(slot);
                                                // setShowQuickView(true);
                                            }}
                                        >
                                            {slot.service_id === 0 ? <span className="text-[#666666] font-semibold italic">Return Trip</span> : (slot.order_id ?? "-")}
                                        </TableCell>
                                        <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D] max-w-[200px] truncate" title={slot.service_name}>
                                            {slot.service_name}
                                        </TableCell>

                                        <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">{slot.from}</TableCell>
                                        <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">{slot.to}</TableCell>
                                        <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                                            {`${formatToAmPm(slot.start_time)} - ${formatToAmPm(slot.end_time)}`}
                                        </TableCell>
                                        <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                                            {new Date(slot.date).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "2-digit",
                                            })}
                                        </TableCell>
                                        <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                                            {Math.ceil(slot.est_time ?? 0)} min
                                        </TableCell>
                                        <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                                            {(slot.distance ?? 0).toFixed(1)} km
                                        </TableCell>

                                        <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                                            $ {(Number(slot.distance) * Number(vendorData?.settings?.payment_per_km)).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}

                        </TableBody>
                    </Table>

                </div>
            </div>
            {showQuickView && selectedSlot && (
                <Card
                    className="w-full sidebar-scroll sm:w-[405px] h-[calc(100vh-80px)] overflow-y-auto flex flex-col justify-between font-alexandria p-4 border-[1px] border-[#BBBBBB] rounded-none absolute top-[80px] right-0 z-50"
                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                >
                    <CardContent className="flex flex-col gap-[40px] p-0">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-[24px] font-[400] text-[#666666] leading-8">
                                Payout Quick View
                            </h2>
                            <button onClick={() => setShowQuickView(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className='flex flex-col gap-y-[16px]'>
                            <div>
                                <label htmlFor="" className='text-sm font-normal text-[#424242]'>Start Point</label>
                                <Input
                                    className='h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]'
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                    type="text"
                                    value={startPoint}
                                    onChange={(e) => setStartPoint(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="" className='text-sm font-normal text-[#424242]'>End Point</label>
                                <Input
                                    className='h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]'
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                    type="text"
                                    value={endPoint}
                                    onChange={(e) => setEndPoint(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className='flex flex-col gap-y-[18px]'>
                            <h2 className='text-[18px] font-semibold text-[#4290E9] uppercase'>Vendor Payout</h2>
                            <hr className='border-[#BBBBBB]' />
                            <p className='text-sm font-normal text-[#424242]'>Based on <span className='font-[700]'>${paymentPerKm}/km</span>. Records are saved under Billing, subject: ‘Commute Payout’</p>
                            <div className='flex items-center justify-center gap-x-[16px]'>
                                <div>
                                    <label htmlFor="" className='text-sm font-normal text-[#424242]'>Total Distance(km)</label>
                                    <Input
                                        id="totalPayout"
                                        type="number"
                                        min={0}
                                        inputMode="decimal"
                                        value={totalDistance === '' ? '' : totalDistance}
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            if (value === '') {
                                                setTotalDistance('');
                                                return;
                                            }

                                            const numeric = Number(value);
                                            if (!isNaN(numeric) && numeric >= 0) {
                                                setTotalDistance(numeric);
                                            }
                                        }}
                                        className="h-[42px] w-full border text-[16px] border-[#BBBBBB] mt-[12px] appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="" className='text-sm font-normal text-[#424242]'>Total Payout</label>
                                    <Input
                                        className='h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]'
                                        style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                        type="text"
                                        value={totalPayout}
                                        onChange={(e) => setTotalPayout(e.target.value)}
                                    />
                                </div>

                            </div>
                            <div>
                                <label htmlFor="" className='text-sm font-normal text-[#424242]'>Pay Period</label>
                                <Input
                                    value={
                                        date?.from
                                            ? date.to
                                                ? `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`
                                                : format(date.from, "LLL dd, y")
                                            : ""
                                    }
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const [from, to] = value.split(" - ").map(dateStr => new Date(dateStr.trim()));
                                        setDate({ from, to });
                                    }}
                                    className='h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]'
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                    type="text" />
                            </div>
                            <p className='text-sm font-[700] text-[#424242]'>Vendor: {vendorName}</p>
                            <hr className='border-[#BBBBBB]' />
                        </div>
                    </CardContent>
                    <CardFooter className="p-0 !mt-[40px]">
                        <div className=" w-full flex justify-end gap-[10px] ">
                            <Button onClick={() => setShowQuickView(false)}
                                className="bg-transparent border-[1px] rounded-[3px] flex justify-center bg-[#4290E9] items-center border-[#4290E9] text-[white]  w-[132px] h-[32px] hover:text-[#fff] hover:bg-[#4290E9]"
                            >
                                Save
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            )}

        </div >
    )
}
export default TravelTable