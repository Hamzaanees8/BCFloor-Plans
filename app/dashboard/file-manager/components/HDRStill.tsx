import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import CopyableFileName from './CopyableFileName';
import FilePreviewModal from './FilePreviewModal';
import { naturalSortFiles } from '../utils/naturalSort';
import { Check, Star, Loader2, ListFilter, ArrowDownAZ, Calendar, ListOrdered, Eye, EyeOff, MinusCircle } from 'lucide-react';
import { DownloadIcon } from '@/components/Icons';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Services } from '../../services/page';
import { Files, SelectedFiles, useFileManagerContext } from '../FileManagerContext';
import { toast } from 'sonner';
import { Order, OrderService } from '../../orders/page';
import { DownloadFile, ServiceCompletion, HideMediaFiles } from '../file-manager';
import { S3UploadService } from '@/lib/upload/s3-service';
import ManualPayment from './ManualPayment';
import { useAppContext } from '@/app/context/AppContext';
import UpgradeServicePopup from './UpgradeServicePopup';
import PayInvoiceModal from './PayInvoiceModal';
import AgentNotificationModal from './AgentNotificationModal';
import PhotoPreviewModal from './PhotoPreviewModal';
import DownloadModal from './DownloadModal';
import { useS3Upload } from '@/hooks/useS3Upload';
import { UploadProgressOverlay } from './UploadProgressOverlay';
import { OptimizedImagePreview, PdfPlaceholder } from './OptimizedPreview';
import { DualModeFileManager } from './dual-mode/DualModeFileManager';
import { PanoramaBadge } from './PanoramaBadge';
import { PanoramaViewer } from './PanoramaViewer';
import { isPanoramaFile } from '../utils/panoramaUtils';
import { api } from '@/lib/api';
import { ModeToggle } from './dual-mode/ModeToggle';
import { FileItem, DualMode } from './dual-mode/types';
import { GridSizeToggle } from './dual-mode/GridSizeToggle';
import { MediaDateBoundary } from '../components/FileManager';

export interface PaymentData {
    payment_type: "cheque" | "bank_transfer" | "cash"; // restrict to valid types
    cheque_number?: string;
    bank_name?: string;
    transfer_ref?: string;
    notes?: string;
}


