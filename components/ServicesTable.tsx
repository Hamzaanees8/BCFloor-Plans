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
import { Services } from "@/app/dashboard/services/page";
import { PreviewImage } from "./Icons";
import { useRouter } from "next/navigation";
import { DeleteService, UpdateServiceStatus } from "@/app/dashboard/services/services";
import { toast } from "sonner";
import ImagePopup from "./ImagePopup";

type ServicesTableProps = {
  data: Services[];
  setServicesData?: React.Dispatch<React.SetStateAction<Services[]>>;
  loading: boolean;
  error: boolean
};

const ServicesTable: React.FC<ServicesTableProps> = ({
  data,
  setServicesData,
  loading, error
}) => {
  const [imagePopupOpen, setImagePopupOpen] = React.useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = React.useState<string | undefined>(undefined);

  const router = useRouter();

  const handleUpdateStatus = async (serviceId: string, status: boolean) => {
    try {
      const token = localStorage.getItem('token') || '';
      console.log('listingId', serviceId);

      const payload = {
        status: status,
        _method: 'POST'
      };

      const result = await UpdateServiceStatus(serviceId, payload, token);
      toast.success('Service status updated successfully');
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
      await DeleteService(listingId, token);
      toast.success('Service deleted successfully');
      if (setServicesData) {
        setServicesData(prev => prev.filter(admin => admin.uuid !== listingId));
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Delete failed:', error.message);
        toast.error(error.message || 'Failed to delete user');
      } else {
        console.error('Delete failed:', error);
        toast.error('Failed to delete service');
      }
    }
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="font-alexandria !overflow-x-auto whitespace-nowrap min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-[#E4E4E4] font-alexandria h-[54px] hover:bg-[#E4E4E4]">
              <TableHead className="text-[14px] font-[700] text-[#7D7D7D] pl-[20px]">Description</TableHead>
              <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Category</TableHead>
              <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Preview</TableHead>
              <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Color</TableHead>
              <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading Services ...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No Service Found.
                  </TableCell>
                </TableRow>
              ) : null
            ) : (
              data.map((service, i) => {
                const options = [
                  {
                    label: "Edit",
                    onClick: () => {
                      if (service.uuid) {
                        router.push(`/dashboard/services/create/${service.uuid}`);
                      }
                    },
                  },
                  {
                    label: "Delete",
                    onClick: () => handleDelete(service.uuid),
                    confirm1: true,
                  },
                ];

                return (
                  <TableRow key={i}>
                    <TableCell className="text-[15px] font-[400] text-[#666666] pl-[20px]">
                      {service.name}
                    </TableCell>
                    <TableCell className="text-[15px] font-[400]  pl-[20px] text-[#666666]">
                      {service.category?.name}
                    </TableCell>
                    <TableCell className="text-[15px] font-[400] text-[#7D7D7D] text-center">
                      <div
                        onClick={() => {
                          setSelectedImageUrl(service.thumbnail_url);
                          setImagePopupOpen(true);
                        }}
                        className="cursor-pointer"
                      >
                        <PreviewImage className="w-[24px] h-[24px] object-cover" />
                      </div>
                    </TableCell>
                    <TableCell className="text-[15px] font-[400] text-[#7D7D7D]">
                      <div
                        className="w-[20px] h-[20px] rounded-full"
                        style={{
                          backgroundColor: service.background_color,
                          border: `1px solid ${service.border_color}`,
                        }}
                      ></div>
                    </TableCell>
                    <TableCell className="text-[15px] font-[400] text-[#7D7D7D] flex justify-between items-center gap-2 pr-[20px]">
                      <Switch
                        checked={!!service.status}
                        onCheckedChange={async (checked) => {
                          const data = await handleUpdateStatus(service.uuid || '', checked);
                          if (setServicesData && data?.data?.uuid) {
                            setServicesData((prev: Services[]) =>
                              prev.map((list: Services) =>
                                list.uuid === data.data.uuid ? { ...list, status: checked } : list
                              )
                            );
                          }
                        }}
                        className={`${service.status ? "!bg-[#6BAE41]" : "!bg-[#E06D5E]"} data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500`}
                      />
                      <DropdownActions options={options} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}

          </TableBody>
        </Table>
      </div>
      {selectedImageUrl && (
        <ImagePopup
          imageUrl={selectedImageUrl}
          open={imagePopupOpen}
          onClose={() => {
            setImagePopupOpen(false);
            setSelectedImageUrl(undefined);
          }}
        />
      )}
    </div>
  );
};

export default ServicesTable;
