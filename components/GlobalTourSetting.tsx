// components/GlobalTourSetting.tsx
import React, { useState, useEffect, useRef } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "./ui/accordion";

import { useAppContext } from "@/app/context/AppContext";
import { Input } from "./ui/input";
import { CreateMediaSettings, GetMediaSettings, GetTourDefaultSettings, SaveTourDefaultSettings } from "@/app/dashboard/global-settings/global-settings";
import { AgentAudio, GetOrganizationAudios } from "@/app/dashboard/agents/agent-audio";
import { toast } from "sonner";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./ui/popover";
import { Plus, Trash2, RotateCcw, ChevronUp, ChevronDown, Pencil, Check, X } from "lucide-react";


type SizeType = {
    width: number;
    height: number;
};

type VideoSizesType = {
    original: SizeType;
    small: SizeType;
    large: SizeType;
    mls: SizeType;
};

type PhotoSizesType = {
    original: SizeType;
    small: SizeType;
    large: SizeType;
    mls: SizeType;
};

export interface RenewalPlan {
    id: string;
    label: string; // e.g. "30 Days Hosting", "60 Days Extension"
    unit?: "days" | "months";
    days?: number; // e.g. 30, 60, 90
    months?: number; // e.g. 3, 6, 12
    price: number; // CAD
}

type TourDefaultsType = {
    music_enabled: boolean;
    default_song: string;
    default_audio_uuid?: string;
    transition_effect: string[];
    layout_option: string;
    video_slideshow_enabled: boolean;
    letterbox_correction: boolean;
    aspect_ratio: string;
    autoplay_enabled: boolean;
    allow_print_download: boolean;
    allow_client_upload: boolean;
    require_payment_before_download: boolean;
    enable_matterport_default_expiry?: boolean;
    matterport_default_expiry_days?: number;
    matterport_renewal_plans?: RenewalPlan[];
    matterport_auto_invoice_enabled?: boolean;
    matterport_auto_invoice_days?: number;
    matterport_reminder_intervals?: number[];
    always_enable_sorting?: boolean;
    floorplan_names?: string[];
    is_custom_floorplans?: boolean;
    global_floorplan_names?: string[];
};

export const DEFAULT_FLOORPLAN_NAMES = [
    "Dimensions PDF",
    "Branded Floor Plan",
    "UnBranded Floor Plan",
    "Branded Image",
    "Unbranded Image",
    "Additional Files",
];

const defaultRenewalPlans: RenewalPlan[] = [
    { id: "30_days", unit: "days", days: 30, months: 1, label: "30 Days Extension", price: 20 },
    { id: "3_months", unit: "months", months: 3, days: 90, label: "3 Months", price: 35 },
    { id: "6_months", unit: "months", months: 6, days: 180, label: "6 Months", price: 60 },
    { id: "12_months", unit: "months", months: 12, days: 365, label: "1 Year (12 Months)", price: 100 },
];

