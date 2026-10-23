"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { useAppContext } from "@/app/context/AppContext";

interface MediaReleaseNoticeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string | number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function MediaReleaseNoticeModal({
  open,
  onOpenChange,
  orderId,
  onRefresh,
  isRefreshing = false,
}: MediaReleaseNoticeModalProps) {
  const { appliedSettings } = useWhiteLabel();
  const { userType } = useAppContext();
  const role = (userType as string)?.toLowerCase() || "admin";
  const roleSettings =
    appliedSettings[role as keyof typeof appliedSettings] ||
    appliedSettings["admin"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[420px] w-[90vw] font-alexandria p-0 overflow-hidden rounded-[12px] border border-[#BBBBBB] shadow-xl"
        style={{
          backgroundColor: roleSettings?.pageBg || "#FFFFFF",
          color: roleSettings?.pageText || "#1F2937",
        }}
      >
        {/* Compact Header */}
        <DialogHeader className="px-5 py-3 border-b border-[#E5E7EB] bg-emerald-50/60">
          <DialogTitle className="text-[15px] md:text-[16px] font-bold flex items-center gap-2 text-emerald-800 tracking-tight">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Media Released Successfully</span>
          </DialogTitle>
        </DialogHeader>

        {/* Brief Body */}
        <div className="px-5 py-3.5 space-y-2.5 text-[13px] text-gray-700">
          <p className="text-gray-800">
            Media is now unlocked and accessible to the agent{orderId ? ` for Order #${orderId}` : ""}.
          </p>

          <div className="p-2.5 bg-amber-50/90 rounded-lg border border-amber-200 text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[12.5px] text-amber-950">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Watermark Removal in Progress</span>
            </div>
            <p className="text-[12px] text-amber-800 leading-relaxed">
              Background servers are reprocessing photos to remove watermarks. This typically takes <strong>a couple of minutes</strong>. Previews will update once completed.
            </p>
          </div>
        </div>

        {/* Compact Footer */}
        <DialogFooter className="px-5 py-2.5 border-t border-gray-100 bg-gray-50 flex flex-row items-center justify-between sm:justify-between gap-2">
          {onRefresh ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-[32px] px-3 text-[12px] font-medium border-gray-300 hover:bg-white flex items-center gap-1.5 text-gray-700"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Refreshing..." : "Refresh Media"}</span>
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-[32px] px-4 text-[12px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-[6px]"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
