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
};

const NotificationTable: React.FC<NotificationTableProps> = ({
    data,
    onQuickView,
    loading,
    error,
}) => {
    const { userType } = useAppContext();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);
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
                                <TableRow key={index} className="h-[60px] bg-white border-b border-[#E4E4E4]">
                                    <TableCell className="pl-[20px]"><Skeleton className="h-4 w-[150px] bg-gray-200" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[100px] bg-gray-200" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-auto bg-gray-200" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[200px] bg-gray-200" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[120px] bg-gray-200" /></TableCell>
                                </TableRow>
                            ))
                        ) : paginatedData.length === 0 ? (
                            error ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-red-500">
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
                                        {(notification.type || notification.Subject)?.replace(/_/g, ' ')?.replace(/\b\w/g, char => char.toUpperCase())}
                                    </TableCell>

                                    <TableCell className="text-[15px] font-[400] text-[#7D7D7D] w-[30%]">
                                        {notification?.order?.property_address ? `${notification.order?.property_address} ${notification.order?.property_location}` : "-"}
                                    </TableCell>
                                    <TableCell className="text-[15px] font-[400] text-[#7D7D7D]">
                                        -
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
                                            : notification.order?.created_at
                                                ? new Date(notification.order.created_at).toLocaleString("en-US", {
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

export default NotificationTable;