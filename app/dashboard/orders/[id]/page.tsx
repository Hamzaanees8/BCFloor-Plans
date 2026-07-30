"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Copy, File, Loader2 } from "lucide-react";
import { isPastBooking } from "@/lib/bookingUtils";
//import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { EditOrderStatus, GetOneOrder, CancelOrder, PreviewCancelOrder, PreviewCancelService, CancelService } from "../orders";
import { GetServices } from "../../services/services";
import { Services } from "../../services/page";
import { useParams, useRouter } from "next/navigation";
import { Order, OrderService } from "../page";
import { Country } from "country-state-city";
import { useAppContext } from "@/app/context/AppContext";
import VendorOrderEdit from "../components/VendorOrderEdit";
import CancelOrderDialog, { CancelPreviewData } from "../components/CancelOrderDialog";
import OrderNotesDialog from "../components/OrderNotesDialog";
import { Agent } from "@/lib/types";
import { GetAgents } from "../../calendar/calendar";
import { toast } from "sonner";
import { VendorPortfolioImage } from "../../vendors/create/page";
import { useEffect, useState } from "react";
import { createPayment, GetFilesData } from "../../file-manager/file-manager";
import { FilesData } from "../../file-manager/FileManagerContext";
import Link from "next/link";
import { resolveServicePrice } from "@/lib/pricingUtils";
// import OrderDetailView from "../../calendar/components/OrderDetailView";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { GetInvoicesByOrder, PayInvoiceWithStripe } from "../../invoice/invoice_api";
import InvoiceDocument from "../../invoice/components/InvoiceDocument";
import { useOrganization } from "@/app/context/OrganizationContext";
export interface VendorAddress {
  type: "company" | "billing" | string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  province: string;
  country: string;
}

export interface VendorData {
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  work_hours: {
    start_time?: string;
    end_time?: string;
    break_start: string;
    break_end: string;
    timezone?: string;
    work_days?: {
      day: string;
      start_time: string;
      end_time: string;
      is_off: string | number | boolean;
      is_twilight: string | number | boolean;
    }[];
  };
  addresses?: VendorAddress[];
  vendor_services: {
    service: { uuid: string };
  }[];
  coordinates: string[];
  company: { vendor_id: string };
  portfolio_images?: VendorPortfolioImage[];
  settings?: {
    enable_service_area?: number | boolean;
    force_service_area: number | boolean;
    next_booking_slot_only?: number | boolean | string;
  };
  additional_breaks?: {
    id?: number;
    uuid?: string;
    vendor_id?: number;
    title: string;
    date: string;
    start_time: string;
    end_time: string;
    address?: string;
    start_date?: string;
    end_date?: string;
  }[];
  calendar_events?: {
    id: string;
    summary: string;
    description?: string;
    start: string;
    end: string;
    start_formatted?: string;
    end_formatted?: string;
    all_day: boolean;
    status: string;
    location?: string;
    created?: string;
    updated?: string;
  }[];
}
export interface OrderData {
  uuid: string;
  agent: {
    first_name: string;
    last_name: string;
    company_name: string;
    email: string;
    uuid: string;
  };
  vendor: {
    first_name: string;
    last_name: string;
    email: string;
    uuid: string;
    company_name: string;
  };
}

