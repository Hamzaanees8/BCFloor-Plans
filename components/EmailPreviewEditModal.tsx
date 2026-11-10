"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X, Send, Eye, Edit3, Loader2, FileText, Info } from "lucide-react";
import { toast } from "sonner";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { useAppContext } from "@/app/context/AppContext";
import { useOrganization } from "@/app/context/OrganizationContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import RichTextEditor from "@/app/dashboard/calendar/components/RichTextEditor";
import EmailEditorCanvasWrapper from "./EmailEditorCanvasWrapper";
import {
  GetBladePreview,
  SendPreviewEmail,
  RecipientRole,
} from "@/app/dashboard/global-settings/templates";
import {
  Signature,
  GetSignatures,
} from "@/app/dashboard/global-settings/signatures";
import { interpolateTemplate } from "@/lib/email-templates";

export type { RecipientRole };

export interface EmailPreviewEditModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  eventType: string;
  eventLabel?: string;
  modalTitle?: string;
  orderUuid?: string;
  tourUuid?: string;
  serviceUuid?: string;
  defaultRoles?: RecipientRole[];
  allowedRoles?: RecipientRole[];
  onSuccess?: () => void;
  extraOptions?: Record<string, any>;
  customSendButtonText?: string;
  onCustomSend?: (payload: {
    selectedRoles: RecipientRole[];
    contents: Record<string, string>;
    subjects: Record<string, string>;
  }) => Promise<void>;
}

const ROLE_LABELS: Record<RecipientRole, string> = {
  agent: "Agent",
  vendor: "Vendor",
  admin: "Admin",
};

const COMMON_EMOJIS = [
  { cat: "Checkmarks & Status", items: ["✓", "✔", "✅", "❌", "⚠️", "⭐", "🔔", "🎉", "🔥", "💯"] },
  { cat: "Real Estate & Orders", items: ["🏠", "🏢", "📍", "📅", "🕒", "✉️", "📞", "💵", "💳", "📄", "📋", "🔗", "📷", "🔑", "📦"] },
  { cat: "Arrows & Bullets", items: ["➜", "➔", "➤", "•", "▸", "◆", "✦", "★", "👉", "👇"] },
  { cat: "General", items: ["😀", "😊", "👍", "👏", "👋", "🙏", "✨", "💡", "ℹ️", "💬"] },
];

