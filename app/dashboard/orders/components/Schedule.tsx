import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from '@/components/ui/button'
import { CalendarIcon, Images, Info, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import React, { useEffect, useState } from 'react'
import OneDayCalendar, { getDistanceColor } from './OneDayCalendar'
import { getPropertyTimezone, PropertyLocation } from '../orders'
import { VendorData } from '../[id]/page'
import { useOrderContext, Slot } from '../context/OrderContext'
import VendorWorkCarousel from './VendorWorkCarousel'
import { getEffectiveServiceDuration } from '../utils/serviceTimeUtils'
import { Services } from '../../services/page'
import { CleanedProductOption } from '../../services/services'
import { useSearchParams } from 'next/navigation'

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

export interface ScheduleProps {
    invalidServices?: string[];
}

const Schedule = ({ invalidServices = [] }: ScheduleProps) => {
    const searchParams = useSearchParams();
    const isEdit = searchParams.get('isEdit') === 'true';
    const [selectedVendorMap, setSelectedVendorMap] = React.useState<Record<string, string | string[]>>({});
    const [recommendTimeMap, setRecommendTimeMap] = useState<Record<string, 0 | 1>>({});
    const [filteredVendorsByService, setFilteredVendorsByService] = useState<Record<string, VendorData[]>>({});
    const [masterDate, setMasterDate] = useState<Date>(new Date());
    const [serviceDates, setServiceDates] = useState<Record<string, Date | null>>({});
    const [vendorDistances, setVendorDistances] = useState<Record<string, number>>({});
    const [selectedVendorForModal, setSelectedVendorForModal] = useState<VendorData | null>(null);
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isCalculating, setIsCalculating] = useState(true);
    const [propertyLocation, setPropertyLocation] = useState<PropertyLocation | null>(null);
    const [openTooltipIdx, setOpenTooltipIdx] = useState<number | null>(null);

    const {
        selectedCurrentListing,
        selectedServices,
        setSelectedServices,
        vendorsData,
        servicesData,
        tempPropertyData,
        selectedSlots,
    } = useOrderContext();

    const servicesToSchedule = isEdit ? selectedServices : selectedServices.filter((s: any) => !s.service_uuid);
    const serviceCount = servicesToSchedule?.length || 0;

    useEffect(() => {
        async function loadAndCalculate() {
            if (!vendorsData.length || (!selectedCurrentListing && !tempPropertyData) || !servicesData.length) {
                return;
            }

            setIsCalculating(true);

            // 1. Filter vendors by service/area
            const addressString = selectedCurrentListing
                ? `${selectedCurrentListing.address}, ${selectedCurrentListing.city}, ${selectedCurrentListing.country}`
                : `${tempPropertyData?.address}, ${tempPropertyData?.city}, ${tempPropertyData?.country}`;
            const result: Record<string, VendorData[]> = {};

            for (const service of servicesData) {
                const vendorsForService = vendorsData.filter(v =>
                    v.vendor_services?.some(vs => vs.service?.uuid === service.uuid)
                );

                const insideResults = await Promise.all(
                    vendorsForService.map(async vendor => {
                        const force_service_area = vendor.settings?.force_service_area;
                        const isRestricted = force_service_area === 1 || force_service_area === true;

                        if (!isRestricted) {
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

            // 2. Load property timezone
            const fullAddress = selectedCurrentListing
                ? `${selectedCurrentListing.address}, ${selectedCurrentListing.city}, ${selectedCurrentListing.province}, ${selectedCurrentListing.country}`
                : `${tempPropertyData?.address}, ${tempPropertyData?.city}, ${tempPropertyData?.province}, ${tempPropertyData?.country}`;

            const location = await getPropertyTimezone(fullAddress);
            if (location) {
                setPropertyLocation(location);
            } else {
                console.error('Failed to fetch property timezone');
            }

            // 3. Calculate all vendor distances
            const listingAddress = selectedCurrentListing
                ? `${selectedCurrentListing.address}, ${selectedCurrentListing.city}, ${selectedCurrentListing.province}, ${selectedCurrentListing.country}`
                : `${tempPropertyData?.address}, ${tempPropertyData?.city}, ${tempPropertyData?.province}, ${tempPropertyData?.country}`;

            const distancePromises = Object.values(result).map(async (vendors) => {
                if (vendors?.length > 0) {
                    await calculateAllVendorDistances(listingAddress, vendors);
                }
            });
            await Promise.all(distancePromises);

            setIsCalculating(false);
        }

        loadAndCalculate();
    }, [vendorsData, servicesData, selectedCurrentListing, tempPropertyData]);

    const formatTravelTime = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
        return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min`;
    };

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

    return (
        <div className='font-alexandria'>
            <div className="px-16 py-4 bg-white border-b border-[#EEEEEE]">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 shadow-sm">
                    <Info className="w-5 h-5 text-blue-600 shrink-0" />
                    <p className="text-[14px] text-blue-800 leading-relaxed font-medium">
                        {serviceCount === 1 ? "This service is" : "These services are"} currently held waiting for completion of booking. Your appointment is not confirmed until you complete all steps and receive a confirmation message. If you do not see the time you are hoping for please call or email the office.
                    </p>
                </div>
            </div>
            <div className="flex justify-between items-center px-16 py-4 border-b border-[#EEEEEE] bg-white">
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
                                disabled={{ before: new Date() }}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-16 text-[#7D7D7D] px-16 py-6 auto-rows-max">
                {(() => {
                    const servicesToSchedule = isEdit ? selectedServices : selectedServices.filter((s: any) => !s.service_uuid);
                    return servicesToSchedule?.map((service, idx) => {
                        const serviceKey = service.uuid || `service-${idx}`;
                        const selectedVendor = selectedVendorMap[serviceKey] ?? 'all';

                        const handleVendorChange = (value: string) => {
                            setSelectedVendorMap((prev) => ({ ...prev, [serviceKey]: value }));
                        };
                        const showAllVendorsMap: Record<string, 0 | 1> = {};
                        const scheduleOverrideMap: Record<string, 0 | 1> = {};
                        const showAllVendors = 0;
                        const scheduleOverride = 0;
                        const recommendTime = recommendTimeMap[serviceKey] ?? 0;

                        const currentService = servicesData?.find((s: Services) => s.uuid === service.uuid);
                        const productOption = currentService?.product_options?.find(
                            (option: CleanedProductOption) => option.uuid === service.option_id
                        );

                        const squareFootage = selectedCurrentListing?.square_footage || tempPropertyData?.square_footage;
                        const requiredDuration = getEffectiveServiceDuration(
                            productOption?.service_duration,
                            squareFootage
                        );

                        const serviceSlots = selectedSlots.filter((s: Slot) => s.service_id === service.uuid);
                        const currentDuration = serviceSlots.length * 15;
                        const isFullyScheduled = currentDuration >= requiredDuration && requiredDuration > 0;
                        const isInvalid = invalidServices.includes(service.uuid || '');
                        const hasNoVendors = !isCalculating && !!service.uuid && (!filteredVendorsByService[service.uuid] || filteredVendorsByService[service.uuid].length === 0);

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isPastDate = isEdit && serviceSlots.some((slot: Slot) => {
                            if (!slot.date) return false;
                            const slotDate = new Date(slot.date + 'T00:00:00');
                            return slotDate < today;
                        });

                        return (
                            <React.Fragment key={idx}>
                                <div className={cn(
                                    "flex flex-col gap-4 p-4 rounded-lg border transition-all",
                                    isInvalid ? "border-red-500 bg-red-50/30" : "border-transparent",
                                    isPastDate ? "pointer-events-none opacity-60 bg-gray-50 bg-opacity-50" : ""
                                )}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[12px]">
                                                Select Service Time ({idx + 1} of {servicesToSchedule?.length})
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[16px] font-[700] max-w-[200px]">{service.title}</p>
                                                {currentService?.is_travel_required === false && (
                                                    <TooltipProvider>
                                                        <Tooltip open={openTooltipIdx === idx} onOpenChange={(open) => setOpenTooltipIdx(open ? idx : null)}>
                                                            <TooltipTrigger asChild onClick={(e) => {
                                                                e.preventDefault();
                                                                setOpenTooltipIdx(openTooltipIdx === idx ? null : idx);
                                                            }}>
                                                                <Info className="w-4 h-4 text-blue-500 cursor-pointer" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-[250px] bg-blue-50 border-blue-100 p-3">
                                                                <p className="text-[11px] text-blue-700 leading-relaxed text-left whitespace-normal">
                                                                    <span className="font-semibold">This service does not require travel.</span>{' '}
                                                                    You can book any available time slot on any day. Only slots already booked by other orders are unavailable.
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                            <p className="text-[12px]">
                                                Approx. Duration <br />
                                                <span className="text-[16px] font-[700] block min-h-[24px]">
                                                    {(() => {
                                                        const effectiveDuration = getEffectiveServiceDuration(
                                                            productOption?.service_duration,
                                                            squareFootage
                                                        );
                                                        const isCalculated = !productOption?.service_duration || Number(productOption.service_duration) === 0;

                                                        return (
                                                            <>
                                                                {effectiveDuration} Minutes
                                                                {isCalculated && (
                                                                    <span className="text-[10px] font-[400] text-gray-500 block mt-1">
                                                                        (Calculated based on property size)
                                                                    </span>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </span>
                                            </p>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[12px] font-[600] flex items-center gap-1",
                                            isFullyScheduled ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500 border border-gray-200"
                                        )}>
                                            {isFullyScheduled ? (
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
                                        {/* <div className="flex justify-start gap-6 items-center">
                                        <Switch
                                            id={`show-all-vendors-${idx}`}
                                            checked={!!showAllVendors}
                                            onCheckedChange={() =>
                                                setShowAllVendorsMap((prev) => ({
                                                    ...prev,
                                                    [serviceKey]: showAllVendors === 1 ? 0 : 1,
                                                }))
                                            }
                                            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                                        />
                                        <label htmlFor={`show-all-vendors-${idx}`} className="text-[12px] cursor-pointer">Show all Vendors Regardless of Travel Time</label>
                                    </div> */}
                                        {/* <div className="flex justify-start gap-6 items-center">
                                            <Switch
                                                id={`schedule-override-${idx}`}
                                                checked={!!scheduleOverride}
                                                onCheckedChange={() =>
                                                    setScheduleOverrideMap((prev) => ({
                                                        ...prev,
                                                        [serviceKey]: scheduleOverride === 1 ? 0 : 1,
                                                    }))
                                                }
                                                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                                            />
                                            <label htmlFor={`schedule-override-${idx}`} className="text-[12px] cursor-pointer">Schedule Override</label>
                                        </div> */}
                                        <div className="flex justify-start gap-6 items-center">
                                            <Switch
                                                id={`recommend-time-${idx}`}
                                                checked={!!recommendTime}
                                                onCheckedChange={(checked) => {
                                                    setRecommendTimeMap((prev) => ({
                                                        ...prev,
                                                        [serviceKey]: checked ? 1 : 0,
                                                    }));

                                                    if (checked) {
                                                        const serviceVendors = filteredVendorsByService[service.uuid || ''] || [];
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
                                                                setSelectedVendorMap((prev) => ({ ...prev, [serviceKey]: nearestVendorId }));
                                                            }
                                                        }
                                                    } else {
                                                        setSelectedVendorMap((prev) => ({ ...prev, [serviceKey]: 'all' }));
                                                    }
                                                }}
                                                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                                            />
                                            <label htmlFor={`recommend-time-${idx}`} className="text-[12px] cursor-pointer">Recommend Best Time</label>
                                        </div>
                                    </div>
                                    <div>
                                        <Select
                                            value={hasNoVendors ? "none" : (typeof selectedVendor === 'string' ? selectedVendor : 'all')}
                                            onValueChange={handleVendorChange}
                                            disabled={hasNoVendors}
                                        >
                                            <SelectTrigger 
                                                className={cn(
                                                    "w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]",
                                                    hasNoVendors && "border-red-500 text-red-500 font-semibold"
                                                )}
                                            >
                                                {hasNoVendors ? "No vendor available" : <SelectValue placeholder="Select Vendor" />}
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Vendors</SelectItem>
                                                {isCalculating ? (
                                                    <SelectItem value="loading" disabled>
                                                        <div className="flex items-center gap-2">
                                                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                                            <span>Calculating travel times & vendors...</span>
                                                        </div>
                                                    </SelectItem>
                                                ) : service.uuid && filteredVendorsByService[service.uuid]?.length ? (
                                                    [...filteredVendorsByService[service.uuid]!]
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
                                                    const vendor = service.uuid
                                                        ? (filteredVendorsByService[service.uuid] ?? [])
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
                                                    {serviceDates[serviceKey] || masterDate ? format(serviceDates[serviceKey] || masterDate, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="end">
                                                <Calendar
                                                    mode="single"
                                                    selected={serviceDates[serviceKey] || masterDate}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            setServiceDates(prev => ({ ...prev, [serviceKey]: date }));
                                                        }
                                                    }}
                                                    disabled={{ before: new Date() }}
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
                                            // <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                            //     <div className="bg-white p-6 rounded-lg w-[400px] shadow-lg">
                                            //         <h2 className="text-xl font-semibold mb-4">
                                            //             {selectedVendorForModal.first_name} {selectedVendorForModal.last_name}
                                            //         </h2>

                                            //         <p className="text-sm text-gray-600 mb-4">
                                            //             Vendor UUID: {selectedVendorForModal.uuid}
                                            //         </p>

                                            //         <button
                                            //             onClick={() => setIsVendorModalOpen(false)}
                                            //             className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
                                            //         >
                                            //             Close
                                            //         </button>
                                            //     </div>
                                            // </div>
                                        )}

                                        {serviceSlots.length > 0 && (
                                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex flex-col gap-1 text-[12px] text-green-855 font-raleway font-semibold">
                                                <p className="font-bold text-green-900 flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                    Selected Appointment:
                                                </p>
                                                {(() => {
                                                    const slotsByDate: Record<string, Slot[]> = {};
                                                    serviceSlots.forEach(slot => {
                                                        if (!slotsByDate[slot.date]) {
                                                            slotsByDate[slot.date] = [];
                                                        }
                                                        slotsByDate[slot.date].push(slot);
                                                    });

                                                    return Object.entries(slotsByDate).map(([dateStr, slots]) => {
                                                        slots.sort((a, b) => a.start_time.localeCompare(b.start_time));
                                                        const mergedRanges: { start: string; end: string }[] = [];
                                                        if (slots.length > 0) {
                                                            let currentRange = { start: slots[0].start_time, end: slots[0].end_time };
                                                            for (let i = 1; i < slots.length; i++) {
                                                                const slot = slots[i];
                                                                if (slot.start_time === currentRange.end) {
                                                                    currentRange.end = slot.end_time;
                                                                } else {
                                                                    mergedRanges.push(currentRange);
                                                                    currentRange = { start: slot.start_time, end: slot.end_time };
                                                                }
                                                            }
                                                            mergedRanges.push(currentRange);
                                                        }

                                                        const formattedDate = dateStr
                                                            ? new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
                                                                year: "numeric",
                                                                month: "long",
                                                                day: "numeric",
                                                            })
                                                            : "";

                                                        const formatTime = (time: string) => {
                                                            const [h, m] = time.split(":");
                                                            const hour = parseInt(h);
                                                            const meridian = hour >= 12 ? "PM" : "AM";
                                                            const formattedHour = hour % 12 || 12;
                                                            return `${formattedHour}:${m} ${meridian}`;
                                                        };

                                                        return mergedRanges.map((range, rIdx) => {
                                                            const startTime = range.start ? formatTime(range.start) : "";
                                                            const endTime = range.end ? formatTime(range.end) : "";
                                                            return (
                                                                <div key={`${dateStr}-${rIdx}`} className="pl-3.5 text-green-700 font-medium text-[13px]">
                                                                    {formattedDate} | {startTime} - {endTime}
                                                                </div>
                                                            );
                                                        });
                                                    });
                                                })()}
                                            </div>
                                        )}

                                        <div className="mt-[20px]">
                                            {hasNoVendors ? (
                                                <div className="flex flex-col items-center justify-center p-6 border border-red-200 bg-red-50/50 rounded-lg text-center gap-4">
                                                    <Info className="w-8 h-8 text-red-500 animate-bounce" />
                                                    <div className="text-[14px] text-red-800 font-medium font-alexandria">
                                                        This service currently has no available vendors. Please remove the service from selection.
                                                    </div>
                                                    <Button 
                                                        variant="destructive"
                                                        onClick={() => setSelectedServices(prev => prev.filter(s => s.uuid !== service.uuid))}
                                                        className="w-full max-w-[200px] h-[40px] font-alexandria font-semibold"
                                                    >
                                                        Remove Service
                                                    </Button>
                                                </div>
                                            ) : (
                                                <OneDayCalendar
                                                    selectedVendors={
                                                        selectedVendor === 'all'
                                                            ? (
                                                                service.uuid
                                                                    ? (filteredVendorsByService[service.uuid] ?? [])
                                                                        .filter((v) =>
                                                                            v.vendor_services?.some(
                                                                                (vs) => vs.service?.uuid === service.uuid
                                                                            )
                                                                        )
                                                                        .map((v) => v.uuid)
                                                                        .filter(
                                                                            (uuid): uuid is string => typeof uuid === 'string'
                                                                        )
                                                                    : []
                                                            )
                                                            : [selectedVendor].filter(
                                                                (uuid): uuid is string => typeof uuid === 'string'
                                                            )
                                                    }
                                                    service={service}
                                                    calendarIdx={idx}
                                                    serviceKey={serviceKey}
                                                    showAllVendorsMap={showAllVendorsMap}
                                                    scheduleOverrideMap={scheduleOverrideMap}
                                                    recommendTimeMap={recommendTimeMap}
                                                    recommendTime={recommendTime}
                                                    showAllVendors={showAllVendors}
                                                    scheduleOverride={scheduleOverride}
                                                    setSelectedDate={(date) => {
                                                        if (date) {
                                                            const [y, m, d] = date.split('-').map(Number);
                                                            const newDate = new Date(y, m - 1, d);
                                                            setServiceDates(prev => ({ ...prev, [serviceKey]: newDate }));
                                                        }
                                                    }}
                                                    vendorDistances={vendorDistances}
                                                    propertyTimezone={propertyLocation?.timeZoneId}
                                                    masterDate={serviceDates[serviceKey] || masterDate}
                                                    onVendorSelected={handleVendorChange}
                                                    isCalculating={isCalculating}
                                                />
                                            )}
                                        </div>

                                        {/* Twilight display moved to OneDayCalendar */}

                                    </div>

                                </div>

                                {idx === 2 && (
                                    <div className="col-span-3">
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
                    })
                })()}
            </div>

            <div className="px-16 pb-6">
                <div className="flex justify-between items-center border border-[#EEEEEE] bg-white p-4 rounded-lg">
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
        </div>
    )
}

export default Schedule