import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check } from "lucide-react";
import React from "react";

interface Service {
    uuid: string;
    name: string;
    product_options?: {
        uuid: string;
        title: string;
        amount: string | number;
    }[];
}

interface SelectedService {
    uuid: string;
    title: string;
    price: number;
    payment_status?: string;
}

interface ConfirmationCardProps {
    title: string;
    service: Service;
    selectedService: SelectedService;
    slotInfo?: {
        vendorName: string;
        timeRanges: string[];
    }[];
}

export default function ConfirmationCard({ title, service, selectedService, slotInfo }: ConfirmationCardProps) {
    const numericPrice = Number(selectedService.price);
    return (
        <Card className="!w-full h-fit border-[#6BAE41] mt-[22px] bg-[#f5f5f5] border-2 rounded-[6px] px-2 py-4 text-[#333] gap-2">
            <CardContent className="p-0">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex justify-between gap-2 w-full items-center">
                        <div className="bg-[#6BAE41] p-1 w-6 h-6 flex justify-center items-center rounded-md">
                            <Check className="text-white w-[20px] h-[20px]" />
                        </div>
                        <div className="text-[16px] font-normal text-[#424242] text-center">
                            <p>{title}</p>
                        </div>
                        <div className="text-[20px] font-[500] text-[#6BAE41]">
                            {!isNaN(numericPrice) ? `$${numericPrice.toFixed(2)}` : "$0.00"}
                        </div>
                    </div>
                </div>
                <div className="flex items-start justify-between">
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
                    {selectedService.payment_status?.toUpperCase() === 'PAID' && (
                        <span className="text-[10px] bg-[#6BAE41] text-white px-2 py-0.5 rounded-full font-semibold uppercase border border-green-200">
                            Already Paid
                        </span>
                    )}
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
                                            <div className="w-[18px] h-[18px] rounded-[3px] border border-gray-400 flex items-center justify-center bg-[#4290E9]" />
                                            <label>{option.title}</label>
                                            <span>${Number(option.amount).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
}
