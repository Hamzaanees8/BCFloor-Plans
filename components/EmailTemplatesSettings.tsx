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
import { EmailTemplate } from "@/app/dashboard/global-settings/templates";
import AddTemplateDialog from "./AddTemplateDialog";

const EmailTemplatesSettings = () => {
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<EmailTemplate | null>(null);

    const fetchTemplates = useCallback(() => {
        try {
            const localData = localStorage.getItem("emailTemplates");
            if (localData) {
                setTemplates(JSON.parse(localData));
            } else {
                setTemplates([]);
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleDelete = async (uuid: string) => {
        try {
            const localData = localStorage.getItem("emailTemplates");
            if (localData) {
                let currentTemplates: EmailTemplate[] = JSON.parse(localData);
                currentTemplates = currentTemplates.filter(t => t.uuid !== uuid);
                localStorage.setItem("emailTemplates", JSON.stringify(currentTemplates));
                setTemplates(currentTemplates);
            }
            toast.success("Template deleted successfully");
        } catch {
            toast.error("Failed to delete template");
        }
    };

    const handleToggleStatus = (uuid: string, currentStatus: boolean) => {
        try {
            const localData = localStorage.getItem("emailTemplates");
            if (localData) {
                let currentTemplates: EmailTemplate[] = JSON.parse(localData);
                currentTemplates = currentTemplates.map(t =>
                    t.uuid === uuid ? { ...t, status: !currentStatus } : t
                );
                localStorage.setItem("emailTemplates", JSON.stringify(currentTemplates));
                setTemplates(currentTemplates);
                toast.success("Template status updated");
            }
        } catch {
            toast.error("Failed to update status");
        }
    };

    const columns: ColumnDef<EmailTemplate>[] = [
        {
            accessorKey: "name",
            header: "NAME",
            cell: ({ row }) => <div className="text-[#666666]">{row.getValue("name")}</div>,
        },
        {
            accessorKey: "type",
            header: "TYPE",
            cell: ({ row }) => <div className="text-[#666666]">{row.getValue("type")}</div>,
        },
        {
            accessorKey: "date",
            header: "DATE",
            cell: ({ row }) => <div className="text-[#666666]">{row.original.date || "-"}</div>,
        },
        {
            accessorKey: "status",
            header: "STATUS",
            cell: ({ row }) => {
                const isTemplateActive = row.original.status !== undefined ? row.original.status : true;
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

    return (
        <div className="w-full flex-col flex rounded-lg">
            <div className="flex items-center justify-between w-full pb-4 px-4 py-4" style={{ backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg}, black 10%)` }}>
                <p className={`text-[18px] font-semibold uppercase ${userType === "admin" ? "[&>svg]:text-[#4290E9] text-[#4290E9]" : "[&>svg]:text-[#6BAE41] text-[#6BAE41]"}`}>TEMPLATES</p>
                <div
                    onClick={() => setOpenAddDialog(true)}
                    className="flex items-center gap-x-[10px] cursor-pointer"
                >
                    <p className={`text-base font-semibold font-raleway ${userType === "admin" ? "[&>svg]:text-[#4290E9] text-[#4290E9]" : "[&>svg]:text-[#6BAE41] text-[#6BAE41]"}`}>Add Template</p>
                    <Plus className={`w-[18px] h-[18px] ${userType}-bg text-white rounded-sm`} />
                </div>
            </div>
            <div className="w-full mt-4">
                <DataTable
                    data={templates}
                    columns={columns}
                    loading={false}
                    error={false}
                    dataName="Templates"
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
        </div>
    );
};

export default EmailTemplatesSettings;
