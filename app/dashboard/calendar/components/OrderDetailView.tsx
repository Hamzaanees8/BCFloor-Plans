"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "../../orders/page";
import AppointmentTab from "./AppointmentTab";
import SquareFootage from "./SquareFootage";
import HistoryTab from "./HistoryTab";
import EditAppointmentTab from "./EditAppointmentTab";
import EditSquareFootage from "./EditSquareFootage";
import { Agent } from "@/lib/types";
import { useOrderContext } from "../../orders/context/OrderContext";
import { toast } from "sonner";
import { EditOrder } from "../calendar";
import { GetServices } from "../../orders/orders";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import WarningIcon from "@/components/Icons";
import NotificationModal from "./NotificationModal";
import { useAppContext } from "@/app/context/AppContext";
import { getEffectiveServiceDuration } from "../../orders/utils/serviceTimeUtils";

interface OrderDetailViewProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderData: Order[];
  serviceId: number;
  agentData: Agent[];
  refreshOrders: () => void;
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
  date: string;
}
export interface CoAgent {
  name: string;
  email?: string;
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
export default function OrderDetailView({
  open,
  onClose,
  orderId,
  serviceId,
  orderData,
  agentData,
}: OrderDetailViewProps) {
  const { userType } = useAppContext();
  const [activeTab, setActiveTab] = useState<
    "appointment" | "square_footage" | "history"
  >("appointment");
  const [isEdit, setIsEdit] = useState(false);
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
  const [isLoading, setIsLoading] = useState(false);
  const bothSelected = agentChecked && vendorChecked;
  const currentOrder = orderData.find((order) => {
    return order.uuid == orderId;
  });
  const handleClose = () => {
    setAgentChecked(false);
    setVendorChecked(false);
    onClose();
    setIsEdit(false);
    setOrderServices([]);
    setSelectedSlots([]);
    setCalendarServices([]);
  };
  const handleOkClick = () => {
    const both = agentChecked && vendorChecked;
    setVendorSelected(vendorChecked);

    if (both || agentChecked) {
      setShowAgentModal(true);
      setShowVendorModal(false);
      setShowNotification(true);
      setShowConfirmation(false);
    } else if (vendorChecked) {
      setShowAgentModal(false);
      setShowVendorModal(true);
      setShowNotification(true);
      setShowConfirmation(false);
    } else {
      // No notification selected, close the dialog
      setShowConfirmation(false);
      onClose();
      setOrderServices([]);
      setSelectedSlots([]);
      setCalendarServices([]);
      setIsEdit(false);
    }
  };

  const {
    calendarServices,
    selectedSlots,
    OrderServices,
    setOrderServices,
    setSelectedSlots,
    setCalendarServices,
    servicesData,
    setServicesData,
  } = useOrderContext();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || servicesData.length > 0) {
      return;
    }

