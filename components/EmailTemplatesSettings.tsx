"use client";
import React, { useState, useEffect, useCallback } from "react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Eye } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { usePermissions } from "@/app/hooks/usePermissions";
import DropdownActions from "./DropdownActions";
import { EmailTemplate, GetTemplates, DeleteTemplate, UpdateTemplate } from "@/app/dashboard/global-settings/templates";
import AddTemplateDialog from "./AddTemplateDialog";
import TemplatePreviewDialog from "./TemplatePreviewDialog";
import { DateTime } from "luxon";
import SignatureCreatorDialog from "./SignatureCreatorDialog";
import { Signature, GetSignatures, DeleteSignature } from "@/app/dashboard/global-settings/signatures";
import { Organization, GetOrganizations, GetCompany } from "@/app/dashboard/global-settings/global-settings";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export const ORG_COLOR_PALETTE = [
    "#2563EB", // Blue
    "#7C3AED", // Violet
    "#059669", // Emerald
    "#D97706", // Amber
    "#DC2626", // Red
    "#0891B2", // Cyan
    "#4F46E5", // Indigo
    "#C026D3", // Fuchsia
    "#EA580C", // Orange
    "#0D9488", // Teal
    "#9333EA", // Purple
    "#475569", // Slate
];

export const getOrgColor = (orgKey?: string | number | null, orgList: Organization[] = []) => {
    if (!orgKey) return "#6B7280";
    if (orgList.length > 0) {
        const index = orgList.findIndex(
            (o) =>
                o.uuid === orgKey ||
                o.id === orgKey ||
                String(o.id) === String(orgKey) ||
                o.name.toLowerCase() === String(orgKey).toLowerCase()
        );
        if (index !== -1) {
            return ORG_COLOR_PALETTE[index % ORG_COLOR_PALETTE.length];
        }
    }
    const str = String(orgKey);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % ORG_COLOR_PALETTE.length;
    return ORG_COLOR_PALETTE[idx];
};

const EmailTemplatesSettings = () => {
    const { userType, organizationId, setOrganizationId } = useAppContext();
    const { appliedSettings, organizations: contextOrgs } = useWhiteLabel();
    const { isSuperAdmin } = usePermissions();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<string>("all");
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
    const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<EmailTemplate | null>(null);
    const [templateToPreview, setTemplateToPreview] = useState<EmailTemplate | null>(null);
    const [signatureToEdit, setSignatureToEdit] = useState<Signature | null>(null);
    const [loading, setLoading] = useState(true);
    const [sigsLoading, setSigsLoading] = useState(true);

    useEffect(() => {
        if (contextOrgs && contextOrgs.length > 0) {
            setOrganizations(contextOrgs);
        } else {
            GetOrganizations()
                .then((res) => {
                    if (res.status && res.data) {
                        setOrganizations(res.data);
                    }
                })
                .catch((err) => console.error("Failed to load organizations:", err));
        }
    }, [contextOrgs]);

    const fetchTemplates = useCallback(async (orgFilter?: string) => {
        setLoading(true);
        try {
            const filterVal = orgFilter !== undefined ? orgFilter : selectedOrg;
            const params: { organization_id?: string } = {};
            if (filterVal && filterVal !== "all") {
                params.organization_id = filterVal;
            }
            const res = await GetTemplates(params);
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
    }, [selectedOrg]);

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
        fetchTemplates("all");

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
    }, [fetchSignatures, organizationId, setOrganizationId]);

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
            accessorKey: "title",
            header: "TITLE",
            cell: ({ row }) => {
                const title = row.getValue("title") as string;
                const org = row.original.organization;
                const matchedOrg = org || organizations.find(o => o.id === row.original.organization_id || o.uuid === (row.original as any)?.organization_uuid);
                const orgName = matchedOrg?.name;
                const orgKey = matchedOrg?.uuid || matchedOrg?.id || orgName;
                const orgColor = getOrgColor(orgKey, organizations);
                return (
                    <div className="flex flex-col">
                        <div className="text-[#333333] font-semibold text-xs">{title}</div>
                        {orgName && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: orgColor }}
                                />
                                <span
                                    className="text-[11px] font-medium"
                                    style={{ color: orgColor }}
                                >
                                    {orgName}
                                </span>
                            </div>
                        )}
                    </div>
                );
            },
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
            id: "preview",
            header: "PREVIEW",
            cell: ({ row }) => {
                return (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setTemplateToPreview(row.original);
                            setOpenPreviewDialog(true);
                        }}
                        className="h-7 px-3 text-xs font-semibold text-[#4290E9] border-[#4290E9]/30 bg-blue-50/70 hover:bg-[#4290E9] hover:text-white hover:border-[#4290E9] rounded-md flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs group"
                        title="Preview Template"
                    >
                        <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        <span>Preview</span>
                    </Button>
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
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={isTemplateActive}
                            onCheckedChange={() => handleToggleStatus(row.original.uuid, isTemplateActive)}
                            className={isTemplateActive ? "data-[state=checked]:bg-[#6BAE41]" : "data-[state=unchecked]:bg-red-500"}
                        />
                    </div>
                );
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
                                    label: "Preview",
                                    onClick: () => {
                                        setTemplateToPreview(row.original);
                                        setOpenPreviewDialog(true);
                                    },
                                },
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pb-4 px-4 py-4 gap-4" style={{ backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg}, black 10%)` }}>
                <div className="flex flex-wrap items-center gap-4">
                    <p className={`text-[18px] font-semibold uppercase ${userType === "admin" ? "[&>svg]:text-[#4290E9] text-[#4290E9]" : "[&>svg]:text-[#6BAE41] text-[#6BAE41]"}`}>TEMPLATES</p>
                    {isSuperAdmin && (
                        <div className="flex items-center gap-2">
                            <Select
                                value={selectedOrg}
                                onValueChange={(val) => {
                                    setSelectedOrg(val);
                                    fetchTemplates(val);
                                    if (val !== "all") {
                                        fetchSignatures(val);
                                    }
                                }}
                            >
                                <SelectTrigger className="w-[180px] sm:w-[220px] h-9 bg-white text-xs border-gray-300 shadow-2xs font-medium">
                                    <SelectValue placeholder="All Organizations" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
                                            <span>All Organizations</span>
                                        </div>
                                    </SelectItem>
                                    {organizations.map((org) => {
                                        const color = getOrgColor(org.uuid || org.id, organizations);
                                        return (
                                            <SelectItem key={org.uuid} value={org.uuid}>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                    <span>{org.name}</span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
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
                onSuccess={() => fetchTemplates(selectedOrg)}
                initialData={templateToEdit}
                selectedOrgId={selectedOrg !== "all" ? selectedOrg : null}
            />
            <TemplatePreviewDialog
                open={openPreviewDialog}
                setOpen={(open) => {
                    setOpenPreviewDialog(open);
                    if (!open) setTemplateToPreview(null);
                }}
                template={templateToPreview}
                onEdit={(template) => {
                    setTemplateToEdit(template);
                    setOpenAddDialog(true);
                }}
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
