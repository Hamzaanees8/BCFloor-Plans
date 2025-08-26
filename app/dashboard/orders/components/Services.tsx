import React, { useEffect, useState } from 'react'
import PricingCard from './PricingCard'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Services } from '../../services/page'
import { GetServices } from '../orders'
import { useOrderContext } from '../context/OrderContext'
import { Listings } from '../../listings/page'
import { GetListing } from '../../listings/listing'

export interface SelectedService {
    title?: string;
    id?: string;
    uuid?: string;
    price?: number;
    custom?: string;
    quantity?: number;
    option_id?: string;
    optionName: string;
}
const Services = () => {
    const {
        selectedServices,
        setSelectedServices,
        selectedListingId,
    } = useOrderContext();
    const [selected, setSelected] = React.useState('Alphabetically')
    const [servicesData, setServicesData] = useState<Services[]>([]);
    const [accordionDefaults, setAccordionDefaults] = useState<string[]>([]);
    const [listingData, setListingData] = useState<Listings>();
    console.log(listingData?.square_footage);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("Token not found.");
            return;
        }

        GetServices(token)
            .then((data) => {
                const fetched = Array.isArray(data.data) ? data.data : [];
                console.log('fetched services', fetched);
                // const filteredServices = fetched.filter((service: Services) => service.status !== false);

                const filteredServices = fetched.filter((service: Services) => {
                    if (service.status === false) return false;
                    const hasMatchingOption = service.product_options?.some((option) => {
                        if (!option.sq_ft_range || typeof option.sq_ft_range !== "string") return false;

                        const [minStr, maxStr] = option.sq_ft_range.split("-").map((s) => s.trim());

                        const min = parseInt(minStr, 10);
                        const max = parseInt(maxStr, 10);


                        if (isNaN(min) || isNaN(max)) return false;

                        return (
                            listingData && listingData?.square_footage >= min &&
                            listingData?.square_footage <= max
                        );
                    });

                    return hasMatchingOption;
                });

                setServicesData(filteredServices);

                const grouped = filteredServices.reduce((acc: Record<string, Services[]>, service: Services) => {
                    const category = service.category?.name ?? "";
                    if (!acc[category]) {
                        acc[category] = [];
                    }
                    acc[category].push(service);
                    return acc;
                }, {} as Record<string, Services[]>);

                const defaults = Object.keys(grouped).map((_, idx) => `group-${idx}`);
                setAccordionDefaults(defaults);
            })
            .catch((err) => console.log(err.message));
    }, [listingData]);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("Token not found.");
            return;
        }

        GetListing(token)
            .then((data) => {
                const allListings = Array.isArray(data.data) ? data.data : [];
                const filteredListings = allListings.find(
                    (listing: Listings) => listing.status !== false && listing.uuid === selectedListingId
                );

                setListingData(filteredListings);
            })
            .catch((err) => console.log(err.message));
    }, [selectedListingId]);



    const groupedByCategory = servicesData?.reduce((acc, service) => {
        const category = service.category?.name ?? "";
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(service);
        return acc;
    }, {} as Record<string, Services[]>);

    const totalPrice = selectedServices?.reduce((total, service) => {
        return total + (Number(service.price) || 0);
    }, 0);

    console.log('servicesData', servicesData);
    console.log('selected Service', selectedServices)
    return (
        <div className='px-[10px] flex flex-col gap-[15px] font-alexandria'>

            <div className='flex gap-[12px] items-center mt-[42px] py-[15px]'>
                <label htmlFor="" className='text-[#666666] text-[14px] font-[500]'>Sort By</label>
                <Select
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
                </Select>
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
                            .sort(([catA, servicesA], [catB, servicesB]) => {
                                if (selected === "Alphabetically") {
                                    return catA.localeCompare(catB);
                                } else if (selected === "By Service") {
                                    return servicesB.length - servicesA.length;
                                }
                                return 0;
                            }).map(([category, services], idx) => (
                                <AccordionItem key={idx} value={`group-${idx}`} className="border-none">
                                    <AccordionTrigger className='text-[18px] font-[600] text-[#4290E9] pl-[10px] my-[10px] border-none'>
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
                                                    squareFootage={listingData?.square_footage ?? 0}
                                                />
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                    </Accordion>
                ) : (
                    <div className="w-full text-center text-gray-500">Loading services...</div>)}

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
                <div className="hidden lg:block w-full lg:w-[40%] mt-[85px] text-[#666666]">
                    <div className="bg-white rounded-[8px] p-4 border border-[#BBBBBB] shadow-md py-[40px]">
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
                                        <span>$ {totalPrice.toFixed(2)}</span>
                                    </div>

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