"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  getServiceCombinedStatus,
  isPaidOrSucceeded,
} from "@/app/dashboard/billing/billing";

interface ServicePriceBadgeProps {
  splitInvoices: any[];
  singleAmount: number;
  gstRate?: number;
  paymentStatus?: string;
  orderPaymentStatus?: string;
  userType: string;
  currentUserUuid?: string;
  isCoAgentUser?: boolean;
  onOpenInvoice?: () => void;
  paymentSuccess?: boolean;
  quantityLabel?: string;
}

const ServicePriceBadge: React.FC<ServicePriceBadgeProps> = ({
  splitInvoices,
  singleAmount,
  gstRate = 0,
  paymentStatus,
  orderPaymentStatus,
  userType,
  currentUserUuid,
  isCoAgentUser,
  onOpenInvoice,
  paymentSuccess,
  quantityLabel,
}) => {
  const isSplit = splitInvoices.length > 1;

  const combinedStatus: "paid" | "partially_paid" | "unpaid" | "refunded" =
    (() => {
      if (paymentStatus === "REFUNDED" || orderPaymentStatus === "REFUNDED")
        return "refunded";
      if (isSplit) {
        return getServiceCombinedStatus(splitInvoices);
      }
      if (paymentSuccess || paymentStatus === "PAID" || orderPaymentStatus === "PAID")
        return "paid";
      return "unpaid";
    })();

  const userOwnInvoice = isSplit
    ? isCoAgentUser
      ? splitInvoices.find(
          (inv) =>
            inv.agent_type === "co-agent" ||
            inv.agent?.uuid === currentUserUuid ||
            inv.agent_uuid === currentUserUuid,
        )
      : splitInvoices.find(
          (inv) =>
            inv.agent_type === "primary" ||
            inv.agent?.uuid === currentUserUuid ||
            inv.agent_uuid === currentUserUuid,
        )
    : null;

  const userOwnPaid =
    !!userOwnInvoice && isPaidOrSucceeded(userOwnInvoice.status);

  const renderPrice = () => {
    if (isSplit && userType === "admin") {
      const parts = splitInvoices.map((inv) => ({
        base: parseFloat(inv.subtotal || inv.total || "0"),
        label: inv.agent_type === "co-agent" ? "Co" : "Main",
      }));
      const total = parts.reduce((s, p) => s + p.base, 0);
      return (
        <div className="text-right">
          <p className="text-[12px] md:text-[15px] font-semibold leading-tight">
            {parts.map((p, idx) => (
              <span key={idx}>
                {idx > 0 && (
                  <span className="mx-0.5 text-gray-400 font-light">+</span>
                )}
                <span
                  className={
                    combinedStatus === "refunded"
                      ? "text-[#D0021B]"
                      : combinedStatus === "paid"
                        ? "text-[#6BAE41]"
                        : combinedStatus === "partially_paid"
                          ? "text-[#DC9600]"
                          : "text-[#E06D5E]"
                  }
                >
                  ${p.base.toFixed(2)}
                </span>
                <span className="text-[8px] text-gray-400 ml-0.5">({p.label})</span>
              </span>
            ))}
          </p>
          <p className="text-[#7D7D7D] text-[9px] md:text-[10px] leading-none mt-0.5">
            Total: ${total.toFixed(2)}
            {gstRate > 0 && ` incl. $${(total * gstRate).toFixed(2)} GST`}
          </p>
        </div>
      );
    }

    const displayAmt =
      isSplit && userOwnInvoice
        ? parseFloat(userOwnInvoice.subtotal || userOwnInvoice.total || "0")
        : singleAmount;
    const withGst = displayAmt + (gstRate ? displayAmt * gstRate : 0);
    const textColor =
      combinedStatus === "refunded"
        ? "text-[#D0021B]"
        : combinedStatus === "paid" ||
            (combinedStatus === "partially_paid" && userOwnPaid)
          ? "text-[#6BAE41]"
          : "text-[#E06D5E]";

    return (
      <div>
        <p className={`text-[13px] md:text-[18px] ${textColor} leading-none mb-1`}>
          ${withGst.toFixed(2)}
        </p>
        <p className="text-[#7D7D7D] text-[9px] md:text-[10px] leading-none">
          {gstRate > 0
            ? `incl. $${(displayAmt * gstRate).toFixed(2)} GST`
            : quantityLabel || ""}
        </p>
      </div>
    );
  };

  const renderBadge = () => {
    const btnBase =
      "h-[24px] w-[60px] text-[10px] md:h-[32px] md:w-[100px] md:text-[14px] flex justify-center items-center cursor-pointer px-1 md:px-4 text-white rounded-md font-bold";

    if (combinedStatus === "refunded") {
      return (
        <Button onClick={onOpenInvoice} className={`${btnBase} bg-[#D0021B] hover:bg-[#b00217]`}>
          {userType === "admin" ? "REFUNDED" : "Refunded"}
        </Button>
      );
    }

    if (combinedStatus === "partially_paid") {
      return (
        <div className="flex flex-col items-end gap-0.5">
          <Button onClick={onOpenInvoice} className={`${btnBase} bg-[#DC9600] hover:bg-[#b87d00]`}>
            PARTIAL
          </Button>
          {userOwnPaid && userType !== "admin" && (
            <span className="text-[8px] text-[#6BAE41] font-semibold whitespace-nowrap">
              ✓ You paid your part
            </span>
          )}
        </div>
      );
    }

    if (combinedStatus === "paid") {
      return (
        <Button onClick={onOpenInvoice} className={`${btnBase} bg-[#6BAE41] hover:bg-[#5fa43a]`}>
          {userType === "admin" ? "PAID" : "Paid"}
        </Button>
      );
    }

    return (
      <Button onClick={onOpenInvoice} className={`${btnBase} bg-[#DC9600] hover:bg-[#eda304]`}>
        {userType === "admin" ? "UNPAID" : "UnPaid"}
      </Button>
    );
  };

  return (
    <div className="flex items-center gap-[5px] md:gap-[10px] md:mr-2">
      <div className="flex flex-col justify-center items-end mr-1 md:mr-2 text-right">
        {renderPrice()}
      </div>
      <div className="flex flex-col items-end">{renderBadge()}</div>
    </div>
  );
};

export default ServicePriceBadge;
