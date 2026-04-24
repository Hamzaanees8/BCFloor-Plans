'use client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Copy, ClipboardCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Services } from '../../services/page';
import { useFileManagerContext } from '../FileManagerContext';
import ManualPayment from './ManualPayment';
import { useAppContext } from '@/app/context/AppContext';
import { Order, OrderService } from '../../orders/page';
import UpgradeServicePopup from './UpgradeServicePopup';
import PayInvoiceModal from './PayInvoiceModal';
import AgentNotificationModal from './AgentNotificationModal';
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ServiceCompletion, HideMediaFiles } from '../file-manager';

function FileTab2({ currentService, orderData, isListing, currentBookedService, onOpenInvoice }: { currentService?: Services, orderData: Order | null, isListing?: boolean, reviewFilesEnabled?: boolean, currentBookedService?: OrderService, onOpenInvoice?: (serviceName?: string) => void }) {
    const { links, setLinks, setPreviewFiles, filesData, setFilesData, isHidingMode, setIsHidingMode, filesToHide, setFilesToHide } = useFileManagerContext();
    const [mediaUploaded, setMediaUploaded] = useState<boolean>(false);
    const [openPayment, setOpenPayment] = useState(false);
    const [, setSuccess] = useState(false);
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [isHidingLoading, setIsHidingLoading] = useState(false);
    const [openUpgrade, setOpenUpgrade] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [copiedField, setCopiedField] = useState<'branded' | 'unbranded' | null>(null);
    const dragCounter = useRef(0);

    const { userType } = useAppContext()

    const handleCopy = (type: 'branded' | 'unbranded', value: string) => {
        if (!value) return;
        navigator.clipboard.writeText(value).then(() => {
            setCopiedField(type);
            setTimeout(() => setCopiedField(null), 2000);
        });
    };

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };


    const brandedLinkObj = links.find(l => l.type === "branded" && l.service_id === currentService?.uuid);
    const brandedLink = brandedLinkObj?.link || "";
    const brandedExpiry = brandedLinkObj?.expiry_date || "";

    const unbrandedLinkObj = links.find(l => l.type === "unbranded" && l.service_id === currentService?.uuid);
    const unbrandedLink = unbrandedLinkObj?.link || "";
    const unbrandedExpiry = unbrandedLinkObj?.expiry_date || "";

    // API data lookups (for sync)
    const brandedApiLinkObj = filesData?.links.find(
        (link) => link.type === "branded" && link.service?.uuid === currentService?.uuid
    );
    const brandedApiLink = brandedApiLinkObj?.link;
    const brandedApiExpiry = brandedApiLinkObj?.expiry_date;
    const brandedApiUuid = brandedApiLinkObj?.uuid;

    const unbrandedApiLinkObj = filesData?.links.find(
        (link) => link.type === "unbranded" && link.service?.uuid === currentService?.uuid
    );
    const unbrandedApiLink = unbrandedApiLinkObj?.link;
    const unbrandedApiExpiry = unbrandedApiLinkObj?.expiry_date;
    const unbrandedApiUuid = unbrandedApiLinkObj?.uuid;

    const bookingToUse = currentBookedService || orderData?.services.find((service) => service.service.uuid === currentService?.uuid)

    const handleAddPayment = (paymentData: any) => {
        console.log("Payment Added:", paymentData);
        setSuccess(true);
    };
    useEffect(() => {
        if (currentService?.uuid) {
            if ((brandedApiLink || brandedApiExpiry) && !brandedApiLinkObj?.is_hidden) {
                setLinks((prev) => {
                    const existingIndex = prev.findIndex(
                        l => l.type === "branded" && l.service_id === currentService.uuid
                    );
                    if (existingIndex >= 0) {
                        const updated = [...prev];
                        updated[existingIndex] = {
                            ...updated[existingIndex],
                            link: brandedApiLink || updated[existingIndex].link,
                            expiry_date: brandedApiExpiry || updated[existingIndex].expiry_date,
                            uuid: brandedApiUuid || updated[existingIndex].uuid
                        };
                        return updated;
                    } else {
                        return [...prev, {
                            type: "branded",
                            service_id: currentService.uuid,
                            link: brandedApiLink || "",
                            expiry_date: brandedApiExpiry || "",
                            uuid: brandedApiUuid
                        }];
                    }
                });
            }

            if ((unbrandedApiLink || unbrandedApiExpiry) && !unbrandedApiLinkObj?.is_hidden) {
                setLinks((prev) => {
                    const existingIndex = prev.findIndex(
                        l => l.type === "unbranded" && l.service_id === currentService.uuid
                    );
                    if (existingIndex >= 0) {
                        const updated = [...prev];
                        updated[existingIndex] = {
                            ...updated[existingIndex],
                            link: unbrandedApiLink || updated[existingIndex].link,
                            expiry_date: unbrandedApiExpiry || updated[existingIndex].expiry_date,
                            uuid: unbrandedApiUuid || updated[existingIndex].uuid
                        };
                        return updated;
                    } else {
                        return [...prev, {
                            type: "unbranded",
                            service_id: currentService.uuid,
                            link: unbrandedApiLink || "",
                            expiry_date: unbrandedApiExpiry || "",
                            uuid: unbrandedApiUuid
                        }];
                    }
                });
            }
        }
    }, [brandedApiLink, brandedApiExpiry, brandedApiUuid, unbrandedApiLink, unbrandedApiExpiry, unbrandedApiUuid, currentService?.uuid, setLinks, brandedApiLinkObj?.is_hidden, unbrandedApiLinkObj?.is_hidden]);



    const handleLinkChange = (type: "branded" | "unbranded", value: string) => {

        setLinks(prev => {
            const existingIndex = prev.findIndex(l => l.type === type && l.service_id === currentService?.uuid);

            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], link: value };
                return updated;
            } else {
                return [...prev, { type, service_id: currentService?.uuid ?? '', link: value }];
            }
        });
    };

    const handleDateChange = (type: "branded" | "unbranded", value: string) => {
        setLinks(prev => {
            const existingIndex = prev.findIndex(l => l.type === type && l.service_id === currentService?.uuid);

            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], expiry_date: value };
                return updated;
            } else {
                return [...prev, { type, service_id: currentService?.uuid ?? '', link: '', expiry_date: value }];
            }
        });
    };


    const handleFilesChange = (selectedFiles: File[]) => {
        if (selectedFiles.length === 0) return;

        const newFiles = selectedFiles.map((f) => ({
            file: f,
            upload: true,
        }));

        setPreviewFiles((prev) => [...prev, ...newFiles]);
    };


    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        dragCounter.current = 0;

        if (userType === 'agent') {
            return;
        }

        const droppedFiles = Array.from(e.dataTransfer?.files || []);

        handleFilesChange(droppedFiles);
        // eslint-disable-next-line
    }, []);

    const handleDragEnter = useCallback((e: DragEvent) => {
        e.preventDefault();
        dragCounter.current += 1;
    }, []);

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        dragCounter.current -= 1;
        if (dragCounter.current === 0) {
        }
    }, []);

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
    }, []);


    useEffect(() => {
        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('drop', handleDrop);
        };
    }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

    useEffect(() => {
        const checkServiceCompletion = async () => {
            const token = localStorage.getItem("token");
            const numberOfbrandedApiLink = brandedApiLink?.length ?? 0
            const numberOfUnbrandedApiLink = unbrandedApiLink?.length ?? 0

            if (numberOfbrandedApiLink >= (bookingToUse?.option?.quantity ?? 1) && numberOfUnbrandedApiLink >= (bookingToUse?.option?.quantity ?? 1)) {
                if (token && bookingToUse?.uuid && orderData?.uuid && !bookingToUse?.is_completed) {
                    await ServiceCompletion(token, bookingToUse.uuid, true, orderData.uuid)
                }
            }
        };
        checkServiceCompletion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unbrandedApiLink, currentService, brandedApiLink, orderData, bookingToUse?.uuid, bookingToUse?.is_completed])


    const handleBatchHide = async () => {
        if (filesToHide.size === 0) {
            setIsHidingMode(false);
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) return;

        setIsHidingLoading(true);
        try {
            await HideMediaFiles(token, Array.from(filesToHide), true);
            toast.success(`${filesToHide.size} item(s) hidden successfully`);

            // Update local state to remove hidden items
            if (filesData) {
                setFilesData({
                    ...filesData,
                    links: filesData.links.filter(l => l.uuid && !filesToHide.has(l.uuid))
                });
            }

            setFilesToHide(new Set());
            setIsHidingMode(false);
        } catch (error) {
            console.error("Error hiding links:", error);
            toast.error("Failed to hide links");
        } finally {
            setIsHidingLoading(false);
        }
    };

    const toggleHideSelection = (uuid: string) => {
        setFilesToHide(prev => {
            const next = new Set(prev);
            if (next.has(uuid)) {
                next.delete(uuid);
            } else {
                next.add(uuid);
            }
            return next;
        });
    };

    return (
        <div className='font-alexandria w-full'>

            {!isListing &&
                <div
                    className='relative h-[66px] w-full flex justify-between items-center px-4 font-alexandria'
                    style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)` }}
                >
                    <div>
                    </div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <p className='flex flex-col items-center pointer-events-auto'>
                            <span className={`${userType}-text font-bold text-[16px]`}>
                                {currentService ? currentService.name : '3D Tour'}
                            </span>
                            <span className='text-[12px] text-[#7D7D7D]'>
                                {bookingToUse?.option?.title ?? '1 Link'}
                            </span>
                        </p>
                    </div>
                    <div className='flex justify-center items-center gap-x-[14px]'>
                        {(userType === 'admin' || userType === 'agent') && (
                            <Button
                                onClick={() => {
                                    if (isHidingMode) {
                                        handleBatchHide();
                                    } else {
                                        setIsHidingMode(true);
                                        setFilesToHide(new Set());
                                    }
                                }}
                                disabled={isHidingLoading}
                                className={`h-[32px] w-[120px] flex justify-center items-center ${isHidingMode ? 'bg-[#E06D5E] hover:bg-[#c45a4d] text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'}`}
                                variant={isHidingMode ? 'default' : 'outline'}
                            >
                                {isHidingLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    isHidingMode ? 'Save' : 'Hide Media'
                                )}
                            </Button>
                        )}
                        {userType !== 'agent' && !isHidingMode &&
                            <Button
                                onClick={() => {
                                    setMediaUploaded(true)
                                    setShowConfirmation(true)
                                }}
                                className={`${mediaUploaded ? "bg-[#6BAE41] hover:bg-[#7dc94f]" : `${userType}-bg hover-${userType}-bg`}  h-[32px] w-[150px] flex justify-center items-center `}>{mediaUploaded ? <Check color="#fff" size={14} /> : 'Send for Approval'} </Button>
                        }
                        <AgentNotificationModal
                            open={showConfirmation}
                            onClose={() => setShowConfirmation(false)}
                            serviceDate={currentService ? currentService : null}
                            orderData={orderData ? orderData : null}
                        />
                        {userType === 'agent' && (
                            <div className='flex items-center gap-[10px] mr-2'>
                                <div className='flex flex-col justify-center items-center mr-2'>
                                    <p className='text-[18px] text-[#6BAE41] leading-none mb-1'>${bookingToUse?.option?.amount}</p>
                                    <p className='text-[#7D7D7D] text-[10px] leading-none'>1 Link</p>
                                </div>
                                <Button
                                    onClick={() => {
                                        if (!(bookingToUse?.payment_status == 'PAID' || orderData?.payment_status === 'PAID')) {
                                            onOpenInvoice?.(currentService?.name);
                                        }
                                    }}
                                    className={`h-[32px] w-[100px] flex justify-center items-center 
                                        ${paymentSuccess || bookingToUse?.payment_status == 'PAID' || orderData?.payment_status === 'PAID'
                                            ? "bg-[#6BAE41] hover:bg-[#5fa43a]"
                                            : "bg-[#DC9600] hover:bg-[#eda304]"}`}
                                >
                                    {bookingToUse?.payment_status == 'PAID' || orderData?.payment_status === 'PAID' ? 'Paid' : 'UnPaid'}
                                </Button>
                            </div>
                        )}
                        <PayInvoiceModal open={openPaymentModal} setOpen={setOpenPaymentModal} success={paymentSuccess} setSuccess={setPaymentSuccess} />

                        {userType === 'admin' && (
                            <div className="">
                                <ManualPayment open={openPayment} setOpen={setOpenPayment} addPayment={handleAddPayment} />
                            </div>
                        )}
                        {userType !== 'agent' && (
                            <Button
                                onClick={() => setOpenUpgrade(true)}
                                className={`${userType}-bg h-[32px] w-[150px] flex justify-center items-center hover-${userType}-bg`}
                            >
                                Upgrade Plan
                            </Button>
                        )}
                        <UpgradeServicePopup
                            open={openUpgrade}
                            setOpen={setOpenUpgrade}
                            currentService={currentService}
                            currentOption={bookingToUse?.option}
                            orderData={orderData}
                            currentBookedService={currentBookedService}
                            onSuccess={() => {
                                window.location.reload()
                            }}
                        />
                    </div>
                </div>
            }

            {!isListing && (
                <div className={`p-4 flex ${userType === 'agent' ? 'justify-between' : 'justify-end'} items-center gap-4 border-b border-gray-200`}>
                    <div className="flex items-center gap-4">
                    </div>

                    {/* {userType === 'agent' && (
                        <div className="flex items-center gap-8">
                            <div className="flex flex-col items-center">
                                <span className="text-[22px] font-medium text-[#7D7D7D] leading-none">
                                    {(isValidUrl(brandedLink) && isValidUrl(unbrandedLink)) ? 1 : 0} <span className="text-[#7D7D7D]">/ {bookingToUse?.option?.quantity || 1}</span>
                                </span>
                                <span className="text-[12px] text-[#7D7D7D] mt-1">Selected</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[22px] font-medium text-[#666666] leading-none">
                                    {(isValidUrl(brandedLink) && isValidUrl(unbrandedLink)) ? 1 : 0}
                                </span>
                                <span className="text-[12px] text-[#666666] mt-1">Available</span>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setOpenUpgrade(true)}
                                className="border border-[#6BAE41] text-[#6BAE41] hover:bg-[#6BAE41] hover:text-white h-[36px] px-6 rounded transition-colors font-medium ml-2"
                            >
                                Upgrade Plan
                            </Button>
                        </div>
                    )} */}
                </div>
            )}
            <div className='flex flex-col items-center justify-center my-4'>
                <div className='w-[650px]'>
                    <Label className='text-[14px] text-[#424242]'>
                        3D Tour Link - Branded
                        {brandedApiLinkObj?.is_hidden && (
                            <span className="ml-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold">Hidden</span>
                        )}
                    </Label>
                    <div className="flex gap-2">

                        {userType === 'agent' ? (
                             <div className="relative w-full">
                                <div className={`absolute inset-0 z-10 cursor-pointer ${isHidingMode ? 'block' : 'hidden'}`} onClick={() => brandedApiUuid && toggleHideSelection(brandedApiUuid)} />
                                <Input
                                    className={`w-full h-[42px] text-[#666666] pr-9 cursor-default select-text ${isHidingMode && brandedApiUuid && filesToHide.has(brandedApiUuid) ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                                    value={brandedLink}
                                    readOnly
                                    placeholder="No link available"
                                />
                                {isHidingMode && brandedApiUuid && filesToHide.has(brandedApiUuid) && (
                                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                                        <Check className="text-red-500" size={16} />
                                    </div>
                                )}
                                {brandedLink && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 group">
                                        <button
                                            type="button"
                                            onClick={() => handleCopy('branded', brandedLink)}
                                            className={`${userType}-text opacity-70 hover:opacity-100 transition-opacity p-1 rounded`}
                                            aria-label="Copy branded link"
                                        >
                                            {copiedField === 'branded'
                                                ? <ClipboardCheck size={16} className="text-green-500" />
                                                : <Copy size={16} />}
                                        </button>
                                        <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                            {copiedField === 'branded' ? 'Copied!' : 'Click to copy to clipboard'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="relative w-full">
                                <div className={`absolute inset-0 z-10 cursor-pointer ${isHidingMode ? 'block' : 'hidden'}`} onClick={() => brandedApiUuid && toggleHideSelection(brandedApiUuid)} />
                                <Input
                                    className={`w-full h-[42px] text-[#666666] ${isHidingMode && brandedApiUuid && filesToHide.has(brandedApiUuid) ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                                    value={brandedLink}
                                    onChange={(e) => handleLinkChange("branded", e.target.value)}
                                    placeholder="Enter branded link"
                                />
                                {isHidingMode && brandedApiUuid && filesToHide.has(brandedApiUuid) && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <Check className="text-red-500" size={16} />
                                    </div>
                                )}
                            </div>
                        )}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "min-w-[220px] w-fit justify-start text-left font-normal bg-white h-[42px] border-[#BBBBBB]",
                                        !brandedExpiry && "text-muted-foreground"
                                    )}
                                    disabled={userType === 'agent'}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {brandedExpiry ? format(new Date(brandedExpiry), "PPP") : <span>Expiry date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={brandedExpiry ? new Date(brandedExpiry) : undefined}
                                    onSelect={(date) => handleDateChange("branded", date ? format(date, "yyyy-MM-dd") : "")}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className='w-[650px] mt-[10px]'>
                    <Label className='text-[14px] text-[#424242]'>
                        3D Tour Link - Unbranded
                        {unbrandedApiLinkObj?.is_hidden && (
                            <span className="ml-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold">Hidden</span>
                        )}
                    </Label>
                    <div className="flex gap-2">

                        {userType === 'agent' ? (
                             <div className="relative w-full">
                                <div className={`absolute inset-0 z-10 cursor-pointer ${isHidingMode ? 'block' : 'hidden'}`} onClick={() => unbrandedApiUuid && toggleHideSelection(unbrandedApiUuid)} />
                                <Input
                                    className={`w-full h-[42px] text-[#666] pr-9 cursor-default select-text ${isHidingMode && unbrandedApiUuid && filesToHide.has(unbrandedApiUuid) ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                                    value={unbrandedLink}
                                    readOnly
                                    placeholder="No link available"
                                />
                                {isHidingMode && unbrandedApiUuid && filesToHide.has(unbrandedApiUuid) && (
                                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                                        <Check className="text-red-500" size={16} />
                                    </div>
                                )}
                                {unbrandedLink && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 group">
                                        <button
                                            type="button"
                                            onClick={() => handleCopy('unbranded', unbrandedLink)}
                                            className={`${userType}-text opacity-70 hover:opacity-100 transition-opacity p-1 rounded`}
                                            aria-label="Copy unbranded link"
                                        >
                                            {copiedField === 'unbranded'
                                                ? <ClipboardCheck size={16} className="text-green-500" />
                                                : <Copy size={16} />}
                                        </button>
                                        <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                            {copiedField === 'unbranded' ? 'Copied!' : 'Click to copy to clipboard'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="relative w-full">
                                <div className={`absolute inset-0 z-10 cursor-pointer ${isHidingMode ? 'block' : 'hidden'}`} onClick={() => unbrandedApiUuid && toggleHideSelection(unbrandedApiUuid)} />
                                <Input
                                    className={`w-full h-[42px] text-[#666] ${isHidingMode && unbrandedApiUuid && filesToHide.has(unbrandedApiUuid) ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                                    value={unbrandedLink}
                                    onChange={(e) => handleLinkChange("unbranded", e.target.value)}
                                    placeholder="Enter unbranded link"
                                />
                                {isHidingMode && unbrandedApiUuid && filesToHide.has(unbrandedApiUuid) && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <Check className="text-red-500" size={16} />
                                    </div>
                                )}
                            </div>
                        )}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "min-w-[220px] w-fit justify-start text-left font-normal bg-white h-[42px] border-[#BBBBBB]",
                                        !unbrandedExpiry && "text-muted-foreground"
                                    )}
                                    disabled={userType === 'agent'}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {unbrandedExpiry ? format(new Date(unbrandedExpiry), "PPP") : <span>Expiry date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={unbrandedExpiry ? new Date(unbrandedExpiry) : undefined}
                                    onSelect={(date) => handleDateChange("unbranded", date ? format(date, "yyyy-MM-dd") : "")}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

            </div>

            <div className='w-full'>
                <Accordion type="single" defaultValue="Preview" className="w-full">
                    <AccordionItem value="Preview">
                        <AccordionTrigger
                            className="px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current"
                            style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                        >
                            Matterport Preview
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="w-full flex flex-col items-center gap-[20px] py-[30px] ">
                                {isValidUrl(brandedLink) && (
                                    <iframe
                                        src={brandedLink}
                                        className="w-[80%] h-[500px] border"
                                        allowFullScreen
                                    ></iframe>
                                )}

                                {isValidUrl(unbrandedLink) && (
                                    <iframe
                                        src={unbrandedLink}
                                        className="w-[80%] h-[500px] border"
                                        allowFullScreen
                                    ></iframe>
                                )}

                                {!isValidUrl(brandedLink) && !isValidUrl(unbrandedLink) && (
                                    <p className="text-gray-500">Enter a valid link to preview the 3D tour</p>
                                )}


                            </div>

                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

            </div>
        </div >
    )
}

export default FileTab2