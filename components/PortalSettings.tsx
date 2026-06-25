"use client";
import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { useAppContext } from "@/app/context/AppContext";
import {
    GetTourSettings,
    SavePortalSettings,
    SaveTourSettings,
    UpdateTourSetting,
    DeleteTourSetting
} from "@/app/dashboard/global-settings/global-settings";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import AddAreaPopup, { AreaData } from "./AddAreaPopup";
import { DataTable } from "@/components/DataTable";
import { ColumnDef, Row } from "@tanstack/react-table";
import DropdownActions from "./DropdownActions";

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

    // Area states
    const [areas, setAreas] = useState<AreaData[]>([]);
    const [popupOpen, setPopupOpen] = useState(false);
    const [editingArea, setEditingArea] = useState<null | AreaData>(null);
    const [areasLoading, setAreasLoading] = useState(false);

    React.useImperativeHandle(ref, () => ({
        save: handleSave,
    }));

    const fetchSettings = () => {
        setIsLoading(true);
        setAreasLoading(true);
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
                if (res.data?.tour_settings) {
                    const mappedAreas = res.data.tour_settings.map((item: AreaData, index: number) => ({
                        ...item,
                        uuid: item.uuid || `temp-${index}-${Date.now()}`
                    }));
                    setAreas(mappedAreas);
                }
            })
            .catch(() => toast.error("Failed to load portal settings"))
            .finally(() => {
                setIsLoading(false);
                setAreasLoading(false);
            });
    };

    useEffect(() => {
        fetchSettings();
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

    // Area handlers
    const handleAddArea = async (newArea: Omit<AreaData, 'id' | 'uuid'>) => {
        try {
            const payload = { ...newArea, status: true };
            await SaveTourSettings([payload]);
            await fetchSettings();
            toast.success('Area added successfully');
        } catch (error) {
            console.error('Failed to add area:', error);
            toast.error('Failed to add area. Please try again.');
        }
    };

    const handleEditArea = async (updatedArea: AreaData) => {
        if (!updatedArea.uuid) {
            toast.error('Cannot update area without ID');
            return;
        }
        try {
            await UpdateTourSetting(updatedArea);
            await fetchSettings();
            toast.success('Area updated successfully');
        } catch (error) {
            console.error('Failed to update area:', error);
            toast.error('Failed to update area. Please try again.');
        }
    };

    const handleDeleteArea = async (uuid: string) => {
        try {
            await DeleteTourSetting(uuid);
            const updatedAreas = areas.filter(area => area.uuid !== uuid);
            setAreas(updatedAreas);
            toast.success('Area deleted successfully');
        } catch (error) {
            console.error('Failed to delete area:', error);
            toast.error('Failed to delete area. Please try again.');
            fetchSettings();
        }
    };

    const handleStatusChange = async (area: AreaData, status: boolean) => {
        if (!area.uuid) return;
        try {
            const updatedArea = { ...area, status };
            await UpdateTourSetting(updatedArea);
            const updatedAreas = areas.map(a => a.uuid === area.uuid ? updatedArea : a);
            setAreas(updatedAreas);
            toast.success('Status updated successfully');
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Failed to update status. Please try again.');
            fetchSettings();
        }
    };

    const columns: ColumnDef<AreaData>[] = [
        {
            accessorKey: "area",
            header: "AREAS",
            cell: ({ row }: { row: Row<AreaData> }) => (
                <div className="text-[#666666]">{row.original.area}</div>
            ),
        },
        {
            accessorKey: "type",
            header: "TYPE",
            cell: ({ row }: { row: Row<AreaData> }) => (
                <div className="text-[#666666]">{row.original.type}</div>
            ),
        },
        {
            accessorKey: "charge",
            header: "CHARGE",
            cell: ({ row }: { row: Row<AreaData> }) => (
                <div className="text-[#666666]">{row.original.charge}</div>
            ),
        },
        {
            accessorKey: "discount",
            header: "DISCOUNT",
            cell: ({ row }: { row: Row<AreaData> }) => (
                <div className="text-[#666666]">{row.original.discount}</div>
            ),
        },
        {
            accessorKey: "status",
            header: "STATUS",
            cell: ({ row }: { row: Row<AreaData> }) => (
                <div className="flex items-center gap-2">
                    <Switch
                        checked={row.original.status}
                        onCheckedChange={(checked) => handleStatusChange(row.original, checked)}
                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                    />
                    <DropdownActions
                        options={[
                            {
                                label: "Edit",
                                onClick: () => { setEditingArea(row.original); setPopupOpen(true); },
                            },
                            {
                                label: "Delete",
                                onClick: () => row.original.uuid && handleDeleteArea(row.original.uuid),
                                confirm1: true,
                            }
                        ]}
                    />
                </div>
            ),
        },
    ];

    if (isLoading && areas.length === 0) {
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
                        <div className="flex items-center justify-between w-full">
                            <p>PORTAL SETTINGS</p>
                            {userType === "admin" && (
                                <div
                                    className="flex items-center gap-x-[10px] pr-[24px] cursor-pointer group"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingArea(null);
                                        setPopupOpen(true);
                                    }}
                                >
                                    <p className="text-base font-semibold font-raleway group-hover:underline transition-all duration-200">Add Area</p>
                                    <Plus
                                        className={`w-[18px] h-[18px] ${userType}-bg text-white rounded-sm transition-transform duration-300 group-hover:rotate-90`}
                                    />
                                </div>
                            )}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className=" rounded-b-lg pb-0">
                        {userType === "admin" && (
                            <div className="w-full mb-6">
                                <DataTable
                                    data={areas}
                                    columns={columns}
                                    loading={areasLoading}
                                    dataName="Tour Settings"
                                    userType={userType || 'admin'}
                                    error={false}
                                />
                                <div className="w-full border-b-[2px] border-[#BBBBBB] mt-8" />
                            </div>
                        )}
                        <div className="w-full px-6 py-6 shadow-sm font-alexandria mt-4" style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}>
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
            <AddAreaPopup
                open={popupOpen}
                setOpen={(v) => {
                    setPopupOpen(v);
                    if (!v) setEditingArea(null);
                }}
                onAdd={handleAddArea}
                onEdit={handleEditArea}
                editingArea={editingArea}
            />
        </div>
    );
});
PortalSettings.displayName = "PortalSettings";

export default PortalSettings;
