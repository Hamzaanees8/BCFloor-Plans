import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Mail, MapPin, Smartphone, X } from "lucide-react";
// import { MapPin, Mail, Phone, Smartphone, X } from "lucide-react";
import React from "react";
import { Vendor } from "./BigCalendar";
import { Button } from "@/components/ui/button";
import dayjs from 'dayjs';
import { useAppContext } from "@/app/context/AppContext";
// import { Address } from "@/components/VendorTable";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type CalendarEvent = {
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    vendor_id?: string
    color_id?: number
};

type QuickViewCardProps = {
    data: CalendarEvent
    onClose?: () => void
    vendorData: Vendor[]
}

export default function BreakQuickViewCard({ data, onClose, vendorData }: QuickViewCardProps) {
    const {userType} = useAppContext();
    // const typeToLabelMap = {
    //     break: "Break Quick View",
    // };
    const breakVendor = vendorData?.find((vendor) => {
        return vendor.uuid == data.vendor_id
    })

    return (
        <Card className="w-full sm:w-[405px] font-alexandria p-4 border-[1px] border-[#BBBBBB] rounded-none space-y-4 fixed top-[0px] right-0 z-50 bg-[#EEEEEE] min-h-[100vh] overflow-y-auto flex flex-col justify-between">
            <CardContent className="flex flex-col gap-[12px] p-0">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-[24px] font-[400] text-[#666666] leading-8">
                        Break Quick View
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-x-3 items-start">

                    <div className="text-[24px] font-[400] text-[#666666] font-alexandria">
                        Time-Off
                    </div>
                </div>

                <div className="space-y-2 text-sm">
                    <p className={`hover:underline text-[15px] font-[400] leading-[32px] ${userType}-text`}>
                        <span className="text-[#666666]">Vendor:</span>  {breakVendor?.first_name} {breakVendor?.last_name}
                    </p>
                    <p className="hover:underline text-[15px] font-[400] text-[#666666] leading-[32px]">
                        <span className="text-[#666666]">Time:</span>  {`${dayjs(new Date(data.start)).format('hh:mm A')} - ${dayjs(new Date(data.end)).format('hh:mm A')}`}
                    </p>
                    <div className="flex items-center space-x-[18px]">
                        <MapPin className="w-[24px] text-[#666666]" strokeWidth={1} />
                        <p className={`hover:underline text-[15px] font-[400] leading-[32px] ${userType}-text`}>
                            <span>Vendor:</span>  {breakVendor?.addresses[0]?.address_line_1},   {breakVendor?.addresses[0]?.city},  {breakVendor?.addresses[0]?.country}
                        </p>
                    </div>

                    <div className="flex items-center space-x-[18px]">
                        <Mail className="w-[24px] text-[#666666]" strokeWidth={1} />
                        <span className={`text-[15px] font-[400] leading-[32px] ${userType}-text`}>{breakVendor?.email}</span>
                    </div>
                    <div className="flex items-center space-x-[18px]">
                        <Smartphone className="w-[24px] text-[#666666]" strokeWidth={1} />
                        <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">{breakVendor?.primary_phone}</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-0 mt-10">
                <div className="w-full flex justify-end gap-[10px]">
                    <Button
                        onClick={onClose}
                        className={`${userType}-bg border-[1px] text-[14px] flex justify-center items-center ${userType}-border hover-${userType}-bg text-[#fff] rounded-none w-[132px] h-[32px] hover:text-white`}
                    >
                        Cancel
                    </Button>
                    {/* <Link
                        href={''}
                        // href={`/dashboard/${type === "agent" ? "agents" : "vendors"}/create/${data.uuid}`}
                        className="bg-transparent border-[1px] text-[14px] flex justify-center items-center border-[#4290E9] text-[#4290E9] rounded-none w-[132px] h-[32px] hover:text-white hover:bg-[#4290E9]"
                    >
                        Edit Break
                    </Link> */}
                </div>
            </CardFooter>
        </Card>
    );
}
