'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import FilePreviewModal from './FilePreviewModal';
import { Check, CheckCircle2, X } from 'lucide-react';
import { DownloadIcon } from '@/components/Icons';
import { Button } from '@/components/ui/button';
import FileUploader from './FileUploader';
import { Services } from '../../services/page';
import { Files, useFileManagerContext } from '../FileManagerContext ';
import { toast } from 'sonner';
import { Order } from '../../orders/page';
import { UpdatePhotosData } from '../file-manager';
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
    service_id?: string

}

export interface PaymentData {
    payment_type: "cheque" | "bank_transfer" | "cash"; // restrict to valid types
    cheque_number?: string;
    bank_name?: string;
    transfer_ref?: string;
    notes?: string;
}


function FileTab1({ currentService, orderData }: { currentService?: Services, orderData: Order | null }) {
    const [files, setFiles] = useState<File[]>([]);
    const [mediaUploaded, setMediaUploaded] = useState<boolean>(false);
    const [open, setOpen] = useState(false);
    const [openUpgrade, setOpenUpgrade] = useState(false);
    const { selectedFiles, setSelectedFiles, filesData } = useFileManagerContext();
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

    const currentServiceOption = orderData?.services.find((service) => service.service.uuid === currentService?.uuid)


    const currentServiceFiles = filesData?.files?.filter((file: Files) => file?.service?.uuid === currentService?.uuid);

    console.log('currentServiceFiles', currentServiceFiles);
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


    const handleDownload = async (file: string | File, fileName: string) => {
        try {
            let blobUrl = "";
            let revokeAfter = false;

            if (typeof file === "string") {
                console.log("file", file)
                // 🟢 Download from server
                const fileUrl = `${process.env.NEXT_PUBLIC_FILES_API_URL}/${file}`;
                const res = await fetch(fileUrl);
                if (!res.ok) throw new Error(`Failed to fetch file ${res.status}`);

                const blob = await res.blob();
                blobUrl = URL.createObjectURL(blob);
                revokeAfter = true;
            } else {
                // 🟡 Local file (already selected)
                blobUrl = URL.createObjectURL(file);
                revokeAfter = true;
            }

            // 💾 Trigger download
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            if (revokeAfter) {
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            }
        } catch (err) {
            console.error("[Download Error]:", err);
        }
    };


    const handleImageClick = (imageUrl: string) => {
        setSelectedImageUrl(imageUrl);
        setImagePopupOpen(true);
    };


    return (
        <div>
            <div className='h-[66px] w-full bg-[#E4E4E4] flex justify-between items-center px-4 font-alexandria'>
                {dragging && (
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center pointer-events-none">
                        {/* <div className="bg-white bg-opacity-25 flex justify-center items-center w-[50vw] h-[50vh] border-2 border-dashed border-gray-400 rounded-lg p-10 text-center pointer-events-none">
                            <p className="text-lg text-gray-700">Drop files here </p>
                        </div> */}
                    </div>
                )}
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
                <div>
                    <p className='flex flex-col items-center'><span className={`${userType}-text font-bold`}>{currentService ? currentService.name : ''}</span>
                        <span className='text-[12px] text-[#7D7D7D]'>{currentServiceOption?.option.title}</span>

                    </p>
                </div>
                <div className='flex justify-center items-center gap-x-[14px]'>
                    {userType !== 'vendor' &&
                        <Button
                            onClick={() => {
                                setShowDownloadModal(true);
                            }}
                            className={`${`${userType}-bg hover-${userType}-bg`} h-[32px] w-[150px] flex justify-center items-center cursor-pointer`}>Download Files </Button>
                    }
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
            </div>
            <div className='p-4 flex justify-end'>
                <Button
                    onClick={() => setOpenUpgrade(true)}
                    className={`${userType}-bg h-[32px] w-[150px] flex justify-center items-center hover-${userType}-bg`}>Upgrade Plan</Button>
                <UpgradeServicePopup open={openUpgrade} setOpen={setOpenUpgrade} currentService={currentService} currentOption={currentServiceOption?.option} />
            </div>
            <div className="p-4">
                {(filesForService.length === 0 && (currentServiceFiles?.length ?? 0) === 0) && (
                    <div className='w-full flex justify-center items-center mt-20'>
                        <FileUploader onFilesChange={handleFilesChange} />
                    </div>)}
                <FilePreviewModal type='HDR_photos' open={open} onOpenChange={() => { setOpen(false) }} files={files} setSelectedFiles={setSelectedFiles} serviceUuid={currentService?.uuid ?? ''} />
                {(filesForService.length > 0 || (currentServiceFiles?.length ?? 0) > 0) && (
                    <div className="mt-4 w-full grid grid-cols-4 gap-2 bg-[#BBBBBB] p-3">

                        {currentServiceFiles?.map((file, idx) => (
                            <div key={idx} className="bg-[#BBBBBB] h-auto relative">
                                <div className="relative w-full h-[240px]">
                                    {/* eslint-disable @next/next/no-img-element */}
                                    <img
                                        src={`${API_URL}/${file.file_path}`}
                                        onClick={() => handleImageClick(`${API_URL}/${file.file_path}`)}
                                        alt="preview"
                                        className="w-full h-full object-cover"
                                    />
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
                                <div className='grid grid-cols-4 gap-2 justify-between items-center px-2 py-1 bg-[#BBBBBB] text-[9px]'>
                                    <p className="col-span-2 text-[#8E8E8E] mt-1 truncate">{file.name}</p>
                                    <div className='col-span-2 flex items-center justify-between'>
                                        <p className='text-[#8E8E8E] mt-1'>Exterior ({idx + 1} of {filesForService.length})</p>
                                        <span
                                            onClick={() => handleDownload(file.file_path, file.name)}
                                            className='flex w-[24px] h-[24px] cursor-pointer hover:bg-gray-300'>
                                            <DownloadIcon width='24px' height='24px' fill='#6BAE41' />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filesForService.map((file, idx) => (
                            <div key={idx} className="bg-[#BBBBBB] h-auto relative">
                                <div className="relative w-full h-[240px]">
                                    {/* eslint-disable @next/next/no-img-element */}
                                    <img
                                        src={URL.createObjectURL(file.file)}
                                        onClick={() => handleImageClick(URL.createObjectURL(file.file))}
                                        alt="preview"
                                        className="w-full h-full object-cover"
                                    />
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
                                <div className='grid grid-cols-4 gap-2 justify-between items-center px-2 py-1 bg-[#BBBBBB] text-[9px]'>
                                    <p className="col-span-2 text-[#8E8E8E] mt-1 truncate">{file.file.name}</p>
                                    <div className='col-span-2 flex items-center justify-between'>
                                        <p className='text-[#8E8E8E] mt-1'>Exterior ({idx + 1} of {filesForService.length})</p>
                                        <span
                                            onClick={() => handleDownload(file.file, file.file.name)}
                                            className='flex w-[24px] h-[24px] cursor-pointer'>
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
                localFiles={filesForService}
                apiFiles={currentServiceFiles || []}
            />
        </div>
    );
}

export default FileTab1;
