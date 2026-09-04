"use client";

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
import { X, Printer, Loader2, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { useAppContext } from "@/app/context/AppContext";
import {
  featureSheetService,
  CreateTour,
  createPayment,
} from "../file-manager";
import { toast } from "sonner";
import { Order } from "../../orders/page";
import {
  GetServices,
  UpdateOrderService,
  OrderServiceItem,
} from "../../orders/orders";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTemplateLabel, templateImages } from "../types/featureSheetTypes";

interface PrintRequestModalProps {
  open: boolean;
  onClose: () => void;
  featureSheetUuid: string | null;
  featureSheetId?: number | null;
  templateKey?: string;
  agentId?: string;
  propertyId?: string;
  tourId?: string;
  orderUuid?: string;
  orderData?: Order | null;
  onTourCreated?: (tourData: any) => void;
  onSaveSheet?: () => Promise<any>;
  onRequestSuccess?: (sheetUuid: string, claimedServiceUuid?: string) => void;
}

export default function PrintRequestModal({
  open,
  onClose,
  featureSheetUuid,
  featureSheetId,
  templateKey,
  agentId,
  propertyId,
  tourId,
  orderUuid,
  orderData,
  onTourCreated,
  onSaveSheet,
  onRequestSuccess,
}: PrintRequestModalProps) {
  const { userType } = useAppContext();
  const [copies, setCopies] = useState<number>(25);
  const [withBleed, setWithBleed] = useState<boolean>(false);
  const [additionalInfo, setAdditionalInfo] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loadingServices, setLoadingServices] = useState<boolean>(false);
  const [featureSheetsService, setFeatureSheetsService] = useState<any | null>(
    null,
  );
  const [selectedOptionUuid, setSelectedOptionUuid] = useState<string>("");

  // Pre-booked service detection state
  const [preBookedService, setPreBookedService] = useState<any | null>(null);

  useEffect(() => {
    if (open) {
      const fetchServices = async () => {
        setLoadingServices(true);
        try {
          const token = localStorage.getItem("token") || "";
          const response = await GetServices(token);
          const servicesList = Array.isArray(response.data)
            ? response.data
            : Array.isArray(response)
              ? response
              : [];

          // Determine whether current sheet is Tabloid or standard/listing Flyer
          const matchingTemplate = templateImages.find(
            (t) =>
              t.id.toLowerCase() === templateKey?.toLowerCase() ||
              t.url.toLowerCase() === templateKey?.toLowerCase(),
          );
          const isTabloid =
            matchingTemplate?.type === "tabloid" ||
            templateKey?.toLowerCase().includes("tabloid");
          const targetType = isTabloid ? "tabloid" : "flyer";

          // Find service with category "Print" and matching type ("tabloid" vs "flyer")
          let fsService = servicesList.find(
            (s: any) =>
              s.category?.name?.toLowerCase() === "print" &&
              s.type?.toLowerCase() === targetType,
          );

          // Graceful fallback for existing/legacy database records
          if (!fsService) {
            fsService = servicesList.find((s: any) => {
              const cat = s.category?.name?.toLowerCase() || "";
              const name = s.name?.toLowerCase() || "";
              const isPrintCat =
                cat === "print" ||
                cat === "feature_sheets" ||
                cat === "feature sheets";
              if (targetType === "tabloid") {
                return (
                  isPrintCat &&
                  (s.type?.toLowerCase() === "tabloid" ||
                    name.includes("tabloid"))
                );
              } else {
                return (
                  isPrintCat &&
                  (s.type?.toLowerCase() === "flyer" ||
                    (!s.type && !name.includes("tabloid")))
                );
              }
            });
          }

          setFeatureSheetsService(fsService || null);

          if (
            fsService &&
            fsService.product_options &&
            fsService.product_options.length > 0
          ) {
            // Find if order already has an option for this service and pre-select it, or fallback to first option
            // Pre-select the option already booked for THIS specific sheet (by feature_sheet_id or feature_sheet_uuid)
            const existingBilledService = orderData?.services?.find(
              (os: any) => {
                const osFsId =
                  (os as any).feature_sheet_id || (os as any).feature_sheet?.id;
                const osFsUuid =
                  (os as any).feature_sheet_uuid ||
                  (os as any).feature_sheet?.uuid;
                // Match this sheet specifically
                if (
                  featureSheetId &&
                  osFsId &&
                  Number(osFsId) === Number(featureSheetId)
                )
                  return true;
                if (
                  featureSheetUuid &&
                  osFsUuid &&
                  osFsUuid === featureSheetUuid
                )
                  return true;
                return false;
              },
            );
            const initialOption =
              fsService.product_options.find(
                (opt: any) => opt.uuid === existingBilledService?.option?.uuid,
              ) || fsService.product_options[0];

            setSelectedOptionUuid(initialOption.uuid);

            // Extract copies count from quantity property or title
            const copiesCount =
              initialOption.quantity ||
              (initialOption.title
                ? parseInt(initialOption.title.match(/\d+/)?.[0] || "25", 10)
                : 25);
            setCopies(copiesCount);
          }

          // ── Pre-booked service detection ──────────────────────────────────
          // Detect an existing unpaired DIY service on this order that matches the current template type
          const existingPreBooked = (orderData?.services || []).find((os: any) => {
            const osFsId = os.feature_sheet_id || os.feature_sheet?.id;
            const osFsUuid = os.feature_sheet_uuid || os.feature_sheet?.uuid;
            const hasNoSheet = !osFsId && !osFsUuid;
            if (!hasNoSheet) return false;

            // Find catalog service to resolve category and type reliably
            const catalogService = servicesList.find(
              (s: any) =>
                (s.uuid && (s.uuid === os.service?.uuid || s.uuid === os.service_id)) ||
                (s.id != null && (s.id === os.service?.id || s.id === os.service_id)),
            ) || os.service;

            const catName = (
              catalogService?.category?.name ||
              os.service?.category?.name ||
              ""
            ).toLowerCase();
            const sType = (
              catalogService?.type ||
              os.service?.type ||
              ""
            ).toLowerCase();
            const sName = (
              catalogService?.name ||
              os.service?.name ||
              os.custom ||
              ""
            ).toLowerCase();

            const isPrintCat =
              catName === "print" ||
              catName === "feature_sheets" ||
              catName === "feature sheets" ||
              sName.includes("flyer") ||
              sName.includes("tabloid") ||
              sName.includes("feature sheet");

            const matchesType =
              targetType === "tabloid"
                ? sType === "tabloid" || sName.includes("tabloid")
                : sType === "flyer" ||
                  (!sType && !sName.includes("tabloid"));

            return isPrintCat && matchesType;
          });
          setPreBookedService(existingPreBooked || null);

          // If we found a pre-booked service, pre-select its exact option
          if (existingPreBooked && fsService?.product_options?.length > 0) {
            const preBookedOptId =
              existingPreBooked.option?.uuid ||
              existingPreBooked.option_id ||
              existingPreBooked.option?.id;

            let preBookedOption = fsService.product_options.find(
              (opt: any) =>
                preBookedOptId &&
                (opt.uuid === preBookedOptId ||
                  opt.id === preBookedOptId ||
                  String(opt.id) === String(preBookedOptId)),
            );

            if (!preBookedOption && existingPreBooked.option) {
              preBookedOption = fsService.product_options.find((opt: any) => {
                if (
                  existingPreBooked.option.title &&
                  opt.title?.toLowerCase() ===
                    existingPreBooked.option.title.toLowerCase()
                ) {
                  return true;
                }
                if (
                  existingPreBooked.option.quantity &&
                  opt.quantity === existingPreBooked.option.quantity
                ) {
                  return true;
                }
                if (
                  existingPreBooked.amount &&
                  Number(opt.amount) === Number(existingPreBooked.amount)
                ) {
                  return true;
                }
                return false;
              });
            }

            if (!preBookedOption) {
              preBookedOption = fsService.product_options[0];
            }

            setSelectedOptionUuid(preBookedOption.uuid);
            const pCopies =
              preBookedOption.quantity ||
              (preBookedOption.title
                ? parseInt(preBookedOption.title.match(/\d+/)?.[0] || "25", 10)
                : 25);
            setCopies(pCopies);
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
  }, [featureSheetId, featureSheetUuid, open, orderData, templateKey]);

  const handleOptionChange = (optionUuid: string) => {
    setSelectedOptionUuid(optionUuid);
    const opt = featureSheetsService?.product_options?.find(
      (o: any) => o.uuid === optionUuid,
    );
    if (opt) {
      const copiesCount =
        opt.quantity ||
        (opt.title ? parseInt(opt.title.match(/\d+/)?.[0] || "25", 10) : 25);
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
      toast.error(
        `Missing associated order information: ${missing.join(", ")}`,
      );
      return;
    }

    if (!selectedOptionUuid || !featureSheetsService) {
      toast.error("Please select a print quantity option.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 0. Auto-save any latest feature sheet edits before purchasing/booking to get updated ID & UUID
      let savedSheetData: any = null;
      if (onSaveSheet) {
        toast.info("Saving latest sheet changes...");
        savedSheetData = await onSaveSheet();
      }

      const resolvedFsUuid = savedSheetData?.uuid || featureSheetUuid;
      const resolvedFsId = savedSheetData?.id || featureSheetId;
      const targetFeatureSheetId = resolvedFsId
        ? Number(resolvedFsId)
        : undefined;

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

      const selectedOption = featureSheetsService?.product_options?.find(
        (o: any) => o.uuid === selectedOptionUuid,
      );
      const sheetLabel =
        getTemplateLabel(templateKey || "") || templateKey || "Feature Sheet";
      const optionTitle = selectedOption?.title
        ? selectedOption.title.toLowerCase().includes("copies")
          ? selectedOption.title
          : `${selectedOption.title} Copies`
        : `${copies} Copies`;
      const sheetCustomName = `Feature Sheet (${sheetLabel}) - ${optionTitle}`;

      // ── Branch: Pre-booked detection ──────────────────────────────────────
      const matchingTemplate = templateImages.find(
        (t) =>
          t.id.toLowerCase() === templateKey?.toLowerCase() ||
          t.url.toLowerCase() === templateKey?.toLowerCase(),
      );
      const isTabloid =
        matchingTemplate?.type === "tabloid" ||
        templateKey?.toLowerCase().includes("tabloid");
      const targetType = isTabloid ? "tabloid" : "flyer";

      // Re-check with the current pre-booked state
      const currentPreBooked =
        preBookedService ||
        (orderData?.services || []).find((os: any) => {
          const osFsId = os.feature_sheet_id || os.feature_sheet?.id;
          const osFsUuid = os.feature_sheet_uuid || os.feature_sheet?.uuid;
          const hasNoSheet = !osFsId && !osFsUuid;
          if (!hasNoSheet) return false;

          const sType = (os.service?.type || "").toLowerCase();
          const sName = (os.service?.name || os.custom || "").toLowerCase();
          const isPrintType =
            targetType === "tabloid"
              ? sType === "tabloid" || sName.includes("tabloid")
              : sType === "flyer" ||
                (!sType && !sName.includes("tabloid") && sName.includes("flyer"));
          return isPrintType;
        }) ||
        null;

      const isPaidPreBooked =
        currentPreBooked &&
        (currentPreBooked.payment_status?.toUpperCase() === "PAID" ||
          orderData?.payment_status?.toUpperCase() === "PAID" ||
          currentPreBooked.payment_status === "PAID");

      const token = localStorage.getItem("token") || "";

      if (currentPreBooked) {
        // ── PATH A: Pre-booked service exists ─────────────────────────────
        // 1. Send the print request (records the request on the backend)
        await featureSheetService.requestPrint(resolvedFsUuid, {
          copies,
          option_id: selectedOptionUuid,
          amount: Number(selectedOption?.amount ?? 0),
          with_bleed: withBleed,
          additional_info: additionalInfo,
          agent_id: agentId,
          property_id: propertyId,
          tour_id: activeTourId,
        });

        // 2. Patch the pre-booked order service with the feature_sheet references
        const allServices: OrderServiceItem[] = (orderData?.services || []).map(
          (orderService) => ({
            service_id:
              orderService.service?.uuid ||
              (orderService as any).service_id ||
              String(orderService.service_id || ""),
            option_id:
              orderService.option?.uuid ||
              (orderService as any).option_id ||
              (orderService.option_id
                ? String(orderService.option_id)
                : undefined),
            amount: Number(orderService.amount) || 0,
            uuid: orderService.uuid,
            custom: (orderService as any).custom,
            feature_sheet_uuid:
              (orderService as any).feature_sheet_uuid ||
              (orderService as any).feature_sheet?.uuid,
            feature_sheet_id:
              (orderService as any).feature_sheet_id ||
              (orderService as any).feature_sheet?.id,
          }),
        );

        // Find and update the pre-booked item in the list
        const preBookedIdx = allServices.findIndex(
          (s) => s.uuid === currentPreBooked.uuid,
        );
        if (preBookedIdx !== -1) {
          allServices[preBookedIdx] = {
            ...allServices[preBookedIdx],
            custom: sheetCustomName,
            feature_sheet_id: targetFeatureSheetId,
            feature_sheet_uuid: resolvedFsUuid,
          };
        }

        const updateRes = await UpdateOrderService(
          orderData!.uuid,
          allServices,
          token,
        );
        const updatedOrder = updateRes?.data || orderData;

        if (isPaidPreBooked) {
          // PATH A1: Already paid — just attach the sheet, no payment needed
          toast.success(
            "✅ Sheet attached to your pre-booked print service! No payment needed.",
          );
          if (resolvedFsUuid && onRequestSuccess) {
            onRequestSuccess(resolvedFsUuid, currentPreBooked.uuid);
          }
          onClose();
        } else {
          // PATH A2: Pre-booked but unpaid — close the modal and open payment for existing item
          toast.success("Print request sent! Proceeding to payment...");
          if (resolvedFsUuid && onRequestSuccess) {
            onRequestSuccess(resolvedFsUuid, currentPreBooked.uuid);
          }
          onClose();

          if (updatedOrder && token) {
            try {
              const payServiceItem = (updatedOrder.services || []).find(
                (os: any) => os.uuid === currentPreBooked.uuid,
              );
              const serviceUuidForInvoice =
                payServiceItem?.uuid || currentPreBooked.uuid;

              toast.info("Opening payment checkout for pre-booked service...");
              await createPayment(updatedOrder, token, window.location.href, {
                serviceId: serviceUuidForInvoice,
                paymentType: "service",
                serviceName: sheetCustomName,
                amount: Number(selectedOption?.amount ?? 0),
              });
            } catch (payErr) {
              console.error("Payment checkout error:", payErr);
            }
          }
        }
      } else {
        // ── PATH B: No pre-booked service — original flow ─────────────────
        // 1. Send print request first
        await featureSheetService.requestPrint(resolvedFsUuid, {
          copies,
          option_id: selectedOptionUuid,
          amount: Number(selectedOption?.amount ?? 0),
          with_bleed: withBleed,
          additional_info: additionalInfo,
          agent_id: agentId,
          property_id: propertyId,
          tour_id: activeTourId,
        });

        // 2. Add/update the Feature Sheets service in the order
        let updatedOrder = orderData;

        if (orderData) {
          // Build all existing services list from the order safely with optional chaining
          const allServices: OrderServiceItem[] = (orderData.services || []).map(
            (orderService) => ({
              service_id:
                orderService.service?.uuid ||
                (orderService as any).service_id ||
                String(orderService.service_id || ""),
              option_id:
                orderService.option?.uuid ||
                (orderService as any).option_id ||
                (orderService.option_id
                  ? String(orderService.option_id)
                  : undefined),
              amount: Number(orderService.amount),
              uuid: orderService.uuid,
              custom: (orderService as any).custom,
              feature_sheet_uuid:
                (orderService as any).feature_sheet_uuid ||
                (orderService as any).feature_sheet?.uuid,
              feature_sheet_id:
                (orderService as any).feature_sheet_id ||
                (orderService as any).feature_sheet?.id,
            }),
          );

          // Find an existing UNPAID feature sheet service on the order specifically for this sheet (or unlinked)
          const existingUnpaidIndex = (orderData.services || []).findIndex(
            (orderService) => {
              const osFsId =
                (orderService as any).feature_sheet_id ||
                (orderService as any).feature_sheet?.id;
              const osFsUuid =
                (orderService as any).feature_sheet_uuid ||
                (orderService as any).feature_sheet?.uuid;

              if (orderService.payment_status === "PAID") return false;

              // Direct feature-sheet ID match (most reliable — no service-object hydration needed)
              if (
                targetFeatureSheetId &&
                osFsId &&
                Number(osFsId) === Number(targetFeatureSheetId)
              )
                return true;
              if (resolvedFsUuid && osFsUuid && osFsUuid === resolvedFsUuid)
                return true;

              // Unlinked existing FS service (no sheet IDs attached) — only match if this sheet also has no ID yet
              if (
                !osFsId &&
                !osFsUuid &&
                !targetFeatureSheetId &&
                !resolvedFsUuid
              ) {
                const isFS =
                  (orderService.service as any)?.category?.name?.toLowerCase() ===
                    "print" ||
                  (orderService.service as any)?.category?.name?.toLowerCase() ===
                    "feature_sheets" ||
                  (orderService.service as any)?.category?.name?.toLowerCase() ===
                    "feature sheets" ||
                  orderService.service?.name?.toLowerCase() ===
                    "feature sheets" ||
                  orderService.service?.name?.toLowerCase() === "print";
                return isFS;
              }

              return false;
            },
          );

          if (existingUnpaidIndex !== -1) {
            // Update the existing unpaid print service item with new option & amount & feature_sheet_id & feature_sheet_uuid
            allServices[existingUnpaidIndex] = {
              service_id: featureSheetsService.uuid,
              option_id: selectedOptionUuid,
              amount: Number(selectedOption?.amount ?? 0),
              uuid: orderData.services[existingUnpaidIndex].uuid,
              custom: sheetCustomName,
              feature_sheet_id: targetFeatureSheetId,
              feature_sheet_uuid: resolvedFsUuid,
            };
          } else {
            // Append a NEW service line item to the order for this print request
            allServices.push({
              service_id: featureSheetsService.uuid,
              option_id: selectedOptionUuid,
              amount: Number(selectedOption?.amount ?? 0),
              custom: sheetCustomName,
              feature_sheet_id: targetFeatureSheetId,
              feature_sheet_uuid: resolvedFsUuid,
            });
          }

          const updateRes = await UpdateOrderService(
            orderData.uuid,
            allServices,
            token,
          );
          if (updateRes && updateRes.data) {
            updatedOrder = updateRes.data;
          }
        }

        toast.success("Print request sent & service booked successfully!");
        if (resolvedFsUuid && onRequestSuccess) {
          onRequestSuccess(resolvedFsUuid);
        }
        onClose();

        // 3. Automatically initiate invoice generation and payment checkout
        if (updatedOrder && token) {
          try {
            const bookedServiceItem = (updatedOrder.services || []).find(
              (os: any) =>
                (os.feature_sheet_uuid &&
                  os.feature_sheet_uuid === resolvedFsUuid) ||
                (os.service?.uuid &&
                  os.service.uuid === featureSheetsService?.uuid) ||
                (os.service_id && os.service_id === featureSheetsService?.uuid),
            );
            const serviceUuidForInvoice =
              bookedServiceItem?.uuid || featureSheetsService?.uuid;

            toast.info("Opening payment checkout...");
            await createPayment(updatedOrder, token, window.location.href, {
              serviceId: serviceUuidForInvoice,
              paymentType: "service",
              serviceName: sheetCustomName,
              amount: Number(selectedOption?.amount ?? 0),
            });
          } catch (payErr) {
            console.error("Payment checkout error:", payErr);
          }
        }
      }
    } catch (error) {
      console.error("Print request failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send print request",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[320px] md:w-[500px] max-w-[500px] rounded-[8px] p-4 md:p-6 gap-[20px] font-alexandria [&>button]:hidden">
        <DialogHeader>
          <DialogTitle
            className={`flex items-center justify-between ${userType}-text text-[20px] font-[600] border-b-[1px] border-[#E4E4E4] pb-2`}
          >
            <div className="flex items-center gap-2 uppercase">
              <Printer className="w-5 h-5" />
              Request Print
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              className="border-none !shadow-none p-0 h-auto hover:bg-transparent"
            >
              <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pre-booked service banner */}
          {preBookedService && (
            <div className={`flex items-start gap-3 p-3 rounded-lg border ${
              preBookedService.payment_status?.toUpperCase() === "PAID"
                ? "bg-green-50 border-green-200"
                : "bg-amber-50 border-amber-200"
            }`}>
              {preBookedService.payment_status?.toUpperCase() === "PAID" ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                {preBookedService.payment_status?.toUpperCase() === "PAID" ? (
                  <>
                    <p className="font-semibold text-green-700">Pre-booked print service found</p>
                    <p className="text-green-600 text-xs mt-0.5">
                      Your order already includes a paid print service. Sending this request will attach your sheet — no payment required.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-amber-700">Pre-booked print service found (unpaid)</p>
                    <p className="text-amber-600 text-xs mt-0.5">
                      Your order has a print service pending payment. Sending this request will attach your sheet and open the payment checkout.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label
              htmlFor="option"
              className="text-[14px] font-[500] text-[#666666]"
            >
              Select Sheet Option / Quantity
            </Label>
            {loadingServices ? (
              <div className="flex items-center gap-2 h-[44px] text-sm text-[#7D7D7D]">
                <Loader2 className="h-4 w-4 animate-spin text-[#6BAE41]" />
                Loading print options...
              </div>
            ) : featureSheetsService?.product_options?.length > 0 ? (
              <div className="space-y-1.5">
                <Select
                  value={selectedOptionUuid}
                  onValueChange={handleOptionChange}
                  disabled={Boolean(preBookedService)}
                >
                  <SelectTrigger
                    disabled={Boolean(preBookedService)}
                    className={`h-[44px] border-[#BBBBBB] focus:ring-0 focus:border-[#4290E9] text-[#424242] ${
                      preBookedService
                        ? "bg-gray-100/90 cursor-not-allowed text-gray-700 border-gray-300"
                        : ""
                    }`}
                  >
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
                {preBookedService && (
                  <p className="text-xs text-amber-800 font-medium flex items-center gap-1.5 mt-1 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Quantity is locked to your pre-booked service ({copies} copies).
                  </p>
                )}
              </div>
            ) : (
              <div className="text-sm text-red-500 font-medium">
                No &quot;Feature Sheets&quot; service options found. Please
                configure the service options first.
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
            <Label
              htmlFor="bleed"
              className="text-[14px] font-[500] text-[#666666] cursor-pointer"
            >
              With Bleed (Full bleed for professional printing)
            </Label>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="notes"
              className="text-[14px] font-[500] text-[#666666]"
            >
              Additional Information / Special Instructions
            </Label>
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
            ) : preBookedService?.payment_status?.toUpperCase() === "PAID" ? (
              "Attach Sheet"
            ) : (
              "Send Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
