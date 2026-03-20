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
import { Skeleton } from "@/components/ui/skeleton";
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
import { Order } from "../page";
import { useRouter } from "next/navigation";
import { useOrderContext } from "../context/OrderContext";
import { useAppContext } from "@/app/context/AppContext";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { Pagination } from "@/components/TablePagination";
import { PERMISSIONS } from "@/lib/permissions";
import { usePermissions } from "@/app/hooks/usePermissions";
import { VendorData } from "@/components/QuickViewCard";
import { toast } from "sonner";
import { useWhiteLabel } from "@/app/context/Whitelabel";


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


export default function OrderTable({ OrderData, onDelete, onQuickView1, loading, error }: OrderTableProps) {
    const router = useRouter();
    const { userType } = useAppContext();
    const { hasPermission } = usePermissions();
    const {
        setIsSubmitted,
    } = useOrderContext();

    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const headerBg = `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`;


    const columns: ColumnDef<Order>[] = [
        {
            accessorKey: "id",

            header: ({ column }) => {
                const isSorted = column.getIsSorted();

                return (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            if (isSorted === "asc") {
                                column.toggleSorting(true); // to desc
                            } else if (isSorted === "desc") {
                                column.clearSorting(); // clear
                            } else {
                                column.toggleSorting(false); // to asc
                            }
                        }}
                        className="p-0 hover:bg-transparent flex items-center gap-1 font-bold"
                    >
                        ORDER
                        {isSorted === "asc" && <span><ChevronUp style={{ color: roleSettings.pageTabColor }} strokeWidth={3} /></span>}
                        {isSorted === "desc" && <span><ChevronDown style={{ color: roleSettings.pageTabColor }} strokeWidth={3} /></span>}
                        {!isSorted && <span className="text-gray-400"><ChevronsUpDown className="text-gray-400" strokeWidth={3} /></span>}
                    </Button>
                )
            },

            enableSorting: true,

            cell: ({ row }) => {
                const id = row.original.id;

                return (
                    <div
                        className={`cursor-pointer ml-[5px]`}
                        style={{ color: roleSettings.pageTabColor }}
                        onClick={() => {
                            // Admin needs specific permission to view orders
                            // If user is admin, enforce permission check. If not admin (e.g. agent), allow view by default (or based on other logic if needed, but per request admin is key)
                            const canView = userType !== "admin" || (hasPermission(PERMISSIONS.VIEW_ORDERS) || hasPermission(PERMISSIONS.VIEW_APPOINTMENTS));

                            if (!canView) {
                                toast.error("You do not have permission to view orders");
                                return;
                            }

                            const uuid = row.original.uuid;
                            if (uuid) router.push(`/dashboard/orders/${uuid}`);
                        }}

                    >
                        {id}
                    </div>
                );
            },
        },
        // {
        //     accessorKey: "property_location",
        //     header: "LOCATION",
        //     cell: ({ row }) => {
        //         const location = row.original.property_location;
        //         return (
        //             <div className="text-[#666666]">
        //                 {location}
        //             </div>
        //         );
        //     },
        // },
        {
            accessorKey: "property_address",
            header: "ADDRESS",
            cell: ({ row }) => {
                const address = row.original.property_address;
                const location = row.original.property_location;

                return (
                    <div className="truncate" style={{ color: roleSettings.pageText }}>
                        {`${address}, ${location}`}
                    </div>
                );
            },
        },
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
                    }}
                        className={`cursor-pointer`}
                        style={{ color: roleSettings.pageTabColor }}
                    >{first_name} {last_name}</div>
                );
            },
        },
        {
            accessorKey: "amount",
            header: "TOTAL",
            cell: ({ row }) => {
                const total = row.original.amount;
                return (
                    <div style={{ color: roleSettings.pageText }}>
                        ${parseFloat(total).toFixed(2)}
                    </div>
                );
            },
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => {
                // Get current sort state
                const isSorted = column.getIsSorted();

                return (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            if (isSorted === "asc") {
                                column.toggleSorting(true); // Set to desc
                            } else if (isSorted === "desc") {
                                column.clearSorting(); // Clear sorting
                            } else {
                                column.toggleSorting(false); // Set to asc
                            }
                        }}
                        className="p-0 hover:bg-transparent flex items-center gap-1 font-bold"
                    >
                        ADDED
                        {isSorted === "asc" && <span><ChevronUp style={{ color: roleSettings.pageTabColor }} strokeWidth={3} /></span>}
                        {isSorted === "desc" && <span><ChevronDown style={{ color: roleSettings.pageTabColor }} strokeWidth={3} /></span>}
                        {!isSorted && <span className="text-gray-400"><ChevronsUpDown className="text-gray-400" strokeWidth={3} /></span>}
                    </Button>
                )
            },
            cell: ({ row }) => {
                const date = new Date(row.getValue("created_at")).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                });
                return <div style={{ color: roleSettings.pageText }}>{date}</div>;
            },
            // Optional: Enable sorting for this column
            enableSorting: true,
        },
        {
            accessorKey: "payment_status",
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
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row, table }) => {
                const selectedRowIds = Object.keys(table.getState().rowSelection);
                const selectedOrder = table.getRowModel().rows
                    .filter(r => selectedRowIds.includes(r.id))
                    .map(r => r.original);

                // Admin needs specific permission to edit
                const canEdit = userType !== "vendor" && (
                    userType !== "admin" ||
                    (hasPermission(PERMISSIONS.EDIT_ORDERS) || hasPermission(PERMISSIONS.BOOK_APPOINTMENTS))
                );

                const options = [
                    ...(canEdit ? [{
                        label: "Edit",
                        onClick: () => {
                            setIsSubmitted(false);
                            const uuid = row.original.uuid;
                            if (uuid) {
                                router.push(`/dashboard/orders/create/${uuid}?isEdit=true`);
                            }
                        },
                    }] : []),
                    {
                        label: "Quick View",
                        onClick: () => {
                            const canView = userType !== "admin" || (hasPermission(PERMISSIONS.VIEW_ORDERS) || hasPermission(PERMISSIONS.VIEW_APPOINTMENTS));

                            if (!canView) {
                                toast.error("You do not have permission to view orders");
                                return;
                            }
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
                ];

                return (
                    userType !== "vendor" && (
                        <DropdownActions
                            options={options}
                            data={selectedOrder}
                        />)
                );
            },
        }
    ];

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
        userType === "agent"
            ? { agent: false }
            : userType === "vendor"
                ? { status: false }
                : {}
    );
    const [rowSelection, setRowSelection] = React.useState({});

    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 10,
    });

    const table = useReactTable({
        data: OrderData,
        columns,
        // Add pagination to state
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination, // Use the pagination state
        },
        // Add onPaginationChange handler
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
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
                                            <TableHead key={header.id} className="text-sm border-none font-bold h-[54px]" style={{ backgroundColor: headerBg, color: roleSettings.pageText }}>
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
                            {loading ? (
                                // Skeleton Loading State
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index} className="h-[54px] bg-white border-b border-[#E4E4E4]">
                                        {columns.map((_, colIndex) => (
                                            <TableCell key={colIndex}>
                                                <Skeleton className="h-4 w-auto bg-gray-200" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : table.getRowModel().rows?.length ? (
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
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center text-red-500">
                                        Failed to load orders.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        No Orders Available
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <Pagination<Order>
                    table={table}
                    data={OrderData}
                    dataName="Orders"
                    userType={userType}
                />
            </div>

        </div>
    );
}