const GlobalTourSetting = React.forwardRef<{ save: () => Promise<void> }, object>((props, ref) => {
    const { userType } = useAppContext();
    const [newFloorplanName, setNewFloorplanName] = useState("");
    const [editingFloorplanIndex, setEditingFloorplanIndex] = useState<number | null>(null);
    const [editingFloorplanValue, setEditingFloorplanValue] = useState<string>("");
    const [dragOverFloorplanIndex, setDragOverFloorplanIndex] = useState<number | null>(null);
    const dragFloorplanRowIndex = useRef<number | null>(null);
    const [videoSizes, setVideoSizes] = useState<VideoSizesType>({
        original: { width: 0, height: 0 },
        small: { width: 0, height: 0 },
        large: { width: 0, height: 0 },
        mls: { width: 0, height: 0 }
    });
    const [photoSizes, setPhotoSizes] = useState<PhotoSizesType>({
        original: { width: 0, height: 0 },
        small: { width: 0, height: 0 },
        large: { width: 0, height: 0 },
        mls: { width: 0, height: 0 }
    });

    const [tourDefaults, setTourDefaults] = useState<TourDefaultsType>({
        music_enabled: true,
        default_song: "tell-me-what",
        transition_effect: ["kenburns"],
        layout_option: "standard",
        video_slideshow_enabled: true,
        letterbox_correction: true,
        aspect_ratio: "16:9",
        autoplay_enabled: true,
        allow_print_download: true,
        allow_client_upload: true,
        require_payment_before_download: false,
        always_enable_sorting: false,
        enable_matterport_default_expiry: true,
        matterport_default_expiry_days: 90,
        matterport_renewal_plans: defaultRenewalPlans,
        matterport_auto_invoice_enabled: true,
        matterport_auto_invoice_days: 14,
        matterport_reminder_intervals: [30, 14, 7, 1],
        floorplan_names: DEFAULT_FLOORPLAN_NAMES,
    });


    const transitionOptions = [
        { label: 'Ken Burns', value: 'kenburns' },
        { label: 'Fade In', value: 'fade-in' },
        { label: 'Slide Right-Left', value: 'slide-right-left' },
        { label: 'Slide Left-Right', value: 'slide-left-right' },
        { label: 'Slide Top-Bottom', value: 'slide-top-bottom' },
        { label: 'Slide Bottom-Top', value: 'slide-bottom-top' },
        { label: 'Reveal Left-Right', value: 'reveal-left-right' },
        { label: 'Rotate Bottom-Left', value: 'rotate-bottom-left' },
        { label: 'Rotate Bottom-Right', value: 'rotate-bottom-right' },
        { label: 'Rotate Left-Bottom', value: 'rotate-left-bottom' },
        { label: 'Rotate Left-Top', value: 'rotate-left-top' },
        { label: 'Fade Move Left', value: 'fade-move-left' },
        { label: 'Fade Move Right', value: 'fade-move-right' },
        { label: 'Fade Across Right', value: 'fade-across-right' },
        { label: 'Fade Across Left', value: 'fade-across-left' },
        { label: 'Zoom Fast', value: 'zoom-fast' },
        { label: 'Zoom Slow', value: 'zoom-slow' },
    ];



    const fetchMediaSettings = async () => {
        try {
            const mediaData = await GetMediaSettings();

            if (mediaData && mediaData.value) {
                const mediaSettings = mediaData.value;
                if (mediaSettings.photos) setPhotoSizes(mediaSettings.photos);
                if (mediaSettings.videos) setVideoSizes(mediaSettings.videos);
                // Note: tour_defaults might still be in media_settings for legacy reasons, 
                // but we prefer the dedicated GetTourDefaultSettings call below.
            }

            const tourDefaultData = await GetTourDefaultSettings();
            if (tourDefaultData && tourDefaultData.value) {
                setTourDefaults(prev => ({
                    ...prev,
                    ...tourDefaultData.value,
                    floorplan_names: Array.isArray(tourDefaultData.value.floorplan_names) && tourDefaultData.value.floorplan_names.length > 0
                        ? tourDefaultData.value.floorplan_names
                        : (Array.isArray(prev.floorplan_names) && prev.floorplan_names.length > 0 ? prev.floorplan_names : DEFAULT_FLOORPLAN_NAMES),
                    global_floorplan_names: Array.isArray(tourDefaultData.value.global_floorplan_names) && tourDefaultData.value.global_floorplan_names.length > 0
                        ? tourDefaultData.value.global_floorplan_names
                        : DEFAULT_FLOORPLAN_NAMES,
                    is_custom_floorplans: Boolean(tourDefaultData.value.is_custom_floorplans),
                }));
            }

        } catch (error) {
            console.error('Failed to fetch settings:', error);
        }
    };

    const [orgAudios, setOrgAudios] = useState<AgentAudio[]>([]);

    const fetchOrgAudios = async () => {
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            if (userInfoStr) {
                const userInfo = JSON.parse(userInfoStr);
                const orgUuid = userInfo?.organization?.uuid || userInfo?.data?.organization?.uuid || userInfo?.data?.uuid || userInfo?.organization_uuid;
                if (orgUuid) {
                    const res = await GetOrganizationAudios(orgUuid);
                    if (res && res.data) {
                        setOrgAudios(Array.isArray(res.data) ? res.data : []);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch org audios:', error);
        }
    };

    useEffect(() => {
        fetchMediaSettings();
        fetchOrgAudios();
    }, []);

    React.useImperativeHandle(ref, () => ({
        save: handleSaveMediaSettings,
    }));

    const handleVideoSizeChange = (type: keyof VideoSizesType, dimension: keyof SizeType, value: number) => {
        setVideoSizes(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [dimension]: value
            }
        }));
    };

    const handlePhotoSizeChange = (type: keyof PhotoSizesType, dimension: keyof SizeType, value: number) => {
        setPhotoSizes(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [dimension]: value
            }
        }));
    };
    const handleTourDefaultChange = (key: keyof TourDefaultsType, value: any) => {
        setTourDefaults(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const toggleTransition = (effect: string) => {
        setTourDefaults(prev => {
            const current = prev.transition_effect || [];
            if (current.includes(effect)) {
                return { ...prev, transition_effect: current.filter(e => e !== effect) };
            } else {
                return { ...prev, transition_effect: [...current, effect] };
            }
        });
    };

    const handleAddFloorplanName = () => {
        const trimmed = newFloorplanName.trim();
        if (!trimmed) {
            toast.error("Please enter a floorplan name");
            return;
        }
        const currentList = tourDefaults.floorplan_names || [];
        if (currentList.some(name => name.toLowerCase() === trimmed.toLowerCase())) {
            toast.error("A floorplan with this name already exists");
            return;
        }
        setTourDefaults(prev => ({
            ...prev,
            floorplan_names: [...(prev.floorplan_names || []), trimmed],
            is_custom_floorplans: true,
        }));
        setNewFloorplanName("");
        toast.success(`Added "${trimmed}" to floorplan names`);
    };

    const handleDeleteFloorplanName = (indexToRemove: number) => {
        const currentList = tourDefaults.floorplan_names || [];
        const removedItem = currentList[indexToRemove];
        setTourDefaults(prev => ({
            ...prev,
            floorplan_names: (prev.floorplan_names || []).filter((_, idx) => idx !== indexToRemove),
            is_custom_floorplans: true,
        }));
        if (removedItem) {
            toast.info(`Removed "${removedItem}"`);
        }
    };

    const handleMoveFloorplanName = (index: number, direction: 'up' | 'down') => {
        const currentList = [...(tourDefaults.floorplan_names || [])];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= currentList.length) return;
        const temp = currentList[index];
        currentList[index] = currentList[targetIndex];
        currentList[targetIndex] = temp;
        setTourDefaults(prev => ({
            ...prev,
            floorplan_names: currentList,
            is_custom_floorplans: true,
        }));
    };

    const handleStartEditFloorplanName = (index: number, currentName: string) => {
        setEditingFloorplanIndex(index);
        setEditingFloorplanValue(currentName);
    };

    const handleCancelEditFloorplanName = () => {
        setEditingFloorplanIndex(null);
        setEditingFloorplanValue("");
    };

    const handleSaveEditFloorplanName = (index: number) => {
        const trimmed = editingFloorplanValue.trim();
        if (!trimmed) {
            toast.error("Floor plan name cannot be empty");
            return;
        }
        const currentList = tourDefaults.floorplan_names || [];
        const isDuplicate = currentList.some((name, i) => i !== index && name.toLowerCase() === trimmed.toLowerCase());
        if (isDuplicate) {
            toast.error("A floorplan with this name already exists");
            return;
        }
        const updatedList = [...currentList];
        updatedList[index] = trimmed;
        setTourDefaults(prev => ({
            ...prev,
            floorplan_names: updatedList,
            is_custom_floorplans: true,
        }));
        setEditingFloorplanIndex(null);
        setEditingFloorplanValue("");
        toast.success(`Updated floor plan name to "${trimmed}"`);
    };

    const handleFloorplanDragStart = (index: number) => {
        dragFloorplanRowIndex.current = index;
    };

    const handleFloorplanDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragOverFloorplanIndex !== index) {
            setDragOverFloorplanIndex(index);
        }
    };

    const handleFloorplanDrop = (dropIndex: number) => {
        const fromIndex = dragFloorplanRowIndex.current;
        if (fromIndex === null || fromIndex === dropIndex) {
            setDragOverFloorplanIndex(null);
            dragFloorplanRowIndex.current = null;
            return;
        }
        const currentList = [...(tourDefaults.floorplan_names || [])];
        const [moved] = currentList.splice(fromIndex, 1);
        currentList.splice(dropIndex, 0, moved);
        setTourDefaults(prev => ({
            ...prev,
            floorplan_names: currentList,
            is_custom_floorplans: true,
        }));
        setDragOverFloorplanIndex(null);
        dragFloorplanRowIndex.current = null;
    };

    const handleFloorplanDragEnd = () => {
        setDragOverFloorplanIndex(null);
        dragFloorplanRowIndex.current = null;
    };

    const handleResetFloorplanNames = () => {
        const defaultNames = tourDefaults.global_floorplan_names && tourDefaults.global_floorplan_names.length > 0
            ? tourDefaults.global_floorplan_names
            : DEFAULT_FLOORPLAN_NAMES;
        setTourDefaults(prev => ({
            ...prev,
            floorplan_names: defaultNames,
            is_custom_floorplans: false,
        }));
        toast.success("Reset floorplan names to platform defaults. Click Save to apply.");
    };

    const handleSaveMediaSettings = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            toast.error('Please login to save settings');
            return;
        }

        try {
            // Save photo and video sizes
            await CreateMediaSettings({
                photos: photoSizes,
                videos: videoSizes
            });

            // Save tour defaults separately
            await SaveTourDefaultSettings(tourDefaults);

            toast.success('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings. Please try again.');
        }
    };




    return (
        <div className="w-full">
            <Accordion
                type="multiple"
                defaultValue={["tour", "defaults", "floorplans", "size"]}
                className="w-full space-y-4 "
            >

                <AccordionItem value="defaults" className="border-none">
                    <AccordionTrigger
                        className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] ${userType === "admin"
                            ? "[&>svg]:text-[#4290E9]"
                            : "[&>svg]:text-[#6BAE41]"
                            }  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                    >
                        <div
                            className="flex items-center justify-between w-full"
                        >
                            <p>TOUR GLOBAL DEFAULTS</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="w-full pb-0 font-alexandria">
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            {/* Left Column */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[#666666] font-semibold">Background Music</Label>
                                    <Switch
                                        checked={tourDefaults.music_enabled}
                                        onCheckedChange={(val) => handleTourDefaultChange('music_enabled', val)}
                                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[#666666] font-semibold">Default Audio</Label>
                                    <Select
                                        value={tourDefaults.default_audio_uuid || tourDefaults.default_song || ""}
                                        onValueChange={(val) => {
                                            const selectedAudio = orgAudios.find(a => a.uuid === val);
                                            setTourDefaults(prev => ({
                                                ...prev,
                                                default_audio_uuid: val,
                                                default_song: selectedAudio ? selectedAudio.name : val
                                            }));
                                        }}
                                    >
                                        <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[#BBBBBB]">
                                            <SelectValue placeholder={orgAudios.length > 0 ? "Select Audio" : "No audio files uploaded"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {orgAudios.length > 0 ? (
                                                orgAudios.map(audio => (
                                                    <SelectItem key={audio.uuid} value={audio.uuid}>{audio.name}</SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="none" disabled>No audio files found</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[#666666] font-semibold">Media Transition Effects</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <div className="w-full min-h-[42px] p-2 bg-[#EEEEEE] border border-[#BBBBBB] rounded-md cursor-pointer flex flex-wrap gap-1 items-center">
                                                {tourDefaults.transition_effect.length > 0 ? (
                                                    tourDefaults.transition_effect.map(effect => (
                                                        <Badge key={effect} variant="secondary" className="bg-white border-[#BBBBBB] text-[#666666] font-normal">
                                                            {transitionOptions.find(opt => opt.value === effect)?.label || effect}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 text-sm">Select Transitions</span>
                                                )}
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0" align="start">
                                            <div className="max-h-[300px] overflow-y-auto p-4 space-y-4">
                                                {transitionOptions.map((opt) => (
                                                    <div key={opt.value} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`transition-${opt.value}`}
                                                            checked={tourDefaults.transition_effect.includes(opt.value)}
                                                            onCheckedChange={() => toggleTransition(opt.value)}
                                                        />
                                                        <label
                                                            htmlFor={`transition-${opt.value}`}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                        >
                                                            {opt.label}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[#666666] font-semibold">Tour Layout Options</Label>
                                    <Select
                                        value={tourDefaults.layout_option}
                                        onValueChange={(val) => handleTourDefaultChange('layout_option', val)}
                                    >
                                        <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[#BBBBBB]">
                                            <SelectValue placeholder="Select Layout" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="standard">Standard</SelectItem>
                                            <SelectItem value="modern">Modern</SelectItem>
                                            <SelectItem value="minimalist">Minimalist</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="text-[#666666] font-semibold">Video Slideshow Mode</Label>
                                    <Switch
                                        checked={tourDefaults.video_slideshow_enabled}
                                        onCheckedChange={(val) => handleTourDefaultChange('video_slideshow_enabled', val)}
                                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="text-[#666666] font-semibold">Letterbox Correction</Label>
                                    <Switch
                                        checked={tourDefaults.letterbox_correction}
                                        onCheckedChange={(val) => handleTourDefaultChange('letterbox_correction', val)}
                                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                    />
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[#666666] font-semibold">Image Aspect Ratio</Label>
                                    <Select
                                        value={tourDefaults.aspect_ratio}
                                        onValueChange={(val) => handleTourDefaultChange('aspect_ratio', val)}
                                    >
                                        <SelectTrigger className="w-full h-[42px] bg-[#EEEEEE] border-[#BBBBBB]">
                                            <SelectValue placeholder="Select Ratio" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="16:9">16:9</SelectItem>
                                            <SelectItem value="4:3">4:3</SelectItem>
                                            <SelectItem value="3:2">3:2</SelectItem>
                                            <SelectItem value="1:1">1:1</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="text-[#666666] font-semibold">Autoplay Tour</Label>
                                    <Switch
                                        checked={tourDefaults.autoplay_enabled}
                                        onCheckedChange={(val) => handleTourDefaultChange('autoplay_enabled', val)}
                                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="text-[#666666] font-semibold">Allow Print Quality Downloads</Label>
                                    <Switch
                                        checked={tourDefaults.allow_print_download}
                                        onCheckedChange={(val) => handleTourDefaultChange('allow_print_download', val)}
                                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="text-[#666666] font-semibold">Allow Clients to Upload Media</Label>
                                    <Switch
                                        checked={tourDefaults.allow_client_upload}
                                        onCheckedChange={(val) => handleTourDefaultChange('allow_client_upload', val)}
                                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="text-[#666666] font-semibold">Require Payment Before Download</Label>
                                    <Switch
                                        checked={tourDefaults.require_payment_before_download}
                                        onCheckedChange={(val) => handleTourDefaultChange('require_payment_before_download', val)}
                                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-[#666666] font-semibold">Always Open Media Sorting</Label>
                                        <p className="text-[12px] text-gray-500">Enable direct drag-and-drop sorting without clicking the Sort button first</p>
                                    </div>
                                    <Switch
                                        checked={tourDefaults.always_enable_sorting ?? false}
                                        onCheckedChange={(val) => handleTourDefaultChange('always_enable_sorting', val)}
                                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                    />
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[#666666] font-semibold">Enable Matterport Default Expiry</Label>
                                        <Switch
                                            checked={!!tourDefaults.enable_matterport_default_expiry}
                                            onCheckedChange={(val) => handleTourDefaultChange('enable_matterport_default_expiry', val)}
                                            className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                        />
                                    </div>
                                    
                                    {tourDefaults.enable_matterport_default_expiry && (
                                        <div className="space-y-4 pt-2 border-t border-gray-200">
                                            <div className="space-y-2">
                                                <Label className="text-[#666666] font-semibold">Initial Free Hosting Period (Days)</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={tourDefaults.matterport_default_expiry_days || 90}
                                                    onChange={(e) => handleTourDefaultChange('matterport_default_expiry_days', parseInt(e.target.value) || 0)}
                                                    className="w-full h-[42px] bg-[#EEEEEE] border-[#BBBBBB]"
                                                />
                                            </div>

                                            {/* Renewal Pricing Tiers */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Label className="text-[#666666] font-semibold">Matterport Renewal Plans (Pricing Tiers)</Label>
                                                        <p className="text-[11px] text-gray-500">Configure hosting extension plans available for agents and admins</p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const current = tourDefaults.matterport_renewal_plans || defaultRenewalPlans;
                                                            const nextId = `plan_${Date.now()}`;
                                                            handleTourDefaultChange('matterport_renewal_plans', [
                                                                ...current,
                                                                { id: nextId, unit: "days", days: 30, months: 1, label: "30 Days Extension", price: 25 }
                                                            ]);
                                                        }}
                                                        className="text-xs h-7 border-[#4290E9] text-[#4290E9] hover:bg-blue-50"
                                                    >
                                                        + Add Renewal Plan
                                                    </Button>
                                                </div>
                                                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                                                    {(tourDefaults.matterport_renewal_plans || defaultRenewalPlans).map((plan, idx) => {
                                                        const currentUnit = plan.unit || (plan.days && !plan.months ? "days" : "months");
                                                        const durationValue = currentUnit === "days" ? (plan.days || 30) : (plan.months || 1);

                                                        return (
                                                            <div key={plan.id || idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                                                                {/* Plan Label */}
                                                                <div className="flex-1 min-w-[140px]">
                                                                    <Input
                                                                        type="text"
                                                                        placeholder="Label (e.g. 60 Days Extension)"
                                                                        value={plan.label}
                                                                        onChange={(e) => {
                                                                            const updated = [...(tourDefaults.matterport_renewal_plans || defaultRenewalPlans)];
                                                                            updated[idx] = { ...updated[idx], label: e.target.value };
                                                                            handleTourDefaultChange('matterport_renewal_plans', updated);
                                                                        }}
                                                                        className="h-9 text-xs bg-white"
                                                                    />
                                                                </div>

                                                                {/* Duration Unit Selector */}
                                                                <div className="w-24">
                                                                    <Select
                                                                        value={currentUnit}
                                                                        onValueChange={(val: "days" | "months") => {
                                                                            const updated = [...(tourDefaults.matterport_renewal_plans || defaultRenewalPlans)];
                                                                            const newDays = val === "days" ? (plan.days || (plan.months ? plan.months * 30 : 30)) : undefined;
                                                                            const newMonths = val === "months" ? (plan.months || (plan.days ? Math.round(plan.days / 30) : 1)) : undefined;
                                                                            updated[idx] = {
                                                                                ...updated[idx],
                                                                                unit: val,
                                                                                days: newDays,
                                                                                months: newMonths,
                                                                            };
                                                                            handleTourDefaultChange('matterport_renewal_plans', updated);
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="h-9 text-xs bg-white">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="days">Days</SelectItem>
                                                                            <SelectItem value="months">Months</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>

                                                                {/* Duration Number */}
                                                                <div className="w-24 flex items-center gap-1">
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        placeholder={currentUnit === "days" ? "Days" : "Months"}
                                                                        value={durationValue}
                                                                        onChange={(e) => {
                                                                            const val = parseInt(e.target.value) || 1;
                                                                            const updated = [...(tourDefaults.matterport_renewal_plans || defaultRenewalPlans)];
                                                                            if (currentUnit === "days") {
                                                                                updated[idx] = {
                                                                                    ...updated[idx],
                                                                                    unit: "days",
                                                                                    days: val,
                                                                                    months: Math.max(1, Math.round(val / 30)),
                                                                                };
                                                                            } else {
                                                                                updated[idx] = {
                                                                                    ...updated[idx],
                                                                                    unit: "months",
                                                                                    months: val,
                                                                                    days: val * 30,
                                                                                };
                                                                            }
                                                                            handleTourDefaultChange('matterport_renewal_plans', updated);
                                                                        }}
                                                                        className="h-9 text-xs bg-white text-center"
                                                                    />
                                                                    <span className="text-[11px] text-gray-500 shrink-0">
                                                                        {currentUnit === "days" ? "d" : "mo"}
                                                                    </span>
                                                                </div>

                                                                {/* Price CAD */}
                                                                <div className="w-28 flex items-center gap-1">
                                                                    <span className="text-xs text-gray-500 font-medium">$</span>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        placeholder="CAD"
                                                                        value={plan.price}
                                                                        onChange={(e) => {
                                                                            const updated = [...(tourDefaults.matterport_renewal_plans || defaultRenewalPlans)];
                                                                            updated[idx] = { ...updated[idx], price: parseFloat(e.target.value) || 0 };
                                                                            handleTourDefaultChange('matterport_renewal_plans', updated);
                                                                        }}
                                                                        className="h-9 text-xs bg-white"
                                                                    />
                                                                    <span className="text-[10px] text-gray-400 shrink-0">CAD</span>
                                                                </div>

                                                                {/* Remove Plan */}
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const updated = (tourDefaults.matterport_renewal_plans || defaultRenewalPlans).filter((_, i) => i !== idx);
                                                                        handleTourDefaultChange('matterport_renewal_plans', updated);
                                                                    }}
                                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                                                    title="Remove Plan"
                                                                >
                                                                    ✕
                                                                </Button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Auto-Draft Invoicing */}
                                            <div className="space-y-3 pt-2 border-t border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[#666666] font-semibold">Auto-Generate Draft Renewal Invoice</Label>
                                                    <Switch
                                                        checked={tourDefaults.matterport_auto_invoice_enabled ?? true}
                                                        onCheckedChange={(val) => handleTourDefaultChange('matterport_auto_invoice_enabled', val)}
                                                        className="data-[state=unchecked]:bg-[#E06D5E] data-[state=checked]:bg-[#6BAE41]"
                                                    />
                                                </div>
                                                {(tourDefaults.matterport_auto_invoice_enabled ?? true) && (
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-gray-500">Days Before Expiry to Generate Draft Invoice</Label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            max="60"
                                                            value={tourDefaults.matterport_auto_invoice_days || 14}
                                                            onChange={(e) => handleTourDefaultChange('matterport_auto_invoice_days', parseInt(e.target.value) || 14)}
                                                            className="w-full h-[38px] bg-[#EEEEEE] border-[#BBBBBB] text-xs"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="floorplans" className="border-none">
                    <AccordionTrigger
                        className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] ${userType === "admin"
                            ? "[&>svg]:text-[#4290E9]"
                            : "[&>svg]:text-[#6BAE41]"
                            } [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                    >
                        <div className="flex items-center justify-between w-full">
                            <p>FLOORPLANS</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="w-full pb-6 font-alexandria">
                        <div className="p-6 space-y-6">
                            {/* Header row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-[16px] font-[600] text-gray-800">Default Floorplan Names</h3>
                                        {tourDefaults.is_custom_floorplans ? (
                                            <Badge variant="outline" className="border-blue-400 text-blue-600 bg-blue-50 text-[12px] font-medium px-2.5 py-0.5 rounded-full">
                                                Organization Custom Names
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="border-gray-300 text-gray-600 bg-gray-50 text-[12px] font-medium px-2.5 py-0.5 rounded-full">
                                                Using Platform Defaults
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-[13px] text-gray-500">
                                        Configure the default names for floorplans uploaded to orders in your organization. These options will appear as suggestions in dropdowns during upload and file renaming, while still allowing custom names.
                                    </p>
                                </div>
                                {tourDefaults.is_custom_floorplans && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleResetFloorplanNames}
                                        className="text-xs h-9 px-3 text-gray-700 hover:text-gray-900 border-gray-300 hover:bg-gray-100 flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Reset to Platform Defaults
                                    </Button>
                                )}
                            </div>

                            {/* Add new floorplan name bar */}
                            <div className="bg-[#F8F9FA] p-4 rounded-[8px] border border-[#E0E0E0]">
                                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">
                                    Add New Floorplan Name
                                </Label>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                    <Input
                                        type="text"
                                        placeholder="Enter floor plan name (e.g., Main Floor, Upper Level, Basement Suite)"
                                        value={newFloorplanName}
                                        onChange={(e) => setNewFloorplanName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddFloorplanName();
                                            }
                                        }}
                                        className="h-[42px] flex-1 bg-white border-[#BBBBBB] text-sm focus:border-[#4290E9]"
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleAddFloorplanName}
                                        className={`h-[42px] px-6 ${userType === 'admin' ? 'bg-[#4290E9] hover:bg-[#327acc]' : 'bg-[#6BAE41] hover:bg-[#5a9636]'} text-white text-sm font-medium flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-xs`}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Name
                                    </Button>
                                </div>
                            </div>

                            {/* Full-width list showing complete names without truncation */}
                            <div className="border border-[#E0E0E0] rounded-[8px] overflow-hidden bg-white shadow-xs">
                                <div className="bg-[#F2F4F7] px-5 py-3 border-b border-[#E0E0E0] flex items-center justify-between text-xs font-semibold text-[#555555] uppercase tracking-wider">
                                    <div className="flex items-center gap-4">
                                        <span className="w-6"></span>
                                        <span className="w-8 text-center">#</span>
                                        <span>Floor Plan Name</span>
                                    </div>
                                    <div className="pr-4">Actions</div>
                                </div>

                                <div className="divide-y divide-[#EEEEEE]">
                                    {(!tourDefaults.floorplan_names || tourDefaults.floorplan_names.length === 0) ? (
                                        <div className="p-8 text-center text-sm text-gray-400">
                                            No default floorplan names configured. Add one above.
                                        </div>
                                    ) : (
                                        tourDefaults.floorplan_names.map((name, index) => (
                                            <div
                                                key={`${name}-${index}`}
                                                draggable={editingFloorplanIndex === null}
                                                onDragStart={() => handleFloorplanDragStart(index)}
                                                onDragOver={(e) => handleFloorplanDragOver(e, index)}
                                                onDrop={() => handleFloorplanDrop(index)}
                                                onDragEnd={handleFloorplanDragEnd}
                                                style={
                                                    dragOverFloorplanIndex === index && dragFloorplanRowIndex.current !== index
                                                        ? { borderTop: "2px solid #4290E9", background: "rgba(66,144,233,0.05)" }
                                                        : {}
                                                }
                                                className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50/80 transition-colors"
                                            >
                                                <div className="flex items-center gap-4 min-w-0 flex-1 pr-4">
                                                    {/* 6-dot pan grab handle matching services screen */}
                                                    <div
                                                        className="flex items-center justify-center w-[24px] h-[24px] text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing select-none shrink-0"
                                                        title="Drag to reorder"
                                                    >
                                                        <svg
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 16 16"
                                                            fill="currentColor"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <circle cx="5.5" cy="3" r="1.25" />
                                                            <circle cx="10.5" cy="3" r="1.25" />
                                                            <circle cx="5.5" cy="8" r="1.25" />
                                                            <circle cx="10.5" cy="8" r="1.25" />
                                                            <circle cx="5.5" cy="13" r="1.25" />
                                                            <circle cx="10.5" cy="13" r="1.25" />
                                                        </svg>
                                                    </div>
                                                    <span className="w-8 text-center text-xs font-semibold text-gray-400 shrink-0">
                                                        {index + 1}
                                                    </span>
                                                    {editingFloorplanIndex === index ? (
                                                        <div className="flex items-center gap-2 flex-1 max-w-md">
                                                            <Input
                                                                autoFocus
                                                                value={editingFloorplanValue}
                                                                onChange={(e) => setEditingFloorplanValue(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        handleSaveEditFloorplanName(index);
                                                                    } else if (e.key === 'Escape') {
                                                                        e.preventDefault();
                                                                        handleCancelEditFloorplanName();
                                                                    }
                                                                }}
                                                                className="h-[34px] text-sm bg-white border-[#4290E9] focus:border-[#4290E9]"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSaveEditFloorplanName(index)}
                                                                className="p-1.5 rounded text-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer transition-colors"
                                                                title="Save name"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={handleCancelEditFloorplanName}
                                                                className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
                                                                title="Cancel edit"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm font-medium text-gray-900 break-words whitespace-normal leading-relaxed">
                                                            {name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {editingFloorplanIndex !== index && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStartEditFloorplanName(index, name)}
                                                            className="p-1.5 rounded text-gray-400 hover:text-[#4290E9] hover:bg-blue-50 cursor-pointer transition-colors"
                                                            title="Edit floor plan name"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveFloorplanName(index, 'up')}
                                                        disabled={index === 0}
                                                        className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                                        title="Move up"
                                                    >
                                                        <ChevronUp className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveFloorplanName(index, 'down')}
                                                        disabled={index === (tourDefaults.floorplan_names || []).length - 1}
                                                        className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                                        title="Move down"
                                                    >
                                                        <ChevronDown className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteFloorplanName(index)}
                                                        className="p-1.5 rounded text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer ml-1 transition-colors"
                                                        title="Delete floorplan name"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="size" className="border-none">
                    <AccordionTrigger
                        className={`px-[14px] py-[19px] border-t-[1px] border-b-[1px] border-[#BBBBBB] h-[60px] bg-[#E4E4E4] ${userType}-text text-[18px] font-[600] ${userType === "admin"
                            ? "[&>svg]:text-[#4290E9]"
                            : "[&>svg]:text-[#6BAE41]"
                            }  [&>svg]:w-6 [&>svg]:h-6  [&>svg]:stroke-[2] [&>svg]:stroke-current`}
                    >
                        <div
                            className="flex items-center justify-between w-full"
                        >
                            <p>FILE SIZE OPTIONS</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="w-full pb-0 font-alexandria">
                        <div className="mb-6">
                            <h3 className="text-[14px] text-[#666666] font-[700] mb-3 px-4 h-[54px] bg-[#E4E4E4] flex items-center">PHOTOS</h3>
                            <div className="w-full flex justify-center ">
                                <div className="w-[500px] grid grid-cols-1 gap-4 px-4">
                                    {Object.entries(photoSizes).map(([key, size]) => (
                                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                            <span className="text-[#666666] min-w-[120px]">
                                                {key === 'mls' ? 'MLS' : key.charAt(0).toUpperCase() + key.slice(1)} Photo Slips:
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={size.width}
                                                        onChange={(e) => handlePhotoSizeChange(key as keyof PhotoSizesType, 'width', parseInt(e.target.value) || 0)}
                                                        className='h-[42px] w-[120px] text-[#666666] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                                    />
                                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">px</span>
                                                </div>
                                                <span className="text-gray-500">X</span>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={size.height}
                                                        onChange={(e) => handlePhotoSizeChange(key as keyof PhotoSizesType, 'height', parseInt(e.target.value) || 0)}
                                                        className='h-[42px] w-[120px] text-[#666666] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                                    />
                                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">px</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Video resize settings hidden */}
                        {false && (
<div className="mb-6">
                            <h3 className="text-[14px] text-[#666666] font-[700] mb-3 px-4 h-[54px] bg-[#E4E4E4] flex items-center">VIDEO</h3>
                            <div className="w-full flex justify-center ">
                                <div className="w-[500px] grid grid-cols-1 gap-4 px-4">
                                    {Object.entries(videoSizes).map(([key, size]) => (
                                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                            <span className="capitalize text-[#666666] min-w-[120px]">
                                                {key === 'mls' ? 'MLS' : key.charAt(0).toUpperCase() + key.slice(1)} Video Size:
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={size.width}
                                                        onChange={(e) => handleVideoSizeChange(key as keyof VideoSizesType, 'width', parseInt(e.target.value) || 0)}
                                                        className='h-[42px] w-[120px] text-[#666666] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                                    />
                                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">px</span>
                                                </div>
                                                <span className="text-gray-500">X</span>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={size.height}
                                                        onChange={(e) => handleVideoSizeChange(key as keyof VideoSizesType, 'height', parseInt(e.target.value) || 0)}
                                                        className='h-[42px] w-[120px] text-[#666666] bg-[#EEEEEE] border-[1px] border-[#BBBBBB] mt-[12px]'
                                                    />
                                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">px</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
});
GlobalTourSetting.displayName = "GlobalTourSetting";

export default GlobalTourSetting;