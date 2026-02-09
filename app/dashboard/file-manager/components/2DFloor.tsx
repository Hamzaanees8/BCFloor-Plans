import ConfirmationDialog from '@/components/ConfirmationDialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import HouseSheetModal from './HouseSheetModal';
import { Order } from '../../orders/page';
import { Check, CheckCircle2, X } from 'lucide-react';
import { Area, DownloadFile, ServiceCompletion } from '../file-manager';
import FilePreviewModal from './FilePreviewModal';
import { Services } from '../../services/page';
import { Files, SelectedFiles, useFileManagerContext } from "../FileManagerContext";
import { DownloadIcon } from '@/components/Icons';
import { useAppContext } from '@/app/context/AppContext';
import ManualPayment from './ManualPayment';
import UpgradeServicePopup from './UpgradeServicePopup';
import PayInvoiceModal from './PayInvoiceModal';
import AgentNotificationModal from './AgentNotificationModal';
import PhotoPreviewModal from './PhotoPreviewModal';
import DownloadModal from './DownloadModal';
import { toast } from 'sonner';
type Props = {
    orderData: Order | null;
    currentService?: Services;
    isListing: boolean;
    reviewFilesEnabled?: boolean;
};
const Service: React.FC<Props> = ({ orderData, currentService, isListing, reviewFilesEnabled }) => {
    const { floorFiles, setFloorFiles, filesData, setFilesData, setChangedFileUuids } = useFileManagerContext();
    const [replacingFile, setReplacingFile] = useState<File | null>(null);
    const [openPreview, setOpenPreview] = useState(false);
    const [area, setArea] = useState<Area[]>([]);
    const [mediaUploaded, setMediaUploaded] = useState<boolean>(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [showAgain, setShowAgain] = useState(true);
    const [open, setOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const [openPayment, setOpenPayment] = useState(false);
    const [success, setSuccess] = useState(false);
    const [openUpgrade, setOpenUpgrade] = useState(false);
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [dragging, setDragging] = useState(false);
    const [imagePopupOpen, setImagePopupOpen] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
    const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
    const { userType } = useAppContext()
    const dragCounter = useRef(0);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [editingFile, setEditingFile] = useState<SelectedFiles | Files | null>(null);
    const floorPlans = [
        "Dimensions PDF", "Branded Floor Plan", "UnBranded Floor Plan",
        "Branded Image", "Unbranded Image", "Additional Files"
    ];

    const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

    const confirmAndExecute = () => {
        pendingAction?.();
        setPendingAction(null);
    };
    useEffect(() => {
        setArea(orderData?.areas ?? []);
    }, [orderData]);

    // const handleFilesChange = (selectedFiles: File[]) => {
    //     if (selectedFiles.length === 0) return;

    //     const newFile = selectedFiles[0];

    //     if (replacingFile) {
    //         setFloorFiles(prev =>
    //             prev.map(f =>
    //                 f.file === replacingFile ? { ...f, file: newFile } : f
    //             )
    //         );
    //         setReplacingFile(null);
    //         setSelectedPreviewFile(null);
    //         setTitle('');
    //         return;
    //     }
    //     setFiles(selectedFiles);
    // };

    // Filter existing files
    let currentServiceFiles = filesData?.files
        ?.filter(file => file?.service?.uuid === currentService?.uuid)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // If Agent, only show files marked to show
    if (userType === 'agent') {
        currentServiceFiles = currentServiceFiles?.filter(file => file.is_show !== false);
    }

    // If Agent and review is enabled, only show approved files
    if (userType === 'agent' && reviewFilesEnabled) {
        currentServiceFiles = currentServiceFiles?.filter(file => file.is_admin_approved);
    }

    const hasUnsavedFiles = floorFiles.some(file =>
        file.service_id === currentService?.uuid && (userType !== 'agent' || file.is_show !== false)
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAddPayment = (paymentData: any) => {
        console.log("Payment Added:", paymentData);
        setSuccess(true);
    };




    const handleFilesChange = (selectedFiles: File[]) => {
        const validFiles = selectedFiles.filter(file => !file.type.startsWith('video/'));
        const hasVideo = selectedFiles.some(file => file.type.startsWith('video/'));

        if (hasVideo) {
            toast.error("Video files are not allowed here.");
        }

        if (validFiles.length === 0) return;

        const renamedFiles = validFiles.map(file => {
            const randomId = Math.floor(100000 + Math.random() * 900000);
            const ext = file.name.split('.').pop();
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const newName = `${baseName}_${randomId}.${ext}`;

            return new File([file], newName, { type: file.type });
        });

        const newFile = renamedFiles[0];

        if (replacingFile) {
            setFloorFiles(prev =>
                prev.map(f =>
                    f.file === replacingFile ? { ...f, file: newFile } : f
                )
            );
            setReplacingFile(null);
            return;
        }

        setFiles(renamedFiles);
    };

    useEffect(() => {
        if (files.length > 0) {
            setOpenPreview(true);
        }

    }, [files])

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setDragging(false);
        dragCounter.current = 0;

        const droppedFiles = Array.from(e.dataTransfer?.files || []);

        handleFilesChange(droppedFiles);
        // eslint-disable-next-line
    }, []);

    const handleDragEnter = useCallback((e: DragEvent) => {
        e.preventDefault();
        dragCounter.current += 1;
        setDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        dragCounter.current -= 1;
        if (dragCounter.current === 0) {
            setDragging(false);
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

    const currentBookedService = orderData?.services.find((service) => service.service.uuid === currentService?.uuid)
    const currentSlot = orderData?.slots?.find((slot) => slot.service_id === currentService?.id);
    const vendor = currentSlot?.vendor || orderData?.vendor;
    const vendorName = vendor ? `${vendor.first_name} ${vendor.last_name}` : "Taylor Tayburn";


    const handleImageClick = (imageUrl: string, file: SelectedFiles | Files) => {
        setSelectedImageUrl(imageUrl);
        setEditingFile(file);
        setImagePopupOpen(true);
    };

    const handledownloadFile = async (fileUuid: string, fileName: string) => {
        try {
            const token = localStorage.getItem('token') ?? "";

            const response = await DownloadFile(token, fileUuid);

            if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error('Download error:', err);
            toast.error('Download failed. Please try again.');

        }
    };

    useEffect(() => {
        const checkServiceCompletion = async () => {
            const token = localStorage.getItem("token");
            // Count only agent approved files
            const numberOfApprovedFiles = currentServiceFiles?.filter(f => f.is_agent_approved).length ?? 0

            if (numberOfApprovedFiles >= (currentBookedService?.option?.quantity ?? 1)) {
                if (token && currentBookedService?.uuid && orderData?.uuid && !currentBookedService?.is_completed) {
                    await ServiceCompletion(token, currentBookedService.uuid, true, orderData.uuid)
                }
            }
        };
        checkServiceCompletion();
    }, [currentServiceFiles, currentService, currentBookedService, orderData])

    return (
        <div>
            {!isListing &&
                <div
                    className='w-full justify-between h-[65px] font-alexandria pr-5 z-10 flex items-center border-b border-[#BBBBBB] px-6 overflow-visible'
                    style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                >
                    {dragging && userType !== 'agent' && (
                        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center backdrop-blur-sm">
                            <div className="bg-white/20 border-2 border-dashed border-white rounded-3xl p-20 flex flex-col items-center gap-6 animate-in zoom-in duration-300">
                                <div className={`${userType}-bg p-6 rounded-full shadow-2xl`}>
                                    <DownloadIcon width="48px" height="48px" fill="#fff" />
                                </div>
                                <p className="text-3xl font-bold text-white tracking-wide">Drop floor plans here to upload</p>
                                <p className="text-white/80 text-lg">Support for images and high-quality files</p>
                            </div>
                        </div>
                    )}
                    <div>
                        {(userType !== 'agent') &&
                            <Button onClick={() => fileInputRef.current?.click()} className={`w-[150px] md:w-[143px] h-[32px] md:h-[32px]  justify-center rounded-[6px] font-raleway border-[1px] ${userType}-border ${userType}-bg text-[14px] md:text-[16px] font-[600] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover-${userType}-bg`}>Add File</Button>
                        }
                    </div>
                    <div>
                        <p className='flex flex-col items-center'><span className={`${userType}-text font-bold`}>{currentService ? currentService.name : ''}</span>
                            <span className='text-[12px] text-[#7D7D7D]'>{currentBookedService?.option?.title}</span>

                        </p>
                    </div>
                    <div className='flex items-center gap-x-[14px]'>
                        {/* <Button className='w-[150px] md:w-[143px] h-[32px] md:h-[32px]  justify-center rounded-[6px] font-raleway border-[1px] border-[#4290E9] bg-[#4290E9] text-[14px] md:text-[16px] font-[600] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover:bg-[#4290E9]'>Download All File</Button> */}
                        <div className='flex justify-center items-center gap-x-[14px]'>
                            {(userType === 'agent') && currentBookedService?.payment_status === "PAID" && (
                                <Button
                                    onClick={() => {
                                        setShowDownloadModal(true);
                                    }}
                                    className={`${userType}-bg hover-${userType}-bg h-[32px] w-[150px] flex justify-center items-center cursor-pointer`}
                                >
                                    Download Files
                                </Button>
                            )}
                            {userType === 'admin' && (
                                <Button
                                    onClick={() => {
                                        setShowDownloadModal(true);
                                    }}
                                    className={`${userType}-bg hover-${userType}-bg h-[32px] w-[150px] flex justify-center items-center cursor-pointer`}
                                >
                                    Download Files
                                </Button>
                            )}
                            {userType !== 'agent' &&
                                <Button
                                    onClick={() => {
                                        setMediaUploaded(true);
                                        setShowEmailConfirmation(true)
                                        // setSelectedFiles(prev =>
                                        //  prev.map(file => ({ ...file, upload: true }))
                                        // );
                                    }}
                                    className={`${mediaUploaded ? "bg-[#6BAE41] hover:bg-[#7dc94f]" : `${userType}-bg hover-${userType}-bg`} h-[32px] w-[150px] flex justify-center items-center `}>{mediaUploaded ? <Check color="#fff" size={14} /> : 'Submit to Client'} </Button>
                            }
                            <AgentNotificationModal
                                open={showEmailConfirmation}
                                onClose={() => setShowEmailConfirmation(false)}
                                serviceDate={currentService ? currentService : null}
                                orderData={orderData ? orderData : null}
                            />
                            {userType === 'agent' &&
                                <div className='flex flex-col justify-center items-center mr-4'>
                                    <p className='text-[18px] text-[#6BAE41]'>${currentBookedService?.option?.amount}</p>
                                    <p className='text-[#7D7D7D] text-[12px]'>{currentBookedService?.option?.title}</p>
                                </div>
                            }
                            {userType === 'agent' &&
                                <Button
                                    // onClick={() => setOpenPaymentModal(true)}
                                    className={`h-[32px] w-[150px] flex justify-center items-center 
                                                                         ${paymentSuccess
                                            ? "bg-[#6BAE41] hover:bg-[#5fa43a]"
                                            : "bg-[#DC9600] hover:bg-[#eda304]"}`
                                    }>{currentBookedService?.payment_status == 'PAID' ? 'Paid' : 'UnPaid'}</Button>
                            }
                            <PayInvoiceModal open={openPaymentModal} setOpen={setOpenPaymentModal} success={paymentSuccess} setSuccess={setPaymentSuccess} />
                            {userType === 'admin' && <div className="pl-4">
                                {!success ? (
                                    <Button
                                        onClick={() => setOpenPayment(true)}
                                        className="bg-[#4290E9] text-white hover:bg-[#4999f5] cursor-pointer  h-[32px]"
                                    >
                                        Add Manual Payment
                                    </Button>
                                ) : (
                                    <Button
                                        // disabled
                                        className="bg-[#6BAE41] hover:bg-[#7dc94f]  text-white  h-[32px] flex items-center gap-2 cursor-default"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        Payment Added
                                    </Button>
                                )}

                                {/* Popup */}
                                <ManualPayment open={openPayment} setOpen={setOpenPayment} addPayment={handleAddPayment} />
                            </div>}
                        </div>
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            multiple
                            ref={fileInputRef}
                            className="hidden"
                            onChange={(e) => {
                                const selected = Array.from(e.target.files || []);
                                handleFilesChange(selected);
                            }}
                        />
                        <FilePreviewModal type='floor_plans' open={openPreview} onOpenChange={() => { setOpenPreview(false) }} files={files} setSelectedFiles={setFloorFiles} serviceUuid={currentService?.uuid || ""} reviewFilesEnabled={reviewFilesEnabled} />
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
                            // Refresh the page to get updated order data
                            window.location.reload()
                        }}
                    />
                </div>}
            <div className='px-[200px] pt-[54px]'>
                <div className='px-[80px] pb-[60px] gap-y-6'>
                    <p className={`font-semibold text-lg ${userType}-text uppercase`}>Square Footage</p>
                    <div className="flex justify-center">
                        <div className="grid grid-cols-2 w-[700px] gap-y-4 text-[15px] font-normal text-[#666666] px-[66px] pt-6">
                            <div className='flex justify-between pr-10'>
                                <span>Total Square Footage</span>
                                <span>
                                    {area?.reduce((acc, area) => acc + Number(area.footage || 0), 0)} FT²
                                </span>
                            </div>
                            {area?.map((area) => (
                                <div key={area.uuid} className='flex justify-between pr-10'>
                                    <span>{area.type}</span>
                                    <span>{area.footage} FT²</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className='flex items-center justify-end pt-6'>
                        <Button onClick={() => setOpen(true)} className={`w-[150px] md:w-[143px] h-[32px] md:h-[32px]  justify-center rounded-[6px] font-raleway border-[1px] ${userType}-border ${userType}-bg text-[14px] md:text-[16px] font-[600] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover-${userType}-bg`}>Edit</Button>
                    </div>
                </div>
            </div>
            <div className='w-full py-[54px] flex flex-col items-center'>
                <Accordion type="multiple" defaultValue={['unsaved', 'saved']} className="w-[80%]">
                    {hasUnsavedFiles && (
                        <AccordionItem value="unsaved">
                            <AccordionTrigger className={`text-lg font-semibold uppercase ${userType}-text`}>Unsaved Images</AccordionTrigger>
                            <AccordionContent>
                                <div className='grid grid-cols-3 gap-y-7 pt-4'>
                                    {(() => {
                                        let otherFiles = floorFiles.filter(file => file.type !== "Additional Files" && file.service_id === currentService?.uuid);
                                        let additionalFiles = floorFiles.filter(file => file.type === "Additional Files" && file.service_id === currentService?.uuid);

                                        if (userType === 'agent') {
                                            otherFiles = otherFiles.filter(file => file.is_show !== false);
                                            additionalFiles = additionalFiles.filter(file => file.is_show !== false);
                                        }

                                        return (
                                            <>
                                                {otherFiles.map((file, idx) => (
                                                    <div key={idx} className='justify-self-center group'>
                                                        <div>
                                                            <p className='uppercase text-lg font-semibold text-[#4290E9] pl-3 pb-2'>{file.type}</p>
                                                            <div
                                                                className="relative w-[280px] h-[175px] border border-[#A8A8A8] rounded-[6px]"
                                                                style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                                            >
                                                                <div className="absolute inset-0 overflow-hidden rounded-[6px]">
                                                                    {/* eslint-disable @next/next/no-img-element */}
                                                                    <img
                                                                        src={URL.createObjectURL(file.file)}
                                                                        alt="Preview"
                                                                        className={`object-contain h-auto w-full cursor-pointer transition-all duration-300 ${file.is_deleted ? 'blur-[2px] opacity-40 grayscale' : (!file.is_admin_approved && reviewFilesEnabled && userType === 'admin' ? 'opacity-70' : '')}`}
                                                                        onClick={() => {
                                                                            if (file.is_deleted) return;
                                                                            handleImageClick(URL.createObjectURL(file.file), file);
                                                                        }}
                                                                    />
                                                                    {file.is_deleted && (
                                                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 z-[30] gap-2">
                                                                            <p className="text-white font-medium text-lg drop-shadow-lg uppercase mb-4">Deleted</p>
                                                                            <Button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setFloorFiles(prev =>
                                                                                        prev.map(f => {
                                                                                            if (file.file === f.file) {
                                                                                                return { ...f, is_deleted: false };
                                                                                            }
                                                                                            return f;
                                                                                        })
                                                                                    );
                                                                                }}
                                                                                className="bg-white text-black hover:bg-gray-100 h-7 px-3 text-[10px] font-bold rounded-full shadow-lg"
                                                                            >
                                                                                Restore
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {userType !== 'agent' && (
                                                                    <span
                                                                        className={`cursor-pointer absolute top-0 right-0 w-[60px] h-[60px] flex justify-end items-start p-[10px] transition-opacity duration-300`}
                                                                        style={{
                                                                            clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                                                                            backgroundColor: `${file.is_show !== false ? "#6BAE41" : "#E06D5E"}`,
                                                                        }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setFloorFiles(prev =>
                                                                                prev.map(f => {
                                                                                    if (file.file === f.file) {
                                                                                        return { ...f, is_show: f.is_show === false ? true : false };
                                                                                    }
                                                                                    return f;
                                                                                })
                                                                            );
                                                                        }}
                                                                    >
                                                                        {file.is_show !== false ? <Check color="#fff" size={14} /> : <X color="#fff" size={14} />}
                                                                    </span>
                                                                )}
                                                                {!file.is_deleted && (
                                                                    <div
                                                                        className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-500 rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-300 z-[20] shadow-md hover:scale-110"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setFloorFiles(prev =>
                                                                                prev.map(f => {
                                                                                    if (file.file === f.file) {
                                                                                        return { ...f, is_deleted: true };
                                                                                    }
                                                                                    return f;
                                                                                })
                                                                            );
                                                                        }}
                                                                    >
                                                                        <X color="white" size={14} strokeWidth={3} />
                                                                    </div>
                                                                )}
                                                                {userType === 'admin' && reviewFilesEnabled && (
                                                                    <div
                                                                        className="absolute top-2 left-2 z-10 cursor-pointer bg-white/80 p-1 rounded"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setFloorFiles(prev =>
                                                                                prev.map(f =>
                                                                                    f.file === file.file ? { ...f, is_admin_approved: !f.is_admin_approved } : f
                                                                                )
                                                                            );
                                                                        }}
                                                                    >
                                                                        <div className={`w-4 h-4 border rounded mr-1 flex items-center justify-center ${file.is_admin_approved ? `${userType}-bg ${userType}-border` : 'bg-white border-[#7D7D7D]'}`}>
                                                                            {file.is_admin_approved && <Check color="white" size={12} />}
                                                                        </div>
                                                                        <span className="text-[10px] font-bold text-[#7D7D7D]">Approved</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div
                                                            className='grid grid-cols-4 gap-2 justify-between items-center px-2 py-1 text-[9px]'
                                                            style={{ backgroundColor: `var(--${userType}-page-bg, #ffffff)` }}
                                                        >
                                                            <p className="col-span-2 text-[#8E8E8E] mt-1 truncate">Uploaded by: {vendorName}</p>
                                                            <div className='col-span-2 flex items-center justify-between'>
                                                                <p className='text-[#8E8E8E] mt-1'>05/15/2025</p>
                                                                <span
                                                                    className='flex w-[24px] h-[24px] cursor-not-allowed opacity-50'>
                                                                    <DownloadIcon width='24px' height='24px' fill='#6BAE41' />
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {additionalFiles && additionalFiles.length > 0 && (
                                                    <div className="col-span-3">
                                                        <p className='uppercase text-lg font-semibold text-[#4290E9] pl-3 ml-11 pb-2'>Additional Files</p>
                                                        <div className="grid grid-cols-3 gap-6">
                                                            {additionalFiles.map((file, idx) => (
                                                                <div key={idx} className='justify-self-center group'>
                                                                    <div
                                                                        className="relative w-[280px] h-[175px] border border-[#A8A8A8] rounded-[6px] overflow-hidden"
                                                                        style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                                                    >
                                                                        {/* eslint-disable @next/next/no-img-element */}
                                                                        <img
                                                                            src={URL.createObjectURL(file.file)}
                                                                            alt="Preview"
                                                                            className={`object-contain h-auto w-full cursor-pointer transition-all duration-300 ${file.is_deleted ? 'blur-[2px] opacity-40 grayscale' : (!file.is_admin_approved && reviewFilesEnabled && userType === 'admin' ? 'opacity-70' : '')}`}
                                                                            onClick={() => {
                                                                                if (file.is_deleted) return;
                                                                                handleImageClick(URL.createObjectURL(file.file), file);


                                                                            }}
                                                                        />
                                                                        {file.is_deleted && (
                                                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 z-[30] gap-2">
                                                                                <p className="text-white font-medium text-lg drop-shadow-lg uppercase mb-4">Deleted</p>
                                                                                <Button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setFloorFiles(prev =>
                                                                                            prev.map(f => {
                                                                                                if (file.file === f.file) {
                                                                                                    return { ...f, is_deleted: false };
                                                                                                }
                                                                                                return f;
                                                                                            })
                                                                                        );
                                                                                    }}
                                                                                    className="bg-white text-black hover:bg-gray-100 h-7 px-3 text-[10px] font-bold rounded-full shadow-lg"
                                                                                >
                                                                                    Restore
                                                                                </Button>
                                                                            </div>
                                                                        )}
                                                                        {userType !== 'agent' && (
                                                                            <span
                                                                                className={`cursor-pointer absolute top-0 right-0 w-[60px] h-[60px] flex justify-end items-start p-[10px] transition-opacity duration-300`}
                                                                                style={{
                                                                                    clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                                                                                    backgroundColor: `${file.is_show !== false ? "#6BAE41" : "#E06D5E"}`,
                                                                                }}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setFloorFiles(prev =>
                                                                                        prev.map(f => {
                                                                                            if (file.file === f.file) {
                                                                                                return { ...f, is_show: f.is_show === false ? true : false };
                                                                                            }
                                                                                            return f;
                                                                                        })
                                                                                    );
                                                                                }}
                                                                            >
                                                                                {file.is_show !== false ? <Check color="#fff" size={14} /> : <X color="#fff" size={14} />}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div
                                                                        className='grid grid-cols-4 gap-2 justify-between items-center px-2 py-1 text-[9px]'
                                                                        style={{ backgroundColor: `var(--${userType}-page-bg, #ffffff)` }}
                                                                    >
                                                                        <p className="col-span-2 text-[#8E8E8E] mt-1 truncate">Uploaded by: {vendorName}</p>
                                                                        <div className='col-span-2 flex items-center justify-between'>
                                                                            <p className='text-[#8E8E8E] mt-1'>05/15/2025</p>
                                                                            <span
                                                                                className='flex w-[24px] h-[24px] cursor-not-allowed opacity-50'>
                                                                                <DownloadIcon width='24px' height='24px' fill='#6BAE41' />
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    <AccordionItem value="saved">
                        <AccordionTrigger className={`text-lg font-semibold uppercase ${userType}-text`}>Saved Images</AccordionTrigger>
                        <AccordionContent>
                            <div className='grid grid-cols-3 gap-y-7 pt-4'>
                                {(() => {
                                    const otherApiFiles = currentServiceFiles?.filter(file => file.group !== "Additional Files");
                                    const additionalApiFiles = currentServiceFiles?.filter(file => file.group === "Additional Files");

                                    return (
                                        <>
                                            {otherApiFiles?.map((file, idx) => (
                                                <div key={idx} className='justify-self-center group'>
                                                    <div>
                                                        <p className={`uppercase text-lg font-semibold ${userType}-text pl-3 pb-2`}>{file.type}</p>
                                                        <div
                                                            className="relative w-[280px] h-[175px] border border-[#A8A8A8] rounded-[6px] overflow-hidden"
                                                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                                        >
                                                            {/* eslint-disable @next/next/no-img-element */}
                                                            <img
                                                                src={`${API_URL}/${file.file_path}`}
                                                                onClick={() => handleImageClick(`${API_URL}/${file.file_path}`, file)}
                                                                alt="Preview"
                                                                className={`object-contain h-auto w-full cursor-pointer ${!file.is_admin_approved && reviewFilesEnabled && userType === 'admin' ? 'opacity-70' : ''}`}
                                                            />
                                                            {userType !== 'agent' && (
                                                                <span
                                                                    className={`cursor-pointer absolute top-0 right-0 w-[60px] h-[60px] flex justify-end items-start p-[10px] transition-opacity duration-300`}
                                                                    style={{
                                                                        clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                                                                        backgroundColor: `${file.is_show !== false ? "#6BAE41" : "#E06D5E"}`,
                                                                    }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setFilesData(prev => {
                                                                            if (!prev) return prev;
                                                                            return {
                                                                                ...prev,
                                                                                files: prev.files.map(f => {
                                                                                    if (f.uuid === file.uuid) {
                                                                                        setChangedFileUuids(prevSet => {
                                                                                            const newSet = new Set(prevSet);
                                                                                            newSet.add(f.uuid);
                                                                                            return newSet;
                                                                                        });
                                                                                        return { ...f, is_show: f.is_show === false ? true : false };
                                                                                    }
                                                                                    return f;
                                                                                })
                                                                            };
                                                                        });
                                                                    }}
                                                                >
                                                                    {file.is_show !== false ? <Check color="#fff" size={14} /> : <X color="#fff" size={14} />}
                                                                </span>
                                                            )}
                                                            {/* Admin Approved Checkbox */}
                                                            {userType === 'admin' && reviewFilesEnabled && (
                                                                <div
                                                                    className="absolute bottom-2 left-2 z-10 flex items-center bg-white/80 p-1 rounded cursor-pointer"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setFilesData(prev => {
                                                                            if (!prev) return prev;
                                                                            return {
                                                                                ...prev,
                                                                                files: prev.files.map(f => {
                                                                                    if (f.uuid === file.uuid) {
                                                                                        setChangedFileUuids(prevSet => {
                                                                                            const newSet = new Set(prevSet);
                                                                                            newSet.add(f.uuid);
                                                                                            return newSet;
                                                                                        });
                                                                                        return { ...f, is_admin_approved: !f.is_admin_approved };
                                                                                    }
                                                                                    return f;
                                                                                })
                                                                            };
                                                                        });
                                                                    }}
                                                                >
                                                                    <div className={`w-4 h-4 border rounded mr-1 flex items-center justify-center ${file.is_admin_approved ? `${userType}-bg ${userType}-border` : 'bg-white border-[#7D7D7D]'}`}>
                                                                        {file.is_admin_approved && <Check color="white" size={12} />}
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-[#7D7D7D]">Approved</span>
                                                                </div>
                                                            )}

                                                            {/* Agent Approved Checkbox */}
                                                            {userType === 'agent' && (
                                                                <div
                                                                    className="absolute bottom-2 left-2 z-10 flex items-center bg-white/80 p-1 rounded cursor-pointer"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setFilesData(prev => {
                                                                            if (!prev) return prev;
                                                                            return {
                                                                                ...prev,
                                                                                files: prev.files.map(f => {
                                                                                    if (f.uuid === file.uuid) {
                                                                                        setChangedFileUuids(prevSet => {
                                                                                            const newSet = new Set(prevSet);
                                                                                            newSet.add(f.uuid);
                                                                                            return newSet;
                                                                                        });
                                                                                        return { ...f, is_agent_approved: !f.is_agent_approved };
                                                                                    }
                                                                                    return f;
                                                                                })
                                                                            };
                                                                        });
                                                                    }}
                                                                >
                                                                    <div className={`w-4 h-4 border rounded mr-1 flex items-center justify-center ${file.is_agent_approved ? `${userType}-bg ${userType}-border` : 'bg-white border-[#7D7D7D]'}`}>
                                                                        {file.is_agent_approved && <Check color="white" size={12} />}
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-[#7D7D7D]">Approved</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div
                                                        className='grid grid-cols-4 gap-2 justify-between items-center px-2 py-1 text-[9px]'
                                                        style={{ backgroundColor: `var(--${userType}-page-bg, #ffffff)` }}
                                                    >
                                                        <p className="col-span-2 text-[#8E8E8E] mt-1 truncate">Uploaded by: {vendorName}</p>
                                                        <div className='col-span-2 flex items-center justify-between'>
                                                            <p className='text-[#8E8E8E] mt-1'>05/15/2025</p>
                                                            {userType === 'agent' && currentBookedService?.payment_status === "PAID" &&
                                                                <span
                                                                    onClick={() => handledownloadFile(file.uuid, file.name)}
                                                                    className='flex w-[24px] h-[24px] cursor-pointer'>
                                                                    <DownloadIcon width='24px' height='24px' fill='#6BAE41' />
                                                                </span>}
                                                        </div>
                                                    </div>

                                                </div>
                                            ))}

                                            {additionalApiFiles && additionalApiFiles?.length > 0 && (
                                                <div className="col-span-3">
                                                    <p className='uppercase text-lg font-semibold text-[#4290E9] pl-3 ml-11 pb-2'>Additional Files</p>
                                                    <div className="grid grid-cols-3 gap-6">
                                                        {additionalApiFiles?.map((file, idx) => (
                                                            <div key={idx} className='justify-self-center group'>
                                                                <div
                                                                    className="relative w-[280px] h-[175px] border border-[#A8A8A8] rounded-[6px] overflow-hidden"
                                                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                                                >
                                                                    {/* eslint-disable @next/next/no-img-element */}
                                                                    <img
                                                                        src={`${API_URL}/${file.file_path}`}
                                                                        alt="Preview"
                                                                        onClick={() => handleImageClick(`${API_URL}/${file.file_path}`, file)}
                                                                        className={`object-contain h-auto w-full cursor-pointer ${!file.is_admin_approved && reviewFilesEnabled && userType === 'admin' ? 'opacity-70' : ''}`}
                                                                    />
                                                                    {userType !== 'agent' && (
                                                                        <span
                                                                            className={`cursor-pointer absolute top-0 right-0 w-[60px] h-[60px] flex justify-end items-start p-[10px] transition-opacity duration-300`}
                                                                            style={{
                                                                                clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                                                                                backgroundColor: `${file.is_show !== false ? "#6BAE41" : "#E06D5E"}`,
                                                                            }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setFilesData(prev => {
                                                                                    if (!prev) return prev;
                                                                                    return {
                                                                                        ...prev,
                                                                                        files: prev.files.map(f => {
                                                                                            if (f.uuid === file.uuid) {
                                                                                                setChangedFileUuids(prevSet => {
                                                                                                    const newSet = new Set(prevSet);
                                                                                                    newSet.add(f.uuid);
                                                                                                    return newSet;
                                                                                                });
                                                                                                return { ...f, is_show: f.is_show === false ? true : false };
                                                                                            }
                                                                                            return f;
                                                                                        })
                                                                                    };
                                                                                });
                                                                            }}
                                                                        >
                                                                            {file.is_show !== false ? <Check color="#fff" size={14} /> : <X color="#fff" size={14} />}
                                                                        </span>
                                                                    )}
                                                                    {userType === 'admin' && reviewFilesEnabled && (
                                                                        <div
                                                                            className="absolute top-2 left-2 z-10 cursor-pointer bg-white/80 p-1 rounded"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setFilesData(prev => {
                                                                                    if (!prev) return prev;
                                                                                    return {
                                                                                        ...prev,
                                                                                        files: prev.files.map(f => {
                                                                                            if (f.uuid === file.uuid) {
                                                                                                setChangedFileUuids(prevSet => {
                                                                                                    const newSet = new Set(prevSet);
                                                                                                    newSet.add(f.uuid);
                                                                                                    return newSet;
                                                                                                });
                                                                                                return { ...f, is_admin_approved: !f.is_admin_approved };
                                                                                            }
                                                                                            return f;
                                                                                        })
                                                                                    };
                                                                                });
                                                                            }}
                                                                        >
                                                                            <div className={`w-4 h-4 border rounded mr-1 flex items-center justify-center ${file.is_admin_approved ? `${userType}-bg ${userType}-border` : 'bg-white border-[#7D7D7D]'}`}>
                                                                                {file.is_admin_approved && <Check color="white" size={12} />}
                                                                            </div>
                                                                            <span className="text-[10px] font-bold text-[#7D7D7D]">Approved</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div
                                                                    className='grid grid-cols-4 gap-2 justify-between items-center px-2 py-1 text-[9px]'
                                                                    style={{ backgroundColor: `var(--${userType}-page-bg, #ffffff)` }}
                                                                >
                                                                    <p className="col-span-2 text-[#8E8E8E] mt-1 truncate">Uploaded by: {vendorName}</p>
                                                                    <div className='col-span-2 flex items-center justify-between'>
                                                                        <p className='text-[#8E8E8E] mt-1'>05/15/2025</p>
                                                                        <span
                                                                            onClick={() => handledownloadFile(file.uuid, file.name)}
                                                                            className='flex w-[24px] h-[24px] cursor-pointer'>
                                                                            <DownloadIcon width='24px' height='24px' fill='#6BAE41' />
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
            <ConfirmationDialog
                open={showConfirmation}
                setOpen={setShowConfirmation}
                onConfirm={confirmAndExecute}
                showAgain={showAgain}
                toggleShowAgain={() => setShowAgain(!showAgain)}
            />
            <HouseSheetModal
                setArea={setArea}
                uuid={orderData?.uuid}
                open={open}
                setOpen={setOpen}
            />
            <PhotoPreviewModal
                open={imagePopupOpen}
                onClose={() => {
                    setImagePopupOpen(false);
                    setEditingFile(null);
                }}
                file={selectedImageUrl}
                title={editingFile ? (('file' in editingFile) ? editingFile.type : (editingFile as Files).group || (editingFile as Files).type || '2D Floor Plan') : '2D Floor Plan'}
                initialName={editingFile ? (('file' in editingFile) ? editingFile.type : (editingFile as Files).group || (editingFile as Files).type || '2D Floor Plan') : ''}
                onSave={(newName) => {
                    if (!editingFile) return;

                    if ('file' in editingFile) {
                        // Unsaved
                        setFloorFiles(prev => prev.map(f => {
                            if (f.file === editingFile.file) {
                                return { ...f, type: newName };
                            }
                            return f;
                        }));
                    } else {
                        // Saved
                        setFilesData(prev => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                files: prev.files.map(f => {
                                    if (f.uuid === editingFile.uuid) {
                                        setChangedFileUuids(prevSet => {
                                            const newSet = new Set(prevSet);
                                            newSet.add(f.uuid);
                                            return newSet;
                                        });
                                        return { ...f, group: newName };
                                    }
                                    return f;
                                })
                            };
                        });
                    }
                }}
                onDelete={editingFile && 'file' in editingFile ? () => {
                    setFloorFiles(prev => prev.map(f =>
                        f.file === editingFile.file ? { ...f, is_deleted: true } : f
                    ));
                } : undefined}
                onReplace={editingFile && 'file' in editingFile ? () => {
                    setReplacingFile(editingFile.file);
                    fileInputRef.current?.click();
                } : undefined}
                suggestions={floorPlans}
            />
            <DownloadModal
                open={showDownloadModal}
                onClose={() => setShowDownloadModal(false)}
                // localFiles={floorFiles}
                apiFiles={currentServiceFiles || []}
            />
        </div>
    )
}

export default Service