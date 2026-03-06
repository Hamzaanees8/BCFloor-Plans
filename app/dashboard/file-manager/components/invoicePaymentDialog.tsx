// components/InvoicePaymentDialog.tsx
"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createPayment } from "../file-manager";
import { Order } from "../../orders/page";
import ManualPayment from "./ManualPayment";

interface CurrentServiceType {
  name: string | undefined;
  amount: number | undefined;
  uuid: string | undefined;
}

interface InvoicePaymentDialogProps {
  open: boolean;
  onClose: () => void;
  orderData: Order | null;
  currentService?: CurrentServiceType | null;
  activeTab: string;
  userType: string;
  url: string
}

const InvoicePaymentDialog: React.FC<InvoicePaymentDialogProps> = ({
  open,
  onClose,
  orderData,
  currentService,
  activeTab,
  userType,
  url
}) => {
  const [paymentType, setPaymentType] = useState<"full" | "service" | "manual">("full");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualPaymentDialog, setShowManualPaymentDialog] = useState(false);

  // Safely calculate amounts - ensure they are numbers
  const fullAmount = Number(orderData?.amount) || 0;

  // Handle different service data structures
  const serviceAmount = React.useMemo(() => {
    if (!currentService) return 0;

    // If it's a Service object
    if ("amount" in currentService && currentService.amount !== undefined) {
      return currentService.amount;
    }
    return 0;
  }, [currentService]);

  // Get service name safely
  const serviceName = React.useMemo(() => {
    if (!currentService) return "Selected Service";

    // If it's a Service object
    if ("name" in currentService) {
      return currentService.name;
    }

    // If it's an OrderService object with service property
  }, [currentService]);

  // Get service UUID safely
  const serviceUuid = React.useMemo(() => {
    if (!currentService) return undefined;

    // If it's a Service object
    if ("uuid" in currentService) {
      return currentService.uuid;
    }

    return undefined;
  }, [currentService]);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login first");
        return;
      }

      let amount = 0;
      let serviceId = undefined;
      let paymentTypeParam: "full" | "service" = "full";
      let serviceNameParam = "";

      // Use the state variable 'paymentType'
      if (paymentType === "manual") {
        setIsProcessing(false);
        setShowManualPaymentDialog(true);
        return;
      } else if (paymentType === "full") {
        amount = fullAmount;
        paymentTypeParam = "full";
      } else {
        amount = serviceAmount;
        paymentTypeParam = "service";
        serviceId = serviceUuid;
        serviceNameParam = currentService?.name || "";
      }

      // Check if amount is valid
      if (amount <= 0) {
        toast.error("Invalid payment amount");
        return;
      }

      // Prepare order object for createPayment function

      // Log for debugging (using the activeTab parameter)
      if (orderData?.id !== undefined) {
        const paymentOrder = {
          ...orderData,
          amount: String(amount),
          agent: orderData.agent || undefined,
        };

        await createPayment(paymentOrder, token,
          url, {
          serviceId: serviceId,
          paymentType: paymentTypeParam,
          serviceName: serviceNameParam,
        }
        );
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("An error occurred while processing payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const currentBookedService = React.useMemo(() => {
    return orderData?.services?.find(s => s.uuid === currentService?.uuid);
  }, [orderData, currentService]);

  const isServicePaymentAvailable = currentService && serviceAmount > 0 &&
    currentBookedService?.payment_status !== 'PAID' &&
    orderData?.payment_status !== 'PAID';

  const isFullPaymentAvailable = fullAmount > 0 && orderData?.payment_status !== 'PAID';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddPayment = (paymentData: any) => {
    console.log("Payment Added:", paymentData);
    toast.success("Manual payment processed successfully.");
    setShowManualPaymentDialog(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">
              PAY INVOICE
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Choose your payment option below
              </p>
              {/* Using activeTab for debugging display */}
              {process.env.NODE_ENV === "development" && (
                <p className="text-xs text-gray-400 mt-1">
                  Active Tab: {activeTab}
                </p>
              )}
            </div>

            <RadioGroup
              value={paymentType}
              onValueChange={(value: "full" | "service" | "manual") => setPaymentType(value)}
              className="space-y-4"
            >
              <div
                className={`flex items-center space-x-2 px-4 border rounded-md bg-gray-50 cursor-pointer ${(serviceAmount <= 0 || !isServicePaymentAvailable) ? "opacity-50" : ""
                  }`}
              >
                <RadioGroupItem
                  value="service"
                  id="service"
                  disabled={!isServicePaymentAvailable}
                />
                <Label htmlFor="service" className="flex-1">
                  <div className="flex justify-between py-4 items-center cursor-pointer">
                    <span>
                      {serviceAmount <= 0
                        ? "Chosen service is inactive"
                        : currentBookedService?.payment_status === "PAID" || orderData?.payment_status === "PAID"
                          ? `Service Invoice Paid - ${serviceName}`
                          : `Pay Service Invoice - ${serviceName}`}
                    </span>
                    <span className="font-semibold">
                      ${serviceAmount.toFixed(2)}
                    </span>
                  </div>
                  {!isServicePaymentAvailable && serviceAmount > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {currentBookedService?.payment_status === "PAID" || orderData?.payment_status === "PAID"
                        ? "This service has already been paid"
                        : "Service payment not available"}
                    </p>
                  )}
                </Label>
              </div>

              <div className={`flex items-center space-x-2 px-4 border rounded-md bg-gray-50 ${!isFullPaymentAvailable ? "opacity-50" : ""}`}>
                <RadioGroupItem
                  value="full"
                  id="full"
                  disabled={!isFullPaymentAvailable}
                />
                <Label htmlFor="full" className="flex-1">
                  <div className="flex justify-between items-center py-4 cursor-pointer">
                    <span>{orderData?.payment_status === "PAID" ? "Full Invoice Paid" : "Pay Full Invoice"}</span>
                    <span className="font-semibold">
                      ${fullAmount.toFixed(2)}
                    </span>
                  </div>
                  {!isFullPaymentAvailable && (
                    <p className="text-xs text-gray-500 mt-1">
                      {orderData?.payment_status === "PAID"
                        ? "This order has already been paid in full"
                        : "Full invoice will be available once all services have been completed"}
                    </p>
                  )}
                </Label>
              </div>

              {userType === "admin" && (
                <div className="flex items-center space-x-2 px-4 border rounded-md bg-gray-50">
                  <RadioGroupItem
                    value="manual"
                    id="manual"
                  />
                  <Label htmlFor="manual" className="flex-1">
                    <div className="flex justify-between items-center py-4 cursor-pointer">
                      <span>Manual Payment</span>
                    </div>
                  </Label>
                </div>
              )}
            </RadioGroup>

            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={
                  isProcessing ||
                  (paymentType === "full" && !isFullPaymentAvailable) ||
                  (paymentType === "service" && !isServicePaymentAvailable)
                }
                className={`flex-1 ${userType}-bg text-white hover:${userType}-bg/90`}
              >
                {isProcessing ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  `Pay $${(paymentType === "full"
                    ? fullAmount
                    : serviceAmount
                  ).toFixed(2)}`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {userType === "admin" && (
        <ManualPayment
          open={showManualPaymentDialog}
          setOpen={setShowManualPaymentDialog}
          addPayment={handleAddPayment}
        />
      )}
    </>
  );
};

export default InvoicePaymentDialog;
