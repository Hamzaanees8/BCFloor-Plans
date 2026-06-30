'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";

// const CATEGORY_OPTIONS = ["Finished", "Subtotal", "Other"];

interface TourSetting {
    uuid: string;
    area: string;
    type: string;
    status: boolean;
}

interface AddExtraDialogProps {
    open: boolean;
    onOpenChange: (val: boolean) => void;
    onAddExtra: (label: string, squareFootage: number, category: "Finished" | "Subtotal" | "Other", customLabel?: string) => void;
    defaultCategory?: "Finished" | "Subtotal" | "Other";
    tourSettings?: TourSetting[];
}

export default function AddExtraDialog({ open, onOpenChange, onAddExtra, defaultCategory = "Finished", tourSettings = [] }: AddExtraDialogProps) {
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const roleColor = appliedSettings?.[(userType as keyof typeof appliedSettings) || 'admin']?.pageTabColor || '#DC9600';

    const [selected, setSelected] = useState("");
    const [category, setCategory] = useState<"Finished" | "Subtotal" | "Other">(defaultCategory);
    const [customTitle, setCustomTitle] = useState("");
    const [squareFootage, setSquareFootage] = useState("");

    // Map internal category (Finished/Other/Subtotal) to the API type string
    const categoryToApiType: Record<string, string> = {
        Finished: "Finished Area",
        Subtotal: "Sub Area",
        Other: "Other Area",
    };

    // Filter tour settings to only include areas matching the current category
    const filteredOptions = tourSettings.filter(
        (s) => s.status && s.type === categoryToApiType[category]
    ).map((s) => s.area);

    // Always offer a Custom entry
    const dropdownOptions = [...filteredOptions, "Custom..."];

    const isCustom = selected === "Custom...";
    const isValid = selected && (!isCustom || customTitle.trim() !== "") && squareFootage.trim() !== "";

    const handleSubmit = () => {
        if (!isValid) return;
        const finalLabel = isCustom ? customTitle : selected;
        const customKey = isCustom ? customTitle : undefined;
        onAddExtra(finalLabel, Number(squareFootage), category, customKey);

        setSelected("");
        setCustomTitle("");
        setSquareFootage("");
        setCategory(defaultCategory);
        onOpenChange(false);
    };

    // Reset form when dialog opens with new defaultCategory
    useEffect(() => {
        if (open) {
            setSelected("");
            setCustomTitle("");
            setSquareFootage("");
            setCategory(defaultCategory);
        }
    }, [open, defaultCategory]);
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[320px] md-[470px] font-alexandria">
                <DialogHeader>
                    <DialogTitle className="text-[18px] font-bold uppercase" style={{ color: roleColor }}>Add a custom level</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* <div>
                        <label className="text-[16px] font-[400] text-[#666]">Category</label>
                        <Select value={category} onValueChange={(val) => setCategory(val as "Finished" | "Subtotal" | "Other")}>
                            <SelectTrigger className="mt-1 w-full h-[42px] border border-[#7d7d7d]">
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORY_OPTIONS.map((opt, idx) => (
                                    <SelectItem key={idx} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div> */}
                    <div>
                        <label className="text-[16px] font-[400] text-[#666]">Choose a Field</label>
                        <Select value={selected} onValueChange={(val) => { setSelected(val); if (val !== 'Custom...') setCustomTitle(''); }}>
                            <SelectTrigger className="mt-1 w-full h-[42px] border border-[#7d7d7d]">
                                <SelectValue placeholder="Select Field" />
                            </SelectTrigger>
                            <SelectContent>
                                {dropdownOptions.map((opt, idx) => (
                                    <SelectItem key={idx} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-[16px] font-[400] text-[#666]">Custom Title</label>
                        <Input
                            disabled={!isCustom}
                            placeholder="Enter title"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            className="mt-1 h-[42px] border border-[#7d7d7d]"
                        />
                    </div>
                    <div>
                        <label className="text-[16px] font-[400] text-[#666]">Square Footage</label>
                        <Input
                            type="number"
                            placeholder="Enter square footage"
                            value={squareFootage}
                            onChange={(e) => setSquareFootage(e.target.value)}
                            className="mt-1 h-[42px] border border-[#7d7d7d]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button 
                            className="w-full h-[44px] bg-white hover:bg-gray-50" 
                            variant="outline" 
                            style={{ color: roleColor, borderColor: roleColor }}
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            className="w-full text-white h-[44px] hover:opacity-90" 
                            style={{ backgroundColor: roleColor }}
                            disabled={!isValid} 
                            onClick={handleSubmit}
                        >
                            Add
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
