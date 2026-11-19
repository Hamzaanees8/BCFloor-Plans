"use client";
import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { RefreshCcw, Bell, Clock, Info, Eye, Edit3, Plus, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { 
    fetchNotificationEvents, 
    fetchNotificationPreferences, 
    updateNotificationPreferences,
    NotificationEvent,
    UserPreference,
    TimingInterval
} from "@/lib/email-templates";
import { 
    EmailTemplate, 
    GetTemplates, 
    GetBladePreview, 
    RecipientRole 
} from "@/app/dashboard/global-settings/templates";
import AddTemplateDialog from "./AddTemplateDialog";
import TemplatePreviewDialog, { DefaultPreviewInfo } from "./TemplatePreviewDialog";
import SignatureCreatorDialog from "./SignatureCreatorDialog";
import { Signature, GetSignatures, DeleteSignature } from "@/app/dashboard/global-settings/signatures";
import { GetCompany } from "@/app/dashboard/global-settings/global-settings";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import DropdownActions from "./DropdownActions";
import { DateTime } from "luxon";
import IntervalSelector from "./IntervalSelector";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { EVENT_METADATA } from "./AddTemplateDialog";

export interface EmailNotificationsSettingsRef {
    save: () => Promise<void>;
}

const EmailNotificationsSettings = forwardRef<EmailNotificationsSettingsRef>((props, ref) => {
    const { userType, organizationId, setOrganizationId } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const [events, setEvents] = useState<NotificationEvent[]>([]);
    const [preferences, setPreferences] = useState<UserPreference[]>([]);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [eventIntervals, setEventIntervals] = useState<Record<string, TimingInterval[]>>({});
    const [loading, setLoading] = useState(true);
    const [sigsLoading, setSigsLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Template Modals state
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<EmailTemplate | null>(null);
    const [presetEventType, setPresetEventType] = useState<string | null>(null);
    const [presetRole, setPresetRole] = useState<RecipientRole | null>(null);

    const [templateToPreview, setTemplateToPreview] = useState<EmailTemplate | null>(null);
    const [defaultPreviewData, setDefaultPreviewData] = useState<DefaultPreviewInfo | null>(null);
    const [previewLoadingKey, setPreviewLoadingKey] = useState<string | null>(null);

    // Signature Modal state
    const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
    const [signatureToEdit, setSignatureToEdit] = useState<Signature | null>(null);

    // Helpers to determine timing support with fallbacks
    const isEventTimed = (ev: NotificationEvent) => {
        return Boolean(
            ev.has_timing ||
            ev.event_type === "booking_reminder" ||
            ev.event_type === "matterport_expiry_reminder"
        );
    };

    const getSupportedUnitsForEvent = (ev: NotificationEvent) => {
        if (ev.supported_units && ev.supported_units.length > 0) {
            return ev.supported_units;
        }
        if (ev.event_type === "matterport_expiry_reminder") {
            return ["days", "weeks"];
        }
        return ["hours", "days"];
    };

    const getDefaultIntervalsForEvent = (ev: NotificationEvent): TimingInterval[] => {
        if (ev.default_intervals && ev.default_intervals.length > 0) {
            return ev.default_intervals;
        }
        if (ev.event_type === "matterport_expiry_reminder") {
            return [
                { value: 30, unit: "days" },
                { value: 14, unit: "days" },
                { value: 7, unit: "days" },
                { value: 1, unit: "days" },
            ];
        }
        return [
            { value: 24, unit: "hours" },
            { value: 1, unit: "hours" },
        ];
    };

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

    const refreshTemplates = useCallback(async () => {
        try {
            const res = await GetTemplates();
            if (res.success && res.data) {
                setTemplates(res.data);
            }
        } catch (err) {
            console.error("Failed to refresh templates", err);
        }
    }, []);

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const [eventsRes, prefsRes, templatesRes] = await Promise.all([
                fetchNotificationEvents(),
                fetchNotificationPreferences(),
                GetTemplates()
            ]);

            const fetchedEvents: NotificationEvent[] = eventsRes.success && eventsRes.data ? eventsRes.data : [];
            const fetchedPrefs: UserPreference[] = prefsRes.success && prefsRes.data ? prefsRes.data : [];

            setEvents(fetchedEvents);
            setPreferences(fetchedPrefs);

            if (templatesRes.success && templatesRes.data) {
                setTemplates(templatesRes.data);
            } else {
                setTemplates([]);
            }

            // Populate event intervals map
            const initialIntervals: Record<string, TimingInterval[]> = {};
            fetchedEvents.forEach((ev) => {
                if (isEventTimed(ev)) {
                    // Check if any role has saved intervals for this event
                    const savedPref = fetchedPrefs.find(
                        (p) => p.event_type === ev.event_type && Array.isArray(p.intervals) && p.intervals.length > 0
                    );
                    initialIntervals[ev.event_type] = savedPref?.intervals || getDefaultIntervalsForEvent(ev);
                }
            });
            setEventIntervals(initialIntervals);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load email preferences");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();

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
    }, [loadSettings, fetchSignatures, organizationId, setOrganizationId]);

    // Check if an email event is enabled for a given role
    const isEnabled = useCallback((eventType: string, roleName: string): boolean => {
        // Find saved preference override
        const pref = preferences.find(
            (p) => p.event_type === eventType && p.role === roleName
        );
        if (pref) {
            return pref.email_enabled;
        }

        // Fallback to config default
        const event = events.find((e) => e.event_type === eventType);
        return event?.defaults[roleName] ?? false;
    }, [preferences, events]);

    // Toggle the preference setting locally
    const handleToggle = (eventType: string, roleName: string) => {
        const currentVal = isEnabled(eventType, roleName);
        
        // Update local preferences list
        setPreferences((prev) => {
            const index = prev.findIndex(
                (p) => p.event_type === eventType && p.role === roleName
            );

            if (index > -1) {
                const updated = [...prev];
                updated[index] = { ...updated[index], email_enabled: !currentVal };
                return updated;
            } else {
                return [...prev, { role: roleName, event_type: eventType, email_enabled: !currentVal }];
            }
        });
    };

    // Handle interval updates for timed events
    const handleIntervalChange = (eventType: string, updatedIntervals: TimingInterval[]) => {
        setEventIntervals((prev) => ({
            ...prev,
            [eventType]: updatedIntervals,
        }));
    };

    // Save preferences to backend
    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            const payload: Array<{
                role: string;
                event_type: string;
                email_enabled: boolean;
                intervals?: TimingInterval[] | null;
            }> = [];
            
            events.forEach((event) => {
                if (event.always_send) return; // Skip saving always_send defaults

                const intervalsForEvent = isEventTimed(event)
                    ? (eventIntervals[event.event_type] || getDefaultIntervalsForEvent(event))
                    : null;

                event.recipients.forEach((roleName) => {
                    payload.push({
                        role: roleName,
                        event_type: event.event_type,
                        email_enabled: isEnabled(event.event_type, roleName),
                        intervals: intervalsForEvent,
                    });
                });
            });

            const res = await updateNotificationPreferences(payload);
            if (res.success) {
                toast.success("Notification preferences saved successfully");
                loadSettings();
            } else {
                toast.error("Failed to save changes");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    }, [events, eventIntervals, isEnabled, loadSettings]);

    useImperativeHandle(ref, () => ({
        save: handleSave,
    }), [handleSave]);

    // Find custom template matching specific event and role
    const getTemplateForEventAndRole = (eventType: string, roleName: string): EmailTemplate | undefined => {
        // 1. Role-specific match
        const exactMatch = templates.find((t) =>
            (t.event_type === eventType || t.type === eventType) &&
            Array.isArray(t.recipient_type) &&
            t.recipient_type.includes(roleName as RecipientRole)
        );
        if (exactMatch) return exactMatch;

        // 2. All-roles / General match
        const generalMatch = templates.find((t) =>
            (t.event_type === eventType || t.type === eventType) &&
            (!t.recipient_type || t.recipient_type.length === 0)
        );
        return generalMatch;
    };

    // Preview click: custom template or default Blade preview
    const handlePreviewClick = async (eventType: string, roleName: RecipientRole, customTemplate?: EmailTemplate) => {
        if (customTemplate) {
            setTemplateToPreview(customTemplate);
            setDefaultPreviewData(null);
            setOpenPreviewDialog(true);
            return;
        }

        const loadingKey = `${eventType}-${roleName}`;
        setPreviewLoadingKey(loadingKey);
        try {
            const res = await GetBladePreview(eventType, roleName, undefined, {
                loadDefault: true,
                organizationId: organizationId || undefined,
            });
            if (res.success && res.data) {
                const data = res.data;
                setTemplateToPreview(null);
                setDefaultPreviewData({
                    eventType,
                    role: roleName,
                    subject: data.subject || data.event_label,
                    fullHtml: data.full_html,
                    content: data.content,
                });
                setOpenPreviewDialog(true);
            } else {
                toast.error(res.message || "Failed to load default template preview");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch default template preview");
        } finally {
            setPreviewLoadingKey(null);
        }
    };

    // Edit click: opens AddTemplateDialog with custom template or preloaded default presets
    const handleEditClick = (eventType: string, roleName: RecipientRole, customTemplate?: EmailTemplate) => {
        if (customTemplate) {
            setTemplateToEdit(customTemplate);
            setPresetEventType(null);
            setPresetRole(null);
        } else {
            setTemplateToEdit(null);
            setPresetEventType(eventType);
            setPresetRole(roleName);
        }
        setOpenAddDialog(true);
    };

    // Delete signature handler
    const handleSignatureDelete = async (sigUuid: string) => {
        if (!organizationId) return;
        try {
            const res = await DeleteSignature(sigUuid);
            if (res.status !== false) {
                setSignatures((prev) => prev.filter((s) => s.uuid !== sigUuid));
                toast.success("Signature deleted successfully");
            } else {
                toast.error(res.message || "Failed to delete signature");
            }
        } catch {
            toast.error("Failed to delete signature");
        }
    };

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
        },
    ];

    // Helper to render role column cell with Switch, Status Badge & Action Links
    const renderRoleCell = (event: NotificationEvent, roleName: RecipientRole) => {
        const isEligible = event.recipients.includes(roleName);
        if (!isEligible) {
            return (
                <td className="px-6 py-5 text-center align-top pt-6" style={{ width: "21%" }}>
                    <span className="text-xs text-gray-300">—</span>
                </td>
            );
        }

        const customTemplate = getTemplateForEventAndRole(event.event_type, roleName);
        const isLoadingPreview = previewLoadingKey === `${event.event_type}-${roleName}`;

        return (
            <td className="px-4 py-5 align-top pt-5" style={{ width: "21%" }}>
                <div className="flex flex-col items-center">
                    {/* Switch / Always on */}
                    {event.always_send ? (
                        <span className="text-[10px] font-bold text-[#10B981] bg-[#ECFDF5] px-2 py-1 rounded">
                            ALWAYS ON
                        </span>
                    ) : (
                        <div className="flex justify-center">
                            <Switch 
                                checked={isEnabled(event.event_type, roleName)}
                                onCheckedChange={() => handleToggle(event.event_type, roleName)}
                                className="data-[state=checked]:bg-[#6BAE41] data-[state=unchecked]:bg-red-500 cursor-pointer"
                            />
                        </div>
                    )}

                    {/* Template Controls (Single row: Eye icon button + Edit link with hover badge borders) */}
                    <div className="flex items-center justify-center mt-2.5 pt-2 border-t border-gray-100 gap-1.5 w-full">
                        {/* Preview Icon Button (Just Eye Icon with hover badge/border) */}
                        <button
                            type="button"
                            disabled={isLoadingPreview}
                            onClick={() => handlePreviewClick(event.event_type, roleName, customTemplate)}
                            className="p-1.5 rounded-md border border-transparent hover:border-orange-300 hover:bg-orange-50/70 text-[#EA580C] hover:text-[#C2410C] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                            title={customTemplate ? "Preview Custom Template" : "Preview Default Template"}
                        >
                            {isLoadingPreview ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EA580C]" />
                            ) : (
                                <Eye className="w-3.5 h-3.5 text-[#EA580C]" />
                            )}
                        </button>

                        {/* Edit Link Button (Preserved text with hover badge/border) */}
                        <button
                            type="button"
                            onClick={() => handleEditClick(event.event_type, roleName, customTemplate)}
                            className={`px-2 py-1 rounded-md border border-transparent transition-all flex items-center gap-1 text-[11px] font-semibold cursor-pointer whitespace-nowrap ${
                                customTemplate
                                    ? "text-[#16A34A] hover:border-emerald-300 hover:bg-emerald-50/70 hover:text-[#15803D]"
                                    : "text-[#4290E9] hover:border-blue-300 hover:bg-blue-50/70 hover:text-[#2563EB]"
                            }`}
                            title={customTemplate ? "Edit Custom Template" : "Edit Default Template"}
                        >
                            <Edit3 className={`w-3 h-3 ${customTemplate ? "text-[#16A34A]" : "text-[#4290E9]"}`} />
                            <span>{customTemplate ? "Edit Custom Template" : "Edit Default Template"}</span>
                        </button>
                    </div>
                </div>
            </td>
        );
    };

    if (loading) {
        return (
            <div className="w-full flex justify-center py-8">
                <RefreshCcw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="w-full flex-col flex gap-8">
            {/* Preferences & Templates Card */}
            <div className="w-full flex-col flex rounded-lg border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between w-full pb-4 px-6 py-5 border-b border-[#E5E7EB]" style={{ backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg}, black 3%)` }}>
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5" style={{ color: roleSettings.pageTabColor }} />
                        <p className="text-[18px] font-semibold uppercase" style={{ color: roleSettings.pageTabColor }}>
                            Email Notification Preferences & Templates
                        </p>
                    </div>
                    <div
                        onClick={loadSettings}
                        className="flex items-center gap-x-[8px] cursor-pointer group"
                    >
                        <p className="text-sm font-semibold font-raleway" style={{ color: roleSettings.pageTabColor }}>Refresh</p>
                        <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" style={{ color: roleSettings.pageTabColor }} />
                    </div>
                </div>

                {/* Table */}
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                                <th className="px-6 py-4 text-xs font-semibold text-[#4B5563] uppercase tracking-wider">Notification Event</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[#4B5563] uppercase tracking-wider text-center" style={{ width: "21%" }}>Admin</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[#4B5563] uppercase tracking-wider text-center" style={{ width: "21%" }}>Agent</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[#4B5563] uppercase tracking-wider text-center" style={{ width: "21%" }}>Vendor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB]">
                            {events.map((event) => {
                                const timed = isEventTimed(event);
                                const supportedUnits = getSupportedUnitsForEvent(event);
                                const defaultIntervals = getDefaultIntervalsForEvent(event);

                                return (
                                    <tr key={event.event_type} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-5 align-top">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-[#111827]">{event.label}</span>
                                                
                                                {/* Event Information Tooltip */}
                                                {(() => {
                                                    const meta = EVENT_METADATA[event.event_type];
                                                    const excluded = meta?.excludedExplanation;
                                                    return (
                                                        <TooltipProvider delayDuration={100}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        type="button"
                                                                        className="inline-flex items-center justify-center p-0.5 text-[#4290E9] hover:text-[#2563EB] rounded-full hover:bg-blue-50 transition-colors focus:outline-none cursor-pointer"
                                                                        aria-label={`Details for ${event.label}`}
                                                                    >
                                                                        <Info className="w-3.5 h-3.5 text-[#4290E9]" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent
                                                                    side="right"
                                                                    align="start"
                                                                    className="w-[330px] p-3.5 bg-white text-gray-800 shadow-xl rounded-xl border border-gray-200 z-[99999] text-xs font-normal normal-case space-y-2.5"
                                                                >
                                                                    <div>
                                                                        <div className="font-bold text-gray-900 text-[13px] flex items-center justify-between">
                                                                            <span>{meta?.label || event.label}</span>
                                                                            {event.always_send && (
                                                                                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                                                                    ALWAYS ON
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-gray-600 text-[11.5px] mt-1 leading-relaxed">
                                                                            {meta?.description || event.description}
                                                                        </p>
                                                                    </div>

                                                                    <div className="pt-2 border-t border-gray-100">
                                                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                                                            Eligible Recipients:
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {event.recipients.includes("agent") && (
                                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                                                    Agent
                                                                                </span>
                                                                            )}
                                                                            {event.recipients.includes("vendor") && (
                                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                                    Vendor
                                                                                </span>
                                                                            )}
                                                                            {event.recipients.includes("admin") && (
                                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                                                    Admin
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {excluded && (
                                                                        <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 italic leading-snug">
                                                                            {excluded}
                                                                        </div>
                                                                    )}

                                                                    {timed && (
                                                                        <div className="pt-1.5 border-t border-gray-100 flex items-center gap-1.5 text-[10.5px] font-medium text-blue-700">
                                                                            <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                                                                            <span>Configurable reminder intervals.</span>
                                                                        </div>
                                                                    )}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    );
                                                })()}

                                                {timed && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#BFDBFE]">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        TIMED REMINDER
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-[#6B7280] mt-1">{event.description}</div>

                                            {/* Dynamic Timing Configuration Selector */}
                                            {timed && (
                                                <IntervalSelector
                                                    intervals={eventIntervals[event.event_type] ?? defaultIntervals}
                                                    supportedUnits={supportedUnits}
                                                    defaultIntervals={defaultIntervals}
                                                    eventType={event.event_type}
                                                    onChange={(newIntervals) => handleIntervalChange(event.event_type, newIntervals)}
                                                    disabled={saving}
                                                />
                                            )}
                                        </td>
                                        
                                        {/* Admin Column */}
                                        {renderRoleCell(event, "admin")}

                                        {/* Agent Column */}
                                        {renderRoleCell(event, "agent")}

                                        {/* Vendor Column */}
                                        {renderRoleCell(event, "vendor")}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Email Signatures Card */}
            <div className="w-full flex-col flex rounded-lg border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between w-full pb-4 px-6 py-5 border-b border-[#E5E7EB]" style={{ backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg}, black 3%)` }}>
                    <p className="text-[18px] font-semibold uppercase" style={{ color: roleSettings.pageTabColor }}>
                        Email Signatures
                    </p>
                    <div
                        onClick={() => {
                            setSignatureToEdit(null);
                            setOpenSignatureDialog(true);
                        }}
                        className="flex items-center gap-x-[8px] cursor-pointer group"
                    >
                        <p className="text-sm font-semibold font-raleway" style={{ color: roleSettings.pageTabColor }}>Create Signature</p>
                        <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" style={{ color: roleSettings.pageTabColor }} />
                    </div>
                </div>
                <div className="w-full p-4">
                    <DataTable
                        data={signatures}
                        columns={signatureColumns}
                        loading={sigsLoading}
                        error={false}
                        dataName="Signatures"
                        userType={userType}
                    />
                </div>
            </div>

            {/* Template Add / Edit Dialog */}
            <AddTemplateDialog
                open={openAddDialog}
                setOpen={(open) => {
                    setOpenAddDialog(open);
                    if (!open) {
                        setTemplateToEdit(null);
                        setPresetEventType(null);
                        setPresetRole(null);
                    }
                }}
                onSuccess={() => {
                    refreshTemplates();
                }}
                initialData={templateToEdit}
                presetEventType={presetEventType}
                presetRole={presetRole}
            />

            {/* Template Preview Dialog */}
            <TemplatePreviewDialog
                open={openPreviewDialog}
                setOpen={(open) => {
                    setOpenPreviewDialog(open);
                    if (!open) {
                        setTemplateToPreview(null);
                        setDefaultPreviewData(null);
                    }
                }}
                template={templateToPreview}
                defaultPreview={defaultPreviewData}
                onEdit={(tmpl) => {
                    if (tmpl) {
                        setTemplateToEdit(tmpl);
                        setPresetEventType(null);
                        setPresetRole(null);
                    } else if (defaultPreviewData) {
                        setTemplateToEdit(null);
                        setPresetEventType(defaultPreviewData.eventType);
                        setPresetRole(defaultPreviewData.role);
                    }
                    setOpenAddDialog(true);
                }}
            />

            {/* Signature Creator Dialog */}
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
});

EmailNotificationsSettings.displayName = "EmailNotificationsSettings";

export default EmailNotificationsSettings;
