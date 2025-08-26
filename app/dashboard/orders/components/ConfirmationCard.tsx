import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check } from "lucide-react";
import { useOrderContext } from "../context/OrderContext";
import { Services } from "../../services/page";
import { SelectedService } from "./Services";
import React from "react";

interface ConfirmationCardProps {
    title: string;
    service: Services;
    selectedService: SelectedService;
    slotInfo?: {
        vendorName: string;
        timeRanges: string[];
    }[];
}

export default function ConfirmationCard({ title, service, selectedService, slotInfo }: ConfirmationCardProps) {
    const {
        selectedOptions,
        customPrices,
        customServiceNames,
        selectedSlots,
    } = useOrderContext();
    const selectedOption = selectedOptions[service.uuid] || "";
    const customPrice = customPrices[service.uuid] || "";
    const customServiceName = customServiceNames[service.uuid] || "";

    const isCustom = selectedOption === "custom";
    const numericPrice = Number(selectedService.price);
    console.log('slots', selectedSlots)
    console.log('selected option', selectedOptions)
    return (
        <Card className="!w-full h-fit border-[#6BAE41] mt-[22px] bg-[#f5f5f5] border-2 rounded-[6px] px-2 py-4 text-[#333] gap-2">
            <CardContent className="p-0">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex justify-between gap-2 w-full items-center">
                        <div className="bg-[#6BAE41] p-1 w-6 h-6 flex justify-center items-center rounded-md">
                            <Check className="text-white w-[20px] h-[20px]" />
                        </div>
                        <div className="text-[16px] font-normal text-[#424242] text-center">
                            <p>{title}{isCustom && (<span>: Custom</span>)}</p>
                        </div>
                        <div className="text-[20px] font-[500] text-[#6BAE41]">
                            {!isNaN(numericPrice) ? `$${numericPrice.toFixed(2)}` : "$0.00"}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    {slotInfo?.map((info, idx) => (
                        <div key={idx} className="flex flex-col mb-2">
                            <p className="text-[#666666] text-[12px] font-semibold">Vendor: {info.vendorName}</p>
                            {info.timeRanges.map((range, i) => (
                                <p key={i} className="text-[#666666] text-[12px] font-normal">{range}</p>
                            ))}
                        </div>
                    ))}
                </div>
                {service.product_options && service.product_options.length > 0 && (
                    <Accordion type="single" collapsible >
                        <AccordionItem value="pricing" className="border-none">
                            <AccordionTrigger className="text-[14px] font-[400] text-[#8E8E8E] flex justify-between py-1.5">
                                Pricing Options
                            </AccordionTrigger>
                            <AccordionContent className="text-[#666666] text-[12px] font-[400]">
                                <div className="flex flex-col items-center justify-between gap-[10px]">
                                    {service.product_options.map((option, idx) => (
                                        <div
                                            key={idx}
                                            className="w-full flex items-center justify-between"
                                        >
                                            <div
                                                className={`w-[18px] h-[18px] rounded-[3px] border border-gray-400 flex items-center justify-center
                          ${selectedOption === option.title ? "bg-[#4290E9]" : ""}`}
                                            />
                                            <label className="">{option.title}</label>
                                            <span>${Number(option.amount).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-2 text-[#666666] text-[12px] font-[400]">
                                    {isCustom && (
                                        <p>Custom</p>
                                    )}
                                    {isCustom && (
                                        <div className="flex items-center justify-between gap-2 mt-2">
                                            <div
                                                className={`w-[18px] h-[18px] rounded-[3px] border border-gray-400 flex items-center justify-center
                        ${isCustom ? "bg-[#4290E9]" : ""}`}
                                            />
                                            <p className="text-[#666666] text-[12px] font-[400]">
                                                {customServiceName || "N/A"}
                                            </p>
                                            <p className="text-[#666666] text-[12px] font-[400]">
                                                ${customPrice || "0.00"}
                                            </p>
                                        </div>

                                    )}

                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
}