    GetServices(token)
      .then((data) => {
        setServicesData(data.data);
      })
      .catch((err) => console.log(err.message));
  }, [servicesData.length, setServicesData]);

  useEffect(() => {
    if (open) {
      setIsEdit(false);
      setActiveTab("appointment");
      setAgentChecked(false);
      setVendorChecked(false);
      setVendorSelected(false);
      setShowAgentModal(false);
      setShowVendorModal(false);
      setShowNotification(false);
      setShowConfirmation(false);
      
      if (currentOrder) {
        setOrderServices(currentOrder.services || []);

        let notesArray: any[] = [];
        if (Array.isArray(currentOrder.notes)) {
          notesArray = currentOrder.notes;
        } else if (typeof currentOrder.notes === "string") {
          try {
            notesArray = JSON.parse(currentOrder.notes);
          } catch (e) {
            console.error("Failed to parse notes:", e);
            notesArray = [];
          }
        }

        setNotes(
          (notesArray || []).map((n: any) => ({
            ...n,
            date:
              n.date instanceof Date
                ? n.date.toISOString()
                : String(n.date),
          })),
        );
        let coAgentsArray: any[] = [];
        if (Array.isArray(currentOrder.co_agents)) {
          coAgentsArray = currentOrder.co_agents;
        } else if (typeof currentOrder.co_agents === "string") {
          try {
            coAgentsArray = JSON.parse(currentOrder.co_agents);
          } catch (e) {
            console.error("Failed to parse co_agents:", e);
            coAgentsArray = [];
          }
        }
        setCoAgent(coAgentsArray);
        setArea(currentOrder.areas || []);
      }
    }
  }, [open, orderId, currentOrder, setOrderServices]);
  const handleSubmitOrder = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    // Check duration requirements before processing payload
    const allServices = [
      ...OrderServices.map((s) => ({
        uuid: s.service?.uuid,
        id: s.service?.id,
        optionId: s.option?.uuid,
        name: s.service?.name,
      })),
      ...calendarServices.map((s) => {
        const matched = servicesData.find((sd) => sd.id === s.serviceId);
        return {
          uuid: matched?.uuid,
          id: s.serviceId,
          optionId: s.optionId,
          name: matched?.name,
        };
      }),
    ];

    const sqFt = currentOrder?.property?.square_footage;
    let hasInvalidDuration = false;

    for (const srv of allServices) {
      if (!srv.uuid) continue;

      const currentServiceData = servicesData.find(
        (sd) => sd.uuid === srv.uuid || sd.id === srv.id
      );
      const productOption = currentServiceData?.product_options?.find(
        (opt) => opt.uuid === srv.optionId
      );

      const requiredDuration = getEffectiveServiceDuration(
        productOption?.service_duration,
        sqFt
      );
      const currentServiceSlots = selectedSlots.filter(
        (slot) => slot.service_id === srv.uuid
      );

      if (currentServiceSlots.length * 15 < requiredDuration) {
        const slotsNeeded = Math.ceil((requiredDuration - currentServiceSlots.length * 15) / 15);
        toast.error(
          `Please add ${slotsNeeded} more slot(s) for "${srv.name}". Required: ${requiredDuration} min, Selected: ${currentServiceSlots.length * 15} min`
        );
        hasInvalidDuration = true;
      }
    }

    if (hasInvalidDuration) {
      setIsLoading(false);
      return false;
    }

    const calendarServicesPayload = calendarServices
      .map((service) => {
        const matchedService = servicesData.find(
          (s) => s.id === service.serviceId,
        );

        if (!matchedService) return null;

        return {
          ...(service.uuid && { uuid: service.uuid }),
          service_id: matchedService.uuid,
          option_id: service.optionId,
          amount: Number(service.price),
        };
      })
      .filter(
        (
          s,
        ): s is {
          uuid?: string;
          service_id: string;
          option_id: string;
          amount: number;
        } => !!s,
      );

    const orderServicesPayload = [...(OrderServices || [])].map((service) => ({
      ...(service.uuid && { uuid: service.uuid }),
      service_id: service.service?.uuid as string,
      option_id: service?.option?.uuid ?? undefined,
      amount: Number(service?.amount) as number,
    }));

    const calendarServiceUuids = calendarServices
      .map((s) => {
        const matchedService = servicesData.find((sd) => sd.id === s.serviceId);
        return matchedService?.uuid;
      })
      .filter(Boolean);

    const orderServiceUuids = OrderServices.map((s) => s.service?.uuid).filter(
      Boolean,
    );
    const validServiceUuids = [...calendarServiceUuids, ...orderServiceUuids];
    const servicesPayload = [
      ...orderServicesPayload,
      ...calendarServicesPayload,
    ];

    const validSlots = selectedSlots?.filter((slot) =>
      validServiceUuids.includes(slot.service_id),
    );

    const slotsPayload = (() => {
      // Group slots by service_id, vendor_id, and date
      const groupedSlots: Record<string, any[]> = {};

      validSlots.forEach((slot) => {
        const vendorId =
          slot.vendor && slot.vendor.uuid
            ? slot.vendor.uuid
            : slot.vendor_id || "";
        const key = `${slot.service_id}_${vendorId}_${slot.date}`;
        if (!groupedSlots[key]) {
          groupedSlots[key] = [];
        }
        groupedSlots[key].push({ ...slot, vendorId });
      });

      // Merge consecutive slots for each group
      const mergedSlots: any[] = [];

      Object.values(groupedSlots).forEach((slots) => {
        // Sort slots by start time
        const sortedSlots = slots.sort((a, b) =>
          a.start_time.localeCompare(b.start_time),
        );

        // Verify they are contiguous (sanity check)
        let isContiguous = true;
        for (let i = 0; i < sortedSlots.length - 1; i++) {
          if (sortedSlots[i].end_time !== sortedSlots[i + 1].start_time) {
            isContiguous = false;
            console.warn(
              "Non-contiguous slots detected for service:",
              sortedSlots[i].service_id,
            );
            break;
          }
        }

        if (!isContiguous) {
          // If not contiguous, send slots individually (fallback)
          sortedSlots.forEach((slot) => {
            mergedSlots.push({
              ...(slot.uuid && { uuid: slot.uuid }),
              service_id: slot.service_id,
              vendor_id: slot.vendorId,
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
          // Merge into a single slot
          const firstSlot = sortedSlots[0];
          const lastSlot = sortedSlots[sortedSlots.length - 1];

          mergedSlots.push({
            ...(firstSlot.uuid && { uuid: firstSlot.uuid }),
            service_id: firstSlot.service_id,
            vendor_id: firstSlot.vendorId,
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

      return mergedSlots;
    })();

    try {
      const token = localStorage.getItem("token") || "";

      const isAddServiceVal = (calendarServices.length > 0 || (OrderServices.length !== (currentOrder?.services?.length || 0))) ? 1 : 0;

      const payload: OrderPayload = {
        agent_id: String(currentOrder?.agent.uuid) || "",
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
        update_invoice: updateInvoice ? 1 : 0,
      };

      const updatedPayload = { ...payload, _method: "PUT" };
      const response = await EditOrder(
        currentOrder?.uuid ?? "",
        updatedPayload,
        token,
      );

      if (response?.success) {
        toast.success("Order updated successfully");
        // onClose();
        // setOrderServices([]);
        // setSelectedSlots([]);
        // setCalendarServices([]);
        // setIsEdit(false);
        return true;
      } else {
        toast.error("Something went wrong");
        return false;
      }
    } catch (error) {
      const apiError = error as {
        message?: string;
        errors?: Record<string, string[]>;
      };

      if (apiError.errors && typeof apiError.errors === "object") {
        const normalizedErrors: Record<string, string[]> = {};

        Object.entries(apiError.errors).forEach(([key, messages]) => {
          const normalizedKey = key.split(".")[0];
          if (!normalizedErrors[normalizedKey]) {
            normalizedErrors[normalizedKey] = [];
          }
          normalizedErrors[normalizedKey].push(...messages);
        });
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to submit order data");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userType == "vendor" && isEdit) {
      setActiveTab("square_footage");
    }
  }, [isEdit, userType]);
  return (
    <>
      <Dialog
        open={open && !showConfirmation && !showNotification}
        onOpenChange={(val) => {
          if (!val) {
            onClose();
            setIsEdit(false);
            setOrderServices([]);
            setSelectedSlots([]);
            setCalendarServices([]);
          }
        }}
      >
        <DialogContent className="max-w-3xl px-[10px] h-[90vh] [&>button]:hidden font-alexandria font-[400] overflow-x-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle
              className={`${userType}-text text-[24px] font-alexandria font-[400]`}
            >
              {currentOrder?.property_address},{" "}
              {currentOrder?.property_location}
              &nbsp;&nbsp;&nbsp;›&nbsp;&nbsp;&nbsp;Order #{currentOrder?.id}
            </DialogTitle>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                onClose();
                setIsEdit(false);
                setOrderServices([]);
                setSelectedSlots([]);
                setCalendarServices([]);
              }}
              className="hover:bg-transparent text-gray-500 hover:text-black"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div>
            <div className="flex gap-4 pb-[20px] border-b-[1px] border-b-[#BBBBBB] mt-4 text-[#666666]">
              <Button
                variant={activeTab === "appointment" ? "default" : "outline"}
                onClick={() => setActiveTab("appointment")}
                className={`${activeTab === "appointment" ? `${userType}-bg text-white` : ""} hover-${userType}-bg hover:opacity-95 hover:text-white min-w-[120px]`}
                style={{
                  backgroundColor:
                    activeTab !== "appointment"
                      ? `var(--${userType}-page-bg, #E4E4E4)`
                      : undefined,
                }}
              >
                Appointment
              </Button>
              <Button
                variant={activeTab === "square_footage" ? "default" : "outline"}
                onClick={() => setActiveTab("square_footage")}
                className={`${activeTab === "square_footage" ? `${userType}-bg text-white` : ""} hover-${userType}-bg hover:opacity-95 hover:text-white min-w-[120px]`}
                style={{
                  backgroundColor:
                    activeTab !== "square_footage"
                      ? `var(--${userType}-page-bg, #E4E4E4)`
                      : undefined,
                }}
              >
                Square Footage
              </Button>
              <Button
                variant={activeTab === "history" ? "default" : "outline"}
                onClick={() => setActiveTab("history")}
                className={`${activeTab === "history" ? `${userType}-bg text-white` : ""} hover-${userType}-bg hover:opacity-95 hover:text-white min-w-[120px]`}
                style={{
                  backgroundColor:
                    activeTab !== "history"
                      ? `var(--${userType}-page-bg, #E4E4E4)`
                      : undefined,
                }}
              >
                History
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="p-4 overflow-y-auto max-h-[80vh] px-2">
          {activeTab === "appointment" && !isEdit && (
            <AppointmentTab currentOrder={currentOrder} serviceId={serviceId} />
          )}
          {activeTab === "appointment" && isEdit && userType !== "vendor" && (
            <EditAppointmentTab
              currentOrder={currentOrder}
              serviceId={serviceId}
              agentData={agentData}
              notes={notes}
              setNotes={setNotes}
              coAgent={coAgent}
              setCoAgent={setCoAgent}
              area={area}
              updateInvoice={updateInvoice}
              setUpdateInvoice={setUpdateInvoice}
            />
          )}

          {activeTab === "square_footage" && !isEdit && (
            <SquareFootage currentOrder={currentOrder} />
          )}
          {activeTab === "square_footage" && isEdit && (
            <EditSquareFootage
              currentOrder={currentOrder}
              area={area}
              setArea={setArea}
              updateInvoice={updateInvoice}
              setUpdateInvoice={setUpdateInvoice}
            />
          )}

          {activeTab === "history" && (
            <HistoryTab
              currentOrder={currentOrder}
              servicesData={servicesData}
            />
          )}
          {isEdit && (
            <div className="w-full flex justify-end gap-[10px] mt-[40px]">
              <Button
                onClick={() => {
                  onClose();
                  setIsEdit(false);
                }}
                className={`bg-transparent border-[1px] text-[14px] flex justify-center items-center ${userType}-border ${userType}-text  w-[132px] h-[42px] ${userType}-button hover-${userType}-bg`}
              >
                Close
              </Button>
              <Button
                disabled={isLoading}
                onClick={async (e) => {
                  const success = await handleSubmitOrder(e);
                  if (success) {
                    setShowConfirmation(true);
                  }
                }}
                className={`${userType}-bg ${userType}-border text-[14px] flex justify-center items-center border-[#4290E9] text-[#fff]  w-[132px] h-[42px] hover:text-white hover-${userType}-bg hover:opacity-95 disabled:opacity-50`}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Changes"}
              </Button>
            </div>
          )}
          {!isEdit && (
            <div className="w-full flex justify-end gap-[10px] mt-[40px]">
              {/* <Button
                                className="bg-transparent border-[1px] text-[14px] flex justify-center items-center border-[#4290E9] text-[#4290E9]  w-[132px] h-[42px] hover:text-white hover:bg-[#4290E9]"
                            >
                                View Order
                            </Button> */}
              {!(userType === "agent" && activeTab === "square_footage") && (
                <Button
                  onClick={() => {
                    setIsEdit(true);
                  }}
                  className={`${userType}-bg ${userType}-border border-[1px] text-[14px] flex justify-center items-center hover-${userType}-bg hover:opacity-95 text-[#fff]  w-[132px] h-[42px] hover:text-white`}
                >
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    <AlertDialog
        open={showConfirmation}
        onOpenChange={(val) => {
          setShowConfirmation(val);
          if (!val && !showNotification) {
            handleClose();
          }
        }}
      >
        <AlertDialogContent className="w-[320px] md:w-[565px] max-w-[565px] rounded-[8px] p-4 md:p-6 gap-[10px] font-alexandria">
          <AlertDialogHeader className="mb-2">
            <AlertDialogTitle
              className={`flex items-center justify-between ${userType}-text text-[18px] font-[600] border-b-[1px] border-[#E4E4E4] pb-2`}
            >
              SAVE AND EXIT
              <AlertDialogCancel
                onClick={handleClose}
                className="border-none !shadow-none"
              >
                <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
              </AlertDialogCancel>
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="flex items-start gap-3">
            <div className="w-fit">
              <WarningIcon width={48} fill="#DC9600" />
            </div>
            <AlertDialogDescription className="text-[16px] font-[400] text-[#666666]">
              Are you sure you want to save and exit? This cannot be undone.
            </AlertDialogDescription>
          </div>

          <div className="mt-4 flex justify-between items-center gap-2 border-b-[1px] border-[#E4E4E4] pb-2">
            <div className="flex items-start gap-x-2.5">
              <div className="">
                <input
                  type="checkbox"
                  id="notifyAgent"
                  checked={agentChecked}
                  onChange={() => setAgentChecked(!agentChecked)}
                  className={`w-5 h-5 ${userType}-accent mt-1 cursor-pointer`}
                />
              </div>

              <label
                htmlFor="notifyAgent"
                className="flex flex-col gap-y-2 cursor-pointer"
              >
                <p className="text-[16px] font-[400] text-[#666666]">
                  Notify Agent of Changes
                </p>
              </label>
            </div>
            <div className="flex items-start gap-x-2.5">
              <div className="">
                <input
                  type="checkbox"
                  id="notifyVendor"
                  checked={vendorChecked}
                  onChange={() => setVendorChecked(!vendorChecked)}
                  className={`w-5 h-5 ${userType}-accent mt-1 cursor-pointer`}
                />
              </div>
              <label
                htmlFor="notifyVendor"
                className="flex flex-col gap-y-2 cursor-pointer"
              >
                <p className="text-[16px] font-[400] text-[#666666]">
                  Notify Vendor of Changes
                </p>
              </label>
            </div>
          </div>

          <AlertDialogFooter className="flex flex-col md:flex-row md:justify-end gap-[5px]  mt-2 font-alexandria">
            <AlertDialogCancel
              onClick={handleClose}
              className={`bg-white w-full md:w-[170px] h-[44px] text-[20px] font-[400] ${userType}-text ${userType}-border text-[#0078D4] hover-${userType}-bg hover:opacity-95 ${userType}-button`}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={`${userType}-border hover:opacity-95 text-white ${userType}-bg hover-${userType}-bg w-full  md:w-[170px] h-[44px] font-[400] text-[20px]`}
              onClick={handleOkClick}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <NotificationModal
        open={showNotification}
        setOpen={(val) => {
          setShowNotification(val);
          if (!val) {
            onClose();
            setOrderServices([]);
            setSelectedSlots([]);
            setCalendarServices([]);
            setIsEdit(false);
          }
        }}
        showAgentModal={showAgentModal}
        setShowAgentModal={setShowAgentModal}
        showVendorModal={showVendorModal}
        setShowVendorModal={setShowVendorModal}
        setAgentChecked={setAgentChecked}
        setVendorChecked={setVendorChecked}
        vendorSelected={vendorSelected}
        bothSelected={bothSelected}
        order={currentOrder}
        agent={currentOrder?.agent}
        vendor={currentOrder?.vendor}
        service={
          currentOrder?.services?.find((s: any) => s.service.id === serviceId)
            ?.service
        }
      />
    </>
  );
}
