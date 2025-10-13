import ConfirmationDialog from '@/components/ConfirmationDialog'
import { Button } from '@/components/ui/button'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import HouseSheetModal from './HouseSheetModal';
import { Order } from '../../orders/page';
import { Check, CheckCircle2, X } from 'lucide-react';
import { Area } from '../file-manager';
import FileUploader from './FileUploader';
import FilePreviewModal from './FilePreviewModal';
import { Services } from '../../services/page';
import { useFileManagerContext } from '../FileManagerContext ';
import PhotoPreviewModal from './PhotoPreviewModal';
import { DownloadIcon } from '@/components/Icons';
import { useAppContext } from '@/app/context/AppContext';
import ManualPayment from './ManualPayment';
import UpgradeServicePopup from './UpgradeServicePopup';
import PayInvoiceModal from './PayInvoiceModal';
import AgentNotificationModal from './AgentNotificationModal';
import ImagePopup from '@/components/ImagePopup';
type Props = {
    orderData: Order | null;
    currentService?: Services;
};
const Service: React.FC<Props> = ({ orderData, currentService }) => {
    const { floorFiles, setFloorFiles, filesData } = useFileManagerContext();
    const [replacingFile, setReplacingFile] = useState<File | null>(null);
    const [selectedPreviewFile, setSelectedPreviewFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [showFilePreviewModal, setShowFilePreviewModal] = useState(false);
    const [area, setArea] = useState<Area[]>([]);
    const [mediaUploaded, setMediaUploaded] = useState<boolean>(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [showAgain, setShowAgain] = useState(true);
    const [open, setOpen] = useState(false);
    const [openPreview, setOpenPreview] = useState(false);
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAddPayment = (paymentData: any) => {
        console.log("Payment Added:", paymentData);
        setSuccess(true); // ✅ turns button green
    };
    const currentServiceFiles = filesData?.files?.filter(file => file?.service?.uuid === currentService?.uuid);


    const handleFilesChange = (selectedFiles: File[]) => {
        if (selectedFiles.length === 0) return;

        const renamedFiles = selectedFiles.map(file => {
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
            setSelectedPreviewFile(null);
            setTitle('');
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

    const currentServiceOption = orderData?.services.find((service) => service.service.uuid === currentService?.uuid)

    console.log('paymentSuccess', paymentSuccess);

    const handleImageClick = (imageUrl: string) => {
        setSelectedImageUrl(imageUrl);
        setImagePopupOpen(true);
    };
    return (
        <div>
            <div className='w-full justify-between h-[65px] bg-[#E4E4E4] font-alexandria pr-5 z-10 flex items-center border-b border-[#BBBBBB] px-6' >
                <Button onClick={() => fileInputRef.current?.click()} className={`w-[150px] md:w-[143px] h-[32px] md:h-[32px]  justify-center rounded-[6px] font-raleway border-[1px] ${userType}-border ${userType}-bg text-[14px] md:text-[16px] font-[600] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover-${userType}-bg`}>Add File</Button>
                <p className={`text-[16px] font-bold ${userType}-text`}>{currentService?.name}</p>
                {dragging && (
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center pointer-events-none">

                    </div>
                )}
                <div className='flex items-center gap-x-[14px]'>
                    {/* <Button className='w-[150px] md:w-[143px] h-[32px] md:h-[32px]  justify-center rounded-[6px] font-raleway border-[1px] border-[#4290E9] bg-[#4290E9] text-[14px] md:text-[16px] font-[600] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover:bg-[#4290E9]'>Download All File</Button> */}
                    <div className='flex justify-center items-center'>
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
                        accept="image/*"
                        multiple
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => {
                            const selected = Array.from(e.target.files || []);
                            handleFilesChange(selected);
                        }}
                    />
                    <FilePreviewModal type='floor_plans' open={openPreview} onOpenChange={() => { setOpenPreview(false) }} files={files} setSelectedFiles={setFloorFiles} serviceUuid={currentService?.uuid || ""} />
                </div>
            </div>
            <div className='p-4 flex justify-end'>
                <Button
                    onClick={() => setOpenUpgrade(true)}
                    className={`${userType}-bg h-[32px] w-[150px] flex justify-center items-center hover-${userType}-bg`}>Upgrade Plan</Button>
                <UpgradeServicePopup open={openUpgrade} setOpen={setOpenUpgrade} currentService={currentService} currentOption={currentServiceOption?.option} />
            </div>
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
            {(floorFiles.length === 0 && (currentServiceFiles?.length ?? 0) === 0) && (
                <div className='w-full py-[54px] flex justify-center'>

                    <FileUploader onFilesChange={handleFilesChange} />

                </div>
            )}
            <div className='w-full py-[54px] flex justify-center'>
                <div className='grid grid-cols-3 w-[80%] gap-y-7'>
                    {(() => {
                        const otherApiFiles = currentServiceFiles?.filter(file => file.group !== "Additional Files");
                        const additionalApiFiles = currentServiceFiles?.filter(file => file.group === "Additional Files");

                        return (
                            <>
                                {otherApiFiles?.map((file, idx) => (
                                    <div key={idx} className='justify-self-center'>
                                        <div>
                                            <p className={`uppercase text-lg font-semibold ${userType}-text pl-3 pb-2`}>{file.type}</p>
                                            <div className="relative w-[280px] h-[175px] border border-[#A8A8A8] rounded-[6px] bg-[#EEEEEE] overflow-hidden">
                                                {/* eslint-disable @next/next/no-img-element */}
                                                <img
                                                    src={`${API_URL}/${file.file_path}`}
                                                    onClick={() => handleImageClick(`${API_URL}/${file.file_path}`)}
                                                    alt="Preview"
                                                    className="object-contain h-auto w-full cursor-pointer"
                                                // onClick={() => {
                                                //     setSelectedPreviewFile(file.file);
                                                //     setShowFilePreviewModal(true);
                                                //     setTitle(file.type);
                                                // }}
                                                />
                                                <span
                                                    className={`cursor-pointer absolute top-0 right-0 w-[60px] h-[60px] flex justify-end items-start p-[10px]`}
                                                    style={{
                                                        clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                                                        backgroundColor: "#6BAE41"
                                                    }}


                                                >
                                                    <Check color="#fff" size={14} />
                                                </span>
                                            </div>
                                        </div>
                                        <div className='grid grid-cols-4 gap-2 justify-between items-center px-2 py-1 bg-[#ffffff] text-[9px]'>
                                            <p className="col-span-2 text-[#8E8E8E] mt-1 truncate">Uploaded by: Taylor Tayburn</p>
                                            <div className='col-span-2 flex items-center justify-between'>
                                                <p className='text-[#8E8E8E] mt-1'>05/15/2025</p>
                                                <span className='flex w-[24px] h-[24px] cursor-pointer'>
                                                    <DownloadIcon width='24px' height='24px' fill='#6BAE41' />
                                                </span>
                                            </div>
                                        </div>

                                    </div>
                                ))}

                                {additionalApiFiles && additionalApiFiles?.length > 0 && (
                                    <div className="col-span-3">
                                        <p className='uppercase text-lg font-semibold text-[#4290E9] pl-3 ml-11 pb-2'>Additional Files</p>
                                        <div className="grid grid-cols-3 gap-6">
                                            {additionalApiFiles?.map((file, idx) => (
                                                <div key={idx} className='justify-self-center '>
                                                    <div className="relative w-[280px] h-[175px] border border-[#A8A8A8] rounded-[6px] bg-[#EEEEEE] overflow-hidden">
                                                        {/* eslint-disable @next/next/no-img-element */}
                                                        <img
                                                            src={`${API_URL}/${file.file_path}`}
                                                            alt="Preview"
                                                            onClick={() => handleImageClick(`${API_URL}/${file.file_path}`)}
                                                            className="object-contain h-auto w-full cursor-pointer"
                                                        // onClick={() => {
                                                        //     setSelectedPreviewFile(file.file);
                                                        //     setShowFilePreviewModal(true);
                                                        //     setTitle(file.type);
                                                        // }}
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
                                                    <div className='grid grid-cols-4 gap-2 justify-between items-center px-2 py-1 bg-[#ffffff] text-[9px]'>
                                                        <p className="col-span-2 text-[#8E8E8E] mt-1 truncate">Uploaded by: Taylor Tayburn</p>
                                                        <div className='col-span-2 flex items-center justify-between'>
                                                            <p className='text-[#8E8E8E] mt-1'>05/15/2025</p>
                                                            <span className='flex w-[24px] h-[24px] cursor-pointer'>
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
                    {(() => {
                        const otherFiles = floorFiles.filter(file => file.type !== "Additional Files");
                        const additionalFiles = floorFiles.filter(file => file.type === "Additional Files");

                        return (
                            <>
                                {otherFiles.map((file, idx) => (
                                    <div key={idx} className='justify-self-center'>
                                        <div>
                                            <p className='uppercase text-lg font-semibold text-[#4290E9] pl-3 pb-2'>{file.type}</p>
                                            <div className="relative w-[280px] h-[175px] border border-[#A8A8A8] rounded-[6px] bg-[#EEEEEE] overflow-hidden">
                                                {/* eslint-disable @next/next/no-img-element */}
                                                <img
                                                    src={URL.createObjectURL(file.file)}
                                                    alt="Preview"
                                                    className="object-contain h-auto w-full cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedPreviewFile(file.file);
                                                        setShowFilePreviewModal(true);
                                                        setTitle(file.type);
                                                    }}
                                                />
                                                <span
                                                    className={`cursor-pointer absolute top-0 right-0 w-[60px] h-[60px] flex justify-end items-start p-[10px]`}
                                                    style={{
                                                        clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                                                        backgroundColor: `${file.upload ? "#6BAE41" : "#E06D5E"}`,
                                                    }}
                                                    onClick={() => {
                                                        setFloorFiles(prev => {
                                                            return prev.flatMap(item => {
                                                                if (item.file === file.file) {
                                                                    if (item.upload === true) {
                                                                        return [{ ...item, upload: false }];
                                                                    } else {
                                                                        return [];
                                                                    }
                                                                }
                                                                return [item];
                                                            });
                                                        });
                                                    }}

                                                >
                                                    {file.upload ?
                                                        <Check color="#fff" size={14} />
                                                        : <X color="#fff" size={14} />}
                                                </span>
                                            </div>
                                        </div>
                                        <div className='grid grid-cols-4 gap-2 justify-between items-center px-2 py-1 bg-[#ffffff] text-[9px]'>
                                            <p className="col-span-2 text-[#8E8E8E] mt-1 truncate">Uploaded by: Taylor Tayburn</p>
                                            <div className='col-span-2 flex items-center justify-between'>
                                                <p className='text-[#8E8E8E] mt-1'>05/15/2025</p>
                                                <span className='flex w-[24px] h-[24px] cursor-pointer'>
                                                    <DownloadIcon width='24px' height='24px' fill='#6BAE41' />
                                                </span>
                                            </div>
                                        </div>

                                    </div>
                                ))}

                                {additionalFiles.length > 0 && (
                                    <div className="col-span-3">
                                        <p className='uppercase text-lg font-semibold text-[#4290E9] pl-3 ml-11 pb-2'>Additional Files</p>
                                        <div className="grid grid-cols-3 gap-6">
                                            {additionalFiles.map((file, idx) => (
                                                <div key={idx} className='justify-self-center '>
                                                    <div className="relative w-[280px] h-[175px] border border-[#A8A8A8] rounded-[6px] bg-[#EEEEEE] overflow-hidden">
                                                        {/* eslint-disable @next/next/no-img-element */}
                                                        <img
                                                            src={URL.createObjectURL(file.file)}
                                                            alt="Preview"
                                                            className="object-contain h-auto w-full cursor-pointer"
                                                            onClick={() => {
                                                                setSelectedPreviewFile(file.file);
                                                                setShowFilePreviewModal(true);
                                                                setTitle(file.type);
                                                            }}
                                                        />
                                                        <span
                                                            className={`cursor-pointer absolute top-0 right-0 w-[60px] h-[60px] flex justify-end items-start p-[10px]`}
                                                            style={{
                                                                clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                                                                backgroundColor: `${file.upload ? "#6BAE41" : "#E06D5E"}`,
                                                            }}
                                                            onClick={() => {
                                                                setFloorFiles(prev => {
                                                                    return prev.flatMap(item => {
                                                                        if (item.file === file.file) {
                                                                            if (item.upload === true) {
                                                                                return [{ ...item, upload: false }];
                                                                            } else {
                                                                                return [];
                                                                            }
                                                                        }
                                                                        return [item];
                                                                    });
                                                                });
                                                            }}

                                                        >
                                                            {file.upload ?
                                                                <Check color="#fff" size={14} />
                                                                : <X color="#fff" size={14} />}
                                                        </span>
                                                    </div>
                                                    <div className='grid grid-cols-4 gap-2 justify-between items-center px-2 py-1 bg-[#ffffff] text-[9px]'>
                                                        <p className="col-span-2 text-[#8E8E8E] mt-1 truncate">Uploaded by: Taylor Tayburn</p>
                                                        <div className='col-span-2 flex items-center justify-between'>
                                                            <p className='text-[#8E8E8E] mt-1'>05/15/2025</p>
                                                            <span className='flex w-[24px] h-[24px] cursor-pointer'>
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
                file={selectedPreviewFile}
                open={showFilePreviewModal}
                title={title}
                onClose={() => setShowFilePreviewModal(false)}
                onDelete={() => {
                    setFloorFiles(prev =>
                        prev.filter(f => f.file !== selectedPreviewFile)
                    );
                    setSelectedPreviewFile(null);
                }}
                onReplace={() => {
                    setReplacingFile(selectedPreviewFile);
                    setShowFilePreviewModal(false);
                    fileInputRef.current?.click();
                }}
            />
            <ImagePopup
                imageUrl={selectedImageUrl}
                open={imagePopupOpen}
                onClose={() => setImagePopupOpen(false)}
            />
        </div>
    )
}

export default Service