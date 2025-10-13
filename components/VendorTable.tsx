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
import { Switch } from "./ui/switch";
import DropdownActions from "./DropdownActions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UpdateStatus } from "@/app/dashboard/vendors/vendors";
import { VendorData } from "./QuickViewCard";
export type Vendor = {
    uuid?: string;
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    status?: boolean;
    vendor_services: VendorService[];
    company?: { uuid: string, company_name: string }
    address?: string
    primary_phone?: string;
    secondary_phone?: string;
    company_name: string;
    avatar_url?: string;
    addresses: Address[];
    settings: { payment_per_km: string }
};
export interface Company {
    id: number;
    uuid: string;
    vendor_id: number;
    company_name: string;
    company_website: string;
    company_logo: string;
    company_banner: string;
    created_at: string;
    updated_at: string;
}

export interface Address {
    id: number;
    uuid: string;
    vendor_id: number;
    type: string;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    province: string;
    country: string;
    created_at: string;
    updated_at: string;
}

export interface WorkHours {
    id: number;
    uuid: string;
    vendor_id: number;
    start_time: string;
    end_time: string;
    work_days: string; // JSON string like '["mon","tue","wed"]'
    repeat_weekly: string;
    break_start: string | null;
    break_end: string | null;
    commute_minutes: number;
    timezone: string;
    created_at: string;
    updated_at: string;
}

export interface VendorSettings {
    id: number;
    uuid: string;
    vendor_id: number;
    payment_per_km: string;
    enable_service_area: boolean;
    force_service_area: boolean;
    created_at: string;
    updated_at: string;
}

export interface VendorService {
    id: number;
    uuid: string;
    vendor_id: number;
    service_id: number;
    hourly_rate: string;
    time_needed: number;
    status: boolean;
    created_at: string;
    updated_at: string;
    service: Service;
}

export interface Service {
    id: number;
    uuid: string;
    name: string;
    category_id: number;
    thumbnail: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
    status: boolean;
    background_color: string | null;
    border_color: string | null;
    thumbnail_url: string | null;
}

interface VendorTableProps {
    showHeader: boolean;
    setShowHeader: React.Dispatch<React.SetStateAction<boolean>>;
    onQuickView: (type: string, data: VendorData) => void;
    onConfirmAction1?: () => void;
    onConfirmAction2?: () => void;
    setVendorData?: React.Dispatch<React.SetStateAction<Vendor[]>>;
    vendorData: Vendor[];
    onDelete: (userId: string) => void;
    loading?: boolean;
    error?: boolean;
}

export default function VendorTable({ setVendorData, onQuickView, vendorData, onDelete, loading, error }: VendorTableProps) {
    const router = useRouter();
    const handleUpdateStatus = async (userId: string, status: boolean) => {
        try {
            const token = localStorage.getItem('token') || '';

            const payload = {
                status: status,
                _method: 'PUT'
            };

            const result = await UpdateStatus(userId, payload, token);
            toast.success('Vendor status updated successfully');
            console.log('result', result);

            return result


        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error(error.message);
                toast.error(error.message || 'Failed to submit vendor data');
            }
        }
    };

    const columns: ColumnDef<Vendor>[] = [
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
            accessorKey: "members",
            header: "MEMBERS",
            cell: ({ row }) => {
                const { first_name, last_name } = row.original;
                return (
                    <div
                        className="text-[#4290E9] cursor-pointer"
                        onClick={() => {
                            const data = row.original;
                            onQuickView("vendors", data);
                        }}
                    >
                        {first_name} {last_name}
                    </div>
                );
            }
        },
        {
            accessorKey: "services",
            header: "SERVICES",
            cell: ({ row }) => {
                const vendorServices = row.original.vendor_services || [];

                const serviceNames = vendorServices
                    .map(vs => vs.service?.name)
                    .filter(Boolean); // filter out undefined/null names safely

                const displayText = serviceNames.join(", ");

                return (
                    <div className="text-[#666666]">
                        {displayText || "No services"}
                    </div>
                );
            }
        }
        ,
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
                const status = row.getValue("status");
                const uuid = row.original.uuid;

                return (
                    <Switch
                        checked={!!status}
                        onCheckedChange={async (checked) => {
                            const data = await handleUpdateStatus(uuid || '', checked);
                            if (setVendorData && data?.data?.uuid) {
                                setVendorData((prev) =>
                                    prev.map((vendor) =>
                                        vendor.uuid === data.data.uuid ? { ...vendor, status: checked } : vendor
                                    )
                                );
                            }
                        }}
                        className="bg-gray-300 data-[state=checked]:bg-[#6BAE41] data-[state=unchecked]:bg-red-500"
                    />
                );
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row, table }) => {
                const selectedRowIds = Object.keys(table.getState().rowSelection);
                const selectedRowCount = selectedRowIds.length;
                const selectedVendors = table.getRowModel().rows
                    .filter(r => selectedRowIds.includes(r.id))
                    .map(r => r.original);

                return (
                    <DropdownActions
                        options={[
                            {
                                label: "Edit",
                                onClick: () => {
                                    const uuid = row.original.uuid;
                                    if (uuid) {
                                        router.push(`/dashboard/vendors/create/${uuid}`);
                                    }
                                },
                            },
                            {
                                label: "Quick View",
                                onClick: () => {
                                    const vendor = row.original;

                                    onQuickView("vendors", vendor);
                                },
                            },
                            ...(selectedRowCount === 2
                                ? [{
                                    label: "Merge",
                                    onClick: () => {
                                        console.log("Merge!")
                                        toast.success('Users merged ')
                                    },
                                    confirm2: true,
                                }]
                                : []),
                            {
                                label: "Delete",
                                onClick: () => onDelete(row.original.uuid ?? ""),
                                confirm1: true,
                            }
                        ]}
                        data={selectedVendors}
                    />
                );
            },
        }

    ];

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    );
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const table = useReactTable({
        data: vendorData,
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
                                            <TableCell key={cell.id}>
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
                                            Loading Vendors ...
                                        </TableCell>
                                    </TableRow>
                                ) : error ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No Vendor Found.
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