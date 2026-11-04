"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { X, Info, Loader2, Eye, Edit3, FileText } from "lucide-react";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useAppContext } from "@/app/context/AppContext";
import RichTextEditor from "@/app/dashboard/calendar/components/RichTextEditor";
import { interpolateTemplate } from "@/lib/email-templates";
import {
  EmailTemplate,
  CreateTemplate,
  UpdateTemplate,
  GetBladePreview,
  RecipientRole,
} from "@/app/dashboard/global-settings/templates";
import {
  Signature,
  GetSignatures,
} from "@/app/dashboard/global-settings/signatures";
import SignatureCreatorDialog from "./SignatureCreatorDialog";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: EmailTemplate | null;
}

const REGISTERED_EVENTS = [
  { value: "order_created", label: "Order Created" },
  { value: "order_updated", label: "Order Updated" },
  { value: "order_cancelled", label: "Order Cancelled" },
  { value: "slot_booked", label: "Appointment Scheduled (Slot Booked)" },
  { value: "slot_cancelled", label: "Appointment Cancelled" },
  { value: "slot_rescheduled", label: "Appointment Rescheduled" },
  { value: "booking_reminder", label: "Booking Reminder" },
  { value: "service_completed", label: "Service Completed" },
  { value: "media_uploaded", label: "Media Uploaded / Ready" },
  { value: "agent_payment_received", label: "Payment Received" },
  { value: "vendor_payment_processed", label: "Vendor Payout Processed" },
  { value: "invoice_created", label: "Invoice Created" },
  { value: "matterport_expiry_reminder", label: "3D Tour Expiry Reminder" },
  { value: "matterport_expired", label: "3D Tour Expired" },
  { value: "matterport_renewed", label: "3D Tour Renewed" },
  {
    value: "new_print_request_submitted",
    label: "New Print Request Submitted",
  },
  { value: "print_request_ready", label: "Print Request Ready" },
  { value: "print_request_completed", label: "Print Request Completed" },
  { value: "password_reset", label: "Password Reset" },
];

const DEFAULT_DYNAMIC_TAGS = [
  "{{recipient_name}}",
  "{{agent_name}}",
  "{{agent_email}}",
  "{{agent_phone}}",
  "{{vendor_name}}",
  "{{vendor_number}}",
  "{{property_address}}",
  "{{property_location}}",
  "{{order_id}}",
  "{{service_name}}",
  "{{amount}}",
  "{{payment_for}}",
  "{{payment_scope}}",
  "{{payment_method}}",
  "{{payment_date}}",
  "{{schedule_date}}",
  "{{schedule_time}}",
  "{{new_date}}",
  "{{new_time}}",
  "{{old_date}}",
  "{{old_time}}",
  "{{invoice_number}}",
  "{{receipt_url}}",
  "{{copies}}",
  "{{with_bleed}}",
  "{{additional_info}}",
  "{{pdf_url}}",
  "{{cancellation_reason}}",
  "{{cancellation_fee}}",
  "{{expiry_date}}",
  "{{new_expiry_date}}",
  "{{duration_months}}",
  "{{days_remaining}}",
  "{{renewal_url}}",
  "{{service_url}}",
  "{{completed_by}}",
  "{{media_count}}",
  "{{custom_message}}",
  "{{changes_summary}}",
  "{{company_name}}",
  "{{company_email}}",
  "{{company_phone}}",
];

const COMMON_EMOJIS = [
  {
    cat: "Checkmarks & Status",
    items: ["✓", "✔", "✅", "❌", "⚠️", "⭐", "🔔", "🎉", "🔥", "💯"],
  },
  {
    cat: "Real Estate & Orders",
    items: [
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
    ],
  },
  {
    cat: "Arrows & Bullets",
    items: ["➜", "➔", "➤", "•", "▸", "◆", "✦", "★", "👉", "👇"],
  },
  {
    cat: "General",
    items: ["😀", "😊", "👍", "👏", "👋", "🙏", "✨", "💡", "ℹ️", "💬"],
  },
];

