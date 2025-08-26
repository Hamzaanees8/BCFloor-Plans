'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

interface AddExtraDialogProps {
    open: boolean;
    onOpenChange: (val: boolean) => void;
    onAddExtra: (label: string, squareFootage: number, customLabel?: string) => void;
}


const OPTIONS = [
    "Custom", "Mechanical", "Storage", "Deck", "Patio", "Print Media",
    "Porch", "Staging", "Upper Deck", "Packages", "Balcony",
    "Other...", "Crawl Space"
];

export default function AddExtraDialog({ open, onOpenChange, onAddExtra }: AddExtraDialogProps) {
    const [selected, setSelected] = useState("");
    const [customTitle, setCustomTitle] = useState("");
    const [squareFootage, setSquareFootage] = useState("");

    const isCustom = selected === "Custom";
    const isValid = selected && (!isCustom || customTitle.trim() !== "");

    const handleSubmit = () => {
        if (!isValid) return;
        const finalLabel = isCustom ? customTitle : selected;
        const customKey = isCustom ? customTitle : undefined;
        onAddExtra(finalLabel, Number(squareFootage), customKey);


        setSelected("");
        setCustomTitle("");
        setSquareFootage("");
        onOpenChange(false);
    };

    useEffect(() => {
        setSelected("");
        setCustomTitle("");
        setSquareFootage("");

    }, []);
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[320px] md:w-[470px] font-alexandria">
                <DialogHeader>
                    <DialogTitle className="text-[18px] text-[#4290E9] font-bold">ADD A CUSTOM LEVEL</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label className="text-[16px] font-[400] text-[#666]">Choose a Field</label>
                        <Select onValueChange={setSelected}>
                            <SelectTrigger className="mt-1 w-full h-[42px] border border-[#7d7d7d]">
                                <SelectValue placeholder="Select Field" />
                            </SelectTrigger>
                            <SelectContent>
                                {OPTIONS.map((opt, idx) => (
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
                        <Button className="w-full text-[#4290E9] border-[#4290E9] hover:bg-[#4290E9] hover:text-[#fff] h-[44px]" variant="outline" onClick={() => onOpenChange(false)

                        }>Cancel</Button>
                        <Button className="w-full bg-[#4290E9] hover:bg-[#4999f4] text-white h-[44px]" disabled={!isValid} onClick={handleSubmit}>Add</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
