import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Mail, MapPin, Smartphone, X } from "lucide-react";
import React from "react";
import { CalanderVendor } from "./BigCalendar";
import { Button } from "@/components/ui/button";
import dayjs from 'dayjs';
import { useAppContext } from "@/app/context/AppContext";
import Link from "next/link";

type CalendarEvent = {
    uuid?: string
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    vendor_id?: string
    color_id?: number
    address?: string
};

type QuickViewCardProps = {
    data: CalendarEvent
    onClose?: () => void
    vendorData: CalanderVendor[],
    breakAction?: () => void
    handleDelete?: () => void
}

export default function BreakQuickViewCard({ data, onClose, vendorData, breakAction, handleDelete }: QuickViewCardProps) {
    const { userType } = useAppContext();
    const breakVendor = vendorData?.find((vendor) => {
        return vendor.uuid == data.vendor_id
    })

    const currentTimeOff = breakVendor?.additional_breaks?.find((brk) => {
        return brk.uuid == data.uuid
    })

    // Check if this is an external event (Google Calendar event)
    const isExternalEvent = !data.vendor_id && data.title.toLowerCase() === 'external event';

    return (
        <Card
            className="w-full sm:w-[405px] font-alexandria p-4 border-[1px] border-[#BBBBBB] rounded-none space-y-4 fixed top-[0px] right-0 z-50 h-[100dvh] overflow-y-auto flex flex-col justify-between"
            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
        >
            <CardContent className="flex flex-col gap-[12px] p-0">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-[24px] font-[400] text-[#666666] leading-8">
                        {isExternalEvent ? "External Event" : currentTimeOff ? "Time-Off Details" : "Break Details"}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isExternalEvent ? (
                    // External Event UI
                    <>
                        <div className="grid grid-cols-[auto_1fr] gap-x-3 items-start">
                            <div className="text-[15px] font-[400] text-[#666666] font-alexandria">
                                <span>Title: </span>
                                <span>External Event</span>
                            </div>
                        </div>

                        <div className="text-[13px] font-[400] text-[#999999] italic">
                            Google Calendar Event
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex flex-col space-y-1">
                                <div className="text-[15px] font-[400] text-[#666666]">
                                    <span>Start Time:</span>
                                    <span className="ml-2">{dayjs(new Date(data.start)).format('MMM DD, YYYY hh:mm A')}</span>
                                </div>
                                <div className="text-[15px] font-[400] text-[#666666]">
                                    <span>End Time:</span>
                                    <span className="ml-2">{dayjs(new Date(data.end)).format('MMM DD, YYYY hh:mm A')}</span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    // Regular Break/Time-Off UI
                    <>
                        <div className="grid grid-cols-[auto_1fr] gap-x-3 items-start">
                            <div className="text-[15px] font-[400] text-[#666666] font-alexandria">
                                <span>Title: </span>
                                <span>{data.title}</span>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm">
                            <Link href={`/dashboard/vendors/create/${breakVendor?.uuid}`} className={`hover:underline text-[15px] font-[400] leading-[32px] ${userType}-text`}>
                                <span className="text-[#666666]">Vendor:</span>  {breakVendor?.first_name} {breakVendor?.last_name}
                            </Link>

                            {currentTimeOff ? (
                                <>
                                    <div className="flex flex-col space-y-1">
                                        <div className="text-[15px] font-[400] text-[#666666]">
                                            <span>Start Date:</span>
                                            <span className="ml-2">{dayjs(new Date(data.start)).format('MMM DD, YYYY hh:mm A')}</span>
                                        </div>
                                        <div className="text-[15px] font-[400] text-[#666666]">
                                            <span>End Date:</span>
                                            <span className="ml-2">{dayjs(new Date(data.end)).format('MMM DD, YYYY hh:mm A')}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-[15px] font-[400] text-[#666666] leading-[32px]">
                                    <span className="text-[#666666]">Time:</span>
                                    <span className="ml-2">{dayjs(new Date(data.start)).format('hh:mm A')} - {dayjs(new Date(data.end)).format('hh:mm A')}</span>
                                </p>
                            )}

                            {data.address &&
                                <div className="flex items-center space-x-[18px]">
                                    <MapPin className="w-[24px] text-[#666666]" strokeWidth={1} />
                                    <p className={`hover:underline text-[15px] font-[400] leading-[32px] ${userType}-text truncate max-w-[300px]`}>
                                        <span>Address:</span> {data.address}
                                    </p>
                                </div>
                            }

                            <div className="flex items-center space-x-[18px]">
                                <Mail className="w-[24px] text-[#666666]" strokeWidth={1} />
                                <span className={`text-[15px] font-[400] leading-[32px] ${userType}-text`}>{breakVendor?.email}</span>
                            </div>
                            <div className="flex items-center space-x-[18px]">
                                <Smartphone className="w-[24px] text-[#666666]" strokeWidth={1} />
                                <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">{breakVendor?.primary_phone}</span>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>

            <CardFooter className="p-0 mt-10 pb-16 sm:pb-4">
                <div className="w-full flex flex-wrap justify-end gap-[10px]">
                    <Button
                        onClick={onClose}
                        className={`${userType}-bg border-[1px] text-[14px] flex-1 sm:flex-none justify-center items-center ${userType}-border hover-${userType}-bg text-[#fff] rounded-none sm:w-[132px] h-[32px] hover:text-white`}
                    >
                        Close
                    </Button>
                    {!isExternalEvent && data.uuid && (userType === 'admin' || userType === 'vendor') &&
                        <Button
                            onClick={breakAction}
                            className={`bg-transparent border-[1px] text-[14px] flex-1 sm:flex-none justify-center items-center ${userType}-border rounded-none sm:w-[132px] h-[32px] hover:text-white hover-${userType}-bg ${userType}-text ${userType}-button`}
                        >
                            Edit
                        </Button>
                    }
                    {!isExternalEvent && data.uuid && (userType === 'admin' || userType === 'vendor') &&
                        <Button
                            onClick={handleDelete}
                            className={`bg-transparent border-[1px] text-[14px] flex-1 sm:flex-none justify-center items-center ${userType}-border rounded-none sm:w-[132px] h-[32px] hover:text-white hover-${userType}-bg ${userType}-text ${userType}-button`}
                        >
                            Delete
                        </Button>
                    }
                </div>
            </CardFooter>
        </Card >
    );
}