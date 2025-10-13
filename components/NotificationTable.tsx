"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DropdownActions from "@/components/DropdownActions";
import { useAppContext } from "@/app/context/AppContext";
import { NotificationData } from "./QuickViewCard";


type NotificationTableProps = {
  data: NotificationData[];
  onQuickView: (notification: NotificationData) => void;
  onConfirmAction?: () => void;
};

const NotificationTable: React.FC<NotificationTableProps> = ({
  data,
  onQuickView,
}) => {
  const { userType } = useAppContext();

  const options = [
    { label: "Edit", onClick: () => console.log("Edit clicked") },
    { label: "Delete", onClick: () => console.log("Deleted!"), confirm: true },
  ];

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="font-alexandria px-0 overflow-x-auto whitespace-nowrap">
          <TableHeader>
            <TableRow className="bg-[#E4E4E4] font-alexandria h-[54px] hover:bg-[#E4E4E4]">
              <TableHead className="text-[14px] font-[700] text-[#666666] w-auto">
                Created By
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#666666] w-auto">
                Subject
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#666666] w-[40%]">
                Address
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#666666] w-auto">
                Added
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>No notifications available.</TableCell>
              </TableRow>
            ) : (
              data?.map((notification, i) => (
                <TableRow
                  key={i}
                  className="cursor-pointer hover:bg-gray-100 transition-all"
                  onClick={() => onQuickView(notification)}
                >
                  <TableCell
                    className={`text-[15px] font-[400] ${userType}-text pl-[20px]`}
                  >
                    {notification.created_by_name}
                  </TableCell>

                  <TableCell className="text-[15px] font-[400] text-[#7D7D7D]">
                    {notification.type || notification.Subject}
                  </TableCell>

                  <TableCell className="text-[15px] font-[400] text-[#7D7D7D] w-[50%]">
                    {notification.order_details?.property_address}
                  </TableCell>

                  <TableCell className="text-[15px] font-[400] text-[#7D7D7D] flex justify-between pr-[20px]">
                    {notification.created_at
                      ? new Date(notification.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                      : notification.order_details?.created_at
                        ? new Date(notification.order_details.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                        : null}
                    <DropdownActions options={options} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default NotificationTable;