function Page() {
  const { organization } = useOrganization();
  const orgName = organization?.slug?.toUpperCase() || "Tojuco Solutions";
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [order_status, setOrder_status] = useState("");
  const [property_website, setProperty_website] = useState("");
  const [mls_property, setMls_property] = useState("");
  const [country, setCountry] = useState("");
  const [countries, setCountries] = useState<
    { name: string; isoCode: string }[]
  >([]);
  const [selectedVendors, setselectedVendors] = useState("");
  const [openEditPopup, setOpenEditPopup] = useState<boolean>(false);
  const [openNotesPopup, setOpenNotesPopup] = useState<boolean>(false);
  const { userType } = useAppContext();
  const { appliedSettings } = useWhiteLabel();
  const API_URL = process.env.NEXT_PUBLIC_FILES_API_URL;
  const role = (userType as string)?.toLowerCase() || "admin";
  const roleSettings =
    appliedSettings[role as keyof typeof appliedSettings] ||
    appliedSettings["admin"];
  const headerBg = `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`;
  const fieldBg = `color-mix(in srgb, ${roleSettings.pageBg} 95%, black)`;

  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipLocked, setTooltipLocked] = useState(false);

  useEffect(() => {
    if (!tooltipLocked) return;
    const handleOutsideClick = () => {
      setTooltipLocked(false);
      setTooltipOpen(false);
    };
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [tooltipLocked]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [agentData, setAgentData] = useState<Agent[]>([]);
  const [isChecked, setIsChecked] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [cancelPreviewData, setCancelPreviewData] = useState<CancelPreviewData | null>(null);

  const [showCancelServiceDialog, setShowCancelServiceDialog] = useState(false);
  const [isCancelServiceLoading, setIsCancelServiceLoading] = useState(false);
  const [cancelServicePreviewData, setCancelServicePreviewData] = useState<CancelPreviewData | null>(null);
  const [cancelTargetService, setCancelTargetService] = useState<{uuid: string, name: string} | null>(null);

  const [origin, setOrigin] = useState("");

  const [services, setServices] = useState<Services[]>([]);
  const [filesData, setFilesData] = useState<FilesData | null>(null);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);
  const [invoiceFilter, setInvoiceFilter] = useState<"all" | "primary" | "co-agent">("all");
  const [currentUser, setCurrentUser] = useState<any>(null);

  const refreshOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const data = await GetOneOrder(token, orderId);
      setOrderData(data.data);
      setCountry(data.data.property?.country || "CA");
      setOrder_status(data.data.order_status);
      setProperty_website(data.data.property.property_website);
      setMls_property(data.data.property.mls_number);
      setselectedVendors(data.data.vendor.uuid);
    } catch (err) {
      console.log("Error refreshing order:", err);
    }
  };

  const getOriginalPrice = (sel: OrderService) => {
    const squareFootage = Number(orderData?.property?.square_footage || 0);
    const catalogService = services?.find((s) => s.uuid === sel.service?.uuid);

    return resolveServicePrice({
      orderService: sel,
      catalogService,
      squareFootage,
      invoices,
    });
  };

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  useEffect(() => {
    if (orderData) {
      setselectedVendors(orderData?.slots[0].vendor.uuid);
    }
  }, [orderData]);
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("Token not found.");
      return;
    }

    GetAgents()
      .then((data) => {
        const allAgents = Array.isArray(data.data) ? data.data : [];
        const filteredAgents = allAgents.filter(
          (agent: Agent) => agent.status === true,
        );
        setAgentData(filteredAgents);
      })
      .catch((err) => console.log("Error fetching data:", err.message));
  }, []);

  useEffect(() => {
    const info = localStorage.getItem("userInfo");
    if (info) {
      try {
        setCurrentUser(JSON.parse(info));
      } catch (e) {
        console.error("Failed to parse userInfo", e);
      }
    }
  }, []);
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("Token not found.");
      return;
    }

    GetOneOrder(token, orderId)
      .then((data) => {
        setOrderData(data.data);
        setCountry(data.data.property?.country || "CA");
        setOrder_status(data.data.order_status);
        setProperty_website(data.data.property.property_website);
        setMls_property(data.data.property.mls_number);
        setselectedVendors(data.data.vendor.uuid);
      })
      .catch((err) => console.log(err.message));
  }, [orderId]);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    GetServices(token)
      .then((res) => setServices(Array.isArray(res.data) ? res.data : []))
      .catch(console.log);

    GetFilesData(token, orderId)
      .then((data) => {
        if (data && data.data && data.data[0]) {
          setFilesData(data.data[0]);
        }
      })
      .catch((err) => console.log("Error fetching files data:", err));
  }, [orderId]);

  useEffect(() => {
    if (!orderData?.uuid || userType === "vendor") return;
    setInvoicesLoading(true);
    GetInvoicesByOrder(orderData.uuid)
      .then((res) => setInvoices(Array.isArray(res.data) ? res.data : []))
      .catch(() => console.log("Failed to load invoices"))
      .finally(() => setInvoicesLoading(false));
  }, [orderData?.uuid, userType]);

  const handlePayInvoice = async (invoice: any, mode?: "on_behalf" | "self") => {
    if (!orderData) return;
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    try {

      // Split invoice logic
      const isSplit = !!invoice.split_details;
      const payerUuid = currentUser?.uuid;
      const isOwner = currentUser?.uuid === (invoice.agent?.uuid || invoice.agent_uuid);

      let paymentMode: "on_behalf" | "self" | undefined = mode;

      if (isSplit && !paymentMode) {
        // If owner pays, it's always 'self'
        // If someone else pays for co-agent, it's 'on_behalf'
        // If someone else pays for primary, it's 'self' (taking ownership)
        // Note: Admins always default to 'on_behalf' for split tracking
        if (isOwner) {
          paymentMode = "self";
        } else {
          paymentMode = (invoice.agent_type === "primary" && userType !== "admin") ? "self" : "on_behalf";
        }
      }

      await PayInvoiceWithStripe(
        invoice,
        orderData,
        window.location.href,
        undefined,
        isSplit ? paymentMode : undefined,
        isSplit ? payerUuid : undefined,
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate payment.");
    }
  };

  // Use backend amount as the source of truth for the Grand Total (Net Price)
  const calculatedGrandTotal = parseFloat(orderData?.amount || "0");
  const calculatedPaidAmount = parseFloat(orderData?.paid_amount || "0") || 0;

  // For Balance Due, we subtract the paid amount from the total
  const calculatedBalanceDue = Math.max(
    0,
    calculatedGrandTotal - calculatedPaidAmount,
  );

  const uniqueVendorsMap = new Map();

  if (Array.isArray(orderData?.slots)) {
    orderData?.slots.forEach((slot) => {
      const vendor = slot?.vendor;
      if (vendor && !uniqueVendorsMap.has(vendor.uuid)) {
        uniqueVendorsMap.set(vendor.uuid, vendor);
      }
    });
  }
  function getCountryNameByIso(
    isoCode: string,
    countries: { name: string; isoCode: string }[],
  ) {
    const found = countries.find((c) => c.isoCode === isoCode);
    return found ? found.name : isoCode;
  }
  const uniqueVendors = Array.from(uniqueVendorsMap.values());

  const displayedVendors = (() => {
    if (userType === "admin" || userType === "agent") {
      let list = uniqueVendors || [];
      if (list.length === 0 && orderData?.vendor?.uuid) {
        list = [orderData.vendor];
      }
      return list;
    } else if (userType === "vendor") {
      const loggedInVendor = uniqueVendors?.find((v) => v.uuid === currentUser?.uuid) || (currentUser ? {
        uuid: currentUser.uuid,
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        company: currentUser.company,
        email: currentUser.email,
      } : null);
      return loggedInVendor ? [loggedInVendor] : [];
    }
    return [];
  })();

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("Token not found.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        order_status: order_status,
        lock_materials: isChecked,
        property_website: property_website,
        mls_property: mls_property,
        vendor_uuid: selectedVendors,
        _method: "PUT",
      };

      await EditOrderStatus(orderId, payload, token);

      // const updatedOrder = await GetOneOrder(token, orderId);
      // setOrderData(updatedOrder.data);

      toast.success("Order updated successfully");
    } catch (error) {
      console.error("Error updating order:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleCancelOrder = async (reason?: string) => {
    const token = localStorage.getItem("token");
    if (!token || !orderData) return;
    const statusUpper = (orderData.payment_status || "").toUpperCase().trim();
    const paidAmt = parseFloat(String(orderData.paid_amount || "0"));
    if (
      statusUpper === "PAID" ||
      statusUpper === "PARTIALLY_PAID" ||
      statusUpper === "PARTIAL" ||
      statusUpper === "PARTIALLY PAID" ||
      (!isNaN(paidAmt) && paidAmt > 0)
    ) {
      toast.error("You cannot cancel a paid order. You can only refund the order.");
      return;
    }
    setIsCancelLoading(true);
    try {
      await CancelOrder(orderData.uuid, token, reason);
      toast.success("Order cancelled successfully");
      setShowCancelDialog(false);
      setOrder_status("Cancelled");
      refreshOrders();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel order"
      );
    } finally {
      setIsCancelLoading(false);
    }
  };

  const handleCancelClick = async () => {
    const token = localStorage.getItem("token");
    if (!token || !orderData) return;
    
    // Use isCancelLoading for the spinner on the button itself while fetching preview
    setIsCancelLoading(true);
    try {
      const data = await PreviewCancelOrder(orderData.uuid, token);
      setCancelPreviewData(data.data);
    } catch {
      setCancelPreviewData({
        order_uuid: orderData.uuid,
        can_cancel: true,
        is_free: false,
        cancellation_fee: 0,
        total_paid: parseFloat(orderData.paid_amount || "0"),
        expected_refund: 0,
        threshold_hours: 0,
        fee_percentage: 0,
        booking_datetime: orderData.slots?.[0]?.date || new Date().toISOString(),
        deadline: "",
        timezone: "",
        message: "Cancellation for past booking",
      });
    } finally {
      setIsCancelLoading(false);
      setShowCancelDialog(true);
    }
  };

  const handleCancelServiceClick = async (serviceUuid: string, serviceName: string) => {
    const token = localStorage.getItem("token");
    if (!token || !orderData) return;
    
    setIsCancelServiceLoading(true);
    setCancelTargetService({ uuid: serviceUuid, name: serviceName });
    
    try {
      const data = await PreviewCancelService(orderData.uuid, serviceUuid, token);
      setCancelServicePreviewData(data.data);
    } catch {
      setCancelServicePreviewData({
        order_uuid: orderData.uuid,
        service_uuid: serviceUuid,
        can_cancel: true,
        is_free: false,
        cancellation_fee: 0,
        total_paid: parseFloat(orderData.paid_amount || "0"),
        expected_refund: 0,
        threshold_hours: 0,
        fee_percentage: 0,
        booking_datetime: orderData.slots?.[0]?.date || new Date().toISOString(),
        deadline: "",
        timezone: "",
        message: "Cancellation for past service",
      });
    } finally {
      setIsCancelServiceLoading(false);
      setShowCancelServiceDialog(true);
    }
  };

  const handleCancelService = async (reason?: string) => {
    const token = localStorage.getItem("token");
    if (!token || !orderData || !cancelTargetService) return;
    const statusUpper = (orderData.payment_status || "").toUpperCase().trim();
    const paidAmt = parseFloat(String(orderData.paid_amount || "0"));
    if (
      statusUpper === "PAID" ||
      statusUpper === "PARTIALLY_PAID" ||
      statusUpper === "PARTIAL" ||
      statusUpper === "PARTIALLY PAID" ||
      (!isNaN(paidAmt) && paidAmt > 0)
    ) {
      toast.error("You cannot cancel a paid order. You can only refund the order.");
      return;
    }
    
    setIsCancelServiceLoading(true);
    try {
      await CancelService(orderData.uuid, cancelTargetService.uuid, token, reason);
      toast.success("Service cancelled successfully");
      setShowCancelServiceDialog(false);
      refreshOrders();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel service"
      );
    } finally {
      setIsCancelServiceLoading(false);
    }
  };

  const handlePaymentClick = async () => {
    if (invoices.length > 0) {
      setShowInvoicesModal(true);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Token not found");
      return;
    }

    if (!orderData) {
      toast.error("Order data not available");
      return;
    }

    setIsPaymentLoading(true);
    try {
      const currentUrl =
        typeof window !== "undefined"
          ? window.location.href
          : "";

      await createPayment(orderData, token, currentUrl, {
        paymentType: "full",
        amount: calculatedBalanceDue.toFixed(2),
      });
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment. Please try again.");
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const isPast = isPastBooking(orderData);

  // --- Cancel Order visibility logic ---
  const showCancelButton =
    !!orderData &&
    orderData.order_status !== "Cancelled" &&
    (userType === "admin" || (userType === "agent" && !isPast));

  return (
    <div
      className="font-alexandria"
      style={{
        backgroundColor: roleSettings.pageBg,
        minHeight: "100vh",
        color: roleSettings.pageText,
      }}
    >
      {openEditPopup && userType === "vendor" && (
        <VendorOrderEdit
          currentOrder={orderData ?? undefined}
          open={openEditPopup}
          onOpenChange={setOpenEditPopup}
        />
      )}
      {openNotesPopup && orderData && currentUser && (
        <OrderNotesDialog
          open={openNotesPopup}
          onOpenChange={setOpenNotesPopup}
          orderData={orderData}
          orderId={orderId}
          currentUser={currentUser}
          onNotesUpdated={refreshOrders}
          roleSettings={roleSettings}
        />
      )}
      {showCancelDialog && orderData && (
        <CancelOrderDialog
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          orderData={orderData}
          isLoading={isCancelLoading}
          previewData={cancelPreviewData}
          onConfirm={handleCancelOrder}
        />
      )}
      {showCancelServiceDialog && cancelTargetService && (
        <CancelOrderDialog
          open={showCancelServiceDialog}
          onOpenChange={setShowCancelServiceDialog}
          orderData={orderData!}
          mode="service"
          targetName={cancelTargetService.name}
          isLoading={isCancelServiceLoading}
          previewData={cancelServicePreviewData}
          onConfirm={handleCancelService}
        />
      )}
      <div
        className="w-full h-[80px] font-alexandria  z-10 sticky top-0  flex justify-between px-[20px] items-center"
        style={{
          backgroundColor: headerBg,
          boxShadow: "0px 4px 4px #0000001F",
        }}
      >
        <div className="flex items-center gap-2">
          <p
            className={`text-[16px] md:text-[24px] font-[400]`}
            style={{ color: roleSettings.pageTabColor }}
          >
            Orders ›{" "}
            <span
              className="hidden md:inline-block"
              style={{ color: roleSettings.pageTabColor }}
            >
              {" "}
              {orderData?.id || ""} {`(${orderData?.property?.address || ""})`}
            </span>
          </p>
          {orderData?.order_status === "Cancelled" && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-md border border-red-200">
              CANCELLED
            </span>
          )}
        </div>
        <div className="flex gap-[18px]">
          <Button
            onClick={() => setOpenNotesPopup(true)}
            className={`w-[110px] rounded-[6px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] text-[14px] md:text-[16px] font-[400] flex gap-[5px] justify-center items-center hover:opacity-90`}
            style={{
              backgroundColor: roleSettings.pageBg,
              color: roleSettings.pageTabColor,
              borderColor: roleSettings.pageTabColor,
            }}
          >
            Order Notes
          </Button>
          {userType !== "vendor" && (
            <>
              {orderData?.order_status !== "Cancelled" && (
              <Button
                onClick={() => {
                  router.push(`/dashboard/orders/create/${orderData?.uuid}?isEdit=true`);
                }}
                className={`w-[110px] rounded-[6px] md:w-[143px] h-[35px] md:h-[44px]  border-[1px] text-[14px] md:text-[16px] font-[400] flex gap-[5px] justify-center items-center hover:opacity-90`}
                style={{
                  backgroundColor: roleSettings.pageBg,
                  color: roleSettings.pageTabColor,
                  borderColor: roleSettings.pageTabColor,
                }}
              >
                Edit Order
              </Button>
            )}
            {orderData?.order_status !== "Cancelled" && (
              <Button
                disabled={isLoading}
                onClick={handleSubmit}
                className={`w-[110px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:opacity-90`}
                style={{
                  backgroundColor: roleSettings.pageTabColor,
                  borderColor: roleSettings.pageTabColor,
                }}
              >
                {isLoading ? (
                  <div role="status">
                    <svg
                      aria-hidden="true"
                      className="w-[28px] h-[28px] text-gray-600 animate-spin fill-[#fff]"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>
                    <span className="sr-only">Loading...</span>
                  </div>
                ) : (
                  "Save Changes"
                )}
              </Button>
            )}
            </>
          )}
        </div>
      </div>
      <div
        className={` relative w-full h-[160px] flex flex-col md:flex-row justify-between items-start py-[32px] px-[25px]`}
        style={{ backgroundColor: roleSettings.pageTabColor }}
      >
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{
            backgroundImage: `url('${(() => {
              const featured = filesData?.files?.find(f => f.is_featured) || filesData?.files?.[0];
              if (!featured) return "/ordersBgImg.png";
              return featured.variant_urls?.landing || featured.variant_urls?.popup || featured.url || (featured.file_path ? (featured.file_path.startsWith('http') ? featured.file_path : `${API_URL}/${featured.file_path}`) : "/ordersBgImg.png");
            })()}')`,
          }}
        ></div>

        <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-black/70 to-transparent z-[9]" />
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-black/70 to-transparent z-[9]" />

        <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-center">
          <p className="text-[14px] md:text-[20px] font-[500] text-[#F2F2F2]">
            {orderData?.property?.address || ""}
            <br />
            {getCountryNameByIso(country, countries) || ""} <br />
            {orderData?.property?.postal_code || ""}
          </p>
          <div className="mt-4 md:mt-0">
            <p className="text-[12px] md:text-[16px] font-[500] text-white">
              {orgName}
            </p>
          </div>
        </div>
      </div>
      <div
        className="w-full h-[60px] font-alexandria pr-5 z-20 sticky top-[80px] flex items-center border-b border-[#BBBBBB]"
        style={{ backgroundColor: headerBg }}
      >
        <div className="flex items-center justify-center w-full px-2 md:px-0 overflow-x-auto whitespace-nowrap scrollbar-none">
          <div className="flex items-center justify-center gap-x-2 md:gap-x-6 shrink-0 w-full md:w-auto">
            <Link
              href={`/dashboard/file-manager/${orderId}?listingId=${orderData?.property?.uuid}`}
              className="h-[30px] w-full md:w-[150px] flex-1 md:flex-none cursor-pointer flex items-center uppercase justify-center font-bold text-[11px] border px-1 text-center rounded-[4px] transition-all duration-200 md:min-w-[95px]"
              style={
                false
                  ? {
                    backgroundColor: roleSettings.pageTabColor,
                    borderColor: roleSettings.pageTabColor,
                    color: "#FFFFFF",
                  }
                  : {
                    backgroundColor: "#FFFFFF",
                    borderColor: roleSettings.pageTabColor,
                    color: roleSettings.pageTabColor,
                  }
              }
            >
              Media
            </Link>
            {userType !== "vendor" && (
              <Link
                href={`/dashboard/listings/create/${orderData?.property?.uuid}`}
                className="h-[30px] w-full md:w-[150px] flex-1 md:flex-none cursor-pointer flex items-center uppercase justify-center font-bold text-[11px] border px-1 text-center rounded-[4px] transition-all duration-200 md:min-w-[95px]"
                style={
                  false
                    ? {
                      backgroundColor: roleSettings.pageTabColor,
                      borderColor: roleSettings.pageTabColor,
                      color: "#FFFFFF",
                    }
                    : {
                      backgroundColor: "#FFFFFF",
                      borderColor: roleSettings.pageTabColor,
                      color: roleSettings.pageTabColor,
                    }
                }
              >
                Property details
              </Link>
            )}
            <Link
              href={`/dashboard/orders/${orderData?.uuid}`}
              className="h-[30px] w-full md:w-[150px] flex-1 md:flex-none cursor-pointer flex items-center uppercase justify-center font-bold text-[11px] border px-1 text-center rounded-[4px] transition-all duration-200 md:min-w-[95px]"
              style={
                true
                  ? {
                    backgroundColor: roleSettings.pageTabColor,
                    borderColor: roleSettings.pageTabColor,
                    color: "#FFFFFF",
                  }
                  : {
                    backgroundColor: "#FFFFFF",
                    borderColor: roleSettings.pageTabColor,
                    color: roleSettings.pageTabColor,
                  }
              }
            >
              Order details
            </Link>
          </div>
        </div>
      </div>
      <Accordion
        type="multiple"
        defaultValue={["property", "additional", "statistics"]}
        className="w-full space-y-4"
      >
        <AccordionItem value="property">
          <AccordionTrigger
            className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] text-[18px] font-[600] uppercase [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:text-current`}
            style={{
              backgroundColor: headerBg,
              color: roleSettings.pageTabColor,
            }}
          >
            Order Details
          </AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <div className="w-full flex flex-col items-center">
              <div
                className="w-full md:w-[470px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[16px] text-[14px] font-[400]"
                style={{ color: roleSettings.pageText }}
              >
                <div className="grid grid-cols-2 gap-[16px]">
                  <div className="col-span-2">
                    <label htmlFor="">
                      Order Status <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2 mt-[12px]">
                      <div className="flex-1">
                        <Select
                          value={order_status}
                          onValueChange={(value) => setOrder_status(value)}
                          disabled={userType !== "admin"}
                        >
                          <SelectTrigger
                            className="w-full h-[42px] border-[1px] border-[#BBBBBB]"
                            style={{ backgroundColor: fieldBg }}
                          >
                            <SelectValue placeholder="Select Order Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Processing">Processing</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="On Hold">On Hold</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <TooltipProvider>
                        <Tooltip open={tooltipOpen}>
                          <TooltipTrigger asChild>
                            <div
                              className="cursor-pointer p-2 rounded-md border-[1px] border-[#BBBBBB] h-[42px] w-[42px] flex justify-center items-center hover:bg-gray-200 transition-colors"
                              style={{ backgroundColor: fieldBg }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextLocked = !tooltipLocked;
                                setTooltipLocked(nextLocked);
                                setTooltipOpen(nextLocked);
                              }}
                              onMouseEnter={() => setTooltipOpen(true)}
                              onMouseLeave={() => {
                                if (!tooltipLocked) setTooltipOpen(false);
                              }}
                            >
                              <Info
                                className="h-5 w-5"
                                style={{
                                  color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 20%)`,
                                }}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            className="w-80 p-0 border-[#BBBBBB] shadow-[0px_4px_4px_#0000001F] rounded-[6px] font-alexandria overflow-hidden"
                            style={{
                              backgroundColor: roleSettings.pageBg,
                              color: roleSettings.pageText,
                            }}
                            sideOffset={5}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex flex-col">
                              <div
                                className="px-4 py-3 border-b border-[#BBBBBB]"
                                style={{ backgroundColor: headerBg }}
                              >
                                <h4
                                  className="font-[600] text-[14px] uppercase"
                                  style={{ color: roleSettings.pageText }}
                                >
                                  Order Details
                                </h4>
                              </div>
                              <div className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-[13px]">
                                  <span
                                    style={{
                                      color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 30%)`,
                                    }}
                                  >
                                    Status:
                                  </span>
                                  <span className="font-[500]">
                                    {orderData?.order_status || "N/A"}
                                  </span>
                                  <span
                                    style={{
                                      color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 30%)`,
                                    }}
                                  >
                                    Payment:
                                  </span>
                                  <span
                                    className={`font-[500] px-2 py-0.5 rounded-full w-fit text-[11px] ${orderData?.payment_status === "PAID"
                                      ? "bg-green-500 text-white"
                                      : orderData?.payment_status === "UNPAID"
                                        ? "bg-red-500 text-white text-nowrap"
                                        : "bg-orange-100 text-orange-700"
                                      }`}
                                  >
                                    {orderData?.payment_status || "N/A"}
                                  </span>
                                </div>

                                <div>
                                  <h4
                                    className="font-[600] text-[13px] mb-2 border-b pb-1"
                                    style={{
                                      color: roleSettings.pageText,
                                      borderColor: `color-mix(in srgb, ${roleSettings.pageText}, transparent 80%)`,
                                    }}
                                  >
                                    Services
                                  </h4>
                                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {orderData?.services?.map(
                                      (service, index) => (
                                        <div
                                          key={index}
                                          className="flex flex-col text-[12px] p-2 rounded-[4px] border border-[#E4E4E4] gap-2"
                                          style={{ backgroundColor: fieldBg }}
                                        >
                                          <span
                                            className="font-[600]"
                                            style={{
                                              color: roleSettings.pageText,
                                            }}
                                          >
                                            {service.service?.name ||
                                              service.optionName ||
                                              "Unknown Service"}
                                          </span>
                                          <div className="flex justify-between items-center">
                                            <span
                                              style={{
                                                color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 30%)`,
                                              }}
                                            >
                                              Payment:
                                            </span>
                                            <span
                                              className={`px-2 py-0.5 rounded-full text-[11px] font-[500] ${service.payment_status ===
                                                "PAID"
                                                ? "bg-green-500 text-white"
                                                : "bg-red-500 text-white"
                                                }`}
                                            >
                                              {service.payment_status ||
                                                "Pending"}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span
                                              style={{
                                                color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 30%)`,
                                              }}
                                            >
                                              Completion:
                                            </span>
                                            <span
                                              className={`px-2 py-0.5 rounded-full text-[11px] font-[500] ${service.is_completed
                                                ? "bg-green-500 text-white"
                                                : "bg-gray-200 text-gray-700"
                                                }`}
                                            >
                                              {service.is_completed
                                                ? "Completed"
                                                : "Pending"}
                                            </span>
                                          </div>
                                        </div>
                                      ),
                                    )}
                                    {(!orderData?.services ||
                                      orderData.services.length === 0) && (
                                        <p
                                          style={{
                                            color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 40%)`,
                                          }}
                                          className="text-[12px] italic"
                                        >
                                          No services found
                                        </p>
                                      )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  {/* <div className="col-span-2 flex flex-col gap-[16px]">

                    <label htmlFor="">Order Fulfilled Email</label>
                    <div className=' grid grid-cols-5 gap-[16px]'>
                      <Button
                        className="col-span-2 w-full rounded-[3px] md:w-full h-[32px] md:h-[32px]  border-[1px] border-[#4290E9] bg-[#EEEEEE] text-[14px] md:text-[14px] font-[600] text-[#4290E9] flex gap-[5px] justify-center items-center hover:text-[#fff] hover:bg-[#4290E9] font-raleway"
                      >
                        Customize
                      </Button>
                      <Button
                        // disabled={isLoading}
                        // onClick={() => {
                        //     setPendingAction1(() => handleSubmit);
                        //     setConfirmOpen1(true);
                        // }}
                        className="col-span-3 w-full md:w-full h-[32px] md:h-[32px] rounded-[3px] border-[1px] border-[#4290E9] bg-[#4290E9] text-[14px] md:text-[14px] font-[600] text-[#EEEEEE] flex gap-[5px] items-center hover:text-[#fff] hover:bg-[#4290E9] font-raleway "
                      >
                        Preview/Send
                      </Button>
                    </div>

                  </div> */}
                  <div className="col-span-2">
                    <label htmlFor="">
                      {displayedVendors.length > 1 ? "Team Members" : "Team Member"} <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={selectedVendors}
                      onValueChange={() => { }}
                      disabled={displayedVendors.length === 0}
                    >
                      <SelectTrigger
                        className="w-full h-[42px] border-[1px] border-[#BBBBBB] mt-[12px] text-left"
                        style={{ backgroundColor: fieldBg }}
                      >
                        <span className="truncate pr-4">
                          {displayedVendors.length > 0
                            ? displayedVendors.map((v) => `${v.first_name} ${v.last_name}`).join(", ")
                            : "Select Team Member"}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {displayedVendors.map((vendor) => (
                          <SelectItem key={vendor.uuid} value={vendor.uuid}>
                            {`${vendor.first_name} ${vendor.last_name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {orderData?.order_status !== "Cancelled" && (
                    <div className="col-span-2">
                      <label htmlFor="">Property Website</label>
                      {orderData?.uuid ? (
                        <div className="relative w-full">
                          <Input
                            value={`${origin}/tour/${orderData?.property?.address?.replace(/\s+/g, "-")}/${orderData?.uuid}`}
                            readOnly
                            type="text"
                            className="h-[42px] border-[1px] border-[#BBBBBB] truncate mt-[12px] pr-10"
                            style={{ backgroundColor: fieldBg }}
                          />
                          <Copy
                            onClick={() => {
                              const url = `${origin}/tour/${orderData?.property?.address?.replace(/\s+/g, "-")}/${orderData?.uuid}`;
                              navigator.clipboard.writeText(url);
                              toast.success("Tour link copied to clipboard");
                            }}
                            className="cursor-pointer absolute right-3 top-[calc(50%+6px)] -translate-y-1/2 h-[20px] w-[20px]"
                            style={{ color: roleSettings.pageTabColor }}
                            strokeWidth={1}
                          />
                        </div>
                      ) : (
                        <>
                          <Input
                            value={property_website}
                            onChange={(e) => setProperty_website(e.target.value)}
                            placeholder="Enter Property Website URL"
                            className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                            style={{ backgroundColor: fieldBg }}
                            type="text"
                            readOnly
                          />
                          <div className="flex justify-end">
                            <p
                              className={`underline text-[12px] w-fit cursor-pointer`}
                              style={{ color: roleSettings.pageTabColor }}
                            >
                              Customize URL
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <div className="col-span-2">
                    <label htmlFor="">
                      MLS Property <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={mls_property}
                      onChange={(e) => setMls_property(e.target.value)}
                      placeholder="Enter MLS Property"
                      className="h-[42px] border-[1px] border-[#BBBBBB] mt-[12px]"
                      style={{ backgroundColor: fieldBg }}
                      type="text"
                    />
                    {/* {fieldErrors.heading && (
                                            <p className="text-red-500 text-[10px]">
                                                {fieldErrors.heading[0]}
                                            </p>
                                        )} */}
                  </div>
                  <div className="col-span-2 flex flex-col gap-[16px]">
                    <Button
                      onClick={() =>
                        router.push(
                          `/dashboard/file-manager/${orderId}?listingId=${orderData?.property?.uuid}`,
                        )
                      }
                      className={`col-span-3 w-full md:w-full h-[32px] md:h-[32px] rounded-[3px] border-[1px] text-[14px] md:text-[14px] font-[600] text-[#EEEEEE] flex gap-[5px] items-center hover:opacity-85 font-raleway`}
                      style={{
                        backgroundColor: roleSettings.pageTabColor,
                        borderColor: roleSettings.pageTabColor,
                      }}
                    >
                      Go To File Manager
                    </Button>
                    {userType === "admin" && (
                      <div
                        className="grid grid-cols-2 gap-[16px] font-[400] text-[14px] justify-items-end"
                        style={{ color: roleSettings.pageText }}
                      >
                        <p>Require payment before releasing materials</p>
                        <Switch
                          checked={isChecked}
                          onCheckedChange={setIsChecked}
                          className="data-[state=checked]:bg-transparent"
                          style={{
                            backgroundColor: isChecked
                              ? roleSettings.pageTabColor
                              : undefined,
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {userType !== "vendor" && orderData?.order_status !== "Cancelled" && (
                    <div className="col-span-2 flex flex-col gap-[16px] mt-[40px]">
                      <Button
                        onClick={() => setOpenEditPopup(true)}
                        className={`col-span-3 w-full md:w-full h-[32px] md:h-[32px] rounded-[3px] border-[1px] text-[14px] md:text-[14px] font-[600] text-[#EEEEEE] flex gap-[5px] items-center hover:opacity-85 font-raleway`}
                        style={{
                          backgroundColor: roleSettings.pageTabColor,
                          borderColor: roleSettings.pageTabColor,
                        }}
                      >
                        Upgrade/Downgrade Order
                      </Button>
                    </div>
                  )}


                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="additional">
          <AccordionTrigger
            className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] text-[18px] font-[600] uppercase [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:text-current`}
            style={{
              backgroundColor: headerBg,
              color: roleSettings.pageTabColor,
            }}
          >
            Order Details
          </AccordionTrigger>
          <AccordionContent className="grid gap-4">
            <div className="w-full flex flex-col items-center">
              <div className="w-full md:w-[450px] py-[32px] px-[10px] md:px-0 flex justify-center flex-col gap-[48px] text-[#424242] text-[14px] font-[400]">
                <div className="flex flex-col gap-[10px]">
                  <div className="flex justify-between gap-[12px]">
                    <div className="flex gap-[12px] items-center">
                      <File
                        className="h-[24px] w-[30px] md:h-[36px] md:w-[40px]"
                        style={{ color: roleSettings.pageTabColor }}
                      />
                      <p
                        className="text-[24px] md:text-[36px] font-[400]"
                        style={{ color: roleSettings.pageTabColor }}
                      >
                        Order {orderData?.id}
                      </p>
                    </div>
                    <div className="items-center gap-[12px] hidden">
                      <Switch className=" data-[state=checked]:bg-[#6BAE41] " />
                      <p className="text-[#666666] text-[16px]">Open</p>
                    </div>
                  </div>
                  <p className="text-[#666666] text-[16px] font-[400]">
                    This is only a quote. Invoiced amount will likely change
                    based on actual measured area.
                  </p>
                </div>
                <div className="text-[#666666] flex gap-x-[20px]">
                  <div className="flex flex-col gap-y-[20px] w-1/2 text-wrap">
                    <p>{uniqueVendors?.length > 1 ? "Vendors" : "Vendor"}</p>
                    {uniqueVendors?.map((vendor) => (
                      <div key={vendor.uuid}>
                        <p>
                          {vendor.first_name} {vendor.last_name}
                        </p>
                        <p>{vendor.company?.company_name ?? "N/A"}</p>
                        <p>{vendor.email}</p>
                      </div>
                    ))}
                  </div>

                  <div className="w-1/2 text-wrap">
                    <p className="mb-[20px]">Customer</p>
                    <p>Realtor</p>
                    <p>
                      {orderData?.agent?.first_name}{" "}
                      {orderData?.agent?.last_name}
                    </p>
                    <p>{orderData?.agent?.company_name}</p>
                    <p>{orderData?.agent?.email}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-[18px] text-[#666666] text-[16px]">
                  <p className="text-[20px] text-[#666666] font-[700]">
                    Order Details
                  </p>
                  <p className="grid grid-cols-4 gap-[15px]">
                    <span className="col-span-3">Package</span>
                    {userType !== "vendor" && (
                      <span className="col-span-1">
                        $
                        {orderData?.services
                          ?.reduce(
                            (total, service) => total + getOriginalPrice(service),
                            0,
                          )
                          .toFixed(2)}
                      </span>
                    )}
                  </p>

                  <p className="grid grid-cols-4 gap-[15px]">
                    <span className="col-span-3">Items</span>
                    <span className="col-span-1">
                      {orderData?.services?.length}
                    </span>
                  </p>
                  <div className="grid gap-[15px]">
                    {orderData?.services?.map((service) => {
                      const isPaid =
                        service.payment_status?.toUpperCase() === "PAID";
                      const originalPrice = getOriginalPrice(service);
                      return (
                        <p
                          key={service.id}
                          className="grid grid-cols-4 gap-[15px] items-center group relative"
                        >
                          <span className="col-span-3 flex items-center gap-2">
                            {service.service?.name ||
                              service.optionName ||
                              "Unknown Service"}
                            {isPaid && (
                              <span className="text-[10px] bg-[#6BAE41] text-white px-1.5 py-0.5 rounded font-semibold uppercase">
                                Paid
                              </span>
                            )}
                            {showCancelButton && (
                              <button
                                onClick={() => handleCancelServiceClick(service.uuid, service.service?.name || service.optionName || "Unknown Service")}
                                className="transition-opacity ml-2 text-[10px] text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded border border-red-200 flex-shrink-0"
                                title="Cancel this service"
                              >
                                Cancel Service
                              </button>
                            )}
                          </span>
                          {userType !== "vendor" && (
                            <span className="col-span-1">
                              ${originalPrice.toFixed(2)}
                            </span>
                          )}
                        </p>
                      );
                    })}
                  </div>
                  {userType !== "vendor" && (() => {
                    const primaryInvoice = invoices.find((inv) => (inv.agent_type === "primary" || (inv.agent && !inv.split_details))) || invoices[0];
                    const taxRate = parseFloat(primaryInvoice?.tax_rate || "0");

                    // Calculate subtotal from services
                    const subtotal =
                      orderData?.services?.reduce(
                        (sum, s) => sum + getOriginalPrice(s),
                        0,
                      ) || 0;

                    // Calculate total discount from orderData.totals array
                    const totalDiscount =
                      orderData?.totals?.reduce((total, item) => {
                        if (item.amount && parseFloat(item.amount) < 0) {
                          return total + Math.abs(parseFloat(item.amount));
                        }
                        return total;
                      }, 0) || 0;

                    // Calculate discount percentage
                    const discountPercent =
                      subtotal > 0
                        ? ((totalDiscount / subtotal) * 100).toFixed(2)
                        : "0.00";

                    const gstAmount = primaryInvoice
                      ? parseFloat(primaryInvoice.tax_amount || "0")
                      : (subtotal - totalDiscount) * (taxRate / 100);

                    // Grand total is the final amount from the order
                    const grandTotal = parseFloat(orderData?.amount || "0") + gstAmount;

                    // Get paid amount from order data
                    const paidAmount =
                      parseFloat(orderData?.paid_amount || "0") || 0;

                    // Calculate balance due
                    const balanceDue = grandTotal - paidAmount;

                    return (
                      <>
                        {/* Subtotal */}
                        <p className="grid grid-cols-4 gap-[15px]">
                          <span className="col-span-3">Subtotal</span>
                          <span className="col-span-1">
                            ${subtotal.toFixed(2)}
                          </span>
                        </p>

                        {/* Discount */}
                        {totalDiscount > 0 && (
                          <p className="grid grid-cols-4 gap-[15px]">
                            <span className="col-span-3">Discount</span>
                            <span className="col-span-1">
                              -${totalDiscount.toFixed(2)} ({discountPercent}%)
                            </span>
                          </p>
                        )}

                        {/* GST/HST */}
                        <p className="grid grid-cols-4 gap-[15px]">
                          <span className="col-span-3">GST/HST {taxRate > 0 ? `(${taxRate}%)` : ""}</span>
                          <span className="col-span-1">${gstAmount.toFixed(2)}</span>
                        </p>

                        {/* PST/RST/QST */}
                        <p className="grid grid-cols-4 gap-[15px]">
                          <span className="col-span-3">PST/RST/QST</span>
                          <span className="col-span-1">$0.00</span>
                        </p>

                        {/* Order/Quote approx. */}
                        <p className="grid grid-cols-4 gap-[15px]">
                          <span className="col-span-3">Order/Quote approx.</span>
                          <span className="col-span-1">
                            ${grandTotal.toFixed(2)}
                          </span>
                        </p>

                        {/* Show paid amount if any payment has been made */}
                        {paidAmount > 0 && (
                          <p className="grid grid-cols-4 gap-[15px] text-[#6BAE41]">
                            <span className="col-span-3">Paid</span>
                            <span className="col-span-1">
                              -${paidAmount.toFixed(2)}
                            </span>
                          </p>
                        )}

                        {/* Show balance due */}
                        <p className="grid grid-cols-4 gap-[15px] text-[20px] md:text-[24px] font-[500] border-t pt-2">
                          <span className="col-span-3">
                            {paidAmount > 0 ? "Balance Due" : "Amount Due"}
                          </span>
                          <span className="col-span-1">
                            ${Math.max(0, balanceDue).toFixed(2)}
                          </span>
                        </p>
                      </>
                    );
                  })()}
                  {userType !== "vendor" && orderData?.order_status === "Cancelled" && (
                    <div className="col-span-2 flex flex-col gap-3 w-full">
                      <Button
                        disabled
                        className="w-full rounded-[3px] h-[36px] border-[1px] text-[14px] font-[600] flex gap-[5px] justify-center items-center font-raleway bg-gray-300 text-gray-600 border-gray-300 cursor-not-allowed"
                      >
                        Cancelled
                      </Button>
                      <div className="p-3 bg-red-50 border border-red-200 rounded-[4px] text-red-700 text-[13px] flex items-center gap-2">
                        <span className="font-semibold">Notice:</span>
                        <span>This order has been cancelled. No further payment or edit actions can be taken.</span>
                      </div>
                    </div>
                  )}
                  {userType !== "vendor" && orderData?.order_status !== "Cancelled" && (
                    <div className="col-span-2 flex flex-col sm:flex-row gap-4 w-full">
                      {invoices.length > 0 ? (
                        <>
                          {/* If current user is a co-agent on any invoice, just show "Pay Now" */}
                          {invoices.some(inv => (inv.agent?.uuid === currentUser?.uuid || inv.agent_uuid === currentUser?.uuid) && inv.status !== 'paid') ? (
                            <Button
                              onClick={() => {
                                setInvoiceFilter("all");
                                setShowInvoicesModal(true);
                              }}
                              className={`w-full rounded-[3px] h-[32px] border-[1px] text-[14px] font-[600] flex gap-[5px] justify-center items-center hover:opacity-90 font-raleway`}
                              style={{
                                backgroundColor: roleSettings.pageTabColor,
                                color: "#FFFFFF",
                                borderColor: roleSettings.pageTabColor,
                              }}
                            >
                              Pay Now
                            </Button>
                          ) : (
                            <>
                              {invoices.some((inv) => inv.agent_type === "primary") && (
                                <Button
                                  onClick={() => {
                                    setInvoiceFilter("primary");
                                    setShowInvoicesModal(true);
                                  }}
                                  className={`w-full rounded-[3px] h-[32px] border-[1px] text-[14px] font-[600] flex gap-[5px] justify-center items-center hover:opacity-90 font-raleway`}
                                  style={{
                                    backgroundColor: roleSettings.pageTabColor,
                                    color: "#FFFFFF",
                                    borderColor: roleSettings.pageTabColor,
                                  }}
                                >
                                  {userType === "admin" ? "Pay Now" : "Pay Self"}
                                </Button>
                              )}
                              {invoices.some((inv) => inv.agent_type === "co-agent") && (
                                <Button
                                  onClick={() => {
                                    setInvoiceFilter("co-agent");
                                    setShowInvoicesModal(true);
                                  }}
                                  variant="outline"
                                  className={`w-full rounded-[3px] h-[32px] border-[1px] text-[14px] font-[600] flex gap-[5px] justify-center items-center hover:opacity-90 font-raleway bg-white`}
                                  style={{
                                    color: roleSettings.pageTabColor,
                                    borderColor: roleSettings.pageTabColor,
                                  }}
                                >
                                  Co-agent&apos;s Payment
                                </Button>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        orderData?.payment_status !== "PAID" && (
                          <Button
                            onClick={handlePaymentClick}
                            disabled={isPaymentLoading}
                            className={`w-full rounded-[3px] h-[32px] border-[1px] text-[14px] font-[600] flex gap-[5px] justify-center items-center hover:opacity-90 font-raleway`}
                            style={{
                              backgroundColor: roleSettings.pageTabColor,
                              color: "#FFFFFF",
                              borderColor: roleSettings.pageTabColor,
                            }}
                          >
                            {isPaymentLoading
                              ? "Processing..."
                              : `Make Payment $${calculatedBalanceDue.toFixed(2)}`}
                          </Button>
                        )
                      )}
                    </div>
                  )}
                </div>
                {userType !== "vendor" && showCancelButton && (
                  <div className="flex flex-col mt-[0px] w-full">
                    <Button
                      onClick={handleCancelClick}
                      disabled={isCancelLoading}
                      className="w-full rounded-[3px] h-[32px] border-[1px] text-[14px] font-[600] flex gap-[5px] justify-center items-center hover:opacity-90 font-raleway border-red-600 bg-red-600 hover:bg-red-500 text-white shadow-sm"
                    >
                      {isCancelLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Cancel Order"
                      )}
                    </Button>
                    <p className="text-[12px] text-red-600 mt-2 text-center">
                      Canceling an order cannot be undone. A cancellation fee may apply depending on the schedule.
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[12px]">
                    <span className="text-[14px] font-[500]">Important Final Pricing Notice:</span> The amount shown above is an estimated quote.
                    Final billing is calculated post-service and may vary based on actual on-site measurements (square footage),
                    travel expenses, and any additional services requested during the shoot.
                    The final invoice will be generated and sent to you upon project completion.
                  </p>
                </div>

                {/* Danger Zone */}

              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>

      <Dialog open={showInvoicesModal} onOpenChange={setShowInvoicesModal}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle
              className="text-xl font-bold uppercase"
              style={{ color: roleSettings.pageTabColor }}
            >
              {invoiceFilter === "primary"
                ? "Main Agent Invoices"
                : invoiceFilter === "co-agent"
                  ? "Co-agent Invoices"
                  : "Order Invoices"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 grid gap-4">
            {invoicesLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : invoices.filter((inv) =>
              invoiceFilter === "all" ? true : inv.agent_type === invoiceFilter
            ).length === 0 ? (
              <p
                className="text-center italic"
                style={{
                  color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 40%)`,
                }}
              >
                No {invoiceFilter === "primary" ? "primary" : invoiceFilter === "co-agent" ? "co-agent" : ""} invoices found for this order.
              </p>
            ) : (
              <div className="flex flex-col gap-4 pb-10">
                {invoices
                  .filter((inv) =>
                    invoiceFilter === "all" ? true : inv.agent_type === invoiceFilter
                  )
                  .map((invoice) => {
                    const status = (invoice.status || "unpaid").toUpperCase();
                    let badgeBg = "#E06D5E"; // Unpaid
                    if (status === "PAID") badgeBg = "#6BAE41";
                    else if (status === "ISSUED") badgeBg = "#4A90E2";
                    else if (status === "VOID") badgeBg = "#A0A0A0";
                    else if (
                      status === "PARTIALLY_PAID" ||
                      status === "PARTIAL"
                    )
                      badgeBg = "#F5A623";
                    else if (status === "REFUNDED") badgeBg = "#D0021B";

                    return (
                      <div
                        key={invoice.uuid}
                        className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded border border-[#E4E4E4] gap-4"
                        style={{ backgroundColor: fieldBg }}
                      >
                        <div className="flex flex-col gap-1 w-full md:w-1/2">
                          <div className="flex items-center gap-3">
                            <span
                              className="font-[600] text-[16px]"
                              style={{ color: roleSettings.pageText }}
                            >
                              #{invoice.invoice_number || invoice.id}
                            </span>
                            <span
                              className="text-white px-2 py-0.5 rounded-full text-[10px] font-medium uppercase"
                              style={{ backgroundColor: badgeBg }}
                            >
                              {status}
                            </span>
                          </div>
                          <span
                            className="text-[12px]"
                            style={{
                              color: `color-mix(in srgb, ${roleSettings.pageText}, transparent 30%)`,
                            }}
                          >
                            Issued:{" "}
                            {new Date(invoice.issued_at).toLocaleDateString()}
                          </span>

                          {invoice.items && invoice.items.length > 0 && (
                            <div
                              className="mt-2 text-[12px] truncate opacity-80"
                              style={{ color: roleSettings.pageText }}
                            >
                              Services:{" "}
                              {invoice.items
                                .map((i: any) => i.description || "Service Item")
                                .join(", ")}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                          <div className="flex flex-col md:items-end">
                            <span
                              className="text-[18px] font-bold"
                              style={{ color: roleSettings.pageText }}
                            >
                              ${parseFloat(invoice.total).toFixed(2)}
                            </span>
                            {parseFloat(invoice.paid_amount) > 0 && (
                              <span className="text-[12px] text-[#6BAE41]">
                                Paid: ${parseFloat(invoice.paid_amount).toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap justify-start md:justify-end">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setViewingInvoice(invoice);
                              }}
                              className="h-[32px] text-[12px] px-3 font-semibold hover:opacity-80 border"
                              style={{
                                borderColor: roleSettings.pageTabColor,
                                color: roleSettings.pageTabColor,
                              }}
                            >
                              View Document
                            </Button>
                            {status !== "PAID" && status !== "VOID" && (
                              currentUser?.uuid === (invoice.agent?.uuid || invoice.agent_uuid) ? (
                                <Button
                                  onClick={() => {
                                    setShowInvoicesModal(false);
                                    handlePayInvoice(invoice);
                                  }}
                                  className="h-[32px] text-[12px] px-3 font-semibold text-white hover:opacity-90"
                                  style={{
                                    backgroundColor: roleSettings.pageTabColor,
                                    borderColor: roleSettings.pageTabColor,
                                  }}
                                >
                                  Pay Now
                                </Button>
                              ) : (
                                <div className="flex gap-2">
                                  {/* Admins always pay on behalf. Agents pay on behalf for co-agents. */}
                                  {(userType === "admin" || (invoice.agent_type === "co-agent" && invoice.split_details)) && (
                                    <Button
                                      onClick={() => {
                                        setShowInvoicesModal(false);
                                        handlePayInvoice(invoice, "on_behalf");
                                      }}
                                      className="h-[32px] text-[12px] px-3 font-semibold text-white hover:opacity-90"
                                      style={{
                                        backgroundColor: roleSettings.pageTabColor,
                                        borderColor: roleSettings.pageTabColor,
                                      }}
                                    >
                                      Pay on Behalf
                                    </Button>
                                  )}
                                  {/* Agents can pay self (take ownership) for any invoice. Admins cannot. */}
                                  {userType !== "admin" && (
                                    <Button
                                      onClick={() => {
                                        setShowInvoicesModal(false);
                                        handlePayInvoice(invoice, "self");
                                      }}
                                      className="h-[32px] text-[12px] px-3 font-semibold text-white hover:opacity-90"
                                      style={{
                                        backgroundColor: roleSettings.pageTabColor,
                                        borderColor: roleSettings.pageTabColor,
                                      }}
                                    >
                                      Pay Self
                                    </Button>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingInvoice} onOpenChange={(open) => !open && setViewingInvoice(null)}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col rounded-[8px] p-0 font-alexandria overflow-hidden">
          {viewingInvoice && (
            <>
              <DialogHeader className="p-4 md:p-6 border-b border-[#E4E4E4] bg-white shrink-0">
                <DialogTitle className="flex flex-col md:flex-row items-start md:items-center w-full font-alexandria relative pr-8 md:pr-0">
                  <div className="flex flex-col items-start w-full md:w-auto">
                    <span className="text-[20px] md:text-[22px] font-[700] uppercase tracking-wide leading-none" style={{ color: roleSettings.pageTabColor }}>
                      Invoice
                    </span>
                    <span className="text-[13px] md:text-[15px] font-[500] text-gray-500 mt-1.5 break-all">
                      #{viewingInvoice?.invoice_number || viewingInvoice?.id}
                    </span>
                  </div>

                  <div className={`flex w-full md:w-auto md:ml-auto md:items-center gap-2 mt-4 md:mt-0 md:pr-4 ${userType === 'admin' ? 'flex-row' : 'flex-col md:flex-row items-start'}`}>
                    {userType !== "vendor" &&
                      viewingInvoice.status?.toUpperCase() !== "PAID" &&
                      viewingInvoice.status?.toUpperCase() !== "VOID" && (
                        currentUser?.uuid === (viewingInvoice.agent?.uuid || viewingInvoice.agent_uuid) ? (
                          <Button
                            onClick={() => {
                              handlePayInvoice(viewingInvoice);
                              setViewingInvoice(null);
                            }}
                            className={`flex-1 h-[40px] md:h-[36px] px-2 md:px-6 text-[12px] md:text-[14px] font-semibold text-white hover:brightness-90 hover:!text-white rounded-[6px] ${userType}-bg hover-${userType}-bg border-none w-full md:w-auto shadow-sm transition-all`}
                            style={{ backgroundColor: roleSettings.pageTabColor }}
                          >
                            Pay Now
                          </Button>
                        ) : (
                          <div className="flex flex-row sm:flex-row gap-2 w-full md:w-auto flex-1">
                            {(userType === "admin" || (viewingInvoice.agent_type === "co-agent" && viewingInvoice.split_details)) && (
                              <Button
                                onClick={() => {
                                  handlePayInvoice(viewingInvoice, "on_behalf");
                                  setViewingInvoice(null);
                                }}
                                className={`flex-1 h-[40px] md:h-[36px] px-2 md:px-6 text-[12px] md:text-[14px] font-semibold text-white hover:brightness-90 hover:!text-white rounded-[6px] ${userType}-bg hover-${userType}-bg border-none w-full md:w-auto shadow-sm transition-all`}
                                style={{ backgroundColor: roleSettings.pageTabColor }}
                              >
                                Pay on Behalf
                              </Button>
                            )}
                            {userType !== "admin" && (
                              <Button
                                onClick={() => {
                                  handlePayInvoice(viewingInvoice, "self");
                                  setViewingInvoice(null);
                                }}
                                className={`flex-1 h-[40px] md:h-[36px] px-2 md:px-6 text-[12px] md:text-[14px] font-semibold text-white hover:brightness-90 hover:!text-white rounded-[6px] ${userType}-bg hover-${userType}-bg border-none w-full md:w-auto shadow-sm transition-all`}
                                style={{ backgroundColor: roleSettings.pageTabColor }}
                              >
                                Pay Self
                              </Button>
                            )}
                          </div>
                        )
                      )}
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F9F9F9]">
                <div className="flex flex-col items-center">
                  <InvoiceDocument
                    invoice={viewingInvoice}
                    editData={viewingInvoice}
                    isEditing={false}
                    updateItem={() => { }}
                    addItem={() => { }}
                    removeItem={() => { }}
                    updateTaxRate={() => { }}
                    setEditData={() => { }}
                    roleSettings={roleSettings}
                  />
                </div>
              </div>
              <DialogFooter className="border-t p-4 shrink-0 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                  <Button 
                      onClick={() => setViewingInvoice(null)}
                      className="text-white hover:brightness-110 transition-all px-8 h-10 w-full sm:w-auto"
                      style={{ backgroundColor: roleSettings.pageTabColor }}
                  >
                      Close
                  </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Page;
