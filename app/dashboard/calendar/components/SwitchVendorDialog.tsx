'use client'
import React, { useState } from "react";
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
import { EditOrder, OrderPayload } from "../../calendar/calendar";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAppContext } from "@/app/context/AppContext";
import { Order } from "../../orders/page";
import { CalanderVendor } from "../../calendar/components/BigCalendar";
import { Services } from "../../services/page";

interface SwitchVendorDialogProps {
    open: boolean;
    onClose: () => void;
    currentOrder: Order;
    currentService: Services;
    vendors: CalanderVendor[];
    refreshOrders?: () => void;
}

export default function SwitchVendorDialog({
    open,
    onClose,
    currentOrder,
    currentService,
    vendors,
    refreshOrders,
}: SwitchVendorDialogProps) {
    const { userType } = useAppContext();
    const [selectedVendor, setSelectedVendor] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSwitchVendor = async () => {
        if (!selectedVendor) {
            toast.error("Please select a vendor");
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token') || '';

            // Reconstruct the order payload
            const orderServicesPayload = (currentOrder.services || []).map(service => ({
                ...(service.uuid && { uuid: service.uuid }),
                service_id: service.service?.uuid as string,
                option_id: service?.option?.uuid ?? undefined,
                amount: Number(service?.amount) as number,
                custom: service.custom,
            }));

            const slotsPayload = (currentOrder.slots || []).map(slot => {
                let vendorId = slot.vendor_id;
                
                // Map the service_id to its UUID if it's currently an integer ID
                let mappedServiceId = String(slot.service_id);
                const matchingService = currentOrder.services?.find(
                    s => String(s.service?.id) === String(slot.service_id) || String(s.service?.uuid) === String(slot.service_id)
                );
                
                if (matchingService && matchingService.service?.uuid) {
                    mappedServiceId = matchingService.service.uuid;
                }

                // If this slot belongs to the current service, update its vendor
                if (mappedServiceId === String(currentService.uuid) || mappedServiceId === String(currentService.id)) {
                    vendorId = selectedVendor;
                } else if (slot.vendor && slot.vendor.uuid) {
                    vendorId = slot.vendor.uuid;
                }

                return {
                    ...(slot.uuid && { uuid: slot.uuid }),
                    service_id: mappedServiceId,
                    vendor_id: vendorId,
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
                };
            });

            const allNotes = typeof currentOrder.notes === 'string'
                ? JSON.parse(currentOrder.notes)
                : currentOrder.notes || [];

            let parsedCoAgents = [];
            if (typeof currentOrder.co_agents === "string") {
                parsedCoAgents = JSON.parse(currentOrder.co_agents);
            } else if (Array.isArray(currentOrder.co_agents)) {
                parsedCoAgents = currentOrder.co_agents;
            }

            const payload: OrderPayload = {
                agent_id: String(currentOrder?.agent?.uuid) || "",
                property_id: currentOrder?.property.uuid || "",
                amount: Number(currentOrder?.amount) || 0,
                order_status: currentOrder?.order_status || "Processing",
                payment_status: currentOrder?.payment_status || "UNPAID",
                split_invoice: currentOrder?.split_invoice ? 1 : 0,
                co_agents: parsedCoAgents,
                notes: allNotes,
                services: orderServicesPayload,
                slots: slotsPayload,
                areas: currentOrder.areas || [],
                is_add_service: 0,
            };

            const updatedPayload = { ...payload, _method: 'PUT' };
            const response = await EditOrder(currentOrder.uuid ?? "", updatedPayload, token);

            if (response?.success || response?.data) {
                toast.success('Vendor switched successfully');
                if (refreshOrders) refreshOrders();
                onClose();
            } else {
                toast.error("Something went wrong");
            }
        } catch (error: any) {
            const apiErrors = error.response?.data?.errors || error.errors;
            if (apiErrors && typeof apiErrors === "object") {
                const firstError = Object.values(apiErrors).flat()[0] as string;
                toast.error(firstError || "Failed to switch vendor");
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("Failed to switch vendor");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[90vw] max-w-[450px] font-alexandria">
                <DialogHeader>
                    <DialogTitle className={`text-[20px] font-[600] ${userType}-text`}>
                        Switch Vendor
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <p className="text-[#666666] text-[14px]">
                        Select a new vendor for <strong>{currentService?.name}</strong>.
                    </p>
                    <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                        <SelectTrigger className="w-full h-[42px] border-[1px] border-[#BBBBBB] bg-[#EEEEEE]">
                            <SelectValue placeholder="Select Vendor" />
                        </SelectTrigger>
                        <SelectContent>
                            {vendors.map((v) => (
                                <SelectItem key={v.uuid} value={v.uuid || ""}>
                                    {v.first_name} {v.last_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className={`border-[1px] ${userType}-border ${userType}-text hover-${userType}-bg hover:text-white rounded-none w-[120px]`}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={isLoading || !selectedVendor}
                        onClick={handleSwitchVendor}
                        className={`${userType}-bg ${userType}-border text-white rounded-none w-[120px] hover:brightness-110`}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
