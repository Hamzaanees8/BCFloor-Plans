"use client";
import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

export default function AddAreaPopup({
  open,
  setOpen,
  onAdd,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onAdd: (area: { area: string; type: string; charges: string; discount: string }) => void;
}) {
  const [customTitle, setCustomTitle] = useState("");
  const [type, setType] = useState("Finished Area");
  const [charges, setCharges] = useState("");
  const [discount, setDiscount] = useState("");

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!customTitle) return;
    onAdd({ area: customTitle, type, charges, discount });
    setCustomTitle("");
    setType("Finished Area");
    setCharges("");
    setDiscount("");
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="w-[320px] md:w-[445px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria overflow-y-auto">
        <div onClick={(e) => e.stopPropagation()} onChange={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center uppercase justify-between text-[#4290E9] text-[18px] font-[600]">
              Add an Area
              <AlertDialogCancel className="border-none !shadow-none">
                <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
              </AlertDialogCancel>
            </AlertDialogTitle>
          </AlertDialogHeader>

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
                className="h-[42px] text-[#666666] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
              />
            </div>

            {/* Type */}
            <div className="flex flex-col">
              <label className="text-[#424242]" htmlFor="areaType">
                Type
              </label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-[42px] text-[#666666] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Finished Area">Finished Area</SelectItem>
                  <SelectItem value="Sub Area">Sub Area</SelectItem>
                  <SelectItem value="Other Area">Other Area</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Charges */}
            <div className="flex flex-col">
              <label className="text-[#424242]" htmlFor="charges">
                Charges
              </label>
              <Input
                id="charges"
                value={charges}
                onChange={(e) => setCharges(e.target.value)}
                placeholder="Enter Charges e.g. $0.5 per sq. ft."
                className="h-[42px] text-[#666666] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
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
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="Enter Discount"
                className="h-[42px] text-[#666666] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]"
              />
            </div>
          </div>

          <hr className="w-full h-[1px] text-[#BBBBBB] mt-4" />

          {/* Footer Buttons */}
          <AlertDialogFooter className="flex flex-col md:flex-row md:justify-center gap-[5px] mt-2 font-alexandria">
            <AlertDialogCancel
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              className="bg-white w-full md:w-[176px] h-[44px] text-[20px] font-[400] border border-[#0078D4] text-[#0078D4] hover:bg-[#f1f8ff]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAdd}
              className="bg-[#4290E9] text-white hover:bg-[#005fb8] w-full md:w-[176px] h-[44px] font-[400] text-[20px]"
            >
              Add
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
