"use client";

import React, { useState, useRef, useEffect } from "react";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";


interface DraggableServiceTableProps<TData extends { uuid: string }> {
    data: TData[];
    columns: ColumnDef<TData, unknown>[];
    loading?: boolean;
    error?: boolean;
    dataName?: string;
    userType?: string;
    emptyMessage?: string;
    errorMessage?: string;
    headerBgOverride?: string;
}

export function DraggableServiceTable<TData extends { uuid: string }>({
    data,
    columns,
    loading = false,
    error = false,
    dataName = "Items",
    userType = "admin",
    emptyMessage = "No Data Available",
    errorMessage = "Failed to load data.",
    headerBgOverride,
}: DraggableServiceTableProps<TData>) {
    const [rows, setRows] = useState<TData[]>(data);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const dragRowIndex = useRef<number | null>(null);

    // Sync rows when data prop changes (e.g. after fetch)
    useEffect(() => {
        setRows(data);
    }, [data]);

    const isVendor = userType === "vendor";
    const role = userType || "admin";
    const headerBg = headerBgOverride || `var(--${role}-page-bg, #E4E4E4)`;

    // Drag handle column — only shown to non-vendor users
    const dragHandleColumn: ColumnDef<TData, unknown> = {
        id: "__drag_handle__",
        header: "",
        cell: () => (
            <div
                className="flex items-center justify-center w-[24px] h-[24px] text-gray-400 cursor-grab active:cursor-grabbing select-none"
                title="Drag to reorder"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle cx="5.5" cy="3" r="1.25" />
                    <circle cx="10.5" cy="3" r="1.25" />
                    <circle cx="5.5" cy="8" r="1.25" />
                    <circle cx="10.5" cy="8" r="1.25" />
                    <circle cx="5.5" cy="13" r="1.25" />
                    <circle cx="10.5" cy="13" r="1.25" />
                </svg>
            </div>
        ),
    };

    const allColumns = isVendor ? columns : [dragHandleColumn, ...columns];

    const table = useReactTable({
        data: rows,
        columns: allColumns,
        getCoreRowModel: getCoreRowModel(),
    });

    const handleDragStart = (index: number) => {
        dragRowIndex.current = index;
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (dropIndex: number) => {
        const fromIndex = dragRowIndex.current;
        if (fromIndex === null || fromIndex === dropIndex) {
            setDragOverIndex(null);
            dragRowIndex.current = null;
            return;
        }

        const newRows = [...rows];
        const [moved] = newRows.splice(fromIndex, 1);
        newRows.splice(dropIndex, 0, moved);
        setRows(newRows);
        setDragOverIndex(null);
        dragRowIndex.current = null;
    };

    const handleDragEnd = () => {
        setDragOverIndex(null);
        dragRowIndex.current = null;
    };

    return (
        <div className="w-full">
            <div className="rounded-none border">
                <Table className="font-alexandria">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow
                                key={headerGroup.id}
                                className="hover:bg-transparent h-[54px]"
                                style={{ backgroundColor: headerBg }}
                            >
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="text-[14px] font-[700] text-[#7D7D7D] pl-[20px]"
                                        style={header.id === "__drag_handle__" ? { width: "44px", paddingLeft: "12px" } : {}}
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
                            Array.from({ length: 5 }).map((_, rowIndex) => (
                                <TableRow key={rowIndex} className="h-[54px] bg-white border-b border-[#E4E4E4]">
                                    {allColumns.map((_, colIndex) => (
                                        <TableCell key={colIndex} className="pl-[20px]">
                                            <Skeleton className="h-4 w-[80%] bg-gray-200" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row, index) => (
                                <TableRow
                                    key={row.id}
                                    draggable={!isVendor}
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDrop={() => handleDrop(index)}
                                    onDragEnd={handleDragEnd}
                                    className={`h-[50px] transition-all ${!isVendor ? "cursor-default" : ""}`}
                                    style={
                                        dragOverIndex === index && dragRowIndex.current !== index
                                            ? { borderTop: "2px solid #4290E9", background: "rgba(66,144,233,0.05)" }
                                            : {}
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className="pl-[20px]"
                                            style={cell.column.id === "__drag_handle__" ? { paddingLeft: "12px" } : {}}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={allColumns.length} className="h-24 text-center text-red-500">
                                    {errorMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            <TableRow>
                                <TableCell colSpan={allColumns.length} className="h-24 text-center">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Intentionally no pagination — sort order is applied across all rows */}
            <div className="flex items-center justify-start px-[20px] py-[14px] text-[13px] text-[#7D7D7D]">
                {!loading && rows.length > 0 && (
                    <span>
                        {rows.length} {dataName}
                    </span>
                )}
            </div>
        </div>
    );
}
