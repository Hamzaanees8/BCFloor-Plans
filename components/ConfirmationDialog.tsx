// components/ConfirmationDialog.tsx
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

import { X } from "lucide-react";
import WarningIcon from "./Icons";
import { useAppContext } from "@/app/context/AppContext";
import { Button } from "./ui/button";

type Props = {
  open: boolean;
  setOpen: (value: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  showAgain?: boolean;
  toggleShowAgain?: () => void;
  dialogType?:
    | "delete"
    | "merge"
    | "payment"
    | "agent_change"
    | "file_upload_cancel"
    | "deselect"
    | "address_change";
  title?: string;
  description?: string;
  hideShowAgain?: boolean;
  confirmText?: string;
  cancelText?: string;
  secondaryAction?: {
    label: string;
    onClick: () => void;
    className?: string;
  };
};

const getStorageKey = (
  type:
    | "delete"
    | "merge"
    | "payment"
    | "agent_change"
    | "file_upload_cancel"
    | "deselect"
    | "address_change" = "delete",
) => {
  switch (type) {
    case "merge":
      return "confirmation_dialog_merge_show_again";
    case "payment":
      return "confirmation_dialog_payment_show_again";
    case "agent_change":
      return "confirmation_dialog_agent_change_show_again";
    case "file_upload_cancel":
      return "confirmation_dialog_file_upload_cancel_show_again";
    case "deselect":
      return "confirmation_dialog_deselect_show_again";
    case "address_change":
      return "confirmation_dialog_address_change_show_again";
    default:
      return "confirmation_dialog_delete_show_again";
  }
};

const ConfirmationDialog: React.FC<Props> = ({
  open,
  setOpen,
  onConfirm,
  onCancel,
  showAgain = true,
  toggleShowAgain,
  dialogType = "delete",
  title,
  description,
  hideShowAgain = false,
  confirmText,
  cancelText,
  secondaryAction,
}) => {
  const { userType } = useAppContext();

  const handleCheckboxChange = () => {
    if (!toggleShowAgain) return;
    const newValue = !showAgain;
    toggleShowAgain();

    localStorage.setItem(getStorageKey(dialogType), JSON.stringify(newValue));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        overlayClassName="z-[240]"
        className={`w-[320px] ${secondaryAction ? "md:w-[620px]" : "md:w-[593px]"} rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria [&>button]:hidden z-[250]`}
      >
        <DialogHeader className="mb-2">
          <DialogTitle
            className={`flex items-center justify-between ${userType}-text text-[18px] font-[600] border-b-[1px] border-[#E4E4E4] pb-2`}
          >
            {title || "CONFIRMATION"}
            <DialogClose className="border-none !shadow-none">
              <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
            </DialogClose>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-3">
          <div className="w-fit">
            <WarningIcon width={48} />
          </div>
          <DialogDescription className="text-[14px] font-[400] text-[#666666]">
            {description
              ? description
              : dialogType === "payment"
                ? "Are you sure you want to proceed with this payment? This action cannot be undone."
                : "Are you sure you want to take this action? This cannot be undone and you will have to re-enter the information."}
          </DialogDescription>
        </div>

        {!hideShowAgain && toggleShowAgain && (
          <div className="mt-4 flex items-center gap-2 border-b-[1px] border-[#E4E4E4] pb-2">
            <input
              type="checkbox"
              id="no-show"
              checked={!showAgain}
              onChange={handleCheckboxChange}
              className="accent-[#0078D4]"
            />
            <label
              htmlFor="no-show"
              className="text-[14px] font-[400] text-[#666666]"
            >
              Do not show again.
            </label>
          </div>
        )}

        <DialogFooter className="flex flex-col md:flex-row md:justify-end gap-[10px] mt-2 font-alexandria">
          <DialogClose
            className={`bg-white rounded-[8px] ${secondaryAction ? "w-full md:w-auto md:min-w-[110px] px-5 text-[15px] md:text-[16px]" : "w-full md:w-[170px] text-[20px]"} h-[44px] font-[400] ${userType}-text border ${userType}-border text-[#0078D4] hover-${userType}-bg ${userType}-button transition-colors cursor-pointer`}
            onClick={() => {
              if (onCancel) onCancel();
            }}
          >
            {cancelText || "Cancel"}
          </DialogClose>
          {secondaryAction && (
            <Button
              type="button"
              className={
                secondaryAction.className ||
                "bg-[#0078D4] hover:bg-[#0060AA] text-white rounded-[8px] w-full md:w-auto md:min-w-[170px] px-6 h-[44px] text-[15px] md:text-[16px] font-[500] shadow-xs transition-colors cursor-pointer"
              }
              onClick={() => {
                secondaryAction.onClick();
                setOpen(false);
              }}
              title="Keep current template content and update event type only"
            >
              {secondaryAction.label}
            </Button>
          )}
          <Button
            className={`${userType}-bg hover:opacity-90 text-white hover-${userType}-bg ${secondaryAction ? "w-full md:w-auto md:min-w-[140px] px-6 text-[15px] md:text-[16px]" : "w-full md:w-[170px] text-[20px]"} h-[44px] font-[400] transition-colors cursor-pointer`}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
            title={
              secondaryAction
                ? "Change event type and load default template content"
                : undefined
            }
          >
            {confirmText || "OK"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationDialog;
