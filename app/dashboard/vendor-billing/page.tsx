"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useLoadScript } from "@react-google-maps/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { ChevronDown, ChevronUp, Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Get, GetVendors } from "../orders/orders";
import { GetServices } from "../services/services";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GetOne, GetVendorEarnings, GetMyEarnings } from "../vendors/vendors";
import { useRouter } from "next/navigation";
import { batchCalculateTravelCosts } from "@/lib/batchTravelCalculator";
import { vendorBillingService, VendorInvoice } from "./VendorBillingService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import InvoiceDocument from "@/app/dashboard/invoice/components/InvoiceDocument";
import InvoicePdfDocument from "@/app/dashboard/invoice/components/InvoicePdfDocument";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileVendorEarnings from "@/components/mobile/vendor/MobileVendorEarnings";
import MobileAdminVendorBilling from "@/components/mobile/vendor-billing/MobileAdminVendorBilling";

export interface Slot {
  id: number;
  service_id: number;
  vendor_id: number | string;
  start_time: string;
  end_time: string;
  date: string;
  vendor: Vendor;
  order?: {
    id: number;
    property_address: string;
    property_location: string;
  };
}

export interface Vendor {
  uuid: string;
  first_name: string;
  last_name: string;
}

export interface ServiceRecord {
  service_id?: number;
  service?: {
    id: number;
    name: string;
    is_travel_required?: boolean | number;
  };
  service_name?: string;
  name?: string;
  option?: { title?: string };
  option_id?: string | number;
  amount?: string | number;
  uuid?: string;
  is_travel_required?: boolean | number;
  is_completed?: boolean | number;
  vendor_paid?: boolean | number;
  vendor_invoice_id?: number | null;
  vendor_payment?: any;
}

export interface Order {
  id: number;
  created_at: string;
  slots: Slot[];
  services: ServiceRecord[];
  // Flat fields returned directly by GET /orders
  property_address?: string;
  property_location?: string;
  // Nested property object (returned by GET /orders/:uuid)
  property?: {
    property_address?: string;
    property_location?: string;
    address?: string;
  };
}

export interface VendorService {
  serviceId: number;
  serviceName: string;
  option?: { title?: string };
  amount: string | number;
  slots: Slot[];
  status?: string;
  is_travel_required?: boolean | number;
  uuid?: string;
  vendor_payment?: {
    stripe_transfer_id: string;
    uuid: string;
    invoice_url: string;
  };
  vendor_paid?: boolean | number;
  vendor_invoice_id?: number | null;
  is_completed?: boolean | number;
}

export interface VendorOrder {
  orderId: number;
  created_at: string;
  services: VendorService[];
}

export interface VendorGrouped {
  vendorId: number | string;
  vendor: Vendor;
  totalServices: number;
  totalOrders: number;
  totalAmount: number;
  added: string | null;
  orders: VendorOrder[];
}
interface ServiceForVendor {
  serviceId: number;
  serviceName: string;
  option?: { title?: string };
  option_id?: string | number;
  amount: string | number;
  slots: Slot[];
  status?: "COMPLETE" | "PENDING" | string;
  uuid?: string;
  is_travel_required?: boolean | number;
  vendor_payment?: {
    stripe_transfer_id: string;
    uuid: string;
    invoice_url: string;
  };
  vendor_paid?: boolean | number; // NEW — from order_services
  vendor_invoice_id?: number | null; // NEW — FK to vendor_invoices.id
  is_completed?: boolean | number; // NEW — from order_services
}

interface TravelCost {
  orderId: number;
  serviceUuid: string;
  date: string;
  distance: number;
  estimatedTime: number;
  travelCost: number;
  fromAddress: string;
  toAddress: string;
  error?: boolean;
  errorType?:
    | "VENDOR_NO_ADDRESS"
    | "PROPERTY_NOT_FOUND"
    | "ROUTE_UNROUTABLE"
    | "API_ERROR"
    | "GEOCODE_FAILED";
  errorMessage?: string;
  isFallback?: boolean;
}

interface VendorLocationData {
  vendorId: string | number;
  startLocationAddress: string;
  paymentPerKm: number;
}

interface VendorPriceOption {
  option_id: number | string;
  vendor_price: string | number;
}

interface VendorPriceService {
  options?: VendorPriceOption[];
}

interface VendorPriceData {
  uuid: string;
  vendor_services?: VendorPriceService[];
}

const logBillingError = (context: string, error: any, additionalData?: any) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: error?.message || error?.response?.data?.message || String(error),
    vendorId: additionalData?.vendorId || additionalData?.vendorUuid,
    invoiceId: additionalData?.invoiceId || additionalData?.invoiceUuid,
    userId:
      typeof window !== "undefined" ? localStorage.getItem("userId") : null,
    userAgent: typeof window !== "undefined" ? navigator.userAgent : null,
  };
  console.error("[Billing Error]", errorLog);
};

