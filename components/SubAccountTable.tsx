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
import { SubAccountData } from "./QuickViewCard";
import { UpdateStatus } from "@/app/dashboard/sub-accounts/subaccounts";
import { AgentData } from "@/app/dashboard/agents/page";
import { useAppContext } from "@/app/context/AppContext";

export type SubAccount = {
    uuid?: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    primary_email: string;
    created_at: string;
    notes: string;
    status?: boolean;
    permissions?: { id: number, name: string }[]
    role?: { id: number, name: string },
    agent: { uuid: string, first_name: string, last_name: string, email: string, created_at: string, company_name: string, payment_status: string, notes: string, status?: boolean, permissions?: { id: number, name: string }[], roles?: { id: number, name: string }[], headquarter_address?: string, primary_phone?: string, secondary_phone?: string, avatar_url?: string, activity?: string },
    address?: string
    primary_phone?: string;
    secondary_phone?: string;
    avatar_url?: string;
    activity: string;
};


interface SubAccountTableProps {
    showHeader: boolean;
    setShowHeader: React.Dispatch<React.SetStateAction<boolean>>;
    onQuickView: (type: string, data: SubAccountData) => void;
    onQuickView1: (type: string, data: AgentData) => void;
    onConfirmAction1?: () => void;
    onConfirmAction2?: () => void;
    setSubAccountData?: React.Dispatch<React.SetStateAction<SubAccount[]>>;
    subAccountData: SubAccount[];
    onDelete: (userId: string) => void;
    loading: boolean;
    error: boolean;
}

export default function SubAccountTable({ setSubAccountData, onQuickView, subAccountData, onDelete, onQuickView1, loading, error }: SubAccountTableProps) {
    const router = useRouter();
    const { userType } = useAppContext()

    const handleUpdateStatus = async (userId: string, status: boolean) => {
        try {
            const token = localStorage.getItem('token') || '';

            const payload = {
                status: status,
                _method: 'PUT'
            };

            const result = await UpdateStatus(userId, payload, token);
            toast.success('Sub-Account status updated successfully');
            console.log('result', result);

            return result


        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error(error.message);
                toast.error(error.message || 'Failed to submit Sub-Account data');
            }
        }
    };




    const columns: ColumnDef<SubAccount>[] = [
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
            accessorKey: "subagent",
            header: "SUB AGENTS",
            cell: ({ row }) => {
                const { first_name, last_name } = row.original;
                return (
                    <div
                        className={`${userType}-text cursor-pointer`}
                        onClick={() => {
                            const data = row.original;
                            onQuickView("subaccount", data);
                        }}
                    >
                        {first_name} {last_name}
                    </div>
                );
            }
        },
        {
            accessorKey: "role",
            header: "ROLE",
            cell: ({ row }) => {
                const role = row.original.role;
                return ( // Add return statement here

                    <div
                        className="text-[#666666]"
                    >
                        {role?.name}
                    </div>
                );
            },
        },
        {
            accessorKey: "agent",
            header: "MAIN AGENT",
            cell: ({ row }) => {
                const agent = row.original.agent;
                const first_name = agent?.first_name ?? "";
                const last_name = agent?.last_name ?? "";
                // const fullAgent: SubAccountData = {
                //     first_name: agent.first_name,
                //     last_name: agent.last_name,
                //     email: agent.email,
                //     full_name: `${agent.first_name} ${agent.last_name}`,
                //     created_at: agent.created_at,
                //     // and any other required fields...
                // };
                return (

                    <div onClick={() => {
                        onQuickView1("agent", agent);
                    }} className={`${userType}-text cursor-pointer`}>{first_name} {last_name}</div>
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
                const status = row.getValue("status");
                const uuid = row.original.uuid;

                return (
                    <Switch
                        checked={!!status}
                        onCheckedChange={async (checked) => {
                            const data = await handleUpdateStatus(uuid || '', checked);
                            if (setSubAccountData && data?.data?.uuid) {
                                setSubAccountData((prev) =>
                                    prev.map((subaccount) =>
                                        subaccount.uuid === data.data.uuid ? { ...subaccount, status: checked } : subaccount
                                    )
                                );
                            }
                        }}
                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
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
                const selectedSubaccount = table.getRowModel().rows
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
                                        router.push(`/dashboard/sub-accounts/create/${uuid}`);
                                    }
                                },
                            },
                            {
                                label: "Quick View",
                                onClick: () => {
                                    const data = row.original;
                                    onQuickView("subaccount", data);
                                },
                            },
                            ...(selectedRowCount === 2
                                ? [{
                                    label: "Merge",
                                    onClick: () => {
                                        console.log("Merge!")
                                        toast.success('Sub-Accounts merged ')
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
                        data={selectedSubaccount}
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
        data: subAccountData,
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
                                            Loading Sub Accounts ...
                                        </TableCell>
                                    </TableRow>
                                ) : error ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No Sub Account Found.
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