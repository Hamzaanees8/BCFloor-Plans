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
import { format, addDays } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ServiceCompletion } from '../file-manager';
import { api } from '@/lib/api';

function FileTab2({ currentService, orderData, isListing, reviewFilesEnabled, currentBookedService, onOpenInvoice, gstRate, isScrolled, stickyOffset }: { currentService?: Services, orderData: Order | null, isListing?: boolean, reviewFilesEnabled?: boolean, currentBookedService?: OrderService, onOpenInvoice?: (serviceName?: string, orderServiceUuid?: string) => void, gstRate?: number, onSave?: (overrideChangedFiles?: any[]) => Promise<void> | void, isScrolled?: boolean, stickyOffset?: number, onShowHiddenMedia?: () => void }) {
    const { links, setLinks, setPreviewFiles, filesData, isHidingMode, filesToHide, setFilesToHide, tourSettings } = useFileManagerContext();
    const [mediaUploaded, setMediaUploaded] = useState<boolean>(false);
    const [openPayment, setOpenPayment] = useState(false);
    const [, setSuccess] = useState(false);
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [openUpgrade, setOpenUpgrade] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [copiedField, setCopiedField] = useState<'branded' | 'unbranded' | null>(null);
    const dragCounter = useRef(0);

    const { userType } = useAppContext()
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSubmitAdminApproval = async () => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token") || "";
            const vendor = orderData?.vendor;
            const vendorName = vendor ? `${vendor.first_name} ${vendor.last_name}` : "Vendor";

            await api.post(`/notifications`, {
                source: 'order',
                source_id: orderData?.uuid || "",
                type: 'admin_approval_required',
                description: `Media submitted by Vendor ${vendorName} for Order #${orderData?.id || ""} requires Admin Approval.`,
                role: 'admin',
                created_by_name: vendorName
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await api.post(`/notifications/email`, {
                to: "info@bcfplatform.com",
                subject: `Order #${orderData?.id || ""}: Media Submitted for Admin Approval`,
                html: `
                    <div style="font-family: 'Alexandria', sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #4290E9;">Media Submitted for Admin Approval</h2>
                        <p>Vendor <strong>${vendorName}</strong> has uploaded and submitted media files for Order <strong>#${orderData?.id || ""}</strong>.</p>
                        <p>This vendor is marked for mandatory admin review before files are released to the client/agent.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 13px; color: #666;">Please log in to your admin dashboard, navigate to the File Manager for Order #${orderData?.id || ""}, and approve the files.</p>
                    </div>
                `
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMediaUploaded(true);
            toast.success("Submitted successfully! The admins have been notified to review your files.");
        } catch (error) {
            console.error("Submission failed:", error);
            toast.error("Failed to submit for approval. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

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

    const parseLocalDate = (dateStr: string) => {
        if (!dateStr) return undefined;
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            return new Date(year, month, day);
        }
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return undefined;
        return d;
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

    const isPaid = bookingToUse?.payment_status === 'PAID' || orderData?.payment_status === 'PAID';
    const canAgentView = userType !== 'agent' || isPaid;

    const maskLink = (link: string) => {
        if (!link) return '';
        if (canAgentView) return link;
        if (link.length <= 32) return link.substring(0, Math.floor(link.length / 2)) + '*'.repeat(Math.ceil(link.length / 2));
        return link.substring(0, 32) + '*'.repeat(link.length - 32);
    };

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
        const enableMatterportExpiry = tourSettings?.enable_matterport_default_expiry;
        const defaultMatterportDays = parseInt(tourSettings?.matterport_default_expiry_days || "0", 10);

        setLinks(prev => {
            const existingIndex = prev.findIndex(l => l.type === type && l.service_id === currentService?.uuid);

            let calculatedExpiry = "";
            if (enableMatterportExpiry && defaultMatterportDays > 0 && value) {
                calculatedExpiry = format(addDays(new Date(), defaultMatterportDays), "yyyy-MM-dd");
            }

            if (existingIndex >= 0) {
                const updated = [...prev];
                const currentExpiry = updated[existingIndex].expiry_date;
                const newExpiry = (!currentExpiry && value) ? calculatedExpiry : currentExpiry;
                updated[existingIndex] = { ...updated[existingIndex], link: value, expiry_date: newExpiry };
                return updated;
            } else {
                return [...prev, { type, service_id: currentService?.uuid ?? '', link: value, expiry_date: calculatedExpiry }];
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

            {!isListing && (
                <div
                    className={`w-full flex flex-wrap justify-between items-center px-4 font-alexandria overflow-visible transition-all duration-300 z-10 gap-y-2 ${
                      isScrolled ? "sticky min-h-[44px] py-1 shadow-sm" : "relative min-h-[66px] py-2"
                    }`}
                    style={{
                      backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)`,
                      top: isScrolled ? `${stickyOffset}px` : "auto"
                    }}
                >
                    <div className="shrink-0">
                    </div>
                    <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <p className='flex flex-col items-center pointer-events-auto'>
                            <span className={`font-bold transition-all duration-300 ${userType}-text ${isScrolled ? "text-[13px]" : "text-[16px]"}`}>
                                {currentService ? currentService.name : '3D Tour'}
                            </span>
                            {!isScrolled && (
                                <span className='text-[12px] text-[#7D7D7D]'>
                                    {bookingToUse?.option?.title ?? '1 Link'}
                                </span>
                            )}
                        </p>
                    </div>
                    <div className='flex justify-center items-center gap-x-2 md:gap-x-[14px] shrink-0'>
                        {!isHidingMode && userType === 'vendor' && reviewFilesEnabled && (
                            <Button
                                onClick={handleSubmitAdminApproval}
                                disabled={isSubmitting}
                                className={`${mediaUploaded ? "bg-[#6BAE41] hover:bg-[#7dc94f]" : `${userType}-bg hover-${userType}-bg`} flex justify-center items-center font-alexandria transition-all duration-300 ${isScrolled ? "h-[24px] min-w-[100px] w-fit px-2 text-[10px]" : "h-[26px] min-w-[120px] text-[10px] md:h-[32px] md:min-w-[150px] w-fit px-2 md:px-4 md:text-[12px]"
                                }`}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : mediaUploaded ? (
                                    <Check color="#fff" size={14} className="mr-2" />
                                ) : null}
                                {mediaUploaded ? 'Submitted' : 'Submit for Admin Approval'}
                            </Button>
                        )}
                        {userType === 'admin' && (
                            <div className='flex items-center gap-[5px] md:gap-[10px] md:mr-2'>
                                <div className='flex flex-col justify-center items-end mr-1 md:mr-2 text-right'>
                                    <p className={`text-[13px] md:text-[18px] ${bookingToUse?.payment_status === 'REFUNDED' || orderData?.payment_status === 'REFUNDED' ? 'text-[#D0021B]' : (paymentSuccess || bookingToUse?.payment_status == 'PAID' || orderData?.payment_status === 'PAID' ? 'text-[#6BAE41]' : 'text-[#E06D5E]')} leading-none mb-1`}>
                                        ${(parseFloat(bookingToUse?.option?.amount || "0") + (gstRate ? parseFloat(bookingToUse?.option?.amount || "0") * gstRate : 0)).toFixed(2)}
                                    </p>
                                    <p className='text-[#7D7D7D] text-[9px] md:text-[10px] leading-none'>
                                        {gstRate ? `incl. $${(parseFloat(bookingToUse?.option?.amount || "0") * gstRate).toFixed(2)} GST` : `${bookingToUse?.option?.quantity || 1} Link`}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => {
                                        onOpenInvoice?.(currentService?.name, bookingToUse?.uuid);
                                    }}
                                    className={`h-[24px] w-[60px] text-[10px] md:h-[32px] md:w-[100px] md:text-[14px] flex justify-center items-center cursor-pointer px-1 md:px-4 text-white
                                        ${bookingToUse?.payment_status === 'REFUNDED' || orderData?.payment_status === 'REFUNDED'
                                            ? "bg-[#D0021B] hover:bg-[#b00217]"
                                            : paymentSuccess || bookingToUse?.payment_status == 'PAID' || orderData?.payment_status === 'PAID'
                                            ? "bg-[#6BAE41] hover:bg-[#5fa43a]"
                                            : "bg-[#DC9600] hover:bg-[#eda304]"}`}
                                >
                                    {bookingToUse?.payment_status === 'REFUNDED' || orderData?.payment_status === 'REFUNDED'
                                        ? 'REFUNDED'
                                        : (bookingToUse?.payment_status == 'PAID' || orderData?.payment_status === 'PAID' ? 'PAID' : 'UNPAID')}
                                </Button>
                            </div>
                        )}
                        <AgentNotificationModal
                            open={showConfirmation}
                            onClose={() => setShowConfirmation(false)}
                            serviceDate={currentService ? currentService : null}
                            orderData={orderData ? orderData : null}
                        />
                        {userType === 'agent' && (
                            <div className='flex items-center gap-[5px] md:gap-[10px] md:mr-2'>
                                <div className='flex flex-col justify-center items-end mr-1 md:mr-2 text-right'>
                                    <p className={`text-[13px] md:text-[18px] ${bookingToUse?.payment_status === 'REFUNDED' || orderData?.payment_status === 'REFUNDED' ? 'text-[#D0021B]' : (paymentSuccess || bookingToUse?.payment_status == 'PAID' || orderData?.payment_status === 'PAID' ? 'text-[#6BAE41]' : 'text-[#E06D5E]')} leading-none mb-1`}>
                                        ${(parseFloat(bookingToUse?.option?.amount || "0") + (gstRate ? parseFloat(bookingToUse?.option?.amount || "0") * gstRate : 0)).toFixed(2)}
                                    </p>
                                    <p className='text-[#7D7D7D] text-[9px] md:text-[10px] leading-none'>
                                        {gstRate ? `incl. $${(parseFloat(bookingToUse?.option?.amount || "0") * gstRate).toFixed(2)} GST` : `${bookingToUse?.option?.quantity || 1} Link`}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => {
                                        onOpenInvoice?.(currentService?.name, bookingToUse?.uuid);
                                    }}
                                    className={`h-[24px] w-[60px] text-[10px] md:h-[32px] md:w-[100px] md:text-[14px] flex justify-center items-center cursor-pointer px-1 md:px-4 text-white
                                        ${bookingToUse?.payment_status === 'REFUNDED' || orderData?.payment_status === 'REFUNDED'
                                            ? "bg-[#D0021B] hover:bg-[#b00217]"
                                            : paymentSuccess || bookingToUse?.payment_status == 'PAID' || orderData?.payment_status === 'PAID'
                                            ? "bg-[#6BAE41] hover:bg-[#5fa43a]"
                                            : "bg-[#DC9600] hover:bg-[#eda304]"}`}
                                >
                                    {bookingToUse?.payment_status === 'REFUNDED' || orderData?.payment_status === 'REFUNDED'
                                        ? 'Refunded'
                                        : (bookingToUse?.payment_status == 'PAID' || orderData?.payment_status === 'PAID' ? 'Paid' : 'UnPaid')}
                                </Button>
                            </div>
                        )}
                        <PayInvoiceModal open={openPaymentModal} setOpen={setOpenPaymentModal} success={paymentSuccess} setSuccess={setPaymentSuccess} />

                        {userType === 'admin' && (
                            <div className="">
                                <ManualPayment open={openPayment} setOpen={setOpenPayment} addPayment={handleAddPayment} />
                            </div>
                        )}
                        {/* {userType !== 'agent' && userType !== 'vendor' && (
                            <Button
                                variant="outline"
                                onClick={() => setOpenUpgrade(true)}
                                className={`${userType}-bg hover-${userType}-bg text-white hover:!text-white hover:brightness-90 h-[28px] md:h-[32px] w-auto px-2 md:px-4 flex justify-center items-center border-none text-[11px] md:text-sm`}
                            >
                                Upgrade Plan
                            </Button>
                        )} */}
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
            )}

            {!isListing && (
                <div className={`p-3 md:p-4 flex ${userType === 'agent' ? 'flex-col md:flex-row justify-between' : 'justify-end'} items-start md:items-center gap-x-4 gap-y-3 border-b border-gray-200 font-alexandria`}>
                    <div className="flex items-center gap-2 flex-wrap md:flex-nowrap w-full md:w-auto">
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
                                className={`border h-[36px] px-6 rounded transition-colors font-medium ml-2 ${userType}-button`}
                                style={{ 
                                    borderColor: `var(--${userType}-page-tab-color)`, 
                                    color: `var(--${userType}-page-tab-color)` 
                                }}
                            >
                                Upgrade Plan
                            </Button>
                        </div>
                    )} */}
                </div>
            )}
            <div className='flex flex-col items-center justify-center my-4 w-full'>
                {userType === 'vendor' && reviewFilesEnabled && (
                    <div className="w-full max-w-[650px] mx-auto mb-4 p-4 border border-blue-200 bg-blue-50 rounded-[8px] flex items-start gap-3 font-alexandria shadow-sm px-4 md:px-4">
                        <span className="text-[18px] text-blue-600 mt-0.5">ℹ️</span>
                        <p className="text-[13px] text-blue-700 leading-relaxed">
                            Your uploads are undergoing Admin Approval. Once approved by the administrator, they will be released to the booking agent.
                        </p>
                    </div>
                )}
                <div className='w-full max-w-[650px] px-4 md:px-0'>
                    <Label className='text-[14px] text-[#424242]'>
                        3D Tour Link - Branded
                        {brandedApiLinkObj?.is_hidden && (
                            <span className="ml-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold">Hidden</span>
                        )}
                    </Label>
                    <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-1">

                        {userType === 'agent' ? (
                            <div className="relative w-full">
                                <div className={`absolute inset-0 z-10 cursor-pointer ${isHidingMode ? 'block' : 'hidden'}`} onClick={() => brandedApiUuid && toggleHideSelection(brandedApiUuid)} />
                                <Input
                                    className={`w-full h-[42px] text-[#666666] pr-9 cursor-default select-text ${isHidingMode && brandedApiUuid && filesToHide.has(brandedApiUuid) ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                                    value={maskLink(brandedLink)}
                                    readOnly
                                    placeholder="No link available"
                                />
                                {isHidingMode && brandedApiUuid && filesToHide.has(brandedApiUuid) && (
                                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                                        <Check className="text-red-500" size={16} />
                                    </div>
                                )}
                                {brandedLink && canAgentView && (
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
                                        "w-full md:min-w-[220px] md:w-fit justify-start text-left font-normal bg-white h-[42px] border-[#BBBBBB]",
                                        !brandedExpiry && "text-muted-foreground"
                                    )}
                                    disabled={userType === 'agent'}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {brandedExpiry ? format(parseLocalDate(brandedExpiry)!, "PPP") : <span>Expiry date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={parseLocalDate(brandedExpiry)}
                                    onSelect={(date) => handleDateChange("branded", date ? format(date, "yyyy-MM-dd") : "")}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className='w-full max-w-[650px] px-4 md:px-0 mt-[10px] md:mt-[20px]'>
                    <Label className='text-[14px] text-[#424242]'>
                        3D Tour Link - Unbranded
                        {unbrandedApiLinkObj?.is_hidden && (
                            <span className="ml-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold">Hidden</span>
                        )}
                    </Label>
                    <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-1">

                        {userType === 'agent' ? (
                            <div className="relative w-full">
                                <div className={`absolute inset-0 z-10 cursor-pointer ${isHidingMode ? 'block' : 'hidden'}`} onClick={() => unbrandedApiUuid && toggleHideSelection(unbrandedApiUuid)} />
                                <Input
                                    className={`w-full h-[42px] text-[#666] pr-9 cursor-default select-text ${isHidingMode && unbrandedApiUuid && filesToHide.has(unbrandedApiUuid) ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                                    value={maskLink(unbrandedLink)}
                                    readOnly
                                    placeholder="No link available"
                                />
                                {isHidingMode && unbrandedApiUuid && filesToHide.has(unbrandedApiUuid) && (
                                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                                        <Check className="text-red-500" size={16} />
                                    </div>
                                )}
                                {unbrandedLink && canAgentView && (
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
                                        "w-full md:min-w-[220px] md:w-fit justify-start text-left font-normal bg-white h-[42px] border-[#BBBBBB]",
                                        !unbrandedExpiry && "text-muted-foreground"
                                    )}
                                    disabled={userType === 'agent'}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {unbrandedExpiry ? format(parseLocalDate(unbrandedExpiry)!, "PPP") : <span>Expiry date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={parseLocalDate(unbrandedExpiry)}
                                    onSelect={(date) => handleDateChange("unbranded", date ? format(date, "yyyy-MM-dd") : "")}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

            </div>

            <div className='w-full'>
                <Accordion type="multiple" defaultValue={["Preview-Branded", "Preview-Unbranded", "Preview"]} className="w-full">
                    {(!isValidUrl(brandedLink) && !isValidUrl(unbrandedLink)) && (
                        <AccordionItem value="Preview">
                            <AccordionTrigger
                                className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] text-[15px] md:text-[18px] font-[600] uppercase [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current ${userType}-text`}
                                style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                            >
                                Matterport Preview
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="w-full flex flex-col items-center gap-[20px] py-[30px] ">
                                    {userType === 'agent' && !isPaid && (
                                        <div className="w-full md:w-[80%] bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded text-center">
                                            You have not paid for this service yet. Pay the service to visit/view Matterport.
                                        </div>
                                    )}
                                    {canAgentView && (
                                        <p className="text-gray-500">Enter a valid link to preview the 3D tour</p>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    {isValidUrl(brandedLink) && (
                        <AccordionItem value="Preview-Branded">
                            <AccordionTrigger
                                className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] text-[15px] md:text-[18px] font-[600] uppercase [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current ${userType}-text`}
                                style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                            >
                                Matterport Preview-Branded
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="w-full flex flex-col items-center gap-[20px] py-[30px] ">
                                    {userType === 'agent' && !isPaid && (
                                        <div className="w-full md:w-[80%] bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded text-center">
                                            You have not paid for this service yet. Pay the service to visit/view Matterport.
                                        </div>
                                    )}
                                    {canAgentView && (
                                        <div className="relative w-full md:w-[80%] h-[300px] md:h-[500px]">
                                            <iframe
                                                src={brandedLink}
                                                className="w-full h-full border"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    {isValidUrl(unbrandedLink) && (
                        <AccordionItem value="Preview-Unbranded">
                            <AccordionTrigger
                                className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] text-[15px] md:text-[18px] font-[600] uppercase [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current ${userType}-text`}
                                style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                            >
                                Matterport Preview-Unbranded
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="w-full flex flex-col items-center gap-[20px] py-[30px] ">
                                    {userType === 'agent' && !isPaid && (
                                        <div className="w-full md:w-[80%] bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded text-center">
                                            You have not paid for this service yet. Pay the service to visit/view Matterport.
                                        </div>
                                    )}
                                    {canAgentView && (
                                        <div className="relative w-full md:w-[80%] h-[300px] md:h-[500px]">
                                            <iframe
                                                src={unbrandedLink}
                                                className="w-full h-full border"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}
                </Accordion>
            </div>
        </div >
    )
}

export default FileTab2