const DUMMY_PREVIEW_VALUES: Record<string, string> = {
  order_id: "1001",
  property_address: "123 Main Street, Vancouver, BC",
  property_location: "Vancouver, BC",
  listing_address: "123 Main Street, Vancouver, BC",
  listing_location: "Vancouver, BC",
  service_name: "Matterport 3D Tour & 2D Floor Plan",
  recipient_name: "Sarah Jenkins",
  user_name: "Sarah Jenkins",
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
  appointment_date: "November 3, 2026",
  date: "November 3, 2026",
  schedule_time: "10:00 AM - 11:30 AM",
  appointment_time: "10:00 AM - 11:30 AM",
  start_time: "10:00 AM",
  end_time: "11:30 AM",
  new_date: "November 5, 2026",
  new_time: "2:00 PM - 3:30 PM",
  old_date: "November 1, 2026",
  old_time: "9:00 AM - 10:30 AM",
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
  custom_message:
    "High-resolution photos and Matterport scan are ready for download.",
  changes_summary: "Appointment rescheduled to Nov 5, 2026 at 2:00 PM",
  reset_link: "https://teams.tojuco.com/reset-password?token=sample",
  company_name: "commerx",
  company_email: "moazam@commerx.com",
  company_phone: "123456789",
};

function buildMasterHtml(
  content: string,
  orgName: string = "commerx",
  primaryColor: string = "#2563EB",
) {
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
                    <!-- Header Branding -->
                    <tr>
                        <td align="center" style="padding: 30px 20px; background-color: #ffffff; border-bottom: 3px solid ${primaryColor};">
                            <h2 style="margin: 0; color: #333333; font-size: 24px; font-weight: bold; font-family: Arial, sans-serif;">${orgName}</h2>
                        </td>
                    </tr>
                    <!-- Content Body -->
                    <tr>
                        <td style="padding: 40px 30px; font-family: Arial, sans-serif; color: #3d4852; line-height: 1.6; font-size: 14px;">
                            ${content}
                        </td>
                    </tr>
                    <!-- Footer -->
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

const AddTemplateDialog: React.FC<Props> = ({
  open,
  setOpen,
  onSuccess,
  initialData,
}) => {
  const { userType, organizationId } = useAppContext();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [content, setContent] = useState("");
  const [recipientRoles, setRecipientRoles] = useState<RecipientRole[]>([
    "agent",
  ]);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [openSignatureCreator, setOpenSignatureCreator] = useState(false);

  const [textToInsert, setTextToInsert] = useState("");
  const [availableVariables, setAvailableVariables] = useState<string[]>([]);

  // Preview state
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");
  const [loadingBlade, setLoadingBlade] = useState(false);
  const [editorKey, setEditorKey] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [fetchingSigs, setFetchingSigs] = useState(false);

  // Track snapshot when dialog opened or template loaded, to detect unsaved changes
  const initialSnapshotRef = React.useRef<{
    title: string;
    type: string;
    content: string;
    recipientRoles: string[];
    isActive: boolean;
    tags: string[];
  }>({
    title: "",
    type: "",
    content: "",
    recipientRoles: ["agent"],
    isActive: true,
    tags: [],
  });

  // Track the default design content for the currently loaded event type
  const defaultDesignRef = React.useRef<string | null>(null);

  // Confirmation dialog state (reusing @/components/ConfirmationDialog)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    secondaryAction?: {
      label: string;
      onClick: () => void;
      className?: string;
    };
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    if (open) {
      setPreviewMode("edit");
      if (initialData) {
        const initTitle = initialData.title || "";
        const initType = initialData.event_type || initialData.type || "";
        const initTags = initialData.tags || [];
        const initContent = initialData.content || "";
        const initActive =
          initialData.is_active !== undefined ? initialData.is_active : true;
        const initRoles =
          Array.isArray(initialData.recipient_type) &&
          initialData.recipient_type.length > 0
            ? initialData.recipient_type
            : (["agent"] as RecipientRole[]);

        setTitle(initTitle);
        setType(initType);
        setTags(initTags);
        setContent(initContent);
        setIsActive(initActive);
        setRecipientRoles(initRoles);

        initialSnapshotRef.current = {
          title: initTitle,
          type: initType,
          content: initContent,
          recipientRoles: initRoles,
          isActive: initActive,
          tags: initTags,
        };
      } else {
        setTitle("");
        setType("");
        setTags([]);
        setTagInput("");
        setContent("");
        setRecipientRoles(["agent"]);
        setIsActive(true);
        setAvailableVariables([]);

        initialSnapshotRef.current = {
          title: "",
          type: "",
          content: "",
          recipientRoles: ["agent"],
          isActive: true,
          tags: [],
        };
      }
      defaultDesignRef.current = null;

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

  // Check if form has unsaved modifications
  const hasUnsavedChanges = useCallback(() => {
    const snap = initialSnapshotRef.current;
    const normCurrent = content
      .trim()
      .replace(/^<p><\/p>$/, "")
      .replace(/^<p><br\s*\/?><\/p>$/, "");
    const normSnap = snap.content
      .trim()
      .replace(/^<p><\/p>$/, "")
      .replace(/^<p><br\s*\/?><\/p>$/, "");

    const contentChanged = normCurrent !== normSnap;
    const titleChanged = title.trim() !== snap.title.trim();
    const typeChanged = type !== snap.type;
    const activeChanged = isActive !== snap.isActive;
    const rolesChanged =
      JSON.stringify([...recipientRoles].sort()) !==
      JSON.stringify([...snap.recipientRoles].sort());
    const tagsChanged =
      JSON.stringify([...tags].sort()) !==
      JSON.stringify([...snap.tags].sort());

    return (
      contentChanged ||
      titleChanged ||
      typeChanged ||
      activeChanged ||
      rolesChanged ||
      tagsChanged
    );
  }, [content, title, type, isActive, recipientRoles, tags]);

  // Handle closing with unsaved changes check
  const handleRequestClose = useCallback(() => {
    if (hasUnsavedChanges()) {
      setConfirmDialog({
        open: true,
        title: "DISCARD CHANGES",
        description:
          "You have unsaved changes in this template. Are you sure you want to close? Your changes will be lost.",
        onConfirm: () => {
          setOpen(false);
        },
      });
    } else {
      setOpen(false);
    }
  }, [hasUnsavedChanges, setOpen]);

  // Load default blade template for selected event
  const handleLoadBladeTemplate = useCallback(
    async (
      selectedType?: string,
      roleOverride?: string,
      forceTitleUpdate: boolean = false,
    ) => {
      const targetType = selectedType || type;
      if (!targetType) {
        toast.error("Please select a template type first");
        return;
      }

      const role = roleOverride || recipientRoles[0] || "agent";
      setLoadingBlade(true);
      try {
        const res = await GetBladePreview(targetType, role, undefined, { loadDefault: true });
        if (res.success && res.data) {
          const data = res.data;
          const newContent = data.content || "";
          setContent(newContent);
          defaultDesignRef.current = newContent;
          setEditorKey((prev) => prev + 1);

          if (data.variables && Array.isArray(data.variables)) {
            setAvailableVariables(data.variables);
          }

          // Load default subject title with dynamic variables
          const defaultTitleCandidate = data.subject || data.event_label || "";
          const isDefaultTitle =
            !title.trim() ||
            REGISTERED_EVENTS.some(
              (e) => e.label === title || e.value === title,
            ) ||
            title.includes("{{") ||
            title === data.event_label;

          if (
            defaultTitleCandidate &&
            (forceTitleUpdate || isDefaultTitle || !initialData)
          ) {
            setTitle(defaultTitleCandidate);
          }
        } else {
          toast.error(res.message || "Failed to load default template");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load default blade template");
      } finally {
        setLoadingBlade(false);
      }
    },
    [type, recipientRoles, title, initialData],
  );

  // User clicks "Load Default" (or "Reload Default Design")
  const handleLoadDefaultClick = () => {
    if (!type) {
      toast.error("Please select an event type first");
      return;
    }

    const normCurrent = content
      .trim()
      .replace(/^<p><\/p>$/, "")
      .replace(/^<p><br\s*\/?><\/p>$/, "");
    const normDefault = (defaultDesignRef.current || "")
      .trim()
      .replace(/^<p><\/p>$/, "")
      .replace(/^<p><br\s*\/?><\/p>$/, "");

    const isChangedFromDefault =
      defaultDesignRef.current !== null
        ? normCurrent !== normDefault
        : normCurrent.length > 0;

    if (isChangedFromDefault) {
      setConfirmDialog({
        open: true,
        title: "RELOAD DEFAULT DESIGN",
        description:
          "Your current changes will be lost and replaced with the original default template. Are you sure you want to reload the default design?",
        onConfirm: () => {
          handleLoadBladeTemplate(undefined, undefined, true);
        },
      });
    } else {
      handleLoadBladeTemplate(undefined, undefined, true);
    }
  };

  // User clicks "Start with Blank"
  const handleStartBlankClick = () => {
    const normCurrent = content
      .trim()
      .replace(/^<p><\/p>$/, "")
      .replace(/^<p><br\s*\/?><\/p>$/, "");
    if (!normCurrent) {
      setContent("<p></p>");
      setEditorKey((prev) => prev + 1);
      return;
    }

    setConfirmDialog({
      open: true,
      title: "START WITH BLANK TEMPLATE",
      description:
        "Are you sure you want to clear this template? The current design and all content will be removed, giving you a blank editor.",
      onConfirm: () => {
        setContent("<p></p>");
        setEditorKey((prev) => prev + 1);
        toast.info("Editor cleared to a blank document.");
      },
    });
  };

  // Trigger template reload whenever template type changes
  const handleTypeChange = (newType: string) => {
    const normCurrent = content
      .trim()
      .replace(/^<p><\/p>$/, "")
      .replace(/^<p><br\s*\/?><\/p>$/, "");
    const normDefault = (defaultDesignRef.current || "")
      .trim()
      .replace(/^<p><\/p>$/, "")
      .replace(/^<p><br\s*\/?><\/p>$/, "");
    const isChanged =
      defaultDesignRef.current !== null
        ? normCurrent !== normDefault
        : normCurrent.length > 0;

    if (isChanged && type) {
      setConfirmDialog({
        open: true,
        title: "CHANGE EVENT TYPE",
        description:
          "Changing the event type will replace your current design with the default design of the selected event. Are you sure you want to proceed?",
        confirmText: "OK",
        cancelText: "Cancel",
        onConfirm: () => {
          setType(newType);
          handleLoadBladeTemplate(newType, undefined, true);
        },
        secondaryAction: {
          label: "Change Type Only",
          onClick: async () => {
            setType(newType);
            try {
              const role = recipientRoles[0] || "agent";
              const res = await GetBladePreview(newType, role, undefined, {
                loadDefault: true,
              });
              if (res.success && res.data) {
                if (res.data.variables && Array.isArray(res.data.variables)) {
                  setAvailableVariables(res.data.variables);
                }
                if (res.data.content) {
                  defaultDesignRef.current = res.data.content;
                }
              }
            } catch (err) {
              console.error("Failed to load variables for new event type", err);
            }
          },
        },
      });
    } else {
      setType(newType);
      handleLoadBladeTemplate(newType, undefined, true);
    }
  };

  const handleRoleToggle = (role: RecipientRole) => {
    if (recipientRoles.includes(role)) {
      if (recipientRoles.length === 1) {
        toast.error("At least one recipient role must be selected");
        return;
      }
      setRecipientRoles(recipientRoles.filter((r) => r !== role));
    } else {
      setRecipientRoles([...recipientRoles, role]);
    }
  };

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
    if (recipientRoles.length === 0) {
      toast.error(
        "Please select at least one recipient type (Admin, Agent, or Vendor)",
      );
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
        event_type: type,
        recipient_type: recipientRoles,
        tags: tags.length > 0 ? tags : null,
        is_active: isActive,
        content,
      };

      if (initialData) {
        const res = await UpdateTemplate(initialData.uuid, payload);
        if (res.success !== false) {
          toast.success("Template updated successfully");
          initialSnapshotRef.current = {
            title,
            type,
            content,
            recipientRoles,
            isActive,
            tags,
          };
          onSuccess();
          setOpen(false);
        } else {
          toast.error(res.message || "Failed to update template");
        }
      } else {
        const res = await CreateTemplate(payload);
        if (res.success !== false) {
          toast.success("Template created successfully");
          initialSnapshotRef.current = {
            title,
            type,
            content,
            recipientRoles,
            isActive,
            tags,
          };
          onSuccess();
          setOpen(false);
        } else {
          toast.error(res.message || "Failed to create template");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(
        initialData ? "Failed to update template" : "Failed to create template",
      );
    } finally {
      setLoading(false);
    }
  };

  // Full preview document rendered in iframe
  const fullPreviewDoc = useMemo(() => {
    let rawHtml = content || "<p>No content provided</p>";

    // Replace all {{placeholders}} with realistic dummy values
    Object.entries(DUMMY_PREVIEW_VALUES).forEach(([key, val]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
      rawHtml = rawHtml.replace(regex, val);
    });

    // Also interpolate single brace or human readable placeholders if any
    rawHtml = interpolateTemplate(rawHtml, DUMMY_PREVIEW_VALUES);

    if (rawHtml.includes("<!DOCTYPE") || rawHtml.includes("<html")) {
      return rawHtml;
    }

    return buildMasterHtml(rawHtml, "commerx");
  }, [content]);

  // Combine event specific variables and defaults without duplicates
  const allTags = Array.from(
    new Set([
      ...availableVariables.map((v) => (v.startsWith("{{") ? v : `{{${v}}}`)),
      ...DEFAULT_DYNAMIC_TAGS,
    ]),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleRequestClose();
        } else {
          setOpen(true);
        }
      }}
    >
      <DialogContent
        onPointerDownOutside={(e) => {
          if (hasUnsavedChanges()) {
            e.preventDefault();
            handleRequestClose();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (hasUnsavedChanges()) {
            e.preventDefault();
            handleRequestClose();
          }
        }}
        className="w-[1150px] max-w-[95vw] h-[95vh] p-0 flex flex-col overflow-hidden bg-[#FAFAFA] rounded-[12px] font-alexandria shadow-2xl"
      >
        <DialogHeader className="px-8 py-4 flex-shrink-0 bg-white z-20 border-b border-[#EEEEEE]">
          <DialogTitle className="flex justify-between items-center text-[#4290E9] uppercase text-[20px] font-[700] tracking-tight">
            <span>
              {initialData ? "Edit Email Template" : "Create Email Template"}
            </span>
            <button
              type="button"
              onClick={handleRequestClose}
              className="border-none shadow-none hover:bg-gray-100 rounded-full p-2 transition-all cursor-pointer"
              title="Close"
            >
              <X className="w-6 h-6 text-[#7D7D7D]" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden text-[#666666]"
        >
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-5 flex flex-col gap-5">
            {/* Row 1: Template Title (Full width for extra content & variables) */}
            <div className="flex flex-col gap-1.5 text-sm">
              <Label htmlFor="title" className="font-semibold text-gray-700">
                Template Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Order Created Notification"
                className="h-[44px] w-full bg-white border-[#DDDDDD] focus:border-[#4290E9] focus:ring-1 focus:ring-[#4290E9] transition-all rounded-md"
              />
            </div>

            {/* Row 2: Event Type and Action Buttons */}
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between items-center">
                <Label htmlFor="type" className="font-semibold text-gray-700">
                  Event Type <span className="text-red-500">*</span>
                </Label>
                {type && (
                  <button
                    type="button"
                    onClick={handleLoadDefaultClick}
                    disabled={loadingBlade}
                    className="text-xs font-semibold text-[#4290E9] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {loadingBlade && (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    )}
                    Reload Default Design
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Select value={type} onValueChange={handleTypeChange}>
                  <SelectTrigger
                    id="type"
                    className="h-[44px] bg-white border-[#DDDDDD] transition-all rounded-md flex-1 min-w-[280px]"
                  >
                    <SelectValue placeholder="Select an event type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {REGISTERED_EVENTS.map((ev) => (
                      <SelectItem key={ev.value} value={ev.value}>
                        {ev.label}{" "}
                        <span className="text-gray-400 text-xs">
                          ({ev.value})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  disabled={!type || loadingBlade}
                  onClick={handleLoadDefaultClick}
                  className="h-[44px] px-4 bg-[#4290E9] hover:bg-[#327bc9] text-white font-bold text-xs flex items-center gap-1.5 shrink-0 rounded-md shadow-xs transition-colors cursor-pointer border-none"
                  title="Load original pixel-perfect Blade template with styling and variables"
                >
                  {loadingBlade && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Load Default</span>
                </Button>
                <Button
                  type="button"
                  disabled={loadingBlade}
                  onClick={handleStartBlankClick}
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
                    {
                      id: "admin" as RecipientRole,
                      label: "Admin",
                      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
                    },
                    {
                      id: "agent" as RecipientRole,
                      label: "Agent",
                      color: "bg-blue-50 text-blue-700 border-blue-200",
                    },
                    {
                      id: "vendor" as RecipientRole,
                      label: "Vendor",
                      color:
                        "bg-emerald-50 text-emerald-700 border-emerald-200",
                    },
                  ].map((role) => {
                    const checked = recipientRoles.includes(role.id);
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
                    <Label
                      htmlFor="isActive"
                      className="cursor-pointer font-medium text-gray-700 text-xs"
                    >
                      Status:{" "}
                      <strong
                        className={isActive ? "text-[#6BAE41]" : "text-red-500"}
                      >
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

            {/* Row 3: Tags (only in Editor mode) */}
            {previewMode === "edit" && (
              <div className="flex flex-col gap-1.5 text-sm">
                <Label
                  htmlFor="tags"
                  className="font-semibold text-gray-700 text-xs"
                >
                  Tags / Badges
                </Label>
                <div className="flex flex-wrap gap-2 items-center bg-white border-[#DDDDDD] border rounded-md p-2 min-h-[40px]">
                  {tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full text-xs text-[#4290E9] font-medium"
                    >
                      {t}
                      <X
                        className="w-3 h-3 cursor-pointer text-blue-400 hover:text-blue-600 transition-colors"
                        onClick={() =>
                          setTags(tags.filter((_, i) => i !== idx))
                        }
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
                        if (
                          tagInput.trim() &&
                          !tags.includes(tagInput.trim())
                        ) {
                          setTags([...tags, tagInput.trim()]);
                          setTagInput("");
                        }
                      }
                    }}
                    placeholder="Type tag and press Enter"
                    className="flex-1 bg-transparent min-w-[150px] outline-none border-none text-xs placeholder:text-gray-400 py-0.5"
                  />
                </div>
              </div>
            )}

            {/* Row 4: Editor or Full Preview */}
            {previewMode === "preview" ? (
              /* FULL EMAIL PREVIEW MODE: Full width, clean scrollable iframe */
              <div className="flex-1 flex flex-col gap-3 min-h-[620px] h-[680px] bg-[#EFEFEF] rounded-xl p-4 border border-[#CCCCCC]">
                <div className="flex justify-between items-center px-2 flex-shrink-0">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#4290E9]" />
                    Interactive Email Preview
                    <span className="text-gray-400 font-normal">
                      (Scroll inside the preview to see the complete email from
                      header to footer)
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
                      Template Content (Inline HTML)
                      <span className="text-red-500">*</span>
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
                                <div
                                  key={group.cat}
                                  className="flex flex-col gap-1"
                                >
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
                            placeholder={
                              fetchingSigs ? "Loading..." : "Choose signature"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="z-[1000]">
                          {signatures.length === 0 ? (
                            <SelectItem
                              value="none"
                              disabled
                              className="text-xs"
                            >
                              No signatures found
                            </SelectItem>
                          ) : (
                            signatures.map((sig) => (
                              <SelectItem
                                key={sig.uuid}
                                value={sig.uuid}
                                className="text-xs"
                              >
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
                          <TooltipContent
                            side="top"
                            className="max-w-[220px] text-xs text-center"
                          >
                            Click in the editor to place your cursor first, then
                            select a signature or symbol to insert it at that
                            position.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div
                    className="border border-[#DDDDDD] bg-white rounded-lg p-0 flex-1 w-full max-w-full flex flex-col min-h-[460px] overflow-hidden shadow-inner relative"
                  >
                    {open && (
                      <RichTextEditor
                        key={`editor_${type}_${editorKey}`}
                        value={content}
                        onChange={setContent}
                        insertText={textToInsert}
                        onTextInserted={() => setTextToInsert("")}
                      />
                    )}
                  </div>
                </div>

                {/* Right Side: Placeholders */}
                <div className="flex-1 flex flex-col gap-3 min-w-[240px]">
                  <div className="bg-white border border-[#DDDDDD] rounded-lg p-4 sticky top-0 h-full flex flex-col shadow-xs">
                    <h4 className="font-bold text-xs mb-2 text-[#4290E9] uppercase tracking-wider flex items-center justify-between">
                      <span>Dynamic Tags</span>
                      <span className="text-[10px] text-gray-400 font-normal">
                        Click to insert
                      </span>
                    </h4>
                    <p className="mb-3 text-[#888] text-[11px] leading-relaxed">
                      Click any tag to insert it at your cursor in the editor:
                    </p>
                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                      <ul className="flex flex-wrap gap-2 font-mono bg-[#f9f9f9] p-3 rounded-lg content-start border border-dashed border-[#CCCCCC]">
                        {allTags.map((ph) => (
                          <li
                            key={ph}
                            onClick={() => setTextToInsert(ph)}
                            className="cursor-pointer hover:bg-[#4290E9] hover:text-white hover:scale-105 hover:shadow-xs p-2 rounded-md transition-all text-[#555555] font-bold text-[10px] inline-block bg-white border border-[#EEEEEE] shadow-2xs select-none border-b active:translate-y-0.5"
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

          <div className="px-8 py-3.5 bg-white border-t border-[#EEEEEE] flex justify-between items-center flex-shrink-0 z-20">
            <div className="text-xs text-gray-500">
              Applies to:{" "}
              <span className="font-semibold text-gray-700">
                {recipientRoles.join(", ").toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleRequestClose}
                className="h-[40px] px-5 text-gray-600 hover:bg-gray-100 text-xs font-semibold uppercase cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className={`min-w-[140px] h-[40px] text-white ${userType}-bg hover:${userType}-bg transition-all uppercase text-xs font-bold shadow-sm`}
              >
                {loading
                  ? "Saving..."
                  : initialData
                    ? "Update Template"
                    : "Save Template"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
      <SignatureCreatorDialog
        open={openSignatureCreator}
        setOpen={setOpenSignatureCreator}
        onSave={(sig: Signature) => setTextToInsert(sig.html_content)}
      />
      <ConfirmationDialog
        open={confirmDialog.open}
        setOpen={(isOpen) =>
          setConfirmDialog((prev) => ({ ...prev, open: isOpen }))
        }
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        secondaryAction={confirmDialog.secondaryAction}
        hideShowAgain={true}
      />
    </Dialog>
  );
};

export default AddTemplateDialog;
