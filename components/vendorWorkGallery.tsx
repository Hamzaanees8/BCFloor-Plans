"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export interface VendorsTourMedia {
    id: number;
    uuid: string;
    tour_id: number;
    type: 'photo' | 'video' | string; // Assuming it could be other types too
    name: string;
    file_path: string;
    group: string | null;
    service_id: number;
    sort_order: number;
    created_at: string;
    updated_at: string;
    // Optional: If you need the full URL
    image_url?: string;
}

interface VendorWorkGalleryProps {
    files: VendorsTourMedia[];
    onSave: (images: string[]) => void;
    trigger?: React.ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
    selectedImages?: string[];
}

export default function VendorWorkGallery({
    files,
    onSave,
    trigger,
    isOpen: externalIsOpen,
    onClose: externalOnClose,
    selectedImages = []
}: VendorWorkGalleryProps) {

    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [selected, setSelected] = useState<string[]>(selectedImages);

    const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;

    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    const setIsOpen =
        externalOnClose
            ? (open: boolean) => { if (!open) externalOnClose(); }
            : setInternalIsOpen;

    useEffect(() => {
        setSelected(selectedImages);
    }, [selectedImages]);

    const toggleSelect = (filePath: string) => {
        setSelected(prev =>
            prev.includes(filePath)
                ? prev.filter(p => p !== filePath)
                : [...prev, filePath]
        );
    };

    const handleSave = () => {
        onSave(selected);
        setIsOpen(false);
    };


    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) setSelected(selectedImages); // reset
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {externalIsOpen === undefined && (
                <DialogTrigger asChild>
                    {trigger || <Button>Select Photo</Button>}
                </DialogTrigger>
            )}

            <DialogContent className="max-w-7xl h-[80vh] !rounded-none p-4 overflow-hidden bg-[#E4E4E4] font-alexandria">
                <DialogHeader className="border-b border-gray-400 px-6 py-3">
                    <DialogTitle className="text-[#4290E9] font-semibold tracking-wide text-left">
                        SELECT PHOTOS
                    </DialogTitle>
                </DialogHeader>

                <div className="flex gap-3 justify-end">
                    <Button
                        className="bg-[#4290E9] w-[160px] h-[40px] hover:bg-[#4290E9]/90 text-white"
                        onClick={handleSave}
                        disabled={selected.length === 0}
                    >
                        Add Photos ({selected.length})
                    </Button>
                </div>

                <div className="p-6 h-full overflow-y-auto">
                    {files.length > 0 ? (
                        <div className="grid grid-cols-4 gap-4">
                            {files.map(file => {
                                const isSelected = selected.includes(file.file_path);

                                return (
                                    <div
                                        key={file.id}
                                        className="justify-self-center cursor-pointer"
                                        onClick={() => toggleSelect(file.file_path)}
                                    >
                                        <div className="relative">
                                            <div
                                                className={`relative w-[280px] h-[175px] bg-[#EEEEEE] overflow-hidden transition-all
                      ${isSelected ? "border-[#4290E9] border-2" : "border-[#A8A8A8] border"}`}
                                            >
                                                {/*  eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={`${API_URL}/${file.file_path}`}
                                                    alt={file.name}
                                                    className="object-cover w-full h-full"
                                                />

                                                {isSelected && (
                                                    <span
                                                        className="absolute top-0 right-0 w-[60px] h-[60px] flex justify-end items-start p-[10px]"
                                                        style={{
                                                            clipPath: "polygon(100% 0, 0 0, 100% 100%)",
                                                            backgroundColor: "#4290E9"
                                                        }}
                                                    >
                                                        <Check color="#fff" size={14} />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-gray-500 font-alexandria">
                            <p className="text-xl font-semibold mb-2">No media in your gallery</p>
                            <p className="text-sm">Upload photos to see them here.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
