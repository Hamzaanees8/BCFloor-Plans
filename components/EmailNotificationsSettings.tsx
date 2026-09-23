"use client";
import React, { useState, useEffect, useCallback } from "react";
import { RefreshCcw, Save, Bell, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "./ui/button";
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
import IntervalSelector from "./IntervalSelector";

const EmailNotificationsSettings = () => {
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const [events, setEvents] = useState<NotificationEvent[]>([]);
    const [preferences, setPreferences] = useState<UserPreference[]>([]);
    const [eventIntervals, setEventIntervals] = useState<Record<string, TimingInterval[]>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const [eventsRes, prefsRes] = await Promise.all([
                fetchNotificationEvents(),
                fetchNotificationPreferences()
            ]);

            const fetchedEvents: NotificationEvent[] = eventsRes.success && eventsRes.data ? eventsRes.data : [];
            const fetchedPrefs: UserPreference[] = prefsRes.success && prefsRes.data ? prefsRes.data : [];

            setEvents(fetchedEvents);
            setPreferences(fetchedPrefs);

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
    }, [loadSettings]);

    // Check if an email event is enabled for a given role
    const isEnabled = (eventType: string, roleName: string): boolean => {
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
    };

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
    const handleSave = async () => {
        setSaving(true);
        try {
            // Build the list of all preferences to save (both overridden and defaults to be explicit)
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
    };

    if (loading) {
        return (
            <div className="w-full flex justify-center py-8">
                <RefreshCcw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="w-full flex-col flex rounded-lg border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between w-full pb-4 px-6 py-5 border-b border-[#E5E7EB]" style={{ backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg}, black 3%)` }}>
                <div className="flex items-center gap-2">
                    <Bell className={`w-5 h-5 ${userType === "admin" ? "text-[#4290E9]" : "text-[#6BAE41]"}`} />
                    <p className={`text-[18px] font-semibold uppercase ${userType === "admin" ? "text-[#4290E9]" : "text-[#6BAE41]"}`}>
                        Email Notification Preferences
                    </p>
                </div>
                <div
                    onClick={loadSettings}
                    className="flex items-center gap-x-[8px] cursor-pointer group"
                >
                    <p className={`text-sm font-semibold font-raleway ${userType === "admin" ? "text-[#4290E9]" : "text-[#6BAE41]"}`}>Refresh</p>
                    <RefreshCcw className={`w-4 h-4 ${userType === "admin" ? "text-[#4290E9]" : "text-[#6BAE41]"} group-hover:rotate-180 transition-transform duration-500`} />
                </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                            <th className="px-6 py-4 text-xs font-semibold text-[#4B5563] uppercase tracking-wider">Notification Event</th>
                            <th className="px-6 py-4 text-xs font-semibold text-[#4B5563] uppercase tracking-wider text-center" style={{ width: "12%" }}>Admin</th>
                            <th className="px-6 py-4 text-xs font-semibold text-[#4B5563] uppercase tracking-wider text-center" style={{ width: "12%" }}>Agent</th>
                            <th className="px-6 py-4 text-xs font-semibold text-[#4B5563] uppercase tracking-wider text-center" style={{ width: "12%" }}>Vendor</th>
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
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-[#111827]">{event.label}</span>
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
                                    
                                    {/* Admin Switch */}
                                    <td className="px-6 py-5 text-center align-top pt-6">
                                        {event.recipients.includes("admin") ? (
                                            event.always_send ? (
                                                <span className="text-[10px] font-bold text-[#10B981] bg-[#ECFDF5] px-2 py-1 rounded">ALWAYS ON</span>
                                            ) : (
                                                <div className="flex justify-center">
                                                    <Switch 
                                                        checked={isEnabled(event.event_type, "admin")}
                                                        onCheckedChange={() => handleToggle(event.event_type, "admin")}
                                                    />
                                                </div>
                                            )
                                        ) : (
                                            <span className="text-xs text-gray-300">—</span>
                                        )}
                                    </td>

                                    {/* Agent Switch */}
                                    <td className="px-6 py-5 text-center align-top pt-6">
                                        {event.recipients.includes("agent") ? (
                                            event.always_send ? (
                                                <span className="text-[10px] font-bold text-[#10B981] bg-[#ECFDF5] px-2 py-1 rounded">ALWAYS ON</span>
                                            ) : (
                                                <div className="flex justify-center">
                                                    <Switch 
                                                        checked={isEnabled(event.event_type, "agent")}
                                                        onCheckedChange={() => handleToggle(event.event_type, "agent")}
                                                    />
                                                </div>
                                            )
                                        ) : (
                                            <span className="text-xs text-gray-300">—</span>
                                        )}
                                    </td>

                                    {/* Vendor Switch */}
                                    <td className="px-6 py-5 text-center align-top pt-6">
                                        {event.recipients.includes("vendor") ? (
                                            event.always_send ? (
                                                <span className="text-[10px] font-bold text-[#10B981] bg-[#ECFDF5] px-2 py-1 rounded">ALWAYS ON</span>
                                            ) : (
                                                <div className="flex justify-center">
                                                    <Switch 
                                                        checked={isEnabled(event.event_type, "vendor")}
                                                        onCheckedChange={() => handleToggle(event.event_type, "vendor")}
                                                    />
                                                </div>
                                            )
                                        ) : (
                                            <span className="text-xs text-gray-300">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Save Button Footer */}
            <div className="px-6 py-4 bg-[#F9FAFB] border-t border-[#E5E7EB] flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#4290E9] hover:bg-[#357ac8] transition-colors rounded shadow-sm"
                >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Preferences"}
                </Button>
            </div>
        </div>
    );
};

export default EmailNotificationsSettings;

