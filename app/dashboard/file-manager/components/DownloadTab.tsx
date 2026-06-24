import React, { useMemo, useState, useCallback } from 'react';
import { useFileManagerContext, Files } from '../FileManagerContext';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2, Loader2, PlayCircle } from 'lucide-react';
import { PdfPlaceholder } from "./OptimizedPreview";
import { toast } from 'sonner';
import { useAppContext } from '@/app/context/AppContext';
import BulkDownloadSizeModal, { DownloadSize } from './BulkDownloadSizeModal';
import DownloadModal, { ApiFile } from './DownloadModal';
import SyncMlsModal from './SyncMlsModal';
import { useGlobalDownload } from '@/context/GlobalDownloadContext';

import { Order } from '../../orders/page';
import { canDownloadFile, getDownloadBlockReason } from '../utils/filePermissions';
import { MediaDateBoundary } from './FileManager';

type OrderServiceEntry = NonNullable<Order>["services"][0];

interface DownloadTabProps {
    orderData: Order | null;
    /** Booking-aware service groups passed from FileManager (key = service definition UUID) */
    groupedOrderServices?: Map<string, OrderServiceEntry[]>;
    onOpenInvoice?: (serviceName?: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

const DownloadTab: React.FC<DownloadTabProps> = ({ orderData, groupedOrderServices, onOpenInvoice }) => {
    const { filesData } = useFileManagerContext();
    const { userType } = useAppContext();
    const { startDownload } = useGlobalDownload();
    const [sizeModal, setSizeModal] = useState<{ isOpen: boolean; files: Files[]; label: string }>({
        isOpen: false,
        files: [],
        label: ''
    });
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [selectedImageUuids, setSelectedImageUuids] = useState<Set<string>>(new Set());

    // Helper to check if a service or the entire order is paid
    const isServicePaid = useCallback((serviceUuid: string, fileIsPaid?: boolean) => {
        if (fileIsPaid !== undefined) return fileIsPaid;

        if (userType !== 'agent') return true;
        if (orderData?.payment_status === 'PAID') return true;
        const service = orderData?.services.find(s => s.service.uuid === serviceUuid);
        return service?.payment_status === 'PAID';
    }, [userType, orderData]);

    // For "Download all", check if at least one photo service is paid
    const isAnyPhotoPaid = useMemo(() => {
        if (userType !== 'agent') return true;
        if (orderData?.payment_status === 'PAID') return true;

        return filesData?.files
            ?.some(f => f.type === 'photo' && (f.is_paid || isServicePaid(f.service?.uuid || "")));
    }, [userType, orderData, filesData, isServicePaid]);

    // For "Download all videos", check if at least one video service is paid
    const isAnyVideoPaid = useMemo(() => {
        if (userType !== 'agent') return true;
        if (orderData?.payment_status === 'PAID') return true;

        return filesData?.files
            ?.some(f => f.type === 'video' && (f.is_paid || isServicePaid(f.service?.uuid || "")));
    }, [userType, orderData, filesData, isServicePaid]);

    const hasAnyPhoto = useMemo(() => {
        return filesData?.files?.some(f => f.type === 'photo') ?? false;
    }, [filesData?.files]);

    const hasAnyVideo = useMemo(() => {
        return filesData?.files?.some(f => f.type === 'video') ?? false;
    }, [filesData?.files]);

    const unapprovedServiceNames = useMemo(() => {
        if (!filesData?.files) return [];
        const unapprovedFiles = filesData.files.filter(file => {
            const serviceName = file.service?.name || '';
            const isForbiddenService = serviceName.toLowerCase().includes('floor plan') ||
                serviceName.toLowerCase().includes('3d tour');
            if (isForbiddenService || !file.service) return false;

            const isApproved = userType === 'agent' ? (file.is_agent_approved || file.is_complimentary) : true;
            const isValidType = file.type === 'photo' || file.type === 'video';

            return !isApproved && isValidType;
        });

        const names = new Set(unapprovedFiles.map(f => f.service?.name).filter(Boolean));
        return Array.from(names);
    }, [filesData?.files, userType]);

    // Helper to compute date boundary for a specific booking index within a group
    const computeBookingBoundary = useCallback((group: OrderServiceEntry[], index: number): MediaDateBoundary => {
        if (!group || group.length <= 1) return { from: null, to: null };
        const from = index === 0 ? null : new Date(group[index].created_at);
        const to = index < group.length - 1 ? new Date(group[index + 1].created_at) : null;
        return { from, to };
    }, []);

    // Group files by service uuid + booking index (handles duplicate service bookings)
    // Returns a flat list of booking sections: { serviceUuid, bookingIndex, bookingEntry, label, files[] }
    const bookingSections = useMemo(() => {
        if (!filesData?.files) return [];

        // Build a list of section descriptors from groupedOrderServices
        // Fall back to a flat per-service grouping if prop not provided
        const sections: {
            key: string;
            serviceUuid: string;
            bookingIndex: number;
            bookingEntry: OrderServiceEntry | null;
            label: string;
            isPaid: boolean;
            boundary: MediaDateBoundary;
            files: Files[];
        }[] = [];

        if (groupedOrderServices && groupedOrderServices.size > 0) {
            groupedOrderServices.forEach((group, serviceUuid) => {
                group.forEach((booking, idx) => {
                    const boundary = computeBookingBoundary(group, idx);
                    const isPaid = orderData?.payment_status === 'PAID' || booking.payment_status === 'PAID';
                    const label = group.length > 1
                        ? `${booking.service.name} — Booking #${idx + 1}`
                        : booking.service.name;
                    sections.push({
                        key: `${serviceUuid}-${idx}`,
                        serviceUuid,
                        bookingIndex: idx,
                        bookingEntry: booking,
                        label,
                        isPaid,
                        boundary,
                        files: [],
                    });
                });
            });
        }

        // Now populate files into sections
        filesData.files.forEach(file => {
            if (file.is_deleted) return;

            const serviceName = file.service?.name || '';
            const isForbiddenService = serviceName.toLowerCase().includes('floor plan') ||
                serviceName.toLowerCase().includes('3d tour');
            const isApproved = userType === 'agent' ? (file.is_agent_approved || file.is_complimentary) : true;
            const isValidType = file.type === 'photo' || file.type === 'video';

            if (!isApproved || !isValidType || !file.service || isForbiddenService) return;

            const fileDate = new Date(file.created_at).getTime();

            // Find the matching section
            let matched = false;
            for (const section of sections) {
                if (section.serviceUuid !== file.service.uuid) continue;
                const { from, to } = section.boundary;
                const afterFrom = from ? fileDate >= from.getTime() : true;
                const beforeTo = to ? fileDate < to.getTime() : true;
                if (afterFrom && beforeTo) {
                    section.files.push(file);
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                const fallback = sections.find(s => s.serviceUuid === file.service?.uuid);
                if (fallback) fallback.files.push(file);
                else {
                    // Service not in groupedOrderServices at all — add a plain section
                    if (userType === 'vendor') return;

                    sections.push({
                        key: file.service.uuid,
                        serviceUuid: file.service.uuid,
                        bookingIndex: 0,
                        bookingEntry: null,
                        label: file.service.name,
                        isPaid: userType !== 'agent' || orderData?.payment_status === 'PAID',
                        boundary: { from: null, to: null },
                        files: [file],
                    });
                }
            }
        });

        return sections.filter(s => s.files.length > 0);
    }, [filesData?.files, groupedOrderServices, userType, orderData, computeBookingBoundary]);

    // All approved files (derived from bookingSections)
    const allApprovedPhotos = useMemo(() => {
        return bookingSections.flatMap(s => s.files.filter(f => f.type === 'photo'));
    }, [bookingSections]);

    const allApprovedVideos = useMemo(() => {
        return bookingSections.flatMap(s => s.files.filter(f => f.type === 'video'));
    }, [bookingSections]);

    // Flat list for "download all" and MLS actions
    const groupedServices = useMemo(() => bookingSections.map(s => ({
        uuid: s.serviceUuid,
        name: s.label,
        files: s.files,
        isPaid: s.isPaid,
    })), [bookingSections]);

    // Filter paid files for agents (for download actions)
    const paidPhotos = useMemo(() => {
        return allApprovedPhotos.filter(p =>
            canDownloadFile({
                file: p,
                orderData,
                userType,
            })
        );
    }, [allApprovedPhotos, userType, orderData]);

    const paidVideos = useMemo(() => {
        return allApprovedVideos.filter(p =>
            canDownloadFile({
                file: p,
                orderData,
                userType,
            })
        );
    }, [allApprovedVideos, userType, orderData]);

    // Selected files filter
    const selectedFiles = useMemo(() => {
        const allApproved = [...allApprovedPhotos, ...allApprovedVideos];
        return allApproved.filter(file => selectedImageUuids.has(file.uuid));
    }, [allApprovedPhotos, allApprovedVideos, selectedImageUuids]);

    // Filtered selected files (for manual download)
    const selectedPaidFiles = useMemo(() => {
        return selectedFiles.filter(file =>
            canDownloadFile({
                file,
                orderData,
                userType,
            })
        );
    }, [selectedFiles, userType, orderData]);

    const toggleImageSelection = (uuid: string) => {
        const allApproved = [...allApprovedPhotos, ...allApprovedVideos];
        const file = allApproved.find(f => f.uuid === uuid);

        if (!file || !canDownloadFile({
            file,
            orderData,
            userType,
        })) {
            const reason = file ? getDownloadBlockReason({
                file,
                orderData,
                userType,
            }) : 'File not found';
            toast.error(reason || 'Cannot select this file for download');
            return;
        }

        setSelectedImageUuids(prev => {
            const next = new Set(prev);
            if (next.has(uuid)) {
                next.delete(uuid);
            } else {
                next.add(uuid);
            }
            return next;
        });
    };

    const handleDownload = async (files: Files[], label: string, size: DownloadSize = 'original') => {
        setSizeModal(prev => ({ ...prev, isOpen: false }));

        try {
            const payload: { uuid: string; size?: DownloadSize }[] = files.map(f => ({
                uuid: f.uuid,
                size
            }));

            startDownload(payload, label);
        } catch (err) {
            console.error("Download error:", err);
            toast.error("An unexpected error occurred.");
        }
    };

    const openSizeModal = (files: Files[], label: string) => {
        setSizeModal({ isOpen: true, files, label });
    };

    const totalFilesCount = useMemo(() => {
        return bookingSections.reduce((acc, s) => acc + s.files.length, 0);
    }, [bookingSections]);

    const [visibleCount, setVisibleCount] = useState(30);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const visibleSections = useMemo(() => {
        let currentCount = 0;
        return bookingSections.map(section => {
            if (currentCount >= visibleCount) return { ...section, files: [] };
            const remaining = visibleCount - currentCount;
            const filesToShow = section.files.slice(0, remaining);
            currentCount += filesToShow.length;
            return { ...section, files: filesToShow };
        }).filter(s => s.files.length > 0);
    }, [bookingSections, visibleCount]);

    const handleShowMore = () => {
        setIsLoadingMore(true);
        setTimeout(() => {
            setVisibleCount(prev => prev + 30);
            setIsLoadingMore(false);
        }, 500);
    };

    if (!filesData) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 font-alexandria">
            {/* Buttons Row 1: Global Actions */}
            <div className="flex flex-wrap gap-3 mb-4">
                <Button
                    onClick={() => {
                        if (!isAnyPhotoPaid) {
                            onOpenInvoice?.();
                            return;
                        }
                        if (paidPhotos.length === 0) {
                            toast.warning("No approved photos available to download.");
                            return;
                        }
                        openSizeModal(paidPhotos, "All Photos");
                    }}
                    disabled={!hasAnyPhoto}
                    title={!isAnyPhotoPaid ? "service not paid yet" : ""}
                    className={`px-4 h-[32px] md:h-[38px] border-[1px] ${userType}-border text-[12px] md:text-[13px] font-[500] text-white flex gap-[5px] justify-center items-center ${userType}-bg hover:brightness-110 rounded-[6px] transition-all ${(!hasAnyPhoto) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    <Download className="h-3.5 w-3.5" />
                    Download all photos
                </Button>

                <Button
                    onClick={() => {
                        if (!isAnyVideoPaid) {
                            onOpenInvoice?.();
                            return;
                        }
                        if (paidVideos.length === 0) {
                            toast.warning("No approved videos available to download.");
                            return;
                        }
                        handleDownload(paidVideos, "All Videos", "original");
                    }}
                    disabled={!hasAnyVideo}
                    title={!isAnyVideoPaid ? "service not paid yet" : ""}
                    className={`px-4 h-[32px] md:h-[38px] border-[1px] ${userType}-border text-[12px] md:text-[13px] font-[500] text-white flex gap-[5px] justify-center items-center ${userType}-bg hover:brightness-110 rounded-[6px] transition-all ${(!hasAnyVideo) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    <Download className="h-3.5 w-3.5" />
                    Download all videos
                </Button>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => {
                            if (selectedImageUuids.size === 0) {
                                toast.warning("Please select at least one file first.");
                                return;
                            }
                            setIsManualModalOpen(true);
                        }}
                        disabled={selectedImageUuids.size === 0 || (allApprovedPhotos.length === 0 && allApprovedVideos.length === 0) || (!isAnyPhotoPaid && !isAnyVideoPaid)}
                        className={`px-4 h-[32px] md:h-[38px] border-[1px] ${selectedImageUuids.size === 0 ? "border-gray-300 text-gray-500 bg-gray-100" : `${userType}-border ${userType}-text hover:text-[#fff] hover-${userType}-bg ${userType}-button`} text-[12px] md:text-[13px] font-[500] flex gap-[5px] justify-center items-center rounded-[6px] transition-colors ${(!isAnyPhotoPaid && !isAnyVideoPaid) ? "opacity-50 cursor-not-allowed" : ""}`}
                        style={selectedImageUuids.size === 0 ? {} : { backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    >
                        <Download className="h-3.5 w-3.5" />
                        Download manually {selectedImageUuids.size > 0 && `(${selectedImageUuids.size})`}
                    </Button>
                    <span className="text-gray-500 text-sm hidden md:inline">Click a file to select it for downloading manually.</span>
                </div>

                {/* Sync MLS — only visible to agents and admins */}
                {(userType === 'agent' || userType === 'admin') && (
                    <Button
                        onClick={() => setIsSyncModalOpen(true)}
                        disabled={(allApprovedPhotos.length === 0)}
                        className={`px-4 h-[32px] md:h-[38px] border-[1px] ${(allApprovedPhotos.length === 0) ? "border-gray-300 text-gray-500 bg-gray-100 opacity-50 cursor-not-allowed" : `${userType}-border ${userType}-text hover:text-[#fff] hover-${userType}-bg ${userType}-button`} text-[12px] md:text-[13px] font-[500] flex gap-[5px] justify-center items-center rounded-[6px] transition-colors`}
                        style={(allApprovedPhotos.length === 0) ? {} : { backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    >
                        Sync MLS
                    </Button>
                )}

                {selectedImageUuids.size > 0 && (
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedImageUuids(new Set())}
                        className="text-gray-500 hover:text-red-500 font-medium text-[12px] transition-colors"
                    >
                        Clear Selection
                    </Button>
                )}
            </div>

            {/* Per-service download buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
                {groupedServices.map(service => {
                    const servicePhotos = service.files.filter(f => f.type === 'photo');
                    const serviceVideos = service.files.filter(f => f.type.toLowerCase() === 'video');
                    const isPaid = service.isPaid;

                    return (
                        <React.Fragment key={service.uuid + service.name}>
                            {servicePhotos.length > 0 && (
                                <Button
                                    onClick={() => {
                                        if (!isPaid) {
                                            onOpenInvoice?.(service.name);
                                            return;
                                        }
                                        openSizeModal(servicePhotos, service.name);
                                    }}
                                    title={!isPaid ? "service not paid yet" : ""}
                                    className={`px-4 h-[32px] md:h-[38px] border-[1px] ${userType}-border text-[12px] md:text-[13px] font-[500] ${userType}-text flex gap-[5px] justify-center items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button rounded-[6px] transition-colors`}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Download {service.name} photos ({servicePhotos.length})
                                </Button>
                            )}
                            {serviceVideos.length > 0 && (
                                <Button
                                    onClick={() => {
                                        if (!isPaid) {
                                            onOpenInvoice?.(service.name);
                                            return;
                                        }
                                        handleDownload(serviceVideos, service.name, "original");
                                    }}
                                    title={!isPaid ? "service not paid yet" : ""}
                                    className={`px-4 h-[32px] md:h-[38px] border-[1px] ${userType}-border text-[12px] md:text-[13px] font-[500] ${userType}-text flex gap-[5px] justify-center items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button rounded-[6px] transition-colors`}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Download {service.name} videos ({serviceVideos.length})
                                </Button>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Booking-aware grouped file grid */}
            <div className="space-y-12">
                {visibleSections.length > 0 ? (
                    <div className="space-y-12">
                        {visibleSections.map((section) => {
                            const sectionPhotos = section.files.filter(f => f.type === 'photo');
                            const sectionVideos = section.files.filter(f => f.type === 'video');

                            return (
                                <div key={section.key} className="space-y-4">
                                    {/* Section header with label + paid badge + download button */}
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <h3 className={`text-xl font-semibold ${userType}-text border-l-4 border-current pl-3`}>
                                            {section.label}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {/* Paid/Unpaid badge */}
                                            {userType !== 'vendor' && (
                                                <span
                                                    onClick={() => {
                                                        if (!section.isPaid) {
                                                            onOpenInvoice?.(section.bookingEntry?.service.name);
                                                        }
                                                    }}
                                                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${section.isPaid ? 'bg-[#6BAE41] text-white' : 'bg-[#DC9600] text-white cursor-pointer hover:bg-[#eda304]'
                                                        }`}>
                                                    {section.isPaid ? 'PAID' : 'UNPAID'}
                                                </span>
                                            )}
                                            {/* Per-section download buttons */}
                                            {sectionPhotos.length > 0 && (
                                                <Button
                                                    onClick={() => {
                                                        if (!section.isPaid) {
                                                            onOpenInvoice?.(section.bookingEntry?.service.name || section.label);
                                                            return;
                                                        }
                                                        openSizeModal(sectionPhotos, section.label);
                                                    }}
                                                    title={!section.isPaid ? 'Service not paid yet' : ''}
                                                    className={`px-3 h-[30px] border-[1px] ${userType}-border text-[11px] font-[500] ${userType}-text flex gap-[4px] justify-center items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button rounded-[6px] transition-colors`}
                                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                                >
                                                    <Download className="h-3 w-3" />
                                                    Photos ({sectionPhotos.length})
                                                </Button>
                                            )}
                                            {sectionVideos.length > 0 && (
                                                <Button
                                                    onClick={() => {
                                                        if (!section.isPaid) {
                                                            onOpenInvoice?.(section.bookingEntry?.service.name || section.label);
                                                            return;
                                                        }
                                                        handleDownload(sectionVideos, section.label, 'original');
                                                    }}
                                                    title={!section.isPaid ? 'Service not paid yet' : ''}
                                                    className={`px-3 h-[30px] border-[1px] ${userType}-border text-[11px] font-[500] ${userType}-text flex gap-[4px] justify-center items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button rounded-[6px] transition-colors`}
                                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                                >
                                                    <Download className="h-3 w-3" />
                                                    Videos ({sectionVideos.length})
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                                        {section.files.map((file) => {
                                            const isSelected = selectedImageUuids.has(file.uuid);
                                            const isVideo = file.type.toLowerCase() === 'video';
                                            return (
                                                <div
                                                    key={file.uuid}
                                                    onClick={() => toggleImageSelection(file.uuid)}
                                                    className={`relative group aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border-2 transition-all cursor-pointer select-none
                                                    ${isSelected ? `${userType}-border shadow-md` : 'border-gray-200 hover:border-gray-300'}`}
                                                >
                                                    <div className="relative w-full h-full bg-black">
                                                        {file.is_processing ? (
                                                            <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                                                                <p className="text-gray-500 font-medium text-sm">Processing...</p>
                                                            </div>
                                                        ) : isVideo ? (
                                                            file.variant_urls?.thumb ? (
                                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                                <img
                                                                    src={file.variant_urls.thumb}
                                                                    alt={file.group?.trim() ? file.group : (file.name || (file as any).file_name)}
                                                                    title={file.group?.trim() ? file.group : (file.name || (file as any).file_name)}
                                                                    className={`w-full h-full object-contain transition-transform group-hover:scale-105 ${isSelected ? 'opacity-90' : ''}`}
                                                                />
                                                            ) : (
                                                                <video
                                                                    src={`${file.url || `${API_URL}/${file.file_path}`}#t=0.1`}
                                                                    preload="metadata"
                                                                    muted
                                                                    playsInline
                                                                    title={file.group?.trim() ? file.group : (file.name || (file as any).file_name)}
                                                                    className={`absolute inset-0 w-full h-full object-contain transition-transform group-hover:scale-105 ${isSelected ? 'opacity-90' : ''}`}
                                                                />
                                                            )
                                                        ) : (file.file_path?.toLowerCase().endsWith('.pdf') || file.type === 'pdf' || file.type === 'application/pdf') ? (
                                                            (!file.variant_urls || (Array.isArray(file.variant_urls) && file.variant_urls.length === 0) || Object.keys(file.variant_urls).length === 0) ? (
                                                                <PdfPlaceholder
                                                                    className="w-full h-full object-contain"
                                                                    message="service is not paid yet"
                                                                />
                                                            ) : (
                                                                <div className="relative w-full h-full overflow-hidden">
                                                                    <iframe
                                                                        src={`${file.variant_urls?.popup || file.url || `${API_URL}/${file.file_path}`}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                                                        className="w-full h-full pointer-events-none border-none"
                                                                        tabIndex={-1}
                                                                        scrolling="no"
                                                                    />
                                                                    <div className="absolute inset-0 bg-transparent" />
                                                                </div>
                                                            )
                                                        ) : (
                                                            /* eslint-disable-next-line @next/next/no-img-element */
                                                            <img
                                                                src={file.thumbnail_url || file.variant_urls?.thumb || file.url}
                                                                alt={file.group?.trim() ? file.group : (file.name || (file as any).file_name)}
                                                                title={file.group?.trim() ? file.group : (file.name || (file as any).file_name)}
                                                                className={`w-full h-full object-contain transition-transform group-hover:scale-105 ${isSelected ? 'opacity-90' : ''}`}
                                                            />
                                                        )}
                                                    </div>
                                                    {isSelected && (
                                                        <div className={`absolute top-2 right-2 z-10 ${userType}-text bg-white rounded-full shadow-sm`}>
                                                            <CheckCircle2 className="w-6 h-6 shadow-sm" />
                                                        </div>
                                                    )}
                                                    {!section.isPaid && userType === 'agent' && (
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onOpenInvoice?.(section.bookingEntry?.service.name);
                                                            }}
                                                            className="absolute top-2 right-2 z-10 bg-black/50 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1 cursor-pointer hover:bg-black/70"
                                                        >
                                                            <Loader2 className="w-3 h-3 animate-pulse" />
                                                            Unpaid
                                                        </div>
                                                    )}
                                                    {isVideo && (
                                                        <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none">
                                                            <PlayCircle className="w-12 h-12 text-white/90 drop-shadow-md group-hover:scale-110 transition-transform duration-300 fill-black/40" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pointer-events-none">
                                                        <p className="text-white text-xs truncate font-medium">{file.group?.trim() ? file.group : (file.name || (file as any).file_name)}</p>
                                                        <p className="text-gray-300 text-[10px] truncate">{file.service?.name}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {visibleCount < totalFilesCount && (
                            <div className="flex justify-center pt-8">
                                <Button
                                    onClick={handleShowMore}
                                    disabled={isLoadingMore}
                                    className={`px-8 h-[40px] border-[1px] ${userType}-border text-[14px] font-[500] ${userType}-text flex gap-[8px] justify-center items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button rounded-[8px] transition-all shadow-sm ${isLoadingMore ? "opacity-70 cursor-wait" : ""}`}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                >
                                    {isLoadingMore ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : null}
                                    {isLoadingMore ? "Loading..." : "Show More"}
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        {unapprovedServiceNames.length > 0 ? (
                            <div className="flex flex-col items-center gap-2 text-gray-600">
                                <p className="text-lg font-medium text-gray-800">Media Requires Approval</p>
                                <p className="text-sm max-w-md">
                                    You have media available for <span className="font-semibold text-gray-800">{unapprovedServiceNames.join(', ')}</span>, but it has not been approved yet.
                                </p>
                                <p className="text-sm max-w-md">
                                    Please review and approve your media to make it available for download.
                                </p>
                            </div>
                        ) : (
                            <p className="text-gray-500">No media available to download.</p>
                        )}
                    </div>
                )}
            </div>

            <BulkDownloadSizeModal
                isOpen={sizeModal.isOpen}
                onClose={() => setSizeModal(prev => ({ ...prev, isOpen: false }))}
                onSelectSize={(size) => handleDownload(sizeModal.files, sizeModal.label, size)}
                title={`Select Quality for ${sizeModal.label}`}
            />

            <DownloadModal
                open={isManualModalOpen}
                onClose={() => {
                    setIsManualModalOpen(false);
                    setSelectedImageUuids(new Set());
                }}
                apiFiles={selectedPaidFiles as unknown as ApiFile[]}
            />

            {/* Sync Modal only shows paid/approved files regardless of user role */}
            <SyncMlsModal
                open={isSyncModalOpen}
                onClose={() => setIsSyncModalOpen(false)}
                apiFiles={[...allApprovedPhotos].filter(f =>
                    canDownloadFile({
                        file: f,
                        orderData,
                        userType: 'agent', // Force strict payment check even for Admins
                    })
                ) as unknown as ApiFile[]}
                orderData={orderData}
                tourUuid={filesData?.uuid}
            />
        </div>
    );
};

export default DownloadTab;
