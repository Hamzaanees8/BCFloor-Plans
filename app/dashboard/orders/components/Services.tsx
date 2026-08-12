import React, { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import PricingCard from './PricingCard'
import PackageCard from './PackageCard'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Services, Packages } from '../../services/page'
import { useOrderContext } from '../context/OrderContext'
import { useAppContext } from '@/app/context/AppContext'
import { useWhiteLabel } from '@/app/context/Whitelabel'
import { Listings } from '@/lib/types'
import { useSearchParams, useParams } from 'next/navigation'
import { isSqFtInRange } from '@/lib/pricingUtils'



export interface SelectedService {
    title?: string;
    id?: string;
    uuid?: string;
    service_uuid?: string;
    price?: number;
    custom?: string;
    quantity?: number;
    option_id?: string;
    optionName?: string;
    payment_status?: string;
    is_completed?: boolean | number;
}






const PricingCardSkeleton = () => (
    <div className="w-full h-[190px] border-[#BBBBBB] bg-[#f5f5f5] border-2 rounded-[6px] px-2 py-4">
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
    const searchParams = useSearchParams();
    const params = useParams();
    const isEdit = searchParams.get('isEdit') === 'true';
    const userId = params?.id as string;
    const isAddFlow = !!userId && !isEdit;

    const {
        selectedServices,
        setSelectedServices,
        selectedOptions,
        setSelectedOptions,
        selectedListingId,
        servicesData: contextServicesData,
        listingsData: contextListingsData,
        packagesData,
        activePackage,
        setActivePackage,
        tempPropertyData,
        setTempPropertyData,
        isBookNowMode
    } = useOrderContext();

    const { userType } = useAppContext()
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string)?.toLowerCase() || (isBookNowMode ? 'agent' : 'admin');
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const headerBg = `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`;
    const fieldBg = `color-mix(in srgb, ${roleSettings.pageBg} 95%, black)`;
    const fieldBorder = `color-mix(in srgb, ${roleSettings.pageBg} 80%, black)`;

    // const [selected, setSelected] = React.useState('Alphabetically')
    const [servicesData, setServicesData] = useState<Services[]>([]);
    const [accordionDefaults, setAccordionDefaults] = useState<string[]>([]);
    const [listingData, setListingData] = useState<Listings | undefined>(undefined);

    const handleSelectPackage = (pkg: Packages) => {
        const isCurrentActive = activePackage?.id === pkg.id || (!!activePackage?.uuid && activePackage.uuid === pkg.uuid);

        if (isCurrentActive) {
            setActivePackage(null);
            const pkgServiceUuids = new Set(
                (pkg.services || [])
                    .map(pkgS => {
                        const fullS = contextServicesData.find(s => 
                            (pkgS.uuid && s.uuid === pkgS.uuid) || 
                            (pkgS.id && (s.id === pkgS.id || String(s.id) === String(pkgS.id)))
                        );
                        return fullS?.uuid || pkgS.uuid;
                    })
                    .filter(Boolean) as string[]
            );
            setSelectedServices(prev => prev.filter(s => s.uuid ? !pkgServiceUuids.has(s.uuid) : true));
            return;
        }

        const sqft = tempPropertyData?.square_footage || listingData?.square_footage || 0;

        const newSelectedServices: SelectedService[] = [];
        const newSelectedOptions: Record<string, string> = { ...selectedOptions };

        (pkg.services || []).forEach((pkgService) => {
            const fullService = contextServicesData.find((s: Services) => 
                (pkgService.uuid && s.uuid === pkgService.uuid) ||
                (pkgService.id && (s.id === pkgService.id || String(s.id) === String(pkgService.id))) ||
                (pkgService.uuid && s.id && String(s.id) === String(pkgService.uuid))
            ) || pkgService;

            const targetUuid = fullService.uuid || pkgService.uuid;
            if (!targetUuid) return;

            const options = fullService.product_options || pkgService.product_options || [];

            let matchedOption = options.length > 0 ? options[0] : null;

            if (options.length > 0 && sqft > 0) {
                const inRangeOption = options.find((opt) => {
                    if (opt.sq_ft_range && typeof opt.sq_ft_range === 'string' && opt.sq_ft_range.trim() !== '') {
                        return isSqFtInRange(opt.sq_ft_range, sqft);
                    }
                    return false;
                });
                if (inRangeOption) {
                    matchedOption = inRangeOption;
                } else {
                    const rateOption = options.find(opt => opt.sq_ft_rate && parseFloat(opt.sq_ft_rate) > 0);
                    if (rateOption) {
                        matchedOption = rateOption;
                    }
                }
            }

            let price = 0;
            let quantity = 1;
            let option_id: string | undefined = undefined;
            let optionName = '';

            if (matchedOption) {
                if (
                    (!matchedOption.sq_ft_range || String(matchedOption.sq_ft_range).trim() === '') &&
                    matchedOption.sq_ft_rate &&
                    parseFloat(matchedOption.sq_ft_rate) > 0 &&
                    sqft > 0
                ) {
                    const calculated = parseFloat(matchedOption.sq_ft_rate) * sqft;
                    price = matchedOption.min_price ? Math.max(calculated, matchedOption.min_price) : calculated;
                } else {
                    price = matchedOption.amount ?? 0;
                }
                quantity = matchedOption.quantity || 1;
                option_id = matchedOption.uuid;
                optionName = matchedOption.title || '';

                newSelectedOptions[targetUuid] = matchedOption.title || '';
            }

            newSelectedServices.push({
                uuid: targetUuid,
                id: String(fullService.id || pkgService.id || ''),
                title: fullService.name || pkgService.name || '',
                price: price,
                quantity: quantity,
                option_id: option_id,
                optionName: optionName,
            });
        });

        setSelectedOptions(newSelectedOptions);
        setSelectedServices(newSelectedServices);
        setActivePackage(pkg);
    };

    useEffect(() => {
        const selectedIds = selectedServices.map(s => s.uuid).filter(Boolean) as string[];

        const createCountMap = (arr: string[]) => arr.reduce<Record<string, number>>((acc, id) => {
            acc[id] = (acc[id] || 0) + 1;
            return acc;
        }, {});

        const selectedCount = createCountMap(selectedIds);

        let foundPackage = null;

        for (const pkg of packagesData) {
            const pkgServiceIds = (pkg.services || []).map(pkgS => {
                const fullS = contextServicesData.find(s => 
                    (pkgS.uuid && s.uuid === pkgS.uuid) || 
                    (pkgS.id && (s.id === pkgS.id || String(s.id) === String(pkgS.id)))
                );
                return fullS?.uuid || pkgS.uuid;
            }).filter(Boolean) as string[];
            if (pkgServiceIds.length === 0) continue;

            const pkgCount = createCountMap(pkgServiceIds);

            const hasExactServices = Object.keys(pkgCount).every((uuid) => {
                return selectedCount[uuid] === pkgCount[uuid];
            }) && Object.keys(selectedCount).every((uuid) => pkgCount[uuid] === selectedCount[uuid]);

            if (hasExactServices) {
                foundPackage = pkg;
                break;
            }
        }

        setActivePackage(foundPackage);
    }, [selectedServices, packagesData, contextServicesData, setActivePackage]);

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

            // const name = service.name?.toLowerCase() || '';
            // const cat = service.category?.name?.toLowerCase() || '';
            // const keywords = ['photo', 'twilight', 'hdr', 'still', 'drone', 'video', 'pano', 'matterport'];
            // const isPhotoService = keywords.some(k => name.includes(k) || cat.includes(k));

            // Prioritize tempPropertyData from the form over existing listing data
            const sqft = tempPropertyData?.square_footage || listingData?.square_footage;

            // If no sqft, show all services
            if (!sqft) return true;

            // Always show the service card — if no tier matches the entered sqft, the
            // PricingCard component will display a "no tier match" info message and
            // auto-select the custom option. Hiding the card here prevents the user
            // from being able to add the service at all.
            return true;
        });

        const finalData = (showAll ? fetched : filteredServices).filter((service: Services) => {
            const name = service.name?.toLowerCase() || '';
            return name !== 'feature sheets';
        });
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

    const displayedServices = isAddFlow ? selectedServices.filter(s => !s.service_uuid) : selectedServices;

    const rawTotalPrice = displayedServices?.reduce((total, service) => {
        if (service.payment_status?.toUpperCase() === 'PAID') return total;
        return total + (Number(service.price) || 0);
    }, 0);

    const discount = activePackage
        ? rawTotalPrice * ((activePackage.discount || 0) / 100)
        : 0;

    const totalPrice = rawTotalPrice - discount;

    return (
        <div className='px-[10px] flex flex-col gap-[15px] font-alexandria mt-[20px]'>

            {/* Packages Carousel Section (Positioned above Square Footage field - Full Width) */}
            {packagesData && packagesData.filter(p => p.status !== false).length > 0 && (
                <div className="w-full space-y-2 mt-[10px]">
                    <h2
                        className="text-[15px] font-[600] px-3 py-1.5 rounded-md"
                        style={{ color: roleSettings.pageTabColor, backgroundColor: fieldBg }}
                    >
                        Packages
                    </h2>
                    <div className="relative px-2">
                        <Carousel
                            opts={{
                                align: 'start',
                                loop: false,
                            }}
                            className="w-full"
                        >
                            <CarouselContent className="-ml-2">
                                {packagesData
                                    .filter(pkg => pkg.status !== false)
                                    .map((pkg) => {
                                        const isSelected = activePackage?.id === pkg.id || (!!activePackage?.uuid && activePackage.uuid === pkg.uuid);
                                        return (
                                            <CarouselItem
                                                key={pkg.uuid || pkg.id}
                                                className="pl-2 basis-full sm:basis-1/2 md:basis-1/4"
                                            >
                                                <PackageCard
                                                    pkg={pkg}
                                                    isSelected={isSelected}
                                                    onSelect={() => handleSelectPackage(pkg)}
                                                />
                                            </CarouselItem>
                                        );
                                    })}
                            </CarouselContent>
                            {packagesData.filter(p => p.status !== false).length > 4 && (
                                <>
                                    <CarouselPrevious className="-left-3 h-7 w-7 border-gray-300 shadow-sm" />
                                    <CarouselNext className="-right-3 h-7 w-7 border-gray-300 shadow-sm" />
                                </>
                            )}
                        </Carousel>
                    </div>
                </div>
            )}

            {!selectedListingId && (
                <div className='flex gap-[12px] items-center py-[10px]'>
                    <div className='flex flex-col gap-2'>
                        <label className='text-[14px] font-[500]' style={{ color: roleSettings.pageText }}>Square Footage</label>
                        <div className='relative w-[280px]'>
                            <input
                                type="number"
                                value={tempPropertyData?.square_footage || listingData?.square_footage || ''}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setTempPropertyData((prev) => {
                                        if (!prev && !listingData) return {
                                            square_footage: val,
                                            // minimal required fields to satisfy type, though usually this would be populated
                                            listing_price: 0,
                                            mls_number: '',
                                            bedrooms: 0,
                                            bathrooms: 0,
                                            agent_id: '',
                                            lot_size: '',
                                            year_constructed: 0,
                                            parking_spots: 0,
                                            property_type: '',
                                            property_status: '',
                                            heading: '',
                                            description: '',
                                            suite: '',
                                            address: '',
                                            city: '',
                                            province: '',
                                            postal_code: '',
                                            country: '',
                                        };

                                        return {
                                            ...prev!,
                                            square_footage: val
                                        };
                                    });
                                }}
                                className='w-full h-[42px] pl-3 pr-12 border-[1px] border-[#BBBBBB] rounded-md focus:outline-none focus:ring-1 focus:ring-black'
                                style={{ backgroundColor: fieldBg, color: roleSettings.pageText }}
                                placeholder="Square Footage"
                            />
                            <span
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none select-none font-[500]'
                                style={{ color: 'color-mix(in srgb, currentColor 60%, transparent)' }}
                            >
                                Sqft.
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className='flex flex-col lg:flex-row gap-5'>
                <div className="w-full md:w-[70%] space-y-4">
                    {accordionDefaults.length > 0 && groupedByCategory ? (
                        <Accordion
                            type="multiple"
                            defaultValue={Object.keys(groupedByCategory).map((_, idx) => `group-${idx}`)}
                            className='w-full'
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
                                        <AccordionTrigger
                                            className='text-[18px] font-[600] px-4 py-3 my-2 rounded-lg border-none transition-colors decoration-transparent hover:no-underline'
                                            style={{ color: roleSettings.pageTabColor, backgroundColor: fieldBg }}
                                        >
                                            {category}
                                        </AccordionTrigger>
                                        <AccordionContent className="border-none">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-[10px]">
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
                        <div className="w-full space-y-8 mt-4">
                            {[1, 2, 3].map((groupIndex) => (
                                <div key={groupIndex} className="space-y-4">
                                    <Skeleton className="h-8 w-48 mb-4 ml-2 bg-gray-200" />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map((cardIndex) => (
                                            <PricingCardSkeleton key={cardIndex} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

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
                <div className="hidden lg:block w-full lg:w-[40%] relative" style={{ color: roleSettings.pageText }}>
                    <div className="rounded-[8px] p-4 border shadow-md py-[40px] sticky top-[160px]" style={{ backgroundColor: headerBg, borderColor: fieldBorder }}>
                        <h2 className=" font-[600] mb-4 text-[24px]" style={{ color: roleSettings.pageTabColor }}>Order</h2>

                        <div className="space-y-[12px] text-[15px] text-[#666666]">
                            <div className="flex justify-between">
                                <span className="text-[#888] text-[10px] font-[700]">Services</span>
                            </div>
                            {displayedServices.map((service, idx) => (
                                <div key={idx} className="flex justify-between">
                                    <div className="flex items-center gap-x-3">
                                        <div className="flex flex-col">
                                            <span title={service.title + ' - ' + service.optionName} className='max-w-[200px] truncate cursor-pointer'>
                                                {service.title} - <span className='text-xs'>{service.optionName}</span>
                                            </span>
                                            {service.quantity && service.quantity > 0 && (
                                                <span className='text-[10px] text-[#888] font-[500]'>Qty: {service.quantity}</span>
                                            )}
                                        </div>
                                        {(isEdit || isAddFlow) && service.payment_status && service.service_uuid && (
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm ${service.payment_status.toUpperCase() === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {service.payment_status}
                                            </span>
                                        )}
                                    </div>
                                    <span>$ {Number(service.price).toFixed(2)}</span>
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
                                <div className='w-2/3'>
                                    <hr className="my-2 h-[2px] justify-self-end" style={{ backgroundColor: roleSettings.pageTabColor, opacity: 0.3 }} />
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
                                        <span>Order/Quote approx:</span>
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