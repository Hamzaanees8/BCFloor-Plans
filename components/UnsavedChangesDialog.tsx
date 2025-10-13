"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";
import { useAppContext } from "@/app/context/AppContext";

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
  const { userType } = useAppContext()

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v && onCancel) onCancel();
      }}
    >
      <AlertDialogContent className="w-[320px] md:w-[560px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria">
        {/* Header */}
        <AlertDialogHeader className="mb-2">
          <AlertDialogTitle className={`${userType}-text flex items-center justify-between text-[18px] font-[600] border-b-[1px] border-[#E4E4E4] pb-2`}>
            {title}
            {/* Close button */}
            <AlertDialogCancel className="border-none !shadow-none">
              <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
            </AlertDialogCancel>
          </AlertDialogTitle>
        </AlertDialogHeader>

        {/* Body */}
        <div className="flex items-start gap-3">
          <AlertDialogDescription className="text-[14px] font-[400] text-[#666666]">
            {description}
          </AlertDialogDescription>
        </div>

        {/* Footer */}
        <AlertDialogFooter className="flex flex-col md:flex-row md:justify-end gap-[5px] mt-4">
          <AlertDialogCancel
            onClick={() => {
              setOpen(false);
              if (onCancel) onCancel();
            }}
            className={`bg-white w-full md:w-[170px] h-[44px] text-[16px] font-[400] ${userType}-text border ${userType}-border hover-${userType}-bg  ${userType}-button`}
          >
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            className={`${userType}-bg hover:opacity-90 text-white w-full md:w-[170px] h-[44px] font-[400] text-[16px] hover-${userType}-bg  ${userType}-button`}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            Leave Page
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
