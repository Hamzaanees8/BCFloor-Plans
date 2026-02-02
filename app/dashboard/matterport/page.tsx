"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GetMatterPort,
  mapMatterportApiToAd,
  MatterportAd,
} from "./matterport";
import { useAppContext } from "@/app/context/AppContext";
import DropdownActions from "@/components/DropdownActions";
import Link from "next/link";
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from "@tanstack/react-table";

const options = [
  { label: "Activate" },
  { label: "Deactivate" },
  { label: "Delete", confirm1: true },
];

const MatterportPage = () => {
  const [matterports, setMatterports] = useState<MatterportAd[]>([]);
  const [filter, setFilter] = useState("Show All");
  const [addressFilter, setAddressFilter] = useState<string>("");
  const { userType } = useAppContext();
  const [loading, setLoading] = useState<boolean>(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    let ancestor = header.parentElement;
    while (ancestor) {
      const style = window.getComputedStyle(ancestor);
      if (style.overflowX === 'hidden' || ancestor.classList.contains('overflow-x-hidden')) {
        ancestor.style.setProperty('overflow-x', 'visible', 'important');
        ancestor.style.setProperty('overflow-y', 'visible', 'important');

        const target = ancestor;
        return () => {
          target.style.removeProperty('overflow-x');
          target.style.removeProperty('overflow-y');
        };
      }
      ancestor = ancestor.parentElement;
    }
  }, []);

  /*
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  */

  const filteredData = useMemo(() => {
    let result = matterports;

    if (filter !== "Show All") {
      if (filter === "ACTIVE") {
        result = result.filter((item) => item.status === "ACTIVE");
      } else if (filter === "RENEWAL NEEDED") {
        result = result.filter((item) => item.renewal === "RENEW");
      } else {
        result = result.filter((item) => item.status === filter);
      }
    }

    if (addressFilter.trim()) {
      const searchLower = addressFilter.toLowerCase();
      result = result.filter(
        (item) =>
          item.agentName.toLowerCase().includes(searchLower) ||
          item.address.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [matterports, filter, addressFilter]);

  const columns: ColumnDef<MatterportAd>[] = [
    {
      accessorKey: "agentName",
      header: "AGENT NAME",
      cell: ({ row }) => <div className="text-[15px] font-[400] text-[#666666]">{row.original.agentName}</div>
    },
    {
      accessorKey: "orderNumber",
      header: "ORDER NUMBER",
      cell: ({ row }) => (
        <div className="text-[15px] font-[400] text-[#4290E9]">
          <Link href={`orders/${row.original.orderuud}`}>
            {row.original.orderNumber}
          </Link>
        </div>
      )
    },
    {
      accessorKey: "address",
      header: "ADDRESS",
      cell: ({ row }) => (
        <div className="text-[15px] font-[400] text-[#4290E9]">
          <Link href={`listings/create/${row.original.propertyuuid}`}>
            {row.original.address}
          </Link>
        </div>
      )
    },
    {
      accessorKey: "reminderDate",
      header: "REMINDER DATE",
      cell: ({ row }) => <div className="text-[15px] font-[400] text-[#666666]">{row.original.reminderDate}</div>
    },
    {
      accessorKey: "renewalDate",
      header: "RENEWAL DATE",
      cell: ({ row }) => <div className="text-[15px] font-[400] text-[#666666]">{row.original.renewalDate}</div>
    },
    {
      accessorKey: "status",
      header: "STATUS",
      cell: ({ row }) => {
        const status = row.original.status;
        return status ? (
          <div className="text-center">
            <span
              className={`px-[7px] py-[1.5px] text-white rounded-[10px] text-[10px] leading-[100%] ${status === "ACTIVE" ? "!bg-[#6BAE41]" : "bg-[#DC9600]"}`}
            >
              {status}
            </span>
          </div>
        ) : null;
      }
    },
    {
      id: "actions",
      header: () => <div className="text-center">ACTION</div>,
      cell: () => (
        <div className="flex justify-center">
          <DropdownActions options={options} />
        </div>
      )
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token") || "";

      try {
        const response = await GetMatterPort(token);
        console.log("Raw Matterport API response:", response);
        // ✅ IMPORTANT: normalize response shape
        const apiData = Array.isArray(response)
          ? response
          : response?.data ?? [];

        // ✅ MAP API → UI MODEL
        const mapped: MatterportAd[] = apiData.map(mapMatterportApiToAd);

        setMatterports(mapped);

        console.log("Mapped Matterport data:", mapped);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Error fetching Matterport data:", error);
      }
    };

    fetchData();
  }, []);

  //   const getStatusColor = (status: string) => {
  //     switch (status) {
  //       case "ACTIVE":
  //         return "!bg-[#6BAE41]";
  //       case "INACTIVE":
  //         return "!bg-[#A3A3A3]";
  //       default:
  //         return "";
  //     }
  //   };

  return (
    <div>
      <div
        ref={headerRef}
        className="w-full h-[80px] font-alexandria sticky top-0 z-50 flex justify-between px-[20px] items-center"
        style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`, boxShadow: "0px 4px 4px #0000001F" }}
      >
        <p className={`text-[16px] md:text-[24px] font-[400] ${userType}-text`}>
          Matterport ({filteredData.length})
        </p>

        <div className="flex gap-2 items-center">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search address..."
              value={addressFilter}
              onChange={(e) => setAddressFilter(e.target.value)}
              className="w-full px-3 h-[42px] py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 focus:ring-blue-500"
              style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
            />
          </div>
          <Select
            onValueChange={(value) => setFilter(value)}
            defaultValue="Show All"
          >
            <SelectTrigger
              className={`w-[174px] h-[42px] text-[#666666] border-[1px] border-[#BBBBBB] ${userType === "admin"
                ? "[&>svg]:text-[#4290E9]"
                : userType === "agent"
                  ? "[&>svg]:text-[#6BAE41]"
                  : "[&>svg]:text-[#4290E9]"
                } [&>svg]:opacity-100`}
              style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
            >
              <SelectValue placeholder="Show All" />
            </SelectTrigger>

            <SelectContent
              className="rounded-none w-full py-[12px] text-[#666666]"
              style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
            >
              <SelectItem
                value="Show All"
                className="p-0 px-[16px] mb-[9px] hover:!bg-transparent focus:!bg-transparent cursor-pointer"
              >
                Show All
              </SelectItem>
              <SelectItem
                value="ACTIVE"
                className="p-0 px-[16px] mb-[9px] hover:!bg-transparent focus:!bg-transparent cursor-pointer"
              >
                Active
              </SelectItem>
              <SelectItem
                value="INACTIVE"
                className="p-0 px-[16px] mb-[9px] hover:!bg-transparent focus:!bg-transparent cursor-pointer"
              >
                Inactive
              </SelectItem>
              <SelectItem
                value="RENEWAL NEEDED"
                className="p-0 px-[16px] hover:!bg-transparent focus:!bg-transparent cursor-pointer"
              >
                Renewal Needed
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full relative">
        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          dataName="Matterports"
          userType={userType}
        />
      </div>
    </div>
  );
};

export default MatterportPage;
