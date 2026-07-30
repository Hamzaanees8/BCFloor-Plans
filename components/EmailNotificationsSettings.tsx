"use client";
import React, { useState, useEffect, useCallback } from "react";
import { RefreshCcw, Save, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { 
    fetchNotificationEvents, 
    fetchNotificationPreferences, 
    updateNotificationPreferences 
} from "@/lib/email-templates";

interface NotificationEvent {
    event_type: string;
    label: string;
    description: string;
    recipients: string[];
    defaults: Record<string, boolean>;
    always_send: boolean;
}

interface UserPreference {
    role: string;
    event_type: string;
    email_enabled: boolean;
}

const EmailNotificationsSettings = () => {
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const [events, setEvents] = useState<NotificationEvent[]>([]);
    const [preferences, setPreferences] = useState<UserPreference[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const [eventsRes, prefsRes] = await Promise.all([
                fetchNotificationEvents(),
                fetchNotificationPreferences()
            ]);

            if (eventsRes.success && eventsRes.data) {
                setEvents(eventsRes.data);
            }
            
            if (prefsRes.success && prefsRes.data) {
                setPreferences(prefsRes.data);
            }
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

    // Save preferences to backend
    const handleSave = async () => {
        setSaving(true);
        try {
            // Build the list of all preferences to save (both overridden and defaults to be explicit)
            const payload: Array<{ role: string; event_type: string; email_enabled: boolean }> = [];
            
            events.forEach((event) => {
                if (event.always_send) return; // Skip saving always_send defaults

                event.recipients.forEach((roleName) => {
                    payload.push({
                        role: roleName,
                        event_type: event.event_type,
                        email_enabled: isEnabled(event.event_type, roleName),
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
                        {events.map((event) => (
                            <tr key={event.event_type} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-5">
                                    <div className="text-sm font-semibold text-[#111827]">{event.label}</div>
                                    <div className="text-xs text-[#6B7280] mt-1">{event.description}</div>
                                </td>
                                
                                {/* Admin Switch */}
                                <td className="px-6 py-5 text-center">
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
                                <td className="px-6 py-5 text-center">
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
                                <td className="px-6 py-5 text-center">
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
                        ))}
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
