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
import { AgentData } from "@/app/dashboard/agents/page";
import { UpdateAgentStatus } from "@/app/dashboard/agents/agents";
import { useAppContext } from "@/app/context/AppContext";

export type Agent = {
    uuid?: string;
    first_name: string;
    last_name: string;
    payment_status: string;
    email: string;
    created_at: string;
    status?: boolean;
    permissions?: { id: number, name: string }[]
    roles?: { id: number, name: string }[],
    headquarter_address?: string
    primary_phone?: string;
    secondary_phone?: string;
    avatar_url?: string;
    company_name: string;
    notes: string;
    activity?: string;
    co_agents?: {
        name: string;
        email: string;
        primary_phone?: string;
        split?: string;
    }[];
};


interface AgentTableProps {
    showHeader: boolean;
    setShowHeader: React.Dispatch<React.SetStateAction<boolean>>;
    onQuickView: (type: string, data: AgentData) => void;
    onConfirmAction1?: () => void;
    onConfirmAction2?: () => void;
    setAgentData?: React.Dispatch<React.SetStateAction<Agent[]>>;
    agentData: Agent[];
    onDelete: (uuid: string) => void;
    loading: boolean;
    error: boolean;
}

export default function AgentTable({ setAgentData, onQuickView, agentData, onDelete, loading, error }: AgentTableProps) {
    const router = useRouter();
    const { userType } = useAppContext();

    console.log("agent data", agentData)
    const handleUpdateStatus = async (uuid: string, status: boolean) => {
        try {
            const token = localStorage.getItem('token') || '';

            const payload = {
                status: status,
                _method: 'PUT'
            };

            const result = await UpdateAgentStatus(uuid, payload, token);
            toast.success('Agent Status updated successfully');
            console.log('result', result);

            return result


        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error(error.message);
                toast.error(error.message || 'Failed to submit agent data');
            }
        }
    };




    const columns: ColumnDef<Agent>[] = [
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
            header: "AGENTS",
            cell: ({ row }) => {
                const { first_name, last_name, roles, ...rest } = row.original;

                const handleClick = () => {
                    const mappedRoles =
                        roles && roles.length > 0
                            ? [{ id: roles[0].id, name: roles[0].name }] as { id: number; name: string }[]
                            : undefined;

                    onQuickView("agents", {
                        ...rest,
                        first_name,
                        last_name,
                        roles: mappedRoles,
                    });
                };

                return (
                    <div
                        className={`text-[#4290E9] cursor-pointer ${userType}-text`}
                        onClick={handleClick}
                    >
                        {first_name} {last_name}
                    </div>
                );
            },
        }

        ,
        {
            accessorKey: "headquarter_address",
            header: "ADDRESS",
            cell: ({ row }) => {
                const address = row.original.headquarter_address;
                return (
                    <div className="text-[#666666]">
                        {address || "N/A"}
                    </div>
                );
            },
        },
        {
            header: "PAYMENT STATUS",
            cell: ({ row }) => {
                const status = row.original.payment_status;
                const bgColor = status === "GOOD" ? "#6BAE41" : "#E06D5E";

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
                    userType !== "vendor" && (
                        <Switch
                            checked={!!status}
                            onCheckedChange={async (checked) => {
                                const data = await handleUpdateStatus(uuid || "", checked);
                                if (setAgentData && data?.data?.uuid) {
                                    setAgentData((prev) =>
                                        prev.map((agent) =>
                                            agent.uuid === data.data.uuid
                                                ? { ...agent, status: checked }
                                                : agent
                                        )
                                    );
                                }
                            }}
                            className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                        />
                    )
                );

            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row, table }) => {
                const selectedRowIds = Object.keys(table.getState().rowSelection);
                const selectedRowCount = selectedRowIds.length;
                const selectedAgents = table.getRowModel().rows
                    .filter(r => selectedRowIds.includes(r.id))
                    .map(r => ({
                        ...r.original,
                        full_name: `${r.original.first_name} ${r.original.last_name}`
                    }));

                return (
                    userType !== "vendor" &&
                    <DropdownActions
                        options={[
                            {
                                label: "Edit",
                                onClick: () => {
                                    const uuid = row.original.uuid;
                                    if (uuid) {
                                        router.push(`/dashboard/agents/create/${uuid}`);
                                    }
                                },
                            },
                            {
                                label: "Quick View",
                                onClick: () => {
                                    const { roles, ...rest } = row.original;
                                    const mappedRoles =
                                        roles && roles.length > 0
                                            ? [{ id: roles[0].id, name: roles[0].name }] as { id: number; name: string; }[]
                                            : undefined;
                                    onQuickView("agents", { ...rest, roles: mappedRoles });
                                },
                            },
                            ...(selectedRowCount === 2
                                ? [{
                                    label: "Merge",
                                    onClick: () => {
                                        console.log("Merge!")
                                        toast.success('Agents merged ')
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
                        data={selectedAgents}
                    />
                );
            },
        }

    ];

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    );
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
        userType === "vendor" ? { status: false } : {}
    );
    const [rowSelection, setRowSelection] = React.useState({});
    const table = useReactTable({
        data: agentData,
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
                                            Loading Agents ...
                                        </TableCell>
                                    </TableRow>
                                ) : error ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No Agent Found.
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