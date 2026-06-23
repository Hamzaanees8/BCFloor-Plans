"use client";
import QuickViewCard, { VendorData } from '@/components/QuickViewCard';
import React, { useEffect, useState, useRef, useMemo } from 'react'
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
import { useIsMobile } from '@/hooks/use-mobile';
import MobileVendorsList from '@/components/mobile/vendors/MobileVendorsList';
import { useUser } from "@/context/UserContext";
import { GetOrganizations } from "@/app/dashboard/global-settings/global-settings";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const Page = () => {
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];
    const headerRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile();

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
    const { isSuperAdmin } = useUser();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [orgFilter, setOrgFilter] = useState<string>("all");

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    const [selectedData, setSelectedData] = useState<VendorData | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (isSuperAdmin) {
            GetOrganizations()
                .then(res => {
                    if (res.status && Array.isArray(res.data)) {
                        setOrganizations(res.data);
                    }
                })
                .catch(err => console.error("Failed to fetch organizations:", err));
        }
    }, [isSuperAdmin]);

    const filteredVendors = useMemo(() => {
        return vendorData.filter(vendor => {
            if (orgFilter !== "all" && String(vendor.organization_id) !== orgFilter) {
                return false;
            }
            return true;
        });
    }, [vendorData, orgFilter]);

    const handleUpdateStatus = React.useCallback(async (userId: string, status: boolean) => {
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
    }, []);

    const handleDelete = React.useCallback(async (userId: string) => {
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
    }, [setVendorData]);

    const columns = useMemo<ColumnDef<Vendor>[]>(() => {
        const cols: ColumnDef<Vendor>[] = [
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

        if (isSuperAdmin) {
            cols.splice(2, 0, {
                accessorKey: "organization",
                header: "ORGANIZATION",
                cell: ({ row }) => {
                    const org = row.original.organization;
                    return <div className="text-[#666666]">{org?.name || "Global / None"}</div>;
                }
            });
        }

        return cols;
    }, [isSuperAdmin, router, handleUpdateStatus, handleDelete]);


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

    const length = filteredVendors.length;
    const { hasPermission } = usePermissions();

    // Check if user can create vendors
    const canCreateVendor = userType !== 'admin' || hasPermission(PERMISSIONS.CREATE_VENDOR);

    if (isMobile) {
        return (
            <div className="font-alexandria pb-16">
                {/* Header */}
                <div
                    className="w-full h-14 z-50 sticky top-0 flex justify-between px-4 items-center border-b shadow-sm"
                    style={{ backgroundColor: roleSettings.pageBg }}
                >
                    <p className="text-base font-medium" style={{ color: roleSettings.pageTabColor }}>
                        Vendors ({length})
                    </p>
                    <div className="flex items-center gap-2">
                        {isSuperAdmin && (
                            <Select value={orgFilter} onValueChange={setOrgFilter}>
                                <SelectTrigger className="h-8 text-xs border bg-white rounded-md w-28">
                                    <SelectValue placeholder="All Orgs" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[250px]">
                                    <SelectItem value="all">All Orgs</SelectItem>
                                    {organizations.map((org) => (
                                        <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {canCreateVendor && (
                            <Link
                                href={'/dashboard/vendors/create'}
                                className="text-xs px-3 py-1.5 rounded-md text-white font-medium hover:brightness-110"
                                style={{ backgroundColor: roleSettings.pageTabColor }}
                            >
                                + New Vendor
                            </Link>
                        )}
                    </div>
                </div>

                <MobileVendorsList
                    vendors={filteredVendors}
                    loading={loading}
                    error={error}
                    userType={userType}
                    isSuperAdmin={isSuperAdmin}
                    onQuickView={(vendor) => {
                        setShowCard(true);
                        setSelectedData(vendor);
                    }}
                    onEdit={(uuid) => router.push(`/dashboard/vendors/create/${uuid}`)}
                    handleDelete={handleDelete}
                    handleUpdateStatus={handleUpdateStatus}
                />

                {showCard && selectedData && (
                    <QuickViewCard
                        type="vendors"
                        data={selectedData}
                        onClose={() => setShowCard(false)}
                    />
                )}
            </div>
        );
    }

    return (
        <div>
            <div ref={headerRef} className='w-full h-[80px] font-alexandria sticky top-0 z-50 flex justify-between px-[20px] items-center' style={{ backgroundColor: roleSettings.pageBg, boxShadow: "0px 4px 4px #0000001F" }} >
                <p className='text-[16px] md:text-[24px] font-[400]' style={{ color: roleSettings.pageTabColor }}>Vendors ({length})</p>
                <div className="flex items-center gap-3">
                    {isSuperAdmin && (
                        <Select value={orgFilter} onValueChange={setOrgFilter}>
                            <SelectTrigger className="w-[180px] h-[35px] md:h-[42px] text-[#666666] border border-[#BBBBBB] rounded-[6px]" style={{ backgroundColor: roleSettings.pageBg }}>
                                <SelectValue placeholder="All Organizations" />
                            </SelectTrigger>
                            <SelectContent className="border border-[#BBBBBB]" style={{ backgroundColor: roleSettings.pageBg }}>
                                <SelectItem value="all">All Organizations</SelectItem>
                                {organizations.map((org) => (
                                    <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
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
            </div>

            <div className="w-full">
                <DataTable
                    columns={columns}
                    data={filteredVendors}
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