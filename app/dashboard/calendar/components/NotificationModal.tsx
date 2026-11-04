"use client";
import React from "react";
import RuntimeEmailEditorModal from "@/components/RuntimeEmailEditorModal";
import { RecipientRole } from "@/app/dashboard/global-settings/templates";
import type { Order } from "../../orders/page";
import type { VendorData as Vendor } from "@/components/QuickViewCard";
import { AgentData } from "../../agents/page";

type Service = { name?: string };

type Props = {
  open: boolean;
  setOpen: (value: boolean) => void;
  showAgentModal?: boolean;
  setShowAgentModal?: (value: boolean) => void;
  showVendorModal?: boolean;
  setShowVendorModal?: (value: boolean) => void;
  bothSelected: boolean;
  vendorSelected?: boolean;
  setAgentChecked?: (value: boolean) => void;
  setVendorChecked?: (value: boolean) => void;
  order?: Order;
  agent?: AgentData;
  vendor?: Vendor;
  service?: Service;
};

const NotificationModal: React.FC<Props> = ({
  open,
  setOpen,
  showVendorModal,
  bothSelected,
  setAgentChecked,
  setVendorChecked,
  order,
  agent,
  vendor,
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
      onClose={() => {
        setOpen(false);
        setAgentChecked?.(false);
        setVendorChecked?.(false);
      }}
      eventType="order_updated"
      eventLabel="Order Updated"
      queueRoles={queueRoles}
      orderUuid={order?.uuid}
      recipientEmails={{
        agent: agent?.email || order?.agent?.email || (order as any)?.user?.email,
        vendor: vendor?.email || (order as any)?.vendor?.email || (order?.services?.[0] as any)?.vendor?.email,
      }}
      recipientNames={{
        agent: agent?.first_name
          ? `${agent.first_name} ${agent.last_name || ""}`.trim()
          : order?.agent?.first_name
          ? `${order.agent.first_name} ${order.agent.last_name || ""}`.trim()
          : undefined,
        vendor: vendor?.full_name || vendor?.first_name || undefined,
      }}
      onComplete={() => {
        setAgentChecked?.(false);
        setVendorChecked?.(false);
        setOpen(false);
      }}
    />
  );
};

export default NotificationModal;
