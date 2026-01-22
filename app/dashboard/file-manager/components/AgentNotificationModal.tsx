'use client';

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import WarningIcon from "@/components/Icons";
import { useAppContext } from "@/app/context/AppContext";
import ServiceReadyModal from "./ServiceReadyModal";
import { Services } from "../../services/page";
import { Order } from "../../orders/page";

interface AgentNotificationModalProps {
  open: boolean;
  onClose: () => void;
  serviceDate: Services | null
  orderData: Order | null
}

export default function AgentNotificationModal({ open, onClose, serviceDate, orderData }: AgentNotificationModalProps) {
  const { userType } = useAppContext();
  const [showEditor, setShowEditor] = useState(false);

  const handleConfirm = () => {
    onClose();
    setShowEditor(true);
  };
  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-[320px] md:w-[565px] max-w-[565px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria [&>button]:hidden">
          <DialogHeader className="mb-2">
            <DialogTitle
              className={`flex items-center justify-between ${userType}-text text-[18px] font-[600] border-b-[1px] border-[#E4E4E4] pb-2`}
            >
              SAVE AND EXIT
              <Button onClick={onClose} variant="ghost" className="border-none !shadow-none p-0 h-auto hover:bg-transparent">
                <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-start gap-3">
            <div className="w-fit">
              <WarningIcon width={48} fill="#DC9600" />
            </div>
            <DialogDescription className="text-[16px] font-[400] text-[#666666]">
              Are you sure you want to save and exit? This cannot be undone.
            </DialogDescription>
          </div>

          <DialogFooter className="flex flex-col md:flex-row md:justify-end gap-[5px] mt-2 font-alexandria">
            <Button
              onClick={onClose}
              className={`bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[400] ${userType}-text ${userType}-border text-[#0078D4] hover-${userType}-bg hover:opacity-95 ${userType}-button`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className={`${userType}-border hover:opacity-95 text-white ${userType}-bg hover-${userType}-bg w-full md:w-[200px] h-[44px] font-[400] text-[18px]`}
            >
              Edit Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showEditor && (
        <ServiceReadyModal
          open={showEditor}
          setOpen={setShowEditor}
          showAgentModal={true}
          setShowAgentModal={() => { }}
          showVendorModal={false}
          setShowVendorModal={() => { }}
          setAgentChecked={() => { }}
          setVendorChecked={() => { }}
          vendorSelected={false}
          bothSelected={false}
          serviceDate={serviceDate}
          orderData={orderData}
        />
      )}
    </>
  );
}
