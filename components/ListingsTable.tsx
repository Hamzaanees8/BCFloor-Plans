"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import DropdownActions from "@/components/DropdownActions";
import { useRouter } from "next/navigation";
import { Listings } from "@/app/dashboard/listings/page";
import { DeleteListing, UpdateListingStatus } from "@/app/dashboard/listings/listing";
import { toast } from "sonner";
import { AgentData } from "@/app/dashboard/agents/page";
import { useAppContext } from "@/app/context/AppContext";



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
  error
}) => {
  const { userType } = useAppContext();

  const router = useRouter()

  const handleUpdateStatus = async (listingId: string, status: boolean) => {
    try {
      const token = localStorage.getItem('token') || '';
      console.log('listingId', listingId);

      const payload = {
        status: status,
        _method: 'POST'
      };

      const result = await UpdateListingStatus(listingId, payload, token);
      toast.success('Listing status updated successfully');
      console.log('result', result);

      return result


    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        toast.error(error.message || 'Failed to submit user data');
      }
    }
  };
  const handleDelete = async (listingId: string) => {
    try {
      const token = localStorage.getItem('token') || '';
      await DeleteListing(listingId, token);
      toast.success('User deleted successfully');
      if (setListingsData) {
        setListingsData(prev => prev.filter(admin => admin.uuid !== listingId));
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Delete failed:', error.message);
        toast.error(error.message || 'Failed to delete user');
      } else {
        console.error('Delete failed:', error);
        toast.error('Failed to delete user');
      }
    }
  };
  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="font-alexandria !overflow-x-auto whitespace-nowrap min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-[#E4E4E4] font-alexandria h-[54px] hover:bg-[#E4E4E4]">
              <TableHead className="text-[14px] font-[700] text-[#7D7D7D] pl-[20px]">Address</TableHead>
              <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Location</TableHead>
              {(userType === 'admin' || userType === 'vendor') && (
                <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Agent</TableHead>
              )}
              <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Added</TableHead>
              {userType !== 'vendor' &&
                <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Status</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading Listings ...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No Listing Found.
                  </TableCell>
                </TableRow>
              ) : null
            ) : (

              data.map((listing, i) => {

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
                    onClick: () => handleDelete(listing.uuid || ''),
                    confirm1: true,
                  },
                ];
                return <TableRow key={i}>
                  <TableCell
                    onClick={() => onQuickView("listing", listing)}
                    className={`text-[15px] font-[400] ${userType}-text pl-[20px] cursor-pointer hover:underline`}
                  >
                    {listing.address}
                  </TableCell>
                  <TableCell className="text-[15px] font-[400] text-[#7D7D7D]">
                    {listing?.city + ', ' + listing?.province + ', ' + listing?.postal_code + ', ' + listing?.country + ','}
                  </TableCell>
                  {(userType === 'admin' || userType === 'vendor') && (
                    <TableCell
                      onClick={() => onQuickView1("agent", listing.agent)}
                      className={`text-[15px] font-[400] ${userType}-text cursor-pointer `}
                    >
                      {listing.agent?.first_name + ' ' + listing.agent?.last_name || 'N/A'}
                    </TableCell>
                  )}
                  <TableCell className="text-[15px] font-[400] text-[#7D7D7D]">
                    {listing.created_at
                      ? new Date(listing.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                      })
                      : "N/A"}
                  </TableCell>
                  {userType !== 'vendor' &&
                    <TableCell className="text-[15px] font-[400] text-[#7D7D7D] flex justify-between items-center gap-2 pr-[20px]">
                      <Switch
                        checked={!!listing.status}
                        onCheckedChange={async (checked) => {
                          const data = await handleUpdateStatus(listing.uuid || '', checked);
                          if (setListingsData && data?.data?.uuid) {
                            setListingsData((prev: Listings[]) =>
                              prev.map((list: Listings) =>
                                list.uuid === data.data.uuid ? { ...list, status: checked } : list
                              )
                            );
                          }
                        }}
                        className={`${listing.status ? "!bg-[#6BAE41]" : "!bg-[#E06D5E]"} data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500`}
                      />

                      <DropdownActions options={options} />
                    </TableCell>
                  }
                </TableRow>
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ListingsTable;
