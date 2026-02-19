'use client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, CheckCircle2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Services } from '../../services/page';
import { useFileManagerContext } from '../FileManagerContext';
import ManualPayment from './ManualPayment';
import { useAppContext } from '@/app/context/AppContext';
import { Order } from '../../orders/page';
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
import { ServiceCompletion } from '../file-manager';

function FileTab2({ currentService, orderData, isListing }: { currentService?: Services, orderData: Order | null, isListing?: boolean, reviewFilesEnabled?: boolean }) {
    const { links, setLinks, setPreviewFiles, filesData } = useFileManagerContext();
    const [mediaUploaded, setMediaUploaded] = useState<boolean>(false);
    const [openPayment, setOpenPayment] = useState(false);
    const [success, setSuccess] = useState(false);
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [openUpgrade, setOpenUpgrade] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const dragCounter = useRef(0);

    const { userType } = useAppContext()

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

    const currentBookedService = orderData?.services.find((service) => service.service.uuid === currentService?.uuid)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAddPayment = (paymentData: any) => {
        console.log("Payment Added:", paymentData);
        setSuccess(true);
    };
    useEffect(() => {
        if (currentService?.uuid) {
            if (brandedApiLink || brandedApiExpiry) {
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

            if (unbrandedApiLink || unbrandedApiExpiry) {
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
    }, [brandedApiLink, brandedApiExpiry, brandedApiUuid, unbrandedApiLink, unbrandedApiExpiry, unbrandedApiUuid, currentService?.uuid, setLinks]);



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

            if (numberOfbrandedApiLink >= (currentBookedService?.option?.quantity ?? 1) && numberOfUnbrandedApiLink >= (currentBookedService?.option?.quantity ?? 1)) {
                if (token && currentBookedService?.uuid && orderData?.uuid && !currentBookedService?.is_completed) {
                    await ServiceCompletion(token, currentBookedService.uuid, true, orderData.uuid)
                }
            }
        };
        checkServiceCompletion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unbrandedApiLink, currentService, brandedApiLink, orderData, currentBookedService?.uuid, currentBookedService?.is_completed])


    return (
        <div className='font-alexandria w-full'>

            {!isListing &&
                <div
                    className='h-[66px] w-full flex justify-between items-center px-4 font-alexandria'
                    style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                >
                    <div
                        className='h-[66px] w-full flex justify-between items-center  font-alexandria'
                        style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                    >
                        <div>

                        </div>
                        <div>
                            <p className='flex flex-col items-center'>
                                <span className={`${userType}-text font-bold`}>
                                    {currentService ? currentService.name : '3D Tour'}
                                </span>
                                <span className='text-[12px] text-[#7D7D7D]'>{currentBookedService?.option?.title ?? ''}</span>

                            </p>
                        </div>
                        <div className='flex justify-center items-center'>
                            {userType !== 'agent' &&
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
                            {userType === 'agent' &&
                                <div className='flex flex-col justify-center items-center mr-4'>
                                    <p className='text-[18px] text-[#6BAE41]'>${currentBookedService?.option?.amount}</p>
                                    <p className='text-[#7D7D7D] text-[12px]'>{currentBookedService?.option?.title ?? ''}</p>
                                </div>
                            }
                            {userType === 'agent' &&
                                <Button
                                    className={`h-[32px] w-[150px] flex justify-center items-center 
                                                                                                ${paymentSuccess
                                            ? "bg-[#6BAE41] hover:bg-[#5fa43a]"
                                            : "bg-[#DC9600] hover:bg-[#eda304]"}`
                                    }>{currentBookedService?.payment_status == 'PAID' ? 'Paid' : 'UnPaid'}</Button>
                            }
                            <PayInvoiceModal open={openPaymentModal} setOpen={setOpenPaymentModal} success={paymentSuccess} setSuccess={setPaymentSuccess} />

                            {userType === 'admin' &&
                                <div className="pl-4">
                                    {!success ? (
                                        <Button
                                            onClick={() => setOpenPayment(true)}
                                            className={`${userType}-bg text-white hover-${userType}-bg cursor-pointer h-[32px]`}
                                        >
                                            Add Manual Payment
                                        </Button>
                                    ) : (
                                        <Button
                                            // disabled
                                            className="bg-[#6BAE41] hover:bg-[#7dc94f]  text-white flex items-center gap-2 cursor-default  h-[32px]"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            Payment Added
                                        </Button>
                                    )}

                                    <ManualPayment open={openPayment} setOpen={setOpenPayment} addPayment={handleAddPayment} />
                                </div>}
                        </div>
                    </div>

                </div>}
            {!isListing &&
                <div className='p-4 flex justify-end'>
                    <Button
                        onClick={() => setOpenUpgrade(true)}
                        className={`${userType}-bg h-[32px] w-[150px] flex justify-center items-center hover-${userType}-bg`}>Upgrade Plan</Button>
                    <UpgradeServicePopup
                        open={openUpgrade}
                        setOpen={setOpenUpgrade}
                        currentService={currentService}
                        currentOption={currentBookedService?.option}
                        orderData={orderData}
                        currentBookedService={currentBookedService}
                        onSuccess={() => {
                            window.location.reload()
                        }}
                    />
                </div>}
            <div className='flex flex-col items-center justify-center my-4'>
                <div className='w-[650px]'>
                    <Label className='text-[14px] text-[#424242]'>3D Tour Link - Branded</Label>
                    <div className="flex gap-2">

                        <Input
                            className='w-full h-[42px] text-[#666666]'
                            value={brandedLink}
                            readOnly={userType === 'agent'}
                            onChange={(e) => handleLinkChange("branded", e.target.value)}
                            placeholder="Enter branded link"
                        />
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
                    <Label className='text-[14px] text-[#424242]'>3D Tour Link - Unbranded</Label>
                    <div className="flex gap-2">

                        <Input
                            className='w-full h-[42px] text-[#666]'
                            value={unbrandedLink}
                            readOnly={userType === 'agent'}
                            onChange={(e) => handleLinkChange("unbranded", e.target.value)}
                            placeholder="Enter unbranded link"
                        />
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