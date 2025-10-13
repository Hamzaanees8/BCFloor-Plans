'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Label } from "@radix-ui/react-dropdown-menu";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SelectedFiles } from "./HDRStill";
import { useAppContext } from "@/app/context/AppContext";

interface AddLevelDialogProps {
    open: boolean;
    onOpenChange: (val: boolean) => void;
    setSelectedFiles: React.Dispatch<React.SetStateAction<SelectedFiles[]>>;
    files: File[];
    type: string;
    serviceUuid: string;
}

const mediaOptions = [
    "Attic", "Bathroom 1", "Bathroom 2", "Bathroom 3", "Bathroom 4",
    "Master Bedroom", "Master Bedroom Bathroom", "Bedroom 1", "Bedroom 2",
    "Bedroom 3", "Bedroom 4", "Basement", "Foyer", "Garage", "Kitchen",
    "Laundry Room", "Living Room", "Office", "Shed"
];

const floorPlans = [
    "Dimensions PDF", "Branded Floor Plan", "UnBranded Floor Plan",
    "Branded Image", "Unbranded Image", "Additional Files"
];

export default function FilePreviewModal({
    open,
    onOpenChange,
    files,
    setSelectedFiles,
    type,
    serviceUuid,
}: AddLevelDialogProps) {
    const [localFiles, setLocalFiles] = useState<File[]>(files);
    const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
    const [mediaTypes, setMediaTypes] = useState<{ [key: number]: string }>({});
    const [groupLabel, setGroupLabel] = useState<string>("");
    const { userType } = useAppContext();

    useEffect(() => {
        setMediaTypes({});
        setLocalFiles(files);
        setSelectedIndexes([]);
        setGroupLabel('');
    }, [files]);

    const removeFile = (index: number) => {
        const updated = localFiles.filter((_, idx) => idx !== index);
        setLocalFiles(updated);
        setSelectedIndexes(selectedIndexes.filter(i => i !== index));
    };

    const toggleSelectFile = (index: number) => {
        setSelectedIndexes(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleAdd = () => {
        const filesToAdd = localFiles.map((file, index) => {
            const selectedType = mediaTypes[index];
            const defaultType = type === 'floor_plans' ? "Additional Files" : "";

            return {
                file,
                type: selectedType || defaultType,
                group: selectedIndexes.includes(index) ? groupLabel : "",
                upload: true,
                service_id: serviceUuid,
            };
        });

        setSelectedFiles((prev: SelectedFiles[]) => [
            ...prev,
            ...filesToAdd,
        ]);

        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[320px] md:w-[700px] max-w-none font-alexandria">
                <DialogHeader className="border-b pb-4 border-[#7d7d7d]">
                    <DialogTitle className={`text-[18px] ${userType}-text font-[600]`}>FILE UPLOAD</DialogTitle>
                </DialogHeader>

                {selectedIndexes.length >= 2 && (
                    <div className="mb-4">
                        <Label className="text-[#7d7d7d] text-[14px] mb-[10px] block">Group Label</Label>
                        <Input
                            value={groupLabel}
                            onChange={(e) => setGroupLabel(e.target.value)}
                            placeholder="Name"
                            className="w-full h-[42px] border text-[#696868] border-[#7d7d7d]"
                        />
                    </div>
                )}

                <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
                    {localFiles.map((file, idx) => (
                        <div key={idx} className="flex gap-[10px] pr-[10px]">
                            <div className="w-auto">
                                <div className="w-[200px] h-[130px] bg-gray-300 rounded-[6px] overflow-hidden relative">

                                    {/* eslint-disable @next/next/no-img-element */}
                                    {file.type.startsWith("video/") ? (
                                        <video
                                            src={URL.createObjectURL(file)}
                                            className="w-full h-full object-cover"
                                            controls
                                        />
                                    ) : (
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt="preview"
                                            className="w-full h-full object-cover"
                                        />
                                    )}

                                    <span
                                        className="flex w-[14px] h-[14px] absolute top-2 right-2 z-10 cursor-pointer"
                                        onClick={() => removeFile(idx)}
                                    >
                                        <X color={'#E06D5E'} size={14} />
                                    </span>
                                    {type === 'floor_plan' && (
                                        <Input
                                            className="absolute bottom-2 right-2 w-[14px] h-[14px] cursor-pointer"
                                            type="checkbox"
                                            checked={selectedIndexes.includes(idx)}
                                            onChange={() => toggleSelectFile(idx)}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="w-full flex flex-col gap-[10px]">
                                <Label className="text-[#7d7d7d] text-[14px]">Media Name</Label>
                                <Select
                                    onValueChange={(val) => setMediaTypes(prev => ({ ...prev, [idx]: val }))}
                                >
                                    <SelectTrigger className="w-full h-[42px] border text-[#696868] border-[#7d7d7d]">
                                        <SelectValue placeholder="Select Media Name" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(type === 'floor_plans' ? floorPlans : mediaOptions).map((item, i) => (
                                            <SelectItem key={i} value={item}>{item}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="text-[13px] text-[#7d7d7d] grid grid-cols-3">
                                    <p className="text-left col-span-1 text-[#8E8E8E] mt-1 truncate w-full overflow-hidden">{file.name}</p>
                                    <p className="text-center">(1 of {localFiles.length})</p>
                                    <p
                                        onClick={() => removeFile(idx)}
                                        className="text-[#E06D5E] cursor-pointer text-right"
                                    >
                                        Delete
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button className={`w-full ${userType}-text ${userType}-border h-[44px]`} variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button
                            className={`w-full ${userType}-bg text-white h-[44px]`}
                            onClick={handleAdd}
                            disabled={localFiles.length === 0}
                        >
                            Add
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
