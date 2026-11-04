"use client";
import React from "react";
import RuntimeEmailEditorModal from "@/components/RuntimeEmailEditorModal";
import { RecipientRole } from "@/app/dashboard/global-settings/templates";
import { Services } from "../../services/page";
import { Order } from "../../orders/page";

type Props = {
  open: boolean;
  setOpen: (value: boolean) => void;
  showAgentModal?: boolean;
  setShowAgentModal?: (value: boolean) => void;
  showVendorModal?: boolean;
  setShowVendorModal?: (value: boolean) => void;
  bothSelected?: boolean;
  vendorSelected?: boolean;
  setAgentChecked?: (value: boolean) => void;
  setVendorChecked?: (value: boolean) => void;
  serviceDate: Services | null;
  orderData: Order | null;
};

const ServiceReadyModal: React.FC<Props> = ({
  open,
  setOpen,
  showVendorModal,
  bothSelected,
  serviceDate,
  orderData,
}) => {
  const queueRoles: RecipientRole[] = React.useMemo(() => {
    if (bothSelected) return ["agent", "vendor"];
    if (showVendorModal) return ["vendor"];
    return ["agent"];
  }, [bothSelected, showVendorModal]);

  if (!open) return null;

  return (
    <RuntimeEmailEditorModal
      open={open}
      onClose={() => setOpen(false)}
      eventType="service_completed"
      eventLabel="Service Completed"
      queueRoles={queueRoles}
      orderUuid={orderData?.uuid}
      serviceUuid={serviceDate?.uuid}
      recipientEmails={{
        agent: orderData?.agent?.email || (orderData as any)?.user?.email,
        vendor: (orderData as any)?.vendor?.email || (orderData as any)?.services?.[0]?.vendor?.email,
      }}
      recipientNames={{
        agent: orderData?.agent?.first_name
          ? `${orderData.agent.first_name} ${orderData.agent.last_name || ""}`.trim()
          : undefined,
        vendor: (orderData as any)?.vendor?.full_name || (orderData as any)?.services?.[0]?.vendor?.full_name || undefined,
      }}
      onComplete={() => {
        setOpen(false);
      }}
    />
  );
};

export default ServiceReadyModal;
