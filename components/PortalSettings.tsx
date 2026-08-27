"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Loader2, Plus } from "lucide-react";
import { useAppContext } from "@/app/context/AppContext";
import {
    GetTourSettings,
    SavePortalSettings,
    SaveTourSettings,
    UpdateTourSetting,
    DeleteTourSetting,
    UpdateGlobalSettingsSort
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
        allow_print_request: boolean;
        allow_booking_through_lunch: boolean;
        only_pay_travel_between_appointments: boolean;
        other_areas_free_allowance?: number | string;
        other_areas_rate_per_sq_ft?: number | string;
        other_areas_enable_allowance?: boolean;
        sub_areas_free_allowance?: number | string;
        sub_areas_rate_per_sq_ft?: number | string;
        sub_areas_enable_allowance?: boolean;
        finished_areas_free_allowance?: number | string;
        finished_areas_rate_per_sq_ft?: number | string;
        finished_areas_enable_allowance?: boolean;
    }>({
        disable_next_day_booking: false,
        booking_cutoff_time: "17:00",
        show_org_details_on_empty_schedule: false,
        allow_print_request: false,
        allow_booking_through_lunch: false,
        only_pay_travel_between_appointments: true,
        other_areas_free_allowance: 1000,
        other_areas_rate_per_sq_ft: 0.10,
        other_areas_enable_allowance: false,
        sub_areas_free_allowance: 0,
        sub_areas_rate_per_sq_ft: 0,
        sub_areas_enable_allowance: false,
        finished_areas_free_allowance: 0,
        finished_areas_rate_per_sq_ft: 0,
        finished_areas_enable_allowance: false,
    });

    // Area states
    type AreaCategory = "Finished Area" | "Sub Area" | "Other Area";
    const [activeCategory, setActiveCategory] = useState<AreaCategory>("Finished Area");
    const [areas, setAreas] = useState<AreaData[]>([]);
    const [popupOpen, setPopupOpen] = useState(false);
    const [editingArea, setEditingArea] = useState<null | AreaData>(null);
    const [areasLoading, setAreasLoading] = useState(false);

    const getCategory = useCallback((type: string): AreaCategory => {
        const t = (type || "").toLowerCase();
        if (t.includes("sub")) return "Sub Area";
        if (t.includes("other") || t.includes("unfinish")) return "Other Area";
        return "Finished Area";
    }, []);

    const finishedAreas = useMemo(() => areas.filter(a => getCategory(a.type) === "Finished Area"), [areas, getCategory]);
    const subAreas = useMemo(() => areas.filter(a => getCategory(a.type) === "Sub Area"), [areas, getCategory]);
    const otherAreas = useMemo(() => areas.filter(a => getCategory(a.type) === "Other Area"), [areas, getCategory]);

    const currentCategoryAreas = useMemo(() => {
        switch (activeCategory) {
            case "Finished Area": return finishedAreas;
            case "Sub Area": return subAreas;
            case "Other Area": return otherAreas;
            default: return finishedAreas;
        }
    }, [activeCategory, finishedAreas, subAreas, otherAreas]);

    const isAllowanceEnabled = useMemo(() => {
        if (activeCategory === "Other Area") return !!formState.other_areas_enable_allowance;
        if (activeCategory === "Sub Area") return !!formState.sub_areas_enable_allowance;
        return !!formState.finished_areas_enable_allowance;
    }, [activeCategory, formState]);

    const currentFreeAllowance = useMemo(() => {
        if (activeCategory === "Other Area") return formState.other_areas_free_allowance ?? 1000;
        if (activeCategory === "Sub Area") return formState.sub_areas_free_allowance ?? 0;
        return formState.finished_areas_free_allowance ?? 0;
    }, [activeCategory, formState]);

    const currentRatePerSqFt = useMemo(() => {
        if (activeCategory === "Other Area") return formState.other_areas_rate_per_sq_ft ?? 0.10;
        if (activeCategory === "Sub Area") return formState.sub_areas_rate_per_sq_ft ?? 0;
        return formState.finished_areas_rate_per_sq_ft ?? 0;
    }, [activeCategory, formState]);

    const handleUpdateAllowance = (field: 'enable' | 'allowance' | 'rate', value: any) => {
        setFormState(prev => {
            const prefix = activeCategory === "Other Area" ? "other_areas" : activeCategory === "Sub Area" ? "sub_areas" : "finished_areas";
            if (field === 'enable') {
                return { ...prev, [`${prefix}_enable_allowance`]: value };
            } else if (field === 'allowance') {
                return { ...prev, [`${prefix}_free_allowance`]: value };
            } else {
                return { ...prev, [`${prefix}_rate_per_sq_ft`]: value };
            }
        });
    };

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
                        allow_print_request: settings.allow_print_request ?? false,
                        allow_booking_through_lunch: settings.allow_booking_through_lunch ?? false,
                        only_pay_travel_between_appointments: settings.only_pay_travel_between_appointments ?? true,
                        other_areas_free_allowance: settings.other_areas_free_allowance ?? 1000,
                        other_areas_rate_per_sq_ft: settings.other_areas_rate_per_sq_ft ?? 0.10,
                        other_areas_enable_allowance: settings.other_areas_enable_allowance ?? false,
                        sub_areas_free_allowance: settings.sub_areas_free_allowance ?? 0,
                        sub_areas_rate_per_sq_ft: settings.sub_areas_rate_per_sq_ft ?? 0,
                        sub_areas_enable_allowance: settings.sub_areas_enable_allowance ?? false,
                        finished_areas_free_allowance: settings.finished_areas_free_allowance ?? 0,
                        finished_areas_rate_per_sq_ft: settings.finished_areas_rate_per_sq_ft ?? 0,
                        finished_areas_enable_allowance: settings.finished_areas_enable_allowance ?? false,
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
            .catch(() => toast.error("Failed to load settings"))
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
                allow_print_request: formState.allow_print_request,
                allow_booking_through_lunch: formState.allow_booking_through_lunch,
                only_pay_travel_between_appointments: formState.only_pay_travel_between_appointments,
                other_areas_free_allowance: Number(formState.other_areas_free_allowance || 0),
                other_areas_rate_per_sq_ft: Number(formState.other_areas_rate_per_sq_ft || 0),
                other_areas_enable_allowance: Boolean(formState.other_areas_enable_allowance),
                sub_areas_free_allowance: Number(formState.sub_areas_free_allowance || 0),
                sub_areas_rate_per_sq_ft: Number(formState.sub_areas_rate_per_sq_ft || 0),
                sub_areas_enable_allowance: Boolean(formState.sub_areas_enable_allowance),
                finished_areas_free_allowance: Number(formState.finished_areas_free_allowance || 0),
                finished_areas_rate_per_sq_ft: Number(formState.finished_areas_rate_per_sq_ft || 0),
                finished_areas_enable_allowance: Boolean(formState.finished_areas_enable_allowance),
            });

            toast.success("Settings updated successfully");
        } catch (err) {
            const e = err as Error;
            toast.error(e.message || "Failed to save settings");
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

    const handleMoveAreaInCategory = async (categoryIndex: number, direction: 'up' | 'down') => {
        const targetCategoryIndex = direction === 'up' ? categoryIndex - 1 : categoryIndex + 1;
        if (targetCategoryIndex < 0 || targetCategoryIndex >= currentCategoryAreas.length) return;

        const updatedCategoryList = [...currentCategoryAreas];
        const [movedItem] = updatedCategoryList.splice(categoryIndex, 1);
        updatedCategoryList.splice(targetCategoryIndex, 0, movedItem);

        // Reconstruct master list with updated order for the current category
        const otherCategoriesList = areas.filter(a => getCategory(a.type) !== activeCategory);
        const newMasterAreas = [...otherCategoriesList, ...updatedCategoryList];
        setAreas(newMasterAreas);

        try {
            const payload = newMasterAreas
                .filter((item) => !!item.uuid)
                .map((item, idx) => ({
                    uuid: item.uuid as string,
                    sort_order: idx + 1,
                }));
            await UpdateGlobalSettingsSort(payload);
            toast.success("Sort order updated successfully");
        } catch (error) {
            console.error("Failed to update sort order:", error);
            toast.error("Failed to update sort order");
            fetchSettings();
        }
    };

    const columns: ColumnDef<AreaData>[] = [
        ...(userType === "admin"
            ? [
                {
                    id: "sort",
                    header: "SORT",
                    cell: ({ row }: { row: Row<AreaData> }) => {
                        const index = currentCategoryAreas.findIndex((a: AreaData) => a.uuid === row.original.uuid);
                        const currIndex = index !== -1 ? index : row.index;
                        return (
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    disabled={currIndex === 0}
                                    onClick={() => handleMoveAreaInCategory(currIndex, "up")}
                                    className="p-1 text-[#666666] hover:text-[#4290E9] disabled:opacity-30 disabled:hover:text-[#666666] transition-colors"
                                    title="Move Up"
                                >
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    disabled={currIndex === currentCategoryAreas.length - 1}
                                    onClick={() => handleMoveAreaInCategory(currIndex, "down")}
                                    className="p-1 text-[#666666] hover:text-[#4290E9] disabled:opacity-30 disabled:hover:text-[#666666] transition-colors"
                                    title="Move Down"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    },
                },
            ]
            : []),
        {
            accessorKey: "area",
            header: "AREAS",
            cell: ({ row }: { row: Row<AreaData> }) => (
                <div className="text-[#666666] font-medium">{row.original.area}</div>
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
                <div className="text-[#666666]">${Number(row.original.charge || 0).toFixed(2)}</div>
            ),
        },
        {
            accessorKey: "discount",
            header: "DISCOUNT",
            cell: ({ row }: { row: Row<AreaData> }) => (
                <div className="text-[#666666]">{row.original.is_percentage ? `${row.original.discount}%` : `$${Number(row.original.discount || 0).toFixed(2)}`}</div>
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
            <Accordion type="multiple" defaultValue={["area-settings", "scheduling-preferences"]} className="w-full mt-0 space-y-4">
                
                {/* 1. AREA & MEASUREMENT SETTINGS */}
                <AccordionItem value="area-settings" className="border-none">
                    <AccordionTrigger
                        className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] ${userType === "admin"
                            ? "[&>svg]:text-[#4290E9]"
                            : "[&>svg]:text-[#6BAE41]"
                            } [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                        style={{
                            backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                        }}
                    >
                        <div className="flex items-center justify-between w-full">
                            <p>AREA & MEASUREMENT SETTINGS</p>
                            {userType === "admin" && (
                                <div
                                    className="flex items-center gap-x-[10px] pr-[24px] cursor-pointer group"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingArea(null);
                                        setPopupOpen(true);
                                    }}
                                >
                                    <p className="text-base font-semibold font-raleway group-hover:underline transition-all duration-200">
                                        + Add {activeCategory === "Finished Area" ? "Finished Area" : activeCategory === "Sub Area" ? "Sub Area" : "Other Area"}
                                    </p>
                                    <Plus
                                        className={`w-[18px] h-[18px] ${userType}-bg text-white rounded-sm transition-transform duration-300 group-hover:rotate-90`}
                                    />
                                </div>
                            )}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="rounded-b-lg pb-0 pt-4">
                        {userType === "admin" && (
                            <div className="w-full mb-4">
                                {/* Category Switcher Tabs */}
                                <div className="flex flex-wrap items-center gap-2 mb-4 px-1">
                                    {(["Finished Area", "Sub Area", "Other Area"] as AreaCategory[]).map((cat) => {
                                        const count = cat === "Finished Area" ? finishedAreas.length : cat === "Sub Area" ? subAreas.length : otherAreas.length;
                                        const isActive = activeCategory === cat;
                                        return (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setActiveCategory(cat)}
                                                className={`px-4 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2 border
                                                    ${isActive
                                                        ? `${userType}-bg text-white border-transparent shadow-xs`
                                                        : `bg-white text-[#666666] border-[#DDDDDD] hover:border-[#BBBBBB]`}`}
                                            >
                                                <span>{cat === "Finished Area" ? "Finished Areas" : cat === "Sub Area" ? "Sub Areas" : "Other Areas"}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-[#777777]'}`}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Group Free Allowance Configuration Card */}
                                <div className="mx-1 mb-5 p-4 rounded-lg border border-[#BBBBBB] bg-white shadow-xs">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-[#424242]">
                                                    {activeCategory === "Finished Area" ? "Finished Areas" : activeCategory === "Sub Area" ? "Sub Areas" : "Other Areas"} Group Free Allowance
                                                </span>
                                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isAllowanceEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                                    {isAllowanceEnabled ? "Active" : "Disabled"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#777777] mt-0.5">
                                                Set a shared square footage allowance (e.g. first 1,000 sq.ft. free across {activeCategory.toLowerCase()}s in an order before charges apply).
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Label htmlFor="category-allowance-switch" className="text-xs font-semibold text-[#666666] cursor-pointer">
                                                Enable Free Allowance
                                            </Label>
                                            <Switch
                                                id="category-allowance-switch"
                                                checked={isAllowanceEnabled}
                                                onCheckedChange={(checked) => handleUpdateAllowance('enable', checked)}
                                                className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                            />
                                        </div>
                                    </div>

                                    {isAllowanceEnabled && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#EEEEEE]">
                                            <div>
                                                <Label className="text-xs font-semibold text-[#666666] block mb-1.5">
                                                    Free Allowance (Sq. Ft.)
                                                </Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    placeholder="e.g. 1000"
                                                    value={currentFreeAllowance}
                                                    onChange={(e) => handleUpdateAllowance('allowance', e.target.value)}
                                                    className="h-[38px] border-[#BBBBBB] text-sm bg-white"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold text-[#666666] block mb-1.5">
                                                    Rate Above Allowance ($ CAD / sq. ft.)
                                                </Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="e.g. 0.10"
                                                    value={currentRatePerSqFt}
                                                    onChange={(e) => handleUpdateAllowance('rate', e.target.value)}
                                                    className="h-[38px] border-[#BBBBBB] text-sm bg-white"
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <Button
                                                    type="button"
                                                    onClick={handleSave}
                                                    disabled={isSaving}
                                                    className={`h-[38px] px-5 text-xs font-semibold ${userType}-bg hover-${userType}-bg text-white shadow-xs`}
                                                >
                                                    {isSaving ? "Saving..." : "Save Allowance"}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <DataTable
                                    data={currentCategoryAreas}
                                    columns={columns}
                                    loading={areasLoading}
                                    dataName={activeCategory}
                                    userType={userType || 'admin'}
                                    error={false}
                                    autoResetPageIndex={false}
                                />
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>

                {/* 2. SCHEDULING PREFERENCES */}
                <AccordionItem value="scheduling-preferences" className="border-none">
                    <AccordionTrigger
                        className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] ${userType}-text text-[18px] font-[600] ${userType === "admin"
                            ? "[&>svg]:text-[#4290E9]"
                            : "[&>svg]:text-[#6BAE41]"
                            } [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                        style={{
                            backgroundColor: `var(--${userType}-page-bg, #E4E4E4)`,
                        }}
                    >
                        <p>SCHEDULING PREFERENCES</p>
                    </AccordionTrigger>
                    <AccordionContent className="rounded-b-lg pb-0">
                        <div className="w-full px-6 py-6 shadow-sm font-alexandria" style={{ backgroundColor: `var(--${userType}-page-bg, #EEEEEE)` }}>
                            <fieldset disabled={isSaving} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[#424242]">
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

                                {/* Allow Print Request */}
                                <div className="col-span-1 md:col-span-2 flex items-center gap-3">
                                    <Switch
                                        id="allow-print-request"
                                        checked={formState.allow_print_request}
                                        onCheckedChange={(val) => setFormState(prev => ({ ...prev, allow_print_request: val }))}
                                        className="data-[state=unchecked]:bg-red-500 data-[state=checked]:bg-[#6BAE41]"
                                    />
                                    <Label htmlFor="allow-print-request" className="cursor-pointer font-medium text-sm">
                                        Allow Print Request
                                    </Label>
                                </div>

                                {/* Allow Booking Through Lunch */}
                                <div className="col-span-1 md:col-span-2 flex items-center gap-3">
                                    <Switch
                                        id="allow-booking-through-lunch"
                                        checked={formState.allow_booking_through_lunch}
                                        onCheckedChange={(val) => setFormState(prev => ({ ...prev, allow_booking_through_lunch: val }))}
                                        className="data-[state=unchecked]:bg-red-500 data-[state=checked]:bg-[#6BAE41]"
                                    />
                                    <Label htmlFor="allow-booking-through-lunch" className="cursor-pointer font-medium text-sm">
                                        Allow appointments to book through lunch time (additional appointment time will be added)
                                    </Label>
                                </div>

                                {/* Only Pay Travel Between Appointments */}
                                <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            id="only-pay-travel-between-appointments"
                                            checked={formState.only_pay_travel_between_appointments}
                                            onCheckedChange={(val) => setFormState(prev => ({ ...prev, only_pay_travel_between_appointments: val }))}
                                            className="data-[state=unchecked]:bg-red-500 data-[state=checked]:bg-[#6BAE41]"
                                        />
                                        <Label htmlFor="only-pay-travel-between-appointments" className="cursor-pointer font-medium text-sm">
                                            Only pay vendor travel between appointments (exclude travel to/from home address)
                                        </Label>
                                    </div>
                                    <p className="text-xs text-gray-500 ml-11">
                                        When enabled, vendor travel compensation is calculated only between consecutive appointments on the same day. The first appointment of the day receives $0.00 travel pay.
                                    </p>
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
                defaultType={activeCategory}
            />
        </div>
    );
});
PortalSettings.displayName = "PortalSettings";

export default PortalSettings;
