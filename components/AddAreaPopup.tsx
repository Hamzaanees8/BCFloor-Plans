// components/AddAreaPopup.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, X } from "lucide-react";
import { useAppContext } from "@/app/context/AppContext";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

export interface AreaData {
  id?: number;
  uuid?: string;
  area: string;
  type: string;
  charge: number; // Changed to number
  discount: number; // Changed to number
  status: boolean; // Added
  is_percentage?: boolean; // Added
}

interface AddAreaPopupProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  onAdd: (area: Omit<AreaData, 'id' | 'uuid'>) => Promise<void> | void;
  onEdit?: (area: AreaData) => Promise<void> | void;
  editingArea?: AreaData | null;
  defaultType?: string;
}

export default function AddAreaPopup({
  open,
  setOpen,
  onAdd,
  onEdit,
  editingArea,
  defaultType = "Finished Area"
}: AddAreaPopupProps) {
  const { userType } = useAppContext();
  const [customTitle, setCustomTitle] = useState("");
  const [type, setType] = useState(defaultType);
  const [charge, setCharge] = useState<number | "">("");
  const [discount, setDiscount] = useState<number | "">("");
  const [status, setStatus] = useState<boolean>(true);
  const [isPercentage, setIsPercentage] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when popup opens/closes or editingArea changes
  useEffect(() => {
    if (open) {
      if (editingArea) {
        // Edit mode - populate with existing data
        setCustomTitle(editingArea.area);
        setType(editingArea.type);
        setCharge(editingArea.charge);
        setDiscount(editingArea.discount);
        setStatus(editingArea.status);
        setIsPercentage(editingArea.is_percentage || false);
      } else {
        // Add mode - reset form
        setCustomTitle("");
        setType(defaultType);
        setCharge("");
        setDiscount("");
        setStatus(true);
        setIsPercentage(false);
      }
    }
  }, [open, editingArea, defaultType]);

  const handleSubmit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!customTitle || charge === "" || discount === "") return;

    const areaData: AreaData = {
      ...(editingArea?.uuid && { uuid: editingArea.uuid }),
      ...(editingArea?.id && { id: editingArea.id }),
      area: customTitle,
      type,
      charge: Number(charge),
      discount: Number(discount),
      status,
      is_percentage: isPercentage
    };

    try {
      setIsLoading(true);
      if (editingArea && onEdit) {
        await onEdit(areaData);
      } else {
        await onAdd(areaData);
      }
      setOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const isEditMode = !!editingArea;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[320px] md:w-[445px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto [&>button]:hidden">
        <div onClick={(e) => e.stopPropagation()} onChange={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center uppercase justify-between text-[#424242] text-[18px] font-[600]">
              {isEditMode ? "Edit Area" : "Add an Area"}
              <Button className="border-none !shadow-none bg-transparent hover:bg-transparent" onClick={handleClose}>
                <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-y-4 mt-4">
            <hr className="w-full h-[1px] text-[#BBBBBB]" />

            {/* Custom Title */}
            <div className="flex flex-col">
              <label className="text-[#424242]" htmlFor="customTitle">
                Custom Title
              </label>
              <Input
                id="customTitle"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Enter Title"
                className="h-[42px] text-[#666666] border-[1px] border-[#BBBBBB] mt-[12px]"
                style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
              />
            </div>

            {/* Type */}
            <div className="flex flex-col">
              <label className="text-[#424242]" htmlFor="areaType">
                Type
              </label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger
                  className="h-[42px] text-[#666666] border-[1px] border-[#BBBBBB] mt-[12px]"
                  style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                >
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Finished Area">Finished Area</SelectItem>
                  <SelectItem value="Sub Area">Sub Area</SelectItem>
                  <SelectItem value="Other Area">Other Area</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Charge */}
            <div className="flex flex-col">
              <label className="text-[#424242]" htmlFor="charge">
                Charge
              </label>
              <Input
                id="charge"
                value={charge}
                type="number"
                onChange={(e) => setCharge(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Enter Charge e.g. $0.5 per sq. ft."
                className="h-[42px] text-[#666666] border-[1px] border-[#BBBBBB] mt-[12px]"
                style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
              />
            </div>

            {/* Discount */}
            <div className="flex flex-col">
              <label className="text-[#424242]" htmlFor="discount">
                Discount
              </label>
              <Input
                id="discount"
                value={discount}
                type="number"
                onChange={(e) => setDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Enter Discount"
                className="h-[42px] text-[#666666] border-[1px] border-[#BBBBBB] mt-[12px]"
                style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
              />
            </div>

            {/* Status */}
            <div className="flex gap-4 items-center">
              <label className="text-[#424242]">Status</label>
              <div className="flex items-center space-x-4">
                <Switch
                  checked={status}
                  onCheckedChange={setStatus}
                  className="data-[state=checked]:bg-[#6BAE41] data-[state=unchecked]:bg-[#E06D5E]"
                />
              </div>
            </div>

            {/* Is Percentage */}
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="isPercentage"
                checked={isPercentage}
                onChange={(e) => setIsPercentage(e.target.checked)}
                className="h-4 w-4 text-[#4290E9] border-gray-300 rounded mr-2"
              />
              <label htmlFor="isPercentage" className="text-[#424242]">
                Discount is percentage
              </label>
            </div>
          </div>

          <hr className="w-full h-[1px] text-[#BBBBBB] mt-4" />

          {/* Footer Buttons */}
          <DialogFooter className="flex flex-col md:flex-row md:justify-center gap-[5px] mt-2 font-alexandria">
            <Button
              onClick={handleClose}
              className="bg-white w-full md:w-[176px] h-[44px] text-[20px] font-[400] border border-[#BBBBBB] text-[#424242] hover:bg-[#f9f9f9]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!customTitle || charge === "" || discount === "" || isLoading}
              className="bg-[#424242] text-white hover:bg-[#333333] w-full md:w-[176px] h-[44px] font-[400] text-[20px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (isEditMode ? "Update" : "Add")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}