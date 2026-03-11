import React, { useMemo, useState, useCallback } from 'react';
import { useFileManagerContext, Files } from '../FileManagerContext';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2, Loader2, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '@/app/context/AppContext';
import BulkDownloadSizeModal, { DownloadSize } from './BulkDownloadSizeModal';
import DownloadModal, { ApiFile } from './DownloadModal';
import { useGlobalDownload } from '@/context/GlobalDownloadContext';

import { Order } from '../../orders/page';

interface DownloadTabProps {
    orderData: Order | null;
}

const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

const DownloadTab: React.FC<DownloadTabProps> = ({ orderData }) => {
    const { filesData } = useFileManagerContext();
    const { userType } = useAppContext();
    const { startDownload } = useGlobalDownload();
    const [sizeModal, setSizeModal] = useState<{ isOpen: boolean; files: Files[]; label: string }>({
        isOpen: false,
        files: [],
        label: ''
    });
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [selectedImageUuids, setSelectedImageUuids] = useState<Set<string>>(new Set());

    // Helper to check if a service or the entire order is paid
    const isServicePaid = useCallback((serviceUuid: string) => {
        if (userType !== 'agent') return true;
        if (orderData?.payment_status === 'PAID') return true;
        const service = orderData?.services.find(s => s.service.uuid === serviceUuid);
        return service?.payment_status === 'PAID';
    }, [userType, orderData]);

    // For "Download all", check if at least one photo service is paid
    const isAnyPhotoServicePaid = useMemo(() => {
        if (userType !== 'agent') return true;
        if (orderData?.payment_status === 'PAID') return true;

        const photoServiceUuids = new Set(filesData?.files
            ?.filter(f => f.type === 'photo' && f.service)
            .map(f => f.service!.uuid));

        return Array.from(photoServiceUuids).some(uuid => isServicePaid(uuid));
    }, [userType, orderData, filesData, isServicePaid]);

    // For "Download all videos", check if at least one video service is paid
    const isAnyVideoServicePaid = useMemo(() => {
        if (userType !== 'agent') return true;
        if (orderData?.payment_status === 'PAID') return true;

        const videoServiceUuids = new Set(filesData?.files
            ?.filter(f => f.type === 'video' && f.service)
            .map(f => f.service!.uuid));

        return Array.from(videoServiceUuids).some(uuid => isServicePaid(uuid));
    }, [userType, orderData, filesData, isServicePaid]);

    // Group files by service (photos and videos)
    const groupedServices = useMemo(() => {
        if (!filesData?.files) return [];

        const servicesMap = new Map<number, { id: number; uuid: string; name: string; files: Files[] }>();

        filesData.files.forEach(file => {
            if (file.is_deleted) return;

            const serviceName = file.service?.name || "";
            const isForbiddenService = serviceName.toLowerCase().includes("floor plan") ||
                serviceName.toLowerCase().includes("3d tour");

            // Note: We no longer exclude "video" from the name check as we want to include them

            const isApproved = userType === 'agent' ? file.is_agent_approved : true;
            const isValidType = file.type === 'photo' || file.type === 'video';

            if (isApproved && isValidType && file.service && !isForbiddenService) {
                const serviceId = file.service.id;
                if (!servicesMap.has(serviceId)) {
                    servicesMap.set(serviceId, {
                        id: serviceId,
                        uuid: file.service.uuid,
                        name: file.service.name,
                        files: []
                    });
                }
                servicesMap.get(serviceId)?.files.push(file);
            }
        });

        return Array.from(servicesMap.values());
    }, [filesData, userType]);

    // All approved files
    const allApprovedPhotos = useMemo(() => {
        return groupedServices.flatMap(service => service.files.filter(f => f.type === 'photo'));
    }, [groupedServices]);

    const allApprovedVideos = useMemo(() => {
        return groupedServices.flatMap(service => service.files.filter(f => f.type === 'video'));
    }, [groupedServices]);

    // Filter paid files for agents (for download actions)
    const paidPhotos = useMemo(() => {
        if (userType !== 'agent' || orderData?.payment_status === 'PAID') {
            return allApprovedPhotos;
        }
        return allApprovedPhotos.filter(p => isServicePaid(p.service?.uuid || ""));
    }, [allApprovedPhotos, userType, orderData, isServicePaid]);

    const paidVideos = useMemo(() => {
        if (userType !== 'agent' || orderData?.payment_status === 'PAID') {
            return allApprovedVideos;
        }
        return allApprovedVideos.filter(p => isServicePaid(p.service?.uuid || ""));
    }, [allApprovedVideos, userType, orderData, isServicePaid]);

    // Selected files filter
    const selectedFiles = useMemo(() => {
        const allApproved = [...allApprovedPhotos, ...allApprovedVideos];
        return allApproved.filter(file => selectedImageUuids.has(file.uuid));
    }, [allApprovedPhotos, allApprovedVideos, selectedImageUuids]);

    // Filtered selected files (for manual download)
    const selectedPaidFiles = useMemo(() => {
        if (userType !== 'agent' || orderData?.payment_status === 'PAID') {
            return selectedFiles;
        }
        return selectedFiles.filter(file => isServicePaid(file.service?.uuid || ""));
    }, [selectedFiles, userType, orderData, isServicePaid]);

    const toggleImageSelection = (uuid: string) => {
        const allApproved = [...allApprovedPhotos, ...allApprovedVideos];
        const file = allApproved.find(f => f.uuid === uuid);
        if (userType === 'agent' && file && !isServicePaid(file.service?.uuid || "")) {
            toast.error("This service is not paid yet.");
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
        setSizeModal(prev => ({ ...prev, isOpen: false })); // close modal immediately

        try {
            const payload: { uuid: string; size?: DownloadSize }[] = files.map(f => ({
                uuid: f.uuid,
                size
            }));

            // start download via global context
            startDownload(payload, label);
        } catch (err) {
            console.error("Download error:", err);
            toast.error("An unexpected error occurred.");
        }
    };

    const openSizeModal = (files: Files[], label: string) => {
        setSizeModal({ isOpen: true, files, label });
    };

    const [visibleCount, setVisibleCount] = useState(30);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Filtered services for rendering (lazy loading)
    const visibleServices = useMemo(() => {
        let currentCount = 0;
        return groupedServices.map(service => {
            if (currentCount >= visibleCount) return { ...service, files: [] };
            const remaining = visibleCount - currentCount;
            const filesToShow = service.files.slice(0, remaining);
            currentCount += filesToShow.length;
            return { ...service, files: filesToShow };
        }).filter(service => service.files.length > 0);
    }, [groupedServices, visibleCount]);

    const totalFilesCount = useMemo(() => {
        return groupedServices.reduce((acc, s) => acc + s.files.length, 0);
    }, [groupedServices]);

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
        <div className="p-6 font-alexandria">
            {/* Buttons Row 1: Global Actions */}
            <div className="flex flex-wrap gap-3 mb-4">
                <Button
                    onClick={() => openSizeModal(paidPhotos, "All Photos")}
                    disabled={paidPhotos.length === 0 || !isAnyPhotoServicePaid}
                    title={!isAnyPhotoServicePaid ? "service not paid yet" : ""}
                    className={`px-4 h-[32px] md:h-[38px] border-[1px] ${userType}-border text-[12px] md:text-[13px] font-[500] text-white flex gap-[5px] justify-center items-center ${userType}-bg hover:brightness-110 rounded-[6px] transition-all ${(!isAnyPhotoServicePaid) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    <Download className="h-3.5 w-3.5" />
                    Download all photos
                </Button>

                <Button
                    onClick={() => handleDownload(paidVideos, "All Videos", "original")}
                    disabled={paidVideos.length === 0 || !isAnyVideoServicePaid}
                    title={!isAnyVideoServicePaid ? "service not paid yet" : ""}
                    className={`px-4 h-[32px] md:h-[38px] border-[1px] ${userType}-border text-[12px] md:text-[13px] font-[500] text-white flex gap-[5px] justify-center items-center ${userType}-bg hover:brightness-110 rounded-[6px] transition-all ${(!isAnyVideoServicePaid) ? "opacity-50 cursor-not-allowed" : ""}`}
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
                        disabled={selectedImageUuids.size === 0 || (allApprovedPhotos.length === 0 && allApprovedVideos.length === 0) || (!isAnyPhotoServicePaid && !isAnyVideoServicePaid)}
                        title={(!isAnyPhotoServicePaid && !isAnyVideoServicePaid) ? "service not paid yet" : ""}
                        className={`px-4 h-[32px] md:h-[38px] border-[1px] ${selectedImageUuids.size === 0 ? "border-gray-300 text-gray-500 bg-gray-100" : `${userType}-border ${userType}-text hover:text-[#fff] hover-${userType}-bg ${userType}-button`} text-[12px] md:text-[13px] font-[500] flex gap-[5px] justify-center items-center rounded-[6px] transition-colors ${(!isAnyPhotoServicePaid && !isAnyVideoServicePaid) ? "opacity-50 cursor-not-allowed" : ""}`}
                        style={selectedImageUuids.size === 0 ? {} : { backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    >
                        <Download className="h-3.5 w-3.5" />
                        Download manually {selectedImageUuids.size > 0 && `(${selectedImageUuids.size})`}
                    </Button>
                    <span className="text-gray-500 text-sm hidden md:inline">Click a file to select it for downloading manually.</span>
                </div>

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

            {/* Buttons Row 2: Per-Service Actions */}
            <div className="flex flex-wrap gap-3 mb-8">
                {groupedServices.map(service => {
                    const servicePhotos = service.files.filter(f => f.type === 'photo');
                    const serviceVideos = service.files.filter(f => f.type.toLowerCase() === 'video');
                    const isPaid = isServicePaid(service.uuid);

                    return (
                        <React.Fragment key={service.uuid}>
                            {servicePhotos.length > 0 && (
                                <Button
                                    onClick={() => openSizeModal(servicePhotos, service.name)}
                                    disabled={!isPaid}
                                    title={!isPaid ? "service not paid yet" : ""}
                                    className={`px-4 h-[32px] md:h-[38px] border-[1px] ${userType}-border text-[12px] md:text-[13px] font-[500] ${userType}-text flex gap-[5px] justify-center items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button rounded-[6px] transition-colors ${(!isPaid) ? "opacity-50 cursor-not-allowed" : ""}`}
                                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Download {service.name} photos ({servicePhotos.length})
                                </Button>
                            )}
                            {serviceVideos.length > 0 && (
                                <Button
                                    onClick={() => handleDownload(serviceVideos, service.name, "original")}
                                    disabled={!isPaid}
                                    title={!isPaid ? "service not paid yet" : ""}
                                    className={`px-4 h-[32px] md:h-[38px] border-[1px] ${userType}-border text-[12px] md:text-[13px] font-[500] ${userType}-text flex gap-[5px] justify-center items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button rounded-[6px] transition-colors ${(!isPaid) ? "opacity-50 cursor-not-allowed" : ""}`}
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

            {/* Grouped Services Grid */}
            <div className="space-y-12">
                {visibleServices.length > 0 ? (
                    <div className="space-y-12">
                        {visibleServices.map((service) => (
                            <div key={service.uuid} className="space-y-4">
                                <h3 className={`text-xl font-semibold ${userType}-text border-l-4 border-current pl-3`}>
                                    {service.name}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {service.files.map((file) => {
                                        const isSelected = selectedImageUuids.has(file.uuid);
                                        const isPaid = isServicePaid(file.service?.uuid || "");
                                        const isVideo = file.type.toLowerCase() === 'video';
                                        return (
                                            <div
                                                key={file.uuid}
                                                onClick={() => toggleImageSelection(file.uuid)}
                                                className={`relative group aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border-2 transition-all cursor-pointer select-none
                                                ${isSelected ? `${userType}-border shadow-md` : 'border-gray-200 hover:border-gray-300'}`}
                                            >
                                                <div className="relative w-full h-full">
                                                    {file.is_processing ? (
                                                        <div className="w-full h-full flex flex-col gap-2 items-center justify-center bg-gray-200">
                                                            <p className="text-gray-500 font-medium text-sm">Processing...</p>
                                                        </div>
                                                    ) : isVideo ? (
                                                        file.variant_urls?.thumb ? (
                                                            /* eslint-disable-next-line @next/next/no-img-element */
                                                            <img
                                                                src={file.variant_urls.thumb}
                                                                alt={file.group || file.name}
                                                                title={file.group || file.name}
                                                                className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${isSelected ? 'opacity-90' : ''}`}
                                                            />
                                                        ) : (
                                                            <video
                                                                src={`${file.url || `${API_URL}/${file.file_path}`}#t=0.1`}
                                                                preload="metadata"
                                                                muted
                                                                playsInline
                                                                title={file.group || file.name}
                                                                className={`absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 ${isSelected ? 'opacity-90' : ''}`}
                                                            />
                                                        )
                                                    ) : (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img
                                                            src={file.thumbnail_url || file.variant_urls?.thumb || file.url}
                                                            alt={file.group || file.name}
                                                            title={file.group || file.name}
                                                            className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${isSelected ? 'opacity-90' : ''}`}
                                                        />
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <div className={`absolute top-2 right-2 z-10 ${userType}-text bg-white rounded-full shadow-sm`}>
                                                        <CheckCircle2 className="w-6 h-6 shadow-sm" />
                                                    </div>
                                                )}
                                                {!isPaid && userType === 'agent' && (
                                                    <div className="absolute top-2 right-2 z-10 bg-black/50 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1">
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
                                                    <p className="text-white text-xs truncate font-medium">{file.group || file.name}</p>
                                                    <p className="text-gray-300 text-[10px] truncate">{file.service?.name}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

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
                    <div className="py-20 text-center text-gray-500">
                        No approved photos or videos found to download.
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
                onClose={() => setIsManualModalOpen(false)}
                apiFiles={selectedPaidFiles as unknown as ApiFile[]}
            />
        </div>
    );
};

export default DownloadTab;
