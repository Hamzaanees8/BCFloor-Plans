"use client";
import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeftRight, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/app/context/AppContext";
import { Order, Slot } from "../../orders/page";
import { CalanderVendor } from "./BigCalendar";
import { Services } from "../../services/page";
import { ReassignBookingSlot, SwapBookingSlots } from "../calendar";

// ── Types ────────────────────────────────────────────────────────────────────

interface VendorSwapReassignModalProps {
  open: boolean;
  onClose: () => void;
  currentOrder: Order;
  currentService: Services;
  vendors: CalanderVendor[];
  allOrders?: Order[]; // needed for swap: find slots of other vendors
  refreshOrders?: () => void;
}

type Mode = "reassign" | "swap";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Return the slot that matches the current order + service (the "source" slot) */
function findSourceSlot(order: Order, service: Services): Slot | undefined {
  return order.slots?.find((s) => {
    const svcId = String(s.service_id);
    return svcId === String(service.id) || svcId === String(service.uuid);
  });
}

/** Check whether two slots overlap in time on the same date */
function slotsOverlap(a: Slot, b: Slot): boolean {
  if (a.date !== b.date) return false;
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const aStart = toMin(a.start_time);
  const aEnd = toMin(a.end_time);
  const bStart = toMin(b.start_time);
  const bEnd = toMin(b.end_time);
  return aStart < bEnd && bStart < aEnd;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VendorSwapReassignModal({
  open,
  onClose,
  currentOrder,
  currentService,
  vendors,
  allOrders = [],
  refreshOrders,
}: VendorSwapReassignModalProps) {
  const { userType } = useAppContext();
  const [mode, setMode] = useState<Mode>("reassign");
  const [selectedVendorUuid, setSelectedVendorUuid] = useState("");
  const [selectedSlotUuid, setSelectedSlotUuid] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ── Source slot (the slot we are acting on) ──
  const sourceSlot = useMemo(
    () => findSourceSlot(currentOrder, currentService),
    [currentOrder, currentService],
  );

  const currentVendorUuid =
    sourceSlot?.vendor?.uuid ?? sourceSlot?.vendor_id ?? "";

  // ── Reassign mode: vendors eligible for reassignment ──
  // Exclude the current vendor (self-selection exclusion)
  const reassignableVendors = useMemo(
    () => vendors.filter((v) => v.uuid !== currentVendorUuid),
    [vendors, currentVendorUuid],
  );

  // ── Swap mode: collect all slots from other orders whose vendor matches a selected vendor
  //   and whose service matches the current service ──
  const swappableSlots = useMemo(() => {
    if (mode !== "swap" || !selectedVendorUuid) return [];

    const results: {
      label: string;
      slotUuid: string;
      slot: Slot;
      order: Order;
    }[] = [];

    for (const order of allOrders) {
      if (order.uuid === currentOrder.uuid) continue; // skip same order
      for (const slot of order.slots ?? []) {
        if (String(slot.vendor?.uuid ?? slot.vendor_id) !== selectedVendorUuid)
          continue;

        // Service match (by id or uuid)
        const svcMatch =
          String(slot.service_id) === String(currentService.id) ||
          String(slot.service_id) === String(currentService.uuid);
        if (!svcMatch) continue;

        // Conflict detection: skip if slots already overlap
        if (sourceSlot && slotsOverlap(sourceSlot, slot)) continue;

        const label = `Order #${order.id} – ${slot.date} ${slot.start_time.slice(0, 5)}–${slot.end_time.slice(0, 5)}`;
        results.push({ label, slotUuid: slot.uuid, slot, order });
      }
    }
    return results;
  }, [
    mode,
    selectedVendorUuid,
    allOrders,
    currentOrder,
    currentService,
    sourceSlot,
  ]);

  // ── Swap mode: vendors that have at least one swappable slot for this service ──
  const swappableVendors = useMemo(() => {
    if (mode !== "swap") return [];
    const vendorUuids = new Set<string>();

    for (const order of allOrders) {
      if (order.uuid === currentOrder.uuid) continue;
      for (const slot of order.slots ?? []) {
        const svcMatch =
          String(slot.service_id) === String(currentService.id) ||
          String(slot.service_id) === String(currentService.uuid);
        if (!svcMatch) continue;
        if (sourceSlot && slotsOverlap(sourceSlot, slot)) continue;
        const vid = String(slot.vendor?.uuid ?? slot.vendor_id);
        if (vid && vid !== currentVendorUuid) vendorUuids.add(vid);
      }
    }

    return vendors.filter((v) => v.uuid && vendorUuids.has(v.uuid));
  }, [
    mode,
    allOrders,
    currentOrder,
    currentService,
    sourceSlot,
    vendors,
    currentVendorUuid,
  ]);

  // ── Reset selections when mode changes ──
  const handleModeChange = (m: Mode) => {
    setMode(m);
    setSelectedVendorUuid("");
    setSelectedSlotUuid("");
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const token = localStorage.getItem("token") || "";

    if (!sourceSlot?.uuid) {
      toast.error("Could not find the booking slot for this service.");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "reassign") {
        if (!selectedVendorUuid) {
          toast.error("Please select a vendor.");
          return;
        }
        await ReassignBookingSlot(sourceSlot.uuid, selectedVendorUuid, token);
        toast.success("Vendor reassigned successfully.");
      } else {
        if (!selectedSlotUuid) {
          toast.error("Please select a slot to swap with.");
          return;
        }
        await SwapBookingSlots(sourceSlot.uuid, selectedSlotUuid, token);
        toast.success("Slots swapped successfully.");
      }

      if (refreshOrders) refreshOrders();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Operation failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const isSubmitDisabled =
    isLoading ||
    (mode === "reassign" ? !selectedVendorUuid : !selectedSlotUuid);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[55vw] max-w-[55vw] font-alexandria">
        <DialogHeader>
          <DialogTitle className={`text-[20px] font-[600] ${userType}-text`}>
            Reassign / Swap Vendor
          </DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => handleModeChange("reassign")}
            className={`flex items-center gap-1.5 px-4 py-2 text-[13px] border transition-colors rounded-none flex-1 justify-center ${
              mode === "reassign"
                ? `${userType}-bg ${userType}-border text-white`
                : `bg-transparent ${userType}-border ${userType}-text`
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Reassign
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("swap")}
            className={`flex items-center gap-1.5 px-4 py-2 text-[13px] border transition-colors rounded-none flex-1 justify-center ${
              mode === "swap"
                ? `${userType}-bg ${userType}-border text-white`
                : `bg-transparent ${userType}-border ${userType}-text`
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            Swap
          </button>
        </div>

        <div className="flex flex-col gap-4 py-2">
          {/* Service label */}
          <p className="text-[#666666] text-[13px]">
            {mode === "reassign" ? (
              <>
                Select a new vendor for <strong>{currentService?.name}</strong>{" "}
                on Order <strong>#{currentOrder.id}</strong>.
              </>
            ) : (
              <>
                Swap the <strong>{currentService?.name}</strong> slot on Order{" "}
                <strong>#{currentOrder.id}</strong> with another vendor&apos;s
                slot for the same service.
              </>
            )}
          </p>

          {/* ── REASSIGN mode ── */}
          {mode === "reassign" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-[700] text-[#8E8E8E] uppercase tracking-wide">
                New Vendor
              </label>
              {reassignableVendors.length === 0 ? (
                <p className="text-[13px] text-[#8E8E8E] italic">
                  No other vendors available.
                </p>
              ) : (
                <Select
                  value={selectedVendorUuid}
                  onValueChange={setSelectedVendorUuid}
                >
                  <SelectTrigger className="w-full h-[42px] border-[1px] border-[#BBBBBB] bg-[#EEEEEE]">
                    <SelectValue placeholder="Select Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {reassignableVendors.map((v) => (
                      <SelectItem key={v.uuid} value={v.uuid ?? ""}>
                        {v.first_name} {v.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* ── SWAP mode – step 1: pick vendor ── */}
          {mode === "swap" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-[700] text-[#8E8E8E] uppercase tracking-wide">
                  Vendor to swap with
                </label>
                {swappableVendors.length === 0 ? (
                  <p className="text-[13px] text-[#8E8E8E] italic">
                    No vendors with a matching, non-overlapping slot found.
                  </p>
                ) : (
                  <Select
                    value={selectedVendorUuid}
                    onValueChange={(v) => {
                      setSelectedVendorUuid(v);
                      setSelectedSlotUuid("");
                    }}
                  >
                    <SelectTrigger className="w-full h-[42px] border-[1px] border-[#BBBBBB] bg-[#EEEEEE]">
                      <SelectValue placeholder="Select Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {swappableVendors.map((v) => (
                        <SelectItem key={v.uuid} value={v.uuid ?? ""}>
                          {v.first_name} {v.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* step 2: pick which of their slots to swap */}
              {selectedVendorUuid && swappableSlots.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-[700] text-[#8E8E8E] uppercase tracking-wide">
                    Slot to swap with
                  </label>
                  <Select
                    value={selectedSlotUuid}
                    onValueChange={setSelectedSlotUuid}
                  >
                    <SelectTrigger className="w-full h-[42px] border-[1px] border-[#BBBBBB] bg-[#EEEEEE]">
                      <SelectValue placeholder="Select Slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {swappableSlots.map((item) => (
                        <SelectItem key={item.slotUuid} value={item.slotUuid}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedVendorUuid && swappableSlots.length === 0 && (
                <p className="text-[13px] text-[#8E8E8E] italic">
                  No eligible slots found for this vendor.
                </p>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className={`border-[1px] ${userType}-border ${userType}-text hover-${userType}-bg hover:text-white rounded-none w-[120px]`}
          >
            Cancel
          </Button>
          <Button
            disabled={isSubmitDisabled}
            onClick={handleSubmit}
            className={`${userType}-bg ${userType}-border text-white rounded-none w-[140px] hover:brightness-110`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === "reassign" ? (
              "Reassign"
            ) : (
              "Swap Slots"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
