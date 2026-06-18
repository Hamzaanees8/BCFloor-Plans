"use client";
import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAppContext } from "@/app/context/AppContext";
import {
    GetTourSettings,
    SavePortalSettings,
} from "@/app/dashboard/global-settings/global-settings";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const PortalSettings = React.forwardRef<
    { save: () => Promise<void> },
    object
>((props, ref) => {
    const { userType } = useAppContext();
    const accentColor = userType === "admin" ? "#4290E9" : "#6BAE41";

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formState, setFormState] = useState<{
        disable_next_day_booking: boolean;
        booking_cutoff_time: string;
        show_org_details_on_empty_schedule: boolean;
    }>({
        disable_next_day_booking: false,
        booking_cutoff_time: "17:00",
        show_org_details_on_empty_schedule: false,
    });

    React.useImperativeHandle(ref, () => ({
        save: handleSave,
    }));

    useEffect(() => {
        setIsLoading(true);
        GetTourSettings()
            .then(async (res) => {
                const settings = res.data?.portal_settings;
                if (settings) {
                    setFormState({
                        disable_next_day_booking: settings.disable_next_day_booking ?? false,
                        booking_cutoff_time: settings.booking_cutoff_time || "17:00",
                        show_org_details_on_empty_schedule: settings.show_org_details_on_empty_schedule ?? false,
                    });
                }
            })
            .catch(() => toast.error("Failed to load portal settings"))
            .finally(() => setIsLoading(false));
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await SavePortalSettings({
                disable_next_day_booking: formState.disable_next_day_booking,
                booking_cutoff_time: formState.booking_cutoff_time,
                show_org_details_on_empty_schedule: formState.show_org_details_on_empty_schedule,
            });

            toast.success("Portal settings updated successfully");
        } catch (err) {
            const e = err as Error;
            toast.error(e.message || "Failed to save portal settings");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: accentColor }} />
            </div>
        );
    }

    return (
        <div className="w-full flex-col flex rounded-lg">
            <Accordion type="multiple" defaultValue={["portal-settings"]} className="w-full mt-0">
                <AccordionItem value="portal-settings">
                    <AccordionTrigger
                        className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] ${userType === "admin"
                            ? "[&>svg]:text-[#4290E9]"
                            : "[&>svg]:text-[#6BAE41]"
                            }  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                        style={{
                            backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                        }}
                    >
                        PORTAL SETTINGS
                    </AccordionTrigger>
                    <AccordionContent className=" rounded-b-lg">
                        <div className="w-full px-6 py-6 shadow-sm font-alexandria" style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}>
                            <fieldset disabled={isSaving} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[#424242]">
                                <div className="col-span-1 md:col-span-2">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-[#999] mb-3">Scheduling Preferences</p>
                                </div>

                                {/* Show Org Details */}
                                <div className="col-span-1 md:col-span-2 flex items-center gap-3">
                                    <Switch
                                        id="org-show-details"
                                        checked={formState.show_org_details_on_empty_schedule}
                                        onCheckedChange={(val) => setFormState(prev => ({ ...prev, show_org_details_on_empty_schedule: val }))}
                                        className="data-[state=unchecked]:bg-red-500 data-[state=checked]:bg-[#6BAE41]"
                                    />
                                    <Label htmlFor="org-show-details" className="cursor-pointer font-medium text-sm">
                                        Show Organization Contact Details (If no vendor is found)
                                    </Label>
                                </div>

                                {/* Disable Next Day Booking */}
                                <div className="col-span-1 flex items-center gap-3">
                                    <Switch
                                        id="org-disable-next-day"
                                        checked={formState.disable_next_day_booking}
                                        onCheckedChange={(val) => setFormState(prev => ({ ...prev, disable_next_day_booking: val }))}
                                        className="data-[state=unchecked]:bg-red-500 data-[state=checked]:bg-[#6BAE41]"
                                    />
                                    <Label htmlFor="org-disable-next-day" className="cursor-pointer font-medium text-sm">
                                        Disable Next-Day Booking After Cutoff
                                    </Label>
                                </div>

                                {/* Cutoff Time */}
                                {formState.disable_next_day_booking ? (
                                    <div className="col-span-1">
                                        <Label className="text-sm font-semibold mb-2 block">Cutoff Time</Label>
                                        <Input
                                            type="time"
                                            value={formState.booking_cutoff_time}
                                            onChange={(e) => setFormState(prev => ({ ...prev, booking_cutoff_time: e.target.value }))}
                                            className="h-[42px] border-[1px] border-[#BBBBBB]"
                                            style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}
                                        />
                                    </div>
                                ) : <div className="col-span-1" />}
                            </fieldset>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
});
PortalSettings.displayName = "PortalSettings";

export default PortalSettings;
