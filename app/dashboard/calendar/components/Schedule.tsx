import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from '@/components/ui/button'
import { CalendarIcon, Images } from 'lucide-react'
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import React, { useEffect, useState } from 'react'
import OneDayCalendar, { getDistanceColor } from './OneDayCalendar'
import { Services } from '../../services/page'
import { VendorData } from '../../orders/[id]/page'
import { useOrderContext } from '../../orders/context/OrderContext'
import { GetServices, GetVendors, fetchTwilightTime, TwilightResponse, getPropertyTimezone, PropertyLocation } from '../../orders/orders'
import { Order } from '../../orders/page'
import VendorWorkCarousel from '../../orders/components/VendorWorkCarousel'

interface AppointmentTab {
    currentOrder?: Order;
}

interface Coordinate {
    lat: number
    lng: number
}

function isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
    let inside = false
    const { lat, lng } = point

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lng,
            yi = polygon[i].lat
        const xj = polygon[j].lng,
            yj = polygon[j].lat

        const intersect =
            yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi

        if (intersect) inside = !inside
    }

    return inside
}

async function isPropertyInsideVendorArea(selectedCurrentListing: string, vendor: VendorData): Promise<boolean> {
    if (!selectedCurrentListing || !vendor.coordinates) return false

    try {
        const polygon: Coordinate[] = JSON.parse(vendor.coordinates as unknown as string);
        if (!Array.isArray(polygon) || polygon.length < 3) return false

        const geocoder = new window.google.maps.Geocoder()

        const propertyCoords = await new Promise<Coordinate | null>((resolve) => {
            geocoder.geocode({ address: selectedCurrentListing }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    const loc = results[0].geometry.location
                    resolve({ lat: loc.lat(), lng: loc.lng() })
                } else {
                    console.error('Geocoding failed:', status)
                    resolve(null)
                }
            })
        })

        if (!propertyCoords) return false

        return isPointInPolygon(propertyCoords, polygon)
    } catch (err) {
        console.error('Invalid vendor coordinates:', err)
        return false
    }
}

