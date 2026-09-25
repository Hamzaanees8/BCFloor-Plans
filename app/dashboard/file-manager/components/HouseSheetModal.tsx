import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Order } from "../../orders/page";
import { toast } from "sonner";
import { EditOrder, Area } from "../file-manager";
import { GetOneOrder } from "../../orders/orders";
import { useAppContext } from "@/app/context/AppContext";
import EditSquareFootage from "../../calendar/components/EditSquareFootage";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UpdatePropertySquareFootage } from "../../listings/listing";

type Props = {
  open: boolean;
  setOpen: (value: boolean) => void;
  uuid?: string;
  setArea: (value: Area[]) => void;
  onSuccess?: (updatedOrder?: any) => void;
};

const serializeAreas = (areas: Area[] | undefined): string => {
  if (!areas || areas.length === 0) return "[]";
  return JSON.stringify(
    areas
      .map((a) => ({
        type: (a.category || a.type || "Other").trim().toLowerCase(),
        custom_title: (a.custom_title || a.type || "").trim().toLowerCase(),
        footage: Number(a.footage) || 0,
      }))
      .filter((a) => a.footage > 0 || a.custom_title !== "")
      .sort((a, b) => a.custom_title.localeCompare(b.custom_title))
  );
};

const HouseSheetModal: React.FC<Props> = ({
  open,
  setOpen,
  uuid,
  setArea,
  onSuccess,
}) => {
  const [orderData, setOrderData] = React.useState<Order | null>(null);
  const [tempArea, setTempArea] = useState<Area[]>([]);
  const [initialAreasSnapshot, setInitialAreasSnapshot] = useState<string>("");
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [updateInvoice, setUpdateInvoice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { userType } = useAppContext();

  useEffect(() => {
    if (open) {
      setUpdateInvoice(userType === "admin");
    }
  }, [open, userType]);

  useEffect(() => {
    if (!open || !uuid) return;

    const token = localStorage.getItem("token");
    if (!token) {
      console.log("Token not found.");
      return;
    }

    GetOneOrder(token, uuid)
      .then((data) => {
        setOrderData(data.data);
        const initial = data.data.areas || data.data.area || [];
        setTempArea(initial);
        setInitialAreasSnapshot(serializeAreas(initial));
      })
      .catch((err) => console.log(err.message));
  }, [open, uuid]);

  useEffect(() => {
    if (!open) {
      setTempArea([]);
      setInitialAreasSnapshot("");
      setShowUnsavedConfirm(false);
    } else if (orderData && orderData.areas) {
      setTempArea(orderData.areas);
    }
  }, [open, orderData]);

  const hasUnsavedChanges = useMemo(() => {
    if (!initialAreasSnapshot) return false;
    return serializeAreas(tempArea) !== initialAreasSnapshot;
  }, [tempArea, initialAreasSnapshot]);

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedConfirm(true);
    } else {
      setOpen(false);
    }
  };

  const handleSubmitOrder = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      console.log("areato send", tempArea);
      const payload = {
        areas: tempArea,
        update_invoice: userType === "admin" && updateInvoice ? 1 : 0,
      };
      console.log("payload", payload);
      const updatedPayload = { ...payload, _method: "PUT" };
      const response = await EditOrder(
        orderData?.uuid ?? "",
        updatedPayload,
        token,
      );

      if (response?.success) {
        // Calculate grand total of square footage
        const finishedTotal = tempArea
          .filter((a) => a.category === "Finished" || a.type === "Finished")
          .reduce((sum, a) => sum + (Number(a.footage) || 0), 0);
        const subtotalTotal = tempArea
          .filter((a) => a.category === "Subtotal" || a.type === "Subtotal")
          .reduce((sum, a) => sum + (Number(a.footage) || 0), 0);
        const grandTotal = finishedTotal + subtotalTotal;

        // Update property square footage
        if (orderData?.property?.uuid) {
          try {
            await UpdatePropertySquareFootage(
              orderData.property.uuid,
              grandTotal,
              tempArea,
              {
                agent_id: orderData?.agent?.uuid,
                address: orderData?.property?.address,
                city: orderData?.property?.city,
                province: orderData?.property?.province,
                country: orderData?.property?.country,
                listing_price: Number(orderData?.property?.listing_price),
                mls_number: orderData?.property?.mls_number,
                bedrooms: Number(orderData?.property?.bedrooms),
                bathrooms: Number(orderData?.property?.bathrooms),
                lot_size: orderData?.property?.lot_size,
                year_constructed: Number(orderData?.property?.year_constructed),
                parking_spots: Number(orderData?.property?.parking_spots),
                property_type: orderData?.property?.property_type,
                property_status: orderData?.property?.property_status,
                heading: orderData?.property?.heading,
                description: orderData?.property?.description,
              },
            );
            toast.success("Property square footage updated");
          } catch (error) {
            console.error("Failed to update property square footage:", error);
          }
        }

        toast.success("Order updated successfully");
        setArea(response.data.areas ?? []);
        onSuccess?.(response.data);
        setOpen(false);
      } else {
        toast.error("Something went wrong");
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

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleCloseAttempt();
          } else {
            setOpen(true);
          }
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => {
            e.preventDefault();
            handleCloseAttempt();
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            handleCloseAttempt();
          }}
          className="w-[95vw] md:w-[730px] max-w-[95vw] md:max-w-[730px] p-4 md:p-6 h-[85vh] md:h-[650px] max-h-[85vh] overflow-hidden flex flex-col justify-between rounded-[8px] font-alexandria [&>button]:hidden"
        >
          <div className="flex flex-col shrink-0 mb-2">
            <DialogHeader>
              <DialogTitle
                className={`flex items-start md:items-center uppercase justify-between ${userType}-text text-[14px] md:text-[24px] font-[400] gap-2`}
              >
                <span className="break-words text-left">
                  {orderData?.property_address}, {orderData?.property_location}{" "}
                  {orderData?.id ? `> Order #${orderData.id}` : ""}
                </span>
                <Button
                  variant="ghost"
                  onClick={handleCloseAttempt}
                  className="border-none !shadow-none p-0 h-auto hover:bg-transparent"
                >
                  <X className="!w-[20px] !h-[20px] cursor-pointer text-[#7D7D7D]" />
                </Button>
              </DialogTitle>
              <hr className="w-full h-[1px] text-[#BBBBBB] mt-2" />
              {userType === "admin" && (
                <div className="flex items-center justify-end space-x-2 py-2">
                  <Switch
                    id="update-invoice-housesheet"
                    checked={updateInvoice}
                    onCheckedChange={setUpdateInvoice}
                    className="data-[state=checked]:bg-[#6BAE41] data-[state=unchecked]:bg-[#E06D5E]"
                  />
                  <Label
                    htmlFor="update-invoice-housesheet"
                    className="text-[14px] font-[500] text-[#424242]"
                  >
                    Update Invoice
                  </Label>
                </div>
              )}
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <EditSquareFootage
              currentOrder={orderData || undefined}
              area={tempArea}
              setArea={setTempArea}
              updateInvoice={updateInvoice}
              setUpdateInvoice={setUpdateInvoice}
              hideHeader={true}
            />
          </div>

          <div className="shrink-0 pt-3 border-t mt-2">
            <DialogFooter className="flex flex-col md:flex-row md:justify-end gap-[10px] font-raleway">
              <Button
                variant="outline"
                onClick={handleCloseAttempt}
                disabled={isLoading}
                className={`bg-white w-full md:w-[176px] h-[44px] text-[18px] md:text-[20px] font-[400] ${userType}-border ${userType}-text hover:bg-[#f1f8ff]`}
              >
                Close
              </Button>
              <Button
                disabled={isLoading}
                onClick={(e) => {
                  handleSubmitOrder(e);
                }}
                className={`${userType}-bg w-full md:w-[170px] h-[44px] text-[18px] md:text-[20px] font-[600] text-white hover-${userType}-bg flex items-center justify-center gap-2 disabled:opacity-50`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  "Save And Exit"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUnsavedConfirm} onOpenChange={setShowUnsavedConfirm}>
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          className="w-[90vw] md:w-[480px] max-w-[90vw] md:max-w-[480px] rounded-[10px] p-5 md:p-6 font-alexandria [&>button]:hidden"
        >
          <DialogHeader className="mb-2">
            <DialogTitle className={`text-[18px] font-[600] ${userType}-text border-b border-[#E4E4E4] pb-2`}>
              UNSAVED CHANGES
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 text-[14px] text-[#666666]">
            You have unsaved changes in square footage. Are you sure you want to exit without saving?
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowUnsavedConfirm(false)}
              className={`w-full sm:w-auto h-[40px] text-[15px] ${userType}-border ${userType}-text hover:bg-gray-50`}
            >
              Keep Editing
            </Button>
            <Button
              onClick={() => {
                setShowUnsavedConfirm(false);
                setOpen(false);
              }}
              className="w-full sm:w-auto h-[40px] text-[15px] bg-[#E06D5E] hover:bg-[#c9594b] text-white"
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HouseSheetModal;
