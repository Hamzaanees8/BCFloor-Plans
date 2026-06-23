'use client';
import React, { useEffect, useState, useRef } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from '@/app/context/AppContext';
import { useFileManagerContext } from '../FileManagerContext';
import ConfirmationDialog from '@/components/ConfirmationDialog';

interface Props {
    file: File | string | null;
    open: boolean;
    title: string;
    onClose: () => void;
    onDelete?: () => void;
    onReplace?: () => void;
    initialName?: string;
    onSave?: (newName: string) => void;
    type?: 'photo' | 'video';
    suggestions?: string[];
    isPaid?: boolean;
    isAgentApproved?: boolean;
    poster?: string;
}

const defaultMediaOptions = [
    "Attic", "Bathroom 1", "Bathroom 2", "Bathroom 3", "Bathroom 4",
    "Master Bedroom", "Master Bedroom Bathroom", "Bedroom 1", "Bedroom 2",
    "Bedroom 3", "Bedroom 4", "Basement", "Foyer", "Garage", "Kitchen",
    "Laundry Room", "Living Room", "Office", "Shed"
];

const PhotoPreviewModal: React.FC<Props> = ({
    file,
    open,
    onClose,
    title,
    onDelete,
    onReplace,
    initialName = '',
    onSave,
    type = 'photo',
    suggestions,
    isPaid = true,
    isAgentApproved = false,
    poster
}) => {
    const { userType } = useAppContext();
    const { filesData } = useFileManagerContext();
    const [name, setName] = useState(initialName);
    const [openDropdown, setOpenDropdown] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [showAgentWarning, setShowAgentWarning] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleCopy = () => {
        if (!name) return;
        navigator.clipboard.writeText(name);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const existingGroups = Array.from(new Set(filesData?.files?.map(f => f.group).filter(Boolean) || [])) as string[];
    const allSuggestions = Array.from(new Set([...(suggestions || defaultMediaOptions), ...existingGroups]));
    const [mediaUrl, setMediaUrl] = useState<string>('');
    const urlRef = useRef<string | null>(null);

    useEffect(() => {
        if (open) {
            setName(initialName);
        }
    }, [initialName, open]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!file) {
            setMediaUrl('');
            return;
        }

        if (typeof file === 'string') {
            setMediaUrl(file);
        } else {
            const url = URL.createObjectURL(file as File);
            urlRef.current = url;
            setMediaUrl(url);
        }

        return () => {
            if (urlRef.current) {
                URL.revokeObjectURL(urlRef.current);
                urlRef.current = null;
            }
        };
    }, [file]);

    if (!open || !file) return null;

    const isPdf = typeof file === 'string'
        ? file.split('?')[0].toLowerCase().endsWith('.pdf')
        : file?.type === 'application/pdf' || file?.name?.toLowerCase().endsWith('.pdf');

    const handleSave = () => {
        if (onSave) {
            onSave(name);
            onClose();
        }
    };

    const isRestrictedPdf = isPdf && userType === 'agent' && !isPaid;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] md:w-[850px] md:max-w-[900px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle className={`flex items-center uppercase justify-between ${userType}-text text-[18px] font-[600]`}>
                        {title}
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="border-none !shadow-none bg-transparent p-0 h-auto hover:bg-transparent"
                            aria-label="Close"
                        >
                            <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                        </Button>
                    </DialogTitle>
                    <hr className="w-full h-[1px] text-[#BBBBBB]" />
                </DialogHeader>

                <div className="w-full h-[50vh] md:h-[65vh] min-h-[400px] max-h-[700px] flex justify-center items-center bg-black rounded-lg overflow-hidden">
                    {type === 'video' ? (
                        <video
                            src={mediaUrl}
                            poster={poster}
                            controls
                            controlsList="nodownload"
                            preload="auto"
                            playsInline
                            className="max-w-full max-h-full rounded-md"
                        />
                    ) : isRestrictedPdf ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-100 w-full h-full rounded-md gap-4">
                            <div className="bg-red-50 rounded-full p-6">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M14 2V8H20" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <span className="text-gray-500 font-bold max-w-[300px]">
                                PDF preview is disabled until the service is paid.
                            </span>
                        </div>
                    ) : isPdf ? (
                        <iframe
                            src={`${mediaUrl}#toolbar=0`}
                            className="w-full h-full rounded-md border-none"
                            title="PDF Preview"
                        />
                    ) : (
                        /* eslint-disable @next/next/no-img-element */
                        <img
                            src={mediaUrl}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain rounded-md"
                        />
                    )}
                </div>

                {onSave && userType !== 'agent' && (
                    <div className="mt-2 space-y-2 relative" ref={dropdownRef}>
                        <Label className="text-[#7d7d7d] text-[14px]">Media Name</Label>
                        <div className="relative">
                            <Input
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setOpenDropdown(true);
                                }}
                                onFocus={() => setOpenDropdown(true)}
                                placeholder="Select or Type Media Name"
                                className="w-full h-[42px] border text-[#696868] border-[#7d7d7d] pr-10"
                            />
                            {name && (
                                <div className="absolute right-3 top-[21px] -translate-y-1/2 group">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleCopy();
                                        }}
                                        type="button"
                                        className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded"
                                        aria-label="Copy name"
                                    >
                                        {isCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                    </button>
                                    <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                                        {isCopied ? 'Copied!' : 'Click to copy to clipboard'}
                                    </span>
                                </div>
                            )}
                            {openDropdown && (
                                <div className="absolute z-[100] w-full bottom-full mb-1 bg-white border border-[#7d7d7d] rounded-md shadow-lg max-h-[150px] overflow-y-auto custom-scroll">
                                    {allSuggestions
                                        .map((item, i) => (
                                            <div
                                                key={i}
                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-[#696868] text-[14px]"
                                                onClick={() => {
                                                    setName(item);
                                                    setOpenDropdown(false);
                                                }}
                                            >
                                                {item}
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <DialogFooter className="flex flex-col md:flex-row md:justify-end gap-[10px] mt-4 font-raleway">
                    {onReplace && userType !== 'agent' && (
                        <button
                            onClick={onReplace}
                            className={`bg-white rounded-[6px] w-full md:w-[150px] h-[40px] text-[16px] font-[600] border ${userType}-border ${userType}-text hover:bg-[#f1f8ff]`}
                        >
                            Replace
                        </button>
                    )}
                    {onDelete && userType !== 'agent' && (
                        <button
                            onClick={() => setShowConfirmDelete(true)}
                            className={`bg-white rounded-[6px] w-full md:w-[150px] h-[40px] text-[16px] font-[600] border border-[#E06D5E] text-[#E06D5E] hover:bg-red-50`}
                        >
                            Delete
                        </button>
                    )}
                    {onSave && userType !== 'agent' && (
                        <button
                            onClick={handleSave}
                            className={`${userType}-bg rounded-[6px] text-white hover-${userType}-bg w-full md:w-[150px] h-[40px] font-[600] text-[16px]`}
                        >
                            Save
                        </button>
                    )}
                    {(!onSave || userType === 'agent') && (
                        <button
                            onClick={onClose}
                            className={`${userType}-bg rounded-[6px] text-white hover-${userType}-bg w-full md:w-[150px] h-[40px] font-[600] text-[16px]`}
                        >
                            Close
                        </button>
                    )}
                </DialogFooter>
                {showConfirmDelete && (
                    <ConfirmationDialog
                        open={showConfirmDelete}
                        setOpen={setShowConfirmDelete}
                        onConfirm={() => {
                            if (isAgentApproved && userType !== 'agent') {
                                setShowConfirmDelete(false);
                                setShowAgentWarning(true);
                            } else {
                                if (onDelete) onDelete();
                                onClose();
                            }
                        }}
                        showAgain={false}
                        toggleShowAgain={() => { }}
                        title="Delete File"
                        dialogType="delete"
                        description="Are you sure you want to delete this file? This action cannot be undone."
                    />
                )}
                {showAgentWarning && (
                    <ConfirmationDialog
                        open={showAgentWarning}
                        setOpen={setShowAgentWarning}
                        onConfirm={() => {
                            if (onDelete) onDelete();
                            onClose();
                        }}
                        showAgain={false}
                        toggleShowAgain={() => { }}
                        title="Delete Approved File"
                        dialogType="delete"
                        description="The agent approved this file. Do you still want to delete it?"
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PhotoPreviewModal;