function FileTab1({ currentService, orderData, isListing, reviewFilesEnabled, onSave, mediaDateBoundary, currentBookedService, onOpenInvoice, gstRate, isScrolled, stickyOffset, onShowHiddenMedia }: { currentService?: Services, orderData: Order | null, isListing?: boolean, reviewFilesEnabled?: boolean, onSave?: (overrideChangedFiles?: Files[]) => void, mediaDateBoundary?: MediaDateBoundary, currentBookedService?: OrderService, onOpenInvoice?: (serviceName?: string, orderServiceUuid?: string) => void, gstRate?: number, isScrolled?: boolean, stickyOffset?: number, onShowHiddenMedia?: () => void }) {
    const [files, setFiles] = useState<File[]>([]);
    const [sortBy, setSortBy] = useState<'order' | 'name' | 'date'>('order');
    const [mediaUploaded, setMediaUploaded] = useState<boolean>(false);
    const [open, setOpen] = useState(false);
    const [openUpgrade, setOpenUpgrade] = useState(false);
    const { selectedFiles, setSelectedFiles, filesData, setFilesData, changedFileUuids, setChangedFileUuids, setSelectionChangedUuids, fileManagerMode, setFileManagerMode, imagesPerRow, isHidingMode, setIsHidingMode, filesToHide, setFilesToHide, approvalSelectedUuids, setApprovalSelectedUuids } = useFileManagerContext();
    const [openPayment, setOpenPayment] = useState(false);
    const [, setSuccess] = useState(false);
    const [isHiding, setIsHiding] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [imagePopupOpen, setImagePopupOpen] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | File>('');
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [editingFile, setEditingFile] = useState<SelectedFiles | Files | null>(null);
    const [replacingFile, setReplacingFile] = useState<File | null>(null);
    const [shrinkingIds, setShrinkingIds] = useState<Set<string>>(new Set());
    const [flyingClones, setFlyingClones] = useState<{ id: string; src: string; rect: DOMRect }[]>([]);
    const { userType } = useAppContext()
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isBulkSelecting, setIsBulkSelecting] = useState<boolean>(false);
    const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeselecting, setIsBulkDeselecting] = useState<boolean>(false);
    const [bulkDeselectedIds, setBulkDeselectedIds] = useState<Set<string>>(new Set());
    const [panoramaViewerOpen, setPanoramaViewerOpen] = useState(false);
    const [panoramaInitialIndex, setPanoramaInitialIndex] = useState(0);

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
    const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

    const handleModeChange = (newMode: DualMode) => {
        setFileManagerMode(newMode);
        if (newMode === 'upload' && onSave) {
            onSave(); // Trigger API request
        }
    };

    // Initialize S3 upload hook
    const s3Upload = useS3Upload({
        entityType: 'tour',
        entityId: filesData?.uuid || '',
        tourId: filesData?.uuid || '', // Explicitly pass tourId for backend compatibility
        serviceId: currentService?.uuid,
        group: 'HDR_photos',
    });

    const handleFileInputClick = () => {
        setFiles([])
        fileInputRef.current?.click();
    };



    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        const validFiles = selected.filter(file => !file.type.startsWith('video/'));
        const hasVideo = selected.some(file => file.type.startsWith('video/'));

        if (hasVideo) {
            toast.error("Video files are not allowed here.");
        }

        if (validFiles.length > 0) {
            if (replacingFile) {
                setSelectedFiles(prev => prev.map(f => {
                    if (f.file === replacingFile) {
                        return { ...f, file: validFiles[0] };
                    }
                    return f;
                }));
                setReplacingFile(null);
                setFiles([]);
                e.target.value = "";
                return;
            }
            setFiles(naturalSortFiles(validFiles));
        }
        e.target.value = "";
    };

    const handleFilesChange = (selectedFiles: File[]) => {
        setFiles(naturalSortFiles(selectedFiles));
    };

    useEffect(() => {
        if (files.length > 0) {
            setOpen(true);
        }

    }, [files])

    // Use passed currentBookedService
    const bookingToUse = currentBookedService;

    // Filter existing files safely with useMemo
    const currentServiceFiles = useMemo(() => {
        let files = filesData?.files
            ?.filter((file: Files) => {
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
                const nameA = a.group || a.name || "";
                const nameB = b.group || b.name || "";

                if (sortBy === 'name') {
                    return nameA.localeCompare(nameB);
                } else if (sortBy === 'date') {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                } else {
                    // Default to order (sort_order)
                    if (a.sort_order !== undefined && b.sort_order !== undefined) {
                        return a.sort_order - b.sort_order;
                    }
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }
            });

        // If Agent, show only approved files for download + obey service quantity limit
        if (userType === 'agent') {
            // Allow agents to see all visible files so they can select them.
            files = files?.filter(file => file.is_show !== false);

            if (reviewFilesEnabled) {
                files = files?.filter(file => file.is_admin_approved === true);
            }

            // Quantity limit and download permissions are enforced at the UI level 
            // (e.g. disabling download buttons) rather than hiding files from the selection gallery.
        }

        return files || [];
    }, [filesData?.files, currentService?.uuid, userType, reviewFilesEnabled, sortBy, mediaDateBoundary]);

    const filesForService = useMemo(() => selectedFiles.filter(f => f.service_id === currentService?.uuid), [selectedFiles, currentService?.uuid]);

    // Map files to DualMode format
    const [fileItems, setFileItems] = useState<FileItem[]>([]);

    useEffect(() => {
        const sortedServerFiles = (currentServiceFiles || []).map((f, index) => ({
            clientId: f.uuid, // Use existing UUID as client ID for stability
            serverId: f.uuid,
            url: f.variant_urls?.thumb || f.thumbnail_url || f.url || (f.file_path ? `${API_URL}/${f.file_path}` : ''),
            status: 'uploaded' as const,
            order: index + 1,
            originalData: f
        }));

        const localItems = filesForService.map((f, index) => {
            // Find existing local item to preserve clientId, or generate new one
            const existing = fileItems.find(item => item.file === f.file);
            return {
                clientId: existing ? existing.clientId : crypto.randomUUID(),
                file: f.file,
                url: URL.createObjectURL(f.file),
                status: 'local' as const,
                order: sortedServerFiles.length + index + 1,
                originalData: f
            };
        });

        // Combine them and sort based on active sort criteria
        const combined = [...localItems, ...sortedServerFiles].sort((a, b) => {
            if (sortBy === 'name') {
                const nameA = a.status === 'local' ? (a.originalData?.type || a.file?.name || "") : (a.originalData?.group || a.originalData?.name || "");
                const nameB = b.status === 'local' ? (b.originalData?.type || b.file?.name || "") : (b.originalData?.group || b.originalData?.name || "");
                return nameA.localeCompare(nameB);
            } else if (sortBy === 'date') {
                const dateA = a.status === 'local' ? (a.file?.lastModified || 0) : new Date(a.originalData?.created_at || 0).getTime();
                const dateB = b.status === 'local' ? (b.file?.lastModified || 0) : new Date(b.originalData?.created_at || 0).getTime();
                return dateB - dateA;
            } else {
                return a.order - b.order;
            }
        });

        setFileItems(combined);

        return () => {
            localItems.forEach(item => URL.revokeObjectURL(item.url));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentServiceFiles, filesForService, sortBy]);


    const handleFileItemsChange = (newItems: FileItem[]) => {
        setFileItems(newItems);

        // --- Global-slot-preserving local reorder ---
        // The set of sort_order values a service "owns" globally stays fixed.
        // We only redistribute those values across the new positions.
        // This prevents service-level drag from corrupting globally-assigned numbers.

        // Collect the globally-sorted sort_order slots currently owned by this service
        const uploadedSlots = (filesData?.files ?? [])
            .filter(f => f.service?.uuid === currentService?.uuid && !f.is_hidden)
            .map(f => f.sort_order)
            .sort((a, b) => a - b); // ascending slot pool

        // Highest existing slot — new local files get appended after this
        const maxSlot = uploadedSlots.length > 0 ? Math.max(...uploadedSlots) : 0;

        // Separate items by status so we can assign slots independently
        const uploadedItems = newItems.filter(item => item.status === 'uploaded');
        const localItems = newItems.filter(item => item.status === 'local');

        // Assign sort_orders to uploaded items using preserved slot values
        uploadedItems.forEach((item, uploadedIndex) => {
            const newSortOrder = uploadedSlots[uploadedIndex] ?? uploadedIndex + 1;
            if (!filesData) return;
            setFilesData(prev => {
                if (!prev) return prev;
                const hasModifications = prev.files.some(
                    f => f.uuid === item.serverId && f.sort_order !== newSortOrder
                );
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
                        }),
                    };
                }
                return prev;
            });
        });

        // Assign sort_orders to local (not-yet-uploaded) items appended after all slots
        localItems.forEach((item, localIndex) => {
            const newSortOrder = maxSlot + localIndex + 1;
            setSelectedFiles(prev =>
                prev.map(f => {
                    if (f.file === item.file) {
                        return { ...f, sort_order: newSortOrder };
                    }
                    return f;
                })
            );
        });
    };

    const handleDropFiles = (droppedFiles: File[]) => {
        if (userType === 'agent') {
            return;
        }

        const validFiles = droppedFiles.filter(file => !file.type.startsWith('video/'));
        const hasVideo = droppedFiles.some(file => file.type.startsWith('video/'));

        if (hasVideo) {
            toast.error("Video files are not allowed here.");
        }

        if (validFiles.length > 0) {
            handleFilesChange(validFiles);
        }
    };


    // Handler to toggle featured status - only one file can be featured at a time
    const handleToggleFeatured = useCallback((fileUuid: string, currentFeaturedStatus: boolean) => {
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
    }, [currentService?.uuid, setSelectedFiles]);

    const renderFileItem = useCallback((item: FileItem, isDragging?: boolean) => {
        const isLocal = item.status === 'local';
        // originalData might be SelectedFiles (local) or Files (uploaded)
        const file = item.originalData;

        if (!file) return null;

        // Calculate index loosely based on the unified array for display purposes
        const idx = fileItems.findIndex(f => f.clientId === item.clientId);
        const totalUploaded = currentServiceFiles?.length || 0;
        const isShrinking = item.serverId && shrinkingIds.has(item.serverId);

        return (
            <div
                data-fileid={item.serverId}
                className={`h-[auto] relative group flex flex-col overflow-hidden ${isShrinking ? 'animate-card-select-shrink' : ''}`}
                style={{ backgroundColor: `var(--${userType}-page-bg, #BBBBBB)` }}
            >
                <div className="relative w-full aspect-video bg-black overflow-hidden">
                    {file.is_complimentary && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#DC9600] text-white text-[8px] sm:text-[10px] px-3 sm:px-4 py-0.5 rounded-b-xl font-medium z-[100] flex items-center justify-center shadow-md">
                            Complimentary
                        </div>
                    )}
                    {isPanoramaFile(file) && <PanoramaBadge />}
                    {isLocal ? (
                        <>
                            <OptimizedImagePreview
                                file={file.file}
                                onClick={() => {
                                    if (isHidingMode && file.uuid) {
                                        setFilesToHide(prev => { const next = new Set(prev); if (next.has(file.uuid)) next.delete(file.uuid); else next.add(file.uuid); return next; });
                                    } else if (isBulkSelecting && file.uuid) {
                                        setBulkSelectedIds(prev => { const next = new Set(prev); if (next.has(file.uuid)) next.delete(file.uuid); else next.add(file.uuid); return next; });
                                    } else if (!isHidingMode) {
                                        if (!file.is_deleted) handleImageClick(file.file, file);
                                    }
                                }}
                                alt="preview"
                                isRestricted={userType === 'agent' && bookingToUse?.payment_status !== 'PAID' && orderData?.payment_status !== 'PAID'}
                                className={`absolute inset-0 w-full h-full object-contain cursor-pointer transition-all duration-300 ${file.is_deleted ? 'blur-[2px] opacity-40 grayscale' : ''} ${file.is_hidden ? 'grayscale opacity-60' : ''}`}
                                draggable={false}
                            />
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-[20] pointer-events-none">
                                <p className="text-white font-medium text-sm drop-shadow-md">Processing...</p>
                            </div>
                            {file.uuid && filesToHide.has(file.uuid) && (
                                <div className="absolute inset-0 bg-black/50 z-[25] flex flex-col items-center justify-center pointer-events-none">
                                    <Check color="white" size={48} className="opacity-100" />
                                </div>
                            )}
                            {isBulkSelecting && file.uuid && !file.is_agent_approved && bulkSelectedIds.has(file.uuid) && (
                                <div className="absolute inset-0 bg-black/30 z-[25] flex flex-col items-center justify-center pointer-events-none">
                                    <div className="w-12 h-12 bg-[#6BAE41] rounded-full flex items-center justify-center shadow-lg">
                                        <Check color="white" size={32} strokeWidth={3} />
                                    </div>
                                </div>
                            )}
                            {isBulkDeselecting && file.uuid && file.is_agent_approved && bulkDeselectedIds.has(file.uuid) && (
                                <div className="absolute inset-0 bg-black/30 z-[25] flex flex-col items-center justify-center pointer-events-none">
                                    <div className="w-12 h-12 bg-[#E06D5E] rounded-full flex items-center justify-center shadow-lg">
                                        <Check color="white" size={32} strokeWidth={3} />
                                    </div>
                                </div>
                            )}
                            {file.is_deleted && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 z-[30] gap-2">
                                    <p className="text-white font-medium text-lg drop-shadow-lg uppercase mb-4">Deleted</p>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFiles(prev =>
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
                            {userType !== 'vendor' && (userType !== 'agent' || file.is_agent_approved || file.is_complimentary) && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span
                                            className={`cursor-pointer absolute top-2 left-2 z-10 ${fileManagerMode === 'reorder' ? 'hidden' : 'block'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const fileKey = `${file.file.name}-${file.file.size}`;
                                                handleToggleFeatured(fileKey, file.is_featured || false);
                                            }}
                                        >
                                            {file.is_featured ? (
                                                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,1)) drop-shadow(0px 0px 4px rgba(0,0,0,1))' }} />
                                            ) : (
                                                <Star className="w-6 h-6 text-white hover:text-yellow-400" style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,1)) drop-shadow(0px 0px 4px rgba(0,0,0,1))' }} />
                                            )}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{file.is_featured ? "Featured Image" : "Set as Featured Image"}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {userType === 'admin' && (
                                <div
                                    className={`absolute bottom-2 left-2 z-10 ${fileManagerMode === 'reorder' ? 'hidden' : 'flex'} items-center bg-white/80 p-1 rounded cursor-pointer`}
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
                            {/* Unsaved media green and red edge removed */}
                            {/* Unsaved media remove button hidden during processing */}
                        </>
                    ) : (
                        <>
                            {file.is_processing ? (
                                <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                                    <p className="text-gray-500 font-medium text-sm">Processing...</p>
                                </div>
                            ) : (file.file_path?.toLowerCase().endsWith('.pdf') || file.type === 'pdf' || file.type === 'application/pdf') ? (
                                (!file.variant_urls || (Array.isArray(file.variant_urls) && file.variant_urls.length === 0) || Object.keys(file.variant_urls).length === 0) ? (
                                    <PdfPlaceholder
                                        className="w-full h-full object-contain cursor-pointer"
                                        message="service is not paid yet"
                                        onClick={() => {
                                            if (isHidingMode && file.uuid) {
                                                setFilesToHide(prev => { const next = new Set(prev); if (next.has(file.uuid)) next.delete(file.uuid); else next.add(file.uuid); return next; });
                                            } else if (isBulkSelecting && file.uuid && !file.is_agent_approved) {
                                                setBulkSelectedIds(prev => { const next = new Set(prev); if (next.has(file.uuid)) next.delete(file.uuid); else next.add(file.uuid); return next; });
                                            } else if (isBulkDeselecting && file.uuid && file.is_agent_approved) {
                                                setBulkDeselectedIds(prev => { const next = new Set(prev); if (next.has(file.uuid)) next.delete(file.uuid); else next.add(file.uuid); return next; });
                                            } else if (!isHidingMode) {
                                                onOpenInvoice?.(currentService?.name, bookingToUse?.uuid);
                                            }
                                        }}
                                    />
                                ) : (userType === 'agent' && bookingToUse?.payment_status !== 'PAID' && orderData?.payment_status !== 'PAID') ? (
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
                                ) : (
                                    <div
                                        className="relative w-full h-full cursor-pointer overflow-hidden"
                                        onClick={() => {
                                            if (isHidingMode && file.uuid) {
                                                setFilesToHide(prev => { const next = new Set(prev); if (next.has(file.uuid)) next.delete(file.uuid); else next.add(file.uuid); return next; });
                                            } else if (isBulkSelecting && file.uuid && !file.is_agent_approved) {
                                                setBulkSelectedIds(prev => { const next = new Set(prev); if (next.has(file.uuid)) next.delete(file.uuid); else next.add(file.uuid); return next; });
                                            } else if (isBulkDeselecting && file.uuid && file.is_agent_approved) {
                                                setBulkDeselectedIds(prev => { const next = new Set(prev); if (next.has(file.uuid)) next.delete(file.uuid); else next.add(file.uuid); return next; });
                                            } else if (!isHidingMode) {
                                                handleImageClick(file.variant_urls?.popup || file.url || (file.file_path ? `${API_URL}/${file.file_path}` : ''), file);
                                            }
                                        }}
                                    >
                                        <iframe
                                            src={`${file.variant_urls?.popup || file.url || (file.file_path ? `${API_URL}/${file.file_path}` : '')}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                            className={`w-full h-full pointer-events-none border-none ${isDragging ? 'opacity-0' : 'opacity-100'}`}
                                            tabIndex={-1}
                                            scrolling="no"
                                        />
                                        <div className="absolute inset-0 bg-transparent" />
                                    </div>
                                )
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={file.thumbnail_url || file.variant_urls?.thumb}
                                    onClick={() => {
                                        if (isHidingMode && file.uuid) {
                                            setFilesToHide(prev => { const next = new Set(prev); if (next.has(file.uuid)) next.delete(file.uuid); else next.add(file.uuid); return next; });
                                        } else if (isBulkSelecting && file.uuid && !file.is_agent_approved) {
                                            setBulkSelectedIds(prev => { const next = new Set(prev); if (next.has(file.uuid)) next.delete(file.uuid); else next.add(file.uuid); return next; });
                                        } else if (isBulkDeselecting && file.uuid && file.is_agent_approved) {
                                            setBulkDeselectedIds(prev => { const next = new Set(prev); if (next.has(file.uuid)) next.delete(file.uuid); else next.add(file.uuid); return next; });
                                        } else if (!isHidingMode) {
                                            if (!file.is_deleted) handleImageClick(file.variant_urls?.popup || file.url || (file.file_path ? `${API_URL}/${file.file_path}` : ''), file);
                                        }
                                    }}
                                    alt="preview"
                                    className={`absolute inset-0 w-full h-full object-contain cursor-pointer ${!file.is_admin_approved && reviewFilesEnabled && userType === 'admin' ? 'opacity-70' : ''} ${file.is_hidden ? 'grayscale opacity-60' : ''}`}
                                    draggable={false}
                                />
                            )}
                            {file.uuid && filesToHide.has(file.uuid) && (!file.file || typeof file.file === 'string') && (
                                <div className="absolute inset-0 bg-black/50 z-[25] flex flex-col items-center justify-center pointer-events-none">
                                    <Check color="white" size={48} className="opacity-100" />
                                </div>
                            )}
                            {(userType === 'admin' || (userType === 'agent' && (file.is_agent_approved || file.is_complimentary))) && file.uuid && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span
                                            className={`cursor-pointer absolute top-2 right-2 z-[26] bg-white/50 p-1 rounded-full hover:bg-white/80 transition ${fileManagerMode === 'reorder' ? 'hidden' : 'block'}`}
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
                                        <p className="max-w-[220px] text-xs leading-tight">
                                            {filesToHide.has(file.uuid)
                                                ? "Hidden Media: Click to show on property tour & client downloads"
                                                : "Visible Media: Click to hide from property tour & client downloads"}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {isBulkSelecting && file.uuid && !file.is_agent_approved && bulkSelectedIds.has(file.uuid) && (!file.file || typeof file.file === 'string') && (
                                <div className="absolute inset-0 bg-black/30 z-[25] flex flex-col items-center justify-center pointer-events-none">
                                    <div className="w-12 h-12 bg-[#6BAE41] rounded-full flex items-center justify-center shadow-lg">
                                        <Check color="white" size={32} strokeWidth={3} />
                                    </div>
                                </div>
                            )}
                            {isBulkDeselecting && file.uuid && file.is_agent_approved && bulkDeselectedIds.has(file.uuid) && (!file.file || typeof file.file === 'string') && (
                                <div className="absolute inset-0 bg-black/30 z-[25] flex flex-col items-center justify-center pointer-events-none">
                                    <div className="w-12 h-12 bg-[#E06D5E] rounded-full flex items-center justify-center shadow-lg">
                                        <Check color="white" size={32} strokeWidth={3} />
                                    </div>
                                </div>
                            )}
                            {userType !== 'vendor' && (userType !== 'agent' || file.is_agent_approved || file.is_complimentary) && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span
                                            className={`cursor-pointer absolute top-2 left-2 z-10 ${fileManagerMode === 'reorder' ? 'hidden' : 'block'}`}
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
                                                                return { ...f, is_featured: !f.is_featured };
                                                            }
                                                            if (f.service?.uuid === currentService?.uuid) {
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
                                                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,1)) drop-shadow(0px 0px 4px rgba(0,0,0,1))' }} />
                                            ) : (
                                                <Star className="w-6 h-6 text-white hover:text-yellow-400" style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,1)) drop-shadow(0px 0px 4px rgba(0,0,0,1))' }} />
                                            )}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-[220px] text-xs leading-tight">
                                            {file.is_featured
                                                ? "Featured Media: Set as primary cover photo for listing"
                                                : "Featured Media: Click to set as primary cover photo for listing"}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {userType === 'admin' && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`absolute bottom-2 left-2 z-10 ${fileManagerMode === 'reorder' ? 'hidden' : 'flex'} items-center bg-white/90 p-1.5 rounded-[4px] cursor-pointer shadow-sm border border-gray-200`}
                                            onClick={(e) => {
                                                e.stopPropagation();
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
                                            }}
                                        >
                                            {file.is_admin_approved ? (
                                                <>
                                                    <div className={`w-4 h-4 border rounded mr-1.5 flex items-center justify-center ${userType}-bg ${userType}-border`}>
                                                        <Check color="white" size={12} />
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
                                                ? "Admin Approved: Media has been quality checked and approved by admin, making it available for the agent to review, select, and download"
                                                : (approvalSelectedUuids.has(file.uuid!)
                                                    ? "Selected for Admin Approval: Click to toggle selection"
                                                    : "Select for Admin Approval: Click to include in batch admin approval")}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            {userType === 'agent' && !file.is_complimentary && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`absolute bottom-2 left-2 z-10 ${fileManagerMode === 'reorder' ? 'hidden' : 'flex'} items-center bg-white/80 p-1 rounded cursor-pointer`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isBulkSelecting && file.uuid && !file.is_agent_approved) {
                                                    setBulkSelectedIds(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(file.uuid)) next.delete(file.uuid);
                                                        else next.add(file.uuid);
                                                        return next;
                                                    });
                                                    return;
                                                }
                                                if (isBulkDeselecting && file.uuid && file.is_agent_approved) {
                                                    setBulkDeselectedIds(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(file.uuid)) next.delete(file.uuid);
                                                        else next.add(file.uuid);
                                                        return next;
                                                    });
                                                    return;
                                                }
                                                if (!file.is_agent_approved) {
                                                    const cardEl = (e.currentTarget as HTMLElement).closest('[data-fileid]') as HTMLElement | null;
                                                    const imgEl = cardEl?.querySelector('img') as HTMLImageElement | null;
                                                    const thumbSrc = imgEl?.src ||
                                                        file.variant_urls?.thumb || file.thumbnail_url || file.url || (file.file_path ? `${API_URL}/${file.file_path}` : '');

                                                    if (cardEl) {
                                                        const rect = cardEl.getBoundingClientRect();
                                                        const cloneId = `${file.uuid}-${Date.now()}`;

                                                        setShrinkingIds(prev => { const s = new Set(prev); s.add(file.uuid); return s; });
                                                        setFlyingClones(prev => [...prev, { id: cloneId, src: thumbSrc, rect }]);

                                                        setTimeout(() => {
                                                            setFilesData(prev => {
                                                                if (!prev) return prev;
                                                                return {
                                                                    ...prev,
                                                                    files: prev.files.map(f => {
                                                                        if (f.uuid === file.uuid) {
                                                                            setChangedFileUuids(prevSet => { const s = new Set(prevSet); s.add(f.uuid); return s; });
                                                                            setSelectionChangedUuids(prevSet => { const s = new Set(prevSet); s.add(f.uuid); return s; });
                                                                            return { ...f, is_agent_approved: true };
                                                                        }
                                                                        return f;
                                                                    })
                                                                };
                                                            });
                                                            setShrinkingIds(prev => { const s = new Set(prev); s.delete(file.uuid); return s; });
                                                            setFlyingClones(prev => prev.filter(c => c.id !== cloneId));
                                                        }, 580);
                                                    } else {
                                                        setFilesData(prev => {
                                                            if (!prev) return prev;
                                                            return {
                                                                ...prev,
                                                                files: prev.files.map(f => {
                                                                    if (f.uuid === file.uuid) {
                                                                        setChangedFileUuids(prevSet => { const s = new Set(prevSet); s.add(f.uuid); return s; });
                                                                        setSelectionChangedUuids(prevSet => { const s = new Set(prevSet); s.add(f.uuid); return s; });
                                                                        return { ...f, is_agent_approved: true };
                                                                    }
                                                                    return f;
                                                                })
                                                            };
                                                        });
                                                    }
                                                } else {
                                                    setFilesData(prev => {
                                                        if (!prev) return prev;
                                                        return {
                                                            ...prev,
                                                            files: prev.files.map(f => {
                                                                if (f.uuid === file.uuid) {
                                                                    setChangedFileUuids(prevSet => { const s = new Set(prevSet); s.add(f.uuid); return s; });
                                                                    setSelectionChangedUuids(prevSet => { const s = new Set(prevSet); s.add(f.uuid); return s; });
                                                                    return { ...f, is_agent_approved: false };
                                                                }
                                                                return f;
                                                            })
                                                        };
                                                    });
                                                }
                                            }}
                                        >
                                            <div className={`w-4 h-4 border rounded mr-1 flex items-center justify-center ${file.is_agent_approved ? `${userType}-bg ${userType}-border` : 'bg-white border-[#7D7D7D]'}`}>
                                                {file.is_agent_approved && <Check color="white" size={12} />}
                                            </div>
                                            <span className="text-[10px] font-bold text-[#7D7D7D]">{file.is_agent_approved ? 'Selected' : 'Select'}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-[220px] text-xs leading-tight">
                                            {file.is_agent_approved
                                                ? "Agent Approved: Selected for final delivery & property website"
                                                : "Approve Media: Click to select/approve this item"}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            )}

                        </>
                    )}
                </div>
                <div
                    className="grid grid-cols-2 gap-1 justify-between items-center px-1 py-1"
                    style={{ backgroundColor: `var(--${userType}-page-bg, #BBBBBB)` }}
                >
                    {/* <p className="col-span-2 text-[#8E8E8E] mt-1 truncate">{isLocal ? file.file.name : file.name}</p> */}
                    <div className='col-span-2 flex items-center justify-between overflow-hidden'>
                        <p className='text-[#8E8E8E] mt-1 flex items-center gap-1 truncate pr-1 text-[9px] md:text-[14px]'>
                            <CopyableFileName name={isLocal ? (file.type || "Exterior") : (file.group || "Exterior")} /> ({idx + 1}{!isLocal ? ` of ${totalUploaded}` : ''})
                            {file.is_hidden && (
                                <span className="ml-1 bg-red-600 text-white text-[8px] px-1 py-0.5 rounded-full uppercase font-bold">Hidden</span>
                            )}
                        </p>
                        {isLocal ? (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFiles(prev => prev.map(f => {
                                        if (f.file === file.file && f.service_id === file.service_id) {
                                            return { ...f, is_complimentary: !f.is_complimentary };
                                        }
                                        return f;
                                    }));
                                }}
                                className={`flex items-center gap-1.5 cursor-pointer transition-colors ${file.is_complimentary ? 'text-[#6BAE41]' : 'text-gray-400 hover:text-[#6BAE41]'}`}
                                title="Mark as Complimentary"
                            >
                                <div className={`border-2 rounded flex items-center justify-center ${file.is_complimentary ? 'bg-[#6BAE41] border-[#6BAE41]' : 'border-gray-400'}`}
                                    style={{ width: imagesPerRow >= 6 ? '14px' : '18px', height: imagesPerRow >= 6 ? '14px' : '18px' }}
                                >
                                    {file.is_complimentary && <Check color="white" size={imagesPerRow >= 6 ? 10 : 14} />}
                                </div>
                                {imagesPerRow < 8 && <span style={{ fontSize: imagesPerRow >= 6 ? '10px' : '12px' }} className="font-medium whitespace-nowrap">Complimentary</span>}
                            </div>
                        ) : (
                            (userType === 'agent' && !file.is_agent_approved && !file.is_complimentary) ? null :
                                (userType === 'admin' || userType === 'vendor' || (userType === 'agent' && (bookingToUse?.payment_status === "PAID" || orderData?.payment_status === "PAID"))) ? (
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [API_URL, bookingToUse?.payment_status, currentServiceFiles?.length, fileItems, imagesPerRow, orderData?.payment_status, reviewFilesEnabled, setChangedFileUuids, setFilesData, setSelectedFiles, userType, currentService?.uuid, handleToggleFeatured, setSelectionChangedUuids, shrinkingIds, isHidingMode, filesToHide, setFilesToHide, currentService?.name, onOpenInvoice, isBulkSelecting, bulkSelectedIds, isBulkDeselecting, bulkDeselectedIds]);



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



    const handleImageClick = (url: string | File, file: SelectedFiles | Files) => {
        if (isPanoramaFile(file)) {
            const panoramas = (currentServiceFiles || []).filter(isPanoramaFile);
            const index = panoramas.findIndex(f => {
                if ('uuid' in f && 'uuid' in file && f.uuid) return f.uuid === file.uuid;
                if ('file' in f && 'file' in file && f.file) return f.file === file.file;
                return false;
            });
            setPanoramaInitialIndex(index >= 0 ? index : 0);
            setPanoramaViewerOpen(true);
        } else {
            setSelectedImageUrl(url);
            setEditingFile(file);
            setImagePopupOpen(true);
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
            // Count only agent approved files that are NOT complimentary
            const numberOfApprovedFiles = currentServiceFiles?.filter(f => f.is_agent_approved && !f.is_complimentary).length ?? 0

            if (numberOfApprovedFiles >= (bookingToUse?.option?.quantity ?? 0)) {
                if (token && bookingToUse?.uuid && orderData?.uuid && !bookingToUse?.is_completed) {
                    await ServiceCompletion(token, bookingToUse.uuid, true, orderData.uuid)
                }
            }
        };
        checkServiceCompletion();
    }, [currentServiceFiles, currentService, bookingToUse, orderData])

    const handleBulkDone = () => {
        const modifiedFiles: Files[] = [];
        setFilesData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                files: prev.files.map(f => {
                    if (f.uuid && bulkSelectedIds.has(f.uuid)) {
                        setChangedFileUuids(prevSet => { const s = new Set(prevSet); s.add(f.uuid); return s; });
                        setSelectionChangedUuids(prevSet => { const s = new Set(prevSet); s.add(f.uuid); return s; });
                        const updatedF = { ...f, is_agent_approved: true };
                        modifiedFiles.push(updatedF as Files);
                        return updatedF;
                    } else if (f.uuid && changedFileUuids.has(f.uuid)) {
                        modifiedFiles.push(f as Files);
                    }
                    return f;
                })
            };
        });
        setIsBulkSelecting(false);
        setBulkSelectedIds(new Set());
        setTimeout(() => {
            if (onSave) onSave(modifiedFiles);
        }, 100);
    };

    const handleSelectAll = () => {
        const unselectedFileIds = currentServiceFiles
            ?.filter(f => !f.is_agent_approved && !f.is_complimentary)
            .map(f => f.uuid) || [];
        setBulkSelectedIds(new Set(unselectedFileIds));
    };

    const handleBulkDeselectDone = () => {
        const modifiedFiles: Files[] = [];
        setFilesData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                files: prev.files.map(f => {
                    if (f.uuid && bulkDeselectedIds.has(f.uuid)) {
                        setChangedFileUuids(prevSet => { const s = new Set(prevSet); s.add(f.uuid); return s; });
                        setSelectionChangedUuids(prevSet => { const s = new Set(prevSet); s.add(f.uuid); return s; });
                        const updatedF = { ...f, is_agent_approved: false };
                        modifiedFiles.push(updatedF as Files);
                        return updatedF;
                    } else if (f.uuid && changedFileUuids.has(f.uuid)) {
                        modifiedFiles.push(f as Files);
                    }
                    return f;
                })
            };
        });
        setIsBulkDeselecting(false);
        setBulkDeselectedIds(new Set());
        setTimeout(() => {
            if (onSave) onSave(modifiedFiles);
        }, 100);
    };

    const handleDeselectAll = () => {
        const selectedFileIds = currentServiceFiles
            ?.filter(f => f.is_agent_approved && !f.is_complimentary)
            .map(f => f.uuid) || [];
        setBulkDeselectedIds(new Set(selectedFileIds));
    };

    const unselectedAction = userType === 'agent' ? (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {!isBulkSelecting ? (
                <Button
                    onClick={() => setIsBulkSelecting(true)}
                    variant="outline"
                    className="h-8 px-4 text-sm font-medium border-[#6BAE41] text-[#6BAE41] hover:bg-[#6BAE41] hover:text-white"
                >
                    Bulk Select
                </Button>
            ) : (
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => {
                            setIsBulkSelecting(false);
                            setBulkSelectedIds(new Set());
                        }}
                        variant="ghost"
                        className="h-8 px-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleBulkDone}
                        className="h-8 px-4 text-sm font-medium bg-[#6BAE41] hover:bg-[#5fa43a] text-white"
                    >
                        Done ({bulkSelectedIds.size})
                    </Button>
                </div>
            )}
        </div>
    ) : null;

    const unselectedSubHeader = isBulkSelecting && userType === 'agent' ? (
        <div className="w-full flex justify-between items-center mb-4 bg-gray-50 p-2 rounded border border-gray-200">
            <span className="text-sm text-gray-600 font-medium px-2">Select multiple media files to add them at once.</span>
            <div className="flex gap-2">
                <Button
                    variant="ghost"
                    onClick={() => setBulkSelectedIds(new Set())}
                    className="h-8 text-sm text-gray-600 hover:text-gray-900"
                >
                    Clear Selection
                </Button>
                <Button
                    onClick={handleSelectAll}
                    className="h-8 px-4 text-sm font-medium bg-[#4290E9] hover:bg-[#327ac9] text-white"
                >
                    Select All
                </Button>
            </div>
        </div>
    ) : null;

    const selectedAction = userType === 'agent' ? (
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

            {!isBulkDeselecting ? (
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsBulkDeselecting(true);
                    }}
                    className="h-7 md:h-8 px-2.5 md:px-3.5 text-[11px] md:text-xs font-semibold rounded-[6px] border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-600 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                    <MinusCircle className="h-3.5 w-3.5 text-red-500" />
                    <span>Bulk Remove</span>
                </Button>
            ) : (
                <div className="flex items-center gap-2">
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsBulkDeselecting(false);
                            setBulkDeselectedIds(new Set());
                        }}
                        variant="ghost"
                        className="h-7 md:h-8 px-2.5 md:px-3 text-[11px] md:text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-[6px]"
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={bulkDeselectedIds.size === 0}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleBulkDeselectDone();
                        }}
                        className="h-7 md:h-8 px-2.5 md:px-3.5 text-[11px] md:text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-[6px] shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                        <MinusCircle className="h-3.5 w-3.5" />
                        <span>Done ({bulkDeselectedIds.size})</span>
                    </Button>
                </div>
            )}
        </div>
    ) : null;

    const adminSavedFilesAction = userType === 'admin' ? (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
                asChild
                disabled={isHiding}
                variant={filesToHide.size > 0 ? 'default' : 'outline'}
                className={`h-7 px-2 md:px-3 text-[11px] md:text-xs font-medium transition-all duration-300 ${filesToHide.size > 0
                    ? 'bg-[#E06D5E] hover:bg-[#c45a4d] text-white border-none'
                    : 'border-[#E06D5E] text-[#E06D5E] hover:bg-red-50 bg-white'
                    }`}
            >
                <div onClick={(e) => {
                    e.stopPropagation();
                    if (isHiding) return;
                    if (filesToHide.size > 0) {
                        handleHideSubmit();
                    } else {
                        if (onShowHiddenMedia) onShowHiddenMedia();
                    }
                }}>
                    {isHiding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {filesToHide.size > 0 ? `Hide Media (${filesToHide.size})` : 'Show Hidden Media'}
                </div>
            </Button>
        </div>
    ) : null;

    const selectedSubHeader = isBulkDeselecting && userType === 'agent' ? (
        <div className="w-full flex justify-between items-center mb-4 bg-gray-50 p-2 rounded border border-gray-200">
            <span className="text-sm text-gray-600 font-medium px-2">Select multiple media files to remove them at once.</span>
            <div className="flex gap-2">
                <Button
                    variant="ghost"
                    onClick={() => setBulkDeselectedIds(new Set())}
                    className="h-8 text-sm text-gray-600 hover:text-gray-900"
                >
                    Clear Selection
                </Button>
                <Button
                    onClick={handleDeselectAll}
                    className="h-8 px-4 text-sm font-medium bg-[#E06D5E] hover:bg-[#c45a4d] text-white"
                >
                    Select All
                </Button>
            </div>
        </div>
    ) : null;

    return (
        <div className="w-full">
            {/* Flying clone portal — renders above everything, not clipped by overflow:hidden parents */}
            {typeof document !== 'undefined' && flyingClones.length > 0 && createPortal(
                <>
                    {flyingClones.map(clone => (
                        <div
                            key={clone.id}
                            className="animate-fly-clone fixed overflow-hidden shadow-2xl rounded"
                            style={{
                                left: clone.rect.left,
                                top: clone.rect.top,
                                width: clone.rect.width,
                                height: clone.rect.height,
                            }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={clone.src}
                                alt=""
                                className="w-full h-full object-contain"
                                draggable={false}
                            />
                        </div>
                    ))}
                </>,
                document.body
            )}            {!isListing && (
                <div
                    className={`w-full flex flex-wrap justify-between items-center px-4 font-alexandria overflow-visible transition-all duration-300 z-10 gap-y-2 ${isScrolled ? "sticky min-h-[44px] py-1 shadow-sm" : "relative min-h-[66px] py-2"
                        }`}
                    style={{
                        backgroundColor: `color-mix(in srgb, var(--${userType}-page-bg, #E4E4E4), black 5%)`,
                        top: isScrolled ? `${stickyOffset}px` : "auto"
                    }}
                >
                    {/* Left: Upload/Download button */}
                    <div className="shrink-0">
                        {userType !== 'agent' ? (
                            <div className="flex gap-2 items-center">
                                <Button
                                    onClick={handleFileInputClick}
                                    className={`${userType}-bg flex justify-center items-center hover-${userType}-bg transition-all duration-300 ${isScrolled ? "h-[24px] w-[70px] text-[10px]" : "h-[26px] w-[80px] text-[10px] md:h-[32px] md:w-[130px] md:text-[12px]"
                                        } px-1 md:px-4`}
                                >
                                    Add File
                                </Button>
                                {userType === 'admin' && (
                                    <Button
                                        onClick={() => setShowDownloadModal(true)}
                                        className={`${userType}-bg hover-${userType}-bg flex justify-center items-center cursor-pointer transition-all duration-300 ${isScrolled ? "h-[24px] w-[70px] text-[10px]" : "h-[26px] w-[80px] text-[10px] md:h-[32px] md:w-[130px] md:text-[12px]"
                                            } px-1 md:px-4`}
                                    >
                                        Download
                                    </Button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    hidden
                                    accept="image/*,.pdf"
                                    onChange={handleFileSelect}
                                />
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
                                        } px-1 md:px-4 ${!(bookingToUse?.payment_status === "PAID" || orderData?.payment_status === "PAID") ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                                    Download
                                </Button>
                            </div>
                        )}
                    </div>
                    {/* Center: title — hidden on mobile when scrolled to avoid clutter */}
                    <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <p className='flex flex-col items-center pointer-events-auto'>
                            <span className={`font-bold transition-all duration-300 ${userType}-text ${isScrolled ? "text-[13px]" : "text-[16px]"}`}>{currentService ? currentService.name : ''}</span>
                            {!isScrolled && (
                                <span className='text-[12px] text-[#7D7D7D]'>
                                    {bookingToUse?.option?.title || `${bookingToUse?.option?.quantity || 0} Photos`}
                                </span>
                            )}
                        </p>
                    </div>
                    {/* Right: price + paid/unpaid + other actions */}
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
                                className={`flex justify-center items-center transition-all duration-300 ${isScrolled ? "h-[28px] w-[100px] text-[11px]" : "h-[32px] w-[120px]"
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
                        {userType === 'admin' && (
                            <div className='flex items-center gap-[5px] md:gap-[10px] md:mr-2'>
                                <div className='flex flex-col justify-center items-end mr-1 md:mr-2 text-right'>
                                    <p className={`text-[13px] md:text-[18px] ${bookingToUse?.payment_status === 'REFUNDED' || orderData?.payment_status === 'REFUNDED' ? 'text-[#D0021B]' : (paymentSuccess || bookingToUse?.payment_status == 'PAID' || orderData?.payment_status === 'PAID' ? 'text-[#6BAE41]' : 'text-[#E06D5E]')} leading-none mb-1`}>
                                        ${(parseFloat(bookingToUse?.option?.amount || "0") + (gstRate ? parseFloat(bookingToUse?.option?.amount || "0") * gstRate : 0)).toFixed(2)}
                                    </p>
                                    <p className='text-[#7D7D7D] text-[9px] md:text-[10px] leading-none'>
                                        {gstRate ? `incl. $${(parseFloat(bookingToUse?.option?.amount || "0") * gstRate).toFixed(2)} GST` : `${bookingToUse?.option?.quantity || 0} Photos`}
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
                                        {gstRate ? `incl. $${(parseFloat(bookingToUse?.option?.amount || "0") * gstRate).toFixed(2)} GST` : `${bookingToUse?.option?.quantity || 0} Photos`}
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

                        <UpgradeServicePopup
                            open={openUpgrade}
                            setOpen={setOpenUpgrade}
                            currentService={currentService}
                            currentOption={bookingToUse?.option}
                            orderData={orderData}
                            currentBookedService={currentBookedService}
                            onSuccess={() => window.location.reload()}
                        />
                    </div>
                </div>
            )}

            {userType === 'admin' && (
                <div className="">
                    {/* {!success ? (
                                    <Button
                                        onClick={() => setOpenPayment(true)}
                                        className={`${userType}-bg text-white hover-${userType}-bg cursor-pointer h-[32px]`}
                                    >
                                        Add Manual Payment
                                    </Button>
                                ) : (
                                    <Button
                                        className="bg-[#6BAE41] hover:bg-[#7dc94f] text-white flex items-center gap-2 h-[32px] cursor-default"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        Payment Added
                                    </Button>
                                )} */}
                    <ManualPayment open={openPayment} setOpen={setOpenPayment} addPayment={handleAddPayment} />
                </div>
            )}

            {userType === 'agent' && (
                <div className="p-3 md:p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-x-4 gap-y-3 border-b border-gray-200 font-alexandria">
                    {/* Left controls: grid + per-row + sort */}
                    <div className="flex items-center gap-2 flex-wrap md:flex-nowrap w-full md:w-auto">
                        <GridSizeToggle />
                        <span className="text-[11px] md:text-[12px] text-[#7D7D7D] font-medium hidden sm:inline">Images per row</span>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-[28px] md:h-[32px] px-2 md:px-3 flex gap-1 md:gap-2 items-center bg-white border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 shadow-sm text-[11px] md:text-sm ml-auto md:ml-0"
                                >
                                    <ListFilter className="w-3 h-3 md:w-4 md:h-4 text-[#7D7D7D]" />
                                    <span className="font-medium">Sort: {sortBy === 'order' ? 'Order' : sortBy === 'name' ? 'Name' : 'Date'}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                                <DropdownMenuItem onClick={() => setSortBy('order')} className="flex items-center gap-2 cursor-pointer">
                                    <ListOrdered className="w-4 h-4" />
                                    <span>Order</span>
                                    {sortBy === 'order' && <Check className="w-4 h-4 ml-auto text-green-600" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy('name')} className="flex items-center gap-2 cursor-pointer">
                                    <ArrowDownAZ className="w-4 h-4" />
                                    <span>Name</span>
                                    {sortBy === 'name' && <Check className="w-4 h-4 ml-auto text-green-600" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy('date')} className="flex items-center gap-2 cursor-pointer">
                                    <Calendar className="w-4 h-4" />
                                    <span>Date</span>
                                    {sortBy === 'date' && <Check className="w-4 h-4 ml-auto text-green-600" />}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Right: counters + upgrade */}
                    <div className="flex items-center gap-4 md:gap-8 flex-wrap w-full md:w-auto justify-between md:justify-end">
                        {(() => {
                            const selectedCount = currentServiceFiles?.filter(f => f.is_agent_approved && !f.is_complimentary).length || 0;
                            const currentLimit = bookingToUse?.option?.quantity || 0;
                            const isOverLimit = selectedCount > currentLimit;

                            // Find next option
                            const sortedOptions = [...(currentService?.product_options || [])].sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
                            const nextOption = sortedOptions.find(opt => (opt.quantity || 0) > currentLimit);

                            const currentAmount = parseFloat(String(bookingToUse?.option?.amount || '0'));
                            const nextAmount = nextOption ? parseFloat(String(nextOption.amount || '0')) : 0;
                            const diffAmount = nextAmount - currentAmount;

                            return (
                                <>
                                    <div className="flex flex-col items-center">
                                        <span className={`text-[20px] md:text-[26px] font-medium leading-none ${isOverLimit ? 'text-[#E06D5E]' : 'text-[#7D7D7D]'}`}>
                                            {selectedCount} <span className="text-[#7D7D7D]">/ {currentLimit}</span>
                                        </span>
                                        <span className={`text-[11px] md:text-[12px] mt-1 ${isOverLimit ? 'text-[#E06D5E]' : 'text-[#7D7D7D]'}`}>Selected</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[20px] md:text-[26px] font-medium text-[#666666] leading-none">
                                            {currentServiceFiles?.filter(f => !f.is_deleted).length || 0}
                                        </span>
                                        <span className="text-[11px] md:text-[12px] text-[#666666] mt-1">Available</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <Button
                                            variant="outline"
                                            onClick={() => setOpenUpgrade(true)}
                                            className={`${userType}-bg hover-${userType}-bg text-white hover:!text-white hover:brightness-90 h-[30px] md:h-[36px] px-3 md:px-6 rounded transition-colors font-medium border-none mb-1 md:mb-2 text-[11px] md:text-sm`}
                                        >
                                            Upgrade Plan
                                        </Button>
                                        {isOverLimit && nextOption && (
                                            <div className="text-right text-[11px] md:text-[12px] text-[#666666] leading-[1.4]">
                                                <div>{nextOption.quantity} Photos</div>
                                                <div>+{diffAmount.toFixed(2)}</div>
                                                <div>Total - <span className="text-[#E06D5E] font-bold">${nextAmount.toFixed(2)}</span></div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {userType !== 'agent' && !isListing && (
                <div className="p-3 md:p-4 flex flex-row flex-nowrap justify-between items-center gap-x-2 md:gap-x-4 border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-none">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="hidden md:block">
                            <ModeToggle mode={fileManagerMode} onModeChange={handleModeChange} />
                        </div>
                        <GridSizeToggle />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-[28px] md:h-[32px] px-2 md:px-3 flex gap-1 md:gap-2 items-center bg-white border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 shadow-sm text-[11px] md:text-sm shrink-0"
                                >
                                    <ListFilter className="w-3 h-3 md:w-4 md:h-4 text-[#7D7D7D]" />
                                    <span className="font-medium">Sort: {sortBy === 'order' ? 'Order' : sortBy === 'name' ? 'Name' : 'Date'}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                                <DropdownMenuItem onClick={() => setSortBy('order')} className="flex items-center gap-2 cursor-pointer">
                                    <ListOrdered className="w-4 h-4" />
                                    <span>Order</span>
                                    {sortBy === 'order' && <Check className="w-4 h-4 ml-auto text-green-600" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy('name')} className="flex items-center gap-2 cursor-pointer">
                                    <ArrowDownAZ className="w-4 h-4" />
                                    <span>Name</span>
                                    {sortBy === 'name' && <Check className="w-4 h-4 ml-auto text-green-600" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy('date')} className="flex items-center gap-2 cursor-pointer">
                                    <Calendar className="w-4 h-4" />
                                    <span>Date</span>
                                    {sortBy === 'date' && <Check className="w-4 h-4 ml-auto text-green-600" />}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 shrink-0 justify-end">
                        <div className="flex flex-col items-center">
                            <span className="text-[20px] md:text-[22px] font-medium text-[#7D7D7D] leading-none">
                                {currentServiceFiles?.filter(f => !f.is_deleted).length || 0} <span className="text-[#7D7D7D]">/ {bookingToUse?.option?.quantity || 1}</span>
                            </span>
                            <span className="text-[11px] md:text-[12px] text-[#7D7D7D] mt-1">Uploaded</span>
                        </div>
                        {userType !== 'vendor' && (
                            <Button
                                onClick={() => setOpenUpgrade(true)}
                                className={`${userType}-bg h-[28px] md:h-[32px] w-auto px-2 md:px-[10px] flex justify-center items-center hover-${userType}-bg text-[11px] md:text-sm`}
                            >
                                Upgrade photo package
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <div className="pb-4">
                <FilePreviewModal
                    type='HDR_photos'
                    open={open}
                    onOpenChange={() => setOpen(false)}
                    files={files}
                    setSelectedFiles={setSelectedFiles}
                    serviceUuid={currentService?.uuid ?? ''}
                    reviewFilesEnabled={reviewFilesEnabled}
                    onSave={onSave}
                />
                {panoramaViewerOpen && (
                    <PanoramaViewer
                        files={(currentServiceFiles || []).filter(isPanoramaFile)}
                        initialIndex={panoramaInitialIndex}
                        onClose={() => setPanoramaViewerOpen(false)}
                    />
                )}

                <div className="flex flex-col items-center justify-center">
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
                        onItemsChange={handleFileItemsChange}
                        onDropFiles={handleDropFiles}
                        onClickUpload={handleFileInputClick}
                        renderItem={renderFileItem}
                        disabled={userType === 'agent'}
                        onSave={onSave}
                        savedFilesAction={adminSavedFilesAction}
                        modeToggleButton={<ModeToggle mode={fileManagerMode} onModeChange={handleModeChange} />}
                        unselectedAction={unselectedAction}
                        unselectedSubHeader={unselectedSubHeader}
                        selectedAction={selectedAction}
                        selectedSubHeader={selectedSubHeader}
                    />
                </div>

                <PhotoPreviewModal
                    open={imagePopupOpen}
                    onClose={() => {
                        setImagePopupOpen(false);
                        setEditingFile(null);
                    }}
                    file={editingFile && 'file' in editingFile ? editingFile.file : selectedImageUrl}
                    title={editingFile ? (('file' in editingFile) ? editingFile.type : (editingFile as Files).group || (editingFile as Files).type || 'HDR Photo') : 'HDR Photo'}
                    initialName={editingFile ? (('file' in editingFile) ? editingFile.type : (editingFile as Files).group || (editingFile as Files).type || 'Exterior') : ''}
                    isPaid={bookingToUse?.payment_status === 'PAID' || orderData?.payment_status === 'PAID'}
                    isAgentApproved={editingFile && !('file' in editingFile) ? (editingFile as Files).is_agent_approved : false}
                    onSave={(newName) => {
                        if (!editingFile) return;

                        if ('file' in editingFile) {
                            // Unsaved file (SelectedFiles)
                            setSelectedFiles(prev => prev.map(f => {
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
                            // Unsaved file (SelectedFiles)
                            setSelectedFiles(prev => prev.map(f => {
                                if (f.file === editingFile.file && f.service_id === editingFile.service_id) {
                                    return { ...f, is_deleted: true };
                                }
                                return f;
                            }));
                        } else {
                            // Saved file (Files)
                            handleDeleteUploadedFile((editingFile as Files).uuid);
                        }
                    } : undefined}
                    onReplace={editingFile && 'file' in editingFile ? () => {
                        setReplacingFile(editingFile.file);
                        fileInputRef.current?.click();
                    } : undefined}
                    type="photo"
                />

                <DownloadModal
                    open={showDownloadModal}
                    onClose={() => setShowDownloadModal(false)}
                    apiFiles={currentServiceFiles || []}
                />

                {/* S3 Upload Progress Overlay */}
                <UploadProgressOverlay
                    uploadStates={s3Upload.uploadStates}
                    overallProgress={s3Upload.overallProgress}
                    isUploading={s3Upload.isUploading}
                />
            </div>
        </div>
    );
}

export default FileTab1;
