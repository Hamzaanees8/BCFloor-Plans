"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { X, Send, Eye, Edit3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/app/dashboard/calendar/components/RichTextEditor";
import {
    GetBladePreview,
    SendPreviewEmail,
    RecipientRole,
} from "@/app/dashboard/global-settings/templates";
import { interpolateTemplate } from "@/lib/email-templates";

export interface EmailPreviewEditModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    eventType: string;
    eventLabel?: string;
    orderUuid?: string;
    tourUuid?: string;
    serviceUuid?: string;
    defaultRoles?: RecipientRole[];
    allowedRoles?: RecipientRole[];
    onSuccess?: () => void;
    extraOptions?: Record<string, any>;
}

const ROLE_LABELS: Record<RecipientRole, string> = {
    agent: "Agent / Client",
    vendor: "Vendor",
    admin: "Admin",
};

const COMMON_EMOJIS = [
    { cat: "Checkmarks & Status", items: ["✓", "✔", "✅", "❌", "⚠️", "⭐", "🔔", "🎉", "🔥", "💯"] },
    { cat: "Real Estate & Orders", items: ["🏠", "🏢", "📍", "📅", "🕒", "✉️", "📞", "💵", "💳", "📄", "📋", "🔗", "📷", "🔑", "📦"] },
    { cat: "Arrows & Bullets", items: ["➜", "➔", "➤", "•", "▸", "◆", "✦", "★", "👉", "👇"] },
    { cat: "General", items: ["😀", "😊", "👍", "👏", "👋", "🙏", "✨", "💡", "ℹ️", "💬"] },
];

const DUMMY_PREVIEW_VALUES: Record<string, string> = {
    order_id: "1001",
    property_address: "123 Main Street, Vancouver, BC",
    property_location: "Vancouver, BC",
    service_name: "Matterport 3D Tour & Floor Plan",
    recipient_name: "Sarah Jenkins",
    agent_name: "Sarah Jenkins",
    agent_email: "sarah.jenkins@realty.ca",
    agent_phone: "(604) 555-0199",
    vendor_name: "Alex Rivera",
    vendor_number: "(604) 555-0144",
    vendor_phone: "(604) 555-0144",
    vendor_email: "alex@bcfvendors.com",
    amount: "$250.00 CAD",
    payment_for: "Full Order Invoice",
    payment_scope: "Full Order Invoice",
    payment_method: "Credit Card (Visa •••• 4242)",
    payment_date: "November 3, 2026 10:15 AM",
    payment_id: "PAY-8821",
    transfer_id: "tr_1Nxy2Z9Sample",
    schedule_date: "November 3, 2026",
    schedule_time: "10:00 AM - 11:30 AM",
    new_date: "November 5, 2026",
    new_time: "2:00 PM - 3:30 PM",
    old_date: "November 1, 2026",
    old_time: "9:00 AM - 10:30 AM",
    company_name: "commerx",
    company_email: "moazam@commerx.com",
    company_phone: "123456789",
    invoice_number: "#INV-COMMERX-2026-00329",
    invoice_id: "1001",
    receipt_url: "https://billing.stripe.com/receipt/sample",
    copies: "50",
    with_bleed: "Standard (No Bleed)",
    additional_info: "Please use 100lb glossy cardstock",
    pdf_url: "https://teams.tojuco.com/storage/feature-sheets/sample.pdf",
    cancellation_reason: "Client requested reschedule due to weather",
    cancellation_fee: "$50.00 CAD",
    expiry_date: "November 10, 2026",
    days_remaining: "7",
    new_expiry_date: "May 3, 2027",
    duration_months: "6",
    renewal_url: "https://bookings.tojuco.com/tours/renew/sample",
    service_url: "https://teams.tojuco.com/dashboard/file-manager/sample",
    completed_by: "Alex Rivera",
    media_count: "12",
    uploaded_by: "Alex Rivera",
    custom_message: "High-resolution photos and Matterport scan are ready for download.",
    changes_summary: "Appointment rescheduled to Nov 5, 2026 at 2:00 PM",
};

