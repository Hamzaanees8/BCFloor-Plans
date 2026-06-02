"use client";

import * as React from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    PaginationState,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "./TablePagination";

interface DataTableProps<TData> {
    data: TData[];
    columns: ColumnDef<TData, unknown>[];
    loading?: boolean;
    error?: boolean;
    dataName?: string;
    userType?: string;
    emptyMessage?: string;
    errorMessage?: string;
    initialPagination?: PaginationState;
    onPaginationChange?: (pagination: PaginationState) => void;
    // White-labeling overrides
    headerBgOverride?: string;
    rowClick?: (data: TData) => void;
    autoResetPageIndex?: boolean;
}

export function DataTable<TData>({
    data,
    columns,
    loading = false,
    error = false,
    dataName = "Items",
    userType = "admin",
    emptyMessage = "No Data Available",
    errorMessage = "Failed to load data.",
    initialPagination = { pageIndex: 0, pageSize: 10 },
    onPaginationChange,
    headerBgOverride,
    rowClick,
    autoResetPageIndex = true,
}: DataTableProps<TData>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [pagination, setPagination] = React.useState<PaginationState>(initialPagination);

    const role = (userType as string) || "admin";

    // Default header background logic using white-label CSS variables
    const headerBg = headerBgOverride || `var(--${role}-page-bg, #E4E4E4)`;

    // Clamp pagination pageIndex if it exceeds the total pages available for the new data
    React.useEffect(() => {
        if (!autoResetPageIndex && data.length > 0) {
            const totalPages = Math.ceil(data.length / pagination.pageSize);
            if (pagination.pageIndex >= totalPages) {
                setPagination((prev) => ({
                    ...prev,
                    pageIndex: Math.max(0, totalPages - 1),
                }));
            }
        }
    }, [data.length, pagination.pageSize, pagination.pageIndex, autoResetPageIndex]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination,
        },
        onPaginationChange: (updater) => {
            const nextPagination = typeof updater === "function" ? updater(pagination) : updater;
            setPagination(nextPagination);
            if (onPaginationChange) onPaginationChange(nextPagination);
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        autoResetPageIndex,
    });

    return (
        <div className="w-full min-w-0 max-w-full">
            <div className="rounded-none border w-full overflow-x-auto custom-scrollbar">
                <Table className="font-alexandria">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent h-[54px]" style={{ backgroundColor: headerBg }}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="text-[14px] font-[700] text-[#7D7D7D] pl-[20px] whitespace-nowrap"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody className="text-[15px] font-normal">
                        {loading ? (
                            // Skeleton Loading State
                            Array.from({ length: initialPagination.pageSize }).map((_, rowIndex) => (
                                <TableRow key={rowIndex} className="h-[54px] bg-white border-b border-[#E4E4E4]">
                                    {columns.map((_, colIndex) => (
                                        <TableCell key={colIndex} className="pl-[20px] whitespace-nowrap">
                                            <Skeleton className="h-4 w-[80%] bg-gray-200" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={`h-[50px] ${rowClick ? "cursor-pointer" : ""}`}
                                    onClick={() => rowClick?.(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="pl-[20px] whitespace-nowrap">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-red-500">
                                    {errorMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Pagination<TData>
                table={table}
                data={data}
                dataName={dataName}
                userType={userType}
            />
        </div>
    );
}
