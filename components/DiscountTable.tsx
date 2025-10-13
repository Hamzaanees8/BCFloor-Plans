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
import { Switch } from "./ui/switch";
import DropdownActions from "./DropdownActions";
import { Delete, EditDiscountStatus } from "@/app/dashboard/global-settings/global-settings";
import AddDiscountDialog from "./AddDiscountDialog";
import { toast } from "sonner";

export type Discount = {
    id: number;
    name: string;
    description: string;
    quantity: number;
    percentage: number;
    status: boolean;
    type: string;
    uuid: string;
    code_key: string;
};
interface SelectedDiscount {
    uuid?: string;
    type?: string;
}
type DiscountTableProps = {
    discounts: Discount[];
    fetchDiscounts: () => void;
    setDiscounts: React.Dispatch<React.SetStateAction<Discount[]>>;
    loading: boolean;
    error: boolean;
};

export default function DiscountTable({ discounts, fetchDiscounts, setDiscounts, loading, error }: DiscountTableProps) {
    const [selectedDiscount, setSelectedDiscount] = React.useState<SelectedDiscount | null>(null);
    const [openAddDiscountDialog, setOpenAddDiscountDialog] = React.useState(false);
    const handleDelete = async (uuid: string) => {
        try {
            const token = localStorage.getItem('token') || '';
            await Delete(uuid, token);
            toast.success('Discount deleted successfully');
            setDiscounts((prev: Discount[]) => prev.filter(discount => discount.uuid !== uuid));
        } catch (error) {
            if (error instanceof Error) {
                console.error('Delete failed:', error.message);
                toast.error(error.message || 'Failed to delete discount');
            } else {
                console.error('Delete failed:', error);
                toast.error('Failed to delete discount');
            }
        }
    };
    const handleStatus = async (checked: boolean, uuid: string) => {
        try {
            const token = localStorage.getItem('token') || '';

            const payload = {
                status: checked,
            };

            const result = await EditDiscountStatus(payload, token, uuid);
            toast.success('Discount status updated successfully');
            console.log('Discount status updated successfully:', result);
        } catch (error) {
            if (error instanceof Error) {
                console.error('Submission failed:', error.message);
                toast.error(error.message);
            } else {
                console.error('Submission failed:', error);
                toast.error('Failed to submit user data');
            }
        }
    };
    console.log("discount", discounts)
    const options = (row: Discount) => [
        {
            label: "Edit",
            onClick: () => {
                setSelectedDiscount({ uuid: row.uuid, type: row.type });
                setOpenAddDiscountDialog(true);
            },
        },
        {
            label: "Delete",
            onClick: () => { handleDelete(row.uuid) },
            confirm1: true,
        },
    ];
    const columns: ColumnDef<Discount>[] = [

        {
            id: "label", // Custom ID (not accessorKey)
            header: "LABEL",
            cell: ({ row }) => {
                const original = row.original as { name?: string; code_key?: string };
                const name = original.name;
                const code_key = original.code_key;

                const displayValue =
                    name && name.trim() !== "" ? name : code_key || "n/a";

                return <div className="text-[#666666]">{displayValue}</div>;
            },
        }
        ,
        {
            accessorKey: "description",
            header: "DESCRIPTION",
            cell: ({ row }) => (
                <div className="text-[#666666]">
                    {row.getValue("description") || row.getValue("description") === 0
                        ? row.getValue("description")
                        : "n/a"}
                </div>
            ),
        },
        {
            accessorKey: "quantity",
            header: "QTY",
            cell: ({ row }) => (
                <div className="text-[#666666]">
                    {row.getValue("quantity") || row.getValue("quantity") === 0
                        ? row.getValue("quantity")
                        : "n/a"}
                </div>
            ),
        },
        {
            accessorKey: "percentage",
            header: "DISCOUNT",
            cell: ({ row }) => {
                const value = row.getValue("percentage");
                const displayValue =
                    value || value === 0
                        ? `${Number(value)}%`
                        : "n/a";
                return <div className="text-[#666666]">{displayValue}</div>;
            },
        },
        {
            accessorKey: "status",
            header: "STATUS",
            cell: ({ row }) => {
                const status = row.getValue("status") as boolean;
                const uuid = row.original.uuid;

                return (
                    <Switch
                        checked={status}
                        onCheckedChange={(checked) => {
                            setDiscounts((prev: Discount[]) =>
                                prev.map((discount) =>
                                    discount.uuid === uuid ? { ...discount, status: checked } : discount
                                )
                            );
                            handleStatus(checked, uuid);
                        }}
                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                    />
                );
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {

                return (
                    <DropdownActions options={options(row.original)} />
                );
            },
        },
    ];
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    );
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const table = useReactTable({
        data: Array.isArray(discounts) ? discounts : [],
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
        manualPagination: true,
    });
    console.log(discounts);
    return (
        <div className="w-full">
            <div className="rounded-none border">
                <AddDiscountDialog
                    type={selectedDiscount?.type}
                    uuid={selectedDiscount?.uuid}
                    open={openAddDiscountDialog}
                    setOpen={setOpenAddDiscountDialog}
                    onSuccess={() => {
                        fetchDiscounts();
                    }}
                />
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
                                        Loading Discounts ...
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        No Discount Found.
                                    </TableCell>
                                </TableRow>
                            ) : null
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}