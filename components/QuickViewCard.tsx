import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MapPin, Mail, Phone, Smartphone, X, File } from "lucide-react";
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import NotificationDialog from "./NotificationDialog";
import Link from "next/link";
import { Listings } from "@/app/dashboard/listings/page";
import { Address } from "./VendorTable";
import { useAppContext } from "@/app/context/AppContext";
import { format, parse } from "date-fns";

export interface AgentData {
    uuid?: string;
    first_name: string;
    company_name: string;
    last_name: string;
    payment_status: string;
    email: string;
    created_at: string;
    notes: string;
    status?: boolean;
    permissions?: { id: number, name: string }[]
    roles?: { id: number, name: string }[],
    headquarter_address?: string
    primary_phone?: string;
    secondary_phone?: string;
    avatar_url?: string;
    activity?: string;
}

export interface VendorData {
    uuid?: string;
    full_name: string;
    first_name: string;
    company_name: string;
    last_name: string;
    email: string;
    company?: { uuid: string, company_name: string }
    status?: boolean;
    address?: string;
    addresses: Address[];
    primary_phone?: string;
    secondary_phone?: string;
    avatar_url?: string;
}
export interface AdminData {
    uuid?: string,
    full_name?: string;
    address?: string;
    email?: string;
    avatar_url?: string;
    primary_phone?: string;
    secondary_phone?: string;
    permissions?: { name: string }[];
    roles?: [{ id: string, name: string | undefined }];
    created_at: string;
    status?: boolean;
}
export interface SubAccountData {
    uuid?: string;
    primary_email: string;
    first_name?: string;
    last_name: string;
    full_name: string;
    email: string;
    created_at: string;
    notes: string;
    status?: boolean;
    permissions?: { id: number, name: string }[]
    role?: { id: number, name: string },
    agent: { uuid: string, first_name: string, last_name: string, email: string, created_at: string, company_name: string, payment_status: string, notes: string, status?: boolean, permissions?: { id: number, name: string }[], roles?: { id: number, name: string }[], headquarter_address?: string, primary_phone?: string, secondary_phone?: string, avatar_url?: string, activity?: string },
    address?: string
    activity: string;
    primary_phone?: string;
    secondary_phone?: string;
    avatar_url?: string;
}
export interface NotificationData {
    type: string
    created_by_name: string
    Subject: string
    created_at: string
    order_details: {
        id: string | number;
        created_at: string
        agent: {
            first_name: string;
            last_name: string;
            email: string;
            primary_phone: string;
            secondary_phone: string;
        };
        property_address: string;
        services: Array<{
            service_id: string | number;
            service: {
                name: string;
            };
            amount: string | number;
        }>;
        slots: Array<{
            service_id: string | number;
            vendor: {
                first_name: string;
                last_name: string;
            };
            date: string;
            start_time: string;
            end_time: string;
        }>;
    };
}
const typeToLabelMap: Record<QuickViewCardProps["type"], string> = {
    agent: "Agent Quick View",
    admin: "Admin Quick View",
    vendors: "Vendor Quick View",
    listing: "Listing Quick View",
    notification: "Notification Quick View",
    subaccount: "Sub Account Quick View",
};
type QuickViewCardProps =
    | { type: "admin"; data: AdminData; onClose?: () => void }
    | { type: "agent"; data: AgentData; onClose?: () => void }
    | { type: "vendors"; data: VendorData; onClose?: () => void }
    | { type: "listing"; data: Listings; onClose?: () => void }
    | { type: "subaccount"; data: SubAccountData; onClose?: () => void }
    | { type: "notification"; data: NotificationData; onClose?: () => void };

