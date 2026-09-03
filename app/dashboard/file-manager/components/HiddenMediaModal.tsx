'use client';

import React, { useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Loader2, PlayCircle, Link as LinkIcon, X } from 'lucide-react';
import { useFileManagerContext } from '../FileManagerContext';
import { Services } from '../../services/page';
import { MediaDateBoundary } from './FileManager';
import { HideMediaFiles } from '../file-manager';
import { toast } from 'sonner';
import { useAppContext } from '@/app/context/AppContext';
import NextImage from "next/image";
import { PdfPlaceholder } from './OptimizedPreview';

interface HiddenMediaModalProps {
    open: boolean;
    onClose: () => void;
    currentService?: Services;
    mediaDateBoundary?: MediaDateBoundary;
    isFetching?: boolean;
}

export default function HiddenMediaModal({ open, onClose, currentService, mediaDateBoundary, isFetching }: HiddenMediaModalProps) {
    const { filesData, setFilesData } = useFileManagerContext();
    const { userType } = useAppContext();
    const [selectedUuids, setSelectedUuids] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

    // Filter hidden files and links for the current service/boundary
    const hiddenItems = useMemo(() => {
        if (!filesData) return { files: [], links: [] };

        const hiddenFiles = (filesData.files || []).filter(file => {
            if (!file.is_hidden) return false;
            if (currentService && file.service?.uuid !== currentService.uuid) return false;
            
            if (mediaDateBoundary) {
                const fileDate = new Date(file.created_at).getTime();
                const from = mediaDateBoundary.from ? mediaDateBoundary.from.getTime() : 0;
                const to = mediaDateBoundary.to ? mediaDateBoundary.to.getTime() : Infinity;
                if (fileDate < from || fileDate >= to) return false;
            }
            return true;
        });

        const hiddenLinks = (filesData.links || []).filter(link => {
            if (!link.is_hidden) return false;
            if (currentService && link.service?.uuid !== currentService.uuid) return false;
            return true;
        });

        return { files: hiddenFiles, links: hiddenLinks };
    }, [filesData, currentService, mediaDateBoundary]);

    const totalHiddenCount = hiddenItems.files.length + hiddenItems.links.length;

    const toggleSelection = (uuid: string) => {
        setSelectedUuids(prev => {
            const next = new Set(prev);
            if (next.has(uuid)) next.delete(uuid);
            else next.add(uuid);
            return next;
        });
    };

    const handleUnhide = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Authentication required");
            return;
        }

        if (selectedUuids.size === 0) {
            toast.error("Please select items to unhide");
            return;
        }

        setIsLoading(true);
        try {
            await HideMediaFiles(token, Array.from(selectedUuids), false);
            toast.success("Media updated successfully");
            
            // Update local state to reflect unhidden status
            if (filesData) {
                setFilesData({
                    ...filesData,
                    files: filesData.files.map(f => 
                        selectedUuids.has(f.uuid) ? { ...f, is_hidden: false } : f
                    ),
                    links: filesData.links.map(l => 
                        (l.uuid && selectedUuids.has(l.uuid)) ? { ...l, is_hidden: false } : l
                    )
                });
            }
            
            setSelectedUuids(new Set());
            if (selectedUuids.size === totalHiddenCount) {
                onClose();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update media");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[95%] md:w-[800px] max-w-[900px] max-h-[90vh] flex flex-col rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria [&>button]:hidden bg-white">
                <DialogHeader className="mb-2">
                    <DialogTitle className={`flex items-start md:items-center justify-between ${userType}-text text-[16px] md:text-[18px] font-[600] border-b-[1px] border-[#E4E4E4] pb-3 uppercase`}>
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                                <span>Hidden Media</span>
                                {!isFetching && (
                                    <span className="text-[12px] font-normal text-muted-foreground bg-gray-100 px-3 py-0.5 rounded-full lowercase">
                                        {totalHiddenCount} items
                                    </span>
                                )}
                                {isFetching && (
                                    <span className="flex items-center gap-1.5 text-[12px] font-normal text-muted-foreground normal-case">
                                        <Loader2 size={13} className="animate-spin" /> Loading...
                                    </span>
                                )}
                            </div>
                            {currentService && (
                                <span className="text-[11px] font-normal text-[#7D7D7D] normal-case tracking-normal">
                                    Service: <span className="font-semibold text-[#555]">{currentService.name}</span>
                                </span>
                            )}
                        </div>
                        <Button onClick={onClose} variant="ghost" className="border-none !shadow-none p-0 h-auto hover:bg-transparent">
                            <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto max-h-[60vh] pr-2">
                    {isFetching ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                            <Loader2 size={42} className={`animate-spin opacity-60 ${userType}-text`} />
                            <p className="text-[14px] font-medium">Fetching hidden media...</p>
                            {currentService && (
                                <p className="text-[12px] text-[#7D7D7D]">for <span className="font-semibold">{currentService.name}</span></p>
                            )}
                        </div>
                    ) : totalHiddenCount === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground font-alexandria">
                            <Check size={48} className="mb-4 opacity-20" />
                            <p className="text-[16px]">No hidden media found for this service.</p>
                            {currentService && (
                                <p className="text-[12px] text-[#7D7D7D] mt-1">{currentService.name}</p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                            {/* Files */}
                            {hiddenItems.files.map((file) => {
                                const isSelected = selectedUuids.has(file.uuid);
                                const isPdf = file.file_path?.toLowerCase().endsWith('.pdf') || file.type === 'pdf' || file.type === 'application/pdf';
                                const isUnpaid = !file.variant_urls || (Array.isArray(file.variant_urls) && file.variant_urls.length === 0) || Object.keys(file.variant_urls).length === 0;

                                return (
                                    <div 
                                        key={file.uuid}
                                        className={`relative aspect-[4/3] rounded-[6px] border border-[#A8A8A8] cursor-pointer transition-all overflow-hidden group ${
                                            isSelected ? `ring-2 ring-offset-1 ${userType === 'agent' ? 'ring-[#DC9600]' : 'ring-[#6BAE41]'}` : ''
                                        }`}
                                        onClick={() => toggleSelection(file.uuid)}
                                        style={{ backgroundColor: 'black' }}
                                    >
                                        <div className="absolute inset-0">
                                            {file.type === 'video' ? (
                                                <div className="w-full h-full relative">
                                                    {file.variant_urls?.thumb ? (
                                                        <NextImage 
                                                            src={file.variant_urls.thumb} 
                                                            alt={file.name} 
                                                            fill 
                                                            className={`object-contain transition-all duration-300 ${isSelected ? 'grayscale-0 opacity-100' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'}`}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                            <PlayCircle size={32} className="text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300">
                                                        <PlayCircle className="text-white drop-shadow-md fill-black/20" size={32} />
                                                    </div>
                                                </div>
                                            ) : isPdf ? (
                                                isUnpaid ? (
                                                    <PdfPlaceholder 
                                                        className={`w-full h-full object-contain transition-all duration-300 ${isSelected ? 'grayscale-0 opacity-100' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'}`}
                                                        message="service is not paid yet"
                                                    />
                                                ) : (
                                                    <div className="relative w-full h-full overflow-hidden">
                                                        <iframe
                                                            src={`${file.variant_urls?.popup || file.url || `${API_URL}/${file.file_path}`}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                                            className={`w-full h-full pointer-events-none border-none transition-all duration-300 ${isSelected ? 'grayscale-0 opacity-100' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'}`}
                                                            tabIndex={-1}
                                                            scrolling="no"
                                                        />
                                                        <div className="absolute inset-0 bg-transparent" />
                                                    </div>
                                                )
                                            ) : (
                                                <NextImage 
                                                    src={file.variant_urls?.thumb || file.thumbnail_url || file.url || (file.file_path ? `${API_URL}/${file.file_path}` : '')} 
                                                    alt={file.name} 
                                                    fill 
                                                    className={`object-contain transition-all duration-300 ${isSelected ? 'grayscale-0 opacity-100' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'}`}
                                                />
                                            )}
                                        </div>
                                        
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-[25]">
                                                <div className="bg-white rounded-full p-1 shadow-lg">
                                                    <Check className={`${userType === 'agent' ? 'text-[#DC9600]' : 'text-[#6BAE41]'}`} size={24} strokeWidth={4} />
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold truncate">
                                            {file.name}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Links */}
                            {hiddenItems.links.map((link) => {
                                const isSelected = link.uuid && selectedUuids.has(link.uuid);
                                return (
                                    <div 
                                        key={link.uuid || link.link}
                                        className={`relative aspect-[4/3] rounded-[6px] border border-[#A8A8A8] cursor-pointer transition-all overflow-hidden group flex flex-col items-center justify-center ${
                                            isSelected ? `ring-2 ring-offset-1 ${userType === 'agent' ? 'ring-[#DC9600]' : 'ring-[#6BAE41]'}` : 'bg-gray-50'
                                        }`}
                                        onClick={() => link.uuid && toggleSelection(link.uuid)}
                                        style={{ backgroundColor: isSelected ? `color-mix(in srgb, var(--${userType}-page-bg, #EEEEEE), white 20%)` : `var(--${userType}-page-bg, #EEEEEE)` }}
                                    >
                                        <div className={`p-2 rounded-full shadow-sm mb-1 transition-transform ${isSelected ? 'bg-white scale-110' : 'bg-white group-hover:scale-110'}`}>
                                            <LinkIcon className={isSelected ? (userType === 'agent' ? 'text-[#DC9600]' : 'text-[#6BAE41]') : 'text-gray-400'} size={20} />
                                        </div>
                                        <p className="text-[9px] font-bold text-gray-500 uppercase">{link.type} Link</p>
                                        <p className="text-[9px] text-[#7D7D7D] mt-0.5 max-w-[80%] truncate">{link.link}</p>
                                        
                                        {isSelected && link.uuid && (
                                            <div className="absolute top-2 right-2 z-[25]">
                                                <div className="bg-white rounded-full p-0.5 shadow-sm">
                                                    <Check className={`${userType === 'agent' ? 'text-[#DC9600]' : 'text-[#6BAE41]'}`} size={14} strokeWidth={4} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex flex-col md:flex-row md:justify-end gap-[5px] mt-2 font-alexandria border-t pt-4">
                    <div className="flex flex-col md:flex-row w-full items-center justify-between gap-4 md:gap-0">
                        <p className="text-[14px] text-[#666666] self-start md:self-auto">
                            {isFetching ? (
                                <span className="flex items-center gap-1.5 text-[13px]">
                                    <Loader2 size={13} className="animate-spin" /> Loading hidden media...
                                </span>
                            ) : (
                                `${selectedUuids.size} items selected`
                            )}
                        </p>
                        <div className="flex w-full md:w-auto gap-[10px] justify-between md:justify-end">
                            <Button 
                                onClick={onClose} 
                                variant="outline" 
                                disabled={isLoading}
                                className={`bg-white flex-1 md:flex-none md:w-[100px] h-[40px] text-[14px] md:text-[16px] font-[400] ${userType}-text ${userType}-border hover-${userType}-bg hover:opacity-95 ${userType}-button`}
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleUnhide} 
                                disabled={selectedUuids.size === 0 || isLoading || !!isFetching}
                                className={`${userType}-border hover:opacity-95 text-white ${userType}-bg hover-${userType}-bg h-[40px] px-2 md:px-6 font-[400] text-[14px] md:text-[16px] flex-1 md:flex-none md:min-w-[150px]`}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Restore Selection'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
