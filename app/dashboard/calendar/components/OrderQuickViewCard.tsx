import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar, File, Mail, MapPin, Phone, Smartphone, X } from "lucide-react";
import React from "react";
import { Vendor } from "./BigCalendar";
import dayjs from 'dayjs';
import { Agent } from "@/components/AgentTable";
import { Services } from "../../services/page";
import { Order } from "../../orders/page";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/app/context/AppContext";

export type CalendarEvent = {
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    vendor_id?: string
    service_id?: number
    color_id?: number
    order_id?: string
};

type QuickViewCardProps = {
    data: CalendarEvent
    onClose: () => void
    setOpenDetails: (value: boolean) => void;
    vendorData: Vendor[]
    agentData: Agent[]
    serviceData: Services[]
    orderData: Order[]
}

export default function OrderQuickViewCard({ data, onClose, vendorData, serviceData, orderData, setOpenDetails }: QuickViewCardProps) {
    const { userType } = useAppContext();
    const OrderVendor = vendorData?.find((vendor) => {
        return vendor.uuid == data.vendor_id
    })
    const CurrentService = serviceData?.find((service) => {
        return service.id === Number(data.service_id)
    })
    const CurrentOrder = orderData?.find((order) => {
        return order.uuid === data.order_id
    })

    const notes = typeof CurrentOrder?.notes === 'string'
        ? JSON.parse(CurrentOrder.notes)
        : [];

    const serviceOptions = CurrentOrder?.services.find((service) => {
        return service.service.uuid == CurrentService?.uuid
    })
    return (
        <Card className="w-full sm:w-[405px] font-alexandria p-4 border-[1px] border-[#BBBBBB] rounded-none space-y-4 fixed top-[0px] right-0 z-50 bg-[#EEEEEE] h-[100vh] overflow-y-auto flex flex-col justify-between">
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
                    <p className={`hover:underline text-[15px] font-[400] leading-[32px] ${userType}-text`}>
                        <span className="text-[#666666]">Agent:</span>  {CurrentOrder?.agent?.first_name} {CurrentOrder?.agent?.last_name}
                    </p>
                    <p className={`hover:underline text-[15px] font-[400] leading-[32px] ${userType}-text`}>
                        <span className="text-[#666666]">Vendor:</span>  {OrderVendor?.first_name} {OrderVendor?.last_name}
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
                        <span className={`hover:underline text-[15px] font-[400] leading-[32px] ${userType}-text`}>Order #{CurrentOrder?.id}</span>
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
                    <div className="flex items-center space-x-[18px]">
                        <Phone className="w-[24px] text-[#666666]" strokeWidth={1} />
                        <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">{OrderVendor?.primary_phone}</span>
                    </div>
                    <div className="flex items-center space-x-[18px]">
                        <Smartphone className="w-[24px] text-[#666666]" strokeWidth={1} />
                        <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">{OrderVendor?.secondary_phone}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-y-[0px]">
                        <span className="text-[#8E8E8E] text-[10px] font-[700]">Service</span>
                        <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">{CurrentService?.name}</span>

                    </div>
                    <div className="grid grid-cols-1 gap-y-[0px]">
                        <span className="text-[#8E8E8E] text-[10px] font-[700]">Service Option</span>
                        <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">{serviceOptions?.option?.title}</span>

                    </div>
                    <div className="grid grid-cols-1 gap-y-[0px]">
                        <span className="text-[#8E8E8E] text-[10px] font-[700]">Special Instructions</span>
                        {notes.length > 0 && notes.map((note: { note: string }, idx: number) => {
                            return <span key={idx} className="text-[15px] font-[400] text-[#666666] leading-[32px]">{note.note}</span>
                        })}

                    </div>


                </div>
            </CardContent>

            <CardFooter className="p-0 mt-10">
                <div className="w-full flex justify-end gap-[10px]">
                    <Button
                        onClick={() => {
                            setOpenDetails(true)
                        }}

                        className={` bg-transparent border-[1px] text-[14px] flex justify-center items-center ${userType}-border ${userType}-text hover:text-white rounded-none w-[132px] h-[32px]  hover-${userType}-bg ${userType}-button`}
                    >
                        Detail View
                    </Button>
                    {/* <Button
                        className="bg-[#4290E9] border-[1px] text-[14px] flex justify-center items-center border-[#4290E9] text-[#fff] rounded-none w-[132px] h-[32px] hover:text-white hover:bg-[#4e9af1]"
                    >
                        History
                    </Button> */}
                </div>
            </CardFooter>
        </Card>
    );
}
