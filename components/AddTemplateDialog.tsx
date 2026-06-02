"use client";
import React, { useState, useEffect } from "react";
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
import { X, Info } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useAppContext } from "@/app/context/AppContext";
import RichTextEditor from "@/app/dashboard/calendar/components/RichTextEditor";
import { EmailTemplate, CreateTemplate, UpdateTemplate } from "@/app/dashboard/global-settings/templates";
import { Signature, GetSignatures } from "@/app/dashboard/global-settings/signatures";
import SignatureCreatorDialog from "./SignatureCreatorDialog";

interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: EmailTemplate | null;
}

const AddTemplateDialog: React.FC<Props> = ({ open, setOpen, onSuccess, initialData }) => {
    const { userType, organizationId } = useAppContext();
    const [title, setTitle] = useState("");
    const [type, setType] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [content, setContent] = useState("");
    const [isActive, setIsActive] = useState<boolean>(true);
    const [openSignatureCreator, setOpenSignatureCreator] = useState(false);

    const [textToInsert, setTextToInsert] = useState("");

    // Preview states
    // const [previewLoading, setPreviewLoading] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [fetchingSigs, setFetchingSigs] = useState(false);

    useEffect(() => {
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

            // Fetch signatures
            const fetchSigs = async () => {
                if (!organizationId) return;
                setFetchingSigs(true);
                try {
                    const res = await GetSignatures(organizationId);
                    if (res.status !== false && res.data) {
                        setSignatures(res.data);
                    }
                } catch (err) {
                    console.error("Failed to fetch signatures for template creator", err);
                } finally {
                    setFetchingSigs(false);
                }
            };
            fetchSigs();
        }
    }, [open, initialData, organizationId]);

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
                className="w-[1100px] max-w-[95vw] h-[95vh] p-0 flex flex-col overflow-hidden bg-[#FAFAFA] rounded-[12px] font-alexandria shadow-2xl"
            >
                <DialogHeader className="px-8 py-5 flex-shrink-0 bg-white z-20 border-b border-[#EEEEEE]">
                    <DialogTitle className="flex justify-between items-center text-[#4290E9] uppercase text-[20px] font-[700] tracking-tight">
                        {initialData ? "Edit Email Template" : "Create Email Template"}
                        <DialogClose className="border-none shadow-none hover:bg-gray-100 rounded-full p-2 transition-all">
                            <X className="w-6 h-6 text-[#7D7D7D] cursor-pointer" />
                        </DialogClose>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden text-[#666666]">
                    <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-6 text-sm">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="title" className="font-semibold text-gray-700">Title <span className="text-red-500">*</span></Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Reschedule Notification"
                                    className="h-[46px] bg-white border-[#DDDDDD] focus:border-[#4290E9] focus:ring-1 focus:ring-[#4290E9] transition-all rounded-md"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="type" className="font-semibold text-gray-700">Type <span className="text-red-500">*</span></Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger id="type" className="h-[46px] bg-white border-[#DDDDDD] transition-all rounded-md">
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
                            <Label htmlFor="tags" className="font-semibold text-gray-700">Tags</Label>
                            <div className="flex flex-wrap gap-2 items-center bg-white border-[#DDDDDD] border rounded-md p-2 min-h-[46px]">
                                {tags.map((t, idx) => (
                                    <span key={idx} className="flex items-center gap-1 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full text-xs text-[#4290E9] font-medium">
                                        {t}
                                        <X
                                            className="w-3.5 h-3.5 cursor-pointer text-blue-400 hover:text-blue-600 transition-colors"
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
                                    className="flex-1 bg-transparent min-w-[150px] outline-none border-none text-sm placeholder:text-gray-400 py-1"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 bg-white p-3 rounded-md border border-[#EEEEEE] w-fit">
                            <Switch
                                id="isActive"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                                className={isActive ? "data-[state=checked]:bg-[#6BAE41]" : "data-[state=unchecked]:bg-red-500"}
                            />
                            <Label htmlFor="isActive" className="cursor-pointer font-medium text-gray-700">{isActive ? "Active" : "Inactive"}</Label>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-[650px]">
                            {/* Left Side: Editor */}
                            <div className="flex-[3] flex flex-col gap-4 relative z-10 min-w-0">
                                <div className="flex justify-between items-center">
                                    <Label className="font-bold text-gray-800 text-base">Template Content <span className="text-red-500">*</span></Label>

                                    {/* Signature Insertion Dropdown */}
                                    <div className="flex items-center gap-1.5">
                                        <Label className="text-xs text-[#888] font-semibold hidden md:inline-block">Insert Signature:</Label>

                                        <Select
                                            onValueChange={(val) => {
                                                const sig = signatures.find(s => s.uuid === val);
                                                if (sig) {
                                                    setTextToInsert(sig.html_content);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-9 w-[220px] text-xs bg-white border-[#4290E9] text-[#4290E9] font-bold shadow-sm hover:bg-blue-50 transition-colors">
                                                <SelectValue placeholder={fetchingSigs ? "Loading..." : "Choose a signature"} />
                                            </SelectTrigger>
                                            <SelectContent className="z-[1000]">
                                                {signatures.length === 0 ? (
                                                    <SelectItem value="none" disabled className="text-xs">No signatures found</SelectItem>
                                                ) : (
                                                    signatures.map((sig) => (
                                                        <SelectItem key={sig.uuid} value={sig.uuid} className="text-xs">
                                                            {sig.name}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <TooltipProvider delayDuration={100}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="w-3.5 h-3.5 cursor-pointer text-[#4290E9] flex-shrink-0" />
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-[220px] text-xs text-center">
                                                    Click in the editor to place your cursor first, then select a signature to insert it at that position.
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>
                                <div className="border border-[#DDDDDD] bg-white rounded-lg p-1.5 flex-1 w-full max-w-full overflow-y-auto shadow-inner" style={{ minHeight: 0 }}>
                                    {open && <RichTextEditor
                                        value={content}
                                        onChange={setContent}
                                        insertText={textToInsert}
                                        onTextInserted={() => setTextToInsert("")}
                                    />}
                                </div>
                            </div>

                            {/* Right Side: Placeholders */}
                            <div className="flex-1 flex flex-col gap-4">
                                <div className="bg-white border border-[#DDDDDD] rounded-lg p-5 sticky top-0 h-full flex flex-col shadow-sm">
                                    <h4 className="font-bold text-sm mb-3 text-[#4290E9] uppercase tracking-widest">Dynamic Tags</h4>
                                    <p className="mb-5 text-[#888] text-xs leading-relaxed">Click any tag below to insert it dynamically at your cursor position.</p>
                                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                                        <ul className="flex flex-wrap gap-2.5 font-mono bg-[#f9f9f9] p-4 rounded-xl content-start border border-dashed border-[#CCCCCC]">
                                            {[
                                                "{{user_name}}",
                                                "{{agent_name}}",
                                                "{{vendor_name}}",
                                                "{{vendor_number}}",
                                                "{{property_address}}",
                                                "{{order_id}}",
                                                "{{service_name}}",
                                                "{{amount}}",
                                                "{{schedule_date}}",
                                                "{{schedule_time}}",
                                                "{{company_name}}",
                                            ].map((ph) => (
                                                <li
                                                    key={ph}
                                                    onClick={() => setTextToInsert(ph)}
                                                    className="cursor-pointer hover:bg-[#4290E9] hover:text-white hover:scale-105 hover:shadow-md p-2.5 rounded-lg transition-all text-[#555555] font-bold text-[11px] inline-block bg-white border border-[#EEEEEE] shadow-sm select-none border-b-2 active:translate-y-0.5 active:shadow-inner"
                                                    title={`Click to insert ${ph}`}
                                                >
                                                    {ph}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
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
            <SignatureCreatorDialog
                open={openSignatureCreator}
                setOpen={setOpenSignatureCreator}
                onSave={(sig: Signature) => setTextToInsert(sig.html_content)}
            />
        </Dialog>
    );
};

export default AddTemplateDialog;
