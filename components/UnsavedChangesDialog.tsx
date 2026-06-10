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
import { Loader2 } from "lucide-react";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onSave?: () => Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
};

export default function UnsavedChangesDialog({
  open,
  setOpen,
  title = "Unsaved Changes",
  description = "You have unsaved changes. Are you sure you want to leave this page?",
  onConfirm,
  onSave,
  confirmLabel,
  cancelLabel,
}: Props) {
  const { userType } = useAppContext();
  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string) || 'admin';
  const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave();
      onConfirm(); // Proceed with navigation after successful save
    } catch (err) {
      console.error("Failed to save changes from dialog:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (isSaving) return; // Prevent closing while saving
        setOpen(v);
      }}
    >
      <DialogContent
        className="w-[320px] md:max-w-[600px] md:w-[600px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria border-none [&>button]:hidden"
        style={{ backgroundColor: roleSettings.pageBg }}
      >
        {/* Header */}
        <DialogHeader className="mb-2">
          <DialogTitle
            className="flex items-center justify-between text-[18px] font-[600] border-b-[1px] border-[#E4E4E4] pb-2"
            style={{ color: roleSettings.pageTabColor }}
          >
            {title}
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


          {onSave && (
            <Button
              disabled={isSaving}
              className="text-white w-full md:w-[170px] h-[44px] font-[400] text-[16px] hover:brightness-110 border-none transition-all"
              style={{ backgroundColor: roleSettings.pageTabColor }}
              onClick={handleSave}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          )}

          <Button
            disabled={isSaving}
            className={`w-full md:w-[170px] h-[44px] font-[400] text-[16px] border-none transition-all hover:brightness-110 ${onSave ? 'bg-red-500 text-white' : ''}`}
            style={!onSave ? { backgroundColor: roleSettings.pageTabColor, color: '#ffffff' } : { backgroundColor: '#ef4444', color: '#ffffff' }}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            {confirmLabel || "Leave Page"}
          </Button>

          <Button
            disabled={isSaving}
            variant="outline"
            className="w-full md:w-[170px] h-[44px] font-[400] text-[16px] transition-all"
            style={{
              border: `1px solid ${roleSettings.pageTabColor}`,
              color: roleSettings.pageTabColor,
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = roleSettings.pageTabColor;
              (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = roleSettings.pageTabColor;
            }}
            onClick={() => setOpen(false)}
          >
            {cancelLabel || "Stay on Page"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
