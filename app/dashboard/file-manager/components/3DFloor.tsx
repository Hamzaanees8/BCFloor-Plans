'use client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, CheckCircle2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Services } from '../../services/page';
import { useFileManagerContext } from '../FileManagerContext ';
import ManualPayment from './ManualPayment';
import { useAppContext } from '@/app/context/AppContext';
import { Order } from '../../orders/page';
import UpgradeServicePopup from './UpgradeServicePopup';
import PayInvoiceModal from './PayInvoiceModal';
// import FileUploader from './FileUploader';

function FileTab2({ currentService, orderData }: { currentService?: Services, orderData: Order | null }) {
    const { links, setLinks, setPreviewFiles, filesData } = useFileManagerContext();
    const [mediaUploaded, setMediaUploaded] = useState<boolean>(false);
    const [openPayment, setOpenPayment] = useState(false);
    const [success, setSuccess] = useState(false);
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [openUpgrade, setOpenUpgrade] = useState(false);
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


    const brandedLink = links.find(l => l.type === "branded" && l.service_id === currentService?.uuid)?.link || "";
    const unbrandedLink = links.find(l => l.type === "unbranded" && l.service_id === currentService?.uuid)?.link || "";

    const brandedApiLink = filesData?.links.find(
        (link) => link.type === "branded" && link.service?.uuid === currentService?.uuid
    )?.link;

    const unbrandedApiLink = filesData?.links.find(
        (link) => link.type === "unbranded" && link.service?.uuid === currentService?.uuid
    )?.link;
    const currentServiceOption = orderData?.services.find((service) => service.service.uuid === currentService?.uuid)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAddPayment = (paymentData: any) => {
        console.log("Payment Added:", paymentData);
        setSuccess(true);
    };

    useEffect(() => {
        if (currentService?.uuid) {
            if (brandedApiLink) {
                setLinks((prev) => {
                    const existingIndex = prev.findIndex(
                        l => l.type === "branded" && l.service_id === currentService.uuid
                    );
                    if (existingIndex >= 0) {
                        const updated = [...prev];
                        updated[existingIndex] = { ...updated[existingIndex], link: brandedApiLink };
                        return updated;
                    } else {
                        return [...prev, { type: "branded", service_id: currentService.uuid, link: brandedApiLink }];
                    }
                });
            }

            if (unbrandedApiLink) {
                setLinks((prev) => {
                    const existingIndex = prev.findIndex(
                        l => l.type === "unbranded" && l.service_id === currentService.uuid
                    );
                    if (existingIndex >= 0) {
                        const updated = [...prev];
                        updated[existingIndex] = { ...updated[existingIndex], link: unbrandedApiLink };
                        return updated;
                    } else {
                        return [...prev, { type: "unbranded", service_id: currentService.uuid, link: unbrandedApiLink }];
                    }
                });
            }
        }
    }, [brandedApiLink, unbrandedApiLink, currentService?.uuid, setLinks]);


    console.log('brandedLink', brandedApiLink, 'unbrandedApiLink', unbrandedApiLink);

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



    return (
        <div className='font-alexandria w-full'>

            <div className='h-[66px] w-full bg-[#E4E4E4] flex justify-between items-center px-4 font-alexandria'>
                <div className='h-[66px] w-full bg-[#E4E4E4] flex justify-between items-center  font-alexandria'>
                    <div>

                    </div>
                    <div>
                        <p className='flex flex-col items-center'>
                            <span className={`${userType}-text font-bold`}>
                                {currentService ? currentService.name : '3D Tour'}
                            </span>
                            <span className='text-[12px] text-[#7D7D7D]'>{currentServiceOption?.option.title}</span>

                        </p>
                    </div>
                    <div className='flex justify-center items-center'>
                        {userType !== 'agent' &&
                            <Button
                                onClick={() => setMediaUploaded(true)}
                                className={`${mediaUploaded ? "bg-[#6BAE41] hover:bg-[#7dc94f]" : `${userType}-bg hover-${userType}-bg`}  h-[32px] w-[150px] flex justify-center items-center `}>{mediaUploaded ? <Check color="#fff" size={14} /> : 'Send for Approval'} </Button>
                        }
                        {userType === 'agent' &&
                            <div className='flex flex-col justify-center items-center mr-4'>
                                <p className='text-[18px] text-[#6BAE41]'>${currentServiceOption?.option.amount}</p>
                                <p className='text-[#7D7D7D] text-[12px]'>{currentServiceOption?.option.title}</p>
                            </div>
                        }
                        {userType === 'agent' &&
                            <Button
                                onClick={() => setOpenPaymentModal(true)}
                                className={`h-[32px] w-[150px] flex justify-center items-center 
                                                                              ${paymentSuccess
                                        ? "bg-[#6BAE41] hover:bg-[#5fa43a]"
                                        : "bg-[#DC9600] hover:bg-[#eda304]"}`
                                }>{paymentSuccess ? 'Paid' : 'UnPaid'}</Button>
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

            </div>
             <div className='p-4 flex justify-end'>
                <Button
                    onClick={() => setOpenUpgrade(true)}
                    className={`${userType}-bg h-[32px] w-[150px] flex justify-center items-center hover-${userType}-bg`}>Upgrade Plan</Button>
                <UpgradeServicePopup open={openUpgrade} setOpen={setOpenUpgrade} currentService={currentService} currentOption={currentServiceOption?.option} />
            </div>
            <div className='flex flex-col items-center justify-center my-4'>
                <div className='w-[410px]'>
                    <Label className='text-[14px] text-[#424242]'>3D Tour Link - Branded</Label>
                    <Input
                        className='w-full h-[42px] text-[#666666]'
                        value={brandedLink}
                        onChange={(e) => handleLinkChange("branded", e.target.value)}
                    />
                </div>

                <div className='w-[410px] mt-[10px]'>
                    <Label className='text-[14px] text-[#424242]'>3D Tour Link - Unbranded</Label>
                    <Input
                        className='w-full h-[42px] text-[#666]'
                        value={unbrandedLink}
                        onChange={(e) => handleLinkChange("unbranded", e.target.value)}
                    />
                </div>

            </div>

            <div className='w-full'>
                <Accordion type="single" defaultValue="Preview" className="w-full">
                    <AccordionItem value="Preview">
                        <AccordionTrigger className="px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] text-[#4290E9] text-[18px] font-[600] uppercase [&>svg]:text-[#4290E9]  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current">
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