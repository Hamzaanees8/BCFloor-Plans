"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import WarningIcon from "@/components/Icons";
import { useAppContext } from "@/app/context/AppContext";
import { RecipientRole } from "@/app/dashboard/global-settings/templates";

export interface RecipientOption {
  role: RecipientRole;
  label: string;
  sublabel?: string;
  defaultChecked?: boolean;
}

interface ActionNotificationPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  options?: RecipientOption[];
  onProceed: (selectedRoles: RecipientRole[]) => void;
  onSkip?: () => void;
}

const DEFAULT_OPTIONS: RecipientOption[] = [
  {
    role: "agent",
    label: "Notify Agent of Changes",
    sublabel: "Edit Notification",
    defaultChecked: true,
  },
  {
    role: "vendor",
    label: "Notify Vendor of Changes",
    sublabel: "Edit Notification",
    defaultChecked: false,
  },
];

export default function ActionNotificationPrompt({
  open,
  onOpenChange,
  title = "SAVE AND EXIT",
  description = "Are you sure you want to save and exit? Select who should receive an email notification:",
  options = DEFAULT_OPTIONS,
  onProceed,
  onSkip,
}: ActionNotificationPromptProps) {
  const { userType } = useAppContext();
  const [selectedRoles, setSelectedRoles] = useState<RecipientRole[]>([]);

  useEffect(() => {
    if (open) {
      const initial = options
        .filter((opt) => opt.defaultChecked)
        .map((opt) => opt.role);
      setSelectedRoles(initial);
    }
  }, [open, options]);

  const handleToggle = (role: RecipientRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleClose = () => {
    onOpenChange(false);
    onSkip?.();
  };

  const handleConfirm = () => {
    if (selectedRoles.length > 0) {
      onProceed(selectedRoles);
    } else {
      onOpenChange(false);
      onSkip?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[320px] md:w-[565px] max-w-[565px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria [&>button]:hidden">
        <DialogHeader className="mb-2">
          <DialogTitle
            className={`flex items-center justify-between ${userType}-text text-[18px] font-[600] border-b-[1px] border-[#E4E4E4] pb-2`}
          >
            <span>{title}</span>
            <Button
              variant="ghost"
              className="p-0 h-auto hover:bg-transparent"
              onClick={handleClose}
              type="button"
            >
              <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-3">
          <div className="w-fit shrink-0">
            <WarningIcon width={48} fill="#DC9600" />
          </div>
          <DialogDescription className="text-[16px] font-[400] text-[#666666] leading-relaxed">
            {description}
          </DialogDescription>
        </div>

        <div className="mt-4 flex flex-wrap justify-between items-center gap-3 border-b-[1px] border-[#E4E4E4] pb-3">
          {options.map((opt) => {
            const checked = selectedRoles.includes(opt.role);
            return (
              <div
                key={opt.role}
                onClick={() => handleToggle(opt.role)}
                className="flex items-start gap-x-2.5 cursor-pointer select-none py-1"
              >
                <div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}} // handled by container onClick
                    className={`w-5 h-5 ${userType}-accent mt-1 cursor-pointer`}
                  />
                </div>
                <div className="flex flex-col gap-y-1">
                  <p className="text-[15px] font-[400] text-[#666666]">
                    {opt.label}
                  </p>
                  <p className={`text-[13px] font-[400] ${userType}-text`}>
                    {opt.sublabel || "Edit Notification"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex flex-col md:flex-row md:justify-end gap-[8px] mt-3 font-alexandria">
          <Button
            type="button"
            onClick={handleClose}
            className={`bg-white w-full md:w-[150px] h-[44px] text-[16px] font-[500] ${userType}-text ${userType}-border border border-[#DDDDDD] hover:bg-gray-50`}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className={`text-white ${userType}-bg hover:opacity-90 w-full md:w-[150px] h-[44px] font-[500] text-[16px] shadow-sm`}
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
