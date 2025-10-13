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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import DropdownActions from "../../../../components/DropdownActions";
import { AgentData } from "@/app/dashboard/agents/page";
import { VendorData } from "@/components/QuickViewCard";
import { Order, Slot } from "../page";
import { useRouter } from "next/navigation";
import { useOrderContext } from "../context/OrderContext";
import { useAppContext } from "@/app/context/AppContext";

interface OrderTableProps {
    showHeader: boolean;
    setShowHeader: React.Dispatch<React.SetStateAction<boolean>>;
    onQuickView: (type: string, data: VendorData) => void;
    onQuickView1: (type: string, data: AgentData) => void;
    onConfirmAction1?: () => void;
    onConfirmAction2?: () => void;
    setOrderData?: React.Dispatch<React.SetStateAction<Order[]>>;
    OrderData: Order[];
    onDelete: (userId: string) => void;
    loading?: boolean;
    error?: boolean;

}

export default function OrderTable({ onQuickView, OrderData, onDelete, onQuickView1, loading, error }: OrderTableProps) {
    const router = useRouter();
    const { userType } = useAppContext();
    const {
        setIsSubmitted,
    } = useOrderContext();
    console.log("Order", OrderData)
    const columns: ColumnDef<Order>[] = [
        {
            accessorKey: "id",
            header: "ORDER",
            cell: ({ row }) => {
                const id = row.original.id;
                return (
                    <div
                        className={`${userType}-text cursor-pointer ml-[5px]`}
                        onClick={() => {
                            const uuid = row.original.uuid;
                            if (uuid) {
                                router.push(`/dashboard/orders/${uuid}`);
                            }
                        }}
                    >
                        {id}
                    </div>
                );
            },
        },
        {
            accessorKey: "location",
            header: "LOCATION",
            cell: ({ row }) => {
                const location = row.original.property_location;
                return (

                    <div
                        className="text-[#666666]"
                    >
                        {location}
                    </div>
                );
            },
        },
        {
            accessorKey: "address",
            header: "ADDRESS",
            cell: ({ row }) => {
                const address = row.original.property_address;
                return (

                    <div
                        className="text-[#666666]"
                    >
                        {address}
                    </div>
                );
            },
        },
        {
            accessorKey: "vendor",
            header: "VENDOR",
            cell: ({ row }) => {
                const slots: Slot[] = row.original.slots ?? [];

                // Use Map to ensure unique vendors by UUID
                const uniqueVendorsMap = new Map<string, Slot["vendor"]>();

                slots.forEach((slot) => {
                    const vendor = slot.vendor;
                    if (vendor?.uuid) {
                        uniqueVendorsMap.set(vendor.uuid, vendor);
                    }
                });

                const uniqueVendors = Array.from(uniqueVendorsMap.values());

                return (
                    <div className={`flex flex-wrap gap-x-1 ${userType}-text`}>
                        {uniqueVendors.map((vendor, index) => {
                            const fullName = `${vendor.first_name ?? ""} ${vendor.last_name ?? ""}`.trim();
                            return (
                                <span
                                    key={vendor.uuid}
                                    className="cursor-pointer hover:underline"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onQuickView("vendor", vendor);
                                    }}
                                >
                                    {fullName}
                                    {index < uniqueVendors.length - 1 && ', '}
                                </span>
                            );
                        })}
                    </div>
                );
            }
        }
        ,
        {
            accessorKey: "agent",
            header: "AGENT",
            cell: ({ row }) => {
                const agent = row.original.agent;
                const first_name = agent?.first_name ?? "";
                const last_name = agent?.last_name ?? "";
                return (

                    <div onClick={() => {
                        onQuickView1("agent", agent);
                    }} className={`${userType}-text cursor-pointer`}>{first_name} {last_name}</div>
                );
            },
        },
        {
            accessorKey: "amount",
            header: "TOTAL",
            cell: ({ row }) => {
                const total = row.original.amount;
                return (
                    <div className="text-[#666666]">
                        ${parseFloat(total).toFixed(2)}
                    </div>
                );
            },
        },
        {
            accessorKey: "created_at",
            header: "ADDED",
            cell: ({ row }) => {
                const date = new Date(row.getValue("created_at")).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                });
                return <div className="text-[#666666]">{date}</div>;
            },
        },
        {
            accessorKey: "status",
            header: "STATUS",
            cell: ({ row }) => {
                const status = row.original.payment_status;
                const bgColor = status === "PAID" ? "#6BAE41" : "#E06D5E";

                return (
                    <div
                        className="text-white px-3 py-1 rounded-full text-[10px] font-medium w-fit"
                        style={{ backgroundColor: bgColor }}
                    >
                        {status}
                    </div>
                );
            },
        }
        ,
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row, table }) => {
                const selectedRowIds = Object.keys(table.getState().rowSelection);
                const selectedOrder = table.getRowModel().rows
                    .filter(r => selectedRowIds.includes(r.id))
                    .map(r => r.original);

                return (
                    userType !== "vendor" && (
                        <DropdownActions
                            options={[
                                {
                                    label: "Edit",
                                    onClick: () => {
                                        setIsSubmitted(false);
                                        const uuid = row.original.uuid;
                                        if (uuid) {
                                            router.push(`/dashboard/orders/create/${uuid}`);
                                        }
                                    },
                                },
                                {
                                    label: "Quick View",
                                    onClick: () => {
                                        const uuid = row.original.uuid;
                                        if (uuid) {
                                            router.push(`/dashboard/orders/${uuid}`);
                                        }
                                    },
                                },
                                {
                                    label: "Delete",
                                    onClick: () => onDelete(row.original.uuid ?? ""),
                                    confirm1: true,
                                }
                            ]}
                            data={selectedOrder}
                        />)
                );
            },
        }

    ];

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    );
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
        userType === "agent"
            ? { agent: false }
            : userType === "vendor"
                ? { status: false }
                : {}
    );
    const [rowSelection, setRowSelection] = React.useState({});
    const table = useReactTable({
        data: OrderData,
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
    });
    return (
        <div>
            <div className="w-full">
                <div className="rounded-none border">
                    <Table className="font-alexandria">
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id} className="text-sm text-[#666666] font-bold h-[54px] bg-[#E4E4E4]">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody className="text-[15px] font-normal">
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="max-w-[200px]">
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                loading ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            Loading Orders ...
                                        </TableCell>
                                    </TableRow>
                                ) : error ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No Order Found.
                                        </TableCell>
                                    </TableRow>
                                ) : null
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>


    );
}