const Schedule = ({ currentOrder }: AppointmentTab) => {
    const [vendorsData, setVendorsData] = React.useState<VendorData[]>([]);
    const [selectedVendorMap, setSelectedVendorMap] = React.useState<Record<number, string | string[]>>({});
    const [showAllVendorsMap, setShowAllVendorsMap] = useState<Record<number, 0 | 1>>({});
    const [scheduleOverrideMap, setScheduleOverrideMap] = useState<Record<number, 0 | 1>>({});
    const [recommendTimeMap, setRecommendTimeMap] = useState<Record<number, 0 | 1>>({});
    const [servicesData, setServicesData] = useState<Services[]>([]);
    const [filteredVendorsByService, setFilteredVendorsByService] = useState<Record<string, VendorData[]>>({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [mergedServices, setMergedServices] = useState<any[]>([]);
    const { selectedSlots, setSelectedSlots, calendarServices } = useOrderContext();
    const [data, setData] = useState<TwilightResponse | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [vendorDistances, setVendorDistances] = useState<Record<string, number>>({});
    const [masterDate, setMasterDate] = useState<Date>(new Date());
    const [serviceDates, setServiceDates] = useState<Record<number, Date | null>>({});
    const [selectedVendorForModal, setSelectedVendorForModal] = useState<VendorData | null>(null);
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isCalculating, setIsCalculating] = useState(true);
    const [propertyLocation, setPropertyLocation] = useState<PropertyLocation | null>(null);

    useEffect(() => {
        if (!currentOrder?.slots || !currentOrder?.services) return;

        setSelectedSlots((prev) => {
            // Map service templates for quick lookup: numeric ID -> UUID
            const serviceIdToUuidMap: Record<number, string> = {};
            currentOrder.services.forEach(s => {
                if (s.service?.id && s.service?.uuid) {
                    serviceIdToUuidMap[s.service.id] = s.service.uuid;
                }
            });

            const currentOrderServiceUuids = currentOrder.slots.map((slot) => {
                return serviceIdToUuidMap[slot.service_id] || String(slot.service_id);
            });

            const extraSlots = prev.filter(
                (slot) => !currentOrderServiceUuids.includes(slot.service_id)
            );

            const convertedOrderSlots = currentOrder.slots.map((slot) => ({
                ...slot,
                service_id: serviceIdToUuidMap[slot.service_id] || String(slot.service_id),
                vendor_id: slot.vendor?.uuid || slot.vendor_id,
            }));

            return [...convertedOrderSlots, ...extraSlots];
        });
        // eslint-disable-next-line
    }, [currentOrder, mergedServices]);


    useEffect(() => {
        if (!servicesData.length) return;

        const enriched = calendarServices?.map((item) => {
            const service = servicesData?.find(s => s.id === item.serviceId);
            if (!service) return null;

            const option = service.product_options.find(opt => opt.uuid === item.optionId);
            if (!option) return null;

            return {
                amount: item.price,
                option_id: option.uuid,
                option: option,
                optuuid: option.uuid,
                service_id: service.uuid,
                service: service,
                uuid: service.uuid,
            };
        }).filter(Boolean);

        setMergedServices([
            ...(currentOrder?.services || []),
            ...enriched,
        ]);

    }, [servicesData, calendarServices, currentOrder]);


    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        GetVendors(token)
            .then((data) => {
                setVendorsData(data.data);
            })
            .catch((err) => console.log(err.message));
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        GetServices(token)
            .then((data) => {
                setServicesData(data.data);
            })
            .catch((err) => console.log(err.message));
    }, []);

    useEffect(() => {
        if (!currentOrder?.slots || !currentOrder.services) return;

        const newShowAllVendorsMap: Record<number, 0 | 1> = {};
        const newScheduleOverrideMap: Record<number, 0 | 1> = {};
        const newRecommendTimeMap: Record<number, 0 | 1> = {};

        currentOrder.services.forEach((service, idx) => {
            const slot = currentOrder.slots.find(
                (s) => String(s.service_id) === String(service.service.id)
            );

            if (slot) {
                newShowAllVendorsMap[idx] = (slot.show_all_vendors ?? 0) as 0 | 1;
                newScheduleOverrideMap[idx] = (slot.schedule_override ?? 0) as 0 | 1;
                newRecommendTimeMap[idx] = (slot.recommend_time ?? 0) as 0 | 1;
            }
        });

        setShowAllVendorsMap(newShowAllVendorsMap);
        setScheduleOverrideMap(newScheduleOverrideMap);
        setRecommendTimeMap(newRecommendTimeMap);
    }, [currentOrder]);

    useEffect(() => {
        async function filterVendorsByService() {
            if (!vendorsData.length || !currentOrder?.property || !servicesData.length) return;

            setIsCalculating(true);

            const addressString = `${currentOrder?.property.address}, ${currentOrder?.property.city}, ${currentOrder?.property.province}, ${currentOrder?.property.country}`;
            const result: Record<string, VendorData[]> = {};

            for (const service of servicesData) {
                const vendorsForService = vendorsData.filter(v =>
                    v.vendor_services?.some(vs => vs.service?.uuid === service.uuid)
                );

                const insideResults = await Promise.all(
                    vendorsForService.map(async vendor => {
                        const force_service_area = vendor.settings?.force_service_area;
                        const shouldBypass = force_service_area === 1 || force_service_area === true;

                        if (shouldBypass) {
                            return { vendor, inside: true };
                        }

                        return {
                            vendor,
                            inside: await isPropertyInsideVendorArea(addressString, vendor),
                        };
                    })
                );

                result[service.uuid] = insideResults
                    .filter(r => r.inside)
                    .map(r => r.vendor);
            }

            setFilteredVendorsByService(result);
            setIsCalculating(false);
        }

        filterVendorsByService();
    }, [vendorsData, servicesData, currentOrder]);

    async function calculateAllVendorDistances(
        address: string,
        availableVendors: VendorData[]
    ) {
        if (!window.google || !window.google.maps) return;

        const service = new window.google.maps.DistanceMatrixService();
        const destinations: string[] = [];
        const vendorUUIDs: string[] = [];

        availableVendors.forEach((vendor) => {
            const originAddress = vendor?.addresses?.find(
                (addr) => addr.type === "start_location"
            );

            if (
                originAddress?.address_line_1 &&
                originAddress?.city &&
                originAddress?.province &&
                originAddress?.country
            ) {
                const fullAddress = `${originAddress.address_line_1}, ${originAddress.city}, ${originAddress.province}, ${originAddress.country}`;
                destinations.push(fullAddress);
                vendorUUIDs.push(vendor.uuid || "");
            }
        });

        if (destinations.length === 0) return;

        const estimatedTimes: Record<string, number> = {};

        await new Promise<void>((resolve) => {
            service.getDistanceMatrix(
                {
                    origins: [address],
                    destinations,
                    travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (response, status) => {
                    if (status === "OK" && response?.rows?.[0]?.elements?.length) {
                        response.rows[0].elements.forEach((element, i) => {
                            const vendorUUID = vendorUUIDs[i];
                            if (vendorUUID && element.status === "OK") {
                                const durationInMinutes = Math.ceil(
                                    element.duration.value / 60
                                );
                                estimatedTimes[vendorUUID] = durationInMinutes;
                            }
                        });
                    } else {
                        console.error("Distance Matrix failed:", status, response);
                    }
                    resolve();
                }
            );
        });

        setVendorDistances((prev) => ({ ...prev, ...estimatedTimes }));
    }


    useEffect(() => {
        if (!currentOrder?.property || !filteredVendorsByService) return;

        const listingAddress = `${currentOrder.property.address}, ${currentOrder.property.city}, ${currentOrder.property.country}`;

        Object.values(filteredVendorsByService).forEach((vendors) => {
            if (vendors?.length > 0) {
                calculateAllVendorDistances(listingAddress, vendors);
            }
        });
    }, [currentOrder, filteredVendorsByService]);

    const formatTravelTime = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
        return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min`;
    };

    useEffect(() => {
        const address = `${currentOrder?.property?.address}, ${currentOrder?.property?.city}, ${currentOrder?.property?.country}`

        async function loadTwilight() {
            const result = await fetchTwilightTime(address, selectedDate);
            if (result) setData(result);
        }

        loadTwilight();
    }, [currentOrder, selectedDate]);

    useEffect(() => {
        async function loadPropertyTimezone() {
            if (!currentOrder?.property) return;

            const fullAddress = `${currentOrder.property.address}, ${currentOrder.property.city}, ${currentOrder.property.province}, ${currentOrder.property.country}`;

            const location = await getPropertyTimezone(fullAddress);
            if (location) {
                setPropertyLocation(location);
            } else {
                console.error('Failed to fetch property timezone');
            }
        }

        loadPropertyTimezone();
    }, [currentOrder]);

    const formatLocalTime = (utcTime: string) => {
        if (!utcTime) return "—";
        const timeZone = propertyLocation?.timeZoneId || "America/Vancouver";
        try {
            const date = new Date(utcTime);
            return date.toLocaleTimeString("en-CA", {
                timeZone,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
            });
        } catch (error) {
            console.error("Error formatting time:", error);
            return "Invalid time";
        }
    };

    return (
        <div className='font-alexandria'>
            <div className="flex justify-between items-center py-4 border-b border-[#EEEEEE] bg-white">
                <div className="flex items-center gap-4">
                    <span className="text-[12px] text-[#7D7D7D]">Master Date Selection:</span>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] h-[42px] justify-start text-left font-normal bg-[#EEEEEE] border-[#BBBBBB] text-[#7D7D7D]",
                                    !masterDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {masterDate ? format(masterDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={masterDate}
                                onSelect={(date) => {
                                    if (date) {
                                        setMasterDate(date);
                                        setServiceDates({}); // Reset individual overrides when master changes
                                    }
                                }}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-16 text-[#7D7D7D] py-6 auto-rows-max">
                {mergedServices?.map((service, idx) => {
                    const currentServiceUuid = service.service?.uuid || service.uuid;
                    const slotForService = selectedSlots.find(
                        (s) => s.service_id === currentServiceUuid
                    );
                    const selectedVendor = slotForService?.vendor_id || selectedVendorMap[idx] || 'all';

                    const handleVendorChange = (value: string) => {
                        setSelectedVendorMap((prev) => ({ ...prev, [idx]: value }));
                        if (value !== 'all') {
                            setRecommendTimeMap(prev => ({ ...prev, [idx]: 0 }));
                        }
                    };

                    const showAllVendors = showAllVendorsMap[idx] ?? 0;
                    const scheduleOverride = scheduleOverrideMap[idx] ?? 0;
                    const recommendTime = recommendTimeMap[idx] ?? 0;

                    const isScheduled = !!slotForService;

                    return (
                        <React.Fragment key={idx}>
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[12px]">
                                            Select Service Time ({idx + 1} of {mergedServices?.length})
                                        </p>
                                        <p className="text-[16px] font-[700] max-w-[200px]">{service.service.name}</p>
                                        <p className="text-[12px]">
                                            Approx. Duration <br />
                                            <span className="text-[16px] font-[700] block min-h-[24px]">
                                                {service.option?.service_duration ? `${service.option.service_duration} Minutes` : '-'}
                                            </span>
                                        </p>
                                    </div>
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-[12px] font-[600] flex items-center gap-1",
                                        isScheduled ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500 border border-gray-200"
                                    )}>
                                        {isScheduled ? (
                                            <>
                                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                                Scheduled
                                            </>
                                        ) : (
                                            <>
                                                <span className="w-2 h-2 rounded-full bg-gray-400" />
                                                Pending
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-start gap-6 items-center">
                                        <Switch
                                            id={`show-all-vendors-${idx}`}
                                            checked={!!showAllVendors}
                                            onCheckedChange={() =>
                                                setShowAllVendorsMap((prev) => ({
                                                    ...prev,
                                                    [idx]: showAllVendors === 1 ? 0 : 1,
                                                }))
                                            }
                                            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                                        />
                                        <label htmlFor={`show-all-vendors-${idx}`} className="text-[12px] cursor-pointer">Show all Vendors Regardless of Travel Time</label>
                                    </div>
                                    <div className="flex justify-start gap-6 items-center">
                                        <Switch
                                            id={`schedule-override-${idx}`}
                                            checked={!!scheduleOverride}
                                            onCheckedChange={() =>
                                                setScheduleOverrideMap((prev) => ({
                                                    ...prev,
                                                    [idx]: scheduleOverride === 1 ? 0 : 1,
                                                }))
                                            }
                                            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                                        />
                                        <label htmlFor={`schedule-override-${idx}`} className="text-[12px] cursor-pointer">Schedule Override</label>
                                    </div>
                                    <div className="flex justify-start gap-6 items-center">
                                        <Switch
                                            id={`recommend-time-${idx}`}
                                            checked={!!recommendTime}
                                            onCheckedChange={(checked) => {
                                                setRecommendTimeMap((prev) => ({
                                                    ...prev,
                                                    [idx]: checked ? 1 : 0,
                                                }));

                                                if (checked) {
                                                    const currentServiceUuid = service.service?.uuid || service.uuid;
                                                    const serviceVendors = filteredVendorsByService[currentServiceUuid || ''] || [];
                                                    if (serviceVendors.length > 0) {
                                                        let nearestVendorId = '';
                                                        let minDistance = Infinity;

                                                        serviceVendors.forEach(vendor => {
                                                            const distance = vendorDistances[vendor.uuid || ''];
                                                            if (distance !== undefined && distance < minDistance) {
                                                                minDistance = distance;
                                                                nearestVendorId = vendor.uuid || '';
                                                            }
                                                        });

                                                        if (nearestVendorId) {
                                                            setSelectedVendorMap((prev) => ({ ...prev, [idx]: nearestVendorId }));
                                                        }
                                                    }
                                                } else {
                                                    setSelectedVendorMap((prev) => ({ ...prev, [idx]: 'all' }));
                                                }
                                            }}
                                            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                                        />
                                        <label htmlFor={`recommend-time-${idx}`} className="text-[12px] cursor-pointer">Recommend Best Time</label>
                                    </div>
                                </div>
                                <div>
                                    <Select
                                        value={typeof selectedVendor === 'string' ? selectedVendor : 'all'}
                                        onValueChange={handleVendorChange}
                                    >
                                        <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]">
                                            <SelectValue placeholder="Select Vendor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Vendors</SelectItem>
                                            {isCalculating ? (
                                                <SelectItem value="loading" disabled>
                                                    Fetching vendors...
                                                </SelectItem>
                                            ) : (service.service?.uuid || service.uuid) && filteredVendorsByService[service.service?.uuid || service.uuid || '']?.length ? (
                                                [...filteredVendorsByService[service.service?.uuid || service.uuid || '']!]
                                                    .sort((a, b) => {
                                                        const timeA = vendorDistances[a.uuid ?? ''] ?? Infinity;
                                                        const timeB = vendorDistances[b.uuid ?? ''] ?? Infinity;
                                                        return timeA - timeB;
                                                    })
                                                    .map((vendor, vidx) => {
                                                        const travelTime = vendorDistances[vendor.uuid ?? ''];
                                                        const color = getDistanceColor(travelTime);
                                                        return (
                                                            <SelectItem className='flex justify-between text-nowrap' key={vidx} value={vendor.uuid ?? ''}>
                                                                <div className="flex items-center gap-2 text-nowrap truncate">
                                                                    <span className="w-2 h-4" style={{ backgroundColor: color }} />
                                                                    <span>{vendor.first_name} {vendor.last_name}</span>
                                                                    <span>{travelTime !== undefined && (
                                                                        <span className="text-gray-500 text-[12px] ml-2">
                                                                            ({formatTravelTime(travelTime)})
                                                                        </span>
                                                                    )}</span>
                                                                </div>
                                                            </SelectItem>
                                                        );
                                                    })
                                            ) : (
                                                <SelectItem value="none" disabled>
                                                    No vendors available for this service in the selected area
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>

                                    {/* SELECTED VENDOR DISPLAY */}
                                    <div className="mt-3 flex flex-col gap-2">
                                        {selectedVendor !== 'all' ? (
                                            (() => {
                                                const currentServiceUuid = service.service?.uuid || service.uuid;
                                                const vendor = currentServiceUuid
                                                    ? (filteredVendorsByService[currentServiceUuid] ?? [])
                                                        .find((v) => v.uuid === selectedVendor)
                                                    : undefined;
                                                if (!vendor) return null;

                                                return (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedVendorForModal(vendor);
                                                            setIsVendorModalOpen(true);
                                                        }}
                                                        className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 flex gap-2 items-center justify-center mt-2 capitalize"
                                                    >
                                                        <Images className="w-4 h-4" />
                                                        {`View Portfolio`}
                                                    </Button>
                                                );
                                            })()
                                        ) : null}
                                    </div>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full h-[42px] justify-start text-left font-normal bg-[#EEEEEE] border-[#BBBBBB] text-[#7D7D7D] mt-3",
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {serviceDates[idx] || masterDate ? format(serviceDates[idx] || masterDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="end">
                                            <Calendar
                                                mode="single"
                                                selected={serviceDates[idx] || masterDate}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        setServiceDates(prev => ({ ...prev, [idx]: date }));
                                                    }
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    {isVendorModalOpen && selectedVendorForModal && (
                                        <VendorWorkCarousel
                                            open={isVendorModalOpen}
                                            setOpen={setIsVendorModalOpen}
                                            images={selectedVendorForModal?.portfolio_images ?? []}
                                            title={`${selectedVendorForModal.first_name} ${selectedVendorForModal.last_name}'s Work`}
                                        />
                                    )}

                                    <div className="mt-[20px]">
                                        <OneDayCalendar
                                            selectedVendors={
                                                selectedVendor === 'all'
                                                    ? (
                                                        (service.service?.uuid || service.uuid)
                                                            ? (filteredVendorsByService[service.service?.uuid || service.uuid || ''] ?? [])
                                                                .map((v) => v.uuid)
                                                                .filter(
                                                                    (uuid): uuid is string => typeof uuid === 'string'
                                                                )
                                                            : []
                                                    )
                                                    : Array.isArray(selectedVendor)
                                                        ? selectedVendor.filter(
                                                            (uuid): uuid is string => typeof uuid === 'string'
                                                        )
                                                        : [selectedVendor].filter(
                                                            (uuid): uuid is string => typeof uuid === 'string'
                                                        )
                                            }
                                            selectedListingId={currentOrder?.property.uuid ?? ''}
                                            currentOrderId={currentOrder?.uuid}
                                            service={service}
                                            calendarIdx={idx}
                                            showAllVendorsMap={showAllVendorsMap}
                                            scheduleOverrideMap={scheduleOverrideMap}
                                            recommendTimeMap={recommendTimeMap}
                                            recommendTime={recommendTime}
                                            showAllVendors={showAllVendors}
                                            scheduleOverride={scheduleOverride}
                                            setSelectedDate={setSelectedDate}
                                            vendorDistances={vendorDistances}
                                            propertyTimezone={propertyLocation?.timeZoneId}
                                            masterDate={serviceDates[idx] || masterDate}
                                        />
                                    </div>

                                    {data && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                                            <h4 className="text-sm font-[600] text-[#666666] mb-2">Twilight Times</h4>

                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="col-span-2 mt-2 font-[500] text-gray-500">Morning </div>
                                                <div className="col-span-1">
                                                    Civil: {formatLocalTime(data.civil_twilight_begin)}
                                                </div>
                                                <div className="col-span-1">
                                                    Nautical: {formatLocalTime(data.nautical_twilight_begin)}
                                                </div>

                                                <div className="col-span-2 mt-2 font-[500] text-gray-500">Evening </div>
                                                <div className="col-span-1">
                                                    Civil: {formatLocalTime(data.civil_twilight_end)}
                                                </div>
                                                <div className="col-span-1">
                                                    Nautical: {formatLocalTime(data.nautical_twilight_end)}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {idx === 2 && (
                                <div className="col-span-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-[9px] text-[#424242]">
                                            <span className="w-3 h-3 bg-[#2BC6FF] inline-block" />
                                            <span>Travel From Home</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] text-[#424242]">
                                            <span className="w-3 h-3 bg-[#FD7DFF] inline-block" />
                                            <span>Travel Time Within 15 Minutes</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] text-[#424242]">
                                            <span className="w-3 h-3 bg-[#E8B611] inline-block" />
                                            <span>Travel Time Within 30 Minutes</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] text-[#424242]">
                                            <span className="w-3 h-3 bg-[#E2F202] inline-block" />
                                            <span>Travel Time Within 45 Minutes</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] text-[#424242]">
                                            <span className="w-3 h-3 bg-[#9900A7] inline-block" />
                                            <span>Travel Time Within 60 Minutes</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] text-[#424242]">
                                            <span className="w-3 h-3 bg-[#171484] inline-block" />
                                            <span>Travel Time More Than 60 Minutes</span>
                                        </div>
                                    </div>

                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    )
}

export default Schedule