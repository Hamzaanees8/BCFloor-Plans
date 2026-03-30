'use client';

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Printer, Loader2 } from "lucide-react";
import { useAppContext } from "@/app/context/AppContext";
import { featureSheetService } from "../file-manager";
import { toast } from "sonner";

interface PrintRequestModalProps {
  open: boolean;
  onClose: () => void;
  featureSheetUuid: string | null;
}

export default function PrintRequestModal({ open, onClose, featureSheetUuid }: PrintRequestModalProps) {
  const { userType } = useAppContext();
  const [copies, setCopies] = useState<number>(25);
  const [withBleed, setWithBleed] = useState<boolean>(false);
  const [additionalInfo, setAdditionalInfo] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!featureSheetUuid) {
      toast.error("Invalid feature sheet. Please save first.");
      return;
    }

    setIsSubmitting(true);
    try {
      await featureSheetService.requestPrint(featureSheetUuid, {
        copies,
        with_bleed: withBleed,
        additional_info: additionalInfo,
      });
      toast.success("Print request sent successfully!");
      onClose();
    } catch (error) {
      console.error("Print request failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send print request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[320px] md:w-[500px] max-w-[500px] rounded-[8px] p-4 md:p-6 gap-[20px] font-alexandria [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className={`flex items-center justify-between ${userType}-text text-[20px] font-[600] border-b-[1px] border-[#E4E4E4] pb-2`}>
            <div className="flex items-center gap-2 uppercase">
              <Printer className="w-5 h-5" />
              Request Print
            </div>
            <Button onClick={onClose} variant="ghost" className="border-none !shadow-none p-0 h-auto hover:bg-transparent">
              <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="copies" className="text-[14px] font-[500] text-[#666666]">Number of Copies</Label>
            <Input
              id="copies"
              type="number"
              value={copies}
              onChange={(e) => setCopies(parseInt(e.target.value) || 0)}
              className="h-[44px] border-[#BBBBBB] focus:ring-0 focus:border-[#4290E9]"
              min={1}
            />
          </div>

          <div className="flex items-center space-x-3 py-2">
            <Checkbox 
              id="bleed" 
              checked={withBleed} 
              onCheckedChange={(checked) => setWithBleed(!!checked)}
              className={`${userType}-border data-[state=checked]:${userType}-bg`}
            />
            <Label htmlFor="bleed" className="text-[14px] font-[500] text-[#666666] cursor-pointer">
              With Bleed (Full bleed for professional printing)
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-[14px] font-[500] text-[#666666]">Additional Information / Special Instructions</Label>
            <Textarea
              id="notes"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="e.g., specific paper quality, delivery instructions..."
              className="min-h-[100px] border-[#BBBBBB] focus:ring-0 focus:border-[#4290E9] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col md:flex-row md:justify-end gap-[10px] mt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className={`bg-white w-full md:w-[120px] h-[44px] text-[16px] font-[500] ${userType}-text ${userType}-border hover:bg-gray-50`}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || copies < 1}
            className={`${userType}-bg hover:opacity-90 text-white w-full md:w-[180px] h-[44px] font-[500] text-[16px]`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
