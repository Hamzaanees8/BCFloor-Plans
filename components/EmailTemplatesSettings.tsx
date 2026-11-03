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
import { EmailTemplate, GetTemplates, DeleteTemplate, UpdateTemplate } from "@/app/dashboard/global-settings/templates";
import AddTemplateDialog from "./AddTemplateDialog";
import { DateTime } from "luxon";
import SignatureCreatorDialog from "./SignatureCreatorDialog";
import { Signature, GetSignatures, DeleteSignature } from "@/app/dashboard/global-settings/signatures";
import { GetCompany } from "@/app/dashboard/global-settings/global-settings";

const EmailTemplatesSettings = () => {
    const { userType, organizationId, setOrganizationId } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<EmailTemplate | null>(null);
    const [signatureToEdit, setSignatureToEdit] = useState<Signature | null>(null);
    const [loading, setLoading] = useState(true);
    const [sigsLoading, setSigsLoading] = useState(true);

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const res = await GetTemplates();
            if (res.success && res.data) {
                setTemplates(res.data);
            } else {
                setTemplates([]);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load templates");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSignatures = useCallback(async (uuid: string) => {
        setSigsLoading(true);
        try {
            const res = await GetSignatures(uuid);
            if (res.status !== false && res.data) {
                setSignatures(res.data);
            } else {
                setSignatures([]);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load signatures");
        } finally {
            setSigsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();

        const initSigs = async () => {
            let orgId = organizationId;
            
            if (!orgId) {
                try {
                    const userInfoStr = typeof window !== 'undefined' ? localStorage.getItem('userInfo') : null;
                    if (userInfoStr) {
                        const userInfo = JSON.parse(userInfoStr);
                        orgId = userInfo?.organization?.uuid || userInfo?.data?.organization?.uuid || userInfo?.data?.uuid || userInfo?.organization_uuid;
                    }
                } catch (e) {
                    console.error('Failed to parse userInfo:', e);
                }
            }

            if (orgId) {
                setOrganizationId(orgId);
                fetchSignatures(orgId);
                return;
            }

            try {
                const res = await GetCompany();
                if (res.status && res.data?.uuid) {
                    setOrganizationId(res.data.uuid);
                    fetchSignatures(res.data.uuid);
                }
            } catch (err) {
                console.error("Failed to fetch organization for signatures", err);
            }
        };
        initSigs();
    }, [fetchTemplates, fetchSignatures, organizationId, setOrganizationId]);

    const handleSignatureDelete = async (sigUuid: string) => {
        if (!organizationId) return;
        try {
            const res = await DeleteSignature(sigUuid);
            if (res.status !== false) {
                setSignatures((prev) => prev.filter(s => s.uuid !== sigUuid));
                toast.success("Signature deleted successfully");
            } else {
                toast.error(res.message || "Failed to delete signature");
            }
        } catch {
            toast.error("Failed to delete signature");
        }
    };

    const handleDelete = async (uuid: string) => {
        try {
            const res = await DeleteTemplate(uuid);
            if (res.success !== false) {
                setTemplates((prev) => prev.filter(t => t.uuid !== uuid));
                toast.success("Template deleted successfully");
            } else {
                toast.error(res.message || "Failed to delete template");
            }
        } catch {
            toast.error("Failed to delete template");
        }
    };

    const handleToggleStatus = async (uuid: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        try {
            setTemplates((prev) => prev.map(t => t.uuid === uuid ? { ...t, is_active: newStatus } : t));

            const res = await UpdateTemplate(uuid, { is_active: newStatus });
            if (res.success !== false) {
                toast.success("Template status updated");
            } else {
                setTemplates((prev) => prev.map(t => t.uuid === uuid ? { ...t, is_active: currentStatus } : t));
                toast.error(res.message || "Failed to update status");
            }
        } catch {
            setTemplates((prev) => prev.map(t => t.uuid === uuid ? { ...t, is_active: currentStatus } : t));
            toast.error("Failed to update status");
        }
    };

    const columns: ColumnDef<EmailTemplate>[] = [
        {
            accessorKey: "sort_order",
            header: "ORDER",
            cell: ({ row }) => <div className="text-[#666666] font-mono text-xs">{row.getValue("sort_order") ?? "-"}</div>,
        },
        {
            accessorKey: "title",
            header: "TITLE",
            cell: ({ row }) => <div className="text-[#333333] font-semibold text-xs">{row.getValue("title")}</div>,
        },
        {
            accessorKey: "type",
            header: "EVENT / TYPE",
            cell: ({ row }) => {
                const typeVal = row.original.event_type || row.original.type || "-";
                const eventMap: Record<string, string> = {
                    order_created: "Order Created",
                    order_updated: "Order Updated",
                    order_cancelled: "Order Cancelled",
                    slot_booked: "Slot Booked",
                    slot_cancelled: "Slot Cancelled",
                    slot_rescheduled: "Slot Rescheduled",
                    booking_reminder: "Booking Reminder",
                    service_completed: "Service Completed",
                    media_uploaded: "Media Uploaded",
                    agent_payment_received: "Payment Received",
                    vendor_payment_processed: "Vendor Payout",
                    invoice_created: "Invoice Created",
                    matterport_expiry_reminder: "3D Tour Expiry",
                    matterport_expired: "3D Tour Expired",
                    matterport_renewed: "3D Tour Renewed",
                    password_reset: "Password Reset",
                };
                const friendlyLabel = eventMap[typeVal] || typeVal;
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-800 text-xs">{friendlyLabel}</span>
                        {friendlyLabel !== typeVal && (
                            <span className="text-[10px] text-gray-400 font-mono">{typeVal}</span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "recipient_type",
            header: "RECIPIENTS",
            cell: ({ row }) => {
                const recipients = row.original.recipient_type;
                if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
                    return (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            All Roles
                        </span>
                    );
                }

                return (
                    <div className="flex flex-wrap gap-1 items-center">
                        {recipients.map((r: string) => {
                            const badgeColor =
                                r === "admin"
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                    : r === "agent"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200";
                            return (
                                <span
                                    key={r}
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold capitalize border ${badgeColor}`}
                                >
                                    {r}
                                </span>
                            );
                        })}
                    </div>
                );
            },
        },
        {
            accessorKey: "updated_at",
            header: "LAST UPDATED",
            cell: ({ row }) => {
                const dateStr = row.getValue("updated_at") as string;
                if (!dateStr) return <div className="text-[#666666] text-xs">-</div>;
                return <div className="text-[#666666] text-xs">{DateTime.fromISO(dateStr).toFormat("LLL dd, yyyy")}</div>;
            },
        },
        {
            accessorKey: "is_active",
            header: "STATUS",
            cell: ({ row }) => {
                const isTemplateActive = row.original.is_active !== undefined ? row.original.is_active : true;
                return (
                    <div className="flex items-center gap-[10px]">
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={isTemplateActive}
                                onCheckedChange={() => handleToggleStatus(row.original.uuid, isTemplateActive)}
                                className={isTemplateActive ? "data-[state=checked]:bg-[#6BAE41]" : "data-[state=unchecked]:bg-red-500"}
                            />
                        </div>
                        <DropdownActions
                            options={[
                                {
                                    label: "Edit",
                                    onClick: () => {
                                        setTemplateToEdit(row.original);
                                        setOpenAddDialog(true);
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

    const signatureColumns: ColumnDef<Signature>[] = [
        {
            accessorKey: "name",
            header: "NAME",
            cell: ({ row }) => <div className="text-[#666666] font-semibold text-xs">{row.getValue("name")}</div>,
        },
        {
            accessorKey: "updated_at",
            header: "LAST UPDATED",
            cell: ({ row }) => {
                const dateStr = row.getValue("updated_at") as string;
                if (!dateStr) return <div className="text-[#666666] text-xs">-</div>;
                return <div className="text-[#666666] text-xs">{DateTime.fromISO(dateStr).toFormat("LLL dd, yyyy")}</div>;
            },
        },
        {
            id: "actions",
            header: "ACTIONS",
            cell: ({ row }) => (
                <div className="flex items-center gap-[10px]">
                    <DropdownActions
                        options={[
                            {
                                label: "Edit",
                                onClick: () => {
                                    setSignatureToEdit(row.original);
                                    setOpenSignatureDialog(true);
                                },
                            },
                            {
                                label: "Delete",
                                onClick: () => handleSignatureDelete(row.original.uuid),
                                confirm1: true,
                            },
                        ]}
                    />
                </div>
            ),
        }
    ];

    return (
        <div className="w-full flex-col flex rounded-lg">
            <div className="flex items-center justify-between w-full pb-4 px-4 py-4" style={{ backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg}, black 10%)` }}>
                <p className={`text-[18px] font-semibold uppercase ${userType === "admin" ? "[&>svg]:text-[#4290E9] text-[#4290E9]" : "[&>svg]:text-[#6BAE41] text-[#6BAE41]"}`}>TEMPLATES</p>
                <div className="flex items-center gap-x-6">
                    <div
                        onClick={() => {
                            setTemplateToEdit(null);
                            setOpenAddDialog(true);
                        }}
                        className="flex items-center gap-x-[10px] cursor-pointer"
                    >
                        <p className={`text-base font-semibold font-raleway ${userType === "admin" ? "[&>svg]:text-[#4290E9] text-[#4290E9]" : "[&>svg]:text-[#6BAE41] text-[#6BAE41]"}`}>Add Template</p>
                        <Plus className={`w-[18px] h-[18px] ${userType}-bg text-white rounded-sm`} />
                    </div>
                </div>
            </div>
            <div className="w-full mt-4">
                <DataTable
                    data={templates}
                    columns={columns}
                    loading={loading}
                    error={false}
                    dataName="Templates"
                    userType={userType}
                />
            </div>

            <div className="flex items-center justify-between w-full pb-4 px-4 py-4 mt-8" style={{ backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg}, black 10%)` }}>
                <p className={`text-[18px] font-semibold uppercase ${userType === "admin" ? "[&>svg]:text-[#4290E9] text-[#4290E9]" : "[&>svg]:text-[#6BAE41] text-[#6BAE41]"}`}>SIGNATURES</p>
                <div
                    onClick={() => {
                        setSignatureToEdit(null);
                        setOpenSignatureDialog(true);
                    }}
                    className="flex items-center gap-x-[10px] cursor-pointer"
                >
                    <p className={`text-base font-semibold font-raleway ${userType === "admin" ? "[&>svg]:text-[#4290E9] text-[#4290E9]" : "[&>svg]:text-[#6BAE41] text-[#6BAE41]"}`}>Create Signature</p>
                    <Plus className={`w-[18px] h-[18px] ${userType}-bg text-white rounded-sm`} />
                </div>
            </div>
            <div className="w-full mt-4">
                <DataTable
                    data={signatures}
                    columns={signatureColumns}
                    loading={sigsLoading}
                    error={false}
                    dataName="Signatures"
                    userType={userType}
                />
            </div>
            <AddTemplateDialog
                open={openAddDialog}
                setOpen={(open) => {
                    setOpenAddDialog(open);
                    if (!open) setTemplateToEdit(null);
                }}
                onSuccess={fetchTemplates}
                initialData={templateToEdit}
            />
            <SignatureCreatorDialog
                open={openSignatureDialog}
                setOpen={(open) => {
                    setOpenSignatureDialog(open);
                    if (!open) setSignatureToEdit(null);
                }}
                onSave={() => {
                    if (organizationId) fetchSignatures(organizationId);
                }}
                initialData={signatureToEdit}
            />
        </div>
    );
};

export default EmailTemplatesSettings;