const Page = () => {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showAgain, setShowAgain] = useState(true);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    let ancestor = header.parentElement;
    while (ancestor) {
      const style = window.getComputedStyle(ancestor);
      if (
        style.overflowX === "hidden" ||
        ancestor.classList.contains("overflow-x-hidden")
      ) {
        ancestor.style.setProperty("overflow-x", "visible", "important");
        ancestor.style.setProperty("overflow-y", "visible", "important");

        const target = ancestor;
        return () => {
          target.style.removeProperty("overflow-x");
          target.style.removeProperty("overflow-y");
        };
      }
      ancestor = ancestor.parentElement;
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(
      "confirmation_dialog_payment_show_again",
    );
    if (stored !== null) {
      setShowAgain(JSON.parse(stored));
    }
  }, []);
  const [loading, setLoading] = useState<boolean>(true);
  const [orderData, setOrderData] = useState<Order[]>([]);
  const [globalServices, setGlobalServices] = useState<any[]>([]);
  const { userType } = useAppContext();
  const isMobile = useIsMobile();

  const loggedInVendorUuid = useMemo(() => {
    if (userType === "vendor" && typeof window !== "undefined") {
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        try {
          const parsedInfo = JSON.parse(userInfo);
          return parsedInfo.uuid || "";
        } catch (err) {
          console.error("Failed to parse userInfo:", err);
        }
      }
    }
    return "";
  }, [userType]);
  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string) || "admin";
  const roleSettings =
    appliedSettings[role as keyof typeof appliedSettings] ||
    appliedSettings["admin"];
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [travelCosts, setTravelCosts] = useState<Map<string, TravelCost>>(
    new Map(),
  );
  const [vendorLocationData, setVendorLocationData] = useState<
    Map<string | number, VendorLocationData>
  >(new Map());
  const [loadingTravelCosts, setLoadingTravelCosts] = useState<
    Set<string | number>
  >(new Set());
  const [vendorPricesMap, setVendorPricesMap] = useState<
    Map<string, Record<number, number>>
  >(new Map());

  // Caching & Filtering states
  const calculatedVendorIds = useRef<Set<string | number>>(new Set());
  const [showAllServicesVendors, setShowAllServicesVendors] = useState<
    Set<string | number>
  >(new Set());
  const [invoicePageMap, setInvoicePageMap] = useState<
    Map<string | number, number>
  >(new Map());
  const [vendorOrderPageMap, setVendorOrderPageMap] = useState<
    Map<string | number, number>
  >(new Map());

  // Per-vendor invoices, lazy-loaded on first accordion expand
  const [vendorInvoicesMap, setVendorInvoicesMap] = useState<
    Map<string | number, VendorInvoice[]>
  >(new Map());
  const [loadingInvoices, setLoadingInvoices] = useState<Set<string | number>>(
    new Set(),
  );
  const [vendorTotalEarnings, setVendorTotalEarnings] = useState<
    Map<string | number, number>
  >(new Map());
  const [searchQuery, setSearchQuery] = useState("");

  // Invoice detail modal
  const [viewingInvoice, setViewingInvoice] = useState<VendorInvoice | null>(
    null,
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const itemsPerPage = 10;
  const confirmAndExecute = () => {
    pendingAction?.();
    setPendingAction(null);
  };

  const toggleRow = async (i: number, vg: VendorGrouped) => {
    const opening = expandedRow !== i;
    setExpandedRow(opening ? i : null);

    if (opening) {
      // Fetch travel costs when expanding
      fetchVendorLocationAndCalculateTravelCosts(
        vg.vendorId,
        vg.vendor.uuid,
        vg.orders,
      );

      // Fetch total earnings when expanding (Task 3.2)
      try {
        const earnCheck =
          userType === "vendor"
            ? await GetMyEarnings()
            : await GetVendorEarnings(vg.vendor.uuid);
        if (earnCheck?.success) {
          const totalEarned = earnCheck.data?.summary?.total_earned ?? 0;
          setVendorTotalEarnings((prev) =>
            new Map(prev).set(vg.vendorId, totalEarned),
          );
        }
      } catch (e) {
        console.error("Failed to fetch earnings for vendor:", e);
      }

      // Lazy-load invoices for this vendor (only once)
      if (
        !vendorInvoicesMap.has(vg.vendorId) &&
        !loadingInvoices.has(vg.vendorId)
      ) {
        setLoadingInvoices((prev) => new Set(prev).add(vg.vendorId));
        try {
          const token = localStorage.getItem("token") || "";
          const invoices =
            userType === "vendor"
              ? await vendorBillingService.getMyInvoices(token)
              : await vendorBillingService.getVendorInvoices(
                  vg.vendor.uuid,
                  token,
                );
          setVendorInvoicesMap((prev) =>
            new Map(prev).set(vg.vendorId, invoices),
          );
        } catch (e) {
          console.error("Failed to load vendor invoices:", e);
        } finally {
          setLoadingInvoices((prev) => {
            const s = new Set(prev);
            s.delete(vg.vendorId);
            return s;
          });
        }
      }
    }
  };

  const toggleRowRef = useRef(toggleRow);
  toggleRowRef.current = toggleRow;

  const triggerPaymentAction = (action: () => void) => {
    if (!showAgain) {
      action();
    } else {
      setPendingAction(() => action);
      setConfirmOpen(true);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("Token not found.");
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch orders
    Get(token)
      .then((data) => {
        const sorted = Array.isArray(data.data)
          ? [...data.data].sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            )
          : [];
        setOrderData(sorted);
      })
      .catch((err) => {
        console.log(err.message);
      })
      .finally(() => {
        setLoading(false);
      });

    // Fetch global services
    GetServices(token)
      .then((data) => {
        setGlobalServices(Array.isArray(data.data) ? data.data : []);
      })
      .catch((err) => {
        console.error("Failed to fetch global services:", err.message);
      });

    // Fetch all vendor invoices to populate status, paid/unpaid, and last paid columns upfront
    const fetchInvoicesPromise =
      userType === "vendor"
        ? vendorBillingService.getMyInvoices(token)
        : vendorBillingService.getAdminInvoices(token);

    fetchInvoicesPromise
      .then((invoices) => {
        if (Array.isArray(invoices)) {
          const map = new Map<number | string, VendorInvoice[]>();

          const addToMap = (
            key: number | string | null | undefined,
            inv: any,
          ) => {
            if (key == null) return;
            const list = map.get(key) || [];
            list.push(inv);
            map.set(key, list);
          };

          invoices.forEach((inv: any) => {
            const numericId =
              inv.vendor_id != null ? Number(inv.vendor_id) : null;
            const stringId =
              inv.vendor_id != null ? String(inv.vendor_id) : null;
            const uuid = inv.vendor?.uuid || null;

            addToMap(numericId, inv);
            if (stringId !== String(numericId)) addToMap(stringId, inv);
            if (uuid) addToMap(uuid, inv);
          });

          setVendorInvoicesMap(map);
        }
      })
      .catch((err) => {
        console.error("Error fetching initial vendor invoices:", err);
      });

    // Fetch vendors and build price map
    GetVendors(token)
      .then((res) => {
        if (Array.isArray(res.data)) {
          const priceMap = new Map<string, Record<number, number>>();
          res.data.forEach((vendor: VendorPriceData) => {
            const vendorPriceLookup: Record<number, number> = {};
            vendor.vendor_services?.forEach((vs: VendorPriceService) => {
              vs.options?.forEach((opt: VendorPriceOption) => {
                if (opt.option_id && opt.vendor_price) {
                  vendorPriceLookup[Number(opt.option_id)] = Number(
                    opt.vendor_price,
                  );
                }
              });
            });
            priceMap.set(vendor.uuid, vendorPriceLookup);
          });
          setVendorPricesMap(priceMap);
        }
      })
      .catch((err) => {
        console.error("Error fetching vendor services:", err);
      });
  }, []);

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "—";
    const parts = timeStr.split(":");
    if (parts.length >= 2) return `${parts[0].padStart(2, "0")}:${parts[1]}`;
    return timeStr;
  };

  const formatCycleDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const computeCombinedTime = (slots: Slot[]) => {
    if (!slots || slots.length === 0) return "—";
    const sorted = [...slots].sort(
      (a, b) =>
        new Date(`1970-01-01T${a.start_time}`).getTime() -
        new Date(`1970-01-01T${b.start_time}`).getTime(),
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const start = formatTime(first.start_time);
    const end = formatTime(last.end_time);

    let slotDate = "";
    if (first.date) {
      try {
        const d = new Date(first.date);
        if (!isNaN(d.getTime())) {
          slotDate = d.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          });
        }
      } catch {
        slotDate = first.date;
      }
    }

    const startDate = new Date(`1970-01-01T${first.start_time}`);
    const endDate = new Date(`1970-01-01T${last.end_time}`);
    const diffMin = Math.max(
      0,
      Math.round((endDate.getTime() - startDate.getTime()) / 60000),
    );

    const timeRange = `${start} - ${end} (${diffMin} minutes)`;
    return slotDate ? `${slotDate} @ ${timeRange}` : timeRange;
  };

  const enrichInvoiceLines = (lines: any[], orders: Order[]) => {
    if (!lines || !Array.isArray(lines)) return [];
    return lines.map((line: any) => {
      let desc = line.description || "";

      if (desc.includes("address:") || desc.includes("order:")) {
        return {
          ...line,
          description: desc,
          quantity: line.quantity || 1,
          unit_price: line.unit_price || line.amount,
        };
      }

      const lineOrderSvc = line.order_service;
      const lineOrder = line.order || lineOrderSvc?.order;

      let address =
        lineOrder?.property_address ||
        lineOrder?.property?.property_address ||
        lineOrder?.property?.address ||
        "";
      let orderId = lineOrder?.id || lineOrderSvc?.order_id || "";
      let slotsStr = lineOrderSvc?.slots
        ? computeCombinedTime(lineOrderSvc.slots)
        : "";

      if ((!address || !orderId) && orders && orders.length > 0) {
        for (const order of orders) {
          const services =
            (order as any).order_services || (order as any).services || [];
          for (const svc of services) {
            const matchesId =
              line.order_service_id &&
              (svc.id === line.order_service_id ||
                svc.uuid === line.order_service_id ||
                String(svc.id) === String(line.order_service_id));
            const matchesName =
              (svc.service?.name && desc.includes(svc.service.name)) ||
              (svc.service_name && desc.includes(svc.service_name));

            if (matchesId || matchesName) {
              if (!address) {
                address =
                  order.property_address ||
                  (order as any).property?.property_address ||
                  (order as any).property?.address ||
                  "";
                if ((order as any).property_location)
                  address = `${address}, ${(order as any).property_location}`;
              }
              if (!orderId) orderId = order.id;
              if (!slotsStr) slotsStr = computeCombinedTime(svc.slots || []);
              break;
            }
          }
          if (address && orderId) break;
        }
      }

      if (address || orderId || slotsStr) {
        const parts = [desc];
        if (address) parts.push(`address: ${address}`);
        if (orderId) parts.push(`order: #${orderId}`);
        if (slotsStr) parts.push(`slots: ${slotsStr}`);
        desc = parts.join("\n");
      }

      return {
        ...line,
        description: desc,
        quantity: line.quantity || 1,
        unit_price: line.unit_price || line.amount,
      };
    });
  };

  const fetchVendorLocationAndCalculateTravelCosts = async (
    vendorId: string | number,
    vendorUuid: string,
    orders: VendorOrder[],
  ) => {
    // CACHING: Only calculate once per accordion open session
    if (
      calculatedVendorIds.current.has(vendorId) ||
      loadingTravelCosts.has(vendorId)
    )
      return;
    setLoadingTravelCosts((prev) => new Set(prev).add(vendorId));

    try {
      const vendorData = await GetOne(vendorUuid);
      if (!vendorData?.data) return;

      const vendor = vendorData.data;

      // Build orderSlotMap for property address fallback
      const orderSlotMap = new Map();
      (vendor?.order_slots || []).forEach((slot: Record<string, unknown>) => {
        const ord = slot.order as { id?: number } | undefined;
        if (ord?.id && !orderSlotMap.has(ord.id))
          orderSlotMap.set(ord.id, slot);
      });

      const startLocation = vendor?.addresses?.find(
        (a: { type: string }) => a.type === "start_location",
      );

      const newTravelCosts = new Map(travelCosts);

      if (!startLocation) {
        toast.error(
          "⚠️ Vendor start location not found. Cannot calculate travel.",
        );
        orders.forEach((order) =>
          order.services.forEach((svc) => {
            newTravelCosts.set(`${order.orderId}-${svc.uuid ?? ""}`, {
              orderId: order.orderId,
              serviceUuid: svc.uuid ?? "",
              date: "",
              distance: 0,
              estimatedTime: 0,
              travelCost: 0,
              fromAddress: "",
              toAddress: "",
              error: true,
              errorType: "VENDOR_NO_ADDRESS",
              errorMessage: "Vendor address not found or incorrect in settings",
            });
          }),
        );
        setTravelCosts(newTravelCosts);
        calculatedVendorIds.current.add(vendorId);
        return;
      }

      const rawCountry = startLocation.country || "";
      const normalizedCountry =
        rawCountry.trim().toUpperCase() === "CA"
          ? "Canada"
          : rawCountry.trim().toUpperCase() === "US"
            ? "USA"
            : rawCountry;
      const startLocationAddress = `${startLocation.address_line_1}, ${startLocation.city}, ${normalizedCountry}`;
      const paymentPerKm = Number(vendor?.settings?.payment_per_km ?? 0);

      setVendorLocationData((prev) =>
        new Map(prev).set(vendorId, {
          vendorId,
          startLocationAddress,
          paymentPerKm,
        }),
      );

      // ── Classify every service ─────────────────────────────────
      const travelQueue: {
        orderId: number;
        serviceUuid: string;
        propertyAddress: string;
        propertyLocation: string;
      }[] = [];

      orders.forEach((order) => {
        order.services.forEach((svc) => {
          const isPaid =
            svc.vendor_payment != null ||
            svc.vendor_paid === true ||
            svc.vendor_paid === 1;

          // PAID → zero-fill, no API needed
          if (isPaid) {
            newTravelCosts.set(`${order.orderId}-${svc.uuid ?? ""}`, {
              orderId: order.orderId,
              serviceUuid: svc.uuid ?? "",
              date: "",
              distance: 0,
              estimatedTime: 0,
              travelCost: 0,
              fromAddress: startLocationAddress,
              toAddress: "",
              error: false,
            });
            return;
          }

          // Resolve property address
          const allSlots = svc.slots || [];
          const slotWithAddr = allSlots.find((s) => s.order?.property_address);
          let propertyAddress = slotWithAddr?.order?.property_address || "";
          let propertyLocation = slotWithAddr?.order?.property_location || "";

          if (!propertyAddress) {
            const vs = orderSlotMap.get(order.orderId);
            propertyAddress = (vs as any)?.order?.property_address || "";
            propertyLocation = (vs as any)?.order?.property_location || "";
          }
          if (!propertyAddress) {
            const rawOrder = orderData.find(
              (o: Order) => o.id === order.orderId,
            );
            propertyAddress =
              rawOrder?.property_address ||
              rawOrder?.property?.property_address ||
              rawOrder?.property?.address ||
              "";
            propertyLocation =
              rawOrder?.property_location ||
              rawOrder?.property?.property_location ||
              "";
          }

          // NOT travel-required → zero-fill, no API needed
          if (!svc.is_travel_required) {
            newTravelCosts.set(`${order.orderId}-${svc.uuid ?? ""}`, {
              orderId: order.orderId,
              serviceUuid: svc.uuid ?? "",
              date: "",
              distance: 0,
              estimatedTime: 0,
              travelCost: 0,
              fromAddress: startLocationAddress,
              toAddress: `${propertyAddress}, ${propertyLocation}`,
            });
            return;
          }

          // UNPAID + TRAVEL REQUIRED → queue for the single batch
          travelQueue.push({
            orderId: order.orderId,
            serviceUuid: svc.uuid ?? "",
            propertyAddress,
            propertyLocation,
          });
        });
      });

      // ── If nothing needs travel, we are done — 0 extra API calls ─
      if (travelQueue.length === 0) {
        setTravelCosts(newTravelCosts);
        calculatedVendorIds.current.add(vendorId);
        return;
      }

      // ── Separate entries with/without a resolvable address ────────
      const withAddr = travelQueue.filter(
        (u) => u.propertyAddress.trim() !== "",
      );
      const noAddr = travelQueue.filter((u) => u.propertyAddress.trim() === "");

      noAddr.forEach((u) => {
        newTravelCosts.set(`${u.orderId}-${u.serviceUuid}`, {
          orderId: u.orderId,
          serviceUuid: u.serviceUuid,
          date: "",
          distance: 0,
          estimatedTime: 0,
          travelCost: 0,
          fromAddress: startLocationAddress,
          toAddress: "",
          error: true,
          errorType: "PROPERTY_NOT_FOUND",
          errorMessage: "Property address not found or incorrect",
        });
      });

      if (withAddr.length === 0) {
        setTravelCosts(newTravelCosts);
        calculatedVendorIds.current.add(vendorId);
        return;
      }

      // ── Build ONE 1×N Distance Matrix call ───────────────────────
      //    Origin:       vendor start location (1 address only)
      //    Destinations: all unique property addresses (N addresses)
      //    Matrix size:  1 × N  →  never exceeds API limits (max 100)
      //    Result:       exactly 1 API call regardless of how many services
      const uniqueAddresses: string[] = [];
      withAddr.forEach((u) => {
        if (!uniqueAddresses.includes(u.propertyAddress))
          uniqueAddresses.push(u.propertyAddress);
      });

      // Simple 1-origin legs: Vendor → each unique property address
      const tripLegs = uniqueAddresses.map((addr, idx) => ({
        from: startLocationAddress,
        to: addr,
        legIndex: idx,
      }));

      console.log(
        `📍 [Vendor Billing] 1 API call → 1 origin x ${uniqueAddresses.length} destinations (${withAddr.length} services)`,
      );

      // ── THE SINGLE API CALL ───────────────────────────────────────
      const batchResult = await batchCalculateTravelCosts(tripLegs);

      // Map address → result (each leg: vendor → that property)
      const addrMap = new Map<
        string,
        { distance: number; estimatedTime: number; ok: boolean }
      >();
      uniqueAddresses.forEach((addr, idx) => {
        const leg = batchResult.legs.find((l) => l.legIndex === idx);
        if (!leg) {
          addrMap.set(addr, { distance: 0, estimatedTime: 0, ok: false });
          return;
        }
        addrMap.set(addr, {
          distance: parseFloat(leg.distance.toFixed(2)),
          estimatedTime: Math.round(leg.duration),
          ok: true,
        });
      });

      // ── Assign results to each service ────────────────────────────
      withAddr.forEach((u) => {
        const result = addrMap.get(u.propertyAddress);
        const toAddr = `${u.propertyAddress}, ${u.propertyLocation}`;
        if (result?.ok) {
          const travelCost = parseFloat(
            (result.distance * paymentPerKm).toFixed(2),
          );
          newTravelCosts.set(`${u.orderId}-${u.serviceUuid}`, {
            orderId: u.orderId,
            serviceUuid: u.serviceUuid,
            date: "",
            distance: result.distance,
            estimatedTime: result.estimatedTime,
            travelCost,
            fromAddress: startLocationAddress,
            toAddress: toAddr,
          });
        } else {
          newTravelCosts.set(`${u.orderId}-${u.serviceUuid}`, {
            orderId: u.orderId,
            serviceUuid: u.serviceUuid,
            date: "",
            distance: 0,
            estimatedTime: 0,
            travelCost: 0,
            fromAddress: startLocationAddress,
            toAddress: toAddr,
            error: true,
            errorType: "ROUTE_UNROUTABLE",
            errorMessage:
              "Address not found or route unroutable on Google Maps",
          });
        }
      });

      setTravelCosts(newTravelCosts);
      calculatedVendorIds.current.add(vendorId);
    } catch (error) {
      console.error("Error fetching vendor location:", error);
    } finally {
      setLoadingTravelCosts((prev) => {
        const s = new Set(prev);
        s.delete(vendorId);
        return s;
      });
    }
  };

  const formatPaymentErrorMessage = (error: any): string => {
    const backendMsg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.response?.data?.detail ||
      (typeof error?.response?.data === "string" ? error.response.data : null);

    if (backendMsg && typeof backendMsg === "string") {
      const lower = backendMsg.toLowerCase();
      if (
        lower.includes("connected account") ||
        lower.includes("connect account") ||
        lower.includes("stripe_connect") ||
        lower.includes("destination account") ||
        lower.includes("no connected") ||
        lower.includes("account")
      ) {
        return "Payment Failed: Vendor does not have a connected Stripe account. Please ask the vendor to connect their Stripe account under Vendor Settings.";
      }
      return backendMsg;
    }

    const rawMsg = error?.message || "";
    if (
      rawMsg.includes("500") ||
      rawMsg.includes("Request failed") ||
      rawMsg.toLowerCase().includes("connect")
    ) {
      return "Payment Failed: Vendor does not have a connected Stripe account. Please ask the vendor to connect their Stripe account under Vendor Settings.";
    }

    return (
      rawMsg || "Payment failed. Please verify vendor Stripe configuration."
    );
  };

  const handlePayInvoice = async (
    invoiceUuid: string,
    vendorUuid: string,
    vendorId: number | string,
    invoiceNumber: string,
    invoiceAmount: number,
  ) => {
    const token = localStorage.getItem("token") || "";
    if (!token) return;

    setLoading(true);
    try {
      // Step 1: Trigger payment API
      const payResult = await vendorBillingService.payInvoice(
        invoiceUuid,
        token,
      );

      const isSuccess =
        payResult &&
        (payResult.success === true ||
          payResult.status === "success" ||
          payResult.status === "paid" ||
          payResult.data != null ||
          (payResult.message &&
            !payResult.message.toLowerCase().includes("fail") &&
            !payResult.message.toLowerCase().includes("error")));

      if (!isSuccess) {
        toast.error(
          formatPaymentErrorMessage({ response: { data: payResult } }),
        );
        return;
      }

      // Optimistically update invoice status in state immediately
      setVendorInvoicesMap((prev) => {
        const vendorInvoices = prev.get(vendorId);
        if (!vendorInvoices) return prev;
        const updated = vendorInvoices.map((inv) =>
          inv.uuid === invoiceUuid
            ? {
                ...inv,
                status: "paid" as const,
                paid_at: new Date().toISOString(),
              }
            : inv,
        );
        return new Map(prev).set(vendorId, updated);
      });

      // Wait for backend to process earnings record
      await new Promise((r) => setTimeout(r, 1000));

      // Step 2: Verify earnings were updated
      // Show success toast immediately — payment confirmed
      toast.success(`✅ Invoice #${invoiceNumber} paid successfully!`);

      // Step 2: Verify earnings in background (non-blocking)
      const earnCheckResult = await GetVendorEarnings(vendorUuid, {
        period: "this_month",
      }).catch(() => null);

      console.log(
        `[Payment Verification] Invoice ${invoiceNumber} paid. Checking vendor ${vendorUuid} earnings...`,
      );

      if (earnCheckResult?.success) {
        const newTotalEarned = earnCheckResult.data?.summary?.total_earned ?? 0;
        const oldTotalEarned = vendorTotalEarnings.get(vendorId) || 0;
        const earnedIncrease = newTotalEarned - oldTotalEarned;

        setVendorTotalEarnings((prev) =>
          new Map(prev).set(vendorId, newTotalEarned),
        );

        // Only warn in console — never show a misleading error toast after confirmed payment
        if (earnedIncrease < invoiceAmount - 5) {
          console.warn(
            `[Earnings Verification Warning] Earnings increase ($${earnedIncrease.toFixed(2)}) less than invoice ($${invoiceAmount}). Old: $${oldTotalEarned}, New: $${newTotalEarned}`,
          );
          logBillingError(
            "earnings_verification_warning",
            "Vendor earnings increase less than paid invoice amount (silent warning)",
            {
              vendorUuid,
              invoiceUuid,
              invoiceAmount,
              oldTotalEarned,
              newTotalEarned,
              earnedIncrease,
            },
          );
        }
      } else {
        console.warn(
          `[Payment Verification Warning] Earnings check failed for vendor ${vendorUuid}:`,
          earnCheckResult,
        );
      }

      // Refresh invoices for this vendor
      const updatedInvoices = await vendorBillingService.getVendorInvoices(
        vendorUuid,
        token,
      );
      setVendorInvoicesMap((prev) =>
        new Map(prev).set(vendorId, updatedInvoices),
      );

      // Refresh orders data to update billing status tags
      const ordersRes = await Get(token);
      const sorted = Array.isArray(ordersRes.data)
        ? [...ordersRes.data].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )
        : [];
      setOrderData(sorted);
    } catch (error: any) {
      logBillingError("handlePayInvoice", error, { invoiceUuid, vendorUuid });
      toast.error(formatPaymentErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const getOrderTravelTotal = (
    orderId: number,
    services: ServiceForVendor[],
  ): number => {
    return services.reduce((sum, svc) => {
      const key = `${orderId}-${svc.uuid}`;
      const tc = travelCosts.get(key);
      return sum + (tc?.travelCost ?? 0);
    }, 0);
  };

  const vendorsGrouped: VendorGrouped[] = useMemo(() => {
    const map = new Map<
      number | string,
      {
        vendor: Vendor;
        orders: Map<number, VendorOrder>;
      }
    >();

    orderData.forEach((order: Order) => {
      if (!order.slots || order.slots.length === 0) return;

      // group slots by service_id
      const groupedSlots = order.slots.reduce<Record<number, Slot[]>>(
        (acc, slot) => {
          const sid = slot.service_id;
          if (!acc[sid]) acc[sid] = [];
          acc[sid].push(slot);
          return acc;
        },
        {},
      );

      Object.keys(groupedSlots).forEach((sidKey) => {
        const sid = Number(sidKey);
        const slotsForService = groupedSlots[sid];

        const svcRecord =
          order.services?.find((s) => Number(s.service_id) === sid) ||
          order.services?.find((s) => s.service?.id === sid);

        const vendorIds = Array.from(
          new Set(slotsForService.map((s) => s.vendor_id)),
        );

        vendorIds.forEach((vendorId) => {
          const vendorObj = slotsForService.find(
            (s) => s.vendor_id === vendorId,
          )?.vendor || {
            uuid: "",
            first_name: "Vendor",
            last_name: "",
          };

          if (userType === "vendor" && vendorObj.uuid !== loggedInVendorUuid) {
            return;
          }

          if (!map.has(vendorId)) {
            map.set(vendorId, {
              vendor: vendorObj,
              orders: new Map<number, VendorOrder>(),
            });
          }

          const vendorEntry = map.get(vendorId)!;

          if (!vendorEntry.orders.has(order.id)) {
            vendorEntry.orders.set(order.id, {
              orderId: order.id,
              created_at: order.created_at,
              services: [],
            });
          }

          const vendorUuid = vendorObj.uuid;
          const vendorLookup = vendorPricesMap.get(vendorUuid);

          let finalSvcRecord = svcRecord ? { ...svcRecord } : null;

          if (!finalSvcRecord) {
            const globalSvc = globalServices.find((s) => Number(s.id) === sid);
            if (globalSvc) {
              finalSvcRecord = {
                uuid: globalSvc.uuid,
                service_id: globalSvc.id,
                service: globalSvc,
                amount: "0.00",
                is_completed: false,
                vendor_paid: false,
                vendor_invoice_id: null,
                is_travel_required: globalSvc.is_travel_required,
              };

              const options =
                globalSvc.product_options || globalSvc.options || [];
              const possibleOptionIds = options.map((opt: any) =>
                Number(opt.id),
              );
              const matchedOptionId = vendorLookup
                ? possibleOptionIds.find(
                    (optId: number) => vendorLookup[optId] !== undefined,
                  )
                : null;

              if (matchedOptionId && vendorLookup) {
                finalSvcRecord.option_id = matchedOptionId;
                finalSvcRecord.amount = vendorLookup[matchedOptionId];
              } else if (options.length > 0) {
                const defaultOption = options[0];
                finalSvcRecord.option_id = defaultOption.id;
                finalSvcRecord.amount =
                  defaultOption.amount || defaultOption.price || "0.00";
              }
            }
          }

          let finalAmount = finalSvcRecord?.amount || 0;

          if (vendorLookup && finalSvcRecord?.option_id) {
            const optId = Number(finalSvcRecord.option_id);
            if (vendorLookup[optId] !== undefined) {
              finalAmount = vendorLookup[optId];
            }
          }

          const serviceForVendor: ServiceForVendor = {
            ...finalSvcRecord,
            serviceId: sid,
            serviceName:
              finalSvcRecord?.service?.name ||
              finalSvcRecord?.service_name ||
              finalSvcRecord?.name ||
              `Service ${sid}`,
            slots: slotsForService.filter((s) => s.vendor_id === vendorId),
            amount: finalAmount,
            is_travel_required:
              finalSvcRecord?.service?.is_travel_required ||
              finalSvcRecord?.is_travel_required,
            vendor_paid: (finalSvcRecord as any)?.vendor_paid,
            vendor_invoice_id:
              (finalSvcRecord as any)?.vendor_invoice_id ?? null,
            vendor_payment: (finalSvcRecord as any)?.vendor_payment,
            is_completed: (finalSvcRecord as any)?.is_completed,
          };

          vendorEntry.orders.get(order.id)!.services.push(serviceForVendor);
        });
      });
    });

    // convert map -> array
    const arr: VendorGrouped[] = Array.from(map.entries()).map(
      ([vendorId, vendorEntry]) => {
        const ordersArr = Array.from(vendorEntry.orders.values());
        const totalServices = ordersArr.reduce(
          (sum, o) => sum + (o.services?.length || 0),
          0,
        );
        const totalAmount = ordersArr.reduce(
          (sum, o) =>
            sum +
            o.services.reduce((sSum, svc) => sSum + Number(svc.amount ?? 0), 0),
          0,
        );

        const dates = ordersArr
          .map((o) => o.created_at)
          .filter(Boolean)
          .map((d) => new Date(d));
        const earliestDate = dates.length
          ? new Date(Math.min(...dates.map((d) => d.getTime())))
          : null;
        const added = earliestDate
          ? earliestDate.toISOString().split("T")[0]
          : null;

        return {
          vendorId,
          vendor: vendorEntry.vendor,
          totalServices,
          totalOrders: ordersArr.length,
          totalAmount,
          added,
          orders: ordersArr,
        };
      },
    );

    return arr;
  }, [
    orderData,
    vendorPricesMap,
    userType,
    loggedInVendorUuid,
    globalServices,
  ]);

  // Build a flat map of invoiceId → VendorInvoice from all lazy-loaded invoices
  const invoiceIdMap = useMemo(() => {
    const map = new Map<number, VendorInvoice>();
    vendorInvoicesMap.forEach((invoices) => {
      invoices.forEach((inv) => {
        if (inv.id != null) map.set(inv.id, inv);
      });
    });
    return map;
  }, [vendorInvoicesMap]);

  // Handle resume_payment redirection after invoice generation
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const resume = params.get("resume_payment");
      if (resume === "true" && vendorsGrouped.length > 0) {
        const targetVendorUuid = localStorage.getItem(
          "resume_payment_vendor_uuid",
        );
        if (targetVendorUuid) {
          const idx = vendorsGrouped.findIndex(
            (vg) => vg.vendor.uuid === targetVendorUuid,
          );
          if (idx !== -1) {
            const targetPage = Math.floor(idx / itemsPerPage) + 1;
            setCurrentPage(targetPage);
            const localIndex = idx % itemsPerPage;
            setExpandedRow(localIndex);
            const targetVg = vendorsGrouped[idx];
            toggleRowRef.current(localIndex, targetVg);
            localStorage.removeItem("resume_payment_vendor_uuid");
            const url = new URL(window.location.href);
            url.searchParams.delete("resume_payment");
            window.history.replaceState({}, "", url.pathname + url.search);
          }
        }
      }
    }
  }, [vendorsGrouped]);

  // Auto-expand vendor row if logged in as a vendor (desktop only)
  useEffect(() => {
    if (
      userType === "vendor" &&
      vendorsGrouped.length > 0 &&
      expandedRow === null &&
      !isMobile
    ) {
      setExpandedRow(0);
      toggleRowRef.current(0, vendorsGrouped[0]);
    }
  }, [userType, vendorsGrouped, expandedRow, isMobile]);

  const filteredVendorsGrouped = useMemo(() => {
    if (!searchQuery.trim()) return vendorsGrouped;
    const q = searchQuery.toLowerCase().trim();
    return vendorsGrouped.filter((vg) => {
      const fn = (vg.vendor?.first_name || "").toLowerCase();
      const ln = (vg.vendor?.last_name || "").toLowerCase();
      const fullName = `${fn} ${ln}`.trim();
      const name = (vg.vendor as any)?.name?.toLowerCase() || "";
      const email = (vg.vendor as any)?.email?.toLowerCase() || "";
      const username = (vg.vendor as any)?.username?.toLowerCase() || "";
      return (
        fullName.includes(q) ||
        fn.includes(q) ||
        ln.includes(q) ||
        name.includes(q) ||
        email.includes(q) ||
        username.includes(q)
      );
    });
  }, [vendorsGrouped, searchQuery]);

  const totalPages = Math.ceil(filteredVendorsGrouped.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVendors = filteredVendorsGrouped.slice(startIndex, endIndex);

  useLoadScript({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_PLACES_API_KEY || "",
    version: "3.64",
    libraries: ["places", "drawing"] as any,
  });

  if (isMobile && userType === "vendor") {
    return <MobileVendorEarnings />;
  }

  return (
    <div className="text-[#424242]">
      {isMobile ? (
        <div className="font-alexandria pb-16 bg-[#F2F2F2]">
          <div
            className="w-full h-14 z-50 sticky top-0 flex justify-between px-4 items-center border-b shadow-sm"
            style={{ backgroundColor: roleSettings.pageBg }}
          >
            <p
              className="text-base font-medium"
              style={{ color: roleSettings.pageTabColor }}
            >
              Vendors Billing ({filteredVendorsGrouped.length})
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  router.push("/dashboard/vendor-billing/invoices")
                }
                className="text-xs px-2.5 h-8 text-white hover:brightness-110 active:scale-95 transition-all"
                style={{ backgroundColor: roleSettings.pageTabColor }}
              >
                Invoices
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  router.push("/dashboard/vendor-billing/uninvoiced")
                }
                className="text-xs px-2.5 h-8 text-white hover:brightness-110 active:scale-95 transition-all"
                style={{ backgroundColor: roleSettings.pageTabColor }}
              >
                Create
              </Button>
            </div>
          </div>

          <MobileAdminVendorBilling
            vendorsGrouped={filteredVendorsGrouped}
            loading={loading}
            roleSettings={roleSettings}
            vendorInvoicesMap={vendorInvoicesMap}
            loadingInvoices={loadingInvoices}
            vendorTotalEarnings={vendorTotalEarnings}
            travelCosts={travelCosts}
            loadingTravelCosts={loadingTravelCosts}
            handlePayInvoice={handlePayInvoice}
            triggerPaymentAction={triggerPaymentAction}
            setViewingInvoice={setViewingInvoice}
            setIsViewModalOpen={setIsViewModalOpen}
            router={router}
            expandedRow={expandedRow}
            toggleRow={toggleRowRef.current}
          />
        </div>
      ) : (
        <div className="hidden md:block">
          <div
            ref={headerRef}
            className="w-full h-[80px] font-alexandria sticky top-0 z-50 flex justify-between px-[20px] items-center"
            style={{
              backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
              boxShadow: "0px 4px 4px #0000001F",
            }}
          >
            <p
              className={`text-[16px] md:text-[24px] font-[400]  ${userType}-text`}
            >
              Vendors Billing ({filteredVendorsGrouped.length})
            </p>
            <div className="flex items-center gap-3">
              {userType !== "vendor" && (
                <div className="relative w-[220px] md:w-[260px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search vendor name or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9 pr-8 h-[42px] bg-white border border-gray-300 rounded-md text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
              <Button
                onClick={() =>
                  router.push(
                    userType === "vendor"
                      ? "/dashboard/vendor-billing/my-invoices"
                      : "/dashboard/vendor-billing/invoices",
                  )
                }
                className="text-white h-[42px] px-6 text-[14px] hover:brightness-110 active:scale-[0.98] transition-all"
                style={{
                  backgroundColor: roleSettings.pageTabColor,
                  borderColor: roleSettings.pageTabColor,
                }}
              >
                View Invoices
              </Button>
              {userType !== "vendor" && (
                <Button
                  onClick={() =>
                    router.push("/dashboard/vendor-billing/uninvoiced")
                  }
                  className="text-white h-[42px] px-6 text-[14px] hover:brightness-110 active:scale-[0.98] transition-all"
                  style={{
                    backgroundColor: roleSettings.pageTabColor,
                    borderColor: roleSettings.pageTabColor,
                  }}
                >
                  Create Invoice
                </Button>
              )}
              <Select onValueChange={(value) => console.log(value)}>
                <SelectTrigger
                  className={`w-[174px] h-[42px] text-[#666666] hidden border-[1px] border-[#BBBBBB] ${
                    userType === "admin"
                      ? "[&>svg]:text-[#4290E9]"
                      : userType === "agent"
                        ? "[&>svg]:text-[#6BAE41]"
                        : "[&>svg]:text-[#4290E9]"
                  }  [&>svg]:opacity-100`}
                  style={{
                    backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                  }}
                >
                  <SelectValue placeholder="All Invoices" />
                </SelectTrigger>
                <SelectContent
                  className="rounded-none w-full py-[12px] text-[#666666]"
                  style={{
                    backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
                  }}
                >
                  <SelectItem
                    value="allinvoices"
                    className="p-0 px-[16px] mb-[9px] hover:!bg-transparent focus:!bg-transparent !bg-transparent cursor-pointer"
                  >
                    All Invoices
                  </SelectItem>
                  <SelectItem
                    value="Unpaid"
                    className="p-0 px-[16px] mb-[9px] hover:!bg-transparent focus:!bg-transparent !bg-transparent cursor-pointer"
                  >
                    Unpaid
                  </SelectItem>
                  <SelectItem
                    value="Draft"
                    className="p-0 px-[16px] hover:!bg-transparent focus:!bg-transparent !bg-transparent cursor-pointer"
                  >
                    Draft
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="w-full relative">
            <Table className="font-alexandria px-0 overflow-x-auto whitespace-nowrap">
              <TableHeader>
                <TableRow
                  className="font-alexandria h-[54px] hover:bg-[#E4E4E4]"
                  style={{
                    backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                  }}
                >
                  <TableHead className="text-[14px] font-[700] text-[#7D7D7D] pl-[20px]">
                    Vendor
                  </TableHead>
                  <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">
                    Orders
                  </TableHead>
                  <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">
                    Services
                  </TableHead>
                  <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">
                    Service Time
                  </TableHead>
                  <TableHead className="text-[14px] font-[700] text-[#7D7D7D] text-center">
                    {/* chevron */}
                  </TableHead>
                </TableRow>
              </TableHeader>

              {!loading ? (
                <TableBody>
                  {paginatedVendors.length > 0 ? ( // Change from vendorsGrouped to paginatedVendors
                    paginatedVendors.map((vg, i) => {
                      const allVendorServices = vg.orders.flatMap(
                        (o: VendorOrder) => o.services,
                      );
                      const unpaidOrdersCount = vg.orders.filter(
                        (o: VendorOrder) =>
                          o.services.some(
                            (svc: VendorService) =>
                              !(
                                svc.vendor_payment != null ||
                                svc.vendor_paid === true ||
                                svc.vendor_paid === 1
                              ),
                          ),
                      ).length;

                      const unpaidServicesCount = allVendorServices.filter(
                        (svc: VendorService) =>
                          !(
                            svc.vendor_payment != null ||
                            svc.vendor_paid === true ||
                            svc.vendor_paid === 1
                          ),
                      ).length;

                      const vendorTimeDisplay: string = computeCombinedTime(
                        vg.orders.flatMap((o: VendorOrder) =>
                          o.services.flatMap(
                            (svc: VendorService) => svc.slots || [],
                          ),
                        ),
                      );

                      // extract only minutes part from parentheses
                      const vendorMinutesOnly =
                        vendorTimeDisplay.match(/\(([^)]+)\)/)?.[1] ||
                        vendorTimeDisplay;

                      return (
                        <React.Fragment key={vg.vendorId}>
                          <TableRow
                            onClick={() => {
                              toggleRow(i, vg);
                            }}
                            className="cursor-pointer hover:bg-gray-100"
                          >
                            <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                              {vg.vendor?.first_name} {vg.vendor?.last_name}
                            </TableCell>

                            <TableCell
                              className={`text-[15px] py-[19px] font-[400] ${userType}-text`}
                            >
                              {vg.totalOrders}
                              {unpaidOrdersCount > 0 ? (
                                <span className="text-xs text-orange-600 font-semibold ml-1">
                                  ({unpaidOrdersCount} unpaid)
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 font-normal ml-1">
                                  (0 unpaid)
                                </span>
                              )}
                            </TableCell>

                            <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D] ">
                              {vg.totalServices} services
                              {unpaidServicesCount > 0 ? (
                                <span className="text-xs text-orange-600 font-semibold ml-1">
                                  ({unpaidServicesCount} unpaid)
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 font-normal ml-1">
                                  (0 unpaid)
                                </span>
                              )}
                            </TableCell>

                            <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                              {vendorMinutesOnly}
                            </TableCell>

                            <TableCell className="w-[40px] text-center">
                              {expandedRow === i ? (
                                <ChevronUp className="h-5 w-5 text-gray-600" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-600" />
                              )}
                            </TableCell>
                          </TableRow>

                          {expandedRow === i && (
                            <TableRow className="bg-gray-50">
                              <TableCell colSpan={5} className="p-0">
                                <div className="overflow-hidden transition-all duration-300 p-6 space-y-6">
                                  {/* SECTION A: Invoice History */}
                                  <div className="mb-4">
                                    <div className="flex items-center justify-between mb-4">
                                      <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                        Invoice History
                                      </h4>
                                      {userType !== "vendor" && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            localStorage.setItem(
                                              "resume_payment_vendor_uuid",
                                              vg.vendor.uuid,
                                            );
                                            router.push(
                                              `/dashboard/vendor-billing/pending/${vg.vendor.uuid}`,
                                            );
                                          }}
                                          className="px-3 py-3 text-[16px] text-white rounded-md hover:brightness-110 transition-all cursor-pointer font-medium shadow-sm"
                                          style={{
                                            backgroundColor:
                                              roleSettings.pageTabColor,
                                          }}
                                        >
                                          + Generate Invoice
                                        </button>
                                      )}
                                    </div>

                                    {/* All Time & Monthly Earnings Banner (Shifted ABOVE Invoices Table) */}
                                    {(vendorInvoicesMap
                                      .get(vg.vendorId)
                                      ?.some((inv) => inv.status === "paid") ||
                                      vendorTotalEarnings.has(vg.vendorId)) && (
                                      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-left space-y-1 shadow-sm">
                                        {vendorInvoicesMap
                                          .get(vg.vendorId)
                                          ?.some(
                                            (inv) => inv.status === "paid",
                                          ) && (
                                          <p className="text-sm text-green-800 font-semibold flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                            ✅ Paid invoices: $
                                            {vendorInvoicesMap
                                              .get(vg.vendorId)
                                              ?.filter(
                                                (i) => i.status === "paid",
                                              )
                                              .reduce(
                                                (sum, i) =>
                                                  sum + Number(i.total_amount),
                                                0,
                                              )
                                              .toFixed(2)}
                                          </p>
                                        )}
                                        {vendorTotalEarnings.has(
                                          vg.vendorId,
                                        ) && (
                                          <p className="text-xs text-green-700">
                                            Verified Vendor Earnings (This
                                            Month): $
                                            {Number(
                                              vendorTotalEarnings.get(
                                                vg.vendorId,
                                              ) ?? 0,
                                            ).toFixed(2)}
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {loadingInvoices.has(vg.vendorId) ? (
                                      <div className="space-y-2">
                                        {[1, 2].map((n) => (
                                          <Skeleton
                                            key={n}
                                            className="h-10 w-full bg-gray-200 rounded"
                                          />
                                        ))}
                                      </div>
                                    ) : (
                                        vendorInvoicesMap.get(vg.vendorId) ?? []
                                      ).length === 0 ? (
                                      <p className="text-sm text-gray-400 italic py-2">
                                        No invoices generated yet.
                                      </p>
                                    ) : (
                                      <>
                                        {(() => {
                                          const allInvoices =
                                            vendorInvoicesMap.get(
                                              vg.vendorId,
                                            ) ?? [];
                                          const invPage =
                                            invoicePageMap.get(vg.vendorId) ||
                                            1;
                                          const invTotalPages = Math.ceil(
                                            allInvoices.length / 5,
                                          );
                                          const paginatedInvoices =
                                            allInvoices.slice(
                                              (invPage - 1) * 5,
                                              invPage * 5,
                                            );
                                          return (
                                            <>
                                              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm my-3">
                                                <table className="w-full text-sm border-collapse">
                                                  <thead className="bg-gray-100/90 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                                    <tr>
                                                      <th className="px-4 py-3 text-left">
                                                        Invoice #
                                                      </th>
                                                      <th className="px-4 py-3 text-left">
                                                        Cycle
                                                      </th>
                                                      <th className="px-4 py-3 text-right">
                                                        Amount
                                                      </th>
                                                      <th className="px-4 py-3 text-left">
                                                        Paid At
                                                      </th>
                                                      <th className="px-4 py-3 text-center">
                                                        Status
                                                      </th>
                                                      {userType !==
                                                        "vendor" && (
                                                        <th className="px-4 py-3 text-center">
                                                          Actions
                                                        </th>
                                                      )}
                                                    </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-gray-200 bg-white">
                                                    {paginatedInvoices.map(
                                                      (inv) => (
                                                        <tr
                                                          key={inv.uuid}
                                                          className="hover:bg-gray-50/80 transition-colors"
                                                        >
                                                          <td className="px-4 py-3 font-semibold text-gray-900">
                                                            #
                                                            {inv.invoice_number}
                                                          </td>
                                                          <td className="px-4 py-3 text-gray-600 text-xs">
                                                            {inv.cycle_start
                                                              ? `${formatCycleDate(inv.cycle_start)}${inv.cycle_end ? ` → ${formatCycleDate(inv.cycle_end)}` : ""}`
                                                              : "—"}
                                                          </td>
                                                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                            $
                                                            {Number(
                                                              inv.total_amount ??
                                                                0,
                                                            ).toFixed(2)}
                                                          </td>
                                                          <td className="px-4 py-3 text-gray-600 text-xs">
                                                            {inv.status ===
                                                            "paid"
                                                              ? inv.paid_at
                                                                ? new Date(
                                                                    inv.paid_at,
                                                                  ).toLocaleString(
                                                                    "en-US",
                                                                    {
                                                                      month:
                                                                        "short",
                                                                      day: "numeric",
                                                                      year: "numeric",
                                                                      hour: "2-digit",
                                                                      minute:
                                                                        "2-digit",
                                                                    },
                                                                  )
                                                                : inv.updated_at
                                                                  ? new Date(
                                                                      inv.updated_at,
                                                                    ).toLocaleString(
                                                                      "en-US",
                                                                      {
                                                                        month:
                                                                          "short",
                                                                        day: "numeric",
                                                                        year: "numeric",
                                                                        hour: "2-digit",
                                                                        minute:
                                                                          "2-digit",
                                                                      },
                                                                    )
                                                                  : "Paid"
                                                              : "—"}
                                                          </td>
                                                          <td className="px-4 py-3 text-center">
                                                            <span
                                                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${inv.status === "paid" ? "bg-green-100 text-green-700" : inv.status === "pending_payment" ? "bg-yellow-100 text-yellow-700" : inv.status === "draft" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-600"}`}
                                                            >
                                                              {inv.status.replace(
                                                                "_",
                                                                " ",
                                                              )}
                                                            </span>
                                                          </td>
                                                          {userType !==
                                                            "vendor" && (
                                                            <td className="px-4 py-3 text-center">
                                                              <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                  onClick={(
                                                                    e,
                                                                  ) => {
                                                                    e.stopPropagation();
                                                                    const token =
                                                                      localStorage.getItem(
                                                                        "token",
                                                                      ) || "";
                                                                    vendorBillingService
                                                                      .getAdminInvoiceDetails(
                                                                        inv.uuid,
                                                                        token,
                                                                      )
                                                                      .then(
                                                                        (
                                                                          details,
                                                                        ) => {
                                                                          setViewingInvoice(
                                                                            details,
                                                                          );
                                                                          setIsViewModalOpen(
                                                                            true,
                                                                          );
                                                                        },
                                                                      )
                                                                      .catch(
                                                                        () => {
                                                                          setViewingInvoice(
                                                                            inv,
                                                                          );
                                                                          setIsViewModalOpen(
                                                                            true,
                                                                          );
                                                                        },
                                                                      );
                                                                  }}
                                                                  className="px-2 py-1 text-xs border border-gray-300 rounded font-medium hover:bg-gray-100 transition cursor-pointer"
                                                                >
                                                                  View
                                                                </button>
                                                                {(inv.status ===
                                                                  "pending_payment" ||
                                                                  inv.status ===
                                                                    "draft") && (
                                                                  <button
                                                                    onClick={(
                                                                      e,
                                                                    ) => {
                                                                      e.stopPropagation();
                                                                      triggerPaymentAction(
                                                                        () =>
                                                                          handlePayInvoice(
                                                                            inv.uuid,
                                                                            vg
                                                                              .vendor
                                                                              .uuid,
                                                                            vg.vendorId,
                                                                            inv.invoice_number,
                                                                            Number(
                                                                              inv.total_amount,
                                                                            ),
                                                                          ),
                                                                      );
                                                                    }}
                                                                    className="px-2.5 py-1 text-xs text-white rounded font-medium transition hover:brightness-110 cursor-pointer shadow-sm"
                                                                    style={{
                                                                      backgroundColor:
                                                                        roleSettings.pageTabColor,
                                                                    }}
                                                                  >
                                                                    Pay
                                                                  </button>
                                                                )}
                                                              </div>
                                                            </td>
                                                          )}
                                                        </tr>
                                                      ),
                                                    )}
                                                  </tbody>
                                                </table>
                                              </div>
                                              {invTotalPages > 1 && (
                                                <div className="flex items-center justify-between mt-3 px-1 text-xs text-gray-600">
                                                  <span className="font-medium text-gray-500">
                                                    Page {invPage} of{" "}
                                                    {invTotalPages} (
                                                    {allInvoices.length}{" "}
                                                    Invoices)
                                                  </span>
                                                  <div className="flex items-center gap-1.5">
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      disabled={invPage === 1}
                                                      onClick={() =>
                                                        setInvoicePageMap(
                                                          (prev) =>
                                                            new Map(prev).set(
                                                              vg.vendorId,
                                                              invPage - 1,
                                                            ),
                                                        )
                                                      }
                                                      className="h-8 text-xs px-2.5 font-medium border-gray-300 cursor-pointer"
                                                    >
                                                      Prev
                                                    </Button>
                                                    {Array.from(
                                                      { length: invTotalPages },
                                                      (_, idx) => idx + 1,
                                                    ).map((pNum) => (
                                                      <Button
                                                        key={pNum}
                                                        variant={
                                                          invPage === pNum
                                                            ? "default"
                                                            : "outline"
                                                        }
                                                        size="sm"
                                                        onClick={() =>
                                                          setInvoicePageMap(
                                                            (prev) =>
                                                              new Map(prev).set(
                                                                vg.vendorId,
                                                                pNum,
                                                              ),
                                                          )
                                                        }
                                                        className={`h-8 w-8 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                                          invPage === pNum
                                                            ? "text-white shadow-sm border-none"
                                                            : "text-gray-600 border-gray-300 hover:bg-gray-100"
                                                        }`}
                                                        style={{
                                                          backgroundColor:
                                                            invPage === pNum
                                                              ? roleSettings.pageTabColor
                                                              : undefined,
                                                        }}
                                                      >
                                                        {pNum}
                                                      </Button>
                                                    ))}
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      disabled={
                                                        invPage ===
                                                        invTotalPages
                                                      }
                                                      onClick={() =>
                                                        setInvoicePageMap(
                                                          (prev) =>
                                                            new Map(prev).set(
                                                              vg.vendorId,
                                                              invPage + 1,
                                                            ),
                                                        )
                                                      }
                                                      className="h-8 text-xs px-2.5 font-medium border-gray-300 cursor-pointer"
                                                    >
                                                      Next
                                                    </Button>
                                                  </div>
                                                </div>
                                              )}
                                            </>
                                          );
                                        })()}
                                      </>
                                    )}
                                  </div>

                                  {/* SECTION B: Orders & Services */}
                                  {(() => {
                                    const showAll = showAllServicesVendors.has(
                                      vg.vendorId,
                                    );
                                    const filteredOrders = vg.orders
                                      .map((order) => {
                                        if (showAll) return order;
                                        const unpaidSvcs =
                                          order.services.filter((svc) => {
                                            const isPaid =
                                              svc.vendor_payment != null ||
                                              svc.vendor_paid === true ||
                                              svc.vendor_paid === 1;
                                            return !isPaid;
                                          });
                                        if (unpaidSvcs.length === 0)
                                          return null;
                                        return {
                                          ...order,
                                          services: unpaidSvcs,
                                        };
                                      })
                                      .filter(
                                        (o): o is VendorOrder => o !== null,
                                      );

                                    const ordPage =
                                      vendorOrderPageMap.get(vg.vendorId) || 1;
                                    const totalOrdPages = Math.ceil(
                                      filteredOrders.length / 10,
                                    );
                                    const paginatedOrders =
                                      filteredOrders.slice(
                                        (ordPage - 1) * 10,
                                        ordPage * 10,
                                      );

                                    return (
                                      <div>
                                        <div className="flex items-center justify-between mb-4">
                                          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                            Orders & Services{" "}
                                            {showAll
                                              ? "(All)"
                                              : "(Unpaid Only)"}
                                          </h4>
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              setShowAllServicesVendors(
                                                (prev) => {
                                                  const next = new Set(prev);
                                                  if (next.has(vg.vendorId))
                                                    next.delete(vg.vendorId);
                                                  else next.add(vg.vendorId);
                                                  return next;
                                                },
                                              );
                                              setVendorOrderPageMap((prev) =>
                                                new Map(prev).set(
                                                  vg.vendorId,
                                                  1,
                                                ),
                                              );
                                            }}
                                            className="text-xs h-8 text-white font-medium px-3 rounded-md hover:brightness-110 shadow-sm border-none transition-all cursor-pointer"
                                            style={{
                                              backgroundColor:
                                                roleSettings.pageTabColor,
                                            }}
                                          >
                                            {showAll
                                              ? "Show Unpaid Only"
                                              : "Show All Services"}
                                          </Button>
                                        </div>

                                        {loadingTravelCosts.has(vg.vendorId) ? (
                                          <div className="p-6 space-y-4 bg-white border rounded-lg shadow-sm">
                                            <div className="flex items-center gap-2">
                                              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                              <p className="text-sm text-gray-600">
                                                Calculating travel costs…
                                              </p>
                                            </div>
                                          </div>
                                        ) : filteredOrders.length === 0 ? (
                                          <p className="text-sm text-gray-400 italic py-2">
                                            {showAll
                                              ? "No orders found."
                                              : "No unpaid orders. All services are paid! Click 'Show All Services' to view paid orders."}
                                          </p>
                                        ) : (
                                          <>
                                            {paginatedOrders.map(
                                              (order: VendorOrder) => {
                                                const orderTotal =
                                                  order.services.reduce(
                                                    (t, s) =>
                                                      t + Number(s.amount ?? 0),
                                                    0,
                                                  );
                                                const orderTravelTotal =
                                                  getOrderTravelTotal(
                                                    order.orderId,
                                                    order.services,
                                                  );
                                                const firstSlot =
                                                  order.services?.[0]
                                                    ?.slots?.[0] ||
                                                  order.services?.find(
                                                    (s) => s.slots?.length > 0,
                                                  )?.slots?.[0];
                                                const address = firstSlot?.order
                                                  ? `${firstSlot.order.property_address || ""}, ${firstSlot.order.property_location || ""}`
                                                  : "";

                                                return (
                                                  <details
                                                    key={order.orderId}
                                                    className="group border rounded-lg bg-white shadow-sm overflow-hidden mb-3"
                                                  >
                                                    <summary className="cursor-pointer px-4 py-3 bg-white hover:bg-gray-50 flex items-center justify-between font-medium text-gray-800">
                                                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                                                        <span className="text-sm font-semibold">
                                                          Order #{order.orderId}
                                                        </span>
                                                        {address && (
                                                          <span
                                                            className="text-xs text-gray-500 max-w-[200px] md:max-w-xs truncate"
                                                            title={address}
                                                          >
                                                            {address}
                                                          </span>
                                                        )}
                                                        <span className="text-xs text-gray-400">
                                                          {new Date(
                                                            order.created_at,
                                                          ).toLocaleDateString()}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                          Services: $
                                                          {orderTotal.toFixed(
                                                            2,
                                                          )}
                                                          {orderTravelTotal >
                                                            0 &&
                                                            ` · Travel: $${orderTravelTotal.toFixed(2)}`}
                                                        </span>
                                                      </div>
                                                      <div className="flex items-center gap-2 text-gray-400">
                                                        <span className="group-open:hidden">
                                                          <ChevronDown className="h-4 w-4" />
                                                        </span>
                                                        <span className="hidden group-open:inline">
                                                          <ChevronUp className="h-4 w-4" />
                                                        </span>
                                                      </div>
                                                    </summary>
                                                    <div className="bg-gray-50 divide-y divide-gray-100 p-4 space-y-3">
                                                      {order.services.map(
                                                        (
                                                          svc: VendorService,
                                                          idx: number,
                                                        ) => {
                                                          const isPaid =
                                                            svc.vendor_payment !=
                                                              null ||
                                                            svc.vendor_paid ===
                                                              true ||
                                                            svc.vendor_paid ===
                                                              1;
                                                          const linkedInvoice =
                                                            svc.vendor_invoice_id
                                                              ? invoiceIdMap.get(
                                                                  svc.vendor_invoice_id,
                                                                )
                                                              : null;
                                                          const isInvoiced =
                                                            linkedInvoice !=
                                                              null && !isPaid;
                                                          const svcTravel =
                                                            travelCosts.get(
                                                              `${order.orderId}-${svc.uuid}`,
                                                            );
                                                          const vendorLocation =
                                                            vendorLocationData.get(
                                                              vg.vendorId,
                                                            );
                                                          const svcTime =
                                                            computeCombinedTime(
                                                              svc.slots || [],
                                                            );
                                                          const now =
                                                            new Date();
                                                          const firstSlotSvc =
                                                            svc.slots &&
                                                            svc.slots.length > 0
                                                              ? svc.slots[0]
                                                              : null;
                                                          let isVisited = false;
                                                          if (
                                                            firstSlotSvc?.date &&
                                                            firstSlotSvc?.start_time
                                                          ) {
                                                            isVisited =
                                                              new Date(
                                                                `${firstSlotSvc.date}T${firstSlotSvc.start_time}`,
                                                              ).getTime() <=
                                                              now.getTime();
                                                          }

                                                          return (
                                                            <div
                                                              key={idx}
                                                              className="border rounded-md bg-white p-4 shadow-sm hover:shadow-md transition"
                                                            >
                                                              <div className="flex items-start justify-between gap-4">
                                                                <div className="flex-1">
                                                                  <div className="flex items-center gap-2 flex-wrap">
                                                                    <p className="font-semibold text-sm text-gray-800">
                                                                      {
                                                                        svc.serviceName
                                                                      }
                                                                      {svc.option
                                                                        ? ` (${svc.option.title})`
                                                                        : ""}
                                                                    </p>
                                                                    {/* BADGE 1: PAYMENT */}
                                                                    {isPaid ? (
                                                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                                                                        ✓
                                                                        Payment:
                                                                        Paid
                                                                      </span>
                                                                    ) : isInvoiced ? (
                                                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                                                                        Payment:
                                                                        Invoiced
                                                                      </span>
                                                                    ) : (
                                                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
                                                                        Payment:
                                                                        Unpaid
                                                                      </span>
                                                                    )}
                                                                    {/* BADGE 2: COMPLETION */}
                                                                    {svc.is_completed ? (
                                                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700">
                                                                        ✓
                                                                        Service:
                                                                        Completed
                                                                      </span>
                                                                    ) : isVisited ? (
                                                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                                                        Service:
                                                                        In
                                                                        Progress
                                                                      </span>
                                                                    ) : (
                                                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                                                                        Service:
                                                                        Pending
                                                                      </span>
                                                                    )}
                                                                    {/* BADGE 3: VISITED */}
                                                                    {isVisited ? (
                                                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                                                                        Visit:
                                                                        Visited
                                                                      </span>
                                                                    ) : (
                                                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                                                        Visit:
                                                                        Not
                                                                        Visited
                                                                      </span>
                                                                    )}
                                                                    {/* Invoice Chip */}
                                                                    {linkedInvoice &&
                                                                      (userType ===
                                                                      "vendor" ? (
                                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 select-none">
                                                                          #
                                                                          {
                                                                            linkedInvoice.invoice_number
                                                                          }
                                                                        </span>
                                                                      ) : (
                                                                        <button
                                                                          onClick={async (
                                                                            e,
                                                                          ) => {
                                                                            e.stopPropagation();
                                                                            const token =
                                                                              localStorage.getItem(
                                                                                "token",
                                                                              ) ||
                                                                              "";
                                                                            vendorBillingService
                                                                              .getAdminInvoiceDetails(
                                                                                linkedInvoice.uuid,
                                                                                token,
                                                                              )
                                                                              .then(
                                                                                (
                                                                                  d,
                                                                                ) => {
                                                                                  setViewingInvoice(
                                                                                    d,
                                                                                  );
                                                                                  setIsViewModalOpen(
                                                                                    true,
                                                                                  );
                                                                                },
                                                                              )
                                                                              .catch(
                                                                                () => {
                                                                                  setViewingInvoice(
                                                                                    linkedInvoice,
                                                                                  );
                                                                                  setIsViewModalOpen(
                                                                                    true,
                                                                                  );
                                                                                },
                                                                              );
                                                                          }}
                                                                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition cursor-pointer"
                                                                          title="Click to view invoice"
                                                                        >
                                                                          #
                                                                          {
                                                                            linkedInvoice.invoice_number
                                                                          }
                                                                        </button>
                                                                      ))}
                                                                  </div>
                                                                  <p className="text-xs text-gray-500 mt-1">
                                                                    Price: $
                                                                    {Number(
                                                                      svc.amount ??
                                                                        0,
                                                                    ).toFixed(
                                                                      2,
                                                                    )}
                                                                    {svcTime &&
                                                                      ` · Time: ${svcTime}`}
                                                                  </p>
                                                                </div>
                                                              </div>
                                                              {svcTravel ? (
                                                                <div
                                                                  className={`mt-3 pt-3 border-t text-xs ${svcTravel.error ? "border-red-100" : svcTravel.travelCost > 0 ? "border-orange-100" : "border-gray-100"}`}
                                                                >
                                                                  <div className="flex items-center gap-2 flex-wrap mb-2">
                                                                    {svcTravel.travelCost >
                                                                    0 ? (
                                                                      <>
                                                                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] uppercase font-bold">
                                                                          Travel
                                                                        </span>
                                                                        <span className="font-bold text-orange-700">
                                                                          $
                                                                          {svcTravel.travelCost.toFixed(
                                                                            2,
                                                                          )}
                                                                        </span>
                                                                        <span className="text-gray-400">
                                                                          {
                                                                            svcTravel.distance
                                                                          }{" "}
                                                                          km
                                                                        </span>
                                                                        <span className="text-gray-300">
                                                                          •
                                                                        </span>
                                                                        <span className="text-gray-400">
                                                                          {
                                                                            svcTravel.estimatedTime
                                                                          }{" "}
                                                                          min
                                                                        </span>
                                                                        <span className="text-gray-300">
                                                                          •
                                                                        </span>
                                                                        <span className="text-gray-400">
                                                                          @ $
                                                                          {Number(
                                                                            vendorLocation?.paymentPerKm ??
                                                                              0,
                                                                          ).toFixed(
                                                                            2,
                                                                          )}
                                                                          /km
                                                                        </span>
                                                                      </>
                                                                    ) : svcTravel.error ? (
                                                                      <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] uppercase font-bold">
                                                                        Travel
                                                                        Error
                                                                      </span>
                                                                    ) : (
                                                                      <>
                                                                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] uppercase font-bold">
                                                                          No
                                                                          Travel
                                                                        </span>
                                                                        <span className="text-gray-400 italic">
                                                                          Travel
                                                                          not
                                                                          required
                                                                          for
                                                                          this
                                                                          service
                                                                        </span>
                                                                      </>
                                                                    )}
                                                                  </div>
                                                                  <div className="flex items-start gap-1.5 bg-gray-50 border border-gray-200 rounded px-2.5 py-2">
                                                                    <span className="mt-0.5 shrink-0 text-[11px]">
                                                                      📍
                                                                    </span>
                                                                    <div className="flex flex-col gap-1 min-w-0 w-full">
                                                                      <div className="flex items-start gap-2">
                                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide pt-0.5 w-7 shrink-0">
                                                                          From
                                                                        </span>
                                                                        <span className="text-gray-600 break-words">
                                                                          {svcTravel.fromAddress || (
                                                                            <em className="text-gray-400">
                                                                              —
                                                                            </em>
                                                                          )}
                                                                        </span>
                                                                      </div>
                                                                      <div className="ml-9 h-px bg-gray-200" />
                                                                      <div className="flex items-start gap-2">
                                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide pt-0.5 w-7 shrink-0">
                                                                          To
                                                                        </span>
                                                                        <span
                                                                          className={`break-words ${svcTravel.toAddress && svcTravel.toAddress.trim() !== "," ? "text-gray-700" : "text-red-400 italic"}`}
                                                                        >
                                                                          {svcTravel.toAddress &&
                                                                          svcTravel.toAddress.trim() !==
                                                                            ","
                                                                            ? svcTravel.toAddress
                                                                            : "No property address — travel skipped"}
                                                                        </span>
                                                                      </div>
                                                                    </div>
                                                                  </div>
                                                                  {svcTravel.error && (
                                                                    <div className="mt-1.5 px-2.5 py-1.5 bg-red-50 border border-red-200 rounded text-red-600 font-medium">
                                                                      ⚠️{" "}
                                                                      {svcTravel.errorMessage ||
                                                                        "Address not found or incorrect"}
                                                                    </div>
                                                                  )}
                                                                </div>
                                                              ) : !loadingTravelCosts.has(
                                                                  vg.vendorId,
                                                                ) ? (
                                                                <div className="mt-3 pt-3 border-t border-dashed border-gray-100 text-xs text-gray-400 italic">
                                                                  ⏳ Travel cost
                                                                  not applicable
                                                                  or computed
                                                                </div>
                                                              ) : null}
                                                            </div>
                                                          );
                                                        },
                                                      )}
                                                    </div>
                                                  </details>
                                                );
                                              },
                                            )}
                                            {totalOrdPages > 1 && (
                                              <div className="flex items-center justify-between mt-4 px-1 text-xs text-gray-500">
                                                <span>
                                                  Showing Page {ordPage} of{" "}
                                                  {totalOrdPages} (
                                                  {filteredOrders.length}{" "}
                                                  Orders)
                                                </span>
                                                <div className="flex gap-1">
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={ordPage === 1}
                                                    onClick={() =>
                                                      setVendorOrderPageMap(
                                                        (prev) =>
                                                          new Map(prev).set(
                                                            vg.vendorId,
                                                            ordPage - 1,
                                                          ),
                                                      )
                                                    }
                                                    className="h-7 text-xs px-2"
                                                  >
                                                    Prev
                                                  </Button>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={
                                                      ordPage === totalOrdPages
                                                    }
                                                    onClick={() =>
                                                      setVendorOrderPageMap(
                                                        (prev) =>
                                                          new Map(prev).set(
                                                            vg.vendorId,
                                                            ordPage + 1,
                                                          ),
                                                      )
                                                    }
                                                    className="h-7 text-xs px-2"
                                                  >
                                                    Next
                                                  </Button>
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-10 text-center text-gray-500 text-lg"
                      >
                        No vendors found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              ) : (
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow
                      key={index}
                      className="h-[60px] bg-white border-b border-[#E4E4E4]"
                    >
                      <TableCell className="pl-[20px]">
                        <Skeleton className="h-4 w-[150px] bg-gray-200" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[60px] bg-gray-200" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[100px] bg-gray-200" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[120px] bg-gray-200" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[80px] bg-gray-200" />
                      </TableCell>
                      <TableCell className="text-center px-[20px]">
                        <Skeleton className="h-5 w-[80px] bg-gray-200 rounded-full mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[100px] bg-gray-200" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-5 w-5 bg-gray-200 rounded mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>

            {vendorsGrouped.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-[#666666]">
                  Showing {paginatedVendors.length} of {vendorsGrouped.length}{" "}
                  Vendors
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="text-[#666666]"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[40px] ${
                            currentPage === page
                              ? `${userType}-bg text-white`
                              : "text-[#666666]"
                          }`}
                        >
                          {page}
                        </Button>
                      ),
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="text-[#666666]"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmationDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        onConfirm={confirmAndExecute}
        showAgain={showAgain}
        toggleShowAgain={() => setShowAgain(!showAgain)}
        dialogType="payment"
      />

      {/* View Invoice Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col rounded-[8px] p-0 font-alexandria overflow-hidden">
          {viewingInvoice ? (
            <>
              <DialogHeader className="p-4 md:p-6 border-b border-[#E4E4E4] bg-white shrink-0">
                <DialogTitle className="flex flex-col md:flex-row items-start md:items-center w-full font-alexandria relative pr-8 md:pr-0">
                  <div className="flex flex-col items-start w-full md:w-auto">
                    <span
                      className="text-[20px] md:text-[22px] font-[700] uppercase tracking-wide leading-none"
                      style={{
                        color: `var(--${userType}-page-tab-color, #000)`,
                      }}
                    >
                      Invoice
                    </span>
                    <span className="text-[13px] md:text-[15px] font-[500] text-gray-500 mt-1.5 break-all">
                      #{viewingInvoice?.invoice_number || viewingInvoice?.id}
                    </span>
                  </div>

                  <div
                    className={`flex w-full md:w-auto md:ml-auto md:items-center gap-2 mt-4 md:mt-0 md:pr-4 ${userType === "admin" ? "flex-row" : "flex-col md:flex-row items-start"}`}
                  >
                    {userType === "admin" &&
                      (viewingInvoice?.status === "pending_payment" ||
                        viewingInvoice?.status === "draft") && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerPaymentAction(() =>
                              handlePayInvoice(
                                viewingInvoice.uuid,
                                (viewingInvoice as any).vendor_uuid ||
                                  (viewingInvoice.vendor as any)?.uuid,
                                (viewingInvoice as any).vendor_id ||
                                  (viewingInvoice.vendor as any)?.id,
                                viewingInvoice.invoice_number,
                                Number(viewingInvoice.total_amount),
                              ),
                            );
                            setIsViewModalOpen(false);
                          }}
                          className={`flex-1 h-[40px] md:h-[36px] px-2 md:px-6 text-[12px] md:text-[14px] font-semibold text-white hover:brightness-90 hover:!text-white rounded-[6px] ${userType}-bg hover-${userType}-bg border-none w-full md:w-auto shadow-sm transition-all`}
                          style={{ backgroundColor: roleSettings.pageTabColor }}
                        >
                          Pay Now
                        </Button>
                      )}
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F9F9F9]">
                <div className="flex flex-col items-center">
                  <InvoiceDocument
                    invoice={{
                      ...viewingInvoice,
                      items: enrichInvoiceLines(
                        viewingInvoice.lines || [],
                        orderData,
                      ),
                    }}
                    editData={{
                      ...viewingInvoice,
                      items: enrichInvoiceLines(
                        viewingInvoice.lines || [],
                        orderData,
                      ),
                    }}
                    isEditing={false}
                    updateItem={() => {}}
                    addItem={() => {}}
                    removeItem={() => {}}
                    updateTaxRate={() => {}}
                    setEditData={() => {}}
                    roleSettings={roleSettings}
                  />

                  {/* Hidden PDF component for high-accuracy capture */}
                  <div
                    style={{
                      position: "absolute",
                      top: "-9999px",
                      left: "-9999px",
                    }}
                  >
                    <InvoicePdfDocument
                      invoice={{
                        ...viewingInvoice,
                        items: enrichInvoiceLines(
                          viewingInvoice.lines || [],
                          orderData,
                        ),
                      }}
                      roleSettings={roleSettings}
                    />
                  </div>

                  {/* Warning if no lines */}
                  {(!viewingInvoice.lines ||
                    viewingInvoice.lines.length === 0) && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 mt-4 w-full text-center">
                      ⚠️ No line items found. This invoice may not have travel
                      costs recorded.
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="border-t p-4 shrink-0 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <Button
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-white hover:brightness-110 transition-all px-8 h-10 w-full sm:w-auto"
                  style={{ backgroundColor: roleSettings.pageTabColor }}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;
