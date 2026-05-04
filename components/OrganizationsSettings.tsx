"use client";
import React, { useState, useEffect, useCallback } from "react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import DropdownActions from "./DropdownActions";
import {
    Organization,
    GetOrganizations,
    DeleteOrganization,
    UpdateOrganization,
} from "@/app/dashboard/global-settings/global-settings";
import CreateOrganizationDialog from "./CreateOrganizationDialog";
import { DateTime } from "luxon";

const OrganizationsSettings = () => {
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || "admin";
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings["admin"];

    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editTarget, setEditTarget] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchOrganizations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await GetOrganizations();
            setOrganizations(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load organizations");
            setOrganizations([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrganizations();
    }, [fetchOrganizations]);

    const handleDelete = async (uuid: string) => {
        try {
            await DeleteOrganization(uuid);
            setOrganizations((prev) => prev.filter((o) => o.uuid !== uuid));
            toast.success("Organization deleted successfully");
        } catch (err) {
            const e = err as Error;
            toast.error(e.message || "Failed to delete organization");
        }
    };

    const handleToggleStatus = async (uuid: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        // Optimistic update
        setOrganizations((prev) =>
            prev.map((o) => (o.uuid === uuid ? { ...o, is_active: newStatus } : o))
        );
        try {
            await UpdateOrganization(uuid, { is_active: newStatus });
            toast.success(`Organization ${newStatus ? "activated" : "deactivated"}`);
        } catch (err) {
            // Revert
            setOrganizations((prev) =>
                prev.map((o) => (o.uuid === uuid ? { ...o, is_active: currentStatus } : o))
            );
            const e = err as Error;
            toast.error(e.message || "Failed to update status");
        }
    };

    const columns: ColumnDef<Organization>[] = [
        {
            accessorKey: "name",
            header: "NAME",
            cell: ({ row }) => (
                <div className="font-medium text-[#444]">{row.getValue("name")}</div>
            ),
        },
        {
            accessorKey: "slug",
            header: "SLUG",
            cell: ({ row }) => (
                <div className="text-[#666666] font-mono text-xs">{row.getValue("slug") || "—"}</div>
            ),
        },
        {
            accessorKey: "domain",
            header: "DOMAIN",
            cell: ({ row }) => (
                <div className="text-[#666666] text-xs">{row.getValue("domain") || "—"}</div>
            ),
        },
        {
            accessorKey: "contact_email",
            header: "CONTACT EMAIL",
            cell: ({ row }) => (
                <div className="text-[#666666]">{row.getValue("contact_email") || "—"}</div>
            ),
        },
        {
            accessorKey: "contact_phone",
            header: "PHONE",
            cell: ({ row }) => (
                <div className="text-[#666666]">{row.getValue("contact_phone") || "—"}</div>
            ),
        },
        {
            accessorKey: "city",
            header: "CITY",
            cell: ({ row }) => (
                <div className="text-[#666666]">{row.getValue("city") || "—"}</div>
            ),
        },
        {
            accessorKey: "trial_ends_at",
            header: "TRIAL ENDS",
            cell: ({ row }) => {
                const val = row.getValue("trial_ends_at") as string | null;
                if (!val) return <div className="text-[#666666]">—</div>;
                return (
                    <div className="text-[#666666]">
                        {DateTime.fromISO(val).toFormat("LLL dd, yyyy")}
                    </div>
                );
            },
        },
        {
            accessorKey: "is_active",
            header: "STATUS",
            cell: ({ row }) => {
                const isActive = row.original.is_active;
                return (
                    <div className="flex items-center gap-[10px]">
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={isActive}
                                onCheckedChange={() =>
                                    handleToggleStatus(row.original.uuid, isActive)
                                }
                                className={
                                    isActive
                                        ? "data-[state=checked]:bg-[#6BAE41]"
                                        : "data-[state=unchecked]:bg-red-500"
                                }
                            />
                        </div>
                        <DropdownActions
                            options={[
                                {
                                    label: "Edit",
                                    onClick: () => {
                                        setEditTarget(row.original);
                                        setOpenDialog(true);
                                    },
                                },
                                {
                                    label: "Delete",
                                    onClick: () => handleDelete(row.original.uuid),
                                    confirm1: true,
                                },
                            ]}
                        />
                    </div>
                );
            },
        },
    ];

    const accentColor = userType === "admin" ? "#4290E9" : "#6BAE41";

    return (
        <div className="w-full flex-col flex rounded-lg">
            {/* Header */}
            <div
                className="flex items-center justify-between w-full px-4 py-4"
                style={{
                    backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg}, black 10%)`,
                }}
            >
                <p
                    className="text-[18px] font-semibold uppercase"
                    style={{ color: accentColor }}
                >
                    ORGANIZATIONS
                </p>
                <div
                    onClick={() => {
                        setEditTarget(null);
                        setOpenDialog(true);
                    }}
                    className="flex items-center gap-x-[10px] cursor-pointer"
                >
                    <p
                        className="text-base font-semibold font-raleway"
                        style={{ color: accentColor }}
                    >
                        Create Organization
                    </p>
                    <Plus
                        className={`w-[18px] h-[18px] ${userType}-bg text-white rounded-sm`}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="w-full mt-4">
                <DataTable
                    data={organizations}
                    columns={columns}
                    loading={loading}
                    error={false}
                    dataName="Organizations"
                    userType={userType}
                />
            </div>

            {/* Dialog */}
            <CreateOrganizationDialog
                open={openDialog}
                setOpen={(open) => {
                    setOpenDialog(open);
                    if (!open) setEditTarget(null);
                }}
                onSuccess={fetchOrganizations}
                initialData={editTarget}
            />
        </div>
    );
};

export default OrganizationsSettings;
