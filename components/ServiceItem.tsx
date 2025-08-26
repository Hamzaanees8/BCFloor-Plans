// components/ServiceItem.jsx

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDownIcon, DropDownArrow } from "./Icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface ServiceItemProps {
    service: {
        serviceId: string;
        hourlyRate: string | number;
        timeNeeded: string | number;
    };
    servicesData: { uuid: string; name?: string }[];
    index: number;
    onChange: (
        index: number,
        field: 'serviceId' | 'hourlyRate' | 'timeNeeded',
        value: string
    ) => void;
}

const ServiceItem = ({ service, servicesData, index, onChange }: ServiceItemProps) => {
    const [showTimeFields, setShowTimeFields] = useState(false);
    // const serviceName =
    //     servicesData.find((s) => s.uuid === service.serviceId)?.name || "Unknown Service";
    const timeNeededOptions = [
        '5 Minutes',
        '10 Minutes',
        '15 Minutes',
        '30 Minutes',
        '45 Minutes',
    ];
    return (
        <div>
            {/* Service Name */}
            <div className="col-span-2 mt-4">
                <label className="block text-sm font-normal">Service Name</label>
                <div className="flex items-center gap-x-[20px]">
                    <Select
                        value={service.serviceId}
                        onValueChange={(value) => onChange(index, 'serviceId', value)}
                    >
                        <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 [&>svg]:hidden [&>span.custom-arrow>svg]:block">
                            <SelectValue placeholder="Select Service Option Here" />
                            <span className="custom-arrow">
                                <DropDownArrow />
                            </span>
                        </SelectTrigger>

                        <SelectContent>
                            {servicesData.map((option) => (
                                <SelectItem key={option.uuid} value={option.uuid}>
                                    {option.name || "Unnamed Service"}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <button
                        type="button"
                        onClick={() => setShowTimeFields(!showTimeFields)}
                        className="mt-[12px]"
                    >
                        {showTimeFields ? <ChevronDownIcon /> : <DropDownArrow />}
                    </button>
                </div>
            </div>
            {showTimeFields && (
                <div className="flex items-center gap-x-3 w-[376px] mt-4">
                    <div className="relative w-full">
                        <label className="block text-sm font-normal">Hourly Rate</label>
                        <input
                            type="text"
                            value={service.hourlyRate}
                            onChange={(e) => onChange(index, 'hourlyRate', e.target.value)}
                            className="h-[42px] w-full bg-[#EEEEEE] border rounded-[6px] text-[16px] border-[#BBBBBB] mt-[12px] px-2 
             appearance-none [&::-webkit-inner-spin-button]:appearance-none 
             [&::-webkit-outer-spin-button]:appearance-none"
                        />

                        <div className="absolute top-[42px] right-2 flex flex-col items-center gap-[3px]">
                            <button
                                type="button"
                                onClick={() =>
                                    onChange(index, 'hourlyRate', (parseFloat(service.hourlyRate?.toString() || '0') + 1).toFixed(2))
                                }
                            >
                                <ArrowUp />
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    onChange(index, 'hourlyRate', Math.max(0, parseFloat(service.hourlyRate?.toString() || '0') - 1).toFixed(2))
                                }
                            >
                                <ArrowDown />
                            </button>
                        </div>

                    </div>

                    <div className="relative w-full">
                        <label className="block text-sm font-normal">Time Needed</label>
                        <Select
                            value={service.timeNeeded?.toString() ?? ""}
                            onValueChange={(value) => onChange(index, 'timeNeeded', value)}
                        >
                            <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[10px] flex items-center justify-between px-3 [&>svg]:hidden [&>span.custom-arrow>svg]:block">
                                <SelectValue placeholder="Select Time" />
                            </SelectTrigger>

                            <SelectContent>
                                {timeNeededOptions.map((option, index) => (
                                    <SelectItem key={index} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="absolute top-[42px] right-2 flex flex-col items-center gap-[3px]">
                            <button type="button" disabled><ArrowUp /></button>
                            <button type="button" disabled><ArrowDown /></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceItem;
