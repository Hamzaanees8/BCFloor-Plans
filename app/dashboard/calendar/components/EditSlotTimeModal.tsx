"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, Calendar, User, MapPin } from "lucide-react";
import { CalendarEvent } from "./BigCalendar";
import { Order } from "../../orders/page";
import { Services } from "../../services/page";
import OneDayCalendar from "../../orders/components/OneDayCalendar";
import { useOrderContext, Slot } from "../../orders/context/OrderContext";
import { splitSlotInto15MinChunks } from "../../orders/utils/serviceTimeUtils";
import { UpdateSlotTime, getPropertyTimezone } from "../../orders/orders";
import { toast } from "sonner";
import dayjs from "dayjs";
import { addMinutes, format, parse, differenceInMinutes } from "date-fns";

interface EditSlotTimeModalProps {
  open: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  orderData: Order[];
  vendorData: any[];
  serviceData: Services[];
  refreshOrders: () => void;
}

export const EditSlotTimeModal: React.FC<EditSlotTimeModalProps> = ({
  open,
  onClose,
  event,
  orderData,
  vendorData,
  serviceData,
  refreshOrders,
}) => {
  const context = useOrderContext();
  const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Form inputs
  const [startTime, setStartTime] = useState<string>("08:00:00");
  const [endTime, setEndTime] = useState<string>("09:00:00");
  const [propertyTimezone, setPropertyTimezone] = useState<string | undefined>(
    undefined,
  );
  const [hasInitialized, setHasInitialized] = useState(false);

  // Retrieve order and relevant entities
  const currentOrder = useMemo(() => {
    if (!event || !orderData) return null;
    return orderData.find((o) => o.uuid === event.order_id) || null;
  }, [event, orderData]);

  const globalService = useMemo(() => {
    if (!event || !serviceData) return null;
    return (
      serviceData.find(
        (s) =>
          String(s.id) === String(event.service_id) ||
          s.uuid === (event.service_id as unknown as string),
      ) || null
    );
  }, [event, serviceData]);

  const currentVendor = useMemo(() => {
    if (!event || !vendorData) return null;
    return (
      vendorData.find(
        (v) =>
          v.uuid === event.vendor_id ||
          String(v.id) === String(event.vendor_id),
      ) || null
    );
  }, [event, vendorData]);

  const vendorUuid = useMemo(() => {
    return (
      currentVendor?.uuid ||
      (typeof event?.vendor_id === "string"
        ? event.vendor_id
        : String(event?.vendor_id || ""))
    );
  }, [currentVendor, event]);

  const matchedOrderService = useMemo(() => {
    if (!currentOrder || !event) return null;
    return (
      currentOrder.services?.find(
        (os) =>
          String(os.service_id) === String(event.service_id) ||
          os.service?.uuid === (event.service_id as unknown as string) ||
          String(os.service_id) === globalService?.uuid,
      ) || null
    );
  }, [currentOrder, event, globalService]);

  const matchedSlot = useMemo(() => {
    if (!currentOrder || !event) return null;
    return (
      currentOrder.slots?.find(
        (s) =>
          String(s.service_id) === String(event.service_id) ||
          String(s.service_id) === globalService?.uuid,
      ) || null
    );
  }, [currentOrder, event, globalService]);

  const dateStr = useMemo(() => {
    if (!event) return "";
    return dayjs(event.start).format("YYYY-MM-DD");
  }, [event]);

  useEffect(() => {
    if (!currentOrder) return;
    const fetchTimezone = async () => {
      try {
        const loc = await getPropertyTimezone(
          currentOrder.property_address || "",
        );
        setPropertyTimezone(loc?.timeZoneId || undefined);
      } catch (err) {
        console.error("Failed to fetch property timezone:", err);
      }
    };
    fetchTimezone();
  }, [currentOrder]);

  // Populate OrderContext fields for OneDayCalendar
  useEffect(() => {
    if (open && currentOrder && context) {
      // Set ordersData so slot calculation can fetch other bookings only if they differ
      if (context.ordersData !== orderData) {
        context.setOrdersData(orderData);
      }

      if (globalService) {
        const hasSvc = (context.selectedServices || []).some(
          (s) =>
            s.uuid === globalService.uuid ||
            String(s.id) === String(globalService.id),
        );
        if (!hasSvc) {
          context.setSelectedServices([globalService as any]);
        }
      }

      // Mock selected listing for address & square footage lookup only if they differ
      const currentListing = context.selectedCurrentListing;
      const targetAddress = currentOrder.property_address || "";
      const targetCity = currentOrder.property?.city || "";
      const targetCountry = currentOrder.property?.country || "";
      const targetSqFt = Number(currentOrder.property?.square_footage || 0);

      if (
        !currentListing ||
        currentListing.address !== targetAddress ||
        currentListing.city !== targetCity ||
        currentListing.country !== targetCountry ||
        Number(currentListing.square_footage) !== targetSqFt
      ) {
        const mockListing = {
          address: targetAddress,
          city: targetCity,
          country: targetCountry,
          square_footage: targetSqFt,
        } as any;
        context.setSelectedCurrentListing(mockListing);
      }
    }
  }, [open, currentOrder, orderData, context, globalService]);

  // Initialize state when modal is opened
  useEffect(() => {
    if (!open) {
      setHasInitialized(false);
      return;
    }

    if (event && open && globalService && !hasInitialized) {
      const startStr = dayjs(event.start).format("HH:mm:ss");
      const endStr = dayjs(event.end).format("HH:mm:ss");
      setStartTime(startStr);
      setEndTime(endStr);

      const chunks = splitSlotInto15MinChunks(startStr, endStr);
      const slots = chunks.map((chunk) => ({
        date: dateStr,
        start_time: chunk.start_time,
        end_time: chunk.end_time,
        service_id: globalService.uuid || "",
        vendor_id: vendorUuid || "",
        show_all_vendors: 1,
        schedule_override: 1,
        recommend_time: 0,
        travel: null,
        est_time: null,
        distance: null,
        km_price: null,
      }));
      setSelectedSlots(slots);
      setHasInitialized(true);
    }
  }, [event, open, globalService, dateStr, hasInitialized, vendorUuid]);

  // Sync input pickers when selectedSlots changes via OneDayCalendar interaction
  useEffect(() => {
    const sorted = [...selectedSlots].sort((a, b) =>
      a.start_time.localeCompare(b.start_time),
    );
    if (sorted.length > 0) {
      const startVal = sorted[0].start_time;
      const endVal = sorted[sorted.length - 1].end_time;
      setStartTime((prev) => (prev !== startVal ? startVal : prev));
      setEndTime((prev) => (prev !== endVal ? endVal : prev));
    }
  }, [selectedSlots]);

  // Compute external bookings to show as locked slots
  const externalBookedSlots = useMemo(() => {
    if (!event || !orderData) return [];
    const targetOrderUuid = currentOrder?.uuid || event.order_id;
    const targetOrderId = currentOrder?.id;

    const slots = orderData
      .flatMap((o) => {
        return (o.slots || []).map((s) => {
          const serviceObj = serviceData.find(
            (srv) =>
              String(srv.id) === String(s.service_id) ||
              srv.uuid === String(s.service_id),
          );
          const vendorObj = vendorData.find(
            (v) =>
              String(v.id) === String(s.vendor_id) ||
              v.uuid === String(s.vendor_id),
          );
          const matchedOS = o.services?.find(
            (os: any) =>
              String(os.service_id) === String(s.service_id) ||
              os.service?.uuid === s.service_id ||
              String(os.service?.id) === String(s.service_id),
          );

          const slotVendorUuid = vendorObj?.uuid || String(s.vendor_id);
          const slotServiceUuid = serviceObj?.uuid || String(s.service_id);

          return {
            ...s,
            order_id: o.id,
            order_uuid: o.uuid,
            order_service_id:
              matchedOS?.uuid ||
              (s as any).order_service_id ||
              (s as any).order_service?.uuid ||
              "",
            slot_uuid: s.uuid || "",
            service_uuid: slotServiceUuid,
            vendor_uuid: slotVendorUuid,
            property_address: o.property_address || "",
            agent_name: o.agent
              ? `${o.agent.first_name} ${o.agent.last_name}`
              : "N/A",
            service_name:
              serviceObj?.name || (s as any).service?.name || "Service",
            vendor_name: vendorObj
              ? `${vendorObj.first_name} ${vendorObj.last_name}`
              : (s as any).vendor
                ? `${(s as any).vendor.first_name} ${(s as any).vendor.last_name}`
                : "N/A",
          };
        });
      })
      .filter((s) => {
        // Exclude ONLY the current service slot being edited in current order
        const isCurrentOrder =
          s.order_uuid === targetOrderUuid ||
          String(s.order_id) === String(targetOrderId) ||
          String(s.order_id) === String(event.order_id);
        const isCurrentService =
          globalService &&
          (s.service_uuid === globalService.uuid ||
            String(s.service_id) === String(globalService.id) ||
            String(s.service_id) === String(event.service_id));

        if (isCurrentOrder && isCurrentService) {
          return false;
        }
        return true;
      });

    return slots.map((s) => ({
      ...s,
      service_id: s.service_uuid || String(s.service_id),
      vendor_id: s.vendor_uuid || String(s.vendor_id),
      show_all_vendors: s.show_all_vendors ? 1 : 0,
      schedule_override: s.schedule_override ? 1 : 0,
      recommend_time: s.recommend_time ? 1 : 0,
    })) as Slot[];
  }, [event, orderData, serviceData, vendorData, currentOrder, globalService]);

  // Time generation helper for dropdown selectors
  const timeOptions = useMemo(() => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        const val = `${hh}:${mm}:00`;
        const meridian = h >= 12 ? "PM" : "AM";
        const displayHour = h % 12 || 12;
        const label = `${String(displayHour).padStart(2, "0")}:${mm} ${meridian}`;
        options.push({ value: val, label });
      }
    }
    return options;
  }, []);

  // Regenerate selected slots when range changes manually via inputs or adjusters
  const updateTimeRange = (newStart: string, newEnd: string) => {
    if (!event || !globalService) return;
    const chunks = splitSlotInto15MinChunks(newStart, newEnd);
    const slots = chunks.map((chunk) => ({
      date: dateStr,
      start_time: chunk.start_time,
      end_time: chunk.end_time,
      service_id: globalService.uuid || "",
      vendor_id: vendorUuid || "",
      show_all_vendors: 1,
      schedule_override: 1,
      recommend_time: 0,
      travel: null,
      est_time: null,
      distance: null,
      km_price: null,
    }));
    setSelectedSlots(slots);
    setStartTime(newStart);
    setEndTime(newEnd);
  };

  // Duration adjustments (+/- minutes)
  const adjustEndTime = (minutes: number) => {
    const parsedStart = parse(
      `2000-01-01 ${startTime}`,
      "yyyy-MM-dd HH:mm:ss",
      new Date(),
    );
    const parsedEnd = parse(
      `2000-01-01 ${endTime}`,
      "yyyy-MM-dd HH:mm:ss",
      new Date(),
    );
    const newEnd = addMinutes(parsedEnd, minutes);

    if (differenceInMinutes(newEnd, parsedStart) < 15) {
      toast.warning("Duration cannot be less than 15 minutes.");
      return;
    }

    updateTimeRange(startTime, format(newEnd, "HH:mm:ss"));
  };

  const adjustStartTime = (minutes: number) => {
    const parsedStart = parse(
      `2000-01-01 ${startTime}`,
      "yyyy-MM-dd HH:mm:ss",
      new Date(),
    );
    const parsedEnd = parse(
      `2000-01-01 ${endTime}`,
      "yyyy-MM-dd HH:mm:ss",
      new Date(),
    );
    const newStart = addMinutes(parsedStart, minutes);

    if (differenceInMinutes(parsedEnd, newStart) < 15) {
      toast.warning("Duration cannot be less than 15 minutes.");
      return;
    }

    updateTimeRange(format(newStart, "HH:mm:ss"), endTime);
  };

  const handleSave = async () => {
    if (
      !event ||
      !currentOrder ||
      !globalService ||
      !matchedSlot ||
      !matchedOrderService
    ) {
      toast.error("Required booking details are missing.");
      return;
    }

    const sorted = [...selectedSlots].sort((a, b) =>
      a.start_time.localeCompare(b.start_time),
    );
    if (sorted.length === 0) {
      toast.error("Please select at least one time slot block.");
      return;
    }

    const start_time = sorted[0].start_time;
    const end_time = sorted[sorted.length - 1].end_time;
    const token =
      localStorage.getItem("token") || localStorage.getItem("agentToken") || "";

    setIsSaving(true);
    try {
      await UpdateSlotTime(
        {
          order_uuid: currentOrder.uuid,
          order_service_id: matchedOrderService.uuid,
          service_uuid: globalService.uuid,
          slot_uuid: matchedSlot.uuid || "",
          vendor_uuid: vendorUuid || "",
          date: dateStr,
          start_time,
          end_time,
        },
        token,
      );
      toast.success("Slot time updated successfully.");
      refreshOrders();
      onClose();
    } catch (err: any) {
      console.error("Failed to update slot time:", err);
      toast.error(err?.message || "Failed to update slot time.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!event || !currentOrder || !globalService) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[45vw] w-[45vw] min-w-[500px] p-6 font-alexandria bg-white rounded-xl shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-y-auto">
        <DialogHeader className="border-b border-gray-100 pb-4 mb-4">
          <DialogTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#6bae41]" />
            <span>Edit Time & Duration (Admin Override)</span>
          </DialogTitle>
        </DialogHeader>

        {/* Booking & Context Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4  bg-gray-50/50 p-4 rounded-lg border border-gray-100/50 text-[13px]">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <span className="font-semibold text-gray-800 min-w-[100px]">
                Order ID:
              </span>
              <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono font-bold">
                #{currentOrder.id}
              </span>
            </div>
            <div className="flex items-start gap-2 text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span className="font-semibold text-gray-800 min-w-[80px]">
                Address:
              </span>
              <span className="truncate">{currentOrder.property_address}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="font-semibold text-gray-800 min-w-[80px]">
                Agent:
              </span>
              <span>
                {currentOrder.agent
                  ? `${currentOrder.agent.first_name} ${currentOrder.agent.last_name}`
                  : "N/A"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="font-semibold text-gray-800 min-w-[80px]">
                Date:
              </span>
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="font-semibold text-gray-800 min-w-[100px]">
                Service:
              </span>
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium border border-blue-100">
                {globalService.name}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="font-semibold text-gray-800 min-w-[100px]">
                Vendor:
              </span>
              <span>
                {currentVendor
                  ? `${currentVendor.first_name} ${currentVendor.last_name}`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Time Range Pickers & Incremental Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50/20 border border-gray-100 p-4 rounded-lg  text-[13px]">
          <div className="flex flex-wrap items-center gap-4">
            {/* Start Time Select */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Start:</span>
              <select
                value={startTime}
                onChange={(e) => updateTimeRange(e.target.value, endTime)}
                className="border border-gray-200 rounded px-2.5 py-1.5 bg-white shadow-sm outline-none cursor-pointer hover:border-gray-300 transition-colors"
              >
                {timeOptions.map((opt) => (
                  <option key={`start-${opt.value}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-[11px]"
                  onClick={() => adjustStartTime(-15)}
                >
                  -15m
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-[11px]"
                  onClick={() => adjustStartTime(15)}
                >
                  +15m
                </Button>
              </div>
            </div>

            {/* End Time Select */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">End:</span>
              <select
                value={endTime}
                onChange={(e) => updateTimeRange(startTime, e.target.value)}
                className="border border-gray-200 rounded px-2.5 py-1.5 bg-white shadow-sm outline-none cursor-pointer hover:border-gray-300 transition-colors"
              >
                {timeOptions.map((opt) => (
                  <option key={`end-${opt.value}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-[11px]"
                  onClick={() => adjustEndTime(-15)}
                >
                  -15m
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-[11px]"
                  onClick={() => adjustEndTime(15)}
                >
                  +15m
                </Button>
              </div>
            </div>
          </div>

          <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200/50">
            Duration:{" "}
            {(() => {
              const parsedStart = parse(startTime, "HH:mm:ss", new Date());
              const parsedEnd = parse(endTime, "HH:mm:ss", new Date());
              const diff = differenceInMinutes(parsedEnd, parsedStart);
              if (diff <= 0) return "Invalid";
              const hours = Math.floor(diff / 60);
              const mins = diff % 60;
              return `${hours > 0 ? `${hours}h ` : ""}${mins > 0 ? `${mins}m` : ""}`;
            })()}
          </div>
        </div>

        {/* Step-3 Look & Feel: Interactive OneDayCalendar Component */}
        <div className="mb-4 w-[60%] mx-auto">
          <OneDayCalendar
            selectedVendors={vendorUuid ? [vendorUuid] : []}
            service={
              {
                uuid: globalService.uuid || "",
                id: globalService.id || 0,
                option_id: matchedOrderService?.option_id || undefined,
                title: globalService.name || "",
              } as any
            }
            recommendTime={0}
            showAllVendors={1}
            scheduleOverride={1}
            calendarIdx={0}
            serviceKey={globalService.uuid || ""}
            showAllVendorsMap={{ [globalService.uuid || ""]: 1 }}
            scheduleOverrideMap={{ [globalService.uuid || ""]: 1 }}
            recommendTimeMap={{ [globalService.uuid || ""]: 0 }}
            setSelectedDate={() => {}}
            vendorDistances={{}}
            propertyTimezone={propertyTimezone}
            masterDate={new Date(event.start)}
            externalSelectedSlots={selectedSlots}
            externalSetSelectedSlots={setSelectedSlots}
            externalBookedSlots={externalBookedSlots}
            externalVendorsData={vendorData}
            externalServicesData={serviceData}
            hideStatusBorder={true}
            className="mt-0"
          />
        </div>

        <DialogFooter className="border-t border-gray-100 pt-4 gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            className="bg-[#6bae41] hover:bg-[#5da034] text-white flex items-center gap-1.5 shadow"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Update Slot Time</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
