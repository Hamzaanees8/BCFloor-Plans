import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import React, { useEffect, useState } from 'react'
import OneDayCalendar from '../../orders/components/OneDayCalendar'
import { Services } from '../../services/page'
import { VendorData } from '../../orders/[id]/page'
import { useOrderContext } from '../../orders/context/OrderContext'
import { GetServices, GetVendors, getPropertyTimezone, PropertyLocation } from '../../orders/orders'
import { Order, OrderService } from '../../orders/page'
import { useAppContext } from '@/app/context/AppContext'
// import OneDayCalendar from '../../orders/components/OneDayCalendar'


import { Button } from '@/components/ui/button'
import { cn } from "@/lib/utils"
// import { Images } from 'lucide-react'
import { CalendarIcon, Images, Info, Loader2 } from 'lucide-react'
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import VendorWorkCarousel from '../../orders/components/VendorWorkCarousel'
import { getEffectiveServiceDuration, splitSlotInto15MinChunks, isServiceRequiringTravel } from '../../orders/utils/serviceTimeUtils'
import { Slot } from '../../orders/context/OrderContext'

interface AppointmentTab {
    currentOrder?: Order;
}

export function getDistanceColor(distance: number | undefined): string {
    if (distance === undefined || distance === null) return "#CCCCCC";
    if (distance === 0) return "#2BC6FF";
    if (distance <= 15) return "#FD7DFF";
    if (distance <= 30) return "#E8B611";
    if (distance <= 45) return "#E2F202";
    if (distance <= 60) return "#9900A7";
    return "#171484";
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
    if (typeof window === 'undefined' || !window.google || !window.google.maps) return false

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
interface ScheduleProps extends AppointmentTab {
    invalidServices?: string[];
    squareFootage?: number | string;
}

const getSquareFootageFromOrder = (order?: Order, propSqFt?: number | string) => {
    if (propSqFt !== undefined && propSqFt !== null && propSqFt !== "") {
        const parsed = typeof propSqFt === 'string' ? parseFloat(propSqFt.replace(/,/g, '')) : Number(propSqFt);
        if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (order?.property?.square_footage) {
        const parsed = typeof order.property.square_footage === 'string'
            ? parseFloat(String(order.property.square_footage).replace(/,/g, ''))
            : Number(order.property.square_footage);
        if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (Array.isArray(order?.areas) && order.areas.length > 0) {
        const finished = order.areas
            .filter((a: any) => a.category === 'Finished' || a.type === 'Finished')
            .reduce((sum: number, a: any) => sum + (Number(a.footage) || 0), 0);
        const subtotal = order.areas
            .filter((a: any) => a.category === 'Subtotal' || a.type === 'Subtotal')
            .reduce((sum: number, a: any) => sum + (Number(a.footage) || 0), 0);
        const areaTotal = finished + subtotal;
        if (areaTotal > 0) return areaTotal;
    }
    return undefined;
};

const Schedule = ({ currentOrder, squareFootage: propSquareFootage, invalidServices = [] }: ScheduleProps) => {
    const { userType } = useAppContext();
    const [googleReady, setGoogleReady] = useState(typeof window !== 'undefined' && !!window.google && !!window.google.maps);
    const [vendorsData, setVendorsData] = React.useState<VendorData[]>([]);
    const [selectedVendorMap, setSelectedVendorMap] = React.useState<Record<number, string | string[]>>({});
    const [showAllVendorsMap, setShowAllVendorsMap] = useState<Record<number, 0 | 1>>({});
    const [scheduleOverrideMap, setScheduleOverrideMap] = useState<Record<number, 0 | 1>>({});
    const [recommendTimeMap, setRecommendTimeMap] = useState<Record<number, 0 | 1>>({});
    const [servicesData, setServicesData] = useState<Services[]>([]);
    const [filteredVendorsByService, setFilteredVendorsByService] = useState<Record<string, VendorData[]>>({});
    const [overridableVendorsByService, setOverridableVendorsByService] = useState<Record<string, VendorData[]>>({});
    const [mergedServices, setMergedServices] = useState<OrderService[]>([]);
    const { setSelectedSlots, calendarServices, selectedSlots } = useOrderContext();
    const [serviceDates, setServiceDates] = useState<Record<number, Date | undefined>>({}); // For calendar control
    const [vendorDistances, setVendorDistances] = useState<Record<string, number>>({});
    const [customDurationMap, setCustomDurationMap] = useState<Record<string, number | null>>({});
    const [bufferMinutesMap, setBufferMinutesMap] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!currentOrder?.slots) return;
        const durMap: Record<string, number | null> = {};
        const bufMap: Record<string, number> = {};
        currentOrder.slots.forEach(slot => {
            const sKey = String(slot.service_id);
            if (slot.custom_duration) durMap[sKey] = slot.custom_duration;
            if (slot.buffer_minutes) bufMap[sKey] = slot.buffer_minutes;
        });
        setCustomDurationMap(prev => ({ ...durMap, ...prev }));
        setBufferMinutesMap(prev => ({ ...bufMap, ...prev }));
    }, [currentOrder]);

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
    const [isCalculating, setIsCalculating] = useState(false);
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

            const convertedOrderSlots = (currentOrder.slots || []).flatMap((slot) => {
                const chunks = splitSlotInto15MinChunks(slot.start_time, slot.end_time);
                return chunks.map(chunk => ({
                    ...slot,
                    start_time: chunk.start_time,
                    end_time: chunk.end_time,
                    custom_duration: slot.custom_duration ?? null,
                    custom_end_time: slot.custom_end_time ?? null,
                    buffer_minutes: slot.buffer_minutes ?? 0,
                    service_id: serviceIdToUuidMap[slot.service_id] || String(slot.service_id),
                    vendor_id: slot.vendor?.uuid || slot.vendor_id,
                }));
            });

            return [...convertedOrderSlots, ...extraSlots];
        });
        // eslint-disable-next-line
    }, [currentOrder, mergedServices]);

    // Sync serviceDates with selectedSlots to ensure Pickers and Calendars show the correct initial date
    useEffect(() => {
        if (!selectedSlots.length || !mergedServices.length) return;

        const newServiceDates: Record<number, Date | undefined> = {};

        mergedServices.forEach((service: OrderService, idx: number) => {
            const slot = selectedSlots.find((s: Slot) =>
                String(s.service_id) === String(service.service?.uuid) ||
                String(s.service_id) === String(service.service?.id)
            );
            if (slot && slot.date) {
                // Create date objects for the picker using local time values from the date string
                // assuming slot.date is YYYY-MM-DD
                const [y, m, d] = slot.date.split('-').map(Number);
                newServiceDates[idx] = new Date(y, m - 1, d);
            }
        });

        // Only update if there are differences to avoid loops
        setServiceDates(prev => {
            const hasChanges = Object.keys(newServiceDates).some(key => {
                const k = Number(key);
                return prev[k]?.getTime() !== newServiceDates[k]?.getTime();
            });
            if (hasChanges || Object.keys(prev).length === 0) {
                return { ...prev, ...newServiceDates };
            }
            return prev;
        });

    }, [selectedSlots, mergedServices]);


    useEffect(() => {
        if (!servicesData.length) return;

        const enriched = (calendarServices?.map((item) => {
            const service = servicesData?.find(s => s.id === item.serviceId);
            if (!service) return null;

            const option = service.product_options.find(opt => opt.uuid === item.optionId);
            if (!option) return null;

            return {
                id: 0,
                order_id: currentOrder?.id || 0,
                amount: item.price,
                option_id: option.uuid,
                option: {
                    ...option,
                    id: option.id || 0,
                    service_id: service.id,
                    title: option.title || '',
                    quantity: option.quantity || 1,
                    amount: String(option.amount || 0),
                    service_duration: String(option.service_duration || 0),
                    sq_ft_range: option.sq_ft_range || '',
                    sq_ft_rate: option.sq_ft_rate || null,
                    min_price: String(option.min_price || 0),
                    created_at: '',
                    updated_at: ''
                },
                optuuid: option.uuid,
                service_id: service.id,
                service: {
                    ...service,
                    description: service.description || '',
                    category_id: 0,
                    thumbnail: service.thumbnail || '',
                    thumbnail_url: service.thumbnail_url || '',
                    background_color: service.background_color || '',
                    border_color: service.border_color || '',
                    created_at: '',
                    updated_at: ''
                },
                uuid: '',
                optionName: option.title || '',
                created_at: '',
                updated_at: ''
            } as OrderService;
        }).filter((item): item is OrderService => item !== null)) || [];

        const allServices = [
            ...(currentOrder?.services || []),
            ...enriched,
        ];
        setMergedServices(allServices.filter(s => isServiceRequiringTravel(s?.service, servicesData)));

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
                newShowAllVendorsMap[idx] = slot.show_all_vendors ? 1 : 0;
                newScheduleOverrideMap[idx] = slot.schedule_override ? 1 : 0;
                newRecommendTimeMap[idx] = slot.recommend_time ? 1 : 0;
            }
        });

        setShowAllVendorsMap(newShowAllVendorsMap);
        setScheduleOverrideMap(newScheduleOverrideMap);
        setRecommendTimeMap(newRecommendTimeMap);
    }, [currentOrder]);
    useEffect(() => {
        async function loadAndCalculate() {
            if (!vendorsData.length || !currentOrder?.property || !servicesData.length) return;

            setIsCalculating(true);

            // 1. Filter vendors
            const addressString = `${currentOrder?.property.address}, ${currentOrder?.property.city}, ${currentOrder?.property.country}`;
            const result: Record<string, VendorData[]> = {};
            const overridable: Record<string, VendorData[]> = {};

            for (const service of servicesData) {
                const vendorsForService = vendorsData.filter(v =>
                    v.vendor_services?.some(vs => vs.service?.uuid === service.uuid)
                );

                const insideResults = await Promise.all(
                    vendorsForService.map(async vendor => {
                        const force_service_area = vendor.settings?.force_service_area;
                        const isForced = force_service_area === 1 || force_service_area === true;

                        // Parse coordinates — check if a geofence has been drawn
                        let hasCoordinates = false;
                        try {
                            const coords = JSON.parse(vendor.coordinates as unknown as string);
                            hasCoordinates = Array.isArray(coords) && coords.length >= 3;
                        } catch {
                            hasCoordinates = false;
                        }

                        if (isForced) {
                            // force_service_area=true: always check geofence, NEVER overridable
                            const inside = await isPropertyInsideVendorArea(addressString, vendor);
                            return { vendor, inside, canOverride: false };
                        }

                        if (!hasCoordinates) {
                            // force_service_area=false, no geofence drawn: always available
                            return { vendor, inside: true, canOverride: false };
                        }

                        // force_service_area=false but a geofence IS drawn:
                        // Check if the property falls inside it.
                        // If outside → vendor is overridable (admin can bypass with Schedule Override).
                        const inside = await isPropertyInsideVendorArea(addressString, vendor);
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

            // 2. Load property timezone
            const fullAddress = `${currentOrder.property.address}, ${currentOrder.property.city}, ${currentOrder.property.province}, ${currentOrder.property.country}`;
            const location = await getPropertyTimezone(fullAddress);
            if (location) {
                setPropertyLocation(location);
            }

            // 3. Calculate distances for both available and overridable vendors
            const listingAddress = `${currentOrder.property.address}, ${currentOrder.property.city}, ${currentOrder.property.country}`;
            const allVendorSets = Object.keys(result).map(svcUuid => {
                const available = result[svcUuid] ?? [];
                const override = overridable[svcUuid] ?? [];
                return [...available, ...override];
            });

            const distancePromises = allVendorSets.map(async (vendors) => {
                if (vendors?.length > 0) {
                    await calculateAllVendorDistances(listingAddress, vendors);
                }
            });
            await Promise.all(distancePromises);

            setIsCalculating(false);
        }

        loadAndCalculate();
    }, [vendorsData, servicesData, currentOrder, googleReady]);

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
            <div className="px-3 py-4 bg-white border-b border-[#EEEEEE]">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 shadow-sm">
                    <Info className="w-5 h-5 text-blue-600 shrink-0" />
                    <p className="text-[14px] text-blue-800 leading-relaxed font-medium">
                        {mergedServices.length === 1 ? "This service is" : "These services are"} currently held waiting for completion of booking. Your appointment is not confirmed until you complete all steps and receive a confirmation message. If you do not see the time you are hoping for please call or email the office.
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-8 text-[#7D7D7D] px-3 py-20 auto-rows-max">
                {mergedServices?.map((service, idx) => {
                    const selectedVendor = selectedVendorMap[idx] ?? 'all';

                    const handleVendorChange = (value: string) => {
                        if (value === 'all') {
                            const allUUIDs = vendorsData
                                .map((v) => v.uuid)
                                .filter((uuid): uuid is string => typeof uuid === 'string');
                            setSelectedVendorMap((prev) => ({ ...prev, [idx]: allUUIDs }));
                        } else {
                            setSelectedVendorMap((prev) => ({ ...prev, [idx]: value }));
                        }
                    };

                    const showAllVendors = showAllVendorsMap[idx] ?? 0;
                    const scheduleOverride = scheduleOverrideMap[idx] ?? 0;
                    const recommendTime = recommendTimeMap[idx] ?? 0;

                    const overridableVendors = service.service.uuid ? (overridableVendorsByService[service.service.uuid] ?? []) : [];
                    const hasOverridable = overridableVendors.length > 0;
                    const visibleVendors = service.service.uuid
                        ? [
                            ...(filteredVendorsByService[service.service.uuid] ?? []),
                            ...(scheduleOverride === 1 ? overridableVendors : []),
                        ]
                        : [];
                    const overridableUUIDs = new Set(overridableVendors.map(v => v.uuid));
                    const noVendors = !isCalculating && !!service.service.uuid && visibleVendors.length === 0;

                    const squareFootage = getSquareFootageFromOrder(currentOrder, propSquareFootage);
                    const requiredDuration = getEffectiveServiceDuration(
                        service.option?.service_duration,
                        squareFootage
                    );

                    const serviceSlots = selectedSlots.filter((s: Slot) => s.service_id === service.service.uuid);
                    const currentDuration = serviceSlots.length * 15;
                    const isFullyScheduled = currentDuration >= requiredDuration && requiredDuration > 0;
                    const isInvalid = invalidServices.includes(service.service.uuid || '');

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isPastDate = serviceSlots.some((slot: Slot) => {
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
                                            Select Service Time ({idx + 1} of {mergedServices?.length})
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[16px] font-[700] max-w-[200px]">{service.service.name}</p>
                                        </div>
                                        <p className="text-[12px]">
                                            Approx. Duration <br />
                                            <span className="text-[16px] font-[700] block min-h-[24px]">
                                                {(() => {
                                                    const effectiveDuration = getEffectiveServiceDuration(
                                                        service.option?.service_duration,
                                                        squareFootage
                                                    );
                                                    const isCalculated = !service.option?.service_duration || Number(service.option.service_duration) === 0 || (Boolean(squareFootage) && (squareFootage ?? 0) > 2000);

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
                                        {userType === 'admin' && (
                                            <div className="flex flex-wrap gap-4 mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[11px] font-semibold text-gray-700">Appointment Duration</label>
                                                    <select
                                                        value={customDurationMap[service.service.uuid] ?? ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value ? Number(e.target.value) : null;
                                                            const sUuid = service.service.uuid;
                                                            setCustomDurationMap(prev => ({ ...prev, [sUuid]: val }));
                                                            setSelectedSlots(prev => prev.map(slot => {
                                                                if (slot.service_id === sUuid || String(slot.service_id) === String(service.service.id)) {
                                                                    return { ...slot, custom_duration: val };
                                                                }
                                                                return slot;
                                                            }));
                                                        }}
                                                        className="h-[32px] px-2 text-[12px] rounded border border-gray-300 bg-white"
                                                    >
                                                        <option value="">Standard ({requiredDuration} mins)</option>
                                                        <option value="15">15 mins</option>
                                                        <option value="30">30 mins</option>
                                                        <option value="45">45 mins</option>
                                                        <option value="60">1 hour (60m)</option>
                                                        <option value="75">1h 15m (75m)</option>
                                                        <option value="90">1h 30m (90m)</option>
                                                        <option value="105">1h 45m (105m)</option>
                                                        <option value="120">2 hours (120m)</option>
                                                        <option value="135">2h 15m (135m)</option>
                                                        <option value="150">2h 30m (150m)</option>
                                                        <option value="165">2h 45m (165m)</option>
                                                        <option value="180">3 hours (180m)</option>
                                                        <option value="210">3h 30m (210m)</option>
                                                        <option value="240">4 hours (240m)</option>
                                                    </select>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[11px] font-semibold text-gray-700">Buffer / Travel Time</label>
                                                    <select
                                                        value={bufferMinutesMap[service.service.uuid] ?? 0}
                                                        onChange={(e) => {
                                                            const val = Number(e.target.value);
                                                            const sUuid = service.service.uuid;
                                                            setBufferMinutesMap(prev => ({ ...prev, [sUuid]: val }));
                                                            setSelectedSlots(prev => prev.map(slot => {
                                                                if (slot.service_id === sUuid || String(slot.service_id) === String(service.service.id)) {
                                                                    return { ...slot, buffer_minutes: val };
                                                                }
                                                                return slot;
                                                            }));
                                                        }}
                                                        className="h-[32px] px-2 text-[12px] rounded border border-gray-300 bg-white"
                                                    >
                                                        <option value="0">0 mins (No Buffer)</option>
                                                        <option value="15">15 mins</option>
                                                        <option value="30">30 mins</option>
                                                        <option value="45">45 mins</option>
                                                        <option value="60">60 mins (1 hour)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
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
                                            <div className="flex justify-start gap-6 items-center">
                                                <Switch
                                                    id={`show-all-vendors-${idx}`}
                                                    checked={!!showAllVendors}
                                                    onCheckedChange={(checked) =>
                                                        setShowAllVendorsMap((prev) => ({
                                                            ...prev,
                                                            [idx]: checked ? 1 : 0,
                                                        }))
                                                    }
                                                    className={cn("data-[state=unchecked]:bg-gray-300", showAllVendors ? `${userType}-bg border-none` : "")}
                                                />
                                                <label htmlFor={`show-all-vendors-${idx}`} className="text-[12px] cursor-pointer">Show all Vendors Regardless of Travel Time</label>
                                            </div>
                                            <div className="flex justify-start gap-6 items-center">
                                                <Switch
                                                    id={`schedule-override-${idx}`}
                                                    checked={!!scheduleOverride}
                                                    onCheckedChange={(checked) =>
                                                        setScheduleOverrideMap((prev) => ({
                                                            ...prev,
                                                            [idx]: checked ? 1 : 0,
                                                        }))
                                                    }
                                                    className={cn("data-[state=unchecked]:bg-gray-300", scheduleOverride ? `${userType}-bg border-none` : "")}
                                                />
                                                <label htmlFor={`schedule-override-${idx}`} className="text-[12px] cursor-pointer">Schedule Override</label>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-start gap-6 items-center">
                                        <Switch
                                            checked={!!recommendTime}
                                            onCheckedChange={(checked) => {
                                                setRecommendTimeMap((prev) => ({
                                                    ...prev,
                                                    [idx]: checked ? 1 : 0,
                                                }));

                                                if (checked) {
                                                    const serviceVendors = visibleVendors;
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
                                            className={cn("data-[state=unchecked]:bg-gray-300", recommendTime ? `${userType}-bg border-none` : "")}
                                        />
                                        <p className="text-[12px]">Recommend Best Time</p>
                                    </div>
                                </div>
                                <div>
                                    {/* Show override hint when there are overridable vendors */}
                                    {!isCalculating && hasOverridable && scheduleOverride === 0 && (
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
                                                        <span>Calculating travel times & vendors...</span>
                                                    </div>
                                                </SelectItem>
                                            ) : visibleVendors.length > 0 ? (
                                                [...visibleVendors]
                                                    .sort((a, b) => {
                                                        const ta = vendorDistances[a.uuid ?? ''] ?? Infinity;
                                                        const tb = vendorDistances[b.uuid ?? ''] ?? Infinity;
                                                        return ta - tb;
                                                    })
                                                    .map((vendor, vidx) => {
                                                        const travelTime = vendorDistances[vendor.uuid ?? ''];
                                                        const color = getDistanceColor(travelTime);
                                                        const isOverride = overridableUUIDs.has(vendor.uuid);
                                                        return (
                                                            <SelectItem className='flex justify-between text-nowrap' key={vidx} value={vendor.uuid ?? ''}>
                                                                <div className="flex items-center gap-2 text-nowrap truncate w-full">
                                                                    <span className="w-2 h-4" style={{ backgroundColor: color }} />
                                                                    <span>{vendor.first_name} {vendor.last_name}</span>
                                                                    {isOverride && (
                                                                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-300 rounded px-1 py-0.5 leading-none">Override</span>
                                                                    )}
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
                                                const vendor = visibleVendors.find((v) => v.uuid === selectedVendor);
                                                if (!vendor) return null;

                                                return (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedVendorForModal(vendor);
                                                            setIsVendorModalOpen(true);
                                                        }}
                                                        className={`w-full ${userType}-text ${userType}-border hover-${userType}-bg hover:text-white flex gap-2 items-center justify-center mt-2 capitalize`}
                                                    >
                                                        <Images className="w-4 h-4" />
                                                        {`View Portfolio`}
                                                    </Button>
                                                );
                                            })()
                                        ) : null}
                                    </div>

                                    {isVendorModalOpen && selectedVendorForModal && (
                                        <VendorWorkCarousel
                                            open={isVendorModalOpen}
                                            setOpen={setIsVendorModalOpen}
                                            images={selectedVendorForModal?.portfolio_images ?? []}
                                            title={`${selectedVendorForModal.first_name} ${selectedVendorForModal.last_name}'s Work`}
                                        />
                                    )}

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    `w-full h-[42px] justify-start text-left font-normal border-[#BBBBBB] text-[#7D7D7D] mt-3`,
                                                )}
                                                style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {serviceDates[idx] ? format(serviceDates[idx]!, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="end">
                                            <Calendar
                                                mode="single"
                                                selected={serviceDates[idx]}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        setServiceDates(prev => ({ ...prev, [idx]: date }));
                                                    }
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>

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
                                        <OneDayCalendar
                                            className={`my-${userType}-calendar`}
                                            selectedVendors={
                                                selectedVendor === 'all'
                                                    ? (
                                                        service.service.uuid
                                                            ? [
                                                                ...(filteredVendorsByService[service.service.uuid] ?? []),
                                                                ...(scheduleOverride === 1 ? (overridableVendorsByService[service.service.uuid] ?? []) : []),
                                                            ]
                                                                .filter((v) =>
                                                                    v.vendor_services?.some(
                                                                        (vs) => vs.service?.uuid === service.service.uuid
                                                                    )
                                                                )
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
                                            selectedListingId={currentOrder?.property?.uuid ?? ''}
                                            service={service as any}
                                            calendarIdx={idx}
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
                                                    setServiceDates(prev => ({ ...prev, [idx]: newDate }));
                                                }
                                            }}
                                            targetDate={serviceDates[idx] ? format(serviceDates[idx]!, 'yyyy-MM-dd') : undefined}
                                            currentOrderId={currentOrder?.id}
                                            vendorDistances={vendorDistances}
                                            onVendorSelected={handleVendorChange}
                                            propertyTimezone={propertyLocation?.timeZoneId}
                                            squareFootage={squareFootage}
                                            isCalculating={isCalculating}
                                            serviceKey={service.service?.uuid || String(service.id || idx)}
                                            masterDate={serviceDates[idx] || new Date()}
                                        />
                                    </div>

                                    {/* Twilight info is now rendered per-service inside OneDayCalendar */}
                                </div>
                            </div>

                        </React.Fragment>
                    );
                })}
            </div>

            <div className="px-3 pb-6">
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