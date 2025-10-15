"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import BillingDialog from "@/components/BillingDialog";
import { useAppContext } from "@/app/context/AppContext";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Get } from "../orders/orders";
import { toast } from "sonner";
import { payVendor } from "./vendorBilling";


export interface Slot {
    id: number;
    service_id: number;
    vendor_id: number | string;
    start_time: string;
    end_time: string;
    vendor: Vendor;
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
    };
    service_name?: string;
    name?: string;
    option?: { title?: string };
    option_id?: string | number;
    amount?: string | number;
    uuid?: string
}

export interface Order {
    id: number;
    created_at: string;
    slots: Slot[];
    services: ServiceRecord[];
}


export interface VendorService {
    serviceId: number;
    serviceName: string;
    option?: { title?: string };
    amount: string | number;
    slots: Slot[];
    status?: string;
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
    status?: 'COMPLETE' | 'PENDING' | string;
    uuid?: string;
    vendor_payment?: { stripe_transfer_id: string, uuid: string , invoice_url:string}
}
const Page = () => {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const [showAgain, setShowAgain] = useState(true);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [orderData, setOrderData] = useState<Order[]>([]);
    const { userType } = useAppContext();
    console.log(error);
    const [processingPayments, setProcessingPayments] = useState<Set<string>>(new Set());
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    const confirmAndExecute = () => {
        pendingAction?.();
        setPendingAction(null);
    };

    const toggleRow = (i: number) => {
        setExpandedRow(expandedRow === i ? null : i);
    };

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log("Token not found.");
            setLoading(false);
            setError(true);
            return;
        }

        setLoading(true);
        setError(false);

        Get(token)
            .then((data) => {
                const sorted = Array.isArray(data.data)
                    ? [...data.data].sort(
                        (a, b) =>
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )
                    : [];
                setOrderData(sorted);
            })
            .catch((err) => {
                console.log(err.message);
                setError(true);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return "—";
        const parts = timeStr.split(":");
        if (parts.length >= 2) return `${parts[0].padStart(2, "0")}:${parts[1]}`;
        return timeStr;
    };

    const computeCombinedTime = (slots: Slot[]) => {
        if (!slots || slots.length === 0) return "—";
        const sorted = [...slots].sort(
            (a, b) =>
                new Date(`1970-01-01T${a.start_time}`).getTime() -
                new Date(`1970-01-01T${b.start_time}`).getTime()
        );
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        const start = formatTime(first.start_time);
        const end = formatTime(last.end_time);

        const startDate = new Date(`1970-01-01T${first.start_time}`);
        const endDate = new Date(`1970-01-01T${last.end_time}`);
        const diffMin = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));

        return `${start} - ${end} (${diffMin} minutes)`;
    };

    const vendorsGrouped: VendorGrouped[] = useMemo(() => {
        const map = new Map<number | string, {
            vendor: Vendor;
            orders: Map<number, VendorOrder>
        }>();

        orderData.forEach((order: Order) => {
            if (!order.slots || order.slots.length === 0) return;

            // group slots by service_id
            const groupedSlots = order.slots.reduce<Record<number, Slot[]>>((acc, slot) => {
                const sid = slot.service_id;
                if (!acc[sid]) acc[sid] = [];
                acc[sid].push(slot);
                return acc;
            }, {});

            Object.keys(groupedSlots).forEach((sidKey) => {
                const sid = Number(sidKey);
                const slotsForService = groupedSlots[sid];

                const svcRecord =
                    order.services?.find((s) => Number(s.service_id) === sid) ||
                    order.services?.find((s) => s.service?.id === sid);

                const vendorIds = Array.from(new Set(slotsForService.map((s) => s.vendor_id)));

                vendorIds.forEach((vendorId) => {
                    const vendorObj =
                        slotsForService.find((s) => s.vendor_id === vendorId)?.vendor || {
                            uuid: "",
                            first_name: "Vendor",
                            last_name: "",
                        };

                    if (!map.has(vendorId)) {
                        map.set(vendorId, { vendor: vendorObj, orders: new Map<number, VendorOrder>() });
                    }

                    const vendorEntry = map.get(vendorId)!;

                    if (!vendorEntry.orders.has(order.id)) {
                        vendorEntry.orders.set(order.id, {
                            orderId: order.id,
                            created_at: order.created_at,
                            services: [],
                        });
                    }

                    const serviceForVendor: ServiceForVendor = {
                        ...svcRecord,
                        serviceId: sid,
                        serviceName:
                            svcRecord?.service?.name ||
                            svcRecord?.service_name ||
                            svcRecord?.name ||
                            `Service ${sid}`,
                        slots: slotsForService.filter((s) => s.vendor_id === vendorId),
                        amount: svcRecord?.amount || 0,
                    };

                    vendorEntry.orders.get(order.id)!.services.push(serviceForVendor);
                });
            });
        });

        // convert map -> array
        const arr: VendorGrouped[] = Array.from(map.entries()).map(([vendorId, vendorEntry]) => {
            const ordersArr = Array.from(vendorEntry.orders.values());
            const totalServices = ordersArr.reduce((sum, o) => sum + (o.services?.length || 0), 0);
            const totalAmount = ordersArr.reduce(
                (sum, o) => sum + o.services.reduce((sSum, svc) => sSum + Number(svc.amount ?? 0), 0),
                0
            );

            const dates = ordersArr
                .map((o) => o.created_at)
                .filter(Boolean)
                .map((d) => new Date(d));
            const earliestDate = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : null;
            const added = earliestDate ? earliestDate.toISOString().split("T")[0] : null;

            return {
                vendorId,
                vendor: vendorEntry.vendor,
                totalServices,
                totalOrders: ordersArr.length,
                totalAmount,
                added,
                orders: ordersArr,
            };
        });

        return arr;
    }, [orderData]);

    console.log('vendorsGrouped', vendorsGrouped);

    const handlePayVendor = async (paymentData: { order_service_uuid: string, vendor_uuid: string, amount: number }) => {
        const paymentKey = `${paymentData.order_service_uuid}-${paymentData.vendor_uuid}`;

        try {
            setProcessingPayments(prev => new Set(prev).add(paymentKey));

            const token = localStorage.getItem("token") || "";

            if (!paymentData?.vendor_uuid || !paymentData?.order_service_uuid) {
                toast.error("Invalid payment data");
                return;
            }

            const result = await payVendor(paymentData, token);

            if (result.status === "success") {
                toast.success("Payment processed successfully");

                setOrderData(prevOrderData => {
                    return prevOrderData.map(order => {
                        const hasPaidService = order.services?.some(service =>
                            service.uuid === paymentData.order_service_uuid
                        );

                        if (hasPaidService) {
                            const updatedServices = order.services?.map(service => {
                                if (service.uuid === paymentData.order_service_uuid) {
                                    return {
                                        ...service,
                                        vendor_payment: {
                                            paid: true,
                                            transfer_id: result.transfer_id,
                                            paid_at: new Date().toISOString()
                                        }
                                    };
                                }
                                return service;
                            });

                            return {
                                ...order,
                                services: updatedServices
                            };
                        }

                        return order;
                    });
                });
            } else {
                toast.error("Payment failed");
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Payment error:", error);
            toast.error(error.message || "Payment failed");
        } finally {
            setProcessingPayments(prev => {
                const newSet = new Set(prev);
                newSet.delete(paymentKey);
                return newSet;
            });
        }
    };


    return (
        <div>
            <div
                className="w-full h-[80px] bg-[#E4E4E4] font-alexandria z-10 relative flex justify-between px-[20px] items-center"
                style={{ boxShadow: "0px 4px 4px #0000001F" }}
            >
                <p className={`text-[16px] md:text-[24px] font-[400]  ${userType}-text`}>
                    Billing ({vendorsGrouped.length})
                </p>
                <Select onValueChange={(value) => console.log(value)}>
                    <SelectTrigger
                        className={`w-[174px] h-[42px] bg-[#EEEEEE] text-[#666666] border-[1px] border-[#BBBBBB] ${userType === "admin"
                            ? "[&>svg]:text-[#4290E9]"
                            : userType === "agent"
                                ? "[&>svg]:text-[#6BAE41]"
                                : "[&>svg]:text-[#4290E9]"
                            }  [&>svg]:opacity-100`}
                    >
                        <SelectValue placeholder="All Invoices" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#EEEEEE] rounded-none w-full py-[12px] text-[#666666]">
                        <SelectItem value="allinvoices" className="p-0 px-[16px] mb-[9px] hover:!bg-transparent focus:!bg-transparent !bg-transparent cursor-pointer">
                            All Invoices
                        </SelectItem>
                        <SelectItem value="Unpaid" className="p-0 px-[16px] mb-[9px] hover:!bg-transparent focus:!bg-transparent !bg-transparent cursor-pointer">
                            Unpaid
                        </SelectItem>
                        <SelectItem value="Draft" className="p-0 px-[16px] hover:!bg-transparent focus:!bg-transparent !bg-transparent cursor-pointer">
                            Draft
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="w-full relative">
                <Table className="font-alexandria px-0 overflow-x-auto whitespace-nowrap">
                    <TableHeader>
                        <TableRow className="bg-[#E4E4E4] font-alexandria h-[54px] hover:bg-[#E4E4E4]">
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D] pl-[20px]">Vendor</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Orders</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Services</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Service Time</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Total</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D] text-center">Status</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Added</TableHead>
                            <TableHead className="text-[14px] font-[700] text-[#7D7D7D] text-center">{/* chevron */}</TableHead>
                        </TableRow>
                    </TableHeader>

                    {!loading ? (
                        <TableBody>
                            {vendorsGrouped.length > 0 ? (
                                vendorsGrouped.map((vg, i) => {

                                    const vendorTimeDisplay: string = computeCombinedTime(
                                        vg.orders.flatMap((o: VendorOrder) =>
                                            o.services.flatMap((svc: VendorService) => svc.slots || [])
                                        )
                                    );

                                    // extract only minutes part from parentheses
                                    const vendorMinutesOnly =
                                        vendorTimeDisplay.match(/\(([^)]+)\)/)?.[1] || vendorTimeDisplay;

                                    return (
                                        <React.Fragment key={vg.vendorId}>
                                            <TableRow onClick={() => toggleRow(i)} className="cursor-pointer hover:bg-gray-100">
                                                <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                                                    {vg.vendor?.first_name} {vg.vendor?.last_name}
                                                </TableCell>

                                                <TableCell className={`text-[15px] py-[19px] font-[400] ${userType}-text`}>
                                                    {vg.totalOrders}
                                                </TableCell>

                                                <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D] ">
                                                    {vg.totalServices} services
                                                </TableCell>

                                                <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                                                    {vendorMinutesOnly}
                                                </TableCell>

                                                <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                                                    ${Number(vg.totalAmount ?? 0).toFixed(2)}
                                                </TableCell>

                                                <TableCell className="text-[10px] py-[19px] px-[20px] text-center font-[400] text-[#7D7D7D] ">
                                                    <label className="px-[7px] py-[1.5px] text-white rounded-[10px] leading-[100%] !bg-[#6BAE41]">
                                                        Completed
                                                    </label>
                                                </TableCell>

                                                <TableCell className="text-[15px] py-[19px] font-[400] text-[#7D7D7D]">
                                                    {vg.added || "—"}
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
                                                    <TableCell colSpan={8} className="p-0">
                                                        <div className="overflow-hidden transition-all duration-300 p-4">
                                                            <div className="space-y-4">
                                                                {vg.orders.map((order: VendorOrder) => {
                                                                    const orderTotal = order.services.reduce(
                                                                        (total: number, svc: VendorService) => total + Number(svc.amount ?? 0),
                                                                        0
                                                                    );

                                                                    return (
                                                                        <details
                                                                            key={order.orderId}
                                                                            className="group border rounded-lg shadow-sm overflow-hidden"
                                                                        >
                                                                            <summary className="cursor-pointer px-4 py-3 bg-white hover:bg-gray-100 flex items-center justify-between font-medium text-gray-800">
                                                                                <span>
                                                                                    Order #{order.orderId} — {order.services.length} service(s) — ${orderTotal.toFixed(2)}
                                                                                </span>
                                                                                <span className="text-gray-500 group-open:hidden">
                                                                                    <ChevronDown className="h-5 w-5" />
                                                                                </span>
                                                                                <span className="text-gray-500 hidden group-open:inline">
                                                                                    <ChevronUp className="h-5 w-5" />
                                                                                </span>
                                                                            </summary>

                                                                            <div className="bg-gray-50 p-4 space-y-4">
                                                                                {order.services.map((svc: ServiceForVendor, idx: number) => {
                                                                                    const svcTime = computeCombinedTime(svc.slots || []);
                                                                                    console.log('svc', svc);

                                                                                    return (
                                                                                        <div
                                                                                            key={idx}
                                                                                            className="border rounded-md bg-white p-4 shadow-sm hover:shadow-md transition"
                                                                                        >
                                                                                            <div className="flex justify-between items-start gap-4">
                                                                                                <div>
                                                                                                    <p className="font-semibold text-gray-800">
                                                                                                        {svc.serviceName}{" "}
                                                                                                        {svc.option ? `(${svc.option.title})` : ""}
                                                                                                    </p>
                                                                                                    <p className="text-sm text-gray-600">
                                                                                                        Price: ${Number(svc.amount ?? 0).toFixed(2)}
                                                                                                    </p>
                                                                                                    <p className="text-sm text-gray-600">Time: {svcTime}</p>
                                                                                                    <p className="text-sm text-gray-600">Status: {svc.status}</p>
                                                                                                </div>

                                                                                                <div className="flex flex-col gap-2 items-end">
                                                                                                    <button
                                                                                                        disabled={svc.vendor_payment != null || processingPayments.has(`${svc.uuid}-${svc.slots[0].vendor.uuid}`)}
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            handlePayVendor({
                                                                                                                vendor_uuid: svc.slots[0].vendor.uuid,
                                                                                                                order_service_uuid: svc.uuid ?? '',
                                                                                                                amount: Number(svc.amount ?? 0)
                                                                                                            });
                                                                                                        }}
                                                                                                        className={`
                                                                                                                px-4 py-2 text-white rounded-md text-sm shadow transition-colors flex items-center justify-center min-w-[100px]
                                                                                                                ${svc.vendor_payment != null
                                                                                                                ? 'bg-green-500 cursor-not-allowed'
                                                                                                                : processingPayments.has(`${svc.uuid}-${svc.slots[0].vendor.uuid}`)
                                                                                                                    ? 'bg-blue-400 cursor-not-allowed'
                                                                                                                    : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                                                                                                            } `}
                                                                                                    >
                                                                                                        {processingPayments.has(`${svc.uuid}-${svc.slots[0].vendor.uuid}`) ? (
                                                                                                            <span className="flex items-center">
                                                                                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                                                                </svg>
                                                                                                                Processing...
                                                                                                            </span>
                                                                                                        ) : svc.vendor_payment != null ? (
                                                                                                            'Paid'
                                                                                                        ) : (
                                                                                                            'Pay Now'
                                                                                                        )}
                                                                                                    </button>
                                                                                                    {svc.vendor_payment?.invoice_url &&
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                                                                            <a
                                                                                                                href={svc.vendor_payment?.invoice_url}
                                                                                                                target="_blank"
                                                                                                                rel="noopener noreferrer"
                                                                                                                className="text-blue-500 hover:text-blue-700 hover:underline truncate max-w-[200px]"
                                                                                                                title={svc.vendor_payment?.invoice_url}
                                                                                                            >
                                                                                                                {svc.vendor_payment?.invoice_url ?
                                                                                                                    svc.vendor_payment.invoice_url.replace(/^https?:\/\//, '').substring(0, 30) + '...'
                                                                                                                    : 'No URL'
                                                                                                                }
                                                                                                            </a>
                                                                                                        </div>
                                                                                                    }
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </details>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}


                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-10 text-center text-gray-500 text-lg">
                                        No vendors found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    ) : (
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={8} className="py-10 text-center text-gray-500 text-lg">
                                    Loading Data…
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    )}
                </Table>
            </div>

            <BillingDialog
                open={confirmOpen}
                setOpen={setConfirmOpen}
                onConfirm={confirmAndExecute}
                showAgain={showAgain}
                toggleShowAgain={() => setShowAgain(!showAgain)}
            />
        </div>
    );
};

export default Page;
