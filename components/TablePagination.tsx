"use client";

import { Button } from "@/components/ui/button";
import { Table } from "@tanstack/react-table";
import { useState, useEffect } from "react";

interface PaginationProps<TData> {
    // Common props
    data: TData[];
    dataName?: string;
    userType?: string;
    className?: string;
    itemsPerPage?: number;

    // TanStack Table mode
    table?: Table<TData>;

    // Simple pagination mode
    onPageChange?: (page: number, paginatedData: TData[]) => void;
    initialPage?: number;
}

export function Pagination<TData>({
    data,
    dataName = "Items",
    userType = "",
    className = "",
    itemsPerPage = 10,
    table,
    onPageChange,
    initialPage = 1,
}: PaginationProps<TData>) {
    // State for simple pagination
    const [currentPage, setCurrentPage] = useState(initialPage);

    // Calculate values based on mode
    const isTanStackMode = !!table;

    // TanStack values
    const tanStackDisplayCount = table ? table.getRowModel().rows.length : 0;
    const tanStackTotalPages = table ? table.getPageCount() : 0;
    const tanStackCurrentPage = table ? table.getState().pagination.pageIndex + 1 : 1;

    // Simple pagination values
    const simpleTotalPages = Math.ceil(data.length / itemsPerPage);
    const simpleStartIndex = (currentPage - 1) * itemsPerPage;
    const simpleEndIndex = Math.min(simpleStartIndex + itemsPerPage, data.length);
    const simpleDisplayCount = simpleEndIndex - simpleStartIndex;

    // Use appropriate values based on mode
    const displayCount = isTanStackMode ? tanStackDisplayCount : simpleDisplayCount;
    const totalPages = isTanStackMode ? tanStackTotalPages : simpleTotalPages;
    const activePage = isTanStackMode ? tanStackCurrentPage : currentPage;

    // Handle page change for simple pagination
    const handleSimplePageChange = (page: number) => {
        setCurrentPage(page);
        if (onPageChange) {
            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            onPageChange(page, data.slice(start, end));
        }
    };

    // Handle previous page
    const handlePrevious = () => {
        if (isTanStackMode) {
            table.previousPage();
        } else {
            const newPage = Math.max(currentPage - 1, 1);
            handleSimplePageChange(newPage);
        }
    };

    // Handle next page
    const handleNext = () => {
        if (isTanStackMode) {
            table.nextPage();
        } else {
            const newPage = Math.min(currentPage + 1, totalPages);
            handleSimplePageChange(newPage);
        }
    };

    // Handle specific page click
    const handlePageClick = (page: number) => {
        if (isTanStackMode) {
            table.setPageIndex(page - 1);
        } else {
            handleSimplePageChange(page);
        }
    };

    // Check if previous button is disabled
    const isPreviousDisabled = isTanStackMode ? !table.getCanPreviousPage() : activePage === 1;

    // Check if next button is disabled
    const isNextDisabled = isTanStackMode ? !table.getCanNextPage() : activePage === totalPages;

    const getVisiblePages = (current: number, total: number) => {
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }

        if (current <= 4) {
            return [1, 2, 3, 4, 5, '...', total];
        }

        if (current >= total - 3) {
            return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
        }

        return [1, '...', current - 1, current, current + 1, '...', total];
    };

    // Reset to page 1 when data changes (for simple pagination)
    useEffect(() => {
        if (!isTanStackMode && currentPage !== 1) {
            setCurrentPage(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, isTanStackMode]);

    if (data.length === 0) {
        return null;
    }

    return (
        <div className={`flex items-center justify-between px-4 py-3 border-t ${className}`}>
            <div className="text-sm text-[#666666]">
                Showing {displayCount} of {data.length} {dataName}
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={isPreviousDisabled}
                    className="text-[#666666]"
                >
                    Previous
                </Button>
                <div className="flex items-center gap-1">
                    {getVisiblePages(activePage, totalPages).map((page, index) => (
                        page === '...' ? (
                            <span key={`ellipsis-${index}`} className="px-2 text-[#666666]">...</span>
                        ) : (
                            <Button
                                key={page}
                                variant={activePage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageClick(page as number)}
                                className={`min-w-[40px] ${activePage === page
                                    ? `${userType}-bg text-white`
                                    : "text-[#666666]"
                                    }`}
                            >
                                {page}
                            </Button>
                        )
                    ))}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={isNextDisabled}
                    className="text-[#666666]"
                >
                    Next
                </Button>
            </div>
        </div>
    );
}