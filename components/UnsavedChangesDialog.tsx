"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel?: () => void;
};

export default function UnsavedChangesDialog({
  open,
  setOpen,
  title = "Unsaved Changes",
  description = "You have unsaved changes. Are you sure you want to leave this page?",
  onConfirm,
  onCancel,
}: Props) {
  const { userType } = useAppContext();
  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string) || 'admin';
  const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v && onCancel) onCancel();
      }}
    >
      <DialogContent
        className="w-[320px] md:w-[560px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria border-none [&>button]:hidden"
        style={{ backgroundColor: roleSettings.pageBg }}
      >
        {/* Header */}
        <DialogHeader className="mb-2">
          <DialogTitle
            className="flex items-center justify-between text-[18px] font-[600] border-b-[1px] border-[#E4E4E4] pb-2"
            style={{ color: roleSettings.pageTabColor }}
          >
            {title}
            {/* Close button */}
            <Button
              variant="ghost"
              className="border-none !shadow-none bg-transparent hover:bg-transparent p-0 h-auto"
              onClick={() => {
                setOpen(false)
                if (onCancel) onCancel()
              }}
            >
              <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="flex items-start gap-3">
          <DialogDescription
            className="text-[14px] font-[400]"
            style={{ color: roleSettings.pageText }}
          >
            {description}
          </DialogDescription>
        </div>

        {/* Footer */}
        <DialogFooter className="flex flex-col md:flex-row md:justify-end gap-[10px] mt-4">
          <Button
            onClick={() => {
              setOpen(false);
              if (onCancel) onCancel();
            }}
            className="bg-transparent w-full md:w-[170px] h-[44px] text-[16px] font-[400] border hover:brightness-95 transition-all"
            style={{ color: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
          >
            Cancel
          </Button>

          <Button
            className="text-white w-full md:w-[170px] h-[44px] font-[400] text-[16px] hover:brightness-110 border-none transition-all"
            style={{ backgroundColor: roleSettings.pageTabColor }}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            Leave Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
