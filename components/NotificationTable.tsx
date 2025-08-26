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
// import { Switch } from "@/components/ui/switch";
import DropdownActions from "@/components/DropdownActions";

type notifications = {
    createdby: string;
    Subject: string;
    Address: string;
    added: string;
};

type ListingsTableProps = {
  data: notifications[];
  onQuickView: (type: "agent" ) => void;
  onConfirmAction?: () => void;
};

const ListingsTable: React.FC<ListingsTableProps> = ({
  data,
  onQuickView,
}) => {
  const options = [
    { label: "Edit", onClick: () => console.log("Edit clicked") },
    {
      label: "Quick View",
      onClick: () => onQuickView("agent"),
    },
    {
      label: "Delete",
      onClick: () => console.log("Deleted!"),
      confirm: true,
    },
  ];

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="overflow-x-auto">
       
          <Table className='font-alexandria px-0 overflow-x-auto whitespace-nowrap'>
            <TableHeader >
                <TableRow className='bg-[#E4E4E4] font-alexandria h-[54px] hover:bg-[#E4E4E4]'>
                    <TableHead className="text-[14px] font-[700] text-[#666666]">Created By</TableHead>
                    <TableHead className="text-[14px] font-[700] text-[#666666]">Subject</TableHead>
                    <TableHead className="text-[14px] font-[700] text-[#666666]">Address</TableHead>
                    <TableHead className="text-[14px] font-[700] text-[#666666] ">Added</TableHead>
                    <TableHead className="text-[14px] font-[700] text-[#666666]"></TableHead>
                </TableRow>
            </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>No listings available.</TableCell>
              </TableRow>
            ) : (
              data.map((notifications, i) => (
                <TableRow key={i}>
                  <TableCell
                    onClick={() => onQuickView("agent")}
                    className="text-[15px] font-[400] text-[#4290E9] pl-[20px] cursor-pointer hover:underline"
                  >
                    {notifications.createdby}
                  </TableCell>
                  <TableCell className="text-[15px] font-[400] text-[#7D7D7D]">
                    {notifications.Subject}
                  </TableCell>
                  <TableCell
                    className="text-[15px] font-[400] text-[#7D7D7D] cursor-pointer "
                  >
                    {notifications.Address}
                  </TableCell>
                  <TableCell className="text-[15px] font-[400] text-[#7D7D7D]">
                    {notifications.added}
                  </TableCell>
                  <TableCell className="text-[15px] font-[400] text-[#7D7D7D] flex justify-between items-center gap-2 pr-[20px]">
                    
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

export default ListingsTable;
