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
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Pagination } from "./TablePagination";
import { CoAgent } from "@/app/dashboard/sub-accounts/subaccounts";
import { formatPhoneNumber } from "@/lib/utils";

interface CoAgentTableProps {
    coAgentData: CoAgent[];
    loading: boolean;
    error: boolean;
    onUnlink?: (uuid: string) => void;
    onQuickView?: (data: any) => void;
    isSuperAdmin?: boolean;
}

export default function CoAgentTable({
    coAgentData,
    loading,
    error,
    onQuickView,
}: CoAgentTableProps) {
    const { userType } = useAppContext();
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [searchTerm, setSearchTerm] = React.useState("");

    const columns = React.useMemo<ColumnDef<CoAgent>[]>(() => [
        {
            id: "select",
            header: () => <div></div>,
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "name",
            header: "NAME",
            cell: ({ row }) => {
                const item = row.original;
                const fullName = `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Co-Agent";
                return (
                    <div
                        className={`${userType}-text font-medium cursor-pointer hover:underline`}
                        onClick={() => {
                            if (onQuickView) {
                                onQuickView({
                                    ...item,
                                    full_name: fullName,
                                });
                            }
                        }}
                    >
                        {fullName}
                    </div>
                );
            },
        },
        {
            accessorKey: "email",
            header: "EMAIL",
            cell: ({ row }) => {
                const email = row.original.email;
                return <div className="text-[#666666]">{email}</div>;
            },
        },
        {
            accessorKey: "primary_phone",
            header: "PHONE",
            cell: ({ row }) => {
                const phone = row.original.primary_phone;
                return <div className="text-[#666666]">{phone ? formatPhoneNumber(phone) : "—"}</div>;
            },
        },
        {
            accessorKey: "company_name",
            header: "COMPANY / BROKERAGE",
            cell: ({ row }) => {
                const company = row.original.company_name;
                return <div className="text-[#666666]">{company || "—"}</div>;
            },
        },
        {
            id: "actions",
            header: () => <div className="text-right">ACTIONS</div>,
            cell: () => {
                return (
                    <div className="flex justify-end">
                    </div>
                );
            },
        },
    ], [userType, onQuickView]);

    const filteredData = React.useMemo(() => {
        if (!searchTerm.trim()) return coAgentData;
        const lower = searchTerm.toLowerCase();
        return coAgentData.filter(
            (item) =>
                item.first_name?.toLowerCase().includes(lower) ||
                item.last_name?.toLowerCase().includes(lower) ||
                item.email?.toLowerCase().includes(lower) ||
                item.company_name?.toLowerCase().includes(lower) ||
                item.primary_phone?.toLowerCase().includes(lower)
        );
    }, [coAgentData, searchTerm]);

    const table = useReactTable({
        data: filteredData,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    return (
        <div className="w-full">
            <div className="flex items-center justify-between py-4 px-5">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search Co-Agents by name, email, or company..."
                    className="w-[280px] md:w-[360px] h-[38px] px-3 text-[14px] text-[#555] bg-transparent border border-[#CCC] rounded-[6px] outline-none focus:border-[#888]"
                />
            </div>

            <div className="border-t border-[#E5E5E5]">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="border-b border-[#E5E5E5]">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="text-[12px] font-[600] text-[#777777] uppercase py-3.5">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <TableRow key={index} className="border-b border-[#F0F0F0]">
                                    <TableCell className="w-[50px]"><Skeleton className="h-4 w-4" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-28 text-center text-red-500 font-medium">
                                    Failed to load co-agents. Please check your connection and try again.
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="border-b border-[#EBEBEB] hover:bg-black/[0.02] transition-colors"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-3.5 text-[14px]">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32 text-center text-[#888888]">
                                    No co-agents or partners linked yet. Click <strong>+ Add Co-Agent</strong> to invite a partner.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {table.getPageCount() > 1 && (
                <div className="p-4 border-t border-[#E5E5E5]">
                    <Pagination table={table} data={filteredData} />
                </div>
            )}
        </div>
    );
}
