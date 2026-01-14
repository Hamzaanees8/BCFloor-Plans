"use client";

import React, { useEffect, useState } from "react";
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
import { Packages, Services } from "@/app/dashboard/services/page";
import { useRouter } from "next/navigation";
import {
  DeleteService,
  UpdateServiceStatus,
} from "@/app/dashboard/services/services";
import { toast } from "sonner";
import ImagePopup from "./ImagePopup";
import { useAppContext } from "@/app/context/AppContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Pagination } from "./TablePagination";

type ServicesTableProps = {
  data: Services[];
  setServicesData?: React.Dispatch<React.SetStateAction<Services[]>>;
  loading: boolean;
  error: boolean;
  packagesData: Packages[] | null;
};

const ServicesTable: React.FC<ServicesTableProps> = ({
  data,
  setServicesData,
  loading,
  error,
  packagesData,
}) => {
  const [imagePopupOpen, setImagePopupOpen] = React.useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = React.useState<
    string | undefined
  >(undefined);
  const { userType } = useAppContext();
  const [paginatedServices, setPaginatedServices] = useState<Services[]>([]);
  const [paginatedPackages, setPaginatedPackages] = useState<Packages[]>([]);


  const router = useRouter();

  useEffect(() => {
    if (data.length > 0) {
      setPaginatedServices(data.slice(0, 10));
    }
  }, [data]);

  useEffect(() => {
    if (packagesData && packagesData.length > 0) {
      setPaginatedPackages(packagesData.slice(0, 10));
    }
  }, [packagesData]);

  const handleUpdateStatus = async (serviceId: string, status: boolean) => {
    try {
      const token = localStorage.getItem("token") || "";
      console.log("listingId", serviceId);

      const payload = {
        status: status,
        _method: "POST",
      };

      const result = await UpdateServiceStatus(serviceId, payload, token);
      toast.success("Service status updated successfully");
      console.log("result", result);

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
      const token = localStorage.getItem("token") || "";
      await DeleteService(listingId, token);
      toast.success("Service deleted successfully");
      if (setServicesData) {
        setServicesData((prev) =>
          prev.filter((admin) => admin.uuid !== listingId)
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Delete failed:", error.message);
        toast.error(error.message || "Failed to delete user");
      } else {
        console.error("Delete failed:", error);
        toast.error("Failed to delete service");
      }
    }
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <Table className="font-alexandria">
          <TableHeader>
            <TableRow className="h-[54px]" style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>
              <TableHead className="text-[14px] font-[700] text-[#7D7D7D] pl-[20px]">
                Description
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">
                Category
              </TableHead>
              <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">
                Color
              </TableHead>
              {userType !== "vendor" && (
                <TableHead className="text-[14px] font-[700] text-[#7D7D7D]">
                  Status
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Skeleton Loading State
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="h-[54px] bg-white border-b border-[#E4E4E4]">
                  <TableCell className="pl-[20px]"><Skeleton className="h-4 w-[100px] bg-gray-200" /></TableCell>
                  <TableCell className="pl-[20px]"><Skeleton className="h-4 w-[80px] bg-gray-200" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[40px] bg-gray-200 rounded-full" /></TableCell>
                  {userType !== "vendor" && (
                    <TableCell><Skeleton className="h-6 w-[30px] bg-gray-200 rounded-full" /></TableCell>
                  )}
                </TableRow>
              ))
            ) : paginatedServices.length === 0 ? (
              error ? (
                <TableRow>
                  <TableCell colSpan={userType !== "vendor" ? 4 : 3} className="h-24 text-center text-red-500">
                    Failed to load services.
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={userType !== "vendor" ? 4 : 3} className="h-24 text-center">
                    No Service Found.
                  </TableCell>
                </TableRow>
              )
            ) : (
              paginatedServices.map((service, i) => {
                const options = [
                  {
                    label: "Edit",
                    onClick: () => {
                      if (service.uuid) {
                        router.push(
                          `/dashboard/services/create/${service.uuid}`
                        );
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
                    <TableCell
                      className={`text-[15px] flex justify-start gap-4 items-center font-[400] ${userType}-text pl-[20px]`}
                    >
                      <div
                        onClick={() => {
                          setSelectedImageUrl(service.thumbnail_url);
                          setImagePopupOpen(true);
                        }}
                        className="cursor-pointer rounded-full border border-gray-300"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={service.thumbnail_url}
                          alt={service.name}
                          className="w-[40px] h-[40px] object-cover rounded-full bg-gray-200"
                        />
                      </div>
                      {service.name}
                    </TableCell>
                    <TableCell className="text-[15px] font-[400] pl-[20px] text-[#666666]">
                      {service.category?.name}
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

                    {userType !== "vendor" && (
                      <TableCell className="text-[15px] font-[400] text-[#7D7D7D] flex justify-between items-center gap-2 pr-[20px]">
                        <Switch
                          checked={!!service.status}
                          onCheckedChange={async (checked) => {
                            const data = await handleUpdateStatus(
                              service.uuid || "",
                              checked
                            );
                            if (setServicesData && data?.data?.uuid) {
                              setServicesData((prev: Services[]) =>
                                prev.map((list: Services) =>
                                  list.uuid === data.data.uuid
                                    ? { ...list, status: checked }
                                    : list
                                )
                              );
                            }
                          }}
                          className={`${service.status
                            ? "!bg-[#6BAE41]"
                            : "!bg-[#E06D5E]"
                            } data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500`}
                        />
                        <DropdownActions options={options} />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <Accordion
        type="multiple"
        defaultValue={["services", "packages"]}
        className="w-full space-y-4"
      >


        <Pagination<Services>
          data={data}
          dataName="Services"
          userType={userType}
          onPageChange={(page, paginatedData) => setPaginatedServices(paginatedData)}
        />

        <AccordionItem value="packages">
          <AccordionTrigger
            className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] uppercase ${userType}-text-svg [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
            style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}
          >
            Packages
          </AccordionTrigger>

          <AccordionContent>
            <Table className="font-alexandria">
              <TableHeader>
                <TableRow className="h-[54px]" style={{ backgroundColor: `var(--${userType}-page-bg, #E4E4E4)` }}>
                  <TableHead className="text-[14px] font-[700] text-[#7D7D7D] pl-[20px]">
                    Name
                  </TableHead>
                  <TableHead className="text-[14px] font-[700] text-[#7D7D7D] pl-[20px]">
                    Services
                  </TableHead>
                  <TableHead className="text-[14px] font-[700] text-[#7D7D7D] pl-[20px]">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  // Skeleton Loading State for Packages
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index} className="h-[54px] bg-white border-b border-[#E4E4E4]">
                      <TableCell className="pl-[20px]"><Skeleton className="h-4 w-[100px] bg-gray-200" /></TableCell>
                      <TableCell className="pl-[20px]"><Skeleton className="h-4 w-[150px] bg-gray-200" /></TableCell>
                      <TableCell className="pl-[20px]"><Skeleton className="h-6 w-[30px] bg-gray-200 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedPackages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No Packages Found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPackages.map((pkg, i) => {
                    const options = [
                      {
                        label: "Edit",
                        onClick: () => {
                          if (pkg.uuid) {
                            router.push(
                              `/dashboard/services/create/${pkg.uuid}?isPackage=true`
                            );
                          }
                        },
                      },
                      {
                        label: "Delete",
                        onClick: () => handleDelete(pkg.uuid ?? ''),
                        confirm1: true,
                      },
                    ];
                    return (
                      <TableRow key={i}>
                        <TableCell
                          className={`text-[15px] font-[400] ${userType}-text pl-[20px]`}
                        >
                          {pkg.name}
                        </TableCell>
                        <TableCell className="text-[15px] font-[400] pl-[20px] text-[#666666]">
                          {pkg?.services
                            ?.slice(0, 3)
                            .map((src) => src.name)
                            .join(", ")}
                          {pkg?.services?.length > 3 && " ..."}
                        </TableCell>

                        <TableCell className="text-[15px] font-[400] pl-[20px] text-[#666666] flex justify-between items-center">
                          <Switch
                            className={`${pkg.status ? "!bg-[#6BAE41]" : "!bg-[#E06D5E]"
                              } data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500`}
                            checked={!!pkg.status}
                          />
                          <DropdownActions options={options} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {packagesData && packagesData.length > 0 && (
              <Pagination<Packages>
                data={packagesData}
                dataName="Packages"
                userType={userType}
                onPageChange={(page, paginatedData) => setPaginatedPackages(paginatedData)}
              />
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
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