"use client";

import React, { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import DropdownActions from "@/components/DropdownActions";
import { useRouter } from "next/navigation";
import { Listings } from "@/app/dashboard/listings/page";
import {
  DeleteListing,
  UpdateListingStatus,
} from "@/app/dashboard/listings/listing";
import { toast } from "sonner";
import { AgentData } from "@/app/dashboard/agents/page";
import { useAppContext } from "@/app/context/AppContext";
import Link from "next/link";
import { Button } from "./ui/button";

type ListingsTableProps = {
  data: Listings[];
  onQuickView: (type: "agent" | "listing", data: Listings) => void;
  onQuickView1: (type: string, data: AgentData) => void;
  onConfirmAction1?: () => void;
  setListingsData?: React.Dispatch<React.SetStateAction<Listings[]>>;
  onDelete: (userId: string) => void;
  loading: boolean;
  error: boolean;
};

const ListingsTable: React.FC<ListingsTableProps> = ({
  data,
  onQuickView,
  onQuickView1,
  setListingsData,
  loading,
  error,
}) => {
  const { userType } = useAppContext();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const router = useRouter();

  const handleUpdateStatus = async (listingId: string, status: boolean) => {
    try {

      const payload = {
        status: status,
        _method: "POST",
      };

      const result = await UpdateListingStatus(listingId, payload);
      toast.success("Listing status updated successfully");

      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        toast.error(error.message || "Failed to submit user data");
      }
    }
  };
  const handleDelete = async (listingId: string) => {
    try {

      await DeleteListing(listingId);
      toast.success("User deleted successfully");
      if (setListingsData) {
        setListingsData((prev) =>
          prev.filter((admin) => admin.uuid !== listingId)
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Delete failed:", error.message);
        toast.error(error.message || "Failed to delete user");
      } else {
        console.error("Delete failed:", error);
        toast.error("Failed to delete user");
      }
    }
  };

  const columns: ColumnDef<Listings>[] = [
    {
      accessorKey: "address",
      header: "Location",
      cell: ({ row }) => {
        const listing = row.original;
        return (
          <div
            onClick={() => onQuickView("listing", listing)}
            className={`text-[15px] font-[400] ${userType}-text cursor-pointer hover:underline`}
          >
            {listing?.address +
              ", " +
              listing?.city +
              ", " +
              listing?.province +
              ", " +
              listing?.postal_code +
              ", " +
              listing?.country}
          </div>
        );
      },
    },
    {
      accessorKey: "bookings",
      header: "Bookings",
      cell: ({ row }) => {
        const orders = row.original.orders;
        return (
          <div className="text-[15px] font-[400] text-[#7D7D7D] flex items-center gap-1">
            {orders?.length
              ? orders.map((order, index) => (
                <div key={order.id}>
                  <Link
                    href={`/dashboard/orders/${order.uuid}`}
                    className="text-[#4290E9] font-[500] hover:underline"
                  >
                    {order.id}
                  </Link>
                  {orders.length && index < orders.length - 1 && ", "}
                </div>
              ))
              : "N/A"}
          </div>
        );
      },
    },
    ...(userType === "admin" || userType === "vendor"
      ? [
        {
          accessorKey: "agent",
          header: "Agent",
          cell: ({ row }) => {
            const agent = row.original.agent;
            return (
              <div
                onClick={() => onQuickView1("agent", agent)}
                className={`text-[15px] font-[400] ${userType}-text cursor-pointer`}
              >
                {agent?.first_name + " " + agent?.last_name || "N/A"}
              </div>
            );
          },
        } as ColumnDef<Listings>,
      ]
      : []),
    {
      accessorKey: "created_at",
      header: "Added",
      cell: ({ row }) => {
        const date = row.getValue("created_at");
        return (
          <div className="text-[15px] font-[400] text-[#7D7D7D]">
            {date
              ? new Date(date as string).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })
              : "N/A"}
          </div>
        );
      },
    },
    ...(userType !== "vendor"
      ? [
        {
          accessorKey: "status",
          header: "Status",
          cell: ({ row }) => {
            const listing = row.original;
            const options = [
              {
                label: "Edit",
                onClick: () => {
                  router.push(`/dashboard/listings/create/${listing.uuid}`);
                },
              },
              {
                label: "Quick View",
                onClick: () => onQuickView("listing", listing),
              },
              {
                label: "Delete",
                onClick: () => handleDelete(listing.uuid || ""),
                confirm1: true,
              },
            ];

            return (
              <div className="text-[15px] font-[400] text-[#7D7D7D] flex justify-between items-center gap-2">
                <Switch
                  checked={!!listing.status}
                  onCheckedChange={async (checked) => {
                    const data = await handleUpdateStatus(
                      listing.uuid || "",
                      checked
                    );
                    if (setListingsData && data?.data?.uuid) {
                      setListingsData((prev: Listings[]) =>
                        prev.map((list: Listings) =>
                          list.uuid === data.data.uuid
                            ? { ...list, status: checked }
                            : list
                        )
                      );
                    }
                  }}
                  className={`${listing.status ? "!bg-[#6BAE41]" : "!bg-[#E06D5E]"
                    } data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500`}
                />

                <DropdownActions options={options} />
              </div>
            );
          },
        } as ColumnDef<Listings>,
      ]
      : []),
  ];


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
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="w-full">
      <div className="rounded-none border">
        <Table className="font-alexandria">
          {/* Replace TableHeader section */}
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent h-[54px]"
                style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-[14px] font-[700] text-[#7D7D7D] pl-[20px]"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          {/* Replace TableBody section */}
          <TableBody>
            {loading ? (
              // Skeleton Loading State
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="h-[54px] bg-white border-b border-[#E4E4E4]">
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex} className="pl-[20px]">
                      <Skeleton className="h-4 w-[100px] bg-gray-200" />
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
                    <TableCell key={cell.id} className="pl-[20px]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-red-500"
                >
                  Failed to load listings. Please try again.
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No Listings Available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add pagination section */}
      {data.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-[#666666]">
            Showing {table.getRowModel().rows.length} of{" "}
            {data.length} Listings
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="text-[#666666]"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: table.getPageCount() }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={table.getState().pagination.pageIndex === page - 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => table.setPageIndex(page - 1)}
                  className={`min-w-[40px] ${table.getState().pagination.pageIndex === page - 1
                    ? `${userType}-bg text-white`
                    : "text-[#666666]"
                    }`}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="text-[#666666]"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingsTable;
