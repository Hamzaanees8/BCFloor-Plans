'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import FilePreviewModal from './FilePreviewModal';
import { Check, CheckCircle2, X, Star } from 'lucide-react';
import { DownloadIcon } from '@/components/Icons';
import { Button } from '@/components/ui/button';
import FileUploader from './FileUploader';
import { Services } from '../../services/page';
import { Files, useFileManagerContext } from '../FileManagerContext ';
import { toast } from 'sonner';
import { Order } from '../../orders/page';
import { DownloadFile, ServiceCompletion, UpdatePhotosData } from '../file-manager';
import ManualPayment from './ManualPayment';
import { useAppContext } from '@/app/context/AppContext';
import UpgradeServicePopup from './UpgradeServicePopup';
import PayInvoiceModal from './PayInvoiceModal';
import AgentNotificationModal from './AgentNotificationModal';
import ImagePopup from '@/components/ImagePopup';
import DownloadModal from './DownloadModal';

export interface SelectedFiles {
    file: File;
    type: string;
    group?: string;
    upload?: boolean;
    service_id?: string;
    is_featured?: boolean;
    is_admin_approved?: boolean;
    is_agent_approved?: boolean;

}

export interface PaymentData {
    payment_type: "cheque" | "bank_transfer" | "cash"; // restrict to valid types
    cheque_number?: string;
    bank_name?: string;
    transfer_ref?: string;
    notes?: string;
}


