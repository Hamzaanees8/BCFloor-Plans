'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import CopyableFileName from './CopyableFileName';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import FilePreviewModal from './FilePreviewModal';
import { Check, CheckCircle2, X, PlayCircle } from 'lucide-react';
import { DownloadIcon } from '@/components/Icons';
import { Button } from '@/components/ui/button';
import FileUploader from './FileUploader';
import { Services } from '../../services/page';
import { Files, SelectedFiles, useFileManagerContext } from "../FileManagerContext";
import { toast } from 'sonner';
import ManualPayment from './ManualPayment';
import { useAppContext } from '@/app/context/AppContext';
import { Order } from '../../orders/page';
import UpgradeServicePopup from './UpgradeServicePopup';
import PayInvoiceModal from './PayInvoiceModal';
import AgentNotificationModal from './AgentNotificationModal';
import DownloadModal from './DownloadModal';
import PhotoPreviewModal from './PhotoPreviewModal';
import { DownloadFile, ServiceCompletion } from '../file-manager';
import { OptimizedImagePreview } from './OptimizedPreview';


function Video({ currentService, orderData, isListing, reviewFilesEnabled, onSave }: { currentService?: Services, orderData: Order | null, isListing?: boolean, reviewFilesEnabled?: boolean, onSave?: () => void }) {
    const [files, setFiles] = useState<File[]>([]);
    const [mediaUploaded, setMediaUploaded] = useState<boolean>(false);
    const [open, setOpen] = useState(false);
    const [openPayment, setOpenPayment] = useState(false);
    const [success, setSuccess] = useState(false);
    const [openUpgrade, setOpenUpgrade] = useState(false);
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const { selectedVideoFiles, setSelectedVideoFiles, filesData, setChangedFileUuids, setFilesData } = useFileManagerContext();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [dragging, setDragging] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [imagePopupOpen, setImagePopupOpen] = useState(false);
    const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>('');
    const [editingFile, setEditingFile] = useState<SelectedFiles | Files | null>(null);
    const [replacingFile, setReplacingFile] = useState<File | null>(null);
    const dragCounter = useRef(0);
    const { userType } = useAppContext()

    const videoOptions = [
        "Branded Video", "Unbranded Video", "Social Media Teaser", "Reel / Short", "Aerial Highlight"
    ];

    const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

    // Filter existing files
    let currentServiceFiles = filesData?.files
        ?.filter(file => file?.service?.uuid === currentService?.uuid && file.type === "video")
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // If Agent, only show files marked to show
    if (userType === 'agent') {
        currentServiceFiles = currentServiceFiles?.filter(file => file.is_show !== false);
    }

    // If Agent and review is enabled, only show approved files
    if (userType === 'agent' && reviewFilesEnabled) {
        currentServiceFiles = currentServiceFiles?.filter(file => file.is_admin_approved);
    }

    const currentBookedService = orderData?.services.find((service) => service.service.uuid === currentService?.uuid)
    if (userType === 'agent' && reviewFilesEnabled) {
        currentServiceFiles = currentServiceFiles?.filter(file => file.is_admin_approved);
    }


    const handleFileInputClick = () => {
        setFiles([])
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        const videoFiles = selected.filter(file => file.type.startsWith('video/'));
        if (videoFiles.length > 0) {
            if (replacingFile) {
                setSelectedVideoFiles(prev => prev.map(f => {
                    if (f.file === replacingFile) {
                        return { ...f, file: videoFiles[0] };
                    }
                    return f;
                }));
                setReplacingFile(null);
                setFiles([]);
                return;
            }
            setFiles(videoFiles);
        }
    };

    const handleFilesChange = (selectedVideoFiles: File[]) => {
        setFiles(selectedVideoFiles);
    };

    useEffect(() => {
        if (files.length > 0) {
            setOpen(true);
        }

    }, [files])
    const filesForService = selectedVideoFiles.filter(f => f.service_id === currentService?.uuid);

    const handleVideoClick = (url: string, file: SelectedFiles | Files) => {
        setSelectedVideoUrl(url);
        setEditingFile(file);
        setImagePopupOpen(true);
    };

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setDragging(false);
        dragCounter.current = 0;

        if (userType === 'agent') {
            return;
        }

        const droppedFiles = Array.from(e.dataTransfer?.files || []);
        const videoFiles = droppedFiles.filter(file => file.type.startsWith('video/'));
        const invalidFiles = droppedFiles.filter(file => !file.type.startsWith('video/'));

        if (invalidFiles.length > 0) {
            toast.error("Only video files are allowed.")
        }

        if (videoFiles.length > 0) {
            handleFilesChange(videoFiles);
        }
    }, [userType]);


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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAddPayment = (paymentData: any) => {
        console.log("Payment Added:", paymentData);
        setSuccess(true);
    };


    const handledownloadFile = async (fileUuid: string, fileName: string) => {
        try {
            const token = localStorage.getItem('token') ?? "";

            const response = await DownloadFile(token, fileUuid);

            if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);

            // Convert the response directly to blob
            const blob = await response.blob();

            // Create a temporary URL and trigger download
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
    return (
        <div>
            {dragging && !isListing && userType !== 'agent' && (
                <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white/20 border-2 border-dashed border-white rounded-3xl p-20 flex flex-col items-center gap-6 animate-in zoom-in duration-300">
                        <div className={`${userType}-bg p-6 rounded-full shadow-2xl`}>
                            <DownloadIcon width="48px" height="48px" fill="#fff" />
                        </div>
                        <p className="text-3xl font-bold text-white tracking-wide">Drop videos here to upload</p>
                        <p className="text-white/80 text-lg">Support for high-quality video formats</p>
                    </div>
                </div>
            )}


            <div
                className='h-[66px] w-full flex justify-between items-center px-4 font-alexandria'
                style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)` }}
            >
                <div>
                    {userType !== 'agent' && (
                        <div>
                            <Button

                                onClick={handleFileInputClick}
                                className={`${userType}-bg h-[32px] w-[150px] flex justify-center items-center hover-${userType}-bg`}>Add File</Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                hidden
                                accept="video/*"
                                onChange={handleFileSelect}
                            />
                        </div>

                    )}
                </div>
                <div>
                    <p className='flex flex-col items-center'>
                        <span className={`${userType}-text font-bold`}>
                            {currentService ? currentService.name : ''}
                        </span>

                        <span className='text-[12px] text-[#7D7D7D]'>{currentBookedService?.option?.title}
                            <span className='ml-1'>
                                ({currentServiceFiles?.filter(f => !f.is_deleted).length || 0} / {currentBookedService?.option?.quantity || 1})
                            </span>
                        </span>
                    </p>
                </div>
                <div className='flex justify-center items-center gap-x-[14px]'>
                    {(userType === 'agent') && (currentBookedService?.payment_status === "PAID" || orderData?.payment_status === "PAID") && (
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
                                setShowConfirmation(true)
                                if (onSave) onSave();
                            }}
                            className={`${mediaUploaded ? "bg-[#6BAE41] hover:bg-[#7dc94f]" : 'bg-[#4290E9] hover:bg-[#4999f5]'}  h-[32px] w-[150px] flex justify-center items-center `}>{mediaUploaded ? <Check color="#fff" size={14} /> : 'Submit to Client'} </Button>
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
                            <p className='text-[#7D7D7D] text-[12px]'>{currentBookedService?.option?.title}</p>
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
                                    className="bg-[#4290E9] text-white hover:bg-[#4999f5] cursor-pointer  h-[32px]"
                                >
                                    Add Manual Payment
                                </Button>
                            ) : (
                                <Button
                                    className="bg-[#6BAE41] hover:bg-[#7dc94f]  text-white flex items-center gap-2  h-[32px] cursor-default"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Payment Added
                                </Button>
                            )}

                            <ManualPayment open={openPayment} setOpen={setOpenPayment} addPayment={handleAddPayment} />
                        </div>
                    }
                </div>
            </div>

            <div className='p-4 flex justify-end'>
                <Button
                    onClick={() => setOpenUpgrade(true)}
                    className={`${userType}-bg h-[32px] w-[150px] flex justify-center items-center hover-${userType}-bg`}
                >
                    Upgrade Plan
                </Button>
                <UpgradeServicePopup
                    open={openUpgrade}
                    setOpen={setOpenUpgrade}
                    currentService={currentService}
                    currentOption={currentBookedService?.option}
                    orderData={orderData}
                    currentBookedService={currentBookedService}
                    onSuccess={() => {
                        window.location.reload();
                    }}
                />
            </div>

            <div className="p-4">
                <FilePreviewModal type='HDR_photos' open={open} onOpenChange={() => { setOpen(false) }} files={files} setSelectedFiles={setSelectedVideoFiles} serviceUuid={currentService?.uuid ?? ''} reviewFilesEnabled={reviewFilesEnabled} />

                <Accordion type="multiple" defaultValue={['unsaved', 'saved']} className="w-full">
                    {filesForService.length > 0 && (
                        <AccordionItem value="unsaved">
                            <AccordionTrigger
                                className={`px-[14px] pb-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #EFEFEF), black 10%)` }}
                            >
                                <span className="flex items-center gap-2">
                                    <span>Unsaved Videos</span>
                                    <span className="text-[11px] font-normal normal-case text-[#7D7D7D]">(Click save changes to upload media)</span>
                                </span>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div
                                    className="w-full grid grid-cols-4 gap-2 p-3"
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #BBBBBB)` }}
                                >
                                    {filesForService.map((file, idx) => (
                                        <div
                                            key={idx}
                                            className="h-auto relative group"
                                            style={{ backgroundColor: `var(--${userType}-page-bg, #BBBBBB)` }}
                                        >
                                            <div className="relative w-full h-[240px]">
                                                <OptimizedImagePreview
                                                    file={file.file}
                                                    alt="Video thumbnail"
                                                    isRestricted={userType === 'agent' && currentBookedService?.payment_status !== 'PAID' && orderData?.payment_status !== 'PAID'}
                                                    className={`w-full h-full object-cover cursor-pointer transition-all duration-300 ${file.is_deleted ? 'blur-[2px] opacity-40 grayscale' : ''}`}
                                                    onClick={() => !file.is_deleted && handleVideoClick(URL.createObjectURL(file.file), file)}
                                                />
                                                {file.is_deleted && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 z-[30] gap-2">
                                                        <p className="text-white font-medium text-lg drop-shadow-lg uppercase mb-4">Deleted</p>
                                                        <Button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedVideoFiles(prev =>
                                                                    prev.map(f => {
                                                                        if (f.file === file.file && f.service_id === file.service_id) {
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
                                                {userType === 'admin' && reviewFilesEnabled && (
                                                    <div
                                                        className="absolute bottom-2 left-2 z-10 flex items-center bg-white/80 p-1 rounded cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedVideoFiles(prev =>
                                                                prev.map(f => {
                                                                    if (f.file === file.file && f.service_id === file.service_id) {
                                                                        return { ...f, is_admin_approved: !f.is_admin_approved };
                                                                    }
                                                                    return f;
                                                                })
                                                            );
                                                        }}
                                                    >
                                                        <div className={`w-4 h-4 border rounded mr-1 flex items-center justify-center ${file.is_admin_approved ? `${userType}-bg ${userType}-border` : 'bg-white border-[#7D7D7D]'}`}>
                                                            {file.is_admin_approved && <Check color="white" size={12} />}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-[#7D7D7D]">Approved</span>
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
                                                            setSelectedVideoFiles(prev =>
                                                                prev.map(f => {
                                                                    if (f.file === file.file && f.service_id === file.service_id) {
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
                                                            setSelectedVideoFiles(prev =>
                                                                prev.map(f => {
                                                                    if (f.file === file.file && f.service_id === file.service_id) {
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
                                            </div>
                                            <div
                                                className='grid grid-cols-4 gap-2 justify-between items-center px-2 py-1 text-[9px]'
                                                style={{ backgroundColor: `var(--${userType}-page-bg, #BBBBBB)` }}
                                            >
                                                <p className="col-span-2 text-[#8E8E8E] mt-1 truncate">{file.file.name}</p>
                                                <div className='col-span-2 flex items-center justify-between'>
                                                    <p className='text-[#8E8E8E] mt-1 flex items-center gap-1'><CopyableFileName name={file.type || "Exterior"} /> ({idx + 1} of {filesForService.length})</p>
                                                    <span
                                                        className='flex w-[24px] h-[24px] cursor-not-allowed opacity-50'>
                                                        <DownloadIcon width='24px' height='24px' fill='#6BAE41' />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    {(currentServiceFiles?.length ?? 0) > 0 && (
                        <AccordionItem value="saved">
                            <AccordionTrigger
                                className={`px-[14px] pb-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                                style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #EFEFEF), black 10%)` }}
                            >
                                Saved Videos
                            </AccordionTrigger>
                            <AccordionContent>
                                {(currentServiceFiles?.length ?? 0) > 0 ? (
                                    <div
                                        className="w-full grid grid-cols-4 gap-2 p-3"
                                        style={{ backgroundColor: `var(--${userType}-page-bg, #BBBBBB)` }}
                                    >
                                        {currentServiceFiles?.map((file, idx) => (
                                            <div
                                                key={idx}
                                                className="h-auto relative group"
                                                style={{ backgroundColor: `var(--${userType}-page-bg, #BBBBBB)` }}
                                            >
                                                <div className="relative w-full h-[240px]">
                                                    {file.is_processing ? (
                                                        <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                                                            <p className="text-gray-500 font-medium text-sm">Processing...</p>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="relative w-full h-full cursor-pointer group"
                                                            onClick={() => handleVideoClick(file.variant_urls?.popup || file.url || `${API_URL}/${file.file_path}`, file)}
                                                        >
                                                            {file.variant_urls?.thumb ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    src={file.variant_urls.thumb}
                                                                    alt={file.name}
                                                                    className={`w-full h-full object-cover ${!file.is_admin_approved && reviewFilesEnabled && userType === 'admin' ? 'opacity-70' : ''}`}
                                                                />
                                                            ) : (
                                                                <video
                                                                    src={`${file.url || `${API_URL}/${file.file_path}`}#t=0.1`}
                                                                    preload="metadata"
                                                                    muted
                                                                    playsInline
                                                                    className={`w-full h-full object-cover ${!file.is_admin_approved && reviewFilesEnabled && userType === 'admin' ? 'opacity-70' : ''}`}
                                                                />
                                                            )}
                                                            <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none">
                                                                <PlayCircle className="w-12 h-12 text-white/90 drop-shadow-md group-hover:scale-110 transition-transform duration-300 fill-black/40" />
                                                            </div>
                                                        </div>
                                                    )}
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
                                                </div>
                                                <div
                                                    className='grid grid-cols-4 gap-2 justify-between items-center px-2 py-1 text-[9px]'
                                                    style={{ backgroundColor: `var(--${userType}-page-bg, #BBBBBB)` }}
                                                >
                                                    <p className="col-span-2 text-[#8E8E8E] mt-1 truncate">{file.name}</p>
                                                    <div className='col-span-2 flex items-center justify-between'>
                                                        <p className='text-[#8E8E8E] mt-1 flex items-center gap-1'><CopyableFileName name={file.group || "Exterior"} /> ({idx + 1} of {currentServiceFiles?.length || 0})</p>
                                                        {userType === 'agent' && (currentBookedService?.payment_status === "PAID" || orderData?.payment_status === "PAID") &&
                                                            <span
                                                                onClick={() => handledownloadFile(file.uuid, file.name)}
                                                                className="flex w-[24px] h-[24px] cursor-pointer hover:bg-gray-300"
                                                            >
                                                                <DownloadIcon width="24px" height="24px" fill="#6BAE41" />
                                                            </span>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-gray-500">No saved videos found.</div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    )}
                </Accordion>

                {userType !== 'agent' && (
                    <div className='w-full flex justify-center items-center mt-8'>
                        <FileUploader onFilesChange={handleFilesChange} type="video" />
                    </div>
                )}
                <PhotoPreviewModal
                    open={imagePopupOpen}
                    onClose={() => {
                        setImagePopupOpen(false);
                        setEditingFile(null);
                    }}
                    file={selectedVideoUrl}
                    title={editingFile ? (('file' in editingFile) ? editingFile.type : (editingFile as Files).group || (editingFile as Files).type || 'Video') : 'Video'}
                    initialName={editingFile ? (('file' in editingFile) ? editingFile.type : (editingFile as Files).group || (editingFile as Files).type || 'Video') : ''}
                    isPaid={currentBookedService?.payment_status === 'PAID' || orderData?.payment_status === 'PAID'}
                    onSave={(newName) => {
                        if (!editingFile) return;

                        if ('file' in editingFile) {
                            // Unsaved file (SelectedFiles)
                            setSelectedVideoFiles(prev => prev.map(f => {
                                if (f.file === editingFile.file && f.service_id === editingFile.service_id) {
                                    return { ...f, type: newName };
                                }
                                return f;
                            }));
                        } else {
                            // Saved file (Files)
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
                        setSelectedVideoFiles(prev => prev.map(f => {
                            if (f.file === editingFile.file && f.service_id === editingFile.service_id) {
                                return { ...f, is_deleted: true };
                            }
                            return f;
                        }));
                    } : undefined}
                    onReplace={editingFile && 'file' in editingFile ? () => {
                        setReplacingFile(editingFile.file);
                        fileInputRef.current?.click();
                    } : undefined}
                    suggestions={videoOptions}
                    type="video"
                />
            </div>
            <DownloadModal
                open={showDownloadModal}
                onClose={() => setShowDownloadModal(false)}
                localFiles={filesForService}
                apiFiles={currentServiceFiles || []}
            />
        </div>
    );
}

export default Video;
