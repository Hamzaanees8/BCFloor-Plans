import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  MapPin,
  Mail,
  Phone,
  Smartphone,
  X,
  File,
  Calendar,
} from "lucide-react";
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import NotificationDialog from "./NotificationDialog";
import Link from "next/link";
import { Listings } from "@/lib/types";
import { Address, NotificationData } from "@/lib/types";
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
  permissions?: { id: number; name: string }[];
  roles?: { id: number; name: string }[];
  headquarter_address?: string;
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
  company?: { uuid: string; company_name: string };
  status?: boolean;
  address?: string;
  addresses: Address[];
  primary_phone?: string;
  secondary_phone?: string;
  avatar_url?: string;
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
export interface AdminData {
  uuid?: string;
  full_name?: string;
  address?: string;
  email?: string;
  avatar_url?: string;
  primary_phone?: string;
  secondary_phone?: string;
  permissions?: { name: string }[];
  roles?: [{ id: string; name: string | undefined }];
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
  permissions?: { id: number; name: string }[];
  role?: { id: number; name: string };
  agent: {
    uuid: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    company_name: string;
    payment_status: string;
    notes: string;
    status?: boolean;
    permissions?: { id: number; name: string }[];
    roles?: { id: number; name: string }[];
    headquarter_address?: string;
    primary_phone?: string;
    secondary_phone?: string;
    avatar_url?: string;
    activity?: string;
  };
  address?: string;
  activity: string;
  primary_phone?: string;
  secondary_phone?: string;
  avatar_url?: string;
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

export default function QuickViewCard({
  type,
  data,
  onClose,
}: QuickViewCardProps) {
  const { userType } = useAppContext();
  const [showDialog, setShowDialog] = useState(false);

  function formatTimeRange(start: string, end: string): string {
    const startDate = parse(start, "HH:mm:ss", new Date());
    const endDate = parse(end, "HH:mm:ss", new Date());
    return `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`;
  }
  return (
    <>
      <Card
        style={{
          maxHeight: "100vh",
          minHeight: "100vh",
          backgroundColor: `var(--${userType}-page-bg, #EEEEEE)`,
        }}
        className="w-full sm:w-[405px] flex flex-col font-alexandria border-[1px] border-[#BBBBBB] rounded-none fixed top-[0px] right-0 z-[100]"
      >
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#CCCCCC] shrink-0">
          <h2 className="text-[24px] font-[400] text-[#666666] leading-8">
            {typeToLabelMap[type]}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4 flex flex-col justify-between relative">
          <CardContent className="flex flex-col gap-[12px] p-0 shrink-0">
          {userType === "agent" ||
            (type === "listing" && (
              <div className="">
                <div
                  className={`grid grid-cols-[auto_1fr]  gap-x-3 items-start`}
                >
                  <Avatar className="h-8 w-8 row-span-2">
                    <AvatarImage
                      src={
                        data.agent.avatar_url
                          ? data.agent.avatar_url
                          : "https://github.com/shadcn.png"
                      }
                    />
                    <AvatarImage src={"https://github.com/shadcn.png"} />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>

                  <div className="text-[#4290E9] font-[400] text-[15px]">
                    <div
                      className={`text-[24px] font-[400] ${userType}-text font-alexandria`}
                    >
                      {data.agent.first_name} {data.agent.last_name}
                    </div>
                  </div>

                  <div className="text-[15px] font-[400] text-[#666666]">
                    {data.agent.company_name}
                  </div>
                </div>
              </div>
            ))}

          {/* Profile Info */}

          <div
            className={`grid grid-cols-[auto_1fr] ${type === "notification" ? "grid-rows-1" : "grid-rows-2"
              } gap-x-3 items-start`}
          >
            {type === "agent" && (
              <Avatar className="h-8 w-8 row-span-2">
                <AvatarImage
                  src={
                    data.avatar_url
                      ? data.avatar_url
                      : "https://github.com/shadcn.png"
                  }
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            )}
            {type === "subaccount" && (
              <Avatar className="h-8 w-8 row-span-2">
                <AvatarImage
                  src={
                    data.avatar_url
                      ? data.avatar_url
                      : "https://github.com/shadcn.png"
                  }
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            )}
            {type === "vendors" && (
              <Avatar className="h-8 w-8 row-span-2">
                <AvatarImage
                  src={
                    data.avatar_url
                      ? data.avatar_url
                      : "https://github.com/shadcn.png"
                  }
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            )}
            {/* {(type === "listing") && (
                            <Avatar className="h-8 w-8 row-span-2">
                                <AvatarImage src={data.avatar_url ? data.avatar_url : "https://github.com/shadcn.png"} />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                        )} */}
            {type === "admin" && (
              <Avatar className="h-8 w-8 row-span-2">
                <AvatarImage
                  src={
                    data.avatar_url
                      ? data.avatar_url
                      : "https://github.com/shadcn.png"
                  }
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            )}

            <div className="text-[#4290E9] font-[400] text-[15px]">
              {type === "notification" && (
                <div className="text-[24px] font-[400] text-[#666666]">
                  {" "}
                  {data?.type
                    ?.replace(/_/g, " ")
                    ?.replace(/\b\w/g, (char) => char.toUpperCase())}{" "}
                </div>
              )}
              {type === "notification" && (
                <span className="text-[15px] font-[400] text-[#666666] ]  ">
                  {data.source === "AgentPayment" ||
                    data.source === "VendorPayment" ? (
                    <>
                      {data.source === "AgentPayment" ? "Agent: " : "Vendor: "}
                      <span className="text-[#4290E9]">
                        {data.source === "AgentPayment"
                          ? data.meta_data?.agent_name ||
                          data.diff_data?.payment_details?.after
                            ?.agent_name ||
                          "Unknown"
                          : data.meta_data?.vendor_name ||
                          data.diff_data?.payment_details?.after
                            ?.vendor_name ||
                          "Unknown"}
                      </span>
                    </>
                  ) : (
                    <>
                      Contact:{" "}
                      <span className="text-[#4290E9]">
                        {data?.order?.agent?.first_name}{" "}
                        {data?.order?.agent?.last_name}{" "}
                      </span>
                    </>
                  )}
                </span>
              )}
              {type === "admin" && (
                <div className="text-[24px] font-[400] text-[#666666] font-alexandria">
                  {(data as AdminData).full_name}{" "}
                </div>
              )}
              {type === "listing" && (
                <div className="text-[24px] font-[400] text-[#666666] font-alexandria">
                  {(data as Listings).full_name}{" "}
                </div>
              )}
              {type === "agent" && (
                <div className="text-[24px] font-[400] text-[#666666] font-alexandria">
                  {(data as AgentData).first_name}{" "}
                  {(data as AgentData).last_name}
                </div>
              )}
              {type === "subaccount" && (
                <div className={`text-[24px] font-[400] ${userType}-text font-alexandria`}>
                  {(data as SubAccountData).first_name}{" "}
                  {(data as SubAccountData).last_name}
                </div>
              )}
              {type === "vendors" && (
                <div className="text-[24px] font-[400] text-[#666666] font-alexandria">
                  {(data as VendorData).first_name}{" "}
                  {(data as VendorData).last_name}
                </div>
              )}
            </div>

            {/* {(type === "agent" || type === "listing") && (
                            <div className="text-[15px] font-[400] text-[#666666]">{data.company}</div>
                        )} */}
            {type === "agent" && (
              <div className="text-[15px] font-[400] text-[#666666]">
                {data.company_name}
              </div>
            )}
            {type === "vendors" && (
              <div className="text-[15px] font-[400] text-[#666666]">
                {data.company?.company_name}
              </div>
            )}
            {type === "subaccount" && (
              <div>
                <div className="text-[15px] font-[400] text-[#666666]">
                  Agent:{" "}
                  <span className={`${userType}-text font-[400] text-[15px]`}>
                    {data.agent?.first_name} {data.agent?.last_name}
                  </span>
                </div>
                <div className="text-[15px] font-[400] text-[#666666]">
                  Role: {data.role?.name}
                </div>
              </div>
            )}
            {type === "admin" && (
              <div className="text-[15px] font-[400] text-[#666666]">
                {" "}
                {type === "admin" && (data as AdminData).roles?.[0]?.name}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-2 text-sm">
            {type === "notification" && (
              <div className="flex items-center space-x-[18px] ">
                <File className="w-[24px] text-[#666666]" strokeWidth={1} />
                {(() => {
                  const orderUuid =
                    data?.meta_data?.order_uuid ||
                    (data.source === "AgentPayment"
                      ? data.diff_data?.payment_details?.after?.order_uuid
                      : undefined);
                  const orderId =
                    data?.meta_data?.order_id ||
                    (data.source === "AgentPayment" &&
                    data.diff_data?.payment_details?.after?.order_uuid
                      ? "Order UUID"
                      : "N/A");
                  return orderUuid ? (
                    <Link
                      href={`/dashboard/orders/${orderUuid}`}
                      className={`hover:underline text-[15px] font-[400] ${userType}-text leading-[25px] text-[#4290E9]`}
                    >
                      #{orderId}
                    </Link>
                  ) : (
                    <p
                      className={`text-[15px] font-[400] ${userType}-text leading-[25px] text-[#4290E9]`}
                    >
                      #{orderId}
                    </p>
                  );
                })()}
              </div>
            )}
            {type === "vendors" && data.addresses?.length > 0 && (
              <div className="flex items-center space-x-[18px]">
                <MapPin className="w-[24px] text-[#666666]" strokeWidth={1} />
                <p
                  className={`hover:underline text-[15px] font-[400] ${userType}-text leading-[25px]`}
                >
                  {data.addresses[0].address_line_1}
                </p>
              </div>
            )}
            {(type === "admin" ||
              type === "subaccount" ||
              type === "listing" ||
              type === "notification") && (
                <div className="flex items-center space-x-[18px] ">
                  <MapPin
                    className="w-[24px] basis-[7%] text-[#666666]"
                    strokeWidth={1}
                  />
                  {type === "notification" ? (() => {
                    const notifAddress =
                      (data as NotificationData).source === "AgentPayment" ||
                      (data as NotificationData).source === "VendorPayment"
                        ? (data as NotificationData).meta_data?.property_address ||
                          "Payment Transaction"
                        : (data as NotificationData)?.order?.property_address;
                    const mapsUrl = notifAddress && notifAddress !== "Payment Transaction"
                      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(notifAddress)}`
                      : null;
                    return mapsUrl ? (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`hover:underline text-[15px] font-[400] ${userType}-text leading-[25px] cursor-pointer`}
                      >
                        {notifAddress}
                      </a>
                    ) : (
                      <p className={`text-[15px] font-[400] ${userType}-text leading-[25px]`}>
                        {notifAddress}
                      </p>
                    );
                  })() : type === "listing" ? (() => {
                    const listingAddress = [
                      (data as Listings)?.address && (data as Listings)?.suite
                        ? `${(data as Listings).suite} - ${(data as Listings).address}`
                        : (data as Listings)?.address || (data as Listings)?.suite,
                      (data as Listings)?.city,
                      (data as Listings)?.province,
                      (data as Listings)?.postal_code,
                      (data as Listings)?.country,
                    ]
                      .filter(Boolean)
                      .join(", ");
                    const mapsUrl = listingAddress
                      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listingAddress)}`
                      : null;
                    return mapsUrl ? (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`hover:underline text-[15px] font-[400] ${userType}-text leading-[25px] cursor-pointer`}
                      >
                        {listingAddress}
                      </a>
                    ) : (
                      <p className={`text-[15px] font-[400] ${userType}-text leading-[25px]`}>
                        {listingAddress}
                      </p>
                    );
                  })() : (
                  <p
                    className={`hover:underline text-[15px] font-[400] ${userType}-text leading-[25px]`}
                  >
                    {type === "admin" && (data as AdminData).address}
                    {type === "subaccount" && (data as SubAccountData).address}
                    {type === "subaccount" && (data as SubAccountData).address}
                  </p>
                  )}
                </div>
              )}
            {type === "listing" && (
              <div className="mb-5 pb-5">
                <div className="flex items-center space-x-[18px] mt-4 ">
                  <Calendar
                    className="w-[24px] basis-[7%] text-[#666666]"
                    strokeWidth={1}
                  />
                  <div className="text-[15px] font-[400] text-[#8E8E8E]">
                    {data?.created_at
                      ? new Date(data.created_at).toLocaleDateString("en-US", {
                        month: "numeric",
                        day: "numeric",
                        year: "2-digit",
                      })
                      : "N/A"}
                  </div>
                </div>
                <div className="flex flex-col items-start  w-full mt-4 ">
                  <div className="flex items-center gap-5 w-full">
                    <File
                      className="w-[24px] basis-[7%] text-[#666666]"
                      strokeWidth={1}
                    />
                    <div
                      className={`hover:underline text-[15px] font-[400] text-[#8E8E8E] leading-[25px]`}
                    >
                      <span>Order:</span>{" "}
                      {data?.orders?.[0] ? (
                        <Link
                          href={`/dashboard/orders/${data.orders[0].uuid}`}
                          className={`${userType}-text hover:underline text-[#4290E9] ml-1`}
                        >
                          #{data.orders[0].id}
                        </Link>
                      ) : (
                        <span className="ml-1 text-[#8E8E8E]">N/A</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full mt-4">
                    <div className="grid grid-cols-3 gap-x-4 gap-y-[19px] text-[15px] font-[400] text-[#666666]">
                      <div className="flex flex-col items-start gap-[12px]">
                        <span className="text-[10px] text-[#8E8E8E] font-[700]">
                          Payment Status
                        </span>
                      </div>
                      <div className="flex flex-col items-start gap-[12px]">
                        <span className="text-[10px] text-[#8E8E8E] font-[700]">
                          Order Status
                        </span>
                      </div>
                      <div className="flex flex-col items-start gap-[12px]">
                        <span className="text-[10px] text-[#8E8E8E] font-[700]">
                          Tour Status
                        </span>
                      </div>
                      {/* <span className="text-[10px] text-[#8E8E8E] font-[700]">
                    Media Uploaded
                  </span> */}
                    </div>

                    <div className="mt-2">
                      {data?.orders?.[0] ? (
                        <div className="grid grid-cols-3 gap-x-4 gap-y-[19px] text-[10px] font-[400] text-[#666666]">
                          <span
                            className={`text-[10px] ${data.orders[0].payment_status === "PAID" ? "bg-green-500 text-white px-2 rounded-full" : "bg-red-500 text-white px-2 rounded-full"} w-fit`}
                          >
                            {data.orders[0].payment_status || "UNPAID"}
                          </span>

                          <span
                            className={`text-[10px] ${data.orders[0].order_status === "Completed" ? "bg-green-500 text-white px-2 rounded-full" : "bg-red-500 text-white px-2 rounded-full"} w-fit`}
                          >
                            {data.orders[0].order_status || "N/A"}
                          </span>

                          <span
                            className={`text-[10px] ${data.tour_activated === true ? "bg-green-500 text-white px-2 rounded-full" : "bg-red-500 text-white px-2 rounded-full"} w-fit`}
                          >
                            {data.tour_activated === true
                              ? "ACTIVE"
                              : "INACTIVE"}
                          </span>
                        </div>
                      ) : (
                        <p className="text-[#666666] text-[15px] mt-2">
                          No bookings found
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {type === "agent" && (
              <div className="flex items-center space-x-[18px] ">
                <MapPin className="w-[24px] text-[#666666]" strokeWidth={1} />
                <p
                  className={`hover:underline text-[15px] font-[400] ${userType}-text leading-[25px]`}
                >
                  {(data as AgentData).headquarter_address || "N/A"}
                </p>
              </div>
            )}

            {type === "agent" && (
              <div className="grid grid-cols-1 gap-y-[12px]">
                <div className="flex items-center space-x-[18px]">
                  <Mail className="w-[24px] text-[#666666]" strokeWidth={1} />
                  <span
                    className={`text-[15px] font-[400] text-[#4290E9] leading-[32px] ${userType}-text`}
                  >
                    {data.email}
                  </span>
                </div>
                <div className="flex items-center space-x-[18px]">
                  <Smartphone
                    className="w-[24px] text-[#666666]"
                    strokeWidth={1}
                  />
                  <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">
                    {data.primary_phone}
                  </span>
                </div>
                <div className="flex items-center space-x-[18px]">
                  <Phone className="w-[24px] text-[#666666]" strokeWidth={1} />
                  <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">
                    {data.secondary_phone || "N/A"}
                  </span>
                </div>
                {userType !== "agent" && (
                  <>
                    <div className="text-[10px] text-[#8E8E8E] uppercase font-[700]">
                      Notes (Hidden from Agent)
                    </div>
                    <p className="text-[15px] font-[400] text-[#666666]">
                      {data.notes || "No Notes"}
                    </p>
                  </>
                )}
              </div>
            )}
            {type === "listing" && (
              <div>
                <div className="grid grid-cols-3 gap-x-4 gap-y-[19px] text-[15px] font-[400] text-[#666666]">
                  <div className="flex flex-col items-start gap-[12px]">
                    <span className="text-[10px] text-[#8E8E8E] font-[700]">
                      Listing Price
                    </span>{" "}
                    ${data?.listing_price}
                  </div>
                  <div className="flex flex-col items-start gap-[12px]">
                    <span className="text-[10px] text-[#8E8E8E] font-[700]">
                      Bedrooms
                    </span>{" "}
                    {data?.bedrooms}
                  </div>
                  <div className="flex flex-col items-start gap-[12px]">
                    <span className="text-[10px] text-[#8E8E8E] font-[700]">
                      Bathrooms
                    </span>{" "}
                    {data?.bathrooms}
                  </div>
                  <div className="flex flex-col items-start gap-[12px]">
                    <span className="text-[10px] text-[#8E8E8E] font-[700]">
                      Square Footage
                    </span>{" "}
                    {data?.square_footage}
                  </div>
                  <div className="flex flex-col items-start gap-[12px]">
                    <span className="text-[10px] text-[#8E8E8E] font-[700]">
                      Year
                    </span>{" "}
                    {data?.year_constructed}
                  </div>
                  <div className="flex flex-col items-start gap-[12px]">
                    <span className="text-[10px] text-[#8E8E8E] font-[700]">
                      Parking Spots
                    </span>{" "}
                    {data?.parking_spots}
                  </div>
                  <div className="flex flex-col items-start gap-[12px]">
                    <span className="text-[10px] text-[#8E8E8E] font-[700]">
                      Property Type
                    </span>{" "}
                    {data?.property_type}
                  </div>
                  <div className="flex flex-col items-start gap-[12px]">
                    <span className="text-[10px] text-[#8E8E8E] font-[700]">
                      Lot Size
                    </span>{" "}
                    {data?.lot_size}
                  </div>
                  <div className="flex flex-col items-start gap-[12px]">
                    <span className="text-[10px] text-[#8E8E8E] font-[700]">
                      Property Status
                    </span>{" "}
                    {data?.property_status}
                  </div>
                </div>
                <p className="text-[10px] text-[#8E8E8E] font-[700] !mt-[44px]">
                  Statistics
                </p>
                <div className="grid grid-cols-4 gap-x-4 gap-y-1 text-[15px] font-[400] text-[#666666]">
                  <div className="flex flex-col-reverse items-center gap-[12px] text-center h-fit">
                    <span>Photos Viewed</span> {data?.stats?.photos ?? 0}
                  </div>
                  <div className="flex flex-col-reverse items-center gap-[12px] text-center h-fit">
                    <span>Tour Viewed</span> {data?.stats?.tours ?? 0}
                  </div>
                  <div className="flex flex-col-reverse items-center gap-[12px] text-center h-fit">
                    <span>Total Visitors</span> {data?.stats?.visitors ?? 0}
                  </div>
                  <div className="flex flex-col-reverse items-center gap-[12px] text-center h-fit">
                    <span>Visitor Image View</span>{" "}
                    {data?.stats?.imageViews ?? 0}
                  </div>
                </div>
              </div>
            )}
            {(type === "admin" || type === "vendors") && (
              <div className="grid grid-cols-1 gap-y-[12px] ">
                <div className="flex items-center space-x-[18px]">
                  <Mail className="w-[24px] text-[#666666]" strokeWidth={1} />
                  <span
                    className={`text-[15px] font-[400] ${userType}-text leading-[32px]`}
                  >
                    {data.email}
                  </span>
                </div>
                <div className="flex items-center space-x-[18px]">
                  <Smartphone
                    className="w-[24px] text-[#666666]"
                    strokeWidth={1}
                  />
                  <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">
                    {data.primary_phone}
                  </span>
                </div>
                <div className="flex items-center space-x-[18px]">
                  <Phone className="w-[24px] text-[#666666]" strokeWidth={1} />
                  <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">
                    {data.secondary_phone || "n/a"}
                  </span>
                </div>
              </div>
            )}

            {type === "notification" && (
              <>
                {(data as NotificationData).source === "AgentPayment" ||
                  (data as NotificationData).source === "VendorPayment" ? (
                  <div className="grid grid-cols-1 gap-y-[12px]">
                    {/* Header Info */}
                    <div className="flex flex-col gap-[4px] mb-2">
                      <span className="text-[15px] font-[400] text-[#666666]">
                        <span className="font-bold">Payment Type:</span>{" "}
                        {data.source === "AgentPayment"
                          ? "Agent Payment"
                          : "Vendor Payment"}
                      </span>
                      <span className="text-[15px] font-[400] text-[#666666]">
                        <span className="font-bold">Date:</span>{" "}
                        {data.meta_data?.timestamp
                          ? format(
                            new Date(data.meta_data.timestamp),
                            "MMM dd, yyyy h:mm a",
                          )
                          : "N/A"}
                      </span>
                    </div>

                    {/* Property Address Section */}
                    {/* {data.meta_data?.property_address && (
                      <div className="bg-blue-50 p-3 border border-blue-100 rounded-md">
                        <div className="text-[10px] text-[#8E8E8E] uppercase font-[700] mb-2">
                          Property Address
                        </div>
                        <p className="text-[15px] text-[#666666] leading-relaxed">
                          {data.meta_data.property_address}
                        </p>
                      </div>
                    )} */}

                    {/* Payment Details */}
                    {data.diff_data?.payment_details?.after && (
                      <div className="bg-white p-3 border rounded-md space-y-3">
                        <div className="text-[12px] text-[#8E8E8E] uppercase font-[700]">
                          Payment Information
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {data.source === "VendorPayment" && (
                            <>
                              <div className="flex justify-between text-[15px]">
                                <span className="text-[#666666]">Vendor:</span>
                                <span
                                  className={`${userType}-text font-medium`}
                                >
                                  {data.meta_data?.vendor_name || "Unknown"}
                                </span>
                              </div>
                              {data.meta_data?.vendor_email && (
                                <div className="flex justify-between text-[15px]">
                                  <span className="text-[#666666]">Email:</span>
                                  <span className="text-[#666666] text-sm">
                                    {data.meta_data.vendor_email}
                                  </span>
                                </div>
                              )}
                            </>
                          )}

                          {data.source === "AgentPayment" && (
                            <>
                              <div className="flex justify-between text-[15px]">
                                <span className="text-[#666666]">Agent:</span>
                                <span
                                  className={`${userType}-text font-medium`}
                                >
                                  {data.meta_data?.agent_name || "Unknown"}
                                </span>
                              </div>
                              {data.meta_data?.agent_email && (
                                <div className="flex justify-between text-[15px]">
                                  <span className="text-[#666666]">Email:</span>
                                  <span className="text-[#666666] text-sm">
                                    {data.meta_data.agent_email}
                                  </span>
                                </div>
                              )}
                            </>
                          )}

                          {/* Payment Amount */}
                          <div className="flex justify-between text-[15px] pt-2 border-t">
                            <span className="text-[#666666] font-bold">
                              Total Amount:
                            </span>
                            <span
                              className={`${userType}-text font-bold text-lg`}
                            >
                              ${Number(data.meta_data?.amount || 0).toFixed(2)}{" "}
                              {data.meta_data?.currency || "USD"}
                            </span>
                          </div>

                          {/* Payment Method */}
                          <div className="flex justify-between text-[15px]">
                            <span className="text-[#666666]">Method:</span>
                            <span className="text-[#666666]">
                              {data.meta_data?.payment_method || "N/A"}
                            </span>
                          </div>

                          {/* Payment Status */}
                          <div className="flex justify-between text-[15px]">
                            <span className="text-[#666666]">Status:</span>
                            <span
                              className={`font-medium ${data.diff_data.payment_details.after.status ===
                                "Payment Transferred" ||
                                data.diff_data.payment_details.after.status ===
                                "Payment Received"
                                ? "text-green-600"
                                : "text-yellow-600"
                                }`}
                            >
                              {data.diff_data.payment_details.after.status}
                            </span>
                          </div>

                          {/* Transfer/Receipt Info */}
                          {/* {data.source === "VendorPayment" &&
                            data.meta_data?.transfer_id && (
                              <div className="flex justify-between text-[15px]">
                                <span className="text-[#666666]">
                                  Transfer ID:
                                </span>
                                <span className="text-[#666666] font-mono text-xs">
                                  {data.meta_data.transfer_id}
                                </span>
                              </div>
                            )}

                          {data.source === "AgentPayment" &&
                            data.diff_data.payment_details.after
                              .receipt_url && (
                              <div className="flex justify-between text-[15px]">
                                <span className="text-[#666666]">Receipt:</span>
                                <a
                                  href={
                                    data.diff_data.payment_details.after
                                      .receipt_url
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#4290E9] hover:underline text-sm"
                                >
                                  View Stripe Receipt
                                </a>
                              </div>
                            )} */}
                        </div>
                      </div>
                    )}

                    {/* Services Section */}
                    {data.meta_data?.services &&
                      data.meta_data.services.length > 0 && (
                        <div className="bg-white p-3 border rounded-md">
                          <div className="text-[12px] text-[#8E8E8E] uppercase font-[700] mb-3">
                            Services ({data.meta_data.services.length})
                          </div>
                          <div className="space-y-2">
                            {data.meta_data.services.map((service) => (
                              <div
                                key={service.uuid}
                                className="flex justify-between items-start text-[15px] pb-2 border-b last:border-b-0"
                              >
                                <div className="flex-1">
                                  <p className={`${userType}-text font-medium`}>
                                    {service.service_name} {"  "}
                                    <span className="text-[12px] text-[#999999]">
                                      (ID: {service.service_id})
                                    </span>
                                  </p>
                                </div>
                                <span className="text-[#666666] font-medium ml-2">
                                  ${Number(service.amount).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Order Info Section */}
                    {/* {(data.meta_data?.order_id ||
                      data.meta_data?.order_uuid) && (
                      <div className="bg-white p-3 border rounded-md">
                        <div className="text-[12px] text-[#8E8E8E] uppercase font-[700] mb-2">
                          Order Information
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[15px]">
                            <span className="text-[#666666]">Order ID:</span>
                            <span className={`${userType}-text font-medium`}>
                              #{data.meta_data.order_id}
                            </span>
                          </div>
                          {data.meta_data?.order_uuid && (
                            <div className="flex justify-between text-[15px]">
                              <span className="text-[#666666]">
                                Order UUID:
                              </span>
                              <span className="text-[#666666] font-mono text-xs">
                                {data.meta_data.order_uuid}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )} */}

                    {/* Description */}
                    {(data.description || data.Subject) && (
                      <div className="bg-white p-3 border rounded-md">
                        <div className="text-[10px] text-[#8E8E8E] uppercase font-[700] mb-2">
                          Note
                        </div>
                        <p className="text-[15px] text-[#666666]">
                          {data.description || data.Subject}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (data as NotificationData).source === "Order" ? (
                  <div className="grid grid-cols-1 gap-y-[12px]">
                    <div className="flex flex-col gap-[4px] mb-2">
                      <span className="text-[15px] font-[400] text-[#666666]">
                        <span className="font-bold">Updated by:</span>{" "}
                        {data.meta_data?.updated_by || data.created_by_name}
                      </span>
                      <span className="text-[15px] font-[400] text-[#666666]">
                        <span className="font-bold">Date:</span>{" "}
                        {data.updated_at
                          ? format(
                            new Date(data.updated_at),
                            "MMM dd, yyyy h:mm a",
                          )
                          : "N/A"}
                      </span>
                    </div>

                    <div className="bg-white p-3 border rounded-md mb-2">
                      <div className="text-[12px] text-[#8E8E8E] uppercase font-[700] mb-2">
                        Agent Details
                      </div>
                      <div className="grid grid-cols-1 gap-y-1">
                        {data.order?.agent?.company_name && (
                          <div className="text-[15px] font-[400] text-[#666666]">
                            <span className="font-bold">Company:</span>{" "}
                            {data.order.agent.company_name}
                          </div>
                        )}
                        <div className="flex items-center space-x-[12px]">
                          <Mail className="w-[18px] text-[#666666]" strokeWidth={1} />
                          <span className={`text-[15px] font-[400] ${userType}-text`}>
                            {data.order?.agent?.email || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-[12px]">
                          <Smartphone className="w-[18px] text-[#666666]" strokeWidth={1} />
                          <span className="text-[15px] font-[400] text-[#666666]">
                            {data.order?.agent?.primary_phone || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {data.order?.created_at && (
                      <div className="bg-white p-3 border rounded-md mb-2">
                        <div className="text-[15px] font-[400] text-[#666666]">
                          <span className="font-bold">Order Created:</span>{" "}
                          {format(new Date(data.order.created_at), "MMM dd, yyyy h:mm a")}
                        </div>
                      </div>
                    )}

                    {data.diff_data?.amount && (
                      <div className="bg-white p-3 border rounded-md">
                        <div className="text-[12px] text-[#8E8E8E] uppercase font-[700] mb-1">
                          Amount Changed
                        </div>
                        <div className="flex items-center gap-2 text-[15px]">
                          <span className="text-[#666666] line-through">
                            ${Number(data.diff_data.amount.before).toFixed(2)}
                          </span>
                          <span>→</span>
                          <span className={`${userType}-text font-medium`}>
                            ${Number(data.diff_data.amount.after).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {(data.meta_data?.changes_summary || data.Subject) && (
                      <div className="mb-4">
                        <div className="text-[10px] text-[#8E8E8E] uppercase font-[700] mb-1">
                          Description
                        </div>
                        <p className="text-[15px] text-[#666666]">
                          {Array.isArray(data.meta_data?.changes_summary)
                            ? data.meta_data.changes_summary.join(", ")
                            : data.Subject}
                        </p>
                      </div>
                    )}

                    {data.order?.services && data.order.services.length > 0 && (
                      <div className="bg-white p-3 border rounded-md">
                        <div className="text-[12px] text-[#8E8E8E] uppercase font-[700] mb-3">
                          Services & Slots
                        </div>
                        <div className="space-y-4">
                          {data.order.services.map((service, idx) => {
                            const currentserviceSlot = data.order?.slots?.find(
                              (slot) => slot.service_id == service.service_id,
                            );
                            return (
                              <div key={idx} className="border-b last:border-b-0 pb-3 last:pb-0">
                                <div className="text-[15px] font-[500] text-[#666666] flex justify-between">
                                  <span>{service.service?.name}</span>
                                  <span>${Number(service.amount).toFixed(2)}</span>
                                </div>
                                {service.option?.title && (
                                  <div className="text-[13px] text-[#8E8E8E] mb-1">
                                    Option: {service.option.title}
                                  </div>
                                )}
                                {currentserviceSlot ? (
                                  <div className="text-[14px] text-[#666666] mt-2 pl-2 border-l-2 border-[#E4E4E4]">
                                    <div>
                                      <span className="font-medium">Vendor:</span> {currentserviceSlot.vendor?.first_name} {currentserviceSlot.vendor?.last_name}
                                    </div>
                                    <div>
                                      <span className="font-medium">Date:</span> {currentserviceSlot.date}
                                    </div>
                                    <div>
                                      <span className="font-medium">Time:</span>{" "}
                                      {formatTimeRange(
                                        currentserviceSlot.start_time ?? "",
                                        currentserviceSlot.end_time ?? "",
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[13px] text-[#8E8E8E] italic mt-1 pl-2">
                                    No slot scheduled yet.
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-y-[12px]">
                    <div className="flex items-center space-x-[18px]">
                      <Mail
                        className="w-[24px] text-[#666666]"
                        strokeWidth={1}
                      />
                      <span
                        className={`text-[15px] font-[400] ${userType}-text leading-[32px]`}
                      >
                        {data?.order?.agent?.email}
                      </span>
                    </div>
                    <div className="flex items-center space-x-[18px]">
                      <Smartphone
                        className="w-[24px] text-[#666666]"
                        strokeWidth={1}
                      />
                      <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">
                        {data?.order?.agent?.primary_phone}
                      </span>
                    </div>
                    <div className="flex items-center space-x-[18px]">
                      <Phone
                        className="w-[24px] text-[#666666]"
                        strokeWidth={1}
                      />
                      <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">
                        {data?.order?.agent?.secondary_phone}
                      </span>
                    </div>
                    {data?.order?.services?.map((service, idx) => {
                      const currentserviceSlot = data?.order.slots.find(
                        (slot) => slot.service_id == service.service_id,
                      );

                      return (
                        <div key={idx}>
                          <div className="text-[10px] text-[#8E8E8E] uppercase font-[700]">
                            {service.service.name}
                          </div>
                          <p className="text-[15px] font-[400] text-[#666666]">
                            Vender:{" "}
                            <span className={`${userType}-text`}>
                              {currentserviceSlot?.vendor.first_name}{" "}
                              {currentserviceSlot?.vendor.last_name}
                            </span>
                          </p>
                          <p className="grid grid-cols-[auto_1fr] gap-x-2 text-[15px] font-[400] text-[#6666666]">
                            Appointment:{" "}
                            <span>
                              {currentserviceSlot?.date}
                              <br />
                              {formatTimeRange(
                                currentserviceSlot?.start_time ?? "",
                                currentserviceSlot?.end_time ?? "",
                              )}
                            </span>
                          </p>
                          <p className="text-[15px] font-[400] text-[#666666]">
                            Price: <span>${service.amount}</span>
                          </p>
                        </div>
                      );
                    })}
                    <div className="text-[10px] text-[#8E8E8E] uppercase font-[700]">
                      Total
                    </div>
                    <p className="text-[15px] font-[400] text-[#666666]">
                      Price:{" "}
                      <span className={`${userType}-text`}>
                        $
                        {data?.order?.services
                          ?.reduce(
                            (total: number, service: any) =>
                              total + Number(service.amount || 0),
                            0,
                          )
                          .toFixed(2)}
                      </span>
                    </p>
                  </div>
                )}
              </>
            )}
            {type === "subaccount" && (
              <div className="grid grid-cols-1 gap-y-[12px]">
                <div className="flex items-center space-x-[18px]">
                  <Mail className="w-[24px] text-[#666666]" strokeWidth={1} />
                  <span
                    className={`text-[15px] font-[400] ${userType}-text leading-[32px]`}
                  >
                    {data.primary_email}
                  </span>
                </div>
                <div className="flex items-center space-x-[18px]">
                  <Smartphone
                    className="w-[24px] text-[#666666]"
                    strokeWidth={1}
                  />
                  <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">
                    {data.primary_phone}
                  </span>
                </div>
                <div className="flex items-center space-x-[18px]">
                  <Phone className="w-[24px] text-[#666666]" strokeWidth={1} />
                  <span className="text-[15px] font-[400] text-[#666666] leading-[32px]">
                    {data.secondary_phone || "N/A"}
                  </span>
                </div>
                {/* <div className="text-[10px] text-[#8E8E8E] uppercase font-[700]">
                                Notes (Hidden from Agent)
                            </div>
                            <p className="text-[15px] font-[400] text-[#666666]">{data.notes || "No Notes"}</p> */}
              </div>
            )}

            {(type === "agent" || type === "listing") && (
              <div>
                <div className="text-[10px] text-[#8E8E8E] uppercase font-[700]">
                  Recent Activity
                </div>
                <p className="text-[15px] mt-[12px] font-[400] text-[#666666]">
                  {data.activity || "No records"}
                </p>
              </div>
            )}

            {type === "admin" && (
              <div>
                <div className="text-[10px] text-[#8E8E8E] uppercase font-[700]">
                  Access
                </div>
                <p className="text-[15px] font-[400] text-[#666666]">
                  {(() => {
                    const roles = (data as AdminData).roles || [];
                    const perms = (data as AdminData).permissions || [];
                    const names = perms.map(p => (p as any).name);
                    
                    const superAdmin = roles.find(r => 
                        r.name?.toLowerCase().includes("super") || 
                        String((r as any).id) === "1"
                    );
                    
                    const bookingAgent = roles.find(r => 
                        r.name?.toLowerCase().includes("book") || 
                        r.name?.toLowerCase().includes("agent") ||
                        String((r as any).id) === "3" || 
                        String((r as any).id) === "4"
                    );

                    let roleTitle = "Admin";
                    let sep = " - ";

                    if (superAdmin) {
                        roleTitle = "Super Admin";
                    } else if (bookingAgent) {
                        roleTitle = bookingAgent.name || "Booking Agent";
                        sep = " = ";
                    } else if (roles.length > 0) {
                        roleTitle = roles[0]?.name || "Admin";
                    }

                    return (roleTitle === "Super Admin") 
                        ? "Super Admin" 
                        : `${roleTitle}${sep}${names.join(", ")}`;
                  })()}
                </p>
              </div>
            )}
          </div>
          {/* Actions */}
        </CardContent>
        <CardFooter className="p-0 !mt-[40px]">
          {userType !== "vendor" && (
            <div className=" w-full flex justify-end gap-[10px] mr-[15px]">
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
                  href={`/dashboard/sub-accounts/create?agentId=${data.agent?.uuid}&subAccountId=${data.uuid}`}
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
          )}
          {type === "listing" &&
            Array.isArray((data as Listings)?.orders) &&
            (data?.orders?.length ?? 0) > 0 && (
              <Link
                href={`/dashboard/file-manager/${(data as Listings)?.orders?.[0]?.uuid ?? ""}?listingId=${data.uuid}`}
                className={`bg-transparent ${userType}-border flex justify-center items-center ${userType}-text rounded-none w-[132px] h-[32px] ${userType}-button hover-${userType}-bg`}
              >
                Media
              </Link>
            )}
        </CardFooter>
        </div>
      </Card>
      <NotificationDialog
        open={showDialog}
        setOpen={setShowDialog}
        onConfirm={() => {
          setShowDialog(false);
        }}
        showAgain={false}
        toggleShowAgain={() => { }}
      />
    </>
  );
}
