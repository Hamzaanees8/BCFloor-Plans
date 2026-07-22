'use client'
import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { X, Loader2 } from "lucide-react";
import { isPastBooking } from "@/lib/bookingUtils";
import { Button } from "@/components/ui/button";
import { Order } from "../../orders/page";
import { Agent } from "@/lib/types";
import { toast } from "sonner";
import { GetServices } from "../../orders/orders";
import WarningIcon from "@/components/Icons";
import { useAppContext } from "@/app/context/AppContext";
import { EditOrder } from "../../calendar/calendar";
import HistoryTab from "../../calendar/components/HistoryTab";
import NotificationModal from "../../calendar/components/NotificationModal";
import { useOrderContext } from "../context/OrderContext";
import EditAppointmentTab from "../../calendar/components/EditAppointmentTab";
import EditSquareFootage from "../../calendar/components/EditSquareFootage";
import { Services } from "../../services/page";
import { getEffectiveServiceDuration, splitSlotInto15MinChunks } from "../utils/serviceTimeUtils";
import { UpdatePropertySquareFootage } from "../../listings/listing";

interface OrderDetailViewProps {
    open: boolean;
    onClose: () => void;
    orderId: string
    orderData: Order[]
    serviceId: number;
    agentData: Agent[]
    refreshOrders?: () => void;
}
type AgentNote = {
    note: string;
    name: string;
    date: string;
};
export interface OrderPayload {
    agent_id: string;
    property_id: string;
    amount: number;
    order_status: "Processing" | "Completed" | "Cancelled" | string;
    payment_status: "UNPAID" | "PAID" | string;
    split_invoice: number;
    co_agents?: CoAgent[];
    notes: AgentNote[];
    services: {
        uuid?: string;
        service_id: string;
        option_id?: string;
        amount: number;
        custom?: string;
    }[];
    discounts?: {
        discount_id: string;
        type: "code" | "quantity" | "manual" | string;
        value: number;
        service_id?: string;
    }[];
    slots: {
        service_id: string;
        vendor_id: string;
        show_all_vendors?: number;
        schedule_override?: number;
        recommend_time?: number;
        travel?: string;
        start_time: string;
        end_time: string;
        est_time: number | null;
        distance?: number | null;
        km_price?: number | null;
        date: string;
    }[];
    areas: Area[];
    is_add_service?: number;
    update_invoice?: number;
}
interface Notes {
    name: string;
    note: string;
    date: string
}
export interface CoAgent {
    name: string;
    email?: string
    contact?: string;
    percentage?: number;
}
export interface Area {
    type: string;
    footage: number;
    custom_title?: string;
    uuid?: string;
    category?: "Finished" | "Subtotal" | "Other";
}
export default function OrderDetailView({ open, onClose, orderId, serviceId, orderData, agentData }: OrderDetailViewProps) {
    const { userType } = useAppContext();
    const [activeTab, setActiveTab] = useState<'appointment' | 'square_footage' | 'history'>('appointment');
    const [notes, setNotes] = useState<Notes[]>([]);
    const [coAgent, setCoAgent] = useState<CoAgent[]>([]);
    const [area, setArea] = useState<Area[]>([]);
    const [updateInvoice, setUpdateInvoice] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [agentChecked, setAgentChecked] = useState(false);
    const [vendorChecked, setVendorChecked] = useState(false);
    const [vendorSelected, setVendorSelected] = useState(false);
    const [showAgentModal, setShowAgentModal] = useState(false);
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const bothSelected = agentChecked && vendorChecked;
    const currentOrder = orderData?.find((order) => {
        return order?.uuid == orderId
    })
    const handleClose = () => {
        setAgentChecked(false);
        setVendorChecked(false);
    };
    const handleOkClick = () => {
        const both = agentChecked && vendorChecked;
        setVendorSelected(vendorChecked);

        if (both || agentChecked) {
            setShowAgentModal(true);
            setShowVendorModal(false);
            setShowNotification(true);
        } else if (vendorChecked) {
            setShowAgentModal(false);
            setShowVendorModal(true);
            setShowNotification(true);
        } else {
            // No notification selected, close the dialog
            onClose();
            setOrderServices([]);
            setSelectedSlots([]);
            setCalendarServices([]);
        }
    };

    const { calendarServices, selectedSlots, OrderServices, setOrderServices, setSelectedSlots, setCalendarServices, isLoading, setIsLoading, servicesData: contextServicesData, setServicesData: setContextServicesData } = useOrderContext();


    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token || contextServicesData.length > 0) {
            return;
        }

        GetServices(token)
            .then((data) => {
                setContextServicesData(data.data);
            })
            .catch((err) => console.log(err.message));
    }, [contextServicesData.length, setContextServicesData]);

    useEffect(() => {
        if (open && currentOrder) {
            // Only initialize local state when opening the dialog for a specific order.
            // Do not run refreshOrders here to prevent infinite loop.
            setOrderServices(currentOrder.services || []);
            setArea(currentOrder.areas || []);

            const allSlots = (currentOrder.slots || []).flatMap((slot: any) => {
                const chunks = splitSlotInto15MinChunks(slot.start_time, slot.end_time);
                return chunks.map(chunk => ({
                    ...slot,
                    start_time: chunk.start_time,
                    end_time: chunk.end_time,
                }));
            });
            setSelectedSlots(allSlots);
        }
        // Use currentOrder?.uuid to only re-run when a different order is selected,
        // avoiding overwrites when orderData array reference changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, currentOrder?.uuid, setOrderServices, setSelectedSlots]);

    // Sync service options with square footage when area changes
    useEffect(() => {
        if (area.length === 0) return;

        const finishedTotal = area
            .filter((a) => a.category === "Finished" || a.type === "Finished")
            .reduce((sum, a) => sum + (Number(a.footage) || 0), 0);
        const subtotalTotal = area
            .filter((a) => a.category === "Subtotal" || a.type === "Subtotal")
            .reduce((sum, a) => sum + (Number(a.footage) || 0), 0);
        const grandTotal = finishedTotal + subtotalTotal;

        if (grandTotal === 0) return;

        const calculatePrice = (option: any, sqFt: number) => {
            if (option?.sq_ft_rate && parseFloat(String(option.sq_ft_rate)) > 0) {
                const calculated = parseFloat(String(option.sq_ft_rate)) * sqFt;
                return option.min_price
                    ? Math.max(calculated, parseFloat(String(option.min_price)))
                    : calculated;
            }
            return parseFloat(String(option?.amount || 0));
        };

        // Update OrderServices
        setOrderServices((prev) => {
            let changed = false;
            const updated = prev.map((os) => {
                const service = contextServicesData.find((s) => s.uuid === os.service?.uuid);
                if (!service) return os;

                const name = service.name?.toLowerCase() || '';
                const cat = service.category?.name?.toLowerCase() || '';
                const keywords = ['photo', 'twilight', 'hdr', 'still', 'drone', 'video', 'pano', 'matterport'];
                const isPhotoService = keywords.some(k => name.includes(k) || cat.includes(k));

                // Skip switching if it's a photo service or custom option,
                // but still update price if it uses sq_ft_rate
                const currentOption = os.option;
                if (isPhotoService || os.option_id === "custom") {
                    const newPrice = calculatePrice(currentOption, grandTotal).toFixed(2);
                    if (os.amount !== newPrice) {
                        changed = true;
                        return { ...os, amount: newPrice };
                    }
                    return os;
                }

                let isCurrentValid = true;
                if (currentOption?.sq_ft_range) {
                    const [minStr, maxStr] = currentOption.sq_ft_range.split("-").map((s) => s.trim());
                    const min = parseInt(minStr, 10);
                    const max = parseInt(maxStr, 10);
                    if (!isNaN(min) && !isNaN(max)) {
                        isCurrentValid = grandTotal >= min && grandTotal <= max;
                    }
                }

                if (isCurrentValid) {
                    const newPrice = calculatePrice(currentOption, grandTotal).toFixed(2);
                    if (os.amount !== newPrice) {
                        changed = true;
                        return { ...os, amount: newPrice };
                    }
                    return os;
                }

                const correctOption = service.product_options?.find((opt) => {
                    if (!opt.sq_ft_range) return false;
                    const [minStr, maxStr] = opt.sq_ft_range.split("-").map((s) => s.trim());
                    const min = parseInt(minStr, 10);
                    const max = parseInt(maxStr, 10);
                    return !isNaN(min) && !isNaN(max) && grandTotal >= min && grandTotal <= max;
                });

                if (correctOption) {
                    changed = true;
                    return {
                        ...os,
                        option_id: correctOption.uuid,
                        option: correctOption as any,
                        amount: calculatePrice(correctOption, grandTotal).toFixed(2),
                        optionName: correctOption.title || ''
                    };
                }
                return os;
            });
            return changed ? updated : prev;
        });

        // Update calendarServices
        setCalendarServices((prev) => {
            let changed = false;
            const updated = prev.map((cs) => {
                const service = contextServicesData.find((s) => s.id === cs.serviceId);
                if (!service) return cs;

                const name = service.name?.toLowerCase() || '';
                const cat = service.category?.name?.toLowerCase() || '';
                const keywords = ['photo', 'twilight', 'hdr', 'still', 'drone', 'video', 'pano', 'matterport'];
                const isPhotoService = keywords.some(k => name.includes(k) || cat.includes(k));

                const currentOption = service.product_options?.find((opt) => opt.uuid === cs.optionId);

                if (isPhotoService || cs.optionId === "custom") {
                    const newPrice = calculatePrice(currentOption, grandTotal).toFixed(2);
                    if (cs.price !== newPrice) {
                        changed = true;
                        return { ...cs, price: newPrice };
                    }
                    return cs;
                }

                let isCurrentValid = true;
                if (currentOption?.sq_ft_range) {
                    const [minStr, maxStr] = currentOption.sq_ft_range.split("-").map((s) => s.trim());
                    const min = parseInt(minStr, 10);
                    const max = parseInt(maxStr, 10);
                    if (!isNaN(min) && !isNaN(max)) {
                        isCurrentValid = grandTotal >= min && grandTotal <= max;
                    }
                }

                if (isCurrentValid) {
                    const newPrice = calculatePrice(currentOption, grandTotal).toFixed(2);
                    if (cs.price !== newPrice) {
                        changed = true;
                        return { ...cs, price: newPrice };
                    }
                    return cs;
                }

                const correctOption = service.product_options?.find((opt) => {
                    if (!opt.sq_ft_range) return false;
                    const [minStr, maxStr] = opt.sq_ft_range.split("-").map((s) => s.trim());
                    const min = parseInt(minStr, 10);
                    const max = parseInt(maxStr, 10);
                    return !isNaN(min) && !isNaN(max) && grandTotal >= min && grandTotal <= max;
                });

                if (correctOption) {
                    changed = true;
                    return {
                        ...cs,
                        optionId: correctOption.uuid || null,
                        price: calculatePrice(correctOption, grandTotal).toFixed(2)
                    };
                }
                return cs;
            });
            return changed ? updated : prev;
        });
    }, [area, contextServicesData, setOrderServices, setCalendarServices]);
    const isPast = isPastBooking(currentOrder);

    const handleSubmitOrder = async (e: React.MouseEvent<HTMLButtonElement>) => {
        setIsLoading(true);
        e.preventDefault();

        if (isPast && userType !== 'admin') {
            toast.error("This booking is in the past. Agents cannot update past bookings.");
            setIsLoading(false);
            return false;
        }

        const finishedTotal = area
            .filter((a) => a.category === "Finished" || a.type === "Finished")
            .reduce((sum, a) => sum + (Number(a.footage) || 0), 0);
        const subtotalTotal = area
            .filter((a) => a.category === "Subtotal" || a.type === "Subtotal")
            .reduce((sum, a) => sum + (Number(a.footage) || 0), 0);
        const sqFt = finishedTotal + subtotalTotal || currentOrder?.property?.square_footage;
        const hasValidSqFt = sqFt !== undefined;

        const allServicesForValidation = [
            ...OrderServices.map((s) => ({
                uuid: s.service?.uuid,
                title: s.service?.name,
                optionId: s.option?.uuid,
            })),
            ...calendarServices.map((cs) => {
                const matchedService = contextServicesData.find((s: Services) => s.id === cs.serviceId);
                return {
                    uuid: matchedService?.uuid,
                    title: matchedService?.name,
                    optionId: cs.optionId,
                };
            }),
        ];

        for (const srv of allServicesForValidation) {
            if (!srv.uuid) continue;

            const serviceData = contextServicesData.find((sd: Services) => sd.uuid === srv.uuid);
            const productOption = serviceData?.product_options?.find((opt) => opt.uuid === srv.optionId);

            const requiredDuration = getEffectiveServiceDuration(productOption?.service_duration, hasValidSqFt ? sqFt : undefined);
            const serviceSlots = selectedSlots.filter((slot) => slot.service_id === srv.uuid);
            const allocatedDuration = serviceSlots.length * 15;

            // Check if service has any slots in the past
            const hasPastSlots = serviceSlots.some((slot) => {
                try {
                    const slotDate = new Date(`${slot.date} ${slot.start_time}`);
                    return slotDate < new Date();
                } catch {
                    return false;
                }
            });

            if (requiredDuration > 0 && allocatedDuration < requiredDuration) {
                if (hasPastSlots) {
                    continue;
                }
                const slotsNeeded = Math.ceil((requiredDuration - allocatedDuration) / 15);
                toast.error(`Please add ${slotsNeeded} more slot(s) for "${srv.title}". Required: ${requiredDuration} min, Selected: ${allocatedDuration} min`);
                setIsLoading(false);
                return false;
            }
        }

        const calendarServicesPayload = calendarServices
            .map(service => {
                const matchedService = contextServicesData.find((s: Services) =>
                    s.id === service.serviceId
                );

                if (!matchedService) return null;

                return {
                    ...(service.uuid && { uuid: service.uuid }),
                    service_id: matchedService.uuid,
                    option_id: service.optionId,
                    amount: Number(service.price),
                };
            })
            .filter((s): s is { uuid?: string; service_id: string; option_id: string; amount: number } => !!s);


        const orderServicesPayload = [...(OrderServices || [])]
            .map(service => ({
                ...(service.uuid && { uuid: service.uuid }),
                service_id: service.service?.uuid as string,
                option_id: service?.option?.uuid ?? undefined,
                amount: Number(service?.amount) as number,
            }));

        const calendarServiceUuids = calendarServices.map((s) => {
            const matchedService = contextServicesData.find((sd: Services) => sd.id === s.serviceId);
            return matchedService?.uuid;
        }).filter(Boolean);

        const orderServiceUuids = OrderServices.map(s => s.service?.uuid).filter(Boolean);
        const validServiceUuids = [...calendarServiceUuids, ...orderServiceUuids];
        const servicesPayload = [...orderServicesPayload, ...calendarServicesPayload]

        const validSlots = selectedSlots?.filter(slot =>
            validServiceUuids.includes(slot.service_id)
        );

        const slotsPayload = validSlots.map((slot) => {
            return {
                ...(slot.uuid && { uuid: slot.uuid }),
                service_id: slot.service_id,
                vendor_id: slot.vendor && slot.vendor.uuid
                    ? slot.vendor.uuid
                    : slot.vendor_id || "",
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

        try {
            const token = localStorage.getItem('token') || '';

            const isAddServiceVal = (calendarServices.length > 0 || (OrderServices.length !== (currentOrder?.services?.length || 0))) ? 1 : 0;

            const payload: OrderPayload = {
                agent_id: String(currentOrder?.agent?.uuid) || "",
                property_id: currentOrder?.property.uuid || "",
                amount: Number(currentOrder?.amount) || 0,
                order_status: "Processing",
                payment_status: "UNPAID",
                split_invoice: currentOrder?.split_invoice ? 1 : 0,
                co_agents: coAgent || [],
                notes: notes || [],
                services: servicesPayload,
                slots: slotsPayload,
                areas: area,
                is_add_service: isAddServiceVal,
                update_invoice: updateInvoice ? 1 : 0
            };

            const updatedPayload = { ...payload, _method: 'PUT' };
            const response = await EditOrder(currentOrder?.uuid ?? "", updatedPayload, token);


            if (response?.success) {
                // Calculate grand total of square footage
                const finishedTotal = area
                    .filter((a) => a.category === "Finished" || a.type === "Finished")
                    .reduce((sum, a) => sum + (Number(a.footage) || 0), 0);
                const subtotalTotal = area
                    .filter((a) => a.category === "Subtotal" || a.type === "Subtotal")
                    .reduce((sum, a) => sum + (Number(a.footage) || 0), 0);
                const grandTotal = finishedTotal + subtotalTotal;

                // Update property square footage
                if (currentOrder?.property?.uuid) {
                    try {
                        await UpdatePropertySquareFootage(currentOrder.property.uuid, grandTotal, area, {
                            agent_id: currentOrder?.agent?.uuid,
                            address: currentOrder?.property?.address,
                            city: currentOrder?.property?.city,
                            province: currentOrder?.property?.province,
                            country: currentOrder?.property?.country,
                            listing_price: Number(currentOrder?.property?.listing_price),
                            mls_number: currentOrder?.property?.mls_number,
                            bedrooms: Number(currentOrder?.property?.bedrooms),
                            bathrooms: Number(currentOrder?.property?.bathrooms),
                            lot_size: currentOrder?.property?.lot_size,
                            year_constructed: Number(currentOrder?.property?.year_constructed),
                            parking_spots: Number(currentOrder?.property?.parking_spots),
                            property_type: currentOrder?.property?.property_type,
                            property_status: currentOrder?.property?.property_status,
                            heading: currentOrder?.property?.heading,
                            description: currentOrder?.property?.description,
                        });
                        toast.success("Property square footage updated");
                    } catch (error) {
                        console.error("Failed to update property square footage:", error);
                    }
                }

                toast.success('Order updated successfully');
                // onClose()
                // setOrderServices([])
                // setSelectedSlots([])
                // setCalendarServices([])
                return true;
            } else {
                toast.error("Something went wrong");
                return false;
            }
        } catch (error) {
            const errObj = error as any;
      const apiErrors = errObj.response?.data?.errors || errObj.errors;

      if (apiErrors && typeof apiErrors === "object") {
        const normalizedErrors: Record<string, string[]> = {};

        Object.entries(apiErrors).forEach(([key, messages]) => {
          const normalizedKey = key.split(".")[0];
          if (!normalizedErrors[normalizedKey]) {
            normalizedErrors[normalizedKey] = [];
          }
          const msgs = Array.isArray(messages) ? messages : [messages];
          normalizedErrors[normalizedKey].push(...(msgs as string[]));
        });

        const firstError = Object.values(normalizedErrors).flat()[0];
        toast.error(firstError || "Validation error kindly re-check your form");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to submit data");
      }
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] max-w-3xl h-[95vh] flex flex-col p-0 [&>button]:hidden font-alexandria font-[400] overflow-hidden">
                <div className="px-4 pt-4 sm:px-6 sm:pt-6">
                    <DialogHeader>
                        <div className="flex justify-between items-center gap-3">
                            <DialogTitle className={`${userType}-text text-[16px] sm:text-[24px] font-alexandria font-[400] leading-tight break-all`}>
                                {currentOrder?.property_address}, {currentOrder?.property_location}&nbsp;&nbsp;&nbsp;›&nbsp;&nbsp;&nbsp;Order #{currentOrder?.id}
                            </DialogTitle>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    onClose()
                                    setOrderServices([])
                                    setSelectedSlots([])
                                    setCalendarServices([])
                                }}
                                className="hover:bg-transparent text-gray-500 hover:text-black shrink-0"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <div>
                            <div className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none pb-[10px] sm:pb-[20px] border-b-[1px] border-b-[#BBBBBB] mt-4 text-[#666666]">
                                <Button
                                    variant={activeTab === 'appointment' ? 'default' : 'outline'}
                                    onClick={() => setActiveTab('appointment')}
                                    className={`${activeTab === 'appointment' ? `${userType}-bg text-white` : 'bg-[#E4E4E4]'} hover-${userType}-bg hover:opacity-95 hover:text-white min-w-[120px] shrink-0`}
                                >
                                    Appointment
                                </Button>
                                <Button
                                    variant={activeTab === 'square_footage' ? 'default' : 'outline'}
                                    onClick={() => setActiveTab('square_footage')}
                                    className={`${activeTab === 'square_footage' ? `${userType}-bg text-white` : 'bg-[#E4E4E4]'} hover-${userType}-bg hover:opacity-95 hover:text-white min-w-[120px] shrink-0`}
                                >
                                    Square Footage
                                </Button>
                                <Button
                                    variant={activeTab === 'history' ? 'default' : 'outline'}
                                    onClick={() => setActiveTab('history')}
                                    className={`${activeTab === 'history' ? `${userType}-bg text-white` : 'bg-[#E4E4E4]'} hover-${userType}-bg hover:opacity-95 hover:text-white min-w-[120px] shrink-0`}
                                >
                                    History
                                </Button>
                            </div>

                        </div>
                    </DialogHeader>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
                    {activeTab === 'appointment' && userType !== 'vendor' && (
                        <EditAppointmentTab
                            currentOrder={currentOrder}
                            serviceId={serviceId}
                            agentData={agentData}
                            notes={notes}
                            setNotes={setNotes}
                            coAgent={coAgent}
                            setCoAgent={setCoAgent}
                            updateInvoice={updateInvoice}
                            setUpdateInvoice={setUpdateInvoice}
                            totalSquareFootage={(() => {
                                const finishedTotal = area
                                    .filter((a) => a.category === "Finished" || a.type === "Finished")
                                    .reduce((sum, a) => sum + (Number(a.footage) || 0), 0);
                                const subtotalTotal = area
                                    .filter((a) => a.category === "Subtotal" || a.type === "Subtotal")
                                    .reduce((sum, a) => sum + (Number(a.footage) || 0), 0);
                                return finishedTotal + subtotalTotal || currentOrder?.property?.square_footage;
                            })()}
                        />
                    )}
                    {activeTab === 'square_footage' && (
                        <EditSquareFootage currentOrder={currentOrder} area={area} setArea={setArea} updateInvoice={updateInvoice} setUpdateInvoice={setUpdateInvoice} />

                    )}

                    {activeTab === 'history' && (
                        <HistoryTab currentOrder={currentOrder} servicesData={contextServicesData} />
                    )}
                </div>
                <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t flex justify-end gap-2">
                    <Button
                        onClick={() => {
                            onClose()
                        }}
                        className={`bg-transparent border-[1px] text-[14px] flex justify-center items-center ${userType}-border ${userType}-text  w-[132px] h-[42px] ${userType}-button hover-${userType}-bg`}
                    >
                        Close
                    </Button>
                    <Button
                        disabled={isLoading || (isPast && userType !== 'admin')}
                        onClick={async (e) => {
                            const success = await handleSubmitOrder(e);
                            if (success) {
                                setShowConfirmation(true);
                            }
                        }}
                        className={`${userType}-bg ${userType}-border text-[14px] flex justify-center items-center border-[#4290E9] text-[#fff]  w-[132px] h-[42px] hover:text-white hover-${userType}-bg hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : "Save Changes"}
                    </Button>
                </div>
            </DialogContent>
            <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <DialogContent className="w-[320px] md:w-[565px] max-w-[565px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria [&>button]:hidden">
                    <DialogHeader className="mb-2">
                        <DialogTitle className={`flex items-center justify-between ${userType}-text text-[18px] font-[600] border-b-[1px] border-[#E4E4E4] pb-2`}>
                            SAVE AND EXIT
                            <Button variant="ghost" className="p-0 h-auto hover:bg-transparent" onClick={handleClose}>
                                <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                            </Button>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex items-start gap-3">
                        <div className="w-fit">
                            <WarningIcon width={48} fill="#DC9600" />
                        </div>
                        <DialogDescription className="text-[16px] font-[400] text-[#666666]">
                            Are you sure you want to save and exit? This cannot be undone.
                        </DialogDescription>
                    </div>

                    <div className="mt-4 flex justify-between items-center gap-2 border-b-[1px] border-[#E4E4E4] pb-2">
                        <div className="flex items-start gap-x-2.5">
                            <div className="">
                                <input
                                    type="checkbox"
                                    checked={agentChecked}
                                    onChange={() => setAgentChecked(!agentChecked)}
                                    className={`w-5 h-5 ${userType}-accent mt-1 cursor-pointer`}
                                />
                            </div>

                            <div className="flex flex-col gap-y-2">
                                <p className="text-[16px] font-[400] text-[#666666]">Notify Agent of Changes</p>
                                <p className={`text-[16px] font-[400] ${userType}-text`}>Edit Notification</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-x-2.5">
                            <div className="">
                                <input
                                    type="checkbox"
                                    checked={vendorChecked}
                                    onChange={() => setVendorChecked(!vendorChecked)}
                                    className={`w-5 h-5 ${userType}-accent mt-1 cursor-pointer`}
                                />
                            </div>
                            <div className="flex flex-col gap-y-2">
                                <p className="text-[16px] font-[400] text-[#666666]">Notify Vendor of Changes</p>
                                <p className={`text-[16px] font-[400] ${userType}-text`}>Edit Notification</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col md:flex-row md:justify-end gap-[5px]  mt-2 font-alexandria">
                        <Button onClick={() => {
                            handleClose()
                            setOrderServices([])
                            setSelectedSlots([])
                            setCalendarServices([])
                        }}
                            className={`bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[400] ${userType}-text ${userType}-border text-[#0078D4] hover-${userType}-bg hover:opacity-95 ${userType}-button`}
                        >
                            Cancel
                        </Button>
                        <Button
                            className={`${userType}-border hover:opacity-95 text-white ${userType}-bg hover-${userType}-bg w-full  md:w-[170px] h-[44px] font-[400] text-[20px]`}
                            onClick={handleOkClick}
                        >
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
                <NotificationModal
                    open={showNotification}
                    setOpen={setShowNotification}
                    showAgentModal={showAgentModal}
                    setShowAgentModal={setShowAgentModal}
                    showVendorModal={showVendorModal}
                    setShowVendorModal={setShowVendorModal}
                    setAgentChecked={setAgentChecked}
                    setVendorChecked={setVendorChecked}
                    vendorSelected={vendorSelected}
                    bothSelected={bothSelected}
                />

            </Dialog>
        </Dialog>
    );
}
