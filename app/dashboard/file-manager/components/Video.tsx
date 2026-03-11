import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import CopyableFileName from './CopyableFileName';
import FilePreviewModal from './FilePreviewModal';
import { Check, X, PlayCircle, Loader2 } from 'lucide-react';
import { DownloadIcon } from '@/components/Icons';
import { Button } from '@/components/ui/button';
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
import { S3UploadService } from '@/lib/upload/s3-service';
import { OptimizedImagePreview } from './OptimizedPreview';
import { DualModeFileManager } from './dual-mode/DualModeFileManager';
import { ModeToggle } from './dual-mode/ModeToggle';
import { FileItem, DualMode } from './dual-mode/types';
import { GridSizeToggle } from './dual-mode/GridSizeToggle';



function Video({ currentService, orderData, reviewFilesEnabled, onSave }: { currentService?: Services, orderData: Order | null, isListing?: boolean, reviewFilesEnabled?: boolean, onSave?: () => void }) {
    const [files, setFiles] = useState<File[]>([]);
    const [mediaUploaded, setMediaUploaded] = useState<boolean>(false);
    const [open, setOpen] = useState(false);
    const [openPayment, setOpenPayment] = useState(false);
    const [, setSuccess] = useState(false);
    const [openUpgrade, setOpenUpgrade] = useState(false);
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const { selectedVideoFiles, setSelectedVideoFiles, filesData, setChangedFileUuids, setSelectionChangedUuids, setFilesData, fileManagerMode, setFileManagerMode, imagesPerRow, isSaving } = useFileManagerContext();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [imagePopupOpen, setImagePopupOpen] = useState(false);
    const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>('');
    const [editingFile, setEditingFile] = useState<SelectedFiles | Files | null>(null);
    const [replacingFile, setReplacingFile] = useState<File | null>(null);
    const { userType } = useAppContext()

    const videoOptions = [
        "Branded Video", "Unbranded Video", "Social Media Teaser", "Reel / Short", "Aerial Highlight"
    ];

    const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

    const handleModeChange = (newMode: DualMode) => {
        setFileManagerMode(newMode);
        if (newMode === 'upload' && onSave) {
            onSave(); // Trigger API request
        }
    };

    // Filter existing files safely with useMemo
    const currentServiceFiles = useMemo(() => {
        let files = filesData?.files
            ?.filter(file => file?.service?.uuid === currentService?.uuid && file.type === "video")
            .sort((a, b) => {
                if (a.sort_order !== undefined && b.sort_order !== undefined) {
                    return a.sort_order - b.sort_order;
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

        // If Agent, only show files marked to show
        if (userType === 'agent') {
            files = files?.filter(file => file.is_show !== false);
        }

        // If Agent and review is enabled, only show approved files
        if (userType === 'agent' && reviewFilesEnabled) {
            files = files?.filter(file => file.is_admin_approved);
        }
        return files || [];
    }, [filesData?.files, currentService?.uuid, userType, reviewFilesEnabled]);




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
    const currentBookedService = orderData?.services.find((service) => service.service.uuid === currentService?.uuid)

    const filesForService = useMemo(() => selectedVideoFiles.filter(f => f.service_id === currentService?.uuid), [selectedVideoFiles, currentService?.uuid]);

    const [fileItems, setFileItems] = useState<FileItem[]>([]);

    useEffect(() => {
        const sortedServerFiles = (currentServiceFiles || []).map((f, index) => ({
            clientId: f.uuid,
            serverId: f.uuid,
            url: f.variant_urls?.thumb || f.thumbnail_url || f.url || `${API_URL}/${f.file_path}`,
            status: 'uploaded' as const,
            order: f.sort_order !== undefined ? f.sort_order : index + 1,
            originalData: f
        }));

        const localItems = filesForService.map((f, index) => {
            const existing = fileItems.find(item => item.file === f.file);
            return {
                clientId: existing ? existing.clientId : crypto.randomUUID(),
                file: f.file,
                url: URL.createObjectURL(f.file),
                status: 'local' as const,
                order: f.sort_order !== undefined ? f.sort_order : (sortedServerFiles.length + index + 1),
                originalData: f
            };
        });

        // Combine them and sort by order
        setFileItems([...localItems, ...sortedServerFiles].sort((a, b) => a.order - b.order));

        return () => {
            localItems.forEach(item => URL.revokeObjectURL(item.url));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentServiceFiles, filesForService]);

    const handleFileItemsChange = (newItems: FileItem[]) => {
        setFileItems(newItems);

        // Update local state and context to reflect new sort order
        newItems.forEach((item, index) => {
            const newSortOrder = index + 1;
            if (item.status === 'local') {
                // For files not yet uploaded, update SelectedFiles
                setSelectedVideoFiles(prev => prev.map(f => {
                    if (f.file === item.file) {
                        return { ...f, sort_order: newSortOrder };
                    }
                    return f;
                }));
            } else if (item.status === 'uploaded' && filesData) {
                // For existing files, update FilesData and mark as changed
                setFilesData(prev => {
                    if (!prev) return prev;
                    const hasModifications = prev.files.some(f => f.uuid === item.serverId && f.sort_order !== newSortOrder);

                    if (hasModifications) {
                        setChangedFileUuids(prevSet => {
                            const newSet = new Set(prevSet);
                            newSet.add(item.serverId!);
                            return newSet;
                        });

                        return {
                            ...prev,
                            files: prev.files.map(f => {
                                if (f.uuid === item.serverId) {
                                    return { ...f, sort_order: newSortOrder };
                                }
                                return f;
                            })
                        };
                    }
                    return prev;
                });
            }
        });
    };

    const handleDropFiles = (droppedFiles: File[]) => {
        if (userType === 'agent') {
            return;
        }

        const videoFiles = droppedFiles.filter(file => file.type.startsWith('video/'));
        const invalidFiles = droppedFiles.filter(file => !file.type.startsWith('video/'));

        if (invalidFiles.length > 0) {
            toast.error("Only video files are allowed.")
        }

        if (videoFiles.length > 0) {
            handleFilesChange(videoFiles);
        }
    };

    const renderFileItem = useCallback((item: FileItem, isDragging?: boolean) => {
        const isLocal = item.status === 'local';
        const file = item.originalData;

        if (!file) return null;

        const idx = fileItems.findIndex(f => f.clientId === item.clientId);
        const totalUploaded = currentServiceFiles?.length || 0;

        return (
            <div
                className="h-auto relative group flex flex-col overflow-hidden"
                style={{ backgroundColor: `var(--${userType}-page-bg, #BBBBBB)` }}
            >
                <div className="relative w-full aspect-video overflow-hidden">
                    {isLocal ? (
                        <>
                            <OptimizedImagePreview
                                file={file.file}
                                alt="Video thumbnail"
                                isRestricted={userType === 'agent' && currentBookedService?.payment_status !== 'PAID' && orderData?.payment_status !== 'PAID'}
                                className={`absolute inset-0 w-full h-full object-cover cursor-pointer transition-all duration-300 ${file.is_deleted ? 'blur-[2px] opacity-40 grayscale' : ''}`}
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
                                    <div className={`w-4 h-4 border rounded mr-1 flex items-center justify-center ${file.is_admin_approved ? 'bg-green-500 border-green-500' : 'bg-white border-gray-400'}`}>
                                        {file.is_admin_approved && <Check color="white" size={12} />}
                                    </div>
                                    <span className="text-[10px] font-bold">Approved</span>
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
                        </>
                    ) : (
                        <>
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
                                            className={`absolute inset-0 w-full h-full object-cover ${!file.is_admin_approved && reviewFilesEnabled && userType === 'admin' ? 'opacity-70' : ''}`}
                                        />
                                    ) : (
                                        <video
                                            src={`${file.url || `${API_URL}/${file.file_path}`}#t=0.1`}
                                            preload="metadata"
                                            muted
                                            playsInline
                                            className={`absolute inset-0 w-full h-full object-cover ${!file.is_admin_approved && reviewFilesEnabled && userType === 'admin' ? 'opacity-70' : ''} ${isDragging ? 'opacity-0' : 'opacity-100'}`}
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
                                                        setSelectionChangedUuids(prevSet => {
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
                                    <span className="text-[10px] font-bold text-[#7D7D7D]">Selected</span>
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
                        </>
                    )}
                </div>
                <div
                    className='grid grid-cols-2 gap-1 justify-between items-center px-1 py-1'
                    style={{ backgroundColor: `var(--${userType}-page-bg, #BBBBBB)`, fontSize: imagesPerRow >= 6 ? '7px' : '9px' }}
                >
                    {/* <p className="col-span-2 text-[#8E8E8E] mt-1 truncate" title={isLocal ? file.file.name : file.name}>{isLocal ? file.file.name : file.name}</p> */}
                    <div className='col-span-2 flex items-center justify-between overflow-hidden'>
                        <p className='text-[#8E8E8E] mt-1 flex items-center gap-1 truncate pr-1'><CopyableFileName name={isLocal ? (file.type || "Exterior") : (file.group || "Exterior")} /> ({idx + 1}{!isLocal ? ` of ${totalUploaded}` : ''})</p>
                        {isLocal ? (
                            <span className='flex shrink-0 cursor-not-allowed opacity-50' style={{ width: imagesPerRow >= 6 ? '16px' : '24px', height: imagesPerRow >= 6 ? '16px' : '24px' }}>
                                <DownloadIcon width='100%' height='100%' fill='#6BAE41' />
                            </span>
                        ) : (
                            (userType === 'admin' || userType === 'vendor' || (userType === 'agent' && (currentBookedService?.payment_status === "PAID" || orderData?.payment_status === "PAID"))) ? (
                                <span
                                    onClick={(e) => { e.stopPropagation(); handledownloadFile(file.uuid, file.name) }}
                                    className="flex shrink-0 cursor-pointer hover:bg-gray-300 rounded" style={{ width: imagesPerRow >= 6 ? '16px' : '24px', height: imagesPerRow >= 6 ? '16px' : '24px' }}
                                >
                                    <DownloadIcon width="100%" height="100%" fill="#6BAE41" />
                                </span>
                            ) : (
                                <span
                                    title="service not paid yet"
                                    className="flex shrink-0 cursor-not-allowed opacity-50" style={{ width: imagesPerRow >= 6 ? '16px' : '24px', height: imagesPerRow >= 6 ? '16px' : '24px' }}
                                >
                                    <DownloadIcon width="100%" height="100%" fill="#6BAE41" />
                                </span>
                            )
                        )}
                    </div>
                </div>
            </div>
        );
    }, [API_URL, currentBookedService?.payment_status, currentServiceFiles?.length, fileItems, imagesPerRow, orderData?.payment_status, reviewFilesEnabled, setChangedFileUuids, setSelectionChangedUuids, setFilesData, setSelectedVideoFiles, userType]);

    const handleVideoClick = (url: string, file: SelectedFiles | Files) => {
        setSelectedVideoUrl(url);
        setEditingFile(file);
        setImagePopupOpen(true);
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

    const handleDeleteUploadedFile = async (fileUuid: string) => {
        try {
            await S3UploadService.deleteUploads({
                uuids: [fileUuid],
                type: "tour-file"
            });

            // Update local state by removing the file
            if (filesData) {
                setFilesData(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        files: prev.files.filter(f => f.uuid !== fileUuid)
                    };
                });
            }
            toast.success("File deleted successfully");
        } catch (err) {
            console.error('Delete error:', err);
            toast.error('Failed to delete file. Please try again.');
        }
    };
    return (
        <div>
            <div
                className='relative h-[66px] w-full flex justify-between items-center px-4 font-alexandria'
                style={{ backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)` }}
            >
                <div>
                    {(userType !== 'agent') ? (
                        <div className="flex gap-2 items-center">
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
                    ) : (
                        <div className="flex gap-2 items-center">
                            <Button
                                onClick={() => {
                                    setShowDownloadModal(true);
                                }}
                                disabled={!(currentBookedService?.payment_status === "PAID" || orderData?.payment_status === "PAID")}
                                className={`${userType}-bg hover-${userType}-bg h-[32px] w-[150px] flex justify-center items-center ${!(currentBookedService?.payment_status === "PAID" || orderData?.payment_status === "PAID") ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                                Download Files
                            </Button>
                        </div>
                    )}
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <p className='flex flex-col items-center pointer-events-auto'>
                        <span className={`${userType}-text font-bold text-[16px]`}>
                            {currentService ? currentService.name : ''}
                        </span>

                        <span className='text-[12px] text-[#7D7D7D]'>
                            {currentBookedService?.option?.title || `${currentBookedService?.option?.quantity || 0} Files`}
                            {userType !== 'agent' && (
                                <span className='ml-1'>
                                    ({currentServiceFiles?.filter(f => !f.is_deleted).length || 0} / {currentBookedService?.option?.quantity || 1})
                                </span>
                            )}
                        </span>
                    </p>
                </div>
                <div className='flex justify-center items-center gap-x-[14px]'>
                    {/* Download Files button moved to the left */}
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
                                setFileManagerMode('upload');
                                setMediaUploaded(true);
                                setShowConfirmation(true)
                                if (onSave) onSave();
                            }}
                            disabled={isSaving}
                            className={`${mediaUploaded ? "bg-[#6BAE41] hover:bg-[#7dc94f]" : 'bg-[#4290E9] hover:bg-[#4999f5]'}  h-[32px] w-[150px] flex justify-center items-center `}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : mediaUploaded ? (
                                <Check color="#fff" size={14} />
                            ) : (
                                'Submit to Client'
                            )}
                        </Button>
                    }
                    <AgentNotificationModal
                        open={showConfirmation}
                        onClose={() => setShowConfirmation(false)}
                        serviceDate={currentService ? currentService : null}
                        orderData={orderData ? orderData : null}
                    />
                    {userType === 'agent' ? (
                        <div className='flex items-center gap-[10px] mr-2'>
                            <div className='flex flex-col justify-center items-center mr-2'>
                                <p className='text-[18px] text-[#6BAE41] leading-none mb-1'>${currentBookedService?.option?.amount}</p>
                                <p className='text-[#7D7D7D] text-[10px] leading-none'>{currentBookedService?.option?.quantity || 0} Files</p>
                            </div>
                            <Button
                                className={`h-[32px] w-[100px] flex justify-center items-center 
                                    ${paymentSuccess || currentBookedService?.payment_status == 'PAID' || orderData?.payment_status === 'PAID'
                                        ? "bg-[#6BAE41] hover:bg-[#5fa43a]"
                                        : "bg-[#DC9600] hover:bg-[#eda304]"}`}
                            >
                                {currentBookedService?.payment_status == 'PAID' || orderData?.payment_status === 'PAID' ? 'Paid' : 'UnPaid'}
                            </Button>
                        </div>
                    ) : (
                        <div className='flex items-center gap-[10px] mr-2'>
                            <Button
                                className={`h-[32px] w-[100px] flex justify-center items-center pointer-events-none font-bold text-white
                                    ${paymentSuccess || currentBookedService?.payment_status == 'PAID' || orderData?.payment_status === 'PAID'
                                        ? "bg-[#6BAE41]"
                                        : "bg-[#DC9600]"}`}
                            >
                                {currentBookedService?.payment_status == 'PAID' || orderData?.payment_status === 'PAID' ? 'PAID' : 'UNPAID'}
                            </Button>
                        </div>
                    )}
                    <PayInvoiceModal open={openPaymentModal} setOpen={setOpenPaymentModal} success={paymentSuccess} setSuccess={setPaymentSuccess} />
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
            </div>
            {userType === 'admin' &&
                <div className="">
                    {/* {!success ? (
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
                            )} */}

                    <ManualPayment open={openPayment} setOpen={setOpenPayment} addPayment={handleAddPayment} />
                </div>
            }
            <div className={`p-4 flex justify-between items-center gap-4 border-b border-gray-200`}>
                <div className="flex items-center gap-4">
                    <ModeToggle mode={fileManagerMode} onModeChange={handleModeChange} />
                    <GridSizeToggle />
                </div>

                {userType === 'agent' ? (
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col items-center">
                            <span className="text-[22px] font-medium text-[#7D7D7D] leading-none">
                                {currentServiceFiles?.filter(f => f.is_agent_approved).length || 0} <span className="text-[#7D7D7D]">/ {currentBookedService?.option?.quantity || 0}</span>
                            </span>
                            <span className="text-[12px] text-[#7D7D7D] mt-1">Selected</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[22px] font-medium text-[#666666] leading-none">
                                {currentServiceFiles?.filter(f => !f.is_deleted).length || 0}
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
                ) : (
                    <Button
                        onClick={() => setOpenUpgrade(true)}
                        className={`${userType}-bg h-[32px] w-auto px-[10px] flex justify-center items-center hover-${userType}-bg`}
                    >
                        Upgrade Plan
                    </Button>
                )}
            </div>

            <div className="py-4">
                <FilePreviewModal type='HDR_photos' open={open} onOpenChange={() => { setOpen(false) }} files={files} setSelectedFiles={setSelectedVideoFiles} serviceUuid={currentService?.uuid ?? ''} reviewFilesEnabled={reviewFilesEnabled} />

                <div className="mt-4">
                    <DualModeFileManager
                        mode={fileManagerMode}
                        items={fileItems}
                        onItemsChange={handleFileItemsChange}
                        onDropFiles={handleDropFiles}
                        onClickUpload={handleFileInputClick}
                        renderItem={renderFileItem}
                        disabled={userType === 'agent'}
                        onSave={onSave}
                        modeToggleButton={userType === 'agent' ? <ModeToggle mode={fileManagerMode} onModeChange={handleModeChange} /> : undefined}
                    />
                </div>
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
                    isAgentApproved={editingFile && !('file' in editingFile) ? (editingFile as Files).is_agent_approved : false}
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
                    onDelete={editingFile ? () => {
                        if ('file' in editingFile) {
                            // Unsaved
                            setSelectedVideoFiles(prev => prev.map(f => {
                                if (f.file === editingFile.file && f.service_id === editingFile.service_id) {
                                    return { ...f, is_deleted: true };
                                }
                                return f;
                            }));
                        } else {
                            // Saved
                            handleDeleteUploadedFile((editingFile as Files).uuid);
                        }
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
