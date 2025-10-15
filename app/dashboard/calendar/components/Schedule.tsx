import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import React, { useEffect, useState } from 'react'
import OneDayCalendar from './OneDayCalendar'
import { Services } from '../../services/page'
import { VendorData } from '../../orders/[id]/page'
import { useOrderContext } from '../../orders/context/OrderContext'
import { GetServices, GetVendors } from '../../orders/orders'
import { Order } from '../../orders/page'
import { useAppContext } from '@/app/context/AppContext'
// import OneDayCalendar from '../../orders/components/OneDayCalendar'


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
    const { userType } = useAppContext();
    const [vendorsData, setVendorsData] = React.useState<VendorData[]>([]);
    const [selectedVendorMap, setSelectedVendorMap] = React.useState<Record<number, string | string[]>>({});
    const [vendorColors, setVendorColors] = React.useState<Record<string, string>>({});
    const [showAllVendorsMap, setShowAllVendorsMap] = useState<Record<number, 0 | 1>>({});
    const [scheduleOverrideMap, setScheduleOverrideMap] = useState<Record<number, 0 | 1>>({});
    const [recommendTimeMap, setRecommendTimeMap] = useState<Record<number, 0 | 1>>({});
    const [servicesData, setServicesData] = useState<Services[]>([]);
    const [filteredVendorsByService, setFilteredVendorsByService] = useState<Record<string, VendorData[]>>({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [mergedServices, setMergedServices] = useState<any[]>([]);
    const { setSelectedSlots, calendarServices } = useOrderContext();
    useEffect(() => {
        if (!currentOrder?.slots) return;

        setSelectedSlots((prev) => {
            const currentOrderServiceIds = currentOrder.slots.map((slot) => String(slot.service_id));

            const extraSlots = prev.filter(
                (slot) => !currentOrderServiceIds.includes(String(slot.service_id))
            );

            const convertedOrderSlots = currentOrder.slots.map((slot) => ({
                ...slot,
                service_id: String(slot.service_id),
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
        function generateColorMap(vendors: VendorData[]): Record<string, string> {
            const map: Record<string, string> = {};
            const usedColors = new Set<string>();

            vendors.forEach((vendor, index) => {
                let color: string;
                do {
                    const hue = Math.floor((360 / vendors.length) * index);
                    const saturation = 90 + Math.floor(Math.random() * 10);
                    const lightness = 40 + Math.floor(Math.random() * 10);
                    color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                } while (usedColors.has(color));

                usedColors.add(color);
                if (vendor.uuid !== undefined) {
                    map[vendor.uuid] = color;
                }
            });

            return map;
        }

        const colorMap = generateColorMap(vendorsData);
        setVendorColors(colorMap);
    }, [vendorsData]);

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

            const addressString = `${currentOrder?.property.address}, ${currentOrder?.property.city}, ${currentOrder?.property.country}`;
            const result: Record<string, VendorData[]> = {};

            for (const service of servicesData) {
                const vendorsForService = vendorsData.filter(v =>
                    v.vendor_services?.some(vs => vs.service?.uuid === service.uuid)
                );

                const insideResults = await Promise.all(
                    vendorsForService.map(async vendor => ({
                        vendor,
                        inside: await isPropertyInsideVendorArea(addressString, vendor),
                    }))
                );

                result[service.uuid] = insideResults
                    .filter(r => r.inside)
                    .map(r => r.vendor);
            }

            setFilteredVendorsByService(result);
        }

        filterVendorsByService();
    }, [vendorsData, servicesData, currentOrder]);

    return (
        <div className='font-alexandria'>
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



                    return (
                        <React.Fragment key={idx}>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <p className="text-[12px]">
                                        Select Service Time ({idx + 1} of {mergedServices?.length})
                                    </p>
                                    <p className="text-[16px] font-[700]">{service.service.name}</p>
                                    <p className="text-[12px]">
                                        Approx. Duration <br />
                                        <span className="text-[16px] font-[700]">
                                            {service.option?.service_duration || 0} Minutes
                                        </span>
                                    </p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-start gap-6 items-center">
                                        <Switch
                                            checked={!!showAllVendors}
                                            onCheckedChange={() =>
                                                setShowAllVendorsMap((prev) => ({
                                                    ...prev,
                                                    [idx]: showAllVendors === 1 ? 0 : 1,
                                                }))
                                            }
                                            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                                        />
                                        <p className="text-[12px]">Show all Vendors Regardless of Travel Time</p>
                                    </div>
                                    <div className="flex justify-start gap-6 items-center">
                                        <Switch
                                            checked={!!scheduleOverride}
                                            onCheckedChange={() =>
                                                setScheduleOverrideMap((prev) => ({
                                                    ...prev,
                                                    [idx]: scheduleOverride === 1 ? 0 : 1,
                                                }))
                                            }
                                            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                                        />
                                        <p className="text-[12px]">Schedule Override</p>
                                    </div>
                                    <div className="flex justify-start gap-6 items-center">
                                        <Switch
                                            checked={!!recommendTime}
                                            onCheckedChange={() =>
                                                setRecommendTimeMap((prev) => ({
                                                    ...prev,
                                                    [idx]: recommendTime === 1 ? 0 : 1,
                                                }))
                                            }
                                            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                                        />
                                        <p className="text-[12px]">Recommend Best Time</p>
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
                                            {service.service.uuid && filteredVendorsByService[service.service.uuid]?.length ? (
                                                filteredVendorsByService[service.service.uuid]!.map((vendor, vidx) => (
                                                    <SelectItem key={vidx} value={vendor.uuid ?? ''}>
                                                        {vendor.first_name} {vendor.last_name}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="none" disabled>
                                                    No vendors available for this service in the selected area
                                                </SelectItem>
                                            )}


                                        </SelectContent>
                                    </Select>

                                    <div className="mt-[20px]">
                                        <OneDayCalendar
                                            className={`my-${userType}-calendar`}
                                            selectedVendors={
                                                selectedVendor === 'all'
                                                    ? (
                                                        service.service.uuid
                                                            ? (filteredVendorsByService[service.service.uuid] ?? [])
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
                                            selectedListingId={currentOrder?.property.uuid ?? ''}
                                            vendorColors={vendorColors}
                                            service={service}
                                            calendarIdx={idx}
                                            showAllVendorsMap={showAllVendorsMap}
                                            scheduleOverrideMap={scheduleOverrideMap}
                                            recommendTimeMap={recommendTimeMap}
                                            recommendTime={recommendTime}
                                            showAllVendors={showAllVendors}
                                            scheduleOverride={scheduleOverride}

                                        // serviceDuration={service?.option?.service_duration ?? ''}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* {idx === 2 && (
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
                            )} */}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    )
}

export default Schedule