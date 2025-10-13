// components/ServiceItem.jsx
import { useState } from "react";
import { ChevronDownIcon, DropDownArrow } from "./Icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface ProductOption {
    uuid: string;
    title: string;
    cost?: number;
    adjustment_time?: string;
}

interface ServiceItemProps {
    service: {
        serviceId: string;
        product_options: ProductOption[];
        optionPrices: { [key: string]: number };
        optionTimes: { [key: string]: string };
    }
    servicesData: { uuid: string; name?: string }[];
    index: number;
    onChange: (
        index: number,
        field: 'serviceId' | 'optionPrices' | 'optionTimes',
        value: string | { [key: string]: number } | { [key: string]: string }
    ) => void;
    onRemove: (index: number) => void;
}

const ServiceItem = ({ service, servicesData, index, onChange }: ServiceItemProps) => {
    const [showTimeFields, setShowTimeFields] = useState(false);

    const timeNeededOptions = [
        'no adjustment',
        '5 Minutes less',
        '10 Minutes less',
        '15 Minutes less',
        '30 Minutes less',
        '45 Minutes less',
    ];

    const handleOptionPriceChange = (optionUuid: string, price: string) => {
        const numericPrice = price === '' ? 0 : Number(price);
        const updatedPrices = {
            ...service.optionPrices,
            [optionUuid]: numericPrice
        };
        onChange(index, 'optionPrices', updatedPrices);
    };

    const handleTimeAdjustmentChange = (optionUuid: string, adjustment: string) => {
        const updatedTimes = {
            ...service.optionTimes,
            [optionUuid]: adjustment
        };
        onChange(index, 'optionTimes', updatedTimes);
    };

    const serviceName = servicesData.find((s) => s.uuid === service.serviceId)?.name || "Unknown Service";

    return (
        <div className=" p-4  w-[450px] text-[#666] font-alexandria">
            <label htmlFor="serviceName" className="block text-sm font-normal mb-2">
                Service Name <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center justify-between mb-3">

                <div className="flex items-center justify-between gap-3 w-full">

                    <span className="w-[400px] border border-[#BBBBBB] rounded-[8px] h-[42px] bg-[#EEEEEE] flex items-center pl-2 ">{serviceName}</span>
                    <button
                        type="button"
                        onClick={() => setShowTimeFields(!showTimeFields)}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        {showTimeFields ? <ChevronDownIcon /> : <DropDownArrow />}
                    </button>
                </div>
                {/* <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                >
                    Remove
                </button> */}
            </div>

            {showTimeFields && service.product_options && service.product_options.length > 0 && (
                <div className="space-y-3">
                    <Accordion type="single" collapsible className="space-y-3">
                        {service.product_options.map((option) => (
                            <AccordionItem key={option.uuid} value={option.uuid}>
                                <AccordionTrigger className="flex justify-between items-center px-3 py-2 ">
                                    <span className="font-medium text-sm">{option.title}</span>

                                </AccordionTrigger>

                                <AccordionContent className="p-4 text-[#666]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <Label htmlFor={`price-${option.uuid}`} className="block text-sm font-normal mb-1">
                                                Package Amount<span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id={`price-${option.uuid}`}
                                                type="number"
                                                inputMode="decimal"
                                                placeholder="Enter price"
                                                value={service.optionPrices?.[option.uuid] || ''}
                                                onChange={(e) => handleOptionPriceChange(option.uuid, e.target.value)}
                                                className="h-[42px] w-full bg-[#EEEEEE] border text-[16px] border-[#BBBBBB] mt-[12px] placeholder:text-[#9ca3af]"

                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor={`time-${option.uuid}`} className="block text-sm font-normal mb-1">
                                                Time Adjustment <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={service.optionTimes?.[option.uuid] || 'no adjustment'}
                                                onValueChange={(value) => handleTimeAdjustmentChange(option.uuid, value)}
                                            >
                                                <SelectTrigger className="h-[42px] w-full bg-[#EEEEEE] border text-[16px] border-[#BBBBBB] mt-[12px] placeholder:text-[#9ca3af]">
                                                    <SelectValue placeholder="Select Time Adjustment" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {timeNeededOptions.map((opt, idx) => (
                                                        <SelectItem key={idx} value={opt}>
                                                            {opt}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                </div>
            )}

            {showTimeFields && (!service.product_options || service.product_options.length === 0) && (
                <div className="text-center py-4 text-gray-500">
                    No product options available for this service
                </div>
            )}
        </div>
    );
};

export default ServiceItem;