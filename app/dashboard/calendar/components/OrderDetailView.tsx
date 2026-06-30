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
import EditSquareFootage from "./EditSquareFootage";
import { Agent } from "@/lib/types";
import { useOrderContext } from "../../orders/context/OrderContext";
import { toast } from "sonner";
import { EditOrder } from "../calendar";
import { GetServices } from "../../orders/orders";
import { UpdatePropertySquareFootage } from "../../listings/listing";
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
import { splitSlotInto15MinChunks } from "../../orders/utils/serviceTimeUtils";
import { useRouter } from "next/navigation";

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
  refreshOrders,
}: OrderDetailViewProps) {
  const router = useRouter();
  const { userType } = useAppContext();
  const [activeTab, setActiveTab] = useState<
    "appointment" | "square_footage" | "history"
  >("appointment");
  const [isEdit, setIsEdit] = useState(false);
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
      // Only reset the tab and edit state when initially opening
      if (!currentOrder || currentOrder.uuid !== orderId) {
          setIsEdit(false);
          setActiveTab("appointment");
      }
      setAgentChecked(false);
      setVendorChecked(false);
      setVendorSelected(false);
      setShowAgentModal(false);
      setShowVendorModal(false);
      setShowNotification(false);
      setShowConfirmation(false);

      if (currentOrder) {
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
    }
  // Use currentOrder?.uuid instead of currentOrder to avoid re-running when orderData reference changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderId, currentOrder?.uuid, setOrderServices, setCalendarServices, setSelectedSlots]);

  // Sync service options with square footage when area changes
  useEffect(() => {
    if (!isEdit || area.length === 0) return;

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
        const service = servicesData.find((s) => s.uuid === os.service?.uuid);
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

        // Find correct option
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

    // Update calendarServices (newly added)
    setCalendarServices((prev) => {
      let changed = false;
      const updated = prev.map((cs) => {
        const service = servicesData.find((s) => s.id === cs.serviceId);
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
  }, [area, isEdit, servicesData, setOrderServices, setCalendarServices]);

  const handleSubmitOrder = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token") || "";
      const payload = {
        areas: area,
        update_invoice: updateInvoice ? 1 : 0
      };
      const updatedPayload = { ...payload, _method: "PUT" };
      const response = await EditOrder(currentOrder?.uuid ?? "", updatedPayload as any, token);

      if (response?.success) {
        const finishedTotal = area
          .filter((a) => a.category === "Finished" || a.type === "Finished")
          .reduce((sum, a) => sum + (Number(a.footage) || 0), 0);
        const subtotalTotal = area
          .filter((a) => a.category === "Subtotal" || a.type === "Subtotal")
          .reduce((sum, a) => sum + (Number(a.footage) || 0), 0);
        const grandTotal = finishedTotal + subtotalTotal;

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

        toast.success("Order updated successfully");
        refreshOrders();
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
        <DialogContent className="w-[95vw] md:w-full md:max-w-3xl max-w-[95vw] h-[95vh] flex flex-col p-0 [&>button]:hidden font-alexandria font-[400] overflow-hidden">
          <div className="px-6 pt-6">
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
                <div className="flex gap-4 pb-[20px] border-b-[1px] border-b-[#BBBBBB] mt-4 text-[#666666] overflow-x-auto whitespace-nowrap scrollbar-none">
                  <Button
                    variant={activeTab === "appointment" ? "default" : "outline"}
                    onClick={() => setActiveTab("appointment")}
                    className={`${activeTab === "appointment" ? `${userType}-bg text-white` : ""} hover-${userType}-bg hover:opacity-95 hover:text-white min-w-[120px] shrink-0`}
                    style={{
                      backgroundColor:
                        activeTab !== "appointment"
                          ? `var(--${userType}-page-bg, #E4E4E4)`
                          : undefined,
                    }}
                  >
                    Appointment
                  </Button>
                  {(userType !== "agent" || !isEdit) && (
                    <Button
                      variant={activeTab === "square_footage" ? "default" : "outline"}
                      onClick={() => setActiveTab("square_footage")}
                      className={`${activeTab === "square_footage" ? `${userType}-bg text-white` : ""} hover-${userType}-bg hover:opacity-95 hover:text-white min-w-[120px] shrink-0`}
                      style={{
                        backgroundColor:
                          activeTab !== "square_footage"
                            ? `var(--${userType}-page-bg, #E4E4E4)`
                            : undefined,
                      }}
                    >
                      Square Footage
                    </Button>
                  )}
                  <Button
                    variant={activeTab === "history" ? "default" : "outline"}
                    onClick={() => setActiveTab("history")}
                    className={`${activeTab === "history" ? `${userType}-bg text-white` : ""} hover-${userType}-bg hover:opacity-95 hover:text-white min-w-[120px] shrink-0`}
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
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {activeTab === "appointment" && (
              <AppointmentTab currentOrder={currentOrder} serviceId={serviceId} />
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
          </div>
          <div className="p-6 pt-4 border-t flex justify-end gap-[10px]">
            {isEdit && (
              <>
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
                  className={`${userType}-bg ${userType}-border text-[14px] flex justify-center items-center text-[#fff]  w-[132px] h-[42px] hover:text-white hover-${userType}-bg hover:opacity-95 disabled:opacity-50`}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Changes"}
                </Button>
              </>
            )}
            {!isEdit && (
              <div className="w-full flex justify-end gap-[10px]">
                {/* <Button
                                className="bg-transparent border-[1px] text-[14px] flex justify-center items-center border-[#4290E9] text-[#4290E9]  w-[132px] h-[42px] hover:text-white hover:bg-[#4290E9]"
                            >
                                View Order
                            </Button> */}
                {!(userType === "agent" && activeTab === "square_footage") &&
                  !(userType === "vendor" && activeTab === "appointment") &&
                  activeTab !== "history" && (
                    <Button
                      onClick={() => {
                        if (activeTab === "appointment") {
                          onClose();
                          if (currentOrder?.uuid) {
                            router.push(`/dashboard/orders/create/${currentOrder.uuid}?isEdit=true`);
                          }
                        } else if (activeTab === "square_footage") {
                          setIsEdit(true);
                        }
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
