"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppContext } from "@/app/context/AppContext";
import { NotificationData } from "./QuickViewCard";
import { Button } from "./ui/button";

type NotificationTableProps = {
  data: NotificationData[];
  onQuickView: (notification: NotificationData) => void;
  onConfirmAction?: () => void;
  loading: boolean;
  error: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  totalNotifications?: number;
};

const NotificationTable: React.FC<NotificationTableProps> = ({
  data,
  onQuickView,
  loading,
  error,
  onLoadMore,
  isLoadingMore,
}) => {
  const { userType } = useAppContext();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  // Smart pagination: Show first 3, ellipsis, last 2
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first 3 pages
      pages.push(1, 2, 3);

      // Show ellipsis if current page is far from start
      if (currentPage > 5) {
        pages.push("ellipsis-start");
      }

      // Show current page and neighbors if not already shown
      if (currentPage > 3 && currentPage < totalPages - 2) {
        if (currentPage > 4) {
          pages.push(currentPage - 1);
        }
        pages.push(currentPage);
        if (currentPage < totalPages - 3) {
          pages.push(currentPage + 1);
        }
      }

      // Show ellipsis if current page is far from end
      if (currentPage < totalPages - 4) {
        pages.push("ellipsis-end");
      }

      // Always show last 2 pages
      pages.push(totalPages - 1, totalPages);
    }

    // Remove duplicates while preserving order
    const seen = new Set<number>();
    return pages.filter((page) => {
      if (typeof page === "string") return true;
      if (seen.has(page)) return false;
      seen.add(page);
      return true;
    });
  };
  // const options = [
  //   { label: "Edit", onClick: () => console.log("Edit clicked") },
  //   { label: "Delete", onClick: () => console.log("Deleted!"), confirm: true },
  // ];

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <Table className="font-alexandria">
          <TableHeader>
            <TableRow
              className="h-[54px] hover:bg-transparent"
              style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
            >
              <TableHead className="text-[14px] font-[700] text-[#666666] w-auto">
                Created By
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#666666] w-auto">
                Type
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#666666] w-[40%]">
                Address
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#666666] w-auto">
                Diffrences
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#666666] w-auto">
                Added
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              // Skeleton Loading State
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow
                  key={index}
                  className="h-[60px] bg-white border-b border-[#E4E4E4]"
                >
                  <TableCell className="pl-[20px]">
                    <Skeleton className="h-4 w-[150px] bg-gray-200" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px] bg-gray-200" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-auto bg-gray-200" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[200px] bg-gray-200" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px] bg-gray-200" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              error ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-red-500"
                  >
                    Failed to load notifications.
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No notifications available.
                  </TableCell>
                </TableRow>
              )
            ) : (
              paginatedData.map((notification, i) => (
                <TableRow
                  key={i}
                  className="!h-[60px] cursor-pointer hover:bg-gray-100 transition-all"
                  onClick={() => onQuickView(notification)}
                >
                  <TableCell
                    className={`text-[15px] font-[400] ${userType}-text pl-[20px]`}
                  >
                    {notification.created_by_name}
                  </TableCell>

                  <TableCell className="text-[15px] font-[400] text-[#7D7D7D]">
                    {(notification.type || notification.Subject)
                      ?.replace(/_/g, " ")
                      ?.replace(/\b\w/g, (char) => char.toUpperCase())}
                  </TableCell>

                  <TableCell className="text-[15px] font-[400] text-[#7D7D7D] w-[30%]">
                    {notification.source === "AgentPayment" ||
                    notification.source === "VendorPayment"
                      ? notification.source === "AgentPayment"
                        ? `${notification.meta_data?.property_address || "N/A"}`
                        : `${notification.source === "VendorPayment" ? `${notification.meta_data?.property_address || "N/A"}` : "Payment"}`
                      : notification?.order?.property_address
                        ? `${notification.order?.property_address} ${notification.order?.property_location}`
                        : "-"}
                  </TableCell>
                  <TableCell className="text-[15px] font-[400] text-[#7D7D7D]">
                    -
                  </TableCell>

                  <TableCell className="text-[15px] font-[400] text-[#7D7D7D] flex justify-between pr-[20px]">
                    {notification.created_at
                      ? new Date(notification.created_at).toLocaleString(
                          "en-US",
                          {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          },
                        )
                      : notification.order?.created_at
                        ? new Date(
                            notification.order.created_at,
                          ).toLocaleString("en-US", {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add pagination UI */}
      {data.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-[#666666]">
            Showing {paginatedData.length} of {data.length} Notifications
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
              {getPageNumbers().map((page) => {
                if (typeof page === "string") {
                  // Render ellipsis
                  return (
                    <span key={page} className="px-2 text-[#666666]">
                      ...
                    </span>
                  );
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[40px] ${
                      currentPage === page
                        ? `${userType}-bg text-white`
                        : "text-[#666666]"
                    }`}
                  >
                    {page}
                  </Button>
                );
              })}
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

      {/* Load More Months Button - Always visible when onLoadMore is provided */}
      {onLoadMore && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="text-sm px-4 py-2 text-[#666666] border border-[#D1D5DB] hover:bg-gray-100"
          >
            {isLoadingMore ? "Loading..." : "Load Next Month Notifications"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotificationTable;
