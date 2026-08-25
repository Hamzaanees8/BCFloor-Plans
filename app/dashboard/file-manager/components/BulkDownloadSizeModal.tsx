import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/app/context/AppContext';
import { X } from 'lucide-react';
import { GetMediaSettings } from '@/app/dashboard/global-settings/global-settings';

export type DownloadSize = 'small' | 'large' | 'mls' | 'original';

interface BulkDownloadSizeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSize: (size: DownloadSize) => void;
    title?: string;
}

const BulkDownloadSizeModal: React.FC<BulkDownloadSizeModalProps> = ({
    isOpen,
    onClose,
    onSelectSize,
    title = "Select Download Size"
}) => {
    const { userType } = useAppContext();
    const [dimensions, setDimensions] = useState<{
        mls?: { width: number; height: number };
        large?: { width: number; height: number };
        small?: { width: number; height: number };
    }>({});

    useEffect(() => {
        if (isOpen) {
            GetMediaSettings().then((res) => {
                if (res?.value?.photos) {
                    setDimensions(res.value.photos);
                }
            }).catch((err) => {
                console.error("Failed to load media settings:", err);
            });
        }
    }, [isOpen]);

    const sizes: { label: string; subLabel: string; value: DownloadSize }[] = [
        {
            label: 'Original Quality',
            subLabel: 'Original Upload Resolution & Format',
            value: 'original'
        },
        {
            label: 'MLS',
            subLabel: `${dimensions.mls?.width || 2048} × ${dimensions.mls?.height || 1536} px (Standard JPEG)`,
            value: 'mls'
        },
        {
            label: 'Large',
            subLabel: `${dimensions.large?.width || 1920} × ${dimensions.large?.height || 1280} px`,
            value: 'large'
        },
        {
            label: 'Small',
            subLabel: `${dimensions.small?.width || 800} × ${dimensions.small?.height || 533} px`,
            value: 'small'
        },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#FAFAFA] rounded-[8px] shadow-lg border p-6 w-full max-w-[500px] font-alexandria [&>button]:hidden">
                <DialogHeader>
                    <div className="flex items-center justify-between border-b border-[#E4E4E4] pb-2">
                        <DialogTitle className={`uppercase ${userType}-text text-[18px] font-semibold`}>
                            {title}
                        </DialogTitle>
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="p-0 hover:bg-transparent shadow-none h-auto transition-colors"
                        >
                            <X className="w-5 h-5 text-[#7D7D7D]" />
                        </Button>
                    </div>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3 py-4">
                    <p className="text-[14px] text-[#666666] mb-1 font-medium">
                        Choose the quality/size for your download. This selection will apply to all files in this batch.
                    </p>
                    {sizes.map((size) => (
                        <Button
                            key={size.value}
                            onClick={() => {
                                onSelectSize(size.value);
                                onClose();
                            }}
                            className={`w-full h-auto py-2.5 px-4 flex flex-col items-start justify-center border-[1px] ${userType}-border ${userType}-text bg-white hover:text-white hover-${userType}-bg ${userType}-button rounded-[6px] transition-all shadow-xs`}
                            style={{ backgroundColor: `var(--${userType}-page-bg, #F8F8F8)` }}
                        >
                            <span className="font-semibold text-[15px]">{size.label}</span>
                            <span className="text-[12px] opacity-75 font-normal">{size.subLabel}</span>
                        </Button>
                    ))}
                </div>
                <DialogFooter className="sm:justify-end border-t border-[#E4E4E4] pt-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="text-[#7D7D7D] hover:text-[#424242] font-semibold text-[15px] transition-colors"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BulkDownloadSizeModal;
