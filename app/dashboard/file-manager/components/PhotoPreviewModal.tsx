import React from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useAppContext } from '@/app/context/AppContext';

type Props = {
    file: File | null;
    open: boolean;
    title: string;
    onClose: () => void;
    onDelete: () => void;
    onReplace: () => void;
};

const PhotoPreviewModal: React.FC<Props> = ({ file, open, onClose, title, onDelete, onReplace }) => {
    const { userType } = useAppContext();
    if (!open || !file) return null;

    const imageUrl = URL.createObjectURL(file);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[320px] md:w-[730px] md:max-w-[730px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle className={`flex items-center uppercase justify-between ${userType}-text text-[18px] font-[600]`}>
                        {title}
                        <Button
                            variant="ghost"
                            onClick={() => {
                                onClose();
                            }}
                            className="border-none !shadow-none bg-transparent p-0 h-auto hover:bg-transparent"
                            aria-label="Close"
                        >
                            <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </Button>
                    </DialogTitle>
                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                </DialogHeader>
                <div className="w-full h-[500px] flex justify-center items-center py-[42px]">
                    {/* eslint-disable @next/next/no-img-element */}
                    <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-contain rounded-md"
                    />
                </div>

                <DialogFooter className="flex flex-col md:flex-row md:justify-end gap-[5px] mt-2 font-raleway">
                    <button
                        onClick={() => {
                            onReplace();
                        }}
                        className={`bg-white rounded-[6px] w-full md:w-[176px] h-[44px] text-[20px] font-[600] border ${userType}-border ${userType}-text hover:bg-[#f1f8ff]`}
                    >
                        Replace
                    </button>
                    <button
                        onClick={() => {
                            onDelete();
                        }}
                        className={`${userType}-bg rounded-[6px] text-white hover-${userType}-bg w-full md:w-[176px] h-[44px] font-[600] text-[20px]`}
                    >
                        Delete
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PhotoPreviewModal;
