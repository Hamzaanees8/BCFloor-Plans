"use client";
import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/app/context/AppContext";
import RichTextEditor from "@/app/dashboard/calendar/components/RichTextEditor";
import { EmailTemplate, CreateTemplate, UpdateTemplate } from "@/app/dashboard/global-settings/templates";

interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: EmailTemplate | null;
}

const AddTemplateDialog: React.FC<Props> = ({ open, setOpen, onSuccess, initialData }) => {
    const { userType } = useAppContext();
    const [title, setTitle] = useState("");
    const [type, setType] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [content, setContent] = useState("");
    const [isActive, setIsActive] = useState<boolean>(true);

    const [textToInsert, setTextToInsert] = useState("");

    // Preview states
    // const [previewLoading, setPreviewLoading] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (open) {
            setPreviewHtml(null);
            if (initialData) {
                setTitle(initialData.title || "");
                setType(initialData.type || "");
                setTags(initialData.tags || []);
                setContent(initialData.content || "");
                setIsActive(initialData.is_active !== undefined ? initialData.is_active : true);
            } else {
                setTitle("");
                setType("");
                setTags([]);
                setTagInput("");
                setContent("");
                setIsActive(true);
            }
        }
    }, [open, initialData]);

    // const handlePreview = async () => {
    //     if (!initialData?.uuid) {
    //         toast.error("Please save the template first before previewing.");
    //         return;
    //     }
    //
    //     setPreviewLoading(true);
    //     try {
    //         const previewPayload = {
    //             data: {
    //                 user_name: "John Doe",
    //                 order_id: "ORD-12345",
    //                 company_name: "ACME Corp",
    //                 date: new Date().toLocaleDateString(),
    //                 dummy_value: "Example Value"
    //             }
    //         };
    //         const response = await PreviewTemplate(initialData.uuid, previewPayload);
    //         if (response.success && response.data?.parsed_content) {
    //             setPreviewHtml(response.data.parsed_content);
    //         } else if (response.parsed_content) {
    //             setPreviewHtml(response.parsed_content);
    //         } else {
    //             setPreviewHtml(response.data || "Could not parse preview content.");
    //         }
    //     } catch (error) {
    //         console.error(error);
    //         toast.error("Failed to load preview.");
    //     } finally {
    //         setPreviewLoading(false);
    //     }
    // };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Template title is required");
            return;
        }
        if (!type.trim()) {
            toast.error("Template type is required");
            return;
        }
        if (!content.trim() || content === "<p><br></p>") {
            toast.error("Template content is required");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                title,
                type,
                tags: tags.length > 0 ? tags : null,
                is_active: isActive,
                content,
            };

            if (initialData) {
                const res = await UpdateTemplate(initialData.uuid, payload);
                if (res.success !== false) {
                    toast.success("Template updated successfully");
                    onSuccess();
                    setOpen(false);
                } else {
                    toast.error(res.message || "Failed to update template");
                }
            } else {
                const res = await CreateTemplate(payload);
                if (res.success !== false) {
                    toast.success("Template created successfully");
                    onSuccess();
                    setOpen(false);
                } else {
                    toast.error(res.message || "Failed to create template");
                }
            }
        } catch (error) {
            console.error(error);
            toast.error(initialData ? "Failed to update template" : "Failed to create template");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className="w-[900px] max-w-[90vw] h-[90vh] p-0 flex flex-col overflow-hidden bg-[#FAFAFA] rounded-[8px] font-alexandria shadow-lg"
            >
                <DialogHeader className="px-6 py-4 flex-shrink-0 bg-[#FAFAFA] z-20 border-b border-[#BBBBBB]">
                    <DialogTitle className="flex justify-between items-center text-[#4290E9] uppercase text-[18px] font-[600]">
                        {initialData ? "Edit Email Template" : "Create Email Template"}
                        <DialogClose className="border-none shadow-none hover:bg-transparent !p-0">
                            <X className="w-5 h-5 text-[#7D7D7D] cursor-pointer" />
                        </DialogClose>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden text-[#666666]">
                    <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Reschedule Notification"
                                    className="h-[42px] bg-[#EEEEEE] border-[#BBBBBB]"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="type">Type <span className="text-red-500">*</span></Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger id="type" className="h-[42px] bg-[#EEEEEE] border-[#BBBBBB]">
                                        <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="service_completed">service_completed</SelectItem>
                                        <SelectItem value="order_completed">order_completed</SelectItem>
                                        <SelectItem value="service_changed">service_changed</SelectItem>
                                        <SelectItem value="order_updated">order_updated</SelectItem>
                                        <SelectItem value="vendor_changed">vendor_changed</SelectItem>
                                        <SelectItem value="schedule_changed">schedule_changed</SelectItem>
                                        <SelectItem value="service_updated">service_updated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 text-sm">
                            <Label htmlFor="tags">Tags</Label>
                            <div className="flex flex-wrap gap-2 items-center bg-[#EEEEEE] border-[#BBBBBB] border rounded-md p-2 min-h-[42px]">
                                {tags.map((t, idx) => (
                                    <span key={idx} className="flex items-center gap-1 bg-white border border-[#BBBBBB] px-2 py-1 rounded-full text-xs text-[#666666]">
                                        {t}
                                        <X
                                            className="w-3 h-3 cursor-pointer text-red-500 hover:text-red-700"
                                            onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                                        />
                                    </span>
                                ))}
                                <input
                                    id="tags"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                                                setTags([...tags, tagInput.trim()]);
                                                setTagInput("");
                                            }
                                        }
                                    }}
                                    placeholder="Type tag and press Enter"
                                    className="flex-1 bg-transparent min-w-[120px] outline-none border-none text-sm placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="isActive"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                                className={isActive ? "data-[state=checked]:bg-[#6BAE41]" : "data-[state=unchecked]:bg-red-500"}
                            />
                            <Label htmlFor="isActive" className="cursor-pointer">{isActive ? "Active" : "Inactive"}</Label>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex-1 flex flex-col gap-2 relative z-10 w-full min-w-0">
                                <Label>Template Content <span className="text-red-500">*</span></Label>
                                <div className="border border-[#BBBBBB] bg-white rounded-md p-2 min-h-[300px] w-full max-w-full overflow-hidden">
                                    {open && <RichTextEditor
                                        value={content}
                                        onChange={setContent}
                                        insertText={textToInsert}
                                        onTextInserted={() => setTextToInsert("")}
                                    />}
                                </div>
                            </div>

                            <div className="flex-shrink-0 bg-white border border-[#BBBBBB] rounded-md p-4 text-xs">
                                <h4 className="font-semibold text-sm mb-2 text-[#4290E9]">Common Placeholders</h4>
                                <p className="mb-2 text-[#888]">Click on a tag below to dynamically insert it at the cursor.</p>
                                <ul className="flex flex-wrap gap-2 font-mono bg-[#f4f4f4] p-2 rounded max-h-[200px] overflow-y-auto">
                                    {["{{user_name}}", "{{company_name}}", "{{order_id}}", "{{date}}", "{{service_name}}", "{{amount}}", "{{action_url}}", "{{reset_link}}"].map((ph) => (
                                        <li
                                            key={ph}
                                            onClick={() => setTextToInsert(ph)}
                                            className="cursor-pointer hover:bg-[#e0e0e0] p-1.5 rounded transition-colors text-gray-500 font-semibold inline-block bg-white border"
                                            title="Click to insert"
                                        >
                                            {ph}
                                        </li>
                                    ))}
                                </ul>

                                {/* {initialData && (
                                    <div className="mt-6 border-t pt-4 max-w-xs">
                                        <h4 className="font-semibold text-sm mb-2 text-[#4290E9]">Preview Template</h4>
                                        <Button
                                            type="button"
                                            onClick={handlePreview}
                                            disabled={previewLoading}
                                            className="w-full flex items-center justify-center gap-2 bg-[#6BAE41] hover:bg-[#5a9c33] text-white"
                                        >
                                            {previewLoading ? "Loading..." : "Load Preview"}
                                        </Button>
                                    </div>
                                )} */}
                            </div>
                        </div>

                        {previewHtml && (
                            <div className="mt-4 p-4 border border-[#4290E9] rounded bg-white">
                                <h4 className="font-semibold text-[#4290E9] mb-2 uppercase text-sm border-b pb-1">Preview Result</h4>
                                <div className="prose max-w-none text-sm break-words" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 bg-[#FAFAFA] border-t border-[#BBBBBB] flex justify-end flex-shrink-0 z-20">
                        <Button
                            type="submit"
                            disabled={loading}
                            className={`w-[143px] h-[44px] text-white ${userType}-bg hover:${userType}-bg transition-all uppercase`}
                        >
                            {loading ? "Saving..." : "Save Template"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddTemplateDialog;
