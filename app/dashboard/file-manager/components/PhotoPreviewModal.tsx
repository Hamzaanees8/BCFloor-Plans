import React from 'react';
import { X } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type Props = {
    file: File | null;
    open: boolean;
    title: string;
    onClose: () => void;
    onDelete: () => void;
    onReplace: () => void;
};

const PhotoPreviewModal: React.FC<Props> = ({ file, open, onClose, title, onDelete, onReplace }) => {
    if (!open || !file) return null;

    const imageUrl = URL.createObjectURL(file);

    return (
        <AlertDialog open={open} onOpenChange={onClose}>
            <AlertDialogContent className="w-[320px] md:w-[730px] md:max-w-[730px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center uppercase justify-between text-[#4290E9] text-[18px] font-[600]">
                        {title}
                        <button
                            onClick={() => {
                                onClose();
                            }}
                            className="border-none !shadow-none bg-transparent"
                            aria-label="Close"
                        >
                            <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </button>
                    </AlertDialogTitle>
                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                </AlertDialogHeader>
                <div className="w-full h-[500px] flex justify-center items-center py-[42px]">
                    {/* eslint-disable @next/next/no-img-element */}
                    <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-contain rounded-md"
                    />
                </div>

                <AlertDialogFooter className="flex flex-col md:flex-row md:justify-end gap-[5px] mt-2 font-raleway">
                    <button
                        onClick={() => {
                            onReplace();
                        }}
                        className="bg-white rounded-[6px] w-full md:w-[176px] h-[44px] text-[20px] font-[600] border border-[#0078D4] text-[#0078D4] hover:bg-[#f1f8ff]"
                    >
                        Replace
                    </button>
                    <button
                        onClick={() => {
                            onDelete();
                        }}
                        className="bg-[#4290E9] rounded-[6px] text-white hover:bg-[#005fb8] w-full md:w-[176px] h-[44px] font-[600] text-[20px]"
                    >
                        Delete
                    </button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default PhotoPreviewModal;