export default function QuickViewCard({ type, data, onClose }: QuickViewCardProps) {
    const { userType } = useAppContext();
    //const isAgent = type === "agent";
    const [showDialog, setShowDialog] = useState(false);
    console.log('notification data', data);
    console.log('type', type)
    // const activityData = [
    //     { sqft: "1200", min: "30", cost: "$150" },
    //     { sqft: "900", min: "45", cost: "$200" },
    //     { sqft: "1500", min: "60", cost: "$300" }
    // ];
    function formatTimeRange(start: string, end: string): string {
        const startDate = parse(start, "HH:mm:ss", new Date());
        const endDate = parse(end, "HH:mm:ss", new Date());
        return `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`;
    }
    return (
        <>
            <Card style={{ minHeight: 'calc(100vh - 80px)' }} className="w-full sm:w-[405px]  flex flex-col justify-between  font-alexandria p-4 border-[1px] border-[#BBBBBB] rounded-none space-y-4 absolute top-[80px] right-0 z-50 bg-[#EEEEEE]">
                <CardContent className="flex flex-col gap-[12px] p-0">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-[24px] font-[400] text-[#666666] leading-8">
                            {typeToLabelMap[type]}
                        </h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    {userType === 'agent' && type === 'listing' && (
                        <div className="">
                            <div className={`grid grid-cols-[auto_1fr]  gap-x-3 items-start`}>


                                <Avatar className="h-8 w-8 row-span-2">
                                    <AvatarImage src={data.agent.avatar_url ? data.agent.avatar_url : "https://github.com/shadcn.png"} />
                                    <AvatarImage src={"https://github.com/shadcn.png"} />
                                    <AvatarFallback>CN</AvatarFallback>
                                </Avatar>


                                <div className="text-[#4290E9] font-[400] text-[15px]">

                                    <div className={`text-[24px] font-[400] ${userType}-text font-alexandria`}>{data.agent.first_name} {data.agent.last_name}</div>

                                </div>


                                <div className="text-[15px] font-[400] text-[#666666]">{data.agent.company_name}</div>


                            </div>
                        </div>
                    )}




                    {/* Profile Info */}

                    <div className={`grid grid-cols-[auto_1fr] ${type === "notification" ? "grid-rows-1" : "grid-rows-2"} gap-x-3 items-start`}>

                        {(type === "agent") && (
                            <Avatar className="h-8 w-8 row-span-2">
                                <AvatarImage src={data.avatar_url ? data.avatar_url : "https://github.com/shadcn.png"} />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                        )}
                        {(type === "subaccount") && (
                            <Avatar className="h-8 w-8 row-span-2">
                                <AvatarImage src={data.avatar_url ? data.avatar_url : "https://github.com/shadcn.png"} />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                        )}
                        {(type === "vendors") && (
                            <Avatar className="h-8 w-8 row-span-2">
                                <AvatarImage src={data.avatar_url ? data.avatar_url : "https://github.com/shadcn.png"} />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                        )}
                        {/* {(type === "listing") && (
                            <Avatar className="h-8 w-8 row-span-2">
                                <AvatarImage src={data.avatar_url ? data.avatar_url : "https://github.com/shadcn.png"} />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                        )} */}
                        {(type === "admin") && (
                            <Avatar className="h-8 w-8 row-span-2">
                                <AvatarImage src={data.avatar_url ? data.avatar_url : "https://github.com/shadcn.png"} />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                        )}

                        <div className="text-[#4290E9] font-[400] text-[15px]">
                            {(type === "notification") && (
                                <div className="text-[24px] font-[400] text-[#666666]"> {(data?.type)?.replace(/_/g, ' ')?.replace(/\b\w/g, char => char.toUpperCase())} </div>
                            )}
                            {(type === "notification") && (
                                <span className="text-[15px] font-[400] text-[#666666] ]  ">Contact: <span className="text-[#4290E9]">{data?.order_details?.agent?.first_name} {data?.order_details?.agent?.last_name} </span></span>
                            )}
                            {type === "admin" && (
                                <div className="text-[24px] font-[400] text-[#666666] font-alexandria">{(data as AdminData).full_name} </div>
                            )}
                            {type === "listing" && (
                                <div className="text-[24px] font-[400] text-[#666666] font-alexandria">{(data as Listings).full_name} </div>
                            )}
                            {type === "agent" && (
                                <div className="text-[24px] font-[400] text-[#666666] font-alexandria">{(data as AgentData).first_name} {(data as AgentData).last_name}</div>
                            )}
                            {type === "subaccount" && (
                                <div className="text-[24px] font-[400] ${userType}-text font-alexandria">{(data as SubAccountData).first_name} {(data as SubAccountData).last_name}</div>
                            )}
                            {type === "vendors" && (
                                <div className="text-[24px] font-[400] text-[#666666] font-alexandria">{(data as VendorData).first_name} {(data as VendorData).last_name}</div>
                            )}

                        </div>

                        {/* {(type === "agent" || type === "listing") && (
                            <div className="text-[15px] font-[400] text-[#666666]">{data.company}</div>
                        )} */}
                        {(type === "agent") && (
                            <div className="text-[15px] font-[400] text-[#666666]">{data.company_name}</div>
                        )}
                        {(type === "vendors") && (
                            <div className="text-[15px] font-[400] text-[#666666]">{data.company?.company_name}</div>
                        )}
                        {(type === "subaccount") && (
                            <div>
                                <div className="text-[15px] font-[400] text-[#666666]">Agent: <span className={`${userType}-text font-[400] text-[15px]`}>{data.agent?.first_name} {data.agent?.last_name}</span></div>
                                <div className="text-[15px] font-[400] text-[#666666]">Role: {data.role?.name}</div>
                            </div>
                        )}
                        {type === "admin" && (
                            <div className="text-[15px] font-[400] text-[#666666]"> {type === "admin" && (data as AdminData).roles?.[0]?.name}</div>
                        )}

                    </div>


                    {/* Details Section */}
                    <div className="space-y-2 text-sm">
                        {(type === "notification") && (
                            <div className="flex items-center space-x-[18px] ">
                                <File className="w-[24px] text-[#666666]" strokeWidth={1} />
                                <p className={`hover:underline text-[15px] font-[400] ${userType}-text leading-[25px] text-[#4290E9]`}>#{data?.order_details?.id}</p>
                            </div>
                        )}
                        {type === "vendors" && data.addresses?.length > 0 && (
                            <div className="flex items-center space-x-[18px]">
                                <MapPin className="w-[24px] text-[#666666]" strokeWidth={1} />
                                <p className={`hover:underline text-[15px] font-[400] ${userType}-text leading-[25px]`}>
                                    {data.addresses[0].address_line_1}
                                </p>
                            </div>
                        )}
                        {(type === "admin" || type === "subaccount" || type === "listing" || type === "notification") && (
                            <div className="flex items-center space-x-[18px] ">
                                <MapPin className="w-[24px] basis-[7%] text-[#666666]" strokeWidth={1} />
                                <p className={`hover:underline text-[15px] font-[400] ${userType}-text leading-[25px]`}>
                                    {type === "admin" && (data as AdminData).address}
                                    {type === "subaccount" && (data as SubAccountData).address}
                                    {type === "listing" && (data as Listings).address}
                                    {type === "notification" && (data as NotificationData)?.order_details?.property_address}
                                    {type === "subaccount" && (data as SubAccountData).address}
                                </p>
                            </div>
                        )}
                        {type === "agent" && (
                            <div className="flex items-center space-x-[18px] ">
                                <MapPin className="w-[24px] text-[#666666]" strokeWidth={1} />
                                <p className={`hover:underline text-[15px] font-[400] ${userType}-text leading-[25px]`}>
                                    {(data as AgentData).headquarter_address || "N/A"}
                                </p>
                            </div>
                        )}

                        {type === "agent" && (
                            <div className="grid grid-cols-1 gap-y-[12px]">
                                <div className="flex items-center space-x-[18px]">
                                    <Mail className="w-[24px] text-[#666666]" strokeWidth={1} />
                                    <span className={`text-[15px] font-[400] text-[#4290E9] leading-[32px] ${userType}-text`}>{data.email}</span>
                                </div>
                                <div className="flex items-center space-x-[18px]">
                                    <Smartphone className="w-[24px] text-[#666666]" strokeWidth={1} />
                                    <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">{data.primary_phone}</span>
                                </div>
                                <div className="flex items-center space-x-[18px]">
                                    <Phone className="w-[24px] text-[#666666]" strokeWidth={1} />
                                    <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">{data.secondary_phone || "N/A"}</span>
                                </div>
                                <div className="text-[10px] text-[#8E8E8E] uppercase font-[700]">
                                    Notes (Hidden from Agent)
                                </div>
                                <p className="text-[15px] font-[400] text-[#666666]">{data.notes || "No Notes"}</p>
                            </div>
                        )}
                        {type === "listing" && (
                            <div>
                                <div className="grid grid-cols-3 gap-x-4 gap-y-[19px] text-[15px] font-[400] text-[#666666]">
                                    <div className="flex flex-col items-start gap-[12px]"><span className="text-[10px] text-[#8E8E8E] font-[700]">Listing Price</span> ${data?.listing_price}</div>
                                    <div className="flex flex-col items-start gap-[12px]"><span className="text-[10px] text-[#8E8E8E] font-[700]">Bedrooms</span> {data?.bedrooms}</div>
                                    <div className="flex flex-col items-start gap-[12px]"><span className="text-[10px] text-[#8E8E8E] font-[700]">Bathrooms</span> {data?.bathrooms}</div>
                                    <div className="flex flex-col items-start gap-[12px]"><span className="text-[10px] text-[#8E8E8E] font-[700]">Square Footage</span> {data?.square_footage}</div>
                                    <div className="flex flex-col items-start gap-[12px]"><span className="text-[10px] text-[#8E8E8E] font-[700]">Year</span> {data?.year_constructed}</div>
                                    <div className="flex flex-col items-start gap-[12px]"><span className="text-[10px] text-[#8E8E8E] font-[700]">Parking Spots</span> {data?.parking_spots}</div>
                                    <div className="flex flex-col items-start gap-[12px]"><span className="text-[10px] text-[#8E8E8E] font-[700]">Property Type</span> {data?.property_type}</div>
                                    <div className="flex flex-col items-start gap-[12px]"><span className="text-[10px] text-[#8E8E8E] font-[700]">Lot Size</span> {data?.lot_size}</div>
                                    <div className="flex flex-col items-start gap-[12px]"><span className="text-[10px] text-[#8E8E8E] font-[700]">Property Status</span> {data?.property_status}</div>
                                </div>

                                <p className="text-[10px] text-[#8E8E8E] font-[700] !mt-[44px]">Statistics</p>
                                <div className="grid grid-cols-4 gap-x-4 gap-y-1 text-[15px] font-[400] text-[#666666]">
                                    <div className="flex flex-col-reverse items-center gap-[12px] text-center h-fit"><span>Photos Viewed</span> {data?.stats?.photos ?? 0}</div>
                                    <div className="flex flex-col-reverse items-center gap-[12px] text-center h-fit"><span>Tour Viewed</span> {data?.stats?.tours ?? 0}</div>
                                    <div className="flex flex-col-reverse items-center gap-[12px] text-center h-fit"><span>Total Visitors</span> {data?.stats?.visitors ?? 0}</div>
                                    <div className="flex flex-col-reverse items-center gap-[12px] text-center h-fit"><span>Visitor Image View</span> {data?.stats?.imageViews ?? 0}</div>
                                </div>
                            </div>
                        )}
                        {(type === "admin" || type === "vendors") && (
                            <div className="grid grid-cols-1 gap-y-[12px] ">
                                <div className="flex items-center space-x-[18px]">
                                    <Mail className="w-[24px] text-[#666666]" strokeWidth={1} />
                                    <span className={`text-[15px] font-[400] ${userType}-text leading-[32px]`}>{data.email}</span>
                                </div>
                                <div className="flex items-center space-x-[18px]">
                                    <Smartphone className="w-[24px] text-[#666666]" strokeWidth={1} />
                                    <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">{data.primary_phone}</span>
                                </div>
                                <div className="flex items-center space-x-[18px]">
                                    <Phone className="w-[24px] text-[#666666]" strokeWidth={1} />
                                    <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">{data.secondary_phone || 'n/a'}</span>
                                </div>

                            </div>
                        )}
                        {type === "notification" && (
                            <div className="grid grid-cols-1 gap-y-[12px]">
                                <div className="flex items-center space-x-[18px]">
                                    <Mail className="w-[24px] text-[#666666]" strokeWidth={1} />
                                    <span className={`text-[15px] font-[400] ${userType}-text leading-[32px]`}>{data?.order_details?.agent?.email}</span>
                                </div>
                                <div className="flex items-center space-x-[18px]">
                                    <Smartphone className="w-[24px] text-[#666666]" strokeWidth={1} />
                                    <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">{data?.order_details?.agent?.primary_phone}</span>
                                </div>
                                <div className="flex items-center space-x-[18px]">
                                    <Phone className="w-[24px] text-[#666666]" strokeWidth={1} />
                                    <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">{data?.order_details?.agent?.secondary_phone}</span>
                                </div>
                                {data?.order_details?.services?.map((service, idx) => {
                                    const currentserviceSlot = data?.order_details.slots.find((slot) => slot.service_id == service.service_id)
                                    console.log('currentserviceSlot', currentserviceSlot);

                                    return <div key={idx}>
                                        <div className="text-[10px] text-[#8E8E8E] uppercase font-[700]">
                                            {service.service.name}
                                        </div>
                                        <p className="text-[15px] font-[400] text-[#666666]">Vender: <span className={`${userType}-text`}>{currentserviceSlot?.vendor.first_name} {currentserviceSlot?.vendor.last_name}</span></p>
                                        <p className="grid grid-cols-[auto_1fr] gap-x-2 text-[15px] font-[400] text-[#666666]">Appointment: <span>{currentserviceSlot?.date}<br />{formatTimeRange(currentserviceSlot?.start_time ?? '', currentserviceSlot?.end_time ?? "")}</span></p>
                                        <p className="text-[15px] font-[400] text-[#666666]">Price: <span >${service.amount}</span></p>
                                    </div>
                                })}
                                <div className="text-[10px] text-[#8E8E8E] uppercase font-[700]">
                                    Total
                                </div>
                                <p className="text-[15px] font-[400] text-[#666666]">
                                    Price:{" "}
                                    <span className={`${userType}-text`}>
                                        $
                                        {data?.order_details?.services
                                            ?.reduce(
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                (total: number, service: any) =>
                                                    total + Number(service.amount || 0),
                                                0
                                            )
                                            .toFixed(2)}
                                    </span>
                                </p>
                            </div>
                        )}

                    </div>
                    {type === "subaccount" && (
                        <div className="grid grid-cols-1 gap-y-[12px]">
                            <div className="flex items-center space-x-[18px]">
                                <Mail className="w-[24px] text-[#666666]" strokeWidth={1} />
                                <span className={`text-[15px] font-[400] ${userType}-text leading-[32px]`}>{data.primary_email}</span>
                            </div>
                            <div className="flex items-center space-x-[18px]">
                                <Smartphone className="w-[24px] text-[#666666]" strokeWidth={1} />
                                <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">{data.primary_phone}</span>
                            </div>
                            <div className="flex items-center space-x-[18px]">
                                <Phone className="w-[24px] text-[#666666]" strokeWidth={1} />
                                <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">{data.secondary_phone || "N/A"}</span>
                            </div>
                            {/* <div className="text-[10px] text-[#8E8E8E] uppercase font-[700]">
                                Notes (Hidden from Agent)
                            </div>
                            <p className="text-[15px] font-[400] text-[#666666]">{data.notes || "No Notes"}</p> */}
                        </div>
                    )}

                    {(type === "agent" || type === "listing") && (
                        <div>
                            <div className="text-[10px] text-[#8E8E8E] uppercase font-[700]">Recent Activity
                            </div>
                            <p className="text-[15px] mt-[12px] font-[400] text-[#666666]">{data.activity || "No records"}</p>
                        </div>

                    )}
                    {/* {type === "vendors" && (
                        <div>
                            <div className="text-[10px] text-[#8E8E8E] uppercase font-[700]">Recent Activity
                            </div>
                            <table className="mt-[12px] w-full text-[#666666]">
                                <thead>
                                    <tr className="bg-[#E4E4E4] text-[14px] font-[700]">
                                        <th className="py-2 px-4 text-left">SQ.FT</th>
                                        <th className="py-2 px-4 text-left">MIN.</th>
                                        <th className="py-2 px-4 text-left">COST</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[15px] bg-[#F2F2F2] font-[400]">
                                    {activityData.map((item, index) => (
                                        <tr key={index} className="border-b border-[#cccccc]">
                                            <td className="py-2 px-4">{item.sqft}</td>
                                            <td className="py-2 px-4">{item.min}</td>
                                            <td className="py-2 px-4">{item.cost}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    )} */}
                    {type === "admin" && (
                        <div>
                            <div className="text-[10px] text-[#8E8E8E] uppercase font-[700]">Access
                            </div>
                            <p className="text-[15px] font-[400] text-[#666666]">
                                {
                                    data.permissions?.length === 7
                                        ? 'FULL'
                                        : data.permissions?.map((perm, index) => (
                                            <span key={index}>{perm.name}{index !== (data.permissions?.length ?? 0) - 1 && ', '}</span>
                                        ))
                                }
                            </p>
                        </div>
                    )}
                    {/* Actions */}

                </CardContent>
                {userType !== 'vendor' &&
                    <CardFooter className="p-0 !mt-[40px]">
                        <div className=" w-full flex justify-start gap-[10px] ">
                            {type === "agent" && (
                                <Link
                                    href={`/dashboard/agents/create/${data.uuid}`}
                                    className={`bg-transparent ${userType}-border flex justify-center items-center ${userType}-text rounded-none w-[132px] h-[32px] ${userType}-button hover-${userType}-bg`}
                                >
                                    Edit
                                </Link>
                            )}
                            {type === "subaccount" && (
                                <Link
                                    href={`/dashboard/sub-accounts/create/${data.uuid}`}
                                    className={`bg-transparent ${userType}-border flex justify-center items-center ${userType}-text rounded-none w-[132px] h-[32px] ${userType}-button hover-${userType}-bg`}
                                >
                                    Edit
                                </Link>
                            )}
                            {type === "admin" && (
                                <Link
                                    href={`/dashboard/admin/create/${data.uuid}`}
                                    className={`bg-transparent ${userType}-border flex justify-center items-center ${userType}-text rounded-none w-[132px] h-[32px] ${userType}-button hover-${userType}-bg`}
                                >
                                    Edit
                                </Link>
                            )}
                            {type === "listing" && (
                                <Link
                                    href={`/dashboard/listings/create/${data.uuid}`}
                                    className={`bg-transparent ${userType}-border flex justify-center items-center ${userType}-text rounded-none w-[132px] h-[32px] ${userType}-button hover-${userType}-bg`}
                                >
                                    Edit
                                </Link>
                            )}
                            {type === "vendors" && (
                                <Link
                                    href={`/dashboard/vendors/create/${data.uuid}`}
                                    className={`bg-transparent ${userType}-border flex justify-center items-center ${userType}-text rounded-none w-[132px] h-[32px] ${userType}-button hover-${userType}-bg`}
                                >
                                    Edit
                                </Link>
                            )}
                            {/* <Button
                            className="bg-[#4290E9] rounded-none text-white w-[132px] h-[32px] hover:bg-[#4290E9]"
                            onClick={() => setShowDialog(true)}
                            >
                            History
                            </Button> */}
                        </div>
                    </CardFooter>
                }
            </Card >
            <NotificationDialog
                open={showDialog}
                setOpen={setShowDialog}
                onConfirm={() => {
                    console.log("Confirmed");
                    setShowDialog(false);
                }}
                showAgain={false}
                toggleShowAgain={() => { }}
            />
        </>
    );
}
