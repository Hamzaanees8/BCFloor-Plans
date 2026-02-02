"use client";
import QuickViewCard, { VendorData } from '@/components/QuickViewCard';
import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link';
import { toast } from 'sonner';
import { Delete, Get } from './vendors';
import { Vendor } from '@/lib/types';
import { usePermissions } from '@/app/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions';
import { useAppContext } from '@/app/context/AppContext';
import { useWhiteLabel } from '@/app/context/Whitelabel';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import DropdownActions from "@/components/DropdownActions";
import { useRouter } from "next/navigation";
import { UpdateStatus } from './vendors';

const Page = () => {
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];
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

    const [showCard, setShowCard] = React.useState(false);
    const [vendorData, setVendorData] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    const [selectedData, setSelectedData] = useState<VendorData | null>(null);
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
                            setShowCard(true);
                            setSelectedData(data);
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
                    .filter(Boolean);

                const allServices = serviceNames.join(", ");

                if (serviceNames.length > 3) {
                    const firstThree = serviceNames.slice(0, 3).join(", ");
                    return (
                        <div
                            className="text-[#666666] cursor-help"
                            title={allServices}
                        >
                            {firstThree}...
                        </div>
                    );
                }

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

                                    setShowCard(true);
                                    setSelectedData(vendor);
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
                                onClick: () => handleDelete(row.original.uuid ?? ""),
                                confirm1: true,
                            }
                        ]}
                        data={selectedVendors}
                    />
                );
            },
        }

    ];


    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.log('Token not found.')
            setLoading(false);
            setError(true);
            return;
        }
        setLoading(true);
        setError(false);

        Get()
            .then(res => {
                if (Array.isArray(res.data)) {
                    setVendorData(res.data);
                } else {
                    setVendorData([]);
                }
            })
            .catch(err => {
                console.log(err.message);
                setError(true);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleDelete = async (userId: string) => {
        try {
            await Delete(userId);
            toast.success('vendor deleted successfully');
            setVendorData(prev => prev.filter(vendor => vendor.uuid !== userId));
        } catch (error) {
            if (error instanceof Error) {
                console.error('Delete failed:', error.message);
                toast.error(error.message || 'Failed to delete vendor');
            } else {
                console.error('Delete failed:', error);
                toast.error('Failed to delete vendor');
            }
        }
    };
    const length = vendorData.length;
    const { hasPermission } = usePermissions();

    // Check if user can create vendors
    const canCreateVendor = userType !== 'admin' || hasPermission(PERMISSIONS.CREATE_VENDOR);

    return (
        <div>
            <div ref={headerRef} className='w-full h-[80px] font-alexandria sticky top-0 z-50 flex justify-between px-[20px] items-center' style={{ backgroundColor: roleSettings.pageBg, boxShadow: "0px 4px 4px #0000001F" }} >
                <p className='text-[16px] md:text-[24px] font-[400]' style={{ color: roleSettings.pageTabColor }}>Vendors ({length})</p>
                {canCreateVendor && (
                    <Link
                        href={'/dashboard/vendors/create'}

                        className='w-[110px] md:w-[143px] h-[35px] md:h-[44px] justify-center rounded-[6px] border-[1px] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:brightness-110'
                        style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
                    >
                        + New Vendor
                    </Link>
                )}
            </div>

            <div className="w-full">
                <DataTable
                    columns={columns}
                    data={vendorData}
                    loading={loading}
                    error={error}
                    dataName="Vendors"
                    userType={userType}
                />
                {showCard && selectedData && (
                    <QuickViewCard
                        type="vendors"
                        data={selectedData}
                        onClose={() => setShowCard(false)}
                    />
                )}

            </div>
        </div >
    )
}

export default Page