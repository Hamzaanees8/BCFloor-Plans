'use client';

import React, { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import PricingCard from './PricingCard'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { Services } from '@/app/dashboard/services/page'
import { useBookNowContext } from '../context/BookNowContext'
import { fetchServicesForBookNow } from '../book-now'

export interface SelectedService {
    title?: string;
    id?: string;
    uuid?: string;
    service_uuid?: string;
    price?: number;
    custom?: string;
    quantity?: number;
    option_id?: string;
    optionName: string;
    payment_status?: string;
}

const PricingCardSkeleton = () => (
    <div className="!w-[250px] h-[190px] border-[#BBBBBB] bg-[#f5f5f5] border-2 rounded-[6px] px-2 py-4">
        <div className="flex items-start justify-between mb-2">
            <div className="flex justify-between gap-2 w-full items-center">
                <Skeleton className="w-6 h-6 rounded-md bg-gray-300" />
                <Skeleton className="h-4 w-24 bg-gray-300" />
                <Skeleton className="h-6 w-24 bg-gray-300" />
            </div>
        </div>
        <div className="space-y-2 mt-4">
            <Skeleton className="h-3 w-full bg-gray-300" />
            <Skeleton className="h-3 w-3/4 bg-gray-300" />
            <Skeleton className="h-3 w-1/2 bg-gray-300" />
        </div>
        <div className="flex flex-col justify-start gap-4 mt-4">
            <Skeleton className="h-3 w-[60px] bg-gray-300" />
            <div className="flex gap-4">
                <Skeleton className="h-5 w-[60px] bg-gray-300" />
                <Skeleton className="h-5 flex-1 bg-gray-300" />
                <Skeleton className="h-5 w-[40px] bg-gray-300" />
            </div>
        </div>
    </div>
);

const BookNowServices = ({ showAll = true }: { showAll?: boolean }) => {
    const {
        selectedServices,
        tempPropertyData,
    } = useBookNowContext();

    const [servicesData, setServicesData] = useState<Services[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch services without token on mount
    useEffect(() => {
        const loadServices = async () => {
            try {
                setIsLoading(true);
                const services = await fetchServicesForBookNow();
                setServicesData(services);
            } finally {
                setIsLoading(false);
            }
        };

        loadServices();
    }, []);

    useEffect(() => {
        const filteredServices = servicesData.filter((service: Services) => {
            if (service.status === false) return false;

            const isPhotoService = service.name?.toLowerCase().includes('photo') ||
                service.category?.name?.toLowerCase().includes('photo') ||
                service.name?.toLowerCase().includes('twilight') ||
                service.category?.name?.toLowerCase().includes('twilight');

            const sqft = tempPropertyData?.square_footage;

            if (!sqft) return true;

            const hasMatchingOption = isPhotoService || service.product_options?.some((option) => {
                if (option.sq_ft_rate && parseFloat(String(option.sq_ft_rate)) > 0) return true;

                if (!option.sq_ft_range || typeof option.sq_ft_range !== "string") return false;

                const [minStr, maxStr] = option.sq_ft_range.split("-").map((s) => s.trim());
                const min = parseInt(minStr, 10);
                const max = parseInt(maxStr, 10);

                if (isNaN(min) || isNaN(max)) return false;

                return (
                    sqft >= min &&
                    sqft <= max
                );
            });

            return hasMatchingOption;
        });

        const finalData = showAll ? servicesData : filteredServices;
        setServicesData(finalData);
    }, [servicesData, tempPropertyData?.square_footage, showAll]);

    const groupedByCategory = servicesData?.reduce((acc, service) => {
        const category = service.category?.name ?? "";
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(service);
        return acc;
    }, {} as Record<string, Services[]>);

    const rawTotalPrice = selectedServices?.reduce((total, service) => {
        if (service.payment_status?.toUpperCase() === 'PAID') return total;
        return total + (Number(service.price) || 0);
    }, 0);

    const fieldBg = "#f5f5f5";
    const fieldBorder = "#BBBBBB";
    const pageTabColor = "#4290E9";
    const pageText = "#666666";
    const headerBg = "#f0f7ff";

    return (
        <div className='px-[10px] flex flex-col gap-[15px] font-alexandria'>

            <div className='flex gap-[12px] items-center mt-[42px] py-[15px]'>
                {/* Placeholder for sort controls */}
            </div>

            <div className='flex gap-5'>
                {groupedByCategory && Object.keys(groupedByCategory).length > 0 ? (
                    <Accordion
                        type="multiple"
                        defaultValue={Object.keys(groupedByCategory).map((_, idx) => `group-${idx}`)}
                        className='w-full md:w-[70%]'
                    >
                        {(
                            Object.entries(groupedByCategory) as [string, Services[]][]
                        )
                            .map(([category, services], idx) => (
                                <AccordionItem key={idx} value={`group-${idx}`} className="border-none">
                                    <AccordionTrigger
                                        className='text-[18px] font-[600] px-4 py-3 my-2 rounded-lg border-none transition-colors decoration-transparent hover:no-underline'
                                        style={{ color: pageTabColor, backgroundColor: fieldBg }}
                                    >
                                        {category}
                                    </AccordionTrigger>
                                    <AccordionContent className="border-none">
                                        <div className="grid grid-cols-[repeat(auto-fill,250px)] gap-4 mt-[10px]">
                                            {services.map((service) => (
                                                <PricingCard
                                                    key={service.uuid}
                                                    pricingOptions={service.product_options}
                                                    title={service.name ?? ''}
                                                    service={service}
                                                    squareFootage={tempPropertyData?.square_footage || 0}
                                                    showAll={showAll}
                                                />
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                    </Accordion>
                ) : isLoading ? (
                    <div className="w-full md:w-[70%] space-y-8 mt-4">
                        {[1, 2, 3].map((groupIndex) => (
                            <div key={groupIndex} className="space-y-4">
                                <Skeleton className="h-8 w-48 mb-4 ml-2 bg-gray-200" />
                                <div className="grid grid-cols-[repeat(auto-fill,250px)] gap-4">
                                    {[1, 2, 3, 4].map((cardIndex) => (
                                        <PricingCardSkeleton key={cardIndex} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}

                <div className="hidden lg:block w-full lg:w-[40%] relative" style={{ color: pageText }}>
                    <div className="rounded-[8px] p-4 border shadow-md py-[40px] sticky top-[160px]" style={{ backgroundColor: headerBg, borderColor: fieldBorder }}>
                        <h2 className=" font-[600] mb-4 text-[24px]" style={{ color: pageTabColor }}>Order</h2>

                        <div className="space-y-[12px] text-[15px] text-[#666666]">
                            <div className="flex justify-between">
                                <span className="text-[#888] text-[10px] font-[700]">Services</span>
                            </div>
                            {selectedServices.map((service, idx) => (
                                <div key={idx} className="flex justify-between">
                                    <div className="flex items-center gap-x-3">
                                        <span title={service.title + ' - ' + service.optionName} className='max-w-[200px] truncate cursor-pointer'>{service.title} - <span className='text-xs'>{service.optionName}</span></span>
                                        {service.payment_status && (
                                            <span className={`text-[10px] uppercase font-bold ${service.payment_status === 'PAID' ? 'text-green-600' : 'text-red-500'}`}>
                                                {service.payment_status}
                                            </span>
                                        )}
                                    </div>
                                    <span>$ {service.price}</span>
                                </div>
                            ))}

                            <div className='flex justify-end'>
                                <div className='w-1/2'>
                                    <hr className="my-2 h-[2px] justify-self-end" style={{ backgroundColor: pageTabColor, opacity: 0.3 }} />
                                    <div className="flex justify-between font-[500]">
                                        <span>Sub Total:</span>
                                        <span>$ {rawTotalPrice.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between text-[11px]">
                                        <span>Taxes</span>
                                        <span>${0}</span>
                                    </div>

                                    <div className="flex justify-between font-[400] text-[15px] my-10">
                                        <span>Total:</span>
                                        <span>${rawTotalPrice.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}

export default BookNowServices
