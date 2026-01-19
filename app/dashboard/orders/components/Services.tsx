import React, { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import PricingCard from './PricingCard'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Services } from '../../services/page'
import { useOrderContext } from '../context/OrderContext'
import { Listings } from '../../listings/page'


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

const Services = ({ showAll }: { showAll: boolean }) => {
    const {
        selectedServices,
        setSelectedServices,
        selectedListingId,
        servicesData: contextServicesData,
        listingsData: contextListingsData,
        packagesData,
        activePackage,
        setActivePackage,
        tempPropertyData
    } = useOrderContext();
    // const [selected, setSelected] = React.useState('Alphabetically')
    const [servicesData, setServicesData] = useState<Services[]>([]);
    const [accordionDefaults, setAccordionDefaults] = useState<string[]>([]);
    const [listingData, setListingData] = useState<Listings | undefined>(undefined);

    useEffect(() => {
        const selectedIds = selectedServices.map(s => s.uuid);
        let foundPackage = null;

        for (const pkg of packagesData) {
            const pkgServiceIds = pkg.services.map(s => s.uuid);
            const isMatch =
                pkgServiceIds.length > 0 &&
                pkgServiceIds.length === selectedIds.length &&
                pkgServiceIds.every(id => selectedIds.includes(id));

            if (isMatch) {
                foundPackage = pkg;
                break;
            }
        }
        setActivePackage(foundPackage);
    }, [selectedServices, packagesData, setActivePackage]);

    useEffect(() => {
        const filteredListings = contextListingsData.find(
            (listing: Listings) => listing.status !== false && listing.uuid === selectedListingId
        );
        setListingData(filteredListings);
    }, [contextListingsData, selectedListingId]);

    useEffect(() => {
        const fetched = contextServicesData;

        const filteredServices = fetched.filter((service: Services) => {
            if (service.status === false) return false;

            const isPhotoService = service.name?.toLowerCase().includes('photo') ||
                service.category?.name?.toLowerCase().includes('photo') ||
                service.name?.toLowerCase().includes('twilight') ||
                service.category?.name?.toLowerCase().includes('twilight');

            // Prioritize tempPropertyData from the form over existing listing data
            const sqft = tempPropertyData?.square_footage || listingData?.square_footage;

            // If no sqft, show all services
            if (!sqft) return true;

            const hasMatchingOption = isPhotoService || service.product_options?.some((option) => {
                // If option has sq_ft_rate, it should be shown regardless of range
                if (option.sq_ft_rate && parseFloat(option.sq_ft_rate) > 0) return true;

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

        const finalData = showAll ? fetched : filteredServices;
        setServicesData(finalData);

        const grouped = finalData.reduce((acc: Record<string, Services[]>, service: Services) => {
            const category = service.category?.name ?? "";
            if (!acc[category]) acc[category] = [];
            acc[category].push(service);
            return acc;
        }, {});

        const defaults = Object.keys(grouped).map((_, idx) => `group-${idx}`);
        setAccordionDefaults(defaults);
    }, [contextServicesData, listingData, showAll, tempPropertyData?.square_footage]);

    const groupedByCategory = servicesData?.reduce((acc, service) => {
        const category = service.category?.name ?? "";
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(service);
        return acc;
    }, {} as Record<string, Services[]>);

    const rawTotalPrice = selectedServices?.reduce((total, service) => {
        return total + (Number(service.price) || 0);
    }, 0);

    const discount = activePackage
        ? rawTotalPrice * ((activePackage.discount || 0) / 100)
        : 0;

    const totalPrice = rawTotalPrice - discount;

    return (
        <div className='px-[10px] flex flex-col gap-[15px] font-alexandria'>

            <div className='flex gap-[12px] items-center mt-[42px] py-[15px]'>
                {/* <label htmlFor="" className='text-[#666666] text-[14px] font-[500]'>Sort By</label> */}
                {/* <Select
                    value={selected}
                    onValueChange={(value) => setSelected(value)}
                >
                    <SelectTrigger className="w-[280px] h-[42px] bg-[#EEEEEE] border-[1px] border-[#BBBBBB]">
                        <SelectValue className='text-[#7D7D7D]' />
                    </SelectTrigger>
                    <SelectContent >
                        <SelectItem value="Alphabetically" >Alphabetically</SelectItem>
                        <SelectItem value="By Service">By Service</SelectItem>
                    </SelectContent>
                </Select> */}
            </div>

            <div className='flex gap-5'>
                {accordionDefaults.length > 0 && groupedByCategory ? (
                    <Accordion
                        type="multiple"
                        defaultValue={Object.keys(groupedByCategory).map((_, idx) => `group-${idx}`)}
                        className='w-full md:w-[70%]'
                    >
                        {(
                            Object.entries(groupedByCategory) as [string, Services[]][]
                        )
                            // .sort(([catA, servicesA], [catB, servicesB]) => {
                            //     if (selected === "Alphabetically") {
                            //         return catA.localeCompare(catB);
                            //     } else if (selected === "By Service") {
                            //         return servicesB.length - servicesA.length;
                            //     }
                            //     return 0;
                            // })
                            .map(([category, services], idx) => (
                                <AccordionItem key={idx} value={`group-${idx}`} className="border-none">
                                    <AccordionTrigger className='text-[18px] font-[600] text-[#4290E9] px-4 py-3 my-2 bg-gray-50 hover:bg-gray-100 rounded-lg border-none transition-colors decoration-transparent hover:no-underline'>
                                        {category}
                                    </AccordionTrigger>
                                    <AccordionContent className="border-none">
                                        <div className="grid grid-cols-[repeat(auto-fill,250px)] gap-4 mt-[10px]">
                                            {services.map((service) => (
                                                <PricingCard
                                                    key={service.uuid}
                                                    pricingOptions={service.product_options}
                                                    title={service.name ?? ''}
                                                    selectedServices={selectedServices}
                                                    setSelectedServices={setSelectedServices}
                                                    service={service}
                                                    squareFootage={tempPropertyData?.square_footage || listingData?.square_footage || 0}
                                                    showAll={showAll}
                                                />
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                    </Accordion>
                ) : (
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
                )}

                {/* <Accordion type="multiple" defaultValue={['hdr0', 'hdr', 'hdr1', 'hdr2']} className='w-full md:w-[70%]'>
                    {groupedByCategory &&
                        Object.entries(groupedByCategory).map(([category, services], idx) => (
                            <AccordionItem key={category || idx} value={`group-${idx}`} className="border-none">
                                <AccordionTrigger className='text-[18px] font-[600] text-[#4290E9] pl-[10px] my-[10px] border-none'>
                                    {category}
                                </AccordionTrigger>
                                <AccordionContent className="border-none">
                                    <div className="grid grid-cols-[repeat(auto-fill,250px)] gap-4 mt-[10px]">
                                        {services.map((service) => (
                                            <PricingCard
                                                key={service.id}
                                                pricingOptions={service.pricingOptions}
                                                title={service.name??''}
                                            />
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}

                    <AccordionItem value="hdr" className="border-none">
                        <AccordionTrigger className='text-[18px] font-[600] text-[#4290E9] pl-[10px] my-[10px] border-none'>
                            HDR Photos and Drone
                        </AccordionTrigger>
                        <AccordionContent className="border-none ">
                            <div className="grid grid-cols-[repeat(auto-fill,250px)] mt-[10px] gap-4">
                                <PricingCard pricingOptions={pricingOptions} title='HDR Still Photos' />
                                <PricingCard pricingOptions={pricingOptions} title='HDR Still Photos & Panos' />
                                <PricingCard pricingOptions={pricingOptions} title='HDR Still Photo & Drone' />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="hdr1" className="border-none">
                        <AccordionTrigger className='text-[18px] font-[600] text-[#4290E9] pl-[10px] my-[10px] border-none'>
                            Standard Photos and Drone
                        </AccordionTrigger>
                        <AccordionContent className="border-none">
                            <div className="grid grid-cols-[repeat(auto-fill,250px)] mt-[10px]  gap-4">
                                <PricingCard pricingOptions={pricingOptions} title='Standard Still Photos' />
                                <PricingCard pricingOptions={pricingOptions} title='Standard Still Photos and Panos' />
                                <PricingCard pricingOptions={pricingOptions} title='Standard Still Photos and Panos' />

                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="hdr2" className="border-none">
                        <AccordionTrigger className='text-[18px] font-[600] text-[#4290E9] pl-[10px] my-[10px] border-none'>
                            Twilight Photos and Drone
                        </AccordionTrigger>
                        <AccordionContent className="border-none">
                            <div className="grid grid-cols-[repeat(auto-fill,250px)] mt-[10px]  gap-4">
                                <PricingCard pricingOptions={pricingOptions} title='Twilight HDR Photos' />
                                <PricingCard pricingOptions={pricingOptions} title='Twilight HDR & Drone' />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="hdr2" className="border-none">
                        <AccordionTrigger className='text-[18px] font-[600] text-[#4290E9] pl-[10px] my-[10px] border-none'>
                            Staging
                        </AccordionTrigger>
                        <AccordionContent className="border-none">
                            <div className="grid grid-cols-[repeat(auto-fill,250px)] mt-[10px]  gap-4">
                                <PricingCard title='Consultation' />
                                <PricingCard title='Book a Free Quote' />
                                <PricingCard title='Stage' />
                                <PricingCard pricingOptions={pricingOptions} title='Twilight HDR & Drone' />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion> */}
                <div className="hidden lg:block w-full lg:w-[40%] text-[#666666] relative">
                    <div className="bg-white rounded-[8px] p-4 border border-[#BBBBBB] shadow-md py-[40px] sticky top-[160px]">
                        <h2 className=" font-[600] text-[#333] mb-4 text-[24px]">Order</h2>

                        <div className="space-y-[12px] text-[15px] text-[#666666]">
                            <div className="flex justify-between">
                                <span className="text-[#888] text-[10px] font-[700]">Services</span>
                            </div>
                            {selectedServices.map((service, idx) => (
                                <div key={idx} className="flex justify-between">
                                    <span>{service.title} - <span className='text-xs'>{service.optionName}</span></span>
                                    <span>$ {service.price}</span>
                                </div>
                            ))}


                            {/* <div className="flex justify-between">
                                <span>Feature Sheets</span>
                                <span>$54.00</span>
                            </div>

                            <div className="flex justify-between flex-col">
                                <div className="flex justify-between">
                                    <span>Standard Still Photos</span>
                                    <span>$119.00</span>
                                </div>
                                <span className="text-[12px] text-[#888] pl-2">20 Photos</span>
                            </div> */}

                            <div className='flex justify-end'>
                                <div className='w-1/2'>
                                    <hr className="my-2 w-[70px] h-[2px] bg-[#202020] justify-self-end" />
                                    <div className="flex justify-between font-[500]">
                                        <span>Sub Total:</span>
                                        <span>$ {rawTotalPrice.toFixed(2)}</span>
                                    </div>

                                    {activePackage && (
                                        <>
                                            <div className="flex justify-between text-[11px] text-blue-600 font-[500]">
                                                <span>Package:</span>
                                                <span>{activePackage.name}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px] text-green-600 font-[500]">
                                                <span>Discount ({activePackage.discount}%)</span>
                                                <span>- ${discount.toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}

                                    <div className="flex justify-between text-[11px]">
                                        <span>Taxes</span>
                                        <span>${0}</span>
                                    </div>

                                    <div className="flex justify-between font-[400] text-[15px] my-10">
                                        <span>Total:</span>
                                        <span>${totalPrice.toFixed(2)}</span>
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

export default Services