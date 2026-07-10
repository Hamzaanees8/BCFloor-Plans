import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar, File, Mail, MapPin, Phone, Smartphone, X } from "lucide-react";
import React from "react";
import { CalanderVendor } from "./BigCalendar";
import dayjs from 'dayjs';
import { Agent } from "@/lib/types";
import { Services } from "../../services/page";
import { Order } from "../../orders/page";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/app/context/AppContext";
import Link from "next/link";
import CancelOrderDialog, { CancelPreviewData } from "../../orders/components/CancelOrderDialog";
import { PreviewCancelService, CancelService } from "../../orders/orders";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export type CalendarEvent = {
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    vendor_id?: string
    service_id?: number
    color_id?: number
    order_id?: string | number
};

type QuickViewCardProps = {
    data: CalendarEvent
    onClose: () => void
    setOpenDetails: (value: boolean) => void;
    vendorData: CalanderVendor[]
    agentData: Agent[]
    serviceData: Services[]
    orderData: Order[]
    refreshOrders?: () => void
}

export default function OrderQuickViewCard({ data, onClose, vendorData, serviceData, orderData, setOpenDetails, refreshOrders }: QuickViewCardProps) {
    const { userType } = useAppContext();
    const [showCancelServiceDialog, setShowCancelServiceDialog] = React.useState(false);
    const [cancelServicePreviewData, setCancelServicePreviewData] = React.useState<CancelPreviewData | null>(null);
    const [isCancelServiceLoading, setIsCancelServiceLoading] = React.useState(false);
    const [cancelTargetService, setCancelTargetService] = React.useState<{ uuid: string; name: string } | null>(null);
    const OrderVendor = vendorData?.find((vendor) => {
        return vendor.uuid == data.vendor_id
    })
    const CurrentService = serviceData?.find((service) => {
        return service.id === Number(data.service_id)
    })
    const CurrentOrder = orderData?.find((order) => {
        return order.uuid === data.order_id
    })

    const allNotes = typeof CurrentOrder?.notes === 'string'
        ? JSON.parse(CurrentOrder.notes)
        : [];

    const agentNotes = allNotes.filter((note: any) => note.internal === 'false' || note.is_internal === false || (!note.internal && !note.is_internal));
    const internalNotes = allNotes.filter((note: any) => note.internal === 'true' || note.is_internal === true);

    const serviceOptions = CurrentOrder?.services?.find((service) => {
        return service.service.uuid == CurrentService?.uuid
    })

    const queryParams = new URLSearchParams();
    if (CurrentOrder?.property?.uuid) queryParams.append('listingId', CurrentOrder.property.uuid);
    if (CurrentService?.uuid) queryParams.append('serviceId', CurrentService.uuid);
    const queryString = queryParams.toString();
    const fileManagerHref = `/dashboard/file-manager/${CurrentOrder?.uuid}${queryString ? `?${queryString}` : ''}`;

    const earliestSlotDT = CurrentOrder?.slots?.reduce<Date | null>((earliest, slot) => {
        const dt = new Date(`${slot.date}T${slot.start_time}`);
        return !earliest || dt < earliest ? dt : earliest;
    }, null) ?? null;

    const showCancelButton =
        !!CurrentOrder &&
        CurrentOrder.order_status !== "Cancelled" &&
        (!earliestSlotDT || earliestSlotDT > new Date()) &&
        (userType === "admin" || userType === "agent");

    const handleCancelServiceClick = async () => {
        const token = localStorage.getItem("token");
        if (!token || !CurrentOrder || !CurrentService) return;
        
        if (!serviceOptions?.uuid) {
            toast.error("Service booking not found in this order.");
            return;
        }

        setIsCancelServiceLoading(true);
        setCancelTargetService({ uuid: serviceOptions.uuid, name: CurrentService.name || "" });
        
        try {
            const data = await PreviewCancelService(CurrentOrder.uuid, serviceOptions.uuid, token);
            setCancelServicePreviewData(data.data);
            setShowCancelServiceDialog(true);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to load cancellation details"
            );
            setCancelTargetService(null);
        } finally {
            setIsCancelServiceLoading(false);
        }
    };

    const handleCancelService = async (reason?: string) => {
        const token = localStorage.getItem("token");
        if (!token || !CurrentOrder || !cancelTargetService) return;
        
        setIsCancelServiceLoading(true);
        try {
            await CancelService(CurrentOrder.uuid, cancelTargetService.uuid, token, reason);
            toast.success("Service cancelled successfully");
            setShowCancelServiceDialog(false);
            onClose();
            if (refreshOrders) {
                refreshOrders();
            }
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to cancel service"
            );
        } finally {
            setIsCancelServiceLoading(false);
        }
    };

    return (
        <Card
            className="w-full sm:w-[405px] font-alexandria p-4 border-[1px] border-[#BBBBBB] rounded-none space-y-4 fixed top-[0px] right-0 z-50 h-[100vh] overflow-y-auto flex flex-col justify-between"
            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
        >
            <CardContent className="flex flex-col gap-[12px] p-0 custom-scrollbar">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-[24px] font-[400] text-[#666666] leading-8">
                        Appointment Quick View
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-x-3 items-start">

                    <div className="text-[24px] font-[400] text-[#666666] font-alexandria">
                        {CurrentService?.name}
                    </div>
                </div>

                <div className="space-y-2 text-sm overflow-auto custom-scrollbar">
                    <p className={`text-[15px] font-[400] leading-[32px] ${userType}-text`}>
                        <span className="text-[#666666] mr-1">Agent:</span>
                        {userType === 'admin' ? (
                            <Link
                                className="hover:underline"
                                href={`/dashboard/agents/create/${CurrentOrder?.agent?.uuid}`}
                            >
                                {CurrentOrder?.agent?.first_name} {CurrentOrder?.agent?.last_name}
                            </Link>
                        ) : (
                            <span>{CurrentOrder?.agent?.first_name} {CurrentOrder?.agent?.last_name}</span>
                        )}
                    </p>
                    <p className={` text-[15px] font-[400] leading-[32px] ${userType}-text`}>
                        <span className="text-[#666666] mr-1">Vendor:</span>
                        {userType === 'admin' ?
                            <Link
                                className="hover:underline"
                                href={`/ashboard/vendors/create/${OrderVendor?.uuid}`}
                            >
                                {OrderVendor?.first_name} {OrderVendor?.last_name}
                            </Link>

                            : <span> {OrderVendor?.first_name} {OrderVendor?.last_name}</span>
                        }
                    </p>
                    {/* <p className="hover:underline text-[15px] font-[400] text-[#666666] leading-[32px]">
                        <span className="text-[#666666]">Time:</span>  {`${dayjs(new Date(data.start)).format('hh:mm A')} - ${dayjs(new Date(data.end)).format('hh:mm A')}`}
                    </p> */}
                    <div className="flex items-center space-x-[18px]">
                        <MapPin className="w-[24px] text-[#666666]" strokeWidth={1} />
                        <a className={`hover:underline text-[15px] font-[400] leading-[32px] ${userType}-text`} href={`https://www.google.com/maps?q=${CurrentOrder?.property_address + ',' + CurrentOrder?.property_location}`}
                            target="_blank"
                            rel="noopener noreferrer">
                            {CurrentOrder?.property_address}, {CurrentOrder?.property_location}</a>
                    </div>

                    <div className="flex items-center space-x-[18px]">
                        <File className="w-[24px] text-[#666666]" strokeWidth={1} />
                        <Link
                            href={`/dashboard/orders/${CurrentOrder?.uuid}`}
                            className={`hover:underline text-[15px] font-[400] leading-[32px] ${userType}-text`}>Order #{CurrentOrder?.id}</Link>
                    </div>
                    <div className="flex  items-start space-x-[18px]">
                        <Calendar className="w-[24px] mt-[7px] text-[#666666]" strokeWidth={1} />
                        <div className="flex flex-col">
                            <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">{dayjs(CurrentOrder?.created_at).format("MMMM, DD, YYYY")}</span>
                            <span className="text-[#666666] ml-0">{`${dayjs(new Date(data.start)).format('hh:mm A')} - ${dayjs(new Date(data.end)).format('hh:mm A')}`}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-[18px]">
                        <Mail className="w-[24px] text-[#666666]" strokeWidth={1} />
                        <span className={`hover:underline text-[15px] font-[400] leading-[32px] ${userType}-text`}>{OrderVendor?.email}</span>
                    </div>
                    {OrderVendor?.primary_phone &&
                        <div className="flex items-center space-x-[18px]">
                            <Phone className="w-[24px] text-[#666666]" strokeWidth={1} />
                            <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">{OrderVendor?.primary_phone}</span>
                        </div>
                    }
                    {OrderVendor?.secondary_phone &&
                        <div className="flex items-center space-x-[18px]">
                            <Smartphone className="w-[24px] text-[#666666]" strokeWidth={1} />
                            <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">{OrderVendor?.secondary_phone}</span>
                        </div>
                    }
                    <div className="grid grid-cols-1 gap-y-[0px]">
                        <span className="text-[#8E8E8E] text-[10px] font-[700]">Service</span>
                        <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">{CurrentService?.name}</span>

                    </div>
                    <div className="grid grid-cols-1 gap-y-[0px]">
                        <span className="text-[#8E8E8E] text-[10px] font-[700]">Service Option</span>
                        <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">{serviceOptions?.option?.title}</span>

                    </div>
                    {userType === 'admin' ? (
                        <>
                            <div className="grid grid-cols-1 gap-y-[0px]">
                                <span className="text-[#8E8E8E] text-[10px] font-[700]">Notes viewable by agent</span>
                                {agentNotes.length > 0 ? agentNotes.map((note: { note: string }, idx: number) => (
                                    <span key={idx} className="text-[15px] font-[400] text-[#666666] leading-[32px]">{note.note}</span>
                                )) : <span className="text-[15px] font-[400] text-[#8E8E8E] italic leading-[32px]">No agent notes</span>}
                            </div>
                            <div className="grid grid-cols-1 gap-y-[0px] mt-2">
                                <span className="text-[#8E8E8E] text-[10px] font-[700]">Internal notes not viewable by agent</span>
                                {internalNotes.length > 0 ? internalNotes.map((note: { note: string }, idx: number) => (
                                    <span key={idx} className="text-[15px] font-[400] text-[#E06D5E] leading-[32px]">{note.note}</span>
                                )) : <span className="text-[15px] font-[400] text-[#8E8E8E] italic leading-[32px]">No internal notes</span>}
                            </div>
                        </>
                    ) : (
                        <div className="grid grid-cols-1 gap-y-[0px]">
                            <span className="text-[#8E8E8E] text-[10px] font-[700]">Notes</span>
                            {agentNotes.length > 0 ? agentNotes.map((note: { note: string }, idx: number) => (
                                <span key={idx} className="text-[15px] font-[400] text-[#666666] leading-[32px]">{note.note}</span>
                            )) : <span className="text-[15px] font-[400] text-[#8E8E8E] italic leading-[32px]">No notes</span>}
                        </div>
                    )}


                </div>
            </CardContent>

            <CardFooter className="p-0 mt-10">
                <div className="w-full flex flex-wrap justify-end gap-[10px]">
                    <Link
                        href={fileManagerHref}
                        className={`${userType}-bg border-[1px] text-[14px] flex justify-center items-center ${userType}-border text-[#fff] rounded-none w-[132px] h-[32px] hover:text-white hover:brightness-110`}
                    >
                        Manage Media
                    </Link>
                    <Button
                        onClick={() => {
                            setOpenDetails(true)
                        }}

                        className={` bg-transparent border-[1px] text-[14px] flex justify-center items-center ${userType}-border ${userType}-text hover:text-white rounded-none w-[132px] h-[32px]  hover-${userType}-bg ${userType}-button`}
                    >
                        Detail View
                    </Button>

                    {showCancelButton && (
                        <Button
                            onClick={handleCancelServiceClick}
                            disabled={isCancelServiceLoading}
                            className={`bg-transparent border-[1px] text-[14px] flex justify-center items-center ${userType}-border text-red-500 hover:text-white rounded-none w-auto px-4 h-[32px] hover:bg-red-500 hover:border-red-500`}
                        >
                            {isCancelServiceLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Cancel Service"}
                        </Button>
                    )}
                </div>
            </CardFooter>

            {showCancelServiceDialog && CurrentOrder && (
                <CancelOrderDialog
                    open={showCancelServiceDialog}
                    onOpenChange={setShowCancelServiceDialog}
                    orderData={CurrentOrder}
                    isLoading={isCancelServiceLoading}
                    previewData={cancelServicePreviewData}
                    mode="service"
                    targetName={cancelTargetService?.name}
                    onConfirm={handleCancelService}
                />
            )}
        </Card >
    );
}
