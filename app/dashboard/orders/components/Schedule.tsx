import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import React, { useEffect, useState } from 'react'
import OneDayCalendar from './OneDayCalendar'
import { GetServices, GetVendors } from '../orders'
import { VendorData } from '../[id]/page'
import { useOrderContext } from '../context/OrderContext'
import { Services } from '../../services/page'

const Schedule = () => {
    const [vendorsData, setVendorsData] = React.useState<VendorData[]>([]);
    const [selectedVendorMap, setSelectedVendorMap] = React.useState<Record<number, string | string[]>>({});
    const [vendorColors, setVendorColors] = React.useState<Record<string, string>>({});
    const [showAllVendorsMap, setShowAllVendorsMap] = useState<Record<number, 0 | 1>>({});
    const [scheduleOverrideMap, setScheduleOverrideMap] = useState<Record<number, 0 | 1>>({});
    const [recommendTimeMap, setRecommendTimeMap] = useState<Record<number, 0 | 1>>({});
    const [servicesData, setServicesData] = useState<Services[]>([]);

    const { selectedServices } = useOrderContext();
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

    // console.log('servicesData', servicesData);


    // const filteredService =


    // const handleVendorChange = (value: string) => {
    //     if (value === "all") {
    //         // store all UUIDs
    //         const allUUIDs = vendorsData.map(v => v.uuid);
    //         setSelectedVendors(allUUIDs);
    //     } else {
    //         setSelectedVendors(value);
    //     }
    // };
    console.log('selectedVendorMap', selectedVendorMap)
    return (
        <div className='font-alexandria'>
            {/* <div className='grid grid-cols-3 gap-16 text-[#7D7D7D] px-16 py-20 font-alexandria'>
                {selectedServices?.map((service, idx) => {
                    const selectedVendor = selectedVendorMap[idx] ?? 'all';

                    const handleVendorChange = (value: string) => {
                        if (value === "all") {
                            const allUUIDs = vendorsData.map(v => v.uuid).filter((uuid): uuid is string => typeof uuid === "string");
                            setSelectedVendorMap(prev => ({ ...prev, [idx]: allUUIDs }));
                        } else {
                            setSelectedVendorMap(prev => ({ ...prev, [idx]: value }));
                        }
                    };
                    const showAllVendors = showAllVendorsMap[idx] ?? 0;
                    const scheduleOverride = scheduleOverrideMap[idx] ?? 0;
                    const recommendTime = recommendTimeMap[idx] ?? 0;

                    const currentService = servicesData?.find((s) => {
                        return s.uuid == service.uuid
                    })
                    const productOption = currentService?.product_options?.find((option) => {
                        return option.uuid == service.option_id
                    })
                    return <div key={idx} className='flex flex-col gap-4'>
                        <div>
                            <p className='text-[12px]'>Select  Service Time ({idx + 1} of {selectedServices?.length})</p>
                            <p className='text-[16px] font-[700]'>{service.title}</p>
                            <p className='text-[12px]'>Approx. Duration <br />
                                <span className='text-[16px] font-[700]'>{productOption?.service_duration} Minutes</span></p>
                        </div>
                        <div className='flex flex-col gap-4'>
                            <div className='flex justify-start gap-6 items-center'>
                                <Switch
                                    checked={!!showAllVendors}
                                    onCheckedChange={() =>
                                        setShowAllVendorsMap(prev => ({ ...prev, [idx]: showAllVendors === 1 ? 0 : 1 }))
                                    }
                                    className='data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500'
                                />

                                <p className='text-[12px]'>Show all Vendors Regardless of Travel Time</p>
                            </div>
                            <div className='flex justify-start gap-6 items-center'>
                                <Switch
                                    checked={!!scheduleOverride}
                                    onCheckedChange={() =>
                                        setScheduleOverrideMap(prev => ({ ...prev, [idx]: scheduleOverride === 1 ? 0 : 1 }))
                                    }
                                    className='data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500'
                                />
                                <p className='text-[12px]'>Schedule Override</p>
                            </div>
                            <div className='flex justify-start gap-6 items-center'>
                                <Switch
                                    checked={!!recommendTime}
                                    onCheckedChange={() =>
                                        setRecommendTimeMap(prev => ({ ...prev, [idx]: recommendTime === 1 ? 0 : 1 }))
                                    }
                                    className='data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500'
                                />
                                <p className='text-[12px]'>Recommend Best Time</p>
                            </div>
                        </div>
                        <div>
                            <Select
                                value={typeof selectedVendor === "string" ? selectedVendor : "all"}
                                onValueChange={handleVendorChange}
                            >
                                <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]">
                                    <SelectValue placeholder="Select Vendor" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="all">All Vendors</SelectItem>
                                    {vendorsData?.map((vendor, idx) => (
                                        <SelectItem key={idx} value={vendor.uuid ?? ''}>
                                            {vendor.first_name} {vendor.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className='mt-[20px]'>
                                <OneDayCalendar
                                    selectedVendors={
                                        selectedVendor === 'all'
                                            ? vendorsData.map(v => v.uuid).filter((uuid): uuid is string => typeof uuid === "string")
                                            : Array.isArray(selectedVendor)
                                                ? selectedVendor.filter((uuid): uuid is string => typeof uuid === "string")
                                                : [selectedVendor].filter((uuid): uuid is string => typeof uuid === "string")
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
                                />
                            </div>

                        </div>
                    </div>
                })}

            </div> */}
            <div className="grid grid-cols-3 gap-16 text-[#7D7D7D] px-16 py-20 auto-rows-max">
                {selectedServices?.map((service, idx) => {
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
                                            {vendorsData?.map((vendor, vidx) => (
                                                <SelectItem key={vidx} value={vendor.uuid ?? ''}>
                                                    {vendor.first_name} {vendor.last_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <div className="mt-[20px]">
                                        <OneDayCalendar
                                            selectedVendors={
                                                selectedVendor === 'all'
                                                    ? vendorsData
                                                        .map((v) => v.uuid)
                                                        .filter((uuid): uuid is string => typeof uuid === 'string')
                                                    : Array.isArray(selectedVendor)
                                                        ? selectedVendor.filter((uuid): uuid is string => typeof uuid === 'string')
                                                        : [selectedVendor].filter((uuid): uuid is string => typeof uuid === 'string')
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
                                        //serviceDuration={productOption?.service_duration ?? 0}
                                        />
                                    </div>
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