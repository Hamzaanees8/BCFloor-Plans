'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface AddLevelDialogProps {
    open: boolean;
    onOpenChange: (val: boolean) => void;
    onAddLevel: (label: string, squareFootage: number) => void;
}

export default function AddLevelDialog({ open, onOpenChange, onAddLevel }: AddLevelDialogProps) {
    const [selectedLevel, setSelectedLevel] = useState<string>("");
    const [squareFootage, setSquareFootage] = useState<string>("");

    const isValid = selectedLevel;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[320px] md:w-[470px] font-alexandria">
                <DialogHeader>
                    <DialogTitle className=" text-[18px] text-[#4290E9] font-[600]">ADD A LEVEL</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 border-t-[1px]  border-[#7d7d7d] pt-4">
                    <div>
                        <label className="text-[16px] font-medium text-[#666666]">Choose Level</label>
                        <Select onValueChange={setSelectedLevel}>
                            <SelectTrigger className="mt-1 w-full h-[42px] border border-[#7d7d7d]">
                                <SelectValue placeholder="Select Level" />
                            </SelectTrigger>
                            <SelectContent>
                                {["1st Level", "2nd Level", "3rd Level", "4th Level"].map((level, idx) => (
                                    <SelectItem key={idx} value={level}>
                                        {level}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="border-b-[1px]  border-[#7d7d7d] pb-4">
                        <label className="text-[16px] font-medium text-[#666666]">Square Footage</label>
                        <Input
                            type="number"
                            placeholder="Enter square footage"
                            value={squareFootage}
                            onChange={(e) => setSquareFootage(e.target.value)}
                            min={1}
                            className="mt-1 h-[42px] border border-[#7d7d7d] outline-none focus:border-none focus:ring-0"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button className="w-full text-[#4290E9] border-[#4290E9] h-[44px]" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button
                            className="w-full bg-[#4290E9] text-white h-[44px]"
                            disabled={!isValid}
                            onClick={() => {
                                if (isValid) {
                                    onAddLevel(selectedLevel, Number(squareFootage));
                                    onOpenChange(false);
                                    setSelectedLevel("");
                                    setSquareFootage("");
                                }
                            }}
                        >
                            Add
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