function buildMasterPreviewHtml(content: string, orgName: string = "commerx", primaryColor: string = "#2563EB") {
    if (content.includes("<!DOCTYPE") || content.includes("<html")) {
        return content;
    }

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Preview</title>
    <style>
        body { margin: 0; padding: 0; background-color: #F5F5F5; font-family: Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        table { border-collapse: collapse; }
        img { max-width: 100%; height: auto; }
        * { box-sizing: border-box; }
        a { color: #15803D; text-decoration: underline; }
        h1, h2, h3, p { margin-top: 0; }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5F5; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0; background-color: #F5F5F5;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="width: 600px; max-width: 600px; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: left;">
                    <tr>
                        <td align="center" style="padding: 30px 20px; background-color: #ffffff; border-bottom: 3px solid ${primaryColor};">
                            <h2 style="margin: 0; color: #333333; font-size: 24px; font-weight: bold; font-family: Arial, sans-serif;">${orgName}</h2>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px; font-family: Arial, sans-serif; color: #3d4852; line-height: 1.6; font-size: 14px;">
                            ${content}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 25px 20px; text-align: center; background-color: #F9FAFB; border-top: 1px solid #E5E7EB; font-family: Arial, sans-serif;">
                            <p style="font-size: 12px; color: #9CA3AF; margin: 0 0 8px;">
                                &copy; ${new Date().getFullYear()} ${orgName}. All rights reserved.
                            </p>
                            <p style="font-size: 11px; color: #D1D5DB; margin: 0;">
                                Powered by <a href="https://tojuco.com" style="color: #9CA3AF; text-decoration: underline;">Tojuco</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

export default function EmailPreviewEditModal({
    open,
    setOpen,
    eventType,
    eventLabel,
    orderUuid,
    tourUuid,
    serviceUuid,
    defaultRoles = ["agent"],
    allowedRoles = ["agent", "vendor", "admin"],
    onSuccess,
    extraOptions = {},
}: EmailPreviewEditModalProps) {
    const [selectedRoles, setSelectedRoles] = useState<RecipientRole[]>(defaultRoles);
    const [activeRoleTab, setActiveRoleTab] = useState<RecipientRole>(defaultRoles[0] || "agent");

    // Per-role content and subject overrides
    const [contents, setContents] = useState<Record<string, string>>({});
    const [subjects, setSubjects] = useState<Record<string, string>>({});
    const [availableVariables, setAvailableVariables] = useState<string[]>([]);

    const [loadingTemplate, setLoadingTemplate] = useState<boolean>(false);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");
    const [textToInsert, setTextToInsert] = useState<string>("");

    // Load template for a given role
    const loadRoleTemplate = useCallback(async (role: RecipientRole) => {
        if (!eventType) return;
        setLoadingTemplate(true);
        try {
            const res = await GetBladePreview(eventType, role, orderUuid);
            if (res.success && res.data) {
                const data = res.data;
                setContents((prev) => ({
                    ...prev,
                    [role]: prev[role] || data.content || "",
                }));
                setSubjects((prev) => ({
                    ...prev,
                    [role]: prev[role] || data.subject || "",
                }));
                if (data.variables && Array.isArray(data.variables)) {
                    setAvailableVariables(data.variables);
                }
            } else {
                toast.error(res.message || `Failed to load template for ${role}`);
            }
        } catch (err) {
            console.error(err);
            toast.error(`Failed to load template for ${role}`);
        } finally {
            setLoadingTemplate(false);
        }
    }, [eventType, orderUuid]);

    // When modal opens or eventType changes, reset state and load templates
    useEffect(() => {
        if (open) {
            const initialRoles: RecipientRole[] = defaultRoles.length > 0 ? defaultRoles : (["agent"] as RecipientRole[]);
            setSelectedRoles(initialRoles);
            setActiveRoleTab(initialRoles[0]);
            setContents({});
            setSubjects({});
            setPreviewMode("edit");

            initialRoles.forEach((role: RecipientRole) => {
                loadRoleTemplate(role);
            });
        }
    }, [open, eventType, defaultRoles, loadRoleTemplate]);

    // Handle role checkbox toggling
    const handleRoleToggle = (role: RecipientRole) => {
        let updated: RecipientRole[];
        if (selectedRoles.includes(role)) {
            if (selectedRoles.length === 1) {
                toast.error("At least one recipient role must be selected");
                return;
            }
            updated = selectedRoles.filter((r) => r !== role);
            if (activeRoleTab === role) {
                setActiveRoleTab(updated[0]);
            }
        } else {
            updated = [...selectedRoles, role];
            if (!contents[role]) {
                loadRoleTemplate(role);
            }
        }
        setSelectedRoles(updated);
    };

    // Current tab active content & subject
    const currentContent = contents[activeRoleTab] || "";
    const currentSubject = subjects[activeRoleTab] || "";

    const handleContentChange = (val: string) => {
        setContents((prev) => ({ ...prev, [activeRoleTab]: val }));
    };

    const handleSubjectChange = (val: string) => {
        setSubjects((prev) => ({ ...prev, [activeRoleTab]: val }));
    };

    // Send Runtime Customized Email
    const handleSend = async () => {
        if (selectedRoles.length === 0) {
            toast.error("Please select at least one recipient");
            return;
        }

        // Verify each selected role has content
        for (const role of selectedRoles) {
            if (!contents[role] || !contents[role].trim() || contents[role] === "<p><br></p>") {
                toast.error(`Please provide content for ${ROLE_LABELS[role]}`);
                setActiveRoleTab(role);
                return;
            }
        }

        setIsSending(true);
        try {
            const res = await SendPreviewEmail({
                event_type: eventType,
                recipient_roles: selectedRoles,
                content_overrides: contents,
                subject_overrides: subjects,
                order_uuid: orderUuid,
                tour_uuid: tourUuid,
                service_uuid: serviceUuid,
                options: extraOptions,
            });

            if (res.success !== false) {
                toast.success(res.message || "Email(s) sent successfully!");
                setOpen(false);
                onSuccess?.();
            } else {
                toast.error(res.message || "Failed to send email");
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || "An error occurred while sending the email");
        } finally {
            setIsSending(false);
        }
    };

    // Full preview document
    const fullPreviewDoc = useMemo(() => {
        let raw = currentContent || "<p>No content provided</p>";
        Object.entries(DUMMY_PREVIEW_VALUES).forEach(([key, val]) => {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
            raw = raw.replace(regex, val);
        });
        raw = interpolateTemplate(raw, DUMMY_PREVIEW_VALUES);

        return buildMasterPreviewHtml(raw, "commerx");
    }, [currentContent]);

    const allTags = Array.from(new Set([
        ...availableVariables.map((v) => (v.startsWith("{{") ? v : `{{${v}}}`)),
        "{{property_address}}",
        "{{order_id}}",
        "{{amount}}",
        "{{service_name}}",
        "{{schedule_date}}",
        "{{schedule_time}}",
        "{{payment_for}}",
        "{{payment_method}}",
        "{{payment_date}}",
        "{{company_name}}",
        "{{company_email}}",
        "{{company_phone}}",
    ]));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-[1150px] max-w-[95vw] h-[95vh] p-0 flex flex-col overflow-hidden bg-[#FAFAFA] rounded-[12px] font-alexandria shadow-2xl">
                {/* Header */}
                <DialogHeader className="px-8 py-4 flex-shrink-0 bg-white z-20 border-b border-[#EEEEEE]">
                    <DialogTitle className="flex justify-between items-center text-[#4290E9] uppercase text-[18px] font-[700] tracking-tight">
                        <div className="flex items-center gap-2">
                            <span>Review & Customize Email Before Sending</span>
                            {eventLabel && (
                                <span className="text-xs bg-blue-50 text-[#4290E9] border border-blue-200 px-2 py-0.5 rounded font-normal normal-case">
                                    {eventLabel}
                                </span>
                            )}
                        </div>
                        <DialogClose className="border-none shadow-none hover:bg-gray-100 rounded-full p-2 transition-all">
                            <X className="w-5 h-5 text-[#7D7D7D] cursor-pointer" />
                        </DialogClose>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col flex-1 overflow-hidden text-[#666666]">
                    <div className="flex-1 overflow-y-auto px-8 py-5 flex flex-col gap-4">
                        {/* Target Recipients Selector */}
                        <div className="bg-white border border-[#E5E7EB] rounded-lg p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Send Email To:
                                </span>
                                {allowedRoles.map((role) => (
                                    <label
                                        key={role}
                                        className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-blue-50/50 border border-gray-200 px-3 py-1.5 rounded-md text-xs font-semibold text-gray-800 transition-colors"
                                    >
                                        <Checkbox
                                            checked={selectedRoles.includes(role)}
                                            onCheckedChange={() => handleRoleToggle(role)}
                                        />
                                        <span>{ROLE_LABELS[role]}</span>
                                    </label>
                                ))}
                            </div>

                            {/* View Mode Toggle */}
                            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-md border border-gray-200 self-end sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode("edit")}
                                    className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                                        previewMode === "edit"
                                            ? "bg-[#4290E9] text-white shadow-xs"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                                    }`}
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    Editor
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode("preview")}
                                    className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                                        previewMode === "preview"
                                            ? "bg-[#4290E9] text-white shadow-xs"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                                    }`}
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    Full Preview
                                </button>
                            </div>
                        </div>

                        {/* If multiple roles are selected, show tabs to switch between role templates */}
                        {selectedRoles.length > 1 && (
                            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
                                {selectedRoles.map((role) => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => setActiveRoleTab(role)}
                                        className={`text-xs font-bold px-4 py-1.5 rounded transition-all ${
                                            activeRoleTab === role
                                                ? "bg-white text-[#4290E9] shadow-xs"
                                                : "text-gray-500 hover:text-gray-700"
                                        }`}
                                    >
                                        {ROLE_LABELS[role]} Email
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Subject line input */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="subject" className="text-xs font-bold text-gray-700">
                                Email Subject Line ({ROLE_LABELS[activeRoleTab]}):
                            </Label>
                            <Input
                                id="subject"
                                value={currentSubject}
                                onChange={(e) => handleSubjectChange(e.target.value)}
                                placeholder="Email Subject"
                                className="h-10 bg-white border-[#DDDDDD] text-sm focus:border-[#4290E9] focus:ring-1 focus:ring-[#4290E9] rounded-md"
                            />
                        </div>

                        {/* Main Body */}
                        {loadingTemplate ? (
                            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-gray-400 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-[#4290E9]" />
                                <span className="text-sm font-semibold">Loading template design...</span>
                            </div>
                        ) : previewMode === "preview" ? (
                            <div className="flex flex-col items-center flex-1 min-h-[500px]">
                                <div className="w-full flex justify-between items-center mb-2 px-1">
                                    <span className="text-xs text-gray-500 font-medium">
                                        Client rendering simulation with sample data for {ROLE_LABELS[activeRoleTab]}:
                                    </span>
                                </div>
                                <div className="flex-1 w-full flex justify-center items-start overflow-hidden py-1">
                                    <iframe
                                        title="Email Client Preview"
                                        srcDoc={fullPreviewDoc}
                                        className="h-full w-[660px] max-w-full bg-white rounded-lg shadow-lg border border-gray-300 transition-all duration-200"
                                    />
                                </div>
                            </div>
                        ) : (
                            /* EDIT MODE */
                            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[480px]">
                                <div className="flex-[3] flex flex-col gap-2 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <Label className="font-bold text-gray-800 text-sm">
                                            Message Body ({ROLE_LABELS[activeRoleTab]})
                                        </Label>
                                        <div className="flex items-center gap-3">
                                            {/* Emoji / Symbol Quick Inserter */}
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="h-7 px-2.5 text-xs bg-white border border-[#DDDDDD] hover:border-[#4290E9] text-gray-700 hover:text-[#4290E9] rounded-md font-medium shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                                        title="Insert Emoji or Symbol"
                                                    >
                                                        <span className="text-sm leading-none">😀</span>
                                                        <span className="hidden sm:inline">Symbols</span>
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-3 z-[1000] shadow-xl bg-white rounded-lg border border-gray-200" align="end">
                                                    <div className="flex flex-col gap-2.5">
                                                        <div className="text-xs font-bold text-gray-800 flex justify-between items-center border-b pb-1.5">
                                                            <span>Insert Emoji / Symbol</span>
                                                            <span className="text-[10px] text-gray-400 font-normal">Click to insert at cursor</span>
                                                        </div>
                                                        <div className="max-h-[220px] overflow-y-auto flex flex-col gap-2.5 pr-1">
                                                            {COMMON_EMOJIS.map((group) => (
                                                                <div key={group.cat} className="flex flex-col gap-1">
                                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{group.cat}</span>
                                                                    <div className="grid grid-cols-5 gap-1">
                                                                        {group.items.map((emoji) => (
                                                                            <button
                                                                                key={emoji}
                                                                                type="button"
                                                                                onClick={() => setTextToInsert(emoji)}
                                                                                className="h-8 text-base bg-gray-50 hover:bg-blue-50 hover:border-blue-300 border border-gray-200 rounded flex items-center justify-center transition-colors cursor-pointer"
                                                                                title={emoji}
                                                                            >
                                                                                {emoji}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>

                                            <span className="text-xs text-gray-400 hidden sm:inline">
                                                Runtime edit only
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border border-[#DDDDDD] bg-white rounded-lg p-1.5 flex-1 w-full max-w-full overflow-y-auto shadow-inner">
                                        <RichTextEditor
                                            key={`runtime_${activeRoleTab}_${open ? 1 : 0}`}
                                            value={currentContent}
                                            onChange={handleContentChange}
                                            insertText={textToInsert}
                                            onTextInserted={() => setTextToInsert("")}
                                        />
                                    </div>
                                </div>

                                {/* Dynamic Tags Panel */}
                                <div className="flex-1 flex flex-col gap-2 min-w-[240px]">
                                    <div className="bg-white border border-[#DDDDDD] rounded-lg p-4 sticky top-0 h-full flex flex-col shadow-xs">
                                        <h4 className="font-bold text-xs mb-1 text-[#4290E9] uppercase tracking-wider flex items-center justify-between">
                                            <span>Dynamic Tags</span>
                                            <span className="text-[10px] text-gray-400 font-normal">Click to insert</span>
                                        </h4>
                                        <p className="mb-2 text-[#888] text-[11px] leading-relaxed">
                                            Click any tag to insert it at your cursor in the editor:
                                        </p>
                                        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                                            <ul className="flex flex-wrap gap-1.5 font-mono bg-[#f9f9f9] p-2.5 rounded-lg content-start border border-dashed border-[#CCCCCC]">
                                                {allTags.map((ph) => (
                                                    <li
                                                        key={ph}
                                                        onClick={() => setTextToInsert(ph)}
                                                        className="cursor-pointer hover:bg-[#4290E9] hover:text-white hover:scale-105 p-1.5 rounded text-[10px] font-bold bg-white border border-[#EEEEEE] shadow-2xs select-none active:translate-y-0.5"
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
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="px-8 py-3.5 bg-white border-t border-[#EEEEEE] flex justify-between items-center flex-shrink-0 z-20">
                        <div className="text-xs text-gray-500">
                            Recipients: <span className="font-bold text-gray-700">{selectedRoles.map((r) => ROLE_LABELS[r]).join(", ")}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="h-[40px] px-5 text-gray-600 hover:bg-gray-100 text-xs font-semibold uppercase"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSend}
                                disabled={isSending || loadingTemplate}
                                className={`min-w-[140px] h-[40px] text-white bg-[#4290E9] hover:bg-[#357ac8] transition-all uppercase text-xs font-bold shadow-sm flex items-center gap-2`}
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Send Email
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
