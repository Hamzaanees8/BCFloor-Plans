"use client";
import React, { useState, useEffect, useCallback } from "react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import DropdownActions from "./DropdownActions";
import { Permission, GetPermissions, DeletePermission } from "@/app/dashboard/global-settings/permissions";
import AddPermissionDialog from "./AddPermissionDialog";
import { DateTime } from "luxon";

const PermissionsSettings = () => {
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [permissionToEdit, setPermissionToEdit] = useState<Permission | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPermissions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await GetPermissions();
            if (res.status && res.data) {
                setPermissions(res.data);
            } else {
                setPermissions([]);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load permissions");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    const handleDelete = async (id: number) => {
        try {
            const res = await DeletePermission(id);
            if (res.status !== false) {
                setPermissions((prev) => prev.filter(p => p.id !== id));
                toast.success("Permission deleted successfully");
            } else {
                toast.error(res.message || "Failed to delete permission");
            }
        } catch {
            toast.error("Failed to delete permission");
        }
    };

    const columns: ColumnDef<Permission>[] = [
        {
            accessorKey: "id",
            header: "ID",
            cell: ({ row }) => <div className="text-[#666666]">{row.getValue("id")}</div>,
        },
        {
            accessorKey: "name",
            header: "PERMISSION NAME",
            cell: ({ row }) => <div className="text-[#666666] font-semibold">{row.getValue("name")}</div>,
        },
        {
            accessorKey: "guard_name",
            header: "GUARD",
            cell: ({ row }) => <div className="text-[#666666]">{row.getValue("guard_name") || "-"}</div>,
        },
        {
            accessorKey: "updated_at",
            header: "LAST UPDATED",
            cell: ({ row }) => {
                const dateStr = row.getValue("updated_at") as string;
                if (!dateStr) return <div className="text-[#666666]">-</div>;
                return <div className="text-[#666666]">{DateTime.fromISO(dateStr).toFormat("LLL dd, yyyy")}</div>;
            },
        },
        {
            id: "actions",
            header: "ACTIONS",
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-[10px]">
                        <DropdownActions
                            options={[
                                {
                                    label: "Edit",
                                    onClick: () => {
                                        setPermissionToEdit(row.original);
                                        setOpenAddDialog(true);
                                    },
                                },
                                {
                                    label: "Delete",
                                    onClick: () => handleDelete(row.original.id),
                                    confirm1: true,
                                },
                            ]}
                        />
                    </div>
                );
            },
        },
    ];

    return (
        <div className="w-full flex-col flex rounded-lg">
            <div className="flex items-center justify-between w-full pb-4 px-4 py-4" style={{ backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg}, black 10%)` }}>
                <p className={`text-[18px] font-semibold uppercase ${userType === "admin" ? "[&>svg]:text-[#4290E9] text-[#4290E9]" : "[&>svg]:text-[#6BAE41] text-[#6BAE41]"}`}>PERMISSIONS</p>
                <div className="flex items-center gap-x-6">
                    <div
                        onClick={() => {
                            setPermissionToEdit(null);
                            setOpenAddDialog(true);
                        }}
                        className="flex items-center gap-x-[10px] cursor-pointer"
                    >
                        <p className={`text-base font-semibold font-raleway ${userType === "admin" ? "[&>svg]:text-[#4290E9] text-[#4290E9]" : "[&>svg]:text-[#6BAE41] text-[#6BAE41]"}`}>Add Permission</p>
                        <Plus className={`w-[18px] h-[18px] ${userType}-bg text-white rounded-sm`} />
                    </div>
                </div>
            </div>
            <div className="w-full mt-4">
                <DataTable
                    data={permissions}
                    columns={columns}
                    loading={loading}
                    error={false}
                    dataName="Permissions"
                    userType={userType}
                />
            </div>

            <AddPermissionDialog
                open={openAddDialog}
                setOpen={(open) => {
                    setOpenAddDialog(open);
                    if (!open) setPermissionToEdit(null);
                }}
                onSuccess={fetchPermissions}
                initialData={permissionToEdit}
            />
        </div>
    );
};

export default PermissionsSettings;
