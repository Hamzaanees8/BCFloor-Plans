"use client";
import React, { useState } from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/app/context/AppContext";
import RichTextEditor from "@/app/dashboard/calendar/components/RichTextEditor";
import { EmailTemplate } from "@/app/dashboard/global-settings/templates";

interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: EmailTemplate | null;
}

const AddTemplateDialog: React.FC<Props> = ({ open, setOpen, onSuccess, initialData }) => {
    const { userType } = useAppContext();
    const [name, setName] = useState("");
    const [type, setType] = useState("schedule_change");
    const [htmlContent, setHtmlContent] = useState("");
    const [status, setStatus] = useState<boolean>(true);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (open) {
            if (initialData) {
                setName(initialData.name);
                setType(initialData.type);
                setHtmlContent(initialData.html_content);
                setStatus(initialData.status !== undefined ? initialData.status : true);
            } else {
                setName("");
                setType("schedule_change");
                setHtmlContent("");
                setStatus(true);
            }
        }
    }, [open, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Template name is required");
            return;
        }
        if (!htmlContent.trim() || htmlContent === "<p><br></p>") {
            toast.error("Template content is required");
            return;
        }

        setLoading(true);
        try {
            const localData = localStorage.getItem("emailTemplates");
            let currentTemplates: EmailTemplate[] = localData ? JSON.parse(localData) : [];

            if (initialData) {
                // Edit existing
                currentTemplates = currentTemplates.map((t) => {
                    if (t.uuid === initialData.uuid) {
                        return {
                            ...t,
                            name,
                            type,
                            html_content: htmlContent,
                            status,
                        };
                    }
                    return t;
                });
                toast.success("Template updated successfully");
            } else {
                // Create new
                const newTemplate = {
                    name,
                    type,
                    html_content: htmlContent,
                    id: Date.now(),
                    uuid: crypto.randomUUID(),
                    status,
                    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                };
                currentTemplates = [...currentTemplates, newTemplate];
                toast.success("Template created successfully");
            }

            localStorage.setItem("emailTemplates", JSON.stringify(currentTemplates));

            onSuccess();
            setOpen(false);
            setName("");
            setHtmlContent("");
            setType("schedule_change");
        } catch {
            toast.error(initialData ? "Failed to update template" : "Failed to create template");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="w-[800px] max-w-[800px] max-h-[85vh] overflow-y-auto bg-[#FAFAFA] rounded-[8px] font-alexandria shadow-lg">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex justify-between items-center text-[#4290E9] uppercase text-[18px] font-[600]">
                        {initialData ? "Edit Email Template" : "Create Email Template"}
                        <AlertDialogCancel className="border-none shadow-none hover:bg-transparent !p-0">
                            <X className="w-5 h-5 text-[#7D7D7D] cursor-pointer" />
                        </AlertDialogCancel>
                    </AlertDialogTitle>
                    <hr className="w-full border-[#BBBBBB]" />
                </AlertDialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4 text-[#666666]">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="name">Template Name *</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Reschedule Notification"
                                className="h-[42px] bg-[#EEEEEE] border-[#BBBBBB]"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="type">Template Type *</Label>
                            <Input
                                id="type"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                placeholder="e.g. schedule_change"
                                className="h-[42px] bg-[#EEEEEE] border-[#BBBBBB]"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="status"
                            checked={status}
                            onCheckedChange={setStatus}
                            className={status ? "data-[state=checked]:bg-[#6BAE41]" : "data-[state=unchecked]:bg-red-500"}
                        />
                        <Label htmlFor="status" className="cursor-pointer">{status ? "Active" : "Inactive"}</Label>
                    </div>

                    <div className="flex flex-col gap-2 relative z-50">
                        <Label>Template Content *</Label>
                        <div className="border border-[#BBBBBB] bg-white rounded-md p-2 min-h-[300px]">
                            {open && <RichTextEditor value={htmlContent} onChange={setHtmlContent} />}
                        </div>
                    </div>

                    <div className="w-full flex justify-end mt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className={`w-[143px] h-[44px] text-white ${userType}-bg hover:${userType}-bg transition-all uppercase`}
                        >
                            {loading ? "Saving..." : "Save Template"}
                        </Button>
                    </div>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default AddTemplateDialog;
