"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Loader2, Smile } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { toast } from "sonner";
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

export interface RuntimeEmailEditorModalProps {
  open: boolean;
  onClose: () => void;
  eventType: string;
  eventLabel: string;
  queueRoles: (RecipientRole | string)[];
  orderUuid?: string;
  tourUuid?: string;
  serviceUuid?: string;
  slotUuid?: string;
  vendorUuid?: string;
  extraData?: Record<string, any>;
  recipientEmails?: Record<string, string | undefined>;
  recipientNames?: Record<string, string | undefined>;
  onComplete?: () => void;
  onCustomSend?: (
    staged: Record<string, { subject: string; content: string }>,
  ) => Promise<boolean | void>;
}

const ROLE_CONFIG: Record<
  string,
  { label: string; badgeBg: string; textColor: string; border: string }
> = {
  agent: {
    label: "FOR AGENT",
    badgeBg: "bg-[#2563EB]",
    textColor: "text-white",
    border: "border-blue-600",
  },
  vendor: {
    label: "FOR VENDOR",
    badgeBg: "bg-[#059669]",
    textColor: "text-white",
    border: "border-emerald-600",
  },
  old_vendor: {
    label: "FOR PREVIOUS VENDOR",
    badgeBg: "bg-[#DC2626]",
    textColor: "text-white",
    border: "border-red-600",
  },
  new_vendor: {
    label: "FOR NEW VENDOR",
    badgeBg: "bg-[#059669]",
    textColor: "text-white",
    border: "border-emerald-600",
  },
  admin: {
    label: "FOR ADMIN",
    badgeBg: "bg-[#4F46E5]",
    textColor: "text-white",
    border: "border-indigo-600",
  },
};

const COMMON_EMOJIS = [
  "✓",
  "✔",
  "✅",
  "❌",
  "⚠️",
  "⭐",
  "🔔",
  "🎉",
  "🔥",
  "💯",
  "🏠",
  "🏢",
  "📍",
  "📅",
  "🕒",
  "✉️",
  "📞",
  "💵",
  "💳",
  "📄",
  "📋",
  "🔗",
  "📷",
  "🔑",
  "📦",
  "➜",
  "➔",
  "➤",
  "•",
  "▸",
  "◆",
  "✦",
  "★",
  "👉",
  "👇",
  "😀",
  "😊",
  "👍",
  "👏",
  "👋",
  "🙏",
  "✨",
  "💡",
  "ℹ️",
  "💬",
];

const DEFAULT_DYNAMIC_TAGS = [
  "{{recipient_name}}",
  "{{service_name}}",
  "{{property_address}}",
  "{{order_id}}",
  "{{schedule_date}}",
  "{{schedule_time}}",
  "{{company_name}}",
  "{{company_phone}}",
  "{{company_email}}",
  "{{cancellation_reason}}",
  "{{cancellation_fee}}",
  "{{invoice_number}}",
  "{{action_url}}",
  "{{portal_url}}",
];

