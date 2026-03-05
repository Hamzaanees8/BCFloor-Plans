import React, { useMemo, useState } from 'react';
import { useFileManagerContext, Files } from '../FileManagerContext';
import { Button } from '@/components/ui/button';
import { DownloadFile } from '../file-manager';
import { Loader2, Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '@/app/context/AppContext';
import BulkDownloadSizeModal, { DownloadSize } from './BulkDownloadSizeModal';
import DownloadModal, { ApiFile } from './DownloadModal';

const DownloadTab: React.FC = () => {
    const { filesData } = useFileManagerContext();
    const { userType } = useAppContext();
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [sizeModal, setSizeModal] = useState<{ isOpen: boolean; files: Files[]; label: string }>({
        isOpen: false,
        files: [],
        label: ''
    });
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [selectedImageUuids, setSelectedImageUuids] = useState<Set<string>>(new Set());

    // Identify photo services and their files
    const photoServices = useMemo(() => {
        if (!filesData?.files) return [];

        const servicesMap = new Map<number, { id: number; uuid: string; name: string; files: Files[] }>();

        filesData.files.forEach(file => {
            const serviceName = file.service?.name || "";
            const isForbiddenService = serviceName.toLowerCase().includes("floor plan") ||
                serviceName.toLowerCase().includes("video") ||
                serviceName.toLowerCase().includes("3d tour");

            if (file.is_agent_approved && file.type === 'photo' && file.service && !isForbiddenService) {
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
    }, [filesData]);

    // All photos from all photo services
    const allPhotos = useMemo(() => {
        return photoServices.flatMap(service => service.files);
    }, [photoServices]);

    // Selected photos filter
    const selectedPhotos = useMemo(() => {
        return allPhotos.filter(photo => selectedImageUuids.has(photo.uuid));
    }, [allPhotos, selectedImageUuids]);

    const toggleImageSelection = (uuid: string) => {
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
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Token not found.");
            return;
        }

        setIsDownloading(label);
        toast.info(`Preparing download for ${files.length} files (${size})...`);

        try {
            for (const file of files) {
                try {
                    const response = await DownloadFile(token, file.uuid, size);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.name || `photo-${file.uuid}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (err) {
                    console.error(`Failed to download file ${file.uuid}:`, err);
                }
            }
            toast.success(`Download started for ${label}`);
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Failed to trigger some downloads.");
        } finally {
            setIsDownloading(null);
        }
    };

    const openSizeModal = (files: Files[], label: string) => {
        setSizeModal({ isOpen: true, files, label });
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
            {/* Buttons Row */}
            <div className="flex flex-wrap gap-4 mb-8">
                <Button
                    onClick={() => openSizeModal(allPhotos, "All Photos")}
                    disabled={!!isDownloading || allPhotos.length === 0}
                    className={`px-6 h-[35px] md:h-[44px] border-[1px] ${userType}-border text-[14px] md:text-[16px] font-[500] text-white flex gap-[5px] justify-center items-center ${userType}-bg hover:brightness-110 rounded-[6px] transition-all`}
                >
                    {isDownloading === "All Photos" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download all
                </Button>

                {photoServices.map(service => (
                    <Button
                        key={service.uuid}
                        onClick={() => openSizeModal(service.files, service.name)}
                        disabled={!!isDownloading || service.files.length === 0}
                        className={`px-6 h-[35px] md:h-[44px] border-[1px] ${userType}-border text-[14px] md:text-[16px] font-[500] ${userType}-text flex gap-[5px] justify-center items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button rounded-[6px] transition-colors`}
                        style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                    >
                        {isDownloading === service.name ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Download {service.name}
                    </Button>
                ))}

                <Button
                    onClick={() => {
                        if (selectedImageUuids.size === 0) {
                            toast.warning("Please select at least one photo first.");
                            return;
                        }
                        setIsManualModalOpen(true);
                    }}
                    disabled={!!isDownloading || allPhotos.length === 0}
                    className={`px-6 h-[35px] md:h-[44px] border-[1px] ${userType}-border text-[14px] md:text-[16px] font-[500] ${userType}-text flex gap-[5px] justify-center items-center hover:text-[#fff] hover-${userType}-bg ${userType}-button rounded-[6px] transition-colors`}
                    style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                >
                    {isDownloading === "Manually" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download manually {selectedImageUuids.size > 0 && `(${selectedImageUuids.size})`}
                </Button>

                {selectedImageUuids.size > 0 && (
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedImageUuids(new Set())}
                        className="text-gray-500 hover:text-red-500 font-medium text-sm transition-colors"
                    >
                        Clear Selection
                    </Button>
                )}
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {allPhotos.length > 0 ? (
                    allPhotos.map((file) => {
                        const isSelected = selectedImageUuids.has(file.uuid);
                        return (
                            <div
                                key={file.uuid}
                                onClick={() => toggleImageSelection(file.uuid)}
                                className={`relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all cursor-pointer select-none
                                    ${isSelected ? `${userType}-border shadow-md` : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={file.variant_urls?.thumb || file.thumbnail_url || file.url}
                                    alt={file.name}
                                    title={file.name}
                                    className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${isSelected ? 'opacity-90' : ''}`}
                                />
                                {isSelected && (
                                    <div className={`absolute top-2 right-2 z-10 ${userType}-text bg-white rounded-full shadow-sm`}>
                                        <CheckCircle2 className="w-6 h-6 shadow-sm" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pointer-events-none">
                                    <p className="text-white text-xs truncate font-medium">{file.name}</p>
                                    <p className="text-gray-300 text-[10px] truncate">{file.service?.name}</p>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-20 text-center text-gray-500">
                        No approved photos found to download.
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
                apiFiles={selectedPhotos as unknown as ApiFile[]}
            />
        </div>
    );
};

export default DownloadTab;
