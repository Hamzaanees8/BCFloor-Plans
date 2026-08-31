import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useState, useEffect, useMemo } from 'react'
import { useFileManagerContext } from "../FileManagerContext";
import { CheckIcon, AlertTriangle, AlertCircle, ShieldCheck, Calendar } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { useAppContext } from "@/app/context/AppContext";
import { Order } from '../../orders/page';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import MatterportRenewModal from "@/components/MatterportRenewModal";
import { MatterportAd, MatterportStatus, MatterportRenewalAction } from "../../matterport/matterport";

const TourMatterport = ({ orderData }: { orderData: Order | null }) => {
    const { userType } = useAppContext();
    const { links, setLinks, filesData, tourSettings } = useFileManagerContext();
    const isUnpaidAgent = userType === 'agent' && !(orderData?.payment_status === 'PAID' || orderData?.services?.find(s => s?.service?.name?.toLowerCase().includes('matterport') || s?.service?.name?.toLowerCase().includes('3d tour'))?.payment_status === 'PAID');
    const [isBrandedChecked, setIsBrandedChecked] = useState(false);
    const [isUnbrandedChecked, setIsUnbrandedChecked] = useState(false);
    const [renewModalOpen, setRenewModalOpen] = useState(false);

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

    // Calculate expiration stats
    const primaryLink = links.find(l => l.expiry_date) || (filesData?.links && filesData.links[0]);
    const expiryDateStr = primaryLink?.expiry_date;

    const { isExpired, isExpiringSoon, daysRemaining, formattedExpiry } = useMemo(() => {
        if (!expiryDateStr) {
            return { isExpired: false, isExpiringSoon: false, daysRemaining: null, formattedExpiry: "N/A" };
        }
        const expiry = new Date(expiryDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const formatted = expiry.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric"
        });

        return {
            isExpired: diffDays < 0,
            isExpiringSoon: diffDays >= 0 && diffDays <= 30,
            daysRemaining: diffDays,
            formattedExpiry: formatted,
        };
    }, [expiryDateStr]);

    // Create MatterportAd object for the renew modal
    const currentTourAd: MatterportAd | null = useMemo(() => {
        if (!orderData && !filesData) return null;
        return {
            tourUuid: filesData?.uuid || orderData?.uuid || "",
            tourId: (filesData as any)?.id || orderData?.id || 0,
            agentName: orderData?.agent ? `${orderData.agent.first_name || ""} ${orderData.agent.last_name || ""}`.trim() : "Agent",
            orderNumber: orderData?.id ? `#${orderData.id}` : "",
            orderuud: orderData?.uuid || "",
            propertyuuid: orderData?.property?.uuid || "",
            address: orderData?.property_address || orderData?.property?.address || "Property",
            reminderDate: "N/A",
            renewalDate: formattedExpiry,
            rawExpiryDate: expiryDateStr || null,
            daysRemaining: daysRemaining,
            status: isExpired ? MatterportStatus.EXPIRED : isExpiringSoon ? MatterportStatus.EXPIRING_SOON : MatterportStatus.ACTIVE,
            renewal: MatterportRenewalAction.RENEW,
        };
    }, [orderData, filesData, formattedExpiry, expiryDateStr, daysRemaining, isExpired, isExpiringSoon]);

    return (
        <div className='font-alexandria w-full'>
            {/* Expiration Status Banner */}
            {hasLinks && expiryDateStr && (
                <div className="mb-6 px-4 md:px-8">
                    {isExpired ? (
                        <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0 mt-0.5">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-red-900">
                                            Matterport 3D Tour Hosting Expired
                                        </h4>
                                        <span className="px-2 py-0.5 rounded-full bg-red-200 text-red-800 text-[10px] font-extrabold">
                                            Expired {daysRemaining !== null ? `${Math.abs(daysRemaining)}d ago` : ""}
                                        </span>
                                    </div>
                                    <p className="text-xs text-red-700 mt-1">
                                        Hosting expired on <strong className="font-semibold">{formattedExpiry}</strong>. The 3D tour tab is hidden from the public tour page until renewed.
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                onClick={() => setRenewModalOpen(true)}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 h-9 rounded-lg shadow-sm flex items-center gap-1.5 shrink-0"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Renew Hosting Now
                            </Button>
                        </div>
                    ) : isExpiringSoon ? (
                        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-amber-900">
                                            Hosting Expiring Soon ({daysRemaining} Days Left)
                                        </h4>
                                        <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-extrabold">
                                            Expires {formattedExpiry}
                                        </span>
                                    </div>
                                    <p className="text-xs text-amber-800 mt-1">
                                        Renew your 3D tour hosting before it expires to prevent interruption on your public listing.
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                onClick={() => setRenewModalOpen(true)}
                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 h-9 rounded-lg shadow-sm flex items-center gap-1.5 shrink-0"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Renew 3D Tour Hosting
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div className="text-xs text-emerald-900">
                                    Matterport 3D Tour Hosting is <strong>Active</strong> until <strong>{formattedExpiry}</strong> ({daysRemaining} days remaining).
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setRenewModalOpen(true)}
                                className="border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold px-3 py-1 h-8 rounded-lg shrink-0"
                            >
                                Extend Hosting
                            </Button>
                        </div>
                    )}
                </div>
            )}

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
            <div className="relative">
                {userType === 'vendor' && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="absolute inset-0 z-10 cursor-default" onPointerDown={(e) => e.preventDefault()} onClick={(e) => e.preventDefault()} />
                        </TooltipTrigger>
                        <TooltipContent>You don&apos;t have permission to change this setting</TooltipContent>
                    </Tooltip>
                )}
                <div className={userType === 'vendor' ? 'pointer-events-none select-none' : ''}>
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

                            {/* Unbranded Checkbox */}
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

        <MatterportRenewModal
            open={renewModalOpen}
            onOpenChange={setRenewModalOpen}
            tourItem={currentTourAd}
            onSuccess={() => {
                window.location.reload();
            }}
            isAgentView={userType === 'agent'}
        />
        </div>
    )
}


export default TourMatterport