function FileTab1({ currentService, orderData, isListing, reviewFilesEnabled }: { currentService?: Services, orderData: Order | null, isListing?: boolean, reviewFilesEnabled?: boolean }) {
    const [files, setFiles] = useState<File[]>([]);
    const [mediaUploaded, setMediaUploaded] = useState<boolean>(false);
    const [open, setOpen] = useState(false);
    const [openUpgrade, setOpenUpgrade] = useState(false);
    const { selectedFiles, setSelectedFiles, filesData, setFilesData, setChangedFileUuids } = useFileManagerContext();
    const [openPayment, setOpenPayment] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [dragging, setDragging] = useState(false);
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [imagePopupOpen, setImagePopupOpen] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const dragCounter = useRef(0);
    const { userType } = useAppContext()
    const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;
    const handleFileInputClick = () => {
        setFiles([])
        fileInputRef.current?.click();
    };
    console.log('filesData', filesData);
    console.log('selectedFiles', selectedFiles);


    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        setFiles(newFiles);
    };

    const handleFilesChange = (selectedFiles: File[]) => {
        setFiles(selectedFiles);
    };

    useEffect(() => {
        if (files.length > 0) {
            setOpen(true);
        }

    }, [files])

    const currentBookedService = orderData?.services.find((service) => service.service.uuid === currentService?.uuid)

    // Filter existing files
    let currentServiceFiles = filesData?.files?.filter((file: Files) => file?.service?.uuid === currentService?.uuid);

    // If Agent and review is enabled, only show approved files
    if (userType === 'agent' && reviewFilesEnabled) {
        currentServiceFiles = currentServiceFiles?.filter(file => file.is_admin_approved);
    }

    const filesForService = selectedFiles.filter(f => f.service_id === currentService?.uuid);

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setDragging(false);
        dragCounter.current = 0;

        const droppedFiles = Array.from(e.dataTransfer?.files || []);

        handleFilesChange(droppedFiles);
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAddPayment = (paymentData: any) => {
        console.log("Payment Added:", paymentData);
        setSuccess(true);
    };
    const handleSubmitToClient = async () => {
        if (!currentService?.uuid) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            if (filesData) {

                await UpdatePhotosData(
                    token,
                    filesData?.uuid || '',
                    filesForService,
                );
            } else {

            }

            setMediaUploaded(true);
            toast.success("Files submitted to client!");
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "An error occurred while submitting files."
            );
        }
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



    const handleImageClick = (imageUrl: string) => {
        setSelectedImageUrl(imageUrl);
        setImagePopupOpen(true);
    };

    // Handler to toggle featured status - only one file can be featured at a time
    const handleToggleFeatured = (fileUuid: string, currentFeaturedStatus: boolean) => {
        // Update selectedFiles to mark/unmark featured
        setSelectedFiles(prev =>
            prev.map(f => {
                // If this is the clicked file, toggle its featured status
                if (f.service_id === currentService?.uuid) {
                    const fileKey = `${f.file.name}-${f.file.size}`;
                    const clickedFileKey = fileUuid;

                    if (fileKey === clickedFileKey) {
                        return { ...f, is_featured: !currentFeaturedStatus };
                    } else {
                        // Unmark all other files in this service
                        return { ...f, is_featured: false };
                    }
                }
                return f;
            })
        );
    };


    useEffect(() => {
        const checkServiceCompletion = async () => {
            const token = localStorage.getItem("token");
            const numberOfUploadedFiles = currentServiceFiles?.length ?? 0

            if (numberOfUploadedFiles >= (currentBookedService?.option.quantity ?? 0)) {
                if (token && currentBookedService?.uuid && orderData?.uuid) {
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
                    className='h-[66px] w-full flex justify-between items-center px-4 font-alexandria'
                    style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
                >
                    {dragging && userType !== 'agent' && (
                        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center pointer-events-none">
                            {/* <div className="bg-white bg-opacity-25 flex justify-center items-center w-[50vw] h-[50vh] border-2 border-dashed border-gray-400 rounded-lg p-10 text-center pointer-events-none">
                            <p className="text-lg text-gray-700">Drop files here </p>
                        </div> */}
                        </div>
                    )}

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
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />
                            </div>

                        )}
                    </div>
                    <div>
                        <p className='flex flex-col items-center'><span className={`${userType}-text font-bold`}>{currentService ? currentService.name : ''}</span>
                            <span className='text-[12px] text-[#7D7D7D]'>{currentBookedService?.option.title}</span>

                        </p>
                    </div>
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
                                    setShowConfirmation(true)
                                    handleSubmitToClient()
                                    // setSelectedFiles(prev =>
                                    //     prev.map(file => ({ ...file, upload: true }))
                                    // );
                                }}
                                className={`${mediaUploaded ? "bg-[#6BAE41] hover:bg-[#7dc94f]" : `${userType}-bg hover-${userType}-bg`}  h-[32px] w-[150px] flex justify-center items-center `}>{mediaUploaded ? <Check color="#fff" size={14} /> : 'Submit to Client'} </Button>
                        }
                        <AgentNotificationModal
                            open={showConfirmation}
                            onClose={() => setShowConfirmation(false)}
                            serviceDate={currentService ? currentService : null}
                            orderData={orderData ? orderData : null}
                        />
                        {userType === 'agent' &&
                            <div className='flex flex-col justify-center items-center mr-4'>
                                <p className='text-[18px] text-[#6BAE41]'>${currentBookedService?.option.amount}</p>
                                <p className='text-[#7D7D7D] text-[12px]'>{currentBookedService?.option.title}</p>
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
                                        className="bg-[#6BAE41] hover:bg-[#7dc94f]  text-white flex items-center gap-2  h-[32px] cursor-default"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        Payment Added
                                    </Button>
                                )}

                                {/* Popup */}
                                <ManualPayment open={openPayment} setOpen={setOpenPayment} addPayment={handleAddPayment} />
                            </div>
                        }
                    </div>
                </div>}
            {!isListing &&
                <div className='p-4 flex justify-end'>
                    <Button
                        onClick={() => setOpenUpgrade(true)}
                        className={`${userType}-bg h-[32px] w-[150px] flex justify-center items-center hover-${userType}-bg`}>Upgrade Plan</Button>
                    <UpgradeServicePopup open={openUpgrade} setOpen={setOpenUpgrade} currentService={currentService} currentOption={currentBookedService?.option} />
                </div>}
            <div className="p-4">
                {(filesForService.length === 0 && (currentServiceFiles?.length ?? 0) === 0) && userType !== 'agent' && (
                    <div className='w-full flex justify-center items-center mt-20'>
                        <FileUploader onFilesChange={handleFilesChange} />
                    </div>)}
                <FilePreviewModal type='HDR_photos' open={open} onOpenChange={() => { setOpen(false) }} files={files} setSelectedFiles={setSelectedFiles} serviceUuid={currentService?.uuid ?? ''} reviewFilesEnabled={reviewFilesEnabled} />
                {(filesForService.length > 0 || (currentServiceFiles?.length ?? 0) > 0) && (
                    <div
                        className="mt-4 w-full grid grid-cols-4 gap-2 p-3"
                        style={{ backgroundColor: `var(--${userType}-page-bg, #BBBBBB)` }}
                    >

                        {currentServiceFiles?.map((file, idx) => (
                            <div
                                key={idx}
                                className="h-auto relative"
                                style={{ backgroundColor: `var(--${userType}-page-bg, #BBBBBB)` }}
                            >
                                <div className="relative w-full h-[240px]">
                                    {/* eslint-disable @next/next/no-img-element */}
                                    <img
                                        src={`${API_URL}/${file.file_path}`}
                                        onClick={() => handleImageClick(`${API_URL}/${file.file_path}`)}
                                        alt="preview"
                                        className={`w-full h-full object-cover ${!file.is_admin_approved && reviewFilesEnabled && userType === 'admin' ? 'opacity-70' : ''}`}
                                    />
                                    {/* Star icon for featured status - top left */}
                                    <span
                                        className="cursor-pointer absolute top-2 left-2 z-10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Toggle featured status for API files
                                            setFilesData(prev => {
                                                if (!prev) return prev;
                                                return {
                                                    ...prev,
                                                    files: prev.files.map(f => {
                                                        // If this is the clicked file, toggle its featured status
                                                        if (f.uuid === file.uuid) {
                                                            // Track this file as changed
                                                            setChangedFileUuids(prevSet => {
                                                                const newSet = new Set(prevSet);
                                                                newSet.add(f.uuid);
                                                                return newSet;
                                                            });
                                                            return { ...f, is_featured: !f.is_featured };
                                                        }
                                                        // Unmark all other files in this service
                                                        if (f.service?.uuid === currentService?.uuid) {
                                                            // If this file was featured, track it as changed
                                                            if (f.is_featured) {
                                                                setChangedFileUuids(prevSet => {
                                                                    const newSet = new Set(prevSet);
                                                                    newSet.add(f.uuid);
                                                                    return newSet;
                                                                });
                                                            }
                                                            return { ...f, is_featured: false };
                                                        }
                                                        return f;
                                                    })
                                                };
                                            });
                                        }}
                                    >
                                        {file.is_featured ? (
                                            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                                        ) : (
                                            <Star className="w-6 h-6 text-gray-400 hover:text-yellow-400" />
                                        )}
                                    </span>
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

                                    <span
                                        className={`cursor-pointer absolute top-0 right-0 w-[60px] h-[60px] flex justify-end items-start p-[10px]`}
                                        style={{
                                            clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                                            backgroundColor: "#6BAE41",
                                        }}


                                    >
                                        <Check color="#fff" size={14} />
                                    </span>
                                </div>
                                <div
                                    className='grid grid-cols-4 gap-2 justify-between items-center px-2 py-1 text-[9px]'
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #BBBBBB)` }}
                                >
                                    <p className="col-span-2 text-[#8E8E8E] mt-1 truncate">{file.name}</p>
                                    <div className='col-span-2 flex items-center justify-between'>
                                        <p className='text-[#8E8E8E] mt-1'>Exterior ({idx + 1} of {currentServiceFiles.length})</p>
                                        {userType === 'agent' && currentBookedService?.payment_status === "PAID" &&
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
                        {filesForService.map((file, idx) => (
                            <div
                                key={idx}
                                className="h-auto relative"
                                style={{ backgroundColor: `var(--${userType}-page-bg, #BBBBBB)` }}
                            >
                                <div className="relative w-full h-[240px]">
                                    {/* eslint-disable @next/next/no-img-element */}
                                    <img
                                        src={URL.createObjectURL(file.file)}
                                        onClick={() => handleImageClick(URL.createObjectURL(file.file))}
                                        alt="preview"
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Star icon for featured status - top left */}
                                    <span
                                        className="cursor-pointer absolute top-2 left-2 z-10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const fileKey = `${file.file.name}-${file.file.size}`;
                                            handleToggleFeatured(fileKey, file.is_featured || false);
                                        }}
                                    >
                                        {file.is_featured ? (
                                            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                                        ) : (
                                            <Star className="w-6 h-6 text-gray-400 hover:text-yellow-400" />
                                        )}
                                    </span>
                                    {/* Admin Approved Checkbox for New Uploads */}
                                    {userType === 'admin' && reviewFilesEnabled && (
                                        <div
                                            className="absolute bottom-2 left-2 z-10 flex items-center bg-white/80 p-1 rounded cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedFiles(prev =>
                                                    prev.map(f => {
                                                        if (f.file === file.file && f.service_id === file.service_id) {
                                                            return { ...f, is_admin_approved: !f.is_admin_approved };
                                                        }
                                                        return f;
                                                    })
                                                );
                                            }}
                                        >
                                            <div className={`w-4 h-4 border rounded mr-1 flex items-center justify-center ${file.is_admin_approved ? 'bg-green-500 border-green-500' : 'bg-white border-gray-400'}`}>
                                                {file.is_admin_approved && <Check color="white" size={12} />}
                                            </div>
                                            <span className="text-[10px] font-bold">Approved</span>
                                        </div>
                                    )}

                                    <span
                                        className={`cursor-pointer absolute top-0 right-0 w-[60px] h-[60px] flex justify-end items-start p-[10px]`}
                                        style={{
                                            clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                                            backgroundColor: `${file.upload ? "#6BAE41" : "#E06D5E"}`,
                                        }}
                                        onClick={() => {
                                            setSelectedFiles(prev =>
                                                prev.flatMap(f => {
                                                    if (f.file === file.file && f.service_id === file.service_id) {
                                                        return f.upload ? [{ ...f, upload: false }] : [];
                                                    }
                                                    return [f];
                                                })
                                            );
                                        }}


                                    >
                                        {file.upload ? <Check color="#fff" size={14} /> : <X color="#fff" size={14} />}
                                    </span>
                                </div>
                                <div
                                    className='grid grid-cols-4 gap-2 justify-between items-center px-2 py-1 text-[9px]'
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #BBBBBB)` }}
                                >
                                    <p className="col-span-2 text-[#8E8E8E] mt-1 truncate">{file.file.name}</p>
                                    <div className='col-span-2 flex items-center justify-between'>
                                        <p className='text-[#8E8E8E] mt-1'>Exterior ({idx + 1})</p>
                                        <span
                                            className='flex w-[24px] h-[24px] cursor-not-allowed opacity-50'>
                                            <DownloadIcon width='24px' height='24px' fill='#6BAE41' />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>
                )}
            </div>
            <ImagePopup
                imageUrl={selectedImageUrl}
                open={imagePopupOpen}
                onClose={() => setImagePopupOpen(false)}
            />
            <DownloadModal
                open={showDownloadModal}
                onClose={() => setShowDownloadModal(false)}
                // localFiles={filesForService}
                apiFiles={currentServiceFiles || []}
            />
        </div>
    );
}

export default FileTab1;
