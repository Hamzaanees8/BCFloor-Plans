import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useState, useEffect } from 'react'
import { useFileManagerContext } from "../FileManagerContext";
import { CheckIcon } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { useAppContext } from "@/app/context/AppContext";
import { Order } from '../../orders/page';

const TourMatterport = ({ orderData }: { orderData: Order | null }) => {
    const { userType } = useAppContext();
    const { links, setLinks, filesData, tourSettings } = useFileManagerContext();
    const isUnpaidAgent = userType === 'agent' && !(orderData?.payment_status === 'PAID' || orderData?.services.find(s => s.service.name.toLowerCase().includes('matterport') || s.service.name.toLowerCase().includes('3d tour'))?.payment_status === 'PAID');
    const [isBrandedChecked, setIsBrandedChecked] = useState(false);
    const [isUnbrandedChecked, setIsUnbrandedChecked] = useState(false);

    useEffect(() => {
        if (filesData?.links && links.length === 0) {
            const apiLinks = filesData.links
                .filter(l => !l.is_hidden && l.link)
                .map(l => ({
                    uuid: l.uuid,
                    type: l.type as "branded" | "unbranded",
                    service_id: typeof l.service_id === 'string' ? l.service_id : (l.service?.uuid || String(l.service_id)),
                    link: l.link,
                    expiry_date: l.expiry_date
                }));
            
            const uniqueLinks: typeof apiLinks = [];
            const seen = new Set();
            for (const l of apiLinks) {
                const key = `${l.type}-${l.link}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueLinks.push(l);
                }
            }
            if (uniqueLinks.length > 0) {
                setLinks(uniqueLinks);
            }
        }
    }, [filesData?.links, links.length, setLinks]);

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };
    const brandedLinks = links.filter(l => l.type === 'branded');
    const unbrandedLinks = links.filter(l => l.type === 'unbranded');

    const handleLinkChange = (index: number, value: string) => {
        setLinks(prev => {
            const updated = [...prev];
            const currentExpiry = updated[index].expiry_date;
            
            let newExpiry = currentExpiry;
            if (!currentExpiry && value) {
                if (tourSettings?.enable_matterport_default_expiry) {
                    const days = parseInt(tourSettings.matterport_default_expiry_days) || 90;
                    newExpiry = format(addDays(new Date(), days), "yyyy-MM-dd");
                }
            }
            
            updated[index] = { ...updated[index], link: value, expiry_date: newExpiry };
            return updated;
        });
    };

    const hasLinks = (brandedLinks && brandedLinks.length > 0) || (unbrandedLinks && unbrandedLinks.length > 0);

    return (
        <div className='font-alexandria w-full'>
            {!hasLinks && (
                userType === 'agent' ? (
                    <div className="font-alexandria w-full h-[50vh] text-[#E06D5E] flex justify-center items-center font-[500] text-[18px]">
                        <p>Vendor has not added any Matterport links yet.</p>
                    </div>
                ) : (
                    <div className="font-alexandria w-full h-[50vh] text-gray-500 flex justify-center items-center">
                        <p>No Matterport links found — please add links or select a Matterport service.</p>
                    </div>
                )
            )}
            <div className={!hasLinks ? 'hidden' : ''} style={{ display: !hasLinks ? 'none' : undefined }}>
            {!isUnpaidAgent && (
            <div className='flex flex-col items-center justify-center gap-y-[38px] my-[42px]'>
                {/* Branded */}
                <div className='flex items-end gap-x-2 md:gap-x-5 w-full max-w-[474px] px-4 md:px-0'>
                    {brandedLinks.length > 0 && (
                        <div className='flex items-end gap-x-2 md:gap-x-5 w-full'>
                            <div className="flex flex-col gap-y-4 w-full">
                                <Label className="text-[16px] text-[#424242]">
                                    3D Tour Link - Branded
                                </Label>
                                {brandedLinks.map((link, idx) => (
                                    <Input
                                        key={`branded-${idx}`}
                                        className="w-full h-[42px] text-[#666666] border border-[#8E8E8E]"
                                        value={link.link}
                                        onChange={e => handleLinkChange(links.indexOf(link), e.target.value)}
                                    />
                                ))}
                            </div>
                            <div
                                onClick={() => setIsBrandedChecked(prev => !prev)}
                                className={`w-8 h-8 border-2 rounded-[6px] mb-1.5 flex items-center justify-center cursor-pointer transition-colors
                ${isBrandedChecked ? 'bg-[#6BAE41] border-[#6BAE41]' : 'bg-white border-[#7D7D7D]'}`}
                            >
                                {isBrandedChecked && <CheckIcon className='text-[#FFFFFF] w-4 h-4' />}
                            </div>
                        </div>
                    )}
                </div>

                {/* Unbranded */}
                <div className='flex items-end gap-x-2 md:gap-x-5 w-full max-w-[474px] px-4 md:px-0'>
                    {unbrandedLinks.length > 0 && (
                        <div className='flex items-end gap-x-2 md:gap-x-5 w-full'>
                            <div className="flex flex-col gap-y-4 w-full">
                                <Label className="text-[16px] text-[#424242]">
                                    3D Tour Link - Unbranded
                                </Label>
                                {unbrandedLinks.map((link, idx) => (
                                    <Input
                                        key={`unbranded-${idx}`}
                                        className="w-full h-[42px] text-[#666666] border border-[#8E8E8E]"
                                        value={link.link}
                                        onChange={e => handleLinkChange(links.indexOf(link), e.target.value)}
                                    />
                                ))}
                            </div>

                            {/* ✅ Unbranded Checkbox */}
                            <div
                                onClick={() => setIsUnbrandedChecked(prev => !prev)}
                                className={`w-8 h-8 border border-[#6BAE41] rounded-[6px] mb-1.5 flex items-center justify-center cursor-pointer transition-colors
                ${isUnbrandedChecked ? 'bg-[#6BAE41] border-[#6BAE41]' : 'bg-white border-[#7D7D7D]'}`}
                            >
                                {isUnbrandedChecked && <CheckIcon className='text-[#FFFFFF] w-4 h-4' />}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            )}
            <div className='w-full'>
                <Accordion type="single" collapsible className="w-full">
                    {brandedLinks.some(l => isValidUrl(l.link)) && (
                        <AccordionItem value="Preview-Branded">
                            <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[15px] md:text-[18px] font-[600] uppercase [&>svg]:text-current [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`} style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>
                                Matterport Preview-Branded
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="w-full flex flex-col items-center gap-[20px] py-[30px] ">
                                    {isUnpaidAgent ? (
                                        <div className="w-[90%] md:w-[80%] bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded text-center">
                                            You have not paid for this service yet. Pay the service to visit/view Matterport.
                                        </div>
                                    ) : (
                                        brandedLinks.map(
                                            (link, idx) =>
                                                isValidUrl(link.link) && (
                                                    <div key={`preview-branded-${idx}`} className="relative w-full px-4 md:px-0 md:w-[80%] h-[300px] md:h-[500px]">
                                                        <iframe
                                                            src={link.link}
                                                            className="w-full h-full border"
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                )
                                        )
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    {unbrandedLinks.some(l => isValidUrl(l.link)) && (
                        <AccordionItem value="Preview-Unbranded">
                            <AccordionTrigger className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[15px] md:text-[18px] font-[600] uppercase [&>svg]:text-current [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`} style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>
                                Matterport Preview-Unbranded
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="w-full flex flex-col items-center gap-[20px] py-[30px] ">
                                    {isUnpaidAgent ? (
                                        <div className="w-[90%] md:w-[80%] bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded text-center">
                                            You have not paid for this service yet. Pay the service to visit/view Matterport.
                                        </div>
                                    ) : (
                                        unbrandedLinks.map(
                                            (link, idx) =>
                                                isValidUrl(link.link) && (
                                                    <div key={`preview-unbranded-${idx}`} className="relative w-full px-4 md:px-0 md:w-[80%] h-[300px] md:h-[500px]">
                                                        <iframe
                                                            src={link.link}
                                                            className="w-full h-full border"
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                )
                                        )
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    {brandedLinks.every(l => !isValidUrl(l.link)) && unbrandedLinks.every(l => !isValidUrl(l.link)) && (
                        <div className="w-full flex justify-center py-8">
                            <p className="text-gray-500">Enter a valid link to preview the 3D tour</p>
                        </div>
                    )}
                </Accordion>
            </div>
        </div>
            </div>
    )
}

export default TourMatterport