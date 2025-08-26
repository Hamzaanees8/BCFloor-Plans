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
import { UpdateStatus } from "@/app/dashboard/admin/admin";
import { toast } from "sonner";
import { AdminData } from "./QuickViewCard";

export type Admin = {
  uuid?: string;
  full_name: string;
  email: string;
  created_at: string;
  status?: boolean;
  permissions?: { id: number, name: string }[]
  roles?: { id: number, name: string }[],
  address?: string
  primary_phone?: string;
  secondary_phone?: string;
  avatar_url?: string;
};


interface AdminTableProps {
  showHeader: boolean;
  setShowHeader: React.Dispatch<React.SetStateAction<boolean>>;
  onQuickView: (type: string, data: AdminData) => void;
  onConfirmAction1?: () => void;
  onConfirmAction2?: () => void;
  setAdminData?: React.Dispatch<React.SetStateAction<Admin[]>>;
  adminData: Admin[];
  onDelete: (userId: string) => void;
  loading: boolean;
  error: boolean;
}

export default function AdminTable({ setAdminData, onQuickView, adminData, onDelete, loading, error }: AdminTableProps) {

  // const [Admins, setAdmins] = React.useState<Admin[]>(adminData);
  // const [rowSelection, setRowSelection] = React.useState({});


  const router = useRouter();

  const handleUpdateStatus = async (userId: string, status: boolean) => {
    try {
      const token = localStorage.getItem('token') || '';

      const payload = {
        status: status,
        _method: 'PUT'
      };

      const result = await UpdateStatus(userId, payload, token);
      toast.success('User updated successfully');
      console.log('result', result);

      return result


    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        toast.error(error.message || 'Failed to submit user data');
      }
    }
  };




  const columns: ColumnDef<Admin>[] = [
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
      accessorKey: "first_name",
      header: "NAME",
      cell: ({ row }) => (
        <div
          className="text-[#4290E9] cursor-pointer"
          onClick={() => {
            const { roles, ...rest } = row.original;
            const mappedRoles =
              roles && roles.length > 0
                ? [{ id: String(roles[0].id), name: roles[0].name }] as [{ id: string; name: string | undefined }]
                : undefined;
            onQuickView("admin", { ...rest, roles: mappedRoles });
          }}
        >
          {row.getValue("first_name")}
        </div>
      ),
    },

    {
      accessorKey: "role",
      header: "ROLE",
      cell: ({ row }) => {
        const roles = row.original.roles || [];
        return ( // Add return statement here
          <>
            {roles.map(role => (
              <div
                key={role.id}
                className="text-[#666666]"
              >
                {role.name}
              </div>
            ))}
          </>
        );
      },
    },
    {
      header: "ACCESS",
      cell: ({ row }) => {
        const permissions = row.original.permissions || [];
        const names = permissions.map(p => p.name);
        const length = names.length;

        let displayText = '';

        if (length === 7) {
          displayText = 'Full - ' + names.slice(0, 3).join(', ') + (length > 3 ? ', ...' : '');
        } else if (length > 3) {
          displayText = 'Partial - ' + names.slice(0, 3).join(', ') + ', ...';
        } else {
          displayText = names.join(', ');
        }

        return (
          <div className="text-[#666666]">
            {displayText}
          </div>
        );
      }
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
              if (setAdminData && data?.data?.uuid) {
                setAdminData((prev) =>
                  prev.map((admin) =>
                    admin.uuid === data.data.uuid ? { ...admin, status: checked } : admin
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
        const selectedAdmins = table.getRowModel().rows
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
                    router.push(`/dashboard/admin/create/${uuid}`);
                  }
                },
              },
              {
                label: "Quick View",
                onClick: () => {
                  const { roles, ...rest } = row.original;
                  const mappedRoles =
                    roles && roles.length > 0
                      ? [{ id: String(roles[0].id), name: roles[0].name }] as [{ id: string; name: string | undefined; }]
                      : undefined;
                  onQuickView("admin", { ...rest, roles: mappedRoles });
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
            data={selectedAdmins}
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
    data: adminData,
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
                      Loading Admins ...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No Admin Found.
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