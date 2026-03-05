import React from 'react';
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

    const sizes: { label: string; value: DownloadSize }[] = [
        { label: 'Original Quality', value: 'original' },
        { label: 'Small', value: 'small' },
        { label: 'Large', value: 'large' },
        { label: 'MLS', value: 'mls' },
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
                <div className="grid grid-cols-1 gap-4 py-6">
                    <p className="text-[15px] text-[#666666] mb-2 font-medium">
                        Choose the quality/size for your download. This selection will apply to all files in this batch.
                    </p>
                    {sizes.map((size) => (
                        <Button
                            key={size.value}
                            onClick={() => {
                                onSelectSize(size.value);
                                onClose();
                            }}
                            className={`w-full h-12 border-[1px] ${userType}-border ${userType}-text bg-white hover:text-white hover-${userType}-bg ${userType}-button rounded-[6px] font-semibold text-[16px] transition-all shadow-sm`}
                            style={{ backgroundColor: `var(--${userType}-page-bg, #F2F2F2)` }}
                        >
                            {size.label}
                        </Button>
                    ))}
                </div>
                <DialogFooter className="sm:justify-end border-t border-[#E4E4E4] pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="text-[#7D7D7D] hover:text-[#424242] font-semibold text-[16px] transition-colors"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BulkDownloadSizeModal;
