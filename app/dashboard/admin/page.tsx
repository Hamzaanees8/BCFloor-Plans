"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react'
import QuickViewCard, { AdminData } from '@/components/QuickViewCard';
import { Delete, Get, UpdateStatus } from './admin';
import Link from 'next/link';
import { toast } from 'sonner';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import { usePermissions } from '@/app/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions';
import { useAppContext } from '@/app/context/AppContext';
import { useWhiteLabel } from '@/app/context/Whitelabel';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import DropdownActions from "@/components/DropdownActions";
import { useRouter } from "next/navigation";
import { Admin } from '@/lib/types';
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
    const router = useRouter();

    const [showCard, setShowCard] = React.useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [showHeader, setShowHeader] = useState(true)
    const [adminData, setAdminData] = useState<Admin[]>([]);
    const { isSuperAdmin } = useUser();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [orgFilter, setOrgFilter] = useState<string>("all");

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    const [selectedData, setSelectedData] = useState<AdminData | null>(null);
    const headerRef = useRef<HTMLDivElement>(null);

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

    const filteredAdmins = useMemo(() => {
        return adminData.filter(admin => {
            if (orgFilter !== "all" && String(admin.organization_id) !== orgFilter) {
                return false;
            }
            return true;
        });
    }, [adminData, orgFilter]);

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

    useEffect(() => {
        Get()
            .then(data => setAdminData(Array.isArray(data.data) ? data.data : []))
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
            toast.success('User deleted successfully');
            setAdminData(prev => prev.filter(admin => admin.uuid !== userId));
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

    // Wrapper for UpdateStatus to fix the checked variable scope issue and state update
    const onStatusChange = async (uuid: string, checked: boolean) => {
        try {
            const payload = {
                status: checked,
                _method: 'PUT'
            };

            const result = await UpdateStatus(uuid, payload);
            toast.success('User updated successfully');

            if (result?.data?.uuid) {
                setAdminData((prev) =>
                    prev.map((admin) =>
                        admin.uuid === result.data.uuid ? { ...admin, status: checked } : admin
                    )
                );
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error(error.message);
                toast.error(error.message || 'Failed to submit user data');
            }
        }
    }

    const onQuickView = (type: string, data: AdminData) => {
        setShowCard(true);
        setSelectedData(data);
    };

    const columns = useMemo<ColumnDef<Admin>[]>(() => {
        const cols: ColumnDef<Admin>[] = [
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
                return (
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
                const roles = row.original.roles || [];
                const permissions = row.original.permissions || [];
                const names = permissions.map(p => p.name);

                // Try to find the most specific role
                const superAdmin = roles.find(r => 
                    r.name?.toLowerCase().includes("super") || 
                    String(r.id) === "1"
                ) || row.original.organization_id == null || row.original.organization_id === "";
                
                const bookingAgent = roles.find(r => 
                    r.name?.toLowerCase().includes("book") || 
                    r.name?.toLowerCase().includes("agent") ||
                    String(r.id) === "3" || 
                    String(r.id) === "4"
                );

                let roleTitle = "Admin";
                let sep = " - ";

                if (superAdmin) {
                    roleTitle = "Super Admin";
                } else if (bookingAgent) {
                    roleTitle = bookingAgent.name || "Booking Agent";
                    sep = " = ";
                } else if (roles.length > 0) {
                    roleTitle = roles[0].name;
                }

                const displayText = (roleTitle === "Super Admin") 
                    ? "Super Admin" 
                    : `${roleTitle}${sep}${names.join(", ")}`;
                return (
                    <div className="text-[#666666] truncate max-w-[300px]" title={displayText}>
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
                        onCheckedChange={(checked) => onStatusChange(uuid || '', checked)}
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
                                onClick: () => handleDelete(row.original.uuid ?? ""),
                                confirm1: true,
                            }
                        ]}
                        data={selectedAdmins}
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
    }, [isSuperAdmin, organizations, router, onStatusChange, handleDelete]);

    const adminLength = filteredAdmins.length;
    const { hasPermission } = usePermissions();

    // Check if user can create admins
    const canCreateAdmin = hasPermission(PERMISSIONS.CREATE_ADMIN);

    return (
        <ProtectedAdminRoute>
            <div>

                <div ref={headerRef} className='w-full h-[80px] font-alexandria z-50 sticky top-0 flex justify-between px-[20px] items-center' style={{ backgroundColor: roleSettings.pageBg, boxShadow: "0px 4px 4px #0000001F" }} >
                    <p className='text-[16px] md:text-[24px] font-[400]' style={{ color: roleSettings.pageTabColor }}>Administrators ({adminLength})</p>
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
                        {canCreateAdmin && (
                            <Link
                                href={'/dashboard/admin/create'}
                                onClick={() => {
                                    console.log('Button Clicked');
                                    setShowHeader(false)
                                }}
                                className='w-[110px] md:w-[143px] h-[35px] md:h-[44px] justify-center rounded-[6px] border-[1px] text-[14px] md:text-[16px] font-[400] text-[#EEEEEE] flex gap-[5px] items-center hover:brightness-110'
                                style={{ backgroundColor: roleSettings.pageTabColor, borderColor: roleSettings.pageTabColor }}
                            >
                                + Admin
                            </Link>
                        )}
                    </div>
                </div>

                <div className="w-full">
                    <DataTable
                        data={filteredAdmins}
                        columns={columns}
                        dataName="Admins"
                        userType={role}
                        loading={loading}
                        error={error}
                        rowClick={(row) => {
                            // Optional: If we want row click to do something, e.g. QuickView
                            const { roles, ...rest } = row;
                            const mappedRoles =
                                roles && roles.length > 0
                                    ? [{ id: String(roles[0].id), name: roles[0].name }] as [{ id: string; name: string | undefined }]
                                    : undefined;
                            onQuickView("admin", { ...rest, roles: mappedRoles });
                        }}
                    />
                    {showCard && selectedData && (
                        <QuickViewCard
                            type="admin"
                            data={selectedData}
                            onClose={() => setShowCard(false)}
                        />
                    )}

                </div>
            </div >
        </ProtectedAdminRoute>
    )
}

export default Page
