"use client";
import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Services } from "@/app/dashboard/services/page";

interface ServicesSelectorProps {
    servicesData: Services[] | null;
    services: string[];
    setServices: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function ServicesSelector({
    servicesData,
    services,
    setServices,
}: ServicesSelectorProps) {
    const [selectedService, setSelectedService] = useState<string>("");

    const handleAdd = () => {
        if (selectedService && !services.includes(selectedService)) {
            setServices((prev) => [...prev, selectedService]);
        }
        setSelectedService("");
    };

    const handleRemove = (service: string) => {
        setServices((prev) => prev.filter((s) => s !== service));
    };

    const getServiceName = (uuid: string) => {
        return servicesData?.find((s) => s.uuid === uuid)?.name || uuid;
    };

    return (
        <div className="w-full space-y-4">
            {/* Select + Add button */}
            <div className="flex items mt-[12px]">
                <Select
                    value={selectedService}
                    onValueChange={(val) => setSelectedService(val)}
                >
                    <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border rounded-r-none border-[#BBBBBB]">
                        <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                        {servicesData?.map((service) => (
                            <SelectItem key={service.uuid} value={service.uuid ?? ""}>
                                {service.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button className="h-[42px] bg-[#EEEEEE] rounded-l-none border border-[#888787] !text-[#323232] flex justify-center items-center" onClick={handleAdd} disabled={!selectedService}>
                    Add
                </Button>
            </div>

            <div className="w-full min-h-[200px] p-2 border rounded-md flex flex-wrap items-start content-start gap-2 bg-gray-50">
                {services.length === 0 && (
                    <p className="text-gray-400 text-sm">No services added</p>
                )}
                {services.map((service) => (
                    <span
                        key={service}
                        className="flex items-center gap-1 bg-gray-200 px-3 py-1 rounded-full h-[30px] text-sm"
                    >
                        {getServiceName(service)}
                        <button
                            onClick={() => handleRemove(service)}
                            className="text-[#E06D5E] hover:text-red-700"
                        >
                            <X size={14} />
                        </button>
                    </span>
                ))}
            </div>

        </div>
    );
}
