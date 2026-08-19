
import ConfirmationDialog from '@/components/ConfirmationDialog'
import NextImage from "next/image";

import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import HouseSheetModal from './HouseSheetModal';
import SquareFootage from '../../calendar/components/SquareFootage';
import { format } from 'date-fns';


import { Order, OrderService } from '../../orders/page';
import { Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { DownloadFile, ServiceCompletion, HideMediaFiles } from '../file-manager';
import { S3UploadService } from '@/lib/upload/s3-service';
import FilePreviewModal from './FilePreviewModal';
import { naturalSortFiles } from '../utils/naturalSort';
import { Services } from '../../services/page';
import { Files, SelectedFiles, useFileManagerContext } from "../FileManagerContext";
import { DownloadIcon } from '@/components/Icons';
import { useAppContext } from '@/app/context/AppContext';
import ManualPayment from './ManualPayment';
import UpgradeServicePopup from './UpgradeServicePopup';
import PhotoPreviewModal from './PhotoPreviewModal';
import DownloadModal from './DownloadModal';
import { toast } from 'sonner';
import PayInvoiceModal from './PayInvoiceModal';
import AgentNotificationModal from './AgentNotificationModal';
import { OptimizedImagePreview, PdfPlaceholder } from './OptimizedPreview';
import { DualModeFileManager } from './dual-mode/DualModeFileManager';
import { ModeToggle } from './dual-mode/ModeToggle';
import { api } from '@/lib/api';
import { FileItem, DualMode } from './dual-mode/types';
import { canDownloadFile, getDownloadBlockReason } from '../utils/filePermissions';
import { GridSizeToggle } from './dual-mode/GridSizeToggle';
import { MediaDateBoundary } from './FileManager';
type Props = {
    orderData: Order | null;
    setOrderData?: React.Dispatch<React.SetStateAction<Order | null>>;
    currentService?: Services;
    isListing: boolean;
    reviewFilesEnabled?: boolean;
    mediaDateBoundary?: MediaDateBoundary;
    currentBookedService?: OrderService;
    onOpenInvoice?: (serviceName?: string, orderServiceUuid?: string) => void;
    gstRate?: number;
    onSave?: () => void;
    isScrolled?: boolean;
    stickyOffset?: number;
    onShowHiddenMedia?: () => void;
};
const Service: React.FC<Props & { onSave?: () => void }> = ({ orderData, setOrderData, currentService, isListing, reviewFilesEnabled, onSave, mediaDateBoundary, currentBookedService, onOpenInvoice, gstRate, isScrolled, stickyOffset, onShowHiddenMedia }) => {
    const { floorFiles, setFloorFiles, filesData, setFilesData, setChangedFileUuids, setSelectionChangedUuids, imagesPerRow, filesToHide, setFilesToHide, isHidingMode, setIsHidingMode, approvalSelectedUuids, setApprovalSelectedUuids, setFileManagerMode, fileManagerMode } = useFileManagerContext();
    const [replacingFile, setReplacingFile] = useState<File | null>(null);
    const [openPreview, setOpenPreview] = useState(false);
    const [mediaUploaded, setMediaUploaded] = useState<boolean>(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [showAgain, setShowAgain] = useState(true);

    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const [openPayment, setOpenPayment] = useState(false);
    const [, setSuccess] = useState(false);
    const [isHiding, setIsHiding] = useState(false);
    const [openUpgrade, setOpenUpgrade] = useState(false);
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [imagePopupOpen, setImagePopupOpen] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | File>('');
    const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
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

            if (onSave) onSave();
            setMediaUploaded(true);
            toast.success("Submitted successfully! The admins have been notified to review your files.");
        } catch (error) {
            console.error("Submission failed:", error);
            toast.error("Failed to submit for approval. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [editingFile, setEditingFile] = useState<SelectedFiles | Files | null>(null);
    const [fileItems, setFileItems] = useState<FileItem[]>([]);

    // Cleanup generated blob URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            fileItems.forEach(item => {
                if (item.status === 'local' && item.url) {
                    URL.revokeObjectURL(item.url);
                }
            });
        };
    }, [fileItems]);
    const floorPlans = [
        "Dimensions PDF", "Branded Floor Plan", "UnBranded Floor Plan",
        "Branded Image", "Unbranded Image", "Additional Files"
    ];

    const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

    const handleModeChange = (newMode: DualMode) => {
        setFileManagerMode(newMode);
        if (newMode === 'upload' && onSave) {
            onSave(); // Trigger API request
        }
    };

    const confirmAndExecute = () => {
        pendingAction?.();
        setPendingAction(null);
    };

    const [open, setOpen] = useState(false);
    const [area, setArea] = useState<any[]>([]);

    useEffect(() => {
        if (orderData?.areas && area.length === 0) {
            setArea(orderData.areas);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderData]);

    // Filter existing files safely with useMemo to prevent infinite loops
    const currentServiceFiles = useMemo(() => {
        let files = filesData?.files
            ?.filter(file => {
                if (file?.service?.uuid !== currentService?.uuid) return false;

                // Exclude hidden files from the main gallery
                if (file.is_hidden) return false;

                // Date boundary filter for duplicate service bookings
                if (mediaDateBoundary) {
                    const fileDate = new Date(file.created_at).getTime();
                    const from = mediaDateBoundary.from ? mediaDateBoundary.from.getTime() : 0;
                    const to = mediaDateBoundary.to ? mediaDateBoundary.to.getTime() : Infinity;
                    if (fileDate < from || fileDate >= to) return false;
                }
                return true;
            })
            .sort((a, b) => {
                if (a.sort_order !== undefined && b.sort_order !== undefined) {
                    return a.sort_order - b.sort_order;
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

        if (userType === 'agent') {
            files = files?.filter(file => file.is_show !== false);
            if (reviewFilesEnabled) {
                files = files?.filter(file => file.is_admin_approved);
            }
        }
        return files || [];
    }, [filesData?.files, currentService?.uuid, userType, reviewFilesEnabled, mediaDateBoundary]);

    const contextualLocal = useMemo(() => {
        let local = floorFiles.filter(f => f.service_id === currentService?.uuid);
        if (userType === 'agent') {
            local = local.filter(f => f.is_show !== false);
        }
        return local;
    }, [floorFiles, currentService?.uuid, userType]);

    // const hasUnsavedFiles = floorFiles.some(file =>
    //     file.service_id === currentService?.uuid && (userType !== 'agent' || file.is_show !== false)
    // );

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

        setFiles(naturalSortFiles(renamedFiles));
    };

    useEffect(() => {
        if (files.length > 0) {
            setOpenPreview(true);
        }

    }, [files])

    useEffect(() => {

        setFileItems(current => {
            const newFileItems: FileItem[] = [];

            currentServiceFiles.forEach((apiFile, index) => {
                const existing = current.find(item => item.serverId === apiFile.uuid);
                if (existing) {
                    newFileItems.push({
                        ...existing,
                        originalData: apiFile,
                        order: apiFile.sort_order !== undefined ? apiFile.sort_order : existing.order,
                    });
                } else {
                    newFileItems.push({
                        clientId: crypto.randomUUID(),
                        serverId: apiFile.uuid,
                        url: apiFile.url || '',
                        status: 'uploaded',
                        order: apiFile.sort_order !== undefined ? apiFile.sort_order : index + 1,
                        originalData: apiFile,
                    });
                }
            });

            contextualLocal.forEach((localFile) => {
                const existing = current.find(item => item.originalData?.file === localFile.file);
                if (existing) {
                    newFileItems.push({
                        ...existing,
                        originalData: localFile,
                        order: localFile.sort_order !== undefined ? localFile.sort_order : existing.order,
                    });
                } else {
                    newFileItems.push({
                        clientId: crypto.randomUUID(),
                        file: localFile.file,
                        url: URL.createObjectURL(localFile.file),
                        status: 'local',
                        order: localFile.sort_order !== undefined ? localFile.sort_order : newFileItems.length + 1,
                        originalData: localFile,
                    });
                }
            });

            return newFileItems.sort((a, b) => a.order - b.order);
        });
    }, [contextualLocal, currentServiceFiles]);

    // Use passed currentBookedService
    const bookingToUse = useMemo(() => {
        return currentBookedService || orderData?.services.find((service) => service.service.uuid === currentService?.uuid)
    }, [currentBookedService, orderData?.services, currentService?.uuid]);
    const currentSlot = orderData?.slots?.find((slot) => slot.service_id === currentService?.id);
    const vendor = currentSlot?.vendor || orderData?.vendor;
    const vendorName = vendor ? `${vendor.first_name} ${vendor.last_name}` : "Taylor Tayburn";


    const handleImageClick = (imageUrl: string | File, file: SelectedFiles | Files) => {
        if (userType === 'agent' && !(bookingToUse?.payment_status === 'PAID' || orderData?.payment_status === 'PAID') && !('is_complimentary' in file && file.is_complimentary)) {
            onOpenInvoice?.(currentService?.name, bookingToUse?.uuid);
            return;
        }
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
                        files: prev.files.filter((f: Files) => f.uuid !== fileUuid)
                    };
                });
            }
            toast.success("File deleted successfully");
        } catch (err) {
            console.error('Delete error:', err);
            toast.error('Failed to delete file. Please try again.');
        }
    };

    const handleHideSubmit = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("No authentication token found");
            return;
        }

        if (filesToHide.size === 0) {
            setIsHidingMode(false);
            return;
        }

        setIsHiding(true);
        try {
            await HideMediaFiles(token, Array.from(filesToHide), true);
            toast.success("Media hidden successfully");
            setIsHidingMode(false);
            setFilesToHide(new Set());
            setFilesData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    files: prev.files.map(f => filesToHide.has(f.uuid) ? { ...f, is_hidden: true } : f)
                };
            });
        } catch (error: any) {
            toast.error(error.message || "Failed to hide media");
        } finally {
            setIsHiding(false);
        }
    };

    useEffect(() => {
        const checkServiceCompletion = async () => {
            const token = localStorage.getItem("token");
            const numberOfFiles = currentServiceFiles?.filter(f => !f.is_deleted).length ?? 0

            if (numberOfFiles >= (bookingToUse?.option?.quantity ?? 1)) {
                if (token && bookingToUse?.uuid && orderData?.uuid && !bookingToUse?.is_completed) {
                    await ServiceCompletion(token, bookingToUse.uuid, true, orderData.uuid)
                }
            }
        };
        checkServiceCompletion();
    }, [currentServiceFiles, currentService, currentBookedService, orderData, bookingToUse?.is_completed, bookingToUse?.option?.quantity, bookingToUse?.uuid])

    const renderFileItem = useCallback((item: FileItem, isDragging?: boolean) => {
        const isLocal = item.status === 'local';
        const file = item.originalData;

        const isPdf = !isLocal && (file.file_path?.toLowerCase().endsWith('.pdf') || file.type === 'pdf' || file.type === 'application/pdf');
        const isVariantUrlsEmpty = !file.variant_urls || (Array.isArray(file.variant_urls) && file.variant_urls.length === 0) || Object.keys(file.variant_urls).length === 0;

        let displayType = '2D Floor Plan';
        if (isLocal) {
            displayType = file.type === 'photo' ? 'UnBranded Floor Plan' : (file.type || 'UnBranded Floor Plan');
        } else {
            displayType = file.group || (file.type === 'photo' ? 'UnBranded Floor Plan' : (file.type || 'UnBranded Floor Plan'));
        }

        return (
            <div className={`justify-self-center group w-full ${isDragging ? 'opacity-80 scale-105' : ''}`}>
                <div>
                    <p
                        className={`uppercase font-semibold ${userType}-text pl-2 pb-2 block truncate w-full pr-2`}
                        style={{ fontSize: imagesPerRow >= 6 ? '10px' : imagesPerRow >= 5 ? '13px' : '18px' }}
                        title={displayType}
                    >
                        {displayType}
                        {file.is_hidden && (
                            <span className="ml-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold">Hidden</span>
                        )}
                    </p>
                    <div
                        className="relative w-full aspect-[4/3] border border-[#A8A8A8] rounded-[6px] overflow-hidden"
                        style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    >
                        {isLocal ? (
                            <div className="absolute inset-0 overflow-hidden rounded-[6px]">
                                <OptimizedImagePreview
                                    file={file.file}
                                    alt="Preview"
                                    className={`absolute inset-0 w-full h-full object-contain cursor-pointer transition-all duration-300 ${file.is_deleted ? 'blur-[2px] opacity-40 grayscale' : (!file.is_admin_approved && reviewFilesEnabled && userType === 'admin' ? 'opacity-70' : '')} ${file.is_hidden ? 'grayscale opacity-60' : ''}`}
                                    draggable={false}
                                    onClick={() => {
                                        if (isHidingMode && file.uuid) {
                                            setFilesToHide(prev => { const next = new Set(prev); if (next.has(file.uuid)) next.delete(file.uuid); else next.add(file.uuid); return next; });
                                        } else if (!isHidingMode) {
                                            if (!file.is_deleted) handleImageClick(item.url, file);
                                        }
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-[20] pointer-events-none">
                                    <p className="text-white font-medium text-sm drop-shadow-md">Processing...</p>
                                </div>
                                {file.uuid && filesToHide.has(file.uuid) && (
                                    <div className="absolute inset-0 bg-black/50 z-[25] flex flex-col items-center justify-center pointer-events-none">
                                        <Check color="white" size={48} className="opacity-100" />
                                    </div>
                                )}
                                {(userType === 'admin' || userType === 'agent') && file.uuid && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span
                                                className="cursor-pointer absolute top-2 right-2 z-[26] bg-white/50 p-1 rounded-full hover:bg-white/80 transition"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFilesToHide(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(file.uuid)) next.delete(file.uuid);
                                                        else next.add(file.uuid);
                                                        return next;
                                                    });
                                                }}
                                            >
                                                {filesToHide.has(file.uuid) ? <EyeOff size={16} className="text-[#E06D5E]" /> : <Eye size={16} className="text-gray-700" />}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="max-w-[240px] text-xs leading-tight">
                                                {filesToHide.has(file.uuid)
                                                    ? "Hidden Floor Plan: Click to show on property tour & client downloads"
                                                    : "Visible Floor Plan: Click to hide from property tour & client downloads"}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {file.is_deleted && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 z-[30] gap-2">
                                        <p className="text-white font-medium text-lg drop-shadow-lg uppercase mb-4">Deleted</p>
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFloorFiles(prev =>
                                                    prev.map(f => f.file === file.file ? { ...f, is_deleted: false } : f)
                                                );
                                            }}
                                            className="h-7 px-2 md:px-3 text-[11px] md:text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                        >
                                            Restore
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : file.is_processing ? (
                            <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                                <p className="text-gray-500 font-medium text-sm">Processing...</p>
                            </div>
                        ) : (userType === 'agent' && bookingToUse?.payment_status !== 'PAID' && orderData?.payment_status !== 'PAID' && !file.is_complimentary) ? (
                            <PdfPlaceholder
                                className="w-full h-full object-contain cursor-pointer"
                                isRestricted={true}
                                onClick={() => {
                                    if (isHidingMode && file.uuid) {
                                        setFilesToHide(prev => { const next = new Set(prev); if (next.has(file.uuid)) next.delete(file.uuid); else next.add(file.uuid); return next; });
                                    } else if (!isHidingMode) {
                                        onOpenInvoice?.(currentService?.name, bookingToUse?.uuid);
                                    }
                                }}
                            />
                        ) : isPdf ? (
                            isVariantUrlsEmpty ? (
                                <PdfPlaceholder
                                    className="w-full h-full object-contain cursor-pointer"
                                    message="service is not paid yet"
                                    onClick={() => {
                                        if (isHidingMode && file.uuid) {
                                            setFilesToHide(prev => { const next = new Set(prev); if (next.has(file.uuid)) next.delete(file.uuid); else next.add(file.uuid); return next; });
                                        } else if (!isHidingMode) {
                                            onOpenInvoice?.(currentService?.name, bookingToUse?.uuid);
                                        }
                                    }}
                                />
                            ) : (
                                <div className="absolute inset-0 overflow-hidden rounded-[6px]">
                                    <div
                                        className={`relative overflow-hidden cursor-pointer w-full h-full transition-all duration-300 ${!file.is_admin_approved && reviewFilesEnabled && userType === 'admin' ? 'opacity-70' : ''} ${file.is_hidden ? 'grayscale opacity-60' : ''}`}
                                        onClick={() => {
                                            if (isHidingMode && file.uuid) {
                                                setFilesToHide(prev => { const next = new Set(prev); if (next.has(file.uuid)) next.delete(file.uuid); else next.add(file.uuid); return next; });
                                            } else if (!isHidingMode) {
                                                handleImageClick(file.variant_urls?.popup || file.url || `${API_URL}/${file.file_path}`, file);
                                            }
                                        }}
                                    >
                                        <iframe
                                            src={`${file.variant_urls?.popup || file.url || `${API_URL}/${file.file_path}`}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                            className="w-full h-full pointer-events-none border-none object-cover scale-[1.14] origin-top"
                                            tabIndex={-1}
                                            scrolling="no"
                                        />
                                        <div className="absolute inset-0 bg-transparent" />
                                    </div>
                                </div>
                            )
                        ) : (
                            <>
                                <NextImage
                                    src={file.variant_urls?.thumb || file.thumbnail_url || file.url || `${API_URL}/${file.file_path}`}
                                    onClick={() => {
                                        if (isHidingMode && file.uuid) {
                                            setFilesToHide(prev => { const next = new Set(prev); if (next.has(file.uuid)) next.delete(file.uuid); else next.add(file.uuid); return next; });
                                        } else if (!isHidingMode) {
                                            handleImageClick(file.variant_urls?.popup || file.url || `${API_URL}/${file.file_path}`, file);
                                        }
                                    }}
                                    alt="Preview"
                                    fill
                                    draggable={false}
                                    className={`object-contain cursor-pointer ${!file.is_admin_approved && reviewFilesEnabled && userType === 'admin' ? 'opacity-70' : ''} ${file.is_hidden ? 'grayscale opacity-60' : ''}`}
                                />
                                {file.uuid && filesToHide.has(file.uuid) && (!file.file || typeof file.file === 'string') && (
                                    <div className="absolute inset-0 bg-black/50 z-[25] flex flex-col items-center justify-center pointer-events-none">
                                        <Check color="white" size={48} className="opacity-100" />
                                    </div>
                                )}
                                {(userType === 'admin' || userType === 'agent') && file.uuid && (!file.file || typeof file.file === 'string') && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span
                                                className="cursor-pointer absolute top-2 right-2 z-[26] bg-white/50 p-1 rounded-full hover:bg-white/80 transition"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFilesToHide(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(file.uuid)) next.delete(file.uuid);
                                                        else next.add(file.uuid);
                                                        return next;
                                                    });
                                                }}
                                            >
                                                {filesToHide.has(file.uuid) ? <EyeOff size={16} className="text-[#E06D5E]" /> : <Eye size={16} className="text-gray-700" />}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="max-w-[240px] text-xs leading-tight">
                                                {filesToHide.has(file.uuid)
                                                    ? "Hidden Floor Plan: Click to show on property tour & client downloads"
                                                    : "Visible Floor Plan: Click to hide from property tour & client downloads"}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </>
                        )}



                        {/* Unsaved media remove button hidden during processing */}

                        {userType === 'admin' && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className="absolute flex justify-between items-center bottom-2 left-2 z-10 cursor-pointer bg-white/90 p-1.5 rounded-[4px] shadow-sm border border-gray-200"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isLocal) {
                                                setFloorFiles(prev =>
                                                    prev.map(f => f.file === file.file ? { ...f, is_admin_approved: !f.is_admin_approved } : f)
                                                );
                                            } else {
                                                if (file.is_admin_approved) {
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
                                                                    return { ...f, is_admin_approved: false };
                                                                }
                                                                return f;
                                                            })
                                                        };
                                                    });
                                                } else {
                                                    setApprovalSelectedUuids(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(file.uuid!)) {
                                                            next.delete(file.uuid!);
                                                        } else {
                                                            next.add(file.uuid!);
                                                        }
                                                        return next;
                                                    });
                                                }
                                            }
                                        }}
                                    >
                                        {isLocal || file.is_admin_approved ? (
                                            <>
                                                <div className={`w-4 h-4 border rounded mr-1.5 flex items-center justify-center ${file.is_admin_approved ? `${userType}-bg ${userType}-border` : 'bg-white border-[#7D7D7D]'}`}>
                                                    {file.is_admin_approved && <Check color="white" size={12} />}
                                                </div>
                                                <span className="text-[11px] font-bold text-[#7D7D7D]">Approved</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className={`w-4 h-4 border rounded mr-1.5 flex items-center justify-center transition-colors ${approvalSelectedUuids.has(file.uuid!) ? 'bg-amber-500 border-amber-500' : 'bg-white border-gray-400'}`}>
                                                    {approvalSelectedUuids.has(file.uuid!) && <Check color="white" size={12} />}
                                                </div>
                                                <span className={`text-[11px] font-bold ${approvalSelectedUuids.has(file.uuid!) ? 'text-amber-700' : 'text-gray-500'}`}>Select for Approval</span>
                                            </>
                                        )}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-[240px] text-xs leading-tight">
                                        {file.is_admin_approved
                                            ? "Admin Approved: Floor plan has been quality checked and approved by admin, making it available for the agent to review, select, and download"
                                            : (approvalSelectedUuids.has(file.uuid!)
                                                ? "Selected for Admin Approval: Click to toggle selection"
                                                : "Select for Admin Approval: Click to include in batch admin approval")}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        )}


                    </div>
                </div>
                <div
                    className='grid grid-cols-4 gap-1 justify-between items-center px-1 py-1'
                    style={{ backgroundColor: `var(--${userType}-page-bg, #ffffff)`, fontSize: '14px' }}
                >
                    <p className="col-span-2 text-[#8E8E8E] mt-1 truncate" style={{ fontSize: '14px' }} title={`Uploaded by: ${vendorName}`}>{isLocal ? 'Uploaded by: ' + vendorName : 'Uploaded by: ' + vendorName}</p>
                    <div className='col-span-2 flex items-center justify-between overflow-hidden' style={{ fontSize: '14px' }}>
                        <p className='text-[#8E8E8E] mt-1 truncate pr-1' style={{ fontSize: '14px' }}>
                            {isLocal
                                ? format(new Date(), 'MM/dd/yyyy')
                                : (file.created_at ? format(new Date(file.created_at), 'MM/dd/yyyy') : format(new Date(), 'MM/dd/yyyy'))
                            }
                        </p>
                        {isLocal ? null : canDownloadFile({
                            file: file as Files,
                            currentService,
                            orderData,
                            userType,
                        }) ? (
                            <span
                                onClick={(e) => { e.stopPropagation(); handledownloadFile(file.uuid, file.name) }}
                                className='flex shrink-0 cursor-pointer' style={{ width: imagesPerRow >= 6 ? '16px' : '24px', height: imagesPerRow >= 6 ? '16px' : '24px' }}>
                                <DownloadIcon width='100%' height='100%' fill='#6BAE41' />
                            </span>
                        ) : (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span
                                        className='flex shrink-0 cursor-not-allowed opacity-50' style={{ width: imagesPerRow >= 6 ? '16px' : '24px', height: imagesPerRow >= 6 ? '16px' : '24px' }}>
                                        <DownloadIcon width='100%' height='100%' fill='#6BAE41' />
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {getDownloadBlockReason({
                                        file: file as Files,
                                        currentService,
                                        orderData,
                                        userType,
                                    }) || 'Download not available'}
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </div>
            </div>
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [API_URL, bookingToUse?.payment_status, orderData?.payment_status, setChangedFileUuids, setSelectionChangedUuids, setFilesData, setFloorFiles, vendorName, bookingToUse?.option?.title, bookingToUse?.uuid, currentService?.uuid, handleImageClick, orderData?.uuid, reviewFilesEnabled, userType, imagesPerRow, filesToHide, isHidingMode, setFilesToHide, onOpenInvoice, currentService?.name]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _selectedAction = userType === 'agent' ? (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
                disabled={isHiding}
                onClick={(e) => {
                    e.stopPropagation();
                    if (isHiding) return;
                    if (filesToHide.size > 0) {
                        handleHideSubmit();
                    } else {
                        if (onShowHiddenMedia) onShowHiddenMedia();
                    }
                }}
                className={`h-7 md:h-8 px-2.5 md:px-3.5 text-[11px] md:text-xs font-semibold rounded-[6px] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                    filesToHide.size > 0
                        ? 'bg-amber-600 hover:bg-amber-700 text-white border-none'
                        : 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                }`}
            >
                {isHiding ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : filesToHide.size > 0 ? (
                    <EyeOff className="h-3.5 w-3.5" />
                ) : (
                    <Eye className="h-3.5 w-3.5 text-slate-500" />
                )}
                <span>{filesToHide.size > 0 ? `Hide Media (${filesToHide.size})` : 'Show Hidden Media'}</span>
            </Button>
        </div>
    ) : null;

    const adminSavedFilesAction = userType === 'admin' ? (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
                disabled={isHiding}
                onClick={(e) => {
                    e.stopPropagation();
                    if (isHiding) return;
                    if (filesToHide.size > 0) {
                        handleHideSubmit();
                    } else {
                        if (onShowHiddenMedia) onShowHiddenMedia();
                    }
                }}
                className={`h-7 md:h-8 px-2.5 md:px-3.5 text-[11px] md:text-xs font-semibold rounded-[6px] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                    filesToHide.size > 0
                        ? 'bg-amber-600 hover:bg-amber-700 text-white border-none'
                        : 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                }`}
            >
                {isHiding ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : filesToHide.size > 0 ? (
                    <EyeOff className="h-3.5 w-3.5" />
                ) : (
                    <Eye className="h-3.5 w-3.5 text-slate-500" />
                )}
                <span>{filesToHide.size > 0 ? `Hide Media (${filesToHide.size})` : 'Show Hidden Media'}</span>
            </Button>
        </div>
    ) : null;

    return (
        <div>
            {!isListing && (
                <div
                    className={`w-full flex flex-wrap justify-between items-center px-4 font-alexandria overflow-visible transition-all duration-300 z-10 gap-y-2 ${isScrolled ? "sticky min-h-[44px] py-1 shadow-sm" : "relative min-h-[66px] py-2"
                        }`}
                    style={{
                        backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)`,
                        top: isScrolled ? `${stickyOffset}px` : "auto"
                    }}
                >
                    <div className="shrink-0">
                        {(userType !== 'agent') ? (
                            <div className="flex gap-2 items-center">
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`justify-center rounded-[6px] font-raleway border-[1px] ${userType}-border ${userType}-bg text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover-${userType}-bg transition-all duration-300 ${isScrolled ? "h-[24px] w-[70px] text-[10px]" : "h-[26px] w-[80px] text-[10px] md:h-[32px] md:w-[130px] md:text-[12px]"
                                        } px-1 md:px-4`}
                                >
                                    Add File
                                </Button>
                                {userType === 'admin' && (
                                    <Button
                                        onClick={() => {
                                            setShowDownloadModal(true);
                                        }}
                                        className={`${userType}-bg hover-${userType}-bg flex justify-center items-center cursor-pointer transition-all duration-300 ${isScrolled ? "h-[24px] w-[70px] text-[10px]" : "h-[26px] w-[80px] text-[10px] md:h-[32px] md:w-[130px] md:text-[12px]"
                                            } px-1 md:px-4`}
                                    >
                                        Download Files
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="flex gap-2 items-center">
                                <Button
                                    onClick={() => {
                                        setShowDownloadModal(true);
                                    }}
                                    title={!(bookingToUse?.payment_status === "PAID" || orderData?.payment_status === "PAID") ? "service not paid yet" : ""}
                                    disabled={!(bookingToUse?.payment_status === "PAID" || orderData?.payment_status === "PAID")}
                                    className={`${userType}-bg hover-${userType}-bg flex justify-center items-center transition-all duration-300 ${isScrolled ? "h-[24px] w-[70px] text-[10px]" : "h-[26px] w-[80px] text-[10px] md:h-[32px] md:w-[130px] md:text-[12px]"
                                        } px-1 md:px-4 ${!(bookingToUse?.payment_status === "PAID" || orderData?.payment_status === "PAID") ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                    Download Files
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <p className='flex flex-col items-center pointer-events-auto'>
                            <span className={`font-bold transition-all duration-300 ${userType}-text ${isScrolled ? "text-[13px]" : "text-[16px]"}`}>{currentService ? currentService.name : ''}</span>
                            {!isScrolled && (
                                <span className='text-[12px] text-[#7D7D7D]'>
                                    {bookingToUse?.option?.title || `${bookingToUse?.option?.quantity || 0} Files`}
                                </span>
                            )}
                        </p>
                    </div>
                    <div className='flex items-center gap-x-2 shrink-0'>
                        <div className='flex justify-center items-center gap-x-2 md:gap-x-[14px] shrink-0'>

                            {/* {(userType === 'agent') && (
                                <Button
                                    onClick={() => {
                                        if (isHidingMode) {
                                            handleHideSubmit();
                                        } else {
                                            setIsHidingMode(true);
                                            setFilesToHide(new Set());
                                        }
                                    }}
                                    variant={isHidingMode ? 'default' : 'outline'}
                                    className={`flex justify-center items-center transition-all duration-300 ${
                                        isScrolled ? "h-[28px] w-[100px] text-[11px]" : "h-[32px] w-[120px]"
                                    } ${isHidingMode ? 'bg-[#E06D5E] hover:bg-[#c45a4d] text-white' : 'border-[#E06D5E] text-[#E06D5E] hover:bg-red-50'}`}
                                >
                                    {isHidingMode ? 'Save' : 'Hide Media'}
                                </Button>
                            )} */}
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
                            <AgentNotificationModal
                                open={showEmailConfirmation}
                                onClose={() => setShowEmailConfirmation(false)}
                                serviceDate={currentService ? currentService : null}
                                orderData={orderData ? orderData : null}
                            />
                            {userType === 'agent' ? (
                                <div className='flex items-center gap-[5px] md:gap-[10px] md:mr-2'>
                                    <div className='flex flex-col justify-center items-end mr-1 md:mr-2 text-right'>
                                        <p className={`text-[13px] md:text-[18px] ${bookingToUse?.payment_status === 'REFUNDED' || orderData?.payment_status === 'REFUNDED' ? 'text-[#D0021B]' : (paymentSuccess || bookingToUse?.payment_status == 'PAID' || orderData?.payment_status === 'PAID' ? 'text-[#6BAE41]' : 'text-[#E06D5E]')} leading-none mb-1`}>
                                            ${(parseFloat(bookingToUse?.option?.amount || "0") + (gstRate ? parseFloat(bookingToUse?.option?.amount || "0") * gstRate : 0)).toFixed(2)}
                                        </p>
                                        <p className='text-[#7D7D7D] text-[9px] md:text-[10px] leading-none'>
                                            {gstRate ? `incl. $${(parseFloat(bookingToUse?.option?.amount || "0") * gstRate).toFixed(2)} GST` : `${bookingToUse?.option?.quantity || 1} Files`}
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
                            ) : userType === 'admin' ? (
                                <div className='flex items-center gap-[5px] md:gap-[10px] md:mr-2'>
                                    <div className='flex flex-col justify-center items-end mr-1 md:mr-2 text-right'>
                                        <p className={`text-[13px] md:text-[18px] ${bookingToUse?.payment_status === 'REFUNDED' || orderData?.payment_status === 'REFUNDED' ? 'text-[#D0021B]' : (paymentSuccess || bookingToUse?.payment_status == 'PAID' || orderData?.payment_status === 'PAID' ? 'text-[#6BAE41]' : 'text-[#E06D5E]')} leading-none mb-1`}>
                                            ${(parseFloat(bookingToUse?.option?.amount || "0") + (gstRate ? parseFloat(bookingToUse?.option?.amount || "0") * gstRate : 0)).toFixed(2)}
                                        </p>
                                        <p className='text-[#7D7D7D] text-[9px] md:text-[10px] leading-none'>
                                            {gstRate ? `incl. $${(parseFloat(bookingToUse?.option?.amount || "0") * gstRate).toFixed(2)} GST` : `${bookingToUse?.option?.quantity || 1} Files`}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            onOpenInvoice?.(currentService?.name, bookingToUse?.uuid);
                                        }}
                                        className={`h-[24px] w-[60px] text-[10px] md:h-[32px] md:w-[100px] md:text-[14px] flex justify-center items-center font-bold text-white cursor-pointer px-1 md:px-4
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
                            ) : null}
                            <PayInvoiceModal open={openPaymentModal} setOpen={setOpenPaymentModal} success={paymentSuccess} setSuccess={setPaymentSuccess} />
                            <UpgradeServicePopup
                                open={openUpgrade}
                                setOpen={setOpenUpgrade}
                                currentService={currentService}
                                currentOption={bookingToUse?.option}
                                orderData={orderData}
                                currentBookedService={currentBookedService}
                                onSuccess={() => {
                                    // Refresh the page to get updated order data
                                    window.location.reload()
                                }}
                            />

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
                                e.target.value = "";
                            }}
                        />
                        <FilePreviewModal type='floor_plans' open={openPreview} onOpenChange={() => { setOpenPreview(false) }} files={files} setSelectedFiles={setFloorFiles} serviceUuid={currentService?.uuid || ""} reviewFilesEnabled={reviewFilesEnabled} onSave={onSave} />
                    </div>
                </div>)}
            {userType === 'admin' && <div className="">
                {/* {!success ? (
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
                                )} */}

                {/* Popup */}
                <ManualPayment open={openPayment} setOpen={setOpenPayment} addPayment={handleAddPayment} />
            </div>}
            {!isListing &&
                <div className={`p-3 md:p-4 flex flex-row flex-wrap justify-between items-center gap-x-4 gap-y-3 border-b border-gray-200 font-alexandria`}>
                    <div className="flex items-center gap-2 w-auto">
                        <div>
                            <ModeToggle mode={fileManagerMode} onModeChange={handleModeChange} />
                        </div>
                        <GridSizeToggle />
                    </div>

                    <div className="flex items-center gap-4 md:gap-8 flex-wrap w-auto justify-end">
                        <div className="flex flex-col items-center">
                            <span className="text-[20px] md:text-[26px] font-medium text-[#666666] leading-none">
                                {currentServiceFiles?.filter(f => !f.is_deleted).length || 0}
                            </span>
                            <span className="text-[11px] md:text-[12px] text-[#666666] mt-1">Total Files</span>
                        </div>
                        {userType !== 'vendor' && (
                            <Button
                                variant="outline"
                                onClick={() => setOpenUpgrade(true)}
                                className={`${userType}-bg hover-${userType}-bg text-white hover:!text-white hover:brightness-90 h-[28px] md:h-[32px] w-auto px-2 md:px-4 flex justify-center items-center ml-2 border-none text-[11px] md:text-sm`}
                            >
                                Upgrade Plan
                            </Button>
                        )}
                    </div>
                </div>}
            <div className='w-full px-4 md:px-[200px] pt-6 md:pt-[54px]'>
                <div className='w-full px-2 md:px-[80px] pb-8 md:pb-[60px] gap-y-6'>
                    <p className={`font-semibold text-lg ${userType}-text uppercase`}>Square Footage</p>
                    <div className="flex justify-center w-full">
                        <div className="w-full md:w-[700px] pt-4 md:pt-6 overflow-x-auto">
                            <SquareFootage
                                currentOrder={orderData || undefined}
                            />
                        </div>
                    </div>
                    {userType !== 'agent' && (
                        <div className='flex items-center justify-end pt-6'>
                            <Button onClick={() => setOpen(true)} className={`w-[150px] md:w-[143px] h-[32px] md:h-[32px]  justify-center rounded-[6px] font-raleway border-[1px] ${userType}-border ${userType}-bg text-[14px] md:text-[16px] font-[600] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover-${userType}-bg`}>Edit</Button>
                        </div>
                    )}
                </div>
            </div>

            <div className='w-full pb-[54px] flex flex-col items-center justify-center'>
                {userType === 'vendor' && reviewFilesEnabled && (
                    <div className="w-[80%] max-w-[800px] mb-6 p-4 border border-blue-200 bg-blue-50 rounded-[8px] flex items-start gap-3 font-alexandria shadow-sm self-center">
                        <span className="text-[18px] text-blue-600 mt-0.5">ℹ️</span>
                        <p className="text-[13px] text-blue-700 leading-relaxed font-medium">
                            Your uploads are undergoing Admin Approval. Once approved by the administrator, they will be released to the booking agent.
                        </p>
                    </div>
                )}
                <DualModeFileManager
                    mode={fileManagerMode}
                    items={fileItems}
                    onItemsChange={(newItems) => {
                        setFileItems(newItems);

                        // Update local state and context to reflect new sort order
                        newItems.forEach((item, index) => {
                            const newSortOrder = index + 1;
                            if (item.status === 'local') {
                                // For files not yet uploaded, update SelectedFiles
                                setFloorFiles(prev => prev.map(f => {
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
                    }}
                    onDropFiles={handleFilesChange}
                    onClickUpload={() => fileInputRef.current?.click()}
                    renderItem={renderFileItem}
                    disabled={userType === 'agent'}
                    onSave={onSave}
                    savedFilesAction={adminSavedFilesAction}
                    singleAccordionTitle="all floor plans"
                    hideDashedBorder={true}
                    modeToggleButton={<ModeToggle mode={fileManagerMode} onModeChange={handleModeChange} />}
                />
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
                onSuccess={(updatedOrder) => {
                    if (updatedOrder && setOrderData) {
                        setOrderData(updatedOrder);
                    }
                }}
            />

            <PhotoPreviewModal
                open={imagePopupOpen}
                onClose={() => {
                    setImagePopupOpen(false);
                    setEditingFile(null);
                }}
                file={editingFile && 'file' in editingFile ? editingFile.file : selectedImageUrl}
                title={editingFile ? (('file' in editingFile) ? editingFile.type : (editingFile as Files).group || (editingFile as Files).type || '2D Floor Plan') : '2D Floor Plan'}
                initialName={editingFile ? (('file' in editingFile) ? editingFile.type : (editingFile as Files).group || (editingFile as Files).type || '2D Floor Plan') : ''}
                isPaid={bookingToUse?.payment_status === 'PAID' || orderData?.payment_status === 'PAID'}
                isAgentApproved={editingFile && !('file' in editingFile) ? (editingFile as Files).is_agent_approved : false}
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
                onDelete={editingFile ? () => {
                    if ('file' in editingFile) {
                        // Unsaved
                        setFloorFiles(prev => prev.map(f =>
                            f.file === editingFile.file ? { ...f, is_deleted: true } : f
                        ));
                    } else if ((editingFile as Files).uuid) {
                        // Saved
                        handleDeleteUploadedFile((editingFile as Files).uuid);
                    }
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

        </div >
    )
}

export default Service