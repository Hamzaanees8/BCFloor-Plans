"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import OrderStepper from "./OrderStepper";
import Services, { SelectedService } from "./Services";
import Schedule from "./Schedule";
import { useOrderContext, Slot } from "../context/OrderContext";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { Order, OrderService, Slot as OrderSlot } from "../page";
import { Edit, OrderPayload } from "../orders";
import { GetServices, GetPackages } from "../../services/services";
import { GetVendors } from "../orders";
import {
  getEffectiveServiceDuration,
  isServiceRequiringTravel,
  splitSlotInto15MinChunks,
} from "../utils/serviceTimeUtils";
import { toast } from "sonner";

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderData: Order | null;
  onSuccess?: () => void;
  roleSettings: any;
}

const STEPS = [
  { id: "services", label: "SERVICES" },
  { id: "schedule", label: "SCHEDULE" },
];

export default function AddServiceDialog({
  open,
  onOpenChange,
  orderData,
  onSuccess,
  roleSettings,
}: AddServiceDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("services");
  const [invalidServices, setInvalidServices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { userType } = useAppContext();
  const { appliedSettings } = useWhiteLabel();

  const role = (userType as string)?.toLowerCase() || "admin";
  const currentRoleSettings =
    roleSettings || appliedSettings[role as keyof typeof appliedSettings] || appliedSettings["admin"];

  const {
    selectedServices,
    setSelectedServices,
    setSelectedAgentId,
    setSelectedListingId,
    setSelectedCurrentListing,
    setSelectedSlots,
    setSelectedOptions,
    setCustomPrices,
    setCustomServiceNames,
    selectedSlots,
    servicesData,
    setServicesData,
    setPackagesData,
    setVendorsData,
    resetOrderData,
    tempPropertyData,
    selectedCurrentListing,
  } = useOrderContext();

  // Populate context with the current order details when dialog opens
  useEffect(() => {
    if (!open || !orderData) return;

    const token = localStorage.getItem("token") || "";

    // 1. Fetch catalog services, packages, vendors if needed
    if (token) {
      GetServices(token)
        .then((res) => {
          if (Array.isArray(res?.data)) setServicesData(res.data);
        })
        .catch((err) => console.log("Failed to fetch services in AddServiceDialog:", err));

      GetPackages(token)
        .then((res) => {
          if (Array.isArray(res?.data)) setPackagesData(res.data);
        })
        .catch((err) => console.log("Failed to fetch packages in AddServiceDialog:", err));

      GetVendors(token)
        .then((res) => {
          if (Array.isArray(res?.data)) setVendorsData(res.data);
        })
        .catch((err) => console.log("Failed to fetch vendors in AddServiceDialog:", err));
    }

    // 2. Set Agent and Listing info
    setSelectedAgentId(orderData.agent?.uuid || "");
    setSelectedListingId(orderData.property?.uuid || "");
    setSelectedCurrentListing(orderData.property as any);

    // 3. Populate existing services (tagged with service_uuid so they are marked as booked)
    const existingServices: SelectedService[] = (orderData.services || []).map(
      (s: OrderService) => ({
        title: s.service.name,
        uuid: s.service.uuid,
        id: String(s.service.id),
        service_uuid: s.uuid, // marks this as already booked
        price: Number(s.amount),
        quantity: s.option?.quantity ?? 1,
        option_id:
          s.option?.uuid ||
          (s.option_id ? String(s.option_id) : s.option?.id ? String(s.option.id) : undefined),
        service_duration: s.option?.service_duration,
        custom: s.custom,
        optionName: s.option?.title ?? s.custom ?? "",
        payment_status: s.payment_status,
        is_completed: s.is_completed,
        is_travel_required: (s.service as any)?.is_travel_required,
        allow_travel: (s.service as any)?.allow_travel,
        allowed_travel: (s.service as any)?.allowed_travel,
        type: (s.service as any)?.type,
        vendor_id:
          (s as any).vendor_id ||
          (s as any).vendor?.uuid ||
          (orderData.slots || []).find((sl) => sl.service_id === s.service.id)?.vendor?.uuid,
      })
    );
    setSelectedServices(existingServices);

    // 4. Populate existing options
    const optionsMap: Record<string, string> = {};
    const namesMap: Record<string, string> = {};
    const pricesMap: Record<string, string> = {};
    (orderData.services || []).forEach((s: OrderService) => {
      if (s.option?.title) {
        optionsMap[s.service.uuid] = s.option.title;
      } else if (s.custom) {
        optionsMap[s.service.uuid] = "custom";
      }
      if (s.custom) {
        namesMap[s.service.uuid] = s.custom;
        pricesMap[s.service.uuid] = s.amount;
      }
    });
    setSelectedOptions(optionsMap);
    setCustomServiceNames(namesMap);
    setCustomPrices(pricesMap);

    // 5. Populate existing slots
    const existingSlots: Slot[] = (orderData.slots || []).flatMap((slot: OrderSlot) => {
      const matchedService = (orderData.services || []).find(
        (s: OrderService) => s.service?.id === slot.service_id
      );
      const chunks = splitSlotInto15MinChunks(slot.start_time, slot.end_time);
      return chunks.map((chunk) => ({
        ...slot,
        start_time: chunk.start_time,
        end_time: chunk.end_time,
        vendor_id: slot.vendor?.uuid || slot.vendor_id || "",
        service_id: matchedService?.service?.uuid || String(slot.service_id),
        show_all_vendors: Number(slot.show_all_vendors),
        schedule_override: Number(slot.schedule_override),
        recommend_time: Number(slot.recommend_time),
        est_time: slot.est_time ? Number(slot.est_time) : null,
        distance: slot.distance ? Number(slot.distance) : null,
        km_price: slot.km_price ? Number(slot.km_price) : null,
      }));
    });
    setSelectedSlots(existingSlots);

    setActiveTab("services");
    setInvalidServices([]);
  }, [
    open,
    orderData,
    setSelectedAgentId,
    setSelectedListingId,
    setSelectedCurrentListing,
    setSelectedServices,
    setSelectedOptions,
    setCustomServiceNames,
    setCustomPrices,
    setSelectedSlots,
    setServicesData,
    setPackagesData,
    setVendorsData,
  ]);

  // Newly selected services (without service_uuid)
  const newServices = useMemo(() => {
    return (selectedServices || []).filter((s) => !s.service_uuid);
  }, [selectedServices]);

  const newServicesSubtotal = useMemo(() => {
    return newServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  }, [newServices]);

  const handleClose = () => {
    resetOrderData();
    setInvalidServices([]);
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const canNavigateTo = (tabId: string) => {
    if (tabId === "services") return true;
    if (tabId === "schedule") return newServices.length > 0;
    return false;
  };

  const handleNextToSchedule = () => {
    if (newServices.length === 0) {
      toast.error("Please select at least one service to add.");
      return;
    }
    setActiveTab("schedule");
    setInvalidServices([]);
  };

  const validateSchedule = useCallback(() => {
    const servicesToSchedule = newServices;
    const squareFootage =
      tempPropertyData?.square_footage ||
      selectedCurrentListing?.square_footage ||
      Number(orderData?.property?.square_footage) ||
      0;

    const newInvalidServices: string[] = [];
    let firstErrorToastShown = false;

    for (const service of servicesToSchedule) {
      const serviceUuid = service.uuid;
      if (!serviceUuid) continue;

      const isTravelReq = isServiceRequiringTravel(service, servicesData);

      if (!isTravelReq) {
        const hasVendor = Boolean(
          (service as any).vendor_id &&
            (service as any).vendor_id !== "all" &&
            (service as any).vendor_id !== "none"
        );
        if (!hasVendor) {
          newInvalidServices.push(serviceUuid);
          if (!firstErrorToastShown) {
            toast.error(`Please select a vendor for "${service.title}".`);
            firstErrorToastShown = true;
          }
        }
        continue;
      }

      const globalService = servicesData?.find(
        (s) => s.uuid === serviceUuid || (service.id && String(s.id) === String(serviceUuid))
      );
      const productOption = globalService?.product_options?.find(
        (opt) =>
          opt.uuid === (service as any).option_id ||
          (opt.id && String(opt.id) === String((service as any).option_id))
      );

      const requiredDuration = getEffectiveServiceDuration(
        productOption,
        globalService,
        squareFootage
      );

      const serviceSlots = selectedSlots.filter(
        (s) =>
          s.service_id === serviceUuid ||
          String(s.service_id) === String(serviceUuid) ||
          (service.id && String(s.service_id) === String(service.id))
      );
      const currentDuration = serviceSlots.length * 15;

      const isInvalid =
        role === "admin"
          ? serviceSlots.length === 0
          : requiredDuration > 0
          ? currentDuration < requiredDuration
          : serviceSlots.length === 0;

      if (isInvalid) {
        newInvalidServices.push(serviceUuid);
        if (!firstErrorToastShown) {
          const slotsNeeded = Math.ceil((requiredDuration - currentDuration) / 15);
          toast.error(
            `Please add ${
              slotsNeeded > 0 ? slotsNeeded : 1
            } more slot(s) for "${service.title}". Required: ${requiredDuration} min, Selected: ${currentDuration} min`
          );
          firstErrorToastShown = true;
        }
      }
    }

    setInvalidServices(newInvalidServices);
    return newInvalidServices.length === 0;
  }, [newServices, servicesData, selectedSlots, tempPropertyData, selectedCurrentListing, orderData, role]);

  const handleSaveServices = async () => {
    if (!orderData) return;
    if (!validateSchedule()) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token") || "";

      // 1. Filter travel-required slots
      const travelSlots = selectedSlots.filter((slot: Slot) => {
        const s = selectedServices.find(
          (sel) => sel.uuid === slot.service_id || String(sel.id) === String(slot.service_id)
        );
        return isServiceRequiringTravel(s, servicesData);
      });

      // 2. Group slots by service_id, vendor_id, and date
      const groupedSlots: Record<string, Slot[]> = {};
      travelSlots.forEach((slot: Slot) => {
        const key = `${slot.service_id}_${slot.vendor_id}_${slot.date}`;
        if (!groupedSlots[key]) {
          groupedSlots[key] = [];
        }
        groupedSlots[key].push(slot);
      });

      // 3. Merge contiguous 15-min chunks
      const mergedSlots: Array<{
        uuid?: string;
        service_id: string;
        vendor_id: string;
        show_all_vendors: number;
        schedule_override: number;
        recommend_time: number;
        travel?: string;
        start_time: string;
        end_time: string;
        est_time: number | null;
        distance: number | null;
        km_price: number | null;
        date: string;
      }> = [];

      Object.values(groupedSlots).forEach((slots) => {
        const sortedSlots = slots.sort((a, b) => a.start_time.localeCompare(b.start_time));
        let isContiguous = true;
        for (let i = 0; i < sortedSlots.length - 1; i++) {
          if (sortedSlots[i].end_time !== sortedSlots[i + 1].start_time) {
            isContiguous = false;
            break;
          }
        }

        if (!isContiguous) {
          sortedSlots.forEach((slot) => {
            mergedSlots.push({
              ...(slot.uuid && { uuid: slot.uuid }),
              service_id: slot.service_id,
              vendor_id: slot.vendor_id,
              show_all_vendors: slot.show_all_vendors ? 1 : 0,
              schedule_override: slot.schedule_override ? 1 : 0,
              recommend_time: slot.recommend_time ? 1 : 0,
              travel: slot.travel ?? undefined,
              start_time: slot.start_time,
              end_time: slot.end_time,
              est_time: slot.est_time ?? null,
              distance: slot.distance ?? null,
              km_price: slot.km_price ?? null,
              date: slot.date,
            });
          });
        } else {
          const firstSlot = sortedSlots[0];
          const lastSlot = sortedSlots[sortedSlots.length - 1];
          mergedSlots.push({
            ...(firstSlot.uuid && { uuid: firstSlot.uuid }),
            service_id: firstSlot.service_id,
            vendor_id: firstSlot.vendor_id,
            show_all_vendors: firstSlot.show_all_vendors ? 1 : 0,
            schedule_override: firstSlot.schedule_override ? 1 : 0,
            recommend_time: firstSlot.recommend_time ? 1 : 0,
            travel: firstSlot.travel ?? undefined,
            start_time: firstSlot.start_time,
            end_time: lastSlot.end_time,
            est_time: firstSlot.est_time ?? null,
            distance: firstSlot.distance ?? null,
            km_price: firstSlot.km_price ?? null,
            date: firstSlot.date,
          });
        }
      });

      // 4. Build services payload
      const servicesPayload = selectedServices.map((service) => {
        const matchedSlot = selectedSlots.find(
          (slot) =>
            slot.service_id === service.uuid ||
            String(slot.service_id) === String(service.uuid) ||
            (service.id && String(slot.service_id) === String(service.id))
        );
        const resolvedVendorId =
          (service as any).vendor_id ||
          matchedSlot?.vendor_id ||
          matchedSlot?.vendor?.uuid ||
          undefined;

        return {
          ...(service.service_uuid && { uuid: service.service_uuid }),
          service_id: service.uuid as string,
          option_id: service.option_id ?? undefined,
          amount: Number((Number(service.price) || 0).toFixed(2)),
          vendor_id: resolvedVendorId,
          custom: service.custom ?? undefined,
          add_ons:
            (service as any).addOns && (service as any).addOns.length > 0
              ? (service as any).addOns
              : undefined,
        };
      });

      // 5. Total calculation
      const updatedTotal = Number((Number(orderData.amount || 0) + newServicesSubtotal).toFixed(2));

      // 6. Notes parsing
      let parsedNotes: any[] = [];
      if (typeof orderData.notes === "string") {
        try {
          parsedNotes = JSON.parse(orderData.notes);
        } catch {
          parsedNotes = [];
        }
      } else if (Array.isArray(orderData.notes)) {
        parsedNotes = orderData.notes;
      }

      // 7. Co-agents parsing
      let parsedCoAgents: any[] = [];
      if (typeof orderData.co_agents === "string") {
        try {
          parsedCoAgents = JSON.parse(orderData.co_agents);
        } catch {
          parsedCoAgents = [];
        }
      } else if (Array.isArray(orderData.co_agents)) {
        parsedCoAgents = orderData.co_agents;
      }

      const payload: OrderPayload = {
        agent_id: orderData.agent?.uuid || "",
        property_id: orderData.property?.uuid || "",
        amount: updatedTotal,
        order_status: orderData.order_status || "Processing",
        payment_status: orderData.payment_status || "UNPAID",
        split_invoice: orderData.split_invoice ? 1 : 0,
        is_add_service: 1,
        co_agents: parsedCoAgents,
        notes: parsedNotes,
        services: servicesPayload,
        discounts: [],
        slots: mergedSlots,
      };

      const updatedPayload = { ...payload, _method: "PUT" };
      const response = await Edit(orderData.uuid, updatedPayload, token);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to add services");
      }

      toast.success("Services added successfully!");
      handleClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Failed to add service:", err);
      toast.error(err?.message || "Failed to add service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-[95vw] md:max-w-[85vw] lg:max-w-[1250px] w-full h-[90vh] flex flex-col p-0 font-alexandria overflow-hidden rounded-[8px]">
        {/* Header */}
        <div className="px-6 py-4 border-b flex flex-col gap-2 shrink-0 bg-white">
          <DialogHeader className="p-0">
            <DialogTitle className="text-xl font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>Add Service</span>
                <span className="text-sm font-normal text-gray-500">
                  Order #{orderData?.id} ({orderData?.property?.address || orderData?.property_address})
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* 2 Tabs: Services and Schedule */}
          <div className="pt-2">
            <OrderStepper
              currentTab={activeTab}
              onTabChange={(tab) => {
                if (canNavigateTo(tab)) {
                  setActiveTab(tab);
                  setInvalidServices([]);
                }
              }}
              steps={STEPS}
              canNavigateTo={canNavigateTo}
              userType={role}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#FAFAFA]">
          {activeTab === "services" && (
            <div>
              <Services showAll={false} />
            </div>
          )}

          {activeTab === "schedule" && (
            <div>
              <Schedule invalidServices={invalidServices} />
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 text-sm font-medium">
            {activeTab === "services" ? (
              <div>
                <span className="text-gray-600">Selected New Services: </span>
                <span className="font-bold text-gray-900">{newServices.length}</span>
                {newServicesSubtotal > 0 && (
                  <span className="ml-2 text-gray-500">
                    (${newServicesSubtotal.toFixed(2)})
                  </span>
                )}
              </div>
            ) : (
              <div>
                <span className="text-gray-600">Additional Subtotal: </span>
                <span className="font-bold text-gray-900">
                  ${newServicesSubtotal.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-[38px] px-4 rounded-[4px]"
            >
              Cancel
            </Button>

            {activeTab === "services" ? (
              <Button
                onClick={handleNextToSchedule}
                disabled={newServices.length === 0}
                className="h-[38px] px-6 rounded-[4px] text-white font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                style={{
                  backgroundColor: currentRoleSettings.pageTabColor,
                  borderColor: currentRoleSettings.pageTabColor,
                }}
              >
                Next: Schedule
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveTab("services");
                    setInvalidServices([]);
                  }}
                  disabled={isSubmitting}
                  className="h-[38px] px-4 rounded-[4px]"
                >
                  Back to Services
                </Button>

                <Button
                  onClick={handleSaveServices}
                  disabled={isSubmitting}
                  className="h-[38px] px-6 rounded-[4px] text-white font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: currentRoleSettings.pageTabColor,
                    borderColor: currentRoleSettings.pageTabColor,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Services"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
