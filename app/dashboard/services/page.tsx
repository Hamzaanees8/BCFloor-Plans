"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { CleanedProductOption, GetPackages, GetServices, UpdateServiceStatus, DeleteService, UpdatePackageStatus, BulkUpdateServiceSort } from './services';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import { useAppContext } from '@/app/context/AppContext';
import { useWhiteLabel } from '@/app/context/Whitelabel';
import { usePermissions } from '@/app/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions';
import { DataTable } from '@/components/DataTable';
import { DraggableServiceTable } from '@/components/DraggableServiceTable';
import { ColumnDef, Row } from "@tanstack/react-table";
import { Switch } from "@/components/ui/switch";
import DropdownActions from "@/components/DropdownActions";
import ImagePopup from "@/components/ImagePopup";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


export interface Services {
  uuid: string;
  id: number;
  name?: string;
  description?: string;
  category?: { name: string; type?: string[] };
  background_color?: string;
  border_color?: string;
  thumbnail?: string
  thumbnail_url?: string
  status?: boolean;
  is_travel_required?: boolean;
  type?: string;
  duration?: boolean;
  service_add_ons: {
    title?: string;
    amount?: number;
    uuid?: string;
  }[];
  product_options: CleanedProductOption[];
  vendor_services: {
    uuid: string;
    name: string;
    status: boolean;
    time_needed: number;
    hourly_rate: string;
    vendor: {
      first_name: string;
      last_name: string;
      uuid: string;
      email: string;
      primary_phone: string;
      homebase_address: {
        city: string;
        state: string;
        country: string;
        address_line_1: string;
      }
    }
  }[]
}
export interface Packages {
  id: number;
  uuid?: string;
  name?: string;
  status?: boolean;
  services: Services[];
  discount?: number;
}