const DEFAULT_DYNAMIC_TAGS = [
  "{{recipient_name}}",
  "{{agent_name}}",
  "{{agent_email}}",
  "{{agent_phone}}",
  "{{vendor_name}}",
  "{{vendor_number}}",
  "{{vendor_phone}}",
  "{{vendor_email}}",
  "{{property_address}}",
  "{{property_location}}",
  "{{order_id}}",
  "{{service_name}}",
  "{{amount}}",
  "{{payment_for}}",
  "{{payment_scope}}",
  "{{payment_method}}",
  "{{payment_date}}",
  "{{payment_id}}",
  "{{transfer_id}}",
  "{{schedule_date}}",
  "{{schedule_time}}",
  "{{new_date}}",
  "{{new_time}}",
  "{{old_date}}",
  "{{old_time}}",
  "{{company_name}}",
  "{{company_email}}",
  "{{company_phone}}",
  "{{invoice_number}}",
  "{{invoice_id}}",
  "{{receipt_url}}",
  "{{cancellation_reason}}",
  "{{cancellation_fee}}",
  "{{service_url}}",
  "{{custom_message}}",
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
  company_name: "BC Floor Plans",
  company_email: "mail@bcfloorplans.com",
  company_phone: "604-788-7783",
  invoice_number: "#INV-BCF-2026-00329",
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

function buildMasterPreviewHtml(
  content: string,
  branding: {
    name: string;
    logoUrl?: string | null;
    primaryColor: string;
  } = {
    name: "BC Floor Plans",
    logoUrl: null,
    primaryColor: "#6BAE41",
  },
) {
  if (content.includes("<!DOCTYPE") || content.includes("<html")) {
    return content;
  }

  const { name, logoUrl, primaryColor } = branding;

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
                            ${
                              logoUrl
                                ? `<img src="${logoUrl}" alt="${name} Logo" style="max-width: 200px; max-height: 80px; object-fit: contain; border: none; display: block;" />`
                                : `<h2 style="margin: 0; color: #333333; font-size: 24px; font-weight: bold; font-family: Arial, sans-serif;">${name}</h2>`
                            }
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
                                &copy; ${new Date().getFullYear()} ${name}. All rights reserved.
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
  modalTitle,
  orderUuid,
  defaultRoles = ["agent"],
  allowedRoles = ["agent", "vendor", "admin"],
  onSuccess,
  customSendButtonText,
  onCustomSend,
}: EmailPreviewEditModalProps) {
  const { userType, organizationId } = useAppContext();
  const { organization } = useOrganization();
  const { appliedSettings, organizations } = useWhiteLabel();

  const userInfo = useMemo(() => {
    try {
      return typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("userInfo") || "{}")
        : {};
    } catch {
      return {};
    }
  }, []);

  const currentOrgObj = useMemo(() => {
    return (
      organizations?.find((o) => o.uuid === organizationId) ||
      organization ||
      userInfo?.organization ||
      null
    );
  }, [organizations, organizationId, organization, userInfo]);

  const orgName = currentOrgObj?.name || organization?.name || "BC Floor Plans";
  const orgLogo =
    organization?.branding?.logo ||
    appliedSettings?.admin?.logo ||
    (currentOrgObj as any)?.company_logos_urls?.[0]?.url ||
    null;
  const orgPrimaryColor =
    (typeof organization?.branding?.primary_color === "object"
      ? (organization.branding.primary_color as { value: string }).value
      : (organization?.branding?.primary_color as string)) ||
    appliedSettings?.admin?.pageTabColor ||
    "#6BAE41";
  const orgEmail =
    currentOrgObj?.contact_email ||
    organization?.contact_email ||
    "mail@bcfloorplans.com";
  const orgPhone =
    currentOrgObj?.contact_phone ||
    organization?.contact_phone ||
    "604-788-7783";
  const orgSlug = currentOrgObj?.slug?.toUpperCase() || "BCF";
  const [selectedRoles, setSelectedRoles] = useState<RecipientRole[]>(defaultRoles);
  const [activeRoleTab, setActiveRoleTab] = useState<RecipientRole>(defaultRoles[0] || "agent");

  // Per-role content and subject overrides
  const [contents, setContents] = useState<Record<string, string>>({});
  const [subjects, setSubjects] = useState<Record<string, string>>({});
  const defaultDesignsRef = useRef<Record<string, string>>({});
  const [availableVariables, setAvailableVariables] = useState<string[]>([]);

  // Signatures
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [fetchingSigs, setFetchingSigs] = useState<boolean>(false);

  // Status and View mode
  const [isActive, setIsActive] = useState<boolean>(true);
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");
  const [textToInsert, setTextToInsert] = useState<string>("");
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [rolePlaceholderValues, setRolePlaceholderValues] = useState<
    Record<string, Record<string, string>>
  >({});
  const [loadingTemplate, setLoadingTemplate] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // Fetch signatures
  useEffect(() => {
    if (open && organizationId) {
      setFetchingSigs(true);
      GetSignatures(organizationId)
        .then((res) => {
          if (res?.data && Array.isArray(res.data)) {
            setSignatures(res.data);
          }
        })
        .catch((err) => {
          console.error("Failed to load signatures:", err);
        })
        .finally(() => {
          setFetchingSigs(false);
        });
    }
  }, [open, organizationId]);

  // Load template for a given role
  const loadRoleTemplate = useCallback(
    async (role: RecipientRole, forceDefault = false) => {
      if (!eventType) return;
      setLoadingTemplate(true);
      try {
        const res = await GetBladePreview(eventType, role, orderUuid, {
          organizationId: organizationId || undefined,
        });
        if (res.success && res.data) {
          const data = res.data;
          const loadedHtml = data.html || data.content || "";
          const loadedSubject = data.subject || `${eventLabel || eventType} (${ROLE_LABELS[role]})`;

          defaultDesignsRef.current[role] = loadedHtml;

          setContents((prev) => ({
            ...prev,
            [role]: forceDefault ? loadedHtml : prev[role] || loadedHtml,
          }));

          setSubjects((prev) => ({
            ...prev,
            [role]: forceDefault ? loadedSubject : prev[role] || loadedSubject,
          }));

          if (data.placeholder_values && typeof data.placeholder_values === "object") {
            setPlaceholderValues(data.placeholder_values);
            setRolePlaceholderValues((prev) => ({
              ...prev,
              [role]: data.placeholder_values,
            }));
          }

          if (data.variables && Array.isArray(data.variables)) {
            setAvailableVariables(data.variables);
          }
        } else {
          toast.error(res.message || `Failed to load template for ${ROLE_LABELS[role]}`);
        }
      } catch (err) {
        console.error(err);
        toast.error(`Failed to load template for ${ROLE_LABELS[role]}`);
      } finally {
        setLoadingTemplate(false);
      }
    },
    [eventType, orderUuid, eventLabel, organizationId]
  );

  // Keep placeholderValues in sync with active role tab
  useEffect(() => {
    if (rolePlaceholderValues[activeRoleTab]) {
      setPlaceholderValues(rolePlaceholderValues[activeRoleTab]);
    }
  }, [activeRoleTab, rolePlaceholderValues]);

  // Helper to resolve live placeholder value
  const getTagInfo = useCallback(
    (tag: string) => {
      const rawKey = tag.replace(/[{}]/g, "").trim();
      const cleanKey = rawKey.toLowerCase();

      let matchedValue: string | null = null;
      for (const [k, v] of Object.entries(placeholderValues)) {
        if (k.toLowerCase() === cleanKey) {
          if (v !== null && v !== undefined) {
            const str = String(v).trim();
            if (str !== "") {
              matchedValue = str;
            }
          }
          break;
        }
      }

      return {
        key: rawKey,
        value: matchedValue,
        hasValue: matchedValue !== null && matchedValue !== "",
      };
    },
    [placeholderValues]
  );

  const handleTagClick = (tag: string) => {
    const info = getTagInfo(tag);

    if (info.hasValue && info.value) {
      setTextToInsert(info.value);
    } else {
      setTextToInsert(tag);
    }
  };

  // When modal opens or eventType changes, reset state and load templates
  useEffect(() => {
    if (open) {
      const initialRoles: RecipientRole[] =
        defaultRoles.length > 0 ? defaultRoles : (["agent"] as RecipientRole[]);
      setSelectedRoles(initialRoles);
      setActiveRoleTab(initialRoles[0]);
      setContents({});
      setSubjects({});
      defaultDesignsRef.current = {};
      setPreviewMode("edit");
      setIsActive(true);

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
      setSelectedRoles(updated);
      if (activeRoleTab === role) {
        setActiveRoleTab(updated[0]);
      }
    } else {
      updated = [...selectedRoles, role];
      setSelectedRoles(updated);
      setActiveRoleTab(role);
      if (!contents[role]) {
        loadRoleTemplate(role);
      }
    }
  };

  const currentContent = contents[activeRoleTab] || "";
  const currentSubject = subjects[activeRoleTab] || "";

  const handleContentChange = (newHtml: string) => {
    setContents((prev) => ({
      ...prev,
      [activeRoleTab]: newHtml,
    }));
  };

  const handleSubjectChange = (newSubject: string) => {
    setSubjects((prev) => ({
      ...prev,
      [activeRoleTab]: newSubject,
    }));
  };

  // Start with Blank
  const handleStartBlank = () => {
    const doClear = () => {
      setContents((prev) => ({ ...prev, [activeRoleTab]: "<p></p>" }));
      toast.info(`Cleared template for ${ROLE_LABELS[activeRoleTab]}`);
    };

    if (currentContent && currentContent !== "<p></p>") {
      setConfirmDialog({
        open: true,
        title: "Start with Blank Editor?",
        description: `This will clear all current content for ${ROLE_LABELS[activeRoleTab]}. This cannot be undone.`,
        onConfirm: doClear,
      });
    } else {
      doClear();
    }
  };

  // Load Default Design
  const handleLoadDefaultClick = () => {
    const currentNorm = (currentContent || "").replace(/\s+/g, " ").trim();
    const defaultNorm = (defaultDesignsRef.current[activeRoleTab] || "").replace(/\s+/g, " ").trim();
    const isChanged = currentNorm && defaultNorm && currentNorm !== defaultNorm;

    if (isChanged) {
      setConfirmDialog({
        open: true,
        title: "Reload Default Design?",
        description: `Your custom changes for ${ROLE_LABELS[activeRoleTab]} will be replaced by the original template.`,
        onConfirm: () => loadRoleTemplate(activeRoleTab, true),
      });
    } else {
      loadRoleTemplate(activeRoleTab, true);
    }
  };

  // Send Action
  const handleSend = async () => {
    if (selectedRoles.length === 0) {
      toast.error("Please select at least one recipient role");
      return;
    }

    setIsSending(true);
    try {
      if (onCustomSend) {
        await onCustomSend({
          selectedRoles,
          contents,
          subjects,
        });
        toast.success("Notification sent successfully!");
        setOpen(false);
        onSuccess?.();
      } else {
        const res = await SendPreviewEmail({
          event_type: eventType,
          recipient_roles: selectedRoles,
          content_overrides: contents,
          subject_overrides: subjects,
          order_uuid: orderUuid,
        });

        if (res.success !== false) {
          toast.success(res.message || "Email(s) sent successfully!");
          setOpen(false);
          onSuccess?.();
        } else {
          toast.error(res.message || "Failed to send email");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  // Dynamically bound dummy preview values with active organization branding
  const previewValues = useMemo(
    () => ({
      ...DUMMY_PREVIEW_VALUES,
      company_name: orgName,
      company_email: orgEmail,
      company_phone: orgPhone,
      invoice_number: `#INV-${orgSlug}-2026-00329`,
    }),
    [orgName, orgEmail, orgPhone, orgSlug],
  );

  // Full simulated preview doc
  const fullPreviewDoc = useMemo(() => {
    let interpolated = currentContent || "<p>No content provided</p>";
    Object.entries(previewValues).forEach(([key, val]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
      interpolated = interpolated.replace(regex, val);
    });
    interpolated = interpolateTemplate(interpolated, previewValues);

    if (interpolated.includes("<!DOCTYPE") || interpolated.includes("<html")) {
      return interpolated;
    }

    return buildMasterPreviewHtml(interpolated, {
      name: orgName,
      logoUrl: orgLogo,
      primaryColor: orgPrimaryColor,
    });
  }, [currentContent, previewValues, orgName, orgLogo, orgPrimaryColor]);

  // Combined tags list
  const allTags = useMemo(() => {
    const set = new Set<string>();
    DEFAULT_DYNAMIC_TAGS.forEach((t) => set.add(t));
    availableVariables.forEach((v) => set.add(`{{${v}}}`));
    return Array.from(set);
  }, [availableVariables]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[1150px] max-w-[95vw] h-[95vh] p-0 flex flex-col overflow-hidden bg-[#FAFAFA] rounded-[12px] font-alexandria shadow-2xl [&>button]:hidden">
        {/* Header - Identical to Global Settings */}
        <DialogHeader className="px-8 py-4 flex-shrink-0 bg-white z-20 border-b border-[#EEEEEE]">
          <DialogTitle className="flex justify-between items-center text-[#4290E9] uppercase text-[20px] font-[700] tracking-tight">
            <span>{modalTitle || "Review & Send Email Template"}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="border-none shadow-none hover:bg-gray-100 rounded-full p-2 transition-all cursor-pointer"
              title="Close"
            >
              <X className="w-6 h-6 text-[#7D7D7D]" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden text-[#666666]">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-5 flex flex-col gap-5">
            {/* Row 1: Template Title (Full width for extra content & variables) */}
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between items-center">
                <Label htmlFor="title" className="font-semibold text-gray-700">
                  Template Title <span className="text-red-500">*</span>
                </Label>
                {selectedRoles.length > 1 && (
                  <span className="text-xs text-[#4290E9] font-semibold">
                    Editing: {ROLE_LABELS[activeRoleTab]}
                  </span>
                )}
              </div>
              <Input
                id="title"
                value={currentSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                placeholder="e.g. Appointment Rescheduled: {{service_name}} - {{property_address}}"
                className="h-[44px] w-full bg-white border-[#DDDDDD] focus:border-[#4290E9] focus:ring-1 focus:ring-[#4290E9] transition-all rounded-md"
              />
            </div>

            {/* Row 2: Event Type and Action Buttons */}
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between items-center">
                <Label htmlFor="type" className="font-semibold text-gray-700">
                  Event Type <span className="text-red-500">*</span>
                </Label>
                <button
                  type="button"
                  onClick={handleLoadDefaultClick}
                  disabled={loadingTemplate}
                  className="text-xs font-semibold text-[#4290E9] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {loadingTemplate && <Loader2 className="w-3 h-3 animate-spin" />}
                  Reload Default Design
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Select value={eventType} disabled>
                  <SelectTrigger
                    id="type"
                    className="h-[44px] bg-white border-[#DDDDDD] transition-all rounded-md flex-1 min-w-[280px]"
                  >
                    <SelectValue placeholder={eventLabel || eventType} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={eventType}>
                      {eventLabel || eventType} <span className="text-gray-400 text-xs">({eventType})</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  disabled={loadingTemplate}
                  onClick={handleLoadDefaultClick}
                  className="h-[44px] px-4 bg-[#4290E9] hover:bg-[#327bc9] text-white font-bold text-xs flex items-center gap-1.5 shrink-0 rounded-md shadow-xs transition-colors cursor-pointer border-none"
                  title="Load original pixel-perfect Blade template with styling and variables"
                >
                  {loadingTemplate && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Load Default</span>
                </Button>
                <Button
                  type="button"
                  disabled={loadingTemplate}
                  onClick={handleStartBlank}
                  className="h-[44px] px-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-[#DDDDDD] font-bold text-xs flex items-center gap-1.5 shrink-0 rounded-md shadow-2xs transition-colors cursor-pointer"
                  title="Clear design and start with a blank editor"
                >
                  <FileText className="w-3.5 h-3.5 text-gray-500" />
                  <span>Start with Blank</span>
                </Button>
              </div>
            </div>

            {/* Row 3: Target Recipients (Admin, Agent, Vendor) & Status & View Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm items-start">
              <div className="flex flex-col gap-1.5">
                <div className="min-h-[20px] flex items-center">
                  <Label className="font-semibold text-gray-700">
                    Target Recipients <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-gray-500 ml-1.5">
                      (Select one or multiple)
                    </span>
                  </Label>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 bg-white px-3 rounded-md border border-[#DDDDDD] h-[46px]">
                  {[
                    { id: "admin" as RecipientRole, label: "Admin", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
                    { id: "agent" as RecipientRole, label: "Agent", color: "bg-blue-50 text-blue-700 border-blue-200" },
                    { id: "vendor" as RecipientRole, label: "Vendor", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                  ]
                    .filter((r) => allowedRoles.includes(r.id))
                    .map((role) => {
                      const checked = selectedRoles.includes(role.id);
                      return (
                        <label
                          key={role.id}
                          className={`h-[32px] flex items-center gap-2 px-3 rounded-md border cursor-pointer select-none text-xs font-medium transition-all ${
                            checked
                              ? `${role.color} font-bold ring-2 ring-offset-1 ring-blue-300 shadow-xs`
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleRoleToggle(role.id)}
                            className="w-4 h-4 text-[#4290E9] rounded border-gray-300 focus:ring-[#4290E9] cursor-pointer"
                          />
                          <span>{role.label}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="min-h-[20px] flex items-center">
                  <span className="font-semibold text-gray-700 text-sm">
                    Status & Preview Mode
                  </span>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center space-x-3 bg-white px-4 rounded-md border border-[#DDDDDD] h-[46px]">
                    <Switch
                      id="isActive"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                      className={
                        isActive
                          ? "data-[state=checked]:bg-[#6BAE41]"
                          : "data-[state=unchecked]:bg-red-500"
                      }
                    />
                    <Label htmlFor="isActive" className="cursor-pointer font-medium text-gray-700 text-xs">
                      Status:{" "}
                      <strong className={isActive ? "text-[#6BAE41]" : "text-red-500"}>
                        {isActive ? "Active" : "Inactive"}
                      </strong>
                    </Label>
                  </div>

                  <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 h-[46px]">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("edit")}
                      className={`h-full px-3.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
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
                      className={`h-full px-3.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        previewMode === "preview"
                          ? "bg-[#4290E9] text-white shadow-xs"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Full Email Preview
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4: Switcher tabs when multiple recipients are selected (e.g. Agent and Vendor) */}
            {selectedRoles.length > 1 && (
              <div className="flex items-center gap-2 bg-blue-50/70 border border-blue-200 p-1.5 rounded-lg">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wide px-2">
                  Select Recipient Editor:
                </span>
                {selectedRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setActiveRoleTab(role)}
                    className={`text-xs font-bold px-4 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-2 ${
                      activeRoleTab === role
                        ? "bg-[#4290E9] text-white shadow-xs"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <span>{ROLE_LABELS[role]} Email</span>
                    {contents[role] && contents[role] !== "<p></p>" && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" title="Content ready" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Row 5: Content Editor or Full Preview */}
            {previewMode === "preview" ? (
              /* FULL EMAIL PREVIEW MODE */
              <div className="flex-1 flex flex-col gap-3 min-h-[620px] h-[680px] bg-[#EFEFEF] rounded-xl p-4 border border-[#CCCCCC]">
                <div className="flex justify-between items-center px-2 flex-shrink-0">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#4290E9]" />
                    Interactive Email Preview ({ROLE_LABELS[activeRoleTab]})
                    <span className="text-gray-400 font-normal">
                      (Scroll inside the preview to see the complete email from header to footer)
                    </span>
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
              /* EDIT MODE: Editor on Left, Dynamic Tags on Right */
              <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[550px]">
                {/* Left Side: Editor */}
                <div className="flex-[3] flex flex-col gap-3 relative z-10 min-w-0">
                  <div className="flex justify-between items-center">
                    <Label className="font-bold text-gray-800 text-sm">
                      Template Content (Inline HTML) <span className="text-red-500">*</span>
                      <span className="text-xs font-semibold text-[#4290E9] ml-2">
                        ({ROLE_LABELS[activeRoleTab]})
                      </span>
                    </Label>

                    <div className="flex items-center gap-2">
                      {/* Emoji & Symbol Quick Inserter */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="h-8 px-2.5 text-xs bg-white border border-[#DDDDDD] hover:border-[#4290E9] text-gray-700 hover:text-[#4290E9] rounded-md font-medium shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Insert Emoji or Symbol"
                          >
                            <span className="text-sm leading-none">😀</span>
                            <span className="hidden sm:inline">Symbols</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[300px] p-3 z-[1000] shadow-xl bg-white rounded-lg border border-gray-200"
                          align="end"
                        >
                          <div className="flex flex-col gap-2.5">
                            <div className="text-xs font-bold text-gray-800 flex justify-between items-center border-b pb-1.5">
                              <span>Insert Emoji / Symbol</span>
                              <span className="text-[10px] text-gray-400 font-normal">
                                Click to insert at cursor
                              </span>
                            </div>
                            <div className="max-h-[220px] overflow-y-auto flex flex-col gap-2.5 pr-1">
                              {COMMON_EMOJIS.map((group) => (
                                <div key={group.cat} className="flex flex-col gap-1">
                                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                    {group.cat}
                                  </span>
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

                      <Label className="text-xs text-[#888] font-semibold hidden md:inline-block">
                        Signature:
                      </Label>
                      <Select
                        onValueChange={(val) => {
                          const sig = signatures.find((s) => s.uuid === val);
                          if (sig) {
                            setTextToInsert(sig.html_content);
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 w-[180px] text-xs bg-white border-[#4290E9] text-[#4290E9] font-bold shadow-xs hover:bg-blue-50 transition-colors">
                          <SelectValue
                            placeholder={fetchingSigs ? "Loading..." : "Choose signature"}
                          />
                        </SelectTrigger>
                        <SelectContent className="z-[1000]">
                          {signatures.length === 0 ? (
                            <SelectItem value="none" disabled className="text-xs">
                              No signatures found
                            </SelectItem>
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
                            Click in the editor to place your cursor first, then select a signature or symbol to insert it at that position.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <EmailEditorCanvasWrapper
                    orgName={orgName}
                    logoUrl={orgLogo}
                    primaryColor={orgPrimaryColor}
                    orgEmail={orgEmail}
                    orgPhone={orgPhone}
                    isWhitelabel={Boolean(currentOrgObj?.is_whitelabel || organization?.is_whitelabel)}
                  >
                    <RichTextEditor
                      key={`editor_${activeRoleTab}`}
                      value={currentContent}
                      onChange={handleContentChange}
                      insertText={textToInsert}
                      onTextInserted={() => setTextToInsert("")}
                    />
                  </EmailEditorCanvasWrapper>
                </div>

                {/* Right Side: Dynamic Tags */}
                <div className="flex-1 flex flex-col gap-3 min-w-[240px]">
                  <div className="bg-white border border-[#DDDDDD] rounded-lg p-4 sticky top-0 h-full flex flex-col shadow-xs">
                    <h4 className="font-bold text-xs mb-2 text-[#4290E9] uppercase tracking-wider flex items-center justify-between">
                      <span>Dynamic Tags</span>
                      <span className="text-[10px] text-gray-400 font-normal">Click to insert</span>
                    </h4>
                    <p className="mb-3 text-[#888] text-[11px] leading-relaxed">
                      Click any tag to insert it at your cursor in the editor:
                    </p>
                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                      <ul className="flex flex-wrap gap-2 font-mono bg-[#f9f9f9] p-3 rounded-lg content-start border border-dashed border-[#CCCCCC]">
                        {allTags.map((ph) => {
                          const info = getTagInfo(ph);
                          return (
                            <li
                              key={ph}
                              onClick={() => handleTagClick(ph)}
                              className="cursor-pointer hover:bg-[#4290E9] hover:text-white hover:scale-105 hover:shadow-xs p-2 rounded-md transition-all text-[#555555] font-bold text-[10px] inline-block bg-white border border-[#EEEEEE] shadow-2xs select-none border-b active:translate-y-0.5"
                              title={
                                info.hasValue
                                  ? `Insert: "${info.value}"`
                                  : `Click to insert ${ph}`
                              }
                            >
                              {ph}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Identical to Global Settings */}
          <div className="px-8 py-3.5 bg-white border-t border-[#EEEEEE] flex justify-between items-center flex-shrink-0 z-20">
            <div className="text-xs text-gray-500">
              Applies to:{" "}
              <span className="font-semibold text-gray-700">
                {selectedRoles.map((r) => ROLE_LABELS[r].toUpperCase()).join(", ")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="h-[40px] px-5 text-gray-600 hover:bg-gray-100 text-xs font-semibold uppercase cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSend}
                disabled={isSending}
                className={`min-w-[140px] h-[40px] text-white ${userType}-bg hover:${userType}-bg transition-all uppercase text-xs font-bold shadow-sm flex items-center justify-center gap-2`}
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{customSendButtonText ? `${customSendButtonText}...` : "Sending..."}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{customSendButtonText || "Send Email"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      <ConfirmationDialog
        open={confirmDialog.open}
        setOpen={(isOpen) => setConfirmDialog((prev) => ({ ...prev, open: isOpen }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        hideShowAgain={true}
      />
    </Dialog>
  );
}
