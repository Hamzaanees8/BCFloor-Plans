'use client';

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Printer, Loader2 } from "lucide-react";
import { useAppContext } from "@/app/context/AppContext";
import { featureSheetService, CreateTour, createPayment } from "../file-manager";
import { toast } from "sonner";
import { Order } from "../../orders/page";
import { GetServices, UpdateOrderService, OrderServiceItem } from "../../orders/orders";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTemplateLabel } from "../types/featureSheetTypes";

interface PrintRequestModalProps {
  open: boolean;
  onClose: () => void;
  featureSheetUuid: string | null;
  templateKey?: string;
  agentId?: string;
  propertyId?: string;
  tourId?: string;
  orderUuid?: string;
  orderData?: Order | null;
  onTourCreated?: (tourData: any) => void;
  onSaveSheet?: () => Promise<void>;
  onRequestSuccess?: (sheetUuid: string) => void;
}

export default function PrintRequestModal({
  open,
  onClose,
  featureSheetUuid,
  templateKey,
  agentId,
  propertyId,
  tourId,
  orderUuid,
  orderData,
  onTourCreated,
  onSaveSheet,
  onRequestSuccess
}: PrintRequestModalProps) {
  const { userType } = useAppContext();
  const [copies, setCopies] = useState<number>(25);
  const [withBleed, setWithBleed] = useState<boolean>(false);
  const [additionalInfo, setAdditionalInfo] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loadingServices, setLoadingServices] = useState<boolean>(false);
  const [featureSheetsService, setFeatureSheetsService] = useState<any | null>(null);
  const [selectedOptionUuid, setSelectedOptionUuid] = useState<string>("");

  useEffect(() => {
    if (open) {
      const fetchServices = async () => {
        setLoadingServices(true);
        try {
          const token = localStorage.getItem("token") || "";
          const response = await GetServices(token);
          const servicesList = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);

          // Find service with category name "feature_sheets" (or fallback to service name "Feature Sheets")
          const fsService = servicesList.find(
            (s: any) => s.category?.name?.toLowerCase() === "feature_sheets" ||
                        s.category?.name?.toLowerCase() === "feature sheets" ||
                        s.name?.toLowerCase() === "feature sheets"
          );
          setFeatureSheetsService(fsService || null);

          if (fsService && fsService.product_options && fsService.product_options.length > 0) {
            // Find if order already has an option for this service and pre-select it, or fallback to first option
            const existingBilledService = orderData?.services?.find(
              (os: any) => (os.service as any)?.category?.name?.toLowerCase() === "feature_sheets" ||
                           (os.service as any)?.category?.name?.toLowerCase() === "feature sheets" ||
                           os.service?.name?.toLowerCase() === "feature sheets"
            );
            
            const initialOption = fsService.product_options.find((opt: any) => opt.uuid === existingBilledService?.option?.uuid) || fsService.product_options[0];
            
            setSelectedOptionUuid(initialOption.uuid);
            
            // Extract copies count from quantity property or title
            const copiesCount = initialOption.quantity || (initialOption.title ? parseInt(initialOption.title.match(/\d+/)?.[0] || "25", 10) : 25);
            setCopies(copiesCount);
          }
        } catch (err) {
          console.error("Failed to fetch services:", err);
          toast.error("Failed to load print options.");
        } finally {
          setLoadingServices(false);
        }
      };
      fetchServices();
    }
  }, [open, orderData]);

  const handleOptionChange = (optionUuid: string) => {
    setSelectedOptionUuid(optionUuid);
    const opt = featureSheetsService?.product_options?.find((o: any) => o.uuid === optionUuid);
    if (opt) {
      const copiesCount = opt.quantity || (opt.title ? parseInt(opt.title.match(/\d+/)?.[0] || "25", 10) : 25);
      setCopies(copiesCount);
    }
  };

  const handleSubmit = async () => {
    if (!featureSheetUuid) {
      toast.error("Invalid feature sheet. Please save first.");
      return;
    }

    if (!agentId || !propertyId || !orderUuid) {
      const missing = [];
      if (!agentId) missing.push("Agent ID");
      if (!propertyId) missing.push("Property ID");
      if (!orderUuid) missing.push("Order ID");
      toast.error(`Missing associated order information: ${missing.join(", ")}`);
      return;
    }

    if (!selectedOptionUuid || !featureSheetsService) {
      toast.error("Please select a print quantity option.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 0. Auto-save any latest feature sheet edits before purchasing/booking
      if (onSaveSheet) {
        toast.info("Saving latest sheet changes...");
        await onSaveSheet();
      }

      let activeTourId = tourId;

      if (!activeTourId) {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Authentication token not found.");
          setIsSubmitting(false);
          return;
        }

        toast.info("Creating associated tour record for the order...");
        const newTour = await CreateTour(token, orderUuid);
        if (newTour && newTour.data && newTour.data.uuid) {
          activeTourId = newTour.data.uuid;
          if (onTourCreated) {
            onTourCreated(newTour.data);
          }
        } else {
          throw new Error("Failed to create associated tour record.");
        }
      }

      // 1. Send print request first
      await featureSheetService.requestPrint(featureSheetUuid, {
        copies,
        with_bleed: withBleed,
        additional_info: additionalInfo,
        agent_id: agentId,
        property_id: propertyId,
        tour_id: activeTourId,
      });

      // 2. Add/update the Feature Sheets service in the order
      let updatedOrder = orderData;
      const token = localStorage.getItem("token") || "";
      const selectedOption = featureSheetsService.product_options.find((o: any) => o.uuid === selectedOptionUuid);
      const sheetLabel = getTemplateLabel(templateKey || "") || templateKey || "Feature Sheet";
      const sheetCustomName = `Feature Sheet (${sheetLabel})`;

      if (orderData) {
        // Build all existing services list from the order
        const allServices: OrderServiceItem[] = (orderData.services || []).map(orderService => ({
          service_id: orderService.service.uuid,
          option_id: orderService.option.uuid,
          amount: Number(orderService.amount),
          uuid: orderService.uuid,
          custom: (orderService as any).custom
        }));

        // Find an existing UNPAID feature sheet service on the order that can be updated
        const existingUnpaidIndex = (orderData.services || []).findIndex(orderService => {
          const isFS = (orderService.service as any)?.category?.name?.toLowerCase() === "feature_sheets" ||
                       (orderService.service as any)?.category?.name?.toLowerCase() === "feature sheets" ||
                       orderService.service?.name?.toLowerCase() === "feature sheets";
          return isFS && orderService.payment_status !== "PAID";
        });

        if (existingUnpaidIndex !== -1) {
          // Update the existing unpaid print service item with new option & amount
          allServices[existingUnpaidIndex] = {
            service_id: featureSheetsService.uuid,
            option_id: selectedOptionUuid,
            amount: Number(selectedOption?.amount ?? 0),
            uuid: orderData.services[existingUnpaidIndex].uuid,
            custom: sheetCustomName
          };
        } else {
          // Append a NEW service line item to the order for this print request
          allServices.push({
            service_id: featureSheetsService.uuid,
            option_id: selectedOptionUuid,
            amount: Number(selectedOption?.amount ?? 0),
            custom: sheetCustomName
          });
        }

        const updateRes = await UpdateOrderService(orderData.uuid, allServices, token);
        if (updateRes && updateRes.data) {
          updatedOrder = updateRes.data;
        }
      }

      toast.success("Print request sent & service booked successfully!");
      if (featureSheetUuid && onRequestSuccess) {
        onRequestSuccess(featureSheetUuid);
      }
      onClose();

      // 3. Automatically initiate invoice generation and payment checkout
      if (updatedOrder && token) {
        toast.info("Opening payment checkout...");
        await createPayment(updatedOrder, token, window.location.href, {
          serviceId: featureSheetsService.uuid,
          paymentType: "service",
          serviceName: `${sheetCustomName} - ${selectedOption?.title || `${copies} Copies`}`,
          amount: Number(selectedOption?.amount ?? 0),
        });
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Print request failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send print request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[320px] md:w-[500px] max-w-[500px] rounded-[8px] p-4 md:p-6 gap-[20px] font-alexandria [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className={`flex items-center justify-between ${userType}-text text-[20px] font-[600] border-b-[1px] border-[#E4E4E4] pb-2`}>
            <div className="flex items-center gap-2 uppercase">
              <Printer className="w-5 h-5" />
              Request Print
            </div>
            <Button onClick={onClose} variant="ghost" className="border-none !shadow-none p-0 h-auto hover:bg-transparent">
              <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="option" className="text-[14px] font-[500] text-[#666666]">Select Sheet Option / Quantity</Label>
            {loadingServices ? (
              <div className="flex items-center gap-2 h-[44px] text-sm text-[#7D7D7D]">
                <Loader2 className="h-4 w-4 animate-spin text-[#6BAE41]" />
                Loading print options...
              </div>
            ) : featureSheetsService?.product_options?.length > 0 ? (
              <Select value={selectedOptionUuid} onValueChange={handleOptionChange}>
                <SelectTrigger className="h-[44px] border-[#BBBBBB] focus:ring-0 focus:border-[#4290E9] text-[#424242]">
                  <SelectValue placeholder="Select print quantity" />
                </SelectTrigger>
                <SelectContent>
                  {featureSheetsService.product_options.map((opt: any) => (
                    <SelectItem key={opt.uuid} value={opt.uuid}>
                      {opt.title} (${parseFloat(opt.amount).toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-red-500 font-medium">
                No &quot;Feature Sheets&quot; service options found. Please configure the service options first.
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 py-2">
            <Checkbox 
              id="bleed" 
              checked={withBleed} 
              onCheckedChange={(checked) => setWithBleed(!!checked)}
              className={`${userType}-border data-[state=checked]:${userType}-bg`}
            />
            <Label htmlFor="bleed" className="text-[14px] font-[500] text-[#666666] cursor-pointer">
              With Bleed (Full bleed for professional printing)
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-[14px] font-[500] text-[#666666]">Additional Information / Special Instructions</Label>
            <Textarea
              id="notes"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="e.g., specific paper quality, delivery instructions..."
              className="min-h-[100px] border-[#BBBBBB] focus:ring-0 focus:border-[#4290E9] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col md:flex-row md:justify-end gap-[10px] mt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className={`bg-white w-full md:w-[120px] h-[44px] text-[16px] font-[500] ${userType}-text ${userType}-border hover:bg-gray-50`}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedOptionUuid}
            className={`${userType}-bg hover:opacity-90 text-white w-full md:w-[180px] h-[44px] font-[500] text-[16px]`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
