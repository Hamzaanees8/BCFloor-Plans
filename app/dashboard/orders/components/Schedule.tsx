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
import { getPropertyTimezone, PropertyLocation, getCachedGeocode, fetchTwilightTime, TwilightResponse } from '../orders'
import { VendorData } from '../[id]/page'
import { useOrderContext, Slot } from '../context/OrderContext'
import VendorWorkCarousel from './VendorWorkCarousel'
import { getEffectiveServiceDuration } from '../utils/serviceTimeUtils'
import { Services } from '../../services/page'
import { CleanedProductOption } from '../../services/services'
import { useSearchParams } from 'next/navigation'
import { useAppContext } from '@/app/context/AppContext'
import { useOrganization } from '@/app/context/OrganizationContext';
import { GetTourSettings } from '@/app/dashboard/global-settings/global-settings';

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

async function isPropertyInsideVendorArea(propertyCoords: Coordinate | null, vendor: VendorData): Promise<boolean> {
    if (!propertyCoords || !vendor.coordinates) return false

    try {
        const polygon: Coordinate[] = JSON.parse(vendor.coordinates as unknown as string);
        if (!Array.isArray(polygon) || polygon.length < 3) return false

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
    const { organization } = useOrganization();
    const searchParams = useSearchParams();
    const isEdit = searchParams.get('isEdit') === 'true';
    const [googleReady, setGoogleReady] = useState(typeof window !== 'undefined' && !!window.google && !!window.google.maps);
    const [selectedVendorMap, setSelectedVendorMap] = React.useState<Record<string, string | string[]>>({});
    const [filteredVendorsByService, setFilteredVendorsByService] = useState<Record<string, VendorData[]>>({});
    // Vendors with force_service_area=false whose property is OUTSIDE their geofence.
    // These are hidden by default but become available when the admin enables Schedule Override.
    const [overridableVendorsByService, setOverridableVendorsByService] = useState<Record<string, VendorData[]>>({});
    const [masterDate, setMasterDate] = useState<Date>(new Date());
    const [serviceDates, setServiceDates] = useState<Record<string, Date | null>>({});
    const [vendorDistances, setVendorDistances] = useState<Record<string, number>>({});
    const [orgContact, setOrgContact] = useState<{ phone: string, email: string } | null>(null);

    useEffect(() => {
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            if (userInfoStr) {
                const userInfo = JSON.parse(userInfoStr);
                const org = userInfo?.organization || userInfo?.data?.organization;
                if (org) {
                    setOrgContact({
                        phone: org.contact_phone || org.primary_phone || '',
                        email: org.contact_email || org.from_email || org.email || ''
                    });
                }
            }
        } catch (e) {
            console.error('Failed to parse userInfo for org contact', e);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (window.google && window.google.maps) return;

        const interval = setInterval(() => {
            if (window.google && window.google.maps) {
                setGoogleReady(true);
                clearInterval(interval);
            }
        }, 500);

        return () => clearInterval(interval);
    }, []);
    const [selectedVendorForModal, setSelectedVendorForModal] = useState<VendorData | null>(null);
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isCalculating, setIsCalculating] = useState(true);
    const [propertyLocation, setPropertyLocation] = useState<PropertyLocation | null>(null);
    const [openTooltipIdx, setOpenTooltipIdx] = useState<number | null>(null);
    const { userType } = useAppContext();

    const {
        selectedCurrentListing,
        selectedServices,
        setSelectedServices,
        vendorsData,
        servicesData,
        tempPropertyData,
        selectedSlots,
        scheduleOverrideMap,
        setScheduleOverrideMap,
        showAllVendorsMap,
        setShowAllVendorsMap,
        recommendTimeMap,
        setRecommendTimeMap,
        portalSettings,
        setPortalSettings,
    } = useOrderContext();

    useEffect(() => {
        GetTourSettings().then((res: any) => {
            if (res?.portal_settings) setPortalSettings(res.portal_settings);
            else if (res?.data?.portal_settings) setPortalSettings(res.data.portal_settings);
        }).catch(err => console.log("Error fetching global settings in Schedule:", err));
    }, [setPortalSettings]);

    const servicesToSchedule = isEdit ? selectedServices : selectedServices.filter((s: any) => !s.service_uuid);
    const serviceCount = servicesToSchedule?.length || 0;

    const minDate = React.useMemo(() => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);

        if (portalSettings?.disable_next_day_booking && portalSettings.booking_cutoff_time) {
            const now = new Date();
            const [cutoffHour, cutoffMinute] = portalSettings.booking_cutoff_time.split(':').map(Number);
            const cutoffTime = new Date();
            cutoffTime.setHours(cutoffHour, cutoffMinute, 0, 0);

            if (now >= cutoffTime) {
                date.setDate(date.getDate() + 2);
            } else {
                date.setDate(date.getDate() + 1);
            }
        }
        return date;
    }, [portalSettings]);

    const [twilightData, setTwilightData] = useState<TwilightResponse | null>(null);
    const lastAddressRef = React.useRef<string>('');
    const isRunningRef = React.useRef<boolean>(false);

    const addressString = React.useMemo(() => {
        if (selectedCurrentListing) {
            return `${selectedCurrentListing.address}, ${selectedCurrentListing.city}, ${selectedCurrentListing.country}`.replace(/,\s*,/g, ',');
        }
        if (tempPropertyData) {
            return `${tempPropertyData.address}, ${tempPropertyData.city}, ${tempPropertyData.country}`.replace(/,\s*,/g, ',');
        }
        return '';
    }, [selectedCurrentListing, tempPropertyData]);

    const fullAddress = React.useMemo(() => {
        if (selectedCurrentListing) {
            return `${selectedCurrentListing.address}, ${selectedCurrentListing.city}, ${selectedCurrentListing.province || ''}, ${selectedCurrentListing.country}`.replace(/,\s*,/g, ',');
        }
        if (tempPropertyData) {
            return `${tempPropertyData.address}, ${tempPropertyData.city}, ${tempPropertyData.province || ''}, ${tempPropertyData.country}`.replace(/,\s*,/g, ',');
        }
        return '';
    }, [selectedCurrentListing, tempPropertyData]);

    useEffect(() => {
        async function loadTwilight() {
            if (!addressString) return;
            const formattedDate = format(masterDate, 'yyyy-MM-dd');
            const result = await fetchTwilightTime(addressString, formattedDate);
            if (result) setTwilightData(result);
        }
        loadTwilight();
    }, [addressString, masterDate]);

    useEffect(() => {
        async function loadAndCalculate() {
            if (!vendorsData.length || !addressString || !servicesData.length) {
                setFilteredVendorsByService({});
                setOverridableVendorsByService({});
                setIsCalculating(false);
                return;
            }

            if (isRunningRef.current) return;
            isRunningRef.current = true;
            setIsCalculating(true);

            // Fetch geocode once for all ops
            const propertyCoords = await getCachedGeocode(addressString);

            // 1. Filter vendors by service/area
            const result: Record<string, VendorData[]> = {};
            const overridable: Record<string, VendorData[]> = {};

            for (const service of servicesData) {
                const vendorsForService = vendorsData.filter(v =>
                    v.vendor_services?.some(vs => vs.service?.uuid === service.uuid)
                );

                const insideResults = await Promise.all(
                    vendorsForService.map(async vendor => {
                        const enable_service_area = vendor.settings?.enable_service_area;
                        const isServiceAreaEnabled = enable_service_area === 1 || enable_service_area === true;

                        if (!isServiceAreaEnabled) {
                            return { vendor, inside: true, canOverride: false };
                        }

                        const force_service_area = vendor.settings?.force_service_area;
                        const isForced = force_service_area === 1 || force_service_area === true;

                        let hasCoordinates = false;
                        try {
                            const coords = JSON.parse(vendor.coordinates as unknown as string);
                            hasCoordinates = Array.isArray(coords) && coords.length >= 3;
                        } catch {
                            hasCoordinates = false;
                        }

                        if (isForced) {
                            const inside = await isPropertyInsideVendorArea(propertyCoords, vendor);
                            return { vendor, inside, canOverride: false };
                        }

                        if (!hasCoordinates) {
                            return { vendor, inside: true, canOverride: false };
                        }

                        const inside = await isPropertyInsideVendorArea(propertyCoords, vendor);
                        return { vendor, inside, canOverride: !inside };
                    })
                );

                result[service.uuid] = insideResults
                    .filter(r => r.inside)
                    .map(r => r.vendor);

                overridable[service.uuid] = insideResults
                    .filter(r => r.canOverride)
                    .map(r => r.vendor);
            }

            setFilteredVendorsByService(result);
            setOverridableVendorsByService(overridable);

            // 2. Load property timezone (uses cached geocode under the hood)
            const location = await getPropertyTimezone(fullAddress);
            if (location) {
                setPropertyLocation(location);
            } else {
                console.error('Failed to fetch property timezone');
            }

            // 3. Calculate distances for unique vendors
            const uniqueVendorsMap = new Map<string, VendorData>();
            Object.values(result).flat().forEach(v => {
                if (v.uuid) uniqueVendorsMap.set(v.uuid, v);
            });
            Object.values(overridable).flat().forEach(v => {
                if (v.uuid) uniqueVendorsMap.set(v.uuid, v);
            });

            const uniqueVendors = Array.from(uniqueVendorsMap.values());
            
            if (uniqueVendors.length > 0) {
                for (let i = 0; i < uniqueVendors.length; i += 25) {
                    const batch = uniqueVendors.slice(i, i + 25);
                    await calculateAllVendorDistances(fullAddress, batch);
                }
            }

            setIsCalculating(false);
            isRunningRef.current = false;
            lastAddressRef.current = addressString;
        }

        loadAndCalculate();
    }, [addressString, fullAddress, vendorsData, servicesData, googleReady]);

    useEffect(() => {
        if (!isEdit || !selectedSlots.length || !servicesData.length) return;

        const newShowAllVendorsMap: Record<string, 0 | 1> = {};
        const newScheduleOverrideMap: Record<string, 0 | 1> = {};
        const newRecommendTimeMap: Record<string, 0 | 1> = {};

        servicesToSchedule.forEach((service, idx) => {
            const serviceKey = service.uuid || `service-${idx}`;
            const slot = selectedSlots.find(
                (s) => String(s.service_id) === String(service.uuid)
            );

            if (slot) {
                newShowAllVendorsMap[serviceKey] = slot.show_all_vendors ? 1 : 0;
                newScheduleOverrideMap[serviceKey] = slot.schedule_override ? 1 : 0;
                newRecommendTimeMap[serviceKey] = slot.recommend_time ? 1 : 0;
            }
        });

        setShowAllVendorsMap((prev) => ({ ...prev, ...newShowAllVendorsMap }));
        setScheduleOverrideMap((prev) => ({ ...prev, ...newScheduleOverrideMap }));
        setRecommendTimeMap((prev) => ({ ...prev, ...newRecommendTimeMap }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEdit, selectedSlots, servicesToSchedule, servicesData]);

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
                                disabled={{ before: minDate }}
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
                        const showAllVendors = showAllVendorsMap[serviceKey] ?? 0;
                        const scheduleOverride = scheduleOverrideMap[serviceKey] ?? 0;
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
                                        {userType === 'admin' && (
                                            <div className="flex flex-col gap-4">
                                                {/* <div className="flex justify-start gap-6 items-center">
                                                    <Switch
                                                        id={`show-all-vendors-${idx}`}
                                                        checked={!!showAllVendors}
                                                        onCheckedChange={(checked) =>
                                                            setShowAllVendorsMap((prev) => ({
                                                                ...prev,
                                                                [serviceKey]: checked ? 1 : 0,
                                                            }))
                                                        }
                                                        className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                                                    />
                                                    <label htmlFor={`show-all-vendors-${idx}`} className="text-[12px] cursor-pointer">Show all Vendors Regardless of Travel Time</label>
                                                </div> */}
                                                <div className="flex justify-start gap-6 items-center">
                                                    <Switch
                                                        id={`schedule-override-${idx}`}
                                                        checked={!!scheduleOverride}
                                                        onCheckedChange={(checked) =>
                                                            setScheduleOverrideMap((prev) => ({
                                                                ...prev,
                                                                [serviceKey]: checked ? 1 : 0,
                                                            }))
                                                        }
                                                        className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                                                    />
                                                    <label htmlFor={`schedule-override-${idx}`} className="text-[12px] cursor-pointer">Schedule Override</label>
                                                </div>
                                            </div>
                                        )}
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
                                        {(() => {
                                            const overridableVendors = service.uuid ? (overridableVendorsByService[service.uuid] ?? []) : [];
                                            const hasOverridable = overridableVendors.length > 0;
                                            // When override is ON, merge filtered + overridable vendors
                                            const visibleVendors = service.uuid
                                                ? [
                                                    ...(filteredVendorsByService[service.uuid] ?? []),
                                                    ...(scheduleOverride === 1 ? overridableVendors : []),
                                                ]
                                                : [];
                                            const overridableUUIDs = new Set(overridableVendors.map(v => v.uuid));
                                            const noVendors = !isCalculating && !!service.uuid && visibleVendors.length === 0;

                                            return (
                                                <>
                                                    {/* Show override hint when there are overridable vendors */}
                                                    {!isCalculating && hasOverridable && scheduleOverride === 0 && userType === 'admin' && (filteredVendorsByService[service.uuid ?? ''] ?? []).length === 0 && (
                                                        <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
                                                            <Info className="w-4 h-4 text-amber-600 shrink-0" />
                                                            <p className="text-[11px] text-amber-700 leading-snug">
                                                                <span className="font-semibold">{overridableVendors.length} vendor{overridableVendors.length > 1 ? 's are' : ' is'} available outside their service area.</span>{' '}
                                                                Enable <span className="font-semibold">Schedule Override</span> to include them.
                                                            </p>
                                                        </div>
                                                    )}
                                                    <Select
                                                        value={noVendors ? "none" : (typeof selectedVendor === 'string' ? selectedVendor : 'all')}
                                                        onValueChange={handleVendorChange}
                                                        disabled={noVendors}
                                                    >
                                                        <SelectTrigger
                                                            className={cn(
                                                                "w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]",
                                                                noVendors && "border-red-500 text-red-500 font-semibold"
                                                            )}
                                                        >
                                                            {noVendors ? "No vendor available" : <SelectValue placeholder="Select Vendor" />}
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All Vendors</SelectItem>
                                                            {isCalculating ? (
                                                                <SelectItem value="loading" disabled>
                                                                    <div className="flex items-center gap-2">
                                                                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                                                        <span>Calculating travel times &amp; vendors...</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ) : visibleVendors.length > 0 ? (
                                                                [...visibleVendors]
                                                                    .sort((a, b) => {
                                                                        const timeA = vendorDistances[a.uuid ?? ''] ?? Infinity;
                                                                        const timeB = vendorDistances[b.uuid ?? ''] ?? Infinity;
                                                                        return timeA - timeB;
                                                                    })
                                                                    .map((vendor, vidx) => {
                                                                        const travelTime = vendorDistances[vendor.uuid ?? ''];
                                                                        const color = getDistanceColor(travelTime);
                                                                        const isOverride = overridableUUIDs.has(vendor.uuid);
                                                                        return (
                                                                            <SelectItem className='flex justify-between text-nowrap' key={vidx} value={vendor.uuid ?? ''}>
                                                                                <div className="flex items-center gap-2 text-nowrap truncate">
                                                                                    <span className="w-2 h-4" style={{ backgroundColor: color }} />
                                                                                    <span>{vendor.first_name} {vendor.last_name}</span>
                                                                                    {isOverride && (
                                                                                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-300 rounded px-1 py-0.5 leading-none">Override</span>
                                                                                    )}
                                                                                    {travelTime !== undefined && (
                                                                                        <span className="text-gray-500 text-[12px] ml-1">
                                                                                            ({formatTravelTime(travelTime)})
                                                                                        </span>
                                                                                    )}
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
                                                    {noVendors && portalSettings?.show_org_details_on_empty_schedule && orgContact && (
                                                        <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                                                            <Info className="w-4 h-4 text-red-600 shrink-0" />
                                                            <p className="text-[11px] text-red-700 leading-snug">
                                                                <span className="font-semibold">No vendors available.</span>{' '}
                                                                Please contact us at <span className="font-semibold">{orgContact.phone || ''}</span> {orgContact.email ? `or ` : ''}<span className="font-semibold">{orgContact.email || ''}</span> to schedule this service.
                                                            </p>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}

                                        {/* SELECTED VENDOR DISPLAY */}
                                        <div className="mt-3 flex flex-col gap-2">

                                            {selectedVendor !== 'all' ? (
                                                (() => {
                                                    const allVisible = service.uuid
                                                        ? [
                                                            ...(filteredVendorsByService[service.uuid] ?? []),
                                                            ...(scheduleOverride === 1 ? (overridableVendorsByService[service.uuid] ?? []) : []),
                                                        ]
                                                        : [];
                                                    const vendor = allVisible.find((v) => v.uuid === selectedVendor);
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
                                                    disabled={{ before: minDate }}
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
                                            {(!isCalculating && !!service.uuid && (
                                                [
                                                    ...(filteredVendorsByService[service.uuid] ?? []),
                                                    ...(scheduleOverride === 1 ? (overridableVendorsByService[service.uuid] ?? []) : []),
                                                ].length === 0
                                            )) ? (
                                                <div className="flex flex-col items-center justify-center p-6 border border-red-200 bg-red-50/50 rounded-lg text-center gap-4">
                                                    <Info className="w-8 h-8 text-red-500 animate-bounce" />
                                                    <div className="text-[14px] text-red-800 font-medium font-alexandria">
                                                        This service currently has no available vendors. Please remove the service from selection.
                                                    </div>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => {
                                                            if (isEdit) {
                                                                // Check if service has an ID (was saved before)
                                                                if (service.id) {
                                                                    if (window.confirm("Are you sure you want to remove this service?")) {
                                                                        setSelectedServices((prev: any[]) => prev.filter((s: any) => s.uuid !== service.uuid));
                                                                    }
                                                                } else {
                                                                    // If it doesn't have an ID, it was just added in this session, so just remove it from state
                                                                    setSelectedServices((prev: any[]) => prev.filter((s: any) => s.uuid !== service.uuid));
                                                                }
                                                            } else {
                                                                setSelectedServices((prev: any[]) => prev.filter((s: any) => s.uuid !== service.uuid));
                                                            }
                                                        }}
                                                        className="w-full max-w-[200px] h-[40px] font-alexandria font-semibold"
                                                    >
                                                        Remove Service
                                                    </Button>
                                                    {portalSettings?.show_org_details_on_empty_schedule && (
                                                        <div className="text-[13px] text-red-700 mt-2 font-alexandria">
                                                            Please contact office at {orgContact?.phone || organization?.contact_phone || '(Phone number)'} & {orgContact?.email || organization?.contact_email || organization?.from_email || '(email)'}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <OneDayCalendar
                                                    selectedVendors={
                                                        selectedVendor === 'all'
                                                            ? (
                                                                service.uuid
                                                                    ? [
                                                                        ...(filteredVendorsByService[service.uuid] ?? []),
                                                                        ...(scheduleOverride === 1 ? (overridableVendorsByService[service.uuid] ?? []) : []),
                                                                    ]
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
                                                    twilightData={twilightData}
                                                />
                                            )}
                                        </div>

                                        {/* Twilight display moved to OneDayCalendar */}

                                    </div>

                                </div>

                                {((idx + 1) % 3 === 0 || idx === servicesToSchedule?.length - 1) && (
                                    <div className="col-span-3">
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
                                )}
                            </React.Fragment>
                        );
                    })
                })()}
            </div>

        </div>
    )
}

export default Schedule