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
import { Skeleton } from "@/components/ui/skeleton";
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
import { Button } from "@/components/ui/button"; // Add this import
import Link from "next/link";

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

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
  }, [matterports, filter, addressFilter]); // ✅ FIX

  // Calculate paginated data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

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
        className="w-full h-[80px] font-alexandria z-10 relative flex justify-between px-[20px] items-center"
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
        <Table className="font-alexandria px-0 overflow-x-auto whitespace-nowrap">
          <TableHeader>
            <TableRow
              className="h-[54px] hover:bg-[#E4E4E4]"
              style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
            >
              <TableHead className="text-[14px] font-[700] text-[#666666] pl-[20px]">
                AGENT NAME
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#666666]">
                ORDER NUMBER
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#666666]">
                ADDRESS
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#666666]">
                REMINDER DATE
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#666666]">
                RENEWAL DATE
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#666666] text-center">
                STATUS
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#666666] text-center">
                ACTION
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              // Skeleton Loading State
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="h-[60px] bg-white border-b border-[#E4E4E4]">
                  <TableCell className="pl-[20px]"><Skeleton className="h-4 w-[120px] bg-gray-200" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px] bg-gray-200" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px] bg-gray-200" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px] bg-gray-200" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px] bg-gray-200" /></TableCell>
                  <TableCell className="text-center px-[20px]"><Skeleton className="h-5 w-[80px] bg-gray-200 rounded-full mx-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-[20px] bg-gray-200 rounded-full mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, index) => (
                <TableRow key={index} className="!h-[60px]">
                  <TableCell className="text-[15px] py-[10px] font-[400] text-[#666666]  pl-[20px]">
                    {item.agentName}
                  </TableCell>
                  <TableCell className="text-[15px] py-[10px] font-[400] text-[#4290E9]">
                    <Link href={`orders/${item.orderuud}`}>
                      {item.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[15px] py-[10px] font-[400] text-[#4290E9]">
                    <Link href={`listings/create/${item.propertyuuid}`}>
                      {item.address}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[15px] py-[10px] font-[400] text-[#666666]">
                    {item.reminderDate}
                  </TableCell>
                  <TableCell className="text-[15px] py-[10px] font-[400] text-[#666666]">
                    {item.renewalDate}
                  </TableCell>

                  <TableCell className="text-center text-[10px] py-[10px] font-[400] text-[#666666]">
                    {item.status && (
                      <label
                        className={`px-[7px] py-[1.5px] text-white rounded-[10px] leading-[100%] ${item.status === "ACTIVE"
                          ? "!bg-[#6BAE41]"
                          : "bg-[#DC9600]"
                          }
                             `}
                      >
                        {item.status}
                      </label>
                    )}
                  </TableCell>

                  <TableCell className="text-center text-[10px] py-[10px] font-[400] text-[#666666] ">
                    <label
                      className={`px-[7px] py-[1.5px] text-white rounded-[10px] leading-[100%] `}
                    ></label>
                    <DropdownActions options={options} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add pagination UI */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-[#666666]">
            Showing {paginatedData.length} of {filteredData.length} Matterports
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="text-[#666666]"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[40px] ${currentPage === page
                      ? `${userType}-bg text-white`
                      : "text-[#666666]"
                      }`}
                  >
                    {page}
                  </Button>
                )
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="text-[#666666]"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatterportPage;