export default function RuntimeEmailEditorModal({
  open,
  onClose,
  eventType,
  eventLabel,
  queueRoles,
  orderUuid,
  tourUuid,
  serviceUuid,
  slotUuid,
  vendorUuid,
  extraData,
  recipientEmails = {},
  recipientNames = {},
  onComplete,
  onCustomSend,
}: RuntimeEmailEditorModalProps) {
  const { organizationId } = useAppContext();
  const { organization } = useOrganization();
  const { appliedSettings, organizations } = useWhiteLabel();

  const currentOrgObj = useMemo(() => {
    return (
      organizations?.find((o) => o.uuid === organizationId) ||
      organization ||
      null
    );
  }, [organizations, organizationId, organization]);

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
  const isWhitelabel = Boolean((currentOrgObj as any)?.is_whitelabel || (organization as any)?.is_whitelabel);

  // Navigation across queue: 0, 1, ...
  const [currentIndex, setCurrentIndex] = useState(0);

  // Staged data for each role: { subject: string, content: string }
  const stagedDataRef = useRef<
    Record<string, { subject: string; content: string }>
  >({});

  // Active role being edited
  const currentRole: string =
    (queueRoles[currentIndex] as string) || (queueRoles[0] as string) || "agent";

  // Current editor fields
  const [currentSubject, setCurrentSubject] = useState("");
  const [currentContent, setCurrentContent] = useState("");

  // Dynamic tags & Signatures
  const [availableVariables, setAvailableVariables] = useState<string[]>([]);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [textToInsert, setTextToInsert] = useState("");
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const rolePlaceholderValuesRef = useRef<
    Record<string, Record<string, string>>
  >({});
  const loadedRolesRef = useRef<Set<string>>(new Set());
  const extraDataRef = useRef(extraData);
  extraDataRef.current = extraData;
  const recipientNamesRef = useRef(recipientNames);
  recipientNamesRef.current = recipientNames;

  // Loading states
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [sending, setSending] = useState(false);

  // Confirmation dialog on exit
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

  // Track if current content was modified by user
  const initialContentRef = useRef<Record<string, string>>({});

  // Fetch signatures once on mount / open
  useEffect(() => {
    if (open && organizationId) {
      GetSignatures(organizationId)
        .then((res) => {
          if (res.status !== false && res.data) {
            setSignatures(res.data);
          }
        })
        .catch((err) => {
          console.error("Failed to load signatures:", err);
        });
    }
  }, [open, organizationId]);

  // Load template for a specific role
  const loadRoleTemplate = useCallback(
    async (role: RecipientRole | string) => {
      // If already staged in memory, restore immediately from memory
      if (stagedDataRef.current[role]) {
        setCurrentSubject(stagedDataRef.current[role].subject);
        setCurrentContent(stagedDataRef.current[role].content);
        if (rolePlaceholderValuesRef.current[role]) {
          setPlaceholderValues(rolePlaceholderValuesRef.current[role]);
        }
        return;
      }

      // If already fetched in this session, do not fetch again
      if (loadedRolesRef.current.has(role)) {
        return;
      }

      loadedRolesRef.current.add(role);
      setLoadingTemplate(true);
      try {
        let roleEventType = eventType;
        let roleForPreview: string = role;
        let roleVendorUuid = vendorUuid;

        if ((role as string) === "old_vendor") {
          roleEventType = "slot_cancelled";
          roleForPreview = "vendor";
          roleVendorUuid = extraDataRef.current?.old_vendor_uuid || vendorUuid;
        } else if ((role as string) === "new_vendor") {
          roleEventType = "slot_booked";
          roleForPreview = "vendor";
          roleVendorUuid = extraDataRef.current?.new_vendor_uuid || vendorUuid;
        }

        const roleRecipientName =
          recipientNamesRef.current[role] ||
          ((role as string) === "old_vendor"
            ? extraDataRef.current?.old_vendor_name
            : (role as string) === "new_vendor"
            ? extraDataRef.current?.new_vendor_name
            : undefined);

        const roleVendorName =
          (role as string) === "old_vendor"
            ? extraDataRef.current?.old_vendor_name
            : (role as string) === "new_vendor"
            ? extraDataRef.current?.new_vendor_name
            : undefined;

        const res = await GetBladePreview(roleEventType, roleForPreview, orderUuid, {
          serviceUuid,
          slotUuid,
          tourUuid,
          vendorUuid: roleVendorUuid,
          extraData: {
            ...extraDataRef.current,
            recipient_name: roleRecipientName,
            vendor_name: roleVendorName,
            vendor_uuid: roleVendorUuid,
          },
          isRuntime: true,
        });
        if (res.success && res.data) {
          const loadedHtml = res.data.content || res.data.html || "";
          const defaultSubj =
            res.data.subject ||
            `${eventLabel || eventType} (${ROLE_CONFIG[role]?.label || role})`;

          initialContentRef.current[role] = loadedHtml;
          setCurrentSubject(defaultSubj);
          setCurrentContent(loadedHtml);

          if (res.data.placeholder_values && typeof res.data.placeholder_values === "object") {
            rolePlaceholderValuesRef.current[role] = res.data.placeholder_values;
            setPlaceholderValues(res.data.placeholder_values);
          }

          if (res.data.variables && Array.isArray(res.data.variables)) {
            setAvailableVariables(res.data.variables);
          }
        } else {
          loadedRolesRef.current.delete(role);
          toast.error(res.message || `Failed to load template for ${role}`);
        }
      } catch (err) {
        loadedRolesRef.current.delete(role);
        console.error(err);
        toast.error(`Failed to load template for ${role}`);
      } finally {
        setLoadingTemplate(false);
      }
    },
    [
      eventType,
      orderUuid,
      eventLabel,
      serviceUuid,
      slotUuid,
      tourUuid,
      vendorUuid,
    ],
  );

  // When modal opens or currentIndex changes, load template for currentRole
  useEffect(() => {
    if (open && queueRoles.length > 0 && currentRole) {
      loadRoleTemplate(currentRole);
    }
  }, [open, currentIndex, queueRoles.length, currentRole, loadRoleTemplate]);

  // Reset state when opening anew
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      stagedDataRef.current = {};
      rolePlaceholderValuesRef.current = {};
      loadedRolesRef.current.clear();
      setPlaceholderValues({});
      initialContentRef.current = {};
    }
  }, [open]);

  // Helper to resolve live placeholder value
  const getTagInfo = useCallback(
    (tag: string) => {
      const rawKey = tag.replace(/[{}]/g, "").trim();
      const cleanKey = rawKey.toLowerCase();

      // Check placeholderValues from backend
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

      // Contextual fallbacks from props if backend didn't have it
      if (!matchedValue) {
        if (cleanKey === "recipient_name" && recipientNames[currentRole]) {
          matchedValue = recipientNames[currentRole]!.trim();
        } else if (cleanKey === "agent_name" && recipientNames["agent"]) {
          matchedValue = recipientNames["agent"]!.trim();
        } else if (cleanKey === "vendor_name" && recipientNames["vendor"]) {
          matchedValue = recipientNames["vendor"]!.trim();
        } else if (cleanKey === "agent_email" && recipientEmails["agent"]) {
          matchedValue = recipientEmails["agent"]!.trim();
        } else if (cleanKey === "vendor_email" && recipientEmails["vendor"]) {
          matchedValue = recipientEmails["vendor"]!.trim();
        } else if (cleanKey === "custom_message" && extraData?.custom_message) {
          matchedValue = String(extraData.custom_message).trim();
        } else if (cleanKey === "changes_summary" && extraData?.changes_summary) {
          matchedValue = String(extraData.changes_summary).trim();
        } else if ((cleanKey === "amount" || cleanKey === "total_amount") && extraData?.amount) {
          matchedValue = String(extraData.amount).trim();
        }
      }

      return {
        key: rawKey,
        value: matchedValue,
        hasValue: matchedValue !== null && matchedValue !== "",
      };
    },
    [placeholderValues, currentRole, recipientNames, recipientEmails, extraData]
  );

  // Handle Tag click: insert actual value if available, fallback to tag
  const handleTagClick = (tag: string) => {
    const info = getTagInfo(tag);

    if (info.hasValue && info.value) {
      setTextToInsert(info.value);
    } else {
      setTextToInsert(tag);
    }
  };

  // Handle Signature insertion
  const handleSignatureSelect = (sigUuid: string) => {
    const selected = signatures.find((s) => s.uuid === sigUuid);
    if (selected && selected.html_content) {
      setTextToInsert(`<br/><br/>${selected.html_content}`);
    }
  };

  // Save current step into stagedData
  const saveCurrentStep = (): Record<
    string,
    { subject: string; content: string }
  > => {
    const updated = {
      ...stagedDataRef.current,
      [currentRole]: {
        subject: currentSubject.trim(),
        content: currentContent,
      },
    };
    stagedDataRef.current = updated;
    return updated;
  };

  // Next recipient or Final Send
  const handleNextOrSend = async () => {
    if (!currentSubject.trim()) {
      toast.error("Please enter an email subject line.");
      return;
    }

    const updatedStaged = saveCurrentStep();

    // If there is a next role in queue, advance
    if (currentIndex < queueRoles.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      toast.success(
        `Saved ${ROLE_CONFIG[currentRole]?.label || currentRole} email. Now reviewing ${ROLE_CONFIG[queueRoles[currentIndex + 1]]?.label || queueRoles[currentIndex + 1]} email.`,
      );
      return;
    }

    // If a custom send handler is provided (e.g., multi-event vendor reassignment)
    if (onCustomSend) {
      setSending(true);
      try {
        const success = await onCustomSend(updatedStaged);
        if (success !== false) {
          toast.success("Email(s) dispatched successfully.");
          onComplete?.();
          onClose();
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err?.response?.data?.message || "Failed to send email");
      } finally {
        setSending(false);
      }
      return;
    }

    // Otherwise, this is the final role! Dispatch all emails!
    setSending(true);
    try {
      const contentOverrides: Record<string, string> = {};
      const subjectOverrides: Record<string, string> = {};

      queueRoles.forEach((role) => {
        const data = updatedStaged[role];
        if (data) {
          contentOverrides[role] = data.content;
          subjectOverrides[role] = data.subject;
        }
      });

      const res = await SendPreviewEmail({
        event_type: eventType,
        recipient_roles: queueRoles as any,
        content_overrides: contentOverrides,
        subject_overrides: subjectOverrides,
        order_uuid: orderUuid,
        tour_uuid: tourUuid,
        service_uuid: serviceUuid,
        slot_uuid: slotUuid,
        vendor_uuid: vendorUuid,
        options: extraData,
      });

      if (res.success !== false) {
        if (eventType === "media_uploaded") {
          toast.success("Media upload email sent to agent.");
        } else {
          toast.success("Email sent successfully.");
        }
        onComplete?.();
        onClose();
      } else {
        toast.error(res.message || "Failed to dispatch email");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  // Request close with dirty confirmation
  const handleRequestClose = () => {
    const initial = initialContentRef.current[currentRole] || "";
    const isDirty =
      currentContent !== initial && currentContent.trim().length > 0;

    if (isDirty) {
      setConfirmDialog({
        open: true,
        title: "DISCARD EMAIL CHANGES?",
        description:
          "You have unsaved changes to this email message. If you exit now, your changes will not be sent.",
        onConfirm: () => {
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          onClose();
        },
      });
    } else {
      onClose();
    }
  };

  if (!open || queueRoles.length === 0) return null;

  const roleMeta = ROLE_CONFIG[currentRole] || ROLE_CONFIG.agent;
  const isMultiRole = queueRoles.length > 1;
  const isLastRole = currentIndex === queueRoles.length - 1;
  const nextRole =
    isMultiRole && !isLastRole ? queueRoles[currentIndex + 1] : null;
  const nextRoleMeta = nextRole ? ROLE_CONFIG[nextRole] : null;

  const recipientEmail =
    recipientEmails[currentRole] ||
    (currentRole === "agent" ? "agent@example.com" : "vendor@example.com");
  const recipientName = recipientNames[currentRole] || "";

  // Combine dynamic tags
  const allTags = Array.from(
    new Set([
      ...availableVariables.map((v) => (v.startsWith("{{") ? v : `{{${v}}}`)),
      ...DEFAULT_DYNAMIC_TAGS,
    ]),
  );

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) handleRequestClose();
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => {
            e.preventDefault();
            handleRequestClose();
          }}
          className="w-[1150px] max-w-[95vw] h-[95vh] p-0 flex flex-col overflow-hidden bg-[#FAFAFA] rounded-[12px] font-alexandria shadow-2xl [&>button]:hidden"
        >
          {/* Header Bar */}
          <DialogHeader className="px-8 py-3.5 flex-shrink-0 bg-white z-20 border-b border-[#EEEEEE]">
            <DialogTitle className="flex justify-between items-center text-[#4290E9] uppercase text-[18px] font-[700] tracking-tight">
              <div className="flex items-center gap-3 flex-wrap">
                <span>{eventLabel || "CUSTOMIZE EMAIL"}</span>
                {/* Prominent Role Badge */}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider ${roleMeta.badgeBg} ${roleMeta.textColor} shadow-xs`}
                >
                  {roleMeta.label}
                </span>
                {/* Multi-role Step Counter */}
                {isMultiRole && (
                  <span className="text-xs font-semibold text-gray-500 normal-case">
                    (Step {currentIndex + 1} of {queueRoles.length})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleRequestClose}
                className="border-none shadow-none hover:bg-gray-100 rounded-full p-2 transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5 text-[#7D7D7D]" />
              </button>
            </DialogTitle>
          </DialogHeader>

          {/* Body Content */}
          <div className="flex-1 min-h-0 px-8 py-4 flex flex-col gap-3 text-[#666666] overflow-hidden">
            {/* Row 1: Email Subject (Full Width) */}
            <div className="flex flex-col gap-1.5 text-sm shrink-0">
              <Label
                htmlFor="runtime-email-subject"
                className="font-semibold text-gray-700"
              >
                Email Subject <span className="text-red-500">*</span>
              </Label>
              <Input
                id="runtime-email-subject"
                value={currentSubject}
                onChange={(e) => setCurrentSubject(e.target.value)}
                placeholder="Enter email subject line..."
                className="h-[44px] w-full bg-white border-[#DDDDDD] focus:border-[#4290E9] focus:ring-1 focus:ring-[#4290E9] transition-all rounded-md text-sm font-medium"
              />
            </div>

            {/* Row 2: Quick Accessories (Symbols & Signatures) */}
            <div className="flex items-center justify-between gap-3 text-sm flex-wrap border-b border-[#EEEEEE] pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wide">
                <span>Template Content (Inline HTML)</span>
                <span className="text-red-500">*</span>
              </div>

              <div className="items-center gap-3 flex-wrap hidden">
                {/* Common Emojis / Symbols Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="h-[34px] px-3 bg-white hover:bg-gray-50 border border-[#DDDDDD] rounded-md text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Smile className="w-4 h-4 text-amber-500" />
                      <span>Symbols</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    align="end"
                    className="w-[280px] p-3 bg-white shadow-xl rounded-xl border border-gray-200 z-[99999]"
                  >
                    <div className="text-xs font-bold text-gray-700 mb-2">
                      Click to insert symbol:
                    </div>
                    <div className="grid grid-cols-6 gap-1.5 max-h-[200px] overflow-y-auto">
                      {COMMON_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setTextToInsert(emoji)}
                          className="h-8 flex items-center justify-center text-base hover:bg-gray-100 rounded-md transition-transform active:scale-95 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Signature Selector */}
                {signatures.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">
                      Signature:
                    </span>
                    <Select onValueChange={handleSignatureSelect}>
                      <SelectTrigger className="h-[34px] min-w-[170px] bg-white border-[#DDDDDD] text-xs font-medium rounded-md">
                        <SelectValue placeholder="Choose signature" />
                      </SelectTrigger>
                      <SelectContent className="z-[99999]">
                        {signatures.map((sig) => (
                          <SelectItem
                            key={sig.uuid}
                            value={sig.uuid}
                            className="text-xs"
                          >
                            {sig.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Editor Layout (Left: RichTextEditor, Right: Dynamic Tags) */}
            <div className="flex-1 min-h-0 flex gap-5 items-stretch overflow-hidden">
              {/* Left Side: Editor with realistic Header and Footer Canvas */}
              <EmailEditorCanvasWrapper
                orgName={orgName}
                logoUrl={orgLogo}
                primaryColor={orgPrimaryColor}
                orgEmail={orgEmail}
                orgPhone={orgPhone}
                isWhitelabel={isWhitelabel}
              >
                {loadingTemplate && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-20 flex items-center justify-center gap-2 text-sm font-semibold text-[#4290E9]">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading {roleMeta.label} template...
                  </div>
                )}
                <RichTextEditor
                  key={`runtime-editor-${currentRole}`}
                  value={currentContent}
                  onChange={(val) => setCurrentContent(val)}
                  insertText={textToInsert}
                  onTextInserted={() => setTextToInsert("")}
                />
              </EmailEditorCanvasWrapper>

              {/* Right Side: Dynamic Tags Sidebar */}
              <div className="w-[260px] shrink-0 border border-[#DDDDDD] rounded-lg bg-white p-3 flex flex-col shadow-2xs min-h-0 overflow-hidden">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#EEEEEE] shrink-0">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-gray-700">
                    Dynamic Tags
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">
                    Click to insert
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 custom-scrollbar">
                  {allTags.map((tag) => {
                    const info = getTagInfo(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagClick(tag)}
                        className="px-2.5 py-1.5 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-200 hover:border-blue-300 rounded text-left font-mono text-[11px] transition-colors cursor-pointer"
                        title={
                          info.hasValue
                            ? `Insert: "${info.value}"`
                            : `Insert ${tag}`
                        }
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="px-8 py-4 bg-white border-t border-[#EEEEEE] flex items-center justify-between flex-shrink-0 z-20">
            <div className="text-xs text-gray-500 font-medium">
              <span>Sending to: </span>
              <strong className="text-gray-800">
                {recipientEmail || "recipient@example.com"}
              </strong>
              {recipientName && (
                <span className="text-gray-500 ml-1">({recipientName})</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleRequestClose}
                disabled={sending}
                className="h-[44px] px-6 text-sm font-semibold border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleNextOrSend}
                disabled={sending || loadingTemplate}
                className={`h-[44px] px-6 text-sm font-bold text-white shadow-sm flex items-center gap-2 cursor-pointer ${
                  isLastRole
                    ? "bg-[#6BAE41] hover:bg-[#5da035]"
                    : "bg-[#4290E9] hover:bg-[#327bc9]"
                }`}
              >
                {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLastRole ? (
                  <span>
                    {isMultiRole
                      ? "Confirm & Send All Emails"
                      : "Confirm & Send Email"}
                  </span>
                ) : (
                  <span>
                    Save & Next:{" "}
                    {nextRoleMeta?.label || nextRole?.toUpperCase()} Email →
                  </span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={confirmDialog.open}
        setOpen={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        hideShowAgain={true}
      />
    </>
  );
}