const Page = () => {
  const { userType } = useAppContext();
  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string) || 'admin';
  const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

  const [servicesData, setServicesData] = useState<Services[]>([]);
  const [packagesData, setPackagesData] = useState<Packages[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const { hasPermission } = usePermissions();

  const [imagePopupOpen, setImagePopupOpen] = React.useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = React.useState<string | undefined>(undefined);
  const router = useRouter();
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    let ancestor = header.parentElement;
    while (ancestor) {
      const style = window.getComputedStyle(ancestor);
      if (style.overflowX === 'hidden' || ancestor.classList.contains('overflow-x-hidden')) {
        ancestor.style.setProperty('overflow-x', 'visible', 'important');
        ancestor.style.setProperty('overflow-y', 'visible', 'important');

        const target = ancestor;
        return () => {
          target.style.removeProperty('overflow-x');
          target.style.removeProperty('overflow-y');
        };
      }
      ancestor = ancestor.parentElement;
    }
  }, []);

  const headerBg = `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`;

  const handleUpdateStatus = async (serviceId: string, status: boolean) => {
    try {
      const token = localStorage.getItem("token") || "";
      const payload = {
        status: status ? 1 : 0,
        _method: "PUT",
      };

      const result = await UpdateServiceStatus(serviceId, payload, token);
      toast.success("Service status updated successfully");
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        toast.error(error.message || "Failed to submit user data");
      }
    }
  };

  const handleUpdatePackageStatus = async (packageId: string, status: boolean) => {
    try {
      const token = localStorage.getItem("token") || "";
      const payload = {
        status: status ? 1 : 0,
      };

      const result = await UpdatePackageStatus(packageId, payload, token);
      toast.success("Package status updated successfully");
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        toast.error(error.message || "Failed to update package status");
      }
    }
  };

  const handleDelete = async (listingId: string, isPackage = false) => {
    try {
      const token = localStorage.getItem("token") || "";
      await DeleteService(listingId, token);
      toast.success(isPackage ? "Package deleted successfully" : "Service deleted successfully");
      if (isPackage) {
        setPackagesData((prev) => prev.filter((pkg) => pkg.uuid !== listingId));
      } else {
        setServicesData((prev) => prev.filter((service) => service.uuid !== listingId));
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Delete failed:", error.message);
        toast.error(error.message || "Failed to delete");
      } else {
        console.error("Delete failed:", error);
        toast.error("Failed to delete");
      }
    }
  };

  const handleReorderServices = async (reorderedData: Services[]) => {
    setServicesData(reorderedData);

    try {
      const token = localStorage.getItem("token") || "";
      const payload = {
        services: reorderedData.map((service, index) => ({
          uuid: service.uuid,
          sort_order: index + 1,
        })),
      };

      await BulkUpdateServiceSort(payload, token);
      toast.success("Services sorted successfully.");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
        toast.error(error.message || "Failed to save new sort order.");
      }
    }
  };

  const serviceColumns: ColumnDef<Services>[] = [
    {
      accessorKey: "name",
      header: "Description",
      cell: ({ row }) => (
        <div
          className={`text-[15px] flex justify-start gap-4 items-center font-[400]`}
          style={{ color: roleSettings.pageTabColor }}
        >
          <div
            onClick={() => {
              setSelectedImageUrl(row.original.thumbnail_url);
              setImagePopupOpen(true);
            }}
            className="cursor-pointer rounded-full border border-gray-300"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={row.original.thumbnail_url}
              alt={row.original.name}
              className="w-[40px] h-[40px] object-cover rounded-full bg-gray-200"
            />
          </div>
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: "category.name",
      header: "Category",
      cell: ({ row }) => (
        <div className="text-[15px] font-[400]" style={{ color: roleSettings.pageText }}>
          {row.original.category?.name}
        </div>
      )
    },
    {
      header: "Color",
      cell: ({ row }) => (
        <div className="text-[15px] font-[400] text-[#7D7D7D]">
          <div
            className="w-[20px] h-[20px] rounded-full"
            style={{
              backgroundColor: row.original.background_color,
              border: `1px solid ${row.original.border_color}`,
            }}
          ></div>
        </div>
      )
    },
    ...(userType !== "vendor" ? [{
      header: "Status",
      id: "status",
      cell: ({ row }: { row: Row<Services> }) => {
        const service = row.original;
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
          <div className="text-[15px] font-[400] text-[#7D7D7D] flex justify-between items-center gap-2 pr-[20px]">
            <Switch
              checked={!!service.status}
              onCheckedChange={async (checked) => {
                const data = await handleUpdateStatus(
                  service.uuid || "",
                  checked
                );
                if (data?.data?.uuid) {
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
          </div>
        )
      }
    }] : [])
  ];

  const packageColumns: ColumnDef<Packages>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div
          className={`text-[15px] font-[400]`}
          style={{ color: roleSettings.pageTabColor }}
        >
          {row.original.name}
        </div>
      )
    },
    {
      header: "Services",
      cell: ({ row }) => (
        <div className="text-[15px] font-[400]" style={{ color: roleSettings.pageText }}>
          {row.original.services
            ?.slice(0, 3)
            .map((src) => src.name)
            .join(", ")}
          {row.original.services?.length > 3 && " ..."}
        </div>
      )
    },
    {
      header: "Status",
      cell: ({ row }) => {
        const pkg = row.original;
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
            onClick: () => handleDelete(pkg.uuid ?? '', true),
            confirm1: true,
          },
        ];

        return (
          <div className="text-[15px] font-[400] text-[#666666] flex justify-between items-center pr-[20px]">
            <Switch
              className={`${pkg.status ? "!bg-[#6BAE41]" : "!bg-[#E06D5E]"
                } data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500`}
              checked={!!pkg.status}
              onCheckedChange={async (checked) => {
                const data = await handleUpdatePackageStatus(
                  pkg.uuid || "",
                  checked
                );
                if (data?.data?.uuid) {
                  setPackagesData((prev: Packages[]) =>
                    prev.map((p: Packages) =>
                      p.uuid === data.data.uuid
                        ? { ...p, status: checked }
                        : p
                    )
                  );
                }
              }}
            />
            <DropdownActions options={options} />
          </div>
        )
      }
    }

  ];

  // Check if user can create services
  const canCreateService = userType !== 'admin' || hasPermission(PERMISSIONS.CREATE_SERVICES);

  useEffect(() => {
    const token = localStorage.getItem("token")

    if (!token) {
      console.log("Token not found.");
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    GetPackages(token)
      .then((data) => {
        setPackagesData(Array.isArray(data.data) ? data.data : []);
      })
      .catch(err => {
        console.log(err.message);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token")

    if (!token) {
      console.log("Token not found.");
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    GetServices(token)
      .then((data) => {
        setServicesData(Array.isArray(data.data) ? data.data : []);
      })
      .catch(err => {
        console.log(err.message);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


  return (
    <ProtectedAdminRoute>
      <div style={{ backgroundColor: roleSettings.pageBg, minHeight: '100vh', color: roleSettings.pageText }}>
        <div ref={headerRef} className='w-full h-[80px] font-alexandria z-[50] sticky top-0 flex justify-between px-[20px] items-center' style={{ position: 'sticky', top: 0, backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg} 90%, black)`, boxShadow: "0px 4px 4px #0000001F" }}>
          <p className='text-[16px] md:text-[24px] font-[400]' style={{ color: roleSettings.pageTabColor }}>
            Services ({servicesData.length})
          </p>
          <div className='flex space-x-3'>
            {/* <Link href={'/dashboard/services/create'} className='w-[110px] rounded-[6px] md:w-[143px] h-[35px] md:h-[44px]  border-[1px] border-[#4290E9] bg-[#EEEEEE] text-[14px] md:text-[16px] font-[400] text-[#4290E9] flex gap-[5px] justify-center items-center hover:text-[#fff] hover:bg-[#4290E9]'>+ Package</Link> */}
            {(userType !== 'vendor' && canCreateService) && (
              <Link
                href={'/dashboard/services/create'}
                className='w-[110px] rounded-[6px] md:w-[143px] h-[35px] md:h-[44px] border-[1px] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] justify-center items-center hover:brightness-110'
                style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
              >
                + New Service
              </Link>
            )}
          </div>
        </div>

        <div className="w-full">
          <DraggableServiceTable
            data={servicesData}
            columns={serviceColumns}
            loading={loading}
            error={error}
            dataName="Services"
            userType={userType}
            headerBgOverride={headerBg}
            onReorder={handleReorderServices}
          />

          <Accordion
            type="multiple"
            defaultValue={["packages"]}
            className="w-full space-y-4"
          >
            <AccordionItem value="packages">
              <AccordionTrigger
                className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] text-[18px] font-[600] uppercase [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:text-current animate-none`}
                style={{ backgroundColor: headerBg, color: roleSettings.pageTabColor }}
              >
                Packages
              </AccordionTrigger>
              <AccordionContent>
                <DataTable
                  data={packagesData || []}
                  columns={packageColumns}
                  loading={loading}
                  error={error}
                  dataName="Packages"
                  userType={userType}
                  headerBgOverride={headerBg}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
    </ProtectedAdminRoute>
  );
};

export default Page;
