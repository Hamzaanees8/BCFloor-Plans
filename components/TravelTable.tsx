import React, { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { DropDownArrow } from './Icons'
import { X } from 'lucide-react'
import { Card, CardContent, CardFooter } from './ui/card'
import { Input } from './ui/input'
import { calculateDistance, GetOne } from '@/app/dashboard/vendors/vendors'
import { Vendor } from './VendorTable'
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
        order_id: number,
        from: string,
        to: string,
        start_time: string,
        end_time: string,
        distance: number,
        est_time: number;
    }[]>([]);
    const [date, setDate] = React.useState<DateRange | undefined>();
    const filteredSlots = slotData.filter((slot) => {
        if (!date?.from || !date?.to) return true;

        const slotDate = new Date(slot.created_at); // or slot.date
        return slotDate >= date.from && slotDate <= date.to;
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

        GetOne(token, userId || "")
            .then(data => {
                const vendor = data.data;
                if (vendor) {
                    setVendorName(vendor.first_name + " " + vendor.last_name);
                    const start_location = vendor?.addresses?.find(
                        (address: { type: string }) => address.type === 'start_location'
                    );
                    const start_address = start_location.address_line_1 + ',' + start_location.city + ',' + start_location.country
                    setvendor_address(start_address);
                    setVendorData(vendor)
                }
                console.log('vendor', vendor);

                if (vendor?.order_slots) {
                    setAllSlotData(vendor?.order_slots)
                    // Sort order_slots by order.id
                    const allSlots = vendor.order_slots.sort((a: OrderSlot, b: OrderSlot) => {
                        const aId = a.order?.id ?? 0;
                        const bId = b.order?.id ?? 0;
                        return bId - aId;
                    });

                    const timeRangeMap = new Map<number, { start: string, end: string }>();

                    allSlots.forEach((slot: OrderSlot) => {
                        const orderId = slot.order?.id;
                        if (!orderId || !slot.start_time || !slot.end_time) return;

                        const current = timeRangeMap.get(orderId);

                        if (!current) {
                            timeRangeMap.set(orderId, {
                                start: slot.start_time,
                                end: slot.end_time
                            });
                        } else {
                            // Find earliest start and latest end
                            if (slot.start_time < current.start) current.start = slot.start_time;
                            if (slot.end_time > current.end) current.end = slot.end_time;
                        }
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
                }


                if (vendor?.settings?.payment_per_km) {
                    setPaymentPerKm(vendor.settings.payment_per_km); // ✅ store payment_per_km
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
    const groupedSlots = groupSlots(allslotData);
    console.log('groupedSlots', groupedSlots);
    const SlotsByDate = groupSlotsByDate(groupedSlots);
    console.log('SlotsByDate', SlotsByDate);
    const sortedSlots = sortGroupedSlots(SlotsByDate)
    console.log('sortedSlots', sortedSlots);


    useEffect(() => {
        if (!vendor_address || sortedSlots.length === 0) return;

        async function calculateAllDistances() {
            const allResults: {
                date: string,
                service_id: number,
                order_id: number,
                from: string,
                to: string,
                start_time: string,
                end_time: string,
                distance: number,
                est_time: number;
            }[] = [];

            for (const group of sortedSlots) {
                const currentDate = group.date;
                const slots = group.slots;
                if (!slots || slots.length === 0) continue;

                for (let i = 0; i < slots.length; i++) {
                    const slot = slots[i];
                    const startAddress =
                        i === 0
                            ? vendor_address
                            : `${slots[i - 1].order.property_address}, ${slots[i - 1].order.property_location}`;
                    const endAddress = `${slot.order.property_address}, ${slot.order.property_location}`;

                    try {
                        const result = await calculateDistance(startAddress, endAddress);
                        if (result) {
                            allResults.push({
                                date: currentDate,
                                service_id: slot.service_id,
                                order_id: slot.order.id,
                                from: startAddress,
                                to: endAddress,
                                start_time: slot.start_time,
                                end_time: slot.end_time,
                                distance: parseFloat(result.distance.toFixed(2)),
                                est_time: Math.round(result.est_time),
                            });
                        }
                    } catch (error) {
                        console.error("❌ Distance calculation failed:", error);
                    }

                    await new Promise((r) => setTimeout(r, 300));
                }
            }

            console.log("All chained distance results:", allResults);
            setDistanceResults(allResults);
        }

        calculateAllDistances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vendor_address]);


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

        const itemDate = new Date(item.date);
        return itemDate >= date.from && itemDate <= date.to;
    });

    const totalKilometers = filteredDistanceResults.reduce((sum, item) => {
        const dist = (item.distance) ?? 0;
        return sum + (isNaN(dist) ? 0 : dist);
    }, 0).toFixed(1);

    console.log('combinedTravel', combinedTravel);

    return (
        <div>
            <div className='w-full h-[66px] bg-[#E4E4E4] font-alexandria border-b border-[#BBBBBB] z-10 relative  flex justify-center px-[20px] items-center gap-[20px]'
            >
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
                    <div className="grid gap-2 w-[260px] h-[42px]">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={`w-full justify-between text-left font-normal text-[16px] border border-input bg-background shadow-sm h-9 px-[11px] py-2 text-[#7D7D7D] 
                                                ${!date ? 'text-muted-foreground' : ''} 
                                                hover:text-[#7D7D7D] focus:outline-none focus:ring-0`}
                                >
                                    <span>
                                        {date?.from ? (
                                            date.to ? (
                                                <>
                                                    {format(date.from, "LLL dd, y")} -{" "}
                                                    {format(date.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(date.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </span>
                                    <DropDownArrow />
                                </Button>

                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={1}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>
            <div className="w-full relative">
                <Table className='font-alexandria px-0 overflow-x-auto border-b border-[#BBBBBB] whitespace-nowrap'>
                    <TableHeader >
                        <TableRow className='bg-[#E4E4E4] font-alexandria h-[54px] hover:bg-[#E4E4E4] border-b border-[#BBBBBB]'>
                            <TableHead className="text-[14px] font-[700] text-[#666666] pl-[20px]">ORDER</TableHead>
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
                                        {slot.order_id ?? "-"}
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
            {showQuickView && selectedSlot && (
                <Card
                    className="w-full sidebar-scroll sm:w-[405px] h-[calc(100vh-80px)] overflow-y-auto flex flex-col justify-between font-alexandria p-4 border-[1px] border-[#BBBBBB] rounded-none absolute top-[80px] right-0 z-50 bg-[#EEEEEE]"
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
                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                    type="text"
                                    value={startPoint}
                                    onChange={(e) => setStartPoint(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="" className='text-sm font-normal text-[#424242]'>End Point</label>
                                <Input
                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
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
                                        className="h-[42px] w-full bg-[#EEEEEE] border text-[16px] border-[#BBBBBB] mt-[12px] appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="" className='text-sm font-normal text-[#424242]'>Total Payout</label>
                                    <Input
                                        className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
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
                                    className='h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]' type="text" />
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