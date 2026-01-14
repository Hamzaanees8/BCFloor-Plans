import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import React, { useEffect, useState } from 'react'
import OneDayCalendar from './OneDayCalendar'
import { fetchTwilightTime, getPropertyTimezone, PropertyLocation, TwilightResponse } from '../orders'
import { VendorData } from '../[id]/page'
import { useOrderContext } from '../context/OrderContext'
import VendorWorkCarousel from './VendorWorkCarousel'

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

const Schedule = () => {
    const [selectedVendorMap, setSelectedVendorMap] = React.useState<Record<number, string | string[]>>({});
    const [vendorColors, setVendorColors] = React.useState<Record<string, string>>({});
    const [showAllVendorsMap, setShowAllVendorsMap] = useState<Record<number, 0 | 1>>({});
    const [scheduleOverrideMap, setScheduleOverrideMap] = useState<Record<number, 0 | 1>>({});
    const [recommendTimeMap, setRecommendTimeMap] = useState<Record<number, 0 | 1>>({});
    const [data, setData] = useState<TwilightResponse | null>(null);
    const [filteredVendorsByService, setFilteredVendorsByService] = useState<Record<string, VendorData[]>>({});
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [vendorDistances, setVendorDistances] = useState<Record<string, number>>({});
    const [selectedVendorForModal, setSelectedVendorForModal] = useState<VendorData | null>(null);
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isCalculating, setIsCalculating] = useState(true);
    const [propertyLocation, setPropertyLocation] = useState<PropertyLocation | null>(null);

    const {
        selectedCurrentListing,
        selectedServices,
        vendorsData,
        servicesData,
    } = useOrderContext();

    useEffect(() => {
        async function filterVendorsByService() {
            if (!vendorsData.length || !selectedCurrentListing || !servicesData.length) {
                return;
            }

            setIsCalculating(true);

            const addressString = `${selectedCurrentListing.address}, ${selectedCurrentListing.city}, ${selectedCurrentListing.country}`;
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
    }, [vendorsData, servicesData, selectedCurrentListing]);

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
        const address = `${selectedCurrentListing?.address}, ${selectedCurrentListing?.city}, ${selectedCurrentListing?.country}`

        async function loadTwilight() {
            const result = await fetchTwilightTime(address, selectedDate);
            if (result) setData(result);
        }

        loadTwilight();
    }, [selectedCurrentListing, selectedDate]);

    const formatLocalTime = (utcTime: string, fixedTimeZone?: string) => {
        if (!utcTime) return "—";
        const timeZone = fixedTimeZone || propertyLocation?.timeZoneId || "America/Vancouver";

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
        if (!selectedCurrentListing || !filteredVendorsByService) return;

        const listingAddress = `${selectedCurrentListing.address}, ${selectedCurrentListing.city}, ${selectedCurrentListing.province}, ${selectedCurrentListing.country}`;

        Object.values(filteredVendorsByService).forEach((vendors) => {
            if (vendors?.length > 0) {
                calculateAllVendorDistances(listingAddress, vendors);
            }
        });
    }, [selectedCurrentListing, filteredVendorsByService]);

    const formatTravelTime = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
        return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min`;
    };

    useEffect(() => {
        async function loadPropertyTimezone() {
            if (!selectedCurrentListing) return;

            const fullAddress = `${selectedCurrentListing.address}, ${selectedCurrentListing.city}, ${selectedCurrentListing.province}, ${selectedCurrentListing.country}`;

            const location = await getPropertyTimezone(fullAddress);
            if (location) {
                setPropertyLocation(location);
                console.log('Property coordinates and timezone:', location);
            } else {
                console.error('Failed to fetch property timezone');
            }
        }

        loadPropertyTimezone();
    }, [selectedCurrentListing]);

    return (
        <div className='font-alexandria'>
            <div className="grid grid-cols-3 gap-16 text-[#7D7D7D] px-16 py-20 auto-rows-max">
                {selectedServices?.map((service, idx) => {
                    const selectedVendor = selectedVendorMap[idx] ?? 'all';

                    const handleVendorChange = (value: string) => {
                        setSelectedVendorMap((prev) => ({ ...prev, [idx]: value }));
                    };

                    const showAllVendors = showAllVendorsMap[idx] ?? 0;
                    const scheduleOverride = scheduleOverrideMap[idx] ?? 0;
                    const recommendTime = recommendTimeMap[idx] ?? 0;

                    const currentService = servicesData?.find((s) => s.uuid === service.uuid);
                    const productOption = currentService?.product_options?.find(
                        (option) => option.uuid === service.option_id
                    );

                    return (
                        <React.Fragment key={idx}>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <p className="text-[12px]">
                                        Select Service Time ({idx + 1} of {selectedServices?.length})
                                    </p>
                                    <p className="text-[16px] font-[700]">{service.title}</p>
                                    <p className="text-[12px]">
                                        Approx. Duration <br />
                                        <span className="text-[16px] font-[700]">
                                            {productOption?.service_duration} Minutes
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
                                            {isCalculating ? (
                                                <SelectItem value="loading" disabled>
                                                    Fetching vendors...
                                                </SelectItem>
                                            ) : service.uuid && filteredVendorsByService[service.uuid]?.length ? (
                                                filteredVendorsByService[service.uuid]!.map((vendor, vidx) => {
                                                    const travelTime = vendorDistances[vendor.uuid ?? ''];
                                                    return (
                                                        <SelectItem className='flex justify-between' key={vidx} value={vendor.uuid ?? ''}>
                                                            <span>{vendor.first_name} {vendor.last_name}</span>
                                                            <span>{travelTime !== undefined && (
                                                                <span className="text-gray-500 text-[12px] ml-2">
                                                                    ({formatTravelTime(travelTime)})
                                                                </span>
                                                            )}</span>
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
                                                    <button
                                                        onClick={() => {
                                                            setSelectedVendorForModal(vendor);
                                                            setIsVendorModalOpen(true);
                                                        }}
                                                        className="text-sm text-[#4290E9] underline text-left capitalize"
                                                    >
                                                        {`${vendor.first_name} ${vendor.last_name}'s Work`}
                                                    </button>
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

                                    <div className="mt-[20px]">
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
                                            vendorColors={vendorColors}
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
                                        //serviceDuration={productOption?.service_duration ?? 0}
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
                })}
            </div>
        </div>
    )
}

export default Schedule